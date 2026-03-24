import type { CSSProperties, ReactNode } from 'react'
import type { BlockStyle } from '@/sdk/core-types'

// ─── Media URL fix ───────────────────────────────────────────────────────────
// Normalize media URLs: strip localhost references from development uploads
function fixUrl(url: unknown): string {
  if (typeof url !== 'string' || !url) return ''
  return url.replace(/^https?:\/\/localhost:\d+/, '')
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Block {
  id:        string
  type:      string
  data:      Record<string, unknown>
  style?:    BlockStyle
  children?: Block[]
}

// ─── BlockStyle → CSSProperties ──────────────────────────────────────────────

function styleToCSS(style?: BlockStyle): CSSProperties {
  if (!style) return {}
  const css: CSSProperties = {}

  // Background
  if (style.bgType === 'color' && style.bgColor) {
    css.backgroundColor = style.bgColor
  } else if (style.bgType === 'gradient') {
    css.background = `linear-gradient(${style.bgGradientAngle ?? 0}deg, ${style.bgGradientFrom ?? '#000'}, ${style.bgGradientTo ?? '#fff'})`
  } else if (style.bgType === 'image' && style.bgImage) {
    css.backgroundImage    = `url(${style.bgImage})`
    css.backgroundSize     = style.bgSize     ?? 'cover'
    css.backgroundPosition = style.bgPosition ?? 'center'
    css.backgroundRepeat   = (style.bgRepeat  ?? 'no-repeat') as CSSProperties['backgroundRepeat']
    css.position           = 'relative'
  }

  // Typography
  if (style.textColor)      css.color          = style.textColor
  if (style.textAlign)      css.textAlign      = style.textAlign
  if (style.fontFamily)     css.fontFamily     = style.fontFamily
  if (style.fontSize)       css.fontSize       = style.fontSize
  if (style.fontWeight)     css.fontWeight     = style.fontWeight as CSSProperties['fontWeight']
  if (style.fontStyle)      css.fontStyle      = style.fontStyle
  if (style.lineHeight)     css.lineHeight     = style.lineHeight
  if (style.letterSpacing)  css.letterSpacing  = style.letterSpacing
  if (style.textTransform)  css.textTransform  = style.textTransform
  if (style.textDecoration) css.textDecoration = style.textDecoration

  // Spacing
  if (style.marginTop)     css.marginTop     = style.marginTop
  if (style.marginRight)   css.marginRight   = style.marginRight
  if (style.marginBottom)  css.marginBottom  = style.marginBottom
  if (style.marginLeft)    css.marginLeft    = style.marginLeft
  if (style.paddingTop)    css.paddingTop    = style.paddingTop
  if (style.paddingRight)  css.paddingRight  = style.paddingRight
  if (style.paddingBottom) css.paddingBottom = style.paddingBottom
  if (style.paddingLeft)   css.paddingLeft   = style.paddingLeft

  // Size
  if (style.width)     css.width     = style.width
  if (style.maxWidth)  css.maxWidth  = style.maxWidth
  if (style.height)    css.height    = style.height
  if (style.minHeight) css.minHeight = style.minHeight

  // Border
  if (style.borderTopWidth)          css.borderTopWidth          = style.borderTopWidth
  if (style.borderRightWidth)        css.borderRightWidth        = style.borderRightWidth
  if (style.borderBottomWidth)       css.borderBottomWidth       = style.borderBottomWidth
  if (style.borderLeftWidth)         css.borderLeftWidth         = style.borderLeftWidth
  if (style.borderStyle)             css.borderStyle             = style.borderStyle
  if (style.borderColor)             css.borderColor             = style.borderColor
  if (style.borderTopLeftRadius)     css.borderTopLeftRadius     = style.borderTopLeftRadius
  if (style.borderTopRightRadius)    css.borderTopRightRadius    = style.borderTopRightRadius
  if (style.borderBottomRightRadius) css.borderBottomRightRadius = style.borderBottomRightRadius
  if (style.borderBottomLeftRadius)  css.borderBottomLeftRadius  = style.borderBottomLeftRadius

  // Shadow
  if (style.shadowX || style.shadowY || style.shadowBlur) {
    const x      = style.shadowX      ?? '0px'
    const y      = style.shadowY      ?? '4px'
    const blur   = style.shadowBlur   ?? '8px'
    const spread = style.shadowSpread ?? '0px'
    const color  = style.shadowColor  ?? 'rgba(0,0,0,0.15)'
    const inset  = style.shadowInset  ? 'inset ' : ''
    css.boxShadow = `${inset}${x} ${y} ${blur} ${spread} ${color}`
  }

  // Filters
  if (style.opacity) css.opacity = parseFloat(style.opacity) / 100
  const filters: string[] = []
  if (style.blur)       filters.push(`blur(${style.blur}px)`)
  if (style.brightness && style.brightness !== '100') filters.push(`brightness(${style.brightness}%)`)
  if (style.contrast   && style.contrast   !== '100') filters.push(`contrast(${style.contrast}%)`)
  if (style.saturate   && style.saturate   !== '100') filters.push(`saturate(${style.saturate}%)`)
  if (style.grayscale  && style.grayscale  !== '0')   filters.push(`grayscale(${style.grayscale}%)`)
  if (filters.length) css.filter = filters.join(' ')

  // Transform
  const transforms: string[] = []
  if (style.rotate     && style.rotate     !== '0')   transforms.push(`rotate(${style.rotate}deg)`)
  if (style.scaleX     && style.scaleX     !== '1')   transforms.push(`scaleX(${style.scaleX})`)
  if (style.scaleY     && style.scaleY     !== '1')   transforms.push(`scaleY(${style.scaleY})`)
  if (style.translateX && style.translateX !== '0px') transforms.push(`translateX(${style.translateX})`)
  if (style.translateY && style.translateY !== '0px') transforms.push(`translateY(${style.translateY})`)
  if (style.skewX      && style.skewX      !== '0')   transforms.push(`skewX(${style.skewX}deg)`)
  if (style.skewY      && style.skewY      !== '0')   transforms.push(`skewY(${style.skewY}deg)`)
  if (transforms.length) css.transform = transforms.join(' ')

  return css
}

// ─── Block wrapper (bg overlay) ───────────────────────────────────────────────

function BlockWrapper({ style, children, className }: { style?: BlockStyle; children: ReactNode; className?: string }) {
  const css = styleToCSS(style)
  const hasOverlay = style?.bgType === 'image' && style?.bgOverlayColor

  return (
    <div style={css} className={[style?.customClass, className].filter(Boolean).join(' ')}>
      {hasOverlay && (
        <div style={{
          position:        'absolute',
          inset:           0,
          backgroundColor: style!.bgOverlayColor,
          opacity:         parseFloat(style!.bgOverlayOpacity ?? '50') / 100,
          pointerEvents:   'none',
        }} />
      )}
      <div style={{ position: hasOverlay ? 'relative' : undefined }}>
        {children}
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parse a Divi-style column structure string into percentage widths.
 *  "1_2,1_2" => [50, 50]   "1_3,2_3" => [33.33, 66.67]   "1" => [100] */
function parseColumnStructure(structure: string): number[] {
  if (!structure) return [100]
  return structure.split(',').map(frac => {
    const parts = frac.trim().split('_').map(Number)
    const num = parts[0] ?? 1
    const den = parts[1]
    return den ? (num / den) * 100 : 100
  })
}

const GUTTER_MAP: Record<string, string> = {
  none: '0',
  sm:   '0.75rem',
  md:   '1.5rem',
  lg:   '3rem',
}

// ─── Structural blocks: Section → Row → Column ──────────────────────────────

function SectionBlock({ data, blockChildren, depth }: { data: Record<string, unknown>; blockChildren?: Block[]; depth: number }) {
  const fullWidth = data.fullWidth === true
  const inner = (blockChildren ?? []).map(child => (
    <BlockItem key={child.id} block={child} depth={depth + 1} />
  ))

  return (
    <section style={{
      width:          '100%',
      maxWidth:       fullWidth ? 'none' : '1200px',
      marginInline:   fullWidth ? undefined : 'auto',
      paddingInline:  fullWidth ? undefined : 'clamp(1rem, 5vw, 2.5rem)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {inner}
      </div>
    </section>
  )
}

function RowBlock({ data, blockChildren, depth }: { data: Record<string, unknown>; blockChildren?: Block[]; depth: number }) {
  const structure   = String(data.columnStructure ?? '1')
  const widths      = parseColumnStructure(structure)
  const gutter      = GUTTER_MAP[String(data.gutter ?? 'md')] ?? '1.5rem'
  const equalize    = data.equalizeHeight === true

  const cols = blockChildren ?? []

  return (
    <div style={{
      display:             'grid',
      gridTemplateColumns: widths.map(w => `${w}fr`).join(' '),
      gap:                 gutter,
      alignItems:          equalize ? 'stretch' : 'start',
    }}>
      {widths.map((_, i) => {
        const colBlock = cols[i]
        if (!colBlock) return <div key={i} />
        return <BlockItem key={colBlock.id} block={colBlock} depth={depth + 1} />
      })}
    </div>
  )
}

function ColumnBlock({ blockChildren, depth }: { blockChildren?: Block[]; depth: number }) {
  const modules = blockChildren ?? []
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {modules.map(mod => (
        <BlockItem key={mod.id} block={mod} depth={depth + 1} />
      ))}
    </div>
  )
}

// ─── Legacy columns block (backward compatibility) ───────────────────────────

function ColumnsBlock({ data, depth }: { data: Record<string, unknown>; depth: number }) {
  const widths  = (data.widths  as number[]                                   | undefined) ?? [50, 50]
  const columns = (data.columns as { id: string; blocks: Block[] }[] | undefined)

  return (
    <div className="grid gap-6 items-start" style={{ gridTemplateColumns: widths.map((w) => `${w}fr`).join(' ') }}>
      {widths.map((_, i) => {
        const colBlocks = columns?.[i]?.blocks ?? []
        return (
          <div key={i} className="space-y-4">
            {colBlocks.map((block) => (
              <BlockItem key={block.id} block={block} depth={depth + 1} />
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ─── Existing module renderers ────────────────────────────────────────────────

function HeadingBlock({ data }: { data: Record<string, unknown> }) {
  const level = Number(data.level ?? 2)
  const text  = String(data.text ?? '')
  const sizes: Record<number, string> = {
    1: 'text-5xl', 2: 'text-4xl', 3: 'text-3xl',
    4: 'text-2xl', 5: 'text-xl',  6: 'text-lg',
  }
  const cls = `font-bold leading-tight ${sizes[level] ?? 'text-3xl'}`
  if (level === 1) return <h1 className={cls}>{text}</h1>
  if (level === 3) return <h3 className={cls}>{text}</h3>
  if (level === 4) return <h4 className={cls}>{text}</h4>
  if (level === 5) return <h5 className={cls}>{text}</h5>
  if (level === 6) return <h6 className={cls}>{text}</h6>
  return <h2 className={cls}>{text}</h2>
}

function ParagraphBlock({ data }: { data: Record<string, unknown> }) {
  return <p className="leading-relaxed">{String(data.text ?? '')}</p>
}

function ImageBlock({ data }: { data: Record<string, unknown> }) {
  if (!data.url) return null
  return (
    <figure>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={String(data.url)}
        alt={String(data.alt ?? '')}
        className="w-full rounded-[var(--radius)] object-cover"
      />
      {!!data.caption && (
        <figcaption className="text-sm text-center mt-2 text-[var(--color-muted)]">
          {String(data.caption)}
        </figcaption>
      )}
    </figure>
  )
}

function GalleryBlock({ data }: { data: Record<string, unknown> }) {
  const images = (data.images as { url: string; alt?: string }[]) ?? []
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {images.map((img, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={img.url}
          alt={img.alt ?? ''}
          className="w-full aspect-square object-cover rounded-[var(--radius-sm)]"
        />
      ))}
    </div>
  )
}

function ButtonBlock({ data }: { data: Record<string, unknown> }) {
  const variant = String(data.variant ?? 'primary')
  const cls = variant === 'outline' ? 'btn btn-outline' : variant === 'ghost' ? 'underline font-semibold text-[var(--color-primary)]' : 'btn btn-primary'
  return (
    <div>
      <a href={String(data.url ?? '#')} target={String(data.target ?? '_self')} className={cls}>
        {String(data.label ?? 'Kliknij')}
      </a>
    </div>
  )
}

function VideoBlock({ data }: { data: Record<string, unknown> }) {
  const url = String(data.url ?? '')
  const ytMatch    = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)

  if (ytMatch) {
    return (
      <div className="relative aspect-video rounded-[var(--radius)] overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${ytMatch[1]}`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }
  if (vimeoMatch) {
    return (
      <div className="relative aspect-video rounded-[var(--radius)] overflow-hidden">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
        />
      </div>
    )
  }
  if (data.type === 'upload' && url) {
    return (
      <video src={url} controls className="w-full rounded-[var(--radius)]" />
    )
  }
  return null
}

function CodeBlock({ data }: { data: Record<string, unknown> }) {
  return (
    <pre className="overflow-x-auto rounded-[var(--radius-sm)] bg-[#0d1117] text-[#e6edf3] text-sm p-5 leading-relaxed">
      <code>{String(data.code ?? '')}</code>
    </pre>
  )
}

function QuoteBlock({ data }: { data: Record<string, unknown> }) {
  return (
    <blockquote className="border-l-4 border-[var(--color-primary)] pl-5 py-1 my-2">
      <p className="text-xl italic leading-relaxed">&ldquo;{String(data.text ?? '')}&rdquo;</p>
      {(!!data.author || !!data.role) && (
        <footer className="mt-3 text-sm text-[var(--color-muted)]">
          <strong>{String(data.author ?? '')}</strong>
          {!!data.role && <span className="ml-1 opacity-70">&middot; {String(data.role)}</span>}
        </footer>
      )}
    </blockquote>
  )
}

function DividerBlock({ data }: { data: Record<string, unknown> }) {
  const style = String(data.style ?? 'line')
  const spacing: Record<string, string> = { sm: '1rem', md: '2.5rem', lg: '5rem' }
  const margin = spacing[String(data.spacing ?? 'md')] ?? '2.5rem'
  return (
    <div style={{ margin: `${margin} 0` }}>
      {style === 'line'  && <hr style={{ borderColor: 'var(--color-border)' }} />}
      {style === 'dots'  && <p className="text-center text-[var(--color-muted)] tracking-widest">&middot;&middot;&middot;</p>}
    </div>
  )
}

function HtmlBlock({ data }: { data: Record<string, unknown> }) {
  return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: String(data.html ?? '') }} />
}

function CardBlock({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--color-border)] overflow-hidden">
      {!!data.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={String(data.image)} alt="" className="w-full h-52 object-cover" />
      )}
      <div className="p-5">
        {!!data.title && <p className="font-bold text-lg mb-1">{String(data.title)}</p>}
        {!!data.text  && <p className="text-[var(--color-muted)] text-sm">{String(data.text)}</p>}
        {!!data.buttonLabel && (
          <a href={String(data.link ?? '#')} className="btn btn-primary mt-4 text-sm">
            {String(data.buttonLabel)}
          </a>
        )}
      </div>
    </div>
  )
}

function AccordionBlock({ data }: { data: Record<string, unknown> }) {
  const items = (data.items as { question: string; answer: string }[]) ?? []
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <details
          key={i}
          className="rounded-[var(--radius-sm)] border border-[var(--color-border)] overflow-hidden group"
        >
          <summary className="px-5 py-4 font-semibold cursor-pointer select-none flex items-center justify-between">
            {item.question}
            <span className="shrink-0 ml-3 transition-transform group-open:rotate-45 text-[var(--color-primary)] text-xl leading-none">+</span>
          </summary>
          <div className="px-5 py-4 text-[var(--color-muted)] border-t border-[var(--color-border)]">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  )
}

function TestimonialBlock({ data }: { data: Record<string, unknown> }) {
  const rating = Number(data.rating ?? 5)
  return (
    <div className="rounded-[var(--radius)] border border-[var(--color-border)] p-6 bg-[var(--color-surface)]">
      <div className="text-[var(--color-accent)] mb-3">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</div>
      <p className="text-lg italic mb-5">&ldquo;{String(data.text ?? '')}&rdquo;</p>
      <div className="flex items-center gap-3">
        {!!data.avatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={String(data.avatar)} alt="" className="w-11 h-11 rounded-full object-cover" />
        )}
        <div>
          <p className="font-semibold text-sm">{String(data.name ?? '')}</p>
          {(!!data.role || !!data.company) && (
            <p className="text-xs text-[var(--color-muted)]">
              {[data.role, data.company].filter(Boolean).map(String).join(' · ')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function CtaBlock({ data }: { data: Record<string, unknown> }) {
  const bgStyle = String(data.bgStyle ?? 'gradient')
  const bg: Record<string, string> = {
    gradient: 'from-[var(--color-primary)] to-blue-700 bg-gradient-to-r text-white',
    flat:     'bg-[var(--color-primary)] text-white',
    image:    'bg-[var(--color-surface)]',
  }
  return (
    <div className={`rounded-[var(--radius-lg)] p-10 text-center ${bg[bgStyle] ?? bg.gradient}`}>
      {!!data.title && <p className="text-3xl font-bold mb-2">{String(data.title)}</p>}
      {!!data.description && <p className="opacity-80 mb-6">{String(data.description)}</p>}
      {!!data.buttonLabel && (
        <a href={String(data.buttonUrl ?? '#')} className="btn bg-white text-[var(--color-primary)] font-semibold">
          {String(data.buttonLabel)}
        </a>
      )}
    </div>
  )
}

// ─── New module renderers ─────────────────────────────────────────────────────

/** Lucide-compatible SVG icon stub. Renders a placeholder circle+name when a
 *  real icon library is not loaded. Replace with a proper Lucide dynamic import
 *  if you need pixel-perfect icons at runtime. */
function LucideIcon({ name, size = 24, color }: { name: string; size?: number; color?: string }) {
  /* Common Lucide icons mapped to minimal inline SVG paths. */
  const icons: Record<string, string> = {
    'check':       'M20 6L9 17l-5-5',
    'x':           'M18 6L6 18M6 6l12 12',
    'star':        'M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z',
    'heart':       'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z',
    'mail':        'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm16 2l-8 5-8-5',
    'phone':       'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z',
    'map-pin':     'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zm-9 3a3 3 0 100-6 3 3 0 000 6z',
    'clock':       'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-14v4l3 3',
    'zap':         'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    'shield':      'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    'award':       'M12 15l-3.09 1.64.59-3.44L7 10.82l3.45-.5L12 7.5l1.55 2.82 3.45.5-2.5 2.38.59 3.44z M7.21 15L5.45 21 12 17.27 18.55 21l-1.76-6',
    'users':       'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
    'settings':    'M12 15a3 3 0 100-6 3 3 0 000 6z',
    'globe':       'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm-8-10h16M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z',
    'trending-up': 'M23 6l-9.5 9.5-5-5L1 18',
    'target':      'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-6a4 4 0 100-8 4 4 0 000 8zm0-2a2 2 0 100-4 2 2 0 000 4z',
    'code':        'M16 18l6-6-6-6M8 6l-6 6 6 6',
    'layout':      'M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm0 6H5m4-6v16',
    'layers':      'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    'cpu':         'M18 12h2m-2-4h2m-2 8h2M4 12H2m2-4H2m2 8H2m8-14V2m4 0v2M8 22v-2m4 2v-2m2-2H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2z',
  }

  const pathData = icons[name]
  if (pathData) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color ?? 'currentColor'}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {pathData.split(' M').map((d, i) => (
          <path key={i} d={i === 0 ? d : `M${d}`} />
        ))}
      </svg>
    )
  }

  /* Fallback: render a circle with the first letter */
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="none" stroke={color ?? 'currentColor'} strokeWidth="1.5" />
      <text x="12" y="16" textAnchor="middle" fontSize="11" fill={color ?? 'currentColor'} fontFamily="var(--font-sans)">
        {(name ?? '?')[0]?.toUpperCase()}
      </text>
    </svg>
  )
}

function BlurbBlock({ data }: { data: Record<string, unknown> }) {
  const iconName  = String(data.icon ?? 'star')
  const title     = String(data.title ?? '')
  const text      = String(data.text ?? '')
  const iconColor = String(data.iconColor ?? 'var(--color-primary)')

  return (
    <div className="glass rounded-[var(--radius-lg)]" style={{ padding: '2rem', textAlign: 'center' }}>
      <div style={{
        display:        'inline-flex',
        alignItems:     'center',
        justifyContent: 'center',
        width:          '3.5rem',
        height:         '3.5rem',
        borderRadius:   '50%',
        backgroundColor: `color-mix(in srgb, ${iconColor} 15%, transparent)`,
        color:          iconColor,
        marginBottom:   '1rem',
      }}>
        <LucideIcon name={iconName} size={24} color={iconColor} />
      </div>
      {title && <p style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>{title}</p>}
      {text && <p style={{ color: 'var(--color-muted)', fontSize: '0.9375rem', lineHeight: 1.7 }}>{text}</p>}
    </div>
  )
}

function IconBlock({ data }: { data: Record<string, unknown> }) {
  const name  = String(data.name ?? 'star')
  const size  = Number(data.size ?? 48)
  const color = String(data.color ?? 'var(--color-primary)')

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <LucideIcon name={name} size={size} color={color} />
    </div>
  )
}

function CounterBlock({ data }: { data: Record<string, unknown> }) {
  const number   = String(data.number ?? '0')
  const suffix   = String(data.suffix ?? '')
  const title    = String(data.title ?? '')
  const duration = Number(data.duration ?? 2)

  return (
    <div style={{ textAlign: 'center' }}>
      <p
        style={{
          fontSize:   'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: 800,
          lineHeight: 1.1,
          color:      'var(--color-primary)',
        }}
        data-counter-target={number}
        data-counter-duration={duration}
      >
        {number}{suffix}
      </p>
      {title && (
        <p style={{ marginTop: '0.5rem', color: 'var(--color-muted)', fontSize: '0.9375rem' }}>
          {title}
        </p>
      )}
    </div>
  )
}

function TabsBlock({ data }: { data: Record<string, unknown> }) {
  const items = (data.items as { label: string; content: string }[]) ?? []
  if (!items.length) return null

  /* CSS-only tabs using radio inputs. Each tab group gets a unique name
     derived from the first label to avoid collisions on the same page. */
  const groupId = `tabs-${(items[0]?.label ?? '').replace(/\W/g, '').slice(0, 12)}-${Math.random().toString(36).slice(2, 6)}`

  return (
    <div className="glass rounded-[var(--radius-lg)]" style={{ overflow: 'hidden' }}>
      {/* Tab bar */}
      <div style={{
        display:      'flex',
        borderBottom: '1px solid var(--color-border)',
        overflowX:    'auto',
      }}>
        {items.map((item, i) => {
          const inputId = `${groupId}-${i}`
          return (
            <label
              key={i}
              htmlFor={inputId}
              style={{
                padding:      '0.875rem 1.5rem',
                cursor:       'pointer',
                fontWeight:   600,
                fontSize:     '0.875rem',
                whiteSpace:   'nowrap',
                borderBottom: '2px solid transparent',
                color:        'var(--color-muted)',
                transition:   'color 0.15s, border-color 0.15s',
              }}
            >
              {item.label}
            </label>
          )
        })}
      </div>

      {/* Tab panels implemented with details/summary for no-JS support */}
      {items.map((item, i) => (
        <details key={i} open={i === 0}>
          <summary style={{
            padding:    '0.75rem 1.5rem',
            fontWeight: 600,
            fontSize:   '0.875rem',
            cursor:     'pointer',
            color:      'var(--color-primary)',
            borderBottom: '1px solid var(--color-border)',
          }}>
            {item.label}
          </summary>
          <div style={{ padding: '1.5rem', color: 'var(--color-muted)', lineHeight: 1.7 }}>
            {item.content}
          </div>
        </details>
      ))}
    </div>
  )
}

function SliderBlock({ data }: { data: Record<string, unknown> }) {
  const slides = (data.slides as { title?: string; text?: string; image?: string; buttonLabel?: string; buttonUrl?: string }[]) ?? []
  if (!slides.length) return null

  return (
    <div style={{
      display:      'flex',
      overflowX:    'auto',
      scrollSnapType: 'x mandatory',
      gap:          '1.5rem',
      paddingBottom: '0.5rem',
    }}>
      {slides.map((slide, i) => (
        <div
          key={i}
          className="glass rounded-[var(--radius-lg)]"
          style={{
            flex:           '0 0 min(100%, 36rem)',
            scrollSnapAlign: 'start',
            overflow:       'hidden',
          }}
        >
          {slide.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slide.image}
              alt={slide.title ?? ''}
              style={{ width: '100%', height: '14rem', objectFit: 'cover' }}
            />
          )}
          <div style={{ padding: '1.5rem' }}>
            {slide.title && (
              <p style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                {slide.title}
              </p>
            )}
            {slide.text && (
              <p style={{ color: 'var(--color-muted)', fontSize: '0.9375rem', lineHeight: 1.7, marginBottom: '1rem' }}>
                {slide.text}
              </p>
            )}
            {slide.buttonLabel && (
              <a href={slide.buttonUrl ?? '#'} className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
                {slide.buttonLabel}
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function PricingBlock({ data }: { data: Record<string, unknown> }) {
  const title       = String(data.title ?? '')
  const price       = String(data.price ?? '')
  const period      = String(data.period ?? '')
  const features    = String(data.features ?? '').split('\n').filter(Boolean)
  const buttonLabel = String(data.buttonLabel ?? '')
  const buttonUrl   = String(data.buttonUrl ?? '#')
  const featured    = data.featured === true

  return (
    <div
      className="glass rounded-[var(--radius-lg)]"
      style={{
        padding:    '2rem',
        textAlign:  'center',
        border:     featured ? '2px solid var(--color-primary)' : undefined,
        position:   'relative',
      }}
    >
      {featured && (
        <div style={{
          position:        'absolute',
          top:             '-0.75rem',
          left:            '50%',
          transform:       'translateX(-50%)',
          background:      'var(--color-primary)',
          color:           '#fff',
          padding:         '0.25rem 1rem',
          borderRadius:    '999px',
          fontSize:        '0.75rem',
          fontWeight:      700,
          textTransform:   'uppercase',
          letterSpacing:   '0.05em',
        }}>
          Popular
        </div>
      )}

      {title && <p style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.75rem' }}>{title}</p>}

      <p style={{ marginBottom: '0.25rem' }}>
        <span style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800 }}>{price}</span>
        {period && (
          <span style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginLeft: '0.25rem' }}>
            /{period}
          </span>
        )}
      </p>

      {features.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '1.5rem 0', textAlign: 'left' }}>
          {features.map((feat, i) => (
            <li key={i} style={{
              padding:     '0.5rem 0',
              borderBottom: i < features.length - 1 ? '1px solid var(--color-border)' : undefined,
              fontSize:    '0.9375rem',
              display:     'flex',
              alignItems:  'center',
              gap:         '0.5rem',
              color:       'var(--color-muted)',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {feat}
            </li>
          ))}
        </ul>
      )}

      {buttonLabel && (
        <a
          href={buttonUrl}
          className={featured ? 'btn btn-primary' : 'btn btn-outline'}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {buttonLabel}
        </a>
      )}
    </div>
  )
}

function TeamBlock({ data }: { data: Record<string, unknown> }) {
  const name  = String(data.name ?? '')
  const role  = String(data.role ?? '')
  const photo = data.photo ? String(data.photo) : ''
  const bio   = String(data.bio ?? '')

  return (
    <div className="glass rounded-[var(--radius-lg)]" style={{ overflow: 'hidden', textAlign: 'center' }}>
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt={name}
          style={{ width: '100%', height: '16rem', objectFit: 'cover' }}
        />
      )}
      <div style={{ padding: '1.5rem' }}>
        {name && <p style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.25rem' }}>{name}</p>}
        {role && <p style={{ color: 'var(--color-primary)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{role}</p>}
        {bio && <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', lineHeight: 1.7 }}>{bio}</p>}
      </div>
    </div>
  )
}

/** Social platform → SVG icon path mapping */
const SOCIAL_ICONS: Record<string, { viewBox: string; path: string }> = {
  facebook:  { viewBox: '0 0 24 24', path: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' },
  twitter:   { viewBox: '0 0 24 24', path: 'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z' },
  x:         { viewBox: '0 0 24 24', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
  instagram: { viewBox: '0 0 24 24', path: 'M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 011.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772 4.915 4.915 0 01-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.248-.637-.416-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.416 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 100 10 5 5 0 000-10zm6.5-.25a1.25 1.25 0 10-2.5 0 1.25 1.25 0 002.5 0zM12 9a3 3 0 110 6 3 3 0 010-6z' },
  linkedin:  { viewBox: '0 0 24 24', path: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 2a2 2 0 110 4 2 2 0 010-4z' },
  youtube:   { viewBox: '0 0 24 24', path: 'M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.4 19.6C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 001.94-2A29 29 0 0023 12a29.001 29.001 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z' },
  github:    { viewBox: '0 0 24 24', path: 'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z' },
  tiktok:    { viewBox: '0 0 24 24', path: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.43v-7.15a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-.81-1.91 4.84 4.84 0 01.62-2z' },
}

function SocialBlock({ data }: { data: Record<string, unknown> }) {
  const items = (data.items as { platform: string; url: string }[]) ?? []
  if (!items.length) return null

  return (
    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
      {items.map((item, i) => {
        const platform = item.platform?.toLowerCase() ?? ''
        const icon = SOCIAL_ICONS[platform]

        return (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.platform}
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              justifyContent: 'center',
              width:          '2.75rem',
              height:         '2.75rem',
              borderRadius:   '50%',
              border:         '1px solid var(--color-border)',
              color:          'var(--color-muted)',
              transition:     'color 0.15s, border-color 0.15s',
            }}
          >
            {icon ? (
              <svg width="18" height="18" viewBox={icon.viewBox} fill="currentColor" aria-hidden="true">
                <path d={icon.path} />
              </svg>
            ) : (
              <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                {platform.slice(0, 2)}
              </span>
            )}
          </a>
        )
      })}
    </div>
  )
}

function FormBlock({ data }: { data: Record<string, unknown> }) {
  const fields      = (data.fields as { name: string; type?: string; label?: string; placeholder?: string; required?: boolean }[]) ?? []
  const submitLabel = String(data.submitLabel ?? 'Submit')
  const action      = String(data.action ?? '')

  return (
    <form
      action={action || undefined}
      method={action ? 'POST' : undefined}
      className="glass rounded-[var(--radius-lg)]"
      style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    >
      {fields.map((field, i) => {
        const type = field.type ?? 'text'
        const id   = `form-field-${field.name ?? i}`

        if (type === 'textarea') {
          return (
            <div key={i}>
              {field.label && (
                <label htmlFor={id} style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  {field.label}
                </label>
              )}
              <textarea
                id={id}
                name={field.name}
                placeholder={field.placeholder}
                required={field.required}
                rows={4}
                style={{
                  width:           '100%',
                  padding:         '0.75rem 1rem',
                  borderRadius:    'var(--radius-sm)',
                  border:          '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color:           'var(--color-fg)',
                  fontFamily:      'var(--font-sans)',
                  fontSize:        '0.9375rem',
                  resize:          'vertical',
                }}
              />
            </div>
          )
        }

        if (type === 'select') {
          return (
            <div key={i}>
              {field.label && (
                <label htmlFor={id} style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  {field.label}
                </label>
              )}
              <select
                id={id}
                name={field.name}
                required={field.required}
                style={{
                  width:           '100%',
                  padding:         '0.75rem 1rem',
                  borderRadius:    'var(--radius-sm)',
                  border:          '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color:           'var(--color-fg)',
                  fontFamily:      'var(--font-sans)',
                  fontSize:        '0.9375rem',
                }}
              >
                <option value="">{field.placeholder ?? 'Select...'}</option>
              </select>
            </div>
          )
        }

        return (
          <div key={i}>
            {field.label && (
              <label htmlFor={id} style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 600, fontSize: '0.875rem' }}>
                {field.label}
              </label>
            )}
            <input
              id={id}
              type={type}
              name={field.name}
              placeholder={field.placeholder}
              required={field.required}
              style={{
                width:           '100%',
                padding:         '0.75rem 1rem',
                borderRadius:    'var(--radius-sm)',
                border:          '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color:           'var(--color-fg)',
                fontFamily:      'var(--font-sans)',
                fontSize:        '0.9375rem',
              }}
            />
          </div>
        )
      })}

      <div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

function SpacerBlock({ data }: { data: Record<string, unknown> }) {
  const height = String(data.height ?? '3rem')
  return <div style={{ height }} aria-hidden="true" />
}

// ─── Single block item ────────────────────────────────────────────────────────

const MAX_DEPTH = 6

function BlockItem({ block, depth = 0 }: { block: Block; depth?: number }) {
  if (depth > MAX_DEPTH) return null

  const st = block.style ?? {}
  if (st.hidden) return null

  // Fix media URLs (strip localhost references from dev uploads)
  const data = { ...block.data }
  for (const key of ['url', 'image', 'photo', 'avatar', 'bgImage'] as const) {
    if (typeof data[key] === 'string') data[key] = fixUrl(data[key])
  }
  const fixedBlock = { ...block, data }

  let content: ReactNode

  switch (fixedBlock.type) {
    // ── Structural (Divi-like hierarchy) ──
    case 'section':
      content = <SectionBlock data={data} blockChildren={block.children} depth={depth} />
      break
    case 'row':
      content = <RowBlock data={data} blockChildren={block.children} depth={depth} />
      break
    case 'column':
      content = <ColumnBlock blockChildren={block.children} depth={depth} />
      break

    // ── Legacy layout ──
    case 'columns':
      content = <ColumnsBlock data={data} depth={depth} />
      break

    // ── Original modules ──
    case 'heading':     content = <HeadingBlock     data={data} />;  break
    case 'paragraph':   content = <ParagraphBlock   data={data} />;  break
    case 'image':       content = <ImageBlock       data={data} />;  break
    case 'gallery':     content = <GalleryBlock     data={data} />;  break
    case 'button':      content = <ButtonBlock      data={data} />;  break
    case 'video':       content = <VideoBlock       data={data} />;  break
    case 'code':        content = <CodeBlock        data={data} />;  break
    case 'quote':       content = <QuoteBlock       data={data} />;  break
    case 'divider':     content = <DividerBlock     data={data} />;  break
    case 'html':        content = <HtmlBlock        data={data} />;  break
    case 'card':        content = <CardBlock        data={data} />;  break
    case 'accordion':   content = <AccordionBlock   data={data} />;  break
    case 'testimonial': content = <TestimonialBlock data={data} />;  break
    case 'cta':         content = <CtaBlock         data={data} />;  break

    // ── New modules ──
    case 'blurb':       content = <BlurbBlock       data={data} />;  break
    case 'icon':        content = <IconBlock        data={data} />;  break
    case 'counter':     content = <CounterBlock     data={data} />;  break
    case 'tabs':        content = <TabsBlock        data={data} />;  break
    case 'slider':      content = <SliderBlock      data={data} />;  break
    case 'pricing':     content = <PricingBlock     data={data} />;  break
    case 'team':        content = <TeamBlock        data={data} />;  break
    case 'social':      content = <SocialBlock      data={data} />;  break
    case 'form':        content = <FormBlock        data={data} />;  break
    case 'spacer':      content = <SpacerBlock      data={data} />;  break

    default: return null
  }

  return (
    <BlockWrapper style={block.style}>
      {content}
    </BlockWrapper>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

interface BlockRendererProps {
  blocks:    Block[]
  className?: string
  gap?:       string
}

export function BlockRenderer({ blocks, className, gap = 'space-y-6' }: BlockRendererProps) {
  if (!blocks?.length) return null
  return (
    <div className={[gap, className].filter(Boolean).join(' ')}>
      {blocks.map((block) => (
        <BlockItem key={block.id} block={block} />
      ))}
    </div>
  )
}
