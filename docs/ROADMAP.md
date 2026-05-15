# VettGuard — Roadmap

> Foundation Phase (Sprint 0 ✓ tugadi). Hozir Sprint 1'ga tayyormiz.
> Hujjat oxirgi yangilangan: 2026-05-15.

Bu hujjat keyingi 12 oy uchun yo'l xaritasi. Har bir sprint/faza:
- **Goal** — nimaga erishamiz
- **Deliverables** — aniq ish ro'yxati
- **Acceptance** — qachon "tugadi" deymiz
- **Risks** — nima yiqilishi mumkin
- **Dependencies** — undan oldin nima kerak

Daromad oqimlari:
- **Detention Recovery** — 18% success fee (Phase 2'da real bo'ladi)
- **Broker Vetting** — $199/oy subscription (Phase 3'da launch)

---

## Hozirgi holat (2026-05-15)

Sprint 0 yopildi. Monorepo skeleton, 7 Go servis (`go vet` clean, binaries build),
Python AI gateway (FastAPI + Anthropic SDK), 4 Next.js apps + Chrome extension,
docker-compose dev stack, GitHub Actions CI/security workflows, 5 ta ADR — barchasi
ishlamoqda. `pnpm install` va `make up` qilganda hammasi ishga tushadi.

Repo: 1.4 MB, ~187 fayl. Hech qanday biznes logika hali yo'q — bu poydevor.

---

## FOUNDATION PHASE (5 haftalik, qolgan 4 hafta)

### Sprint 1 — Infrastructure foundation (Week 2)

**Goal:** Hetzner production cluster + GitOps + observability ishlaydigan holatda. Har bir push'da staging muhitiga avtomatik deploy.

**Deliverables:**
- [ ] `infra/terraform/hetzner/` — Terraform Hetzner Cloud provider
  - 3 ta CCX13 nodes (k3s control + workers, Falkenstein FSN1)
  - LB11 load balancer
  - Encrypted volumes (LUKS) state uchun
  - Hetzner Firewall (faqat 22/80/443 ochiq)
  - Cloudflare DNS records (`*.vettguard.com` → LB)
- [ ] **k3s** bootstrap (Ansible yoki k3sup), Traefik ingress controller, RBAC config
- [ ] **cert-manager** + Let's Encrypt cluster issuer (DNS-01 via Cloudflare)
- [ ] **Cloudflare** zona setup:
  - WAF managed rulesets + OWASP CRS
  - Turnstile CAPTCHA site key (signup uchun)
  - Page rules + DNS + DDoS settings
  - Tunnel (cloudflared) — optional, internal panellar uchun
- [ ] **ArgoCD** install + GitOps repo wiring (`infra/k3s/argocd/apps/`)
  - App-of-apps pattern
  - Sync policy: auto-sync + self-heal
- [ ] **Bitnami Sealed Secrets** controller + workflow (`kubeseal` CLI)
- [ ] **CloudNativePG** operator + dev cluster + WAL archiving to Hetzner Storage Box
- [ ] **Redis** Sentinel (3 replica) via Helm
- [ ] **NATS JetStream** cluster (3 node) via Helm
- [ ] **MinIO** Operator + production tenant
- [ ] **Observability stack** (Helm):
  - OTel collector (DaemonSet)
  - Tempo (traces)
  - Loki (logs) + Promtail
  - Mimir / Prometheus (metrics)
  - Grafana + 5 ta provisioned dashboards (cluster, k3s, postgres, redis, services)
- [ ] **Sentry** project (frontend + backend SDK keys)
- [ ] **Uptime Kuma** at `status.vettguard.com` (3 ta dastlabki probe: gateway, dashboard, landing)
- [ ] **Backup runbook** — pg_basebackup nightly, restore drill DRY
- [ ] **Self-hosted GitHub Actions runner** Hetzner CX21 box'da

**Acceptance:**
- `terraform apply` toza state'dan to'liq stack chiqaradi
- ArgoCD UI ko'rinadi, login ishlaydi, App-of-apps barcha bola app'larni `Synced` holatda ushlab turadi
- `kubectl get pods -A` hamma pod `Running` yoki `Completed`
- `https://status.vettguard.com` 3 ta yashil probe ko'rsatadi
- Grafana'da `cluster-overview` dashboard ma'lumot oladi
- Restore drill skripti `restore-postgres.sh` 5 daqiqa ichida testga ulanadi

**Risks:**
- Hetzner Cloud quota limit (yangi accountda qattiq) → support tiketi keraklikda
- k3s + cert-manager + Cloudflare DNS-01 — birinchi marta murakkab; reference repo'lar tayyor
- Postgres backup destination bilan tarmoq routing'ni tekshirish kerak

**Dependencies:** Hetzner hisobi va Cloudflare hisobi (founder qiladi). Domen `vettguard.com` sotib olingan bo'lishi kerak.

---

### Sprint 2 — Core platform services (Weeks 3-4)

**Goal:** Identity + Billing + Notifier + Audit + AI Gateway "real" ishlaydi. Foydalanuvchi haqiqiy signup qilib, Stripe customer yaratiladi, welcome email keladi, audit log yoziladi.

**Deliverables:**

**`services/identity`** (1 hafta):
- [ ] Goose migrations: `tenants`, `users`, `memberships`, `sessions`, `oauth_links`, `mfa_factors`, `password_resets`
- [ ] RLS policies hammasi yoqilgan, integration test isbotlaydi
- [ ] OAuth flows (Google + Microsoft):
  - `GET /v1/auth/oauth/start` → authorize URL
  - `GET /v1/auth/oauth/callback` → token exchange + create-or-link user
- [ ] Email + password:
  - Argon2id hash (params: m=64MB, t=3, p=1)
  - Email verification (signed token via notifier)
  - Password reset flow
  - Rate-limited login (5/min/IP)
- [ ] TOTP 2FA opsional:
  - Setup endpoint → secret + QR + recovery codes
  - Verify endpoint
- [ ] Session lifecycle:
  - Access JWT (15 min, Ed25519)
  - Refresh token (7d sliding, rotating, Redis-backed `revoked_jti` set)
- [ ] RBAC: middleware `RequireRole(owner|admin|dispatcher|viewer)`
- [ ] Connect-RPC handlers `proto/v1/identity.proto`'dagi har bir RPC uchun

**`services/billing`** (3-4 kun):
- [ ] Stripe SDK integration (latest `github.com/stripe/stripe-go/v82`)
- [ ] On tenant create → Stripe Customer create (idempotent by `tenant_id`)
- [ ] Subscription create endpoint (Plan: VETTING_BASE $199/mo)
- [ ] Stripe Customer Portal session generator
- [ ] Stripe webhook handler:
  - Signature verify
  - Idempotent processing (event_id dedup)
  - Events: `customer.subscription.{created,updated,deleted}`, `invoice.payment_{succeeded,failed}`
- [ ] **Stub** for `CreateSuccessFeeInvoice` (Detention phase'da yakunlanadi)
- [ ] Stripe Tax enable

**`services/audit`** (2 kun):
- [ ] Migrations: `events` partition by month (next 12 month pre-created)
- [ ] Append handler — idempotent, PII redacted
- [ ] Query handler — admin-only via RBAC
- [ ] Nightly archive job: previous month → MinIO immutable bucket

**`services/notifier`** (2-3 kun):
- [ ] Postmark integration (transactional)
- [ ] 5 ta email template (MJML kompilatsiya):
  - `auth.verify` — email tasdiqlash linki
  - `auth.reset` — parol tiklash linki
  - `auth.mfa` — 2FA setup tasdig'i
  - `billing.invoice` — Stripe invoice paid/failed
  - `notify.generic` — fallback
- [ ] Redis-backed idempotency (message_id dedup 24h)
- [ ] Bounce + complaint webhook handler (Postmark → notifier)

**`services/ai-gateway`** (Python, 3-4 kun):
- [ ] Real Anthropic API call ishlaydi (test env'da `ANTHROPIC_API_KEY` bilan)
- [ ] Prompt cache hit rate metric Grafana'da ko'rinadi
- [ ] `/v1/ai/echo` real Claude javobini qaytaradi
- [ ] `/v1/ai/classify-document` — minimal OCR pipeline (Tesseract yoki Claude vision)
- [ ] Per-tenant token usage Redis counter + daily budget check
- [ ] `promptfoo` eval suite — har deploydan oldin 5 ta golden case test

**`services/gateway`** (2-3 kun):
- [ ] JWT verify middleware (JWKS pull from identity, 5 min cache)
- [ ] Per-tenant + per-IP rate limit (Redis token bucket: 100 req/min default)
- [ ] CORS config (apps domenlari)
- [ ] OpenAPI 3.1 spec auto-generated, served at `/openapi.json`
- [ ] Connect-RPC fan-out internal'ga (mTLS)
- [ ] Request ID + structured logging propagation

**Acceptance:**
- `curl https://api-staging.vettguard.com/v1/auth/oauth/start?provider=google` → 302 Google'ga
- Full signup flow Playwright bilan green
- Stripe test mode'da subscription chiqadi, Customer Portal ochiladi
- Mailpit (dev) yoki Postmark sandbox'da welcome email ko'rinadi
- AI echo endpointiga POST qilingan har request audit log'da yoziladi
- Grafana'da har bir servis uchun trace ko'rinadi (gateway → identity → audit chain)

**Risks:**
- OAuth callback URI registration (Google/Microsoft) production domeni bilan
- Stripe webhook'ni dev'da test qilish uchun `stripe listen --forward-to localhost:8082`
- AI gateway'da real Claude calls budgetni tezda yondiradi — quota alarm ishlasin

---

### Sprint 3 — Customer surfaces (Week 5)

**Goal:** Real foydalanuvchi tashrif buyurib, signup qila olsin. Landing premium ko'rinishda 6 tilda, dashboard login + sozlamalar ishlaydi, extension auth flow tugagan.

**Deliverables:**

**`apps/landing`** (3 kun):
- [ ] Hero + features + pricing + FAQ ko'rsatib turibdi (Sprint 0'da skeleton tayyor)
- [ ] Theme switch real "boom" effect bilan ishlaydi va silliq (Chromium + Safari)
- [ ] Locale switcher SEO-friendly URL'larni saqlaydi (`/uz/pricing`)
- [ ] Email capture form (waitlist) → POST gateway
- [ ] Open Graph meta tags + Twitter Card + favicon set
- [ ] axe-core a11y CI'da yashil
- [ ] Lighthouse: Performance ≥95, A11y ≥95, SEO 100
- [ ] sitemap.xml + robots.txt + hreflang tags
- [ ] Plausible yoki PostHog analytics (cookie-free)

**`apps/dashboard`** (3-4 kun):
- [ ] Login sahifa real OAuth + email/password ishlaydi
- [ ] 2FA setup wizard
- [ ] Tenant settings: profil, kompaniya MC#, DOT#, ELD connections (UI stub)
- [ ] Billing portal link (Stripe-hosted)
- [ ] Empty states for Detention va Vetting tablar
- [ ] Notification center (audit log o'z tenant'i bo'yicha)
- [ ] Logout + session revoke

**`apps/admin`** (2 kun):
- [ ] SSO sign-in (Google Workspace OIDC)
- [ ] Tenant list + search + suspend tugmasi
- [ ] Audit log viewer (cross-tenant, bypass role, har action audited)
- [ ] AI token usage per tenant chart (foundation metric)

**`apps/extension`** (2-3 kun):
- [ ] Popup login: `chrome.identity.launchWebAuthFlow` → gateway OAuth
- [ ] Token saqlash `chrome.storage.session`
- [ ] "Send to VettGuard" tugmasi real POST yuboradi (gateway)
- [ ] Content scripts: load card aniqlash + raw HTML capture (3 ta loadboard)
- [ ] Status badge widget (signed-in vs signed-out)
- [ ] Chrome Web Store listing project (icon, screenshots, descriptions 6 tilda)

**`packages/i18n`** (1 kun):
- [ ] Native speaker review uchun Uzbek/Russian dastlabki tarjimalar
- [ ] AI-draft uk/es/tr — promptfoo regression suite (3 ta canonical sentence)

**Acceptance:**
- `https://vettguard.com` 6 tilda renderga keladi
- Yangi foydalanuvchi `https://app.vettguard.com/sign-up` orqali OAuth qilib, dashboard'ga kiradi
- Chrome extension Web Store'da review uchun yuborilgan (yoki Developer Mode'da load qilinadi)
- E2E Playwright suite: signup → login → settings → billing → logout — yashil
- Sentry'da xato yo'q

**Risks:**
- Chrome Web Store review uzoq kutiladi (1-2 hafta), DAT/Truckstop content scripts'ga e'tibor — TOS ehtimol
- Uzbek/Russian native review qiluvchi tayinlash kerak

---

### Foundation tugashi — Go/No-Go gate

5 hafta nihoyasida:
- ✅ Hammasi production'da ishlayotgan (`https://app.vettguard.com` real foydalanuvchini qabul qiladi)
- ✅ Hech qanday domain logika hali yo'q — bu rost
- ✅ Keyingi faza uchun arxitektura barcha qaror ADR'da yozilgan

Founder qarori: agar `<1 hafta kechiksak>` qabul qilamiz; `>2 hafta` — RCA va scope cut.

---

## PHASE 2 — Detention Recovery (Weeks 6–14, ~2 oy)

**Goal:** Birinchi haqiqiy daromad oqimi ishlay boshlaydi. Dispatcher detention claim yuborib, AI darrov claim package generatsiya qilib, broker'ga jo'natadi; pul kelganida biz 18% invoice yuboramiz.

### Workstreams

#### A — ELD integratsiya (Weeks 6-8)
- [ ] `services/eld` Motive OAuth to'liq:
  - Token refresh
  - Driver list + vehicle list sync
  - Trips API (lat/long stream)
  - HOS logs API (HOS = Hours of Service)
- [ ] `services/eld` Samsara OAuth to'liq (yuqoridagi parallel)
- [ ] **Dwell event computation pipeline:**
  - Geofence har shipping address atrofida (PostGIS)
  - Driver arrived → driver departed timestamp
  - Threshold (default 2 soat) > → dwell event publish NATS'ga
  - Event subject: `eld.events.dwell.detected`
- [ ] Webhook ingest (Motive + Samsara HMAC verify)
- [ ] Re-ingest queue (NATS JetStream durable) qayta ishlov uchun
- [ ] Tenant ELD connection sahifa (dashboard'da real)

#### B — Detention domain service (Weeks 8-11)
- [ ] **YANGI** `services/detention` Go microservice
- [ ] Schemas: `detention_claims`, `claim_events`, `claim_documents`, `claim_invoices`
- [ ] State machine:
  - `detected` → `prepared` → `pending_dispatcher_review` → `sent_to_broker` → `paid` | `disputed` | `rejected`
- [ ] AI pipeline (ai-gateway'da yangi task):
  - `prepare_detention_claim(eld_trace, load_metadata) → ClaimPackage`
  - Includes: cover letter, evidence summary, dwell timeline, requested amount
- [ ] Dispatcher one-click review UI (dashboard)
- [ ] Auto-send via email (notifier) yoki manual PDF download
- [ ] Broker reply tracking (IMAP yoki Postmark inbound)
- [ ] Status updates Stripe success fee invoice'ni trigger qiladi

#### C — Success fee billing (Weeks 11-12)
- [ ] `services/billing` `CreateSuccessFeeInvoice` to'liq:
  - Stripe Invoice create (one-off, line items)
  - NET 30 due
  - Webhook handler: paid → audit log + analytics
- [ ] Stripe Connect (alternative): broker pays carrier → 18% AND auto-split — tahlil va qaror

#### D — Extension Detention UX (Weeks 12-13)
- [ ] Extension'da load → Detention Claim flow (1 click)
- [ ] Real-time dwell tracker badge ("Driver 1h 47m on dock — claim in 13 min")
- [ ] Push notification (browser API) — `dwell > threshold` bo'lganda

#### E — QA + Pilot (Week 14)
- [ ] 5-10 ta haqiqiy uzbek-amerika dispatcher pilot
- [ ] Feedback loop — har detention claim'ni qo'lda audit
- [ ] AI claim quality eval (founder qo'lda baholaydi 50 ta misol)
- [ ] Pricing/economics validation: real fee collected vs Stripe cost

**Phase 2 Acceptance:**
- ≥10 ta haqiqiy detention claim AI tomonidan yaratildi
- ≥5 ta broker tomonidan to'lov amalga oshirildi
- Birinchi 18% success fee Stripe orqali yig'ildi
- AI claim qualityni dispatcher 80%+ tasdiqlamoqda (kichik tahrir bilan)
- Stripe Tax integratsiya AQSh sales tax bilan to'g'ri ishlamoqda

**Risks:**
- Motive/Samsara API approval ko'p hafta (boshlanishida partnership murojaat)
- DAT/Truckstop "rate con" matn formatlari turli — AI extraction qiyin bo'lishi mumkin
- Broker email response — IMAP integratsiya yoki manual upload variant kerak
- Huquqiy: detention claim package — paralegal yoki huquqshunos review

---

## PHASE 3 — Broker Vetting (Weeks 15–22, ~2 oy)

**Goal:** `$199/oy` subscription'ni to'liq ishga tushiramiz. Broker'larni AI doimiy kuzatuvda — risk score, watchlist alerts, history report.

### Workstreams

#### A — Vetting data layer (Weeks 15-17)
- [ ] **FMCSA SAFER scraper / API**:
  - MC# / DOT# bo'yicha lookup (authority status, insurance, bond, fleet size)
  - Caching layer Redis (24h TTL)
- [ ] **Broker bond providers** (NAFTA Insurance, Carrier Bonding, etc.) — public data
- [ ] **RMIS / Carrier411** integratsiya (licensed access — partnership murojaat)
- [ ] **MyCarrierPackets** broker complaint database
- [ ] **Payment history aggregator** (DAT yoki Truckstop'dan ru'xsat bilan)

#### B — Vetting AI agent (Weeks 17-19)
- [ ] **YANGI** `services/vetting` Go microservice
- [ ] Schemas: `brokers`, `broker_scores`, `broker_alerts`, `watchlists`
- [ ] AI risk synthesis (Claude Sonnet 4.6, tool-use mode):
  - Tool: `fetch_fmcsa(mc_number)`
  - Tool: `fetch_complaints(mc_number)`
  - Tool: `fetch_payment_history(mc_number)`
  - Output: structured `RiskReport{score, factors, red_flags, summary}`
- [ ] Daily rescore job (cron) — har broker oyiga 1 marta, watchlist'dagilar — har hafta
- [ ] Watchlist alert (email + dashboard notification + extension badge)

#### C — Vetting UX (Weeks 19-21)
- [ ] Dashboard'da Brokers tab:
  - List + search + filter (score range, watchlist)
  - Broker detail page: score, factors, history, alerts
- [ ] Extension Broker Preview:
  - Load card'da broker MC# ko'rinadi → hover qilganda risk score badge
  - 1 click "Vet this broker" → real-time report
- [ ] Bulk import (CSV) — eski broker ro'yxati uchun
- [ ] Export (CSV / PDF) — tax/legal uchun

#### D — Subscription billing (Week 21)
- [ ] Stripe Subscription Plan `vetting-base` $199/mo
- [ ] 14-day trial
- [ ] Trial → paid conversion email sequence (notifier)
- [ ] Dunning: failed payment → 3 ta retry → suspend

#### E — Launch (Week 22)
- [ ] Marketing push (founder Uzbek dispatcher community)
- [ ] ProductHunt / Twitter / LinkedIn announce
- [ ] First 50 paid customers target

**Phase 3 Acceptance:**
- ≥100 broker FMCSA orqali vet qilingan
- ≥10 ta paid subscriber
- AI risk score accuracy ≥85% (qo'lda audit qilingan namuna asosida)
- Watchlist alert mexanizmi ishlamoqda (test broker'ni risky qilib ko'rsatamiz)

**Risks:**
- FMCSA SAFER rate limit — backoff + caching kerak
- Risk score modeli — false positive'lar dispatcher ishonchini yo'qotadi (eval suite + insan-loop)
- Carrier411 partnership rad etilsa — alternative kerak

---

## PHASE 4 — Admin & polish (Weeks 23–28, ~6 hafta)

**Goal:** Internal operatsiyalar uchun to'liq admin dashboard, SOC 2 Type 1 audit hujjatlari, professional translatorlar bilan i18n review.

### Deliverables
- [ ] **Admin dashboard** to'liq:
  - Tenant lifecycle (create, suspend, restore, delete)
  - User impersonation (audited bypass)
  - Per-tenant analytics: AI token usage, claim count, recovery amount
  - Detention claim audit (random sample for quality)
  - Broker risk score override (admin can adjust)
  - Refund/credit issuance (Stripe Invoicing)
  - Status page editor
- [ ] **SOC 2 Type 1 readiness**:
  - Security policies (information security, access control, incident response, BCP)
  - Vendor risk assessments (Anthropic, Stripe, Hetzner, Cloudflare, Postmark, Twilio)
  - Penetration test (qiyalik bilan: pentester engagement)
  - Auditor RFP + selection
- [ ] **Professional i18n review**:
  - Native speaker review Uzbek (founder), Russian, Spanish, Turkish, Ukrainian
  - Re-issue translation as `human-reviewed`
- [ ] **DPA + privacy** — GDPR-style endpoints (DSAR, deletion, export)
- [ ] **Status page** (`status.vettguard.com`) — incident posting workflow
- [ ] **Runbook'lar** — incident SOPs, on-call rotation (founder-only initially)
- [ ] **Documentation site** (`docs.vettguard.com`) — API reference + Chrome extension help

---

## YEAR 2 — Scale (Months 7-12)

### Q3 — Ecosystem
- [ ] Additional ELD providers (Geotab, Verizon Connect, Trimble, KeepTruckin Lite)
- [ ] Additional load boards (Sylectus, Direct Freight, RXO, Uber Freight, Convoy, Loadsmart, J.B. Hunt 360, NextLoad, FR8Star, Coyote, Trucker Path) — pluggable adapter framework
- [ ] **Detention auto-send mode** (opt-in) — AI fully autonomous (no dispatcher click)
- [ ] **AI Negotiator** — Claude responds to broker email replies (tool-use)

### Q4 — Enterprise + Multi-region
- [ ] Enterprise tier — DB-per-tenant option, custom SLAs, dedicated support
- [ ] SSO (SAML/OIDC) for enterprise
- [ ] **US region** (AWS us-east-1 for data residency) — Hetzner EU stays for non-US tenants
- [ ] SOC 2 Type 2 audit start (continuous compliance, 12 month observation)
- [ ] Mobile app (React Native) — driver-side companion (TODO: research need)

### Year 2 KPIs (target)
- ARR: $1M+
- Paid tenants: 500+
- Detention recovered: $5M+
- Avg AI cost per tenant per month: <$15

---

## Cross-cutting tracks (continuous)

### Security
- Quarterly dep audit (Renovate + Trivy + manual review)
- Quarterly restore drill
- Annual external pentest
- Bug bounty program (HackerOne) — Phase 4 launch

### Cost optimization
- Anthropic prompt cache hit rate target ≥70%, monitor monthly
- Hetzner instance right-sizing — review monthly
- Postgres bloat + autovacuum tuning — monthly
- CDN cache hit rate (Cloudflare) — monthly

### Engineering hygiene
- ADR per non-trivial decision (target: 1-2/month)
- README/docs freshness check quarterly
- Onboarding doc fastness test (new contractor < 2h to first PR)

---

## Decision log (alohida hujjat: `docs/architecture/`)

Har bir muhim qaror ADR sifatida yozib qo'yiladi. Hozirgilar:
- ADR-001: Microservice boundaries
- ADR-002: Postgres RLS multi-tenancy
- ADR-003: JWT + refresh token strategy
- ADR-004: Monorepo structure
- ADR-005: Connect-RPC choice

Kelajakdagilar (taxminiy):
- ADR-006: Detention claim AI evaluation methodology
- ADR-007: Broker risk scoring model design
- ADR-008: ELD aggregator vs direct integration (when tail providers come up)
- ADR-009: Multi-region data residency strategy
- ADR-010: Mobile app build/buy decision

---

## Quyidagi qadam (NOW)

Bugun (2026-05-15):
1. `pnpm install` + `make up` — local stack ishga tushadi
2. `git add . && git commit -m "feat: foundation skeleton (Sprint 0)"` — boshlang'ich commit
3. GitHub remote (private repo) yaratish, push
4. Hetzner Cloud + Cloudflare hisoblari tayyorlash (Sprint 1 boshlanishi uchun)

Ertaga (Sprint 1 Day 1):
1. Terraform Hetzner provider + birinchi 3-node k3s cluster
2. Cloudflare zone + DNS + Turnstile site key
3. ArgoCD bootstrap (kustomize)

Tikilgan barcha sprint hujjatlari `docs/architecture/` ostida ADR'lar bilan to'ldiriladi. Har sprint nihoyasida bu hujjat yangilanadi — qolgan vaqt, qolgan ish, va keyingi qadam aniq bo'lib turadi.
