import { useEffect, useState } from "react"

interface SessionStatus {
  signedIn: boolean
  email: string | null
}

async function fetchStatus(): Promise<SessionStatus> {
  const { accessToken } = await chrome.storage.session.get("accessToken")
  return { signedIn: Boolean(accessToken), email: null }
}

export function Popup() {
  const [status, setStatus] = useState<SessionStatus>({ signedIn: false, email: null })

  useEffect(() => {
    void fetchStatus().then(setStatus)
  }, [])

  const handleSignIn = () => {
    // Phase 2: chrome.identity.launchWebAuthFlow → gateway /v1/auth/oauth/start.
    chrome.tabs.create({ url: "https://app.vettguard.com/sign-in?from=extension" })
  }

  return (
    <div className="popup">
      <h1>VettGuard</h1>
      <p>One-click detention recovery + broker vetting.</p>

      {status.signedIn ? (
        <div className="status">
          ✓ Signed in
          <br />
          Visit DAT, Truckstop, or 123Loadboard to start.
        </div>
      ) : (
        <>
          <button type="button" onClick={handleSignIn}>
            Sign in
          </button>
          <div className="status">Not signed in yet.</div>
        </>
      )}
    </div>
  )
}
