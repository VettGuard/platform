import { NextIntlClientProvider } from "next-intl"
import { getMessages, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

import { ThemeProvider } from "@vettguard/ui/components/theme-provider"
import { locales, type Locale } from "@vettguard/i18n/config"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!(locales as readonly string[]).includes(locale)) notFound()
  setRequestLocale(locale)

  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <div className="flex min-h-screen flex-col">
              <SiteHeader locale={locale as Locale} />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
