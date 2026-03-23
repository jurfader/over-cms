'use client'

import { useState }          from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link                  from 'next/link'
import { usePathname }       from 'next/navigation'
import {
  LayoutDashboard, FileText, Image, Settings, Users,
  Search, Puzzle, Globe, Navigation, ChevronRight,
  PanelLeftClose, PanelLeftOpen, ShoppingCart, BarChart3, Mail,
} from 'lucide-react'
import { useQuery }   from '@tanstack/react-query'
import { api }        from '@/lib/api'
import { cn }         from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const APP_VERSION = process.env['APP_VERSION'] ?? '0.0.0'

// ─── Module icon map ──────────────────────────────────────────────────────────

const MODULE_ICONS: Record<string, React.ElementType> = {
  FileText, ShoppingCart, Globe, BarChart3, Mail, Puzzle,
}

interface ModuleRow {
  id:       string
  active:   boolean
  adminNav: { label: string; path: string; icon?: string } | null
}

// ─── Nav types ────────────────────────────────────────────────────────────────

interface NavItem {
  label:  string
  href:   string
  icon:   React.ElementType
  badge?: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

// ─── Static nav ───────────────────────────────────────────────────────────────

const navGroups: NavGroup[] = [
  {
    label: 'Główne',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Strony',    href: '/pages',      icon: Globe },
      { label: 'Media',     href: '/media',      icon: Image },
    ],
  },
  {
    label: 'Witryna',
    items: [
      { label: 'SEO',       href: '/seo',        icon: Search },
      { label: 'Nawigacja', href: '/navigation',  icon: Navigation },
      { label: 'Treści',    href: '/content',     icon: FileText },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Użytkownicy', href: '/users',    icon: Users },
      { label: 'Ustawienia',  href: '/settings', icon: Settings },
    ],
  },
]

// ─── Collapsible modules item ─────────────────────────────────────────────────

interface ModulesNavItemProps {
  collapsed:      boolean
  moduleNavItems: NavItem[]
  isActive:       (href: string) => boolean
}

