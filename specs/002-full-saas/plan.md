# Implementation Plan: SaaS Platform

**Branch**: `002-001-excel-to-saas-i-do-not-want-to-pars-date-from-excel-i-want-to-convert-excel-to-full-saas-excel-are-no-using-in-my-firm` | **Date**: 2026-01-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-001-excel-to-saas-i-do-not-want-to-pars-date-from-excel-i-want-to-convert-excel-to-full-saas-excel-are-no-using-in-my-firm/spec.md`

## Summary

Build a full-stack SaaS application for project management with three roles (Manager, Team Leader, Team Member) and configurable project phases (initially Studies, Design, Technical, but expandable). System supports role-based permissions where Managers have full access, Team Leaders control their assigned phase(s), and Team Members have read-only access. No Excel import functionality required - fresh SaaS platform.

## Technical Context

**Language/Version**: Node.js 20+ (Backend), React 18+ (Frontend), TypeScript for both

**Primary Dependencies**:
  - Backend: Express.js, Prisma 5+, OAuth 2.0/OIDC (Auth0 recommended), Winston, Redis, Supertest
  - Frontend: React 18+, Vite, Zustand, Material-UI v5+, Axios, React Router, Jest, Playwright
  - Auth: OAuth 2.0/OIDC via Auth0 (per constitution principle V)
**Storage**: PostgreSQL 16+ (Primary DB), Redis 7+ (Caching), AWS S3 (Object Storage for future file uploads)
**Testing**: Jest (Backend/Unit), Supertest (API Integration), Playwright (E2E)
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge), Linux server (Backend)
**Project Type**: web
**Performance Goals**: Dashboard load <2s for 1000 projects, 100 concurrent users, report export <10s
**Constraints**: Support role-based access control, secure authentication, TDD mandatory (constitution principle III), API-first design (constitution principle I)
**Scale/Scope**: 1000 projects, 100 concurrent users, 3 roles, multiple configurable phases, full CRUD for projects/tasks/phases

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. API-First Design

- **Status**: ✅ COMPLIANT
- **Plan**: All features will be designed through API layer first with OpenAPI documentation. Frontend will develop against API contracts independently.
- **Design Verification**: OpenAPI 3.0 specification generated with 40+ endpoints. API contracts defined in `contracts/openapi.json`. RESTful design with `/api/v1/` versioning.
- **Gate**: ✅ Pass

### II. Data Integrity & Migration Accuracy

- **Status**: ✅ N/A (NOT APPLICABLE)
- **Plan**: Excel migration is NOT required per spec. No data transformation or validation needed for Excel import. Data integrity enforced through database constraints and validation layers.
- **Design Verification**: No migration scripts needed. Validation rules enforced in service layer. Transactional data operations for data integrity.
- **Gate**: ✅ Pass (N/A for this feature)

### III. Test-Driven Development (NON-NEGOTIABLE)

- **Status**: ✅ COMPLIANT
- **Plan**: TDD will be strictly enforced. Tests will be written BEFORE implementation. Integration tests will validate API contracts and user journeys.
- **Design Verification**: Testing frameworks selected: Jest (unit), Supertest (integration), Playwright (E2E). Quality gates include 80%+ code coverage. Constitution requires TDD as NON-NEGOTIABLE.
- **Gate**: ✅ Pass

### IV. Integration Testing

- **Status**: ✅ COMPLIANT
- **Plan**: Integration tests for all API endpoints, database migrations, authentication flows, role-based authorization, multi-step user journeys. Performance tests will validate response time requirements at scale.
- **Design Verification**: All API contracts include integration test coverage. Supertest for API testing. Performance tests for dashboard load (<2s for 1000 projects), report export (<10s).
- **Gate**: ✅ Pass

### V. Security & Compliance

- **Status**: ✅ COMPLIANT
- **Plan**: OAuth 2.0/OIDC authentication with RBAC, TLS 1.3+ encryption, audit logs for all changes, input validation and sanitization, secure data handling. Role-based access control: Manager (full), Team Leader (phase-specific), Team Member (read-only).
- **Design Verification**: Auth0 selected for OAuth 2.0/OIDC. Three roles defined: MANAGER, TEAM_LEADER, TEAM_MEMBER. AuditLog entity tracks all changes. Row-level security planned for role permissions. Sensitive data encrypted at rest and in transit.
- **Gate**: ✅ Pass

### VI. Observability & Maintainability

- **Status**: ✅ COMPLIANT
- **Plan**: Structured logs with correlation IDs, metrics for API response times and error rates, health check endpoints, database migration scripts, automated testing.
- **Design Verification**: Winston selected for structured logging. Prometheus for metrics. Prisma migrations for schema versioning. Health check endpoints planned.
- **Gate**: ✅ Pass

### VII. User Experience Excellence

- **Status**: ✅ COMPLIANT
- **Plan**: Responsive design with WCAG 2.1 AA, load times <3s for critical paths, clear error messages, intuitive project workflows, clear role-based UI (different controls for Manager vs Team Leader vs Team Member).
- **Design Verification**: Material-UI v5+ selected (WCAG 2.1 AA compliant). Performance targets defined: dashboard <2s, project creation <3min. Role-based UI: Manager sees all controls, Team Leader sees phase controls, Team Member sees read-only view.
- **Gate**: ✅ Pass

### Technology Stack Standards

- **Frontend**: ✅ React 18+ with TypeScript, Vite, Zustand, Material-UI v5+ (WCAG 2.1 AA compliant)
- **Backend**: ✅ Node.js 20+ with Express.js and TypeScript, RESTful API with `/api/v1/` versioning, Prisma ORM, async processing for long-running tasks
- **Data Storage**: ✅ PostgreSQL 16+ (relational, ACID compliant), Redis 7+ (caching), AWS S3 (object storage for future), automated backups, transactional data operations
- **Role-Based Access**: ✅ Three roles: MANAGER (full access), TEAM_LEADER (phase-specific access), TEAM_MEMBER (read-only)

### Development Workflow

- **Code Review**: Peer review required, constitution compliance verified, tests reviewed, security implications checked
- **Quality Gates**: Unit tests pass (Jest), integration tests pass (Supertest), code coverage 80%+, linting passes (ESLint, Prettier), security scans conducted, performance tests pass
- **Deployment**: CI/CD pipeline with automated stages, staging environment, blue-green deployment, rollback procedures tested, backward-compatible migrations

**Overall Gate Status**: ✅ PASS - Design is constitution-compliant

**Post-Design Re-check**: ✅ PASS - All design artifacts (data-model.md, contracts/openapi.json, quickstart.md) have been generated and maintain constitution compliance.

## Project Structure

### Documentation (this feature)

```text
specs/002-saas-platform/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/          # Database models (Project, Phase, TeamMember, Task, etc.)
│   ├── services/        # Business logic (project management, role-based authorization, calculations)
│   ├── api/            # API endpoints (RESTful controllers)
│   ├── middleware/     # Authentication (RBAC), authorization (role checks), validation
│   └── utils/          # Utilities (logging, error handling, date utilities)
├── tests/
│   ├── unit/            # Unit tests for models and services
│   ├── integration/     # Integration tests for APIs and database
│   └── contract/       # Contract tests for API compliance
└── migrations/          # Database schema migrations

