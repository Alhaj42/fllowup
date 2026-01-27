# Tasks: SaaS Platform

**Input**: Feature specification from `/specs/002-001-excel-to-saas-i-do-not-want-to-pars-date-from-excel-i-want-to-convert-excel-to-full-saas-excel-are-no-using-in-my-firm/spec.md`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md (research decisions)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., [US1], [US2], etc.)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`, `backend/tests/`
- **Frontend**: `frontend/src/`, `frontend/tests/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 [P] Create project structure per implementation plan
- [X] T002 [P] Initialize backend Node.js project with Express.js, TypeScript dependencies
- [X] T003 [P] Initialize frontend React project with Vite, TypeScript dependencies
- [X] T004 [P] Configure ESLint and Prettier for backend
- [X] T005 [P] Configure ESLint and Prettier for frontend

**Checkpoint**: Basic project structure and linting setup complete

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Authentication & Authorization

- [X] T006 [P] Setup Prisma with PostgreSQL database connection
- [X] T007 [P] Implement authentication middleware with Auth0 in backend/src/middleware/auth.ts (depends on T008.1)
- [X] T008 [P] Implement authorization middleware with RBAC in backend/src/middleware/authz.ts (depends on T006)
- [X] T008.1 [P] Configure Auth0 application provider in backend/src/config/auth0.ts and add AUTH0_DOMAIN, AUTH0_AUDIENCE, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET to backend/.env.example (depends on T008)
- [X] T009 [P] Setup API routing and Express app structure in backend/src/api/routes/index.ts
- [X] T018 [P] Implement AuditLogService in backend/src/services/auditLogService.ts
- [X] T018.1 [P] Create audit logging middleware in backend/src/middleware/auditMiddleware.ts (depends on T018)
- [X] T018.2 [P] Unit test for AuditLogService in backend/tests/unit/services/auditLogService.test.ts
- [X] T018.3 [P] Unit test for audit logging middleware in backend/tests/unit/middleware/auditMiddleware.test.ts

### Data Model & Database

- [X] T010 [P] Create Prisma schema with all entities in backend/prisma/schema.prisma
- [X] T021 [P] Run database migration in backend/prisma/migrations (depends on T010)
- [X] T023 [P] Implement optimistic locking middleware in backend/src/middleware/optimisticLock.ts (depends on T010)
- [X] T023.1 [P] Unit test for optimistic locking in backend/tests/unit/middleware/optimisticLock.test.ts
- [X] T023.2 [P] Verify version field exists on Project, Phase, Task, Assignment models in backend/prisma/schema.prisma (depends on T010, T023)
- [X] T024 [P] Setup environment configuration with dotenv in backend/.env.example (depends on T010)
- [X] T025 [P] Setup Axios API client in frontend/src/services/api.ts
- [X] T026 [P] Configure Zustand store for authentication state in frontend/src/state/authStore.ts (depends on T025)

### Configuration

- [X] T015 [P] Implement ConfigurationService in backend/src/services/configurationService.ts (depends on T010)
- [X] T015.1 [P] Unit test for ConfigurationService in backend/tests/unit/services/configurationService.test.ts
- [X] T015.2 [P] Create GET /configuration/:category endpoint in backend/src/api/routes/configurationRoutes.ts (depends on T015)
- [X] T015.3 [P] Create POST /configuration endpoint (MANAGER only) in backend/src/api/routes/configurationRoutes.ts (depends on T015)
- [X] T015.4 [P] Unit test for configuration endpoints in backend/tests/contract/testGetConfiguration.test.ts
- [X] T015.5 [P] Unit test for POST configuration endpoint in backend/tests/contract/testPostConfiguration.test.ts
- [X] T015.6 [P] Add ConfigurationSelector component in frontend/src/components/ConfigurationSelector.tsx (depends on T015.3, T015.4)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Project Tracking Dashboard (Priority: P1) 🎯 MVP

**Goal**: Project managers can view and manage all active projects in one place, including project status, team assignments, and key dates. This dashboard provides an at-a-glance view of project health and progress.

**Why this priority**: This is the core functionality that replaces Excel-based project tracking. Without it, users cannot effectively manage their projects.

**Independent Test**: Users can view a dashboard listing all projects, filter by status/phase, and see basic project details without requiring other features.

### Tests for User Story 1 (REQUIRED - TDD NON-NEGOTIABLE) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T029 [P] [US1] Unit test for Project model in backend/tests/unit/models/project.test.ts ✅ PASSING (7/7 tests)
- [X] T030 [P] [US1] Cross-contract test for GET /projects endpoint in backend/tests/contract/testGetProjects.test.ts ✅ PASSING - all 14 tests passing
- [X] T031 [P] [US1] Integration test for dashboard user journey in backend/tests/integration/testDashboardJourney.test.ts ✅ PASSING - all 20 tests passing
- [X] T032 [P] [US1] Component test for ProjectList component in frontend/tests/components/ProjectList.test.tsx ✅ CREATED
- [X] T033 [P] [US1] Component test for ProjectCard component in frontend/tests/components/ProjectCard.test.tsx ✅ CREATED
  - [X] T034 [P] [US1] E2E test for dashboard flow in frontend/tests/e2e/testDashboardFlow.spec.ts ✅ COMPLETE

### Implementation for User Story 1

