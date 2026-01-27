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
railway init
```

### 2. Add PostgreSQL
```bash
railway add postgresql
```

### 3. Add Redis
```bash
railway add redis
```

### 4. Deploy Backend
```bash
railway up --service backend
```

### 5. Deploy Frontend
```bash
railway up --service frontend
```

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

# Open dashboard
railway open

# Redeploy
railway up

# Open shell in service
railway shell --service backend
```
