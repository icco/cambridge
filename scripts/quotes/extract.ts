import { appendFileSync, existsSync, readFileSync } from "node:fs"
import { posix } from "node:path"

import { unzipSync } from "fflate"
import { Parser } from "htmlparser2"

import {
  bookMeta,
  durationBefore,
  hoursCount,
  isGutenberg,
  meridiemAfter,
  notATime,
  numericListOrCitation,
} from "./context.ts"
import { isWholeSentence, sentences, stripFootnote } from "./sentence.ts"

const ROOT = "/media/brook/Books"
const [listFile, outDir, shardArg, shardsArg] = process.argv.slice(2)
const shard = Number(shardArg)
const shards = Number(shardsArg)

const HW = "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve"
const HN = `(?:${HW}|noon|midnight|midday)`
const ONES = "one|two|three|four|five|six|seven|eight|nine"
const MINW = `(?:(?:twenty|thirty|forty|fifty)(?:[- ](?:${ONES}))?|nineteen|eighteen|seventeen|sixteen|fifteen|fourteen|thirteen|twelve|eleven|ten|${ONES})`
const NUM: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
}
const AMPM = "(?:a\\.?\\s?m\\.?|p\\.?\\s?m\\.?)(?![a-z])"
const NOUN_BAD =
  "(?!\\s+(?:hours?|days?|years?|weeks?|months?|minutes?|seconds?|another|other|each|times?|thousand|hundred|dollars?|miles?|feet|percent|people|men|women|kids|children|inches|of us|of them|of the|odd|or))"
