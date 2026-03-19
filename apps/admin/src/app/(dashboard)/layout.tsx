'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { useAuth } from '@/hooks/use-auth'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  useAuth({ required: true })

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <Topbar sidebarCollapsed={collapsed} />

      {/* Main content */}
      <main
        className="min-h-screen pt-[var(--topbar-height)] transition-all duration-[250ms]"
        style={{
          paddingLeft: collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
        }}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
