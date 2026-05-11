// Hearthstone deckstring decoder (HSReplay deck format).
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
    while (true) {
      const byte = this.readByte();
      result |= (byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) break;
      shift += 7;
      if (shift > 35) throw new Error("varint too long");
    }
    return result;
  }
}

export function decodeDeckstring(code: string): DecodedDeck {
  const cleaned = code.replace(/\s+/g, "").replace(/^["']|["']$/g, "");
  const buf = Buffer.from(cleaned, "base64");
  const r = new VarintReader(new Uint8Array(buf));

  const reserved = r.readByte();
  if (reserved !== 0) throw new Error(`unexpected reserved byte: ${reserved}`);
  const version = r.readVarint();
  if (version !== 1) throw new Error(`unsupported deckstring version: ${version}`);
  const format = r.readVarint();

  const heroCount = r.readVarint();
  const heroes: number[] = [];
  for (let i = 0; i < heroCount; i++) heroes.push(r.readVarint());

  const cards: Array<{ dbfId: number; count: number }> = [];

  // single-copy cards
  const numSingles = r.readVarint();
  for (let i = 0; i < numSingles; i++) {
    cards.push({ dbfId: r.readVarint(), count: 1 });
  }

  // double-copy cards
  const numDoubles = r.readVarint();
  for (let i = 0; i < numDoubles; i++) {
    cards.push({ dbfId: r.readVarint(), count: 2 });
  }

  // n-copy cards (count >= 3, used in some custom modes)
  const numMulti = r.readVarint();
  for (let i = 0; i < numMulti; i++) {
    const dbfId = r.readVarint();
    const count = r.readVarint();
    cards.push({ dbfId, count });
  }

  // Sideboards (E.T.C., Band Manager etc., introduced in later format
  // revisions): hasSideboards flag (1 byte), then three (num, [card, owner]*)
  // sections paralleling the single/double/multi structure above. We only need
  // the main deck for our purposes, so we deliberately drop these. We
  // tolerate truncated or absent sideboard data — anything we cannot parse is
  // simply ignored.
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
    // Malformed sideboard segment — main deck stays usable.
  }

  return { format, heroes, cards };
}
