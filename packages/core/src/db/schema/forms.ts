import { jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import type { FormFieldDef, FormSettings } from '../../types/form-field'

// ─── Form Definitions (moduł: forms) ──────────────────────────────────────────

export const formDefinitions = pgTable('form_definitions', {
  id:        uuid('id').primaryKey().defaultRandom(),
  name:      varchar('name', { length: 255 }).notNull(),
  slug:      varchar('slug', { length: 100 }).notNull().unique(),
  fields:    jsonb('fields').notNull().default([]).$type<FormFieldDef[]>(),
  settings:  jsonb('settings').notNull().default({}).$type<FormSettings>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Form Submissions (moduł: forms) ──────────────────────────────────────────

export const formSubmissions = pgTable('form_submissions', {
  id:        uuid('id').primaryKey().defaultRandom(),
  formId:    varchar('form_id', { length: 100 }).notNull().default('contact'),
  name:      varchar('name', { length: 255 }),
  email:     varchar('email', { length: 255 }),
  data:      jsonb('data').notNull().default({}),
  ip:        varchar('ip', { length: 45 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
