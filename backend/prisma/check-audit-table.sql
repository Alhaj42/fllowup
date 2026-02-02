-- Check if AuditLog table exists and its actual name
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name ILIKE '%audit%';
