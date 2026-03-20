'use client'

import Link                from 'next/link'
import Image               from 'next/image'
import { ArrowRight }      from 'lucide-react'
import type { ContentItem } from '@overcms/sdk'

interface PostData {
  excerpt?:  string
  cover?:    string
}

interface PostCardProps {
  post: ContentItem<PostData>
}

export function PostCard({ post }: PostCardProps) {
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <article
      className="glass"
      style={{
        borderRadius:  'var(--radius-lg)',
        overflow:      'hidden',
        display:       'flex',
        flexDirection: 'column',
        transition:    'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px color-mix(in oklch, var(--color-fg) 6%, transparent)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.transform = 'none'
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
      }}
    >
      {/* Cover image */}
      {post.data.cover && (
        <div style={{ position: 'relative', height: '220px', overflow: 'hidden', background: 'var(--color-surface)' }}>
          <Image
            src={post.data.cover}
            alt={post.title}
            fill
            style={{ objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '1.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {date && (
          <time style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
            {date}
          </time>
        )}
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.35 }}>
          {post.title}
        </h3>
        {post.data.excerpt && (
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-muted)', lineHeight: 1.65, flex: 1 }}>
            {post.data.excerpt}
          </p>
        )}
        <Link
          href={`/blog/${post.slug}`}
          style={{
            display:    'inline-flex',
            alignItems: 'center',
            gap:        '0.375rem',
            fontSize:   '0.9rem',
            fontWeight: 600,
            color:      'var(--color-primary)',
            textDecoration: 'none',
            marginTop:  '0.5rem',
          }}
        >
          Czytaj dalej <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  )
}
