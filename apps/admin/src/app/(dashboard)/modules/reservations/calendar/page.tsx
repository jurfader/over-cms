'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'

const MODULE_API = '/api/m/reservations'

const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
]
const DAY_HEADERS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz']

export default function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-indexed

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

  const { data: events } = useQuery({
    queryKey: ['rsv-calendar', monthStr],
    queryFn: async () => {
      const r = await api.get<{data:any}>(`${MODULE_API}/admin/calendar?month=${monthStr}`)
      return (r as { data: Array<Record<string, unknown>> }).data
    },
  })

  // Build calendar grid
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7 // Monday = 0
  const totalDays = lastDay.getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  // Group events by date
  const byDate = new Map<string, Array<Record<string, unknown>>>()
  if (events) {
    for (const e of events as Array<Record<string, unknown>>) {
      const d = e.date as string
      if (!byDate.has(d)) byDate.set(d, [])
      byDate.get(d)!.push(e)
    }
  }

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const todayStr = now.toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/modules/reservations"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <h1 className="text-xl font-bold">Kalendarz rezerwacji</h1>
        </div>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="ghost" size="sm" onClick={prevMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold min-w-[200px] text-center">
          {MONTH_NAMES[month]} {year}
        </h2>
        <Button variant="ghost" size="sm" onClick={nextMonth}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--glass-card-bg)] overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
          {DAY_HEADERS.map(d => (
            <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">
              {d}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) return <div key={idx} className="min-h-[100px] border-b border-r border-[var(--color-border)] bg-[var(--color-surface)]/30" />

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayEvents = byDate.get(dateStr) ?? []
            const isToday = dateStr === todayStr

            return (
              <div
                key={idx}
                className={`min-h-[100px] border-b border-r border-[var(--color-border)] p-1.5 ${
                  isToday ? 'bg-[var(--color-primary)]/5' : ''
                }`}
              >
                <div className={`text-xs font-medium mb-1 ${
                  isToday ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--color-muted-foreground)]'
                }`}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((e, i) => (
                    <Link
                      key={i}
                      href={`/modules/reservations/list/${e.id}`}
                      className="block px-1.5 py-0.5 rounded text-[10px] truncate hover:opacity-80 transition-opacity"
                      style={{
                        background: 'var(--color-primary)',
                        opacity: e.status === 'cancelled' ? 0.3 : 0.8,
                        color: '#fff',
                      }}
                      title={`${e.startTime} ${e.customerName} — ${e.serviceName}`}
                    >
                      {e.startTime as string} {e.customerName as string}
                    </Link>
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="text-[10px] text-[var(--color-muted-foreground)] px-1">
                      +{dayEvents.length - 3} więcej
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
