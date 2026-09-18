"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  AdminUser,
  CalendarMonth,
  ClipOwnerType,
  DailyScope,
  DailyScopeType,
  DashboardState,
  DayAccountProgress,
} from "@/lib/types";
import { useToast } from "./ToastProvider";

/**
 * Client-side access to the shared store.
 *
 * Every mutation posts to an API route and replaces local state with the
 * authoritative state the server returns, so two admins editing at once
 * converge instead of drifting. State also refreshes when the tab regains
 * focus, which is how one admin picks up another's edits.
 */

interface MutationResult {
  ok: boolean;
  duplicate?: boolean;
  error?: string;
  /** The raw server payload, for callers that need more than ok/error. */
  data?: Record<string, unknown>;
}

/** What a bulk paste did, so the admin can be told the counts. */
export interface BulkAddSummary {
  added: number;
  duplicates: number;
  invalid: number;
  invalidSamples: string[];
  total: number;
}

interface DataContextValue {
  state: DashboardState;
  user: AdminUser;
  busy: boolean;
  refresh: () => Promise<void>;

  addClip: (
    ownerType: ClipOwnerType,
    ownerId: string,
    input: { url: string; label?: string; clipDate?: string },
  ) => Promise<MutationResult>;
  removeClip: (clipId: string) => Promise<MutationResult>;
  /** Logs many pasted links at once; returns what was added and skipped. */
  addClipsBulk: (
    ownerType: ClipOwnerType,
    ownerId: string,
    input: { urls: string; clipDate?: string },
  ) => Promise<{ ok: boolean; error?: string; summary?: BulkAddSummary }>;
  updateClip: (
    clipId: string,
    patch: { label?: string | null; views?: number | null; clipDate?: string },
  ) => Promise<MutationResult>;

  /** Loads a month of daily history, plus the optional per-account breakdown. */
  loadCalendar: (
    month: string,
    accountsFor?: string,
  ) => Promise<{ calendar: CalendarMonth; scopes: DailyScope[]; accounts: DayAccountProgress[] | null } | null>;
  /** With a date, corrects that day only; without, sets the standing target. */
  setDailyTarget: (input: {
    scopeType: DailyScopeType;
    scopeId: string;
    target: number;
    date?: string;
  }) => Promise<MutationResult>;

  createNiche: (name: string) => Promise<MutationResult>;
  updateNiche: (id: string, patch: { name?: string }) => Promise<MutationResult>;
  deleteNiche: (id: string) => Promise<MutationResult>;

  createAccount: (input: {
    nicheId: string;
    handle: string;
    postsTarget?: number;
  }) => Promise<MutationResult>;
  updateAccount: (
    id: string,
    patch: { handle?: string; postsTarget?: number; postsMade?: number; status?: string },
  ) => Promise<MutationResult>;
  deleteAccount: (id: string) => Promise<MutationResult>;

  createItem: (input: {
    kind: "campaign" | "platform";
    platform?: string;
    groupName?: string;
    name: string;
    postsTarget?: number;
    status?: string;
  }) => Promise<MutationResult>;
  updateItem: (
    id: string,
    patch: {
      name?: string;
      groupName?: string;
      postsTarget?: number;
      postsMade?: number;
      status?: string;
    },
  ) => Promise<MutationResult>;
  deleteItem: (id: string) => Promise<MutationResult>;

  createStrategy: (input: {
    title: string;
    description?: string;
    status?: string;
    platform?: string;
  }) => Promise<MutationResult>;
  updateStrategy: (
    id: string,
    patch: {
      title?: string;
      description?: string;
      status?: string;
      selected?: boolean;
      report?: { reach?: string; topClip?: string; verdict?: string } | null;
    },
  ) => Promise<MutationResult>;
  deleteStrategy: (id: string) => Promise<MutationResult>;

