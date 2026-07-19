import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate";
import { actionProvidesCredits } from "../../actions/action-effect-classification";
import { rolesMatch } from "../role-match";
import { visibleCardDefinition } from "../card-definition-lookup";
import {
  visibleBreakerCardCanAddressIce,
  visibleBreakerRoles,
} from "../runner-visible-breaker-coverage";
import { semanticRuntimeCorpCentralPressureAssessment } from "../semantic-runtime-corp-central-pressure";
import { semanticRuntimeCorpEffectiveDefenseContext } from "../semantic-runtime-corp-effective-defense";
import { semanticRuntimeCorpCentralIceProfile } from "../semantic-runtime-corp-remote-score";
import { corpIcePlacementCandidateForAction } from "../corp-ice-placement/corp-ice-placement";
import type {
  CorpScoringWindowAssessment,
  CorpScoringWindowAgendaStealSeverity,
} from "../semantic-runtime-corp-scoring-window";
import { semanticRuntimeVisibleSourceCard } from "../visible-card-lookup";
import { corpStrategicKillLineFundingActive } from "../corp-visible-kill-line";
import type {
  CorpBoardTriage,
  CorpBoardTriageDependencies,
  CorpBoardTriageSeverity,
  ForcedScorelineClockPressure,
  ScoredLegalAction,
} from "./semantic-runtime-corp-board-triage-contracts";
import {
  actionBuildsScoreRemote,
  actionCandidateHasVisibleSignal,
  actionCreatesPurgeActionDebt,
  actionHasVisibleDrawSource,
  actionProvidesEconomy,
  actionServerIdForAction,
  corpBoardTriageRulesTextTokens,
  corpBoardTriageVisibleCardCoverageText,
  corpLegalActions,
  corpRemoteScoringStrategyWantsRemoteDevelopment,
  corpTriagePositiveNumber,
  corpTriageStrategicIntent,
  corpTriageVisibleAgendaPoints,
  corpTriageVisibleCardIsAgenda,
  existingReadyRemoteCanReceiveScoreline,
  inputWithOpponentDefaults,
  legalEconomyActionExists,
} from "./semantic-runtime-corp-board-triage-actions";

export function scoredLegalAction<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): ScoredLegalAction {
  const roles = dependencies.rolesForAction(input, action);
  return {
    action,
    roles,
    serverId: actionServerIdForAction(input, action),
    scoringWindow: dependencies.corpScoringWindowAssessment?.(
      input,
      action,
      roles,
    ),
    remoteRezFloor: dependencies.corpRemoteRezFloorAssessment(input, action),
    centralRezFloor: dependencies.corpCentralRezReserveAssessment(
      input,
      action,
    ),
  };
}

export function corpForcedScorelineClockPressure<TConsumer extends string>(
  input: AiDecisionInput,
  actions: readonly ScoredLegalAction[],
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): ForcedScorelineClockPressure | undefined {
  return (
    corpDeckoutAgendaFloodPressure(input, actions, dependencies) ??
    corpHqAgendaFloodScorelinePressure(input, actions, dependencies)
  );
}

export function corpActiveScorelineClockPressure<TConsumer extends string>(
  input: AiDecisionInput,
  actions: readonly ScoredLegalAction[],
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): ForcedScorelineClockPressure | undefined {
  const entries = actions.filter(
    (entry) =>
      activeScorelineClockEntryIsPlayable(
        input,
        entry,
        actions,
        dependencies,
      ) && !corpPunishPrimaryShouldDeferSpeculativeScoreline(input, entry),
  );
  const preferred = highestPriorityActiveScorelineEntry(entries);
  if (!preferred) return undefined;
  const targetServerId = preferred.serverId;
  const runnerAgendaPoints =
    corpTriagePositiveNumber(input.playerView.opponent?.agendaPoints) ?? 0;
  const agendaPointsAtRisk =
    corpTriagePositiveNumber(preferred.scoringWindow?.agendaPointsAtRisk) ?? 0;
  const severity =
    runnerAgendaPoints >= 5 ||
    preferred.scoringWindow?.agendaStealSeverity === "near_win" ||
    agendaPointsAtRisk >= 3
      ? "critical"
      : "high";
  return {
    severity,
    targetServerId,
    scoreRemoteServerId:
      targetServerId && targetServerId.startsWith("remote_")
        ? targetServerId
        : undefined,
    requiredRezFloor: scorelineRequiredRezFloor(input, preferred, dependencies),
    hqAgendaCount: input.playerView.own.gripOrHq.filter(
      corpTriageVisibleCardIsAgenda,
    ).length,
    hqAgendaPoints: input.playerView.own.gripOrHq
      .filter(corpTriageVisibleCardIsAgenda)
      .reduce((sum, card) => sum + corpTriageVisibleAgendaPoints(card), 0),
    evidence: [
      "corp_active_scoreline_clock:true",
      `corp_active_scoreline_action:${preferred.action.actionId}`,
      ...(targetServerId
        ? [`corp_active_scoreline_target:${targetServerId}`]
        : []),
      ...(preferred.action.type === "advance_card"
        ? ["corp_active_scoreline_kind:advance_existing_remote"]
        : ["corp_active_scoreline_kind:install_existing_ready_remote"]),
      ...(preferred.scoringWindow?.evidence ?? []).slice(0, 8),
    ],
  };
}

export function activeScorelineClockEntryIsPlayable<TConsumer extends string>(
  input: AiDecisionInput,
  entry: ScoredLegalAction,
  actions: readonly ScoredLegalAction[],
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): boolean {
  if (!entry.serverId || entry.serverId === "new_remote") return false;
  if (!entry.serverId.startsWith("remote_")) return false;
  if (!actionPushesConcreteAgendaScoreline(input, entry.action, dependencies)) {
    return false;
  }
  if (
    entry.action.type !== "advance_card" &&
    entry.action.type !== "install_card"
  ) {
    return false;
  }
  if (
    scoreRemoteNeedsProtection(input, entry, dependencies) ||
    scoreRemoteNeedsFunding(input, entry, actions, dependencies)
  ) {
    return false;
  }
  if (entry.remoteRezFloor?.blockedByFloor === true) return false;
  if (entry.action.type === "advance_card") {
    return (
      remoteServerHasVisibleScoreline(input, entry.serverId) &&
      scorelineEntryHasPlayableClockWindow(entry)
    );
  }
  return (
    entry.action.payload?.placement !== "ice" &&
    existingReadyRemoteCanReceiveScoreline(input, entry.serverId) &&
    scorelineEntryHasPlayableClockWindow(entry)
  );
}

export function scorelineEntryHasPlayableClockWindow(
  entry: ScoredLegalAction,
): boolean {
  const assessment = entry.scoringWindow;
  if (!assessment) return true;
  if (scoringWindowCanUseNoContestScoreWindow(assessment)) {
    return true;
  }
  if (
    assessment.windowKind === "unsafe" &&
    scoringWindowCanUseMissingCoverageScoreWindow(assessment)
  ) {
    return true;
  }
  if (
    assessment.recommendedNextStep === "build_remote_ice" ||
    assessment.recommendedNextStep === "gain_credit" ||
    assessment.corpCanRezRelevantIce === false ||
    assessment.corpCanRezFullPathWithDynamicReserve === false ||
    (assessment.dynamicProtectionWeaknessCount ?? 0) > 0
  ) {
    return false;
  }
  if (assessment.windowKind === "durable") return true;
  if (assessment.windowKind === "temporary_safe") {
    return (
      !assessment.runnerCanReachAccessBeforeScore &&
      !assessment.runnerCanContestBeforeScore &&
      (assessment.affordableDurableRelevantIceCount ?? 0) >= 1
    );
  }
  if (assessment.windowKind === "unsafe") {
    return scoringWindowCanUseTriageScoreWindow(assessment);
  }
  return false;
}

export function highestPriorityActiveScorelineEntry(
  entries: readonly ScoredLegalAction[],
): ScoredLegalAction | undefined {
  return [...entries].sort(
    (left, right) =>
      activeScorelineEntryPriority(right) - activeScorelineEntryPriority(left),
  )[0];
}

export function activeScorelineEntryPriority(entry: ScoredLegalAction): number {
  const actionBonus =
    entry.action.type === "advance_card"
      ? 220
      : entry.action.type === "install_card"
        ? 140
        : 0;
  const safetyBonus =
    entry.scoringWindow?.windowKind === "durable"
      ? 160
      : entry.scoringWindow?.windowKind === "temporary_safe"
        ? 120
        : entry.scoringWindow?.missingVisibleBreakerCoverage
          ? 80
          : 0;
  const serverBonus =
    entry.serverId && entry.serverId !== "new_remote" ? 90 : 0;
  return actionBonus + safetyBonus + serverBonus;
}

export function remoteServerHasVisibleScoreline(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  return (
    input.playerView.servers
      .find((server) => server.id === serverId)
      ?.root.some(
        (card) => card.known !== false && corpTriageVisibleCardIsAgenda(card),
      ) === true
  );
}

