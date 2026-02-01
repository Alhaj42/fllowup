# Dockerfile for Railway deployment
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN apt-get update -y && apt-get install -y openssl
RUN npm install --legacy-peer-deps

# Copy Prisma schema
COPY prisma ./prisma

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Generate Prisma client and start server
CMD ["sh", "-c", "npx prisma generate && node dist/server.js"]
