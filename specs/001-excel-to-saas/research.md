# Research: Excel to SaaS Migration

**Feature**: 001-excel-to-saas
**Date**: 2025-01-21
**Purpose**: Resolve technical unknowns from Implementation Plan Technical Context

## Research Overview

This document consolidates research findings for the Excel-to-SaaS migration project. Decisions are based on:
- Constitution principles (API-first, data integrity, TDD, security, observability)
- Performance requirements (1000 projects, 100 concurrent users, <2s dashboard)
- Feature requirements (Excel import/export, PDF reports, team allocation, KPIs)
- Industry best practices for SaaS applications
- Team productivity and maintainability

---

## Frontend Framework

### Decision: React 18+ with TypeScript

**Rationale**:
- Largest ecosystem and community support
- Excellent TypeScript integration for type safety
- Vite for fast development builds
- Rich component library ecosystem (Material-UI, Chakra UI, etc.)
- Excellent documentation and learning resources
- Strong alignment with API-first development
- Proven at scale for SaaS applications
- Good performance for dashboard applications with React 18 concurrent rendering

**Alternatives Considered**:
- **Vue.js**: Easier learning curve but smaller ecosystem for enterprise features
- **Angular**: Built-in features but steeper learning curve and more opinionated
- **Svelte**: Excellent performance but smaller ecosystem and fewer enterprise-ready component libraries

---

## Backend Framework

### Decision: Node.js 20+ with Express.js + TypeScript

**Rationale**:
- TypeScript provides type safety across full stack
- JavaScript/Node.js enables full-stack JavaScript team (lower context switching)
- Express.js is lightweight and flexible for API development
- Excellent async support for database queries and Excel processing
- Large ecosystem of middleware (authentication, validation, logging)
- Fast I/O for handling Excel imports and report generation
- Good performance for 100 concurrent users with proper scaling
- Easy deployment to modern cloud platforms

**Alternatives Considered**:
- **Python/FastAPI**: Excellent for APIs but Excel processing may be slower
- **Java/Spring**: Enterprise-grade but heavier setup and longer development cycles
- **Go**: Excellent performance but smaller ecosystem and steeper learning curve

---

## Primary Database

### Decision: PostgreSQL 16+

**Rationale**:
- ACID compliance for data integrity (constitution requirement)
- Excellent support for complex queries (team allocation, KPI aggregation)
- JSON support for flexible schema (configuration items, dynamic reports)
- Strong reliability and data consistency guarantees
- Excellent performance for read-heavy dashboard queries
- Strong community support and documentation
- Built-in full-text search for project/task searching
- Excellent for time-series data (cost entries, KPIs over time)

**Alternatives Considered**:
- **MySQL**: Good option but PostgreSQL has better JSON support and query optimization
- **MongoDB**: Flexible but lacks ACID guarantees for complex transactions

---

## ORM

### Decision: Prisma 5+ with PostgreSQL adapter

**Rationale**:
- Type-safe database access with TypeScript
- Excellent migration support (constitution requirement for version-controlled migrations)
- Automatic schema synchronization
- Excellent query builder for complex aggregations
- Good performance with connection pooling
- Strong TypeScript integration (auto-generated types)
- Easy to use for team allocation calculations
- Good documentation and community support

**Alternatives Considered**:
- **TypeORM**: Good but more verbose query API
- **Sequelize**: Mature but less type-safe
- **Knex.js**: Query builder but requires more boilerplate

---

## Authentication & Authorization

### Decision: Auth0 (OAuth 2.0/OIDC) + Role-Based Access Control (RBAC)

**Rationale**:
- Industry-standard OAuth 2.0/OIDC compliance (constitution requirement)
- RBAC implementation for manager/team leader/team member roles
- Secure token management with JWT
- Social login support (if needed in future)
- Excellent security track record
- Easy integration with React and Express
- Audit trail support (constitution requirement)
- Multi-factor authentication support

