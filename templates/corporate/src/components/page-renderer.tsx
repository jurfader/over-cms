import type { CmsPage } from '@/lib/cms'
import { BlockRenderer } from '@/components/blocks/block-renderer'

interface PageRendererProps {
  page: CmsPage
  /** Hide the page title (e.g. homepage where blocks provide their own heading) */
  hideTitle?: boolean
}

export function PageRenderer({ page, hideTitle }: PageRendererProps) {
  const blocks  = Array.isArray(page.data.blocks) ? page.data.blocks : null
  const content = typeof page.data.content === 'string' ? page.data.content : null

  // Block-based page
  if (blocks && blocks.length > 0) {
    return (
      <>
        {!hideTitle && (
          <section style={{ paddingTop: '9rem', paddingBottom: 'var(--section-y)', background: 'var(--color-surface)' }}>
            <div className="container" style={{ maxWidth: '800px' }}>
              <h1
                className="display"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
              >
                {page.title}
              </h1>
            </div>
          </section>
        )}
        <BlockRenderer blocks={blocks} />
      </>
    )
  }

  // HTML content page
  if (content) {
    return (
      <section style={{ paddingTop: '9rem', paddingBottom: 'var(--section-y)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          {!hideTitle && (
            <h1
              className="display"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', marginBottom: '2.5rem' }}
            >
              {page.title}
            </h1>
          )}
          <div
            style={{ fontSize: '1.0625rem', lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </section>
    )
  }

  // Empty page — only title
  return (
    <section style={{ paddingTop: '9rem', paddingBottom: 'var(--section-y)' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1
          className="display"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
        >
          {page.title}
        </h1>
      </div>
    </section>
  )
}
