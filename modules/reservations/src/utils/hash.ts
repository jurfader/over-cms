import { createHash } from 'node:crypto'

/**
 * Create SHA-256 hash for Autopay payment initiation.
 */
export function createPaymentHash(params: {
  serviceId: string
  orderId: string
  amount: string
  currency: string
  customerEmail: string
  sharedKey: string
}): string {
  const input = [
    params.serviceId,
    params.orderId,
    params.amount,
    params.currency,
    params.customerEmail,
    params.sharedKey,
  ].join('|')

  return createHash('sha256').update(input).digest('hex')
}

/**
 * Verify SHA-256 hash from Autopay ITN notification.
 */
export function verifyItnHash(params: {
  serviceId: string
  orderId: string
  remoteId: string
  amount: string
  currency: string
  gatewayId: string
  paymentDate: string
  paymentStatus: string
  paymentStatusDetails: string
  sharedKey: string
  receivedHash: string
}): boolean {
  const input = [
    params.serviceId,
    params.orderId,
    params.remoteId,
    params.amount,
    params.currency,
    params.gatewayId,
    params.paymentDate,
    params.paymentStatus,
    params.paymentStatusDetails,
    params.sharedKey,
  ].join('|')

  const expectedHash = createHash('sha256').update(input).digest('hex')
  return expectedHash === params.receivedHash
}
