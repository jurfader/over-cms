# OverCMS — Plan Realizacji

> **Zasada pracy:** Każdy krok oznaczamy ✅ dopiero po wspólnej weryfikacji. Nie przechodzimy do następnego kroku bez potwierdzenia.

---

## FAZA 1 — Środowisko & Fundament

### 1.1 Monorepo Setup ✅
- [x] Inicjalizacja projektu: `pnpm init` + konfiguracja workspace
- [x] Instalacja i konfiguracja Turborepo
- [x] Struktura katalogów (apps/, packages/, modules/, templates/)
- [x] Bazowa konfiguracja TypeScript (`tsconfig.base.json`)
- [x] ESLint + Prettier (wspólna konfiguracja dla całego monorepo)
- [x] `.gitignore`, `.env.example`
- [ ] Git init + pierwszy commit

### 1.2 Infrastruktura lokalna (dev) ✅
- [x] `docker-compose.yml` — PostgreSQL + Redis + MinIO (S3-local)
- [x] Skrypt `pnpm infra:up` startujący kontenery
- [x] Weryfikacja połączeń (PostgreSQL ✅, Redis ✅, MinIO ✅)

### 1.3 Pakiet `packages/core` ✅
- [x] Schema bazy danych (Drizzle ORM):
  - Tabela `user` + `session` + `account` + `verification` (Better Auth compatible)
  - Tabela `content_types` (slug, name, icon, fields_schema, is_singleton)
  - Tabela `content_items` (type_id, slug, title, data, status, seo, author_id)
  - Tabela `media` (filename, url, size, mime_type, width, height, alt, folder)
  - Tabela `settings` (key, value)
  - Tabela `modules` (id/slug, version, active, config)
  - Tabela `redirects` (from_path, to_path, status_code)
- [x] Migracje bazy danych (`drizzle-kit push`) — 10 tabel w PostgreSQL
- [x] Typy TypeScript: FieldDefinition, SeoData
- [x] Seed danych testowych (`pnpm db:seed`)

---

## FAZA 2 — API (Hono.js)

### 2.1 Aplikacja `apps/api` ✅
- [x] Setup Hono.js + TypeScript
- [x] Middleware: CORS, logger, error handler, rate limiter (Redis)
- [x] Połączenie z PostgreSQL (przez `@overcms/core`)
- [x] Połączenie z Redis (cache layer)
- [x] Health check endpoint `GET /health`
- [x] Struktura routerów

### 2.2 Autentykacja (Better Auth) ✅
- [x] Setup Better Auth w API (bcrypt password hashing)
- [x] Endpointy: login, logout, session — `/api/auth/*`
- [x] Role: `super_admin`, `admin`, `editor`, `viewer`
- [x] Middleware autoryzacji: `requireAuth`, `requireRole`
- [x] Testy: login ✅, cookie session ✅, /me ✅, unauthorized ✅

### 2.3 Endpointy Content ✅
- [x] `GET /api/content-types` — lista typów treści
- [x] `POST /api/content-types` — tworzenie (admin+)
- [x] `GET /api/content/:type` — lista z paginacją, filtrowaniem, sortowaniem
- [x] `GET /api/content/:type/:slug` — pojedynczy element z autorem
- [x] `POST /api/content/:type` — tworzenie (auth)
- [x] `PUT /api/content/:type/:id` — edycja (auth)
- [x] `DELETE /api/content/:type/:id` — usuwanie (auth)
- [x] `POST /api/content/:type/:id/publish` — toggle publish (auth)
- [x] Walidacja danych (Zod v4)

### 2.4 Endpointy Media
- [ ] `POST /api/media/upload` — upload pliku
- [ ] `GET /api/media` — lista plików
- [ ] `DELETE /api/media/:id` — usuwanie
- [ ] Optymalizacja obrazów (Sharp) — WebP/AVIF konwersja
- [ ] Integracja z MinIO/R2 (S3-compatible)
> ⏭ Faza 5 — Media Manager

### 2.5 Endpointy SEO ✅
- [x] `GET /api/seo/:type/:slug` — dane SEO dla strony
- [x] `GET /api/seo/sitemap.xml` — generowanie sitemap.xml
- [x] `GET /api/seo/robots.txt` — generowanie robots.txt
- [x] `PUT /api/seo/:type/:id` — aktualizacja danych SEO

### 2.6 Endpointy Ustawień ✅
- [x] `GET /api/settings` — wszystkie ustawienia CMS
- [x] `PUT /api/settings` — aktualizacja ustawień (admin+)
- [x] `GET /api/settings/navigation/:name` — menu nawigacyjne
- [x] `PUT /api/settings/navigation/:name` — edycja menu (admin+)

---

## FAZA 3 — Panel Admina (Next.js 15)

