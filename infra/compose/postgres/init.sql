-- One database per service to allow independent migrations & schema ownership.
-- All databases share the same Postgres cluster in dev; in production each
-- service connects with its own role (no BYPASSRLS) to enforce RLS.

CREATE DATABASE identity_dev;
CREATE DATABASE billing_dev;
CREATE DATABASE notifier_dev;
CREATE DATABASE audit_dev;
CREATE DATABASE eld_dev;

-- Extensions per service DB.
\connect identity_dev
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

\connect billing_dev
CREATE EXTENSION IF NOT EXISTS pgcrypto;

\connect notifier_dev
CREATE EXTENSION IF NOT EXISTS pgcrypto;

\connect audit_dev
CREATE EXTENSION IF NOT EXISTS pgcrypto;

\connect eld_dev
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;  -- for geofence dwell checks (Phase 2)
