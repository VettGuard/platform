"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { ThemeToggle } from "@vettguard/ui/components/theme-toggle"
import { Button } from "@vettguard/ui/components/button"
import type { Locale } from "@vettguard/i18n/config"

import { LocaleSwitcher } from "./locale-switcher"

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = useTranslations("common")
  const localePrefix = locale === "en" ? "" : `/${locale}`

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--border)] bg-[color:var(--bg)]/80 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--bg)]/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href={`${localePrefix}/`}
          className="text-lg font-semibold tracking-tight text-[color:var(--fg)]"
        >
          {t("brand.name")}
        </Link>

        <nav className="hidden gap-6 text-sm text-[color:var(--fg-muted)] md:flex">
          <Link href={`${localePrefix}/features`} className="hover:text-[color:var(--fg)]">
            {t("nav.features")}
          </Link>
          <Link href={`${localePrefix}/pricing`} className="hover:text-[color:var(--fg)]">
            {t("nav.pricing")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitcher current={locale} />
          <ThemeToggle label={t("nav.signIn")} />
          <Button size="sm" variant="ghost" className="hidden sm:inline-flex">
            {t("nav.signIn")}
          </Button>
          <Button size="sm">{t("nav.getStarted")}</Button>
        </div>
      </div>
    </header>
  )
}
