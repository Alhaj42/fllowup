# Quickstart Guide: Excel to SaaS Migration

**Feature**: 001-excel-to-saas
**Date**: 2025-01-21
**Purpose**: Quick start guide for developers working on the Fllowup project

---

## Prerequisites

### Required Software

- **Node.js**: v20+ LTS version
  - Download: https://nodejs.org/
  - Verify: `node --version`

- **npm** or **yarn**: Package manager
  - npm comes with Node.js
  - yarn (optional): `npm install -g yarn`

- **PostgreSQL**: v16+
  - Download: https://www.postgresql.org/download/
  - Verify: `psql --version`

- **Redis**: v7+
  - Download: https://redis.io/download
  - Verify: `redis-cli --version`

### Required Accounts

- **Auth0** account (for authentication)
  - Sign up: https://auth0.com/
  - Create application with API and SPA settings

- **AWS** account (or compatible S3-compatible storage)
  - Sign up: https://aws.amazon.com/
  - Create S3 bucket for file storage

---

## Project Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd Fllowup
git checkout 001-excel-to-saas
```

### 2. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 3. Set Up Environment Variables

#### Backend (backend/.env)

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/fllowup"

# Redis
REDIS_URL="redis://localhost:6379"

# Auth0
AUTH0_DOMAIN="your-tenant.auth0.com"
AUTH0_AUDIENCE="https://api.fllowup.com"
AUTH0_ISSUER="https://your-tenant.auth0.com/"

# JWT
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# AWS S3
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="fllowup-uploads"

# Application
NODE_ENV="development"
PORT=3001
API_VERSION="/api/v1"
LOG_LEVEL="debug"
```

#### Frontend (frontend/.env)

```bash
# API
VITE_API_BASE_URL="http://localhost:3001/api/v1"

# Auth0
VITE_AUTH0_DOMAIN="your-tenant.auth0.com"
VITE_AUTH0_CLIENT_ID="your-client-id"
VITE_AUTH0_AUDIENCE="https://api.fllowup.com"

# Application
VITE_APP_NAME="Fllowup"
VITE_ENVIRONMENT="development"
```

### 4. Initialize Database

```bash
# Run migrations
cd backend
npx prisma migrate dev --name init

# Seed initial data (optional)
npx prisma db seed
```

### 5. Start Services

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Backend
cd backend
npm run dev

# Terminal 3: Start Frontend
cd frontend
npm run dev
```

### 6. Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api/v1
- API Documentation (Swagger UI): http://localhost:3001/api-docs

---

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout 001-excel-to-saas
git checkout -b feature/your-feature-name
```

### 2. Follow TDD Workflow

```bash
# Write test FIRST (RED state)
# Create test file: backend/tests/unit/project.test.ts
npm test -- project.test.ts

# Run tests - they should FAIL
npm test

# Implement feature (GREEN state)
# Create implementation: backend/src/services/projectService.ts
npm test

# Tests should PASS now

# Refactor if needed (REFACTOR state)
# Keep tests passing
npm test
```

### 3. Make API Changes

1. **Update Data Model** (if needed):
   ```bash
   npx prisma migrate dev --name describe-change
   ```

2. **Update API Contract**:
   - Edit `backend/src/api/routes/projectRoutes.ts`
   - Update OpenAPI spec: `contracts/openapi.json`

3. **Write Tests**:
   - Unit tests: `backend/tests/unit/`
   - Integration tests: `backend/tests/integration/`
   - Contract tests: `backend/tests/contract/`

4. **Run Tests**:
   ```bash
   npm run test:unit
   npm run test:integration
   npm run test:contract
   ```

### 4. Make Frontend Changes

1. **Update Component**:
   ```bash
   # Create component: frontend/src/components/ProjectList.tsx
   ```

2. **Update State** (if needed):
   ```bash
   # Update state: frontend/src/state/projectStore.ts
   ```

3. **Write Component Tests**:
   ```bash
   npm run test:component
   ```

4. **Run Tests**:
   ```bash
   npm run test
   ```

### 5. Run Linting

```bash
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run lint
```

### 6. Commit Changes

```bash
git add .
git commit -m "feat: add project list filtering"
git push origin feature/your-feature-name
```

---

## Testing

### Run All Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Run Specific Test Suite

```bash
# Backend
cd backend
npm run test:unit
npm run test:integration
npm run test:contract

# Frontend
cd frontend
npm run test:component
```

### Run E2E Tests

```bash
cd frontend
npm run test:e2e
```

---

## Common Tasks

### Create a New API Endpoint

1. Define route in `backend/src/api/routes/`
2. Create controller in `backend/src/api/controllers/`
3. Create service in `backend/src/services/`
4. Write tests
5. Update OpenAPI spec
6. Run tests

### Create a New Component

1. Create component file in `frontend/src/components/`
2. Add styles (CSS Modules or Tailwind)
3. Create tests
4. Import and use
5. Run tests

