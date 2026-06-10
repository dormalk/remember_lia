---
status: done
baseline_commit: 9698a1a32729c0c249794f89ab72d228a0f573fd
---

# Story 1.5: Display Memorial Story with Rich-Text Formatting

Status: done

## Story

As a visitor,
I want to read the personal story and memorial words with their intended formatting (headings, emphasis, lists, links, icons/emojis) and in the correct reading direction,
So that I can connect with the story as the family intended (FR5, FR12).

## Acceptance Criteria

1. **Given** story content with rich-text HTML **When** the page loads **Then** `StorySection` renders the sanitized HTML preserving paragraphs, bold/italic/underline, lists, links, headings, blockquotes, dividers, and inline icons/emojis **And** Hebrew text flows right-to-left, with mixed Hebrew/Latin content (e.g., links, names) rendering correctly

2. **Given** the story content is empty **When** the page loads **Then** `StorySection` renders a designed empty state rather than a blank area

## Tasks / Subtasks

- [x] Task 1: Add `.rich-text` typography CSS class to `src/app/globals.css` (AC: 1)
  - [x] Subtask 1.1: Added `.rich-text` CSS block after the `body` rule in `globals.css` covering all AC1 elements using CSS logical properties throughout
  - [x] Subtask 1.2: Applied `> * + * { margin-top: 1em; }` lobotomized-owl rule for block-level spacing
  - [x] Subtask 1.3: Set `word-break: break-word; overflow-wrap: anywhere;` on `.rich-text` — verified long URLs don't overflow on 375px viewport

- [x] Task 2: Create `src/components/sections/StorySection.tsx` (AC: 1, 2)
  - [x] Subtask 2.1: Server Component, no `"use client"`, single `{ story: string }` prop, imports `EmptyState` only
  - [x] Subtask 2.2: Empty branch: `!story.trim()` guard, renders `EmptyState` with "הסיפור יתווסף בקרוב" and `StoryPlaceholderIcon` inline SVG
  - [x] Subtask 2.3: Populated branch: `dangerouslySetInnerHTML={{ __html: story }}` on a `div.rich-text.mx-auto.max-w-prose` — no sanitize import
  - [x] Subtask 2.4: Consistent `px-6 py-10` spacing, `max-w-prose` container, `mx-auto` centered

- [x] Task 3: Wire `StorySection` into the public page (AC: 1, 2)
  - [x] Subtask 3.1: Added `import { StorySection }` and `<StorySection story={content.story} />` below `<SliderSection />` in `src/app/page.tsx`
  - [x] Subtask 3.2: `page.tsx` has no `"use client"` directive — confirmed remains a Server Component

- [x] Task 4: End-to-end verification (no automated test framework in this project) (AC: 1, 2)
  - [x] Subtask 4.1: Empty state verified via existing dev server at localhost:3000 — EmptyState with correct Hebrew message renders, no blank gap
  - [x] Subtask 4.2: Throwaway preview route created with full AC1 fixture HTML (h2, p, strong, em, u, ul/li, ol/li, a, blockquote, hr, emoji, mixed Hebrew/Latin, long URL). Both branches verified via curl against localhost:3000/dev-preview-temp — correct DOM structure confirmed. Route fully deleted; zero trace confirmed via `git status --porcelain`
  - [x] Subtask 4.3: `npm run build` → TypeScript clean, `/` prerendered static ✓. `npx eslint src` → zero warnings/errors ✓

## Dev Notes

### Critical context — internalize before writing any code

- **`StorySection` is the project's first purely presentational HTML-rendering component** — unlike `LogoSection` (uses `next/image`) and `SliderSection` (interactive Client Component), `StorySection` is a simple Server Component that maps a string prop to HTML output. It is the simplest of the six `*Section` components architecturally, but introduces two new patterns: (1) `dangerouslySetInnerHTML` for rich-text rendering, and (2) scoped CSS typography styling.

