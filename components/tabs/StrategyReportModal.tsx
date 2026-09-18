"use client";

import { useEffect, useRef, useState } from "react";
import type { Strategy } from "@/lib/types";
import { useShowViews } from "@/components/providers/ViewsProvider";

/**
 * Retrospective for a concluded strategy, editable in place.
 *
 * `reach` is a views-derived reference number, so it obeys the same global
 * toggle as every other view count. The verdict — the part founders act on —
 * is always visible.
 */
export default function StrategyReportModal({
  strategy,
  onClose,
  onSave,
}: {
  strategy: Strategy | null;
  onClose: () => void;
  onSave: (report: { reach?: string; topClip?: string; verdict?: string }) => void;
}) {
  const showViews = useShowViews();
  const closeRef = useRef<HTMLButtonElement>(null);

  const [reach, setReach] = useState("");
  const [topClip, setTopClip] = useState("");
  const [verdict, setVerdict] = useState("");

  useEffect(() => {
    if (!strategy) return;
    setReach(strategy.report?.reach ?? "");
    setTopClip(strategy.report?.topClip ?? "");
    setVerdict(strategy.report?.verdict ?? "");
    closeRef.current?.focus();
  }, [strategy]);

  useEffect(() => {
    if (!strategy) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [strategy, onClose]);

  if (!strategy) return null;

  const fieldClass =
    "mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-text placeholder:text-mute/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-text/25 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="strategy-report-title"
        onClick={(event) => event.stopPropagation()}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-panel p-6 shadow-[var(--shadow-pop)]"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
              Strategy report
            </p>
            <h3 id="strategy-report-title" className="text-lg font-semibold text-text">
              {strategy.title}
            </h3>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close report"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line text-mute transition-colors hover:border-accent hover:text-accent-deep"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <label className="block rounded-xl border border-line bg-surface p-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-mute">
              Top clip
            </span>
            <input
              type="text"
              value={topClip}
              onChange={(e) => setTopClip(e.target.value)}
              placeholder="Which clip carried the play"
              className={fieldClass}
            />
          </label>

          <label className="block rounded-xl border border-line bg-surface p-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-mute">Reach</span>
            {showViews ? (
              <input
                type="text"
                value={reach}
                onChange={(e) => setReach(e.target.value)}
                placeholder="Reference figure, e.g. 1.4M across 6 weeks"
                className={fieldClass}
              />
            ) : (
              <p className="mt-1 text-xs text-mute">
                Hidden — turn on Show views to read or edit reference figures.
              </p>
            )}
          </label>

          <label className="block rounded-xl border border-accent/30 bg-accent-soft p-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-accent-deep">
              Verdict &amp; recommendation
            </span>
            <textarea
              value={verdict}
              onChange={(e) => setVerdict(e.target.value)}
              rows={5}
              placeholder="What should the founders do with this?"
              className={fieldClass}
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-mute hover:text-accent-deep"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSave({
                // Preserve the stored reach when it is hidden and uneditable.
                reach: showViews ? reach : (strategy.report?.reach ?? undefined),
                topClip,
                verdict,
              });
              onClose();
            }}
            className="rounded-lg bg-accent-deep px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent"
          >
            Save report
          </button>
        </div>
      </div>
    </div>
  );
}
