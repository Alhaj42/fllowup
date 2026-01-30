# Quick Railway Deployment - One Liner Commands
# Run these commands one by one in PowerShell

# Option 1: Run the full deployment script
.\deploy-backend.ps1

# Option 2: Manual step-by-step commands:
cd D:\Development\Fllowup\backend
railway login
railway status
railway link
railway variables set DATABASE_URL="postgresql://postgres:postgres@postgres.railway.internal:5432/railway"
railway variables set NODE_ENV="production"
railway up

# Option 3: If railway link doesn't work, manually create service first:
# 1. Go to https://railway.com/dashboard
# 2. Click "follow-up" project
# 3. Click "+ New" → "Empty Service"
# 4. Name it "backend"
# 5. Then run:
cd D:\Development\Fllowup\backend
railway link
railway variables set DATABASE_URL="postgresql://postgres:postgres@postgres.railway.internal:5432/railway"
railway up

# After deployment, check status:
railway status
railway logs

# Test the deployment (replace URL with your actual backend URL):
Invoke-RestMethod -Uri "https://your-backend-url.railway.app/health"
