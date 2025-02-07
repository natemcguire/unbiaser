import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
  });
}

// Add this function to check and resume interrupted jobs
async function resumeInterruptedJob(url: string): Promise<string | null> {
  try {
    // Look for an existing job for this URL that's pending or processing
    const { data: existingJob } = await supabase
      .from('analysis_jobs')
      .select('id, status, created_at, title')
      .eq('url', url)
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingJob) {
      logger.info('Found interrupted job', { jobId: existingJob.id });
      
      // Resume processing
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const host = request.headers.get('host') || 'localhost:3000';
      const baseUrl = `${protocol}://${host}`;

      await fetch(`${baseUrl}/api/analyze/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: existingJob.id })
      });

      return existingJob.id;
    }

    return null;
  } catch (error) {
    logger.error('Failed to check for interrupted jobs', { error });
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, title, html } = await request.json();

    if (!url || !html) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for interrupted job first
    const existingJobId = await resumeInterruptedJob(url);
    if (existingJobId) {
      return Response.json({ jobId: existingJobId });
    }

    // Create new job if no interrupted job found
    const jobId = nanoid();
    const { error: insertError } = await supabase
      .from('analysis_jobs')
      .insert({
        id: jobId,
        url,
        title,
        source_html: html,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      logger.error('Failed to create job', { error: insertError });
      throw insertError;
    }

    // Get base URL from request
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    // Start processing with absolute URL
    const processResponse = await fetch(`${baseUrl}/api/analyze/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId })
    });

    if (!processResponse.ok) {
      throw new Error('Failed to start processing');
    }

    return Response.json({ jobId });

  } catch (error) {
    logger.error('Failed to create job', { error });
    return Response.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
} 