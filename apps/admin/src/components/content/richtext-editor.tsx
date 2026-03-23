'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { useCallback } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
} from 'lucide-react'

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
}

/* ─── Toolbar Button ─────────────────────────────────────────────────────── */

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] transition-all duration-150
        disabled:opacity-30 disabled:cursor-not-allowed
        ${
          isActive
            ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)] shadow-sm'
            : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-foreground)]'
        }
      `}
    >
      {children}
    </button>
  )
}

function ToolbarSeparator() {
  return <div className="w-px h-5 bg-[var(--color-border-hover)] mx-1 shrink-0" />
}

/* ─── Editor Component ───────────────────────────────────────────────────── */

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const handleUpdate = useCallback(
    ({ editor }: { editor: { getHTML: () => string } }) => {
      onChange(editor.getHTML())
    },
    [onChange],
  )

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'richtext-link',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'richtext-image',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Zacznij pisać...',
      }),
    ],
    content: value,
    onUpdate: handleUpdate,
    immediatelyRender: false,
  })

  const addLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL:', previousUrl ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(() => {
    if (!editor) return
    const url = window.prompt('URL obrazka:', 'https://')
    if (!url) return
    editor.chain().focus().setImage({ src: url }).run()
  }, [editor])

  if (!editor) {
    return (
      <div className="w-full min-h-[356px] flex items-center justify-center bg-[var(--color-surface)] rounded-[var(--radius)]">
        <div className="w-6 h-6 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
      </div>
    )
  }

  const iconSize = 16

  return (
    <div className="richtext-editor-root rounded-[var(--radius)] overflow-hidden border border-[var(--color-border-hover)]">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 flex-wrap px-2 py-1.5 bg-[var(--color-surface)] border-b border-[var(--color-border-hover)]">
        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Pogrubienie"
        >
          <Bold size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Kursywa"
        >
          <Italic size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Podkreślenie"
        >
          <UnderlineIcon size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Przekreślenie"
        >
          <Strikethrough size={iconSize} />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Nagłówek 1"
        >
          <Heading1 size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Nagłówek 2"
        >
          <Heading2 size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Nagłówek 3"
        >
          <Heading3 size={iconSize} />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Lista punktowana"
        >
          <List size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Lista numerowana"
        >
          <ListOrdered size={iconSize} />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Link & Image */}
        <ToolbarButton
          onClick={addLink}
          isActive={editor.isActive('link')}
          title="Link"
        >
          <LinkIcon size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={addImage}
          title="Obrazek"
        >
          <ImageIcon size={iconSize} />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Text align */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Wyrównaj do lewej"
        >
          <AlignLeft size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Wyrównaj do środka"
        >
          <AlignCenter size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Wyrównaj do prawej"
        >
          <AlignRight size={iconSize} />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* History */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Cofnij"
        >
          <Undo size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Ponów"
        >
          <Redo size={iconSize} />
        </ToolbarButton>
      </div>

      {/* ── Editor Content ──────────────────────────────────────────────── */}
      <EditorContent editor={editor} className="richtext-editor-content" />

      {/* ── Scoped Styles ───────────────────────────────────────────────── */}
      <style>{`
        .richtext-editor-content .tiptap {
          min-height: 300px;
          padding: 1rem 1.25rem;
          background: var(--color-surface-elevated);
          color: var(--color-foreground);
          font-family: var(--font-sans);
          font-size: 0.9375rem;
          line-height: 1.7;
          outline: none;
          caret-color: var(--color-primary);
        }

        .richtext-editor-content .tiptap:focus {
          background: var(--color-surface-elevated);
        }

        /* Placeholder */
        .richtext-editor-content .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--color-subtle);
          pointer-events: none;
          height: 0;
          font-style: italic;
        }

        /* Typography */
        .richtext-editor-content .tiptap h1 {
          font-size: 1.875rem;
          font-weight: 700;
          line-height: 1.3;
          margin: 1.5rem 0 0.75rem;
          color: var(--color-foreground);
        }

        .richtext-editor-content .tiptap h2 {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 1.35;
          margin: 1.25rem 0 0.625rem;
          color: var(--color-foreground);
        }

        .richtext-editor-content .tiptap h3 {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.4;
          margin: 1rem 0 0.5rem;
          color: var(--color-foreground);
        }

        .richtext-editor-content .tiptap p {
          margin: 0.5rem 0;
        }

        .richtext-editor-content .tiptap > *:first-child {
          margin-top: 0;
        }

        .richtext-editor-content .tiptap > *:last-child {
          margin-bottom: 0;
        }

        /* Bold */
        .richtext-editor-content .tiptap strong {
          font-weight: 700;
          color: var(--color-foreground);
        }

        /* Italic */
        .richtext-editor-content .tiptap em {
          font-style: italic;
        }

        /* Underline */
        .richtext-editor-content .tiptap u {
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        /* Strikethrough */
        .richtext-editor-content .tiptap s {
          text-decoration: line-through;
          opacity: 0.7;
        }

        /* Link */
        .richtext-editor-content .tiptap a,
        .richtext-editor-content .tiptap .richtext-link {
          color: var(--color-primary);
          text-decoration: underline;
          text-underline-offset: 3px;
          cursor: pointer;
          transition: opacity 0.15s;
        }

        .richtext-editor-content .tiptap a:hover {
          opacity: 0.8;
        }

        /* Image */
        .richtext-editor-content .tiptap img,
        .richtext-editor-content .tiptap .richtext-image {
          max-width: 100%;
          height: auto;
          border-radius: var(--radius);
          margin: 1rem 0;
        }

        /* Lists */
        .richtext-editor-content .tiptap ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }

        .richtext-editor-content .tiptap ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }

        .richtext-editor-content .tiptap li {
          margin: 0.25rem 0;
        }

        .richtext-editor-content .tiptap li p {
          margin: 0;
        }

        /* Blockquote */
        .richtext-editor-content .tiptap blockquote {
          border-left: 3px solid var(--color-primary);
          padding-left: 1rem;
          margin: 1rem 0;
          color: var(--color-muted-foreground);
          font-style: italic;
        }

        /* Code */
        .richtext-editor-content .tiptap code {
          background: var(--color-surface-hover);
          color: var(--color-primary);
          padding: 0.15rem 0.4rem;
          border-radius: var(--radius-xs);
          font-family: var(--font-mono);
          font-size: 0.875em;
        }

        .richtext-editor-content .tiptap pre {
          background: var(--color-surface);
          border: 1px solid var(--color-border-hover);
          border-radius: var(--radius);
          padding: 0.75rem 1rem;
          margin: 0.75rem 0;
          overflow-x: auto;
        }

        .richtext-editor-content .tiptap pre code {
          background: none;
          padding: 0;
          color: var(--color-foreground);
          font-size: 0.875rem;
        }

        /* Horizontal rule */
        .richtext-editor-content .tiptap hr {
          border: none;
          border-top: 1px solid var(--color-border-hover);
          margin: 1.5rem 0;
        }

        /* Selection */
        .richtext-editor-content .tiptap ::selection {
          background: var(--color-primary-muted);
        }
      `}</style>
    </div>
  )
}