**Alternatives Considered**:
- **Firebase Auth**: Good but less control over user management
- **Self-hosted Auth**: Higher operational overhead and security responsibility

---

## Testing Frameworks

### Decision: Jest (Frontend) + Supertest (Backend API) + Playwright (E2E)

**Rationale**:

**Jest (Frontend)**:
- Built into create-react-app / Vite ecosystem
- Fast test runner with parallel execution
- Excellent snapshot testing for UI components
- Good mocking support for API calls
- Easy to write and maintain

**Supertest (Backend API)**:
- Excellent for HTTP endpoint testing
- Integrates well with Express.js
- Easy to write integration tests for API contracts
- Good support for request/response validation

**Playwright (E2E)**:
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Fast and reliable E2E tests
- Excellent for multi-step user journey tests
- Good for validating dashboard flows and project creation
- Parallel execution for fast feedback

**Alternatives Considered**:
- **Vitest**: Faster than Jest but less mature ecosystem
- **Cypress**: Good E2E but slower than Playwright
- **Mocha**: Flexible but more setup required

---

## Excel Import Library

### Decision: SheetJS (xlsx) + ExcelJS

**Rationale**:

**SheetJS (xlsx)**:
- Industry standard for Excel reading
- Excellent performance for large files
- Supports both .xlsx and .xlsm formats (constitution requirement for REF.02.387.xlsm)
- Good support for formulas and cell formatting
- Handles edge cases well (merged cells, hidden sheets, etc.)

**ExcelJS**:
- Excellent for writing Excel files (exports)
- Good for maintaining formatting in exports
- Supports streaming for large exports
- Good performance for report generation

**Alternatives Considered**:
- **openpyxl**: Python library, not applicable to Node.js stack
- **node-xlsx**: Simple but less feature-rich

---

## PDF Export Library

### Decision: PDFKit

**Rationale**:
- Lightweight and fast
- Good support for tables and formatting
- Programmatic control over PDF layout
- Good performance for report generation (<10s requirement)
- Easy to use with React/Express
- Supports multiple fonts and Unicode (important for Arabic/multi-language support)

**Alternatives Considered**:
- **Puppeteer**: Generates PDFs from HTML but slower and resource-intensive
- **jsPDF**: Lightweight but less control over layout
- **HTML-to-PDF**: Easier but less flexible

---

## Object Storage

### Decision: AWS S3 (or compatible)

**Rationale**:
- Industry standard for file storage
- Excellent reliability and durability
- Good performance for file uploads/downloads
- Excellent documentation and SDK support
- Cost-effective for SaaS applications
- Good support for serving static assets
- Presigned URLs for secure file access

**Alternatives Considered**:
- **Azure Blob Storage**: Good option but AWS has larger ecosystem
- **Google Cloud Storage**: Similar features but smaller market share

---

## Caching Layer

### Decision: Redis 7+

**Rationale**:
- Excellent performance for caching dashboard data (<2s load time requirement)
- Good support for session storage (if needed)
- Flexible data structures (strings, hashes, lists, sets)
- Excellent for rate limiting (constitution requirement)
- Good for real-time feature flags
- Mature and reliable
- Good documentation and monitoring tools

**Alternatives Considered**:
- **Memcached**: Simpler but less flexible data structures
- **In-memory caching**: Faster but not shared across instances

---

## Real-Time Updates

### Decision: Server-Sent Events (SSE) with Express.js

**Rationale**:
- Simpler than WebSockets for one-way updates (dashboard notifications)
- Good browser support
- Automatic reconnection handling
- Lower overhead than polling
- Easy to implement with Express.js
- Good for dashboard updates (team allocation changes, project status)
- Compatible with existing HTTP infrastructure

**Alternatives Considered**:
- **WebSockets**: More complex, bi-directional communication not needed for MVP
- **Polling**: Higher server load, less real-time

---

## Concurrent Edit Handling

### Decision: Optimistic Locking with Last-Write-Wins + Conflict Detection

