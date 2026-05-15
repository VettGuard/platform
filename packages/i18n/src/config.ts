export const locales = ["en", "uz", "ru", "es", "tr", "uk"] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "en"

export const localeNames: Record<Locale, string> = {
  en: "English",
  uz: "O'zbekcha",
  ru: "Русский",
  es: "Español",
  tr: "Türkçe",
  uk: "Українська",
}

export const localeDir: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  uz: "ltr",
  ru: "ltr",
  es: "ltr",
  tr: "ltr",
  uk: "ltr",
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}
