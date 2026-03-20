/**
 * Next.js App Router helpers for OverCMS.
 *
 * Usage (app/[slug]/page.tsx):
 *
 *   import { cms } from '@/lib/cms'
 *   import { contentMetadata, makeStaticParams } from '@/sdk/nextjs'
 *
 *   export const generateStaticParams = makeStaticParams(() => cms.content.slugs('post'))
 *   export async function generateMetadata({ params }) {
 *     const res = await cms.content.get('post', params.slug)
 *     return contentMetadata(res)
 *   }
 */

import type { ContentItemWithAuthor, SeoData } from './types'

/**
 * Minimal Next.js-compatible Metadata shape.
 * Avoids a hard dependency on the `next` package from within the SDK.
 * Assignable to Next.js `Metadata` because of the index signature.
 */
export interface CMSMetadata {
  title?:       string | { template?: string; default: string }
  description?: string
  keywords?:    string[]
  robots?:      { index?: boolean; follow?: boolean }
  alternates?:  { canonical?: string }
  openGraph?:   { title?: string; description?: string; images?: string[] }
  twitter?:     { card?: string; title?: string }
  [key: string]: unknown
}

// ─── Metadata builders ────────────────────────────────────────────────────────

export function buildMetadata(
  seo: SeoData | null | undefined,
  defaults: CMSMetadata = {},
): CMSMetadata {
  if (!seo) return defaults

  return {
    ...defaults,
    title:       seo.title       ?? defaults.title,
    description: seo.description ?? defaults.description,
    keywords:    seo.keywords    ?? defaults.keywords,
    robots: {
      index:  !(seo.noIndex  ?? false),
      follow: !(seo.noFollow ?? false),
    },
    alternates: seo.canonicalUrl
      ? { canonical: seo.canonicalUrl }
      : defaults.alternates,
    openGraph: {
      title:       seo.ogTitle       ?? seo.title       ?? (defaults.title as string | undefined),
      description: seo.ogDescription ?? seo.description ?? defaults.description,
      images:      seo.ogImage ? [seo.ogImage] : undefined,
    },
    twitter: seo.twitterCard
      ? {
          card:  seo.twitterCard,
          title: seo.ogTitle ?? seo.title ?? (defaults.title as string | undefined),
        }
      : undefined,
  }
}

/** Build Next.js-compatible Metadata from a ContentItemWithAuthor response. */
export function contentMetadata<TData = Record<string, unknown>>(
  res: { data: ContentItemWithAuthor<TData> },
  defaults: CMSMetadata = {},
): CMSMetadata {
  const { item } = res.data
  return buildMetadata(item.seo, {
    title: item.title,
    ...defaults,
  })
}

// ─── generateStaticParams ─────────────────────────────────────────────────────

/**
 * Create a generateStaticParams function for a content type.
 *
 * @example
 * // app/blog/[slug]/page.tsx
 * import { cms } from '@/lib/cms'
 * export const generateStaticParams = makeStaticParams(() => cms.content.slugs('post'))
 */
export function makeStaticParams(
  getSlugs: () => Promise<string[]>,
): () => Promise<{ slug: string }[]> {
  return async () => {
    const slugs = await getSlugs()
    return slugs.map((slug) => ({ slug }))
  }
}
