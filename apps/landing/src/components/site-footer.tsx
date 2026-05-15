import { useTranslations } from "next-intl"

export function SiteFooter() {
  const t = useTranslations("common.footer")
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[color:var(--border)] bg-[color:var(--bg)]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-[color:var(--fg-muted)] sm:flex-row">
        <p>{t("copyright", { year })}</p>
        <nav className="flex gap-6">
          <a href="/privacy" className="hover:text-[color:var(--fg)]">
            {t("privacy")}
          </a>
          <a href="/terms" className="hover:text-[color:var(--fg)]">
            {t("terms")}
          </a>
          <a href="/security" className="hover:text-[color:var(--fg)]">
            {t("security")}
          </a>
          <a href="https://status.vettguard.com" className="hover:text-[color:var(--fg)]">
            {t("status")}
          </a>
        </nav>
      </div>
    </footer>
  )
}
