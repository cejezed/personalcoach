import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('time_entries')
      .select(`
        *,
        projects (name, city, client_name, default_rate_cents),
        phases (name)
      `)
      .order('occurred_on', { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
  }
  
  else if (req.method === 'POST') {
    const { data, error } = await supabase
      .from('time_entries')
      .insert([req.body])
      .select(`
        *,
        projects (name, city, client_name, default_rate_cents),
        phases (name)
      `)
      .single();
    
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
  }
  
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
