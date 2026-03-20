import type { Metadata }  from 'next'
import { Hero }           from '@/components/home/hero'
import { Services }       from '@/components/home/services'
import { AboutPreview }   from '@/components/home/about-preview'
import { Cta }            from '@/components/home/cta'
import { PostCard }       from '@/components/blog/post-card'
import { Reveal }         from '@/components/gsap/reveal'
import { cms }            from '@/lib/cms'

export const revalidate = 60

export const metadata: Metadata = {
  title:       'Strona główna',
  description: 'OverCMS — nowoczesny headless CMS dla Twojej strony.',
}

export default async function HomePage() {
  const [homepage, posts] = await Promise.all([
    cms.content.singleton<Record<string, string>>('homepage').catch(() => null),
    cms.content.list<{ excerpt?: string; cover?: string }>('post', { status: 'published', limit: 3 })
      .catch(() => ({ data: [], meta: { total: 0, page: 1, limit: 3, pages: 0 } })),
  ])

  const d = homepage?.data ?? {}

  return (
    <>
      <Hero
        title={d['hero_title']}
        subtitle={d['hero_subtitle']}
        ctaLabel={d['hero_cta_label']}
        ctaUrl={d['hero_cta_url']}
        badge={d['hero_badge']}
      />

      <Services
        title={d['services_title']}
        subtitle={d['services_subtitle']}
      />

      <AboutPreview
        title={d['about_title']}
        body={d['about_body']}
      />

      {/* Latest posts */}
      {posts.data.length > 0 && (
        <section style={{ padding: 'var(--section-y) 0', background: 'var(--color-surface)' }}>
          <div className="container">
            <Reveal style={{ marginBottom: '3rem' }}>
              <p className="section-label" style={{ marginBottom: '0.75rem' }}>Blog</p>
              <h2 className="display" style={{ fontSize: 'clamp(1.875rem, 4vw, 3rem)' }}>
                Ostatnie wpisy
              </h2>
            </Reveal>

            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap:                 '1.25rem',
            }}>
              {posts.data.map((post, i) => (
                <Reveal key={post.id} delay={i * 0.08}>
                  <PostCard post={post} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <Cta
        title={d['cta_title']}
        description={d['cta_description']}
      />
    </>
  )
}
