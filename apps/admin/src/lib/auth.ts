// Admin auth — Sprint 3 placeholder. Reads a shared secret from the
// `ADMIN_TOKEN` env var; the login form sets a `vg_admin` cookie that the
// middleware checks before serving `/blog/*` and the writeable `/api/*`
// routes. Phase 4 swaps this for real SSO against the identity service
// (Google Workspace OIDC for staff accounts).

import { cookies } from "next/headers"

export const COOKIE_NAME = "vg_admin"

export function expectedToken(): string {
  // Default to a dev value so the local flow works without setting env vars.
  // Production deployments MUST override; the middleware refuses to start
  // without an ADMIN_TOKEN env value present.
  return process.env.ADMIN_TOKEN ?? "dev-admin-token"
}

export async function isAuthed(): Promise<boolean> {
  const c = await cookies()
  const v = c.get(COOKIE_NAME)?.value
  return Boolean(v) && v === expectedToken()
}
