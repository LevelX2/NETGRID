import { useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import type { VisibleCard } from "@netgrid/shared";

import {
  cardCreditCounterVisual,
  counterDisplayTooltipText,
  counterDisplayUsesCreditBadge,
  counterDisplayUsesRefreshingCreditBadge,
  safeCounterDisplayAmount,
  type AdvancementCounterDisplay,
  type IceModifierBadgeView
} from "../../app/action-board-ui";
import { CounterHelpTooltipTrigger } from "../game-board/CounterHelpTooltip";
import { SubroutineIcon } from "./CardTextRendering";
import type { DisplayVisibleCard } from "./card-view-model";

export function AdvancementGems({ card, display }: { card: DisplayVisibleCard; display: AdvancementCounterDisplay }) {
  if (display.overflowLabel) {
    return (
      <span className="advancementGems counted" aria-hidden="true">
        <span className="advancementGemCount">
          <span className="advancementGem advancementGemCountIcon" />
          <span className="advancementGemCountAmount">{display.overflowLabel}</span>
        </span>
      </span>
    );
  }

  return (
    <span className="advancementGems iconsOnly" aria-hidden="true">
      {Array.from({ length: display.visibleGemCount }, (_, index) => (
        <span className="advancementGem" key={`${card.instanceId}-development-${index}`} style={advancementGemStyle(card.instanceId, index, display.visibleGemCount)} />
      ))}
    </span>
  );
}

export function IceModifierBadges({ badges }: { badges: IceModifierBadgeView[] }) {
  const [tooltipBadge, setTooltipBadge] = useState<IceModifierBadgeView | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({});
  const [tooltipPlacement, setTooltipPlacement] = useState<"above" | "below">("above");

  const showBadgeTooltip = (element: HTMLElement, badge: IceModifierBadgeView) => {
    const rect = element.getBoundingClientRect();
    const width = Math.min(240, Math.max(160, window.innerWidth - 32));
    const margin = 16;
    const left = Math.max(margin, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - margin));
    const estimatedHeight = 44;
    const above = rect.top > estimatedHeight + margin;
    setTooltipPlacement(above ? "above" : "below");
    setTooltipStyle(
      above
        ? { left: `${left}px`, top: `${rect.top - 8}px`, width: `${width}px` }
        : { left: `${left}px`, top: `${rect.bottom + 8}px`, width: `${width}px` }
    );
    setTooltipBadge(badge);
  };

  return (
    <span className="iceModifierBadges" aria-hidden="true">
      {badges.map((badge) => (
        <span
          className={`iceModifierBadge${badge.tone ? ` ${badge.tone}` : ""}`}
          key={badge.key}
          data-testid={badge.testId}
          onPointerEnter={(event) => showBadgeTooltip(event.currentTarget, badge)}
          onPointerLeave={() => setTooltipBadge(null)}
        >
          {badge.icon === "none" ? null : <SubroutineIcon />}
          <span>{badge.shortLabel}</span>
        </span>
      ))}
      {tooltipBadge && typeof document !== "undefined"
        ? createPortal(
            <span className={`cardTooltip iceModifierTooltip ${tooltipPlacement} visible`} role="tooltip" style={tooltipStyle}>
              <strong>{tooltipBadge.shortLabel}</strong>
              <span className="cardTooltipText">{tooltipBadge.tooltip}</span>
            </span>,
            document.body
          )
        : null}
    </span>
  );
}

export function StrengthBoostBadge({ amount }: { amount: number }) {
  return (
    <span className="strengthBoostBadge" aria-label={`+${amount} Stärke`} data-testid="strength-boost-badge">
      +{amount} Stärke
    </span>
  );
}

export function IceStrengthBadge({ strength }: { strength: number }) {
  return (
    <span className="iceStrengthBadge" aria-hidden="true" data-testid="ice-strength-badge">
      Stärke {strength}
    </span>
  );
}

