import {
  accessTargetExpiryMatchesCurrentInput,
  currentPaidAccessEffect,
} from "./access-target-expiry";
import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";
import type { CorpAmbushSignal } from "../../plans/corp-tactical-plan-contracts";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import {
  exactCurrentChoiceAction,
  type PendingChoice,
  type PendingChoiceOptions,
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
    input.side !== "corp" ||
    exactCurrentChoiceAction(input, choice) !== action ||
    choice.minSelections !== 1 ||
    choice.maxSelections !== 1 ||
    choice.options.length !== 2 ||
    selectableOptions.length !== 2 ||
    pay?.metadata?.creditCost !== binding.creditCost ||
    pay.metadata.accessPaymentNoOpCertified !== binding.noOpCertified ||
    choice.sourceCardDefinitionId !== moduleState.signal.sourceDefinitionId ||
    choice.sourceCardInstanceId !== moduleState.signal.sourceInstanceId ||
    !currentPaidAccessEffect(choice, binding.creditCost) ||
    (binding.targetExpiry !== undefined &&
      (binding.noOpCertified ||
        binding.selectedOptionIds[0] !== "decline" ||
        !accessTargetExpiryMatchesCurrentInput(input, binding.targetExpiry))) ||
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
  const optionIds = selectableOptions.map((option) => option.id);
  const selectedCardIds = binding?.selectedOptionIds.flatMap((optionId) => {
    const option = selectableOptions.find((entry) => entry.id === optionId);
    return typeof option?.value === "string" ? [option.value] : [];
  });
  const exactBinding =
    input.side === "corp" &&
    portfolio?.side === "corp" &&
    portfolio.stateVersion === input.playerView.stateVersion &&
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
    choice.visibility === "hidden_info_barrier" &&
    choice.minSelections === 0 &&
    binding.selectedOptionIds.length <= choice.maxSelections &&
    exactCurrentChoiceAction(input, choice) === action &&
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

export function selectedCorpAccessInstalledTrashOptionIdsFromResidentAmbushPlan(
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
  const binding = moduleState?.signal?.accessInstalledTrashChoiceBinding;
  const optionIds = selectableOptions.map((option) => option.id);
  const selectedCardIds = binding?.selectedOptionIds.flatMap((optionId) => {
    const option = selectableOptions.find((entry) => entry.id === optionId);
    return typeof option?.value === "string" ? [option.value] : [];
  });
  const exactBinding =
    input.side === "corp" &&
    portfolio?.side === "corp" &&
    portfolio.stateVersion === input.playerView.stateVersion &&
    executor?.moduleId === "corp.ambush_and_bluff" &&
    executor.executionState === "executor" &&
    moduleState?.kind === "ambush" &&
    moduleState.signal?.phase === "trigger" &&
    binding?.actionId === action.actionId &&
    binding.choiceId === choice.choiceId &&
    binding.choiceSource === choice.source &&
    binding.observedAtStateVersion === input.playerView.stateVersion &&
    (binding.targetCardType === "program" ||
      binding.targetCardType === "hardware") &&
    (input.playerView.opponent.rig ?? []).filter(
      (c) =>
        c.known &&
        c.owner === "runner" &&
        c.controller === "runner" &&
        c.type === binding.targetCardType,
    ).length === selectableOptions.length &&
    selectableOptions.every((o) =>
      (input.playerView.opponent.rig ?? []).some(
        (c) =>
          c.known &&
          c.owner === "runner" &&
          c.controller === "runner" &&
          c.type === binding.targetCardType &&
          c.instanceId === o.value &&
          o.id === `target_${c.instanceId}`,
      ),
    ) &&
    selectedCardIds?.length === binding.targetCardInstanceIds.length &&
    selectedCardIds.every(
      (cardId, index) => cardId === binding.targetCardInstanceIds[index],
    ) &&
    choice.side === "corp" &&
    choice.visibility === "public" &&
    choice.minSelections > 0 &&
    choice.minSelections === choice.maxSelections &&
    choice.selectionOrdering === "ordered" &&
    choice.sourceCardInstanceId === moduleState.signal.sourceInstanceId &&
    choice.sourceCardDefinitionId === moduleState.signal.sourceDefinitionId &&
    binding.selectedOptionIds.length === choice.maxSelections &&
    new Set(binding.selectedOptionIds).size ===
      binding.selectedOptionIds.length &&
    exactCurrentChoiceAction(input, choice) === action &&
    binding.selectedOptionIds.every((optionId) => optionIds.includes(optionId));
  if (!exactBinding) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "The Corp ambush plan must own and bind the exact installed-card-trash targets before the choice resolver completes the current Engine payload.",
    );
  }
  return [...binding.selectedOptionIds];
}
