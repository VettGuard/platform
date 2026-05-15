import { useTranslations } from "next-intl"

export function Faq() {
  const t = useTranslations("landing.faq")
  const items = ["eld", "loadboards", "fees"] as const

  return (
    <section>
      <div className="mx-auto max-w-3xl px-6 py-24">
        <h2 className="text-3xl font-semibold tracking-tight text-[color:var(--fg)] sm:text-4xl">
          {t("title")}
        </h2>
        <dl className="mt-10 space-y-6">
          {items.map((key) => (
            <details
              key={key}
              className="group rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-6"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-[color:var(--fg)]">
                {t(`items.${key}.q`)}
                <span className="ml-4 text-[color:var(--fg-muted)] transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-[color:var(--fg-muted)] leading-relaxed">
                {t(`items.${key}.a`)}
              </p>
            </details>
          ))}
        </dl>
      </div>
    </section>
  )
}
