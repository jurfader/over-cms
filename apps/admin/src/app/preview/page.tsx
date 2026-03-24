'use client'

import { useState, useEffect } from 'react'
import { initCanvasScript } from '@/components/visual-builder/canvas-script'

/**
 * Preview page — loaded inside the visual builder iframe.
 * Renders blocks and injects the canvas interaction script.
 * Receives block data via postMessage from the parent window.
 */
export default function PreviewPage() {
  const [html, setHtml] = useState('')

  useEffect(() => {
    // Listen for block updates from the parent visual builder
    function handleMessage(e: MessageEvent) {
      if (e.data?.channel !== 'overcms-vb') return
      const msg = e.data.payload
      if (msg?.type === 'vb:init' || msg?.type === 'vb:update-blocks') {
        // For now, render blocks as placeholder outlines
        // In Phase 2+, this will use the actual BlockRenderer
        const blocks = msg.blocks as Array<Record<string, unknown>>
        setHtml(renderBlocksToHtml(blocks))
      }
    }

    window.addEventListener('message', handleMessage)

    // Initialize the canvas interaction script
    initCanvasScript()

    return () => window.removeEventListener('message', handleMessage)
  }, [])

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
          Przeciągnij moduły z panelu po lewej
        </div>
      )}
    </>
  )
}

/**
 * Simple block-to-HTML renderer for the preview.
 * Wraps each block with data-block-id and data-block-type attributes.
 */
function renderBlocksToHtml(blocks: Array<Record<string, unknown>>, depth = 0): string {
  if (!blocks || !Array.isArray(blocks)) return ''

  return blocks.map((block) => {
    const id = block.id as string
    const type = block.type as string
    const data = (block.data ?? {}) as Record<string, unknown>
    const children = block.children as Array<Record<string, unknown>> | undefined

    let inner = ''

    switch (type) {
      case 'section':
        inner = `<div class="container">${renderBlocksToHtml(children ?? [], depth + 1)}</div>`
        return `<section data-block-id="${id}" data-block-type="${type}" style="padding:var(--section-y) 0;">${inner}</section>`

      case 'row': {
        const structure = String(data.columnStructure ?? '1')
        const widths = structure.split(',').map((f: string) => {
          const parts = f.split('_').map(Number)
          return (parts[1] ?? 0) > 0 ? ((parts[0] ?? 1) / parts[1]!) * 100 : 100
        })
        const colsHtml = (children ?? []).map((col) =>
          `<div data-block-id="${col.id}" data-block-type="column" style="min-height:60px;">${
            renderBlocksToHtml((col.children ?? []) as Array<Record<string, unknown>>, depth + 2)
          }</div>`
        ).join('')
        return `<div data-block-id="${id}" data-block-type="${type}" style="display:grid;grid-template-columns:${widths.map(w => `${w}fr`).join(' ')};gap:1.5rem;min-height:80px;">${colsHtml || `<div style="min-height:60px;border:1px dashed rgba(255,255,255,0.1);border-radius:8px;"></div>`}</div>`
      }

      case 'column':
        return `<div data-block-id="${id}" data-block-type="${type}" style="display:flex;flex-direction:column;gap:1rem;min-height:60px;">${renderBlocksToHtml(children ?? [], depth + 1)}</div>`

      case 'heading':
        return `<h2 data-block-id="${id}" data-block-type="${type}" style="font-size:clamp(1.5rem,3vw,2.5rem);font-weight:800;letter-spacing:-0.02em;">${data.text ?? 'Nowy nagłówek'}</h2>`

      case 'paragraph':
        return `<p data-block-id="${id}" data-block-type="${type}" style="color:var(--color-muted);line-height:1.75;">${data.text ?? ''}</p>`

      case 'image':
        return `<figure data-block-id="${id}" data-block-type="${type}"><img src="${data.url || '/placeholder.svg'}" alt="${data.alt ?? ''}" style="border-radius:var(--radius);"/></figure>`

      case 'button':
        return `<a data-block-id="${id}" data-block-type="${type}" class="btn btn-primary" href="${data.url ?? '#'}">${data.label ?? 'Przycisk'}</a>`

      case 'divider':
        return `<hr data-block-id="${id}" data-block-type="${type}" style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:1rem 0;"/>`

      case 'spacer':
        return `<div data-block-id="${id}" data-block-type="${type}" style="height:${data.height ?? '3rem'};"></div>`

      case 'cta':
        return `<div data-block-id="${id}" data-block-type="${type}" style="background:linear-gradient(135deg,#E040FB,#7B2FE0);padding:4rem 2rem;border-radius:var(--radius-lg);text-align:center;"><h2 style="font-size:2rem;font-weight:800;color:#fff;margin-bottom:1rem;">${data.title ?? 'CTA'}</h2><p style="color:rgba(255,255,255,0.8);margin-bottom:2rem;">${data.description ?? ''}</p><a class="btn" style="background:#fff;color:#E040FB;font-weight:700;" href="${data.buttonUrl ?? '#'}">${data.buttonLabel ?? 'Kliknij'}</a></div>`

      case 'testimonial':
        return `<div data-block-id="${id}" data-block-type="${type}" class="glass" style="border-radius:var(--radius-lg);padding:2rem;"><blockquote style="font-size:0.9375rem;color:rgba(255,255,255,0.75);line-height:1.75;margin:0 0 1rem;">"${data.text ?? ''}"</blockquote><p style="font-weight:700;">${data.name ?? ''}</p><p style="font-size:0.8125rem;color:rgba(255,255,255,0.4);">${data.role ?? ''}</p></div>`

      case 'blurb':
        return `<div data-block-id="${id}" data-block-type="${type}" class="glass" style="border-radius:var(--radius-lg);padding:2rem;text-align:center;"><div style="width:3rem;height:3rem;border-radius:50%;background:rgba(224,64,251,0.15);margin:0 auto 1rem;display:flex;align-items:center;justify-content:center;color:var(--color-primary);font-size:1.25rem;">★</div><h3 style="font-weight:700;margin-bottom:0.5rem;">${data.title ?? 'Blurb'}</h3><p style="font-size:0.875rem;color:var(--color-muted);">${data.text ?? ''}</p></div>`

      case 'quote':
        return `<blockquote data-block-id="${id}" data-block-type="${type}" style="border-left:3px solid var(--color-primary);padding-left:1.5rem;font-style:italic;color:rgba(255,255,255,0.75);">${data.text ?? ''}</blockquote>`

      case 'html':
        return `<div data-block-id="${id}" data-block-type="${type}">${data.html ?? ''}</div>`

      default:
        return `<div data-block-id="${id}" data-block-type="${type}" style="padding:1rem;border:1px dashed rgba(255,255,255,0.1);border-radius:8px;color:var(--color-muted);font-size:0.875rem;">${type}: ${data.text ?? data.title ?? data.label ?? '(moduł)'}</div>`
    }
  }).join('\n')
}
