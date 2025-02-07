import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const jobId = nanoid();
    
    const { error } = await supabase
      .from('analysis_jobs')
      .insert({
        id: jobId,
        url: 'https://example.com',
        title: 'Test Article',
        description: 'Test Description',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    return Response.json({ 
      success: true,
      jobId,
      message: 'Test job created successfully'
    });

  } catch (error) {
    console.error('Failed to create test job:', error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 