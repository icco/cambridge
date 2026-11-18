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
