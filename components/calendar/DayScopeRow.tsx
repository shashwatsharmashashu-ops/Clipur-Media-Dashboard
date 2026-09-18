"use client";

import type { DayScopeProgress } from "@/lib/types";
import { progressPercent } from "@/lib/format";
import EditableNumber from "@/components/shared/EditableNumber";

const PLATFORM_LABEL: Record<string, string> = {
  x: "X niche",
  instagram: "Instagram",
  tiktok: "TikTok",
};

/**
 * One scope's result on the selected date: clips that day against that day's
 * target. Output only — views never appear here.
 *
 * The target is editable, which corrects that single day rather than the
 * standing target.
 */
export default function DayScopeRow({
  scope,
  onTargetChange,
}: {
  scope: DayScopeProgress;
  onTargetChange: (target: number) => void;
}) {
  const percent = progressPercent(scope.count, scope.target);
  const hit = scope.target > 0 && scope.count >= scope.target;

  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
            {PLATFORM_LABEL[scope.platform] ?? scope.platform}
          </p>
          <h4 className="truncate text-sm font-semibold text-text">{scope.name}</h4>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tabular-nums text-text">
            {scope.count}
            <span className="text-mute"> / </span>
            <EditableNumber
              value={scope.target}
              onCommit={onTargetChange}
              ariaLabel={`Daily target for ${scope.name}`}
              className="text-mute"
            />
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
              hit ? "bg-accent-soft text-accent-deep" : "bg-surface text-mute"
            }`}
          >
            {percent}%
          </span>
        </div>
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-accent-soft"
        role="progressbar"
        aria-valuenow={scope.count}
        aria-valuemin={0}
        aria-valuemax={scope.target}
        aria-label={`${scope.name}: ${scope.count} of ${scope.target} on this day`}
      >
        <div
          className="progress-fill h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
