import type { WeeklyReport } from "@/lib/types";
import { formatDate } from "@/lib/format";

/** Weekly report feed, newest first. */
export default function ReportsTab({ reports }: { reports: WeeklyReport[] }) {
  const ordered = [...reports].sort((a, b) => b.postedDate.localeCompare(a.postedDate));

  return (
    <section>
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-text">Reports</h2>
        <p className="mt-1 max-w-2xl text-sm text-mute">
          Weekly write-ups from the media team, newest first.
        </p>
      </div>

      {ordered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center text-sm text-mute">
          No reports posted yet.
        </p>
      ) : (
        <ol className="space-y-4">
          {ordered.map((report, index) => (
            <li
              key={report.id}
              className="rounded-2xl border border-line bg-panel p-5 shadow-[var(--shadow-card)]"
            >
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="flex items-center gap-2 text-base font-semibold text-text">
                  {report.week}
                  {index === 0 && (
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-deep">
                      Latest
                    </span>
                  )}
                </h3>
                <time
                  dateTime={report.postedDate}
                  className="text-xs tabular-nums text-mute"
                >
                  Posted {formatDate(report.postedDate)}
                </time>
              </div>
              <p className="text-sm leading-relaxed text-mute">{report.summary}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
