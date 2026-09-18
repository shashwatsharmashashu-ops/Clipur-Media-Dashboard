"use client";

import type { CalendarDay, DayStatus } from "@/lib/types";
import { WEEKDAY_LABELS, dayNumber, monthGrid } from "@/lib/date";

/**
 * Month grid with each day marked by how it did against that day's target,
 * so a month can be scanned at a glance.
 */

const STATUS_DOT: Record<DayStatus, string> = {
  hit: "bg-accent-deep",
  partial: "bg-accent",
  missed: "bg-rose-400",
  none: "bg-line",
  future: "bg-transparent",
};

export const STATUS_LEGEND: { status: DayStatus; label: string }[] = [
  { status: "hit", label: "Every target hit" },
  { status: "partial", label: "Half or more hit" },
  { status: "missed", label: "Under half hit" },
  { status: "none", label: "Nothing logged" },
];

export default function MonthGrid({
  month,
  days,
  today,
  selected,
  onSelect,
}: {
  month: string;
  days: CalendarDay[];
  today: string;
  selected: string;
  onSelect: (date: string) => void;
}) {
  const byDate = new Map(days.map((day) => [day.date, day]));
  const cells = monthGrid(month);

  return (
    <div>
      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-mute"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const day = byDate.get(cell.date);
          const status: DayStatus = day?.status ?? (cell.date > today ? "future" : "none");
          const isSelected = cell.date === selected;
          const isToday = cell.date === today;

          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onSelect(cell.date)}
              aria-pressed={isSelected}
              aria-label={`${cell.date}${day ? `, ${day.count} of ${day.target} posts` : ""}`}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border text-sm transition-colors ${
                isSelected
                  ? "border-accent-deep bg-accent-soft text-accent-deep"
                  : "border-line bg-panel hover:border-accent hover:bg-surface"
              } ${cell.inMonth ? "text-text" : "text-mute/50"}`}
            >
              <span
                className={`tabular-nums ${isToday ? "font-bold text-accent-deep" : "font-medium"}`}
              >
                {dayNumber(cell.date)}
              </span>

              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`}
              />

              {day && status !== "future" && day.count > 0 && (
                <span className="text-[10px] tabular-nums text-mute">{day.count}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        {STATUS_LEGEND.map((entry) => (
          <span key={entry.status} className="flex items-center gap-1.5 text-xs text-mute">
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[entry.status]}`}
            />
            {entry.label}
          </span>
        ))}
      </div>
    </div>
  );
}
