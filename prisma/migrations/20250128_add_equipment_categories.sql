-- Migration: Add Equipment Categories
-- Date: 2025-01-28

-- Create equipment categories table
CREATE TABLE "equipment_categories" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(100) UNIQUE NOT NULL,
    "code" VARCHAR(20) UNIQUE NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX "equipment_categories_name_idx" ON "equipment_categories"("name");

-- Insert default categories based on existing equipment patterns
INSERT INTO "equipment_categories" ("name", "code") VALUES
('Ball Mill', 'BM'),
('Crushing', 'CR'),
('Jumbo Drill', 'JD'),
('Load Haul Dump', 'LHD'),
('Mine Truck', 'MT'),
('Shortcrete', 'SC'),
('Mixer Truck', 'MIX'),
('Trolley Locomotive', 'TL'),
('Backfill Plant', 'BP'),
('Back Fill Dam', 'BFD');

-- Add categoryId column to equipment table
ALTER TABLE "equipment" ADD COLUMN "categoryId" INTEGER;

-- Update existing equipment to match categories
UPDATE "equipment" SET "categoryId" = 1 WHERE "name" LIKE 'Ball Mill%';
UPDATE "equipment" SET "categoryId" = 2 WHERE "name" LIKE 'Crushing%';
UPDATE "equipment" SET "categoryId" = 3 WHERE "name" LIKE 'Jumbo Drill%' OR "code" LIKE '08DR%';
UPDATE "equipment" SET "categoryId" = 4 WHERE "name" LIKE 'Load Haul Dump%' OR "code" LIKE '08LH%';
UPDATE "equipment" SET "categoryId" = 5 WHERE "name" LIKE 'Mine Truck%' OR "code" LIKE '08MT%';
UPDATE "equipment" SET "categoryId" = 6 WHERE "name" LIKE 'Shortcrete%' OR "code" LIKE '08SC%';
UPDATE "equipment" SET "categoryId" = 7 WHERE "name" LIKE 'Mixer Truck%' OR "code" LIKE '08MIX%';
UPDATE "equipment" SET "categoryId" = 8 WHERE "name" LIKE 'Trolley Locomotive%' OR "code" LIKE '08TL%';
UPDATE "equipment" SET "categoryId" = 9 WHERE "name" LIKE 'Backfill Plant%';
UPDATE "equipment" SET "categoryId" = 10 WHERE "name" LIKE 'Back Fill Dam%';

-- Make categoryId required and add foreign key constraint
ALTER TABLE "equipment" ALTER COLUMN "categoryId" SET NOT NULL;
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "equipment_categories"("id");

-- Add index for categoryId
CREATE INDEX "equipment_categoryId_idx" ON "equipment"("categoryId");

-- Remove description column
ALTER TABLE "equipment" DROP COLUMN "description";
