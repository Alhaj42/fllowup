-- T129: Optimize project list queries with database indexes
-- Composite indexes for common query patterns

-- Index for project list queries with status and date filters
CREATE INDEX IF NOT EXISTS "idx_project_status_dates" ON "Project"("status", "startDate", "estimatedEndDate");

-- Index for project queries by client and status
CREATE INDEX IF NOT EXISTS "idx_project_client_status" ON "Project"("clientId", "status");

-- Index for phase queries with project and status
CREATE INDEX IF NOT EXISTS "idx_phase_project_status" ON "Phase"("projectId", "status");

-- Index for task queries by status and assigned member
CREATE INDEX IF NOT EXISTS "idx_task_status_assigned" ON "Task"("status", "assignedTeamMemberId");

-- Index for assignment queries by team member and active status
CREATE INDEX IF NOT EXISTS "idx_assignment_member_active" ON "Assignment"("teamMemberId", "isActive", "startDate", "endDate");

-- Index for audit log queries for performance monitoring
CREATE INDEX IF NOT EXISTS "idx_audit_entity_timestamp" ON "AuditLog"("entityType", "entityId", "timestamp");

-- Index for KPI entries by employee and period
CREATE INDEX IF NOT EXISTS "idx_kpi_employee_period" ON "KPIEntry"("employeeId", "period");

-- Full-text search index for project names (PostgreSQL)
CREATE INDEX IF NOT EXISTS "idx_project_name_fts" ON "Project" USING gin(to_tsvector('english', "name"));

-- Full-text search index for project descriptions
CREATE INDEX IF NOT EXISTS "idx_project_description_fts" ON "Project" USING gin(to_tsvector('english', "requirements"));
