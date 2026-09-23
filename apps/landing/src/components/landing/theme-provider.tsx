"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ReactNode } from "react"

// Thin wrapper so the locale layout (a server component) can pass children
// through to next-themes without becoming client-only itself.
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="light"
      enableSystem
      // Avoid mismatched-style flash by injecting the resolved class before
      // first paint (next-themes handles this when this prop is true).
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  )
}
