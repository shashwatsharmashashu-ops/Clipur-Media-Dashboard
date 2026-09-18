import { cookies } from "next/headers";
import {
  changePassword,
  destroyUserSessions,
  createSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import { badRequest, json, readJson, withAdmin } from "@/lib/api";

/** Lets an admin rotate their own password. Other sessions are invalidated. */
export async function POST(request: Request) {
  return withAdmin(async (user) => {
    const body = await readJson<{ currentPassword?: string; newPassword?: string }>(request);
    const current = body.currentPassword ?? "";
    const next = body.newPassword ?? "";

    if (!current || !next) return badRequest("Both current and new password are required.");

    const result = changePassword(user.id, current, next);
    if (!result.ok) return badRequest(result.error);

    // Drop every session, then issue a fresh one so the caller stays signed in.
    destroyUserSessions(user.id);
    const { token, expiresAt } = createSession(user.id);
    const store = await cookies();
    store.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));

    return json({ ok: true });
  });
}
