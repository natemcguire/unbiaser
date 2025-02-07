import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function trackUsage(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  await supabase.from('usage_logs').insert({
    id: nanoid(),
    user_id: userId,
    date: today,
    action: 'analyze'
  });
}

export async function checkUserLimit(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  
  const { count } = await supabase
    .from('usage_logs')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('date', today);

  return (count || 0) < 10; // Limit to 10 analyses per day
} 