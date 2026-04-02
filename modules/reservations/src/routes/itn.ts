import { Hono } from 'hono'
import {
  db,
  eq,
  rsvPayments,
  rsvReservations,
  modules,
} from '@overcms/core'
import { verifyItnHash } from '../utils/hash'

export const itnRoute = new Hono()

// ─── POST /itn — Autopay Instant Transaction Notification ─────────────────────
// This endpoint is called by Autopay's servers when a payment status changes.
// It must be publicly accessible (no auth). Security via SHA-256 hash verification.

itnRoute.post('/itn', async (c) => {
  try {
    const body = await c.req.text()

    // Parse XML ITN payload (simplified — extract key fields)
    const orderIdMatch = body.match(/<orderID>([^<]+)<\/orderID>/)
    const remoteIdMatch = body.match(/<remoteID>([^<]+)<\/remoteID>/)
    const amountMatch = body.match(/<amount>([^<]+)<\/amount>/)
    const currencyMatch = body.match(/<currency>([^<]+)<\/currency>/)
    const gatewayIdMatch = body.match(/<gatewayID>([^<]+)<\/gatewayID>/)
    const paymentDateMatch = body.match(/<paymentDate>([^<]+)<\/paymentDate>/)
    const paymentStatusMatch = body.match(/<paymentStatus>([^<]+)<\/paymentStatus>/)
    const paymentStatusDetailsMatch = body.match(/<paymentStatusDetails>([^<]+)<\/paymentStatusDetails>/)
    const hashMatch = body.match(/<hash>([^<]+)<\/hash>/)
    const serviceIdMatch = body.match(/<serviceID>([^<]+)<\/serviceID>/)

    const orderId = orderIdMatch?.[1]
    const remoteId = remoteIdMatch?.[1]
    const amount = amountMatch?.[1]
    const currency = currencyMatch?.[1] ?? 'PLN'
    const gatewayId = gatewayIdMatch?.[1]
    const paymentDate = paymentDateMatch?.[1]
    const paymentStatus = paymentStatusMatch?.[1]
    const paymentStatusDetails = paymentStatusDetailsMatch?.[1]
    const receivedHash = hashMatch?.[1]
    const autopayServiceId = serviceIdMatch?.[1]

    if (!orderId || !paymentStatus || !receivedHash || !autopayServiceId) {
      return c.text('INVALID_PAYLOAD', 400)
    }

    // Load shared key from module config
    const [mod] = await db
      .select({ config: modules.config })
      .from(modules)
      .where(eq(modules.id, 'reservations'))
      .limit(1)

    const config = (mod?.config ?? {}) as Record<string, unknown>
    const autopayConfig = (config.autopay ?? {}) as Record<string, unknown>
    const sharedKey = autopayConfig.sharedKey as string

    if (!sharedKey) {
      console.error('[reservations/itn] SharedKey not configured')
      return c.text('CONFIG_ERROR', 500)
    }

    // Verify hash
    const isValid = verifyItnHash({
      serviceId: autopayServiceId,
      orderId,
      remoteId: remoteId ?? '',
      amount: amount ?? '0',
      currency,
      gatewayId: gatewayId ?? '',
      paymentDate: paymentDate ?? '',
      paymentStatus,
      paymentStatusDetails: paymentStatusDetails ?? '',
      sharedKey,
      receivedHash,
    })

    if (!isValid) {
      console.error(`[reservations/itn] Invalid hash for order ${orderId}`)
      return c.text('INVALID_HASH', 403)
    }

    // Find payment by orderId
    const [payment] = await db
      .select()
      .from(rsvPayments)
      .where(eq(rsvPayments.autopayOrderId, orderId))
      .limit(1)

    if (!payment) {
      console.error(`[reservations/itn] Payment not found: ${orderId}`)
      return c.text('ORDER_NOT_FOUND', 404)
    }

    // Map Autopay status to our status
    const newStatus = paymentStatus === 'SUCCESS' ? 'success' as const : 'failure' as const

    // Determine payment method name
    const methodMap: Record<string, string> = {
      '509': 'blik',
      '1500': 'card',
      '1503': 'google_pay',
      '1513': 'apple_pay',
    }

    // Update payment
    await db
      .update(rsvPayments)
      .set({
        status: newStatus,
        autopayTransactionId: remoteId,
        paymentMethod: gatewayId ? (methodMap[gatewayId] ?? `gateway_${gatewayId}`) : null,
        itnPayload: { raw: body },
        updatedAt: new Date(),
      })
      .where(eq(rsvPayments.id, payment.id))

    // If payment succeeded, confirm the reservation
    if (newStatus === 'success') {
      await db
        .update(rsvReservations)
        .set({ status: 'confirmed', updatedAt: new Date() })
        .where(eq(rsvReservations.id, payment.reservationId))

      // TODO: Send confirmation email (Faza 5)
    }

    // Return confirmation XML (required by Autopay)
    const confirmXml = `<?xml version="1.0" encoding="UTF-8"?>
<confirmationList>
  <serviceID>${autopayServiceId}</serviceID>
  <transactionsConfirmations>
    <transactionConfirmed>
      <orderID>${orderId}</orderID>
      <confirmation>CONFIRMED</confirmation>
    </transactionConfirmed>
  </transactionsConfirmations>
</confirmationList>`

    c.header('Content-Type', 'application/xml; charset=utf-8')
    return c.body(confirmXml)
  } catch (err) {
    console.error('[reservations/itn] Error:', err)
    return c.text('INTERNAL_ERROR', 500)
  }
})
