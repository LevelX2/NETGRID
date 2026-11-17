import { isRunnerPaymentWindowId, type AiDecisionInput, type LegalAction } from "@netgrid/shared";
import { actionMatchesCurrentDecision } from "../../actions/current-legal-action";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { runnerCandidateIsCardAbility } from "../../runtime/runner-information-action-facts";
import { runnerCandidateHasVisibleAdditionalAccessEffect } from "./runner-run-window-additional-access";

export function runnerFreeAgendaStealForCurrentAccess(
  input: AiDecisionInput,
): LegalAction | undefined {
  const run = input.playerView.run;
  const card = run?.accessedCard;
  if (
    input.side !== "runner" ||
    input.playerView.side !== "runner" ||
    input.playerView.timingPoint !== "access.resolve_card" ||
    run?.phase !== "access" ||
    card?.known !== true ||
    card.type !== "agenda" ||
    !Number.isSafeInteger(card.agendaPoints) ||
    Number(card.agendaPoints) <= 0
  )
    return undefined;
  return input.legalActions.find(
    (action) =>
      action.type === "steal_agenda" &&
      actionMatchesCurrentDecision(input, action) &&
      action.source === card.instanceId &&
      action.costs.length === 0 &&
      action.targetRequirements.length === 0 &&
      !action.choiceRequirements?.length &&
      action.payload?.agendaAccessReplacement === undefined,
  );
}

function isRunWindowSemantic(candidate: ActionSemanticCandidate): boolean {
  return (
    candidate.semanticActionType === "run.continue" ||
    candidate.semanticActionType === "run.jack_out" ||
    candidate.semanticActionType === "run.decline_optional_bonus" ||
    candidate.semanticActionType === "runner.access_replacement_counter" ||
    candidate.semanticActionType.startsWith("access.") ||
    candidate.semanticActionType === "breaker.boost_strength" ||
    candidate.semanticActionType === "breaker.break_subroutine"
  );
}

function runWindowLegalAction(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  actionsById: ReadonlyMap<string, LegalAction> | undefined,
): LegalAction | undefined {
  const action = actionsById
    ? actionsById.get(candidate.actionId)
    : input.legalActions.find(
        (action) => action.actionId === candidate.actionId,
      );
  return input.side === "runner" &&
    actionMatchesCurrentDecision(input, action) &&
    candidate.actorSide === action.side &&
    candidate.actionType === action.type
    ? action
    : undefined;
}

export function isRunnerRunWindowCandidate(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  actionsById?: ReadonlyMap<string, LegalAction>,
): boolean {
  return (
    runnerRunPaymentSupportAction(input, candidate, actionsById) !==
      undefined ||
    isRunWindowSemantic(candidate) ||
    (input.playerView.run !== undefined &&
      candidate.sourceKind === "card" &&
      candidate.semanticActionType.startsWith("card_ability.")) ||
    runnerCandidateHasVisibleAdditionalAccessEffect(candidate) ||
    runnerRestrictedRunSequenceAction(input, candidate, actionsById) !==
      undefined ||
    runnerOptionalBonusRunDeclineAction(input, candidate, actionsById) !==
      undefined ||
    runnerSuccessfulRunBeforeAccessEffectAction(
      input,
      candidate,
      actionsById,
    ) !== undefined ||
    runnerPostPassDerezAndEndRunAction(input, candidate, actionsById) !==
      undefined ||
    runnerPostPassTrashAction(input, candidate, actionsById) !== undefined ||
    runnerRunRemainderStrengthBoostAction(input, candidate, actionsById) !==
      undefined
  );
}

export function runnerRunPaymentSupportAction(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  actionsById?: ReadonlyMap<string, LegalAction>,
): LegalAction | undefined {
  if (!input.playerView.run) return undefined;
  const action = runWindowLegalAction(input, candidate, actionsById);
  return action &&
    action.type === "activated_card_ability" &&
    isRunnerPaymentWindowId(action.payload?.costPenaltySupportWindowId) &&
    typeof action.payload.costPenaltySupportOriginalActionId === "string"
    ? action
    : undefined;
}