### Add a New Database Field

1. Update Prisma schema: `backend/prisma/schema.prisma`
2. Run migration: `npx prisma migrate dev --name add-field`
3. Update types if needed
4. Update API routes
5. Write tests

### Import Excel Data

```bash
# Via API (POST /api/v1/import/excel)
curl -X POST \\
  http://localhost:3001/api/v1/import/excel \\
  -H "Authorization: Bearer <your-token>" \\
  -F "file=@REF.02.387.xlsx" \\
  -F "validateOnly=false"
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_ctl status

# Check connection string in .env
cat backend/.env | grep DATABASE_URL

# Test connection
npx prisma db pull
```

### Redis Connection Issues

```bash
# Check Redis is running
redis-cli ping

# Check connection string in .env
cat backend/.env | grep REDIS_URL
```

### Auth0 Issues

```bash
# Verify Auth0 credentials
cat frontend/.env | grep AUTH0
cat backend/.env | grep AUTH0

# Test token generation
# Use Auth0 Playground: https://auth0.com/docs/api/v2
```

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run typecheck
```

---

## Useful Commands

```bash
# Backend
cd backend
npm run dev           # Start dev server
npm run build         # Build for production
npm run test           # Run all tests
npm run lint           # Run linter
npm run typecheck      # Run TypeScript type check
npx prisma studio     # Open Prisma Studio (database GUI)

# Frontend
cd frontend
npm run dev           # Start dev server (Vite)
npm run build         # Build for production
npm run preview       # Preview production build
npm run test           # Run all tests
npm run lint           # Run linter
npm run typecheck      # Run TypeScript type check

# Database
npx prisma migrate dev          # Create migration
npx prisma migrate deploy       # Deploy migration to production
npx prisma db seed            # Seed database
npx prisma studio             # Open database GUI
npx prisma format            # Format Prisma schema

# Docker (if using)
docker-compose up -d       # Start all services
docker-compose down        # Stop all services
docker-compose logs        # View logs
```

---

## IDE Setup

### Visual Studio Code

Recommended extensions:
- **ES7+ React/Redux/React-Native snippets**
- **Prettier - Code formatter**
- **ESLint**
- **Prisma** (for database schema highlighting)
- **REST Client** (for testing APIs)
- **Thunder Client** (for testing APIs)

Settings (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.format.enable": true,
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## Architecture Overview

### Backend Structure

```
backend/
├── src/
│   ├── models/          # Prisma models (auto-generated)
│   ├── services/        # Business logic
│   ├── api/            # API routes and controllers
│   ├── middleware/      # Auth, validation, logging
│   └── utils/          # Utilities (Excel import, etc.)
├── prisma/            # Database schema and migrations
├── tests/
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── contract/       # API contract tests
└── package.json
```

### Frontend Structure

```
frontend/
├── src/
│   ├── components/      # Reusable components
│   ├── pages/          # Page components
│   ├── services/       # API client
│   ├── state/          # Zustand stores
│   └── utils/          # Utility functions
├── tests/
│   └── component/       # Component tests
└── package.json
```

---

## Key Technologies

### Backend
- **Node.js 20+**: Runtime
- **Express.js**: Web framework
- **Prisma**: ORM and migrations
- **PostgreSQL**: Database
- **Redis**: Caching
- **Auth0**: Authentication
- **SheetJS**: Excel import
- **PDFKit**: PDF export
- **Winston**: Logging
- **Jest**: Testing framework

### Frontend
- **React 18+**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool
- **Zustand**: State management
- **Material-UI**: Component library
- **React Router**: Routing
- **Axios**: HTTP client
- **Playwright**: E2E testing

---

## Next Steps

1. ✅ Set up development environment
2. ✅ Run tests to verify setup
3. ✅ Review feature specification: `specs/001-excel-to-saas/spec.md`
4. ✅ Review data model: `specs/001-excel-to-saas/data-model.md`
5. ✅ Review API contracts: `specs/001-excel-to-saas/contracts/openapi.json`
6. Start with P1 user stories (Project Dashboard, Project CRUD, Team Assignment)
7. Follow TDD workflow (write tests first!)
8. Run tests regularly
9. Submit PR for code review

---

## Additional Resources

- **Feature Specification**: `specs/001-excel-to-saas/spec.md`
- **Data Model**: `specs/001-excel-to-saas/data-model.md`
- **Research Findings**: `specs/001-excel-to-saas/research.md`
- **API Contracts**: `specs/001-excel-to-saas/contracts/openapi.json`
- **Constitution**: `.specify/memory/constitution.md`
- **Project Documentation**: `docs/` (if exists)

---

## Support

For questions or issues:
- Check this quickstart guide
- Review feature specification
- Check API documentation: http://localhost:3001/api-docs
- Review project constitution for development guidelines
- Ask in team communication channels
