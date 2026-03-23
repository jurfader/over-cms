'use client'

import { Input }    from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label }    from '@/components/ui/label'
import { Button }   from '@/components/ui/button'
import { Switch }   from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MediaPicker } from '@/components/media/media-picker'
import { CodeEditor, type CodeLanguage }  from '@/components/content/code-editor'
import { Plus, Trash2 } from 'lucide-react'
import type { Block, BlockType } from './types'
import { COLUMN_STRUCTURES } from './types'

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

// ─── Section ──────────────────────────────────────────────────────────────────

export function SectionEditor({ data, onChange }: EditorProps) {
  return (
    <div className="flex items-center gap-3">
      <Switch
        id="section-fullwidth"
        checked={!!data.fullWidth}
        onCheckedChange={(v) => onChange(set(data, 'fullWidth', v))}
      />
      <Label htmlFor="section-fullwidth">Pełna szerokość</Label>
    </div>
  )
}

// ─── Row ──────────────────────────────────────────────────────────────────────

export function RowEditor({ data, onChange }: EditorProps) {
  const currentStructure = (data.columnStructure as string) ?? '1'

  return (
    <div className="space-y-4">
      {/* Column structure picker */}
      <div className="space-y-1.5">
        <Label>Struktura kolumn</Label>
        <div className="grid grid-cols-5 gap-2">
          {COLUMN_STRUCTURES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(set(data, 'columnStructure', s.id))}
              className={`flex items-end gap-0.5 p-2 h-12 rounded-[var(--radius)] border-2 transition-colors ${
                currentStructure === s.id
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                  : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
              }`}
              title={s.label}
            >
              {s.widths.map((w, i) => (
                <div
                  key={i}
                  className={`rounded-sm h-full min-h-[24px] ${
                    currentStructure === s.id
                      ? 'bg-[var(--color-primary)]'
                      : 'bg-[var(--color-subtle)]/40'
                  }`}
                  style={{ width: `${w}%` }}
                />
              ))}
            </button>
          ))}
        </div>
      </div>

      {/* Gutter */}
      <div className="space-y-1.5">
        <Label>Odstęp między kolumnami</Label>
        <Select
          value={(data.gutter as string) ?? 'md'}
          onValueChange={(v) => onChange(set(data, 'gutter', v))}
        >
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Brak</SelectItem>
            <SelectItem value="sm">Mały</SelectItem>
            <SelectItem value="md">Średni</SelectItem>
            <SelectItem value="lg">Duży</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Equalize height */}
      <div className="flex items-center gap-3">
        <Switch
          id="row-equalize"
          checked={!!data.equalizeHeight}
          onCheckedChange={(v) => onChange(set(data, 'equalizeHeight', v))}
        />
        <Label htmlFor="row-equalize">Wyrównaj wysokość kolumn</Label>
      </div>
    </div>
  )
}

// ─── Column ───────────────────────────────────────────────────────────────────

export function ColumnEditor(_props: EditorProps) {
  return (
    <p className="text-xs text-[var(--color-subtle)]">
      Kolumna nie posiada dodatkowych ustawień. Dodaj moduły wewnątrz kolumny.
    </p>
  )
}

// ─── Blurb ────────────────────────────────────────────────────────────────────

export function BlurbEditor({ data, onChange }: EditorProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Nazwa ikony</Label>
          <Input
            value={(data.icon as string) ?? ''}
            onChange={(e) => onChange(set(data, 'icon', e.target.value))}
            placeholder="star"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Kolor ikony</Label>
          <Input
            value={(data.iconColor as string) ?? ''}
            onChange={(e) => onChange(set(data, 'iconColor', e.target.value))}
            placeholder="#3b82f6"
            className="font-mono"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Tytuł</Label>
        <Input
          value={(data.title as string) ?? ''}
          onChange={(e) => onChange(set(data, 'title', e.target.value))}
          placeholder="Tytuł blurba"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Tekst</Label>
        <Textarea
          value={(data.text as string) ?? ''}
          onChange={(e) => onChange(set(data, 'text', e.target.value))}
          placeholder="Opis..."
          rows={3}
        />
      </div>
    </div>
  )
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

export function IconEditor({ data, onChange }: EditorProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="space-y-1.5">
        <Label>Nazwa ikony</Label>
        <Input
          value={(data.name as string) ?? ''}
          onChange={(e) => onChange(set(data, 'name', e.target.value))}
          placeholder="star"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Rozmiar (px)</Label>
        <Input
          type="number"
          value={String(data.size ?? 48)}
          onChange={(e) => onChange(set(data, 'size', Number(e.target.value)))}
          placeholder="48"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Kolor</Label>
        <Input
          value={(data.color as string) ?? ''}
          onChange={(e) => onChange(set(data, 'color', e.target.value))}
          placeholder="#000000"
          className="font-mono"
        />
      </div>
    </div>
  )
}

