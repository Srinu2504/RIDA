import pg from "pg";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env");
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env optional if DATABASE_URL already set
  }
}

loadEnv();

const sql = `
ALTER TABLE doctor_profiles ADD COLUMN IF NOT EXISTS field_of_study text;
ALTER TABLE doctor_profiles ADD COLUMN IF NOT EXISTS study_year_started integer;
ALTER TABLE doctor_profiles ADD COLUMN IF NOT EXISTS study_year_ending integer;
ALTER TABLE doctor_profiles ADD COLUMN IF NOT EXISTS university text;
ALTER TABLE doctor_profiles ADD COLUMN IF NOT EXISTS college text;
`;

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  await client.query(sql);
  console.log("Student profile columns added successfully.");
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exit(1);
} finally {
  await client.end();
}
