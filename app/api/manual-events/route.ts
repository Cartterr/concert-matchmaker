import { z } from "zod";
import { handleApiError, ok, requireApiUser } from "@/lib/api";
import { createManualEvent } from "@/lib/manual-events";
import { optionalHttpUrl } from "@/lib/validation";

const manualEventSchema = z
  .object({
    title: z.string().min(1),
    startAt: z.string().optional(),
    venueName: z.string().min(1),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    providerUrl: optionalHttpUrl(),
    ticketUrl: optionalHttpUrl(),
    performers: z.array(z.string().min(1)).default([]),
    tripId: z.string().optional(),
    catalogId: z.string().optional(),
    sourceNote: z.string().optional(),
  })
  .refine(
    (value) =>
      (value.latitude === undefined && value.longitude === undefined) ||
      (value.latitude !== undefined && value.longitude !== undefined),
    {
      message: "Latitude and longitude must be provided together.",
      path: ["longitude"],
    },
  );

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const body = manualEventSchema.parse(await request.json());
    const result = await createManualEvent({ ...body, createdById: user.userId });
    return ok(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
