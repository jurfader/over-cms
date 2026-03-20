import { Hono }  from 'hono'
import Stripe    from 'stripe'
import { eq }    from 'drizzle-orm'
import { db, licenses } from '../db/index.js'
import { generateLicenseKey } from '../utils/license-key.js'

// ─── Stripe webhook handler ───────────────────────────────────────────────────
// Handles: checkout.session.completed, customer.subscription.deleted

export const stripeWebhookRouter = new Hono()

stripeWebhookRouter.post('/stripe', async (c) => {
  const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET']
  const stripeKey     = process.env['STRIPE_SECRET_KEY']

  if (!stripeKey || !webhookSecret) {
    return c.json({ error: 'Stripe not configured' }, 500)
  }

  const stripe    = new Stripe(stripeKey)
  const body      = await c.req.text()
  const signature = c.req.header('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    return c.json({ error: 'Invalid signature' }, 400)
  }

  // ── checkout.session.completed → create license ──────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const meta    = session.metadata ?? {}

    const plan: 'trial' | 'solo' | 'agency' =
      (meta['plan'] as 'trial' | 'solo' | 'agency') ?? 'solo'

    const maxInst   = plan === 'agency' ? 9999 : 1
    const daysValid = plan === 'trial' ? 14 : null
    const expiresAt = daysValid
      ? new Date(Date.now() + daysValid * 86400 * 1000)
      : null

    const key = generateLicenseKey()

    await db.insert(licenses).values({
      key,
      plan,
      status:           'active',
      buyerEmail:       session.customer_email ?? (meta['email'] ?? ''),
      buyerName:        meta['name'],
      maxInstallations: maxInst,
      expiresAt,
      stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
    })
  }

  // ── customer.subscription.deleted → suspend license ──────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id

    if (customerId) {
      await db
        .update(licenses)
        .set({ status: 'suspended', updatedAt: new Date() })
        .where(eq(licenses.stripeCustomerId, customerId))
    }
  }

  return c.json({ received: true })
})
