import { z } from "zod";
import { handleApiError, ok, requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { ensureDefaultTrip, scanTripEvents } from "@/lib/scans";

const scanSchema = z.object({
  tripId: z.string().optional(),
  catalogId: z.string().optional(),
});

export async function GET() {
  try {
    await requireApiUser();
    const runs = await prisma.providerRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 50,
    });
    return ok({ runs });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    await ensureDefaultTrip();
    const body = scanSchema.parse(await request.json().catch(() => ({})));
    const result = await scanTripEvents({
      ...body,
      requestedById: user.userId,
    });
    return ok({
      tripId: result.trip.id,
      catalogId: result.catalog?.id ?? null,
      eventsFetched: result.eventsFetched,
      matchesCreated: result.matchesCreated,
      providerRuns: result.providerRuns,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
