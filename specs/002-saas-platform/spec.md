# Feature Specification: SaaS Platform

**Feature Branch**: `002-saas-platform`
**Created**: 2026-01-23
**Status**: Draft
**Input**: User description: "001-excel-to-saas i do not want to pars date from excel i want to convert excel to full saas excel are no using in my firm"

## Assumptions

- The Excel file (REF.02.387.xlsm) contains a project management and follow-up tracking system used by a design/architecture firm
- The system tracks projects through **multiple configurable phases** (initially: Studies, Design, Technical, but expandable)
- Users are internal team members with **three distinct roles**:
  - **Manager**: Can create projects, assign Team Leaders to each phase, can control tasks and phases for all projects
  - **Team Leader**: Assigned to manage a specific phase, can control tasks and phases for their assigned phase only
  - **Team Member**: Read-only access for tracking purposes only, cannot modify tasks or phases
- Historical data from Excel does NOT need to be migrated - this is a fresh SaaS application
- The SaaS application will require user authentication and authorization
- The application will need to support multiple clients/projects simultaneously
- Reports and dashboards currently generated in Excel must be replicated in the web interface
- No Excel file parsing or import functionality is required

## User Scenarios & Testing

### User Story 1 - Project Tracking Dashboard (Priority: P1)

Project managers need to view and manage all active projects in one place, including project status, team assignments, and key milestones. This dashboard provides an at-a-glance view of project health and progress.

**Why this priority**: This is the core functionality that provides visibility into project management. Without it, users cannot effectively manage their projects.

**Independent Test**: Users can view a dashboard listing all projects, filter by status/phase, and see basic project details without requiring other features.

**Acceptance Scenarios**:

1. **Given** a user is logged in as a project manager, **When** they navigate to the dashboard, **Then** they see all projects with status indicators, progress bars, and key dates
2. **Given** a user is viewing the project dashboard, **When** they filter by "Studies phase", **Then** only projects currently in the Studies phase are displayed
3. **Given** a user is viewing the dashboard, **When** they click on a project card, **Then** they are redirected to the project detail view with full project information

---

### User Story 2 - Project Creation and Management (Priority: P1)

Managers need to create new projects with detailed information including client details, contract information, phase assignments, and assign Team Leaders to each active phase.

**Why this priority**: Without the ability to create and manage projects, the system has no data to track. This is foundational to all other features.

**Independent Test**: A manager can create a complete project record with all required fields, assign Team Leaders to phases, save it, and view it in the project list without needing reports or analytics.

**Acceptance Scenarios**:

1. **Given** a manager is logged in, **When** they create a new project with client name, contract code, start date, and estimated end date, **Then** the project is saved and appears in the project list
2. **Given** a manager is creating a project, **When** they assign a team leader to the active phases (e.g., Studies, Design, Technical), **Then** those assignments are saved and visible in the project details
3. **Given** a manager is editing an existing project, **When** they modify the estimated end date, **Then** the change is saved and reflected in all dependent timelines and schedules
4. **Given** a manager is editing a project, **When** they change the Team Leader assigned to a phase, **Then** the change is saved and only that phase leader has control over that phase's tasks

---

### User Story 3 - Team Member Assignment and Allocation (Priority: P1)

Managers need to assign team members to projects and track their allocation over time. This enables effective resource planning and ensures projects have adequate staffing.

**Why this priority**: Team allocation is critical for resource planning and ensuring projects have adequate staffing. Without this, projects cannot be staffed effectively.

**Independent Test**: A manager can assign team members to a project, view their allocation percentage, and see their workload across multiple projects without requiring cost tracking or KPIs.

**Acceptance Scenarios**:

1. **Given** a user is a manager, **When** they assign a team member to a project phase with a specific allocation percentage, **Then** the assignment is saved and visible in the project team view
2. **Given** a team member is assigned to multiple projects, **When** a manager views the team member's allocation, **Then** they see total allocation percentage across all projects for each month
3. **Given** a manager is viewing team allocation, **When** they see a team member is over-allocated (>100%), **Then** the system displays a warning indicator

---

### User Story 4 - Task and Phase Management (Priority: P2)

Managers and Team Leaders need to define tasks for each project phase with durations and track task completion. Team Members can view tasks for tracking purposes only. This enables granular progress tracking and helps identify bottlenecks.

**Why this priority**: Task management enables granular progress tracking and helps identify bottlenecks. While important, it's less critical than basic project tracking and team assignment.

**Independent Test**: A Team Leader can create tasks for their assigned phase, assign durations, and mark tasks as complete. A Team Member can view tasks but cannot modify them.

**Acceptance Scenarios**:

1. **Given** a Team Leader is managing their assigned phase, **When** they add a task to that phase with a 15-day duration, **Then** the task is saved and included in the phase timeline
2. **Given** tasks exist for a phase, **When** a Team Leader marks all tasks in their assigned phase as complete, **Then** the phase status updates to "Complete" and the project moves to the next phase
3. **Given** a project has multiple phases, **When** a Manager views the project, **Then** they see a visual timeline showing tasks and phases with progress indicators for all phases
4. **Given** a Team Member is viewing a project phase, **When** they navigate to the tasks view, **Then** they can see all tasks and their status but cannot create, modify, or delete tasks
5. **Given** a Manager is viewing a project, **When** they navigate to the tasks view for any phase, **Then** they can create, modify, or delete tasks in any phase

