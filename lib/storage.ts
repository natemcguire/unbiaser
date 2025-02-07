import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';

const STORAGE_PATH = process.env.STORAGE_PATH || './data';

export interface Job {
  id: string;
  url: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: any;
  error?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  screenshot_url?: string;
}

export async function saveJob(job: Job) {
  await mkdir(join(STORAGE_PATH, 'jobs'), { recursive: true });
  await writeFile(
    join(STORAGE_PATH, 'jobs', `${job.id}.json`),
    JSON.stringify(job, null, 2)
  );
}

export async function getJob(id: string): Promise<Job | null> {
  try {
    const data = await readFile(join(STORAGE_PATH, 'jobs', `${id}.json`), 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function saveScreenshot(jobId: string, screenshot: Buffer) {
  await mkdir(join(STORAGE_PATH, 'screenshots'), { recursive: true });
  const path = join('screenshots', `${jobId}.jpg`);
  await writeFile(join(STORAGE_PATH, path), screenshot);
  return path;
} 