"use client";

import { useCallback, useState } from "react";
import type { Clip, Strategy, TrackedItem, WeeklyReport } from "@/lib/types";
import { makeId } from "@/lib/format";
import { useToast } from "@/components/providers/ToastProvider";
import Tabs, { type TabKey } from "./Tabs";
import TrackedBoard from "./shared/TrackedBoard";
import StrategyTab from "./tabs/StrategyTab";
import ReportsTab from "./tabs/ReportsTab";

/**
 * Prototype state root. All mutation lives here so swapping React state for a
 * real backend later means replacing these four handlers, not the UI.
 */
export default function Dashboard({
  initialViral,
  initialCampaigns,
  initialStrategies,
  initialReports,
}: {
  initialViral: TrackedItem[];
  initialCampaigns: TrackedItem[];
  initialStrategies: Strategy[];
  initialReports: WeeklyReport[];
}) {
  const [tab, setTab] = useState<TabKey>("viral");
  const [viral, setViral] = useState(initialViral);
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [strategies, setStrategies] = useState(initialStrategies);
  const [reports] = useState(initialReports);
  const { showToast } = useToast();

  const addClip = useCallback(
    (
      setItems: React.Dispatch<React.SetStateAction<TrackedItem[]>>,
      itemId: string,
      clip: Omit<Clip, "id">,
    ) => {
      setItems((items) =>
        items.map((item) =>
          item.id === itemId
            ? { ...item, clips: [...item.clips, { ...clip, id: makeId("clip") }] }
            : item,
        ),
      );
    },
    [],
  );

  const adjustPosts = useCallback(
    (
      setItems: React.Dispatch<React.SetStateAction<TrackedItem[]>>,
      itemId: string,
      delta: number,
    ) => {
      setItems((items) =>
        items.map((item) =>
          item.id === itemId
            ? { ...item, postsMade: Math.max(0, item.postsMade + delta) }
            : item,
        ),
      );
    },
    [],
  );

  const selectStrategy = useCallback(
    (id: string) => {
      setStrategies((current) =>
        current.map((strategy) =>
          strategy.id === id ? { ...strategy, selected: true } : strategy,
        ),
      );
      showToast("Noted for founders");
    },
    [showToast],
  );

  return (
    <>
      <div className="mx-auto max-w-6xl px-6">
        <Tabs active={tab} onChange={setTab} />
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {tab === "viral" && (
          <div role="tabpanel" id="panel-viral" aria-labelledby="tab-viral">
            <TrackedBoard
              heading="Viral"
              description="Owned niches. Progress is posts made against target — nothing else counts toward it."
              groupLabel="Niche"
              items={viral}
              onAddClip={(itemId, clip) => addClip(setViral, itemId, clip)}
              onAdjustPosts={(itemId, delta) => adjustPosts(setViral, itemId, delta)}
            />
          </div>
        )}

        {tab === "campaign" && (
          <div role="tabpanel" id="panel-campaign" aria-labelledby="tab-campaign">
            <TrackedBoard
              heading="Campaign"
              description="Client work. Same measure as Viral: posts made against target."
              groupLabel="Client"
              items={campaigns}
              onAddClip={(itemId, clip) => addClip(setCampaigns, itemId, clip)}
              onAdjustPosts={(itemId, delta) => adjustPosts(setCampaigns, itemId, delta)}
            />
          </div>
        )}

        {tab === "strategy" && (
          <div role="tabpanel" id="panel-strategy" aria-labelledby="tab-strategy">
            <StrategyTab strategies={strategies} onSelect={selectStrategy} />
          </div>
        )}

        {tab === "reports" && (
          <div role="tabpanel" id="panel-reports" aria-labelledby="tab-reports">
            <ReportsTab reports={reports} />
          </div>
        )}
      </main>
    </>
  );
}
