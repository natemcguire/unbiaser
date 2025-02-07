'use client';

import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/app/components/loading';
import { AnalysisLogs } from '@/app/components/AnalysisLogs';
import { slugify } from '@/lib/utils';
import BiasCallout from '@/app/components/bias-callout';

// Move interfaces to separate types file if needed
interface Report {
  jobId: string;
  url: string;
  title: string;
  status: string;
  progress?: number;
  result?: {
    analysis: {
      summary: string;
      keyPoints: string[];
      mainArguments: string[];
      bias: {
        biasX: number;
        biasY: number;
        finalScore: number;
        evidence: {
          political: string[];
          emotional: string[];
          omissions: string[];
        }
      };
    };
    counterpoints: {
      alternativeArticle: {
        headline: string;
        content: string;
        author: string;
        sources: string[];
        bias: {
          biasX: number;
          biasY: number;
          finalScore: number;
        }
      }
    };
  };
  error?: string;
}

export default function ReportPage({ params }: { params: { jobId: string } }) {
  const [report, setReport] = useState<Report>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(
          `/api/analyze/status/${params.jobId}?t=${Date.now()}`
        );
        if (!response.ok) throw new Error('Failed to get report');
        const data = await response.json();
        setReport(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to get report');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
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

  if (!report || report.status !== 'completed') return (
    <div className="min-h-screen bg-[#f4f1e9] text-[#2c363f] p-6">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-8 font-serif">
          Analyzing Content
        </h1>

        <div className="space-y-6">
          <LoadingSpinner />
          
          <div className="text-lg font-serif">
            {report?.status === 'pending' && 'Preparing analysis...'}
            {report?.status === 'processing' && (
              <>
                Analyzing content...
                {report.progress && (
                  <div className="mt-2 text-sm">
                    {Math.round(report.progress * 100)}% complete
                  </div>
                )}
              </>
            )}
            {report?.status === 'failed' && (
              <div className="text-red-800">
                Analysis failed: {report.error}
              </div>
            )}
          </div>

          <div className="text-sm text-[#2c363f]/60 font-serif">
            This usually takes 1-2 minutes
          </div>

          <div className="mt-8 font-mono text-sm">
            <AnalysisLogs jobId={params.jobId} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f1e9] text-[#2c363f] p-4 md:p-8 font-serif">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <div className="bg-white border border-[#2c363f]/20 p-6 shadow-md">
            <div className="flex gap-6 items-center">
              {/* Bias-O-Meter */}
              <div className="flex flex-col items-center w-24 flex-shrink-0">
                <div className="relative w-20 h-20 group">
                  <div 
                    className={`w-20 h-20 rounded-full border-4 flex items-center justify-center cursor-help
                      ${report.result?.analysis.bias.finalScore >= 80 ? 'border-green-500' :
                        report.result?.analysis.bias.finalScore >= 60 ? 'border-yellow-500' :
                        'border-red-500'}`}
                  >
                    <span className="text-2xl font-bold">
                      {Math.round(report.result?.analysis.bias.finalScore || 0)}
                    </span>
                  </div>
                  
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -right-4 top-full mt-2 p-2 bg-[#2c363f] text-[#f4f1e9] text-xs rounded shadow-lg w-48 pointer-events-none">
                    <div className="font-medium mb-1">Bias Score Explained:</div>
                    <ul className="space-y-1">
                      <li><span className="text-green-400">80-100:</span> Highly neutral & objective</li>
                      <li><span className="text-yellow-400">60-79:</span> Moderate bias detected</li>
                      <li><span className="text-red-400">&lt;60:</span> Strong bias present</li>
                    </ul>
                    <div className="mt-1 text-[#f4f1e9]/80 italic">
                      Based on political stance and emotional tone
                    </div>
                    <div className="absolute -top-1 right-6 w-2 h-2 bg-[#2c363f] transform rotate-45" />
                  </div>
                </div>
                <div className="text-sm font-medium mt-2 text-center">Bias-O-Meter</div>
              </div>

              {/* Title and metadata */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold font-serif mb-4">
                  {report.title}
                </h1>
                <div className="text-sm text-[#2c363f]/60">
                  <a 
                    href={report.url}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-[#2c363f]"
                  >
                    View Original Article →
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center border-b-4 border-double border-[#2c363f] pb-6 mt-8">
            <div className="text-sm uppercase tracking-widest">
              Analysis Report • {new Date().toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Summary */}
          <section className="bg-white border border-[#2c363f]/20 p-6 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-serif">Executive Summary</h2>
              <div className="text-sm text-[#2c363f]/60">Powered by OpenAI</div>
            </div>
            <p className="leading-relaxed">{report.result?.analysis.summary}</p>
          </section>

          {/* Grok Analysis - Moved up */}
          <BiasCallout 
            content={report.result.analysis.summary}
            bias={report.result.analysis.bias}
            jobId={params.jobId}
          />

          {/* Bias Analysis */}
          <section className="bg-white border border-[#2c363f]/20 p-6 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-serif">Political & Emotional Analysis</h2>
              <div className="text-sm text-[#2c363f]/60">Powered by OpenAI</div>
            </div>
            <br></br>
            {/* Bias Analysis Plot */}
            <div className="relative aspect-square w-full max-w-md mx-auto mb-8">
              <div className="relative">
                {/* Plot box */}
                <div className="aspect-square w-full bg-[#f5f5f0] border border-[#2c363f]/20">
                  {/* Top label */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-sm font-medium">
                    Authoritarian
                  </div>

                  {/* Left label - aligned with axis */}
                  <div className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-medium origin-center whitespace-nowrap transform translate-x-[-100%]">
                    Economic-Left
                  </div>

                  {/* Right label - aligned with axis */}
                  <div className="absolute -right-12 top-1/2 -translate-y-1/2 rotate-90 text-sm font-medium origin-center whitespace-nowrap transform translate-x-[100%]">
                    Economic-Right
                  </div>

                  {/* Bottom label */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-medium">
                    Libertarian
                  </div>

                  {/* Axes - thicker */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-black" /> {/* Y axis */}
                  <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-black" /> {/* X axis */}
                  
                  {/* Plot point */}
                  <div 
                    className={`absolute w-[18px] h-[18px] rounded-full transition-all duration-300 ${
                      (report.result?.analysis.bias.biasX || 0) < 0 ? 'bg-blue-500' : 'bg-red-500'
                    }`}
                    style={{ 
                      left: `${50 + (report.result?.analysis.bias.biasX || 0)/2}%`,
                      top: `${50 + (report.result?.analysis.bias.biasY || 0)/2}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-2">Political Indicators</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {report.result?.analysis.bias.evidence.political.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Emotional Markers</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {report.result?.analysis.bias.evidence.emotional.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Alternative Perspective */}
          <section className="bg-white border border-[#2c363f]/20 p-6 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-serif">Alternative Perspective</h2>
              <div className="text-sm text-[#2c363f]/60">Powered by OpenAI</div>
            </div>
            {report.result?.counterpoints?.alternativeArticle?.bias && (
              <div className="flex items-center gap-2">
                <div className="relative w-20 h-20 group">
                  <div 
                    className={`w-20 h-20 rounded-full border-4 flex items-center justify-center cursor-help
                      ${report.result.counterpoints.alternativeArticle.bias.finalScore >= 80 ? 'border-green-500' :
                        report.result.counterpoints.alternativeArticle.bias.finalScore >= 60 ? 'border-yellow-500' :
                        'border-red-500'}`}
                  >
                    <span className="text-2xl font-bold">
                      {Math.round(report.result.counterpoints.alternativeArticle.bias.finalScore)}
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
                <div className="text-sm font-medium text-center">Bias-O-Meter</div>
              </div>
            )}
            
            {report.result?.counterpoints?.alternativeArticle ? (
              <article className="prose prose-slate max-w-none">
                <h3 className="text-xl font-bold mb-2">
                  {report.result.counterpoints.alternativeArticle.headline}
                </h3>
                <div className="text-sm italic mb-4">
                  By {report.result.counterpoints.alternativeArticle.author}
                </div>
                <p className="leading-relaxed line-clamp-3">
                  {report.result.counterpoints.alternativeArticle.content}
                </p>
                <a 
                  href={`/article/${params.jobId}/${slugify(report.result.counterpoints.alternativeArticle.headline)}`}
                  className="inline-block mt-4 text-[#2c363f] hover:text-[#2c363f]/70"
                >
                  Read full alternative perspective →
                </a>
              </article>
            ) : (
              <p>Alternative perspective loading...</p>
            )}
          </section>

          {/* Key Points & Arguments */}
          <section className="bg-white border border-[#2c363f]/20 p-6 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-serif">Key Points & Arguments</h2>
              <div className="text-sm text-[#2c363f]/60">Powered by OpenAI</div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-4 font-serif">Key Points</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {report.result?.analysis.keyPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4 font-serif">Main Arguments</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {report.result?.analysis.mainArguments.map((arg, i) => (
                    <li key={i}>{arg}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Analysis Logs */}
          <section className="bg-white border border-[#2c363f]/20 p-6 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-serif">Analysis Logs</h2>
              <div className="text-sm text-[#2c363f]/60">System Events</div>
            </div>
            <div className="font-mono text-sm">
              <AnalysisLogs jobId={params.jobId} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}