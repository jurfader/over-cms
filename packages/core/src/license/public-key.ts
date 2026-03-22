/** ED25519 public key for license verification — DO NOT MODIFY */
export const LICENSE_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAyQpvyOLQEQ8UU5BKIMcZrEz5SxKdJT1iCExu7hnvNrQ=
-----END PUBLIC KEY-----`

export type LicenseStatus = 'active' | 'inactive' | 'suspended' | 'expired'
export type LicensePlan = 'trial' | 'solo' | 'agency' | 'enterprise'

export interface LicenseData {
  key: string
  plan: LicensePlan
  status: LicenseStatus
  maxInstallations: number
  activeCount: number
  activations: Array<{
    domain: string
    installId: string
    activatedAt: string
  }>
  expiresAt?: string
}

export interface LicenseVerification {
  valid: boolean
  lastCheck: string
  plan?: LicensePlan
  status?: LicenseStatus
  gracePeriodEndsAt?: string
}
