# Backend NestJS Dockerfile — multi-stage production build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy Prisma schema and config
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ── Production stage ──
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy Prisma schema, config, and generated client from builder
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy compiled output
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p uploads

# Run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

# Run migrations then start (seed is skipped in production by default)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
