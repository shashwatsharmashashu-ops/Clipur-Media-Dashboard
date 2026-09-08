import type { StrategyStatus, TrackedStatus } from "@/lib/types";

type AnyStatus = TrackedStatus | StrategyStatus;

const LABELS: Record<AnyStatus, string> = {
  ongoing: "Ongoing",
  upcoming: "Upcoming",
  completed: "Completed",
  in_discussion: "In discussion",
  concluded: "Concluded",
};

const STYLES: Record<AnyStatus, string> = {
  ongoing: "bg-accent-soft text-accent-deep border-accent/30",
  upcoming: "bg-surface text-mute border-line",
  completed: "bg-white text-accent-deep border-accent-deep/30",
  in_discussion: "bg-surface text-mute border-line",
  concluded: "bg-white text-accent-deep border-accent-deep/30",
};

export function statusLabel(status: AnyStatus): string {
  return LABELS[status];
}

export default function StatusBadge({ status }: { status: AnyStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${
          status === "ongoing" ? "bg-accent" : "bg-current opacity-50"
        }`}
      />
      {LABELS[status]}
    </span>
  );
}
