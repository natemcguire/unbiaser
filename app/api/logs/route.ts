import { NextRequest } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const ADMIN_PASSWORD = 'unbiaser-admin-2024';
const ADMIN_USER = 'admin';

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
    const logsDir = join(process.env.STORAGE_PATH!, 'logs');
    const files = await readdir(logsDir);
    
    // Get the latest log file
    const latestFile = files
      .filter(f => f.endsWith('.log'))
      .sort()
      .reverse()[0];

    if (!latestFile) {
      return Response.json({ logs: [] });
    }

    const content = await readFile(join(logsDir, latestFile), 'utf8');
    const logs = content
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line))
      .reverse()
      .slice(0, 1000); // Last 1000 logs

    return Response.json({ logs });
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return Response.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
} 