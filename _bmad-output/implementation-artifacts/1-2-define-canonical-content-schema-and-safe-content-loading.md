---
baseline_commit: dc06bc6d3abef1ae91e66f696e0f222fc94e14fe
---

# Story 1.2: Define Canonical Content Schema & Safe Content Loading

Status: done

## Story

As a developer,
I want one Zod schema describing all six sections' content, plus a `getContent()` function that reads `content.json` from Vercel Blob and safely falls back to schema defaults when it doesn't exist,
so that every section component always has typed, validated content to render — even before any real content has been entered (FR12).

## Acceptance Criteria

1. **Given** `src/lib/content-schema.ts` **When** it is defined **Then** it describes all six sections (logo, slider, story, articles, social, contact) with camelCase field names and empty-string/empty-array defaults — never `undefined` — **And** TypeScript types derived from the schema are exported as the single source of truth for content typing
2. **Given** `getContent()` is called and `content.json` does not yet exist in Blob **When** it runs **Then** it returns a fully valid content object built from the schema's defaults, without throwing
3. **Given** `getContent()` is called and a `content.json` exists **When** it runs **Then** it validates the document against the schema and returns typed, parsed content

## Tasks / Subtasks

- [x] Task 1: Install canonical dependencies — these locked versions become permanent (AC: 1, 2, 3)
  - [x] Subtask 1.1: `npm install zod` and `npm install @vercel/blob` at repo root (latest stable as of this writing: zod `4.4.x`, `@vercel/blob` `2.4.x` — see Latest Tech Information). Record the EXACT versions `npm install` locks into `package.json`/`package-lock.json` in Completion Notes — per architecture.md they become canonical for the rest of the build, the same way Story 1.1 locked Next.js/React
  - [x] Subtask 1.2: Run `npm run build` to confirm no peer-dependency conflicts before writing any code

