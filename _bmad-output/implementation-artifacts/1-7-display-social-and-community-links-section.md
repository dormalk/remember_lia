---
status: done
baseline_commit: 9698a1a32729c0c249794f89ab72d228a0f573fd
---

# Story 1.7: Display Social & Community Links Section

Status: done

## Story

As a visitor,
I want to see clear, recognizable buttons to join the WhatsApp group, Instagram, and Facebook page,
So that I can join the community and help spread awareness (FR7, FR12).

## Acceptance Criteria

1. **Given** populated social links **When** the page loads **Then** `SocialLinksSection` displays three buttons/links — WhatsApp, Instagram, Facebook — each with its platform's recognizable icon, opening the relevant URL in a new tab/external app

2. **Given** one or more social links are empty **When** the page loads **Then** only the populated links are shown (or a designed empty state is shown if none are populated), without broken or dead buttons

3. **Given** the visitor is on mobile **When** they tap a social link **Then** the platform's app opens directly if installed, or the web version opens in a browser tab

## Tasks / Subtasks

- [x] Task 1: Create `src/components/sections/SocialLinksSection.tsx` (AC: 1, 2, 3)
  - [x] Subtask 1.1: Server Component, `{ social: SocialLinks }` prop, `SocialLinks` type imported from `@/lib/content-schema`, `EmptyState` imported
  - [x] Subtask 1.2: `SOCIAL_PLATFORMS` array of 3 entries; `populated = SOCIAL_PLATFORMS.filter(p => social[p.key].trim())`; empty state when `populated.length === 0`
  - [x] Subtask 1.3: Populated branch renders filtered `<a>` links with `target="_blank" rel="noopener noreferrer"`
  - [x] Subtask 1.4: Branded button styling with `bg-[#25D366]`/`bg-[#E1306C]`/`bg-[#1877F2]`, `py-4` for tap target, `text-white`, focus-visible outline
  - [x] Subtask 1.5: Inline SVG icons for all 3 platforms — WhatsApp, Instagram, Facebook with brand paths

- [x] Task 2: Wire `SocialLinksSection` into the public page (AC: 1, 2, 3)
  - [x] Subtask 2.1: Added import and `<SocialLinksSection social={content.social} />` below `<ArticlesSection />` in `page.tsx`
  - [x] Subtask 2.2: `page.tsx` remains a Server Component

- [x] Task 3: End-to-end verification (AC: 1, 2, 3)
  - [x] Subtask 3.1: Empty state verified (live `content.social` all `""`) — EmptyState with "קישורי הקהילה יתווספו בקרוב"
  - [x] Subtask 3.2: Throwaway preview: all-3-populated (WhatsApp/Instagram/Facebook buttons with correct brand colors), partial (WhatsApp+Facebook only, Instagram absent — no dead button), empty state. DOM confirmed `target="_blank" rel="noopener noreferrer"`. Route deleted; zero trace
  - [x] Subtask 3.3: `npm run build` → TypeScript clean, `/` prerendered ✓. `npx eslint src` → zero warnings ✓

## Dev Notes

### Critical context — internalize before writing any code

- **`SocialLinks` type — schema fields:**
  ```ts
  // src/lib/content-schema.ts
  export const socialLinksSchema = z.object({
    whatsapp: z.string().default(""),
    instagram: z.string().default(""),
    facebook: z.string().default(""),
  });
  export type SocialLinks = z.infer<typeof socialLinksSchema>;
  ```
  All three fields default to `""`. `content.social` is a `SocialLinks` object, not an array. Access individual fields as `social.whatsapp`, `social.instagram`, `social.facebook`.

- **Platform icons — exact SVG path data to use:**

  ```tsx
  function WhatsAppIcon() {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    );
  }
  
  function InstagramIcon() {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    );
  }
  
  function FacebookIcon() {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }
  ```

- **Brand background colors (Tailwind arbitrary values):**
  - WhatsApp: `bg-[#25D366] hover:bg-[#22c05c]`
  - Instagram: `bg-[#E1306C] hover:bg-[#d4295f]`
  - Facebook: `bg-[#1877F2] hover:bg-[#1567d9]`

- **AC3 — "platform's app opens if installed":** This is handled entirely by the mobile browser. When the user taps an `<a href="https://wa.me/..." target="_blank">` link, the mobile browser recognizes the WhatsApp domain and passes control to the installed WhatsApp app (or opens the mobile web version if not installed). Same for Instagram and Facebook. No `whatsapp://` deep-link or `data-` attribute is needed — the standard `target="_blank"` pattern handles this correctly.

