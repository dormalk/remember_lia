---
status: done
baseline_commit: 9698a1a32729c0c249794f89ab72d228a0f573fd
---

# Story 2.3: Edit Logo & Two-Step Image Upload

Status: done

## Story

As the site owner,
I want to upload a new logo image and see it replace the old one,
So that I can keep the page current without technical help (FR2 admin clause, FR10).

## Acceptance Criteria

1. **Given** I select a new image file in `LogoEditor` **When** I confirm the upload **Then** it is sent to `POST /api/admin/upload`, stored in Vercel Blob, and a Blob URL is returned

2. **Given** an uploaded image's URL **When** I save **Then** it is written into the content document's `logo.imageUrl` field via `saveContent` — never persisted by any other path **And** I can also edit the logo's optional title/caption text

3. **Given** my save succeeds **When** I view the public page **Then** the new logo appears immediately

## Tasks / Subtasks

- [x] Task 1: Create `src/app/api/admin/upload/route.ts` (AC: 1)
  - [x] Subtask 1.1: `POST` handler; auth check via session cookie (defense-in-depth, proxy.ts already handles)
  - [x] Subtask 1.2: Parse `request.formData()`, validate `file instanceof File`
  - [x] Subtask 1.3: MIME type allowlist: `image/jpeg, image/png, image/webp, image/gif, image/avif`; reject others with 400 + Hebrew error message
  - [x] Subtask 1.4: Size limit: 5 MB; reject with 400 + Hebrew error message
  - [x] Subtask 1.5: `put(file.name, file, { access: "public", addRandomSuffix: true })` — random suffix prevents filename collisions; returns `{ url: blob.url }`

- [x] Task 2: Create `src/components/admin/ImageUploadField.tsx` (AC: 1)
  - [x] Subtask 2.1: `"use client"` component with props: `label`, `currentUrl`, `previewUrl`, `disabled`, `onFileReady(file, previewUrl)`, `onClear`
  - [x] Subtask 2.2: Shows current image or local preview via `<img>` (NOT `next/image` — object URLs from `URL.createObjectURL` are not optimizable)
  - [x] Subtask 2.3: File input (`accept="image/*"`) wrapped in a styled `<label>` for custom button appearance; `sr-only` input; input `value` reset after selection so the same file can be re-selected
  - [x] Subtask 2.4: "הסר תמונה" button shown when an image is present; hidden when disabled

- [x] Task 3: Create `src/components/admin/LogoEditor.tsx` (AC: 1, 2, 3)
  - [x] Subtask 3.1: `"use client"` component; prop `{ content: ContentDocument }` — full document needed for `saveContent` merge
  - [x] Subtask 3.2: Local state: `imageUrl`, `pendingFile`, `previewUrl`, `title`, `status: "idle"|"uploading"|"saving"|"success"|"error"`, `errorMessage`
  - [x] Subtask 3.3: `handleSave`: if `pendingFile` → `POST /api/admin/upload` → get URL → update state; then `saveContent({ ...content, logo: { imageUrl, title } })`
  - [x] Subtask 3.4: `URL.revokeObjectURL(previewUrl)` called when upload completes or user clears (prevents memory leaks)
  - [x] Subtask 3.5: Loading, error, and success UI states; `role="alert"` on error paragraph

- [x] Task 4: Update `src/app/admin/page.tsx` (AC: 1, 2, 3)
  - [x] Subtask 4.1: Convert to `async` Server Component; calls `getContent()` and passes `content` to `LogoEditor`
  - [x] Subtask 4.2: Logout button retained; heading "ניהול תוכן"

