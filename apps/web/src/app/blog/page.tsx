import type { Metadata }  from 'next'
import { PostCard }        from '@/components/blog/post-card'
import { Reveal }          from '@/components/gsap/reveal'
import { cms }             from '@/lib/cms'

export const revalidate = 60

export const metadata: Metadata = {
  title:       'Blog',
  description: 'Artykuły i aktualności z naszego bloga.',
}

export default async function BlogPage() {
  const posts = await cms.content
    .list<{ excerpt?: string; cover?: string }>('post', { status: 'published', limit: 24 })
    .catch(() => ({ data: [], meta: { total: 0, page: 1, limit: 24, pages: 0 } }))

  return (
    <div style={{ paddingTop: '8rem', paddingBottom: 'var(--section-y)' }}>
      <div className="container">
        <Reveal style={{ marginBottom: '3.5rem' }}>
          <p className="section-label" style={{ marginBottom: '0.75rem' }}>Blog</p>
          <h1 className="display" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: '1rem' }}>
            Artykuły
          </h1>
          <p style={{ fontSize: '1.0625rem', color: 'var(--color-muted)', maxWidth: '520px' }}>
            Dzielimy się wiedzą, doświadczeniem i aktualnościami ze świata technologii.
          </p>
        </Reveal>

        {posts.data.length === 0 ? (
          <Reveal>
            <div
              className="glass"
              style={{ borderRadius: 'var(--radius-lg)', padding: '4rem 2rem', textAlign: 'center' }}
            >
              <p style={{ color: 'var(--color-muted)', fontSize: '1.0625rem' }}>
                Brak opublikowanych wpisów.
              </p>
            </div>
          </Reveal>
        ) : (
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap:                 '1.25rem',
          }}>
            {posts.data.map((post, i) => (
              <Reveal key={post.id} delay={i * 0.06}>
                <PostCard post={post} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
