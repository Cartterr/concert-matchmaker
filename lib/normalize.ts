const EVENT_FEATURE_PARENS_PATTERN =
  /\((feat\.?|featuring|ft\.?)[^)]+\)/gi;
const EVENT_TRAILING_FEATURE_PATTERN = /\b(feat\.?|featuring|ft\.?)\b.+$/i;

const transliterationMap: Record<string, string> = {
  Æ: "AE",
  æ: "ae",
  Ð: "D",
  ð: "d",
  Đ: "D",
  đ: "d",
  Ł: "L",
  ł: "l",
  Ø: "O",
  ø: "o",
  Þ: "Th",
  þ: "th",
  Œ: "OE",
  œ: "oe",
  ß: "ss",
};

export function normalizeName(value: string) {
  return normalizeArtistName(value);
}

export function normalizeArtistName(value: string) {
  return normalizeBase(value, { removeLeadingThe: true });
}

export function normalizeEventTitle(value: string) {
  return normalizeBase(
    value
      .replace(EVENT_FEATURE_PARENS_PATTERN, " ")
      .replace(EVENT_TRAILING_FEATURE_PATTERN, " "),
    { removeLeadingThe: true },
  );
}

export function normalizeDedupePart(value: string | null | undefined) {
  return normalizeEventTitle(value ?? "").replace(/\s+/g, "-") || "unknown";
}

export function tokenSet(value: string) {
  return new Set(normalizeArtistName(value).split(" ").filter(Boolean));
}

export function diceTokenScore(a: string, b: string) {
  const left = tokenSet(a);
  const right = tokenSet(b);
  if (left.size === 0 || right.size === 0) return 0;

  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) intersection += 1;
  }

  return (2 * intersection) / (left.size + right.size);
}

export function splitCollaborationCandidates(value: string) {
  const parts = value
    .split(/\s+(?:x|with|vs\.?|versus)\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length > 1 ? [value, ...parts] : [value];
}

export function buildProviderDedupeKey(input: {
  provider: string;
  providerId?: string | null;
  title: string;
  startAt?: Date | string | null;
  venueName?: string | null;
}) {
  if (input.providerId) {
    return `${input.provider}:${input.providerId}`;
  }

  const start =
    input.startAt instanceof Date
      ? input.startAt.toISOString()
      : input.startAt || "unknown-date";

  return [
    input.provider,
    normalizeDedupePart(input.title),
    start.slice(0, 16),
    normalizeDedupePart(input.venueName),
  ].join(":");
}

export function safeJsonText(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function normalizeBase(value: string, options: { removeLeadingThe: boolean }) {
  const rawLower = value.trim().toLocaleLowerCase();
  const transliterated = value.replace(
    /[ÆæÐðĐđŁłØøÞþŒœß]/g,
    (char) => transliterationMap[char] ?? char,
  );

  let normalized = transliterated
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .toLocaleLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");

  if (options.removeLeadingThe && normalized.startsWith("the ")) {
    const withoutThe = normalized.slice(4).trim();
    if (withoutThe) normalized = withoutThe;
  }

  return normalized || rawLower;
}
