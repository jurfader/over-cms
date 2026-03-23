'use client'

import type { CSSProperties, ReactNode } from 'react'
import { Image as ImageIcon, Video as VideoIcon, FileCode } from 'lucide-react'
import type { Block, BlockStyle, BlockType } from './types'

// ─── BlockStyle → CSSProperties ───────────────────────────────────────────────

export function styleToCSS(style?: BlockStyle): CSSProperties {
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
  if (style.textColor)     css.color          = style.textColor
  if (style.textAlign)     css.textAlign      = style.textAlign
  if (style.fontFamily)    css.fontFamily     = style.fontFamily
  if (style.fontSize)      css.fontSize       = style.fontSize
  if (style.fontWeight)    css.fontWeight     = style.fontWeight as CSSProperties['fontWeight']
  if (style.fontStyle)     css.fontStyle      = style.fontStyle
  if (style.lineHeight)    css.lineHeight     = style.lineHeight
  if (style.letterSpacing) css.letterSpacing  = style.letterSpacing
  if (style.textTransform) css.textTransform  = style.textTransform
  if (style.textDecoration) css.textDecoration = style.textDecoration

  // Spacing
  if (style.marginTop)    css.marginTop    = style.marginTop
  if (style.marginRight)  css.marginRight  = style.marginRight
  if (style.marginBottom) css.marginBottom = style.marginBottom
  if (style.marginLeft)   css.marginLeft   = style.marginLeft
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

  // Box shadow
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
  if (style.rotate     && style.rotate     !== '0')  transforms.push(`rotate(${style.rotate}deg)`)
  if (style.scaleX     && style.scaleX     !== '1')  transforms.push(`scaleX(${style.scaleX})`)
  if (style.scaleY     && style.scaleY     !== '1')  transforms.push(`scaleY(${style.scaleY})`)
  if (style.translateX && style.translateX !== '0px') transforms.push(`translateX(${style.translateX})`)
  if (style.translateY && style.translateY !== '0px') transforms.push(`translateY(${style.translateY})`)
  if (style.skewX      && style.skewX      !== '0')  transforms.push(`skewX(${style.skewX}deg)`)
  if (style.skewY      && style.skewY      !== '0')  transforms.push(`skewY(${style.skewY}deg)`)
  if (transforms.length) css.transform = transforms.join(' ')

  return css
}

// ─── Block wrapper (handles bg image overlay) ─────────────────────────────────

