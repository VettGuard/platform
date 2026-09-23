# VettGuard — Roadmap

> Foundation Phase (Sprint 0 ✓ tugadi). Hozir Sprint 1'ga tayyormiz.
> Hujjat oxirgi yangilangan: 2026-05-16.

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

**Deliverables (IaC = ✓ code complete; runtime apply waits for creds):**
- [x] `infra/terraform/hetzner/` — Terraform Hetzner Cloud provider ✓
- [x] **k3s** bootstrap scripts (install + kubeconfig fetch) ✓
- [x] **cert-manager** + Let's Encrypt cluster issuer (Cloudflare DNS-01) — Helm values + ClusterIssuer manifest ✓
- [x] **Cloudflare** zona setup — DNS A/AAAA + CAA + proxied prod / grey staging ✓
  - WAF/Turnstile/Tunnel — Cloudflare dashboard configuration (founder action)
- [x] **ArgoCD** install + App-of-apps + auto-sync/self-heal ✓
- [x] **Bitnami Sealed Secrets** controller (ArgoCD Application) ✓
- [x] **CloudNativePG** operator (ArgoCD Application) ✓
- [x] **Redis** Sentinel via Helm (ArgoCD Application) ✓
- [x] **NATS JetStream** 3-node cluster via Helm (ArgoCD Application) ✓
- [x] **MinIO** Operator (Tenant manifest TBD with sealed creds) ✓
- [x] **Observability stack** — kube-prometheus-stack + Loki + Tempo + OTel collector ✓
- [x] **Sentry** wiring — `docs/security/sentry-wiring.md` (kubeseal recipe + per-runtime init plan); DSN creation remains a founder action ✓
- [x] **Uptime Kuma** — `infra/k3s/argocd/apps/uptime-kuma.yaml` at `status.vettguard.com` ✓
- [x] **Backup runbook** — `ops/runbooks/backup-restore.md` ✓
- [x] **Self-hosted GitHub Actions runner** — `infra/terraform/hetzner/ci-runner.tf` (CX22 + cloud-init) + `scripts/register-gha-runner.sh` ✓

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
- [x] Goose migrations: `tenants`, `users`, `memberships`, `sessions`, `oauth_links`, `mfa_factors`, `email_verifications`, `password_resets` — Step 1 ✓ 2026-05-15
- [x] RLS policies on `tenants`/`memberships`/`sessions` (keyed by `app.tenant_id`); global tables app-layer gated — Step 1 ✓ 2026-05-15
- [x] `embed.FS` + `cmd/migrate` goose runner — Step 1 ✓ 2026-05-15
- [x] `tenantctx` + `pgxdb` (RLS-aware tx) + sqlc query layer (24 queries) — Step 2 ✓ 2026-05-15
- [x] OAuth flows (Google + Microsoft) — Step 6 ✓ 2026-05-16:
  - [x] `StartOAuth` → authorize URL + CSRF state (in-process StateStore, 10min TTL) — `internal/oauth/oauth.go`
  - [x] `CompleteOAuth` → token exchange + userinfo + link-or-create user + auto-issue session if any membership — `internal/usecase/oauth.go`
- [x] Email + password — Step 3 ✓ 2026-05-16:
  - [x] Argon2id hash (m=64MiB, t=3, p=1) — `internal/auth/password.go`
  - [x] Email verification (single-use sha256-hashed token via notifier) — `internal/usecase/verify_email.go`
  - [x] Password reset flow (1h TTL, revokes all sessions on confirm) — `internal/usecase/password_reset.go`
  - [x] Rate-limited login (5/min/IP) — in-process token bucket in identity ✓ 2026-05-16. Gateway-level distributed limiter still pending.
- [x] TOTP 2FA opsional — Step 7 ✓ 2026-05-16:
  - [x] Setup endpoint → secret + otpauth URL (QR) + 10 recovery codes — `internal/usecase/totp.go` (`EnableTOTP`)
  - [x] Verify endpoint — `VerifyTOTP` flips factor to verified; login gate enforces code when user has verified factor (`CheckTOTPCode`)
- [x] Session lifecycle — Step 4 ✓ 2026-05-16:
  - [x] Access JWT (15 min, Ed25519) — `internal/auth/jwt.go`
  - [x] Refresh token (7d sliding, rotating, sha256 stored in `sessions`) — `internal/usecase/session.go`
  - [x] Refresh-reuse auto-revoke chain — `FindSessionByHashIncludingRevoked` + `RevokeAllUserSessionsWithReason('refresh_reuse')` ✓ 2026-05-16
- [x] RBAC: middleware `RequireRole(owner|admin|dispatcher|viewer)` — `services/shared/pkg/middleware/rbac.go` ✓ 2026-05-16
- [x] Connect-RPC handlers `proto/v1/identity.proto` — Step 5 ✓ 2026-05-16 (SignUp/Login/Verify/Refresh/Revoke implemented; OAuth + TOTP stubbed Unimplemented)

**`services/billing`** (3-4 kun) — ✓ DONE 2026-05-16:
- [x] Stripe SDK integration (`github.com/stripe/stripe-go/v82` v82.5.1) — `internal/stripeapi/client.go`
- [x] On tenant create → Stripe Customer create (idempotent by `tenant_id` via `stripe_customers` mapping)
- [x] Subscription create endpoint (Plan: VETTING_BASE $199/mo, `payment_behavior=default_incomplete` returns `client_secret` from `latest_invoice.confirmation_secret`)
- [x] Stripe Customer Portal session generator (`PortalURL`)
- [x] Stripe webhook handler — `POST /v1/billing/stripe/webhook`:
  - [x] Signature verify (`webhook.ConstructEvent`)
  - [x] Idempotent processing (`stripe_events` table, ON CONFLICT DO NOTHING claim → ErrEventReplay)
  - [x] Events: `customer.subscription.{created,updated,deleted}` (status sync), `invoice.payment_succeeded` (mark success-fee paid), `invoice.payment_failed` (mark uncollectible)
- [x] **`CreateSuccessFeeInvoice`** — 18% computation + Stripe invoice-item + finalize → `hosted_invoice_url`. Math pinned in `fee_test.go`.
- [x] Stripe Tax — `SubscriptionAutomaticTaxParams.Enabled=true` (account-level tax settings must be configured in Stripe dashboard)

**`services/audit`** (2 kun) — ✓ DONE 2026-05-16:
- [x] Migrations: `audit_events` RANGE-partitioned monthly. DO block pre-creates prev month + next 12 (14 partitions total). `goose NO TRANSACTION` so DO/EXECUTE runs.
- [x] Append handler — `actor_type` + `action` required; PII redaction is upstream caller's responsibility (per proto comment). Idempotency-key deferred (proto has no field; identity callers can use action+request_id keyset upstream).
- [x] Query handler — sqlc.narg-filtered `tenant_id`/`actor_id`/`action`/`since`/`until` + offset pagination (`PageRequest.cursor`); access-control gating sits at the gateway via the existing `RequireRole` middleware.
- [x] Nightly archive job → MinIO immutable bucket — `cmd/archive` ✓ 2026-05-16. Streams previous month's events as gzip JSONL via io.Pipe (no full-month buffering) to `audit/YYYY/MM.jsonl.gz`. Idempotent on object key. Object-lock retention enforced at bucket level (operator configures on the MinIO Tenant). Wireable as a k8s CronJob; backfill via `--month=YYYY-MM`. 4 window-resolution tests cover prev-month default, explicit month, bad format, year rollover.

**`services/notifier`** (2-3 kun) — ✓ DONE 2026-05-16:
- [x] Postmark integration (transactional) — `internal/postmark/client.go` (no SDK; raw `/email` REST call)
- [x] 5 ta email template (Go `text/template` + `html/template` — MJML deferred; copy is brand-neutral, locale routing is a Phase 4 i18n task):
  - [x] `auth.verify` — email tasdiqlash linki
  - [x] `auth.reset` — parol tiklash linki
  - [x] `auth.mfa` — 2FA setup tasdig'i
  - [x] `billing.invoice` — Stripe invoice paid/failed
  - [x] `notify.generic` — fallback
- [x] Idempotency — Postgres `messages.idempotency_key` UNIQUE (chose Postgres over Redis: same dedup window the audit row needs anyway, one less moving part).
- [x] Bounce + complaint webhook handler — `POST /v1/notifier/postmark/webhook` parses `Bounce` (HardBounce → suppression list) + `SpamComplaint` → suppression + message status update.

**`services/ai-gateway`** (Python, 3-4 kun) — ✓ DONE 2026-05-16:
- [x] Real Anthropic API call ishlaydi — `AsyncAnthropic` + tenacity retries + ephemeral system-prompt caching (`anthropic_client.complete`)
- [x] Prompt cache hit rate metric Grafana'da ko'rinadi — `ai_gateway_tokens_cache_read_total` + `ai_gateway_tokens_input_total` Prometheus counters; ratio panel `cache_read / (cache_read + input)` on the AI dashboard
- [x] `/v1/ai/echo` real Claude javobini qaytaradi
- [x] `/v1/ai/classify-document` — wired end-to-end with structured-JSON parse (rejects malformed with 502). **OCR pipeline** (Tesseract or Claude Vision) **deferred to Phase 2** — Phase 2 swaps the placeholder user_message for OCR'd text. Whole route otherwise production-shaped.
- [x] Per-tenant token usage counter + daily budget check — `budget.TokenBudget` (in-process; Redis swap is a single-file change later). Pre-flight `check` → 429 on overrun; post-call `charge` totals input+output+cache_read+cache_creation. 4 unit tests cover under-limit / charge-reject / tenant-isolation / day-rollover.
- [x] `promptfoo` eval suite — `evals/promptfoo.yaml` with 5 golden cases (greeting, refusal via gpt-4o-mini rubric, strict-format ACK, rate_confirmation classify, lumper_receipt classify) + README. Latency thresholds set; CI hook is a Phase 4 todo.

**`services/gateway`** (2-3 kun) — ✓ DONE 2026-05-16:
- [x] JWT verify middleware — gateway derives the Ed25519 public key from `JWT_SIGNING_KEY` (same value identity signs with) and uses `shared/pkg/middleware/RequireAuth`. JWKS pull + 5-min cache deferred until we add key rotation (Sprint 3 follow-up).
- [x] Per-tenant + per-IP rate limit — `internal/ratelimit/`, Redis fixed-window counter via `INCR`+`EXPIRE` pipeline, 100/min default each. Fails OPEN on Redis errors (logged) so a Redis blip doesn't take the platform down. 4 unit tests cover XFF parsing, CF-Connecting-IP, RemoteAddr fallback, nil-client passthrough.
- [x] CORS — `github.com/go-chi/cors` middleware, origins from `CORS_ORIGINS` (CSV), exposes `X-Request-ID`, allows Connect protocol headers.
- [x] OpenAPI 3.1 — `internal/openapi/`, hand-curated spec at `/openapi.json` (health + AI REST surface); validated as JSON at init. Generating from `.proto` via grpc-gateway is a Sprint 3 add.
- [x] Connect-RPC fan-out — `internal/proxy/`, one `httputil.ReverseProxy` per Connect service prefix (`/vettguard.v1.Identity/*` → identity, etc.) + `/v1/ai/*` → ai-gateway. Propagates `X-Tenant-ID` / `X-User-ID` / `X-User-Role` to upstream from tenantctx. mTLS deferred — NetworkPolicy + service mesh cover the network layer for now.
- [x] Request ID + structured logging propagation — already provided by `shared/pkg/middleware.RequestID`/`Logger`; gateway uses the shared server constructor so it's wired by default.

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

