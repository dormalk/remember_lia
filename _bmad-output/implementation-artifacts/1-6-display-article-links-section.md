---
status: done
baseline_commit: 9698a1a32729c0c249794f89ab72d228a0f573fd
---

# Story 1.6: Display Article Links Section

Status: done

## Story

As a visitor,
I want to see a list of news articles related to the case, with titles and sources, that open in a new tab when I tap them,
So that I can read more from trusted external sources (FR6, FR12).

## Acceptance Criteria

1. **Given** a list of article links **When** the page loads **Then** each item displays its title and (if present) its source name, and tapping it opens the external URL in a new tab/window

2. **Given** an article link without a source name **When** it is displayed **Then** the source is simply omitted without leaving a visual gap

3. **Given** the article list is empty **When** the page loads **Then** `ArticlesSection` renders a designed empty state **And** tap targets are sized comfortably for mobile use

## Tasks / Subtasks

- [x] Task 1: Create `src/components/sections/ArticlesSection.tsx` (AC: 1, 2, 3)
  - [x] Subtask 1.1: Server Component, `{ articles: Article[] }` prop, `Article` type imported from `@/lib/content-schema`, `EmptyState` imported from `@/components/ui/EmptyState`
  - [x] Subtask 1.2: `const populated = articles.filter(a => a.url.trim() && a.title.trim())` — filters articles with empty URL or title before branching
  - [x] Subtask 1.3: Empty branch renders `EmptyState` with "הכתבות יתווספו בקרוב" and `ArticlesPlaceholderIcon` inline SVG
  - [x] Subtask 1.4: Populated branch: `<ul>` of `<li>` items each wrapping `<a href target="_blank" rel="noopener noreferrer">`
  - [x] Subtask 1.5: Card styling with `px-4 py-3` tap target, `rounded-xl border border-foreground/10`, hover + focus-visible states; `sourceName` rendered only when `article.sourceName.trim()` truthy (AC2)
  - [x] Subtask 1.6: `key={index}` for `<li>` items

- [x] Task 2: Wire `ArticlesSection` into the public page (AC: 1, 2, 3)
  - [x] Subtask 2.1: Added import and `<ArticlesSection articles={content.articles} />` below `<StorySection />` in `src/app/page.tsx`
  - [x] Subtask 2.2: `page.tsx` remains a Server Component — confirmed

- [x] Task 3: End-to-end verification (no automated test framework in this project) (AC: 1, 2, 3)
  - [x] Subtask 3.1: Empty state verified via existing dev server at localhost:3000 — EmptyState with Hebrew message renders
  - [x] Subtask 3.2: Throwaway preview with fixture array of 4 valid articles + 2 invalid (empty title, empty URL). DOM confirmed: 4 articles rendered (2 filtered), article-2 sourceName absent with no visual gap (React renders `null`), all links have `target="_blank" rel="noopener noreferrer"`, empty-state branch verified. Route deleted; zero trace via `git status --porcelain`
  - [x] Subtask 3.3: `npm run build` → TypeScript clean, `/` prerendered ✓. `npx eslint src` → zero warnings/errors ✓

## Dev Notes

### Critical context — internalize before writing any code

- **`ArticlesSection` is a Server Component** — no interactive state. Fourth of six `*Section` components. Pure prop-to-render mapping with a filtered list. Follow the established pattern from `LogoSection`, `SliderSection`, `StorySection`.

- **`Article` type** — import from `@/lib/content-schema`. Never redefine. Schema:
  ```ts
  // src/lib/content-schema.ts
  export const articleSchema = z.object({
    title: z.string().default(""),
    sourceName: z.string().default(""),
    url: z.string().default(""),
  });
  export type Article = z.infer<typeof articleSchema>;
  // content.articles: Article[] — default []
  ```
  Fields are `title`, `sourceName`, `url` (camelCase, matching the schema exactly).

- **Empty-URL/title guard — why filter before branching:**
  - The schema default for both `url` and `title` is `""`. An article object with empty `url` technically exists in the array but cannot fulfill AC1 (cannot open in a new tab). An article with empty `title` can't display a readable label.
  - The architecture says "missing/empty content represented as empty arrays (`[]`) or empty strings (`""`)... every section component renders a defined empty-state UI when its data is empty." The empty array is the intended empty state. An array with items whose `url` is `""` is a partially-populated state that should not render broken links.
  - The guard `articles.filter(a => a.url.trim() && a.title.trim())` treats such articles as absent, which is the closest approximation to the "never show a broken state" principle (architecture L334 anti-patterns).
  - Epic 2's `ArticlesEditor` should prevent saving articles with empty URL/title, but defense-in-depth here costs nothing.

- **`rel="noopener noreferrer"` is required — not optional:**
  - All `target="_blank"` links to external URLs must carry `rel="noopener noreferrer"`. `noopener` closes the `window.opener` back-reference (prevents opened page from redirecting the opener, a known phishing vector). `noreferrer` additionally suppresses the Referer header (privacy best practice). Both are required per OWASP recommendations for external links.

- **Mobile tap target sizing:**
  - Architecture NFR: "Mobile-first" — "adequate touch targets." WCAG 2.5.8 recommends ≥44×44px effective touch area. A `py-3` (12px) + `text-base` (16px × 1.5 = 24px line height) = ~48px total height, which meets the guideline. Full-width card with `px-4` padding gives a wide, comfortable tap target on 375px mobile screens.

