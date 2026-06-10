---
status: done
baseline_commit: N/A
---

# Story 2.5: Edit Story (Rich Text), Articles, Social Links, and Contact Info

Status: done

## Story

As the site owner,
I want to edit the memorial story text (with rich formatting), manage article links, update social/community URLs, and update contact info,
So that the full public page content is manageable from the admin panel (FR2, FR5, FR6, FR7).

## Acceptance Criteria

1. **Given** `RichTextEditor` (Tiptap, RTL-configured) **When** I format text — bold/italic/underline/headings/lists/blockquotes/links **Then** the resulting sanitized HTML is saved via `saveContent` and renders identically on the public page

2. **Given** `ArticlesEditor` **When** I add, edit, remove, or reorder article links (title, sourceName, URL) **Then** the saved order and content match what is shown publicly

3. **Given** `SocialLinksEditor` **When** I update the WhatsApp/Instagram/Facebook URLs **Then** the public links update accordingly

4. **Given** `ContactEditor` **When** I edit the name, phone, email, or link **Then** the public `tel:`/`mailto:` links reflect the new values

5. **Given** all four editors are in `ContentEditorForm` **When** I click "שמור הכל" **Then** a single `saveContent()` call persists the full `ContentDocument` and `router.refresh()` re-fetches server components

## Tasks / Subtasks

- [x] Task 1: Create `src/components/admin/RichTextEditor.tsx` (AC: 1)
  - [x] Subtask 1.1: `"use client"`, Tiptap `useEditor` with StarterKit, Link, Underline extensions
  - [x] Subtask 1.2: RTL via `dir: "rtl"` in `editorProps.attributes`
  - [x] Subtask 1.3: Toolbar with bold/italic/underline/H1/H2/H3/bulletList/orderedList/blockquote/hr/link buttons
  - [x] Subtask 1.4: `onChange(html)` callback on `onUpdate`; `!editor` guard for loading state
  - [x] Subtask 1.5: Sync effect to update editor content when parent refreshes (post `router.refresh()`)

- [x] Task 2: Create `src/components/admin/ArticlesEditor.tsx` (AC: 2)
  - [x] Subtask 2.1: Local `Article[]` state; `addEntry`, `removeEntry`, `moveEntry` (↑/↓), `updateEntry`
  - [x] Subtask 2.2: Per-entry title, sourceName, url inputs; url input has `dir="ltr"`
  - [x] Subtask 2.3: `onChange(articles)` called on every state mutation

- [x] Task 3: Create `src/components/admin/SocialLinksEditor.tsx` (AC: 3)
  - [x] Subtask 3.1: Three URL inputs (whatsapp, instagram, facebook) with `dir="ltr"`
  - [x] Subtask 3.2: `onChange(social)` on each change

- [x] Task 4: Create `src/components/admin/ContactEditor.tsx` (AC: 4)
  - [x] Subtask 4.1: Four inputs: name (text), phone (tel, ltr), email (email, ltr), link (url, ltr)
  - [x] Subtask 4.2: `onChange(contact)` on each change

- [x] Task 5: Create `src/components/admin/ContentEditorForm.tsx` (AC: 1–5)
  - [x] Subtask 5.1: `"use client"`, `useState<ContentDocument>(content)` for full document
  - [x] Subtask 5.2: Renders RichTextEditor, ArticlesEditor, SocialLinksEditor, ContactEditor — each with typed `onChange`
  - [x] Subtask 5.3: Single "שמור הכל" button calls `saveContent(doc)` then `router.refresh()`
  - [x] Subtask 5.4: Saving/success/error states with Hebrew messages

- [x] Task 6: Wire `ContentEditorForm` into `src/app/admin/page.tsx` (AC: 1–5)
  - [x] Subtask 6.1: Import and render `<ContentEditorForm content={content} />` below SliderEditor

- [x] Task 7: Verification
  - [x] Subtask 7.1: `npm run build` → TypeScript clean ✓
  - [x] Subtask 7.2: `npx eslint src` → zero warnings ✓

## Dev Notes

### Critical context

- **Single Save Path**: All four editors update the `doc` state in `ContentEditorForm`; one "שמור הכל" button calls `saveContent(doc)` — no editor has its own save endpoint.
- **Tiptap `setContent` API in v2+**: Second arg is `SetContentOptions`, not boolean. Use `{ emitUpdate: false }` to prevent triggering `onUpdate` during sync.
- **`!editor` guard**: Tiptap's `useEditor` returns `null` on first render (async init). Render loading placeholder when `editor` is null — avoids `setState`-in-effect lint rule.
- **URL fields `dir="ltr"`**: Phone, email, URL inputs use `dir="ltr"` for correct LTR rendering inside RTL layout.
- **`router.refresh()`**: Called after each successful save so the server component (AdminPage) re-renders and passes fresh `content` to all editors.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (claude-sonnet-4-6)

### Debug Log References

- Build error 1: `ArticleLink` type used instead of `Article` — fixed by global replace.
- Build error 2: `editor` possibly null in `setLink()` inside Toolbar — fixed by early return guard.
- Build error 3: `setContent(story, false)` — second arg is `SetContentOptions` not boolean — fixed to `{ emitUpdate: false }`.
- Lint error 1: Unescaped `"` in RichTextEditor blockquote button and ContactEditor label — fixed with `{'"'}` and `{'\`דוא"ל\`'}`.
- Lint error 2: `setState` in effect (`setMounted`) — removed `mounted` state; use `!editor` guard instead.

### Completion Notes List

- Tiptap `useEditor` returns `null` until async init — use `!editor` as SSR/loading guard, not `useState(mounted)`.
- `ArticlesEditor` maintains its own `entries` state and calls parent `onChange` on every mutation — parent (`ContentEditorForm`) holds the single source of truth for the full `ContentDocument`.
- `ContentEditorForm` has one "שמור הכל" button — no per-section save buttons.

### File List

- `src/components/admin/RichTextEditor.tsx` — NEW
- `src/components/admin/ArticlesEditor.tsx` — NEW
- `src/components/admin/SocialLinksEditor.tsx` — NEW
- `src/components/admin/ContactEditor.tsx` — NEW
- `src/components/admin/ContentEditorForm.tsx` — NEW
- `src/app/admin/page.tsx` — MODIFIED

### Review Findings

- [x] [Review][Fix] `ContentEditorForm` called `saveContent(doc)` where `doc` is initialized from server snapshot and includes logo/slider. If LogoEditor saved a new logo first, ContentEditorForm would overwrite it on its next save. Fixed: changed to `saveContent({ ...content, story: doc.story, articles: doc.articles, social: doc.social, contact: doc.contact })` so `content` prop (current server state) provides logo/slider and local edits provide only the fields ContentEditorForm owns.
- [x] [Review][Fix] `editable: !disabled` in `useEditor` is set only on initialization — prop changes don't reactively update editability. User could type in editor while save is in progress. Fixed: added `useEffect` to call `editor.setEditable(!disabled)` when `disabled` prop changes.
- [x] [Review][Note] `window.prompt()` for link URL in RichTextEditor toolbar — acceptable for MVP single-user admin. Better inline modal UX deferred to Story 2.6.
- [x] [Review][Note] `ArticlesEditor` holds its own internal `entries` state; it stays in sync with `doc.articles` via `onChange` callbacks. Not a correctness issue since ContentEditorForm reads `doc.articles` (fed by ArticlesEditor callbacks) for save.

## Change Log

- 2026-06-09: Story 2.5 implemented. Created all 5 components, wired into admin page. Build and lint clean.
