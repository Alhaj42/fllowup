# Railway Deployment Guide

This project is configured to deploy on Railway.

## Prerequisites

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Authenticate:
```bash
railway login
```

## Deployment Setup

### 1. Create a new Railway project
```bash
cd /home/alhaj42/clawd/fllowup
railway init
```
This will create a `railway/` directory with project configuration.

### 2. Add PostgreSQL
```bash
railway add postgresql
```

### 3. Add Redis
```bash
railway add redis
```

### 4. Deploy Backend (from backend/ directory)
```bash
railway up --service backend --backend
```

Or using the Railway CLI with path:
```bash
railway up --service backend --path backend
```

### 5. Deploy Frontend (from frontend/ directory)
```bash
railway up --service frontend --path frontend
```

**Note:** Each service needs to be deployed from its own directory (backend/ and frontend/), not from the root. This is because Nixpacks needs to detect the correct build system for each service.

## Environment Variables

The backend needs these variables (set via Railway dashboard or CLI):

- `DATABASE_URL` - Auto-set by Railway PostgreSQL plugin
- `REDIS_URL` - Auto-set by Railway Redis plugin
- `AUTH0_DOMAIN` - Your Auth0 tenant domain
- `AUTH0_AUDIENCE` - Your Auth0 API audience
- `AUTH0_CLIENT_ID` - Your Auth0 client ID
- `AUTH0_CLIENT_SECRET` - Your Auth0 client secret
- `PORT` - Default: 3000
- `NODE_ENV` - Set to `production`
- `LOG_LEVEL` - Set to `info`
- `CORS_ORIGIN` - Your frontend Railway URL

## Database Migration

After deploying backend, run Prisma migrations:

```bash
railway run "npx prisma migrate deploy" --service backend
```

## Accessing Your App

Railway will provide URLs for:
- Backend API
- Frontend web app

Update `CORS_ORIGIN` with your frontend URL and redeploy backend.

## Useful Commands

```bash
# View logs
railway logs

# View logs for specific service
railway logs --service backend

# Open dashboard
railway open

# Redeploy specific service
railway up --service backend

# Redeploy frontend
railway up --service frontend

# Open shell in service
railway shell --service backend

# List all services
railway services

# Link existing Railway project
railway link
```

## Troubleshooting

### Nixpacks Build Failed

If you get "Nixpacks was unable to generate a build plan", make sure you're deploying from the correct directory:

```bash
# ❌ Wrong - this will fail
railway up

# ✅ Correct - deploy backend from its directory
railway up --service backend --path backend

# ✅ Correct - deploy frontend from its directory
railway up --service frontend --path frontend
```

### Database Connection Issues

After adding PostgreSQL, check the DATABASE_URL variable:
```bash
railway variables
```

It should look like: `postgresql://postgres:[password]@[host]:5432/railway`

### Frontend Can't Connect to Backend

1. Get your backend Railway URL from the dashboard or:
```bash
railway domain
```

2. Update backend CORS_ORIGIN environment variable
3. Redeploy backend:
```bash
railway up --service backend
```
