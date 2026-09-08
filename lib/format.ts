/** Small display helpers shared across the dashboard. */

export function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(views);
}

export function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Progress percentage, clamped to 0-100 and guarded against a 0 target. */
export function progressPercent(made: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((made / target) * 100)));
}

/** Strips a url down to something readable when a clip has no label. */
export function prettyUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/$/, "");
    return `${parsed.hostname.replace(/^www\./, "")}${path}`;
  } catch {
    return url;
  }
}

export function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
