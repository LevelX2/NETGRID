import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";
import type { DeckCapabilityProfile } from "./deck-capabilities";
import type { RunnerHandDevelopmentEvaluation } from "./runner-hand-development";
import type { RunnerStrategicIntentProfile } from "./runner-strategic-intent";
import { assessKnownRezzedIcePath } from "./visible-run-analysis";
import type {
  EvaluateRunnerRunTargetsParams,
  RunnerCreditBasePlan,
  RunnerCreditBasePlanRecommendation,
  RunnerCreditReservePhase,
  RunnerCreditReservePolicy,
  RunnerEconomyPosture,
  RunnerRemoteScoreThreat,
} from "./runner-run-target-evaluation";

const RUNNER_ECONOMY_POSTURE_SCHEMA_VERSION =
  "runner-economy-posture-v1" as const;
const RUNNER_CREDIT_BASE_PLAN_SCHEMA_VERSION =
  "runner-credit-base-plan-v1" as const;

type EconomyPostureParams = EvaluateRunnerRunTargetsParams & {
  strategicIntent?: RunnerStrategicIntentProfile;
  deckCapabilities?: DeckCapabilityProfile;
};

export function buildRunnerEconomyPosture(
  params: EconomyPostureParams,
): RunnerEconomyPosture {
  const credits = params.input.playerView.own.credits;
  const setupEngine = new Set(params.strategicIntent?.setupEngine ?? []);
  const riskAdjustedRunReserve = hasRiskyUniversalPressure(params);
  const bankToolsRelevant =
    (params.deckCapabilities?.runner?.economyBankTools.length ?? 0) > 0;
  const remoteScoreThreat = runnerRemoteScoreThreat(params.input);
  const phase = runnerCreditReservePhase(params.input, remoteScoreThreat);
  const minimumCreditFloor =
    riskAdjustedRunReserve || phase === "late_contest" ? 3 : 2;
  const baseDesiredCreditReserve = Math.max(
    phase === "opening" ? 4 : phase === "midgame" ? 5 : 6,
    riskAdjustedRunReserve || bankToolsRelevant ? 6 : 4,
  );
  const creditReservePolicy = buildRunnerCreditReservePolicy({
    input: params.input,
    phase,
    currentCredits: credits,
    minimumCreditFloor,
    baseDesiredCreditReserve,
    riskAdjustedRunReserve,
    bankToolsRelevant,
    remoteScoreThreat,
    handDevelopmentEvaluations: params.handDevelopmentEvaluations ?? [],
  });
  const creditBasePlan = buildRunnerCreditBasePlan({
    currentCredits: credits,
    minimumCreditFloor,
    creditReservePolicy,
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
    setupEngine.has("runner.economy_setup_before_pressure");
  const recommendation = fundingNeed && hasCashOut
    ? "cash_out_bank"
    : fundingNeed || (buildEconomyBeforePressure && credits < desiredCreditReserve)
      ? "build_economy"
      : "stable";
  return {
    schemaVersion: RUNNER_ECONOMY_POSTURE_SCHEMA_VERSION,
    minimumCreditFloor,
    desiredCreditReserve,
    creditReservePolicy,
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
      `credit_reserve_phase:${creditReservePolicy.phase}`,
      `credit_reserve_remote_score_threat:${creditReservePolicy.remoteScoreThreat}`,
      `credit_reserve_contest:${creditReservePolicy.contestReserve}`,
      `credit_reserve_development:${creditReservePolicy.developmentReserve}`,
      `credit_reserve_emergency:${creditReservePolicy.emergencyReserve}`,
      `credit_reserve_below_now:${creditReservePolicy.belowReserveNow}`,
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
  creditReservePolicy: RunnerCreditReservePolicy;
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
  const desiredCreditReserve = params.creditReservePolicy.desiredCreditReserve;
  const fundingNeed =
    params.currentCredits < params.minimumCreditFloor ||
    (params.creditReservePolicy.remoteScoreThreat !== "none" &&
      params.currentCredits < params.creditReservePolicy.contestReserve) ||
    (topBlockedCandidate !== undefined &&
      params.currentCredits < topBlockedCandidate.installOrPlayCost);
  const recommendation = creditBaseRecommendation({
    currentCredits: params.currentCredits,
    desiredCreditReserve,
    fundingNeed,
    remoteScoreThreat: params.creditReservePolicy.remoteScoreThreat,
    usefulBlockedCount: usefulBlocked.length,
    usefulAffordableCount: usefulAffordable.length,
  });
  const economyPriority = creditBaseEconomyPriority({
    currentCredits: params.currentCredits,
    desiredCreditReserve,
    fundingNeed,
    remoteScoreThreat: params.creditReservePolicy.remoteScoreThreat,
  });
  return {
    schemaVersion: RUNNER_CREDIT_BASE_PLAN_SCHEMA_VERSION,
    currentCredits: params.currentCredits,
    minimumCreditFloor: params.minimumCreditFloor,
    desiredCreditReserve,
    runCostReserve: params.creditReservePolicy.breakerUseReserve,
    creditReservePolicy: params.creditReservePolicy,
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
      `run_cost_reserve:${params.creditReservePolicy.breakerUseReserve}`,
      `contest_reserve:${params.creditReservePolicy.contestReserve}`,
      `development_reserve:${params.creditReservePolicy.developmentReserve}`,
      `emergency_reserve:${params.creditReservePolicy.emergencyReserve}`,
      `remote_score_threat:${params.creditReservePolicy.remoteScoreThreat}`,
      `below_reserve_now:${params.creditReservePolicy.belowReserveNow}`,
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
      ...params.creditReservePolicy.evidence,
    ],
  };
}

function buildRunnerCreditReservePolicy(params: {
  input: AiDecisionInput;
  phase: RunnerCreditReservePhase;
  currentCredits: number;
  minimumCreditFloor: number;
  baseDesiredCreditReserve: number;
  riskAdjustedRunReserve: boolean;
  bankToolsRelevant: boolean;
  remoteScoreThreat: RunnerRemoteScoreThreat;
  handDevelopmentEvaluations: readonly RunnerHandDevelopmentEvaluation[];
}): RunnerCreditReservePolicy {
  const developmentReserve = runnerDevelopmentReserve(
    params.handDevelopmentEvaluations,
    params.baseDesiredCreditReserve,
  );
  const breakerUseReserve = params.riskAdjustedRunReserve ? 3 : 2;
  const canContestIfFunded = runnerCanContestRemoteIfFunded(
    params.input,
    params.remoteScoreThreat,
  );
  const contestReserve = runnerContestReserve({
    phase: params.phase,
    remoteScoreThreat: params.remoteScoreThreat,
    canContestIfFunded,
  });
  const emergencyReserve = runnerEmergencyReserve(params.input);
  const desiredCreditReserve = Math.max(
    params.minimumCreditFloor,
    params.baseDesiredCreditReserve,
    breakerUseReserve,
    contestReserve,
    developmentReserve,
    emergencyReserve,
  );
  const reserveDrivers = [
    `phase:${params.phase}`,
    ...(params.riskAdjustedRunReserve ? ["breaker_use_reserve"] : []),
    ...(params.bankToolsRelevant ? ["bank_tools"] : []),
    ...(params.remoteScoreThreat !== "none"
      ? [`remote_score_threat:${params.remoteScoreThreat}`]
      : []),
    ...(developmentReserve > params.baseDesiredCreditReserve
      ? ["development_reserve"]
      : []),
    ...(emergencyReserve > 0 ? ["emergency_reserve"] : []),
  ];
  const belowReserveNow = params.currentCredits < desiredCreditReserve;

  return {
    schemaVersion: 1,
    phase: params.phase,
    currentCredits: params.currentCredits,
    minimumCreditFloor: params.minimumCreditFloor,
    breakerUseReserve,
    contestReserve,
    developmentReserve,
    emergencyReserve,
    desiredCreditReserve,
    remoteScoreThreat: params.remoteScoreThreat,
    canContestIfFunded,
    belowReserveNow,
    spendingWouldDropBelowReserve: false,
    reserveDrivers,
    reserveOverrides: [],
    evidence: [
      `credit_reserve_phase:${params.phase}`,
      `current_credits:${params.currentCredits}`,
      `minimum_credit_floor:${params.minimumCreditFloor}`,
      `breaker_use_reserve:${breakerUseReserve}`,
      `contest_reserve:${contestReserve}`,
      `development_reserve:${developmentReserve}`,
      `emergency_reserve:${emergencyReserve}`,
      `desired_credit_reserve:${desiredCreditReserve}`,
      `remote_score_threat:${params.remoteScoreThreat}`,
      `can_contest_if_funded:${canContestIfFunded}`,
      `below_reserve_now:${belowReserveNow}`,
      ...reserveDrivers.map((driver) => `reserve_driver:${driver}`),
    ],
  };
}

function runnerDevelopmentReserve(
  evaluations: readonly RunnerHandDevelopmentEvaluation[],
  baseDesiredCreditReserve: number,
): number {
  const topBlocked = evaluations
    .filter(usefulHandEvaluationBlockedByCredits)
    .sort(compareHandDevelopmentForCreditBase)[0];
  return Math.max(
    baseDesiredCreditReserve,
    topBlocked?.fundingNeed?.installOrPlayCost ?? 0,
  );
}

function runnerCanContestRemoteIfFunded(
  input: AiDecisionInput,
  remoteScoreThreat: RunnerRemoteScoreThreat,
): boolean {
  if (remoteScoreThreat === "none") return false;
  return input.playerView.servers.some((server) => {
    if (!remoteHasScoreThreat(server)) return false;
    const hasRunAction = input.legalActions.some(
      (action) =>
        action.type === "start_run" && actionServerId(action) === server.id,
    );
    if (!hasRunAction) return false;
    const path = assessKnownRezzedIcePath(
      server.ice,
      input.playerView.own.rig ?? [],
      input.playerView.own.credits,
      server.root,
    );
    return (
      !path.knownPathBlockedByMissingCoverage &&
      !path.knownPathBlockedByUnbreakableIce
    );
  });
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
  remoteScoreThreat: RunnerRemoteScoreThreat;
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
  remoteScoreThreat: RunnerRemoteScoreThreat;
}): RunnerCreditBasePlan["economyPriority"] {
  if (params.fundingNeed || params.currentCredits <= 2) return "high";
  if (
    params.remoteScoreThreat !== "none" &&
    params.currentCredits < params.desiredCreditReserve
  )
    return "high";
  if (params.currentCredits < params.desiredCreditReserve) return "medium";
  return "low";
}


function hasRiskyUniversalPressure(
  params: EconomyPostureParams,
): boolean {
  const riskProfile = new Set(params.strategicIntent?.riskProfile ?? []);
  return (
    riskProfile.has("runner.risky_universal_breaker_pressure") ||
    (params.deckCapabilities?.runner?.breakerInventory.some(
      (breaker) => {
        const coverage = new Set(breaker.coverage);
        return coverage.has("universal") && breaker.risks.length > 0;
      },
    ) ?? false)
  );
}

function runnerCreditReservePhase(
  input: AiDecisionInput,
  remoteScoreThreat: RunnerRemoteScoreThreat,
): RunnerCreditReservePhase {
  if (
    remoteScoreThreat === "urgent" ||
    input.playerView.opponent.agendaPoints >= input.playerView.agendaPointsToWin - 2
  ) {
    return "late_contest";
  }
  if (remoteScoreThreat === "visible") return "late_contest";
  return input.playerView.stateVersion <= 8 ? "opening" : "midgame";
}

function runnerRemoteScoreThreat(input: AiDecisionInput): RunnerRemoteScoreThreat {
  let threat: RunnerRemoteScoreThreat = "none";
  for (const server of input.playerView.servers) {
    if (!server.id.startsWith("remote_")) continue;
    if (server.root.length === 0) continue;
    const advancedRoot = server.root.some(
      (card) => (card.advancementCounters ?? 0) > 0,
    );
    const urgentRoot = server.root.some(
      (card) => (card.advancementCounters ?? 0) >= 2,
    );
    const knownAgenda = server.root.some(
      (card) => card.known && card.type === "agenda",
    );
    if (
      urgentRoot ||
      knownAgenda ||
      input.playerView.opponent.agendaPoints >= input.playerView.agendaPointsToWin - 2
    ) {
      return "urgent";
    }
    if (advancedRoot) threat = maxRemoteScoreThreat(threat, "visible");
    else threat = maxRemoteScoreThreat(threat, "possible");
  }
  return threat;
}

function maxRemoteScoreThreat(
  left: RunnerRemoteScoreThreat,
  right: RunnerRemoteScoreThreat,
): RunnerRemoteScoreThreat {
  return remoteScoreThreatRank(right) > remoteScoreThreatRank(left)
    ? right
    : left;
}

function remoteScoreThreatRank(threat: RunnerRemoteScoreThreat): number {
  switch (threat) {
    case "urgent":
      return 3;
    case "visible":
      return 2;
    case "possible":
      return 1;
    case "none":
      return 0;
  }
}

function runnerContestReserve(params: {
  phase: RunnerCreditReservePhase;
  remoteScoreThreat: RunnerRemoteScoreThreat;
  canContestIfFunded: boolean;
}): number {
  if (params.remoteScoreThreat === "none") return 0;
  if (!params.canContestIfFunded) return 0;
  if (params.remoteScoreThreat === "urgent") return 8;
  if (params.remoteScoreThreat === "visible") return 6;
  if (params.phase === "late_contest") return 6;
  return params.canContestIfFunded ? 5 : 4;
}

function runnerEmergencyReserve(input: AiDecisionInput): number {
  return input.playerView.own.tags > 0 ? 3 : 0;
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

function actionServerId(action: LegalAction): string | undefined {
  const value = action.payload?.serverId;
  return typeof value === "string" ? value : undefined;
}

function isBankPayoutAction(action: LegalAction): boolean {
  return (
    (action.type === "trigger_ability" ||
      action.type === "activated_card_ability") &&
    action.payload?.cardImplementationTakesHostedCredits === true
  );
}
