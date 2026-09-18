"use client";

import { useMemo, useState } from "react";
import type { Platform, TrackedStatus } from "@/lib/types";
import { collectClips, itemsTotals, platformTotalsFromNiches } from "@/lib/rollup";
import { useData } from "@/components/providers/DataProvider";
import FilterBar, { type FilterOption } from "@/components/shared/FilterBar";
import ProgressBar from "@/components/shared/ProgressBar";
import PerformanceReference from "@/components/shared/PerformanceReference";
import PlatformSwitch, { PLATFORM_LABELS } from "@/components/viral/PlatformSwitch";
import XBoard from "@/components/viral/XBoard";
import PlatformBoard from "@/components/viral/PlatformBoard";

type StatusFilterValue = TrackedStatus | "all";

const FILTERS: FilterOption<StatusFilterValue>[] = [
  { value: "ongoing", label: "Ongoing" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "all", label: "All" },
];

const BLURBS: Record<Platform, string> = {
  x: "Four niches, 14 accounts. Each account carries its own target; niches roll up from accounts, and the platform total rolls up from the niches.",
  instagram:
    "Instagram and TikTok run the same strategy — mainly Hollywood and Streamer content — so work is grouped by content strategy rather than by niche.",
  tiktok:
    "TikTok shares Instagram's strategy: Hollywood and Streamer content, grouped by content strategy rather than by niche.",
};

/** Viral, split into the three platform boards. */
export default function ViralTab() {
  const { state } = useData();
  const [platform, setPlatform] = useState<Platform>("x");
  const [status, setStatus] = useState<StatusFilterValue>("all");

  const xNiches = useMemo(
    () => state.niches.filter((niche) => niche.platform === "x"),
    [state.niches],
  );

  const platformItems = useMemo(
    () => state.items.filter((item) => item.kind === "platform" && item.platform === platform),
    [state.items, platform],
  );

  const totals = useMemo(
    () => (platform === "x" ? platformTotalsFromNiches(xNiches) : itemsTotals(platformItems)),
    [platform, xNiches, platformItems],
  );

  // Views live here only as a secondary reference, below the progress bar.
  const clips = useMemo(
    () =>
      platform === "x"
        ? collectClips(xNiches.flatMap((niche) => niche.accounts))
        : collectClips(platformItems),
    [platform, xNiches, platformItems],
  );

  const counts = useMemo(() => {
    const units =
      platform === "x" ? xNiches.flatMap((niche) => niche.accounts) : platformItems;
    return {
      ongoing: units.filter((u) => u.status === "ongoing").length,
      upcoming: units.filter((u) => u.status === "upcoming").length,
      completed: units.filter((u) => u.status === "completed").length,
      all: units.length,
    };
  }, [platform, xNiches, platformItems]);

  return (
    <section>
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-text">Viral</h2>
        <p className="mt-1 max-w-3xl text-sm text-mute">{BLURBS[platform]}</p>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <PlatformSwitch active={platform} onChange={setPlatform} />
        <FilterBar
          options={FILTERS}
          value={status}
          onChange={setStatus}
          counts={counts}
          ariaLabel="Filter by status"
        />
      </div>

      <div className="mb-8 rounded-2xl border border-line bg-surface p-5">
        <ProgressBar
          made={totals.postsMade}
          target={totals.postsTarget}
          label={`${PLATFORM_LABELS[platform]} total output`}
        />
        <PerformanceReference clips={clips} />
      </div>

      {platform === "x" ? (
        <XBoard niches={xNiches} statusFilter={status} />
      ) : (
        <PlatformBoard platform={platform} items={platformItems} statusFilter={status} />
      )}
    </section>
  );
}
