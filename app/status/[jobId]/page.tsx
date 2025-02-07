'use client';

import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/app/components/loading';

interface JobStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: any;
  error?: string;
}

export default function StatusPage({ params }: { params: { jobId: string } }) {
  const [status, setStatus] = useState<JobStatus>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/analyze/status/${params.jobId}`);
        if (!response.ok) throw new Error('Failed to get status');
        const data = await response.json();
        setStatus(data);

        if (data.status === 'completed') {
          window.location.href = `/report/${params.jobId}`;
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to get status');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, [params.jobId]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-black text-cyan-300 p-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-pink-500 bg-pink-500/10 p-4 rounded-lg border border-pink-500/50">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-black text-cyan-300 p-6">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">
          Analyzing Content
        </h1>

        <div className="space-y-6">
          <LoadingSpinner />
          
          <div className="text-lg">
            {status?.status === 'pending' && 'Preparing analysis...'}
            {status?.status === 'processing' && (
              <>
                Analyzing content...
                {status.progress && (
                  <div className="mt-2 text-sm">
                    {Math.round(status.progress * 100)}% complete
                  </div>
                )}
              </>
            )}
          </div>

          <div className="text-sm text-cyan-300/60">
            This usually takes 1-2 minutes
          </div>
        </div>
      </div>
    </div>
  );
} 