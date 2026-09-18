import type { Account, Clip, Niche, Totals, TrackedItem } from "./types";

/**
 * Rollup math. Output only — postsMade / postsTarget.
 *
 * Views never enter any of these functions. If a future change makes a total
 * depend on views, that is a bug, not a feature.
 */

export const ZERO_TOTALS: Totals = { postsMade: 0, postsTarget: 0 };

export function sumTotals(parts: Totals[]): Totals {
  return parts.reduce<Totals>(
    (acc, part) => ({
      postsMade: acc.postsMade + part.postsMade,
      postsTarget: acc.postsTarget + part.postsTarget,
    }),
    ZERO_TOTALS,
  );
}

export function accountTotals(account: Account): Totals {
  return { postsMade: account.postsMade, postsTarget: account.postsTarget };
}

/** A niche's totals roll up from its accounts. */
export function nicheTotals(niche: Niche): Totals {
  return sumTotals(niche.accounts.map(accountTotals));
}

/** The X platform total rolls up from its niches. */
export function platformTotalsFromNiches(niches: Niche[]): Totals {
  return sumTotals(niches.map(nicheTotals));
}

export function itemTotals(item: TrackedItem): Totals {
  return { postsMade: item.postsMade, postsTarget: item.postsTarget };
}

export function itemsTotals(items: TrackedItem[]): Totals {
  return sumTotals(items.map(itemTotals));
}

/** Groups IG / TikTok items by their content strategy group. */
export function groupItems(items: TrackedItem[]): { group: string; items: TrackedItem[] }[] {
  const order: string[] = [];
  const map = new Map<string, TrackedItem[]>();

  for (const item of items) {
    const key = item.groupName?.trim() || "Ungrouped";
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(item);
  }

  return order.map((group) => ({ group, items: map.get(group)! }));
}

/** Collects every clip under a set of owners, for the reference list. */
export function collectClips(sources: { clips: Clip[] }[]): Clip[] {
  return sources.flatMap((source) => source.clips);
}
