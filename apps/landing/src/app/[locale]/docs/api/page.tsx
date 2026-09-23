import { setRequestLocale } from "next-intl/server"
import type { Locale } from "@vettguard/i18n/config"

import { StubPage } from "@/components/landing/stub-page"

export default async function ApiDocs({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <StubPage
      locale={locale as Locale}
      eyebrow="Resources"
      title="API documentation"
      intro="VettGuard's Connect-RPC API. Public endpoints land in Phase 2 alongside the detention pilot; until then the surface is internal-only."
      lastUpdated="2026-05-16"
    />
  )
}
