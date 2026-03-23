import type { Metadata } from 'next'
import { getPageBySlug } from '@/lib/cms'
import { PageRenderer }  from '@/components/page-renderer'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug('home')
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

export default async function HomePage() {
  const page = await getPageBySlug('home')

  if (!page) {
    return (
      <section style={{ paddingTop: '9rem', paddingBottom: 'var(--section-y)' }}>
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
          <h1
            className="display"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: '1.5rem' }}
          >
            Brak strony
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '1.0625rem' }}>
            Strona o slugu &quot;home&quot; nie istnieje w CMS. Dodaj stron&#281; typu
            &quot;page&quot; ze slugiem &quot;home&quot;, aby wy&#347;wietli&#263;
            stron&#281; g&#322;&#243;wn&#261;.
          </p>
        </div>
      </section>
    )
  }

  return <PageRenderer page={page} hideTitle />
}
