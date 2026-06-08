---
baseline_commit: 6a65214d696ffeb1bdc6d60fa4314cc820378796
---

# Story 1.1: Initialize Project & Verify Deployment Pipeline

Status: done

## Story

As a developer,
I want to scaffold the project with the approved Next.js starter command and confirm it deploys successfully to Vercel,
so that every subsequent story has a verified, working foundation to build on.

## Acceptance Criteria

1. **Given** the architecture's starter command, **when** it is run, **then** a Next.js 16.2.x project is created with TypeScript, Tailwind CSS, ESLint, the App Router, `src/` layout, and the `@/*` import alias — **and** `src/app/layout.tsx` sets `<html dir="rtl" lang="he">`. [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1]
2. **Given** the project is pushed to a Git repository connected to Vercel, **when** the push completes, **then** Vercel automatically builds and deploys it with no custom CI/CD files — **and** the deployed placeholder page, opened on a mobile device, loads successfully over HTTPS. [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1]

## Tasks / Subtasks

- [x] Task 1: Scaffold the Next.js project at the repo root (AC: #1)
  - [x] Resolve the directory layout conflict FIRST — see "Project Structure Notes" below; the repo root already contains `.git`, `.claude/`, `_bmad/`, `_bmad-output/`, `docs/`
  - [x] Run the architecture-approved starter command, adapted to target the current directory instead of creating a nested `justice-for-lia/` folder: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` (if the CLI refuses to scaffold into a non-empty directory, scaffold into a throwaway sibling folder and move every generated file/folder — `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `eslint.config.mjs`, `public/`, `src/`, `AGENTS.md`, etc. — into the repo root, **merging** `.gitignore` rather than overwriting it, and leaving `.git/`, `.claude/`, `_bmad/`, `_bmad-output/`, `docs/` untouched)
  - [x] Confirm `package.json` shows Next.js `16.2.x`, TypeScript, Tailwind CSS, ESLint, App Router (`src/app/`), and that `@/*` resolves via `tsconfig.json` `paths`
