import { randomBytes } from 'crypto'

// Generates a license key in format: XXXX-XXXX-XXXX-XXXX (uppercase hex)
export function generateLicenseKey(): string {
  const bytes = randomBytes(8) // 16 hex chars = 4 groups of 4
  const hex   = bytes.toString('hex').toUpperCase()
  return `${hex.slice(0,4)}-${hex.slice(4,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}`
}

// Normalize domain: strip protocol, www, trailing slash, port
export function normalizeDomain(raw: string): string {
  return raw
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .toLowerCase()
    .trim()
}
