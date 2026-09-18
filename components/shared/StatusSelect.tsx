"use client";

import type { TrackedStatus } from "@/lib/types";

const OPTIONS: { value: TrackedStatus; label: string }[] = [
  { value: "ongoing", label: "Ongoing" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
];

const STYLES: Record<TrackedStatus, string> = {
  ongoing: "bg-accent-soft text-accent-deep border-accent/30",
  upcoming: "bg-surface text-mute border-line",
  completed: "bg-white text-accent-deep border-accent-deep/30",
};

/** The status badge, but editable in place. */
export default function StatusSelect({
  value,
  onChange,
  label,
}: {
  value: TrackedStatus;
  onChange: (next: TrackedStatus) => void;
  label: string;
}) {
  return (
    <select
      value={value}
      aria-label={`Status for ${label}`}
      onChange={(e) => onChange(e.target.value as TrackedStatus)}
      className={`shrink-0 cursor-pointer appearance-none rounded-full border px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 ${STYLES[value]}`}
    >
      {OPTIONS.map((option) => (
        <option key={option.value} value={option.value} className="bg-panel text-text">
          {option.label}
        </option>
      ))}
    </select>
  );
}
