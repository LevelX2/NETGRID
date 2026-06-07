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
import { createAiHintsByCard, type AiCardHint } from "./ai-hints";
import type { RunnerHandDevelopmentEvaluation } from "./runner-hand-development";
import type { RunnerStrategicIntentProfile } from "./runner-strategic-intent";
import { assessKnownRezzedIcePath } from "./visible-run-analysis";

export const RUNNER_RUN_TARGET_EVALUATION_SCHEMA_VERSION =
  "runner-run-target-evaluation-v1" as const;
export const RUNNER_ECONOMY_POSTURE_SCHEMA_VERSION =
  "runner-economy-posture-v1" as const;
export const RUNNER_CREDIT_BASE_PLAN_SCHEMA_VERSION =
  "runner-credit-base-plan-v1" as const;

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

export type RunnerInstalledRunPayoff = {
  immediateAccessValue: number;
  futureSetupValue: number;
  purgeTaxValue: number;
  economyValue: number;
  riskPenalty: number;
  scoreBonus: number;
  multiaccessAvailable: boolean;
  evidence: string[];
};

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

export type RunnerCreditBasePlanRecommendation =
  | "build_credit_base"
  | "fund_useful_hand_card"
  | "preserve_reserve"
  | "allow_setup_spend"
  | "allow_pressure";

export type RunnerCreditBaseHandCandidate = {
  developmentRole: RunnerHandDevelopmentEvaluation["developmentRole"];
  currentNeed: RunnerHandDevelopmentEvaluation["currentNeed"];
  priority: number;
  installOrPlayCost: number;
  missingCredits: number;
  deferReason: RunnerHandDevelopmentEvaluation["deferReason"];
};

export type RunnerCreditBasePlan = {
  schemaVersion: typeof RUNNER_CREDIT_BASE_PLAN_SCHEMA_VERSION;
  currentCredits: number;
  minimumCreditFloor: number;
  desiredCreditReserve: number;
  runCostReserve: number;
  fundingNeed: boolean;
  usefulHandCardsBlockedByCredits: number;
  usefulHandCardsAffordableNow: number;
  topBlockedHandCandidate?: RunnerCreditBaseHandCandidate;
  recommendation: RunnerCreditBasePlanRecommendation;
  economyPriority: "low" | "medium" | "high";
  evidence: string[];
};

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
  installedRunPayoff: RunnerInstalledRunPayoff;
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
  creditBasePlan: RunnerCreditBasePlan;
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
  handDevelopmentEvaluations?: readonly RunnerHandDevelopmentEvaluation[];
};

const AI_HINTS_BY_CARD = createAiHintsByCard();
const INSTALLED_RUN_PAYOFF_SCORE_CAP = 180;

export function buildRunnerEconomyPosture(
  params: EvaluateRunnerRunTargetsParams,
): RunnerEconomyPosture {
  const credits = params.input.playerView.own.credits;
  const riskAdjustedRunReserve = hasRiskyUniversalPressure(params);
  const bankToolsRelevant =
    (params.deckCapabilities?.runner?.economyBankTools.length ?? 0) > 0;
  const minimumCreditFloor = riskAdjustedRunReserve ? 3 : 2;
  const baseDesiredCreditReserve =
    riskAdjustedRunReserve || bankToolsRelevant ? 6 : 4;
  const creditBasePlan = buildRunnerCreditBasePlan({
    currentCredits: credits,
    minimumCreditFloor,
    baseDesiredCreditReserve,
    riskAdjustedRunReserve,
    handDevelopmentEvaluations: params.handDevelopmentEvaluations ?? [],
  });
  const desiredCreditReserve = creditBasePlan.desiredCreditReserve;
  const fundingNeed = creditBasePlan.fundingNeed;
  const hasCashOut = params.input.legalActions.some(isBankPayoutAction);
  const buildEconomyBeforePressure =
    credits <= 2 ||
    (creditBasePlan.economyPriority === "high" &&
      credits < creditBasePlan.desiredCreditReserve) ||
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
    creditBasePlan,
    riskAdjustedRunReserve,
    buildEconomyBeforePressure,
    bankToolsRelevant,
    fundingNeed,
    recommendation,
    evidence: [
      `runner_credits:${credits}`,
      `minimum_credit_floor:${minimumCreditFloor}`,
      `desired_credit_reserve:${desiredCreditReserve}`,
      `credit_base_recommendation:${creditBasePlan.recommendation}`,
      `credit_base_economy_priority:${creditBasePlan.economyPriority}`,
      `useful_hand_cards_blocked_by_credits:${creditBasePlan.usefulHandCardsBlockedByCredits}`,
      `risk_adjusted_run_reserve:${riskAdjustedRunReserve}`,
      `bank_tools_relevant:${bankToolsRelevant}`,
      `funding_need:${fundingNeed}`,
      `economy_recommendation:${recommendation}`,
    ],
  };
}

