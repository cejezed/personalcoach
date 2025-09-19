-- Workouts and steps tracking migration

-- Workout activities lookup table
CREATE TABLE IF NOT EXISTS workout_activities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  is_basic BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default workout activities
INSERT INTO workout_activities (name, category, is_basic) VALUES
  ('Walking', 'Cardio', TRUE),
  ('Running', 'Cardio', TRUE),
  ('Cycling', 'Cardio', TRUE),
  ('Swimming', 'Cardio', TRUE),
  ('Push-ups', 'Strength', TRUE),
  ('Pull-ups', 'Strength', TRUE),
  ('Squats', 'Strength', TRUE),
  ('Planks', 'Strength', TRUE),
  ('Yoga', 'Flexibility', TRUE),
  ('Stretching', 'Flexibility', TRUE),
  ('Golf', 'Sports', FALSE),
  ('Mountain Biking', 'Sports', FALSE),
  ('Weight Training', 'Strength', FALSE),
  ('HIIT', 'Cardio', FALSE),
  ('Meditation', 'Wellness', FALSE)
ON CONFLICT (name) DO NOTHING;

-- Daily workout summary (unique per user + day)
CREATE TABLE IF NOT EXISTS daily_workouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  workout_date DATE NOT NULL,
  total_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, workout_date)
);

-- Individual workout items for each day
CREATE TABLE IF NOT EXISTS daily_workout_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  daily_workout_id UUID NOT NULL REFERENCES daily_workouts(id) ON DELETE CASCADE,
  activity_id INTEGER NOT NULL REFERENCES workout_activities(id),
  minutes INTEGER,
  reps INTEGER,
  intensity TEXT CHECK (intensity IN ('low', 'medium', 'high')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Steps tracking (unique per user + day + source)
CREATE TABLE IF NOT EXISTS steps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  step_date DATE NOT NULL,
  step_count INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, step_date, source)
);

-- Steps summary view (last 30 days)
CREATE OR REPLACE VIEW v_steps_last30 AS
SELECT 
  user_id,
  step_date,
  SUM(step_count) as total_steps,
  array_agg(DISTINCT source) as sources
FROM steps
WHERE step_date >= CURRENT_DATE - INTERVAL '30 days'
  AND user_id = auth.uid()
GROUP BY user_id, step_date
ORDER BY step_date DESC;

-- Workout summary view (last 30 days)
CREATE OR REPLACE VIEW v_workout_summary_last30 AS
SELECT 
  dw.user_id,
  dw.workout_date,
  dw.total_minutes,
  COUNT(dwi.id) as activity_count,
  array_agg(DISTINCT wa.name) as activities,
  dw.notes
FROM daily_workouts dw
LEFT JOIN daily_workout_items dwi ON dw.id = dwi.daily_workout_id
LEFT JOIN workout_activities wa ON dwi.activity_id = wa.id
WHERE dw.workout_date >= CURRENT_DATE - INTERVAL '30 days'
  AND dw.user_id = auth.uid()
GROUP BY dw.id, dw.user_id, dw.workout_date, dw.total_minutes, dw.notes
ORDER BY dw.workout_date DESC;

-- Bulk upsert steps function
CREATE OR REPLACE FUNCTION upsert_steps_bulk(steps_data JSONB)
RETURNS INTEGER SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  inserted_count INTEGER := 0;
  step_record JSONB;
BEGIN
  -- Validate input
  IF steps_data IS NULL OR jsonb_array_length(steps_data) = 0 THEN
    RETURN 0;
  END IF;

  -- Process each step record
  FOR step_record IN SELECT * FROM jsonb_array_elements(steps_data)
  LOOP
    INSERT INTO steps (user_id, step_date, step_count, source)
    VALUES (
      auth.uid(),
      (step_record->>'date')::DATE,
      (step_record->>'steps')::INTEGER,
      COALESCE(step_record->>'source', 'import')
    )
    ON CONFLICT (user_id, step_date, source) 
    DO UPDATE SET 
      step_count = EXCLUDED.step_count,
      updated_at = NOW();
    
    inserted_count := inserted_count + 1;
  END LOOP;

  RETURN inserted_count;
END;
$$;

-- Apply user_id triggers to new tables
DROP TRIGGER IF EXISTS set_user_id_daily_workouts ON daily_workouts;
CREATE TRIGGER set_user_id_daily_workouts
  BEFORE INSERT ON daily_workouts
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_steps ON steps;
CREATE TRIGGER set_user_id_steps
  BEFORE INSERT ON steps
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- RLS policies for new tables
ALTER TABLE workout_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_workout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;

-- Workout activities are readable by all authenticated users
DROP POLICY IF EXISTS "Users can read workout activities" ON workout_activities;
CREATE POLICY "Users can read workout activities" ON workout_activities
  FOR SELECT TO authenticated
  USING (true);

-- Daily workouts policies
DROP POLICY IF EXISTS "Users can manage own daily workouts" ON daily_workouts;
CREATE POLICY "Users can manage own daily workouts" ON daily_workouts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Daily workout items policies
DROP POLICY IF EXISTS "Users can manage workout items for own daily workouts" ON daily_workout_items;
CREATE POLICY "Users can manage workout items for own daily workouts" ON daily_workout_items
  FOR ALL TO authenticated
  USING (
    daily_workout_id IN (
      SELECT id FROM daily_workouts WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    daily_workout_id IN (
      SELECT id FROM daily_workouts WHERE user_id = auth.uid()
    )
  );

-- Steps policies
DROP POLICY IF EXISTS "Users can manage own steps" ON steps;
CREATE POLICY "Users can manage own steps" ON steps
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_workouts_user_date ON daily_workouts(user_id, workout_date);
CREATE INDEX IF NOT EXISTS idx_daily_workout_items_daily_workout_id ON daily_workout_items(daily_workout_id);
CREATE INDEX IF NOT EXISTS idx_steps_user_date ON steps(user_id, step_date);
CREATE INDEX IF NOT EXISTS idx_steps_date_range ON steps(step_date) WHERE step_date >= CURRENT_DATE - INTERVAL '30 days';
