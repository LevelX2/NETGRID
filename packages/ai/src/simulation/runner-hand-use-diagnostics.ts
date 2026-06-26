import {
  type AiDecision,
  type AiDecisionInput,
  type LegalAction,
} from "@netgrid/shared";

import { remoteTrashCostBucket } from "../runtime/remote-trash-cost";
import { isRunnerEconomyRole, isRunnerPressureRole } from "../runtime/runner-role-classification";
import { isRemoteServerTarget } from "../runtime/server-target";
import type { AiSimulationActionSequenceEntry } from "./ai-simulation-action-sequence-entry";
import type { AiSimulationSummary } from "./ai-simulation-summary";

type RunnerDrawKind = {
  draw?: boolean;
  click?: boolean;
  cardEffect?: boolean;
};

type RunnerRemoteTrashAccessDiagnostic = {
  trashable?: boolean;
  relevant?: boolean;
  affordableRelevant?: boolean;
  relevantTaken?: boolean;
  skippedAffordableRelevant?: boolean;
  targetType?: AiSimulationActionSequenceEntry["runnerRemoteTrashTargetType"];
  role?: AiSimulationActionSequenceEntry["runnerRemoteTrashRole"];
  trashCost: number;
  legalTrashActionCount: number;
  finitePoolEconomy?: boolean;
  corpValueRemaining: number;
  bbsWhisperingCampaign?: boolean;
  deferredByBudget?: boolean;
  expensive?: boolean;
  highImpact?: boolean;
  acuteThreat?: boolean;
  creditsAfterGeneralTrash: number;
  dedicatedTrashCredits: number;
  generalCreditCost: number;
  dropsBelowReserve?: boolean;
};

type RunnerAdvancedRemoteContestDiagnostic = {
  opportunity?: boolean;
  taken?: boolean;
  skipped?: boolean;
  centralWhileThreat?: boolean;
  reserveAfterRun?: number;
};

export type RunnerHandUseDiagnosticsDependencies = {
  runnerDrawKindForSimulationAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerDrawKind;
  hasRunnerPlayableEconomyAction: (
    input: AiDecisionInput,
    excludeActionId: string,
  ) => boolean;
  hasRunnerInstallableBreakerAction: (
    input: AiDecisionInput,
    excludeActionId: string,
  ) => boolean;
  hasRunnerRunnablePressureAction: (
    input: AiDecisionInput,
    excludeActionId: string,
  ) => boolean;
  hasRunnerRemoteTrashAction: (input: AiDecisionInput) => boolean;
  runnerDiscardChoiceRoles: (
    input: AiDecisionInput,
    decision: AiDecision,
  ) => string[];
  isRunnerDuplicateInstall: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  isRunnerLowValueDuplicateInstall: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  isRunnerEconomyAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  isRunnerRigInstallAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  isRunnerPressureAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  sourceDefinitionIdForSimulationAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  runnerRemoteTrashAccessContext: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerRemoteTrashAccessDiagnostic;
  runnerAdvancedRemoteContestContext: (
    input: AiDecisionInput,
    action: LegalAction,
    targetServerId: string | undefined,
  ) => RunnerAdvancedRemoteContestDiagnostic;
};

