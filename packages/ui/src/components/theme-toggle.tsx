"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { cn } from "../lib/cn"

// Narrowed shape we actually use. TS-DOM now ships its own
// startViewTransition typing, so we just access the global via `unknown`.
type ViewTransitionDoc = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> }
}

export interface ThemeToggleProps {
  className?: string
  size?: number
  label?: string
}

/**
 * Theme toggle with browser-native View Transitions API.
 *
 * Falls back to instant swap when the API is unavailable (Firefox <128, etc.)
 * or when the user prefers reduced motion. The circular "boom" reveal CSS
 * lives in packages/ui/src/styles/theme.css.
 */
export function ThemeToggle({ className, size = 20, label = "Toggle theme" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const handle = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const next = resolvedTheme === "dark" ? "light" : "dark"
      const doc = document as ViewTransitionDoc
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

      if (!doc.startViewTransition || reduceMotion) {
        setTheme(next)
        return
      }

      const rect = e.currentTarget.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2
      document.documentElement.style.setProperty("--vg-x", `${x}px`)
      document.documentElement.style.setProperty("--vg-y", `${y}px`)

      doc.startViewTransition(() => {
        setTheme(next)
      })
    },
    [resolvedTheme, setTheme],
  )

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label={label}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-md",
          "border border-[color:var(--border)] bg-[color:var(--bg-elevated)]",
          className,
        )}
      >
        <Sun size={size} aria-hidden />
      </button>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <button
      type="button"
      onClick={handle}
      aria-label={label}
      aria-pressed={isDark}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md",
        "border border-[color:var(--border)] bg-[color:var(--bg-elevated)]",
        "text-[color:var(--fg)] hover:bg-[color:var(--bg-subtle)]",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]",
        className,
      )}
    >
      {isDark ? <Moon size={size} aria-hidden /> : <Sun size={size} aria-hidden />}
    </button>
  )
}
