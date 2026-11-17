import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  celsius,
  describeWeather,
  hourLabel,
  nextHours,
  toWeather,
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

describe("toWeather", () => {
  const variable = (value: number, array: number[] = []) => ({
    value: () => value,
    valuesArray: () => Float32Array.from(array),
  })
  const response = (hourlyCodes: number[]) => ({
    current: () => ({
      time: () => 1_795_000_000n,
      interval: () => 0,
      variables: (i: number) => [variable(46.5), variable(2), variable(1)][i],
    }),
    hourly: () => ({
      time: () => 1_794_999_600n,
      interval: () => 3600,
      variables: (i: number) =>
        [
          variable(0, [47, 45, 44]),
          variable(0, hourlyCodes),
          variable(0, [1, 1, 0]),
        ][i],
    }),
  })

  it("maps current and hourly readings", () => {
    const weather = toWeather(response([3, 61, 0]))
    assert.equal(weather.time, 1_795_000_000_000)
    assert.equal(weather.temperature, 46.5)
    assert.equal(weather.description, "Partly cloudy")
    assert.equal(weather.day, true)
    assert.deepEqual(weather.hours, [
      { time: 1_794_999_600_000, temperature: 47, code: 3, day: true },
      { time: 1_795_003_200_000, temperature: 45, code: 61, day: true },
      { time: 1_795_006_800_000, temperature: 44, code: 0, day: false },
    ])
  })

  it("rejects unknown hourly codes", () => {
    assert.throws(
      () => toWeather(response([3, 42, 0])),
      /unknown WMO weather code 42/
    )
  })
})

describe("celsius", () => {
  it("converts and rounds to whole degrees Celsius", () => {
    assert.equal(celsius(45.7), "8°C")
    assert.equal(celsius(-40), "-40°C")
  })
})
