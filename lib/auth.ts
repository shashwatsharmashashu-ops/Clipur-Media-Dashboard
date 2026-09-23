import crypto from "node:crypto";
import { cookies } from "next/headers";
import { execute, queryOne } from "./db";
import { hashPassword, verifyPassword, generatePassword } from "./crypto.mjs";
import type { AdminUser } from "./types";

/**
 * Lightweight session auth for the seven admin accounts.
 *
 * Password primitives live in lib/crypto.mjs so the seed script shares them.
 * Sessions are opaque random tokens stored server-side in SQLite and carried
 * in an HttpOnly cookie. No plaintext password is ever stored or logged.
 */

export const SESSION_COOKIE = "clipur_session";
const SESSION_DAYS = 30;

export { hashPassword, verifyPassword, generatePassword };

/* --------------------------------------------------------------- sessions */

function expiryDate(): string {
  return new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();
}

export async function createSession(
  userId: string,
): Promise<{ token: string; expiresAt: string }> {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = expiryDate();
  await execute(
    "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
    [token, userId, new Date().toISOString(), expiresAt],
  );
  return { token, expiresAt };
}

export async function destroySession(token: string): Promise<void> {
  await execute("DELETE FROM sessions WHERE token = ?", [token]);
}

/** Drops every session for a user — used after a password change. */
export async function destroyUserSessions(userId: string): Promise<void> {
  await execute("DELETE FROM sessions WHERE user_id = ?", [userId]);
}

async function userForToken(token: string): Promise<AdminUser | null> {
  const row = await queryOne<{ id: string; username: string; expiresAt: string }>(
    `SELECT u.id AS id, u.username AS username, s.expires_at AS expiresAt
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token = ?`,
    [token],
  );

  if (!row) return null;

  if (new Date(row.expiresAt).getTime() < Date.now()) {
    await destroySession(token);
    return null;
  }

  return { id: row.id, username: row.username };
}

/** Reads the session cookie and resolves the signed-in admin, if any. */
export async function getCurrentUser(): Promise<AdminUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return await userForToken(token);
}

export async function requireUser(): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Not signed in");
    this.name = "UnauthorizedError";
  }
}

/* ------------------------------------------------------------------ login */

export async function authenticate(
  username: string,
  password: string,
): Promise<AdminUser | null> {
  const row = await queryOne<{ id: string; username: string; password_hash: string }>(
    "SELECT id, username, password_hash FROM users WHERE username = ?",
    [username.trim().toLowerCase()],
  );

  // Always run a hash comparison so a missing user and a wrong password take
  // roughly the same time.
  const stored = row?.password_hash ?? `scrypt$${Buffer.alloc(16).toString("base64")}$${Buffer.alloc(64).toString("base64")}`;
  const ok = verifyPassword(password, stored);

  if (!row || !ok) return null;
  return { id: row.id, username: row.username };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  nextPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await queryOne<{ password_hash: string }>(
    "SELECT password_hash FROM users WHERE id = ?",
    [userId],
  );

  if (!row) return { ok: false, error: "User not found." };
  if (!verifyPassword(currentPassword, row.password_hash)) {
    return { ok: false, error: "Current password is incorrect." };
  }
  if (nextPassword.length < 10) {
    return { ok: false, error: "New password must be at least 10 characters." };
  }

  await execute("UPDATE users SET password_hash = ? WHERE id = ?", [
    hashPassword(nextPassword),
    userId,
  ]);
  return { ok: true };
}

/** Cookie options shared by login and logout. */
export function sessionCookieOptions(expiresAt?: string) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(expiresAt ? { expires: new Date(expiresAt) } : { maxAge: 0 }),
  };
}