function BlockWrapper({ style, children }: { style?: BlockStyle; children: ReactNode }) {
  const css = styleToCSS(style)
  const cls = style?.customClass ?? ''
  const hasOverlay = style?.bgType === 'image' && style?.bgOverlayColor

  return (
    <div style={css} className={cls}>
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

// ─── Individual block renderers ────────────────────────────────────────────────

type RenderProps = { data: Record<string, unknown> }

function HeadingRender({ data }: RenderProps) {
  const level = Number(data.level ?? 2)
  const sizes = ['','text-5xl','text-4xl','text-3xl','text-2xl','text-xl','text-lg']
  return (
    <p className={`font-bold ${sizes[level] ?? 'text-3xl'} leading-tight`}>
      {String(data.text ?? 'Nagłówek')}
    </p>
  )
}

function ParagraphRender({ data }: RenderProps) {
  return <p className="leading-relaxed text-base">{String(data.text ?? '')}</p>
}

function ImageRender({ data }: RenderProps) {
  if (data.url) {
    return (
      <figure>
        <img src={String(data.url)} alt={String(data.alt ?? '')} className="w-full rounded object-cover max-h-96" />
        {!!data.caption && <figcaption className="text-xs text-center mt-1 opacity-60">{String(data.caption)}</figcaption>}
      </figure>
    )
  }
  return (
    <div className="flex items-center justify-center h-32 rounded border-2 border-dashed border-gray-300 bg-gray-50">
      <div className="text-center text-gray-400">
        <ImageIcon className="w-8 h-8 mx-auto mb-1" />
        <p className="text-xs">Obraz</p>
      </div>
    </div>
  )
}

function GalleryRender({ data }: RenderProps) {
  const images = (data.images as string[]) ?? []
  if (!images.length) {
    return (
      <div className="flex items-center justify-center h-24 rounded border-2 border-dashed border-gray-300 bg-gray-50">
        <p className="text-xs text-gray-400">Galeria (brak zdjęć)</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-3 gap-1">
      {images.map((url, i) => (
        <img key={i} src={url} alt="" className="w-full h-24 object-cover rounded" />
      ))}
    </div>
  )
}

function ButtonRender({ data }: RenderProps) {
  const variant = data.variant as string ?? 'primary'
  const base = 'inline-flex items-center justify-center px-5 py-2.5 rounded text-sm font-semibold transition-colors'
  const variants: Record<string, string> = {
    primary:   'bg-pink-600 text-white',
    secondary: 'bg-gray-200 text-gray-900',
    outline:   'border-2 border-pink-600 text-pink-600',
    ghost:     'text-pink-600 underline',
  }
  return (
    <div>
      <span className={`${base} ${variants[variant] ?? variants.primary}`}>
        {String(data.label ?? 'Kliknij')}
      </span>
    </div>
  )
}

function VideoRender({ data }: RenderProps) {
  const url = String(data.url ?? '')
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)

  if (ytMatch) {
    return (
      <div className="relative aspect-video rounded overflow-hidden bg-black">
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
      <div className="relative aspect-video rounded overflow-hidden bg-black">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
        />
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center h-32 rounded border-2 border-dashed border-gray-300 bg-gray-50">
      <div className="text-center text-gray-400">
        <VideoIcon className="w-8 h-8 mx-auto mb-1" />
        <p className="text-xs">{url || 'Video (brak URL)'}</p>
      </div>
    </div>
  )
}

function CodeRender({ data }: RenderProps) {
  return (
    <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded overflow-x-auto">
      <code>{String(data.code ?? '')}</code>
    </pre>
  )
}

function QuoteRender({ data }: RenderProps) {
  return (
    <blockquote className="border-l-4 border-pink-500 pl-4 py-1">
      <p className="text-lg italic">&ldquo;{String(data.text ?? '')}&rdquo;</p>
      {(!!data.author || !!data.role) && (
        <footer className="mt-2 text-sm opacity-60">
          {String(data.author ?? '')}
          {!!data.role && <span className="ml-1">· {String(data.role)}</span>}
        </footer>
      )}
    </blockquote>
  )
}

function DividerRender({ data }: RenderProps) {
  const style = data.style as string ?? 'line'
  const spacing: Record<string, string> = { sm: '8px', md: '24px', lg: '48px' }
  const margin = spacing[data.spacing as string ?? 'md'] ?? '24px'
  return (
    <div style={{ margin: `${margin} 0` }}>
      {style === 'line'   && <hr className="border-gray-200" />}
      {style === 'dashed' && <hr className="border-dashed border-gray-200" />}
      {style === 'dots'   && <div className="text-center text-gray-300 tracking-widest">···</div>}
    </div>
  )
}

function HtmlRender({ data }: RenderProps) {
  return (
    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: String(data.html ?? '') }} />
  )
}

function ColumnsRender({ data }: RenderProps) {
  const widths  = (data.widths  as number[]                                   | undefined) ?? [50, 50]
  const columns = (data.columns as { id: string; blocks: Block[] }[] | undefined)

  return (
    <div className="flex gap-4 items-start">
      {widths.map((w, i) => {
        const blocks = columns?.[i]?.blocks ?? []
        return (
          <div key={i} style={{ width: `${w}%`, flexShrink: 0 }}>
            {blocks.length > 0 ? (
              blocks.map((block) => (
                <BlockPreviewItem key={block.id} block={block} device="desktop" />
              ))
            ) : (
              <div className="min-h-[60px] rounded border border-dashed border-gray-200 flex items-center justify-center">
                <p className="text-xs text-gray-400">Kol. {i + 1}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function CardRender({ data }: RenderProps) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {!!data.image && (
        <img src={String(data.image)} alt="" className="w-full h-48 object-cover" />
      )}
      <div className="p-4">
        {!!data.title && <p className="font-bold text-lg mb-1">{String(data.title)}</p>}
        {!!data.text  && <p className="text-sm text-gray-600">{String(data.text)}</p>}
        {!!data.buttonLabel && (
          <span className="mt-3 inline-block px-4 py-1.5 bg-pink-600 text-white text-sm rounded font-medium">
            {String(data.buttonLabel)}
          </span>
        )}
      </div>
    </div>
  )
}

function AccordionRender({ data }: RenderProps) {
  const items = (data.items as { question: string; answer: string }[]) ?? []
  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <details key={i} className="rounded border border-gray-200 overflow-hidden group">
          <summary className="px-4 py-3 font-medium cursor-pointer select-none bg-gray-50 hover:bg-gray-100 text-sm">
            {item.question || `Pytanie ${i + 1}`}
          </summary>
          <div className="px-4 py-3 text-sm text-gray-600 border-t border-gray-200">
            {item.answer || '—'}
          </div>
        </details>
      ))}
    </div>
  )
}

function TestimonialRender({ data }: RenderProps) {
  const rating = Number(data.rating ?? 5)
  return (
    <div className="p-6 rounded-xl bg-gray-50 border border-gray-100">
      <div className="text-yellow-400 text-lg mb-3">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</div>
      <p className="text-base italic mb-4">&ldquo;{String(data.text ?? '')}&rdquo;</p>
      <div className="flex items-center gap-3">
        {!!data.avatar && (
          <img src={String(data.avatar)} alt="" className="w-10 h-10 rounded-full object-cover" />
        )}
        <div>
          <p className="font-semibold text-sm">{String(data.name ?? '')}</p>
          {(!!data.role || !!data.company) && (
            <p className="text-xs text-gray-500">
              {[data.role, data.company].filter(Boolean).map(String).join(' · ')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function CtaRender({ data }: RenderProps) {
  const bgStyle = data.bgStyle as string ?? 'gradient'
  const bg: Record<string, string> = {
    gradient: 'bg-gradient-to-r from-pink-600 to-purple-600 text-white',
    dark:     'bg-gray-900 text-white',
    light:    'bg-gray-50 border border-gray-200',
  }
  return (
    <div className={`rounded-xl p-8 text-center ${bg[bgStyle] ?? bg.gradient}`}>
      {!!data.title && <p className="text-2xl font-bold mb-2">{String(data.title)}</p>}
      {!!data.description && <p className="text-sm opacity-80 mb-4">{String(data.description)}</p>}
      {!!data.buttonLabel && (
        <span className="inline-block px-6 py-2.5 bg-white text-pink-600 rounded-lg font-semibold text-sm shadow">
          {String(data.buttonLabel)}
        </span>
      )}
    </div>
  )
}

// ─── Render map ───────────────────────────────────────────────────────────────

const RENDER_MAP: Record<BlockType, React.FC<RenderProps>> = {
  heading:     HeadingRender,
  paragraph:   ParagraphRender,
  image:       ImageRender,
  gallery:     GalleryRender,
  button:      ButtonRender,
  video:       VideoRender,
  code:        CodeRender,
  quote:       QuoteRender,
  divider:     DividerRender,
  html:        HtmlRender,
  columns:     ColumnsRender,
  card:        CardRender,
  accordion:   AccordionRender,
  testimonial: TestimonialRender,
  cta:         CtaRender,
}

// ─── Single block preview ─────────────────────────────────────────────────────

function BlockPreviewItem({ block, device }: { block: Block; device: string }) {
  const st = block.style ?? {}

  // Visibility
  if (st.hidden) return null
  if (device === 'desktop' && st.hideDesktop) return null
  if (device === 'tablet'  && st.hideTablet)  return null
  if (device === 'mobile'  && st.hideMobile)  return null

  const Renderer = RENDER_MAP[block.type]

  return (
    <BlockWrapper style={block.style}>
      {Renderer
        ? <Renderer data={block.data} />
        : <div className="p-3 text-xs text-gray-400 bg-gray-50 rounded border border-dashed">{block.type}</div>
      }
    </BlockWrapper>
  )
}

// ─── Full blocks preview ──────────────────────────────────────────────────────

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile'

const DEVICE_WIDTHS: Record<PreviewDevice, string> = {
  desktop: '100%',
  tablet:  '768px',
  mobile:  '375px',
}

interface BlocksPreviewProps {
  blocks: Block[]
  device: PreviewDevice
}

export function BlocksPreview({ blocks, device }: BlocksPreviewProps) {
  const width = DEVICE_WIDTHS[device]

  return (
    <div className="h-full overflow-y-auto bg-gray-100 p-4 scrollbar-thin">
      <div
        className="bg-white min-h-full mx-auto shadow-xl rounded overflow-hidden transition-all duration-300"
        style={{ width, maxWidth: '100%' }}
      >
        {blocks.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <FileCode className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-400">Brak bloków do podglądu</p>
            </div>
          </div>
        ) : (
          <div>
            {blocks.map((block) => (
              <BlockPreviewItem key={block.id} block={block} device={device} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
