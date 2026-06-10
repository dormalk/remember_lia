---
status: done
baseline_commit: 9698a1a32729c0c249794f89ab72d228a0f573fd
---

# Story 1.8: Display Contact & Help Section

Status: done

## Story

As a visitor who needs help or wants to reach out,
I want to see clear contact details that I can tap to call or email directly from my phone,
So that I can get assistance without having to copy and paste information (FR8, FR12).

## Acceptance Criteria

1. **Given** populated contact content **When** the page loads **Then** `ContactSection` displays the organization/contact name, and renders the phone number as a tappable `tel:` link and the email address as a tappable `mailto:` link

2. **Given** the visitor taps the phone number on a mobile device **When** the `tel:` link is activated **Then** the device's dialer opens pre-filled with the number

3. **Given** the contact content is empty **When** the page loads **Then** `ContactSection` renders a designed empty state

## Tasks / Subtasks

- [x] Task 1: Create `src/components/sections/ContactSection.tsx` (AC: 1, 2, 3)
  - [x] Subtask 1.1: Server Component, `{ contact: ContactInfo }` prop, `ContactInfo` type from `@/lib/content-schema`, `EmptyState` imported
  - [x] Subtask 1.2: Empty state condition: `!contact.phone.trim() && !contact.email.trim() && !contact.name.trim() && !contact.link.trim()` → EmptyState "פרטי יצירת קשר יתווספו בקרוב"
  - [x] Subtask 1.3: Populated: render contact card with conditionally visible rows for name, phone (`tel:` link), email (`mailto:` link), link (external `<a>` with `target="_blank" rel="noopener noreferrer"`)
  - [x] Subtask 1.4: Phone `<a href="tel:...">` and email `<a href="mailto:...">` — tap targets ≥ 44px via `py-3` padding
  - [x] Subtask 1.5: Inline SVG icons for phone, email, external-link (small, `h-4 w-4`, `text-foreground/50`)

- [x] Task 2: Wire `ContactSection` into `page.tsx` (AC: 1, 2, 3)
  - [x] Subtask 2.1: Import + `<ContactSection contact={content.contact} />` below `<SocialLinksSection />` — last of six sections

- [x] Task 3: End-to-end verification (AC: 1, 2, 3)
  - [x] Subtask 3.1: Empty state verified via dev server
  - [x] Subtask 3.2: Throwaway preview with fixture including name, phone, email, link. Verified `href="tel:..."`, `href="mailto:..."`, link `target="_blank"`. Partial fixture (name only) verified that missing fields are omitted cleanly. Route deleted; zero trace
  - [x] Subtask 3.3: `npm run build` + `npx eslint src` → zero errors

## Dev Notes

### Critical context

- **`ContactInfo` schema:**
  ```ts
  export const contactSchema = z.object({
    name: z.string().default(""),
    phone: z.string().default(""),
    email: z.string().default(""),
    link: z.string().default(""),
  });
  export type ContactInfo = z.infer<typeof contactSchema>;
  ```

- **`tel:` and `mailto:` links**: `<a href={`tel:${contact.phone}`}>` and `<a href={`mailto:${contact.email}`}>`. No `target="_blank"` needed — these are native protocol links handled by the OS (dialer, mail app). The mobile browser opens the dialer app automatically.

- **`contact.link`** — a generic external URL (e.g., a website, petition link). Use `target="_blank" rel="noopener noreferrer"` same as ArticlesSection.

- **Partial population**: Each field rendered conditionally on `field.trim()`. No "empty gap" when a field is absent.

- **Empty state condition**: any non-empty field = populated; all empty = empty state.

- **File locations**: `src/components/sections/ContactSection.tsx` — NEW; `src/app/page.tsx` — MODIFIED.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (claude-sonnet-4-6)

### Debug Log References

- `npm run build` + `npx eslint src` → zero errors/warnings on first run.
- Throwaway preview verified all contact fields + partial fixture. Route deleted; zero trace.

### Completion Notes List

- All four fields (`name`, `phone`, `email`, `link`) conditionally rendered — partial population shows only available fields, no gaps.
- `tel:` and `mailto:` links open OS dialer/mail app on mobile — no `target="_blank"` needed.
- `contact.link` uses `target="_blank" rel="noopener noreferrer"` — same security requirement as all external links.
- Empty state condition requires ALL four fields to be empty (any single non-empty field = populated card shown).

### File List

- `src/components/sections/ContactSection.tsx` — NEW
- `src/app/page.tsx` — MODIFIED (added ContactSection import + JSX)

### Review Findings

- [x] [Review][Defer] `contact.phone` passed to `href="tel:..."` without normalization — spaces, dashes, parentheses are valid in `tel:` URIs (RFC 3966 allows them) but non-numeric characters beyond `+` and digits may cause issues on some dialers. Epic 2's ContactEditor should document the expected phone format. Low risk.
- [x] [Review][Defer] `contact.link` URL scheme not validated — same class as the Story 1.6 URL validation gap already in deferred-work.md. No duplicate entry needed.
- [x] [Review][Dismiss] Empty-state condition (`all four empty`) — a contact with name only (no phone/email) shows the populated card with just the name. This is correct — the name has value even without links.

## Change Log

- 2026-06-09: Story 1.8 implemented. Created `ContactSection.tsx`, wired into `page.tsx`. Build clean, ESLint zero warnings, all AC branches verified.
- 2026-06-09: Code review complete. 0 patches, 2 deferred (phone normalization, URL scheme — both Epic 2), 1 dismissed.
