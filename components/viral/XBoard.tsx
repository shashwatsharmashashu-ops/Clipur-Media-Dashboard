"use client";

import { useMemo } from "react";
import type { Niche, TrackedStatus } from "@/lib/types";
import { nicheTotals } from "@/lib/rollup";
import { useData } from "@/components/providers/DataProvider";
import TrackedCard from "@/components/shared/TrackedCard";
import InlineAddForm from "@/components/shared/InlineAddForm";
import SectionHeader from "./SectionHeader";

/**
 * X: four niches, with the 14 accounts split across them.
 *
 * Each account carries its own target, posted count and clips. Niche totals
 * roll up from accounts; the platform total (rendered by ViralTab) rolls up
 * from the niches.
 */
export default function XBoard({
  niches,
  statusFilter,
}: {
  niches: Niche[];
  statusFilter: TrackedStatus | "all";
}) {
  const { createNiche, updateNiche, deleteNiche, createAccount, updateAccount, deleteAccount } =
    useData();

  const sections = useMemo(
    () =>
      niches.map((niche) => ({
        niche,
        // Totals always reflect the whole niche, not the filtered view, so the
        // rollup does not change meaning when you filter.
        totals: nicheTotals(niche),
        visible:
          statusFilter === "all"
            ? niche.accounts
            : niche.accounts.filter((account) => account.status === statusFilter),
      })),
    [niches, statusFilter],
  );

  return (
    <div className="space-y-8">
      {sections.map(({ niche, totals, visible }) => (
        <section key={niche.id}>
          <SectionHeader
            eyebrow="Niche"
            name={niche.name}
            totals={totals}
            count={niche.accounts.length}
            countLabel="account"
            onRename={(name) => void updateNiche(niche.id, { name })}
            onDelete={() => void deleteNiche(niche.id)}
          />

          {visible.length === 0 ? (
            <p className="mb-3 rounded-xl border border-dashed border-line bg-surface px-4 py-6 text-center text-sm text-mute">
              {niche.accounts.length === 0
                ? "No accounts in this niche yet."
                : `No ${statusFilter} accounts in this niche.`}
            </p>
          ) : (
            <div className="mb-3 grid gap-5 lg:grid-cols-2">
              {visible.map((account) => (
                <TrackedCard
                  key={account.id}
                  eyebrow={`${niche.name} · X account`}
                  title={account.handle}
                  status={account.status}
                  postsMade={account.postsMade}
                  postsTarget={account.postsTarget}
                  clips={account.clips}
                  ownerType="account"
                  ownerId={account.id}
                  onRename={(handle) => void updateAccount(account.id, { handle })}
                  onStatusChange={(status) => void updateAccount(account.id, { status })}
                  onPostsMadeChange={(postsMade) => void updateAccount(account.id, { postsMade })}
                  onPostsTargetChange={(postsTarget) =>
                    void updateAccount(account.id, { postsTarget })
                  }
                  onDelete={() => void deleteAccount(account.id)}
                  deleteLabel={`account ${account.handle}`}
                />
              ))}
            </div>
          )}

          <InlineAddForm
            label={`Add account to ${niche.name}`}
            submitLabel="Add account"
            fields={[
              { name: "handle", placeholder: "Account handle" },
              { name: "postsTarget", placeholder: "Target", type: "number", required: false, width: "w-24" },
            ]}
            onSubmit={async (values) => {
              await createAccount({
                nicheId: niche.id,
                handle: values.handle,
                postsTarget: Number(values.postsTarget) || 0,
              });
            }}
          />
        </section>
      ))}

      <InlineAddForm
        label="Add niche"
        submitLabel="Add niche"
        fields={[{ name: "name", placeholder: "Niche name" }]}
        onSubmit={async (values) => {
          await createNiche(values.name);
        }}
      />
    </div>
  );
}
