import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate";
import { actionHasImmediateCreditGain } from "../../actions/action-effect-classification";
import { semanticRuntimeCorpBoardTriage } from "../semantic-runtime-corp-board-triage";
import { visibleCardDefinition } from "../card-definition-lookup";
import { rolesMatch } from "../role-match";
import { semanticRuntimeCorpCentralPressureAssessment } from "../semantic-runtime-corp-central-pressure";
import type { CorpScoringWindowAssessment } from "../semantic-runtime-corp-scoring-window";
import { corpKnownAgendaInventory } from "../corp-known-agenda-inventory";
import { type SemanticRuntimeCorpScoreDependencies } from "./semantic-runtime-corp-score-contracts";
import {
  corpHqAgendaCount,
  corpPreparedScoreRemotePipeline,
} from "./semantic-runtime-corp-score-facts";
import {
  corpBurstEconomyOperationForAction,
  corpVisibleCardIsAgenda,
  corpServerIdForInstalledCard,
  positiveOrZeroNumber,
  visibleActionSourceId,
  visibleSourceCardForAction,
} from "./semantic-runtime-corp-score-action-economy";
import { corpInstallServerId } from "./semantic-runtime-corp-score-ice-components";
import {
  corpServerIceCount,
  corpVisibleAgendaPoints,
} from "./semantic-runtime-corp-score-state";

export function corpHqAgendaReliefScorelineContext<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  roles: string[],
  boardTriageState: ReturnType<typeof semanticRuntimeCorpBoardTriage>,
):
  | {
      component: AiDecisionScoreComponent;
      evidence: string[];
    }
  | undefined {
  const forceScorelineRelativeRelief =
    boardTriageState.primary === "force_scoreline_clock" &&
    boardTriageState.evidence.includes("corp_hq_agenda_flood_pressure:true") &&
    boardTriageState.evidence.includes(
      "corp_hq_agenda_relative_remote_relief:true",
    );
  const highHqProtectionRelief =
    boardTriageState.primary === "protect_hq" &&
    boardTriageState.severity === "high";
  if (!forceScorelineRelativeRelief && !highHqProtectionRelief) {
    return undefined;
  }
  if (!dependencies.corpActionIsScoreLine(input, action, roles)) {
    return undefined;
  }
  if (
    action.type !== "advance_card" &&
    !(action.type === "install_card" && action.payload?.placement !== "ice")
  ) {
    return undefined;
  }

  const serverId = corpScorelineActionServerId(input, action);
  if (
    !serverId?.startsWith("remote_") ||
    (forceScorelineRelativeRelief &&
      boardTriageState.targetServerId !== undefined &&
      boardTriageState.targetServerId !== serverId)
  ) {
    return undefined;
  }

  const assessment = dependencies.corpScoringWindowAssessment?.(
    input,
    action,
    roles,
  );
  if (!assessment) return undefined;
  const pointsToWin = input.playerView.agendaPointsToWin ?? 7;
  const runnerAgendaPointsAfterSteal =
    typeof assessment.runnerAgendaPointsAfterSteal === "number"
      ? assessment.runnerAgendaPointsAfterSteal
      : 0;
  const hqPressureRelief =
    highHqProtectionRelief &&
    corpScorelineActionRelievesHqAgendaPressure(
      input,
      action,
      assessment,
      boardTriageState,
      serverId,
    );
  if (
    !(
      (forceScorelineRelativeRelief &&
        assessment.windowKind === "unsafe" &&
        assessment.agendaStealSeverity === "near_win" &&
        runnerAgendaPointsAfterSteal < pointsToWin &&
        assessment.recommendedNextStep !== "gain_credit" &&
        assessment.corpCanRezRelevantIce !== false &&
        assessment.corpCanRezFullPathWithDynamicReserve !== false &&
        (assessment.dynamicProtectionWeaknessCount ?? 0) === 0 &&
        (assessment.affordableDurableRelevantIceCount ?? 0) >= 1) ||
      hqPressureRelief
    )
  ) {
    return undefined;
  }

  const evidence = [
    "hq_agenda_relief_scoreline:true",
    `server:${serverId}`,
    `agenda_steal_severity:${assessment.agendaStealSeverity}`,
    `runner_points_after_steal:${runnerAgendaPointsAfterSteal}`,
    `affordable_durable_ice:${assessment.affordableDurableRelevantIceCount ?? 0}`,
    ...(hqPressureRelief ? ["hq_pressure_safe_remote_relief:true"] : []),
  ];
  return {
    component: {
      key: "corp_hq_agenda_relief_scoreline",
      label: "HQ-Agenda-Entlastung",
      value: 3200,
      reason: evidence.join("|"),
    },
    evidence,
  };
}

