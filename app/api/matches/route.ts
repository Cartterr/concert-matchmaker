import { MatchStatus } from "@prisma/client";
import { z } from "zod";
import { handleApiError, ok, requireApiUser } from "@/lib/api";
import { listRankedMatches, reviewMatch } from "@/lib/scans";

const patchSchema = z.object({
  matchId: z.string().min(1),
  status: z.nativeEnum(MatchStatus),
});

const querySchema = z.object({
  catalogId: z.string().optional(),
  tripId: z.string().optional(),
  provider: z.string().optional(),
  q: z.string().optional(),
  minConfidence: z.coerce.number().int().min(0).max(100).optional(),
  limit: z.coerce.number().int().positive().max(250).default(100),
  status: z.nativeEnum(MatchStatus).optional(),
});

export async function GET(request: Request) {
  try {
    await requireApiUser();
    const url = new URL(request.url);
    const params = querySchema.parse({
      catalogId: url.searchParams.get("catalogId") ?? undefined,
      tripId: url.searchParams.get("tripId") ?? undefined,
      provider: url.searchParams.get("provider") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
      minConfidence: url.searchParams.get("minConfidence") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
    });

    const matches = await listRankedMatches(params);
    return ok({ matches });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireApiUser();
    const body = patchSchema.parse(await request.json());
    const match = await reviewMatch({ ...body, reviewedBy: user.userId ?? user.name });
    return ok({ match });
  } catch (error) {
    return handleApiError(error);
  }
}
