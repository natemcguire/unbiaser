import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const { data: logs } = await supabase
      .from('analysis_logs')
      .select('*')
      .eq('job_id', params.jobId)
      .order('timestamp', { ascending: true });

    return Response.json(logs || []);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return Response.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
} 