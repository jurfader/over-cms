import { createPublicKey, verify as cryptoVerify } from 'node:crypto'
import { LICENSE_PUBLIC_KEY, type LicenseData } from './public-key'

/**
 * Verify ED25519 signature of license data
 * @param payload - Original JSON payload (before signing)
 * @param signature - Base64-encoded signature from server
 * @returns true if signature is valid, false otherwise
 */
export function verifyLicenseSignature(payload: unknown, signature: string): boolean {
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

export interface VerifiedResponse<T> {
  data: T
  signature: string
  verified: boolean
}

/**
 * Verify a signed response from license server
 */
export function verifySigned<T>(response: VerifiedResponse<T>): T | null {
  if (!verifyLicenseSignature(response.data, response.signature)) {
    console.error('Invalid license signature')
    return null
  }
  return response.data
}
