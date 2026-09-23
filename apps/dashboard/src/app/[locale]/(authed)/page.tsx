import { setRequestLocale } from "next-intl/server"

import { CustOverview } from "./_components/customer-pages"

export default async function DashboardHome({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <CustOverview />
}