### 3.1 Setup `apps/admin` ✅
- [x] Next.js 15 (App Router) + TypeScript
- [x] Tailwind CSS v4 + globals.css z design tokenami (@theme)
- [x] Framer Motion (animacje sidebar, fade-in, stagger)
- [x] TanStack Query (data fetching + cache)
- [x] Zustand (auth state z persist)
- [x] React Hook Form + Zod
- [x] Lucide React (ikony SVG)
- [x] Design System: kolory primary #E91E8C + secondary #9333EA + dark bg #0A0B14
- [x] Glassmorphism: .glass, .glass-card, .gradient-text utilities

### 3.2 Design System ✅
- [x] CSS variables (@theme) — kolory, radius, shadows, sidebar dimensions
- [x] Button (warianty: default gradient, outline, ghost, destructive, link)
- [x] Input, Label, Badge, Card, Separator, Avatar, Tooltip, DropdownMenu
- [x] lib/utils.ts (cn, formatBytes, formatDate, slugify)
- [x] lib/api.ts (typesafe fetch wrapper z credentials:include)
- [x] store/auth.ts (Zustand z persist)
- [x] providers/query-provider.tsx

### 3.3 Layout Panelu ✅
- [x] Sidebar (collapsible z Framer Motion, pink active states, Lucide icons)
- [x] Topbar (search, notifications, user menu z dropdown)
- [x] Dashboard layout (dynamic padding based on sidebar state)
- [x] hooks/use-auth.ts (TanStack Query + Zustand sync, auto redirect)

### 3.4 Auth Pages ✅
- [x] `/auth/login` — formularz logowania (email + hasło, walidacja Zod)
- [x] Animacje Framer Motion (fade-in card, error shake)
- [x] Password toggle (eye/eye-off)
- [ ] `/forgot-password` — reset hasła (przyszła faza)
- [ ] Middleware Next.js (redirect niezalogowanych)

### 3.5 Dashboard ✅
- [x] Statystyki: liczba typów treści, wpisów, mediów, użytkowników (stat cards)
- [x] Ostatnio edytowane treści (lista z badge statusu)
- [x] Quick actions (linki do głównych sekcji)
- [x] Status systemu (API, DB, Storage, Cache — z kolorowymi wskaźnikami)
- [x] Animacje Framer Motion (stagger container/item)
- [x] Build: ✅ (`next build` czyste, 0 TypeScript errors)

---

## FAZA 4 — Edytor Treści

### 4.1 System Typów Treści
- [ ] Strona "Content Types" — lista typów z ikonami
- [ ] Kreator nowego typu treści (drag & drop pól):
  - Pola: Text, Textarea, Rich Text, Number, Boolean
  - Pola: Date, Image, File, Relation, Repeater, Select
  - Pola: Slug (auto-generate), Color, JSON
- [ ] Walidacja pól w kreatorze
- [ ] Edycja istniejącego typu

### 4.2 Block-Based Editor
- [ ] Architektura bloków (każdy blok = React component + schema)
- [ ] Bloki bazowe:
  - Heading (H1-H6)
  - Paragraph (Rich Text)
  - Image (z alt, caption, lazy load)
  - Gallery
  - Button / CTA
  - Video (embed + upload)
  - Code Block
  - Quote
  - Divider
  - HTML (raw)
  - Columns (2/3 kolumny)
  - Card
  - Accordion / FAQ
  - Testimonial
  - Call-to-Action Section
- [ ] Drag & drop bloków
- [ ] Duplikowanie, usuwanie, przesuwanie bloków
- [ ] Podgląd na żywo (preview URL)

### 4.3 Lista Treści
- [ ] Tabela z sortowaniem, filtrowaniem, paginacją
- [ ] Bulk actions (publish, delete, archive)
- [ ] Status badges (draft, published, scheduled, archived)
- [ ] Szybki podgląd bez wychodzenia z listy

### 4.4 Formularz Edycji
- [ ] Dynamiczne pola z content type schema
- [ ] Sidebar: SEO, status, daty, autor
- [ ] Auto-save (draft co 30s)
- [ ] Historia wersji (ostatnie 10)
- [ ] Scheduled publish

---

## FAZA 5 — Media Manager

- [ ] Grid view / list view
- [ ] Upload (drag & drop, multi-file)
- [ ] Automatyczna konwersja do WebP/AVIF
- [ ] Automatyczne generowanie thumbnails (S, M, L, XL)
- [ ] Tagi i foldery
- [ ] Wyszukiwanie po nazwie / alt
- [ ] Edycja alt text, caption
- [ ] Kopiowanie URL do schowka

---

## FAZA 6 — SEO Manager

