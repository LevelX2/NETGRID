import {
  Archive,
  Building2,
  FlaskConical,
  Server,
  type LucideIcon,
} from "lucide-react";

import type { WindowEventIconKind } from "./window-event-icon-kind";

const runTargetIcons: Partial<Record<WindowEventIconKind, LucideIcon>> = {
  "run-hq": Building2,
  "run-rd": FlaskConical,
  "run-archives": Archive,
  "run-remote": Server,
};

export function WindowEventIcon({
  kind,
}: {
  kind: WindowEventIconKind | null | undefined;
}) {
  if (!kind) return null;
  const RunTargetIcon = runTargetIcons[kind];
  return (
    <span
      className={`windowEventIcon windowEventIcon-${kind}`}
      aria-hidden="true"
      data-window-event-icon={kind}
    >
      {RunTargetIcon ? (
        <span className="windowEventIconRunTarget">
          <RunTargetIcon size={28} strokeWidth={1.8} />
        </span>
      ) : null}
    </span>
  );
}
