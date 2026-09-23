"use client"

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"

// Fades + slides children in once they scroll into view. SSR-safe: starts
// hidden via .vg-reveal, IntersectionObserver flips .is-visible on the way
// in. Respects prefers-reduced-motion (the CSS neutralizes the transform).
export function Reveal({
  children,
  as: As = "div",
  stagger = false,
  className,
  style,
  threshold = 0.15,
}: {
  children: ReactNode
  as?: "div" | "section" | "article"
  stagger?: boolean
  className?: string
  style?: CSSProperties
  threshold?: number
}) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true)
            io.disconnect()
            break
          }
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])

  const cls = [
    "vg-reveal",
    visible ? "is-visible" : "",
    stagger ? "vg-reveal-stagger" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <As ref={ref as never} className={cls} style={style}>
      {children}
    </As>
  )
}
