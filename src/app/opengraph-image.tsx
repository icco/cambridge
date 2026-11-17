import { ImageResponse } from "next/og"

import { site } from "@/lib/site"

export const alt = site.name
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 72,
          background: "#e9e6f2",
          color: "#1b1f3b",
        }}
      >
        <svg width="460" height="460" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="30" fill="#161b3d" />
          <path
            d="M32 32V12M32 32l12 8"
            stroke="#f2ebd9"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle cx="32" cy="32" r="2.5" fill="#ff5a36" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 1.05 }}>
            Cambridge
          </div>
          <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 1.05 }}>
            Clock
          </div>
        </div>
      </div>
    ),
    size,
  )
}
