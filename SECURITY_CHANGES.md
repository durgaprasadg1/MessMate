# MessMate: security changes

This document describes everything that was changed to implement the two security
reports (backend + frontend), what you must do by hand before deploying, and what
was deliberately **not** done.

> The UI design (colours, layout, components) is unchanged. The only new UI is
> the second login step (authenticator code), the password strength meter on the
> signup / reset forms, and the two-step-verification card on the admin / owner
> profile page; all of them reuse the existing orange/stone styling.

---

## 1. Do this before you deploy (manual steps)

1. **Run the SQL migration** `supabase/migrations/001_security_hardening.sql` in the
   Supabase SQL editor. It enables Row Level Security on all 11 tables (the app uses
   the service-role key, which bypasses RLS, so nothing breaks) and adds the MFA
   columns. It is idempotent. *Check the dashboard afterwards: I cannot see your live DB.*
   If a unique-email index fails, you have duplicate e-mails; fix those rows first.
2. **Set environment variables** (see `.env.example`). New or important ones:
   `NEXTAUTH_SECRET` (>= 32 chars, otherwise production refuses to start),
   `NEXTAUTH_URL` (must be `https://` in production), `RAZORPAY_WEBHOOK_SECRET`,
   `MFA_ENCRYPTION_KEY`, `LOG_LEVEL`. `ALLOWED_ORIGINS` is optional.
3. **Rotate secrets if the app was ever public**: `NEXTAUTH_SECRET`, Supabase
   service-role key, Razorpay, Cloudinary and the Gmail app password. Because the open
   `create-admin` endpoint and unauthenticated routes existed, check the `admin` table
   for accounts you did not create and look at who was blocked / verified.
4. **Create your first admin** with `npm run seed:admin` (needs `ADMIN_EMAIL`,
   `ADMIN_PASSWORD`, and the Supabase variables). Then log in and switch on two-step
   verification from your profile page.
5. **Razorpay dashboard**: add a webhook pointing to
   `https://<your-domain>/api/webhooks/razorpay`, events `payment.captured` and
   `payment.failed`, and put the same secret into `RAZORPAY_WEBHOOK_SECRET`. Without
   the secret the endpoint rejects everything (fails closed).
6. **Smoke test certificates**: certificates are now private Cloudinary assets and
   are shown to admins/owners through signed URLs. Upload one test certificate and open
   it from the pending-verification screen. Old certificates (public URLs) keep working.
7. **Test the CSP** (`next.config.ts`) in staging: open the browser console and make a
   test payment. If a legitimate third-party resource is blocked, add its host there.
8. Run `npm ci && npm test && npm run build` once locally, push, and confirm the
   GitHub Actions run is green.

---

## 2. Backend report: aspect by aspect

