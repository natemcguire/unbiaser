import { redirect } from 'next/navigation';
import { slugify } from '@/lib/utils';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get('jobId');
  
  if (!jobId) {
    return new Response('Missing jobId', { status: 400 });
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/analyze/status/${jobId}`);
    const report = await response.json();
    const headline = report.result.counterpoints.alternativeArticle.headline;
    const slug = slugify(headline);

    return redirect(`/article/${jobId}/${slug}`);
  } catch {
    return new Response('Article not found', { status: 404 });
  }
} 