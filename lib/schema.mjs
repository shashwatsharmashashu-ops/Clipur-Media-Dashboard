/**
 * Single source of truth for the SQLite schema.
 *
 * Imported by lib/db.ts (the running app) and scripts/seed.mjs (seeding) so
 * the two can never drift apart. Every statement is idempotent, and
 * `applySchema` also runs the additive migrations needed by an existing
 * database created before daily targets existed.
 */

/** Daily target used when a scope has never been configured. */
export const DEFAULT_DAILY_TARGET = 40;

export const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

  CREATE TABLE IF NOT EXISTS niches (
    id       TEXT PRIMARY KEY,
    platform TEXT NOT NULL,
    key      TEXT NOT NULL,
    name     TEXT NOT NULL,
    sort     INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id           TEXT PRIMARY KEY,
    niche_id     TEXT NOT NULL REFERENCES niches(id) ON DELETE CASCADE,
    handle       TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'ongoing',
    posts_target INTEGER NOT NULL DEFAULT 0,
    posts_made   INTEGER NOT NULL DEFAULT 0,
    sort         INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_accounts_niche ON accounts(niche_id);

  CREATE TABLE IF NOT EXISTS items (
    id           TEXT PRIMARY KEY,
    kind         TEXT NOT NULL,
    platform     TEXT,
    group_name   TEXT,
    name         TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'ongoing',
    posts_target INTEGER NOT NULL DEFAULT 0,
    posts_made   INTEGER NOT NULL DEFAULT 0,
    sort         INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS clips (
    id             TEXT PRIMARY KEY,
    owner_type     TEXT NOT NULL,
    owner_id       TEXT NOT NULL,
    url            TEXT NOT NULL,
    normalized_url TEXT NOT NULL,
    label          TEXT,
    views          INTEGER,
    views_source   TEXT,
    created_at     TEXT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_clips_unique
    ON clips(owner_type, owner_id, normalized_url);
  CREATE INDEX IF NOT EXISTS idx_clips_owner ON clips(owner_type, owner_id);

  /*
   * Standing daily target per scope.
   *   scope_type 'niche'    -> scope_id is a niches.id      (X)
   *   scope_type 'platform' -> scope_id is 'instagram' | 'tiktok'
   * Editable by any admin; defaults to DEFAULT_DAILY_TARGET.
   */
  CREATE TABLE IF NOT EXISTS daily_targets (
    scope_type TEXT NOT NULL,
    scope_id   TEXT NOT NULL,
    target     INTEGER NOT NULL,
    PRIMARY KEY (scope_type, scope_id)
  );

  /*
   * Per-date snapshot of the target that applied on that day. Written once,
   * the first time a day sees activity, and never overwritten by a later
   * change to the standing target — so history stays truthful. An admin can
   * still deliberately correct a specific day's target.
   */
  CREATE TABLE IF NOT EXISTS day_targets (
    scope_type TEXT NOT NULL,
    scope_id   TEXT NOT NULL,
    date       TEXT NOT NULL,
    target     INTEGER NOT NULL,
    PRIMARY KEY (scope_type, scope_id, date)
  );
  CREATE INDEX IF NOT EXISTS idx_day_targets_date ON day_targets(date);

  CREATE TABLE IF NOT EXISTS strategies (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    status          TEXT NOT NULL DEFAULT 'ongoing',
    platform        TEXT,
    selected        INTEGER NOT NULL DEFAULT 0,
    report_reach    TEXT,
    report_top_clip TEXT,
    report_verdict  TEXT,
    sort            INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS reports (
    id          TEXT PRIMARY KEY,
    week        TEXT NOT NULL,
    summary     TEXT NOT NULL DEFAULT '',
    posted_date TEXT NOT NULL
  );
`;

/**
 * Creates the schema and applies additive migrations. Safe to run on boot and
 * on every seed; nothing here destroys data.
 */
export function applySchema(db) {
  db.exec(SCHEMA_SQL);

  // Clips gained a calendar date. Existing rows inherit the day they were
  // created on, so no clip falls out of history.
  const clipColumns = db
    .prepare("PRAGMA table_info(clips)")
    .all()
    .map((column) => column.name);

  if (!clipColumns.includes("clip_date")) {
    db.exec("ALTER TABLE clips ADD COLUMN clip_date TEXT");
    db.exec("UPDATE clips SET clip_date = substr(created_at, 1, 10) WHERE clip_date IS NULL");
  }

  db.exec("CREATE INDEX IF NOT EXISTS idx_clips_date ON clips(clip_date)");
}

/** Default on-disk location, overridable for tests or another deployment. */
export function resolveDbPath(cwd) {
  return process.env.CLIPUR_DB_PATH ?? `${cwd}/data/clipur.db`;
}
