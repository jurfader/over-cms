'use client'

import { useEffect, useRef } from 'react'

interface RevealProps {
  children:  React.ReactNode
  delay?:    number
  y?:        number
  className?: string
  style?:    React.CSSProperties
  as?:       keyof React.JSX.IntrinsicElements
}

/**
 * Wraps children in a scroll-triggered fade-in-up animation via GSAP.
 * Falls back gracefully if GSAP is unavailable (SSR).
 */
export function Reveal({
  children,
  delay   = 0,
  y       = 40,
  className,
  style,
  as: Tag = 'div',
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    let ctx: { revert?: () => void } | null = null

    async function init() {
      const { gsap }          = await import('gsap')
      const { ScrollTrigger } = await import('gsap/ScrollTrigger')
      gsap.registerPlugin(ScrollTrigger)

      if (!ref.current) return

      ctx = gsap.context(() => {
        gsap.fromTo(
          ref.current!,
          { opacity: 0, y },
          {
            opacity:  1,
            y:        0,
            duration: 0.8,
            delay,
            ease:     'power3.out',
            scrollTrigger: {
              trigger: ref.current!,
              start:   'top 88%',
              once:    true,
            },
          },
        )
      })
    }

    void init()
    return () => ctx?.revert?.()
  }, [delay, y])

  return (
    // @ts-expect-error — dynamic tag
    <Tag ref={ref} className={className} style={{ opacity: 0, ...style }}>
      {children}
    </Tag>
  )
}