// ─── Counter ──────────────────────────────────────────────────────────────────

export function CounterEditor({ data, onChange }: EditorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label>Liczba</Label>
        <Input
          type="number"
          value={String(data.number ?? 0)}
          onChange={(e) => onChange(set(data, 'number', Number(e.target.value)))}
          placeholder="100"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Sufiks</Label>
        <Input
          value={(data.suffix as string) ?? ''}
          onChange={(e) => onChange(set(data, 'suffix', e.target.value))}
          placeholder="+"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Tytuł</Label>
        <Input
          value={(data.title as string) ?? ''}
          onChange={(e) => onChange(set(data, 'title', e.target.value))}
          placeholder="Zadowolonych klientów"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Czas animacji (s)</Label>
        <Input
          type="number"
          value={String(data.duration ?? 2)}
          onChange={(e) => onChange(set(data, 'duration', Number(e.target.value)))}
          placeholder="2"
          min={0}
          step={0.5}
        />
      </div>
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

interface TabItem { label: string; content: string }

export function TabsEditor({ data, onChange }: EditorProps) {
  const items = (data.items as TabItem[]) ?? []

  function updateItem(i: number, key: string, value: string) {
    const next = [...items]
    next[i] = { ...next[i], [key]: value } as TabItem
    onChange(set(data, 'items', next))
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="p-3 rounded-[var(--radius)] bg-[var(--color-surface-elevated)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-subtle)]">Zakładka {i + 1}</span>
            <button
              onClick={() => onChange(set(data, 'items', items.filter((_, idx) => idx !== i)))}
              className="text-[var(--color-subtle)] hover:text-[var(--color-destructive)] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <Input
            value={item.label}
            onChange={(e) => updateItem(i, 'label', e.target.value)}
            placeholder="Nazwa zakładki"
            className="text-sm"
          />
          <Textarea
            value={item.content}
            onChange={(e) => updateItem(i, 'content', e.target.value)}
            placeholder="Treść zakładki..."
            rows={2}
            className="text-sm"
          />
        </div>
      ))}
      <Button
        variant="outline" size="sm" type="button"
        onClick={() => onChange(set(data, 'items', [...items, { label: '', content: '' }]))}
      >
        <Plus className="w-3.5 h-3.5" /> Dodaj zakładkę
      </Button>
    </div>
  )
}

// ─── Slider ───────────────────────────────────────────────────────────────────

interface SlideItem { title: string; text: string; image: string; buttonLabel: string; buttonUrl: string }

