This section represents the complete functional and non-functional requirements for the Full SaaS Project Tracking System.

## Functional Requirements

### User Story 1 - Project Tracking Dashboard

Given a logged-in Manager, When they access the dashboard, Then they see all active projects with their status, phases, and team assignments.

- Given a logged-in Manager, When they filter projects by status, Then only matching projects are displayed.
- Given a logged-in Manager, When they click on a project, Then they see detailed project information.
- Given a logged-in Manager, When they view project dashboard, Then they see phase progress and completion status.

### User Story 2 - Project Creation and Management

Given a logged-in Manager, When they create a new project, Then the project is saved with all required fields.

- Given a logged-in Manager, When they create a project with client details, Then the client is linked correctly.
- Given a logged-in Manager, When they create a project with phases, Then they can configure phase names, dates, and assign Team Leaders.
- Given a logged-in Manager, When they update project information, Then the changes are persisted.
- Given a logged-in Manager, When they delete a project, Then it is removed from the database.

### User Story 3 - Team Member Assignment and Allocation

Given a logged-in Manager, When they assign a team member to a project phase, Then the assignment is created with allocation percentage.

- Given a logged-in Manager, When they view team workload, Then they see allocation across all projects.
- Given a logged-in Manager, When allocation exceeds 100%, Then they see a warning and must acknowledge override.
- Given a logged-in Manager, When they assign a Team Leader to a phase, Then the role is set correctly.

### User Story 4 - Task and Phase Management

Given a logged-in Team Leader, When they create tasks for their assigned phase, Then the tasks are saved.

- Given a logged-in Team Leader, When they update task status to COMPLETE, Then the phase progress is recalculated.
- Given a logged-in Team Leader, When all tasks in a phase are COMPLETE, Then the phase status changes to COMPLETE.
- Given a logged-in Team Leader, When they try to complete a phase with incomplete tasks, Then they see an error message.
- Given a logged-in Team Member, When they view tasks, Then they see read-only task information.

### User Story 5 - Project Cost Tracking

Given a logged-in Manager, When they add a cost entry, Then the cost is recorded with category and amount.

- Given a logged-in Manager, When they view cost summary, Then they see total costs broken down by category.
- Given a logged-in Manager, When they add duplicate cost entries, Then the system prevents duplicates.

### User Story 6 - Employee KPIs and Performance Tracking

Given a logged-in Manager, When they add a KPI entry, Then the entry is saved with type and details.

- Given a logged-in Manager, When they view employee KPI summary, Then they see performance metrics.
- Given a logged-in Manager, When they filter KPIs by phase or project, Then only matching entries are displayed.

### User Story 7 - Timeline and Calendar Views

Given a logged-in Manager, When they view timeline, Then they see Gantt chart of all projects.

- Given a logged-in Manager, When they view calendar, Then they see project schedules by date.
- Given a logged-in Manager, When projects overlap, Then they see conflict indicators.

### User Story 8 - Report Generation and Export

Given a logged-in Manager, When they generate a project follow-up report, Then they see a report with project details, phases, and costs.

- Given a logged-in Manager, When they export a report to PDF, Then a PDF file is downloaded.
- Given a logged-in Manager, When they export a report to Excel, Then an Excel file is downloaded.

## Functional Requirements

### User Authentication & Authorization

- **FR-001**: System MUST support three configurable roles: MANAGER (full access), TEAM_LEADER (phase-specific access), TEAM_MEMBER (read-only)
- **FR-002**: System MUST allow Managers to assign Team Members to projects with allocation percentages
- **FR-003**: System MUST allow Team Leaders to manage tasks within their assigned phase(s)
- **FR-004**: System MUST allow Team Members to view project and task information in read-only mode
- **FR-005**: System MUST allow Managers to assign Team Leaders to specific phases via Assignment model with role TEAM_LEADER
- **FR-006**: System MUST track and display team member allocation across multiple projects
- **FR-007**: System MUST warn when team member allocation exceeds 100%
- **FR-008**: System MUST support automatic phase transitions (PLANNED → IN_PROGRESS → COMPLETE) based on task completion
- **FR-009**: System MUST track phase completion status and transitions
- **FR-010**: System MUST allow Team Leaders to create, update, and delete tasks within their assigned phase
- **FR-010a**: Team Leaders MUST have read access to ALL phases within their assigned project
- **FR-010b**: Team Leaders MUST have write access (create/edit/delete tasks, update phase status) ONLY to phases where they are assigned as teamLeaderId
- **FR-010c**: Task assignments MUST validate that assigned team member is assigned to the same phase via Assignment model
- **FR-010a**: Team Leaders MUST have read access to ALL phases within their assigned project
- **FR-010b**: Team Leaders MUST have write access (create/edit/delete tasks, update phase status) ONLY to phases where they are assigned as teamLeaderId
- **FR-011**: System MUST allow Team Leaders to create, update, and delete tasks within their assigned phase
- **FR-012**: System MUST support task duration tracking (in days)
- **FR-013**: System MUST track employee costs (hourly rate × hours worked)
- **FR-014**: System MUST track material costs with description and amount
- **FR-015**: System MUST generate cost summary reports per project
- **FR-016**: System MUST track KPI entries: delayed tasks, client modifications, technical mistakes
- **FR-017**: System MUST provide KPI summaries per employee with filtering by phase/project
- **FR-028**: Phase completion MUST automatically transition next phase from PLANNED to IN_PROGRESS (if exists)
- **FR-029**: Task validation MUST require duration ≥ 0.5 days and ≤ 365 days
- **FR-030**: Task description MUST be between 10-500 characters
- **FR-031**: System MUST return 409 Conflict error on optimistic lock failure with version details
- **FR-032**: System MUST allow allocation >100% with Manager override (requires checkbox acknowledgment) and audit log entry
- **FR-033**: System MUST require at least one phase for project creation; auto-create default "Studies" phase if none specified
- **FR-034**: System MUST display task completion percentage per phase (e.g., "7/10 tasks completed")
- **FR-035**: Manager can force phase completion with incomplete tasks (requires reason entry logged in AuditLog)
- **FR-036**: Performance alerts MUST trigger when endpoint response time >2s

