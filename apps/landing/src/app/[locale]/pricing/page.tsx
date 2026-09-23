import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import type { Locale } from "@vettguard/i18n/config"
import { locales } from "@vettguard/i18n/config"

import { JsonLd } from "@/components/landing/json-ld"
import { PricingPageView } from "@/components/landing/pricing-page"

const siteOrigin = "https://vettguard.com"

type Copy = { title: string; description: string }
const EN: Copy = {
  title: "Pricing — VettGuard",
  description:
    "$0 to start. 18% success fee on detention recovered. Pro removes every limit. Full plan comparison and FAQs.",
}
const copyByLocale: Record<string, Copy> = {
  en: EN,
  uz: {
    title: "Narxlar — VettGuard",
    description:
      "$0 dan boshlang. Qaytarilgan detention'dan 18% success fee. Pro barcha limitlarni olib tashlaydi. To'liq solishtirish va FAQ.",
  },
  ru: {
    title: "Цены — VettGuard",
    description:
      "Старт за $0. 18% success fee от возвращённого detention. Pro снимает все лимиты. Полное сравнение и FAQ.",
  },
  tr: {
    title: "Fiyatlar — VettGuard",
    description:
      "$0'dan başla. Kurtarılan detention üzerinden %18 başarı ücreti. Pro tüm limitleri kaldırır. Tam karşılaştırma ve SSS.",
  },
  uk: {
    title: "Ціни — VettGuard",
    description:
      "Старт за $0. 18% success fee від повернутого detention. Pro знімає всі ліміти. Повне порівняння і FAQ.",
  },
  es: {
    title: "Precios — VettGuard",
    description:
      "Empieza por $0. Comisión de éxito 18% sobre detención recuperada. Pro quita todos los límites. Comparativa completa y FAQ.",
  },
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const copy = copyByLocale[locale] ?? EN
  const path = locale === "en" ? "/pricing" : `/${locale}/pricing`
  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: path,
      languages: Object.fromEntries(
        locales.map((l) => [l, l === "en" ? "/pricing" : `/${l}/pricing`]),
      ),
    },
    openGraph: {
      type: "website",
      url: `${siteOrigin}${path}`,
      siteName: "VettGuard",
      title: copy.title,
      description: copy.description,
      locale,
      images: [{ url: `${siteOrigin}/opengraph-image`, width: 1200, height: 630, alt: copy.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: [`${siteOrigin}/opengraph-image`],
    },
  }
}

export default async function Pricing({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  // Product schema with two Offers (Free + Pro). Search engines render
  // these as price-with-currency in rich results.
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "VettGuard",
    description:
      "AI dispatch copilot Chrome extension. Vets brokers and recovers detention.",
    brand: { "@type": "Brand", name: "VettGuard" },
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        priceCurrency: "USD",
        price: "0",
        url: `${siteOrigin}${locale === "en" ? "/pricing" : `/${locale}/pricing`}`,
        availability: "https://schema.org/InStock",
        description: "+ 18% success fee on recovered detention",
      },
      {
        "@type": "Offer",
        name: "Pro",
        priceCurrency: "USD",
        price: "199",
        url: `${siteOrigin}${locale === "en" ? "/pricing" : `/${locale}/pricing`}`,
        availability: "https://schema.org/InStock",
        description: "+ 18% success fee · 14-day free trial · all limits removed",
      },
    ],
  }

  return (
    <div style={{ background: "var(--vg-bg)", color: "var(--vg-text)" }}>
      <JsonLd data={productLd} />
      <PricingPageView locale={locale as Locale} />
    </div>
  )
}
