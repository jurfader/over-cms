import type { OverCMSClient }                                        from '../client'
import type { ContentItem, ContentItemWithAuthor, ContentListOptions, PaginatedResponse } from '../types'

export class ContentModule {
  constructor(private client: OverCMSClient) {}

  /** List items of a content type with pagination. */
  async list<TData = Record<string, unknown>>(
    typeSlug: string,
    options: ContentListOptions = {},
  ): Promise<PaginatedResponse<ContentItem<TData>>> {
    const params = new URLSearchParams()
    if (options.page)   params.set('page',   String(options.page))
    if (options.limit)  params.set('limit',  String(options.limit))
    if (options.status) params.set('status', options.status)
    const qs = params.toString()
    return this.client.fetch(`/api/content/${typeSlug}${qs ? `?${qs}` : ''}`)
  }

  /** Get a single item by slug or id. */
  async get<TData = Record<string, unknown>>(
    typeSlug: string,
    slugOrId: string,
  ): Promise<{ data: ContentItemWithAuthor<TData> }> {
    return this.client.fetch(`/api/content/${typeSlug}/${slugOrId}`)
  }

  /** Fetch a singleton content type (first published item). */
  async singleton<TData = Record<string, unknown>>(
    typeSlug: string,
  ): Promise<ContentItem<TData> | null> {
    try {
      const res = await this.list<TData>(typeSlug, { limit: 1, status: 'published' })
      return res.data[0] ?? null
    } catch {
      return null
    }
  }

  /** List all published slugs of a type — useful for generateStaticParams. */
  async slugs(typeSlug: string): Promise<string[]> {
    const res = await this.list(typeSlug, { limit: 1000, status: 'published' })
    return res.data.map((item) => item.slug)
  }
}
