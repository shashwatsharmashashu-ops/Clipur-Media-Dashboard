"use client";

import type { DailyScope } from "@/lib/types";
import EditableNumber from "@/components/shared/EditableNumber";

/**
 * The standing daily targets, editable by any admin.
 *
 * Changing one here applies to future days and to past days that never
 * recorded a snapshot; it never rewrites a day that already has history.
 */
export default function StandingTargets({
  scopes,
  onChange,
}: {
  scopes: DailyScope[];
  onChange: (scope: DailyScope, target: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-text">Daily targets</h3>
        <p className="text-xs text-mute">
          Clips per day. Editing one here changes it going forward — days already
          recorded keep the target they were measured against.
        </p>
      </div>

      <ul className="flex flex-wrap gap-2">
        {scopes.map((scope) => (
          <li
            key={`${scope.scopeType}:${scope.scopeId}`}
            className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5"
          >
            <span className="text-sm text-text">{scope.name}</span>
            <EditableNumber
              value={scope.target}
              onCommit={(target) => onChange(scope, target)}
              ariaLabel={`Standing daily target for ${scope.name}`}
              className="text-sm font-semibold text-accent-deep"
              suffix="/day"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
