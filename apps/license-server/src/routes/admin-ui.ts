import { Hono } from 'hono'
import type { Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { eq, desc, sql, and } from 'drizzle-orm'
import { db, licenses, activations, licAudit } from '../db/index.js'
import { licenseBundles, plugins } from '../db/schema.js'
import { generateLicenseKey } from '../utils/license-key.js'
import { OVERCRM_BUNDLES, isKnownBundle } from '../utils/bundles.js'
import { ADMIN_COOKIE, sessionToken, safeEqual } from '../utils/admin-auth.js'

/**
 * Panel administratora serwera licencji.
 *
 * Wbudowany w sam serwer, a nie osobna aplikacja: to narzędzie wewnętrzne dla
 * jednej osoby, więc dodatkowy proces, build i wdrożenie kosztowałyby więcej
 * niż dają. Działa wszędzie tam, gdzie działa API.
 *
 * Renderowanie po stronie serwera, zero JavaScriptu i zero zasobów z zewnątrz —
 * panel ma działać także wtedy, gdy coś dookoła jest zepsute.
 */
export const adminUiRouter = new Hono()

const ADMIN_SECRET = process.env['LICENSE_ADMIN_SECRET'] ?? ''

// ─── Pomocnicze ───────────────────────────────────────────────────────────────

/** Ucieczka HTML. Wszystko, co pochodzi z bazy, przechodzi przez to. */
function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function dat(v: Date | string | null | undefined): string {
  if (!v) return '—'
  const d = new Date(v)

  return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)}`
}

const STYL = `
:root{--tlo:#0f1115;--karta:#171a21;--obwod:#252a34;--tekst:#e6e8ec;--slaby:#9aa1ad;
--akcent:#4f8cff;--ok:#31c48d;--zle:#f05252;--ostrzez:#e3a008}
*{box-sizing:border-box}
body{margin:0;background:var(--tlo);color:var(--tekst);
font:14px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
a{color:var(--akcent);text-decoration:none}a:hover{text-decoration:underline}
header{background:var(--karta);border-bottom:1px solid var(--obwod);padding:14px 22px;
display:flex;align-items:center;gap:22px;flex-wrap:wrap}
header h1{font-size:15px;margin:0;font-weight:600;letter-spacing:.02em}
header nav{display:flex;gap:16px;margin-left:auto;align-items:center}
main{max-width:1180px;margin:26px auto;padding:0 22px}
.karta{background:var(--karta);border:1px solid var(--obwod);border-radius:10px;
padding:18px;margin-bottom:20px}
.karta h2{margin:0 0 14px;font-size:14px;font-weight:600;color:var(--slaby);
text-transform:uppercase;letter-spacing:.06em}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;padding:9px 10px;border-bottom:1px solid var(--obwod);vertical-align:top}
th{color:var(--slaby);font-weight:500;font-size:12px;text-transform:uppercase;letter-spacing:.04em}
tr:last-child td{border-bottom:none}
code,.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px}
.znacznik{display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;
font-weight:600;letter-spacing:.03em}
.z-ok{background:rgba(49,196,141,.15);color:var(--ok)}
.z-zle{background:rgba(240,82,82,.15);color:var(--zle)}
.z-szary{background:rgba(154,161,173,.15);color:var(--slaby)}
.z-ostrzez{background:rgba(227,160,8,.15);color:var(--ostrzez)}
input,select,textarea{background:var(--tlo);color:var(--tekst);border:1px solid var(--obwod);
border-radius:7px;padding:8px 10px;font:inherit;min-width:170px}
button{background:var(--akcent);color:#fff;border:0;border-radius:7px;padding:8px 15px;
font:inherit;font-weight:600;cursor:pointer}
button:hover{filter:brightness(1.1)}
button.cichy{background:transparent;color:var(--zle);border:1px solid var(--obwod);font-weight:500}
form.rzad{display:flex;gap:9px;flex-wrap:wrap;align-items:center}
.pusto{color:var(--slaby);padding:14px 0;font-style:italic}
.uwaga{background:rgba(227,160,8,.1);border:1px solid rgba(227,160,8,.3);
border-radius:8px;padding:11px 14px;margin-bottom:18px;color:var(--ostrzez)}
.logowanie{max-width:340px;margin:14vh auto}
`

function layout(tytul: string, tresc: string, zalogowany = true): string {
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(tytul)} — Licencje OVERMEDIA</title><style>${STYL}</style></head><body>
${zalogowany ? `<header>
  <h1>Licencje OVERMEDIA</h1>
  <nav>
    <a href="/admin/ui">Licencje</a>
    <a href="/admin/ui/moduly">Moduły</a>
    <form method="post" action="/admin/ui/logout" style="margin:0">
      <button class="cichy">Wyloguj</button>
    </form>
  </nav>
