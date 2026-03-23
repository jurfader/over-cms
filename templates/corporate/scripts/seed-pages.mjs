#!/usr/bin/env node
/**
 * Seed CMS pages from HTML files.
 * Usage: node scripts/seed-pages.mjs
 *
 * Env vars:
 *   API_URL     — OverCMS API base URL (default: http://localhost:3001)
 *   ADMIN_EMAIL — admin email (default: admin@overcms.local)
 *   ADMIN_PASSWORD — admin password (default: admin123)
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const API = process.env.API_URL ?? 'http://localhost:3001'
const EMAIL = process.env.ADMIN_EMAIL ?? 'admin@overcms.local'
const PASS = process.env.ADMIN_PASSWORD ?? 'admin123'

// ─── Auth ────────────────────────────────────────────────────────────────────

async function login() {
  const res = await fetch(`${API}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  })
  if (!res.ok) throw new Error(`Login failed: ${res.status}`)
  const cookies = res.headers.getSetCookie?.() ?? []
  const session = cookies.find(c => c.startsWith('better-auth.session_token='))
  if (!session) throw new Error('No session cookie')
  return session.split(';')[0]
}

// ─── Ensure "page" content type exists ───────────────────────────────────────

async function ensurePageType(cookie) {
  const res = await fetch(`${API}/api/content-types`, {
    headers: { Cookie: cookie },
  })
  const { data } = await res.json()
  const pageType = data?.find(t => t.slug === 'page')
  if (pageType) {
    console.log('  ✓ Content type "page" already exists')
    return
  }

  // Create it
  const createRes = await fetch(`${API}/api/content-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      name: 'Strona',
      slug: 'page',
      icon: 'file-text',
      isSingleton: false,
      fieldsSchema: [
        { id: 'content', name: 'content', label: 'Treść HTML', type: 'richtext', required: false },
        { id: 'blocks', name: 'blocks', label: 'Bloki', type: 'blocks', required: false },
        { id: 'excerpt', name: 'excerpt', label: 'Krótki opis', type: 'textarea', required: false },
        { id: 'featured_image', name: 'featured_image', label: 'Obrazek wyróżniający', type: 'image', required: false },
      ],
    }),
  })
  if (createRes.ok) {
    console.log('  ✓ Created content type "page"')
  } else {
    const err = await createRes.text()
    console.warn(`  ⚠ Failed to create "page" type: ${err}`)
  }
}

// ─── Create or update a page ────────────────────────────────────────────────

async function upsertPage(cookie, { title, slug, html }) {
  // Check if exists
  const listRes = await fetch(`${API}/api/content/page?limit=100&status=`, {
    headers: { Cookie: cookie },
  })
  const list = await listRes.json()
  const existing = list.data?.find(e => e.item?.slug === slug)

  const body = {
    title,
    slug,
    data: { content: html },
    status: 'published',
    seo: {},
  }

  if (existing) {
    // Update
    const res = await fetch(`${API}/api/content/page/${existing.item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify(body),
    })
    if (res.ok) console.log(`  ✓ Updated page "${slug}"`)
    else console.warn(`  ⚠ Failed to update "${slug}": ${await res.text()}`)

    // Publish
    await fetch(`${API}/api/content/page/${existing.item.id}/publish`, {
      method: 'POST',
      headers: { Cookie: cookie },
    })
  } else {
    // Create
    const res = await fetch(`${API}/api/content/page`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      console.warn(`  ⚠ Failed to create "${slug}": ${await res.text()}`)
      return
    }
    const created = await res.json()
    console.log(`  ✓ Created page "${slug}"`)

    // Publish
    await fetch(`${API}/api/content/page/${created.data?.id ?? created.id}/publish`, {
      method: 'POST',
      headers: { Cookie: cookie },
    })
    console.log(`  ✓ Published page "${slug}"`)
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 Seeding CMS pages...\n')

  const cookie = await login()
  console.log('  ✓ Logged in\n')

  await ensurePageType(cookie)

  // Read HTML files
  const homepageHtml = readFileSync(resolve(__dirname, '../seed-homepage.html'), 'utf-8')

  const pages = [
    {
      title: 'Strona główna',
      slug: 'home',
      html: homepageHtml,
    },
    {
      title: 'Kontakt',
      slug: 'kontakt',
      html: `
<section style="padding-top: 9rem; padding-bottom: var(--section-y); background: var(--color-surface);">
  <div class="container" style="max-width: 800px; text-align: center;">
    <p class="section-label" style="justify-content: center; margin-bottom: 1rem;">Kontakt</p>
    <h1 class="display" style="font-size: clamp(2.5rem, 6vw, 4.5rem); margin-bottom: 1.5rem;">
      Skontaktuj się <span class="gradient-text">z nami</span>
    </h1>
    <p style="font-size: clamp(1.0625rem, 2vw, 1.25rem); color: var(--color-muted); line-height: 1.7;">
      Masz pytanie lub chcesz wycenę projektu? Napisz do nas — odpowiemy w ciągu 24h.
    </p>
  </div>
</section>
<section style="padding: var(--section-y) 0;">
  <div class="container" style="max-width: 600px;">
    <div class="glass" style="border-radius: var(--radius-lg); padding: 2.5rem;">
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          <a href="mailto:kontakt@overmedia.pl" style="color: var(--color-fg); text-decoration: none;">kontakt@overmedia.pl</a>
        </div>
        <div style="display: flex; align-items: center; gap: 1rem;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
          <a href="tel:+48793047857" style="color: var(--color-fg); text-decoration: none;">+48 793 047 857</a>
        </div>
        <div style="display: flex; align-items: center; gap: 1rem;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
          <span style="color: rgba(255,255,255,0.6);">NIP: 5862382836</span>
        </div>
        <div style="display: flex; align-items: center; gap: 1rem;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span style="color: rgba(255,255,255,0.6);">Pon – Pt: 9:00 – 17:00</span>
        </div>
      </div>
    </div>
  </div>
</section>`,
    },
    {
      title: 'O nas',
      slug: 'o-nas',
      html: `
<section style="padding-top: 9rem; padding-bottom: var(--section-y); background: var(--color-surface);">
  <div class="container" style="max-width: 800px; text-align: center;">
    <p class="section-label" style="justify-content: center; margin-bottom: 1rem;">O nas</p>
    <h1 class="display" style="font-size: clamp(2.5rem, 6vw, 4.5rem); margin-bottom: 1.5rem;">
      Kim <span class="gradient-text">jesteśmy</span>
    </h1>
    <p style="font-size: clamp(1.0625rem, 2vw, 1.25rem); color: var(--color-muted); line-height: 1.7;">
      Jesteśmy agencją cyfrową z pasją do tworzenia wyjątkowych doświadczeń online.
    </p>
  </div>
</section>
<section style="padding: var(--section-y) 0;">
  <div class="container">
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.25rem;">
      <div class="glass" style="border-radius: var(--radius-lg); padding: 2rem;">
        <p style="font-size: 0.75rem; font-weight: 700; color: var(--color-primary); letter-spacing: 0.08em; margin-bottom: 0.75rem;">01</p>
        <h3 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 0.625rem;">Jakość</h3>
        <p style="font-size: 0.9375rem; color: var(--color-muted); line-height: 1.65;">Każdy projekt traktujemy z pełnym zaangażowaniem — bez skrótów.</p>
      </div>
      <div class="glass" style="border-radius: var(--radius-lg); padding: 2rem;">
        <p style="font-size: 0.75rem; font-weight: 700; color: var(--color-primary); letter-spacing: 0.08em; margin-bottom: 0.75rem;">02</p>
        <h3 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 0.625rem;">Transparentność</h3>
        <p style="font-size: 0.9375rem; color: var(--color-muted); line-height: 1.65;">Jasne umowy, realistyczne wyceny i otwarta komunikacja.</p>
      </div>
      <div class="glass" style="border-radius: var(--radius-lg); padding: 2rem;">
        <p style="font-size: 0.75rem; font-weight: 700; color: var(--color-primary); letter-spacing: 0.08em; margin-bottom: 0.75rem;">03</p>
        <h3 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 0.625rem;">Innowacja</h3>
        <p style="font-size: 0.9375rem; color: var(--color-muted); line-height: 1.65;">Stale rozwijamy nasze kompetencje i śledzimy trendy technologiczne.</p>
      </div>
      <div class="glass" style="border-radius: var(--radius-lg); padding: 2rem;">
        <p style="font-size: 0.75rem; font-weight: 700; color: var(--color-primary); letter-spacing: 0.08em; margin-bottom: 0.75rem;">04</p>
        <h3 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 0.625rem;">Partnerstwo</h3>
        <p style="font-size: 0.9375rem; color: var(--color-muted); line-height: 1.65;">Budujemy długoterminowe relacje, a nie jednorazowe transakcje.</p>
      </div>
    </div>
  </div>
</section>`,
    },
  ]

  console.log('')
  for (const page of pages) {
    await upsertPage(cookie, page)
  }

  console.log('\n✅ Done! Pages seeded successfully.\n')
}

main().catch((err) => {
  console.error('❌ Seed failed:', err.message)
  process.exit(1)
})
