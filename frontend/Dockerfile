FROM node:20.19.0-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm install -g pnpm

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

ENV NODE_ENV=production
EXPOSE 8080

CMD ["pnpm", "run", "start"]
