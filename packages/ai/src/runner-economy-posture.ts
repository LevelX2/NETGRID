import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";
import type { DeckCapabilityProfile } from "./deck-capabilities";
import type { RunnerHandDevelopmentEvaluation } from "./runner/hand-development/runner-hand-development-types";
import type { RunnerStrategicIntentProfile } from "./runner-strategic-intent";
import { runnerDamageThreatAssessment } from "./runner-damage-threat-assessment";
import {
  exactBankCashOutPayout,
  exactBankCashOutTakeAmount,
} from "./actions/action-economy-projection";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "./visible-run-analysis";
import type {
  EvaluateRunnerRunTargetsParams,
  RunnerCreditBasePlan,
  RunnerCreditBasePlanRecommendation,
  RunnerCreditReservePhase,
  RunnerCreditReservePolicy,
  RunnerEconomyRoute,
  RunnerEconomyPosture,
  RunnerEconomyTransitionAssessment,
  RunnerRemoteScoreThreat,
} from "./run-analysis/runner-run-target-types";

const RUNNER_ECONOMY_POSTURE_SCHEMA_VERSION =
  "runner-economy-posture-v1" as const;
const RUNNER_CREDIT_BASE_PLAN_SCHEMA_VERSION =
  "runner-credit-base-plan-v1" as const;

type EconomyPostureParams = EvaluateRunnerRunTargetsParams & {
  strategicIntent?: RunnerStrategicIntentProfile;
  deckCapabilities?: DeckCapabilityProfile;
};

type RunnerRemotePressureReserveAssessment = {
  active: boolean;
  reserve: number;
  rdPressureSpendTarget: number;
  runwayTarget: number;
  reserveOverrides: string[];
  serverId?: string;
  visiblePathCost: number;
  unrezzedIceRiskBuffer: number;
  postRunReserve: number;
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
  const flatlineRisk = runnerDamageThreatAssessment(params.input).flatlineRisk;
  const damageThreatFloor =
    flatlineRisk.level === "critical"
      ? 4
      : flatlineRisk.level === "confirmed"
        ? 3
        : 2;
  const minimumCreditFloor = Math.max(
    riskAdjustedRunReserve || phase === "late_contest" ? 3 : 2,
    damageThreatFloor,
  );
  const baseDesiredCreditReserve = Math.max(
    phase === "opening" ? 4 : phase === "midgame" ? 5 : 6,
    riskAdjustedRunReserve || bankToolsRelevant ? 6 : 4,
    flatlineRisk.level === "critical"
      ? 6
      : flatlineRisk.level === "confirmed"
        ? 5
        : 4,
  );
  const convertibleBankCredits = runnerConvertibleBankCredits(params.input);
  const availableCreditPool = credits + convertibleBankCredits;
  const remotePressureReserve = runnerRemotePressureReserveAssessment({
    input: params.input,
    phase,
    remoteScoreThreat,
    economyCanSustainPressure:
      runnerCanGrowPressureEconomy(params.input) || availableCreditPool >= 10,
  });
  const creditReservePolicy = buildRunnerCreditReservePolicy({
    input: params.input,
    phase,
    currentCredits: credits,
    minimumCreditFloor,
    baseDesiredCreditReserve,
    riskAdjustedRunReserve,
    bankToolsRelevant,
    remoteScoreThreat,
    convertibleBankCredits,
    availableCreditPool,
    remotePressureReserve,
    handDevelopmentEvaluations: params.handDevelopmentEvaluations ?? [],
  });
  const creditBasePlan = buildRunnerCreditBasePlan({
    currentCredits: credits,
    minimumCreditFloor,
    creditReservePolicy,
    reserveAvailableCredits: availableCreditPool,
    riskAdjustedRunReserve,
    handDevelopmentEvaluations: params.handDevelopmentEvaluations ?? [],
    canDraw: params.input.legalActions.some(
      (action) => action.type === "draw_card",
    ),
  });
  const desiredCreditReserve = creditBasePlan.desiredCreditReserve;
  const fundingNeed = creditBasePlan.fundingNeed;
  const hasCashOut = params.input.legalActions.some(isBankPayoutAction);
  const transition = buildRunnerEconomyTransitionAssessment({
    ...params,
    remoteScoreThreat,
    creditBasePlan,
  });
  const buildEconomyBeforePressure =
    credits <= 2 ||
    (creditBasePlan.economyPriority === "high" &&
      availableCreditPool < creditBasePlan.desiredCreditReserve) ||
    (transition.phase === "economy_transition" &&
      transition.commitment !== "none") ||
    (setupEngine.has("runner.economy_setup_before_pressure") &&
      availableCreditPool < creditBasePlan.desiredCreditReserve);
  const recommendation =
    fundingNeed && hasCashOut
      ? "cash_out_bank"
      : fundingNeed ||
          (buildEconomyBeforePressure && credits < desiredCreditReserve)
        ? "build_economy"
        : "stable";
  const preferredEconomyRoute = runnerPreferredEconomyRoute(params, {
    bankToolsRelevant,
    buildEconomyBeforePressure,
    fundingNeed,
    hasCashOut,
  });
  return {
    schemaVersion: RUNNER_ECONOMY_POSTURE_SCHEMA_VERSION,
    minimumCreditFloor,
    desiredCreditReserve,
    creditReservePolicy,
    creditBasePlan,
    preferredEconomyRoute,
    transition,
    riskAdjustedRunReserve,
    buildEconomyBeforePressure,
    bankToolsRelevant,
    fundingNeed,
    recommendation,
    evidence: [
      `runner_credits:${credits}`,
      `runner_convertible_bank_credits:${convertibleBankCredits}`,
      `runner_available_credit_pool:${availableCreditPool}`,
      `minimum_credit_floor:${minimumCreditFloor}`,
      `flatline_risk_level:${flatlineRisk.level}`,
      `damage_threat_credit_floor:${damageThreatFloor}`,
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
      `economy_route:${preferredEconomyRoute}`,
      ...transition.evidence,
    ],
  };
}