const GATE =
  /\b(?:at|by|until|till|about|around|before|after|since|near|nearly|almost|exactly|precisely|just|was|is|it’s|it's|time|clock|watch|reads?|shortly|barely|past)\s+(?:about |almost |nearly |just |exactly |precisely )?$/i

const wordNum = (s: string): number => {
  const parts = s.toLowerCase().split(/[- ]/)
  return parts.reduce((a, p) => a + (NUM[p] ?? 0), 0)
}
const hourFromWord = (w: string): number | "noon" | "midnight" => {
  const l = w.toLowerCase()
  if (l === "noon" || l === "midday") return "noon"
  if (l === "midnight") return "midnight"
  return NUM[l]
}

type Raw = {
  T: [number, number]
  hour: number | "noon" | "midnight" | "h24"
  h24?: number
  to?: boolean
  min: number
  strong: boolean
  ampm?: "am" | "pm"
}

const patterns: {
  re: RegExp
  fn: (m: RegExpExecArray, text: string) => Raw | null
  txtOk: boolean
}[] = [
  {
    re: new RegExp(
      `(?<![\\w’'-])(?<T>(?<h>\\d{1,2}|${HW})[\\s-]?o[’'‘\`]?\\s?clock)\\b(?!\\s+shadow)`,
      "gid"
    ),
    txtOk: true,
    fn: (m) => {
      const h = m.groups!.h
      const n = /^\d/.test(h) ? Number(h) : NUM[h.toLowerCase()]
      if (!(n >= 1 && n <= 24)) return null
      const T = m.indices!.groups!.T
      if (n > 12)
        return { T, hour: "h24", h24: n === 24 ? 0 : n, min: 0, strong: true }
      return { T, hour: n, min: 0, strong: true }
    },
  },
  {
    re: new RegExp(
      `(?<![\\d:.,$\\w])(?<T>(?<h>\\d{1,2}):(?<mm>[0-5]\\d)(?![:\\d])(?:\\s?(?<ap>${AMPM}))?)`,
      "gid"
    ),
    txtOk: false,
    fn: (m, text) => {
      const h = Number(m.groups!.h)
      const min = Number(m.groups!.mm)
      const T = m.indices!.groups!.T
      const ap = m.groups!.ap
      if (ap) {
        if (h < 1 || h > 12) return null
        return {
          T,
          hour: h,
          min,
          strong: true,
          ampm: /^a/i.test(ap) ? "am" : "pm",
        }
      }
      if (h > 23) return null
      const before = text.slice(Math.max(0, m.index - 60), m.index)
      if (!GATE.test(before.slice(-30))) return null
      if (durationBefore(before)) return null
      if (numericListOrCitation(text, T[0], T[1])) return null
      if (h === 0 || h >= 13 || m.groups!.h.startsWith("0"))
        return { T, hour: "h24", h24: h, min, strong: true }
      return { T, hour: h, min, strong: false }
    },
  },
  {
    re: new RegExp(
      `(?<![\\d:.,$\\w])(?<T>(?<h>\\d{1,2})\\s?(?<ap>${AMPM}))(?![\\w])`,
      "gid"
    ),
    txtOk: false,
    fn: (m) => {
      const h = Number(m.groups!.h)
      if (h < 1 || h > 12) return null
      return {
        T: m.indices!.groups!.T,
        hour: h,
        min: 0,
        strong: true,
        ampm: /^a/i.test(m.groups!.ap) ? "am" : "pm",
      }
    },
  },
  {
    re: new RegExp(
      `\\b(?:a\\s+)?(?<T>(?<q>quarter|half)\\s+(?<p>past|after|to|till|before|of)\\s+(?<h>${HN}))\\b${NOUN_BAD}`,
      "gid"
    ),
    txtOk: true,
    fn: (m) => {
      const q = m.groups!.q.toLowerCase()
      const p = m.groups!.p.toLowerCase()
      const T = m.indices!.groups!.T
      const hour = hourFromWord(m.groups!.h)
      if (q === "half") {
        if (p !== "past" && p !== "after") return null
        return { T, hour, min: 30, strong: true }
      }
      const past = p === "past" || p === "after"
      return past
        ? { T, hour, min: 15, strong: true }
        : { T, hour, min: 45, strong: true, to: true }
    },
  },
  {
    re: new RegExp(
      `\\b(?<T>(?<n>${MINW})(?<mins>\\s+minutes?)?\\s+(?<p>past|after|to|till|before|of)\\s+(?<h>${HN}))\\b${NOUN_BAD}`,
      "gid"
    ),
    txtOk: true,
    fn: (m, text) => {
      const n = wordNum(m.groups!.n)
      const p = m.groups!.p.toLowerCase()
      const T = m.indices!.groups!.T
      const hour = hourFromWord(m.groups!.h)
      const past = p === "past" || p === "after"
      if (durationBefore(text.slice(Math.max(0, m.index - 60), m.index)))
        return null
      const gated = GATE.test(text.slice(Math.max(0, m.index - 30), m.index))
      const after = text.slice(
        m.index + m[0].length,
        m.index + m[0].length + 12
      )
      const punct =
        /^\s*(?:[.,;:!?—–)”’"]|o[’']clock|in the|when|that|and then)/i.test(
          after
        )
      if (!m.groups!.mins) {
        if (![5, 10, 20, 25, 15].includes(n)) return null
        if (!(gated || (punct && (p === "past" || p === "to")))) return null
        if (p === "of" || p === "before" || p === "after") {
          if (!gated) return null
        }
      }
      if (n < 1 || n > 30) return null
      if (past) return { T, hour, min: n, strong: !!m.groups!.mins }
      if (n === 30) return null
      return { T, hour, min: 60 - n, strong: !!m.groups!.mins, to: true }
    },
  },
  {
    re: new RegExp(
      `(?<=\\b(?:at|by|until|till|since|before|after|was|is|it’s|it's|exactly|precisely|time|near|nearly|almost|just)\\s+)(?<T>(?<h>${HW})[\\s-](?<mm>(?:(?:twenty|thirty|forty|fifty)(?:-(?:${ONES})| (?!one\\s+[a-z])(?:${ONES}))?|nineteen|eighteen|seventeen|sixteen|fifteen|fourteen|thirteen|o[h]?[- ](?:${ONES}))))\\b(?![\\s-]+(?:years?|year-old|days?|months?|miles?|feet|dollars?|percent|times|people|men|women|of|pounds?|minutes?|seconds?|hours?|points|cents|thousand|hundred|million|kids|children|years)|-)`,
      "gid"
    ),
    txtOk: false,
    fn: (m, text) => {
      const h = NUM[m.groups!.h.toLowerCase()]
      const mmw = m.groups!.mm.toLowerCase()
      const oh = /^o/.test(mmw)
      const after = text.slice(m.index + m[0].length)
      if (notATime(after)) return null
      // "-oh-" forms are usually room numbers or prices unless a.m. or p.m. follows.
      if (oh && !meridiemAfter(after)) return null
      const min = oh ? NUM[mmw.split(/[- ]/)[1]] : wordNum(mmw)
      if (!(min >= 0 && min <= 59)) return null
      return { T: m.indices!.groups!.T, hour: h, min, strong: false }
    },
  },
  {
    re: /(?<=\b(?:at|by|until|till|before|after|near|since|around|about|past|toward|towards|of)\s+)(?<T>noon|midnight|midday)\b/dgi,
    txtOk: true,
    fn: (m) => {
      const w = m.groups!.T.toLowerCase()
      return {
        T: m.indices!.groups!.T,
        hour: w === "midnight" ? "midnight" : "noon",
        min: 0,
        strong: true,
      }
    },
  },
  {
    re: /(?<![\d\w])(?<T>(?<hh>[01]\d|2[0-3])(?<mm>[0-5]\d)\s+hours)\b/dgi,
    txtOk: true,
    fn: (m, text) => {
      const end = m.index + m[0].length
      if (
        hoursCount(
          text.slice(Math.max(0, m.index - 20), m.index),
          text.slice(end, end + 20)
        )
      )
        return null
      return {
        T: m.indices!.groups!.T,
        hour: "h24",
        h24: Number(m.groups!.hh),
        min: Number(m.groups!.mm),
        strong: true,
      }
    },
  },
]

const AM_W =
  /\b(?:morning|dawn|sunrise|breakfast|daybreak|cockcrow|sunup|dew|rooster|first light)\b/gi
const PM_W =
  /\b(?:afternoon|evening|dinner|supper|dusk|sunset|tonight|night|lunch|twilight|bedtime|midnight|dark|lamp|stars?|moon)\b/gi

function resolve(
  raw: Raw,
  excerpt: string,
  tOff: number
): { minutes: number[]; conf: number } | null {
  const { min } = raw
  if (raw.hour === "h24") {
    if (raw.min === undefined) return null
    return { minutes: [raw.h24! * 60 + min], conf: 2 }
  }
  if (raw.hour === "midnight")
    return { minutes: [(raw.to ? 23 * 60 : 0) + min], conf: 2 }
  if (raw.hour === "noon")
    return { minutes: [(raw.to ? 11 : 12) * 60 + min], conf: 2 }
  const h = raw.hour as number
  if (h < 1 || h > 12) return null
  let hourAdj = h
  // "quarter to three" names minutes before the next hour
  if (raw.to) {
    hourAdj = h - 1 === 0 ? 12 : h - 1
  }
  const toM = (pm: boolean) => ((hourAdj % 12) + (pm ? 12 : 0)) * 60 + min
  const near = excerpt.slice(tOff, tOff + 60)
  let pm: boolean | undefined
  let conf = 0
  const suffix = raw.ampm ?? meridiemAfter(near)
  if (suffix) {
    pm = suffix === "pm"
    conf = 2
  } else if (
    /^[^.]{0,12}\b(?:in the morning|of the morning|at dawn|in the early morning)\b/i.test(
      near.slice(0)
    )
  ) {
    pm = false
    conf = 2
  } else if (
    /^[^.]{0,12}\b(?:in the afternoon|in the evening|of the evening|of the afternoon|this evening|tonight)\b/i.test(
      near
    )
  ) {
    pm = true
    conf = 2
  } else if (
    /^[^.]{0,12}\b(?:at night|in the night|of the night|in the middle of the night|in the dead of night)\b/i.test(
      near
    )
  ) {
    if (hourAdj >= 6 && hourAdj <= 11) pm = true
    else if (hourAdj === 12 || (hourAdj >= 1 && hourAdj <= 5)) pm = false
    if (pm !== undefined) conf = 2
  }
  if (pm === undefined) {
    const am = (excerpt.match(AM_W) ?? []).length
    const pmN = (excerpt.match(PM_W) ?? []).length
    if (am > 0 && pmN === 0) {
      pm = false
      conf = 1
    } else if (pmN > 0 && am === 0) {
      if (
        /\b(?:night|midnight|dark|lamp|stars?|moon)\b/i.test(excerpt) &&
        hourAdj >= 1 &&
        hourAdj <= 5
      )
        pm = false
      else if (hourAdj === 12 && /midnight|night/i.test(excerpt)) pm = false
      else pm = true
      conf = 1
    }
  }
  if (pm === undefined) return { minutes: [toM(false), toM(true)], conf: 0 }
  if (hourAdj === 12 && pm === false) return { minutes: [toM(false)], conf }
  return { minutes: [toM(pm)], conf }
}

function excerptFor(
  text: string,
  ms: number,
  me: number
): { before: string; time: string; after: string } | null {
  const segs = sentences(text)
  const i = segs.findIndex(
    (s) => ms >= s.index && ms < s.index + s.segment.length
  )
  if (i < 0) return null
  let a = i
  let b = i
  const len = () => segs[b].index + segs[b].segment.length - segs[a].index
  if (len() > 330) return null
  if (
    len() < 110 &&
    a > 0 &&
    segs[b].index + segs[b].segment.length - segs[a - 1].index <= 290
  )
    a--
  if (
    len() < 90 &&
    b < segs.length - 1 &&
    segs[b + 1].index + segs[b + 1].segment.length - segs[a].index <= 290
  )
    b++
  const start = segs[a].index
  const end = segs[b].index + segs[b].segment.length
  if (me > end) return null
  const before = text.slice(start, ms).replace(/^\s+/, "")
  const time = text.slice(ms, me)
  const raw = text.slice(me, end).replace(/\s+$/, "")
  const full = before + time + raw
  const cut = full.length - stripFootnote(full).length
  if (cut > raw.length) return null
  const after = raw.slice(0, raw.length - cut)
  if (before.length + after.length + time.length < 45) return null
  if (!isWholeSentence(before + time + after)) return null
  return { before, time, after }
}

type Hit = {
  m: number[]
  conf: number
  strong: boolean
  time: string
  before: string
  after: string
  title: string
  author: string
  src: string
  fmt: string
}

const HAS_TIME_WORD = new RegExp(
  `\\d|\\b(?:${HW}|noon|midnight|midday|quarter|half)\\b`,
  "i"
)

// Longer relative expressions win over the hour-only or noon matches they contain.
const PRIORITY = [1, 2, 1, 3, 3, 2, 0, 2]

type Candidate = { raw: Raw; priority: number }

function scanParagraph(
  para: string,
  meta: { title: string; author: string; src: string; fmt: string },
  out: Hit[]
) {
  const text = para
    .replace(/[ \s]+/g, " ")
    .replace(
      new RegExp(`\\b(twenty|thirty|forty|fifty)- (${ONES})\\b`, "gi"),
      "$1-$2"
    )
    .trim()
  if (text.length < 40 || text.length > 6000) return
  if (!HAS_TIME_WORD.test(text)) return
  const txt = meta.fmt === "txt" || meta.fmt === "pdf"
  const candidates: Candidate[] = []
  patterns.forEach((p, i) => {
    if (txt && !p.txtOk) return
    p.re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = p.re.exec(text))) {
      const raw = p.fn(m, text)
      if (raw) candidates.push({ raw, priority: PRIORITY[i] })
    }
  })
  const overlaps = (a: Raw, b: Raw) => a.T[0] < b.T[1] && b.T[0] < a.T[1]
  const span = (c: Candidate) => c.raw.T[1] - c.raw.T[0]
  const kept = candidates.filter(
    (c) =>
      !candidates.some(
        (o) =>
          o !== c &&
          overlaps(o.raw, c.raw) &&
          (o.priority > c.priority ||
            (o.priority === c.priority && span(o) > span(c)))
      )
  )
  for (const { raw } of kept) {
    const [ms, me] = raw.T
    const ex = excerptFor(text, ms, me)
    if (!ex) continue
    const exText = ex.before + ex.time + ex.after
    const r = resolve(raw, exText, ex.before.length + ex.time.length)
    if (!r) continue
    out.push({
      m: r.minutes,
      conf: r.conf,
      strong: raw.strong,
      ...ex,
      ...meta,
    })
  }
}

