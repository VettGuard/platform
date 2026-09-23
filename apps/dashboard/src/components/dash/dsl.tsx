// VettGuard landing — design-system atoms.
//
// TypeScript port of docs/design/reference/project/shared.jsx, narrowed to what
// the landing page needs. Inline styles are intentional: the reference is
// JSX-styled inline and we mirror it 1:1 so the design QA loop stays tight.
// When this stabilizes, atoms can graduate to @vettguard/ui.

import { useId, type CSSProperties, type ReactNode } from "react"

// ── Palette ────────────────────────────────────────────────────────────
// All entries resolve to CSS custom properties defined in globals.css.
// Inline `style={{ color: T.text }}` picks up the current theme via the
// `data-theme` attribute on <html> (set by next-themes). Switching themes
// is therefore a single attribute flip — no React rerender required.
export const T = {
  bg: "var(--vg-bg)",
  surface: "var(--vg-surface)",
  surfaceAlt: "var(--vg-surface-alt)",
  surfaceElev: "var(--vg-surface-elev)",
  text: "var(--vg-text)",
  textDim: "var(--vg-text-dim)",
  textMute: "var(--vg-text-mute)",
  border: "var(--vg-border)",
  borderStrong: "var(--vg-border-strong)",
  divider: "var(--vg-divider)",
  orange: "var(--vg-orange)",
  orangeDeep: "var(--vg-orange-deep)",
  orangeSoft: "var(--vg-orange-soft)",
  orangeTint: "var(--vg-orange-tint)",
  success: "var(--vg-success)",
  successSoft: "var(--vg-success-soft)",
  danger: "var(--vg-danger)",
  dangerSoft: "var(--vg-danger-soft)",
  warn: "var(--vg-warn)",
  warnSoft: "var(--vg-warn-soft)",
  info: "var(--vg-info)",
  infoSoft: "var(--vg-info-soft)",
  gradient: "var(--vg-gradient)",
  glass: "var(--vg-glass)",
  chromeTabs: "var(--vg-chrome-tabs)",
  chromeUrl: "var(--vg-chrome-url)",
} as const

// ── Font stacks ───────────────────────────────────────────────────────
export const FF = {
  sans:
    '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
  display:
    '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
  italic: '"Instrument Serif", Georgia, serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
} as const

// ── Icons ─────────────────────────────────────────────────────────────
export const Ic = {
  sparkle: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2 13.6 9 21 10.5 13.6 12 12 19 10.4 12 3 10.5 10.4 9 12 2Z" />
      <circle cx="19" cy="4" r="1.5" />
      <circle cx="5" cy="19" r="1.2" />
    </svg>
  ),
  bolt: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  ),
  check: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m4 12 5 5 11-11" />
    </svg>
  ),
  arrowR: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  puzzle: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 3h6a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h2v6h-2a2 2 0 0 0-2 2v4h-6v-2a2 2 0 0 0-2-2H5v-6h2a2 2 0 0 0 2-2V5a2 2 0 0 1 2-2" />
    </svg>
  ),
  clock: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  alert: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v5M12 18h0" />
    </svg>
  ),
  shield: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z" />
    </svg>
  ),
  dollar: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v18M16 7H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H8" />
    </svg>
  ),
  plus: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  x: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" />
    </svg>
  ),
  doc: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H6v18h12V7l-4-4Z" /><path d="M14 3v4h4M9 12h6M9 16h6M9 8h2" />
    </svg>
  ),
  cog: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8L4.2 7a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  ),
  truck: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 7h11v9H2zM13 10h4l3 3v3h-7z" />
      <circle cx="6.5" cy="17.5" r="1.7" /><circle cx="17" cy="17.5" r="1.7" />
    </svg>
  ),
  chart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V8M10 20v-7M16 20V4M22 20H2" />
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
    </svg>
  ),
  bell: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  ),
  arrowUp: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 14 6-6 6 6" />
    </svg>
  ),
  arrowDown: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 10 6 6 6-6" />
    </svg>
  ),
  chevR: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6" />
    </svg>
  ),
  chevD: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  more: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
    </svg>
  ),
  ext: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4h6v6M20 4l-9 9M10 6H4v14h14v-6" />
    </svg>
  ),
  download: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v12M6 12l6 6 6-6M4 20h16" />
    </svg>
  ),
  filter: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5h18l-7 9v6l-4-2v-4L3 5Z" />
    </svg>
  ),
  user: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c1-4 5-6 8-6s7 2 8 6" />
    </svg>
  ),
}

// ── Atoms ─────────────────────────────────────────────────────────────

