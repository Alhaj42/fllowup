# Quickstart Guide: Fllowup SaaS Platform

**Feature**: 002-saas-platform
**Last Updated**: 2026-01-23

## Overview

This guide helps you get started developing the Fllowup SaaS Platform - a full-stack project management application with role-based access control (Manager, Team Leader, Team Member) and configurable project phases.

**Tech Stack**:
- **Backend**: Node.js 20+, Express.js, TypeScript, Prisma 5+, PostgreSQL 16+, Redis 7+
- **Frontend**: React 18+, Vite, TypeScript, Zustand, Material-UI v5+
- **Auth**: Auth0 (OAuth 2.0/OIDC)
- **Testing**: Jest (unit), Supertest (integration), Playwright (E2E)

---

## Prerequisites

### Required Software

1. **Node.js** 20.0 or higher
   ```bash
   node --version  # Should be v20.0.0+
   ```

2. **npm** or **yarn** or **pnpm**
   ```bash
   npm --version
   ```

3. **PostgreSQL** 16+ (for local development)
   ```bash
   psql --version  # Should be 16.0+
   ```

4. **Redis** 7+ (for local development caching)
   ```bash
   redis-cli --version  # Should be 7.0+
   ```

5. **Git** (for version control)
   ```bash
   git --version
   ```

### Required Accounts

1. **Auth0 Account** (for authentication)
   - Sign up at https://auth0.com/
   - Create an application (Regular Web Application)
   - Enable OAuth 2.0 and OIDC
   - Note down: Domain, Client ID, Client Secret

2. **Database** (production only - Postgres provider like AWS RDS, Supabase, Railway)
   - For local development, use Docker or native PostgreSQL

---

## Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/your-org/fllowup.git
cd fllowup
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Configure Environment Variables

Create `.env` files in both `backend/` and `frontend/` directories:

**Backend (`backend/.env`)**:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fllowup?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# Auth0
AUTH0_DOMAIN="your-tenant.auth0.com"
AUTH0_AUDIENCE="https://your-tenant.auth0.com/api/v2/"
AUTH0_CLIENT_ID="your-client-id"
AUTH0_CLIENT_SECRET="your-client-secret"

# Server
PORT=3000
NODE_ENV=development
```

**Frontend (`frontend/.env`)**:
```env
# API
VITE_API_BASE_URL="http://localhost:3000/api/v1"

# Auth0
VITE_AUTH0_DOMAIN="your-tenant.auth0.com"
VITE_AUTH0_CLIENT_ID="your-client-id"
VITE_AUTH0_AUDIENCE="https://your-tenant.auth0.com/api/v2/"
```

**Important**: Never commit `.env` files to repository. Use `.env.example` as template.

### 5. Setup PostgreSQL Database

**Option A: Native PostgreSQL**

```bash
# Create database
createdb fllowup

# Run migrations
cd backend
npx prisma migrate dev
```

**Option B: Docker PostgreSQL**

```bash
# Start PostgreSQL container
docker run --name fllowup-postgres \
  -e POSTGRES_DB=fllowup \
  -e POSTGRES_USER=fllowup \
  -e POSTGRES_PASSWORD=fllowup \
  -p 5432:5432 \
  -d postgres:16

# Update DATABASE_URL in backend/.env:
DATABASE_URL="postgresql://fllowup:fllowup@localhost:5432/fllowup?schema=public"
```

### 6. Setup Redis (Optional but Recommended)

**Option A: Native Redis**

```bash
# Start Redis server
redis-server

# Update REDIS_URL in backend/.env:
REDIS_URL="redis://localhost:6379"
```

**Option B: Docker Redis**

```bash
# Start Redis container
docker run --name fllowup-redis \
  -p 6379:6379 \
  -d redis:7