- [ ] SEO panel per strona/post (title, description, canonical, robots)
- [ ] Open Graph (title, description, image)
- [ ] Twitter/X Cards
- [ ] Schema.org JSON-LD (Article, WebPage, Organization, BreadcrumbList, FAQ)
- [ ] Globalne ustawienia SEO (site name, default og:image)
- [ ] Sitemap: automatyczny, configurowalny (include/exclude per typ)
- [ ] Robots.txt: edytor w panelu
- [ ] Redirect manager (301, 302)
- [ ] SEO score preview (jak Yoast, ale własny)

---

## FAZA 7 — Nawigacja & Ustawienia

### 7.1 Menu Builder
- [ ] Drag & drop budowanie menu (do 3 poziomów zagnieżdżenia)
- [ ] Linki do content items, URL zewnętrzne, anchory
- [ ] Wiele menu (main, footer, mobile)

### 7.2 Ustawienia Ogólne
- [ ] Dane firmy/serwisu (nazwa, logo, favicon, opis)
- [ ] Ustawienia mail (SMTP lub Resend API)
- [ ] Ustawienia API keys (zewnętrzne serwisy)
- [ ] Zarządzanie użytkownikami + role
- [ ] Logi aktywności

---

## FAZA 8 — SDK Klienta (`packages/sdk`)

### 8.1 Pakiet `@overcms/sdk`
- [ ] `createClient(config)` — inicjalizacja z URL i API key
- [ ] `client.content.getAll(type, options)` — lista treści
- [ ] `client.content.getOne(type, slug)` — pojedynczy element
- [ ] `client.media.getUrl(id, options)` — URL obrazu z transformacjami
- [ ] `client.navigation.get(name)` — pobranie menu
- [ ] `client.settings.get()` — ustawienia serwisu
- [ ] `client.seo.get(type, slug)` — dane SEO
- [ ] TypeScript typy dla wszystkich responses
- [ ] Cache layer (SWR/TanStack Query compatible)

### 8.2 Next.js Helpers
- [ ] `generateStaticParams` helpers
- [ ] `generateMetadata` helper (auto z SEO fields)
- [ ] ISR revalidation handler (webhook trigger)
- [ ] Image component wrapper (z next/image + R2 CDN)

---

## FAZA 9 — Pierwszy Szablon: Corporate (`templates/corporate`)

### 9.1 Setup
- [ ] Next.js 15 + TypeScript
- [ ] Tailwind CSS v4
- [ ] GSAP + ScrollTrigger
- [ ] Framer Motion (dla komponentów React)
- [ ] `@overcms/sdk` integracja
- [ ] Konfiguracja ISR

### 9.2 Sekcje (bloki widoku)
- [ ] Hero Section (video bg / image bg, animacja reveal)
- [ ] About Section (liczniki animowane, tekst + image)
- [ ] Services Section (karty z hover animacjami)
- [ ] Portfolio/Realizacje Section (grid + filtr + lightbox)
- [ ] Testimonials Section (slider/karuzela)
- [ ] Team Section
- [ ] FAQ Section (accordion)
- [ ] Contact Section (formularz + mapa)
- [ ] Blog Preview Section
- [ ] CTA Section
- [ ] Footer (mega footer)

### 9.3 Animacje GSAP
- [ ] ScrollTrigger: reveal tekstu linia po linii
- [ ] ScrollTrigger: fade-in + slide-up elementów
- [ ] ScrollTrigger: parallax na hero
- [ ] Animowane liczniki (countUp)
- [ ] Smooth scroll (Lenis)
- [ ] Cursor custom (opcjonalny)
- [ ] Page transitions

### 9.4 Performance
- [ ] Lighthouse score ≥ 95 na wszystkich kategoriach
- [ ] GSAP ładowany lazy (tylko gdy sekcja widoczna)
- [ ] Czcionki: variable fonts, `font-display: swap`
- [ ] Krytyczny CSS inline
- [ ] Preload kluczowych zasobów

---

## FAZA 10 — System Modułów

### 10.1 Module API
- [ ] Specyfikacja interfejsu `OverCMSModule`
- [ ] System rejestracji modułów (registry)
- [ ] Moduły instalowane przez panel admina
- [ ] Hook system (eventy CMS)
- [ ] Dokumentacja tworzenia własnych modułów

### 10.2 Moduł Blog (`modules/@overcms/blog`)
- [ ] Content types: Post, Category, Tag, Author
- [ ] Bloki edytora: PostList, FeaturedPost, RelatedPosts
- [ ] API: feed RSS, paginacja, filtrowanie
- [ ] Widoki szablonu: lista postów, single post, archiwum, kategorie
- [ ] Komentarze (opcjonalne)

### 10.3 Moduł Forms (`modules/@overcms/forms`)
- [ ] Kreator formularzy (drag & drop pól)
- [ ] Typy pól: text, email, phone, select, checkbox, file, textarea
- [ ] Walidacja (wymagane, regex, min/max)
- [ ] Akcje: zapis do DB, wysyłka email, webhook
- [ ] Antyspam (honeypot + rate limit)
- [ ] Panel z przesłanymi formularzami
- [ ] Eksport do CSV

