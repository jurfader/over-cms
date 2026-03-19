import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { and, asc, eq } from '@overcms/core'
import { db, contentTypes, contentItems, settings } from '@overcms/core'
import { requireAuth } from '../middleware/auth'
import { ApiError } from '../middleware/error'
import type { AppEnv } from '../types'

const router = new Hono<AppEnv>()

// ─── GET /sitemap.xml ─────────────────────────────────────────────────────────

router.get('/sitemap.xml', async (c) => {
  const [siteUrlRow] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, 'site.url'))
    .limit(1)

  const siteUrl = (siteUrlRow?.value as string) ?? 'http://localhost:3000'

  const items = await db
    .select({
      slug: contentItems.slug,
      typeSlug: contentTypes.slug,
      updatedAt: contentItems.updatedAt,
      publishedAt: contentItems.publishedAt,
    })
    .from(contentItems)
    .innerJoin(contentTypes, eq(contentItems.typeId, contentTypes.id))
    .where(eq(contentItems.status, 'published'))
    .orderBy(contentItems.updatedAt)

  const urls = items.map((item) => {
    const loc = item.typeSlug === 'page'
      ? `${siteUrl}/${item.slug}`
      : `${siteUrl}/${item.typeSlug}/${item.slug}`

    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${(item.updatedAt ?? item.publishedAt ?? new Date()).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${item.typeSlug === 'page' ? '0.8' : '0.6'}</priority>
  </url>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

  c.header('Content-Type', 'application/xml')
  return c.body(xml)
})

// ─── GET /robots.txt ──────────────────────────────────────────────────────────

router.get('/robots.txt', async (c) => {
  const [siteUrlRow] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, 'site.url'))
    .limit(1)

  const siteUrl = (siteUrlRow?.value as string) ?? 'http://localhost:3000'

  const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml`

  c.header('Content-Type', 'text/plain')
  return c.body(robots)
})

// ─── GET /sitemap-data — lista treści z danymi SEO (dla panelu admina) ────────

router.get('/sitemap-data', requireAuth, async (c) => {
  const items = await db
    .select({
      id:        contentItems.id,
      title:     contentItems.title,
      slug:      contentItems.slug,
      seo:       contentItems.seo,
      typeSlug:  contentTypes.slug,
      updatedAt: contentItems.updatedAt,
    })
    .from(contentItems)
    .innerJoin(contentTypes, eq(contentItems.typeId, contentTypes.id))
    .where(eq(contentItems.status, 'published'))
    .orderBy(asc(contentTypes.slug), asc(contentItems.updatedAt))

  return c.json({ data: items })
})

// ─── GET /:typeSlug/:slug — dane SEO dla strony ───────────────────────────────

router.get('/:typeSlug/:slug', async (c) => {
  const typeSlug = c.req.param('typeSlug')!
  const slug = c.req.param('slug')!

  const [type] = await db
    .select()
    .from(contentTypes)
    .where(eq(contentTypes.slug, typeSlug))
    .limit(1)

  if (!type) throw ApiError.notFound(`Content type "${typeSlug}" not found`)

  const [item] = await db
    .select({ seo: contentItems.seo, title: contentItems.title })
    .from(contentItems)
    .where(and(eq(contentItems.typeId, type.id), eq(contentItems.slug, slug)))
    .limit(1)

  if (!item) throw ApiError.notFound('Item not found')

  return c.json({ data: item.seo ?? { title: item.title } })
})

// ─── PUT /:typeSlug/:id — aktualizuj dane SEO ─────────────────────────────────

router.put('/:typeSlug/:id', requireAuth,
  zValidator('json', z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    ogTitle: z.string().optional(),
    ogDescription: z.string().optional(),
    ogImage: z.string().optional(),
    twitterCard: z.enum(['summary', 'summary_large_image']).optional(),
    canonicalUrl: z.string().optional(),
    noIndex: z.boolean().optional(),
    noFollow: z.boolean().optional(),
  })),
  async (c) => {
    const typeSlug = c.req.param('typeSlug')!
    const id = c.req.param('id')!
    const seoData = c.req.valid('json')

    const [type] = await db
      .select()
      .from(contentTypes)
      .where(eq(contentTypes.slug, typeSlug))
      .limit(1)

    if (!type) throw ApiError.notFound(`Content type "${typeSlug}" not found`)

    const [existing] = await db
      .select({ id: contentItems.id, seo: contentItems.seo })
      .from(contentItems)
      .where(and(eq(contentItems.typeId, type.id), eq(contentItems.id, id)))
      .limit(1)

    if (!existing) throw ApiError.notFound('Item not found')

    // Merge z istniejącymi SEO data
    const mergedSeo = { ...(existing.seo ?? {}), ...seoData }

    const [updated] = await db
      .update(contentItems)
      .set({ seo: mergedSeo, updatedAt: new Date() })
      .where(eq(contentItems.id, id))
      .returning({ seo: contentItems.seo })

    return c.json({ data: updated?.seo ?? null })
  }
)

export default router
