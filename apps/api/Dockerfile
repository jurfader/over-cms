# ─── Stage 1: deps ──────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Copy workspace manifests (for layer caching)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/module-kit/package.json ./packages/module-kit/
COPY modules/blog/package.json ./modules/blog/
COPY modules/forms/package.json ./modules/forms/
COPY modules/portfolio/package.json ./modules/portfolio/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile --prod=false

# ─── Stage 2: build ──────────────────────────────────────────────────────────
FROM deps AS builder
COPY tsconfig.base.json ./
COPY packages/core/src ./packages/core/src
COPY packages/core/tsconfig.json ./packages/core/
COPY packages/module-kit/src ./packages/module-kit/src
COPY packages/module-kit/tsconfig.json ./packages/module-kit/
COPY modules/blog/src ./modules/blog/src
COPY modules/blog/tsconfig.json ./modules/blog/
COPY modules/forms/src ./modules/forms/src
COPY modules/forms/tsconfig.json ./modules/forms/
COPY modules/portfolio/src ./modules/portfolio/src
COPY modules/portfolio/tsconfig.json ./modules/portfolio/
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/

# Build in dependency order
RUN pnpm --filter @overcms/core build && \
    pnpm --filter @overcms/module-kit build && \
    pnpm --filter @overcms/module-blog build && \
    pnpm --filter @overcms/module-forms build && \
    pnpm --filter @overcms/module-portfolio build && \
    pnpm --filter @overcms/api build

# ─── Stage 3: runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

ENV NODE_ENV=production

# Install only prod deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/module-kit/package.json ./packages/module-kit/
COPY modules/blog/package.json ./modules/blog/
COPY modules/forms/package.json ./modules/forms/
COPY modules/portfolio/package.json ./modules/portfolio/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile --prod

# Copy compiled output
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/module-kit/dist ./packages/module-kit/dist
COPY --from=builder /app/modules/blog/dist ./modules/blog/dist
COPY --from=builder /app/modules/forms/dist ./modules/forms/dist
COPY --from=builder /app/modules/portfolio/dist ./modules/portfolio/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Patch workspace package.json to point to compiled dist/ (src/ is not copied to runner)
RUN node -e " \
  const fs = require('fs'); \
  const pkgs = ['packages/core','packages/module-kit','modules/blog','modules/forms','modules/portfolio']; \
  pkgs.forEach(p => { \
    const f = p + '/package.json'; \
    const j = JSON.parse(fs.readFileSync(f,'utf8')); \
    j.main = './dist/index.js'; \
    j.types = './dist/index.d.ts'; \
    j.exports = {'.': './dist/index.js'}; \
    fs.writeFileSync(f, JSON.stringify(j, null, 2)); \
  }); \
"

# Public uploads dir (mounted as volume in prod)
RUN mkdir -p /app/apps/api/public/uploads

EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