function buildRunnerCreditBasePlan(params: {
  currentCredits: number;
  minimumCreditFloor: number;
  baseDesiredCreditReserve: number;
  riskAdjustedRunReserve: boolean;
  handDevelopmentEvaluations: readonly RunnerHandDevelopmentEvaluation[];
}): RunnerCreditBasePlan {
  const usefulBlocked = params.handDevelopmentEvaluations
    .filter(usefulHandEvaluationBlockedByCredits)
    .sort(compareHandDevelopmentForCreditBase);
  const usefulAffordable = params.handDevelopmentEvaluations.filter(
    usefulHandEvaluationAffordableNow,
  );
  const topBlocked = usefulBlocked[0];
  const topBlockedCandidate = topBlocked?.fundingNeed
    ? {
        developmentRole: topBlocked.developmentRole,
        currentNeed: topBlocked.currentNeed,
        priority: topBlocked.priority,
        installOrPlayCost: topBlocked.fundingNeed.installOrPlayCost,
        missingCredits: topBlocked.fundingNeed.missingCredits,
        deferReason: topBlocked.deferReason,
      }
    : undefined;
  const handDevelopmentReserve =
    topBlockedCandidate?.installOrPlayCost ?? params.baseDesiredCreditReserve;
  const desiredCreditReserve = Math.max(
    params.baseDesiredCreditReserve,
    handDevelopmentReserve,
  );
  const fundingNeed =
    params.currentCredits < params.minimumCreditFloor ||
    (topBlockedCandidate !== undefined &&
      params.currentCredits < topBlockedCandidate.installOrPlayCost);
  const recommendation = creditBaseRecommendation({
    currentCredits: params.currentCredits,
    desiredCreditReserve,
    fundingNeed,
    usefulBlockedCount: usefulBlocked.length,
    usefulAffordableCount: usefulAffordable.length,
  });
  const economyPriority = creditBaseEconomyPriority({
    currentCredits: params.currentCredits,
    desiredCreditReserve,
    fundingNeed,
  });
  return {
    schemaVersion: RUNNER_CREDIT_BASE_PLAN_SCHEMA_VERSION,
    currentCredits: params.currentCredits,
    minimumCreditFloor: params.minimumCreditFloor,
    desiredCreditReserve,
    runCostReserve: params.riskAdjustedRunReserve ? 3 : 2,
    fundingNeed,
    usefulHandCardsBlockedByCredits: usefulBlocked.length,
    usefulHandCardsAffordableNow: usefulAffordable.length,
    ...(topBlockedCandidate
      ? { topBlockedHandCandidate: topBlockedCandidate }
      : {}),
    recommendation,
    economyPriority,
    evidence: [
      `current_credits:${params.currentCredits}`,
      `minimum_credit_floor:${params.minimumCreditFloor}`,
      `desired_credit_reserve:${desiredCreditReserve}`,
      `run_cost_reserve:${params.riskAdjustedRunReserve ? 3 : 2}`,
      `useful_hand_cards_blocked_by_credits:${usefulBlocked.length}`,
      `useful_hand_cards_affordable_now:${usefulAffordable.length}`,
      ...(topBlockedCandidate
        ? [
            `top_blocked_hand_role:${topBlockedCandidate.developmentRole}`,
            `top_blocked_hand_need:${topBlockedCandidate.currentNeed}`,
            `top_blocked_hand_missing_credits:${topBlockedCandidate.missingCredits}`,
            `top_blocked_hand_cost:${topBlockedCandidate.installOrPlayCost}`,
          ]
        : []),
      `credit_base_funding_need:${fundingNeed}`,
      `credit_base_recommendation:${recommendation}`,
      `credit_base_economy_priority:${economyPriority}`,
    ],
  };
}

function usefulHandEvaluationBlockedByCredits(
  evaluation: RunnerHandDevelopmentEvaluation,
): boolean {
  return (
    evaluation.availability === "missing_credits" &&
    evaluation.fundingNeed !== undefined &&
    usefulHandDevelopmentEvaluation(evaluation)
  );
}

