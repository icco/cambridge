"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"

import { quoteFor } from "@/lib/quotes"
import { msUntilNextMinute } from "@/lib/time"

import styles from "./AuthorClock.module.css"

const RELOAD_HOUR = 4
const HOUR_MS = 60 * 60 * 1000
const START_CQW = 9
const MIN_CQW = 3
const STEP_CQW = 0.25

export function AuthorClock() {
  const [now, setNow] = useState<Date | null>(null)
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

  const quote = now ? quoteFor(now.getHours(), now.getMinutes()) : null

  useLayoutEffect(() => {
    const box = frame.current
    const text = content.current
    if (!box || !text) return
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
  }, [quote?.before, quote?.time])

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