export function SliderEditor({ data, onChange }: EditorProps) {
  const slides = (data.slides as SlideItem[]) ?? []

  function updateSlide(i: number, key: string, value: string) {
    const next = [...slides]
    next[i] = { ...next[i], [key]: value } as SlideItem
    onChange(set(data, 'slides', next))
  }

  return (
    <div className="space-y-3">
      {slides.map((slide, i) => (
        <div key={i} className="p-3 rounded-[var(--radius)] bg-[var(--color-surface-elevated)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-subtle)]">Slajd {i + 1}</span>
            <button
              onClick={() => onChange(set(data, 'slides', slides.filter((_, idx) => idx !== i)))}
              className="text-[var(--color-subtle)] hover:text-[var(--color-destructive)] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <Input
            value={slide.title}
            onChange={(e) => updateSlide(i, 'title', e.target.value)}
            placeholder="Tytuł slajdu"
            className="text-sm"
          />
          <Textarea
            value={slide.text}
            onChange={(e) => updateSlide(i, 'text', e.target.value)}
            placeholder="Treść slajdu..."
            rows={2}
            className="text-sm"
          />
          <MediaPicker
            value={slide.image}
            onChange={(v) => updateSlide(i, 'image', v)}
            accept="image"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={slide.buttonLabel}
              onChange={(e) => updateSlide(i, 'buttonLabel', e.target.value)}
              placeholder="Etykieta przycisku"
              className="text-sm"
            />
            <Input
              value={slide.buttonUrl}
              onChange={(e) => updateSlide(i, 'buttonUrl', e.target.value)}
              placeholder="URL przycisku"
              className="text-sm font-mono"
            />
          </div>
        </div>
      ))}
      <Button
        variant="outline" size="sm" type="button"
        onClick={() => onChange(set(data, 'slides', [...slides, { title: '', text: '', image: '', buttonLabel: '', buttonUrl: '' }]))}
      >
        <Plus className="w-3.5 h-3.5" /> Dodaj slajd
      </Button>
    </div>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

export function PricingEditor({ data, onChange }: EditorProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Tytuł</Label>
          <Input
            value={(data.title as string) ?? ''}
            onChange={(e) => onChange(set(data, 'title', e.target.value))}
            placeholder="Plan Pro"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Cena</Label>
          <Input
            value={(data.price as string) ?? ''}
            onChange={(e) => onChange(set(data, 'price', e.target.value))}
            placeholder="99 zł"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Okres</Label>
          <Input
            value={(data.period as string) ?? ''}
            onChange={(e) => onChange(set(data, 'period', e.target.value))}
            placeholder="/ miesiąc"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Funkcje (każda w nowej linii)</Label>
        <Textarea
          value={(data.features as string) ?? ''}
          onChange={(e) => onChange(set(data, 'features', e.target.value))}
          placeholder={"Funkcja 1\nFunkcja 2\nFunkcja 3"}
          rows={4}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Etykieta przycisku</Label>
          <Input
            value={(data.buttonLabel as string) ?? ''}
            onChange={(e) => onChange(set(data, 'buttonLabel', e.target.value))}
            placeholder="Wybierz plan"
          />
        </div>
        <div className="space-y-1.5">
          <Label>URL przycisku</Label>
          <Input
            value={(data.buttonUrl as string) ?? ''}
            onChange={(e) => onChange(set(data, 'buttonUrl', e.target.value))}
            placeholder="/zamów"
            className="font-mono"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Switch
          id="pricing-featured"
          checked={!!data.featured}
          onCheckedChange={(v) => onChange(set(data, 'featured', v))}
        />
        <Label htmlFor="pricing-featured">Wyróżniony</Label>
      </div>
    </div>
  )
}

// ─── Team ─────────────────────────────────────────────────────────────────────

export function TeamEditor({ data, onChange }: EditorProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Imię i nazwisko</Label>
          <Input
            value={(data.name as string) ?? ''}
            onChange={(e) => onChange(set(data, 'name', e.target.value))}
            placeholder="Jan Kowalski"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Rola</Label>
          <Input
            value={(data.role as string) ?? ''}
            onChange={(e) => onChange(set(data, 'role', e.target.value))}
            placeholder="CEO"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Zdjęcie</Label>
        <MediaPicker
          value={(data.photo as string) ?? ''}
          onChange={(v) => onChange(set(data, 'photo', v))}
          accept="image"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Bio</Label>
        <Textarea
          value={(data.bio as string) ?? ''}
          onChange={(e) => onChange(set(data, 'bio', e.target.value))}
          placeholder="Krótki opis osoby..."
          rows={3}
        />
      </div>
    </div>
  )
}

// ─── Social ───────────────────────────────────────────────────────────────────

const SOCIAL_PLATFORMS = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok', 'github', 'dribbble', 'behance', 'pinterest']

interface SocialItem { platform: string; url: string }

