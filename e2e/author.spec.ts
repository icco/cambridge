import { expect, type Page, test } from "@playwright/test"

const START_CQW = 9
const STEP_CQW = 0.25

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
  await expect(page.locator("blockquote em")).toHaveText("one minute to one")
  await page.clock.runFor(60_000)
  await expect(page.locator("blockquote em")).toHaveText("one o’clock")
})

test("fits the longest quote after a slow font load", async ({ page }) => {
  await page.route("**/*.woff2", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    await route.continue()
  })
  await page.clock.setFixedTime(new Date("2026-11-17T23:31:00Z"))
  await page.goto("/author")
  await expect(page.locator("blockquote em")).toHaveText(
    "twenty-nine minutes to midnight"
  )
  expect(await fit(page)).toEqual({ fits: true, snug: true })
  await expect(page).toHaveScreenshot("author.png", { animations: "disabled" })
})

test("fits the longest quote on a small screen", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.clock.setFixedTime(new Date("2026-11-17T23:31:00Z"))
  await page.goto("/author")
  await expect(page.locator("blockquote")).toBeVisible()
  expect(await fit(page)).toEqual({ fits: true, snug: true })
})
