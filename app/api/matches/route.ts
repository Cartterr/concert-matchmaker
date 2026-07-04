import { MatchStatus } from "@prisma/client";
import { z } from "zod";
import { handleApiError, ok, requireApiUser } from "@/lib/api";
import { listRankedMatches, reviewMatch } from "@/lib/scans";

const patchSchema = z.object({
  matchId: z.string().min(1),
  status: z.nativeEnum(MatchStatus),
});

export async function GET(request: Request) {
  try {
    await requireApiUser();
    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status");
    const status =
      statusParam && statusParam in MatchStatus
        ? MatchStatus[statusParam as keyof typeof MatchStatus]
        : undefined;

    const matches = await listRankedMatches({
      catalogId: url.searchParams.get("catalogId") ?? undefined,
      status,
      limit: Number(url.searchParams.get("limit") ?? 100),
    });
    return ok({ matches });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireApiUser();
    const body = patchSchema.parse(await request.json());
    const match = await reviewMatch(body);
    return ok({ match });
  } catch (error) {
    return handleApiError(error);
  }
}
