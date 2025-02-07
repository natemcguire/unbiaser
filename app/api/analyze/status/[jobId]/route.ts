import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;
    logger.info('Getting job status', { jobId });

    const { data: job } = await supabase
      .from('analysis_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (job) {
      // Add cache control headers
      return new Response(JSON.stringify(job), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
    } else {
      logger.error('Job not found');
      return Response.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    logger.error('Failed to get job status', { error });
    return Response.json(
      { error: 'Failed to get job status' },
      { status: 500 }
    );
  }
} 