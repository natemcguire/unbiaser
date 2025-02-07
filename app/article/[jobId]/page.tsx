'use client';

import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/app/components/loading';
import type { Report } from '@/app/types';

export default function ArticlePage({ params }: { params: { jobId: string } }) {
  const [report, setReport] = useState<Report>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/analyze/status/${params.jobId}`);
        if (!response.ok) throw new Error('Failed to get article');
        const data = await response.json();
        setReport(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to get article');
      }
    };

    fetchReport();
  }, [params.jobId]);

  if (error) return (
    <div className="min-h-screen bg-[#f4f1e9] text-[#2c363f] p-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      </div>
    </div>
  );

  if (!report?.result?.counterpoints?.alternativeArticle) return (
    <div className="min-h-screen bg-[#f4f1e9] text-[#2c363f] p-6">
      <div className="max-w-2xl mx-auto text-center">
        <LoadingSpinner />
      </div>
    </div>
  );

  const { alternativeArticle } = report.result.counterpoints;

  return (
    <div className="min-h-screen bg-[#f4f1e9] text-[#2c363f] p-4 md:p-8 font-serif">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12">
          <div className="bg-white border border-[#2c363f]/20 p-6 shadow-md">
            <div className="flex gap-6 items-center">
              {/* Bias-O-Meter */}
              <div className="flex flex-col items-center w-24 flex-shrink-0">
                <div className="relative w-20 h-20 group">
                  <div 
                    className={`w-20 h-20 rounded-full border-4 flex items-center justify-center cursor-help
                      ${alternativeArticle.bias.finalScore >= 80 ? 'border-green-500' :
                        alternativeArticle.bias.finalScore >= 60 ? 'border-yellow-500' :
                        'border-red-500'}`}
                  >
                    <span className="text-2xl font-bold">
                      {Math.round(alternativeArticle.bias.finalScore)}
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

              {/* Back to Analysis */}
              <div className="flex-1">
                <a 
                  href={`/report/${params.jobId}`}
                  className="text-sm text-[#2c363f]/60 hover:text-[#2c363f]"
                >
                  ← Back to Analysis
                </a>
              </div>
            </div>
          </div>
        </header>

        <article className="bg-white border border-[#2c363f]/20 p-6 shadow-md prose prose-slate max-w-none">
          <h1 className="text-3xl font-bold mb-4 font-serif">
            {alternativeArticle.headline}
          </h1>
          <div className="text-sm italic mb-8">
            By {alternativeArticle.author}
          </div>
          <div className="leading-relaxed">
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
      </div>
    </div>
  );
} 