</header>` : ''}
<main>${tresc}</main></body></html>`
}

// ─── Logowanie ────────────────────────────────────────────────────────────────

function zalogowany(c: Context): boolean {
  if (!ADMIN_SECRET) return false
  const ciastko = getCookie(c, ADMIN_COOKIE)

  return !!ciastko && safeEqual(ciastko, sessionToken(ADMIN_SECRET))
}

adminUiRouter.get('/login', (c) => {
  const blad = c.req.query('blad')

  return c.html(layout('Logowanie', `
<div class="logowanie"><div class="karta">
  <h2>Panel licencji</h2>
  ${blad ? '<div class="uwaga">Nieprawidłowy sekret.</div>' : ''}
  <form method="post" action="/admin/ui/login">
    <p><input type="password" name="secret" placeholder="LICENSE_ADMIN_SECRET"
       autofocus style="width:100%"></p>
    <button style="width:100%">Zaloguj</button>
  </form>
</div></div>`, false))
})

adminUiRouter.post('/login', async (c) => {
  const form = await c.req.parseBody()
  const podany = String(form['secret'] ?? '')

  if (!ADMIN_SECRET || !safeEqual(podany, ADMIN_SECRET)) {
    return c.redirect('/admin/ui/login?blad=1')
  }

  setCookie(c, ADMIN_COOKIE, sessionToken(ADMIN_SECRET), {
    httpOnly: true,
    // Ruch idzie przez Cloudflare po HTTPS. `secure` wyłączamy tylko poza
    // produkcją, żeby dało się testować lokalnie po http.
    secure:   process.env['NODE_ENV'] === 'production',
    // Strict, więc formularz wysłany z obcej strony nie dołączy ciasteczka —
    // to zarazem zabezpieczenie przed CSRF na akcjach zmieniających stan.
    sameSite: 'Strict',
    path:     '/admin',
    maxAge:   60 * 60 * 12,
  })

  return c.redirect('/admin/ui')
})

adminUiRouter.post('/logout', (c) => {
  deleteCookie(c, ADMIN_COOKIE, { path: '/admin' })

  return c.redirect('/admin/ui/login')
})

// Wszystko poniżej wymaga zalogowania.
adminUiRouter.use('*', async (c, next) => {
  if (c.req.path.endsWith('/login') || c.req.path.endsWith('/logout')) return next()
  if (!zalogowany(c)) return c.redirect('/admin/ui/login')

  await next()
})

// ─── Lista licencji ───────────────────────────────────────────────────────────