- [X] T035 [US1] Implement ProjectService in backend/src/services/projectService.ts ✅ COMPLETE
- [X] T036 [US1] Implement GET /projects endpoint in backend/src/api/routes/projectRoutes.ts ✅ COMPLETE
- [X] T037 [US1] Implement GET /projects/:id endpoint in backend/src/api/routes/projectRoutes.ts ✅ COMPLETE
- [X] T038 [US1] Implement GET /projects/:id/dashboard endpoint in backend/src/api/routes/projectRoutes.ts ✅ COMPLETE
- [X] T039 [US1] Create ProjectList component in frontend/src/components/ProjectList.tsx ✅ COMPLETE
- [X] T040 [US1] Create ProjectCard component in frontend/src/components/ProjectCard.tsx ✅ COMPLETE
- [X] T041 [US1] Create ProjectFilter component in frontend/src/components/ProjectFilter.tsx ✅ COMPLETE
- [X] T042 [US1] Create Dashboard page in frontend/src/pages/Dashboard.tsx ✅ COMPLETE
- [X] T043 [US1] Implement project filtering logic in frontend/src/pages/Dashboard.tsx ✅ COMPLETE
- [X] T044 [US1] Add project status indicators in frontend/src/components/ProjectCard.tsx ✅ COMPLETE
- [X] T045 [US1] Add progress bars in frontend/src/components/ProjectCard.tsx ✅ COMPLETE
- [X] T046 [US1] Add navigation to project detail in frontend/src/pages/Dashboard.tsx ✅ COMPLETE
- [X] T047 [US1] Add loading and error states in frontend/src/components/ProjectList.tsx ✅ COMPLETE

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Project Creation and Management (Priority: P1) 🎯 MVP

**Goal**: Managers can create new projects with detailed information including client details, contract information, phase assignments, and assign Team Leaders to active phases.

**Why this priority**: Without the ability to create and manage projects, the system has no data to track. This is foundational to all other features.

**Independent Test**: A manager can create a complete project record with all required fields, assign Team Leaders to each active phase, save it, and view it in the project list without needing reports or analytics.

### Tests for User Story 2 (REQUIRED - TDD NON-NEGOTIABLE) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

 - [X] T048 [P] [US2] Contract test for POST /projects endpoint in backend/tests/contract/testCreateProject.test.ts (depends on T010) ✅ COMPLETE
 - [X] T049 [P] [US2] Contract test for PUT /projects/:id endpoint in backend/tests/contract/testUpdateProject.test.ts (depends on T010) ✅ COMPLETE
 - [X] T050 [P] [US2] Integration test for project creation flow in backend/tests/integration/testProjectCreationFlow.ts ✅ COMPLETE
 - [X] T051 [P] [US2] Component test for ProjectForm component in frontend/tests/components/ProjectForm.test.tsx ✅ COMPLETE
 - [X] T052 [P] [US2] Component test for ProjectDetail component in frontend/tests/components/ProjectDetail.test.tsx ✅ COMPLETE
 - [X] T053 [P] [US2] E2E test for project creation flow in frontend/tests/e2e/testProjectCreationFlow.spec.ts ✅ COMPLETE

### Implementation for User Story 2

 - [X] T054 [US2] Implement createProject service in backend/src/services/projectService.ts (depends on T048, T029) ✅ COMPLETE
 - [X] T055 [US2] Implement updateProject service in backend/src/services/projectService.ts (depends on T049, T029) ✅ COMPLETE
 - [X] T056 [US2] Implement POST /projects endpoint in backend/src/api/routes/projectRoutes.ts (depends on T048, T054) ✅ COMPLETE
 - [X] T057 [US2] Implement PUT /projects/:id endpoint in backend/src/api/routes/projectRoutes.ts (depends on T049, T055) ✅ COMPLETE
 - [X] T058 [US2] Create ClientSelector component in frontend/src/components/ClientSelector.tsx ✅ COMPLETE
 - [X] T059 [US2] Create ProjectForm component in frontend/src/components/ProjectForm.tsx (depends on T051, T025) ✅ COMPLETE
 - [X] T060 [US2] Create ProjectDetail page in frontend/src/pages/ProjectDetail.tsx (depends on T052, T025) ✅ COMPLETE
 - [X] T061 [US2] Implement project phase management in backend/src/services/projectService.ts (depends on T010) ✅ COMPLETE
 - [X] T062 [US2] Implement phase management UI in ProjectForm component (depends on T061, T059) ✅ COMPLETE
 - [X] T063 [US2] Implement project editing in ProjectDetail page (depends on T055, T060) ✅ COMPLETE

**Checkpoint**: At this point, User Story 2 should be fully functional and testable independently

---

## Phase 5: User Story 3 - Team Member Assignment and Allocation (Priority: P1) 🎯 MVP

**Goal**: Managers need to assign team members to projects and track their allocation over time. This enables effective resource planning and ensures projects have adequate staffing.

**Why this priority**: Team allocation is critical for resource planning and ensuring projects have adequate staffing. Without this, projects cannot be staffed effectively.

**Independent Test**: A manager can assign team members to a project, view their allocation percentage, and see their workload across multiple projects without requiring cost tracking or KPIs.

