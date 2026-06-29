import {
  DEMO_CARDS_BY_ID,
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";
import { createAiHintsByCard, RUNTIME_CARDS } from "../ai-hints";
import {
  assessKnownRezzedIcePath,
  endTheRunSubroutineCount,
} from "../visible-run-analysis";
import { semanticRuntimeCorpCentralPressureAssessment } from "./semantic-runtime-corp-central-pressure";

type CorpServerLike = {
  id: string;
  ice: readonly VisibleCard[];
  root: readonly VisibleCard[];
};

const AI_HINTS_BY_CARD = createAiHintsByCard();

export type CorpScoringWindowKind =
  | "none"
  | "unsafe"
  | "temporary_safe"
  | "durable";

export type CorpScoringWindowHorizon =
  | "immediate"
  | "next_turn"
  | "slow"
  | "unknown";

export type CorpScoringWindowNextStep =
  | "score"
  | "advance"
  | "install_agenda"
  | "build_remote_ice"
  | "gain_credit"
  | "none";

export type CorpScoringWindowAgendaStealSeverity =
  | "none"
  | "normal"
  | "near_win"
  | "game_ending";

export type CorpScoringWindowAssessment = {
  serverId: string;
  windowKind: CorpScoringWindowKind;
  runnerCanContestNow: boolean;
  runnerCanReachAccessNow: boolean;
  agendaStealRelevantNow: boolean;
  runnerCanContestBeforeScore: boolean;
  runnerCanReachAccessBeforeScore: boolean;
  agendaStealRelevantBeforeScore: boolean;
  agendaPointsAtRisk?: number;
  runnerAgendaPointsAfterSteal?: number;
  agendaStealSeverity?: CorpScoringWindowAgendaStealSeverity;
  missingVisibleBreakerCoverage: boolean;
  corpCanRezRelevantIce: boolean;
  affordableDurableRelevantIceCount?: number;
  dynamicProtectionWeaknessCount?: number;
  dynamicProtectionReserve?: number;
  corpCanRezFullPathWithDynamicReserve?: boolean;
  scoreHorizon: CorpScoringWindowHorizon;
  runnerExposureCreditActions: number;
  recommendedNextStep: CorpScoringWindowNextStep;
  evidence: string[];
};

export type SemanticRuntimeCorpScoringWindowDependencies<
  TServer extends CorpServerLike = CorpServerLike,
> = {
  actionServerId: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  server: (
    input: AiDecisionInput,
    serverId: string | undefined,
  ) => TServer | undefined;
  actionCreditCost: (action: LegalAction) => number;
  actionIsScoreLine: (
    input: AiDecisionInput,
    action: LegalAction,
    roles?: string[],
  ) => boolean;
  advanceCompletesScore: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  remoteHasScoreLine: (server: TServer | undefined) => boolean;
  isRemoteServerTarget: (serverId: string | undefined) => boolean;
  visibleIceRezCost: (card: VisibleCard) => number | undefined;
  actionSourceCard?: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => VisibleCard | undefined;
};

export function semanticRuntimeCorpScoringWindowAssessment<
  TServer extends CorpServerLike,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoringWindowDependencies<TServer>,
  roles: string[] = [],
): CorpScoringWindowAssessment | undefined {
  if (input.side !== "corp" || action.side !== "corp") return undefined;
  const serverId = dependencies.actionServerId(input, action);
  if (!dependencies.isRemoteServerTarget(serverId) || !serverId) {
    return undefined;
  }
  const scoreLineAction =
    action.type === "score_agenda" ||
    ((action.type === "install_card" || action.type === "advance_card") &&
      dependencies.actionIsScoreLine(input, action, roles));
  const remoteIceInstall =
    action.type === "install_card" && action.payload?.placement === "ice";
  if (!scoreLineAction && !remoteIceInstall) return undefined;

  const server = dependencies.server(input, serverId);
  const projectedServer = projectedRemoteServerForAction(
    input,
    action,
    server,
    dependencies,
  );
  const scoreHorizon = scoringWindowHorizon(input, action, dependencies);
  const creditsAfterAction =
    input.playerView.own.credits - dependencies.actionCreditCost(action);
  const rezBudget = scoringWindowRezBudget(
    projectedServer,
    creditsAfterAction,
    dependencies,
  );
  const access = scoringWindowAccessAssessment(input, projectedServer);
  const runnerExposureCreditActions = scoringWindowRunnerExposureCreditActions(
    input,
    scoreHorizon,
    scoreLineAction,
  );
  const exposureAccess =
    runnerExposureCreditActions > 0
      ? scoringWindowAccessAssessment(
          input,
          projectedServer,
          runnerExposureCreditActions,
        )
      : access;
  const hasScorePressure =
    scoreLineAction ||
    semanticRuntimeCorpHasAgendaInHq(input) ||
    dependencies.remoteHasScoreLine(server);
  const centralPressure = semanticRuntimeCorpCentralPressure(input);
  const existingWindow = strongestExistingScoringRemote(input, dependencies);
  const immediateScore =
    action.type === "score_agenda" ||
    dependencies.advanceCompletesScore(input, action) ||
    scoreHorizon === "immediate";
  const agendaPointsAtRisk = scoringWindowAgendaPointsAtRisk(
    input,
    action,
    projectedServer,
    dependencies,
    scoreLineAction,
  );
  const runnerAgendaPointsAfterSteal =
    input.playerView.opponent.agendaPoints + agendaPointsAtRisk;
  const agendaStealSeverity = scoringWindowAgendaStealSeverity(
    input,
    agendaPointsAtRisk,
  );
  const runnerCanContestNow =
    !immediateScore &&
    access.runnerCanReachAccessNow &&
    access.agendaStealRelevantNow;
  const runnerCanContestBeforeScore =
    !immediateScore &&
    exposureAccess.runnerCanReachAccessNow &&
    exposureAccess.agendaStealRelevantNow;
  const delayedExposureRisk = scoringWindowDelayedScoreExposureRisk({
    access,
    agendaStealSeverity,
    exposureAccess,
    immediateScore,
    projectedServer,
    rezBudget,
    runnerExposureCreditActions,
    scoreHorizon,
    scoreLineAction,
  });

  const windowKind = scoringWindowKind({
    action,
    access,
    centralPressure,
    delayedExposureRisk,
    exposureAccess,
    existingWindow,
    hasScorePressure,
    immediateScore,
    projectedServer,
    rezBudget,
    runnerCanContestBeforeScore,
    runnerExposureCreditActions,
    agendaStealSeverity,
    scoreLineAction,
  });
  const recommendedNextStep = scoringWindowRecommendedNextStep({
    action,
    agendaStealSeverity,
    hasScorePressure,
    projectedServer,
    windowKind,
    rezBudget,
    runnerExposureCreditActions,
    runnerCanContestBeforeScore,
    centralPressure,
    delayedExposureRisk,
  });

  return {
    serverId,
    windowKind,
    runnerCanContestNow,
    runnerCanReachAccessNow: access.runnerCanReachAccessNow,
    agendaStealRelevantNow: access.agendaStealRelevantNow,
    runnerCanContestBeforeScore,
    runnerCanReachAccessBeforeScore: exposureAccess.runnerCanReachAccessNow,
    agendaStealRelevantBeforeScore: exposureAccess.agendaStealRelevantNow,
    agendaPointsAtRisk,
    runnerAgendaPointsAfterSteal,
    agendaStealSeverity,
    missingVisibleBreakerCoverage: access.missingVisibleBreakerCoverage,
    corpCanRezRelevantIce: rezBudget.corpCanRezRelevantIce,
    affordableDurableRelevantIceCount:
      rezBudget.affordableDurableRelevantIceCount,
    dynamicProtectionWeaknessCount: rezBudget.dynamicProtectionWeaknessCount,
    dynamicProtectionReserve: rezBudget.dynamicProtectionReserve,
    corpCanRezFullPathWithDynamicReserve:
      rezBudget.corpCanRezFullPathWithDynamicReserve,
    scoreHorizon,
    runnerExposureCreditActions,
    recommendedNextStep,
    evidence: [
      "corp_scoring_window:assessed",
      `server:${serverId}`,
      `window_kind:${windowKind}`,
      `score_horizon:${scoreHorizon}`,
      `runner_can_contest_now:${runnerCanContestNow}`,
      `runner_can_reach_access_now:${access.runnerCanReachAccessNow}`,
      `agenda_steal_relevant_now:${access.agendaStealRelevantNow}`,
      `runner_can_contest_before_score:${runnerCanContestBeforeScore}`,
      `runner_can_reach_access_before_score:${exposureAccess.runnerCanReachAccessNow}`,
      `agenda_steal_relevant_before_score:${exposureAccess.agendaStealRelevantNow}`,
      `agenda_points_at_risk:${agendaPointsAtRisk}`,
      `runner_agenda_points_after_steal:${runnerAgendaPointsAfterSteal}`,
      `agenda_steal_severity:${agendaStealSeverity}`,
      `delayed_score_exposure_risk:${delayedExposureRisk}`,
      `runner_exposure_credit_actions:${runnerExposureCreditActions}`,
      `missing_visible_installed_coverage:${access.missingVisibleBreakerCoverage}`,
      `corp_can_rez_relevant_ice:${rezBudget.corpCanRezRelevantIce}`,
      `corp_can_rez_full_path:${rezBudget.corpCanRezFullPath}`,
      `corp_can_rez_full_path_with_dynamic_reserve:${rezBudget.corpCanRezFullPathWithDynamicReserve}`,
      `remote_effective_ice_count:${access.effectiveIceCount}`,
      `remote_affordable_ice_count:${rezBudget.affordableIceCount}`,
      `remote_relevant_ice_count:${rezBudget.relevantIceCount}`,
      `remote_affordable_relevant_ice_count:${rezBudget.affordableRelevantIceCount}`,
      `remote_durable_relevant_ice_count:${rezBudget.durableRelevantIceCount}`,
      `remote_weak_position_scaling_ice_count:${rezBudget.weakPositionScalingIceCount}`,
      `remote_dynamic_protection_weakness_count:${rezBudget.dynamicProtectionWeaknessCount}`,
      `remote_dynamic_protection_reserve:${rezBudget.dynamicProtectionReserve}`,
      `visible_runner_contest_credits:${access.visibleRunnerContestCredits}`,
      `visible_runner_exposure_contest_credits:${exposureAccess.visibleRunnerContestCredits}`,
      `central_pressure:${centralPressure}`,
      `existing_scoring_remote:${existingWindow}`,
      `recommended_next_step:${recommendedNextStep}`,
      ...access.evidence,
      ...(runnerExposureCreditActions > 0
        ? exposureAccess.evidence.map((entry) => `exposure_${entry}`)
        : []),
      ...rezBudget.evidence,
    ],
  };
}

