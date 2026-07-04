import { prisma } from "@/lib/db";
import {
  parseArtistCatalogWithReport,
  type ImportedArtist,
} from "@/lib/import-artists";

export async function importArtistCatalog(input: {
  name: string;
  source?: string;
  filename?: string;
  content: string;
  createdById?: string | null;
}) {
  const parsed = parseArtistCatalogWithReport(input.content, input.filename);
  const catalog = await prisma.artistCatalog.create({
    data: {
      name: input.name,
      source: input.source ?? input.filename ?? "manual",
      createdById: input.createdById ?? undefined,
    },
    include: {
      _count: {
        select: { artists: true },
      },
    },
  });

  if (parsed.artists.length > 0) {
    await prisma.artist.createMany({
      data: parsed.artists.map((artist) => ({
        catalogId: catalog.id,
        ...toArtistCreateInput(artist),
      })),
      skipDuplicates: true,
    });
  }

  return {
    catalog,
    artistCount: parsed.summary.imported,
    summary: parsed.summary,
  };
}

function toArtistCreateInput(artist: ImportedArtist) {
  return {
    name: artist.name,
    normalizedName: artist.normalizedName,
    spotifyId: artist.spotifyId,
    spotifyUrl: artist.spotifyUrl,
    likedTrackCount: artist.likedTrackCount,
    sampleTracks: artist.sampleTracks,
    aliases: artist.aliases,
    externalIds: {
      ...artist.externalIds,
      ...(artist.spotifyId ? { spotifyId: artist.spotifyId } : {}),
    },
  };
}