**Rationale**:
- Simple to implement with Prisma (version fields)
- Good performance for 100 concurrent users
- User-friendly conflict resolution (show diff, let user choose)
- Minimal backend complexity
- Works well with API-first design
- Easy to add audit logging (constitution requirement)
- Good balance between simplicity and user experience

**Alternatives Considered**:
- **Pessimistic Locking**: Too restrictive, poor user experience
- **Operational Transformation**: Too complex for this use case

---

## API Documentation

### Decision: OpenAPI 3.0 Specification with Swagger UI

**Rationale**:
- Industry standard for API documentation (constitution requirement for API-first design)
- Automatic documentation generation with Swagger/OpenAPI tools
- Easy to keep in sync with code
- Good for frontend/backend contract testing
- Excellent Swagger UI for interactive testing
- Supports versioning (/api/v1/, /api/v2/)
- Good client SDK generation support

**Alternatives Considered**:
- **GraphQL**: Powerful but overkill for this application, steeper learning curve
- **Custom Documentation**: More maintenance overhead

---

## Logging & Observability

### Decision: Winston (Logging) + Prometheus (Metrics) + Jaeger (Distributed Tracing)

**Rationale**:

**Winston**:
- Excellent logging library for Node.js
- Structured logging with correlation IDs (constitution requirement)
- Multiple transports (console, file, cloud services)
- Good log levels and filtering

**Prometheus**:
- Industry standard for metrics collection
- Excellent for API response times, error rates (constitution requirement)
- Good Grafana integration for dashboards
- Easy to set up alerting

**Jaeger**:
- Distributed tracing for cross-service calls (constitution requirement)
- Good for debugging complex flows
- Helps identify performance bottlenecks

**Alternatives Considered**:
- **Bunyan**: Similar to Winston but smaller ecosystem
- **Datadog/New Relic**: Excellent but expensive SaaS offering

---

## State Management

### Decision: Zustand with TypeScript

**Rationale**:
- Lightweight and simple API
- No boilerplate (compared to Redux)
- Excellent TypeScript support
- Good performance for dashboard applications
- Easy to test
- Middleware support (persist, devtools, etc.)
- Good for managing complex state (projects, team allocations, filters)

**Alternatives Considered**:
- **Redux**: Powerful but too much boilerplate for this application
- **Context API**: Good but lacks middleware and dev tools

---

## UI Component Library

### Decision: Material-UI (MUI) v5+

**Rationale**:
- Excellent component library for React
- Good accessibility (WCAG 2.1 AA compliance per constitution)
- Rich set of components (tables, forms, charts)
- Good documentation and examples
- Theming support (easy branding)
- Strong community support
- Good for dashboard applications (DataGrid, Table, etc.)

**Alternatives Considered**:
- **Chakra UI**: Simpler but fewer enterprise features
- **Ant Design**: Comprehensive but larger bundle size

---

## Summary of Technology Stack

### Frontend
- Framework: React 18+ with TypeScript
- Build Tool: Vite
- State Management: Zustand
- UI Components: Material-UI v5+
- Testing: Jest + Playwright
- Charts: Recharts or Chart.js (to be determined in design phase)

### Backend
- Runtime: Node.js 20+ with TypeScript
- Framework: Express.js
- API Version: /api/v1/
- Testing: Jest + Supertest

### Data Storage
- Database: PostgreSQL 16+
- ORM: Prisma 5+
- Caching: Redis 7+
- Object Storage: AWS S3 (or compatible)

### Authentication
- Provider: Auth0
- Protocol: OAuth 2.0/OIDC
- Authorization: RBAC (Manager, Team Leader, Team Member)

### Integration
- Excel Import: SheetJS (xlsx) + ExcelJS
- PDF Export: PDFKit
- Real-time: Server-Sent Events (SSE)

### Observability
- Logging: Winston (structured logs with correlation IDs)
- Metrics: Prometheus + Grafana
- Tracing: Jaeger
- API Docs: OpenAPI 3.0 + Swagger UI

