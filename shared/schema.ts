import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  integer, 
  timestamp, 
  uuid, 
  serial,
  boolean,
  date,
  time,
  jsonb,
  decimal
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =====================================
// LOOKUP TABLES
// =====================================

export const phases = pgTable("phases", {
  id: serial("id").primaryKey(),
  name_nl: text("name_nl").notNull().unique(),
  name_en: text("name_en").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const workout_activities = pgTable("workout_activities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(),
  is_basic: boolean("is_basic").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

// =====================================
// PROJECT & TIME TRACKING TABLES
// =====================================

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  user_id: uuid("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  default_rate_cents: integer("default_rate_cents").default(7500),
  status: text("status").default('active'), // active, completed, paused, cancelled
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const project_phases = pgTable("project_phases", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  project_id: uuid("project_id").notNull(),
  phase_id: integer("phase_id").notNull(),
  billing_model: text("billing_model").notNull(), // hourly, fixed, capped
  minutes_budget: integer("minutes_budget"),
  rate_cents: integer("rate_cents"),
  fixed_amount_cents: integer("fixed_amount_cents"),
  cap_minutes: integer("cap_minutes"),
  status: text("status").default('planning'), // planning, active, completed, cancelled
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  user_id: uuid("user_id").notNull(),
  project_phase_id: uuid("project_phase_id"),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default('open'), // open, in_progress, completed, cancelled
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const time_entries = pgTable("time_entries", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  user_id: uuid("user_id").notNull(),
  task_id: uuid("task_id"),
  project_phase_id: uuid("project_phase_id"),
  description: text("description"),
  start_time: timestamp("start_time").notNull(),
  end_time: timestamp("end_time"),
  minutes: integer("minutes"), // Generated column in database
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// =====================================
// BILLING & INVOICING TABLES
// =====================================

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  user_id: uuid("user_id").notNull(),
  project_id: uuid("project_id").notNull(),
  invoice_number: text("invoice_number").notNull(),
  issue_date: date("issue_date").notNull(),
  due_date: date("due_date"),
  status: text("status").default('draft'), // draft, sent, paid, cancelled
  total_amount_cents: integer("total_amount_cents").notNull().default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const invoice_items = pgTable("invoice_items", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  invoice_id: uuid("invoice_id").notNull(),
  project_phase_id: uuid("project_phase_id"),
  description: text("description").notNull(),
  minutes: integer("minutes").notNull(),
  rate_cents: integer("rate_cents").notNull(),
  amount_cents: integer("amount_cents").notNull(),
  amount_override_cents: integer("amount_override_cents"),
  created_at: timestamp("created_at").defaultNow(),
});

// =====================================
// HEALTH & WELLNESS TABLES
// =====================================

export const meals = pgTable("meals", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  user_id: uuid("user_id").notNull(),
  meal_type: text("meal_type"), // breakfast, lunch, dinner, snack
  description: text("description"),
  calories: integer("calories"),
  logged_at: timestamp("logged_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
});

export const sleep_sessions = pgTable("sleep_sessions", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  user_id: uuid("user_id").notNull(),
  start_time: timestamp("start_time").notNull(),
  end_time: timestamp("end_time"),
  quality_rating: integer("quality_rating"), // 1-5
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
});

export const workouts = pgTable("workouts", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  user_id: uuid("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  duration_minutes: integer("duration_minutes"),
  intensity: text("intensity"), // low, medium, high
  logged_at: timestamp("logged_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
});

export const daily_workouts = pgTable("daily_workouts", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  user_id: uuid("user_id").notNull(),
  workout_date: date("workout_date").notNull(),
  total_minutes: integer("total_minutes").default(0),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const daily_workout_items = pgTable("daily_workout_items", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  daily_workout_id: uuid("daily_workout_id").notNull(),
  activity_id: integer("activity_id").notNull(),
  minutes: integer("minutes"),
  reps: integer("reps"),
  intensity: text("intensity"), // low, medium, high
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const steps = pgTable("steps", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  user_id: uuid("user_id").notNull(),
  step_date: date("step_date").notNull(),
  step_count: integer("step_count").notNull(),
  source: text("source").notNull().default('manual'),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const energy_checks = pgTable("energy_checks", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  user_id: uuid("user_id").notNull(),
  energy_level: integer("energy_level").notNull(), // 1-5
  mood: text("mood"),
  notes: text("notes"),
  logged_at: timestamp("logged_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
});

export const body_metrics = pgTable("body_metrics", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  user_id: uuid("user_id").notNull(),
  metric_type: text("metric_type").notNull(), // weight, body_fat, muscle_mass, blood_pressure
  value: decimal("value", { precision: 8, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  measured_at: timestamp("measured_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
});

// =====================================
// INTEGRATION & SETTINGS TABLES
// =====================================

export const calendar_links = pgTable("calendar_links", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  user_id: uuid("user_id").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  sync_enabled: boolean("sync_enabled").default(true),
  last_sync_at: timestamp("last_sync_at"),
  created_at: timestamp("created_at").defaultNow(),
});

export const events_cache = pgTable("events_cache", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  calendar_link_id: uuid("calendar_link_id").notNull(),
  external_id: text("external_id").notNull(),
  title: text("title").notNull(),
  start_time: timestamp("start_time").notNull(),
  end_time: timestamp("end_time").notNull(),
  description: text("description"),
  synced_at: timestamp("synced_at").defaultNow(),
});

export const user_settings = pgTable("user_settings", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  user_id: uuid("user_id").notNull().unique(),
  timezone: text("timezone").default('UTC'),
  default_rate_cents: integer("default_rate_cents").default(7500),
  work_hours_start: time("work_hours_start").default('09:00'),
  work_hours_end: time("work_hours_end").default('17:00'),
  notification_preferences: jsonb("notification_preferences").default('{}'),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// =====================================
// INSERT SCHEMAS & TYPES
// =====================================

// Projects & Time Tracking
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
});

export const insertTimeEntrySchema = createInsertSchema(time_entries).omit({
  id: true,
  user_id: true,
  minutes: true,
  created_at: true,
  updated_at: true,
});

// Health & Wellness  
export const insertWorkoutSchema = createInsertSchema(workouts).omit({
  id: true,
  user_id: true,
  created_at: true,
});

export const insertStepsSchema = createInsertSchema(steps).omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
});

export const insertEnergyCheckSchema = createInsertSchema(energy_checks).omit({
  id: true,
  user_id: true,
  created_at: true,
});

// Billing
export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
});

// =====================================
// TYPE EXPORTS
// =====================================

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type TimeEntry = typeof time_entries.$inferSelect;

export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Workout = typeof workouts.$inferSelect;

export type InsertSteps = z.infer<typeof insertStepsSchema>;
export type Steps = typeof steps.$inferSelect;

export type InsertEnergyCheck = z.infer<typeof insertEnergyCheckSchema>;
export type EnergyCheck = typeof energy_checks.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type Phase = typeof phases.$inferSelect;
export type WorkoutActivity = typeof workout_activities.$inferSelect;
export type ProjectPhase = typeof project_phases.$inferSelect;
export type InvoiceItem = typeof invoice_items.$inferSelect;
export type UserSettings = typeof user_settings.$inferSelect;
