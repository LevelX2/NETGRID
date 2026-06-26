import {
  type AiDecisionInput,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";

import { sortedUnique } from "../runtime/collection";
import {
  runnerEconomySkipReasonForDiagnostics,
  runnerEconomySubcounts,
  type RunnerEconomySetupActionClass,
} from "./runner-economy-setup-types";
import type { RunnerSetupMissingCoverageType } from "./runner-setup-coverage-types";
import type { RunnerSetupChosenFamily } from "./runner-setup-attribution-types";
import type { AiSimulationSummary } from "./ai-simulation-summary";

type RunnerDrawKind = {
  draw: boolean;
  click: boolean;
  cardEffect: boolean;
};

type RunnerAdvancedRemoteContestDiagnostic = {
  opportunity: boolean;
  taken: boolean;
  skipped: boolean;
  centralWhileThreat: boolean;
  reserveAfterRun?: number;
};

type RunnerEconomySetupDefinition = {
  type?: string;
};

export type RunnerEconomySetupDiagnosticsDependencies = {
  runnerEconomySetupActionClass: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerEconomySetupActionClass;
  runnerCreditReserveTargetForInput: (input: AiDecisionInput) => number;
  runnerHasKnownUnaffordableLegalRun: (input: AiDecisionInput) => boolean;
  runnerAdvancedRemoteContestContext: (
    input: AiDecisionInput,
    action: LegalAction,
    targetServerId: string | undefined,
  ) => RunnerAdvancedRemoteContestDiagnostic;
  hasRunnerRunnablePressureAction: (
    input: AiDecisionInput,
    excludeActionId?: string,
  ) => boolean;
  hasRunnerInstallableBreakerAction: (
    input: AiDecisionInput,
    excludeActionId?: string,
  ) => boolean;
  hasRunnerRemoteTrashAction: (input: AiDecisionInput) => boolean;
  runnerDrawKindForSimulationAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerDrawKind;
  isRunnerRigInstallAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  runnerVisibleMissingBreakerCoverage: (input: AiDecisionInput) => boolean;
  runnerHasKnownBlockedPathByCoverage: (input: AiDecisionInput) => boolean;
  runnerMissingCoverageTypesForInput: (
    input: AiDecisionInput,
  ) => RunnerSetupMissingCoverageType[];
  definitionForSimulationAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerEconomySetupDefinition | undefined;
  runnerRunKnownPathCost: (
    input: AiDecisionInput,
    targetServerId: string | undefined,
  ) => number;
  runnerSetupChosenFamilyForEntry: (entry: {
    actionType: string;
    runnerEconomyTaken?: boolean;
    runnerDrawAction?: boolean;
    runnerRigInstallAction?: boolean;
    runnerSearchTaken?: boolean;
    runnerRecoveryTaken?: boolean;
    runnerRemoteTrashTaken?: boolean;
  }) => RunnerSetupChosenFamily;
};

export function createRunnerEconomySetupDiagnosticsForSimulationAction(
  dependencies: RunnerEconomySetupDiagnosticsDependencies,
) {
  return function runnerEconomySetupDiagnosticsForSimulationAction(
    input: AiDecisionInput,
    action: LegalAction,
    targetServerId: string | undefined,
    stateAfterAction: GameState,
  ): Partial<AiSimulationSummary["actionSequence"][number]> {
    if (input.side !== "runner" || action.side !== "runner") return {};
    const legalRunnerActions = input.legalActions.filter(
      (candidate) => candidate.side === "runner",
    );
    const classified = legalRunnerActions.map((candidate) => ({
      action: candidate,
      classification: dependencies.runnerEconomySetupActionClass(
        input,
        candidate,
      ),
    }));
    const legalEconomy = classified.filter(
      ({ classification }) => classification.economy,
    );
    const legalMemory = classified.filter(
      ({ classification }) => classification.memoryHardware,
    );
    const legalHandSize = classified.filter(
      ({ classification }) => classification.handSizeSupport,
    );
    const legalSearch = classified.filter(
      ({ classification }) => classification.search,
    );
    const legalRecovery = classified.filter(
      ({ classification }) => classification.recovery,
    );
    const chosen = dependencies.runnerEconomySetupActionClass(input, action);
    const economyWindow = legalEconomy.length > 0;
    const economyTaken = economyWindow && chosen.economy;
    const economySkipped = economyWindow && !economyTaken;
    const reserveTarget = dependencies.runnerCreditReserveTargetForInput(input);
    const creditsBefore = input.playerView.own.credits;
    const creditsAfter = stateAfterAction.runner.credits;
    const lowCredits = creditsBefore < reserveTarget;
    const knownUnaffordablePath =
      dependencies.runnerHasKnownUnaffordableLegalRun(input);
    const advancedRemoteContest =
      dependencies.runnerAdvancedRemoteContestContext(
        input,
        action,
        targetServerId,
      );
    const freshPressureAvailable = dependencies.hasRunnerRunnablePressureAction(
      input,
      action.actionId,
    );
    const installableBreaker = dependencies.hasRunnerInstallableBreakerAction(
      input,
      action.actionId,
    );
    const remoteTrashAvailable = dependencies.hasRunnerRemoteTrashAction(input);
    const draw = dependencies.runnerDrawKindForSimulationAction(
      input,
      action,
    ).draw;
    const runAction = action.type === "start_run";
    const setupAction =
      action.type === "install_card" &&
      (dependencies.isRunnerRigInstallAction(input, action) ||
        installableBreaker);
    const relevantSkippedReason = economySkipped
      ? runnerEconomySkipReasonForDiagnostics({
          action,
          draw,
          runAction,
          setupAction,
          installableBreaker,
          remoteTrashAvailable,
          advancedRemoteContestSkipped: advancedRemoteContest.skipped,
          freshPressureAvailable,
        })
      : undefined;
    const rich = creditsBefore >= Math.max(8, reserveTarget + 3);
    const economyNeeded = lowCredits || knownUnaffordablePath;
    const economyReserveSetup =
      economyTaken &&
      creditsBefore < reserveTarget &&
      creditsAfter >= reserveTarget;
    const economyStillBelowReserve =
      economyTaken && creditsAfter < reserveTarget;
    const finiteSeen = legalEconomy.some(
      ({ classification }) => classification.finitePoolEconomy,
    );
    const finiteTaken = economyTaken && chosen.finitePoolEconomy;
    const debtSeen = legalEconomy.some(
      ({ classification }) => classification.loanDebtEconomy,
    );
    const debtTaken = economyTaken && chosen.loanDebtEconomy;
    const downsideSeen = legalEconomy.some(
      ({ classification }) => classification.downsideEconomy,
    );
    const downsideTaken = economyTaken && chosen.downsideEconomy;
    const memoryWindow = legalMemory.length > 0;
    const handSizeWindow = legalHandSize.length > 0;
    const missingBreakerCoverage =
      dependencies.runnerVisibleMissingBreakerCoverage(input) ||
      dependencies.runnerHasKnownBlockedPathByCoverage(input);
    const missingCoverageTypes =
      dependencies.runnerMissingCoverageTypesForInput(input);
    const legalProgramInstalls = legalRunnerActions.filter((candidate) => {
      if (candidate.type !== "install_card") return false;
      const definition = dependencies.definitionForSimulationAction(
        input,
        candidate,
      );
      return definition?.type === "program";
    }).length;
    const handSizeNeedVisible =
      (input.playerView.own.tags ?? 0) > 0 ||
      (input.playerView.own.gripOrHq?.length ?? 0) >
        Math.max(0, input.playerView.own.maxHandSize ?? 5);
    const memorySkipped = memoryWindow && !chosen.memoryHardware;
    const handSizeSkipped = handSizeWindow && !chosen.handSizeSupport;
    const searchTaken = chosen.search;
    const recoveryTaken = chosen.recovery;
    const searchSkippedWithCoverage =
      legalSearch.length > 0 && !searchTaken && missingBreakerCoverage;
    const recoverySkippedWithCoverage =
      legalRecovery.length > 0 && !recoveryTaken && missingBreakerCoverage;
    const economyOverPressure = economyTaken && freshPressureAvailable;
    const economyOverRemoteContest =
      economyTaken && advancedRemoteContest.skipped;
    const economyOverSetup = economyTaken && installableBreaker;
    const economyOverTrash = economyTaken && remoteTrashAvailable;
    const economyPlausible =
      economyTaken &&
      (economyNeeded || economyReserveSetup || creditsAfter < reserveTarget + 2);
    const economySuspicious =
      economyTaken &&
      !economyPlausible &&
      ((rich && (freshPressureAvailable || advancedRemoteContest.opportunity)) ||
        economyOverRemoteContest ||
        economyOverTrash ||
        (debtTaken && !economyNeeded));
    const suspiciousEconomyOverPressure =
      economyOverPressure && !economyPlausible && (rich || !economyNeeded);
    const suspiciousEconomyOverRemoteContest =
      economyOverRemoteContest &&
      !economyPlausible &&
      (rich || !economyNeeded);
    const classifications = sortedUnique([
      ...(economyWindow ? ["runner_economy_window"] : []),
      ...(economyTaken ? ["runner_economy_taken"] : []),
      ...(economySkipped ? ["runner_economy_skipped"] : []),
      ...(finiteSeen ? ["finite_pool_economy_seen"] : []),
      ...(debtSeen ? ["debt_economy_seen"] : []),
      ...(memoryWindow ? ["memory_hardware_window"] : []),
      ...(handSizeWindow ? ["hand_size_window"] : []),
      ...(legalSearch.length > 0 ? ["search_window"] : []),
      ...(legalRecovery.length > 0 ? ["recovery_window"] : []),
      ...(economySuspicious ? ["economy_choice_suspicious"] : []),
      ...(economyPlausible ? ["economy_choice_plausible"] : []),
    ]);
    const evidence = sortedUnique([
      `runner_credits:${creditsBefore}`,
      `runner_reserve_target:${reserveTarget}`,
      `legal_economy_actions:${legalEconomy.length}`,
      `legal_memory_hardware_actions:${legalMemory.length}`,
      `legal_hand_size_actions:${legalHandSize.length}`,
      `legal_search_actions:${legalSearch.length}`,
      `legal_recovery_actions:${legalRecovery.length}`,
      `known_unaffordable_path:${knownUnaffordablePath}`,
      `missing_breaker_coverage:${missingBreakerCoverage}`,
      ...(chosen.handSizeSupport
        ? ["mram_militech_classified_as_hand_size:true"]
        : []),
    ]);

    return {
      ...(economyWindow ? { runnerEconomyDecisionWindow: true } : {}),
      ...(legalEconomy.length > 0
        ? { runnerLegalEconomyActions: legalEconomy.length }
        : {}),
      ...runnerEconomySubcounts(
        legalEconomy.map((entry) => entry.classification),
      ),
      ...(economyTaken ? { runnerEconomyTaken: true } : {}),
      ...(economySkipped ? { runnerEconomySkipped: true } : {}),
      ...(economySkipped && lowCredits
        ? { runnerEconomySkippedWhileLowCredits: true }
        : {}),
      ...(economySkipped && knownUnaffordablePath
        ? { runnerEconomySkippedWhileKnownUnaffordablePath: true }
        : {}),
      ...(relevantSkippedReason === "pressure"
        ? { runnerEconomySkippedForPressure: true }
        : {}),
      ...(relevantSkippedReason === "remote_contest"
        ? { runnerEconomySkippedForRemoteContest: true }
        : {}),
      ...(relevantSkippedReason === "setup"
        ? { runnerEconomySkippedForSetup: true }
        : {}),
      ...(relevantSkippedReason === "draw"
        ? { runnerEconomySkippedForDraw: true }
        : {}),
      ...(relevantSkippedReason === "run"
        ? { runnerEconomySkippedForRun: true }
        : {}),
      ...(relevantSkippedReason === "install_breaker"
        ? { runnerEconomySkippedForInstallBreaker: true }
        : {}),
      ...(relevantSkippedReason === "trash"
        ? { runnerEconomySkippedForTrash: true }
        : {}),
      ...(relevantSkippedReason === "end_turn"
        ? { runnerEconomySkippedForEndTurn: true }
        : {}),
      ...(relevantSkippedReason === "unknown_higher_priority"
        ? { runnerEconomySkippedForUnknownHigherPriority: true }
        : {}),
      ...(lowCredits ? { runnerLowCreditDecisionWindow: true } : {}),
      ...(economyWindow && lowCredits
        ? { runnerCreditStarvedWithLegalEconomy: true }
        : {}),
      ...(economyTaken && lowCredits
        ? { runnerCreditStarvedEconomyTaken: true }
        : {}),
      ...(economySkipped && lowCredits
        ? { runnerCreditStarvedEconomySkipped: true }
        : {}),
      ...(economyWindow && knownUnaffordablePath
        ? { runnerKnownUnaffordablePathWithLegalEconomy: true }
        : {}),
      ...(economyReserveSetup
        ? { runnerEconomyTakenToReachRunReserve: true }
        : {}),
      ...(economyStillBelowReserve
        ? { runnerEconomyTakenButStillBelowReserve: true }
        : {}),
      ...(economySkipped && knownUnaffordablePath
        ? {
            runnerEconomySkippedThenUnaffordableRun: true,
            runnerRunStartedAfterSkippingEconomy: runAction,
          }
        : {}),
      ...(runAction &&
      dependencies.runnerRunKnownPathCost(input, targetServerId) >
        creditsBefore
        ? { runnerRunStartedBelowKnownPathCost: true }
        : {}),
      ...(economyOverPressure
        ? { runnerEconomyChosenOverFreshCentralPressure: true }
        : {}),
      ...(economyOverRemoteContest
        ? { runnerEconomyChosenOverRemoteContest: true }
        : {}),
      ...(economyOverSetup
        ? { runnerEconomyChosenOverBreakerInstall: true }
        : {}),
      ...(economyOverSetup
        ? { runnerEconomyChosenOverCriticalSetup: true }
        : {}),
      ...(economyOverTrash
        ? { runnerEconomyChosenOverRelevantTrash: true }
        : {}),
      ...(economyTaken && rich ? { runnerEconomyChosenWhileRich: true } : {}),
      ...(economyTaken && freshPressureAvailable
        ? { runnerEconomyChosenWhilePressureReady: true }
        : {}),
      ...(economyReserveSetup
        ? { runnerEconomyChosenAsReserveSetup: true }
        : {}),
      ...(economyPlausible ? { runnerEconomyChoicePlausible: true } : {}),
      ...(economySuspicious ? { runnerEconomyChoiceSuspicious: true } : {}),
      ...(finiteSeen ? { runnerFinitePoolEconomySeen: true } : {}),
      ...(finiteTaken ? { runnerFinitePoolEconomyTaken: true } : {}),
      ...(finiteSeen && economySkipped
        ? { runnerFinitePoolEconomySkipped: true }
        : {}),
      ...(debtSeen ? { runnerDebtEconomySeen: true } : {}),
      ...(debtTaken ? { runnerDebtEconomyTaken: true } : {}),
      ...(debtSeen && economySkipped ? { runnerDebtEconomySkipped: true } : {}),
      ...(debtTaken && !economyNeeded
        ? { runnerDebtEconomyTakenWithoutNeed: true }
        : {}),
      ...(downsideSeen ? { runnerEconomyWithDownsideSeen: true } : {}),
      ...(downsideTaken ? { runnerEconomyWithDownsideTaken: true } : {}),
      ...(chosen.delayedPenaltyEconomy
        ? { runnerDelayedPenaltyEconomyTaken: true }
        : {}),
      ...(memoryWindow ? { runnerMemoryBottleneckDecisionWindow: true } : {}),
      ...(handSizeWindow
        ? { runnerHandSizeBottleneckDecisionWindow: true }
        : {}),
      ...(legalMemory.length > 0
        ? { runnerLegalMemoryHardwareActions: legalMemory.length }
        : {}),
      ...(legalHandSize.length > 0
        ? { runnerLegalHandSizeActions: legalHandSize.length }
        : {}),
      ...(chosen.memoryHardware ? { runnerMemoryHardwareTaken: true } : {}),
      ...(chosen.handSizeSupport
        ? {
            runnerHandSizeSupportTaken: true,
            runnerHandSizeFactUsedForDiagnosis: true,
          }
        : {}),
      ...(memorySkipped && legalProgramInstalls > 0
        ? { runnerMemorySupportSkippedWhileGripHasPrograms: true }
        : {}),
      ...(handSizeSkipped && handSizeNeedVisible
        ? { runnerHandSizeSupportSkippedWhileDamageRiskVisible: true }
        : {}),
      ...(chosen.memoryHardware || chosen.handSizeSupport
        ? {
            ...(economyWindow && !economyTaken
              ? { runnerHardwareSetupChosenOverEconomy: true }
              : {}),
            ...(freshPressureAvailable
              ? { runnerHardwareSetupChosenOverPressure: true }
              : {}),
          }
        : {}),
      ...(legalSearch.length > 0
        ? { runnerLegalSearchActions: legalSearch.length }
        : {}),
      ...(legalRecovery.length > 0
        ? { runnerLegalRecoveryActions: legalRecovery.length }
        : {}),
      ...(searchTaken ? { runnerSearchTaken: true } : {}),
      ...(recoveryTaken ? { runnerRecoveryTaken: true } : {}),
      ...(searchSkippedWithCoverage
        ? { runnerSearchSkippedWhileMissingBreakerCoverage: true }
        : {}),
      ...(recoverySkippedWithCoverage
        ? { runnerRecoverySkippedWhileMissingBreakerCoverage: true }
        : {}),
      ...(searchTaken && missingBreakerCoverage
        ? { runnerSearchTakenForBreakerCoverage: true }
        : {}),
      ...(recoveryTaken && missingBreakerCoverage
        ? { runnerRecoveryTakenForBreakerCoverage: true }
        : {}),
      ...((searchTaken || recoveryTaken) && economyWindow && !economyTaken
        ? { runnerSearchRecoveryChosenOverEconomy: true }
        : {}),
      ...((searchTaken || recoveryTaken) && freshPressureAvailable
        ? { runnerSearchRecoveryChosenOverPressure: true }
        : {}),
      ...(economySkipped && lowCredits && knownUnaffordablePath
        ? { runnerEconomyFixGateEligibleStarvedSkip: true }
        : {}),
      ...(economyTaken && rich
        ? { runnerEconomyFixGateSuspiciousRichEconomy: true }
        : {}),
      ...(suspiciousEconomyOverPressure
        ? { runnerEconomyFixGateSuspiciousEconomyOverPressure: true }
        : {}),
      ...(suspiciousEconomyOverRemoteContest
        ? { runnerEconomyFixGateSuspiciousEconomyOverRemoteContest: true }
        : {}),
      ...(debtTaken && !economyNeeded
        ? { runnerEconomyFixGateSuspiciousDebtEconomyWithoutNeed: true }
        : {}),
      ...(memorySkipped && legalProgramInstalls > 0
        ? { runnerSetupFixGateEligibleMemorySkip: true }
        : {}),
      ...(searchSkippedWithCoverage || recoverySkippedWithCoverage
        ? { runnerSetupFixGateEligibleSearchRecoverySkip: true }
        : {}),
      ...(missingCoverageTypes.length > 0
        ? { runnerSetupMissingCoverageTypes: missingCoverageTypes }
        : {}),
      ...(economySkipped || searchSkippedWithCoverage || memorySkipped
        ? {
            runnerSetupAttributionEvidence: sortedUnique([
              `chosen_action_type:${action.type}`,
              `chosen_reason_family:${dependencies.runnerSetupChosenFamilyForEntry(
                {
                  actionType: action.type,
                  runnerEconomyTaken: chosen.economy,
                  runnerDrawAction: draw,
                  runnerRigInstallAction: setupAction,
                  runnerSearchTaken: searchTaken,
                  runnerRecoveryTaken: recoveryTaken,
                  runnerRemoteTrashTaken: action.type === "trash_accessed_card",
                },
              )}`,
              `runner_credits:${creditsBefore}`,
              `reserve_target:${reserveTarget}`,
              `known_path_affordable:${!knownUnaffordablePath}`,
              `missing_coverage_types:${
                missingCoverageTypes.join(",") || "none"
              }`,
            ]),
          }
        : {}),
      ...(classifications.length > 0
        ? { runnerEconomySetupClassifications: classifications }
        : {}),
      ...(classifications.length > 0
        ? { runnerEconomySetupEvidence: evidence }
        : {}),
    };
  };
}
