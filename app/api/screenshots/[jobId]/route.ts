import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: { persistSession: false }
  }
);

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === 'screenshots')) {
      logger.error('Screenshots bucket not found');
      return new Response('Screenshots bucket not found', { status: 404 });
    }

    // Try to get screenshot
    const { data: screenshot, error } = await supabase.storage
      .from('screenshots')
      .download(`${params.jobId}.jpg`);

    if (error) {
      logger.error('Failed to get screenshot', { 
        error,
        jobId: params.jobId,
        details: error.message 
      });
      return new Response('Screenshot not found', { status: 404 });
    }

    return new Response(screenshot, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

  } catch (error) {
    logger.error('Screenshot fetch failed', { error });
    return new Response('Failed to get screenshot', { status: 500 });
  }
} 