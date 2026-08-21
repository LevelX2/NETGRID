import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import { runnerRunStartTrashSourceProfile } from "./runner-canonical-card-facts";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;
type PendingChoiceOption = PendingChoice["options"][number];

type BoundRunStartOption = Readonly<{
  optionId: string;
  sourceCardInstanceId: string;
}>;

/**
 * Completes only the Engine's mandatory ordering payload for multiple Runner
 * run-start sources whose whole canonical effect is to trash themselves.
 *
 * This is deliberately not a strategic chooser: the initiating start-run
 * action, its resident root and its executor have already been chosen.  The
 * Engine requires an order even though these independently bound cleanup
 * effects are semantically interchangeable.
 */
export function selectedRunnerRunStartOrderChoiceOptionId(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: readonly PendingChoiceOption[],
): string | undefined {
  const requirement = action.choiceRequirements?.[0];
  const optionIds = choice.options.map((option) => option.id);
  const exactRuleWindow =
    input.side === "runner" &&
    choice.side === "runner" &&
    choice.kind === "select_cards" &&
    choice.choiceId ===
      `runner_run_start_order_${input.playerView.stateVersion}` &&
    runnerRunStartOrderSourceRunId(choice.source) !== undefined &&
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
    boundRunStartTrashOption(input, option),
  );
  if (
    bound.some((option) => option === undefined) ||
    new Set(bound.map((option) => option?.sourceCardInstanceId)).size !==
      bound.length
  ) {
    return undefined;
  }

  return (bound as BoundRunStartOption[]).sort((left, right) =>
    left.sourceCardInstanceId.localeCompare(right.sourceCardInstanceId),
  )[0]?.optionId;
}

function boundRunStartTrashOption(
  input: AiDecisionInput,
  option: PendingChoiceOption,
): BoundRunStartOption | undefined {
  const valuePrefix = "card_implementation:";
  if (
    option.selectable === false ||
    typeof option.value !== "string" ||
    !option.value.startsWith(valuePrefix) ||
    option.id !== `source_${option.value}`
  ) {
    return undefined;
  }
  const sourceCardInstanceId = option.value.slice(valuePrefix.length);
  if (sourceCardInstanceId.trim().length === 0) return undefined;
  const source = (input.playerView.own.rig ?? []).find(
    (card) =>
      card.instanceId === sourceCardInstanceId &&
      card.known !== false &&
      typeof card.definitionId === "string",
  );
  return source?.definitionId &&
    runnerRunStartTrashSourceProfile(source.definitionId)
    ? { optionId: option.id, sourceCardInstanceId }
    : undefined;
}

function runnerRunStartOrderSourceRunId(source: string): string | undefined {
  const match = /^runner_run_start\.order:([^:\s]+)$/.exec(source);
  return match?.[1];
}