function ModulesNavItem({ collapsed, moduleNavItems, isActive }: ModulesNavItemProps) {
  const hasModules    = moduleNavItems.length > 0
  const anyChildActive = moduleNavItems.some((m) => isActive(m.href))
  const [open, setOpen] = useState(anyChildActive)

  const rootActive = isActive('/modules') && !anyChildActive

  const trigger = (
    <button
      onClick={() => !collapsed && setOpen((o) => !o)}
      className={cn(
        'group relative w-full flex items-center gap-3 rounded-[var(--radius)] px-2.5 py-2 text-sm font-medium transition-all duration-150',
        (rootActive || anyChildActive)
          ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]'
          : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-foreground)]',
        collapsed && 'justify-center px-2',
      )}
    >
      {(rootActive || anyChildActive) && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-[var(--color-primary)]" />
      )}

      <Puzzle className={cn(
        'w-4 h-4 shrink-0 transition-colors',
        (rootActive || anyChildActive)
          ? 'text-[var(--color-primary)]'
          : 'text-[var(--color-subtle)] group-hover:text-[var(--color-muted-foreground)]',
      )} />

      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.15 }}
            className="flex-1 truncate text-left"
          >
            Moduły
          </motion.span>
        )}
      </AnimatePresence>

      {!collapsed && hasModules && (
        <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--color-primary-muted)] text-[var(--color-primary)]">
          {moduleNavItems.length}
        </span>
      )}

      {!collapsed && (
        <ChevronRight className={cn(
          'w-3 h-3 shrink-0 transition-transform duration-200',
          open ? 'rotate-90' : '',
          !hasModules && 'opacity-0 group-hover:opacity-40',
        )} />
      )}
    </button>
  )

  return (
    <li>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/modules"
              className={cn(
                'group relative flex items-center justify-center rounded-[var(--radius)] px-2 py-2 text-sm font-medium transition-all duration-150',
                rootActive || anyChildActive
                  ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-foreground)]',
              )}
            >
              <Puzzle className="w-4 h-4 shrink-0" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-semibold mb-1">Moduły</p>
            {moduleNavItems.map((m) => (
              <p key={m.href} className="text-xs opacity-75">{m.label}</p>
            ))}
          </TooltipContent>
        </Tooltip>
      ) : (
        <>
          {/* Main row — links to /modules management */}
          <Link href="/modules" style={{ display: 'contents' }}>
            {trigger}
          </Link>

          {/* Sub-items */}
          <AnimatePresence initial={false}>
            {open && hasModules && (
              <motion.ul
                key="module-sub"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
                className="mt-0.5 space-y-0.5 pl-3"
              >
                {moduleNavItems.map((item) => {
                  const Icon   = item.icon
                  const active = isActive(item.href)
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'group relative flex items-center gap-2.5 rounded-[var(--radius)] pl-3 pr-2.5 py-1.5 text-sm font-medium transition-all duration-150 border-l border-[var(--color-border)]',
                          active
                            ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-muted)]'
                            : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-foreground)] hover:border-[var(--color-muted-foreground)]',
                        )}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </motion.ul>
            )}
          </AnimatePresence>
        </>
      )}
    </li>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean
  onToggle:  () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  const { data: moduleRows } = useQuery({
    queryKey:  ['modules'],
    queryFn:   () => api.get<{ data: ModuleRow[] }>('/api/modules'),
    select:    (r) => r.data.filter((m) => m.active && m.adminNav),
    staleTime: 60_000,
  })

  const moduleNavItems: NavItem[] = (moduleRows ?? []).map((m) => ({
    label: m.adminNav!.label,
    href:  m.adminNav!.path,
    icon:  MODULE_ICONS[m.adminNav!.icon ?? ''] ?? Puzzle,
  }))

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        animate={{ width: collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)' }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="fixed inset-y-0 left-0 z-40 flex flex-col glass border-r border-[var(--color-border)] overflow-hidden"
        style={{ width: collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)' }}
      >
        {/* Logo */}
        <div className="flex h-[var(--topbar-height)] items-center px-4 border-b border-[var(--color-border)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 rounded-[var(--radius)] gradient-bg flex items-center justify-center glow-pink">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" aria-hidden="true">
                <circle cx="12" cy="12" r="3" fill="currentColor" />
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
                <path d="M12 5a7 7 0 100 14A7 7 0 0012 5z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.75" />
              </svg>
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="font-bold text-base gradient-text whitespace-nowrap"
                >
                  OverCMS
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6 scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.label}>
              <AnimatePresence>
                {!collapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-subtle)]"
                  >
                    {group.label}
                  </motion.p>
                )}
              </AnimatePresence>

              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href)
                  const Icon   = item.icon

                  const linkContent = (
                    <Link
                      href={item.href}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-[var(--radius)] px-2.5 py-2 text-sm font-medium transition-all duration-150',
                        active
                          ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]'
                          : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-foreground)]',
                        collapsed && 'justify-center px-2',
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-[var(--color-primary)]" />
                      )}
                      <Icon className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        active ? 'text-[var(--color-primary)]' : 'text-[var(--color-subtle)] group-hover:text-[var(--color-muted-foreground)]',
                      )} />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -4 }}
                            transition={{ duration: 0.15 }}
                            className="flex-1 truncate"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {!collapsed && item.badge && (
                        <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--color-primary-muted)] text-[var(--color-primary)]">
                          {item.badge}
                        </span>
                      )}
                      {!collapsed && !active && (
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity shrink-0" />
                      )}
                    </Link>
                  )

                  if (collapsed) {
                    return (
                      <li key={item.href}>
                        <Tooltip>
                          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                          <TooltipContent side="right">{item.label}</TooltipContent>
                        </Tooltip>
                      </li>
                    )
                  }

                  return <li key={item.href}>{linkContent}</li>
                })}

                {/* Collapsible modules — injected into System group */}
                {group.label === 'System' && (
                  <ModulesNavItem
                    collapsed={collapsed}
                    moduleNavItems={moduleNavItems}
                    isActive={isActive}
                  />
                )}
              </ul>
            </div>
          ))}
        </nav>

        {/* Collapse toggle + version */}
        <div className="shrink-0 p-2 border-t border-[var(--color-border)]">
          <button
            onClick={onToggle}
            className={cn(
              'w-full flex items-center gap-3 rounded-[var(--radius)] px-2.5 py-2 text-sm text-[var(--color-subtle)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-muted-foreground)] transition-all duration-150',
              collapsed && 'justify-center px-2',
            )}
            aria-label={collapsed ? 'Rozwiń sidebar' : 'Zwiń sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4 shrink-0" />
                <AnimatePresence>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs"
                  >
                    Zwiń panel
                  </motion.span>
                </AnimatePresence>
              </>
            )}
          </button>
          <AnimatePresence>
            {!collapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                className="text-[10px] text-center text-[var(--color-subtle)] mt-1 select-none"
              >
                OverCMS v{APP_VERSION}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}