function projectedRemoteServerForAction<TServer extends CorpServerLike>(
  input: AiDecisionInput,
  action: LegalAction,
  server: TServer | undefined,
  dependencies: SemanticRuntimeCorpScoringWindowDependencies<TServer>,
): CorpServerLike | undefined {
  if (action.type !== "install_card") {
    return server;
  }
  const sourceCard = dependencies.actionSourceCard?.(input, action);
  if (!sourceCard) return server;
  if (action.payload?.placement !== "ice") {
    return {
      id:
        server?.id ?? dependencies.actionServerId(input, action) ?? "remote_1",
      ice: [...(server?.ice ?? [])],
      root: [...(server?.root ?? []), sourceCard],
    };
  }
  if (sourceCard.type !== "ice") return server;
  return {
    id: server?.id ?? dependencies.actionServerId(input, action) ?? "remote_1",
    ice: [...(server?.ice ?? []), sourceCard],
    root: [...(server?.root ?? [])],
  };
}

function scoringWindowHorizon<TServer extends CorpServerLike>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoringWindowDependencies<TServer>,
): CorpScoringWindowHorizon {
  if (action.type === "score_agenda") return "immediate";
  if (dependencies.advanceCompletesScore(input, action)) return "immediate";
  if (action.type === "advance_card") return "next_turn";
  if (action.type !== "install_card" || action.payload?.placement === "ice") {
    return "unknown";
  }
  const sourceCard = dependencies.actionSourceCard?.(input, action);
  const requirement = sourceCard?.advancementRequirement;
  if (typeof requirement !== "number") return "unknown";
  const remainingCorpClicksAfterAction = Math.max(
    0,
    Math.floor(
      (typeof input.playerView.own.clicks === "number"
        ? input.playerView.own.clicks
        : 3) - scoringWindowActionClickCost(action),
    ),
  );
  if (remainingCorpClicksAfterAction > requirement) return "immediate";
  return requirement <= 3 ? "next_turn" : "slow";
}

