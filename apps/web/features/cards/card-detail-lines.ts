import type { VisibleCard } from "@netgrid/shared";

import {
  counterDisplaysForRendering,
  hostedOnDetailLabel,
  safeCounterDisplayAmount,
  selectedSubtypeDetailLabel,
  selectedTargetDetailLabel
} from "../../app/action-board-ui";
import type { DisplayVisibleCard } from "./card-view-model";

export function cardDetailLines(card: VisibleCard): string[] {
  const typeLine = [card.type, card.subtypes?.join(" / ")].filter(Boolean).join(" · ");
  const setLine = "setDetailLabel" in card && typeof card.setDetailLabel === "string" ? card.setDetailLabel : null;
  const numberLine = [
    card.advancementCounters && card.advancementCounters > 0 ? developmentCountLabel(card.advancementCounters) : null,
    valueLabel("Kosten", card.cost),
    valueLabel("Install", card.installCost),
    valueLabel("MU", card.memoryCost),
    valueLabel("Rez", card.rezCost),
    valueLabel("Trash", card.trashCost),
    neededDevelopmentLabel(card.advancementRequirement),
    valueLabel("Agenda", card.agendaPoints),
    valueLabel("Stärke", card.strength),
    selectedServerLabel(card),
    selectedSubtypeDetailLabel(card),
    selectedTargetDetailLabel(card),
    hostedOnDetailLabel(card),
    ...counterDisplayDetailLabels(card)
  ]
    .filter(Boolean)
    .join(" · ");
  return [typeLine, setLine, numberLine].filter((line): line is string => Boolean(line));
}

export function cardWithoutDevelopmentCounters(card: DisplayVisibleCard): DisplayVisibleCard {
  const { advancementCounters: _advancementCounters, ...nativeCard } = card;
  return nativeCard;
}

export function neededDevelopmentLabel(count: number | undefined): string | null {
  return count === undefined ? null : `Benötigt ${count} ${count === 1 ? "Entwicklung" : "Entwicklungen"}`;
}

function selectedServerLabel(card: VisibleCard): string | null {
  if (!card.selectedServerLabel) return null;
  return `Zielserver ${card.selectedServerLabel}`;
}

function counterDisplayDetailLabels(card: VisibleCard): string[] {
  return counterDisplaysForRendering(card).map(
    (display) => `${safeCounterDisplayAmount(display.amount)} ${display.label}`,
  );
}

function valueLabel(label: string, value: number | undefined): string | null {
  return value === undefined ? null : `${label} ${value}`;
}

function developmentCountLabel(count: number): string {
  return `${count} ${count === 1 ? "Entwicklung" : "Entwicklungen"}`;
}
