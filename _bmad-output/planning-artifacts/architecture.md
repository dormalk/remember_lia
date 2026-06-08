---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - 'docs/PRD-memorial-campaign-page.md'
workflowType: 'architecture'
project_name: 'JusticForLia'
user_name: 'Dorma'
date: '2026-06-08'
lastStep: 8
status: 'complete'
completedAt: '2026-06-08'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The PRD defines a fixed-order, single-page memorial/awareness site composed of 6 ordered components — Logo, Image Slider/Carousel, Rich Text section, Article Reference Links, Community/Social Links (WhatsApp + Instagram + Facebook), and Help/Contact Info — plus a parallel Admin Panel (`/admin`) capable of editing the content of every one of those 6 components (text, images, links) without changing their order. Editable content must remain manageable *after* launch, including gradual population from an initially-empty state.

**Non-Functional Requirements:**
- **Mobile-first as the dominant constraint** — primary entry point is QR-code scanning from public stickers, so nearly all traffic is mobile. This shapes every design and technical decision (load speed, tap targets, image sizing, layout).
- **Performance on weak cellular networks** — image optimization and lazy loading are required, not optional.
- **Accessibility** — pause controls for the auto-advancing slider, alt text, screen-reader support, adequate contrast.
- **Hebrew / RTL** as a first-class layout requirement across all components.
- **Security** — HTTPS, server-side admin authentication via an environment-variable password (not hardcoded in source), sanitization of rich-text/user-entered content, and rate-limiting on the admin login.
- **Deployment target is fixed: Vercel** — this is itself an architectural constraint (see below).

**Scale & Complexity:**
- Primary domain: full-stack web (mostly-static public page + a lightweight authenticated admin/CMS layer)
- Complexity level: **low–medium** — the public page is structurally simple (one page, fixed order, six components), but the admin/content-management layer introduces real complexity: rich-text editing with icons/advanced formatting, image upload/management, and — critically — **persistent content storage in a serverless/edge hosting environment**.
- Estimated architectural components: ~4–6 (public rendering layer, content data layer/storage, image storage & delivery, admin UI, admin auth/API layer, rich-text editor integration)

### Technical Constraints & Dependencies

- **Hosting is pre-decided: Vercel.** Vercel functions/edge runtimes are stateless and ephemeral — files written at runtime (uploaded images, edited text) do **not** persist across requests or deployments. Since FR 5.4 explicitly requires content to be entered and changed *after* launch via `/admin`, the architecture **must** include an external persistence layer (e.g., a managed database for structured content and/or object storage for images) rather than relying on the local filesystem or build-time content.
- **Single admin user, single hardcoded password sourced from an environment variable**, validated server-side — no user/role management, no auth provider needed.
- **No backend dependencies exist yet** — this is a greenfield build; framework, data layer, image storage, and rich-text editor are all open decisions ahead of us.

### Cross-Cutting Concerns Identified

