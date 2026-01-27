# Feature Specification: Full-Stack SaaS Project Management Platform

**Feature Branch**: `002-001-excel-to-saas-i-do-not-want-to-pars-date-from-excel-i-want-to-convert-excel-to-full-saas-excel-are-no-using-in-my-firm`
**Created**: 2026-01-23
**Status**: Draft
**Input**: Build a full-stack SaaS application for project management with three roles (Manager, Team Leader, Team Member) and configurable project phases. No Excel import functionality required - fresh SaaS platform.

**Note**: This is a greenfield SaaS platform with NO Excel import functionality required. Constitution Principle II (Data Integrity & Migration Accuracy) is NOT APPLICABLE as there is no data migration from Excel.

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Project Tracking Dashboard (Priority: P1)

Project managers can view and manage all active projects in one place, including project status, team assignments, and key dates. Dashboard provides at-a-glance view of project health and progress.

**Why this priority**: Core functionality replacing Excel-based project tracking. Without it, users cannot effectively manage projects.

**Independent Test**: Users can view dashboard listing all projects, filter by status/phase, and see basic project details without requiring other features.

**Acceptance Scenarios**:

1. Given a logged-in Manager, When they access the Dashboard page, Then they see all projects with status indicators
2. Given a logged-in Manager, When they apply a phase filter, Then only projects in that phase are displayed
3. Given a logged-in Manager, When they view a project card, Then they see progress bars and team assignments

---

### User Story 2 - Project Creation and Management (Priority: P1)

Managers can create new projects with detailed information including client details, contract information, phase assignments, and assign Team Leaders to active phases.

**Why this priority**: Without the ability to create and manage projects, the system has no data to track. Foundational to all other features.

**Independent Test**: A manager can create a complete project record with all required fields, assign Team Leaders to each active phase, save it, and view it in the project list.

**Acceptance Scenarios**:

1. Given a logged-in Manager, When they click "Create Project", Then they see a form with all required fields
2. Given a logged-in Manager creating a project, When they assign a Team Leader to a phase, Then the assignment is saved
3. Given a logged-in Manager, When they edit an existing project, Then changes are persisted and reflected in the dashboard

---

### User Story 3 - Team Member Assignment and Allocation (Priority: P1)

Managers need to assign team members to projects and track their allocation over time. Enables effective resource planning and ensures projects have adequate staffing.

**Why this priority**: Team allocation is critical for resource planning. Without this, projects cannot be staffed effectively.

**Independent Test**: A manager can assign team members to a project, view their allocation percentage, and see their workload across multiple projects without requiring cost tracking.

**Acceptance Scenarios**:

1. Given a logged-in Manager, When they access team assignment for a project, Then they see all team members and their current allocations
2. Given a logged-in Manager assigning a team member, When allocation exceeds 100%, Then they see a warning
3. Given a logged-in Manager, When they view team allocation summary, Then they see total workload across all projects

---

### User Story 4 - Task and Phase Management (Priority: P2)

**Goal**: Managers and Team Leaders need to define tasks for each project phase with durations and track task completion. Team Leaders are assigned to phases via the Assignment model with role TEAM_LEADER. Team Members can view tasks for tracking purposes only.

**Why this priority**: Task management enables granular progress tracking and helps identify bottlenecks. While important, it's less critical than basic project tracking and team assignment.

**Independent Test**: A Team Leader (assigned via Assignment model with role TEAM_LEADER) can create tasks for their assigned phase, assign durations, and mark tasks as complete. A Team Member can view tasks but cannot modify them.

**Acceptance Scenarios**:

1. Given a logged-in Team Leader (assigned via Assignment model with role TEAM_LEADER), When they view their assigned phase, Then they see all tasks for that phase with full management controls
2. Given a logged-in Team Leader viewing other phases, When they access read-only view, Then they see task details but no edit controls
3. Given a logged-in Team Leader, When they create a task, Then it is saved with their assigned duration
4. Given a logged-in Team Leader, When they mark all tasks in a phase as COMPLETE, Then phase status automatically changes to COMPLETE (implemented in service layer)
5. Given a logged-in Team Leader, When they complete a phase with a subsequent phase, Then next phase status changes to IN_PROGRESS (implemented in service layer)
6. Given a logged-in Team Member, When they view tasks, Then they see read-only view with no edit controls

---

### User Story 5 - Project Cost Tracking (Priority: P2)

Users can track project costs including employee costs, material costs, and generate cost reports. Essential for profitability analysis and project budgeting.

