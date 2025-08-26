FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/shared/node_modules ./shared/node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules

# Copy source files
COPY shared ./shared
COPY backend ./backend

# Build shared package first
WORKDIR /app/shared
RUN npm run build

# Build backend
WORKDIR /app/backend
COPY backend/.env.example .env
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backend

# Copy built application
COPY --from=builder --chown=backend:nodejs /app/backend/dist ./dist
COPY --from=builder --chown=backend:nodejs /app/backend/package*.json ./
COPY --from=builder --chown=backend:nodejs /app/backend/prisma ./prisma
COPY --from=deps --chown=backend:nodejs /app/backend/node_modules ./node_modules

# Create logs directory
RUN mkdir -p logs && chown backend:nodejs logs

USER backend

EXPOSE 3002

ENV PORT 3002

CMD ["node", "dist/index.js"]