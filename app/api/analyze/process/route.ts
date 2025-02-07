import { NextRequest } from 'next/server';
import { OpenAI } from 'openai';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { logger } from '@/lib/logger';
import { nanoid } from 'nanoid';
import { supabase } from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Create Supabase storage bucket if it doesn't exist
async function ensureStorageBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.find(b => b.name === 'screenshots')) {
    await supabase.storage.createBucket('screenshots', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png']
    });
  }
}

// Add this function to handle cleanup
async function cleanupFailedJob(jobId: string) {
  try {
    // Delete screenshot if it exists
    await supabase.storage
      .from('screenshots')
      .remove([`${jobId}.jpg`]);

    // Delete job from database
    await supabase
      .from('analysis_jobs')
      .delete()
      .eq('id', jobId);

    logger.info('Cleaned up failed job', { jobId });
  } catch (error) {
    logger.error('Failed to cleanup job', { jobId, error });
  }
}

// Add this function near the top with other helpers
async function cleanupStaleJobs() {
  try {
    // Find jobs stuck in processing for more than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: staleJobs } = await supabase
      .from('analysis_jobs')
      .select('id')
      .eq('status', 'processing')
      .lt('updated_at', fiveMinutesAgo);

    if (staleJobs?.length) {
      logger.info('Found stale jobs', { count: staleJobs.length });
      
      // Clean up each stale job
      for (const job of staleJobs) {
        await cleanupFailedJob(job.id);
        logger.info('Cleaned up stale job', { jobId: job.id });
      }
    }
  } catch (error) {
    logger.error('Failed to cleanup stale jobs', { error });
  }
}

// Helper function to create a log entry
async function createLog(jobId: string, level: string, message: string, metadata?: any) {
  await supabase
    .from('analysis_logs')
    .insert({
      job_id: jobId,
      level,
      message,
      metadata
    });
}

