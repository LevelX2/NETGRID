import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { unresolvedChoiceFailure } from "../../runtime/plan-bound-choice-contract";
import type { DefenseState, RunnerDefenseSignals } from "./defense-types";

type ReplacementOption = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>["options"][number];

function gripReplacementSource(
  input: AiDecisionInput,
  option: ReplacementOption,
) {
  const kind = option.metadata?.optionKind;
  const flatline = kind === "flatline_replacement_from_grip";
  const meat = kind === "play_identity_donor";
  if (!flatline && !meat) return;
  if (meat && input.playerView.activeSide !== "corp") return;
  const prefix = flatline
    ? "flatline_tag_replacement_from_grip_"
    : "grip_meat_damage_replacement_";
  const card = input.playerView.own.gripOrHq.find(
    (c) => c.known && option.id === `${prefix}${c.instanceId}`,
  );
  const hint = card?.definitionId
    ? AI_HINTS_BY_CARD.get(card.definitionId)
    : undefined;
  if (!card?.definitionId || option.metadata?.amount !== 1) return;
  const supported = flatline
    ? hint?.effects?.some(
        (e) =>
          e.kind === "flatline_prevention" && e.timing === "prevention_window",
      )
    : hint?.effects?.some(
        (e) =>
          e.kind === "meat_damage_prevention" &&
          e.timing === "prevention_window",
      ) &&
      hint.effects.some(
        (e) =>
          e.kind === "run_tax" &&
          e.scope === "corp" &&
          e.target === "bad_publicity_pressure" &&
          e.timing === "prevention_window",
      );
  if (!supported) return;
  return {
    card,
    replacementKind: flatline
      ? ("flatline_to_tag" as const)
      : ("prevent_meat_add_bad_publicity" as const),
  };
}

export function isRunnerGripDamageReplacementWindow(
  input: AiDecisionInput,
): boolean {
  const choice = input.playerView.pendingChoice;
  return (
    choice?.source === "v121.replacement.damage" &&
    choice.options.some(
      (option) =>
        option.selectable !== false &&
        ["flatline_replacement_from_grip", "play_identity_donor"].includes(
          String(option.metadata?.optionKind),
        ),
    )
  );
}

export function runnerGripDamageReplacementBinding(
  input: AiDecisionInput,
): RunnerDefenseSignals["gripDamageReplacementBinding"] {
  const choice = input.playerView.pendingChoice;
  if (!choice || !isRunnerGripDamageReplacementWindow(input)) return;
  const action = input.legalActions.find((a) => a.type === "resolve_choice");
  if (!action) return;
  const requirement = action.choiceRequirements?.[0];
  const options = choice.options.filter((o) => o.selectable !== false);
  const eligible = options
    .flatMap((option) => {
      const source = gripReplacementSource(input, option);
      return source ? [{ option, ...source }] : [];
    })
    .sort(
      (a, b) =>
        Number(a.replacementKind !== "flatline_to_tag") -
          Number(b.replacementKind !== "flatline_to_tag") ||
        a.card.instanceId.localeCompare(b.card.instanceId),
    );
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
      "Bind grip damage replacement to the current Engine window, exact own source and offered option before payload resolution.",
    );
  }
  return {
    actionId: action.actionId,
    choiceId: choice.choiceId,
    stateVersion: choice.stateVersion,
    sourceCardInstanceId: selected.card.instanceId,
    sourceDefinitionId: selected.card.definitionId!,
    replacementKind: selected.replacementKind,
    selectedOptionId: selected.option.id,
    optionIds: options.map((o) => o.id),
  };
}

export function selectedRunnerGripDamageReplacement(
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
  const binding = state?.signals.gripDamageReplacementBinding;
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
  const currentSource = option
    ? gripReplacementSource(input, option)
    : undefined;
  if (
    portfolio?.stateVersion !== input.playerView.stateVersion ||
    state?.phase !== "replace_damage_from_grip" ||
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
    currentSource?.card.instanceId !== source.instanceId ||
    currentSource?.replacementKind !== binding.replacementKind
  ) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Complete grip damage replacement only from the exact current defense plan, source, state and selected option.",
    );
  }
  return [binding.selectedOptionId];
}
