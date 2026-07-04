import { auth } from "@/auth";
import { isAuthConfigured, isDatabaseConfigured, isDevAuthBypassEnabled } from "@/lib/env";

export async function getPageAccess() {
  if (isDevAuthBypassEnabled()) {
    return {
      canRead: true,
      authConfigured: isAuthConfigured(),
      databaseConfigured: isDatabaseConfigured(),
      userName: "Local dev",
    };
  }

  const authConfigured = isAuthConfigured();
  const databaseConfigured = isDatabaseConfigured();
  if (!authConfigured || !databaseConfigured) {
    return {
      canRead: false,
      authConfigured,
      databaseConfigured,
      userName: null,
    };
  }

  const session = await auth().catch(() => null);
  return {
    canRead: Boolean(session?.user?.id),
    authConfigured,
    databaseConfigured,
    userName: session?.user?.name ?? session?.user?.email ?? null,
  };
}
