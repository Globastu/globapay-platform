FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./
RUN pnpm i --frozen-lockfile --prod

# Development dependencies for building
FROM base AS builder
WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable

COPY package.json pnpm-lock.yaml* ./
RUN pnpm i --frozen-lockfile

COPY . .
RUN pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

# Copy built application
COPY --from=builder --chown=fastify:nodejs /app/dist ./dist
COPY --from=deps --chown=fastify:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=fastify:nodejs /app/package.json ./package.json

USER fastify

EXPOSE 3001

ENV PORT 3001
ENV HOST "0.0.0.0"

CMD ["node", "dist/server.js"]