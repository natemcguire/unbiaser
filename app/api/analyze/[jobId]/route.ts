export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  const { data: job } = await supabase
    .from('analysis_jobs')
    .select('*')
    .eq('id', params.jobId)
    .single();

  return Response.json(job);
} 