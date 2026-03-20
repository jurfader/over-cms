# OverCMS — Plan Realizacji

> **Zasada pracy:** Każdy krok oznaczamy ✅ dopiero po wspólnej weryfikacji. Nie przechodzimy do następnego kroku bez potwierdzenia.

---

## FAZA 1 — Środowisko & Fundament ✅

### 1.1 Monorepo Setup ✅
- [x] Inicjalizacja projektu: `pnpm init` + konfiguracja workspace
- [x] Instalacja i konfiguracja Turborepo
- [x] Struktura katalogów (apps/, packages/, modules/, templates/)
- [x] Bazowa konfiguracja TypeScript (`tsconfig.base.json`)
- [x] ESLint + Prettier (wspólna konfiguracja dla całego monorepo)
- [x] `.gitignore`, `.env.example`

### 1.2 Infrastruktura lokalna (dev) ✅
- [x] `docker-compose.yml` — PostgreSQL + Redis + MinIO (S3-local)
- [x] Skrypt `pnpm infra:up` startujący kontenery
- [x] Weryfikacja połączeń (PostgreSQL ✅, Redis ✅, MinIO ✅)

### 1.3 Pakiet `packages/core` ✅
- [x] Schema bazy danych (Drizzle ORM):
  - Tabela `user` + `session` + `account` + `verification` (Better Auth)
  - Tabela `content_types`, `content_items`, `content_versions`
  - Tabela `media`, `settings`, `modules`, `redirects`
  - Tabela `form_definitions`, `form_submissions`
- [x] Typy TypeScript: `FieldDefinition`, `SeoData`, `BlockStyle`, `FormFieldDef`
- [x] Seed danych testowych (`pnpm db:seed`)

---

## FAZA 2 — API (Hono.js) ✅

### 2.1 Aplikacja `apps/api` ✅
- [x] Setup Hono.js + TypeScript
- [x] Middleware: CORS, logger, error handler, rate limiter (Redis)
- [x] Middleware licencji (`licenseMiddleware`) — tryb read-only przy wygasłej licencji, 7-dniowy grace period
- [x] Połączenie z PostgreSQL (przez `@overcms/core`)
- [x] Połączenie z Redis (cache layer)
- [x] Health check endpoint `GET /health`

### 2.2 Autentykacja (Better Auth) ✅
- [x] Setup Better Auth (bcrypt password hashing)
- [x] Endpointy: login, logout, session — `/api/auth/*`
- [x] Role: `super_admin`, `admin`, `editor`, `viewer`
- [x] Middleware autoryzacji: `requireAuth`, `requireRole`

### 2.3 Endpointy Content ✅
- [x] CRUD typów treści (`/api/content-types`)
- [x] CRUD elementów treści (`/api/content/:type`) — lista, pojedynczy, tworzenie, edycja, usuwanie
- [x] `POST /api/content/:type/:id/publish` — toggle publish
- [x] `GET /api/content/:type/:id/versions` — historia wersji
- [x] `POST /api/content/:type/:id/versions/:versionId/restore` — przywracanie wersji
- [x] Auto-snapshot przy każdym PUT (tabela `content_versions`)
- [x] Walidacja danych (Zod v4)

### 2.4 Endpointy Media ✅
- [x] `POST /api/media/upload` — upload pliku (multipart)
- [x] `GET /api/media` — lista z paginacją i filtrowaniem
- [x] `DELETE /api/media/:id` — usuwanie
- [x] Optymalizacja obrazów (Sharp) — WebP konwersja
- [x] Integracja z MinIO/R2 (S3-compatible) + lokalny fallback `/uploads`

### 2.5 Endpointy SEO ✅
- [x] `GET /api/seo/:type/:slug`, `PUT /api/seo/:type/:id`
- [x] `GET /api/seo/sitemap.xml` — generowanie sitemap
- [x] `GET /api/seo/robots.txt` — generowanie robots.txt

### 2.6 Endpointy Ustawień ✅
- [x] `GET/PUT /api/settings`
- [x] `GET/PUT /api/settings/navigation/:name`

---

## FAZA 3 — Panel Admina (Next.js 15) ✅

### 3.1 Setup & Design System ✅
- [x] Next.js 15 (App Router) + TypeScript
- [x] Tailwind CSS v4 + design tokeny (@theme): primary #E91E8C, secondary #9333EA, dark bg #0A0B14
- [x] Framer Motion, TanStack Query, Zustand, React Hook Form + Zod
- [x] Glassmorphism: `.glass`, `.glass-card`, `.gradient-text`
- [x] Komponenty UI: Button, Input, Label, Badge, Card, Separator, Avatar, Tooltip, DropdownMenu, Switch, Select, Tabs, Textarea

