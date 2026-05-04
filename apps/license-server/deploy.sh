#!/usr/bin/env bash
# ==============================================================================
# License Server — deploy / update na produkcji
# Uruchom z katalogu apps/license-server/ (po `git pull`):
#     bash deploy.sh
#
# Skrypt sam wykryje czy license-server działa pod PM2, systemd czy Docker
# i odpowiednio zrestartuje. Zawsze uruchamia migracje Drizzle.
# ==============================================================================
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log() { echo -e "${CYAN}▶${NC} $*"; }
ok()  { echo -e "${GREEN}✓${NC} $*"; }
warn(){ echo -e "${YELLOW}⚠${NC} $*"; }

cd "$(dirname "${BASH_SOURCE[0]}")"
SERVICE_DIR=$(pwd)
ROOT_DIR=$(cd "$SERVICE_DIR/../.." && pwd)

# ── 1. Git pull (z root repo, jeśli .git tam jest) ────────────────────────────
log "Git pull z $ROOT_DIR"
cd "$ROOT_DIR"
git pull --ff-only origin main
ok "Git up to date — $(git -C "$ROOT_DIR" rev-parse --short HEAD)"

# ── 2. Install dependencies (workspace-aware) ─────────────────────────────────
log "pnpm install (workspace)"
cd "$ROOT_DIR"
pnpm install --frozen-lockfile --filter @overcms/license-server
ok "Dependencies zainstalowane"

# ── 3. Build TypeScript → dist/ ───────────────────────────────────────────────
log "Build TypeScript"
cd "$SERVICE_DIR"
pnpm build
ok "Build OK ($(ls dist/ 2>/dev/null | wc -l) plików)"

# ── 4. Apply Drizzle migrations ───────────────────────────────────────────────
# Wymaga LICENSE_DATABASE_URL lub DATABASE_URL w env (.env w root repo).
log "Drizzle: db:push (apply pending migrations)"
if [[ -f "$ROOT_DIR/.env" ]]; then
    set -a; source "$ROOT_DIR/.env"; set +a
fi
if [[ -z "${LICENSE_DATABASE_URL:-}" && -z "${DATABASE_URL:-}" ]]; then
    warn "LICENSE_DATABASE_URL ani DATABASE_URL nie jest ustawione — pomijam migracje"
    warn "Uruchom ręcznie po deploy: cd $SERVICE_DIR && pnpm db:push"
else
    pnpm db:push
    ok "Migracje zastosowane"
fi

# ── 5. Restart serwisu ────────────────────────────────────────────────────────
log "Wykrywanie sposobu uruchomienia"

if command -v pm2 >/dev/null 2>&1 && pm2 list 2>/dev/null | grep -q "overcms-license\|license-server"; then
    SERVICE_NAME=$(pm2 list | awk '/license/ {print $4; exit}')
    log "Wykryto PM2 — reload $SERVICE_NAME"
    pm2 reload "$SERVICE_NAME" --update-env
    pm2 save
    ok "PM2 reload OK"

elif systemctl is-active --quiet overcms-license 2>/dev/null; then
    log "Wykryto systemd — restart overcms-license"
    sudo systemctl restart overcms-license
    ok "systemd restart OK"

elif docker ps --format '{{.Names}}' 2>/dev/null | grep -q "overcms_license"; then
    log "Wykryto Docker — rebuild + restart license-server container"
    cd "$ROOT_DIR"
    docker compose -f docker-compose.prod.yml build license-server
    docker compose -f docker-compose.prod.yml up -d --no-deps license-server
    ok "Docker compose restart OK"

else
    warn "Nie wykryto PM2/systemd/Docker dla license-server"
    warn "Restart ręcznie i sprawdź curl http://localhost:3002/health"
    exit 1
fi

# ── 6. Health check ───────────────────────────────────────────────────────────
log "Health check (czekam 3s na restart...)"
sleep 3
PORT="${LICENSE_PORT:-3002}"
if curl -sf "http://localhost:${PORT}/health" >/dev/null; then
    ok "Health check OK — http://localhost:${PORT}/health odpowiada"
else
    warn "Health check FAILED — sprawdź logi"
    warn "  PM2:     pm2 logs overcms-license --lines 50"
    warn "  systemd: journalctl -u overcms-license -n 50"
    warn "  Docker:  docker logs overcms_license --tail 50"
    exit 1
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ License server zaktualizowany${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
