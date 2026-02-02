-- Fix Client table to match current schema
ALTER TABLE "Client" RENAME COLUMN "contact" TO "contactName";
ALTER TABLE "Client" RENAME COLUMN "email" TO "contactEmail";
ALTER TABLE "Client" RENAME COLUMN "phone" TO "contactPhone";
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

-- Fix updatedAt column to have default value
ALTER TABLE "Client" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- Insert mock clients with proper timestamps
INSERT INTO "Client" (id, name, "contactEmail", "isActive", "createdAt", "updatedAt") VALUES 
('mock-client-1', 'Mock Client 1', 'client1@example.com', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('mock-client-2', 'Mock Client 2', 'client2@example.com', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
