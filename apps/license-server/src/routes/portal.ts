import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { eq, and, desc } from 'drizzle-orm'
import { db, licenses, activations } from '../db/index.js'
import { licenseBundles } from '../db/schema.js'
import { OVERCRM_BUNDLES } from '../utils/bundles.js'
import { esc, dat, strona } from '../utils/html.js'

/**
 * Portal klienta.
 *
 * Renderowany przez serwer licencji, tak samo jak panel administratora —
 * osobna aplikacja Next.js oznaczałaby kolejny kontener, domenę i wdrożenie
 * dla trzech ekranów. Ta wersja działa wszędzie tam, gdzie działa API.
 *
 * Klucz licencji JEST poświadczeniem: kto go zna, ten widzi swoje instalacje
 * i może je zwalniać. Dlatego klucz nie trafia do adresu URL, tylko do
 * ciasteczka — adresy lądują w logach serwera, historii przeglądarki
 * i nagłówku Referer, a klucza nie da się unieważnić bez wystawienia nowego.
 */
export const portalRouter = new Hono()

const CIASTKO = 'lic_portal'

function naglowek(zalogowany: boolean): string {
  return `<header>
  <h1>Moja licencja OVERMEDIA</h1>
  ${zalogowany ? `<nav><form method="post" action="/portal/wyloguj" style="margin:0">
    <button class="cichy">Wyloguj</button></form></nav>` : ''}
</header>`
}

function ekranLogowania(blad?: string): string {
  return strona('Moja licencja — OVERMEDIA', naglowek(false), `
<div class="logowanie"><div class="karta">
  <h2>Podaj klucz licencji</h2>
  ${blad ? `<div class="uwaga">${esc(blad)}</div>` : ''}
  <form method="post" action="/portal/zaloguj">
    <p><input name="key" placeholder="XXXX-XXXX-XXXX-XXXX" autofocus
       autocomplete="off" spellcheck="false"
       style="width:100%;font-family:ui-monospace,monospace;letter-spacing:.08em"></p>
    <button style="width:100%">Pokaż moją licencję</button>
  </form>
  <p style="color:var(--slaby);font-size:12px;margin-bottom:0">
    Klucz znajdziesz w panelu CRM w zakładce Licencja albo w mailu po zakupie.
  </p>
</div></div>`)
}

// ─── Widok główny ─────────────────────────────────────────────────────────────

