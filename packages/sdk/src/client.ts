import type { OverCMSConfig } from './types'
import { ContentModule }    from './modules/content'
import { MediaModule }      from './modules/media'
import { NavigationModule } from './modules/navigation'
import { SettingsModule }   from './modules/settings'
import { SeoModule }        from './modules/seo'

// ─── Internal fetch wrapper ────────────────────────────────────────────────────

export class OverCMSClient {
  readonly config: Required<Pick<OverCMSConfig, 'apiUrl'>> & OverCMSConfig

  readonly content:    ContentModule
  readonly media:      MediaModule
  readonly navigation: NavigationModule
  readonly settings:   SettingsModule
  readonly seo:        SeoModule

  constructor(config: OverCMSConfig) {
    this.config     = config
    this.content    = new ContentModule(this)
    this.media      = new MediaModule(this)
    this.navigation = new NavigationModule(this)
    this.settings   = new SettingsModule(this)
    this.seo        = new SeoModule(this)
  }

  async fetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    const { apiUrl, apiKey, cache = 'force-cache', revalidate } = this.config

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    }
    if (apiKey) headers['X-API-Key'] = apiKey

    const nextOptions: Record<string, unknown> = {}
    if (typeof revalidate === 'number') {
      nextOptions['revalidate'] = revalidate === 0 ? false : revalidate
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fetchInit: any = {
      ...init,
      headers,
      cache: revalidate === 0 ? 'no-store' : cache,
    }
    if (Object.keys(nextOptions).length) fetchInit.next = nextOptions

    const res = await fetch(`${apiUrl}${path}`, fetchInit as RequestInit)

    if (!res.ok) {
      let message = `OverCMS API error ${res.status}`
      try {
        const body = await res.json() as { error?: string }
        if (body.error) message = body.error
      } catch { /* ignore */ }
      throw new Error(message)
    }

    return res.json() as Promise<T>
  }
}

// ─── Factory ───────────────────────────────────────────────────────────────────

export function createClient(config: OverCMSConfig): OverCMSClient {
  return new OverCMSClient(config)
}
