// Browser- and edge-safe Hearthstone deckstring decoder.
// Spec: https://hearthsim.info/docs/deckstrings/

export type DecodedDeck = {
  format: number;
  heroes: number[];
  cards: Array<{ dbfId: number; count: number }>;
};

class VarintReader {
  private buf: Uint8Array;
  private pos = 0;
  constructor(buf: Uint8Array) {
    this.buf = buf;
  }
  hasMore() {
    return this.pos < this.buf.length;
  }
  readByte(): number {
    if (this.pos >= this.buf.length) throw new Error("unexpected EOF");
    return this.buf[this.pos++]!;
  }
  readVarint(): number {
    let result = 0;
    let shift = 0;
    for (;;) {
      const byte = this.readByte();
      result |= (byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) break;
      shift += 7;
      if (shift > 35) throw new Error("varint too long");
    }
    return result;
  }
}

function base64ToBytes(b64: string): Uint8Array {
  const cleaned = b64.replace(/\s+/g, "").replace(/^["']|["']$/g, "");
  // atob handles standard base64; deckstrings are always standard.
  const bin = atob(cleaned);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function decodeDeckstring(code: string): DecodedDeck {
  const r = new VarintReader(base64ToBytes(code));

  const reserved = r.readByte();
  if (reserved !== 0) throw new Error(`unexpected reserved byte: ${reserved}`);
  const version = r.readVarint();
  if (version !== 1) throw new Error(`unsupported deckstring version: ${version}`);
  const format = r.readVarint();

  const heroCount = r.readVarint();
  const heroes: number[] = [];
  for (let i = 0; i < heroCount; i++) heroes.push(r.readVarint());

  const cards: Array<{ dbfId: number; count: number }> = [];

  const numSingles = r.readVarint();
  for (let i = 0; i < numSingles; i++) {
    cards.push({ dbfId: r.readVarint(), count: 1 });
  }
  const numDoubles = r.readVarint();
  for (let i = 0; i < numDoubles; i++) {
    cards.push({ dbfId: r.readVarint(), count: 2 });
  }
  const numMulti = r.readVarint();
  for (let i = 0; i < numMulti; i++) {
    const dbfId = r.readVarint();
    const count = r.readVarint();
    cards.push({ dbfId, count });
  }

  // Sideboard segments (introduced for E.T.C. and friends). We deliberately
  // drop them — only the main deck matters for crafting cost.
  try {
    if (!r.hasMore()) return { format, heroes, cards };
    const hasSideboards = r.readByte();
    if (hasSideboards !== 1) return { format, heroes, cards };
    for (let section = 0; section < 3; section++) {
      if (!r.hasMore()) break;
      const num = r.readVarint();
      for (let i = 0; i < num; i++) {
        r.readVarint();
        r.readVarint();
      }
    }
  } catch {
    // Tolerate malformed sideboards — main deck stays usable.
  }

  return { format, heroes, cards };
}
