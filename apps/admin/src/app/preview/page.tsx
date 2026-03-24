'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { initCanvasScript } from '@/components/visual-builder/canvas-script'

/**
 * Preview page — loaded inside the visual builder iframe.
 * Renders blocks and injects the canvas interaction script.
 * Receives block data via postMessage from the parent window.
 */
export default function PreviewPage() {
  const [html, setHtml] = useState('')
  const didInit = useRef(false)

  const handleBlocks = useCallback((blocks: Array<Record<string, unknown>>) => {
    setHtml(renderBlocksToHtml(blocks))
  }, [])

  useEffect(() => {
    // Listen for block updates from the parent visual builder via postMessage
    function handleMessage(e: MessageEvent) {
      if (e.data?.channel !== 'overcms-vb') return
      const msg = e.data.payload
      if (msg?.type === 'vb:init' || msg?.type === 'vb:update-blocks') {
        const blocks = msg.blocks as Array<Record<string, unknown>>
        handleBlocks(blocks)
      }
    }

    // Also listen for CustomEvents dispatched by canvas-script after it
    // unwraps postMessage envelopes. This acts as a redundant listener in
    // case the message handler and canvas-script CustomEvent fire separately.
    function handleCustomInit(e: Event) {
      const blocks = (e as CustomEvent).detail as Array<Record<string, unknown>>
      if (blocks) handleBlocks(blocks)
    }
    function handleCustomUpdate(e: Event) {
      const blocks = (e as CustomEvent).detail as Array<Record<string, unknown>>
      if (blocks) handleBlocks(blocks)
    }

    window.addEventListener('message', handleMessage)
    window.addEventListener('vb:init', handleCustomInit)
    window.addEventListener('vb:update-blocks', handleCustomUpdate)

    // Initialize the canvas interaction script (only once)
    if (!didInit.current) {
      initCanvasScript()
      didInit.current = true
    }

    return () => {
      window.removeEventListener('message', handleMessage)
      window.removeEventListener('vb:init', handleCustomInit)
      window.removeEventListener('vb:update-blocks', handleCustomUpdate)
    }
  }, [handleBlocks])

  return (
    <>
      {/* Corporate template CSS variables */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap');
        :root {
          --font-sans: 'Open Sans', system-ui, sans-serif;
          --color-bg: #0a0a0a;
          --color-surface: #111111;
          --color-fg: #ffffff;
          --color-muted: rgba(255,255,255,0.55);
          --color-primary: #E040FB;
          --color-accent: #7B2FE0;
          --section-y: clamp(4.5rem, 9vw, 8rem);
          --radius-sm: 0.5rem;
          --radius: 0.875rem;
          --radius-lg: 1.5rem;
        }
        *, *::before, *::after { box-sizing: border-box; }
        body {
          font-family: var(--font-sans);
          background: var(--color-bg);
          color: var(--color-fg);
          margin: 0;
          min-height: 100vh;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 clamp(1rem, 5vw, 2.5rem); }
        .glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); }
        .gradient-text { background: linear-gradient(135deg, #E040FB, #7B2FE0); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .section-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-primary); }
        .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 999px; font-weight: 700; font-size: 0.9375rem; text-decoration: none; cursor: pointer; border: none; }
        .btn-primary { background: var(--color-primary); color: #fff; }
        .btn-outline { background: transparent; color: var(--color-fg); border: 1.5px solid rgba(255,255,255,0.2); }
        img { max-width: 100%; height: auto; }
        /* Empty column placeholder */
        [data-block-type="column"]:empty::after {
          content: '+';
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60px;
          border: 1px dashed rgba(255,255,255,0.1);
          border-radius: 8px;
          color: rgba(255,255,255,0.15);
          font-size: 1.25rem;
        }
      `}</style>

      {/* Rendered content */}
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          color: 'rgba(255,255,255,0.2)',
          fontSize: '1rem',
        }}>
          Przeciagnij moduly z panelu po lewej
        </div>
      )}
    </>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Escape HTML entities in user-provided strings */
function esc(str: unknown): string {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Build inline style string from a block's style object */
function buildStyleAttr(style?: Record<string, unknown>): string {
  if (!style || typeof style !== 'object') return ''

  const parts: string[] = []

  // Background
  if (style.bgType === 'color' && style.bgColor) {
    parts.push(`background-color:${style.bgColor}`)
  } else if (style.bgType === 'gradient' && style.bgGradientFrom && style.bgGradientTo) {
    const angle = style.bgGradientAngle ?? '135'
    parts.push(`background:linear-gradient(${angle}deg,${style.bgGradientFrom},${style.bgGradientTo})`)
  } else if (style.bgType === 'image' && style.bgImage) {
    parts.push(`background-image:url(${style.bgImage})`)
    parts.push(`background-size:${style.bgSize ?? 'cover'}`)
    parts.push(`background-position:${style.bgPosition ?? 'center center'}`)
    parts.push('background-repeat:no-repeat')
  }

  // Typography
  if (style.textColor) parts.push(`color:${style.textColor}`)
  if (style.textAlign) parts.push(`text-align:${style.textAlign}`)
  if (style.fontFamily) parts.push(`font-family:${style.fontFamily}`)
  if (style.fontSize) parts.push(`font-size:${style.fontSize}`)
  if (style.fontWeight) parts.push(`font-weight:${style.fontWeight}`)
  if (style.fontStyle) parts.push(`font-style:${style.fontStyle}`)
  if (style.lineHeight) parts.push(`line-height:${style.lineHeight}`)
  if (style.letterSpacing) parts.push(`letter-spacing:${style.letterSpacing}`)
  if (style.textTransform && style.textTransform !== 'none') parts.push(`text-transform:${style.textTransform}`)
  if (style.textDecoration && style.textDecoration !== 'none') parts.push(`text-decoration:${style.textDecoration}`)

  // Spacing
  for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
    const m = style[`margin${side}`]
    if (m) parts.push(`margin-${side.toLowerCase()}:${m}`)
    const p = style[`padding${side}`]
    if (p) parts.push(`padding-${side.toLowerCase()}:${p}`)
  }

  // Size
  if (style.width) parts.push(`width:${style.width}`)
  if (style.maxWidth) parts.push(`max-width:${style.maxWidth}`)
  if (style.height) parts.push(`height:${style.height}`)
  if (style.minHeight) parts.push(`min-height:${style.minHeight}`)

  // Border
  for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
    const bw = style[`border${side}Width`]
    if (bw) parts.push(`border-${side.toLowerCase()}-width:${bw}`)
  }
  if (style.borderStyle) parts.push(`border-style:${style.borderStyle}`)
  if (style.borderColor) parts.push(`border-color:${style.borderColor}`)
  for (const corner of ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius']) {
    const val = style[corner]
    if (val) parts.push(`${corner.replace(/([A-Z])/g, '-$1').toLowerCase()}:${val}`)
  }

  // Shadow
  if (style.shadowX || style.shadowY || style.shadowBlur || style.shadowSpread) {
    const x = style.shadowX ?? '0px'
    const y = style.shadowY ?? '4px'
    const blur = style.shadowBlur ?? '8px'
    const spread = style.shadowSpread ?? '0px'
    const color = style.shadowColor ?? 'rgba(0,0,0,0.15)'
    const inset = style.shadowInset ? 'inset ' : ''
    parts.push(`box-shadow:${inset}${x} ${y} ${blur} ${spread} ${color}`)
  }

  // Opacity / filters
  if (style.opacity && String(style.opacity) !== '100') parts.push(`opacity:${Number(style.opacity) / 100}`)

  const filters: string[] = []
  if (style.blur && String(style.blur) !== '0') filters.push(`blur(${style.blur}px)`)
  if (style.brightness && String(style.brightness) !== '100') filters.push(`brightness(${Number(style.brightness) / 100})`)
  if (style.contrast && String(style.contrast) !== '100') filters.push(`contrast(${Number(style.contrast) / 100})`)
  if (style.saturate && String(style.saturate) !== '100') filters.push(`saturate(${Number(style.saturate) / 100})`)
  if (style.grayscale && String(style.grayscale) !== '0') filters.push(`grayscale(${Number(style.grayscale) / 100})`)
  if (filters.length) parts.push(`filter:${filters.join(' ')}`)

  // Transform
  const transforms: string[] = []
  if (style.rotate && String(style.rotate) !== '0') transforms.push(`rotate(${style.rotate}deg)`)
  if (style.scaleX && String(style.scaleX) !== '1') transforms.push(`scaleX(${style.scaleX})`)
  if (style.scaleY && String(style.scaleY) !== '1') transforms.push(`scaleY(${style.scaleY})`)
  if (style.translateX) transforms.push(`translateX(${style.translateX})`)
  if (style.translateY) transforms.push(`translateY(${style.translateY})`)
  if (style.skewX && String(style.skewX) !== '0') transforms.push(`skewX(${style.skewX}deg)`)
  if (style.skewY && String(style.skewY) !== '0') transforms.push(`skewY(${style.skewY}deg)`)
  if (transforms.length) parts.push(`transform:${transforms.join(' ')}`)

  // Custom CSS
  if (style.customCss && typeof style.customCss === 'string') {
    parts.push(style.customCss)
  }

  return parts.join(';')
}

/** Merge base inline style with block.style overrides */
function mergeStyle(baseStyle: string, blockStyle?: Record<string, unknown>): string {
  const custom = buildStyleAttr(blockStyle)
  if (!custom) return baseStyle
  return baseStyle ? `${baseStyle};${custom}` : custom
}

/** Get CSS class, optionally including block.style.customClass */
function mergeClass(baseClass: string, blockStyle?: Record<string, unknown>): string {
  const custom = blockStyle?.customClass as string | undefined
  if (!custom) return baseClass
  return `${baseClass} ${custom}`.trim()
}

// ─── Block-to-HTML renderer ─────────────────────────────────────────────────

function renderBlocksToHtml(blocks: Array<Record<string, unknown>>, depth = 0): string {
  if (!blocks || !Array.isArray(blocks)) return ''

  return blocks.map((block) => {
    const id = block.id as string
    const type = block.type as string
    const data = (block.data ?? {}) as Record<string, unknown>
    const style = block.style as Record<string, unknown> | undefined
    const children = block.children as Array<Record<string, unknown>> | undefined

    const attrs = `data-block-id="${esc(id)}" data-block-type="${esc(type)}"`

    switch (type) {
      // ── Structure ──────────────────────────────────────────────────
      case 'section': {
        const inner = `<div class="container">${renderBlocksToHtml(children ?? [], depth + 1)}</div>`
        return `<section ${attrs} class="${mergeClass('', style)}" style="${mergeStyle('padding:var(--section-y) 0', style)}">${inner}</section>`
      }

      case 'row': {
        const structure = String(data.columnStructure ?? '1')
        const widths = structure.split(',').map((f: string) => {
          const parts = f.split('_').map(Number)
          return (parts[1] ?? 0) > 0 ? ((parts[0] ?? 1) / (parts[1]!)) * 100 : 100
        })
        const colsHtml = (children ?? []).map((col, _ci) => {
          const colStyle = col.style as Record<string, unknown> | undefined
          return `<div data-block-id="${esc(col.id as string)}" data-block-type="column" class="${mergeClass('', colStyle)}" style="${mergeStyle('display:flex;flex-direction:column;gap:1rem;min-height:60px', colStyle)}">${
            renderBlocksToHtml((col.children ?? []) as Array<Record<string, unknown>>, depth + 2)
          }</div>`
        }).join('')
        const gridCols = widths.map(w => `${w}fr`).join(' ')
        return `<div ${attrs} class="${mergeClass('', style)}" style="${mergeStyle(`display:grid;grid-template-columns:${gridCols};gap:1.5rem;min-height:80px`, style)}">${colsHtml || `<div style="min-height:60px;border:1px dashed rgba(255,255,255,0.1);border-radius:8px;"></div>`}</div>`
      }

      case 'column':
        return `<div ${attrs} class="${mergeClass('', style)}" style="${mergeStyle('display:flex;flex-direction:column;gap:1rem;min-height:60px', style)}">${renderBlocksToHtml(children ?? [], depth + 1)}</div>`

      // ── Text ───────────────────────────────────────────────────────
      case 'heading': {
        const level = Math.max(1, Math.min(6, Number(data.level ?? 2)))
        const tag = `h${level}`
        const sizes: Record<number, string> = {
          1: 'clamp(2rem,4vw,3.5rem)',
          2: 'clamp(1.5rem,3vw,2.5rem)',
          3: 'clamp(1.25rem,2.5vw,2rem)',
          4: 'clamp(1rem,2vw,1.5rem)',
          5: 'clamp(0.875rem,1.5vw,1.25rem)',
          6: '1rem',
        }
        return `<${tag} ${attrs} data-field="text" class="${mergeClass('', style)}" style="${mergeStyle(`font-size:${sizes[level]};font-weight:800;letter-spacing:-0.02em`, style)}">${esc(data.text) || 'Nowy naglowek'}</${tag}>`
      }

      case 'paragraph':
        return `<p ${attrs} data-field="text" class="${mergeClass('', style)}" style="${mergeStyle('color:var(--color-muted);line-height:1.75', style)}">${esc(data.text) || '&nbsp;'}</p>`

      case 'quote':
        return `<blockquote ${attrs} data-field="text" class="${mergeClass('', style)}" style="${mergeStyle('border-left:3px solid var(--color-primary);padding-left:1.5rem;font-style:italic;color:rgba(255,255,255,0.75)', style)}">${esc(data.text)}</blockquote>`

      case 'code':
        return `<pre ${attrs} class="${mergeClass('', style)}" style="${mergeStyle('background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:var(--radius);padding:1rem;overflow-x:auto;font-family:monospace;font-size:0.875rem;color:var(--color-muted)', style)}"><code>${esc(data.code)}</code></pre>`

      case 'html':
        // HTML block renders raw HTML (intentional - user's own markup)
        return `<div ${attrs} class="${mergeClass('', style)}" style="${mergeStyle('', style)}">${data.html ?? ''}</div>`

      // ── Media ──────────────────────────────────────────────────────
      case 'image': {
        const src = (data.url as string) || ''
        const alt = esc(data.alt)
        const caption = esc(data.caption)
        const imgTag = src
          ? `<img src="${esc(src)}" alt="${alt}" style="border-radius:var(--radius);"/>`
          : `<div style="background:rgba(255,255,255,0.04);border:1px dashed rgba(255,255,255,0.15);border-radius:var(--radius);height:200px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.2);font-size:0.875rem;">Obraz</div>`
        const captionTag = caption ? `<figcaption style="text-align:center;color:var(--color-muted);font-size:0.8125rem;margin-top:0.5rem;">${caption}</figcaption>` : ''
        return `<figure ${attrs} class="${mergeClass('', style)}" style="${mergeStyle('margin:0', style)}">${imgTag}${captionTag}</figure>`
      }

      case 'gallery': {
        const images = (data.images ?? []) as Array<Record<string, unknown>>
        const imgsHtml = images.length > 0
          ? images.map((img) => `<img src="${esc(img.url)}" alt="${esc(img.alt)}" style="border-radius:var(--radius-sm);object-fit:cover;aspect-ratio:4/3;"/>`).join('')
          : '<div style="color:rgba(255,255,255,0.2);font-size:0.875rem;">Galeria (brak obrazow)</div>'
        return `<div ${attrs} class="${mergeClass('', style)}" style="${mergeStyle('display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem', style)}">${imgsHtml}</div>`
      }

      case 'video': {
        const url = data.url as string ?? ''
        if (!url) {
          return `<div ${attrs} class="${mergeClass('', style)}" style="${mergeStyle('background:rgba(255,255,255,0.04);border:1px dashed rgba(255,255,255,0.15);border-radius:var(--radius);height:300px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.2)', style)}">Video</div>`
        }
        return `<div ${attrs} class="${mergeClass('', style)}" style="${mergeStyle('position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:var(--radius)', style)}"><iframe src="${esc(url)}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe></div>`
      }

      case 'icon': {
        const size = data.size ?? 48
        const color = (data.color as string) || 'var(--color-primary)'
        return `<div ${attrs} class="${mergeClass('', style)}" style="${mergeStyle(`width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;color:${color};font-size:${Number(size) * 0.6}px`, style)}">&#9733;</div>`
      }

      // ── Layout ─────────────────────────────────────────────────────
      case 'divider':
        return `<hr ${attrs} class="${mergeClass('', style)}" style="${mergeStyle('border:none;border-top:1px solid rgba(255,255,255,0.08);margin:1rem 0', style)}"/>`

      case 'spacer':
        return `<div ${attrs} class="${mergeClass('', style)}" style="${mergeStyle(`height:${data.height ?? '3rem'}`, style)}"></div>`

      case 'card': {
        const imgPart = data.image ? `<img src="${esc(data.image)}" alt="" style="border-radius:var(--radius) var(--radius) 0 0;width:100%;aspect-ratio:16/9;object-fit:cover;"/>` : ''
        const btnPart = data.buttonLabel ? `<a class="btn btn-primary" style="margin-top:auto;" href="${esc(data.link)}">${esc(data.buttonLabel)}</a>` : ''
        return `<div ${attrs} class="${mergeClass('glass', style)}" style="${mergeStyle('border-radius:var(--radius);overflow:hidden;display:flex;flex-direction:column', style)}">${imgPart}<div style="padding:1.5rem;display:flex;flex-direction:column;gap:0.5rem;flex:1;"><h3 style="font-weight:700;font-size:1.125rem;">${esc(data.title)}</h3><p style="color:var(--color-muted);font-size:0.875rem;">${esc(data.text)}</p>${btnPart}</div></div>`
      }

      case 'tabs': {
        const items = (data.items ?? []) as Array<{ label: string; content: string }>
        const tabBtns = items.map((item, i) =>
          `<div style="padding:0.5rem 1rem;font-size:0.875rem;font-weight:600;${i === 0 ? 'border-bottom:2px solid var(--color-primary);color:var(--color-primary)' : 'color:var(--color-muted);'}">${esc(item.label)}</div>`
        ).join('')
        const firstContent = items[0]?.content ?? ''
        return `<div ${attrs} class="${mergeClass('', style)}" style="${mergeStyle('', style)}"><div style="display:flex;border-bottom:1px solid rgba(255,255,255,0.08);gap:0;">${tabBtns}</div><div style="padding:1.5rem 0;color:var(--color-muted);">${esc(firstContent)}</div></div>`
      }

      // ── Interaction ────────────────────────────────────────────────
      case 'button': {
        const variant = data.variant === 'outline' ? 'btn-outline' : 'btn-primary'
        return `<a ${attrs} data-field="label" class="${mergeClass(`btn ${variant}`, style)}" style="${mergeStyle('', style)}" href="${esc(data.url) || '#'}">${esc(data.label) || 'Przycisk'}</a>`
      }

      case 'accordion': {
        const items = (data.items ?? []) as Array<{ question: string; answer: string }>
        const accHtml = items.map((item) =>
          `<details style="border:1px solid rgba(255,255,255,0.08);border-radius:var(--radius-sm);overflow:hidden;"><summary style="padding:1rem;cursor:pointer;font-weight:600;list-style:none;">${esc(item.question) || 'Pytanie'}</summary><div style="padding:0 1rem 1rem;color:var(--color-muted);font-size:0.875rem;">${esc(item.answer)}</div></details>`
        ).join('')
        return `<div ${attrs} class="${mergeClass('', style)}" style="${mergeStyle('display:flex;flex-direction:column;gap:0.5rem', style)}">${accHtml || '<details style="border:1px solid rgba(255,255,255,0.08);border-radius:var(--radius-sm);"><summary style="padding:1rem;cursor:pointer;">FAQ</summary></details>'}</div>`
      }

      case 'form': {
        const fields = (data.fields ?? []) as Array<{ label: string; type: string }>
        const fieldsHtml = fields.map((f) =>
          `<div style="display:flex;flex-direction:column;gap:0.25rem;"><label style="font-size:0.8125rem;font-weight:600;">${esc(f.label)}</label><input type="${esc(f.type) || 'text'}" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:var(--radius-sm);padding:0.625rem 0.75rem;color:var(--color-fg);font-size:0.875rem;" /></div>`
        ).join('')
        const submitLabel = esc(data.submitLabel) || 'Wyslij'
        return `<form ${attrs} class="${mergeClass('', style)}" style="${mergeStyle('display:flex;flex-direction:column;gap:1rem', style)}" onsubmit="event.preventDefault()">${fieldsHtml}<button type="submit" class="btn btn-primary">${submitLabel}</button></form>`
      }

      case 'slider': {
        const slides = (data.slides ?? []) as Array<Record<string, unknown>>
        const slide = slides[0]
        if (!slide) {
          return `<div ${attrs} class="${mergeClass('', style)}" style="${mergeStyle('background:rgba(255,255,255,0.04);border:1px dashed rgba(255,255,255,0.15);border-radius:var(--radius-lg);padding:4rem 2rem;text-align:center;color:rgba(255,255,255,0.2)', style)}">Slider (dodaj slajdy)</div>`
        }
        const imgPart = slide.image ? `<img src="${esc(slide.image)}" alt="" style="width:100%;max-height:400px;object-fit:cover;border-radius:var(--radius);margin-bottom:1rem;"/>` : ''
        return `<div ${attrs} class="${mergeClass('', style)}" style="${mergeStyle('position:relative;border-radius:var(--radius-lg);overflow:hidden;padding:2rem', style)}">${imgPart}<h3 style="font-weight:800;font-size:1.5rem;margin-bottom:0.5rem;">${esc(slide.title)}</h3><p style="color:var(--color-muted);margin-bottom:1rem;">${esc(slide.text)}</p>${slide.buttonLabel ? `<a class="btn btn-primary" href="${esc(slide.buttonUrl)}">${esc(slide.buttonLabel)}</a>` : ''}</div>`
      }

      // ── Marketing ──────────────────────────────────────────────────
      case 'cta':
        return `<div ${attrs} class="${mergeClass('', style)}" style="${mergeStyle('background:linear-gradient(135deg,#E040FB,#7B2FE0);padding:4rem 2rem;border-radius:var(--radius-lg);text-align:center', style)}"><h2 style="font-size:2rem;font-weight:800;color:#fff;margin-bottom:1rem;">${esc(data.title) || 'CTA'}</h2><p style="color:rgba(255,255,255,0.8);margin-bottom:2rem;">${esc(data.description)}</p><a class="btn" style="background:#fff;color:#E040FB;font-weight:700;" href="${esc(data.buttonUrl) || '#'}">${esc(data.buttonLabel) || 'Kliknij'}</a></div>`

      case 'testimonial':
        return `<div ${attrs} class="${mergeClass('glass', style)}" style="${mergeStyle('border-radius:var(--radius-lg);padding:2rem', style)}"><blockquote style="font-size:0.9375rem;color:rgba(255,255,255,0.75);line-height:1.75;margin:0 0 1rem;">"${esc(data.text)}"</blockquote><p style="font-weight:700;">${esc(data.name)}</p><p style="font-size:0.8125rem;color:rgba(255,255,255,0.4);">${esc(data.role)}</p></div>`

      case 'blurb':
        return `<div ${attrs} class="${mergeClass('glass', style)}" style="${mergeStyle('border-radius:var(--radius-lg);padding:2rem;text-align:center', style)}"><div style="width:3rem;height:3rem;border-radius:50%;background:rgba(224,64,251,0.15);margin:0 auto 1rem;display:flex;align-items:center;justify-content:center;color:var(--color-primary);font-size:1.25rem;">&#9733;</div><h3 style="font-weight:700;margin-bottom:0.5rem;">${esc(data.title) || 'Blurb'}</h3><p style="font-size:0.875rem;color:var(--color-muted);">${esc(data.text)}</p></div>`

      case 'counter': {
        const num = data.number ?? 0
        const suffix = esc(data.suffix) || ''
        return `<div ${attrs} class="${mergeClass('', style)}" style="${mergeStyle('text-align:center;padding:2rem', style)}"><div style="font-size:3rem;font-weight:800;color:var(--color-primary);">${num}${suffix}</div><p style="font-size:0.875rem;color:var(--color-muted);margin-top:0.5rem;">${esc(data.title)}</p></div>`
      }

      case 'pricing': {
        const featured = data.featured ? 'border:2px solid var(--color-primary);' : 'border:1px solid rgba(255,255,255,0.08);'
        const features = String(data.features ?? '').split('\n').filter(Boolean).map(f => `<li style="padding:0.375rem 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:0.875rem;color:var(--color-muted);">${esc(f)}</li>`).join('')
        return `<div ${attrs} class="${mergeClass('', style)}" style="${mergeStyle(`${featured}border-radius:var(--radius-lg);padding:2rem;display:flex;flex-direction:column;align-items:center;text-align:center`, style)}"><h3 style="font-weight:700;font-size:1.25rem;margin-bottom:0.5rem;">${esc(data.title)}</h3><div style="font-size:2.5rem;font-weight:800;color:var(--color-primary);margin-bottom:0.25rem;">${esc(data.price)}</div><div style="font-size:0.8125rem;color:var(--color-muted);margin-bottom:1.5rem;">${esc(data.period)}</div><ul style="list-style:none;padding:0;width:100%;margin-bottom:1.5rem;">${features}</ul>${data.buttonLabel ? `<a class="btn btn-primary" href="${esc(data.buttonUrl)}">${esc(data.buttonLabel)}</a>` : ''}</div>`
      }

      case 'team': {
        const photo = data.photo ? `<img src="${esc(data.photo)}" alt="${esc(data.name)}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin:0 auto 1rem;display:block;"/>` : `<div style="width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.06);margin:0 auto 1rem;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.2);font-size:1.5rem;">&#128100;</div>`
        return `<div ${attrs} class="${mergeClass('glass', style)}" style="${mergeStyle('border-radius:var(--radius-lg);padding:2rem;text-align:center', style)}">${photo}<h3 style="font-weight:700;margin-bottom:0.25rem;">${esc(data.name)}</h3><p style="font-size:0.8125rem;color:var(--color-primary);margin-bottom:0.5rem;">${esc(data.role)}</p><p style="font-size:0.875rem;color:var(--color-muted);">${esc(data.bio)}</p></div>`
      }

      case 'social': {
        const items = (data.items ?? []) as Array<{ platform: string; url: string }>
        const linksHtml = items.map(item =>
          `<a href="${esc(item.url) || '#'}" style="display:inline-flex;align-items:center;justify-content:center;width:2.5rem;height:2.5rem;border-radius:50%;background:rgba(255,255,255,0.06);color:var(--color-muted);text-decoration:none;font-size:0.75rem;font-weight:700;text-transform:uppercase;">${esc(item.platform).slice(0, 2)}</a>`
        ).join('')
        return `<div ${attrs} class="${mergeClass('', style)}" style="${mergeStyle('display:flex;gap:0.75rem;align-items:center', style)}">${linksHtml}</div>`
      }

      // ── Fallback ───────────────────────────────────────────────────
      default:
        return `<div ${attrs} class="${mergeClass('', style)}" style="${mergeStyle('padding:1rem;border:1px dashed rgba(255,255,255,0.1);border-radius:8px;color:var(--color-muted);font-size:0.875rem', style)}">${esc(type)}: ${esc(data.text ?? data.title ?? data.label ?? '(modul)')}</div>`
    }
  }).join('\n')
}
