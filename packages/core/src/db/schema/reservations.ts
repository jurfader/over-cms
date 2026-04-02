import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const rsvReservationStatusEnum = pgEnum('rsv_reservation_status', [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
])

export const rsvPaymentStatusEnum = pgEnum('rsv_payment_status', [
  'pending',
  'success',
  'failure',
])

// ─── Services — what can be booked ────────────────────────────────────────────

export const rsvServices = pgTable('rsv_services', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').notNull().default(60),
  capacity: integer('capacity').notNull().default(1),
  price: integer('price').notNull().default(0), // grosze (PLN cents)
  currency: varchar('currency', { length: 3 }).notNull().default('PLN'),
  active: boolean('active').notNull().default(true),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Availability — weekly recurring rules per service ────────────────────────

export const rsvAvailability = pgTable(
  'rsv_availability',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => rsvServices.id, { onDelete: 'cascade' }),
    dayOfWeek: integer('day_of_week').notNull(), // 0=Sunday..6=Saturday
    startTime: varchar('start_time', { length: 5 }).notNull(), // "09:00"
    endTime: varchar('end_time', { length: 5 }).notNull(), // "17:00"
    slotDuration: integer('slot_duration'), // override service default (minutes)
    active: boolean('active').notNull().default(true),
  },
  (t) => [uniqueIndex('rsv_avail_service_day').on(t.serviceId, t.dayOfWeek)],
)

// ─── Blocked dates — holidays, closures ───────────────────────────────────────

export const rsvBlockedDates = pgTable(
  'rsv_blocked_dates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceId: uuid('service_id').references(() => rsvServices.id, {
      onDelete: 'cascade',
    }), // nullable = applies to all services
    date: date('date').notNull(),
    reason: varchar('reason', { length: 255 }),
  },
  (t) => [uniqueIndex('rsv_blocked_service_date').on(t.serviceId, t.date)],
)

// ─── Reservations ─────────────────────────────────────────────────────────────

export const rsvReservations = pgTable(
  'rsv_reservations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => rsvServices.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    startTime: varchar('start_time', { length: 5 }).notNull(), // "14:00"
    endTime: varchar('end_time', { length: 5 }).notNull(), // "15:00"
    status: rsvReservationStatusEnum('status').notNull().default('pending'),
    customerName: varchar('customer_name', { length: 255 }).notNull(),
    customerEmail: varchar('customer_email', { length: 255 }).notNull(),
    customerPhone: varchar('customer_phone', { length: 50 }),
    guestCount: integer('guest_count').notNull().default(1),
    notes: text('notes'),
    totalPrice: integer('total_price').notNull().default(0), // grosze
    currency: varchar('currency', { length: 3 }).notNull().default('PLN'),
    ip: varchar('ip', { length: 45 }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('rsv_reservations_service_date_time').on(
      t.serviceId,
      t.date,
      t.startTime,
    ),
  ],
)

// ─── Payments — Autopay tracking ──────────────────────────────────────────────

export const rsvPayments = pgTable(
  'rsv_payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reservationId: uuid('reservation_id')
      .notNull()
      .references(() => rsvReservations.id, { onDelete: 'cascade' }),
    autopayOrderId: varchar('autopay_order_id', { length: 100 }).notNull(),
    autopayTransactionId: varchar('autopay_transaction_id', { length: 100 }),
    amount: integer('amount').notNull(), // grosze
    currency: varchar('currency', { length: 3 }).notNull().default('PLN'),
    status: rsvPaymentStatusEnum('status').notNull().default('pending'),
    paymentMethod: varchar('payment_method', { length: 50 }),
    itnPayload: jsonb('itn_payload'),
    hash: varchar('hash', { length: 128 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('rsv_payments_order_id').on(t.autopayOrderId),
  ],
)
