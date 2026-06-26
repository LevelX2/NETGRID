import type { AiDecisionInput } from "@netgrid/shared";

import type { CentralServerId } from "../runtime/server-target";
import type { assessKnownRezzedIcePath } from "../visible-run-analysis";
import { createRunnerCentralRunPressureJustificationContext } from "./central-run-pressure-justification";
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
  trueCentralCloseoutProfileForMetrics: (
    input: AiDecisionInput,
    target: CentralServerId,
  ) => { opportunity: boolean };
};

export function createRunnerRemoteThreatTargetingComposition(
  dependencies: RunnerRemoteThreatTargetingCompositionDependencies,
) {
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
    trueCentralCloseoutProfileForMetrics:
      dependencies.trueCentralCloseoutProfileForMetrics,
  });

  const runnerRemoteThreatTargetingDiagnosticsForAction =
    createRunnerRemoteThreatTargetingDiagnosticsForAction({
      runnerRemoteThreatProfile,
      runnerCentralRunHasClearPressureJustification,
      runnerCentralRunPressureJustificationReasons,
      runnerCentralRunBurnsRemoteContestReserve,
    });

  return {
    runnerRemoteThreatProfile,
    runnerRemoteThreatTargetingDiagnosticsForAction,
  };
}
