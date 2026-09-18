"use client";

import { useState } from "react";
import type { AdminUser, DashboardState } from "@/lib/types";
import { ViewsVisibilityProvider } from "./providers/ViewsProvider";
import { ToastProvider } from "./providers/ToastProvider";
import { DataProvider } from "./providers/DataProvider";
import Header from "./Header";
import Tabs, { type TabKey } from "./Tabs";
import ViralTab from "./tabs/ViralTab";
import CampaignTab from "./tabs/CampaignTab";
import CalendarTab from "./tabs/CalendarTab";
import StrategyTab from "./tabs/StrategyTab";
import ReportsTab from "./tabs/ReportsTab";

/**
 * Client root. Providers wrap the whole app so the Show-views toggle and the
 * shared store are available to every panel.
 */
export default function AppShell({
  initialState,
  user,
}: {
  initialState: DashboardState;
  user: AdminUser;
}) {
  return (
    <ViewsVisibilityProvider>
      <ToastProvider>
        <DataProvider initialState={initialState} user={user}>
          <Header user={user} />
          <Body />
        </DataProvider>
      </ToastProvider>
    </ViewsVisibilityProvider>
  );
}

function Body() {
  const [tab, setTab] = useState<TabKey>("viral");

  return (
    <>
      <div className="mx-auto max-w-6xl px-6">
        <Tabs active={tab} onChange={setTab} />
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {tab === "viral" && (
          <div role="tabpanel" id="panel-viral" aria-labelledby="tab-viral">
            <ViralTab />
          </div>
        )}
        {tab === "campaign" && (
          <div role="tabpanel" id="panel-campaign" aria-labelledby="tab-campaign">
            <CampaignTab />
          </div>
        )}
        {tab === "calendar" && (
          <div role="tabpanel" id="panel-calendar" aria-labelledby="tab-calendar">
            <CalendarTab />
          </div>
        )}
        {tab === "strategy" && (
          <div role="tabpanel" id="panel-strategy" aria-labelledby="tab-strategy">
            <StrategyTab />
          </div>
        )}
        {tab === "reports" && (
          <div role="tabpanel" id="panel-reports" aria-labelledby="tab-reports">
            <ReportsTab />
          </div>
        )}
      </main>
    </>
  );
}
