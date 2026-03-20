'use client'

import { Input }    from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label }    from '@/components/ui/label'
import { Button }   from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MediaPicker } from '@/components/media/media-picker'
import { CodeEditor, type CodeLanguage }  from '@/components/content/code-editor'
import { Plus, Trash2 } from 'lucide-react'
import { useState, useMemo } from 'react'
import type { Block } from './types'
import { COLUMN_LAYOUTS, ColumnLayoutPicker, LayoutTrigger, type ColumnLayout } from './column-layout-picker'
import { useInnerBlockEditor } from './block-editor-context'

interface EditorProps {
  data:     Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

function set(data: Record<string, unknown>, key: string, value: unknown) {
  return { ...data, [key]: value }
}

// ─── Heading ──────────────────────────────────────────────────────────────────

export function HeadingEditor({ data, onChange }: EditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex-1 space-y-1.5">
          <Label>Tekst</Label>
          <Input
            value={(data.text as string) ?? ''}
            onChange={(e) => onChange(set(data, 'text', e.target.value))}
            placeholder="Treść nagłówka"
          />
        </div>
        <div className="w-28 space-y-1.5">
          <Label>Poziom</Label>
          <Select
            value={String(data.level ?? 2)}
            onValueChange={(v) => onChange(set(data, 'level', Number(v)))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1,2,3,4,5,6].map((n) => (
                <SelectItem key={n} value={String(n)}>H{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

// ─── Paragraph ────────────────────────────────────────────────────────────────

export function ParagraphEditor({ data, onChange }: EditorProps) {
  return (
    <div className="space-y-1.5">
      <Label>Treść</Label>
      <Textarea
        value={(data.text as string) ?? ''}
        onChange={(e) => onChange(set(data, 'text', e.target.value))}
        placeholder="Wpisz tekst akapitu..."
        rows={4}
      />
    </div>
  )
}

// ─── Image ────────────────────────────────────────────────────────────────────

export function ImageEditor({ data, onChange }: EditorProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Obraz</Label>
        <MediaPicker
          value={(data.url as string) ?? ''}
          onChange={(v) => onChange(set(data, 'url', v))}
          accept="image"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Alt text</Label>
          <Input
            value={(data.alt as string) ?? ''}
            onChange={(e) => onChange(set(data, 'alt', e.target.value))}
            placeholder="Opis obrazu"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Podpis</Label>
          <Input
            value={(data.caption as string) ?? ''}
            onChange={(e) => onChange(set(data, 'caption', e.target.value))}
            placeholder="Opcjonalny podpis"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

interface GalleryImage { url: string; alt: string }

export function GalleryEditor({ data, onChange }: EditorProps) {
  const images = (data.images as GalleryImage[]) ?? []

  function updateImage(i: number, key: string, value: string) {
    const next = [...images]
    next[i] = { ...next[i], [key]: value } as GalleryImage
    onChange(set(data, 'images', next))
  }

  function addImage() {
    onChange(set(data, 'images', [...images, { url: '', alt: '' }]))
  }

  function removeImage(i: number) {
    onChange(set(data, 'images', images.filter((_, idx) => idx !== i)))
  }

  return (
    <div className="space-y-3">
      {images.map((img, i) => (
        <div key={i} className="flex items-end gap-2 p-3 rounded-[var(--radius)] bg-[var(--color-surface-elevated)]">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs">URL obrazu {i + 1}</Label>
            <MediaPicker
              value={img.url}
              onChange={(v) => updateImage(i, 'url', v)}
              accept="image"
            />
          </div>
          <div className="w-40 space-y-1.5">
            <Label className="text-xs">Alt</Label>
            <Input
              value={img.alt}
              onChange={(e) => updateImage(i, 'alt', e.target.value)}
              placeholder="Alt text"
              className="h-8 text-sm"
            />
          </div>
          <button
            onClick={() => removeImage(i)}
            className="text-[var(--color-subtle)] hover:text-[var(--color-destructive)] transition-colors mb-0.5"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addImage} type="button">
        <Plus className="w-3.5 h-3.5" /> Dodaj obraz
      </Button>
    </div>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────

export function ButtonEditor({ data, onChange }: EditorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label>Etykieta</Label>
        <Input
          value={(data.label as string) ?? ''}
          onChange={(e) => onChange(set(data, 'label', e.target.value))}
          placeholder="Kliknij"
        />
      </div>
      <div className="space-y-1.5">
        <Label>URL</Label>
        <Input
          value={(data.url as string) ?? ''}
          onChange={(e) => onChange(set(data, 'url', e.target.value))}
          placeholder="/strona lub https://..."
          className="font-mono"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Wariant</Label>
        <Select value={(data.variant as string) ?? 'primary'} onValueChange={(v) => onChange(set(data, 'variant', v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="primary">Primary</SelectItem>
            <SelectItem value="outline">Outline</SelectItem>
            <SelectItem value="ghost">Ghost</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Otwieranie</Label>
        <Select value={(data.target as string) ?? '_self'} onValueChange={(v) => onChange(set(data, 'target', v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_self">Obecna karta</SelectItem>
            <SelectItem value="_blank">Nowa karta</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// ─── Video ────────────────────────────────────────────────────────────────────

export function VideoEditor({ data, onChange }: EditorProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label>URL / ID</Label>
          <Input
            value={(data.url as string) ?? ''}
            onChange={(e) => onChange(set(data, 'url', e.target.value))}
            placeholder="https://youtube.com/watch?v=... lub ID"
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Typ</Label>
          <Select value={(data.type as string) ?? 'youtube'} onValueChange={(v) => onChange(set(data, 'type', v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="vimeo">Vimeo</SelectItem>
              <SelectItem value="upload">Upload</SelectItem>
              <SelectItem value="embed">Embed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {(data.type as string) === 'embed' && (
        <div className="space-y-1.5">
          <Label>Kod embed</Label>
          <Textarea
            value={(data.embedCode as string) ?? ''}
            onChange={(e) => onChange(set(data, 'embedCode', e.target.value))}
            placeholder="<iframe ...></iframe>"
            rows={3}
            className="font-mono text-sm"
          />
        </div>
      )}
    </div>
  )
}

// ─── Code ─────────────────────────────────────────────────────────────────────

const LANGUAGES = ['javascript','typescript','jsx','tsx','html','css','json','python','php','sql','bash','markdown']

export function CodeBlockEditor({ data, onChange }: EditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Label>Język</Label>
        <Select value={(data.language as string) ?? 'javascript'} onValueChange={(v) => onChange(set(data, 'language', v))}>
          <SelectTrigger className="w-40 h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-[var(--radius)] overflow-hidden border border-[var(--color-border-hover)]">
        <CodeEditor
          value={(data.code as string) ?? ''}
          onChange={(v) => onChange(set(data, 'code', v))}
          language={((data.language as string) ?? 'javascript') as CodeLanguage}
          height="200px"
        />
      </div>
    </div>
  )
}

// ─── Quote ────────────────────────────────────────────────────────────────────

export function QuoteEditor({ data, onChange }: EditorProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Treść cytatu</Label>
        <Textarea
          value={(data.text as string) ?? ''}
          onChange={(e) => onChange(set(data, 'text', e.target.value))}
          placeholder="Treść cytatu..."
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Autor</Label>
          <Input value={(data.author as string) ?? ''} onChange={(e) => onChange(set(data, 'author', e.target.value))} placeholder="Jan Kowalski" />
        </div>
        <div className="space-y-1.5">
          <Label>Rola / firma</Label>
          <Input value={(data.role as string) ?? ''} onChange={(e) => onChange(set(data, 'role', e.target.value))} placeholder="CEO, Firma XYZ" />
        </div>
      </div>
    </div>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function DividerEditor({ data, onChange }: EditorProps) {
  return (
    <div className="flex gap-4">
      <div className="space-y-1.5">
        <Label>Styl</Label>
        <Select value={(data.style as string) ?? 'line'} onValueChange={(v) => onChange(set(data, 'style', v))}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="line">Linia</SelectItem>
            <SelectItem value="dots">Kropki</SelectItem>
            <SelectItem value="space">Odstęp</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Rozmiar</Label>
        <Select value={(data.spacing as string) ?? 'md'} onValueChange={(v) => onChange(set(data, 'spacing', v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Mały</SelectItem>
            <SelectItem value="md">Średni</SelectItem>
            <SelectItem value="lg">Duży</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// ─── HTML ─────────────────────────────────────────────────────────────────────

export function HtmlEditor({ data, onChange }: EditorProps) {
  return (
    <div className="space-y-1.5">
      <Label>Kod HTML</Label>
      <div className="rounded-[var(--radius)] overflow-hidden border border-[var(--color-border-hover)]">
        <CodeEditor
          value={(data.html as string) ?? ''}
          onChange={(v) => onChange(set(data, 'html', v))}
          language="html"
          height="180px"
        />
      </div>
    </div>
  )
}

// ─── Columns ──────────────────────────────────────────────────────────────────

interface ColumnItem { id: string; blocks: Block[] }

export function ColumnsEditor({ data, onChange }: EditorProps) {
  const InnerEditor = useInnerBlockEditor()
  const [pickerOpen, setPickerOpen] = useState(false)

  const layoutId = (data.layoutId as string) ?? '50-50'
  const currentLayout: ColumnLayout =
    COLUMN_LAYOUTS.find((l) => l.id === layoutId) ?? COLUMN_LAYOUTS.find((l) => l.id === '50-50')!

  const columns = useMemo<ColumnItem[]>(() => {
    const count   = currentLayout.widths.length
    const raw     = data.columns as ColumnItem[] | undefined
    return Array.from({ length: count }, (_, i) =>
      raw?.[i] ?? { id: `col-${i}`, blocks: [] },
    )
  }, [data.columns, currentLayout.widths.length])

  function applyLayout(layout: ColumnLayout) {
    const count    = layout.widths.length
    const nextCols = Array.from({ length: count }, (_, i) =>
      columns[i] ?? { id: `col-${i}`, blocks: [] },
    )
    onChange({ ...data, layoutId: layout.id, widths: layout.widths, columns: nextCols })
  }

  function updateColumnBlocks(colIdx: number, blocks: Block[]) {
    const nextCols = columns.map((col, i) => i === colIdx ? { ...col, blocks } : col)
    onChange({ ...data, columns: nextCols })
  }

  return (
    <div className="space-y-3">
      {/* Layout picker trigger */}
      <div className="space-y-1.5">
        <Label className="text-xs text-[var(--color-subtle)]">Układ kolumn</Label>
        <LayoutTrigger layout={currentLayout} onClick={() => setPickerOpen(true)} />
      </div>

      {/* Column block editors */}
      {InnerEditor ? (
        <div
          className="grid gap-2 items-start"
          style={{ gridTemplateColumns: currentLayout.widths.map((w) => `${w}fr`).join(' ') }}
        >
          {columns.map((col, i) => (
            <div
              key={col.id}
              className="rounded-[var(--radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-2 space-y-1"
            >
              <span className="block text-[10px] font-semibold text-[var(--color-subtle)] uppercase tracking-wide px-1">
                Kol. {i + 1} · {currentLayout.widths[i]}%
              </span>
              <InnerEditor
                value={col.blocks}
                onChange={(blocks) => updateColumnBlocks(i, blocks)}
                compact
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--color-subtle)]">Błąd: brak kontekstu edytora.</p>
      )}

      {pickerOpen && (
        <ColumnLayoutPicker
          current={layoutId}
          onPick={applyLayout}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function CardEditor({ data, onChange }: EditorProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Tytuł</Label>
          <Input value={(data.title as string) ?? ''} onChange={(e) => onChange(set(data, 'title', e.target.value))} placeholder="Tytuł karty" />
        </div>
        <div className="space-y-1.5">
          <Label>Link</Label>
          <Input value={(data.link as string) ?? ''} onChange={(e) => onChange(set(data, 'link', e.target.value))} placeholder="/strona" className="font-mono" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Obraz</Label>
        <MediaPicker value={(data.image as string) ?? ''} onChange={(v) => onChange(set(data, 'image', v))} accept="image" />
      </div>
      <div className="space-y-1.5">
        <Label>Treść</Label>
        <Textarea value={(data.text as string) ?? ''} onChange={(e) => onChange(set(data, 'text', e.target.value))} placeholder="Opis..." rows={3} />
      </div>
      <div className="space-y-1.5">
        <Label>Etykieta przycisku</Label>
        <Input value={(data.buttonLabel as string) ?? ''} onChange={(e) => onChange(set(data, 'buttonLabel', e.target.value))} placeholder="Czytaj więcej" />
      </div>
    </div>
  )
}

// ─── Accordion ────────────────────────────────────────────────────────────────

interface AccordionItem { question: string; answer: string }

export function AccordionEditor({ data, onChange }: EditorProps) {
  const items = (data.items as AccordionItem[]) ?? []

  function updateItem(i: number, key: string, value: string) {
    const next = [...items]
    next[i] = { ...next[i], [key]: value } as AccordionItem
    onChange(set(data, 'items', next))
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="p-3 rounded-[var(--radius)] bg-[var(--color-surface-elevated)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-subtle)]">Pozycja {i + 1}</span>
            <button
              onClick={() => onChange(set(data, 'items', items.filter((_, idx) => idx !== i)))}
              className="text-[var(--color-subtle)] hover:text-[var(--color-destructive)] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <Input
            value={item.question}
            onChange={(e) => updateItem(i, 'question', e.target.value)}
            placeholder="Pytanie"
            className="text-sm"
          />
          <Textarea
            value={item.answer}
            onChange={(e) => updateItem(i, 'answer', e.target.value)}
            placeholder="Odpowiedź"
            rows={2}
            className="text-sm"
          />
        </div>
      ))}
      <Button
        variant="outline" size="sm" type="button"
        onClick={() => onChange(set(data, 'items', [...items, { question: '', answer: '' }]))}
      >
        <Plus className="w-3.5 h-3.5" /> Dodaj pozycję
      </Button>
    </div>
  )
}

// ─── Testimonial ──────────────────────────────────────────────────────────────

export function TestimonialEditor({ data, onChange }: EditorProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Treść opinii</Label>
        <Textarea value={(data.text as string) ?? ''} onChange={(e) => onChange(set(data, 'text', e.target.value))} placeholder="Treść opinii..." rows={3} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Imię i nazwisko</Label>
          <Input value={(data.name as string) ?? ''} onChange={(e) => onChange(set(data, 'name', e.target.value))} placeholder="Jan Kowalski" />
        </div>
        <div className="space-y-1.5">
          <Label>Rola</Label>
          <Input value={(data.role as string) ?? ''} onChange={(e) => onChange(set(data, 'role', e.target.value))} placeholder="CEO" />
        </div>
        <div className="space-y-1.5">
          <Label>Firma</Label>
          <Input value={(data.company as string) ?? ''} onChange={(e) => onChange(set(data, 'company', e.target.value))} placeholder="Firma XYZ" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Avatar</Label>
          <MediaPicker value={(data.avatar as string) ?? ''} onChange={(v) => onChange(set(data, 'avatar', v))} accept="image" />
        </div>
        <div className="space-y-1.5">
          <Label>Ocena (1–5)</Label>
          <Select value={String(data.rating ?? 5)} onValueChange={(v) => onChange(set(data, 'rating', Number(v)))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1,2,3,4,5].map((n) => <SelectItem key={n} value={String(n)}>{n} ★</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

export function CtaEditor({ data, onChange }: EditorProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Tytuł</Label>
        <Input value={(data.title as string) ?? ''} onChange={(e) => onChange(set(data, 'title', e.target.value))} placeholder="Tytuł CTA" />
      </div>
      <div className="space-y-1.5">
        <Label>Opis</Label>
        <Textarea value={(data.description as string) ?? ''} onChange={(e) => onChange(set(data, 'description', e.target.value))} placeholder="Krótki opis..." rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Etykieta przycisku</Label>
          <Input value={(data.buttonLabel as string) ?? ''} onChange={(e) => onChange(set(data, 'buttonLabel', e.target.value))} placeholder="Dowiedz się więcej" />
        </div>
        <div className="space-y-1.5">
          <Label>URL przycisku</Label>
          <Input value={(data.buttonUrl as string) ?? ''} onChange={(e) => onChange(set(data, 'buttonUrl', e.target.value))} placeholder="/kontakt" className="font-mono" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Tło</Label>
        <Select value={(data.bgStyle as string) ?? 'gradient'} onValueChange={(v) => onChange(set(data, 'bgStyle', v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="gradient">Gradient</SelectItem>
            <SelectItem value="flat">Jednolite</SelectItem>
            <SelectItem value="image">Obraz</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// ─── Editor map ───────────────────────────────────────────────────────────────

import type { BlockType } from './types'

export const BLOCK_EDITOR_MAP: Record<BlockType, React.FC<EditorProps>> = {
  heading:     HeadingEditor,
  paragraph:   ParagraphEditor,
  image:       ImageEditor,
  gallery:     GalleryEditor,
  button:      ButtonEditor,
  video:       VideoEditor,
  code:        CodeBlockEditor,
  quote:       QuoteEditor,
  divider:     DividerEditor,
  html:        HtmlEditor,
  columns:     ColumnsEditor,
  card:        CardEditor,
  accordion:   AccordionEditor,
  testimonial: TestimonialEditor,
  cta:         CtaEditor,
}

// Preview text for collapsed block header
export function blockPreview(block: Block): string {
  const d = block.data
  switch (block.type) {
    case 'heading':     return (d.text as string) ?? ''
    case 'paragraph':   return ((d.text as string) ?? '').slice(0, 80)
    case 'image':       return (d.alt as string) || (d.url as string) || 'Obraz'
    case 'gallery':     return `${((d.images as unknown[]) ?? []).length} obrazów`
    case 'button':      return (d.label as string) ?? 'Przycisk'
    case 'video':       return (d.url as string) || 'Video'
    case 'code':        return (d.language as string) || 'kod'
    case 'quote':       return ((d.text as string) ?? '').slice(0, 60)
    case 'divider':     return (d.style as string) ?? 'line'
    case 'html':        return 'HTML'
    case 'columns':     return (d.widths as number[] | undefined)?.map(w => `${w}%`).join(' + ') ?? `${d.cols ?? 2} kol.`
    case 'card':        return (d.title as string) ?? 'Karta'
    case 'accordion':   return `${((d.items as unknown[]) ?? []).length} pozycji`
    case 'testimonial': return (d.name as string) ?? 'Opinia'
    case 'cta':         return (d.title as string) ?? 'CTA'
    default:            return ''
  }
}
