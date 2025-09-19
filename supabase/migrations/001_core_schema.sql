-- Core schema migration (idempotent)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Lookup tables
CREATE TABLE IF NOT EXISTS phases (
  id SERIAL PRIMARY KEY,
  name_nl TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default phases
INSERT INTO phases (name_nl, name_en) VALUES
  ('Ontwerp', 'Design'),
  ('Ontwikkeling', 'Development'),
  ('Testing', 'Testing'),
  ('Lancering', 'Launch'),
  ('Onderhoud', 'Maintenance')
ON CONFLICT (name_nl) DO NOTHING;

-- Business tables
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  default_rate_cents INTEGER DEFAULT 7500, -- €75.00 per hour default
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_phases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_id INTEGER NOT NULL REFERENCES phases(id),
  billing_model TEXT NOT NULL CHECK (billing_model IN ('hourly', 'fixed', 'capped')),
  minutes_budget INTEGER,
  rate_cents INTEGER,
  fixed_amount_cents INTEGER,
  cap_minutes INTEGER,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_phase_id UUID REFERENCES project_phases(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS time_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  project_phase_id UUID REFERENCES project_phases(id) ON DELETE SET NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  minutes INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN end_time IS NOT NULL THEN EXTRACT(EPOCH FROM (end_time - start_time)) / 60
      ELSE NULL 
    END
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  total_amount_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  project_phase_id UUID REFERENCES project_phases(id),
  description TEXT NOT NULL,
  minutes INTEGER NOT NULL,
  rate_cents INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  amount_override_cents INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personal health tables
CREATE TABLE IF NOT EXISTS meals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  description TEXT,
  calories INTEGER,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sleep_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, start_time)
);

CREATE TABLE IF NOT EXISTS workouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  intensity TEXT CHECK (intensity IN ('low', 'medium', 'high')),
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS energy_checks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  energy_level INTEGER NOT NULL CHECK (energy_level BETWEEN 1 AND 5),
  mood TEXT,
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS body_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('weight', 'body_fat', 'muscle_mass', 'blood_pressure')),
  value DECIMAL(8,2) NOT NULL,
  unit TEXT NOT NULL,
  measured_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integration tables
CREATE TABLE IF NOT EXISTS calendar_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  sync_enabled BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events_cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  calendar_link_id UUID NOT NULL REFERENCES calendar_links(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  description TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(calendar_link_id, external_id)
);

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  timezone TEXT DEFAULT 'UTC',
  default_rate_cents INTEGER DEFAULT 7500,
  work_hours_start TIME DEFAULT '09:00',
  work_hours_end TIME DEFAULT '17:00',
  notification_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_id setting trigger function
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to user tables
DROP TRIGGER IF EXISTS set_user_id_projects ON projects;
CREATE TRIGGER set_user_id_projects
  BEFORE INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_tasks ON tasks;
CREATE TRIGGER set_user_id_tasks
  BEFORE INSERT ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_time_entries ON time_entries;
CREATE TRIGGER set_user_id_time_entries
  BEFORE INSERT ON time_entries
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_invoices ON invoices;
CREATE TRIGGER set_user_id_invoices
  BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_meals ON meals;
CREATE TRIGGER set_user_id_meals
  BEFORE INSERT ON meals
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_sleep_sessions ON sleep_sessions;
CREATE TRIGGER set_user_id_sleep_sessions
  BEFORE INSERT ON sleep_sessions
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_workouts ON workouts;
CREATE TRIGGER set_user_id_workouts
  BEFORE INSERT ON workouts
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_energy_checks ON energy_checks;
CREATE TRIGGER set_user_id_energy_checks
  BEFORE INSERT ON energy_checks
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_body_metrics ON body_metrics;
CREATE TRIGGER set_user_id_body_metrics
  BEFORE INSERT ON body_metrics
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_calendar_links ON calendar_links;
CREATE TRIGGER set_user_id_calendar_links
  BEFORE INSERT ON calendar_links
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_user_settings ON user_settings;
CREATE TRIGGER set_user_id_user_settings
  BEFORE INSERT ON user_settings
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- Invoice item amount calculation trigger
CREATE OR REPLACE FUNCTION set_invoice_item_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.amount_cents := COALESCE(NEW.amount_override_cents, (NEW.minutes * NEW.rate_cents / 60)::INTEGER);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_invoice_item_amount_trigger ON invoice_items;
CREATE TRIGGER set_invoice_item_amount_trigger
  BEFORE INSERT OR UPDATE ON invoice_items
  FOR EACH ROW EXECUTE FUNCTION set_invoice_item_amount();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_phases_project_id ON project_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_phase_id ON tasks(project_phase_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project_phase_id ON time_entries(project_phase_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_start_time ON time_entries(start_time);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
