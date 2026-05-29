ALTER TABLE "doctor_profiles" ADD COLUMN IF NOT EXISTS "field_of_study" text;
--> statement-breakpoint
ALTER TABLE "doctor_profiles" ADD COLUMN IF NOT EXISTS "study_year_started" integer;
--> statement-breakpoint
ALTER TABLE "doctor_profiles" ADD COLUMN IF NOT EXISTS "study_year_ending" integer;
--> statement-breakpoint
ALTER TABLE "doctor_profiles" ADD COLUMN IF NOT EXISTS "university" text;
--> statement-breakpoint
ALTER TABLE "doctor_profiles" ADD COLUMN IF NOT EXISTS "college" text;
