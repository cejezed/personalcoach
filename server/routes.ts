import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProjectSchema,
  insertTaskSchema,
  insertTimeEntrySchema,
  insertWorkoutSchema,
  insertStepsSchema,
  insertEnergyCheckSchema,
  insertInvoiceSchema
} from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      ok: true, 
      now: new Date().toISOString() 
    });
  });

  // =====================================
  // PROJECT ROUTES
  // =====================================

  // Get all projects
  app.get('/api/projects', async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });

  // Get single project
  app.get('/api/projects/:id', async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch project' });
    }
  });

  // Create project
  app.post('/api/projects', async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create project' });
    }
  });

  // Update project
  app.patch('/api/projects/:id', async (req, res) => {
    try {
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, validatedData);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json(project);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update project' });
    }
  });

  // Delete project
  app.delete('/api/projects/:id', async (req, res) => {
    try {
      const success = await storage.deleteProject(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete project' });
    }
  });

  // =====================================
  // TASK ROUTES
  // =====================================

  // Get all tasks
  app.get('/api/tasks', async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  // Create task
  app.post('/api/tasks', async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  // Update task
  app.patch('/api/tasks/:id', async (req, res) => {
    try {
      const validatedData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(req.params.id, validatedData);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(task);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  // =====================================
  // TIME TRACKING ROUTES
  // =====================================

  // Get all time entries
  app.get('/api/time-entries', async (req, res) => {
    try {
      const timeEntries = await storage.getTimeEntries();
      res.json(timeEntries);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch time entries' });
    }
  });

  // Get active time entry
  app.get('/api/time-entries/active', async (req, res) => {
    try {
      const activeEntry = await storage.getActiveTimeEntry();
      res.json(activeEntry || null);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch active time entry' });
    }
  });

  // Start time tracking
  app.post('/api/time-entries/start', async (req, res) => {
    try {
      const validatedData = insertTimeEntrySchema.parse({
        ...req.body,
        start_time: new Date()
      });
      const timeEntry = await storage.createTimeEntry(validatedData);
      res.status(201).json(timeEntry);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to start time tracking' });
    }
  });

  // Stop time tracking
  app.patch('/api/time-entries/:id/stop', async (req, res) => {
    try {
      const timeEntry = await storage.updateTimeEntry(req.params.id, {
        end_time: new Date()
      });
      if (!timeEntry) {
        return res.status(404).json({ error: 'Time entry not found' });
      }
      res.json(timeEntry);
    } catch (error) {
      res.status(500).json({ error: 'Failed to stop time tracking' });
    }
  });

  // =====================================
  // HEALTH & WELLNESS ROUTES
  // =====================================

  // Get workouts
  app.get('/api/workouts', async (req, res) => {
    try {
      const workouts = await storage.getWorkouts();
      res.json(workouts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch workouts' });
    }
  });

  // Create workout
  app.post('/api/workouts', async (req, res) => {
    try {
      const validatedData = insertWorkoutSchema.parse(req.body);
      const workout = await storage.createWorkout(validatedData);
      res.status(201).json(workout);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create workout' });
    }
  });

  // Get/update steps for date
  app.get('/api/steps/:date', async (req, res) => {
    try {
      const steps = await storage.getStepsForDate(req.params.date);
      res.json(steps || null);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch steps' });
    }
  });

  app.post('/api/steps', async (req, res) => {
    try {
      const validatedData = insertStepsSchema.parse(req.body);
      const steps = await storage.createOrUpdateSteps(validatedData);
      res.status(201).json(steps);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to save steps' });
    }
  });

  // Energy checks
  app.get('/api/energy-checks', async (req, res) => {
    try {
      const energyChecks = await storage.getRecentEnergyChecks();
      res.json(energyChecks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch energy checks' });
    }
  });

  app.post('/api/energy-checks', async (req, res) => {
    try {
      const validatedData = insertEnergyCheckSchema.parse(req.body);
      const energyCheck = await storage.createEnergyCheck(validatedData);
      res.status(201).json(energyCheck);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create energy check' });
    }
  });

  // =====================================
  // BILLING ROUTES
  // =====================================

  // Get invoices
  app.get('/api/invoices', async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch invoices' });
    }
  });

  // Create invoice
  app.post('/api/invoices', async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create invoice' });
    }
  });

  // =====================================
  // LOOKUP DATA ROUTES
  // =====================================

  // Get phases
  app.get('/api/phases', async (req, res) => {
    try {
      const phases = await storage.getPhases();
      res.json(phases);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch phases' });
    }
  });

  // Get workout activities
  app.get('/api/workout-activities', async (req, res) => {
    try {
      const activities = await storage.getWorkoutActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch workout activities' });
    }
  });

  // =====================================
  // LEGACY ROUTES (keep for compatibility)
  // =====================================

  // Coach suggestions (enhanced with real data)
  app.post('/api/coach/suggest', async (req, res) => {
    try {
      const activeTimeEntry = await storage.getActiveTimeEntry();
      const recentEnergyChecks = await storage.getRecentEnergyChecks();
      const pendingInvoices = await storage.getInvoices();
      
      const suggestions = [];

      // Time tracking suggestions
      if (activeTimeEntry) {
        const hoursWorked = (Date.now() - activeTimeEntry.start_time.getTime()) / (1000 * 60 * 60);
        if (hoursWorked > 2) {
          suggestions.push({
            id: '1',
            type: 'break',
            title: 'Take a Break',
            message: `You've been working for ${hoursWorked.toFixed(1)} hours. Consider taking a 15-minute break.`,
            priority: 'medium',
            icon: 'lightbulb'
          });
        }
      }

      // Billing suggestions
      if (pendingInvoices.filter(inv => inv.status === 'draft').length > 0) {
        suggestions.push({
          id: '2',
          type: 'billing',
          title: 'Draft Invoices',
          message: 'You have draft invoices ready to be sent to clients.',
          priority: 'high',
          icon: 'chart-line'
        });
      }

      // Health suggestions based on energy checks
      const lastEnergyCheck = recentEnergyChecks[0];
      if (lastEnergyCheck && lastEnergyCheck.energy_level < 3) {
        suggestions.push({
          id: '3',
          type: 'health',
          title: 'Energy Boost',
          message: 'Your last energy check was low. Try a short walk or drink some water.',
          priority: 'low',
          icon: 'heart'
        });
      }

      res.json({
        suggestions: suggestions.slice(0, 3)
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate suggestions' });
    }
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
