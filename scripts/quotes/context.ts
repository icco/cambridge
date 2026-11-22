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

// Almanac lists ("at 7:38; on the 16th, at 6:39, and ... 5:39 p. m.") share one suffix, and verse citations ("7:1, 2; 8:2") look like times.
export function numericListOrCitation(
  text: string,
  start: number,
  end: number
): boolean {
  if (/(?<![\d:])\d{1,3}:\d(?!\d)/.test(text)) return true
  const near =
    text.slice(Math.max(0, start - 40), start) +
    " | " +
    text.slice(end, end + 40)
  return /(?<![\d:])\d{1,3}:\d{2}(?!\d)/.test(near)
}

// Race results and ranges name durations: "the time of the heat was 8:24", "from one minute to ten".
export function durationBefore(before: string): boolean {
  return (
    /\b(?:heats?|races?|records?|laps?|miles?|finish(?:ed)?|winners?|winning|seconds?)\b[^.]{0,40}$/i.test(
      before
    ) || /\b(?:from|between|ranging)\s+$/i.test(before)
  )
}

// "1008 hours in the air" counts hours, not military time.
export function hoursCount(before: string, after: string): boolean {
  return (
    /\b(?:for|of|in|within|over|than|some|nearly|almost|about)\s+$/i.test(
      before
    ) ||
    /^\s*(?:in|of|on|ago|later|long|without|aloft|flying|out|more|less|or|to)\b/i.test(
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
