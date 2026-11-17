# Author clock

## Intent

A second Cambridge page for its own 10" portrait kiosk. Each minute it shows a line of prose that names the current time, with the time phrase highlighted and the book and author beneath. Quotes are fake for now; a real source replaces them later without touching the page.

## Goals

- `/author` route in the existing Next app, portrait, quote filling the screen.
- Aged-paper look: warm tan page, fibre noise, darker vignette at the edges, semibold italic time phrase in body ink over a soft tan underline band, small-caps citation, book serif.
- Tells the screen's local time (the kiosk browser's time zone), not London.
- Every minute of the day has a quote.

## Non-goals

- Real quotes, quote sourcing, or attribution data.
- Switching between `/` and `/author`; each kiosk stays on its own page.
- Landscape layout.

## Anti-goals

- Scrolling or clipped text: long quotes shrink to fit.
- Anything that makes the page feel like the world clock's colour fields.

## Approaches

- Fake quote structure (picked: generated fakes). `quoteFor(hours, minutes)` in `src/lib/quotes.ts` builds a quote from a few sentence templates for all 1440 minutes, so every minute renders and both short and long layouts get exercised. Real quotes later become a data file behind the same function.
- Hand-written handful with nearest-earlier fallback: rejected, most minutes repeat.
- JSON file from day one: rejected, it fixes a data format before the source is known.
- Page shape had one sensible option: a route in this app (asked for), with a CSS paper background rather than the canvas `Backdrop`, which animates colour fields.

## Design

- `src/app/author/page.tsx`: Server Component rendering the paper and an `AuthorClock` client component. Add `/author` to the sitemap and smoke test.
- `src/components/AuthorClock.tsx`: reads local time with `Temporal.Now` on the client only (server renders empty paper, avoiding a hydration mismatch), ticks on the minute boundary, and reloads daily at 04:00 local time like `ClockWall`.
- Quote shape: `{ before, time, after, title, author }`, so the highlight is data, not string matching.
- Fit: start at a large size and step the font down until the quote and citation fit the 9:16 frame.
- Font: EB Garamond via `next/font/google`, scoped to the page.
- Tests: `quoteFor` returns a quote for every minute, and its time phrase matches the minute.

## Left to the builder

- Exact paper colours, noise strength, and type scale, within the approved mockup.
- Fake sentence templates and fictional book and author names.