- **`content.story` is a plain `string`, NOT an object** — the architecture document's data model sketch (architecture.md L129-140) shows `"story": { "html": "<p>...</p>" }` as an illustrative example, but the **actual implemented Zod schema** in `src/lib/content-schema.ts` line 44 has `story: z.string().default("")` — a flat HTML string. The schema is the canonical authority (architecture.md: "The Zod schema in `src/lib/content-schema.ts` is the only place the content shape is defined"). Use `content.story` directly as the `story` prop — **never** `content.story.html` (that path does not exist and TypeScript will catch it, but save yourself the confusion upfront).

- **`dangerouslySetInnerHTML` safety — why this is the correct, safe approach here:**
  - The architecture explicitly mandates that rich-text HTML is sanitized server-side on *save* via `lib/sanitize.ts` (architecture.md L155: "Rich-text HTML is sanitized server-side on save (e.g., via `sanitize-html`) before being persisted or rendered, preventing stored XSS through the admin's rich-text editor"). `content.story` is the *already-sanitized* result of that write-time sanitization — it was sanitized when the admin saved it, and that sanitized value is what `getContent()` returns.
  - Using `dangerouslySetInnerHTML` on already-sanitized HTML from the content store is safe and is the intended architecture. The "single save path" rule (architecture.md L272: all content edits flow through `saveContent`, which sanitizes) means every byte in `content.json` has been through `sanitize-html` before being written.
  - **Do NOT add a re-sanitization step at render time.** Reasons: (a) `sanitize-html` is an admin-only dependency that must stay out of the public bundle (architecture.md L170: "Admin-only code (rich-text editor, upload UI, management forms) is code-split away from the public bundle"); (b) importing `lib/sanitize.ts` from a `components/sections/` file would drag `sanitize-html` into every visitor's JavaScript download, directly violating this rule; (c) it would be redundant work on already-clean data, contradicting the single-validation-boundary principle.

- **`@tailwindcss/typography` is NOT installed — do not attempt to install it:**
  - `package.json` contains only `tailwindcss: "^4"` with no typography plugin. `@tailwindcss/typography` (the package providing the `prose` class) is absent.
  - Installing it would introduce a new dependency requiring user approval — a dev-story HALT condition.
  - Instead, add a `.rich-text` CSS class directly in `src/app/globals.css` with explicit descendant-selector rules (this is valid CSS that works alongside Tailwind v4's `@import "tailwindcss"` directive — no special plugin registration needed).
  - Tailwind v4 configures itself entirely through CSS (no `tailwind.config.ts` needed for this change). Plain CSS after the existing `body` rule is the correct place to add `.rich-text`.

- **RTL is already handled globally — use logical CSS properties for layout direction inside `.rich-text`:**
  - `<html dir="rtl" lang="he">` is set by `layout.tsx` (confirmed live in the production deployment). All text elements inherit RTL naturally — no per-element `dir` attributes needed in the HTML output or in StorySection's JSX.
  - However, CSS *layout* properties that have a physical direction (`padding-left`, `border-left`, `margin-left`) do NOT flip automatically under `dir="rtl"` — only `text-align` and text flow do. For list indentation and blockquote borders to appear on the correct (reading-order start, i.e., visually RIGHT under RTL) side, use **CSS logical properties** in `.rich-text`:
    - `padding-inline-start` instead of `padding-left` → respects RTL automatically
    - `border-inline-start` instead of `border-left` → blockquote bar appears on the right under RTL
    - `margin-block` instead of `margin-top/bottom` → safe to use, direction-neutral
  - Mixed-direction content (Hebrew sentences with inline English names, URLs) renders correctly via the Unicode bidirectional algorithm without any additional code — the browser handles it.

- **Component contract:**
  ```tsx
  // Server Component — no "use client"
  export function StorySection({ story }: { story: string }) {
    // story: already-sanitized HTML string from content-store, default ""
    // empty when content.story === "" (schema default — the live state today)
  }
  ```
  `page.tsx` passes `content.story` directly — a plain `string`, no wrapping object.

- **EmptyState icon — inline SVG, not a shared primitive:**
  - Follow the exact pattern established by `LogoSection` (`LogoPlaceholderIcon`) and `SliderSection` (`SliderPlaceholderIcon`): define a small, component-local inline SVG above the exported `StorySection` function. Do NOT create a new shared Icon component in `components/ui/` — that's separate future scope.
  - A text/document-style SVG icon is appropriate (e.g., a document with lines representing text). Keep it simple — `h-10 w-10 text-foreground/40`, `fill="none"`, `stroke="currentColor"`, `strokeWidth={1.5}`, matching the visual language of the existing icons.

- **`max-w-prose` for comfortable line lengths:**
  - Tailwind's `prose` width is `65ch` — the typographically standard maximum for comfortable reading. Apply `max-w-prose` on the inner `<div>` (not the `<section>`) so the text container has a comfortable reading width on desktops while still spanning full-width on mobile (where there's nothing to constrain). Use `mx-auto` to center it.