**Why this priority**: Cost tracking is essential for profitability analysis. Important but can be added after core project tracking is working.

**Independent Test**: Users can record costs for a project, view total project cost, and generate a cost summary report without requiring KPIs or advanced analytics.

**Acceptance Scenarios**:

1. Given a logged-in Manager, When they add a cost entry to a project, Then it is saved with type (employee/material)
2. Given a logged-in Manager, When they view project costs, Then they see total cost broken down by category
3. Given a logged-in Manager, When they generate a cost report, Then they see summary of all cost entries

---

### User Story 6 - Employee KPIs and Performance Tracking (Priority: P2)

Managers can track employee performance metrics including delayed tasks, client modifications, and technical mistakes. Helps identify training needs and improve team efficiency.

**Why this priority**: Performance tracking helps identify training needs. Valuable but less critical than core project tracking.

**Independent Test**: Managers can view KPIs for employees, filter by phase or project, and see performance trends over time without requiring cost tracking.

**Acceptance Scenarios**:

1. Given a logged-in Manager, When they view an employee's KPIs, Then they see delayed tasks count
2. Given a logged-in Manager, When they filter KPIs by phase, Then only KPIs for that phase are shown
3. Given a logged-in Manager, When they add a KPI entry, Then it is saved with type and description

---

### User Story 7 - Timeline and Calendar Views (Priority: P3)

Users need visual timeline views to see project schedules, phase transitions, and team availability over time. Improves planning efficiency and helps identify scheduling conflicts.

**Why this priority**: Visual timelines improve planning efficiency. Nice-to-have but not essential for basic project tracking.

**Independent Test**: Users can view a Gantt chart or calendar showing all projects and phases, filter by time period, and identify overlapping projects.

**Acceptance Scenarios**:

1. Given a logged-in Manager, When they access timeline view, Then they see Gantt chart of all projects
2. Given a logged-in Manager, When they filter timeline by date range, Then only projects in that range are shown
3. Given a logged-in Manager, When two projects overlap, Then they see visual indication of conflict

---

### User Story 8 - Report Generation and Export (Priority: P3)

Users can generate various reports including client reports, employee summaries, and project follow-up reports. Important for client communication and internal reviews.

**Why this priority**: Reports are important for client communication. Valuable but can be added after core functionality is stable.

**Independent Test**: Users can generate a project follow-up report, view it in the interface, and export it as PDF or Excel.

**Acceptance Scenarios**:

1. Given a logged-in Manager, When they generate a project follow-up report, Then they see report with project details
2. Given a logged-in Manager, When they export a report to PDF, Then a PDF file is downloaded
3. Given a logged-in Manager, When they export a report to Excel, Then an Excel file is downloaded

### Edge Cases

- What happens when a team member is assigned >100% allocation across projects?
  - System MUST display a validation error when allocation >100%: "Team member allocation exceeds 100%. Current total: {current}%. Maximum: 100%."
  - Manager MUST explicitly acknowledge over-allocation by checking "Override allocation limit" checkbox before saving
  - Allocation >100% is recorded in AuditLog with reason "Manager override: allocation limit exceeded"
  - Dashboard shows allocation bar in red when >100% with warning icon
- How does system handle concurrent edits to the same project (optimistic locking)?
  - When a concurrent edit is detected (version mismatch), system MUST return a 409 Conflict error with details about the conflicting version
  - The frontend MUST display a message: "This project was modified by another user. Please refresh and try again."
  - User can refresh the page to load the latest version and reapply their changes
  - No data loss: system MUST preserve all user-entered data on conflict page for re-entry
- What happens when a Team Leader is assigned to a phase but no Team Members are assigned?
  - Phase displays with "No team members assigned" badge
  - Team Leader can still create tasks and view phase details
- How does system handle deletion of a project that has active tasks?
  - Soft delete with audit log entry: "Project deleted with {count} active tasks"
  - Confirmation dialog: "Project has {count} active tasks. Delete anyway?" with options "Cancel" and "Delete"
  - Manager must type confirmation phrase or provide reason for deletion
- What happens when Auth0 authentication fails or returns an error?
  - User redirected to login page with error message: "Authentication failed. Please try again."
  - Audit log entry: "Authentication failure: {reason}"
  - Max 3 retry attempts, then lock account for 15 minutes
- How does system handle duplicate cost entries for the same project?
  - Cost entries checked for uniqueness on (projectId, phaseId, employeeId, period, type, description)
  - If duplicate detected: display error "This cost entry already exists for this project, period, and employee"
  - Manager can edit existing entry instead