### 3.2 Layout Panelu ✅
- [x] Sidebar (collapsible, Framer Motion, dynamic modules section)
- [x] Topbar (search, notifications, user menu)
- [x] Dashboard (stat cards, ostatnie treści, quick actions, status systemu)

### 3.3 Auth ✅
- [x] `/auth/login` — formularz logowania (email + hasło)

---

## FAZA 4 — Edytor Treści ✅

### 4.1 System Typów Treści ✅
- [x] Lista typów treści z ikonami
- [x] Kreator nowego typu treści — drag & drop pól (@dnd-kit)
  - Pola: text, textarea, richtext, blocks, number, boolean, date, image, file, relation, repeater, select, slug, color, json
- [x] Edycja istniejącego typu treści

### 4.2 Block-Based Editor ✅
- [x] 15 typów bloków: Heading, Paragraph, Image, Gallery, Button/CTA, Video, Code, Quote, Divider, HTML, Columns (zagnieżdżone), Card, Accordion/FAQ, Testimonial, CTA Section
- [x] Zagnieżdżone bloki w kolumnach (rozwiązanie przez `InnerBlockEditorCtx`)
- [x] Drag & drop bloków (@dnd-kit), duplikowanie, usuwanie
- [x] Podgląd na żywo z device switcher (mobile/tablet/desktop)
- [x] Block Style Editor (tło, padding, border radius, shadow)

### 4.3 Lista Treści ✅
- [x] Tabela z sortowaniem, filtrowaniem, paginacją
- [x] Status badges (draft, published, archived)
- [x] Szybki podgląd (QuickPreview)

### 4.4 Formularz Edycji ✅
- [x] Dynamiczne pola z content type schema
- [x] Sidebar: SEO, status, daty, autor
- [x] Historia wersji (ostatnie 50) z przywracaniem
- [x] `form.reset()` po przywróceniu wersji

---

## FAZA 5 — Media Manager ✅

- [x] Grid view z drag & drop upload (multi-file, max 50MB)
- [x] Upload obrazów z konwersją WebP (Sharp)
- [x] Integracja S3/MinIO + lokalny fallback
- [x] Filtrowanie (obrazy / pliki), wyszukiwanie po nazwie
- [x] Panel szczegółów (wymiary, rozmiar, URL, kopiowanie)
- [x] Usuwanie z potwierdzeniem
- [x] Paginacja

---

## FAZA 6 — SEO Manager ✅

- [x] SEO panel per strona/post (title, description, OG, canonical)
- [x] Sitemap.xml — automatyczny, wszystkie opublikowane treści
- [x] Robots.txt — generowany dynamicznie
- [x] Redirect manager (301/302) w panelu admina

---

## FAZA 7 — Nawigacja & Ustawienia ✅

### 7.1 Menu Builder ✅
- [x] Drag & drop budowanie menu (@dnd-kit), do 3 poziomów
- [x] Linki wewnętrzne, zewnętrzne, anchory
- [x] Wiele menu (main, footer)

### 7.2 Ustawienia Ogólne ✅
- [x] Dane firmy/serwisu (nazwa, logo, favicon, opis, kontakt)
- [x] Zarządzanie użytkownikami + role

---

## FAZA 8 — SDK Klienta (`packages/sdk`) ✅

### 8.1 Pakiet `@overcms/sdk` ✅
- [x] `createClient(config)` — inicjalizacja z URL i API key
- [x] `client.content.list(type, options)` — lista treści z paginacją
- [x] `client.content.get(type, slug)` — pojedynczy element
- [x] `client.content.slugs(type)` — lista slugów (dla SSG)
- [x] `client.navigation.get(name)` — pobranie menu
- [x] `client.settings.get(key)` — ustawienia serwisu
- [x] TypeScript typy dla wszystkich responses (`ContentItem<T>`, `ContentList<T>`)
- [x] ISR-compatible (`revalidate` option, Next.js `fetch` cache)

### 8.2 Next.js Helpers ✅
- [x] `makeStaticParams(fn)` — helper dla `generateStaticParams`
- [x] `contentMetadata(res)` — helper dla `generateMetadata`

---

## FAZA 9 — Szablon Corporate (`apps/web`) ✅

### 9.1 Setup ✅
- [x] Next.js 15 + TypeScript + Tailwind CSS v4
- [x] GSAP + ScrollTrigger (`Reveal` component)
- [x] Lenis smooth scroll (`LenisProvider`)
- [x] `@overcms/sdk` integracja, ISR revalidate: 60s
- [x] Page transitions (CSS `@keyframes page-enter`)

