"use client";

import { useEffect, useState } from "react";

/**
 * Two-step delete. The first click arms it, the second confirms; it disarms
 * itself after a few seconds. Deletions here remove real rows from the shared
 * store, so a stray click should not be enough.
 */
export default function DeleteButton({
  onConfirm,
  label,
  size = "md",
  className = "",
}: {
  onConfirm: () => void;
  /** What is being deleted, for the accessible name. */
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);

  const dimensions = size === "sm" ? "h-6 w-6 text-xs" : "h-7 w-7 text-sm";

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        aria-label={`Delete ${label}`}
        title={`Delete ${label}`}
        className={`flex ${dimensions} shrink-0 items-center justify-center rounded-lg border border-line text-mute transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 ${className}`}
      >
        ×
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setArmed(false);
        onConfirm();
      }}
      onBlur={() => setArmed(false)}
      aria-label={`Confirm delete ${label}`}
      className={`shrink-0 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 ${className}`}
    >
      Confirm
    </button>
  );
}
