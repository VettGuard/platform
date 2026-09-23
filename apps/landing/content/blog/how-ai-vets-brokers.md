---
title: "How AI vets brokers in 0.4 seconds"
date: "2026-05-10"
author: "VettGuard Team"
summary: "Under the hood of the broker score — FMCSA authority, bond claims, payment patterns, and Claude tool-use to glue it all together."
tags: ["engineering", "ai"]
---

The score chip you see on a DAT row is the output of a small Claude Haiku run that pulls four data sources in parallel:

1. **FMCSA SAFER** — authority status, insurance, bond, fleet size.
2. **Bond providers** — open claim count over the last 12 months.
3. **Carrier network** — anonymised pay-speed signals from the 1,240 fleets in our network.
4. **Complaint databases** — MyCarrierPackets, RMIS, public BBB feeds.

Claude calls each as a tool, deduplicates the answers, and returns a structured `RiskReport{score, factors, red_flags, summary}`. The whole thing is cached for 24 hours per MC#, so the score chip on your DAT board appears the moment the row paints — no waiting.

## Why "0.4s" isn't marketing fluff

The 0.4s is the **median time from page paint to chip render** measured across the production extension. Caching does most of the work: 87% of broker lookups hit the Redis layer. The 13% that miss take ~3s on average — still fast enough to feel instant in the load board.

If you want the math, our [pricing page](/#pricing) explains how the 18% fee turns into pure profit when the alternative is a $487 write-off.
