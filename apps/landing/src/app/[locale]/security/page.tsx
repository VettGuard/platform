import { setRequestLocale } from "next-intl/server"
import type { Locale } from "@vettguard/i18n/config"

import { StubPage } from "@/components/landing/stub-page"

export default async function Security({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <StubPage
      locale={locale as Locale}
      eyebrow="Resources"
      title="Security at VettGuard"
      intro="Tenant-isolated Postgres with RLS, Ed25519 JWTs, AES-256-GCM at rest for MFA secrets, audit log for every privileged action. Full SOC 2 Type II report available under NDA."
      lastUpdated="2026-05-16"
    />
  )
}