- **Mobile-first responsiveness** — touches every one of the 6 public components and the admin UI.
- **Hebrew/RTL layout** — affects layout direction, slider navigation/animation direction, icon alignment, and admin editor configuration.
- **Content persistence strategy** — affects the public rendering layer, the admin save flow, and image handling simultaneously; this is the single most consequential architectural decision given the Vercel constraint.
- **Image handling** (upload, storage, optimization, responsive delivery) — spans the logo, the slider, and the admin upload UX.
- **Admin security** (server-side env-var auth, session handling, rate limiting, input sanitization) — spans the admin panel and the public-facing rendered content.
- **Graceful empty/default states** — required across all 6 components to support gradual post-launch content population without the page ever looking broken to a visitor who just scanned the QR code.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application — given the fixed Vercel deployment target, Next.js is the natural fit (it's the framework Vercel builds and optimizes the platform around).

### Starter Options Considered

1. **`create-next-app`** (official Next.js CLI, current version 16.2.x) — minimal, official scaffold with first-party Vercel integration.
2. **`create-t3-app`** (T3 Stack) — adds tRPC, an ORM (Prisma/Drizzle), and NextAuth. Overkill here: there's no multi-user model, no complex relational data, and authentication is a single hardcoded password compared against an environment variable — none of T3's heavier scaffolding is needed.
3. **Plain Vite + React SPA with a separate API** — would require building SSR, image optimization, and Vercel deployment configuration from scratch, duplicating what Next.js already provides natively.

### Selected Starter: `create-next-app` (Next.js 16.2.x)

**Rationale for Selection:**
- First-party Vercel framework — zero-config deployment.
- Built-in image optimization (`next/image`) directly addresses the PRD's top NFR: fast loading on weak cellular networks for mobile visitors arriving via QR scan.
- App Router with Server Components / Server Actions / Route Handlers lets us implement admin authentication (server-side comparison against the `ADMIN_PASSWORD` environment variable) and content-saving flows without standing up a separate backend service.
- Tailwind CSS ships by default — fast to build a mobile-first, RTL-aware UI (logical properties / `dir` support).
- TypeScript by default — type safety across the stack.
- Avoids the extra auth-provider, ORM, and multi-tenancy machinery that heavier starters (e.g., T3) bring but this project doesn't need.

**Initialization Command:**

```bash
npx create-next-app@latest justice-for-lia --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
TypeScript, React Server Components, Node.js runtime on Vercel.

**Styling Solution:**
Tailwind CSS — utility-first, mobile-first breakpoint system, supports RTL via logical properties and the `dir` attribute.

**Build Tooling:**
Turbopack for dev/build; deploys to Vercel with no additional configuration.

**Testing Framework:**
None included by default — to be decided separately if/when needed, given the project's modest scope.

**Code Organization:**
File-based routing under `src/app/`; Route Handlers for API endpoints (`src/app/api/.../route.ts`); Server Actions for admin content mutations.

**Development Experience:**
ESLint with Next.js-specific rules, Fast Refresh, and a generated `AGENTS.md` to guide AI coding agents continuing the build.

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Content & image persistence strategy: Vercel Blob (single external storage service)
- Admin authentication: server-side comparison against `ADMIN_PASSWORD` env var + signed session cookie
- Public page rendering & caching strategy (ISR + on-demand revalidation)

**Important Decisions (Shape Architecture):**
- Content data shape (single JSON document mirroring the 6 fixed page sections)
- Rate limiting via Vercel Firewall (WAF) dashboard rules — no extra package/service
- Rich-text sanitization on save

**Deferred Decisions (Post-MVP):**
- Automated testing framework — project scope is modest; can be added later without restructuring
- Analytics / QR-scan tracking — explicitly out of scope per PRD §9, revisit later if desired

### Data Architecture

**Storage: Vercel Blob (single service for everything)**
- Images (logo, slider photos) stored as blobs; Vercel returns CDN-backed URLs directly usable in `next/image`.
- All editable site content (logo metadata, slider items + captions, rich-text story, article links, social links, contact info) stored as **one JSON document** (`content.json`) in the same Blob store, written with a **stable pathname** (`addRandomSuffix: false`) and **overwrite enabled** (`allowOverwrite: true`) — so the app always knows exactly where to fetch the latest version, with no separate "pointer" database needed.
- This avoids introducing a database or cache service (e.g., Redis/Postgres) purely to hold a handful of small, infrequently-changed content fields — one external dependency instead of two.

**Data Modeling Approach:**
A single versioned JSON document mirrors the PRD's fixed 6-section structure:
```json
{
  "version": 1,
  "logo": { "imageUrl": "...", "title": "..." },
  "slider": [{ "imageUrl": "...", "caption": "..." }],
  "story": { "html": "<p>...</p>" },
  "articles": [{ "title": "...", "source": "...", "url": "..." }],
  "social": { "whatsapp": "...", "instagram": "...", "facebook": "..." },
  "contact": { "name": "...", "phone": "...", "email": "...", "notes": "..." }
}
```

**Validation Strategy:** Zod schema matching this shape, validated server-side before every write (rejects malformed admin submissions before they reach storage).

**Migration Approach:** Not applicable in the traditional sense (no relational schema). Future structural changes are handled via the `version` field plus default-filling logic in code — old documents are upgraded in memory when read.

**Caching Strategy:** Next.js Incremental Static Regeneration (ISR) for the public page; admin saves trigger `revalidatePath`/`revalidateTag` so visitors see updates immediately without a full redeploy.

### Authentication & Security

- **Authentication:** Single hardcoded password sourced from `process.env.ADMIN_PASSWORD`, compared server-side inside a Route Handler — never exposed to the client bundle (per PRD §5.1).
- **Session Handling:** Signed/encrypted session cookie (HTTP-only, Secure, SameSite=Strict) — e.g., using the `jose` library to issue a short-lived signed token on successful login.
- **Authorization:** Not applicable — single role, single user.
- **Route Protection:** Next.js Middleware checks the session cookie for every request under `/admin/**` and redirects unauthenticated requests to the login screen.
- **Rate Limiting:** **Vercel Firewall (WAF)** dashboard rule — a path-based rule (regex match on `/admin` / the login endpoint) with a fixed-window request limit, configured directly in the Vercel project dashboard. No additional package or external service required (and WAF-mitigated traffic is free on Vercel as of the 2026-05-18 changelog).
- **Content Sanitization:** Rich-text HTML is sanitized server-side on save (e.g., via `sanitize-html`) before being persisted or rendered, preventing stored XSS through the admin's rich-text editor.

### API & Communication Patterns

- **API Design:** Next.js Route Handlers + Server Actions — no formal REST/GraphQL layer needed for a single-client (admin), single-server system.
- **Error Handling:** Consistent typed response shapes from Route Handlers/Server Actions; inline/toast error messaging in the admin UI.
- **Rate Limiting:** Handled at the platform/firewall level (see above) rather than in application code.
- **Service Communication:** Not applicable — single monolithic Next.js application.

### Frontend Architecture

- **State Management:** Minimal — most content is server-rendered (React Server Components); local client state (slider position, admin form state) handled with React's built-in `useState`/`useReducer`. No global state library needed.
- **Component Architecture:** One component per fixed PRD section (Logo, Slider, Story, Articles, Social Links, Contact), shared where practical between the public render and the admin's live preview.
- **Routing:** File-based App Router — `/` for the public memorial page, `/admin` for login + content management.
- **Performance Optimization:** `next/image` for automatic optimization/responsive delivery (directly serves the PRD's top NFR — fast loading on weak cellular connections), lazy-loaded slider images, optimized fonts.
- **Bundle Optimization:** Admin-only code (rich-text editor, upload UI, management forms) is code-split away from the public bundle so visitors who scan the QR code never download admin tooling.

### Infrastructure & Deployment

- **Hosting:** Vercel (fixed per PRD §7).
- **CI/CD:** Vercel's native Git integration — push to the main branch triggers an automatic production deployment; no separate pipeline configuration needed.
- **Environment Configuration:** `.env.local` for local development; Vercel Project Environment Variables for production (`ADMIN_PASSWORD`, session-signing secret, Blob store credentials — the latter auto-injected when the Blob integration is added).
- **Monitoring & Logging:** Vercel's built-in Logs and Web Analytics — sufficient at this scale; no external APM needed.
- **Scaling:** Not a practical concern — low expected traffic (QR-driven, public-awareness scale), and Vercel's serverless functions scale automatically.

### Decision Impact Analysis

**Implementation Sequence:**
1. Initialize the Next.js project (per the starter command in the previous section)
2. Add the Vercel Blob integration; define the `content.json` shape and Zod schema
3. Build the public page's 6 section components against the content schema, with graceful empty states
4. Implement admin authentication (login Route Handler, session cookie, Middleware route protection)
5. Configure the Vercel Firewall rate-limiting rule for the admin login path
6. Build the admin content-management UI (including the rich-text editor and image upload flow) wired to Server Actions that validate (Zod), sanitize, and persist to Blob
7. Wire `revalidatePath`/`revalidateTag` so public content updates immediately after each admin save

**Cross-Component Dependencies:**
- The content schema (Zod) is the contract shared by the public renderer, the admin forms, and the Blob persistence layer — changes to the PRD's 6 sections ripple through all three.
- Image handling (Blob uploads) is shared infrastructure used by both the Logo and Slider sections and the admin upload UX.
- Session/auth middleware gates every admin route and every content-mutating Server Action.
- The empty-state design (PRD §5.4) must be implemented consistently across all 6 section components since content arrives gradually post-launch.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 5 areas where AI agents could diverge and cause integration problems — content schema field naming, Server Action/Route Handler response shape, project organization (by feature vs. by type), the single-save-path rule for content mutations, and empty-state rendering.

### Naming Patterns

**Content JSON Field Naming:**
camelCase throughout the `content.json` document (`imageUrl`, `whatsapp`, `phoneNumber`) — matches TypeScript/Zod conventions exactly, so the JSON document, the Zod schema, and the React props all share one shape with zero transformation layers.

**API / Route Naming:**
- Route Handlers use singular, resource-style paths: `/api/admin/login`, `/api/admin/logout`, `/api/admin/content`, `/api/admin/upload` — singular because there is exactly **one** content document, not a collection.
- No `:id`/`{id}` route params anywhere in the admin API — there's nothing to address by ID.

**Code Naming:**
- Components: PascalCase, suffixed `Section` for each of the PRD's 6 fixed public sections — `LogoSection`, `SliderSection`, `StorySection`, `ArticlesSection`, `SocialLinksSection`, `ContactSection`. This 1:1 name-to-requirement mapping makes it immediately obvious to any agent which PRD requirement a component implements.
- Files: component files in PascalCase matching their export (`SliderSection.tsx`); utility/helper files in camelCase (`getContent.ts`, `uploadImage.ts`); Route Handler files follow Next.js's required `route.ts` convention inside named folders.
- Functions: verb-first camelCase (`getContent`, `saveContent`, `uploadImage`, `validateSession`).
- Variables: camelCase throughout (standard TS/React convention).

### Structure Patterns

**Project Organization (by feature, not by type):**
```
src/
  app/
    page.tsx                    → public memorial page
    admin/
      page.tsx                  → admin dashboard (protected)
      login/page.tsx            → login screen
      actions.ts                → Server Actions (saveContent, uploadImage, login, logout)
    api/
      admin/
        upload/route.ts         → image upload Route Handler
  components/
    sections/                   → public-facing PRD section components
      LogoSection.tsx
      SliderSection.tsx
      StorySection.tsx
      ArticlesSection.tsx
      SocialLinksSection.tsx
      ContactSection.tsx
    admin/                      → admin-only UI (editor forms, upload widgets)
  lib/
    content-schema.ts           → SINGLE source of truth: Zod schema + TS types
    blob.ts                     → Vercel Blob read/write wrappers
    auth.ts                     → session cookie creation/verification helpers
  middleware.ts                 → guards /admin/** routes
```

**Shared Schema Rule:**
The Zod schema in `src/lib/content-schema.ts` is the **only** place the content shape is defined. The public renderer, the admin forms, and the persistence layer all import from it — never redefine or duplicate field shapes elsewhere.

**Static Assets:**
`public/` holds only truly static, build-time assets (favicon, fonts, the admin's own UI icons). Editable content images **always** come from Vercel Blob — never from `public/` — since `public/` content can't be changed at runtime on Vercel.

### Format Patterns

**Server Action / Route Handler Response Shape:**
Every mutation returns a consistent discriminated union so agents never have to guess how to handle the result:
```ts
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

**Content Document Conventions:**
- All field names: camelCase (see Naming Patterns above)
- Missing/empty content represented as empty arrays (`[]`) or empty strings (`""`) per the Zod schema's defaults — **never `undefined`** (not valid JSON). Every section component renders a defined empty-state UI when its data is empty (per PRD §5.4).
- If dates are ever introduced (e.g., an optional article publish date), use ISO 8601 strings (`"2026-06-08"`) for consistency.

### Communication Patterns

**Single Save Path (the most important rule in this document):**
All content edits — regardless of which section they touch — flow through **one** Server Action, `saveContent(document)`, which: (1) validates the *entire* document against the Zod schema, (2) sanitizes any rich-text HTML, (3) writes the full `content.json` to Blob (overwriting the stable pathname), and (4) calls `revalidatePath('/')`. Agents must **never** create parallel per-section save endpoints — that would risk partial writes, race conditions, and an inconsistent document.

**Image Upload Flow (two-step, always in this order):**
1. Upload the file via the dedicated upload Route Handler → receive back a Blob URL.
2. Reference that URL inside the content document and persist via `saveContent`.
Agents must not conflate these steps or invent alternate upload pathways.

**Admin Form State:**
Controlled React components with explicit "dirty" tracking (so the admin always knows if there are unsaved changes before navigating away).

### Process Patterns

**Loading States:**
Every async admin action (login, save, upload) shows an explicit pending indicator via React's `useTransition`/`useFormStatus` — no silent waits, ever.

**Error Recovery:**
Failed saves/uploads display a retry-capable error message and **preserve the admin's in-progress edits** — never silently discard form state on failure.

**Authentication Flow:**
`POST /api/admin/login` → server compares submitted password to `process.env.ADMIN_PASSWORD` → on match, issues a signed session cookie (HTTP-only, Secure, SameSite=Strict) → redirect to `/admin`. `middleware.ts` checks that cookie on every `/admin/**` request and redirects unauthenticated requests to `/admin/login`. Logout clears the cookie.

**Validation Timing:**
Client-side validation provides immediate UX feedback; **server-side Zod validation is the final authority** — every Server Action re-validates regardless of what the client already checked, since the client can never be trusted.

### Enforcement Guidelines

**All AI Agents MUST:**
- Import content types/validation exclusively from `src/lib/content-schema.ts` — never redefine the content shape elsewhere
- Route every content mutation through the single `saveContent` Server Action
- Name the six public section components `<Name>Section`, matching the PRD's fixed component list 1:1
- Return the `ActionResult<T>` discriminated union from every Server Action / Route Handler
- Render an explicit, designed empty-state for each section whenever its data is empty (never leave a blank gap)

**Pattern Enforcement:**
- Code review (human or agent) checks new section components against the `<Name>Section` naming rule and the shared-schema import rule
- Any proposed deviation from the single-save-path rule must be discussed and reflected here before implementation
- This document is the canonical reference — when in doubt, an agent follows what's written here over assumptions from general best practices

### Pattern Examples

**Good:**
```ts
// lib/content-schema.ts — single source of truth
export const contactSchema = z.object({
  name: z.string().default(""),
  phone: z.string().default(""),
  email: z.string().default(""),
});
```
```ts
// admin/actions.ts
export async function saveContent(doc: unknown): Promise<ActionResult<ContentDocument>> {
  const parsed = contentSchema.safeParse(doc);
  if (!parsed.success) return { success: false, error: "Invalid content" };
  await writeContentToBlob(parsed.data);
  revalidatePath("/");
  return { success: true, data: parsed.data };
}
```

**Anti-Patterns (avoid):**
- ❌ A second, separate `saveSliderImages()` Server Action that writes only part of the document (breaks the single-save-path rule and risks an inconsistent `content.json`)
- ❌ Defining `interface ContactInfo { Phone: string }` by hand inside a component instead of importing the shared Zod-derived type
- ❌ Returning `undefined` for an empty slider instead of `[]`, or skipping the empty-state UI "because there's nothing to show yet"

## Project Structure & Boundaries

### Complete Project Directory Structure

```
justice-for-lia/
├── README.md
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.local                              → local secrets (gitignored)
├── .env.example                            → documents required env vars (no real values)
├── .gitignore
├── eslint.config.mjs
├── AGENTS.md                               → generated by create-next-app; guides AI agents
├── public/
│   ├── favicon.ico
│   └── fonts/                              → only build-time static assets live here
└── src/
    ├── middleware.ts                       → guards every /admin/** request (PRD §5.1)
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx                      → sets <html dir="rtl" lang="he">, fonts, metadata
    │   ├── page.tsx                        → PUBLIC memorial page — renders the 6 sections
    │   │                                      in fixed PRD §3 order; only place that calls getContent()
    │   ├── admin/
    │   │   ├── layout.tsx                  → protected shell (re-checks session server-side)
    │   │   ├── page.tsx                    → admin dashboard / content editor (PRD §5.2)
    │   │   ├── login/
    │   │   │   └── page.tsx                → login screen (PRD §5.1)
    │   │   └── actions.ts                  → Server Actions: login, logout, saveContent, uploadImage
    │   └── api/
    │       └── admin/
    │           └── upload/
    │               └── route.ts            → image upload Route Handler → Vercel Blob
    ├── components/
    │   ├── sections/                       → PUBLIC components, 1:1 with PRD §4 (presentation-only)
    │   │   ├── LogoSection.tsx             → PRD §4.1
    │   │   ├── SliderSection.tsx           → PRD §4.2 (auto-advance + manual nav + pause control)
    │   │   ├── StorySection.tsx            → PRD §4.3 (renders sanitized rich-text HTML)
    │   │   ├── ArticlesSection.tsx         → PRD §4.4
    │   │   ├── SocialLinksSection.tsx      → PRD §4.5 (WhatsApp/Instagram/Facebook)
    │   │   └── ContactSection.tsx          → PRD §4.6 (tel:/mailto: links)
    │   ├── admin/                          → ADMIN-ONLY UI (code-split from public bundle)
    │   │   ├── ContentEditorForm.tsx       → orchestrates all section editors + single save action
    │   │   ├── LogoEditor.tsx
    │   │   ├── SliderEditor.tsx
    │   │   ├── RichTextEditor.tsx          → Tiptap-based editor wrapper (icons/emoji/advanced formatting)
    │   │   ├── ArticlesEditor.tsx
    │   │   ├── SocialLinksEditor.tsx
    │   │   ├── ContactEditor.tsx
    │   │   ├── ImageUploadField.tsx        → wraps the two-step upload flow
    │   │   └── LoginForm.tsx
    │   └── ui/                             → small shared primitives: Button, Spinner, EmptyState, Icon
    └── lib/
        ├── content-schema.ts               → ⭐ SINGLE SOURCE OF TRUTH: Zod schema + derived TS types
        ├── content-store.ts                → getContent()/saveContent(): validates, fills defaults,
        │                                       reads/writes content.json via blob.ts, triggers revalidation
        ├── blob.ts                         → ONLY module importing @vercel/blob directly
        ├── auth.ts                         → session cookie sign/verify (jose), password check
        └── sanitize.ts                     → rich-text HTML sanitization wrapper (sanitize-html)
```

> **Note on tests:** Per the Core Decisions, an automated testing framework is deferred (post-MVP, modest project scope). If/when introduced, co-locate `*.test.tsx` next to the component it covers, or mirror `src/` under `tests/` — to be decided at that time without restructuring anything above.

### Architectural Boundaries

**API Boundaries:**
- **Public surface:** `GET /` — a Server Component that calls `getContent()` (cached/revalidated) and renders the six sections in fixed order. No public API endpoints exist beyond the page itself.
- **Admin surface** (every entry point sits behind the session-cookie check in `middleware.ts`):
  - `POST /api/admin/upload` — Route Handler; accepts an image, uploads to Blob, returns `{ url }`
  - Server Actions in `app/admin/actions.ts`: `login(password)`, `logout()`, `saveContent(document)`
- **External boundary:** Vercel Blob via the `@vercel/blob` SDK — the *only* third-party service this project talks to.

**Component Boundaries:**
- `components/sections/*` are **presentation-only** — they receive validated, typed content as props and render; they never fetch or mutate data themselves.
- `app/page.tsx` is the **single data-fetching entry point** for the public page — the only place `getContent()` is called, guaranteeing the six sections always render from one consistent snapshot.
- `components/admin/*` manage local form/UI state but funnel **all** persistence through `saveContent` — they never call Blob or `content-store` directly.
- `middleware.ts` is the **sole gatekeeper** for `/admin/**`; individual admin pages/components must not re-implement their own auth checks (though `admin/layout.tsx` re-validates server-side as defense-in-depth).

**Data Boundaries:**
- `lib/content-schema.ts` defines the canonical content shape — imported everywhere (public render, admin forms, persistence), redefined nowhere.
- `lib/content-store.ts` is the **only** module that reads/writes the logical `content.json` document — it wraps `lib/blob.ts`, validates with the shared schema on both read (filling defaults for missing/older-version fields) and write, and is the only place allowed to call `revalidatePath`/`revalidateTag`.
- `lib/blob.ts` is the **only** module that imports `@vercel/blob` directly — every other file accesses storage exclusively through `content-store`.

### Requirements to Structure Mapping

**PRD Section → Code Mapping:**
- **§3 (fixed component order)** → enforced in exactly one place: the literal rendering order inside `app/page.tsx`
- **§4.1–4.6 (the six components)** → one file each under `components/sections/`, named to match (`LogoSection.tsx` … `ContactSection.tsx`)
- **§5 (admin panel)** → `app/admin/**`, `components/admin/**`, `app/admin/actions.ts`
- **§5.1 (auth via env-var password)** → `lib/auth.ts` + `middleware.ts` + `login`/`logout` actions + `app/admin/login/page.tsx`
- **§5.4 (gradual content population / empty states)** → schema defaults in `content-schema.ts` + a designed empty-state in every `*Section.tsx`
- **§6 (mobile-first, performance, RTL, accessibility)** → cross-cutting: `app/layout.tsx` sets `dir="rtl" lang="he"`; Tailwind's mobile-first breakpoints; `next/image` used inside `LogoSection`/`SliderSection`
- **§7 (Vercel deployment)** → root config files + `.env.example`; no extra deployment configuration needed thanks to Vercel's native Git integration

**Cross-Cutting Concerns:**
- **Image handling** → `lib/blob.ts` (storage) + `ImageUploadField.tsx` (admin UX) + `next/image` (public delivery)
- **Security** → `lib/auth.ts` + `middleware.ts` + `lib/sanitize.ts` + the Vercel Firewall rule (configured in the dashboard, not in code)

### Integration Points

**Internal Communication:**
`page.tsx` → `getContent()` → six section components (one-directional, read-only data flow). Admin: form → `saveContent` Server Action → schema validation → sanitization → `content-store.write()` → Blob overwrite → `revalidatePath('/')`.

**External Integrations:**
Vercel Blob only (`@vercel/blob` SDK) — no auth providers, no databases, no analytics services (per Core Decisions and PRD §9 Out of Scope).

**Data Flow:**
1. Visitor scans QR → `GET /` → `getContent()` (cached) → six sections render in fixed order, each gracefully handling empty data.
2. Admin logs in → edits content → `saveContent` validates the *entire* document, sanitizes rich text, overwrites `content.json` in Blob, revalidates the public path → next visitor immediately sees the update.

### File Organization Patterns

**Configuration Files:** All at project root, following `create-next-app` conventions (`next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `eslint.config.mjs`); `.env.example` documents every required environment variable (`ADMIN_PASSWORD`, session-signing secret, Blob token) without real values.

**Source Organization:** By feature (`sections/`, `admin/`) rather than by type — keeps each PRD requirement's UI, logic, and tests (when added) discoverable in one place.

**Test Organization:** Deferred — see note in the directory tree above.

**Asset Organization:** Build-time static assets only in `public/`; all editable/runtime content (images, text, links) lives in Vercel Blob and is never written to the filesystem.

### Development Workflow Integration

**Development Server:** `next dev` (Turbopack) — single command, hot-reloads both the public page and the admin UI.

**Build Process:** `next build` — produces the optimized production bundle; admin code is automatically code-split from the public bundle via route-based splitting (App Router default).

**Deployment Structure:** Push to the main branch → Vercel's native Git integration builds and deploys automatically; environment variables (`ADMIN_PASSWORD`, session secret, Blob credentials) are configured once in the Vercel project dashboard — no custom CI/CD pipeline files needed.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices are mutually compatible with no conflicts. Choosing Vercel Blob as the *sole* external service (rather than Blob + Redis/KV) was a deliberate simplification — directly responding to user feedback — and it removes an entire class of cross-service consistency problems (e.g., a Blob write succeeding while a KV pointer-update fails). Next.js 16.2.x, Tailwind, Zod, Tiptap, `jose`, and `sanitize-html` form a coherent, well-trodden stack with no version-compatibility risk at this scope.

**Pattern Consistency:**
Implementation patterns directly support the architectural decisions: the "Single Save Path" rule (`saveContent`) is the natural consequence of storing all content as one `content.json` document — it's not an arbitrary convention but a direct safeguard against the one failure mode that single-document storage introduces (partial/conflicting writes). camelCase flows unbroken from the JSON document → Zod schema → TypeScript types → React props, eliminating an entire category of naming-mismatch bugs between agents.

**Structure Alignment:**
The project structure is a precise physical realization of the decisions: `lib/blob.ts` is the only module touching `@vercel/blob`, `lib/content-store.ts` is the only module allowed to call `revalidatePath`, and `lib/content-schema.ts` is the single source of truth imported everywhere. Each boundary stated in "Core Architectural Decisions" has a corresponding, named file in the directory tree — there are no decisions left structurally homeless.

### Requirements Coverage Validation ✅

**Epic/Feature Coverage:**
No formal epics exist for this project (single-page site, modest scope) — coverage was validated against the PRD's functional-requirement sections directly, which the architecture maps explicitly and exhaustively (see "Requirements to Structure Mapping").

**Functional Requirements Coverage:**
- §3 (fixed component order) → enforced in exactly one place, the literal render order in `app/page.tsx`
- §4.1–4.6 (the six public components) → one dedicated `<Name>Section` component each, named 1:1 with the requirement
- §5 (admin panel, all six sections editable) → `app/admin/**`, `components/admin/**`, single `saveContent` action covering the entire document
- §5.1 (env-var password auth) → `lib/auth.ts` + `middleware.ts` + login/logout actions, password never reaches the client bundle
- §5.4 (gradual post-launch population, empty states) → Zod schema defaults (`""`, `[]`) + a designed empty-state in every section component
- §7 (Vercel deployment) → native Git integration, environment variable plan, Blob auto-injected credentials

No functional requirement from the PRD is without a named architectural home.

**Non-Functional Requirements Coverage:**
- *Performance on weak mobile networks* → `next/image`, ISR + `revalidatePath`/`revalidateTag`, lazy-loaded slider images, code-split admin bundle, Turbopack
- *Security* → server-side `ADMIN_PASSWORD` comparison, signed HTTP-only/Secure/SameSite cookies (`jose`), Middleware route protection, `sanitize-html` on every rich-text save, Vercel Firewall (WAF) rate-limiting on `/admin`
- *Hebrew/RTL* → `<html dir="rtl" lang="he">` in `layout.tsx`, Tailwind logical properties, RTL-aware slider navigation
- *Scalability* → Vercel's serverless functions auto-scale; explicitly assessed as "not a practical concern" at this traffic profile
- *Accessibility* → see "Validation Issues Addressed" below — this NFR was named in the Project Context Analysis but needed an explicit implementation pattern, which has now been added

### Implementation Readiness Validation ✅

**Decision Completeness:**
All critical decisions (persistence strategy, authentication, rendering/caching) are documented with clear rationale, and the framework version (Next.js 16.2.x) is pinned. Secondary library versions were not yet pinned — this is addressed below in "Validation Issues Addressed" with a documented resolution rule rather than left open.

**Structure Completeness:**
The directory tree is complete and concrete — not a generic placeholder. Every file has a stated purpose, and most carry an inline PRD cross-reference (e.g., `SliderSection.tsx → PRD §4.2`), which makes the structure self-documenting for any agent that opens it.

**Pattern Completeness:**
All five conflict points identified in step 5 (naming, response shape, project organization, single-save-path, empty-state rendering) have a documented rule *and* a concrete good/anti-pattern code example — the highest-risk pattern (single save path) additionally has an explicit "agents must never…" guardrail.

### Gap Analysis Results

**Critical Gaps:** None. No missing architectural decision blocks the start of implementation; the seven-step implementation sequence in "Decision Impact Analysis" can be followed today without further architectural input.

**Important Gaps (identified and resolved during this validation — see below):**
1. Accessibility was named as an NFR and cross-cutting concern but had no corresponding implementation pattern, risking inconsistent handling across agents (e.g., one agent adding `alt` text, another skipping it).
2. Versions for the secondary libraries this architecture introduces (`@vercel/blob`, `zod`, Tiptap packages, `jose`, `sanitize-html`) were named but not pinned — a potential source of "which version did you mean?" drift between agents.

**Nice-to-Have Gaps (no action needed now):**
1. Open Graph / Twitter Card metadata in `layout.tsx` would help if the page URL is shared directly in WhatsApp/social posts beyond the QR-sticker channel — low-cost, can be added during `layout.tsx` implementation without any architectural change.
2. An optional `updatedAt` timestamp field in `content.json` would let the admin UI show "saved at HH:MM" — a pure content-schema addition, not a structural one.

### Validation Issues Addressed

**Issue 1 — Accessibility pattern (resolved):**
Added as an explicit, enforceable rule (extending "Frontend Architecture" / "Enforcement Guidelines"): every image rendered from content data (`logo.imageUrl`, `slider[].imageUrl`) **must** use its existing `caption`/`title` field as `alt` text — no schema change required, the field is already present. `SliderSection` **must** expose a visible pause/play control and respect the `prefers-reduced-motion` media query when auto-advancing. All interactive elements (slider navigation, article/social/contact links) **must** be keyboard-operable with visible focus states, and the chosen Tailwind color theme **must** meet WCAG AA contrast for body text and interactive elements. This closes the gap between the PRD's stated NFR and an enforceable agent-facing rule.

**Issue 2 — Secondary dependency versions (resolved):**
Documented rule: Next.js's version is pinned (16.2.x, per the starter command). The remaining libraries this architecture introduces — `@vercel/blob`, `zod`, `@tiptap/react` (+ extensions), `jose`, `sanitize-html` — will resolve to specific versions the moment they are installed during the **first implementation story** (project initialization). Whatever versions `npm install` locks into `package.json`/`package-lock.json` at that moment become canonical for the remainder of the build; agents must not upgrade or downgrade them later without updating this document. This removes any ambiguity about "which version" without artificially pre-pinning libraries that are better locked at install time.

### Architecture Completeness Checklist

**Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**

- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**

- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — every PRD requirement traces to a named file or pattern, the single highest-risk area (concurrent writes to one JSON document) has a dedicated enforced rule, and the two gaps surfaced during validation were minor enough to resolve inline rather than requiring redesign.

**Key Strengths:**
- A single external dependency (Vercel Blob) for both content and images — a direct simplification born from user feedback that rejected the original two-service design, leaving fewer moving parts, fewer failure modes, and lower operating cost
- The "Single Save Path" rule is a precise, minimal safeguard against the one structural risk that a single-JSON-document model introduces
- Exhaustive 1:1 traceability — every PRD section number appears next to the file that implements it, so any agent (or the user) can verify coverage at a glance
- Empty/default states are treated as first-class architecture, not an afterthought — directly serving the PRD's "content arrives gradually after launch" requirement
- Near-zero operational overhead (Vercel native CI/CD, auto-injected Blob credentials, dashboard-only Firewall rules) — appropriate for a single-admin, low-traffic awareness page

**Areas for Future Enhancement:**
- If the project ever grows beyond "one campaign page, one admin" (e.g., multiple memorial pages, multiple editors), the single-JSON-document model and single-password auth would need to be revisited in favor of a real database and role-based access
- Automated testing was deferred; if introduced later, the `saveContent` validation/sanitization path is the highest-value first test target, since it is the system's single point of content mutation
- QR-scan analytics, explicitly out of scope today, could be layered on later via Vercel Web Analytics with no architectural changes

### Implementation Handoff

**AI Agent Guidelines:**

- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions

**First Implementation Priority:**
Run the starter command —
```bash
npx create-next-app@latest justice-for-lia --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```
— then, before any UI work begins, define `src/lib/content-schema.ts` (the shared Zod schema). Every other component — public sections, admin forms, and the persistence layer — depends on this single source of truth, so it must exist first.
