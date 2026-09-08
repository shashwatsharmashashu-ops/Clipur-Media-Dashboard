"use client";

import { useState } from "react";
import type { Clip } from "@/lib/types";
import { formatViews, prettyUrl } from "@/lib/format";
import { useShowViews } from "@/components/providers/ViewsProvider";

/**
 * The clip log for a tracked item. Paste a url (+ optional label) to append.
 *
 * Clips with no views are entirely normal and render identically to clips
 * with views when the global Show-views toggle is off. View counts are muted
 * reference text — never a score, never a ranking here.
 */
export default function ClipList({
  clips,
  onAddClip,
}: {
  clips: Clip[];
  onAddClip: (input: { url: string; label?: string; views?: number | null }) => void;
}) {
  const showViews = useShowViews();
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [views, setViews] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Paste a clip url first.");
      return;
    }

    const parsedViews = views.trim() === "" ? null : Number(views.replace(/[,\s]/g, ""));
    if (parsedViews !== null && !Number.isFinite(parsedViews)) {
      setError("Views must be a number, or left blank.");
      return;
    }

    onAddClip({
      url: trimmed,
      label: label.trim() || undefined,
      views: parsedViews,
    });

    setUrl("");
    setLabel("");
    setViews("");
    setError(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    submit();
  }

  /** Enter submits from any field. preventDefault first, so the native
      implicit submission cannot fire a second time. */
  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    submit();
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-mute">
          Clips
        </h4>
        <span className="text-xs tabular-nums text-mute">
          {clips.length} logged
        </span>
      </div>

      {clips.length > 0 ? (
        <ul className="mb-3 divide-y divide-line overflow-hidden rounded-xl border border-line">
          {clips.map((clip) => (
            <li
              key={clip.id}
              className="flex items-center justify-between gap-3 bg-panel px-3 py-2.5 transition-colors hover:bg-surface"
            >
              <a
                href={clip.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-sm text-text hover:text-accent-deep hover:underline"
                title={clip.url}
              >
                {clip.label || prettyUrl(clip.url)}
              </a>

              {showViews && typeof clip.views === "number" && (
                <span className="shrink-0 text-xs tabular-nums text-mute">
                  {formatViews(clip.views)} views
                  {clip.viewsSource === "api" && (
                    <span className="ml-1 opacity-60">· auto</span>
                  )}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 rounded-xl border border-dashed border-line bg-surface px-3 py-4 text-sm text-mute">
          No clips logged yet.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-wrap items-start gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Paste clip url"
          aria-label="Clip url"
          className="min-w-[12rem] flex-[2] rounded-lg border border-line bg-panel px-3 py-2 text-sm text-text placeholder:text-mute/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        />
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Label (optional)"
          aria-label="Clip label, optional"
          className="min-w-[9rem] flex-1 rounded-lg border border-line bg-panel px-3 py-2 text-sm text-text placeholder:text-mute/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        />
        {/* Manual views entry only surfaces when views are being shown at all.
            A future API provider fills this field instead. */}
        {showViews && (
          <input
            type="text"
            inputMode="numeric"
            value={views}
            onChange={(e) => setViews(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Views (optional)"
            aria-label="Views, optional reference"
            className="w-32 rounded-lg border border-line bg-panel px-3 py-2 text-sm text-text placeholder:text-mute/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          />
        )}
        <button
          type="submit"
          className="rounded-lg bg-accent-deep px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          Add clip
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-2 text-xs text-accent-deep">
          {error}
        </p>
      )}
    </div>
  );
}