export async function POST(request: Request) {
  const { jobId } = await request.json();

  try {
    // Log start of processing
    await createLog(jobId, 'info', 'Starting analysis...');

    // Update status to show we're starting
    await updateJobStatus(jobId, 'processing', 0.1);
    logger.info('Starting analysis process', { jobId });

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('analysis_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      throw new Error('Failed to fetch job');
    }

    // Process screenshot first if it exists
    if (job.screenshot) {
      try {
        // Ensure bucket exists
        const { data: buckets } = await supabase.storage.listBuckets();
        if (!buckets?.find(b => b.name === 'screenshots')) {
          await supabase.storage.createBucket('screenshots', {
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/png']
          });
        }

        // Convert base64 screenshot to buffer
        const base64Data = job.screenshot.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Upload screenshot
        const { error: uploadError } = await supabase.storage
          .from('screenshots')
          .upload(`${jobId}.jpg`, buffer, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          logger.error('Failed to upload screenshot', { error: uploadError, jobId });
          throw uploadError;
        }

        logger.info('Uploaded screenshot', { jobId });

      } catch (error) {
        logger.error('Screenshot processing failed', { error, jobId });
        // Continue with analysis even if screenshot fails
      }
    }

    // Extract content
    await updateJobStatus(jobId, 'processing', 0.2);
    logger.info('Extracting content', { jobId });
    const content = await extractContent(job.source_html);
    
    // Log each major step
    await createLog(jobId, 'info', 'Analyzing content...');

    // Get summary
    await updateJobStatus(jobId, 'processing', 0.4);
    logger.info('Getting summary', { jobId });
    const summary = await getSummary(content, jobId);
    
    // Analyze bias
    await updateJobStatus(jobId, 'processing', 0.6);
    logger.info('Analyzing bias', { jobId });
    const bias = await analyzeBias(summary.summary, summary.keyPoints, jobId);
    
    // Generate alternative
    await updateJobStatus(jobId, 'processing', 0.8);
    logger.info('Generating alternative', { jobId });
    const alternativePromises = await Promise.all([
      generateAlternative(summary.summary, {
        x: bias.biasX,
        y: bias.biasY
      }, jobId),
      generateAlternative(summary.summary, {
        x: -bias.biasX,
        y: -bias.biasY
      }, jobId)
    ]);

    const alternatives = await Promise.all(
      alternativePromises.map(async (promise) => {
        const alternative = await promise;
        return {
          headline: alternative.headline,
          content: alternative.content,
          author: "Eric Arthur Blair",
          sources: alternative.sources,
          bias: alternative.bias
        };
      })
    );

    // Update job with alternatives
    const { error: updateError } = await supabase
      .from('analysis_jobs')
      .update({
        alternatives,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (updateError) {
      logger.error('Failed to update job', { error: updateError, jobId });
      throw updateError;
    }

    logger.info('Analysis complete', { jobId });

    await createLog(jobId, 'info', 'Analysis complete');

    return Response.json({ success: true });

  } catch (error) {
    logger.error('Processing failed', { error, jobId });
    await updateJobStatus(jobId, 'failed', undefined, error.message);
    await createLog(jobId, 'error', 'Analysis failed', { error });
    return Response.json({ error: 'Processing failed' }, { status: 500 });
  }
}

async function updateJobStatus(
  jobId: string, 
  status: string, 
  progress?: number, 
  error?: string
) {
  await supabase
    .from('analysis_jobs')
    .update({
      status,
      progress,
      error,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId);
}

// 1. Extract and analyze content
async function extractContent(html: string) {
  const cheerio = await import('cheerio');
  const $ = cheerio.load(html);
  
  // Remove non-content elements
  $('script, style, noscript, iframe, img, svg, video').remove();
  
  // Get article content
  const article = $('article, [role="article"], .article-content, .post-content, main').first();
  let content = article.length ? article.text() : $('body').text();
  
  // Clean and truncate content
  content = content
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();

  // Limit to ~8K tokens for analysis
  const MAX_CHARS = 32000;
  if (content.length > MAX_CHARS) {
    content = content.slice(0, MAX_CHARS) + '... [content truncated]';
  }

  return content;
}

interface SummaryResponse {
  summary: string;
  keyPoints: string[];
  mainArguments: string[];
}

// 2. Get initial summary and key points
async function getSummary(content: string, jobId: string): Promise<SummaryResponse> {
  logger.info('Getting summary from OpenAI', { contentLength: content.length }, jobId);
  const startTime = Date.now();
  
  try {
    const response = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `Summarize this article's key points and main arguments in a concise way.
Format as JSON:
{
  "summary": "2-3 sentence summary",
  "keyPoints": ["List of main points/claims"],
  "mainArguments": ["List of core arguments made"]
}`
          },
          { role: "user", content }
        ],
        response_format: { type: "json_object" }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI timeout')), 60000)
      )
    ]);

    logger.info('Received summary from OpenAI', {
      duration: Date.now() - startTime,
      tokens: response.usage,
      model: response.model
    }, jobId);

    return parseAndValidateResponse(response);
  } catch (error) {
    logger.error('Summary generation failed', { error, jobId });
    throw error;
  }
}

function parseAndValidateResponse(response: any): SummaryResponse {
  const parsed = JSON.parse(response.choices[0].message.content) as SummaryResponse;
  
  // Validate the response has the expected shape
  if (!parsed.summary || !Array.isArray(parsed.keyPoints) || !Array.isArray(parsed.mainArguments)) {
    throw new Error('Invalid response format from OpenAI');
  }

  return parsed;
}

interface BiasResponse {
  biasX: number;
  biasY: number;
  finalScore: number;
  evidence: {
    political: string[];
    emotional: string[];
    omissions: string[];
  }
}

interface AlternativeResponse {
  headline: string;
  content: string;
  sources: string[];
  bias: {
    x: number;
    y: number;
  };
}

// 3. Analyze bias separately
async function analyzeBias(summary: string, keyPoints: string[], jobId: string): Promise<BiasResponse> {
  logger.info('Starting bias analysis', { jobId });
  const startTime = Date.now();

  try {
    const response = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `Analyze the political bias and emotional tone of this article summary and key points.

Return coordinates on two axes:
- **X:** Political bias (**-100 = Far Left** to **+100 = Far Right**)
- **Y:** Emotional tone (**-100 = Objective** to **+100 = Emotional**)

Then, calculate a **final bias score (0-100)** using this formula:
finalScore = 100 - sqrt((biasX^2 + biasY^2) / 2)

- **100 = Perfectly neutral and objective**
- **0 = Extremely biased and emotional**
- **Higher bias (left or right) and stronger emotional tone lower the score**

### **💾 Return JSON Output Only**
{
  "biasX": number,
  "biasY": number,
  "finalScore": number,  // 0-100 scale
  "evidence": {
    "political": ["Examples of bias"],
    "emotional": ["Examples of tone"],
    "omissions": ["Missing context"]
  }
}`
          },
          {
            role: "user",
            content: JSON.stringify({ summary, keyPoints })
          }
        ],
        response_format: { type: "json_object" }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI bias analysis timeout')), 60000)
      )
    ]);

    logger.info('Bias analysis completed', {
      duration: Date.now() - startTime,
      tokens: response.usage,
      model: response.model
    }, jobId);

    const parsed = JSON.parse(response.choices[0].message.content) as BiasResponse;
    
    // Update validation to include finalScore
    if (
      typeof parsed.biasX !== 'number' || 
      typeof parsed.biasY !== 'number' || 
      typeof parsed.finalScore !== 'number' ||
      !parsed.evidence
    ) {
      throw new Error('Invalid bias analysis format from OpenAI');
    }

    return parsed;
  } catch (error) {
    logger.error('Bias analysis failed', { error, jobId });
    throw error;
  }
}

