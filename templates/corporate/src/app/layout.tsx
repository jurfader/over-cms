import type { Metadata } from 'next'
import './globals.css'
import { Header }        from '@/components/layout/header'
import { Footer }        from '@/components/layout/footer'
import { LenisProvider } from '@/components/lenis-provider'

export const metadata: Metadata = {
  title: {
    template: '%s | OVERMEDIA',
    default:  'OVERMEDIA — Agencja Interaktywna | Polska',
  },
  description: 'Profesjonalne strony WWW, sklepy e-commerce, aplikacje mobilne, montaż wideo i kampanie reklamowe. OVERMEDIA — kompleksowe usługi digital dla Twojej firmy.',
  keywords:    ['strony internetowe', 'sklep WooCommerce', 'aplikacje mobilne', 'marketing cyfrowy', 'Google Ads', 'agencja interaktywna', 'Polska'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <LenisProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </LenisProvider>
      </body>
    </html>
  )
}
