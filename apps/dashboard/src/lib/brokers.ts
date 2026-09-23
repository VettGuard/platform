// Thin client for the brokers service REST endpoints, fronted by the
// gateway. We talk through our own /api/brokers route so the access JWT
// stays in HttpOnly cookies and never reaches client JS.

const PROXY = "/api/brokers"

export type Broker = {
  id: string
  mc: string
  name: string
  city: string
  score: number
  payDays: number
  loads: number
  recoveredCents: number
  status: "preferred" | "active" | "watch" | "blocked"
  lastScoredAt: string
}

export type BrokersError = { error: string }

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
    const err = (parsed as BrokersError).error ?? `HTTP ${res.status}`
    throw new Error(err)
  }
  return parsed as T
}

export async function listBrokers(): Promise<Broker[]> {
  const out = await call<{ brokers?: Broker[] }>(`${PROXY}`)
  return out.brokers ?? []
}

export async function vetBroker(input: {
  mc: string
  name?: string
  city?: string
}): Promise<Broker> {
  const out = await call<{ broker: Broker }>(`${PROXY}/vet`, {
    method: "POST",
    body: JSON.stringify(input),
  })
  return out.broker
}

export async function getBroker(mc: string): Promise<Broker> {
  const out = await call<{ broker: Broker }>(
    `${PROXY}/${encodeURIComponent(mc)}`,
  )
  return out.broker
}
