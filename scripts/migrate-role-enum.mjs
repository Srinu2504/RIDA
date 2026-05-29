/**
 * One-time migration: DOCTOR/PATIENT → new role enum values.
 * Run: node --env-file=.env scripts/migrate-role-enum.mjs
 */
import pg from "pg";

const { Pool } = pg;

const sql = `
BEGIN;

ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
ALTER TABLE users ALTER COLUMN role TYPE text USING role::text;
ALTER TABLE otp_tokens ALTER COLUMN role TYPE text USING role::text;

UPDATE users SET role = 'PRACTICING_PHYSICIAN' WHERE role = 'DOCTOR';
UPDATE users SET role = 'MEDICAL_STUDENT' WHERE role = 'PATIENT';
UPDATE otp_tokens SET role = 'PRACTICING_PHYSICIAN' WHERE role = 'DOCTOR';
UPDATE otp_tokens SET role = 'MEDICAL_STUDENT' WHERE role = 'PATIENT';

DROP TYPE IF EXISTS role;

CREATE TYPE role AS ENUM (
  'MEDICAL_STUDENT',
  'PRACTICING_PHYSICIAN',
  'RETIRED_PHYSICIAN'
);

ALTER TABLE users
  ALTER COLUMN role TYPE role USING role::role,
  ALTER COLUMN role SET DEFAULT 'PRACTICING_PHYSICIAN',
  ALTER COLUMN role SET NOT NULL;

ALTER TABLE otp_tokens
  ALTER COLUMN role TYPE role USING role::role,
  ALTER COLUMN role SET NOT NULL;

COMMIT;
`;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  try {
    await pool.query(sql);
    console.log("Role enum migration completed.");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
