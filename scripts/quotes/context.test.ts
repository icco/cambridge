import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { bookMeta, isGutenberg, meridiemAfter, notATime } from "./context.ts"

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
