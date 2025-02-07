-- Analysis jobs table
CREATE TABLE analysis_jobs (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  status TEXT NOT NULL,
  progress FLOAT,
  result JSONB,
  error TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  source_html TEXT,
  screenshot_data TEXT,
  screenshot_url TEXT,
  metadata JSONB
);

-- Error logging
CREATE TABLE errors (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  stack TEXT,
  context JSONB,
  timestamp TIMESTAMP NOT NULL,
  version TEXT,
  environment TEXT,
  url TEXT,
  user_agent TEXT
);

-- Create indexes
CREATE INDEX idx_jobs_status ON analysis_jobs(status);
CREATE INDEX idx_jobs_created_at ON analysis_jobs(created_at);
CREATE INDEX idx_errors_timestamp ON errors(timestamp);

-- Analysis logs table
CREATE TABLE analysis_logs (
  id BIGSERIAL PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  
  -- Index for faster lookups by job
  INDEX idx_analysis_logs_job (job_id)
);

-- Add permissions
ALTER TABLE analysis_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON analysis_logs
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for service role only" ON analysis_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Make sure these policies exist
ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON analysis_jobs
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for service role only" ON analysis_jobs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable update for service role only" ON analysis_jobs
  FOR UPDATE WITH CHECK (auth.role() = 'service_role'); 