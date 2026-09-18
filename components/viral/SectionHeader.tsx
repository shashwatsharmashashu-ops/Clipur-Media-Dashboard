"use client";

import type { Totals } from "@/lib/types";
import { progressPercent } from "@/lib/format";
import EditableText from "@/components/shared/EditableText";
import DeleteButton from "@/components/shared/DeleteButton";

/**
 * Header for a niche (X) or a content group (IG / TikTok), showing the totals
 * rolled up from the cards beneath it. Output only — never views.
 */
export default function SectionHeader({
  eyebrow,
  name,
  totals,
  count,
  countLabel,
  onRename,
  onDelete,
}: {
  eyebrow: string;
  name: string;
  totals: Totals;
  count: number;
  countLabel: string;
  onRename?: (next: string) => void;
  onDelete?: () => void;
}) {
  const percent = progressPercent(totals.postsMade, totals.postsTarget);

  return (
    <div className="mb-4 rounded-2xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
            {eyebrow}
          </p>
          {onRename ? (
            <EditableText
              value={name}
              onCommit={onRename}
              ariaLabel="Section name"
              className="text-lg font-semibold text-text"
            />
          ) : (
            <h3 className="text-lg font-semibold text-text">{name}</h3>
          )}
          <p className="mt-0.5 text-xs text-mute">
            {count} {countLabel}
            {count === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-lg font-semibold tabular-nums text-text">
              {totals.postsMade}
              <span className="text-mute"> / {totals.postsTarget}</span>
            </p>
            <p className="text-xs tabular-nums text-mute">{percent}% of target</p>
          </div>
          {onDelete && <DeleteButton onConfirm={onDelete} label={name} />}
        </div>
      </div>

      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-accent-soft"
        role="progressbar"
        aria-valuenow={totals.postsMade}
        aria-valuemin={0}
        aria-valuemax={totals.postsTarget}
        aria-label={`${name}: ${totals.postsMade} of ${totals.postsTarget} posts made`}
      >
        <div
          className="progress-fill h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
