import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";
import type { CorpAmbushSignal } from "../../plans/corp-tactical-plan-contracts";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import {
  PendingChoice,
  PendingChoiceOptions,
  unresolvedChoiceFailure,
} from "../../runtime/plan-bound-choice-contract";
export function selectedCorpAccessPaymentOptionsFromAmbushPlan(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) => instance.instanceId === portfolio.executorInstanceId,
  );
  const moduleState = executor?.moduleState as
    | { kind?: unknown; signal?: CorpAmbushSignal }
    | undefined;
  const binding = moduleState?.signal?.accessPaymentChoiceBinding;
  const pay = selectableOptions.find(
    (option) => option.id === "pay" && option.value === "pay",
  );
  const requirement = action.choiceRequirements?.[0];
  if (
    portfolio?.side !== "corp" ||
    portfolio.stateVersion !== input.playerView.stateVersion ||
    executor?.moduleId !== "corp.ambush_and_bluff" ||
    executor.executionState !== "executor" ||
    moduleState?.kind !== "ambush" ||
    moduleState.signal?.phase !== "trigger" ||
    binding?.actionId !== action.actionId ||
    binding.choiceId !== choice.choiceId ||
    binding.choiceSource !== choice.source ||
    binding.observedAtStateVersion !== input.playerView.stateVersion ||
    choice.stateVersion !== input.playerView.stateVersion ||
    choice.side !== "corp" ||
    action.side !== "corp" ||
    action.type !== "resolve_choice" ||
    action.source !== "game_rule" ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.timingPoint !== input.playerView.timingPoint ||
    action.choiceRequirements?.length !== 1 ||
    requirement?.choiceId !== choice.choiceId ||
    requirement.minSelections !== 1 ||
    requirement.maxSelections !== 1 ||
    requirement.optionIds.length !== 2 ||
    selectableOptions.length !== 2 ||
    !selectableOptions.every((option) =>
      requirement.optionIds.includes(option.id),
    ) ||
    pay?.metadata?.creditCost !== binding.creditCost ||
    pay.metadata.accessPaymentNoOpCertified !== binding.noOpCertified ||
    choice.sourceCardDefinitionId !== moduleState.signal.sourceDefinitionId ||
    choice.sourceCardInstanceId !== moduleState.signal.sourceInstanceId ||
    binding.selectedOptionIds.length !== 1 ||
    !selectableOptions.some(
      (option) => option.id === binding.selectedOptionIds[0],
    )
  ) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "The Corp ambush plan must bind the exact current paid-access option and Engine certificate before payload resolution.",
    );
  }
  return [...binding.selectedOptionIds];
}

export function selectedCorpAccessProgramBounceOptionIdsFromResidentAmbushPlan(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) => instance.instanceId === portfolio.executorInstanceId,
  );
  const moduleState = executor?.moduleState as
    | { kind?: unknown; signal?: CorpAmbushSignal }
    | undefined;
  const binding = moduleState?.signal?.accessProgramBounceChoiceBinding;
  const requirement = action.choiceRequirements?.[0];
  const optionIds = selectableOptions.map((option) => option.id);
  const selectedCardIds = binding?.selectedOptionIds.flatMap((optionId) => {
    const option = selectableOptions.find((entry) => entry.id === optionId);
    return typeof option?.value === "string" ? [option.value] : [];
  });
  const exactBinding =
    portfolio?.side === "corp" &&
    executor?.moduleId === "corp.ambush_and_bluff" &&
    executor.executionState === "executor" &&
    moduleState?.kind === "ambush" &&
    moduleState.signal?.phase === "trigger" &&
    binding?.actionId === action.actionId &&
    binding.choiceId === choice.choiceId &&
    binding.choiceSource === choice.source &&
    binding.observedAtStateVersion === input.playerView.stateVersion &&
    selectedCardIds?.length === binding.targetProgramInstanceIds.length &&
    selectedCardIds.every(
      (cardId, index) => cardId === binding.targetProgramInstanceIds[index],
    ) &&
    choice.side === "corp" &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.visibility === "hidden_info_barrier" &&
    choice.minSelections === 0 &&
    binding.selectedOptionIds.length <= choice.maxSelections &&
    action.side === "corp" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.timingPoint === input.playerView.timingPoint &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === choice.minSelections &&
    requirement.maxSelections === choice.maxSelections &&
    requirement.optionIds.length === optionIds.length &&
    optionIds.every((optionId) => requirement.optionIds.includes(optionId)) &&
    binding.selectedOptionIds.every((optionId) => optionIds.includes(optionId));
  if (!exactBinding) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "The Corp ambush plan must own and bind the exact program-bounce targets before the choice resolver completes the current Engine payload.",
    );
  }
  return [...binding.selectedOptionIds];
}
