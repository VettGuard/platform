import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import type { Locale } from "@vettguard/i18n/config"
import { locales } from "@vettguard/i18n/config"

import { AboutPageView } from "@/components/landing/about-page"

const siteOrigin = "https://vettguard.com"

type Copy = { title: string; description: string }
const EN: Copy = {
  title: "About — VettGuard",
  description:
    "Built by ex-carriers tired of writing off detention. Three founders in Tashkent and Chicago. Backed by Y Combinator and 22 trucking-industry operators.",
}
const copyByLocale: Record<string, Copy> = {
  en: EN,
  uz: {
    title: "Biz haqimizda — VettGuard",
    description:
      "Detention'ni write-off qilishdan charchagan eski carrierlar tomonidan qurilgan. Toshkent va Chikagoda uch asoschi. Y Combinator va 22 trucking operatori tomonidan qo'llab-quvvatlangan.",
  },
  ru: {
    title: "О нас — VettGuard",
    description:
      "Сделано бывшими перевозчиками, уставшими списывать detention. Трое основателей в Ташкенте и Чикаго. Поддержано Y Combinator и 22 операторами трак-индустрии.",
  },
  tr: {
    title: "Hakkımızda — VettGuard",
    description:
      "Detention'ı silmekten bıkmış eski taşıyıcılar tarafından yapıldı. Taşkent ve Chicago'da üç kurucu. Y Combinator ve 22 taşımacılık operatörü tarafından desteklendi.",
  },
  uk: {
    title: "Про нас — VettGuard",
    description:
      "Зроблено колишніми перевізниками, що втомилися списувати detention. Троє засновників у Ташкенті та Чикаго. Підтримано Y Combinator і 22 операторами трак-індустрії.",
  },
  es: {
    title: "Acerca — VettGuard",
    description:
      "Hecho por ex-transportistas cansados de cancelar detención. Tres fundadores en Tashkent y Chicago. Respaldado por Y Combinator y 22 operadores del sector.",
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
  const path = locale === "en" ? "/about" : `/${locale}/about`
  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: path,
      languages: Object.fromEntries(
        locales.map((l) => [l, l === "en" ? "/about" : `/${l}/about`]),
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

export default async function About({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <div style={{ background: "var(--vg-bg)", color: "var(--vg-text)" }}>
      <AboutPageView locale={locale as Locale} />
    </div>
  )
}
