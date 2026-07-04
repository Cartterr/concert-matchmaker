export async function fetchJson<T>(
  url: URL,
  options: RequestInit = {},
  timeoutMs = 15000,
): Promise<T> {
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

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
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
