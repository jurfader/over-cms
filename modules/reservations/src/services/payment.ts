import {
  db,
  eq,
  rsvPayments,
  modules,
} from '@overcms/core'
import type { rsvReservations, rsvServices } from '@overcms/core'
import { createPaymentHash } from '../utils/hash'

type Reservation = typeof rsvReservations.$inferSelect
type Service = typeof rsvServices.$inferSelect

interface PaymentResult {
  redirectUrl: string
}

/**
 * Build Autopay payment URL and create payment record.
 */
export async function buildPaymentUrl(
  reservation: Reservation,
  service: Service,
): Promise<PaymentResult | { error: string }> {
  // Load Autopay config from module settings
  const [mod] = await db
    .select({ config: modules.config })
    .from(modules)
    .where(eq(modules.id, 'reservations'))
    .limit(1)

  const config = (mod?.config ?? {}) as Record<string, unknown>
  const autopayConfig = (config.autopay ?? {}) as Record<string, unknown>

  const serviceId = String(autopayConfig.serviceId ?? '')
  const sharedKey = String(autopayConfig.sharedKey ?? '')
  const sandbox = Boolean(autopayConfig.sandbox ?? true)

  if (!serviceId || !sharedKey) {
    return { error: 'Autopay is not configured. Set ServiceID and SharedKey in module settings.' }
  }

  // Generate unique order ID
  const orderId = `RSV-${reservation.id.slice(0, 8).toUpperCase()}-${Date.now()}`

  // Amount in PLN with 2 decimal places
  const amount = (reservation.totalPrice / 100).toFixed(2)

  // Build hash
  const hash = createPaymentHash({
    serviceId,
    orderId,
    amount,
    currency: reservation.currency,
    customerEmail: reservation.customerEmail,
    sharedKey,
  })

  // Create payment record
  await db.insert(rsvPayments).values({
    reservationId: reservation.id,
    autopayOrderId: orderId,
    amount: reservation.totalPrice,
    currency: reservation.currency,
    status: 'pending',
    hash,
  })

  // Build redirect URL
  const baseUrl = sandbox
    ? 'https://testpay.autopay.pl/payment'
    : 'https://pay.autopay.pl/payment'

  const params = new URLSearchParams({
    ServiceID: serviceId,
    OrderID: orderId,
    Amount: amount,
    Description: `Rezerwacja: ${service.name} (${reservation.date} ${reservation.startTime})`,
    Currency: reservation.currency,
    CustomerEmail: reservation.customerEmail,
    Hash: hash,
  })

  return {
    redirectUrl: `${baseUrl}?${params.toString()}`,
  }
}
