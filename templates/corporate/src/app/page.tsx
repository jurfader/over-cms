import type { Metadata } from 'next'
import { Hero }         from '@/components/home/hero'
import { Services }     from '@/components/home/services'
import { Portfolio }    from '@/components/home/portfolio'
import { AboutPreview } from '@/components/home/about-preview'
import { Pricing }      from '@/components/home/pricing'
import { Testimonials } from '@/components/home/testimonials'
import { Cta }          from '@/components/home/cta'
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
      {hero && <Hero cms={hero} />}
      {services.length > 0 && <Services cms={services} />}
      {portfolio.length > 0 && <Portfolio cms={portfolio} />}
      {about && <AboutPreview cms={about} />}
      {plans.length > 0 && <Pricing cms={plans} />}
      {testimonials.length > 0 && <Testimonials cms={testimonials} />}
      {contact && <Cta cms={contact} />}
    </>
  )
}
