"use client"

import { useTheme } from "next-themes"
import { useEffect, useState, type MouseEvent } from "react"

import { T } from "./dsl"

// View Transitions API typing — narrowed to what we actually use.
type ViewTransitionDoc = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> }
}

// Sun / moon icons — line, currentColor, 18px (matches the rest of the nav).
const SunIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
)

const MoonIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
  </svg>
)

export function ThemeToggle({ label = "Toggle theme" }: { label?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // next-themes returns undefined on the server; only render the icon
  // after hydration to avoid a flicker.
  useEffect(() => setMounted(true), [])

  function flip(e: MouseEvent<HTMLButtonElement>) {
    const next = resolvedTheme === "dark" ? "light" : "dark"
    const docVT = document as ViewTransitionDoc

    // No View Transitions support (Firefox<128, Safari<18 sometimes) OR
    // the user prefers reduced motion → instant swap.
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
    if (!docVT.startViewTransition || prefersReduced) {
      setTheme(next)
      return
    }

    // Set the reveal origin at the click point so the circular wipe boom
    // radiates from the toggle button.
    const rect = e.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    document.documentElement.style.setProperty("--vg-x", `${x}px`)
    document.documentElement.style.setProperty("--vg-y", `${y}px`)

    docVT.startViewTransition(() => {
      setTheme(next)
    })
  }

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <button
      type="button"
      onClick={flip}
      aria-label={label}
      title={label}
      style={{
        height: 36,
        width: 36,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        color: T.text,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        cursor: "pointer",
      }}
    >
      {/* Render moon when current is light (so the icon previews the next state). */}
      {mounted ? (isDark ? SunIcon : MoonIcon) : MoonIcon}
    </button>
  )
}
