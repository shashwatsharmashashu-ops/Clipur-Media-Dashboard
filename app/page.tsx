import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import { ViewsVisibilityProvider } from "@/components/providers/ViewsProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import {
  seedCampaignItems,
  seedStrategies,
  seedViralItems,
  seedWeeklyReports,
} from "@/lib/data";

/**
 * Seed data is imported here so a backend swap is a one-file change: replace
 * these imports with fetches and hand the results to <Dashboard /> unchanged.
 */
export default function Page() {
  return (
    <ViewsVisibilityProvider>
      <ToastProvider>
        <Header />
        <Dashboard
          initialViral={seedViralItems}
          initialCampaigns={seedCampaignItems}
          initialStrategies={seedStrategies}
          initialReports={seedWeeklyReports}
        />
      </ToastProvider>
    </ViewsVisibilityProvider>
  );
}
