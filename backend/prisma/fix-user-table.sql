-- Fix User table schema to match Prisma schema
-- Add missing columns

-- Check current columns first
DO $$
BEGIN
    -- Add position column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'position') THEN
        ALTER TABLE "User" ADD COLUMN "position" TEXT;
    END IF;

    -- Add region column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'region') THEN
        ALTER TABLE "User" ADD COLUMN "region" TEXT;
    END IF;

    -- Add grade column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'grade') THEN
        ALTER TABLE "User" ADD COLUMN "grade" TEXT;
    END IF;

    -- Add level column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'level') THEN
        ALTER TABLE "User" ADD COLUMN "level" TEXT;
    END IF;

    -- Add monthlyCost column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'monthlyCost') THEN
        ALTER TABLE "User" ADD COLUMN "monthlyCost" DECIMAL(10,2);
    END IF;

    -- Add isActive column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'isActive') THEN
        ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN DEFAULT true;
    END IF;
END $$;
