import type { Metadata } from 'next'
import { notFound }      from 'next/navigation'
import { getPageBySlug, getAllPageSlugs } from '@/lib/cms'
import { PageRenderer }  from '@/components/page-renderer'

export const revalidate = 60

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await getAllPageSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  if (!page) return {}

  return {
    title:       page.seo?.title       ?? page.title,
    description: page.seo?.description ?? undefined,
    openGraph: {
      title:       page.seo?.ogTitle       ?? page.seo?.title ?? page.title,
      description: page.seo?.ogDescription ?? page.seo?.description ?? undefined,
      images:      page.seo?.ogImage ? [page.seo.ogImage] : undefined,
    },
  }
}

export default async function DynamicPage({ params }: Props) {
  const { slug } = await params
  const page = await getPageBySlug(slug)

  if (!page) notFound()

  return <PageRenderer page={page} />
}
