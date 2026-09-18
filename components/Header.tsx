"use client";

import { APP_NAME, CONTENT_FOLDER_URL } from "@/lib/config";
import type { AdminUser } from "@/lib/types";
import ViewsToggle from "./ViewsToggle";
import AccountMenu from "./auth/AccountMenu";

/** Placeholder mark — swap for the real Clipur logo asset. */
function LogoPlaceholder() {
  return (
    <span
      aria-hidden="true"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-deep to-accent text-sm font-bold text-white shadow-[var(--shadow-card)]"
    >
      C
    </span>
  );
}

export default function Header({ user }: { user: AdminUser }) {
  const folderConfigured = CONTENT_FOLDER_URL !== "REPLACE_WITH_DRIVE_URL";

  return (
    <header className="border-b border-line bg-panel/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoPlaceholder />
            <div>
              <p className="text-base font-semibold leading-tight text-text">{APP_NAME}</p>
              <p className="text-xs text-mute">Output tracker · posts made against target</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={CONTENT_FOLDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!folderConfigured}
              title={
                folderConfigured
                  ? "Open the shared content folder"
                  : "Set CONTENT_FOLDER_URL in lib/config.ts"
              }
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                folderConfigured
                  ? "border-accent/40 bg-accent-soft text-accent-deep hover:bg-accent hover:text-white"
                  : "border-dashed border-line bg-surface text-mute hover:border-accent hover:text-accent-deep"
              }`}
            >
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              >
                <path d="M2.5 5.5A1.5 1.5 0 0 1 4 4h3.4l1.6 2H16a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 16 16H4a1.5 1.5 0 0 1-1.5-1.5v-9Z" />
              </svg>
              Content Folder
              {!folderConfigured && <span className="text-[11px] opacity-70">· not set</span>}
            </a>

            <ViewsToggle />
            <AccountMenu user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}
