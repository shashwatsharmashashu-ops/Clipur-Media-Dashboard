"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  CalendarMonth,
  DailyScope,
  DayAccountProgress,
  DayScopeProgress,
} from "@/lib/types";
import { addMonths, currentMonth, monthLabel, monthOf, todayIso } from "@/lib/date";
import { useData } from "@/components/providers/DataProvider";
import MonthGrid from "@/components/calendar/MonthGrid";
import DayDetail from "@/components/calendar/DayDetail";
import StandingTargets from "@/components/calendar/StandingTargets";

/**
 * Daily history. Pick any date and see that day's progress per X niche and
 * per platform against that day's target.
 *
 * Past days come from the stored record; today recomputes from live clips, so
 * it updates as clips are logged — `state` is in the effect's dependencies for
 * exactly that reason.
 */
export default function CalendarTab() {
  const { state, loadCalendar, setDailyTarget } = useData();

  const [month, setMonth] = useState(currentMonth);
  const [selected, setSelected] = useState(todayIso);
  const [calendar, setCalendar] = useState<CalendarMonth | null>(null);
  const [scopes, setScopes] = useState<DailyScope[]>([]);
  const [accounts, setAccounts] = useState<DayAccountProgress[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const payload = await loadCalendar(month, selected);
    if (!payload) {
      setLoading(false);
      return;
    }
    setCalendar(payload.calendar);
    setScopes(payload.scopes);
    setAccounts(payload.accounts);
    setLoading(false);
  }, [loadCalendar, month, selected]);

  // `state` is a dependency so logging a clip refreshes today's numbers.
  useEffect(() => {
    void load();
  }, [load, state]);

  function selectDate(date: string) {
    setSelected(date);
    // Selecting a day outside the visible month follows it there.
    if (monthOf(date) !== month) setMonth(monthOf(date));
  }

  async function changeDayTarget(scope: DayScopeProgress, target: number) {
    await setDailyTarget({
      scopeType: scope.scopeType,
      scopeId: scope.scopeId,
      target,
      date: selected,
    });
    await load();
  }

  async function changeStandingTarget(scope: DailyScope, target: number) {
    await setDailyTarget({ scopeType: scope.scopeType, scopeId: scope.scopeId, target });
    await load();
  }

  const selectedDay = calendar?.days.find((day) => day.date === selected) ?? null;
  const today = calendar?.today ?? todayIso();

  return (
    <section>
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-text">Calendar</h2>
        <p className="mt-1 max-w-3xl text-sm text-mute">
          Daily output history. Each day is measured as clips logged that day against that
          day&apos;s target — every date keeps its own permanent record.
        </p>
      </div>

      <div className="mb-6">
        <StandingTargets scopes={scopes} onChange={changeStandingTarget} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-line bg-panel p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setMonth(addMonths(month, -1))}
              aria-label="Previous month"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-mute transition-colors hover:border-accent hover:text-accent-deep"
            >
              ‹
            </button>
            <h3 className="text-sm font-semibold text-text">{monthLabel(month)}</h3>
            <button
              type="button"
              onClick={() => setMonth(addMonths(month, 1))}
              aria-label="Next month"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-mute transition-colors hover:border-accent hover:text-accent-deep"
            >
              ›
            </button>
          </div>

          <MonthGrid
            month={month}
            days={calendar?.days ?? []}
            today={today}
            selected={selected}
            onSelect={selectDate}
          />

          <button
            type="button"
            onClick={() => {
              setMonth(currentMonth());
              setSelected(todayIso());
            }}
            className="mt-3 w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-mute transition-colors hover:border-accent hover:text-accent-deep"
          >
            Jump to today
          </button>
        </div>

        <div>
          {loading && !calendar ? (
            <p className="rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center text-sm text-mute">
              Loading history…
            </p>
          ) : (
            <DayDetail
              day={selectedDay}
              today={today}
              accounts={accounts}
              onTargetChange={changeDayTarget}
            />
          )}
        </div>
      </div>
    </section>
  );
}
