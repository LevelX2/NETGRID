import type { VisibleCard } from "@netgrid/shared";

import {
  counterDisplaysForRendering,
  hostedOnDetailLabel,
  safeCounterDisplayAmount,
  selectedSubtypeDetailLabel,
  selectedTargetDetailLabel,
  selectedTargetDisplayLabel,
} from "../../app/action-board-ui";
import type { DisplayVisibleCard } from "./card-view-model";

export type CardDetailTranslate = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export function cardDetailLines(
  card: VisibleCard,
  translate?: CardDetailTranslate,
): string[] {
  const typeLine = [card.type, card.subtypes?.join(" / ")]
    .filter(Boolean)
    .join(" · ");
  const setLine =
    "setDetailLabel" in card && typeof card.setDetailLabel === "string"
      ? card.setDetailLabel
      : null;
  const numberLine = [
    card.advancementCounters && card.advancementCounters > 0
      ? translate
        ? translate("advancement", { count: card.advancementCounters })
        : developmentCountLabel(card.advancementCounters)
      : null,
    translatedValueLabel(translate, "cost", "Kosten", card.cost),
    translatedValueLabel(translate, "install", "Install", card.installCost),
    translatedValueLabel(translate, "memory", "MU", card.memoryCost),
    translatedValueLabel(translate, "rez", "Rez", card.rezCost),
    translatedValueLabel(translate, "trash", "Trash", card.trashCost),
    translate && card.advancementRequirement !== undefined
      ? translate("detail.required", { count: card.advancementRequirement })
      : neededDevelopmentLabel(card.advancementRequirement),
    translatedValueLabel(translate, "agenda", "Agenda", card.agendaPoints),
    translatedValueLabel(translate, "strength", "Stärke", card.strength),
    translate && card.selectedServerLabel
      ? translate("detail.targetServer", { server: card.selectedServerLabel })
      : selectedServerLabel(card),
    translate && card.selectedSubtypeLabel
      ? translate("detail.selectedSubtype", {
          subtype: card.selectedSubtypeLabel,
        })
      : selectedSubtypeDetailLabel(card),
    translate && selectedTargetDisplayLabel(card)
      ? translate("detail.selectedTarget", {
          target: selectedTargetDisplayLabel(card)!,
        })
      : selectedTargetDetailLabel(card),
    translate && card.hostedOnLabel
      ? translate("detail.hostedOn", { host: card.hostedOnLabel })
      : hostedOnDetailLabel(card),
    ...counterDisplayDetailLabels(card),
  ]
    .filter(Boolean)
    .join(" · ");
  return [typeLine, setLine, numberLine].filter((line): line is string =>
    Boolean(line),
  );
}

function translatedValueLabel(
  translate: CardDetailTranslate | undefined,
  key: string,
  legacyLabel: string,
  value: number | undefined,
): string | null {
  if (value === undefined) return null;
  return translate
    ? translate(`detail.${key}`, { value })
    : valueLabel(legacyLabel, value);
}

export function cardWithoutDevelopmentCounters(
  card: DisplayVisibleCard,
): DisplayVisibleCard {
  const { advancementCounters: _advancementCounters, ...nativeCard } = card;
  return nativeCard;
}

export function neededDevelopmentLabel(
  count: number | undefined,
): string | null {
  return count === undefined
    ? null
    : `Benötigt ${count} ${count === 1 ? "Entwicklung" : "Entwicklungen"}`;
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
