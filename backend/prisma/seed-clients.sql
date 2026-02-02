INSERT INTO "Client" (id, name, "isActive") VALUES 
('mock-client-1', 'Mock Client 1', true),
('mock-client-2', 'Mock Client 2', true)
ON CONFLICT DO NOTHING;