- What happens when a project has no phases configured?
  - Project creation MUST require at least one phase to be configured
  - If Manager tries to save project with zero phases, system MUST display validation error: "At least one project phase is required."
  - Suggested default: When creating a new project, system MUST auto-create a default "Studies" phase if no phases are specified
  - Existing projects with no phases (edge case) display in dashboard with "No phases configured - please add at least one phase" badge
- How does system handle large datasets (1000+ projects) in dashboard queries?
  - Paginated queries with default 20 projects per page
  - Lazy loading: fetch next page on scroll
  - Filter by status/phase to reduce dataset size
  - Loading skeleton shown during fetch (max 2s)
- What happens when a report generation fails mid-export?
  - Partial file cleanup: remove incomplete PDF/Excel file
  - Display error: "Report generation failed. Please try again."
  - Retry button available with exponential backoff (1s, 2s, 4s)
  - Audit log entry: "Report generation failed: {reason}"
- How does system handle phase transition when tasks are incomplete?
  - When Team Leader tries to complete a phase with incomplete tasks, system MUST display error: "Cannot complete phase. {count} tasks are still in progress."
  - Dashboard shows task completion percentage for each phase (e.g., "7/10 tasks completed")
  - Phase status changes to IN_PROGRESS only when ALL tasks in that phase have status COMPLETE
  - If subsequent phase exists, it remains PLANNED until previous phase is COMPLETE
  - Manual override option: Manager can force phase completion with reason entry (logged in AuditLog)
- What happens when a user's role is changed (e.g., Team Leader → Manager)?
  - Role change requires re-authentication
  - Audit log entry: "User role changed from {oldRole} to {newRole} by {managerName}"
  - UI reflects new role immediately after re-authentication
  - Previous permissions revoked immediately
- How does system handle timezone differences in project dates?
  - All dates stored in UTC in database
  - Display dates converted to user's local timezone based on browser settings
  - Date picker shows timezone indicator (e.g., "UTC+3")
- What happens when database connection fails during a transaction?
  - Transaction automatically rolled back
  - User-friendly error: "Unable to save changes. Please try again."
  - Retry with exponential backoff (1s, 2s, 4s)
  - Audit log entry: "Transaction failed: {reason}"
- What happens when task duration is invalid (negative, zero, or > 365 days)?
  - Frontend validation: display error "Duration must be between 0.5 and 365 days"
  - Cannot save task until duration is valid
  - Error appears inline with duration input field
- What happens when task description is empty or exceeds character limits?
  - Empty description: display error "Task description is required (10-500 characters)"
  - Too short (<10 chars): "Description too short. Minimum: 10 characters"
  - Too long (>500 chars): "Description too long. Maximum: 500 characters. Current: {count}"
  - Character counter shown: "{count}/500"
- What happens when a Team Leader tries to create tasks in phases they don't lead?
  - Attempt to access other phases shows read-only view (no edit controls)
  - Display message: "You can only manage tasks in phases you are assigned to lead"
  - Redirect to assigned phases with "View your assigned phases" button
- What happens when a task is assigned to a user not assigned to that phase?
  - Validation error on task save: "Cannot assign task to user who is not assigned to this phase"
  - Show list of team members who ARE assigned to this phase
  - Manager must select a valid team member from dropdown

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST allow Managers to create, read, update, and delete projects
- **FR-002**: System MUST allow Team Leaders to manage tasks within their assigned phase(s)
- **FR-003**: System MUST allow Team Members to view project and task information in read-only mode
- **FR-004**: System MUST support three configurable roles: MANAGER (full access), TEAM_LEADER (phase-specific access), TEAM_MEMBER (read-only)
- **FR-005**: System MUST allow Managers to assign Team Members to projects with allocation percentages
- **FR-006**: System MUST track and display team member allocation across multiple projects
- **FR-007**: System MUST warn when team member allocation exceeds 100%
- **FR-008**: System MUST allow configuration of project phases (initially: Studies, Design, Technical)
- **FR-009**: System MUST track phase completion status and transitions
- **FR-010**: System MUST allow Managers to assign Team Leaders to specific phases via Assignment model with role TEAM_LEADER
- **FR-010a**: Team Leaders MUST have read access to ALL phases within their assigned project
- **FR-010b**: Team Leaders MUST have write access (create/edit/delete tasks, update phase status) ONLY to phases where they are assigned via Assignment with role TEAM_LEADER
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
- **FR-018**: System MUST generate visual timeline/Gantt chart views
- **FR-019**: System MUST export project follow-up reports in PDF format
- **FR-020**: System MUST export reports in Excel format
- **FR-021**: System MUST implement OAuth 2.0/OIDC authentication via Auth0
- **FR-022**: System MUST enforce role-based access control on all API endpoints
- **FR-023**: System MUST log all configuration changes, project updates, and cost entries
- **FR-024**: System MUST support configuration management for phases, roles, and system settings
- **FR-025**: System MUST automatically set `completedDate` when task status changes to COMPLETE
- **FR-026**: System MUST trigger phase completion check when any task status changes to COMPLETE
- **FR-027**: Phase MUST auto-complete to status COMPLETE when ALL tasks in that phase have status COMPLETE
- **FR-028**: Phase completion MUST automatically transition next phase from PLANNED to IN_PROGRESS (if exists)
- **FR-029**: Task validation MUST require duration ≥ 0.5 days and ≤ 365 days
- **FR-030**: Task description MUST be between 10-500 characters
- **FR-031**: System MUST return 409 Conflict error on optimistic lock failure with version details
- **FR-032**: System MUST allow allocation >100% with Manager override (requires checkbox acknowledgment) and audit log entry
- **FR-033**: System MUST require at least one phase for project creation; auto-create default "Studies" phase if none specified
- **FR-034**: System MUST display task completion percentage per phase (e.g., "7/10 tasks completed")
- **FR-035**: Manager can force phase completion with incomplete tasks (requires reason entry logged in AuditLog)
- **FR-036**: Performance alerts MUST trigger when endpoint response time >2s

