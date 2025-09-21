import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock database - in productie zou dit Supabase/database zijn
let projects = [
  { 
    id: '1', 
    name: 'Website Redesign', 
    description: 'Complete website overhaul',
    status: 'active',
    hourlyRate: '85'
  }
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    const status = req.query.status || 'active';
    const filtered = projects.filter(p => p.status === status);
    res.status(200).json(filtered);
  } 
  
  else if (req.method === 'POST') {
    const { name, description, hourly_rate } = req.body;
    const newProject = {
      id: Date.now().toString(),
      name,
      description: description || null,
      status: 'active',
      hourlyRate: hourly_rate ? hourly_rate.toString() : null
    };
    projects.push(newProject);
    res.status(201).json(newProject);
  }
  
  else if (req.method === 'DELETE' && id) {
    const project = projects.find(p => p.id === id);
    if (project) {
      project.status = 'archived';
      res.status(200).json({ ok: true });
    } else {
      res.status(404).json({ error: 'Project not found' });
    }
  }
  
  else if (req.method === 'PATCH' && id && req.url?.includes('restore')) {
    const project = projects.find(p => p.id === id);
    if (project) {
      project.status = 'active';
      res.status(200).json(project);
    } else {
      res.status(404).json({ error: 'Project not found' });
    }
  }
  
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
