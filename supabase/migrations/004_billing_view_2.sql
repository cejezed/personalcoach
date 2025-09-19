-- Enhanced billing view with project default rate and effective rates

-- Update projects table to ensure default_rate_cents exists
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS default_rate_cents INTEGER DEFAULT 7500;

-- Enhanced billing status view with effective rates and open billing calculation
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
  p.default_rate_cents,
  -- Calculate effective rate (phase rate or project default)
  COALESCE(pp.rate_cents, p.default_rate_cents) as effective_rate_cents,
  COALESCE(SUM(te.minutes), 0) as total_logged_minutes,
  COUNT(te.id) as total_entries,
  -- Calculate minutes that haven't been invoiced yet
  COALESCE(SUM(te.minutes), 0) - COALESCE(
    (SELECT SUM(ii.minutes) 
     FROM invoice_items ii 
     JOIN invoices i ON ii.invoice_id = i.id 
     WHERE ii.project_phase_id = pp.id 
     AND i.status != 'cancelled'), 0
  ) as minutes_open,
  -- Calculate open billing amount based on billing model
  CASE 
    WHEN pp.billing_model = 'hourly' THEN
      (COALESCE(SUM(te.minutes), 0) - COALESCE(
        (SELECT SUM(ii.minutes) 
         FROM invoice_items ii 
         JOIN invoices i ON ii.invoice_id = i.id 
         WHERE ii.project_phase_id = pp.id 
         AND i.status != 'cancelled'), 0
      )) * COALESCE(pp.rate_cents, p.default_rate_cents) / 60
    WHEN pp.billing_model = 'fixed' THEN
      CASE 
        WHEN pp.status = 'completed' AND NOT EXISTS (
          SELECT 1 FROM invoice_items ii 
          JOIN invoices i ON ii.invoice_id = i.id 
          WHERE ii.project_phase_id = pp.id 
          AND i.status != 'cancelled'
        ) THEN pp.fixed_amount_cents
        ELSE 0
      END
    WHEN pp.billing_model = 'capped' THEN
      LEAST(
        (COALESCE(SUM(te.minutes), 0) - COALESCE(
          (SELECT SUM(ii.minutes) 
           FROM invoice_items ii 
           JOIN invoices i ON ii.invoice_id = i.id 
           WHERE ii.project_phase_id = pp.id 
           AND i.status != 'cancelled'), 0
        )) * COALESCE(pp.rate_cents, p.default_rate_cents) / 60,
        pp.fixed_amount_cents
      )
    ELSE 0
  END as amount_open_cents
FROM project_phases pp
JOIN projects p ON pp.project_id = p.id
JOIN phases ph ON pp.phase_id = ph.id
LEFT JOIN time_entries te ON pp.id = te.project_phase_id AND te.end_time IS NOT NULL
GROUP BY 
  pp.id, pp.project_id, p.name, ph.name_nl, pp.billing_model, 
  pp.minutes_budget, pp.rate_cents, pp.fixed_amount_cents, pp.cap_minutes,
  p.default_rate_cents, pp.status;
