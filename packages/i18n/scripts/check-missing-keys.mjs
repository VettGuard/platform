#!/usr/bin/env node
// Verify every locale has the same set of keys as the canonical English catalog.
// Run: `pnpm -F @vettguard/i18n check-keys` (also wired in CI).

import { readdirSync, readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const messagesDir = join(__dirname, "..", "messages")
const CANONICAL = "en"

function flatten(obj, prefix = "") {
  const out = []
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("_")) continue
    const key = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      out.push(...flatten(v, key))
    } else {
      out.push(key)
    }
  }
  return out.sort()
}

function load(locale, namespace) {
  const path = join(messagesDir, locale, `${namespace}.json`)
  return JSON.parse(readFileSync(path, "utf8"))
}

const locales = readdirSync(messagesDir).filter((d) => d !== CANONICAL)
const namespaces = readdirSync(join(messagesDir, CANONICAL))
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""))

let failures = 0
for (const ns of namespaces) {
  const canon = flatten(load(CANONICAL, ns))
  for (const locale of locales) {
    let cmp
    try {
      cmp = flatten(load(locale, ns))
    } catch {
      console.error(`✗ ${locale}/${ns}.json missing`)
      failures += 1
      continue
    }
    const missing = canon.filter((k) => !cmp.includes(k))
    const extra = cmp.filter((k) => !canon.includes(k))
    if (missing.length || extra.length) {
      console.error(`✗ ${locale}/${ns}.json drift:`)
      missing.forEach((k) => console.error(`    missing: ${k}`))
      extra.forEach((k) => console.error(`    extra:   ${k}`))
      failures += 1
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} locale/namespace pair(s) out of sync.`)
  process.exit(1)
}
console.log(`✓ All ${locales.length} locales × ${namespaces.length} namespaces in sync with ${CANONICAL}.`)
