import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { OpenAI } from 'openai';
import { logger } from '@/lib/logger';
import { saveJob, Job } from '@/lib/storage';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { url, title, description } = await request.json();
    const jobId = nanoid();

    logger.info('Creating analysis job', { jobId, url, title });

    const job: Job = {
      id: jobId,
      url,
      title,
      description,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await saveJob(job);

    // Queue the job for processing
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/analyze/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId })
    }).catch(error => logger.error('Failed to queue job processing', { jobId, error }));

    return Response.json({
      jobId,
      trackingUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/status/${jobId}`
    });

  } catch (error) {
    logger.error('Failed to create analysis job', { error });
    return Response.json({ error: 'Failed to create analysis job' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return Response.json({ error: 'Missing jobId parameter' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('analysis_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      logger.error('Failed to get report', { error });
      throw error;
    }

    if (!data) {
      logger.warn('Report not found', { jobId });
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    return Response.json(data);

  } catch (error) {
    logger.error('Failed to get report', { error });
    return Response.json(
      { error: 'Failed to get report' }, 
      { status: 500 }
    );
  }
}