function scoringWindowActionClickCost(action: LegalAction): number {
  const explicitClicks = (action.costs ?? []).reduce(
    (sum, cost) =>
      sum +
      (typeof cost.clicks === "number" && Number.isFinite(cost.clicks)
        ? Math.max(0, Math.floor(cost.clicks))
        : 0),
    0,
  );
  if (explicitClicks > 0) return explicitClicks;
  if (
    action.type === "install_card" ||
    action.type === "advance_card" ||
    action.type === "score_agenda" ||
    action.type === "play_operation" ||
    action.type === "gain_credit" ||
    action.type === "draw_card"
  ) {
    return 1;
  }
  return 0;
}

function scoringWindowAccessAssessment(
  input: AiDecisionInput,
  server: CorpServerLike | undefined,
  extraRunnerCredits = 0,
): {
  runnerCanReachAccessNow: boolean;
  agendaStealRelevantNow: boolean;
  missingVisibleBreakerCoverage: boolean;
  effectiveIceCount: number;
  unmodeledIceCount: number;
  visibleRunnerIcebreakerCount: number;
  visibleRunnerContestCredits: number;
  evidence: string[];
} {
  const visibleRunnerBaseContestCredits =
    input.playerView.opponent.credits +
    visibleRunnerRunCreditPool(input.playerView.opponent.rig ?? []);
  const visibleRunnerExtraCredits = Math.max(0, Math.floor(extraRunnerCredits));
  const visibleRunnerContestCredits =
    visibleRunnerBaseContestCredits + visibleRunnerExtraCredits;
  const visibleRunnerIcebreakerCount = visibleRunnerInstalledIcebreakerCount(
    input.playerView.opponent.rig ?? [],
  );
  if (!server || server.ice.length === 0) {
    return {
      runnerCanReachAccessNow: true,
      agendaStealRelevantNow: true,
      missingVisibleBreakerCoverage: false,
      effectiveIceCount: 0,
      unmodeledIceCount: 0,
      visibleRunnerIcebreakerCount,
      visibleRunnerContestCredits,
      evidence: [
        "remote_access:unprotected",
        `visible_runner_base_contest_credits:${visibleRunnerBaseContestCredits}`,
        `visible_runner_extra_exposure_credits:${visibleRunnerExtraCredits}`,
      ],
    };
  }
  const projectedIce = server.ice.map((ice) => ({
    ...ice,
    known: ice.known !== false,
    rezzed: true,
  }));
  const assessment = assessKnownRezzedIcePath(
    projectedIce,
    input.playerView.opponent.rig ?? [],
    visibleRunnerContestCredits,
    [...server.root],
  );
  const unmodeledIceCount = projectedIce.filter(
    (ice) => !iceHasModeledRunImpact(ice),
  ).length;
  const unmodeledBlocksVisibleAccess =
    unmodeledIceCount > 0 && visibleRunnerIcebreakerCount === 0;
  const runnerCanReachAccessNow =
    !unmodeledBlocksVisibleAccess &&
    assessment.canReachAccess &&
    assessment.creditsAfterPath >= 0;
  const hazardPenalty = assessment.visibleIceHazardPenalty ?? 0;
  const agendaStealRelevantNow =
    runnerCanReachAccessNow &&
    hazardPenalty < 600 &&
    assessment.creditsAfterPath >= 0;
  const missingVisibleBreakerCoverage =
    assessment.knownPathBlockedByMissingCoverage ||
    assessment.noAccessReason === "missing_breaker_coverage" ||
    (assessment.missingCoverage?.length ?? 0) > 0;
  return {
    runnerCanReachAccessNow,
    agendaStealRelevantNow,
    missingVisibleBreakerCoverage,
    effectiveIceCount: assessment.assessedKnownIceCount,
    unmodeledIceCount,
    visibleRunnerIcebreakerCount,
    visibleRunnerContestCredits,
    evidence: [
      `remote_access:assessed_known_ice:${assessment.assessedKnownIceCount}`,
      `remote_access:can_reach:${assessment.canReachAccess}`,
      `remote_access:credits_after_path:${assessment.creditsAfterPath}`,
      `remote_access:unmodeled_ice_count:${unmodeledIceCount}`,
      `remote_access:unmodeled_blocks_visible_access:${unmodeledBlocksVisibleAccess}`,
      `visible_runner_icebreaker_count:${visibleRunnerIcebreakerCount}`,
      ...(assessment.visibleBreakCost !== undefined
        ? [`remote_access:visible_break_cost:${assessment.visibleBreakCost}`]
        : []),
      ...(assessment.noAccessReason
        ? [`remote_access:no_access_reason:${assessment.noAccessReason}`]
        : []),
      `visible_runner_base_contest_credits:${visibleRunnerBaseContestCredits}`,
      `visible_runner_extra_exposure_credits:${visibleRunnerExtraCredits}`,
    ],
  };
}

function scoringWindowRunnerExposureCreditActions(
  input: AiDecisionInput,
  scoreHorizon: CorpScoringWindowHorizon,
  scoreLineAction: boolean,
): number {
  if (!scoreLineAction || scoreHorizon === "immediate") return 0;
  if (scoreHorizon !== "next_turn" && scoreHorizon !== "slow") return 0;
  const visibleClicks = input.playerView.opponent.clicks;
  const availableRunnerClicks =
    typeof visibleClicks === "number" && Number.isFinite(visibleClicks)
      ? Math.max(0, Math.floor(visibleClicks))
      : 4;
  return Math.max(3, availableRunnerClicks - 1);
}