adminUiRouter.get('/', async (c) => {
  const filtr = c.req.query('product')
  const wybor = filtr === 'overcms' || filtr === 'overcrm' ? filtr : null

  const kolumny = {
    key:         licenses.key,
    product:     licenses.product,
    plan:        licenses.plan,
    status:      licenses.status,
    buyerEmail:  licenses.buyerEmail,
    buyerName:   licenses.buyerName,
    expiresAt:   licenses.expiresAt,
    createdAt:   licenses.createdAt,
    activeCount: sql<number>`(SELECT COUNT(*) FROM lic_activations a
                              WHERE a.license_id = ${licenses.id} AND a.active = true)`,
    bundleCount: sql<number>`(SELECT COUNT(*) FROM lic_license_bundles b
                              WHERE b.license_id = ${licenses.id}
                                AND (b.expires_at IS NULL OR b.expires_at > now()))`,
  }

  const wiersze = wybor
    ? await db.select(kolumny).from(licenses).where(eq(licenses.product, wybor)).orderBy(desc(licenses.createdAt))
    : await db.select(kolumny).from(licenses).orderBy(desc(licenses.createdAt))

  const znacznikStatusu = (s: string) =>
    `<span class="znacznik ${s === 'active' ? 'z-ok' : s === 'revoked' || s === 'expired' ? 'z-zle' : 'z-ostrzez'}">${esc(s)}</span>`

  const wiersz = (l: typeof wiersze[number]) => `<tr>
    <td><a href="/admin/ui/licencje/${encodeURIComponent(l.key)}" class="mono">${esc(l.key)}</a></td>
    <td><span class="znacznik z-szary">${esc(l.product)}</span></td>
    <td>${esc(l.plan)}</td>
    <td>${znacznikStatusu(l.status)}</td>
    <td>${esc(l.buyerName || l.buyerEmail)}</td>
    <td>${l.activeCount}</td>
    <td>${l.product === 'overcrm' ? (Number(l.bundleCount) || '—') : '—'}</td>
    <td>${l.expiresAt ? dat(l.expiresAt) : 'bezterminowo'}</td>
  </tr>`

  return c.html(layout('Licencje', `
<div class="karta">
  <h2>Licencje ${wybor ? `— ${esc(wybor)}` : ''}</h2>
  <p style="margin-top:-6px">
    <a href="/admin/ui">wszystkie</a> ·
    <a href="/admin/ui?product=overcrm">OVERCRM</a> ·
    <a href="/admin/ui?product=overcms">OVERCMS</a>
  </p>
  ${wiersze.length === 0 ? '<div class="pusto">Brak licencji.</div>' : `<table>
    <tr><th>Klucz</th><th>Produkt</th><th>Plan</th><th>Status</th><th>Nabywca</th>
        <th>Instalacje</th><th>Pakiety</th><th>Wygasa</th></tr>
    ${wiersze.map(wiersz).join('')}
  </table>`}
</div>

<div class="karta">
  <h2>Nowa licencja</h2>
  <form method="post" action="/admin/ui/licencje" class="rzad">
    <select name="product"><option value="overcrm">OVERCRM</option><option value="overcms">OVERCMS</option></select>
    <select name="plan"><option value="agency">agency</option><option value="solo">solo</option><option value="trial">trial</option></select>
    <input type="email" name="buyerEmail" placeholder="e-mail nabywcy" required>
    <input type="text" name="buyerName" placeholder="nazwa (opcjonalnie)">
    <button>Utwórz</button>
  </form>
</div>`))
})

// ─── Szczegóły licencji ───────────────────────────────────────────────────────

