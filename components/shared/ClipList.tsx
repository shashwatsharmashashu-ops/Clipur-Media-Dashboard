"use client";

import { useState } from "react";
import type { Clip, ClipOwnerType } from "@/lib/types";
import { formatViews, prettyUrl } from "@/lib/format";
import { todayIso } from "@/lib/date";
import { useShowViews } from "@/components/providers/ViewsProvider";
import { useData } from "@/components/providers/DataProvider";
import { useToast } from "@/components/providers/ToastProvider";
import DeleteButton from "./DeleteButton";
import ClipDate from "./ClipDate";
import BulkClipForm from "./BulkClipForm";

/**
 * The clip log. Logging a clip is one action: paste the link.
 *
 * The server appends it, adds exactly one to the owner's posted count, and
 * stamps it with a date (today by default) so it counts toward that day's
 * progress. A link that normalizes to one already logged here is refused, so
 * the same post can never be counted twice. Any admin can add or remove clips
 * and change a clip's date to backfill an earlier day.
 *
 * View counts are muted reference text and appear only when the global
 * Show-views toggle is on.
 */
export default function ClipList({
  clips,
  ownerType,
  ownerId,
  ownerLabel,
}: {
  clips: Clip[];
  ownerType: ClipOwnerType;
  ownerId: string;
  ownerLabel: string;
}) {
  const showViews = useShowViews();
  const { addClip, removeClip, updateClip } = useData();
  const { showToast } = useToast();

  const [url, setUrl] = useState("");
  const [date, setDate] = useState(todayIso);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ kind: "error" | "duplicate"; text: string } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [bulk, setBulk] = useState(false);

  const VISIBLE = 5;
  const ordered = [...clips].reverse(); // newest first
  const shown = expanded ? ordered : ordered.slice(0, VISIBLE);

  async function submit() {
    const trimmed = url.trim();
    if (!trimmed) {
      setNotice({ kind: "error", text: "Paste a clip link first." });
      return;
    }

    setPending(true);
    const result = await addClip(ownerType, ownerId, { url: trimmed, clipDate: date });
    setPending(false);

    if (result.ok) {
      setUrl("");
      setNotice(null);
      showToast(
        date === todayIso()
          ? `Clip logged · +1 post for ${ownerLabel}`
          : `Clip logged on ${date} · +1 post for ${ownerLabel}`,
      );
      return;
    }

    if (result.duplicate) {
      setNotice({ kind: "duplicate", text: "Already logged — not counted again." });
      return;
    }
    setNotice({ kind: "error", text: result.error ?? "Could not log that clip." });
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-mute">Clips</h4>
        <span className="text-xs tabular-nums text-mute">{clips.length} logged</span>
      </div>

      {clips.length > 0 ? (
        <>
          <ul className="mb-2 divide-y divide-line overflow-hidden rounded-xl border border-line">
            {shown.map((clip) => (
              <li
                key={clip.id}
                className="group flex items-center justify-between gap-2 bg-panel px-3 py-2 transition-colors hover:bg-surface"
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

                <ClipDate
                  value={clip.clipDate}
                  label={clip.label || clip.url}
                  onCommit={(clipDate) => void updateClip(clip.id, { clipDate })}
                />

                {showViews && typeof clip.views === "number" && (
                  <span className="shrink-0 text-xs tabular-nums text-mute">
                    {formatViews(clip.views)} views
                    {clip.viewsSource === "api" && <span className="ml-1 opacity-60">· auto</span>}
                  </span>
                )}

                <DeleteButton
                  size="sm"
                  label="clip"
                  className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                  onConfirm={() => void removeClip(clip.id)}
                />
              </li>
            ))}
          </ul>

          {ordered.length > VISIBLE && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mb-3 text-xs font-medium text-mute hover:text-accent-deep"
            >
              {expanded ? "Show fewer" : `Show all ${ordered.length}`}
            </button>
          )}
        </>
      ) : (
        <p className="mb-3 rounded-xl border border-dashed border-line bg-surface px-3 py-3 text-sm text-mute">
          No clips logged yet.
        </p>
      )}

      {bulk ? (
        <BulkClipForm
          ownerType={ownerType}
          ownerId={ownerId}
          ownerLabel={ownerLabel}
          onDone={() => setBulk(false)}
        />
      ) : (
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="url"
          value={url}
          disabled={pending}
          onChange={(e) => {
            setUrl(e.target.value);
            setNotice(null);
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            void submit();
          }}
          placeholder="Paste clip link"
          aria-label={`Paste a clip link for ${ownerLabel}`}
          className="min-w-[11rem] flex-1 rounded-lg border border-line bg-panel px-3 py-2 text-sm text-text placeholder:text-mute/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:opacity-60"
        />
        {/* Defaults to today; change it to log against an earlier day. */}
        <input
          type="date"
          value={date}
          disabled={pending}
          onChange={(e) => setDate(e.target.value || todayIso())}
          aria-label="Day this clip counts toward"
          title="Day this clip counts toward"
          className="w-[9rem] rounded-lg border border-line bg-panel px-2 py-2 text-sm text-mute focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:opacity-60"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => void submit()}
          className="rounded-lg bg-accent-deep px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
        >
          {pending ? "Adding…" : "Log clip"}
        </button>
        <button
          type="button"
          onClick={() => {
            setBulk(true);
            setNotice(null);
          }}
          className="text-xs font-medium text-mute underline-offset-2 hover:text-accent-deep hover:underline"
        >
          Paste multiple
        </button>
      </div>
      )}

      {notice && (
        <p
          role="status"
          className={`mt-2 text-xs ${
            notice.kind === "duplicate" ? "text-mute" : "text-rose-600"
          }`}
        >
          {notice.text}
        </p>
      )}
    </div>
  );
}
