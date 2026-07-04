import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { rolesMatch } from "./role-match";
import { visibleCardDefinition } from "./card-definition-lookup";
import { semanticRuntimeCorpCentralPressureAssessment } from "./semantic-runtime-corp-central-pressure";
import { semanticRuntimeCorpEffectiveDefenseContext } from "./semantic-runtime-corp-effective-defense";
import { semanticRuntimeCorpCentralIceProfile } from "./semantic-runtime-corp-remote-score";
import type {
  CorpScoringWindowAssessment,
  CorpScoringWindowAgendaStealSeverity,
} from "./semantic-runtime-corp-scoring-window";
import { semanticRuntimeVisibleSourceCard } from "./visible-card-lookup";

export type CorpBoardTriagePrimary =
  | "score_now"
  | "force_scoreline_clock"
  | "protect_score_remote"
  | "fund_score_remote"
  | "protect_hq"
  | "protect_rd"
  | "recover_economy"
  | "setup_score_remote"
  | "low_value";

export type CorpBoardTriageSeverity = "low" | "medium" | "high" | "critical";

export type CorpBoardTriage = {
  primary: CorpBoardTriagePrimary;
  severity: CorpBoardTriageSeverity;
  targetServerId?: string | undefined;
  scoreRemoteServerId?: string | undefined;
  requiredRezFloor?: number | undefined;
  currentCredits?: number | undefined;
  runnerAgendaPointsAfterSteal?: number | undefined;
  evidence: string[];
};

type RezFloorAssessment = {
  blockedByFloor: boolean;
  evidence: string[];
};

type SafetyGate = {
  allowed: boolean;
  evidence: string[];
};

export type CorpBoardTriageDependencies<TConsumer extends string> = {
  actionCreditCost: (action: LegalAction) => number;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  corpScoreNowSafetyGate: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SafetyGate;
  corpActionIsScoreLine: (
    input: AiDecisionInput,
    action: LegalAction,
    roles?: string[],
  ) => boolean;
  corpAdvanceCompletesScore?: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  corpScoringWindowAssessment?:
    | ((
        input: AiDecisionInput,
        action: LegalAction,
        roles?: string[],
      ) => CorpScoringWindowAssessment | undefined)
    | undefined;
  corpRemoteRezFloorAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RezFloorAssessment | undefined;
  corpCentralRezReserveAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RezFloorAssessment | undefined;
  corpHasRemoteRezFloorFundingNeed: (input: AiDecisionInput) => boolean;
  corpHasCentralRezFloorFundingNeed: (input: AiDecisionInput) => boolean;
  corpHasRemoteInstability: (input: AiDecisionInput) => boolean;
  corpTaggedRunnerPayoffPressure?: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
};

type ScoredLegalAction = {
  action: LegalAction;
  roles: string[];
  serverId?: string | undefined;
  scoringWindow?: CorpScoringWindowAssessment | undefined;
  remoteRezFloor?: RezFloorAssessment | undefined;
  centralRezFloor?: RezFloorAssessment | undefined;
};

type ForcedScorelineClockPressure = {
  severity: CorpBoardTriageSeverity;
  targetServerId?: string | undefined;
  scoreRemoteServerId?: string | undefined;
  requiredRezFloor?: number | undefined;
  hqAgendaCount: number;
  hqAgendaPoints: number;
  rdCount?: number | undefined;
  evidence: string[];
};

const TRIAGE_ALIGNMENT_BONUS = 850;
const TRIAGE_MISMATCH_HIGH = -4200;
const TRIAGE_MISMATCH_MEDIUM = -2200;

