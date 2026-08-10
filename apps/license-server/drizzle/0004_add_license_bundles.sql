-- Pakiety licencyjne OVERCRM (overcrm-ai, overcrm-sprzedaz, …).
--
-- Model jest CELOWO inny niż drabinka planów (trial < solo < agency), bo
-- pakiety są względem siebie NIEZALEŻNE: klient może mieć Pakiet AI bez
-- Pakietu Sprzedaż. Drabinka tego nie wyrazi, stąd osobna tabela zamiast
-- kolejnego poziomu w `plan`.
--
-- Osobna tabela zamiast kolumny tablicowej na lic_licenses, bo każde nadanie
-- niesie własne dane: skąd przyszło (manual / stripe / trial), kiedy i do
-- kiedy. Trial pakietu wygasa niezależnie od samej licencji.
--
-- Migracja jest ADDITIVE ONLY — nie rusza istniejących danych ani zachowania
-- OVERCMS. Bezpieczna do wielokrotnego uruchomienia i do rollbacku.

CREATE TABLE IF NOT EXISTS "lic_license_bundles" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "license_id" uuid NOT NULL REFERENCES "lic_licenses"("id") ON DELETE CASCADE,
  "bundle"     varchar(64) NOT NULL,
  "source"     varchar(32) DEFAULT 'manual' NOT NULL,
  "expires_at" timestamp,
  "granted_at" timestamp DEFAULT now() NOT NULL,
  "notes"      text
);
--> statement-breakpoint

-- Jedna licencja nie może mieć tego samego pakietu dwa razy. Dzięki temu
-- ponowne nadanie jest UPSERT-em, a nie cichym duplikatem, który podwajałby
-- wpis w panelu i mylił przy odbieraniu dostępu.
CREATE UNIQUE INDEX IF NOT EXISTS "lic_bundle_unique"
  ON "lic_license_bundles" ("license_id", "bundle");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "lic_bundle_license_idx"
  ON "lic_license_bundles" ("license_id");
--> statement-breakpoint

-- Pakiet, do którego należy moduł. Odpowiada polu `bundle` w module.json
-- po stronie OVERCRM. NULL = moduł w licencji podstawowej.
-- Dla produktu overcms nieużywane — tam dostępu pilnuje required_plan.
ALTER TABLE "lic_plugins"
  ADD COLUMN IF NOT EXISTS "bundle" varchar(64);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "lic_plugins_bundle_idx"
  ON "lic_plugins" ("bundle");
