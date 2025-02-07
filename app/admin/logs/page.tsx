'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface Job {
  id: string;
  title: string;
  url: string;
  status: string;
  progress?: number;
  error?: string;
  created_at: string;
  completed_at?: string;
}

interface ErrorLog {
  id: number;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  timestamp: string;
  url?: string;
}

export default function AdminLogs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/admin/logs');
        if (!response.ok) throw new Error('Failed to fetch logs');
        const data = await response.json();
        setJobs(data.jobs || []);
        setErrors(data.errors || []);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Logs</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Recent Jobs</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Progress</th>
                  <th className="px-4 py-2">Created</th>
                  <th className="px-4 py-2">Completed</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id}>
                    <td className="px-4 py-2">{job.id}</td>
                    <td className="px-4 py-2">
                      <a href={job.url} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-500 hover:underline">
                        {job.title}
                      </a>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`
                        px-2 py-1 rounded-full text-sm
                        ${job.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                        ${job.status === 'failed' ? 'bg-red-100 text-red-800' : ''}
                        ${job.status === 'processing' ? 'bg-blue-100 text-blue-800' : ''}
                        ${job.status === 'pending' ? 'bg-gray-100 text-gray-800' : ''}
                      `}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {job.progress != null ? `${Math.round(job.progress * 100)}%` : '-'}
                    </td>
                    <td className="px-4 py-2">
                      {format(new Date(job.created_at), 'MMM d, HH:mm:ss')}
                    </td>
                    <td className="px-4 py-2">
                      {job.completed_at 
                        ? format(new Date(job.completed_at), 'MMM d, HH:mm:ss')
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Recent Errors</h2>
          <div className="space-y-4">
            {errors.map(error => (
              <div key={error.id} className="bg-red-50 p-4 rounded-lg">
                <div className="font-medium text-red-800">{error.message}</div>
                {error.stack && (
                  <pre className="mt-2 text-sm text-red-600 overflow-x-auto">
                    {error.stack}
                  </pre>
                )}
                <div className="mt-2 text-sm text-red-600">
                  {format(new Date(error.timestamp), 'MMM d, HH:mm:ss')}
                  {error.url && (
                    <span className="ml-2">
                      at <a href={error.url} className="underline">{error.url}</a>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
} 