---

### User Story 5 - Project Cost Tracking (Priority: P2)

Users need to track project costs including employee costs, material costs, and generate cost reports. This is essential for profitability analysis and project budgeting.

**Why this priority**: Cost tracking is essential for profitability analysis and project budgeting. It's important but can be added after core project tracking is working.

**Independent Test**: Users can record costs for a project, view total project cost, and generate a cost summary report without requiring KPIs or advanced analytics.

**Acceptance Scenarios**:

1. **Given** a user is viewing a project, **When** they record an employee's cost for a month worked, **Then** the cost is saved and included in the project total cost
2. **Given** a project has recorded costs, **When** a user views the cost report, **Then** they see a breakdown of costs by phase, employee, and time period
3. **Given** a user is managing project budget, **When** total project costs exceed budget, **Then** the system displays an over-budget alert

---

### User Story 6 - Employee KPIs and Performance Tracking (Priority: P2)

Managers need to track employee performance metrics including delayed tasks, client modifications, and technical mistakes. This helps identify training needs and improve team efficiency.

**Why this priority**: Performance tracking helps identify training needs and improve team efficiency. It's valuable but less critical than core project tracking.

**Independent Test**: Managers can view KPIs for employees, filter by phase or project, and see performance trends without requiring cost tracking or external integrations.

**Acceptance Scenarios**:

1. **Given** a manager is viewing employee performance, **When** they look at an employee's KPIs, **Then** they see metrics including days delayed, client modifications, and technical mistakes
2. **Given** an employee has performance data across multiple projects, **When** a manager views the employee summary, **Then** they see aggregated KPIs and performance trends over time
3. **Given** performance data exists, **When** a manager identifies an employee with consistently poor KPIs, **Then** the system highlights this for further action

---

### User Story 7 - Timeline and Calendar Views (Priority: P3)

Users need visual timeline views to see project schedules, phase transitions, and team availability over time. This improves planning efficiency and helps identify scheduling conflicts.

**Why this priority**: Visual timelines improve planning efficiency and help identify scheduling conflicts. They're nice-to-have but not essential for basic project tracking.

**Independent Test**: Users can view a Gantt chart or calendar showing all projects and phases, filter by time period, and identify overlapping projects without requiring detailed analytics.

**Acceptance Scenarios**:

1. **Given** a user is viewing the timeline, **When** they select a date range, **Then** they see all projects active during that period with phase information
2. **Given** multiple projects are in progress, **When** a user views the timeline, **Then** they can identify periods where too many projects overlap (resource conflicts)
3. **Given** a user is planning new projects, **When** they view the team availability timeline, **Then** they can see which team members have availability during the planned project period

---

### User Story 8 - Report Generation and Export (Priority: P3)

Users need to generate various reports including client reports, employee summaries, and project follow-up reports. This is important for client communication and internal reviews.

**Why this priority**: Reports are important for client communication and internal reviews. They're valuable but can be added after core functionality is stable.

**Independent Test**: Users can generate a project follow-up report, view it in the interface, and export it as PDF or Excel without requiring advanced analytics or external integrations.

**Acceptance Scenarios**:

1. **Given** a user is managing a project, **When** they generate a project follow-up report, **Then** they see a comprehensive report including project status, team assignments, progress, and key metrics
2. **Given** a report has been generated, **When** the user clicks "Export to PDF", **Then** a formatted PDF is downloaded with all report data
3. **Given** a manager needs to review employee performance, **When** they generate an employee summary report, **Then** they see a breakdown of employee work across projects with KPIs

---

### Edge Cases

1. **Team member over-allocation (>100%)**: System MUST display visual warning (red indicator) on TeamAllocationView, prevent saving assignments that would exceed 100% capacity, and suggest available team members or alternative allocation percentages.

2. **Project put on hold or cancelled**: System MUST change project status to "On Hold" or "Cancelled", stop progress calculations, suspend task timers, prevent new assignments, and retain all historical data for reporting. On-hold projects can be reactivated with resume date tracking.

3. **Project phases completed out of order**: System MUST allow flexible phase progression, track actual completion dates independent of planned sequence, flag non-linear phase transitions in audit logs, and support custom phase ordering per project type if configured.

4. **Limited permissions editing restricted projects**: System MUST check user role and project ownership via authorization middleware (authz.ts), return 403 Forbidden for unauthorized edits, display appropriate error message "You do not have permission to edit this project", and allow read-only view for all authenticated users.

5. **Simultaneous edits by multiple users**: System MUST use optimistic locking with version field on Project, Phase, Task, Assignment entities, return 409 Conflict on version mismatch, provide "Refresh to see latest changes" option, and support conflict resolution dialog showing both versions.

