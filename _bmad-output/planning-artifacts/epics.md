---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - 'docs/PRD-memorial-campaign-page.md'
  - '_bmad-output/planning-artifacts/architecture.md'
---

# JusticForLia - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for JusticForLia, decomposing the requirements from the PRD and Architecture document into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: The public page renders six fixed-order sections — Logo, Image Slider, Text/Story, Article Links, Social/Community Links (WhatsApp, Instagram, Facebook), and Contact/Help Info — always top-to-bottom in this exact order, identically on mobile and desktop (PRD §3)

FR2: The Logo section displays a centered logo image at the top of the page with an optional short title/caption beside it; the image is replaceable via the admin panel (PRD §4.1)

FR3: The Image Slider displays a gallery of photos of the memorialized person; it auto-advances at a fixed pace AND supports manual navigation (arrows/dots/swipe on mobile); manual interaction temporarily pauses/delays the auto-advance so it doesn't fight the user, then resumes; the user can fully stop the auto-advance (for accessibility); each image can carry an optional short caption (PRD §4.2)

FR4: The admin can add, remove, and reorder slider images and edit their captions through the admin panel (PRD §4.2, §5.2)

FR5: The Text/Story section displays free rich-text content (personal story, memorial words, event background) editable through a WYSIWYG rich-text editor that supports paragraphs, bold/italic/underline, lists, links, RTL/LTR alignment, icons/emojis, and advanced formatting (subheadings, blockquotes, dividers) (PRD §4.3)

FR6: The Article Links section displays a list of links to news/media articles, each with a title, optional source name, and an external URL that opens in a new tab; the admin can add/remove/edit/reorder these items (PRD §4.4, §5.2)

FR7: The Social/Community Links section displays three prominent join links — WhatsApp group, Instagram, Facebook — each shown with a recognizable platform icon and opening in an external tab/app; their URLs are editable via the admin panel (PRD §4.5)

