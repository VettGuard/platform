import { setRequestLocale } from "next-intl/server"

import { ResetPasswordForm } from "./reset-password-form"

export default async function ResetPassword({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const sp = await searchParams
  return <ResetPasswordForm token={sp.token ?? ""} />
}
