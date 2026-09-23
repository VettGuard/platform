import { setRequestLocale } from "next-intl/server"

import { CustClaims } from "../_components/customer-pages"

export default async function ClaimsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <CustClaims />
}