- [x] Task 2: Apply the RTL/Hebrew layout shell (AC: #1)
  - [x] Edit `src/app/layout.tsx`: set `<html lang="he" dir="rtl">` on the root `<html>` element
- [x] Task 3: Verify the project runs locally (AC: #1)
  - [x] `npm run dev` starts without errors; the placeholder page renders right-to-left
  - [x] `npm run build` completes successfully with no type or lint errors
- [x] Task 4: Push to Git and verify the Vercel deployment pipeline end-to-end (AC: #2)
  - [x] Commit the scaffolded project to the existing local Git repo (currently branch `master`, one commit "update code", **no remote configured**)
  - [x] Connect the repo to a Vercel project via Vercel's native Git integration (push-to-deploy) — this requires the user's GitHub/Vercel account access; if the agent cannot perform account-bound actions, hand this step back to Dorma with clear instructions rather than guessing at URLs or fabricating credentials
  - [x] Confirm Vercel auto-builds and deploys on push with **no** custom CI/CD config files added (no `.github/workflows/`, no `vercel.json` build overrides)
  - [x] Open the deployed URL on a mobile device/viewport and confirm it loads over **HTTPS** and renders right-to-left correctly

### Review Findings

- [x] [Review][Patch] Hebrew font subset gap — RESOLVED [src/app/layout.tsx:2,5-8,33; src/app/globals.css:11,25] — Dorma chose to fix it now rather than defer. Replaced the Latin-only `Geist` sans with `Heebo` (`subsets: ["hebrew", "latin"]`, `next/font/google`) — Heebo is a Google Font purpose-built for Hebrew with full Hebrew + Latin coverage, the standard professional choice for Hebrew/RTL sites. Renamed its CSS variable to `--font-heebo`, repointed the `--font-sans` theme token at it in `globals.css`, and changed the `body` rule from a hardcoded `Arial, Helvetica, sans-serif` stack to `var(--font-sans), Arial, Helvetica, sans-serif` so the font actually cascades to body text (this also resolves the "globals.css ignores font variables" finding below — see note). Verified: `npm run build` passes clean, and the rendered page's compiled CSS contains a `@font-face` for Heebo with `unicode-range: U+307-308, U+590-5FF, U+200C-2010, U+20AA, U+25CC, U+FB1D-FB4F` — i.e. the Hebrew Unicode block (U+0590–U+05FF), Hebrew presentation forms, and the ₪ sign are all covered. Geist Mono retained for monospace use (numerals/Latin), since Hebrew body text is never set in monospace.
- [x] [Review][Defer] Unrelated planning docs swept into the scaffold commit [commit `d954a19`] — Dorma confirmed: leave as-is. `_bmad-output/planning-artifacts/architecture.md` (596 lines) and `epics.md` (457 lines), pre-existing untracked files, were committed alongside the scaffold via `git add -A`. Nothing was modified/disturbed — just an audit-trail wrinkle — and the commit is already pushed/live on Vercel, so rewriting it would require a risky force-push for no real benefit. Reason for deferring: low risk, nothing was disturbed, and rewriting already-deployed history is the riskier move.
- [x] [Review][Defer] Placeholder page/metadata remain English & LTR-template [src/app/page.tsx, src/app/layout.tsx:21-24] — deferred, pre-existing: `page.tsx` is untouched `create-next-app` boilerplate (English copy, `sm:items-start`/`text-left` LTR-oriented classes under a `dir="rtl"` `<html>`), and `layout.tsx` metadata is still `{ title: "Create Next App", ... }`. Will be replaced wholesale when the real sections (1.3–1.9) and final SEO/a11y metadata (1.9) are built — the spec explicitly scopes this story to "placeholder + RTL shell only."
- [x] [Review][Defer] `globals.css` overrode the Geist font variables with a hardcoded stack [src/app/globals.css] — RESOLVED as part of the Hebrew font patch above (the `body` rule now uses `var(--font-sans)` with the hardcoded stack only as a fallback); marking deferred-finding closed rather than opening separate follow-up work.
- [x] [Review][Defer] `AGENTS.md` points an AI agent at a gitignored path [AGENTS.md:4] — deferred, pre-existing: instructs reading `node_modules/next/dist/docs/`, which is gitignored and not guaranteed present; auto-generated by `create-next-app` (the story's own Dev Notes call this file out as vendor-generated), not dev-authored — low risk, leave as-is.
- [x] [Review][Defer] `eslint.config.mjs` comment doesn't match `globalIgnores` behavior [eslint.config.mjs:8] — deferred, pre-existing: the "Override default ignores of eslint-config-next" comment is misleading given how the spread + `globalIgnores` actually compose; also `create-next-app`-generated boilerplate, a cosmetic nit only.

## Dev Notes

- **Foundation story — no previous story exists.** Every choice made here (exact locked dependency versions, directory layout, lint/format conventions) becomes canonical for all 14 remaining stories. Do not deviate from the architecture without strong reason.
- **Exact starter command per architecture:** `npx create-next-app@latest justice-for-lia --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` — but see "Project Structure Notes": the literal command must be adapted for this repo's existing layout (it would otherwise scaffold into a wrongly-nested subfolder). [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation]
- **Next.js version is pinned to 16.2.x.** Secondary libraries this architecture later introduces (`@vercel/blob`, `zod`, `@tiptap/react` + extensions, `jose`, `sanitize-html`) are **not** installed in this story — they belong to later stories. Whatever exact versions *this* story's `npm install` locks into `package.json`/`package-lock.json` (Next.js, React, Tailwind, ESLint, TypeScript) become canonical; never upgrade/downgrade later without updating the architecture doc. [Source: _bmad-output/planning-artifacts/architecture.md#Validation Issues Addressed]
- **`<html dir="rtl" lang="he">` belongs in `src/app/layout.tsx`** (note: `src/app/...`, not `app/...`, because `--src-dir` is used). This single line establishes the RTL/Hebrew shell every later section/page builds on top of. [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- **Deployment is Vercel's native Git integration ONLY.** Push to the production branch triggers an automatic build + deploy. Do **not** add GitHub Actions, a `vercel.json` build override, or any other custom CI/CD — the architecture explicitly states none is needed. [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment]
- **Stay in scope — placeholder + RTL shell only.** `content-schema.ts`, the six `*Section` components, Vercel Blob wiring, and admin auth all belong to dedicated later stories (1.2+); building any of them now would create duplicate/conflicting work. [Source: _bmad-output/planning-artifacts/architecture.md#Decision Impact Analysis]
- **No env vars in this story.** `ADMIN_PASSWORD`, the session secret, and Blob credentials are configured in Epic 2. Just make sure `create-next-app`'s default `.gitignore` (excludes `.env*.local`, `node_modules`, `.next`, etc.) is preserved/merged into the existing repo `.gitignore` — nothing secret should ever be committed.
- **`AGENTS.md`** is auto-generated by `create-next-app` to guide AI coding agents continuing the build — read it once scaffolding completes; it may carry project-specific conventions relevant to the rest of the implementation.

### Project Structure Notes

- **Read this before running any scaffolding command.** The repo root (`c:\Users\dorma\Desktop\Personal\JusticForLia`) is **already an initialized Git repo** — branch `master`, one commit ("update code") containing only `.claude/`, `_bmad/`, `_bmad-output/`, `docs/`, and BMAD config. The architecture's literal command (`npx create-next-app@latest justice-for-lia ...`) would create a **new nested `justice-for-lia/` subdirectory** — but the architecture's own target directory tree shows `package.json`, `src/`, `next.config.ts`, etc. living **directly at the repo root**, alongside where `docs/` already sits, and Vercel's zero-config deploy expects the Next.js project at the repo root (a custom "root directory" setting would itself be the kind of extra configuration the architecture says to avoid).
  - **Resolution:** scaffold so the generated files land at the repo root — e.g. run `npx create-next-app@latest .` (with the same flags) targeting the current directory; if the CLI refuses a non-empty directory, scaffold into a throwaway sibling folder and move the generated contents into the repo root, **merging** `.gitignore` (don't overwrite — the existing repo may rely on entries already there) and leaving `.git/`, `.claude/`, `_bmad/`, `_bmad-output/`, `docs/` exactly where they are.
  - End state must match `_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries`: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `eslint.config.mjs`, `public/`, `src/app/layout.tsx`, etc. all directly under the repo root, `docs/` and the BMAD folders untouched.
- **No Git remote is configured** (`git remote -v` returns nothing). Creating/connecting a GitHub repo and linking a Vercel project are account-bound, hard-to-reverse actions — confirm with Dorma before creating remote resources, and never fabricate repo/deployment URLs.
- Don't create `src/middleware.ts`, `src/lib/`, `src/components/`, `src/app/admin/`, or `src/app/api/` yet — those are introduced in stories 1.2 through 2.x. This story is the bare scaffold + RTL shell + verified deploy pipeline only.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1: Initialize Project & Verify Deployment Pipeline] — story statement and acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation] — selected starter, exact init command, Next.js 16.2.x pin and rationale
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] — target directory tree (`package.json`, `src/app/layout.tsx`, etc. at repo root)
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment] — Vercel native Git integration, "no custom CI/CD" rule, env var plan (for later stories)
- [Source: _bmad-output/planning-artifacts/architecture.md#Validation Issues Addressed] — secondary-dependency version-locking rule (Issue 2)
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Handoff] — "First Implementation Priority": run the starter command, then (next story, 1.2) define `content-schema.ts`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `npx create-next-app@latest scaffold-tmp --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` run in a throwaway sibling directory (`create-next-app` refuses non-empty target dirs); generated files then copied into the repo root, excluding `.git`, `node_modules`, `.next`, and `package-lock.json` (regenerated by `npm install` at the root).
- `npm install` at repo root — locked Next.js `16.2.7`, React `19.2.4`, React DOM `19.2.4`.
- `npm run dev` — started cleanly, placeholder page rendered RTL at `http://localhost:3000`.
- `npm run build` — completed successfully, no type or lint errors.
- `git add -A && git commit -m "Scaffold Next.js project and apply RTL/Hebrew layout shell"` (commit `d954a19`).
- Live deployment verification via HTTP fetch of `https://remember-lia.vercel.app/`: `200 OK`, `Strict-Transport-Security` header present (HTTPS/HSTS), `Server: Vercel`, response body contains `<html lang="he" dir="rtl">` and a mobile viewport meta tag.

### Completion Notes List

- Resolved the directory-layout conflict documented in Dev Notes/Project Structure Notes: scaffolded into a throwaway sibling folder (`scaffold-tmp`) instead of the repo root directly (the CLI refuses non-empty directories), then moved the generated contents into the repo root, merged `.gitignore`, and left `.git/`, `.claude/`, `_bmad/`, `_bmad-output/`, `docs/` untouched. Renamed the package from `scaffold-tmp` to `justice-for-lia` in `package.json`.
- Confirmed `package.json` locks Next.js `16.2.7`, React `19.2.4`, React DOM `19.2.4`, TypeScript `^5`, Tailwind CSS `^4`, ESLint `^9` / `eslint-config-next 16.2.7` — these versions are now canonical for the rest of the project per Dev Notes.
- Confirmed `tsconfig.json` resolves `@/*` → `./src/*`.
- Edited `src/app/layout.tsx` to set `<html lang="he" dir="rtl">` on the root `<html>` element (changed from the scaffold's default `lang="en"`).
- Verified locally: `npm run dev` renders the placeholder page right-to-left with no console errors; `npm run build` completes with zero type or lint errors.
- Committed the scaffold to the existing local repo on `master` (commit `d954a19 "Scaffold Next.js project and apply RTL/Hebrew layout shell"`), preserving prior history and the untouched BMAD/docs folders.
- Account-bound steps (creating the GitHub remote and connecting Vercel) were handed back to Dorma per the story's own guidance — these require the user's GitHub/Vercel credentials, which the agent does not have and should not fabricate. Dorma created the GitHub repo, pushed `master`, and connected it to Vercel via native Git integration; the pipeline auto-deployed to `https://remember-lia.vercel.app/` with no custom CI/CD files.
- Verified the live deployment end-to-end: fetched `https://remember-lia.vercel.app/` and confirmed `200 OK` over HTTPS (HSTS header present), served by Vercel, with `<html lang="he" dir="rtl">` and a mobile viewport meta tag in the rendered HTML — satisfying AC #2 in full.

### File List

- `.gitignore` (merged from scaffold defaults into existing repo `.gitignore`)
- `AGENTS.md`
- `README.md`
- `eslint.config.mjs`
- `next.config.ts`
- `next-env.d.ts`
- `package.json` (package name set to `justice-for-lia`)
- `package-lock.json`
- `postcss.config.mjs`
- `tsconfig.json`
- `public/file.svg`
- `public/globe.svg`
- `public/next.svg`
- `public/vercel.svg`
- `public/window.svg`
- `src/app/favicon.ico`
- `src/app/globals.css`
- `src/app/layout.tsx` (edited: `<html lang="he" dir="rtl">`; later edited again post-review: swapped `Geist` → `Heebo` for Hebrew glyph coverage)
- `src/app/page.tsx`
- `src/app/globals.css` (edited post-review: `--font-sans` repointed to `--font-heebo`; `body` font-family now uses `var(--font-sans)` with the original stack as fallback)

## Change Log

- 2026-06-08 — Story implemented: Next.js 16.2.7 project scaffolded at repo root (TypeScript, Tailwind CSS 4, ESLint 9, App Router, `src/` layout, `@/*` alias), RTL/Hebrew shell applied to `src/app/layout.tsx`, committed to `master` (`d954a19`), connected to Vercel via native Git integration, and verified live at `https://remember-lia.vercel.app/` over HTTPS with correct RTL rendering. Status moved to `review`.
- 2026-06-08 — Code review (3-layer: Blind Hunter, Edge Case Hunter, Acceptance Auditor): AC1/AC2 confirmed satisfied; 2 decision-needed items raised. Per Dorma's choices: (1) fixed the Hebrew font gap now — replaced Latin-only `Geist` with `Heebo` (`subsets: ["hebrew", "latin"]`) in `layout.tsx` and repointed `globals.css`'s font-family chain so it actually cascades (verified via build + compiled CSS `unicode-range` covering U+0590–U+05FF); (2) left the incidental `architecture.md`/`epics.md` sweep-in in commit `d954a19` as-is (already pushed/deployed; rewriting would be riskier than the wrinkle itself). 4 pre-existing/template findings deferred to `deferred-work.md`. Status moved to `done`.