function usefulHandEvaluationAffordableNow(
  evaluation: RunnerHandDevelopmentEvaluation,
): boolean {
  return (
    evaluation.availability === "legal_now" &&
    usefulHandDevelopmentEvaluation(evaluation)
  );
}

function usefulHandDevelopmentEvaluation(
  evaluation: RunnerHandDevelopmentEvaluation,
): boolean {
  if (
    evaluation.developmentRole === "duplicate_or_low_value" ||
    evaluation.developmentRole === "unknown"
  ) {
    return false;
  }
  if (evaluation.currentNeed === "none" || evaluation.currentNeed === "later") {
    return false;
  }
  return evaluation.priority >= 500;
}

function compareHandDevelopmentForCreditBase(
  left: RunnerHandDevelopmentEvaluation,
  right: RunnerHandDevelopmentEvaluation,
): number {
  return (
    right.priority - left.priority ||
    needRank(right.currentNeed) - needRank(left.currentNeed) ||
    left.developmentRole.localeCompare(right.developmentRole)
  );
}

function needRank(
  need: RunnerHandDevelopmentEvaluation["currentNeed"],
): number {
  switch (need) {
    case "acute":
      return 4;
    case "useful_now":
      return 3;
    case "setup":
      return 2;
    case "later":
      return 1;
    case "none":
      return 0;
  }
}

function creditBaseRecommendation(params: {
  currentCredits: number;
  desiredCreditReserve: number;
  fundingNeed: boolean;
  usefulBlockedCount: number;
  usefulAffordableCount: number;
}): RunnerCreditBasePlanRecommendation {
  if (params.fundingNeed && params.usefulBlockedCount > 0) {
    return "fund_useful_hand_card";
  }
  if (params.fundingNeed) return "build_credit_base";
  if (
    params.currentCredits >= 3 &&
    params.currentCredits <= 5 &&
    params.usefulAffordableCount > 0
  ) {
    return "allow_setup_spend";
  }
  if (params.currentCredits >= 6) return "allow_pressure";
  if (params.currentCredits < params.desiredCreditReserve) return "preserve_reserve";
  if (params.currentCredits < 6) return "preserve_reserve";
  return "allow_pressure";
}

function creditBaseEconomyPriority(params: {
  currentCredits: number;
  desiredCreditReserve: number;
  fundingNeed: boolean;
}): RunnerCreditBasePlan["economyPriority"] {
  if (params.fundingNeed || params.currentCredits <= 2) return "high";
  if (params.currentCredits < params.desiredCreditReserve) return "medium";
  return "low";
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
  const installedRunPayoff = installedRunPayoffForTarget(
    params.input,
    targetKind,
  );
  const scoreThreat = targetKind === "remote" && remoteHasScoreThreat(server);
  const accessPayoff = accessPayoffWithInstalledRunPayoff({
    basePayoff: payoff.accessPayoff,
    installedRunPayoff,
    scoreThreat,
  });
  const riskyUniversalCoverage = hasRiskyUniversalPressure(params) &&
    (server?.ice.length ?? 0) > 0;
  const pathPassability = pathPassabilityFor(path);
  const creditsAfterRun = path.creditsAfterPath;
  const multiaccessAvailable = installedRunPayoff.multiaccessAvailable;
  const stealOrTrashAffordable = stealOrTrashAffordableFor(accessPayoff);
  const recommendation = recommendationForRunTarget({
    targetKind,
    accessPayoff,
    knownAccessState: payoff.knownAccessState,
    pathPassability,
    creditsAfterRun,
    economyPosture,
    installedRunPayoff,
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
    installedRunPayoffScore: installedRunPayoff.scoreBonus,
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
    installedRunPayoff,
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
      `installed_run_payoff_score:${installedRunPayoff.scoreBonus}`,
      `risky_universal_coverage:${riskyUniversalCoverage}`,
      `score_threat:${scoreThreat}`,
      `recommendation:${recommendation}`,
      ...payoff.evidence.slice(0, 8),
      ...installedRunPayoff.evidence.slice(0, 8),
    ],
  };
}

