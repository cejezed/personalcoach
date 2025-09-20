import type { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import app from '../dist/index.js';

const handler = serverless(app);

export default async function(req: VercelRequest, res: VercelResponse) {
  return await handler(req, res);
}