"use client";

import type { Clip, TrackedItem } from "@/lib/types";
import ProgressBar from "./ProgressBar";
import StatusBadge from "./StatusBadge";
import ClipList from "./ClipList";
import PerformanceReference from "./PerformanceReference";

/**
 * One niche (Viral) or one client (Campaign). Structurally identical — the
 * only difference is the `groupLabel` shown above the name.
 */
export default function TrackedItemCard({
  item,
  groupLabel,
  onAddClip,
  onAdjustPosts,
}: {
  item: TrackedItem;
  groupLabel: string;
  onAddClip: (itemId: string, clip: Omit<Clip, "id">) => void;
  onAdjustPosts: (itemId: string, delta: number) => void;
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-line bg-panel p-5 shadow-[var(--shadow-card)]">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
            {groupLabel}
          </p>
          <h3 className="truncate text-base font-semibold text-text">{item.name}</h3>
        </div>
        <StatusBadge status={item.status} />
      </header>

      <ProgressBar made={item.postsMade} target={item.postsTarget} />

      <div className="mt-3 flex items-center gap-2 border-b border-line pb-4">
        <span className="text-xs text-mute">Update posts made</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => onAdjustPosts(item.id, -1)}
            disabled={item.postsMade <= 0}
            aria-label={`Decrease posts made for ${item.name}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-panel text-mute transition-colors hover:border-accent hover:text-accent-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => onAdjustPosts(item.id, 1)}
            aria-label={`Increase posts made for ${item.name}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-accent/40 bg-accent-soft text-accent-deep transition-colors hover:bg-accent hover:text-white"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-4">
        <ClipList
          clips={item.clips}
          onAddClip={(input) =>
            onAddClip(item.id, {
              url: input.url,
              label: input.label,
              views: input.views ?? null,
              viewsSource: "manual",
            })
          }
        />
      </div>

      <PerformanceReference clips={item.clips} />
    </article>
  );
}
