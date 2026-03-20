import {
  pgTable, uuid, varchar, text, integer, boolean,
  timestamp, pgEnum, uniqueIndex,
} from 'drizzle-orm/pg-core'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const licPlanEnum = pgEnum('lic_plan', ['trial', 'solo', 'agency'])
export const licStatusEnum = pgEnum('lic_status', ['active', 'suspended', 'expired', 'revoked'])

// ─── Licenses ─────────────────────────────────────────────────────────────────

export const licenses = pgTable('lic_licenses', {
  id:               uuid('id').primaryKey().defaultRandom(),
  key:              varchar('key', { length: 64 }).notNull().unique(),
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
}, (t) => [
  uniqueIndex('lic_act_domain_unique').on(t.licenseId, t.domain),
])

// ─── Audit log ────────────────────────────────────────────────────────────────

export const licAudit = pgTable('lic_audit', {
  id:        uuid('id').primaryKey().defaultRandom(),
  licenseId: uuid('license_id').references(() => licenses.id, { onDelete: 'set null' }),
  event:     varchar('event', { length: 100 }).notNull(),
  domain:    varchar('domain', { length: 255 }),
  meta:      text('meta'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
