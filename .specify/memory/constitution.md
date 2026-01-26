# Fllowup SaaS Platform Constitution

## Core Principles

### I. API-First Design
All features will be designed through API layer first with OpenAPI documentation. Frontend will develop against API contracts independently. This ensures clear contracts, parallel development, and reliable integration.

### II. Data Integrity & Migration Accuracy
(Currently N/A for Greenfield Project)
Excel migration is NOT required per spec. No data transformation or validation needed for Excel import. Data integrity enforced through database constraints and validation layers. Transactional data operations for data integrity.

### III. Test-Driven Development (NON-NEGOTIABLE)
TDD will be strictly enforced. Tests will be written BEFORE implementation. Integration tests will validate API contracts and user journeys. Red-Green-Refactor cycle strictly enforced to ensure high code quality and prevent regression.

### IV. Integration Testing
Integration tests for all API endpoints, database migrations, authentication flows, role-based authorization, multi-step user journeys. Performance tests will validate response time requirements at scale. Supertest for API testing.

### V. Security & Compliance
OAuth 2.0/OIDC authentication with RBAC, TLS 1.3+ encryption, audit logs for all changes, input validation and sanitization, secure data handling. Role-based access control: Manager (full), Team Leader (phase-specific), Team Member (read-only).

### VI. Observability & Maintainability
Structured logs with correlation IDs, metrics for API response times and error rates, health check endpoints, database migration scripts, automated testing. Winston selected for structured logging. Prometheus for metrics.

### VII. User Experience Excellence
Responsive design with WCAG 2.1 AA, load times <3s for critical paths, clear error messages, intuitive project workflows, clear role-based UI.

## Technology Stack Standards

- **Frontend**: React 18+ with TypeScript, Vite, Zustand, Material-UI v5+ (WCAG 2.1 AA compliant)
- **Backend**: Node.js 20+ with Express.js and TypeScript, RESTful API with `/api/v1/` versioning, Prisma ORM
- **Data Storage**: PostgreSQL 16+ (relational, ACID compliant), Redis 7+ (caching), AWS S3 (future object storage)
- **Role-Based Access**: Three roles: MANAGER (full access), TEAM_LEADER (phase-specific access), TEAM_MEMBER (read-only)

## Development Workflow

- **Code Review**: Peer review required, constitution compliance verified, tests reviewed, security implications checked
- **Quality Gates**: Unit tests pass (Jest), integration tests pass (Supertest), code coverage 80%+, linting passes (ESLint, Prettier), security scans conducted
- **Deployment**: CI/CD pipeline with automated stages, staging environment, blue-green deployment, rollback procedures tested

## Governance

This Constitution supersedes all other practices. Amendments require documentation, approval, and a migration plan. All PRs and reviews must verify compliance with these principles. Complexity must be justified.

**Version**: 1.0.0 | **Ratified**: 2026-01-24 | **Last Amended**: 2026-01-24
