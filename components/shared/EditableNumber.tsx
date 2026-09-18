"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Click-to-edit integer, used for posts targets and posted counts.
 * Enter or blur commits, Escape reverts. Negative values are clamped to zero.
 */
export default function EditableNumber({
  value,
  onCommit,
  className = "",
  ariaLabel,
  suffix,
}: {
  value: number;
  onCommit: (next: number) => void;
  className?: string;
  ariaLabel?: string;
  suffix?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commit() {
    setEditing(false);
    const parsed = Number(draft.replace(/[^\d-]/g, ""));
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    const next = Math.max(0, Math.round(parsed));
    if (next !== value) onCommit(next);
    else setDraft(String(value));
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        title="Click to edit"
        aria-label={ariaLabel ? `${ariaLabel}: ${value}. Click to edit.` : undefined}
        className={`rounded px-1 -mx-1 tabular-nums transition-colors hover:bg-accent-soft focus:outline-none focus:ring-2 focus:ring-accent/30 ${className}`}
      >
        {value}
        {suffix}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={draft}
      aria-label={ariaLabel}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        }
        if (e.key === "Escape") {
          setDraft(String(value));
          setEditing(false);
        }
      }}
      className={`w-16 rounded-lg border border-accent bg-panel px-1.5 py-0.5 text-inherit tabular-nums focus:outline-none focus:ring-2 focus:ring-accent/25 ${className}`}
    />
  );
}
