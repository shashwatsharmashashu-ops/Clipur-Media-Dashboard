import crypto from "node:crypto";
import type { SQLInputValue } from "node:sqlite";
import { getDb, transaction } from "./db";
import { isProbablyUrl, normalizeUrl } from "./url";
import { isIsoDate, todayIso } from "./date";
import { snapshotDayTargets } from "./daily";
import type {
  Account,
  Clip,
  ClipOwnerType,
  DashboardState,
  Niche,
  Strategy,
  TrackedItem,
  WeeklyReport,
} from "./types";

/**
 * Data access for the dashboard. Every mutation writes straight to SQLite, so
 * an edit by one admin is immediately visible to the others.
 *
 * Posted counts and clips are kept consistent here: adding a clip increments
 * the owner's postsMade by exactly one, removing it decrements. Duplicate
 * links (same normalized url, same owner) are rejected and never double-count.
 */

function id(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

/* ------------------------------------------------------------------- read */

interface ClipRow {
  id: string;
  owner_type: string;
  owner_id: string;
  url: string;
  normalized_url: string;
  label: string | null;
  views: number | null;
  views_source: string | null;
  clip_date: string | null;
  created_at: string;
}

function toClip(row: ClipRow): Clip {
  return {
    id: row.id,
    url: row.url,
    normalizedUrl: row.normalized_url,
    label: row.label ?? undefined,
    views: row.views,
    viewsSource: (row.views_source as Clip["viewsSource"]) ?? undefined,
    // Rows written before dates existed fall back to the day they were created.
    clipDate: row.clip_date ?? row.created_at.slice(0, 10),
    createdAt: row.created_at,
  };
}

function clipsByOwner(): Map<string, Clip[]> {
  const rows = getDb()
    .prepare("SELECT * FROM clips ORDER BY clip_date ASC, created_at ASC")
    .all() as unknown as ClipRow[];

  const map = new Map<string, Clip[]>();
  for (const row of rows) {
    const key = `${row.owner_type}:${row.owner_id}`;
    const list = map.get(key);
    if (list) list.push(toClip(row));
    else map.set(key, [toClip(row)]);
  }
  return map;
}

export function getDashboardState(): DashboardState {
  const db = getDb();
  const clipMap = clipsByOwner();

  const nicheRows = db
    .prepare("SELECT * FROM niches ORDER BY sort ASC, name ASC")
    .all() as { id: string; platform: string; key: string; name: string }[];

  const accountRows = db
    .prepare("SELECT * FROM accounts ORDER BY sort ASC, handle ASC")
    .all() as {
    id: string;
    niche_id: string;
    handle: string;
    status: string;
    posts_target: number;
    posts_made: number;
  }[];

  const niches: Niche[] = nicheRows.map((n) => ({
    id: n.id,
    platform: n.platform as Niche["platform"],
    key: n.key,
    name: n.name,
    accounts: accountRows
      .filter((a) => a.niche_id === n.id)
      .map<Account>((a) => ({
        id: a.id,
        nicheId: a.niche_id,
        handle: a.handle,
        niche: n.key,
        status: a.status as Account["status"],
        postsTarget: a.posts_target,
        postsMade: a.posts_made,
        clips: clipMap.get(`account:${a.id}`) ?? [],
      })),
  }));

  const itemRows = db
    .prepare("SELECT * FROM items ORDER BY sort ASC, name ASC")
    .all() as {
    id: string;
    kind: string;
    platform: string | null;
    group_name: string | null;
    name: string;
    status: string;
    posts_target: number;
    posts_made: number;
  }[];

  const items: TrackedItem[] = itemRows.map((i) => ({
    id: i.id,
    kind: i.kind as TrackedItem["kind"],
    platform: (i.platform as TrackedItem["platform"]) ?? null,
    groupName: i.group_name,
    name: i.name,
    status: i.status as TrackedItem["status"],
    postsTarget: i.posts_target,
    postsMade: i.posts_made,
    clips: clipMap.get(`item:${i.id}`) ?? [],
  }));

  const strategies = (
    db.prepare("SELECT * FROM strategies ORDER BY sort ASC, title ASC").all() as {
      id: string;
      title: string;
      description: string;
      status: string;
      platform: string | null;
      selected: number;
      report_reach: string | null;
      report_top_clip: string | null;
      report_verdict: string | null;
    }[]
  ).map<Strategy>((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    status: s.status as Strategy["status"],
    platform: (s.platform as Strategy["platform"]) ?? null,
    selected: s.selected === 1,
    report: s.report_verdict
      ? {
          reach: s.report_reach ?? undefined,
          topClip: s.report_top_clip ?? undefined,
          verdict: s.report_verdict,
        }
      : undefined,
  }));

  const reports = db
    .prepare("SELECT id, week, summary, posted_date AS postedDate FROM reports ORDER BY posted_date DESC")
    .all() as unknown as WeeklyReport[];

  return { niches, items, strategies, reports };
}

