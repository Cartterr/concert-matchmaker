import { afterEach, describe, expect, it } from "vitest";
import { getProviderHealth, isGithubIdentityAllowed } from "@/lib/env";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("provider health", () => {
  it("skips providers with missing credentials", () => {
    delete process.env.TICKETMASTER_API_KEY;

    const ticketmaster = getProviderHealth().find(
      (provider) => provider.key === "ticketmaster",
    );

    expect(ticketmaster?.status).toBe("missing_credentials");
  });

  it("marks configured baseline providers ready without exposing values", () => {
    process.env.TICKETMASTER_API_KEY = "redacted-test-key";

    const ticketmaster = getProviderHealth().find(
      (provider) => provider.key === "ticketmaster",
    );

    expect(ticketmaster?.status).toBe("ready");
    expect(JSON.stringify(ticketmaster)).not.toContain("redacted-test-key");
  });

  it("keeps licensing-limited providers disabled by default", () => {
    process.env.BANDSINTOWN_APP_ID = "redacted-test-key";
    delete process.env.BANDSINTOWN_ENABLED;

    const bandsintown = getProviderHealth().find(
      (provider) => provider.key === "bandsintown",
    );

    expect(bandsintown?.status).toBe("disabled");
  });
});

describe("GitHub allowlist", () => {
  it("allows explicitly listed GitHub usernames", () => {
    process.env.GITHUB_ALLOWED_USERS = "Cartterr";
    process.env.GITHUB_ALLOWED_EMAILS = "";

    expect(isGithubIdentityAllowed({ login: "cartterr" })).toBe(true);
    expect(isGithubIdentityAllowed({ login: "someone-else" })).toBe(false);
  });
});
