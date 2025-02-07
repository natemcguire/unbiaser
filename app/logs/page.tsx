'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/logs');
        if (!response.ok) throw new Error('Failed to fetch logs');
        const data = await response.json();
        setLogs(data.logs);
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
    <div className="p-6 bg-gray-900 min-h-screen text-gray-100">
      <h1 className="text-2xl font-bold mb-6">System Logs</h1>
      
      <div className="space-y-2">
        {logs.map((log, i) => (
          <div 
            key={i} 
            className={`p-3 rounded font-mono text-sm ${
              log.level === 'error' ? 'bg-red-900/50 text-red-200' :
              log.level === 'warn' ? 'bg-yellow-900/50 text-yellow-200' :
              log.level === 'info' ? 'bg-green-900/50 text-green-200' :
              'bg-blue-900/50 text-blue-200'
            }`}
          >
            <div className="flex items-start gap-4">
              <span className="text-gray-400">
                {format(new Date(log.timestamp), 'HH:mm:ss')}
              </span>
              <span className="uppercase text-xs font-bold">
                {log.level}
              </span>
              <span>{log.message}</span>
            </div>
            {log.data && (
              <pre className="mt-2 text-xs overflow-x-auto">
                {JSON.stringify(log.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 