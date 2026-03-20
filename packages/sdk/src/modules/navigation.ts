import type { OverCMSClient } from '../client'
import type { NavItem }       from '../types'

export class NavigationModule {
  constructor(private client: OverCMSClient) {}

  /** Fetch a navigation menu by name (e.g. 'main', 'footer', 'mobile'). */
  async get(name: string): Promise<NavItem[]> {
    const res = await this.client.fetch<{ data: NavItem[] }>(
      `/api/settings/navigation/${name}`,
    )
    return Array.isArray(res.data) ? res.data : []
  }
}
