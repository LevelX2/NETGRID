import type { AiDecisionInput } from "@netgrid/shared";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;
type PendingChoiceOption = PendingChoice["options"][number];

const ACCESS_PAYMENT_SOURCE = "p3_35.access_payment";
const ACCESS_ZONES = new Set(["installed", "hq", "rd", "archives"]);

export function selectedCorpAccessPaymentChoiceOptionId(
  input: AiDecisionInput,
  choice: PendingChoice,
  selectableOptions: readonly PendingChoiceOption[],
): string | undefined {
  if (
    input.side !== "corp" ||
    input.playerView.timingPoint !== "access.resolve_card" ||
    choice.side !== "corp" ||
    choice.kind !== "select_option" ||
    choice.minSelections !== 1 ||
    choice.maxSelections !== 1 ||
    choice.stateVersion !== input.playerView.stateVersion
  ) {
    return undefined;
  }

  const sourceParts = choice.source.split(":");
  if (
    sourceParts.length !== 5 ||
    sourceParts[0] !== ACCESS_PAYMENT_SOURCE ||
    sourceParts[1] === "" ||
    !nonNegativeInteger(sourceParts[2]) ||
    !ACCESS_ZONES.has(sourceParts[3] ?? "") ||
    !nonNegativeInteger(sourceParts[4]) ||
    Number(sourceParts[4]) !== input.playerView.stateVersion
  ) {
    return undefined;
  }

  const pay = selectableOptions.find(
    (option) => option.id === "pay" && option.value === "pay",
  );
  const decline = selectableOptions.find(
    (option) => option.id === "decline" && option.value === "decline",
  );
  const creditCost = pay?.metadata?.creditCost;
  if (
    selectableOptions.length !== 2 ||
    !pay ||
    !decline ||
    !Number.isInteger(creditCost) ||
    creditCost === undefined ||
    creditCost <= 0 ||
    creditCost > input.playerView.own.credits
  ) {
    return undefined;
  }
  const originEvent = input.eventTail.at(-1);
  if (
    !originEvent ||
    originEvent.stateVersionAfter !== input.playerView.stateVersion ||
    originEvent.publicPayload.actionType !== "access_card" ||
    originEvent.publicPayload.ambushPaymentChoiceOpened !== true ||
    originEvent.publicPayload.ambushPaymentAmount !== creditCost
  ) {
    return undefined;
  }
  return pay.id;
}

function nonNegativeInteger(value: string | undefined): boolean {
  if (value === undefined || value === "") return false;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0;
}