export function corpDeckoutAgendaFloodPressure<TConsumer extends string>(
  input: AiDecisionInput,
  actions: readonly ScoredLegalAction[],
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): ForcedScorelineClockPressure | undefined {
  const rdCount = corpTriagePositiveNumber(input.playerView.own.stackOrRdCount);
  if (rdCount === undefined || rdCount > 6) return undefined;

  const hqAgendaCards = input.playerView.own.gripOrHq.filter(
    corpTriageVisibleCardIsAgenda,
  );
  const hqAgendaCount = hqAgendaCards.length;
  const hqAgendaPoints = hqAgendaCards.reduce(
    (sum, card) => sum + corpTriageVisibleAgendaPoints(card),
    0,
  );
  const corpAgendaPoints =
    corpTriagePositiveNumber(input.playerView.own.agendaPoints) ?? 0;
  const pointsToWin =
    corpTriagePositiveNumber(input.playerView.agendaPointsToWin) ?? 7;
  const matchpointAgendaIds = new Set(
    hqAgendaCards
      .filter(
        (card) =>
          corpAgendaPoints + corpTriageVisibleAgendaPoints(card) >= pointsToWin,
      )
      .map((card) => card.instanceId),
  );
  const allScorelineEntries = actions.filter((entry) =>
    actionPushesConcreteAgendaScoreline(input, entry.action, dependencies),
  );
  const matchpointScorelineEntries = allScorelineEntries.filter(
    (entry) =>
      typeof entry.action.source === "string" &&
      matchpointAgendaIds.has(entry.action.source),
  );
  const lastViableDeckoutMatchpoint =
    rdCount <= 1 && matchpointScorelineEntries.length > 0;
  const agendaFlood = hqAgendaCount >= 2 || hqAgendaPoints >= 4;
  if (!agendaFlood && !lastViableDeckoutMatchpoint) return undefined;

  const scorelineEntries = lastViableDeckoutMatchpoint
    ? matchpointScorelineEntries
    : allScorelineEntries;
  if (scorelineEntries.length === 0) return undefined;

  const preferred = highestPriorityDeckoutScorelineEntry(scorelineEntries);
  const requiredRezFloor = preferred
    ? scorelineRequiredRezFloor(input, preferred, dependencies)
    : undefined;
  const targetServerId = preferred?.serverId;
  const severity =
    lastViableDeckoutMatchpoint ||
    rdCount <= 2 ||
    (rdCount <= 4 && hqAgendaPoints >= 6)
      ? "critical"
      : "high";
  return {
    severity,
    targetServerId,
    scoreRemoteServerId:
      targetServerId && targetServerId.startsWith("remote_")
        ? targetServerId
        : undefined,
    requiredRezFloor,
    hqAgendaCount,
    hqAgendaPoints,
    rdCount,
    evidence: [
      ...(agendaFlood ? ["corp_deckout_agenda_flood:true"] : []),
      `corp_rd_count:${rdCount}`,
      `corp_hq_agenda_count:${hqAgendaCount}`,
      `corp_hq_agenda_points:${hqAgendaPoints}`,
      ...(lastViableDeckoutMatchpoint
        ? [
            "corp_deckout_matchpoint_scoreline:true",
            "corp_deckout_last_viable_window:true",
            `corp_agenda_points:${corpAgendaPoints}`,
            `corp_points_to_win:${pointsToWin}`,
          ]
        : []),
      ...(targetServerId
        ? [`corp_forced_scoreline_target:${targetServerId}`]
        : []),
      ...(requiredRezFloor !== undefined
        ? [`corp_forced_scoreline_rez_floor:${requiredRezFloor}`]
        : []),
    ],
  };
}

export function corpHqAgendaFloodScorelinePressure<TConsumer extends string>(
  input: AiDecisionInput,
  actions: readonly ScoredLegalAction[],
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): ForcedScorelineClockPressure | undefined {
  const hqAgendaCards = input.playerView.own.gripOrHq.filter(
    corpTriageVisibleCardIsAgenda,
  );
  const hqAgendaCount = hqAgendaCards.length;
  const hqAgendaPoints = hqAgendaCards.reduce(
    (sum, card) => sum + corpTriageVisibleAgendaPoints(card),
    0,
  );
  if (
    hqAgendaCount <= 0 ||
    !corpHqAgendaFloodIsPressured(input, hqAgendaCount, hqAgendaPoints)
  ) {
    return undefined;
  }
  if (
    corpPunishPrimaryShouldPreferPunishOrCentralProtection(
      input,
      hqAgendaCount,
      hqAgendaPoints,
    )
  ) {
    return undefined;
  }

  const playableScorelineEntries = actions.filter(
    (entry) =>
      actionPushesConcreteAgendaScoreline(input, entry.action, dependencies) &&
      scorelineEntryCanRelieveHqAgendaFlood(
        input,
        entry,
        actions,
        dependencies,
      ),
  );
  const emergencyScorelineEntries =
    playableScorelineEntries.length > 0
      ? []
      : actions.filter(
          (entry) =>
            actionPushesConcreteAgendaScoreline(
              input,
              entry.action,
              dependencies,
            ) &&
            scorelineEntryCanEmergencyRelieveHqAgendaFlood(
              input,
              entry,
              actions,
              dependencies,
            ),
        );
  if (
    playableScorelineEntries.length === 0 &&
    emergencyScorelineEntries.length === 0
  ) {
    return undefined;
  }

  const emergencyRemoteConversion = playableScorelineEntries.length === 0;
  const preferred = highestPriorityDeckoutScorelineEntry(
    emergencyRemoteConversion
      ? emergencyScorelineEntries
      : playableScorelineEntries,
  );
  const requiredRezFloor = preferred
    ? scorelineRequiredRezFloor(input, preferred, dependencies)
    : undefined;
  const targetServerId = preferred?.serverId;
  const runnerAgendaPoints =
    corpTriagePositiveNumber(input.playerView.opponent?.agendaPoints) ?? 0;
  const severity =
    runnerAgendaPoints >= 5 || hqAgendaPoints >= 6 || hqAgendaCount >= 3
      ? "critical"
      : "high";
  const hqPressure = semanticRuntimeCorpCentralPressureAssessment(
    inputWithOpponentDefaults(input),
    "hq",
  );

  return {
    severity,
    targetServerId,
    scoreRemoteServerId:
      targetServerId && targetServerId.startsWith("remote_")
        ? targetServerId
        : undefined,
    requiredRezFloor,
    hqAgendaCount,
    hqAgendaPoints,
    evidence: [
      "corp_hq_agenda_flood_pressure:true",
      `corp_hq_agenda_count:${hqAgendaCount}`,
      `corp_hq_agenda_points:${hqAgendaPoints}`,
      `corp_runner_agenda_points:${runnerAgendaPoints}`,
      ...(targetServerId
        ? [`corp_forced_scoreline_target:${targetServerId}`]
        : []),
      ...(requiredRezFloor !== undefined
        ? [`corp_forced_scoreline_rez_floor:${requiredRezFloor}`]
        : []),
      ...(preferred &&
      scorelineEntryIsRelativeHqAgendaRelief(
        input,
        preferred,
        actions,
        dependencies,
      )
        ? ["corp_hq_agenda_relative_remote_relief:true"]
        : []),
      ...(emergencyRemoteConversion
        ? ["corp_hq_agenda_emergency_remote_conversion:true"]
        : []),
      ...hqPressure.evidence.slice(0, 6),
      ...(preferred?.scoringWindow?.evidence ?? []).slice(0, 8),
    ],
  };
}

export function corpHqAgendaFloodIsPressured(
  input: AiDecisionInput,
  hqAgendaCount: number,
  hqAgendaPoints: number,
): boolean {
  if (hqAgendaCount >= 2 || hqAgendaPoints >= 4) return true;
  const runnerAgendaPoints =
    corpTriagePositiveNumber(input.playerView.opponent?.agendaPoints) ?? 0;
  if (runnerAgendaPoints >= 3) return true;
  const hqPressure = semanticRuntimeCorpCentralPressureAssessment(
    inputWithOpponentDefaults(input),
    "hq",
  );
  return (
    hqPressure.hqAgendaExposure &&
    (hqPressure.successfulAccessEvents > 0 ||
      hqPressure.runOrAccessEvents >= 2 ||
      hqPressure.runnerRunCredits >= 6)
  );
}

export function scorelineEntryCanRelieveHqAgendaFlood(
  input: AiDecisionInput,
  entry: ScoredLegalAction,
  actions: readonly ScoredLegalAction[],
  dependencies: CorpBoardTriageDependencies<string>,
): boolean {
  if (!entry.serverId || entry.serverId === "new_remote") return false;
  if (!entry.serverId.startsWith("remote_")) return false;
  const assessment = entry.scoringWindow;
  if (!assessment) return false;
  if (
    assessment.recommendedNextStep === "gain_credit" ||
    assessment.corpCanRezRelevantIce === false ||
    assessment.corpCanRezFullPathWithDynamicReserve === false ||
    (assessment.dynamicProtectionWeaknessCount ?? 0) > 0
  ) {
    return false;
  }
  if (
    assessment.windowKind === "durable" ||
    assessment.windowKind === "temporary_safe"
  ) {
    return (
      !assessment.runnerCanReachAccessBeforeScore &&
      (assessment.affordableDurableRelevantIceCount ?? 0) >= 1
    );
  }
  return scorelineEntryIsRelativeHqAgendaRelief(
    input,
    entry,
    actions,
    dependencies,
  );
}

