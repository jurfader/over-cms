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

// ─── New block renderers ──────────────────────────────────────────────────────

function SectionRender({ data }: RenderProps) {
  return (
    <div className={`p-4 rounded border-2 border-dashed border-blue-200 bg-blue-50/50 ${data.fullWidth ? 'w-full' : 'max-w-5xl mx-auto'}`}>
      <p className="text-xs text-blue-400 font-medium uppercase tracking-wide">
        Sekcja{data.fullWidth ? ' (pełna szerokość)' : ''}
      </p>
    </div>
  )
}

function RowRender({ data }: RenderProps) {
  const structure = (data.columnStructure as string) ?? '1'
  return (
    <div className="p-3 rounded border border-dashed border-purple-200 bg-purple-50/50">
      <p className="text-xs text-purple-400 font-medium">Wiersz · {structure}</p>
    </div>
  )
}

function ColumnRender({ data }: RenderProps) {
  const width = data.width as number | undefined
  return (
    <div className="p-2 rounded border border-dashed border-green-200 bg-green-50/50 min-h-[40px]">
      <p className="text-xs text-green-400 font-medium">Kolumna{width ? ` · ${width}%` : ''}</p>
    </div>
  )
}

function BlurbRender({ data }: RenderProps) {
  return (
    <div className="flex items-start gap-3 p-4">
      <div
        className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-lg shrink-0"
        style={data.iconColor ? { color: String(data.iconColor) } : undefined}
      >
        {String(data.icon ?? '★').charAt(0).toUpperCase()}
      </div>
      <div>
        {!!data.title && <p className="font-semibold text-base mb-1">{String(data.title)}</p>}
        {!!data.text && <p className="text-sm text-gray-600">{String(data.text)}</p>}
      </div>
    </div>
  )
}

function IconRender({ data }: RenderProps) {
  const size = Number(data.size ?? 48)
  return (
    <div className="flex items-center justify-center p-4">
      <div
        className="flex items-center justify-center rounded bg-gray-100"
        style={{ width: size, height: size, color: (data.color as string) || undefined }}
      >
        <span className="text-xs text-gray-500">{String(data.name ?? 'icon')}</span>
      </div>
    </div>
  )
}

function CounterRender({ data }: RenderProps) {
  return (
    <div className="text-center p-4">
      <p className="text-4xl font-bold text-pink-600">
        {String(data.number ?? 0)}{String(data.suffix ?? '')}
      </p>
      {!!data.title && <p className="text-sm text-gray-600 mt-1">{String(data.title)}</p>}
    </div>
  )
}

function TabsRender({ data }: RenderProps) {
  const items = (data.items as { label: string; content: string }[]) ?? []
  return (
    <div>
      <div className="flex border-b border-gray-200">
        {items.map((item, i) => (
          <div
            key={i}
            className={`px-4 py-2 text-sm font-medium ${i === 0 ? 'border-b-2 border-pink-600 text-pink-600' : 'text-gray-500'}`}
          >
            {item.label || `Tab ${i + 1}`}
          </div>
        ))}
      </div>
      {items.length > 0 && (
        <div className="p-4 text-sm text-gray-600">
          {items[0]?.content || '—'}
        </div>
      )}
    </div>
  )
}

function SliderRender({ data }: RenderProps) {
  const slides = (data.slides as { title: string; text: string; image: string }[]) ?? []
  const first = slides[0]
  return (
    <div className="relative rounded overflow-hidden bg-gray-100">
      {first?.image && (
        <img src={first.image} alt="" className="w-full h-48 object-cover" />
      )}
      <div className="p-4">
        {first?.title && <p className="font-bold text-lg">{first.title}</p>}
        {first?.text && <p className="text-sm text-gray-600 mt-1">{first.text}</p>}
        <p className="text-xs text-gray-400 mt-2">{slides.length} slajdów</p>
      </div>
    </div>
  )
}

