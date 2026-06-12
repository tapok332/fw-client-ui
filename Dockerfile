# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# NEXT_PUBLIC_* vars are inlined at build time, so they must be set before `npm run build`.
# Defaults target Kyiv center; override via docker-compose build args or `--build-arg`.
ARG NEXT_PUBLIC_DEFAULT_LAT=50.4501
ARG NEXT_PUBLIC_DEFAULT_LNG=30.5234
ENV NEXT_PUBLIC_DEFAULT_LAT=${NEXT_PUBLIC_DEFAULT_LAT}
ENV NEXT_PUBLIC_DEFAULT_LNG=${NEXT_PUBLIC_DEFAULT_LNG}

# Stripe publishable key (pk_test_... / pk_live_...). Empty value disables the online
# payment form gracefully — checkout falls back to cash-only with a visible notice.
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}

# Google OAuth Client ID for Sign In with Google button. Empty value disables the
# button gracefully — user sees a toast asking to configure it.
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=""
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set the correct owner for application files
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
