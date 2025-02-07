import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface ErrorReport {
  message: string;
  stack?: string;
  context: Record<string, unknown>;
  timestamp: string;
  version: string;
  environment: string;
  url?: string;
  userAgent?: string;
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export async function POST(request: NextRequest) {
  try {
    const error = await request.json() as ErrorReport;
    
    const { error: dbError } = await supabase
      .from('errors')
      .insert({
        message: error.message,
        stack: error.stack,
        context: error.context,
        timestamp: error.timestamp,
        version: error.version,
        environment: error.environment,
        url: error.url,
        user_agent: error.userAgent
      });

    if (dbError) throw dbError;

    return Response.json({ success: true });
  } catch (e) {
    console.error('Error logging failed:', e);
    return Response.json({ 
      error: 'Failed to log error',
      details: process.env.NODE_ENV === 'development' ? e : undefined 
    }, { status: 500 });
  }
} 