adminUiRouter.get('/licencje/:key', async (c) => {
  const klucz = c.req.param('key')

  const [lic] = await db.select().from(licenses).where(eq(licenses.key, klucz)).limit(1)
  if (!lic) return c.html(layout('Nie znaleziono', '<div class="karta">Nie ma takiej licencji.</div>'), 404)

  const [akt, pak, dziennik] = await Promise.all([
    db.select().from(activations).where(eq(activations.licenseId, lic.id)).orderBy(desc(activations.lastSeenAt)),
    db.select().from(licenseBundles).where(eq(licenseBundles.licenseId, lic.id)).orderBy(licenseBundles.bundle),
    db.select().from(licAudit).where(eq(licAudit.licenseId, lic.id)).orderBy(desc(licAudit.createdAt)).limit(25),
  ])

  const teraz = Date.now()
  const aktywny = (p: typeof pak[number]) => !p.expiresAt || new Date(p.expiresAt).getTime() > teraz
  const posiadane = new Set(pak.filter(aktywny).map((p) => p.bundle))
  const wolne = Object.entries(OVERCRM_BUNDLES).filter(([id]) => !posiadane.has(id))

  const sekcjaPakietow = lic.product !== 'overcrm'
    ? `<div class="karta"><h2>Pakiety</h2>
         <div class="pusto">Pakiety dotyczą wyłącznie licencji OVERCRM.</div></div>`
    : `<div class="karta">
    <h2>Pakiety</h2>
    ${pak.length === 0 ? '<div class="pusto">Brak nadanych pakietów — klient ma tylko licencję podstawową.</div>' : `<table>
      <tr><th>Pakiet</th><th>Stan</th><th>Źródło</th><th>Nadany</th><th>Wygasa</th><th></th></tr>
      ${pak.map((p) => `<tr>
        <td>${esc(OVERCRM_BUNDLES[p.bundle] ?? p.bundle)}<br><span class="mono" style="color:var(--slaby);font-size:12px">${esc(p.bundle)}</span></td>
        <td>${aktywny(p) ? '<span class="znacznik z-ok">aktywny</span>' : '<span class="znacznik z-zle">wygasł</span>'}</td>
        <td>${esc(p.source)}</td>
        <td>${dat(p.grantedAt)}</td>
        <td>${p.expiresAt ? dat(p.expiresAt) : 'bezterminowo'}</td>
        <td><form method="post" action="/admin/ui/licencje/${encodeURIComponent(klucz)}/pakiety/${encodeURIComponent(p.bundle)}/odbierz" style="margin:0">
          <button class="cichy">Odbierz</button></form></td>
      </tr>`).join('')}
    </table>`}

    ${wolne.length === 0 ? '' : `<form method="post" action="/admin/ui/licencje/${encodeURIComponent(klucz)}/pakiety" class="rzad" style="margin-top:15px">
      <select name="bundle">${wolne.map(([id, etykieta]) => `<option value="${esc(id)}">${esc(etykieta)}</option>`).join('')}</select>
      <select name="source"><option value="manual">ręcznie</option><option value="trial">trial</option><option value="stripe">Stripe</option></select>
      <input type="date" name="expiresAt" title="Puste = bezterminowo">
      <input type="text" name="notes" placeholder="notatka (opcjonalnie)">
      <button>Nadaj pakiet</button>
    </form>`}

    <p style="color:var(--slaby);margin-bottom:0;margin-top:14px">
      CRM klienta zobaczy zmianę przy najbliższej walidacji, czyli w ciągu 24 godzin.
      Natychmiast — gdy klient kliknie „Odśwież licencję” w panelu.
    </p>
  </div>`

  return c.html(layout(`Licencja ${klucz}`, `
<p><a href="/admin/ui">← wszystkie licencje</a></p>

<div class="karta">
  <h2>Licencja</h2>
  <table>
    <tr><th>Klucz</th><td class="mono">${esc(lic.key)}</td></tr>
    <tr><th>Produkt</th><td>${esc(lic.product)}</td></tr>
    <tr><th>Plan</th><td>${esc(lic.plan)}</td></tr>
    <tr><th>Status</th><td>${esc(lic.status)}</td></tr>
    <tr><th>Nabywca</th><td>${esc(lic.buyerName || '—')} &lt;${esc(lic.buyerEmail)}&gt;</td></tr>
    <tr><th>Instalacje</th><td>maks. ${lic.maxInstallations}</td></tr>
    <tr><th>Wygasa</th><td>${lic.expiresAt ? dat(lic.expiresAt) : 'bezterminowo'}</td></tr>
    <tr><th>Notatki</th><td>${esc(lic.notes || '—')}</td></tr>
  </table>
</div>

${sekcjaPakietow}

<div class="karta">
  <h2>Instalacje</h2>
  ${akt.length === 0 ? '<div class="pusto">Licencja nie została jeszcze nigdzie aktywowana.</div>' : `<table>
    <tr><th>Domena</th><th>Stan</th><th>Ostatnio widziana</th><th>Aktywowana</th></tr>
    ${akt.map((a) => `<tr>
      <td class="mono">${esc(a.domain)}</td>
      <td>${a.active ? '<span class="znacznik z-ok">aktywna</span>' : '<span class="znacznik z-szary">wyłączona</span>'}</td>
      <td>${dat(a.lastSeenAt)}</td><td>${dat(a.activatedAt)}</td>
    </tr>`).join('')}
  </table>`}
</div>

<div class="karta">
  <h2>Dziennik</h2>
  ${dziennik.length === 0 ? '<div class="pusto">Pusto.</div>' : `<table>
    <tr><th>Kiedy</th><th>Zdarzenie</th><th>Domena</th></tr>
    ${dziennik.map((z) => `<tr><td>${dat(z.createdAt)}</td><td>${esc(z.event)}</td>
      <td class="mono">${esc(z.domain || '—')}</td></tr>`).join('')}
  </table>`}
</div>`))
})