### Non-Functional Requirements

- **NFR-001**: Dashboard MUST load in under 2 seconds with 1000 projects
- **NFR-002**: Report generation MUST complete in under 10 seconds for a project with 50+ cost entries
- **NFR-003**: System MUST support 100 concurrent users without performance degradation
- **NFR-004**: API response times MUST be under 500ms for 95th percentile. Applies to critical endpoints: GET /projects, POST /projects, GET /projects/:id/dashboard. Read-heavy queries (reports, exports) may exceed 500ms but must complete within 2s. Dashboard load with 1000 projects: must complete in under 2s (separate NFR-001). Degradation threshold: Response time >2s for any endpoint triggers performance alert.
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

### Key Entities

- **Project**: Represents a client project with contract details, status, and multiple phases. Key attributes: name, client name, contract value, start date, end date, status, progress percentage.
- **Phase**: Configurable project stage (Studies, Design, Technical, etc.) with assigned Team Leader (via Assignment model with role TEAM_LEADER), duration, estimated end date, and tasks. Key attributes: name (PhaseName enum), startDate, duration (in days), estimatedEndDate, actualStartDate, actualEndDate, status (PhaseStatus), progress percentage, version (optimistic locking).
- **TeamMember**: User who can be assigned to projects with specific allocation. Key attributes: name, email, role (MANAGER/TEAM_LEADER/TEAM_MEMBER), hourly rate.
- **Assignment**: Links TeamMembers to Projects with allocation percentage. Key attributes: teamMemberId, projectId, role (TEAM_LEADER/TEAM_MEMBER), workingPercentage (0-100), startDate, endDate. Used for assigning Team Leaders to phases (with role: TEAM_LEADER) and Team Members to projects.
- **Task**: Work item within a phase with duration and completion status. Key attributes: phaseId, code, description, duration (in days), status (PLANNED/IN_PROGRESS/COMPLETED), assignedTeamMemberId (via Assignment), startDate, endDate, completedDate, version (optimistic locking).
- **CostEntry**: Tracks costs for a project (employee or material). Key attributes: projectId, type (EMPLOYEE/MATERIAL), description, amount, date, teamMemberId (if employee cost).
- **KPIEntry**: Tracks performance metrics for employees. Key attributes: teamMemberId, type (DELAYED_TASK/CLIENT_MODIFICATION/TECHNICAL_MISTAKE), description, projectId, phaseId, date.
- **Configuration**: System settings for phases, roles, and other configurable values. Key attributes: category, key, value, metadata.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Dashboard loads in under 2 seconds with 1000 projects
- **SC-002**: System supports 100 concurrent users without performance degradation
- **SC-003**: 90% of users successfully create a project on first attempt
- **SC-004**: Project creation completes in under 3 minutes
- **SC-005**: All API response times are under 500ms for 95th percentile
- **SC-006**: Report generation completes in under 10 seconds
- **SC-007**: Code coverage is at least 80%
- **SC-008**: All user stories pass automated acceptance tests
- **SC-009**: Zero critical security vulnerabilities in production deployment