### Edge Cases

### Conflict Handling

- **How does system handle concurrent edits to the same project (optimistic locking)? (FR-031)**
  - When a concurrent edit is detected (version mismatch), system MUST return a 409 Conflict error with details about the conflicting version
  - The frontend MUST display a message: "This project was modified by another user. Please refresh and try again."
  - User can refresh the page to load the latest version and reapply their changes
  - No data loss: the system MUST preserve all user-entered data on the conflict page for re-entry

### Allocation Edge Cases

- **What happens when a team member is assigned >100% allocation across projects?**
  - System MUST display a validation error when allocation >100%: "Team member allocation exceeds 100%. Current total: {current}%. Maximum: 100%."
  - Manager MUST explicitly acknowledge over-allocation by checking "Override allocation limit" checkbox before saving
  - Allocation >100% is recorded in AuditLog with reason "Manager override: allocation limit exceeded"
  - Dashboard shows allocation bar in red when >100% with warning icon
  - Manager can still proceed after checking override checkbox

### Phase Management Edge Cases

- **What happens when a project has no phases configured? (FR-033)**
  - Project creation MUST require at least one phase to be configured
  - If Manager tries to save project with zero phases, system MUST display validation error: "At least one project phase is required."
  - Suggested default: When creating a new project, system MUST auto-create a default "Studies" phase if no phases are specified
  - Existing projects with no phases (edge case) display in dashboard with "No phases configured - please add at least one phase" badge
  - Manager can add phases to existing projects at any time

- **What happens when a Team Leader is assigned to a phase but no Team Members are assigned?**
  - Phase displays with "No team members assigned" badge
  - Team Leader can still create tasks and view phase details
  - Phase status can progress to IN_PROGRESS with just the Team Leader's tasks

### Task Management Edge Cases

- **What happens when a Team Leader tries to complete a phase with incomplete tasks?**
  - System MUST display error: "Cannot complete phase. {count} tasks are still in progress."
  - Dashboard shows task completion percentage for each phase (e.g., "7/10 tasks completed")
  - Phase status changes to IN_PROGRESS only when ALL tasks in that phase have status COMPLETE
  - If subsequent phase exists, it remains PLANNED until previous phase is COMPLETE
  - Manual override option: Manager can force phase completion with reason entry (logged in AuditLog)

### User Role Changes

- **What happens when a user's role is changed (e.g., Team Leader → Manager)?**
  - Role change requires re-authentication
  - Audit log entry: "User role changed from {oldRole} to {newRole} by {managerName}"
  - UI reflects new role immediately after re-authentication
  - Previous permissions revoked immediately

### Date and Timezone Handling

- **What happens when database connection fails during a transaction?**
  - Transaction automatically rolled back
  - User-friendly error: "Unable to save changes. Please try again."
  - Retry with exponential backoff (1s, 2s, 4s)
  - Audit log entry: "Transaction failed: {reason}"

- **What happens when task duration is invalid (negative, zero, or > 365 days)?**
  - Frontend validation: display error "Duration must be between 0.5 and 365 days"
  - Cannot save task until duration is valid
  - Error appears inline with duration input field

- **What happens when task description is empty or exceeds character limits?**
  - Empty description: display error "Task description is required (10-500 characters)"
  - Too short (<10 chars): "Description too short. Minimum: 10 characters"
  - Too long (>500 chars): "Description too long. Maximum: 500 characters. Current: {count}"
  - Character counter shown: "{count}/500"

### Project Deletion Edge Cases

- **What happens when a Team Leader is assigned to a phase but no Team Members are assigned?**
  - Phase displays with "No team members assigned" badge
  - Team Leader can still create tasks and view phase details
  - Phase status can progress to IN_PROGRESS with just the Team Leader's tasks

- **What happens when a Team Leader tries to create tasks in phases they don't lead?**
  - Attempt to access other phases shows read-only view (no edit controls)
  - Display message: "You can only manage tasks in phases you are assigned to lead"
  - Redirect to assigned phases with "View your assigned phases" button

### Cost Entry Edge Cases

