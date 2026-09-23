import type { MetadataRoute } from "next"

import { locales } from "@vettguard/i18n/config"

const siteOrigin = "https://vettguard.com"

// All public landing routes. Per-locale prefix is added below.
// Keep this in sync with apps/landing/src/app/[locale]/ — pages not listed
// here are still crawlable but won't appear in the XML sitemap.
const ROUTES: Array<{
  path: string
  priority: number
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
}> = [
  { path: "",                     priority: 1.0, changeFrequency: "weekly" },
  { path: "/pricing",             priority: 0.9, changeFrequency: "monthly" },
  { path: "/about",               priority: 0.7, changeFrequency: "monthly" },
  { path: "/blog",                priority: 0.8, changeFrequency: "weekly" },
  { path: "/security",            priority: 0.6, changeFrequency: "monthly" },
  { path: "/careers",             priority: 0.6, changeFrequency: "weekly" },
  { path: "/press",               priority: 0.5, changeFrequency: "monthly" },
  { path: "/changelog",           priority: 0.5, changeFrequency: "weekly" },
  { path: "/help",                priority: 0.6, changeFrequency: "monthly" },
  { path: "/guide",               priority: 0.6, changeFrequency: "monthly" },
  { path: "/docs",                priority: 0.5, changeFrequency: "monthly" },
  { path: "/legal/terms",         priority: 0.3, changeFrequency: "yearly" },
  { path: "/legal/privacy",       priority: 0.3, changeFrequency: "yearly" },
  { path: "/legal/dpa",           priority: 0.2, changeFrequency: "yearly" },
  { path: "/legal/soc2",          priority: 0.2, changeFrequency: "yearly" },
  { path: "/legal/subprocessors", priority: 0.2, changeFrequency: "yearly" },
]

function urlFor(locale: string, path: string): string {
  // `en` is the default locale and lives at the unprefixed root.
  const prefix = locale === "en" ? "" : `/${locale}`
  return `${siteOrigin}${prefix}${path || "/"}`
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = []
  for (const route of ROUTES) {
    const languages = Object.fromEntries(
      locales.map((l) => [l, urlFor(l, route.path)]),
    )
    for (const locale of locales) {
      entries.push({
        url: urlFor(locale, route.path),
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: locale === "en" ? route.priority : route.priority * 0.9,
        alternates: { languages },
      })
    }
  }
  return entries
}