/* ----------------------------------------------------------------- niches */

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "niche";
}

export function createNiche(input: { platform: string; name: string }): Niche["id"] {
  const db = getDb();
  const nicheId = id("niche");
  const sort =
    ((db.prepare("SELECT MAX(sort) AS m FROM niches").get() as { m: number | null }).m ?? 0) + 1;
  db.prepare(
    "INSERT INTO niches (id, platform, key, name, sort) VALUES (?, ?, ?, ?, ?)",
  ).run(nicheId, input.platform, slugify(input.name), input.name.trim(), sort);
  return nicheId;
}

export function updateNiche(nicheId: string, patch: { name?: string }): void {
  if (patch.name === undefined) return;
  getDb()
    .prepare("UPDATE niches SET name = ?, key = ? WHERE id = ?")
    .run(patch.name.trim(), slugify(patch.name), nicheId);
}

export function deleteNiche(nicheId: string): void {
  const db = getDb();
  transaction(() => {
    const accounts = db
      .prepare("SELECT id FROM accounts WHERE niche_id = ?")
      .all(nicheId) as { id: string }[];
    const del = db.prepare("DELETE FROM clips WHERE owner_type = 'account' AND owner_id = ?");
    for (const account of accounts) del.run(account.id);
    db.prepare("DELETE FROM niches WHERE id = ?").run(nicheId);
  });
}

/* --------------------------------------------------------------- accounts */

export function createAccount(input: {
  nicheId: string;
  handle: string;
  postsTarget?: number;
  status?: string;
}): string {
  const db = getDb();
  const accountId = id("acct");
  const sort =
    ((db.prepare("SELECT MAX(sort) AS m FROM accounts").get() as { m: number | null }).m ?? 0) + 1;
  db.prepare(
    `INSERT INTO accounts (id, niche_id, handle, status, posts_target, posts_made, sort)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
  ).run(
    accountId,
    input.nicheId,
    input.handle.trim(),
    input.status ?? "ongoing",
    Math.max(0, input.postsTarget ?? 0),
    sort,
  );
  return accountId;
}

export function updateAccount(
  accountId: string,
  patch: { handle?: string; postsTarget?: number; postsMade?: number; status?: string; nicheId?: string },
): void {
  const sets: string[] = [];
  const values: SQLInputValue[] = [];

  if (patch.handle !== undefined) {
    sets.push("handle = ?");
    values.push(patch.handle.trim());
  }
  if (patch.postsTarget !== undefined) {
    sets.push("posts_target = ?");
    values.push(Math.max(0, Math.round(patch.postsTarget)));
  }
  if (patch.postsMade !== undefined) {
    sets.push("posts_made = ?");
    values.push(Math.max(0, Math.round(patch.postsMade)));
  }
  if (patch.status !== undefined) {
    sets.push("status = ?");
    values.push(patch.status);
  }
  if (patch.nicheId !== undefined) {
    sets.push("niche_id = ?");
    values.push(patch.nicheId);
  }
  if (sets.length === 0) return;

  values.push(accountId);
  getDb().prepare(`UPDATE accounts SET ${sets.join(", ")} WHERE id = ?`).run(...values);
}

export function deleteAccount(accountId: string): void {
  const db = getDb();
  transaction(() => {
    db.prepare("DELETE FROM clips WHERE owner_type = 'account' AND owner_id = ?").run(accountId);
    db.prepare("DELETE FROM accounts WHERE id = ?").run(accountId);
  });
}

/* ------------------------------------------------------------------ items */

export function createItem(input: {
  kind: "campaign" | "platform";
  platform?: string | null;
  groupName?: string | null;
  name: string;
  postsTarget?: number;
  status?: string;
}): string {
  const db = getDb();
  const itemId = id("item");
  const sort =
    ((db.prepare("SELECT MAX(sort) AS m FROM items").get() as { m: number | null }).m ?? 0) + 1;
  db.prepare(
    `INSERT INTO items (id, kind, platform, group_name, name, status, posts_target, posts_made, sort)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
  ).run(
    itemId,
    input.kind,
    input.platform ?? null,
    input.groupName ?? null,
    input.name.trim(),
    input.status ?? "ongoing",
    Math.max(0, input.postsTarget ?? 0),
    sort,
  );
  return itemId;
}

