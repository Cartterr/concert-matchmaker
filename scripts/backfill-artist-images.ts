import { pathToFileURL } from "node:url";

type BackfillArgs = {
  all: boolean;
  catalogId?: string;
  concurrency: number;
  dryRun: boolean;
  force: boolean;
  limit?: number;
};

const SPOTIFY_ARTIST_ID_PATTERN = /^[A-Za-z0-9]{22}$/;
const DEFAULT_CONCURRENCY = 4;

export function extractSpotifyArtistImage(html: string) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of metaTags) {
    const property = readHtmlAttribute(tag, "property");
    if (property !== "og:image") continue;

    const content = readHtmlAttribute(tag, "content");
    if (!content) continue;

    const decoded = decodeHtmlAttribute(content);
    if (isSpotifyImageUrl(decoded)) return decoded;
  }
  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { prisma } = await import("@/lib/db");

  const catalog = args.catalogId
    ? await prisma.artistCatalog.findUnique({
        where: { id: args.catalogId },
        select: { id: true, name: true },
      })
    : await prisma.artistCatalog.findFirst({
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true },
      });

  if (!catalog) {
    console.log("No artist catalog found.");
    return;
  }

  const targets = await prisma.artist.findMany({
    where: {
      catalogId: catalog.id,
      spotifyId: { not: null },
      ...(args.force ? {} : { imageUrl: null }),
      ...(args.all ? {} : { matches: { some: {} } }),
    },
    select: {
      id: true,
      name: true,
      spotifyId: true,
    },
    orderBy: { name: "asc" },
    take: args.limit,
  });

  console.log(`Catalog: ${catalog.name} (${catalog.id})`);
  console.log(`Scope: ${args.all ? "all catalog artists" : "matched artists"}`);
  console.log(`Targets: ${targets.length}`);

  let checked = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  await runPool(targets, args.concurrency, async (artist) => {
    checked += 1;
    if (!artist.spotifyId || !SPOTIFY_ARTIST_ID_PATTERN.test(artist.spotifyId)) {
      skipped += 1;
      return;
    }

    try {
      const imageUrl = await fetchSpotifyArtistImage(artist.spotifyId);
      if (!imageUrl) {
        skipped += 1;
        console.log(`No image: ${artist.name}`);
        return;
      }

      if (!args.dryRun) {
        await prisma.artist.update({
          where: { id: artist.id },
          data: { imageUrl },
        });
      }

      updated += 1;
      console.log(`${args.dryRun ? "Would update" : "Updated"}: ${artist.name}`);
    } catch (error) {
      failed += 1;
      console.log(`Failed: ${artist.name} (${errorMessage(error)})`);
    }
  });

  console.log("");
  console.log(
    `Done. checked=${checked} updated=${updated} skipped=${skipped} failed=${failed}`,
  );
}

async function fetchSpotifyArtistImage(spotifyId: string) {
  const response = await fetch(`https://open.spotify.com/artist/${spotifyId}`, {
    headers: {
      Accept: "text/html",
      "User-Agent": "concert-matchmaker/0.1",
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return extractSpotifyArtistImage(await response.text());
}

function parseArgs(argv: string[]): BackfillArgs {
  const args: BackfillArgs = {
    all: false,
    concurrency: DEFAULT_CONCURRENCY,
    dryRun: false,
    force: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") {
      continue;
    } else if (arg === "--all") {
      args.all = true;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--force") {
      args.force = true;
    } else if (arg === "--catalog-id") {
      args.catalogId = readRequiredValue(argv, ++index, arg);
    } else if (arg.startsWith("--catalog-id=")) {
      args.catalogId = arg.slice("--catalog-id=".length);
    } else if (arg === "--limit") {
      args.limit = parsePositiveInt(readRequiredValue(argv, ++index, arg), arg);
    } else if (arg.startsWith("--limit=")) {
      args.limit = parsePositiveInt(arg.slice("--limit=".length), "--limit");
    } else if (arg === "--concurrency") {
      args.concurrency = parsePositiveInt(readRequiredValue(argv, ++index, arg), arg);
    } else if (arg.startsWith("--concurrency=")) {
      args.concurrency = parsePositiveInt(
        arg.slice("--concurrency=".length),
        "--concurrency",
      );
    } else if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  args.concurrency = Math.min(Math.max(args.concurrency, 1), 8);
  return args;
}

function printUsage() {
  console.log(`Usage: pnpm artists:images [options]

Options:
  --all                  Backfill every artist in the latest catalog.
  --catalog-id <id>      Use a specific catalog instead of the latest.
  --concurrency <n>      Parallel Spotify page fetches, 1-8. Default: 4.
  --dry-run              Fetch images without writing to the database.
  --force                Update artists that already have imageUrl.
  --limit <n>            Cap the number of artists processed.
`);
}

function readRequiredValue(argv: string[], index: number, flag: string) {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value.`);
  }
  return value;
}

function parsePositiveInt(value: string, flag: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${flag} must be a positive integer.`);
  }
  return parsed;
}

async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
) {
  let nextIndex = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (nextIndex < items.length) {
        const item = items[nextIndex];
        nextIndex += 1;
        await worker(item);
      }
    }),
  );
}

function readHtmlAttribute(tag: string, attributeName: string) {
  const pattern = new RegExp(
    `${attributeName}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i",
  );
  const match = tag.match(pattern);
  return match?.[2] ?? match?.[3] ?? match?.[4] ?? null;
}

function decodeHtmlAttribute(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function isSpotifyImageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith("scdn.co");
  } catch {
    return false;
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .catch((error) => {
      console.error(errorMessage(error));
      process.exitCode = 1;
    })
    .finally(async () => {
      const { prisma } = await import("@/lib/db");
      await prisma.$disconnect();
    });
}