FR8: The Contact/Help section displays ways to obtain help/support (organization name, phone, email, or link to a supporting organization's page); phone numbers render as tappable `tel:` links and email addresses as `mailto:` links; all fields are fully editable via the admin panel (PRD §4.6)

FR9: The admin panel is reachable at a separate route, `/admin`, gated by a login screen that compares the submitted password server-side against an environment variable (e.g. `ADMIN_PASSWORD`) — the password is never embedded in source code, exposed to the client bundle, or committed to the repository; a successful login establishes a persisted session (e.g. a secure, HTTP-only cookie) (PRD §5.1)

FR10: The admin panel allows editing the content of all six public sections (logo image, slider images + captions, story rich text, article links, social links, contact info) without changing their fixed display order (PRD §5.2)

FR11: Changes saved in the admin panel are reflected on the public page immediately (or after a refresh) (PRD §5.3)

FR12: Every section renders a designed, presentable empty/default state when its content has not yet been populated, since real content is expected to be entered gradually after launch through `/admin` (PRD §5.4)

### NonFunctional Requirements

NFR1: Mobile-first is the single most critical requirement — layout, load speed, tap-target sizing, and text readability must prioritize the mobile viewing experience, since the page is reached primarily by scanning a QR code from a phone; desktop/tablet support is secondary (PRD §6)

NFR2: Performance — fast loading on weak cellular connections, including image optimization and lazy loading for the slider (PRD §6)

NFR3: Accessibility — adequate color contrast, alternative text for images, a way to stop the auto-advancing slider, and screen-reader support (PRD §6, §4.2)

NFR4: Full Hebrew-language and RTL layout support throughout the page and the admin panel (PRD §6)

NFR5: Browser compatibility with common mobile browsers (Chrome, Safari) and desktop browsers (PRD §6)

NFR6: Basic security — the site is served over HTTPS, and free-text content entered through the admin panel is sanitized to prevent malicious-content injection (XSS) (PRD §6, §5.1)

NFR7: The admin login is protected by rate limiting to prevent automated password-guessing (brute force) (PRD §5.1 security note)

### Additional Requirements

- **Starter template (impacts Epic 1 / Story 1.1):** Architecture specifies `create-next-app` with Next.js 16.2.x as the project starter, initialized via `npx create-next-app@latest justice-for-lia --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` — TypeScript, Tailwind CSS, ESLint, App Router, `src/` layout, and `@/*` import alias all ship from this single command
- **Sole persistence layer:** Vercel Blob is the *only* external service — it stores both uploaded images AND all structured site content as one JSON document (`content.json`) at a stable, overwritable pathname (`addRandomSuffix: false`, `allowOverwrite: true`); no database or cache service is introduced
- **Canonical content schema:** `src/lib/content-schema.ts` defines a single Zod schema (and derived TS types) mirroring the six fixed sections — it is the only place the content shape is defined, imported by the public renderer, the admin forms, and the persistence layer alike
- **Single Save Path (critical pattern):** every content edit, regardless of which section it touches, must flow through exactly one Server Action, `saveContent(document)`, which validates the entire document against the Zod schema, sanitizes rich-text HTML, overwrites `content.json` in Blob, and calls `revalidatePath('/')` — parallel per-section save endpoints are explicitly forbidden
- **Two-step image upload:** files are uploaded via a dedicated Route Handler (`POST /api/admin/upload`) that returns a Blob URL; that URL is then referenced inside the content document and persisted through `saveContent` — these steps must not be conflated
- **Authentication & session:** server-side comparison of the submitted password against `process.env.ADMIN_PASSWORD`; on success, a signed/encrypted session cookie is issued via the `jose` library (HTTP-only, Secure, SameSite=Strict); Next.js Middleware (`middleware.ts`) guards every request under `/admin/**` and redirects unauthenticated requests to `/admin/login`
- **Rate limiting via platform, not code:** brute-force protection on the admin login is configured as a Vercel Firewall (WAF) dashboard rule (path-based regex match with a fixed-window request limit) — no rate-limiting package or external service is added to the codebase
- **Content sanitization:** rich-text HTML is sanitized server-side with `sanitize-html` before it is persisted or rendered, on every save — never trusted from the client
- **Rich text editor:** Tiptap (React/TypeScript/ProseMirror-based) is the chosen WYSIWYG editor, configured for RTL and extended to support icons/emoji and the PRD's advanced formatting needs (subheadings, blockquotes, dividers)
- **Caching & revalidation:** the public page uses Next.js Incremental Static Regeneration (ISR); every successful admin save calls `revalidatePath`/`revalidateTag` so the public page reflects changes immediately without a redeploy
- **Accessibility implementation rule (added during architecture validation):** every content image must use its existing `caption`/`title` field as its `alt` text; `SliderSection` must expose a visible pause/play control and respect `prefers-reduced-motion`; all interactive elements (slider nav, article/social/contact links) must be keyboard-operable with visible focus states; the chosen Tailwind theme must meet WCAG AA contrast
- **Deployment & environment:** the project deploys to Vercel via its native Git integration (push-to-deploy, no custom CI/CD files); `ADMIN_PASSWORD`, the session-signing secret, and Blob credentials (auto-injected by the Blob integration) are configured as Vercel Project Environment Variables, never committed to the repo (`.env.local` is gitignored, `.env.example` documents the required variables without real values)
- **Bundle separation:** admin-only code (rich-text editor, upload UI, management forms) is code-split away from the public bundle via the App Router's route-based splitting, so visitors who scan the QR code never download admin tooling

### UX Design Requirements

No standalone UX Design document exists for this project — interaction and visual requirements (mobile-first layout, RTL, slider behavior, empty states, accessibility) are captured directly in the Functional and Non-Functional Requirements above, sourced from the PRD and Architecture document.

### FR Coverage Map

FR1: Epic 1 - Six sections render in fixed order on the public page
FR2: Epic 1 (display) / Epic 2 (admin replacement of the logo image, delivered via FR10)
FR3: Epic 1 - Slider auto-advance, manual navigation, and pause/accessibility behavior
FR4: Epic 2 - Admin add/remove/reorder of slider images and captions
FR5: Epic 1 - Rich-text story rendering on the public page
FR6: Epic 1 (display) / Epic 2 (admin add/remove/edit/reorder of article links, delivered via FR10)
FR7: Epic 1 (display) / Epic 2 (admin update of social/community links, delivered via FR10)
FR8: Epic 1 (display) / Epic 2 (admin edit of contact details, delivered via FR10)
FR9: Epic 2 - Admin login and session handling
FR10: Epic 2 - Consolidated content-editing capability across all six public sections
FR11: Epic 2 - Saved admin changes reflected immediately on the public page
FR12: Epic 1 - Designed empty/default states for unpopulated content

NFR1: Epic 1 (primary — the public page is the dominant mobile surface) and Epic 2 (admin UI must also be usable on mobile)
NFR2: Epic 1 - Performance and loading on weak cellular networks
NFR3: Epic 1 - Accessibility of the public page (contrast, alt text, slider pause control, screen reader support)
NFR4: Epic 1 (public page RTL/Hebrew) and Epic 2 (admin UI RTL/Hebrew)
NFR5: Epic 1 - Browser compatibility for visitors
NFR6: Epic 2 - HTTPS (platform-level) and sanitization of admin-entered rich text
NFR7: Epic 2 - Rate limiting on the admin login

## Epic List

### Epic 1: Public Memorial & Awareness Page
A visitor who scans the QR-code sticker lands on a fast, mobile-first, RTL memorial page that displays the person's story, photos, related news coverage, ways to join the community, and how to get help — in the fixed order the family chose — and the page looks complete and trustworthy even before all content has been entered.

**FRs covered:** FR1, FR2 (display), FR3, FR5, FR6 (display), FR7 (display), FR8 (display), FR12
**NFRs covered:** NFR1 (primary), NFR2, NFR3, NFR4 (public page), NFR5

**Implementation notes:**
- Story 1.1 = project initialization via the starter command (`npx create-next-app@latest justice-for-lia --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`) plus a first deploy to Vercel — proves the pipeline end-to-end before anything is built on top of it
- Defines `src/lib/content-schema.ts` (the canonical Zod schema and derived TS types) — every later story depends on this single source of truth
- Builds `getContent()` reading from Vercel Blob with schema-default fallback, so the page renders correctly even against an empty/missing `content.json`
- Builds the six presentational `*Section` components and `app/page.tsx`, rendering them in the PRD's fixed order, each with a designed empty state
- Establishes the RTL/mobile-first layout shell (`layout.tsx` with `dir="rtl" lang="he"`, Tailwind config, `next/image`)

### Epic 2: Secure Admin Content Management
The site owner can log into `/admin` with their password and add, edit, reorder, and remove every piece of content on the page — logo, slider photos and captions, the memorial story (with rich formatting), article links, community links, and contact details — at any time after launch, including from their phone, with confidence that changes save safely and appear on the live page immediately.

**FRs covered:** FR4, FR9, FR10, FR11, plus the admin-editing clauses of FR2, FR6, FR7, FR8
**NFRs covered:** NFR6, NFR7, plus NFR4 and NFR1 as they apply to the admin UI

**Implementation notes:**
- Builds directly on Epic 1's `content-schema.ts` and section components (shared, never duplicated)
- Implements authentication (`lib/auth.ts`, `middleware.ts`, login/logout actions, `jose`-signed session cookie) and configures the Vercel Firewall rate-limiting rule on the login path
- Implements the single `saveContent` Server Action (validate → sanitize → write to Blob → revalidate) as the *only* content-mutation path, plus the two-step image-upload flow
- Builds the admin UI: `ContentEditorForm` orchestrator, one editor per section, and the Tiptap-based rich-text editor configured for RTL and icons/emoji
- This is where `ADMIN_PASSWORD`, the session-signing secret, and Blob credentials are configured for the first time as real Vercel Project Environment Variables

## Epic 1: Public Memorial & Awareness Page

A visitor who scans the QR-code sticker lands on a fast, mobile-first, RTL memorial page that displays the person's story, photos, related news coverage, ways to join the community, and how to get help — in the fixed order the family chose — and the page looks complete and trustworthy even before all content has been entered.

### Story 1.1: Initialize Project & Verify Deployment Pipeline

As a developer,
I want to scaffold the project with the approved Next.js starter command and confirm it deploys successfully to Vercel,
So that every subsequent story has a verified, working foundation to build on.

**Acceptance Criteria:**

**Given** the architecture's starter command
**When** it is run
**Then** a Next.js 16.2.x project with TypeScript, Tailwind CSS, ESLint, the App Router, `src/` layout, and the `@/*` import alias is created
**And** `app/layout.tsx` sets `<html dir="rtl" lang="he">`

**Given** the project is pushed to a Git repository connected to Vercel
**When** the push completes
**Then** Vercel automatically builds and deploys it with no custom CI/CD files
**And** the deployed placeholder page, opened on a mobile device, loads successfully over HTTPS

### Story 1.2: Define Canonical Content Schema & Safe Content Loading

As a developer,
I want one Zod schema describing all six sections' content, plus a `getContent()` function that reads `content.json` from Vercel Blob and safely falls back to schema defaults when it doesn't exist,
So that every section component always has typed, validated content to render — even before any real content has been entered (FR12).

**Acceptance Criteria:**

**Given** `src/lib/content-schema.ts`
**When** it is defined
**Then** it describes all six sections (logo, slider, story, articles, social, contact) with camelCase field names and empty-string/empty-array defaults — never `undefined`
**And** TypeScript types derived from the schema are exported as the single source of truth for content typing

**Given** `getContent()` is called and `content.json` does not yet exist in Blob
**When** it runs
**Then** it returns a fully valid content object built from the schema's defaults, without throwing

**Given** `getContent()` is called and a `content.json` exists
**When** it runs
**Then** it validates the document against the schema and returns typed, parsed content

### Story 1.3: Display Logo Section with Empty State

As a visitor who just scanned the QR code,
I want to immediately see the memorial page open with a centered logo at the top,
So that I recognize I've reached the right place (FR1, FR2, FR12).

**Acceptance Criteria:**

**Given** content with a populated logo
**When** the page loads
**Then** `LogoSection` renders the logo image centered at the top using `next/image`, with its `title`/`caption` field used as the image's `alt` text

**Given** content where the logo image is empty
**When** the page loads
**Then** `LogoSection` renders a clean, designed empty-state placeholder instead of a broken image or blank gap
**And** the logo area is sized and spaced for comfortable mobile viewing

### Story 1.4: Display Image Slider with Auto-Advance, Manual Navigation, and Pause Control

As a visitor,
I want to browse a gallery of the memorialized person's photos that moves on its own but also responds to my taps and swipes, and that I can pause if I want to,
So that I can view the photos at my own pace, on any device (FR3, FR12).

**Acceptance Criteria:**

**Given** slider content with multiple images
**When** the page loads
**Then** the images auto-advance at a fixed interval, and navigation arrows/dots are visible

**Given** the slider is auto-advancing
**When** the visitor swipes (mobile) or clicks an arrow/dot
**Then** the slider responds immediately to the manual action and temporarily suspends auto-advance before resuming
**And** each image's caption is shown and also used as the image's `alt` attribute

**Given** the slider is auto-advancing
**When** the visitor activates the pause control
**Then** auto-advance stops completely until the visitor resumes it

**Given** slider content is empty
**When** the page loads
**Then** `SliderSection` renders a designed empty state instead of an empty carousel

**Given** the visitor's system has `prefers-reduced-motion` enabled
**When** the slider renders
**Then** it does not auto-advance

### Story 1.5: Display Memorial Story with Rich-Text Formatting

As a visitor,
I want to read the personal story and memorial words with their intended formatting (headings, emphasis, lists, links, icons/emojis) and in the correct reading direction,
So that I can connect with the story as the family intended (FR5, FR12).

**Acceptance Criteria:**

**Given** story content with rich-text HTML
**When** the page loads
**Then** `StorySection` renders the sanitized HTML preserving paragraphs, bold/italic/underline, lists, links, headings, blockquotes, dividers, and inline icons/emojis
**And** Hebrew text flows right-to-left, with mixed Hebrew/Latin content (e.g., links, names) rendering correctly

**Given** the story content is empty
**When** the page loads
**Then** `StorySection` renders a designed empty state rather than a blank area

### Story 1.6: Display Article Links Section

As a visitor,
I want to see a list of news articles related to the case, with titles and sources, that open in a new tab when I tap them,
So that I can read more from trusted external sources (FR6, FR12).

**Acceptance Criteria:**

**Given** a list of article links
**When** the page loads
**Then** each item displays its title and (if present) its source name, and tapping it opens the external URL in a new tab/window

**Given** an article link without a source name
**When** it is displayed
**Then** the source is simply omitted without leaving a visual gap

**Given** the article list is empty
**When** the page loads
**Then** `ArticlesSection` renders a designed empty state
**And** tap targets are sized comfortably for mobile use

### Story 1.7: Display Social & Community Links Section

As a visitor,
I want to see clear, recognizable buttons to join the WhatsApp group, Instagram, and Facebook page,
So that I can join the community and help spread awareness (FR7, FR12).

**Acceptance Criteria:**

**Given** populated social links
**When** the page loads
**Then** `SocialLinksSection` displays three buttons/links — WhatsApp, Instagram, Facebook — each with its platform's recognizable icon, opening the relevant URL in a new tab/external app

**Given** one or more social links are empty
**When** the page loads
**Then** only the populated links are shown (or a designed empty state is shown if none are populated), without broken or dead buttons

**Given** the visitor is on mobile
**When** they tap a social link
**Then** the platform's app opens directly if installed, or the web version opens in a browser tab

### Story 1.8: Display Contact & Help Section

As a visitor who needs help or wants to reach out,
I want to see clear contact details that I can tap to call or email directly from my phone,
So that I can get assistance without having to copy and paste information (FR8, FR12).

**Acceptance Criteria:**

**Given** populated contact content
**When** the page loads
**Then** `ContactSection` displays the organization/contact name, and renders the phone number as a tappable `tel:` link and the email address as a tappable `mailto:` link

**Given** the visitor taps the phone number on a mobile device
**When** the `tel:` link is activated
**Then** the device's dialer opens pre-filled with the number

**Given** the contact content is empty
**When** the page loads
**Then** `ContactSection` renders a designed empty state

### Story 1.9: Assemble Full Page in Fixed Order with Mobile-First, Performance & Accessibility Polish

As a visitor arriving from the QR-code sticker,
I want the complete memorial page — all six sections, in the family's chosen order — to load quickly, look right on my phone, and be usable even with assistive technology,
So that my first experience of the page reflects the dignity and care the family intended (FR1, NFR1, NFR2, NFR3, NFR4, NFR5).

**Acceptance Criteria:**

**Given** a fresh page load
**When** all six sections render
**Then** they always appear top-to-bottom in the exact order: Logo → Slider → Story → Articles → Social Links → Contact (matching PRD §3), on both mobile and desktop

**Given** the page is opened on a mid-range phone over a throttled/slow cellular connection
**When** it loads
**Then** images are optimized and lazy-loaded (via `next/image`) and the page becomes usable quickly

**Given** any interactive element (slider controls, links, buttons)
**When** navigated via keyboard or screen reader
**Then** it is reachable, operable, and has a visible focus indicator
**And** the page's color palette meets WCAG AA contrast for body text and interactive elements

**Given** the page is opened in Chrome and Safari on mobile, and in a common desktop browser
**When** rendered
**Then** the layout, fonts, and RTL direction display correctly in all of them

## Epic 2: Secure Admin Content Management

The site owner can log into `/admin` with their password and add, edit, reorder, and remove every piece of content on the page — logo, slider photos and captions, the memorial story (with rich formatting), article links, community links, and contact details — at any time after launch, including from their phone, with confidence that changes save safely and appear on the live page immediately.

### Story 2.1: Secure Admin Authentication & Route Protection

As the site owner,
I want to log into `/admin` with my password and have my session persist securely,
So that only I can access content management — and brute-force attempts are blocked (FR9, NFR7).

**Acceptance Criteria:**

**Given** the login screen at `/admin/login`
**When** I submit the correct password
**Then** the server compares it against `process.env.ADMIN_PASSWORD`, issues a signed HTTP-only/Secure/SameSite=Strict session cookie via `jose`, and redirects me to `/admin`

**Given** an incorrect password
**When** it is submitted
**Then** access is denied with a clear error message and no session is created

**Given** I am not authenticated
**When** I request any `/admin/**` route
**Then** `middleware.ts` redirects me to `/admin/login`
**And** a Vercel Firewall rule limits repeated login attempts on the path within a fixed time window

**Given** I am logged in
**When** I select logout
**Then** my session cookie is cleared and I am returned to the login screen

### Story 2.2: Single Save Path for All Content Changes

As the site owner,
I want every edit I make — to any section — to be validated, sanitized, and saved through one consistent, safe process,
So that my changes are never lost, corrupted, or left half-saved (FR11, NFR6).

**Acceptance Criteria:**

**Given** any content edit submitted from the admin UI
**When** `saveContent(document)` runs
**Then** it validates the *entire* document against the shared Zod schema, sanitizes any rich-text HTML via `sanitize-html`, overwrites `content.json` in Blob at its stable pathname, and calls `revalidatePath('/')`

**Given** a submission that fails schema validation
**When** `saveContent` runs
**Then** it returns `{ success: false, error }` without writing to Blob, and the admin's in-progress edits are preserved on screen

**Given** a successful save
**When** it completes
**Then** the public page reflects the change immediately on next load, with no redeploy needed
**And** no Server Action or route other than `saveContent` writes to `content.json`

### Story 2.3: Edit Logo & Two-Step Image Upload

As the site owner,
I want to upload a new logo image and see it replace the old one,
So that I can keep the page current without technical help (FR2 admin clause, FR10).

**Acceptance Criteria:**

**Given** I select a new image file in `LogoEditor`
**When** I confirm the upload
**Then** it is sent to `POST /api/admin/upload`, stored in Vercel Blob, and a Blob URL is returned

**Given** an uploaded image's URL
**When** I save
**Then** it is written into the content document's `logo.imageUrl` field via `saveContent` — never persisted by any other path
**And** I can also edit the logo's optional title/caption text

**Given** my save succeeds
**When** I view the public page
**Then** the new logo appears immediately

### Story 2.4: Manage Slider Images — Add, Remove, Reorder, and Caption

As the site owner,
I want to add, remove, reorder, and caption slider photos,
So that I can keep the gallery fresh and meaningful over time (FR4, FR10).

**Acceptance Criteria:**

**Given** `SliderEditor`
**When** I add a new photo
**Then** it uploads via the two-step flow (upload → reference URL → `saveContent`) and appears in the gallery

**Given** existing slider images
**When** I remove one or drag to reorder them
**Then** the change is reflected in the array order saved to `content.json`
**And** I can add or edit each image's caption

**Given** I save
**When** the public page next loads
**Then** the slider shows my updated photos, order, and captions

### Story 2.5: Edit Story (Rich Text), Articles, Social Links, and Contact Info

As the site owner,
I want to edit the memorial story with a rich-text editor (including icons, headings, and advanced formatting), and manage article links, social links, and contact details,
So that I can fully maintain the page's substance over time (FR6, FR7, FR8 admin clauses; FR10).

**Acceptance Criteria:**

**Given** `RichTextEditor` (Tiptap, RTL-configured)
**When** I format text — bold/italic/lists/headings/blockquotes/links/icons-emoji
**Then** the resulting sanitized HTML is saved via `saveContent` and renders identically on the public page

**Given** `ArticlesEditor`
**When** I add, edit, remove, or reorder article links (title, source, URL)
**Then** the saved order and content match what is shown publicly

**Given** `SocialLinksEditor`
**When** I update the WhatsApp/Instagram/Facebook URLs
**Then** the public links update accordingly (e.g., to swap a WhatsApp group that has filled up)

**Given** `ContactEditor`
**When** I edit the name, phone, email, or notes
**Then** the public `tel:`/`mailto:` links reflect the new values
**And** every one of these edits funnels through the single `saveContent` action — no section has its own save endpoint

### Story 2.6: Trustworthy Mobile Editing — Loading States, Unsaved-Change Warnings, and Error Recovery

As the site owner editing from my phone,
I want to always know when something is loading, never lose unsaved work, and have a clear path to recover from errors,
So that managing the page feels safe and simple even without technical skill (NFR1, NFR4 for the admin UI).

**Acceptance Criteria:**

**Given** any async admin action (login, save, upload)
**When** it is in progress
**Then** an explicit pending indicator is shown via `useTransition`/`useFormStatus` — never a silent wait

**Given** unsaved edits in any editor
**When** I attempt to navigate away
**Then** I am warned about unsaved changes

**Given** a save or upload fails
**When** the error occurs
**Then** a retry-capable error message is shown and my in-progress edits remain intact — nothing is silently discarded
**And** the entire admin UI is laid out RTL/Hebrew and usable on a phone-sized screen
