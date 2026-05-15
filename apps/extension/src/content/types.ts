// Normalized data extracted by per-loadboard adapters.
export interface LoadCandidate {
  source: "dat" | "truckstop" | "123loadboard"
  brokerName?: string
  brokerMc?: string
  rateCents?: number
  origin?: string
  destination?: string
  pickupDate?: string
  deliveryDate?: string
  rawHtml?: string
}

export interface LoadboardAdapter {
  /** Lowercase host suffix(es) this adapter handles. */
  hosts: readonly string[]
  /** Mount the VettGuard widget(s) on the page. Idempotent — adapter must avoid double-mounts. */
  mount(host: HTMLElement): void
  /** Extract a load card under the cursor / right-click / button click. */
  extract(target: HTMLElement): LoadCandidate | null
}
