import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"

const [dir, outDir, perArg] = process.argv.slice(2)
const PER = Number(perArg ?? 8)

type Hit = {
  m: number[]
  conf: number
  strong: boolean
  time: string
  before: string
  after: string
  title: string
  author: string
  fmt: string
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "")
const hash = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++)
    h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return (h >>> 0) / 2 ** 32
}

const seen = new Set<string>()
const byMinute: Hit[][] = Array.from({ length: 1440 }, () => [])
let total = 0
for (const f of readdirSync(dir).filter((x) => x.endsWith(".jsonl"))) {
  for (const line of readFileSync(`${dir}/${f}`, "utf8").split("\n")) {
    if (!line) continue
    const h: Hit = JSON.parse(line)
    const key = [
      norm(h.before),
      norm(h.time),
      norm(h.after),
      h.m.join(","),
    ].join("|")
    if (seen.has(key)) continue
    seen.add(key)
    total++
    for (const m of h.m) byMinute[m].push(h)
  }
}

const score = (h: Hit, minute: number) => {
  const len = h.before.length + h.time.length + h.after.length
  let s = h.conf === 2 ? 30 : h.conf === 1 ? 15 : 0
  if (h.fmt !== "epub") s -= 15
  if (h.strong) s += 5
  if (len >= 90 && len <= 240) s += 10
  if (((h.before + h.after).match(/\d/g)?.length ?? 0) > 6) s -= 10
  return s + hash(h.before + h.after + minute) * 4
}

const bookKey = (h: Hit) => norm(h.title) + "|" + norm(h.author)
const hist = { zero: 0, low: 0, ok: 0 }
const short: string[] = []
mkdirSync(outDir, { recursive: true })
let picked = 0
for (let hour = 0; hour < 24; hour++) {
  const obj: Record<string, unknown[]> = {}
  for (let min = 0; min < 60; min++) {
    const minute = hour * 60 + min
    const sorted = byMinute[minute].sort(
      (a, b) => score(b, minute) - score(a, minute)
    )
    const books = new Set<string>()
    const authors = new Map<string, number>()
    const chosen: Hit[] = []
    for (const h of sorted) {
      if (chosen.length >= PER) break
      const bk = bookKey(h)
      if (books.has(bk)) continue
      const ak = norm(h.author)
      if ((authors.get(ak) ?? 0) >= 2) continue
      books.add(bk)
      authors.set(ak, (authors.get(ak) ?? 0) + 1)
      chosen.push(h)
    }
    picked += chosen.length
    if (chosen.length === 0) hist.zero++
    else if (chosen.length < 5) hist.low++
    else hist.ok++
    if (chosen.length < 5)
      short.push(
        `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}=${chosen.length}`
      )
    if (chosen.length) {
      obj[String(min).padStart(2, "0")] = chosen.map((h) => ({
        b: h.before,
        t: h.time,
        a: h.after,
        title: h.title,
        author: h.author,
      }))
    }
  }
  writeFileSync(
    `${outDir}/${String(hour).padStart(2, "0")}.json`,
    JSON.stringify(obj)
  )
}
console.log(JSON.stringify({ uniqueHits: total, picked, ...hist }))
writeFileSync(`${dir}/coverage.txt`, short.join("\n") + "\n")
