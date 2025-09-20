import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';

// Create a simple Express app for testing
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'API is working!', path: req.path });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint working!' });
});

// Catch all other routes
app.use('*', (req, res) => {
  res.json({ 
    message: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}