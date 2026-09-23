// Inline score chip injector — the headline visual of the extension.
//
// For each broker row a loadboard adapter exposes, we drop a small
// green/amber/red chip with the AI score inline + a hover tooltip with the
// explanation. The chip lives in its own shadow root so the host page's
// CSS can't restyle it.
//
// Scoring is mocked client-side (deterministic hash of broker MC) until
// the brokers RPC ships. Each broker always renders the same score so the
// designer's iteration loop stays stable. Swap `mockScore` for a real
// fetch when the backend is ready.

import { mockScore, type Score } from "./mock-score"

const CHIP_ATTR = "data-vettguard-chip"
const ROW_FLAG = "data-vettguard-scored"
const SELECTOR =
  "[data-test='search-result-row'], tr.search-result, [data-vettguard-mock-row]"
// The cell selectors a loadboard might already use for the broker column —
// we anchor the chip near the broker name when we can find it, otherwise
// fall back to appending at the row's end.
const BROKER_CELL_SELECTOR =
  "[data-test='broker-name'], [data-column='broker'], .broker-name, .broker"

export function scanAndInject(root: ParentNode): number {
  const rows = root.querySelectorAll<HTMLElement>(SELECTOR)
  let injected = 0
  for (const row of rows) {
    if (row.hasAttribute(ROW_FLAG)) continue
    const mc = readBrokerMc(row)
    if (!mc) continue
    const score = mockScore(mc)
    inject(row, mc, score)
    row.setAttribute(ROW_FLAG, "1")
    injected += 1
  }
  return injected
}

// Best-effort extraction. DAT's grid varies; we try the obvious places and
// fall back to scanning row text for an MC# pattern.
function readBrokerMc(row: HTMLElement): string | null {
  const direct =
    row.querySelector<HTMLElement>("[data-broker-mc]")?.dataset.brokerMc ??
    row.dataset.brokerMc
  if (direct) return direct.trim()
  const match = row.textContent?.match(/MC-?\s*(\d{4,8})/i)
  if (match) return `MC-${match[1]}`
  // Mock-mode fallback: rows with the test attribute carry the MC inline.
  return row.getAttribute("data-vettguard-mock-row")
}

function inject(row: HTMLElement, mc: string, score: Score): void {
  // Pick an anchor near the broker cell when available so the chip lands
  // visually adjacent to the broker name. Otherwise append to the row.
  const anchor =
    row.querySelector<HTMLElement>(BROKER_CELL_SELECTOR) ?? row
  const slot = document.createElement("span")
  slot.setAttribute(CHIP_ATTR, "")
  slot.style.cssText =
    "display:inline-flex;vertical-align:middle;margin-left:8px;line-height:0;"
  anchor.appendChild(slot)

  const shadow = slot.attachShadow({ mode: "open" })
  shadow.appendChild(buildStyle())
  shadow.appendChild(buildChip(mc, score))
}

function buildStyle(): HTMLStyleElement {
  const style = document.createElement("style")
  style.textContent = `
    :host { all: initial; }
    .chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px; height: 22px;
      border-radius: 3px;
      font: 700 11px / 1 -apple-system, "Inter", "Segoe UI", system-ui, sans-serif;
      cursor: default;
      position: relative;
      user-select: none;
    }
    .chip.ok    { background: #ddf1e6; color: #0a8d5a; border: 1px solid #b5dec4; }
    .chip.warn  { background: #f8ebc8; color: #a56a0f; border: 1px solid #e2c885; }
    .chip.bad   { background: #fbe2dc; color: #c9341b; border: 1px solid #f0b9b0; }
    .chip:hover .tooltip { display: block; }

    .tooltip {
      display: none;
      position: absolute;
      top: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%);
      width: 260px;
      background: #0a0e14;
      color: #f2efe9;
      border-radius: 6px;
      padding: 12px 14px;
      box-shadow: 0 20px 40px rgba(10,14,20,0.30);
      z-index: 2147483647;
      font: 400 11.5px / 1.45 -apple-system, "Inter", "Segoe UI", system-ui, sans-serif;
      text-align: left;
      pointer-events: none;
    }
    .eyebrow {
      font: 600 10px / 1 ui-monospace, SFMono-Regular, monospace;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #ff4d0d;
      display: flex; align-items: center; gap: 6px;
      margin-bottom: 6px;
    }
    .verdict { font: 500 14px / 1.2 -apple-system, "Inter", system-ui, sans-serif; }
    .stats { margin-top: 8px; display: flex; flex-direction: column; gap: 4px; }
    .stat { display: flex; justify-content: space-between; font-size: 11px; }
    .stat span:first-child { color: #a89f92; }
    .stat .v { font-family: ui-monospace, SFMono-Regular, monospace; }
    .stat .v.bad  { color: #ff8866; }
    .stat .v.warn { color: #ffcb66; }
    .stat .v.ok   { color: #66d39a; }
    .sparkle {
      width: 10px; height: 10px;
      background: currentColor;
      mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12 2 13.6 9 21 10.5 13.6 12 12 19 10.4 12 3 10.5 10.4 9 12 2Z'/></svg>") no-repeat center / contain;
      -webkit-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12 2 13.6 9 21 10.5 13.6 12 12 19 10.4 12 3 10.5 10.4 9 12 2Z'/></svg>") no-repeat center / contain;
    }
  `
  return style
}

function buildChip(mc: string, score: Score): HTMLElement {
  const chip = document.createElement("span")
  chip.className = `chip ${score.toneClass}`
  chip.textContent = String(score.value)
  chip.title = `${score.verdict} — ${mc}`
  chip.setAttribute("role", "img")
  chip.setAttribute(
    "aria-label",
    `VettGuard score ${score.value} of 100 for ${mc}: ${score.verdict}`,
  )

  const tip = document.createElement("div")
  tip.className = "tooltip"
  tip.innerHTML = `
    <div class="eyebrow"><span class="sparkle"></span> AI risk summary</div>
    <div class="verdict">${escapeHtml(score.verdict)} · ${score.value}/100</div>
    <div class="stats">
      ${score.stats
        .map(
          (s) =>
            `<div class="stat"><span>${escapeHtml(s.label)}</span><span class="v ${s.tone}">${escapeHtml(s.value)}</span></div>`,
        )
        .join("")}
    </div>
  `
  chip.appendChild(tip)
  return chip
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;"
      case "<":
        return "&lt;"
      case ">":
        return "&gt;"
      case '"':
        return "&quot;"
      default:
        return "&#39;"
    }
  })
}

// Set up a MutationObserver watching for new rows. DAT virtualizes its
// grid so rows are added/removed on scroll; we re-scan affected subtrees.
let observer: MutationObserver | null = null
let scheduled = false
export function startObserving(root: HTMLElement = document.body): void {
  if (observer) return
  scanAndInject(root)
  observer = new MutationObserver((muts) => {
    // Throttle to one scan per animation frame — DAT churns the DOM heavily.
    let dirty = false
    for (const m of muts) {
      if (m.addedNodes.length > 0) {
        dirty = true
        break
      }
    }
    if (dirty && !scheduled) {
      scheduled = true
      requestAnimationFrame(() => {
        scheduled = false
        scanAndInject(root)
      })
    }
  })
  observer.observe(root, { childList: true, subtree: true })
}

export function stopObserving(): void {
  observer?.disconnect()
  observer = null
}