export function scorelineEntryCanEmergencyRelieveHqAgendaFlood(
  input: AiDecisionInput,
  entry: ScoredLegalAction,
  actions: readonly ScoredLegalAction[],
  dependencies: CorpBoardTriageDependencies<string>,
): boolean {
  const assessment = entry.scoringWindow;
  if (!assessment) return false;
  const serverId = entry.serverId;
  if (!serverId) return false;
  if (!existingRemoteCanCarryRelativeHqRelief(input, entry)) return false;
  if (
    concreteRemoteProtectionActionExists(input, actions, serverId, dependencies)
  ) {
    return false;
  }
  const pointsToWin =
    corpTriagePositiveNumber(input.playerView.agendaPointsToWin) ?? 7;
  const runnerAgendaPointsAfterSteal =
    corpTriagePositiveNumber(assessment.runnerAgendaPointsAfterSteal) ?? 0;
  if (scorelineEntryIsGameEndingAccessGift(entry)) {
    return false;
  }
  if (
    assessment.agendaStealSeverity !== "game_ending" &&
    assessment.agendaStealSeverity !== "near_win" &&
    runnerAgendaPointsAfterSteal < pointsToWin - 1
  ) {
    return false;
  }
  if (
    assessment.recommendedNextStep !== "gain_credit" &&
    entry.remoteRezFloor?.blockedByFloor !== true
  ) {
    return false;
  }
  const runnerAgendaPoints =
    corpTriagePositiveNumber(input.playerView.opponent?.agendaPoints) ?? 0;
  if (runnerAgendaPoints < 4 && runnerAgendaPointsAfterSteal < pointsToWin) {
    return false;
  }
  const hqPressure = semanticRuntimeCorpCentralPressureAssessment(
    inputWithOpponentDefaults(input),
    "hq",
  );
  const rdPressure = semanticRuntimeCorpCentralPressureAssessment(
    inputWithOpponentDefaults(input),
    "rd",
  );
  return (
    hqPressure.active ||
    rdPressure.active ||
    rdPressure.visibleMultiaccess ||
    rdPressure.successfulAccessEvents > 0
  );
}

export function scorelineEntryIsGameEndingAccessGift(
  entry: ScoredLegalAction,
): boolean {
  const assessment = entry.scoringWindow;
  if (!assessment) return false;
  if (assessment.scoreHorizon === "immediate") return false;
  if (assessment.agendaStealSeverity !== "game_ending") return false;
  if (
    !assessment.runnerCanReachAccessNow ||
    !assessment.agendaStealRelevantNow
  ) {
    return false;
  }
  return (
    assessment.windowKind === "unsafe" ||
    assessment.recommendedNextStep === "build_remote_ice" ||
    assessment.recommendedNextStep === "gain_credit" ||
    assessment.corpCanRezRelevantIce === false ||
    assessment.corpCanRezFullPathWithDynamicReserve === false ||
    (assessment.affordableDurableRelevantIceCount ?? 0) < 1
  );
}

export function scorelineEntryIsRelativeHqAgendaRelief(
  input: AiDecisionInput,
  entry: ScoredLegalAction,
  actions: readonly ScoredLegalAction[],
  dependencies: CorpBoardTriageDependencies<string>,
): boolean {
  const assessment = entry.scoringWindow;
  if (!entry.serverId || !entry.serverId.startsWith("remote_")) return false;
  if (!assessment) return false;
  const pointsToWin =
    corpTriagePositiveNumber(input.playerView.agendaPointsToWin) ?? 7;
  const runnerAgendaPointsAfterSteal =
    corpTriagePositiveNumber(assessment.runnerAgendaPointsAfterSteal) ?? 0;
  return (
    assessment.windowKind === "unsafe" &&
    assessment.agendaStealSeverity !== "game_ending" &&
    runnerAgendaPointsAfterSteal < pointsToWin &&
    assessment.recommendedNextStep !== "gain_credit" &&
    assessment.corpCanRezRelevantIce !== false &&
    assessment.corpCanRezFullPathWithDynamicReserve !== false &&
    (assessment.dynamicProtectionWeaknessCount ?? 0) === 0 &&
    (assessment.affordableDurableRelevantIceCount ?? 0) >= 1 &&
    existingRemoteCanCarryRelativeHqRelief(input, entry) &&
    !concreteRemoteProtectionActionExists(
      input,
      actions,
      entry.serverId,
      dependencies,
    )
  );
}

export function existingRemoteCanCarryRelativeHqRelief(
  input: AiDecisionInput,
  entry: ScoredLegalAction,
): boolean {
  if (!entry.serverId) return false;
  if (entry.action.type === "advance_card") {
    return remoteServerHasVisibleScoreline(input, entry.serverId);
  }
  return (
    entry.action.type === "install_card" &&
    entry.action.payload?.placement !== "ice" &&
    existingReadyRemoteCanReceiveScoreline(input, entry.serverId)
  );
}

export function concreteRemoteProtectionActionExists(
  input: AiDecisionInput,
  actions: readonly ScoredLegalAction[],
  serverId: string,
  dependencies: CorpBoardTriageDependencies<string>,
): boolean {
  return actions.some((entry) => {
    if (entry.serverId !== serverId) return false;
    if (
      entry.action.type === "install_card" &&
      entry.action.payload?.placement === "ice"
    ) {
      return installedIceProvidesConcreteRemoteScoreProtection(
        input,
        entry.action,
        serverId,
        dependencies,
      );
    }
    if (entry.action.type !== "rez_ice") return false;
    const defense = semanticRuntimeCorpEffectiveDefenseContext(
      input,
      entry.action,
      undefined,
      { actionCreditCost: dependencies.actionCreditCost },
    );
    return (
      defense?.isRezzableNow === true &&
      !defense.zeroEffectRisk &&
      defense.hasImmediateStopPotential
    );
  });
}

export function highestPriorityDeckoutScorelineEntry(
  entries: readonly ScoredLegalAction[],
): ScoredLegalAction | undefined {
  return [...entries].sort(
    (left, right) =>
      deckoutScorelineEntryPriority(right) -
      deckoutScorelineEntryPriority(left),
  )[0];
}

export function deckoutScorelineEntryPriority(
  entry: ScoredLegalAction,
): number {
  const existingRemoteBonus =
    entry.serverId && entry.serverId !== "new_remote" ? 180 : 0;
  const actionBonus =
    entry.action.type === "advance_card"
      ? 140
      : entry.action.type === "install_card"
        ? 100
        : 0;
  const safetyBonus =
    entry.scoringWindow?.windowKind === "durable"
      ? 100
      : entry.scoringWindow?.windowKind === "temporary_safe"
        ? 60
        : entry.scoringWindow?.recommendedNextStep === "gain_credit"
          ? 30
          : 0;
  return existingRemoteBonus + actionBonus + safetyBonus;
}

export function actionClosesScoreNow<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): boolean {
  if (action.type === "score_agenda") {
    return dependencies.corpScoreNowSafetyGate(input, action).allowed;
  }
  if (legalScoreActionExistsForSameSource(input, action)) return false;
  return (
    action.type === "advance_card" &&
    dependencies.corpAdvanceCompletesScore?.(input, action) === true
  );
}

export function actionKeepsSameTurnScoreCloseoutReachable<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): boolean {
  if (action.type !== "advance_card") return false;
  if (legalScoreActionExistsForSameSource(input, action)) return false;
  const sourceCard = semanticRuntimeVisibleSourceCard(input, action);
  if (!sourceCard || sourceCard.known === false) return false;
  const requirement = corpTriageVisibleAdvancementRequirement(sourceCard);
  if (requirement === undefined) return false;
  const counters =
    corpTriagePositiveNumber(sourceCard.advancementCounters) ?? 0;
  if (counters >= requirement) return false;

  const countersAfterCurrentAction = counters + 1;
  const additionalAdvancesNeeded = Math.max(
    0,
    requirement - countersAfterCurrentAction,
  );
  if (
    additionalAdvancesNeeded === 0 &&
    dependencies.corpAdvanceCompletesScore?.(input, action) !== true
  ) {
    return false;
  }

  const remainingClicks =
    input.playerView.own.clicks -
    Math.max(1, corpTriageActionClickCost(action));
  const remainingCredits =
    input.playerView.own.credits -
    Math.max(1, dependencies.actionCreditCost(action));
  return (
    remainingClicks >= additionalAdvancesNeeded &&
    remainingCredits >= additionalAdvancesNeeded
  );
}

export function actionKeepsSideSafeSameTurnScoreCloseout<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  entry: ScoredLegalAction,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): boolean {
  return actionKeepsSameTurnScoreCloseoutReachable(
    input,
    entry.action,
    dependencies,
  );
}

export function actionKeepsSideSafeSameTurnScoreCloseoutForAction<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): boolean {
  return actionKeepsSameTurnScoreCloseoutReachable(input, action, dependencies);
}