export function createRunnerHandUseDiagnosticsForSimulationAction(
  dependencies: RunnerHandUseDiagnosticsDependencies,
) {
  return function runnerHandUseDiagnosticsForSimulationAction(
    input: AiDecisionInput,
    decision: AiDecision,
    action: LegalAction,
    targetServerId: string | undefined,
  ): Partial<AiSimulationSummary["actionSequence"][number]> {
    if (input.side !== "runner" || action.side !== "runner") return {};
    const draw = dependencies.runnerDrawKindForSimulationAction(input, action);
    const playableEconomy = dependencies.hasRunnerPlayableEconomyAction(
      input,
      action.actionId,
    );
    const installableBreaker = dependencies.hasRunnerInstallableBreakerAction(
      input,
      action.actionId,
    );
    const runnablePressure = dependencies.hasRunnerRunnablePressureAction(
      input,
      action.actionId,
    );
    const remoteTrashAvailable = dependencies.hasRunnerRemoteTrashAction(input);
    const discardRoles = dependencies.runnerDiscardChoiceRoles(input, decision);
    const installAction = action.type === "install_card";
    const duplicateInstall =
      installAction && dependencies.isRunnerDuplicateInstall(input, action);
    const lowValueDuplicate =
      duplicateInstall &&
      dependencies.isRunnerLowValueDuplicateInstall(input, action);
    const economyActionTaken = dependencies.isRunnerEconomyAction(
      input,
      action,
    );
    const rigInstallAction =
      installAction && dependencies.isRunnerRigInstallAction(input, action);
    const pressureActionTaken = dependencies.isRunnerPressureAction(
      input,
      action,
    );
    const remoteTrashTaken =
      action.type === "trash_accessed_card" &&
      isRemoteServerTarget(
        targetServerId ?? input.playerView.run?.attackedServerId,
      );
    const remoteTrash = dependencies.runnerRemoteTrashAccessContext(
      input,
      action,
    );
    const advancedRemoteContest =
      dependencies.runnerAdvancedRemoteContestContext(
        input,
        action,
        targetServerId,
      );
    const handUseOpportunity =
      playableEconomy ||
      installableBreaker ||
      runnablePressure ||
      remoteTrashAvailable;
    const handUseActionTaken =
      economyActionTaken ||
      rigInstallAction ||
      pressureActionTaken ||
      remoteTrashTaken;

    return {
      ...(draw.draw ? { runnerDrawAction: true } : {}),
      ...(draw.click ? { runnerClickDrawAction: true } : {}),
      ...(draw.cardEffect ? { runnerCardEffectDrawAction: true } : {}),
      ...(draw.draw && playableEconomy
        ? { runnerDrawWhileHoldingPlayableEconomy: true }
        : {}),
      ...(draw.draw && installableBreaker
        ? { runnerDrawWhileHoldingInstallableBreaker: true }
        : {}),
      ...(draw.draw && runnablePressure
        ? { runnerDrawWhileHoldingRunnablePressureCard: true }
        : {}),
      ...(draw.draw && remoteTrashAvailable
        ? { runnerDrawWhileRemoteTrashAvailable: true }
        : {}),
      ...(discardRoles.length > 0 ? { runnerDiscardChoice: true } : {}),
      ...(discardRoles.some((role) => isRunnerEconomyRole(role))
        ? { runnerDiscardedPlayableEconomy: true }
        : {}),
      ...(discardRoles.some((role) => role.startsWith("breaker_"))
        ? { runnerDiscardedInstallableBreaker: true }
        : {}),
      ...(discardRoles.some((role) => isRunnerPressureRole(role))
        ? { runnerDiscardedRunPressureCard: true }
        : {}),
      ...(installAction ? { runnerInstallAction: true } : {}),
      ...(duplicateInstall ? { runnerDuplicateInstallAction: true } : {}),
      ...(lowValueDuplicate
        ? { runnerLowValueDuplicateInstallAction: true }
        : {}),
      ...(duplicateInstall &&
      dependencies.sourceDefinitionIdForSimulationAction(input, action) ===
        "onr_v1_165_junkyard-bbs"
        ? { runnerJunkyardBbsDuplicateInstall: true }
        : {}),
      ...(economyActionTaken ? { runnerEconomyActionTaken: true } : {}),
      ...(rigInstallAction ? { runnerRigInstallAction: true } : {}),
      ...(pressureActionTaken ? { runnerPressureActionTaken: true } : {}),
      ...(remoteTrashAvailable ? { runnerRemoteTrashOpportunity: true } : {}),
      ...(remoteTrashTaken ? { runnerRemoteTrashTaken: true } : {}),
      ...(remoteTrash.trashable
        ? { runnerRemoteAccessWithTrashableCard: true }
        : {}),
      ...(remoteTrash.relevant
        ? { runnerRemoteAccessWithRelevantTrashableCard: true }
        : {}),
      ...(remoteTrash.affordableRelevant
        ? { runnerAffordableRelevantRemoteTrashOpportunity: true }
        : {}),
      ...(remoteTrash.relevantTaken
        ? { runnerRelevantRemoteTrashTaken: true }
        : {}),
      ...(remoteTrash.skippedAffordableRelevant
        ? { runnerSkippedAffordableRelevantRemoteTrash: true }
        : {}),
      ...(remoteTrash.targetType
        ? { runnerRemoteTrashTargetType: remoteTrash.targetType }
        : {}),
      ...(remoteTrash.role ? { runnerRemoteTrashRole: remoteTrash.role } : {}),
      ...(remoteTrash.trashable && action.type === "decline_trash"
        ? { runnerRemoteTrashDeclined: true }
        : {}),
      ...(remoteTrash.trashable
        ? {
            runnerRemoteTrashCost: remoteTrash.trashCost,
            runnerRemoteTrashCostBucket: remoteTrashCostBucket(
              remoteTrash.trashCost,
            ),
            runnerRemoteTrashLegalActionCount: remoteTrash.legalTrashActionCount,
          }
        : {}),
      ...(remoteTrash.role === "economy"
        ? { runnerRemoteTrashAssetEconomy: true }
        : {}),
      ...(remoteTrash.finitePoolEconomy
        ? { runnerRemoteTrashFinitePoolEconomy: true }
        : {}),
      ...(remoteTrash.corpValueRemaining > 0
        ? {
            runnerRemoteTrashCorpValueRemaining:
              remoteTrash.corpValueRemaining,
          }
        : {}),
      ...(remoteTrash.bbsWhisperingCampaign
        ? { runnerBbsWhisperingCampaignAccessed: true }
        : {}),
      ...(remoteTrash.bbsWhisperingCampaign &&
      remoteTrash.legalTrashActionCount > 0
        ? { runnerBbsWhisperingCampaignTrashLegal: true }
        : {}),
      ...(remoteTrash.bbsWhisperingCampaign && remoteTrashTaken
        ? { runnerBbsWhisperingCampaignTrashTaken: true }
        : {}),
      ...(remoteTrash.bbsWhisperingCampaign && action.type === "decline_trash"
        ? { runnerBbsWhisperingCampaignTrashSkipped: true }
        : {}),
      ...(remoteTrash.bbsWhisperingCampaign &&
      remoteTrash.skippedAffordableRelevant
        ? { runnerBbsWhisperingCampaignTrashSkippedAffordable: true }
        : {}),
      ...(remoteTrash.finitePoolEconomy
        ? { runnerFinitePoolAssetAccessed: true }
        : {}),
      ...(remoteTrash.finitePoolEconomy &&
      remoteTrash.legalTrashActionCount > 0
        ? { runnerFinitePoolAssetTrashLegal: true }
        : {}),
      ...(remoteTrash.finitePoolEconomy && remoteTrashTaken
        ? { runnerFinitePoolAssetTrashTaken: true }
        : {}),
      ...(remoteTrash.finitePoolEconomy &&
      remoteTrash.skippedAffordableRelevant
        ? { runnerFinitePoolAssetTrashSkippedAffordable: true }
        : {}),
      ...(remoteTrash.skippedAffordableRelevant
        ? { runnerRemoteTrashFixGateEligible: true }
        : {}),
      ...(remoteTrash.deferredByBudget
        ? { runnerRemoteTrashFixGateBlockedByReserve: true }
        : {}),
      ...(remoteTrash.trashable &&
      remoteTrash.legalTrashActionCount === 0 &&
      input.playerView.own.credits < remoteTrash.trashCost
        ? { runnerRemoteTrashFixGateBlockedByLowCredits: true }
        : {}),
      ...(remoteTrash.skippedAffordableRelevant &&
      action.type === "steal_agenda"
        ? { runnerRemoteTrashFixGateBlockedByHigherThreat: true }
        : {}),
      ...(remoteTrash.skippedAffordableRelevant &&
      action.type !== "steal_agenda" &&
      !remoteTrash.deferredByBudget
        ? { runnerRemoteTrashFixGateSuspicious: true }
        : {}),
      ...(remoteTrash.expensive
        ? { runnerExpensiveRemoteTrashOpportunity: true }
        : {}),
      ...(remoteTrash.expensive && remoteTrashTaken
        ? { runnerExpensiveRemoteTrashTaken: true }
        : {}),
      ...(remoteTrash.expensive &&
      remoteTrash.trashable &&
      action.type === "decline_trash"
        ? { runnerExpensiveRemoteTrashDeclined: true }
        : {}),
      ...(remoteTrash.highImpact && remoteTrashTaken
        ? { runnerHighImpactRemoteTrashTaken: true }
        : {}),
      ...(remoteTrash.deferredByBudget
        ? { runnerHighImpactRemoteTrashDeferredByBudget: true }
        : {}),
      ...(remoteTrash.highImpact &&
      remoteTrash.expensive &&
      !remoteTrash.acuteThreat &&
      action.type === "decline_trash"
        ? { runnerHighImpactRemoteTrashSkippedNoThreat: true }
        : {}),
      ...(remoteTrash.role === "low_value" && action.type === "decline_trash"
        ? { runnerLowValueRemoteTrashSkipped: true }
        : {}),
      ...(remoteTrashTaken && input.actionNumber <= 20
        ? { runnerRemoteTrashSpentEarlyGame: true }
        : {}),
      ...(remoteTrashTaken
        ? {
            runnerCreditsAfterRemoteTrash: remoteTrash.creditsAfterGeneralTrash,
            dedicatedTrashCreditsUsed: remoteTrash.dedicatedTrashCredits,
            generalCreditsSpentOnTrash: remoteTrash.generalCreditCost,
          }
        : {}),
      ...(remoteTrashTaken && remoteTrash.dropsBelowReserve
        ? { runnerRemoteTrashDroppedBelowReserve: true }
        : {}),
      ...(remoteTrashTaken && !remoteTrash.dropsBelowReserve
        ? { runnerRemoteTrashPreservedReserve: true }
        : {}),
      ...(remoteTrashTaken && remoteTrash.acuteThreat
        ? { runnerRemoteTrashProtectedScoreThreat: true }
        : {}),
      ...(remoteTrashTaken && !remoteTrash.acuteThreat
        ? { runnerRemoteTrashWithoutImmediateThreat: true }
        : {}),
      ...(remoteTrashTaken &&
      remoteTrash.dropsBelowReserve &&
      !remoteTrash.acuteThreat
        ? { trashDecisionLeftRunnerUnableToContest: true }
        : {}),
      ...(advancedRemoteContest.opportunity
        ? { runnerRemoteRunOpportunityAgainstAdvancedRemote: true }
        : {}),
      ...(advancedRemoteContest.taken
        ? { runnerRemoteRunAgainstAdvancedRemote: true }
        : {}),
      ...(advancedRemoteContest.skipped
        ? { runnerSkippedAdvancedRemoteContest: true }
        : {}),
      ...(advancedRemoteContest.centralWhileThreat
        ? { runnerCentralRunWhileRemoteScoreThreatVisible: true }
        : {}),
      ...(typeof advancedRemoteContest.reserveAfterRun === "number"
        ? {
            runnerRemoteContestCreditReserveAfterRun:
              advancedRemoteContest.reserveAfterRun,
          }
        : {}),
      ...(handUseOpportunity ? { runnerHandUseOpportunity: true } : {}),
      ...(handUseActionTaken ? { runnerHandUseActionTaken: true } : {}),
    };
  };
}
