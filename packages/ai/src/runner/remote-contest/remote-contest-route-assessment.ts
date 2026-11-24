import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import type { RunnerRunFundingSupport } from "../../plans/runner-funding-service-contract";
import { runnerCardRunHasVisibleDifferentialPayoff } from "../../plans/runner-run-payoff";
import type { RunnerRemoteContestSignal } from "../../plans/runner-tactical-plan-contracts";
import {
  runnerRunFundingSupport,
  runnerRunTargetCanConvertNow,
} from "../../run-analysis/runner-plan-run-funding";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../../runner-run-target-evaluation";
import {
  runnerRemoteRepeatedFreeStopEvidence,
  runnerTerminalRemoteContestIsDirectlyMandatory,
} from "./remote-contest-admission";

export type RunnerRemoteContestSignalDraft = Omit<
  RunnerRemoteContestSignal,
  "runActionAssessments"
> & {
  preferredRunActionIds?: string[];
  runActionDeferralEvidenceCode?: string;
};

export function runnerIrrecoverableRandomBreakScoreThreatContest(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  const randomBreakRisk = evaluation.randomBreakOrDamageRiskAssessment;
  if (
    evaluation.targetKind !== "remote" ||
    evaluation.scoreThreat !== true ||
    evaluation.pathPassability !==
      "blocked_by_random_break_damage_hand_buffer" ||
    randomBreakRisk?.blockedByHandBuffer !== true ||
    randomBreakRisk.stableCoverageAvailable === true ||
    randomBreakRisk.currentHandCount > 0
  ) {
    return false;
  }
  const recoveryRouteAvailable = candidates.some(
    (candidate) =>
      candidate.semanticActionType === "draw.card" ||
      candidate.actionTacticSignals.some(
        (signal) =>
          signal === "search.breaker" ||
          signal === "search.program" ||
          signal === "install.breaker",
      ),
  );
  return !recoveryRouteAvailable;
}

export function runnerRemoteProbeCanConvertNow(
  input: AiDecisionInput,
  economy: RunnerEconomyPosture,
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  if (
    evaluation.unrezzedIceRiskUnderfunded === true &&
    evaluation.creditsAfterRun <= 0
  ) {
    return false;
  }
  return (
    evaluation.accessTargetKind === "remote" &&
    evaluation.runCommitment === "probe_only" &&
    evaluation.pathPassability === "reachable" &&
    evaluation.score > 0 &&
    evaluation.creditsAfterRun >= 0 &&
    (evaluation.pathCost === 0 ||
      evaluation.creditsAfterRun >= economy.minimumCreditFloor ||
      (evaluation.scoreThreat && input.playerView.opponent.credits <= 1))
  );
}