// ─── Akcje ────────────────────────────────────────────────────────────────────

adminUiRouter.post('/licencje', async (c) => {
  const form = await c.req.parseBody()
  const product = String(form['product']) === 'overcms' ? 'overcms' : 'overcrm'
  const plan    = ['trial', 'solo', 'agency'].includes(String(form['plan'])) ? String(form['plan']) : 'trial'
  const email   = String(form['buyerEmail'] ?? '').trim()

  if (!email) return c.redirect('/admin/ui')

  const maks = plan === 'agency' ? 9999 : 1
  const wygasa = plan === 'trial' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null

  const [row] = await db.insert(licenses).values({
    key:              generateLicenseKey(),
    product,
    plan:             plan as 'trial' | 'solo' | 'agency',
    buyerEmail:       email,
    buyerName:        String(form['buyerName'] ?? '') || null,
    maxInstallations: maks,
    expiresAt:        wygasa,
  }).returning({ key: licenses.key })

  return c.redirect(`/admin/ui/licencje/${encodeURIComponent(row!.key)}`)
})

adminUiRouter.post('/licencje/:key/pakiety', async (c) => {
  const klucz = c.req.param('key')
  const form  = await c.req.parseBody()
  const paczka = String(form['bundle'] ?? '')
  const zrodlo = ['manual', 'trial', 'stripe'].includes(String(form['source'])) ? String(form['source']) : 'manual'
  const dataTekst = String(form['expiresAt'] ?? '').trim()

  const [lic] = await db.select({ id: licenses.id, product: licenses.product })
    .from(licenses).where(eq(licenses.key, klucz)).limit(1)

  if (!lic || lic.product !== 'overcrm' || !isKnownBundle(paczka)) {
    return c.redirect(`/admin/ui/licencje/${encodeURIComponent(klucz)}`)
  }

  // Data z <input type="date"> to sama doba — bierzemy jej koniec, żeby pakiet
  // działał przez cały wskazany dzień, a nie znikał o północy na jego początku.
  const wygasa = dataTekst ? new Date(`${dataTekst}T23:59:59Z`) : null

  await db.insert(licenseBundles).values({
    licenseId: lic.id,
    bundle:    paczka,
    source:    zrodlo,
    expiresAt: wygasa,
    notes:     String(form['notes'] ?? '') || null,
  }).onConflictDoUpdate({
    target: [licenseBundles.licenseId, licenseBundles.bundle],
    set:    { source: zrodlo, expiresAt: wygasa, grantedAt: new Date() },
  })

  await db.insert(licAudit).values({
    licenseId: lic.id,
    event:     'bundle-granted',
    meta:      JSON.stringify({ bundle: paczka, source: zrodlo, expiresAt: wygasa, via: 'panel' }),
  }).catch(() => {})

  return c.redirect(`/admin/ui/licencje/${encodeURIComponent(klucz)}`)
})

