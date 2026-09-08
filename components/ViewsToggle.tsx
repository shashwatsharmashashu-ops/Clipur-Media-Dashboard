"use client";

import { useViewsVisibility } from "@/components/providers/ViewsProvider";

/**
 * The single global gate for view counts. Default off.
 *
 * Views are reference data only — this toggle exists so the dashboard can be
 * read purely as an output tracker, which is how the team is measured.
 */
export default function ViewsToggle() {
  const { showViews, toggleViews } = useViewsVisibility();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={showViews}
      onClick={toggleViews}
      className="inline-flex items-center gap-2.5 rounded-full border border-line bg-panel px-3 py-1.5 text-sm text-mute transition-colors hover:border-accent hover:text-accent-deep focus:outline-none focus:ring-2 focus:ring-accent/30"
    >
      <span
        aria-hidden="true"
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          showViews ? "bg-accent-deep" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
            showViews ? "left-[1.125rem]" : "left-0.5"
          }`}
        />
      </span>
      <span className="font-medium">Show views</span>
      <span className="text-xs opacity-70">{showViews ? "On" : "Off"}</span>
    </button>
  );
}