frontend/
├── src/
│   ├── components/      # Reusable UI components (role-aware: Manager vs Team Leader vs Team Member)
│   ├── pages/          # Page components (Dashboard, ProjectDetail, etc.)
│   ├── services/       # API client services
│   ├── state/          # State management (Zustand)
│   └── utils/          # Utility functions
└── tests/
    └── e2e/           # E2E tests (Playwright)
```

**Structure Decision**: Web application with separate frontend and backend (Option 2). This separation enables:
- Independent scaling of frontend and backend
- API-first development as required by constitution
- Parallel development of frontend and backend teams
- Clear separation of concerns
- Frontend can develop against API contracts

## Implementation Status

### Phase 0: Research ✅ COMPLETED

**Research Tasks** (completed in research.md):

- [x] Research authentication providers (OAuth 2.0/OIDC options)
- [x] Research role-based authorization patterns for 3-tier role system
- [x] Research best practices for phase-based task management
- [x] Research UI patterns for role-based access control
- [x] Research database schema design for 3 phases with role-based permissions
- [x] Research state management patterns for React (Zustand best practices)
- [x] Research performance optimization strategies for dashboard with 1000 projects
- [x] Research audit logging requirements for compliance

**Output**: `research.md`

**Full Details**: See `research.md` for complete research findings including rationale, alternatives considered, and performance/security considerations.

**Key Decisions**:
- **Auth**: Auth0 for OAuth 2.0/OIDC with built-in RBAC
- **Authorization**: Middleware-based role checks with explicit permission matrix
- **Phases**: Configurable phases (initially 3) with custom ordering and transitions
- **State**: Zustand for simple, performant global state with optimistic UI updates
- **Database**: Prisma with optimistic locking (version fields) and audit logging
- **Performance**: Redis caching (5min TTL), pagination, virtual scrolling

### Phase 1: Design ✅ COMPLETED

- [x] Define data model with role-based permissions
- [x] Generate API contracts with role-based endpoints
- [x] Design state management structure
- [x] Create quickstart guide
- [x] Update agent context

**Outputs**: `data-model.md`, `contracts/openapi.json`, `quickstart.md`

### Phase 2: Tasks 🔄 READY

- [ ] Task breakdown generated (ready via `/speckit.tasks` command)
- [ ] Tasks organized by user story for independent implementation
- [ ] TDD structure enforced (tests before implementation)

**Output**: `tasks.md` (created by `/speckit.tasks` command - NOT by /speckit.plan)

**Task Summary** (ready for generation):
- Total tasks: ~171 (estimated based on design artifacts)
- Phase 1 (Setup): ~5 tasks
- Phase 2 (Foundational): ~20 tasks
- Phase 3 (US1 - Dashboard): ~19 tasks
- Phase 4 (US2 - Project CRUD): ~16 tasks
- Phase 5 (US3 - Team Assignment): ~18 tasks
- Phase 6 (US4 - Tasks/Phases): ~16 tasks
- Phase 7 (US5 - Costs): ~20 tasks
- Phase 8 (US6 - KPIs): ~16 tasks
- Phase 9 (US7 - Timeline): ~8 tasks
- Phase 10 (US8 - Reports): ~14 tasks
- Phase 11 (Polish): ~8 tasks

**Key Features** (enforced in tasks.md):
- TDD structure enforced (tests before implementation) per Constitution Principle III
- Parallel task markers [P] for concurrent execution
- User story labels [US1-US8] for traceability
- Role-based implementation markers
- Dependencies documented per phase
- Checkpoints after each user story

**Next Step**: Run `/speckit.tasks` command to generate detailed task breakdown from plan.md, data-model.md, and openapi.json
