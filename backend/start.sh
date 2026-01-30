#!/bin/sh
# Startup script for Railway deployment
# Runs database migrations and starts the server

echo "🚀 Running database migrations..."
npx prisma migrate deploy

echo "✅ Starting server..."
node dist/server.js
