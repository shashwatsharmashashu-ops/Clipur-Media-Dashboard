/**
 * URL normalization for clip de-duplication.
 *
 * Two clip links pointing at the same post must count once. Normalization
 * lowercases the host, drops the query string and fragment, strips a trailing
 * slash, and removes a leading "www.".
 */
export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  // Tolerate pasted links without a scheme.
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withScheme);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${host}${path}`.toLowerCase();
  } catch {
    // Not a parseable URL — fall back to a stable lowercase form so identical
    // pasted strings still de-duplicate.
    return trimmed.toLowerCase().replace(/[?#].*$/, "").replace(/\/+$/, "");
  }
}

/** Cheap validity gate for pasted links. */
export function isProbablyUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed || /\s/.test(trimmed)) return false;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withScheme);
    return parsed.hostname.includes(".");
  } catch {
    return false;
  }
}

/**
 * Splits a pasted blob into candidate links.
 *
 * Admins paste from spreadsheets, chat messages and notes, so entries arrive
 * separated by newlines, commas, or plain whitespace — all three are accepted.
 * Order is preserved so the first occurrence of a repeated link is the one
 * that gets kept.
 */
export function parseUrlList(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}
