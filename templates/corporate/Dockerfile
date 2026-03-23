# ─── Stage 1: deps ──────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY templates/corporate/package.json ./templates/corporate/

RUN pnpm install --frozen-lockfile

# ─── Stage 2: build ──────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY tsconfig.base.json ./
COPY templates/corporate ./templates/corporate

RUN pnpm --filter my-overcms-site build

# ─── Stage 3: runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3005

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/templates/corporate/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/templates/corporate/.next/static ./templates/corporate/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/templates/corporate/public ./templates/corporate/public

USER nextjs
EXPOSE 3005

ENV HOSTNAME=0.0.0.0
CMD ["node", "templates/corporate/server.js"]