const BLOCK = new Set([
  "p",
  "div",
  "br",
  "li",
  "blockquote",
  "section",
  "article",
  "tr",
  "td",
  "dd",
  "dt",
  "pre",
])
const HEAD = new Set([
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "title",
  "script",
  "style",
  "head",
  "nav",
  "figcaption",
  "table",
])

function htmlParas(html: string): string[] {
  const paras: string[] = []
  let cur = ""
  let skip = 0
  const flush = () => {
    if (skip === 0 && cur.trim()) paras.push(cur)
    cur = ""
  }
  const parser = new Parser(
    {
      onopentag(name) {
        if (HEAD.has(name)) {
          skip++
          return
        }
        if (BLOCK.has(name)) flush()
      },
      onclosetag(name) {
        if (HEAD.has(name)) {
          skip = Math.max(0, skip - 1)
          cur = ""
          return
        }
        if (BLOCK.has(name)) flush()
      },
      ontext(t) {
        if (skip === 0) cur += t
      },
    },
    { decodeEntities: true, recognizeSelfClosing: true }
  )
  parser.write(html)
  parser.end()
  flush()
  return paras
}

const attr = (tag: string, name: string) =>
  new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i").exec(tag)?.[1]

const XML_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  quot: '"',
  lt: "<",
  gt: ">",
}
const unescapeXml = (s: string) =>
  s.replace(/&(amp|apos|quot|lt|gt);/g, (_, e: string) => XML_ENTITIES[e])

