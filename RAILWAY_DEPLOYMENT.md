# Railway Deployment Configuration

This document contains all the necessary information for deploying the Fllowup application on Railway.

## Architecture

- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **Frontend**: React + Vite + Material-UI
- **Database**: PostgreSQL (managed by Railway)

## Deployment Steps

### 1. Backend Deployment

The backend uses NIXPACKS builder for automatic Node.js deployment.

**Configuration file**: `backend/railway.json`

**Required Environment Variables**:
```bash
# Database (Railway provides this automatically)
DATABASE_URL=postgresql://...

# Server
PORT=3000
NODE_ENV=production

# Auth0 (set in Railway dashboard)
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://your-tenant.auth0.com/api/v2/
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_ISSUER=https://your-tenant.auth0.com/
JWT_SECRET=your-jwt-secret

# CORS
CORS_ORIGIN=https://your-frontend-url.railway.app

# Logging
LOG_LEVEL=info
```

**Deployment Commands**:
```bash
# From project root
railway login
railway init
railway add --database postgres
railway up
```

### 2. Frontend Deployment

The frontend uses Dockerfile for static build deployment.

**Configuration file**: `frontend/railway.json`

**Required Environment Variables**:
```bash
# API URL (update after backend deployment)
VITE_API_URL=https://your-backend-url.railway.app/api
```

**Build Configuration**:
- The Dockerfile builds the Vite app and serves it on port 8080
- Health check endpoint: `/`
- Build output: `dist/` directory

### 3. Database Setup

After deploying the backend, run migrations:

```bash
railway run -- npm run prisma:migrate
```

Or use Railway's CLI:
```bash
cd backend
railway run npx prisma migrate deploy
```

## Environment Variables Reference

### Backend Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | Yes | Server port (default: 3000) |
| `NODE_ENV` | Yes | Environment (production) |
| `AUTH0_DOMAIN` | Yes | Auth0 tenant domain |
| `AUTH0_AUDIENCE` | Yes | Auth0 API audience |
| `AUTH0_CLIENT_ID` | Yes | Auth0 application client ID |
| `AUTH0_CLIENT_SECRET` | Yes | Auth0 application client secret |
| `AUTH0_ISSUER` | Yes | Auth0 token issuer |
| `JWT_SECRET` | Yes | JWT signing secret |
| `CORS_ORIGIN` | Yes | Frontend URL for CORS |
| `LOG_LEVEL` | No | Logging level (default: info) |
| `REDIS_URL` | No | Redis URL for caching (optional) |
| `AWS_ACCESS_KEY_ID` | No | AWS access key for S3 (optional) |
| `AWS_SECRET_ACCESS_KEY` | No | AWS secret key (optional) |
| `AWS_REGION` | No | AWS region (default: us-east-1) |
| `AWS_S3_BUCKET` | No | S3 bucket name (optional) |

### Frontend Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API URL |

## Health Checks

- **Backend**: `GET /health` - Returns `{ status: 'ok', timestamp: ISOString }`
- **Frontend**: `GET /` - Serves the React app

## Troubleshooting

### Common Issues

1. **Prisma Client Generation Failed**
   - Solution: Ensure `prisma generate` runs during build
   - Backend Dockerfile includes: `RUN npx prisma generate`

2. **CORS Errors**
   - Solution: Update `CORS_ORIGIN` to match your frontend URL
   - Wildcard (`*`) not recommended for production

3. **Database Connection Failed**
   - Solution: Check `DATABASE_URL` format
   - Format: `postgresql://user:password@host:port/database?schema=public`

4. **Frontend Can't Connect to Backend**
   - Solution: Update `VITE_API_URL` with the correct backend URL
   - Ensure backend health check passes first

### Build Logs

View build logs in Railway dashboard or CLI:
```bash
railway logs
```

## Production Checklist

- [ ] Environment variables configured in Railway
- [ ] Database migrations applied
- [ ] Auth0 application configured
- [ ] CORS origin set to frontend URL
- [ ] Health checks passing
- [ ] API URL updated in frontend environment
- [ ] SSL/TLS certificates working (automatic on Railway)

## Support

For issues:
1. Check Railway dashboard logs
2. Verify environment variables
3. Test health endpoints
4. Review this deployment guide
