import type { WeatherIcon } from "@/lib/weather"

const sun = (
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
  </>
)
const moon = <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z" />
const smallSun = (
  <>
    <circle cx="9" cy="9" r="3" />
    <path d="M9 2.5V4M2.5 9H4M4.4 4.4l1 1M13.6 4.4l-1 1" />
  </>
)
const smallMoon = <path d="M13 9.5A5 5 0 0 1 7 3.5a5 5 0 1 0 6 6Z" />
const backCloud = (
  <path d="M8.5 20a4 4 0 0 1-.4-8 5 5 0 0 1 9.6-.6 3.6 3.6 0 0 1-.2 8.6Z" />
)
const cloud = (
  <path d="M7 18a4.5 4.5 0 0 1-.4-9 6 6 0 0 1 11.5-1 4.5 4.5 0 0 1-.6 10Z" />
)
const raisedCloud = (
  <path d="M7 15a4.5 4.5 0 0 1-.4-9 6 6 0 0 1 11.5-1 4.5 4.5 0 0 1-.6 10Z" />
)

const glyphs: Record<WeatherIcon, React.ReactNode> = {
  sun,
  moon,
  "partly-day": (
    <>
      {smallSun}
      {backCloud}
    </>
  ),
  "partly-night": (
    <>
      {smallMoon}
      {backCloud}
    </>
  ),
  cloud,
  fog: <path d="M4 9h16M6 13h12M4 17h16" />,
  rain: (
    <>
      {raisedCloud}
      <path d="m8 18-1 3M12 18l-1 3M16 18l-1 3" />
    </>
  ),
  sleet: (
    <>
      {raisedCloud}
      <path d="m8 18-1 3M16 18l-1 3" />
      <circle cx="12" cy="19.5" r=".6" />
    </>
  ),
  snow: (
    <>
      {raisedCloud}
      <circle cx="8" cy="19.5" r=".6" />
      <circle cx="12" cy="19.5" r=".6" />
      <circle cx="16" cy="19.5" r=".6" />
    </>
  ),
  storm: (
    <>
      {raisedCloud}
      <path d="m13 16-2.5 3.5h3L11 23" />
    </>
  ),
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
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
    >
      {glyphs[icon]}
    </svg>
  )
}