function decode(s: string) {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

function cleanAuthor(a: string | undefined, fallback: string) {
  if (!a) return fallback
  let s = unescapeXml(a).replace(/\s+/g, " ").trim()
  const comma = /^([^,]+),\s*([^,]+)$/.exec(s)
  if (comma) s = `${comma[2]} ${comma[1]}`
  return s || fallback
}

function readEpub(
  path: string,
  meta: { title: string; author: string; src: string; fmt: string },
  out: Hit[]
) {
  const buf = readFileSync(path)
  if (buf[0] !== 0x50 || buf[1] !== 0x4b) throw new Error("not a zip")
  const files = unzipSync(new Uint8Array(buf), {
    filter: (f) => /\.(x?html?|opf|xml)$/i.test(f.name),
  })
  const get = (name: string) => {
    const d = files[name] ?? files[decode(name)]
    return d ? new TextDecoder("utf-8").decode(d) : undefined
  }
  const enc = get("META-INF/encryption.xml")
  if (enc) {
    const algos = [...enc.matchAll(/Algorithm="([^"]+)"/g)].map((x) => x[1])
    if (
      algos.some(
        (a) =>
          !/idpf\.org\/2008\/embedding|adobe\.com\/pdf\/enc#RC|w3\.org\/2001\/04\/xmlenc#(?:aes|kw)/i.test(
            a
          ) || /xmlenc/.test(a)
      )
    ) {
      throw new Error("drm")
    }
  }
  const container = get("META-INF/container.xml")
  const opfPath = container
    ? attr(/<rootfile\b[^>]*>/i.exec(container)?.[0] ?? "", "full-path")
    : undefined
  const opf = opfPath ? get(opfPath) : undefined
  let order: string[] = []
  if (opf && isGutenberg(opf)) meta.fmt = "gutenberg"
  if (opf && opfPath) {
    const dir = posix.dirname(opfPath)
    const t = /<dc:title[^>]*>([^<]+)</i.exec(opf)?.[1]
    const c = /<dc:creator[^>]*>([^<]+)</i.exec(opf)?.[1]
    Object.assign(
      meta,
      bookMeta(meta.src.split("/"), {
        title: t && unescapeXml(t).trim(),
        author: c && cleanAuthor(c, meta.author),
      })
    )
    const items = new Map<string, string>()
    for (const it of opf.match(/<item\b[^>]*>/gi) ?? []) {
      const id = attr(it, "id")
      const href = attr(it, "href")
      if (id && href)
        items.set(id, posix.normalize(posix.join(dir, href.split("#")[0])))
    }
    for (const ir of opf.match(/<itemref\b[^>]*>/gi) ?? []) {
      const idref = attr(ir, "idref")
      const p = idref && items.get(idref)
      if (p) order.push(p)
    }
  }
  if (order.length === 0)
    order = Object.keys(files)
      .filter((n) => /\.x?html?$/i.test(n))
      .sort()
  for (const name of order) {
    const html = get(name)
    if (!html) continue
    for (const para of htmlParas(html)) scanParagraph(para, meta, out)
  }
}

