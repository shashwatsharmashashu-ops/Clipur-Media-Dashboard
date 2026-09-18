import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";
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

export function createSession(userId: string): { token: string; expiresAt: string } {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = expiryDate();
  getDb()
    .prepare(
      "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
    )
    .run(token, userId, new Date().toISOString(), expiresAt);
  return { token, expiresAt };
}

export function destroySession(token: string): void {
  getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

/** Drops every session for a user — used after a password change. */
export function destroyUserSessions(userId: string): void {
  getDb().prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

function userForToken(token: string): AdminUser | null {
  const row = getDb()
    .prepare(
      `SELECT u.id AS id, u.username AS username, s.expires_at AS expiresAt
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token = ?`,
    )
    .get(token) as { id: string; username: string; expiresAt: string } | undefined;

  if (!row) return null;

  if (new Date(row.expiresAt).getTime() < Date.now()) {
    destroySession(token);
    return null;
  }

  return { id: row.id, username: row.username };
}

/** Reads the session cookie and resolves the signed-in admin, if any. */
export async function getCurrentUser(): Promise<AdminUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return userForToken(token);
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

export function authenticate(username: string, password: string): AdminUser | null {
  const row = getDb()
    .prepare("SELECT id, username, password_hash FROM users WHERE username = ?")
    .get(username.trim().toLowerCase()) as
    | { id: string; username: string; password_hash: string }
    | undefined;

  // Always run a hash comparison so a missing user and a wrong password take
  // roughly the same time.
  const stored = row?.password_hash ?? `scrypt$${Buffer.alloc(16).toString("base64")}$${Buffer.alloc(64).toString("base64")}`;
  const ok = verifyPassword(password, stored);

  if (!row || !ok) return null;
  return { id: row.id, username: row.username };
}

export function changePassword(
  userId: string,
  currentPassword: string,
  nextPassword: string,
): { ok: true } | { ok: false; error: string } {
  const db = getDb();
  const row = db
    .prepare("SELECT password_hash FROM users WHERE id = ?")
    .get(userId) as { password_hash: string } | undefined;

  if (!row) return { ok: false, error: "User not found." };
  if (!verifyPassword(currentPassword, row.password_hash)) {
    return { ok: false, error: "Current password is incorrect." };
  }
  if (nextPassword.length < 10) {
    return { ok: false, error: "New password must be at least 10 characters." };
  }

  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
    hashPassword(nextPassword),
    userId,
  );
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
