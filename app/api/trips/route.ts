import { z } from "zod";
import { handleApiError, ok, requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { ensureDefaultTrip } from "@/lib/scans";

const tripSchema = z.object({
  name: z.string().min(1),
  locationName: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  radiusMiles: z.number().positive().max(100).default(12),
  startsOn: z.coerce.date(),
  endsOn: z.coerce.date(),
  timezone: z.string().min(1).default("America/Los_Angeles"),
});

export async function GET() {
  try {
    await requireApiUser();
    await ensureDefaultTrip();
    const trips = await prisma.tripProfile.findMany({
      orderBy: { startsOn: "asc" },
    });
    return ok({ trips });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireApiUser();
    const body = tripSchema.parse(await request.json());
    const trip = await prisma.tripProfile.create({ data: body });
    return ok({ trip }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
