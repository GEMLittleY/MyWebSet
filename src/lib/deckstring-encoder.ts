/**
 * Hearthstone deckstring encoder (browser-safe).
 *
 * Spec: https://hearthsim.info/docs/deckstrings/
 * Layout (varint everywhere except the leading reserved byte):
 *   0x00, version=1, format, |heroes|, hero*
 *   |singles|, dbfId*  (count=1, sorted asc)
 *   |doubles|, dbfId*  (count=2, sorted asc)
 *   |multi|, (dbfId, count)*  (count>=3, sorted asc by dbfId)
 */

export const FORMAT_WILD = 1;
export const FORMAT_STANDARD = 2;
export const FORMAT_CLASSIC = 3;
export const FORMAT_TWIST = 4;

/** Base hero dbfId for each class. */
export const CLASS_HEROES: Record<string, number> = {
  WARRIOR: 7,
  MAGE: 637,
  HUNTER: 31,
  PALADIN: 671,
  PRIEST: 813,
  ROGUE: 930,
  SHAMAN: 1066,
  WARLOCK: 893,
  DRUID: 274,
  DEMONHUNTER: 56550,
  DEATHKNIGHT: 78065,
};

function writeVarint(out: number[], value: number): void {
  let v = value;
  if (v < 0) throw new Error("varint cannot be negative");
  while (v >= 0x80) {
    out.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  out.push(v & 0x7f);
}

function toBase64(bytes: Uint8Array): string {
  if (typeof window === "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return window.btoa(binary);
}

export type EncodeInput = {
  format: number;
  heroes: number[];
  /** dbfId -> count (counts of 3+ are emitted via the multi section). */
  cards: Array<{ dbfId: number; count: number }>;
};

export function encodeDeckstring({ format, heroes, cards }: EncodeInput): string {
  if (!heroes.length) throw new Error("deckstring needs at least one hero");

  const singles: number[] = [];
  const doubles: number[] = [];
  const multi: Array<{ dbfId: number; count: number }> = [];
  for (const { dbfId, count } of cards) {
    if (count <= 0) continue;
    if (count === 1) singles.push(dbfId);
    else if (count === 2) doubles.push(dbfId);
    else multi.push({ dbfId, count });
  }
  singles.sort((a, b) => a - b);
  doubles.sort((a, b) => a - b);
  multi.sort((a, b) => a.dbfId - b.dbfId);

  const out: number[] = [];
  out.push(0); // reserved
  writeVarint(out, 1); // version
  writeVarint(out, format);

  writeVarint(out, heroes.length);
  for (const h of heroes) writeVarint(out, h);

  writeVarint(out, singles.length);
  for (const s of singles) writeVarint(out, s);

  writeVarint(out, doubles.length);
  for (const d of doubles) writeVarint(out, d);

  writeVarint(out, multi.length);
  for (const { dbfId, count } of multi) {
    writeVarint(out, dbfId);
    writeVarint(out, count);
  }

  return toBase64(new Uint8Array(out));
}