| # | Aspect | Was | Now |
|---|--------|-----|-----|
| 1 | SQL injection | Pass | Still parameterised (Supabase builder). Every `:id` is validated as a UUID before any query; dead `mess/near` route deleted. |
| 2 | XSS | Partial | All e-mail templates escape every dynamic value (`lib/server/mail/templates`), `javascript:` URLs blocked; text inputs are trimmed + length capped by zod; CSP header added. |
| 3 | CSRF | Partial | `createRoute` checks `Origin`/`Referer` on every POST/PUT/PATCH/DELETE and requires `application/json` bodies; cookies are `Secure` when `NEXTAUTH_URL` is https. |
| 4 | File uploads | Fail | Server-side: 2 MB cap, magic-byte sniffing (JPEG/PNG/WebP/PDF), allow-list, declared type must match content, random file names, certificates uploaded as private (`authenticated`) assets, upload rate limit, rejected uploads audited. |
| 5 | BOLA / IDOR | Fail | All 18 unauthenticated handlers now require a session **and** ownership/role. Profile routes are self-or-admin; mess routes check `mess.owner_id`; registrations/orders must belong to the mess in the URL (closes cross-mess IDOR); notifications are filtered by recipient inside the query. No more `select("*")`; responses are built from DTO allow-lists so password hashes can never be returned. |
| 6 | Rate limiting | Fail | Redis limiter (falls back to in-memory if Redis is down): login 5/15 min per IP+e-mail (+30/15 min per IP), forgot-password 3/h, signup 10/h, reset 10/h, payments, uploads, MFA, admin mail actions, default per-user limit on every mutating route. Returns 429 + `Retry-After`. |
| 7 | JWT secret | Partial | Secret strength and https checked at start (`assertSecureConfig`), session lifetime 8 h (`SESSION_MAX_AGE_SECONDS`), unused `jsonwebtoken` removed; admin role is re-verified against the DB on every admin request. |
| 8 | API secrets | Pass | Unchanged; unused browser Supabase helpers (`lib/client.js`, `server.js`, `middleware.js`) and `@supabase/ssr` removed; the Supabase client is created lazily. |
| 9 | Password hashing | Partial | bcrypt cost 12 (old hashes are upgraded on next login), server-side policy (12+ chars, upper, lower, special, common-password deny list), reset tokens stored as SHA-256 hashes, forgot-password answers identically for known/unknown e-mails, login does constant-time work for unknown accounts. |
| 10 | MFA | Fail | TOTP (RFC 6238, no third-party service) for admin and owner: secret encrypted with AES-256-GCM, 8 single-use recovery codes (stored hashed), QR enrolment, second step on the login form. It is **opt-in per account** so nobody is locked out on deploy. |
| 11 | CORS / sockets | Partial | Socket.IO now authenticates with the NextAuth cookie at the handshake (wrong origin / no session = rejected), rooms are derived server-side; client `join` events are ignored. No localhost fallback in production. |
| 12 | Tokens in localStorage | Pass | Still none (a test guards this). |
| 13 | Server-side permissions | Fail | `createRoute` + guards (`requireAdmin`, `requireOwner`, `requireConsumer`, `requireSelf`, `requireMessOwner`) on every handler. A static test fails the build if a handler is not wrapped. `proxy.ts` now guards `/admin`, `/owner`, `/consumer` and owner-only mess pages. |
| 14 | RLS | Fail | Migration enables RLS on all tables (see step 1 above). |
| 15 | Webhooks | Partial | Checkout signature compared with `timingSafeEqual`; new `/api/webhooks/razorpay` (raw body, HMAC, constant-time, idempotent by event id, fails closed). Order/registration "paid" transitions are idempotent. |
| 16 | SSRF / host header | Partial | Reset links and server-side base URL come from `NEXTAUTH_URL` only. |
| 17 | Source maps | Pass | Explicitly disabled; CI fails if `.map` files appear in `.next/static`. |
| 18 | Default credentials | Fail | `/secret/register-admin` page deleted; `POST /api/create-admin` now needs an admin session; first admin via `npm run seed:admin`. |
| 19 | Sensitive data in logs | Partial | One structured logger with redaction (passwords, tokens, signatures, Aadhaar, UPI, e-mails masked); clients get generic errors with a `requestId`; lint rule forbids `console.*` in server code. |
| 20 | Dependencies | Partial | `npm audit` now reports **0 vulnerabilities** for production dependencies (Next 16.4.6, next-auth 4.24.15, zod, ws, nodemailer 10 ...). Dependabot enabled. Dockerfile fixed (Node 22, non-root, copies `server.js`/`lib`/`next.config.ts`, health check). |

### Bugs from the report, fixed
- Block feature: `isBlocked` vs `is_blocked`; blocked users can no longer book, pay, review or register, and the block e-mail / "Blocked/Unblocked" message are no longer inverted.
- Forgot-password link ended in `/undefined` (now a hashed token + correct link); the reset GET no longer needs a login.
- Owner socket room never joined (rooms are now assigned by the server).

---

## 3. Frontend report: aspect by aspect