export function updateItem(
  itemId: string,
  patch: {
    name?: string;
    groupName?: string | null;
    postsTarget?: number;
    postsMade?: number;
    status?: string;
  },
): void {
  const sets: string[] = [];
  const values: SQLInputValue[] = [];

  if (patch.name !== undefined) {
    sets.push("name = ?");
    values.push(patch.name.trim());
  }
  if (patch.groupName !== undefined) {
    sets.push("group_name = ?");
    values.push(patch.groupName);
  }
  if (patch.postsTarget !== undefined) {
    sets.push("posts_target = ?");
    values.push(Math.max(0, Math.round(patch.postsTarget)));
  }
  if (patch.postsMade !== undefined) {
    sets.push("posts_made = ?");
    values.push(Math.max(0, Math.round(patch.postsMade)));
  }
  if (patch.status !== undefined) {
    sets.push("status = ?");
    values.push(patch.status);
  }
  if (sets.length === 0) return;

  values.push(itemId);
  getDb().prepare(`UPDATE items SET ${sets.join(", ")} WHERE id = ?`).run(...values);
}

export function deleteItem(itemId: string): void {
  const db = getDb();
  transaction(() => {
    db.prepare("DELETE FROM clips WHERE owner_type = 'item' AND owner_id = ?").run(itemId);
    db.prepare("DELETE FROM items WHERE id = ?").run(itemId);
  });
}

/* ------------------------------------------------------------------ clips */

const OWNER_TABLE: Record<ClipOwnerType, string> = {
  account: "accounts",
  item: "items",
};

export function ownerExists(ownerType: ClipOwnerType, ownerId: string): boolean {
  const table = OWNER_TABLE[ownerType];
  if (!table) return false;
  const row = getDb().prepare(`SELECT 1 AS ok FROM ${table} WHERE id = ?`).get(ownerId);
  return Boolean(row);
}

export type AddClipResult =
  | { ok: true; clip: Clip }
  | { ok: false; reason: "duplicate"; clip: Clip }
  | { ok: false; reason: "no_owner" };

/**
 * Appends a clip and counts it as one post toward the owner's posted count.
 * A url that normalizes to one already logged for this owner is rejected —
 * it must never count twice.
 */
