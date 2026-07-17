import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate";
import { actionProvidesCredits } from "../../actions/action-effect-classification";
import {
  semanticRuntimeCorpBoardTriage,
  type CorpBoardTriage,
} from "../semantic-runtime-corp-board-triage";
import { corpIcePlacementCandidateForAction } from "../corp-ice-placement/corp-ice-placement";
import { visibleCardDefinition } from "../card-definition-lookup";
import { rolesMatch } from "../role-match";
import { semanticRuntimeCorpCentralPressureAssessment } from "../semantic-runtime-corp-central-pressure";
import type { CorpScoringWindowAssessment } from "../semantic-runtime-corp-scoring-window";
import type { CorpScorelineWindowAssessment } from "./semantic-runtime-corp-scoreline-assessment";
import { corpKnownAgendaInventory } from "../corp-known-agenda-inventory";
import {
  CORP_RESERVE_SCORE_NORMALIZATION_DIVISOR,
  CORP_SCORE_NOW_TEMPO_BLOCKING_REMOTE_ICE_SCORE,
  type SemanticRuntimeCorpScoreDependencies,
} from "./semantic-runtime-corp-score-contracts";
import {
  corpHqAgendaCount,
  corpPreparedScoreRemotePipeline,
} from "./semantic-runtime-corp-score-facts";
import {
  corpBurstEconomyOperationForAction,
  corpExtraActionGainFromRulesText,
  corpSameTurnScoreCloseoutComponent,
  corpVisibleAdvancementRequirement,
  corpVisibleCardIsAgenda,
  positiveOrZeroNumber,
  semanticRuntimeCorpActionClickCost,
  semanticRuntimeCorpActionCreditCost,
  visibleSourceCardForAction,
} from "./semantic-runtime-corp-score-action-economy";
import { corpInstallServerId } from "./semantic-runtime-corp-score-ice-components";
import {
  corpActiveRemoteScorelineState,
  corpServerIceCount,
} from "./semantic-runtime-corp-score-state";
import {
  corpHqAgendaReliefScorelineContext,
  corpIsLastViableDeckoutMatchpointScoreline,
  corpScoreRuntimeIsPunishPrimary,
  corpScorelineActionServerId,
} from "./semantic-runtime-corp-score-hq-pressure";

export function corpMatchpointHqProtectionComponent(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "install_card" || action.payload?.placement !== "ice") {
    return undefined;
  }
  const pointsToWin = input.playerView.agendaPointsToWin ?? 7;
  if (input.playerView.opponent.agendaPoints < pointsToWin - 1) {
    return undefined;
  }
  const agendaInventory = corpKnownAgendaInventory(input);
  if (agendaInventory?.remainingStealableAgendaPoints === 0) {
    return undefined;
  }
  const hqPressure = semanticRuntimeCorpCentralPressureAssessment(input, "hq");
  if (
    !hqPressure.active &&
    !hqPressure.visibleMultiaccess &&
    !hqPressure.eventMultiaccess &&
    hqPressure.successfulAccessEvents <= 0
  ) {
    return undefined;
  }
  const serverId = corpInstallServerId(action);
  return {
    key:
      serverId === "hq"
        ? "corp_matchpoint_hq_protection_alignment"
        : "corp_matchpoint_hq_protection_mismatch",
    label: "Matchpoint-HQ-Schutz",
    value: serverId === "hq" ? 2200 : -1800,
    reason: [
      "runner_at_match_point:true",
      `install_server:${serverId ?? "unknown"}`,
      ...(agendaInventory?.evidence ?? []),
      ...hqPressure.evidence,
    ].join("|"),
  };
}