- **What happens when a project has no phases configured?**
  - Cost entries can be created for projects without phases (e.g., at project level)

- **What happens when duplicate cost entries are created for the same project?**
  - Cost entries checked for uniqueness on (projectId, phaseId, employeeId, period, type, description)
  - If duplicate detected: display error "This cost entry already exists for this project, period, and employee"
  - Manager can edit existing entry instead
  - Duplicate detection considers date range and category

- **What happens when Auth0 authentication fails or returns an error?**
  - User redirected to login page with error message: "Authentication failed. Please try again."
  - Audit log entry: "Authentication failure: {reason}"
  - Max 3 retry attempts, then lock account for 15 minutes

- **What happens when report generation fails mid-export?**
  - Partial file cleanup: remove incomplete PDF/Excel file
  - Display error: "Report generation failed. Please try again."
  - Retry button available with exponential backoff (1s, 2s, 4s)
  - Audit log entry: "Report generation failed: {reason}"

- **What happens when a task is assigned to a user not assigned to that phase?**
  - Validation error on task save: "Cannot assign task to user who is not assigned to this phase"
  - Show list of team members who ARE assigned to this phase
  - Manager must select a valid team member from dropdown

### Authentication & Security

- **What happens when a user's role is changed (e.g., Team Leader → Manager)?**
  - Role change requires re-authentication
  - Audit log entry: "User role changed from {oldRole} to {newRole} by {managerName}"
  - UI reflects new role immediately after re-authentication
  - Previous permissions revoked immediately

### Data Validation

- **What happens when allocation percentage is invalid (negative or >100)?**
  - Validation error: "Allocation must be between 0 and 100%"
  - Save disabled until valid value entered
  - Inline error message displayed

### Performance & Scalability

- **What happens when a report generation fails mid-export?**
  - Partial file cleanup: remove incomplete PDF/Excel file
  - Display error: "Report generation failed. Please try again."
  - Retry button available with exponential backoff (1s, 2s, 4s)
  - Audit log entry: "Report generation failed: {reason}"

- **What happens when database connection fails during a transaction?**
  - Transaction automatically rolled back
  - User-friendly error: "Unable to save changes. Please try again."
  - Retry with exponential backoff (1s, 2s, 4s)
  - Audit log entry: "Transaction failed: {reason}"

### Error Handling

- **What happens when Auth0 authentication fails or returns an error?**
  - User redirected to login page with error message: "Authentication failed. Please try again."
  - Audit log entry: "Authentication failure: {reason}"
  - Max 3 retry attempts, then lock account for 15 minutes

- **What happens when report generation fails mid-export?**
  - Partial file cleanup: remove incomplete PDF/Excel file
  - Display error: "Report generation failed. Please try again."
  - Retry button available with exponential backoff (1s, 2s, 4s)
  - Audit log entry: "Report generation failed: {reason}"

## Non-Functional Requirements

- **NFR-001**: Dashboard MUST load in under 2 seconds with 1000 projects
- **NFR-002**: Report generation MUST complete in under 10 seconds for a project with 50+ cost entries
- **NFR-003**: System MUST support 100 concurrent users without performance degradation
- **NFR-004**: API response times MUST be under 500ms for 95th percentile. Applies to critical endpoints: GET /projects, POST /projects, GET /projects/:id/dashboard. Read-heavy queries (reports, exports) may exceed 500ms but must complete within 2s. Dashboard load with 1000 projects: must complete in under 2s (separate NFR-001). Degradation threshold: Response time >2s for any endpoint triggers performance alert. (FR-036)
- **NFR-005**: User authentication MUST use OAuth 2.0/OIDC with secure token management
- **NFR-006**: All data MUST be encrypted at rest using AES-256
- **NFR-007**: All data in transit MUST be encrypted using TLS 1.3+
- **NFR-008**: System MUST implement RBAC with least privilege principle
- **NFR-009**: All security events MUST be logged with audit trails
- **NFR-010**: User interface MUST be WCAG 2.1 AA compliant
- **NFR-011**: System MUST use structured logging with correlation IDs for request tracing
- **NFR-012**: Health check endpoints MUST be exposed for monitoring
- **NFR-013**: Database backups MUST be automated and tested weekly
- **NFR-014**: Redis cache MUST be used with 5-minute TTL for frequently accessed data
- **NFR-015**: Code coverage MUST be at least 80%
- **NFR-016**: All tests MUST be automated and reproducible

## Key Entities

### Project
- Fields: id, name, contractCode, clientId, startDate, estimatedEndDate, status, builtUpArea, version (for optimistic locking)

### Client
- Fields: id, name, contactEmail

### Phase
- Fields: id, projectId, name, startDate, endDate, duration, status, orderIndex

### Task
- Fields: id, phaseId, teamMemberId, description, startDate, endDate, duration, status, orderIndex

### Assignment
- Fields: id, phaseId, teamMemberId, role, workingPercentage, startDate, endDate

### Team Member
- Fields: id, email, name, role, position, grade, hourlyRate, isActive

### Cost Entry
- Fields: id, projectId, phaseId, type, description, amount, teamMemberId, date

### KPI Entry
- Fields: id, employeeId, projectId, type, description, date
