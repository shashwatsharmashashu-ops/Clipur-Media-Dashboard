import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { applySchema } from "./schema.mjs";

/**
 * SQLite-backed persistent store.
 *
 * Uses Node's built-in `node:sqlite` rather than a native npm module, so a
 * fresh `npm install` needs no C++ toolchain, no Python and no prebuilt
 * binaries — the project installs and runs on any machine with a supported
 * Node. That portability is the reason for the choice; see README.
 *
 * The file lives at CLIPUR_DB_PATH, or ./data/clipur.db relative to the
 * project root. The connection is cached on globalThis because Next.js reloads
 * modules in dev and we must not open a new handle per reload.
 */

const DB_PATH = process.env.CLIPUR_DB_PATH ?? path.join(process.cwd(), "data", "clipur.db");

type DB = DatabaseSync;

const globalForDb = globalThis as unknown as { __clipurDb?: DB; __clipurTxDepth?: number };

function createConnection(): DB {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  applySchema(db);
  return db;
}

export function getDb(): DB {
  if (!globalForDb.__clipurDb) {
    globalForDb.__clipurDb = createConnection();
  }
  return globalForDb.__clipurDb;
}

/**
 * Runs `fn` inside a transaction, committing on success and rolling back on
 * throw. Nested calls join the outer transaction rather than starting a second
 * one, which SQLite does not allow.
 */
export function transaction<T>(fn: () => T): T {
  const db = getDb();
  const depth = globalForDb.__clipurTxDepth ?? 0;

  if (depth > 0) {
    globalForDb.__clipurTxDepth = depth + 1;
    try {
      return fn();
    } finally {
      globalForDb.__clipurTxDepth = depth;
    }
  }

  db.exec("BEGIN");
  globalForDb.__clipurTxDepth = 1;
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  } finally {
    globalForDb.__clipurTxDepth = 0;
  }
}

/** True once the seed script has created the admin accounts. */
export function isSeeded(): boolean {
  const row = getDb().prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  return row.n > 0;
}

export const DB_FILE_PATH = DB_PATH;