function scoringWindowRezBudget<TServer extends CorpServerLike>(
  server: CorpServerLike | undefined,
  creditsAfterAction: number,
  dependencies: Pick<
    SemanticRuntimeCorpScoringWindowDependencies<TServer>,
    "visibleIceRezCost"
  >,
): {
  corpCanRezRelevantIce: boolean;
  corpCanRezFullPath: boolean;
  affordableIceCount: number;
  relevantIceCount: number;
  affordableRelevantIceCount: number;
  durableRelevantIceCount: number;
  affordableDurableRelevantIceCount: number;
  weakPositionScalingIceCount: number;
  dynamicProtectionWeaknessCount: number;
  dynamicProtectionReserve: number;
  corpCanRezFullPathWithDynamicReserve: boolean;
  evidence: string[];
} {
  if (!server || server.ice.length === 0) {
    return {
      corpCanRezRelevantIce: false,
      corpCanRezFullPath: false,
      affordableIceCount: 0,
      relevantIceCount: 0,
      affordableRelevantIceCount: 0,
      durableRelevantIceCount: 0,
      affordableDurableRelevantIceCount: 0,
      weakPositionScalingIceCount: 0,
      dynamicProtectionWeaknessCount: 0,
      dynamicProtectionReserve: 0,
      corpCanRezFullPathWithDynamicReserve: false,
      evidence: ["remote_rez_budget:no_ice"],
    };
  }
  const rezCosts = server.ice.map((ice) =>
    ice.rezzed === true
      ? 0
      : Math.max(0, dependencies.visibleIceRezCost(ice) ?? 2),
  );
  const qualities = server.ice.map((ice, iceIndex) =>
    scoringWindowIceQuality(server, ice, iceIndex),
  );
  const relevantRezCosts = rezCosts.filter(
    (_cost, index) => qualities[index]?.relevant === true,
  );
  const durableRelevantRezCosts = rezCosts.filter(
    (_cost, index) => qualities[index]?.durableRelevant === true,
  );
  const relevantIceCount = relevantRezCosts.length;
  const durableRelevantIceCount = durableRelevantRezCosts.length;
  const affordableIceCount = rezCosts.filter(
    (cost) => cost <= Math.max(0, creditsAfterAction),
  ).length;
  const affordableRelevantIceCount = relevantRezCosts.filter(
    (cost) => cost <= Math.max(0, creditsAfterAction),
  ).length;
  const affordableDurableRelevantIceCount = durableRelevantRezCosts.filter(
    (cost) => cost <= Math.max(0, creditsAfterAction),
  ).length;
  const weakPositionScalingIceCount = qualities.filter(
    (quality) => quality.weakPositionScaling,
  ).length;
  const dynamicProtectionWeaknessCount = qualities.filter(
    (quality) => quality.dynamicProtectionWeakness,
  ).length;
  const dynamicProtectionReserve = qualities.reduce(
    (sum, quality) => sum + quality.dynamicReserve,
    0,
  );
  const minimumRezCost =
    relevantRezCosts.length > 0 ? Math.min(...relevantRezCosts) : Infinity;
  const totalRezCost = relevantRezCosts.reduce((sum, cost) => sum + cost, 0);
  const totalRezCostWithDynamicReserve =
    totalRezCost + dynamicProtectionReserve;
  return {
    corpCanRezRelevantIce:
      relevantRezCosts.length > 0 && creditsAfterAction >= minimumRezCost,
    corpCanRezFullPath:
      relevantRezCosts.length > 0 && creditsAfterAction >= totalRezCost,
    corpCanRezFullPathWithDynamicReserve:
      relevantRezCosts.length > 0 &&
      creditsAfterAction >= totalRezCostWithDynamicReserve,
    affordableIceCount,
    relevantIceCount,
    affordableRelevantIceCount,
    durableRelevantIceCount,
    affordableDurableRelevantIceCount,
    weakPositionScalingIceCount,
    dynamicProtectionWeaknessCount,
    dynamicProtectionReserve,
    evidence: [
      `remote_rez_budget:credits_after_action:${creditsAfterAction}`,
      `remote_rez_budget:min_relevant_rez_cost:${Number.isFinite(minimumRezCost) ? minimumRezCost : "none"}`,
      `remote_rez_budget:full_relevant_path_rez_cost:${totalRezCost}`,
      `remote_rez_budget:full_relevant_path_with_dynamic_reserve:${totalRezCostWithDynamicReserve}`,
      `remote_rez_budget:relevant_ice_count:${relevantIceCount}`,
      `remote_rez_budget:affordable_relevant_ice_count:${affordableRelevantIceCount}`,
      `remote_rez_budget:durable_relevant_ice_count:${durableRelevantIceCount}`,
      `remote_rez_budget:weak_position_scaling_ice_count:${weakPositionScalingIceCount}`,
      `remote_rez_budget:dynamic_protection_weakness_count:${dynamicProtectionWeaknessCount}`,
      `remote_rez_budget:dynamic_protection_reserve:${dynamicProtectionReserve}`,
    ],
  };
}

function scoringWindowIceQuality(
  server: CorpServerLike,
  ice: VisibleCard,
  iceIndex: number,
): {
  relevant: boolean;
  durableRelevant: boolean;
  weakPositionScaling: boolean;
  dynamicProtectionWeakness: boolean;
  dynamicReserve: number;
} {
  const relevant = iceHasPotentialScoringProtection(ice);
  const weakPositionScaling =
    relevant && iceHasUnsupportedPositionScaling(server, ice, iceIndex);
  const dynamicProtectionWeakness =
    relevant && iceHasDynamicProtectionWeakness(ice);
  return {
    relevant,
    durableRelevant:
      relevant && !weakPositionScaling && !dynamicProtectionWeakness,
    weakPositionScaling,
    dynamicProtectionWeakness,
    dynamicReserve: relevant && iceHasSameFortRepositionRisk(ice) ? 1 : 0,
  };
}

