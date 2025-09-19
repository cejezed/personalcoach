import { z } from 'zod';

// Task validation schema
export const TaskSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Task name is required'),
  description: z.string().optional(),
  project_phase_id: z.string().uuid().optional(),
  status: z.enum(['open', 'in_progress', 'completed', 'cancelled']).default('open'),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

export type Task = z.infer<typeof TaskSchema>;

// Energy check validation schema
export const EnergyCheckSchema = z.object({
  id: z.string().uuid().optional(),
  energy_level: z.number().int().min(1).max(5),
  mood: z.string().optional(),
  notes: z.string().optional(),
  logged_at: z.date().optional(),
  created_at: z.date().optional()
});

export type EnergyCheck = z.infer<typeof EnergyCheckSchema>;

// Project validation schema
export const ProjectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  default_rate_cents: z.number().int().min(0).default(7500),
  status: z.enum(['active', 'completed', 'paused', 'cancelled']).default('active'),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

export type Project = z.infer<typeof ProjectSchema>;

// Project phase validation schema
export const ProjectPhaseSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  phase_id: z.number().int(),
  billing_model: z.enum(['hourly', 'fixed', 'capped']),
  minutes_budget: z.number().int().min(0).optional(),
  rate_cents: z.number().int().min(0).optional(),
  fixed_amount_cents: z.number().int().min(0).optional(),
  cap_minutes: z.number().int().min(0).optional(),
  status: z.enum(['planning', 'active', 'completed', 'cancelled']).default('planning'),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

export type ProjectPhase = z.infer<typeof ProjectPhaseSchema>;

// Time entry validation schema
export const TimeEntrySchema = z.object({
  id: z.string().uuid().optional(),
  task_id: z.string().uuid().optional(),
  project_phase_id: z.string().uuid().optional(),
  description: z.string().optional(),
  start_time: z.date(),
  end_time: z.date().optional(),
  minutes: z.number().int().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

export type TimeEntry = z.infer<typeof TimeEntrySchema>;

// Workout activity schema
export const WorkoutActivitySchema = z.object({
  id: z.number().int().optional(),
  name: z.string().min(1),
  category: z.string().min(1),
  is_basic: z.boolean().default(false),
  created_at: z.date().optional()
});

export type WorkoutActivity = z.infer<typeof WorkoutActivitySchema>;

// Daily workout schema
export const DailyWorkoutSchema = z.object({
  id: z.string().uuid().optional(),
  workout_date: z.date(),
  total_minutes: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

export type DailyWorkout = z.infer<typeof DailyWorkoutSchema>;

// Daily workout item schema
export const DailyWorkoutItemSchema = z.object({
  id: z.string().uuid().optional(),
  daily_workout_id: z.string().uuid(),
  activity_id: z.number().int(),
  minutes: z.number().int().min(0).optional(),
  reps: z.number().int().min(0).optional(),
  intensity: z.enum(['low', 'medium', 'high']).optional(),
  notes: z.string().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

export type DailyWorkoutItem = z.infer<typeof DailyWorkoutItemSchema>;

// Steps schema
export const StepsSchema = z.object({
  id: z.string().uuid().optional(),
  step_date: z.date(),
  step_count: z.number().int().min(0),
  source: z.string().default('manual'),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

export type Steps = z.infer<typeof StepsSchema>;

// Steps bulk import schema
export const StepsBulkImportSchema = z.array(z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  steps: z.number().int().min(0),
  source: z.string().optional()
}));

export type StepsBulkImport = z.infer<typeof StepsBulkImportSchema>;

// Invoice schema
export const InvoiceSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  invoice_number: z.string().min(1),
  issue_date: z.date(),
  due_date: z.date().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'cancelled']).default('draft'),
  total_amount_cents: z.number().int().min(0).default(0),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

export type Invoice = z.infer<typeof InvoiceSchema>;

// User settings schema
export const UserSettingsSchema = z.object({
  id: z.string().uuid().optional(),
  timezone: z.string().default('UTC'),
  default_rate_cents: z.number().int().min(0).default(7500),
  work_hours_start: z.string().default('09:00'),
  work_hours_end: z.string().default('17:00'),
  notification_preferences: z.record(z.any()).default({}),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

export type UserSettings = z.infer<typeof UserSettingsSchema>;
