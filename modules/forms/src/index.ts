import { defineModule }    from '@overcms/module-kit'
import { Hono }            from 'hono'
import { zValidator }      from '@hono/zod-validator'
import { z }               from 'zod'
import { Resend }          from 'resend'
import { db, formSubmissions, formDefinitions, desc, eq, sql } from '@overcms/core'
import type { FormFieldDef, FormSettings } from '@overcms/core'
import type { ModuleMiddleware } from '@overcms/module-kit'

// ─── Validation schemas ───────────────────────────────────────────────────────

const submitSchema = z.object({
  formId:  z.string().max(100).default('contact'),
  name:    z.string().max(255).optional(),
  email:   z.string().email().max(255).optional(),
  data:    z.record(z.string(), z.unknown()).default({}),
})

const formFieldSchema: z.ZodType = z.object({
  id:          z.string(),
  type:        z.enum(['text','email','phone','number','textarea','select','checkbox','radio','heading','paragraph','divider']),
  label:       z.string(),
  name:        z.string(),
  placeholder: z.string().optional(),
  required:    z.boolean().optional(),
  options:     z.array(z.string()).optional(),
  width:       z.enum(['full','half','third']).optional(),
  validation:  z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    min:       z.number().optional(),
    max:       z.number().optional(),
    pattern:   z.string().optional(),
  }).optional(),
})

const formSettingsSchema = z.object({
  submitLabel:    z.string().optional(),
  successMessage: z.string().optional(),
  redirectUrl:    z.string().optional(),
  notifyEmails:   z.array(z.string()).optional(),
})

const formDefinitionSchema = z.object({
  name:     z.string().min(1).max(255),
  slug:     z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'),
  fields:   z.array(formFieldSchema).default([]),
  settings: formSettingsSchema.default({}),
})

// ─── Email helper ─────────────────────────────────────────────────────────────

async function sendNotificationEmail(opts: {
  formName:    string
  fromEmail?:  string
  toEmails:    string[]
  submission:  { name?: string | null; email?: string | null; data: Record<string, unknown> }
}) {
  const apiKey = process.env['RESEND_API_KEY']
  if (!apiKey || opts.toEmails.length === 0) return

  const resend = new Resend(apiKey)

  const fromDomain = process.env['RESEND_FROM_DOMAIN'] ?? 'overcms.pl'
  const from = opts.fromEmail ?? `OverCMS Formularze <noreply@${fromDomain}>`

  const dataRows = Object.entries(opts.submission.data)
    .filter(([k]) => k !== 'name' && k !== 'email')
    .map(([k, v]) => `<tr><td style="padding:4px 8px;font-weight:600;color:#555">${k}</td><td style="padding:4px 8px">${v}</td></tr>`)
    .join('')

  const html = `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
  <h2 style="margin-bottom:0.5rem">Nowe zgłoszenie: ${opts.formName}</h2>
  <table style="width:100%;border-collapse:collapse;margin-top:1rem">
    ${opts.submission.name  ? `<tr><td style="padding:4px 8px;font-weight:600;color:#555">Imię i nazwisko</td><td style="padding:4px 8px">${opts.submission.name}</td></tr>` : ''}
    ${opts.submission.email ? `<tr><td style="padding:4px 8px;font-weight:600;color:#555">Email</td><td style="padding:4px 8px"><a href="mailto:${opts.submission.email}">${opts.submission.email}</a></td></tr>` : ''}
    ${dataRows}
  </table>
</div>`

  await resend.emails.send({
    from,
    to:      opts.toEmails,
    subject: `[${opts.formName}] Nowe zgłoszenie${opts.submission.name ? ` od ${opts.submission.name}` : ''}`,
    html,
  }).catch((err: unknown) => {
    console.error('[forms] Email notification failed:', err)
  })
}

// ─── CSV helper ───────────────────────────────────────────────────────────────

function submissionsToCSV(rows: { id: string; formId: string; name: string | null; email: string | null; data: Record<string, unknown>; ip: string | null; createdAt: Date }[]): string {
  if (rows.length === 0) return 'id,formId,name,email,createdAt\n'

  // Collect all data keys
  const dataKeys = new Set<string>()
  for (const row of rows) {
    for (const k of Object.keys(row.data)) {
      if (k !== 'name' && k !== 'email') dataKeys.add(k)
    }
  }
  const extraCols = Array.from(dataKeys)

  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return `"${s.replace(/"/g, '""')}"`
  }

  const header = ['id', 'formId', 'name', 'email', ...extraCols, 'createdAt'].map(escape).join(',')
  const body   = rows.map(r => [
    r.id,
    r.formId,
    r.name,
    r.email,
    ...extraCols.map(k => r.data[k]),
    r.createdAt,
  ].map(escape).join(',')).join('\n')

  return `${header}\n${body}\n`
}

// ─── Routes ───────────────────────────────────────────────────────────────────

