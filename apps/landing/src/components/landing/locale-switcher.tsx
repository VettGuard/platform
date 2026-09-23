"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { locales, localeNames, type Locale } from "@vettguard/i18n/config"

import { usePathname, useRouter } from "@/i18n/navigation"
import { FF, T } from "./dsl"

// ──────────────────────────────────────────────────────────────────────
// LocaleSwitcher — styled popover dropdown
//
// Replaces the native <select> with a custom-styled menu so it matches the
// rest of the landing aesthetic. Uses next-intl's locale-aware router so
// switching back to the default locale (en) works correctly under the
// `as-needed` localePrefix policy — vanilla next/navigation was dropping
// that transition because the cookie/middleware combination kept rerouting.
// ──────────────────────────────────────────────────────────────────────

const GlobeIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </svg>
)

const ChevronIcon = (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
)

// ISO native short codes — shorter than full names for the trigger.
const shortCodes: Record<Locale, string> = {
  en: "EN",
  uz: "UZ",
  ru: "RU",
  es: "ES",
  tr: "TR",
  uk: "UK",
}

export function LocaleSwitcher({
  current,
  align = "right",
}: {
  current: Locale
  align?: "left" | "right"
}) {
  const router = useRouter()
  const pathname = usePathname() // already locale-stripped by next-intl
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)

  // Click-outside + Escape to close.
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  function switchTo(next: Locale) {
    setOpen(false)
    if (next === current) return
    startTransition(() => {
      router.replace(pathname, { locale: next })
    })
  }

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        aria-label="Language"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        style={{
          height: 36,
          padding: "0 10px",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "transparent",
          color: T.text,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          fontFamily: FF.sans,
          fontSize: 13,
          fontWeight: 500,
          cursor: pending ? "wait" : "pointer",
          letterSpacing: "-0.005em",
        }}
      >
        <span style={{ color: T.textDim, display: "flex" }}>{GlobeIcon}</span>
        <span>{shortCodes[current]}</span>
        <span
          style={{
            color: T.textMute,
            display: "flex",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 150ms ease",
          }}
        >
          {ChevronIcon}
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Language"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            ...(align === "right" ? { right: 0 } : { left: 0 }),
            minWidth: 200,
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: 6,
            margin: 0,
            listStyle: "none",
            boxShadow:
              "0 20px 40px -8px rgba(10,14,20,0.18), 0 4px 12px -4px rgba(10,14,20,0.08), 0 0 0 1px rgba(10,14,20,0.04)",
            zIndex: 30,
            animation: "vg-fade-in 150ms ease",
          }}
        >
          {locales.map((loc) => {
            const isCurrent = loc === current
            return (
              <li key={loc}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isCurrent}
                  onClick={() => switchTo(loc)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "9px 12px",
                    borderRadius: 8,
                    background: isCurrent ? T.orangeTint : "transparent",
                    color: isCurrent ? T.orangeDeep : T.text,
                    border: "none",
                    fontFamily: FF.sans,
                    fontSize: 13.5,
                    fontWeight: isCurrent ? 600 : 500,
                    cursor: "pointer",
                    textAlign: "left",
                    letterSpacing: "-0.005em",
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) e.currentTarget.style.background = T.surfaceElev
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) e.currentTarget.style.background = "transparent"
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        fontFamily: FF.mono,
                        fontSize: 11,
                        color: isCurrent ? T.orangeDeep : T.textMute,
                        letterSpacing: "0.04em",
                        minWidth: 22,
                      }}
                    >
                      {shortCodes[loc]}
                    </span>
                    {localeNames[loc]}
                  </span>
                  {isCurrent && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m4 12 5 5 11-11" />
                    </svg>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <style>{`
        @keyframes vg-fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
