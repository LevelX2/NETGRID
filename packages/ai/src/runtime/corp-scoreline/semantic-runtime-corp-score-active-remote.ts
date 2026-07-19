import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate";
import { semanticRuntimeCorpBoardTriage } from "../semantic-runtime-corp-board-triage";
import { corpIcePlacementCandidateForAction } from "../corp-ice-placement/corp-ice-placement";
import type { CorpScoringWindowAssessment } from "../semantic-runtime-corp-scoring-window";
import {
  CORP_SCORE_NOW_TEMPO_BLOCKING_REMOTE_ICE_SCORE,
  type SemanticRuntimeCorpScoreDependencies,
} from "./semantic-runtime-corp-score-contracts";
import { corpPreparedScoreRemotePipeline } from "./semantic-runtime-corp-score-facts";
import {
  corpSameTurnScoreCloseoutComponent,
  positiveOrZeroNumber,
  semanticRuntimeCorpActionCreditCost,
  visibleSourceCardForAction,
} from "./semantic-runtime-corp-score-action-economy";
import { corpInstallServerId } from "./semantic-runtime-corp-score-ice-components";
import { corpActiveRemoteScorelineState } from "./semantic-runtime-corp-score-state";
import {
  corpScoreRuntimeIsPunishPrimary,
  corpScorelineActionServerId,
} from "./semantic-runtime-corp-score-hq-pressure";

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
  const runnerCannotContestBeforeScore =
    scoringWindow?.runnerCanContestNow === false &&
    scoringWindow?.runnerCanReachAccessNow === false &&
    scoringWindow?.agendaStealRelevantNow === false &&
    scoringWindow?.runnerCanContestBeforeScore === false &&
    scoringWindow?.runnerCanReachAccessBeforeScore === false &&
    scoringWindow?.agendaStealRelevantBeforeScore === false;
  const punishPrimaryUncontestedAdvanceRequiresReserve =
    corpScoreRuntimeIsPunishPrimary(input) &&
    scoringWindowRecommendsUncontestedAdvance;
  const protectedRemoteAdvanceCanIgnoreFullRezReserve =
    runnerCannotContestBeforeScore &&
    scoringWindow?.recommendedNextStep === "build_remote_ice" &&
    boardTriageState.primary === "fund_score_remote";
  const leavesUnsafeRemoteWithUnfundedIce =
    !closesBeforeRunner &&
    scoringWindow?.windowKind === "unsafe" &&
    creditsAfterAction <= 0 &&
    state.unrezzedRemoteRezCost > 0;
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
    (leavesUnsafeRemoteWithUnfundedIce ||
      (scoringWindowNeedsFunding && creditsAfterAction < state.reserveFloor)) &&
    (!scoringWindowRecommendsUncontestedAdvance ||
      punishPrimaryUncontestedAdvanceRequiresReserve) &&
    (!protectedRemoteAdvanceCanIgnoreFullRezReserve ||
      leavesUnsafeRemoteWithUnfundedIce) &&
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
        ...(leavesUnsafeRemoteWithUnfundedIce
          ? ["unsafe_remote_unrezzed_ice_left_unfunded:true"]
          : []),
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
      ...(runnerCannotContestBeforeScore
        ? ["runner_cannot_contest_before_score:true"]
        : []),
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
  if (
    action.type !== "install_card" &&
    action.type !== "rez_ice" &&
    action.type !== "rez_card"
  ) {
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
