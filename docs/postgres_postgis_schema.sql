-- SecureSight PostgreSQL/PostGIS domain schema blueprint.
-- This is migration-ready SQL for the production persistence milestone.
-- The current WebDev runtime remains MySQL-backed for auth; do not claim this file is applied.
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE securesight_role AS ENUM ('DEPARTMENT_ADMIN', 'PMU_INSPECTOR', 'INSTITUTE_ADMIN', 'AUDITOR');
CREATE TYPE inspection_status AS ENUM ('PENDING', 'ASSIGNMENT_PENDING', 'ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'VERIFICATION_PENDING', 'VERIFIED', 'FLAGGED', 'CLOSED');
CREATE TYPE assignment_status AS ENUM ('CREATED', 'SEALED', 'REVEALED', 'COMPLETED');
CREATE TYPE alert_status AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

CREATE TABLE IF NOT EXISTS securesight_users (
  id BIGSERIAL PRIMARY KEY,
  auth_subject TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role securesight_role NOT NULL,
  organization_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS institutes (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  scheme TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  location GEOGRAPHY(Point, 4326) NOT NULL,
  beneficiary_count INTEGER NOT NULL DEFAULT 0,
  cctv_provider TEXT NOT NULL DEFAULT 'DEMO',
  cctv_config_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS institutes_location_gix ON institutes USING GIST (location);

CREATE TABLE IF NOT EXISTS inspections (
  id TEXT PRIMARY KEY,
  institute_id TEXT NOT NULL REFERENCES institutes(id),
  status inspection_status NOT NULL,
  inspector_user_id BIGINT REFERENCES securesight_users(id),
  risk_score INTEGER,
  risk_level TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  inspection_id TEXT NOT NULL UNIQUE REFERENCES inspections(id),
  inspector_user_id BIGINT NOT NULL REFERENCES securesight_users(id),
  status assignment_status NOT NULL,
  selection_commitment TEXT NOT NULL,
  sealed_at TIMESTAMPTZ,
  revealed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  inspection_id TEXT NOT NULL REFERENCES inspections(id),
  storage_key TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  captured_location GEOGRAPHY(Point, 4326),
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  created_by BIGINT NOT NULL REFERENCES securesight_users(id),
  verification_status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id BIGSERIAL PRIMARY KEY,
  institute_id TEXT NOT NULL REFERENCES institutes(id),
  observed_on DATE NOT NULL,
  expected_count INTEGER NOT NULL,
  observed_count INTEGER NOT NULL,
  source TEXT NOT NULL,
  anomaly_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS risk_analyses (
  id BIGSERIAL PRIMARY KEY,
  inspection_id TEXT NOT NULL REFERENCES inspections(id),
  risk_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  risk_factors JSONB NOT NULL,
  explanation TEXT NOT NULL,
  model_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  inspection_id TEXT REFERENCES inspections(id),
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  status alert_status NOT NULL DEFAULT 'OPEN',
  assigned_to BIGINT REFERENCES securesight_users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  actor_user_id BIGINT REFERENCES securesight_users(id),
  payload JSONB NOT NULL,
  previous_hash TEXT,
  current_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vc_sessions (
  id TEXT PRIMARY KEY,
  inspection_id TEXT REFERENCES inspections(id),
  participant_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