### 9.2 Sekcje ✅
- [x] Hero Section (video/image bg, animacja reveal)
- [x] About Section
- [x] Services Section
- [x] Portfolio Section (grid + filtr kategoriami, hover)
- [x] Testimonials Section (star rating, avatar fallback)
- [x] FAQ Section (accordion, CSS max-height transition)
- [x] Contact Section (formularz podłączony do `/api/m/forms/submit`)
- [x] Blog Preview (PostCard)
- [x] CTA Section
- [x] Header + Footer (z dynamicznym menu z CMS)

### 9.3 Block Renderer ✅
- [x] Server-side renderer dla wszystkich 15 typów bloków
- [x] `styleToCSS()` — konwersja BlockStyle → CSSProperties
- [x] Zagnieżdżone kolumny z głębokością MAX_DEPTH=4
- [x] Strony: `/blog`, `/blog/[slug]`, `/portfolio`, `/portfolio/[slug]`

---

## FAZA 10 — System Modułów ✅

### 10.1 Module API ✅
- [x] Interfejs `OverCMSModule` (`packages/module-kit`)
- [x] `defineModule()` factory function
- [x] System rejestracji modułów (registry + loader)
- [x] Moduły montowane pod `/api/m/{id}/`
- [x] Włączanie/wyłączanie modułów przez panel admina
- [x] `adminNav` — dynamiczne linki w sidebarze

### 10.2 Moduł Blog (`modules/blog`) ✅
- [x] RSS feed: `GET /api/m/blog/rss`
- [x] `adminNav` → `/content/post`
- [x] Strony web: lista postów + single post

### 10.3 Moduł Forms (`modules/forms`) ✅
- [x] Kreator formularzy GUI — drag & drop pól (@dnd-kit)
- [x] 11 typów pól: text, email, phone, number, textarea, select, radio, checkbox, heading, paragraph, divider
- [x] Walidacja pól (min/max znaków, zakres liczb)
- [x] Szerokość pól (full / half / third)
- [x] CRUD definicji formularzy: `GET/POST/PUT/DELETE /api/m/forms/definitions`
- [x] Submit: `POST /api/m/forms/submit` — zapis do DB + email powiadomienie (Resend)
- [x] Panel zgłoszeń z filtrowaniem po formularzu
- [x] Eksport zgłoszeń do CSV: `GET /api/m/forms/submissions/export`
- [ ] Antyspam (honeypot + rate limit per IP)
- [ ] Webhook po każdym zgłoszeniu

### 10.4 Moduł Portfolio (`modules/portfolio`) ✅
- [x] `adminNav` → `/content/project`
- [x] Strony web: `/portfolio` (grid z tagami) + `/portfolio/[slug]` (detail z Block Renderer)

---

## FAZA 11 — System Licencji ✅

### 11.1 License Server (`apps/license-server`) ✅
- [x] Hono.js app na porcie 3002
- [x] Schema DB: `lic_licenses`, `lic_activations`, `lic_audit`
- [x] `POST /activate` — aktywacja klucza na domenie (normalizacja URL)
- [x] `POST /validate` — walidacja (pingowana co 24h przez CMS API)
- [x] `POST /deactivate` — zwolnienie domeny
- [x] `GET /status` — aktualny status licencji dla domeny
- [x] Admin API (Bearer token `LICENSE_ADMIN_SECRET`):
  - `GET/POST /admin/licenses`, `GET /admin/licenses/:key`, `PATCH`, `DELETE`
  - `POST /admin/licenses/:key/resend-email`
  - `GET /admin/stats`
- [x] Generowanie kluczy: format `XXXX-XXXX-XXXX-XXXX` (hex, crypto-random)
- [x] Audit log wszystkich zdarzeń

### 11.2 Plany Licencyjne ✅
- [x] **Trial** — 1 domena, 14 dni
- [x] **Solo** — 1 domena, bezterminowo
- [x] **Agency** — nielimitowane domeny, bezterminowo
- [x] Automatyczne ustawienie `expiresAt` przy tworzeniu licencji

### 11.3 Integracja z CMS API ✅
- [x] `licenseMiddleware` — sprawdza licencję co 24h
- [x] 7-dniowy grace period przy braku połączenia z license server
- [x] Tryb read-only (blokowanie POST/PUT/PATCH/DELETE) po wygaśnięciu grace period
- [x] Env vars: `OVERCMS_LICENSE_KEY`, `OVERCMS_INSTALL_ID`, `LICENSE_SERVER_URL`

