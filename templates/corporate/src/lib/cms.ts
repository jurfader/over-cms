import { createClient } from '@/sdk'

export const cms = createClient({
  apiUrl:     process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  apiKey:     process.env.OVERCMS_API_KEY,
  revalidate: 60,
})

// ─── Actual API response shape ────────────────────────────────────────────────
// The API returns { data: [{ item: ContentItem, author: Author }][] }
// but SDK types say PaginatedResponse<ContentItem> — we unwrap correctly here.

type ItemWrapper<T> = { item: { id: string; slug: string; data: T } }
type RawList<T>     = { data: ItemWrapper<T>[]; meta: unknown }

/** Fetch first published item of a singleton content type. Returns null if API unreachable or no data. */
export async function getSingleton<T>(typeSlug: string): Promise<T | null> {
  try {
    const raw = await cms.fetch<RawList<T>>(
      `/api/content/${typeSlug}?status=published&limit=1`,
    )
    return raw.data[0]?.item?.data ?? null
  } catch {
    return null
  }
}

/** Fetch all published items of a collection. Returns [] if API unreachable. */
export async function getCollection<T>(typeSlug: string): Promise<(T & { _id: string })[]> {
  try {
    const raw = await cms.fetch<RawList<T>>(
      `/api/content/${typeSlug}?status=published&limit=100&sort=createdAt&order=asc`,
    )
    return raw.data.map((e) => ({ ...e.item.data, _id: e.item.id }))
  } catch {
    return []
  }
}

// ─── Page helpers ────────────────────────────────────────────────────────────

export interface CmsPage {
  id:    string
  slug:  string
  title: string
  data:  Record<string, unknown>
  seo:   { title?: string; description?: string; ogTitle?: string; ogDescription?: string; ogImage?: string } | null
}

type RawSingle<T> = { data: { item: { id: string; slug: string; title: string; data: T; seo: CmsPage['seo']; status: string } } }

/** Fetch a single published page by slug. Returns null if not found or API unreachable. */
export async function getPageBySlug(slug: string): Promise<CmsPage | null> {
  // Try direct slug lookup first
  try {
    const raw = await cms.fetch<RawSingle<Record<string, unknown>>>(
      `/api/content/page/${slug}`,
    )
    const item = raw?.data?.item
    if (item && item.status === 'published') {
      return { id: item.id, slug: item.slug, title: item.title, data: item.data, seo: item.seo }
    }
  } catch { /* fallback below */ }

  // Fallback: fetch all published pages and find by slug
  try {
    const raw = await cms.fetch<RawList<Record<string, unknown>>>(
      `/api/content/page?status=published&limit=100`,
    )
    const match = raw.data.find((e) => e.item.slug === slug)
    if (!match) return null
    const item = match.item as { id: string; slug: string; title: string; data: Record<string, unknown>; seo: CmsPage['seo'] }
    return { id: item.id, slug: item.slug, title: item.title, data: item.data, seo: item.seo }
  } catch {
    return null
  }
}

// ─── Global templates (header/footer) ─────────────────────────────────────────

export interface GlobalTemplate {
  blocks: Array<Record<string, unknown>>
}

/** Fetch global header blocks. Returns null if not configured. */
export async function getGlobalHeader(): Promise<GlobalTemplate | null> {
  return getSingleton<GlobalTemplate>('global_header')
}

/** Fetch global footer blocks. Returns null if not configured. */
export async function getGlobalFooter(): Promise<GlobalTemplate | null> {
  return getSingleton<GlobalTemplate>('global_footer')
}

/** Fetch all published page slugs — for generateStaticParams. */
export async function getAllPageSlugs(): Promise<string[]> {
  try {
    const raw = await cms.fetch<RawList<unknown>>(
      `/api/content/page?status=published&limit=500`,
    )
    return raw.data.map((e) => e.item.slug).filter((s) => s !== 'home')
  } catch {
    return []
  }
}
