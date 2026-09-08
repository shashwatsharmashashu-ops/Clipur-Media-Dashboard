"use client";

import type { Clip } from "@/lib/types";
import { formatViews, prettyUrl } from "@/lib/format";
import { useShowViews } from "@/components/providers/ViewsProvider";

/**
 * Secondary, optional reference list: clips ranked by views.
 *
 * Renders ONLY when the global Show-views toggle is on AND at least one clip
 * actually has a view count. It is deliberately quieter than the ProgressBar —
 * this is context for a conversation, not a scoreboard.
 */
export default function PerformanceReference({ clips }: { clips: Clip[] }) {
  const showViews = useShowViews();
  if (!showViews) return null;

  const ranked = clips
    .filter((clip): clip is Clip & { views: number } => typeof clip.views === "number")
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  if (ranked.length === 0) return null;

  return (
    <details className="mt-4 rounded-xl border border-line bg-surface/70 px-3 py-2">
      <summary className="cursor-pointer list-none text-xs font-medium text-mute marker:hidden hover:text-accent-deep">
        Performance reference
        <span className="ml-1 opacity-70">· not a target</span>
      </summary>

      <ol className="mt-2 space-y-1.5">
        {ranked.map((clip, index) => (
          <li key={clip.id} className="flex items-center gap-2 text-xs text-mute">
            <span className="w-4 shrink-0 tabular-nums opacity-60">{index + 1}</span>
            <a
              href={clip.url}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 flex-1 truncate hover:text-accent-deep hover:underline"
              title={clip.url}
            >
              {clip.label || prettyUrl(clip.url)}
            </a>
            <span className="shrink-0 tabular-nums">{formatViews(clip.views)}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}