export function SocialEditor({ data, onChange }: EditorProps) {
  const items = (data.items as SocialItem[]) ?? []

  function updateItem(i: number, key: string, value: string) {
    const next = [...items]
    next[i] = { ...next[i], [key]: value } as SocialItem
    onChange(set(data, 'items', next))
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-end gap-2 p-3 rounded-[var(--radius)] bg-[var(--color-surface-elevated)]">
          <div className="w-40 space-y-1.5">
            <Label className="text-xs">Platforma</Label>
            <Select value={item.platform} onValueChange={(v) => updateItem(i, 'platform', v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SOCIAL_PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs">URL</Label>
            <Input
              value={item.url}
              onChange={(e) => updateItem(i, 'url', e.target.value)}
              placeholder="https://..."
              className="h-8 text-sm font-mono"
            />
          </div>
          <button
            onClick={() => onChange(set(data, 'items', items.filter((_, idx) => idx !== i)))}
            className="text-[var(--color-subtle)] hover:text-[var(--color-destructive)] transition-colors mb-0.5"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <Button
        variant="outline" size="sm" type="button"
        onClick={() => onChange(set(data, 'items', [...items, { platform: 'facebook', url: '' }]))}
      >
        <Plus className="w-3.5 h-3.5" /> Dodaj link
      </Button>
    </div>
  )
}

// ─── Form ─────────────────────────────────────────────────────────────────────

const FIELD_TYPES = ['text', 'email', 'tel', 'number', 'textarea', 'select', 'checkbox', 'date']

interface FormField { label: string; type: string; required: boolean }

export function FormEditor({ data, onChange }: EditorProps) {
  const fields = (data.fields as FormField[]) ?? []

  function updateField(i: number, key: string, value: unknown) {
    const next = [...fields]
    next[i] = { ...next[i], [key]: value } as FormField
    onChange(set(data, 'fields', next))
  }

  return (
    <div className="space-y-3">
      {fields.map((field, i) => (
        <div key={i} className="flex items-end gap-2 p-3 rounded-[var(--radius)] bg-[var(--color-surface-elevated)]">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs">Etykieta</Label>
            <Input
              value={field.label}
              onChange={(e) => updateField(i, 'label', e.target.value)}
              placeholder="Nazwa pola"
              className="h-8 text-sm"
            />
          </div>
          <div className="w-36 space-y-1.5">
            <Label className="text-xs">Typ</Label>
            <Select value={field.type} onValueChange={(v) => updateField(i, 'type', v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1.5 pb-0.5">
            <Switch
              id={`field-req-${i}`}
              checked={!!field.required}
              onCheckedChange={(v) => updateField(i, 'required', v)}
            />
            <Label htmlFor={`field-req-${i}`} className="text-xs whitespace-nowrap">Wymagane</Label>
          </div>
          <button
            onClick={() => onChange(set(data, 'fields', fields.filter((_, idx) => idx !== i)))}
            className="text-[var(--color-subtle)] hover:text-[var(--color-destructive)] transition-colors mb-0.5"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <Button
        variant="outline" size="sm" type="button"
        onClick={() => onChange(set(data, 'fields', [...fields, { label: '', type: 'text', required: false }]))}
      >
        <Plus className="w-3.5 h-3.5" /> Dodaj pole
      </Button>

      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--color-border)]">
        <div className="space-y-1.5">
          <Label>Etykieta przycisku</Label>
          <Input
            value={(data.submitLabel as string) ?? ''}
            onChange={(e) => onChange(set(data, 'submitLabel', e.target.value))}
            placeholder="Wyślij"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Akcja (URL)</Label>
          <Input
            value={(data.action as string) ?? ''}
            onChange={(e) => onChange(set(data, 'action', e.target.value))}
            placeholder="/api/contact"
            className="font-mono"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Spacer ───────────────────────────────────────────────────────────────────

export function SpacerEditor({ data, onChange }: EditorProps) {
  return (
    <div className="space-y-1.5">
      <Label>Wysokość</Label>
      <Input
        value={(data.height as string) ?? '3rem'}
        onChange={(e) => onChange(set(data, 'height', e.target.value))}
        placeholder="3rem"
        className="w-40 font-mono"
      />
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

export const BLOCK_EDITOR_MAP: Record<BlockType, React.FC<EditorProps>> = {
  // Structure
  section:     SectionEditor,
  row:         RowEditor,
  column:      ColumnEditor,
  // Text
  heading:     HeadingEditor,
  paragraph:   ParagraphEditor,
  quote:       QuoteEditor,
  code:        CodeBlockEditor,
  html:        HtmlEditor,
  // Media
  image:       ImageEditor,
  gallery:     GalleryEditor,
  video:       VideoEditor,
  icon:        IconEditor,
  // Layout
  divider:     DividerEditor,
  card:        CardEditor,
  spacer:      SpacerEditor,
  tabs:        TabsEditor,
  // Interaction
  button:      ButtonEditor,
  accordion:   AccordionEditor,
  form:        FormEditor,
  slider:      SliderEditor,
  // Marketing
  cta:         CtaEditor,
  testimonial: TestimonialEditor,
  blurb:       BlurbEditor,
  counter:     CounterEditor,
  pricing:     PricingEditor,
  team:        TeamEditor,
  social:      SocialEditor,
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
    case 'card':        return (d.title as string) ?? 'Karta'
    case 'accordion':   return `${((d.items as unknown[]) ?? []).length} pozycji`
    case 'testimonial': return (d.name as string) ?? 'Opinia'
    case 'cta':         return (d.title as string) ?? 'CTA'
    // New types
    case 'section':     return (d.fullWidth as boolean) ? 'Sekcja (pełna szer.)' : 'Sekcja'
    case 'row':         return `Wiersz · ${(d.columnStructure as string) ?? '1'}`
    case 'column':      return 'Kolumna'
    case 'blurb':       return (d.title as string) || (d.icon as string) || 'Blurb'
    case 'icon':        return (d.name as string) || 'Ikona'
    case 'counter':     return `${d.number ?? 0}${(d.suffix as string) ?? ''}`
    case 'tabs':        return `${((d.items as unknown[]) ?? []).length} zakładek`
    case 'slider':      return `${((d.slides as unknown[]) ?? []).length} slajdów`
    case 'pricing':     return (d.title as string) || (d.price as string) || 'Cennik'
    case 'team':        return (d.name as string) || 'Zespół'
    case 'social':      return `${((d.items as unknown[]) ?? []).length} linków`
    case 'form':        return `${((d.fields as unknown[]) ?? []).length} pól`
    case 'spacer':      return `Odstęp · ${(d.height as string) ?? '3rem'}`
    default:            return ''
  }
}
