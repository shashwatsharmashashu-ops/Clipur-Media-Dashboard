"use client";

export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

/**
 * Generic segmented filter, shared by the tracked boards (status) and the
 * Strategy tab (its own status set).
 */
export default function FilterBar<T extends string>({
  options,
  value,
  onChange,
  counts,
  ariaLabel = "Filter",
}: {
  options: FilterOption<T>[];
  value: T;
  onChange: (next: T) => void;
  counts?: Partial<Record<T, number>>;
  ariaLabel?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-line bg-surface p-1"
    >
      {options.map((option) => {
        const active = option.value === value;
        const count = counts?.[option.value];
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-panel text-accent-deep shadow-[var(--shadow-card)]"
                : "text-mute hover:text-accent-deep"
            }`}
          >
            {option.label}
            {typeof count === "number" && (
              <span
                className={`ml-1.5 tabular-nums ${active ? "text-accent" : "text-mute/70"}`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
