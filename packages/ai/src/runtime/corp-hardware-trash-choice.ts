import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;
type PendingChoiceOption = PendingChoice["options"][number];

const HARDWARE_TRASH_CHOICE_SOURCE =
  /^card_implementation\.installed_hardware_trash_by_counter:([1-9]\d*):(0|[1-9]\d*)$/;

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
  choice: PendingChoice,
  selectableOptions: readonly PendingChoiceOption[],
): string[] | undefined {
  const sourceMatch = HARDWARE_TRASH_CHOICE_SOURCE.exec(choice.source);
  if (!sourceMatch || input.side !== "corp") return undefined;
  const trashCount = Number(sourceMatch[1]);
  const sourceStateVersion = Number(sourceMatch[2]);
  const requirement = action.choiceRequirements?.[0];
  if (
    !Number.isSafeInteger(trashCount) ||
    trashCount < 1 ||
    sourceStateVersion !== input.playerView.stateVersion ||
    choice.side !== "corp" ||
    choice.kind !== "select_cards" ||
    choice.visibility !== "public" ||
    choice.stateVersion !== input.playerView.stateVersion ||
    choice.minSelections !== trashCount ||
    choice.maxSelections !== trashCount ||
    action.side !== "corp" ||
    action.type !== "resolve_choice" ||
    action.source !== "game_rule" ||
    action.timingPoint !== input.playerView.timingPoint ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.choiceRequirements?.length !== 1 ||
    requirement?.choiceId !== choice.choiceId ||
    requirement.minSelections !== trashCount ||
    requirement.maxSelections !== trashCount ||
    selectableOptions.length <= trashCount ||
    requirement.optionIds.length !== selectableOptions.length
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
  const selectableIds = selectableOptions.map((option) => option.id).sort();
  const requirementIds = requirement.optionIds.slice().sort();
  const completeBinding =
    optionBindings.every(
      (binding) =>
        binding.cardId !== undefined &&
        binding.optionId === `card_${binding.cardId}` &&
        visibleHardwareIds.has(binding.cardId),
    ) &&
    new Set(optionCardIds).size === optionCardIds.length &&
    selectableIds.length === requirementIds.length &&
    selectableIds.every(
      (optionId, index) => optionId === requirementIds[index],
    );
  return completeBinding
    ? optionBindings.slice(0, trashCount).map((binding) => binding.optionId)
    : undefined;
}
