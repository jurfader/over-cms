import type { Editor } from 'grapesjs'

// ─── SVG Icons for block thumbnails ──────────────────────────────────────────

const icons = {
  section: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="8" x2="22" y2="8"/></svg>',
  row1: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="1"/></svg>',
  row2: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="9" height="12" rx="1"/><rect x="13" y="6" width="9" height="12" rx="1"/></svg>',
  row13_23: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="6" height="12" rx="1"/><rect x="10" y="6" width="12" height="12" rx="1"/></svg>',
  row3: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="6" height="12" rx="1"/><rect x="9" y="6" width="6" height="12" rx="1"/><rect x="16" y="6" width="6" height="12" rx="1"/></svg>',
  row4: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="6" width="4.5" height="12" rx="1"/><rect x="7" y="6" width="4.5" height="12" rx="1"/><rect x="13" y="6" width="4.5" height="12" rx="1"/><rect x="19" y="6" width="4.5" height="12" rx="1"/></svg>',
  heading: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v16"/><path d="M4 12h12"/><path d="M16 4v16"/></svg>',
  paragraph: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="14" x2="18" y2="14"/><line x1="3" y1="18" x2="15" y2="18"/></svg>',
  quote: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>',
  label: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>',
  image: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
  video: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polygon points="10,8 16,12 10,16"/></svg>',
  icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>',
  divider: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="12" x2="22" y2="12"/></svg>',
  spacer: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M8 8l4-3 4 3"/><path d="M8 16l4 3 4-3"/></svg>',
  card: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="11" x2="21" y2="11"/><line x1="7" y1="15" x2="17" y2="15"/><line x1="7" y1="18" x2="13" y2="18"/></svg>',
  btnPrimary: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="8" rx="4" fill="currentColor" opacity="0.2"/><rect x="3" y="8" width="18" height="8" rx="4"/></svg>',
  btnOutline: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="8" rx="4"/></svg>',
  accordion: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="6" rx="1"/><rect x="3" y="11" width="18" height="4" rx="1"/><rect x="3" y="17" width="18" height="4" rx="1"/><path d="M17 6l-2-1 2-1"/></svg>',
  cta: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor" opacity="0.1"/><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="7" y1="9" x2="17" y2="9"/><line x1="9" y1="12" x2="15" y2="12"/><rect x="8" y="15" width="8" height="3" rx="1.5"/></svg>',
  testimonial: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><path d="M8 9h2"/><path d="M14 9h2"/><path d="M8 13h8"/></svg>',
  blurb: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="9" y1="18" x2="15" y2="18"/></svg>',
  pricing: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M12 6v2"/><path d="M9 10h6"/><path d="M8 14h8"/><path d="M8 17h8"/></svg>',
  stats: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10"/><path d="M12 20V4"/><path d="M20 20v-6"/></svg>',
  form: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><rect x="7" y="16" width="10" height="2" rx="1"/></svg>',
}

// ─── Component type definitions ──────────────────────────────────────────────

type ComponentTypeDefinition = {
  isComponent?: (el: HTMLElement) => boolean | undefined
  model?: {
    defaults?: Record<string, unknown>
  }
}

