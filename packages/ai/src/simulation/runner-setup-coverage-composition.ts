import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

import type { assessKnownRezzedIcePath } from "../visible-run-analysis";
import { createRunnerKnownPathCostContext } from "./runner-known-no-access";
import {
  createRunnerCoverageActionContext,
  createRunnerSetupCoverageContext,
} from "./runner-setup-coverage-types";

export type RunnerSetupCoverageCompositionDependencies = {
  assessKnownRezzedIcePath: typeof assessKnownRezzedIcePath;
  findVisibleCard: (
    input: AiDecisionInput,
    cardId: string,
  ) => Pick<VisibleCard, "definitionId"> | undefined;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  rolesForCardId: (definitionId: string | undefined) => string[];
};

export function createRunnerSetupCoverageComposition(
  dependencies: RunnerSetupCoverageCompositionDependencies,
) {
  const { runnerRunKnownPathCost, runnerHasKnownUnaffordableLegalRun } =
    createRunnerKnownPathCostContext({
      assessKnownRezzedIcePath: dependencies.assessKnownRezzedIcePath,
    });

  const {
    runnerVisibleMissingBreakerCoverage,
    runnerMissingCoverageTypesForInput,
    runnerHasKnownBlockedPathByCoverage,
  } = createRunnerSetupCoverageContext({
    assessKnownRezzedIcePath: dependencies.assessKnownRezzedIcePath,
    rolesForCardId: dependencies.rolesForCardId,
  });

  const {
    runnerCoverageSearchActionForMetrics,
    runnerCoverageRecoveryActionForMetrics,
  } = createRunnerCoverageActionContext({
    findVisibleCard: dependencies.findVisibleCard,
    rolesForAction: dependencies.rolesForAction,
  });

  return {
    runnerRunKnownPathCost,
    runnerHasKnownUnaffordableLegalRun,
    runnerVisibleMissingBreakerCoverage,
    runnerMissingCoverageTypesForInput,
    runnerHasKnownBlockedPathByCoverage,
    runnerCoverageSearchActionForMetrics,
    runnerCoverageRecoveryActionForMetrics,
  };
}
