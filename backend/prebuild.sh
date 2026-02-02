#!/bin/sh
# Pre-build script to generate Prisma client

echo "Generating Prisma client..."
export DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
npx prisma generate
