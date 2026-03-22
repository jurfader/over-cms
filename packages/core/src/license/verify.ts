import { createPublicKey, verify as cryptoVerify } from 'node:crypto'
import { LICENSE_PUBLIC_KEY } from './public-key'

/**
 * Verify ED25519 signature of license data
 * Returns true if valid or if no signature present (backward compatibility)
 * @param payload - Original JSON payload (before signing)
 * @param signature - Base64-encoded signature from server (optional)
 * @returns true if signature is valid or not present, false if invalid
 */
export function verifyLicenseSignature(payload: unknown, signature?: string): boolean {
  // If no signature provided, accept (backward compatibility)
  if (!signature) return true

  try {
    const publicKey = createPublicKey({
      key: LICENSE_PUBLIC_KEY,
      format: 'pem',
    })

    const message = typeof payload === 'string'
      ? payload
      : JSON.stringify(payload)

    const signatureBuffer = Buffer.from(signature, 'base64')

    return cryptoVerify(
      null,
      Buffer.from(message),
      publicKey,
      signatureBuffer
    )
  } catch (err) {
    console.error('License signature verification failed:', err)
    return false
  }
}
