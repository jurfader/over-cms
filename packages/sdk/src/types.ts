// ─── Config ───────────────────────────────────────────────────────────────────

export interface OverCMSConfig {
  /** Base URL of the OverCMS API, e.g. 'https://api.example.com' */
  apiUrl: string
  /** Optional API key sent as X-API-Key header */
  apiKey?: string
  /** Default fetch cache strategy (default: 'force-cache' for ISR) */
  cache?: 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache' | 'only-if-cached'
  /** Default ISR revalidation in seconds. 0 = no-store. */
  revalidate?: number
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationMeta {
  total:  number
  page:   number
  limit:  number
  pages:  number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

// ─── Content ──────────────────────────────────────────────────────────────────

export type ContentStatus = 'draft' | 'published' | 'scheduled' | 'archived'

export interface SeoData {
  title?:           string
  description?:     string
  keywords?:        string[]
  ogTitle?:         string
  ogDescription?:   string
  ogImage?:         string
  twitterCard?:     'summary' | 'summary_large_image'
  canonicalUrl?:    string
  noIndex?:         boolean
  noFollow?:        boolean
}

export interface ContentItem<TData = Record<string, unknown>> {
  id:           string
  typeId:       string
  slug:         string
  title:        string
  data:         TData
  status:       ContentStatus
  seo:          SeoData | null
  authorId:     string | null
  publishedAt:  string | null
  scheduledAt:  string | null
  createdAt:    string
  updatedAt:    string
}

export interface ContentItemWithAuthor<TData = Record<string, unknown>> {
  item:   ContentItem<TData>
  author: { id: string; name: string; email: string } | null
}

export interface ContentListOptions {
  page?:   number
  limit?:  number
  status?: ContentStatus
}

// ─── Media ────────────────────────────────────────────────────────────────────

export interface MediaItem {
  id:           string
  filename:     string
  originalName: string
  url:          string
  size:         number
  mimeType:     string
  width:        number | null
  height:       number | null
  alt:          string | null
  caption:      string | null
  folder:       string
  tags:         string[]
  createdAt:    string
}

export interface MediaListOptions {
  page?:  number
  limit?: number
  type?:  'image' | 'file'
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export interface NavItem {
  id:       string
  label:    string
  url:      string
  target:   '_self' | '_blank'
  children: NavItem[]
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export type Settings = Record<string, unknown>
