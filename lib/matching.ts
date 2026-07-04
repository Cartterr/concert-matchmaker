import { MatchStatus } from "@prisma/client";
import {
  diceTokenScore,
  normalizeArtistName,
  splitCollaborationCandidates,
  tokenSet,
} from "@/lib/normalize";

export type MatchableArtist = {
  id?: string;
  name: string;
  normalizedName?: string;
  spotifyId?: string | null;
  aliases?: unknown;
  externalIds?: unknown;
};

export type MatchablePerformer = {
  name: string;
  normalizedName?: string;
  externalIds?: unknown;
};

export type MatchScore = {
  confidence: number;
  status: MatchStatus;
  reasons: string[];
};

export function scorePerformerArtist(
  performer: MatchablePerformer,
  artist: MatchableArtist,
): MatchScore | null {
  const performerExternalIds = asStringRecord(performer.externalIds);
  const artistExternalIds = asStringRecord(artist.externalIds);

  if (
    artist.spotifyId &&
    performerExternalIds.spotifyId &&
    performerExternalIds.spotifyId === artist.spotifyId
  ) {
    return {
      confidence: 100,
      status: MatchStatus.PENDING,
      reasons: ["shared_spotify_id"],
    };
  }

  const sharedExternalId = Object.entries(artistExternalIds).find(
    ([key, value]) => performerExternalIds[key] && performerExternalIds[key] === value,
  );
  if (sharedExternalId) {
    return {
      confidence: 98,
      status: MatchStatus.PENDING,
      reasons: [`shared_external_id:${sharedExternalId[0]}`],
    };
  }

  const performerNames = splitCollaborationCandidates(performer.name).map((name) =>
    normalizeArtistName(name),
  );
  const performerName =
    performer.normalizedName ?? performerNames.find(Boolean) ?? normalizeArtistName(performer.name);
  const artistName = artist.normalizedName ?? normalizeArtistName(artist.name);

  if (performerNames.includes(artistName) || (performerName && performerName === artistName)) {
    return {
      confidence: 94,
      status: MatchStatus.PENDING,
      reasons: ["exact_normalized_name"],
    };
  }

  const aliasMatch = getAliases(artist.aliases).some(
    (alias) => performerNames.includes(normalizeArtistName(alias)),
  );
  if (aliasMatch) {
    return {
      confidence: 90,
      status: MatchStatus.PENDING,
      reasons: ["exact_alias_name"],
    };
  }

  const fuzzy = diceTokenScore(performerName, artistName);
  const subsetDescriptorMatch =
    performerName.length >= 8 &&
    artistName.length >= 8 &&
    allTokensIncluded(tokenSet(artistName), tokenSet(performerName));

  if (
    (fuzzy >= 0.92 || subsetDescriptorMatch) &&
    performerName.length >= 8 &&
    artistName.length >= 8
  ) {
    return {
      confidence: 82,
      status: MatchStatus.AMBIGUOUS,
      reasons: [
        subsetDescriptorMatch
          ? "guarded_subset_descriptor"
          : `guarded_fuzzy_name:${fuzzy.toFixed(2)}`,
      ],
    };
  }

  return null;
}

export function pickBestScores(
  performers: MatchablePerformer[],
  artists: MatchableArtist[],
) {
  const matches: Array<MatchScore & { artist: MatchableArtist; performer: MatchablePerformer }> = [];

  for (const performer of performers) {
    for (const artist of artists) {
      const score = scorePerformerArtist(performer, artist);
      if (score) matches.push({ ...score, artist, performer });
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}

function asStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, recordValue]) => typeof recordValue === "string" && recordValue)
      .map(([key, recordValue]) => [key, recordValue as string]),
  );
}

function getAliases(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function allTokensIncluded(left: Set<string>, right: Set<string>) {
  if (left.size === 0 || right.size === 0) return false;
  for (const token of left) {
    if (!right.has(token)) return false;
  }
  return true;
}
