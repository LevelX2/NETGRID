import type { Side } from "@netgrid/shared";
import type { ChronicleActionUse } from "../../app/chronicle";

export function TurnActionBadge({
  actionUse,
  side,
  showTooltip = false,
}: {
  actionUse: ChronicleActionUse;
  side: Side | undefined;
  showTooltip?: boolean;
}) {
  return (
    <span
      className={`turnActionBadge side-${side ?? "neutral"}`}
      {...(showTooltip
        ? { tabIndex: 0, role: "img", "aria-label": actionUse.title }
        : {})}
    >
      <span aria-hidden="true">{actionUse.label}</span>
      {showTooltip ? (
        <span className="turnActionTooltip" aria-hidden="true">
          {actionUse.title}
        </span>
      ) : (
        <span className="srOnly">{actionUse.title}</span>
      )}
    </span>
  );
}
