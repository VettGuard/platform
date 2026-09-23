import { setRequestLocale } from "next-intl/server"
import type { Locale } from "@vettguard/i18n/config"

import { LegalStub } from "@/components/landing/stub-page"

export default async function Subprocessors({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <LegalStub
      locale={locale as Locale}
      title="Subprocessors"
      intro="The vendors VettGuard relies on: Anthropic (LLM inference), Stripe (billing), Hetzner (compute + storage), Cloudflare (network), Postmark (transactional email)."
    />
  )
}