export function addClip(input: {
  ownerType: ClipOwnerType;
  ownerId: string;
  url: string;
  label?: string;
  views?: number | null;
  /** The day this clip counts toward. Defaults to today. */
  clipDate?: string;
}): AddClipResult {
  const db = getDb();
  if (!ownerExists(input.ownerType, input.ownerId)) return { ok: false, reason: "no_owner" };

  const normalized = normalizeUrl(input.url);

  const existing = db
    .prepare(
      "SELECT * FROM clips WHERE owner_type = ? AND owner_id = ? AND normalized_url = ?",
    )
    .get(input.ownerType, input.ownerId, normalized) as unknown as ClipRow | undefined;

  if (existing) return { ok: false, reason: "duplicate", clip: toClip(existing) };

  const clipId = id("clip");
  const createdAt = nowIso();
  const clipDate = isIsoDate(input.clipDate) ? input.clipDate : todayIso();
  const table = OWNER_TABLE[input.ownerType];

  transaction(() => {
    db.prepare(
      `INSERT INTO clips (id, owner_type, owner_id, url, normalized_url, label, views, views_source, clip_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      clipId,
      input.ownerType,
      input.ownerId,
      input.url.trim(),
      normalized,
      input.label?.trim() || null,
      input.views ?? null,
      input.views === null || input.views === undefined ? null : "manual",
      clipDate,
      createdAt,
    );
    db.prepare(`UPDATE ${table} SET posts_made = posts_made + 1 WHERE id = ?`).run(input.ownerId);
    // Freeze the target that applied on this day, so later changes to the
    // standing target cannot rewrite history.
    snapshotDayTargets(clipDate);
  });

  const row = db.prepare("SELECT * FROM clips WHERE id = ?").get(clipId) as unknown as ClipRow;
  return { ok: true, clip: toClip(row) };
}

export interface BulkAddSummary {
  /** Links that became clips and counted toward the posted count. */
  added: number;
  /** Skipped: already stored for this owner, or repeated inside the paste. */
  duplicates: number;
  /** Skipped: not a usable link. */
  invalid: number;
  /** A few of the unusable entries, so the admin can see what was wrong. */
  invalidSamples: string[];
  /** Total entries found in the paste. */
  total: number;
}

export type AddClipsResult =
  | ({ ok: true } & BulkAddSummary)
  | { ok: false; reason: "no_owner" };

/**
 * Logs many links in one action.
 *
 * Same rules as a single add, applied across the whole batch: each accepted
 * link becomes one clip stamped with the given date and adds exactly one to
 * the owner's posted count. De-duplication runs against what is already
 * stored AND within the paste itself, so a link repeated in the same blob is
 * counted once. The whole batch is one transaction — either all the accepted
 * links land with their matching count bump, or none do.
 */
export function addClips(input: {
  ownerType: ClipOwnerType;
  ownerId: string;
  urls: string[];
  clipDate?: string;
}): AddClipsResult {
  const db = getDb();
  if (!ownerExists(input.ownerType, input.ownerId)) return { ok: false, reason: "no_owner" };

  const clipDate = isIsoDate(input.clipDate) ? input.clipDate : todayIso();
  const table = OWNER_TABLE[input.ownerType];

  const stored = new Set(
    (
      db
        .prepare("SELECT normalized_url FROM clips WHERE owner_type = ? AND owner_id = ?")
        .all(input.ownerType, input.ownerId) as { normalized_url: string }[]
    ).map((row) => row.normalized_url),
  );

  const seen = new Set<string>();
  const accepted: { url: string; normalized: string }[] = [];
  const invalidSamples: string[] = [];
  let duplicates = 0;
  let invalid = 0;

  for (const raw of input.urls) {
    const url = raw.trim();
    if (!url) continue;

    if (!isProbablyUrl(url)) {
      invalid += 1;
      if (invalidSamples.length < 3) invalidSamples.push(url);
      continue;
    }

    const normalized = normalizeUrl(url);
    if (stored.has(normalized) || seen.has(normalized)) {
      duplicates += 1;
      continue;
    }

    seen.add(normalized);
    accepted.push({ url, normalized });
  }

  if (accepted.length > 0) {
    const insert = db.prepare(
      `INSERT INTO clips (id, owner_type, owner_id, url, normalized_url, label, views, views_source, clip_date, created_at)
       VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?)`,
    );

    transaction(() => {
      const createdAt = nowIso();
      for (const entry of accepted) {
        insert.run(
          id("clip"),
          input.ownerType,
          input.ownerId,
          entry.url,
          entry.normalized,
          clipDate,
          createdAt,
        );
      }
      db.prepare(`UPDATE ${table} SET posts_made = posts_made + ? WHERE id = ?`).run(
        accepted.length,
        input.ownerId,
      );
      snapshotDayTargets(clipDate);
    });
  }

  return {
    ok: true,
    added: accepted.length,
    duplicates,
    invalid,
    invalidSamples,
    total: accepted.length + duplicates + invalid,
  };
}

/** Removes a clip and gives back the post it counted for (never below zero). */
export function deleteClip(clipId: string): boolean {
  const db = getDb();
  const row = db.prepare("SELECT owner_type, owner_id FROM clips WHERE id = ?").get(clipId) as
    | { owner_type: ClipOwnerType; owner_id: string }
    | undefined;
  if (!row) return false;

  const table = OWNER_TABLE[row.owner_type];
  transaction(() => {
    db.prepare("DELETE FROM clips WHERE id = ?").run(clipId);
    db.prepare(
      `UPDATE ${table} SET posts_made = MAX(0, posts_made - 1) WHERE id = ?`,
    ).run(row.owner_id);
  });
  return true;
}

/**
 * Edits a clip. Changing `clipDate` moves the clip between days, which is how
 * an admin backfills a day they logged late.
 */
export function updateClip(
  clipId: string,
  patch: { label?: string | null; views?: number | null; clipDate?: string },
): void {
  const sets: string[] = [];
  const values: SQLInputValue[] = [];

  if (patch.label !== undefined) {
    sets.push("label = ?");
    values.push(patch.label?.trim() || null);
  }
  if (patch.views !== undefined) {
    sets.push("views = ?", "views_source = ?");
    values.push(patch.views, patch.views === null ? null : "manual");
  }
  if (patch.clipDate !== undefined && isIsoDate(patch.clipDate)) {
    sets.push("clip_date = ?");
    values.push(patch.clipDate);
  }
  if (sets.length === 0) return;

  values.push(clipId);
  getDb().prepare(`UPDATE clips SET ${sets.join(", ")} WHERE id = ?`).run(...values);

  // The day it moved onto now has activity and needs its own target snapshot.
  if (patch.clipDate !== undefined && isIsoDate(patch.clipDate)) {
    snapshotDayTargets(patch.clipDate);
  }
}

/* ------------------------------------------------------------- strategies */

export function createStrategy(input: {
  title: string;
  description?: string;
  status?: string;
  platform?: string | null;
}): string {
  const db = getDb();
  const strategyId = id("strat");
  const sort =
    ((db.prepare("SELECT MAX(sort) AS m FROM strategies").get() as { m: number | null }).m ?? 0) + 1;
  db.prepare(
    `INSERT INTO strategies (id, title, description, status, platform, selected, sort)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
  ).run(
    strategyId,
    input.title.trim(),
    input.description?.trim() ?? "",
    input.status ?? "ongoing",
    input.platform ?? null,
    sort,
  );
  return strategyId;
}

export function updateStrategy(
  strategyId: string,
  patch: {
    title?: string;
    description?: string;
    status?: string;
    selected?: boolean;
    platform?: string | null;
    report?: { reach?: string; topClip?: string; verdict?: string } | null;
  },
): void {
  const sets: string[] = [];
  const values: SQLInputValue[] = [];

  if (patch.title !== undefined) {
    sets.push("title = ?");
    values.push(patch.title.trim());
  }
  if (patch.description !== undefined) {
    sets.push("description = ?");
    values.push(patch.description.trim());
  }
  if (patch.status !== undefined) {
    sets.push("status = ?");
    values.push(patch.status);
  }
  if (patch.selected !== undefined) {
    sets.push("selected = ?");
    values.push(patch.selected ? 1 : 0);
  }
  if (patch.platform !== undefined) {
    sets.push("platform = ?");
    values.push(patch.platform);
  }
  if (patch.report !== undefined) {
    sets.push("report_reach = ?", "report_top_clip = ?", "report_verdict = ?");
    values.push(
      patch.report?.reach ?? null,
      patch.report?.topClip ?? null,
      patch.report?.verdict ?? null,
    );
  }
  if (sets.length === 0) return;

  values.push(strategyId);
  getDb().prepare(`UPDATE strategies SET ${sets.join(", ")} WHERE id = ?`).run(...values);
}

export function deleteStrategy(strategyId: string): void {
  getDb().prepare("DELETE FROM strategies WHERE id = ?").run(strategyId);
}

/* ---------------------------------------------------------------- reports */

export function createReport(input: {
  week: string;
  summary?: string;
  postedDate?: string;
}): string {
  const reportId = id("rep");
  getDb()
    .prepare("INSERT INTO reports (id, week, summary, posted_date) VALUES (?, ?, ?, ?)")
    .run(
      reportId,
      input.week.trim(),
      input.summary?.trim() ?? "",
      input.postedDate ?? new Date().toISOString().slice(0, 10),
    );
  return reportId;
}

export function updateReport(
  reportId: string,
  patch: { week?: string; summary?: string; postedDate?: string },
): void {
  const sets: string[] = [];
  const values: SQLInputValue[] = [];

  if (patch.week !== undefined) {
    sets.push("week = ?");
    values.push(patch.week.trim());
  }
  if (patch.summary !== undefined) {
    sets.push("summary = ?");
    values.push(patch.summary.trim());
  }
  if (patch.postedDate !== undefined) {
    sets.push("posted_date = ?");
    values.push(patch.postedDate);
  }
  if (sets.length === 0) return;

  values.push(reportId);
  getDb().prepare(`UPDATE reports SET ${sets.join(", ")} WHERE id = ?`).run(...values);
}

export function deleteReport(reportId: string): void {
  getDb().prepare("DELETE FROM reports WHERE id = ?").run(reportId);
}
