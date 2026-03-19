export type SeoData = {
  title?: string
  description?: string
  keywords?: string[]
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  twitterCard?: 'summary' | 'summary_large_image'
  canonicalUrl?: string
  noIndex?: boolean
  noFollow?: boolean
  jsonLd?: Record<string, unknown>
}