export function Card({
  children,
  style,
  padding = 22,
}: {
  children: ReactNode
  style?: CSSProperties
  padding?: number
}) {
  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        boxShadow: "0 1px 2px rgba(10,14,20,0.04)",
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

type PillTone = "primary" | "success" | "danger" | "warn" | "info" | "neutral" | "ai"

export function Pill({
  tone = "neutral",
  children,
  dot,
  style,
  className,
}: {
  tone?: PillTone
  children: ReactNode
  dot?: boolean
  style?: CSSProperties
  className?: string
}) {
  const map: Record<PillTone, { bg: string; fg: string; br: string }> = {
    primary: { bg: T.orangeSoft, fg: T.orangeDeep, br: "#FFC9AB" },
    success: { bg: T.successSoft, fg: T.success, br: "#B5DEC4" },
    danger: { bg: T.dangerSoft, fg: T.danger, br: "#F0B9B0" },
    warn: { bg: T.warnSoft, fg: T.warn, br: "#E2C885" },
    info: { bg: T.infoSoft, fg: T.info, br: "#B5C7E8" },
    neutral: { bg: T.surfaceElev, fg: T.textDim, br: T.border },
    ai: { bg: "#1A1714", fg: "#FFD6BD", br: "#1A1714" },
  }
  const c = map[tone]
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 9px",
        borderRadius: 999,
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.br}`,
        fontFamily: FF.mono,
        fontSize: 11,
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
        fontWeight: 500,
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: c.fg,
          }}
        />
      )}
      {children}
    </span>
  )
}

type BtnVariant = "primary" | "accent" | "secondary" | "ghost"
type BtnSize = "sm" | "md" | "lg"

export function Btn({
  variant = "ghost",
  size = "md",
  children,
  style,
  type = "button",
  href,
  target,
  rel,
  onClick,
  disabled,
  "aria-label": ariaLabel,
}: {
  variant?: BtnVariant
  size?: BtnSize
  children: ReactNode
  style?: CSSProperties
  type?: "button" | "submit"
  // When `href` is set, the Btn renders as an <a>. Use this for any CTA
  // that should navigate — external links, in-page anchors, mailto:, etc.
  // Keeps right-click/middle-click/keyboard semantics that <button> loses.
  href?: string
  target?: string
  rel?: string
  onClick?: () => void
  disabled?: boolean
  "aria-label"?: string
}) {
  const sizes: Record<BtnSize, CSSProperties> = {
    sm: { padding: "6px 12px", fontSize: 12.5, height: 30, borderRadius: 6 },
    md: { padding: "8px 16px", fontSize: 13.5, height: 36, borderRadius: 8 },
    lg: { padding: "12px 22px", fontSize: 15, height: 48, borderRadius: 10 },
  }
  const variants: Record<BtnVariant, CSSProperties> = {
    primary: {
      background: "var(--vg-btn-primary-bg)",
      color: "var(--vg-btn-primary-fg)",
      border: "1px solid var(--vg-btn-primary-bg)",
      boxShadow:
        "0 1px 2px rgba(10,14,20,0.10), inset 0 1px 0 rgba(255,255,255,0.10)",
    },
    accent: {
      background: T.orange,
      color: "#FFFFFF",
      border: `1px solid ${T.orange}`,
      boxShadow:
        "0 1px 2px rgba(214,58,5,0.20), inset 0 1px 0 rgba(255,255,255,0.18)",
    },
    secondary: {
      background: T.surface,
      color: T.text,
      border: `1px solid ${T.borderStrong}`,
      boxShadow: "0 1px 2px rgba(10,14,20,0.04)",
    },
    ghost: {
      background: "transparent",
      color: T.text,
      border: "1px solid transparent",
    },
  }
  const sharedStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    fontFamily: FF.sans,
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap",
    letterSpacing: "-0.01em",
    textDecoration: "none",
    ...sizes[size],
    ...variants[variant],
    ...style,
  }

  if (href) {
    // External links open in a new tab; in-page anchors (#…) and same-origin
    // links stay in the tab. Auto-add safe rel for external.
    const isExternal = /^https?:\/\//.test(href)
    return (
      <a
        href={href}
        target={target ?? (isExternal ? "_blank" : undefined)}
        rel={rel ?? (isExternal ? "noopener noreferrer" : undefined)}
        onClick={onClick}
        style={sharedStyle}
      >
        {children}
      </a>
    )
  }
  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{ ...sharedStyle, opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
    >
      {children}
    </button>
  )
}

export function Avatar({
  initials,
  size = 32,
  color,
}: {
  initials: string
  size?: number
  color?: string
}) {
  const palette = ["#F4D6C2", "#E8DCC6", "#D9E0CC", "#D6E0D8", "#E4D3DA", "#E0D2E0"]
  const bg = color || palette[initials.charCodeAt(0) % palette.length]
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color: T.text,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FF.sans,
        fontWeight: 600,
        fontSize: size * 0.4,
        letterSpacing: "0.01em",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )
}

// AI risk score ring — orange/green/amber/red by score.
export function ScoreRing({
  score,
  size = 56,
  label,
}: {
  score: number
  size?: number
  label?: string
}) {
  const r = (size - 6) / 2
  const c = 2 * Math.PI * r
  const tone = score >= 80 ? T.success : score >= 60 ? T.warn : T.danger
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={T.surfaceElev} strokeWidth="3" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={tone}
          strokeWidth="3"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FF.sans,
          fontSize: size * 0.32,
          fontWeight: 600,
          color: tone,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {score}
        {label && (
          <span
            style={{
              fontSize: 9,
              color: T.textMute,
              fontWeight: 400,
              marginTop: 2,
              letterSpacing: "0.04em",
            }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  )
}

// Brand mark — orange chevron-shield + wordmark.
// Pass `href` to wrap in a link (top-level nav/footer); omit for decorative
// usages inside mocks/screenshots.
export function Mark({
  size = 28,
  withText = true,
  color,
  href,
  ariaLabel,
}: {
  size?: number
  withText?: boolean
  color?: string
  href?: string
  ariaLabel?: string
}) {
  const c = color || T.text
  const inner = (
    <>
      <svg width={size} height={size} viewBox="0 0 32 32">
        <path
          d="M16 3 L28 9 V20 C28 25 22 29 16 30 C10 29 4 25 4 20 V9 Z"
          fill={T.orange}
        />
        <path
          d="M11 16 L14.5 19.5 L21 12"
          stroke="#fff"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {withText && (
        <span
          style={{
            fontFamily: FF.display,
            fontSize: size * 0.62,
            fontWeight: 600,
            color: c,
            letterSpacing: "-0.025em",
          }}
        >
          VettGuard
        </span>
      )}
    </>
  )
  const baseStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: c,
  }
  if (href) {
    return (
      <a
        href={href}
        aria-label={ariaLabel ?? "VettGuard — home"}
        style={{ ...baseStyle, textDecoration: "none" }}
      >
        {inner}
      </a>
    )
  }
  return <div style={baseStyle}>{inner}</div>
}

// Locale-aware home URL — preserves the active locale prefix so clicking
// the brand mark on /uz/blog returns to /uz, not /.
export function homeHref(locale: string): string {
  return locale === "en" ? "/" : `/${locale}`
}

// Locale-aware waitlist URL — the #waitlist anchor lives on the landing
// page only, so links from stub pages (/blog, /about, etc.) need to
// navigate home first, then scroll.
export function waitlistHref(locale: string): string {
  return locale === "en" ? "/#waitlist" : `/${locale}#waitlist`
}