export function runnerSuccessfulRunBeforeAccessEffectAction(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  actionsById?: ReadonlyMap<string, LegalAction>,
): LegalAction | undefined {
  if (!runnerCandidateIsCardAbility(candidate)) return undefined;
  if (candidate.abilityBindingMethod !== "canonical_capability_id")
    return undefined;
  const action = runWindowLegalAction(input, candidate, actionsById);
  if (
    !action ||
    action.type !== "trigger_ability" ||
    action.source !== candidate.sourceCardInstanceId ||
    action.payload?.cardImplementationPrimitiveKind !==
      "successful_run_before_access_effect" ||
    action.payload.cardImplementationAbilityId !== candidate.abilityId ||
    action.payload.cardImplementationAbilityKey !== candidate.abilityKey ||
    action.payload.cardImplementationCapabilityBindingKind !==
      "card_spec_capability_key" ||
    input.playerView.timingPoint !== "access.resolve_card" ||
    input.playerView.run?.successful !== true ||
    input.playerView.run.phase !== "access" ||
    action.payload.serverId !== input.playerView.run.attackedServerId
  )
    return undefined;
  const effectKind = action.payload.cardImplementationEffectKind;
  if (
    effectKind === "corp_lose_credits" &&
    Number.isFinite(action.payload.creditLoss) &&
    Number(action.payload.creditLoss) > 0
  )
    return action;
  if (
    effectKind === "trash_remote_fort" &&
    Number.isFinite(action.payload.targetCount) &&
    Number(action.payload.targetCount) > 0
  )
    return action;
  return undefined;
}

export function runnerOptionalBonusRunDeclineAction(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  actionsById?: ReadonlyMap<string, LegalAction>,
): LegalAction | undefined {
  const action = runWindowLegalAction(input, candidate, actionsById);
  const ability = action?.payload?.runnerAbility ?? action?.payload?.abilityId;
  return action?.type === "trigger_ability" &&
    (ability === "decline_optional_bonus_run" ||
      ability === "decline_successful_run_extra_run")
    ? action
    : undefined;
}

export function runnerRunRemainderStrengthBoostAction(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  actionsById?: ReadonlyMap<string, LegalAction>,
): LegalAction | undefined {
  if (!runnerCandidateIsCardAbility(candidate)) return undefined;
  if (
    input.playerView.timingPoint !== "run.encounter_ice" &&
    input.playerView.timingPoint !== "run.jack_out_window"
  )
    return undefined;
  const action = runWindowLegalAction(input, candidate, actionsById);
  return action &&
    action.type === "trigger_ability" &&
    action.source === candidate.sourceCardInstanceId &&
    action.payload?.runnerAbility === "boost_icebreaker_for_run" &&
    typeof action.payload?.targetCardId === "string"
    ? action
    : undefined;
}

export function runnerPostPassDerezAndEndRunAction(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  actionsById?: ReadonlyMap<string, LegalAction>,
): LegalAction | undefined {
  if (!runnerCandidateIsCardAbility(candidate)) return undefined;
  const hasBoundPostPassEffect =
    candidate.abilityBindingMethod !== "unresolved" &&
    candidate.functionalEffects?.some(
      (effect) =>
        effect.kind === "rez" &&
        effect.scope === "ice" &&
        effect.timing === "encounter_resolution" &&
        effect.target === "derez",
    ) === true &&
    candidate.functionalEffects.some(
      (effect) =>
        effect.kind === "future_run_effect" &&
        effect.scope === "run_path" &&
        effect.timing === "encounter_resolution" &&
        effect.target === "ends_run_after_effect",
    );
  if (!hasBoundPostPassEffect) return undefined;
  const action = runWindowLegalAction(input, candidate, actionsById);
  return action &&
    action.type === "trigger_ability" &&
    (action.payload?.abilityId ?? action.payload?.runnerUtilityAbility) ===
      "derez_fully_broken_passed_ice_and_end_run"
    ? action
    : undefined;
}

export function runnerPostPassTrashAction(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  actionsById?: ReadonlyMap<string, LegalAction>,
): LegalAction | undefined {
  if (
    !runnerCandidateIsCardAbility(candidate) ||
    candidate.abilityBindingMethod !== "canonical_capability_id"
  )
    return undefined;
  const action = runWindowLegalAction(input, candidate, actionsById);
  return action &&
    action.type === "trigger_ability" &&
    action.source === candidate.sourceCardInstanceId &&
    action.payload?.cardImplementationCapabilityBindingKind ===
      "card_spec_capability_key" &&
    action.payload.cardImplementationAbilityKey === candidate.abilityKey &&
    action.payload.cardImplementationAbilityId === candidate.abilityId &&
    (action.payload.abilityId ?? action.payload.runnerUtilityAbility) ===
      "trash_fully_broken_passed_ice"
    ? action
    : undefined;
}

export function runnerRestrictedRunSequenceAction(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  actionsById?: ReadonlyMap<string, LegalAction>,
): LegalAction | undefined {
  const action = runWindowLegalAction(input, candidate, actionsById);
  const remainingActions = Number(
    action?.payload?.restrictedActionGrantRemainingActions,
  );
  return action?.type === "start_run" &&
    action.payload?.restrictedActionGrantActionType === "start_run" &&
    Number.isSafeInteger(remainingActions) &&
    remainingActions > 0
    ? action
    : undefined;
}
