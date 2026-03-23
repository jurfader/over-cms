import {
  Heading, AlignLeft, Image, Images, MousePointer2,
  Video, Code2, Quote, Minus, Code, LayoutPanelLeft,
  ChevronDown, Star, Megaphone, Rows3,
  Sparkles, CircleDot, Hash, PanelTop, SlidersHorizontal,
  DollarSign, Users, Share2, Mail, ArrowUpDown,
  LayoutTemplate,
} from 'lucide-react'
// crypto.randomUUID() is available in all modern browsers and Node 19+
const uid = () => crypto.randomUUID()

// ─── Block types ──────────────────────────────────────────────────────────────

export type BlockType =
  // Structure
  | 'section'
  | 'row'
  | 'column'
  // Modules — tekst
  | 'heading'
  | 'paragraph'
  | 'quote'
  | 'code'
  | 'html'
  // Modules — media
  | 'image'
  | 'gallery'
  | 'video'
  | 'icon'
  // Modules — layout
  | 'divider'
  | 'card'
  | 'spacer'
  | 'tabs'
  // Modules — interakcja
  | 'button'
  | 'accordion'
  | 'form'
  | 'slider'
  // Modules — marketing
  | 'cta'
  | 'testimonial'
  | 'blurb'
  | 'counter'
  | 'pricing'
  | 'team'
  | 'social'

// Shared type lives in @overcms/core — used by both admin and web renderer
import type { BlockStyle } from '@overcms/core'
export type { BlockStyle }

// ─── Block ────────────────────────────────────────────────────────────────────

export interface Block {
  id: string
  type: BlockType
  data: Record<string, unknown>
  style?: BlockStyle
  children?: Block[] // sections → rows, rows → columns, columns → modules
}

// ─── Column structures (Divi-like) ───────────────────────────────────────────

export interface ColumnStructure {
  readonly id: string
  readonly label: string
  readonly widths: readonly number[]
}

export const COLUMN_STRUCTURES = [
  { id: '1', label: '1/1', widths: [100] },
  { id: '1_2,1_2', label: '1/2 + 1/2', widths: [50, 50] },
  { id: '1_3,2_3', label: '1/3 + 2/3', widths: [33.33, 66.67] },
  { id: '2_3,1_3', label: '2/3 + 1/3', widths: [66.67, 33.33] },
  { id: '1_3,1_3,1_3', label: '1/3 + 1/3 + 1/3', widths: [33.33, 33.33, 33.33] },
  { id: '1_4,3_4', label: '1/4 + 3/4', widths: [25, 75] },
  { id: '3_4,1_4', label: '3/4 + 1/4', widths: [75, 25] },
  { id: '1_4,1_4,1_2', label: '1/4 + 1/4 + 1/2', widths: [25, 25, 50] },
  { id: '1_2,1_4,1_4', label: '1/2 + 1/4 + 1/4', widths: [50, 25, 25] },
  { id: '1_4,1_4,1_4,1_4', label: '1/4 × 4', widths: [25, 25, 25, 25] },
] as const satisfies readonly ColumnStructure[]

// ─── Block definition ────────────────────────────────────────────────────────

export type BlockCategory =
  | 'struktura'
  | 'tekst'
  | 'media'
  | 'layout'
  | 'interakcja'
  | 'marketing'

