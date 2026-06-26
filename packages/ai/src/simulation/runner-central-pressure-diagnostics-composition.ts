import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import type { CentralServerId } from "../runtime/server-target";
import type { assessKnownRezzedIcePath } from "../visible-run-analysis";
import { createRunnerCentralPressureDiagnosticsForSimulationAction } from "./runner-central-pressure-diagnostics";
import {
  createNoFreshCentralSubstitutionTypeForAction,
  createRunnerNoFreshCentralContext,
} from "./no-fresh-central";
import {
  createRunnerRemoteThreatTargetingComposition,
  type RunnerRemoteThreatTargetingCompositionDependencies,
} from "./runner-remote-threat-targeting-composition";

export type RunnerCentralPressureDiagnosticsCompositionDependencies =
  RunnerRemoteThreatTargetingCompositionDependencies & {
  isRunnerEconomyAction: (input: AiDecisionInput, action: LegalAction) => boolean;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  centralRunStreakWithoutValueForMetrics: (
    input: AiDecisionInput,
    serverId: CentralServerId,
  ) => number;
};

export function createRunnerCentralPressureDiagnosticsComposition(
  dependencies: RunnerCentralPressureDiagnosticsCompositionDependencies,
) {
  const {
    bestTrueCentralCloseoutProfileForMetrics,
    trueCentralCloseoutProfileForMetrics,
    runnerRemoteThreatProfile,
    runnerRemoteThreatTargetingDiagnosticsForAction,
  } = createRunnerRemoteThreatTargetingComposition({
    assessKnownRezzedIcePath: dependencies.assessKnownRezzedIcePath,
    recentCentralRunSameTargetWithoutRefresh:
      dependencies.recentCentralRunSameTargetWithoutRefresh,
    remoteServerHasScoreThreat: dependencies.remoteServerHasScoreThreat,
    rolesForCardId: dependencies.rolesForCardId,
    runnerCreditReserveTargetForInput:
      dependencies.runnerCreditReserveTargetForInput,
    sourceDefinitionIdForSimulationAction:
      dependencies.sourceDefinitionIdForSimulationAction,
  });

  const noFreshCentralSubstitutionTypeForAction =
    createNoFreshCentralSubstitutionTypeForAction({
      isRunnerEconomyAction: dependencies.isRunnerEconomyAction,
      rolesForAction: dependencies.rolesForAction,
      sourceDefinitionIdForAction:
        dependencies.sourceDefinitionIdForSimulationAction,
    });

  const runnerNoFreshCentralContextForMetrics =
    createRunnerNoFreshCentralContext({
      assessKnownRezzedIcePath: dependencies.assessKnownRezzedIcePath,
      centralRunStreakWithoutValueForMetrics:
        dependencies.centralRunStreakWithoutValueForMetrics,
      isRunnerEconomyAction: dependencies.isRunnerEconomyAction,
      rolesForAction: dependencies.rolesForAction,
      rolesForCardId: dependencies.rolesForCardId,
      runnerCreditReserveTargetForInput:
        dependencies.runnerCreditReserveTargetForInput,
      runnerRemoteThreatProfile,
      sourceDefinitionIdForAction:
        dependencies.sourceDefinitionIdForSimulationAction,
    });

  const runnerCentralPressureDiagnosticsForSimulationAction =
    createRunnerCentralPressureDiagnosticsForSimulationAction({
      rolesForCardId: dependencies.rolesForCardId,
      sourceDefinitionIdForSimulationAction:
        dependencies.sourceDefinitionIdForSimulationAction,
      bestTrueCentralCloseoutProfileForMetrics:
        bestTrueCentralCloseoutProfileForMetrics,
      trueCentralCloseoutProfileForMetrics:
        trueCentralCloseoutProfileForMetrics,
      runnerNoFreshCentralContextForMetrics,
      noFreshCentralSubstitutionTypeForAction,
      runnerCreditReserveTargetForInput:
        dependencies.runnerCreditReserveTargetForInput,
      assessKnownRezzedIcePath: dependencies.assessKnownRezzedIcePath,
    });

  return {
    bestTrueCentralCloseoutProfileForMetrics,
    runnerRemoteThreatTargetingDiagnosticsForAction,
    runnerCentralPressureDiagnosticsForSimulationAction,
  };
}