# Update REDIS_URL in backend/.env:
REDIS_URL="redis://localhost:6379"
```

### 7. Initialize Database

```bash
cd backend
npx prisma migrate dev
npx prisma db seed  # If seed file exists
```

### 8. Start Development Servers

**Terminal 1: Backend**
```bash
cd backend
npm run dev
# Server runs at http://localhost:3000
# API available at http://localhost:3000/api/v1
```

**Terminal 2: Frontend**
```bash
cd frontend
npm run dev
# Vite dev server runs at http://localhost:5173
```

---

## Development Workflow

### Test-Driven Development (TDD)

**Mandatory** per Constitution Principle III.

**Red-Green-Refactor Cycle**:

1. **RED**: Write a failing test
2. **GREEN**: Write minimal code to make test pass
3. **REFACTOR**: Improve code while keeping tests green

**Example**:
```typescript
// 1. Write test (RED)
describe('ProjectService', () => {
  it('should create a project', async () => {
    const project = await createProject({ name: 'Test Project' });
    expect(project).toBeDefined();
  });
});

// 2. Implement (GREEN)
export const createProject = async (data: ProjectCreate) => {
  return await prisma.project.create({ data });
};

// 3. Refactor (REFACTOR)
// Add validation, error handling, logging, etc.
```

### Running Tests

```bash
# Backend unit tests
cd backend
npm run test:unit

# Backend integration tests
npm run test:integration

# Frontend unit tests
cd frontend
npm run test

# E2E tests (Playwright)
npm run test:e2e
```

### Code Quality

```bash
# Linting (both projects)
npm run lint

# Formatting (both projects)
npm run format

# Type checking
npm run typecheck
```

---

## Architecture Overview

### Project Structure

```
fllowup/
├── backend/                 # Node.js + Express.js API
│   ├── src/
│   │   ├── models/         # Prisma models
│   │   ├── services/       # Business logic
│   │   ├── api/            # API endpoints (/api/v1/*)
│   │   ├── middleware/     # Auth, authorization, audit logging
│   │   └── utils/          # Utilities (logging, error handling)
│   ├── tests/
│   │   ├── unit/            # Jest unit tests
│   │   ├── integration/     # Supertest integration tests
│   │   └── contract/       # API contract tests
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── migrations/      # Database migrations
│   └── package.json
├── frontend/                # React + Vite UI
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client (Axios)
│   │   ├── state/          # Zustand stores
│   │   └── utils/          # Utilities
│   ├── tests/
│   │   ├── components/     # React Testing Library tests
│   │   └── e2e/           # Playwright E2E tests
│   └── package.json
└── specs/
    └── 002-saas-platform/
        ├── plan.md              # Implementation plan
        ├── research.md          # Research findings
        ├── data-model.md        # Database schema
        ├── quickstart.md        # This file
        ├── contracts/
        │   └── openapi.json     # API specification
        └── tasks.md             # Implementation tasks
