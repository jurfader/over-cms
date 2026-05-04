-- Add 'product' column to lic_licenses, lic_plugins, lic_themes
-- to distinguish OVERMEDIA products: 'overcms' (default for backwards compat)
-- and 'overcrm' (Laravel CRM).
--
-- Existing rows are stamped as 'overcms' since the license server was
-- originally built for OverCMS only.

CREATE TYPE "public"."lic_product" AS ENUM('overcms', 'overcrm');
--> statement-breakpoint
ALTER TABLE "lic_licenses" ADD COLUMN "product" "lic_product" DEFAULT 'overcms' NOT NULL;
--> statement-breakpoint
ALTER TABLE "lic_plugins"  ADD COLUMN "product" "lic_product" DEFAULT 'overcms' NOT NULL;
--> statement-breakpoint
ALTER TABLE "lic_themes"   ADD COLUMN "product" "lic_product" DEFAULT 'overcms' NOT NULL;
--> statement-breakpoint
CREATE INDEX "lic_licenses_product_idx" ON "lic_licenses" ("product");
--> statement-breakpoint
CREATE INDEX "lic_plugins_product_idx"  ON "lic_plugins"  ("product");
--> statement-breakpoint
CREATE INDEX "lic_themes_product_idx"   ON "lic_themes"   ("product");
