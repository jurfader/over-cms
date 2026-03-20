import type { OverCMSClient } from '../client'
import type { SeoData }       from '../types'

export class SeoModule {
  constructor(private client: OverCMSClient) {}

  /** Fetch global SEO settings. */
  async global(): Promise<SeoData> {
    const res = await this.client.fetch<{ data: SeoData }>('/api/seo/global')
    return res.data ?? {}
  }
}