  createReport: (input: {
    week: string;
    summary?: string;
    postedDate?: string;
  }) => Promise<MutationResult>;
  updateReport: (
    id: string,
    patch: { week?: string; summary?: string; postedDate?: string },
  ) => Promise<MutationResult>;
  deleteReport: (id: string) => Promise<MutationResult>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({
  initialState,
  user,
  children,
}: {
  initialState: DashboardState;
  user: AdminUser;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<DashboardState>(initialState);
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  /** One code path for every write. Returns the server's fresh state. */
  const mutate = useCallback(
    async (
      path: string,
      method: "POST" | "PATCH" | "DELETE",
      body?: unknown,
      options?: { silent?: boolean },
    ): Promise<MutationResult> => {
      setBusy(true);
      try {
        const response = await fetch(path, {
          method,
          headers: body ? { "Content-Type": "application/json" } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        });

        if (response.status === 401) {
          window.location.href = "/login";
          return { ok: false, error: "Session expired." };
        }

        const payload = await response.json().catch(() => ({}));
        if (payload?.state) setState(payload.state as DashboardState);

        if (!response.ok) {
          const error = payload?.error ?? "Something went wrong.";
          if (!options?.silent) showToast(error, "error");
          return { ok: false, error, duplicate: Boolean(payload?.duplicate), data: payload };
        }

        return { ok: true, data: payload };
      } catch {
        const error = "Could not reach the server.";
        if (!options?.silent) showToast(error, "error");
        return { ok: false, error };
      } finally {
        setBusy(false);
      }
    },
    [showToast],
  );

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/state", { cache: "no-store" });
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      const payload = await response.json();
      if (payload?.state) setState(payload.state as DashboardState);
    } catch {
      // A failed background refresh is not worth interrupting anyone over.
    }
  }, []);

  // Pick up other admins' edits when the tab comes back to the foreground.
  useEffect(() => {
    function onFocus() {
      void refresh();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const value = useMemo<DataContextValue>(
    () => ({
      state,
      user,
      busy,
      refresh,

      addClip: (ownerType, ownerId, input) =>
        mutate("/api/clips", "POST", { ownerType, ownerId, ...input }, { silent: true }),
      removeClip: (clipId) => mutate(`/api/clips/${clipId}`, "DELETE"),
      addClipsBulk: async (ownerType, ownerId, input) => {
        const result = await mutate(
          "/api/clips/bulk",
          "POST",
          { ownerType, ownerId, ...input },
          { silent: true },
        );
        return {
          ok: result.ok,
          error: result.error,
          summary: result.data?.summary as BulkAddSummary | undefined,
        };
      },
      updateClip: (clipId, patch) => mutate(`/api/clips/${clipId}`, "PATCH", patch),

      loadCalendar: async (month, accountsFor) => {
        const query = new URLSearchParams({ month });
        if (accountsFor) query.set("accountsFor", accountsFor);
        try {
          const response = await fetch(`/api/calendar?${query}`, { cache: "no-store" });
          if (response.status === 401) {
            window.location.href = "/login";
            return null;
          }
          if (!response.ok) return null;
          return await response.json();
        } catch {
          return null;
        }
      },
      setDailyTarget: (input) => mutate("/api/daily-targets", "PATCH", input),

      createNiche: (name) => mutate("/api/niches", "POST", { name, platform: "x" }),
      updateNiche: (id, patch) => mutate(`/api/niches/${id}`, "PATCH", patch),
      deleteNiche: (id) => mutate(`/api/niches/${id}`, "DELETE"),

      createAccount: (input) => mutate("/api/accounts", "POST", input),
      updateAccount: (id, patch) => mutate(`/api/accounts/${id}`, "PATCH", patch),
      deleteAccount: (id) => mutate(`/api/accounts/${id}`, "DELETE"),

      createItem: (input) => mutate("/api/items", "POST", input),
      updateItem: (id, patch) => mutate(`/api/items/${id}`, "PATCH", patch),
      deleteItem: (id) => mutate(`/api/items/${id}`, "DELETE"),

      createStrategy: (input) => mutate("/api/strategies", "POST", input),
      updateStrategy: (id, patch) => mutate(`/api/strategies/${id}`, "PATCH", patch),
      deleteStrategy: (id) => mutate(`/api/strategies/${id}`, "DELETE"),

      createReport: (input) => mutate("/api/reports", "POST", input),
      updateReport: (id, patch) => mutate(`/api/reports/${id}`, "PATCH", patch),
      deleteReport: (id) => mutate(`/api/reports/${id}`, "DELETE"),
    }),
    [state, user, busy, refresh, mutate],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}