export interface BlockDef {
  type: BlockType
  label: string
  icon: React.ElementType
  category: BlockCategory
  description: string
  defaultData: Record<string, unknown>
  defaultChildren?: () => Block[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function columnsForStructure(structureId: string): Block[] {
  const structure = COLUMN_STRUCTURES.find((s) => s.id === structureId)
  const widths = structure ? structure.widths : [100]
  return widths.map((w) => ({
    id: uid(),
    type: 'column' as const,
    data: { width: w },
    children: [],
  }))
}

// ─── Block definitions ───────────────────────────────────────────────────────

export const BLOCK_DEFS: BlockDef[] = [
  // ── Struktura ────────────────────────────────────────────────────────────
  {
    type: 'section',
    label: 'Sekcja',
    icon: LayoutTemplate,
    category: 'struktura',
    description: 'Kontener najwyższego poziomu grupujący wiersze',
    defaultData: { fullWidth: false, tag: 'section' },
    defaultChildren: () => [
      {
        id: uid(),
        type: 'row',
        data: { columnStructure: '1', gutter: 'md', equalizeHeight: false },
        children: columnsForStructure('1'),
      },
    ],
  },
  {
    type: 'row',
    label: 'Wiersz',
    icon: Rows3,
    category: 'struktura',
    description: 'Wiersz z kolumnami wewnątrz sekcji',
    defaultData: { columnStructure: '1', gutter: 'md', equalizeHeight: false },
    defaultChildren: () => columnsForStructure('1'),
  },

  // ── Tekst ────────────────────────────────────────────────────────────────
  {
    type: 'heading',
    label: 'Nagłówek',
    icon: Heading,
    category: 'tekst',
    description: 'Nagłówek H1–H6',
    defaultData: { text: 'Nowy nagłówek', level: 2 },
  },
  {
    type: 'paragraph',
    label: 'Akapit',
    icon: AlignLeft,
    category: 'tekst',
    description: 'Blok tekstu z formatowaniem',
    defaultData: { text: '' },
  },
  {
    type: 'quote',
    label: 'Cytat',
    icon: Quote,
    category: 'tekst',
    description: 'Wyróżniony cytat z autorem',
    defaultData: { text: '', author: '', role: '' },
  },
  {
    type: 'code',
    label: 'Kod',
    icon: Code2,
    category: 'tekst',
    description: 'Blok kodu z podświetlaniem składni',
    defaultData: { code: '', language: 'javascript' },
  },
  {
    type: 'html',
    label: 'HTML',
    icon: Code,
    category: 'tekst',
    description: 'Własny kod HTML',
    defaultData: { html: '' },
  },

  // ── Media ────────────────────────────────────────────────────────────────
  {
    type: 'image',
    label: 'Obraz',
    icon: Image,
    category: 'media',
    description: 'Obraz z podpisem i atrybutem alt',
    defaultData: { url: '', alt: '', caption: '' },
  },
  {
    type: 'gallery',
    label: 'Galeria',
    icon: Images,
    category: 'media',
    description: 'Galeria wielu obrazów',
    defaultData: { images: [] },
  },
  {
    type: 'video',
    label: 'Video',
    icon: Video,
    category: 'media',
    description: 'Osadzenie wideo z YouTube lub Vimeo',
    defaultData: { url: '', type: 'youtube' },
  },
  {
    type: 'icon',
    label: 'Ikona',
    icon: CircleDot,
    category: 'media',
    description: 'Samodzielna ikona z konfiguracją rozmiaru i koloru',
    defaultData: { name: 'star', size: 48, color: '' },
  },

  // ── Layout ───────────────────────────────────────────────────────────────
  {
    type: 'divider',
    label: 'Separator',
    icon: Minus,
    category: 'layout',
    description: 'Linia rozdzielająca sekcje treści',
    defaultData: { style: 'line', spacing: 'md' },
  },
  {
    type: 'card',
    label: 'Karta',
    icon: LayoutPanelLeft,
    category: 'layout',
    description: 'Karta z obrazem, tytułem i przyciskiem',
    defaultData: { title: '', text: '', image: '', link: '', buttonLabel: '' },
  },
  {
    type: 'spacer',
    label: 'Odstęp',
    icon: ArrowUpDown,
    category: 'layout',
    description: 'Pusty pionowy odstęp o konfigurowalnej wysokości',
    defaultData: { height: '3rem' },
  },
  {
    type: 'tabs',
    label: 'Zakładki',
    icon: PanelTop,
    category: 'layout',
    description: 'Treść przełączana zakładkami',
    defaultData: { items: [{ label: 'Tab 1', content: '' }] },
  },

  // ── Interakcja ───────────────────────────────────────────────────────────
  {
    type: 'button',
    label: 'Przycisk',
    icon: MousePointer2,
    category: 'interakcja',
    description: 'Przycisk z linkiem i wariantem stylu',
    defaultData: { label: 'Kliknij', url: '/', variant: 'primary', target: '_self' },
  },
  {
    type: 'accordion',
    label: 'Accordion / FAQ',
    icon: ChevronDown,
    category: 'interakcja',
    description: 'Rozwijane sekcje pytań i odpowiedzi',
    defaultData: { items: [{ question: '', answer: '' }] },
  },
  {
    type: 'form',
    label: 'Formularz',
    icon: Mail,
    category: 'interakcja',
    description: 'Formularz kontaktowy z konfigurowalnymi polami',
    defaultData: {
      fields: [{ label: 'Email', type: 'email', required: true }],
      submitLabel: 'Wyślij',
      action: '',
    },
  },
  {
    type: 'slider',
    label: 'Slider',
    icon: SlidersHorizontal,
    category: 'interakcja',
    description: 'Karuzela slajdów z autoodtwarzaniem',
    defaultData: {
      slides: [{ title: '', text: '', image: '', buttonLabel: '', buttonUrl: '' }],
      autoplay: true,
      interval: 5,
    },
  },

  // ── Marketing ────────────────────────────────────────────────────────────
  {
    type: 'cta',
    label: 'CTA sekcja',
    icon: Megaphone,
    category: 'marketing',
    description: 'Sekcja wezwania do działania z przyciskiem',
    defaultData: {
      title: '',
      description: '',
      buttonLabel: 'Dowiedz się więcej',
      buttonUrl: '/',
      bgStyle: 'gradient',
    },
  },
  {
    type: 'testimonial',
    label: 'Opinia',
    icon: Star,
    category: 'marketing',
    description: 'Opinia klienta z avatarem i oceną',
    defaultData: { name: '', role: '', company: '', text: '', avatar: '', rating: 5 },
  },
  {
    type: 'blurb',
    label: 'Blurb',
    icon: Sparkles,
    category: 'marketing',
    description: 'Ikona lub obraz z tytułem i opisem',
    defaultData: { icon: 'star', title: '', text: '', iconColor: '' },
  },
  {
    type: 'counter',
    label: 'Licznik',
    icon: Hash,
    category: 'marketing',
    description: 'Animowany licznik z sufiksem i etykietą',
    defaultData: { number: 100, suffix: '+', title: '', duration: 2 },
  },
  {
    type: 'pricing',
    label: 'Cennik',
    icon: DollarSign,
    category: 'marketing',
    description: 'Tabela cenowa z listą funkcji i przyciskiem',
    defaultData: {
      title: '',
      price: '',
      period: '',
      features: '',
      buttonLabel: '',
      buttonUrl: '',
      featured: false,
    },
  },
  {
    type: 'team',
    label: 'Członek zespołu',
    icon: Users,
    category: 'marketing',
    description: 'Karta osoby ze zdjęciem, rolą i linkami',
    defaultData: { name: '', role: '', photo: '', bio: '', socialLinks: [] },
  },
  {
    type: 'social',
    label: 'Social media',
    icon: Share2,
    category: 'marketing',
    description: 'Zestaw ikon linków do mediów społecznościowych',
    defaultData: { items: [{ platform: 'facebook', url: '' }] },
  },
]

// ─── Lookup maps ─────────────────────────────────────────────────────────────

export const BLOCK_DEF_MAP: Record<BlockType, BlockDef> = Object.fromEntries(
  BLOCK_DEFS.map((d) => [d.type, d]),
) as Record<BlockType, BlockDef>

export const BLOCK_CATEGORIES = [
  { id: 'struktura',   label: 'Struktura'  },
  { id: 'tekst',       label: 'Tekst'      },
  { id: 'media',       label: 'Media'      },
  { id: 'layout',      label: 'Layout'     },
  { id: 'interakcja',  label: 'Interakcja' },
  { id: 'marketing',   label: 'Marketing'  },
] as const

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createBlock(type: BlockType, overrides?: Partial<Block>): Block {
  const def = BLOCK_DEF_MAP[type]
  const block: Block = {
    id: uid(),
    type,
    data: { ...def.defaultData },
    ...overrides,
  }
  if (def.defaultChildren && !overrides?.children) {
    block.children = def.defaultChildren()
  }
  return block
}
