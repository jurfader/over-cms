# License Server — aktualizacja na produkcji

Po zmianach w `apps/license-server/` (np. dodanie kolumny `product` w commit
`a117053`) trzeba na serwerze produkcyjnym pobrać kod, zbudować TypeScript,
zaaplikować migracje Drizzle i zrestartować proces.

## Najszybciej — dedykowany skrypt

```bash
ssh user@<license-server-host>
cd /path/to/over-cms/apps/license-server
bash deploy.sh
```

Skrypt sam wykryje czy używasz PM2 / systemd / Docker i odpowiednio zrestartuje.

## Manualnie — krok po kroku

### Wariant A: PM2 (większość instalacji OverCMS)

```bash
# 1. Pull nowego kodu
cd /home/overcms/app  # lub gdziekolwiek masz repo
git pull origin main

# 2. Install + build
pnpm install --frozen-lockfile --filter @overcms/license-server
cd apps/license-server
pnpm build

# 3. Apply migracji
#    Wymaga LICENSE_DATABASE_URL lub DATABASE_URL w env
pnpm db:push

# 4. Restart procesu
pm2 reload overcms-license   # nazwa procesu może być inna — sprawdź `pm2 list`
pm2 save
```

### Wariant B: Docker Compose (jeśli używasz docker-compose.prod.yml)

```bash
cd /home/overcms/app
git pull origin main

# Migracje uruchamiamy wewnątrz kontenera albo z hosta z LICENSE_DATABASE_URL
docker compose -f docker-compose.prod.yml exec license-server \
    sh -c "cd /app/apps/license-server && pnpm db:push"

# Rebuild + restart tylko license-server (nie ruszamy reszty)
docker compose -f docker-compose.prod.yml build license-server
docker compose -f docker-compose.prod.yml up -d --no-deps license-server

# Logi
docker logs -f overcms_license
```

### Wariant C: systemd

```bash
cd /home/overcms/app
git pull origin main
pnpm install --frozen-lockfile --filter @overcms/license-server
cd apps/license-server
pnpm build
pnpm db:push
sudo systemctl restart overcms-license
```

## Verify

```bash
# 1. Health endpoint
curl -s http://localhost:3002/health
# → {"ok":true,"service":"license-server"}

# 2. Sprawdź czy nowa kolumna `product` istnieje
psql "$LICENSE_DATABASE_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_name='lic_licenses' AND column_name='product';"
# → product

# 3. Test endpointu z product (admin secret w env)
curl -s -X POST http://localhost:3002/admin/licenses \
    -H "Authorization: Bearer $LICENSE_ADMIN_SECRET" \
    -H "Content-Type: application/json" \
    -d '{"product":"overcrm","plan":"trial","buyerEmail":"test@example.com"}'
# → {"data":{...,"product":"overcrm",...}}
```

## Rollback (jeśli coś poszło nie tak)

Migracja `0002_add_product_column.sql` jest **additive only** (dodaje kolumnę
z DEFAULT, nie usuwa danych) — bezpieczna do rollbacku. Jeśli musisz cofnąć:

```bash
psql "$LICENSE_DATABASE_URL" <<EOF
ALTER TABLE lic_licenses DROP COLUMN IF EXISTS product;
ALTER TABLE lic_plugins  DROP COLUMN IF EXISTS product;
ALTER TABLE lic_themes   DROP COLUMN IF EXISTS product;
DROP TYPE  IF EXISTS lic_product;
DROP INDEX IF EXISTS lic_licenses_product_idx;
DROP INDEX IF EXISTS lic_plugins_product_idx;
DROP INDEX IF EXISTS lic_themes_product_idx;
EOF

git revert a117053
# i ponownie deploy.sh
```

## Troubleshooting

| Symptom | Przyczyna | Rozwiązanie |
|---|---|---|
| `pnpm db:push` rzuca `column "product" already exists` | Migracja już zastosowana, pomijaj | OK, kontynuuj |
| `502 Bad Gateway` przez Traefik | License server nie wstał — błąd w buildzie | `pm2 logs overcms-license` lub `docker logs overcms_license` |
| `LICENSE_ADMIN_SECRET not configured` w response | env var nie jest ustawiony przy starcie procesu | Dodaj do `.env` + restart procesu |
| OVERPANEL nie tworzy licencji OVERCRM | OVERPANEL pre-validation nie pasuje do nowego pola | Sprawdź czy OVERPANEL też zaktualizowany do commit ≥`d728680` |