- [x] Task 2: Define the canonical content schema — single source of truth (AC: 1)
  - [x] Subtask 2.1: Create `src/lib/content-schema.ts`. Define one Zod object schema per section — `logoSchema`, `sliderImageSchema` + `slider: z.array(sliderImageSchema).default([])`, `story` (plain string), `articleSchema` + array, `socialLinksSchema`, `contactSchema`. Every field camelCase; every string field `.default("")`; every array field `.default([])`. Do NOT use bare `.optional()` where a default is required — empty must always serialize as `""`/`[]`, never `undefined`
  - [x] Subtask 2.2: Compose the section schemas into one top-level `export const contentSchema = z.object({ logo, slider, story, articles, social, contact })`
  - [x] Subtask 2.3: Export `export type ContentDocument = z.infer<typeof contentSchema>` (and per-section types, e.g. `ContactInfo`, as needed for future component props) — this is the ONLY place these types may be defined
  - [x] Subtask 2.4: Cross-checked each section's field set against the FRs in epics.md (PRD §4 isn't a separate artifact — the FR descriptions ARE the §4 content, quoted verbatim with PRD cross-references): logo `{ imageUrl, title }` (FR2: "logo image ... with an optional short title/caption"; epics confirms the literal field path `logo.imageUrl`), slider `{ imageUrl, caption }` (FR3, epics 1.4 AC), articles `{ title, sourceName, url }` (FR6: "title, optional source name, and an external URL"), social `{ whatsapp, instagram, facebook }` (FR7, matches architecture's own `whatsapp` naming example), contact `{ name, phone, email, link }` — extended the architecture's illustrative 3-field `contactSchema` example with a 4th `link` field because FR8 explicitly requires "...or link to a supporting organization's page" as one of the contact methods (the architecture's code sample appears under "Pattern Examples" illustrating the *shape pattern*, not a field-complete final spec — see Completion Notes for full reasoning)

- [x] Task 3: Implement the Blob read wrapper — the only module touching `@vercel/blob` (AC: 2, 3)
  - [x] Subtask 3.1: Created `src/lib/blob.ts` exporting `CONTENT_PATHNAME = "content.json"` (one stable, deterministic pathname — never randomly-suffixed, so the future `saveContent` can overwrite in place) and `readContentBlob()`. Inspected the installed `@vercel/blob@2.4.0` type definitions directly (`node_modules/@vercel/blob/dist/index.d.ts`) rather than guessing: `get(urlOrPathname, { access })` "Returns a promise that resolves to `{ stream, blob }` or `null` if not found" — exactly the not-found signal `getContent()` needs, with zero extra config (no `addRandomSuffix`/overwrite flags needed for reads — those govern writes, out of scope here). Used `access: "public"` since the memorial page's content is fully public with no auth. Reads the stream to text and `JSON.parse`s it
  - [x] Subtask 3.2: `readContentBlob()` returns `null` when `get()` returns `null` (not found) — does NOT throw. Any other failure (network/auth/malformed-stream) propagates naturally via the `await`/`JSON.parse`, matching the "propagate anything else" requirement
  - [x] Subtask 3.3: Implemented read-only, as scoped — no `put`/upload/write code added. `saveContent` and the upload Route Handler remain untouched for epic 2

- [x] Task 4: Implement `getContent()` in the content store (AC: 2, 3)
  - [x] Subtask 4.1: Created `src/lib/content-store.ts` exporting `async function getContent(): Promise<ContentDocument>`
  - [x] Subtask 4.2: `raw === null` (not found) → returns `contentSchema.parse({})`, i.e. every field resolves to its Zod `.default()`. Never throws
  - [x] Subtask 4.3: Found a document → `contentSchema.safeParse(raw)`. Empirically verified (via a throwaway `tsx` script, since deleted) that because every field carries a `.default()`, `safeParse` ALREADY fills in missing/older-version fields on success — no extra merge step is needed or correct to add (an extra `contentSchema.parse(rawFallback)` on the same raw data would just re-throw on the same violation). `safeParse` only fails on genuine type violations (corrupted data); that path falls back to full schema defaults — same graceful-degradation guarantee as "not found", since no part of a type-violating document can be trusted. Confirms the read-side-graceful vs write-side-loud asymmetry called out in Dev Notes
  - [x] Subtask 4.4: Exposes only `getContent`. No `saveContent`/`revalidatePath`/write path added — out of scope, reserved for epic 2's single-save-path Server Action

- [x] Task 5: Verify end-to-end (no test framework exists yet) (AC: 2, 3)
  - [x] Subtask 5.1: Confirmed — no automated test framework exists in this project (explicitly deferred post-MVP per architecture.md's Core Decisions). Did NOT introduce Jest/Vitest/etc.
  - [x] Subtask 5.2: **No live `BLOB_READ_WRITE_TOKEN`/Vercel session is available in this local environment** (checked `.env.local`, `.env.example`, `.vercel/`, shell env vars, and `npx vercel whoami` — all absent; this is an account-bound credential gap, the same class of handback Story 1.1 documented for GitHub/Vercel auth — must not fabricate credentials). Verified instead via a temporary, fully-restorable stub-and-restore technique on the REAL code: added a 4-line env-var-gated fixture branch to the top of `readContentBlob()` in `src/lib/blob.ts` (gated on a `_VERIFY_FIXTURE` env var that is never set in normal operation), saved an exact backup of the original file first, then ran a throwaway `tsx` script that called the REAL, unmodified `getContent()`/`content-store.ts` through `content-schema.ts` end-to-end. Scenario "not found" (`_VERIFY_FIXTURE=missing` → `readContentBlob` returns `null`) → confirmed `getContent()` returns a fully schema-defaulted `ContentDocument` (`{ logo: { imageUrl: "", title: "" }, slider: [], story: "", articles: [], social: {...all ""}, contact: {...all ""} }`) without throwing — AC#2 satisfied
  - [x] Subtask 5.3: Continuing the same real-code verification harness (no Blob dashboard access without credentials, so used controlled fixture JSON fed through the identical `JSON.parse` → `contentSchema.safeParse` path real Blob reads would take): (a) **valid full document** → `getContent()` returned the validated typed data as-is, all fields intact; (b) **older/partial document** (e.g. missing `social`/`contact`/some array-item fields) → `safeParse` succeeded and auto-filled every missing field with its schema `.default()` — confirming the "no extra merge step needed" design decision from Task 4.3 holds against realistic partial-document input, not just the empty-object case; (c) **corrupted/type-violation document** (wrong types on required string fields) → `safeParse` failed and `getContent()` degraded gracefully to full schema defaults, never throwing — AC#3 satisfied for both the valid and gracefully-degraded paths. All 4 scenarios (not-found, valid-full, older-partial, corrupted) printed PASS; final harness output: "ALL getContent() SCENARIOS VERIFIED — AC#2 and AC#3 satisfied, never throws."
  - [x] Subtask 5.4: Restored `src/lib/blob.ts` to its exact original implementation (verified byte-for-byte against the pre-edit backup, then deleted the backup) — the `_VERIFY_FIXTURE` stub branch is completely gone; the shipped file contains ONLY the real `@vercel/blob` `get()` call. Deleted the throwaway verification script and backup file (`_blob_orig_backup.txt`, `_getcontent_check_tmp.mts`) — zero throwaway code remains in the repo. Final gate: `npm run build` → compiled successfully, TypeScript clean, all routes static; `npx eslint src/lib` → zero warnings/errors

### Review Findings

- [x] [Review][Patch] `readContentBlob` lets `JSON.parse` throw on malformed/corrupted blob content, breaking the "never throws / always renders" guarantee [src/lib/blob.ts:24] — fixed: wrapped `JSON.parse` in try/catch, returning `null` on parse failure (treated identically to "not found" — both mean "nothing usable to render"), updated the docblock to document this. Verified via `npm run build`/`eslint` clean
- [x] [Review][Patch] `package.json` records `@vercel/blob`/`zod` with caret ranges (`^2.4.0`/`^4.4.3`) instead of exact pins, contradicting the "exact locked canonical version" requirement and the existing pinned `next`/`react`/`react-dom` style [package.json:12,16] — fixed: changed to exact pins `"2.4.0"`/`"4.4.3"`, ran `npm install` to regenerate `package-lock.json` accordingly (confirmed both lockfile root entries now show exact versions, no carets). Verified via `npm run build` clean
- [x] [Review][Defer] No logging/observability when `safeParse` fails and content silently degrades to schema defaults — a corrupted production `content.json` would be invisible [src/lib/content-store.ts:23] — deferred, pre-existing: project has no logging/observability infrastructure anywhere yet (no architecture mention, no error-tracking service); adding ad-hoc `console.error` now would be an unscoped, inconsistent addition. Revisit once the project adopts an observability pattern.

## Dev Notes

### Critical context — internalize before writing any code
- **`content-schema.ts` is the single, permanent source of truth** [Source: architecture.md "Shared Schema Rule" L248-249, L393, L419]. Every later story (1.3–1.9 rendering, 2.x admin/forms/save) imports types and validation from this exact file. Get the shape right now — changing it later means touching every section component that follows.
- **This is the FIRST story to install `@vercel/blob` and `zod`.** Whatever `npm install` locks into `package.json`/`package-lock.json` becomes canonical for the rest of the build; no agent may upgrade/downgrade later without updating architecture.md [Source: architecture.md L520, L532]. Document the exact locked versions in Completion Notes — mirror exactly how Story 1.1 documented its locked Next.js/React versions.
- **Module boundaries are strict and load-bearing** [Source: architecture.md L392-398, L404-421] — do not blur them:
  - `lib/content-schema.ts` — Zod schemas + derived TS types ONLY. No I/O, no Blob imports.
  - `lib/blob.ts` — the ONLY module permitted to import `@vercel/blob` directly.
  - `lib/content-store.ts` — the ONLY module that reads/writes the logical `content.json`; wraps `blob.ts`; validates with the shared schema on both read and (eventually) write; the only place ever allowed to call `revalidatePath`/`revalidateTag`.
- **Empty ≠ `undefined`** [Source: architecture.md L266, L335]: every missing/empty field must serialize as `""` or `[]` via Zod `.default(...)`. `undefined` is invalid JSON and breaks the "always-renderable" guarantee that every section component (stories 1.3+) depends on to decide when to show its empty-state UI.
- **camelCase everywhere, zero transformation layers** [Source: architecture.md L205-206, L213-216]: `content.json` keys, Zod schema keys, derived TS types, and eventual React props all share one shape with no mapping layer. Function names verb-first camelCase: `getContent`, not `fetchContent`/`loadContent`.
- **Scope discipline — do NOT build `saveContent` now.** The single save path is a Server Action that arrives with epic 2 [Source: architecture.md L271-272, L333]. Building it early risks diverging from its eventual single-save-path design (which must validate, sanitize, write, AND revalidate atomically). This story is read-only: schema + `getContent`.

### File locations (by-feature layout — no variance expected)
[Source: architecture.md L392-398, L220-246]
- `src/lib/content-schema.ts` — NEW
- `src/lib/blob.ts` — NEW
- `src/lib/content-store.ts` — NEW
- Nothing else changes. In particular, do NOT wire `getContent()` into `app/page.tsx` yet — that integration belongs to story 1.3+ (avoid scope creep into the next story's territory).

### Section shapes to model
Six section sub-schemas compose into one `contentSchema` [Source: epics.md Story 1.2 AC#1 L161; architecture.md L393]. Confirm exact field names against PRD §4 (Task 2.4), but the architecture's own canonical example shows the required pattern verbatim — mirror it for every section:
```ts
// architecture.md L314-319 — follow this pattern for every section, not just contact
export const contactSchema = z.object({
  name: z.string().default(""),
  phone: z.string().default(""),
  email: z.string().default(""),
});
```
Expected sections and their consumers (for naming/shape sanity-checks only — PRD §4 is the source of truth for exact fields):
1. **logo** → `LogoSection` (story 1.3): image URL + a title/caption field used as `alt` text
2. **slider** → `SliderSection` (story 1.4): array of `{ imageUrl, caption }` — caption doubles as `alt`
3. **story** → `StorySection` (story 1.5): a single rich-text HTML string (sanitization is `sanitize.ts`'s job in a later story — this schema only needs to validate it as a string)
4. **articles** → `ArticlesSection` (story 1.6): array of article link entries
5. **social** → `SocialLinksSection` (story 1.7): links per platform — whatsapp/instagram/facebook [Source: architecture.md L379]
6. **contact** → `ContactSection` (story 1.8): `{ name, phone, email }` exactly per the example above

### The validated-read pattern `getContent` must mirror
[Source: architecture.md L322-329 — shown for `saveContent`, illustrating the `safeParse` idiom this story's read path must use]
```ts
const parsed = contentSchema.safeParse(doc);
if (!parsed.success) return { success: false, error: "Invalid content" };
```
Critical asymmetry: `saveContent` (future story) REJECTS invalid input loudly. `getContent` (this story) must NEVER reject — on `safeParse` failure or "not found", it degrades gracefully to defaults so the public page always renders something complete. Read-side failure = graceful; write-side failure = loud. Don't conflate the two.

### Testing standards
- No automated test framework exists in this project yet — explicitly deferred post-MVP given the modest scope [Source: architecture.md L401 area / Core Decisions]. Do not introduce one. Verify per Task 5 (manual, against the real connected Blob store), then delete all throwaway verification code before marking the story done.
- If/when a framework is introduced later, co-locate `*.test.tsx` next to the component or mirror `src/` under `tests/` [Source: architecture.md L401] — informational only, not actionable now.

### Previous Story Intelligence (Story 1.1 — `done`)
[Source: 1-1-initialize-project-and-verify-deployment-pipeline.md Completion Notes / File List]
- **Canonical versions locked so far**: Next.js `16.2.7`, React `19.2.4`, React DOM `19.2.4`, TypeScript `^5`, Tailwind CSS `^4`, ESLint `^9`/`eslint-config-next 16.2.7`. This story extends that locked set with `zod` and `@vercel/blob` — follow the exact same "record what `npm install` actually locked" discipline.
- `tsconfig.json` resolves `@/*` → `./src/*` — import as `@/lib/content-schema`, `@/lib/content-store`, etc.
- `npm run build` (zero type/lint errors) was Story 1.1's final verification gate before marking done — use it the same way here, after each major step and again at the very end.
- Story 1.1's code review caught a gap (Latin-only font on a Hebrew site) that traced back to not cross-checking the actual PRD requirement closely enough. Lesson baked into Task 2.4 above: validate the schema's field set against PRD §4 directly, not just the epics' summarized AC text.
- Git: work lands on `master` (Story 1.1's commit was `d954a19`); no special branching strategy in use.

### Latest Tech Information (researched 2026-06-08)
- **`zod`**: latest stable is **v4.4.x**. Install with `npm i zod`. Zod v4 is a major version with breaking changes from v3, but every API this story needs — `z.object()`, `.default("")`/`.default([])`, `z.infer<typeof schema>`, `.safeParse()`/`.parse()` — is stable, idiomatic v4 and matches the architecture's own `contactSchema`/`safeParse` example verbatim. One v4-specific nuance to be aware of: `.default()` combined with `.optional()`/`.partial()` now always applies the default even when the key is absent (v3 behaved differently) — not a concern here since every field in this schema gets a hard `.default(...)`, never bare `.optional()`. [Source: zod.dev/v4 release notes; colinhacks/zod migration guide]
- **`@vercel/blob`**: latest stable is **v2.4.x**. Install with `npm i @vercel/blob`. Confirm the exact current read-by-pathname call shape against the live docs at `vercel.com/docs/vercel-blob/using-blob-sdk` when implementing — SDK minor versions have shifted defaults like `addRandomSuffix` before, and getting this wrong would silently break the "stable, overwritable pathname" requirement that the future `saveContent` depends on. The non-negotiable constraint either way: `content.json` lives at ONE deterministic pathname that can be overwritten in place — never a randomly-suffixed one. [Source: vercel.com/docs/vercel-blob/using-blob-sdk]

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2: Define Canonical Content Schema & Safe Content Loading (L151-170)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Shared Schema Rule (L248-249)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Content Document Conventions (L264-267)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns (L203-217)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Pattern Examples — contactSchema/saveContent (L312-329)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure (L392-398)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Boundaries (L418-421)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Validation Issues Addressed — canonical version-locking rule (L526-532)]
- [Source: _bmad-output/implementation-artifacts/1-1-initialize-project-and-verify-deployment-pipeline.md#Completion Notes List / File List]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (claude-sonnet-4-6)

### Debug Log References

- `npx --yes tsx _getcontent_check_tmp.mts` — ran the real `getContent()`/`content-store.ts`/`blob.ts`/`content-schema.ts` chain through 4 fixture scenarios (not-found, valid-full, older-partial, corrupted/type-violation); all 4 printed `PASS`, final line: "ALL getContent() SCENARIOS VERIFIED — AC#2 and AC#3 satisfied, never throws." Script and its stub hook were deleted afterward (Subtask 5.4)
- `npm run build` (final gate, post-restoration) — compiled successfully, TypeScript clean, all routes static
- `npx eslint src/lib` (final gate, post-restoration) — zero warnings/errors

### Completion Notes List

- **Canonical versions locked** (per Subtask 1.1 — these become permanent for the rest of the build, mirroring how Story 1.1 locked Next.js/React): `npm install zod @vercel/blob` locked **`zod@4.4.3`** and **`@vercel/blob@2.4.0`** into `package.json`/`package-lock.json`. `npm run build` confirmed zero peer-dependency conflicts (Subtask 1.2)
- **Schema field-naming decisions cross-checked against FRs** (Subtask 2.4): logo `{ imageUrl, title }` (FR2 + epics' literal `logo.imageUrl` path), slider `{ imageUrl, caption }` (FR3 + epics 1.4 AC), articles `{ title, sourceName, url }` (FR6: "title, optional source name, and an external URL"), social `{ whatsapp, instagram, facebook }` (FR7, matches architecture's own naming example), contact `{ name, phone, email, link }` — extended the architecture's illustrative 3-field `contactSchema` example with a 4th `link` field because **FR8 explicitly requires** "...or link to a supporting organization's page" as a contact method; the architecture's code sample appears under "Pattern Examples" illustrating the *shape pattern*, not a field-complete final spec. Flagging this judgment call transparently for the reviewer
- **Critical Zod v4 nested-default bug found and fixed**: `logoSchema.default({})` (and the analogous `social`/`contact` cases) produced a bare `{}` rather than the section schema's own filled defaults (`{ imageUrl: "", title: "" }`) — Zod v4's object-level `.default()` does NOT recursively re-run the inner schema's field-level `.default()`s on the literal value provided. Discovered via a throwaway verification script (since deleted). Fixed by switching to `.default(() => logoSchema.parse({}))` (and equivalents for `social`/`contact`), which re-parses an empty object through the full section schema so every nested field gets its own default. This was essential to the "empty ≠ undefined, every field always `""`/`[]`" guarantee (architecture.md L266, L335) — without the fix, `getContent()` would have returned `logo: {}` instead of `logo: { imageUrl: "", title: "" }` whenever the document was missing or the `logo` key was absent
- **`safeParse` already auto-fills missing/older fields** (Subtask 4.3): empirically verified (throwaway script, deleted) that because every field in every section schema carries a `.default(...)`, `contentSchema.safeParse(raw)` fills in missing/older-version fields ON SUCCESS — no extra merge step is needed or correct. This also meant the initial fallback-on-failure logic needed correction: calling `contentSchema.parse(raw)` again on data that had JUST failed `safeParse` would simply re-throw on the same type violation. Corrected to fall back to `contentSchema.parse({})` (full schema defaults) on `safeParse` failure — matching the same graceful-degradation guarantee as the "not found" path, since no part of a type-violating document can be trusted (read-side-graceful vs write-side-loud asymmetry per Dev Notes)
- **`@vercel/blob@2.4.0` `get()` signature confirmed by reading the installed type definitions directly** (`node_modules/@vercel/blob/dist/index.d.ts`) rather than trusting possibly-stale web search results: `get(urlOrPathname, { access })` resolves to `{ stream, blob }` or `null` if not found — exactly the not-found signal `getContent()` needs, with `access: "public"` (the memorial page's content is fully public, no auth) and zero extra config (no `addRandomSuffix`/overwrite flags — those govern writes, out of scope for this read-only story)
- **Task 5 verification — no live Blob credentials available locally**: Checked `.env.local`, `.env.example`, `.vercel/`, shell env vars, and `npx vercel whoami` — no `BLOB_READ_WRITE_TOKEN` or active Vercel session exists in this environment. This is an account-bound credential gap, the same class Story 1.1 flagged for GitHub/Vercel auth — fabricating credentials was not an option. **Pivoted to a stub-and-restore technique**: backed up the real `src/lib/blob.ts`, temporarily added a 4-line env-var-gated fixture branch to `readContentBlob()`, ran the REAL (unmodified elsewhere) `getContent()` chain through 4 controlled scenarios via a throwaway `tsx` script — all 4 passed (see Debug Log) — then restored `blob.ts` to its byte-for-byte original content and deleted all throwaway artifacts. This exercised the real `content-schema.ts` → `content-store.ts` → `blob.ts` wiring end-to-end and gives genuine confidence AC#2/AC#3 are satisfied; it does not, however, replace a final check against the live connected Vercel Blob store, which requires `BLOB_READ_WRITE_TOKEN`/Vercel project access that only Dorma can provide (see chat handoff note)
- **Module boundaries respected**: `content-schema.ts` contains zero I/O (Zod schemas + types only); `blob.ts` is the only module importing `@vercel/blob`; `content-store.ts` is the only module importing `blob.ts`/calling `readContentBlob`. No `saveContent`/`revalidatePath`/write path was added — correctly deferred to epic 2 per scope discipline (Subtask 3.3, 4.4)

### File List

- `src/lib/content-schema.ts` (NEW) — Zod schemas (`logoSchema`, `sliderImageSchema`, `articleSchema`, `socialLinksSchema`, `contactSchema`, `contentSchema`) and derived TS types (`Logo`, `SliderImage`, `Article`, `SocialLinks`, `ContactInfo`, `ContentDocument`)
- `src/lib/blob.ts` (NEW) — `CONTENT_PATHNAME` constant + `readContentBlob()`; the only module importing `@vercel/blob`
- `src/lib/content-store.ts` (NEW) — `getContent()`; the only module reading the logical `content.json`, validates via `contentSchema`
- `package.json` (MODIFIED) — added `zod@4.4.3`, `@vercel/blob@2.4.0` as canonical, locked dependencies
- `package-lock.json` (MODIFIED) — lockfile entries for the above

## Change Log

| Date | Change | Author |
| --- | --- | --- |
| 2026-06-08 | Implemented Story 1.2: created `content-schema.ts`, `blob.ts`, `content-store.ts`; locked `zod@4.4.3` and `@vercel/blob@2.4.0`; verified `getContent()` end-to-end via stub-and-restore technique (no live Blob credentials available locally); all tasks complete, build/lint clean, status → review | Claude Sonnet 4.6 (Dev Agent) |
| 2026-06-08 | Code review (3-layer adversarial): 2 patch findings fixed — `readContentBlob` now catches malformed-JSON parse failures and returns `null` instead of throwing (closes a real "never throws" gap); `package.json` switched from caret ranges to exact pins (`2.4.0`/`4.4.3`) matching the "locked canonical version" rule, lockfile regenerated. 1 finding deferred (no logging/observability infra exists yet). 13 findings dismissed as false positives/out-of-scope/by-design (incl. a Blind-Hunter claim about the `@vercel/blob` API surface, empirically refuted against the installed SDK's type definitions). Status → done | Claude Sonnet 4.6 (Review Agent) |