function accessPayoffWithInstalledRunPayoff(params: {
  basePayoff: RunnerAccessPayoff;
  installedRunPayoff: RunnerInstalledRunPayoff;
  scoreThreat: boolean;
}): RunnerAccessPayoff {
  if (params.scoreThreat && params.basePayoff === "unknown") {
    return "score_threat";
  }
  if (
    params.basePayoff === "unknown" &&
    params.installedRunPayoff.immediateAccessValue >= 50
  ) {
    return "access_bonus";
  }
  return params.basePayoff;
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
  installedRunPayoff: RunnerInstalledRunPayoff;
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
  if (
    params.installedRunPayoff.immediateAccessValue >= 50 &&
    params.pathPassability === "reachable"
  ) {
    return "run_now";
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
  installedRunPayoffScore: number;
}): number {
  const payoffScore = scoreForPayoff(params.accessPayoff);
  const pathPenalty = params.pathPassability === "reachable" ? 0 : -420;
  const reservePenalty =
    params.creditsAfterRun < params.economyPosture.minimumCreditFloor ? -160 : 0;
  const multiaccessBonus = params.multiaccessAvailable ? 80 : 0;
  const installedRunPayoffBonus = params.installedRunPayoffScore;
  const scoreThreatBonus = params.scoreThreat ? 180 : 0;
  const recommendationScore = recommendationRank(params.recommendation) * 20;
  return (
    payoffScore +
    pathPenalty +
    reservePenalty +
    multiaccessBonus +
    installedRunPayoffBonus +
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

function installedRunPayoffForTarget(
  input: AiDecisionInput,
  targetKind: RunnerRunTargetKind,
): RunnerInstalledRunPayoff {
  const values = {
    immediateAccessValue: 0,
    futureSetupValue: 0,
    purgeTaxValue: 0,
    economyValue: 0,
    riskPenalty: 0,
  };
  let multiaccessAvailable = false;
  const evidence = new Set<string>();
  for (const card of input.playerView.own.rig ?? []) {
    if (card.known === false) continue;
    if (!card.definitionId) continue;
    const hint = AI_HINTS_BY_CARD.get(card.definitionId);
    const contribution = hint
      ? installedRunPayoffContributionForHint(hint, targetKind)
      : undefined;
    if (!contribution) continue;
    values.immediateAccessValue += contribution.immediateAccessValue;
    values.futureSetupValue += contribution.futureSetupValue;
    values.purgeTaxValue += contribution.purgeTaxValue;
    values.economyValue += contribution.economyValue;
    values.riskPenalty += contribution.riskPenalty;
    multiaccessAvailable ||= contribution.multiaccessAvailable;
    for (const fact of contribution.evidence) evidence.add(fact);
  }
  const rawScore =
    values.immediateAccessValue +
    values.futureSetupValue +
    values.purgeTaxValue +
    values.economyValue -
    values.riskPenalty;
  const scoreBonus = Math.max(
    0,
    Math.min(INSTALLED_RUN_PAYOFF_SCORE_CAP, rawScore),
  );
  return {
    ...values,
    scoreBonus,
    multiaccessAvailable,
    evidence: [...evidence].sort(),
  };
}

function installedRunPayoffContributionForHint(
  hint: AiCardHint,
  targetKind: RunnerRunTargetKind,
): RunnerInstalledRunPayoff {
  const effects = hint.effects ?? [];
  const contribution: RunnerInstalledRunPayoff = {
    immediateAccessValue: 0,
    futureSetupValue: 0,
    purgeTaxValue: 0,
    economyValue: 0,
    riskPenalty: 0,
    scoreBonus: 0,
    multiaccessAvailable: false,
    evidence: [],
  };
  const successfulRunTriggerMatches = effects.some((effect) =>
    effect.kind === "persistent_counter_effect" &&
    effect.timing === "successful_run" &&
    effectScopeMatchesTarget(effect.scope, targetKind)
  );
  for (const effect of effects) {
    const target = effectTarget(effect);
    if (effect.kind === "multiaccess" && effectScopeMatchesTarget(effect.scope, targetKind)) {
      contribution.multiaccessAvailable = true;
      contribution.immediateAccessValue += 90;
      contribution.evidence.push(
        `installed_run_payoff:${targetKind}:multiaccess`,
      );
      continue;
    }
    if (
      effect.kind === "hq_info" &&
      targetKind === "hq" &&
      effect.timing === "on_access"
    ) {
      contribution.immediateAccessValue += 60;
      contribution.evidence.push("installed_run_payoff:hq:hq_info");
      continue;
    }
    if (
      effect.kind === "topdeck_info" &&
      targetKind === "rd" &&
      (effect.timing === "on_access" || effect.timing === "successful_run")
    ) {
      contribution.immediateAccessValue += 60;
      contribution.evidence.push("installed_run_payoff:rd:topdeck_info");
      continue;
    }
    if (
      effect.kind === "access_replacement" &&
      effectScopeMatchesTarget(effect.scope, targetKind) &&
      (effect.timing === "on_access" || effect.timing === "successful_run")
    ) {
      contribution.immediateAccessValue += 45;
      contribution.evidence.push(
        `installed_run_payoff:${targetKind}:access_replacement`,
      );
      continue;
    }
    if (
      effect.kind === "persistent_counter_effect" &&
      effect.timing === "on_access" &&
      effectScopeMatchesTarget(effect.scope, targetKind) &&
      (target === "free_trash" ||
        target === "trash_untrashable" ||
        target === "access_trash_pressure")
    ) {
      contribution.immediateAccessValue += 70;
      contribution.evidence.push(
        `installed_run_payoff:${targetKind}:access_trash`,
      );
      continue;
    }
    if (
      effect.kind === "persistent_counter_effect" &&
      effect.timing === "successful_run" &&
      effectScopeMatchesTarget(effect.scope, targetKind)
    ) {
      contribution.futureSetupValue += 24;
      contribution.evidence.push(
        `installed_run_payoff:${targetKind}:successful_run_counter`,
      );
      continue;
    }
    if (
      effect.kind === "topdeck_info" &&
      targetKind === "rd" &&
      effect.timing === "start_of_turn"
    ) {
      contribution.futureSetupValue += 35;
      contribution.evidence.push("installed_run_payoff:rd:future_topdeck_info");
      continue;
    }
    if (
      effect.kind === "hq_info" &&
      targetKind === "hq" &&
      effect.timing === "start_of_turn"
    ) {
      contribution.futureSetupValue += 35;
      contribution.evidence.push("installed_run_payoff:hq:future_hq_info");
      continue;
    }
    if (
      effect.kind === "remote_tax" &&
      effectScopeMatchesTarget(effect.scope, targetKind)
    ) {
      contribution.futureSetupValue += targetKind === "remote" ? 45 : 24;
      contribution.evidence.push(
        `installed_run_payoff:${targetKind}:remote_tax`,
      );
      continue;
    }
    if (
      effect.kind === "global_modifier" &&
      effect.timing === "successful_run" &&
      effect.scope === "ice"
    ) {
      contribution.futureSetupValue += 24;
      contribution.evidence.push(
        `installed_run_payoff:${targetKind}:break_cost_support`,
      );
      continue;
    }
    if (
      effect.kind === "recurring_economy" &&
      (effectScopeMatchesTarget(effect.scope, targetKind) ||
        successfulRunTriggerMatches)
    ) {
      contribution.economyValue += 28;
      contribution.evidence.push(
        `installed_run_payoff:${targetKind}:economy_value`,
      );
      continue;
    }
    if (
      effect.kind === "delayed_penalty" &&
      target === "virus_purge" &&
      successfulRunTriggerMatches
    ) {
      contribution.purgeTaxValue += 10;
      contribution.evidence.push(
        `installed_run_payoff:${targetKind}:purge_tax`,
      );
      continue;
    }
    if (
      effect.kind === "run_tax" &&
      effect.scope === "runner" &&
      (effect.timing === "action" || effect.timing === "successful_run")
    ) {
      contribution.riskPenalty += 25;
      contribution.evidence.push(
        `installed_run_payoff:${targetKind}:risk_tax`,
      );
    }
  }
  const rawScore =
    contribution.immediateAccessValue +
    contribution.futureSetupValue +
    contribution.purgeTaxValue +
    contribution.economyValue -
    contribution.riskPenalty;
  return {
    ...contribution,
    scoreBonus: Math.max(0, Math.min(INSTALLED_RUN_PAYOFF_SCORE_CAP, rawScore)),
  };
}

function effectScopeMatchesTarget(
  scope: string | undefined,
  targetKind: RunnerRunTargetKind,
): boolean {
  if (!scope) return false;
  if (targetKind === "rd" && scope === "rnd") return true;
  if (scope === targetKind) return true;
  if (scope === "server") return true;
  if (targetKind === "remote" && scope === "remote") return true;
  return false;
}

function effectTarget(effect: NonNullable<AiCardHint["effects"]>[number]): string | undefined {
  const target = (effect as Record<string, unknown>).target;
  return typeof target === "string" ? target : undefined;
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