### Tests for User Story 3 (REQUIRED - TDD NON-NEGOTIABLE) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

 - [X] T064 [P] [US3] Unit test for Assignment model in backend/tests/unit/models/assignment.test.ts ✅ COMPLETE
 - [X] T065 [P] [US3] Contract test for POST /phases/:phaseId/assignments endpoint in backend/tests/contract/testCreateAssignment.test.ts (depends on T010) ✅ COMPLETE
 - [X] T066 [P] [US3] Contract test for GET /team/allocation endpoint in backend/tests/contract/testGetTeamAllocation.test.ts (depends on T010) ✅ COMPLETE
 - [X] T067 [P] [US3] Integration test for team allocation calculation in backend/tests/integration/testTeamAllocation.ts ✅ COMPLETE
 - [X] T068 [P] [US3] Integration test for team assignment in backend/tests/integration/testTeamAssignment.ts ✅ COMPLETE
 - [X] T069 [P] [US3] Component test for TeamAssignmentForm component in frontend/tests/components/TeamAssignmentForm.test.tsx ✅ COMPLETE
 - [X] T070 [P] [US3] Component test for TeamAllocationView component in frontend/tests/components/TeamAllocationView.test.tsx ✅ COMPLETE
 - [X] T071 [P] [US3] E2E test for team assignment flow in frontend/tests/e2e/testTeamAssignmentFlow.spec.ts ✅ COMPLETE

### Implementation for User Story 3

 - [X] T072 [US3] Implement AssignmentService in backend/src/services/assignmentService.ts (depends on T064, T066) ✅ COMPLETE
 - [X] T073 [US3] Implement createAssignment service in backend/src/services/assignmentService.ts (depends on T065, T072) ✅ COMPLETE
 - [X] T074 [US3] Implement getTeamAllocation service in backend/src/services/assignmentService.ts (depends on T066, T072) ✅ COMPLETE
 - [X] T075 [US3] Implement POST /phases/:phaseId/assignments endpoint in backend/src/api/routes/assignmentRoutes.ts (depends on T065, T073) ✅ COMPLETE
 - [X] T076 [US3] Implement GET /team/allocation endpoint in backend/src/api/routes/assignmentRoutes.ts (depends on T066, T074) ✅ COMPLETE
 - [X] T077 [US3] Create TeamAssignmentForm component in frontend/src/components/TeamAssignmentForm.tsx (depends on T069, T025) ✅ COMPLETE
 - [X] T078 [US3] Create TeamAllocationView component in frontend/src/components/TeamAllocationView.tsx (depends on T070, T025) ✅ COMPLETE
 - [X] T079 [US3] Add over-allocation warning indicator in TeamAllocationView component (depends on T076, T074) ✅ COMPLETE
 - [X] T080 [US3] Implement allocation percentage calculation logic in AssignmentService (depends on T072, T010) ✅ COMPLETE
 - [X] T081 [US3] Add allocation percentage display in TeamAllocationView component (depends on T078, T080) ✅ COMPLETE
 - [X] T082 [US3] Implement TeamMember selector in TeamAssignmentForm component (depends on T025) ✅ COMPLETE

**Checkpoint**: At this point, User Story 3 should be fully functional and testable independently

---

## Phase 6: User Story 4 - Task and Phase Management (Priority: P2)

**Goal**: Managers and Team Leaders need to define tasks for each project phase with durations and track task completion. Team Members can view tasks for tracking purposes only. This enables granular progress tracking and helps identify bottlenecks.

**Why this priority**: Task management enables granular progress tracking and helps identify bottlenecks. While important, it's less critical than basic project tracking and team assignment.

**Independent Test**: A Team Leader can create tasks for their assigned phase, assign durations, and mark tasks as complete. A Team Member can view tasks but cannot modify them.

### Tests for User Story 4 (REQUIRED - TDD NON-NEGOTIABLE) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T083a [P] [US4] Unit test for Task model in backend/tests/unit/models/task.test.ts
- [X] T084a [P] [US4] Contract test for GET /phases/:phaseId/tasks endpoint in backend/tests/contract/testGetTasks.test.ts (depends on T010)
- [X] T085a [P] [US4] Contract test for POST /tasks endpoint in backend/tests/contract/testCreateTask.test.ts (depends on T010)
- [X] T086a [P] [US4] Contract test for PUT /tasks/:id endpoint in backend/tests/contract/testUpdateTask.test.ts (depends on T010)
- [X] T087a [P] [US4] Contract test for DELETE /tasks/:id endpoint in backend/tests/contract/testDeleteTask.test.ts (depends on T010)
- [X] T088a [P] [US4] Integration test for task completion triggers phase completion in backend/tests/integration/testTaskPhaseFlow.test.ts (depends on T010)
- [X] T089a [P] [US4] Integration test for role-based task permissions (Team Leader vs Team Member) in backend/tests/integration/testTaskPhaseFlow.test.ts (depends on T010)
- [X] T090a [P] [US4] Component test for TaskList component in frontend/tests/components/TaskList.test.tsx (depends on T025)
- [X] T091a [P] [US4] Component test for TaskForm component in frontend/tests/components/TaskForm.test.tsx (depends on T025)
- [X] T092a [P] [US4] Component test for TaskItem component in frontend/tests/components/TaskItem.test.tsx (depends on T025)
- [X] T093a [P] [US4] E2E test for task management flow in frontend/tests/e2e/testTaskManagementFlow.spec.ts (depends on T025)

### Implementation for User Story 4

