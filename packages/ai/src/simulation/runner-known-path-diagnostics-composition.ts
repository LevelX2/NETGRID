import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

import {
  createRunnerEncounterCompositionContext,
  type RunnerEncounterCompositionContextDependencies,
} from "../runtime/runner-encounter-composition-context";
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
  Omit<RunnerSetupCoverageCompositionDependencies, "findVisibleCard"> & {
    findVisibleCard: (
      input: AiDecisionInput,
      instanceId: string,
    ) => VisibleCard | undefined;
  } &
    Omit<
      RunnerEncounterCompositionContextDependencies,
      "rolesForCardId" | "assessKnownRezzedIcePath" | "findVisibleCard"
    > & {
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
    runnerCreditReserveTargetForInput,
    encounterBreakReserveContext,
    breakAccessPathAssessment,
    pumpViabilityAssessment,
  } = createRunnerEncounterCompositionContext({
    rolesForCardId: dependencies.rolesForCardId,
    actionCreditCost: dependencies.actionCreditCost,
    findVisibleCard: dependencies.findVisibleCard,
    breakSubroutineIndexesForAction:
      dependencies.breakSubroutineIndexesForAction,
    currentEncounteredIceCard: dependencies.currentEncounteredIceCard,
    assessKnownRezzedIcePath: dependencies.assessKnownRezzedIcePath,
    knownIcePathReason: dependencies.knownIcePathReason,
    isRemoteServerTarget: dependencies.isRemoteServerTarget,
    definitionType: dependencies.definitionType,
    remoteRootTrashCost: dependencies.remoteRootTrashCost,
    encounterRunRemainderEffectAssessment:
      dependencies.encounterRunRemainderEffectAssessment,
    encounterHasImmediateUnbrokenThreat:
      dependencies.encounterHasImmediateUnbrokenThreat,
  });

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
    runnerCreditReserveTargetForInput,
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
    runnerCreditReserveTargetForInput,
    encounterBreakReserveContext,
    breakAccessPathAssessment,
    pumpViabilityAssessment,
    runnerRunKnownPathCost,
    runnerHasKnownUnaffordableLegalRun,
    runnerVisibleMissingBreakerCoverage,
    runnerMissingCoverageTypesForInput,
    runnerHasKnownBlockedPathByCoverage,
    runnerCoverageSearchActionForMetrics,
    runnerCoverageRecoveryActionForMetrics,
    runnerRemoteTrashAccessContext,
    runnerKnownPathDiagnosticsForAction,
  };
}
