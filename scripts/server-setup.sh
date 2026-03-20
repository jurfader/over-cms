#!/bin/bash
# OverCMS — Server Setup Script
# Uruchom jako root na świeżym Ubuntu 22.04
set -euo pipefail

echo "=== OverCMS Server Setup ==="

# ─── Docker ───────────────────────────────────────────────────────────────────
echo "Installing Docker..."
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# ─── Docker Compose ───────────────────────────────────────────────────────────
echo "Installing Docker Compose plugin..."
apt-get install -y docker-compose-plugin

# ─── App directory ────────────────────────────────────────────────────────────
echo "Creating /opt/overcms..."
mkdir -p /opt/overcms
cd /opt/overcms

# ─── .env (manual step) ───────────────────────────────────────────────────────
if [ ! -f .env ]; then
  echo ""
  echo "⚠️  Create /opt/overcms/.env based on .env.example before starting!"
  echo "   cp .env.example .env && nano .env"
  echo ""
fi

# ─── GitHub Container Registry login ──────────────────────────────────────────
echo ""
echo "To pull images from GHCR, run:"
echo "  echo YOUR_GITHUB_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin"
echo ""

# ─── Log rotation ─────────────────────────────────────────────────────────────
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "5"
  }
}
EOF
systemctl restart docker

echo ""
echo "=== Setup complete ==="
echo "Next steps:"
echo "  1. Copy docker-compose.prod.yml to /opt/overcms/"
echo "  2. Create /opt/overcms/.env from .env.example"
echo "  3. docker compose -f docker-compose.prod.yml up -d"