- [X] T083 [US4] Implement getTasksByPhase service in backend/src/services/taskService.ts (depends on T010)
- [X] T084 [US4] Implement createTask service in backend/src/services/taskService.ts (depends on T010)
- [X] T085 [US4] Implement updateTask service in backend/src/services/taskService.ts (depends on T010)
- [X] T086 [US4] Implement deleteTask service in backend/src/services/taskService.ts (depends on T010)
- [X] T087 [US4] Implement GET /phases/:phaseId/tasks endpoint in backend/src/api/routes/taskRoutes.ts (depends on T083)
- [X] T088 [US4] Implement POST /tasks endpoint in backend/src/api/routes/taskRoutes.ts (depends on T084)
- [X] T089 [US4] Implement PUT /tasks/:id endpoint in backend/src/api/routes/taskRoutes.ts (depends on T085)
- [X] T090 [US4] Implement DELETE /tasks/:id endpoint in backend/src/api/routes/taskRoutes.ts (depends on T086)
- [X] T091 [US4] Implement checkPhaseCompletion service in backend/src/services/projectService.ts (depends on T010, T083)
- [X] T092 [US4] Implement phase completion logic in backend/src/services/projectService.ts (depends on T010, T091)
- [X] T093 [US4] Implement phase transitions with role-based authorization in backend/src/services/projectService.ts (depends on T092, T008)
- [X] T094 [US4] Create TaskList component in frontend/src/components/TaskList.tsx (depends on T025)
- [X] T095 [US4] Create TaskForm component in frontend/src/components/TaskForm.tsx (depends on T025)
- [X] T096 [US4] Create TaskItem component in frontend/src/components/TaskItem.tsx (depends on T025)
- [X] T097 [US4] Add task management section in ProjectDetail page with role-based controls (depends on T060, T094)
- [X] T098 [US4] Implement read-only task display for Team Members (no create/edit/delete controls)
- [X] T098a [US4] Implement phase expansion/collapse accordion in ProjectDetail page to show tasks (depends on T094, T097)
- [X] T099 [US4] Implement task assignment to team members in TaskForm component with validation (depends on T095, T010)
- [X] T099a [US4] Validation: Task can only be assigned to users assigned to same phase in backend/src/services/taskService.ts (depends on T099)

**Checkpoint**: At this point, User Story 4 should be fully functional and testable independently

---

## Phase 7: User Story 5 - Project Cost Tracking (Priority: P2)

**Goal**: Users need to track project costs including employee costs, material costs, and generate cost reports. This is essential for profitability analysis and project budgeting.

**Why this priority**: Cost tracking is essential for profitability analysis and project budgeting. It's important but can be added after core project tracking is working.

**Independent Test**: Users can record costs for a project, view total project cost, and generate a cost summary report without requiring KPIs or advanced analytics.

### Tests for User Story 5 (OPTIONAL - not explicitly requested)

### Implementation for User Story 5

- [X] T099 [US5] Implement CostEntryService in backend/src/services/costEntryService.ts (depends on T010)
- [X] T100 [US5] Implement createCostEntry service in backend/src/services/costEntryService.ts (depends on T099, T010)
- [X] T101 [US5] Implement updateCostEntry service in backend/src/services/costEntryService.ts (depends on T099, T010)
- [X] T102 [US5] Implement deleteCostEntry service in backend/src/services/costEntryService.ts (depends on T099, T010)
- [X] T103 [US5] Implement GET /projects/:id/costs endpoint in backend/src/api/routes/costRoutes.ts (depends on T099, T101)
- [X] T104 [US5] Implement GET /costs/summary endpoint in backend/src/api/routes/costRoutes.ts (depends on T099, T102)
- [X] T105 [US5] Implement CostList component in frontend/src/components/CostList.tsx (depends on T103, T025)
- [X] T106 [US5] Create CostForm component in frontend/src/components/CostForm.tsx (depends on T025)
- [X] T107 [US5] Implement cost summary report generation in backend/src/services/reportService.ts (depends on T102, T104)

**Checkpoint**: At this point, User Story 5 should be fully functional and testable independently

---

## Phase 8: User Story 6 - Employee KPIs and Performance Tracking (Priority: P2)

**Goal**: Managers need to track employee performance metrics including delayed tasks, client modifications, and technical mistakes. This helps identify training needs and improve team efficiency.

**Why this priority**: Performance tracking helps identify training needs and improve team efficiency. It's valuable but less critical than core project tracking.

**Independent Test**: Managers can view KPIs for employees, filter by phase or project, and see performance trends over time without requiring cost tracking or advanced analytics.

### Tests for User Story 6 (OPTIONAL - not explicitly requested)

### Implementation for User Story 6

- [X] T108 [US6] Implement KPIEntryService in backend/src/services/kpiService.ts (depends on T010)
- [X] T109 [US6] Implement createKPIEntry service in backend/src/services/kpiService.ts (depends on T010, T108)
- [X] T110 [US6] Implement updateKPIEntry service in backend/src/services/kpiService.ts (depends on T010, T108)
- [X] T111 [US6] Implement DELETE /kpis/:id endpoint in backend/src/api/routes/kpiRoutes.ts (depends on T109, T010)
- [X] T112 [US6] Implement GET /employees/:id/kpis endpoint in backend/src/api/routes/kpiRoutes.ts (depends on T108, T110)
- [X] T113 [US6] Implement GET /kpis/summary endpoint in backend/src/api/routes/kpiRoutes.ts (depends on T108, T112)
- [X] T114 [US6] Create EmployeeKPISummary component in frontend/src/components/EmployeeKPISummary.tsx (depends on T112, T025)
- [X] T115 [US6] Implement KPI tracking with phase filtering in EmployeeKPISummary component (depends on T113)

