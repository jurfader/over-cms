import type { OverCMSClient } from '../client'
import type { Settings }      from '../types'

export class SettingsModule {
  constructor(private client: OverCMSClient) {}

  /** Fetch all public settings as a flat key→value record. */
  async all(): Promise<Settings> {
    const res = await this.client.fetch<{ data: Settings }>('/api/settings')
    return res.data ?? {}
  }

  /** Get a single setting by key. */
  async get<T = unknown>(key: string): Promise<T | undefined> {
    const all = await this.all()
    return all[key] as T | undefined
  }
}
