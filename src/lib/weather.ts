import { fetchWeatherApi } from "openmeteo"

import { zonedTime } from "./time.ts"

export type Hour = {
  time: number
  temperature: number
  code: number
  day: boolean
}

export type Weather = Hour & { description: string; hours: Hour[] }

export type WeatherIcon =
  | "sun"
  | "moon"
  | "partly-day"
  | "partly-night"
  | "cloud"
  | "fog"
  | "drizzle"
  | "rain"
  | "sleet"
  | "snow"
  | "storm"

// WMO weather interpretation codes, as listed in https://open-meteo.com/en/docs
const descriptions: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Freezing fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Light showers",
  81: "Showers",
  82: "Heavy showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with hail",
}

export function describeWeather(code: number): string {
  return descriptions[code] ?? "Unknown"
}

export function weatherIcon(code: number, day: boolean): WeatherIcon {
  if (!descriptions[code]) return "cloud"
  if (code === 0) return day ? "sun" : "moon"
  if (code <= 2) return day ? "partly-day" : "partly-night"
  if (code === 3) return "cloud"
  if (code === 45 || code === 48) return "fog"
  if ([56, 57, 66, 67].includes(code)) return "sleet"
  if (code >= 51 && code <= 55) return "drizzle"
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow"
  if (code >= 95) return "storm"
  return "rain"
}

export function hourLabel(time: number, timeZone: string): string {
  const { hours } = zonedTime(new Date(time), timeZone)
  return `${hours % 12 || 12}${hours < 12 ? "am" : "pm"}`
}

export function nextHours(hours: Hour[], now: number, count: number): Hour[] {
  return hours.filter((hour) => hour.time > now).slice(0, count)
}

export function celsius(fahrenheit: number): string {
  return `${Math.round(((fahrenheit - 32) * 5) / 9)}°C`
}

type Variable = {
  value(): number
  valuesArray(): Float32Array | null
}

type Series = {
  time(): bigint
  interval(): number
  variables(index: number): Variable | null
}

export type ForecastResponse = {
  current(): Series | null
  hourly(): Series | null
}

function values(series: Series, index: number): Float32Array {
  const array = series.variables(index)?.valuesArray()
  if (!array) throw new Error(`open-meteo returned no hourly variable ${index}`)
  return array
}

export function toWeather(response: ForecastResponse): Weather {
  const current = response.current()
  const hourly = response.hourly()
  if (!current || !hourly) {
    throw new Error("open-meteo returned no current or hourly conditions")
  }
  const temperatures = values(hourly, 0)
  const codes = values(hourly, 1)
  const days = values(hourly, 2)
  const start = Number(hourly.time())
  const hours = Array.from(temperatures, (temperature, i) => ({
    time: (start + i * hourly.interval()) * 1000,
    temperature,
    code: codes[i],
    day: days[i] === 1,
  }))
  const code = current.variables(1)!.value()
  const unknown = new Set(
    [code, ...hours.map((hour) => hour.code)].filter(
      (value) => !descriptions[value]
    )
  )
  for (const value of unknown) {
    console.error(`unknown WMO weather code ${value}`)
  }
  return {
    time: Number(current.time()) * 1000,
    temperature: current.variables(0)!.value(),
    code,
    day: current.variables(2)!.value() === 1,
    description: describeWeather(code),
    hours,
  }
}

export async function fetchWeather(
  latitude: number,
  longitude: number
): Promise<Weather> {
  const [response] = await fetchWeatherApi(
    "https://api.open-meteo.com/v1/forecast",
    {
      latitude,
      longitude,
      current: "temperature_2m,weather_code,is_day",
      hourly: "temperature_2m,weather_code,is_day",
      forecast_hours: 8,
      temperature_unit: "fahrenheit",
    }
  )
  return toWeather(response)
}
