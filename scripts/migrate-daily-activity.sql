-- Migration: Add daily activity enhancements
-- This migration adds fields for enhanced daily activity functionality

-- Add new fields to activity_details table
ALTER TABLE "activity_details" 
  DROP COLUMN IF EXISTS "startTime",
  DROP COLUMN IF EXISTS "endTime",
  ADD COLUMN "startDateTime" TIMESTAMP,
  ADD COLUMN "endDateTime" TIMESTAMP,
  ADD COLUMN "object" VARCHAR(255),
  ADD COLUMN "cause" TEXT,
  ADD COLUMN "effect" TEXT,
  ADD COLUMN "createdById" INTEGER NOT NULL DEFAULT 1;

-- Add foreign key constraint for createdById
ALTER TABLE "activity_details" 
  ADD CONSTRAINT "activity_details_createdById_fkey" 
  FOREIGN KEY ("createdById") REFERENCES "users"("id");

-- Add lastUpdatedById to operational_reports table
ALTER TABLE "operational_reports" 
  ADD COLUMN "lastUpdatedById" INTEGER;

-- Add foreign key constraint for lastUpdatedById
ALTER TABLE "operational_reports" 
  ADD CONSTRAINT "operational_reports_lastUpdatedById_fkey" 
  FOREIGN KEY ("lastUpdatedById") REFERENCES "users"("id");

-- Create index for better performance
CREATE INDEX IF NOT EXISTS "activity_details_createdById_idx" ON "activity_details"("createdById");
CREATE INDEX IF NOT EXISTS "operational_reports_lastUpdatedById_idx" ON "operational_reports"("lastUpdatedById");
