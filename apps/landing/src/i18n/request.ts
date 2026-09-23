import { getRequestConfig } from "next-intl/server"
import type { AbstractIntlMessages } from "next-intl"
import { routing } from "./routing"
import type { Locale } from "@vettguard/i18n/config"

import enCommon from "@vettguard/i18n/messages/en/common.json"
import enLanding from "@vettguard/i18n/messages/en/landing.json"
import uzCommon from "@vettguard/i18n/messages/uz/common.json"
import uzLanding from "@vettguard/i18n/messages/uz/landing.json"
import ruCommon from "@vettguard/i18n/messages/ru/common.json"
import ruLanding from "@vettguard/i18n/messages/ru/landing.json"
import esCommon from "@vettguard/i18n/messages/es/common.json"
import esLanding from "@vettguard/i18n/messages/es/landing.json"
import trCommon from "@vettguard/i18n/messages/tr/common.json"
import trLanding from "@vettguard/i18n/messages/tr/landing.json"
import ukCommon from "@vettguard/i18n/messages/uk/common.json"
import ukLanding from "@vettguard/i18n/messages/uk/landing.json"

// Static lookup. The dynamic-import template-literal path tripped Next 15's
// webpack resolver against our workspace `./messages/*.json` export. Static
// imports also let Next code-split per locale at the route level.
//
// AbstractIntlMessages' string-index typing rejects nested arrays, which our
// landing bundle uses (`steps`, `features` matrix). next-intl reads arrays
// fine at runtime via `t.raw()` — the strict type is conservative. Cast
// once at the boundary to keep call sites clean.
type Bundle = { common: unknown; landing: unknown }
const bundles: Record<Locale, Bundle> = {
  en: { common: enCommon, landing: enLanding },
  uz: { common: uzCommon, landing: uzLanding },
  ru: { common: ruCommon, landing: ruLanding },
  es: { common: esCommon, landing: esLanding },
  tr: { common: trCommon, landing: trLanding },
  uk: { common: ukCommon, landing: ukLanding },
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