export function CounterDisplayBadge({ display, scoreState }: { display: NonNullable<VisibleCard["counterDisplays"]>[number]; scoreState: boolean }) {
  const amount = safeCounterDisplayAmount(display.amount);
  if (amount <= 0) return null;
  if (display.displayKind === "stored_credits") {
    return (
      <CardCreditCounter
        amount={amount}
        ariaLabel={display.ariaLabel}
        className={scoreState ? "scoredAgendaCreditsBadge" : "storedCreditsBadge brokerStoredCreditsBadge"}
        testId={scoreState ? "scored-agenda-credits-badge" : "stored-credits-badge"}
      />
    );
  }
  if (display.displayKind === "recurring_credit") {
    return (
      <CardCreditCounter
        amount={amount}
        ariaLabel={display.ariaLabel}
        className="recurringCreditBadge"
        testId="recurring-credit-badge"
      />
    );
  }
  if (counterDisplayUsesCreditBadge(display)) {
    const hasRefreshMarker = counterDisplayUsesRefreshingCreditBadge(display);
    return (
      <CardCreditCounter
        amount={amount}
        ariaLabel={display.ariaLabel}
        className={
          hasRefreshMarker
            ? "recurringCreditBadge restrictedCreditBadge"
            : "brokerStoredCreditsBadge restrictedCreditBadge"
        }
        testId="restricted-credit-badge"
      />
    );
  }
  if (display.id === "variable_paid_etr_subroutines") {
    return (
      <CounterHelpTooltipTrigger
        className="variableSubroutineBadge"
        ariaLabel={display.ariaLabel}
        data-testid="variable-subroutine-badge"
        tooltip={counterDisplayTooltipText(display)}
      >
        <SubroutineIcon />
        <span>{amount}</span>
      </CounterHelpTooltipTrigger>
    );
  }
  const className =
    display.id === "corporate_retreat_active"
      ? "agendaActiveCounterBadge"
      : display.displayKind === "shell"
      ? "shellCounterBadge"
      : display.id === "trace_tag_counter"
        ? "dataRavenCounterBadge"
        : "ablativeCounterBadge";
  const testId =
    display.id === "corporate_retreat_active"
      ? "corporate-retreat-active-badge"
      : display.displayKind === "shell"
      ? "shell-counter-badge"
      : display.id === "trace_tag_counter"
        ? "data-raven-counter-badge"
        : display.id === "ablative"
          ? "ablative-counter-badge"
          : "counter-display-badge";
  return (
    <CounterHelpTooltipTrigger className={className} ariaLabel={display.ariaLabel} data-testid={testId} tooltip={counterDisplayTooltipText(display)}>
      {counterDisplayBadgeText(display, amount)}
    </CounterHelpTooltipTrigger>
  );
}

function counterDisplayBadgeText(display: NonNullable<VisibleCard["counterDisplays"]>[number], amount: number): string {
  if (display.id === "corporate_retreat_active") return "Aktiv";
  if (display.displayKind === "shell") return `${amount} Shell`;
  if (display.id === "trace_tag_counter") return `${amount} Raven`;
  return `${amount} ${display.label.replace(/-Counter$/u, "").replace(/\s+Counter$/u, "")}`;
}

function CardCreditCounter({ amount, ariaLabel, className, testId }: { amount: number; ariaLabel: string; className: string; testId: string }) {
  const { safeAmount, showCount, iconCount, iconColumns } = cardCreditCounterVisual(amount);
  return (
    <span
      className={`${className} cardCreditCounterBadge ${showCount ? "counted" : "iconsOnly"}`}
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {showCount ? <span className="cardCreditCounterAmount">{safeAmount}</span> : null}
      <span
        className="cardCreditCounterIcons"
        style={{ "--card-credit-columns": iconColumns } as CSSProperties}
        aria-hidden="true"
      >
        {Array.from({ length: iconCount }, (_, index) => (
          <span className="cardCreditCounterIcon" key={`card-credit-counter-icon-${index}`} />
        ))}
      </span>
    </span>
  );
}

const ADVANCEMENT_GEM_ANCHORS = [
  { x: 24, y: 19 },
  { x: 63, y: 16 },
  { x: 78, y: 34 },
  { x: 38, y: 36 },
  { x: 18, y: 52 },
  { x: 59, y: 50 },
  { x: 32, y: 69 },
  { x: 74, y: 65 },
  { x: 49, y: 79 }
];

function advancementGemStyle(instanceId: string, index: number, count: number): CSSProperties {
  const orderSeed = hashString(`${instanceId}:advancement-order`);
  const anchor = advancementGemAnchor(orderSeed, index, count);
  const seed = hashString(`${instanceId}:advancement:${index}`);
  const xJitter = (seed % 9) - 4;
  const yJitter = (Math.floor(seed / 11) % 9) - 4;
  const x = Math.max(12, Math.min(82, anchor.x + xJitter));
  const y = Math.max(12, Math.min(82, anchor.y + yJitter));
  const rotation = (Math.floor(seed / 17) % 42) - 21;
  const scale = 0.9 + ((Math.floor(seed / 31) % 16) / 100);
  return {
    left: `${x}%`,
    top: `${y}%`,
    transform: `rotate(${rotation}deg) scale(${scale})`
  };
}

function advancementGemAnchor(orderSeed: number, index: number, count: number): { x: number; y: number } {
  const anchors = [...ADVANCEMENT_GEM_ANCHORS];
  const fallback = ADVANCEMENT_GEM_ANCHORS[0] ?? { x: 49, y: 50 };
  anchors.sort((a, b) => hashString(`${orderSeed}:${a.x}:${a.y}`) - hashString(`${orderSeed}:${b.x}:${b.y}`));
  if (count <= 3) return anchors[(index * 3) % anchors.length] ?? fallback;
  if (count <= 6) return anchors[(index * 2) % anchors.length] ?? fallback;
  return anchors[index % anchors.length] ?? fallback;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
