import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: { persistSession: false }
  }
);

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { jobId: string } }): Promise<Metadata> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/analyze/status/${params.jobId}`, {
      next: { revalidate: 60 }
    });
    const report = await response.json();
    const article = report.result.counterpoints.alternativeArticle;
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/article/${params.jobId}/${params.slug}`;
    const publishedTime = new Date().toISOString();

    return {
      title: `${article.headline} | Political Compass Alternative View`,
      description: article.content.slice(0, 155) + '...',
      keywords: ['political analysis', 'media bias', 'alternative perspective', 'political compass'],
      authors: [{ name: article.author }],
      publisher: 'Political Compass',
      robots: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
      openGraph: {
        title: article.headline,
        description: article.content.slice(0, 155) + '...',
        url,
        siteName: 'Political Compass',
        locale: 'en_US',
        type: 'article',
        publishedTime,
        authors: [article.author],
        images: [
          {
            url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?title=${encodeURIComponent(article.headline)}`,
            width: 1200,
            height: 630,
            alt: article.headline,
          }
        ],
      },
      twitter: {
        card: 'summary_large_image',
        site: '@PoliticalCompass',
        creator: '@PoliticalCompass',
        title: article.headline,
        description: article.content.slice(0, 155) + '...',
        images: [`${process.env.NEXT_PUBLIC_BASE_URL}/api/og?title=${encodeURIComponent(article.headline)}`],
      },
      alternates: {
        canonical: url,
      },
    };
  } catch {
    return {
      title: 'Alternative Perspective | Political Compass',
      robots: { index: false }
    };
  }
}

// Generate static paths
export async function generateStaticParams() {
  return [];
}

// Add structured data component
function ArticleJsonLd({ article, url }: { 
  article: any, 
  url: string 
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.headline,
    description: article.content.slice(0, 155) + '...',
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Political Compass',
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`,
      },
    },
    datePublished: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    image: {
      '@type': 'ImageObject',
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?title=${encodeURIComponent(article.headline)}`,
      height: 630,
      width: 1200,
    },
    articleBody: article.content,
    keywords: ['political analysis', 'media bias', 'alternative perspective'],
    articleSection: 'Politics',
    inLanguage: 'en-US',
    copyrightYear: new Date().getFullYear(),
    copyrightHolder: {
      '@type': 'Organization',
      name: 'Political Compass',
    },
  };

  return (
    <Script id="article-jsonld" type="application/ld+json">
      {JSON.stringify(jsonLd)}
    </Script>
  );
}

export default async function ArticlePage({ params }: { params: { jobId: string } }) {
  const { data: report } = await supabase
    .from('analysis_jobs')
    .select('result')
    .eq('id', params.jobId)
    .single();

  if (!report?.result?.counterpoints?.alternativeArticle?.bias) {
    notFound();
  }

  const { alternativeArticle } = report.result.counterpoints;
  const { bias } = alternativeArticle;
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/article/${params.jobId}/${params.slug}`;

  return (
    <div className="min-h-screen bg-[#f4f1e9] text-[#2c363f] p-4 md:p-8 font-serif">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12">
          <div className="bg-white border border-[#2c363f]/20 p-6 shadow-md">
            <div className="flex gap-6">
              {/* Bias-O-Meter */}
              <div className="flex flex-col items-center w-24 flex-shrink-0">
                <div className="relative w-20 h-20 group">
                  <div 
                    className={`w-20 h-20 rounded-full border-4 flex items-center justify-center cursor-help
                      ${bias.finalScore >= 80 ? 'border-green-500' :
                        bias.finalScore >= 60 ? 'border-yellow-500' :
                        'border-red-500'}`}
                  >
                    <span className="text-2xl font-bold">
                      {Math.round(bias.finalScore)}
                    </span>
                  </div>
                  
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -right-4 top-full mt-2 p-2 bg-[#2c363f] text-[#f4f1e9] text-xs rounded shadow-lg w-48 pointer-events-none">
                    <div className="font-medium mb-1">Alternative Bias Score</div>
                    <div className="mt-1 text-[#f4f1e9]/80 italic">
                      Showing opposite perspective's bias level
                    </div>
                    <div className="absolute -top-1 right-6 w-2 h-2 bg-[#2c363f] transform rotate-45" />
                  </div>
                </div>
                <div className="text-sm font-medium mt-2 text-center">Bias-O-Meter</div>
              </div>

              {/* Title and Back Link */}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h1 className="text-3xl font-bold font-serif">
                    {alternativeArticle.headline}
                  </h1>
                </div>
                <a 
                  href={`/report/${params.jobId}`}
                  className="text-sm text-[#2c363f]/60 hover:text-[#2c363f]"
                >
                  ← Back to Analysis
                </a>
              </div>
            </div>
          </div>

          <div className="text-center border-b-4 border-double border-[#2c363f] pb-6 mt-8">
            <div className="text-sm uppercase tracking-widest">
              Alternative Perspective • {new Date().toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </header>

        <article className="bg-white border border-[#2c363f]/20 p-6 shadow-md prose prose-slate max-w-none">
          <div className="text-sm italic mb-8">
            By {alternativeArticle.author}
          </div>
          <div className="leading-relaxed whitespace-pre-wrap">
            {alternativeArticle.content}
          </div>
          
          <div className="mt-12 pt-6 border-t border-[#2c363f]/20">
            <h4 className="font-bold text-lg mb-2">Sources</h4>
            <ul className="list-disc pl-5 space-y-1">
              {alternativeArticle.sources.map((source, i) => (
                <li key={i} className="text-sm">{source}</li>
              ))}
            </ul>
          </div>
        </article>

        <ArticleJsonLd article={alternativeArticle} url={url} />
      </div>
    </div>
  );
} 