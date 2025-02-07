import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_PASSWORD = 'unbiaser-admin-2024';
const ADMIN_USER = 'admin';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !isValidAuth(authHeader)) {
    return new Response('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Access"'
      }
    });
  }

  try {
    const { data: jobs } = await supabase
      .from('analysis_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    const { data: errors } = await supabase
      .from('errors')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    return Response.json({ jobs, errors });
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return Response.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

function isValidAuth(authHeader: string) {
  try {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = atob(base64Credentials);
    const [username, password] = credentials.split(':');
    
    return username === ADMIN_USER && password === ADMIN_PASSWORD;
  } catch {
    return false;
  }
} 