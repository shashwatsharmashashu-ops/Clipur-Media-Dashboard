import type { Transaction } from "@libsql/client";
import { execute, query, run } from "./db";
import { DEFAULT_DAILY_TARGET } from "./schema.mjs";
import { monthBounds, todayIso } from "./date";
import type {
  CalendarDay,
  CalendarMonth,
  DailyScope,
  DailyScopeType,
  DayAccountProgress,
  DayScopeProgress,
  DayStatus,
  Platform,
} from "./types";

/**
 * Daily targets and calendar history.
 *
 * Two axes exist side by side: the running total (postsMade / postsTarget,
 * handled in repo.ts) and this one — how many clips landed on a given day
 * against that day's target.
 *
 * Counts are always derived from `clips.clip_date`, so a day's numbers can
 * never drift from the clips themselves. Only the *target* is snapshotted per
 * day, in `day_targets`, so changing the standing target later cannot rewrite
 * what a past day was measured against.
 */

export { DEFAULT_DAILY_TARGET };

/** Instagram and TikTok are tracked whole; X is tracked per niche. */
const PLATFORM_SCOPES: { scopeId: Platform; name: string }[] = [
  { scopeId: "instagram", name: "Instagram" },
  { scopeId: "tiktok", name: "TikTok" },
];

/** libSQL can return integers as bigint depending on the driver path. */
function num(value: unknown): number {
  return Number(value ?? 0);
}

/* ----------------------------------------------------------------- scopes */

interface StandingRow {
  scope_type: string;
  scope_id: string;
  target: number;
}

/**
 * Every scope that carries a daily target: one per X niche, plus Instagram
 * and TikTok. Scopes come from the live data, so adding a niche gives it a
 * daily target automatically (defaulting to 40).
 */
export async function listDailyScopes(): Promise<DailyScope[]> {
  const [standingRows, niches] = await Promise.all([
    query<StandingRow>("SELECT scope_type, scope_id, target FROM daily_targets"),
    query<{ id: string; name: string }>(
      "SELECT id, name FROM niches WHERE platform = 'x' ORDER BY sort ASC, name ASC",
    ),
  ]);

  const standing = new Map(
    standingRows.map((row) => [`${row.scope_type}:${row.scope_id}`, num(row.target)]),
  );

  const nicheScopes: DailyScope[] = niches.map((niche) => ({
    scopeType: "niche",
    scopeId: niche.id,
    platform: "x",
    name: niche.name,
    target: standing.get(`niche:${niche.id}`) ?? DEFAULT_DAILY_TARGET,
  }));

  const platformScopes: DailyScope[] = PLATFORM_SCOPES.map((platform) => ({
    scopeType: "platform",
    scopeId: platform.scopeId,
    platform: platform.scopeId,
    name: platform.name,
    target: standing.get(`platform:${platform.scopeId}`) ?? DEFAULT_DAILY_TARGET,
  }));

  return [...nicheScopes, ...platformScopes];
}

/**
 * Sets the standing daily target for a scope.
 *
 * Today moves with it — the day is still in progress, so raising the bar at
 * 11am should apply to the day you are raising it on. Days already closed keep
 * the target they were measured against.
 */
export async function setStandingTarget(
  scopeType: DailyScopeType,
  scopeId: string,
  target: number,
): Promise<void> {
  const value = Math.max(0, Math.round(target));

  await execute(
    `INSERT INTO daily_targets (scope_type, scope_id, target) VALUES (?, ?, ?)
     ON CONFLICT(scope_type, scope_id) DO UPDATE SET target = excluded.target`,
    [scopeType, scopeId, value],
  );

  await execute(
    `INSERT INTO day_targets (scope_type, scope_id, date, target) VALUES (?, ?, ?, ?)
     ON CONFLICT(scope_type, scope_id, date) DO UPDATE SET target = excluded.target`,
    [scopeType, scopeId, todayIso(), value],
  );
}

/** Corrects one specific day's target. Deliberate admin action, so it wins. */
export async function setDayTarget(
  scopeType: DailyScopeType,
  scopeId: string,
  date: string,
  target: number,
): Promise<void> {
  await execute(
    `INSERT INTO day_targets (scope_type, scope_id, date, target) VALUES (?, ?, ?, ?)
     ON CONFLICT(scope_type, scope_id, date) DO UPDATE SET target = excluded.target`,
    [scopeType, scopeId, date, Math.max(0, Math.round(target))],
  );
}

/**
 * Freezes today's targets onto a date the first time it sees activity.
 * `INSERT OR IGNORE` is the whole point: an existing snapshot is never
 * overwritten, so history stays truthful.
 *
 * Pass the caller's transaction so the snapshot commits or rolls back with the
 * clip that triggered it.
 */
export async function snapshotDayTargets(date: string, tx?: Transaction): Promise<void> {
  const scopes = await listDailyScopes();
  const sql =
    "INSERT OR IGNORE INTO day_targets (scope_type, scope_id, date, target) VALUES (?, ?, ?, ?)";

  for (const scope of scopes) {
    const args = [scope.scopeType, scope.scopeId, date, scope.target];
    if (tx) await run(tx, sql, args);
    else await execute(sql, args);
  }
}

