import { badRequest, json, optionalNumber, readJson, withAdmin } from "@/lib/api";
import { getMonthCalendar, listDailyScopes, setDayTarget, setStandingTarget } from "@/lib/daily";
import { isIsoDate, monthOf, todayIso } from "@/lib/date";
import type { DailyScopeType } from "@/lib/types";

/** The standing daily target for every scope. */
export async function GET() {
  return withAdmin(async () => json({ scopes: await listDailyScopes() }));
}

/**
 * Updates a daily target. Any admin may do this.
 *
 * With `date`, only that day is changed — a correction to history. Without
 * it, the standing target changes, which applies to future days and to past
 * days that never recorded a snapshot.
 */
export async function PATCH(request: Request) {
  return withAdmin(async () => {
    const body = await readJson<{
      scopeType?: string;
      scopeId?: string;
      date?: string;
      target?: unknown;
    }>(request);

    const scopeType =
      body.scopeType === "niche" || body.scopeType === "platform" ? body.scopeType : null;
    const scopeId = (body.scopeId ?? "").trim();
    const target = optionalNumber(body.target);

    if (!scopeType || !scopeId) return badRequest("A target scope is required.");
    if (target === undefined || target < 0) return badRequest("Target must be zero or more.");

    if (body.date !== undefined) {
      if (!isIsoDate(body.date)) return badRequest("Date must be YYYY-MM-DD.");
      await setDayTarget(scopeType as DailyScopeType, scopeId, body.date, target);
      return json({
        scopes: await listDailyScopes(),
        calendar: await getMonthCalendar(monthOf(body.date)),
      });
    }

    await setStandingTarget(scopeType as DailyScopeType, scopeId, target);
    return json({
      scopes: await listDailyScopes(),
      calendar: await getMonthCalendar(monthOf(todayIso())),
    });
  });
}
