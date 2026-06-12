import type {
  CardInstanceId,
  ChoiceRequest,
  PlayerAction,
} from "@netgrid/shared";
import { selectedChoiceIds } from "./choice-validation";

export type HiddenZoneChoicePayload = {
  hiddenZoneBarrier: true;
  hiddenZoneAction: string;
};

/**
 * @contract Hidden-zone choices may carry actor-private option labels, but
 * public surfaces must consume publicLabel, counts or explicit public facts.
 * @authority This helper does not grant legality; callers still validate
 * selected cards against current LegalActions and engine state before mutation.
 */
export function hiddenCardChoiceOption(options: {
  cardId: CardInstanceId;
  label: string;
  publicLabel?: string;
}): ChoiceRequest["options"][number] {
  return {
    id: `card_${options.cardId}`,
    label: options.label,
    ...(options.publicLabel ? { publicLabel: options.publicLabel } : {}),
    value: options.cardId,
  };
}

export function selectedHiddenCardChoiceIds(
  selectedChoices: PlayerAction["selectedChoices"],
  choice: ChoiceRequest,
): CardInstanceId[] {
  return selectedChoiceIds(selectedChoices).map((optionId) => {
    const option = choice.options.find(
      (candidate) => candidate.id === optionId,
    );
    if (typeof option?.value !== "string")
      throw new Error("Die gewaehlte Kartenoption ist ungueltig.");
    return option.value as CardInstanceId;
  });
}

export function hiddenZoneChoicePayload(
  hiddenZoneAction: string,
): HiddenZoneChoicePayload {
  return {
    hiddenZoneBarrier: true,
    hiddenZoneAction,
  };
}
