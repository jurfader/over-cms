import type { BlockStyle } from '../types/block-style'

// ─── BlockStyle → scoped CSS string ───────────────────────────────────────────
//
// Zamiast inline styles na każdym bloku, generujemy jeden <style> tag
// z unikalnym selektorem `.block-{id}`. Zalety:
//   • przeglądarka parsuje CSS raz i cachuje
//   • mniejszy HTML (bez atrybutu style="" na każdym elemencie)
//   • lepszy Lighthouse / Core Web Vitals
//   • możliwość pseudo-klas (:hover, ::before dla overlay)

function px(v?: string): string { return v ?? '0px' }

export function blockStyleToCSS(blockId: string, style?: BlockStyle): string {
  if (!style) return ''

  const rules: string[] = []
  const sel = `.block-${blockId}`

  // Background
  if (style.bgType === 'color' && style.bgColor) {
    rules.push(`background-color:${style.bgColor}`)
  } else if (style.bgType === 'gradient') {
    const angle = style.bgGradientAngle ?? '135'
    const from  = style.bgGradientFrom ?? '#000'
    const to    = style.bgGradientTo   ?? '#fff'
    rules.push(`background:linear-gradient(${angle}deg,${from},${to})`)
  } else if (style.bgType === 'image' && style.bgImage) {
    rules.push(`background-image:url(${style.bgImage})`)
    rules.push(`background-size:${style.bgSize ?? 'cover'}`)
    rules.push(`background-position:${style.bgPosition ?? 'center'}`)
    rules.push(`background-repeat:${style.bgRepeat ?? 'no-repeat'}`)
    rules.push('position:relative')
  }

  // Typography
  if (style.textColor)     rules.push(`color:${style.textColor}`)
  if (style.textAlign)     rules.push(`text-align:${style.textAlign}`)
  if (style.fontFamily)    rules.push(`font-family:${style.fontFamily}`)
  if (style.fontSize)      rules.push(`font-size:${style.fontSize}`)
  if (style.fontWeight)    rules.push(`font-weight:${style.fontWeight}`)
  if (style.fontStyle)     rules.push(`font-style:${style.fontStyle}`)
  if (style.lineHeight)    rules.push(`line-height:${style.lineHeight}`)
  if (style.letterSpacing) rules.push(`letter-spacing:${style.letterSpacing}`)
  if (style.textTransform) rules.push(`text-transform:${style.textTransform}`)
  if (style.textDecoration)rules.push(`text-decoration:${style.textDecoration}`)

  // Spacing
  const m = (k: string, v?: string) => v && rules.push(`${k}:${v}`)
  m('margin-top',     style.marginTop)
  m('margin-right',   style.marginRight)
  m('margin-bottom',  style.marginBottom)
  m('margin-left',    style.marginLeft)
  m('padding-top',    style.paddingTop)
  m('padding-right',  style.paddingRight)
  m('padding-bottom', style.paddingBottom)
  m('padding-left',   style.paddingLeft)

  // Size
  m('width',      style.width)
  m('max-width',  style.maxWidth)
  m('height',     style.height)
  m('min-height', style.minHeight)

  // Border
  m('border-top-width',           style.borderTopWidth)
  m('border-right-width',         style.borderRightWidth)
  m('border-bottom-width',        style.borderBottomWidth)
  m('border-left-width',          style.borderLeftWidth)
  if (style.borderStyle)          rules.push(`border-style:${style.borderStyle}`)
  if (style.borderColor)          rules.push(`border-color:${style.borderColor}`)
  m('border-top-left-radius',     style.borderTopLeftRadius)
  m('border-top-right-radius',    style.borderTopRightRadius)
  m('border-bottom-right-radius', style.borderBottomRightRadius)
  m('border-bottom-left-radius',  style.borderBottomLeftRadius)

  // Box shadow
  if (style.shadowX || style.shadowY || style.shadowBlur) {
    const parts = [
      style.shadowInset ? 'inset' : '',
      px(style.shadowX),
      px(style.shadowY),
      px(style.shadowBlur),
      px(style.shadowSpread),
      style.shadowColor ?? 'rgba(0,0,0,.15)',
    ].filter(Boolean)
    rules.push(`box-shadow:${parts.join(' ')}`)
  }

  // Filters
  const filters: string[] = []
  if (style.opacity)                        rules.push(`opacity:${parseFloat(style.opacity) / 100}`)
  if (style.blur)                           filters.push(`blur(${style.blur}px)`)
  if (style.brightness && style.brightness !== '100') filters.push(`brightness(${style.brightness}%)`)
  if (style.contrast   && style.contrast   !== '100') filters.push(`contrast(${style.contrast}%)`)
  if (style.saturate   && style.saturate   !== '100') filters.push(`saturate(${style.saturate}%)`)
  if (style.grayscale  && style.grayscale  !== '0')   filters.push(`grayscale(${style.grayscale}%)`)
  if (filters.length) rules.push(`filter:${filters.join(' ')}`)

  // Transform
  const tf: string[] = []
  if (style.rotate     && style.rotate     !== '0')   tf.push(`rotate(${style.rotate}deg)`)
  if (style.scaleX     && style.scaleX     !== '1')   tf.push(`scaleX(${style.scaleX})`)
  if (style.scaleY     && style.scaleY     !== '1')   tf.push(`scaleY(${style.scaleY})`)
  if (style.translateX && style.translateX !== '0px') tf.push(`translateX(${style.translateX})`)
  if (style.translateY && style.translateY !== '0px') tf.push(`translateY(${style.translateY})`)
  if (style.skewX      && style.skewX      !== '0')   tf.push(`skewX(${style.skewX}deg)`)
  if (style.skewY      && style.skewY      !== '0')   tf.push(`skewY(${style.skewY}deg)`)
  if (tf.length) rules.push(`transform:${tf.join(' ')}`)

  // Custom inline CSS
  if (style.customCss) rules.push(style.customCss.trim())

  if (!rules.length) return ''

  let css = `${sel}{${rules.join(';')}}`

  // Visibility
  if (style.hideDesktop) css += `@media(min-width:1024px){${sel}{display:none!important}}`
  if (style.hideTablet)  css += `@media(min-width:768px) and (max-width:1023px){${sel}{display:none!important}}`
  if (style.hideMobile)  css += `@media(max-width:767px){${sel}{display:none!important}}`
  if (style.hidden)      css += `${sel}{display:none!important}`

  // Background image overlay
  if (style.bgType === 'image' && style.bgOverlayColor) {
    const opacity = parseFloat(style.bgOverlayOpacity ?? '50') / 100
    css += `${sel}::before{content:'';position:absolute;inset:0;background-color:${style.bgOverlayColor};opacity:${opacity};pointer-events:none}`
  }

  return css
}

// ─── Generate <style> tag for a list of blocks ────────────────────────────────

export interface BlockLike {
  id:     string
  style?: BlockStyle
}

export function blocksToStyleTag(blocks: BlockLike[]): string {
  const css = blocks
    .map((b) => blockStyleToCSS(b.id, b.style))
    .filter(Boolean)
    .join('')

  return css ? `<style>${css}</style>` : ''
}

// ─── React className for a block ──────────────────────────────────────────────
//  Used in JSX: <div className={blockClass(block.id, block.style?.customClass)}>

export function blockClass(id: string, customClass?: string): string {
  return ['block-' + id, customClass].filter(Boolean).join(' ')
}
