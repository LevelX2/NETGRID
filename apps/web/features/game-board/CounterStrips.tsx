import type { Side, VisibleCard } from "@netgrid/shared";

import { identityCounterChipsForDisplays, serverCounterChipsForDisplays } from "../../app/action-board-ui";
import { CounterHelpTooltipTrigger } from "./CounterHelpTooltip";

export function IdentityCounterStrip({ displays, side }: { displays: VisibleCard["counterDisplays"]; side: Side }) {
  const chips = identityCounterChipsForDisplays(displays);
  if (chips.length === 0) return null;
  return (
    <div className="identityCounterStrip" role="list" aria-label={`${sideLabel(side)}-Counter`}>
      {chips.map((chip) => (
        <CounterHelpTooltipTrigger className="identityCounterChip" role="listitem" key={chip.key} ariaLabel={chip.ariaLabel} tooltip={chip.tooltip}>
          <span className="identityCounterChipLabel">{chip.label}</span>
          <strong>{chip.amount}</strong>
        </CounterHelpTooltipTrigger>
      ))}
    </div>
  );
}

export function ServerCounterStrip({ displays, serverLabel }: { displays: VisibleCard["counterDisplays"]; serverLabel: string }) {
  const chips = serverCounterChipsForDisplays(displays);
  if (chips.length === 0) return null;
  return (
    <div className="serverCounterStrip" role="list" aria-label={`${serverLabel}-Counter`}>
      {chips.map((chip) => (
        <CounterHelpTooltipTrigger className="serverCounterChip" role="listitem" key={chip.key} ariaLabel={chip.ariaLabel} tooltip={chip.tooltip}>
          <span className="serverCounterChipLabel">{chip.label}</span>
          <strong>{chip.amount}</strong>
        </CounterHelpTooltipTrigger>
      ))}
    </div>
  );
}

function sideLabel(side: Side): string {
  return side === "corp" ? "Korp" : "Runner";
}