function runnerPreferredEconomyRoute(
  params: EconomyPostureParams,
  context: {
    bankToolsRelevant: boolean;
    buildEconomyBeforePressure: boolean;
    fundingNeed: boolean;
    hasCashOut: boolean;
  },
): RunnerEconomyRoute {
  if (context.fundingNeed && context.hasCashOut) return "bank_cashout";
  if (runnerHasInstalledActionEconomy(params.input)) {
    return "installed_action_economy";
  }
  const longFundingGap =
    params.handDevelopmentEvaluations
      ?.filter(usefulHandEvaluationBlockedByCredits)
      .sort(compareHandDevelopmentForCreditBase)[0]?.fundingNeed
      ?.missingCredits ?? 0;
  if (
    longFundingGap >= 4 &&
    params.input.legalActions.some((action) => action.type === "draw_card")
  ) {
    return "draw_for_economy";
  }
  const handEconomyRoute = runnerHandEconomyRoute(
    params.handDevelopmentEvaluations ?? [],
  );
  if (
    handEconomyRoute &&
    (context.buildEconomyBeforePressure ||
      context.fundingNeed ||
      context.bankToolsRelevant)
  ) {
    return handEconomyRoute;
  }
  if (runnerHasBurstEconomyEvent(params.input)) return "burst_event";
  if (
    context.bankToolsRelevant &&
    params.deckCapabilities?.runner?.economyBankTools.some(
      (tool) => tool.buildActionLegal,
    ) === true &&
    params.input.playerView.own.credits >= 4
  ) {
    return "bank_build";
  }
  if (handEconomyRoute) return handEconomyRoute;
  return "basic_credit_fallback";
}

function runnerHandEconomyRoute(
  evaluations: readonly RunnerHandDevelopmentEvaluation[],
): RunnerEconomyRoute | undefined {
  const legalEconomy = evaluations.find(
    (evaluation) =>
      evaluation.availability === "legal_now" &&
      evaluation.legalActionId !== undefined &&
      evaluation.currentNeed !== "none" &&
      evaluation.currentNeed !== "later" &&
      (evaluation.developmentRole === "bank_tool" ||
        evaluation.developmentRole === "economy_engine"),
  );
  if (!legalEconomy) return undefined;
  return legalEconomy.developmentRole === "bank_tool"
    ? "hand_bank_tool"
    : "hand_economy_engine";
}

function runnerHasInstalledActionEconomy(input: AiDecisionInput): boolean {
  return input.legalActions.some(
    (action) =>
      (action.type === "activated_card_ability" ||
        action.type === "trigger_ability") &&
      (isBankPayoutAction(action) ||
        runnerLegalActionPayloadCreditGain(action) > 1),
  );
}

