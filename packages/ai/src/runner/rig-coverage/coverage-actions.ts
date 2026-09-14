import { runnerCandidateSourceDefinitionId } from "../../runtime/runner-action-source-facts";
import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { rolesForDeckDoctrineCard } from "../../deck-doctrine-card-roles";
import { runnerInstallDefinitionCoversCoverageGap } from "./coverage-plan-module";
import { type RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";
import { runnerAffordableCoverageSearchActionIds } from "./coverage-search-alternatives";
export function runnerCoverageOwnedActionIds(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  coverageGaps: readonly RunnerCoverageGapSignal[],
): Set<string> {
  return new Set(
    coverageGaps.flatMap((gap) => {
      const preparationActionIds = gap.preparationActionIds ?? [];
      if (preparationActionIds.length > 0) {
        return preparationActionIds;
      }
      if (!gap.answerInHand) {
        return [
          ...preparationActionIds,
          ...(gap.directSearchActionIds ?? []),
          ...(gap.searchEngineSetupActionIds ?? []),
          ...(gap.drawForAnswerActionIds ?? []),
        ];
      }
      return [
        ...preparationActionIds,
        ...runnerAffordableCoverageSearchActionIds(input, candidates, gap),
        ...candidates
          .filter((candidate) => {
            if (candidate.semanticActionType !== "install.card") return false;
            if (
              gap.installActionIds !== undefined &&
              !gap.installActionIds.includes(candidate.actionId)
            ) {
              return false;
            }
            const sourceDefinitionId = runnerCandidateSourceDefinitionId(
              input,
              candidate,
            );
            return (
              sourceDefinitionId !== undefined &&
              runnerInstallDefinitionCoversCoverageGap(
                sourceDefinitionId,
                rolesForDeckDoctrineCard(sourceDefinitionId),
                gap.requiredRole,
              )
            );
          })
          .map((candidate) => candidate.actionId),
      ];
    }),
  );
}

export function runnerDrawActionHasCurrentCoveragePurpose(
  candidate: ActionSemanticCandidate,
  domain: { coverageGaps: readonly RunnerCoverageGapSignal[] },
): boolean {
  return domain.coverageGaps.some(
    (gap) =>
      !gap.answerInHand &&
      gap.deckHasAnswer &&
      gap.drawForAnswerActionIds.includes(candidate.actionId),
  );
}
