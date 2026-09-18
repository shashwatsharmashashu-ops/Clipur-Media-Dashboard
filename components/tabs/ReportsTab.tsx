"use client";

import { useMemo } from "react";
import { formatDate } from "@/lib/format";
import { useData } from "@/components/providers/DataProvider";
import EditableText from "@/components/shared/EditableText";
import DeleteButton from "@/components/shared/DeleteButton";
import InlineAddForm from "@/components/shared/InlineAddForm";

/** Weekly report feed, newest first. Every field is editable in place. */
export default function ReportsTab() {
  const { state, createReport, updateReport, deleteReport } = useData();

  const ordered = useMemo(
    () => [...state.reports].sort((a, b) => b.postedDate.localeCompare(a.postedDate)),
    [state.reports],
  );

  return (
    <section>
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-text">Reports</h2>
        <p className="mt-1 max-w-2xl text-sm text-mute">
          Weekly write-ups from the media team, newest first.
        </p>
      </div>

      {ordered.length === 0 ? (
        <p className="mb-5 rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center text-sm text-mute">
          No reports posted yet.
        </p>
      ) : (
        <ol className="mb-5 space-y-4">
          {ordered.map((report, index) => (
            <li
              key={report.id}
              className="rounded-2xl border border-line bg-panel p-5 shadow-[var(--shadow-card)]"
            >
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="flex flex-1 items-center gap-2 text-base font-semibold text-text">
                  <EditableText
                    value={report.week}
                    onCommit={(week) => void updateReport(report.id, { week })}
                    ariaLabel="Report week"
                  />
                  {index === 0 && (
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-deep">
                      Latest
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  <time dateTime={report.postedDate} className="text-xs tabular-nums text-mute">
                    Posted {formatDate(report.postedDate)}
                  </time>
                  <DeleteButton
                    onConfirm={() => void deleteReport(report.id)}
                    label={`report ${report.week}`}
                    size="sm"
                  />
                </div>
              </div>

              <EditableText
                value={report.summary}
                onCommit={(summary) => void updateReport(report.id, { summary })}
                ariaLabel="Report summary"
                multiline
                placeholder="Add a summary…"
                className="block w-full text-sm leading-relaxed text-mute"
                inputClassName="text-sm leading-relaxed"
              />
            </li>
          ))}
        </ol>
      )}

      <InlineAddForm
        label="Add weekly report"
        submitLabel="Post report"
        fields={[
          { name: "week", placeholder: "Week label" },
          { name: "summary", placeholder: "Summary", required: false },
          { name: "postedDate", placeholder: "YYYY-MM-DD", required: false, width: "w-36" },
        ]}
        onSubmit={async (values) => {
          await createReport({
            week: values.week,
            summary: values.summary,
            postedDate: /^\d{4}-\d{2}-\d{2}$/.test(values.postedDate ?? "")
              ? values.postedDate
              : undefined,
          });
        }}
      />
    </section>
  );
}
