import { setRequestLocale } from "next-intl/server"

import { CustBrokers } from "../_components/customer-pages"

export default async function BrokersPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <CustBrokers />
}
