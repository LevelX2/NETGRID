import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { unresolvedChoiceFailure } from "../../runtime/plan-bound-choice-contract";
import type { DefenseState, RunnerDefenseSignals } from "./defense-types";

export function isRunnerTerminalGripReplacementWindow(
  input: AiDecisionInput,
): boolean {
  const choice = input.playerView.pendingChoice;
  return (
    choice?.source === "v121.replacement.damage" &&
    choice.options.some(
      (option) =>
        option.selectable !== false &&
        option.metadata?.optionKind === "flatline_replacement_from_grip",
    )
  );
}

export function runnerTerminalDamageReplacementBinding(
  input: AiDecisionInput,
): RunnerDefenseSignals["terminalDamageReplacementBinding"] {
  const choice = input.playerView.pendingChoice;
  if (!choice || !isRunnerTerminalGripReplacementWindow(input)) return;
  const action = input.legalActions.find((a) => a.type === "resolve_choice");
  if (!action) return;
  const requirement = action.choiceRequirements?.[0];
  const options = choice.options.filter((o) => o.selectable !== false);
  const eligible = options
    .flatMap((option) => {
      if (option.metadata?.optionKind !== "flatline_replacement_from_grip")
        return [];
      const card = input.playerView.own.gripOrHq.find(
        (c) =>
          c.known &&
          option.id === `flatline_tag_replacement_from_grip_${c.instanceId}`,
      );
      const hint = card?.definitionId
        ? AI_HINTS_BY_CARD.get(card.definitionId)
        : undefined;
      return card?.definitionId &&
        hint?.effects?.some(
          (e) =>
            e.kind === "flatline_prevention" &&
            e.timing === "prevention_window",
        ) &&
        option.metadata.amount === 1
        ? [{ option, card }]
        : [];
    })
    .sort((a, b) => a.card.instanceId.localeCompare(b.card.instanceId));
  const selected = eligible[0];
  if (
    input.side !== "runner" ||
    choice.side !== "runner" ||
    choice.kind !== "select_option" ||
    choice.stateVersion !== input.playerView.stateVersion ||
    choice.minSelections !== 1 ||
    choice.maxSelections !== 1 ||
    action.side !== "runner" ||
    action.source !== "game_rule" ||
    action.expiresAtStateVersion !== choice.stateVersion ||
    action.choiceRequirements?.length !== 1 ||
    requirement?.choiceId !== choice.choiceId ||
    requirement.minSelections !== 1 ||
    requirement.maxSelections !== 1 ||
    requirement.optionIds.length !== options.length ||
    options.some((o) => !requirement.optionIds.includes(o.id)) ||
    !selected
  ) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Bind terminal damage rescue to the current Engine replacement window, exact own grip source and offered replacement option before payload resolution.",
    );
  }
  return {
    actionId: action.actionId,
    choiceId: choice.choiceId,
    stateVersion: choice.stateVersion,
    sourceCardInstanceId: selected.card.instanceId,
    sourceDefinitionId: selected.card.definitionId!,
    selectedOptionId: selected.option.id,
    optionIds: options.map((o) => o.id),
  };
}

export function selectedRunnerTerminalDamageReplacement(
  input: AiDecisionInput,
  action: LegalAction,
  portfolio: ResidentPlanPortfolio | undefined,
): string[] {
  const executor = portfolio?.instances.find(
    (i) =>
      i.instanceId === portfolio.executorInstanceId &&
      i.moduleId === "runner.defense_and_recovery",
  );
  const state = executor?.moduleState as DefenseState | undefined;
  const binding = state?.signals.terminalDamageReplacementBinding;
  const choice = input.playerView.pendingChoice;
  const source = input.playerView.own.gripOrHq.find(
    (c) =>
      c.known &&
      c.instanceId === binding?.sourceCardInstanceId &&
      c.definitionId === binding?.sourceDefinitionId,
  );
  const option = choice?.options.find(
    (o) => o.id === binding?.selectedOptionId && o.selectable !== false,
  );
  const requirement = action.choiceRequirements?.[0];
  if (
    portfolio?.stateVersion !== input.playerView.stateVersion ||
    state?.phase !== "replace_terminal_damage" ||
    !binding ||
    input.side !== "runner" ||
    choice?.side !== "runner" ||
    choice.source !== "v121.replacement.damage" ||
    choice.kind !== "select_option" ||
    choice.stateVersion !== binding.stateVersion ||
    choice.choiceId !== binding.choiceId ||
    binding.stateVersion !== input.playerView.stateVersion ||
    action.actionId !== binding.actionId ||
    action.side !== "runner" ||
    action.expiresAtStateVersion !== binding.stateVersion ||
    action.choiceRequirements?.length !== 1 ||
    requirement?.choiceId !== binding.choiceId ||
    requirement.minSelections !== 1 ||
    requirement.maxSelections !== 1 ||
    requirement.optionIds.length !== binding.optionIds.length ||
    requirement.optionIds.some((id) => !binding.optionIds.includes(id)) ||
    !source ||
    option?.id !== `flatline_tag_replacement_from_grip_${source.instanceId}` ||
    option.metadata?.optionKind !== "flatline_replacement_from_grip" ||
    option.metadata.amount !== 1 ||
    !AI_HINTS_BY_CARD.get(binding.sourceDefinitionId)?.effects?.some(
      (e) =>
        e.kind === "flatline_prevention" && e.timing === "prevention_window",
    )
  ) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Complete terminal damage replacement only from the exact current defense plan, source, state and selected option.",
    );
  }
  return [binding.selectedOptionId];
}
