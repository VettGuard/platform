// Runtime-generated favicon — orange chevron-shield from the brand mark.
// One file replaces favicon.ico / apple-touch-icon.png in /public.

import { ImageResponse } from "next/og"

export const size = { width: 64, height: 64 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <svg width="64" height="64" viewBox="0 0 32 32">
          <path
            d="M16 3 L28 9 V20 C28 25 22 29 16 30 C10 29 4 25 4 20 V9 Z"
            fill="#FF4D0D"
          />
          <path
            d="M11 16 L14.5 19.5 L21 12"
            stroke="#fff"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  )
}
