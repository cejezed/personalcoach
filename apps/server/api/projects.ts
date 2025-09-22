import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock data voor nu (later vervangen door Supabase)
let projects = [
  { id: '1', name: 'Villa Waterfront', description: 'Luxe villa project', hourly_rate: 85, status: 'active' },
  { id: '2', name: 'Kantoorgebouw', description: 'Modern kantoor', hourly_rate: 95, status: 'active' }
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json(projects);
  } else if (req.method === 'POST') {
    const newProject = { id: Date.now().toString(), ...req.body };
    projects.push(newProject);
    res.status(201).json(newProject);
  } else if (req.method === 'DELETE') {
    const id = req.query.id;
    projects = projects.filter(p => p.id !== id);
    res.status(200).json({ success: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
