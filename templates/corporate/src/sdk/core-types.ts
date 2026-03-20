// BlockStyle — shared type for the block renderer
// Copied from @overcms/core so this template is standalone

export interface BlockStyle {
  bgType?:          'none' | 'color' | 'gradient' | 'image'
  bgColor?:         string
  bgGradientFrom?:  string
  bgGradientTo?:    string
  bgGradientAngle?: string
  bgImage?:         string
  bgSize?:          'cover' | 'contain' | 'auto'
  bgPosition?:      string
  bgRepeat?:        'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y'
  bgOverlayColor?:  string
  bgOverlayOpacity?: string
  textColor?:       string
  textAlign?:       'left' | 'center' | 'right' | 'justify'
  fontFamily?:      string
  fontSize?:        string
  fontWeight?:      string
  fontStyle?:       'normal' | 'italic'
  lineHeight?:      string
  letterSpacing?:   string
  textTransform?:   'none' | 'uppercase' | 'lowercase' | 'capitalize'
  textDecoration?:  'none' | 'underline' | 'line-through'
  marginTop?:       string
  marginRight?:     string
  marginBottom?:    string
  marginLeft?:      string
  paddingTop?:      string
  paddingRight?:    string
  paddingBottom?:   string
  paddingLeft?:     string
  width?:           string
  maxWidth?:        string
  height?:          string
  minHeight?:       string
  borderTopWidth?:          string
  borderRightWidth?:        string
  borderBottomWidth?:       string
  borderLeftWidth?:         string
  borderStyle?:             'solid' | 'dashed' | 'dotted' | 'double' | 'none'
  borderColor?:             string
  borderTopLeftRadius?:     string
  borderTopRightRadius?:    string
  borderBottomRightRadius?: string
  borderBottomLeftRadius?:  string
  shadowX?:      string
  shadowY?:      string
  shadowBlur?:   string
  shadowSpread?: string
  shadowColor?:  string
  shadowInset?:  boolean
  opacity?:    string
  blur?:       string
  brightness?: string
  contrast?:   string
  saturate?:   string
  grayscale?:  string
  rotate?:     string
  scaleX?:     string
  scaleY?:     string
  translateX?: string
  translateY?: string
  skewX?:      string
  skewY?:      string
  hidden?:       boolean
  hideDesktop?:  boolean
  hideTablet?:   boolean
  hideMobile?:   boolean
  customClass?: string
  customCss?:   string
}