**Checkpoint**: ✅ At this point, User Story 6 should be fully functional and testable independently

---

## Phase 9: User Story 7 - Timeline and Calendar Views (Priority: P3)

**Goal**: Users need visual timeline views to see project schedules, phase transitions, and team availability over time. This improves planning efficiency and helps identify scheduling conflicts.

**Why this priority**: Visual timelines improve planning efficiency and help identify scheduling conflicts. They're nice-to-have but not essential for basic project tracking.

**Independent Test**: Users can view a Gantt chart or calendar showing all projects and phases, filter by time period, and identify overlapping projects without requiring detailed analytics.

### Tests for User Story 7 (OPTIONAL - not explicitly requested)

### Implementation for User Story 7

- [X] T116 [US7] Implement getTimelineData service in backend/src/services/projectService.ts (depends on T035)
- [X] T117 [US7] Implement getTimelineData service in backend/src/services/projectService.ts (depends on T035)
- [X] T117.1 [US7] Implement GET /projects/:id/timeline endpoint in backend/src/api/routes/projectRoutes.ts (depends on T116, T035)
- [ ] T118 [US7] Create TimelineView component in frontend/src/components/TimelineView.tsx (depends on T117, T025)
- [X] T118 [US7] Create TimelineView component in frontend/src/components/TimelineView.tsx (depends on T117, T025)
- [X] T119 [US7] Implement project filtering in TimelineView component (depends on T036, T025)

**Checkpoint**: ✅ At this point, User Story 7 should be fully functional and testable independently

---

## Phase 10: User Story 8 - Report Generation and Export (Priority: P3)

**Goal**: Users need to generate various reports including client reports, employee summaries, and project follow-up reports. This is important for client communication and internal reviews.

**Why this priority**: Reports are important for client communication and internal reviews. They're valuable but can be added after core functionality is stable.

**Independent Test**: Users can generate a project follow-up report, view it in the interface, and export it as PDF or Excel without requiring advanced analytics.

### Tests for User Story 8 (OPTIONAL - not explicitly requested)

### Implementation for User Story 8

- [X] T120 [US8] Implement exportProjectFollowUpReportPDF service in backend/src/services/reportService.ts (depends on T010)
- [X] T121 [US8] Implement generateProjectFollowUpReport service in backend/src/services/reportService.ts (depends on T120, T010)
- [X] T122 [US8] Implement getEmployeeSummaryReport service in backend/src/services/reportService.ts (depends on T114, T120)
- [X] T123 [US8] Implement GET /reports/project/:id/follow-up endpoint in backend/src/api/routes/reportRoutes.ts (depends on T121, T010)
- [X] T124 [US8] Implement GET /reports/employee/:id/summary endpoint in backend/src/api/routes/reportRoutes.ts (depends on T122, T010)
- [X] T125 [US8] Implement Excel export in report generation (depends on T120, T010)
- [X] T126 [US8] Implement Excel export in report generation ✅ COMPLETE
- [X] T127 [US8] Implement ReportViewer component in frontend/src/components/ReportViewer.tsx ✅ COMPLETE
- [X] T128 [US8] Implement ReportViewer component tests in frontend/tests/components/ReportViewer.test.tsx ✅ COMPLETE

**Checkpoint**: ✅ At this point, User Story 8 should be fully functional and testable independently

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Performance optimization, UI refinements, error handling improvements, and code quality improvements across all features.

**⚠️ NOTE**: This phase contains polish tasks that can be worked on after core features are complete.

- [ ] T129 [P] Optimize project list queries with database indexes and caching (depends on T036, T010)
- [ ] T130 [P] Optimize report generation performance (depends on T107, T010)
- [ ] T131 [P] Add error boundaries in frontend/src/components/ErrorBoundary.tsx (depends on T025)
- [ ] T132 [P] Improve accessibility compliance across all components (WCAG 2.1 AA verification) (depends on T025)
- [ ] T133 [P] Add loading spinners for better UX across slow operations (depends on T025)
- [ ] T134 [P] Implement retry logic for failed API calls in frontend/src/services/api.ts (depends on T025)
- [ ] T135 [P] Add toast notifications for user feedback in frontend/src/components/NotificationProvider.tsx (depends on T025)
- [ ] T136 [P] Clean up unused dependencies and optimize bundle size (depends on T002, T003)
- [ ] T137 [P] Configure automated database backups (weekly) per NFR-013 (depends on T006)
- [ ] T138 [P] Verify/Configure TLS 1.3+ encryption for data in transit per NFR-007 (depends on T001)

**Final Checkpoint**: At this point, all user stories and polish tasks should be complete, system is production-ready.

---

## Dependencies

**Task Dependencies** (in completion order):

### Phase 2 (Foundational) Dependencies

- T006, T010, T021 must complete before any Phase 3+ user story tasks
- T007, T008, T008.1 must complete before any Phase 3+ user story tasks
- T009, T025 must complete before any frontend Phase 3+ user story tasks

### User Story 1 (Dashboard) Dependencies

- T029, T030, T031 must complete before T035, T036, T037
- T032, T033, T034 must complete before T039, T040, T041, T042, T043, T044, T045, T046, T047

### User Story 2 (Project CRUD) Dependencies

- T010 must complete before all US2 tasks
- T048, T049, T050 must complete before T054, T055, T056, T057
- T025 must complete before T058, T059, T060
- T051, T052, T053 must complete before T059, T060

### User Story 3 (Team Assignment) Dependencies

