import type { Metadata } from 'next'
import './globals.css'
import { Header }        from '@/components/layout/header'
import { Footer }        from '@/components/layout/footer'
import { LenisProvider } from '@/components/lenis-provider'
import { getGlobalHeader, getGlobalFooter } from '@/lib/cms'
import { BlockRenderer } from '@/components/blocks/block-renderer'

export const metadata: Metadata = {
  title: {
    template: '%s | OVERMEDIA',
    default:  'OVERMEDIA — Agencja Interaktywna | Polska',
  },
  description: 'Profesjonalne strony WWW, sklepy e-commerce, aplikacje mobilne, montaż wideo i kampanie reklamowe. OVERMEDIA — kompleksowe usługi digital dla Twojej firmy.',
  keywords:    ['strony internetowe', 'sklep WooCommerce', 'aplikacje mobilne', 'marketing cyfrowy', 'Google Ads', 'agencja interaktywna', 'Polska'],
}

export const revalidate = 60

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [globalHeader, globalFooter] = await Promise.all([
    getGlobalHeader(),
    getGlobalFooter(),
  ])

  const hasCustomHeader = globalHeader?.blocks && globalHeader.blocks.length > 0
  const hasCustomFooter = globalFooter?.blocks && globalFooter.blocks.length > 0

  return (
    <html lang="pl">
      <body>
        <LenisProvider>
          {hasCustomHeader ? (
            <header><BlockRenderer blocks={globalHeader.blocks as never[]} /></header>
          ) : (
            <Header />
          )}
          <main>{children}</main>
          {hasCustomFooter ? (
            <footer><BlockRenderer blocks={globalFooter.blocks as never[]} /></footer>
          ) : (
            <Footer />
          )}
        </LenisProvider>
      </body>
    </html>
  )
}