- **Visual language — card style:**
  - Each article is a self-contained card, distinct from the `EmptyState`'s dashed-border style. Use solid border with low opacity (`border-foreground/10`) and very light background (`bg-foreground/[0.03]`) — matching the visual language already established for `EmptyState` primitives but without the dashed/rounded-2xl distinction. `rounded-xl` (less extreme than `rounded-2xl`) signals "tappable item" vs. "placeholder."
  - Source name (`article.sourceName`) sits below the title in smaller, muted text (`text-sm text-foreground/60`). The space between them comes from the `flex flex-col gap-1` on the `<a>` — so if `sourceName` is absent, the `<a>` just has one child (the title `<span>`) with no layout gap remaining. This satisfies AC2 exactly ("simply omitted without leaving a visual gap").

- **Component contract (props):**
  ```tsx
  import type { Article } from "@/lib/content-schema";
  
  export function ArticlesSection({ articles }: { articles: Article[] }) {
    // articles: Article[] — default [] in the live store today
    // each Article: { title: string, sourceName: string, url: string }
  }
  ```

- **File locations:**
  [Source: architecture.md "Complete Project Directory Structure" L374-398]
  - `src/components/sections/ArticlesSection.tsx` — NEW
  - `src/app/page.tsx` — MODIFIED (add import + `<ArticlesSection articles={content.articles} />` below `<StorySection />`)
  - Do NOT touch: `src/lib/content-schema.ts` (Article type already defined, no schema change), any other existing file

- **Previous Story Intelligence (Story 1.5 — `done`):**
  - `StorySection` established the per-section Server Component pattern. `ArticlesSection` is structurally simpler (no `dangerouslySetInnerHTML`, no CSS additions) — just a filtered list of links.
  - Throwaway preview route pattern: create `src/app/dev-preview-temp/page.tsx`, verify, fully delete, confirm via `git status --porcelain`. Reuse exactly.
  - `page.tsx` currently renders: `LogoSection → SliderSection → StorySection`. Append `ArticlesSection` immediately after.
  - No new npm packages, no schema changes, no CSS additions needed for this story.

- **References:**
  - [Source: _bmad-output/planning-artifacts/epics.md#Story 1.6 (L235-254)]
  - [Source: _bmad-output/planning-artifacts/epics.md#FR6 (L28), FR12 (L40)]
  - [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns (L213), "ArticlesSection.tsx → PRD §4.4" (L378)]
  - [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines (L298-307)]
  - [Source: _bmad-output/planning-artifacts/architecture.md#Anti-Patterns (L332-336)]
  - [Source: src/lib/content-schema.ts L19-23 — `articleSchema`, `Article` type]
  - [Source: src/components/ui/EmptyState.tsx — `{ message, icon?, className? }` props]
  - [Source: src/app/page.tsx — current render order to append after]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (claude-sonnet-4-6)

### Debug Log References

- `npx eslint src` — zero warnings/errors on first run. `npm run build` — TypeScript clean, `/` prerendered static. No issues encountered.
- Throwaway preview route verified 4 valid articles (2 invalid filtered) + empty state via curl against localhost:3000. Route deleted; zero trace confirmed.

### Completion Notes List

- **Filter before branching** — `articles.filter(a => a.url.trim() && a.title.trim())` guards against articles with empty URL (cannot open in new tab) or empty title (cannot display label). This is defensive coding consistent with the "never show a broken state" principle, applied before the empty-state branch check.
- **`rel="noopener noreferrer"` on all `target="_blank"` links** — required for all external links. `noopener` closes `window.opener` back-reference (phishing vector), `noreferrer` suppresses Referer header (privacy).
- **AC2 — no visual gap when sourceName absent** — conditional `{article.sourceName.trim() ? <span>...</span> : null}` inside a `flex-col gap-1` container. React renders `null` with no DOM node, so the gap between title and (absent) source simply doesn't exist.
- **Card visual language** — `rounded-xl border border-foreground/10 bg-foreground/[0.03]` with `hover:bg-foreground/[0.07]` and `focus-visible:outline` — consistent with project's low-contrast tinted-surface design token approach established in `EmptyState`.
- **No new npm packages, no schema changes, no CSS additions** — story completed with zero new dependencies.

### File List

- `src/components/sections/ArticlesSection.tsx` — NEW
- `src/app/page.tsx` — MODIFIED (added ArticlesSection import + JSX)

### Review Findings

- [x] [Review][Defer] `article.url` used in `<a href>` with only truthy check — `javascript:` URL is a stored-XSS vector [src/components/sections/ArticlesSection.tsx:44] — risk is zero today (no admin panel); Epic 2's save validation must add URL scheme enforcement for all URL fields in the schema. Added to deferred-work.md.
- [x] [Review][Dismiss] `key={index}` on static Server Component list — correct, no reordering in the public view.

## Change Log

- 2026-06-09: Story 1.6 implemented. Created `ArticlesSection.tsx`, wired into `page.tsx`. Build clean, ESLint zero warnings, all 3 AC branches verified.
- 2026-06-09: Code review complete. 0 patches, 1 deferred (URL scheme validation for Epic 2), 1 dismissed.
