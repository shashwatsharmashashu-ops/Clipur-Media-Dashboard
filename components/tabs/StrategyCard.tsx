"use client";

import type { Strategy, StrategyStatus } from "@/lib/types";
import EditableText from "@/components/shared/EditableText";
import DeleteButton from "@/components/shared/DeleteButton";

const STATUS_OPTIONS: { value: StrategyStatus; label: string }[] = [
  { value: "ongoing", label: "Ongoing" },
  { value: "in_discussion", label: "In discussion" },
  { value: "concluded", label: "Concluded" },
];

const STATUS_STYLES: Record<StrategyStatus, string> = {
  ongoing: "bg-accent-soft text-accent-deep border-accent/30",
  in_discussion: "bg-surface text-mute border-line",
  concluded: "bg-white text-accent-deep border-accent-deep/30",
};

export default function StrategyCard({
  strategy,
  onSelect,
  onUpdate,
  onDelete,
  onOpenReport,
}: {
  strategy: Strategy;
  onSelect: (id: string) => void;
  onUpdate: (patch: { title?: string; description?: string; status?: StrategyStatus }) => void;
  onDelete: () => void;
  onOpenReport: (strategy: Strategy) => void;
}) {
  const isConcluded = strategy.status === "concluded";

  return (
    <article className="flex flex-col rounded-2xl border border-line bg-panel p-5 shadow-[var(--shadow-card)]">
      <header className="mb-3 flex items-start justify-between gap-3">
        <EditableText
          value={strategy.title}
          onCommit={(title) => onUpdate({ title })}
          ariaLabel="Strategy title"
          className="flex-1 text-base font-semibold text-text"
        />
        <div className="flex shrink-0 items-center gap-2">
          <select
            value={strategy.status}
            aria-label={`Status for ${strategy.title}`}
            onChange={(e) => onUpdate({ status: e.target.value as StrategyStatus })}
            className={`cursor-pointer appearance-none rounded-full border px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 ${STATUS_STYLES[strategy.status]}`}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-panel text-text">
                {option.label}
              </option>
            ))}
          </select>
          <DeleteButton onConfirm={onDelete} label={`strategy ${strategy.title}`} />
        </div>
      </header>

      <EditableText
        value={strategy.description}
        onCommit={(description) => onUpdate({ description })}
        ariaLabel="Strategy description"
        multiline
        placeholder="Add a description…"
        className="flex-1 text-sm leading-relaxed text-mute"
        inputClassName="text-sm leading-relaxed"
      />

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

        {isConcluded && (
          <button
            type="button"
            onClick={() => onOpenReport(strategy)}
            className="ml-auto rounded-lg bg-accent-deep px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-accent"
          >
            {strategy.report ? "View report" : "Add report"}
          </button>
        )}
      </footer>
    </article>
  );
}
