import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const WIDTH = 1200;
const HEIGHT = 630;

function safe(s: string | null, max = 80): string {
  if (!s) return "";
  const t = s.trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const title = safe(sp.get("title") ?? "HearthGuide", 80);
  const subtitle = safe(sp.get("subtitle"), 120);
  const tier = safe(sp.get("tier"), 6);
  const winRate = safe(sp.get("wr"), 6);
  const klass = safe(sp.get("class"), 24);
  const mode = safe(sp.get("mode"), 16);

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background:
            "linear-gradient(135deg, #0f1419 0%, #1a1f2e 60%, #2a3040 100%)",
          color: "#e8e6e3",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#f0b232", fontSize: 32, fontWeight: 700 }}>
          <span>⚔️</span>
          <span>HearthGuide</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {(tier || winRate || klass || mode) && (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {tier && (
                <span
                  style={{
                    padding: "8px 18px",
                    background: "rgba(240,178,50,0.18)",
                    color: "#f0b232",
                    fontSize: 26,
                    borderRadius: 10,
                    border: "1px solid rgba(240,178,50,0.4)",
                  }}
                >
                  Tier {tier}
                </span>
              )}
              {klass && (
                <span
                  style={{
                    padding: "8px 18px",
                    background: "rgba(79,195,247,0.15)",
                    color: "#4fc3f7",
                    fontSize: 26,
                    borderRadius: 10,
                    border: "1px solid rgba(79,195,247,0.35)",
                  }}
                >
                  {klass}
                </span>
              )}
              {mode && (
                <span
                  style={{
                    padding: "8px 18px",
                    background: "rgba(255,255,255,0.07)",
                    color: "#cfd6e0",
                    fontSize: 26,
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.18)",
                  }}
                >
                  {mode}
                </span>
              )}
              {winRate && (
                <span
                  style={{
                    padding: "8px 18px",
                    background: "rgba(99,217,140,0.15)",
                    color: "#63d98c",
                    fontSize: 26,
                    borderRadius: 10,
                    border: "1px solid rgba(99,217,140,0.35)",
                  }}
                >
                  {winRate}% WR
                </span>
              )}
            </div>
          )}

          <div
            style={{
              fontSize: title.length > 30 ? 64 : 84,
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.05,
              maxWidth: WIDTH - 144,
            }}
          >
            {title}
          </div>

          {subtitle && (
            <div
              style={{
                fontSize: 28,
                color: "#9aa3b2",
                lineHeight: 1.3,
                maxWidth: WIDTH - 144,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#6b7280",
            fontSize: 22,
          }}
        >
          <span>hearthguide.app</span>
          <span>Real Firestone replay data</span>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );
}
