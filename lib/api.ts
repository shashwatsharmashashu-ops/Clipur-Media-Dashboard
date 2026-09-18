import { NextResponse } from "next/server";
import { getCurrentUser } from "./auth";
import { getDashboardState } from "./repo";
import type { AdminUser } from "./types";

/**
 * Shared plumbing for the route handlers.
 *
 * Every mutation route runs through `withAdmin`, so an unauthenticated request
 * can never reach the store. All seven admins have identical rights — there is
 * no read-only role.
 */

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

export function badRequest(message: string) {
  return json({ error: message }, 400);
}

export function unauthorized() {
  return json({ error: "Not signed in" }, 401);
}

export function notFound(message = "Not found") {
  return json({ error: message }, 404);
}

/**
 * Guards a handler and hands it the signed-in admin. Mutations return the
 * refreshed dashboard state so the client never has to guess what changed.
 */
export async function withAdmin(
  handler: (user: AdminUser) => Promise<NextResponse> | NextResponse,
): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    return await handler(user);
  } catch (error) {
    console.error("[api]", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return json({ error: message }, 500);
  }
}

/** Standard success payload for a mutation: the whole fresh state. */
export function stateResponse(extra: Record<string, unknown> = {}) {
  return json({ ...extra, state: getDashboardState() });
}

/** Reads and parses a JSON body, tolerating an empty one. */
export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}

/** Coerces an optional numeric field, returning undefined when absent. */
export function optionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

const TRACKED_STATUSES = new Set(["ongoing", "upcoming", "completed"]);
const STRATEGY_STATUSES = new Set(["ongoing", "in_discussion", "concluded"]);

export function validTrackedStatus(value: unknown): string | undefined {
  return typeof value === "string" && TRACKED_STATUSES.has(value) ? value : undefined;
}

export function validStrategyStatus(value: unknown): string | undefined {
  return typeof value === "string" && STRATEGY_STATUSES.has(value) ? value : undefined;
}

const PLATFORMS = new Set(["x", "instagram", "tiktok"]);

export function validPlatform(value: unknown): string | undefined {
  return typeof value === "string" && PLATFORMS.has(value) ? value : undefined;
}
