/**
 * App-level configuration.
 *
 * CONTENT_FOLDER_URL — the shared drive folder the media team works out of.
 * Set NEXT_PUBLIC_CONTENT_FOLDER_URL to point a deployment somewhere else
 * without touching this file.
 */
export const CONTENT_FOLDER_URL =
  process.env.NEXT_PUBLIC_CONTENT_FOLDER_URL ??
  "https://drive.google.com/drive/folders/1y-sILJOCzKw03kKNUhgMgGm_v06kAYOT?usp=sharing";

export const APP_NAME = "Clipur · Media Command";

/** Views default to hidden everywhere. Output is the KPI, not views. */
export const SHOW_VIEWS_DEFAULT = false;