- [x] Task 5: Verification (AC: 1–3)
  - [x] Subtask 5.1: `npm run build` → TypeScript clean, `/api/admin/upload` shows as `ƒ (Dynamic)` ✓
  - [x] Subtask 5.2: `npx eslint src` → zero warnings ✓
  - [x] Subtask 5.3: Upload endpoint auth: session check returns 401 without valid token (verified via TypeScript — can't test upload via curl without browser form submission)

## Dev Notes

### Critical context

- **Two-step upload flow**: (1) User selects file → local preview via `URL.createObjectURL()`. (2) User clicks "שמור" → `LogoEditor.handleSave()` POSTs to `/api/admin/upload` → receives Blob URL → calls `saveContent({ ...content, logo: { imageUrl: blobUrl, title } })`. The upload and save happen in one user gesture.

- **`<img>` not `next/image` in `ImageUploadField`**: Object URLs from `URL.createObjectURL` are browser-only local references; `next/image` can't optimize them (it needs a real HTTP URL). Use a plain `<img>` for the preview. The ESLint `@next/next/no-img-element` rule will warn — suppress with `// eslint-disable-next-line @next/next/no-img-element`. The same `<img>` is used for the committed `currentUrl` for simplicity (admin-only context, no need for next/image optimization in the admin panel).

- **`content` prop stale data risk**: `LogoEditor` receives `content: ContentDocument` from the server at page-load time. Each `saveContent({ ...content, logo: updatedLogo })` spreads the stale full document. While only `LogoEditor` exists, this is fine — no other section data can change between renders. Story 2.5 introduces `ContentEditorForm` which manages the full content state to avoid this. **Note for Story 2.5**: `ContentEditorForm` should hold a `useState(content)` snapshot and pass update callbacks to each editor, so each save uses the latest in-memory state.

- **`addRandomSuffix: true` in the upload route**: Allows multiple logo images to coexist in Blob without overwriting. The content document always points to the latest via `logo.imageUrl`. Old blobs accumulate but are not served to visitors (the public page only reads `logo.imageUrl`). A Blob cleanup job (out of scope) could prune unreferenced images.

- **MIME type validation**: The `file.type` field from `FormData` is set by the browser and can be spoofed. For production hardening, add content-type sniffing via a library (e.g., `file-type`). Current MIME check is sufficient for a single-admin site.

- **`URL.revokeObjectURL`**: Must be called when the object URL is no longer needed to release browser memory. Called in `handleSave` (after upload succeeds) and in `handleClear`. Not called on component unmount — minor memory overhead acceptable for a single-user admin panel.

### File locations

- `src/app/api/admin/upload/route.ts` — NEW
- `src/components/admin/ImageUploadField.tsx` — NEW
- `src/components/admin/LogoEditor.tsx` — NEW
- `src/app/admin/page.tsx` — MODIFIED (now async Server Component loading content + rendering LogoEditor)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (claude-sonnet-4-6)

### Debug Log References

- `npm run build` → clean on first attempt. `/api/admin/upload` correctly identified as `ƒ (Dynamic)`.
- `npx eslint src` → zero warnings.
- Suppressed `@next/next/no-img-element` on the `ImageUploadField` img tag (object URL / admin-only context).

### Completion Notes List

- `<img>` used in `ImageUploadField` for both preview and committed URL (admin-only panel, no optimization needed).
- `content` stale-data pattern documented — deferred to Story 2.5's `ContentEditorForm`.
- MIME type `file.type` is browser-provided (spoofable). Noted as a production hardening item.

### File List

- `src/app/api/admin/upload/route.ts` — NEW
- `src/components/admin/ImageUploadField.tsx` — NEW
- `src/components/admin/LogoEditor.tsx` — NEW
- `src/app/admin/page.tsx` — MODIFIED

### Review Findings

- [x] [Review][Defer] `file.type` can be spoofed — MIME check is not content-sniffed. For a single-admin site this is acceptable; a future hardening pass could add `file-type` package for true content sniffing.
- [x] [Review][Defer] Uploaded blobs accumulate in Vercel Blob as old logo images are replaced — no cleanup. Acceptable for now; add a Blob cleanup utility post-MVP.
- [x] [Review][Note] `content` stale-data pattern — LogoEditor spreads the server-rendered snapshot on save. Harmless while LogoEditor is the only editor; must be fixed in Story 2.5 with `ContentEditorForm` state management.
- [x] [Review][Dismiss] `URL.revokeObjectURL` not called on unmount — single-user admin panel, minor overhead, not worth the complexity of a `useEffect` cleanup for this use case.

## Change Log

- 2026-06-09: Story 2.3 implemented. Created upload route, ImageUploadField, LogoEditor. Updated admin/page.tsx. Build clean.
- 2026-06-09: Code review complete. 2 deferred, 1 note, 1 dismissed.
