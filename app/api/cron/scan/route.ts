import { handleApiError, ok, ApiError } from "@/lib/api";
import { validateScheduledSecret } from "@/lib/env";
import { ensureDefaultTrip, scanTripEvents } from "@/lib/scans";

export async function POST(request: Request) {
  try {
    if (!validateScheduledSecret(request.headers.get("x-scheduled-scan-secret"))) {
      throw new ApiError("Invalid scheduled scan secret.", 401);
    }

    const trip = await ensureDefaultTrip();
    const result = await scanTripEvents({ tripId: trip.id });
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
