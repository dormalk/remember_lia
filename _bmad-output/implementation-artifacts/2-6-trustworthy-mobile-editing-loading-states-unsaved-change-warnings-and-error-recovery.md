---
status: done
baseline_commit: N/A
---

# Story 2.6: Trustworthy Mobile Editing — Loading States, Unsaved-Change Warnings, and Error Recovery

Status: done

## Story

As the site owner editing from my phone,
I want to always know when something is loading, never lose unsaved work, and have a clear path to recover from errors,
So that managing the page feels safe and simple even without technical skill (NFR1, NFR4 for the admin UI).

## Acceptance Criteria

1. **Given** any async admin action (login, save, upload) **When** it is in progress **Then** an explicit pending indicator is shown via `useTransition`/`useFormStatus` — never a silent wait

2. **Given** unsaved edits in any editor **When** I attempt to navigate away **Then** I am warned about unsaved changes

3. **Given** a save or upload fails **When** the error occurs **Then** a retry-capable error message is shown and my in-progress edits remain intact — nothing is silently discarded **And** the entire admin UI is laid out RTL/Hebrew and usable on a phone-sized screen

## Tasks / Subtasks

- [x] Task 1: Create `src/hooks/useUnsavedChangesWarning.ts` (AC: 2)
  - [x] Subtask 1.1: `useUnsavedChangesWarning(isDirty: boolean)` hook — adds `beforeunload` listener (preventDefault + returnValue) when `isDirty`, removes on cleanup

- [x] Task 2: Wire `isDirty` tracking + warning into `LogoEditor.tsx` (AC: 2, 3)
  - [x] Subtask 2.1: `isDirty` state set `true` on file select, clear, or title change; reset to `false` after successful save
  - [x] Subtask 2.2: `useUnsavedChangesWarning(isDirty)`
  - [x] Subtask 2.3: Error state replaced with retry-capable banner (`role="alert"`, message + "נסה שוב" button calling `handleSave`)

- [x] Task 3: Wire `isDirty` tracking + warning into `SliderEditor.tsx` (AC: 2, 3)
  - [x] Subtask 3.1: `isDirty` set `true` on add/remove/move/update entry; reset to `false` after successful save
  - [x] Subtask 3.2: `useUnsavedChangesWarning(isDirty)`
  - [x] Subtask 3.3: Retry-capable error banner

- [x] Task 4: Wire `isDirty` tracking + warning into `ContentEditorForm.tsx` (AC: 2, 3)
  - [x] Subtask 4.1: `isDirty` set `true` on any of story/articles/social/contact `onChange`; reset to `false` after successful save
  - [x] Subtask 4.2: `useUnsavedChangesWarning(isDirty)`
  - [x] Subtask 4.3: Retry-capable error banner calling `handleSave`

- [x] Task 5: Verify pending-state coverage (AC: 1)
  - [x] Subtask 5.1: Login form already uses `useActionState` → `isPending` → "מתחבר..." button label (Story 2.1, no change needed)
  - [x] Subtask 5.2: LogoEditor/SliderEditor/ContentEditorForm already show explicit "שומר..."/"מעלה תמונה..." labels during async actions (Stories 2.3–2.5, no change needed)

- [x] Task 6: Verification
  - [x] Subtask 6.1: `npm run build` → TypeScript clean ✓
  - [x] Subtask 6.2: `npx eslint src` → zero warnings ✓

## Dev Notes

### Critical context

- **`beforeunload` warning**: Only covers full page unload/refresh/tab-close. Next.js App Router has no built-in route-change interception hook for client-side navigation; `beforeunload` is the standard, framework-agnostic mechanism and covers the realistic mobile scenario (closing tab/browser while editing).
- **Edits remain intact on error**: All editors already preserved local state on save failure (no `setDoc`/`setEntries` reset on error path) — only the retry UI was added.
- **`isDirty` reset**: Set to `false` only after `result.success`, mirroring `setStatus("success")`.
- **RTL/phone layout**: Already satisfied by existing admin page structure (`max-w-xl` container, stacked sections, Hebrew labels) — no changes needed for AC3's layout clause.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (claude-sonnet-4-6)

### Debug Log References

- `npm run build` → clean.
- `npx eslint src` → zero warnings.

### Completion Notes List

- New shared hook `useUnsavedChangesWarning` used by all three editors — avoids duplicating `beforeunload` listener logic three times.
- Retry banners reuse the existing `handleSave` function — no new error-handling logic needed, just an additional button wired to the same handler.
- AC1 (pending indicators) was already satisfied by prior stories' `useActionState`/explicit status labels — verified, no code changes required for that clause.

### File List

- `src/hooks/useUnsavedChangesWarning.ts` — NEW
- `src/components/admin/LogoEditor.tsx` — MODIFIED
- `src/components/admin/SliderEditor.tsx` — MODIFIED
- `src/components/admin/ContentEditorForm.tsx` — MODIFIED

### Review Findings

- [x] [Review][Note] AC1 specifies `useTransition`/`useFormStatus` as the mechanism for pending indicators. The codebase instead uses manual `useState<Status>` with explicit "שומר..."/"מעלה..."/"מתחבר..." labels (login form does use `useActionState`'s `isPending`, satisfying the literal requirement there). The manual-state approach in the editors achieves the same user-visible outcome (explicit, never-silent pending indicator) and was already established in Stories 2.3–2.5. Accepted as-is — refactoring three working editors to `useTransition` purely for mechanism-parity would be churn without a UX change.
- [x] [Review][Note] `useUnsavedChangesWarning` only guards `beforeunload` (tab close/refresh/external navigation). In-app navigation via Next.js `<Link>`/`router.push` to other routes is not intercepted — but the admin app has no other internal routes besides `/admin` and `/admin/login` (post-logout), so this gap has no practical surface today.
- [x] [Review][Note] Verified error paths in all three editors leave `entries`/`doc`/`title`/`imageUrl` state untouched — retry re-submits the exact in-memory state, satisfying "nothing is silently discarded."

## Change Log

- 2026-06-10: Story 2.6 implemented. Added unsaved-changes warning hook and retry-capable error banners across all three editors. Build and lint clean.
