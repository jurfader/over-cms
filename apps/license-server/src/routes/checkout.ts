import { Hono }       from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z }          from 'zod'
import Stripe         from 'stripe'

// ─── Plan config ──────────────────────────────────────────────────────────────

const PLANS = {
  solo: {
    label:       'Solo',
    priceEnvKey: 'STRIPE_PRICE_SOLO',
    // Fallback: one-time payment mode
    mode:        'payment' as const,
  },
  agency: {
    label:       'Agency',
    priceEnvKey: 'STRIPE_PRICE_AGENCY',
    mode:        'payment' as const,
  },
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const checkoutSchema = z.object({
  plan:  z.enum(['solo', 'agency']),
  email: z.string().email().optional(),
  name:  z.string().max(255).optional(),
})

// ─── Router ───────────────────────────────────────────────────────────────────

export const checkoutRouter = new Hono()

/**
 * POST /checkout/session
 * Creates a Stripe Checkout Session and returns the redirect URL.
 */
checkoutRouter.post('/session',
  zValidator('json', checkoutSchema),
  async (c) => {
    const stripeKey = process.env['STRIPE_SECRET_KEY']
    if (!stripeKey) {
      return c.json({ error: 'Stripe not configured' }, 503)
    }

    const { plan, email, name } = c.req.valid('json')
    const planConfig = PLANS[plan]
    const priceId    = process.env[planConfig.priceEnvKey]

    if (!priceId) {
      return c.json({ error: `Price not configured for plan: ${plan}` }, 503)
    }

    const portalUrl = process.env['PORTAL_URL'] ?? 'http://localhost:3004'
    const stripe    = new Stripe(stripeKey)

    const session = await stripe.checkout.sessions.create({
      mode:               planConfig.mode,
      line_items:         [{ price: priceId, quantity: 1 }],
      customer_email:     email,
      success_url:        `${portalUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:         `${portalUrl}/?canceled=1`,
      metadata: {
        plan,
        email: email ?? '',
        name:  name  ?? '',
      },
    })

    return c.json({ url: session.url })
  },
)
