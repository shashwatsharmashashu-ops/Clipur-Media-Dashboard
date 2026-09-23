import { cookies } from "next/headers";
import { destroySession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { json } from "@/lib/api";

export async function POST() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await destroySession(token);
  store.set(SESSION_COOKIE, "", sessionCookieOptions());
  return json({ ok: true });
}
