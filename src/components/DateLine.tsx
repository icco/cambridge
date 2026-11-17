"use client"

import { useEffect, useState } from "react"

import { cambridge, home } from "@/lib/cities"
import { dayFactor } from "@/lib/daylight"
import { writtenDate } from "@/lib/time"
import {
  celsius,
  describeWeather,
  type Hour,
  hourLabel,
  nextHours,
  type Weather,
  weatherIcon,
} from "@/lib/weather"

import styles from "./DateLine.module.css"
import { WeatherGlyph } from "./WeatherGlyph"

const WEATHER_MS = 15 * 60 * 1000
const HOURS_AHEAD = 5

function HourCell({
  hour,
  label,
  children,
}: {
  hour: Hour
  label: string
  children?: React.ReactNode
}) {
  return (
    <li className={styles.hour}>
      <span className={styles.hourLabel}>{label}</span>
      <span className={styles.reading}>
        <WeatherGlyph
          icon={weatherIcon(hour.code, hour.day)}
          label={describeWeather(hour.code)}
          className={styles.glyph}
        />
        {Math.round(hour.temperature)}°{children}
      </span>
    </li>
  )
}

export function DateLine({ now }: { now: Date }) {
  const [weather, setWeather] = useState<Weather | null>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    let disposed = false

    const load = async () => {
      try {
        const response = await fetch("/api/weather")
        const body = await response.json()
        if (!response.ok) {
          throw new Error(body.error ?? `weather returned ${response.status}`)
        }
        if (!disposed) setWeather(body as Weather)
      } catch (error) {
        // Keep showing the last reading; the next poll may succeed.
        if (!disposed) console.error("weather update failed", error)
      }
      if (!disposed) timer = setTimeout(load, WEATHER_MS)
    }

    timer = setTimeout(load, 0)
    return () => {
      disposed = true
      clearTimeout(timer)
    }
  }, [])

  const { weekday, date } = writtenDate(now, home.timeZone)
  const night = dayFactor(now, cambridge.latitude, cambridge.longitude) < 0.45

  return (
    <div className={`${styles.date} ${night ? styles.night : ""}`}>
      <div className={styles.weekday}>{weekday}</div>
      <div className={styles.day}>{date}</div>
      {weather && (
        <ol className={styles.hours}>
          <HourCell hour={weather} label="Now">
            <span className={styles.celsius}>
              {celsius(weather.temperature)}
            </span>
          </HourCell>
          {nextHours(weather.hours, now.getTime(), HOURS_AHEAD).map((hour) => (
            <HourCell
              key={hour.time}
              hour={hour}
              label={hourLabel(hour.time, home.timeZone)}
            />
          ))}
        </ol>
      )}
    </div>
  )
}
