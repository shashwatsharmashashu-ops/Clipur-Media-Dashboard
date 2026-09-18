import { cookies } from "next/headers";
import { authenticate, createSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { badRequest, json, readJson } from "@/lib/api";

export async function POST(request: Request) {
  const body = await readJson<{ username?: string; password?: string }>(request);
  const username = (body.username ?? "").trim();
  const password = body.password ?? "";

  if (!username || !password) return badRequest("Username and password are required.");

  const user = authenticate(username, password);
  // Deliberately vague: never reveal whether the username exists.
  if (!user) return json({ error: "Incorrect username or password." }, 401);

  const { token, expiresAt } = createSession(user.id);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));

  return json({ user });
}
