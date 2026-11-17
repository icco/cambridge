import { readFileSync } from "node:fs"

import { expect, type Page, test } from "@playwright/test"

import { type HourQuotes, quoteAt } from "../src/lib/quotes"

const START_CQW = 9
const STEP_CQW = 0.25

const DAY = Math.floor(Date.parse("2026-11-17T00:00:00Z") / 86_400_000)

const hours: HourQuotes[] = Array.from({ length: 24 }, (_, hour) =>
  JSON.parse(
    readFileSync(`public/quotes/${String(hour).padStart(2, "0")}.json`, "utf8")
  )
)

function shown(hour: number, minute: number) {
  return quoteAt(hours[hour], hour, minute, DAY)
}

function longest() {
  let best = { hour: 0, minute: 0, length: 0 }
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute++) {
      const { before, time, after } = shown(hour, minute)
      const length = before.length + time.length + after.length
      if (length > best.length) best = { hour, minute, length }
    }
  }
  return best
}

const LONGEST = longest()
const LONGEST_TIME = new Date(
  Date.UTC(2026, 10, 17, LONGEST.hour, LONGEST.minute)
)

async function fit(page: Page) {
  return page.evaluate(
    async ({ start, step }) => {
      await document.fonts.ready
      const content = document.querySelector("blockquote")!.parentElement!
      const frame = content.parentElement!
      const style = getComputedStyle(frame)
      const available =
        frame.clientHeight -
        parseFloat(style.paddingTop) -
        parseFloat(style.paddingBottom)
      const size = parseFloat(content.style.fontSize)
      const fits = content.scrollHeight <= available
      content.style.fontSize = `${size + step}cqw`
      const larger = content.scrollHeight <= available
      content.style.fontSize = `${size}cqw`
      return { fits, snug: size === start || !larger }
    },
    { start: START_CQW, step: STEP_CQW }
  )
}

test("advances across the hour", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-17T12:59:30Z") })
  await page.goto("/author")
  await expect(page.locator("blockquote em")).toHaveText(shown(12, 59).time)
  await page.clock.runFor(60_000)
  await expect(page.locator("blockquote em")).toHaveText(shown(13, 0).time)
})

test("fits the longest quote after a slow font load", async ({ page }) => {
  await page.route("**/*.woff2", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    await route.continue()
  })
  await page.clock.setFixedTime(LONGEST_TIME)
  await page.goto("/author")
  await expect(page.locator("blockquote em")).toHaveText(
    shown(LONGEST.hour, LONGEST.minute).time
  )
  expect(await fit(page)).toEqual({ fits: true, snug: true })
  await expect(page).toHaveScreenshot("author.png", { animations: "disabled" })
})

test("fits the longest quote on a small screen", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.clock.setFixedTime(LONGEST_TIME)
  await page.goto("/author")
  await expect(page.locator("blockquote")).toBeVisible()
  expect(await fit(page)).toEqual({ fits: true, snug: true })
})
