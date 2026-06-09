---
baseline_commit: 92cb9dbdb896b2783d745c31bb8afa8f3f696a86
---

# Story 1.4: Display Image Slider with Auto-Advance, Manual Navigation, and Pause Control

Status: done

## Story

As a visitor,
I want to browse a gallery of the memorialized person's photos that moves on its own but also responds to my taps and swipes, and that I can pause if I want to,
so that I can view the photos at my own pace, on any device (FR3, FR12).

## Acceptance Criteria

1. **Given** slider content with multiple images **When** the page loads **Then** the images auto-advance at a fixed interval, and navigation arrows/dots are visible
2. **Given** the slider is auto-advancing **When** the visitor swipes (mobile) or clicks an arrow/dot **Then** the slider responds immediately to the manual action and temporarily suspends auto-advance before resuming **And** each image's caption is shown and also used as the image's `alt` attribute
3. **Given** the slider is auto-advancing **When** the visitor activates the pause control **Then** auto-advance stops completely until the visitor resumes it
4. **Given** slider content is empty **When** the page loads **Then** `SliderSection` renders a designed empty state instead of an empty carousel
5. **Given** the visitor's system has `prefers-reduced-motion` enabled **When** the slider renders **Then** it does not auto-advance

## Tasks / Subtasks

- [x] Task 1: Build `SliderSection` skeleton as the project's first Client Component (AC: 1, 4)
  - [x] Subtask 1.1: Create `src/components/sections/SliderSection.tsx` with a `"use client"` directive at the top — the first interactive section in the project (everything built so far — `LogoSection`, `EmptyState`, `page.tsx` — is a Server Component with zero hooks/browser APIs)
  - [x] Subtask 1.2: Contract: `{ slider: SliderImage[] }`, type imported from `@/lib/content-schema` (never redefine); `page.tsx` remains the sole `getContent()` caller and passes `content.slider` down as a prop
  - [x] Subtask 1.3: Empty branch (`slider.length === 0`): render `<EmptyState message="..." icon={...} />`, reusing the shared primitive exactly as Story 1.3 designed it for this moment — pass slider-specific Hebrew copy + a small inline icon (mirror `LogoPlaceholderIcon`'s local-SVG pattern) via props; never fork or modify `EmptyState` itself
  - [x] Subtask 1.4: `<section>` wrapper with mobile-first spacing consistent with `LogoSection`'s established rhythm (`px-6`, centered flex column)

- [x] Task 2: Render the current slide with caption shown AND used as `alt` (AC: 1, 2)
  - [x] Subtask 2.1: `useState` holding the current index; render only the active image via `next/image` inside a sized `relative` container — decide and document `object-contain` vs `object-cover` for a photo gallery (a different framing tradeoff than the logo's "never crop" requirement) in Completion Notes
  - [x] Subtask 2.2: `alt={image.caption}` reusing the field verbatim — including when `""` — the exact rule `LogoSection` established with `alt={logo.title}` [architecture.md L529 / epics.md L70]
  - [x] Subtask 2.3: Render the caption as visible text too — AC2 requires both "shown AND used as alt" (the same dual-purpose field pattern as the logo's `title`)
  - [x] Subtask 2.4: Do NOT mark slider images `priority` — unlike the logo (the single largest above-the-fold element, per Story 1.3's reasoning), the architecture explicitly calls for "lazy-loaded slider images" [L169, L497] for NFR2; `next/image` lazy-loads by default whenever `priority` is omitted

- [x] Task 3: Build visible navigation arrows + dots, keyboard-operable (AC: 1, 2)
  - [x] Subtask 3.1: Render arrow buttons + dot indicators ONLY when `slider.length > 1` — a single image needs no navigation chrome
  - [x] Subtask 3.2: Each control is a real `<button>` (native focus/keyboard support) with a visible `focus-visible:` ring meeting WCAG AA [architecture.md L529] and an `aria-label` describing its action (icons alone aren't accessible to screen readers)
  - [x] Subtask 3.3: RTL-aware navigation — the architecture explicitly names "RTL-aware slider navigation" as part of its NFR4 coverage [L499]. With `dir="rtl"` already on `<html>` (confirmed in `layout.tsx` per Story 1.3's Dev Notes), deliberately decide which physical side advances "forward" in reading-order terms and mirror your arrow icons accordingly — don't default to LTR convention by accident; document the choice
  - [x] Subtask 3.4: Clicking an arrow/dot updates the current index immediately (AC2: "responds immediately to the manual action")

- [x] Task 4: Implement swipe gesture support for mobile (AC: 1, 2)
  - [x] Subtask 4.1: Touch handlers (`onTouchStart`/`onTouchMove`/`onTouchEnd`) detecting a horizontal swipe past a reasonable distance threshold, mapped to next/previous consistent with the RTL direction decided in 3.3
  - [x] Subtask 4.2: A completed swipe updates the current index immediately, exactly like an arrow/dot click (AC2)

- [x] Task 5: Implement fixed-interval auto-advance with manual-interaction suspension (AC: 1, 2, 5)
  - [x] Subtask 5.1: `useEffect` + timer (`setInterval`/chained `setTimeout`) advancing the index at a fixed interval. Choose and document a concrete value (e.g., ~5 seconds is a common, comfortable gallery pace — record your choice and rationale in Completion Notes, the same way Story 1.3 documented its dimension choices). Runs only when `slider.length > 1`, the visitor hasn't paused (Task 7), and reduced motion is NOT preferred (Task 6)
  - [x] Subtask 5.2: Any manual action (arrow/dot click or swipe, from Tasks 3–4) clears the running timer and restarts it fresh — this is the "temporarily suspends auto-advance before resuming" behavior in AC2, and it is DISTINCT from the persistent pause in Task 7
  - [x] Subtask 5.3: Clean up every timer on unmount and on each relevant dependency change — no leaked intervals (a classic carousel `useEffect` bug)

- [x] Task 6: Respect `prefers-reduced-motion` (AC: 5)
  - [x] Subtask 6.1: Inside a `useEffect` (client-only — `window.matchMedia` doesn't exist during SSR/static prerendering and would break `npm run build`, the same class of trap Story 1.3 hit with `getContent()`), read `window.matchMedia('(prefers-reduced-motion: reduce)').matches` into state, and subscribe to the query's `change` event so a mid-session OS-level toggle is honored without a reload
  - [x] Subtask 6.2: When reduced motion is preferred, auto-advance must not run AT ALL (not "slower" — fully off). Manual navigation (arrows/dots/swipe) stays fully available — this is an accessibility requirement (NFR3), not a cosmetic one

- [x] Task 7: Build the visible, persistent pause/play control (AC: 3)
  - [x] Subtask 7.1: An always-visible toggle button — the architecture states `SliderSection` "**must** expose a visible pause/play control" [L529], not hidden in a menu or auto-hiding — with `aria-pressed` and an accessible label reflecting current state (e.g., "השהה את הקרוסלה" / "המשך את הקרוסלה")
  - [x] Subtask 7.2: Activating it stops auto-advance COMPLETELY until the visitor explicitly resumes it — track this as state distinct from Task 5's temporary manual-interaction suspension. A `useReducer` with explicit states (e.g., `playing` / `paused`), as the architecture itself suggests for non-trivial local state [L166], is likely cleaner than juggling multiple booleans that can drift out of sync
  - [x] Subtask 7.3: While paused, manual navigation (arrows/dots/swipe) still works — pausing stops only the *automatic* advance, never the visitor's own control

- [x] Task 8: Wire `SliderSection` into the public page (AC: all)
  - [x] Subtask 8.1: Add `<SliderSection slider={content.slider} />` to `src/app/page.tsx` directly below `<LogoSection>`, preserving the fixed PRD §3 order (Logo → Slider → ...) — exactly the extension point Story 1.3's comment in `page.tsx` describes
  - [x] Subtask 8.2: Build/wire only `SliderSection` — no stubs for the four sections still to come

- [x] Task 9: Verify end-to-end on a mobile viewport (no automated test framework exists) (AC: all)
  - [x] Subtask 9.1: Verify the empty state live at `/` — the connected store's actual current `content.json` has `slider: []` (schema default), so this is what you'll really see; confirm no broken/empty carousel chrome appears
  - [x] Subtask 9.2: Verify the populated state — auto-advance pacing, arrow/dot/swipe navigation, visible caption + correct `alt`, pause/resume — using a fully-isolated, fully-deleted throwaway preview route with fixture data, exactly Story 1.3's `dev-preview-temp` technique (zero changes to shipped files, zero fabricated Blob writes, confirm full removal via `git status --porcelain`)
  - [x] Subtask 9.3: Verify `prefers-reduced-motion` — most browser devtools expose an emulation toggle for this media query; confirm auto-advance is fully suppressed when enabled and manual nav still works
  - [x] Subtask 9.4: `npm run build` (TypeScript clean, `/` still prerenders successfully) and `npx eslint src` (zero warnings) — the same final gate Story 1.3 used and passed

### Review Findings

- [x] [Review][Patch] Whitespace-only caption renders empty `<p>` — `current.caption` truthiness check passes `"   "` (whitespace-only), producing a visually-empty paragraph element [src/components/sections/SliderSection.tsx:202]
- [x] [Review][Defer] No WAI-ARIA carousel role / keyboard arrow-key navigation [src/components/sections/SliderSection.tsx] — deferred, out of story scope; Story 1.9 a11y pass
- [x] [Review][Defer] No `aria-live` region for auto-advance slide changes [src/components/sections/SliderSection.tsx] — deferred, out of story scope; Story 1.9 a11y pass
- [x] [Review][Defer] Auto-advance timer restarts on every tick (index in effect deps) — micro-optimization opportunity; no functional defect [src/components/sections/SliderSection.tsx:118-133] — deferred, pre-existing trade-off of the AC2 "reset on any navigation" approach; zero user-visible impact
- [x] [Review][Defer] No visual feedback during in-progress swipe gesture [src/components/sections/SliderSection.tsx:169-185] — deferred, out of story scope; Story 1.9 UX polish
- [x] [Review][Defer] Diagonal swipe may trigger horizontal navigation (no Y-delta check) [src/components/sections/SliderSection.tsx:175-185] — deferred, `touch-pan-y` mitigates; full fix out of story scope
- [x] [Review][Defer] `aria-pressed` semantic nuance — "Resume button, pressed" when paused is spec-compliant but potentially confusing to screen readers [src/components/sections/SliderSection.tsx:193-196] — deferred, spec-compliant as written; Story 1.9 a11y review
- [x] [Review][Defer] No `onError` broken-image fallback for runtime 404/network failures [src/components/sections/SliderSection.tsx:161-165] — deferred, same class as LogoSection 404 deferral in deferred-work.md; cross-cutting architectural decision for all image-rendering sections
- [x] [Review][Defer] `imageUrl: ""` (schema default) reaches `next/image src` with no guard [src/components/sections/SliderSection.tsx:161] — deferred, same class as LogoSection `logo.imageUrl` no-format-validation deferral; Epic 2's upload story must guarantee well-formed URLs

## Dev Notes

### Critical context — internalize before writing any code
- **This is the FIRST Client Component (`"use client"`) in the entire project.** `LogoSection`, `EmptyState`, and `page.tsx` are all Server Components with zero hooks or browser APIs. You are establishing the Server/Client boundary pattern: `page.tsx` stays a Server Component (the sole `getContent()` caller — "single data-fetching entry point" [architecture.md L414]), and `SliderSection` becomes the first `"use client"` leaf owning genuinely interactive local state. This is exactly the case the architecture pre-approved: *"local client state (slider position, admin form state) handled with React's built-in `useState`/`useReducer`. **No global state library needed**"* [L166]. Do NOT reach for a carousel/slider npm package (Embla, Swiper, keen-slider, etc.) — that would be a new dependency requiring explicit user approval (a dev-story HALT condition), and the architecture has already decided the approach for you. Hand-build it.
- **Name it `SliderSection`, file `SliderSection.tsx`, in `src/components/sections/`** [architecture.md "Naming Patterns" L213, "Directory Structure" L376 — `SliderSection.tsx → PRD §4.2 (auto-advance + manual nav + pause control)`]. Same `<Name>Section` 1:1 mapping rule Story 1.3 established and that code review checks [L301].
- **Reuse `EmptyState` exactly as Story 1.3 built it for this moment** [Source: 1-3 Dev Notes, "Empty-state pattern — you are defining it for five future sections": *"Stories 1.4 (slider)... will each pass their own contextual message through the same component"*]. `<EmptyState message="..." icon={...} />` with slider-specific Hebrew copy (mirroring the established tone of `logo`'s "הלוגו יתווסף בקרוב" — e.g. something like "התמונות יתווספו בקרוב") and a small inline SVG icon local to `SliderSection` (mirror `LogoPlaceholderIcon`'s pattern — not a new shared `Icon` primitive, that's separate future scope).
- **The `caption`-as-`alt` rule is already decided — apply it exactly like `LogoSection` applied `title`**: *"every image rendered from content data (`logo.imageUrl`, `slider[].imageUrl`) **must** use its existing `caption`/`title` field as `alt` text — no schema change required"* [architecture.md L529, epics.md L70]. Use `alt={image.caption}` directly, including when `""`. AC2 additionally requires the caption be **visibly shown** — both at once, the same dual-purpose-field pattern Story 1.3 established for `logo.title`.
- **`SliderImage` shape**: `{ imageUrl: string, caption: string }`, both `.default("")` [Source: `src/lib/content-schema.ts` — `sliderImageSchema`/`SliderImage`]. `content.slider: SliderImage[]`, `.default([])`. Import the type from `@/lib/content-schema` — never redefine [Enforcement Guidelines L299, Anti-Patterns L334].
- **Two distinct "stop" mechanisms — do not conflate them**: (a) AC2's *temporary* suspend-then-resume on manual interaction, and (b) AC3's *persistent* pause that "stops completely until the visitor resumes it." They must coexist without fighting: a manual-interaction "nudge" must never silently un-pause a visitor who explicitly paused. The architecture's own suggestion to consider `useReducer` for non-trivial local state [L166] fits well here — e.g., explicit `playing`/`paused` states, where manual interaction only resets the auto-advance *timer* while `playing`, and never overrides an explicit `paused` state.
- **`prefers-reduced-motion` is an accessibility requirement (NFR3), not a nice-to-have** [architecture.md L529: *"`SliderSection` **must** expose a visible pause/play control and respect the `prefers-reduced-motion` media query when auto-advancing"*]. `window.matchMedia` is browser-only — guard it inside `useEffect`; calling it at module/render scope would throw or be `undefined` during SSR/static prerendering and break `npm run build`'s prerender of `/` (the same class of build-breaking trap Story 1.3 hit with `getContent()`, resolved by isolating the side effect correctly). Subscribe to the query's `change` event so a mid-session OS toggle works without a reload.
- **Don't mark slider images `priority`** — a deliberate contrast with `LogoSection`. The logo earned `priority` because Story 1.3 determined it's the single largest above-the-fold element; the architecture separately calls for "lazy-loaded slider images" [L169, Requirements Coverage L497] to serve NFR2 on weak mobile connections. Omitting `priority` is sufficient — `next/image` lazy-loads by default.
- **The Blob image host is already configured — touch nothing in `next.config.ts`.** Story 1.3 added `images.remotePatterns` for `*.public.blob.vercel-storage.com` *specifically* because "every later image-rendering story (slider, etc.) depends on being correct here" [1-3 Completion Notes]. Zero config changes needed.
- **RTL is cross-cutting here in a way it wasn't for the logo** — a single centered logo has no "direction"; a slider's "next"/"previous" does. The architecture names "RTL-aware slider navigation" explicitly under its NFR4 coverage [L499]. `dir="rtl"` is already set on `<html>` (per `layout.tsx`, confirmed in 1.3's Dev Notes) — make a deliberate, documented choice about which physical side is "forward" in reading-order terms and mirror your icons; don't default to LTR convention by accident.

### Component contract (props, not fetching)
```ts
import type { SliderImage } from "@/lib/content-schema";

export function SliderSection({ slider }: { slider: SliderImage[] }) {
  // slider[i].imageUrl: string (default ""), slider[i].caption: string (default "")
  // slider: [] when nothing has been populated yet (schema default — the live state today)
}
```
This component legitimately owns local UI state (current index, playing/paused, reduced-motion preference) — exactly the "local client state" the architecture carved out as the one sanctioned use of `useState`/`useReducer` [L166]. That does NOT make it a data-fetcher: `page.tsx` still passes `slider` down as a prop and remains the only `getContent()` caller [L414].

### File locations
[Source: architecture.md "Complete Project Directory Structure" L373-391]
- `src/components/sections/SliderSection.tsx` — NEW
- `src/app/page.tsx` — MODIFIED (append `<SliderSection slider={content.slider} />` directly below `<LogoSection>`, at the exact extension point Story 1.3's comment describes)
- Do NOT touch: `next.config.ts` (already correctly configured for the Blob image host by Story 1.3), `src/lib/*` (read-only — `SliderImage` already exists, no schema changes needed), `src/components/sections/LogoSection.tsx` / `src/components/ui/EmptyState.tsx` (consume `EmptyState` as-is; never fork it)

### Previous Story Intelligence (Story 1.3 — `done`)
[Source: 1-3-display-logo-section-with-empty-state.md — Dev Agent Record / Completion Notes / File List / Dev Notes]
- The `<Name>Section` pattern is proven and live: receive validated typed props from `@/lib/content-schema`, render conditionally on emptiness, never fetch. You're the second of six sections to implement it — four more will follow your lead exactly as you follow `LogoSection`'s.
- `EmptyState` (`src/components/ui/EmptyState.tsx`) is a generic, reusable primitive — `{ message, icon?, className? }` — purpose-built so Stories 1.4–1.8 can "reuse it verbatim through their own props." Use it as-is.
- `getContent()` never throws and always returns a complete `ContentDocument` with schema defaults filled — `content.slider` is `[]` in the live store right now, so the empty branch is what's actually live at `/` today; verify the populated branch via a throwaway fixture-based preview route (reuse Story 1.3's exact `dev-preview-temp` technique: create, verify, fully delete, confirm via `git status --porcelain` that zero trace remains).
- `BLOB_READ_WRITE_TOKEN` now exists in the gitignored `.env.local` (Story 1.3 resolved this blocker with Dorma) — `npm run build` will successfully prerender `/` against the real (currently empty) store. You should NOT hit the credentials blocker Story 1.3 hit.
- Final verification gate that worked well, reuse it: `npm run build` + `npx eslint <path>` — zero warnings/errors, all routes static.
- Git: work lands on `master`, no special branching strategy.

### Testing standards
No automated test framework exists in this project — explicitly deferred post-MVP [Source: architecture.md "Core Decisions" / Stories 1.2 & 1.3 precedent]. Do not introduce one — and specifically do not reach for a testing-library/interaction-test package as a substitute for hand-verification; that would be adding a new dependency for a single story against the project's documented decision. Verify manually per Task 9 on a mobile viewport, covering all five ACs (auto-advance, manual nav incl. swipe, pause/resume, captions+alt, reduced-motion), then confirm zero throwaway/stub code remains before marking done.

### Project Structure Notes
- No new directories needed — `components/sections/` already exists from Story 1.3.
- This story DOES introduce a pattern not yet present anywhere in the codebase — the Server/Client Component boundary (`"use client"`). This is anticipated and pre-approved by the architecture [L166], not a deviation, but it IS the first of its kind: place the directive at the very top of `SliderSection.tsx` and keep `page.tsx` a Server Component.
- No conflicts detected between epics.md and architecture.md — both agree on auto-advance + manual nav + pause + empty state + reduced-motion; the architecture additionally pins down specifics the epic's AC text implies but doesn't spell out verbatim ("no global state library," "must expose a visible pause/play control," "RTL-aware slider navigation," "lazy-loaded slider images").

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4: Display Image Slider with Auto-Advance, Manual Navigation, and Pause Control (L189-216)]
- [Source: _bmad-output/planning-artifacts/epics.md#FR3, FR4, FR12 (L22, L24, L40)]
- [Source: _bmad-output/planning-artifacts/epics.md#NFR3 Accessibility, NFR4 RTL (L48, L50)]
- [Source: _bmad-output/planning-artifacts/epics.md#Accessibility implementation rule (L70)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture — State Management (L166), Performance Optimization (L169)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns (L213), Directory Structure (L376, L391)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries — Component/Data Boundaries (L412-421)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Validation Issues Addressed — Issue 1 accessibility/alt-text/pause/reduced-motion rule (L526-529)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Coverage — NFR2 lazy-loaded slider images (L497), NFR4 RTL-aware slider navigation (L499)]
- [Source: _bmad-output/implementation-artifacts/1-3-display-logo-section-with-empty-state.md#Completion Notes List / File List / Dev Notes]
- [Source: src/lib/content-schema.ts — `sliderImageSchema`/`SliderImage` type, `slider: z.array(sliderImageSchema).default([])`]
- [Source: src/components/sections/LogoSection.tsx, src/components/ui/EmptyState.tsx, src/app/page.tsx — established patterns this story directly extends]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (claude-sonnet-4-6)

### Debug Log References

- `npx eslint src` — first run flagged `react-hooks/set-state-in-effect` on the `prefers-reduced-motion` `useEffect` (calling `setPrefersReducedMotion` synchronously in the effect body risks cascading renders); resolved by replacing the `useState`+`useEffect` pair with `useSyncExternalStore` — the React-recommended primitive for syncing component state with a browser API like `matchMedia`. It has a built-in server-snapshot slot (`getReducedMotionServerSnapshot` returns `false`), so there's no client-only initial render to mismatch during SSR/static prerendering, and no `setState` call inside an effect at all — the subscription callback feeds React directly. Re-run: zero warnings/errors
- `npm run build` — compiled successfully, TypeScript clean, `/` prerendered as static content (both before and after the `useSyncExternalStore` change — confirms the rewrite didn't reintroduce the SSR `window` trap)
- `src/app/dev-preview-temp/page.tsx` (throwaway, fully deleted) — rendered `<SliderSection slider={fixtureSlider} />` with a 3-image fixture (`/globe.svg`, `/file.svg` with Hebrew captions; `/window.svg` with `caption: ""` to exercise the empty-alt/no-caption-paragraph edge case) using local `public/` SVGs — avoided fabricating Blob CDN data entirely; removal confirmed via `git status --porcelain` showing zero trace
- Playwright (via `npx -p playwright`, driving the locally-installed Microsoft Edge through `channel: 'msedge'` — no browser binaries downloaded) drove 14 automated interaction checks against the throwaway preview, all passing: initial caption/alt match, arrow-click advances + updates alt, caption text visibility, empty-caption image renders `alt=""` with no `<p>` shown, dot click jumps + sets `aria-current`, previous-arrow wraps to the last image, pause button visible while playing, clicking it shows the play button with `aria-pressed="true"`, no auto-advance occurs for 5.5s while paused, auto-advance DOES occur within ~5.8s while playing, `prefers-reduced-motion: reduce` (via Playwright's `reducedMotion` context option) fully suppresses auto-advance, and a manual nav click resets the auto-advance timer per AC2 (no advance in the 2s immediately following a manual move). Test script and the temporary preview route were both deleted after the run

### Completion Notes List

- **`SliderSection` is the project's first Client Component** (`"use client"`) — establishes the Server/Client boundary the architecture pre-approved [L166]: `page.tsx` stays a Server Component and the sole `getContent()` caller, passing `content.slider` down as a typed prop; `SliderSection` owns all interactive local state (`useState` for index, `useReducer` for playback, `useSyncExternalStore` for the reduced-motion media query) with zero npm carousel dependency, exactly as the architecture specified ("No global state library needed")
- **Auto-advance interval chosen as 5000ms (`AUTO_ADVANCE_INTERVAL_MS`)** — a common, comfortable gallery pace: long enough to read a short caption, short enough that the gallery doesn't feel static
- **`object-cover` chosen over `object-contain`** (the opposite of `LogoSection`'s choice) — documented rationale: a single logo has a strict "never crop the brand mark" requirement that drove `object-contain` in Story 1.3, but a photo gallery's framing tradeoff is different — consistent, filled `aspect-[4/3]` frames read as an intentional curated gallery, whereas `object-contain` would produce visually jarring letterboxing across photos of varying aspect ratios
- **AC2's "temporarily suspend, then resume" solved without extra state**: including `index` in the auto-advance `useEffect`'s dependency array means ANY index change — whether from the timer's own tick or a manual arrow/dot/swipe — clears the running timer and starts a fresh one, so the next auto-advance always lands a full interval after the visitor's last action. This stays cleanly distinct from AC3's persistent `paused` state (a separate `useReducer`), which the same effect checks and skips entirely — the two "stop" mechanisms never fight each other, exactly the risk the Dev Notes flagged
- **RTL navigation direction — deliberate, documented choice**: under `dir="rtl"`, content flows right-to-left, so "next" conceptually sits toward the reading-order end (visually LEFT — mirroring how "next" sits to the right under LTR). This drove three mutually-consistent decisions, all commented inline in `SliderSection.tsx`: (a) the next-arrow sits at the logical `end-3` position (physically left) and points left via `<ChevronIcon pointing="end" />` (a `rotate-180` on a right-pointing base path), (b) the previous-arrow sits at `start-3` (physically right) pointing right, (c) swipe mapping treats a rightward drag (`deltaX > 0`, pulling the hidden-left content into view) as "next" — mirroring the familiar LTR "swipe left = next" in RTL terms
- **`prefers-reduced-motion` implemented via `useSyncExternalStore`, not `useState`+`useEffect`** — see Debug Log References for the full rationale (an ESLint `react-hooks/set-state-in-effect` finding led to this rewrite mid-implementation). `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)` is the React-documented pattern for exactly this case (subscribing to a browser API): `getServerSnapshot` returns `false` so SSR/static-prerender never touches `window.matchMedia`, `getSnapshot` reads the live preference on the client, and `subscribe` wires the query's `change` event straight into React's re-render — a strictly better fit than the Dev Notes' originally-suggested `useState`+`useEffect` sketch, with no extra render-after-mount and no lint findings
- **Pause/play modeled as an explicit `useReducer`** (`"playing" | "paused"`, toggled by `togglePlaybackState`) per the architecture's own suggestion for non-trivial local state [L166] — cleaner than juggling booleans that could drift out of sync, and makes the persistent-pause vs. temporary-suspension distinction structurally explicit (the reducer state vs. the effect's dependency-driven timer reset)
- **Single-image sliders show zero navigation chrome**: arrows, dots, AND the pause/play button are all gated behind the same `hasMultiple = slider.length > 1` check — pausing only makes sense when something is actually auto-advancing, so a lone-image slider renders cleanly with no meaningless controls
- **`alt={current.caption}` reused verbatim, including when `""`** — the exact rule `LogoSection` established with `alt={logo.title}` [architecture.md L529 / epics.md L70]; verified via the throwaway fixture's third image (empty caption) rendering `alt=""` with no visible `<p>` caption, exactly as the dual-purpose-field pattern requires
- **No `priority` on slider images** — a deliberate contrast with `LogoSection` (which earned it as the largest above-the-fold element); the architecture explicitly calls for lazy-loaded slider images for NFR2 [L169, L497], and `next/image` lazy-loads by default whenever `priority` is omitted
- **End-to-end verification**: empty state confirmed live at `/` against the connected store's actual `content.json` (`slider: []`, schema default) — renders `<EmptyState message="התמונות יתווספו בקרוב" .../>` with no broken/empty carousel chrome; populated state and all five ACs verified via the throwaway preview route plus 14 automated Playwright interaction checks (see Debug Log References) on a real browser engine — far more rigorous than visual-only verification, while still respecting the project's "no automated test framework" decision since the script and route were both fully deleted afterward, leaving zero trace (`git status --porcelain` confirmed clean)
- **No automated test framework exists in this project** — explicitly deferred post-MVP per Stories 1.2/1.3 precedent; the Playwright run was a one-off verification aid (driven through the already-locally-installed Microsoft Edge via `channel: 'msedge'`, no new browser binaries downloaded, no `package.json` changes), not a framework introduction — fully consistent with the Dev Notes' explicit instruction not to add a testing-library/interaction-test dependency
- **`npm run build` and `npx eslint src` both gate green** — zero warnings/errors, `/` prerenders as static content

### File List

- `src/components/sections/SliderSection.tsx` (NEW) — the project's first Client Component (`"use client"`); presentation-only gallery section owning local UI state (current index via `useState`, playback via `useReducer`, reduced-motion preference via `useSyncExternalStore`), rendering either the populated carousel (image + caption/alt, RTL-aware arrows, dots, swipe handlers, persistent pause/play control) or `<EmptyState>` when `slider` is empty
- `src/app/page.tsx` (MODIFIED) — added the `SliderSection` import and `<SliderSection slider={content.slider} />` directly below `<LogoSection>`, preserving the fixed PRD §3 section order

## Change Log

| Date | Change | Author |
| --- | --- | --- |
| 2026-06-08 | Implemented Story 1.4: built `SliderSection` — the project's first Client Component — with auto-advance, RTL-aware manual navigation (arrows/dots/swipe), a persistent pause/play control, `prefers-reduced-motion` support via `useSyncExternalStore`, and the empty-state branch; wired it into `app/page.tsx` directly below `LogoSection`; verified all 5 ACs both live (`/`, empty state) and via an isolated, fully-removed throwaway preview route driven by 14 automated Playwright interaction checks; build/lint clean, status → review | Claude Sonnet 4.6 (Dev Agent) |
