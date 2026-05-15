import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "VettGuard — AI-native detention recovery and broker vetting",
    template: "%s · VettGuard",
  },
  description:
    "VettGuard runs detention claims and broker vetting on autopilot for US truck dispatchers. One click, every load board.",
  metadataBase: new URL("https://vettguard.com"),
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return children
}