- **Hebrew labels for each platform:**
  - WhatsApp: `"הצטרפו לוואטסאפ"` ("Join WhatsApp")
  - Instagram: `"עקבו באינסטגרם"` ("Follow on Instagram")
  - Facebook: `"הצטרפו לפייסבוק"` ("Join Facebook")

- **`SOCIAL_PLATFORMS` as a typed const array** — define above the exported component:
  ```ts
  const SOCIAL_PLATFORMS: Array<{
    key: keyof SocialLinks;
    hebrewLabel: string;
    bgClass: string;
    icon: React.ReactNode;
  }> = [
    { key: "whatsapp", hebrewLabel: "הצטרפו לוואטסאפ", bgClass: "bg-[#25D366] hover:bg-[#22c05c]", icon: <WhatsAppIcon /> },
    { key: "instagram", hebrewLabel: "עקבו באינסטגרם", bgClass: "bg-[#E1306C] hover:bg-[#d4295f]", icon: <InstagramIcon /> },
    { key: "facebook", hebrewLabel: "הצטרפו לפייסבוק", bgClass: "bg-[#1877F2] hover:bg-[#1567d9]", icon: <FacebookIcon /> },
  ];
  ```
  Note: `icon: <WhatsAppIcon />` in a `const` array at module scope — this is JSX in a `.tsx` file at module initialization level. This is valid in React/Next.js (JSX is just a function call). The `ReactNode` type import is needed for the array type annotation (`import type { ReactNode } from "react"`).

- **File locations:**
  - `src/components/sections/SocialLinksSection.tsx` — NEW
  - `src/app/page.tsx` — MODIFIED

- **Previous Story Intelligence (Story 1.6 — `done`):** `ArticlesSection` established the "filter before branching" pattern and the `rel="noopener noreferrer"` requirement for external links. `SocialLinksSection` extends both patterns. No new CSS additions needed.

- **References:**
  - [Source: _bmad-output/planning-artifacts/epics.md#Story 1.7 (L256-274)]
  - [Source: src/lib/content-schema.ts L25-29 — `socialLinksSchema`, `SocialLinks` type]
  - [Source: src/components/sections/ArticlesSection.tsx — filter/external-link patterns]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (claude-sonnet-4-6)

### Debug Log References

- `npm run build` + `npx eslint src` — zero errors/warnings on first run.
- Throwaway preview verified all 3 scenarios via curl. Route deleted; zero trace.

### Completion Notes List

- **`SOCIAL_PLATFORMS` as module-scope constant with JSX** — `icon: <WhatsAppIcon />` in a `const` array at module scope is valid in `.tsx` (JSX is a function call). `ReactNode` type import required for the array type annotation.
- **Filter-before-branch pattern** — `SOCIAL_PLATFORMS.filter(p => social[p.key].trim())` reuses the established pattern from `ArticlesSection`. AC2's "only populated links shown" is handled cleanly at this filter step.
- **Brand colors via Tailwind arbitrary values** — `bg-[#25D366]` etc. Hover variants slightly darkened. WhatsApp green `text-white` has low contrast (2.9:1); deferred to Story 1.9 accessibility pass.
- **AC3 (mobile app opening)** — handled by `target="_blank"` + browser URL recognition. No special URL scheme or `data-` attributes needed.
- **`SocialPlaceholderIcon`** — share/network graph icon (3 circles connected by lines) — appropriate for a "social links" placeholder context.

### File List

- `src/components/sections/SocialLinksSection.tsx` — NEW
- `src/app/page.tsx` — MODIFIED (added SocialLinksSection import + JSX)

### Review Findings

- [x] [Review][Defer] `text-white` on WhatsApp green `#25D366` fails WCAG AA contrast (≈2.9:1) [src/components/sections/SocialLinksSection.tsx] — brand color exception; revisit in Story 1.9. Added to deferred-work.md.
- [x] [Review][Dismiss] `social[p.key]` URL scheme not validated — same class as Story 1.6 issue already in deferred-work.md. No duplicate entry.

## Change Log

- 2026-06-09: Story 1.7 implemented. Created `SocialLinksSection.tsx`, wired into `page.tsx`. Build clean, ESLint zero warnings, all 3 AC scenarios verified.
- 2026-06-09: Code review complete. 0 patches, 1 deferred (WCAG contrast for Story 1.9), 1 dismissed.
