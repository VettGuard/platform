// Deterministic mock score generator. Same MC → same score, so the chip
// doesn't flicker as DAT virtualizes rows in/out. Swap with a real
// `fetch(/v1/brokers/score?mc=…)` call when the brokers RPC ships.

export type ScoreTone = "ok" | "warn" | "bad"

export type Score = {
  value: number
  toneClass: ScoreTone
  verdict: string
  stats: ScoreStat[]
}

export type ScoreStat = {
  label: string
  value: string
  tone: ScoreTone
}

// 32-bit FNV-1a — fast, allocation-free, deterministic across browsers.
function hash(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function mockScore(mc: string): Score {
  const h = hash(mc.toUpperCase())
  // 25..98 — never 0/100 (calibration boundary), skewed slightly above 60
  // to match the production-time histogram seen in the reference designs.
  const value = 25 + (h % 74)
  const payDays = 15 + ((h >>> 7) % 50)        // 15..64
  const onTimePct = 70 + ((h >>> 13) % 30)     // 70..99
  const disputes = (h >>> 19) % 18             // 0..17

  if (value >= 75) {
    return {
      value,
      toneClass: "ok",
      verdict: "Book confidently",
      stats: [
        { label: "Pay speed",    value: `${payDays} days`,    tone: "ok" },
        { label: "On-time rate", value: `${onTimePct}%`,      tone: "ok" },
        { label: "Disputes",     value: `${disputes}%`,       tone: "ok" },
      ],
    }
  }
  if (value >= 55) {
    return {
      value,
      toneClass: "warn",
      verdict: "Watch closely",
      stats: [
        { label: "Pay speed",    value: `${payDays} days`,    tone: "warn" },
        { label: "On-time rate", value: `${onTimePct}%`,      tone: "warn" },
        { label: "Disputes",     value: `${disputes}%`,       tone: "warn" },
      ],
    }
  }
  return {
    value,
    toneClass: "bad",
    verdict: "Avoid this load",
    stats: [
      { label: "Pay speed",  value: `${payDays} days`,         tone: "bad" },
      { label: "Disputes",   value: `${disputes} in 12mo`,     tone: "bad" },
      { label: "Bond claims", value: disputes > 8 ? "2 active" : "1 active", tone: "bad" },
    ],
  }
}
