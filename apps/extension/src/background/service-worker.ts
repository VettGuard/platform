// Background service worker for VettGuard MV3 extension.
//
// Responsibilities:
// - Centralize API calls so content scripts don't talk to the network directly
//   (avoids CORS pain on host pages).
// - Listen for unauthorized signals → clear token + open popup.
// - Future: handle webhook-style push from gateway via long-poll or SSE.

import { clearSessionToken } from "../lib/storage"

interface SendLoadMessage {
  type: "vg.sendLoad"
  payload: {
    source: "dat" | "truckstop" | "123loadboard"
    brokerName?: string
    brokerMc?: string
    rateCents?: number
    origin?: string
    destination?: string
    rawHtml?: string
  }
}

type ExtensionMessage = SendLoadMessage | { type: "unauthorized" } | { type: "ping" }

chrome.runtime.onInstalled.addListener((details) => {
  console.warn("[vettguard] installed:", details.reason)
})

chrome.runtime.onMessage.addListener(
  (msg: ExtensionMessage, _sender, sendResponse) => {
    void (async () => {
      try {
        switch (msg.type) {
          case "ping":
            sendResponse({ ok: true })
            return
          case "unauthorized":
            await clearSessionToken()
            sendResponse({ ok: true })
            return
          case "vg.sendLoad":
            // Phase 2: forward to gateway POST /v1/loads/ingest.
            console.warn("[vettguard] vg.sendLoad", msg.payload.source)
            sendResponse({ ok: true, queued: true })
            return
          default:
            sendResponse({ ok: false, error: "unknown message" })
        }
      } catch (err) {
        sendResponse({ ok: false, error: String(err) })
      }
    })()
    return true // keep channel open for async sendResponse
  },
)