function registerRoutes(app: Hono, { requireAuth }: ModuleMiddleware) {
  // ── Form Definitions CRUD (admin only) ───────────────────────────────────

  app.get('/definitions', requireAuth, async (c) => {
    const rows = await db.select().from(formDefinitions).orderBy(desc(formDefinitions.createdAt))
    return c.json({ data: rows })
  })

  app.get('/definitions/:id', requireAuth, async (c) => {
    const id = c.req.param('id')!
    const [row] = await db.select().from(formDefinitions).where(eq(formDefinitions.id, id))
    if (!row) return c.json({ error: 'Not found' }, 404)
    return c.json({ data: row })
  })

  app.post('/definitions', requireAuth, zValidator('json', formDefinitionSchema), async (c) => {
    const body = c.req.valid('json')
    const [row] = await db.insert(formDefinitions).values({
      name:     body.name,
      slug:     body.slug,
      fields:   body.fields as FormFieldDef[],
      settings: body.settings as FormSettings,
    }).returning()
    return c.json({ data: row }, 201)
  })

  app.put('/definitions/:id', requireAuth, zValidator('json', formDefinitionSchema), async (c) => {
    const id   = c.req.param('id')!
    const body = c.req.valid('json')
    const [row] = await db
      .update(formDefinitions)
      .set({
        name:      body.name,
        slug:      body.slug,
        fields:    body.fields as FormFieldDef[],
        settings:  body.settings as FormSettings,
        updatedAt: sql`now()`,
      })
      .where(eq(formDefinitions.id, id))
      .returning()
    if (!row) return c.json({ error: 'Not found' }, 404)
    return c.json({ data: row })
  })

  app.delete('/definitions/:id', requireAuth, async (c) => {
    const id = c.req.param('id')!
    await db.delete(formDefinitions).where(eq(formDefinitions.id, id))
    return c.json({ success: true })
  })

  // ── POST /api/m/forms/submit — public endpoint ───────────────────────────
  app.post('/submit', zValidator('json', submitSchema), async (c) => {
    const body = c.req.valid('json')
    const ip   = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? null

    const [row] = await db
      .insert(formSubmissions)
      .values({
        formId: body.formId,
        name:   body.name ?? null,
        email:  body.email ?? null,
        data:   { ...body.data, name: body.name, email: body.email },
        ip,
      })
      .returning()

    // Send email notification if form definition has notifyEmails
    const [formDef] = await db
      .select({ name: formDefinitions.name, settings: formDefinitions.settings })
      .from(formDefinitions)
      .where(eq(formDefinitions.slug, body.formId))
      .limit(1)

    if (formDef && (formDef.settings as FormSettings).notifyEmails?.length) {
      void sendNotificationEmail({
        formName:   formDef.name,
        toEmails:   (formDef.settings as FormSettings).notifyEmails!,
        submission: { name: body.name, email: body.email, data: body.data },
      })
    }

    return c.json({ data: row }, 201)
  })

  // ── GET /api/m/forms/submissions — admin only ────────────────────────────
  app.get('/submissions', requireAuth, async (c) => {
    const formId = c.req.query('formId')
    const limit  = Math.min(parseInt(c.req.query('limit')  ?? '50'), 200)
    const offset = Math.max(parseInt(c.req.query('offset') ?? '0'),  0)

    const rows = formId
      ? await db.select().from(formSubmissions)
          .where(eq(formSubmissions.formId, formId))
          .orderBy(desc(formSubmissions.createdAt))
          .limit(limit).offset(offset)
      : await db.select().from(formSubmissions)
          .orderBy(desc(formSubmissions.createdAt))
          .limit(limit).offset(offset)

    return c.json({ data: rows })
  })

  // ── GET /api/m/forms/submissions/export — CSV export (admin only) ─────────
  app.get('/submissions/export', requireAuth, async (c) => {
    const formId = c.req.query('formId')

    const rows = formId
      ? await db.select().from(formSubmissions)
          .where(eq(formSubmissions.formId, formId))
          .orderBy(desc(formSubmissions.createdAt))
      : await db.select().from(formSubmissions)
          .orderBy(desc(formSubmissions.createdAt))

    const csv      = submissionsToCSV(rows as Parameters<typeof submissionsToCSV>[0])
    const filename = formId ? `submissions-${formId}.csv` : 'submissions.csv'

    return new Response(csv, {
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  })

  // ── DELETE /api/m/forms/submissions/:id — admin only ─────────────────────
  app.delete('/submissions/:id', requireAuth, async (c) => {
    const id = c.req.param('id')!
    await db.delete(formSubmissions).where(eq(formSubmissions.id, id))
    return c.json({ success: true })
  })
}

// ─── Module definition ────────────────────────────────────────────────────────

export default defineModule({
  id:          'forms',
  name:        'Formularze',
  version:     '1.0.0',
  description: 'Zbieranie i zarządzanie zgłoszeniami z formularzy kontaktowych.',
  icon:        'FileText',
  routes:      registerRoutes,
  adminNav: {
    label: 'Formularze',
    path:  '/modules/forms',
    icon:  'FileText',
  },
})
