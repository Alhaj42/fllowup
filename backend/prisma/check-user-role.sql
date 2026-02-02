-- Check and create UserRole enum if needed
DO $$
BEGIN
    -- Check if UserRole enum exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
        CREATE TYPE "UserRole" AS ENUM ('MANAGER', 'TEAM_LEADER', 'TEAM_MEMBER');
    END IF;
END $$;

-- If User table uses a different enum or text, we might need to alter it
-- First check what type the role column is
SELECT data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'role';
