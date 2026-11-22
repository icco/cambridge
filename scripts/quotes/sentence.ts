const seg = new Intl.Segmenter("en", { granularity: "sentence" })

const ABBREVIATION =
  /(?:\b(?:Mr|Mrs|Ms|Mx|Dr|St|Mt|Jr|Sr|Prof|Rev|Gen|Col|Capt|Lt|Sgt|Gov|Sen|Rep|Vol|vol|vs|p|pp|ch|ed|eds|[Ff]ig|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)|(?<![\p{L}.])(?!I\.)\p{Lu})\.\s*$/u

const MERIDIEM = /\b[ap]\.\s?m\.\s*$/i

export type Sentence = { index: number; segment: string }

// Intl.Segmenter breaks after "?”" before a lowercase attribution and after abbreviations.
export function sentences(text: string): Sentence[] {
  const out: Sentence[] = []
  for (const { index, segment } of seg.segment(text)) {
    const prev = out.at(-1)
    if (
      prev &&
      (/^[“"‘'(\s]*\p{Ll}/u.test(segment) ||
        ABBREVIATION.test(prev.segment) ||
        MERIDIEM.test(prev.segment))
    ) {
      prev.segment += segment
      continue
    }
    out.push({ index, segment })
  }
  return out
}

export function stripFootnote(s: string): string {
  return s.replace(/(\D[.!?…]["”’')\]]*)\d{1,4}$/u, "$1")
}

export function isWholeSentence(s: string): boolean {
  const t = s.trim()
  return (
    /^[“"‘'(\[]*[\p{Lu}\d]/u.test(t) &&
    /[.!?…—]["”’')\]]*$/u.test(t) &&
    !ABBREVIATION.test(t) &&
    !/^\d{1,2}, /.test(t)
  )
}
