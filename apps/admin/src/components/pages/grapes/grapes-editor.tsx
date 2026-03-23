import { useState, useCallback, useRef } from 'react'
import GjsEditor, {
  Canvas,
  BlocksProvider,
  StylesProvider,
  TraitsProvider,
  LayersProvider,
  DevicesProvider,
} from '@grapesjs/react'
import type { Editor, Block as GjsBlock } from 'grapesjs'
import grapesjs from 'grapesjs'
import grapesjsPresetWebpage from 'grapesjs-preset-webpage'
import {
  Monitor, Tablet, Smartphone,
  Undo2, Redo2, Save, Globe,
  ChevronLeft, Layers, Paintbrush, Settings, LayoutGrid,
  ChevronDown, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { overcmsBlocksPlugin } from './overcms-blocks-plugin'

// ─── Canvas iframe CSS ──────────────────────────────────────────────────────
// Corporate template design tokens + utility classes injected into the
// GrapesJS canvas iframe so blocks render with correct styling.

const CANVAS_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

:root {
  --font-sans: 'Open Sans', system-ui, sans-serif;
  --color-bg:        #0a0a0a;
  --color-surface:   #111111;
  --color-surface-2: #171717;
  --color-border:    rgba(255, 255, 255, 0.08);
  --color-fg:        #ffffff;
  --color-muted:     rgba(255, 255, 255, 0.55);
  --color-primary:   #E040FB;
  --color-primary-h: #CC2EE0;
  --color-accent:    #7B2FE0;
  --section-y: clamp(4.5rem, 9vw, 8rem);
  --radius-sm: 0.5rem;
  --radius:    0.875rem;
  --radius-lg: 1.5rem;
}

*, *::before, *::after { box-sizing: border-box; }

html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
}

body {
  font-family:      var(--font-sans);
  background-color: var(--color-bg);
  color:            var(--color-fg);
  line-height:      1.7;
  margin: 0;
  padding: 0;
}

.container {
  width:          100%;
  max-width:      1200px;
  margin-inline:  auto;
  padding-inline: clamp(1rem, 5vw, 2.5rem);
}

.section-label {
  display:        inline-flex;
  align-items:    center;
  gap:            0.5rem;
  font-size:      0.75rem;
  font-weight:    700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color:          var(--color-primary);
}

.section-label::before {
  content:       '';
  display:       block;
  width:         1.25rem;
  height:        2px;
  background:    var(--color-primary);
  border-radius: 1px;
}

