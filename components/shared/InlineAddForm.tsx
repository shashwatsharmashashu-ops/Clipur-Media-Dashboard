"use client";

import { useState } from "react";

export interface AddField {
  name: string;
  placeholder: string;
  type?: "text" | "number";
  required?: boolean;
  width?: string;
}

/**
 * Collapsed "+ Add …" control that expands into a small inline form.
 *
 * Used for every create action — niches, accounts, items, campaigns,
 * strategies, reports — so adding things looks the same everywhere.
 */
export default function InlineAddForm({
  label,
  fields,
  onSubmit,
  submitLabel = "Add",
}: {
  label: string;
  fields: AddField[];
  onSubmit: (values: Record<string, string>) => Promise<void> | void;
  submitLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function reset() {
    setValues({});
    setError(null);
    setOpen(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const missing = fields.find((f) => f.required !== false && !(values[f.name] ?? "").trim());
    if (missing) {
      setError(`${missing.placeholder} is required.`);
      return;
    }

    setPending(true);
    try {
      await onSubmit(values);
      reset();
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line bg-surface px-3 py-2 text-sm font-medium text-mute transition-colors hover:border-accent hover:text-accent-deep"
      >
        <span aria-hidden="true">+</span>
        {label}
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-center gap-2 rounded-xl border border-accent/40 bg-accent-soft/40 p-2"
    >
      {fields.map((field) => (
        <input
          key={field.name}
          type={field.type === "number" ? "text" : "text"}
          inputMode={field.type === "number" ? "numeric" : undefined}
          value={values[field.name] ?? ""}
          autoFocus={field === fields[0]}
          onChange={(e) => {
            setValues((v) => ({ ...v, [field.name]: e.target.value }));
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") reset();
          }}
          placeholder={field.placeholder}
          aria-label={field.placeholder}
          className={`${field.width ?? "min-w-[10rem] flex-1"} rounded-lg border border-line bg-panel px-3 py-1.5 text-sm text-text placeholder:text-mute/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25`}
        />
      ))}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent-deep px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-accent disabled:opacity-60"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg px-2 py-1.5 text-sm text-mute hover:text-accent-deep"
      >
        Cancel
      </button>

      {error && (
        <p role="alert" className="w-full text-xs text-rose-600">
          {error}
        </p>
      )}
    </form>
  );
}