function registerComponentTypes(cm: Editor['DomComponents']) {

  // -- Structural --

  cm.addType('oc-section', {
    isComponent: (el) => el.tagName === 'SECTION' && el.hasAttribute('data-oc-type') ? { type: 'oc-section' } : undefined,
    model: {
      defaults: {
        tagName: 'section',
        name: 'Sekcja',
        draggable: 'body, [data-gjs-type=wrapper]',
        droppable: '[data-oc-type="row"], [data-oc-type="row"] ~ *, .oc-row',
        attributes: { 'data-oc-type': 'section' },
        traits: [
          { type: 'checkbox', name: 'data-fullwidth', label: 'Pełna szerokość' },
        ],
      },
    },
  } as ComponentTypeDefinition)

  cm.addType('oc-row', {
    isComponent: (el) => el.getAttribute?.('data-oc-type') === 'row' ? { type: 'oc-row' } : undefined,
    model: {
      defaults: {
        name: 'Wiersz',
        draggable: '[data-oc-type="section"], section',
        droppable: false,
        attributes: { 'data-oc-type': 'row' },
      },
    },
  } as ComponentTypeDefinition)

  cm.addType('oc-column', {
    isComponent: (el) => el.getAttribute?.('data-oc-type') === 'column' ? { type: 'oc-column' } : undefined,
    model: {
      defaults: {
        name: 'Kolumna',
        draggable: false,
        droppable: true,
        attributes: { 'data-oc-type': 'column' },
      },
    },
  } as ComponentTypeDefinition)

  // -- Modules (leaf nodes — not droppable) --

  const modules = [
    { id: 'oc-heading',     tag: 'h2',         name: 'Nagłówek' },
    { id: 'oc-paragraph',   tag: 'p',          name: 'Paragraf' },
    { id: 'oc-quote',       tag: 'blockquote', name: 'Cytat' },
    { id: 'oc-label',       tag: 'span',       name: 'Etykieta sekcji' },
    { id: 'oc-image',       tag: 'figure',     name: 'Obraz' },
    { id: 'oc-video',       tag: 'div',        name: 'Wideo' },
    { id: 'oc-icon',        tag: 'div',        name: 'Ikona' },
    { id: 'oc-divider',     tag: 'div',        name: 'Separator' },
    { id: 'oc-spacer',      tag: 'div',        name: 'Odstęp' },
    { id: 'oc-card',        tag: 'div',        name: 'Karta' },
    { id: 'oc-btn-primary', tag: 'div',        name: 'Przycisk Primary' },
    { id: 'oc-btn-outline', tag: 'div',        name: 'Przycisk Outline' },
    { id: 'oc-accordion',   tag: 'div',        name: 'Akordeon' },
    { id: 'oc-cta',         tag: 'div',        name: 'Sekcja CTA' },
    { id: 'oc-testimonial', tag: 'div',        name: 'Opinia' },
    { id: 'oc-blurb',       tag: 'div',        name: 'Blurb' },
    { id: 'oc-pricing',     tag: 'div',        name: 'Karta cenowa' },
    { id: 'oc-stats',       tag: 'div',        name: 'Statystyki' },
    { id: 'oc-form',        tag: 'form',       name: 'Formularz' },
  ]

  for (const mod of modules) {
    cm.addType(mod.id, {
      isComponent: (el) => el.getAttribute?.('data-oc-type') === mod.id ? { type: mod.id } : undefined,
      model: {
        defaults: {
          name: mod.name,
          draggable: '[data-oc-type="column"], [data-oc-type="section"], section, .oc-column',
          droppable: false,
          attributes: { 'data-oc-type': mod.id },
        },
      },
    } as ComponentTypeDefinition)
  }
}

// ─── Block HTML builders ─────────────────────────────────────────────────────

/** Shared inline style strings */
const s = {
  section:       'width:100%;padding:var(--section-y) 0;',
  container:     'width:100%;max-width:1200px;margin-inline:auto;padding-inline:clamp(1rem,5vw,2.5rem);',
  flexCol:       'display:flex;flex-direction:column;gap:1.5rem;',
  glass:         'background:rgba(255,255,255,0.04);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid var(--color-border);border-radius:var(--radius-lg);',
  glassRound:    'background:rgba(255,255,255,0.04);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid var(--color-border);border-radius:var(--radius);',
  muted:         'color:var(--color-muted);',
  inputBase:     'width:100%;padding:0.75rem 1rem;border-radius:var(--radius-sm);border:1px solid var(--color-border);background-color:var(--color-surface);color:var(--color-fg);font-family:var(--font-sans);font-size:0.9375rem;',
}

function sectionWrap(inner: string): string {
  return `<section data-oc-type="section" style="${s.section}"><div style="${s.container}"><div style="${s.flexCol}">${inner}</div></div></section>`
}

function rowWrap(columns: string, gridCols: string): string {
  return `<div data-oc-type="row" style="display:grid;grid-template-columns:${gridCols};gap:1.5rem;align-items:start;">${columns}</div>`
}

function colWrap(inner = ''): string {
  return `<div data-oc-type="column" style="${s.flexCol}">${inner}</div>`
}

// ─── Main plugin ─────────────────────────────────────────────────────────────

