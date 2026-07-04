import { prisma } from "@/lib/db";
import { parseArtistCatalog, type ImportedArtist } from "@/lib/import-artists";

export async function importArtistCatalog(input: {
  name: string;
  source?: string;
  filename?: string;
  content: string;
  createdById?: string | null;
}) {
  const artists = parseArtistCatalog(input.content, input.filename);
  const catalog = await prisma.artistCatalog.create({
    data: {
      name: input.name,
      source: input.source ?? input.filename ?? "manual",
      createdById: input.createdById ?? undefined,
      artists: {
        create: artists.map(toArtistCreateInput),
      },
    },
    include: {
      _count: {
        select: { artists: true },
      },
    },
  });

  return {
    catalog,
    artistCount: catalog._count.artists,
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
