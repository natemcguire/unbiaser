'use client';

import { useState, useEffect, useCallback } from 'react';

interface BiasCalloutProps {
  content: string;
  bias: {
    biasX: number;
    biasY: number;
    evidence: {
      political: string[];
      emotional: string[];
      omissions: string[];
    };
  };
  jobId: string;
}

export default function BiasCallout({ content, bias, jobId }: BiasCalloutProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Move analyzeWithGrok outside useEffect and memoize it
  const analyzeWithGrok = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analyze/grok/callout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, bias, jobId })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analysis failed');
      
      // Clean up markdown formatting if present
      let cleanJson = data.analysis;
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson
          .replace(/```json\n/, '')  // Remove opening ```json
          .replace(/\n```$/, '')     // Remove closing ```
          .trim();
      }
      
      setAnalysis(cleanJson);
    } catch (error) {
      console.error('Grok analysis failed:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, [content, bias, jobId]);

  // Call analyzeWithGrok on mount
  useEffect(() => {
    analyzeWithGrok();
  }, [analyzeWithGrok]);

  return (
    <section className="bg-white border border-[#2c363f]/20 p-6 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold font-serif">Bias & Context Analysis</h2>
        <div className="text-sm text-[#2c363f]/60">Powered by Grok</div>
      </div>
      
      {loading && (
        <div className="text-center py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-[#2c363f]/10 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-[#2c363f]/10 rounded w-1/2 mx-auto"></div>
          </div>
          <p className="text-[#2c363f]/60 mt-4">Analyzing with Grok...</p>
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={analyzeWithGrok}
            className="px-4 py-2 bg-[#2c363f] text-white hover:bg-[#2c363f]/90"
          >
            Try Again
          </button>
        </div>
      )}

      {analysis && !loading && (
        <div className="prose prose-slate max-w-none">
          {(() => {
            const data = JSON.parse(analysis);
            return (
              <>
                <h2 className="text-2xl font-bold mb-6">{data.title}</h2>
                
                <h3 className="text-xl font-bold mt-6 mb-4">1. Hidden Assumptions</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {data.sections.hiddenAssumptions.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>

                <h3 className="text-xl font-bold mt-6 mb-4">2. Missing Context</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {data.sections.missingContext.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>

                <h3 className="text-xl font-bold mt-6 mb-4">Bias Metrics Analysis</h3>
                <div className="space-y-2">
                  <p>
                    <strong>Political Bias (X): {data.biasMetrics.political.score}</strong> - {data.biasMetrics.political.explanation}
                  </p>
                  <p>
                    <strong>Emotional Tone (Y): {data.biasMetrics.emotional.score}</strong> - {data.biasMetrics.emotional.explanation}
                  </p>
                </div>

                <h3 className="text-xl font-bold mt-6 mb-4">Conclusion</h3>
                <p>{data.conclusion}</p>
              </>
            );
          })()}
        </div>
      )}
    </section>
  );
} 