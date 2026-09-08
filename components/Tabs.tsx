"use client";

export type TabKey = "viral" | "campaign" | "strategy" | "reports";

const TABS: { key: TabKey; label: string }[] = [
  { key: "viral", label: "Viral" },
  { key: "campaign", label: "Campaign" },
  { key: "strategy", label: "Strategy" },
  { key: "reports", label: "Reports" },
];

export default function Tabs({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (next: TabKey) => void;
}) {
  return (
    <div role="tablist" aria-label="Dashboard sections" className="flex gap-1 border-b border-line">
      {TABS.map((tab) => {
        const selected = tab.key === active;
        return (
          <button
            key={tab.key}
            role="tab"
            id={`tab-${tab.key}`}
            aria-selected={selected}
            aria-controls={`panel-${tab.key}`}
            onClick={() => onChange(tab.key)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              selected
                ? "border-accent-deep text-accent-deep"
                : "border-transparent text-mute hover:border-line hover:text-text"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
