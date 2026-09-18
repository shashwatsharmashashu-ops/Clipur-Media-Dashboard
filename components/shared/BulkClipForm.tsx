"use client";

import { useState } from "react";
import type { ClipOwnerType } from "@/lib/types";
import { todayIso } from "@/lib/date";
import { parseUrlList } from "@/lib/url";
import { useData, type BulkAddSummary } from "@/components/providers/DataProvider";
import { useToast } from "@/components/providers/ToastProvider";

/**
 * Paste many links at once.
 *
 * Entries may be separated by newlines, commas or spaces. Each accepted link
 * becomes one clip on the chosen date and adds one to the posted count —
 * identical to a single add. Duplicates are skipped, both against stored clips
 * and within the paste itself, and the summary says exactly what happened.
 */
export default function BulkClipForm({
  ownerType,
  ownerId,
  ownerLabel,
  onDone,
}: {
  ownerType: ClipOwnerType;
  ownerId: string;
  ownerLabel: string;
  onDone: () => void;
}) {
  const { addClipsBulk } = useData();
  const { showToast } = useToast();

  const [text, setText] = useState("");
  const [date, setDate] = useState(todayIso);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<BulkAddSummary | null>(null);

  const detected = parseUrlList(text).length;

  async function submit() {
    if (detected === 0) {
      setError("Paste at least one link.");
      return;
    }

    setPending(true);
    setError(null);
    const result = await addClipsBulk(ownerType, ownerId, { urls: text, clipDate: date });
    setPending(false);

    if (!result.ok || !result.summary) {
      setError(result.error ?? "Could not log those clips.");
      return;
    }

    setSummary(result.summary);
    setText("");
    if (result.summary.added > 0) {
      showToast(
        `${result.summary.added} clip${result.summary.added === 1 ? "" : "s"} logged for ${ownerLabel}`,
      );
    }
  }

  return (
    <div className="rounded-xl border border-accent/40 bg-accent-soft/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h5 className="text-xs font-semibold uppercase tracking-wide text-accent-deep">
          Paste multiple links
        </h5>
        <button
          type="button"
          onClick={onDone}
          className="text-xs font-medium text-mute hover:text-accent-deep"
        >
          Back to single
        </button>
      </div>

      <textarea
        value={text}
        rows={5}
        disabled={pending}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
          setSummary(null);
        }}
        onKeyDown={(e) => {
          // Enter makes a new line here; Ctrl/Cmd+Enter submits.
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            void submit();
          }
        }}
        placeholder={"Paste links — one per line, or separated by commas or spaces\nhttps://x.com/…/status/1\nhttps://x.com/…/status/2"}
        aria-label={`Paste multiple clip links for ${ownerLabel}`}
        className="w-full rounded-lg border border-line bg-panel px-3 py-2 font-mono text-xs leading-relaxed text-text placeholder:text-mute/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:opacity-60"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-xs tabular-nums text-mute">
          {detected} link{detected === 1 ? "" : "s"} detected
        </span>

        <input
          type="date"
          value={date}
          disabled={pending}
          onChange={(e) => setDate(e.target.value || todayIso())}
          aria-label="Day these clips count toward"
          title="Day these clips count toward"
          className="ml-auto w-[9rem] rounded-lg border border-line bg-panel px-2 py-1.5 text-sm text-mute focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:opacity-60"
        />
        <button
          type="button"
          disabled={pending || detected === 0}
          onClick={() => void submit()}
          className="rounded-lg bg-accent-deep px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
        >
          {pending ? "Adding…" : `Log ${detected || ""} clip${detected === 1 ? "" : "s"}`.trim()}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs text-rose-600">
          {error}
        </p>
      )}

      {summary && (
        <div role="status" className="mt-2 rounded-lg border border-line bg-panel px-3 py-2">
          <p className="text-xs text-text">
            <span className="font-semibold text-accent-deep">{summary.added} added</span>
            {summary.duplicates > 0 && (
              <>
                {" · "}
                {summary.duplicates} skipped as duplicate
                {summary.duplicates === 1 ? "" : "s"}
              </>
            )}
            {summary.invalid > 0 && <> · {summary.invalid} not a valid link</>}
            {summary.duplicates === 0 && summary.invalid === 0 && <> · nothing skipped</>}
          </p>
          {summary.invalidSamples.length > 0 && (
            <p className="mt-1 truncate text-[11px] text-mute" title={summary.invalidSamples.join(" ")}>
              Ignored: {summary.invalidSamples.join(", ")}
              {summary.invalid > summary.invalidSamples.length && " …"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
