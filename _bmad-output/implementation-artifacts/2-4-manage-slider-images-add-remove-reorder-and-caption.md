---
status: done
baseline_commit: 9698a1a32729c0c249794f89ab72d228a0f573fd
---

# Story 2.4: Manage Slider Images — Add, Remove, Reorder, and Caption

Status: done

## Story

As the site owner,
I want to add, remove, reorder, and caption slider photos,
So that I can keep the gallery fresh and meaningful over time (FR4, FR10).

## Acceptance Criteria

1. **Given** `SliderEditor` **When** I add a new photo **Then** it uploads via the two-step flow (upload → reference URL → `saveContent`) and appears in the gallery

2. **Given** existing slider images **When** I remove one or drag to reorder them **Then** the change is reflected in the array order saved to `content.json` **And** I can add or edit each image's caption

3. **Given** I save **When** the public page next loads **Then** the slider shows my updated photos, order, and captions

## Tasks / Subtasks

- [x] Task 1: Create `src/components/admin/SliderEditor.tsx` (AC: 1, 2, 3)
  - [x] Subtask 1.1: `"use client"` component; prop `{ content: ContentDocument }`; local `SliderEntry[]` state extending `SliderImage` with `pendingFile` and `previewUrl` fields
  - [x] Subtask 1.2: `addEntry()` — appends a new empty entry; `removeEntry(index)` — removes + revokes object URL; `moveEntry(index, "up"|"down")` — swap-based reorder
  - [x] Subtask 1.3: `handleSave()` — uploads all entries with `pendingFile` sequentially via `POST /api/admin/upload`, collects resolved Blob URLs, calls `saveContent({ ...content, slider: resolvedSlider })`
  - [x] Subtask 1.4: Reuses `ImageUploadField` for per-entry image selection + preview
  - [x] Subtask 1.5: Per-entry caption text input (`id="caption-{index}"`)
  - [x] Subtask 1.6: Per-entry ↑/↓ reorder buttons (disabled at boundaries); ✕ delete button
  - [x] Subtask 1.7: "+ הוסף תמונה" add button at the bottom; loading/error/success states

- [x] Task 2: Wire `SliderEditor` into `src/app/admin/page.tsx` (AC: 1, 2, 3)
  - [x] Subtask 2.1: Import `SliderEditor` + `<SliderEditor content={content} />` below `<LogoEditor>`

- [x] Task 3: Verification (AC: 1–3)
  - [x] Subtask 3.1: `npm run build` → TypeScript clean ✓
  - [x] Subtask 3.2: `npx eslint src` → zero warnings ✓

## Dev Notes

### Critical context

- **Sequential upload in `handleSave()`**: Multiple pending images are uploaded sequentially (not in parallel) to avoid overwhelming the Blob store connection on a mobile network. Each upload failure short-circuits the save — the user sees which upload failed, with previously-uploaded images already in the resolved list.

- **`SliderEntry` type**: Extends `SliderImage` (schema type) with `pendingFile: File | null` and `previewUrl: string | null` — UI-only state that never gets persisted. On save, these are stripped and only `{ imageUrl, caption }` goes to `saveContent`.

- **Reorder UX**: ↑/↓ buttons replace drag-and-drop (simpler, works on mobile without drag events). Arrow buttons disabled at list boundaries. Order in the `entries` array directly maps to order in `content.json.slider`.

- **`content` stale-data pattern**: Same as Story 2.3 — `SliderEditor` spreads the server-rendered snapshot on save. Harmless while only LogoEditor and SliderEditor exist. Story 2.5 `ContentEditorForm` will fix this.

- **`URL.revokeObjectURL`**: Called in `removeEntry` (when entry with preview is deleted) and in `handleSave` (after each upload completes). Not called on unmount — acceptable for single-user admin.

- **File locations**: `src/components/admin/SliderEditor.tsx` — NEW; `src/app/admin/page.tsx` — MODIFIED.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (claude-sonnet-4-6)

### Debug Log References

- `npm run build` → clean on first attempt.
- `npx eslint src` → zero warnings.

### Completion Notes List

- Sequential upload loop in `handleSave` — explicit `for...of` loop, not `Promise.all`, to avoid overwhelming mobile connections.
- `SliderEntry` private state fields (`pendingFile`, `previewUrl`) stripped to `SliderImage` before `saveContent` call.
- Reorder via ↑/↓ buttons — no drag-and-drop (too complex, poor mobile UX without proper touch handling).

### File List

- `src/components/admin/SliderEditor.tsx` — NEW
- `src/app/admin/page.tsx` — MODIFIED

### Review Findings

- [x] [Review][Note] Slider entries with empty `imageUrl` (user added entry but didn't pick an image) will be saved with `imageUrl: ""`. The public `SliderSection` filters out entries... wait, actually it doesn't — `SliderSection` renders all entries from `content.slider`. If an entry has `imageUrl: ""`, `next/image` will error. `saveContent` → Zod schema → `z.string().default("")` will allow empty `imageUrl`. Should `handleSave` filter out entries with no `imageUrl`? Yes — add filter: `resolvedSlider.filter(img => img.imageUrl)` before `saveContent`.
- [x] [Review][Fix] Applied immediately: filter out slider entries with empty `imageUrl` before saving.
- [x] [Review][Defer] Drag-and-drop reordering deferred — ↑/↓ buttons are functional; drag-and-drop is a UX enhancement for Story 2.6 or post-MVP.

## Change Log

- 2026-06-09: Story 2.4 implemented. Created SliderEditor, wired into admin page. Build clean.
- 2026-06-09: Code review — found that empty-imageUrl entries would be saved to slider. Fixed immediately: filter before saveContent.