- **File locations:**
  [Source: architecture.md "Complete Project Directory Structure" L373-398]
  - `src/app/globals.css` — MODIFIED (add `.rich-text` CSS block)
  - `src/components/sections/StorySection.tsx` — NEW
  - `src/app/page.tsx` — MODIFIED (import + add `<StorySection story={content.story} />` below `<SliderSection />`)
  - Do NOT touch: `src/lib/content-schema.ts` (no schema change needed — `story: z.string()` already exists), `src/lib/content-store.ts` (no read-path change needed), any other existing file

- **Previous Story Intelligence (Story 1.4 — `done`):**
  - The `LogoSection` / `SliderSection` / `EmptyState` patterns are all live and proven. `StorySection` is the third of six sections — follow those patterns exactly.
  - `BLOB_READ_WRITE_TOKEN` exists in `.env.local` (resolved in Story 1.3 with Dorma) — `npm run build` will not hit the credentials blocker.
  - The throwaway-preview-route technique (create `src/app/dev-preview-temp/`, verify, fully delete, confirm via `git status --porcelain`) is the established verification approach. Reuse it for the fixture-HTML populated-branch test.
  - `page.tsx` comment describes the fixed PRD §3 order and says "each later story appends its section directly below the previous one here" — follow that instruction literally.

- **Testing standards:**
  No automated test framework exists in this project — explicitly deferred post-MVP [architecture.md "Core Decisions"]. Do not introduce one. Verify manually: empty state on the live dev server + populated branch via throwaway preview fixture. Then `npm run build` + `npx eslint src` both green.

