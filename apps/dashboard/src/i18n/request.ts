import { getRequestConfig } from "next-intl/server"
import { routing } from "./routing"
import type { Locale } from "@vettguard/i18n/config"

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale: Locale = (routing.locales as readonly string[]).includes(requested ?? "")
    ? (requested as Locale)
    : (routing.defaultLocale as Locale)

  const common = (await import(`@vettguard/i18n/messages/${locale}/common.json`)).default
  return { locale, messages: { common } }
})
