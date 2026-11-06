import { defaultState } from "./pricing";
import type { ConfiguratorState } from "./pricing";
import { sanitizeState } from "./state";

// ============================================
// Share links: the whole configuration in the URL hash, so sharing needs no
// backend and costs nothing to run.
//
//   #c=v1.<key>_<value>~<key>_<value>~…~k_<checksum>
//   e.g. #c=v1.s_20~l_gold-river~lt_lot-maple-ridge~m_bali~p_1~k_1x0v2ra
//
// Only fields that differ from defaultState() are written, under the short
// keys below: ids as they are, numbers in plain decimal, booleans as 1 or 0,
// the own-land size as <width>x<depth>, and an empty value for null. Every
// character is URL-safe, and the link stays short enough to travel inside the
// enquiry email (lib/enquiry.ts). The checksum makes a truncated or garbled
// link unreadable rather than half right.
//
// Decoding always ends in sanitizeState(), so a link can only ever produce a
// state the app trusts; a link that can't be read decodes to null and is
// ignored.
//
// Changing the format: add a v2 encoder and keep the v1 decoder, so links
// already sent keep working. A new ConfiguratorState field needs an entry in
// FIELD_CODECS; the Record type won't compile until it has one.
// ============================================

export const SHARE_HASH_PARAM = "c";
export const SHARE_VERSION = "v1";
/** Longest token accepted, far above any real configuration. */
const MAX_TOKEN_LENGTH = 2000;
const CHECKSUM_KEY = "k";

type Codec = "id" | "number" | "flag" | "size";
type MortgageTerm = keyof ConfiguratorState["mortgage"];
type TopField = Exclude<keyof ConfiguratorState, "mortgage">;

// Every field, in the order links write them. The mortgage terms are written
// as three entries of their own.
const FIELD_CODECS: Record<TopField, { key: string; codec: Codec }> = {
  step: { key: "s", codec: "number" },
  landSituation: { key: "l", codec: "id" },
  selectedLotId: { key: "lt", codec: "id" },
  uploadedLot: { key: "ul", codec: "size" },
  modelId: { key: "m", codec: "id" },
  sidingStyleId: { key: "ss", codec: "id" },
  sidingColorId: { key: "sc", codec: "id" },
  roofTypeId: { key: "rt", codec: "id" },
  metalRoofColorId: { key: "rc", codec: "id" },
  hasFrontPorch: { key: "p", codec: "flag" },
  hasVestibule: { key: "vb", codec: "flag" },
  exteriorTrimId: { key: "et", codec: "id" },
  flooringId: { key: "f", codec: "id" },
  countertopsId: { key: "ct", codec: "id" },
  cabinetStyleId: { key: "cb", codec: "id" },
  paintPackageId: { key: "pp", codec: "id" },
  interiorTrimId: { key: "it", codec: "id" },
  lightingPackageId: { key: "lp", codec: "id" },
  hardwareFinishId: { key: "hw", codec: "id" },
  insulationId: { key: "in", codec: "id" },
  hasFireplace: { key: "fp", codec: "flag" },
  foundationType: { key: "fd", codec: "id" },
  waterType: { key: "w", codec: "id" },
  sewerType: { key: "sw", codec: "id" },
  landPrice: { key: "lpr", codec: "number" },
};

const MORTGAGE_KEYS: Record<MortgageTerm, string> = {
  downPaymentPercent: "d",
  interestRate: "r",
  amortizationYears: "a",
};

/** Every short key in use, so a check can confirm none repeat. */
export const SHARE_KEYS: readonly string[] = [
  ...Object.values(FIELD_CODECS).map((f) => f.key),
  ...Object.values(MORTGAGE_KEYS),
  CHECKSUM_KEY,
];

const TOP_FIELDS = Object.keys(FIELD_CODECS) as TopField[];
const TERMS = Object.keys(MORTGAGE_KEYS) as MortgageTerm[];
const TOP_FIELD_BY_KEY = new Map(TOP_FIELDS.map((field) => [FIELD_CODECS[field].key, field]));
const TERM_BY_KEY = new Map(TERMS.map((term) => [MORTGAGE_KEYS[term], term]));

/** Ids in the data are letters, digits and hyphens; anything else can't be a valid choice. */
const ID_PATTERN = /^[A-Za-z0-9.-]+$/;
const TOKEN_PATTERN = /^v1\.([A-Za-z0-9._~+-]+)$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

/** A value as link text, or undefined when it can't be written (sanitizeState would reject it anyway). */
function encodeValue(codec: Codec, value: unknown): string | undefined {
  if (value === null) return "";
  switch (codec) {
    case "flag":
      return typeof value === "boolean" ? (value ? "1" : "0") : undefined;
    case "number":
      return finite(value) ? String(value) : undefined;
    case "id":
      return typeof value === "string" && ID_PATTERN.test(value) ? value : undefined;
    case "size":
      return isPlainObject(value) && finite(value.widthFt) && finite(value.depthFt)
        ? `${value.widthFt}x${value.depthFt}`
        : undefined;
  }
}

