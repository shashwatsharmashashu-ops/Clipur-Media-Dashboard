"use client";

import { useMemo, useState } from "react";
import type { Clip, TrackedItem, TrackedStatus } from "@/lib/types";
import FilterBar, { type FilterOption } from "./FilterBar";
import ProgressBar from "./ProgressBar";
import TrackedItemCard from "./TrackedItemCard";

type StatusFilterValue = TrackedStatus | "all";

const FILTERS: FilterOption<StatusFilterValue>[] = [
  { value: "ongoing", label: "Ongoing" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "all", label: "All" },
];

/**
 * Shared board behind both the Viral and Campaign tabs. They are functionally
 * identical; only the grouping label differs (niche vs client).
 */
export default function TrackedBoard({
  heading,
  description,
  groupLabel,
  items,
  onAddClip,
  onAdjustPosts,
}: {
  heading: string;
  description: string;
  groupLabel: string;
  items: TrackedItem[];
  onAddClip: (itemId: string, clip: Omit<Clip, "id">) => void;
  onAdjustPosts: (itemId: string, delta: number) => void;
}) {
  const [status, setStatus] = useState<StatusFilterValue>("ongoing");

  const counts = useMemo(
    () => ({
      ongoing: items.filter((i) => i.status === "ongoing").length,
      upcoming: items.filter((i) => i.status === "upcoming").length,
      completed: items.filter((i) => i.status === "completed").length,
      all: items.length,
    }),
    [items],
  );

  const visible = useMemo(
    () => (status === "all" ? items : items.filter((item) => item.status === status)),
    [items, status],
  );

  // Roll-up is output only: sum of posts, never views.
  const totals = useMemo(
    () =>
      visible.reduce(
        (acc, item) => ({
          made: acc.made + item.postsMade,
          target: acc.target + item.postsTarget,
        }),
        { made: 0, target: 0 },
      ),
    [visible],
  );

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text">{heading}</h2>
          <p className="mt-1 max-w-2xl text-sm text-mute">{description}</p>
        </div>
        <FilterBar
          options={FILTERS}
          value={status}
          onChange={setStatus}
          counts={counts}
          ariaLabel={`Filter ${heading} by status`}
        />
      </div>

      {visible.length > 0 && (
        <div className="mb-6 rounded-2xl border border-line bg-surface p-5">
          <ProgressBar
            made={totals.made}
            target={totals.target}
            label={`Combined output · ${
              status === "all" ? "all" : status
            } (${visible.length})`}
          />
        </div>
      )}

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center text-sm text-mute">
          Nothing {status === "all" ? "tracked" : status} right now.
        </p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {visible.map((item) => (
            <TrackedItemCard
              key={item.id}
              item={item}
              groupLabel={groupLabel}
              onAddClip={onAddClip}
              onAdjustPosts={onAdjustPosts}
            />
          ))}
        </div>
      )}
    </section>
  );
}
