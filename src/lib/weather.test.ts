import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { celsius, describeWeather, weatherLine } from "./weather.ts"

describe("describeWeather", () => {
  it("names WMO codes", () => {
    assert.equal(describeWeather(2), "Partly cloudy")
    assert.equal(describeWeather(63), "Rain")
  })

  it("rejects unknown codes", () => {
    assert.throws(() => describeWeather(42), /unknown WMO weather code 42/)
  })
})

describe("weatherLine", () => {
  it("rounds to whole degrees Fahrenheit", () => {
    assert.equal(
      weatherLine({ temperature: 45.7, description: "Partly cloudy" }),
      "Partly cloudy · 46°F"
    )
  })
})

describe("celsius", () => {
  it("converts and rounds to whole degrees Celsius", () => {
    assert.equal(celsius(45.7), "8°C")
    assert.equal(celsius(-40), "-40°C")
  })
})
