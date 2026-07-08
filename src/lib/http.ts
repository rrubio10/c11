import { NextResponse } from "next/server";

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() ?? null;
}

export function requireSameOrigin(request: Request) {
  const origin = firstHeaderValue(request.headers.get("origin"));

  if (!origin) {
    return;
  }

  const requestUrl = new URL(request.url);

  const host =
    firstHeaderValue(request.headers.get("x-forwarded-host")) ??
    firstHeaderValue(request.headers.get("host")) ??
    requestUrl.host;

  const protocol =
    firstHeaderValue(request.headers.get("x-forwarded-proto")) ??
    requestUrl.protocol.replace(":", "");

  const expectedOrigin = `${protocol}://${host}`;

  if (origin !== expectedOrigin && origin !== requestUrl.origin) {
    throw new Error("FORBIDDEN");
  }
}

export function apiError(error: unknown) {
  console.error("API error:", error);

  const message =
    error instanceof Error ? error.message : "UNKNOWN_ERROR";

  const status =
    message === "UNAUTHENTICATED"
      ? 401
      : message === "FORBIDDEN"
        ? 403
        : message === "NOT_FOUND"
          ? 404
          : message === "ATTEMPT_SUBMITTED"
            ? 409
            : 400;

  return NextResponse.json({ error: message }, { status });
}
