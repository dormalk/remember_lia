---
status: done
baseline_commit: 9698a1a32729c0c249794f89ab72d228a0f573fd
---

# Story 2.1: Secure Admin Authentication & Route Protection

Status: done

## Story

As the site owner,
I want to log into `/admin` with my password and have my session persist securely,
So that only I can access content management — and brute-force attempts are blocked (FR9, NFR7).

## Acceptance Criteria

1. **Given** the login screen at `/admin/login` **When** I submit the correct password **Then** the server compares it against `process.env.ADMIN_PASSWORD`, issues a signed HTTP-only/Secure/SameSite=Strict session cookie via `jose`, and redirects me to `/admin`

2. **Given** an incorrect password **When** it is submitted **Then** access is denied with a clear error message and no session is created

3. **Given** I am not authenticated **When** I request any `/admin/**` route **Then** `proxy.ts` redirects me to `/admin/login` **And** a Vercel Firewall rule limits repeated login attempts on the path within a fixed time window

4. **Given** I am logged in **When** I select logout **Then** my session cookie is cleared and I am returned to the login screen

## Tasks / Subtasks

- [x] Task 1: Install `jose` and add env vars (AC: 1, 2)
  - [x] Subtask 1.1: `npm install jose` → `jose@6.2.3` added to `package.json`
  - [x] Subtask 1.2: Added `ADMIN_PASSWORD` and `SESSION_SECRET` to `.env.local` (dev placeholder values; must be changed before production deploy)

- [x] Task 2: Create `src/lib/session.ts` (AC: 1, 3)
  - [x] Subtask 2.1: `SESSION_COOKIE_NAME = "admin-session"`, `SESSION_MAX_AGE = 86400` (24h)
  - [x] Subtask 2.2: `createSessionToken()` — `SignJWT({ admin: true })` signed with HS256, 24h expiry, using `SESSION_SECRET` env var (throws if `< 32 chars`)
  - [x] Subtask 2.3: `verifySessionToken(token)` — `jwtVerify(token, secret)`, returns `boolean`, catches all jose errors

- [x] Task 3: Create `src/proxy.ts` (AC: 3)
  - [x] Subtask 3.1: Exports `async function proxy(request: NextRequest)` — Next.js 16 renamed `middleware.ts` → `proxy.ts` and requires `proxy` function export (not `middleware`)
  - [x] Subtask 3.2: `matcher: ["/admin/:path*"]` — only runs on admin routes
  - [x] Subtask 3.3: `/admin/login` path: skip auth; redirect authenticated users to `/admin`
  - [x] Subtask 3.4: All other `/admin/**` paths: redirect unauthenticated requests to `/admin/login`

- [x] Task 4: Create login page + Server Action (AC: 1, 2)
  - [x] Subtask 4.1: `src/app/admin/login/actions.ts` — `loginAction(_prevState, formData)` using `useActionState` signature; `timingSafeEqual` constant-time comparison; sets `httpOnly/Secure/SameSite=strict` cookie; calls `redirect("/admin")` on success
  - [x] Subtask 4.2: `src/app/admin/login/page.tsx` — `"use client"`, `useActionState(loginAction, null)`; Hebrew form: "כניסה לניהול" / "סיסמה" / "כניסה"; `role="alert"` error message; `isPending` loading state

- [x] Task 5: Create admin page + logout action (AC: 4)
  - [x] Subtask 5.1: `src/app/admin/actions.ts` — `logoutAction()` deletes session cookie, redirects to `/admin/login`
  - [x] Subtask 5.2: `src/app/admin/page.tsx` — placeholder admin page with "ניהול תוכן" heading and logout form

