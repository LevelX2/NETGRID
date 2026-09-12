import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { AI_HINTS_BY_CARD } from "../ai-hints";
import { runnerCandidateSourceDefinitionId } from "./runner-action-source-facts";

export function runnerOptionalProgramTrashInstallDuplicatesInstalledDefinition(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  if (!runnerCandidateIsOptionalProgramTrashInstall(input, candidate))
    return false;
  const sourceDefinitionId = runnerCandidateSourceDefinitionId(
    input,
    candidate,
  );
  return (
    sourceDefinitionId !== undefined &&
    (input.playerView.own.rig ?? []).some(
      (installed) => installed.definitionId === sourceDefinitionId,
    )
  );
}

export function runnerCandidateIsOptionalProgramTrashInstall(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  if (candidate.semanticActionType !== "install.card") return false;
  const legalAction = input.legalActions.find(
    (action) => action.actionId === candidate.actionId,
  );
  return (
    legalAction?.payload?.runnerProgramTrashBeforeInstall === true ||
    candidate.actionId.endsWith(".runner_program_trash_before_install")
  );
}

export function runnerCandidateIsOneShotSearch(
  candidate: ActionSemanticCandidate,
): boolean {
  if (
    candidate.actionType !== "play_event" ||
    candidate.sourceKind !== "card"
  ) {
    return false;
  }
  const effectTargets = new Set(candidate.effectTargets ?? []);
  const hint = candidate.sourceDefinitionId
    ? AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId)
    : undefined;
  const structuredSearchEffect =
    hint?.effects?.some(
      (effect) =>
        effect.kind.includes("search") ||
        (typeof effect.target === "string" && effect.target.includes("search")),
    ) === true;
  return (
    candidate.effectKind === "search_trash_to_grip" ||
    candidate.effectKind === "search_stack_to_grip" ||
    effectTargets.has("card_search") ||
    effectTargets.has("setup.card_search") ||
    effectTargets.has("setup.program_search") ||
    effectTargets.has("program_search") ||
    structuredSearchEffect
  );
}
