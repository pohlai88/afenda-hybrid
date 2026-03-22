-- Initialize PostgreSQL extensions required for AFENDA schema tests
-- This script runs automatically when the test database container starts

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verify extensions are installed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'btree_gist') THEN
    RAISE EXCEPTION 'btree_gist extension not installed';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    RAISE EXCEPTION 'pgcrypto extension not installed';
  END IF;
  
  RAISE NOTICE 'All required extensions installed successfully';
END $$;