function runnerCanGrowPressureEconomy(input: AiDecisionInput): boolean {
  if (
    input.legalActions.some(
      (action) =>
        !isBankPayoutAction(action) &&
        (action.type === "activated_card_ability" ||
          action.type === "trigger_ability" ||
          action.type === "play_event") &&
        runnerLegalActionPayloadCreditGain(action) > 1,
    )
  ) {
    return true;
  }
  return (input.playerView.own.rig ?? []).some((card) => {
    const text = `${card.rulesText ?? ""}`.toLowerCase();
    const renewableGrowth =
      text.includes("recurring credit") ||
      text.includes("recurring credits") ||
      (text.includes("gain credits") &&
        (text.includes("start of your turn") ||
          text.includes("once per turn")));
    const runRestricted =
      text.includes("only during a run") ||
      text.includes("only to pay for using icebreakers") ||
      text.includes("run credits");
    return renewableGrowth && !runRestricted;
  });
}

function runnerHasBurstEconomyEvent(input: AiDecisionInput): boolean {
  return input.legalActions.some(
    (action) =>
      action.type === "play_event" &&
      runnerLegalActionPayloadCreditGain(action) > 1,
  );
}

function runnerLegalActionPayloadCreditGain(action: LegalAction): number {
  return Math.max(
    0,
    runnerLegalActionNumberPayload(action, "gainCreditsAmount"),
    runnerLegalActionNumberPayload(action, "gainedCredits"),
    runnerLegalActionNumberPayload(action, "amount"),
  );
}

