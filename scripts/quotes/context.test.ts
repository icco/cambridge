import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  bookMeta,
  hoursCount,
  isGutenberg,
  meridiemAfter,
  notATime,
  numericListOrCitation,
  raceTime,
  rangeStart,
} from "./context.ts"

describe("meridiemAfter", () => {
  it("reads a suffix after a spelled-out time", () => {
    assert.equal(meridiemAfter(" p.m., you wrote back"), "pm")
    assert.equal(meridiemAfter(" PM on Sunday"), "pm")
    assert.equal(meridiemAfter(" A.M., the scout"), "am")
  })

  it("ignores words that start with a or p", () => {
    assert.equal(meridiemAfter(" a man walked in"), undefined)
    assert.equal(meridiemAfter(", per rod."), undefined)
  })
})

describe("notATime", () => {
  it("rejects prices and weights", () => {
    assert.ok(notATime(", per rod."))
    assert.ok(notATime(" than he did at one-forty."))
    assert.ok(notATime(" versus one-forty"))
  })

  it("keeps ordinary continuations", () => {
    assert.ok(!notATime(" when I pulled up in front of the library."))
    assert.ok(!notATime(". The sky to the east was getting light."))
  })
})

describe("numericListOrCitation", () => {
  const check = (text: string, t: string) => {
    const i = text.indexOf(t)
    return numericListOrCitation(text, i, i + t.length)
  }

  it("rejects almanac lists that share a suffix", () => {
    assert.ok(
      check(
        "He rises on the 1st, at 7:38; on the 16th, at 6:39, and on the 31st, at 5:39 p. m.",
        "6:39"
      )
    )
    assert.ok(
      check(
        "It will set at 10:24, 9:40, and 8:21 p. m., respectively.",
        "10:24"
      )
    )
  })

  it("rejects verse citations", () => {
    assert.ok(
      check(
        "It is stated at 7:1, 2, 7, 13; 8:2; 10:1, 7, 8, and that the angel was seen at 9:21.",
        "9:21"
      )
    )
  })

  it("keeps a lone time", () => {
    assert.ok(!check("The train left at 6:22 and we were on it.", "6:22"))
    assert.ok(!check("She went in at 8:02. Jo joined her at 8:06.", "8:02"))
  })
})

describe("raceTime", () => {
  it("rejects race results", () => {
    assert.ok(raceTime("The time of the heat was "))
  })

  it("keeps ordinary clock times", () => {
    assert.ok(!raceTime("She woke her at "))
    assert.ok(!raceTime("Let the record show that at "))
  })
})

describe("rangeStart", () => {
  it("rejects the start of a range", () => {
    assert.ok(rangeStart("Stops ranging in length from "))
    assert.ok(!rangeStart("He left at "))
  })
})

describe("hoursCount", () => {
  it("rejects counts of hours", () => {
    assert.ok(hoursCount("[A record for ", ""))
    assert.ok(hoursCount("", " of bright sunshine"))
    assert.ok(hoursCount("", " in the air]"))
  })

  it("keeps military times", () => {
    assert.ok(!hoursCount("The attack began at ", ". The"))
    assert.ok(!hoursCount("As of ", " on October 8th"))
  })
})

describe("isGutenberg", () => {
  it("spots Project Gutenberg epubs by identifier", () => {
    assert.ok(
      isGutenberg(
        '<dc:identifier opf:scheme="URI" id="id">http://www.gutenberg.org/84</dc:identifier>'
      )
    )
    assert.ok(
      !isGutenberg('<dc:identifier id="isbn">9780000000000</dc:identifier>')
    )
  })
})

describe("bookMeta", () => {
  it("trusts the library folders over epub metadata", () => {
    assert.deepEqual(
      bookMeta(["Frank Herbert", "Book of Frank Herbert", "book.epub"], {
        title: "Frank Herbert",
        author: "The Book of Frank Herbert",
      }),
      { title: "Book of Frank Herbert", author: "Frank Herbert" }
    )
  })

  it("falls back to epub metadata for loose files", () => {
    assert.deepEqual(
      bookMeta(["Ada Lovelace", "notes.epub"], {
        title: "Notes on the Engine",
      }),
      { title: "Notes on the Engine", author: "Ada Lovelace" }
    )
  })
})
