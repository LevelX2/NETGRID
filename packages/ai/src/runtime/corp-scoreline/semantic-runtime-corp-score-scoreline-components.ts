import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate";
import { actionHasImmediateCreditGain } from "../../actions/action-effect-classification";
import {
  semanticRuntimeCorpBoardTriage,
  type CorpBoardTriage,
} from "../semantic-runtime-corp-board-triage";
import { rolesMatch } from "../role-match";
import { semanticRuntimeCorpCentralPressureAssessment } from "../semantic-runtime-corp-central-pressure";
import type { CorpScoringWindowAssessment } from "../semantic-runtime-corp-scoring-window";
import { corpScoringWindowHasFundedPreScoreProtection } from "./semantic-runtime-corp-scoring-window-contracts";
import { corpKnownAgendaInventory } from "../corp-known-agenda-inventory";
import {
  CORP_RESERVE_SCORE_NORMALIZATION_DIVISOR,
  type SemanticRuntimeCorpScoreDependencies,
} from "./semantic-runtime-corp-score-contracts";
import {
  corpSameTurnScoreCloseoutComponent,
  corpVisibleCardIsAgenda,
  semanticRuntimeCorpActionCreditCost,
  visibleSourceCardForAction,
} from "./semantic-runtime-corp-score-action-economy";
import { corpInstallServerId } from "./semantic-runtime-corp-score-ice-components";
import {
  corpServerIceCount,
  corpVisibleAgendaPoints,
} from "./semantic-runtime-corp-score-state";
import {
  corpIsLastViableDeckoutMatchpointScoreline,
  corpProtectedScorelineCommitmentContext,
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
  if (
    corpServerIceCount(input, "hq") >= 3 &&
    !hqPressure.visibleMultiaccess &&
    !hqPressure.eventMultiaccess &&
    hqPressure.recentRunOrAccessEvents <= 0 &&
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
  const projection = actionSemanticCandidate?.actionCapacityProjection;
  if (
    !projection ||
    !projection.kind.startsWith("immediate_") ||
    projection.timing !== "immediate"
  ) {
    return undefined;
  }
  const gainedActions = Math.max(0, projection.grossActionsGained);
  if (gainedActions <= 0) return undefined;
  const clickCost = Math.max(1, projection.preExistingActionCost);
  const netExtraActions = Math.max(0, projection.netCurrentTurnActionDelta);
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
      `action_capacity_projection_source:${projection.source}`,
      "basic_action_return_below_credit_cost:true",
    ].join("|"),
  };
}

export function corpScoringWindowSuppressesContestableRemotePenalty(
  assessment: CorpScoringWindowAssessment | undefined,
): boolean {
  if (!assessment) return false;
  if (corpScoringWindowHasFundedPreScoreProtection(assessment)) return true;
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
  if (
    corpProtectedScorelineCommitmentContext(
      input,
      action,
      dependencies,
      roles,
      assessment,
    )
  ) {
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
    corpProtectedScorelineCommitmentContext(
      input,
      action,
      dependencies,
      roles,
      assessment,
    )
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

export function corpContestedAgendaPointRiskComponent<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "install_card" || action.payload?.placement !== "root") {
    return undefined;
  }
  const roles = dependencies.rolesForAction(input, action);
  if (!dependencies.corpActionIsScoreLine(input, action, roles)) {
    return undefined;
  }
  const source = visibleSourceCardForAction(input, action);
  if (!source || !corpVisibleCardIsAgenda(source)) return undefined;
  const assessment = dependencies.corpScoringWindowAssessment?.(
    input,
    action,
    roles,
  );
  if (
    !assessment ||
    assessment.windowKind !== "unsafe" ||
    !assessment.runnerCanReachAccessBeforeScore ||
    !assessment.agendaStealRelevantBeforeScore
  ) {
    return undefined;
  }
  const agendaPoints = corpVisibleAgendaPoints(source);
  if (agendaPoints <= 0) return undefined;
  return {
    key: "corp_contested_agenda_point_risk",
    label: "Gefährdete Agenda-Punkte",
    value: -600 * agendaPoints,
    reason: [
      "contested_agenda_point_risk:true",
      `server:${assessment.serverId}`,
      `agenda_points_at_risk:${agendaPoints}`,
      `runner_can_reach_access_before_score:${assessment.runnerCanReachAccessBeforeScore}`,
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
    (actionHasImmediateCreditGain(action) &&
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
