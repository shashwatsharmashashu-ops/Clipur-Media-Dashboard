import crypto from "node:crypto";
import type { InValue, Transaction } from "@libsql/client";
import { execute, query, queryOne, run, select, withTx } from "./db";
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
 * Data access for the dashboard. Every mutation writes straight to the
 * database, so an edit by one admin is immediately visible to the others.
 *
 * Posted counts and clips are kept consistent here: adding a clip increments
 * the owner's postsMade by exactly one, removing it decrements. Duplicate
 * links (same normalized url, same owner) are rejected and never double-count.
 *
 * Everything is async because the store may be a remote libSQL database; see
 * lib/db.ts.
 */

function id(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

/** libSQL can return integers as bigint depending on the driver path. */
function num(value: unknown): number {
  return Number(value ?? 0);
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
    views: row.views === null ? null : num(row.views),
    viewsSource: (row.views_source as Clip["viewsSource"]) ?? undefined,
    // Rows written before dates existed fall back to the day they were created.
    clipDate: row.clip_date ?? row.created_at.slice(0, 10),
    createdAt: row.created_at,
  };
}

async function clipsByOwner(): Promise<Map<string, Clip[]>> {
  const rows = await query<ClipRow>(
    "SELECT * FROM clips ORDER BY clip_date ASC, created_at ASC",
  );

  const map = new Map<string, Clip[]>();
  for (const row of rows) {
    const key = `${row.owner_type}:${row.owner_id}`;
    const list = map.get(key);
    if (list) list.push(toClip(row));
    else map.set(key, [toClip(row)]);
  }
  return map;
}

export async function getDashboardState(): Promise<DashboardState> {
  const [clipMap, nicheRows, accountRows, itemRows, strategyRows, reportRows] = await Promise.all([
    clipsByOwner(),
    query<{ id: string; platform: string; key: string; name: string }>(
      "SELECT * FROM niches ORDER BY sort ASC, name ASC",
    ),
    query<{
      id: string;
      niche_id: string;
      handle: string;
      status: string;
      posts_target: number;
      posts_made: number;
    }>("SELECT * FROM accounts ORDER BY sort ASC, handle ASC"),
    query<{
      id: string;
      kind: string;
      platform: string | null;
      group_name: string | null;
      name: string;
      status: string;
      posts_target: number;
      posts_made: number;
    }>("SELECT * FROM items ORDER BY sort ASC, name ASC"),
    query<{
      id: string;
      title: string;
      description: string;
      status: string;
      platform: string | null;
      selected: number;
      report_reach: string | null;
      report_top_clip: string | null;
      report_verdict: string | null;
    }>("SELECT * FROM strategies ORDER BY sort ASC, title ASC"),
    query<WeeklyReport>(
      "SELECT id, week, summary, posted_date AS postedDate FROM reports ORDER BY posted_date DESC",
    ),
  ]);

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
        postsTarget: num(a.posts_target),
        postsMade: num(a.posts_made),
        clips: clipMap.get(`account:${a.id}`) ?? [],
      })),
  }));

  const items: TrackedItem[] = itemRows.map((i) => ({
    id: i.id,
    kind: i.kind as TrackedItem["kind"],
    platform: (i.platform as TrackedItem["platform"]) ?? null,
    groupName: i.group_name,
    name: i.name,
    status: i.status as TrackedItem["status"],
    postsTarget: num(i.posts_target),
    postsMade: num(i.posts_made),
    clips: clipMap.get(`item:${i.id}`) ?? [],
  }));

  const strategies = strategyRows.map<Strategy>((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    status: s.status as Strategy["status"],
    platform: (s.platform as Strategy["platform"]) ?? null,
    selected: num(s.selected) === 1,
    report: s.report_verdict
      ? {
          reach: s.report_reach ?? undefined,
          topClip: s.report_top_clip ?? undefined,
          verdict: s.report_verdict,
        }
      : undefined,
  }));

  // Rebuilt as plain object literals so React Server Components can serialise
  // them into a Client Component.
  const reports = reportRows.map<WeeklyReport>((row) => ({
    id: row.id,
    week: row.week,
    summary: row.summary,
    postedDate: row.postedDate,
  }));

  return { niches, items, strategies, reports };
}

/* ----------------------------------------------------------------- niches */

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "niche";
}

async function nextSort(table: string): Promise<number> {
  const row = await queryOne<{ m: number | null }>(`SELECT MAX(sort) AS m FROM ${table}`);
  return num(row?.m) + 1;
}

export async function createNiche(input: { platform: string; name: string }): Promise<string> {
  const nicheId = id("niche");
  await execute("INSERT INTO niches (id, platform, key, name, sort) VALUES (?, ?, ?, ?, ?)", [
    nicheId,
    input.platform,
    slugify(input.name),
    input.name.trim(),
    await nextSort("niches"),
  ]);
  return nicheId;
}

export async function updateNiche(nicheId: string, patch: { name?: string }): Promise<void> {
  if (patch.name === undefined) return;
  await execute("UPDATE niches SET name = ?, key = ? WHERE id = ?", [
    patch.name.trim(),
    slugify(patch.name),
    nicheId,
  ]);
}

