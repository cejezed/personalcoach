-- Row Level Security policies migration

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE events_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Phases table policies (read-only for authenticated users)
DROP POLICY IF EXISTS "Users can read phases" ON phases;
CREATE POLICY "Users can read phases" ON phases
  FOR SELECT TO authenticated
  USING (true);

-- Projects policies
DROP POLICY IF EXISTS "Users can manage own projects" ON projects;
CREATE POLICY "Users can manage own projects" ON projects
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Project phases policies
DROP POLICY IF EXISTS "Users can manage project phases for own projects" ON project_phases;
CREATE POLICY "Users can manage project phases for own projects" ON project_phases
  FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Tasks policies
DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;
CREATE POLICY "Users can manage own tasks" ON tasks
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Time entries policies
DROP POLICY IF EXISTS "Users can manage own time entries" ON time_entries;
CREATE POLICY "Users can manage own time entries" ON time_entries
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Invoices policies
DROP POLICY IF EXISTS "Users can manage own invoices" ON invoices;
CREATE POLICY "Users can manage own invoices" ON invoices
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Invoice items policies
DROP POLICY IF EXISTS "Users can manage invoice items for own invoices" ON invoice_items;
CREATE POLICY "Users can manage invoice items for own invoices" ON invoice_items
  FOR ALL TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id = auth.uid()
    )
  );

-- Health data policies
DROP POLICY IF EXISTS "Users can manage own meals" ON meals;
CREATE POLICY "Users can manage own meals" ON meals
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own sleep sessions" ON sleep_sessions;
CREATE POLICY "Users can manage own sleep sessions" ON sleep_sessions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own workouts" ON workouts;
CREATE POLICY "Users can manage own workouts" ON workouts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own energy checks" ON energy_checks;
CREATE POLICY "Users can manage own energy checks" ON energy_checks
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own body metrics" ON body_metrics;
CREATE POLICY "Users can manage own body metrics" ON body_metrics
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Integration policies
DROP POLICY IF EXISTS "Users can manage own calendar links" ON calendar_links;
CREATE POLICY "Users can manage own calendar links" ON calendar_links
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage events for own calendar links" ON events_cache;
CREATE POLICY "Users can manage events for own calendar links" ON events_cache
  FOR ALL TO authenticated
  USING (
    calendar_link_id IN (
      SELECT id FROM calendar_links WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    calendar_link_id IN (
      SELECT id FROM calendar_links WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage own settings" ON user_settings;
CREATE POLICY "Users can manage own settings" ON user_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
