import type { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';

// Import the Express app
let app: any;

const getApp = async () => {
  if (!app) {
    const module = await import('../server/index.js');
    app = module.default;
  }
  return app;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const expressApp = await getApp();
  const serverlessHandler = serverless(expressApp);
  return serverlessHandler(req, res);
}