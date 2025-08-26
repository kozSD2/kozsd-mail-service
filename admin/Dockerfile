FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY admin/package*.json ./admin/

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/shared/node_modules ./shared/node_modules
COPY --from=deps /app/admin/node_modules ./admin/node_modules

# Copy source files
COPY shared ./shared
COPY admin ./admin

# Build shared package first
WORKDIR /app/shared
RUN npm run build

# Build admin
WORKDIR /app/admin
RUN npm run build

# Production image with nginx
FROM nginx:alpine AS runner

# Copy built assets
COPY --from=builder /app/admin/dist /usr/share/nginx/html

# Copy nginx config
COPY admin/nginx.conf /etc/nginx/nginx.conf

EXPOSE 3001

CMD ["nginx", "-g", "daemon off;"]