- T010 must complete before all US3 tasks
- T064, T065, T066, T067, T068 must complete before T072, T073, T074, T075, T076
- T069, T070 must complete before T077, T078
- T025 must complete before T077, T078, T079, T080, T081, T082

### User Story 4 (Tasks/Phases) Dependencies

- T010, T083-T092 must complete before T094-T098
- T025 must complete before T094-T098

### User Story 5 (Costs) Dependencies

- T010 must complete before T099-T107
- T025 must complete before T105-T107

### User Story 6 (KPIs) Dependencies

- T010 must complete before T108-T115
- T025 must complete before T114-T115

### User Story 7 (Timeline) Dependencies

- T010 must complete before T116-T119
- T025, T036 must complete before T118-T119

### User Story 8 (Reports) Dependencies

- T010 must complete before T120-T128
- T025 must complete before T127-T128

### Phase 11 (Polish) Dependencies

- All core features must complete before polish tasks

---

## Implementation Strategy

### MVP Focus

**MVP Stories (P1)**: User Stories 1, 2, 3
- These stories provide core project management functionality
- All three are independently testable and can be delivered as a minimal viable product
- Suggested implementation order: Complete Phase 2 first, then implement US1, US2, US3 in parallel
- After P1 complete, add P2 and P3 stories incrementally

### Incremental Delivery

- **Phase 3+ stories**: Each delivered as complete, independently testable features
- **Parallel execution**: Mark tasks with [P] that can run concurrently (different files, no blocking dependencies)
- **Quality Gates**: Unit tests pass, integration tests pass, code coverage 80%+, linting passes before marking complete

### Rollback Plan

- **Database migrations**: All migrations must be reversible with rollback scripts
- **API versioning**: Breaking changes require /api/v2/ endpoint with backward compatibility period
- **Feature flags**: Optional features (US7, US8) can be deployed via feature flags if needed

---

## Summary

**Total Tasks**: 136
**MVP Tasks**: 54 (US1: 19, US2: 18, US3: 17)
**Polish Tasks**: 8 (Phase 11)
**Test Tasks**: 35 (Phase 3, US1, US2, US3 have explicit test requirements)
**Implementation Tasks**: 101 (all remaining tasks)
**Parallel Opportunities**: Multiple tasks marked [P] for concurrent execution

**Estimated MVP Duration**: 2-3 weeks (excluding polish)
**Estimated Full Duration**: 4-5 weeks (including polish)
# Additional Tasks: Missing User Stories
# Generated for 002-full-saas to complete coverage

**Purpose**: Tasks for User Stories 3, 5, 6, 7, 8 that were missing from original tasks.md

**Note**: These tasks follow the same format and conventions as tasks.md

---

## Phase 4: User Story 3 - Team Member Assignment and Allocation (Priority: P1) 🎯 MVP

**Goal**: Managers need to assign team members to projects and track their allocation over time. Enables effective resource planning and ensures projects have adequate staffing.

**Why this priority**: Team allocation is critical for resource planning. Without this, projects cannot be staffed effectively.

**Independent Test**: A manager can assign team members to a project, view their allocation percentage, and see their workload across multiple projects without requiring cost tracking.

### Tests for User Story 3 (REQUIRED - TDD NON-NEGOTIABLE) ⚠️

- [ ] T050 [P] [US3] Unit test for Assignment model in backend/tests/unit/models/assignment.test.ts
- [ ] T051 [P] [US3] Unit test for TeamService (team assignment logic) in backend/tests/unit/services/teamService.test.ts
- [ ] T052 [P] [US3] Cross-contract test for POST /assignments endpoint in backend/tests/contract/testPostAssignment.test.ts
- [ ] T053 [P] [US3] Cross-contract test for GET /assignments/team/:memberId in backend/tests/contract/testGetTeamAssignments.test.ts
- [ ] T054 [P] [US3] Integration test for team allocation user journey in backend/tests/integration/testTeamAllocationJourney.test.ts
- [ ] T055 [P] [US3] Component test for TeamAssignmentForm in frontend/tests/components/TeamAssignmentForm.test.tsx
- [ ] T056 [P] [US3] E2E test for team assignment flow in frontend/tests/e2e/testTeamAssignmentFlow.spec.ts

### Implementation for User Story 3

- [ ] T057 [US3] Implement TeamService in backend/src/services/teamService.ts (team assignment, allocation tracking)
- [ ] T058 [US3] Implement POST /assignments endpoint in backend/src/api/routes/assignmentRoutes.ts (assign team member to project with allocation %)
- [ ] T059 [US3] Implement GET /assignments/team/:memberId endpoint in backend/src/api/routes/assignmentRoutes.ts (get all assignments for team member)
- [ ] T060 [US3] Implement GET /assignments/project/:projectId endpoint in backend/src/api/routes/assignmentRoutes.ts (get all team members assigned to project)
- [ ] T061 [US3] Implement allocation validation (>100% warning, override logic) in backend/src/services/teamService.ts (FR-007, FR-032)
- [ ] T062 [US3] Implement TeamAssignmentForm component in frontend/src/components/TeamAssignmentForm.tsx
- [ ] T063 [US3] Implement TeamWorkloadView component in frontend/src/components/TeamWorkloadView.tsx (show allocation across projects with warning for >100%)

**Checkpoint**: Team assignment and allocation tracking complete

---

## Phase 5: User Story 5 - Project Cost Tracking (Priority: P2) 💰