// Sparkline — area chart for the "MTD recovered" tile.
export function Spark({
  data,
  w = 120,
  h = 32,
  color = T.orange,
  stroke = 1.5,
}: {
  data: number[]
  w?: number
  h?: number
  color?: string
  stroke?: number
}) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const r = max - min || 1
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v - min) / r) * (h - 4) - 2,
  ])
  const path = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ")
  const area = `${path} L${w},${h} L0,${h} Z`
  // useId returns a deterministic, SSR/client-matched id so the `<defs>`
  // gradient reference doesn't trigger a hydration mismatch on remount.
  const id = `sp${useId().replace(/:/g, "")}`
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={path}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// SectionHead — dashboard-scale (20px title, mute-muted eyebrow). Optional
// trailing `action` slot for filters / view-toggles. Differs from landing's
// hero-scale SectionHead by font size + eyebrow tone.
export function SectionHead({
  eyebrow,
  title,
  action,
  style,
}: {
  eyebrow?: string
  title: string
  action?: React.ReactNode
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        marginBottom: 14,
        ...style,
      }}
    >
      <div>
        {eyebrow && (
          <div
            style={{
              fontFamily: FF.sans,
              fontSize: 11.5,
              color: T.textMute,
              letterSpacing: "-0.005em",
              fontWeight: 500,
            }}
          >
            {eyebrow}
          </div>
        )}
        {title && (
          <div
            style={{
              fontFamily: FF.display,
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: T.text,
              marginTop: 2,
            }}
          >
            {title}
          </div>
        )}
      </div>
      {action}
    </div>
  )
}

