-- Invoice generation RPC function

CREATE OR REPLACE FUNCTION create_invoice_from_open(
  project_filter UUID,
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE DEFAULT NULL,
  invoice_number TEXT DEFAULT NULL,
  phase_filters UUID[] DEFAULT NULL
)
RETURNS UUID SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  new_invoice_id UUID;
  invoice_num TEXT;
  phase_record RECORD;
  total_amount INTEGER := 0;
BEGIN
  -- Validate user has access to project
  IF NOT EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_filter AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Project not found or access denied';
  END IF;

  -- Generate invoice number if not provided
  IF invoice_number IS NULL THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+') AS INTEGER)), 0) + 1
    INTO invoice_num
    FROM invoices 
    WHERE user_id = auth.uid();
    
    invoice_num := 'INV-' || LPAD(invoice_num::TEXT, 4, '0');
  ELSE
    invoice_num := invoice_number;
  END IF;

  -- Set default due date
  IF due_date IS NULL THEN
    due_date := issue_date + INTERVAL '30 days';
  END IF;

  -- Create invoice
  INSERT INTO invoices (user_id, project_id, invoice_number, issue_date, due_date, status, total_amount_cents)
  VALUES (auth.uid(), project_filter, invoice_num, issue_date, due_date, 'draft', 0)
  RETURNING id INTO new_invoice_id;

  -- Add invoice items for each project phase with open billing
  FOR phase_record IN 
    SELECT 
      project_phase_id,
      phase_name,
      minutes_open,
      effective_rate_cents,
      amount_open_cents
    FROM v_billing_status_by_project_phase
    WHERE project_id = project_filter
      AND minutes_open > 0
      AND amount_open_cents > 0
      AND (phase_filters IS NULL OR project_phase_id = ANY(phase_filters))
  LOOP
    INSERT INTO invoice_items (
      invoice_id, 
      project_phase_id, 
      description, 
      minutes, 
      rate_cents,
      amount_cents
    ) VALUES (
      new_invoice_id,
      phase_record.project_phase_id,
      phase_record.phase_name || ' - Time entries',
      phase_record.minutes_open,
      phase_record.effective_rate_cents,
      phase_record.amount_open_cents
    );
    
    total_amount := total_amount + phase_record.amount_open_cents;
  END LOOP;

  -- Update invoice total
  UPDATE invoices 
  SET total_amount_cents = total_amount
  WHERE id = new_invoice_id;

  -- Return the invoice ID
  RETURN new_invoice_id;
END;
$$;
