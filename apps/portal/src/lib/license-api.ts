const LICENSE_URL = process.env.LICENSE_SERVER_URL ?? 'http://localhost:3002'

export interface Activation {
  id:             string
  domain:         string
  installationId: string
  active:         boolean
  activatedAt:    string
  lastSeenAt:     string
}

export interface LicenseData {
  key:              string
  plan:             'trial' | 'solo' | 'agency'
  status:           'active' | 'suspended' | 'expired' | 'revoked'
  buyerName:        string | null
  buyerEmail:       string
  maxInstallations: number
  expiresAt:        string | null
  createdAt:        string
  activeCount:      number
  activations:      Activation[]
}

export async function getLicense(key: string): Promise<LicenseData | null> {
  try {
    const res = await fetch(`${LICENSE_URL}/customer/${key.toUpperCase()}`, {
      cache: 'no-store',
    })
    if (res.status === 404) return null
    if (!res.ok) throw new Error('Server error')
    const { data } = await res.json() as { data: LicenseData }
    return data
  } catch {
    return null
  }
}
