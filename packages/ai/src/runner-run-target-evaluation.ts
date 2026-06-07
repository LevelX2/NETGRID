import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { BeliefState } from "./belief-state";
import {
  evaluateKnownCentralAccessPayoff,
  type KnownCentralAccessPayoff,
} from "./known-central-access-payoff";
import {
  evaluateKnownRemoteAccessPayoff,
  type KnownRemoteAccessPayoff,
} from "./known-remote-access-payoff";
import type { DeckCapabilityProfile } from "./deck-capabilities";
import type { RunnerStrategicIntentProfile } from "./runner-strategic-intent";
import { assessKnownRezzedIcePath } from "./visible-run-analysis";

export const RUNNER_RUN_TARGET_EVALUATION_SCHEMA_VERSION =
  "runner-run-target-evaluation-v1" as const;
export const RUNNER_ECONOMY_POSTURE_SCHEMA_VERSION =
  "runner-economy-posture-v1" as const;

export type RunnerRunTargetKind = "hq" | "rd" | "archives" | "remote";

export type RunnerAccessPayoff =
  | "agenda"
  | "trash_affordable"
  | "trash_unaffordable"
  | "known_low_value"
  | "unknown"
  | "fresh"
  | "access_bonus"
  | "score_threat";

export type RunnerKnownAccessState =
  | "known_payoff"
  | "known_no_current_payoff"
  | "unknown"
  | "changed"
  | "fresh";

export type RunnerPathPassability =
  | "reachable"
  | "blocked_missing_coverage"
  | "blocked_unpayable"
  | "blocked_unbreakable";

export type RunnerRunTargetRecommendation =
  | "run_now"
  | "run_if_free"
  | "setup_first"
  | "gain_credits_first"
  | "find_breaker_first"
  | "do_not_run_now";

export type RunnerRunTargetEvaluation = {
  schemaVersion: typeof RUNNER_RUN_TARGET_EVALUATION_SCHEMA_VERSION;
  targetServerId: string;
  targetKind: RunnerRunTargetKind;
  actionId: string;
  accessPayoff: RunnerAccessPayoff;
  knownAccessState: RunnerKnownAccessState;
  multiaccessAvailable: boolean;
  pathPassability: RunnerPathPassability;
  pathCost: number;
  creditsAfterRun: number;
  stealOrTrashAffordable: boolean | "unknown";
  riskyUniversalCoverage: boolean;
  scoreThreat: boolean;
  recommendation: RunnerRunTargetRecommendation;
  score: number;
  evidence: string[];
};

export type RunnerEconomyPosture = {
  schemaVersion: typeof RUNNER_ECONOMY_POSTURE_SCHEMA_VERSION;
  minimumCreditFloor: number;
  desiredCreditReserve: number;
  riskAdjustedRunReserve: boolean;
  buildEconomyBeforePressure: boolean;
  bankToolsRelevant: boolean;
  fundingNeed: boolean;
  recommendation: "stable" | "build_economy" | "cash_out_bank" | "can_spend_for_high_payoff";
  evidence: string[];
};

export type EvaluateRunnerRunTargetsParams = {
  input: AiDecisionInput;
  strategicIntent?: RunnerStrategicIntentProfile;
  deckCapabilities?: DeckCapabilityProfile;
  beliefState?: BeliefState;
};

export function buildRunnerEconomyPosture(
  params: EvaluateRunnerRunTargetsParams,
): RunnerEconomyPosture {
  const credits = params.input.playerView.own.credits;
  const riskAdjustedRunReserve = hasRiskyUniversalPressure(params);
  const bankToolsRelevant =
    (params.deckCapabilities?.runner?.economyBankTools.length ?? 0) > 0;
  const minimumCreditFloor = riskAdjustedRunReserve ? 3 : 2;
  const desiredCreditReserve =
    riskAdjustedRunReserve || bankToolsRelevant ? 6 : 4;
  const fundingNeed = credits < minimumCreditFloor;
  const hasCashOut = params.input.legalActions.some(isBankPayoutAction);
  const buildEconomyBeforePressure =
    credits <= 2 ||
    params.strategicIntent?.setupEngine.includes(
      "runner.economy_setup_before_pressure",
    ) === true;
  const recommendation = fundingNeed && hasCashOut
    ? "cash_out_bank"
    : fundingNeed || (buildEconomyBeforePressure && credits < desiredCreditReserve)
      ? "build_economy"
      : "stable";
  return {
    schemaVersion: RUNNER_ECONOMY_POSTURE_SCHEMA_VERSION,
    minimumCreditFloor,
    desiredCreditReserve,
    riskAdjustedRunReserve,
    buildEconomyBeforePressure,
    bankToolsRelevant,
    fundingNeed,
    recommendation,
    evidence: [
      `runner_credits:${credits}`,
      `minimum_credit_floor:${minimumCreditFloor}`,
      `desired_credit_reserve:${desiredCreditReserve}`,
      `risk_adjusted_run_reserve:${riskAdjustedRunReserve}`,
      `bank_tools_relevant:${bankToolsRelevant}`,
      `funding_need:${fundingNeed}`,
      `economy_recommendation:${recommendation}`,
    ],
  };
}

