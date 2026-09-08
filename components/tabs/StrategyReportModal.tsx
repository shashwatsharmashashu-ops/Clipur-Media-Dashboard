"use client";

import { useEffect, useRef } from "react";
import type { Strategy } from "@/lib/types";
import { useShowViews } from "@/components/providers/ViewsProvider";

/**
 * Retrospective for a concluded strategy.
 *
 * `reach` is a views-derived reference number, so it obeys the same global
 * toggle as every other view count. The verdict — the part founders act on —
 * is always visible.
 */
export default function StrategyReportModal({
  strategy,
  onClose,
}: {
  strategy: Strategy | null;
  onClose: () => void;
}) {
  const showViews = useShowViews();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!strategy) return;
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [strategy, onClose]);

  if (!strategy || !strategy.report) return null;
  const { reach, topClip, verdict } = strategy.report;

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

        <dl className="space-y-4">
          {topClip && (
            <div className="rounded-xl border border-line bg-surface p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-mute">
                Top clip
              </dt>
              <dd className="mt-1 text-sm text-text">{topClip}</dd>
            </div>
          )}

          {reach &&
            (showViews ? (
              <div className="rounded-xl border border-line bg-surface p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-mute">
                  Reach
                </dt>
                <dd className="mt-1 text-sm text-mute">{reach}</dd>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-line bg-surface p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-mute">
                  Reach
                </dt>
                <dd className="mt-1 text-xs text-mute">
                  Hidden — turn on Show views to see reference figures.
                </dd>
              </div>
            ))}

          <div className="rounded-xl border border-accent/30 bg-accent-soft p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-accent-deep">
              Verdict &amp; recommendation
            </dt>
            <dd className="mt-1 text-sm leading-relaxed text-text">{verdict}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