function iceHasPotentialScoringProtection(ice: VisibleCard): boolean {
  const quoteSubroutines = ice.effectiveRunQuote?.subroutines ?? [];
  if (
    quoteSubroutines.some((subroutine) =>
      [
        "end_the_run",
        "end_the_run_unless_runner_pays",
        "set_run_future_end_the_run_subroutine",
        "set_runner_run_lock_actions",
        "do_damage",
        "trash_installed_program",
        "trash_installed_program_unless_runner_pays",
        "initiate_trace",
      ].includes(subroutine.type),
    )
  ) {
    return true;
  }
  if (ice.definitionId && endTheRunSubroutineCount(ice.definitionId) > 0) {
    return true;
  }
  const signals = scoringWindowCardSignals(ice);
  if (
    signals.some((signal) =>
      scoringWindowSignalMatches(signal, [
        "etr_ice",
        "end_run",
        "run_lock",
        "tax",
        "damage_ice",
        "trace",
        "program_trash",
        "hardware_trash",
      ]),
    )
  ) {
    return true;
  }
  return !iceHasModeledRunImpact(ice);
}

function iceHasUnsupportedPositionScaling(
  server: CorpServerLike,
  ice: VisibleCard,
  iceIndex: number,
): boolean {
  const signals = scoringWindowCardSignals(ice);
  const positionScaling = scoringWindowIceHasPositionScalingRisk(signals);
  if (!positionScaling) return false;
  return server.ice.slice(iceIndex + 1).length === 0;
}

function iceHasDynamicProtectionWeakness(ice: VisibleCard): boolean {
  const signals = scoringWindowCardSignals(ice);
  return (
    scoringWindowIceHasPositionScalingRisk(signals) ||
    iceHasSameFortRepositionRisk(ice)
  );
}

function scoringWindowIceHasPositionScalingRisk(
  signals: readonly string[],
): boolean {
  return signals.some((signal) =>
    scoringWindowSignalMatches(signal, [
      "corp_ice.outer_ice_scaling",
      "corp_ice.position_scaling",
      "position_dependent_ice",
    ]),
  );
}

function iceHasSameFortRepositionRisk(ice: VisibleCard): boolean {
  const signals = scoringWindowCardSignals(ice);
  return signals.some((signal) =>
    scoringWindowSignalMatches(signal, [
      "same_fort_reposition",
      "corp_ice.mobile_position_change",
      "mobile_position_change",
    ]),
  );
}

function scoringWindowCardSignals(card: VisibleCard): string[] {
  const hint = card.definitionId
    ? AI_HINTS_BY_CARD.get(card.definitionId)
    : undefined;
  return [
    ...(hint?.roles ?? []),
    ...(hint?.planRoles ?? []),
    ...((hint as { riskTags?: readonly string[] } | undefined)?.riskTags ?? []),
    ...((hint as { tacticSignals?: readonly string[] } | undefined)
      ?.tacticSignals ?? []),
  ];
}

function scoringWindowSignalMatches(
  signal: string,
  needles: readonly string[],
): boolean {
  const normalized = signal.toLocaleLowerCase("en-US");
  return needles.some((needle) => {
    const normalizedNeedle = needle.toLocaleLowerCase("en-US");
    if (normalized === normalizedNeedle) return true;
    const tokens = normalized.split(/[._:-]+/).filter(Boolean);
    const needleTokens = normalizedNeedle.split(/[._:-]+/).filter(Boolean);
    if (needleTokens.length <= 1) return tokens.includes(normalizedNeedle);
    return tokens.some(
      (token, index) =>
        token === needleTokens[0] &&
        needleTokens.every(
          (needleToken, offset) => tokens[index + offset] === needleToken,
        ),
    );
  });
}

function scoringWindowKind(params: {
  action: LegalAction;
  access: ReturnType<typeof scoringWindowAccessAssessment>;
  centralPressure: boolean;
  delayedExposureRisk: boolean;
  exposureAccess: ReturnType<typeof scoringWindowAccessAssessment>;
  existingWindow: CorpScoringWindowKind;
  hasScorePressure: boolean;
  immediateScore: boolean;
  projectedServer: CorpServerLike | undefined;
  rezBudget: ReturnType<typeof scoringWindowRezBudget>;
  runnerCanContestBeforeScore: boolean;
  runnerExposureCreditActions: number;
  agendaStealSeverity: CorpScoringWindowAgendaStealSeverity;
  scoreLineAction: boolean;
}): CorpScoringWindowKind {
  if (params.immediateScore) return "durable";
  if (!params.projectedServer || params.projectedServer.ice.length === 0) {
    return params.scoreLineAction ? "unsafe" : "none";
  }
  if (
    !params.rezBudget.corpCanRezRelevantIce ||
    params.access.agendaStealRelevantNow
  ) {
    return params.scoreLineAction ? "unsafe" : "none";
  }
  if (params.runnerCanContestBeforeScore) {
    return params.scoreLineAction ? "unsafe" : "none";
  }
  if (params.delayedExposureRisk) {
    return params.scoreLineAction ? "unsafe" : "none";
  }
  if (
    params.scoreLineAction &&
    scoringWindowHasSevereExposureRisk(
      params.agendaStealSeverity,
      params.runnerExposureCreditActions,
    ) &&
    params.rezBudget.dynamicProtectionWeaknessCount > 0 &&
    (params.rezBudget.affordableDurableRelevantIceCount < 2 ||
      !params.rezBudget.corpCanRezFullPathWithDynamicReserve)
  ) {
    return "unsafe";
  }
  if (
    params.action.type === "install_card" &&
    params.action.payload?.placement === "ice" &&
    (params.existingWindow === "durable" ||
      params.existingWindow === "temporary_safe") &&
    !remoteContainsScoreLine(params.projectedServer) &&
    !scoringWindowIceInstallImprovesExistingWindow(params)
  ) {
    return "none";
  }
  if (
    params.projectedServer.ice.length >= 2 &&
    params.access.unmodeledIceCount === 0 &&
    params.rezBudget.durableRelevantIceCount >= 2 &&
    params.rezBudget.affordableDurableRelevantIceCount >= 2 &&
    params.rezBudget.corpCanRezFullPath &&
    !params.exposureAccess.runnerCanReachAccessNow
  ) {
    return "durable";
  }
  if (
    params.hasScorePressure &&
    params.rezBudget.corpCanRezRelevantIce &&
    !params.exposureAccess.runnerCanReachAccessNow &&
    !params.centralPressure
  ) {
    return "temporary_safe";
  }
  if (
    params.hasScorePressure &&
    params.exposureAccess.unmodeledIceCount > 0 &&
    params.exposureAccess.visibleRunnerIcebreakerCount === 0 &&
    params.rezBudget.corpCanRezRelevantIce &&
    !params.centralPressure
  ) {
    return "temporary_safe";
  }
  if (
    params.hasScorePressure &&
    params.exposureAccess.missingVisibleBreakerCoverage &&
    params.rezBudget.corpCanRezRelevantIce &&
    !params.centralPressure
  ) {
    return "temporary_safe";
  }
  if (
    params.action.type === "install_card" &&
    params.action.payload?.placement === "ice" &&
    params.hasScorePressure &&
    params.rezBudget.affordableRelevantIceCount > 0 &&
    params.existingWindow !== "durable" &&
    params.existingWindow !== "temporary_safe"
  ) {
    return "temporary_safe";
  }
  return params.scoreLineAction ? "unsafe" : "none";
}

