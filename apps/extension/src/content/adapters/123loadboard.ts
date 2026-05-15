import type { LoadboardAdapter, LoadCandidate } from "../types"

export const loadboard123Adapter: LoadboardAdapter = {
  hosts: ["123loadboard.com"],

  mount(host) {
    if (host.querySelector("[data-vettguard-anchor]")) return
    const anchor = document.createElement("div")
    anchor.setAttribute("data-vettguard-anchor", "123loadboard")
    anchor.style.cssText = "position:fixed;bottom:16px;right:16px;z-index:2147483647;"
    host.appendChild(anchor)
  },

  extract(target): LoadCandidate | null {
    const card = target.closest<HTMLElement>("[data-test='load-listing'], .lb-load-row")
    if (!card) return null
    return {
      source: "123loadboard",
      rawHtml: card.outerHTML,
    }
  },
}
