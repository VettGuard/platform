import { useTranslations } from "next-intl"
import { Button } from "@vettguard/ui/components/button"

export function Pricing() {
  const t = useTranslations("landing.pricing")
  const plans = ["vetting", "detention"] as const

  return (
    <section className="border-b border-[color:var(--border)] bg-[color:var(--bg-subtle)]">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-[color:var(--fg)] sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-[color:var(--fg-muted)]">{t("subtitle")}</p>
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan}
              className="flex flex-col rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-8 shadow-[var(--shadow-sm)]"
            >
              <h3 className="text-lg font-medium text-[color:var(--fg)]">
                {t(`plans.${plan}.name`)}
              </h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-semibold tracking-tight text-[color:var(--fg)]">
                  {t(`plans.${plan}.price`)}
                </span>
                <span className="text-[color:var(--fg-muted)]">{t(`plans.${plan}.cadence`)}</span>
              </div>
              <p className="mt-4 flex-1 text-[color:var(--fg-muted)]">
                {t(`plans.${plan}.description`)}
              </p>
              <Button size="lg" variant={plan === "vetting" ? "primary" : "secondary"} className="mt-8">
                {t(`plans.${plan}.cta`)}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