export function scoreNowCentralProtectionInterruptTriage<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  actions: readonly ScoredLegalAction[],
  scoreNow: ScoredLegalAction,
  currentCredits: number,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): CorpBoardTriage | undefined {
  const closeout = sameTurnScoreCloseoutResourceState(
    input,
    scoreNow.action,
    dependencies,
  );
  if (!closeout) return undefined;
  if (scoreNowCloseoutWinsGame(input, closeout.agendaPoints)) return undefined;
  if (closeout.agendaPoints > 1) return undefined;
  const runnerAgendaPoints =
    corpTriagePositiveNumber(input.playerView.opponent?.agendaPoints) ?? 0;
  if (runnerAgendaPoints < 3) return undefined;

  const pressureInput = inputWithOpponentDefaults(input);
  const rdPressure = semanticRuntimeCorpCentralPressureAssessment(
    pressureInput,
    "rd",
  );
  if (
    !centralPressureIsTriageAcute(pressureInput, rdPressure) ||
    centralTriageSeverity(pressureInput, rdPressure) !== "critical" ||
    !centralServerNeedsProtection(input, "rd")
  ) {
    return undefined;
  }

  const rdProtectionFloor = fundableCentralProtectionFloor(
    input,
    actions,
    "rd",
    dependencies,
  );
  if (!rdProtectionFloor) return undefined;
  const currentPlanCanProtect =
    currentCredits + Math.max(0, input.playerView.own.clicks - 1) >=
    rdProtectionFloor.requiredCredits;
  const afterCloseoutCanProtect =
    closeout.remainingCredits + Math.max(0, closeout.remainingClicks - 1) >=
    rdProtectionFloor.requiredCredits;
  if (!currentPlanCanProtect || afterCloseoutCanProtect) return undefined;

  const immediateProtection = concreteCentralProtectionActionExists(
    input,
    actions,
    "rd",
    dependencies,
  );
  if (immediateProtection) {
    return centralPressureTriage(rdPressure, "critical", currentCredits, [
      "corp_board_triage_score_now_deferred:critical_rd_protection",
      `corp_score_now_action:${scoreNow.action.actionId}`,
      `corp_score_now_agenda_points:${closeout.agendaPoints}`,
      `corp_score_now_remaining_credits:${closeout.remainingCredits}`,
      `corp_score_now_remaining_clicks:${closeout.remainingClicks}`,
      `corp_rd_protection_floor:${rdProtectionFloor.requiredCredits}`,
      `corp_runner_agenda_points:${runnerAgendaPoints}`,
    ]);
  }

  if (!legalEconomyActionExists(input)) return undefined;
  return {
    primary: "recover_economy",
    severity: "critical",
    targetServerId: "rd",
    requiredRezFloor: rdProtectionFloor.requiredCredits,
    currentCredits,
    evidence: [
      "corp_board_triage_primary:recover_economy",
      "corp_board_triage_score_now_deferred:critical_rd_rez_floor",
      `corp_score_now_action:${scoreNow.action.actionId}`,
      `corp_score_now_agenda_points:${closeout.agendaPoints}`,
      `corp_score_now_remaining_credits:${closeout.remainingCredits}`,
      `corp_score_now_remaining_clicks:${closeout.remainingClicks}`,
      `corp_rd_protection_floor:${rdProtectionFloor.requiredCredits}`,
      `corp_runner_agenda_points:${runnerAgendaPoints}`,
      ...rdPressure.evidence.slice(0, 8),
      ...rdProtectionFloor.evidence,
    ],
  };
}

export function sameTurnScoreCloseoutResourceState<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
):
  | {
      agendaPoints: number;
      remainingCredits: number;
      remainingClicks: number;
    }
  | undefined {
  const sourceCard = semanticRuntimeVisibleSourceCard(input, action);
  if (!sourceCard || sourceCard.known === false) return undefined;
  const agendaPoints = corpTriageVisibleAgendaPoints(sourceCard);
  if (agendaPoints <= 0) return undefined;

  if (action.type === "score_agenda") {
    return {
      agendaPoints,
      remainingCredits:
        input.playerView.own.credits - dependencies.actionCreditCost(action),
      remainingClicks:
        input.playerView.own.clicks -
        Math.max(1, corpTriageActionClickCost(action)),
    };
  }

  if (
    action.type !== "advance_card" ||
    !actionKeepsSameTurnScoreCloseoutReachable(input, action, dependencies)
  ) {
    return undefined;
  }
  const requirement = corpTriageVisibleAdvancementRequirement(sourceCard);
  if (requirement === undefined) return undefined;
  const counters =
    corpTriagePositiveNumber(sourceCard.advancementCounters) ?? 0;
  const countersAfterAction = counters + 1;
  const additionalAdvancesNeeded = Math.max(
    0,
    requirement - countersAfterAction,
  );
  const spentCredits =
    dependencies.actionCreditCost(action) + additionalAdvancesNeeded;
  const spentClicks =
    Math.max(1, corpTriageActionClickCost(action)) +
    additionalAdvancesNeeded +
    1;
  return {
    agendaPoints,
    remainingCredits: input.playerView.own.credits - spentCredits,
    remainingClicks: input.playerView.own.clicks - spentClicks,
  };
}

export function scoreNowCloseoutWinsGame(
  input: AiDecisionInput,
  agendaPoints: number,
): boolean {
  const pointsToWin =
    corpTriagePositiveNumber(input.playerView.agendaPointsToWin) ?? 7;
  const corpAgendaPoints =
    corpTriagePositiveNumber(input.playerView.own.agendaPoints) ?? 0;
  return corpAgendaPoints + agendaPoints >= pointsToWin;
}

export function fundableCentralProtectionFloor<TConsumer extends string>(
  input: AiDecisionInput,
  actions: readonly ScoredLegalAction[],
  serverId: "hq" | "rd",
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): { requiredCredits: number; evidence: string[] } | undefined {
  const candidates = actions
    .filter(
      (entry) =>
        entry.serverId === serverId &&
        entry.action.type === "install_card" &&
        entry.action.payload?.placement === "ice",
    )
    .map((entry) =>
      fundableCentralProtectionCandidate(
        input,
        entry.action,
        serverId,
        dependencies,
      ),
    )
    .filter(
      (
        candidate,
      ): candidate is { requiredCredits: number; evidence: string[] } =>
        candidate !== undefined,
    )
    .sort((left, right) => left.requiredCredits - right.requiredCredits);
  return candidates[0];
}

export function fundableCentralProtectionCandidate<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  serverId: "hq" | "rd",
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): { requiredCredits: number; evidence: string[] } | undefined {
  const source = semanticRuntimeVisibleSourceCard(input, action);
  if (!source || source.known === false) return undefined;
  const profile = semanticRuntimeCorpCentralIceProfile(source);
  if (!profile.hasAccessStop || profile.positionDependent) return undefined;
  const actionCost = Math.max(0, dependencies.actionCreditCost(action));
  const rezCost = corpTriagePositiveNumber(source.rezCost);
  if (rezCost === undefined) return undefined;
  return {
    requiredCredits: actionCost + rezCost,
    evidence: [
      `corp_central_protection_floor_server:${serverId}`,
      `corp_central_protection_floor_action:${action.actionId}`,
      `corp_central_protection_floor_credits:${actionCost + rezCost}`,
      `corp_central_protection_floor_rez_cost:${rezCost}`,
    ],
  };
}

export function legalScoreActionExistsForSameSource(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  const source = typeof action.source === "string" ? action.source : undefined;
  if (!source) return false;
  return corpLegalActions(input).some(
    (candidate) =>
      candidate.type === "score_agenda" &&
      candidate.side === "corp" &&
      candidate.source === source,
  );
}

export function corpTriageVisibleAdvancementRequirement(
  card: VisibleCard,
): number | undefined {
  return (
    corpTriagePositiveNumber(card.advancementRequirement) ??
    corpTriagePositiveNumber(
      visibleCardDefinition(card)?.advancementRequirement,
    )
  );
}

export function corpTriageActionClickCost(action: LegalAction): number {
  const costs = action.costs
    .map((cost) => cost.clicks)
    .filter((value): value is number => typeof value === "number");
  if (costs.length > 0) return costs.reduce((sum, value) => sum + value, 0);
  return action.type === "advance_card" ? 1 : 0;
}

export function highestPriorityScoreRemoteEntry(
  entries: readonly ScoredLegalAction[],
): ScoredLegalAction | undefined {
  return [...entries].sort(
    (left, right) =>
      scoreRemoteEntryPriority(right) - scoreRemoteEntryPriority(left),
  )[0];
}

export function scoreRemoteEntryPriority(entry: ScoredLegalAction): number {
  const assessment = entry.scoringWindow;
  if (!assessment) return 0;
  const severity =
    assessment.agendaStealSeverity === "game_ending"
      ? 400
      : assessment.agendaStealSeverity === "near_win"
        ? 300
        : assessment.agendaStealSeverity === "normal"
          ? 220
          : 100;
  const existingRemoteBonus =
    entry.serverId && entry.serverId !== "new_remote" ? 90 : 0;
  const concreteScorelineBonus =
    entry.action.type === "advance_card" ||
    (entry.action.type === "install_card" &&
      entry.action.payload?.placement !== "ice" &&
      entry.serverId !== "new_remote")
      ? 60
      : 0;
  const contestBonus =
    assessment.runnerCanContestBeforeScore ||
    assessment.runnerCanReachAccessBeforeScore
      ? 50
      : 0;
  return severity + existingRemoteBonus + concreteScorelineBonus + contestBonus;
}

export function scoreRemoteNeedsFunding<TConsumer extends string>(
  input: AiDecisionInput,
  entry: ScoredLegalAction,
  actions: readonly ScoredLegalAction[],
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): boolean {
  const assessment = entry.scoringWindow;
  if (!assessment) return false;
  if (newRemoteScoreRemoteWouldSprawl(input, entry)) return false;
  if (
    !scoreRemoteTriageEntryCanDriveSafety(input, entry, dependencies) &&
    !remoteServerHasVisibleScoreline(input, entry.serverId ?? "")
  ) {
    return false;
  }
  if (assessment.windowKind === "none") return false;
  if (
    existingScoreRemoteNeedsFundingBeforeProtection(
      input,
      entry,
      actions,
      dependencies,
    ) &&
    !scoringWindowCanUseTriageScoreWindow(assessment)
  ) {
    return true;
  }
  if (assessment.recommendedNextStep === "build_remote_ice") {
    return false;
  }
  if (entry.remoteRezFloor?.blockedByFloor === true) {
    return true;
  }
  if (assessment.recommendedNextStep === "gain_credit") {
    return scoreRemoteHasUnmetFundingNeed(input, entry, dependencies);
  }
  return (
    assessment.windowKind === "unsafe" &&
    assessment.runnerCanContestBeforeScore &&
    assessment.corpCanRezRelevantIce === false
  );
}

