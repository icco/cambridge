# Author Clock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `/author` page that shows a fake literary quote naming the current local minute on aged paper.

**Architecture:** `src/lib/quotes.ts` turns a local hour and minute into a structured quote. `src/components/AuthorClock.tsx` ticks each minute on the client and fits the quote to a 9:16 frame. `src/app/author/page.tsx` renders the paper and the clock.

**Tech Stack:** Next.js App Router, React 19, CSS modules, `next/font/google` (EB Garamond), `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-17-author-clock-design.md`

## Global Constraints

- Local time comes from the browser (`Date#getHours`, `Date#getMinutes`), never a fixed time zone.
- Quote shape: `{ before: string, time: string, after: string, title: string, author: string }`.
- Every one of the 1440 minutes returns a quote whose `time` names that minute.
- Fictional books and authors only.
- Two spaces, double quotes, no semicolons.

## Review Focus

- 00:00 and 12:00 read "midnight" and "noon", and 23:45 reads "quarter to midnight", not "quarter to zero".
- Afternoon hours use 12-hour words: 13:05 is "five past one".
- Minutes not on a five use "minutes": 04:23 is "twenty-three minutes past four", 04:01 is "one minute past four", 04:59 is "one minute to five".
- The longest template at the smallest screen still fits without scrolling.
- The timer re-aligns to the next minute each tick, so a throttled tab does not drift.

---

### Task 1: Quote generator

**Files:**
- Create: `src/lib/quotes.ts`
- Test: `src/lib/quotes.test.ts`

**Interfaces:**
- Produces: `type Quote = { before: string; time: string; after: string; title: string; author: string }`, `timePhrase(hours: number, minutes: number): string`, `quoteFor(hours: number, minutes: number): Quote`

- [ ] **Step 1: Write failing tests**: `timePhrase` cases from Review Focus plus `(4, 20)` -> "twenty past four", `(4, 15)` -> "quarter past four", `(4, 30)` -> "half past four", `(4, 0)` -> "four o'clock", `(11, 40)` -> "twenty to noon". `quoteFor` for all 1440 minutes returns non-empty fields and `time === timePhrase(h, m)`; two adjacent minutes may share a template but not the whole quote text.
- [ ] **Step 2: Run** `pnpm test` and see the new tests fail.
- [ ] **Step 3: Implement** in `src/lib/quotes.ts`: number words to fifty-nine; `to` from minute 31 on, naming the next hour; about eight sentence templates, two of them long (around 60 words), paired with fictional titles and authors; pick the template by `(hours * 60 + minutes) % templates.length`.
- [ ] **Step 4: Run** `pnpm test`; all pass.
- [ ] **Step 5: Commit** `feat: generate fake quotes for every minute`

### Task 2: Minute alignment

**Files:**
- Modify: `src/lib/time.ts`
- Test: `src/lib/time.test.ts`

**Interfaces:**
- Produces: `msUntilNextMinute(now: number): number`

- [ ] **Step 1: Test**: `msUntilNextMinute(0) === 60000`, `msUntilNextMinute(59_500) === 500`, `msUntilNextMinute(60_001) === 59_999`.
- [ ] **Step 2: Implement**, run `pnpm test`, commit `feat: add minute alignment helper`

### Task 3: Page

**Files:**
- Create: `src/app/author/page.tsx`, `src/app/author/page.module.css`, `src/components/AuthorClock.tsx`, `src/components/AuthorClock.module.css`
- Modify: `src/app/sitemap.ts`, `scripts/smoke.mjs`

**Interfaces:**
- Consumes: `quoteFor`, `msUntilNextMinute`

- [ ] **Step 1: Smoke test**: `/author` returns 200, has one `main`, and its title is `Author Clock | Cambridge Clock`; the sitemap lists `/author`.
- [ ] **Step 2: Page**: `metadata = { title: "Author Clock", alternates: { canonical: "/author" } }`; full-viewport paper background (radial tan gradient `#efe4cb` to `#c4a97c`, SVG `feTurbulence` noise multiplied on top) covering the root `--wall`; a 9:16 frame like `page.module.css` `.screen`; EB Garamond (400, 400 italic, 600) via `next/font/google` scoped to the page.
- [ ] **Step 3: AuthorClock**: `"use client"`; state `Date | null`; tick at `msUntilNextMinute` and reload when local hour is 4 and the page has been up over an hour, as `ClockWall` does; render a `blockquote` with the time in `<em>` coloured `#8a2b1d`, a thin rule, and a small-caps citation (title, then author) in `#6b5236`; ink `#3b2a1a`.
- [ ] **Step 4: Fit**: after each quote change, in `useLayoutEffect`, start at 9cqw and step font size down by 0.25cqw until the content height fits the frame, floor 3cqw.
- [ ] **Step 5: Verify** `pnpm check`, `pnpm build`, `pnpm test:smoke`, and a screenshot of `/author` at 600x960 with the longest template.
- [ ] **Step 6: Commit** `feat: add author clock page`