export function evaluateRunnerRunTargets(
  params: EvaluateRunnerRunTargetsParams,
): RunnerRunTargetEvaluation[] {
  const economyPosture = buildRunnerEconomyPosture(params);
  return params.input.legalActions
    .filter((action) => action.type === "start_run")
    .map((action) => evaluateRunnerRunTarget(params, action, economyPosture))
    .filter((evaluation): evaluation is RunnerRunTargetEvaluation =>
      evaluation !== undefined,
    )
    .sort(
      (left, right) =>
        recommendationRank(right.recommendation) -
          recommendationRank(left.recommendation) ||
        right.score - left.score ||
        left.targetServerId.localeCompare(right.targetServerId) ||
        left.actionId.localeCompare(right.actionId),
    );
}

function evaluateRunnerRunTarget(
  params: EvaluateRunnerRunTargetsParams,
  action: LegalAction,
  economyPosture: RunnerEconomyPosture,
): RunnerRunTargetEvaluation | undefined {
  const targetServerId = actionServerId(action);
  if (!targetServerId) return undefined;
  const targetKind = targetKindForServerId(targetServerId);
  if (!targetKind) return undefined;
  const server = params.input.playerView.servers.find(
    (candidate) => candidate.id === targetServerId,
  );
  const path = assessKnownRezzedIcePath(
    server?.ice ?? [],
    params.input.playerView.own.rig ?? [],
    params.input.playerView.own.credits,
    server?.root ?? [],
  );
  const payoff = payoffForTarget(params, targetServerId, targetKind);
  const scoreThreat = targetKind === "remote" && remoteHasScoreThreat(server);
  const accessPayoff = scoreThreat && payoff.accessPayoff === "unknown"
    ? "score_threat"
    : payoff.accessPayoff;
  const riskyUniversalCoverage = hasRiskyUniversalPressure(params) &&
    (server?.ice.length ?? 0) > 0;
  const pathPassability = pathPassabilityFor(path);
  const creditsAfterRun = path.creditsAfterPath;
  const multiaccessAvailable = targetHasMultiaccess(params.input, targetKind);
  const stealOrTrashAffordable = stealOrTrashAffordableFor(accessPayoff);
  const recommendation = recommendationForRunTarget({
    targetKind,
    accessPayoff,
    knownAccessState: payoff.knownAccessState,
    pathPassability,
    creditsAfterRun,
    economyPosture,
    scoreThreat,
  });
  const score = scoreRunTargetEvaluation({
    targetKind,
    accessPayoff,
    knownAccessState: payoff.knownAccessState,
    pathPassability,
    creditsAfterRun,
    economyPosture,
    scoreThreat,
    recommendation,
    multiaccessAvailable,
  });
  return {
    schemaVersion: RUNNER_RUN_TARGET_EVALUATION_SCHEMA_VERSION,
    targetServerId,
    targetKind,
    actionId: action.actionId,
    accessPayoff,
    knownAccessState: payoff.knownAccessState,
    multiaccessAvailable,
    pathPassability,
    pathCost: path.visibleBreakCost ?? 0,
    creditsAfterRun,
    stealOrTrashAffordable,
    riskyUniversalCoverage,
    scoreThreat,
    recommendation,
    score,
    evidence: [
      `target:${targetServerId}`,
      `target_kind:${targetKind}`,
      `access_payoff:${accessPayoff}`,
      `known_access_state:${payoff.knownAccessState}`,
      `path_passability:${pathPassability}`,
      `path_cost:${path.visibleBreakCost ?? 0}`,
      `credits_after_run:${creditsAfterRun}`,
      `multiaccess_available:${multiaccessAvailable}`,
      `risky_universal_coverage:${riskyUniversalCoverage}`,
      `score_threat:${scoreThreat}`,
      `recommendation:${recommendation}`,
      ...payoff.evidence.slice(0, 8),
    ],
  };
}

