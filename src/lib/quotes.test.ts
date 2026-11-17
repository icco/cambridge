import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { quoteFor, timePhrase } from "./quotes.ts"

describe("timePhrase", () => {
  const cases: [number, number, string][] = [
    [0, 0, "midnight"],
    [12, 0, "noon"],
    [23, 45, "quarter to midnight"],
    [11, 40, "twenty to noon"],
    [13, 5, "five past one"],
    [4, 0, "four o’clock"],
    [4, 15, "quarter past four"],
    [4, 20, "twenty past four"],
    [4, 30, "half past four"],
    [4, 1, "one minute past four"],
    [4, 23, "twenty-three minutes past four"],
    [4, 59, "one minute to five"],
    [0, 10, "ten past midnight"],
  ]

  for (const [hours, minutes, phrase] of cases) {
    it(`reads ${hours}:${String(minutes).padStart(2, "0")} as "${phrase}"`, () => {
      assert.equal(timePhrase(hours, minutes), phrase)
    })
  }
})

describe("quoteFor", () => {
  it("names every minute of the day", () => {
    for (let hours = 0; hours < 24; hours++) {
      for (let minutes = 0; minutes < 60; minutes++) {
        const quote = quoteFor(hours, minutes)
        assert.equal(quote.time, timePhrase(hours, minutes))
        assert.ok(quote.before || quote.after)
        assert.ok(quote.title)
        assert.ok(quote.author)
      }
    }
  })

  it("changes the quote from one minute to the next", () => {
    const text = (h: number, m: number) => {
      const { before, time, after } = quoteFor(h, m)
      return before + time + after
    }
    assert.notEqual(text(9, 14), text(9, 15))
  })
})
