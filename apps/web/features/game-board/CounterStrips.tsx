import type { Side, VisibleCard, VisibleServerStatus } from "@netgrid/shared";
import { useLocale, useTranslations } from "use-intl/react";

import {
  identityCounterChipsForDisplays,
  serverCounterChipsForDisplays,
  serverStatusChips,
} from "../../app/action-board-ui";
import { CounterHelpTooltipTrigger } from "./CounterHelpTooltip";

export function IdentityCounterStrip({
  displays,
  side,
}: {
  displays: VisibleCard["counterDisplays"];
  side: Side;
}) {
  const t = useTranslations("Board.counters");
  const locale = useLocale();
  const chips = identityCounterChipsForDisplays(displays, locale);
  if (chips.length === 0) return null;
  return (
    <div
      className="identityCounterStrip"
      role="list"
      aria-label={t("sideCounters", { side: t(`side.${side}`) })}
    >
      {chips.map((chip) => (
        <CounterHelpTooltipTrigger
          className="identityCounterChip"
          role="listitem"
          key={chip.key}
          ariaLabel={chip.ariaLabel}
          tooltip={chip.tooltip}
        >
          <span className="identityCounterChipLabel">{chip.label}</span>
          <strong>{chip.amount}</strong>
        </CounterHelpTooltipTrigger>
      ))}
    </div>
  );
}
export function ServerCounterStrip({
  displays,
  serverLabel,
}: {
  displays: VisibleCard["counterDisplays"];
  serverLabel: string;
}) {
  const t = useTranslations("Board.counters");
  const locale = useLocale();
  const chips = serverCounterChipsForDisplays(displays, locale);
  if (chips.length === 0) return null;
  return (
    <div
      className="serverCounterStrip"
      role="list"
      aria-label={t("serverCounters", { server: serverLabel })}
    >
      {chips.map((chip) => (
        <CounterHelpTooltipTrigger
          className="serverCounterChip"
          role="listitem"
          key={chip.key}
          ariaLabel={chip.ariaLabel}
          tooltip={chip.tooltip}
        >
          <span className="serverCounterChipLabel">{chip.label}</span>
          <strong>{chip.amount}</strong>
        </CounterHelpTooltipTrigger>
      ))}
    </div>
  );
}
export function ServerStatusStrip({
  statuses,
  serverLabel,
}: {
  statuses: VisibleServerStatus[] | undefined;
  serverLabel: string;
}) {
  const t = useTranslations("Board.counters");
  const locale = useLocale();
  const chips = serverStatusChips(statuses, locale);
  if (chips.length === 0) return null;
  return (
    <div
      className="serverStatusStrip"
      role="list"
      aria-label={t("serverStatus", { server: serverLabel })}
    >
      {chips.map((chip) => (
        <CounterHelpTooltipTrigger
          className={`serverStatusChip serverStatusChip--${chip.tone}`}
          role="listitem"
          key={chip.key}
          ariaLabel={chip.ariaLabel}
          tooltip={chip.tooltip}
          data-testid="server-status-chip"
        >
          {chip.label}
        </CounterHelpTooltipTrigger>
      ))}
    </div>
  );
}
