-- Remove the unique constraint that includes user_id
DROP CONSTRAINT IF EXISTS batches_user_id_batch_number_key ON public.batches;

-- Add a new unique constraint for sku_id, batch_number, and date (not user_id)
-- This ensures batch numbers are unique per SKU per day across all users
ALTER TABLE public.batches 
ADD CONSTRAINT batches_sku_date_batch_unique 
UNIQUE (sku_id, batch_number, DATE(created_at));

-- Update the generate_batch_number function to be more robust for concurrency
CREATE OR REPLACE FUNCTION public.generate_batch_number(_sku_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  batch_count integer;
  batch_number text;
  max_attempts integer := 10;
  attempt integer := 0;
BEGIN
  LOOP
    -- Count batches for this SKU created today
    SELECT COUNT(*) INTO batch_count
    FROM public.batches
    WHERE sku_id = _sku_id
      AND DATE(created_at) = CURRENT_DATE;
    
    -- Generate next batch number (001, 002, etc.)
    batch_number := LPAD((batch_count + 1)::text, 3, '0');
    
    -- Check if this batch number already exists for today
    IF NOT EXISTS (
      SELECT 1 FROM public.batches 
      WHERE sku_id = _sku_id 
        AND batch_number = batch_number 
        AND DATE(created_at) = CURRENT_DATE
    ) THEN
      RETURN batch_number;
    END IF;
    
    -- If we reach here, there was a collision, increment attempt
    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique batch number after % attempts', max_attempts;
    END IF;
    
    -- Small delay to reduce contention
    PERFORM pg_sleep(0.01);
  END LOOP;
END;
$function$;