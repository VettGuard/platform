import type { LoadboardAdapter, LoadCandidate } from "../types"

export const truckstopAdapter: LoadboardAdapter = {
  hosts: ["truckstop.com"],

  mount(host) {
    if (host.querySelector("[data-vettguard-anchor]")) return
    const anchor = document.createElement("div")
    anchor.setAttribute("data-vettguard-anchor", "truckstop")
    anchor.style.cssText = "position:fixed;bottom:16px;right:16px;z-index:2147483647;"
    host.appendChild(anchor)
  },

  extract(target): LoadCandidate | null {
    const card = target.closest<HTMLElement>("[data-testid='load-row'], .load-card")
    if (!card) return null
    return {
      source: "truckstop",
      rawHtml: card.outerHTML,
    }
  },
}