portalRouter.get('/', async (c) => {
  const klucz = getCookie(c, CIASTKO)
  if (!klucz) return c.html(ekranLogowania())

  const [lic] = await db.select().from(licenses).where(eq(licenses.key, klucz)).limit(1)
  if (!lic) {
    deleteCookie(c, CIASTKO, { path: '/portal' })

    return c.html(ekranLogowania('Licencja nie istnieje — zaloguj się ponownie.'))
  }

  const [akt, pak] = await Promise.all([
    db.select().from(activations)
      .where(eq(activations.licenseId, lic.id))
      .orderBy(desc(activations.lastSeenAt)),
    db.select().from(licenseBundles)
      .where(eq(licenseBundles.licenseId, lic.id))
      .orderBy(licenseBundles.bundle),
  ])

  const teraz = Date.now()
  const aktywnePakiety = pak.filter((p) => !p.expiresAt || new Date(p.expiresAt).getTime() > teraz)
  const czynne = akt.filter((a) => a.active).length
  const wolneMiejsca = lic.maxInstallations - czynne

  const znacznik = (s: string) => s === 'active'
    ? '<span class="znacznik z-ok">aktywna</span>'
    : `<span class="znacznik z-zle">${esc(s)}</span>`

  const sekcjaPakietow = lic.product !== 'overcrm' ? '' : `
<div class="karta">
  <h2>Wykupione pakiety</h2>
  ${aktywnePakiety.length === 0
    ? `<div class="pusto">Masz licencję podstawową — bez dodatkowych pakietów.</div>
       <p style="margin-bottom:0">Chcesz rozszerzyć CRM o AI, telefonię albo analitykę?
       Napisz na <a href="mailto:biuro@overmedia.pl?subject=Rozszerzenie licencji ${esc(lic.key)}">biuro@overmedia.pl</a>.</p>`
    : `<div>${aktywnePakiety.map((p) => `<span class="pakiet" title="${esc(p.bundle)}">✓ ${esc(OVERCRM_BUNDLES[p.bundle] ?? p.bundle)}${
        p.expiresAt ? ` <span style="opacity:.7;font-weight:400">do ${esc(dat(p.expiresAt).slice(0, 10))}</span>` : ''
      }</span>`).join('')}</div>
       <p style="color:var(--slaby);margin-bottom:0">
         Pakiety decydują, które moduły możesz zainstalować w CRM-ie.
         Po zmianie odśwież licencję w CRM-ie: Licencja → „Odśwież walidację”.
       </p>`}
</div>`

  return c.html(strona('Moja licencja — OVERMEDIA', naglowek(true), `
<div class="karta">
  <h2>Licencja</h2>
  <table>
    <tr><th>Klucz</th><td class="mono">${esc(lic.key)}</td></tr>
    <tr><th>Produkt</th><td>${lic.product === 'overcrm' ? 'OVERCRM' : 'OverCMS'}</td></tr>
    <tr><th>Status</th><td>${znacznik(lic.status)}</td></tr>
    <tr><th>Ważna do</th><td>${lic.expiresAt ? dat(lic.expiresAt) : 'bezterminowo'}</td></tr>
    <tr><th>Instalacje</th><td>${czynne} z ${lic.maxInstallations}
      ${wolneMiejsca <= 0 ? ' <span class="znacznik z-ostrzez">limit wyczerpany</span>' : ''}</td></tr>
  </table>
</div>

${sekcjaPakietow}

<div class="karta">
  <h2>Moje instalacje</h2>
  ${akt.length === 0 ? '<div class="pusto">Licencja nie została jeszcze nigdzie aktywowana.</div>' : `<table>
    <tr><th>Domena</th><th>Stan</th><th>Ostatni kontakt</th><th></th></tr>
    ${akt.map((a) => `<tr>
      <td class="mono">${esc(a.domain)}</td>
      <td>${a.active ? '<span class="znacznik z-ok">aktywna</span>' : '<span class="znacznik z-szary">zwolniona</span>'}</td>
      <td>${dat(a.lastSeenAt)}</td>
      <td>${a.active ? `<form method="post" action="/portal/zwolnij" style="margin:0">
        <input type="hidden" name="domain" value="${esc(a.domain)}">
        <button class="cichy">Zwolnij</button></form>` : ''}</td>
    </tr>`).join('')}
  </table>`}
  <p style="color:var(--slaby);margin-bottom:0">
    Zwolnij instalację, gdy przenosisz CRM na inny serwer albo rezygnujesz z domeny —
    zwalnia to miejsce w limicie. CRM przestanie działać na tej domenie
    przy najbliższej weryfikacji.
  </p>
</div>

<div class="karta">
  <h2>Pomoc</h2>
  <p style="margin-bottom:0">Problem z licencją? Napisz na
    <a href="mailto:support@overmedia.pl?subject=Licencja ${esc(lic.key)}">support@overmedia.pl</a>
    i podaj klucz widoczny wyżej.</p>
</div>`))
})

// ─── Logowanie ────────────────────────────────────────────────────────────────

portalRouter.post('/zaloguj', async (c) => {
  const form  = await c.req.parseBody()
  const klucz = String(form['key'] ?? '').trim().toUpperCase()

  if (!klucz) return c.html(ekranLogowania('Podaj klucz licencji.'))

  const [lic] = await db.select({ id: licenses.id }).from(licenses)
    .where(eq(licenses.key, klucz)).limit(1)

  // Ten sam komunikat dla pustego i błędnego klucza — nie podpowiadamy,
  // że jakiś klucz istnieje. Zgadywanie i tak jest nierealne, ale nie ma
  // powodu ułatwiać.
  if (!lic) return c.html(ekranLogowania('Nie znaleziono licencji o tym kluczu.'))

  setCookie(c, CIASTKO, klucz, {
    httpOnly: true,
    secure:   process.env['NODE_ENV'] === 'production',
    sameSite: 'Strict',
    path:     '/portal',
    maxAge:   60 * 60 * 24 * 7,
  })

  return c.redirect('/portal')
})

portalRouter.post('/wyloguj', (c) => {
  deleteCookie(c, CIASTKO, { path: '/portal' })

  return c.redirect('/portal')
})

// ─── Zwolnienie instalacji ────────────────────────────────────────────────────

portalRouter.post('/zwolnij', async (c) => {
  const klucz = getCookie(c, CIASTKO)
  if (!klucz) return c.redirect('/portal')

  const form   = await c.req.parseBody()
  const domena = String(form['domain'] ?? '').trim().toLowerCase()

  const [lic] = await db.select({ id: licenses.id }).from(licenses)
    .where(eq(licenses.key, klucz)).limit(1)

  if (lic && domena) {
    // Warunek na licenseId jest tu istotny: bez niego klient mógłby zwolnić
    // cudzą instalację, podając samą domenę.
    await db.update(activations)
      .set({ active: false })
      .where(and(eq(activations.licenseId, lic.id), eq(activations.domain, domena)))
  }

  return c.redirect('/portal')
})
