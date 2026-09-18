/** Shared domain types for Clipur Media Command. */

/** Viral is split across three platforms, each with its own strategy. */
export type Platform = "x" | "instagram" | "tiktok";

/** The four seeded X niches. Admins can add more, so this stays open. */
export type SeededNicheKey = "ai" | "crypto" | "streamers" | "clavicular";
export type NicheKey = SeededNicheKey | (string & {});

export type TrackedStatus = "ongoing" | "upcoming" | "completed";

/**
 * A single posted clip. Views are OPTIONAL reference data, never a target.
 * Every clip counts as exactly one post toward its owner's posted count.
 */
export interface Clip {
  id: string;
  url: string;
  /** Normalized form used for duplicate detection. See lib/url.ts. */
  normalizedUrl: string;
  label?: string;
  /** Optional. `null` = not measured / not available. Reference only. */
  views?: number | null;
  /** Where the view number came from. Lets a real API replace manual entry. */
  viewsSource?: "manual" | "api";
  /**
   * The day this clip counts toward, `YYYY-MM-DD`. Defaults to the day it was
   * logged; an admin can change it to backfill a previous day.
   */
  clipDate: string;
  createdAt: string;
}

/**
 * One X account. 14 of these are split across the four niches.
 * Progress is ALWAYS postsMade / postsTarget.
 */
export interface Account {
  id: string;
  nicheId: string;
  handle: string;
  niche: NicheKey;
  status: TrackedStatus;
  postsTarget: number;
  postsMade: number;
  clips: Clip[];
}

/** An X niche. Its totals roll up from its accounts. */
export interface Niche {
  id: string;
  platform: Platform;
  key: NicheKey;
  name: string;
  accounts: Account[];
}

/**
 * The flat tracked unit used by Campaign (one per client) and by the
 * Instagram / TikTok boards (grouped by content strategy).
 */
export interface TrackedItem {
  id: string;
  /** "campaign" for client work, "platform" for IG / TikTok content. */
  kind: "campaign" | "platform";
  /** Set for kind === "platform". */
  platform?: Platform | null;
  /** Content strategy group for IG / TikTok, e.g. "Hollywood", "Streamer". */
  groupName?: string | null;
  name: string;
  status: TrackedStatus;
  postsTarget: number;
  postsMade: number;
  clips: Clip[];
}

export type StrategyStatus = "ongoing" | "in_discussion" | "concluded";

export interface StrategyReport {
  reach?: string;
  topClip?: string;
  verdict: string;
}

export interface Strategy {
  id: string;
  title: string;
  description: string;
  status: StrategyStatus;
  /** Which platform this play belongs to, if any. */
  platform?: Platform | null;
  /** Founder-facing signal: someone on the team flagged this as worth backing. */
  selected: boolean;
  report?: StrategyReport;
}

export interface WeeklyReport {
  id: string;
  week: string;
  summary: string;
  /** ISO date (YYYY-MM-DD). */
  postedDate: string;
}

export interface AdminUser {
  id: string;
  username: string;
}

/** Everything the dashboard renders, in one payload. */
export interface DashboardState {
  niches: Niche[];
  items: TrackedItem[];
  strategies: Strategy[];
  reports: WeeklyReport[];
}

/** Owner of a clip list — an X account or a tracked item. */
export type ClipOwnerType = "account" | "item";

/** Progress totals. Output only: never derived from views. */
export interface Totals {
  postsMade: number;
  postsTarget: number;
}

/* ------------------------------------------------------- daily targets --- */

/**
 * What a daily target is attached to.
 *
 * X is tracked per niche (each niche has its own clips/day target); Instagram
 * and TikTok are tracked at the platform level.
 */
export type DailyScopeType = "niche" | "platform";

export interface DailyScope {
  scopeType: DailyScopeType;
  /** A niche id, or the platform key for Instagram / TikTok. */
  scopeId: string;
  /** Which platform this scope belongs to, for grouping in the UI. */
  platform: Platform;
  name: string;
  /** The standing target, used for any date without its own snapshot. */
  target: number;
}

/** One scope's result on one date. Output only — clips that day vs target. */
export interface DayScopeProgress {
  scopeType: DailyScopeType;
  scopeId: string;
  platform: Platform;
  name: string;
  count: number;
  target: number;
}

export type DayStatus = "hit" | "partial" | "missed" | "none" | "future";

/** A single day in the calendar grid. */
export interface CalendarDay {
  date: string;
  count: number;
  target: number;
  status: DayStatus;
  /** Per-scope detail, so selecting a day needs no extra request. */
  scopes: DayScopeProgress[];
}

export interface CalendarMonth {
  month: string;
  today: string;
  days: CalendarDay[];
}

/** Optional per-account breakdown for X on a selected date. */
export interface DayAccountProgress {
  accountId: string;
  handle: string;
  nicheId: string;
  nicheName: string;
  count: number;
}
