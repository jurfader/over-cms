import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title:       { template: '%s | OverCMS', default: 'OverCMS — Headless CMS' },
  description: 'Nowoczesny headless CMS dla agencji i deweloperów.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="min-h-screen">
        {/* ─── Nav ─────────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 border-b border-white/8 glass">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <a href="/" className="font-bold text-xl tracking-tight gradient-text">
              Over<span className="text-white">CMS</span>
            </a>
            <nav className="flex items-center gap-6 text-sm text-[var(--color-muted)]">
              <a href="/#pricing"    className="hover:text-white transition-colors">Cennik</a>
              <a href="/portal"      className="hover:text-white transition-colors">Moje licencje</a>
              <a href="/portal" className="px-4 py-1.5 rounded-full text-sm font-medium bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity">
                Zarządzaj
              </a>
            </nav>
          </div>
        </header>

        {children}

        {/* ─── Footer ──────────────────────────────────────────────────────── */}
        <footer className="border-t border-white/8 py-10 mt-20">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--color-muted)]">
            <span>© {new Date().getFullYear()} OverCMS. Wszelkie prawa zastrzeżone.</span>
            <div className="flex gap-6">
              <a href="/portal" className="hover:text-white transition-colors">Portal klienta</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
