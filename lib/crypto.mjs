import crypto from "node:crypto";

/**
 * Password primitives shared by the running app (lib/auth.ts) and the seed
 * script. scrypt with a per-user random salt; hashes are stored as
 * `scrypt$<salt-b64>$<hash-b64>`. Plaintext is never persisted.
 */

const SCRYPT_KEYLEN = 64;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString("base64")}$${derived.toString("base64")}`;
}

export function verifyPassword(password, stored) {
  const [scheme, saltB64, hashB64] = String(stored).split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;

  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  const derived = crypto.scryptSync(password, salt, expected.length);

  // Constant-time compare so a wrong password cannot be timed out byte by byte.
  return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
}

/**
 * Strong random password from an unambiguous alphabet (no 0/O/1/l/I) so the
 * credentials can be read aloud or retyped without confusion.
 */
export function generatePassword(length = 18) {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789-_";
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}