function readTxt(
  path: string,
  meta: { title: string; author: string; src: string; fmt: string },
  out: Hit[]
) {
  const s = readFileSync(path, "utf8")
  for (const para of s.split(/\r?\n\s*\r?\n/)) scanParagraph(para, meta, out)
}

async function readPdf(
  path: string,
  meta: { title: string; author: string; src: string; fmt: string },
  out: Hit[]
) {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs")
  const doc = await getDocument({
    data: new Uint8Array(readFileSync(path)),
    useSystemFonts: false,
    verbosity: 0,
    isEvalSupported: false,
  }).promise
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n)
    const tc = await page.getTextContent()
    let s = ""
    for (const it of tc.items as { str: string; hasEOL?: boolean }[]) {
      s += it.str + (it.hasEOL ? "\n" : " ")
    }
    for (const para of s.split(/\n\s*\n/))
      scanParagraph(para.replace(/\s*\n\s*/g, " "), meta, out)
    page.cleanup()
  }
  await doc.destroy()
}

const files = readFileSync(listFile, "utf8").split("\n").filter(Boolean)
const mine = files.filter((_, i) => i % shards === shard)
const doneFile = `${outDir}/shard-${shard}.done`
const done = new Set(
  existsSync(doneFile) ? readFileSync(doneFile, "utf8").split("\n") : []
)
let n = 0
for (const rel of mine) {
  if (done.has(rel)) continue
  const full = `${ROOT}/${rel}`
  const ext = rel.split(".").pop()!.toLowerCase()
  const parts = rel.split("/")
  const meta = {
    title:
      parts.length > 2
        ? parts[parts.length - 2]
        : parts[parts.length - 1].replace(/\.[^.]+$/, ""),
    author: parts[0],
    src: rel,
    fmt: ext,
  }
  const out: Hit[] = []
  try {
    if (ext === "epub") readEpub(full, meta, out)
    else if (ext === "txt") readTxt(full, meta, out)
    else if (ext === "pdf") {
      let timer: ReturnType<typeof setTimeout> | undefined
      const timeout = new Promise<never>((_, rej) => {
        timer = setTimeout(() => rej(new Error("timeout")), 120000)
      })
      try {
        await Promise.race([readPdf(full, meta, out), timeout])
      } finally {
        clearTimeout(timer)
      }
    }
    if (out.length)
      appendFileSync(
        `${outDir}/shard-${shard}.jsonl`,
        out.map((h) => JSON.stringify(h)).join("\n") + "\n"
      )
  } catch (e) {
    appendFileSync(
      `${outDir}/shard-${shard}.err`,
      `${rel}\t${(e as Error).message}\n`
    )
  }
  appendFileSync(doneFile, rel + "\n")
  if (++n % 200 === 0) console.log(`shard ${shard}: ${n}/${mine.length}`)
}
console.log(`shard ${shard} finished`)