// ── Dashboard-only additions: PageBody wrapper, AIBadge, LineChart ──

export function PageBody({
  children,
  style,
}: {
  children: React.ReactNode
  style?: CSSProperties
}) {
  return <div style={{ padding: "24px 28px 36px", ...style }}>{children}</div>
}

// Inline "AI" pill — dark capsule with orange sparkle, sits next to section
// titles to denote AI-generated content (drafted claims, scores, feed items).
export function AIBadge({ children = "AI" }: { children?: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 7px 2px 6px",
        borderRadius: 999,
        background: T.text,
        color: "#FFD6BD",
        fontFamily: FF.sans,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.05em",
      }}
    >
      <span style={{ color: T.orange, display: "flex" }}>{Ic.sparkle}</span>
      {children}
    </span>
  )
}

type LineSeries = {
  color: string
  data: number[]
  fill?: boolean
  dashed?: boolean
}

export function LineChart({
  series,
  h = 220,
  labels = [],
  yFmt = (v: number) => String(v),
}: {
  series: LineSeries[]
  h?: number
  labels?: string[]
  yFmt?: (v: number) => string
}) {
  const w = 760
  const pad = { l: 48, r: 16, t: 16, b: 26 }
  const innerW = w - pad.l - pad.r
  const innerH = h - pad.t - pad.b
  const all = series.flatMap((s) => s.data)
  const max = Math.max(...all)
  const range = max || 1
  const n = series[0]!.data.length
  const xAt = (i: number) => pad.l + (i / (n - 1)) * innerW
  const yAt = (v: number) => pad.t + innerH - (v / range) * innerH

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`}>
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
        const v = range * p
        const y = yAt(v)
        return (
          <g key={i}>
            <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke={T.divider} />
            <text
              x={pad.l - 8}
              y={y + 3}
              textAnchor="end"
              fontFamily={FF.mono}
              fontSize="10"
              fill={T.textMute}
            >
              {yFmt(Math.round(v))}
            </text>
          </g>
        )
      })}
      {labels.map((lbl, i) => (
        <text
          key={`${lbl}-${i}`}
          x={xAt(i)}
          y={h - 6}
          textAnchor="middle"
          fontFamily={FF.mono}
          fontSize="10"
          fill={T.textMute}
        >
          {lbl}
        </text>
      ))}
      {series.map((s, si) => {
        const path = s.data
          .map((v, i) => `${i === 0 ? "M" : "L"}${xAt(i)},${yAt(v)}`)
          .join(" ")
        const area = `${path} L${xAt(n - 1)},${yAt(0)} L${xAt(0)},${yAt(0)} Z`
        const gid = `lc-${si}-${s.color.replace("#", "")}`
        return (
          <g key={si}>
            {s.fill && (
              <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                </linearGradient>
              </defs>
            )}
            {s.fill && <path d={area} fill={`url(#${gid})`} />}
            <path
              d={path}
              stroke={s.color}
              strokeWidth="2"
              fill="none"
              strokeDasharray={s.dashed ? "4 4" : "0"}
              strokeLinejoin="round"
            />
          </g>
        )
      })}
    </svg>
  )
}

// Bar chart — used for distribution histograms (broker score buckets,
// 7-day auto-action mix). Last bar is full-opacity to indicate "current".
export function Bars({
  data,
  h = 160,
  labels,
  color = T.orange,
}: {
  data: number[]
  h?: number
  labels?: string[]
  color?: string
}) {
  const w = 520
  const pad = { l: 30, r: 8, t: 8, b: 22 }
  const innerW = w - pad.l - pad.r
  const innerH = h - pad.t - pad.b
  const max = Math.max(...data) || 1
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`}>
      {[0, 0.5, 1].map((p, i) => {
        const y = pad.t + innerH * (1 - p)
        return <line key={i} x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke={T.divider} />
      })}
      {data.map((v, i) => {
        const bw = innerW / data.length - 6
        const x = pad.l + i * (innerW / data.length) + 3
        const bh = (v / max) * innerH
        return (
          <g key={i}>
            <rect
              x={x}
              y={pad.t + innerH - bh}
              width={bw}
              height={bh}
              fill={color}
              opacity={i === data.length - 1 ? 1 : 0.45}
              rx="2"
            />
            {labels && (
              <text
                x={x + bw / 2}
                y={h - 6}
                textAnchor="middle"
                fontFamily={FF.mono}
                fontSize="10"
                fill={T.textMute}
              >
                {labels[i]}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
