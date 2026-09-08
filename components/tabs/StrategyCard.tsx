"use client";

import type { Strategy } from "@/lib/types";
import StatusBadge from "@/components/shared/StatusBadge";

export default function StrategyCard({
  strategy,
  onSelect,
  onOpenReport,
}: {
  strategy: Strategy;
  onSelect: (id: string) => void;
  onOpenReport: (strategy: Strategy) => void;
}) {
  const hasReport = strategy.status === "concluded" && Boolean(strategy.report);

  return (
    <article className="flex flex-col rounded-2xl border border-line bg-panel p-5 shadow-[var(--shadow-card)]">
      <header className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-text">{strategy.title}</h3>
        <StatusBadge status={strategy.status} />
      </header>

      <p className="flex-1 text-sm leading-relaxed text-mute">{strategy.description}</p>

      <footer className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <button
          type="button"
          onClick={() => onSelect(strategy.id)}
          aria-pressed={strategy.selected}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            strategy.selected
              ? "border-accent/40 bg-accent-soft text-accent-deep"
              : "border-line bg-panel text-mute hover:border-accent hover:text-accent-deep"
          }`}
        >
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className="h-4 w-4"
            fill={strategy.selected ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M10 16.5 4.2 11a3.6 3.6 0 0 1 5.1-5.1l.7.7.7-.7A3.6 3.6 0 0 1 15.8 11L10 16.5Z" />
          </svg>
          {strategy.selected ? "Noted for founders" : "Note for founders"}
        </button>

        {hasReport && (
          <button
            type="button"
            onClick={() => onOpenReport(strategy)}
            className="ml-auto rounded-lg bg-accent-deep px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-accent"
          >
            View report
          </button>
        )}
      </footer>
    </article>
  );
}