export function semanticRuntimeCorpBoardTriage<TConsumer extends string>(
  input: AiDecisionInput,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): CorpBoardTriage {
  const actions = corpLegalActions(input).map((action) =>
    scoredLegalAction(input, action, dependencies),
  );
  const currentCredits = input.playerView.own.credits;

  const scoreNow = actions.find(
    (entry) =>
      actionClosesScoreNow(input, entry.action, dependencies) ||
      actionKeepsSideSafeSameTurnScoreCloseout(input, entry, dependencies),
  );
  if (scoreNow) {
    return {
      primary: "score_now",
      severity: "critical",
      targetServerId: scoreNow.serverId,
      currentCredits,
      evidence: [
        "corp_board_triage_primary:score_now",
        "corp_board_triage_severity:critical",
        `corp_board_triage_action:${scoreNow.action.actionId}`,
      ],
    };
  }

  const preScoreCentralProtection = preScoreCentralProtectionTriage(
    input,
    actions,
    currentCredits,
  );
  if (preScoreCentralProtection) return preScoreCentralProtection;

  const forcedScorelinePressure = corpForcedScorelineClockPressure(
    input,
    actions,
    dependencies,
  );
  if (forcedScorelinePressure) {
    return {
      primary: "force_scoreline_clock",
      severity: forcedScorelinePressure.severity,
      targetServerId: forcedScorelinePressure.targetServerId,
      scoreRemoteServerId: forcedScorelinePressure.scoreRemoteServerId,
      requiredRezFloor: forcedScorelinePressure.requiredRezFloor,
      currentCredits,
      evidence: [
        "corp_board_triage_primary:force_scoreline_clock",
        `corp_board_triage_severity:${forcedScorelinePressure.severity}`,
        ...forcedScorelinePressure.evidence,
      ],
    };
  }

  const pressureInput = inputWithOpponentDefaults(input);
  const centralPressure = highestPriorityTriageCentralPressure(pressureInput);
  const centralPressureSeverity = centralPressure
    ? centralTriageSeverity(pressureInput, centralPressure)
    : undefined;
  if (
    centralPressure?.serverId === "rd" &&
    centralPressureSeverity === "critical"
  ) {
    return centralPressureTriage(
      centralPressure,
      centralPressureSeverity,
      currentCredits,
      ["corp_board_triage_central_override:critical_before_remote"],
    );
  }

  const remoteFunding = highestPriorityScoreRemoteEntry(
    actions.filter((entry) => scoreRemoteNeedsFunding(entry)),
  );
  if (remoteFunding?.scoringWindow) {
    return {
      primary: "fund_score_remote",
      severity: triageSeverityFromScoringWindow(remoteFunding.scoringWindow),
      targetServerId: remoteFunding.serverId,
      scoreRemoteServerId: remoteFunding.serverId,
      requiredRezFloor: remoteFunding.scoringWindow.dynamicProtectionReserve,
      currentCredits,
      runnerAgendaPointsAfterSteal:
        remoteFunding.scoringWindow.runnerAgendaPointsAfterSteal,
      evidence: [
        "corp_board_triage_primary:fund_score_remote",
        `corp_board_triage_target:${remoteFunding.serverId ?? "unknown"}`,
        ...remoteFunding.scoringWindow.evidence,
        ...(remoteFunding.remoteRezFloor?.evidence ?? []),
      ],
    };
  }

  const remoteProtection = highestPriorityScoreRemoteEntry(
    actions.filter((entry) => scoreRemoteNeedsProtection(entry)),
  );
  if (remoteProtection?.scoringWindow) {
    return {
      primary: "protect_score_remote",
      severity: triageSeverityFromScoringWindow(remoteProtection.scoringWindow),
      targetServerId: remoteProtection.serverId,
      scoreRemoteServerId: remoteProtection.serverId,
      currentCredits,
      runnerAgendaPointsAfterSteal:
        remoteProtection.scoringWindow.runnerAgendaPointsAfterSteal,
      evidence: [
        "corp_board_triage_primary:protect_score_remote",
        `corp_board_triage_target:${remoteProtection.serverId ?? "unknown"}`,
        ...remoteProtection.scoringWindow.evidence,
      ],
    };
  }

  const activeScorelineClock = corpActiveScorelineClockPressure(
    input,
    actions,
    dependencies,
  );
  if (activeScorelineClock) {
    return {
      primary: "force_scoreline_clock",
      severity: activeScorelineClock.severity,
      targetServerId: activeScorelineClock.targetServerId,
      scoreRemoteServerId: activeScorelineClock.scoreRemoteServerId,
      requiredRezFloor: activeScorelineClock.requiredRezFloor,
      currentCredits,
      evidence: [
        "corp_board_triage_primary:force_scoreline_clock",
        `corp_board_triage_severity:${activeScorelineClock.severity}`,
        ...activeScorelineClock.evidence,
      ],
    };
  }

  if (centralPressure && centralPressureSeverity) {
    return centralPressureTriage(
      centralPressure,
      centralPressureSeverity,
      currentCredits,
    );
  }

  if (
    currentCredits < 4 ||
    dependencies.corpHasRemoteRezFloorFundingNeed(input) ||
    dependencies.corpHasCentralRezFloorFundingNeed(input)
  ) {
    return {
      primary: "recover_economy",
      severity: currentCredits <= 2 ? "high" : "medium",
      currentCredits,
      evidence: [
        "corp_board_triage_primary:recover_economy",
        `corp_board_triage_credits:${currentCredits}`,
      ],
    };
  }

  const setupRemote = actions.find((entry) => actionBuildsScoreRemote(entry));
  if (setupRemote) {
    return {
      primary: "setup_score_remote",
      severity: "medium",
      targetServerId: setupRemote.serverId,
      scoreRemoteServerId: setupRemote.serverId,
      currentCredits,
      evidence: [
        "corp_board_triage_primary:setup_score_remote",
        `corp_board_triage_target:${setupRemote.serverId ?? "unknown"}`,
      ],
    };
  }

  return {
    primary: "low_value",
    severity: "low",
    currentCredits,
    evidence: ["corp_board_triage_primary:low_value"],
  };
}

