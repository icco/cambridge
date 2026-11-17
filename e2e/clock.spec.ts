import { expect, type Page, test } from "@playwright/test"

const HOUR_MS = 60 * 60 * 1000

function forecast(now: string, day: boolean) {
  const start = Math.floor(new Date(now).getTime() / HOUR_MS) * HOUR_MS
  const codes = [2, 3, 61, 63, 3, 1, 0, 0]
  const temperatures = [47, 46, 45, 44, 43, 42, 41, 40]
  return {
    time: new Date(now).getTime(),
    temperature: 46.4,
    code: 2,
    day,
    description: "Partly cloudy",
    hours: codes.map((code, i) => ({
      time: start + i * HOUR_MS,
      temperature: temperatures[i],
      code,
      day,
    })),
  }
}

async function open(page: Page, now: string, day: boolean) {
  await page.clock.setFixedTime(new Date(now))
  await page.route("**/api/weather", (route) =>
    route.fulfill({ json: forecast(now, day) })
  )
  await page.goto("/")
  await expect(page.getByText("Now")).toBeVisible()
}

test("day", async ({ page }) => {
  await open(page, "2026-11-17T14:20:00Z", true)
  await expect(page).toHaveScreenshot("day.png", { animations: "disabled" })
})

test("night", async ({ page }) => {
  await open(page, "2026-11-17T21:20:00Z", false)
  await expect(page).toHaveScreenshot("night.png", { animations: "disabled" })
})
