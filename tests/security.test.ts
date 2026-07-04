import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("repository hygiene", () => {
  it("keeps sensitive local files ignored", () => {
    const gitignore = readFileSync(".gitignore", "utf8");

    expect(gitignore).toContain(".env");
    expect(gitignore).toContain("spotify-exports/");
    expect(gitignore).toContain("liked-artists.*");
    expect(gitignore).toContain("*.token.json");
  });

  it("does not track obvious secret or personal export files", () => {
    const files = execSync("git ls-files", { encoding: "utf8" })
      .split(/\r?\n/g)
      .filter(Boolean);

    expect(files.some((file) => file.endsWith(".env"))).toBe(false);
    expect(files.some((file) => file.includes("spotify-exports"))).toBe(false);
    expect(files.some((file) => /liked-artists\./.test(file))).toBe(false);
  });
});
