import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import { describe, it } from "node:test"

import { isWholeSentence, sentences, stripFootnote } from "./sentence.ts"

describe("sentences", () => {
  it("keeps dialogue attribution with its quote", () => {
    assert.deepEqual(
      sentences("“Is it late?” she said. “Exactly five.”").map(
        (s) => s.segment
      ),
      ["“Is it late?” she said. ", "“Exactly five.”"]
    )
  })

  it("does not split after an honorific", () => {
    assert.deepEqual(
      sentences("He met Dr. Watson at noon. Fine.").map((s) => s.segment),
      ["He met Dr. Watson at noon. ", "Fine."]
    )
  })

  it("keeps offsets into the original text", () => {
    const text = "Mr. Smith left. Then he slept."
    for (const s of sentences(text))
      assert.equal(text.slice(s.index, s.index + s.segment.length), s.segment)
  })
})

describe("isWholeSentence", () => {
  const whole = [
    "It was ten past four.",
    "“He died at ten past eight,” she said.",
    "8:10 P.M., election night, and the polls had closed.",
    "Is it really four?",
    "(She finished around 3:50.)",
    "Tell him to be ready at one-fourteen——",
  ]
  const partial = [
    "He staggers back, looks wildly at the clock. It reads 3:18, as we",
    "At 10:01 A.M., Church called the hearing to order:",
    "she said. “Exactly fourteen minutes past five.”",
    "but he looks at the ground at five to four.",
    "Before he left the house at eight-seventeen a.m.; viz",
  ]
  for (const s of whole) it(`accepts ${s}`, () => assert.ok(isWholeSentence(s)))
  for (const s of partial)
    it(`rejects ${s}`, () => assert.ok(!isWholeSentence(s)))
})

describe("stripFootnote", () => {
  it("drops a trailing note number", () => {
    assert.equal(stripFootnote("at 1:55 a.m.27"), "at 1:55 a.m.")
    assert.equal(stripFootnote("the South Tower.6"), "the South Tower.")
  })

  it("leaves times and years alone", () => {
    assert.equal(stripFootnote("The record was 1:38"), "The record was 1:38")
    assert.equal(stripFootnote("in 1918."), "in 1918.")
    assert.equal(stripFootnote("It cost 3.99"), "It cost 3.99")
  })
})

describe("public quotes", () => {
  const dir = new URL("../../public/quotes/", import.meta.url)
  for (const file of readdirSync(dir)) {
    it(`${file} holds only whole sentences`, () => {
      const hour: Record<string, { b: string; t: string; a: string }[]> =
        JSON.parse(readFileSync(new URL(file, dir), "utf8"))
      const partial = Object.values(hour)
        .flat()
        .map((q) => q.b + q.t + q.a)
        .filter((s) => !isWholeSentence(s))
      assert.deepEqual(partial, [])
    })
  }
})