export function corpPunishPrimarySpeculativeScorelineDampenComponent<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  roles: string[],
  boardTriageState: ReturnType<typeof semanticRuntimeCorpBoardTriage>,
): AiDecisionScoreComponent | undefined {
  if (!corpScoreRuntimeIsPunishPrimary(input)) return undefined;
  if (action.type !== "install_card" || action.payload?.placement === "ice") {
    return undefined;
  }
  if (!dependencies.corpActionIsScoreLine(input, action, roles)) {
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
  if (assessment?.scoreHorizon === "immediate") return undefined;
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
    corpPunishPrimaryPreparedScoreRemoteCommitment(
      input,
      action,
      assessment,
      boardTriageState,
    )
  ) {
    return undefined;
  }
  const runnerAgendaPoints =
    positiveOrZeroNumber(input.playerView.opponent?.agendaPoints) ?? 0;
  const runnerAgendaPointsAfterSteal =
    positiveOrZeroNumber(assessment?.runnerAgendaPointsAfterSteal) ?? 0;
  const pointsToWin = input.playerView.agendaPointsToWin ?? 7;
  if (
    runnerAgendaPoints >= 5 ||
    runnerAgendaPointsAfterSteal >= pointsToWin ||
    assessment?.agendaStealSeverity === "game_ending"
  ) {
    return undefined;
  }
  const unsafeBeforeScore =
    assessment?.windowKind === "unsafe" &&
    (assessment.runnerCanContestBeforeScore ||
      assessment.runnerCanReachAccessBeforeScore ||
      assessment.agendaStealRelevantBeforeScore);
  return {
    key: "corp_punish_primary_speculative_scoreline_dampen",
    label: "Punish-Deck-Scoreline",
    value: unsafeBeforeScore ? -5600 : -1800,
    reason: [
      "corp_primary_win_intent:punish_runner",
      "speculative_scoreline_install:true",
      `unsafe_before_score:${unsafeBeforeScore}`,
      assessment?.scoreHorizon
        ? `score_horizon:${assessment.scoreHorizon}`
        : "score_horizon:unknown",
    ].join("|"),
  };
}

export type CorpProtectedScorelineCommitmentContext = {
  kind: "hq_flood" | "matchpoint_race";
  value: number;
  evidence: string[];
};

export function corpProtectedScorelineCommitmentContext<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  roles: string[],
  providedAssessment?: CorpScoringWindowAssessment,
): CorpProtectedScorelineCommitmentContext | undefined {
  if (
    action.type !== "install_card" ||
    action.payload?.placement !== "root" ||
    !dependencies.corpActionIsScoreLine(input, action, roles)
  ) {
    return undefined;
  }
  const source = visibleSourceCardForAction(input, action);
  if (!source || !corpVisibleCardIsAgenda(source)) return undefined;
  const serverId = corpInstallServerId(action);
  if (!serverId?.startsWith("remote_")) return undefined;
  const assessment =
    providedAssessment ??
    dependencies.corpScoringWindowAssessment?.(input, action, roles);
  if (
    !assessment ||
    assessment.serverId !== serverId ||
    assessment.corpCanRezRelevantIce === false ||
    assessment.corpCanRezFullPathWithDynamicReserve !== true ||
    (assessment.dynamicProtectionWeaknessCount ?? 0) > 0
  ) {
    return undefined;
  }

  const agendaPoints = corpVisibleAgendaPoints(source);
  const ownAgendaPoints =
    positiveOrZeroNumber(input.playerView.own.agendaPoints) ?? 0;
  const opponentAgendaPoints =
    positiveOrZeroNumber(input.playerView.opponent.agendaPoints) ?? 0;
  const pointsToWin = input.playerView.agendaPointsToWin ?? 7;
  const affordableRelevantIce =
    assessment.affordableDurableRelevantIceCount ?? 0;
  const matchpointRace =
    agendaPoints > 0 &&
    ownAgendaPoints + agendaPoints >= pointsToWin &&
    opponentAgendaPoints >= Math.max(0, pointsToWin - 2) &&
    affordableRelevantIce >= 3;
  const hqAgendaCount = corpHqAgendaCount(input);
  const runnerPointsAfterSteal =
    positiveOrZeroNumber(assessment.runnerAgendaPointsAfterSteal) ??
    opponentAgendaPoints + agendaPoints;
  const hqFlood =
    !matchpointRace &&
    hqAgendaCount >= 3 &&
    input.playerView.opponent.credits <= 3 &&
    runnerPointsAfterSteal < pointsToWin;
  if (!matchpointRace && !hqFlood) return undefined;

  const kind = matchpointRace ? "matchpoint_race" : "hq_flood";
  return {
    kind,
    value: matchpointRace ? 7600 : 5600,
    evidence: [
      `protected_scoreline_commitment:${kind}`,
      `server:${serverId}`,
      `agenda_points:${agendaPoints}`,
      `corp_agenda_points:${ownAgendaPoints}`,
      `runner_agenda_points:${opponentAgendaPoints}`,
      `runner_points_after_steal:${runnerPointsAfterSteal}`,
      `hq_agenda_count:${hqAgendaCount}`,
      `runner_credits:${input.playerView.opponent.credits}`,
      `affordable_durable_relevant_ice:${affordableRelevantIce}`,
      "corp_can_rez_full_path_with_dynamic_reserve:true",
    ],
  };
}

