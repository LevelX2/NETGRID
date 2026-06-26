import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import type { CentralServerId } from "../runtime/server-target";
import type { assessKnownRezzedIcePath } from "../visible-run-analysis";
import { createRunnerCentralRunPressureJustificationContext } from "./central-run-pressure-justification";
import {
  createTrueCentralCloseoutProfileContext,
  type BestTrueCentralCloseoutProfile,
  type TrueCentralCloseoutProfile,
} from "./no-fresh-central";
import {
  createRunnerRemoteThreatProfile,
  createRunnerRemoteThreatTargetingDiagnosticsForAction,
} from "./remote-server-threat";
import { createRunnerPostRunReserveTargetForRemoteInput } from "./runner-credit-reserve";

export type RunnerRemoteThreatTargetingCompositionDependencies = {
  assessKnownRezzedIcePath: typeof assessKnownRezzedIcePath;
  recentCentralRunSameTargetWithoutRefresh: (
    input: AiDecisionInput,
    target: CentralServerId,
  ) => boolean;
  remoteServerHasScoreThreat: (
    input: AiDecisionInput,
    serverId: string,
  ) => boolean;
  rolesForCardId: (definitionId: string | undefined) => string[];
  runnerCreditReserveTargetForInput: (input: AiDecisionInput) => number;
  sourceDefinitionIdForSimulationAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
};

export function createRunnerRemoteThreatTargetingComposition(
  dependencies: RunnerRemoteThreatTargetingCompositionDependencies,
) {
  const {
    bestTrueCentralCloseoutProfile:
      bestTrueCentralCloseoutProfileForMetrics,
    trueCentralCloseoutProfile: trueCentralCloseoutProfileForMetrics,
  }: {
    bestTrueCentralCloseoutProfile: (
      input: AiDecisionInput,
    ) => BestTrueCentralCloseoutProfile;
    trueCentralCloseoutProfile: (
      input: AiDecisionInput,
      target: CentralServerId,
    ) => TrueCentralCloseoutProfile;
  } = createTrueCentralCloseoutProfileContext({
    assessKnownRezzedIcePath: dependencies.assessKnownRezzedIcePath,
    rolesForCardId: dependencies.rolesForCardId,
    sourceDefinitionIdForAction:
      dependencies.sourceDefinitionIdForSimulationAction,
  });

  const runnerPostRunReserveTargetForRemoteInput =
    createRunnerPostRunReserveTargetForRemoteInput({
      remoteServerHasScoreThreat: dependencies.remoteServerHasScoreThreat,
      rolesForCardId: dependencies.rolesForCardId,
    });

  const runnerRemoteThreatProfile = createRunnerRemoteThreatProfile({
    runnerPostRunReserveTargetForRemoteInput,
  });

  const {
    runnerCentralRunHasClearPressureJustification,
    runnerCentralRunPressureJustificationReasons,
    runnerCentralRunBurnsRemoteContestReserve,
  } = createRunnerCentralRunPressureJustificationContext({
    assessKnownRezzedIcePath: dependencies.assessKnownRezzedIcePath,
    recentCentralRunSameTargetWithoutRefresh:
      dependencies.recentCentralRunSameTargetWithoutRefresh,
    rolesForCardId: dependencies.rolesForCardId,
    runnerCreditReserveTargetForInput:
      dependencies.runnerCreditReserveTargetForInput,
    trueCentralCloseoutProfileForMetrics,
  });

  const runnerRemoteThreatTargetingDiagnosticsForAction =
    createRunnerRemoteThreatTargetingDiagnosticsForAction({
      runnerRemoteThreatProfile,
      runnerCentralRunHasClearPressureJustification,
      runnerCentralRunPressureJustificationReasons,
      runnerCentralRunBurnsRemoteContestReserve,
    });

  return {
    bestTrueCentralCloseoutProfileForMetrics,
    trueCentralCloseoutProfileForMetrics,
    runnerRemoteThreatProfile,
    runnerRemoteThreatTargetingDiagnosticsForAction,
  };
}
