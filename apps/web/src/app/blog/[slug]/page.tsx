import type { Metadata }      from 'next'
import { notFound }            from 'next/navigation'
import Image                   from 'next/image'
import { contentMetadata, makeStaticParams } from '@overcms/sdk/nextjs'
import { cms }                 from '@/lib/cms'

export const revalidate = 60

interface PostData {
  excerpt?: string
  cover?:   string
  content?: string
}

export const generateStaticParams = makeStaticParams(() => cms.content.slugs('post'))

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  try {
    const res = await cms.content.get<PostData>('post', slug)
    return contentMetadata(res) as Metadata
  } catch {
    return { title: 'Artykuł' }
  }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let res: Awaited<ReturnType<typeof cms.content.get<PostData>>>
  try {
    res = await cms.content.get<PostData>('post', slug)
  } catch {
    notFound()
  }

  const { item } = res.data
  const date = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <article style={{ paddingTop: '8rem', paddingBottom: 'var(--section-y)' }}>
      <div className="container" style={{ maxWidth: '780px' }}>
        {/* Meta */}
        <header style={{ marginBottom: '3rem' }}>
          {date && (
            <time style={{ fontSize: '0.875rem', color: 'var(--color-muted)', display: 'block', marginBottom: '1rem' }}>
              {date}
            </time>
          )}
          <h1
            className="display"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', lineHeight: 1.15, marginBottom: '1.25rem' }}
          >
            {item.title}
          </h1>
          {item.data.excerpt && (
            <p style={{ fontSize: '1.1875rem', color: 'var(--color-muted)', lineHeight: 1.65 }}>
              {item.data.excerpt}
            </p>
          )}
        </header>

        {/* Cover */}
        {item.data.cover && (
          <div style={{
            position:     'relative',
            height:       'clamp(240px, 40vw, 480px)',
            borderRadius: 'var(--radius-lg)',
            overflow:     'hidden',
            marginBottom: '3rem',
          }}>
            <Image
              src={item.data.cover}
              alt={item.title}
              fill
              priority
              style={{ objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Body */}
        {item.data.content && (
          <div
            style={{
              fontSize:   '1.0625rem',
              lineHeight: 1.8,
              color:      'var(--color-fg)',
            }}
            dangerouslySetInnerHTML={{ __html: item.data.content }}
          />
        )}
      </div>
    </article>
  )
}
