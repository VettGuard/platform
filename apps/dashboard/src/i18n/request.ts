import { getRequestConfig } from "next-intl/server"
import type { AbstractIntlMessages } from "next-intl"
import { routing } from "./routing"
import type { Locale } from "@vettguard/i18n/config"

import enCommon from "@vettguard/i18n/messages/en/common.json"
import uzCommon from "@vettguard/i18n/messages/uz/common.json"
import ruCommon from "@vettguard/i18n/messages/ru/common.json"
import esCommon from "@vettguard/i18n/messages/es/common.json"
import trCommon from "@vettguard/i18n/messages/tr/common.json"
import ukCommon from "@vettguard/i18n/messages/uk/common.json"

// Static lookup mirroring the landing app — Next 15's webpack resolver
// can't follow the template-literal `./messages/*.json` export pattern.
const bundles: Record<Locale, { common: unknown }> = {
  en: { common: enCommon },
  uz: { common: uzCommon },
  ru: { common: ruCommon },
  es: { common: esCommon },
  tr: { common: trCommon },
  uk: { common: ukCommon },
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale: Locale = (routing.locales as readonly string[]).includes(requested ?? "")
    ? (requested as Locale)
    : routing.defaultLocale

  return {
    locale,
    messages: bundles[locale] as AbstractIntlMessages,
  }
})
