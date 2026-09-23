// Thin client for the claims service REST endpoints, fronted by the
// gateway and proxied through /api/claims/* so the access JWT stays
// in HttpOnly cookies.

const PROXY = "/api/claims"

export type ClaimStatus = "draft" | "sent" | "paid" | "denied" | "disputed"

export type Claim = {
  id: string
  ref: string
  brokerMc: string
  brokerName: string
  loadRef: string
  dwellHours: number
  claimAmountCents: number
  recoveredCents: number
  status: ClaimStatus
  draftedSubject: string
  draftedBody: string
  aiDrafted: boolean
  /** Stripe invoice id when the success-fee invoice has been created. */
  successFeeInvoiceId?: string
  /** Stripe-hosted invoice URL — surfaced as a link in the drawer. */
  successFeeUrl?: string
  createdAt: string
  draftedAt?: string
  sentAt?: string
  paidAt?: string
}

async function call<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    cache: "no-store",
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  })
  const text = await res.text()
  let parsed: unknown
  try {
    parsed = text ? (JSON.parse(text) as unknown) : {}
  } catch {
    parsed = { error: text }
  }
  if (!res.ok) {
    const err = (parsed as { error?: string }).error ?? `HTTP ${res.status}`
    throw new Error(err)
  }
  return parsed as T
}

export async function listClaims(): Promise<Claim[]> {
  const out = await call<{ claims?: Claim[] }>(PROXY)
  return out.claims ?? []
}

export async function createClaim(input: {
  brokerMc: string
  brokerName?: string
  loadRef?: string
  dwellHours: number
  claimAmountCents: number
}): Promise<Claim> {
  const out = await call<{ claim: Claim }>(PROXY, {
    method: "POST",
    body: JSON.stringify(input),
  })
  return out.claim
}

export async function draftClaim(id: string): Promise<Claim> {
  const out = await call<{ claim: Claim }>(`${PROXY}/${id}/draft`, {
    method: "POST",
  })
  return out.claim
}

export async function sendClaim(id: string): Promise<Claim> {
  const out = await call<{ claim: Claim }>(`${PROXY}/${id}/send`, {
    method: "POST",
  })
  return out.claim
}

export async function markClaimPaid(id: string, recoveredCents: number): Promise<Claim> {
  const out = await call<{ claim: Claim }>(`${PROXY}/${id}/paid`, {
    method: "POST",
    body: JSON.stringify({ recoveredCents }),
  })
  return out.claim
}
