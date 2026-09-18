"use client";

import { useMemo, useState } from "react";
import type { TrackedStatus } from "@/lib/types";
import { collectClips, itemsTotals } from "@/lib/rollup";
import { useData } from "@/components/providers/DataProvider";
import FilterBar, { type FilterOption } from "@/components/shared/FilterBar";
import ProgressBar from "@/components/shared/ProgressBar";
import PerformanceReference from "@/components/shared/PerformanceReference";
import TrackedCard from "@/components/shared/TrackedCard";
import InlineAddForm from "@/components/shared/InlineAddForm";

type StatusFilterValue = TrackedStatus | "all";

const FILTERS: FilterOption<StatusFilterValue>[] = [
  { value: "ongoing", label: "Ongoing" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "all", label: "All" },
];

/** Campaign: client work, one card per client. Same measure as Viral. */
export default function CampaignTab() {
  const { state, createItem, updateItem, deleteItem } = useData();
  const [status, setStatus] = useState<StatusFilterValue>("all");

  const campaigns = useMemo(
    () => state.items.filter((item) => item.kind === "campaign"),
    [state.items],
  );

  const visible = useMemo(
    () => (status === "all" ? campaigns : campaigns.filter((c) => c.status === status)),
    [campaigns, status],
  );

  const counts = useMemo(
    () => ({
      ongoing: campaigns.filter((c) => c.status === "ongoing").length,
      upcoming: campaigns.filter((c) => c.status === "upcoming").length,
      completed: campaigns.filter((c) => c.status === "completed").length,
      all: campaigns.length,
    }),
    [campaigns],
  );

  const totals = useMemo(() => itemsTotals(visible), [visible]);
  const clips = useMemo(() => collectClips(visible), [visible]);

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text">Campaign</h2>
          <p className="mt-1 max-w-2xl text-sm text-mute">
            Client work, one card per client. Same measure as Viral: posts made against target.
          </p>
        </div>
        <FilterBar
          options={FILTERS}
          value={status}
          onChange={setStatus}
          counts={counts}
          ariaLabel="Filter campaigns by status"
        />
      </div>

      {visible.length > 0 && (
        <div className="mb-6 rounded-2xl border border-line bg-surface p-5">
          <ProgressBar
            made={totals.postsMade}
            target={totals.postsTarget}
            label={`Combined output · ${status === "all" ? "all" : status} (${visible.length})`}
          />
          <PerformanceReference clips={clips} />
        </div>
      )}

      {visible.length === 0 ? (
        <p className="mb-5 rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center text-sm text-mute">
          {campaigns.length === 0
            ? "No campaigns yet — add the first client below."
            : `Nothing ${status} right now.`}
        </p>
      ) : (
        <div className="mb-5 grid gap-5 lg:grid-cols-2">
          {visible.map((campaign) => (
            <TrackedCard
              key={campaign.id}
              eyebrow="Client"
              title={campaign.name}
              status={campaign.status}
              postsMade={campaign.postsMade}
              postsTarget={campaign.postsTarget}
              clips={campaign.clips}
              ownerType="item"
              ownerId={campaign.id}
              onRename={(name) => void updateItem(campaign.id, { name })}
              onStatusChange={(s) => void updateItem(campaign.id, { status: s })}
              onPostsMadeChange={(postsMade) => void updateItem(campaign.id, { postsMade })}
              onPostsTargetChange={(postsTarget) => void updateItem(campaign.id, { postsTarget })}
              onDelete={() => void deleteItem(campaign.id)}
              deleteLabel={`campaign ${campaign.name}`}
            />
          ))}
        </div>
      )}

      <InlineAddForm
        label="Add campaign"
        submitLabel="Add campaign"
        fields={[
          { name: "name", placeholder: "Client name" },
          { name: "postsTarget", placeholder: "Target", type: "number", required: false, width: "w-24" },
        ]}
        onSubmit={async (values) => {
          await createItem({
            kind: "campaign",
            name: values.name,
            postsTarget: Number(values.postsTarget) || 0,
          });
        }}
      />
    </section>
  );
}