export function corpProtectedScorelineCommitmentComponent<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  roles: string[],
): AiDecisionScoreComponent | undefined {
  const context = corpProtectedScorelineCommitmentContext(
    input,
    action,
    dependencies,
    roles,
  );
  if (!context) return undefined;
  return {
    key:
      context.kind === "matchpoint_race"
        ? "corp_protected_matchpoint_scoreline"
        : "corp_protected_hq_flood_scoreline",
    label:
      context.kind === "matchpoint_race"
        ? "Geschützte Matchpoint-Scoreline"
        : "Geschützte HQ-Flood-Scoreline",
    value: context.value,
    reason: context.evidence.join("|"),
  };
}

export function corpIsLastViableDeckoutMatchpointScoreline(
  input: AiDecisionInput,
  action: LegalAction,
  boardTriageState: ReturnType<typeof semanticRuntimeCorpBoardTriage>,
): boolean {
  if (boardTriageState.primary !== "force_scoreline_clock") return false;
  if (
    !boardTriageState.evidence.includes(
      "corp_deckout_matchpoint_scoreline:true",
    ) ||
    !boardTriageState.evidence.includes("corp_deckout_last_viable_window:true")
  ) {
    return false;
  }
  const source = visibleSourceCardForAction(input, action);
  if (
    !source ||
    source.known === false ||
    (source.type ?? visibleCardDefinition(source)?.type) !== "agenda"
  ) {
    return false;
  }
  const corpAgendaPoints =
    positiveOrZeroNumber(input.playerView.own.agendaPoints) ?? 0;
  const pointsToWin =
    positiveOrZeroNumber(input.playerView.agendaPointsToWin) ?? 7;
  if (corpAgendaPoints + corpVisibleAgendaPoints(source) < pointsToWin) {
    return false;
  }
  const targetServerId =
    boardTriageState.scoreRemoteServerId ?? boardTriageState.targetServerId;
  return !targetServerId || corpInstallServerId(action) === targetServerId;
}

function corpPunishPrimaryPreparedScoreRemoteCommitment(
  input: AiDecisionInput,
  action: LegalAction,
  assessment: CorpScoringWindowAssessment | undefined,
  boardTriageState: ReturnType<typeof semanticRuntimeCorpBoardTriage>,
): boolean {
  if (action.payload?.placement !== "root") return false;
  if (!assessment) return false;
  const serverId = corpInstallServerId(action);
  const pipeline = corpPreparedScoreRemotePipeline(input);
  if (!serverId || !pipeline || pipeline.serverId !== serverId) return false;
  if (input.playerView.own.credits < pipeline.reserveFloor) return false;
  const relievesHqAgendaPressure = corpScorelineActionRelievesHqAgendaPressure(
    input,
    action,
    assessment,
    boardTriageState,
    serverId,
  );
  if (
    (boardTriageState.primary === "protect_hq" ||
      boardTriageState.primary === "protect_rd") &&
    (boardTriageState.severity === "high" ||
      boardTriageState.severity === "critical")
  ) {
    if (!relievesHqAgendaPressure) return false;
  }
  if (assessment.serverId !== serverId) return false;
  if (!corpPreparedRemoteScorelineCommitmentIsSafe(input, assessment)) {
    return false;
  }
  return true;
}