| # | Aspect | What changed |
|---|--------|--------------|
| 2 XSS | `rel="noopener noreferrer"` on every `_blank` link and `window.open(...,'noopener,noreferrer')`; map links built from `Number()`-validated coordinates; banner/certificate links only if `https`; CSP added. |
| 3 CSRF | New `lib/apiFetch.js` (drop-in for `fetch`, same-origin credentials, JSON header, central 429 and 401 handling). All 62 client-side calls use it. |
| 4 Uploads | `lib/clientUploadChecks.js`: size (2 MB), extension and MIME check with an error toast before upload (server is the real gate). |
| 5 BOLA | `proxy.ts` forces `/consumer/<id>` and owner-id pages to match the signed-in user; profile page takes the id from `useSession()`, not the URL. |
| 6 Rate limiting UX | 429 shows "try again in N s"; forms already disable while loading; search is client-side so no debounce needed. |
| 9 Password UX | 12-character minimum shared with the server (`lib/passwordRules.js`), strength meter, `autocomplete` hints, paste allowed. |
| 10 MFA | Authenticator-code step on login, enrolment card with QR + recovery codes on the admin/owner profile. |
| 11 Sockets | Client no longer emits `join` / `join-mess`; connects with the session cookie. |
| 13 Route guard | `proxy.ts` matcher extended to `/admin`, `/owner`, `/consumer`, owner-only `/mess/<id>/...` pages and `/mess/pending-verification`; UUID params validated centrally (404 otherwise); login now reads `getSession()` before redirecting. |
| 15 Payments | UI already marks "paid" only after the server confirms the signature; the webhook now covers closed tabs. |
| 17 Source maps | Disabled and checked in CI. |
| 18 Secret page | `app/secret/` deleted. |
| 19 Logs | `compiler.removeConsole` (keeps `console.error`) in production; data-dumping `console.log` calls removed; raw server messages are no longer sent to the browser. |
| "Remove backend code from the frontend" | The admin "all messes" page used to re-map raw database column names (`owner_name`, `image_url` ...). The API now returns the right shape (`/api/admin/messes`) and that code is gone. Unused server helpers in `lib/` were deleted. |

---

## 4. Architecture (SOLID)

```
app/api/**/route.js        thin handlers: createRoute({ auth, rateLimit, body }, handler)
lib/server/
  config/env.js            validated configuration (single place that reads process.env)
  errors/httpErrors.js     typed errors -> safe JSON
  http/apiHandler.js       cross-cutting pipeline: request-id, CSRF, rate limit, auth, params, body, errors
  http/origin.js           CSRF origin check
  auth/                    authOptions, guards (requireAdmin ...), password + reset-token + MFA services
  security/                rate limiter (+stores), upload validator, escaping, safe compare
  repositories/            data access with explicit columns + DTO mappers (no select("*"))
  services/                payment, pricing, membership rules, Cloudinary, MFA enrollment
  mail/                    Mailer interface + escaped templates
  logging/                 logger, redaction, audit events
  cache/cacheKeys.js       server-derived Redis keys
```

| Principle | Where |
|-----------|-------|
| **S**ingle responsibility | Handlers only hold business logic; auth, CSRF, limits, validation, logging, mail, hashing each live in their own module. |
| **O**pen/closed | New concerns plug into `createRoute` options (e.g. `rateLimit`, `body`, `auth`) and new log sinks implement `write()`; no handler edits needed. |
| **L**iskov | Rate-limit stores (`Memory`, `Redis`) and the three account repositories are interchangeable behind the same interface. |
| **I**nterface segregation | Tiny interfaces: `Mailer.send`, `Logger sink.write`, `RateLimitStore.hit`, `PaymentGateway.createOrder`. |
| **D**ependency inversion | Routes depend on `getMailer()`, `getRateLimiter()`, `getPaymentGateway()`, `getPasswordService()` (all replaceable with `set...()` in tests), not on nodemailer / Redis / Razorpay / bcrypt directly. |

---

## 5. Logging

* `lib/server/logging/logger.js`: JSON lines in production, readable lines in development, silent in tests. Levels via `LOG_LEVEL`.
* Redaction is automatic (keys like `password`, `token`, `signature`, `adhar`, `upi`, `cookie`; e-mail addresses are masked).
* Every API request logs `route, method, status, ms, requestId, ip, actorId`. The same `requestId` is returned to the client (`x-request-id`) so you can find an error from a user report.
* Security events are written on the `audit` channel (`channel: "audit"`): login success/failure/lockout, signup, admin creation, password reset, MFA, access denied, CSRF blocked, rate limited, upload rejected, block/verify/deny/delete, payments, webhooks (list in `lib/server/logging/audit.js`).
* Logs go to stdout. Ship them with your platform (Vercel log drains, Docker/Loki, CloudWatch ...).

---

## 6. Tests and CI

