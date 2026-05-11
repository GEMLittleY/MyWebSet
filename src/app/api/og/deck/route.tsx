import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getDeckBySlug } from "@/lib/decks";

export const runtime = "nodejs"; // need Supabase fetch
export const revalidate = 3600;

const WIDTH = 1200;
const HEIGHT = 630;

const CLASS_LABEL_EN: Record<string, string> = {
  warrior: "Warrior",
  mage: "Mage",
  hunter: "Hunter",
  paladin: "Paladin",
  priest: "Priest",
  rogue: "Rogue",
  shaman: "Shaman",
  warlock: "Warlock",
  druid: "Druid",
  "demon-hunter": "Demon Hunter",
  "death-knight": "Death Knight",
};

const CLASS_COLOR: Record<string, string> = {
  warrior: "#c41e3a",
  mage: "#3fc7eb",
  hunter: "#aad372",
  paladin: "#f48cba",
  priest: "#ffffff",
  rogue: "#fff468",
  shaman: "#0070dd",
  warlock: "#8788ee",
  druid: "#ff7c0a",
  "demon-hunter": "#a330c9",
  "death-knight": "#5acff7",
};

const HERO_PORTRAIT: Record<string, string> = {
  warrior: "HERO_01",
  mage: "HERO_08",
  hunter: "HERO_05",
  paladin: "HERO_04",
  priest: "HERO_09",
  rogue: "HERO_03",
  shaman: "HERO_02",
  warlock: "HERO_07",
  druid: "HERO_06",
  "demon-hunter": "HERO_10",
  "death-knight": "HERO_11",
};

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const langParam = req.nextUrl.searchParams.get("lang");
  const lang: "en" | "zh" = langParam === "zh" ? "zh" : "en";

  if (!slug) {
    return new ImageResponse(<Fallback msg="No deck slug" />, {
      width: WIDTH,
      height: HEIGHT,
    });
  }

  const deck = await getDeckBySlug(slug);
  if (!deck) {
    return new ImageResponse(<Fallback msg="Deck not found" />, {
      width: WIDTH,
      height: HEIGHT,
    });
  }

  const accent = CLASS_COLOR[deck.hero_class] ?? "#f0b232";
  const title = truncate(
    lang === "zh" ? deck.title : deck.title_en || deck.title,
    36,
  );
  const klass =
    lang === "zh" && deck.title.length > 0
      ? deck.title.replace(/.*[(（]/, "").replace(/[)）].*/, "")
      : CLASS_LABEL_EN[deck.hero_class] ?? deck.hero_class;
  const heroId = HERO_PORTRAIT[deck.hero_class];
  const winRate = deck.win_rate;

  // Pick up to 5 "marquee" cards: legendaries first, then highest cost.
  const cardsSorted = [...(deck.card_list ?? [])]
    .filter((c) => c.card_id)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: WIDTH,
          height: HEIGHT,
          padding: 60,
          background:
            "linear-gradient(135deg, #0f1419 0%, #1a1f2e 60%, #2a3040 100%)",
          color: "#e8e6e3",
          position: "relative",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Hero portrait wash */}
        {heroId && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://art.hearthstonejson.com/v1/256x/${heroId}.jpg`}
            width={420}
            height={630}
            alt=""
            style={{
              position: "absolute",
              right: -60,
              top: 0,
              height: HEIGHT,
              width: 480,
              objectFit: "cover",
              opacity: 0.28,
              filter: "saturate(1.1)",
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, #0f1419 35%, rgba(15,20,25,0) 100%)",
          }}
        />

        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            color: "#f0b232",
            fontSize: 30,
            fontWeight: 700,
            zIndex: 2,
          }}
        >
          <span>⚔️</span>
          <span>HearthGuide</span>
        </div>

        {/* Middle */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
            marginTop: 40,
            zIndex: 2,
            flex: 1,
          }}
        >
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span
              style={{
                padding: "8px 18px",
                background: "rgba(240,178,50,0.18)",
                color: "#f0b232",
                fontSize: 24,
                borderRadius: 10,
                border: "1px solid rgba(240,178,50,0.4)",
              }}
            >
              Tier {deck.tier}
            </span>
            <span
              style={{
                padding: "8px 18px",
                background: `${accent}33`,
                color: accent,
                fontSize: 24,
                borderRadius: 10,
                border: `1px solid ${accent}66`,
              }}
            >
              {klass}
            </span>
            <span
              style={{
                padding: "8px 18px",
                background: "rgba(99,217,140,0.16)",
                color: "#63d98c",
                fontSize: 24,
                borderRadius: 10,
                border: "1px solid rgba(99,217,140,0.35)",
              }}
            >
              {winRate}% WR
            </span>
            <span
              style={{
                padding: "8px 18px",
                background: "rgba(79,195,247,0.14)",
                color: "#4fc3f7",
                fontSize: 24,
                borderRadius: 10,
                border: "1px solid rgba(79,195,247,0.35)",
              }}
            >
              💎 {deck.dust_cost.toLocaleString()}
            </span>
          </div>

          <div
            style={{
              fontSize: title.length > 22 ? 64 : 80,
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.05,
              maxWidth: 760,
              textShadow: "0 2px 12px rgba(0,0,0,0.5)",
            }}
          >
            {title}
          </div>

          {/* Marquee cards */}
          {cardsSorted.length > 0 && (
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              {cardsSorted.map((card, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${card.card_id ?? i}`}
                  src={`https://art.hearthstonejson.com/v1/tiles/${card.card_id}.png`}
                  alt=""
                  width={150}
                  height={50}
                  style={{
                    width: 150,
                    height: 50,
                    objectFit: "cover",
                    borderRadius: 6,
                    border: `1px solid ${accent}55`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "#9aa3b2",
            fontSize: 22,
            zIndex: 2,
          }}
        >
          <span>hearthguide.app/{lang}/decks/{slug}</span>
          <span>Real replay data</span>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        "cache-control": "public, max-age=3600, s-maxage=86400, immutable",
      },
    },
  );
}

function Fallback({ msg }: { msg: string }) {
  return (
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f1419",
        color: "#e8e6e3",
        fontSize: 48,
      }}
    >
      <div style={{ color: "#f0b232", fontWeight: 700, marginBottom: 16 }}>
        HearthGuide
      </div>
      <div>{msg}</div>
    </div>
  );
}
