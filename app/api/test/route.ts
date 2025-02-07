import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // First test: just get all jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('analysis_jobs')
      .select('*')
      .limit(1);

    if (jobsError) throw jobsError;

    // Second test: check storage bucket
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) throw bucketsError;

    return Response.json({ 
      success: true,
      database: {
        connected: true,
        jobs: jobs.length
      },
      storage: {
        connected: true,
        buckets: buckets.map(b => b.name)
      },
      message: 'All connections successful'
    });

  } catch (error) {
    console.error('Test failed:', error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 