import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { type RunnerPlanDomain } from "../../plans/runner-tactical-plan-contracts";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../../runner-run-target-evaluation";
import type { RunnerStrategicIntentProfile } from "../../runner-strategic-intent";
import {
  runnerAccessPayoffCampaignTargetIsViable,
  runnerCentralPayoffServer,
  runnerCentralPayoffServerForDefinition,
} from "../../runtime/runner-access-payoff-facts";
import { runnerCandidateSourceDefinitionId } from "../../runtime/runner-action-source-facts";
import { runnerDefinitionRequiresTargetedBypassPlan } from "../run-window/runner-targeted-bypass-plan";
import type { RunnerHandDevelopmentEvaluation } from "../hand-development/hand-development-evaluation";
export function runnerCentralPressureDevelopmentSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[],
  runTargets: readonly RunnerRunTargetEvaluation[],
  coverageGaps: RunnerPlanDomain["coverageGaps"],
  strategicIntent: RunnerStrategicIntentProfile,
  economy: RunnerEconomyPosture,
): RunnerPlanDomain["centralPressure"] {
  const eligible = handDevelopment.flatMap((evaluation) => {
    if (
      evaluation.developmentRole !== "access_payoff" ||
      !evaluation.definitionId ||
      runnerDefinitionRequiresTargetedBypassPlan(evaluation.definitionId)
    ) {
      return [];
    }
    const candidate = evaluation.legalActionId
      ? candidates.find(
          (entry) =>
            entry.actionId === evaluation.legalActionId &&
            runnerCandidateSourceDefinitionId(input, entry) ===
              evaluation.definitionId,
        )
      : undefined;
    const supportsPrimaryStrategy = candidate?.strategySupport.some(
      (support) => support.strategyId === strategicIntent.primaryWinIntent,
    );
    if (
      evaluation.strategicFit !== "strong" &&
      evaluation.strategicFit !== "medium" &&
      !supportsPrimaryStrategy
    ) {
      return [];
    }
    const serverId =
      (candidate ? runnerCentralPayoffServer(candidate) : undefined) ??
      runnerCentralPayoffServerForDefinition(evaluation.definitionId);
    if (!serverId) return [];
    const target = [...runTargets]
      .filter(
        (entry) =>
          entry.targetServerId === serverId ||
          entry.accessServerId === serverId,
      )
      .sort(
        (left, right) =>
          right.score - left.score ||
          left.actionId.localeCompare(right.actionId),
      )[0];
    if (
      !target ||
      !runnerAccessPayoffCampaignTargetIsViable(input, target, coverageGaps)
    ) {
      return [];
    }
    const installedCopyCount =
      evaluation.persistentInstallEvaluation?.installedSameDefinitionCount ??
      (input.playerView.own.rig ?? []).filter(
        (card) => card.definitionId === evaluation.definitionId,
      ).length;
    const openingReserveConversion =
      evaluation.availability === "legal_now" &&
      evaluation.deferReason === "preserve_credit_floor" &&
      evaluation.fundingNeed?.reason === "would_break_floor" &&
      economy.creditReservePolicy.phase === "opening" &&
      economy.creditReservePolicy.remoteScoreThreat === "none" &&
      target.pathPassability === "reachable" &&
      target.pathCost === 0 &&
      (target.recommendation === "run_now" ||
        target.recommendation === "run_if_free") &&
      input.playerView.own.clicks >= 2;
    const legalInstall =
      evaluation.availability === "legal_now" &&
      (evaluation.deferReason === "none" ||
        (evaluation.deferReason === "duplicate" && installedCopyCount === 0) ||
        openingReserveConversion) &&
      candidate?.semanticActionType === "install.card";
    const waitingForInstallFunding =
      evaluation.availability === "missing_credits" &&
      evaluation.deferReason === "missing_credits" &&
      evaluation.fundingNeed !== undefined;
    if (!legalInstall && !waitingForInstallFunding) return [];
    const installCost =
      evaluation.fundingNeed?.installOrPlayCost ??
      evaluation.persistentInstallEvaluation?.installCost ??
      candidate?.costProfile.creditCost;
    if (!Number.isSafeInteger(installCost) || installCost! < 0) return [];
    const marginalValue =
      Math.min(300, Math.max(1, evaluation.priority)) -
      installedCopyCount * 140;
    if (marginalValue <= 0) return [];
    return [
      {
        evaluation,
        candidate,
        serverId,
        target,
        installedCopyCount,
        installCost: installCost!,
        marginalValue,
        reserveFundingOptional: openingReserveConversion,
      },
    ];
  });
  const byServer = new Map<string, typeof eligible>();
  for (const entry of eligible) {
    const current = byServer.get(entry.serverId) ?? [];
    current.push(entry);
    byServer.set(entry.serverId, current);
  }
  return [...byServer.entries()].flatMap(([serverId, entries]) => {
    const ordered = entries.sort(
      (left, right) =>
        right.marginalValue - left.marginalValue ||
        right.target.score - left.target.score ||
        left.evaluation.cardInstanceId.localeCompare(
          right.evaluation.cardInstanceId,
        ),
    );
    const selected = ordered[0];
    if (!selected) return [];
    const installAffordabilityGap = Math.max(
      0,
      selected.installCost - input.playerView.own.credits,
    );
    const reserveFundingGap = selected.reserveFundingOptional
      ? Math.max(0, selected.evaluation.fundingNeed?.missingCredits ?? 0)
      : 0;
    const fundingGap = Math.max(installAffordabilityGap, reserveFundingGap);
    const fundingTargetCredits = Math.max(
      selected.installCost,
      input.playerView.own.credits + fundingGap,
    );
    const runFundingTargetCredits = Math.max(
      0,
      selected.target.pathCost + economy.minimumCreditFloor,
    );
    const supportNeedId =
      fundingGap > 0
        ? `access-payoff-support:central:${serverId}:${selected.evaluation.cardInstanceId}`
        : undefined;
    const evidenceCodes = [
      "runner_access_payoff_campaign_parent:runner.pressure_central",
      `runner_access_payoff_campaign_server:${serverId}`,
      `runner_access_payoff_campaign_card:${selected.evaluation.cardInstanceId}`,
      `runner_access_payoff_campaign_desired_copies:${selected.installedCopyCount + 1}`,
      `runner_access_payoff_campaign_install_cost:${selected.installCost}`,
      `runner_access_payoff_campaign_funding_target_credits:${fundingTargetCredits}`,
      `runner_access_payoff_campaign_run_target_credits:${runFundingTargetCredits}`,
      `runner_access_payoff_campaign_funding_gap:${fundingGap}`,
      `runner_access_payoff_campaign_reserve_funding_optional:${selected.reserveFundingOptional}`,
      `runner_access_payoff_campaign_milestone:${fundingGap > 0 ? "fund_install" : "install_payoff"}`,
    ];
    return [
      {
        pressureId: `central:${serverId}`,
        serverId: serverId as "hq" | "rd" | "archives",
        purpose: "multiaccess" as const,
        strategyLineIds: [
          ...new Set([
            strategicIntent.primaryWinIntent,
            ...(selected.candidate?.strategySupport.map(
              (support) => support.strategyId,
            ) ?? []),
          ]),
        ],
        priorityClass: "P4" as const,
        reachable:
          selected.candidate !== undefined && supportNeedId === undefined,
        marginalValue: selected.marginalValue,
        evidenceCode: `runner_access_payoff_campaign:${serverId}:${selected.evaluation.cardInstanceId}`,
        sourceDefinitionIds: [selected.evaluation.definitionId!],
        preparationActionIds: selected.candidate
          ? [selected.candidate.actionId]
          : [],
        rejectedPreparationActionIds: ordered
          .slice(1)
          .flatMap((entry) =>
            entry.candidate ? [entry.candidate.actionId] : [],
          ),
        ...(supportNeedId ? { supportNeedId } : {}),
        routePreparation: "develop_payoff" as const,
        accessPayoffCampaign: {
          payoffCardInstanceId: selected.evaluation.cardInstanceId,
          payoffDefinitionId: selected.evaluation.definitionId!,
          desiredCopyCount: selected.installedCopyCount + 1,
          installedCopyCount: selected.installedCopyCount,
          selectedCopyOrdinal: selected.installedCopyCount + 1,
          installCost: selected.installCost,
          fundingTargetCredits,
          runFundingTargetCredits,
          totalFundingEnvelope: selected.installCost + runFundingTargetCredits,
          fundingGap,
          reserveFundingOptional: selected.reserveFundingOptional,
          horizon: fundingGap > 0 ? "bounded_multi_turn" : "same_turn",
          milestone: fundingGap > 0 ? "fund_install" : "install_payoff",
          evidenceCodes,
        },
      },
    ];
  });
}