**`apps/landing`** (3 kun) — first cut ✓ 2026-05-16 (design port from Anthropic Designer reference):
- [x] Hero + Benefits + ExtensionShowcase + HowItWorks + Pricing + FooterCTA + Footer — full reference design ported, animated recovered counter, DAT chrome-window mockup with score chips and extension panel
- [x] Theme switch real "boom" effect bilan ishlaydi va silliq (Chromium + Safari) — `ThemeProvider` (next-themes, `data-theme` attribute on `<html>`) + `ThemeToggle` button using `document.startViewTransition` driving a circular `clip-path: circle()` keyframe reveal centred on the click point. CSS-variable palette in globals.css; all inline styles in dsl.tsx read `var(--vg-*)`, so flipping the attribute re-paints the whole page without a React rerender. Falls back to instant swap on Firefox<128 / `prefers-reduced-motion: reduce`. ✓ 2026-05-16
- [x] Locale switcher SEO-friendly URL'larni saqlaydi (`/uz/pricing`) — landing-specific `LocaleSwitcher` (inline-styled, dsl tokens) dropped into LandingNav next to ThemeToggle. Existing next-intl `as-needed` routing preserved; all 6 locales prerender. ✓ 2026-05-16
- [x] Email capture form (waitlist) → POST gateway — `WaitlistForm` client component + `/api/waitlist` route handler (RFC-ish email validation, optional `GATEWAY_URL` forward, soft-fail logging). Wired into FooterCTA. ✓ 2026-05-16
- [x] Open Graph meta tags + Twitter Card + favicon set — per-locale `generateMetadata` (6 locales × title+description+canonical+hreflang alternates), runtime-generated `app/opengraph-image.tsx` (1200×630 PNG via @vercel/og), runtime favicon `app/icon.tsx` (64×64 orange chevron-shield PNG). Twitter card + viewport theme-color included. ✓ 2026-05-16
- [x] axe-core a11y baseline — keyboard-only `:focus-visible` rings (2 px orange), `aria-label` on Toggle/Language controls, `aria-live="polite"` on waitlist success, semantic landmarks (`<nav aria-label="Primary">`, `<footer>`). Full axe-core CI hook is a Phase 4 ops task. ✓ 2026-05-16
- [ ] Lighthouse: Performance ≥95, A11y ≥95, SEO 100 — formal run is a founder action with Chrome devtools/PageSpeed once the site is on staging; the optimisations (SSG prerender × 6 locales, edge-rendered OG image, no-cookie analytics, Inter `display=swap` fonts, deferred Plausible script) target the targets.
- [x] sitemap.xml + robots.txt + hreflang tags — Next 15 file-based `app/sitemap.ts` (one URL per locale × 6 hreflang alternates, weekly cadence) + `app/robots.ts` (Allow / + Disallow /api/ + Sitemap pointer). ✓ 2026-05-16
- [x] Plausible analytics (cookie-free) — `<script defer data-domain src=plausible.io/js/script.js>` injected in root layout, env-gated on `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (no-op in dev, opt-in in prod). Self-hosted alternative source overridable via `NEXT_PUBLIC_PLAUSIBLE_SRC`. ✓ 2026-05-16
- [x] **Full multilang (6 locales)** — `packages/i18n/messages/{en,uz,ru,es,tr,uk}/landing.json` exhaustively cover nav/hero/trustBar/benefits/showcase/howItWorks/pricing/footerCta/footer/waitlist. EN canonical, UZ founder-quality, RU/ES/TR/UK draft-quality (marked `_status: draft` for native-speaker review in Phase 4). Components consume via `useTranslations`; arrays read via `t.raw()`. ✓ 2026-05-16

**`apps/landing`** polish wave ✓ 2026-05-17:
- [x] **Hero broker-cycle animation** — `HeroDemo` rotates through 7 brokers every 2.4s; load-board row highlight + score chip scale-pulse (1.18× + 3px glow), right panel ScoreRing + summary + stats + AI hint update per broker. Tone-aware copy (success/warn/danger) with smooth cubic-bezier(0.22,1,0.36,1) transitions. ✓ 2026-05-17
- [x] **Mobile composition** (`<1024px`) — SSR-rendered standalone composition (`mobile.tsx` ~1300 lines): MobileNav, MobileHero, MobileSocialProof, MobileExtension (mini DAT load-board + AI verdict + 3 benefits), MobilePricing (stacked Free + Pro), MobileTestimonial, MobileFAQ (4 collapsible), MobileCTA, MobileFooter. CSS-only display swap via `.vg-desktop-only` / `.vg-mobile-only` — no JS, no hydration mismatch, no FOUC. Breakpoint catches iPad Mini/iPad/iPad Pro 11" portrait so they get the mobile-tuned layout instead of the cramped 1440-designed desktop. ✓ 2026-05-17
- [x] **Hamburger menu drawer** — full state machine with body scroll-lock (`body.vg-no-scroll` + iOS `touch-action: none` fix), ESC + backdrop-click dismiss, 260ms slide-down + 220ms backdrop fade, ≡↔× icon rotate (220ms). Drawer body has X close button + Mark home link + 5 nav links (Extension/Pricing/FAQ/Blog, locale-aware Blog href) + Join waitlist accent CTA + Sign in + LocaleSwitcher (`align="left"` so dropdown stays on-screen) + ThemeToggle. Hash links intercepted to scroll AFTER drawer closes (double-RAF; uses `querySelectorAll` + `offsetParent !== null` so it picks the rendered mobile section, not the display:none desktop dup). `role="dialog"` + `aria-modal` + `aria-expanded`. ✓ 2026-05-17
- [x] **Scroll-reveal animations** — `<Reveal>` IntersectionObserver wrapper fades + translates section content into view (600ms, fired once). Hero pill/headline/subtitle/CTAs cascade-enter via `.vg-enter` + 40/140/240/340ms delays. FAQ accordion uses grid-template-rows 0fr→1fr trick for smooth height transition. All animations transform/opacity only (GPU-friendly). `prefers-reduced-motion: reduce` neutralises every transition + scroll-behavior. ✓ 2026-05-17
- [x] **Logo + waitlist link fixes** — `Mark` accepts `href` prop (renders `<a aria-label="VettGuard — home">`); LandingNav, LandingFooter, MobileNav, MobileFooter all link home with `homeHref(locale)` (locale-aware: `/` for `en`, `/${locale}` otherwise). Join waitlist buttons use `waitlistHref(locale)` so clicking from /blog or /about navigates to landing's #waitlist anchor instead of dead-anchoring on current page. ✓ 2026-05-17
- [x] **Desktop landing-extras sections (6)** — PressStrip (6 outlets + 3 quote cards + YC backing band), DemoVideo (16:9 mock player with mesh gradient bg, line texture, 96px orange play button, progress bar, 4 chapter markers), ROICalculator (4 sliders → live annual recovery with 82/18 split + per-claim/month/truck matrix), Comparison table (1.6fr + 4 cols × 8 feature rows, orange "Recommended" highlight column, yes/no/partial/text cell renderers), Testimonials (3 carrier quote cards with author/stat footer), FAQDesktop (sticky-left intro + 8 accordion items with `vg-collapse` smooth height + 240ms +→× rotate). New `extras.*` i18n keys in all 6 locales (structural labels translated; long-form copy English everywhere as draft). New page composition order: Hero → Press → TrustBar → Benefits → ExtensionShowcase → DemoVideo → HowItWorks → ROICalculator → Comparison → Testimonials → Pricing → FAQDesktop → FooterCTA. ✓ 2026-05-17
- [x] **/pricing standalone page** — port of brand-extras.jsx PricingPage. Hero (mesh gradient + 68px headline + pill) → 2 tier cards (Free $0 surface, Pro $199 inverse dark with Most-popular pill) → "Compare plans" full feature matrix (1.8fr + 2 cols, 3 sections × 17 features, yes/no/text cell renderer). `pricingPage.*` i18n keys × 6 locales. Replaced empty `apps/landing/src/app/[locale]/pricing/` directory. ✓ 2026-05-17
- [x] **/about standalone page** — port of brand-extras.jsx AboutPage. Hero (Tashkent+Chicago pill + founder story) → stats strip (1,240 carriers / $8.4M / 94% / 11d) → 3 founder cards (Diyor/Aziz/Sevara) → 4 principle cards (icon + body) → backers strip. `aboutPage.*` i18n keys × 6 locales. Replaced the StubPage scaffold. ✓ 2026-05-17
- [x] **Waitlist backend wiring** — frontend hardening: 2KB body cap, per-IP sliding-window rate limit (5/min/IP), honeypot `company` field (visually hidden, `tabIndex=-1`, `aria-hidden`) — bot-fills silently 200, email length cap (254 chars), X-Forwarded-For respected on forward. Backend schema: `services/identity/migrations/00002_waitlist.sql` adds `marketing` schema + `marketing.waitlist_signups` (citext email UNIQUE, role, locale, source, ip, user_agent, confirmed_at, confirm_token, status enum CHECK, notes, timestamps + updated_at trigger). Notifier: new `marketing.waitlist_confirm` template (subject + text + html) with `confirm_url` var. Go-side gateway endpoint + identity usecase still pending. ✓ 2026-05-17
- [x] **SEO/OG expansion** — sitemap.xml grew from 6 → 96 entries (16 routes × 6 locales with full hreflang alternates). Per-route `generateMetadata` for /pricing and /about (6-locale title+description+canonical+hreflang+OG+Twitter). JSON-LD via new `JsonLd` helper: Organization schema sitewide in `[locale]/layout.tsx` (logo, sameAs, contactPoint with 6 availableLanguages), Product schema on /pricing (Free + Pro Offers with USD price), FAQPage schema on landing (i18n-sourced via `getTranslations` so rich-result Q/A matches visible DOM). ✓ 2026-05-17

**Sprint C — Auth glue ✓ 2026-05-17** (wire the half-built backend into real user flows; landing/dashboard pages now end-to-end):
- [x] **OAuth flow end-to-end (Google + Microsoft)** — `lib/identity.ts` gains `startOAuth(provider, redirectUri)` + `completeOAuth(provider, code, state)` Connect-RPC wrappers; `POST /api/auth/oauth/start` stores provider in a 10-min HttpOnly cookie (identity's callback receives no provider hint), proxies to identity's `StartOAuth`, returns `{authorizeUrl}` for client-side `window.location.href`; new server-component callback at `/[locale]/auth/callback/page.tsx` reads `code+state` from query + provider from cookie, calls `CompleteOAuth`, sets session cookies, redirects to the original `next` (default `/`); brand-new OAuth users without a membership fall through to `/sign-up?oauth=…&email=…`; cancel/error/expired states render an error panel with "Back to sign-in" link. SignInForm gets multi-coloured Google + Microsoft glyph buttons under a divider; middleware adds `/auth/callback` to PUBLIC_PATHS and skips the authed-bounce for it (cookie set during callback would otherwise loop). ✓ 2026-05-17
- [x] **Password reset UI** — new `/[locale]/forgot-password` page (anti-enumeration "check your inbox" success state) + `/[locale]/reset-password?token=…` page (8-char min, mismatch validation, success → 1.2s auto-redirect to `/sign-in`). Route handlers `/api/auth/forgot-password` + `/api/auth/reset-password` proxy to identity's existing `RequestPasswordReset` + `ConfirmPasswordReset` usecases; reset handler clears local session cookies (identity revokes every session server-side). SignInForm gets a "Forgot password?" link. Both routes were already in PUBLIC_PATHS. ✓ 2026-05-17
- [x] **Waitlist gateway endpoint (Go)** — new `services/identity/internal/usecase/waitlist.go`: `RegisterWaitlistSignup` does idempotent upsert into `marketing.waitlist_signups` (migration `00002_waitlist.sql` already shipped) — `pending` rows rotate the confirm token and re-send the email, confirmed rows are silent; `ConfirmWaitlistSignup` flips status to `confirmed` when the token matches a row younger than 7 days. `URLBuilder` interface extended with `WaitlistConfirmURL`; `Notifier` interface extended with generic `Send(NotifyArgs)` for templates outside the named transactional set (`marketing.waitlist_confirm` ships from notifier templates registry). `services/identity/cmd/main.go` adds `POST /v1/landing/waitlist` (anti-enumeration silent 200, falls back to X-Forwarded-For for `ip` field) + `GET /v1/landing/waitlist/confirm` (inline success HTML page). `services/gateway/internal/proxy/proxy.go` adds `MountPublic(router, backends, log)` that proxies `/v1/landing/waitlist*` + `/v1/auth/{verify-email,request-password-reset,confirm-password-reset}` to identity behind the IP-only rate limiter — also fixes a latent bug where the password-reset + verify-email endpoints weren't routed at all by the gateway. `services/gateway/cmd/main.go` wires `MountPublic` onto `publicAPI`. Identity + gateway `go build` + `go test` green. ✓ 2026-05-17

**Sprint E — Staging deploy preparation ✓ 2026-05-17** (everything a founder needs to bring `staging.vettguard.com` live; actual `terraform apply` + `kubectl apply` is a manual step the founder runs from the laptop):
- [x] **All Dockerfiles** — `services/brokers/Dockerfile` new; existing Go service Dockerfiles fixed (bumped `golang:1.23` → `1.25-alpine` to match `go.mod` requirement, added `ENV GOWORK=off` so the image doesn't need every workspace module on disk — was a latent bug, no image actually built before). Three new Next.js Dockerfiles (`apps/{landing,dashboard,admin}/Dockerfile`) — `output: "standalone"` added to each `next.config.mjs`, multi-stage (deps → builder → runner) with pnpm workspace + monorepo-root build context, minimal `node:22-alpine` runner running as uid 1001. ✓ 2026-05-17
- [x] **k8s manifests for the full vettguard namespace** — `infra/k3s/helm/vettguard/{identity,gateway,brokers,billing,notifier,audit,ai-gateway,landing,dashboard,admin}/` (25 yaml files total). Each service has Deployment (1 replica, `ghcr.io/vettguard/<name>:latest`, OTel endpoint pointed at the in-cluster collector, secrets referenced via `<service>-env`, readiness probe + 50m-500m CPU / 64-256Mi memory limits) + Service (ClusterIP). The four public surfaces (`gateway`, `landing`, `dashboard`, `admin`) each get an Ingress with `cert-manager.io/cluster-issuer: letsencrypt` annotations targeting `api.vettguard.com` / `vettguard.com` / `app.vettguard.com` / `admin.vettguard.com`. `base/namespace.yaml` creates the namespace. README at `infra/k3s/helm/vettguard/README.md` documents the tree. The previously-disabled ArgoCD Application (`vettguard-services.yaml`) now has `automated: { prune: true, selfHeal: true }` — drops the `Skip=true` annotation. ✓ 2026-05-17
- [x] **CI: build + push images** — `.github/workflows/build-images.yml` with 11-image matrix (7 Go services + 1 Python AI gateway + 3 Next.js apps). Per-image cache via GitHub Actions cache scope. Pushes to `ghcr.io/<repo-owner>/<name>:{latest,<sha>}` using the workflow's `GITHUB_TOKEN` — no PAT to rotate. `concurrency` group cancels in-flight runs on rapid pushes. Triggered on `push: main` + `workflow_dispatch`. ✓ 2026-05-17
- [x] **Deploy runbook** — `ops/runbooks/deploy-staging.md` is 8 ordered steps the founder runs end-to-end: prereqs check → kick the build workflow → CNPG db + role + identity/brokers migrations → 9 sealed-secret recipes (one per service, with required envs table) → OAuth callback URL registration in Google Cloud Console + Azure Portal + Stripe webhook → `terraform apply` for staging DNS records → cert-manager auto-issuance check → smoke test (curl /health, sign-up → verify → vet a broker). Includes a common-failures table (image pull, sealed-secret decrypt, ingress 502, cert-issuer missing, OAuth `redirect_uri_mismatch`) + ArgoCD rollback recipe. ✓ 2026-05-17

**Sprint G — Auto success-fee invoice ✓ 2026-05-17** (closes the revenue loop — Sprint F's `MarkPaid` now fires Stripe billing automatically; founder no longer needs to manually invoice the 18%):
- [x] **Claims migration `00002_success_fee.sql`** — adds `success_fee_invoice_id text NOT NULL DEFAULT ''` + `success_fee_url text NOT NULL DEFAULT ''` columns to the `claims` table. Empty-string default keeps the IS NULL filter unambiguous and lets existing rows survive the migration. ✓ 2026-05-17
- [x] **Cluster-internal billing client** — `claims/internal/usecase/createSuccessFeeInvoice` posts to `${BILLING_SERVICE_URL}/vettguard.v1.Billing/CreateSuccessFeeInvoice` over JSON (Connect-RPC accepts JSON on Content-Type). Body carries tenantId / detentionClaimId / recoveredAmountCents / description. 10s timeout. Returns `(invoiceId, hostedUrl, ok)` — never raises; failure is logged to stderr so ops sees it but the caller treats false as "skip, move on". ✓ 2026-05-17
- [x] **`MarkPaid` orchestration** — first transaction flips `status='paid' + recovered_cents + paid_at`. THEN — outside the status-flip tx, intentionally — calls billing. On success a second transaction stores `success_fee_invoice_id + success_fee_url`. Idempotency guard: skip the billing call when the row already has an invoice id (defensive against dispatchers double-clicking "Mark paid"). Billing failure is **non-fatal** — the claim still flips to paid because the carrier has already been paid IRL; a stuck-as-sent claim with a manual ops invoice is strictly worse than a paid claim with a missing auto-invoice. ✓ 2026-05-17
- [x] **Query refactor** — all five queries (Create / Draft load / Draft update / MarkPaid / List + transition re-read) now share `claimColumns` constant + `scanClaim` helper. Stops the five SELECT/RETURNING column lists from drifting apart as new columns land. ✓ 2026-05-17
- [x] **Handler + dashboard surface** — `claimOut` JSON ships `successFeeInvoiceId` + `successFeeUrl` (omitempty). `lib/claims.ts` Claim type adds both. `ClaimDrawer` renders a green success-soft card for paid claims with the dollar icon, "18% success fee · $X" eyebrow, "Invoice INV-… created" body, and an "Open invoice" external-link button to the Stripe-hosted URL. When billing hasn't replied yet (or failed) the card shows "Invoice will appear once billing replies — refresh in a moment". ✓ 2026-05-17
- [x] **k8s manifest envs** — `claims/deployment.yaml` adds `BILLING_SERVICE_URL=http://billing.vettguard.svc.cluster.local:8082` + `AI_GATEWAY_URL=http://ai-gateway.vettguard.svc.cluster.local:8090` (the latter was missing — Draft would have fallen back to the template on every call until this fix). Also fixed a pre-existing bug in **all 11 deployment.yaml files** where the image tag had been mangled by a bash heredoc (e.g. `ghcr.io/vettguard/brokersatest` instead of `ghcr.io/vettguard/brokers:latest`) — every pod would have ImagePullError'd on first sync. ✓ 2026-05-17

