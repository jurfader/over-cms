'use client'

import { motion, type Variants } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Users, Loader2, ShieldCheck, Shield, Pencil, Eye } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────────────────

type Role = 'super_admin' | 'admin' | 'editor' | 'viewer'

interface UserRow {
  id:            string
  name:          string
  email:         string
  role:          Role
  emailVerified: boolean
  image:         string | null
  createdAt:     string
}

// ─── Role config ────────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<Role, {
  label: string
  variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'
  icon: typeof ShieldCheck
}> = {
  super_admin: { label: 'Super Admin', variant: 'destructive', icon: ShieldCheck },
  admin:       { label: 'Admin',       variant: 'default',     icon: Shield },
  editor:      { label: 'Edytor',      variant: 'secondary',   icon: Pencil },
  viewer:      { label: 'Widz',        variant: 'outline',     icon: Eye },
}

// ─── Animations ─────────────────────────────────────────────────────────────────

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<{ data: UserRow[] }>('/api/users'),
    select: (r) => r.data,
    staleTime: 30_000,
  })

  const users = data ?? []

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Użytkownicy</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Lista wszystkich użytkowników systemu
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
          <Users className="w-4 h-4" />
          <span>{users.length} {users.length === 1 ? 'użytkownik' : 'użytkowników'}</span>
        </div>
      </motion.div>

      {/* Users table */}
      <motion.div variants={item}>
        <Card className="p-0 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_140px_140px] px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-subtle)]">
              Imię
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-subtle)]">
              Email
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-subtle)]">
              Rola
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-subtle)]">
              Utworzony
            </span>
          </div>

          {/* Loading state */}
          {isLoading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]" />
            </div>
          ) : users.length === 0 ? (
            /* Empty state */
            <div className="py-16 text-center">
              <Users className="w-10 h-10 mx-auto mb-3 text-[var(--color-subtle)] opacity-30" />
              <p className="text-sm text-[var(--color-muted-foreground)]">Brak użytkowników</p>
            </div>
          ) : (
            /* Rows */
            <div className="divide-y divide-[var(--color-border)]">
              {users.map((u) => {
                const roleConfig = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.editor
                const RoleIcon = roleConfig.icon

                return (
                  <div
                    key={u.id}
                    className="grid grid-cols-[1fr_1fr_140px_140px] items-center px-6 py-4 hover:bg-[var(--color-surface-elevated)] transition-colors"
                  >
                    {/* Name */}
                    <div className="min-w-0 pr-4">
                      <p className="text-sm font-medium text-[var(--color-foreground)] truncate">
                        {u.name}
                      </p>
                    </div>

                    {/* Email */}
                    <div className="min-w-0 pr-4">
                      <p className="text-sm text-[var(--color-muted-foreground)] truncate">
                        {u.email}
                      </p>
                    </div>

                    {/* Role badge */}
                    <div>
                      <Badge variant={roleConfig.variant}>
                        <RoleIcon className="w-3 h-3" />
                        {roleConfig.label}
                      </Badge>
                    </div>

                    {/* Created at */}
                    <div>
                      <span className="text-xs text-[var(--color-subtle)]">
                        {formatDate(u.createdAt)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  )
}