export async function deleteNiche(nicheId: string): Promise<void> {
  await withTx(async (tx) => {
    const accounts = await select<{ id: string }>(
      tx,
      "SELECT id FROM accounts WHERE niche_id = ?",
      [nicheId],
    );
    for (const account of accounts) {
      await run(tx, "DELETE FROM clips WHERE owner_type = 'account' AND owner_id = ?", [
        account.id,
      ]);
    }
    await run(tx, "DELETE FROM niches WHERE id = ?", [nicheId]);
  });
}

/* --------------------------------------------------------------- accounts */

export async function createAccount(input: {
  nicheId: string;
  handle: string;
  postsTarget?: number;
  status?: string;
}): Promise<string> {
  const accountId = id("acct");
  await execute(
    `INSERT INTO accounts (id, niche_id, handle, status, posts_target, posts_made, sort)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
    [
      accountId,
      input.nicheId,
      input.handle.trim(),
      input.status ?? "ongoing",
      Math.max(0, input.postsTarget ?? 0),
      await nextSort("accounts"),
    ],
  );
  return accountId;
}

export async function updateAccount(
  accountId: string,
  patch: {
    handle?: string;
    postsTarget?: number;
    postsMade?: number;
    status?: string;
    nicheId?: string;
  },
): Promise<void> {
  const sets: string[] = [];
  const values: InValue[] = [];

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
  await execute(`UPDATE accounts SET ${sets.join(", ")} WHERE id = ?`, values);
}

export async function deleteAccount(accountId: string): Promise<void> {
  await withTx(async (tx) => {
    await run(tx, "DELETE FROM clips WHERE owner_type = 'account' AND owner_id = ?", [accountId]);
    await run(tx, "DELETE FROM accounts WHERE id = ?", [accountId]);
  });
}

/* ------------------------------------------------------------------ items */

export async function createItem(input: {
  kind: "campaign" | "platform";
  platform?: string | null;
  groupName?: string | null;
  name: string;
  postsTarget?: number;
  status?: string;
}): Promise<string> {
  const itemId = id("item");
  await execute(
    `INSERT INTO items (id, kind, platform, group_name, name, status, posts_target, posts_made, sort)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    [
      itemId,
      input.kind,
      input.platform ?? null,
      input.groupName ?? null,
      input.name.trim(),
      input.status ?? "ongoing",
      Math.max(0, input.postsTarget ?? 0),
      await nextSort("items"),
    ],
  );
  return itemId;
}

export async function updateItem(
  itemId: string,
  patch: {
    name?: string;
    groupName?: string | null;
    postsTarget?: number;
    postsMade?: number;
    status?: string;
  },
): Promise<void> {
  const sets: string[] = [];
  const values: InValue[] = [];

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
  await execute(`UPDATE items SET ${sets.join(", ")} WHERE id = ?`, values);
}

export async function deleteItem(itemId: string): Promise<void> {
  await withTx(async (tx) => {
    await run(tx, "DELETE FROM clips WHERE owner_type = 'item' AND owner_id = ?", [itemId]);
    await run(tx, "DELETE FROM items WHERE id = ?", [itemId]);
  });
}

/* ------------------------------------------------------------------ clips */

const OWNER_TABLE: Record<ClipOwnerType, string> = {
  account: "accounts",
  item: "items",
};

