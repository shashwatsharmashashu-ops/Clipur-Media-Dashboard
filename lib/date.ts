/**
 * Calendar-date helpers.
 *
 * Clip dates are plain `YYYY-MM-DD` strings in local time, never timestamps —
 * a clip belongs to a day, not to an instant. Parsing always goes through
 * `parseIsoDate` so a date string is never read as UTC midnight and shifted
 * into the previous day.
 */

export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && ISO_DATE_RE.test(value);
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

/** Parses `YYYY-MM-DD` as a local date at midnight. */
export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(iso: string, delta: number): string {
  const date = parseIsoDate(iso);
  date.setDate(date.getDate() + delta);
  return toIsoDate(date);
}

/* ------------------------------------------------------------------ months */

/** `YYYY-MM` for the month containing the given ISO date. */
export function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

export function currentMonth(): string {
  return monthOf(todayIso());
}

export function addMonths(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Inclusive first and last ISO date of a `YYYY-MM` month. */
export function monthBounds(month: string): { start: string; end: string } {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(year, monthNumber - 1, 1);
  const end = new Date(year, monthNumber, 0);
  return { start: toIsoDate(start), end: toIsoDate(end) };
}

export interface GridDay {
  date: string;
  inMonth: boolean;
}

/**
 * The days to render in a month grid, padded to whole Monday-start weeks so
 * the calendar is always a clean rectangle.
 */
export function monthGrid(month: string): GridDay[] {
  const { start, end } = monthBounds(month);
  const first = parseIsoDate(start);
  const last = parseIsoDate(end);

  // getDay(): 0 = Sunday. Shift so Monday is the first column.
  const leading = (first.getDay() + 6) % 7;
  const trailing = 6 - ((last.getDay() + 6) % 7);

  const days: GridDay[] = [];
  for (let i = leading; i > 0; i--) days.push({ date: addDays(start, -i), inMonth: false });
  for (let d = start; d <= end; d = addDays(d, 1)) days.push({ date: d, inMonth: true });
  for (let i = 1; i <= trailing; i++) days.push({ date: addDays(end, i), inMonth: false });

  return days;
}

/* --------------------------------------------------------------- rendering */

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function monthLabel(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function dayLabel(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function dayNumber(iso: string): number {
  return parseIsoDate(iso).getDate();
}
