import { useTranslations } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { Button } from "@vettguard/ui/components/button"
import { ThemeToggle } from "@vettguard/ui/components/theme-toggle"

export default async function DashboardLogin({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <LoginCard />
}

function LoginCard() {
  const t = useTranslations("common")

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-8 shadow-[var(--shadow-md)]">
        <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--fg)]">
          {t("brand.name")}
        </h1>
        <p className="mt-1 text-sm text-[color:var(--fg-muted)]">{t("brand.tagline")}</p>

        <div className="mt-8 space-y-3">
          <Button variant="primary" className="w-full">
            {t("nav.signIn")} — Google
          </Button>
          <Button variant="secondary" className="w-full">
            {t("nav.signIn")} — Microsoft
          </Button>
          <div className="relative my-4 text-center text-xs uppercase tracking-wider text-[color:var(--fg-subtle)]">
            <span className="bg-[color:var(--bg-elevated)] px-2">or</span>
            <span className="absolute inset-x-0 top-1/2 -z-10 h-px bg-[color:var(--border)]" />
          </div>
          <Button variant="ghost" className="w-full">
            {t("nav.signIn")} — email
          </Button>
        </div>
      </div>
    </div>
  )
}
