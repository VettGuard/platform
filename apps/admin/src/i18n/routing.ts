import { defineRouting } from "next-intl/routing"

// Internal admin: English-only. We don't translate ops tooling.
export const routing = defineRouting({
  locales: ["en"],
  defaultLocale: "en",
  localePrefix: "never",
})