export function corpUnbackedExtraActionBurstComponent<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  boardTriage: CorpBoardTriage,
  boardTriageComponent: AiDecisionScoreComponent | undefined,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "play_operation") return undefined;
  const source = visibleSourceCardForAction(input, action);
  const gainedActions = corpExtraActionGainFromRulesText(
    source?.rulesText ??
      (source ? visibleCardDefinition(source)?.rulesText : undefined),
  );
  if (gainedActions <= 0) return undefined;
  const clickCost = Math.max(
    1,
    semanticRuntimeCorpActionClickCost(action, actionSemanticCandidate),
  );
  const netExtraActions = Math.max(0, gainedActions - clickCost);
  const creditCost = semanticRuntimeCorpActionCreditCost(
    dependencies,
    action,
    actionSemanticCandidate,
  );
  if (creditCost <= netExtraActions) return undefined;
  if (boardTriage.severity !== "high" && boardTriage.severity !== "critical") {
    return undefined;
  }
  if (boardTriageComponent?.key !== "corp_board_triage_context") {
    return undefined;
  }
  return {
    key: "corp_unbacked_extra_action_burst",
    label: "Extra-Aktions-Folgeplan",
    value: -2600,
    reason: [
      "extra_action_burst_without_direct_plan_progress:true",
      `triage_primary:${boardTriage.primary}`,
      `triage_severity:${boardTriage.severity}`,
      `gained_actions:${gainedActions}`,
      `action_click_cost:${clickCost}`,
      `net_extra_actions:${netExtraActions}`,
      `credit_cost:${creditCost}`,
      "basic_action_return_below_credit_cost:true",
    ].join("|"),
  };
}

export function corpScoringWindowSuppressesContestableRemotePenalty(
  assessment: CorpScoringWindowAssessment | undefined,
): boolean {
  if (!assessment) return false;
  if (
    assessment.windowKind !== "durable" &&
    assessment.windowKind !== "temporary_safe"
  ) {
    return false;
  }
  if (assessment.runnerCanContestBeforeScore) return false;
  if (assessment.agendaStealRelevantBeforeScore) return false;
  if (!assessment.corpCanRezRelevantIce) return false;
  if (assessment.corpCanRezFullPathWithDynamicReserve === false) return false;
  return true;
}

export function normalizedCorpReserveScoreValue(rawValue: number): number {
  return Math.max(
    -100,
    Math.min(
      100,
      Math.round(rawValue / CORP_RESERVE_SCORE_NORMALIZATION_DIVISOR),
    ),
  );
}

export function corpReserveScoreComponent(
  key: string,
  label: string,
  rawValue: number,
  evidence: readonly string[],
): AiDecisionScoreComponent {
  const normalizedValue = normalizedCorpReserveScoreValue(rawValue);
  return {
    key,
    label,
    value: normalizedValue,
    reason: [
      ...evidence,
      `reserve_raw_value:${rawValue}`,
      `reserve_normalized_value:${normalizedValue}`,
    ].join("|"),
  };
}

export function corpGameEndingScorelineExposurePenaltyComponent<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "install_card" && action.type !== "advance_card") {
    return undefined;
  }
  const roles = dependencies.rolesForAction(input, action);
  if (!dependencies.corpActionIsScoreLine(input, action, roles)) {
    return undefined;
  }
  if (dependencies.corpAdvanceCompletesScore?.(input, action) === true) {
    return undefined;
  }
  const assessment = dependencies.corpScoringWindowAssessment?.(
    input,
    action,
    roles,
  );
  if (!assessment || assessment.scoreHorizon === "immediate") {
    return undefined;
  }
  const runnerCanAccessBeforeScore =
    assessment.runnerCanContestBeforeScore ||
    assessment.runnerCanReachAccessBeforeScore ||
    assessment.agendaStealRelevantBeforeScore;
  if (!runnerCanAccessBeforeScore) return undefined;
  const pointsToWin = input.playerView.agendaPointsToWin ?? 7;
  const runnerAgendaPointsAfterSteal =
    typeof assessment.runnerAgendaPointsAfterSteal === "number"
      ? assessment.runnerAgendaPointsAfterSteal
      : 0;
  const gameEndingSteal =
    assessment.agendaStealSeverity === "game_ending" ||
    runnerAgendaPointsAfterSteal >= pointsToWin;
  if (!gameEndingSteal) return undefined;
  if (
    assessment.windowKind !== "unsafe" &&
    assessment.recommendedNextStep !== "build_remote_ice" &&
    assessment.recommendedNextStep !== "gain_credit"
  ) {
    return undefined;
  }
  return {
    key: "corp_game_ending_scoreline_exposure_penalty",
    label: "Game-ending Scoreline-Exposure",
    value: -4600,
    reason: [
      "scoreline_exposes_game_ending_steal:true",
      `action:${action.type}`,
      `server:${assessment.serverId}`,
      `score_horizon:${assessment.scoreHorizon}`,
      `window_kind:${assessment.windowKind}`,
      `recommended_next_step:${assessment.recommendedNextStep}`,
      `runner_can_contest_before_score:${assessment.runnerCanContestBeforeScore}`,
      `runner_can_reach_access_before_score:${assessment.runnerCanReachAccessBeforeScore}`,
      `agenda_steal_relevant_before_score:${assessment.agendaStealRelevantBeforeScore}`,
      `agenda_steal_severity:${assessment.agendaStealSeverity ?? "unknown"}`,
      `runner_points_after_steal:${runnerAgendaPointsAfterSteal}`,
      ...assessment.evidence,
    ].join("|"),
  };
}