### 10.4 Moduł Portfolio (`modules/@overcms/portfolio`)
- [ ] Content types: Project, Category, Tag
- [ ] Galeria projektów z filtrowaniem
- [ ] Single project: opis, galeria, technologie, link
- [ ] Bloki: ProjectGrid, ProjectFeatured, ProjectCarousel

---

## FAZA 11 — System Licencji

### 11.1 License Server (`apps/license-server`)
- [ ] Setup Hono.js na własnym serwerze
- [ ] Baza danych licencji:
  - Tabela `licenses` (key, plan, buyer_email, max_installations, expires_at)
  - Tabela `activations` (license_id, domain, installation_id, activated_at)
- [ ] Endpoint `POST /activate` — aktywacja na domenie
- [ ] Endpoint `POST /validate` — sprawdzenie ważności (pingowany co 24h)
- [ ] Endpoint `POST /deactivate` — zwolnienie instalacji
- [ ] Grace period 7 dni przy braku internetu (timestamp w local DB)
- [ ] Tryb read-only przy nieważnej licencji (API działa, panel admina zablokowany)

### 11.2 Plany Licencyjne
- [ ] **Solo** — 1 instalacja, wszystkie core moduły
- [ ] **Agency** — nielimitowane instalacje, wszystkie core moduły
- [ ] **Module Add-ons** — premium moduły sprzedawane osobno
- [ ] Trial 14 dni bez limitu funkcji

### 11.3 Stripe Integration
- [ ] Produkty i ceny w Stripe Dashboard
- [ ] Checkout flow: wybór planu → Stripe → generowanie klucza → email
- [ ] Webhooks: payment_succeeded, subscription_cancelled, refund
- [ ] Automatyczne wysyłanie klucza emailem (Resend)
- [ ] Odnowienie rocznej subskrypcji

### 11.4 Portal Klienta
- [ ] Strona zakupu licencji (landing)
- [ ] Panel klienta: licencje, instalacje, faktury
- [ ] Deaktywacja instalacji przez klienta
- [ ] Historia płatności

---

## FAZA 12 — Deployment & DevOps

### 12.1 Docker
- [ ] `Dockerfile` dla API (Hono.js)
- [ ] `Dockerfile` dla Admin (Next.js)
- [ ] `Dockerfile` dla License Server
- [ ] `docker-compose.prod.yml`
- [ ] `.env` management (production)

### 12.2 CloudPanel Setup
- [ ] Konfiguracja domen (api.overcms.pl, admin.overcms.pl, license.overcms.pl)
- [ ] SSL (Let's Encrypt)
- [ ] Nginx reverse proxy → Docker containers
- [ ] PostgreSQL setup na serwerze
- [ ] Redis setup na serwerze
- [ ] Automatyczne backupy DB

### 12.3 CI/CD
- [ ] GitHub Actions: testy + build + deploy przy push do main
- [ ] Staging environment
- [ ] Health checks po deploymencie

### 12.4 Monitoring
- [ ] Uptime monitoring (UptimeRobot lub własny)
- [ ] Error tracking (Sentry — self-hosted lub cloud)
- [ ] Logi (strukturalne, rotacja)

---

## FAZA 13 — Premium Moduły (V2)

### 13.1 E-commerce (`modules/@overcms/ecommerce`)
- [ ] Content types: Product, Category, Order, Customer
- [ ] Koszyk (localStorage + backend sync)
- [ ] Checkout + Stripe Payments
- [ ] Panel zamówień w adminie
- [ ] Stany zamówień, emaile transakcyjne
- [ ] Warianty produktów (rozmiar, kolor)
- [ ] Stany magazynowe
- [ ] Faktury PDF

### 13.2 Multilingual (`modules/@overcms/multilang`)
- [ ] Wiele języków per instalacja
- [ ] Tłumaczenia treści w panelu (obok siebie)
- [ ] URL struktura: `/pl/`, `/en/`, lub domeny
- [ ] hreflang w SEO
- [ ] Fallback do domyślnego języka

### 13.3 Analytics (`modules/@overcms/analytics`)
- [ ] Self-hosted (Plausible lub własny)
- [ ] Dashboard w panelu admina
- [ ] Top strony, źródła ruchu, urządzenia
- [ ] Bez cookies (GDPR compliant)

---

## Legenda statusów

| Symbol | Znaczenie |
|--------|-----------|
| [ ] | Do zrobienia |
| [~] | W trakcie |
| [x] | Zrobione (do weryfikacji) |
| ✅ | Zweryfikowane i zatwierdzone |

---

*Ostatnia aktualizacja: 2026-03-19*
