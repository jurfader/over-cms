'use client'

import { Bell, Search, LogOut, User, ChevronDown, Sun, Moon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'

interface TopbarProps {
  sidebarCollapsed: boolean
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [animating, setAnimating] = useState(false)

  useEffect(() => setMounted(true), [])

  function toggle() {
    setAnimating(true)
    setTheme(theme === 'dark' ? 'light' : 'dark')
    setTimeout(() => setAnimating(false), 400)
  }

  if (!mounted) return <div className="w-9 h-9" />

  const isDark = theme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={isDark ? 'Włącz tryb jasny' : 'Włącz tryb ciemny'}
      className="relative overflow-hidden"
    >
      <span className={animating ? 'animate-theme-switch' : ''}>
        {isDark ? (
          <Sun className="w-4 h-4 text-[var(--color-muted-foreground)]" />
        ) : (
          <Moon className="w-4 h-4 text-[var(--color-muted-foreground)]" />
        )}
      </span>
    </Button>
  )
}

export function Topbar({ sidebarCollapsed }: TopbarProps) {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  async function handleLogout() {
    await api.post('/api/auth/sign-out', {}).catch(() => {})
    logout()
    router.push('/auth/login')
  }

  return (
    <header
      className="fixed top-0 right-0 z-30 h-[var(--topbar-height)] glass border-b border-[var(--color-border)] flex items-center gap-3 px-4 transition-all duration-[250ms]"
      style={{
        left: sidebarCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
      }}
    >
      {/* Search */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-subtle)]" />
          <input
            type="search"
            placeholder="Szukaj..."
            suppressHydrationWarning
            className="w-full h-8 pl-9 pr-3 rounded-[var(--radius)] bg-[var(--color-surface)] border border-[var(--color-border-hover)] text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-subtle)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full gradient-bg" />
        </Button>

        {/* Divider */}
        <div className="w-px h-5 bg-[var(--color-border-hover)] mx-1" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-[var(--radius)] px-2 py-1.5 hover:bg-[var(--color-surface-elevated)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.image ?? undefined} />
                <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-medium text-[var(--color-foreground)] leading-none">
                  {user?.name ?? 'Użytkownik'}
                </p>
                <p className="text-[10px] text-[var(--color-subtle)] leading-none mt-0.5">
                  {user?.role}
                </p>
              </div>
              <ChevronDown className="w-3 h-3 text-[var(--color-subtle)] hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-[var(--color-subtle)] truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-[var(--color-destructive)] focus:text-[var(--color-destructive)]"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Wyloguj
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