export function scoreRemoteHasUnmetFundingNeed(
  input: AiDecisionInput,
  entry: ScoredLegalAction,
  dependencies: CorpBoardTriageDependencies<string>,
): boolean {
  const assessment = entry.scoringWindow;
  if (!assessment) return false;
  if (
    assessment.corpCanRezRelevantIce === false ||
    assessment.corpCanRezFullPathWithDynamicReserve === false
  ) {
    return true;
  }
  const evidenceFloor = scorelineRequiredRezFloorFromScoringWindowEvidence(
    input,
    entry,
    dependencies,
  );
  if (
    evidenceFloor !== undefined &&
    input.playerView.own.credits < evidenceFloor
  ) {
    return true;
  }
  const requiredRezFloor = corpTriagePositiveNumber(
    assessment.dynamicProtectionReserve,
  );
  if (requiredRezFloor === undefined) return false;
  return input.playerView.own.credits < requiredRezFloor;
}

export function scorelineRequiredRezFloor<TConsumer extends string>(
  input: AiDecisionInput,
  entry: ScoredLegalAction,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): number | undefined {
  const dynamicReserve = corpTriagePositiveNumber(
    entry.scoringWindow?.dynamicProtectionReserve,
  );
  if (dynamicReserve !== undefined && dynamicReserve > 0) {
    return dynamicReserve;
  }
  if (entry.remoteRezFloor?.blockedByFloor !== true) {
    const evidenceFloor = scorelineRequiredRezFloorFromScoringWindowEvidence(
      input,
      entry,
      dependencies,
    );
    if (evidenceFloor !== undefined) return evidenceFloor;
    return dynamicReserve !== undefined && dynamicReserve > 0
      ? dynamicReserve
      : undefined;
  }
  const requiredAfterAction = corpTriagePositiveNumber(
    entry.remoteRezFloor.requiredCreditsAfterAction,
  );
  if (requiredAfterAction !== undefined) {
    return (
      requiredAfterAction +
      Math.max(0, dependencies.actionCreditCost(entry.action))
    );
  }
  const rezFloor = corpTriagePositiveNumber(entry.remoteRezFloor.rezFloor);
  if (rezFloor !== undefined && rezFloor > 0) {
    return Math.max(input.playerView.own.credits + 1, rezFloor);
  }
  return input.playerView.own.credits + 1;
}

export function scoreRemoteRequiredRezFloor<TConsumer extends string>(
  input: AiDecisionInput,
  actions: readonly ScoredLegalAction[],
  entry: ScoredLegalAction,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): number | undefined {
  const scorelineFloor = scorelineRequiredRezFloor(input, entry, dependencies);
  const protectionFloor = sameTargetProtectionInstallRezFloor(
    input,
    actions,
    entry.serverId,
    dependencies,
  );
  const floors = [scorelineFloor, protectionFloor].filter(
    (value): value is number => value !== undefined && value > 0,
  );
  return floors.length > 0 ? Math.max(...floors) : undefined;
}

export function scorelineRequiredRezFloorFromScoringWindowEvidence<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  entry: ScoredLegalAction,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): number | undefined {
  const assessment = entry.scoringWindow;
  if (!assessment) return undefined;
  if (
    assessment.recommendedNextStep !== "gain_credit" &&
    assessment.corpCanRezRelevantIce !== false &&
    assessment.corpCanRezFullPathWithDynamicReserve !== false
  ) {
    return undefined;
  }
  const minRelevantRezCost = scoringWindowEvidenceNumber(
    assessment,
    "remote_rez_budget:min_relevant_rez_cost:",
  );
  const fullPathWithDynamicReserve = scoringWindowEvidenceNumber(
    assessment,
    "remote_rez_budget:full_relevant_path_with_dynamic_reserve:",
  );
  const fullPathRezCost = scoringWindowEvidenceNumber(
    assessment,
    "remote_rez_budget:full_relevant_path_rez_cost:",
  );
  const preExposureReserve =
    scoringWindowEvidenceNumber(
      assessment,
      "remote_rez_budget:pre_exposure_advancement_credit_reserve:",
    ) ?? 0;
  const actionCost = Math.max(0, dependencies.actionCreditCost(entry.action));
  const floor =
    assessment.corpCanRezRelevantIce === false
      ? minRelevantRezCost
      : assessment.corpCanRezFullPathWithDynamicReserve === false
        ? (fullPathWithDynamicReserve ?? fullPathRezCost ?? minRelevantRezCost)
        : assessment.recommendedNextStep === "gain_credit"
          ? (fullPathWithDynamicReserve ??
            fullPathRezCost ??
            minRelevantRezCost)
          : minRelevantRezCost;
  if (floor === undefined || floor <= 0) return undefined;
  return Math.max(
    input.playerView.own.credits + 1,
    floor + actionCost + preExposureReserve,
  );
}

export function sameTargetProtectionInstallRezFloor<TConsumer extends string>(
  input: AiDecisionInput,
  actions: readonly ScoredLegalAction[],
  serverId: string | undefined,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): number | undefined {
  if (!serverId) return undefined;
  const candidates = actions
    .filter(
      (entry) =>
        entry.serverId === serverId &&
        entry.action.type === "install_card" &&
        entry.action.payload?.placement === "ice",
    )
    .map((entry) => {
      const source = semanticRuntimeVisibleSourceCard(input, entry.action);
      const rezCost =
        source && source.known !== false
          ? corpTriagePositiveNumber(source.rezCost)
          : undefined;
      if (rezCost === undefined) return undefined;
      return rezCost + Math.max(0, dependencies.actionCreditCost(entry.action));
    })
    .filter((value): value is number => value !== undefined && value > 0)
    .sort((left, right) => left - right);
  return candidates[0];
}

