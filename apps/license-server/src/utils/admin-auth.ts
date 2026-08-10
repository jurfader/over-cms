import { createHmac, timingSafeEqual } from 'node:crypto'

export const ADMIN_COOKIE = 'lic_admin'

/**
 * Token sesji panelu, wyprowadzony z LICENSE_ADMIN_SECRET.
 *
 * W ciasteczku NIE ląduje sam sekret. Gdyby wyciekło, atakujący dostaje token
 * do tej jednej instalacji, a nie hasło, którym można też wołać API z nagłówkiem
 * Bearer — i którego nie da się unieważnić bez zmiany konfiguracji wszędzie.
 */
export function sessionToken(secret: string): string {
  return createHmac('sha256', secret).update('license-admin-ui').digest('hex')
}

/** Porównanie odporne na pomiar czasu — inaczej token da się zgadywać bajt po bajcie. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)

  if (bufA.length !== bufB.length) return false

  return timingSafeEqual(bufA, bufB)
}