function payoffForTarget(
  params: EvaluateRunnerRunTargetsParams,
  targetServerId: string,
  targetKind: RunnerRunTargetKind,
): {
  accessPayoff: RunnerAccessPayoff;
  knownAccessState: RunnerKnownAccessState;
  evidence: string[];
} {
  if (targetKind === "remote") {
    return remotePayoffToRunTarget(
      evaluateKnownRemoteAccessPayoff(
        params.input,
        targetServerId,
        params.beliefState,
      ),
    );
  }
  if (targetServerId === "rd") {
    return centralPayoffToRunTarget(
      evaluateKnownCentralAccessPayoff(
        params.input,
        targetServerId,
        params.beliefState,
      ),
    );
  }
  return {
    accessPayoff: "unknown",
    knownAccessState: "unknown",
    evidence: [`${targetKind}_payoff:unknown`],
  };
}

function remotePayoffToRunTarget(payoff: KnownRemoteAccessPayoff): {
  accessPayoff: RunnerAccessPayoff;
  knownAccessState: RunnerKnownAccessState;
  evidence: string[];
} {
  return {
    accessPayoff: payoff.payoff === "changed" ? "unknown" : payoff.payoff,
    knownAccessState: payoff.knownNoCurrentPayoff
      ? "known_no_current_payoff"
      : payoff.payoff === "changed"
        ? "changed"
        : payoff.payoff === "unknown"
          ? "unknown"
          : "known_payoff",
    evidence: payoff.evidence,
  };
}

function centralPayoffToRunTarget(payoff: KnownCentralAccessPayoff): {
  accessPayoff: RunnerAccessPayoff;
  knownAccessState: RunnerKnownAccessState;
  evidence: string[];
} {
  return {
    accessPayoff: payoff.payoff,
    knownAccessState: payoff.knownNoCurrentPayoff
      ? "known_no_current_payoff"
      : payoff.payoff === "fresh"
        ? "fresh"
        : payoff.payoff === "unknown"
          ? "unknown"
          : "known_payoff",
    evidence: payoff.evidence,
  };
}

function recommendationForRunTarget(params: {
  targetKind: RunnerRunTargetKind;
  accessPayoff: RunnerAccessPayoff;
  knownAccessState: RunnerKnownAccessState;
  pathPassability: RunnerPathPassability;
  creditsAfterRun: number;
  economyPosture: RunnerEconomyPosture;
  scoreThreat: boolean;
}): RunnerRunTargetRecommendation {
  if (params.pathPassability === "blocked_missing_coverage") {
    return "find_breaker_first";
  }
  if (
    params.pathPassability === "blocked_unpayable" ||
    params.pathPassability === "blocked_unbreakable"
  ) {
    return params.pathPassability === "blocked_unbreakable"
      ? "find_breaker_first"
      : "gain_credits_first";
  }
  if (params.knownAccessState === "known_no_current_payoff") {
    return params.accessPayoff === "trash_unaffordable"
      ? "gain_credits_first"
      : "do_not_run_now";
  }
  if (highValuePayoff(params.accessPayoff)) return "run_now";
  if (
    params.creditsAfterRun < params.economyPosture.minimumCreditFloor ||
    params.economyPosture.fundingNeed
  ) {
    return "gain_credits_first";
  }
  if (params.targetKind === "rd" && params.knownAccessState === "unknown") {
    return "run_now";
  }
  if (params.scoreThreat) return "run_now";
  if (params.accessPayoff === "unknown") return "run_if_free";
  return "setup_first";
}

function scoreRunTargetEvaluation(params: {
  targetKind: RunnerRunTargetKind;
  accessPayoff: RunnerAccessPayoff;
  knownAccessState: RunnerKnownAccessState;
  pathPassability: RunnerPathPassability;
  creditsAfterRun: number;
  economyPosture: RunnerEconomyPosture;
  scoreThreat: boolean;
  recommendation: RunnerRunTargetRecommendation;
  multiaccessAvailable: boolean;
}): number {
  const payoffScore = scoreForPayoff(params.accessPayoff);
  const pathPenalty = params.pathPassability === "reachable" ? 0 : -420;
  const reservePenalty =
    params.creditsAfterRun < params.economyPosture.minimumCreditFloor ? -160 : 0;
  const multiaccessBonus = params.multiaccessAvailable ? 80 : 0;
  const scoreThreatBonus = params.scoreThreat ? 180 : 0;
  const recommendationScore = recommendationRank(params.recommendation) * 20;
  return (
    payoffScore +
    pathPenalty +
    reservePenalty +
    multiaccessBonus +
    scoreThreatBonus +
    recommendationScore
  );
}

