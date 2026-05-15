import { useTranslations } from "next-intl"
import { Button } from "@vettguard/ui/components/button"

export function Hero() {
  const t = useTranslations("landing.hero")

  return (
    <section className="relative isolate overflow-hidden border-b border-[color:var(--border)]">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32 lg:py-40">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-3 py-1 text-xs font-medium text-[color:var(--fg-muted)]">
            <span className="size-1.5 rounded-full bg-[color:var(--accent)]" aria-hidden />
            {t("eyebrow")}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-[color:var(--fg)] sm:text-5xl lg:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[color:var(--fg-muted)] sm:text-xl">
            {t("subtitle")}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="primary">
              {t("ctaPrimary")}
            </Button>
            <Button size="lg" variant="secondary">
              {t("ctaSecondary")}
            </Button>
          </div>
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, color-mix(in oklch, var(--accent) 18%, transparent), transparent)",
        }}
      />
    </section>
  )
}
