import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";
import { actionMatchesCurrentDecision } from "../actions/current-legal-action";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
export type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;

export type PendingChoiceOptions = PendingChoice["options"];

/** Exact single Engine offer for a plan-owned current Choice. */
export function exactCurrentChoiceAction(
  input: AiDecisionInput,
  choice: PendingChoice | undefined,
): LegalAction | undefined {
  const { stateVersion, activeSide } = input.playerView;
  if (
    !choice ||
    choice.side !== input.side ||
    activeSide !== input.side ||
    choice.stateVersion !== stateVersion
  )
    return undefined;

  const actions = input.legalActions.filter(
    (action) => action.type === "resolve_choice",
  );
  const [action] = actions;
  const requirement = action?.choiceRequirements?.[0];
  if (
    actions.length !== 1 ||
    !actionMatchesCurrentDecision(input, action) ||
    action.source !== "game_rule" ||
    action.choiceRequirements?.length !== 1 ||
    requirement?.choiceId !== choice.choiceId ||
    requirement.minSelections !== choice.minSelections ||
    requirement.maxSelections !== choice.maxSelections
  )
    return undefined;

  // The Engine includes every Choice option in the requirement. Owners then
  // select only from the currently selectable options.
  const ids = new Set(choice.options.map((option) => option.id));
  const offeredIds = new Set(requirement.optionIds);
  return ids.size === choice.options.length &&
    offeredIds.size === requirement.optionIds.length &&
    ids.size === offeredIds.size &&
    [...ids].every((id) => offeredIds.has(id))
    ? action
    : undefined;
}

export function unresolvedChoiceFailure(
  input: AiDecisionInput,
  action: LegalAction,
  removalCondition: string,
): PlanResolutionFailure {
  return new PlanResolutionFailure("window_origin_missing", {
    side: input.side,
    stateVersion: input.playerView.stateVersion,
    timingPoint: input.playerView.timingPoint,
    legalActionTypes: input.legalActions.map((legalAction) => legalAction.type),
    unresolvedActionIds: [action.actionId],
    owner: "window_resolution",
    removalCondition,
  });
}
