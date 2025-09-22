import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role; zet deze als Vercel env var in het backend project
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, projects(name, city, client_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { data, error } = await supabase
        .from('tasks')
        .insert(body)
        .select('*, projects(name, city, client_name)')
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end('Method Not Allowed');
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ message: e?.message || 'Server error' });
  }
}
