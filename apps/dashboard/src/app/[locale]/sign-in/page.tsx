import { redirect } from "next/navigation"
import { setRequestLocale } from "next-intl/server"

import { currentSession } from "@/lib/auth"
import { SignInForm } from "./sign-in-form"

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ next?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const sp = await searchParams

  // Already signed in — skip the form.
  const session = await currentSession()
  if (session) {
    redirect(sp.next ?? "/")
  }

  return <SignInForm next={sp.next ?? "/"} />
}
