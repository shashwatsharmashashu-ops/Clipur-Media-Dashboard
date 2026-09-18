"use client";

import { useState } from "react";
import type { CalendarDay, DayAccountProgress, DayScopeProgress } from "@/lib/types";
import { dayLabel } from "@/lib/date";
import { progressPercent } from "@/lib/format";
import DayScopeRow from "./DayScopeRow";

/**
 * The selected date's progress: every X niche against its daily target, then
 * Instagram and TikTok against theirs, with an optional per-account breakdown
 * for X underneath.
 */
export default function DayDetail({
  day,
  today,
  accounts,
  onTargetChange,
}: {
  day: CalendarDay | null;
  today: string;
  accounts: DayAccountProgress[] | null;
  onTargetChange: (scope: DayScopeProgress, target: number) => void;
}) {
  const [showAccounts, setShowAccounts] = useState(false);

  if (!day) {
    return (
      <p className="rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center text-sm text-mute">
        Pick a date to see that day&apos;s progress.
      </p>
    );
  }

  const xScopes = day.scopes.filter((scope) => scope.platform === "x");
  const otherScopes = day.scopes.filter((scope) => scope.platform !== "x");
  const percent = progressPercent(day.count, day.target);
  const isToday = day.date === today;
  const isFuture = day.date > today;

  return (
    <div>
      <div className="mb-4 rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
              {isToday ? "Today · updates live" : isFuture ? "Upcoming" : "Recorded day"}
            </p>
            <h3 className="text-lg font-semibold text-text">{dayLabel(day.date)}</h3>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold tabular-nums text-text">
              {day.count}
              <span className="text-mute"> / {day.target}</span>
            </p>
            <p className="text-xs tabular-nums text-mute">{percent}% of the day&apos;s target</p>
          </div>
        </div>

        <div
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-accent-soft"
          role="progressbar"
          aria-valuenow={day.count}
          aria-valuemin={0}
          aria-valuemax={day.target}
          aria-label={`All platforms on ${day.date}: ${day.count} of ${day.target}`}
        >
          <div
            className="progress-fill h-full rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-mute">
        X · by niche
      </h4>
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        {xScopes.map((scope) => (
          <DayScopeRow
            key={`${scope.scopeType}:${scope.scopeId}`}
            scope={scope}
            onTargetChange={(target) => onTargetChange(scope, target)}
          />
        ))}
      </div>

      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-mute">
        Instagram &amp; TikTok
      </h4>
      <div className="grid gap-3 sm:grid-cols-2">
        {otherScopes.map((scope) => (
          <DayScopeRow
            key={`${scope.scopeType}:${scope.scopeId}`}
            scope={scope}
            onTargetChange={(target) => onTargetChange(scope, target)}
          />
        ))}
      </div>

      {accounts && accounts.length > 0 && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setShowAccounts((v) => !v)}
            className="text-xs font-medium text-mute hover:text-accent-deep"
          >
            {showAccounts ? "Hide" : "Show"} per-account breakdown for X
          </button>

          {showAccounts && (
            <ul className="mt-2 divide-y divide-line overflow-hidden rounded-xl border border-line">
              {accounts.map((account) => (
                <li
                  key={account.accountId}
                  className="flex items-center justify-between gap-3 bg-panel px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate text-text">{account.handle}</span>
                  <span className="shrink-0 text-xs text-mute">{account.nicheName}</span>
                  <span className="w-10 shrink-0 text-right tabular-nums text-text">
                    {account.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
