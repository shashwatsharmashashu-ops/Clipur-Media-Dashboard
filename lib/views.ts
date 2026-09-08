import type { Clip } from "./types";

/**
 * Views source abstraction.
 *
 * Today clips carry manually-entered views (or none at all). Tomorrow an
 * X / YouTube integration can supply them instead. The UI never reads views
 * from anywhere but `Clip.views`, so swapping the provider below is the whole
 * migration — no component changes.
 *
 * To go live:
 *   1. implement `ViewsProvider.fetchViews` against the platform API,
 *   2. export it as `viewsProvider`,
 *   3. call `useHydratedViews` (or a server action) where clips are loaded.
 *
 * Views remain reference-only. They must never become a target or a score.
 */
export interface ViewsProvider {
  readonly kind: "manual" | "api";
  /**
   * Returns a map of clipId -> view count. `null` means "unknown", which the
   * UI renders as absent rather than as zero.
   */
  fetchViews(clips: Clip[]): Promise<Record<string, number | null>>;
}

/** Default provider: whatever the team typed in stays as-is. */
export const manualViewsProvider: ViewsProvider = {
  kind: "manual",
  async fetchViews(clips) {
    return Object.fromEntries(clips.map((c) => [c.id, c.views ?? null]));
  },
};

/**
 * Example shape of a future API-backed provider. Left unwired on purpose.
 *
 * export const apiViewsProvider: ViewsProvider = {
 *   kind: "api",
 *   async fetchViews(clips) {
 *     const res = await fetch("/api/views", {
 *       method: "POST",
 *       body: JSON.stringify({ urls: clips.map((c) => c.url) }),
 *     });
 *     return res.json();
 *   },
 * };
 */
export const viewsProvider: ViewsProvider = manualViewsProvider;

/** Merges freshly fetched counts back onto clips, tagging the source. */
export function applyViews(
  clips: Clip[],
  counts: Record<string, number | null>,
  source: ViewsProvider["kind"],
): Clip[] {
  return clips.map((clip) =>
    clip.id in counts
      ? { ...clip, views: counts[clip.id], viewsSource: source }
      : clip,
  );
}
