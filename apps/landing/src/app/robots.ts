import type { MetadataRoute } from "next"

const siteOrigin = "https://vettguard.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Internal API used only by the landing form; no value to crawl.
        disallow: ["/api/"],
      },
    ],
    sitemap: `${siteOrigin}/sitemap.xml`,
    host: siteOrigin,
  }
}
