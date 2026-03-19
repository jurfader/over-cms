export type ContentStatus = 'draft' | 'published' | 'scheduled' | 'archived'

export type FieldType =
  | 'text' | 'textarea' | 'richtext' | 'number' | 'boolean'
  | 'date' | 'image' | 'file' | 'relation' | 'repeater'
  | 'select' | 'slug' | 'color' | 'json'

export interface FieldDefinition {
  id: string
  name: string
  label: string
  type: FieldType
  required: boolean
  unique?: boolean
  defaultValue?: unknown
  options?: string[]
  relationTo?: string
  fields?: FieldDefinition[]
  validation?: { min?: number; max?: number; pattern?: string }
}

export interface ContentType {
  id: string
  slug: string
  name: string
  icon: string | null
  fieldsSchema: FieldDefinition[]
  isSingleton: boolean
  createdAt: string
  updatedAt: string
}

export interface ContentItem {
  id: string
  typeId: string
  slug: string
  title: string
  data: Record<string, unknown>
  status: ContentStatus
  seo: SeoData | null
  authorId: string | null
  publishedAt: string | null
  scheduledAt: string | null
  createdAt: string
  updatedAt: string
}

export interface SeoData {
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
}

export interface ContentItemWithAuthor {
  item: ContentItem
  author: { id: string; name: string; email: string } | null
}