function corpPreparedRemoteScorelineCommitmentIsSafe(
  input: AiDecisionInput,
  assessment: CorpScoringWindowAssessment,
): boolean {
  if (
    assessment.windowKind !== "durable" &&
    assessment.windowKind !== "temporary_safe" &&
    assessment.windowKind !== "unsafe"
  ) {
    return false;
  }
  if (
    assessment.agendaStealSeverity &&
    assessment.agendaStealSeverity !== "normal" &&
    assessment.agendaStealSeverity !== "none"
  ) {
    return false;
  }
  const runnerAgendaPointsAfterSteal =
    positiveOrZeroNumber(assessment.runnerAgendaPointsAfterSteal) ?? 0;
  const pointsToWin = input.playerView.agendaPointsToWin ?? 7;
  if (runnerAgendaPointsAfterSteal >= Math.max(1, pointsToWin - 2)) {
    return false;
  }
  if (
    assessment.runnerCanContestBeforeScore ||
    assessment.runnerCanReachAccessBeforeScore ||
    assessment.agendaStealRelevantBeforeScore
  ) {
    return false;
  }
  if (
    assessment.recommendedNextStep === "build_remote_ice" ||
    assessment.recommendedNextStep === "gain_credit"
  ) {
    return false;
  }
  if (
    assessment.corpCanRezRelevantIce === false ||
    assessment.corpCanRezFullPathWithDynamicReserve === false ||
    (assessment.dynamicProtectionWeaknessCount ?? 0) > 0 ||
    (assessment.affordableDurableRelevantIceCount ?? 0) < 1
  ) {
    return false;
  }
  if (
    assessment.windowKind === "unsafe" &&
    (assessment.runnerCanContestNow ||
      assessment.runnerCanReachAccessNow ||
      assessment.agendaStealRelevantNow)
  ) {
    return false;
  }
  return true;
}

function corpScorelineActionRelievesHqAgendaPressure(
  input: AiDecisionInput,
  action: LegalAction,
  assessment: CorpScoringWindowAssessment | undefined,
  boardTriageState: ReturnType<typeof semanticRuntimeCorpBoardTriage>,
  serverId: string | undefined,
): boolean {
  if (!assessment) return false;
  if (boardTriageState.primary !== "protect_hq") return false;
  if (boardTriageState.severity !== "high") return false;
  if (!serverId?.startsWith("remote_")) return false;
  const pipeline = corpPreparedScoreRemotePipeline(input);
  if (pipeline?.serverId !== serverId) return false;
  const source = visibleSourceCardForAction(input, action);
  if (!source || !corpVisibleCardIsAgenda(source)) return false;
  if (
    !input.playerView.own.gripOrHq.some(
      (card) => card.instanceId === source.instanceId,
    )
  ) {
    return false;
  }
  return corpPreparedRemoteScorelineCommitmentIsSafe(input, assessment);
}

export function corpScoreRuntimeIsPunishPrimary(
  input: AiDecisionInput,
): boolean {
  const intent = (
    input as AiDecisionInput & {
      ownCorpStrategicIntent?: {
        primaryWinIntent?: string;
        scorePlan?: readonly string[];
        punishPlan?: readonly string[];
      };
    }
  ).ownCorpStrategicIntent;
  if (!intent) return false;
  if (intent.primaryWinIntent === "corp.punish_runner") return true;
  return (
    (intent.punishPlan?.length ?? 0) > 0 &&
    intent.scorePlan?.some((plan) =>
      ["corp.rush_scoreline", "corp.fast_advance_scoreline"].includes(plan),
    ) !== true
  );
}

export function corpScorelineActionServerId(
  input: AiDecisionInput,
  action: LegalAction,
): string | undefined {
  const direct =
    action.payload?.serverId ??
    action.payload?.targetServerId ??
    action.payload?.attackedServerId;
  if (typeof direct === "string") return direct;
  const cardId =
    typeof action.payload?.cardId === "string"
      ? action.payload.cardId
      : typeof action.payload?.targetCardId === "string"
        ? action.payload.targetCardId
        : typeof action.payload?.iceId === "string"
          ? action.payload.iceId
          : typeof action.source === "string"
            ? action.source
            : undefined;
  return cardId ? corpServerIdForInstalledCard(input, cardId) : undefined;
}