```

### API Design

**RESTful API** with `/api/v1/` versioning.

**Authentication**: OAuth 2.0/OIDC via Auth0
- JWT tokens in `Authorization: Bearer <token>` header
- Role claims embedded in ID token

**Role-Based Authorization**:

| Role      | Projects | Phases  | Tasks    | Assignments | Costs | KPIs |
|-----------|-----------|----------|-----------|--------------|--------|-------|
| MANAGER   | CRUD all  | CRUD all | CRUD all  | CRUD all     | CRUD all | CRUD all |
| TEAM_LEADER | Read-only   | Manage assigned | Manage in assigned | View assigned | View assigned | View assigned |
| TEAM_MEMBER | Read-only   | Read-only | Read-only | Read-only    | Read-only | Read-only (own) |

**Response Format**:
```json
{
  "data": { ... },
  "error": null,
  "timestamp": "2026-01-23T10:00:00.000Z"
}
```

**Error Format**:
```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": { ... }
  },
  "timestamp": "2026-01-23T10:00:00.000Z"
}
```

---

## Common Tasks

### Add New API Endpoint

1. **Write contract test** (`backend/tests/contract/`)
   ```typescript
   test('GET /projects returns projects', async () => {
     const response = await request(app).get('/api/v1/projects')
       .set('Authorization', `Bearer ${token}`);

     expect(response.status).toBe(200);
     expect(response.body.data).toBeArray();
   });
   ```

2. **Implement service** (`backend/src/services/`)
   ```typescript
   export const getProjects = async (filters: ProjectFilters) => {
     return await prisma.project.findMany({ where: filters });
   };
   ```

3. **Create endpoint** (`backend/src/api/routes/`)
   ```typescript
   router.get('/projects', authenticate, authorize([Role.MANAGER, Role.TEAM_LEADER, Role.TEAM_MEMBER]), async (req, res) => {
     const projects = await getProjects(req.query);
     res.json({ data: projects, error: null });
   });
   ```

4. **Run tests**
   ```bash
   npm run test:contract
   ```

### Add New React Component

1. **Write component test** (`frontend/tests/components/`)
   ```typescript
   test('renders project card', () => {
     render(<ProjectCard project={mockProject} />);
     expect(screen.getByText('Test Project')).toBeInTheDocument();
   });
   ```

2. **Implement component** (`frontend/src/components/`)
   ```typescript
   export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
     return (
       <Card>
         <Typography variant="h6">{project.name}</Typography>
         <Typography>{project.status}</Typography>
       </Card>
     );
   };
   ```

3. **Run tests**
   ```bash
   npm run test
   ```

### Add Database Migration

1. **Modify schema** (`backend/prisma/schema.prisma`)
   ```prisma
   model NewEntity {
     id String @id @default(cuid())
     name String
   }
   ```

2. **Generate migration**
   ```bash
   cd backend
   npx prisma migrate dev --name add_new_entity
   ```

3. **Review migration** (`backend/prisma/migrations/`)
   - Ensure `down` migration exists for rollback

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Error**: `Can't reach database server`

**Solution**:
- Check PostgreSQL is running: `ps aux | grep postgres`
- Verify `DATABASE_URL` in `.env` is correct
- Test connection: `psql $DATABASE_URL`

#### 2. Redis Connection Failed

**Error**: `Redis connection timeout`

**Solution**:
- Check Redis is running: `redis-cli ping`
- Verify `REDIS_URL` in `.env` is correct
- For development, Redis is optional - comment out if needed

#### 3. Authentication Fails

**Error**: `Unauthorized` or `Invalid token`

**Solution**:
- Verify Auth0 credentials in `.env`
- Check Auth0 application is in development mode (if local)
- Verify JWT audience matches Auth0 configuration
- Test Auth0 connection at https://auth0.com/docs/

#### 4. CORS Errors

**Error**: `CORS policy blocked request`

**Solution**:
- Check backend CORS configuration in `backend/src/api/routes/index.ts`
- Ensure frontend URL is in allowed origins
- For local development: Allow `http://localhost:5173`

#### 5. Prisma Client Not Generated

**Error**: `Error: @prisma/client not found`

**Solution**:
```bash
cd backend
npx prisma generate
```

#### 6. Tests Fail with Timeout

**Error**: `Timeout - Async callback was not invoked`

**Solution**:
- Check database connection during tests
- Use test database (different from development)
- Increase Jest timeout in jest.config.js: `testTimeout: 10000`

#### 7. Module Not Found

**Error**: `Module not found: Can't resolve '...'`

**Solution**:
- Run `npm install` in both backend and frontend
- Check `package.json` dependencies
- Clear node_modules and reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

#### 8. Role-Based Authorization Not Working

**Error**: Users can access resources they shouldn't

**Solution**:
- Verify Auth0 roles are properly configured
- Check middleware in `backend/src/middleware/authz.ts`:
  - Role claims extracted from JWT
  - Permission checks implemented correctly
- Test with different user roles

---

## Performance Targets

### Dashboard Load

**Target**: <2 seconds for 1000 projects