/** Link text back to a value, or undefined when it can't be read (the field then takes its default). */
function decodeValue(codec: Codec, text: string): unknown {
  if (text === "") return null;
  switch (codec) {
    case "flag":
      return text === "1" ? true : text === "0" ? false : undefined;
    case "number": {
      const n = Number(text);
      return Number.isFinite(n) ? n : undefined;
    }
    case "id":
      return ID_PATTERN.test(text) ? text : undefined;
    case "size": {
      const [width, depth, ...rest] = text.split("x").map(Number);
      return rest.length === 0 && Number.isFinite(width) && Number.isFinite(depth)
        ? { widthFt: width, depthFt: depth }
        : undefined;
    }
  }
}

/** FNV-1a, in base 36: enough to catch a truncated or garbled link, not a security measure. */
function checksum(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

/** The token for a configuration: "v1.<entries>~k_<checksum>". */
export function encodeConfiguration(state: ConfiguratorState): string {
  const base = defaultState();
  const entries: string[] = [];
  for (const field of TOP_FIELDS) {
    if (JSON.stringify(state[field]) === JSON.stringify(base[field])) continue;
    const { key, codec } = FIELD_CODECS[field];
    const text = encodeValue(codec, state[field]);
    if (text !== undefined) entries.push(`${key}_${text}`);
  }
  for (const term of TERMS) {
    if (state.mortgage[term] === base.mortgage[term]) continue;
    const text = encodeValue("number", state.mortgage[term]);
    if (text !== undefined) entries.push(`${MORTGAGE_KEYS[term]}_${text}`);
  }
  const signed = `${SHARE_VERSION}.${entries.join("~")}`;
  return `${signed}${entries.length > 0 ? "~" : ""}${CHECKSUM_KEY}_${checksum(signed)}`;
}

/** The configuration in a token, sanitized. Null when the token can't be read. */
export function decodeConfiguration(token: string): ConfiguratorState | null {
  if (token.length > MAX_TOKEN_LENGTH) return null;
  let text: string;
  try {
    // Undo any percent-encoding a mail client or chat app added along the way.
    text = decodeURIComponent(token);
  } catch {
    return null;
  }
  const match = TOKEN_PATTERN.exec(text);
  if (!match) return null;

  const entries = match[1].split("~");
  const last = entries.pop() ?? "";
  const signed = `${SHARE_VERSION}.${entries.join("~")}`;
  if (last !== `${CHECKSUM_KEY}_${checksum(signed)}`) return null;

  const raw: Record<string, unknown> = {};
  const mortgage: Record<string, unknown> = {};
  for (const entry of entries) {
    const split = entry.indexOf("_");
    if (split <= 0) return null;
    const key = entry.slice(0, split);
    const value = entry.slice(split + 1);
    const field = TOP_FIELD_BY_KEY.get(key);
    const term = TERM_BY_KEY.get(key);
    const decoded = field ? decodeValue(FIELD_CODECS[field].codec, value) : term ? decodeValue("number", value) : undefined;
    if (decoded === undefined) continue;
    if (field) raw[field] = decoded;
    else if (term) mortgage[term] = decoded;
  }
  raw.mortgage = mortgage;
  return sanitizeState(raw);
}

/** The URL hash for a configuration: "#c=v1.…". */
export function shareHash(state: ConfiguratorState): string {
  return `#${SHARE_HASH_PARAM}=${encodeConfiguration(state)}`;
}

/** A share link: the configurator's URL (any hash dropped) plus the configuration's hash. */
export function shareUrl(pageUrl: string, state: ConfiguratorState): string {
  return `${pageUrl.split("#")[0]}${shareHash(state)}`;
}

// The raw token after "c=". Read by hand rather than with URLSearchParams,
// which would turn a "+" in a number into a space.
function hashToken(hash: string): string | null {
  for (const param of hash.replace(/^#/, "").split("&")) {
    if (param.startsWith(`${SHARE_HASH_PARAM}=`)) return param.slice(SHARE_HASH_PARAM.length + 1);
  }
  return null;
}

/** True when a URL hash carries a share link, whether or not it can be read. */
export function hasShareHash(hash: string): boolean {
  return hashToken(hash) !== null;
}

/** The configuration in a URL hash, sanitized. Null when the hash holds no readable share link. */
export function readShareHash(hash: string): ConfiguratorState | null {
  const token = hashToken(hash);
  return token ? decodeConfiguration(token) : null;
}

/** True when two states describe the same home, whichever screen each was on. */
export function sameConfiguration(a: ConfiguratorState, b: ConfiguratorState): boolean {
  return encodeConfiguration({ ...a, step: 1 }) === encodeConfiguration({ ...b, step: 1 });
}
