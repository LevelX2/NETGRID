import { canonicalCapabilityId, planningCardByDefinitionId } from "@netgrid/cards/planning";
import { runnerCandidateSourceDefinitionId } from "./runner-action-source-facts";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { actionMatchesCurrentDecision } from "../actions/current-legal-action";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { AI_HINTS_BY_CARD } from "../ai-hints";
export function runnerCandidateExecutesProgramSearch(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  if (
    !actionMatchesCurrentDecision(input, action) ||
    input.side !== "runner" ||
    candidate.actionType !== action.type
  ) {
    return false;
  }
  return (
    (candidate.actionType === "play_event" ||
      candidate.actionType === "activated_card_ability" ||
      candidate.actionType === "trigger_ability") &&
    (candidate.semanticActionType === "search.program_to_grip" ||
      candidate.actionTacticSignals.includes("setup.program_search") ||
      candidate.functionalEffects?.some(isProgramSearchEffect) === true ||
      opensProgramInstallSourceChoice(input, action, candidate))
  );
}

function opensProgramInstallSourceChoice(
  input: AiDecisionInput,
  action: LegalAction,
  candidate: ActionSemanticCandidate,
): boolean {
  const definitionId = runnerCandidateSourceDefinitionId(input, candidate);
  const card = definitionId
    ? planningCardByDefinitionId(definitionId)
    : undefined;
  const abilityId = action.abilityRef?.sourceAbilityId;
  if (
    card?.side !== "runner" ||
    !abilityId ||
    action.abilityRef?.sourceCardInstanceId !== action.source
  )
    return false;
  return card.engine.abilities?.some(
    (ability) =>
      canonicalCapabilityId(card.cardDefinitionId, ability.capabilityKey) ===
        abilityId &&
      ability.effects?.some(
        (effect) => effect.kind === "choose_stack_or_trash_program_install",
      ),
  ) === true;
}

function isProgramSearchEffect(
  effect: NonNullable<ActionSemanticCandidate["functionalEffects"]>[number],
): boolean {
  return (
    effect.kind === "search" &&
    effect.scope === "stack" &&
    effect.target === "program"
  );
}

export function runnerCandidateSourceSupportsProgramSearch(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  const effectTargets = new Set(candidate.effectTargets ?? []);
  const sourceDefinitionId = runnerCandidateSourceDefinitionId(
    input,
    candidate,
  );
  const hint = sourceDefinitionId
    ? AI_HINTS_BY_CARD.get(sourceDefinitionId)
    : undefined;
  return (
    candidate.functionalEffects?.some(isProgramSearchEffect) === true ||
    effectTargets.has("setup.program_search") ||
    effectTargets.has("program_search") ||
    hint?.functionSignals?.includes("setup.program_search") === true ||
    hint?.roles?.includes("program_search") === true
  );
}

export function runnerProgramSearchSourceCardInstanceId(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): string | undefined {
  const legalAction = input.legalActions.find(
    (action) => action.actionId === candidate.actionId,
  );
  const payloadCardId = legalAction?.payload?.cardId;
  return (
    candidate.sourceCardInstanceId ??
    (typeof payloadCardId === "string" ? payloadCardId : undefined) ??
    (typeof legalAction?.source === "string" &&
    legalAction.source !== "basic_action" &&
    legalAction.source !== "game_rule"
      ? legalAction.source
      : undefined)
  );
}
