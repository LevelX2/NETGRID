import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import type { CentralServerId } from "../runtime/server-target";
import type { assessKnownRezzedIcePath } from "../visible-run-analysis";
import { createRunnerCentralPressureDiagnosticsForSimulationAction } from "./runner-central-pressure-diagnostics";
import {
  createNoFreshCentralSubstitutionTypeForAction,
  createRunnerNoFreshCentralContext,
  type BestTrueCentralCloseoutProfile,
  type TrueCentralCloseoutProfile,
} from "./no-fresh-central";
import type { RunnerRemoteThreatProfile } from "./remote-server-threat";

export type RunnerCentralPressureDiagnosticsCompositionDependencies = {
  isRunnerEconomyAction: (input: AiDecisionInput, action: LegalAction) => boolean;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  rolesForCardId: (definitionId: string | undefined) => string[];
  sourceDefinitionIdForSimulationAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  assessKnownRezzedIcePath: typeof assessKnownRezzedIcePath;
  centralRunStreakWithoutValueForMetrics: (
    input: AiDecisionInput,
    serverId: CentralServerId,
  ) => number;
  runnerCreditReserveTargetForInput: (input: AiDecisionInput) => number;
  runnerRemoteThreatProfile: (
    input: AiDecisionInput,
    serverId: string,
  ) => RunnerRemoteThreatProfile;
  bestTrueCentralCloseoutProfileForMetrics: (
    input: AiDecisionInput,
  ) => BestTrueCentralCloseoutProfile;
  trueCentralCloseoutProfileForMetrics: (
    input: AiDecisionInput,
    serverId: CentralServerId,
  ) => TrueCentralCloseoutProfile;
};

export function createRunnerCentralPressureDiagnosticsComposition(
  dependencies: RunnerCentralPressureDiagnosticsCompositionDependencies,
) {
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
      runnerRemoteThreatProfile: dependencies.runnerRemoteThreatProfile,
      sourceDefinitionIdForAction:
        dependencies.sourceDefinitionIdForSimulationAction,
    });

  const runnerCentralPressureDiagnosticsForSimulationAction =
    createRunnerCentralPressureDiagnosticsForSimulationAction({
      rolesForCardId: dependencies.rolesForCardId,
      sourceDefinitionIdForSimulationAction:
        dependencies.sourceDefinitionIdForSimulationAction,
      bestTrueCentralCloseoutProfileForMetrics:
        dependencies.bestTrueCentralCloseoutProfileForMetrics,
      trueCentralCloseoutProfileForMetrics:
        dependencies.trueCentralCloseoutProfileForMetrics,
      runnerNoFreshCentralContextForMetrics,
      noFreshCentralSubstitutionTypeForAction,
      runnerCreditReserveTargetForInput:
        dependencies.runnerCreditReserveTargetForInput,
      assessKnownRezzedIcePath: dependencies.assessKnownRezzedIcePath,
    });

  return {
    noFreshCentralSubstitutionTypeForAction,
    runnerNoFreshCentralContextForMetrics,
    runnerCentralPressureDiagnosticsForSimulationAction,
  };
}
