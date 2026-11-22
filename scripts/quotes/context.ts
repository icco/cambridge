export function meridiemAfter(after: string): "am" | "pm" | undefined {
  const m = /^\s*([ap])\.?\s?m(?![a-z])/i.exec(after)
  if (!m) return undefined
  return m[1].toLowerCase() === "a" ? "am" : "pm"
}

// Prices, weights and scores read like spelled-out times ("two eighteen, per rod").
export function notATime(after: string): boolean {
  return /^[\s,]*(?:versus|vs\b|than\b|per\b|pounds?\b|lbs?\b|dollars?\b|cents?\b)/i.test(
    after
  )
}

// Almanac tables ("rises on the 1st, at 7:38; on the 16th, at 6:39") and enumerations ("10:24, 9:40, and 8:21 p. m.") share one suffix, and verse citations ("7:1, 2; 8:2") look like times.
export function numericListOrCitation(
  text: string,
  start: number,
  end: number
): boolean {
  if (/(?<![\d:])\d{1,3}:\d(?!\d)/.test(text)) return true
  if (
    /\b(?:rises|sets)\b/i.test(text) &&
    /\bon the \d{1,2}(?:st|nd|rd|th|d)\b/i.test(text)
  )
    return true
  const sep = String.raw`(?:,\s*|;\s*|\s+(?:and|or|to)\s+)`
  return (
    new RegExp(`^${sep}\\d{1,2}:\\d{2}`).test(text.slice(end)) ||
    new RegExp(`\\d{1,2}:\\d{2}${sep}$`).test(text.slice(0, start))
  )
}

// Race results name durations: "the time of the heat was 8:24".
export function raceTime(before: string): boolean {
  return /\b(?:time of the heat|track record|record (?:was|of)|laps?|in a time of|finished (?:in|around))\b[^.]{0,30}$/i.test(
    before
  )
}

// "from one minute to ten" opens a range of durations.
export function rangeStart(before: string): boolean {
  return /\b(?:from|between|ranging)\s+$/i.test(before)
}

// "1008 hours in the air" counts hours, not military time.
export function hoursCount(before: string, after: string): boolean {
  return (
    /\b(?:for|in|within|over|than|some|nearly|almost|about)\s+$/i.test(
      before
    ) ||
    /^\s*(?:in|of|ago|later|long|without|aloft|flying|out|more|less|or|to)\b/i.test(
      after
    )
  )
}

export function isGutenberg(opf: string): boolean {
  return /<dc:identifier[^>]*>[^<]*gutenberg\.org/i.test(opf)
}

export function bookMeta(
  parts: string[],
  opf: { title?: string; author?: string }
): { title: string; author: string } {
  if (parts.length > 2)
    return { title: parts[parts.length - 2], author: parts[0] }
  return {
    title: opf.title || parts[parts.length - 1].replace(/\.[^.]+$/, ""),
    author: opf.author || parts[0],
  }
}