export function scoringWindowEvidenceNumber(
  assessment: CorpScoringWindowAssessment,
  prefix: string,
): number | undefined {
  const entry = assessment.evidence.find((value) => value.startsWith(prefix));
  if (!entry) return undefined;
  const rawValue = entry.slice(prefix.length);
  const parsed = Number.parseFloat(rawValue);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function existingScoreRemoteNeedsFundingBeforeProtection(
  input: AiDecisionInput,
  entry: ScoredLegalAction,
  actions: readonly ScoredLegalAction[],
  dependencies: CorpBoardTriageDependencies<string>,
): boolean {
  const assessment = entry.scoringWindow;
  if (!assessment) return false;
  const reserveFloorCandidate = corpTriagePositiveNumber(
    assessment.dynamicProtectionReserve,
  );
  const explicitReserveFloor =
    reserveFloorCandidate !== undefined && reserveFloorCandidate > 0
      ? reserveFloorCandidate
      : undefined;
  const belowExplicitReserve =
    explicitReserveFloor !== undefined &&
    input.playerView.own.credits < explicitReserveFloor;
  const brokeFullPathAtLowCredits =
    explicitReserveFloor === undefined &&
    assessment.corpCanRezFullPathWithDynamicReserve === false &&
    input.playerView.own.credits <= 2;
  const requiredEvidenceFloor =
    scorelineRequiredRezFloorFromScoringWindowEvidence(
      input,
      entry,
      dependencies,
    );
  const belowFullPathEvidenceFloor =
    explicitReserveFloor === undefined &&
    requiredEvidenceFloor !== undefined &&
    input.playerView.own.credits < requiredEvidenceFloor &&
    assessment.corpCanRezRelevantIce !== false &&
    assessment.corpCanRezFullPathWithDynamicReserve === false &&
    assessment.runnerCanContestBeforeScore !== true &&
    assessment.runnerCanReachAccessBeforeScore !== true;
  const protectionInstallFloor = sameTargetProtectionInstallRezFloor(
    input,
    actions,
    entry.serverId,
    dependencies,
  );
  const belowProtectionInstallFloor =
    assessment.recommendedNextStep === "build_remote_ice" &&
    protectionInstallFloor !== undefined &&
    input.playerView.own.credits < protectionInstallFloor &&
    assessment.runnerCanContestBeforeScore !== true &&
    assessment.runnerCanReachAccessBeforeScore !== true;
  return (
    entry.serverId !== undefined &&
    entry.serverId !== "new_remote" &&
    entry.serverId.startsWith("remote_") &&
    (belowExplicitReserve ||
      brokeFullPathAtLowCredits ||
      belowFullPathEvidenceFloor ||
      belowProtectionInstallFloor)
  );
}

export function scoreRemoteNeedsProtection<TConsumer extends string>(
  input: AiDecisionInput,
  entry: ScoredLegalAction,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): boolean {
  const assessment = entry.scoringWindow;
  if (!assessment) return false;
  if (newRemoteScoreRemoteWouldSprawl(input, entry)) return false;
  if (
    !scoreRemoteTriageEntryCanDriveSafety(input, entry, dependencies) &&
    !remoteServerHasVisibleScoreline(input, entry.serverId ?? "")
  ) {
    return false;
  }
  if (assessment.recommendedNextStep === "build_remote_ice") {
    return !scoringWindowCanUseTriageScoreWindow(assessment);
  }
  if (assessment.windowKind === "unsafe") {
    return !scoringWindowCanUseTriageScoreWindow(assessment);
  }
  if (assessment.windowKind !== "temporary_safe") return false;
  return (
    assessment.runnerCanContestBeforeScore ||
    assessment.runnerCanReachAccessBeforeScore ||
    assessment.agendaStealSeverity === "near_win" ||
    assessment.agendaStealSeverity === "game_ending" ||
    assessment.corpCanRezFullPathWithDynamicReserve === false ||
    (assessment.affordableDurableRelevantIceCount ?? 0) === 0 ||
    (assessment.dynamicProtectionWeaknessCount ?? 0) > 0
  );
}

export function newRemoteScoreRemoteWouldSprawl(
  input: AiDecisionInput,
  entry: ScoredLegalAction,
): boolean {
  return (
    entry.serverId === "new_remote" && existingScoreRemoteOutletExists(input)
  );
}

export function scoringWindowCanUseMissingCoverageScoreWindow(
  assessment: CorpScoringWindowAssessment,
): boolean {
  return (
    assessment.missingVisibleBreakerCoverage &&
    !assessment.runnerCanReachAccessNow &&
    !assessment.runnerCanContestBeforeScore &&
    !assessment.runnerCanReachAccessBeforeScore &&
    assessment.agendaStealSeverity !== "game_ending" &&
    assessment.corpCanRezRelevantIce !== false &&
    assessment.corpCanRezFullPathWithDynamicReserve !== false &&
    (assessment.affordableDurableRelevantIceCount ?? 0) >= 1 &&
    (assessment.dynamicProtectionWeaknessCount ?? 0) === 0
  );
}

export function scoringWindowCanUseNoContestScoreWindow(
  assessment: CorpScoringWindowAssessment,
): boolean {
  return (
    !assessment.runnerCanContestNow &&
    !assessment.runnerCanReachAccessNow &&
    !assessment.agendaStealRelevantNow &&
    !assessment.runnerCanContestBeforeScore &&
    !assessment.runnerCanReachAccessBeforeScore &&
    !assessment.agendaStealRelevantBeforeScore &&
    assessment.agendaStealSeverity !== "game_ending" &&
    assessment.corpCanRezRelevantIce !== false &&
    (assessment.affordableDurableRelevantIceCount ?? 0) >= 1 &&
    (assessment.dynamicProtectionWeaknessCount ?? 0) === 0
  );
}

export function scoringWindowCanUseTriageScoreWindow(
  assessment: CorpScoringWindowAssessment,
): boolean {
  return (
    scoringWindowCanUseMissingCoverageScoreWindow(assessment) ||
    scoringWindowCanUseNoContestScoreWindow(assessment)
  );
}

export function existingScoreRemoteOutletExists(
  input: AiDecisionInput,
): boolean {
  return input.playerView.servers.some(
    (server) =>
      server.id.startsWith("remote_") &&
      (server.root.some(
        (card) => card.known !== false && corpTriageVisibleCardIsAgenda(card),
      ) ||
        existingReadyRemoteCanReceiveScoreline(input, server.id)),
  );
}

export function triageSeverityFromScoringWindow(
  assessment: CorpScoringWindowAssessment,
): CorpBoardTriageSeverity {
  return agendaSeverityToTriageSeverity(assessment.agendaStealSeverity);
}

export function centralPressureTriage(
  centralPressure: ReturnType<
    typeof semanticRuntimeCorpCentralPressureAssessment
  >,
  severity: CorpBoardTriageSeverity,
  currentCredits: number,
  extraEvidence: readonly string[] = [],
): CorpBoardTriage {
  return {
    primary: centralPressure.serverId === "hq" ? "protect_hq" : "protect_rd",
    severity,
    targetServerId: centralPressure.serverId,
    currentCredits,
    evidence: [
      `corp_board_triage_primary:protect_${centralPressure.serverId}`,
      ...extraEvidence,
      ...centralPressure.evidence,
    ],
  };
}

export function agendaSeverityToTriageSeverity(
  severity: CorpScoringWindowAgendaStealSeverity | undefined,
): CorpBoardTriageSeverity {
  if (severity === "game_ending") return "critical";
  if (severity === "near_win") return "high";
  if (severity === "normal") return "high";
  return "medium";
}

export function centralTriageSeverity(
  input: AiDecisionInput,
  pressure: ReturnType<typeof semanticRuntimeCorpCentralPressureAssessment>,
): CorpBoardTriageSeverity {
  if (
    pressure.serverId === "rd" &&
    pressure.successfulAccessEvents >= 2 &&
    (pressure.visibleVirusPressure ||
      pressure.visibleMultiaccess ||
      pressure.eventMultiaccess ||
      pressure.runOrAccessEvents >= 6)
  ) {
    return "critical";
  }
  if (
    input.playerView.opponent.agendaPoints >= 5 &&
    (pressure.hqAgendaExposure ||
      pressure.visibleMultiaccess ||
      pressure.visibleVirusPressure ||
      pressure.eventMultiaccess ||
      pressure.successfulAccessEvents > 0)
  ) {
    return "critical";
  }
  if (pressure.hqAgendaExposure || pressure.pressure >= 0.7) return "high";
  return "medium";
}

export function centralPressureIsTriageAcute(
  input: AiDecisionInput,
  pressure: ReturnType<typeof semanticRuntimeCorpCentralPressureAssessment>,
): boolean {
  if (!pressure.active) return false;
  const runnerNearWin = input.playerView.opponent.agendaPoints >= 5;
  const liveAccessSignal =
    pressure.visibleMultiaccess ||
    pressure.visibleVirusPressure ||
    pressure.eventMultiaccess ||
    pressure.successfulAccessEvents > 0 ||
    pressure.runOrAccessEvents >= 2 ||
    pressure.runnerRunCredits >= 6;
  if (
    pressure.serverId === "rd" &&
    pressure.visibleVirusPressure &&
    pressure.runOrAccessEvents > 0
  ) {
    return true;
  }
  if (pressure.hqAgendaExposure) return runnerNearWin || liveAccessSignal;
  return liveAccessSignal || pressure.pressure >= 0.7;
}

export function centralPressureShouldDriveTriage<TConsumer extends string>(
  input: AiDecisionInput,
  actions: readonly ScoredLegalAction[],
  pressure: ReturnType<typeof semanticRuntimeCorpCentralPressureAssessment>,
  severity: CorpBoardTriageSeverity,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): boolean {
  const serverId = pressure.serverId;
  if (serverId !== "hq" && serverId !== "rd") return false;
  const needsProtection = centralServerNeedsProtection(input, serverId);
  const hasProtectionAction = concreteCentralProtectionActionExists(
    input,
    actions,
    serverId,
    dependencies,
  );
  if (severity === "critical") {
    if (needsProtection && hasProtectionAction) return true;
    const hasScoreRemoteDevelopment =
      concreteScoreRemoteDevelopmentActionExists(actions);
    if (!hasScoreRemoteDevelopment) return hasProtectionAction;
    return (
      hasProtectionAction &&
      !corpRemoteScoringStrategyWantsRemoteDevelopment(input)
    );
  }
  if (needsProtection && hasProtectionAction) return true;
  const hasScoreRemoteDevelopment =
    concreteScoreRemoteDevelopmentActionExists(actions);
  if (!hasScoreRemoteDevelopment) return true;
  return !corpRemoteScoringStrategyWantsRemoteDevelopment(input);
}

export function highestPriorityTriageCentralPressure(
  input: AiDecisionInput,
): ReturnType<typeof semanticRuntimeCorpCentralPressureAssessment> | undefined {
  const hqPressure = semanticRuntimeCorpCentralPressureAssessment(input, "hq");
  const rdPressure = semanticRuntimeCorpCentralPressureAssessment(input, "rd");
  const acuteHqPressure = centralPressureIsTriageAcute(input, hqPressure)
    ? hqPressure
    : undefined;
  const acuteRdPressure = centralPressureIsTriageAcute(input, rdPressure)
    ? rdPressure
    : undefined;
  if (acuteHqPressure && acuteRdPressure) {
    if (centralTriageSeverity(input, acuteRdPressure) === "critical") {
      return acuteRdPressure;
    }
    return acuteHqPressure.pressure >= acuteRdPressure.pressure ||
      acuteHqPressure.hqAgendaExposure
      ? acuteHqPressure
      : acuteRdPressure;
  }
  return acuteHqPressure ?? acuteRdPressure;
}

export function concreteScoreRemoteDevelopmentActionExists(
  actions: readonly ScoredLegalAction[],
): boolean {
  return actions.some((entry) => actionBuildsScoreRemote(entry));
}

export function corpRemoteScoringStrategyEvidence(
  input: AiDecisionInput,
): string[] {
  return corpRemoteScoringStrategyWantsRemoteDevelopment(input)
    ? ["corp_board_triage_deck_strategy:remote_score_development"]
    : [];
}

export function corpTriageIsPunishPrimary(input: AiDecisionInput): boolean {
  const intent = corpTriageStrategicIntent(input);
  return (
    intent?.primaryWinIntent === "corp.punish_runner" ||
    ((intent?.punishPlan?.length ?? 0) > 0 &&
      intent?.scorePlan?.some((plan) =>
        ["corp.rush_scoreline", "corp.fast_advance_scoreline"].includes(plan),
      ) !== true)
  );
}

export function corpPunishPrimaryShouldPreferPunishOrCentralProtection(
  input: AiDecisionInput,
  hqAgendaCount: number,
  hqAgendaPoints: number,
): boolean {
  if (!corpTriageIsPunishPrimary(input)) return false;
  const runnerAgendaPoints =
    corpTriagePositiveNumber(input.playerView.opponent?.agendaPoints) ?? 0;
  return runnerAgendaPoints < 5 && hqAgendaPoints < 6 && hqAgendaCount < 3;
}

export function corpPunishPrimaryShouldDeferSpeculativeScoreline(
  input: AiDecisionInput,
  entry: ScoredLegalAction,
): boolean {
  if (!corpTriageIsPunishPrimary(input)) return false;
  if (entry.action.type !== "install_card") return false;
  if (entry.action.payload?.placement === "ice") return false;
  if (entry.scoringWindow?.scoreHorizon === "immediate") return false;
  return true;
}

export function preScoreCentralProtectionTriage<TConsumer extends string>(
  input: AiDecisionInput,
  actions: readonly ScoredLegalAction[],
  currentCredits: number,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): CorpBoardTriage | undefined {
  const pressureInput = inputWithOpponentDefaults(input);
  const rdPressure = semanticRuntimeCorpCentralPressureAssessment(
    pressureInput,
    "rd",
  );
  const rdSeverity = centralTriageSeverity(pressureInput, rdPressure);
  if (
    centralPressureIsTriageAcute(pressureInput, rdPressure) &&
    rdSeverity === "critical" &&
    centralServerNeedsProtection(input, "rd") &&
    concreteCentralProtectionActionExists(input, actions, "rd", dependencies)
  ) {
    const activeScorelineClock = corpActiveScorelineClockPressure(
      input,
      actions,
      dependencies,
    );
    if (
      activeScorelineClock &&
      !centralPressureMustInterruptActiveScoreline(
        pressureInput,
        rdPressure,
        activeScorelineClock,
      )
    ) {
      return undefined;
    }
    return centralPressureTriage(rdPressure, rdSeverity, currentCredits, [
      "corp_board_triage_central_override:pre_score_rd_exposure",
    ]);
  }

  if (
    centralPressureIsTriageAcute(pressureInput, rdPressure) &&
    rdPressure.recentSuccessfulAccessEvents >= 2 &&
    centralServerNeedsProtection(input, "rd") &&
    speculativeRemoteLayeringWouldDisplaceCentralProtection(
      input,
      actions,
      dependencies,
    )
  ) {
    return centralPressureTriage(rdPressure, rdSeverity, currentCredits, [
      "corp_board_triage_central_override:first_layer_before_speculative_remote",
      "corp_board_triage_repeated_central_access:true",
    ]);
  }

  const hqAgendaCards = input.playerView.own.gripOrHq.filter(
    corpTriageVisibleCardIsAgenda,
  );
  const hqAgendaCount = hqAgendaCards.length;
  const hqAgendaPoints = hqAgendaCards.reduce(
    (sum, card) => sum + corpTriageVisibleAgendaPoints(card),
    0,
  );
  const runnerAgendaPoints =
    corpTriagePositiveNumber(input.playerView.opponent?.agendaPoints) ?? 0;
  if (
    hqAgendaCount <= 0 ||
    !centralServerNeedsProtection(input, "hq") ||
    !concreteCentralProtectionActionExists(
      input,
      actions,
      "hq",
      dependencies,
    ) ||
    !unprotectedHqAgendaExposureRequiresPreScoreProtection(
      pressureInput,
      hqAgendaCount,
      hqAgendaPoints,
      runnerAgendaPoints,
    )
  ) {
    return undefined;
  }

  const hqPressure = semanticRuntimeCorpCentralPressureAssessment(
    pressureInput,
    "hq",
  );
  const severity =
    runnerAgendaPoints >= 5 || hqAgendaPoints >= 4 || hqAgendaCount >= 3
      ? "critical"
      : "high";
  return {
    primary: "protect_hq",
    severity,
    targetServerId: "hq",
    currentCredits,
    evidence: [
      "corp_board_triage_primary:protect_hq",
      "corp_board_triage_central_override:unprotected_hq_before_runner_exposure",
      "corp_board_triage_no_score_now_before_runner_exposure:true",
      `corp_hq_agenda_count:${hqAgendaCount}`,
      `corp_hq_agenda_points:${hqAgendaPoints}`,
      `corp_runner_agenda_points:${runnerAgendaPoints}`,
      `corp_hq_ice_count:${centralServerIceCount(input, "hq")}`,
      `corp_hq_effective_stop_ice:${centralServerHasEffectiveStopIce(
        input,
        "hq",
      )}`,
      ...hqPressure.evidence.slice(0, 8),
    ],
  };
}

export function speculativeRemoteLayeringWouldDisplaceCentralProtection<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  actions: readonly ScoredLegalAction[],
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): boolean {
  return actions.some((entry) => {
    if (
      entry.action.type !== "install_card" ||
      entry.action.payload?.placement === "ice" ||
      (!entry.serverId?.startsWith("remote_") &&
        entry.serverId !== "new_remote") ||
      entry.scoringWindow?.scoreHorizon === "immediate"
    ) {
      return false;
    }
    if (entry.serverId === "new_remote") {
      return (
        entry.scoringWindow?.windowKind === "unsafe" &&
        ((entry.scoringWindow.agendaPointsAtRisk ?? 0) > 0 ||
          entry.scoringWindow.agendaStealRelevantBeforeScore)
      );
    }
    if (
      !actionPushesConcreteAgendaScoreline(
        input,
        entry.action,
        dependencies,
        entry.roles,
      )
    ) {
      return false;
    }
    const server = input.playerView.servers.find(
      (candidate) => candidate.id === entry.serverId,
    );
    if (!server || server.root.length > 0 || server.ice.length === 0) {
      return false;
    }
    return scoreRemoteNeedsProtection(input, entry, dependencies);
  });
}