/* --------------------------------------------------------------- calendar */

/**
 * How a day is marked on the grid.
 *
 * Judged by how many scopes met their own target, not by the combined total —
 * a niche that beats 40 should not paper over one that missed it.
 */
function dayStatus(scopes: DayScopeProgress[], date: string, today: string): DayStatus {
  if (date > today) return "future";

  const logged = scopes.reduce((sum, scope) => sum + scope.count, 0);
  if (logged === 0) return "none";

  const scored = scopes.filter((scope) => scope.target > 0);
  if (scored.length === 0) return "hit";

  const met = scored.filter((scope) => scope.count >= scope.target).length;
  if (met === scored.length) return "hit";
  return met * 2 >= scored.length ? "partial" : "missed";
}

interface CountRow {
  scope_id: string;
  date: string;
  count: number;
}

/**
 * A month of history: per-day totals for the grid, each carrying its full
 * per-scope breakdown so selecting a day needs no second request.
 */
export async function getMonthCalendar(month: string): Promise<CalendarMonth> {
  const { start, end } = monthBounds(month);
  const today = todayIso();

  const [scopes, nicheCounts, platformCounts, dayTargetRows] = await Promise.all([
    listDailyScopes(),
    query<CountRow>(
      `SELECT a.niche_id AS scope_id, c.clip_date AS date, COUNT(*) AS count
         FROM clips c
         JOIN accounts a ON a.id = c.owner_id
        WHERE c.owner_type = 'account' AND c.clip_date >= ? AND c.clip_date <= ?
        GROUP BY a.niche_id, c.clip_date`,
      [start, end],
    ),
    query<CountRow>(
      `SELECT i.platform AS scope_id, c.clip_date AS date, COUNT(*) AS count
         FROM clips c
         JOIN items i ON i.id = c.owner_id
        WHERE c.owner_type = 'item' AND i.kind = 'platform'
          AND i.platform IN ('instagram', 'tiktok')
          AND c.clip_date >= ? AND c.clip_date <= ?
        GROUP BY i.platform, c.clip_date`,
      [start, end],
    ),
    query<{ scope_type: string; scope_id: string; date: string; target: number }>(
      "SELECT scope_type, scope_id, date, target FROM day_targets WHERE date >= ? AND date <= ?",
      [start, end],
    ),
  ]);

  const counts = new Map<string, number>();
  for (const row of nicheCounts) counts.set(`niche:${row.scope_id}:${row.date}`, num(row.count));
  for (const row of platformCounts) {
    counts.set(`platform:${row.scope_id}:${row.date}`, num(row.count));
  }

  const dayTargets = new Map(
    dayTargetRows.map((row) => [
      `${row.scope_type}:${row.scope_id}:${row.date}`,
      num(row.target),
    ]),
  );

  const days: CalendarDay[] = [];
  for (let date = start; date <= end; date = nextDate(date)) {
    const dayScopes: DayScopeProgress[] = scopes.map((scope) => {
      const key = `${scope.scopeType}:${scope.scopeId}:${date}`;
      return {
        scopeType: scope.scopeType,
        scopeId: scope.scopeId,
        platform: scope.platform,
        name: scope.name,
        count: counts.get(key) ?? 0,
        // The frozen target for this day, or the standing one if the day has
        // no snapshot yet (today before its first clip, or an empty past day).
        target: dayTargets.get(key) ?? scope.target,
      };
    });

    const count = dayScopes.reduce((sum, scope) => sum + scope.count, 0);
    const target = dayScopes.reduce((sum, scope) => sum + scope.target, 0);

    days.push({
      date,
      count,
      target,
      status: dayStatus(dayScopes, date, today),
      scopes: dayScopes,
    });
  }

  return { month, today, days };
}

/** Local `YYYY-MM-DD` increment, kept here to avoid a Date round-trip. */
function nextDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

/** Optional per-account breakdown for X on one date. */
export async function getDayAccounts(date: string): Promise<DayAccountProgress[]> {
  const rows = await query<DayAccountProgress>(
    `SELECT a.id       AS accountId,
            a.handle   AS handle,
            a.niche_id AS nicheId,
            n.name     AS nicheName,
            COUNT(c.id) AS count
       FROM accounts a
       JOIN niches n ON n.id = a.niche_id
       LEFT JOIN clips c
         ON c.owner_id = a.id AND c.owner_type = 'account' AND c.clip_date = ?
      WHERE n.platform = 'x'
      GROUP BY a.id
      ORDER BY n.sort ASC, a.sort ASC`,
    [date],
  );

  // Rebuilt as plain object literals for the same reason as reports in repo.ts.
  return rows.map<DayAccountProgress>((row) => ({
    accountId: row.accountId,
    handle: row.handle,
    nicheId: row.nicheId,
    nicheName: row.nicheName,
    count: num(row.count),
  }));
}
