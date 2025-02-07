'use client';

import { useEffect, useState } from 'react';

interface Log {
  timestamp: string;
  level: string;
  message: string;
  metadata?: any;
}

export function AnalysisLogs({ jobId }: { jobId: string }) {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(`/api/analyze/${jobId}/logs`);
        if (!response.ok) throw new Error('Failed to fetch logs');
        const data = await response.json();
        setLogs(data);
      } catch (error) {
        console.error('Error fetching logs:', error);
      }
    };

    fetchLogs();
    // Poll for new logs every few seconds
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [jobId]);

  return (
    <div className="space-y-2">
      {logs.map((log, i) => (
        <div key={i} className="flex gap-2 text-sm">
          <span className="text-[#2c363f]/60">
            {new Date(log.timestamp).toLocaleTimeString()}
          </span>
          <span className={`
            ${log.level === 'error' ? 'text-red-600' : 
              log.level === 'warn' ? 'text-yellow-600' : 
              'text-[#2c363f]'}`}
          >
            {log.message}
          </span>
        </div>
      ))}
    </div>
  );
} 