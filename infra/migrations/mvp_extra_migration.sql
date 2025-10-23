-- Extra safety indexes/triggers (add to your migrations if not present)

-- Only one current visa record per (citizenship, destination)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_current_visa_pair
ON visa_requirements (citizenship_code, destination_code)
WHERE is_current = TRUE;

-- Ensure trip dates are valid
ALTER TABLE trips
  ADD CONSTRAINT IF NOT EXISTS chk_trip_dates CHECK (start_date <= end_date);

-- Auto-hash visa content (requires function generate_visa_hash(...) to exist)
CREATE OR REPLACE FUNCTION set_visa_hash() RETURNS TRIGGER AS $$
BEGIN
  NEW.content_hash := generate_visa_hash(
    NEW.citizenship_code, NEW.destination_code,
    NEW.visa_required, NEW.visa_type, NEW.max_stay_days, NEW.cost_usd
  );
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_visa_hash ON visa_requirements;
CREATE TRIGGER trg_set_visa_hash
BEFORE INSERT OR UPDATE ON visa_requirements
FOR EACH ROW EXECUTE FUNCTION set_visa_hash();