function scoringWindowDelayedScoreExposureRisk(params: {
  access: ReturnType<typeof scoringWindowAccessAssessment>;
  agendaStealSeverity: CorpScoringWindowAgendaStealSeverity;
  exposureAccess: ReturnType<typeof scoringWindowAccessAssessment>;
  immediateScore: boolean;
  projectedServer: CorpServerLike | undefined;
  rezBudget: ReturnType<typeof scoringWindowRezBudget>;
  runnerExposureCreditActions: number;
  scoreHorizon: CorpScoringWindowHorizon;
  scoreLineAction: boolean;
}): boolean {
  if (!params.scoreLineAction || params.immediateScore) return false;
  if (params.scoreHorizon === "immediate") return false;
  if (params.runnerExposureCreditActions <= 0) return false;
  if (params.agendaStealSeverity === "none") return false;
  const iceCount = params.projectedServer?.ice.length ?? 0;
  if (iceCount <= 0) return false;
  const lightOrUnprovenRemote =
    iceCount <= 1 ||
    (params.rezBudget.affordableDurableRelevantIceCount ?? 0) < 2 ||
    !params.rezBudget.corpCanRezFullPath ||
    (params.rezBudget.dynamicProtectionWeaknessCount ?? 0) > 0;
  if (!lightOrUnprovenRemote) return false;
  const safetyDependsOnMissingCoverage =
    params.access.missingVisibleBreakerCoverage ||
    params.exposureAccess.missingVisibleBreakerCoverage ||
    (params.exposureAccess.unmodeledIceCount > 0 &&
      params.exposureAccess.visibleRunnerIcebreakerCount === 0);
  if (!safetyDependsOnMissingCoverage) return false;
  return (
    params.access.visibleRunnerContestCredits >= 8 ||
    params.exposureAccess.visibleRunnerContestCredits >= 10
  );
}

function scoringWindowIceInstallImprovesExistingWindow(params: {
  existingWindow: CorpScoringWindowKind;
  exposureAccess: ReturnType<typeof scoringWindowAccessAssessment>;
  projectedServer: CorpServerLike | undefined;
  rezBudget: ReturnType<typeof scoringWindowRezBudget>;
}): boolean {
  return (
    params.existingWindow === "temporary_safe" &&
    (params.projectedServer?.ice.length ?? 0) >= 2 &&
    (params.rezBudget.affordableDurableRelevantIceCount ?? 0) >= 2 &&
    params.rezBudget.corpCanRezFullPath &&
    !params.exposureAccess.runnerCanReachAccessNow
  );
}

function remoteContainsScoreLine(server: CorpServerLike | undefined): boolean {
  return (
    server?.root.some(
      (card) =>
        (card.known && card.type === "agenda") ||
        (card.advancementCounters ?? 0) > 0,
    ) === true
  );
}

function scoringWindowAgendaPointsAtRisk<TServer extends CorpServerLike>(
  input: AiDecisionInput,
  action: LegalAction,
  projectedServer: CorpServerLike | undefined,
  dependencies: SemanticRuntimeCorpScoringWindowDependencies<TServer>,
  scoreLineAction: boolean,
): number {
  if (!scoreLineAction) return 0;
  const sourceCard =
    action.type === "install_card"
      ? dependencies.actionSourceCard?.(input, action)
      : undefined;
  if (sourceCard?.type === "agenda") {
    return visibleAgendaPoints(sourceCard);
  }
  const agendaPoints = (projectedServer?.root ?? [])
    .filter((card) => card.type === "agenda" || card.known === true)
    .map(visibleAgendaPoints)
    .filter((points) => points > 0);
  return agendaPoints.length > 0 ? Math.max(...agendaPoints) : 0;
}

function visibleAgendaPoints(card: VisibleCard): number {
  if (
    typeof card.agendaPoints === "number" &&
    Number.isFinite(card.agendaPoints)
  ) {
    return Math.max(0, Math.floor(card.agendaPoints));
  }
  const runtimeAgendaPoints =
    card.definitionId !== undefined
      ? (
          RUNTIME_CARDS[card.definitionId] as
            | { numeric?: { agendaPoints?: number | null } }
            | undefined
        )?.numeric?.agendaPoints
      : undefined;
  if (
    typeof runtimeAgendaPoints === "number" &&
    Number.isFinite(runtimeAgendaPoints)
  ) {
    return Math.max(0, Math.floor(runtimeAgendaPoints));
  }
  const demoAgendaPoints =
    card.definitionId !== undefined
      ? DEMO_CARDS_BY_ID[card.definitionId]?.agendaPoints
      : undefined;
  if (
    typeof demoAgendaPoints === "number" &&
    Number.isFinite(demoAgendaPoints)
  ) {
    return Math.max(0, Math.floor(demoAgendaPoints));
  }
  return card.type === "agenda" ? 2 : 0;
}

