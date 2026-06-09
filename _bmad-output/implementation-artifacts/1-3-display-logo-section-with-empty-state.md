---
baseline_commit: dc06bc6d3abef1ae91e66f696e0f222fc94e14fe
---

# Story 1.3: Display Logo Section with Empty State

Status: done

## Story

As a visitor who just scanned the QR code,
I want to immediately see the memorial page open with a centered logo at the top,
so that I recognize I've reached the right place (FR1, FR2, FR12).

## Acceptance Criteria

1. **Given** content with a populated logo **When** the page loads **Then** `LogoSection` renders the logo image centered at the top using `next/image`, with its `title` field used as the image's `alt` text
2. **Given** content where the logo image is empty **When** the page loads **Then** `LogoSection` renders a clean, designed empty-state placeholder instead of a broken image or blank gap **And** the logo area is sized and spaced for comfortable mobile viewing

## Tasks / Subtasks

- [x] Task 1: Build the shared `EmptyState` UI primitive (AC: 2)
  - [x] Subtask 1.1: Created `src/components/ui/EmptyState.tsx` — generic, presentation-only, props `{ message: string; icon?: ReactNode; className?: string }`. No section-specific copy baked in; `LogoSection` (and stories 1.4–1.8 later) supply their own message/icon through props, so the primitive stays reusable as planned in the architecture's `ui/` directory listing
  - [x] Subtask 1.2: Styled mobile-first: dashed rounded border, soft tinted background, centered icon + message, `text-foreground/70` on `bg-foreground/[0.03]` — derived from the existing `--foreground`/`--background` design tokens already wired in `globals.css` (≈12.6:1 contrast at full opacity, comfortably clears WCAG AA even at reduced opacity). Reads as an intentional "content coming soon" placeholder, not a broken-state error

