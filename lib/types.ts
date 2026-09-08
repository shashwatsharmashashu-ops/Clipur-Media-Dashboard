/** Shared domain types for Clipur Media Command. */

/** A single posted clip. Views are OPTIONAL reference data, never a target. */
export interface Clip {
  id: string;
  url: string;
  label?: string;
  /** Optional. `null` = not measured / not available. Reference only. */
  views?: number | null;
  /** Where the view number came from. Lets a real API replace manual entry. */
  viewsSource?: "manual" | "api";
}

export type TrackedStatus = "ongoing" | "upcoming" | "completed";

/**
 * One tracked unit of work — a niche (Viral) or a client (Campaign).
 * Progress is ALWAYS postsMade / postsTarget.
 */
export interface TrackedItem {
  id: string;
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

/** Distinguishes the two structurally identical tracked boards. */
export type TrackedKind = "viral" | "campaign";