6. **Retroactive cost modifications**: System MUST maintain cost entry history via AuditLog, recalculate project totals on cost changes, flag retroactive changes in modification history, allow cost corrections only by MANAGER role, and preserve original cost records for audit.

7. **Timezone differences for global teams**: System MUST store all dates in UTC timezone, display dates in user's local timezone (detected via browser or profile), show timezone indicator on all date fields, and support timezone configuration in user preferences.

8. **Task deletion or duration changes in-progress projects**: System MUST validate task dependencies before deletion, warn if task has dependent tasks or cost entries, recalculate phase progress after task changes, maintain audit trail of task modifications, and require MANAGER approval for deleting tasks with associated costs.

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow users to create projects with client name, contract code, signing date, BUA (Built-Up Area), license type, project type, and project requirements
- **FR-002**: System MUST support multiple configurable project phases (initially Studies, Design, Technical) with custom ordering and transitions
- **FR-003**: System MUST allow assignment of Team Leaders to any defined phase with working percentages and date ranges, and Team Members to projects with working percentages and date ranges
- **FR-004**: System MUST track project start dates, estimated end dates, and actual completion dates
- **FR-005**: System MUST allow users to define tasks for each project phase with task descriptions and durations
- **FR-006**: System MUST track task completion status and calculate phase progress based on completed tasks
- **FR-007**: System MUST record employee costs per project per month and calculate total project costs
- **FR-008**: System MUST track employee KPIs including delayed days, client modifications, and technical mistakes per phase
- **FR-009**: System MUST provide a dashboard view showing all projects with status indicators and progress
- **FR-010**: System MUST allow filtering and searching of projects by client, phase, date range, and status
- **FR-011**: System MUST generate timeline views showing project phases and tasks over time
- **FR-012**: System MUST generate reports including project follow-up reports and employee summary reports
- **FR-013**: System MUST allow users to export reports in PDF and Excel formats
- **FR-014**: System MUST provide team allocation views showing employee workload across all projects
- **FR-015**: System MUST support configuration lists for positions, regions, license types, and project types
- **FR-016**: System MUST track project modifications including:
  - Modification timestamp and user who made the change
  - Allowed modification count per project phase (default: 3 times)
  - Days allocated per modification (default: 5 days)
  - Modification type (field change, status change, assignment change)
  - Modification history viewable on project detail page
- **FR-017**: System MUST record project requirements and track their completion status:
  - Each project can have multiple requirements (text descriptions)
  - Requirements can be marked as complete/incomplete
  - Completion tracked with timestamp and user who completed
  - Requirements completion percentage shown on project dashboard
- **FR-018**: System MUST provide user authentication with role-based access control:
  - **Manager**: Can create projects, assign Team Leaders to each phase, create/modify/delete tasks and phases for all projects
  - **Team Leader**: Assigned to manage specific phase(s), can create/modify/delete tasks and phase status for their assigned phase(s) only
  - **Team Member**: Read-only access for tracking purposes, can view projects, tasks, and phases but cannot create/modify/delete
- **FR-019**: System MUST maintain audit logs of all project changes including who made changes and when

### Key Entities

- **Project**: Represents a client engagement with attributes including client name, contract code, contract signing date, built-up area (BUA), license type, project type, requirements, start date, estimated end date, and current phase

- **Phase**: Represents a configurable project phase (e.g. Studies, Design, Technical) with attributes including phase name, order, start date, duration, assigned Team Leader, team member assignments, tasks, and status (planned, in progress, complete)

- **User/Team Member**: Represents an employee with authentication credentials (User) and profile data (TeamMember) including name, position, region, grade, level, email, and monthly cost

- **Task**: Represents a unit of work within a phase with attributes including task code, description, duration, status, and assigned team members

- **Client**: Represents a company or organization with name, contact name/email/phone, address, and region; has many projects and references region configuration

- **Cost Entry**: Represents cost data for a project with attributes including project ID, phase ID, employee ID, period (month), and cost amount

- **KPI Entry**: Represents performance metrics for an employee with attributes including employee ID, project ID, phase ID, delayed days, client modifications count, and technical mistakes count

- **Assignment**: Represents the relationship between a team member and a project with attributes including phase, working percentage, start date, end date, and role (team leader or team member)

- **Configuration Item**: Represents reference data with attributes including category (position, region, license type, project type), name, and associated rules or constraints

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can create a new project with all required fields in under 3 minutes
- **SC-002**: Project dashboard loads and displays all projects in under 2 seconds for up to 1000 projects
- **SC-003**: Users can assign team members to a project and view allocation in under 1 minute
- **SC-004**: 90% of users can successfully complete basic project creation on their first attempt without training
- **SC-005**: Project cost reports generate in under 5 seconds for projects with up to 50 team members
- **SC-006**: Timeline views render correctly for up to 50 active projects without performance degradation
- **SC-007**: 90% of users can successfully navigate the interface without documentation
- **SC-008**: Report exports complete successfully in under 10 seconds for reports with up to 500 data rows
- **SC-009**: System supports 100 concurrent users without response time degradation beyond 3 seconds for standard operations
