"use client";

import type { Platform } from "@/lib/types";

export const PLATFORM_LABELS: Record<Platform, string> = {
  x: "X",
  instagram: "Instagram",
  tiktok: "TikTok",
};

const PLATFORMS: Platform[] = ["x", "instagram", "tiktok"];

/** Sub-tabs inside Viral. Each platform runs its own strategy. */
export default function PlatformSwitch({
  active,
  onChange,
}: {
  active: Platform;
  onChange: (next: Platform) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Viral platforms"
      className="inline-flex items-center gap-1 rounded-xl border border-line bg-surface p-1"
    >
      {PLATFORMS.map((platform) => {
        const selected = platform === active;
        return (
          <button
            key={platform}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(platform)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              selected
                ? "bg-panel text-accent-deep shadow-[var(--shadow-card)]"
                : "text-mute hover:text-accent-deep"
            }`}
          >
            {PLATFORM_LABELS[platform]}
          </button>
        );
      })}
    </div>
  );
}
