import {
  pgTable, uuid, varchar, text, integer, boolean,
  timestamp, pgEnum, uniqueIndex,
} from 'drizzle-orm/pg-core'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const licPlanEnum = pgEnum('lic_plan', ['trial', 'solo', 'agency'])
export const licStatusEnum = pgEnum('lic_status', ['active', 'suspended', 'expired', 'revoked'])
// Product — który produkt OVERMEDIA jest licencjonowany.
// 'overcms' = OverCMS / OverCMS 2.0 (WordPress + React). 'overcrm' = OVERCRM (Laravel CRM).
// Default 'overcms' dla wstecznej kompatybilności z istniejącymi rekordami.
export const licProductEnum = pgEnum('lic_product', ['overcms', 'overcrm'])

// ─── Licenses ─────────────────────────────────────────────────────────────────

export const licenses = pgTable('lic_licenses', {
  id:               uuid('id').primaryKey().defaultRandom(),
  key:              varchar('key', { length: 64 }).notNull().unique(),
  product:          licProductEnum('product').notNull().default('overcms'),
  plan:             licPlanEnum('plan').notNull().default('trial'),
  status:           licStatusEnum('status').notNull().default('active'),
  buyerEmail:       varchar('buyer_email', { length: 255 }).notNull(),
  buyerName:        varchar('buyer_name', { length: 255 }),
  maxInstallations: integer('max_installations').notNull().default(1),
  expiresAt:        timestamp('expires_at'),          // null = lifetime
  stripeCustomerId: varchar('stripe_customer_id', { length: 100 }),
  stripeSubId:      varchar('stripe_subscription_id', { length: 100 }),
  notes:            text('notes'),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
  updatedAt:        timestamp('updated_at').notNull().defaultNow(),
})

// ─── Activations ──────────────────────────────────────────────────────────────

export const activations = pgTable('lic_activations', {
  id:             uuid('id').primaryKey().defaultRandom(),
  licenseId:      uuid('license_id').notNull().references(() => licenses.id, { onDelete: 'cascade' }),
  domain:         varchar('domain', { length: 255 }).notNull(),
  installationId: varchar('installation_id', { length: 64 }).notNull(),
  active:         boolean('active').notNull().default(true),
  lastSeenAt:     timestamp('last_seen_at').notNull().defaultNow(),
  activatedAt:    timestamp('activated_at').notNull().defaultNow(),

  // Etap 2c anti-piracy: rotujący token bindujący instalację. Każdy /validate
  // ROTUJE token (server zapisuje nowy + zwraca w response). Klient musi w
  // następnym /validate wysłać nowy token — stary już nie działa.
  // Klonowanie OVERCRM = jeden klient ma stary token, prawdziwy ma nowy →
  // klon dostaje BINDING_MISMATCH przy najbliższym validate (max 24h).
  // previousToken: 24h grace window — jeśli klient wysyła previous (np. po
  // network blip który nie dostał nowego tokenu), serwer dalej akceptuje.
  bindingToken:        varchar('binding_token', { length: 64 }),
  previousToken:       varchar('previous_token', { length: 64 }),
  tokenRotatedAt:      timestamp('token_rotated_at'),
}, (t) => [
  uniqueIndex('lic_act_domain_unique').on(t.licenseId, t.domain),
])

// ─── License bundles (pakiety) ────────────────────────────────────────────────
// Pakiety OVERCRM: overcrm-ai, overcrm-sprzedaz, … Model jest CELOWO inny niż
// drabinka planów (trial < solo < agency), bo pakiety są względem siebie
// NIEZALEŻNE — klient może mieć Pakiet AI bez Pakietu Sprzedaż. Drabinka tego
// nie wyrazi, dlatego osobna tabela zamiast kolejnego poziomu w `plan`.
//
// Osobna tabela, a nie kolumna tablicowa na lic_licenses, bo każde nadanie
// niesie własne dane: skąd przyszło (ręcznie / Stripe / trial), kiedy i do
// kiedy. Trial pakietu wygasa niezależnie od licencji, więc potrzebuje
// własnego expiresAt.

