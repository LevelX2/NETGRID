import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import {
  runnerRunStartRandomStrengthSourceProfile,
  runnerRunStartTrashSourceProfile,
} from "./runner-canonical-card-facts";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;
type PendingChoiceOption = PendingChoice["options"][number];

type BoundRunStartOption = Readonly<{
  optionId: string;
  sourceCardInstanceId: string;
  sourceKind: "random_strength" | "self_trash";
  definitionId: string;
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

  const complete = bound as BoundRunStartOption[];
  const sourceKinds = new Set(complete.map((option) => option.sourceKind));
  if (sourceKinds.size !== 1) return undefined;
  if (
    complete[0]?.sourceKind === "random_strength" &&
    new Set(complete.map((option) => option.definitionId)).size !== 1
  ) {
    return undefined;
  }

  return complete.sort((left, right) =>
    left.sourceCardInstanceId.localeCompare(right.sourceCardInstanceId),
  )[0]?.optionId;
}

function boundRunStartTrashOption(
  input: AiDecisionInput,
  option: PendingChoiceOption,
): BoundRunStartOption | undefined {
  const selfTrashPrefix = "card_implementation:";
  const randomStrengthPrefix = "random_strength:";
  if (
    option.selectable === false ||
    typeof option.value !== "string" ||
    option.id !== `source_${option.value}`
  ) {
    return undefined;
  }
  const sourceKind = option.value.startsWith(selfTrashPrefix)
    ? "self_trash"
    : option.value.startsWith(randomStrengthPrefix)
      ? "random_strength"
      : undefined;
  if (!sourceKind) return undefined;
  const sourceCardInstanceId = option.value.slice(
    sourceKind === "self_trash"
      ? selfTrashPrefix.length
      : randomStrengthPrefix.length,
  );
  if (sourceCardInstanceId.trim().length === 0) return undefined;
  const source = (input.playerView.own.rig ?? []).find(
    (card) =>
      card.instanceId === sourceCardInstanceId &&
      card.known !== false &&
      typeof card.definitionId === "string",
  );
  if (!source?.definitionId) return undefined;
  const completeProfile =
    sourceKind === "self_trash"
      ? runnerRunStartTrashSourceProfile(source.definitionId)
      : runnerRunStartRandomStrengthSourceProfile(source.definitionId);
  return completeProfile
    ? {
        optionId: option.id,
        sourceCardInstanceId,
        sourceKind,
        definitionId: source.definitionId,
      }
    : undefined;
}

function runnerRunStartOrderSourceRunId(source: string): string | undefined {
  const match = /^runner_run_start\.order:([^:\s]+)$/.exec(source);
  return match?.[1];
}
