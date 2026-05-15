import { useTranslations } from "next-intl"

export function Metrics() {
  const t = useTranslations("landing.metrics")
  const items = ["recovered", "vetted", "saved"] as const

  return (
    <section className="border-b border-[color:var(--border)] bg-[color:var(--bg-subtle)]">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-center text-sm font-medium uppercase tracking-wider text-[color:var(--fg-muted)]">
          {t("title")}
        </p>
        <dl className="mt-10 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-3">
          {items.map((key) => (
            <div key={key} className="text-center">
              <dt className="order-2 mt-2 text-sm text-[color:var(--fg-muted)]">
                {t(`items.${key}.label`)}
              </dt>
              <dd className="order-1 text-3xl font-semibold tracking-tight text-[color:var(--fg)] sm:text-4xl">
                {t(`items.${key}.value`)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
