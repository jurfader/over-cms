import { createPrivateKey, sign } from 'node:crypto'

let privateKey: ReturnType<typeof createPrivateKey> | null = null

/**
 * Get or create ED25519 private key from LICENSE_SIGNING_KEY env var
 * Expected format: raw base64 (without PEM headers)
 */
function getPrivateKey(): ReturnType<typeof createPrivateKey> | null {
  if (privateKey) return privateKey

  const raw = process.env['LICENSE_SIGNING_KEY']
  if (!raw) return null

  try {
    const pem = `-----BEGIN PRIVATE KEY-----\n${raw}\n-----END PRIVATE KEY-----`
    privateKey = createPrivateKey({
      key: pem,
      format: 'pem',
    })
    return privateKey
  } catch (err) {
    console.error('Failed to load signing key:', err)
    return null
  }
}

/**
 * Sign a payload using ED25519 private key
 * Returns base64-encoded signature, or undefined if key not available
 */
export function signPayload(data: unknown): string | undefined {
  const key = getPrivateKey()
  if (!key) return undefined

  try {
    const payload = JSON.stringify(data)
    const signature = sign(null, Buffer.from(payload), key)
    return signature.toString('base64')
  } catch (err) {
    console.error('Failed to sign payload:', err)
    return undefined
  }
}
