const FEATURE_PATTERN =
  /\b(feat\.?|featuring|ft\.?|with|x|vs\.?|versus)\b.+$/i;
const PARENS_PATTERN = /\((feat\.?|featuring|ft\.?|with)[^)]+\)/gi;

export function normalizeName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(PARENS_PATTERN, " ")
    .replace(FEATURE_PATTERN, " ")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bthe\b/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeDedupePart(value: string | null | undefined) {
  return normalizeName(value ?? "").replace(/\s+/g, "-") || "unknown";
}

export function tokenSet(value: string) {
  return new Set(normalizeName(value).split(" ").filter(Boolean));
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
