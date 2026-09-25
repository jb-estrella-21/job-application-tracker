CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'LEFT', 'TERMINATED');

ALTER TABLE "job_applications"
  ADD COLUMN "employment_status" "EmploymentStatus",
  ADD COLUMN "employment_ended_at" TIMESTAMP(3);

UPDATE "job_applications"
SET "employment_status" = 'ACTIVE'
WHERE "status" = 'HIRED' AND "employment_status" IS NULL;
