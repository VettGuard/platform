import type { LoadboardAdapter, LoadCandidate } from "../types"

// DAT One uses a heavily virtualized grid. Foundation scope is widget injection +
// raw HTML capture. Phase 2 will parse cell-level fields (broker MC, rate, lanes).
export const datAdapter: LoadboardAdapter = {
  hosts: ["dat.com"],

  mount(host) {
    if (host.querySelector("[data-vettguard-anchor]")) return
    const anchor = document.createElement("div")
    anchor.setAttribute("data-vettguard-anchor", "dat")
    anchor.style.cssText = "position:fixed;bottom:16px;right:16px;z-index:2147483647;"
    host.appendChild(anchor)
  },

  extract(target): LoadCandidate | null {
    const card = target.closest<HTMLElement>("[data-test='search-result-row'], tr.search-result")
    if (!card) return null
    return {
      source: "dat",
      rawHtml: card.outerHTML,
    }
  },
}
