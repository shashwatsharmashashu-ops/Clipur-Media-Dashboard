/**
 * App-level configuration.
 *
 * CONTENT_FOLDER_URL — the shared drive folder the media team works out of.
 * Swap the placeholder for the real link (or wire it to an env var).
 */
export const CONTENT_FOLDER_URL =
  process.env.NEXT_PUBLIC_CONTENT_FOLDER_URL ?? "REPLACE_WITH_DRIVE_URL";

export const APP_NAME = "Clipur · Media Command";

/** Views default to hidden everywhere. Output is the KPI, not views. */
export const SHOW_VIEWS_DEFAULT = false;
