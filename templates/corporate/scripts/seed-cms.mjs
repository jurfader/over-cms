#!/usr/bin/env node
/**
 * Seed script — tworzy content types i początkowe dane w OverCMS
 * dla szablonu templates/corporate (OVERMEDIA).
 *
 * Użycie:
 *   node scripts/seed-cms.mjs
 *
 * Wymagane zmienne środowiskowe (lub argumenty):
 *   OVERCMS_ADMIN_EMAIL=admin@example.com
 *   OVERCMS_ADMIN_PASSWORD=hasło
 *   NEXT_PUBLIC_API_URL=http://localhost:3001
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3001'
const EMAIL   = process.env.OVERCMS_ADMIN_EMAIL    ?? 'admin@overcms.local'
const PASS    = process.env.OVERCMS_ADMIN_PASSWORD  ?? ''
const TOKEN   = process.env.OVERCMS_SESSION_TOKEN  ?? ''

if (!PASS && !TOKEN) {
  console.error('❌  Ustaw OVERCMS_ADMIN_PASSWORD lub OVERCMS_SESSION_TOKEN')
  process.exit(1)
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function login() {
  // Allow skipping password auth by providing a raw session cookie directly
  if (TOKEN) {
    console.log('✅  Używam podanego session token')
    return { type: 'cookie', value: `better-auth.session_token=${TOKEN}` }
  }

  const res = await fetch(`${API_URL}/api/auth/sign-in/email`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Origin: API_URL },
    body:    JSON.stringify({ email: EMAIL, password: PASS }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Logowanie nieudane (${res.status}): ${body}`)
  }
  // getSetCookie() returns all Set-Cookie headers as an array (Node.js 18+)
  const allCookies = res.headers.getSetCookie
    ? res.headers.getSetCookie()
    : [res.headers.get('set-cookie') ?? '']

  // Extract cookie name=value pairs (strip attributes like Max-Age, Path, etc.)
  const cookieHeader = allCookies
    .map((c) => c.split(';')[0])
    .filter(Boolean)
    .join('; ')

  console.log(`✅  Zalogowano jako ${EMAIL}`)
  return { type: 'cookie', value: cookieHeader }
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiPost(path, body, auth) {
  const authHeader = { Cookie: auth.value }

  const res = await fetch(`${API_URL}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Origin: API_URL, ...authHeader },
    body:    JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    // 409 = już istnieje — ignorujemy
    if (res.status === 409) return { alreadyExists: true, data }
    throw new Error(`POST ${path} → ${res.status}: ${JSON.stringify(data)}`)
  }
  return data
}

// ─── Content types definitions ────────────────────────────────────────────────

const CONTENT_TYPES = [
  {
    slug:        'hero',
    name:        'Hero Section',
    description: 'Główna sekcja strony głównej',
    icon:        'Star',
    isSingleton: true,
    fieldsSchema: [
      { id: 'f1',  name: 'badge_text',         label: 'Tekst badge',              type: 'text',     required: false },
      { id: 'f2',  name: 'title_before',        label: 'Tytuł – linia 1',          type: 'text',     required: false },
      { id: 'f3',  name: 'title_gradient',      label: 'Tytuł – gradient (linia 2)',type: 'text',    required: false },
      { id: 'f4',  name: 'title_after',         label: 'Tytuł – linia 3',          type: 'text',     required: false },
      { id: 'f5',  name: 'subtitle',            label: 'Podtytuł',                 type: 'textarea', required: false },
      { id: 'f6',  name: 'cta_primary_text',    label: 'CTA główny – tekst',        type: 'text',     required: false },
      { id: 'f7',  name: 'cta_secondary_text',  label: 'CTA drugorzędny – tekst',   type: 'text',     required: false },
      { id: 'f8',  name: 'stat1_value',         label: 'Statystyka 1 – wartość',    type: 'text',     required: false },
      { id: 'f9',  name: 'stat1_label',         label: 'Statystyka 1 – opis',       type: 'text',     required: false },
      { id: 'f10', name: 'stat2_value',         label: 'Statystyka 2 – wartość',    type: 'text',     required: false },
      { id: 'f11', name: 'stat2_label',         label: 'Statystyka 2 – opis',       type: 'text',     required: false },
      { id: 'f12', name: 'stat3_value',         label: 'Statystyka 3 – wartość',    type: 'text',     required: false },
      { id: 'f13', name: 'stat3_label',         label: 'Statystyka 3 – opis',       type: 'text',     required: false },
    ],
  },
  {
    slug:        'service_item',
    name:        'Usługa',
    description: 'Pozycja w sekcji Usługi',
    icon:        'Briefcase',
    isSingleton: false,
    fieldsSchema: [
      { id: 'f1', name: 'title',       label: 'Nazwa usługi',  type: 'text',     required: true  },
      { id: 'f2', name: 'description', label: 'Opis',          type: 'textarea', required: false },
      { id: 'f3', name: 'price',       label: 'Cena',          type: 'text',     required: false },
      { id: 'f4', name: 'badge',       label: 'Badge (np. Popularne)', type: 'text', required: false },
      { id: 'f5', name: 'icon_key',    label: 'Ikona',         type: 'select',   required: false,
        options: ['web', 'shop', 'app', 'video', 'reels', 'social', 'it', 'ads'] },
      { id: 'f6', name: 'order',       label: 'Kolejność',     type: 'number',   required: false },
    ],
  },
  {
    slug:        'portfolio_item',
    name:        'Realizacja',
    description: 'Pozycja w sekcji Portfolio',
    icon:        'Image',
    isSingleton: false,
    fieldsSchema: [
      { id: 'f1', name: 'title',       label: 'Tytuł projektu', type: 'text',     required: true  },
      { id: 'f2', name: 'category',    label: 'Kategoria',      type: 'select',   required: false,
        options: ['Aplikacje', 'Branding', 'Sklepy', 'Strony WWW', 'Video'] },
      { id: 'f3', name: 'description', label: 'Opis',           type: 'textarea', required: false },
      { id: 'f4', name: 'tags',        label: 'Tagi (oddzielone przecinkami)', type: 'text', required: false },
      { id: 'f5', name: 'image',       label: 'Zdjęcie',        type: 'image',    required: false },
      { id: 'f6', name: 'order',       label: 'Kolejność',      type: 'number',   required: false },
    ],
  },
  {
    slug:        'testimonial',
    name:        'Opinia',
    description: 'Opinia klienta',
    icon:        'Star',
    isSingleton: false,
    fieldsSchema: [
      { id: 'f1', name: 'name',    label: 'Imię i nazwisko', type: 'text',     required: true  },
      { id: 'f2', name: 'role',    label: 'Stanowisko',      type: 'text',     required: false },
      { id: 'f3', name: 'company', label: 'Firma',           type: 'text',     required: false },
      { id: 'f4', name: 'rating',  label: 'Ocena (1–5)',     type: 'number',   required: false },
      { id: 'f5', name: 'text',    label: 'Treść opinii',    type: 'textarea', required: true  },
    ],
  },
  {
    slug:        'about',
    name:        'O nas',
    description: 'Sekcja O agencji',
    icon:        'Users',
    isSingleton: true,
    fieldsSchema: [
      { id: 'f1', name: 'photo',           label: 'Zdjęcie',              type: 'image',    required: false },
      { id: 'f2', name: 'description1',    label: 'Opis – akapit 1',      type: 'textarea', required: false },
      { id: 'f3', name: 'description2',    label: 'Opis – akapit 2',      type: 'textarea', required: false },
      { id: 'f4', name: 'years_on_market', label: 'Lat na rynku',         type: 'number',   required: false },
      { id: 'f5', name: 'projects_count',  label: 'Liczba projektów (np. 150+)', type: 'text', required: false },
    ],
  },
  {
    slug:        'pricing_plan',
    name:        'Plan cenowy',
    description: 'Karta cennika',
    icon:        'DollarSign',
    isSingleton: false,
    fieldsSchema: [
      { id: 'f1', name: 'name',          label: 'Nazwa planu',                type: 'text',     required: true  },
      { id: 'f2', name: 'tagline',       label: 'Podtytuł',                   type: 'text',     required: false },
      { id: 'f3', name: 'price_onetime', label: 'Cena jednorazowa (zł)',      type: 'number',   required: false },
      { id: 'f4', name: 'price_monthly', label: 'Cena abonamentowa (zł/mies)',type: 'number',   required: false },
      { id: 'f5', name: 'is_featured',   label: 'Wyróżniony?',               type: 'boolean',  required: false },
      { id: 'f6', name: 'features',      label: 'Funkcje (po jednej w linii)',type: 'textarea', required: false },
      { id: 'f7', name: 'icon_key',      label: 'Ikona',                     type: 'select',   required: false,
        options: ['basic', 'pro', 'ecommerce'] },
      { id: 'f8', name: 'order',         label: 'Kolejność',                 type: 'number',   required: false },
    ],
  },
  {
    slug:        'contact_info',
    name:        'Dane kontaktowe',
    description: 'Email, telefon, NIP, social media',
    icon:        'Phone',
    isSingleton: true,
    fieldsSchema: [
      { id: 'f1', name: 'email',         label: 'Email',          type: 'text', required: false },
      { id: 'f2', name: 'phone',         label: 'Telefon',        type: 'text', required: false },
      { id: 'f3', name: 'nip',           label: 'NIP',            type: 'text', required: false },
      { id: 'f4', name: 'hours_text',    label: 'Godziny pracy',  type: 'text', required: false },
      { id: 'f5', name: 'facebook_url',  label: 'Facebook URL',   type: 'text', required: false },
      { id: 'f6', name: 'instagram_url', label: 'Instagram URL',  type: 'text', required: false },
      { id: 'f7', name: 'tiktok_url',    label: 'TikTok URL',     type: 'text', required: false },
      { id: 'f8', name: 'youtube_url',   label: 'YouTube URL',    type: 'text', required: false },
    ],
  },
]

// ─── Initial content ──────────────────────────────────────────────────────────

const INITIAL_CONTENT = {
  hero: {
    slug:  'main',
    title: 'Hero',
    status: 'published',
    data: {
      badge_text:         'AGENCJA INTERAKTYWNA | POLSKA',
      title_before:       'Profesjonalne',
      title_gradient:     'Strony WWW',
      title_after:        'i Marketing Cyfrowy',
      subtitle:           'Kompleksowe usługi digital dla Twojej firmy: tworzenie stron internetowych, sklepy e-commerce WooCommerce, aplikacje mobilne iOS i Android, montaż wideo oraz kampanie Google Ads, Meta Ads i TikTok Ads.',
      cta_primary_text:   'Bezpłatna wycena projektu',
      cta_secondary_text: 'Nasze realizacje',
      stat1_value: '150+', stat1_label: 'Zrealizowanych projektów',
      stat2_value: '98%',  stat2_label: 'Zadowolonych klientów',
      stat3_value: '5',    stat3_label: 'Lat na rynku',
    },
  },
  service_item: [
    { slug: 'strony-www', title: 'Tworzenie Stron Internetowych', status: 'published', data: { title: 'Tworzenie Stron Internetowych', description: 'Profesjonalne strony WWW dla firm, wizytówki, landing page. Responsywne, zoptymalizowane pod SEO.', price: 'od 800 zł', badge: '', icon_key: 'web', order: 1 } },
    { slug: 'sklepy-ecommerce', title: 'Sklepy E-commerce WooCommerce', status: 'published', data: { title: 'Sklepy E-commerce WooCommerce', description: 'Sklepy internetowe z PayU, Przelewy24, BLIK. Integracje z InPost, DPD, DHL i pełne zarządzanie.', price: 'od 3 000 zł', badge: '', icon_key: 'shop', order: 2 } },
    { slug: 'aplikacje-mobilne', title: 'Aplikacje Mobilne iOS i Android', status: 'published', data: { title: 'Aplikacje Mobilne iOS i Android', description: 'Natywne aplikacje mobilne w React Native i Flutter — od MVP po publikację w App Store i Google Play.', price: 'od 5 000 zł', badge: '', icon_key: 'app', order: 3 } },
    { slug: 'montaz-wideo', title: 'Profesjonalny Montaż Wideo', status: 'published', data: { title: 'Profesjonalny Montaż Wideo', description: 'Filmy promocyjne, reklamy, materiały YouTube. Color grading, animacje, efekty specjalne i sound design.', price: 'od 80 zł/min', badge: '', icon_key: 'video', order: 4 } },
    { slug: 'rolki-reels', title: 'Rolki & Reels', status: 'published', data: { title: 'Rolki & Reels', description: 'Viralowe treści wideo na Instagram Reels, TikTok i YouTube Shorts. Scenariusz, nagranie i montaż.', price: 'od 450 zł / 5 rolek', badge: '', icon_key: 'reels', order: 5 } },
    { slug: 'social-media', title: 'Social Media', status: 'published', data: { title: 'Social Media', description: 'Kompleksowe prowadzenie mediów społecznościowych: strategia, content, publikacja, moderacja i raportowanie.', price: 'od 1 500 zł/m-c', badge: '', icon_key: 'social', order: 6 } },
    { slug: 'serwis-it', title: 'Serwis IT', status: 'published', data: { title: 'Serwis IT', description: 'Wsparcie techniczne dla firm: konfiguracja sprzętu, serwerów, oprogramowania i sieci komputerowych.', price: 'od 50 zł/h', badge: '', icon_key: 'it', order: 7 } },
    { slug: 'kampanie-ads', title: 'Kampanie Ads', status: 'published', data: { title: 'Kampanie Ads', description: 'Google Ads, Meta Ads i TikTok Ads — skuteczne kampanie reklamowe z gwarancją mierzalnych wyników.', price: 'od 500 zł + budżet', badge: 'Popularne', icon_key: 'ads', order: 8 } },
  ],
  portfolio_item: [
    { slug: 'chicken-king-app', title: 'iOS/Android Chicken King APP', status: 'published', data: { title: 'iOS/Android Chicken King APP', category: 'Aplikacje', description: 'Aplikacja mobilna iOS i Android dla sieci restauracji. Zamówienia online, program lojalnościowy i powiadomienia push.', tags: 'Flutter, Dart, PHP', image: '/images/portfolio-chicken-king-app.webp', order: 1 } },
    { slug: 'angielski-od-podstaw', title: 'Angielski od Podstaw', status: 'published', data: { title: 'Angielski od Podstaw', category: 'Strony WWW', description: 'Strona internetowa szkoły językowej z systemem zapisów online, blogiem i bazą materiałów edukacyjnych.', tags: 'WordPress, Elementor', image: '/images/portfolio-angielski.webp', order: 2 } },
    { slug: 'raptor', title: 'Strona wizytówkowa dla sklepu RAPTOR', status: 'published', data: { title: 'Strona wizytówkowa dla sklepu RAPTOR', category: 'Strony WWW', description: 'Profesjonalna strona wizytówkowa z animacjami, formularzem kontaktowym i integracją z Google Maps.', tags: 'WordPress, Elementor, PHP, JavaScript', image: '/images/portfolio-raptor.webp', order: 3 } },
    { slug: 'chicken-king-family', title: 'Chicken King Family', status: 'published', data: { title: 'Chicken King Family', category: 'Sklepy', description: 'Sklep internetowy z menu restauracyjnym, zamówieniami online, integracją PayU i BLIK.', tags: 'WordPress, Divi, PHP, JavaScript', image: '/images/portfolio-chicken-king-family.webp', order: 4 } },
  ],
  testimonial: [
    { slug: 'piotr-wisniewski', title: 'Piotr Wiśniewski', status: 'published', data: { name: 'Piotr Wiśniewski', role: 'Właściciel', company: 'Chicken King', rating: 5, text: 'OVERMEDIA wykonała dla nas zarówno stronę internetową, sklep WooCommerce jak i aplikację mobilną. Efekty przeszły nasze oczekiwania — sprzedaż online wzrosła o 40% w ciągu pierwszego kwartału.' } },
    { slug: 'anna-kowalczyk', title: 'Anna Kowalczyk', status: 'published', data: { name: 'Anna Kowalczyk', role: 'Dyrektor', company: 'Szkoła Językowa', rating: 5, text: 'Profesjonalne podejście, terminowość i świetny kontakt przez cały projekt. Strona wygląda doskonale na każdym urządzeniu, a liczba zapisów na kursy wzrosła dwukrotnie.' } },
    { slug: 'marek-nowak', title: 'Marek Nowak', status: 'published', data: { name: 'Marek Nowak', role: 'CEO', company: 'RAPTOR Sp. z o.o.', rating: 5, text: 'Polecam OVERMEDIA każdemu, kto szuka solidnej agencji digital. Realizacja szybka, cena uczciwa, a strona wizytówkowa wygląda super profesjonalnie. Kampanie Google Ads przyniosły wymierny efekt.' } },
  ],
  about: {
    slug: 'main', title: 'O nas', status: 'published',
    data: {
      photo:            '/images/pawel.webp',
      description1:     'OVERMEDIA to polska agencja digital specjalizująca się w tworzeniu stron internetowych, sklepów e-commerce i kompleksowym marketingu cyfrowym dla firm.',
      description2:     'Oferujemy profesjonalne usługi web developmentu na WordPress, produkcję materiałów wideo, prowadzenie social media oraz kampanie reklamowe Google Ads i Meta Ads. Specjalizujemy się w obsłudze małych firm, startupów i przedsiębiorców w całej Polsce.',
      years_on_market:  5,
      projects_count:   '150+',
    },
  },
  pricing_plan: [
    { slug: 'basic', title: 'Strona Basic', status: 'published', data: { name: 'Strona Basic', tagline: 'Idealna dla małych firm i freelancerów', price_onetime: 1000, price_monthly: 800, is_featured: false, features: 'Do 5 podstron\nResponsywny design\nPodstawowe SEO\nFormularz kontaktowy\nCertyfikat SSL\nBlog\nIntegracje zewnętrzne\n1 miesiąc wsparcia', icon_key: 'basic', order: 1 } },
    { slug: 'pro', title: 'Strona Pro', status: 'published', data: { name: 'Strona Pro', tagline: 'Dla firm szukających więcej możliwości', price_onetime: 1625, price_monthly: 1300, is_featured: true, features: 'Do 15 podstron\nPremium design\nZaawansowane SEO\nBlog + CMS\nAnimacje i efekty\nGoogle Analytics\nPriorytetowe wsparcie\n6 miesięcy wsparcia', icon_key: 'pro', order: 2 } },
    { slug: 'ecommerce', title: 'Sklep E-commerce', status: 'published', data: { name: 'Sklep E-commerce', tagline: 'Zacznij sprzedawać online', price_onetime: 3750, price_monthly: 3000, is_featured: false, features: 'WooCommerce\nIntegracja płatności\nKurierzy (InPost, DHL)\nDo 100 produktów\nPanel zarządzania\nSzkolenie z obsługi\n12 miesięcy wsparcia', icon_key: 'ecommerce', order: 3 } },
  ],
  contact_info: {
    slug: 'main', title: 'Kontakt', status: 'published',
    data: {
      email:         'kontakt@overmedia.pl',
      phone:         '+48 571 501 896',
      nip:           '875-156-53-27',
      hours_text:    'Pon – Pt: 9:00 – 17:00',
      facebook_url:  'https://facebook.com/overmedia.pl',
      instagram_url: 'https://instagram.com/overmedia.pl',
      tiktok_url:    'https://tiktok.com/@overmedia.pl',
      youtube_url:   'https://youtube.com/@overmedia.pl',
    },
  },
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀  Seeding OverCMS na ${API_URL}\n`)

  const auth = await login()

  // 1. Utwórz content types
  console.log('\n📋  Tworzę content types...')
  const typeIds = {}
  for (const ct of CONTENT_TYPES) {
    const result = await apiPost('/api/content-types', ct, auth)
    if (result.alreadyExists) {
      console.log(`   ⚠️  ${ct.name} już istnieje — pomijam`)
    } else {
      typeIds[ct.slug] = result.data?.id
      console.log(`   ✅  ${ct.name}`)
    }
  }

  // 2. Utwórz content items
  console.log('\n📦  Tworzę zawartość...')
  for (const [typeSlug, content] of Object.entries(INITIAL_CONTENT)) {
    const items = Array.isArray(content) ? content : [content]
    for (const item of items) {
      const result = await apiPost(`/api/content/${typeSlug}`, item, auth)
      if (result.alreadyExists) {
        console.log(`   ⚠️  [${typeSlug}] "${item.title}" już istnieje — pomijam`)
      } else {
        console.log(`   ✅  [${typeSlug}] "${item.title}"`)
      }
    }
  }

  console.log('\n🎉  Seed zakończony! Otwórz panel admina, żeby edytować treści.\n')
}

main().catch((err) => {
  console.error('\n❌  Błąd:', err.message)
  process.exit(1)
})
