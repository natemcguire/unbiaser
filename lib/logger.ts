import { mkdir, appendFile } from 'fs/promises';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMessage {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private formatTime(date: Date): string {
    return date.toISOString();
  }

  private async saveToFile(logMessage: LogMessage) {
    const date = new Date();
    const fileName = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}.log`;
    
    await mkdir(join(process.env.STORAGE_PATH!, 'logs'), { recursive: true });
    await appendFile(
      join(process.env.STORAGE_PATH!, 'logs', fileName),
      JSON.stringify(logMessage) + '\n'
    );
  }

  private log(level: LogLevel, message: string, data?: any) {
    const logMessage: LogMessage = {
      timestamp: this.formatTime(new Date()),
      level,
      message,
      ...(data && { data })
    };

    // Color the output based on level
    const colors = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m',  // green
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m', // red
      reset: '\x1b[0m'
    };

    console.log(
      `${colors[level]}[${logMessage.timestamp}] ${level.toUpperCase()}: ${message}${colors.reset}`,
      data ? data : ''
    );

    // Save to file
    this.saveToFile(logMessage).catch(console.error);
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export const logger = {
  info: (message: string, data?: any, jobId?: string) => {
    console.log(message, { ...data, jobId });
  },
  error: (message: string, data?: any, jobId?: string) => {
    console.error(message, { ...data, jobId });
  },
  warn: (message: string, data?: any, jobId?: string) => {
    console.warn(message, { ...data, jobId });
  }
}; 