function scoreForPayoff(payoff: RunnerAccessPayoff): number {
  switch (payoff) {
    case "agenda":
      return 520;
    case "score_threat":
      return 260;
    case "trash_affordable":
    case "fresh":
      return 180;
    case "access_bonus":
      return 140;
    case "unknown":
      return 60;
    case "trash_unaffordable":
      return -120;
    case "known_low_value":
      return -260;
  }
}

function recommendationRank(recommendation: RunnerRunTargetRecommendation): number {
  switch (recommendation) {
    case "run_now":
      return 6;
    case "run_if_free":
      return 5;
    case "setup_first":
      return 4;
    case "gain_credits_first":
      return 3;
    case "find_breaker_first":
      return 2;
    case "do_not_run_now":
      return 1;
  }
}

function pathPassabilityFor(path: ReturnType<typeof assessKnownRezzedIcePath>): RunnerPathPassability {
  if (!path.blocked) return "reachable";
  if (path.knownPathBlockedByMissingCoverage) return "blocked_missing_coverage";
  if (path.unpayableReason === "ice_unbreakable") return "blocked_unbreakable";
  return "blocked_unpayable";
}

function stealOrTrashAffordableFor(
  payoff: RunnerAccessPayoff,
): boolean | "unknown" {
  if (payoff === "agenda" || payoff === "trash_affordable") return true;
  if (payoff === "trash_unaffordable") return false;
  return "unknown";
}

function highValuePayoff(payoff: RunnerAccessPayoff): boolean {
  return (
    payoff === "agenda" ||
    payoff === "trash_affordable" ||
    payoff === "fresh" ||
    payoff === "access_bonus" ||
    payoff === "score_threat"
  );
}

function targetHasMultiaccess(
  input: AiDecisionInput,
  targetKind: RunnerRunTargetKind,
): boolean {
  if (targetKind !== "rd" && targetKind !== "hq") return false;
  return (input.playerView.own.rig ?? []).some((card) => {
    const definitionId = card.definitionId;
    if (targetKind === "rd") {
      return (
        definitionId === "onr_v1_050_r-and-d-protocol-files" ||
        definitionId === "onr_v1_139_r-and-d-interface"
      );
    }
    return (
      definitionId === "onr_v1_024_expert-schedule-analyzer" ||
      definitionId === "onr_v1_041_microtech-ai-interface"
    );
  });
}

function hasRiskyUniversalPressure(
  params: EvaluateRunnerRunTargetsParams,
): boolean {
  return (
    params.strategicIntent?.riskProfile.includes(
      "runner.risky_universal_breaker_pressure",
    ) === true ||
    (params.deckCapabilities?.runner?.breakerInventory.some(
      (breaker) =>
        breaker.coverage.includes("universal") && breaker.risks.length > 0,
    ) ?? false)
  );
}

function remoteHasScoreThreat(
  server: AiDecisionInput["playerView"]["servers"][number] | undefined,
): boolean {
  if (!server?.id.startsWith("remote_")) return false;
  return server.root.some(
    (card) =>
      card.type === "agenda" ||
      (card.known === false && (card.advancementCounters ?? 0) > 0),
  );
}

function targetKindForServerId(serverId: string): RunnerRunTargetKind | undefined {
  if (serverId === "hq") return "hq";
  if (serverId === "rd") return "rd";
  if (serverId === "archives") return "archives";
  if (serverId.startsWith("remote_")) return "remote";
  return undefined;
}

function actionServerId(action: LegalAction): string | undefined {
  const value = action.payload?.serverId;
  return typeof value === "string" ? value : undefined;
}

function isBankPayoutAction(action: LegalAction): boolean {
  const text = `${action.label} ${action.payload?.source ?? ""}`.toLowerCase();
  return (
    action.type === "trigger_ability" &&
    (text.includes("cash") ||
      text.includes("payout") ||
      text.includes("auszahlen") ||
      text.includes("nehmen"))
  );
}
