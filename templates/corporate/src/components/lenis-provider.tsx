'use client'

import { useEffect } from 'react'

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let raf: number
    let lenisInstance: { raf: (t: number) => void; destroy: () => void } | null = null

    async function init() {
      const { default: Lenis } = await import('lenis')

      lenisInstance = new Lenis({
        duration:        1.2,
        easing:          (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        touchMultiplier: 2,
      })

      function loop(time: number) {
        lenisInstance!.raf(time)
        raf = requestAnimationFrame(loop)
      }

      raf = requestAnimationFrame(loop)
    }

    void init()

    return () => {
      cancelAnimationFrame(raf)
      lenisInstance?.destroy()
    }
  }, [])

  return <>{children}</>
}
