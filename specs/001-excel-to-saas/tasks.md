---

description: "Task list for Excel to SaaS feature implementation"
---

# Tasks: Excel to SaaS Migration

**Input**: Design documents from `/specs/001-excel-to-saas/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED (NON-NEGOTIABLE per constitution principle III)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`, `backend/tests/`
- **Frontend**: `frontend/src/`, `frontend/tests/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project structure per implementation plan
- [X] T002 Initialize backend Node.js project with Express.js, TypeScript dependencies
- [X] T003 [P] Initialize frontend React project with Vite, TypeScript dependencies
- [X] T004 [P] Configure ESLint and Prettier for backend
- [X] T005 [P] Configure ESLint and Prettier for frontend

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Setup Prisma with PostgreSQL database connection
- [X] T007 [P] Implement authentication middleware with Auth0 in backend/src/middleware/auth.ts
- [X] T008 [P] Implement authorization middleware with RBAC in backend/src/middleware/authz.ts
- [X] T009 [P] Setup API routing and Express app structure in backend/src/api/routes/index.ts
- [X] T010 [P] Create Prisma schema with all 11 entities in backend/prisma/schema.prisma
- [X] T011 [P] Create User model and relations in backend/prisma/schema.prisma
- [X] T012 [P] Create Client model and relations in backend/prisma/schema.prisma
- [X] T013 [P] Create Project model and relations in backend/prisma/schema.prisma
- [X] T014 [P] Create Phase model and relations in backend/prisma/schema.prisma
- [X] T015 [P] Create Task model and relations in backend/prisma/schema.prisma
- [X] T016 [P] Create Assignment model and relations in backend/prisma/schema.prisma
- [X] T017 [P] Create CostEntry model and relations in backend/prisma/schema.prisma
- [X] T018 [P] Create KPIEntry model and relations in backend/prisma/schema.prisma
- [X] T019 [P] Create ConfigurationItem model in backend/prisma/schema.prisma
- [X] T020 [P] Create AuditLog model in backend/prisma/schema.prisma
- [X] T020.1 [P] Create ProjectRequirement model in backend/prisma/schema.prisma
- [X] T021 [P] Run database migration in backend/prisma/migrations
- [X] T021.1 [P] Implement AuditLogService in backend/src/services/auditLogService.ts
- [X] T021.2 [P] Create audit logging middleware in backend/src/middleware/auditMiddleware.ts
- [X] T021.3 [P] Unit test for AuditLogService in backend/tests/unit/services/auditLogService.test.ts
- [X] T022 [P] Configure Winston logging in backend/src/utils/logger.ts
- [X] T023 [P] Configure error handling middleware in backend/src/middleware/errorHandler.ts
- [X] T023.1 [P] Implement optimistic locking middleware in backend/src/middleware/optimisticLock.ts
- [X] T023.2 [P] Unit test for optimistic locking in backend/tests/unit/middleware/optimisticLock.test.ts
- [X] T023.3 [P] Verify version field exists on Project, Phase, Task, Assignment models in backend/prisma/schema.prisma
- [X] T024 [P] Setup environment configuration with dotenv in backend/.env.example
- [X] T025 [P] Setup Axios API client in frontend/src/services/api.ts
- [X] T026 [P] Configure Zustand store for authentication state in frontend/src/state/authStore.ts
- [X] T027 [P] Setup Material-UI theme provider in frontend/src/App.tsx
- [X] T028 [P] Setup React Router in frontend/src/App.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 2.5: Data Migration Infrastructure (Constitution Mandate)

**Purpose**: Excel data import with validation - Constitution Principle II requires migration accuracy as foundational

**⚠️ CRITICAL**: This phase implements FR-020 and enables historical data validation throughout development

### Tests for Data Migration (REQUIRED - TDD NON-NEGOTIABLE) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T028.1 [P] Unit test for Excel parser in backend/tests/unit/services/excelParser.test.ts
- [X] T028.2 [P] Unit test for data validation rules in backend/tests/unit/services/migrationValidator.test.ts
- [X] T028.3 [P] Integration test for Excel-to-database import in backend/tests/integration/testExcelImport.ts
- [X] T028.4 [P] Integration test for migration rollback in backend/tests/integration/testMigrationRollback.ts

### Implementation for Data Migration

- [X] T028.5 Implement Excel parser with SheetJS in backend/src/services/excelImportService.ts (depends on T028.1)
- [X] T028.6 Implement data validation service in backend/src/services/migrationValidator.ts (depends on T028.2)
- [X] T028.7 Implement transactional bulk import with rollback in backend/src/services/excelImportService.ts (depends on T028.3, T028.4)
- [X] T028.8 Implement import error reporting in backend/src/services/excelImportService.ts
- [X] T028.9 Implement POST /import/excel/validate endpoint in backend/src/api/routes/importRoutes.ts
- [X] T028.10 Implement POST /import/excel endpoint in backend/src/api/routes/importRoutes.ts

**Checkpoint**: Excel import ready - can validate implementation against source data throughout development

---

## Phase 3: User Story 1 - Project Tracking Dashboard (Priority: P1) 🎯 MVP

**Goal**: Project managers can view and manage all active projects with status indicators, progress, and key dates

**Independent Test**: Users can view a dashboard listing all projects, filter by status/phase, and click projects to view details

### Tests for User Story 1 (REQUIRED - TDD NON-NEGOTIABLE) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T029 [P] [US1] Unit test for Project model in backend/tests/unit/models/project.test.ts
- [X] T030 [P] [US1] Contract test for GET /projects endpoint in backend/tests/contract/testGetProjects.ts
- [X] T031 [P] [US1] Integration test for dashboard user journey in backend/tests/integration/testDashboardJourney.ts
- [X] T032 [P] [US1] Component test for ProjectList component in frontend/tests/components/ProjectList.test.tsx
- [X] T034 [P] [US1] E2E test for dashboard flow in frontend/tests/e2e/testDashboardFlow.spec.ts

### Implementation for User Story 1

- [X] T035 [US1] Implement ProjectService in backend/src/services/projectService.ts (depends on T029)
- [X] T036 [US1] Implement GET /projects endpoint with filtering in backend/src/api/routes/projectRoutes.ts (depends on T030, T035)
- [X] T037 [US1] Implement GET /projects/:id endpoint in backend/src/api/routes/projectRoutes.ts (depends on T035)
- [X] T038 [US1] Implement GET /projects/:id/dashboard endpoint in backend/src/api/routes/projectRoutes.ts (depends on T035)
- [X] T039 [US1] Create ProjectList component in frontend/src/components/ProjectList.tsx (depends on T032)
- [X] T040 [US1] Create ProjectCard component in frontend/src/components/ProjectCard.tsx (depends on T033)
- [X] T041 [US1] Create ProjectFilter component in frontend/src/components/ProjectFilter.tsx
- [X] T042 [US1] Create Dashboard page in frontend/src/pages/Dashboard.tsx (depends on T039, T040, T041, T036)
- [X] T043 [US1] Implement project filtering in frontend/src/pages/Dashboard.tsx
- [X] T044 [US1] Add project status indicators in frontend/src/components/ProjectCard.tsx
- [X] T045 [US1] Add progress bars in frontend/src/components/ProjectCard.tsx
- [X] T046 [US1] Add navigation to project detail in frontend/src/pages/Dashboard.tsx
- [X] T047 [US1] Add loading and error states in frontend/src/components/ProjectList.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Project Creation and Management (Priority: P1) 🎯 MVP

**Goal**: Users can create new projects with client details, contract info, phase assignments, and team allocations

**Independent Test**: A user can create a complete project record and view it in the project list

### Tests for User Story 2 (REQUIRED - TDD NON-NEGOTIABLE) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T048 [P] [US2] Contract test for POST /projects endpoint in backend/tests/contract/testCreateProject.ts
- [X] T049 [P] [US2] Contract test for PUT /projects/:id endpoint in backend/tests/contract/testUpdateProject.ts
- [X] T050 [P] [US2] Integration test for project creation flow in backend/tests/integration/testProjectCreationFlow.ts
- [X] T051 [P] [US2] Component test for ProjectForm component in frontend/tests/components/ProjectForm.test.tsx
- [X] T052 [P] [US2] Component test for ProjectDetail component in frontend/tests/components/ProjectDetail.test.tsx
- [X] T053 [P] [US2] E2E test for project creation flow in frontend/tests/e2e/testProjectCreationFlow.spec.ts

### Implementation for User Story 2

- [X] T054 [US2] Implement createProject service in backend/src/services/projectService.ts (depends on T048)
- [X] T055 [US2] Implement updateProject service in backend/src/services/projectService.ts (depends on T049)
- [X] T056 [US2] Implement POST /projects endpoint in backend/src/api/routes/projectRoutes.ts (depends on T054)
- [X] T057 [US2] Implement PUT /projects/:id endpoint in backend/src/api/routes/projectRoutes.ts (depends on T055)
- [X] T058 [US2] Implement GET /projects/:id endpoint with full details in backend/src/api/routes/projectRoutes.ts (depends on T037)
- [X] T059 [US2] Create ProjectForm component in frontend/src/components/ProjectForm.tsx (depends on T051)
- [X] T060 [US2] Create ClientSelector component in frontend/src/components/ClientSelector.tsx
- [X] T061 [US2] Create ProjectDetail page in frontend/src/pages/ProjectDetail.tsx (depends on T052)
- [X] T062 [US2] Add form validation in frontend/src/components/ProjectForm.tsx
- [X] T063 [US2] Add date validation in frontend/src/components/ProjectForm.tsx
- [ ] T064 [US2] Add success/error notifications in frontend/src/components/ProjectForm.tsx

### Modification Tracking (FR-016)

- [X] T064.1 [P] [US2] Unit test for modification tracking service in backend/tests/unit/services/modificationTracking.test.ts
- [X] T064.2 [P] [US2] Contract test for GET /projects/:id/modifications endpoint in backend/tests/contract/testGetModifications.ts
- [X] T064.3 [US2] Implement ModificationTrackingService in backend/src/services/modificationTrackingService.ts (depends on T064.1)
- [X] T064.4 [US2] Implement GET /projects/:id/modifications endpoint in backend/src/api/routes/projectRoutes.ts (depends on T064.2)
- [X] T064.5 [US2] Create ModificationHistory component in frontend/src/components/ModificationHistory.tsx
- [X] T064.6 [US2] Add modification history panel to ProjectDetail page in frontend/src/pages/ProjectDetail.tsx

### Project Requirements Tracking (FR-017)

- [X] T064.7 [P] [US2] Unit test for ProjectRequirement model in backend/tests/unit/models/projectRequirement.test.ts
- [X] T064.8 [P] [US2] Contract test for POST /projects/:id/requirements endpoint in backend/tests/contract/testCreateRequirement.ts
- [X] T064.9 [P] [US2] Contract test for PATCH /requirements/:id/complete endpoint in backend/tests/contract/testCompleteRequirement.ts
- [X] T064.10 [US2] Implement RequirementService in backend/src/services/requirementService.ts (depends on T064.7)
- [X] T064.11 [US2] Implement POST /projects/:id/requirements endpoint in backend/src/api/routes/requirementRoutes.ts (depends on T064.8)
- [X] T064.12 [US2] Implement PATCH /requirements/:id/complete endpoint in backend/src/api/routes/requirementRoutes.ts (depends on T064.9)
- [X] T064.13 [US2] Create RequirementsList component in frontend/src/components/RequirementsList.tsx
- [X] T064.14 [US2] Create RequirementForm component in frontend/src/components/RequirementForm.tsx
- [X] T064.15 [US2] Add requirements section to ProjectDetail page in frontend/src/pages/ProjectDetail.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Team Member Assignment and Allocation (Priority: P1) 🎯 MVP

**Goal**: Managers can assign team members to projects and track their allocation over time with over-allocation warnings

**Independent Test**: A manager can assign team members, view their allocation percentage, and see workload across multiple projects

### Tests for User Story 3 (REQUIRED - TDD NON-NEGOTIABLE) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T065 [P] [US3] Unit test for Assignment model in backend/tests/unit/models/assignment.test.ts
- [X] T066 [P] [US3] Contract test for POST /phases/:phaseId/assignments endpoint in backend/tests/contract/testCreateAssignment.ts
- [X] T067 [P] [US3] Contract test for GET /team/allocation endpoint in backend/tests/contract/testGetTeamAllocation.ts
- [X] T068 [P] [US3] Integration test for team allocation calculation in backend/tests/integration/testTeamAllocation.ts
- [X] T069 [P] [US3] Component test for TeamAssignmentForm component in frontend/tests/components/TeamAssignmentForm.test.tsx
- [X] T070 [P] [US3] Component test for TeamAllocationView component in frontend/tests/components/TeamAllocationView.test.tsx
- [X] T071 [P] [US3] E2E test for team assignment flow in frontend/tests/e2e/testTeamAssignmentFlow.spec.ts

### Implementation for User Story 3

- [X] T072 [US3] Implement AssignmentService in backend/src/services/assignmentService.ts (depends on T065)
- [X] T073 [US3] Implement createAssignment service in backend/src/services/assignmentService.ts (depends on T066)
- [X] T074 [US3] Implement getTeamAllocation service in backend/src/services/assignmentService.ts (depends on T067)
- [X] T075 [US3] Implement allocation calculation logic in backend/src/services/assignmentService.ts (depends on T068)
- [X] T076 [US3] Implement over-allocation warning logic in backend/src/services/assignmentService.ts
- [X] T077 [US3] Implement POST /phases/:phaseId/assignments endpoint in backend/src/api/routes/assignmentRoutes.ts (depends on T073)
- [X] T078 [US3] Implement GET /team/allocation endpoint in backend/src/api/routes/assignmentRoutes.ts (depends on T074)
- [X] T079 [US3] Create TeamAssignmentForm component in frontend/src/components/TeamAssignmentForm.tsx (depends on T069)
- [X] T080 [US3] Create TeamAllocationView component in frontend/src/components/TeamAllocationView.tsx (depends on T070)
- [X] T081 [US3] Add over-allocation warning indicator in frontend/src/components/TeamAllocationView.tsx (depends on T076)
- [X] T082 [US3] Add allocation percentage display in frontend/src/components/TeamAllocationView.tsx

**Checkpoint**: At this point, all P1 user stories (US1, US2, US3) should be independently functional - MVP complete!

---

## Phase 6: User Story 4 - Task and Phase Management (Priority: P2)

**Goal**: Users can define tasks for each project phase with durations and track task completion

**Independent Test**: Users can create tasks, assign durations, and mark tasks as complete

### Tests for User Story 4 (REQUIRED - TDD NON-NEGOTIABLE) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T083 [P] [US4] Unit test for Task model in backend/tests/unit/models/task.test.ts
- [ ] T084 [P] [US4] Unit test for Phase model in backend/tests/unit/models/phase.test.ts
- [ ] T085 [P] [US4] Contract test for POST /phases/:phaseId/tasks endpoint in backend/tests/contract/testCreateTask.ts
- [ ] T086 [P] [US4] Contract test for POST /phases endpoint in backend/tests/contract/testCreatePhase.ts
- [ ] T087 [P] [US4] Contract test for POST /phases/:id/complete endpoint in backend/tests/contract/testCompletePhase.ts
- [ ] T088 [P] [US4] Contract test for POST /tasks/:id/complete endpoint in backend/tests/contract/testCompleteTask.ts
- [ ] T089 [P] [US4] Integration test for phase progress calculation in backend/tests/integration/testPhaseProgress.ts
- [ ] T090 [P] [US4] Component test for TaskList component in frontend/tests/components/TaskList.test.tsx
- [ ] T091 [P] [US4] Component test for TaskForm component in frontend/tests/components/TaskForm.test.tsx
- [ ] T092 [P] [US4] E2E test for task management flow in frontend/tests/e2e/testTaskManagementFlow.spec.ts

### Implementation for User Story 4

- [ ] T093 [US4] Implement TaskService in backend/src/services/taskService.ts (depends on T083)
- [ ] T094 [US4] Implement PhaseService in backend/src/services/phaseService.ts (depends on T084)
- [ ] T095 [US4] Implement createTask service in backend/src/services/taskService.ts (depends on T085)
- [ ] T096 [US4] Implement completeTask service in backend/src/services/taskService.ts (depends on T088)
- [ ] T097 [US4] Implement calculatePhaseProgress service in backend/src/services/phaseService.ts (depends on T089)
- [ ] T098 [US4] Implement auto-complete-phase logic in backend/src/services/phaseService.ts
- [ ] T099 [US4] Implement POST /phases/:phaseId/tasks endpoint in backend/src/api/routes/taskRoutes.ts (depends on T095)
- [ ] T100 [US4] Implement POST /phases endpoint in backend/src/api/routes/phaseRoutes.ts (depends on T094)
- [ ] T101 [US4] Implement POST /phases/:id/complete endpoint in backend/src/api/routes/phaseRoutes.ts (depends on T098)
- [ ] T102 [US4] Implement POST /tasks/:id/complete endpoint in backend/src/api/routes/taskRoutes.ts (depends on T096)
- [ ] T103 [US4] Create TaskList component in frontend/src/components/TaskList.tsx (depends on T090)
- [ ] T104 [US4] Create TaskForm component in frontend/src/components/TaskForm.tsx (depends on T091)
- [ ] T105 [US4] Add task status toggle in frontend/src/components/TaskList.tsx
- [ ] T106 [US4] Add progress indicators in frontend/src/components/TaskList.tsx
- [ ] T107 [US4] Add visual timeline in frontend/src/pages/ProjectDetail.tsx

**Checkpoint**: At this point, User Story 4 should be fully functional

---

## Phase 7: User Story 5 - Project Cost Tracking (Priority: P2)

**Goal**: Users can track project costs and generate cost summary reports

**Independent Test**: Users can record costs, view total project cost, and generate a cost summary report

### Tests for User Story 5 (REQUIRED - TDD NON-NEGOTIABLE) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T108 [P] [US5] Unit test for CostEntry model in backend/tests/unit/models/costEntry.test.ts
- [ ] T109 [P] [US5] Contract test for POST /projects/:projectId/costs endpoint in backend/tests/contract/testCreateCostEntry.ts
- [ ] T110 [P] [US5] Contract test for GET /costs/reports/summary endpoint in backend/tests/contract/testGetCostSummary.ts
- [ ] T111 [P] [US5] Integration test for cost aggregation in backend/tests/integration/testCostAggregation.ts
- [ ] T112 [P] [US5] Component test for CostEntryForm component in frontend/tests/components/CostEntryForm.test.tsx
- [ ] T113 [P] [US5] Component test for CostReport component in frontend/tests/components/CostReport.test.tsx
- [ ] T114 [P] [US5] E2E test for cost tracking flow in frontend/tests/e2e/testCostTrackingFlow.spec.ts

### Implementation for User Story 5

- [ ] T115 [US5] Implement CostService in backend/src/services/costService.ts (depends on T108)
- [ ] T116 [US5] Implement createCostEntry service in backend/src/services/costService.ts (depends on T109)
- [ ] T117 [US5] Implement getCostSummary service in backend/src/services/costService.ts (depends on T110)
- [ ] T118 [US5] Implement cost aggregation logic in backend/src/services/costService.ts (depends on T111)
- [ ] T119 [US5] Implement over-budget alert logic in backend/src/services/costService.ts
- [ ] T120 [US5] Implement POST /projects/:projectId/costs endpoint in backend/src/api/routes/costRoutes.ts (depends on T116)
- [ ] T121 [US5] Implement GET /costs/reports/summary endpoint in backend/src/api/routes/costRoutes.ts (depends on T117)
- [ ] T122 [US5] Create CostEntryForm component in frontend/src/components/CostEntryForm.tsx (depends on T112)
- [ ] T123 [US5] Create CostReport component in frontend/src/components/CostReport.tsx (depends on T113)
- [ ] T124 [US5] Add cost breakdown views in frontend/src/components/CostReport.tsx
- [ ] T125 [US5] Add over-budget alert in frontend/src/components/CostReport.tsx

**Checkpoint**: At this point, User Story 5 should be fully functional

---

## Phase 8: User Story 6 - Employee KPIs and Performance Tracking (Priority: P2)

**Goal**: Managers can track employee performance metrics including delayed tasks, client modifications, and technical mistakes

**Independent Test**: Managers can view KPIs for employees, filter by phase or project, and see performance trends

### Tests for User Story 6 (REQUIRED - TDD NON-NEGOTIABLE) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T126 [P] [US6] Unit test for KPIEntry model in backend/tests/unit/models/kpiEntry.test.ts
- [ ] T127 [P] [US6] Contract test for POST /employees/:employeeId/kpis endpoint in backend/tests/contract/testCreateKPIEntry.ts
- [ ] T128 [P] [US6] Contract test for GET /kpis/reports/performance endpoint in backend/tests/contract/testGetPerformanceReport.ts
- [ ] T129 [P] [US6] Integration test for KPI score calculation in backend/tests/integration/testKPICalculation.ts
- [ ] T130 [P] [US6] Component test for KPIDashboard component in frontend/tests/components/KPIDashboard.test.tsx
- [ ] T131 [P] [US6] Component test for KPIReport component in frontend/tests/components/KPIReport.test.tsx
- [ ] T132 [P] [US6] E2E test for KPI tracking flow in frontend/tests/e2e/testKPITrackingFlow.spec.ts

### Implementation for User Story 6

- [ ] T133 [US6] Implement KPIService in backend/src/services/kpiService.ts (depends on T126)
- [ ] T134 [US6] Implement createKPIEntry service in backend/src/services/kpiService.ts (depends on T127)
- [ ] T135 [US6] Implement getPerformanceReport service in backend/src/services/kpiService.ts (depends on T128)
- [ ] T136 [US6] Implement KPI score calculation logic in backend/src/services/kpiService.ts (depends on T129)
- [ ] T137 [US6] Implement poor performance highlighting in backend/src/services/kpiService.ts
- [ ] T138 [US6] Implement POST /employees/:employeeId/kpis endpoint in backend/src/api/routes/kpiRoutes.ts (depends on T134)
- [ ] T139 [US6] Implement GET /kpis/reports/performance endpoint in backend/src/api/routes/kpiRoutes.ts (depends on T135)
- [ ] T140 [US6] Create KPIDashboard component in frontend/src/components/KPIDashboard.tsx (depends on T130)
- [ ] T141 [US6] Create KPIReport component in frontend/src/components/KPIReport.tsx (depends on T131)
- [ ] T142 [US6] Add KPI metrics display in frontend/src/components/KPIDashboard.tsx
- [ ] T143 [US6] Add performance trend charts in frontend/src/components/KPIReport.tsx

**Checkpoint**: At this point, User Story 6 should be fully functional

---

## Phase 9: User Story 7 - Timeline and Calendar Views (Priority: P3)

**Goal**: Users can view visual timeline views of project schedules, phase transitions, and team availability

**Independent Test**: Users can view Gantt chart or calendar showing all projects and phases, filter by time period

### Tests for User Story 7 (REQUIRED - TDD NON-NEGOTIABLE) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T144 [P] [US7] Integration test for timeline data retrieval in backend/tests/integration/testTimelineRetrieval.ts
- [ ] T145 [P] [US7] Component test for TimelineView component in frontend/tests/components/TimelineView.test.tsx
- [ ] T146 [P] [US7] Component test for CalendarView component in frontend/tests/components/CalendarView.test.tsx
- [ ] T147 [P] [US7] E2E test for timeline navigation flow in frontend/tests/e2e/testTimelineFlow.spec.ts

### Implementation for User Story 7

- [ ] T148 [US7] Implement getTimelineData service in backend/src/services/projectService.ts (depends on T144)
- [ ] T149 [US7] Create TimelineView component in frontend/src/components/TimelineView.tsx (depends on T145)
- [ ] T150 [US7] Create CalendarView component in frontend/src/components/CalendarView.tsx (depends on T146)
- [ ] T151 [US7] Add Gantt chart visualization in frontend/src/components/TimelineView.tsx
- [ ] T152 [US7] Add date range filtering in frontend/src/components/TimelineView.tsx
- [ ] T153 [US7] Add resource conflict identification in frontend/src/components/TimelineView.tsx

**Checkpoint**: At this point, User Story 7 should be fully functional

---

## Phase 10: User Story 8 - Report Generation and Export (Priority: P3)

**Goal**: Users can generate various reports including client reports, employee summaries, and project follow-up reports with PDF export

**Independent Test**: Users can generate a project follow-up report, view it in the interface, and export it as PDF

### Tests for User Story 8 (REQUIRED - TDD NON-NEGOTIABLE) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T154 [P] [US8] Contract test for GET /reports/project/:id/follow-up endpoint in backend/tests/contract/testGetProjectFollowUpReport.ts
- [ ] T155 [P] [US8] Contract test for GET /reports/project/:id/follow-up/pdf endpoint in backend/tests/contract/testExportProjectFollowUpReportPDF.ts
- [ ] T156 [P] [US8] Contract test for GET /reports/employee/:id/summary endpoint in backend/tests/contract/testGetEmployeeSummaryReport.ts
- [ ] T157 [P] [US8] Integration test for report generation performance in backend/tests/integration/testReportGenerationPerformance.ts
- [ ] T158 [P] [US8] Component test for ReportViewer component in frontend/tests/components/ReportViewer.test.tsx
- [ ] T159 [P] [US8] E2E test for report generation and export flow in frontend/tests/e2e/testReportExportFlow.spec.ts

### Implementation for User Story 8

- [ ] T160 [US8] Implement ReportService in backend/src/services/reportService.ts
- [ ] T161 [US8] Implement getProjectFollowUpReport service in backend/src/services/reportService.ts (depends on T154)
- [ ] T162 [US8] Implement exportProjectFollowUpReportPDF service in backend/src/services/reportService.ts (depends on T155, PDFKit integration)
- [ ] T163 [US8] Implement getEmployeeSummaryReport service in backend/src/services/reportService.ts (depends on T156)
- [ ] T164 [US8] Implement GET /reports/project/:id/follow-up endpoint in backend/src/api/routes/reportRoutes.ts (depends on T161)
- [ ] T165 [US8] Implement GET /reports/project/:id/follow-up/pdf endpoint in backend/src/api/routes/reportRoutes.ts (depends on T162)
- [ ] T166 [US8] Implement GET /reports/employee/:id/summary endpoint in backend/src/api/routes/reportRoutes.ts (depends on T163)
- [ ] T167 [US8] Create ReportViewer component in frontend/src/components/ReportViewer.tsx (depends on T158)
- [ ] T168 [US8] Add PDF export functionality in frontend/src/components/ReportViewer.tsx
- [ ] T169 [US8] Add Excel export functionality in frontend/src/components/ReportViewer.tsx

**Checkpoint**: At this point, User Story 8 should be fully functional

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T170 [P] Update README.md with project overview and setup instructions
- [ ] T171 [P] Update CONTRIBUTING.md with development guidelines
- [ ] T172 [P] Add API documentation integration (Swagger UI) in backend/src/api/routes/index.ts
- [ ] T173 Performance optimization: Add Redis caching for dashboard queries in backend/src/services/projectService.ts
- [ ] T174 Performance optimization: Add database query indexing in backend/prisma/schema.prisma
- [ ] T175 [P] Security hardening: Add rate limiting middleware in backend/src/middleware/rateLimiter.ts
- [ ] T176 [P] Security hardening: Add input validation with Zod in backend/src/middleware/validation.ts
- [ ] T177 [P] Implement conflict resolution UI component in frontend/src/components/ConflictDialog.tsx
- [ ] T178 [P] Verify audit logging coverage for all CRUD operations (audit review)
- [ ] T179 Implement real-time updates with Server-Sent Events in backend/src/api/routes/sseRoutes.ts
- [ ] T180 [P] Add accessibility improvements (WCAG 2.1 AA compliance) in frontend components
- [ ] T181 [P] Add responsive design improvements in frontend components
- [ ] T182 [P] Verify Excel import integration with all entity types (migration coverage review)
- [ ] T183 [P] Add Excel export functionality using ExcelJS in backend/src/services/excelExportService.ts
- [ ] T184 [P] Add configuration management for positions/regions/license types in backend/src/services/configurationService.ts
- [ ] T185 [P] Add error boundary components in frontend/src/components/ErrorBoundary.tsx
- [ ] T186 [P] Add loading skeletons for better UX in frontend components
- [ ] T187 [P] Add unit tests for utility functions in backend/tests/unit/utils/
- [ ] T188 [P] Run quickstart.md validation and fix any issues
- [ ] T189 [P] Update deployment documentation
- [ ] T190 [P] Add health check endpoints in backend/src/api/routes/healthRoutes.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **Data Migration (Phase 2.5)**: Depends on Foundational completion - Enables data validation during development
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion (Phase 2.5 optional but recommended)
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for project detail views
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Depends on US1/US2 for project context
- **User Story 6 (P2)**: Can start after Foundational (Phase 2) - Depends on US3 for team member data
- **User Story 7 (P3)**: Can start after Foundational (Phase 2) - Depends on US1/US4 for timeline data
- **User Story 8 (P3)**: Can start after Foundational (Phase 2) - Depends on US1/US2/US4/US5/US6 for report data

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Unit tests before implementation
- Contract tests before API implementation
- Integration tests after API implementation
- Components before page implementation
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002-T005)
- All Foundational tasks marked [P] can run in parallel (T006-T028, except migration)
- Once Foundational phase completes, P1 user stories (US1, US2, US3) can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Components within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for Project model in backend/tests/unit/models/project.test.ts"
Task: "Contract test for GET /projects endpoint in backend/tests/contract/testGetProjects.ts"
Task: "Integration test for dashboard user journey in backend/tests/integration/testDashboardJourney.ts"
Task: "Component test for ProjectList component in frontend/tests/components/ProjectList.test.tsx"
Task: "Component test for ProjectCard component in frontend/tests/components/ProjectCard.test.tsx"

# Launch all service layer tasks for User Story 1 together (after tests fail):
Task: "Implement ProjectService in backend/src/services/projectService.ts"

# Launch all API endpoints for User Story 1 together (after service):
Task: "Implement GET /projects endpoint with filtering in backend/src/api/routes/projectRoutes.ts"
Task: "Implement GET /projects/:id endpoint in backend/src/api/routes/projectRoutes.ts"
Task: "Implement GET /projects/:id/dashboard endpoint in backend/src/api/routes/projectRoutes.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Stories 4-6 (P2 features) → Test independently → Deploy/Demo
6. Add User Stories 7-8 (P3 enhancements) → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Dashboard)
   - Developer B: User Story 2 (Project CRUD)
   - Developer C: User Story 3 (Team Assignment)
3. P1 stories complete and integrate independently
4. Next sprint:
   - Developer A: User Story 4 (Tasks)
   - Developer B: User Story 5 (Costs)
   - Developer C: User Story 6 (KPIs)
5. P2 stories complete and integrate
6. Final sprint:
   - Developer A: User Story 7 (Timeline)
   - Developer B: User Story 8 (Reports)
   - Developer C: Polish & cross-cutting concerns

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD NON-NEGOTIABLE)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Tests are REQUIRED for all user stories (NON-NEGOTIABLE per constitution)
