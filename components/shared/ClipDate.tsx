"use client";

import { useEffect, useRef, useState } from "react";
import { parseIsoDate, todayIso } from "@/lib/date";

/**
 * The day a clip counts toward, editable in place.
 *
 * Changing it moves the clip's contribution to another day's history, which is
 * how an admin backfills a day they logged late.
 */
export default function ClipDate({
  value,
  onCommit,
  label,
}: {
  value: string;
  onCommit: (next: string) => void;
  label: string;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="date"
        defaultValue={value}
        aria-label={`Date for ${label}`}
        onBlur={(e) => {
          setEditing(false);
          if (e.target.value && e.target.value !== value) onCommit(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setEditing(false);
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        className="w-[8.5rem] shrink-0 rounded border border-accent bg-panel px-1.5 py-0.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent/25"
      />
    );
  }

  const isToday = value === todayIso();

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title={`Counts toward ${value} — click to change`}
      aria-label={`Date for ${label}: ${value}. Click to change.`}
      className={`shrink-0 rounded px-1.5 py-0.5 text-xs tabular-nums transition-colors hover:bg-accent-soft ${
        isToday ? "text-accent-deep" : "text-mute"
      }`}
    >
      {parseIsoDate(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
    </button>
  );
}
