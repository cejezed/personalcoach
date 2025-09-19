-- Views and RPC functions migration

-- Time aggregation views
CREATE OR REPLACE VIEW v_time_by_project_phase_day AS
SELECT 
  te.user_id,
  pp.project_id,
  pp.phase_id,
  p.name as project_name,
  ph.name_nl as phase_name,
  DATE(te.start_time) as day,
  SUM(te.minutes) as total_minutes,
  COUNT(*) as entry_count
FROM time_entries te
JOIN project_phases pp ON te.project_phase_id = pp.id
JOIN projects p ON pp.project_id = p.id
JOIN phases ph ON pp.phase_id = ph.id
WHERE te.end_time IS NOT NULL
GROUP BY te.user_id, pp.project_id, pp.phase_id, p.name, ph.name_nl, DATE(te.start_time);

CREATE OR REPLACE VIEW v_time_by_project_phase_week AS
SELECT 
  te.user_id,
  pp.project_id,
  pp.phase_id,
  p.name as project_name,
  ph.name_nl as phase_name,
  DATE_TRUNC('week', te.start_time) as week_start,
  SUM(te.minutes) as total_minutes,
  COUNT(*) as entry_count
FROM time_entries te
JOIN project_phases pp ON te.project_phase_id = pp.id
JOIN projects p ON pp.project_id = p.id
JOIN phases ph ON pp.phase_id = ph.id
WHERE te.end_time IS NOT NULL
GROUP BY te.user_id, pp.project_id, pp.phase_id, p.name, ph.name_nl, DATE_TRUNC('week', te.start_time);

CREATE OR REPLACE VIEW v_time_by_project_phase_month AS
SELECT 
  te.user_id,
  pp.project_id,
  pp.phase_id,
  p.name as project_name,
  ph.name_nl as phase_name,
  DATE_TRUNC('month', te.start_time) as month_start,
  SUM(te.minutes) as total_minutes,
  COUNT(*) as entry_count
FROM time_entries te
JOIN project_phases pp ON te.project_phase_id = pp.id
JOIN projects p ON pp.project_id = p.id
JOIN phases ph ON pp.phase_id = ph.id
WHERE te.end_time IS NOT NULL
GROUP BY te.user_id, pp.project_id, pp.phase_id, p.name, ph.name_nl, DATE_TRUNC('month', te.start_time);

-- Basic billing status view
CREATE OR REPLACE VIEW v_billing_status_by_project_phase AS
SELECT 
  pp.id as project_phase_id,
  pp.project_id,
  p.name as project_name,
  ph.name_nl as phase_name,
  pp.billing_model,
  pp.minutes_budget,
  pp.rate_cents,
  pp.fixed_amount_cents,
  pp.cap_minutes,
  COALESCE(SUM(te.minutes), 0) as total_logged_minutes,
  COUNT(te.id) as total_entries
FROM project_phases pp
JOIN projects p ON pp.project_id = p.id
JOIN phases ph ON pp.phase_id = ph.id
LEFT JOIN time_entries te ON pp.id = te.project_phase_id AND te.end_time IS NOT NULL
GROUP BY pp.id, pp.project_id, p.name, ph.name_nl, pp.billing_model, pp.minutes_budget, pp.rate_cents, pp.fixed_amount_cents, pp.cap_minutes;

-- Time summary RPC function
CREATE OR REPLACE FUNCTION report_time_summary(
  grouping TEXT DEFAULT 'day',
  project_filter UUID DEFAULT NULL,
  phase_filter INTEGER DEFAULT NULL,
  from_date DATE DEFAULT NULL,
  to_date DATE DEFAULT NULL
)
RETURNS TABLE (
  project_id UUID,
  project_name TEXT,
  phase_id INTEGER,
  phase_name TEXT,
  period TEXT,
  total_minutes BIGINT,
  entry_count BIGINT
) SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Set default date range if not provided
  IF from_date IS NULL THEN
    from_date := CURRENT_DATE - INTERVAL '30 days';
  END IF;
  
  IF to_date IS NULL THEN
    to_date := CURRENT_DATE;
  END IF;

  -- Validate grouping parameter
  IF grouping NOT IN ('day', 'week', 'month') THEN
    RAISE EXCEPTION 'Invalid grouping. Must be day, week, or month.';
  END IF;

  RETURN QUERY
  SELECT 
    v.project_id,
    v.project_name,
    v.phase_id,
    v.phase_name,
    CASE 
      WHEN grouping = 'day' THEN v.day::TEXT
      WHEN grouping = 'week' THEN v.week_start::TEXT
      WHEN grouping = 'month' THEN v.month_start::TEXT
    END as period,
    v.total_minutes,
    v.entry_count
  FROM (
    SELECT project_id, project_name, phase_id, phase_name, day::TEXT as day, 
           week_start::TEXT, month_start::TEXT, total_minutes, entry_count
    FROM v_time_by_project_phase_day
    WHERE user_id = auth.uid()
      AND (project_filter IS NULL OR project_id = project_filter)
      AND (phase_filter IS NULL OR phase_id = phase_filter)
      AND day BETWEEN from_date AND to_date
    
    UNION ALL
    
    SELECT project_id, project_name, phase_id, phase_name, day::TEXT, 
           week_start::TEXT, month_start::TEXT, total_minutes, entry_count
    FROM v_time_by_project_phase_week
    WHERE user_id = auth.uid()
      AND (project_filter IS NULL OR project_id = project_filter)
      AND (phase_filter IS NULL OR phase_id = phase_filter)
      AND week_start::DATE BETWEEN from_date AND to_date
    
    UNION ALL
    
    SELECT project_id, project_name, phase_id, phase_name, day::TEXT, 
           week_start::TEXT, month_start::TEXT, total_minutes, entry_count
    FROM v_time_by_project_phase_month
    WHERE user_id = auth.uid()
      AND (project_filter IS NULL OR project_id = project_filter)
      AND (phase_filter IS NULL OR phase_id = phase_filter)
      AND month_start::DATE BETWEEN from_date AND to_date
  ) v
  WHERE 
    CASE 
      WHEN grouping = 'day' THEN v.day IS NOT NULL
      WHEN grouping = 'week' THEN v.week_start IS NOT NULL
      WHEN grouping = 'month' THEN v.month_start IS NOT NULL
    END;
END;
$$;
