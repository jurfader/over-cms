#!/bin/bash
# OverCMS — Deploy Script
# Uruchom z katalogu głównego repo: bash deploy/deploy.sh
# Przy każdym deployu: git pull → install → build → restart PM2

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo ""
echo "🚀  OverCMS Deploy — $(date '+%Y-%m-%d %H:%M:%S')"
echo "📁  Root: $ROOT"
echo ""

# ─── 1. Git pull ──────────────────────────────────────────────────────────────
echo "⬇️   Pobieram zmiany z git..."
cd "$ROOT"
git pull origin main
echo "✅  Git pull gotowy"

# ─── 2. Install dependencies ──────────────────────────────────────────────────
echo ""
echo "📦  Instaluję zależności (pnpm)..."
pnpm install --frozen-lockfile
echo "✅  Zależności zainstalowane"

# ─── 3. Database migrations ───────────────────────────────────────────────────
echo ""
echo "🗄️   Uruchamiam migracje bazy danych..."
cd "$ROOT/packages/core"
pnpm drizzle-kit migrate
echo "✅  Migracje zakończone"

# ─── 4. Build API ─────────────────────────────────────────────────────────────
echo ""
echo "🔨  Buduję API..."
cd "$ROOT/apps/api"
pnpm build
echo "✅  API zbudowane"

# ─── 5. Build Admin ───────────────────────────────────────────────────────────
echo ""
echo "🔨  Buduję Admin..."
cd "$ROOT/apps/admin"
pnpm build
echo "✅  Admin zbudowany"

# Skopiuj static + public do standalone
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public 2>/dev/null || true

# ─── 6. Build Corporate site ──────────────────────────────────────────────────
echo ""
echo "🔨  Buduję stronę (overmedia.pl)..."
cd "$ROOT/templates/corporate"
npm run build
echo "✅  Strona zbudowana"

# Skopiuj static + public do standalone
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public 2>/dev/null || true

# ─── 7. Restart PM2 ───────────────────────────────────────────────────────────
echo ""
echo "♻️   Restartuję procesy PM2..."
cd "$ROOT"

if pm2 list | grep -q "overcms"; then
  pm2 reload deploy/pm2.config.js --update-env
else
  pm2 start deploy/pm2.config.js
fi

pm2 save
echo "✅  PM2 gotowy"

# ─── 8. Status ────────────────────────────────────────────────────────────────
echo ""
echo "📊  Status procesów:"
pm2 list

echo ""
echo "🎉  Deploy zakończony!"
echo ""
echo "  🌐  https://overmedia.pl"
echo "  🔧  https://admin.overmedia.pl"
echo "  🔌  https://api.overmedia.pl"
echo ""
