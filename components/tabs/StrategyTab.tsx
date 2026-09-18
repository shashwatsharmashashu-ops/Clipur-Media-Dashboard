"use client";

import { useMemo, useState } from "react";
import type { StrategyStatus } from "@/lib/types";
import { useData } from "@/components/providers/DataProvider";
import { useToast } from "@/components/providers/ToastProvider";
import FilterBar, { type FilterOption } from "@/components/shared/FilterBar";
import InlineAddForm from "@/components/shared/InlineAddForm";
import StrategyCard from "./StrategyCard";
import StrategyReportModal from "./StrategyReportModal";

type StrategyFilterValue = StrategyStatus | "all";

const FILTERS: FilterOption<StrategyFilterValue>[] = [
  { value: "ongoing", label: "Ongoing" },
  { value: "in_discussion", label: "In discussion" },
  { value: "concluded", label: "Concluded" },
  { value: "all", label: "All" },
];

export default function StrategyTab() {
  const { state, createStrategy, updateStrategy, deleteStrategy } = useData();
  const { showToast } = useToast();

  const [filter, setFilter] = useState<StrategyFilterValue>("all");
  const [openReportId, setOpenReportId] = useState<string | null>(null);

  const { strategies } = state;

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
    () => (filter === "all" ? strategies : strategies.filter((s) => s.status === filter)),
    [strategies, filter],
  );

  const openReport = strategies.find((s) => s.id === openReportId) ?? null;

  async function handleSelect(id: string) {
    const result = await updateStrategy(id, { selected: true });
    if (result.ok) showToast("Noted for founders");
  }

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text">Strategy</h2>
          <p className="mt-1 max-w-2xl text-sm text-mute">
            Plays the team is running, debating, or has closed out. Note one for the founders to
            flag it as worth backing.
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
        <p className="mb-5 rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center text-sm text-mute">
          No strategies in this state.
        </p>
      ) : (
        <div className="mb-5 grid gap-5 lg:grid-cols-2">
          {visible.map((strategy) => (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              onSelect={handleSelect}
              onUpdate={(patch) => void updateStrategy(strategy.id, patch)}
              onDelete={() => void deleteStrategy(strategy.id)}
              onOpenReport={(s) => setOpenReportId(s.id)}
            />
          ))}
        </div>
      )}

      <InlineAddForm
        label="Add strategy"
        submitLabel="Add strategy"
        fields={[
          { name: "title", placeholder: "Strategy title" },
          { name: "description", placeholder: "What is the play?", required: false },
        ]}
        onSubmit={async (values) => {
          await createStrategy({ title: values.title, description: values.description });
        }}
      />

      <StrategyReportModal
        strategy={openReport}
        onClose={() => setOpenReportId(null)}
        onSave={(report) => {
          if (openReport) void updateStrategy(openReport.id, { report });
        }}
      />
    </section>
  );
}