.gradient-text {
  background:              linear-gradient(90deg, var(--color-primary), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip:         text;
}

.btn {
  display:         inline-flex;
  align-items:     center;
  gap:             0.5rem;
  padding:         0.75rem 1.75rem;
  border-radius:   999px;
  font-weight:     600;
  font-size:       0.9375rem;
  font-family:     var(--font-sans);
  cursor:          pointer;
  text-decoration: none;
  transition:      transform 0.15s, box-shadow 0.15s, background 0.15s, border-color 0.15s;
  border:          none;
}
.btn:active { transform: scale(0.97); }

.btn-primary {
  background:  var(--color-primary);
  color:       #fff;
  box-shadow:  0 4px 20px rgba(224, 64, 251, 0.3);
}
.btn-primary:hover {
  background:  var(--color-primary-h);
  box-shadow:  0 6px 28px rgba(224, 64, 251, 0.45);
  transform:   translateY(-1px);
}

.btn-outline {
  background:  transparent;
  color:       var(--color-fg);
  border:      1.5px solid rgba(255, 255, 255, 0.2);
}
.btn-outline:hover {
  border-color: rgba(255, 255, 255, 0.5);
  transform:    translateY(-1px);
}

.glass {
  background:              rgba(255, 255, 255, 0.04);
  backdrop-filter:         blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border:                  1px solid var(--color-border);
}

.reveal {
  opacity:   1;
  transform: translateY(0);
}

img { max-width: 100%; height: auto; }
`

// ─── Props ──────────────────────────────────────────────────────────────────

interface GrapesEditorProps {
  pageId?: string
  initialTitle?: string
  initialSlug?: string
  initialProject?: unknown
  initialHtml?: string
  onSave: (data: { html: string; css: string; project: unknown }) => Promise<void>
}

// ─── Right sidebar tab ──────────────────────────────────────────────────────

type RightTab = 'styles' | 'traits' | 'layers'

// ─── Component ──────────────────────────────────────────────────────────────

export function GrapesEditor({
  pageId: _pageId,
  initialTitle,
  initialSlug: _initialSlug,
  initialProject,
  initialHtml,
  onSave,
}: GrapesEditorProps) {
  const editorRef = useRef<Editor | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showRightPanel, setShowRightPanel] = useState(false)
  const [rightTab, setRightTab] = useState<RightTab>('styles')

  // ── Save handler ────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    const editor = editorRef.current
    if (!editor || isSaving) return
    setIsSaving(true)
    try {
      const html = editor.getHtml()
      const css = editor.getCss()
      const project = editor.getProjectData()
      await onSave({ html, css: css ?? '', project })
    } finally {
      setIsSaving(false)
    }
  }, [onSave, isSaving])

  const handlePublish = useCallback(async () => {
    // Publish is the same as save but the parent component
    // will handle updating the status field before calling the mutation
    await handleSave()
  }, [handleSave])

  // ── Editor ready callback ───────────────────────────────────────────────

  const onEditor = useCallback(
    (editor: Editor) => {
      editorRef.current = editor

      // Load initial data
      if (initialProject && typeof initialProject === 'object') {
        editor.loadProjectData(initialProject as Parameters<Editor['loadProjectData']>[0])
      } else if (initialHtml) {
        editor.setComponents(initialHtml)
      }

      // Show right sidebar on component selection
      editor.on('component:selected', () => {
        setShowRightPanel(true)
      })

      editor.on('component:deselected', () => {
        // Keep the panel visible so user can still browse layers/styles
      })

      // Keyboard shortcut for save
      editor.Commands.add('overcms:save', {
        run: () => {
          handleSave()
        },
      })
      editor.Keymaps.add('overcms:save', 'ctrl+s', 'overcms:save')
      editor.Keymaps.add('overcms:save:mac', 'cmd+s', 'overcms:save')
    },
    [initialProject, initialHtml, handleSave],
  )

  // ── GrapesJS editor options ─────────────────────────────────────────────

  const gjsOptions = {
    height: '100%',
    storageManager: false as const,
    undoManager: { trackSelection: false },
    canvas: {
      styles: [
        'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap',
      ],
    },
    deviceManager: {
      devices: [
        { name: 'Desktop', width: '' },
        { name: 'Tablet', width: '768px', widthMedia: '768px' },
        { name: 'Mobile', width: '375px', widthMedia: '375px' },
      ],
    },
    // Hide default panels — we build our own UI
    panels: { defaults: [] },
    // Block categories to keep organized
    blockManager: {
      appendTo: undefined as unknown as string, // we render with BlocksProvider
    },
    styleManager: {
      appendTo: undefined as unknown as string,
    },
    layerManager: {
      appendTo: undefined as unknown as string,
    },
    traitManager: {
      appendTo: undefined as unknown as string,
    },
  }

  // ── Device icons ────────────────────────────────────────────────────────

  const deviceIcons: Record<string, typeof Monitor> = {
    Desktop: Monitor,
    Tablet: Tablet,
    Mobile: Smartphone,
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-[var(--color-background)]">
      <GjsEditor
        className="flex flex-col flex-1 min-h-0"
        grapesjs={grapesjs}
        grapesjsCss="https://unpkg.com/grapesjs/dist/css/grapes.min.css"
        options={gjsOptions}
        plugins={[
          overcmsBlocksPlugin,
          grapesjsPresetWebpage as unknown as (() => void),
        ]}
        onEditor={onEditor}
      >
        {/* ── Top Toolbar ──────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--color-border)] bg-[var(--glass-card-bg)] backdrop-blur-sm shrink-0 z-10">
          {/* Back */}
          <Link
            href="/pages"
            className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Strony
          </Link>

          {/* Separator */}
          <div className="w-px h-5 bg-[var(--color-border)]" />

          {/* Page title */}
          <span className="text-sm font-medium text-[var(--color-foreground)] truncate max-w-[200px]">
            {initialTitle || 'Nowa strona'}
          </span>

          {/* Separator */}
          <div className="w-px h-5 bg-[var(--color-border)]" />

          {/* Device switcher */}
          <DevicesProvider>
            {({ devices, selected, select }) => (
              <div className="flex items-center gap-1">
                {devices.map((device) => {
                  const Icon = deviceIcons[device.getName?.() ?? ''] ?? Monitor
                  const isActive = selected === device.id
                  return (
                    <button
                      key={device.id}
                      type="button"
                      onClick={() => select(String(device.id))}
                      className={`p-1.5 rounded-[var(--radius-sm)] transition-colors ${
                        isActive
                          ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]'
                          : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-elevated)]'
                      }`}
                      title={device.getName()}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  )
                })}
              </div>
            )}
          </DevicesProvider>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => editorRef.current?.UndoManager.undo()}
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-elevated)] transition-colors"
              title="Cofnij (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editorRef.current?.UndoManager.redo()}
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-elevated)] transition-colors"
              title="Ponów (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Separator */}
          <div className="w-px h-5 bg-[var(--color-border)]" />

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium border border-[var(--color-border-hover)] text-[var(--color-foreground)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Zapisywanie...' : 'Zapisz'}
          </button>

          {/* Publish */}
          <button
            type="button"
            onClick={handlePublish}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium text-white gradient-bg shadow-[var(--shadow-pink)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            <Globe className="w-3.5 h-3.5" />
            Opublikuj
          </button>
        </div>

        {/* ── Main layout: left sidebar + canvas + right sidebar ── */}
        <div className="flex flex-1 min-h-0">

          {/* ── Left Sidebar: Blocks ─────────────────────────────── */}
          <div className="w-[280px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] overflow-y-auto scrollbar-thin flex flex-col">
            <div className="px-3 py-2.5 border-b border-[var(--color-border)] flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-[var(--color-primary)]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Bloki
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <BlocksProvider>
                {({ mapCategoryBlocks, dragStart, dragStop }) => (
                  <div className="space-y-1">
                    {Array.from(mapCategoryBlocks).map(([category, blocks]) => (
                      <BlockCategory
                        key={category}
                        category={category}
                        blocks={blocks}
                        dragStart={dragStart}
                        dragStop={dragStop}
                      />
                    ))}
                  </div>
                )}
              </BlocksProvider>
            </div>
          </div>

          {/* ── Canvas ───────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 relative">
            {/* Inject CSS into the canvas iframe */}
            <Canvas
              className="h-full w-full"
              // @ts-expect-error GrapesJS canvas accepts additional frame styles
              frameStyle={CANVAS_CSS}
            />
          </div>

          {/* ── Right Sidebar: Styles / Traits / Layers ──────────── */}
          {showRightPanel && (
            <div className="w-[280px] shrink-0 border-l border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-[var(--color-border)] shrink-0">
                {([
                  { key: 'styles' as RightTab, icon: Paintbrush, label: 'Style' },
                  { key: 'traits' as RightTab, icon: Settings, label: 'Ustawienia' },
                  { key: 'layers' as RightTab, icon: Layers, label: 'Warstwy' },
                ] as const).map(({ key, icon: Icon, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRightTab(key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium transition-colors ${
                      rightTab === key
                        ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                        : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {rightTab === 'styles' && (
                  <StylesProvider>
                    {(props) => <props.Container>{null}</props.Container>}
                  </StylesProvider>
                )}
                {rightTab === 'traits' && (
                  <TraitsProvider>
                    {(props) => <props.Container>{null}</props.Container>}
                  </TraitsProvider>
                )}
                {rightTab === 'layers' && (
                  <LayersProvider>
                    {(props) => <props.Container>{null}</props.Container>}
                  </LayersProvider>
                )}
              </div>

              {/* Close panel button */}
              <button
                type="button"
                onClick={() => setShowRightPanel(false)}
                className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 border-t border-[var(--color-border)] text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
              >
                Zamknij panel
              </button>
            </div>
          )}
        </div>
      </GjsEditor>
    </div>
  )
}

// ─── Block Category (collapsible) ───────────────────────────────────────────

interface BlockCategoryProps {
  category: string
  blocks: GjsBlock[]
  dragStart: (block: GjsBlock, ev?: Event) => void
  dragStop: (cancel?: boolean) => void
}

function BlockCategory({ category, blocks, dragStart, dragStop }: BlockCategoryProps) {
  const [open, setOpen] = useState(true)

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-elevated)] transition-colors"
      >
        {open ? (
          <ChevronDown className="w-3 h-3 shrink-0" />
        ) : (
          <ChevronRight className="w-3 h-3 shrink-0" />
        )}
        {category || 'Inne'}
      </button>
      {open && (
        <div className="grid grid-cols-2 gap-1.5 px-1 pt-1 pb-2">
          {blocks.map((block) => (
            <div
              key={block.getId()}
              className="flex flex-col items-center gap-1 p-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-muted)] cursor-grab active:cursor-grabbing transition-colors select-none"
              draggable
              onDragStart={(ev) => dragStart(block, ev.nativeEvent)}
              onDragEnd={() => dragStop(false)}
            >
              <div
                className="w-6 h-6 text-[var(--color-muted-foreground)] [&_svg]:w-full [&_svg]:h-full"
                dangerouslySetInnerHTML={{
                  __html: block.getMedia()?.toString() ?? '',
                }}
              />
              <span className="text-[10px] text-center leading-tight text-[var(--color-muted-foreground)] line-clamp-2">
                {block.getLabel()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
