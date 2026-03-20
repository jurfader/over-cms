import type { CSSProperties, ReactNode } from 'react'
import type { BlockStyle } from '@/sdk/core-types'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Block {
  id:     string
  type:   string
  data:   Record<string, unknown>
  style?: BlockStyle
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

// ─── Individual block renderers ───────────────────────────────────────────────

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
          {!!data.role && <span className="ml-1 opacity-70">· {String(data.role)}</span>}
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
      {style === 'dots'  && <p className="text-center text-[var(--color-muted)] tracking-widest">···</p>}
    </div>
  )
}

function HtmlBlock({ data }: { data: Record<string, unknown> }) {
  return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: String(data.html ?? '') }} />
}

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

// ─── Single block item ────────────────────────────────────────────────────────

const MAX_DEPTH = 4

function BlockItem({ block, depth = 0 }: { block: Block; depth?: number }) {
  if (depth > MAX_DEPTH) return null

  const st = block.style ?? {}
  if (st.hidden) return null

  let content: ReactNode

  switch (block.type) {
    case 'heading':     content = <HeadingBlock     data={block.data} />;  break
    case 'paragraph':   content = <ParagraphBlock   data={block.data} />;  break
    case 'image':       content = <ImageBlock       data={block.data} />;  break
    case 'gallery':     content = <GalleryBlock     data={block.data} />;  break
    case 'button':      content = <ButtonBlock      data={block.data} />;  break
    case 'video':       content = <VideoBlock       data={block.data} />;  break
    case 'code':        content = <CodeBlock        data={block.data} />;  break
    case 'quote':       content = <QuoteBlock       data={block.data} />;  break
    case 'divider':     content = <DividerBlock     data={block.data} />;  break
    case 'html':        content = <HtmlBlock        data={block.data} />;  break
    case 'columns':     content = <ColumnsBlock     data={block.data} depth={depth} />; break
    case 'card':        content = <CardBlock        data={block.data} />;  break
    case 'accordion':   content = <AccordionBlock   data={block.data} />;  break
    case 'testimonial': content = <TestimonialBlock data={block.data} />;  break
    case 'cta':         content = <CtaBlock         data={block.data} />;  break
    default:            return null
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