export const licenseBundles = pgTable('lic_license_bundles', {
  id:        uuid('id').primaryKey().defaultRandom(),
  licenseId: uuid('license_id').notNull().references(() => licenses.id, { onDelete: 'cascade' }),
  bundle:    varchar('bundle', { length: 64 }).notNull(),   // 'overcrm-ai'
  source:    varchar('source', { length: 32 }).notNull().default('manual'), // manual | stripe | trial
  expiresAt: timestamp('expires_at'),                       // null = bezterminowo
  grantedAt: timestamp('granted_at').notNull().defaultNow(),
  notes:     text('notes'),
}, (t) => [
  uniqueIndex('lic_bundle_unique').on(t.licenseId, t.bundle),
])

// ─── Plugins ─────────────────────────────────────────────────────────────────

export const plugins = pgTable('lic_plugins', {
  id:          varchar('id', { length: 100 }).primaryKey(), // e.g. 'reservations'
  product:     licProductEnum('product').notNull().default('overcms'),
  // Pakiet, do którego należy moduł (tylko produkt overcrm). Odpowiada polu
  // `bundle` w module.json. NULL = moduł w licencji podstawowej.
  // Dla overcms nieużywane — tam dostępu pilnuje requiredPlan.
  bundle:      varchar('bundle', { length: 64 }),
  name:        varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  version:     varchar('version', { length: 50 }).notNull(),
  icon:        varchar('icon', { length: 100 }),       // lucide icon name
  author:      varchar('author', { length: 255 }),
  minCmsVersion: varchar('min_cms_version', { length: 50 }), // e.g. '1.3.0'
  requiredPlan: licPlanEnum('required_plan').default('solo'), // minimum plan
  price:       integer('price').default(0),             // grosze, 0 = free
  currency:    varchar('currency', { length: 3 }).default('PLN'),
  downloadUrl: text('download_url'),                    // URL to .tar.gz
  changelog:   text('changelog'),
  active:      boolean('active').notNull().default(true),
  downloads:   integer('downloads').notNull().default(0),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
  updatedAt:   timestamp('updated_at').notNull().defaultNow(),
})

// ─── Themes ──────────────────────────────────────────────────────────────────
// Premium themes (Divi, Extra, etc.) — streamowane bezpośrednio z serwera licencji
// z /var/lib/overcms-licenses/themes/{id}.zip po walidacji klucza.

export const themes = pgTable('lic_themes', {
  id:            varchar('id', { length: 100 }).primaryKey(), // 'divi', 'extra'
  product:       licProductEnum('product').notNull().default('overcms'),
  name:          varchar('name', { length: 255 }).notNull(),
  description:   text('description'),
  version:       varchar('version', { length: 50 }).notNull(),
  author:        varchar('author', { length: 255 }),
  requiredPlan:  licPlanEnum('required_plan').default('solo'), // minimum plan
  filename:      varchar('filename', { length: 255 }).notNull(), // 'divi.zip'
  fileSize:      integer('file_size').default(0),          // bytes
  licenseUsername: varchar('license_username', { length: 255 }), // ET username
  licenseApiKey:  text('license_api_key'),                       // ET API key (stored server-side)
  active:        boolean('active').notNull().default(true),
  downloads:     integer('downloads').notNull().default(0),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
  updatedAt:     timestamp('updated_at').notNull().defaultNow(),
})

// ─── Audit log ────────────────────────────────────────────────────────────────

export const licAudit = pgTable('lic_audit', {
  id:        uuid('id').primaryKey().defaultRandom(),
  licenseId: uuid('license_id').references(() => licenses.id, { onDelete: 'set null' }),
  event:     varchar('event', { length: 100 }).notNull(),
  domain:    varchar('domain', { length: 255 }),
  meta:      text('meta'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
