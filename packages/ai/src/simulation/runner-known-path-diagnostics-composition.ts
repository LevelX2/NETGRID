import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

import type { assessKnownRezzedIcePath } from "../visible-run-analysis";
import { createRunnerRemoteTrashAccessContext } from "./remote-trash-access-context";
import {
  createRunnerCoverageRepairDiagnostic,
  createRunnerKnownPathDiagnosticsForAction,
  createRunnerKnownNoAccessLegalRunTargets,
} from "./runner-known-no-access";
import {
  createRunnerSetupCoverageComposition,
  type RunnerSetupCoverageCompositionDependencies,
} from "./runner-setup-coverage-composition";

export type RunnerKnownPathDiagnosticsCompositionDependencies =
  RunnerSetupCoverageCompositionDependencies & {
  runnerCreditReserveTargetForInput: (input: AiDecisionInput) => number;
  runnerKnownPathAssessmentIsKnownNoAccess: (
    assessment: ReturnType<typeof assessKnownRezzedIcePath>,
  ) => boolean;
  runnerKnownPathAssessmentIsUnbreakableNoAccess: (
    assessment: ReturnType<typeof assessKnownRezzedIcePath>,
  ) => boolean;
  runnerRunTargetHasOnlyUnknownOrUnrezzedIce: (
    input: AiDecisionInput,
    serverId: string,
  ) => boolean;
  remoteServerHasScoreThreat: (
    input: AiDecisionInput,
    serverId: string,
  ) => boolean;
  runnerHasRecentRunOnServer: (
    input: AiDecisionInput,
    serverId: string,
  ) => boolean;
  runnerRemoteHasKnownRelevantTrashTarget: (
    input: AiDecisionInput,
    serverId: string,
  ) => boolean;
};

export function createRunnerKnownPathDiagnosticsComposition(
  dependencies: RunnerKnownPathDiagnosticsCompositionDependencies,
) {
  const {
    runnerRunKnownPathCost,
    runnerHasKnownUnaffordableLegalRun,
    runnerVisibleMissingBreakerCoverage,
    runnerMissingCoverageTypesForInput,
    runnerHasKnownBlockedPathByCoverage,
    runnerCoverageSearchActionForMetrics,
    runnerCoverageRecoveryActionForMetrics,
  } = createRunnerSetupCoverageComposition({
    assessKnownRezzedIcePath: dependencies.assessKnownRezzedIcePath,
    findVisibleCard: dependencies.findVisibleCard,
    rolesForAction: dependencies.rolesForAction,
    rolesForCardId: dependencies.rolesForCardId,
  });

  const runnerRemoteTrashAccessContext = createRunnerRemoteTrashAccessContext({
    runnerCreditReserveTargetForInput:
      dependencies.runnerCreditReserveTargetForInput,
  });

  const runnerKnownNoAccessLegalRunTargets =
    createRunnerKnownNoAccessLegalRunTargets({
      assessKnownRezzedIcePath: dependencies.assessKnownRezzedIcePath,
      runnerKnownPathAssessmentIsKnownNoAccess:
        dependencies.runnerKnownPathAssessmentIsKnownNoAccess,
      runnerRunTargetHasOnlyUnknownOrUnrezzedIce:
        dependencies.runnerRunTargetHasOnlyUnknownOrUnrezzedIce,
    });

  const runnerCoverageRepairDiagnostic = createRunnerCoverageRepairDiagnostic({
    runnerKnownNoAccessLegalRunTargets,
    findVisibleCard: dependencies.findVisibleCard,
    rolesForCardId: dependencies.rolesForCardId,
  });

  const runnerKnownPathDiagnosticsForAction =
    createRunnerKnownPathDiagnosticsForAction({
      assessKnownRezzedIcePath: dependencies.assessKnownRezzedIcePath,
      remoteServerHasScoreThreat: dependencies.remoteServerHasScoreThreat,
      rolesForAction: dependencies.rolesForAction,
      rolesForCardId: dependencies.rolesForCardId,
      runnerCoverageRepairDiagnostic,
      runnerHasRecentRunOnServer: dependencies.runnerHasRecentRunOnServer,
      runnerKnownPathAssessmentIsKnownNoAccess:
        dependencies.runnerKnownPathAssessmentIsKnownNoAccess,
      runnerKnownPathAssessmentIsUnbreakableNoAccess:
        dependencies.runnerKnownPathAssessmentIsUnbreakableNoAccess,
      runnerRemoteHasKnownRelevantTrashTarget:
        dependencies.runnerRemoteHasKnownRelevantTrashTarget,
      runnerRunTargetHasOnlyUnknownOrUnrezzedIce:
        dependencies.runnerRunTargetHasOnlyUnknownOrUnrezzedIce,
    });

  return {
    runnerRunKnownPathCost,
    runnerHasKnownUnaffordableLegalRun,
    runnerVisibleMissingBreakerCoverage,
    runnerMissingCoverageTypesForInput,
    runnerHasKnownBlockedPathByCoverage,
    runnerCoverageSearchActionForMetrics,
    runnerCoverageRecoveryActionForMetrics,
    runnerRemoteTrashAccessContext,
    runnerKnownNoAccessLegalRunTargets,
    runnerCoverageRepairDiagnostic,
    runnerKnownPathDiagnosticsForAction,
  };
}