* `npm test` (Vitest, ~210 tests, runs in ~10 s, needs no database):
  * unit tests: escaping, redaction, password policy, reset tokens, TOTP (RFC 6238 vectors), rate limiter, upload validator, CSRF origin check, config checks, DTOs, e-mail templates, payment signatures, sockets;
  * **authorization tests that call the real route handlers**: anonymous / consumer / owner / foreign-owner / admin matrix for admin-only, profile, mess, registration, notification and MFA endpoints; login flows; password reset; signup; webhook; the route guard (`proxy.ts`);
  * **static guards**: every API handler must be wrapped in `createRoute`, no public mutating route except auth/webhook, no `select("*")`, no raw `console.*` in server code, no Host-header links, no `app/secret`, no `localStorage`.
* `.github/workflows/ci.yml` runs on every push and pull request: lint -> typecheck -> tests -> production build (+ source-map check) -> `npm audit` -> Docker build. `.github/dependabot.yml` keeps dependencies and actions updated.

---

## 7. Left out on purpose (needs a third-party service or a decision from you)

| Item | Why it was left | What to do |
|------|-----------------|-----------|
| CAPTCHA (Cloudflare Turnstile / reCAPTCHA) on login, signup, forgot-password | New third-party integration. Server-side rate limiting is already in place. | Pick a provider; add its widget to `LoginComponent`, `SignupComponent`, forgot-password and verify the token in `createRoute` (`auth`/`rateLimit` hook). |
| Consumer MFA / e-mail OTP | Optional in the report; MFA is offered to admin + owner. | Reuse `mfaService` or send an OTP with the existing mailer. |
| Forcing MFA for every admin/owner | Would lock out existing accounts on deploy. | After everyone has enrolled, reject login of admin/owner accounts without `mfa_enabled` in `authorizeCredentials`. |
| Log shipping / alerting (Datadog, Sentry, Logtail ...) | Third-party. | Implement a `Sink` (`write(entry)`) and pass it to `Logger`. |
| Secret scanning (gitleaks) in CI | Needs enabling in your GitHub settings. | Turn on GitHub secret scanning + push protection (free for public repos). |
| One toast library (sonner + react-toastify) | Merging would change toast colours/animations on the new-customer page, which breaks the "no design change" rule. | Migrate `app/mess/[id]/new-customer/page.jsx` to react-toastify when you accept the visual change. |
| Real Razorpay refunds | "Refund" currently only marks the order (as before); no refund API call exists in the project. | Call Razorpay's refund API from the order action route. |
| Redis shared across instances for rate limits | Without Redis, limits are per instance. | Provide `REDIS_URL` in production. |

---

## 8. Behaviour changes you should know about

* Sessions last 8 hours (was 30 days); everyone has to log in again after the deploy.
* New passwords need 12+ characters (signup, reset). Existing users can still log in with their old password (it is upgraded to bcrypt cost 12 on their next login).
* Reset links sent before the deploy stop working (tokens are now hashed).
* The public mess endpoints no longer return e-mail, UPI, Aadhaar hash or certificate; reviews expose only the reviewer's display name.
* `GET /api/keepalive` returns `{ "ok": true }` (it used to dump the mess list and polluted the public cache).
* Admin and owner lists now return the shape the UI expects (`_id`, `isBlocked`, ...), so the admin user table, block button and review delete work.
* An e-mail can only exist once across admin / owner / consumer (login looks them up in that order).
* Closed or blocked messes cannot be booked, even by calling the API directly.
* Cancelling an order now works (it used to crash on an undefined property); owners get notified.
* Owner analytics now sums real plates and revenue (it read the wrong column names).
* Failed mail delivery is logged and no longer aborts the request that triggered it.
* Orders list / registrations / analytics are visible to the owner of that mess only.

## 9. Things noticed but not changed

* `lib/socket.js` runs in `server.js` while route handlers are bundled by Next.js, so `emitToUser` from a route may use a different module instance and never reach live sockets (notifications still work via the database and polling). Fixing it needs a shared process-level singleton or a Redis adapter.
* `app/consumer/[consumerid]/delete` is a placeholder page with no delete logic.
* `lib/db.sql` is a reference snapshot; the migration file is the source of truth for the security columns.
* 86 ESLint warnings remain in legacy UI code (unused variables, React-compiler style hints). They are warnings only; no errors.
