import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { corpInstalledHardwareTrashOperationProfile } from "./corp-canonical-card-facts";
import { exactCurrentChoiceAction } from "./plan-bound-choice-contract";

const RUNNER_INSTALLED_MULTI_TRASH_CHOICE_SOURCE =
  "card_implementation.runner_installed_multi_trash";

/**
 * Resolves the exact public target choice opened by the Engine-certified
 * variable-X hardware-trash operation.
 *
 * Selection is deterministic by stable option identity. Card names, rules
 * text, catalog ids and printed costs are deliberately irrelevant.
 */
export function selectedCorpHardwareTrashChoiceOptionIds(
  input: AiDecisionInput,
  action: LegalAction,
): string[] | undefined {
  const choice = input.playerView.pendingChoice;
  if (!choice) return undefined;
  const trashCount = choice.minSelections;
  const selectableOptions = choice.options.filter(
    (option) => option.selectable !== false,
  );
  if (
    input.side !== "corp" ||
    choice.source !== RUNNER_INSTALLED_MULTI_TRASH_CHOICE_SOURCE ||
    typeof choice.sourceCardInstanceId !== "string" ||
    choice.sourceCardInstanceId.length === 0 ||
    !corpInstalledHardwareTrashOperationProfile(
      choice.sourceCardDefinitionId,
    ) ||
    !Number.isSafeInteger(trashCount) ||
    trashCount < 1 ||
    choice.side !== "corp" ||
    choice.kind !== "select_cards" ||
    choice.visibility !== "public" ||
    choice.stateVersion !== input.playerView.stateVersion ||
    choice.maxSelections !== trashCount ||
    choice.selectionOrdering !== "ordered" ||
    exactCurrentChoiceAction(input, choice) !== action ||
    selectableOptions.length < trashCount
  ) {
    return undefined;
  }
  const visibleHardwareIds = new Set(
    (input.playerView.opponent.rig ?? [])
      .filter(
        (card) =>
          card.known === true &&
          card.owner === "runner" &&
          card.controller === "runner" &&
          card.type === "hardware",
      )
      .map((card) => card.instanceId),
  );
  const optionBindings = selectableOptions
    .map((option) => ({
      optionId: option.id,
      cardId: typeof option.value === "string" ? option.value : undefined,
    }))
    .sort((left, right) => left.optionId.localeCompare(right.optionId));
  const optionCardIds = optionBindings
    .map((binding) => binding.cardId)
    .filter((cardId): cardId is string => cardId !== undefined)
    .sort();
  const completeBinding =
    optionBindings.every(
      (binding) =>
        binding.cardId !== undefined &&
        binding.optionId === `target_${binding.cardId}` &&
        visibleHardwareIds.has(binding.cardId),
    ) && new Set(optionCardIds).size === optionCardIds.length;
  return completeBinding
    ? optionBindings.slice(0, trashCount).map((binding) => binding.optionId)
    : undefined;
}
