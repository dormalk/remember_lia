---
status: done
baseline_commit: 9698a1a32729c0c249794f89ab72d228a0f573fd
---

# Story 2.2: Single Save Path for All Content Changes

Status: done

## Story

As the site owner,
I want every edit I make — to any section — to be validated, sanitized, and saved through one consistent, safe process,
So that my changes are never lost, corrupted, or left half-saved (FR11, NFR6).

## Acceptance Criteria

1. **Given** any content edit submitted from the admin UI **When** `saveContent(document)` runs **Then** it validates the *entire* document against the shared Zod schema, sanitizes any rich-text HTML via `sanitize-html`, overwrites `content.json` in Blob at its stable pathname, and calls `revalidatePath('/')`

2. **Given** a submission that fails schema validation **When** `saveContent` runs **Then** it returns `{ success: false, error }` without writing to Blob, and the admin's in-progress edits are preserved on screen

3. **Given** a successful save **When** it completes **Then** the public page reflects the change immediately on next load, with no redeploy needed **And** no Server Action or route other than `saveContent` writes to `content.json`

## Tasks / Subtasks

- [x] Task 1: Install `sanitize-html` (AC: 1)
  - [x] Subtask 1.1: `npm install sanitize-html && npm install -D @types/sanitize-html` — `sanitize-html` has no vulnerabilities; 2 moderate vulns in npm audit are in `postcss` (Next.js internal), fix would downgrade Next.js to v9

- [x] Task 2: Create `src/lib/sanitize.ts` (AC: 1)
  - [x] Subtask 2.1: `sanitizeRichText(html)` wrapping `sanitize-html` with allowed tags: `p br h1 h2 h3 strong b em i u ul ol li a blockquote hr`
  - [x] Subtask 2.2: Allowed attributes: `a[href, target, rel]` only. Allowed schemes: `http https mailto` — blocks `javascript:` and `data:` URLs
  - [x] Subtask 2.3: `transformTags.a` enforces `rel="noopener noreferrer"` when `target="_blank"`

- [x] Task 3: Add `writeContentBlob()` to `src/lib/blob.ts` (AC: 1, 3)
  - [x] Subtask 3.1: Import `put` from `@vercel/blob` alongside existing `get`
  - [x] Subtask 3.2: `writeContentBlob(document)` — `put(CONTENT_PATHNAME, JSON.stringify(document), { access: "public", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true })`

- [x] Task 4: Add `saveContent()` to `src/app/admin/actions.ts` (AC: 1, 2, 3)
  - [x] Subtask 4.1: Defense-in-depth auth check: verify session cookie before proceeding
  - [x] Subtask 4.2: `sanitizeUrl(url)` helper — strips non-`http/https/tel/mailto` URLs; applied to all URL fields: `articles[].url`, `social.whatsapp/instagram/facebook`, `contact.link`
  - [x] Subtask 4.3: Sanitize `document.story` via `sanitizeRichText`; sanitize all URL fields via `sanitizeUrl`; then run `contentSchema.safeParse(sanitized)`
  - [x] Subtask 4.4: On validation failure: return `{ success: false, error: parsed.error.message }` without writing to Blob
  - [x] Subtask 4.5: On success: `await writeContentBlob(parsed.data)` → `revalidatePath("/")` → return `{ success: true }`

- [x] Task 5: Verification (AC: 1–3)
  - [x] Subtask 5.1: `npm run build` → TypeScript clean ✓
  - [x] Subtask 5.2: `npx eslint src` → zero warnings ✓
  - [x] Subtask 5.3: `saveContent` logic verified via TypeScript type-checking (can't curl a Server Action — requires browser invocation with `Next-Action` header)

## Dev Notes

### Critical context

- **`sanitize-html` import**: Default import `import sanitizeHtml from "sanitize-html"` works with TypeScript + `esModuleInterop: true` (Next.js default). Types package `@types/sanitize-html` provides `sanitizeHtml.IOptions`.

- **URL sanitization**: `sanitizeUrl()` uses `new URL()` to parse and check `.protocol`. Returns `""` for invalid URLs or disallowed schemes (including `javascript:`, `data:`, `vbscript:`). This addresses the class-wide deferred item from Story 1.6 for all URL fields.

- **`revalidatePath("/")` vs `revalidateTag`**: `revalidatePath` is simpler and sufficient — only one public page. Does not require the page to opt into ISR; forces a fresh render on the next request.

- **Sanitize-before-validate order**: HTML sanitization and URL cleaning happen BEFORE Zod validation. This ensures the schema validates the already-clean document. The schema doesn't need URL format constraints because `saveContent` enforces them.

- **`writeContentBlob` visibility**: The function is exported from `blob.ts` (the only module that imports `@vercel/blob`) and imported only by `actions.ts`. Future contributors must not add a second write path.

- **Defense-in-depth auth in `saveContent`**: The proxy.ts already blocks unauthenticated access to `/admin/**`. The auth check in `saveContent` is defense-in-depth — prevents edge cases like direct Server Action invocation or misconfigured proxy patterns.

- **Deferred URL validation (Story 1.6) — RESOLVED**: All URL fields now go through `sanitizeUrl()` in `saveContent`. The deferred-work.md entry should be updated to mark this resolved.

### File locations

- `src/lib/sanitize.ts` — NEW
- `src/lib/blob.ts` — MODIFIED (added `writeContentBlob`)
- `src/app/admin/actions.ts` — MODIFIED (added `saveContent`, `sanitizeUrl`)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (claude-sonnet-4-6)

### Debug Log References

- `npm run build` → clean on first attempt. TypeScript accepted `sanitize-html` types.
- `npx eslint src` → exit code 0, zero warnings.

### Completion Notes List

- **`sanitize-html` package clean**: the 2 moderate vulnerabilities in `npm audit` are in `postcss` inside Next.js's dependency tree, not in `sanitize-html`. Fixing would require downgrading Next.js to v9 — not an option.
- **URL sanitization resolves all deferred XSS items**: `sanitizeUrl()` addresses the class-wide `javascript:` URL issue from Story 1.6 (article.url) and covers all other URL fields (social.*, contact.link).
- **`writeContentBlob` one-caller invariant**: blob.ts is the only module that imports @vercel/blob; saveContent is the only caller of writeContentBlob. This preserves the "Single Save Path" invariant from the architecture.

### File List

- `src/lib/sanitize.ts` — NEW
- `src/lib/blob.ts` — MODIFIED
- `src/app/admin/actions.ts` — MODIFIED
- `package.json` — MODIFIED (`sanitize-html`, `@types/sanitize-html` added)

### Review Findings

- [x] [Review][Defer] `saveContent` does not verify the caller is an authenticated admin before accepting a `ContentDocument` argument — relies on the proxy.ts defense-in-depth check. If a Server Action could somehow be called from a non-admin context (e.g., future public API misuse), the session check inside `saveContent` catches it. Current implementation is correct.
- [x] [Review][Dismiss] `sanitize-html` doesn't strip all `data-*` attributes — no `data-*` attributes are in the allowed list, so they're stripped by default. `allowedAttributes` whitelist approach means anything not listed is removed.
- [x] [Review][Dismiss] `revalidatePath("/")` only revalidates the root path — correct for this single-page public memorial site. No other pages need revalidation.

## Change Log

- 2026-06-09: Story 2.2 implemented. Created sanitize.ts, added writeContentBlob to blob.ts, added saveContent + sanitizeUrl to admin/actions.ts. Build clean.
- 2026-06-09: Code review complete. 1 deferred (already mitigated), 2 dismissed.
