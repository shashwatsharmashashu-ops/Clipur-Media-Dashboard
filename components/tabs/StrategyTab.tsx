"use client";

import { useMemo, useState } from "react";
import type { Strategy, StrategyStatus } from "@/lib/types";
import FilterBar, { type FilterOption } from "@/components/shared/FilterBar";
import StrategyCard from "./StrategyCard";
import StrategyReportModal from "./StrategyReportModal";

type StrategyFilterValue = StrategyStatus | "all";

const FILTERS: FilterOption<StrategyFilterValue>[] = [
  { value: "ongoing", label: "Ongoing" },
  { value: "in_discussion", label: "In discussion" },
  { value: "concluded", label: "Concluded" },
  { value: "all", label: "All" },
];

export default function StrategyTab({
  strategies,
  onSelect,
}: {
  strategies: Strategy[];
  onSelect: (id: string) => void;
}) {
  const [filter, setFilter] = useState<StrategyFilterValue>("ongoing");
  const [openReportId, setOpenReportId] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      ongoing: strategies.filter((s) => s.status === "ongoing").length,
      in_discussion: strategies.filter((s) => s.status === "in_discussion").length,
      concluded: strategies.filter((s) => s.status === "concluded").length,
      all: strategies.length,
    }),
    [strategies],
  );

  const visible = useMemo(
    () =>
      filter === "all"
        ? strategies
        : strategies.filter((strategy) => strategy.status === filter),
    [strategies, filter],
  );

  // Read the live object so a re-select while open stays in sync.
  const openReport = strategies.find((s) => s.id === openReportId) ?? null;

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text">Strategy</h2>
          <p className="mt-1 max-w-2xl text-sm text-mute">
            Plays the team is running, debating, or has closed out. Note one for the
            founders to flag it as worth backing.
          </p>
        </div>
        <FilterBar
          options={FILTERS}
          value={filter}
          onChange={setFilter}
          counts={counts}
          ariaLabel="Filter strategies by status"
        />
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center text-sm text-mute">
          No strategies in this state.
        </p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {visible.map((strategy) => (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              onSelect={onSelect}
              onOpenReport={(s) => setOpenReportId(s.id)}
            />
          ))}
        </div>
      )}

      <StrategyReportModal strategy={openReport} onClose={() => setOpenReportId(null)} />
    </section>
  );
}
