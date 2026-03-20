'use client'

import { useState } from 'react'
import { ChevronDown, Link2, Link2Off, Monitor, Tablet, Smartphone, EyeOff } from 'lucide-react'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Switch }   from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { BlockStyle } from '@overcms/core'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function upd<K extends keyof BlockStyle>(s: BlockStyle, k: K, v: BlockStyle[K]): BlockStyle {
  return { ...s, [k]: v }
}

// ─── Accordion section ─────────────────────────────────────────────────────────

function Section({ title, children, defaultOpen = false }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)] transition-colors text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
          {title}
        </span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-[var(--color-subtle)] transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="p-3 space-y-3 bg-[var(--color-background)]">{children}</div>}
    </div>
  )
}

// ─── Color input ───────────────────────────────────────────────────────────────

function ColorInput({ value, onChange, placeholder = '#000000' }: {
  value?: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-10 shrink-0 cursor-pointer rounded border border-[var(--color-border)] bg-transparent p-0.5"
      />
      <Input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="font-mono text-xs h-8"
      />
    </div>
  )
}

// ─── Size input (value + unit) ─────────────────────────────────────────────────

const UNITS = ['px', '%', 'rem', 'em', 'vh', 'vw']

function SizeInput({ value, onChange, placeholder = '0' }: {
  value?: string; onChange: (v: string) => void; placeholder?: string
}) {
  const match = value?.match(/^(-?[\d.]+)(px|%|rem|em|vh|vw)$/)
  const num  = match ? match[1] : (value && value !== 'auto' ? value.replace(/[a-z%]/gi, '') : '')
  const unit = match ? match[2] : 'px'
  const isAuto = value === 'auto'

  return (
    <div className="flex gap-1">
      <Input
        type="number"
        value={isAuto ? '' : num}
        onChange={(e) => onChange(e.target.value ? e.target.value + unit : '')}
        placeholder={isAuto ? 'auto' : placeholder}
        disabled={isAuto}
        className="h-8 text-xs font-mono"
      />
      <select
        value={isAuto ? 'auto' : unit}
        onChange={(e) => {
          if (e.target.value === 'auto') onChange('auto')
          else onChange((num || '0') + e.target.value)
        }}
        className="h-8 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-1.5 text-xs font-mono shrink-0"
      >
        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
        <option value="auto">auto</option>
      </select>
    </div>
  )
}

// ─── Four sides input (margin / padding) ───────────────────────────────────────

type Side = 'Top' | 'Right' | 'Bottom' | 'Left'
const SIDES: Side[] = ['Top', 'Right', 'Bottom', 'Left']
const SIDE_LABELS: Record<Side, string> = { Top: 'T', Right: 'P', Bottom: 'D', Left: 'L' }

function FourSidesInput({ prefix, style, onChange }: {
  prefix: 'margin' | 'padding'
  style:  BlockStyle
  onChange: (s: BlockStyle) => void
}) {
  const [linked, setLinked] = useState(false)

  function getKey(side: Side): keyof BlockStyle {
    return `${prefix}${side}` as keyof BlockStyle
  }

  function handleChange(side: Side, val: string) {
    if (linked) {
      const next = { ...style }
      SIDES.forEach((s) => { (next as Record<string, unknown>)[getKey(s)] = val })
      onChange(next)
    } else {
      onChange(upd(style, getKey(side), val as BlockStyle[keyof BlockStyle]))
    }
  }

  return (
    <div className="flex items-center gap-2">
      {SIDES.map((side) => (
        <div key={side} className="flex-1 space-y-0.5">
          <span className="text-[10px] text-[var(--color-subtle)] block text-center">{SIDE_LABELS[side]}</span>
          <SizeInput
            value={(style[getKey(side)] as string) ?? ''}
            onChange={(v) => handleChange(side, v)}
            placeholder="0"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => setLinked((v) => !v)}
        className={cn(
          'self-end mb-0.5 p-1.5 rounded border transition-colors',
          linked
            ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
            : 'border-[var(--color-border)] text-[var(--color-subtle)] hover:border-[var(--color-primary)]',
        )}
        title={linked ? 'Rozłącz' : 'Połącz wszystkie'}
      >
        {linked ? <Link2 className="w-3 h-3" /> : <Link2Off className="w-3 h-3" />}
      </button>
    </div>
  )
}

// ─── Chip group ────────────────────────────────────────────────────────────────

function Chips<T extends string>({ value, options, onChange }: {
  value?: T; options: { value: T; label: string }[]; onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'px-2 py-0.5 rounded text-[11px] font-medium border transition-colors',
            value === o.value
              ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
              : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ─── Row helper ────────────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[90px_1fr] items-center gap-2">
      <Label className="text-[11px] text-[var(--color-subtle)]">{label}</Label>
      <div>{children}</div>
    </div>
  )
}

// ─── Slider input ──────────────────────────────────────────────────────────────

function SliderRow({ label, value, onChange, min = 0, max = 100, unit = '' }: {
  label: string; value?: string; onChange: (v: string) => void
  min?: number; max?: number; unit?: string
}) {
  const num = parseFloat(value ?? String(min === 0 ? '' : min))
  const display = isNaN(num) ? min : num
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] text-[var(--color-subtle)]">{label}</Label>
        <span className="text-[11px] font-mono text-[var(--color-muted-foreground)]">{display}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={unit === 'deg' ? 1 : (max <= 10 ? 0.1 : 1)}
        value={display}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-1.5 appearance-none rounded-full bg-[var(--color-border)] accent-[var(--color-primary)] cursor-pointer"
      />
    </div>
  )
}

