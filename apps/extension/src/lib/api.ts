import { VettGuardClient } from "@vettguard/sdk"
import { getPreferences, getSessionToken } from "./storage"

let clientPromise: Promise<VettGuardClient> | null = null

export function client(): Promise<VettGuardClient> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const prefs = await getPreferences()
      return new VettGuardClient({
        baseUrl: prefs.gatewayUrl,
        getAccessToken: () => getSessionToken(),
        onUnauthorized: () => {
          // Background SW will surface a notification + clear token
          void chrome.runtime.sendMessage({ type: "unauthorized" })
        },
      })
    })()
  }
  return clientPromise
}
