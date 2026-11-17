import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  type LucideIcon,
  Moon,
  Sun,
} from "lucide-react"

import type { WeatherIcon } from "@/lib/weather"

const glyphs: Record<WeatherIcon, LucideIcon> = {
  sun: Sun,
  moon: Moon,
  "partly-day": CloudSun,
  "partly-night": CloudMoon,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  sleet: CloudHail,
  snow: CloudSnow,
  storm: CloudLightning,
}

export function WeatherGlyph({
  icon,
  label,
  className,
}: {
  icon: WeatherIcon
  label: string
  className?: string
}) {
  const Glyph = glyphs[icon]
  return (
    <Glyph
      className={className}
      strokeWidth={1.75}
      role="img"
      aria-label={label}
      aria-hidden={false}
    />
  )
}
