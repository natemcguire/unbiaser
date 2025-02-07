import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET() {
  const { data: jobs } = await supabase
    .from('analysis_jobs')
    .select('*')
    .order('created_at', { ascending: false });

  return Response.json(jobs);
} 