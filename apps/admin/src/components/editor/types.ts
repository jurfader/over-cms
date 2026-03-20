import {
  Heading, AlignLeft, Image, Images, MousePointer2,
  Video, Code2, Quote, Minus, Code, Columns2,
  LayoutPanelLeft, ChevronDown, Star, Megaphone,
} from 'lucide-react'

// ─── Block types ──────────────────────────────────────────────────────────────

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'gallery'
  | 'button'
  | 'video'
  | 'code'
  | 'quote'
  | 'divider'
  | 'html'
  | 'columns'
  | 'card'
  | 'accordion'
  | 'testimonial'
  | 'cta'

// Shared type lives in @overcms/core — used by both admin and web renderer
import type { BlockStyle } from '@overcms/core'
export type { BlockStyle }

export interface Block {
  id:     string
  type:   BlockType
  data:   Record<string, unknown>
  style?: BlockStyle
}

// ─── Block definitions (for picker) ──────────────────────────────────────────

export interface BlockDef {
  type:        BlockType
  label:       string
  icon:        React.ElementType
  category:    'tekst' | 'media' | 'layout' | 'interakcja' | 'marketing'
  defaultData: Record<string, unknown>
}

export const BLOCK_DEFS: BlockDef[] = [
  // Tekst
  {
    type: 'heading', label: 'Nagłówek', icon: Heading, category: 'tekst',
    defaultData: { text: 'Nowy nagłówek', level: 2 },
  },
  {
    type: 'paragraph', label: 'Akapit', icon: AlignLeft, category: 'tekst',
    defaultData: { text: '' },
  },
  {
    type: 'quote', label: 'Cytat', icon: Quote, category: 'tekst',
    defaultData: { text: '', author: '', role: '' },
  },
  {
    type: 'code', label: 'Kod', icon: Code2, category: 'tekst',
    defaultData: { code: '', language: 'javascript' },
  },
  {
    type: 'html', label: 'HTML', icon: Code, category: 'tekst',
    defaultData: { html: '' },
  },
  // Media
  {
    type: 'image', label: 'Obraz', icon: Image, category: 'media',
    defaultData: { url: '', alt: '', caption: '' },
  },
  {
    type: 'gallery', label: 'Galeria', icon: Images, category: 'media',
    defaultData: { images: [] },
  },
  {
    type: 'video', label: 'Video', icon: Video, category: 'media',
    defaultData: { url: '', type: 'youtube' },
  },
  // Layout
  {
    type: 'divider', label: 'Separator', icon: Minus, category: 'layout',
    defaultData: { style: 'line', spacing: 'md' },
  },
  {
    type: 'columns', label: 'Kolumny', icon: Columns2, category: 'layout',
    defaultData: {
      layoutId: '50-50',
      widths: [50, 50],
      columns: [
        { id: 'col-0', blocks: [] },
        { id: 'col-1', blocks: [] },
      ],
    },
  },
  {
    type: 'card', label: 'Karta', icon: LayoutPanelLeft, category: 'layout',
    defaultData: { title: '', text: '', image: '', link: '', buttonLabel: '' },
  },
  // Interakcja
  {
    type: 'button', label: 'Przycisk', icon: MousePointer2, category: 'interakcja',
    defaultData: { label: 'Kliknij', url: '/', variant: 'primary', target: '_self' },
  },
  {
    type: 'accordion', label: 'Accordion / FAQ', icon: ChevronDown, category: 'interakcja',
    defaultData: { items: [{ question: '', answer: '' }] },
  },
  // Marketing
  {
    type: 'testimonial', label: 'Opinia', icon: Star, category: 'marketing',
    defaultData: { name: '', role: '', company: '', text: '', avatar: '', rating: 5 },
  },
  {
    type: 'cta', label: 'CTA sekcja', icon: Megaphone, category: 'marketing',
    defaultData: { title: '', description: '', buttonLabel: 'Dowiedz się więcej', buttonUrl: '/', bgStyle: 'gradient' },
  },
]

export const BLOCK_DEF_MAP: Record<BlockType, BlockDef> =
  Object.fromEntries(BLOCK_DEFS.map((d) => [d.type, d])) as Record<BlockType, BlockDef>

export const BLOCK_CATEGORIES = [
  { id: 'tekst',      label: 'Tekst'       },
  { id: 'media',      label: 'Media'       },
  { id: 'layout',     label: 'Layout'      },
  { id: 'interakcja', label: 'Interakcja'  },
  { id: 'marketing',  label: 'Marketing'   },
] as const
