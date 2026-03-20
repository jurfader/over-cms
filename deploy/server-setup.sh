#!/bin/bash
# OverCMS — Server Setup Script
# Ubuntu + CloudPanel
# Uruchom jako root lub sudo: bash server-setup.sh

set -e
echo ""
echo "=========================================="
echo "  OverCMS Server Setup — Ubuntu/CloudPanel"
echo "=========================================="
echo ""

# ─── Node.js 22 ───────────────────────────────────────────────────────────────
echo "📦  Instaluję Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
node --version
npm --version

# ─── pnpm ─────────────────────────────────────────────────────────────────────
echo "📦  Instaluję pnpm..."
npm install -g pnpm@latest
pnpm --version

# ─── PM2 ──────────────────────────────────────────────────────────────────────
echo "📦  Instaluję PM2..."
npm install -g pm2@latest
pm2 --version

# ─── Git (jeśli brak) ─────────────────────────────────────────────────────────
echo "📦  Sprawdzam git..."
apt-get install -y git

# ─── PostgreSQL (jeśli CloudPanel go nie ma) ──────────────────────────────────
if ! command -v psql &> /dev/null; then
  echo "📦  Instaluję PostgreSQL..."
  apt-get install -y postgresql postgresql-contrib
  systemctl enable postgresql
  systemctl start postgresql
  echo "✅  PostgreSQL zainstalowany"
else
  echo "✅  PostgreSQL już istnieje"
fi

# ─── Utwórz bazę danych ───────────────────────────────────────────────────────
echo ""
echo "🗄️   Konfiguruję bazę danych PostgreSQL..."
sudo -u postgres psql <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'overcms') THEN
    CREATE USER overcms WITH PASSWORD 'ZMIEN_TO_HASLO_DB';
  END IF;
END
\$\$;

CREATE DATABASE overcms OWNER overcms;
GRANT ALL PRIVILEGES ON DATABASE overcms TO overcms;
SQL
echo "✅  Baza overcms gotowa"

# ─── Klonowanie repozytorium ──────────────────────────────────────────────────
echo ""
echo "📁  Konfiguruję katalog aplikacji..."

REPO_DIR="/home/overcms/app"
mkdir -p "$REPO_DIR"

echo ""
echo "⚠️   Sklonuj repozytorium ręcznie:"
echo "    cd /home/overcms"
echo "    git clone https://github.com/TWOJ_USER/OVERCMS.git app"
echo "    cd app"
echo ""

# ─── PM2 autostart ────────────────────────────────────────────────────────────
echo "⚙️   Konfiguruję PM2 autostart..."
pm2 startup ubuntu -u root --hp /root
echo "✅  PM2 uruchomi się automatycznie po restarcie"

echo ""
echo "=========================================="
echo "  Setup zakończony!"
echo ""
echo "  Następne kroki:"
echo "  1. Sklonuj repo do /home/overcms/app"
echo "  2. Skopiuj .env.production do każdej aplikacji"
echo "  3. Uruchom: bash deploy/deploy.sh"
echo "  4. Skonfiguruj CloudPanel (patrz README)"
echo "=========================================="
