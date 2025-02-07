import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  const { data: job } = await supabase
    .from('analysis_jobs')
    .select('*')
    .eq('id', params.jobId)
    .single();

  if (!job) {
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(job);
} 