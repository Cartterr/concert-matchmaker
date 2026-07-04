import { z } from "zod";
import { handleApiError, ok, requireApiUser } from "@/lib/api";
import { createManualEvent } from "@/lib/manual-events";

const manualEventSchema = z.object({
  title: z.string().min(1),
  startAt: z.string().optional(),
  venueName: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  providerUrl: z.string().url().optional(),
  ticketUrl: z.string().url().optional(),
  performers: z.array(z.string().min(1)).default([]),
  tripId: z.string().optional(),
  catalogId: z.string().optional(),
  sourceNote: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    await requireApiUser();
    const body = manualEventSchema.parse(await request.json());
    const result = await createManualEvent(body);
    return ok(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
