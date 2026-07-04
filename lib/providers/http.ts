export async function fetchJson<T>(
  url: URL,
  options: RequestInit = {},
  timeoutMs = 15000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "concert-matchmaker/0.1",
          ...options.headers,
        },
      });

      if (response.ok) {
        return (await response.json()) as T;
      }

      const retryAfter = response.headers.get("retry-after");
      const body = sanitizeBody(await response.text().catch(() => ""));
      const error = new Error(
        `${response.status} ${response.statusText}${body ? `: ${body}` : ""}`,
      );

      if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 2) {
        throw error;
      }

      await sleep(retryDelayMs(attempt, retryAfter));
      lastError = error;
    } catch (error) {
      lastError = error;
      if (attempt === 2) throw error;
      await sleep(retryDelayMs(attempt));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed");
}

export function isoWithoutMs(date: Date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function numberFrom(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function textFrom(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function firstUrl(value: unknown) {
  if (typeof value === "string" && value.startsWith("http")) return value;
  if (Array.isArray(value)) {
    const match = value.find(
      (entry) => typeof entry === "string" && entry.startsWith("http"),
    );
    return match as string | undefined;
  }
  return undefined;
}

function retryDelayMs(attempt: number, retryAfter?: string | null) {
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return seconds * 1000;
  }
  return 350 * 2 ** attempt + Math.floor(Math.random() * 125);
}

function sanitizeBody(value: string) {
  return value
    .replace(/apikey["=: ]+[^&"\s]+/gi, "apikey=[redacted]")
    .replace(/client_secret["=: ]+[^&"\s]+/gi, "client_secret=[redacted]")
    .replace(/access_token["=: ]+[^&"\s]+/gi, "access_token=[redacted]")
    .slice(0, 400);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