### DevOps
- CI/CD: GitHub Actions or GitLab CI (to be determined)
- Deployment: Docker + Kubernetes (or similar)
- Environment: Staging + Production

---

## Performance Considerations

Based on success criteria (SC-002, SC-005, SC-006, SC-008, SC-009):

1. **Dashboard Load <2s for 1000 projects**:
   - Implement caching with Redis for dashboard data
   - Use database indexing on frequently queried fields
   - Implement pagination for large datasets
   - Use server-side rendering or static generation where possible

2. **100 Concurrent Users**:
   - Use connection pooling with Prisma
   - Implement rate limiting with Redis
   - Horizontal scaling with load balancer
   - Monitor database connection limits

3. **Report Exports <10s for 500 data rows**:
   - Use streaming PDF generation with PDFKit
   - Implement background job processing for large reports
   - Cache report results for repeated requests

4. **Cost Reports <5s for 50 team members**:
   - Aggregate queries at database level (not in application code)
   - Use database views or materialized views for complex aggregations
   - Implement caching for frequently accessed cost data

---

## Security Considerations

Based on constitution principle V (Security & Compliance):

1. **Encryption**:
   - TLS 1.3+ for all data in transit
   - AES-256 encryption for data at rest (PostgreSQL transparent data encryption)
   - Encrypted secrets management

2. **Authentication**:
   - OAuth 2.0/OIDC with Auth0
   - JWT with short expiration times
   - Refresh token rotation

3. **Authorization**:
   - RBAC with three roles: Manager, Team Leader, Team Member
   - Middleware for route-level authorization
   - Row-level security in database queries

4. **Input Validation**:
   - Request validation at API boundary with Zod or Joi
   - SQL injection prevention (Prisma handles this automatically)
   - XSS prevention (React handles this automatically)

5. **Audit Logging**:
   - Log all project changes with user and timestamp
   - Log authentication events (login, logout, token refresh)
   - Log data access for sensitive operations

6. **Rate Limiting**:
   - Implement API rate limiting with Redis
   - Implement login attempt limits
   - Implement file upload limits

---

## Data Migration Strategy

Based on constitution principle II (Data Integrity & Migration Accuracy):

1. **Excel Import**:
   - Use SheetJS to read REF.02.387.xlsm
   - Validate data structure and business rules
   - Transform data to match database schema
   - Implement validation checks comparing Excel output with SaaS output
   - Transactional bulk loading with rollback on failure
   - Log all migration operations

2. **Data Validation**:
   - Create validation scripts that compare Excel calculations with SaaS calculations
   - Test with sample data from Excel file
   - Generate discrepancy reports
   - Manual review of discrepancies before sign-off

3. **Migration Rollback**:
   - Implement reversible migration scripts
   - Database backups before migration
   - Test rollback procedure with sample data

---

## Development Workflow

Based on constitution Development Workflow:

1. **TDD (NON-NEGOTIABLE)**:
   - Write tests BEFORE implementation
   - Tests MUST fail initially (RED state)
   - Implementation makes tests pass (GREEN state)
   - Refactor while maintaining passing tests (REFACTOR state)

2. **Code Review**:
   - All code must undergo peer review
   - Reviewers verify constitution compliance
   - Security implications checked
   - Test coverage reviewed

3. **Quality Gates**:
   - Unit tests must pass (Jest, Supertest)
   - Integration tests must pass (API contract tests)
   - Code coverage >= 80%
   - Linting must pass (ESLint, Prettier)
   - Security scans conducted regularly

4. **Deployment**:
   - CI/CD pipeline with automated stages
   - Staging environment mirrors production
   - Blue-green deployment for zero-downtime releases
   - Rollback procedures tested and documented
   - Database migrations backward-compatible where possible

---

## Next Steps

1. ✅ Research complete - All technical unknowns resolved
2. Next: Create data-model.md (Phase 1)
3. Next: Create API contracts (Phase 1)
4. Next: Create quickstart.md (Phase 1)
5. Next: Re-evaluate Constitution Check post-design (Phase 1)