export function corpUnsafeDelayedScorelineExposureComponent<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  boardTriageState: ReturnType<typeof semanticRuntimeCorpBoardTriage>,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "install_card" && action.type !== "advance_card") {
    return undefined;
  }
  const roles = dependencies.rolesForAction(input, action);
  if (!dependencies.corpActionIsScoreLine(input, action, roles)) {
    return undefined;
  }
  if (dependencies.corpAdvanceCompletesScore?.(input, action) === true) {
    return undefined;
  }
  if (
    corpIsLastViableDeckoutMatchpointScoreline(input, action, boardTriageState)
  ) {
    return undefined;
  }
  const assessment = dependencies.corpScoringWindowAssessment?.(
    input,
    action,
    roles,
  );
  if (
    !assessment ||
    assessment.scoreHorizon === "immediate" ||
    assessment.windowKind !== "unsafe"
  ) {
    return undefined;
  }
  if (
    !assessment.runnerCanReachAccessBeforeScore ||
    !assessment.agendaStealRelevantBeforeScore
  ) {
    return undefined;
  }
  return {
    key: "corp_unsafe_delayed_scoreline_exposure",
    label: "Unsichere verzögerte Scoreline",
    value: -4200,
    reason: [
      "unsafe_delayed_scoreline:true",
      `action:${action.type}`,
      `server:${assessment.serverId}`,
      `score_horizon:${assessment.scoreHorizon}`,
      `recommended_next_step:${assessment.recommendedNextStep}`,
      `runner_can_reach_access_before_score:${assessment.runnerCanReachAccessBeforeScore}`,
      `agenda_steal_relevant_before_score:${assessment.agendaStealRelevantBeforeScore}`,
      ...assessment.evidence,
    ].join("|"),
  };
}

