// Runtime-generated OG image — one per locale.
//
// Next.js renders this React tree to a PNG at build/request time via
// `next/og`. No static asset file to keep in sync with the design.

import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "VettGuard — AI dispatch copilot"

type Copy = { headline: string; sub: string }
const EN_OG: Copy = {
  headline: "The dispatcher's copilot.",
  sub: "AI vets brokers. AI recovers detention. You ship.",
}
const localized: Record<string, Copy> = {
  en: EN_OG,
  uz: {
    headline: "Dispetcher uchun AI yordamchi.",
    sub: "Brokerni AI baholaydi. Detention'ni AI qaytaradi.",
  },
  ru: {
    headline: "AI-помощник для диспетчера.",
    sub: "AI оценивает брокеров. AI взыскивает detention.",
  },
  es: {
    headline: "El copiloto del despachador.",
    sub: "La IA califica brokers. La IA recupera detention.",
  },
  tr: {
    headline: "Dispeçerin yardımcı pilotu.",
    sub: "AI brokerleri puanlar. AI detention'ı geri alır.",
  },
  uk: {
    headline: "AI-помічник диспетчера.",
    sub: "AI оцінює брокерів. AI стягує detention.",
  },
}

// Single root-level OG image. Localized OG (one per locale) requires
// app/[locale]/opengraph-image.tsx, which collides with `localePrefix:
// "as-needed"` in next-intl — the middleware strips /en/ and the lookup
// 404s. Sprint 3 polish: English copy only; per-locale OG returns once we
// either move to `localePrefix: "always"` or carve out a config exception.
export default function Image() {
  const copy = EN_OG
  void localized // intentionally retained for the locale-prefix revisit.

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: "#FFFFFF",
          backgroundImage:
            "radial-gradient(at 18% 12%, #FFE5D6 0px, transparent 50%), radial-gradient(at 82% 8%, #E5E0FF 0px, transparent 45%), radial-gradient(at 50% 90%, #FFEFD1 0px, transparent 55%)",
          fontFamily: "Inter, sans-serif",
          color: "#0A0E14",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="56" height="56" viewBox="0 0 32 32">
            <path
              d="M16 3 L28 9 V20 C28 25 22 29 16 30 C10 29 4 25 4 20 V9 Z"
              fill="#FF4D0D"
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
          <div style={{ fontSize: 42, fontWeight: 600, letterSpacing: "-0.025em" }}>
            VettGuard
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              fontSize: 84,
              fontWeight: 600,
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
              maxWidth: 980,
            }}
          >
            {copy.headline}
          </div>
          <div style={{ fontSize: 30, color: "#3C4250", lineHeight: 1.35, maxWidth: 900 }}>
            {copy.sub}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "#8B92A0",
          }}
        >
          <span>vettguard.com</span>
          <span style={{ color: "#FF4D0D", fontWeight: 600 }}>
            Add to Chrome — free
          </span>
        </div>
      </div>
    ),
    { ...size },
  )
}