function scoringWindowAgendaStealSeverity(
  input: AiDecisionInput,
  agendaPointsAtRisk: number,
): CorpScoringWindowAgendaStealSeverity {
  if (agendaPointsAtRisk <= 0) return "none";
  const agendaPointsToWin =
    typeof input.playerView.agendaPointsToWin === "number" &&
    Number.isFinite(input.playerView.agendaPointsToWin)
      ? input.playerView.agendaPointsToWin
      : 7;
  const runnerAgendaPoints =
    typeof input.playerView.opponent.agendaPoints === "number" &&
    Number.isFinite(input.playerView.opponent.agendaPoints)
      ? input.playerView.opponent.agendaPoints
      : 0;
  const afterSteal = runnerAgendaPoints + agendaPointsAtRisk;
  if (afterSteal >= agendaPointsToWin) return "game_ending";
  if (afterSteal >= agendaPointsToWin - 1) return "near_win";
  return "normal";
}

function scoringWindowHasSevereExposureRisk(
  severity: CorpScoringWindowAgendaStealSeverity,
  runnerExposureCreditActions: number,
): boolean {
  return (
    runnerExposureCreditActions > 0 &&
    (severity === "game_ending" || severity === "near_win")
  );
}

function scoringWindowRecommendedNextStep(params: {
  action: LegalAction;
  agendaStealSeverity: CorpScoringWindowAgendaStealSeverity;
  hasScorePressure: boolean;
  projectedServer: CorpServerLike | undefined;
  windowKind: CorpScoringWindowKind;
  rezBudget: ReturnType<typeof scoringWindowRezBudget>;
  runnerExposureCreditActions: number;
    runnerCanContestBeforeScore: boolean;
    centralPressure: boolean;
    delayedExposureRisk: boolean;
  }): CorpScoringWindowNextStep {
  if (
    params.windowKind === "durable" &&
    params.action.type === "score_agenda"
  ) {
    return "score";
  }
  if (
    (params.windowKind === "temporary_safe" ||
      params.windowKind === "durable") &&
    params.action.type === "advance_card"
  ) {
    return "advance";
  }
  if (
    (params.windowKind === "temporary_safe" ||
      params.windowKind === "durable") &&
    params.action.type === "install_card" &&
    params.action.payload?.placement !== "ice"
  ) {
    return "install_agenda";
  }
  if (
    params.action.type === "install_card" &&
    params.action.payload?.placement === "ice" &&
    params.hasScorePressure &&
    !params.centralPressure &&
    params.windowKind !== "none"
  ) {
    return "build_remote_ice";
  }
  const remoteHasIce = (params.projectedServer?.ice.length ?? 0) > 0;
  if (
    params.windowKind === "unsafe" &&
    params.hasScorePressure &&
    !params.centralPressure &&
    params.delayedExposureRisk
  ) {
    return "build_remote_ice";
  }
  if (
    params.windowKind === "unsafe" &&
    params.hasScorePressure &&
    !params.centralPressure &&
    scoringWindowHasSevereExposureRisk(
      params.agendaStealSeverity,
      params.runnerExposureCreditActions,
    ) &&
    params.rezBudget.dynamicProtectionWeaknessCount > 0
  ) {
    return params.rezBudget.corpCanRezFullPathWithDynamicReserve
      ? "build_remote_ice"
      : "gain_credit";
  }
  if (
    params.windowKind === "unsafe" &&
    params.hasScorePressure &&
    !params.centralPressure &&
    (!remoteHasIce ||
      (params.runnerCanContestBeforeScore &&
        params.rezBudget.corpCanRezRelevantIce))
  ) {
    return "build_remote_ice";
  }
  if (!params.rezBudget.corpCanRezRelevantIce) return "gain_credit";
  return "none";
}

function strongestExistingScoringRemote<TServer extends CorpServerLike>(
  input: AiDecisionInput,
  dependencies: SemanticRuntimeCorpScoringWindowDependencies<TServer>,
): CorpScoringWindowKind {
  let strongest: CorpScoringWindowKind = "none";
  for (const server of input.playerView.servers) {
    if (!dependencies.isRemoteServerTarget(server.id)) continue;
    const candidate = dependencies.server(input, server.id);
    if (
      !dependencies.remoteHasScoreLine(candidate) &&
      !semanticRuntimeCorpHasAgendaInHq(input)
    ) {
      continue;
    }
    const access = scoringWindowAccessAssessment(input, candidate);
    const rezBudget = scoringWindowRezBudget(
      candidate,
      input.playerView.own.credits,
      dependencies,
    );
    const kind = scoringWindowKind({
      action: {
        actionId: "existing_remote_capacity",
        label: "existing_remote_capacity",
        type: "install_card",
        side: "corp",
        source: "game_rule",
        timingPoint: "corp_action.main",
        costs: [],
        targetRequirements: [],
        visibility: "private_to_actor",
        expiresAtStateVersion: input.playerView.stateVersion,
        payload: { placement: "ice" },
      } as unknown as LegalAction,
      access,
      centralPressure: false,
      exposureAccess: access,
      existingWindow: "none",
      hasScorePressure: true,
      immediateScore: false,
      projectedServer: candidate,
      rezBudget,
      runnerCanContestBeforeScore:
        access.runnerCanReachAccessNow && access.agendaStealRelevantNow,
      runnerExposureCreditActions: 0,
      agendaStealSeverity: "none",
      scoreLineAction: false,
      delayedExposureRisk: false,
    });
    if (kind === "durable") return "durable";
    if (kind === "temporary_safe") strongest = "temporary_safe";
  }
  return strongest;
}

function semanticRuntimeCorpHasAgendaInHq(input: AiDecisionInput): boolean {
  return input.playerView.own.gripOrHq.some(
    (card) => card.known && card.type === "agenda",
  );
}

