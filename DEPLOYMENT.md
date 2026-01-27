# Railway Deployment Guide - fllowup

## ✅ Deployment Status

- ✅ GitHub repo updated
- ✅ Frontend builds successfully
- ✅ Dockerfiles added (backend + frontend)
- ✅ Railway project created: `sparkling-cat`

---

## 🚀 Railway Deployment Steps

### Step 1: Link Railway Project

The Railway link may have been lost. Reconnect:

```bash
cd /home/alhaj42/clawd/fllowup
railway link
```

Select: `sparkling-cat` from the list

### Step 2: Add PostgreSQL Database

**Method A - Web Dashboard:**
1. Go to: https://railway.com/project/9b1095b8-0c4b-44ec-9540-4d2c15fe341b
2. Click "New Service" → "Database" → "PostgreSQL"
3. Railway will create the database and set `DATABASE_URL` automatically

**Method B - CLI:**
```bash
cd /home/alhaj42/clawd/fllowup
railway add postgres
```

### Step 3: Add Redis

**Method A - Web Dashboard:**
1. On same project page
2. Click "New Service" → "Database" → "Redis"
3. Railway will set `REDIS_URL` automatically

**Method B - CLI:**
```bash
railway add redis
```

### Step 4: Deploy Backend

**Option A - Deploy from GitHub:**
1. On Railway project page, click "New Service"
2. Select "Deploy from GitHub repo"
3. Select: `Alhaj42/fllowup`
4. Set **Root directory** to: `backend`
5. Add environment variables:
   - `DATABASE_URL` - click to add from PostgreSQL service
   - `REDIS_URL` - click to add from Redis service
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
6. Click "Deploy"

**Option B - Deploy with CLI:**
```bash
cd /home/alhaj42/clawd/fllowup/backend
railway up
```

### Step 5: Deploy Frontend

**Option A - Deploy from GitHub:**
1. On Railway project page, click "New Service"
2. Select "Deploy from GitHub repo"
3. Select: `Alhaj42/fllowup`
4. Set **Root directory** to: `frontend`
5. Add environment variable:
   - `VITE_API_URL` = `[your-backend-railway-domain]/api/v1`
   - Example: `VITE_API_URL=https://fllowup-backend-production.up.railway.app/api/v1`
6. Click "Deploy"

**Option B - Deploy with CLI:**
```bash
cd /home/alhaj42/clawd/fllowup/frontend
railway up
```

### Step 6: Database Migration

After backend deploys successfully:

1. Click on the backend service in Railway
2. Click "Variables" tab
3. Add `DATABASE_URL` from PostgreSQL service (if not auto-linked)
4. In the backend service, click "Console"
5. Run:
```bash
npx prisma migrate deploy
```

### Step 7: Get Your URLs

After both services deploy, Railway will provide:
- Backend URL: `https://[random-name]-[id].up.railway.app`
- Frontend URL: `https://[random-name]-[id].up.railway.app`

Find these in the service cards on your Railway project page.

---

## 🔧 Environment Variables

### Backend Required Variables:
- `DATABASE_URL` - Auto-set by Railway PostgreSQL
- `REDIS_URL` - Auto-set by Railway Redis  
- `PORT` - `3000`
- `NODE_ENV` - `production`
- `CORS_ORIGIN` - Your frontend Railway URL

### Frontend Required Variables:
- `VITE_API_URL` - Your backend Railway URL + `/api/v1`

### Auth0 Variables (if using):
- `AUTH0_DOMAIN`
- `AUTH0_AUDIENCE`
- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`

---

## 🐛 Troubleshooting

### Dockerfile Error: "Dockerfile:26"
This means Railway couldn't find or parse a Dockerfile.

**Solution:**
- We've created Dockerfiles in both `backend/` and `frontend/`
- Re-deploy after pushing the latest changes

### Build Failed - TypeScript Errors

If backend fails to build due to TypeScript errors:

**Option 1 - Fix Errors First:**
```bash
cd /home/alhaj42/clawd/fllowup/backend
npm run build
```
Review and fix errors, then redeploy.

**Option 2 - Bypass Type Checking (Not Recommended):**
Update backend/Dockerfile:
```dockerfile
RUN npm run build || npm run build -- --noEmit
```

### Database Connection Issues

Check that `DATABASE_URL` is properly linked between services:
1. In Railway, click backend service → "Variables"
2. Check if `DATABASE_URL` has a reference icon (linked to PostgreSQL)
3. If not, add it manually from PostgreSQL service

### Frontend Can't Reach Backend

1. Update `CORS_ORIGIN` in backend with frontend URL
2. Update `VITE_API_URL` in frontend with backend URL
3. Redeploy both services

---

## 📊 Deployment Architecture

```
┌─────────────────────────────────────┐
│          Railway Project           │
│      (sparkling-cat)              │
└─────────────────────────────────────┘
              │
    ┌─────────┴──────────┐
    │                    │
┌───▼────┐         ┌───────▼─────┐
│ Backend  │         │   Frontend    │
│ Node.js  │         │   React+Vite │
│ Port 3000│         │   nginx:80   │
└──────────┘         └──────────────┘
    │                    │
    └────────┬───────────┘
             │
    ┌────────▼────────┐
    │  PostgreSQL     │
    │  (DATABASE_URL) │
    └─────────────────┘
    
    ┌────────────────┐
    │   Redis        │
    │  (REDIS_URL)   │
    └────────────────┘
```

---

## 🎯 Next Steps After Deployment

1. **Test the app** - Open your frontend Railway URL
2. **Run Prisma migrations** - Execute in backend service console
3. **Set up Auth0** - Add Auth0 environment variables if needed
4. **Monitor logs** - Check Railway logs for any errors
5. **Set up custom domain** (optional) - Add your own domain in Railway

---

## 📝 Useful Railway Commands

```bash
# List all services
railway services

# View logs
railway logs --service [service-name]

# Open a service shell
railway shell --service [service-name]

# Trigger new deployment
railway up --service [service-name]

# View environment variables
railway variables

# Add environment variable
railway variables set KEY=value --service [service-name]
```

---

## 🔗 Links

- **Railway Dashboard:** https://railway.com/project/9b1095b8-0c4b-44ec-9540-4d2c15fe341b
- **GitHub Repository:** https://github.com/Alhaj42/fllowup
- **Railway Documentation:** https://docs.railway.app

---

**Status:** ✅ Ready for deployment on Railway
**Last Updated:** 2026-01-27
