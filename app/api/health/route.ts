import { ok } from "@/lib/api";
import { isAuthConfigured, isDatabaseConfigured } from "@/lib/env";

export async function GET() {
  return ok({
    status: "ok",
    databaseConfigured: isDatabaseConfigured(),
    authConfigured: isAuthConfigured(),
  });
}
