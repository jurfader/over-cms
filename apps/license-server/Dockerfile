# ─── Stage 1: deps ──────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/license-server/package.json ./apps/license-server/

RUN pnpm install --frozen-lockfile --prod=false

# ─── Stage 2: build ──────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app

COPY tsconfig.base.json ./
COPY apps/license-server/src ./apps/license-server/src
COPY apps/license-server/tsconfig.json ./apps/license-server/

RUN pnpm --filter @overcms/license-server build

# ─── Stage 3: runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

ENV NODE_ENV=production

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/license-server/package.json ./apps/license-server/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/license-server/dist ./apps/license-server/dist

EXPOSE 3002
CMD ["node", "apps/license-server/dist/index.js"]
