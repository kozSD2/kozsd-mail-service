FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/shared/node_modules ./shared/node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules

# Copy source files
COPY shared ./shared
COPY frontend ./frontend

# Build shared package first
WORKDIR /app/shared
RUN npm run build

# Build frontend
WORKDIR /app/frontend
RUN npm run build

# Production image with nginx
FROM nginx:alpine AS runner

# Copy built assets
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx config
COPY frontend/nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]