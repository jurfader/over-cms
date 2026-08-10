/**
 * Wspólny szkielet stron renderowanych przez serwer licencji —
 * panelu administratora i portalu klienta.
 *
 * Zero JavaScriptu i zero zasobów z zewnątrz: obie strony mają działać także
 * wtedy, gdy coś dookoła jest zepsute, a portal ogląda klient, u którego nie
 * kontrolujemy ani sieci, ani przeglądarki.
 */

/** Ucieczka HTML. Wszystko, co pochodzi z bazy, przechodzi przez to. */
export function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function dat(v: Date | string | null | undefined): string {
  if (!v) return '—'
  const d = new Date(v)

  return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)}`
}

export const STYL = `
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
.pakiet{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:99px;
font-size:13px;font-weight:600;background:rgba(79,140,255,.12);color:var(--akcent);
border:1px solid rgba(79,140,255,.3);margin:0 7px 7px 0}
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
.logowanie{max-width:360px;margin:12vh auto}
`

/** Kompletna strona. `naglowek` to gotowy HTML paska u góry albo pusty ciąg. */
export function strona(tytul: string, naglowek: string, tresc: string): string {
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(tytul)}</title><style>${STYL}</style></head><body>
${naglowek}<main>${tresc}</main></body></html>`
}
