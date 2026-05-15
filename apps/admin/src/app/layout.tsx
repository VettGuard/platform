import type { Metadata } from "next"
import type { ReactNode } from "react"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"

import { ThemeProvider } from "@vettguard/ui/components/theme-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: { default: "VettGuard Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const messages = await getMessages()
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale="en" messages={messages}>
          <ThemeProvider>{children}</ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
