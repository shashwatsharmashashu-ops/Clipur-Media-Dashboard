import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardState } from "@/lib/repo";
import { isSeeded } from "@/lib/db";
import AppShell from "@/components/AppShell";

/** Always rendered per-request: the data is shared and changes constantly. */
export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!isSeeded()) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-lg font-semibold text-text">Database not seeded</h1>
        <p className="mt-2 text-sm text-mute">
          Run <code className="rounded bg-surface px-1.5 py-0.5">npm run seed</code> to create the
          admin accounts and starting data.
        </p>
      </main>
    );
  }

  return <AppShell initialState={getDashboardState()} user={user} />;
}
