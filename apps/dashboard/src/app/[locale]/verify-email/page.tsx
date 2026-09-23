import { setRequestLocale } from "next-intl/server"

import { VerifyEmailClient } from "./verify-email-client"

export default async function VerifyEmail({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const sp = await searchParams

  return <VerifyEmailClient token={sp.token ?? ""} />
}