function PricingRender({ data }: RenderProps) {
  const features = ((data.features as string) ?? '').split('\n').filter(Boolean)
  return (
    <div className={`rounded-xl border p-6 text-center ${data.featured ? 'border-pink-600 shadow-lg' : 'border-gray-200'}`}>
      {!!data.title && <p className="font-bold text-lg mb-2">{String(data.title)}</p>}
      {!!data.price && (
        <p className="text-3xl font-bold text-pink-600">
          {String(data.price)}
          {!!data.period && <span className="text-sm font-normal text-gray-500 ml-1">{String(data.period)}</span>}
        </p>
      )}
      {features.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm text-gray-600 text-left">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-green-500">✓</span> {f}
            </li>
          ))}
        </ul>
      )}
      {!!data.buttonLabel && (
        <span className="mt-4 inline-block px-6 py-2 bg-pink-600 text-white text-sm rounded-lg font-semibold">
          {String(data.buttonLabel)}
        </span>
      )}
    </div>
  )
}

function TeamRender({ data }: RenderProps) {
  return (
    <div className="text-center p-4">
      {!!data.photo && (
        <img src={String(data.photo)} alt="" className="w-24 h-24 rounded-full object-cover mx-auto mb-3" />
      )}
      {!!data.name && <p className="font-semibold text-base">{String(data.name)}</p>}
      {!!data.role && <p className="text-sm text-gray-500">{String(data.role)}</p>}
      {!!data.bio && <p className="text-sm text-gray-600 mt-2">{String(data.bio)}</p>}
    </div>
  )
}

function SocialRender({ data }: RenderProps) {
  const items = (data.items as { platform: string; url: string }[]) ?? []
  return (
    <div className="flex items-center gap-3 p-3">
      {items.map((item, i) => (
        <span
          key={i}
          className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 text-gray-600 text-xs font-medium"
          title={item.url}
        >
          {item.platform.slice(0, 2).toUpperCase()}
        </span>
      ))}
      {items.length === 0 && (
        <p className="text-xs text-gray-400">Social media (brak linków)</p>
      )}
    </div>
  )
}

function FormRender({ data }: RenderProps) {
  const fields = (data.fields as { label: string; type: string; required: boolean }[]) ?? []
  return (
    <div className="rounded border border-gray-200 p-4 space-y-3">
      {fields.map((field, i) => (
        <div key={i}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label || `Pole ${i + 1}`}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {field.type === 'textarea' ? (
            <div className="h-16 rounded border border-gray-200 bg-gray-50" />
          ) : (
            <div className="h-9 rounded border border-gray-200 bg-gray-50" />
          )}
        </div>
      ))}
      {!!data.submitLabel && (
        <span className="inline-block px-5 py-2 bg-pink-600 text-white text-sm rounded font-medium">
          {String(data.submitLabel)}
        </span>
      )}
    </div>
  )
}

function SpacerRender({ data }: RenderProps) {
  const height = (data.height as string) ?? '3rem'
  return (
    <div
      className="flex items-center justify-center border border-dashed border-gray-200 bg-gray-50/50 rounded"
      style={{ height }}
    >
      <p className="text-xs text-gray-400">Odstęp · {height}</p>
    </div>
  )
}

// ─── Render map ───────────────────────────────────────────────────────────────

const RENDER_MAP: Record<BlockType, React.FC<RenderProps>> = {
  // Structure
  section:     SectionRender,
  row:         RowRender,
  column:      ColumnRender,
  // Text
  heading:     HeadingRender,
  paragraph:   ParagraphRender,
  quote:       QuoteRender,
  code:        CodeRender,
  html:        HtmlRender,
  // Media
  image:       ImageRender,
  gallery:     GalleryRender,
  video:       VideoRender,
  icon:        IconRender,
  // Layout
  divider:     DividerRender,
  card:        CardRender,
  spacer:      SpacerRender,
  tabs:        TabsRender,
  // Interaction
  button:      ButtonRender,
  accordion:   AccordionRender,
  form:        FormRender,
  slider:      SliderRender,
  // Marketing
  cta:         CtaRender,
  testimonial: TestimonialRender,
  blurb:       BlurbRender,
  counter:     CounterRender,
  pricing:     PricingRender,
  team:        TeamRender,
  social:      SocialRender,
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
