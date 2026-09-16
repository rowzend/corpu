# Dependencies stage
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Development stage
FROM node:20-alpine AS dev
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs . .

USER nextjs

EXPOSE 3004
CMD ["npm", "run", "dev"]

# Production builder stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ENV NEXT_PUBLIC_API_URL=/apicorpu/1.0
ENV NEXT_PUBLIC_BACKEND_URL=
ENV NEXT_PUBLIC_API_TIMEOUT=30000
ENV NEXT_PUBLIC_APP_NAME=ASNCORPU
ENV NEXT_PUBLIC_APP_VERSION=1.0.0

RUN npm run build -- --webpack

# Production runner stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3004
ENV PORT=3004
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
