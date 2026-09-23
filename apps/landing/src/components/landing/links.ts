// Centralised target URLs for the landing-page CTAs. Most are placeholders
// until the listed product is published — using env vars where it's likely
// they'll change between environments (Chrome store id, dashboard origin).

export const CHROME_STORE_URL =
  process.env.NEXT_PUBLIC_CHROME_STORE_URL ??
  // Generic Chrome Web Store landing — replaced once the extension is published.
  "https://chromewebstore.google.com/category/extensions"

export const APP_ORIGIN =
  process.env.NEXT_PUBLIC_APP_ORIGIN ?? "https://app.vettguard.com"

export const SIGN_IN_URL = `${APP_ORIGIN}/sign-in`
export const SIGN_UP_URL = `${APP_ORIGIN}/sign-up`

export const BOOK_CALL_URL =
  process.env.NEXT_PUBLIC_BOOK_CALL_URL ?? "https://cal.com/vettguard/intro"

export const SALES_EMAIL = "sales@vettguard.com"
export const SUPPORT_EMAIL = "support@vettguard.com"
export const SECURITY_EMAIL = "security@vettguard.com"

// Footer-column href map. Phase 4 turns these into real /docs/* etc.;
// for now we point at the home or external well-known URLs.
//
// Multi-locale entries are listed in their localized text variant so the
// per-locale footer arrays in landing.json can be authored in the native
// language. Hrefs themselves stay non-localized — Next.js' locale prefix
// is handled by next-intl middleware.
export const footerLinks: Record<string, string> = {
  // English
  "Chrome extension": CHROME_STORE_URL,
  "AI vetting": "#carriers",
  "Auto detention": "#extension",
  Integrations: "#extension",
  Changelog: "/changelog",

  About: "/about",
  Careers: "/careers",
  Press: "/press",
  Customers: "#waitlist",
  Contact: `mailto:${SUPPORT_EMAIL}`,

  Blog: "/blog",
  "Carrier guide": "/guide",
  "Help center": "/help",
  "API docs": "/docs/api",
  Status: "https://status.vettguard.com",
  Security: "/security",

  Terms: "/legal/terms",
  Privacy: "/legal/privacy",
  DPA: "/legal/dpa",
  "SOC 2": "/legal/soc2",
  Subprocessors: "/legal/subprocessors",

  // Localized Blog labels — map all variants to the same /blog route.
  // (next-intl middleware adds the /uz, /ru, /es, /tr, /uk prefix.)
  Блог: "/blog",

  // Other localized links fall through to "#" (Phase 4 wires real per-locale routes).
}