export function corpScorelineFundingAssessmentComponent<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
): AiDecisionScoreComponent | undefined {
  const assessment = dependencies.corpScorelineWindowAssessment?.(input);
  if (!assessment || assessment.recommendedNextStep !== "fund_scoreline") {
    return undefined;
  }
  const path = assessment.paths.find(
    (candidate) => candidate.actionId === action.actionId,
  );
  const bestPath = assessment.bestPath;
  const actionIsFundingPath =
    path?.actionRoles.includes("fund_scoreline") === true ||
    (actionProvidesCredits(action) &&
      bestPath?.recommendedNextStep === "fund_scoreline" &&
      bestPath.actionId === action.actionId);
  if (actionIsFundingPath) {
    return {
      key: "corp_scoreline_funding_alignment",
      label: "Scoreline-Funding",
      value: 2600,
      reason: [
        "corp_scoreline_recommended_next_step:fund_scoreline",
        `action:${action.type}`,
        `action_id:${action.actionId}`,
        ...(path
          ? [`path_recommended_next_step:${path.recommendedNextStep}`]
          : []),
        ...(path?.blockers.map((blocker) => `path_blocker:${blocker}`) ?? []),
        ...assessment.evidence,
        ...(path?.evidence ?? []),
      ].join("|"),
    };
  }
  if (action.type !== "advance_card" && action.type !== "install_card") {
    return undefined;
  }
  if (dependencies.corpAdvanceCompletesScore?.(input, action) === true) {
    return undefined;
  }
  if (
    corpSameTurnScoreCloseoutComponent(input, action, dependencies, undefined)
  ) {
    return undefined;
  }
  const roles = dependencies.rolesForAction(input, action);
  if (!dependencies.corpActionIsScoreLine(input, action, roles)) {
    return undefined;
  }
  const actionNeedsFunding =
    path?.recommendedNextStep === "fund_scoreline" ||
    path?.blockers.includes("credits") === true ||
    assessment.blockedByCredits === true;
  if (!actionNeedsFunding) return undefined;
  return {
    key: "corp_scoreline_funding_mismatch",
    label: "Scoreline-Funding fehlt",
    value: -5200,
    reason: [
      "corp_scoreline_recommended_next_step:fund_scoreline",
      "scoreline_action_before_funding:true",
      `action:${action.type}`,
      `action_id:${action.actionId}`,
      ...(path
        ? [`path_recommended_next_step:${path.recommendedNextStep}`]
        : []),
      ...(path?.blockers.map((blocker) => `path_blocker:${blocker}`) ?? []),
      ...assessment.evidence,
      ...(path?.evidence ?? []),
    ].join("|"),
  };
}

type CorpActiveRemoteScorelineState = {
  serverId: string;
  cardId: string;
  reserveFloor: number;
  agendaPointsAtRisk: number;
  advancesRemaining: number;
  unrezzedRemoteRezCost: number;
  evidence: string[];
};

