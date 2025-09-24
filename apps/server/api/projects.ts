import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY! // of SERVICE_ROLE als je RLS wilt negeren
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // optionele simpele CORS (matcht jouw andere handlers)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('projects')
        .select('id,name,city,client_name,default_rate_cents,archived,created_at')
        .eq('archived', false)
        .order('created_at', { ascending: true });

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data ?? []);
    }

    if (req.method === 'POST') {
      // Body kan string of object zijn
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      // Wil je het puur in Supabase oplossen (trigger vult lege name)?
      // Dan kun je dit weglaten. Anders: kleine guard voorkomt 500 -> 400.
      const name = String(body?.name ?? '').trim();
      if (!name) {
        return res.status(400).json({ error: 'Project name is required' });
      }

      const payload = {
        name,
        city: body?.city ?? null,
        client_name: body?.client_name ?? null,
        default_rate_cents: Math.round(+body?.default_rate_cents || 0),
        archived: false,
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([payload])
        .select('id,name,city,client_name,default_rate_cents,archived,created_at')
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }

    res.setHeader('Allow', 'GET,POST,OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('projects API error:', err);
    return res.status(500).json({ error: err?.message ?? 'Internal server error' });
  }
}