export function centralPressureMustInterruptActiveScoreline(
  input: AiDecisionInput,
  pressure: ReturnType<typeof semanticRuntimeCorpCentralPressureAssessment>,
  activeScorelineClock: ForcedScorelineClockPressure,
): boolean {
  const runnerAgendaPoints =
    corpTriagePositiveNumber(input.playerView.opponent?.agendaPoints) ?? 0;
  if (runnerAgendaPoints >= 5) return true;
  if (
    pressure.visibleMultiaccess ||
    pressure.visibleVirusPressure ||
    pressure.eventMultiaccess
  ) {
    return true;
  }
  if (
    pressure.serverId === "rd" &&
    pressure.recentSuccessfulAccessEvents >= 2 &&
    activeScorelineClock.targetServerId === "new_remote"
  ) {
    return true;
  }
  const rdCount =
    corpTriagePositiveNumber(input.playerView.own.stackOrRdCount) ?? 0;
  return pressure.serverId === "rd" && rdCount <= 5;
}

export function centralServerNeedsProtection(
  input: AiDecisionInput,
  serverId: "hq" | "rd",
): boolean {
  return !centralServerHasEffectiveStopIce(input, serverId);
}

export function centralServerIceCount(
  input: AiDecisionInput,
  serverId: "hq" | "rd",
): number {
  return (
    input.playerView.servers?.find((server) => server.id === serverId)?.ice
      .length ?? 0
  );
}

export function centralServerHasEffectiveStopIce(
  input: AiDecisionInput,
  serverId: "hq" | "rd",
): boolean {
  const server = input.playerView.servers?.find(
    (candidate) => candidate.id === serverId,
  );
  return (
    server?.ice.some((ice) => centralIceIsEffectiveAccessStop(input, ice)) ===
    true
  );
}

export function centralIceIsEffectiveAccessStop(
  input: AiDecisionInput,
  ice: VisibleCard,
): boolean {
  if (ice.known === false) return true;
  const profile = semanticRuntimeCorpCentralIceProfile(ice);
  if (!profile.hasAccessStop || profile.positionDependent) return false;
  if (ice.rezzed === true && runnerHasVisibleCoverageForIce(input, ice)) {
    return false;
  }
  return true;
}

export function runnerHasVisibleCoverageForIce(
  input: AiDecisionInput,
  ice: VisibleCard,
): boolean {
  return (input.playerView.opponent.rig ?? []).some(
    (card) =>
      card.known !== false &&
      card.type === "program" &&
      visibleBreakerCardCanAddressIce(card, ice, {
        visibleBreakerRoles,
        visibleCardText: corpBoardTriageVisibleCardCoverageText,
      }),
  );
}

export function concreteCentralProtectionActionExists<TConsumer extends string>(
  input: AiDecisionInput,
  actions: readonly ScoredLegalAction[],
  serverId: "hq" | "rd",
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): boolean {
  return actions.some((entry) =>
    centralProtectionEntryIsConcrete(input, entry, serverId, dependencies),
  );
}

export function centralProtectionEntryIsConcrete<TConsumer extends string>(
  input: AiDecisionInput,
  entry: ScoredLegalAction,
  serverId: "hq" | "rd",
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): boolean {
  if (entry.serverId !== serverId) return false;
  if (entry.action.type === "install_card") {
    return (
      entry.action.payload?.placement === "ice" &&
      installedIceProvidesConcreteCentralProtection(
        input,
        entry.action,
        serverId,
        dependencies,
      )
    );
  }
  if (entry.action.type !== "rez_ice") return false;
  const defense = semanticRuntimeCorpEffectiveDefenseContext(
    input,
    entry.action,
    undefined,
    { actionCreditCost: dependencies.actionCreditCost },
  );
  return (
    defense?.isRezzableNow === true &&
    !defense.zeroEffectRisk &&
    (defense.hasImmediateStopPotential || defense.hasVisibleBreakerTax)
  );
}

export function unprotectedHqAgendaExposureRequiresPreScoreProtection(
  input: AiDecisionInput,
  hqAgendaCount: number,
  hqAgendaPoints: number,
  runnerAgendaPoints: number,
): boolean {
  if (hqAgendaCount >= 2 || hqAgendaPoints >= 3 || runnerAgendaPoints >= 4) {
    return true;
  }
  const hqPressure = semanticRuntimeCorpCentralPressureAssessment(input, "hq");
  return (
    hqPressure.runnerRunCredits >= 4 || hqPressure.successfulAccessEvents > 0
  );
}

