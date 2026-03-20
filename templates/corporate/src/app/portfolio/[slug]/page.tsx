import type { Metadata }      from 'next'
import { notFound }            from 'next/navigation'
import Image                   from 'next/image'
import Link                    from 'next/link'
import { ArrowLeft }           from 'lucide-react'
import { contentMetadata, makeStaticParams } from '@/sdk/nextjs'
import { BlockRenderer }       from '@/components/blocks/block-renderer'
import { cms }                 from '@/lib/cms'

export const revalidate = 60

interface ProjectData {
  excerpt?:  string
  cover?:    string
  tags?:     string[]
  client?:   string
  url?:      string
  content?:  string
  blocks?:   { id: string; type: string; data: Record<string, unknown> }[]
}

export const generateStaticParams = makeStaticParams(() => cms.content.slugs('project'))

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  try {
    const res = await cms.content.get<ProjectData>('project', slug)
    return contentMetadata(res) as Metadata
  } catch {
    return { title: 'Projekt' }
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let res: Awaited<ReturnType<typeof cms.content.get<ProjectData>>>
  try {
    res = await cms.content.get<ProjectData>('project', slug)
  } catch {
    notFound()
  }

  const { item } = res.data

  return (
    <article style={{ paddingTop: '8rem', paddingBottom: 'var(--section-y)' }}>
      <div className="container" style={{ maxWidth: '900px' }}>

        {/* Back link */}
        <Link
          href="/portfolio"
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            '0.375rem',
            fontSize:       '0.875rem',
            color:          'var(--color-muted)',
            textDecoration: 'none',
            marginBottom:   '2.5rem',
          }}
        >
          <ArrowLeft size={15} /> Portfolio
        </Link>

        {/* Header */}
        <header style={{ marginBottom: '3rem' }}>
          {item.data.client && (
            <p style={{ fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '0.75rem' }}>
              {item.data.client}
            </p>
          )}
          <h1
            className="display"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', lineHeight: 1.15, marginBottom: '1.25rem' }}
          >
            {item.title}
          </h1>

          {item.data.excerpt && (
            <p style={{ fontSize: '1.125rem', color: 'var(--color-muted)', lineHeight: 1.65 }}>
              {item.data.excerpt}
            </p>
          )}

          {/* Tags + URL */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
            {item.data.tags?.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize:     '0.8125rem',
                  fontWeight:   500,
                  padding:      '0.25em 0.75em',
                  borderRadius: '999px',
                  background:   'var(--color-surface)',
                  border:       '1px solid var(--color-border)',
                  color:        'var(--color-muted)',
                }}
              >
                {tag}
              </span>
            ))}
            {item.data.url && (
              <a
                href={item.data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ fontSize: '0.875rem', padding: '0.4rem 1.1rem' }}
              >
                Odwiedź projekt ↗
              </a>
            )}
          </div>
        </header>

        {/* Cover */}
        {item.data.cover && (
          <div style={{
            position:     'relative',
            height:       'clamp(240px, 45vw, 520px)',
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

        {/* Blocks content */}
        {item.data.blocks && item.data.blocks.length > 0 && (
          <BlockRenderer blocks={item.data.blocks} />
        )}

        {/* Fallback HTML content */}
        {(!item.data.blocks || item.data.blocks.length === 0) && item.data.content && (
          <div
            className="prose"
            style={{ fontSize: '1.0625rem', lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: item.data.content }}
          />
        )}
      </div>
    </article>
  )
}
