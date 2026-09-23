import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "VettGuard — AI dispatch copilot",
    template: "%s · VettGuard",
  },
  description:
    "A Chrome extension that lives inside DAT. One click to score a broker. One click to file detention. Our AI does the paperwork.",
  metadataBase: new URL("https://vettguard.com"),
}

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN
const PLAUSIBLE_SRC =
  process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io/js/script.js"

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/*
        Next 15 / React 19 require `precedence` on stylesheet <link>s rendered
        outside <head> so React can hoist and dedupe them. RootLayout returns
        a fragment because <html> lives in [locale]/layout.tsx, so the link
        arrives outside <head> on first render.
      */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap"
        precedence="default"
      />
      {/* Plausible — cookie-free analytics. No-op until the env var is set;
          deliberately kept out of dev so we don't pollute the dashboard. */}
      {PLAUSIBLE_DOMAIN && (
        <script defer data-domain={PLAUSIBLE_DOMAIN} src={PLAUSIBLE_SRC} />
      )}
      {children}
    </>
  )
}