**Goal**: Users can track project costs including employee costs, material costs, and generate cost reports. Essential for profitability analysis and project budgeting.

**Why this priority**: Cost tracking is essential for profitability analysis. Important but can be added after core project tracking is working.

**Independent Test**: Users can record costs for a project, view total project cost, and generate a cost summary report without requiring KPIs or advanced analytics.

### Tests for User Story 5 (REQUIRED - TDD NON-NEGOTIABLE) ⚠️

- [ ] T070 [P] [US5] Unit test for CostEntry model in backend/tests/unit/models/costEntry.test.ts
- [ ] T071 [P] [US5] Unit test for CostService in backend/tests/unit/services/costService.test.ts
- [ ] T072 [P] [US5] Cross-contract test for POST /costs endpoint in backend/tests/contract/testPostCostEntry.test.ts
- [ ] T073 [P] [US5] Cross-contract test for GET /costs/project/:projectId in backend/tests/contract/testGetProjectCosts.test.ts
- [ ] T074 [P] [US5] Integration test for cost tracking user journey in backend/tests/integration/testCostTrackingJourney.test.ts
- [ ] T075 [P] [US5] Component test for CostEntryForm in frontend/tests/components/CostEntryForm.test.tsx
- [ ] T076 [P] [US5] Component test for CostSummary in frontend/tests/components/CostSummary.test.tsx

### Implementation for User Story 5

- [ ] T077 [US5] Implement CostService in backend/src/services/costService.ts (FR-013, FR-014, FR-015)
- [ ] T078 [US5] Implement POST /costs endpoint in backend/src/api/routes/costRoutes.ts (add cost entry)
- [ ] T079 [US5] Implement GET /costs/project/:projectId endpoint in backend/src/api/routes/costRoutes.ts (get costs broken down by category)
- [ ] T080 [US5] Implement GET /costs/summary/:projectId endpoint in backend/src/api/routes/costRoutes.ts (cost summary report)
- [ ] T081 [US5] Implement duplicate cost entry validation in backend/src/services/costService.ts (FR-015 edge case)
- [ ] T082 [US5] Implement CostEntryForm component in frontend/src/components/CostEntryForm.tsx
- [ ] T083 [US5] Implement CostSummary component in frontend/src/components/CostSummary.tsx

**Checkpoint**: Cost tracking complete

---

## Phase 6: User Story 6 - Employee KPIs and Performance Tracking (Priority: P2) 📊

**Goal**: Managers can track employee performance metrics including delayed tasks, client modifications, and technical mistakes. Helps identify training needs and improve team efficiency.

**Why this priority**: Performance tracking helps identify training needs. Valuable but less critical than core project tracking.

**Independent Test**: Managers can view KPIs for employees, filter by phase or project, and see performance trends over time without requiring cost tracking.

### Tests for User Story 6 (REQUIRED - TDD NON-NEGOTIABLE) ⚠️

- [ ] T090 [P] [US6] Unit test for KPIEntry model in backend/tests/unit/models/kpiEntry.test.ts
- [ ] T091 [P] [US6] Unit test for KPIService in backend/tests/unit/services/kpiService.test.ts
- [ ] T092 [P] [US6] Cross-contract test for POST /kpis endpoint in backend/tests/contract/testPostKPIEntry.test.ts
- [ ] T093 [P] [US6] Cross-contract test for GET /kpis/employee/:employeeId in backend/tests/contract/testGetEmployeeKPIs.test.ts
- [ ] T094 [P] [US6] Integration test for KPI tracking user journey in backend/tests/integration/testKPITrackingJourney.test.ts
- [ ] T095 [P] [US6] Component test for KPIDashboard in frontend/tests/components/KPIDashboard.test.tsx

### Implementation for User Story 6

- [ ] T096 [US6] Implement KPIService in backend/src/services/kpiService.ts (FR-016, FR-017)
- [ ] T097 [US6] Implement POST /kpis endpoint in backend/src/api/routes/kpiRoutes.ts (add KPI entry)
- [ ] T098 [US6] Implement GET /kpis/employee/:employeeId endpoint in backend/src/api/routes/kpiRoutes.ts (get KPIs with filtering by phase/project)
- [ ] T099 [US6] Implement GET /kpis/summary endpoint in backend/src/api/routes/kpiRoutes.ts (KPI trends over time)
- [ ] T100 [US6] Implement KPIDashboard component in frontend/src/components/KPIDashboard.tsx

**Checkpoint**: KPI tracking complete

---

## Phase 7: User Story 7 - Timeline and Calendar Views (Priority: P3) 📅

**Goal**: Users need visual timeline views to see project schedules, phase transitions, and team availability over time. Improves planning efficiency and helps identify scheduling conflicts.

**Why this priority**: Visual timelines improve planning efficiency. Nice-to-have but not essential for basic project tracking.

**Independent Test**: Users can view a Gantt chart or calendar showing all projects and phases, filter by time period, and identify overlapping projects.

### Tests for User Story 7 (REQUIRED - TDD NON-NEGOTIABLE) ⚠️

- [ ] T110 [P] [US7] Unit test for TimelineService in backend/tests/unit/services/timelineService.test.ts
- [ ] T111 [P] [US7] Cross-contract test for GET /timeline endpoint in backend/tests/contract/testGetTimeline.test.ts
- [ ] T112 [P] [US7] Integration test for timeline view user journey in backend/tests/integration/testTimelineViewJourney.test.ts
- [ ] T113 [P] [US7] Component test for TimelineView (Gantt chart) in frontend/tests/components/TimelineView.test.tsx
- [ ] T114 [P] [US7] Component test for CalendarView in frontend/tests/components/CalendarView.test.tsx

