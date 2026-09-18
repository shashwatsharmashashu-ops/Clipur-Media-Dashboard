import { badRequest, json, withAdmin } from "@/lib/api";
import { getDayAccounts, getMonthCalendar, listDailyScopes } from "@/lib/daily";
import { currentMonth, isIsoDate } from "@/lib/date";

const MONTH_RE = /^\d{4}-\d{2}$/;

/**
 * A month of daily history.
 *
 * `?month=YYYY-MM` selects the month (defaults to the current one).
 * `?accountsFor=YYYY-MM-DD` adds the per-account X breakdown for that date.
 */
export async function GET(request: Request) {
  return withAdmin(() => {
    const url = new URL(request.url);
    const month = url.searchParams.get("month") ?? currentMonth();
    if (!MONTH_RE.test(month)) return badRequest("Month must be YYYY-MM.");

    const accountsFor = url.searchParams.get("accountsFor");
    if (accountsFor && !isIsoDate(accountsFor)) {
      return badRequest("accountsFor must be YYYY-MM-DD.");
    }

    return json({
      calendar: getMonthCalendar(month),
      scopes: listDailyScopes(),
      accounts: accountsFor ? getDayAccounts(accountsFor) : null,
    });
  });
}
