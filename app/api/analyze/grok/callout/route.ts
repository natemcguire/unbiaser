import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Correct Grok API endpoint from docs
const GROK_API_URL = process.env.GROK_API_URL!;

export async function POST(request: NextRequest) {
  try {
    const { content, bias, jobId } = await request.json();

    // Create system prompt with bias values
    const systemPrompt = `You are a media literacy expert analyzing article bias and context.
Format your response as a JSON object with this exact structure:

{
  "title": "Analysis of Bias and Context in the Article on [Topic]",
  "sections": {
    "hiddenAssumptions": [
      "List key assumptions made by the article"
    ],
    "missingContext": [
      "List important missing context"
    ],
    "loadedLanguage": [
      "Identify and analyze loaded/emotional language"
    ],
    "historicalParallels": [
      "Note any relevant historical context or missing historical references"
    ],
    "factOpinionSeparation": [
      "Analyze how well the article separates facts from opinions"
    ]
  },
  "biasMetrics": {
    "political": {
      "score": ${bias.biasX},
      "explanation": "Explain political bias score"
    },
    "emotional": {
      "score": ${bias.biasY},
      "explanation": "Explain emotional tone score"
    }
  },
  "conclusion": "2-3 sentence summary of the overall analysis"
}`;

    // Check for existing analysis
    const { data: existingAnalysis } = await supabase
      .from('grok_analyses')
      .select('analysis')
      .eq('job_id', jobId)
      .eq('status', 'completed')
      .single();

    if (existingAnalysis?.analysis) {
      return Response.json({ analysis: existingAnalysis.analysis });
    }

    // Create new analysis record
    const analysisId = nanoid();
    await supabase
      .from('grok_analyses')
      .insert({
        id: analysisId,
        job_id: jobId,
        content,
        bias_x: bias.biasX,
        bias_y: bias.biasY,
        status: 'processing'
      });

    try {
      const response = await fetch(GROK_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "grok-2-latest",
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content
            }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status}`);
      }

      const grokResponse = await response.json();
      const analysis = grokResponse.choices[0].message.content;
      
      await supabase
        .from('grok_analyses')
        .update({ 
          analysis,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', analysisId);

      return Response.json({ analysis });

    } catch (error) {
      await supabase
        .from('grok_analyses')
        .update({ 
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', analysisId);

      throw error;
    }

  } catch (error) {
    logger.error('Analysis failed', { error });
    return Response.json({ 
      error: error instanceof Error ? error.message : 'Analysis failed' 
    }, { status: 500 });
  }
} 