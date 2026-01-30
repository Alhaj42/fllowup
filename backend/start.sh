#!/bin/sh
# Startup script for Railway deployment
# Runs database migrations and starts the server

echo "🚀 Running database migrations..."

# Try to resolve any failed migrations first (ignore errors if not in failed state)
npx prisma migrate resolve --rolled-back 20260123121000_add_optimization_indexes 2>/dev/null || true

# Now deploy migrations
npx prisma migrate deploy

echo "✅ Starting server..."
node dist/server.js
