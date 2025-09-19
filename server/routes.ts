import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      ok: true, 
      now: new Date().toISOString() 
    });
  });

  // Coach suggestions (dummy implementation)
  app.post('/api/coach/suggest', (req, res) => {
    const suggestions = [
      {
        id: '1',
        type: 'break',
        title: 'Take a Break',
        message: 'You\'ve been working for over 2 hours. Consider taking a 15-minute break to maintain productivity.',
        priority: 'medium',
        icon: 'lightbulb'
      },
      {
        id: '2',
        type: 'billing',
        title: 'Billing Opportunity',
        message: 'You have unbilled time that could be invoiced. Consider generating invoices for completed work.',
        priority: 'high',
        icon: 'chart-line'
      },
      {
        id: '3',
        type: 'health',
        title: 'Health Reminder',
        message: 'You\'re behind on your daily step goal. Try taking a short walk or using the stairs.',
        priority: 'low',
        icon: 'heart'
      }
    ];

    res.json({
      suggestions: suggestions.slice(0, Math.floor(Math.random() * 3) + 1)
    });
  });

  // Calendar preview (placeholder)
  app.get('/api/calendar/preview', (req, res) => {
    res.json({
      message: 'Calendar integration coming soon',
      events: []
    });
  });

  // Invoice PDF generation (not implemented)
  app.post('/api/invoices/:id/pdf', (req, res) => {
    res.status(501).json({
      error: 'PDF generation not yet implemented',
      message: 'This feature will be available in a future update'
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
