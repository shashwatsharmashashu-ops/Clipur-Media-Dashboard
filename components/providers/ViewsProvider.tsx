"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { SHOW_VIEWS_DEFAULT } from "@/lib/config";

/**
 * Global visibility switch for view counts.
 *
 * Views are reference data, not a KPI. This context is the single gate: every
 * place that could render a view count asks `useShowViews()` first, so one
 * toggle removes them from the entire dashboard.
 */
interface ViewsVisibilityValue {
  showViews: boolean;
  toggleViews: () => void;
  setShowViews: (next: boolean) => void;
}

const ViewsVisibilityContext = createContext<ViewsVisibilityValue | null>(null);

export function ViewsVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [showViews, setShowViews] = useState(SHOW_VIEWS_DEFAULT);

  const toggleViews = useCallback(() => setShowViews((v) => !v), []);

  const value = useMemo(
    () => ({ showViews, toggleViews, setShowViews }),
    [showViews, toggleViews],
  );

  return (
    <ViewsVisibilityContext.Provider value={value}>
      {children}
    </ViewsVisibilityContext.Provider>
  );
}

export function useViewsVisibility(): ViewsVisibilityValue {
  const ctx = useContext(ViewsVisibilityContext);
  if (!ctx) {
    throw new Error("useViewsVisibility must be used inside <ViewsVisibilityProvider>");
  }
  return ctx;
}

/** Convenience read for the common case. */
export function useShowViews(): boolean {
  return useViewsVisibility().showViews;
}
