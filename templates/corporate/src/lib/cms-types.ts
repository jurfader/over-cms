// ─── CMS Content Type Interfaces ─────────────────────────────────────────────
// These match the field schemas defined in the OverCMS admin panel.
// Each interface corresponds to one content type slug.

/** Singleton: slug = "hero" */
export interface HeroCms {
  badge_text:          string
  title_before:        string   // e.g. "Profesjonalne"
  title_gradient:      string   // e.g. "Strony WWW"
  title_after:         string   // e.g. "i Marketing Cyfrowy"
  subtitle:            string
  cta_primary_text:    string
  cta_secondary_text:  string
  stat1_value:         string
  stat1_label:         string
  stat2_value:         string
  stat2_label:         string
  stat3_value:         string
  stat3_label:         string
}

/** Collection: slug = "service_item" */
export interface ServiceItemCms {
  _id:         string
  title:       string
  description: string
  price:       string
  badge:       string   // empty string = no badge
  icon_key:    string   // 'web' | 'shop' | 'app' | 'video' | 'reels' | 'social' | 'it' | 'ads'
  order:       number
}

/** Collection: slug = "portfolio_item" */
export interface PortfolioItemCms {
  _id:         string
  title:       string
  category:    string   // 'Aplikacje' | 'Branding' | 'Sklepy' | 'Strony WWW' | 'Video'
  description: string
  tags:        string   // comma-separated e.g. "Flutter, Dart, PHP"
  image:       string   // URL (uploaded to CMS media or absolute URL)
  order:       number
}

/** Collection: slug = "testimonial" */
export interface TestimonialCms {
  _id:     string
  name:    string
  role:    string
  company: string
  rating:  number
  text:    string
}

/** Singleton: slug = "about" */
export interface AboutCms {
  photo:            string   // image URL
  description1:     string
  description2:     string
  years_on_market:  number
  projects_count:   string  // e.g. "150+"
}

/** Collection: slug = "pricing_plan" */
export interface PricingPlanCms {
  _id:           string
  name:          string
  tagline:       string
  price_onetime: number
  price_monthly: number
  is_featured:   boolean
  features:      string   // newline-separated list
  icon_key:      string   // 'basic' | 'pro' | 'ecommerce'
  order:         number
}

/** Singleton: slug = "contact_info" */
export interface ContactInfoCms {
  email:         string
  phone:         string
  nip:           string
  hours_text:    string   // e.g. "Pon – Pt: 9:00 – 17:00"
  facebook_url:  string
  instagram_url: string
  tiktok_url:    string
  youtube_url:   string
}
