import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  celsius,
  describeWeather,
  hourLabel,
  nextHours,
  weatherIcon,
} from "./weather.ts"

describe("describeWeather", () => {
  it("names WMO codes", () => {
    assert.equal(describeWeather(2), "Partly cloudy")
    assert.equal(describeWeather(63), "Rain")
  })

  it("rejects unknown codes", () => {
    assert.throws(() => describeWeather(42), /unknown WMO weather code 42/)
  })
})

describe("weatherIcon", () => {
  it("shows the sun or moon by daylight", () => {
    assert.equal(weatherIcon(0, true), "sun")
    assert.equal(weatherIcon(0, false), "moon")
    assert.equal(weatherIcon(2, true), "partly-day")
    assert.equal(weatherIcon(1, false), "partly-night")
  })

  it("groups precipitation", () => {
    assert.equal(weatherIcon(3, true), "cloud")
    assert.equal(weatherIcon(48, true), "fog")
    assert.equal(weatherIcon(53, true), "drizzle")
    assert.equal(weatherIcon(63, true), "rain")
    assert.equal(weatherIcon(81, false), "rain")
    assert.equal(weatherIcon(66, true), "sleet")
    assert.equal(weatherIcon(86, true), "snow")
    assert.equal(weatherIcon(95, true), "storm")
  })

  it("rejects unknown codes", () => {
    assert.throws(() => weatherIcon(42, true), /unknown WMO weather code 42/)
  })
})

describe("hourLabel", () => {
  it("writes the zoned hour in short 12-hour form", () => {
    const at = (iso: string) => new Date(iso).getTime()
    assert.equal(hourLabel(at("2026-11-17T15:00:00Z"), "Europe/London"), "3pm")
    assert.equal(hourLabel(at("2026-11-17T00:00:00Z"), "Europe/London"), "12am")
    assert.equal(hourLabel(at("2026-07-17T11:00:00Z"), "Europe/London"), "12pm")
  })
})

describe("nextHours", () => {
  const hour = (time: number) => ({ time, temperature: 50, code: 0, day: true })

  it("keeps the hours after now, up to the count", () => {
    const hours = [0, 1, 2, 3, 4].map((h) => hour(h * 3_600_000))
    assert.deepEqual(
      nextHours(hours, 1_800_000, 2).map((h) => h.time),
      [3_600_000, 7_200_000]
    )
  })
})

describe("celsius", () => {
  it("converts and rounds to whole degrees Celsius", () => {
    assert.equal(celsius(45.7), "8°C")
    assert.equal(celsius(-40), "-40°C")
  })
})
