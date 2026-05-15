/// <reference lib="dom" />
import { createRoot } from "react-dom/client"
import { useState } from "react"

import widgetCss from "../styles/widget.css?inline"

interface WidgetProps {
  source: string
}

function Widget({ source }: WidgetProps) {
  const [busy, setBusy] = useState(false)

  const handleSend = async () => {
    setBusy(true)
    try {
      await chrome.runtime.sendMessage({
        type: "vg.sendLoad",
        payload: { source },
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="vg-widget" role="region" aria-label="VettGuard">
      <span className="vg-dot" aria-hidden />
      <span className="vg-label">VettGuard</span>
      <button type="button" className="vg-btn" onClick={handleSend} disabled={busy}>
        {busy ? "Sending…" : "Send to VettGuard"}
      </button>
    </div>
  )
}

/**
 * Mount the widget inside a Shadow DOM so host-page CSS cannot break it.
 * Idempotent: re-calling on the same anchor is a no-op.
 */
export function mountWidget(anchor: HTMLElement): void {
  if (anchor.shadowRoot) return
  const shadow = anchor.attachShadow({ mode: "open" })

  const style = document.createElement("style")
  style.textContent = widgetCss
  shadow.appendChild(style)

  const mount = document.createElement("div")
  shadow.appendChild(mount)

  const source = anchor.getAttribute("data-vettguard-anchor") ?? "unknown"
  createRoot(mount).render(<Widget source={source} />)
}