function semanticRuntimeCorpCentralPressure(input: AiDecisionInput): boolean {
  const agendaInHq = semanticRuntimeCorpHasAgendaInHq(input);
  const hq = input.playerView.servers.find((server) => server.id === "hq");
  const rd = input.playerView.servers.find((server) => server.id === "rd");
  const hqAccess = scoringWindowAccessAssessment(input, hq);
  const rdAccess = scoringWindowAccessAssessment(input, rd);
  const hqRunOrAccessEvents = centralRunOrAccessEventCount(input, "hq");
  const rdRunOrAccessEvents = centralRunOrAccessEventCount(input, "rd");
  const hqPressure = semanticRuntimeCorpCentralPressureAssessment(input, "hq");
  const rdPressure = semanticRuntimeCorpCentralPressureAssessment(input, "rd");
  return (
    (agendaInHq &&
      hqAccess.runnerCanReachAccessNow &&
      hqAccess.visibleRunnerContestCredits >= 1) ||
    (hqAccess.runnerCanReachAccessNow &&
      hqAccess.visibleRunnerContestCredits >= 2 &&
      (hqRunOrAccessEvents >= 3 ||
        visibleRunnerCentralMultiaccess(input, "hq") ||
        hqPressure.successfulAccessEvents > 0)) ||
    (rdAccess.runnerCanReachAccessNow &&
      rdAccess.visibleRunnerContestCredits >= 4 &&
      (rdRunOrAccessEvents >= 2 ||
        visibleRunnerCentralMultiaccess(input, "rd") ||
        rdPressure.successfulAccessEvents > 0 ||
        rdPressure.eventMultiaccess))
  );
}

function centralRunOrAccessEventCount(
  input: AiDecisionInput,
  serverId: "hq" | "rd",
): number {
  const eventsById = new Map(
    [...(input.playerView.publicEvents ?? []), ...(input.eventTail ?? [])].map(
      (event) => [event.eventId, event],
    ),
  );
  return [...eventsById.values()].filter((event) => {
    const payload = event.publicPayload;
    const actor = typeof payload.actor === "string" ? payload.actor : undefined;
    const actionType =
      typeof payload.actionType === "string" ? payload.actionType : event.type;
    return (
      actor === "runner" &&
      (actionType === "start_run" || actionType === "access_card") &&
      normalizedCentralServerIdFromPayload(payload) === serverId
    );
  }).length;
}

function normalizedCentralServerIdFromPayload(
  payload: Record<string, unknown>,
): "hq" | "rd" | undefined {
  return normalizedCentralServerId(
    typeof payload.serverId === "string"
      ? payload.serverId
      : typeof payload.serverLabel === "string"
        ? payload.serverLabel
        : typeof payload.serverName === "string"
          ? payload.serverName
          : undefined,
  );
}

function normalizedCentralServerId(
  value: string | undefined,
): "hq" | "rd" | undefined {
  if (!value) return undefined;
  const normalized = value.toLocaleLowerCase("en-US");
  if (normalized === "hq") return "hq";
  if (normalized === "rd" || normalized === "r&d") return "rd";
  return undefined;
}

function visibleRunnerCentralMultiaccess(
  input: AiDecisionInput,
  serverId: "hq" | "rd",
): boolean {
  return (input.playerView.opponent.rig ?? []).some((card) => {
    if (card.known === false) return false;
    const tokens = visibleRunnerCentralMultiaccessTokens(card);
    const tokenSet = new Set(tokens);
    const hasCentralMultiaccess =
      tokenSet.has("multiaccess") ||
      tokensIncludePhrase(tokens, ["additional", "card"]) ||
      tokensIncludePhrase(tokens, ["access", "1", "additional"]);
    if (!hasCentralMultiaccess) {
      return false;
    }
    if (serverId === "hq") return tokenSet.has("hq");
    return tokenSet.has("rnd") || tokenSet.has("rd");
  });
}

function visibleRunnerCentralMultiaccessTokens(card: VisibleCard): string[] {
  const text = `${card.title ?? ""} ${card.rulesText ?? ""} ${
    card.definitionId ?? ""
  }`.replace(/r&d/gi, "rnd");
  const tokens: string[] = [];
  let current = "";
  for (const character of text) {
    if (isAsciiLetterOrDigit(character)) {
      current += character.toLocaleLowerCase("en-US");
    } else {
      if (current.length > 0) tokens.push(current);
      current = "";
    }
  }
  if (current.length > 0) tokens.push(current);
  return tokens;
}

function tokensIncludePhrase(
  tokens: readonly string[],
  phrase: readonly string[],
): boolean {
  return tokens.some(
    (token, index) =>
      token === phrase[0] &&
      phrase.every(
        (phraseToken, offset) => tokens[index + offset] === phraseToken,
      ),
  );
}

function isAsciiLetterOrDigit(character: string): boolean {
  return (
    (character >= "a" && character <= "z") ||
    (character >= "A" && character <= "Z") ||
    (character >= "0" && character <= "9")
  );
}

function visibleRunnerRunCreditPool(rig: readonly VisibleCard[]): number {
  return rig.reduce((sum, card) => {
    if (card.known === false) return sum;
    return (
      sum +
      (card.counterDisplays ?? []).reduce((cardSum, display) => {
        const uses = display.creditPool?.uses ?? [];
        if (
          uses.includes("using_icebreaker_during_run") ||
          uses.includes("using_icebreaker_during_run_non_noisy") ||
          uses.includes("using_killer_during_run")
        ) {
          return cardSum + Math.max(0, Math.floor(display.amount));
        }
        return cardSum;
      }, 0)
    );
  }, 0);
}

function visibleRunnerInstalledIcebreakerCount(
  rig: readonly VisibleCard[],
): number {
  return rig.filter(
    (card) =>
      card.known !== false &&
      card.type === "program" &&
      (card.subtypes ?? []).some(
        (subtype) => subtype.toLocaleLowerCase("en-US") === "icebreaker",
      ),
  ).length;
}

function iceHasModeledRunImpact(ice: VisibleCard): boolean {
  if (ice.effectiveRunQuote) return true;
  const definitionId = ice.definitionId;
  if (!definitionId) return false;
  return (
    RUNTIME_CARDS[definitionId] !== undefined ||
    DEMO_CARDS_BY_ID[definitionId] !== undefined
  );
}
