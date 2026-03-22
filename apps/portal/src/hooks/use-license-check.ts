import { useCallback } from 'react'

export interface LicenseCheckResult {
  valid: boolean
  plan?: string
  status?: string
  maxInstallations?: number
  activeCount?: number
  error?: string
}

/**
 * Hook for checking license validity
 * Calls /api/check-license (server-side) instead of talking to license server directly
 */
export function useLicenseCheck() {
  const checkLicense = useCallback(
    async (key: string): Promise<LicenseCheckResult> => {
      try {
        const res = await fetch('/api/check-license', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ key }),
        })

        if (!res.ok) {
          const data = await res.json() as { error?: string }
          return {
            valid: false,
            error: data.error ?? `Server error ${res.status}`,
          }
        }

        return await res.json() as LicenseCheckResult
      } catch (err) {
        return {
          valid: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }
    },
    []
  )

  return { checkLicense }
}
