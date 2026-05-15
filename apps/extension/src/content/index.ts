// Content script entrypoint. Routes to the right adapter based on host, then
// mounts the VettGuard widget in a Shadow DOM.

import { datAdapter } from "./adapters/dat"
import { truckstopAdapter } from "./adapters/truckstop"
import { loadboard123Adapter } from "./adapters/123loadboard"
import type { LoadboardAdapter } from "./types"
import { mountWidget } from "./widget"

const ADAPTERS: readonly LoadboardAdapter[] = [datAdapter, truckstopAdapter, loadboard123Adapter]

function pickAdapter(): LoadboardAdapter | null {
  const host = window.location.hostname.toLowerCase()
  for (const adapter of ADAPTERS) {
    if (adapter.hosts.some((suffix) => host.endsWith(suffix))) return adapter
  }
  return null
}

function init() {
  const adapter = pickAdapter()
  if (!adapter) return

  adapter.mount(document.body)
  const anchor = document.body.querySelector<HTMLElement>("[data-vettguard-anchor]")
  if (anchor) mountWidget(anchor)
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true })
} else {
  init()
}

// Re-mount on SPA navigation (DAT, Truckstop are React/Angular SPAs).
const obs = new MutationObserver(() => {
  const adapter = pickAdapter()
  if (!adapter) return
  if (!document.body.querySelector("[data-vettguard-anchor]")) {
    adapter.mount(document.body)
    const anchor = document.body.querySelector<HTMLElement>("[data-vettguard-anchor]")
    if (anchor) mountWidget(anchor)
  }
})
obs.observe(document.body, { childList: true, subtree: true })