export function corpNonAgendaRootBlocksScoreRemoteComponent<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  roles: string[],
): AiDecisionScoreComponent | undefined {
  if (action.type !== "install_card" || action.payload?.placement !== "root") {
    return undefined;
  }
  if (dependencies.corpActionIsScoreLine(input, action, roles)) {
    return undefined;
  }
  const serverId = corpInstallServerId(action);
  if (!serverId?.startsWith("remote_")) return undefined;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server || server.root.length > 0 || server.ice.length === 0) {
    return undefined;
  }
  const source = visibleSourceCardForAction(input, action);
  const definition = source ? visibleCardDefinition(source) : undefined;
  if (source?.type === "agenda" || definition?.type === "agenda") {
    return undefined;
  }
  const agendaInstall = corpLegalActions(input).find((candidate) => {
    if (candidate.actionId === action.actionId) return false;
    if (
      candidate.type !== "install_card" ||
      candidate.payload?.placement !== "root" ||
      corpInstallServerId(candidate) !== serverId
    ) {
      return false;
    }
    const candidateRoles = dependencies.rolesForAction(input, candidate);
    return dependencies.corpActionIsScoreLine(input, candidate, candidateRoles);
  });
  if (!agendaInstall) return undefined;
  return {
    key: "corp_non_agenda_root_blocks_score_remote",
    label: "Scoring-Remote-Payload",
    value: -1800,
    reason: [
      "non_agenda_root_blocks_score_remote:true",
      `server:${serverId}`,
      `available_scoreline_action:${agendaInstall.actionId}`,
    ].join("|"),
  };
}

export function corpHqAgendaFloodDrawRiskComponent<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
  boardTriageState: ReturnType<typeof semanticRuntimeCorpBoardTriage>,
): AiDecisionScoreComponent | undefined {
  if (boardTriageState.primary !== "force_scoreline_clock") return undefined;
  if (
    !boardTriageState.evidence.includes("corp_hq_agenda_flood_pressure:true")
  ) {
    return undefined;
  }
  const burstEconomyOperation = corpBurstEconomyOperationForAction(
    input,
    action,
    dependencies,
    actionSemanticCandidate,
  );
  const drawCards =
    action.type === "draw_card" ? 1 : (burstEconomyOperation?.drawCards ?? 0);
  if (drawCards <= 0) return undefined;
  return {
    key: "corp_hq_agenda_flood_draw_risk",
    label: "HQ-Flood-Draw-Risiko",
    value: -1800,
    reason: [
      "hq_agenda_flood:true",
      `draw_cards:${drawCards}`,
      "scoreline_clock_before_more_hq_cards:true",
    ].join("|"),
  };
}

function corpLegalActions(input: AiDecisionInput): LegalAction[] {
  return (input.legalActions ?? input.playerView.legalActions ?? []).filter(
    (action) => action.side === "corp",
  );
}

export function corpInputHasConcreteDevelopmentAction(
  input: AiDecisionInput,
  currentAction: LegalAction,
): boolean {
  const legalActions =
    input.legalActions ?? input.playerView.legalActions ?? [];
  return legalActions.some((candidate) => {
    if (candidate.actionId === currentAction.actionId) return false;
    if (candidate.side !== "corp") return false;
    return (
      candidate.type === "score_agenda" ||
      candidate.type === "advance_card" ||
      candidate.type === "rez_ice" ||
      (candidate.type === "install_card" &&
        (candidate.payload?.placement === "ice" ||
          candidate.payload?.placement === "root")) ||
      candidate.type === "play_operation"
    );
  });
}

export function corpLegalEconomyActionExists(input: AiDecisionInput): boolean {
  const legalActions =
    input.legalActions ?? input.playerView.legalActions ?? [];
  return legalActions.some(
    (candidate) =>
      candidate.side === "corp" && actionHasImmediateCreditGain(candidate),
  );
}

export function corpLegalCreditActionExists(
  input: AiDecisionInput,
  currentAction: LegalAction,
): boolean {
  const legalActions =
    input.legalActions ?? input.playerView.legalActions ?? [];
  return legalActions.some(
    (candidate) =>
      candidate !== currentAction &&
      candidate.side === "corp" &&
      actionHasImmediateCreditGain(candidate),
  );
}