- [x] Task 2: Build `LogoSection` (AC: 1, 2)
  - [x] Subtask 2.1: Created `src/components/sections/LogoSection.tsx`. Presentation-only — receives `{ logo: Logo }` (type imported from `@/lib/content-schema`, never redefined) and renders; contains zero data-fetching
  - [x] Subtask 2.2: Populated branch (`logo.imageUrl` non-empty): `next/image` with `fill` + `object-contain` inside a fixed-size centered container (so any uploaded aspect ratio displays without cropping/distortion), `alt={logo.title}` reusing the existing field verbatim (including when it's `""` — a captionless image legitimately gets an empty `alt`, which is valid a11y; inventing fallback text would have meant fabricating content not present in the document), `priority` since it's the largest above-the-fold element on first load (NFR2)
  - [x] Subtask 2.3: Empty branch (`logo.imageUrl === ""`): renders `<EmptyState message="הלוגו יתווסף בקרוב" icon={<LogoPlaceholderIcon />} />` — a small inline placeholder-photo SVG (not a new shared `Icon` component; that's a separate future primitive out of this story's scope) — never a broken `<img>`/empty-`src` `next/image`/blank gap
  - [x] Subtask 2.4: `<section>` wrapper gives both branches identical mobile-first spacing (`pt-12 sm:pt-16`, `px-6`, centered flex column, `gap-3`); image/empty-state both sit in a `h-28 w-28 sm:h-32 sm:w-32` area — deliberate generous top spacing since this is literally the first thing a visitor sees post-QR-scan. When `logo.title` is non-empty it renders visibly beside/below the logo too (FR2: "optional short title/caption beside it" — the field is dual-purpose: visible caption AND `alt` text, which is exactly why the architecture said reusing it needs "no schema change")

- [x] Task 3: Wire `getContent()` and `LogoSection` into the public page (AC: 1, 2)
  - [x] Subtask 3.1: Rewrote `src/app/page.tsx` as an `async function` Server Component calling `await getContent()` (the ONLY caller on the public page) and rendering `<LogoSection logo={content.logo} />` inside an RTL-correct `<main>` wrapper — fully replacing the `create-next-app` placeholder (dropped `next.svg`/`vercel.svg`/English template copy and the LTR-fighting `sm:items-start text-left` classes flagged in `deferred-work.md`)
  - [x] Subtask 3.2: Rendered only `LogoSection`; left an explanatory comment in `page.tsx` describing the fixed PRD §3 order so stories 1.4–1.8 know to append directly below it. Built no stub/placeholder components for the other five sections
  - [x] Subtask 3.3: `app/layout.tsx` untouched — confirmed via `git status` it shows no diff from this story's work; metadata stays `create-next-app` boilerplate, deferred to Story 1.9 per `deferred-work.md`
  - **Unplanned but required addition — `next.config.ts`**: added `images.remotePatterns` for `*.public.blob.vercel-storage.com` (https). `next/image` rejects unlisted remote hosts at runtime, and `logo.imageUrl` will be a Vercel Blob CDN URL in production — without this, the FIRST real upload would 400 at the image-optimizer level. Confirmed the exact hostname pattern by reading `@vercel/blob`'s own URL-construction source (`https://${storeId}.public.blob.vercel-storage.com/${pathname}`), not guessing

- [x] Task 4: Verify end-to-end (no automated test framework exists) (AC: 1, 2)
  - [x] Subtask 4.1: **Local-build blocker discovered and resolved with Dorma**: wiring `getContent()` into `page.tsx` made `npm run build` attempt to statically prerender `/`, which calls the real `@vercel/blob` `get()` — and no `BLOB_READ_WRITE_TOKEN` existed locally (confirmed: no `.env.local`/`.env.example`/`.vercel/`/shell env vars — the same account-bound gap Story 1.2 flagged, now actually blocking). This is correct, by-design behavior (Story 1.2 deliberately made `getContent` propagate auth errors rather than mask them). Per Dorma's choice, she provided a real `BLOB_READ_WRITE_TOKEN` from the Vercel dashboard; added it to a gitignored `.env.local` (verified `.gitignore` already covers `.env*`) — unblocks this and every future story's local build/dev verification. Then visually verified BOTH `LogoSection` branches on a 375px-equivalent mobile viewport via a fully-isolated, fully-deleted throwaway preview route (`src/app/dev-preview-temp/`, rendering `<LogoSection logo={...fixture} />` directly with a local `/next.svg` test image — zero changes to any shipped file, zero use of fabricated Blob data): (a) **populated** — `<img>` rendered centered via `next/image fill`+`object-contain`, `alt="לזכרה של ליה"` present in the DOM exactly matching the fixture's `title`, visible caption rendered below it; (b) **empty** (the connected store's actual current `content.json` state — schema defaults, `logo.imageUrl: ""`) — confirmed live at `/`: `EmptyState` renders the dashed-border placeholder with icon + "הלוגו יתווסף בקרוב", no broken image, no blank gap. Preview route fully removed afterward (`git status` shows no trace)
  - [x] Subtask 4.2: `npm run build` → compiled successfully, TypeScript clean, `/` prerendered as static content. `npx eslint src` → zero warnings/errors. Both gates green

### Review Findings

