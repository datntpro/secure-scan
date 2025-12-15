-- Initialize SecureScan.vn database

-- Create database if not exists
SELECT 'CREATE DATABASE securescan_dev'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'securescan_dev')\gexec

-- Connect to the database
\c securescan_dev;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance
-- These will be created by SQLAlchemy, but we can add custom ones here

-- Full text search index for findings
-- CREATE INDEX IF NOT EXISTS idx_findings_fts ON findings USING gin(to_tsvector('english', title || ' ' || description));

-- Composite indexes for common queries
-- CREATE INDEX IF NOT EXISTS idx_scans_user_status ON scans(user_id, status);
-- CREATE INDEX IF NOT EXISTS idx_findings_scan_severity ON findings(scan_id, severity);

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE securescan_dev TO securescan;