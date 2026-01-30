FROM node:20-slim AS base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-slim AS production

WORKDIR /app

# Copy built files from base stage
COPY --from=base /app/dist ./dist
COPY --from=base /app/package*.json ./

# Install production dependencies only
RUN npm install --legacy-peer-deps --omit=dev

ENV NODE_ENV=production
EXPOSE 8080

# Start the application
CMD ["npm", "run", "start"]
