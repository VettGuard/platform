import { useTranslations } from "next-intl"

export function Features() {
  const t = useTranslations("landing.features")
  const items = ["extension", "detention", "vetting", "security"] as const

  return (
    <section className="border-b border-[color:var(--border)]">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-3xl font-semibold tracking-tight text-[color:var(--fg)] sm:text-4xl">
          {t("title")}
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {items.map((key) => (
            <article
              key={key}
              className="rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-8 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]"
            >
              <h3 className="text-xl font-semibold text-[color:var(--fg)]">
                {t(`items.${key}.title`)}
              </h3>
              <p className="mt-3 text-[color:var(--fg-muted)] leading-relaxed">
                {t(`items.${key}.body`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