export function bindRunnerRemoteRunActionAssessments(
  input: AiDecisionInput,
  economy: RunnerEconomyPosture,
  signal: RunnerRemoteContestSignalDraft,
  runTargets: readonly RunnerRunTargetEvaluation[],
  candidates: readonly ActionSemanticCandidate[],
): RunnerRemoteContestSignal {
  const candidatesByActionId = new Map(
    candidates.map((candidate) => [candidate.actionId, candidate]),
  );
  const evaluations = runTargets.filter(
    (evaluation) =>
      evaluation.targetKind === "remote" &&
      evaluation.targetServerId === signal.serverId &&
      candidatesByActionId.has(evaluation.actionId),
  );
  const duplicateActionIds = evaluations
    .map((evaluation) => evaluation.actionId)
    .filter(
      (actionId, index, actionIds) => actionIds.indexOf(actionId) !== index,
    );
  if (duplicateActionIds.length > 0) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [...new Set(duplicateActionIds)],
      owner: "plan_module",
      removalCondition:
        "Each exact same-server Runner run action must have exactly one run-target evaluation before the Remote plan can classify it.",
    });
  }
  const preferredActionIds = new Set(signal.preferredRunActionIds ?? []);
  const directlyAvailableBasicRun = candidates.some(
    (candidate) =>
      candidate.semanticActionType === "run.start" &&
      candidate.runProjectionSummary?.serverId === signal.serverId,
  );
  const evaluatedRunActionAssessments = evaluations.map((evaluation) => {
    const actionCandidate = candidatesByActionId.get(evaluation.actionId);
    const lacksDifferentialPayoff =
      directlyAvailableBasicRun &&
      actionCandidate?.semanticActionType === "play.runner_event" &&
      !runnerCardRunHasVisibleDifferentialPayoff(
        input,
        actionCandidate,
        signal.serverId,
        evaluations,
      );
    const fundingSupport = runnerRunFundingSupport(
      input,
      economy,
      evaluation,
      runTargets,
      candidates,
    );
    const directRunCanConvertNow = runnerRunTargetCanConvertNow(
      input,
      economy,
      evaluation,
      candidates,
    );
    const productiveProbeCanConvertNow = runnerRemoteProbeCanConvertNow(
      input,
      economy,
      evaluation,
    );
    const irrecoverableScoreThreatContest =
      signal.evidenceCode ===
        `runner_irrecoverable_random_break_damage_score_threat_contest:${evaluation.targetServerId}` ||
      runnerIrrecoverableRandomBreakScoreThreatContest(
        input,
        candidates,
        evaluation,
      );
    const terminalRemoteContestIsDirectlyMandatory =
      runnerTerminalRemoteContestIsDirectlyMandatory(input, evaluation);
    const directRunRouteReady =
      evaluation.prerunReserveQuote?.status !== "blocked" &&
      (evaluation.recommendation === "run_now" ||
        evaluation.recommendation === "run_if_free" ||
        productiveProbeCanConvertNow ||
        directRunCanConvertNow);
    const specialRouteMembership =
      signal.constrainedActionCapacity === true ||
      signal.evidenceCode === "visible_known_agenda_remote";
    const repeatedFreeStopEvidence = runnerRemoteRepeatedFreeStopEvidence(
      input,
      evaluation,
    );
    const executable =
      repeatedFreeStopEvidence === undefined &&
      signal.runActionDeferralEvidenceCode === undefined &&
      signal.routePreparation === undefined &&
      signal.reachable &&
      signal.marginalValue > 0 &&
      !lacksDifferentialPayoff &&
      evaluation.prerunReserveQuote?.status !== "blocked" &&
      (terminalRemoteContestIsDirectlyMandatory ||
        (specialRouteMembership
          ? preferredActionIds.has(evaluation.actionId)
          : irrecoverableScoreThreatContest ||
            (evaluation.pathPassability === "reachable" &&
              evaluation.score > 0 &&
              fundingSupport === undefined &&
              directRunRouteReady)));
    const evidenceCodes = executable
      ? [
          `runner_remote_run_variant_executable:${signal.serverId}:${evaluation.actionId}`,
          ...evaluation.evidence,
        ]
      : [
          repeatedFreeStopEvidence ??
            (lacksDifferentialPayoff
              ? "runner_remote_card_run_has_no_visible_differential_payoff_over_basic_run"
              : (signal.runActionDeferralEvidenceCode ??
                runnerRemoteRunVariantNonproductiveEvidence(
                  signal,
                  evaluation,
                  fundingSupport,
                  preferredActionIds,
                ))),
          ...evaluation.evidence,
        ];
    const opportunityQuote = evaluation.consumableRunOpportunityQuote;
    return [
      evaluation.actionId,
      {
        verdict: executable
          ? ("executable" as const)
          : ("explicitly_nonproductive" as const),
        stepValue: executable ? signal.marginalValue + evaluation.score : 0,
        evidenceCodes,
        routeDiagnostic: {
          rawRouteScore: opportunityQuote?.rawRouteScore ?? evaluation.score,
          opportunityCost: opportunityQuote?.opportunityCost ?? 0,
          effectiveRouteScore: evaluation.score,
        },
      },
    ];
  });
  const releaseRunLockAssessments =
    signal.routePreparation === "release_run_lock"
      ? candidates
          .filter((candidate) => preferredActionIds.has(candidate.actionId))
          .map((candidate) => [
            candidate.actionId,
            {
              verdict: signal.reachable
                ? ("executable" as const)
                : ("explicitly_nonproductive" as const),
              stepValue: signal.reachable ? signal.marginalValue : 0,
              evidenceCodes: [
                signal.reachable
                  ? `runner_remote_run_lock_release_executable:${signal.serverId}:${candidate.actionId}`
                  : `runner_remote_run_lock_release_blocked:${signal.serverId}:${candidate.actionId}`,
              ],
            },
          ])
      : [];
  const runActionAssessments = Object.fromEntries([
    ...evaluatedRunActionAssessments,
    ...releaseRunLockAssessments,
  ]);
  const {
    preferredRunActionIds: _preferredRunActionIds,
    runActionDeferralEvidenceCode: _runActionDeferralEvidenceCode,
    ...normalized
  } = signal;
  return {
    ...normalized,
    runActionAssessments,
  };
}

function runnerRemoteRunVariantNonproductiveEvidence(
  signal: RunnerRemoteContestSignalDraft,
  evaluation: RunnerRunTargetEvaluation,
  fundingSupport: RunnerRunFundingSupport | undefined,
  preferredActionIds: ReadonlySet<string>,
): string {
  if (evaluation.prerunReserveQuote?.status === "blocked") {
    return `runner_remote_run_variant_prerun_reserve_blocked:${signal.serverId}`;
  }
  if (signal.routePreparation) {
    return `runner_remote_run_deferred_to_bound_preparation:${signal.serverId}:${signal.routePreparation}`;
  }
  if (
    signal.constrainedActionCapacity &&
    !preferredActionIds.has(evaluation.actionId)
  ) {
    return `runner_remote_run_not_bound_to_restricted_capacity:${signal.serverId}`;
  }
  if (signal.supportNeedId || fundingSupport) {
    return `runner_remote_run_deferred_to_bound_funding_support:${signal.serverId}:${signal.supportNeedId ?? fundingSupport!.needId}`;
  }
  if (evaluation.knownAccessState === "known_no_current_payoff") {
    return `runner_remote_run_known_no_current_payoff:${signal.serverId}:${evaluation.recommendation}`;
  }
  if (evaluation.pathPassability !== "reachable") {
    return `runner_remote_run_route_blocked:${signal.serverId}:${evaluation.pathPassability}`;
  }
  if (evaluation.score <= 0) {
    return `runner_remote_run_below_material_value:${signal.serverId}:${evaluation.score}:${evaluation.recommendation}`;
  }
  if (!signal.reachable) {
    return `runner_remote_run_plan_not_executable:${signal.serverId}:${signal.evidenceCode}`;
  }
  return `runner_remote_run_not_currently_convertible:${signal.serverId}:${evaluation.recommendation}`;
}
