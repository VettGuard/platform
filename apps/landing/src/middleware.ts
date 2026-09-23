import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"

export default createMiddleware(routing)

// Exclude framework + file-based metadata routes from next-intl rewriting.
// opengraph-image, icon, sitemap.xml, robots.txt are root-level metadata
// routes (Next conventions) — they don't take a locale prefix.
export const config = {
  matcher: [
    "/((?!api|_next|_vercel|opengraph-image|icon|sitemap\\.xml|robots\\.txt|.*\\..*).*)",
  ],
}