export function corpActiveRemoteAgendaAdvanceClockComponent<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  boardTriageState: ReturnType<typeof semanticRuntimeCorpBoardTriage>,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "advance_card") return undefined;
  const state = corpActiveRemoteScorelineState(input);
  if (!state) return undefined;
  const sourceCard = visibleSourceCardForAction(input, action);
  if (!sourceCard || sourceCard.instanceId !== state.cardId) {
    return undefined;
  }
  const roles = dependencies.rolesForAction(input, action);
  const scoringWindow = dependencies.corpScoringWindowAssessment?.(
    input,
    action,
    roles,
  );
  const rezFloor = dependencies.corpRemoteRezFloorAssessment(input, action);
  if (rezFloor?.blockedByFloor) return undefined;
  const creditsAfterAction =
    input.playerView.own.credits - dependencies.actionCreditCost(action);
  const closesBeforeRunner =
    dependencies.corpAdvanceCompletesScore?.(input, action) === true ||
    scoringWindow?.scoreHorizon === "immediate";
  if (
    !closesBeforeRunner &&
    scoringWindow?.windowKind === "unsafe" &&
    scoringWindow.runnerCanReachAccessBeforeScore === true &&
    scoringWindow.agendaStealRelevantBeforeScore === true
  ) {
    return {
      key: "corp_active_remote_agenda_unsafe_advance",
      label: "Unsichere Remote-Agenda",
      value: -5200,
      reason: [
        "active_remote_agenda:true",
        "unsafe_delayed_advance:true",
        `server:${state.serverId}`,
        `card:${state.cardId}`,
        `score_horizon:${scoringWindow.scoreHorizon}`,
        `recommended_next_step:${scoringWindow.recommendedNextStep}`,
        ...scoringWindow.evidence,
        ...state.evidence,
      ].join("|"),
    };
  }
  const scoringWindowNeedsFunding =
    scoringWindow?.recommendedNextStep === "gain_credit" ||
    scoringWindow?.corpCanRezRelevantIce === false ||
    scoringWindow?.corpCanRezFullPathWithDynamicReserve === false;
  const scoringWindowRecommendsUncontestedAdvance =
    scoringWindow?.recommendedNextStep === "advance" &&
    scoringWindow.windowKind !== "unsafe" &&
    scoringWindow.runnerCanContestNow !== true &&
    scoringWindow.runnerCanReachAccessNow !== true &&
    scoringWindow.agendaStealRelevantNow !== true &&
    scoringWindow.runnerCanContestBeforeScore !== true &&
    scoringWindow.runnerCanReachAccessBeforeScore !== true &&
    scoringWindow.agendaStealRelevantBeforeScore !== true;
  const punishPrimaryUncontestedAdvanceRequiresReserve =
    corpScoreRuntimeIsPunishPrimary(input) &&
    scoringWindowRecommendsUncontestedAdvance;
  const tempoAdvanceUnderClock =
    corpActiveRemoteAgendaCanTempoAdvanceUnderClock(
      input,
      action,
      dependencies,
      boardTriageState,
      state,
      scoringWindow,
    );
  if (
    !closesBeforeRunner &&
    scoringWindowNeedsFunding &&
    creditsAfterAction < state.reserveFloor &&
    (!scoringWindowRecommendsUncontestedAdvance ||
      punishPrimaryUncontestedAdvanceRequiresReserve) &&
    !tempoAdvanceUnderClock.allowed
  ) {
    return {
      key: "corp_active_remote_agenda_underfunded_advance",
      label: "Remote-Agenda-Funding",
      value: -9000,
      reason: [
        "active_remote_agenda:true",
        "advance_breaks_score_remote_reserve:true",
        `server:${state.serverId}`,
        `card:${state.cardId}`,
        `credits_after_action:${creditsAfterAction}`,
        `reserve_floor:${state.reserveFloor}`,
        `advances_remaining:${state.advancesRemaining}`,
        `unrezzed_remote_rez_cost:${state.unrezzedRemoteRezCost}`,
        ...(punishPrimaryUncontestedAdvanceRequiresReserve
          ? ["punish_primary_uncontested_advance_requires_reserve:true"]
          : []),
        ...(scoringWindow?.recommendedNextStep
          ? [`recommended_next_step:${scoringWindow.recommendedNextStep}`]
          : []),
        ...tempoAdvanceUnderClock.evidence,
        ...state.evidence,
      ].join("|"),
    };
  }
  if (scoringWindow?.recommendedNextStep === "gain_credit") {
    return undefined;
  }
  if (
    boardTriageState.primary === "protect_hq" ||
    boardTriageState.primary === "protect_rd"
  ) {
    if (boardTriageState.severity === "critical") return undefined;
  }
  const runnerAgendaPoints =
    positiveOrZeroNumber(input.playerView.opponent?.agendaPoints) ?? 0;
  const severityBonus =
    runnerAgendaPoints >= 5 ||
    state.agendaPointsAtRisk >= 3 ||
    scoringWindow?.agendaStealSeverity === "near_win" ||
    scoringWindow?.agendaStealSeverity === "game_ending"
      ? 700
      : 0;
  const tempoAdvanceBonus =
    tempoAdvanceUnderClock.allowed && boardTriageState.severity === "critical"
      ? 1600
      : tempoAdvanceUnderClock.allowed
        ? 800
        : 0;
  return {
    key: "corp_active_remote_agenda_advance_clock",
    label: "Aktive Remote-Agenda",
    value: 2600 + severityBonus + tempoAdvanceBonus,
    reason: [
      "active_remote_agenda:true",
      ...(tempoAdvanceUnderClock.allowed
        ? ["tempo_advance_under_scoreline_clock:true"]
        : []),
      `server:${state.serverId}`,
      `card:${state.cardId}`,
      `advances_remaining:${state.advancesRemaining}`,
      `agenda_points_at_risk:${state.agendaPointsAtRisk}`,
      `runner_agenda_points:${runnerAgendaPoints}`,
      ...(scoringWindow?.recommendedNextStep
        ? [`recommended_next_step:${scoringWindow.recommendedNextStep}`]
        : []),
      ...tempoAdvanceUnderClock.evidence,
      ...state.evidence,
    ].join("|"),
  };
}

