import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import { corpStartOfTurnOptionalDrawProfile } from "./corp-canonical-card-facts";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;
type PendingChoiceOption = PendingChoice["options"][number];

type BoundCorpStartOption = Readonly<{
  optionId: string;
  sourceCardInstanceId: string;
  definitionId: string;
  drawCount: number;
}>;

/**
 * Completes only a mandatory Engine ordering payload for multiple copies of
 * the same scored optional-draw agenda. The later use-or-decline choice stays
 * with the draw plan; this function merely selects the next identical source.
 */
export function selectedCorpStartOfTurnOrderChoiceOptionId(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: readonly PendingChoiceOption[],
): string | undefined {
  const requirement = action.choiceRequirements?.[0];
  const optionIds = choice.options.map((option) => option.id);
  const exactRuleWindow =
    input.side === "corp" &&
    choice.side === "corp" &&
    choice.kind === "select_cards" &&
    choice.choiceId === `corp_start_order_${input.playerView.stateVersion}` &&
    choice.source === `corp_start.order:${input.playerView.stateVersion}` &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.visibility === "hidden_info_barrier" &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    selectableOptions.length === choice.options.length &&
    action.side === "corp" &&
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
    boundCorpStartOption(input, option),
  );
  if (bound.some((option) => option === undefined)) return undefined;
  const complete = bound as BoundCorpStartOption[];
  if (
    new Set(complete.map((option) => option.sourceCardInstanceId)).size !==
      complete.length ||
    new Set(complete.map((option) => option.definitionId)).size !== 1 ||
    new Set(complete.map((option) => option.drawCount)).size !== 1
  ) {
    return undefined;
  }
  return complete.sort((left, right) =>
    left.sourceCardInstanceId.localeCompare(right.sourceCardInstanceId),
  )[0]?.optionId;
}

function boundCorpStartOption(
  input: AiDecisionInput,
  option: PendingChoiceOption,
): BoundCorpStartOption | undefined {
  if (
    option.selectable === false ||
    typeof option.value !== "string" ||
    option.id !== `source_${option.value}`
  ) {
    return undefined;
  }
  const source = (input.playerView.own.scoreArea ?? []).find(
    (card) =>
      card.instanceId === option.value &&
      card.known !== false &&
      typeof card.definitionId === "string",
  );
  const profile = corpStartOfTurnOptionalDrawProfile(source?.definitionId);
  return source?.definitionId && profile
    ? {
        optionId: option.id,
        sourceCardInstanceId: source.instanceId,
        definitionId: source.definitionId,
        drawCount: profile.drawCount,
      }
    : undefined;
}
