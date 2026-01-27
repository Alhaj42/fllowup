# Use Railway's nixpacks builder
FROM ghcr.io/railwayapp/nixpacks:ubuntu-20.04 AS builder

WORKDIR /app

# Copy project files
COPY . ./

# Build using nixpacks
RUN npxpack build

# Production stage
FROM ghcr.io/railwayapp/nixpacks:ubuntu-20.04

WORKDIR /app

# Copy build output
COPY --from=builder /output /app

ENV PORT=8080
ENV NODE_ENV=production

# Start server
CMD ["node", "index.js"]