**Sprint F — Claims service MVP ✓ 2026-05-17** (the second half of the pitch — detention recovery is no longer just a mock on the dashboard):
- [x] **`services/claims` scaffolded** — new Go service on port 8087. Migration `00001_claims.sql` defines `claims` (uuid pk, tenant_id, `ref` text human-id like `CLM-4827` via a shared `claims_ref_seq` + `(tenant_id, ref)` unique, broker_mc, broker_name, load_ref, dwell_hours numeric(5,2) CHECK 0..168, claim_amount_cents bigint, recovered_cents, status enum CHECK in (`draft|sent|paid|denied|disputed`), drafted_subject/body, ai_drafted bool, created/drafted/sent/paid_at timestamps, RLS policy keyed on `current_setting('app.tenant_id')`, updated_at trigger, indexes on `(tenant_id, created_at DESC)` and `(tenant_id, status, created_at DESC)`). Usecase package: `Create` (inserts draft + auto-generates ref), `Draft` (loads row, calls AI gateway via `draftViaAI`, falls back to deterministic plain-text template when AI unreachable, updates `drafted_subject/body/ai_drafted/drafted_at`), `MarkSent` (draft→sent with sent_at stamp), `MarkPaid` (sent/disputed → paid with recovered_cents + paid_at), `List` (newest-first). All operations read tenant id from `tenantctx` and run inside `pgxdb.WithTenantTx` so RLS gates every query. Handler exposes `GET /v1/claims`, `POST /v1/claims`, `POST /v1/claims/{id}/draft`, `POST /v1/claims/{id}/send`, `POST /v1/claims/{id}/paid` over plain JSON. `main.go` mirrors brokers — `tenantHeaderMiddleware` promotes gateway-forwarded `X-Tenant-ID` headers to `tenantctx`. `cmd/migrate/main.go` for goose. `Dockerfile` produces `/app` + `/migrate` dual binaries. Added to `go.work`; `go build` green. ✓ 2026-05-17
- [x] **AI gateway `POST /v1/ai/draft-claim`** — new FastAPI route + Pydantic schemas (`DraftClaimRequest`, `DraftClaimResponse`) + system prompt (`prompts/draft_claim.py`) that asks Claude for strict JSON `{subject ≤60 chars, body 100-180 words}`. Prompt instructs the model on the carrier-to-broker customs (2-hour free window, mention attached BOL/ELD evidence, sign as "Dispatch team" — the actual carrier identity is filled in by the dispatcher when they edit before sending; no PII like phone numbers / addresses / names). Tone: professional + firm + short — broker dispatchers skim. Handler `_parse_payload` tolerates ```` ```json ```` code fences and falls back to a one-line invoice text on parse failure so the caller always gets a non-empty subject + body. Same budget / metrics / token-cache scaffolding as `score_broker`. Default Claude Haiku 4.5. ✓ 2026-05-17
- [x] **Gateway routing + dashboard wiring** — `proxy.Backends.Claims` field + `Mount` registers `/v1/claims/*`. `CLAIMS_SERVICE_URL` env defaults to `http://localhost:8087`. New k8s manifest at `infra/k3s/helm/vettguard/claims/{deployment,service}.yaml` (same Deployment shape as brokers, ClusterIP service, readiness `/v1/claims/info`). CI matrix gains `claims` image. Dashboard: new `lib/claims.ts` (typed client for list/create/draft/send/paid). Four route handlers (`/api/claims`, `/api/claims/[id]/{draft,send,paid}`) pull access JWT from cookies + forward as Bearer. `CustClaims` swapped from hardcoded 10-row constant to `useEffect` → `listClaims` → render: 4 KPI stats computed from real data (open / recovered MTD / disputed / drafts awaiting), filter tabs counted from real status mix, AI-drafted banner shows only when drafts.length > 0 with real claim sum, empty state ("No detention claims yet — Create your first claim when a load runs detention"). Row click opens `ClaimDrawer` (right slide-in, 560px). New `NewClaimModal` creates a draft, then auto-opens the drawer. ✓ 2026-05-17
- [x] **Dashboard claim drawer (one-tap AI flow)** — drawer shows: header (ref + broker + dwell), 3-cell KV (claim / recovered / status), AI-ready card when status=draft + body empty ("Draft with AI" CTA → `POST /api/claims/{id}/draft` → identity calls AI gateway → row updates in place with subject + body). Once drafted: shows subject in surface-alt block + body in pre-wrap with "AI-drafted" callout. "Open email + mark sent" CTA → `POST /api/claims/{id}/send` flips to sent → builds a `mailto:?subject=…&body=…` and triggers `window.location.href` so the dispatcher's mail client opens with the AI-drafted message pre-filled (they paste the broker address + attach BOL/ELD evidence — Postmark inbound + factoring-partner deposit webhook are Phase 2). For sent claims: "Mark as paid" card with recovered-amount input → `POST /api/claims/{id}/paid`. ✓ 2026-05-17

**Sprint E.1 — Deploy hardening pass ✓ 2026-05-17** (proactive audit of Sprint E assets — caught seven issues that would have surfaced as the first kubectl errors during deploy):
- [x] **Gateway readiness probe** — generated manifest used `/v1/gateway/info` (doesn't exist); gateway actually exposes `/v1/health`. Fixed in `infra/k3s/helm/vettguard/gateway/deployment.yaml`. Without this, every gateway pod would have flapped `ContainerNotReady` forever and Traefik would have black-holed `api.vettguard.com`. ✓ 2026-05-17
- [x] **AI gateway readiness probe** — generated manifest used `/health`; FastAPI service registers `/healthz` + `/readyz` only. Fixed to `/readyz`. ✓ 2026-05-17
- [x] **Brokers migrate runner** — Sprint E shipped `services/brokers` without a `cmd/migrate/main.go`, so the runbook's `kubectl run brokers-migrate --command -- /migrate up` would have failed with "executable not found". Added the runner (copy of identity's pattern: `goose.RunContext` against `migrations.FS`). ✓ 2026-05-17
- [x] **Dual-binary Dockerfiles for identity + brokers** — both Dockerfiles now produce `/app` (the long-running service) AND `/migrate` (one-shot goose runner) in the same image. Runbook's migration step uses `kubectl run --command -- /migrate up`. Previously the runbook said `/app -migrate` which the main binary doesn't accept. ✓ 2026-05-17
- [x] **Gateway public routes — Identity Connect RPCs** — latent Sprint C bug surfaced: `MountPublic` only exposed REST routes (`/v1/auth/*`, `/v1/landing/*`), but the Identity Connect RPCs (`SignUpWithEmail`, `LoginWithEmail`, `RefreshSession`, `StartOAuth`, `CompleteOAuth`) were on the auth-required wildcard `/vettguard.v1.Identity/*`. Sign-up + sign-in would have returned 401 in production. Added these five exact paths to `MountPublic`; chi matches more specific routes first so the wildcard stays as the auth-required fall-through for `RevokeSession` / `EnableTOTP` / `VerifyTOTP`. ✓ 2026-05-17
- [x] **`.dockerignore`** — repo root had none. Next.js Dockerfiles' `COPY . .` would have dragged host `node_modules` (potentially clobbering pnpm install), `.next` caches, `vendor/` dirs, AND `infra/k3s/_secrets/*.yaml` (unsealed envs — credential leak into image layers). Added comprehensive ignore covering Node / Go / Python build artifacts, editor state, `.git`, `.env*`, and the unsealed-secret allowlist (`!*.sealed.yaml`). ✓ 2026-05-17
- [x] **CI image build context for ai-gateway** — workflow matrix had `context: ai/ai-gateway` but the Dockerfile's COPY statements expect monorepo root (`COPY ai/ai-gateway/pyproject.toml ai/ai-gateway/`). Build would have failed with "file not found" on first push. Fixed to `context: .`. ✓ 2026-05-17

**Sprint D — Real AI broker scoring ✓ 2026-05-17** (closes the loop on Sprint B; "AI" in the pitch is no longer a lie):
- [x] **AI gateway `POST /v1/ai/score-broker`** — new FastAPI route + Pydantic schemas (`ScoreBrokerRequest`, `ScoreBrokerResponse`, `BrokerStatus` enum) + system prompt (`prompts/score_broker.py`) that asks Claude for strict JSON: `{score 0-100, verdict, status, pay_days, reasons[], confidence}`. Status thresholds match the dashboard pill bands (`85+` preferred, `70-84` active, `50-69` watch, `<50` blocked). Prompt instructs the model to admit uncertainty (confidence ~0.4) when signals are scarce — explicitly forbidding hallucinated pay-history numbers. Handler `_parse_payload` tolerates ```` ```json ```` code fences (defense in depth; prompt forbids them) and falls back to a neutral `score=65 / confidence=0.1` payload on parse failure so the caller always gets a usable shape. Tokens / budget / prometheus metrics wired through the existing `complete()` helper with system-prompt caching enabled. Five tests cover parse-plain / parse-with-fence / parse-garbage / clamp / status-threshold edges. Defaults to Claude Haiku 4.5 for cost; caller can override per-request. ✓ 2026-05-17
- [x] **Brokers service uses real AI** — `usecase.ScoreFor` now delegates to `ScoreForCtx(ctx, mc, name, city)`, which POSTs to `${AI_GATEWAY_URL}/v1/ai/score-broker` with tenant id from `tenantctx` (so AI gateway can budget-enforce). On AI unreachable / 4xx-5xx / parse fail we fall back to the FNV-1a hash — never block a Vet on AI degradation because the dashboard would otherwise surface a 5xx instead of a chip. Fallback hash matches `apps/extension/src/content/mock-score.ts` so the two surfaces agree when AI is offline. 8-second outbound timeout. ✓ 2026-05-17

**Sprint B — End-to-end brokers flow ✓ 2026-05-17** (first surface that's not a mock — dashboard now reads/writes real Postgres rows through the full request stack):
- [x] **`services/brokers` scaffolded** — new Go service on port 8086. Migration `00001_brokers.sql` defines `vetted_brokers` (uuid pk, tenant_id, mc citext-ish text, name, city, score 0..100 CHECK, pay_days CHECK 0..365, loads, recovered_cents, status enum CHECK ('preferred','active','watch','blocked'), last_scored_at, timestamps; unique `(tenant_id, mc)` + `(tenant_id, score DESC)` index; RLS policy keyed on `current_setting('app.tenant_id')`; updated_at trigger). Usecase package `Vet/List/Get` reads `tenantctx` from request and runs in `pgxdb.WithTenantTx` so RLS gates every query. `normalizeMC` canonicalises "mc123" → "MC-123". `ScoreFor(mc)` is server-side FNV-1a — exact same hash as `apps/extension/src/content/mock-score.ts`, so a broker scored in the extension and on the dashboard returns identical numbers (swap with AI gateway when the broker-score endpoint ships). Handler exposes `GET /v1/brokers`, `POST /v1/brokers/vet`, `GET /v1/brokers/{mc}` over plain JSON (Connect-RPC overhead skipped — pure CRUD). `main.go` has an inline `tenantHeaderMiddleware` reading `X-Tenant-ID` / `X-User-ID` / `X-User-Role` from gateway-forwarded headers and pushing them into `tenantctx`. Added to `go.work`; `go build` + `go mod tidy` green. ✓ 2026-05-17
- [x] **Gateway routing** — `proxy.Backends` grew a `Brokers` field; `Mount` registers `/v1/brokers/*` to the new upstream; `BROKERS_SERVICE_URL` env defaults to `http://localhost:8086`. Auth middleware verifies the JWT and `proxy.Director` already forwarded the tenant/user/role headers — brokers service trusts them. ✓ 2026-05-17
- [x] **Dashboard wired to real data** — `lib/brokers.ts` thin client (listBrokers / vetBroker / getBroker) talks to `/api/brokers/*`. Three new Next route handlers (`/api/brokers`, `/api/brokers/vet`, `/api/brokers/[mc]`) pull the access JWT from the HttpOnly cookie and forward as Bearer to the gateway. `CustBrokers` swapped from hardcoded 12-row constant to `useEffect` → fetch → render: filter tabs now count from real data per status, empty state when zero brokers ("Vet your first broker"), error banner with Retry, "Last sync HH:MM" footer. New `VetBrokerModal` (MC + optional name + city) submits via `vetBroker`, refreshes list on success. `Btn` atom gained `disabled` + `aria-label` props so form CTAs can show a disabled "Scoring…" state during the round-trip. Type-check + lint green. ✓ 2026-05-17

**Sprint A — DAT content script ✓ 2026-05-17** (the actual product surface — what carriers see first):
- [x] **Inline score chips on power.dat.com** — `apps/extension/src/content/score-injector.ts` scans broker rows (`[data-test='search-result-row']`, `tr.search-result`, plus `data-vettguard-mock-row` for dev testing), reads broker MC (`data-broker-mc` attr → falls back to `MC-NNNNN` text-scan), drops a shadow-DOM-isolated 28×22 chip into the broker cell coloured by tone (`#ddf1e6/0a8d5a` ok · `#f8ebc8/a56a0f` warn · `#fbe2dc/c9341b` bad), with a 260px hover tooltip (orange sparkle eyebrow + verdict + 3 stat rows). `mock-score.ts` ships deterministic FNV-1a hashing so each MC stays stable across DAT's virtualized re-mounts — swap with a real `/v1/brokers/score?mc=…` fetch when the brokers RPC lands. `startObserving()` runs a `requestAnimationFrame`-throttled MutationObserver to handle DAT's heavy grid churn. Wired into `datAdapter.mount()` so the existing floating widget + new chips both render. Placeholder icon PNGs (16/48/128) generated to unblock `vite build`. ✓ 2026-05-17

**Customer + admin + extension design ports ✓ 2026-05-17** (Anthropic Designer reference, ~3,000 lines JSX → TS):
- [x] **`apps/dashboard` customer console** — 4 pages from `docs/design/reference/project/customer.jsx`: Overview (4 KPI cards w/ Sparkline + 12-mo LineChart + AI feed + watchlist + quick actions), Brokers (12-row vetted history + filter tabs + ScoreRing + per-row Sparkline trend), Claims (4 stat cards + orange AI-drafted banner + 10-row claim table with status pills), Settings (Integrations: load boards + ELD + factoring × `IntCard`). New `CustSidebar` (active route via `usePathname`, AI assistant card, user footer) + `CustTopbar` (per-route meta lookup, search + bell + theme toggle + sign-out). DSL ported into `apps/dashboard/src/components/dash/dsl.tsx` (Card, Pill, Btn, Avatar, ScoreRing, Mark, Spark, SectionHead, PageBody, AIBadge, LineChart, Bars + 17 icons). Google fonts + VG CSS tokens added to root layout + globals.css. Replaces the old Tailwind sidebar/topbar Sprint 3 stub. ✓ 2026-05-17
- [x] **`apps/admin` internal-team console** — 5 pages from `docs/design/reference/project/admin.jsx`: Customers (4 KPI + 10-customer table w/ health rings + sparklines), Brokers DB (4 KPI + score-distribution Bars + watchlist + 14-row global broker table w/ A–F grade), AI Ops (4 KPI + AI review queue with confidence ring + Vetting model health metrics + auto-action Bars + retrain-ready card), Revenue (4 KPI + MRR build LineChart with new/expansion/churn series + plan-mix progress bars + recent invoices), Support (4 KPI + 8-ticket list + AI suggested-replies panel with confidence). New `AdminShell` (sidebar with VettGuard mark + orange "Admin" pill + 5 nav items + system health subsection + user footer with logout, topbar with per-route title/sub/CTA). Root `/` → `/customers` redirect. Middleware extended to gate `/customers`, `/brokers`, `/ai-ops`, `/revenue`, `/support` behind the existing `vg_admin` cookie. Legacy `/blog` CMS untouched. VG tokens + Google fonts added to admin globals.css + layout.tsx. ✓ 2026-05-17
- [x] **`apps/extension` popup** — port of `docs/design/reference/project/extension.jsx` ExtPopup: 380×600 with header (Mark + connected status + cog), MTD-recovered banner (orange-tint background + Spark + +18.4% Pill), 4 quick actions in 2×2 grid, today feed (5 items with tone-colored circle icons + relative timestamps), footer (Open dashboard + settings CTAs). Sign-in fallback view for unauth state. DSL copied to `apps/extension/src/components/dash/dsl.tsx`; Google Fonts + VG CSS tokens loaded via `popup.css`; light/dark switched by `prefers-color-scheme` (no manual toggle inside popup). DAT sidebar / hover tooltip / auto-claim toast still pending — those require real content-script DOM injection (adapters scaffolded under `src/content/adapters/` will pick up these designs in the next sprint). ✓ 2026-05-17

**`apps/dashboard`** (3-4 kun) — login MVP ✓ 2026-05-16:
- [x] Login sahifa real email/password ishlaydi — `/sign-in` server-rendered + `SignInForm` client component, POSTs to `/api/auth/login` which proxies identity's `LoginWithEmail` Connect-RPC through the gateway, sets HttpOnly `vg_access` + `vg_refresh` cookies on success. TOTP code field auto-appears when identity returns the "totp_code required" message.
- [x] **Signup + email verification flow** ✓ 2026-05-16:
  - `/sign-up` page + `SignUpForm` (fullName / tenantName / email / password ≥8 chars), POSTs `/api/auth/signup` → identity's `SignUpWithEmail` Connect-RPC creates tenant + owner-membership + verification token, notifier sends `auth.verify` email. On success dashboard redirects to `/verify-email-sent?email=…` (no auto-login — identity's `Login` blocks unverified accounts with `ErrEmailNotVerified`).
  - `/verify-email?token=…` page calls `POST /api/auth/verify-email` → identity's plain HTTP `POST /v1/auth/verify-email` (added to `cmd/main.go` alongside `/v1/auth/request-password-reset` + `/v1/auth/confirm-password-reset`; email-link flows aren't natural Connect RPCs). Shows verifying/ok/error/missing-token states.
  - `/verify-email-sent` confirmation page with envelope icon + spam-check note.
  - Sign-in form now links to `/sign-up`.
  - Middleware `PUBLIC_PATHS` extended to `sign-up`, `verify-email`, `verify-email-sent`, `forgot-password`, `reset-password` (last two reserved for the password-reset UI in the next batch).
- [x] OAuth (Google + Microsoft) — `/api/auth/oauth/start` proxies StartOAuth, server-component `/auth/callback` page reads `code+state` + provider cookie and calls CompleteOAuth, sets HttpOnly session cookies, redirects to `next`. SignInForm has multi-coloured Google + Microsoft glyph buttons. ✓ 2026-05-17 (Sprint C)
- [x] **Password reset UI** — `/[locale]/forgot-password` (anti-enumeration "check your inbox") + `/[locale]/reset-password?token=…` (8-char min, mismatch validation, → 1.2s auto-redirect to `/sign-in`). `/api/auth/forgot-password` + `/api/auth/reset-password` route handlers proxy identity; reset handler clears local cookies (identity revokes every session). SignInForm gains "Forgot password?" link. ✓ 2026-05-17 (Sprint C)
- [x] **2FA setup wizard** — `TotpWizard` on `/settings`: "Enable 2FA" → `POST /api/auth/totp/enable` (cookie-gated, pulls userId from JWT claims) → identity's `EnableTOTP` issues secret + otpauth URI + 10 recovery codes. Client-side QR via `qrcode` npm (no third-party fetch — secret never leaves the browser session) + monospace fallback for manual entry. 6-digit code field → `POST /api/auth/totp/verify` → identity's `VerifyTOTP` flips factor to `verified`. Recovery codes shown in an orange-tint card with "save these now" callout. Identity backend (`EnableTOTP` + `VerifyTOTP` usecases) was already shipped in Sprint 2 — this is the UI wire-up. ✓ 2026-05-17
- [~] Tenant settings: profil, kompaniya MC#, DOT#, ELD connections — design shipped via `CustSettings` (Integrations: load boards + ELD + factoring × `IntCard`) ✓ 2026-05-17, but the cards are UI-only — real form-edit / OAuth-connect flows for Geotab/Samsara/Plaid/etc. still deferred to Phase 3.
- [x] **Billing portal link (Stripe-hosted)** — `BillingPortalCard` on `/settings`: "Open billing portal" → `POST /api/billing/portal` pulls tenant_id from access JWT + forwards Bearer to gateway → billing service's `GetCustomerPortalURL` returns a Stripe Customer Portal session URL → `window.location.href`. Stripe handles payment methods, invoice history, plan changes, cancellation; Stripe sends the user back to `/settings` via the `return_url` param. New `lib/billing.ts` (Connect-RPC wrapper + typed BillingError). ✓ 2026-05-17
- [x] Empty states — `/` home has 3-tile + "Getting started" panel. `/brokers` ships a real empty state ("No brokers vetted yet — Vet your first broker") with primary CTA opening `VetBrokerModal`. Claims sub-route still deferred. ✓ 2026-05-17 (Sprint B)
- [~] Notification center — `CustTopbar` has the bell + orange-dot indicator ✓ 2026-05-17, but the slide-out notifications panel itself is deferred (mock data exists in `docs/design/reference/project/customer-extras.jsx` NotificationsPanel — port pending).
- [x] Logout + session revoke — `POST /api/auth/logout` clears cookies (identity-side session revoke by id deferred until we track session_id in the cookie shape).
- [x] **Foundation** — `lib/identity.ts` (typed fetch wrappers around Connect-RPC Login/Refresh/Revoke, error mapping), `lib/auth.ts` (cookie helpers + `currentSession` decoding the access JWT payload), `/api/auth/{login,logout,refresh}` route handlers, `middleware.ts` with redirect rules (`/sign-in` if unauthenticated, bounce back to `next` if authed), `(authed)` route group with `Sidebar` + `TopBar` (theme toggle + logout). Build green: 6 locales × dashboard/sign-in/settings prerendered, 3 dynamic API routes.

**`apps/admin`** (2 kun):
- [ ] SSO sign-in (Google Workspace OIDC)
- [ ] Tenant list + search + suspend tugmasi
- [ ] Audit log viewer (cross-tenant, bypass role, har action audited)
- [ ] AI token usage per tenant chart (foundation metric)

**`apps/extension`** (2-3 kun):
- [ ] Popup login: `chrome.identity.launchWebAuthFlow` → gateway OAuth
- [ ] Token saqlash `chrome.storage.session`
- [ ] "Send to VettGuard" tugmasi real POST yuboradi (gateway)
- [x] Content scripts: DAT inline score-chip injector — `score-injector.ts` scans `[data-test='search-result-row'], tr.search-result` rows, reads broker MC (`data-broker-mc` → fallback to MC# regex in row text), drops a shadow-rooted 28×22 chip (green/amber/red by tone) into the broker cell with a 260px hover tooltip (eyebrow + verdict + 3 stats). Deterministic FNV-1a mock scoring (`mock-score.ts`) keeps each MC stable across virtualization re-mounts; swap for real `/v1/brokers/score` fetch when the brokers RPC ships. `requestAnimationFrame`-throttled MutationObserver handles DAT's heavy DOM churn. Raw HTML capture for Truckstop / 123Loadboard adapters still pending. ✓ 2026-05-17
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

---

## Progress log

### 2026-05-15 — Sprint 0 (Bootstrap) ✓ DONE
Monorepo skeleton, 7 Go services, Python AI gateway, 4 Next.js apps, Chrome extension MV3, docker-compose dev stack, GitHub Actions CI/security, 5 ADRs.
`go vet` clean; binaries build at ~20MB. 187 files, 1.4MB.

### 2026-05-15 — Sprint 1 (Infrastructure IaC) ✓ DONE
Terraform Hetzner (network/firewall/servers/LB/Cloudflare DNS), k3s install + kubeconfig scripts, ArgoCD bootstrap + App-of-apps (10 child apps: cert-manager, sealed-secrets, traefik, cnpg, redis, nats, minio operator + tenant, observability×4), Helm values for cert-manager/Traefik/CNPG/kube-prometheus-stack/Loki/OTel, 5 ops runbooks.
Awaits Hetzner+Cloudflare credentials to `terraform apply`. Sentry DSN creation is a founder action (project on sentry.io) — wiring + Sealed-Secret recipe documented.

### 2026-05-15 — Sprint 2 / Step 1 (identity schema) ✓ DONE
- `services/identity/migrations/00001_initial_schema.sql` — `tenants`, `users`, `memberships`, `sessions`, `oauth_links`, `mfa_factors`, `email_verifications`, `password_resets`. CITEXT email/slug, CHECK constraints (locale, role, country, slug regex), `set_updated_at` trigger.
- **RLS** enabled on `tenants`, `memberships`, `sessions` keyed by `app.tenant_id`. Global tables (`users`, `oauth_links`, `mfa_factors`, token tables) are gated at the application layer via membership JOIN.
- `services/identity/migrations/migrations.go` — `embed.FS` so the binary ships migrations inline.
- `services/identity/cmd/migrate/main.go` — goose runner (`up`/`down`/`status`), builds (16MB).
- **Design note:** a user is GLOBAL and can belong to multiple tenants via `memberships`. Login returns the membership list; client picks tenant context; the session row is tenant-scoped.

### 2026-05-15 — Sprint 2 / Step 2 (db & repo layer) ✓ DONE
- `services/shared/pkg/tenantctx/` — typed tenant context (`TenantID`, `UserID`, `Role`, `RequestID`) threaded through `context.Context`.
- `services/shared/pkg/pgxdb/` — pgxpool wrapper. `WithTenantTx` sets `app.tenant_id` so RLS engages; `WithBypassTx` is the audited admin / global-table path.
- `services/identity/sqlc.yaml` — sqlc v2 config: pgx/v5 backend, UUID/citext/inet overrides, `emit_interface` for mocking.
- `services/identity/internal/db/queries.sql` — ~24 queries: tenants (4), users (6), memberships (5), sessions (6), oauth_links (3), mfa_factors (4), email_verifications (2), password_resets (2).
- `services/identity/internal/db/{db,models,querier,queries.sql}.go` — generated by `sqlc generate`. Build passes.
- Usage pattern:
  ```go
  err := pgxdb.WithTenantTx(ctx, pool, func(tx pgx.Tx) error {
      q := db.New(tx)
      _, err := q.CreateMembership(ctx, db.CreateMembershipParams{...})
      return err
  })
  ```

### 2026-05-16 — Sprint 2 / Step 3 (password authentication) ✓ DONE
- `services/identity/internal/auth/password.go` — Argon2id (m=64MiB, t=3, p=1) PHC-encoded hash + constant-time `VerifyPassword`. Unit test green.
- `services/identity/internal/auth/tokens.go` — `NewToken` (256-bit URL-safe raw + sha256 hex digest) for verification & reset links. Hand raw to user, store hash.
- `services/identity/internal/usecase/signup.go` — `SignUp(tenantName, slug, email, password, fullName, locale)`: atomically creates tenant + user + owner-membership + email-verification token (24h TTL); maps `23505` → `ErrEmailTaken`; sends verify link via `Notifier` (non-fatal failure).
- `services/identity/internal/usecase/verify_email.go` — single-use `ConsumeEmailVerification` token consumer + `MarkUserVerified`.
- `services/identity/internal/usecase/login.go` — email lookup, lockout check (`locked_until`), Argon2id verify, increment/reset `failed_login_count`, enumeration-safe (`ErrBadCredentials` for both unknown email and bad password), returns `[]Membership` so the caller can pick a tenant.
- `services/identity/internal/usecase/password_reset.go` — `RequestPasswordReset` (silent on unknown email, 1h TTL) + `ConfirmPasswordReset` (rotates password, revokes all sessions defense-in-depth).
- `services/identity/internal/usecase/usecase.go` — `Notifier` interface (RPC client in prod, stub in tests), `SimpleURLBuilder` for verify/reset links, domain errors (`ErrEmailTaken`, `ErrBadCredentials`, `ErrAccountLocked`, `ErrEmailNotVerified`, `ErrTokenInvalid`).
- `go vet` clean; `auth` unit tests pass. Handler wiring waits on Step 5.

### 2026-05-16 — Sprint 2 / Step 4 (sessions: JWT + refresh) ✓ DONE
- `services/identity/internal/auth/jwt.go` — Ed25519 `JWTSigner`: accepts a base64 seed (32B) or full private key (64B) from `JWT_SIGNING_KEY`; `IssueAccess(user, tenant, role)` → EdDSA JWT (15 min TTL, claims: sub/tid/role/jti/iat/exp/iss); `Verify` checks signature + expiry; `PublicKey()` exposed for future JWKS endpoint. `GenerateSigningKey` helper for bootstrap. Minimal — no external JWT library.
- `services/identity/internal/auth/jwt_test.go` — round-trip, wrong-key rejection, expired-token rejection, malformed-token rejection. All green.
- `services/identity/internal/usecase/session.go`:
  - `IssueSession(userID, tenantID, ua, ip)` — verifies `GetMembership(tenant, user)`, mints opaque refresh token (256-bit, sha256 stored), inserts `sessions` row (7d TTL), signs access JWT carrying current role. Returns `SessionTokens{access, refresh, expiries, sessionID}`.
  - `RefreshSession(rawRefresh)` — single-use rotation: `GetSessionByHash` (filters out revoked/expired), `RotateSession` swaps the hash + extends 7d window, re-reads role from membership (so role demotions take effect on next refresh). Returns fresh tokens.
  - `RevokeSessionByRefresh(rawRefresh, reason)` — logout path. Idempotent on unknown tokens (anti-enumeration).
- **Refresh reuse detection:** deferred. `GetSessionByHash` already filters `revoked_at IS NULL`, so a presented-already-revoked token returns `ErrTokenInvalid`; we don't yet auto-revoke the whole user-chain on suspected reuse. Tracked for a follow-up query split.
- `go build ./...` and `go vet ./...` clean on the identity service.

### 2026-05-16 — Sprint 2 / Step 5 (Connect-RPC handlers + JWT middleware) ✓ DONE
- **Proto stubs generated.** Fixed `packages/proto/v1/*.proto` imports (`v1/common.proto` → `common.proto` — buf module root is `v1/`) and `go_package` (dropped `/v1` suffix so output matches `packages/proto/gen/go/`). `pnpm --filter @vettguard/proto generate` now produces Go (`gen/go/*.pb.go` + `gen/go/protov1connect/*.connect.go`), TS, and Python bindings. Created `packages/proto/gen/go/go.mod` and added it to `go.work`.
- `services/identity/internal/handler/identity.go` — implements `protov1connect.IdentityHandler`:
  - `SignUpWithEmail` — auto-slugifies tenant name, calls `usecase.SignUp`, returns Tenant+User.
  - `LoginWithEmail` — `usecase.Login` → defaults to first membership (multi-tenant pick UI deferred) → `usecase.IssueSession` mints tokens. UA + remote IP captured for the session row.
  - `VerifySession` — pure JWT verify via the signer; returns TenantContext + Role.
  - `RefreshSession` — `usecase.RefreshSession` (rotating opaque refresh token).
  - `RevokeSession` — by `session_id`, direct query.
  - OAuth (Start/Complete) and TOTP (Enable/Verify) return `CodeUnimplemented` with Step 6/7 hints.
  - `mapErr` translates domain errors to Connect codes (AlreadyExists/Unauthenticated/FailedPrecondition/ResourceExhausted).
- `services/identity/cmd/main.go` — wired pgxpool, `auth.JWTSigner` (loaded from `JWT_SIGNING_KEY`), and a `logNotifier` stub (logs verify/reset URLs to zerolog until the notifier RPC client lands). `protov1connect.NewIdentityHandler` mounted on the shared chi server.
- `services/shared/pkg/middleware/jwt.go` — `RequireAuth(pub ed25519.PublicKey)` middleware for the gateway: parses `Authorization: Bearer`, verifies EdDSA, populates `tenantctx`. Standalone `VerifyJWT` helper. AccessClaims duplicated here intentionally so `shared` doesn't depend on the identity service binary; if the claim shape evolves, update both sides (TODO: extract to a `shared/pkg/jwtauth` package).
- `services/shared/pkg/middleware/jwt_test.go` — 4 tests: OK + ctx population, missing header, wrong key, expired. Green.
- Identity service `go build ./...` + shared `go test ./...` clean.

### 2026-05-16 — Sprint 2 / Steps 6–10 (identity hardening) ✓ DONE
Closed every remaining identity checkbox in this Sprint 2 section:
- **Step 6 — RBAC middleware:** `services/shared/pkg/middleware/rbac.go` — `RequireRole(...string)` reads `tenantctx.Role`, returns 401 (no ctx) or 403 (role not allowed). 3 table tests green.
- **Step 7 — Refresh-reuse detection:** new `FindSessionByHashIncludingRevoked` query (no revoked filter). When `RefreshSession` sees a revoked/expired row for the presented hash, it calls `RevokeAllUserSessionsWithReason(user, 'refresh_reuse')` and returns `ErrTokenInvalid`. Defends against stolen-refresh replay.
- **Step 8 — Login rate limit:** `internal/auth/ratelimit.go` — `IPRateLimiter` (in-process token bucket, 5/min/IP per replica), wired into `LoginWithEmail`. Distributed Redis limiter at the gateway is still on the Sprint 2 backlog.
- **Step 9 — TOTP 2FA:**
  - `internal/auth/crypto.go` — `AEAD` AES-256-GCM wrapper around `ENCRYPTION_KEY` (base64 32B) for encrypting MFA secrets at rest.
  - `internal/auth/totp.go` — `GenerateTOTP(account)` returns base32 secret + otpauth URL (QR) + 10 recovery codes (`AAAA-BBBB-CC` format); `ValidateTOTP(secret, code)` via `pquerna/otp`.
  - `internal/usecase/totp.go` — `EnableTOTP` (stores unverified factor + hashed recovery codes), `VerifyTOTP` (flips to verified), `HasVerifiedTOTP` + `CheckTOTPCode` used by login.
  - `LoginWithEmail` now requires `totp_code` when the user has a verified TOTP factor; missing/invalid → `CodeUnauthenticated`.
  - Handler: `EnableTOTP` returns `secret/qr_uri/recovery_codes`; `VerifyTOTP` returns `ok`.
- **Step 10 — OAuth (Google + Microsoft):**
  - `internal/oauth/oauth.go` — `Config` (per-provider `oauth2.Config` built from envs), `AuthorizeURL`/`Exchange`, userinfo fetched from `openidconnect.googleapis.com/v1/userinfo` and `graph.microsoft.com/oidc/userinfo`. CSRF `StateStore` (in-process, 10min TTL; trivially swappable for Redis later).
  - `internal/usecase/oauth.go` — `LinkOrCreateOAuthUser(provider, externalID, email, fullName)`:
    1. existing `oauth_links` row → resolve user + memberships;
    2. else existing email → attach link, return user + memberships;
    3. else create new verified user with NULL password → caller routes to tenant onboarding (no memberships, no tokens).
  - Handler: `StartOAuth` mints state + redirect URL; `CompleteOAuth` validates state↔provider match, exchanges code, runs link-or-create, and issues a session (`IssueSession`) when memberships exist.
- `cmd/main.go` wires `AEAD`, `IPRateLimiter`, `OAuth Config`/`StateStore`. New env: `OAUTH_REDIRECT_URL` (default `http://localhost:3000/oauth/callback`).
- All `go build`/`vet`/`test` green across identity + shared + proto modules.

### 2026-05-16 — Sprint 2 / Service 2: billing ✓ DONE
- **Schema** (`services/billing/migrations/00001_initial_schema.sql`):
  - `subscriptions` (unique per tenant_id) — Stripe sub id + plan + status + current_period_end + cancel_at_period_end.
  - `success_fee_invoices` — 18% detention recovery invoices keyed by `stripe_invoice_id`.
  - `stripe_events` — webhook dedup table (event_id PK).
  - `stripe_customers` — Stripe customer ↔ tenant_id mapping (unique on tenant_id).
- **Stripe client** (`internal/stripeapi/client.go`) — wraps `stripe-go/v82`: `CreateCustomer` (stamps `metadata.tenant_id`), `CreateSubscription` (VETTING_BASE, `payment_behavior=default_incomplete`, automatic-tax on, `latest_invoice.confirmation_secret` expanded for client-side confirm), `CancelSubscription` (immediate or at-period-end), `PortalURL`, `CreateOneOffInvoice` (invoice-item → invoice → finalize → `hosted_invoice_url`).
- **Usecases** (`internal/usecase/`):
  - `UpsertCustomer` — lookup-then-create, persists `stripe_customers` mapping. Idempotent on tenant_id.
  - `CreateSubscription` / `CancelSubscription` — Stripe call + `UpsertSubscription` / `UpdateSubscriptionStatus`. Pulls period end from `Items.Data[0].CurrentPeriodEnd` (v82 moved it off the top-level Subscription).
  - `PortalURL` — generates a Customer Portal session URL.
  - `CreateSuccessFeeInvoice` — applies 18% on `recovered_amount_cents` (≥1 minimum-charge guard), creates Stripe invoice, persists local row. Tests pin the math.
  - `ConstructEvent` + `ProcessEvent` — verify Stripe signature, claim event_id (replay → `ErrEventReplay`), dispatch to `handleSubscriptionEvent` / `handleInvoicePaid` / `handleInvoiceFailed`, mark processed.
- **Handler** (`internal/handler/billing.go`) — implements `protov1connect.BillingHandler` for all 6 RPCs. `HandleStripeWebhook` (Connect RPC) returns `CodeUnimplemented` with a pointer to the real endpoint; raw webhook deliveries hit `POST /v1/billing/stripe/webhook` (`StripeWebhookHTTP`), which reads up to 1 MiB body, verifies signature, dispatches, returns 200 on success/replay or 500 (Stripe retries).
- **Main** (`cmd/main.go`) — pgxpool, `stripeapi.New`, `NewBillingHandler` mounted on chi, webhook route, `/v1/billing/info`. New envs: `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_VETTING_PRICE_ID`.
- `cmd/migrate` — goose runner mirroring the identity service.
- All `go build`/`vet`/`test` green.

### 2026-05-16 — Sprint 2 / Service 3: notifier ✓ DONE
- **Schema** (`services/notifier/migrations/00001_initial_schema.sql`):
  - `messages` — every send attempt, `idempotency_key` UNIQUE (dedup), status enum (sent/bounced/complained/dropped/failed), provider_msg_id for webhook back-references.
  - `suppressions` — hard-bounced / complained recipients short-circuit future sends to `dropped`.
- **Postmark client** (`internal/postmark/client.go`) — dependency-free POST to `https://api.postmarkapp.com/email`, 15s timeout, returns MessageID. One file = one provider seam (SES/Resend swap is a single-file change).
- **Templates** (`internal/templates/templates.go`) — 5 templates rendered inline via `text/template`+`html/template`. Required-vars validation up front. Tests cover happy-path, missing-var, unknown-template, subject interpolation.
- **Usecase** (`internal/usecase/usecase.go`):
  - `SendEmail` — dedup lookup → suppression check → template render → Postmark dispatch → persist row in every branch. Picked Postgres over Redis for dedup: same window we need for the audit row.
  - `RecordSuppression` / `MarkProviderStatus` — called from the Postmark webhook.
- **Handler** (`internal/handler/notifier.go`) — `protov1connect.NotifierHandler` (`SendEmail` wired; `SendSMS` returns `Unimplemented` — Twilio lands in Phase 2 when dispatchers need SMS). `PostmarkWebhookHTTP` parses Bounce / SpamComplaint / Delivery events.
- **Main** (`cmd/main.go`) — pgxpool, Postmark client, Connect handler mount, webhook route. New envs: `DATABASE_URL`, `POSTMARK_SERVER_TOKEN`, `POSTMARK_FROM_ADDRESS` (default `VettGuard <noreply@vettguard.com>`).
- `cmd/migrate` mirrors identity/billing.
- All `go build`/`vet`/`test` green.

### 2026-05-16 — Sprint 2 / Service 4: audit ✓ DONE
- **Schema** (`migrations/00001_initial_schema.sql`) — `audit_events` parent RANGE-partitioned on `occurred_at`. DO block (goose NO TRANSACTION) creates 14 monthly partitions named `audit_events_YYYY_MM` (prev month + next 12 + buffer). Indexes on (tenant_id, occurred_at desc), (actor_id, occurred_at desc), (action, occurred_at desc).
- **sqlc** — `schema.sql` is a flat clone of the parent table (sqlc can't parse PARTITION BY); production migration is the partitioned one. Queries: `AppendAuditEvent` (uses `COALESCE($11, now())` so callers can backfill `occurred_at` or let the server stamp), `QueryAuditEvents` with sqlc.narg filters + LIMIT/OFFSET.
- **Handler** (`internal/handler/audit.go`) — implements `protov1connect.AuditHandler`. Validates `actor_type`+`action`; pgtype.UUID/Text/Timestamptz adapters convert proto strings/timestamps. Pagination: cursor-encoded offset (`ts@offset`) — keyset migration deferred until row counts justify it.
- **Main** (`cmd/main.go`) — pgxpool + Connect handler mount. New env: `DATABASE_URL`. Port 8084.
- `cmd/migrate` mirrors others.
- All `go build` / `vet` clean.

**MinIO archive landed same day:** `services/audit/cmd/archive` — gzip JSONL stream via io.Pipe (memory-flat), object-key `audit/YYYY/MM.jsonl.gz`, idempotent, k8s-CronJob-shaped. Envs: `MINIO_ENDPOINT` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` / `MINIO_AUDIT_BUCKET` / `MINIO_SECURE`. Operator still configures bucket-level object-lock retention on the MinIO Tenant.

### 2026-05-16 — Sprint 2 / Service 5: ai-gateway (Python) ✓ DONE
- **Anthropic wiring** was already in place (`anthropic_client.complete` — AsyncAnthropic + tenacity retries + ephemeral system caching). Added three things on top this turn:
  1. **`metrics.py`** — `prometheus-client` `CollectorRegistry`. Counters: `ai_gateway_requests_total{route,model,outcome}`, `ai_gateway_tokens_{input,output,cache_read,cache_creation}_total{tenant_id,model,route}`, `ai_gateway_budget_rejections_total{tenant_id}`. Histogram: `ai_gateway_request_latency_seconds{route,model}` with buckets 100ms→60s. Cardinality note: tenant_id label expected ≤a few thousand series (well under Prom's safe limit).
  2. **`budget.py`** — `TokenBudget` with `asyncio.Lock`-guarded per-tenant daily counters, UTC day rollover. `get_budget(daily_limit)` is the lazy-singleton. Sprint 2 = process-local; Redis port is a one-file swap.
  3. **`routes/metrics.py`** — `GET /metrics` exposes the registry. Wired into `main.py` alongside health/echo/classify.
  - Echo and classify routes now: pre-flight budget `check` (429 on overrun + budget counter + budget_rejections metric), run Claude, observe latency, charge `input + cache_read + cache_creation + output` tokens to the budget, record per-tenant token counters. Errors increment `outcome=error`; classify JSON-parse failures increment `outcome=parse_error`.
- **Evals** — `evals/promptfoo.yaml` with 5 golden cases: greeting round-trip + latency floor; harmful-request refusal judged by an independent `openai:gpt-4o-mini` rubric; strict no-quotes ACK regex; classify happy paths for rate_confirmation and lumper_receipt URL hints. `evals/README.md` documents the local run + CI plan.
- **Deps** — added `prometheus-client>=0.21.0` to `pyproject.toml`.
- Python syntax check on every new/modified file: clean.

### 2026-05-16 — Sprint 2 / Service 6: gateway ✓ DONE (Sprint 2 backend complete)
- **JWT verify** — `cmd/main.go` decodes `JWT_SIGNING_KEY` (32B seed or 64B private) and derives the matching Ed25519 public key for `shared/pkg/middleware/RequireAuth`. Public endpoints (health, `/openapi.json`, and the Identity SignUp/Login RPCs) sit outside the auth chain; everything else is behind it.
- **Rate limit** (`internal/ratelimit/`) — `Limiter.Middleware` runs two Redis `INCR`+`EXPIRE` pipelines (per-IP + per-tenant when a tenantctx is present), 100/min/key default, 1-minute fixed window. Fails OPEN with a logged warning on Redis errors so the platform survives a Redis hiccup. Client-IP extracted from `X-Forwarded-For` first hop → `CF-Connecting-IP` → `RemoteAddr`. 4 unit tests.
- **CORS** — `github.com/go-chi/cors` middleware. Origins from `CORS_ORIGINS` (CSV; default localhost dashboard+landing). Allows `Authorization`, `Content-Type`, `X-Request-ID`, `Connect-Protocol-Version`. Exposes `X-Request-ID` so the dashboard can correlate.
- **Connect-RPC fan-out** (`internal/proxy/`) — `httputil.ReverseProxy` per service-prefix: `/vettguard.v1.{Identity,Billing,Notifier,Audit,ELD}/*` + `/v1/ai/*`. Director propagates `X-Tenant-ID` / `X-User-ID` / `X-User-Role` to upstream services (internal services trust these because NetworkPolicy denies direct cluster ingress). Bad-gateway on upstream errors, logged with upstream URL.
- **OpenAPI 3.1** — `internal/openapi/`, hand-written doc served at `/openapi.json`. Init-time JSON validation panics fast if the embedded spec is malformed. Covers health + `/v1/ai/echo` + `/v1/ai/classify-document` (+ securitySchemes/bearerAuth pointing at the Ed25519 JWT). Connect-RPC services are intentionally cross-referenced to the proto package rather than duplicated.
- **Wiring** — public group (CORS only) + auth group (RequireAuth → rate limit → fan-out). Tracing setup as on every service. New envs: `REDIS_ADDR`, `REDIS_PASSWORD`, `CORS_ORIGINS`, `JWT_SIGNING_KEY` (already required).

**Sprint 2 backend status:** identity, billing, notifier, audit (+archive cmd), ai-gateway, gateway — all 6 services feature-complete per their Sprint 2 checkboxes. `go build`/`vet`/`test` green per module. ELD is intentionally untouched (Phase 2).

### 2026-05-16 — Sprint 3 / apps/landing first cut ✓
Ported the Anthropic Designer reference (`xz/project/landing.jsx` + `shared.jsx`) into `apps/landing`:
- **Tokens** — new `src/app/globals.css` mirrors reference `T` palette (orange #FF4D0D, inky text #0A0E14, Apple/Stripe neutrals) + `FF` stacks (Inter / Instrument Serif / JetBrains Mono via Google Fonts). Reference is single-theme light; dark variant deferred.
- **Atoms** — `src/components/landing/dsl.tsx` typed-port of `Btn` (primary/accent/secondary/ghost × sm/md/lg), `Pill` (primary/success/danger/warn/info/neutral/ai), `Card`, `Avatar`, `ScoreRing`, `Spark`, `Mark`, `SectionHead`, `Ic` (sparkle/bolt/check/arrowR/puzzle/clock/alert). Inline styles intentional — 1:1 with reference so design QA loop stays tight.
- **Hero** — two-column grid, italic accent headline ("copilot" in Instrument Serif), 1500ms-ticking recovered counter, full Chrome-window mockup: DAT tab + URL bar + 7 broker rows with risk-score chips (one highlighted danger) + right-rail extension panel (ScoreRing 41 + "Avoid this load" + 3 risk lines + dark AI hint + MTD recovered tile with sparkline + "Track for detention" CTA). Floating dark "Live · auto-recovered $X" badge.
- **Sections** — TrustBar (6 load-board names), Benefits (3 stat cards: 0.4s / 94% / 60s), ExtensionShowcase (3 product moments with their own visuals: inline chips / hover tooltip / claim timeline), HowItWorks (3 numbered steps), Pricing (Free $0 + Pro $199 inverse-dark card, both 18% success fee + explainer band), FooterCTA, 5-column Footer.
- **Wiring** — `app/[locale]/page.tsx` renders `<LandingNav />` then sections; pulled SiteHeader/SiteFooter out of the locale layout (the landing now owns its nav/footer). Existing SiteHeader/Hero/Features/Metrics/Pricing/Faq components left in place as graveyard for the dashboard app to draw from later (lint-clean).
- **i18n compat** — replaced the `import(\`@vettguard/i18n/messages/${locale}/...\`)` dynamic-import (broke Next 15's webpack resolver against our workspace `./messages/*.json` export) with a static-import `bundles` map keyed by `Locale`. All 6 locales still prerender as SSG.
- **theme-toggle fix** — pre-existing TS error in `@vettguard/ui` (`ViewTransitionDoc extends Document`) cleaned up so the workspace type-checks.
- **Verified** — `pnpm build` green (✓ Compiled successfully, 9/9 static pages, 5.46 kB route + 107 kB First Load JS). `curl -L /en` returns 272 KB HTML containing "copilot" (6), "Add to Chrome" (7), "18% success fee" (4), "BlueWave" (11), "Avoid this load" (1) — all sections rendered.

### 2026-05-16 — Sprint 3 / landing polish (waitlist + meta + sitemap) ✓
- **Waitlist** — `components/landing/waitlist-form.tsx` (client; email field + Btn, in-flight/ok/error states, success replaces form with a green confirmation pill, `aria-live="polite"`). `app/api/waitlist/route.ts` validates RFC-ish email, captures `email+role+locale`, forwards to `GATEWAY_URL/v1/landing/waitlist` when configured, otherwise logs to stderr; soft-fails on backend errors so the user never sees a dead form. Wired into FooterCTA above the existing primary buttons.
- **Metadata** — locale layout now exposes `generateMetadata`: per-locale `title`+`description` (EN/UZ/RU/ES/TR/UK), `metadataBase` = `https://vettguard.com`, `alternates.canonical` + `alternates.languages` (hreflang map for all 6 locales), `openGraph.url/type/siteName/locale`, `twitter.summary_large_image`. Explicit absolute `images: [{ url: siteOrigin + '/opengraph-image' }]` because file-based metadata routes at `[locale]` collide with `localePrefix:"as-needed"` — pinning to root keeps crawlers happy. `viewport` exports themeColor (light/dark).
- **OG image** — `app/opengraph-image.tsx` (root, edge runtime). Single English variant for now (per-locale OG returns when we either move to `localePrefix:"always"` or carve out a routing exception). 1200×630 PNG via @vercel/og: white-with-gradient hero card (Stripe-mesh, `backgroundImage` + `backgroundColor` separated because satori rejects shorthand+hex), 56 px orange chevron-shield mark, 84 px "The dispatcher's copilot." headline, sub-line, footer "vettguard.com · Add to Chrome — free". Verified renders: `curl /opengraph-image → 200, image/png, 1200×630, 519 KB`.
- **Favicon** — `app/icon.tsx` (root). 64×64 PNG of the chevron-shield. Replaces `/favicon.ico` + `/apple-touch-icon.png` static assets — `<link rel="icon" />` is auto-injected. Verified `200 image/png 998 B`.
- **sitemap** — `app/sitemap.ts` (`MetadataRoute.Sitemap`). One entry per locale, weekly cadence, en=1.0/others=0.9, every entry carries `alternates.languages` so search engines see the full hreflang graph in one document.
- **robots** — `app/robots.ts`: `User-Agent:*` Allow `/` + Disallow `/api/`, Sitemap pointer to absolute URL, host set.
- **Middleware** — extended next-intl matcher to exclude `opengraph-image`, `icon`, `sitemap.xml`, `robots.txt` so the file-based metadata routes don't get the locale-prefix-rewrite treatment.
- **i18n exports** — `packages/i18n/package.json` updated to `./messages/*.json` pattern; landing's `src/i18n/request.ts` switched to static imports (`bundles` map) because Next 15's webpack resolver fights the dynamic-import template literal.
- **Verified** — `pnpm build` ✓ (13 prerendered pages, +5 metadata routes registered); curl smokes: `/robots.txt` ✓, `/sitemap.xml` ✓ with hreflang xhtml:link tags ✓, `/icon` ✓ (64×64 PNG), `/opengraph-image` ✓ (1200×630 PNG, 520 KB), `POST /api/waitlist {email:"smoke@vettguard.com"}` → `{ok:true}` ✓, invalid email → `{error:"invalid email"}` (HTTP 400) ✓, `/uz` head contains localized Uzbek description + `og:locale=uz` + correct og:title ✓.

### 2026-05-16 — Sprint 3 / landing: theme + i18n + analytics + a11y ✓
- **CSS-variable palette + dark theme** — `globals.css` defines `--vg-*` light/dark tokens (surface/text/border/glass/chrome-tabs/chrome-url) + invariant brand orange + primary-button always-inverse pair. `dsl.tsx` `T` rewritten to `var(--vg-*)` strings so every inline style auto-flips when `[data-theme]` swaps. Hero's chrome-window/glass-nav and the Pro pricing card's intentionally-always-dark surfaces both addressed correctly.
- **Theme switcher with boom view-transition** — `theme-provider.tsx` (next-themes `attribute="data-theme"`), `theme-toggle.tsx` (sun/moon icon, calls `document.startViewTransition` with `--vg-x` / `--vg-y` set to the button centre; CSS `@keyframes vg-theme-reveal` clips a circle from 0% → 150%). Reduced-motion + non-View-Transitions browsers fall back to instant swap.
- **Locale switcher** — `locale-switcher.tsx` (inline-styled `<select>` with custom chevron, screen-reader label, in-place segment replacement so /uz/pricing stays at /uz/pricing). Dropped into LandingNav alongside ThemeToggle.
- **Full multilang** — wrote a single canonical EN `landing.json` covering nav/hero/demo/trustBar/benefits/showcase (3 visuals)/howItWorks/pricing (free+pro 5+7 features matrix)/explainer/fleet/footerCta/footer (4 columns × 5 links)/waitlist. UZ founder-quality translation; RU/ES/TR/UK draft-quality (`_status: draft` flag, marked for native-speaker review in Phase 4). All sections rewritten to `useTranslations`; arrays read via `t.raw()`. Brand-data (DAT, BlueWave, Atlas Freight, etc.) intentionally kept verbatim across locales as proper nouns.
- **i18n loader fix** — `request.ts` widened `Bundle` type to `unknown` and cast at the boundary; AbstractIntlMessages' string-index typing rejects nested arrays which `steps`/`features` need.
- **a11y baseline** — `:focus-visible` orange rings, `aria-label`s on ThemeToggle / LocaleSwitcher / waitlist email, `aria-live="polite"` on the success state, `<nav aria-label="Primary">`, `<footer>`. axe-core CI hook is a Phase 4 ops task.
- **Plausible** — root layout injects `<script defer data-domain src=plausible.io/js/script.js>` only when `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set; `NEXT_PUBLIC_PLAUSIBLE_SRC` overrides for self-hosted. Dev is intentionally analytics-free.
- **Smoke** — `pnpm build` ✓ (13 prerendered pages, 6 locales SSG, +5 file-based routes), `pnpm start` + curl per locale:
  - `og:locale` per page: en/uz/ru/es/tr/uk ✓
  - localized `<h1>`: "The dispatcher's" / "Dispetcherning" / "Помощник" / "El" / "Dispeçerin" / "Помічник" ✓
  - ThemeToggle (`aria-label="Toggle theme"`) + LocaleSwitcher (`<select aria-label="Language">`) present in nav ✓
  - Uzbek nav: `Kengaytma`, `Narxlar`, `Navbatga yozilish` ✓
  - Plausible script: absent without env, expected ✓
  - All H1 / surface colors render `color: var(--vg-text)` / `background: var(--vg-bg)` → theme-toggle is now a single attribute flip ✓

### 2026-05-16 — Sprint 3 / footer pages + blog + admin editor ✓
- **15 footer stub pages** — shared `StubPage` / `LegalStub` (LandingNav + hero block + placeholder + LandingFooter, last-updated date). Routes: `/changelog`, `/about`, `/careers`, `/press`, `/guide`, `/help`, `/docs/api`, `/security`, `/legal/{terms,privacy,dpa,soc2,subprocessors}`. Each prerendered across all 6 locales — no more 404 from any footer link.
- **Blog reading** — file-based markdown (`apps/landing/content/blog/*.md`) loaded via `gray-matter`. `/blog` list page (2-col card grid with cover + meta + summary) + `/blog/[slug]` post (react-markdown + remark-gfm + rehype-raw + inline `proseComponents` themed via `T` tokens, per-post OG metadata: publishedTime/authors/cover). `generateStaticParams` + `revalidate: 60`. Seeded with 2 sample posts.
- **Blog link** in LandingNav + footer Resources column across all 6 locales (`Blog` / `Блог` variants in landing.json, mapped in `links.ts`).
- **Admin blog editor** (`apps/admin`):
  - **Auth** — env `ADMIN_TOKEN` (default `dev-admin-token` in dev) + `vg_admin` HttpOnly cookie set by `/login` server action; middleware gates `/blog/*` + write APIs (401 for API, 302 → `/login?next=…` for pages). Phase 4 swap: Google Workspace OIDC against identity service.
  - **List** — `/blog` shows all posts with date/author/slug, draft badge, preview link to landing localhost:3000, edit link, "New post" CTA, log out.
  - **Editor** — `/blog/new` and `/blog/edit/[slug]`. Metadata grid (title/slug/date/author/summary/tags/cover/draft) + split-pane markdown textarea ↔ live react-markdown preview using the same prose components as the public post page. **Image upload via Insert-image button, drag-drop into the textarea, AND clipboard paste** — uploads POST `/api/upload`, the returned `/uploads/<file>` URL is inserted as `![](url)` at the caret. Cover-image button uploads + populates the cover field. Save POSTs JSON to `/api/posts` which slugifies the title when slug is empty and writes the markdown file via `lib/posts-fs.ts`. Delete button removes the `.md`.
  - **API routes** — `POST /api/posts` (create/upsert; validates `^[a-z0-9-]+$` slug + YYYY-MM-DD date), `DELETE /api/posts/[slug]`, `POST /api/upload` (multipart/form-data, 8 MB cap, allow-list of image MIME types, timestamped sanitised filename → `apps/landing/public/uploads/`), `POST /api/auth/logout` (clears cookie).
  - **Cross-app FS** — admin writes directly into landing's content + public dirs via a relative `process.cwd() → ../../apps/landing` path. Dev-quality only; the file is documented as the single seam to swap for Postgres + MinIO in Phase 4.
- **Verified** — `pnpm --filter @vettguard/landing build` ✓ (15 stub pages × 6 locales + 2 blog posts × 6 locales all prerendered). `pnpm --filter @vettguard/admin build` ✓ (5 dynamic routes + 4 API routes).

**Next step (Sprint 3, remaining):** Lighthouse formal pass on staging (founder action, Chrome devtools/PageSpeed). Then `apps/dashboard` real OAuth+email login UI (wire to identity Connect-RPC), 2FA setup wizard, billing portal link, tenant settings, notification center; then `apps/extension`. Plus the deferred backend hardening: identity JWKS endpoint, testcontainer-backed handler integration tests, real-Postgres docker-compose flow for local QA.
