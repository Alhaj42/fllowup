# Railway Deployment Guide - fllowup

## ✅ Deployment Status

- ✅ GitHub repo updated
- ✅ Frontend builds successfully
- ✅ Railway project created: `sparkling-cat`
- ✅ Dockerfiles simplified (both services use automatic npm build)
- ✅ nixpacks.toml configs removed (Railway uses npm build now)

---

## 🚀 Railway Deployment - Quick Start

### Step 1: Link Railway Project (if needed)

```bash
cd /home/alhaj42/clawd/fllowup
railway link
```

Select: `sparkling-cat` from the list

### Step 2: Add Services

**Add PostgreSQL:**
```bash
cd /home/alhaj42/clawd/fllowup
railway add postgres
```

**Add Redis:**
```bash
railway add redis
```

**Deploy Backend:**
```bash
cd /home/alhaj42/clawd/fllowup/backend
railway up
```

**Deploy Frontend:**
```bash
cd /home/alhaj42/clawd/fllowup/frontend
railway up
```

### Step 3: Configure Environment Variables

**Backend Variables:**
- `DATABASE_URL` - Auto-linked from PostgreSQL service
- `REDIS_URL` - Auto-linked from Redis service
- `NODE_ENV` - `production`
- `PORT` - `3000`

**Frontend Variables:**
- `VITE_API_URL` - Your backend Railway URL + `/api/v1`
  - Example: `https://fllowup-backend-production.up.railway.app/api/v1`

---

## 🔧 Dockerfiles

Both services use simple Dockerfiles that rely on Railway's automatic npm build.

**Backend Dockerfile:**
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 80
CMD ["node", "index.js"]
```

---

## 📊 Current Status

| Component | Status |
|-----------|--------|
| Frontend Build | ✅ Success |
| Frontend Dockerfile | ✅ Ready |
| Backend Dockerfile | ✅ Ready |
| Railway Project | ✅ Created (`sparkling-cat`) |
| Backend Code | ⚠️ ~100 TypeScript errors |

---

## 🚀 Deploy Now!

Frontend is ready for Railway deployment. Backend has TypeScript errors that need fixing before production deployment.

**Steps:**
1. Go to Railway: https://railway.com/project/9b1095b8-0c4b-44ec-9540-4d2c15fe341b
2. Add PostgreSQL and Redis services
3. Deploy backend from GitHub (root: `backend`)
4. Deploy frontend from GitHub (root: `frontend`)
5. Link `DATABASE_URL` and `REDIS_URL` to backend
6. Add `VITE_API_URL` to frontend with backend URL

---

**Last Updated:** 2026-01-27
