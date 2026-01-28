FROM node:20-slim AS base

WORKDIR /app

COPY package*.json ./
# Install dependencies using npm (matches package-lock.json)
RUN npm install

COPY . .

# Build the application
RUN npm run build

ENV NODE_ENV=production
EXPOSE 8080

# Start the application
CMD ["npm", "run", "start"]
