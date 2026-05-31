import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Shall I Watch The Race?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 90px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Red accent bar */}
        <div
          style={{
            width: "56px",
            height: "6px",
            background: "#e8002d",
            borderRadius: "3px",
            marginBottom: "36px",
          }}
        />

        {/* Title */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: "900",
            color: "white",
            letterSpacing: "-2px",
            lineHeight: "1.05",
            marginBottom: "28px",
          }}
        >
          Shall I Watch{"\ "}
          <span style={{ color: "#e8002d" }}>the Race?</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "26px",
            color: "#888888",
            lineHeight: "1.5",
            maxWidth: "780px",
          }}
        >
          Spoiler-free Watch or Highlights verdict for every F1 race.
          No results, finishing positions, or driver names revealed.
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            right: "90px",
            fontSize: "18px",
            color: "#444444",
            letterSpacing: "0.5px",
          }}
        >
          shalliwatchtherace.com
        </div>
      </div>
    ),
    { ...size }
  );
}