// ─── Border corner radius ─────────────────────────────────────────────────────

const CORNERS = [
  { key: 'borderTopLeftRadius'     as const, label: '↖' },
  { key: 'borderTopRightRadius'    as const, label: '↗' },
  { key: 'borderBottomRightRadius' as const, label: '↘' },
  { key: 'borderBottomLeftRadius'  as const, label: '↙' },
]

// ─── Main component ────────────────────────────────────────────────────────────

interface BlockStyleEditorProps {
  style:    BlockStyle
  onChange: (style: BlockStyle) => void
}

export function BlockStyleEditor({ style, onChange }: BlockStyleEditorProps) {
  const s = style

  return (
    <div className="space-y-2 text-sm">

      {/* ── Background ─────────────────────────────────────────────── */}
      <Section title="Tło">
        <Row label="Typ">
          <Chips
            value={s.bgType ?? 'none'}
            options={[
              { value: 'none',     label: 'Brak'     },
              { value: 'color',    label: 'Kolor'    },
              { value: 'gradient', label: 'Gradient' },
              { value: 'image',    label: 'Obraz'    },
            ]}
            onChange={(v) => onChange(upd(s, 'bgType', v))}
          />
        </Row>

        {s.bgType === 'color' && (
          <Row label="Kolor"><ColorInput value={s.bgColor} onChange={(v) => onChange(upd(s, 'bgColor', v))} /></Row>
        )}

        {s.bgType === 'gradient' && (
          <>
            <Row label="Od"><ColorInput value={s.bgGradientFrom} onChange={(v) => onChange(upd(s, 'bgGradientFrom', v))} /></Row>
            <Row label="Do"><ColorInput value={s.bgGradientTo}   onChange={(v) => onChange(upd(s, 'bgGradientTo',   v))} /></Row>
            <SliderRow label="Kąt" value={s.bgGradientAngle} onChange={(v) => onChange(upd(s, 'bgGradientAngle', v))} min={0} max={360} unit="°" />
          </>
        )}

        {s.bgType === 'image' && (
          <>
            <Row label="URL">
              <Input value={s.bgImage ?? ''} onChange={(e) => onChange(upd(s, 'bgImage', e.target.value))} placeholder="https://..." className="h-8 text-xs" />
            </Row>
            <Row label="Rozmiar">
              <Chips
                value={s.bgSize ?? 'cover'}
                options={[{ value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }, { value: 'auto', label: 'Auto' }]}
                onChange={(v) => onChange(upd(s, 'bgSize', v))}
              />
            </Row>
            <Row label="Pozycja">
              <Input value={s.bgPosition ?? ''} onChange={(e) => onChange(upd(s, 'bgPosition', e.target.value))} placeholder="center center" className="h-8 text-xs font-mono" />
            </Row>
            <Row label="Overlay"><ColorInput value={s.bgOverlayColor} onChange={(v) => onChange(upd(s, 'bgOverlayColor', v))} /></Row>
            <SliderRow label="Krycie overlay" value={s.bgOverlayOpacity} onChange={(v) => onChange(upd(s, 'bgOverlayOpacity', v))} min={0} max={100} unit="%" />
          </>
        )}
      </Section>

      {/* ── Typography ─────────────────────────────────────────────── */}
      <Section title="Typografia">
        <Row label="Kolor tekstu"><ColorInput value={s.textColor} onChange={(v) => onChange(upd(s, 'textColor', v))} /></Row>
        <Row label="Wyrównanie">
          <Chips
            value={s.textAlign ?? 'left'}
            options={[
              { value: 'left',    label: '←' },
              { value: 'center',  label: '↔' },
              { value: 'right',   label: '→' },
              { value: 'justify', label: '≡' },
            ]}
            onChange={(v) => onChange(upd(s, 'textAlign', v))}
          />
        </Row>
        <Row label="Czcionka">
          <Input value={s.fontFamily ?? ''} onChange={(e) => onChange(upd(s, 'fontFamily', e.target.value))} placeholder="Inter, sans-serif" className="h-8 text-xs font-mono" />
        </Row>
        <Row label="Rozmiar"><SizeInput value={s.fontSize} onChange={(v) => onChange(upd(s, 'fontSize', v))} placeholder="16" /></Row>
        <Row label="Grubość">
          <Chips
            value={s.fontWeight}
            options={[
              { value: '300', label: '300' },
              { value: '400', label: '400' },
              { value: '500', label: '500' },
              { value: '600', label: '600' },
              { value: '700', label: '700' },
              { value: '800', label: '800' },
              { value: '900', label: '900' },
            ]}
            onChange={(v) => onChange(upd(s, 'fontWeight', v))}
          />
        </Row>
        <Row label="Styl">
          <Chips
            value={s.fontStyle ?? 'normal'}
            options={[{ value: 'normal', label: 'Normal' }, { value: 'italic', label: 'Italic' }]}
            onChange={(v) => onChange(upd(s, 'fontStyle', v))}
          />
        </Row>
        <Row label="Interl."><SizeInput value={s.lineHeight}    onChange={(v) => onChange(upd(s, 'lineHeight',    v))} placeholder="1.5" /></Row>
        <Row label="Odstęp"><SizeInput  value={s.letterSpacing} onChange={(v) => onChange(upd(s, 'letterSpacing', v))} placeholder="0" /></Row>
        <Row label="Transform">
          <Chips
            value={s.textTransform ?? 'none'}
            options={[
              { value: 'none',       label: 'Brak' },
              { value: 'uppercase',  label: 'AA'   },
              { value: 'lowercase',  label: 'aa'   },
              { value: 'capitalize', label: 'Aa'   },
            ]}
            onChange={(v) => onChange(upd(s, 'textTransform', v))}
          />
        </Row>
        <Row label="Dekoracja">
          <Chips
            value={s.textDecoration ?? 'none'}
            options={[
              { value: 'none',         label: 'Brak'       },
              { value: 'underline',    label: 'Podkreślenie' },
              { value: 'line-through', label: 'Przekreślenie' },
            ]}
            onChange={(v) => onChange(upd(s, 'textDecoration', v))}
          />
        </Row>
      </Section>

      {/* ── Margin ─────────────────────────────────────────────────── */}
      <Section title="Margines (Margin)">
        <FourSidesInput prefix="margin" style={s} onChange={onChange} />
      </Section>

      {/* ── Padding ────────────────────────────────────────────────── */}
      <Section title="Wewnętrzny odstęp (Padding)">
        <FourSidesInput prefix="padding" style={s} onChange={onChange} />
      </Section>

      {/* ── Size ───────────────────────────────────────────────────── */}
      <Section title="Rozmiar">
        <Row label="Szerokość">   <SizeInput value={s.width}     onChange={(v) => onChange(upd(s, 'width',     v))} /></Row>
        <Row label="Max. szer.">  <SizeInput value={s.maxWidth}  onChange={(v) => onChange(upd(s, 'maxWidth',  v))} /></Row>
        <Row label="Wysokość">    <SizeInput value={s.height}    onChange={(v) => onChange(upd(s, 'height',    v))} /></Row>
        <Row label="Min. wys.">   <SizeInput value={s.minHeight} onChange={(v) => onChange(upd(s, 'minHeight', v))} /></Row>
      </Section>

      {/* ── Border ─────────────────────────────────────────────────── */}
      <Section title="Obramowanie">
        <div className="space-y-1">
          <Label className="text-[11px] text-[var(--color-subtle)]">Grubość (T / P / D / L)</Label>
          <div className="grid grid-cols-4 gap-1">
            {(['Top','Right','Bottom','Left'] as const).map((side) => (
              <SizeInput
                key={side}
                value={(s[`border${side}Width` as keyof BlockStyle] as string) ?? ''}
                onChange={(v) => onChange(upd(s, `border${side}Width` as keyof BlockStyle, v as BlockStyle[keyof BlockStyle]))}
                placeholder="0"
              />
            ))}
          </div>
        </div>
        <Row label="Styl">
          <Chips
            value={s.borderStyle ?? 'solid'}
            options={[
              { value: 'solid',  label: 'Linia'    },
              { value: 'dashed', label: 'Kreski'   },
              { value: 'dotted', label: 'Kropki'   },
              { value: 'double', label: 'Podwójne' },
            ]}
            onChange={(v) => onChange(upd(s, 'borderStyle', v))}
          />
        </Row>
        <Row label="Kolor"><ColorInput value={s.borderColor} onChange={(v) => onChange(upd(s, 'borderColor', v))} /></Row>

        <div className="space-y-1">
          <Label className="text-[11px] text-[var(--color-subtle)]">Zaokrąglenie narożników</Label>
          <div className="grid grid-cols-4 gap-1">
            {CORNERS.map((c) => (
              <div key={c.key} className="space-y-0.5">
                <span className="text-[10px] text-[var(--color-subtle)] block text-center">{c.label}</span>
                <SizeInput
                  value={(s[c.key] as string) ?? ''}
                  onChange={(v) => onChange(upd(s, c.key, v))}
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Box Shadow ─────────────────────────────────────────────── */}
      <Section title="Cień (Box Shadow)">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-0.5">
            <Label className="text-[11px] text-[var(--color-subtle)]">X offset</Label>
            <SizeInput value={s.shadowX} onChange={(v) => onChange(upd(s, 'shadowX', v))} placeholder="0" />
          </div>
          <div className="space-y-0.5">
            <Label className="text-[11px] text-[var(--color-subtle)]">Y offset</Label>
            <SizeInput value={s.shadowY} onChange={(v) => onChange(upd(s, 'shadowY', v))} placeholder="4" />
          </div>
          <div className="space-y-0.5">
            <Label className="text-[11px] text-[var(--color-subtle)]">Rozmycie</Label>
            <SizeInput value={s.shadowBlur} onChange={(v) => onChange(upd(s, 'shadowBlur', v))} placeholder="8" />
          </div>
          <div className="space-y-0.5">
            <Label className="text-[11px] text-[var(--color-subtle)]">Rozproszenie</Label>
            <SizeInput value={s.shadowSpread} onChange={(v) => onChange(upd(s, 'shadowSpread', v))} placeholder="0" />
          </div>
        </div>
        <Row label="Kolor"><ColorInput value={s.shadowColor} onChange={(v) => onChange(upd(s, 'shadowColor', v))} placeholder="rgba(0,0,0,0.15)" /></Row>
        <Row label="Wewnętrzny">
          <Switch checked={s.shadowInset ?? false} onCheckedChange={(v) => onChange(upd(s, 'shadowInset', v))} />
        </Row>
      </Section>

      {/* ── Filters ────────────────────────────────────────────────── */}
      <Section title="Filtry">
        <SliderRow label="Krycie"      value={s.opacity}    onChange={(v) => onChange(upd(s, 'opacity',    v))} min={0}   max={100} unit="%" />
        <SliderRow label="Rozmycie"    value={s.blur}       onChange={(v) => onChange(upd(s, 'blur',       v))} min={0}   max={20}  unit="px" />
        <SliderRow label="Jasność"     value={s.brightness} onChange={(v) => onChange(upd(s, 'brightness', v))} min={0}   max={200} unit="%" />
        <SliderRow label="Kontrast"    value={s.contrast}   onChange={(v) => onChange(upd(s, 'contrast',   v))} min={0}   max={200} unit="%" />
        <SliderRow label="Nasycenie"   value={s.saturate}   onChange={(v) => onChange(upd(s, 'saturate',   v))} min={0}   max={200} unit="%" />
        <SliderRow label="Skala szar." value={s.grayscale}  onChange={(v) => onChange(upd(s, 'grayscale',  v))} min={0}   max={100} unit="%" />
      </Section>

      {/* ── Transform ──────────────────────────────────────────────── */}
      <Section title="Transformacja">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-0.5">
            <Label className="text-[11px] text-[var(--color-subtle)]">Obrót (deg)</Label>
            <Input value={s.rotate ?? ''} onChange={(e) => onChange(upd(s, 'rotate', e.target.value))} placeholder="0" className="h-8 text-xs font-mono" />
          </div>
          <div className="space-y-0.5">
            <Label className="text-[11px] text-[var(--color-subtle)]">Skala X</Label>
            <Input value={s.scaleX ?? ''} onChange={(e) => onChange(upd(s, 'scaleX', e.target.value))} placeholder="1" className="h-8 text-xs font-mono" />
          </div>
          <div className="space-y-0.5">
            <Label className="text-[11px] text-[var(--color-subtle)]">Skala Y</Label>
            <Input value={s.scaleY ?? ''} onChange={(e) => onChange(upd(s, 'scaleY', e.target.value))} placeholder="1" className="h-8 text-xs font-mono" />
          </div>
          <div className="space-y-0.5">
            <Label className="text-[11px] text-[var(--color-subtle)]">Przesuń X</Label>
            <SizeInput value={s.translateX} onChange={(v) => onChange(upd(s, 'translateX', v))} placeholder="0" />
          </div>
          <div className="space-y-0.5">
            <Label className="text-[11px] text-[var(--color-subtle)]">Przesuń Y</Label>
            <SizeInput value={s.translateY} onChange={(v) => onChange(upd(s, 'translateY', v))} placeholder="0" />
          </div>
          <div className="space-y-0.5">
            <Label className="text-[11px] text-[var(--color-subtle)]">Skos X (deg)</Label>
            <Input value={s.skewX ?? ''} onChange={(e) => onChange(upd(s, 'skewX', e.target.value))} placeholder="0" className="h-8 text-xs font-mono" />
          </div>
          <div className="space-y-0.5">
            <Label className="text-[11px] text-[var(--color-subtle)]">Skos Y (deg)</Label>
            <Input value={s.skewY ?? ''} onChange={(e) => onChange(upd(s, 'skewY', e.target.value))} placeholder="0" className="h-8 text-xs font-mono" />
          </div>
        </div>
      </Section>

      {/* ── Visibility ─────────────────────────────────────────────── */}
      <Section title="Widoczność">
        <div className="space-y-2">
          {[
            { key: 'hideDesktop' as const, icon: Monitor,    label: 'Ukryj na desktopie'  },
            { key: 'hideTablet'  as const, icon: Tablet,     label: 'Ukryj na tablecie'   },
            { key: 'hideMobile'  as const, icon: Smartphone, label: 'Ukryj na telefonie'  },
            { key: 'hidden'      as const, icon: EyeOff,     label: 'Ukryj całkowicie'     },
          ].map(({ key, icon: Icon, label }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-[var(--color-subtle)]" />
                <span className="text-xs">{label}</span>
              </div>
              <Switch
                checked={(s[key] as boolean) ?? false}
                onCheckedChange={(v) => onChange(upd(s, key, v))}
              />
            </div>
          ))}
        </div>
      </Section>

      {/* ── Custom CSS ─────────────────────────────────────────────── */}
      <Section title="Własny CSS">
        <div className="space-y-1.5">
          <Label className="text-[11px] text-[var(--color-subtle)]">Klasa CSS</Label>
          <Input
            value={s.customClass ?? ''}
            onChange={(e) => onChange(upd(s, 'customClass', e.target.value))}
            placeholder="moja-klasa inna-klasa"
            className="font-mono text-xs h-8"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] text-[var(--color-subtle)]">Inline CSS</Label>
          <Textarea
            value={s.customCss ?? ''}
            onChange={(e) => onChange(upd(s, 'customCss', e.target.value))}
            placeholder={'color: red;\nfont-size: 20px;'}
            rows={4}
            className="font-mono text-xs resize-none"
          />
        </div>
      </Section>

    </div>
  )
}
