import { defineModule }    from '@overcms/module-kit'
import { Hono }            from 'hono'
import { db, contentItems, contentTypes, eq, desc, and } from '@overcms/core'
import type { ModuleMiddleware } from '@overcms/module-kit'

// ─── Routes ───────────────────────────────────────────────────────────────────

function registerRoutes(app: Hono, _middleware: ModuleMiddleware) {
  // ── GET /api/m/blog/rss — public RSS feed ────────────────────────────────
  app.get('/rss', async (_c) => {
    // Fetch published posts (content type slug: 'post')
    const typeRows = await db
      .select({ id: contentTypes.id })
      .from(contentTypes)
      .where(eq(contentTypes.slug, 'post'))
      .limit(1)

    const typeId = typeRows[0]?.id

    const posts = typeId
      ? await db
          .select()
          .from(contentItems)
          .where(and(eq(contentItems.typeId, typeId), eq(contentItems.status, 'published')))
          .orderBy(desc(contentItems.publishedAt))
          .limit(50)
      : []

    const siteUrl = process.env['SITE_URL'] ?? 'http://localhost:3000'
    const now     = new Date().toUTCString()

    const items = posts.map((p) => {
      const data = p.data as Record<string, unknown>
      const title   = String(p.title ?? '')
      const slug    = String(data['slug'] ?? p.id)
      const excerpt = String(data['excerpt'] ?? data['description'] ?? '')
      const pubDate = p.publishedAt ? new Date(p.publishedAt).toUTCString() : now

      return `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${siteUrl}/blog/${slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${excerpt}]]></description>
    </item>`
    }).join('\n')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blog</title>
    <link>${siteUrl}/blog</link>
    <description>Najnowsze wpisy blogowe</description>
    <language>pl</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${siteUrl}/api/m/blog/rss" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`

    return new Response(xml, {
      headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
    })
  })
}

// ─── Module definition ────────────────────────────────────────────────────────

export default defineModule({
  id:          'blog',
  name:        'Blog',
  version:     '1.0.0',
  description: 'Moduł blogowy z kanałem RSS.',
  icon:        'BookOpen',
  routes:      registerRoutes,
  adminNav: {
    label: 'Blog',
    path:  '/content/post',
    icon:  'BookOpen',
  },
})
