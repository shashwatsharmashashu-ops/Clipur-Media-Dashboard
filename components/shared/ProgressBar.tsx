import { progressPercent } from "@/lib/format";

/**
 * The one progress metric in this product: posts made / posts target.
 *
 * Never pass views into this component. Output is the KPI; views are not.
 */
export default function ProgressBar({
  made,
  target,
  label = "Posts made",
}: {
  made: number;
  target: number;
  label?: string;
}) {
  const percent = progressPercent(made, target);
  const complete = target > 0 && made >= target;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-mute">
          {label}
        </span>
        <span className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tabular-nums text-text">
            {made}
            <span className="text-mute"> / {target}</span>
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
              complete
                ? "bg-accent-soft text-accent-deep"
                : "bg-surface text-mute"
            }`}
          >
            {percent}%
          </span>
        </span>
      </div>

      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-accent-soft"
        role="progressbar"
        aria-valuenow={made}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-label={`${label}: ${made} of ${target}`}
      >
        <div
          className="progress-fill h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
