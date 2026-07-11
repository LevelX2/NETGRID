import {
  Archive,
  Building2,
  Crosshair,
  FlaskConical,
  Server,
  Tag,
  User,
  type LucideIcon,
} from "lucide-react";
import type { Side } from "@netgrid/shared";

import type { WindowEventIconKind } from "./window-event-icon-kind";

const runTargetIcons: Partial<Record<WindowEventIconKind, LucideIcon>> = {
  "run-hq": Building2,
  "run-rd": FlaskConical,
  "run-archives": Archive,
  "run-remote": Server,
};

export function WindowEventIcon({
  kind,
  side,
  badge,
}: {
  kind: WindowEventIconKind | null | undefined;
  side?: Side | null;
  badge?: string;
}) {
  if (!kind) return null;
  const RunTargetIcon = runTargetIcons[kind];
  const SideIcon =
    side === "runner" ? User : side === "corp" ? Building2 : null;
  return (
    <span
      className={`windowEventIcon windowEventIcon-${kind}${side ? ` windowEventIcon-side-${side}` : ""}`}
      aria-hidden="true"
      data-window-event-icon={kind}
      data-window-event-side={side ?? undefined}
    >
      {SideIcon ? (
        <span
          className="windowEventIconSide"
          data-window-event-side-glyph={side}
        >
          <SideIcon size={24} strokeWidth={1.9} />
        </span>
      ) : null}
      {RunTargetIcon ? (
        <span className="windowEventIconRunTarget">
          <RunTargetIcon size={28} strokeWidth={1.8} />
        </span>
      ) : null}
      {kind === "gain-tag" ? (
        <span className="windowEventIconTagGain">
          <Crosshair size={76} strokeWidth={1.45} />
          <Tag className="windowEventIconTagGlyph" size={34} strokeWidth={2.1} />
        </span>
      ) : null}
      {badge ? <span className="windowEventIconBadge">{badge}</span> : null}
    </span>
  );
}
