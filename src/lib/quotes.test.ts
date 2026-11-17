import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

import { type HourQuotes, quoteAt, quoteFor, timePhrase } from "./quotes.ts"

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

describe("quoteAt", () => {
  const hourQuotes = {
    "05": [
      {
        b: "At ",
        t: "five past nine",
        a: ", the bell rang.",
        title: "A",
        author: "Ada Lovelace",
      },
      {
        b: "By ",
        t: "9:05",
        a: " she was gone.",
        title: "B",
        author: "Alice Example",
      },
    ],
  }

  it("picks by day among the stored quotes", () => {
    assert.equal(quoteAt(hourQuotes, 9, 5, 0).title, "A")
    assert.equal(quoteAt(hourQuotes, 9, 5, 1).title, "B")
    assert.equal(quoteAt(hourQuotes, 9, 5, 2).title, "A")
  })

  it("falls back to a template when the minute has no stored quote", () => {
    assert.deepEqual(quoteAt(hourQuotes, 9, 6, 0), quoteFor(9, 6))
    assert.deepEqual(quoteAt(undefined, 9, 6, 0), quoteFor(9, 6))
  })
})

describe("public/quotes", () => {
  let covered = 0
  for (let hour = 0; hour < 24; hour++) {
    const name = String(hour).padStart(2, "0")
    const data: HourQuotes = JSON.parse(
      readFileSync(`public/quotes/${name}.json`, "utf8")
    )
    for (const [minute, quotes] of Object.entries(data)) {
      covered++
      it(`${name}:${minute} has well-formed quotes`, () => {
        assert.match(minute, /^[0-5]\d$/)
        assert.ok(quotes.length >= 1 && quotes.length <= 8)
        for (const q of quotes) {
          assert.ok(q.t && q.title && q.author)
          assert.ok(q.b.length + q.t.length + q.a.length <= 400)
        }
      })
    }
  }

  it("covers most minutes of the day", () => {
    assert.ok(covered >= 1200, `only ${covered} minutes covered`)
  })
})