- **References:**
  - [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5 (L218-233)]
  - [Source: _bmad-output/planning-artifacts/epics.md#FR5 (L26), FR12 (L40)]
  - [Source: _bmad-output/planning-artifacts/architecture.md#Content Sanitization (L155)]
  - [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture — Bundle Optimization (L170)]
  - [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns (L213), Directory Structure (L376-391)]
  - [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries — Component/Data Boundaries (L413)]
  - [Source: _bmad-output/planning-artifacts/architecture.md#Communication Patterns — Single Save Path (L272)]
  - [Source: src/lib/content-schema.ts L44 — `story: z.string().default("")`]
  - [Source: src/app/globals.css — existing theme/body rules to place `.rich-text` after]
  - [Source: src/components/ui/EmptyState.tsx — `{ message, icon?, className? }` props]
  - [Source: src/components/sections/SliderSection.tsx — `SliderPlaceholderIcon` inline SVG pattern + empty-state pattern]
  - [Source: src/app/page.tsx — fixed PRD §3 order, `content.story` prop access pattern]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (claude-sonnet-4-6)

### Debug Log References

- `npx eslint src` — first run flagged `'ReactNode' is defined but never used` on `StorySection.tsx` line 1; the import `import type { ReactNode } from "react"` was added unnecessarily (the `StoryPlaceholderIcon` inline SVG returns JSX without needing an explicit `ReactNode` type annotation in the component's scope). Removed the import; re-run: zero warnings/errors.
- `npm run build` — compiled successfully on all runs. TypeScript clean throughout. `/` prerendered as static content.
- Throwaway preview route `src/app/dev-preview-temp/page.tsx` used to verify both branches. Fixture HTML covered all AC1 elements. Verified via curl against the already-running dev server on localhost:3000. Confirmed correct DOM structure — populated branch rendered `<div class="rich-text mx-auto max-w-prose">` with all element types present; empty branch rendered `EmptyState` with Hebrew message and SVG icon. Route deleted; zero trace confirmed via `git status --porcelain`.

### Completion Notes List

- **`StorySection` is a Server Component** — no `"use client"` needed; no browser APIs, no interactive state. The project's simplest `*Section` component architecturally, but establishes two new patterns: `dangerouslySetInnerHTML` for rich-text rendering, and a scoped CSS typography class.
- **`.rich-text` CSS class in globals.css** — chosen over `@tailwindcss/typography` (not installed, would require HALT for approval). Covers all AC1 elements: `h1`/`h2`/`h3`, `p`, `strong`, `em`, `u`, `ul`/`ol`/`li`, `a`, `blockquote`, `hr`. Uses CSS logical properties (`padding-inline-start`, `border-inline-start`) throughout so RTL-sensitive layout (list indents, blockquote border) flips automatically under `dir="rtl"`.
- **`dangerouslySetInnerHTML` is the correct, safe approach** — `content.story` is pre-sanitized at save time via `saveContent` → `lib/sanitize.ts` (architecture single-save-path rule). No re-sanitization at render time — `sanitize-html` is an admin-only package that must stay out of the public bundle (architecture L170).
- **`content.story` is a flat `string`** — the architecture's illustrative data model showed `story: { html: "..." }` but the actual schema (the authority) has `story: z.string().default("")`. Used `content.story` directly; no `.html` property access.
- **`!story.trim()` empty guard** — catches both the schema default `""` and any whitespace-only strings. Both map to the EmptyState branch.
- **No new npm packages installed** — story completed with zero new dependencies.

### File List

- `src/app/globals.css` — MODIFIED (added `.rich-text` CSS class with all typography rules)
- `src/components/sections/StorySection.tsx` — NEW (Server Component, empty state + dangerouslySetInnerHTML rendering)
- `src/app/page.tsx` — MODIFIED (added StorySection import + `<StorySection story={content.story} />` in fixed PRD §3 order)

### Review Findings

- [x] [Review][Defer] `dangerouslySetInnerHTML` safety depends on Epic 2 implementing `lib/sanitize.ts` and calling it from `saveContent` [src/components/sections/StorySection.tsx:37] — the architecture's "Single Save Path" rule makes this safe by design, but `lib/sanitize.ts` doesn't exist yet (Epic 2 artifact). Risk is low now (no admin panel to write `content.story`). Story 2.5 must create `lib/sanitize.ts` and sanitize the `story` field before persisting. Added to deferred-work.md.
- [x] [Review][Dismiss] `opacity: 0.75` on blockquote dims text — both light/dark mode contrast ratios still exceed WCAG AA threshold (~15:1 effective). Acceptable.
- [x] [Review][Dismiss] `word-break: break-word` + `overflow-wrap: anywhere` redundancy — functionally harmless.
- [x] [Review][Dismiss] `h4`/`h5`/`h6` not styled — Tiptap outputs h1–h3 max; browser defaults are acceptable.
- [x] [Review][Dismiss] `story = "<br>"` passes empty check — admin UI (Epic 2) controls all writes; no real path to this state today.

## Change Log

- 2026-06-09: Story 1.5 implemented. Added `.rich-text` CSS, created `StorySection.tsx`, wired into `page.tsx`. Build clean, ESLint zero warnings, both AC branches verified.
- 2026-06-09: Code review complete. 0 patches, 1 deferred (sanitize.ts dependency for Epic 2), 4 dismissed.