export async function ownerExists(
  ownerType: ClipOwnerType,
  ownerId: string,
): Promise<boolean> {
  const table = OWNER_TABLE[ownerType];
  if (!table) return false;
  const row = await queryOne<{ ok: number }>(`SELECT 1 AS ok FROM ${table} WHERE id = ?`, [
    ownerId,
  ]);
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
export async function addClip(input: {
  ownerType: ClipOwnerType;
  ownerId: string;
  url: string;
  label?: string;
  views?: number | null;
  /** The day this clip counts toward. Defaults to today. */
  clipDate?: string;
}): Promise<AddClipResult> {
  if (!(await ownerExists(input.ownerType, input.ownerId))) {
    return { ok: false, reason: "no_owner" };
  }

  const normalized = normalizeUrl(input.url);

  const existing = await queryOne<ClipRow>(
    "SELECT * FROM clips WHERE owner_type = ? AND owner_id = ? AND normalized_url = ?",
    [input.ownerType, input.ownerId, normalized],
  );
  if (existing) return { ok: false, reason: "duplicate", clip: toClip(existing) };

  const clipId = id("clip");
  const createdAt = nowIso();
  const clipDate = isIsoDate(input.clipDate) ? input.clipDate : todayIso();
  const table = OWNER_TABLE[input.ownerType];

  await withTx(async (tx) => {
    await run(
      tx,
      `INSERT INTO clips (id, owner_type, owner_id, url, normalized_url, label, views, views_source, clip_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
      ],
    );
    await run(tx, `UPDATE ${table} SET posts_made = posts_made + 1 WHERE id = ?`, [input.ownerId]);
    // Freeze the target that applied on this day, so later changes to the
    // standing target cannot rewrite history.
    await snapshotDayTargets(clipDate, tx);
  });

  const row = await queryOne<ClipRow>("SELECT * FROM clips WHERE id = ?", [clipId]);
  return { ok: true, clip: toClip(row as ClipRow) };
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
export async function addClips(input: {
  ownerType: ClipOwnerType;
  ownerId: string;
  urls: string[];
  clipDate?: string;
}): Promise<AddClipsResult> {
  if (!(await ownerExists(input.ownerType, input.ownerId))) {
    return { ok: false, reason: "no_owner" };
  }

  const clipDate = isIsoDate(input.clipDate) ? input.clipDate : todayIso();
  const table = OWNER_TABLE[input.ownerType];

  const storedRows = await query<{ normalized_url: string }>(
    "SELECT normalized_url FROM clips WHERE owner_type = ? AND owner_id = ?",
    [input.ownerType, input.ownerId],
  );
  const stored = new Set(storedRows.map((row) => row.normalized_url));

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
    await withTx(async (tx) => {
      const createdAt = nowIso();
      for (const entry of accepted) {
        await run(
          tx,
          `INSERT INTO clips (id, owner_type, owner_id, url, normalized_url, label, views, views_source, clip_date, created_at)
           VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?)`,
          [
            id("clip"),
            input.ownerType,
            input.ownerId,
            entry.url,
            entry.normalized,
            clipDate,
            createdAt,
          ],
        );
      }
      await run(tx, `UPDATE ${table} SET posts_made = posts_made + ? WHERE id = ?`, [
        accepted.length,
        input.ownerId,
      ]);
      await snapshotDayTargets(clipDate, tx);
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
export async function deleteClip(clipId: string): Promise<boolean> {
  const row = await queryOne<{ owner_type: ClipOwnerType; owner_id: string }>(
    "SELECT owner_type, owner_id FROM clips WHERE id = ?",
    [clipId],
  );
  if (!row) return false;

  const table = OWNER_TABLE[row.owner_type];
  await withTx(async (tx) => {
    await run(tx, "DELETE FROM clips WHERE id = ?", [clipId]);
    await run(tx, `UPDATE ${table} SET posts_made = MAX(0, posts_made - 1) WHERE id = ?`, [
      row.owner_id,
    ]);
  });
  return true;
}

/**
 * Edits a clip. Changing `clipDate` moves the clip between days, which is how
 * an admin backfills a day they logged late.
 */
export async function updateClip(
  clipId: string,
  patch: { label?: string | null; views?: number | null; clipDate?: string },
): Promise<void> {
  const sets: string[] = [];
  const values: InValue[] = [];

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
  await execute(`UPDATE clips SET ${sets.join(", ")} WHERE id = ?`, values);

  // The day it moved onto now has activity and needs its own target snapshot.
  if (patch.clipDate !== undefined && isIsoDate(patch.clipDate)) {
    await snapshotDayTargets(patch.clipDate);
  }
}

/* ------------------------------------------------------------- strategies */

export async function createStrategy(input: {
  title: string;
  description?: string;
  status?: string;
  platform?: string | null;
}): Promise<string> {
  const strategyId = id("strat");
  await execute(
    `INSERT INTO strategies (id, title, description, status, platform, selected, sort)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
    [
      strategyId,
      input.title.trim(),
      input.description?.trim() ?? "",
      input.status ?? "ongoing",
      input.platform ?? null,
      await nextSort("strategies"),
    ],
  );
  return strategyId;
}

export async function updateStrategy(
  strategyId: string,
  patch: {
    title?: string;
    description?: string;
    status?: string;
    selected?: boolean;
    platform?: string | null;
    report?: { reach?: string; topClip?: string; verdict?: string } | null;
  },
): Promise<void> {
  const sets: string[] = [];
  const values: InValue[] = [];

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
  await execute(`UPDATE strategies SET ${sets.join(", ")} WHERE id = ?`, values);
}

export async function deleteStrategy(strategyId: string): Promise<void> {
  await execute("DELETE FROM strategies WHERE id = ?", [strategyId]);
}

/* ---------------------------------------------------------------- reports */

export async function createReport(input: {
  week: string;
  summary?: string;
  postedDate?: string;
}): Promise<string> {
  const reportId = id("rep");
  await execute("INSERT INTO reports (id, week, summary, posted_date) VALUES (?, ?, ?, ?)", [
    reportId,
    input.week.trim(),
    input.summary?.trim() ?? "",
    input.postedDate ?? new Date().toISOString().slice(0, 10),
  ]);
  return reportId;
}

export async function updateReport(
  reportId: string,
  patch: { week?: string; summary?: string; postedDate?: string },
): Promise<void> {
  const sets: string[] = [];
  const values: InValue[] = [];

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
  await execute(`UPDATE reports SET ${sets.join(", ")} WHERE id = ?`, values);
}

export async function deleteReport(reportId: string): Promise<void> {
  await execute("DELETE FROM reports WHERE id = ?", [reportId]);
}

/** Re-exported so callers can type a transaction without importing the driver. */
export type { Transaction };