function runnerLegalActionNumberPayload(
  action: LegalAction,
  key: string,
): number {
  const value = action.payload?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function buildRunnerCreditBasePlan(params: {
  currentCredits: number;
  reserveAvailableCredits: number;
  minimumCreditFloor: number;
  creditReservePolicy: RunnerCreditReservePolicy;
  riskAdjustedRunReserve: boolean;
  handDevelopmentEvaluations: readonly RunnerHandDevelopmentEvaluation[];
  canDraw: boolean;
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
      params.reserveAvailableCredits <
        params.creditReservePolicy.contestReserve) ||
    (params.creditReservePolicy.remotePressureReserveActive &&
      params.reserveAvailableCredits < desiredCreditReserve) ||
    (topBlockedCandidate !== undefined &&
      params.currentCredits < topBlockedCandidate.installOrPlayCost);
  const recommendation = creditBaseRecommendation({
    currentCredits: params.currentCredits,
    reserveAvailableCredits: params.reserveAvailableCredits,
    desiredCreditReserve,
    fundingNeed,
    remoteScoreThreat: params.creditReservePolicy.remoteScoreThreat,
    usefulBlockedCount: usefulBlocked.length,
    usefulAffordableCount: usefulAffordable.length,
    canDraw: params.canDraw,
    ...(topBlockedCandidate
      ? { topBlockedMissingCredits: topBlockedCandidate.missingCredits }
      : {}),
  });
  const economyPriority = creditBaseEconomyPriority({
    currentCredits: params.currentCredits,
    reserveAvailableCredits: params.reserveAvailableCredits,
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
  convertibleBankCredits: number;
  availableCreditPool: number;
  remotePressureReserve: RunnerRemotePressureReserveAssessment;
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
    params.remotePressureReserve.reserve,
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
    ...(params.remotePressureReserve.active ? ["remote_pressure_reserve"] : []),
  ];
  const belowReserveNow = params.availableCreditPool < desiredCreditReserve;
  const spendingWouldDropBelowReserve = params.input.legalActions.some(
    (action) => {
      const cost = action.costs.reduce(
        (sum, entry) => sum + Math.max(0, entry.credits ?? 0),
        0,
      );
      return (
        cost > 0 && params.availableCreditPool - cost < desiredCreditReserve
      );
    },
  );

  return {
    schemaVersion: 1,
    phase: params.phase,
    currentCredits: params.currentCredits,
    convertibleBankCredits: params.convertibleBankCredits,
    availableCreditPool: params.availableCreditPool,
    minimumCreditFloor: params.minimumCreditFloor,
    breakerUseReserve,
    contestReserve,
    remotePressureReserve: params.remotePressureReserve.reserve,
    remotePressureReserveActive: params.remotePressureReserve.active,
    rdPressureSpendTarget: params.remotePressureReserve.rdPressureSpendTarget,
    pressureRunwayTarget: params.remotePressureReserve.runwayTarget,
    developmentReserve,
    emergencyReserve,
    desiredCreditReserve,
    remoteScoreThreat: params.remoteScoreThreat,
    canContestIfFunded,
    belowReserveNow,
    spendingWouldDropBelowReserve,
    reserveDrivers,
    reserveOverrides: params.remotePressureReserve.reserveOverrides,
    evidence: [
      `credit_reserve_phase:${params.phase}`,
      `current_credits:${params.currentCredits}`,
      `minimum_credit_floor:${params.minimumCreditFloor}`,
      `breaker_use_reserve:${breakerUseReserve}`,
      `contest_reserve:${contestReserve}`,
      `desired_credit_reserve:${desiredCreditReserve}`,
      `remote_score_threat:${params.remoteScoreThreat}`,
      `can_contest_if_funded:${canContestIfFunded}`,
      `convertible_bank_credits:${params.convertibleBankCredits}`,
      `available_credit_pool:${params.availableCreditPool}`,
      `remote_pressure_reserve:${params.remotePressureReserve.reserve}`,
      `remote_pressure_server:${params.remotePressureReserve.serverId ?? "none"}`,
      `remote_pressure_reserve_active:${params.remotePressureReserve.active}`,
      `rd_pressure_spend_target:${params.remotePressureReserve.rdPressureSpendTarget}`,
      `pressure_runway_target:${params.remotePressureReserve.runwayTarget}`,
      `development_reserve:${developmentReserve}`,
      `emergency_reserve:${emergencyReserve}`,
      `below_reserve_now:${belowReserveNow}`,
      `spending_would_drop_below_reserve:${spendingWouldDropBelowReserve}`,
      ...params.remotePressureReserve.reserveOverrides.map(
        (override) => `reserve_override:${override}`,
      ),
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
  reserveAvailableCredits: number;
  desiredCreditReserve: number;
  fundingNeed: boolean;
  remoteScoreThreat: RunnerRemoteScoreThreat;
  usefulBlockedCount: number;
  usefulAffordableCount: number;
  topBlockedMissingCredits?: number;
  canDraw: boolean;
}): RunnerCreditBasePlanRecommendation {
  if (
    params.fundingNeed &&
    params.usefulBlockedCount > 0 &&
    params.canDraw &&
    (params.topBlockedMissingCredits ?? 0) >= 4
  ) {
    return "acquire_economy";
  }
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
  if (
    params.currentCredits >= 6 &&
    params.reserveAvailableCredits >= params.desiredCreditReserve
  )
    return "allow_pressure";
  if (params.reserveAvailableCredits < params.desiredCreditReserve)
    return "preserve_reserve";
  if (params.currentCredits < 6) return "preserve_reserve";
  return "allow_pressure";
}

function buildRunnerEconomyTransitionAssessment(
  params: EconomyPostureParams & {
    remoteScoreThreat: RunnerRemoteScoreThreat;
    creditBasePlan: RunnerCreditBasePlan;
  },
): RunnerEconomyTransitionAssessment {
  const sustainableEconomyInstalled = runnerHasInstalledSustainableEconomy(
    params.input,
    params.deckCapabilities,
  );
  const totalIce = params.input.playerView.servers.reduce(
    (sum, server) => sum + server.ice.length,
    0,
  );
  const maximumServerDepth = Math.max(
    0,
    ...params.input.playerView.servers.map((server) => server.ice.length),
  );
  const endgameContest =
    params.remoteScoreThreat === "urgent" ||
    params.remoteScoreThreat === "visible" ||
    params.input.playerView.opponent.agendaPoints >=
      params.input.playerView.agendaPointsToWin - 2 ||
    params.input.playerView.own.agendaPoints >=
      params.input.playerView.agendaPointsToWin - 2;
  const boardEconomyPressure =
    maximumServerDepth >= 2 ||
    totalIce >= 3 ||
    params.input.playerView.opponent.credits >= 8;
  const phase = endgameContest
    ? "endgame_contest"
    : sustainableEconomyInstalled
      ? "sustainable_pressure"
      : boardEconomyPressure || params.input.playerView.stateVersion > 8
        ? "economy_transition"
        : "opening_access";
  const economyEvaluations = (params.handDevelopmentEvaluations ?? [])
    .filter(
      (evaluation) =>
        evaluation.developmentRole === "economy_engine" ||
        evaluation.developmentRole === "bank_tool",
    )
    .sort(compareHandDevelopmentForCreditBase);
  const legalEconomy = economyEvaluations.find(
    (evaluation) =>
      evaluation.availability === "legal_now" &&
      evaluation.legalActionId !== undefined &&
      evaluation.currentNeed !== "none" &&
      evaluation.currentNeed !== "later",
  );
  const blockedEconomy = economyEvaluations.find(
    usefulHandEvaluationBlockedByCredits,
  );
  const missingCredits = blockedEconomy?.fundingNeed?.missingCredits;
  const fundingHorizon =
    missingCredits === undefined
      ? "none"
      : missingCredits <= 3
        ? "short"
        : "long";
  const economyKnownInDeck =
    params.deckCapabilities?.runner?.economyBankTools.some(
      (tool) => tool.status === "in_deck",
    ) === true;
  const canDraw = params.input.legalActions.some(
    (action) => action.type === "draw_card",
  );
  const canActivateEconomy = runnerHasInstalledActionEconomy(params.input);
  const commitment = legalEconomy
    ? "install_economy"
    : blockedEconomy && fundingHorizon === "short"
      ? "fund_economy"
      : blockedEconomy && canDraw
        ? "acquire_economy"
        : canActivateEconomy
          ? "activate_economy"
          : phase === "economy_transition" && economyKnownInDeck && canDraw
            ? "acquire_economy"
            : "none";
  const ordinaryPaidRunsDeferred =
    phase === "economy_transition" && commitment !== "none";
  const targetCardInstanceId = (legalEconomy ?? blockedEconomy)?.cardInstanceId;
  return {
    phase,
    commitment,
    fundingHorizon,
    ...(targetCardInstanceId ? { targetCardInstanceId } : {}),
    ...(missingCredits !== undefined ? { missingCredits } : {}),
    sustainableEconomyInstalled,
    ordinaryPaidRunsDeferred,
    evidence: [
      `economy_transition_phase:${phase}`,
      `economy_transition_commitment:${commitment}`,
      `economy_transition_funding_horizon:${fundingHorizon}`,
      `economy_transition_sustainable_installed:${sustainableEconomyInstalled}`,
      `economy_transition_total_ice:${totalIce}`,
      `economy_transition_max_server_depth:${maximumServerDepth}`,
      `economy_transition_corp_credits:${params.input.playerView.opponent.credits}`,
      `economy_transition_paid_runs_deferred:${ordinaryPaidRunsDeferred}`,
      ...(missingCredits !== undefined
        ? [`economy_transition_missing_credits:${missingCredits}`]
        : []),
    ],
  };
}

function runnerHasInstalledSustainableEconomy(
  input: AiDecisionInput,
  deckCapabilities: DeckCapabilityProfile | undefined,
): boolean {
  if (
    deckCapabilities?.runner?.economyBankTools.some(
      (tool) => tool.status === "installed",
    ) === true
  ) {
    return true;
  }
  if (runnerHasInstalledActionEconomy(input)) return true;
  return (input.playerView.own.rig ?? []).some((card) => {
    const text = `${card.rulesText ?? ""}`.toLowerCase();
    const renewable =
      text.includes("recurring credit") ||
      text.includes("recurring credits") ||
      text.includes("gain credits") ||
      text.includes("take credits");
    const runRestricted =
      text.includes("only during a run") ||
      text.includes("only to pay for using icebreakers") ||
      text.includes("run credits");
    return renewable && !runRestricted;
  });
}

function creditBaseEconomyPriority(params: {
  currentCredits: number;
  reserveAvailableCredits: number;
  desiredCreditReserve: number;
  fundingNeed: boolean;
  remoteScoreThreat: RunnerRemoteScoreThreat;
}): RunnerCreditBasePlan["economyPriority"] {
  if (params.fundingNeed || params.currentCredits <= 2) return "high";
  if (
    params.remoteScoreThreat !== "none" &&
    params.reserveAvailableCredits < params.desiredCreditReserve
  )
    return "high";
  if (params.reserveAvailableCredits < params.desiredCreditReserve)
    return "medium";
  return "low";
}

function hasRiskyUniversalPressure(params: EconomyPostureParams): boolean {
  const riskProfile = new Set(params.strategicIntent?.riskProfile ?? []);
  return (
    riskProfile.has("runner.risky_universal_breaker_pressure") ||
    (params.deckCapabilities?.runner?.breakerInventory.some((breaker) => {
      const coverage = new Set(breaker.coverage);
      return coverage.has("universal") && breaker.risks.length > 0;
    }) ??
      false)
  );
}

function runnerRemotePressureReserveAssessment(params: {
  input: AiDecisionInput;
  phase: RunnerCreditReservePhase;
  remoteScoreThreat: RunnerRemoteScoreThreat;
  economyCanSustainPressure: boolean;
}): RunnerRemotePressureReserveAssessment {
  const inactive: RunnerRemotePressureReserveAssessment = {
    active: false,
    reserve: 0,
    rdPressureSpendTarget: 0,
    runwayTarget: 0,
    reserveOverrides: [],
    visiblePathCost: 0,
    unrezzedIceRiskBuffer: 0,
    postRunReserve: 0,
  };
  const immediateThreat = runnerHasImmediateRemoteScoreThreat(params.input);
  if (
    params.input.side !== "runner" ||
    (!params.economyCanSustainPressure && !immediateThreat) ||
    (params.phase === "opening" && !immediateThreat)
  ) {
    return inactive;
  }

  const postRunReserve =
    params.remoteScoreThreat === "urgent"
      ? 8
      : params.phase === "late_contest"
        ? 6
        : 5;
  const candidates = params.input.playerView.servers.flatMap((server) => {
    if (
      !server.id.startsWith("remote_") ||
      server.ice.length < 2 ||
      server.root.length === 0
    )
      return [];
    const hasLegalRun = params.input.legalActions.some(
      (action) =>
        action.type === "start_run" && actionServerId(action) === server.id,
    );
    if (!hasLegalRun) return [];
    const path = assessKnownRezzedIcePath(
      server.ice,
      params.input.playerView.own.rig ?? [],
      runnerRunPathCreditBudgetWithVisiblePools(
        params.input.playerView.own.credits,
        params.input.playerView.own.rig ?? [],
      ),
      server.root,
    );
    if (
      path.knownPathBlockedByMissingCoverage ||
      path.knownPathBlockedByUnbreakableIce
    ) {
      return [];
    }
    const visiblePathCost = Math.max(0, path.visibleBreakCost ?? 0);
    const unrezzedIceCount = server.ice.filter(
      (ice) => ice.known === false || ice.rezzed !== true,
    ).length;
    const unrezzedIceRiskBuffer = Math.min(9, unrezzedIceCount * 3);
    const estimatedContestCost = visiblePathCost + unrezzedIceRiskBuffer;
    if (estimatedContestCost < 6) return [];
    return [
      {
        active: true,
        reserve: Math.min(36, estimatedContestCost + postRunReserve),
        rdPressureSpendTarget: 0,
        runwayTarget: 0,
        reserveOverrides: [],
        serverId: server.id,
        visiblePathCost,
        unrezzedIceRiskBuffer,
        postRunReserve,
      } satisfies RunnerRemotePressureReserveAssessment,
    ];
  });
  const selected = candidates.sort(
    (left, right) =>
      right.reserve - left.reserve ||
      (left.serverId ?? "").localeCompare(right.serverId ?? ""),
  )[0];
  if (!selected) return inactive;
  const terminalCentralPressure =
    !immediateThreat &&
    (params.input.playerView.opponent.agendaPoints >=
      params.input.playerView.agendaPointsToWin - 1 ||
      params.input.playerView.own.agendaPoints >=
        params.input.playerView.agendaPointsToWin - 2);
  const rdPressureSpendTarget =
    terminalCentralPressure || immediateThreat
      ? 0
      : runnerRdPressureSpendTarget(params.input);
  return {
    ...selected,
    rdPressureSpendTarget,
    runwayTarget: Math.min(56, selected.reserve + rdPressureSpendTarget),
    reserveOverrides: terminalCentralPressure
      ? ["terminal_central_pressure"]
      : [],
  };
}

function runnerRdPressureSpendTarget(input: AiDecisionInput): number {
  const rd = input.playerView.servers.find((server) => server.id === "rd");
  if (
    !rd ||
    !input.legalActions.some(
      (action) =>
        action.type === "start_run" && actionServerId(action) === "rd",
    )
  ) {
    return 0;
  }
  const path = assessKnownRezzedIcePath(
    rd.ice,
    input.playerView.own.rig ?? [],
    runnerRunPathCreditBudgetWithVisiblePools(
      input.playerView.own.credits,
      input.playerView.own.rig ?? [],
    ),
    rd.root,
  );
  if (
    path.knownPathBlockedByMissingCoverage ||
    path.knownPathBlockedByUnbreakableIce
  ) {
    return 0;
  }
  const unrezzedIceRisk = Math.min(
    6,
    rd.ice.filter((ice) => ice.known === false || ice.rezzed !== true).length *
      3,
  );
  return Math.min(
    20,
    Math.max(0, path.visibleBreakCost ?? 0) + unrezzedIceRisk,
  );
}

function runnerHasImmediateRemoteScoreThreat(input: AiDecisionInput): boolean {
  return input.playerView.servers.some(
    (server) =>
      server.id.startsWith("remote_") &&
      server.root.some(
        (card) =>
          (card.known === false && (card.advancementCounters ?? 0) > 0) ||
          (card.known && card.type === "agenda"),
      ),
  );
}

function runnerConvertibleBankCredits(input: AiDecisionInput): number {
  const payoutCards = new Map<
    string,
    { payoutPerClick: number; takePerClick: number; storedCredits: number }
  >();
  for (const action of input.legalActions) {
    if (!isBankPayoutAction(action)) continue;
    const sourceIds = [
      action.source,
      typeof action.payload?.cardId === "string"
        ? action.payload.cardId
        : undefined,
      typeof action.payload?.sourceCardId === "string"
        ? action.payload.sourceCardId
        : undefined,
    ].filter((value): value is string => Boolean(value));
    const card = (input.playerView.own.rig ?? []).find((candidate) =>
      sourceIds.includes(candidate.instanceId),
    );
    if (!card) continue;
    const storedCredits = Math.max(
      0,
      card.counters?.bit ?? 0,
      card.counters?.power ?? 0,
      card.counters?.recurring_credit ?? 0,
    );
    const payoutPerClick = exactBankCashOutPayout(action);
    const takePerClick = exactBankCashOutTakeAmount(action);
    if (
      storedCredits > 0 &&
      payoutPerClick !== undefined &&
      takePerClick !== undefined
    ) {
      payoutCards.set(card.instanceId, {
        payoutPerClick: Math.floor(payoutPerClick),
        takePerClick: Math.floor(takePerClick),
        storedCredits: Math.floor(storedCredits),
      });
    }
  }
  let clicksRemaining = Math.max(0, Math.floor(input.playerView.own.clicks));
  let convertibleCredits = 0;
  const ordered = [...payoutCards.values()].sort(
    (left, right) => right.payoutPerClick - left.payoutPerClick,
  );
  for (const source of ordered) {
    if (clicksRemaining <= 0) break;
    const sourceClicks = Math.min(
      clicksRemaining,
      Math.ceil(source.storedCredits / source.takePerClick),
    );
    const hostedCreditsTaken = Math.min(
      source.storedCredits,
      sourceClicks * source.takePerClick,
    );
    convertibleCredits += Math.min(
      sourceClicks * source.payoutPerClick,
      hostedCreditsTaken +
        sourceClicks * Math.max(0, source.payoutPerClick - source.takePerClick),
    );
    clicksRemaining -= sourceClicks;
  }
  return convertibleCredits;
}

function runnerCreditReservePhase(
  input: AiDecisionInput,
  remoteScoreThreat: RunnerRemoteScoreThreat,
): RunnerCreditReservePhase {
  if (
    remoteScoreThreat === "urgent" ||
    input.playerView.opponent.agendaPoints >=
      input.playerView.agendaPointsToWin - 2
  ) {
    return "late_contest";
  }
  if (remoteScoreThreat === "visible") return "late_contest";
  return input.playerView.stateVersion <= 8 ? "opening" : "midgame";
}

function runnerRemoteScoreThreat(
  input: AiDecisionInput,
): RunnerRemoteScoreThreat {
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
      input.playerView.opponent.agendaPoints >=
        input.playerView.agendaPointsToWin - 2
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
