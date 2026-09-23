import { startObserving } from "../score-injector"
import type { LoadboardAdapter, LoadCandidate } from "../types"

// DAT One uses a heavily virtualized grid. We do two things:
//   1. Drop a fixed-position floating widget bottom-right (the "summary
//      orb") for quick access to the popup-style overlay.
//   2. Start a MutationObserver that injects an inline AI score chip into
//      every broker row as DAT loads / scrolls / re-virtualizes the grid.
//
// Real broker MC extraction is best-effort — DAT's selectors aren't
// public-stable. The injector falls back to scanning row text for an
// `MC-NNNNN` pattern, and we accept that some grid layouts will simply
// produce no chips until a Sprint 4 reverse-engineering pass tightens
// the selectors.
export const datAdapter: LoadboardAdapter = {
  hosts: ["dat.com"],

  mount(host) {
    if (!host.querySelector("[data-vettguard-anchor]")) {
      const anchor = document.createElement("div")
      anchor.setAttribute("data-vettguard-anchor", "dat")
      anchor.style.cssText =
        "position:fixed;bottom:16px;right:16px;z-index:2147483647;"
      host.appendChild(anchor)
    }
    startObserving(host)
  },

  extract(target): LoadCandidate | null {
    const card = target.closest<HTMLElement>(
      "[data-test='search-result-row'], tr.search-result",
    )
    if (!card) return null
    return {
      source: "dat",
      rawHtml: card.outerHTML,
    }
  },
}
