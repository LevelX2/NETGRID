import { runnerGeneralCreditsAfterCompletedPath } from "../run-analysis/visible-run-credit-budget";
import { quoteVisibleRunnerPathForMetrics } from "./visible-run-path-for-metrics";
import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";

import {
  centralServerId,
  type CentralServerId,
} from "../runtime/server-target";
import { rolesMatch } from "../role-match";
import type { assessKnownRezzedIcePath } from "../visible-run-analysis";
import type {
  BestTrueCentralCloseoutProfile,
  NoFreshCentralSubstitutionType,
  RunnerNoFreshCentralContext,
  TrueCentralCloseoutProfile,
} from "./no-fresh-central";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import {
  centralPressureTargetIsGoodForMetrics,
  centralPressureTargetsForCard,
  isCentralPressureCardForMetrics,
} from "./central-pressure-card";
import {
  centralRepeatHasFreshValueForMetrics,
  centralRunStreakWithoutValueForMetrics,
} from "./central-run-history";
import { runnerHqMemoryDiagnosticsForMetrics } from "./runner-hq-memory-diagnostics";
import { runnerKnownCardPositionDiagnosticsForMetrics } from "./runner-known-card-position-diagnostics";

export type RunnerCentralPressureDiagnosticsDependencies = {
  rolesForCardId: (definitionId: number | undefined) => string[];
  sourceDefinitionIdForSimulationAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => number | undefined;
  bestTrueCentralCloseoutProfileForMetrics: (
    input: AiDecisionInput,
  ) => BestTrueCentralCloseoutProfile;
  trueCentralCloseoutProfileForMetrics: (
    input: AiDecisionInput,
    target: CentralServerId,
  ) => TrueCentralCloseoutProfile;
  runnerNoFreshCentralContextForMetrics: (
    input: AiDecisionInput,
  ) => RunnerNoFreshCentralContext;
  noFreshCentralSubstitutionTypeForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => NoFreshCentralSubstitutionType | undefined;
  runnerCreditReserveTargetForInput: (input: AiDecisionInput) => number;
  assessKnownRezzedIcePath: typeof assessKnownRezzedIcePath;
};

