import { setRequestLocale } from "next-intl/server"
import { Hero } from "@/components/hero"
import { Metrics } from "@/components/metrics"
import { Features } from "@/components/features"
import { Pricing } from "@/components/pricing"
import { Faq } from "@/components/faq"

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      <Hero />
      <Metrics />
      <Features />
      <Pricing />
      <Faq />
    </>
  )
}
