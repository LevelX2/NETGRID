import {
  type AiDecisionInput,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";

import { actionCreditCost } from "../runtime/action-cost";
import { isRemoteServerTarget } from "../runtime/server-target";
import type { AiSimulationSummary } from "./ai-simulation-summary";

type RunnerActionDiagnostics = Partial<
  AiSimulationSummary["actionSequence"][number]
> & {
  probeRunWithPositiveInfoValue?: boolean;
  lowValueUnaffordableRun?: boolean;
  runnerCentralRunStartedBelowReserve?: boolean;
  runStartedAgainstKnownUnaffordablePath?: boolean;
};

export type RunnerReserveDiagnosticsDependencies = {
  runnerCreditReserveTargetForInput: (input: AiDecisionInput) => number;
  isRunnerEconomyAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  runnerKnownPathDiagnosticsForAction: (
    input: AiDecisionInput,
    action: LegalAction,
    targetServerId: string | undefined,
    reserveTarget: number,
  ) => RunnerActionDiagnostics;
  runnerRemoteThreatTargetingDiagnosticsForAction: (
    input: AiDecisionInput,
    action: LegalAction,
    targetServerId: string | undefined,
  ) => Partial<AiSimulationSummary["actionSequence"][number]>;
  isRunnerLowValueDuplicateInstall: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  runnerHasVisibleRemoteScoreThreat: (input: AiDecisionInput) => boolean;
  runnerRemoteTrashAccessContext: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => { role?: string };
  runnerTrashBlockedByCredits: (input: AiDecisionInput) => boolean;
  runnerStealBlockedByCredits: (
    input: AiDecisionInput,
    reserveTarget: number,
  ) => boolean;
  runnerContestBlockedByCredits: (
    input: AiDecisionInput,
    reserveTarget: number,
  ) => boolean;
};

export function createRunnerReserveDiagnosticsForSimulationAction(
  dependencies: RunnerReserveDiagnosticsDependencies,
) {
  return function runnerReserveDiagnosticsForSimulationAction(
    input: AiDecisionInput,
    action: LegalAction,
    targetServerId: string | undefined,
    stateAfterAction: GameState,
  ): Partial<AiSimulationSummary["actionSequence"][number]> {
    if (input.side !== "runner" || action.side !== "runner") return {};
    const creditsBefore = input.playerView.own.credits;
    const creditsAfter = stateAfterAction.runner.credits;
    const creditDelta = creditsAfter - creditsBefore;
    const reserveTarget = dependencies.runnerCreditReserveTargetForInput(input);
    const belowBefore = creditsBefore < reserveTarget;
    const belowAfter = creditsAfter < reserveTarget;
    const economyAction = dependencies.isRunnerEconomyAction(input, action);
    const economyGain = economyAction && creditDelta > 0 ? creditDelta : 0;
    const economySpend =
      economyAction && creditDelta < 0 ? Math.abs(creditDelta) : 0;
    const runDiagnostics = dependencies.runnerKnownPathDiagnosticsForAction(
      input,
      action,
      targetServerId,
      reserveTarget,
    );
    const remoteThreatTargeting =
      dependencies.runnerRemoteThreatTargetingDiagnosticsForAction(
        input,
        action,
        targetServerId,
      );
    const spendBelowReserve =
      creditDelta < 0 &&
      belowAfter &&
      !runDiagnostics.probeRunWithPositiveInfoValue;
    const installCost =
      action.type === "install_card" ? actionCreditCost(action) : 0;
    const lowValueSpendBelowReserve =
      spendBelowReserve &&
      (dependencies.isRunnerLowValueDuplicateInstall(input, action) ||
        (action.type === "start_run" &&
          (runDiagnostics.lowValueUnaffordableRun ||
            (runDiagnostics.runnerCentralRunStartedBelowReserve &&
              dependencies.runnerHasVisibleRemoteScoreThreat(input)))) ||
        (action.type === "trash_accessed_card" &&
          dependencies.runnerRemoteTrashAccessContext(input, action).role ===
            "low_value"));
    const expensiveInstallBelowReserve =
      action.type === "install_card" && installCost >= 3 && belowAfter;
    const trashBlockedByCredits =
      dependencies.runnerTrashBlockedByCredits(input);
    const stealBlockedByCredits = dependencies.runnerStealBlockedByCredits(
      input,
      reserveTarget,
    );
    const contestBlockedByCredits =
      dependencies.runnerContestBlockedByCredits(input, reserveTarget) ||
      runDiagnostics.runStartedAgainstKnownUnaffordablePath === true;
    const reserveAfterAccess = [
      "access_card",
      "steal_agenda",
      "trash_accessed_card",
      "decline_trash",
    ].includes(action.type)
      ? creditsAfter - reserveTarget
      : undefined;
    const accessTarget = targetServerId ?? input.playerView.run?.attackedServerId;

    return {
      runnerCreditsBefore: creditsBefore,
      runnerCreditsAfter: creditsAfter,
      runnerCreditDelta: creditDelta,
      runnerReserveTarget: reserveTarget,
      ...(belowBefore ? { runnerBelowReserveBefore: true } : {}),
      ...(belowAfter ? { runnerBelowReserveAfter: true } : {}),
      ...(economyGain > 0 ? { runnerEconomyCreditsGained: economyGain } : {}),
      ...(economySpend > 0 ? { runnerEconomyCreditsSpent: economySpend } : {}),
      ...(economyAction && economyGain > 0 && belowBefore
        ? { runnerReservePreservingEconomy: true }
        : {}),
      ...(contestBlockedByCredits
        ? { runnerContestBlockedByCredits: true }
        : {}),
      ...(trashBlockedByCredits ? { runnerTrashBlockedByCredits: true } : {}),
      ...(stealBlockedByCredits ? { runnerStealBlockedByCredits: true } : {}),
      ...(spendBelowReserve ? { runnerSpendBelowReserve: true } : {}),
      ...(lowValueSpendBelowReserve
        ? { runnerLowValueSpendBelowReserve: true }
        : {}),
      ...(expensiveInstallBelowReserve
        ? { runnerExpensiveInstallBelowReserve: true }
        : {}),
      ...(reserveAfterAccess !== undefined
        ? { runnerReserveAfterSuccessfulRun: reserveAfterAccess }
        : {}),
      ...(reserveAfterAccess !== undefined && isRemoteServerTarget(accessTarget)
        ? { runnerReserveAfterRemoteAccess: reserveAfterAccess }
        : {}),
      ...(reserveAfterAccess !== undefined &&
      (accessTarget === "hq" ||
        accessTarget === "rd" ||
        accessTarget === "archives")
        ? { runnerReserveAfterCentralRun: reserveAfterAccess }
        : {}),
      ...runDiagnostics,
      ...remoteThreatTargeting,
    };
  };
}
