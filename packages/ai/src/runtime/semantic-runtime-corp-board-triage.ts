import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { rolesMatch } from "./role-match";
import { visibleCardDefinition } from "./card-definition-lookup";
import { semanticRuntimeCorpCentralPressureAssessment } from "./semantic-runtime-corp-central-pressure";
import { semanticRuntimeCorpEffectiveDefenseContext } from "./semantic-runtime-corp-effective-defense";
import type {
  CorpScoringWindowAssessment,
  CorpScoringWindowAgendaStealSeverity,
} from "./semantic-runtime-corp-scoring-window";
import { semanticRuntimeVisibleSourceCard } from "./visible-card-lookup";

export type CorpBoardTriagePrimary =
  | "score_now"
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

  const scoreNow = actions.find(({ action }) =>
    actionClosesScoreNow(input, action, dependencies),
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

  const remoteProtection = actions.find((entry) =>
    scoreRemoteNeedsProtection(entry),
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

  const remoteFunding = actions.find((entry) => scoreRemoteNeedsFunding(entry));
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

  const pressureInput = inputWithOpponentDefaults(input);
  const hqPressure = semanticRuntimeCorpCentralPressureAssessment(
    pressureInput,
    "hq",
  );
  const rdPressure = semanticRuntimeCorpCentralPressureAssessment(
    pressureInput,
    "rd",
  );
  const acuteHqPressure = centralPressureIsTriageAcute(
    pressureInput,
    hqPressure,
  )
    ? hqPressure
    : undefined;
  const acuteRdPressure = centralPressureIsTriageAcute(
    pressureInput,
    rdPressure,
  )
    ? rdPressure
    : undefined;
  const centralPressure =
    acuteHqPressure && acuteRdPressure
      ? acuteHqPressure.pressure >= acuteRdPressure.pressure ||
        acuteHqPressure.hqAgendaExposure
        ? acuteHqPressure
        : acuteRdPressure
      : acuteHqPressure
        ? acuteHqPressure
        : acuteRdPressure
          ? acuteRdPressure
          : undefined;
  if (centralPressure) {
    return {
      primary: centralPressure.serverId === "hq" ? "protect_hq" : "protect_rd",
      severity: centralTriageSeverity(pressureInput, centralPressure),
      targetServerId: centralPressure.serverId,
      currentCredits,
      evidence: [
        `corp_board_triage_primary:protect_${centralPressure.serverId}`,
        ...centralPressure.evidence,
      ],
    };
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
    return {
      key: "corp_board_triage_alignment",
      label: "Corp-Board-Triage",
      value:
        triage.severity === "critical"
          ? TRIAGE_ALIGNMENT_BONUS + 350
          : TRIAGE_ALIGNMENT_BONUS,
      reason: triageReason(triage, action, actionServerId, "match"),
    };
  }
  if (alignment === "mismatch") {
    return {
      key: "corp_board_triage_mismatch",
      label: "Corp-Board-Triage",
      value:
        triage.severity === "low" || triage.severity === "medium"
          ? TRIAGE_MISMATCH_MEDIUM
          : TRIAGE_MISMATCH_HIGH,
      reason: triageReason(triage, action, actionServerId, "mismatch"),
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
      return actionClosesScoreNow(input, action, dependencies)
        ? "match"
        : "mismatch";
    case "protect_score_remote":
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
        return "mismatch";
      }
      return actionPushesUnsafeScoreline(input, action, dependencies) ||
        actionIsOffTargetInstall(action, actionServerId, triage)
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
      return actionPushesUnsafeScoreline(input, action, dependencies) ||
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
        return "mismatch";
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

function actionClosesScoreNow<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): boolean {
  if (action.type === "score_agenda") {
    return dependencies.corpScoreNowSafetyGate(input, action).allowed;
  }
  return (
    action.type === "advance_card" &&
    dependencies.corpAdvanceCompletesScore?.(input, action) === true
  );
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
    input.playerView.opponent.agendaPoints >= 5 &&
    (pressure.hqAgendaExposure ||
      pressure.visibleMultiaccess ||
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
    pressure.eventMultiaccess ||
    pressure.successfulAccessEvents > 0 ||
    pressure.runOrAccessEvents >= 2 ||
    pressure.runnerRunCredits >= 6;
  if (pressure.hqAgendaExposure) return runnerNearWin || liveAccessSignal;
  return liveAccessSignal || pressure.pressure >= 0.7;
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
    return defense.hasImmediateStopPotential;
  }
  return defense.hasImmediateStopPotential || defense.hasMeaningfulTaxOrDamage;
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
  if (actionServerId === "archives") return true;
  if (action.type === "advance_card") return true;
  if (action.type === "install_card") return true;
  if (triage.severity === "critical") {
    return action.type === "gain_credit" || action.type === "draw_card";
  }
  return false;
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
  return actionCandidateHasVisibleSignal(actionSemanticCandidate, [
    "economy",
    "economy_operation",
    "draw_operation",
    "recover_economy",
    "economy.corp_credit_burst",
    "corp_credit_burst",
  ]);
}

function actionHasVisibleImmediateEconomyOrDrawSource(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  const source = semanticRuntimeVisibleSourceCard(input, action);
  if (!source || source.known === false) return false;
  const definition = visibleCardDefinition(source);
  const type = source.type ?? definition?.type;
  if (type !== "operation") return false;
  const text = [source.rulesText, definition?.rulesText]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLocaleLowerCase("de-DE");
  return (
    /\b(?:gain|erhalte|erhält|nimm|nehme)\s+(?:\[\d+\]|\d+)\s+(?:credits?|kredite?|bits?)\b/u.test(
      text,
    ) ||
    /\b(?:draw|ziehe|zieht)\s+\d+\s+(?:cards?|karten?)\b/u.test(text)
  );
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
    ...triage.evidence.slice(0, 12),
  ].join("|");
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
