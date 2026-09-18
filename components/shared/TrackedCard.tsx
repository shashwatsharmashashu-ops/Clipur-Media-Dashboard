"use client";

import type { Clip, ClipOwnerType, TrackedStatus } from "@/lib/types";
import ProgressBar from "./ProgressBar";
import StatusSelect from "./StatusSelect";
import EditableText from "./EditableText";
import EditableNumber from "./EditableNumber";
import DeleteButton from "./DeleteButton";
import ClipList from "./ClipList";
import PerformanceReference from "./PerformanceReference";

/**
 * One tracked unit: an X account, an IG / TikTok content item, or a client
 * campaign. Everything on it is editable in place by any signed-in admin.
 *
 * The primary metric is always postsMade / postsTarget. Views only ever appear
 * in the secondary reference block at the bottom.
 */
export default function TrackedCard({
  eyebrow,
  title,
  status,
  postsMade,
  postsTarget,
  clips,
  ownerType,
  ownerId,
  onRename,
  onStatusChange,
  onPostsMadeChange,
  onPostsTargetChange,
  onDelete,
  deleteLabel,
}: {
  eyebrow: string;
  title: string;
  status: TrackedStatus;
  postsMade: number;
  postsTarget: number;
  clips: Clip[];
  ownerType: ClipOwnerType;
  ownerId: string;
  onRename: (next: string) => void;
  onStatusChange: (next: TrackedStatus) => void;
  onPostsMadeChange: (next: number) => void;
  onPostsTargetChange: (next: number) => void;
  onDelete: () => void;
  deleteLabel: string;
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-line bg-panel p-5 shadow-[var(--shadow-card)]">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
            {eyebrow}
          </p>
          <EditableText
            value={title}
            onCommit={onRename}
            ariaLabel="Name"
            className="w-full truncate text-base font-semibold text-text"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusSelect value={status} onChange={onStatusChange} label={title} />
          <DeleteButton onConfirm={onDelete} label={deleteLabel} />
        </div>
      </header>

      <ProgressBar made={postsMade} target={postsTarget} />

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line pb-4 text-xs text-mute">
        <span className="flex items-center gap-1.5">
          Posts made
          <EditableNumber
            value={postsMade}
            onCommit={onPostsMadeChange}
            ariaLabel={`Posts made for ${title}`}
            className="font-semibold text-text"
          />
        </span>
        <span className="flex items-center gap-1.5">
          Target
          <EditableNumber
            value={postsTarget}
            onCommit={onPostsTargetChange}
            ariaLabel={`Posts target for ${title}`}
            className="font-semibold text-text"
          />
        </span>
        <span className="ml-auto opacity-70">Logging a clip adds one post</span>
      </div>

      <div className="mt-4">
        <ClipList
          clips={clips}
          ownerType={ownerType}
          ownerId={ownerId}
          ownerLabel={title}
        />
      </div>

      <PerformanceReference clips={clips} />
    </article>
  );
}