export const overcmsBlocksPlugin = (editor: Editor) => {
  const bm = editor.Blocks
  const cm = editor.DomComponents

  // Register all component types
  registerComponentTypes(cm)

  // ═══════════════════════════════════════════════════════════════════════════
  // STRUKTURA
  // ═══════════════════════════════════════════════════════════════════════════

  bm.add('oc-section', {
    label: 'Sekcja',
    category: 'Struktura',
    media: icons.section,
    content: sectionWrap(''),
    attributes: { class: 'gjs-fonts gjs-f-b1' },
  })

  bm.add('oc-row-1', {
    label: 'Wiersz 1/1',
    category: 'Struktura',
    media: icons.row1,
    content: rowWrap(colWrap(), '1fr'),
  })

  bm.add('oc-row-2', {
    label: 'Wiersz 1/2 + 1/2',
    category: 'Struktura',
    media: icons.row2,
    content: rowWrap(colWrap() + colWrap(), '1fr 1fr'),
  })

  bm.add('oc-row-13-23', {
    label: 'Wiersz 1/3 + 2/3',
    category: 'Struktura',
    media: icons.row13_23,
    content: rowWrap(colWrap() + colWrap(), '1fr 2fr'),
  })

  bm.add('oc-row-3', {
    label: 'Wiersz 1/3 × 3',
    category: 'Struktura',
    media: icons.row3,
    content: rowWrap(colWrap() + colWrap() + colWrap(), '1fr 1fr 1fr'),
  })

  bm.add('oc-row-4', {
    label: 'Wiersz 1/4 × 4',
    category: 'Struktura',
    media: icons.row4,
    content: rowWrap(colWrap() + colWrap() + colWrap() + colWrap(), '1fr 1fr 1fr 1fr'),
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // TEKST
  // ═══════════════════════════════════════════════════════════════════════════

  bm.add('oc-heading', {
    label: 'Nagłówek',
    category: 'Tekst',
    media: icons.heading,
    content: `<h2 data-oc-type="oc-heading" style="font-weight:700;font-size:clamp(1.75rem,4vw,2.5rem);line-height:1.15;color:var(--color-fg);">Wpisz nagłówek</h2>`,
  })

  bm.add('oc-paragraph', {
    label: 'Paragraf',
    category: 'Tekst',
    media: icons.paragraph,
    content: `<p data-oc-type="oc-paragraph" style="line-height:1.7;color:var(--color-muted);font-size:1rem;">Wpisz treść akapitu. Możesz tu opisać szczegóły dotyczące Twojej oferty, produktów lub usług.</p>`,
  })

  bm.add('oc-quote', {
    label: 'Cytat',
    category: 'Tekst',
    media: icons.quote,
    content: `<blockquote data-oc-type="oc-quote" style="border-left:4px solid var(--color-primary);padding-left:1.25rem;padding-top:0.25rem;padding-bottom:0.25rem;margin:0.5rem 0;">
  <p style="font-size:1.25rem;font-style:italic;line-height:1.6;color:var(--color-fg);">\u201ETwoja wizja jest ograniczona jedynie wyobraźnią.\u201D</p>
  <footer style="margin-top:0.75rem;font-size:0.875rem;color:var(--color-muted);">
    <strong>Jan Kowalski</strong>
    <span style="margin-left:0.25rem;opacity:0.7;">&middot; Dyrektor kreatywny</span>
  </footer>
</blockquote>`,
  })

  bm.add('oc-label', {
    label: 'Etykieta sekcji',
    category: 'Tekst',
    media: icons.label,
    content: `<span data-oc-type="oc-label" class="section-label">Nasza oferta</span>`,
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // MEDIA
  // ═══════════════════════════════════════════════════════════════════════════

  bm.add('oc-image', {
    label: 'Obraz',
    category: 'Media',
    media: icons.image,
    content: `<figure data-oc-type="oc-image">
  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' fill='%23171717'%3E%3Crect width='600' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%23555'%3EObraz%3C/text%3E%3C/svg%3E" alt="Opis obrazu" style="width:100%;border-radius:var(--radius);object-fit:cover;display:block;" />
  <figcaption style="font-size:0.875rem;text-align:center;margin-top:0.5rem;color:var(--color-muted);">Podpis pod obrazem</figcaption>
</figure>`,
  })

  bm.add('oc-video', {
    label: 'Wideo',
    category: 'Media',
    media: icons.video,
    content: `<div data-oc-type="oc-video" style="position:relative;aspect-ratio:16/9;border-radius:var(--radius);overflow:hidden;background:var(--color-surface);">
  <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" style="position:absolute;inset:0;width:100%;height:100%;border:none;" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>
</div>`,
  })

  bm.add('oc-icon', {
    label: 'Ikona',
    category: 'Media',
    media: icons.icon,
    content: `<div data-oc-type="oc-icon" style="display:flex;justify-content:center;align-items:center;">
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
  </svg>
</div>`,
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYOUT
  // ═══════════════════════════════════════════════════════════════════════════

  bm.add('oc-divider', {
    label: 'Separator',
    category: 'Layout',
    media: icons.divider,
    content: `<div data-oc-type="oc-divider" style="margin:2.5rem 0;">
  <hr style="border:none;border-top:1px solid var(--color-border);" />
</div>`,
  })

  bm.add('oc-spacer', {
    label: 'Odstęp',
    category: 'Layout',
    media: icons.spacer,
    content: `<div data-oc-type="oc-spacer" style="height:3rem;" aria-hidden="true"></div>`,
  })

  bm.add('oc-card', {
    label: 'Karta',
    category: 'Layout',
    media: icons.card,
    content: `<div data-oc-type="oc-card" class="glass" style="border-radius:var(--radius);overflow:hidden;">
  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='300' fill='%23171717'%3E%3Crect width='600' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%23555'%3EObraz%3C/text%3E%3C/svg%3E" alt="" style="width:100%;height:13rem;object-fit:cover;display:block;" />
  <div style="padding:1.25rem;">
    <p style="font-weight:700;font-size:1.125rem;margin-bottom:0.25rem;color:var(--color-fg);">Tytuł karty</p>
    <p style="color:var(--color-muted);font-size:0.875rem;line-height:1.7;">Krótki opis zawartości. Możesz opisać produkt, usługę lub dowolny element.</p>
    <a href="#" class="btn btn-primary" style="margin-top:1rem;font-size:0.875rem;">Dowiedz się więcej</a>
  </div>
</div>`,
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERAKCJA
  // ═══════════════════════════════════════════════════════════════════════════

  bm.add('oc-btn-primary', {
    label: 'Przycisk Primary',
    category: 'Interakcja',
    media: icons.btnPrimary,
    content: `<div data-oc-type="oc-btn-primary">
  <a href="#" class="btn btn-primary">Rozpocznij teraz</a>
</div>`,
  })

  bm.add('oc-btn-outline', {
    label: 'Przycisk Outline',
    category: 'Interakcja',
    media: icons.btnOutline,
    content: `<div data-oc-type="oc-btn-outline">
  <a href="#" class="btn btn-outline">Dowiedz się więcej</a>
</div>`,
  })

  bm.add('oc-accordion', {
    label: 'Akordeon',
    category: 'Interakcja',
    media: icons.accordion,
    content: `<div data-oc-type="oc-accordion" style="display:flex;flex-direction:column;gap:0.5rem;">
  <details style="border-radius:var(--radius-sm);border:1px solid var(--color-border);overflow:hidden;" open>
    <summary style="padding:1rem 1.25rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:space-between;color:var(--color-fg);">
      Jakie usługi oferujecie?
      <span style="flex-shrink:0;margin-left:0.75rem;color:var(--color-primary);font-size:1.25rem;line-height:1;">+</span>
    </summary>
    <div style="padding:1rem 1.25rem;color:var(--color-muted);border-top:1px solid var(--color-border);line-height:1.7;">
      Oferujemy kompleksowe rozwiązania w zakresie projektowania stron internetowych, aplikacji webowych oraz strategii marketingowej.
    </div>
  </details>
  <details style="border-radius:var(--radius-sm);border:1px solid var(--color-border);overflow:hidden;">
    <summary style="padding:1rem 1.25rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:space-between;color:var(--color-fg);">
      Ile trwa realizacja projektu?
      <span style="flex-shrink:0;margin-left:0.75rem;color:var(--color-primary);font-size:1.25rem;line-height:1;">+</span>
    </summary>
    <div style="padding:1rem 1.25rem;color:var(--color-muted);border-top:1px solid var(--color-border);line-height:1.7;">
      Czas realizacji zależy od zakresu projektu. Typowy projekt trwa od 4 do 12 tygodni.
    </div>
  </details>
  <details style="border-radius:var(--radius-sm);border:1px solid var(--color-border);overflow:hidden;">
    <summary style="padding:1rem 1.25rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:space-between;color:var(--color-fg);">
      Czy oferujecie wsparcie po wdrożeniu?
      <span style="flex-shrink:0;margin-left:0.75rem;color:var(--color-primary);font-size:1.25rem;line-height:1;">+</span>
    </summary>
    <div style="padding:1rem 1.25rem;color:var(--color-muted);border-top:1px solid var(--color-border);line-height:1.7;">
      Tak, zapewniamy pełne wsparcie techniczne oraz pakiety serwisowe dopasowane do indywidualnych potrzeb.
    </div>
  </details>
</div>`,
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // MARKETING
  // ═══════════════════════════════════════════════════════════════════════════

  bm.add('oc-cta', {
    label: 'Sekcja CTA',
    category: 'Marketing',
    media: icons.cta,
    content: `<div data-oc-type="oc-cta" style="border-radius:var(--radius-lg);padding:clamp(2.5rem,5vw,4rem);text-align:center;background:linear-gradient(135deg, var(--color-primary), var(--color-accent));">
  <p style="font-size:clamp(1.5rem,3.5vw,2.25rem);font-weight:700;margin-bottom:0.75rem;color:#fff;">Gotowy, aby zacząć?</p>
  <p style="opacity:0.85;margin-bottom:2rem;max-width:36rem;margin-inline:auto;color:#fff;line-height:1.7;">Skontaktuj się z nami i dowiedz się, jak możemy pomóc w rozwoju Twojego biznesu.</p>
  <a href="#" class="btn" style="background:#fff;color:var(--color-primary);font-weight:600;">Skontaktuj się</a>
</div>`,
  })

  bm.add('oc-testimonial', {
    label: 'Opinia',
    category: 'Marketing',
    media: icons.testimonial,
    content: `<div data-oc-type="oc-testimonial" class="glass" style="border-radius:var(--radius);padding:1.5rem;background-color:var(--color-surface);">
  <div style="color:var(--color-accent);margin-bottom:0.75rem;font-size:1.125rem;">\u2605\u2605\u2605\u2605\u2605</div>
  <p style="font-size:1.125rem;font-style:italic;margin-bottom:1.25rem;color:var(--color-fg);line-height:1.6;">\u201EWspółpraca z tym zespołem to czysta przyjemność. Profesjonalizm na najwyższym poziomie.\u201D</p>
  <div style="display:flex;align-items:center;gap:0.75rem;">
    <div style="width:2.75rem;height:2.75rem;border-radius:50%;background:var(--color-surface-2);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.875rem;color:var(--color-primary);">AK</div>
    <div>
      <p style="font-weight:600;font-size:0.875rem;color:var(--color-fg);">Anna Kowalska</p>
      <p style="font-size:0.75rem;color:var(--color-muted);">CEO &middot; TechCorp</p>
    </div>
  </div>
</div>`,
  })

  bm.add('oc-blurb', {
    label: 'Blurb',
    category: 'Marketing',
    media: icons.blurb,
    content: `<div data-oc-type="oc-blurb" class="glass" style="border-radius:var(--radius-lg);padding:2rem;text-align:center;">
  <div style="display:inline-flex;align-items:center;justify-content:center;width:3.5rem;height:3.5rem;border-radius:50%;background:rgba(224,64,251,0.15);color:var(--color-primary);margin-bottom:1rem;">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"></polygon></svg>
  </div>
  <p style="font-weight:700;font-size:1.125rem;margin-bottom:0.5rem;color:var(--color-fg);">Szybkość działania</p>
  <p style="color:var(--color-muted);font-size:0.9375rem;line-height:1.7;">Nasze rozwiązania są zoptymalizowane pod kątem wydajności, zapewniając błyskawiczne ładowanie.</p>
</div>`,
  })

  bm.add('oc-pricing', {
    label: 'Karta cenowa',
    category: 'Marketing',
    media: icons.pricing,
    content: `<div data-oc-type="oc-pricing" class="glass" style="border-radius:var(--radius-lg);padding:2rem;text-align:center;position:relative;">
  <p style="font-weight:700;font-size:1.25rem;margin-bottom:0.75rem;color:var(--color-fg);">Pro</p>
  <p style="margin-bottom:0.25rem;">
    <span style="font-size:clamp(2rem,4vw,3rem);font-weight:800;color:var(--color-fg);">199 zł</span>
    <span style="color:var(--color-muted);font-size:0.875rem;margin-left:0.25rem;">/mies.</span>
  </p>
  <ul style="list-style:none;padding:0;margin:1.5rem 0;text-align:left;">
    <li style="padding:0.5rem 0;border-bottom:1px solid var(--color-border);font-size:0.9375rem;display:flex;align-items:center;gap:0.5rem;color:var(--color-muted);">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
      Nielimitowane projekty
    </li>
    <li style="padding:0.5rem 0;border-bottom:1px solid var(--color-border);font-size:0.9375rem;display:flex;align-items:center;gap:0.5rem;color:var(--color-muted);">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
      Priorytetowe wsparcie
    </li>
    <li style="padding:0.5rem 0;border-bottom:1px solid var(--color-border);font-size:0.9375rem;display:flex;align-items:center;gap:0.5rem;color:var(--color-muted);">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
      Własna domena
    </li>
    <li style="padding:0.5rem 0;font-size:0.9375rem;display:flex;align-items:center;gap:0.5rem;color:var(--color-muted);">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
      Certyfikat SSL
    </li>
  </ul>
  <a href="#" class="btn btn-primary" style="width:100%;justify-content:center;">Wybierz plan</a>
</div>`,
  })

  bm.add('oc-stats', {
    label: 'Statystyki',
    category: 'Marketing',
    media: icons.stats,
    content: `<div data-oc-type="oc-stats" style="display:grid;grid-template-columns:repeat(3,1fr);gap:2rem;text-align:center;">
  <div>
    <p style="font-size:clamp(2rem,4vw,3rem);font-weight:800;line-height:1.1;color:var(--color-primary);">150+</p>
    <p style="margin-top:0.5rem;color:var(--color-muted);font-size:0.9375rem;">Zrealizowanych projektów</p>
  </div>
  <div>
    <p style="font-size:clamp(2rem,4vw,3rem);font-weight:800;line-height:1.1;color:var(--color-primary);">98%</p>
    <p style="margin-top:0.5rem;color:var(--color-muted);font-size:0.9375rem;">Zadowolonych klientów</p>
  </div>
  <div>
    <p style="font-size:clamp(2rem,4vw,3rem);font-weight:800;line-height:1.1;color:var(--color-primary);">10 lat</p>
    <p style="margin-top:0.5rem;color:var(--color-muted);font-size:0.9375rem;">Doświadczenia na rynku</p>
  </div>
</div>`,
  })

  bm.add('oc-form', {
    label: 'Formularz kontaktowy',
    category: 'Marketing',
    media: icons.form,
    content: `<form data-oc-type="oc-form" class="glass" style="border-radius:var(--radius-lg);padding:2rem;display:flex;flex-direction:column;gap:1.25rem;">
  <div>
    <label style="display:block;margin-bottom:0.375rem;font-weight:600;font-size:0.875rem;color:var(--color-fg);">Imię i nazwisko</label>
    <input type="text" name="name" placeholder="Jan Kowalski" style="${s.inputBase}" />
  </div>
  <div>
    <label style="display:block;margin-bottom:0.375rem;font-weight:600;font-size:0.875rem;color:var(--color-fg);">E-mail</label>
    <input type="email" name="email" placeholder="jan@example.com" style="${s.inputBase}" />
  </div>
  <div>
    <label style="display:block;margin-bottom:0.375rem;font-weight:600;font-size:0.875rem;color:var(--color-fg);">Temat</label>
    <input type="text" name="subject" placeholder="Temat wiadomości" style="${s.inputBase}" />
  </div>
  <div>
    <label style="display:block;margin-bottom:0.375rem;font-weight:600;font-size:0.875rem;color:var(--color-fg);">Wiadomość</label>
    <textarea name="message" rows="4" placeholder="Treść wiadomości..." style="${s.inputBase}resize:vertical;"></textarea>
  </div>
  <div>
    <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;">Wyślij wiadomość</button>
  </div>
</form>`,
  })
}
