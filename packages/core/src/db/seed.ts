import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { randomUUID } from 'crypto'

import * as schema from './schema'

// ─── Setup ────────────────────────────────────────────────────────────────────

const connectionString = process.env['DATABASE_URL']
if (!connectionString) throw new Error('DATABASE_URL is not set')

const client = postgres(connectionString)
const db = drizzle(client, { schema })

// ─── Helpers ──────────────────────────────────────────────────────────────────

const log = (msg: string) => console.log(`  ${msg}`)

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱 Seeding database...\n')

  // Czyszczenie w kolejności uwzględniającej FK
  await db.delete(schema.contentItems)
  await db.delete(schema.contentTypes)
  await db.delete(schema.media)
  await db.delete(schema.redirects)
  await db.delete(schema.settings)
  await db.delete(schema.modules)
  await db.delete(schema.session)
  await db.delete(schema.account)
  await db.delete(schema.verification)
  await db.delete(schema.user)
  log('✓ Wyczyszczono tabele')

  // ── Users ────────────────────────────────────────────────────────────────────

  const adminId = randomUUID()

  const adminEmail = process.env['ADMIN_EMAIL'] || 'admin@overcms.local'
  const adminPassword = process.env['ADMIN_PASSWORD'] || 'Admin123!'

  await db.insert(schema.user).values([
    {
      id: adminId,
      name: 'Super Admin',
      email: adminEmail,
      emailVerified: true,
      role: 'super_admin',
    },
  ])
  log(`✓ Admin: ${adminEmail}`)

  // ── Accounts (credentials) ───────────────────────────────────────────────────

  const adminHash = await bcrypt.hash(adminPassword, 10)

  await db.insert(schema.account).values([
    {
      id: randomUUID(),
      accountId: adminId,
      providerId: 'credential',
      userId: adminId,
      password: adminHash,
    },
  ])
  log('✓ Konto admina utworzone')

  // ── Content Types ─────────────────────────────────────────────────────────────

  const pageTypeId = randomUUID()
  const postTypeId = randomUUID()
  const projectTypeId = randomUUID()

  await db.insert(schema.contentTypes).values([
    {
      id: pageTypeId,
      slug: 'page',
      name: 'Strona',
      description: 'Statyczne strony serwisu',
      icon: 'file-text',
      isSingleton: false,
      fieldsSchema: [
        {
          id: 'content',
          name: 'content',
          label: 'Treść',
          type: 'richtext',
          required: true,
        },
        {
          id: 'excerpt',
          name: 'excerpt',
          label: 'Krótki opis',
          type: 'textarea',
          required: false,
        },
        {
          id: 'featured_image',
          name: 'featured_image',
          label: 'Zdjęcie główne',
          type: 'image',
          required: false,
        },
      ],
    },
    {
      id: postTypeId,
      slug: 'post',
      name: 'Post',
      description: 'Artykuły blogowe',
      icon: 'newspaper',
      isSingleton: false,
      fieldsSchema: [
        {
          id: 'content',
          name: 'content',
          label: 'Treść',
          type: 'richtext',
          required: true,
        },
        {
          id: 'excerpt',
          name: 'excerpt',
          label: 'Krótki opis',
          type: 'textarea',
          required: true,
        },
        {
          id: 'cover_image',
          name: 'cover_image',
          label: 'Zdjęcie okładki',
          type: 'image',
          required: false,
        },
        {
          id: 'tags',
          name: 'tags',
          label: 'Tagi',
          type: 'json',
          required: false,
        },
        {
          id: 'reading_time',
          name: 'reading_time',
          label: 'Czas czytania (min)',
          type: 'number',
          required: false,
        },
      ],
    },
    {
      id: projectTypeId,
      slug: 'project',
      name: 'Projekt',
      description: 'Realizacje / portfolio',
      icon: 'briefcase',
      isSingleton: false,
      fieldsSchema: [
        {
          id: 'description',
          name: 'description',
          label: 'Opis projektu',
          type: 'richtext',
          required: true,
        },
        {
          id: 'client',
          name: 'client',
          label: 'Klient',
          type: 'text',
          required: false,
        },
        {
          id: 'technologies',
          name: 'technologies',
          label: 'Technologie',
          type: 'json',
          required: false,
        },
        {
          id: 'gallery',
          name: 'gallery',
          label: 'Galeria',
          type: 'json',
          required: false,
        },
        {
          id: 'url',
          name: 'url',
          label: 'Link do projektu',
          type: 'text',
          required: false,
        },
        {
          id: 'cover_image',
          name: 'cover_image',
          label: 'Zdjęcie główne',
          type: 'image',
          required: false,
        },
      ],
    },
  ])
  log('✓ Typy treści utworzone (Strona, Post, Projekt)')

  // ── Content Items ─────────────────────────────────────────────────────────────

  await db.insert(schema.contentItems).values([
    // Strony
    {
      id: randomUUID(),
      typeId: pageTypeId,
      slug: 'home',
      title: 'Strona główna',
      status: 'draft',
      authorId: adminId,
      data: {
        content: '<h2>Witaj w OverCMS</h2><p>To jest przykładowa treść strony głównej.</p>',
        excerpt: 'Nowoczesny, modularny system CMS',
      },
      seo: {
        title: 'Strona główna — OverCMS',
        description: 'Nowoczesny, modularny system CMS dla agencji i developerów.',
      },
    },
    {
      id: randomUUID(),
      typeId: pageTypeId,
      slug: 'o-nas',
      title: 'O nas',
      status: 'draft',
      authorId: adminId,
      data: {
        content: '<h2>Kim jesteśmy</h2><p>Przykładowa treść strony O nas.</p>',
        excerpt: 'Poznaj nasz zespół',
      },
      seo: {
        title: 'O nas — OverCMS',
        description: 'Poznaj nasz zespół i historię firmy.',
      },
    },
    {
      id: randomUUID(),
      typeId: pageTypeId,
      slug: 'kontakt',
      title: 'Kontakt',
      status: 'draft',
      authorId: adminId,
      data: {
        content: '<h2>Skontaktuj się z nami</h2><p>Wypełnij formularz lub zadzwoń.</p>',
        excerpt: 'Jesteśmy do Twojej dyspozycji',
      },
      seo: {
        title: 'Kontakt — OverCMS',
        description: 'Skontaktuj się z nami. Odpiszemy w ciągu 24h.',
      },
    },
    // Posty
    {
      id: randomUUID(),
      typeId: postTypeId,
      slug: 'witaj-w-overcms',
      title: 'Witaj w OverCMS — nowoczesny headless CMS',
      status: 'draft',
      authorId: adminId,
      data: {
        content:
          '<p>OverCMS to modularny, headless CMS zbudowany na Next.js i Hono.js.</p><p>Szybki, elastyczny i gotowy na SEO.</p>',
        excerpt: 'Poznaj możliwości nowoczesnego systemu CMS zbudowanego od podstaw.',
        tags: ['cms', 'headless', 'nextjs'],
        reading_time: 3,
      },
      seo: {
        title: 'Witaj w OverCMS — nowoczesny headless CMS',
        description: 'Poznaj możliwości nowoczesnego systemu CMS zbudowanego od podstaw.',
      },
    },
    {
      id: randomUUID(),
      typeId: postTypeId,
      slug: 'jak-dziala-system-modulow',
      title: 'Jak działa system modułów w OverCMS',
      status: 'draft',
      authorId: adminId,
      data: {
        content:
          '<p>System modułów OverCMS pozwala rozszerzać funkcjonalność CMS bez modyfikacji core.</p>',
        excerpt: 'Dowiedz się jak tworzyć własne moduły i pluginy do OverCMS.',
        tags: ['moduły', 'development', 'api'],
        reading_time: 5,
      },
      seo: {
        title: 'Jak działa system modułów w OverCMS',
        description: 'Dowiedz się jak tworzyć własne moduły i pluginy do OverCMS.',
      },
    },
    // Projekty
    {
      id: randomUUID(),
      typeId: projectTypeId,
      slug: 'strona-firmowa-xyz',
      title: 'Strona firmowa XYZ Corp',
      status: 'draft',
      authorId: adminId,
      data: {
        description: '<p>Kompleksowy redesign strony firmowej z nowym systemem CMS.</p>',
        client: 'XYZ Corp',
        technologies: ['Next.js', 'OverCMS', 'GSAP', 'Tailwind CSS'],
        url: 'https://example.com',
      },
      seo: {
        title: 'Strona firmowa XYZ Corp — Portfolio',
        description: 'Kompleksowy redesign strony firmowej z nowym systemem CMS.',
      },
    },
  ])
  log('✓ Treści przykładowe dodane (3 strony, 2 posty, 1 projekt)')

  // ── Settings ──────────────────────────────────────────────────────────────────

  await db.insert(schema.settings).values([
    { key: 'site.name', value: 'OverCMS Demo' },
    { key: 'site.description', value: 'Demo instalacja systemu OverCMS' },
    { key: 'site.url', value: 'http://localhost:3000' },
    { key: 'site.logo', value: '' },
    { key: 'site.favicon', value: '' },
    { key: 'site.language', value: 'pl' },
    { key: 'seo.default_title_suffix', value: '— OverCMS Demo' },
    { key: 'seo.default_og_image', value: '' },
    { key: 'seo.google_analytics_id', value: '' },
    { key: 'nav.main', value: [] },
    { key: 'nav.footer', value: [] },
    { key: 'email.from_name', value: 'OverCMS' },
    { key: 'email.from_address', value: 'noreply@overcms.local' },
  ])
  log('✓ Ustawienia domyślne dodane')

  // ── Modules ───────────────────────────────────────────────────────────────────

  await db.insert(schema.modules).values([
    {
      id: 'blog',
      name: 'Blog',
      version: '0.0.1',
      active: false,
      config: { postsPerPage: 10, enableComments: false },
    },
    {
      id: 'forms',
      name: 'Formularze',
      version: '0.0.1',
      active: false,
      config: {},
    },
    {
      id: 'portfolio',
      name: 'Portfolio',
      version: '0.0.1',
      active: false,
      config: { projectsPerPage: 12 },
    },
    {
      id: 'seo',
      name: 'SEO Manager',
      version: '0.0.1',
      active: true,
      config: { generateSitemap: true, generateRobots: true },
    },
  ])
  log('✓ Moduły zarejestrowane (blog, forms, portfolio, seo)')

  // ─────────────────────────────────────────────────────────────────────────────

  console.log('\n✅ Seed zakończony pomyślnie!\n')
  console.log(`  Admin: ${adminEmail}\n`)

  await client.end()
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