function corpActiveRemoteAgendaCanTempoAdvanceUnderClock<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  boardTriageState: ReturnType<typeof semanticRuntimeCorpBoardTriage>,
  state: CorpActiveRemoteScorelineState,
  scoringWindow: CorpScoringWindowAssessment | undefined,
): { allowed: boolean; evidence: string[] } {
  if (boardTriageState.primary !== "score_now") {
    return { allowed: false, evidence: ["tempo_score_now:false"] };
  }
  const triageServer =
    boardTriageState.scoreRemoteServerId ?? boardTriageState.targetServerId;
  if (triageServer !== undefined && triageServer !== state.serverId) {
    return {
      allowed: false,
      evidence: [`tempo_score_now_target_mismatch:${triageServer}`],
    };
  }
  const blockingIce = corpStrongSameRemoteIceInstallForScoreline(
    input,
    dependencies,
    state.serverId,
  );
  if (blockingIce) {
    return {
      allowed: false,
      evidence: [
        "tempo_score_now_blocked_by_remote_ice:true",
        `blocking_ice_action:${blockingIce.actionId}`,
        `blocking_ice_score:${blockingIce.score}`,
        `blocking_ice_recommendation:${blockingIce.recommendation}`,
      ],
    };
  }
  const sameTurnCloseout =
    corpSameTurnScoreCloseoutComponent(
      input,
      action,
      dependencies,
      undefined,
    ) !== undefined;
  if (
    scoringWindow?.windowKind === "unsafe" ||
    scoringWindow?.runnerCanContestBeforeScore === true ||
    scoringWindow?.recommendedNextStep === "build_remote_ice"
  ) {
    if (sameTurnCloseout) {
      return {
        allowed: true,
        evidence: [
          "tempo_score_now:true",
          "tempo_score_now_contestable_allowed_by_same_turn_closeout:true",
        ],
      };
    }
    return {
      allowed: false,
      evidence: [
        "tempo_score_now_blocked_by_contestable_remote:true",
        ...(scoringWindow?.recommendedNextStep
          ? [`recommended_next_step:${scoringWindow.recommendedNextStep}`]
          : []),
      ],
    };
  }
  return { allowed: true, evidence: ["tempo_score_now:true"] };
}

function corpStrongSameRemoteIceInstallForScoreline<TConsumer extends string>(
  input: AiDecisionInput,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  serverId: string,
):
  | {
      actionId: string;
      score: number;
      recommendation: string;
    }
  | undefined {
  const legalActions =
    input.legalActions ?? input.playerView.legalActions ?? [];
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  return legalActions
    .map((candidateAction) => {
      if (
        candidateAction.side !== "corp" ||
        candidateAction.type !== "install_card" ||
        candidateAction.payload?.placement !== "ice" ||
        corpInstallServerId(candidateAction) !== serverId
      ) {
        return undefined;
      }
      const sourceCard = visibleSourceCardForAction(input, candidateAction);
      return corpIcePlacementCandidateForAction({
        input,
        action: candidateAction,
        serverId,
        server,
        sourceCard,
        actionCreditCost: dependencies.actionCreditCost(candidateAction),
        iceRezCost: sourceCard?.rezCost,
        hasUrgentScoreline: true,
      });
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> =>
      Boolean(candidate),
    )
    .filter(
      (candidate) =>
        candidate.recommendation === "install_now" &&
        candidate.score >= CORP_SCORE_NOW_TEMPO_BLOCKING_REMOTE_ICE_SCORE,
    )
    .sort((left, right) => right.score - left.score)[0];
}

export function corpActiveScoreRemoteReserveFundingComponent(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "gain_credit") return undefined;
  const state = corpActiveRemoteScorelineState(input);
  if (!state) return undefined;
  const credits = input.playerView.own.credits;
  if (credits >= state.reserveFloor) return undefined;
  return {
    key: "corp_active_score_remote_reserve_funding",
    label: "Score-Remote-Reserve",
    value: 950,
    reason: [
      "active_remote_agenda:true",
      `server:${state.serverId}`,
      `credits:${credits}`,
      `reserve_floor:${state.reserveFloor}`,
      `advances_remaining:${state.advancesRemaining}`,
      `unrezzed_remote_rez_cost:${state.unrezzedRemoteRezCost}`,
      ...state.evidence,
    ].join("|"),
  };
}

