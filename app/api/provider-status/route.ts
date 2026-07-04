import { handleApiError, ok, requireApiUser } from "@/lib/api";
import { getProviderStatusSummary } from "@/lib/scans";

export async function GET() {
  try {
    await requireApiUser();
    return ok({ providers: await getProviderStatusSummary() });
  } catch (error) {
    return handleApiError(error);
  }
}
