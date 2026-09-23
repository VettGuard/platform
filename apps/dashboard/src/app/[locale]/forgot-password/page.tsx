import { setRequestLocale } from "next-intl/server"

import { ForgotPasswordForm } from "./forgot-password-form"

export default async function ForgotPassword({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <ForgotPasswordForm />
}
