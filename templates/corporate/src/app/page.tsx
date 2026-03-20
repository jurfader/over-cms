import type { Metadata } from 'next'
import { Hero }         from '@/components/home/hero'
import { Services }     from '@/components/home/services'
import { Portfolio }    from '@/components/home/portfolio'
import { AboutPreview } from '@/components/home/about-preview'
import { Pricing }      from '@/components/home/pricing'
import { Testimonials } from '@/components/home/testimonials'
import { Cta }          from '@/components/home/cta'
import { BottomCta }    from '@/components/home/bottom-cta'
import { getSingleton, getCollection } from '@/lib/cms'
import type {
  HeroCms,
  ServiceItemCms,
  PortfolioItemCms,
  AboutCms,
  PricingPlanCms,
  TestimonialCms,
  ContactInfoCms,
} from '@/lib/cms-types'

export const metadata: Metadata = {
  title:       'OVERMEDIA — Profesjonalne Strony WWW i Marketing Cyfrowy | Polska',
  description: 'Kompleksowe usługi digital: tworzenie stron internetowych, sklepy e-commerce WooCommerce, aplikacje mobilne iOS i Android, montaż wideo oraz kampanie Google Ads, Meta Ads i TikTok Ads.',
}

export default async function HomePage() {
  const [hero, services, portfolio, about, plans, testimonials, contact] = await Promise.all([
    getSingleton<HeroCms>('hero'),
    getCollection<ServiceItemCms>('service_item'),
    getCollection<PortfolioItemCms>('portfolio_item'),
    getSingleton<AboutCms>('about'),
    getCollection<PricingPlanCms>('pricing_plan'),
    getCollection<TestimonialCms>('testimonial'),
    getSingleton<ContactInfoCms>('contact_info'),
  ])

  return (
    <>
      <Hero         cms={hero        ?? undefined} />
      <Services     cms={services.length    ? services    : undefined} />
      <Portfolio    cms={portfolio.length   ? portfolio   : undefined} />
      <AboutPreview cms={about       ?? undefined} />
      <Pricing      cms={plans.length       ? plans       : undefined} />
      <Testimonials cms={testimonials.length ? testimonials : undefined} />
      <Cta          cms={contact     ?? undefined} />
      <BottomCta />
    </>
  )
}
