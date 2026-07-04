import { timingSafeEqual } from "node:crypto";

export type ProviderKey =
  | "jambase"
  | "ticketmaster"
  | "seatgeek"
  | "predicthq"
  | "eventbrite"
  | "songkick"
  | "bandsintown";

export type ProviderHealth = {
  key: ProviderKey;
  name: string;
  priority: number;
  status: "ready" | "missing_credentials" | "disabled";
  requiredEnv: string[];
  message: string;
};

export const providerDefinitions: Record<
  ProviderKey,
  {
    name: string;
    priority: number;
    requiredEnv: string[];
    disabled?: boolean;
    message: string;
  }
> = {
  jambase: {
    name: "JamBase",
    priority: 1,
    requiredEnv: ["JAMBASE_API_KEY"],
    message: "Primary music-event source when a Data API key is configured.",
  },
  ticketmaster: {
    name: "Ticketmaster Discovery",
    priority: 2,
    requiredEnv: ["TICKETMASTER_API_KEY"],
    message: "Free baseline provider for event-first music scans.",
  },
  seatgeek: {
    name: "SeatGeek",
    priority: 3,
    requiredEnv: ["SEATGEEK_CLIENT_ID"],
    message: "Secondary marketplace provider for venue and ticket coverage.",
  },
  predicthq: {
    name: "PredictHQ",
    priority: 4,
    requiredEnv: ["PREDICTHQ_ACCESS_TOKEN"],
    message: "Cross-check and enrichment provider for demand/event metadata.",
  },
  eventbrite: {
    name: "Eventbrite",
    priority: 5,
    requiredEnv: ["EVENTBRITE_TOKEN"],
    disabled: true,
    message:
      "Disabled in v1 because Eventbrite public event search is retired; use manual imports for gaps.",
  },
  songkick: {
    name: "Songkick",
    priority: 90,
    requiredEnv: ["SONGKICK_API_KEY"],
    disabled: true,
    message: "Disabled in v1 until valid licensed credentials and terms are confirmed.",
  },
  bandsintown: {
    name: "Bandsintown",
    priority: 91,
    requiredEnv: ["BANDSINTOWN_APP_ID"],
    disabled: true,
    message: "Disabled in v1 unless partnership/licensed access is explicitly enabled.",
  },
};

export function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

export function allEnvPresent(names: string[]) {
  return names.every(hasEnv);
}

export function getProviderHealth(): ProviderHealth[] {
  return Object.entries(providerDefinitions)
    .map(([key, definition]) => {
      const disabled =
        definition.disabled ||
        (key === "bandsintown" && process.env.BANDSINTOWN_ENABLED !== "true");
      const ready = allEnvPresent(definition.requiredEnv);
      const status: ProviderHealth["status"] = disabled
        ? "disabled"
        : ready
          ? "ready"
          : "missing_credentials";

      return {
        key: key as ProviderKey,
        name: definition.name,
        priority: definition.priority,
        requiredEnv: definition.requiredEnv,
        status,
        message: disabled
          ? definition.message
          : ready
            ? "Configured and eligible for scans."
            : `Missing ${definition.requiredEnv.join(", ")}.`,
      };
    })
    .sort((a, b) => a.priority - b.priority);
}

export function isDatabaseConfigured() {
  return hasEnv("DATABASE_URL");
}

export function isAuthConfigured() {
  return (
    isDatabaseConfigured() &&
    hasEnv("AUTH_SECRET") &&
    (hasEnv("AUTH_URL") || hasEnv("NEXTAUTH_URL")) &&
    hasEnv("GITHUB_ID") &&
    hasEnv("GITHUB_SECRET")
  );
}

export function getGithubAllowlist() {
  return {
    users: csvEnv("GITHUB_ALLOWED_USERS").map((value) => value.toLowerCase()),
    emails: csvEnv("GITHUB_ALLOWED_EMAILS").map((value) => value.toLowerCase()),
  };
}

export function isGithubIdentityAllowed(identity: {
  login?: string | null;
  email?: string | null;
  githubId?: string | number | null;
}) {
  const allowlist = getGithubAllowlist();
  if (allowlist.users.length === 0 && allowlist.emails.length === 0) {
    return false;
  }

  const login = identity.login?.toLowerCase();
  const email = identity.email?.toLowerCase();
  const githubId = identity.githubId ? String(identity.githubId).toLowerCase() : null;
  return Boolean(
    (login && allowlist.users.includes(login)) ||
      (email && allowlist.emails.includes(email)) ||
      (githubId && allowlist.users.includes(githubId)),
  );
}

export function isDevAuthBypassEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DEV_AUTH_BYPASS === "true"
  );
}

export function validateScheduledSecret(headerValue: string | null) {
  const secret = process.env.SCHEDULED_SCAN_SECRET;
  if (!secret || !headerValue) return false;

  const expected = Buffer.from(secret);
  const actual = Buffer.from(headerValue);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function csvEnv(name: string) {
  return (process.env[name] ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}
