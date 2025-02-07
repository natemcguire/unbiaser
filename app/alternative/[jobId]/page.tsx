import { createClient } from '@supabase/supabase-js';
import { NewspaperTemplate } from '@/app/components/newspaper-template';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export default async function AlternativePage({ params }: { params: { jobId: string } }) {
  const { data: job } = await supabase
    .from('analysis_jobs')
    .select('*')
    .eq('id', params.jobId)
    .single();

  if (!job?.result?.counterpoints?.alternativeArticle) {
    return (
      <div className="min-h-screen bg-[#FFF1E5] p-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-red-500">Alternative article not found</div>
        </div>
      </div>
    );
  }

  const { headline, content, sources } = job.result.counterpoints.alternativeArticle;

  return <NewspaperTemplate 
    headline={headline}
    content={content}
    sources={sources}
  />;
} 