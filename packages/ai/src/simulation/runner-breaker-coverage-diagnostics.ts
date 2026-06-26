import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";

import type { AiSimulationSummary } from "./ai-simulation-summary";
import type {
  RunnerCoveragePressureForMetrics,
  RunnerPressureReadyForMetrics,
} from "./runner-pressure-metric-types";

export type RunnerBreakerCoverageDiagnosticsDependencies = {
  assessRunnerCoveragePressureForMetrics: (
    input: AiDecisionInput,
  ) => RunnerCoveragePressureForMetrics;
  assessRunnerPressureReadyForMetrics: (
    input: AiDecisionInput,
  ) => RunnerPressureReadyForMetrics;
  isRunnerEconomyAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  isRunnerRigInstallAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  runnerCoverageSearchActionForMetrics: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
};

export function createRunnerBreakerCoverageDiagnosticsForSimulationAction(
  dependencies: RunnerBreakerCoverageDiagnosticsDependencies,
) {
  return function runnerBreakerCoverageDiagnosticsForSimulationAction(
    input: AiDecisionInput,
    action: LegalAction,
    targetServerId: string | undefined,
  ): Partial<AiSimulationSummary["actionSequence"][number]> {
    if (input.side !== "runner" || action.side !== "runner") return {};
    const pressure = dependencies.assessRunnerCoveragePressureForMetrics(input);
    const pressureReady =
      dependencies.assessRunnerPressureReadyForMetrics(input);
    const pressureReadyTargetTypes = new Set(
      pressureReady.readyTargets.map((target) => target.targetType),
    );
    const selectedPressureReadyTarget =
      action.type === "start_run" &&
      targetServerId !== undefined &&
      pressureReady.readyTargets.some(
        (target) => target.serverId === targetServerId,
      );
    const setupContinuation =
      action.type === "draw_card" ||
      action.type === "gain_credit" ||
      dependencies.isRunnerEconomyAction(input, action) ||
      dependencies.runnerCoverageSearchActionForMetrics(input, action) ||
      (action.type === "install_card" &&
        dependencies.isRunnerRigInstallAction(input, action));
    const pressureReadyFlags = {
      ...(pressureReady.broadReady ? { runnerPressureReadyWindow: true } : {}),
      ...(pressureReady.readyTargets.length > 0
        ? { runnerPressureReadyTrue: true }
        : {}),
      ...(pressureReady.falsePositive
        ? { runnerPressureReadyFalsePositive: true }
        : {}),
      ...(pressureReadyTargetTypes.has("hq")
        ? { runnerPressureReadyByTargetHq: true }
        : {}),
      ...(pressureReadyTargetTypes.has("rnd")
        ? { runnerPressureReadyByTargetRnd: true }
        : {}),
      ...(pressureReadyTargetTypes.has("archives")
        ? { runnerPressureReadyByTargetArchives: true }
        : {}),
      ...(pressureReadyTargetTypes.has("remote")
        ? { runnerPressureReadyByTargetRemote: true }
        : {}),
      ...(pressureReady.readyTargets.length > 0 && setupContinuation
        ? {
            runnerSetupContinuedAfterPressureReady: true,
            runnerSetupLoopAfterPressureReady: true,
          }
        : {}),
      ...(selectedPressureReadyTarget
        ? { runnerPressureTakenAfterCoverageReady: true }
        : {}),
      ...(pressureReady.readyTargets.length > 0 && !selectedPressureReadyTarget
        ? {
            runnerPressureSkippedAfterCoverageReady: true,
            runnerPressureSkippedReason: setupContinuation
              ? ("better_immediate_action" as const)
              : ("no_valuable_target" as const),
          }
        : {}),
      ...(pressureReady.blockers.has("insufficient_credits")
        ? { runnerPhaseExitBlockedByCost: true }
        : {}),
      ...(pressureReady.blockers.has("missing_post_run_reserve")
        ? { runnerPhaseExitBlockedByCost: true }
        : {}),
      ...(pressure.missingBreakerRoles.size > 0
        ? { runnerPhaseExitBlockedByCoverage: true }
        : {}),
      ...(pressureReady.falsePositive ||
      pressureReady.blockers.has("no_valuable_target")
        ? { runnerPhaseExitBlockedByTargetValue: true }
        : {}),
    };
    if (pressure.missingBreakerRoles.size === 0) {
      const pressureRun =
        action.type === "start_run" &&
        targetServerId !== undefined &&
        selectedPressureReadyTarget;
      return {
        ...pressureReadyFlags,
        ...(pressureReady.readyTargets.length > 0 && setupContinuation
          ? {
              runnerCoverageReadyButNoPressure: true,
              runnerSetupContinuedAfterCoverageReady: true,
            }
          : {}),
        ...(pressureRun ? { runnerPhaseExitToPressure: true } : {}),
      };
    }
    const searchAvailable = pressure.searchActionIds.size > 0;
    const searchUsed =
      pressure.searchActionIds.has(action.actionId) ||
      pressure.recoveryActionIds.has(action.actionId);
    const installable = pressure.matchingInstallActionIds.size > 0;
    const breakerInstall =
      action.type === "install_card" &&
      pressure.matchingInstallActionIds.has(action.actionId);
    const pathBlocked = pressure.blockedServers.size > 0;
    const runTaken =
      action.type === "start_run" &&
      targetServerId !== undefined &&
      pressure.blockedServers.has(targetServerId);
    const setupAction =
      action.type === "draw_card" ||
      action.type === "gain_credit" ||
      dependencies.isRunnerEconomyAction(input, action) ||
      (action.type === "install_card" &&
        dependencies.isRunnerRigInstallAction(input, action));
    const pressureRun =
      action.type === "start_run" &&
      targetServerId !== undefined &&
      selectedPressureReadyTarget;

    return {
      ...pressureReadyFlags,
      runnerMissingBreakerCoverageByType: pressure.missingBreakerRoles.size,
      runnerVisibleIceBlockingByType: pressure.blockedServers.size,
      runnerKnownIceBlockingByType: pressure.knownIceBlockedServers.size,
      ...(pathBlocked ? { runnerPathBlockedByMissingCoverage: true } : {}),
      ...(installable ? { runnerInstallableBreakerForBlockedPath: true } : {}),
      ...(searchAvailable
        ? { runnerSearchCardAvailableForMissingBreaker: true }
        : {}),
      ...(searchUsed ? { runnerSearchCardUsedForMissingBreaker: true } : {}),
      ...(searchAvailable && !searchUsed
        ? { runnerSearchCardAvailableButUnused: true }
        : {}),
      ...(searchUsed && pressure.recoveryActionIds.has(action.actionId)
        ? { runnerTutorConvertedToBreakerInstall: true }
        : {}),
      ...(breakerInstall ? { runnerCoverageImproved: true } : {}),
      ...(breakerInstall ? { runnerTutorConvertedToBreakerInstall: true } : {}),
      ...(runTaken && pathBlocked
        ? { runnerProbeRevealedIceButDidNotReact: true }
        : {}),
      ...(searchUsed && pathBlocked
        ? { runnerProbeRevealedIceThenSearchedBreaker: true }
        : {}),
      ...(setupAction && pathBlocked
        ? { runnerSetupBreakerSearchStalled: true }
        : {}),
      ...(dependencies.isRunnerEconomyAction(input, action) && pathBlocked
        ? { runnerSetupEconomyStalled: true }
        : {}),
      ...(pressureRun ? { runnerPhaseExitToPressure: true } : {}),
    };
  };
}
