import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import {
  runnerDebtFinancingProfile,
  runnerNoRunRecurringEconomyProfile,
} from "./runner-canonical-card-facts";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;
type PendingChoiceOption = PendingChoice["options"][number];

type BoundStartOfTurnOption = {
  optionId: string;
  sourceCardInstanceId: string;
  definitionId: string;
  orderClass: "credit_loss" | "credit_gain";
  amount: number;
};

export function selectedRunnerStartOfTurnOrderChoiceOptionId(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: readonly PendingChoiceOption[],
): string | undefined {
  const requirement = action.choiceRequirements?.[0];
  const sourceStateVersion = runnerStartOrderSourceStateVersion(choice.source);
  const optionIds = choice.options.map((option) => option.id);
  const exactRuleWindow =
    input.side === "runner" &&
    choice.side === "runner" &&
    choice.kind === "select_cards" &&
    choice.choiceId === `runner_start_order_${input.playerView.stateVersion}` &&
    sourceStateVersion === input.playerView.stateVersion &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.visibility === "hidden_info_barrier" &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    selectableOptions.length === choice.options.length &&
    action.side === "runner" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.timingPoint === input.playerView.timingPoint &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === optionIds.length &&
    optionIds.every((optionId) => requirement.optionIds.includes(optionId));
  if (!exactRuleWindow) return undefined;

  const bound = selectableOptions.map((option) =>
    boundStartOfTurnOption(input, option),
  );
  if (
    bound.some((option) => option === undefined) ||
    new Set(bound.map((option) => option?.sourceCardInstanceId)).size !==
      bound.length
  ) {
    return undefined;
  }

  return (bound as BoundStartOfTurnOption[]).sort(
    (left, right) =>
      startOfTurnOrderRank(right.orderClass) -
        startOfTurnOrderRank(left.orderClass) ||
      right.amount - left.amount ||
      left.sourceCardInstanceId.localeCompare(right.sourceCardInstanceId),
  )[0]?.optionId;
}

function boundStartOfTurnOption(
  input: AiDecisionInput,
  option: PendingChoiceOption,
): BoundStartOfTurnOption | undefined {
  if (
    option.selectable === false ||
    typeof option.value !== "string" ||
    option.id !== `source_${option.value}`
  ) {
    return undefined;
  }
  const source = (input.playerView.own.rig ?? []).find(
    (card) =>
      card.instanceId === option.value &&
      card.known !== false &&
      typeof card.definitionId === "string",
  );
  if (!source?.definitionId) return undefined;

  const debt = runnerDebtFinancingProfile(source.definitionId);
  if (debt) {
    return {
      optionId: option.id,
      sourceCardInstanceId: source.instanceId,
      definitionId: source.definitionId,
      orderClass: "credit_loss",
      amount: debt.startOfTurnCreditLoss,
    };
  }
  const recurringEconomy = runnerNoRunRecurringEconomyProfile(
    source.definitionId,
  );
  if (recurringEconomy) {
    return {
      optionId: option.id,
      sourceCardInstanceId: source.instanceId,
      definitionId: source.definitionId,
      orderClass: "credit_gain",
      amount: recurringEconomy.turnStartCredits,
    };
  }
  return undefined;
}

function runnerStartOrderSourceStateVersion(
  source: string,
): number | undefined {
  const match = /^runner_start\.order:([1-9][0-9]*)$/.exec(source);
  if (!match) return undefined;
  const value = Number(match[1]);
  return Number.isSafeInteger(value) ? value : undefined;
}

function startOfTurnOrderRank(
  orderClass: BoundStartOfTurnOption["orderClass"],
): number {
  // Credit losses resolve before gains. The order is neutral while sufficient
  // credits exist and strictly better for the Runner at the zero-credit floor.
  return orderClass === "credit_loss" ? 2 : 1;
}
