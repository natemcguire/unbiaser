import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: { persistSession: false }
  }
);

export async function POST(request: Request) {
  const { url } = await request.json();

  try {
    const { data } = await supabase
      .from('analysis_jobs')
      .select('id, status')
      .eq('url', url)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return Response.json({
      exists: !!data,
      jobId: data?.id
    });
  } catch (error) {
    return Response.json({ exists: false });
  }
} 