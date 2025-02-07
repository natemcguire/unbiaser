import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST() {
  await supabase
    .from('analysis_jobs')
    .update({ 
      status: 'failed',
      error: 'Job manually stopped',
      updated_at: new Date().toISOString()
    })
    .eq('status', 'processing');

  return Response.json({ success: true });
} 