import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import {
  isAuthConfigured,
  isDatabaseConfigured,
  isDevAuthBypassEnabled,
} from "@/lib/env";

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

  if (!isDatabaseConfigured()) {
    throw new ApiError("Database is not configured.", 503);
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

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid request payload.", details: error.flatten() },
      { status: 400 },
    );
  }

  console.error("Unhandled API error", error);
  return NextResponse.json(
    {
      error: "Internal server error.",
    },
    { status: 500 },
  );
}
