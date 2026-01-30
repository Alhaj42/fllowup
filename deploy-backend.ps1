# Railway Deployment Script for Fllowup Backend
# Save as: deploy-backend.ps1
# Run: .\deploy-backend.ps1

Write-Host "🚀 Starting Railway Deployment for Fllowup Backend" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Navigate to backend directory
$backendPath = "D:\Development\Fllowup\backend"
if (-not (Test-Path $backendPath)) {
    Write-Host "❌ Error: Backend directory not found at $backendPath" -ForegroundColor Red
    exit 1
}

Set-Location $backendPath
Write-Host "📁 Working directory: $backendPath" -ForegroundColor Cyan

# Check if railway CLI is installed
try {
    $railwayVersion = railway --version 2>$null
    Write-Host "✅ Railway CLI found: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g @railway/cli
}

# Step 1: Login to Railway
Write-Host "`n🔐 Step 1: Checking Railway authentication..." -ForegroundColor Yellow
$loginStatus = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login to Railway..." -ForegroundColor Yellow
    railway login
} else {
    Write-Host "✅ Already logged in as: $loginStatus" -ForegroundColor Green
}

# Step 2: Check current status
Write-Host "`n📊 Step 2: Checking Railway status..." -ForegroundColor Yellow
railway status

# Step 3: Link to project
Write-Host "`n🔗 Step 3: Linking to Railway project..." -ForegroundColor Yellow
Write-Host "Select the 'follow-up' project and 'backend' service when prompted" -ForegroundColor Cyan
railway link

# Step 4: Set environment variables
Write-Host "`n⚙️  Step 4: Setting environment variables..." -ForegroundColor Yellow

# Check if DATABASE_URL is already set
$dbUrl = railway variables get DATABASE_URL 2>&1
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($dbUrl)) {
    Write-Host "Setting DATABASE_URL..." -ForegroundColor Cyan
    railway variables set DATABASE_URL="postgresql://postgres:postgres@postgres.railway.internal:5432/railway"
} else {
    Write-Host "✅ DATABASE_URL already set" -ForegroundColor Green
}

# Set other required variables
$envVars = @{
    "NODE_ENV" = "production"
    "PORT" = "3000"
    "LOG_LEVEL" = "info"
}

foreach ($var in $envVars.GetEnumerator()) {
    Write-Host "Setting $($var.Key)..." -ForegroundColor Cyan
    railway variables set "$($var.Key)=$($var.Value)"
}

# Step 5: Deploy
Write-Host "`n🚀 Step 5: Deploying to Railway..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Cyan
railway up

# Step 6: Check deployment status
Write-Host "`n✅ Step 6: Checking deployment status..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
railway status

# Step 7: Show logs
Write-Host "`n📋 Step 7: Recent deployment logs..." -ForegroundColor Yellow
railway logs

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "🎉 Deployment process completed!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Check your deployment at: https://railway.com/dashboard" -ForegroundColor White
Write-Host "2. Test health endpoint once deployment is ready" -ForegroundColor White
Write-Host "3. Deploy frontend with: .\deploy-frontend.ps1" -ForegroundColor White
