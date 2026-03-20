import type { Metadata } from 'next'
import './globals.css'
import { Header }        from '@/components/layout/header'
import { Footer }        from '@/components/layout/footer'
import { LenisProvider } from '@/components/lenis-provider'
import { cms }           from '@/lib/cms'

export const metadata: Metadata = {
  title:       { template: '%s | OverCMS', default: 'OverCMS' },
  description: 'Powered by OverCMS',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [mainNav, footerNav] = await Promise.all([
    cms.navigation.get('main').catch(() => []),
    cms.navigation.get('footer').catch(() => []),
  ])

  return (
    <html lang="pl">
      <body>
        <LenisProvider>
          <Header nav={mainNav} />
          <main>{children}</main>
          <Footer nav={footerNav} />
        </LenisProvider>
      </body>
    </html>
  )
}
