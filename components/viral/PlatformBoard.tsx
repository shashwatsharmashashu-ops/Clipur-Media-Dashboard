"use client";

import { useMemo } from "react";
import type { Platform, TrackedItem, TrackedStatus } from "@/lib/types";
import { groupItems, itemsTotals } from "@/lib/rollup";
import { useData } from "@/components/providers/DataProvider";
import TrackedCard from "@/components/shared/TrackedCard";
import InlineAddForm from "@/components/shared/InlineAddForm";
import SectionHeader from "./SectionHeader";
import { PLATFORM_LABELS } from "./PlatformSwitch";

/**
 * Instagram and TikTok. They share one strategy — mainly Hollywood and
 * Streamer content — so items are grouped by content strategy rather than by
 * the X niches. Structure is otherwise identical: target, progress, clips.
 */
export default function PlatformBoard({
  platform,
  items,
  statusFilter,
}: {
  platform: Platform;
  items: TrackedItem[];
  statusFilter: TrackedStatus | "all";
}) {
  const { createItem, updateItem, deleteItem } = useData();

  const groups = useMemo(() => {
    return groupItems(items).map(({ group, items: groupItemList }) => ({
      group,
      totals: itemsTotals(groupItemList),
      all: groupItemList,
      visible:
        statusFilter === "all"
          ? groupItemList
          : groupItemList.filter((item) => item.status === statusFilter),
    }));
  }, [items, statusFilter]);

  return (
    <div className="space-y-8">
      {groups.map(({ group, totals, all, visible }) => (
        <section key={group}>
          <SectionHeader
            eyebrow="Content strategy"
            name={group}
            totals={totals}
            count={all.length}
            countLabel="item"
          />

          {visible.length === 0 ? (
            <p className="mb-3 rounded-xl border border-dashed border-line bg-surface px-4 py-6 text-center text-sm text-mute">
              No {statusFilter} items in {group}.
            </p>
          ) : (
            <div className="mb-3 grid gap-5 lg:grid-cols-2">
              {visible.map((item) => (
                <TrackedCard
                  key={item.id}
                  eyebrow={`${group} · ${PLATFORM_LABELS[platform]}`}
                  title={item.name}
                  status={item.status}
                  postsMade={item.postsMade}
                  postsTarget={item.postsTarget}
                  clips={item.clips}
                  ownerType="item"
                  ownerId={item.id}
                  onRename={(name) => void updateItem(item.id, { name })}
                  onStatusChange={(status) => void updateItem(item.id, { status })}
                  onPostsMadeChange={(postsMade) => void updateItem(item.id, { postsMade })}
                  onPostsTargetChange={(postsTarget) => void updateItem(item.id, { postsTarget })}
                  onDelete={() => void deleteItem(item.id)}
                  deleteLabel={item.name}
                />
              ))}
            </div>
          )}

          <InlineAddForm
            label={`Add item to ${group}`}
            submitLabel="Add item"
            fields={[
              { name: "name", placeholder: "Item name" },
              { name: "postsTarget", placeholder: "Target", type: "number", required: false, width: "w-24" },
            ]}
            onSubmit={async (values) => {
              await createItem({
                kind: "platform",
                platform,
                groupName: group,
                name: values.name,
                postsTarget: Number(values.postsTarget) || 0,
              });
            }}
          />
        </section>
      ))}

      <InlineAddForm
        label="Add content group"
        submitLabel="Create group"
        fields={[
          { name: "groupName", placeholder: "Group name (e.g. Hollywood)" },
          { name: "name", placeholder: "First item name" },
          { name: "postsTarget", placeholder: "Target", type: "number", required: false, width: "w-24" },
        ]}
        onSubmit={async (values) => {
          await createItem({
            kind: "platform",
            platform,
            groupName: values.groupName,
            name: values.name,
            postsTarget: Number(values.postsTarget) || 0,
          });
        }}
      />
    </div>
  );
}
