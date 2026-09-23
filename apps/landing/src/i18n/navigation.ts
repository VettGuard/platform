// Locale-aware navigation helpers from next-intl. Use these instead of
// `next/navigation` whenever a navigation decision depends on the active
// locale (router.replace, usePathname, Link). They handle the
// `as-needed` localePrefix and the locale cookie correctly — vanilla
// next/navigation didn't, which is why switching back to the default
// locale (en) was silently dropped before.

import { createNavigation } from "next-intl/navigation"
import { routing } from "./routing"

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
