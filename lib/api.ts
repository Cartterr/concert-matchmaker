import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAuthConfigured, isDevAuthBypassEnabled } from "@/lib/env";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export async function requireApiUser() {
  if (isDevAuthBypassEnabled()) {
    return { userId: null, name: "Local dev" };
  }

  if (!isAuthConfigured()) {
    throw new ApiError("Authentication is not configured.", 401);
  }

  const session = await auth();
  if (!session?.user?.id) {
    throw new ApiError("Authentication required.", 401);
  }

  return {
    userId: session.user.id,
    name: session.user.name ?? session.user.email ?? "GitHub user",
  };
}

export function ok<T>(payload: T, init?: ResponseInit) {
  return NextResponse.json(payload, init);
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : "Unexpected server error.",
    },
    { status: 500 },
  );
}
