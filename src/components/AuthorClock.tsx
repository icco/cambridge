"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"

import { type HourQuotes, quoteAt } from "@/lib/quotes"
import { msUntilNextMinute } from "@/lib/time"

import styles from "./AuthorClock.module.css"

const RELOAD_HOUR = 4
const HOUR_MS = 60 * 60 * 1000
const START_CQW = 9
const MIN_CQW = 3
const STEP_CQW = 0.25

const hourCache = new Map<number, HourQuotes>()
const hourLoads = new Map<number, Promise<void>>()

function loadHour(hour: number): Promise<void> {
  const pending = hourLoads.get(hour)
  if (pending) return pending
  const load = fetch(`/quotes/${String(hour).padStart(2, "0")}.json`)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json() as Promise<HourQuotes>
    })
    .catch((error: unknown) => {
      console.error(`Quotes for hour ${hour} failed to load`, error)
      return {} as HourQuotes
    })
    .then((quotes) => {
      hourCache.set(hour, quotes)
    })
  hourLoads.set(hour, load)
  return load
}

export function AuthorClock() {
  const [now, setNow] = useState<Date | null>(null)
  const [, setLoaded] = useState(0)
  const frame = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mountedAt = Date.now()
    let timer: ReturnType<typeof setTimeout>

    const tick = () => {
      const date = new Date()
      // A daily reload keeps a weeks-long kiosk session from accumulating state.
      if (
        date.getTime() - mountedAt > HOUR_MS &&
        date.getHours() === RELOAD_HOUR
      ) {
        window.location.reload()
        return
      }
      setNow(date)
      timer = setTimeout(tick, msUntilNextMinute(date.getTime()))
    }

    timer = setTimeout(tick, 0)
    return () => clearTimeout(timer)
  }, [])

  const hour = now?.getHours()

  useEffect(() => {
    if (hour === undefined) return
    let active = true
    const wanted = [hour, (hour + 1) % 24]
    for (const h of wanted) {
      void loadHour(h).then(() => {
        if (active) setLoaded((n) => n + 1)
      })
    }
    return () => {
      active = false
    }
  }, [hour])

  const hourQuotes = hour === undefined ? undefined : hourCache.get(hour)
  const day = now
    ? Math.floor((now.getTime() - now.getTimezoneOffset() * 60_000) / 86_400_000)
    : 0
  const quote =
    now && hourQuotes
      ? quoteAt(hourQuotes, now.getHours(), now.getMinutes(), day)
      : null

  useLayoutEffect(() => {
    const box = frame.current
    const text = content.current
    if (!box || !text) return
    let active = true
    const refit = () => {
      if (!active) return
      const style = getComputedStyle(box)
      const available =
        box.clientHeight -
        parseFloat(style.paddingTop) -
        parseFloat(style.paddingBottom)
      let size = START_CQW
      text.style.fontSize = `${size}cqw`
      while (text.scrollHeight > available && size > MIN_CQW) {
        size -= STEP_CQW
        text.style.fontSize = `${size}cqw`
      }
    }
    refit()
    // The web font can arrive after the first fit and change line breaks.
    document.fonts.ready.then(refit, (error: unknown) => {
      console.error("Font loading failed", error)
    })
    return () => {
      active = false
    }
  }, [quote?.before, quote?.time, quote?.after, quote?.title, quote?.author])

  return (
    <div ref={frame} className={styles.frame}>
      {quote && (
        <div ref={content} className={styles.content}>
          <blockquote className={styles.quote}>
            {quote.before}
            <em className={styles.time}>{quote.time}</em>
            {quote.after}
          </blockquote>
          <hr className={styles.rule} />
          <cite className={styles.cite}>
            <span className={styles.title}>{quote.title}</span>
            {quote.author}
          </cite>
        </div>
      )}
    </div>
  )
}