### Implementation for User Story 7

- [ ] T115 [US7] Implement TimelineService in backend/src/services/timelineService.ts (FR-018)
- [ ] T116 [US7] Implement GET /timeline endpoint in backend/src/api/routes/timelineRoutes.ts (get project schedules and phase transitions)
- [ ] T117 [US7] Implement TimelineView component (Gantt chart) in frontend/src/components/TimelineView.tsx
- [ ] T118 [US7] Implement CalendarView component in frontend/src/components/CalendarView.tsx
- [ ] T119 [US7] Implement conflict detection for overlapping projects in backend/src/services/timelineService.ts (identify scheduling conflicts)

**Checkpoint**: Timeline and calendar views complete

---

## Phase 8: User Story 8 - Report Generation and Export (Priority: P3) 📄

**Goal**: Users can generate various reports including client reports, employee summaries, and project follow-up reports. Important for client communication and internal reviews.

**Why this priority**: Reports are important for client communication. Valuable but can be added after core functionality is stable.

**Independent Test**: Users can generate a project follow-up report, view it in the interface, and export it as PDF or Excel.

### Tests for User Story 8 (REQUIRED - TDD NON-NEGATIBLE) ⚠️

- [ ] T130 [P] [US8] Unit test for ReportService in backend/tests/unit/services/reportService.test.ts
- [ ] T131 [P] [US8] Cross-contract test for POST /reports/generate endpoint in backend/tests/contract/testGenerateReport.test.ts
- [ ] T132 [P] [US8] Cross-contract test for GET /reports/:reportId/pdf in backend/tests/contract/testGetReportPDF.test.ts
- [ ] T133 [P] [US8] Cross-contract test for GET /reports/:reportId/excel in backend/tests/contract/testGetReportExcel.test.ts
- [ ] T134 [P] [US8] Integration test for report generation user journey in backend/tests/integration/testReportGenerationJourney.test.ts
- [ ] T135 [P] [US8] Component test for ReportViewer in frontend/tests/components/ReportViewer.test.tsx

### Implementation for User Story 8

- [ ] T136 [US8] Implement ReportService in backend/src/services/reportService.ts (FR-019, FR-020)
- [ ] T137 [US8] Implement POST /reports/generate endpoint in backend/src/api/routes/reportRoutes.ts (generate project follow-up report)
- [ ] T138 [US8] Implement GET /reports/:reportId/pdf endpoint in backend/src/api/routes/reportRoutes.ts (export PDF)
- [ ] T139 [US8] Implement GET /reports/:reportId/excel endpoint in backend/src/api/routes/reportRoutes.ts (export Excel)
- [ ] T140 [US8] Implement error handling for report generation failure (edge case) in backend/src/services/reportService.ts (cleanup, retry logic)
- [ ] T141 [US8] Implement ReportViewer component in frontend/src/components/ReportViewer.tsx

**Checkpoint**: Report generation and export complete

---

## Phase 9: Testing, Optimization, and Deployment

**Purpose**: Final testing, performance optimization, and deployment preparation

### Testing

- [ ] T150 [P] Run all unit tests - ensure 80%+ code coverage (NFR-015)
- [ ] T151 [P] Run all integration tests - verify multi-step user journeys
- [ ] T152 [P] Run all E2E tests - verify end-to-end workflows
- [ ] T153 [P] Performance testing - verify dashboard load <2s for 1000 projects (NFR-001, NFR-003)
- [ ] T154 [P] Performance testing - verify API response times <500ms for critical endpoints (NFR-004)
- [ ] T155 [P] Performance testing - verify report generation <10s for 50+ cost entries (NFR-002)

### Optimization

- [ ] T156 [P] Add Redis caching for frequently accessed data (NFR-014)
- [ ] T157 [P] Implement database query optimization for large datasets (NFR-003)
- [ ] T158 [P] Add structured logging with correlation IDs (NFR-011)
- [ ] T159 [P] Set up health check endpoints (NFR-012)
- [ ] T160 [P] Configure Prometheus metrics (NFR-011)

### Documentation

- [ ] T161 [P] Update API documentation (OpenAPI spec)
- [ ] T162 [P] Update quickstart guide with new features
- [ ] T163 [P] Write deployment documentation

### Deployment

- [ ] T164 [P] Set up CI/CD pipeline
- [ ] T165 [P] Configure staging environment
- [ ] T166 [P] Test deployment to staging
- [ ] T167 [P] Configure database backups (NFR-013)
- [ ] T168 [P] Deploy to production
- [ ] T169 [P] Monitor production health

**Checkpoint**: System tested, optimized, and deployed to production

---

## Summary

- **Total New Tasks**: 90 (T050-T169)
- **Tasks by User Story:**
  - US3 (Team Assignment): 18 tasks
  - US5 (Cost Tracking): 17 tasks
  - US6 (KPIs): 11 tasks
  - US7 (Timeline): 10 tasks
  - US8 (Reports): 12 tasks
  - Testing/Optimization/Deployment: 22 tasks

**Overall Project Status:**
- **Original tasks:** 40 (all complete [X])
- **New tasks:** 90 (all pending [ ])
- **Total tasks:** 130
- **Complete:** 30.8%
- **Remaining:** 69.2%
