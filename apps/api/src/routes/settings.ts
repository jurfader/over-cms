import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, inArray } from '@overcms/core'
import { db, settings } from '@overcms/core'
import { requireAuth, requireRole } from '../middleware/auth'
import type { AppEnv } from '../types'

const router = new Hono<AppEnv>()

// ─── GET / — wszystkie ustawienia ────────────────────────────────────────────

router.get('/', async (c) => {
  const rows = await db.select().from(settings)

  // Konwertuj array key-value na obiekt
  const result = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  return c.json({ data: result })
})

// ─── PUT / — aktualizuj ustawienia (partial update) ──────────────────────────

router.put('/', requireAuth, requireRole('super_admin', 'admin'),
  zValidator('json', z.record(z.string(), z.unknown())),
  async (c) => {
    const body = c.req.valid('json')

    // Upsert każdego klucza
    const entries = Object.entries(body).map(([key, value]) => ({
      key,
      value: value ?? '',
      updatedAt: new Date(),
    }))

    if (entries.length === 0) return c.json({ data: {} })

    // Upsert jeden po drugim (bezpieczny sposób)
    for (const entry of entries) {
      await db
        .insert(settings)
        .values(entry)
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: entry.value, updatedAt: entry.updatedAt },
        })
    }

    // Pobierz zaktualizowane wartości
    const keys = entries.map((e) => e.key)
    const updated = await db.select().from(settings).where(inArray(settings.key, keys))
    const result = Object.fromEntries(updated.map((r) => [r.key, r.value]))

    return c.json({ data: result })
  }
)

// ─── GET /navigation/:name — pobierz menu ────────────────────────────────────

router.get('/navigation/:name', async (c) => {
  const name = c.req.param('name')!
  const key = `nav.${name}`

  const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1)
  return c.json({ data: row?.value ?? [] })
})

// ─── PUT /navigation/:name — zapisz menu ─────────────────────────────────────

router.put('/navigation/:name', requireAuth, requireRole('super_admin', 'admin'),
  zValidator('json', z.array(z.any())),
  async (c) => {
    const name = c.req.param('name')!
    const key = `nav.${name}`
    const items = c.req.valid('json')

    await db
      .insert(settings)
      .values({ key, value: items, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: items, updatedAt: new Date() },
      })

    return c.json({ data: items })
  }
)

// ─── GET /theme-css — publiczny endpoint z CSS motywu ────────────────────────
// Visual Builder preview ładuje ten CSS żeby odzwierciedlać motyw strony.

router.get('/theme-css', async (c) => {
  // Fetch theme settings from DB
  const keys = ['theme.bg', 'theme.surface', 'theme.fg', 'theme.muted', 'theme.primary', 'theme.accent', 'theme.border', 'theme.font']
  const rows = await db.select().from(settings).where(inArray(settings.key, keys))
  const theme: Record<string, string> = {}
  for (const r of rows) theme[r.key] = String(r.value ?? '')

  // Defaults matching corporate template
  const bg      = theme['theme.bg']      || '#0a0a0a'
  const surface = theme['theme.surface'] || '#111111'
  const fg      = theme['theme.fg']      || '#ffffff'
  const muted   = theme['theme.muted']   || 'rgba(255,255,255,0.55)'
  const primary = theme['theme.primary'] || '#E040FB'
  const accent  = theme['theme.accent']  || '#7B2FE0'
  const border  = theme['theme.border']  || 'rgba(255,255,255,0.08)'
  const font    = theme['theme.font']    || "'Open Sans', system-ui, sans-serif"

  const css = `
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap');
:root {
  --font-sans: ${font};
  --color-bg: ${bg};
  --color-surface: ${surface};
  --color-fg: ${fg};
  --color-muted: ${muted};
  --color-primary: ${primary};
  --color-accent: ${accent};
  --color-border: ${border};
  --section-y: clamp(4.5rem, 9vw, 8rem);
  --radius-sm: 0.5rem;
  --radius: 0.875rem;
  --radius-lg: 1.5rem;
}
*, *::before, *::after { box-sizing: border-box; }
body { font-family: var(--font-sans); background: var(--color-bg); color: var(--color-fg); margin: 0; min-height: 100vh; line-height: 1.7; -webkit-font-smoothing: antialiased; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 clamp(1rem, 5vw, 2.5rem); }
.glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(12px); border: 1px solid var(--color-border); }
.gradient-text { background: linear-gradient(90deg, var(--color-primary), var(--color-accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.section-label { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-primary); }
.section-label::before { content: ''; display: block; width: 1.25rem; height: 2px; background: var(--color-primary); border-radius: 1px; }
.btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.75rem; border-radius: 999px; font-weight: 600; font-size: 0.9375rem; cursor: pointer; text-decoration: none; border: none; transition: transform 0.15s, box-shadow 0.15s; }
.btn:active { transform: scale(0.97); }
.btn-primary { background: var(--color-primary); color: #fff; box-shadow: 0 4px 20px rgba(224,64,251,0.3); }
.btn-primary:hover { box-shadow: 0 6px 28px rgba(224,64,251,0.45); transform: translateY(-1px); }
.btn-outline { background: transparent; color: var(--color-fg); border: 1.5px solid rgba(255,255,255,0.2); }
.btn-outline:hover { border-color: rgba(255,255,255,0.5); transform: translateY(-1px); }
img { max-width: 100%; height: auto; }
[data-block-type="column"]:empty::after { content: '+'; display: flex; align-items: center; justify-content: center; min-height: 60px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px; color: rgba(255,255,255,0.15); font-size: 1.25rem; }
`

  c.header('Content-Type', 'text/css; charset=utf-8')
  c.header('Cache-Control', 'public, max-age=60')
  return c.body(css)
})

export default router
