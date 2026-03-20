import type { OverCMSClient }                          from '../client'
import type { MediaItem, MediaListOptions, PaginatedResponse } from '../types'

export class MediaModule {
  constructor(private client: OverCMSClient) {}

  /** List media items. */
  async list(options: MediaListOptions = {}): Promise<PaginatedResponse<MediaItem>> {
    const params = new URLSearchParams()
    if (options.page)  params.set('page',  String(options.page))
    if (options.limit) params.set('limit', String(options.limit))
    if (options.type)  params.set('type',  options.type)
    const qs = params.toString()
    return this.client.fetch(`/api/media${qs ? `?${qs}` : ''}`)
  }

  /** Get a single media item by id. */
  async get(id: string): Promise<{ data: MediaItem }> {
    return this.client.fetch(`/api/media/${id}`)
  }
}
