# Fllowup Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-21

## Active Technologies
- Node.js 20+ (Backend), React 18+ (Frontend), TypeScript for both (001-excel-to-saas)
- PostgreSQL 16+ (Primary DB), Redis 7+ (Caching), AWS S3 (Object Storage) (001-excel-to-saas)
- PostgreSQL 16+ (Primary DB), Redis 7+ (Caching), AWS S3 (Object Storage for future file uploads) (002-001-excel-to-saas-i-do-not-want-to-pars-date-from-excel-i-want-to-convert-excel-to-full-saas-excel-are-no-using-in-my-firm)

- Node.js 20+ (Backend), React 18+ (Frontend), TypeScript, PostgreSQL 16+, Prisma 5+, Auth0 (OAuth 2.0/OIDC), Express.js, Redis 7+, AWS S3, SheetJS (xlsx), ExcelJS, PDFKit, Winston, Prometheus, Jaeger, Jest, Supertest, Playwright, Material-UI v5+, Vite, Zustand (001-excel-to-saas)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

# Add commands for Node.js/Vite/React project
- Backend: `npm run dev` (start dev server), `npm run build` (build for production), `npm test` (run tests), `npm run lint` (run linter)
- Frontend: `npm run dev` (start Vite dev server), `npm run build` (build for production), `npm run preview` (preview production build), `npm test` (run tests), `npm run lint` (run linter)
- Database: `npx prisma migrate dev` (create migration), `npx prisma db seed` (seed database), `npx prisma studio` (open database GUI)
- Testing: `npm run test:unit` (unit tests), `npm run test:integration` (integration tests), `npm run test:contract` (contract tests), `npm run test:e2e` (E2E tests)

## Code Style

Node.js/React/TypeScript: Follow standard conventions
- Use TypeScript strict mode
- Follow ESLint and Prettier rules
- Use functional components with hooks (React)
- Use async/await for async operations (Node.js)
- Follow Prisma conventions for database queries
- Use proper error handling with try/catch

## Recent Changes
- 002-001-excel-to-saas-i-do-not-want-to-pars-date-from-excel-i-want-to-convert-excel-to-full-saas-excel-are-no-using-in-my-firm: Added Node.js 20+ (Backend), React 18+ (Frontend), TypeScript for both
- 001-excel-to-saas: Added Node.js 20+ (Backend), React 18+ (Frontend), TypeScript for both

- 001-excel-to-saas: Added Node.js 20+ (Backend), React 18+ (Frontend), TypeScript, PostgreSQL 16+, Prisma 5+, Auth0, Express.js, Redis, AWS S3, SheetJS, ExcelJS, PDFKit, Winston, Prometheus, Jaeger, Jest, Supertest, Playwright, Material-UI v5+, Vite, Zustand

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