export function corpActiveScorelineOffPathPenaltyComponent<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  boardTriageState: ReturnType<typeof semanticRuntimeCorpBoardTriage>,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "install_card" && action.type !== "rez_ice") {
    return undefined;
  }
  const state = corpActiveRemoteScorelineState(input);
  if (!state) return undefined;
  const actionServerId = corpScorelineActionServerId(input, action);
  if (actionServerId === state.serverId) return undefined;
  if (
    (boardTriageState.primary === "protect_hq" ||
      boardTriageState.primary === "protect_rd") &&
    boardTriageState.severity === "critical" &&
    actionServerId === boardTriageState.targetServerId
  ) {
    return undefined;
  }
  if (
    action.type === "install_card" &&
    action.payload?.placement === "root" &&
    dependencies.corpActionIsScoreLine(
      input,
      action,
      dependencies.rolesForAction(input, action),
    )
  ) {
    return undefined;
  }
  const cost = semanticRuntimeCorpActionCreditCost(
    dependencies,
    action,
    actionSemanticCandidate,
  );
  const creditsAfterAction = input.playerView.own.credits - cost;
  const breaksReserve = creditsAfterAction < state.reserveFloor;
  return {
    key: "corp_active_scoreline_off_path_spend",
    label: "Scoreline-Reservebruch",
    value: breaksReserve ? -2600 : -1500,
    reason: [
      "active_remote_agenda:true",
      `score_remote:${state.serverId}`,
      `action_server:${actionServerId ?? "none"}`,
      `action:${action.type}`,
      `cost:${cost}`,
      `credits_after_action:${creditsAfterAction}`,
      `reserve_floor:${state.reserveFloor}`,
      `breaks_reserve:${breaksReserve}`,
      ...state.evidence,
    ].join("|"),
  };
}

export function corpExistingScoreRemotePipelineComponent<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  roles: string[],
  boardTriageState: ReturnType<typeof semanticRuntimeCorpBoardTriage>,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "install_card") return undefined;
  if (
    boardTriageState.primary === "protect_hq" ||
    boardTriageState.primary === "protect_rd"
  ) {
    if (boardTriageState.severity === "critical") return undefined;
  }
  if (corpActiveRemoteScorelineState(input)) return undefined;
  const pipeline = corpPreparedScoreRemotePipeline(input);
  if (!pipeline) return undefined;
  const serverId = corpInstallServerId(action);
  const isScorelineRoot =
    action.payload?.placement === "root" &&
    dependencies.corpActionIsScoreLine(input, action, roles);
  if (serverId === pipeline.serverId) {
    if (isScorelineRoot) {
      return {
        key: "corp_existing_score_remote_pipeline",
        label: "Vorbereitetes Scoring-Remote",
        value: 1800,
        reason: [
          "existing_score_remote_pipeline:true",
          `server:${pipeline.serverId}`,
          `ice_count:${pipeline.iceCount}`,
          "payload:scoreline_root",
        ].join("|"),
      };
    }
    if (action.payload?.placement === "ice") {
      return {
        key: "corp_existing_score_remote_pipeline",
        label: "Vorbereitetes Scoring-Remote",
        value: 700,
        reason: [
          "existing_score_remote_pipeline:true",
          `server:${pipeline.serverId}`,
          `ice_count:${pipeline.iceCount}`,
          "payload:additional_remote_ice",
        ].join("|"),
      };
    }
    return undefined;
  }
  if (serverId === "new_remote") {
    return {
      key: "corp_remote_sprawl_penalty",
      label: "Remote-Sprawl",
      value: -3600,
      reason: [
        "existing_score_remote_pipeline:true",
        `preferred_server:${pipeline.serverId}`,
        "action_server:new_remote",
        `placement:${String(action.payload?.placement ?? "unknown")}`,
      ].join("|"),
    };
  }
  if (serverId?.startsWith("remote_") && !isScorelineRoot) {
    return {
      key: "corp_remote_sprawl_penalty",
      label: "Remote-Sprawl",
      value: -1800,
      reason: [
        "existing_score_remote_pipeline:true",
        `preferred_server:${pipeline.serverId}`,
        `action_server:${serverId}`,
        `placement:${String(action.payload?.placement ?? "unknown")}`,
      ].join("|"),
    };
  }
  return undefined;
}

