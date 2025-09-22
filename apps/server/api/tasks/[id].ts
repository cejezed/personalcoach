import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id: string };
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, projects(name, city, client_name)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { data, error } = await supabase
        .from('tasks')
        .update(body)
        .eq('id', id)
        .select('*, projects(name, city, client_name)')
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      return res.status(204).end();
    }

    res.setHeader('Allow', 'GET, PATCH, DELETE');
    return res.status(405).end('Method Not Allowed');
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ message: e?.message || 'Server error' });
  }
}
