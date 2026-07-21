import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fbf5ea",
          backgroundImage:
            "radial-gradient(circle at 85% 15%, rgba(15,118,110,0.16), transparent 55%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 130,
            fontWeight: 800,
            color: "#0f766e",
            letterSpacing: -2,
            display: "flex",
          }}
        >
          ARCE
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 34,
            color: "#241f1b",
            display: "flex",
          }}
        >
          Basta de pelear con Excel.
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 22,
            color: "#5b5147",
            display: "flex",
          }}
        >
          Registro de calificaciones para docentes de Costa Rica
        </div>
      </div>
    ),
    { ...size },
  );
}
