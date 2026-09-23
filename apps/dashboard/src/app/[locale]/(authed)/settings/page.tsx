import { setRequestLocale } from "next-intl/server"

import { CustSettings } from "../_components/customer-pages"
import { BillingPortalCard } from "./billing-portal-card"
import { TotpWizard } from "./totp-wizard"

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  // The Integrations design shell renders as the body; the real
  // functional cards (2FA wizard + billing portal) stack underneath
  // until the Settings tabs become individual routes.
  return (
    <>
      <CustSettings />
      <div
        style={{
          padding: "0 28px 36px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <TotpWizard alreadyEnabled={false} />
        <BillingPortalCard />
      </div>
    </>
  )
}