adminUiRouter.post('/licencje/:key/pakiety/:bundle/odbierz', async (c) => {
  const klucz = c.req.param('key')
  const paczka = c.req.param('bundle')

  const [lic] = await db.select({ id: licenses.id }).from(licenses).where(eq(licenses.key, klucz)).limit(1)

  if (lic) {
    await db.delete(licenseBundles)
      .where(and(eq(licenseBundles.licenseId, lic.id), eq(licenseBundles.bundle, paczka)))

    await db.insert(licAudit).values({
      licenseId: lic.id,
      event:     'bundle-revoked',
      meta:      JSON.stringify({ bundle: paczka, via: 'panel' }),
    }).catch(() => {})
  }

  return c.redirect(`/admin/ui/licencje/${encodeURIComponent(klucz)}`)
})

// ─── Katalog modułów ──────────────────────────────────────────────────────────

adminUiRouter.get('/moduly', async (c) => {
  const wiersze = await db.select().from(plugins)
    .where(eq(plugins.product, 'overcrm')).orderBy(plugins.name)

  const opcje = (wybrany: string | null) =>
    `<option value=""${!wybrany ? ' selected' : ''}>— w licencji podstawowej —</option>` +
    Object.entries(OVERCRM_BUNDLES).map(([id, et]) =>
      `<option value="${esc(id)}"${wybrany === id ? ' selected' : ''}>${esc(et)}</option>`).join('')

  return c.html(layout('Moduły', `
<div class="karta">
  <h2>Moduły OVERCRM</h2>
  ${wiersze.length === 0 ? `<div class="uwaga">
    W bazie nie ma jeszcze żadnego modułu OVERCRM. Marketplace u klienta będzie pusty,
    dopóki nie wgrasz ich przez <code>POST /plugins</code> (nagłówek <code>x-admin-key</code>)
    albo skryptem <code>modules/pakuj.sh</code> + wgraniem paczek.
  </div>` : `<table>
    <tr><th>Moduł</th><th>Wersja</th><th>Pakiet</th><th>Pobrania</th><th></th></tr>
    ${wiersze.map((m) => `<tr>
      <td>${esc(m.name)}<br><span class="mono" style="color:var(--slaby);font-size:12px">${esc(m.id)}</span></td>
      <td>${esc(m.version)}</td>
      <td><form method="post" action="/admin/ui/moduly/${encodeURIComponent(m.id)}/pakiet" class="rzad" style="margin:0">
        <select name="bundle">${opcje(m.bundle)}</select>
        <button>Zapisz</button></form></td>
      <td>${m.downloads}</td>
      <td>${m.downloadUrl ? '<span class="znacznik z-ok">paczka jest</span>' : '<span class="znacznik z-ostrzez">brak paczki</span>'}</td>
    </tr>`).join('')}
  </table>`}
  <p style="color:var(--slaby);margin-bottom:0">
    Pakiet decyduje, komu wolno pobrać moduł. Puste = każdy z ważną licencją.
    Musi zgadzać się z polem <code>bundle</code> w <code>module.json</code>.
  </p>
</div>`))
})

adminUiRouter.post('/moduly/:id/pakiet', async (c) => {
  const id = c.req.param('id')
  const form = await c.req.parseBody()
  const wybrany = String(form['bundle'] ?? '')

  await db.update(plugins)
    .set({ bundle: wybrany && isKnownBundle(wybrany) ? wybrany : null, updatedAt: new Date() })
    .where(eq(plugins.id, id))

  return c.redirect('/admin/ui/moduly')
})
