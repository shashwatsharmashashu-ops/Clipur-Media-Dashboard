"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Click-to-edit text. Enter or blur commits, Escape reverts.
 *
 * Used for account handles, niche names, item names, strategy copy and report
 * text — anything an admin should be able to correct in place.
 */
export default function EditableText({
  value,
  onCommit,
  className = "",
  inputClassName = "",
  placeholder = "Untitled",
  multiline = false,
  ariaLabel,
}: {
  value: string;
  onCommit: (next: string) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  multiline?: boolean;
  ariaLabel?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onCommit(trimmed);
    else setDraft(value);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        title="Click to edit"
        aria-label={ariaLabel ? `${ariaLabel}: ${value}. Click to edit.` : undefined}
        className={`rounded px-1 -mx-1 text-left transition-colors hover:bg-accent-soft focus:outline-none focus:ring-2 focus:ring-accent/30 ${className}`}
      >
        {value || <span className="text-mute/70">{placeholder}</span>}
      </button>
    );
  }

  const shared = {
    ref: inputRef as never,
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft(e.target.value),
    onBlur: commit,
    "aria-label": ariaLabel,
    className: `w-full rounded-lg border border-accent bg-panel px-2 py-1 text-inherit focus:outline-none focus:ring-2 focus:ring-accent/25 ${inputClassName}`,
  };

  if (multiline) {
    return (
      <textarea
        {...shared}
        rows={4}
        onKeyDown={(e) => {
          if (e.key === "Escape") cancel();
          // Enter inserts a newline here; Ctrl/Cmd+Enter commits.
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commit();
        }}
      />
    );
  }

  return (
    <input
      {...shared}
      type="text"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        }
        if (e.key === "Escape") cancel();
      }}
    />
  );
}