export function actionProtectsServer<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  actionServerId: string | undefined,
  triage: CorpBoardTriage,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): boolean {
  if (actionServerId !== triage.targetServerId) return false;
  if (action.type === "install_card" && action.payload?.placement === "ice") {
    if (triage.primary === "protect_hq" || triage.primary === "protect_rd") {
      const serverId = triage.primary === "protect_hq" ? "hq" : "rd";
      return installedIceProvidesConcreteCentralProtection(
        input,
        action,
        serverId,
        dependencies,
      );
    }
    if (triage.primary === "protect_score_remote") {
      return (
        triage.targetServerId !== undefined &&
        installedIceProvidesConcreteRemoteScoreProtection(
          input,
          action,
          triage.targetServerId,
          dependencies,
          { urgentScoreline: triage.severity === "critical" },
        )
      );
    }
    return true;
  }
  if (action.type !== "rez_ice") return false;
  const defense = semanticRuntimeCorpEffectiveDefenseContext(
    input,
    action,
    actionSemanticCandidate,
    { actionCreditCost: dependencies.actionCreditCost },
  );
  if (!defense?.isRezzableNow || defense.zeroEffectRisk) return false;
  if (triage.primary === "protect_hq" || triage.primary === "protect_rd") {
    return defense.hasImmediateStopPotential || defense.hasVisibleBreakerTax;
  }
  return defense.hasImmediateStopPotential || defense.hasMeaningfulTaxOrDamage;
}

export function sameTargetRezIsDefinitelyBad<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): boolean {
  const defense = semanticRuntimeCorpEffectiveDefenseContext(
    input,
    action,
    actionSemanticCandidate,
    { actionCreditCost: dependencies.actionCreditCost },
  );
  return !defense?.isRezzableNow || defense.zeroEffectRisk;
}

export function sameTargetRezMissesCriticalCentralStop<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  triage: CorpBoardTriage,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): boolean {
  if (triage.primary !== "protect_hq" && triage.primary !== "protect_rd") {
    return false;
  }
  if (triage.severity !== "high" && triage.severity !== "critical") {
    return false;
  }
  const defense = semanticRuntimeCorpEffectiveDefenseContext(
    input,
    action,
    actionSemanticCandidate,
    { actionCreditCost: dependencies.actionCreditCost },
  );
  return (
    defense?.hasImmediateStopPotential !== true &&
    defense?.hasVisibleBreakerTax !== true
  );
}

export function installedIceProvidesConcreteCentralProtection(
  input: AiDecisionInput,
  action: LegalAction,
  serverId: "hq" | "rd",
  dependencies: CorpBoardTriageDependencies<string>,
): boolean {
  const source = semanticRuntimeVisibleSourceCard(input, action);
  if (!source || source.known === false) return true;
  const profile = semanticRuntimeCorpCentralIceProfile(source);
  const placementCandidate = corpIcePlacementCandidateForAction({
    input,
    action,
    serverId,
    server: input.playerView.servers.find((server) => server.id === serverId),
    sourceCard: source,
    actionCreditCost: dependencies.actionCreditCost(action),
    iceRezCost: source.rezCost,
  });
  const placementIsConcrete =
    placementCandidate?.recommendation === "install_now" &&
    placementCandidate.components.visibleZeroEffect >= 0;
  if (!placementIsConcrete) return false;
  if (profile.hasAccessStop && !profile.positionDependent) {
    return true;
  }
  if (
    serverId === "hq" &&
    installedIceHasPunishTaxOrDamagePotential(source, profile) &&
    punishPrimaryHqTaxOrDamageIceCanCountAsProtection(input)
  ) {
    return true;
  }
  return false;
}

export function installedIceProvidesConcreteRemoteScoreProtection(
  input: AiDecisionInput,
  action: LegalAction,
  serverId: string,
  dependencies: CorpBoardTriageDependencies<string>,
  options: { urgentScoreline?: boolean } = {},
): boolean {
  if (serverId !== "new_remote" && !serverId.startsWith("remote_")) {
    return false;
  }
  const source = semanticRuntimeVisibleSourceCard(input, action);
  if (!source || source.known === false) return true;
  const profile = semanticRuntimeCorpCentralIceProfile(source);
  const placementCandidate = corpIcePlacementCandidateForAction({
    input,
    action,
    serverId,
    server: input.playerView.servers.find((server) => server.id === serverId),
    sourceCard: source,
    actionCreditCost: dependencies.actionCreditCost(action),
    iceRezCost: source.rezCost,
    hasUrgentScoreline: options.urgentScoreline === true,
  });
  const placementIsConcrete =
    placementCandidate?.recommendation === "install_now" &&
    placementCandidate.components.visibleZeroEffect >= 0;
  if (!placementIsConcrete) return false;
  if (profile.hasAccessStop && !profile.positionDependent) return true;
  return false;
}

export function installedIceHasPunishTaxOrDamagePotential(
  source: VisibleCard,
  profile: ReturnType<typeof semanticRuntimeCorpCentralIceProfile>,
): boolean {
  if (profile.hasTaxOrDamage) return true;
  const tokens = corpBoardTriageRulesTextTokens(
    corpBoardTriageVisibleCardCoverageText(source),
  );
  return tokens.some((token) =>
    [
      "damage",
      "tag",
      "tags",
      "trace",
      "trash",
      "trashes",
      "net",
      "meat",
      "brain",
    ].includes(token),
  );
}

export function punishPrimaryHqTaxOrDamageIceCanCountAsProtection(
  input: AiDecisionInput,
): boolean {
  const hqAgendaCards = input.playerView.own.gripOrHq.filter(
    corpTriageVisibleCardIsAgenda,
  );
  const hqAgendaPoints = hqAgendaCards.reduce(
    (sum, card) => sum + corpTriageVisibleAgendaPoints(card),
    0,
  );
  return corpPunishPrimaryShouldPreferPunishOrCentralProtection(
    input,
    hqAgendaCards.length,
    hqAgendaPoints,
  );
}

export function actionPushesUnsafeScoreline<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): boolean {
  const roles = dependencies.rolesForAction(input, action);
  return (
    (action.type === "advance_card" ||
      (action.type === "install_card" &&
        action.payload?.placement !== "ice")) &&
    dependencies.corpActionIsScoreLine(input, action, roles)
  );
}

export function scoreRemoteTriageEntryCanDriveSafety<TConsumer extends string>(
  input: AiDecisionInput,
  entry: ScoredLegalAction,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): boolean {
  return actionPushesConcreteAgendaScoreline(
    input,
    entry.action,
    dependencies,
    entry.roles,
  );
}

export function actionPushesConcreteAgendaScoreline<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
  roles = dependencies.rolesForAction(input, action),
): boolean {
  if (
    action.type !== "advance_card" &&
    !(action.type === "install_card" && action.payload?.placement !== "ice")
  ) {
    return false;
  }
  const sourceCard = semanticRuntimeVisibleSourceCard(input, action);
  if (sourceCard?.known !== false && sourceCard !== undefined) {
    return corpTriageVisibleCardIsAgenda(sourceCard);
  }
  if (
    action.payload?.cardType === "agenda" ||
    action.payload?.targetCardType === "agenda"
  ) {
    return true;
  }
  return dependencies.corpActionIsScoreLine(input, action, roles);
}

export function actionAcceleratesScoreline(
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): boolean {
  return actionCandidateHasVisibleSignal(actionSemanticCandidate, [
    "corp.score_closeout",
    "score_closeout",
    "advance.counter_cashout",
    "advance_scoreline",
    "corp.tactical.advance_scoreline",
  ]);
}

export function actionDelaysForcedScoreline<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  actionServerId: string | undefined,
  triage: CorpBoardTriage,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): boolean {
  if (actionCreatesPurgeActionDebt(action)) return true;
  if (action.type === "draw_card" || action.type === "gain_credit") {
    return true;
  }
  if (action.type === "end_turn") return true;
  if (actionServerId === "archives") return true;
  if (action.type === "install_card") {
    if (actionServerId !== triage.targetServerId) return true;
    return (
      action.payload?.placement !== "ice" &&
      !actionPushesConcreteAgendaScoreline(input, action, dependencies)
    );
  }
  if (action.type === "rez_ice" || action.type === "rez_card") {
    return actionServerId !== triage.targetServerId;
  }
  if (
    action.type === "play_operation" ||
    action.type === "trigger_ability" ||
    action.type === "activated_card_ability"
  ) {
    if (actionAcceleratesScoreline(actionSemanticCandidate)) return false;
    return true;
  }
  return false;
}

export function actionDelaysProtectedScoreRemote<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  actionServerId: string | undefined,
  triage: CorpBoardTriage,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): boolean {
  if (actionCreatesPurgeActionDebt(action)) return true;
  if (action.type === "end_turn") return true;
  if (action.type === "draw_card" || action.type === "gain_credit") {
    return true;
  }
  if (actionServerId === "archives") return true;
  if (action.type === "install_card") {
    if (actionServerId !== triage.targetServerId) return true;
    return action.payload?.placement !== "ice";
  }
  if (action.type === "rez_ice" || action.type === "rez_card") {
    return actionServerId !== triage.targetServerId;
  }
  if (
    action.type === "play_operation" ||
    action.type === "trigger_ability" ||
    action.type === "activated_card_ability"
  ) {
    if (actionAcceleratesScoreline(actionSemanticCandidate)) return false;
    return (
      actionProvidesEconomy(
        input,
        action,
        dependencies,
        actionSemanticCandidate,
      ) || actionHasVisibleDrawSource(input, action, actionSemanticCandidate)
    );
  }
  return false;
}
