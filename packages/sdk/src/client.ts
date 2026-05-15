import { VettGuardError } from "./errors"

export interface ClientOptions {
  baseUrl: string
  getAccessToken?: () => string | null | Promise<string | null>
  onUnauthorized?: () => void
  fetch?: typeof fetch
}

/**
 * Thin wrapper around the VettGuard gateway HTTP/JSON surface.
 *
 * Connect-RPC clients (generated from @vettguard/proto) handle structured RPC
 * calls. This SDK layers session/auth handling and friendly error mapping on top.
 */
export class VettGuardClient {
  private readonly baseUrl: string
  private readonly getAccessToken: () => string | null | Promise<string | null>
  private readonly onUnauthorized: (() => void) | undefined
  private readonly fetchImpl: typeof fetch

  constructor(opts: ClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, "")
    this.getAccessToken = opts.getAccessToken ?? (() => null)
    this.onUnauthorized = opts.onUnauthorized
    this.fetchImpl = opts.fetch ?? globalThis.fetch
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await Promise.resolve(this.getAccessToken())
    const headers = new Headers(init.headers)
    headers.set("accept", "application/json")
    if (!headers.has("content-type") && init.body) {
      headers.set("content-type", "application/json")
    }
    if (token) headers.set("authorization", `Bearer ${token}`)

    const res = await this.fetchImpl(`${this.baseUrl}${path}`, { ...init, headers })

    if (res.status === 401) {
      this.onUnauthorized?.()
      throw new VettGuardError({
        code: "unauthorized",
        status: 401,
        message: "Session expired",
        requestId: res.headers.get("x-request-id") ?? undefined,
      })
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { code?: string; message?: string }
      throw new VettGuardError({
        code: body.code ?? "unknown",
        status: res.status,
        message: body.message ?? res.statusText,
        requestId: res.headers.get("x-request-id") ?? undefined,
      })
    }

    return (await res.json()) as T
  }

  // Foundation-phase entrypoints — wrap typed methods around `request` as services
  // come online. Example:
  // async health(): Promise<{ ok: boolean }> { return this.request("/v1/health") }
}