export function corpLowValueInstallDeferComponent<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  roles: string[],
  boardTriageState: ReturnType<typeof semanticRuntimeCorpBoardTriage>,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "install_card") return undefined;
  if (boardTriageState.primary !== "low_value") return undefined;
  if (dependencies.corpActionIsScoreLine(input, action, roles)) {
    return undefined;
  }
  if (rolesMatch(roles, ["economy"])) return undefined;
  const serverId = corpInstallServerId(action);
  const iceCount = serverId ? corpServerIceCount(input, serverId) : 0;
  const emptyRemote =
    serverId?.startsWith("remote_") === true &&
    input.playerView.servers.find((server) => server.id === serverId)?.root
      .length === 0;
  if (
    action.payload?.placement !== "ice" &&
    action.payload?.placement !== "root"
  ) {
    return undefined;
  }
  if (iceCount < 2 && !emptyRemote && serverId !== "new_remote") {
    return undefined;
  }
  return {
    key: "corp_low_value_install_defer",
    label: "Installation vertagen",
    value: -1300,
    reason: [
      "triage_primary:low_value",
      `server:${serverId ?? "none"}`,
      `ice_count:${iceCount}`,
      `empty_remote:${emptyRemote}`,
      `placement:${String(action.payload?.placement ?? "unknown")}`,
    ].join("|"),
  };
}

export function corpCentralOvericeRemoteUnderbuildComponent(
  input: AiDecisionInput,
  action: LegalAction,
  boardTriageState: ReturnType<typeof semanticRuntimeCorpBoardTriage>,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "install_card" || action.payload?.placement !== "ice") {
    return undefined;
  }
  const serverId = corpInstallServerId(action);
  if (!serverId || !["hq", "rd", "archives"].includes(serverId)) {
    return undefined;
  }
  if (
    boardTriageState.primary === "protect_hq" ||
    boardTriageState.primary === "protect_rd"
  ) {
    return undefined;
  }
  const centralIceCount = corpServerIceCount(input, serverId);
  if (centralIceCount < 2) return undefined;
  const underbuiltRemote = input.playerView.servers
    .filter((server) => server.id.startsWith("remote_"))
    .filter((server) => server.ice.length < 2)
    .sort((left, right) => left.id.localeCompare(right.id))[0];
  if (!underbuiltRemote) return undefined;
  const agendaNeedsRemote = [
    ...input.playerView.own.gripOrHq,
    ...input.playerView.servers.flatMap((server) => server.root),
  ].some((card) => card.known !== false && corpVisibleCardIsAgenda(card));
  if (!agendaNeedsRemote) return undefined;
  return {
    key: "corp_central_overice_remote_underbuild",
    label: "Zentral-Overice bei Remote-Unterbau",
    value: -2600,
    reason: [
      `central:${serverId}`,
      `central_ice_count:${centralIceCount}`,
      `underbuilt_remote:${underbuiltRemote.id}`,
      `underbuilt_remote_ice:${underbuiltRemote.ice.length}`,
      "agenda_needs_remote:true",
    ].join("|"),
  };
}