- [x] [Review][Defer] `logo.imageUrl` is untyped beyond `z.string()` — a malformed/non-Blob URL would make `next/image` throw at render [src/components/sections/LogoSection.tsx:34] — deferred: no code path exists today that can produce a non-empty `imageUrl` (the live `content.json` is still schema-default `""`, and the upload/save flow doesn't exist until Epic 2). The correct fix is to guarantee well-formed Blob CDN URLs at the write boundary in Epic 2's upload story, not to duplicate defensive validation into every presentation component that consumes already-"validated" content (would contradict the architecture's single-validation-boundary design, Story 1.2). Flagging for Epic 2's story author to add as an explicit acceptance criterion.
- [x] [Review][Defer] No runtime fallback if a populated `logo.imageUrl` 404s/fails to load — the browser shows its native broken-image icon, which conflicts with the architecture's "never a broken image" anti-pattern rule (distinct from AC2, which only covers the `imageUrl === ""` empty case) [src/components/sections/LogoSection.tsx:32-40] — deferred: closing this gap requires converting `LogoSection` (and, for consistency, all six `*Section` components) from a Server Component to a Client Component with `onError` state to swap to `EmptyState` on load failure — a cross-cutting architectural change affecting every section uniformly, not a one-off patch to this story. Better suited to a deliberate, scoped decision in Story 1.9 (polish pass) or a dedicated future cross-cutting story than an unplanned scope expansion here.

## Dev Notes

### Critical context — internalize before writing any code
- **This is the FIRST story that creates a UI/section component or touches `app/page.tsx`'s rendering.** No `components/` directory exists yet [verified: `src/` currently contains only `app/` and `lib/`]. You are establishing the patterns — `<Name>Section>` naming, the `EmptyState` primitive's visual language, and the `getContent()` → page → section data flow — that all of Stories 1.4–1.8 will directly copy. Get the shape right; sloppiness here multiplies five times over.
- **`app/page.tsx` is the single data-fetching entry point** [Source: architecture.md "Component Boundaries" L414, "API Boundaries" L406] — the only place `getContent()` is called on the public page, guaranteeing all sections render from one consistent snapshot. `LogoSection` itself is presentation-only: it receives typed props and renders, never fetches/mutates [L413].
- **Name it `LogoSection`, file `LogoSection.tsx`, in `src/components/sections/`** [Source: architecture.md "Naming Patterns" L203-216, "Complete Project Directory Structure" L373-380 — `LogoSection.tsx → PRD §4.1`]. This 1:1 `<Name>Section` naming is an explicit Enforcement Guideline [L301] checked in code review.
- **Build the shared `EmptyState` now, in `src/components/ui/`** — the architecture's directory plan already names it there alongside `Button`, `Spinner`, `Icon` as a shared primitive [Source: architecture.md L391: `ui/ → small shared primitives: Button, Spinner, EmptyState, Icon`]. FR12 requires EVERY section (this one and the five that follow) to render a designed empty state [Source: epics.md FR12 L40, architecture.md "Content Document Conventions" L266, "Enforcement Guidelines" L303]. Building it generically once — instead of bespoke empty-state markup per section — is exactly what the planned structure calls for, not scope creep.
- **The `alt` text rule is already decided — don't relitigate it**: "every image rendered from content data (`logo.imageUrl`, `slider[].imageUrl`) **must** use its existing `caption`/`title` field as `alt` text — no schema change required, the field is already present" [Source: architecture.md "Validation Issues Addressed — Issue 1" L529, also epics.md "Accessibility implementation rule" L70]. For the logo, that field is `title` (confirmed shape: `{ imageUrl: string, title: string }` in `src/lib/content-schema.ts:9-12`, both `.default("")`). Use `alt={logo.title}` directly — including when it's `""` (an empty `alt` is valid HTML/a11y for a captionless image; inventing fallback text would violate "no schema change required" by introducing content that isn't in the document).
- **Static images always come from Vercel Blob via the content document — never `public/`** [Source: architecture.md "Static Assets" L251-252]. `logo.imageUrl` will be a Blob CDN URL; pass it straight to `next/image`.

### Component contract (props, not fetching)
```ts
import type { Logo } from "@/lib/content-schema";

export function LogoSection({ logo }: { logo: Logo }) {
  // logo.imageUrl: string (default ""), logo.title: string (default "")
}
```
`Logo` is already exported from `src/lib/content-schema.ts:50` — import the type from there; never redefine or hand-roll an interface for it [Source: architecture.md "Enforcement Guidelines" L299, "Anti-Patterns" L334].

### `next/image` specifics for this story
- The codebase already imports `next/image` in the current `page.tsx` boilerplate (`import Image from "next/image"`) using the `width`/`height` form — follow that same explicit-dimensions pattern (or `fill` inside a sized, `position: relative` container) rather than mixing approaches. No exact pixel dimensions are specified anywhere in the PRD/architecture for the logo — choose values that read as "centered logo, comfortable mobile spacing" (the AC's own words) and document your chosen dimensions/rationale in Completion Notes so Story 1.9's mobile-performance pass has a documented baseline to verify against.
- `next/image` requires a configured remote pattern for external URLs (Vercel Blob serves images from `*.public.blob.vercel-storage.com`). Check `next.config.ts` — if `images.remotePatterns` isn't already configured for the Blob host, you'll need to add it, or `next/image` will reject the URL at runtime. This is foundational plumbing the FIRST image-rendering story must establish; later sections (slider, etc.) depend on it being correct here.
- Mark it `priority` (it's the largest above-the-fold content on first load — same treatment the boilerplate already gives its placeholder image) — this directly serves NFR2 (fast loading on weak cellular).

### Empty-state pattern — you are defining it for five future sections
FR12 / PRD §5.4: real content arrives gradually after launch, so the page must "look complete and trustworthy" even when sections are unpopulated [Source: epics.md Epic 1 summary L104, FR12 L40]. The architecture explicitly forbids a blank gap or broken image as the empty case [L266, L303, Anti-Patterns L335]. Keep `EmptyState`'s API generic (message + optional icon/styling hook) — Stories 1.4 (slider), 1.5 (story), 1.6 (articles), 1.7 (social), 1.8 (contact) will each pass their own contextual message through the same component. Resist the urge to hardcode "logo"-specific copy inside the shared primitive itself; that belongs in how `LogoSection` invokes it.

### File locations (this story creates the `components/` tree for the first time)
[Source: architecture.md "Complete Project Directory Structure" L373-391]
- `src/components/ui/EmptyState.tsx` — NEW
- `src/components/sections/LogoSection.tsx` — NEW
- `src/app/page.tsx` — MODIFIED (currently 100% `create-next-app` boilerplate — full replacement of the body, not an edit; see "current state" below)
- Do NOT touch: `src/app/layout.tsx` (metadata deferred to 1.9 per `deferred-work.md`), `src/lib/*` (read-only consumers of `content-schema`/`content-store` — this story doesn't change data shape or fetching logic, only adds a renderer)

### Current state of `app/page.tsx` (read it before changing it)
It is untouched `create-next-app` scaffolding: a client-oriented marketing layout with `Image` imports for `/next.svg`/`/vercel.svg` from `public/`, English copy, and `sm:items-start`/`text-left` classes that fight the `dir="rtl"` `<html>` set in `layout.tsx` (this exact LTR/RTL mismatch was flagged in `deferred-work.md` from Story 1.1's review, deferred until "the real sections... are built" — that's now). Replace the whole body: drop the `next.svg`/`vercel.svg`/template copy entirely, make it an `async function` Server Component that calls `await getContent()` and renders `<LogoSection logo={content.logo} />` inside an RTL-correct, mobile-first wrapper.

### Previous Story Intelligence (Story 1.2 — `done`)
[Source: 1-2-define-canonical-content-schema-and-safe-content-loading.md]
- `getContent()` is fully built, exported from `@/lib/content-store`, **never throws**, and always returns a complete `ContentDocument` (schema defaults fill every field, including `logo: { imageUrl: "", title: "" }` when nothing has been saved yet) — you can call it with full confidence it won't crash the page render.
- `Logo` type is exported from `@/lib/content-schema` as `{ imageUrl: string; title: string }`, both defaulting to `""`.
- **No live `BLOB_READ_WRITE_TOKEN`/Vercel session exists in this local environment** (Story 1.2 confirmed this by checking `.env.local`, `.env.example`, `.vercel/`, shell env, `npx vercel whoami`). You cannot fetch a real `content.json` locally. To see the populated-logo state, either (a) temporarily stub `getContent`'s return value the same restorable way Story 1.2 stubbed `readContentBlob` (back up, edit, verify, fully restore — zero throwaway code left behind), or (b) reason about both branches from `logo.imageUrl`'s emptiness and verify the empty-state branch directly (it's the actual default state of a fresh `content.json`-less deployment, so it's the *more* important one to get right visually).
- Final verification gate that worked well: `npm run build` + `npx eslint <path>` — zero warnings/errors, all routes static. Reuse it.
- Git: work lands on `master`; no special branching strategy.

### Testing standards
No automated test framework exists in this project — explicitly deferred post-MVP [Source: architecture.md "Core Decisions" / Story 1.2 precedent]. Do not introduce one. Verify manually per Task 4, on a mobile viewport, in both data states, then ensure zero throwaway/stub code remains before marking done.

### Project Structure Notes
- This story creates `src/components/` for the first time (currently absent — confirmed via directory listing). Both subdirectories (`sections/`, `ui/`) are named and justified directly by the architecture's own directory plan; no structural deviation.
- No conflicts detected between epics.md and architecture.md for this story — both agree on `LogoSection`, centered logo, `next/image`, and a designed empty state.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3: Display Logo Section with Empty State (L172-187)]
- [Source: _bmad-output/planning-artifacts/epics.md#FR1, FR2, FR12 (L18, L20, L40)]
- [Source: _bmad-output/planning-artifacts/epics.md#Accessibility implementation rule (L70)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns (L203-216)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure (L339-399, esp. L373-391)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries — Component/Data Boundaries (L412-421)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Static Assets (L251-252)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Content Document Conventions (L264-267)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines (L296-308) and Anti-Patterns (L332-335)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Validation Issues Addressed — Issue 1 accessibility/alt-text rule (L526-529)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Coverage — NFR2 performance via next/image (L497)]
- [Source: _bmad-output/implementation-artifacts/deferred-work.md#Placeholder page/metadata remain English & LTR-template]
- [Source: _bmad-output/implementation-artifacts/1-2-define-canonical-content-schema-and-safe-content-loading.md#Completion Notes List / File List]
- [Source: src/lib/content-schema.ts:9-12, 50 — `logoSchema`/`Logo` type]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (claude-sonnet-4-6)

### Debug Log References

- `src/app/dev-preview-temp/page.tsx` (throwaway, fully deleted) — rendered `<LogoSection logo={{ imageUrl: "/next.svg", title: "לזכרה של ליה" }} />` directly on an isolated route to visually verify the populated-logo branch on a 375px-equivalent mobile viewport without writing fixture data into the live, connected Blob store; removal confirmed via `git status --porcelain` showing zero trace
- `npm run build` — first run failed with `Error: Vercel Blob: No blob credentials found` (expected, by-design — see Completion Notes); after Dorma provided `BLOB_READ_WRITE_TOKEN` and it was added to a gitignored `.env.local`, re-run compiled successfully, TypeScript clean, `/` prerendered as static content
- `npx eslint src` — zero warnings/errors

### Completion Notes List

- **`EmptyState` built as a generic, reusable primitive** (`src/components/ui/EmptyState.tsx`) per the architecture's own `ui/` directory plan (`Button, Spinner, EmptyState, Icon`) and FR12's requirement that all six sections render a designed empty state. Props are `{ message: string; icon?: ReactNode; className?: string }` — no section-specific copy baked in, so Stories 1.4–1.8 can reuse it verbatim through their own props. Styled mobile-first: dashed rounded border, soft tinted background (`bg-foreground/[0.03]`), `text-foreground/70` — derived from the existing `--foreground`/`--background` design tokens (≈12.6:1 contrast at full opacity, comfortably clears WCAG AA even at the reduced opacities used), reading as an intentional "content coming soon" placeholder rather than a broken state
- **`LogoSection` populated branch**: `next/image` with `fill` + `object-contain` inside a fixed-size centered container (`h-28 w-28 sm:h-32 sm:w-32`) — chosen over `object-cover`/circular-avatar styling so any uploaded image's aspect ratio displays without cropping or distortion; `priority` set since it's the largest above-the-fold element on first load (NFR2). `alt={logo.title}` reuses the existing field verbatim per the architecture's decided alt-text rule — including when it's `""`, which is valid a11y for a captionless image (inventing fallback text would have meant fabricating content not present in the document). This makes `title` genuinely dual-purpose (FR2's visible caption AND the image's `alt` text), exactly why the architecture noted reusing it requires "no schema change"
- **`LogoSection` empty branch**: renders `<EmptyState message="הלוגו יתווסף בקרוב" icon={<LogoPlaceholderIcon />} />` — a small inline placeholder-photo SVG kept local to `LogoSection` (a shared `Icon` primitive is separate future scope) — never a broken `<img>`/empty-`src` `next/image`/blank gap. Both branches share identical `<section>` spacing (`pt-12 sm:pt-16`, `px-6`, centered flex column, `gap-3`) for visual consistency regardless of data state
- **`page.tsx` fully rewritten**, not edited — it was 100% untouched `create-next-app` boilerplate (English copy, `next.svg`/`vercel.svg` imports, `sm:items-start text-left` classes that fought the `dir="rtl"` `<html>`, exactly the LTR/RTL mismatch `deferred-work.md` flagged from Story 1.1's review as deferred "until the real sections are built" — that's now). New version is an `async function` Server Component, the sole `getContent()` caller on the public page, rendering `<LogoSection logo={content.logo} />` inside an RTL-correct `<main>`
- **Unplanned but required addition — `next.config.ts`**: added `images.remotePatterns` allow-listing `https://*.public.blob.vercel-storage.com`. `next/image` rejects unlisted remote hosts at the optimizer level, and `logo.imageUrl` will be a Vercel Blob CDN URL in production — without this, the very first real image upload would 400. Confirmed the exact hostname pattern by reading `@vercel/blob`'s own URL-construction source rather than guessing, since this is foundational plumbing every later image-rendering story (slider, etc.) depends on being correct here
- **Local-build credentials blocker — discovered, escalated, and resolved with Dorma**: wiring `getContent()` into `page.tsx` made `npm run build` attempt to statically prerender `/`, which calls the real `@vercel/blob` `get()`. No `BLOB_READ_WRITE_TOKEN` existed anywhere locally (re-checked `.env.local`, `.env.example`, `.vercel/`, shell env — the same account-bound gap Story 1.2 flagged as a future risk, now actually blocking a build for the first time). This is correct, by-design behavior: Story 1.2 deliberately made `getContent` propagate auth errors rather than mask them, and switching the route to `force-dynamic` would have contradicted the architecture's stated ISR caching strategy — so no code-side workaround was appropriate. Halted and asked Dorma directly; she chose to provide a real `BLOB_READ_WRITE_TOKEN` from the Vercel dashboard. Verified `.gitignore` already covers `.env*` (line 34) before writing the secret to disk, then created `.env.local` with the token — this unblocks not just this story but every future story's local build/dev verification. **The token is a secret: it lives only in the gitignored `.env.local`, was never logged or committed, and must be provisioned the same way (or via Vercel's auto-injection in production) in any other environment**
- **End-to-end verification**: with the token in place, visually confirmed both `LogoSection` branches on a 375px-equivalent mobile viewport — (a) populated, via the isolated throwaway preview route described in Debug Log References (zero changes to shipped files, zero fabricated Blob data); (b) empty, live at `/` against the connected store's actual current `content.json` (schema defaults, `logo.imageUrl: ""`) — `EmptyState` rendered correctly with no broken image or blank gap. `npm run build` and `npx eslint src` both gate green (see Debug Log References)
- **No automated test framework exists in this project** — explicitly deferred post-MVP per Story 1.2's precedent and this story's own Dev Notes "Testing standards" section; verification was manual, on a mobile viewport, in both data states, per Task 4

### File List

- `src/components/ui/EmptyState.tsx` (NEW) — generic empty-state UI primitive (`message`, optional `icon`/`className` props)
- `src/components/sections/LogoSection.tsx` (NEW) — presentation-only section component rendering the logo image or `EmptyState`
- `src/app/page.tsx` (MODIFIED) — fully replaced `create-next-app` boilerplate with the real Server Component entry point: calls `getContent()`, renders `<LogoSection>` inside an RTL-correct `<main>`
- `next.config.ts` (MODIFIED) — added `images.remotePatterns` allow-listing the Vercel Blob CDN host so `next/image` accepts `logo.imageUrl` URLs
- `.env.local` (NEW, gitignored — not committed) — local-only `BLOB_READ_WRITE_TOKEN`, provided by Dorma to unblock static prerendering of `/` during build/dev; required in every environment that runs `getContent()` against the real Blob store

## Change Log

| Date | Change | Author |
| --- | --- | --- |
| 2026-06-08 | Implemented Story 1.3: built `EmptyState` UI primitive and `LogoSection` component, rewrote `app/page.tsx` to call `getContent()` and render the logo section, added `next.config.ts` Blob-host image config; resolved a real local-build credentials blocker together with Dorma (provided `BLOB_READ_WRITE_TOKEN`, added to gitignored `.env.local`); verified both populated and empty states on mobile viewport via an isolated, fully-removed throwaway preview route; build/lint clean, status → review | Claude Sonnet 4.6 (Dev Agent) |
| 2026-06-08 | Code review (3-layer adversarial — Blind Hunter, Edge Case Hunter, Acceptance Auditor): 0 patch, 0 decision-needed. 15 findings dismissed as false positives/by-design (incl. the empty `alt` text and `*.public.blob.vercel-storage.com` wildcard, both deliberate spec-mandated/Vercel-recommended choices the blind layers lacked context to recognize; "no Logo runtime validation" and "no tests", both confirmed by-design per Story 1.2's centralized-validation architecture and the project's documented no-test-framework decision). 2 findings deferred: `imageUrl` format validation (belongs at Epic 2's write boundary, not duplicated into presentation components) and broken-image-on-load-failure fallback (requires a cross-cutting Server→Client Component decision affecting all six sections, better suited to Story 1.9). Acceptance Auditor confirmed full AC1/AC2 and naming/boundary/file-location compliance. Status → done | Claude Sonnet 4.6 (Review Agent) |
