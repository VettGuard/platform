// chrome.storage.session is cleared on browser restart; storage.local persists.
// We keep tokens in session (security), tenant prefs in local.

export async function getSessionToken(): Promise<string | null> {
  const { accessToken } = await chrome.storage.session.get("accessToken")
  return typeof accessToken === "string" ? accessToken : null
}

export async function setSessionToken(token: string): Promise<void> {
  await chrome.storage.session.set({ accessToken: token })
}

export async function clearSessionToken(): Promise<void> {
  await chrome.storage.session.remove("accessToken")
}

export interface Preferences {
  gatewayUrl: string
}

const DEFAULT_PREFS: Preferences = {
  gatewayUrl: "https://api.vettguard.com",
}

export async function getPreferences(): Promise<Preferences> {
  const { preferences } = await chrome.storage.local.get("preferences")
  return { ...DEFAULT_PREFS, ...(preferences as Partial<Preferences> | undefined) }
}

export async function setPreferences(p: Partial<Preferences>): Promise<void> {
  const current = await getPreferences()
  await chrome.storage.local.set({ preferences: { ...current, ...p } })
}