export function semanticRuntimeCorpBoardTriageActionComponent<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
  actionSemanticCandidate?: ActionSemanticCandidate,
): AiDecisionScoreComponent | undefined {
  const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
  if (triage.primary === "low_value") return undefined;
  const actionServerId = actionServerIdForAction(input, action);
  const alignment = corpBoardTriageActionAlignment(
    input,
    action,
    actionServerId,
    triage,
    dependencies,
    actionSemanticCandidate,
  );
  if (alignment === "match") {
    const rawValue =
      triage.severity === "critical"
        ? TRIAGE_ALIGNMENT_BONUS + 350
        : TRIAGE_ALIGNMENT_BONUS;
    const normalizedValue = normalizedCorpBoardTriageValue(rawValue);
    return {
      key: "corp_board_triage_alignment",
      label: "Corp-Board-Triage",
      value: normalizedValue,
      reason: triageReason(
        triage,
        action,
        actionServerId,
        "match",
        rawValue,
        normalizedValue,
      ),
    };
  }
  if (alignment === "mismatch") {
    const rawValue =
      triage.severity === "low" || triage.severity === "medium"
        ? TRIAGE_MISMATCH_MEDIUM
        : TRIAGE_MISMATCH_HIGH;
    const normalizedValue = normalizedCorpBoardTriageValue(rawValue);
    const componentValue = corpBoardTriageMismatchComponentValue(
      triage,
      normalizedValue,
    );
    return {
      key: "corp_board_triage_mismatch",
      label: "Corp-Board-Triage",
      value: componentValue,
      reason: triageReason(
        triage,
        action,
        actionServerId,
        "mismatch",
        rawValue,
        normalizedValue,
        componentValue,
      ),
    };
  }
  return {
    key: "corp_board_triage_context",
    label: "Corp-Board-Triage",
    value: 0,
    reason: triageReason(triage, action, actionServerId, "neutral"),
  };
}

function corpBoardTriageActionAlignment<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  actionServerId: string | undefined,
  triage: CorpBoardTriage,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): "match" | "mismatch" | "neutral" {
  switch (triage.primary) {
    case "score_now":
      return actionClosesScoreNow(input, action, dependencies) ||
        actionKeepsSideSafeSameTurnScoreCloseoutForAction(
          input,
          action,
          dependencies,
        )
        ? "match"
        : "mismatch";
    case "force_scoreline_clock": {
      const activeScorelineLock = triageIsActiveScorelineLock(triage);
      const needsFunding =
        triage.requiredRezFloor !== undefined &&
        triage.currentCredits !== undefined &&
        triage.currentCredits < triage.requiredRezFloor;
      if (
        actionKeepsSideSafeSameTurnScoreCloseoutForAction(
          input,
          action,
          dependencies,
        ) ||
        actionAcceleratesScoreline(actionSemanticCandidate)
      ) {
        return "match";
      }
      if (actionHasVisibleDrawSource(input, action, actionSemanticCandidate)) {
        return "mismatch";
      }
      if (
        actionPushesUnsafeScoreline(input, action, dependencies) &&
        triage.targetServerId &&
        actionServerId &&
        actionServerId !== triage.targetServerId
      ) {
        return "mismatch";
      }
      if (actionPushesUnsafeScoreline(input, action, dependencies)) {
        return needsFunding && legalEconomyActionExists(input)
          ? "mismatch"
          : "match";
      }
      if (
        actionProtectsServer(
          input,
          action,
          actionServerId,
          triage,
          dependencies,
          actionSemanticCandidate,
        )
      ) {
        return activeScorelineLock ? "mismatch" : "match";
      }
      if (
        needsFunding &&
        actionProvidesEconomy(
          input,
          action,
          dependencies,
          actionSemanticCandidate,
        )
      ) {
        return "match";
      }
      return actionDelaysForcedScoreline(
        input,
        action,
        actionServerId,
        triage,
        dependencies,
        actionSemanticCandidate,
      )
        ? "mismatch"
        : "neutral";
    }
    case "protect_score_remote":
      if (
        actionKeepsSideSafeSameTurnScoreCloseoutForAction(
          input,
          action,
          dependencies,
        )
      ) {
        return "match";
      }
      if (
        actionProtectsServer(
          input,
          action,
          actionServerId,
          triage,
          dependencies,
          actionSemanticCandidate,
        )
      ) {
        return "match";
      }
      if (
        action.type === "rez_ice" &&
        actionServerId === triage.targetServerId
      ) {
        return sameTargetRezIsDefinitelyBad(
          input,
          action,
          dependencies,
          actionSemanticCandidate,
        ) ||
          sameTargetRezMissesCriticalCentralStop(
            input,
            action,
            triage,
            dependencies,
            actionSemanticCandidate,
          )
          ? "mismatch"
          : "neutral";
      }
      return actionPushesUnsafeScoreline(input, action, dependencies) ||
        actionIsOffTargetInstall(action, actionServerId, triage) ||
        actionDelaysProtectedScoreRemote(
          input,
          action,
          actionServerId,
          triage,
          dependencies,
          actionSemanticCandidate,
        )
        ? "mismatch"
        : "neutral";
    case "fund_score_remote":
      if (
        actionProvidesEconomy(
          input,
          action,
          dependencies,
          actionSemanticCandidate,
        )
      ) {
        return "match";
      }
      if (action.type === "draw_card" && !legalEconomyActionExists(input)) {
        return "match";
      }
      return actionCreatesPurgeActionDebt(action) ||
        actionPushesUnsafeScoreline(input, action, dependencies) ||
        actionIsExpensiveNonProtection(action, actionServerId, triage)
        ? "mismatch"
        : "neutral";
    case "protect_hq":
    case "protect_rd":
      if (
        actionProtectsServer(
          input,
          action,
          actionServerId,
          triage,
          dependencies,
          actionSemanticCandidate,
        )
      ) {
        return "match";
      }
      if (
        action.type === "rez_ice" &&
        actionServerId === triage.targetServerId
      ) {
        return sameTargetRezIsDefinitelyBad(
          input,
          action,
          dependencies,
          actionSemanticCandidate,
        ) ||
          sameTargetRezMissesCriticalCentralStop(
            input,
            action,
            triage,
            dependencies,
            actionSemanticCandidate,
          )
          ? "mismatch"
          : "neutral";
      }
      return actionDistractsFromCentralProtection(
        action,
        actionServerId,
        triage,
      )
        ? "mismatch"
        : "neutral";
    case "recover_economy":
      if (
        actionProvidesEconomy(
          input,
          action,
          dependencies,
          actionSemanticCandidate,
        )
      ) {
        return "match";
      }
      if (action.type === "draw_card" && !legalEconomyActionExists(input)) {
        return "match";
      }
      return action.type === "advance_card" ||
        (action.type === "install_card" && action.payload?.placement !== "ice")
        ? "mismatch"
        : "neutral";
    case "setup_score_remote":
      if (
        actionBuildsScoreRemote({
          action,
          roles: dependencies.rolesForAction(input, action),
          serverId: actionServerId,
        })
      ) {
        return "match";
      }
      return actionServerId === "archives" ? "mismatch" : "neutral";
    case "low_value":
      return "neutral";
  }
}