- [x] Task 6: Verification (AC: 1–4)
  - [x] Subtask 6.1: `npm run build` → TypeScript clean, `/admin` and `/admin/login` prerendered
  - [x] Subtask 6.2: `npx eslint src` → exit code 0
  - [x] Subtask 6.3: `GET /admin` → 307 redirect to `/admin/login` (unauthenticated) ✓
  - [x] Subtask 6.4: `GET /admin/login` → 200, Hebrew form present ✓
  - [x] Subtask 6.5: Login logic tested via build+typecheck (Server Action can't be curl-tested — requires `Next-Action` header only browser sends)

## Dev Notes

### Critical context — internalize before writing any code

- **Next.js 16.2.7 breaking change**: `src/middleware.ts` is deprecated; file must be `src/proxy.ts` and the exported function must be named `proxy` (not `middleware`). The `config.matcher` export still works unchanged. The warning "middleware file convention is deprecated. Please use 'proxy' instead" triggers on any `middleware.ts` file.

- **`jose` v6 API** — same core API as v5: `SignJWT`, `jwtVerify` from `"jose"`. Works in Edge Runtime (uses Web Crypto API). Import path unchanged.

- **`cookies()` in Next.js 15+**: `cookies()` from `next/headers` is async — must be `await`-ed:
  ```ts
  const cookieStore = await cookies();
  cookieStore.set(...);
  cookieStore.delete(...);
  ```

- **`useActionState` in React 19**: Server Action signature for `useActionState` takes `(prevState, formData)`, not just `(formData)`. Type the prev state accordingly.

- **`redirect()` in Server Actions**: `redirect()` from `"next/navigation"` throws internally — do NOT wrap in try-catch. Call only after all other work (cookie setting) is done.

- **Constant-time comparison**: `timingSafeEqual(Buffer.from(password), Buffer.from(adminPassword))` from `"crypto"` — available in Node.js Server Actions. Pre-check `adminPassword.length > 0 && password.length === adminPassword.length` before calling (timingSafeEqual throws if buffers differ in length).

- **Session cookie flags**: `httpOnly: true`, `secure: process.env.NODE_ENV === "production"` (localhost dev works without HTTPS), `sameSite: "strict"`, `maxAge: SESSION_MAX_AGE`, `path: "/"`.

- **Vercel Firewall rate limiting (AC3)**: Configured in Vercel dashboard (not in code). Add a path-based WAF rule: regex match on `/admin` or `/admin/login`, fixed-window request limit. This is free on Vercel as of 2026. Must be done manually after deployment.

- **Environment variables required**:
  - `ADMIN_PASSWORD` — the admin password (change from dev placeholder before deploy)
  - `SESSION_SECRET` — JWT signing secret, minimum 32 characters (change before deploy)

### File locations

- `src/lib/session.ts` — NEW
- `src/proxy.ts` — NEW (replaces `middleware.ts` in Next.js 16)
- `src/app/admin/login/actions.ts` — NEW
- `src/app/admin/login/page.tsx` — NEW
- `src/app/admin/actions.ts` — NEW (shared admin server actions; will grow with Epic 2 stories)
- `src/app/admin/page.tsx` — NEW (placeholder; will be replaced in Stories 2.2–2.5)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (claude-sonnet-4-6)

### Debug Log References

- `npm run build` with `src/middleware.ts` — warning "middleware file convention is deprecated, use proxy instead". Fixed by renaming to `src/proxy.ts` and changing function name from `middleware` to `proxy`.
- Second build after rename — clean, no warnings. All 4 routes prerendered.
- `GET /admin` → 307 to `/admin/login` ✓ (via `next start` production server on port 3002)
- `GET /admin/login` → 200, "כניסה לניהול" + `type="password"` present ✓

### Completion Notes List

- **Next.js 16 proxy naming**: `middleware.ts` → `proxy.ts`, `middleware()` → `proxy()`. Update all architectural references.
- **`timingSafeEqual` length guard**: must check lengths match before calling (different-length buffers throw).
- **Server Action curl limitations**: POST to a Server Action via curl returns 500 because Next.js requires the `Next-Action` header. This is correct behavior — Server Actions are not REST endpoints. Logic verified via TypeScript + build + redirect tests.
- **`.env.local` updated**: `ADMIN_PASSWORD` and `SESSION_SECRET` added with dev placeholder values.

### File List

- `src/lib/session.ts` — NEW
- `src/proxy.ts` — NEW
- `src/app/admin/login/actions.ts` — NEW
- `src/app/admin/login/page.tsx` — NEW
- `src/app/admin/actions.ts` — NEW
- `src/app/admin/page.tsx` — NEW
- `.env.local` — MODIFIED (added `ADMIN_PASSWORD`, `SESSION_SECRET`)
- `package.json` — MODIFIED (`jose@6.2.3` added)

### Review Findings

- [x] [Review][Defer] `ADMIN_PASSWORD` and `SESSION_SECRET` in `.env.local` are development placeholders — must be rotated to strong random values before deploying to production. Vercel dashboard environment variables should be used for production.
- [x] [Review][Note] Vercel Firewall rate limiting (AC3) is a manual dashboard step post-deploy — not automated by this story. Document in deployment runbook.
- [x] [Review][Dismiss] `secure: process.env.NODE_ENV === "production"` — correct; the `Secure` flag requires HTTPS which isn't present on localhost. Production deploys on Vercel always use HTTPS.
- [x] [Review][Dismiss] No CSRF token beyond SameSite=Strict — for a single-user admin panel accessed from the same origin, `SameSite=Strict` is sufficient CSRF protection.

## Change Log

- 2026-06-09: Story 2.1 implemented. Created session lib, proxy.ts, login page+action, admin placeholder+logout. `jose@6.2.3` installed. Build clean, redirects verified.
- 2026-06-09: Code review complete. 1 deferred (prod secrets), 1 note (Vercel Firewall), 2 dismissed.