### 11.4 Stripe dla zakupu licencji ✅
- [x] Webhook `POST /webhooks/stripe`:
  - `checkout.session.completed` → auto-tworzy licencję + wysyła email z kluczem (Resend)
  - `customer.subscription.deleted` → zawiesza licencję
- [x] `POST /checkout/session` — tworzy Stripe Checkout Session → zwraca `{url}`

### 11.5 Portal Klienta (`apps/portal`) ✅
- [x] `apps/portal` — Next.js 15 app na porcie :3004
- [x] Strona główna `/` — landing z cennikiem (Trial / Solo / Agency)
- [x] Checkout flow: redirect → Stripe → `/checkout/success`
- [x] `GET /customer/:key` — pobiera licencję + aktywacje (autentykacja kluczem)
- [x] `/portal` — formularz wyszukiwania po kluczu licencji
- [x] `/portal/[key]` — panel: plan, status, aktywacje, deaktywacja per instalacja
- [x] `POST /customer/:key/deactivate` — self-service deaktywacja instalacji

---

## FAZA 12 — Moduły Płatności _(zaplanowane na później)_

> Każdy operator płatności jako osobny moduł — taka sama architektura jak `modules/forms`, `modules/blog` itd.
> **Decyzja: implementujemy po stabilizacji core — wymagają dopracowania UX i integracji z e-commerce.**

### 12.1 Moduł Stripe (`modules/payments-stripe`) ⏳
### 12.2 Moduł Autopay (`modules/payments-autopay`) ⏳
### 12.3 Moduł Przelewy24 (`modules/payments-p24`) ⏳

---

## FAZA 13 — Deployment & DevOps

### 13.1 Docker ✅
- [x] `apps/api/Dockerfile` — multi-stage build (deps → builder → runner)
- [x] `apps/admin/Dockerfile` — Next.js standalone output
- [x] `apps/license-server/Dockerfile` — multi-stage build
- [x] `docker-compose.prod.yml` — Traefik + Let's Encrypt + wszystkie serwisy
- [x] `.dockerignore` — wykluczone node_modules, .env, .next, dist
- [x] `.env.example` uzupełniony o zmienne produkcyjne (domeny, ACME, hasła)
- [x] `next.config.ts` admin: `output: 'standalone'`

### 13.2 CloudPanel Setup
- [ ] Konfiguracja domen: `api.overcms.pl`, `admin.overcms.pl`, `license.overcms.pl`
- [ ] SSL — Let's Encrypt przez Traefik (ACME TLS Challenge, automatyczne odnawianie)
- [ ] Serwer docelowy: Ubuntu 22.04 + Docker (skrypt `scripts/server-setup.sh`)
- [ ] Automatyczne backupy DB: `scripts/backup-db.sh` (cron 2:00 AM, retencja 14 dni)

### 13.3 CI/CD ✅
- [x] `.github/workflows/ci.yml` — typecheck + lint + build przy PR i push
- [x] `.github/workflows/deploy.yml` — build obrazów → GHCR → SSH deploy → health check
- [x] Rolling restart (zero-downtime per serwis)
- [x] Docker layer caching (GitHub Actions cache)

### 13.4 Monitoring
- [ ] Uptime monitoring (UptimeRobot / Better Uptime)
- [ ] Logi strukturalne + rotacja (skonfigurowana w daemon.json — max 10MB × 5 plików)

---

## FAZA 14 — Premium Moduły (V2)

### 14.1 E-commerce (`modules/ecommerce`) ⏳ _(zaplanowane na później — wymaga modułów płatności)_
- [ ] Content types: Product, Category, Order, Customer
- [ ] Koszyk (localStorage + backend sync)
- [ ] Checkout z modułami płatności (Stripe / Autopay / P24)
- [ ] Panel zamówień w adminie, stany, emaile transakcyjne
- [ ] Warianty produktów, stany magazynowe
- [ ] Faktury PDF

### 14.2 Multilingual (`modules/multilang`)
- [ ] Wiele języków per instalacja
- [ ] Tłumaczenia treści w panelu
- [ ] URL: `/pl/`, `/en/` lub subdomeny
- [ ] hreflang w SEO, fallback do domyślnego języka

### 14.3 Analytics (`modules/analytics`)
- [ ] Self-hosted (Plausible lub własny)
- [ ] Dashboard w panelu admina
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

*Ostatnia aktualizacja: 2026-03-20 — Fazy 12 + 14.1 odłożone na V2; Faza 13 Docker + CI/CD done; Faza 11.5 Portal Klienta done; audyt kodu done*
