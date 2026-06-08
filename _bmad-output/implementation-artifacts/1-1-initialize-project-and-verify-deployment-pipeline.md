---
baseline_commit: 6a65214d696ffeb1bdc6d60fa4314cc820378796
---

# Story 1.1: Initialize Project & Verify Deployment Pipeline

Status: in-progress

## Story

As a developer,
I want to scaffold the project with the approved Next.js starter command and confirm it deploys successfully to Vercel,
so that every subsequent story has a verified, working foundation to build on.

## Acceptance Criteria

1. **Given** the architecture's starter command, **when** it is run, **then** a Next.js 16.2.x project is created with TypeScript, Tailwind CSS, ESLint, the App Router, `src/` layout, and the `@/*` import alias — **and** `src/app/layout.tsx` sets `<html dir="rtl" lang="he">`. [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1]
2. **Given** the project is pushed to a Git repository connected to Vercel, **when** the push completes, **then** Vercel automatically builds and deploys it with no custom CI/CD files — **and** the deployed placeholder page, opened on a mobile device, loads successfully over HTTPS. [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1]

## Tasks / Subtasks

- [ ] Task 1: Scaffold the Next.js project at the repo root (AC: #1)
  - [ ] Resolve the directory layout conflict FIRST — see "Project Structure Notes" below; the repo root already contains `.git`, `.claude/`, `_bmad/`, `_bmad-output/`, `docs/`
  - [ ] Run the architecture-approved starter command, adapted to target the current directory instead of creating a nested `justice-for-lia/` folder: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` (if the CLI refuses to scaffold into a non-empty directory, scaffold into a throwaway sibling folder and move every generated file/folder — `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `eslint.config.mjs`, `public/`, `src/`, `AGENTS.md`, etc. — into the repo root, **merging** `.gitignore` rather than overwriting it, and leaving `.git/`, `.claude/`, `_bmad/`, `_bmad-output/`, `docs/` untouched)
  - [ ] Confirm `package.json` shows Next.js `16.2.x`, TypeScript, Tailwind CSS, ESLint, App Router (`src/app/`), and that `@/*` resolves via `tsconfig.json` `paths`
- [ ] Task 2: Apply the RTL/Hebrew layout shell (AC: #1)
  - [ ] Edit `src/app/layout.tsx`: set `<html lang="he" dir="rtl">` on the root `<html>` element
- [ ] Task 3: Verify the project runs locally (AC: #1)
  - [ ] `npm run dev` starts without errors; the placeholder page renders right-to-left
  - [ ] `npm run build` completes successfully with no type or lint errors
- [ ] Task 4: Push to Git and verify the Vercel deployment pipeline end-to-end (AC: #2)
  - [ ] Commit the scaffolded project to the existing local Git repo (currently branch `master`, one commit "update code", **no remote configured**)
  - [ ] Connect the repo to a Vercel project via Vercel's native Git integration (push-to-deploy) — this requires the user's GitHub/Vercel account access; if the agent cannot perform account-bound actions, hand this step back to Dorma with clear instructions rather than guessing at URLs or fabricating credentials
  - [ ] Confirm Vercel auto-builds and deploys on push with **no** custom CI/CD config files added (no `.github/workflows/`, no `vercel.json` build overrides)
  - [ ] Open the deployed URL on a mobile device/viewport and confirm it loads over **HTTPS** and renders right-to-left correctly

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

### Debug Log References

### Completion Notes List

### File List
