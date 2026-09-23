import { redirect } from "next/navigation"
import { setRequestLocale } from "next-intl/server"

import { currentSession } from "@/lib/auth"
import { SignUpForm } from "./sign-up-form"

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const session = await currentSession()
  if (session) redirect("/")

  return <SignUpForm />
}
