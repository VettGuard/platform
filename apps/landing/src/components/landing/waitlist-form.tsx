"use client"

import { useTranslations } from "next-intl"
import { useState, type FormEvent } from "react"

import { Btn, FF, Ic, T } from "./dsl"

type Status = "idle" | "submitting" | "ok" | "error"

export function WaitlistForm({
  size = "lg",
  placeholder,
  cta,
  successMsg,
}: {
  size?: "md" | "lg"
  placeholder?: string
  cta?: string
  successMsg?: string
}) {
  const t = useTranslations("landing.waitlist")
  const resolvedPlaceholder = placeholder ?? t("placeholder")
  const resolvedCta = cta ?? t("cta")
  const resolvedSuccess = successMsg ?? t("success")

  const [email, setEmail] = useState("")
  // Honeypot — bots fill it, real users never see it. Server treats any
  // non-empty value as a bot and silently 200s without persisting.
  const [company, setCompany] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus("submitting")
    setErrorMsg("")
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          company,
          locale: document.documentElement.lang || "en",
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      setStatus("ok")
      setEmail("")
    } catch (err) {
      setStatus("error")
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  const inputHeight = size === "lg" ? 48 : 36

  if (status === "ok") {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: size === "lg" ? "12px 18px" : "8px 14px",
          background: T.successSoft,
          color: T.success,
          border: `1px solid #B5DEC4`,
          borderRadius: 10,
          fontFamily: FF.sans,
          fontSize: size === "lg" ? 15 : 13.5,
          fontWeight: 500,
        }}
        role="status"
        aria-live="polite"
      >
        <span style={{ display: "flex" }}>{Ic.check}</span>
        {resolvedSuccess}
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        alignItems: "flex-start",
      }}
    >
      {/* Honeypot — visually hidden, kept out of the tab order, autofill off. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
        }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="email"
          required
          inputMode="email"
          autoComplete="email"
          placeholder={resolvedPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "submitting"}
          aria-label={t("ariaEmail")}
          style={{
            height: inputHeight,
            padding: size === "lg" ? "0 16px" : "0 12px",
            minWidth: 280,
            background: T.surface,
            border: `1px solid ${T.borderStrong}`,
            borderRadius: 10,
            fontFamily: FF.sans,
            fontSize: size === "lg" ? 15 : 13.5,
            color: T.text,
            outline: "none",
          }}
        />
        <Btn
          type="submit"
          variant="primary"
          size={size}
          style={{ opacity: status === "submitting" ? 0.7 : 1 }}
        >
          {status === "submitting" ? t("submitting") : resolvedCta} {status !== "submitting" && Ic.arrowR}
        </Btn>
      </div>
      {status === "error" && (
        <span
          role="alert"
          style={{
            fontSize: 12.5,
            color: T.danger,
            fontFamily: FF.sans,
          }}
        >
          {errorMsg}
        </span>
      )}
    </form>
  )
}