function scoredLegalAction<TConsumer extends string>(
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

function corpLegalActions(input: AiDecisionInput): LegalAction[] {
  return (input.legalActions ?? input.playerView.legalActions ?? []).filter(
    (action) => action.side === "corp",
  );
}

function corpForcedScorelineClockPressure<TConsumer extends string>(
  input: AiDecisionInput,
  actions: readonly ScoredLegalAction[],
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): ForcedScorelineClockPressure | undefined {
  return (
    corpDeckoutAgendaFloodPressure(input, actions, dependencies) ??
    corpHqAgendaFloodScorelinePressure(input, actions, dependencies)
  );
}

function corpActiveScorelineClockPressure<TConsumer extends string>(
  input: AiDecisionInput,
  actions: readonly ScoredLegalAction[],
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): ForcedScorelineClockPressure | undefined {
  const entries = actions.filter((entry) =>
    activeScorelineClockEntryIsPlayable(input, entry, dependencies),
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
    requiredRezFloor: preferred.scoringWindow?.dynamicProtectionReserve,
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

function activeScorelineClockEntryIsPlayable<TConsumer extends string>(
  input: AiDecisionInput,
  entry: ScoredLegalAction,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): boolean {
  if (!entry.serverId || entry.serverId === "new_remote") return false;
  if (!entry.serverId.startsWith("remote_")) return false;
  if (!actionPushesUnsafeScoreline(input, entry.action, dependencies)) {
    return false;
  }
  if (
    entry.action.type !== "advance_card" &&
    entry.action.type !== "install_card"
  ) {
    return false;
  }
  if (scoreRemoteNeedsProtection(entry) || scoreRemoteNeedsFunding(entry)) {
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

function scorelineEntryHasPlayableClockWindow(
  entry: ScoredLegalAction,
): boolean {
  const assessment = entry.scoringWindow;
  if (!assessment) return true;
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
    return (
      assessment.missingVisibleBreakerCoverage &&
      !assessment.runnerCanReachAccessNow &&
      !assessment.runnerCanContestBeforeScore &&
      !assessment.runnerCanReachAccessBeforeScore &&
      assessment.agendaStealSeverity !== "game_ending" &&
      (assessment.affordableDurableRelevantIceCount ?? 0) >= 1
    );
  }
  return false;
}

function highestPriorityActiveScorelineEntry(
  entries: readonly ScoredLegalAction[],
): ScoredLegalAction | undefined {
  return [...entries].sort(
    (left, right) =>
      activeScorelineEntryPriority(right) - activeScorelineEntryPriority(left),
  )[0];
}

function activeScorelineEntryPriority(entry: ScoredLegalAction): number {
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

function remoteServerHasVisibleScoreline(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  return (
    input.playerView.servers
      .find((server) => server.id === serverId)
      ?.root.some(
        (card) =>
          card.known !== false &&
          (card.type === "agenda" ||
            typeof card.advancementRequirement === "number" ||
            (card.advancementCounters ?? 0) > 0),
      ) === true
  );
}

function existingReadyRemoteCanReceiveScoreline(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  return (
    server !== undefined &&
    server.id.startsWith("remote_") &&
    server.root.length === 0 &&
    server.ice.length > 0
  );
}

function corpDeckoutAgendaFloodPressure<TConsumer extends string>(
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
  if (hqAgendaCount < 2 && hqAgendaPoints < 4) return undefined;

  const scorelineEntries = actions.filter((entry) =>
    actionPushesUnsafeScoreline(input, entry.action, dependencies),
  );
  if (scorelineEntries.length === 0) return undefined;

  const preferred = highestPriorityDeckoutScorelineEntry(scorelineEntries);
  const requiredRezFloor =
    corpTriagePositiveNumber(
      preferred?.scoringWindow?.dynamicProtectionReserve,
    ) ??
    (preferred?.remoteRezFloor?.blockedByFloor
      ? input.playerView.own.credits + 1
      : undefined);
  const targetServerId = preferred?.serverId;
  const severity =
    rdCount <= 2 || (rdCount <= 4 && hqAgendaPoints >= 6) ? "critical" : "high";
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
      "corp_deckout_agenda_flood:true",
      `corp_rd_count:${rdCount}`,
      `corp_hq_agenda_count:${hqAgendaCount}`,
      `corp_hq_agenda_points:${hqAgendaPoints}`,
      ...(targetServerId
        ? [`corp_forced_scoreline_target:${targetServerId}`]
        : []),
      ...(requiredRezFloor !== undefined
        ? [`corp_forced_scoreline_rez_floor:${requiredRezFloor}`]
        : []),
    ],
  };
}

function corpHqAgendaFloodScorelinePressure<TConsumer extends string>(
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

  const playableScorelineEntries = actions.filter(
    (entry) =>
      actionPushesUnsafeScoreline(input, entry.action, dependencies) &&
      scorelineEntryCanRelieveHqAgendaFlood(entry),
  );
  if (playableScorelineEntries.length === 0) return undefined;

  const preferred = highestPriorityDeckoutScorelineEntry(
    playableScorelineEntries,
  );
  const requiredRezFloor =
    corpTriagePositiveNumber(
      preferred?.scoringWindow?.dynamicProtectionReserve,
    ) ??
    (preferred?.remoteRezFloor?.blockedByFloor
      ? input.playerView.own.credits + 1
      : undefined);
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
      ...hqPressure.evidence.slice(0, 6),
      ...(preferred?.scoringWindow?.evidence ?? []).slice(0, 8),
    ],
  };
}

function corpHqAgendaFloodIsPressured(
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

function scorelineEntryCanRelieveHqAgendaFlood(
  entry: ScoredLegalAction,
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
  return (
    assessment.windowKind === "unsafe" &&
    assessment.missingVisibleBreakerCoverage &&
    !assessment.runnerCanReachAccessNow &&
    !assessment.runnerCanContestBeforeScore &&
    !assessment.runnerCanReachAccessBeforeScore &&
    assessment.agendaStealSeverity !== "game_ending" &&
    (assessment.affordableDurableRelevantIceCount ?? 0) >= 1
  );
}

function highestPriorityDeckoutScorelineEntry(
  entries: readonly ScoredLegalAction[],
): ScoredLegalAction | undefined {
  return [...entries].sort(
    (left, right) =>
      deckoutScorelineEntryPriority(right) -
      deckoutScorelineEntryPriority(left),
  )[0];
}

function deckoutScorelineEntryPriority(entry: ScoredLegalAction): number {
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

function actionClosesScoreNow<TConsumer extends string>(
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

function actionKeepsSameTurnScoreCloseoutReachable<TConsumer extends string>(
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

function actionKeepsSideSafeSameTurnScoreCloseout<TConsumer extends string>(
  input: AiDecisionInput,
  entry: ScoredLegalAction,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): boolean {
  return (
    actionKeepsSameTurnScoreCloseoutReachable(
      input,
      entry.action,
      dependencies,
    ) && scoringWindowAllowsSameTurnScoreNow(entry.scoringWindow)
  );
}

function actionKeepsSideSafeSameTurnScoreCloseoutForAction<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): boolean {
  if (!actionKeepsSameTurnScoreCloseoutReachable(input, action, dependencies)) {
    return false;
  }
  const roles = dependencies.rolesForAction(input, action);
  return scoringWindowAllowsSameTurnScoreNow(
    dependencies.corpScoringWindowAssessment?.(input, action, roles),
  );
}

function scoringWindowAllowsSameTurnScoreNow(
  assessment: CorpScoringWindowAssessment | undefined,
): boolean {
  if (!assessment) return true;
  return (
    assessment.scoreHorizon === "immediate" &&
    assessment.windowKind !== "unsafe" &&
    assessment.windowKind !== "none" &&
    !assessment.runnerCanContestBeforeScore &&
    !assessment.runnerCanReachAccessBeforeScore
  );
}

function legalScoreActionExistsForSameSource(
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

function corpTriageVisibleAdvancementRequirement(
  card: VisibleCard,
): number | undefined {
  return (
    corpTriagePositiveNumber(card.advancementRequirement) ??
    corpTriagePositiveNumber(
      visibleCardDefinition(card)?.advancementRequirement,
    )
  );
}

function corpTriageActionClickCost(action: LegalAction): number {
  const costs = action.costs
    .map((cost) => cost.clicks)
    .filter((value): value is number => typeof value === "number");
  if (costs.length > 0) return costs.reduce((sum, value) => sum + value, 0);
  return action.type === "advance_card" ? 1 : 0;
}

function corpTriagePositiveNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function highestPriorityScoreRemoteEntry(
  entries: readonly ScoredLegalAction[],
): ScoredLegalAction | undefined {
  return [...entries].sort(
    (left, right) =>
      scoreRemoteEntryPriority(right) - scoreRemoteEntryPriority(left),
  )[0];
}

function scoreRemoteEntryPriority(entry: ScoredLegalAction): number {
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

function scoreRemoteNeedsFunding(entry: ScoredLegalAction): boolean {
  const assessment = entry.scoringWindow;
  if (!assessment) return false;
  if (
    assessment.recommendedNextStep === "gain_credit" ||
    entry.remoteRezFloor?.blockedByFloor === true
  ) {
    return true;
  }
  return (
    assessment.windowKind === "unsafe" &&
    assessment.runnerCanContestBeforeScore &&
    assessment.corpCanRezRelevantIce === false
  );
}

function scoreRemoteNeedsProtection(entry: ScoredLegalAction): boolean {
  const assessment = entry.scoringWindow;
  if (!assessment) return false;
  if (assessment.recommendedNextStep === "build_remote_ice") return true;
  if (assessment.windowKind === "unsafe") return true;
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

function triageSeverityFromScoringWindow(
  assessment: CorpScoringWindowAssessment,
): CorpBoardTriageSeverity {
  return agendaSeverityToTriageSeverity(assessment.agendaStealSeverity);
}

function centralPressureTriage(
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

function agendaSeverityToTriageSeverity(
  severity: CorpScoringWindowAgendaStealSeverity | undefined,
): CorpBoardTriageSeverity {
  if (severity === "game_ending") return "critical";
  if (severity === "near_win") return "high";
  if (severity === "normal") return "high";
  return "medium";
}

function centralTriageSeverity(
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

function centralPressureIsTriageAcute(
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

function highestPriorityTriageCentralPressure(
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

function preScoreCentralProtectionTriage(
  input: AiDecisionInput,
  actions: readonly ScoredLegalAction[],
  currentCredits: number,
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
    concreteCentralProtectionActionExists(actions, "rd")
  ) {
    return centralPressureTriage(rdPressure, rdSeverity, currentCredits, [
      "corp_board_triage_central_override:pre_score_rd_exposure",
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
    !concreteCentralProtectionActionExists(actions, "hq") ||
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
      "corp_hq_ice_count:0",
      ...hqPressure.evidence.slice(0, 8),
    ],
  };
}

function centralServerNeedsProtection(
  input: AiDecisionInput,
  serverId: "hq" | "rd",
): boolean {
  return centralServerIceCount(input, serverId) === 0;
}

function centralServerIceCount(
  input: AiDecisionInput,
  serverId: "hq" | "rd",
): number {
  return (
    input.playerView.servers?.find((server) => server.id === serverId)?.ice
      .length ?? 0
  );
}

function concreteCentralProtectionActionExists(
  actions: readonly ScoredLegalAction[],
  serverId: "hq" | "rd",
): boolean {
  return actions.some(
    (entry) =>
      entry.serverId === serverId &&
      ((entry.action.type === "install_card" &&
        entry.action.payload?.placement === "ice") ||
        entry.action.type === "rez_ice"),
  );
}

function unprotectedHqAgendaExposureRequiresPreScoreProtection(
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

function actionProtectsServer<TConsumer extends string>(
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
      return installedIceHasImmediateStopPotential(input, action);
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

function sameTargetRezIsDefinitelyBad<TConsumer extends string>(
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

function sameTargetRezMissesCriticalCentralStop<TConsumer extends string>(
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

function installedIceHasImmediateStopPotential(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  const source = semanticRuntimeVisibleSourceCard(input, action);
  if (!source || source.known === false) return true;
  const profile = semanticRuntimeCorpCentralIceProfile(source);
  return profile.hasAccessStop && !profile.positionDependent;
}

function actionPushesUnsafeScoreline<TConsumer extends string>(
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

function actionAcceleratesScoreline(
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

function actionDelaysForcedScoreline<TConsumer extends string>(
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
      !actionPushesUnsafeScoreline(input, action, dependencies)
    );
  }
  if (action.type === "rez_ice") {
    return actionServerId !== triage.targetServerId;
  }
  if (
    action.type === "play_operation" ||
    action.type === "trigger_ability" ||
    action.type === "activated_card_ability"
  ) {
    if (actionAcceleratesScoreline(actionSemanticCandidate)) return false;
    return actionProvidesEconomy(
      input,
      action,
      dependencies,
      actionSemanticCandidate,
    );
  }
  return false;
}

function actionDelaysProtectedScoreRemote<TConsumer extends string>(
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
  if (action.type === "rez_ice") {
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

function actionHasVisibleDrawSource(
  input: AiDecisionInput,
  action: LegalAction,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): boolean {
  if (action.type === "draw_card") return true;
  if (
    actionCandidateHasVisibleSignal(actionSemanticCandidate, [
      "draw",
      "draw_operation",
      "recover_draw",
    ])
  ) {
    return true;
  }
  const source = semanticRuntimeVisibleSourceCard(input, action);
  if (!source || source.known === false) return false;
  const definition = visibleCardDefinition(source);
  const text = [source.rulesText, definition?.rulesText]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
  return corpBoardTriageTokensIncludeDraw(corpBoardTriageRulesTextTokens(text));
}

function corpTriageVisibleCardIsAgenda(card: VisibleCard): boolean {
  if (card.known === false) return false;
  const definition = visibleCardDefinition(card);
  return card.type === "agenda" || definition?.type === "agenda";
}

function corpTriageVisibleAgendaPoints(card: VisibleCard): number {
  const definition = visibleCardDefinition(card);
  return (
    corpTriagePositiveNumber(card.agendaPoints) ??
    corpTriagePositiveNumber(definition?.agendaPoints) ??
    0
  );
}

function actionIsOffTargetInstall(
  action: LegalAction,
  actionServerId: string | undefined,
  triage: CorpBoardTriage,
): boolean {
  if (action.type !== "install_card") return false;
  if (actionServerId === triage.targetServerId) return false;
  if (actionServerId === "archives") return true;
  return action.payload?.placement === "ice" && actionServerId !== undefined;
}

function actionIsExpensiveNonProtection(
  action: LegalAction,
  actionServerId: string | undefined,
  triage: CorpBoardTriage,
): boolean {
  return (
    action.type === "install_card" &&
    action.payload?.placement !== "ice" &&
    actionServerId !== triage.targetServerId
  );
}

function actionDistractsFromCentralProtection(
  action: LegalAction,
  actionServerId: string | undefined,
  triage: CorpBoardTriage,
): boolean {
  if (actionServerId === triage.targetServerId) return false;
  if (
    actionCreatesPurgeActionDebt(action) &&
    (triage.severity === "high" || triage.severity === "critical")
  ) {
    return true;
  }
  if (actionServerId === "archives") return true;
  if (action.type === "end_turn") return true;
  if (action.type === "advance_card") return true;
  if (action.type === "install_card") return true;
  if (triage.severity === "critical") {
    return action.type === "gain_credit" || action.type === "draw_card";
  }
  return false;
}

function actionCreatesPurgeActionDebt(action: LegalAction): boolean {
  return action.type === "purge_runner_virus_counters";
}

function actionBuildsScoreRemote(
  entry: Pick<ScoredLegalAction, "action" | "roles" | "serverId">,
): boolean {
  if (!entry.serverId || !entry.serverId.startsWith("remote_")) return false;
  if (entry.action.type !== "install_card") return false;
  return (
    entry.action.payload?.placement === "ice" ||
    rolesMatch(entry.roles, ["remote_score_support", "scoreline_support"])
  );
}

function actionProvidesEconomy<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): boolean {
  if (action.type === "gain_credit") return true;
  const payoffPressure = dependencies.corpTaggedRunnerPayoffPressure?.(
    input,
    action,
  );
  if (
    payoffPressure?.key === "corp_card_action_economy_gain" ||
    payoffPressure?.reason?.includes("installed_corp_economy:true")
  ) {
    return true;
  }
  if (action.type === "play_operation") {
    return (
      actionCandidateHasVisibleSignal(actionSemanticCandidate, [
        "economy",
        "economy_operation",
        "draw_operation",
        "recover_economy",
        "economy.corp_credit_burst",
        "corp_credit_burst",
      ]) || actionHasVisibleImmediateEconomyOrDrawSource(input, action)
    );
  }
  if (
    action.type !== "trigger_ability" &&
    action.type !== "activated_card_ability"
  ) {
    return false;
  }
  return (
    actionCandidateHasVisibleSignal(actionSemanticCandidate, [
      "economy",
      "economy_operation",
      "draw_operation",
      "recover_economy",
      "economy.corp_credit_burst",
      "corp_credit_burst",
    ]) || actionHasVisibleImmediateEconomyOrDrawSource(input, action)
  );
}

function actionHasVisibleImmediateEconomyOrDrawSource(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  const source = semanticRuntimeVisibleSourceCard(input, action);
  if (!source || source.known === false) return false;
  const definition = visibleCardDefinition(source);
  const type = source.type ?? definition?.type;
  if (action.type === "play_operation" && type !== "operation") {
    return false;
  }
  const text = [source.rulesText, definition?.rulesText]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
  const tokens = corpBoardTriageRulesTextTokens(text);
  return (
    corpBoardTriageTokensIncludeCreditGain(tokens) ||
    corpBoardTriageTokensIncludeDraw(tokens)
  );
}

function corpBoardTriageRulesTextTokens(text: string): string[] {
  return text
    .toLocaleLowerCase("de-DE")
    .split(/[^\p{L}0-9]+/u)
    .filter(Boolean);
}

function corpBoardTriageTokensIncludeCreditGain(
  tokens: readonly string[],
): boolean {
  return tokens.some(
    (token, index) =>
      corpBoardTriageCreditGainVerb(tokens[index - 1]) &&
      corpBoardTriagePositiveInteger(token) > 0 &&
      corpBoardTriageCreditToken(tokens[index + 1]),
  );
}

function corpBoardTriageTokensIncludeDraw(tokens: readonly string[]): boolean {
  return tokens.some(
    (token, index) =>
      corpBoardTriageDrawVerb(tokens[index - 1]) &&
      corpBoardTriagePositiveInteger(token) > 0 &&
      corpBoardTriageCardToken(tokens[index + 1]),
  );
}

function corpBoardTriageCreditGainVerb(token: string | undefined): boolean {
  return (
    token === "gain" ||
    token === "erhalte" ||
    token === "erhält" ||
    token === "nimm" ||
    token === "nehme"
  );
}

function corpBoardTriageDrawVerb(token: string | undefined): boolean {
  return token === "draw" || token === "ziehe" || token === "zieht";
}

function corpBoardTriageCreditToken(token: string | undefined): boolean {
  return (
    token === "credit" ||
    token === "credits" ||
    token === "kredit" ||
    token === "kredite" ||
    token === "bit" ||
    token === "bits"
  );
}

function corpBoardTriageCardToken(token: string | undefined): boolean {
  return (
    token === "card" ||
    token === "cards" ||
    token === "karte" ||
    token === "karten"
  );
}

function corpBoardTriagePositiveInteger(token: string | undefined): number {
  if (!token) return 0;
  const amount = Number.parseInt(token, 10);
  return String(amount) === token && amount > 0 ? amount : 0;
}

function legalEconomyActionExists(input: AiDecisionInput): boolean {
  return corpLegalActions(input).some(
    (action) => action.type === "gain_credit",
  );
}

function actionCandidateHasVisibleSignal(
  candidate: ActionSemanticCandidate | undefined,
  needles: readonly string[],
): boolean {
  if (!candidate) return false;
  const signals = [
    candidate.semanticActionType,
    ...candidate.actionTacticSignals,
    ...candidate.cardContextSignals,
    ...candidate.evidence,
  ].map((signal) => signal.toLocaleLowerCase("en-US"));
  return needles.some((needle) => {
    const normalizedNeedle = needle.toLocaleLowerCase("en-US");
    return (
      signals.includes(normalizedNeedle) ||
      rolesMatch(signals, [normalizedNeedle])
    );
  });
}

function actionServerIdForAction(
  input: AiDecisionInput,
  action: LegalAction,
): string | undefined {
  const payloadServer =
    stringPayload(action.payload, "serverId") ??
    stringPayload(action.payload, "targetServerId") ??
    stringPayload(action.payload, "attackedServerId");
  if (payloadServer) return payloadServer;
  const sourceId =
    typeof action.source === "string" ? action.source : undefined;
  if (!sourceId) return undefined;
  for (const server of input.playerView.servers ?? []) {
    if (
      server.ice.some((card) => card.instanceId === sourceId) ||
      server.root.some((card) => card.instanceId === sourceId)
    ) {
      return server.id;
    }
  }
  return undefined;
}

function stringPayload(
  payload: LegalAction["payload"],
  key: string,
): string | undefined {
  const value = payload?.[key];
  return typeof value === "string" ? value : undefined;
}

function triageReason(
  triage: CorpBoardTriage,
  action: LegalAction,
  actionServerId: string | undefined,
  alignment: "match" | "mismatch" | "neutral",
  rawValue = 0,
  normalizedValue = 0,
  componentValue = normalizedValue,
): string {
  return [
    `triage_primary:${triage.primary}`,
    `triage_severity:${triage.severity}`,
    ...(triage.targetServerId
      ? [`triage_target:${triage.targetServerId}`]
      : []),
    ...(triage.scoreRemoteServerId
      ? [`triage_score_remote:${triage.scoreRemoteServerId}`]
      : []),
    ...(triage.currentCredits !== undefined
      ? [`triage_current_credits:${triage.currentCredits}`]
      : []),
    ...(triage.requiredRezFloor !== undefined
      ? [`triage_required_rez_floor:${triage.requiredRezFloor}`]
      : []),
    ...(triage.runnerAgendaPointsAfterSteal !== undefined
      ? [
          `triage_runner_points_after_steal:${triage.runnerAgendaPointsAfterSteal}`,
        ]
      : []),
    `triage_action:${action.type}`,
    `triage_action_id:${action.actionId}`,
    `triage_action_server:${actionServerId ?? "none"}`,
    `triage_alignment:${alignment}`,
    `triage_raw_value:${rawValue}`,
    `triage_normalized_value:${normalizedValue}`,
    `triage_component_value:${componentValue}`,
    ...triage.evidence.slice(0, 12),
  ].join("|");
}

function triageIsActiveScorelineLock(triage: CorpBoardTriage): boolean {
  return triage.evidence.includes("corp_active_scoreline_clock:true");
}

function corpBoardTriageMismatchComponentValue(
  triage: CorpBoardTriage,
  normalizedValue: number,
): number {
  if (
    (triage.primary === "score_now" ||
      triage.primary === "force_scoreline_clock" ||
      triage.primary === "protect_score_remote" ||
      triage.primary === "fund_score_remote" ||
      triage.primary === "protect_hq" ||
      triage.primary === "protect_rd") &&
    (triage.severity === "critical" || triage.severity === "high")
  ) {
    return triage.severity === "critical" ? -3200 : -2400;
  }
  return normalizedValue;
}

export function normalizedCorpBoardTriageValue(rawValue: number): number {
  return Math.max(-100, Math.min(100, Math.round(rawValue / 50)));
}

function inputWithOpponentDefaults(input: AiDecisionInput): AiDecisionInput {
  if (input.playerView.opponent) return input;
  return {
    ...input,
    playerView: {
      ...input.playerView,
      opponent: {
        identity: {
          instanceId: "triage-runner-identity",
          known: true,
          side: "runner",
          owner: "runner",
          type: "identity",
          counterDisplays: [],
        },
        credits: 0,
        clicks: 0,
        agendaPoints: 0,
        tags: 0,
        handCount: 0,
        maxHandSize: 5,
        deckCount: 0,
        discardCount: 0,
        rig: [],
        heapOrArchives: [],
        gripOrHq: [],
        scoreArea: [],
      },
    },
  } as unknown as AiDecisionInput;
}
