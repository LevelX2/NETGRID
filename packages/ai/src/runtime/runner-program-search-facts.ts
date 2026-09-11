import { runnerCandidateSourceDefinitionId } from "./runner-action-source-facts";
import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { AI_HINTS_BY_CARD } from "../ai-hints";
export function runnerCandidateExecutesProgramSearch(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  return (
    (candidate.actionType === "play_event" ||
      candidate.actionType === "activated_card_ability" ||
      candidate.actionType === "trigger_ability") &&
    runnerCandidateSourceSupportsProgramSearch(input, candidate)
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