// 4. Generate alternative article separately
async function generateAlternative(
  summary: string, 
  originalBias: { x: number, y: number },
  parentJobId: string
): Promise<AlternativeResponse> {
  logger.info('Generating alternative perspective', { originalBias, jobId: parentJobId });
  
  try {
    // 1. Generate alternative article
    const articleResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `Write an alternative article from the opposite perspective.
If original was left-leaning (negative X), write from right perspective.
If original was right-leaning (positive X), write from left perspective.
Make it more emotionally charged than the original.
Write in a 1950s American journalist style.

Format as JSON:
{
  "headline": "Alternative headline",
  "content": "Alternative article text",
  "sources": ["Supporting sources"]
}`
        },
        {
          role: "user",
          content: JSON.stringify({ 
            summary,
            originalBias: {
              x: originalBias.x,
              y: originalBias.y
            }
          })
        }
      ],
      response_format: { type: "json_object" }
    });

    const article = JSON.parse(articleResponse.choices[0].message.content);

    // 2. Create a new job for bias analysis
    const biasJobId = nanoid();
    await supabase
      .from('analysis_jobs')
      .insert({
        id: biasJobId,
        parent_id: parentJobId,
        status: 'processing',
        type: 'alternative_bias',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    logger.info('Created bias analysis job', { biasJobId, parentJobId });

    // 3. Analyze its bias
    const biasResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `Analyze the political bias and emotional tone of this alternative article.
The original article had bias coordinates: X=${originalBias.x}, Y=${originalBias.y}
Your analysis should show an opposing perspective.

Return coordinates on two axes:
- X: Political bias (-100 = Far Left to +100 = Far Right)
- Y: Emotional tone (-100 = Objective to +100 = Emotional)

Calculate a final bias score (0-100) using this formula:
finalScore = 100 - sqrt((biasX^2 + biasY^2) / 2)

Format as JSON:
{
  "biasX": number,
  "biasY": number,
  "finalScore": number,
  "evidence": {
    "political": ["Evidence of political bias"],
    "emotional": ["Evidence of emotional tone"],
    "omissions": ["Notable omissions or assumptions"]
  }
}`
        },
        {
          role: "user",
          content: article.content
        }
      ],
      response_format: { type: "json_object" }
    });

    const bias = JSON.parse(biasResponse.choices[0].message.content);

    // 4. Update bias job with results
    await supabase
      .from('analysis_jobs')
      .update({ 
        status: 'completed',
        result: {
          bias: {
            biasX: bias.biasX,
            biasY: bias.biasY,
            finalScore: bias.finalScore,
            evidence: bias.evidence
          }
        },
        completed_at: new Date().toISOString()
      })
      .eq('id', biasJobId);

    logger.info('Completed bias analysis job', { biasJobId });

    return {
      headline: article.headline,
      content: article.content,
      author: "Eric Arthur Blair",
      sources: article.sources,
      bias: {
        biasX: bias.biasX,
        biasY: bias.biasY,
        finalScore: bias.finalScore,
        evidence: bias.evidence,
        jobId: biasJobId  // Include the job ID for reference
      }
    };

  } catch (error) {
    logger.error('Alternative generation failed', { error, jobId: parentJobId });
    throw error;
  }
}

function calculateBiasScore(biasX: number, biasY: number): number {
  return Math.round(100 - Math.sqrt((biasX * biasX + biasY * biasY) / 2));
} 