**Optimizations**:
- Database indexes on `status`, `startDate`, `endDate`
- Redis caching (5-minute TTL)
- Pagination (100 projects per page)
- Frontend virtual scrolling

### Report Export

**Target**: <10 seconds for 500 data rows

**Optimizations**:
- Async PDF generation
- Streaming response
- Database query optimization

### Concurrent Users

**Target**: 100 concurrent users without degradation

**Optimizations**:
- Database connection pooling
- Redis session store
- Efficient query patterns

---

## Role-Based Development Guidelines

### When Developing for MANAGER

- **Full access** to all resources
- Create/update/delete any project, phase, task, assignment, cost, KPI
- Assign team leaders to phases
- Manage configuration

### When Developing for TEAM_LEADER

- **Phase-specific access**:
  - Can manage tasks and status for assigned phase(s) only
  - Can view projects (read-only)
  - Cannot create/edit/delete projects
- **UI Controls**:
  - Show create/edit/delete controls for assigned phases
  - Hide/disable controls for unassigned phases

### When Developing for TEAM_MEMBER

- **Read-only access** to all data
- Cannot create/edit/delete any resource
- **UI Controls**:
  - All controls disabled or hidden
  - Show read-only indicator/badge
  - No modification permissions

---

## Testing Checklist

### Before Committing

- [ ] All unit tests pass (`npm run test:unit`)
- [ ] All integration tests pass (`npm run test:integration`)
- [ ] Code coverage ≥80% (`npm run test:coverage`)
- [ ] Linting passes (`npm run lint`)
- [ ] Formatting passes (`npm run format`)
- [ ] Type checking passes (`npm run typecheck`)

### Before Merging to Main

- [ ] All tests pass on CI/CD
- [ ] Security scans pass (if configured)
- [ ] Performance tests pass (for sensitive changes)
- [ ] Documentation updated
- [ ] Code reviewed by peer

---

## Resources

### Documentation

- **API Specification**: `/specs/002-saas-platform/contracts/openapi.json`
- **Data Model**: `/specs/002-saas-platform/data-model.md`
- **Research**: `/specs/002-saas-platform/research.md`
- **Implementation Plan**: `/specs/002-saas-platform/plan.md`
- **Tasks**: `/specs/002-saas-platform/tasks.md`

### External Resources

- **Prisma Documentation**: https://www.prisma.io/docs/
- **Auth0 Documentation**: https://auth0.com/docs/
- **React Documentation**: https://react.dev/
- **Vite Documentation**: https://vitejs.dev/
- **Material-UI Documentation**: https://mui.com/
- **Zustand Documentation**: https://zustand.docs.pmnd.rs/
- **Jest Documentation**: https://jestjs.io/
- **Playwright Documentation**: https://playwright.dev/

### Constitution

- **Project Constitution**: `.specify/memory/constitution.md`
- **All principles must be followed**:
  - I. API-First Design ✅
  - II. Data Integrity & Migration Accuracy ✅ (N/A - no Excel migration)
  - III. Test-Driven Development (NON-NEGOTIABLE) ✅
  - IV. Integration Testing ✅
  - V. Security & Compliance ✅
  - VI. Observability & Maintainability ✅
  - VII. User Experience Excellence ✅

---

## Getting Help

### Questions or Issues?

1. **Check documentation**: Review related docs above
2. **Search existing issues**: Check GitHub issues
3. **Ask in team channel**: Contact development team
4. **Create issue**: If problem is new, create GitHub issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)

### Debug Mode

Enable verbose logging in `.env`:
```env
LOG_LEVEL=debug
DEBUG=fllowup:*
```

---

## Next Steps

After completing this quickstart:

1. **Read the data model** (`data-model.md`) to understand entities
2. **Review the API spec** (`contracts/openapi.json`) for endpoint contracts
3. **Start with Phase 2 tasks** (`tasks.md`) - Foundational infrastructure
4. **Follow TDD approach** - Write tests before implementation
5. **Constitution compliance** - Verify all principles are followed

**Happy coding! 🚀**
