// Thin client for billing service Connect-RPC. Used for the customer
// portal redirect; webhooks and subscription/invoice flows are handled
// server-side and aren't exposed to the browser.

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:8080"

const SERVICE = "vettguard.v1.Billing"

export type BillingErrorBody = { code?: string; message?: string }

export class BillingError extends Error {
  readonly status: number
  readonly code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function call<T>(
  method: string,
  body: unknown,
  init: { headers?: Record<string, string> } = {},
): Promise<T> {
  const res = await fetch(`${GATEWAY_URL}/${SERVICE}/${method}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      ...(init.headers ?? {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  const text = await res.text()
  let parsed: unknown
  try {
    parsed = text ? (JSON.parse(text) as unknown) : {}
  } catch {
    parsed = { message: text }
  }
  if (!res.ok) {
    const e = parsed as BillingErrorBody
    throw new BillingError(
      res.status,
      e.code ?? "unknown",
      e.message ?? res.statusText,
    )
  }
  return parsed as T
}

export type GetCustomerPortalURLResponse = { url: string }

export function getCustomerPortalURL(
  tenantId: string,
  returnUrl: string,
  accessToken: string,
): Promise<GetCustomerPortalURLResponse> {
  return call<GetCustomerPortalURLResponse>(
    "GetCustomerPortalURL",
    { tenantId, returnUrl },
    { headers: { authorization: `Bearer ${accessToken}` } },
  )
}
