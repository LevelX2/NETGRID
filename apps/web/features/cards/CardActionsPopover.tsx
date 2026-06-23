import type { CSSProperties } from "react";
import type { LegalAction } from "@netgrid/shared";

import { OverflowAwareActionButton } from "../actions/ActionControls";

export function CardActionsPopover({
  actions,
  disabled,
  placement,
  style,
  actionLabelForAction,
  onAction
}: {
  actions: LegalAction[];
  disabled: boolean;
  placement: "above" | "below";
  style?: CSSProperties;
  actionLabelForAction(action: LegalAction): string;
  onAction(action: LegalAction): void;
}) {
  return (
    <div className={`cardActionsPopover ${placement}`} role="menu" aria-label="Kartenaktionen" style={style} data-card-action-surface="true">
      {actions.map((action, index) => {
        const fullLabel = actionLabelForAction(action);
        const label = compactCardActionMenuLabel(action, fullLabel);
        return (
          <OverflowAwareActionButton
            action={action}
            className="button actionButton cardActionButton"
            key={`${action.actionId}:${index}`}
            onClick={() => onAction(action)}
            disabled={disabled}
            type="button"
            label={fullLabel}
            displayLabel={label}
            role="menuitem"
            data-testid="card-action-button"
            data-action-type={action.type}
            iconSize={14}
          />
        );
      })}
    </div>
  );
}

function compactCardActionMenuLabel(action: LegalAction, label: string): string {
  if (action.type !== "pump_breaker" && action.type !== "break_subroutine") return label;
  return label.replace(/\s+\([^)]*\)$/, "");
}