export function createRunnerCentralPressureDiagnosticsForSimulationAction(
  dependencies: RunnerCentralPressureDiagnosticsDependencies,
) {
  return function runnerCentralPressureDiagnosticsForSimulationAction(
    input: AiDecisionInput,
    action: LegalAction,
    targetServerId: string | undefined,
  ): Partial<AiSimulationSummary["actionSequence"][number]> {
    if (input.side !== "runner" || action.side !== "runner") return {};
    const centralTarget = centralServerId(
      targetServerId ?? input.playerView.run?.attackedServerId,
    );
    const installedInterfaceTargets = new Set(
      (input.playerView.own.rig ?? [])
        .filter((card) =>
          isCentralPressureCardForMetrics(card.definitionId, true),
        )
        .flatMap((card) => centralPressureTargetsForCard(card.definitionId)),
    );
    const hasAnyInstalledInterface = installedInterfaceTargets.size > 0;
    const sourceDefinitionId =
      dependencies.sourceDefinitionIdForSimulationAction(input, action);
    const eventTargets =
      action.type === "play_event"
        ? centralPressureTargetsForCard(sourceDefinitionId)
        : [];
    const eventGoodTarget = eventTargets.some((target) =>
      centralPressureTargetIsGoodForMetrics(input, target),
    );
    const interfaceInstallOpportunity = input.legalActions.some((candidate) => {
      if (candidate.type !== "install_card") return false;
      const definitionId = dependencies.sourceDefinitionIdForSimulationAction(
        input,
        candidate,
      );
      return isCentralPressureCardForMetrics(definitionId, true);
    });
    const interfaceInstallTaken =
      action.type === "install_card" &&
      isCentralPressureCardForMetrics(sourceDefinitionId, true);
    const closeoutOpportunityRaw =
      input.playerView.agendaPointsToWin - input.playerView.own.agendaPoints <=
        2 &&
      (centralTarget !== undefined ||
        (["hq", "rd"] as const).some((target) =>
          centralPressureTargetIsGoodForMetrics(input, target),
        ));
    const trueCloseout = centralTarget
      ? dependencies.trueCentralCloseoutProfileForMetrics(input, centralTarget)
      : dependencies.bestTrueCentralCloseoutProfileForMetrics(input);
    const centralRun =
      action.type === "start_run" && centralTarget !== undefined;
    const matchingInterface =
      centralTarget !== undefined &&
      installedInterfaceTargets.has(centralTarget);
    const anyMultiaccessInstalled = (input.playerView.own.rig ?? []).some(
      (card) =>
        rolesMatch(dependencies.rolesForCardId(card.definitionId), [
          "multiaccess",
        ]),
    );
    const streakWithoutValue = centralRun
      ? centralRunStreakWithoutValueForMetrics(input, centralTarget)
      : 0;
    const repeatWindow = streakWithoutValue > 0;
    const repeatWithFreshValue =
      repeatWindow &&
      centralRun &&
      centralRepeatHasFreshValueForMetrics(input, centralTarget, {
        matchingInterface,
        anyMultiaccessInstalled,
        eventGoodTarget,
        trueCloseout: trueCloseout.opportunity,
      });
    const repeatedLowValue = repeatWindow && !repeatWithFreshValue;
    const noFresh = dependencies.runnerNoFreshCentralContextForMetrics(input);
    const noFreshRunTaken =
      centralRun &&
      centralTarget !== undefined &&
      noFresh.targets.includes(centralTarget);
    const substitutionType =
      noFresh.targets.length > 0 && !noFreshRunTaken
        ? dependencies.noFreshCentralSubstitutionTypeForAction(input, action)
        : undefined;
    const reserveTarget = centralRun
      ? dependencies.runnerCreditReserveTargetForInput(input)
      : 0;
    const server =
      centralRun && reserveTarget > 0
        ? input.playerView.servers.find(
            (candidate) => candidate.id === centralTarget,
          )
        : undefined;
    const path = server
      ? quoteVisibleRunnerPathForMetrics(
          input,
          server,
          dependencies.assessKnownRezzedIcePath,
        )
      : undefined;
    const insufficientReserve =
      path?.canReachAccess === true &&
      runnerGeneralCreditsAfterCompletedPath(path.creditBudgetAfterPath) <
        reserveTarget;
    const hqMemoryDiagnostics = runnerHqMemoryDiagnosticsForMetrics(
      input,
      centralRun,
      centralTarget,
    );
    const knownCardPositionDiagnostics =
      runnerKnownCardPositionDiagnosticsForMetrics(
        input,
        action,
        targetServerId,
      );
    return {
      ...hqMemoryDiagnostics,
      ...knownCardPositionDiagnostics,
      ...(centralRun && (matchingInterface || anyMultiaccessInstalled)
        ? { runnerCentralRunWithMultiaccess: true }
        : {}),
      ...(centralRun && hasAnyInstalledInterface
        ? { runnerCentralRunWithInterfaceInstalled: true }
        : {}),
      ...(centralRun &&
      centralTarget === "hq" &&
      installedInterfaceTargets.has("hq")
        ? { runnerHqRunWithHqInterface: true }
        : {}),
      ...(centralRun &&
      centralTarget === "rd" &&
      installedInterfaceTargets.has("rd")
        ? { runnerRndRunWithRndInterface: true }
        : {}),
      ...(action.type === "play_event" && eventTargets.length > 0
        ? { runnerCentralRunEventPlayed: true }
        : {}),
      ...(action.type === "play_event" && eventGoodTarget
        ? { runnerCentralRunEventWithGoodTarget: true }
        : {}),
      ...(repeatedLowValue ? { runnerRepeatedLowValueCentralRun: true } : {}),
      ...(repeatWindow ? { runnerCentralRunRepeatWindow: true } : {}),
      ...(repeatWithFreshValue
        ? { runnerRepeatedCentralRunWithFreshValue: true }
        : {}),
      ...(repeatWindow && !repeatWithFreshValue
        ? { runnerRepeatedCentralRunWithoutFreshValue: true }
        : {}),
      ...(repeatedLowValue
        ? { runnerCentralRunStalePenaltyApplied: true }
        : {}),
      ...(streakWithoutValue > 0
        ? { runnerCentralRunStreakWithoutValue: streakWithoutValue }
        : {}),
      ...(insufficientReserve
        ? { runnerCentralRunStartedWithInsufficientPostRunReserve: true }
        : {}),
      ...(closeoutOpportunityRaw
        ? { runnerCentralCloseoutOpportunityRaw: true }
        : {}),
      ...(trueCloseout.opportunity
        ? {
            runnerTrueCentralCloseoutOpportunity: true,
            runnerCentralCloseoutOpportunity: true,
            runnerCentralCloseoutReason: trueCloseout.reasons[0],
          }
        : {}),
      ...(closeoutOpportunityRaw && !trueCloseout.opportunity && !centralRun
        ? { runnerCentralCloseoutSkippedWithGoodReason: true }
        : {}),
      ...(closeoutOpportunityRaw && trueCloseout.opportunity && !centralRun
        ? { runnerCentralCloseoutSkippedWithoutReason: true }
        : {}),
      ...(centralRun && trueCloseout.opportunity
        ? { runnerCentralCloseoutRunTaken: true }
        : {}),
      ...(action.type === "steal_agenda" &&
      centralTarget &&
      trueCloseout.opportunity
        ? { runnerCentralCloseoutSuccess: true }
        : {}),
      ...(input.playerView.activeSide === "runner" &&
      input.playerView.phase === "runner_action_phase" &&
      !centralRun &&
      closeoutOpportunityRaw &&
      !trueCloseout.opportunity
        ? { runnerCentralPressureNoopDecision: true }
        : {}),
      ...(noFresh.targets.length > 0
        ? { runnerNoFreshCentralServerIds: noFresh.targets }
        : {}),
      ...(noFresh.betterAlternatives.length > 0
        ? {
            runnerNoFreshCentralBetterAlternativeTypes:
              noFresh.betterAlternatives,
          }
        : {}),
      ...(noFreshRunTaken ? { runnerNoFreshCentralRunTaken: true } : {}),
      ...(substitutionType
        ? { runnerNoFreshCentralSubstitutionType: substitutionType }
        : {}),
      ...(noFreshRunTaken && noFresh.allowedReasons[0]
        ? { runnerStaleCentralAllowedReason: noFresh.allowedReasons[0] }
        : {}),
      ...(interfaceInstallOpportunity
        ? { runnerInterfaceInstallOpportunity: true }
        : {}),
      ...(interfaceInstallTaken ? { runnerInterfaceInstallTaken: true } : {}),
      ...(hasAnyInstalledInterface &&
      input.playerView.activeSide === "runner" &&
      input.playerView.phase === "runner_action_phase" &&
      !centralRun &&
      action.type === "end_turn"
        ? { runnerInterfaceInstalledButUnusedTurn: true }
        : {}),
    };
  };
}
