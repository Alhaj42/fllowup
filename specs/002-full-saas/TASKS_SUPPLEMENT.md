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

- [X] T050 [P] [US3] Unit test for Assignment model in backend/tests/unit/models/assignment.test.ts ✅ COMPLETE
- [X] T051 [P] [US3] Unit test for TeamService (team assignment logic) in backend/tests/unit/services/teamService.test.ts ✅ COMPLETE
- [X] T052 [P] [US3] Cross-contract test for POST /assignments endpoint in backend/tests/contract/testPostAssignment.test.ts ✅ COMPLETE
- [X] T053 [P] [US3] Cross-contract test for GET /assignments/team/:memberId in backend/tests/contract/testGetTeamAssignments.test.ts ✅ COMPLETE
- [X] T054 [P] [US3] Integration test for team allocation user journey in backend/tests/integration/testTeamAllocationJourney.test.ts ✅ COMPLETE
- [X] T055 [P] [US3] Component test for TeamAssignmentForm in frontend/tests/components/TeamAssignmentForm.test.tsx ✅ COMPLETE
- [X] T056 [P] [US3] E2E test for team assignment flow in frontend/tests/e2e/testTeamAssignmentFlow.spec.ts ✅ COMPLETE

### Implementation for User Story 3

- [X] T057 [US3] Implement TeamService in backend/src/services/teamService.ts (team assignment, allocation tracking) ✅ COMPLETE
- [X] T058 [US3] Implement POST /assignments endpoint in backend/src/api/routes/assignmentRoutes.ts (assign team member to project with allocation %) ✅ COMPLETE
- [X] T059 [US3] Implement GET /assignments/team/:memberId endpoint in backend/src/api/routes/assignmentRoutes.ts (get all assignments for team member) ✅ COMPLETE
- [X] T060 [US3] Implement GET /assignments/project/:projectId endpoint in backend/src/api/routes/assignmentRoutes.ts (get all team members assigned to project) ✅ COMPLETE
- [X] T061 [US3] Implement allocation validation (>100% warning, override logic) in backend/src/services/teamService.ts (FR-007, FR-032) ✅ COMPLETE
- [X] T062 [US3] Implement TeamAssignmentForm component in frontend/src/components/TeamAssignmentForm.tsx ✅ COMPLETE
- [X] T063 [US3] Implement TeamWorkloadView component in frontend/src/components/TeamWorkloadView.tsx (show allocation across projects with warning for >100%) ✅ COMPLETE

**Checkpoint**: Team assignment and allocation tracking complete ✅ ALL TASKS DONE

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
