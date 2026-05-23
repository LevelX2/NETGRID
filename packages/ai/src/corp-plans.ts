import corpPlanProfilesData from "../../../data/ai/corp-plan-profiles-1.4.0.json";
import {
  AI_DECISION_DEBUG_SCHEMA_VERSION,
  DEMO_CARDS_BY_ID,
  type AiDeckDoctrineProfile,
  type AiDecision,
  type AiDecisionActionAlternative,
  type AiDecisionDebug,
  type AiDecisionInput,
  type AiDecisionRankedAlternative,
  type AiDecisionScoreComponent,
  type AiDifficulty,
  type LegalAction,
  type Side,
  type VisibleCard,
} from "@netgrid/shared";
import {
  CARD_ROLES_BY_CARD,
  RUNTIME_CARDS,
  createAiHintsByCard,
} from "./ai-hints";
import {
  beliefDebugSummary,
  reconstructBeliefState,
  type BeliefState,
} from "./belief-state";
import {
  cardDefinitionStrength,
  endTheRunSubroutineCount,
  minimumCreditsToBreakEndTheRunSubroutines,
  serverIdFromEvent,
} from "./visible-run-analysis";

export type CorpPlanKind =
  | "score_now"
  | "score_next_turn"
  | "build_scoring_remote"
  | "protect_hq"
  | "protect_rnd"
  | "recover_economy"
  | "bait_runner";

export type CorpPlanStep = {
  stepId: string;
  actionId: string;
  actionType: LegalAction["type"];
  targetServerId?: string;
  roleTags: string[];
};

export type CorpPlanCandidate = {
  planId: string;
  kind: CorpPlanKind;
  legalActionIds: string[];
  steps: CorpPlanStep[];
  expectedBenefits: string[];
  visibleRisks: string[];
  requiredRoles: string[];
};

export type CorpPlanScore = {
  planId: string;
  score: number;
  confidence: number;
  reasons: string[];
  evidence: string[];
  scoreBreakdown: AiDecisionScoreComponent[];
};

export type CorpPlanDebug = AiDecisionDebug & {
  aiLevel: 2;
  schemaVersion: typeof AI_DECISION_DEBUG_SCHEMA_VERSION;
  planId: string;
  planKind: CorpPlanKind | "fallback";
  selectedActionType: LegalAction["type"] | "none";
  score: number;
  confidence: number;
  visibleReasons: string[];
  evidence: string[];
  fallbackUsed: boolean;
  seed: string;
  profileId: string;
  timeBudgetMs: number;
  timeoutUsed: boolean;
  memoryVersion?: string;
  facts?: string[];
  hypotheses?: string[];
  invalidations?: string[];
  beliefUncertainty?: string[];
  opponentModel?: Record<string, unknown>;
  ownDeckDoctrine?: {
    deckSnapshotId: string;
    side: Side;
    confidence: number;
    archetypeTags: string[];
    riskFlags: string[];
  };
  doctrinePlanWeight?: number;
};

export type CorpPlanDecision = {
  selectedPlanId: string;
  selectedActionId: string;
  selectedActionType: LegalAction["type"] | "none";
  fallbackUsed: boolean;
  score: CorpPlanScore;
  debug: CorpPlanDebug;
};

export type CorpPlanEvaluatorResult = {
  score: number;
  reasons: string[];
  evidence: string[];
};

type CorpPlanProfile = {
  profileId: string;
  legacyProfileIds: string[];
  side: "corp";
  difficulty: AiDifficulty;
  timeBudgetMs: number;
  planBreadth: number;
  riskTolerance: number;
  weights: Record<
    | "agendaRisk"
    | "serverThreat"
    | "economyReserve"
    | "iceRez"
    | "scoringWindow"
    | "remoteIntent",
    number
  >;
};

type CorpPlanFeatures = {
  credits: number;
  clicks: number;
  handCount: number;
  agendaPoints: number;
  opponentAgendaPoints: number;
  agendaPointsToWin: number;
  runnerCredits: number;
  runnerTags: number;
  serverFeatures: Map<
    string,
    {
      iceCount: number;
      rootCount: number;
      knownRootCount: number;
      rezzedIceCount: number;
      unrezzedIceCount: number;
    }
  >;
  ownAgendaCount: number;
  ownAgendaPressure: number;
};

type CorpInstalledEconomyActionKind =
  | "direct_payout"
  | "pool_payout"
  | "side_economy";

type CorpInstalledEconomyActionAssessment = {
  kind: CorpInstalledEconomyActionKind;
  immediateGain: number;
  netCredits: number;
  storedCredits: number;
  futurePoolAfter: number;
  ability: string;
};

type CorpExtraActionOperationAssessment = {
  gainedActions: number;
  actionCost: number;
  expectedFollowupValue: number;
  netValue: number;
  basicCreditFollowupOnly: boolean;
  scoreWindowAfterExtraActions: boolean;
};

type RemoteIntentMemory = {
  remoteInstallSignals: number;
  remoteAdvanceSignals: number;
  remoteScoreSignals: number;
  centralRunSignals: Record<"hq" | "rd", number>;
  evidence: string[];
};

export type RunnerContestCapacity = {
  serverId: string;
  capacity: "low" | "medium" | "high";
  scoreModifier: number;
  runnerCredits: number;
  installedBreakers: number;
  visibleBreakCost?: number;
  reasons: string[];
  evidence: string[];
};

export type RemoteScoreHorizon = {
  actionId: string;
  serverId?: string;
  actionType: LegalAction["type"];
  scoreModifier: number;
  advancementRequirement?: number;
  advancementCountersAfterAction?: number;
  advancesRemainingAfterAction?: number;
  estimatedTurnsToScore?: number;
  contestCapacity?: RunnerContestCapacity["capacity"];
  reasons: string[];
  evidence: string[];
};

export type CorpEvaluationContext = {
  beliefState: BeliefState;
  remoteRootSecurityByActionId: Map<string, number>;
  runnerContestByServerId: Map<string, RunnerContestCapacity>;
  scoreHorizonByActionId: Map<string, RemoteScoreHorizon | undefined>;
};

const AI_HINTS = createAiHintsByCard();
const CORP_PLAN_PROFILES = corpPlanProfilesData.profiles as CorpPlanProfile[];
const PLAN_ACTION_TYPES = new Set<LegalAction["type"]>([
  "score_agenda",
  "advance_card",
  "install_card",
  "play_operation",
  "gain_credit",
  "draw_card",
  "trigger_ability",
  "activated_card_ability",
  "end_turn",
]);

function createCorpEvaluationContext(
  input: AiDecisionInput,
  beliefState: BeliefState = reconstructBeliefState(input),
): CorpEvaluationContext {
  return {
    beliefState,
    remoteRootSecurityByActionId: new Map(),
    runnerContestByServerId: new Map(),
    scoreHorizonByActionId: new Map(),
  };
}

function corpEvaluationContext(
  input: AiDecisionInput,
  contextOrBelief: BeliefState | CorpEvaluationContext = reconstructBeliefState(
    input,
  ),
): CorpEvaluationContext {
  return "remoteRootSecurityByActionId" in contextOrBelief
    ? contextOrBelief
    : createCorpEvaluationContext(input, contextOrBelief);
}

export function hasCorpPlanAction(input: AiDecisionInput): boolean {
  return (
    input.side === "corp" &&
    input.legalActions.some((action) => PLAN_ACTION_TYPES.has(action.type))
  );
}

export function chooseCorpPlanAction(
  input: AiDecisionInput,
  fallbackDecision: AiDecision,
  options: { timeBudgetMs?: number } = {},
): AiDecision {
  const planDecision = chooseCorpPlanDecision(input, options);
  if (planDecision.fallbackUsed || !planDecision.selectedActionId) {
    return {
      ...fallbackDecision,
      decisionDebug: planDecision.debug,
      timeoutUsed:
        planDecision.debug.timeoutUsed || Boolean(fallbackDecision.timeoutUsed),
    };
  }
  const action = input.legalActions.find(
    (candidate) => candidate.actionId === planDecision.selectedActionId,
  );
  if (!action) {
    return {
      ...fallbackDecision,
      decisionDebug: fallbackDebug(
        input,
        fallbackDecision,
        "no_legal_selected_action",
        options.timeBudgetMs,
      ),
      timeoutUsed: Boolean(fallbackDecision.timeoutUsed),
    };
  }
  return {
    actionId: action.actionId,
    reasonCode: `corp.plan.${planDecision.score.planId.split(":")[0]}`,
    explanation: explanationForPlan(planDecision.debug.planKind),
    consideredActionIds: input.legalActions
      .map((candidate) => candidate.actionId)
      .sort(),
    fallbackUsed: false,
    confidence: planDecision.score.confidence,
    evidence: scrubPlanEvidence(planDecision.score.evidence),
    decisionDebug: planDecision.debug,
    timeoutUsed: planDecision.debug.timeoutUsed,
    profileId: input.profileId,
    difficulty: input.difficulty,
    reason: `corp.plan.${planDecision.debug.planKind}`,
  };
}

export function chooseCorpPlanDecision(
  input: AiDecisionInput,
  options: { timeBudgetMs?: number } = {},
): CorpPlanDecision {
  const profile = corpPlanProfile(input);
  const context = createCorpEvaluationContext(input);
  const beliefState = context.beliefState;
  const timeBudgetMs = options.timeBudgetMs ?? profile.timeBudgetMs;
  if (timeBudgetMs <= 0) {
    return fallbackPlanDecision(
      input,
      "time_budget_exhausted",
      timeBudgetMs,
      true,
      beliefState,
    );
  }
  const candidates = generateCorpPlanCandidates(input, context).slice(
    0,
    profile.planBreadth,
  );
  if (candidates.length === 0) {
    return fallbackPlanDecision(
      input,
      "no_plan_candidate",
      timeBudgetMs,
      false,
      beliefState,
    );
  }
  const scored = candidates
    .map((candidate) => ({
      candidate,
      score: evaluateCorpPlan(input, candidate, context),
    }))
    .sort(
      (left, right) =>
        right.score.score - left.score.score ||
        left.candidate.planId.localeCompare(right.candidate.planId),
    );
  const selected = scored[0];
  if (!selected)
    return fallbackPlanDecision(
      input,
      "no_scored_plan",
      timeBudgetMs,
      false,
      beliefState,
    );
  const action = selectPlanAction(input, selected.candidate, context);
  if (!action)
    return fallbackPlanDecision(
      input,
      "plan_without_legal_action",
      timeBudgetMs,
      false,
      beliefState,
    );
  const beliefSummary = beliefDebugSummary(beliefState);
  const opponentModel = toRecord(beliefSummary.corpOpponentModel);
  const doctrinePlanWeight = doctrinePlanWeightFor(
    input,
    selected.candidate.kind,
  );
  return {
    selectedPlanId: selected.candidate.planId,
    selectedActionId: action.actionId,
    selectedActionType: action.type,
    fallbackUsed: false,
    score: selected.score,
    debug: {
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      summary: explanationForPlan(selected.candidate.kind),
      planId: selected.candidate.planId,
      planKind: selected.candidate.kind,
      selectedActionType: action.type,
      score: selected.score.score,
      confidence: selected.score.confidence,
      visibleReasons: selected.score.reasons,
      rankedAlternatives: rankedCorpAlternatives(
        input,
        context,
        scored,
        selected.candidate.planId,
      ),
      actionAlternatives: corpActionAlternativesForPlan(
        input,
        selected.candidate,
        context,
        action.actionId,
      ),
      scoreBreakdown: selected.score.scoreBreakdown,
      whyNot: [],
      longTermPlan: longTermPlanForCorp(input, selected.candidate.kind),
      warnings: selected.candidate.visibleRisks.slice(0, 4),
      detailSections: corpDetailSections(selected.candidate, selected.score),
      evidence: scrubPlanEvidence(selected.score.evidence),
      fallbackUsed: false,
      seed: input.seed,
      profileId: profile.profileId,
      timeBudgetMs,
      timeoutUsed: false,
      ...(input.ownDeckDoctrine
        ? {
            ownDeckDoctrine: deckDoctrineDebug(input.ownDeckDoctrine),
            doctrinePlanWeight,
          }
        : {}),
      memoryVersion: String(beliefSummary.memoryVersion ?? ""),
      facts: toStringArray(beliefSummary.facts),
      hypotheses: toStringArray(beliefSummary.hypotheses),
      invalidations: toStringArray(beliefSummary.invalidations),
      beliefUncertainty: toStringArray(beliefSummary.uncertainty),
      ...(opponentModel ? { opponentModel } : {}),
    },
  };
}

export function generateCorpPlanCandidates(
  input: AiDecisionInput,
  context: CorpEvaluationContext = createCorpEvaluationContext(input),
): CorpPlanCandidate[] {
  if (input.side !== "corp") return [];
  const actions = input.legalActions.slice().sort(compareAction);
  return [
    buildCandidate(
      input,
      "score_now",
      actions.filter((action) => action.type === "score_agenda"),
    ),
    buildCandidate(
      input,
      "score_next_turn",
      actions.filter(
        (action) =>
          action.type === "advance_card" ||
          isAdvancementCounterScoreSetupAction(input, action, context) ||
          (action.type === "play_operation" &&
            Boolean(
              classifyCorpExtraActionOperation(input, action, context)
                ?.scoreWindowAfterExtraActions,
            )) ||
          (action.type === "install_card" &&
            action.payload?.placement !== "ice" &&
            isSafeScoringRootAction(input, action, context)),
      ),
    ),
    buildCandidate(
      input,
      "build_scoring_remote",
      actions.filter(
        (action) =>
          action.type === "install_card" &&
          isRemoteServerId(action.payload?.serverId) &&
          ((action.payload?.placement === "ice" &&
            isRemoteScoringIceInstall(input, action)) ||
            (action.payload?.placement !== "ice" &&
              (!rolesForAction(input, action).some(isAgendaRole) ||
                isSafeScoringRootAction(input, action, context)))),
      ),
    ),
    buildCandidate(
      input,
      "protect_hq",
      actions.filter(
        (action) =>
          action.type === "install_card" &&
          action.payload?.placement === "ice" &&
          action.payload?.serverId === "hq",
      ),
    ),
    buildCandidate(
      input,
      "protect_rnd",
      actions.filter(
        (action) =>
          action.type === "install_card" &&
          action.payload?.placement === "ice" &&
          action.payload?.serverId === "rd",
      ),
    ),
    buildCandidate(
      input,
      "recover_economy",
      actions.filter(
        (action) =>
          action.type === "gain_credit" ||
          action.type === "draw_card" ||
          (action.type === "play_operation" &&
            (rolesForAction(input, action).some(
              (role) => role.includes("economy") || role.includes("draw"),
            ) ||
              Boolean(
                classifyCorpExtraActionOperation(input, action, context),
              ))) ||
          Boolean(classifyCorpInstalledEconomyAction(input, action)),
      ),
    ),
    buildCandidate(
      input,
      "bait_runner",
      actions.filter(
        (action) =>
          action.type === "install_card" &&
          action.payload?.placement !== "ice" &&
          rolesForAction(input, action).some(
            (role) =>
              role === "economy_asset" ||
              role === "asset_trash_target" ||
              role === "upgrade" ||
              role === "remote_support",
          ),
      ),
    ),
  ].filter((candidate): candidate is CorpPlanCandidate => candidate !== null);
}

export function evaluateCorpPlan(
  input: AiDecisionInput,
  candidate: CorpPlanCandidate,
  contextOrBelief: BeliefState | CorpEvaluationContext = reconstructBeliefState(
    input,
  ),
): CorpPlanScore {
  const context = corpEvaluationContext(input, contextOrBelief);
  const beliefState = context.beliefState;
  const profile = corpPlanProfile(input);
  const agendaRisk = evaluateAgendaRisk(input, candidate, context);
  const serverThreat = evaluateServerThreat(input, candidate, beliefState);
  const economyReserve = evaluateEconomyReserve(input, candidate);
  const iceRez = evaluateIceRez(input, candidate);
  const scoringWindow = evaluateScoringWindow(input, candidate);
  const scoringProgress = evaluateCorpScoringProgress(
    input,
    candidate,
    context,
  );
  const runnerContest = evaluateRemoteScoringContest(input, candidate, context);
  const scoringHorizon = evaluateRemoteScoreHorizon(input, candidate, context);
  const remoteRezReserve = evaluateRemoteRezReserve(input, candidate, context);
  const recentRemoteAgendaLoss = evaluateRecentRemoteAgendaLoss(
    input,
    candidate,
    context,
  );
  const advanceProtection = evaluateRemoteAdvanceProtection(
    input,
    candidate,
    context,
  );
  const remoteIntent = evaluateRemoteIntentMemory(input, beliefState);
  const installedEconomy = evaluateCorpInstalledEconomyActions(
    input,
    candidate,
  );
  const extraActions = evaluateCorpExtraActionOperations(
    input,
    candidate,
    context,
  );
  const base = baseScoreForPlan(candidate.kind);
  const doctrinePlanWeight = doctrinePlanWeightFor(input, candidate.kind);
  const score =
    base +
    doctrinePlanWeight +
    agendaRisk.score * profile.weights.agendaRisk +
    serverThreat.score * profile.weights.serverThreat +
    economyReserve.score * profile.weights.economyReserve +
    iceRez.score * profile.weights.iceRez +
    scoringWindow.score * profile.weights.scoringWindow +
    scoringProgress.score +
    runnerContest.score +
    scoringHorizon.score +
    remoteRezReserve.score +
    recentRemoteAgendaLoss.score +
    advanceProtection.score +
    installedEconomy.score +
    extraActions.score +
    remoteIntent.remoteInstallSignals * 8 * profile.weights.remoteIntent +
    remoteIntent.remoteAdvanceSignals * 12 * profile.weights.remoteIntent -
    remoteRootExposurePenalty(
      input,
      candidate,
      profile.riskTolerance,
      context,
    ) -
    visibleRiskPenalty(candidate, profile.riskTolerance);
  const evidence = [
    `plan:${candidate.kind}`,
    `difficulty:${input.difficulty}`,
    `doctrine_plan_weight:${doctrinePlanWeight}`,
    ...recentRemoteAgendaLoss.evidence,
    ...advanceProtection.evidence,
    ...runnerContest.evidence,
    ...scoringHorizon.evidence,
    ...(input.ownDeckDoctrine
      ? [
          `doctrine:${input.ownDeckDoctrine.archetypeTags.slice(0, 3).join(",") || "neutral"}`,
        ]
      : ["doctrine:neutral"]),
    ...candidate.expectedBenefits,
    ...installedEconomy.evidence,
    ...extraActions.evidence,
    ...agendaRisk.evidence,
    ...serverThreat.evidence,
    ...economyReserve.evidence,
    ...iceRez.evidence,
    ...scoringWindow.evidence,
    ...scoringProgress.evidence,
    ...remoteRootExposureEvidence(input, candidate, context),
    ...remoteRezReserve.evidence,
    ...remoteIntent.evidence,
    `belief_version:${beliefState.version}`,
    ...(beliefState.corpOpponentModel
      ? [
          `runner_contest_probability:${round(beliefState.corpOpponentModel.remoteContestProbability)}`,
        ]
      : []),
  ];
  return {
    planId: candidate.planId,
    score: roundScore(score),
    confidence: confidence(score, candidate.legalActionIds.length),
    scoreBreakdown: scoreComponents([
      ["base", "Grundplan", base, 1, `plan:${candidate.kind}`],
      [
        "doctrine",
        "Deck-Doctrine",
        doctrinePlanWeight,
        1,
        "doctrine_plan_weight",
      ],
      [
        "agendaRisk",
        "Agenda-Risiko",
        agendaRisk.score * profile.weights.agendaRisk,
        profile.weights.agendaRisk,
        firstReason(agendaRisk.reasons),
      ],
      [
        "serverThreat",
        "Serverdruck",
        serverThreat.score * profile.weights.serverThreat,
        profile.weights.serverThreat,
        firstReason(serverThreat.reasons),
      ],
      [
        "economyReserve",
        "Credit-Reserve",
        economyReserve.score * profile.weights.economyReserve,
        profile.weights.economyReserve,
        firstReason(economyReserve.reasons),
      ],
      [
        "iceRez",
        "ICE-Rez",
        iceRez.score * profile.weights.iceRez,
        profile.weights.iceRez,
        firstReason(iceRez.reasons),
      ],
      [
        "scoringWindow",
        "Scoring-Fenster",
        scoringWindow.score * profile.weights.scoringWindow,
        profile.weights.scoringWindow,
        firstReason(scoringWindow.reasons),
      ],
      [
        "scoringProgress",
        "Scoring-Fortschritt",
        scoringProgress.score,
        1,
        firstReason(scoringProgress.reasons),
      ],
      [
        "runnerContest",
        "Runner-Contest",
        runnerContest.score,
        1,
        firstReason(runnerContest.reasons),
      ],
      [
        "scoringHorizon",
        "Scoring-Horizont",
        scoringHorizon.score,
        1,
        firstReason(scoringHorizon.reasons),
      ],
      [
        "remoteRezReserve",
        "Remote-Rez-Reserve",
        remoteRezReserve.score,
        1,
        firstReason(remoteRezReserve.reasons),
      ],
      [
        "recentRemoteAgendaLoss",
        "Remote-Agenda-Verlust",
        recentRemoteAgendaLoss.score,
        1,
        firstReason(recentRemoteAgendaLoss.reasons),
      ],
      [
        "advanceProtection",
        "Advance-Schutz",
        advanceProtection.score,
        1,
        firstReason(advanceProtection.reasons),
      ],
      [
        "installedEconomy",
        "Installierte Economy",
        installedEconomy.score,
        1,
        firstReason(installedEconomy.reasons),
      ],
      [
        "extraActions",
        "Extra-Aktionen",
        extraActions.score,
        1,
        firstReason(extraActions.reasons),
      ],
      [
        "remoteIntent",
        "Remote-Intent-Memory",
        remoteIntent.remoteInstallSignals * 8 * profile.weights.remoteIntent +
          remoteIntent.remoteAdvanceSignals * 12 * profile.weights.remoteIntent,
        profile.weights.remoteIntent,
        firstReason(remoteIntent.evidence),
      ],
      [
        "visibleRisk",
        "Sichtbares Risiko",
        -visibleRiskPenalty(candidate, profile.riskTolerance),
        1,
        firstReason(candidate.visibleRisks),
      ],
    ]),
    reasons: sortedUnique([
      ...agendaRisk.reasons,
      ...serverThreat.reasons,
      ...economyReserve.reasons,
      ...iceRez.reasons,
      ...scoringWindow.reasons,
      ...scoringProgress.reasons,
      ...runnerContest.reasons,
      ...scoringHorizon.reasons,
      ...remoteRezReserve.reasons,
      ...recentRemoteAgendaLoss.reasons,
      ...advanceProtection.reasons,
      ...installedEconomy.reasons,
      ...extraActions.reasons,
    ]).slice(0, 6),
    evidence: scrubPlanEvidence(evidence),
  };
}

export function evaluateAgendaRisk(
  input: AiDecisionInput,
  candidate: CorpPlanCandidate,
  context: CorpEvaluationContext = createCorpEvaluationContext(input),
): CorpPlanEvaluatorResult {
  const features = extractCorpPlanFeatures(input);
  const scorePressure =
    Math.max(0, features.opponentAgendaPoints - features.agendaPoints) * 20;
  const closeToWin = Math.max(
    0,
    features.agendaPointsToWin - features.agendaPoints <= 2 ? 40 : 0,
  );
  const actions = actionsForCandidate(input, candidate);
  const hasProtectedAgendaInstall = actions.some(
    (action) =>
      action.type === "install_card" &&
      action.payload?.placement !== "ice" &&
      rolesForAction(input, action).some(isAgendaRole) &&
      remoteRootActionSecurityScore(input, action, context) > 0,
  );
  const protectedRemoteAvailable = input.legalActions.some(
    (action) =>
      action.type === "install_card" &&
      action.payload?.placement !== "ice" &&
      rolesForAction(input, action).some(isAgendaRole) &&
      remoteRootActionSecurityScore(input, action, context) > 0,
  );
  const hasRemoteIceInstall = actions.some(
    (action) =>
      action.type === "install_card" &&
      action.payload?.placement === "ice" &&
      isRemoteServerId(action.payload?.serverId),
  );
  const reserve = bestRemoteRezReserveNeed(input, context);
  const rezReserveAvailable =
    !reserve || features.credits >= reserve.reserveTarget;
  const agendaFloodScore = agendaFloodPlanScore(candidate, features, {
    hasProtectedAgendaInstall,
    protectedRemoteAvailable,
    hasRemoteIceInstall,
    rezReserveAvailable,
  });
  const publicScoreRisk =
    candidate.kind === "score_now"
      ? 180 + closeToWin
      : candidate.kind === "score_next_turn" ||
          candidate.kind === "build_scoring_remote"
        ? 70 - scorePressure
        : -10;
  const score = publicScoreRisk + agendaFloodScore;
  return {
    score,
    reasons: sortedUnique([
      candidate.kind === "score_now"
        ? "score_window_visible"
        : "agenda_risk_from_public_score",
      ...(features.ownAgendaPressure > 0
        ? [
            "own_agenda_pressure",
            ...(hasProtectedAgendaInstall
              ? ["protected_remote_available"]
              : []),
            ...(hasRemoteIceInstall && !protectedRemoteAvailable
              ? ["prepare_protected_remote"]
              : []),
            ...(!rezReserveAvailable ? ["remote_rez_reserve_unavailable"] : []),
          ]
        : []),
    ]),
    evidence: [
      `agenda_own:${features.agendaPoints}`,
      `agenda_runner:${features.opponentAgendaPoints}`,
      `agenda_to_win:${features.agendaPointsToWin}`,
      `own_agenda_count:${features.ownAgendaCount}`,
      `ownAgendaPressure:${features.ownAgendaPressure}`,
      `protectedRemoteAvailable:${protectedRemoteAvailable}`,
      `rezReserveAvailable:${rezReserveAvailable}`,
    ],
  };
}

function agendaFloodPlanScore(
  candidate: CorpPlanCandidate,
  features: CorpPlanFeatures,
  flags: {
    hasProtectedAgendaInstall: boolean;
    protectedRemoteAvailable: boolean;
    hasRemoteIceInstall: boolean;
    rezReserveAvailable: boolean;
  },
): number {
  const ownAgendaPressure = features.ownAgendaPressure;
  if (ownAgendaPressure <= 0) return 0;
  if (candidate.kind === "score_now")
    return Math.round(ownAgendaPressure * 1.25);
  if (
    (candidate.kind === "score_next_turn" ||
      candidate.kind === "build_scoring_remote") &&
    flags.hasProtectedAgendaInstall
  ) {
    return flags.rezReserveAvailable
      ? Math.round(ownAgendaPressure * 1.15)
      : Math.round(ownAgendaPressure * 0.2);
  }
  if (
    candidate.kind === "build_scoring_remote" &&
    !flags.protectedRemoteAvailable &&
    flags.hasRemoteIceInstall
  ) {
    return Math.round(ownAgendaPressure * 0.9);
  }
  if (
    candidate.kind === "recover_economy" &&
    flags.protectedRemoteAvailable &&
    !flags.rezReserveAvailable
  ) {
    return Math.round(ownAgendaPressure * 0.95);
  }
  if (candidate.kind === "protect_hq" && !flags.protectedRemoteAvailable) {
    return Math.round(ownAgendaPressure * 0.7);
  }
  return -Math.round(ownAgendaPressure * 0.25);
}

export function evaluateServerThreat(
  input: AiDecisionInput,
  candidate: CorpPlanCandidate,
  beliefState: BeliefState = reconstructBeliefState(input),
): CorpPlanEvaluatorResult {
  const features = extractCorpPlanFeatures(input);
  const memory = evaluateRemoteIntentMemory(input, beliefState);
  const threatModel = beliefState.corpOpponentModel?.runnerThreatModel;
  const hq = features.serverFeatures.get("hq");
  const rd = features.serverFeatures.get("rd");
  const hqThreat =
    memory.centralRunSignals.hq * 45 -
    (hq?.iceCount ?? 0) * 25 +
    (threatModel?.hqPressure ?? 0) * 40;
  const rdThreat =
    memory.centralRunSignals.rd * 45 -
    (rd?.iceCount ?? 0) * 25 +
    (threatModel?.rndPressure ?? 0) * 40;
  const score =
    candidate.kind === "protect_hq"
      ? 120 + hqThreat
      : candidate.kind === "protect_rnd"
        ? 120 + rdThreat
        : candidate.kind === "build_scoring_remote"
          ? Math.max(0, 35 - Math.max(hqThreat, rdThreat))
          : -5;
  return {
    score,
    reasons: ["server_threat_from_visible_board"],
    evidence: [
      `hq_ice:${hq?.iceCount ?? 0}`,
      `rd_ice:${rd?.iceCount ?? 0}`,
      `hq_runs:${memory.centralRunSignals.hq}`,
      `rd_runs:${memory.centralRunSignals.rd}`,
      `runner_remote_pressure:${round(threatModel?.remotePressure ?? 0)}`,
    ],
  };
}

export function evaluateEconomyReserve(
  input: AiDecisionInput,
  candidate: CorpPlanCandidate,
): CorpPlanEvaluatorResult {
  const features = extractCorpPlanFeatures(input);
  const hasEconomyRole = candidate.requiredRoles.some(
    (role) => role.includes("economy") || role.includes("draw"),
  );
  const lowCredits = features.credits < 5;
  const centralProtectPenalty = lowReserveCentralProtectPenalty(
    input,
    candidate,
    features,
  );
  const score =
    candidate.kind === "recover_economy"
      ? (lowCredits ? 170 : 80) + (hasEconomyRole ? 45 : 0)
      : lowCredits
        ? -40 - centralProtectPenalty
        : 20;
  return {
    score,
    reasons: sortedUnique([
      lowCredits ? "credit_reserve_low" : "credit_reserve_stable",
      ...(centralProtectPenalty > 0
        ? ["central_protect_credit_reserve_low"]
        : []),
    ]),
    evidence: [
      `credits:${features.credits}`,
      `clicks:${features.clicks}`,
      `economy_role:${hasEconomyRole}`,
      `central_protect_penalty:${centralProtectPenalty}`,
    ],
  };
}

function evaluateCorpInstalledEconomyActions(
  input: AiDecisionInput,
  candidate: CorpPlanCandidate,
): CorpPlanEvaluatorResult {
  if (candidate.kind !== "recover_economy")
    return { score: 0, reasons: [], evidence: [] };
  const assessments = candidate.legalActionIds
    .map((actionId) =>
      input.legalActions.find((action) => action.actionId === actionId),
    )
    .map((action) =>
      action ? classifyCorpInstalledEconomyAction(input, action) : undefined,
    )
    .filter((assessment): assessment is CorpInstalledEconomyActionAssessment =>
      Boolean(assessment),
    );
  if (assessments.length === 0)
    return {
      score: 0,
      reasons: [],
      evidence: ["installed_corp_economy:false"],
    };

  const best = assessments
    .slice()
    .sort(
      (left, right) =>
        right.netCredits - left.netCredits ||
        right.immediateGain - left.immediateGain ||
        left.ability.localeCompare(right.ability),
    )[0]!;
  const acuteNeed = input.playerView.own.credits < 5;
  const score =
    95 + Math.max(0, best.netCredits - 1) * 55 + (acuteNeed ? 110 : 40);
  return {
    score,
    reasons: [
      best.kind === "pool_payout"
        ? "installed_corp_economy_pool_payout"
        : "installed_corp_economy_direct_payout",
    ],
    evidence: [
      "installed_corp_economy:true",
      `installed_corp_economy_kind:${best.kind}`,
      `installed_corp_economy_immediate_gain:${best.immediateGain}`,
      `installed_corp_economy_net_credits:${best.netCredits}`,
      `installed_corp_economy_stored_credits:${best.storedCredits}`,
      `installed_corp_economy_future_pool_after:${best.futurePoolAfter}`,
      `corp_credit_need:${acuteNeed ? "acute" : "stable"}`,
    ],
  };
}

function evaluateCorpExtraActionOperations(
  input: AiDecisionInput,
  candidate: CorpPlanCandidate,
  context: CorpEvaluationContext,
): CorpPlanEvaluatorResult {
  const assessments = candidate.legalActionIds
    .map((actionId) =>
      input.legalActions.find((action) => action.actionId === actionId),
    )
    .map((action) =>
      action
        ? classifyCorpExtraActionOperation(input, action, context)
        : undefined,
    )
    .filter((assessment): assessment is CorpExtraActionOperationAssessment =>
      Boolean(assessment),
    );
  if (assessments.length === 0)
    return {
      score: 0,
      reasons: [],
      evidence: ["extra_action_expected_value:none"],
    };

  const best = assessments
    .slice()
    .sort(
      (left, right) =>
        Number(right.scoreWindowAfterExtraActions) -
          Number(left.scoreWindowAfterExtraActions) ||
        right.netValue - left.netValue ||
        right.expectedFollowupValue - left.expectedFollowupValue,
    )[0]!;
  const score = best.scoreWindowAfterExtraActions
    ? 190
    : best.basicCreditFollowupOnly && best.netValue < 0
      ? -260
      : best.netValue < 0
        ? -130
        : 40 + best.netValue * 35;
  return {
    score,
    reasons: [
      best.scoreWindowAfterExtraActions
        ? "score_window_after_extra_actions"
        : best.basicCreditFollowupOnly
          ? "basic_credit_followup_only"
          : best.netValue < 0
            ? "extra_action_net_loss"
            : "extra_action_positive_sequence",
    ],
    evidence: [
      `extra_action_expected_value:${best.expectedFollowupValue}`,
      `extra_action_cost:${best.actionCost}`,
      `overtime_net_value:${best.netValue}`,
      `score_window_after_extra_actions:${best.scoreWindowAfterExtraActions}`,
      `basic_credit_followup_only:${best.basicCreditFollowupOnly}`,
    ],
  };
}

function classifyCorpInstalledEconomyAction(
  input: AiDecisionInput,
  action: LegalAction,
): CorpInstalledEconomyActionAssessment | undefined {
  if (input.side !== "corp" || action.side !== "corp") return undefined;
  if (action.source === "basic_action" || action.source === "game_rule")
    return undefined;
  if (
    action.type !== "gain_credit" &&
    action.type !== "trigger_ability" &&
    action.type !== "activated_card_ability"
  )
    return undefined;
  const sourceCard = findVisibleCard(input, action.source);
  if (!sourceCard || sourceCard.rezzed !== true) return undefined;
  const installedInServer = input.playerView.servers.some((server) =>
    server.root.some(
      (card) => card.instanceId === sourceCard.instanceId && card.known,
    ),
  );
  if (!installedInServer) return undefined;
  const ability =
    [
      action.payload?.v1917AssetAbility,
      action.payload?.v1919AssetAbility,
      action.payload?.v1920AssetAbility,
      action.payload?.cardImplementationAbilityLabel,
      action.payload?.cardImplementationAbility,
      action.payload?.resourceAbility,
      action.payload?.abilityId,
    ].find((value): value is string => typeof value === "string") ?? "";
  const storedCredits = Math.max(
    0,
    sourceCard.counters?.bit ??
      sourceCard.counters?.power ??
      sourceCard.counters?.recurring_credit ??
      0,
  );
  const activatedGain = activatedCardAbilityCreditGain(action, storedCredits);
  const immediateGain = Math.max(
    0,
    activatedGain,
    numberPayload(action, "gainCreditsAmount"),
    numberPayload(action, "gainedCredits"),
    numberPayload(action, "amount"),
    numberPayload(action, "removeCounterAmount"),
    numberPayload(action, "removePowerCounterAmount"),
  );
  const removedCounters = Math.max(
    0,
    activatedGain,
    numberPayload(action, "removeCounterAmount"),
    numberPayload(action, "removePowerCounterAmount"),
    numberPayload(action, "removedCounterAmount"),
  );
  const netCredits = immediateGain - actionCreditCost(action);
  if (immediateGain <= 0 && netCredits <= 0) return undefined;
  const futurePoolAfter = Math.max(
    0,
    storedCredits - Math.max(removedCounters, immediateGain),
  );
  const roles = rolesForCardId(sourceCard.definitionId);
  const kind: CorpInstalledEconomyActionKind =
    storedCredits > 0 || removedCounters > 0
      ? "pool_payout"
      : roles.some((role) => role.includes("economy"))
        ? "direct_payout"
        : "side_economy";
  return {
    kind,
    immediateGain,
    netCredits,
    storedCredits,
    futurePoolAfter,
    ability: ability || "corp_installed_credit_payout",
  };
}

function activatedCardAbilityCreditGain(
  action: LegalAction,
  storedCredits: number,
): number {
  if (action.type !== "activated_card_ability") return 0;
  const label =
    typeof action.payload?.cardImplementationAbilityLabel === "string"
      ? action.payload.cardImplementationAbilityLabel
      : action.label;
  const match = /(\d+)\s+Credits?\s+nehmen/i.exec(label);
  if (!match) return 0;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0 || storedCredits < amount)
    return 0;
  return amount;
}

function classifyCorpExtraActionOperation(
  input: AiDecisionInput,
  action: LegalAction,
  context: CorpEvaluationContext,
): CorpExtraActionOperationAssessment | undefined {
  if (
    input.side !== "corp" ||
    action.side !== "corp" ||
    action.type !== "play_operation"
  )
    return undefined;
  const sourceCard = findVisibleCard(input, action.source);
  const gainedActions = extraActionsForCard(sourceCard?.definitionId, action);
  if (gainedActions <= 0) return undefined;

  const actionCost = actionCreditCost(action);
  const creditsAfterOperation = input.playerView.own.credits - actionCost;
  const availableClicksAfterOperation = Math.max(
    0,
    input.playerView.own.clicks - actionClickCost(action) + gainedActions,
  );
  const followups = input.legalActions.filter(
    (candidate) =>
      candidate.actionId !== action.actionId && candidate.side === "corp",
  );
  const basicCreditFollowupAvailable = followups.some(
    (candidate) =>
      candidate.type === "gain_credit" && candidate.source === "basic_action",
  );
  const scoreWindowAfterExtraActions =
    availableClicksAfterOperation >= 2 &&
    followups.some((candidate) => {
      if (candidate.type !== "advance_card") return false;
      if (creditsAfterOperation < actionCreditCost(candidate)) return false;
      const horizon = remoteScoreHorizonForAction(input, candidate, context);
      return Boolean(horizon && horizon.advancesRemainingAfterAction === 0);
    });
  const valuableFollowupAvailable = followups.some((candidate) => {
    if (candidate.type === "score_agenda")
      return availableClicksAfterOperation >= 1;
    if (
      candidate.type === "install_card" &&
      candidate.payload?.placement !== "ice"
    )
      return rolesForAction(input, candidate).some(isAgendaRole);
    if (candidate.type === "advance_card")
      return Boolean(remoteScoreHorizonForAction(input, candidate, context));
    return Boolean(classifyCorpInstalledEconomyAction(input, candidate));
  });
  const expectedFollowupValue = scoreWindowAfterExtraActions
    ? actionCost + 4
    : valuableFollowupAvailable
      ? Math.max(3, gainedActions)
      : basicCreditFollowupAvailable
        ? gainedActions
        : 0;
  return {
    gainedActions,
    actionCost,
    expectedFollowupValue,
    netValue: expectedFollowupValue - actionCost,
    basicCreditFollowupOnly:
      basicCreditFollowupAvailable &&
      !valuableFollowupAvailable &&
      !scoreWindowAfterExtraActions,
    scoreWindowAfterExtraActions,
  };
}

function lowReserveCentralProtectPenalty(
  input: AiDecisionInput,
  candidate: CorpPlanCandidate,
  features: CorpPlanFeatures,
): number {
  if (candidate.kind !== "protect_hq" && candidate.kind !== "protect_rnd")
    return 0;
  if (features.credits > 1) return 0;
  const serverId = candidate.kind === "protect_hq" ? "hq" : "rd";
  const server = features.serverFeatures.get(serverId);
  const recentPressure = input.eventTail.filter(
    (event) =>
      serverIdFromEvent(event) === serverId &&
      (event.type.includes("run") ||
        event.type.includes("access") ||
        event.type.includes("breach")),
  ).length;
  if (recentPressure >= 2 && (server?.iceCount ?? 0) === 0) return 0;
  return 180;
}

export function evaluateIceRez(
  input: AiDecisionInput,
  candidate: CorpPlanCandidate,
): CorpPlanEvaluatorResult {
  const features = extractCorpPlanFeatures(input);
  const iceRoles = candidate.requiredRoles.filter(
    (role) =>
      role.endsWith("_ice") ||
      role === "etr_ice" ||
      role === "taxing_ice" ||
      role === "tag_ice",
  );
  const score =
    candidate.kind === "protect_hq" || candidate.kind === "protect_rnd"
      ? 60 + iceRoles.length * 20 + Math.min(features.credits, 8) * 4
      : iceRoles.length * 12;
  return {
    score,
    reasons:
      iceRoles.length > 0 ? ["ice_roles_available"] : ["no_ice_role_needed"],
    evidence: [
      `ice_roles:${iceRoles.length}`,
      `runner_credits_visible:${features.runnerCredits}`,
    ],
  };
}

export function evaluateScoringWindow(
  input: AiDecisionInput,
  candidate: CorpPlanCandidate,
): CorpPlanEvaluatorResult {
  const features = extractCorpPlanFeatures(input);
  const hasScoreAction = candidate.legalActionIds.some(
    (actionId) =>
      input.legalActions.find((action) => action.actionId === actionId)
        ?.type === "score_agenda",
  );
  const hasAdvanceAction = candidate.legalActionIds.some((actionId) => {
    const action = input.legalActions.find(
      (candidateAction) => candidateAction.actionId === actionId,
    );
    return Boolean(
      action &&
      (action.type === "advance_card" ||
        isAdvancementCounterScoreSetupAction(input, action)),
    );
  });
  const score = hasScoreAction
    ? 360
    : hasAdvanceAction && features.clicks >= 2
      ? 140
      : candidate.kind === "score_next_turn"
        ? 45
        : 0;
  return {
    score,
    reasons: hasScoreAction
      ? ["legal_score_action"]
      : hasAdvanceAction
        ? ["legal_advance_action"]
        : ["no_current_score_window"],
    evidence: [
      `score_action:${hasScoreAction}`,
      `advance_action:${hasAdvanceAction}`,
      `clicks:${features.clicks}`,
    ],
  };
}

export function evaluateCorpScoringProgress(
  input: AiDecisionInput,
  candidate: CorpPlanCandidate,
  context: CorpEvaluationContext = createCorpEvaluationContext(input),
): CorpPlanEvaluatorResult {
  const features = extractCorpPlanFeatures(input);
  const hqIce = features.serverFeatures.get("hq")?.iceCount ?? 0;
  const rdIce = features.serverFeatures.get("rd")?.iceCount ?? 0;
  const centralIce = hqIce + rdIce;
  const stalledWithoutPoints =
    features.agendaPoints === 0 && input.actionNumber >= 24;
  const lateWithoutPoints =
    features.agendaPoints === 0 && input.actionNumber >= 48;
  const scoreActions = actionsForCandidate(input, candidate);
  const hasScoreAction = scoreActions.some(
    (action) => action.type === "score_agenda",
  );
  const hasProtectedAgendaInstall = scoreActions.some(
    (action) =>
      action.type === "install_card" &&
      action.payload?.placement !== "ice" &&
      rolesForAction(input, action).some(isAgendaRole) &&
      remoteRootActionSecurityScore(input, action, context) > 0,
  );
  let score = 0;
  const reasons: string[] = [];

  if (candidate.kind === "score_now" && hasScoreAction) {
    score += 260;
    reasons.push("corp_score_window_close_now");
  }
  if (
    (candidate.kind === "score_next_turn" ||
      candidate.kind === "build_scoring_remote") &&
    hasProtectedAgendaInstall
  ) {
    score += stalledWithoutPoints ? 120 : 55;
    if (lateWithoutPoints) score += 55;
    reasons.push("protected_agenda_scoring_progress");
  }
  if (
    (candidate.kind === "protect_hq" || candidate.kind === "protect_rnd") &&
    stalledWithoutPoints &&
    hqIce > 0 &&
    rdIce > 0
  ) {
    score -= lateWithoutPoints ? 105 : 65;
    reasons.push("central_defense_saturated_before_scoring");
  }

  return {
    score,
    reasons,
    evidence: [
      `scoring_progress_score:${score}`,
      `corp_points:${features.agendaPoints}`,
      `scoring_progress_action:${input.actionNumber}`,
      `central_ice:${centralIce}`,
      `protected_agenda_install:${hasProtectedAgendaInstall}`,
      `score_now_action:${hasScoreAction}`,
    ],
  };
}

function evaluateRemoteScoringContest(
  input: AiDecisionInput,
  candidate: CorpPlanCandidate,
  context: CorpEvaluationContext,
): CorpPlanEvaluatorResult {
  if (
    candidate.kind !== "build_scoring_remote" &&
    candidate.kind !== "score_next_turn"
  ) {
    return { score: 0, reasons: [], evidence: [] };
  }
  const serverIds = sortedUnique(
    actionsForCandidate(input, candidate)
      .map((action) => remoteServerIdForAction(input, action))
      .filter((serverId): serverId is string =>
        Boolean(serverId?.startsWith("remote_")),
      ),
  );
  if (serverIds.length === 0)
    return {
      score: 0,
      reasons: [],
      evidence: ["runner_contest_capacity:none"],
    };
  const assessments = serverIds
    .map((serverId) => evaluateRunnerContestCapacity(input, serverId, context))
    .sort(
      (left, right) =>
        right.scoreModifier - left.scoreModifier ||
        left.serverId.localeCompare(right.serverId),
    );
  const assessment = assessments[0]!;
  return {
    score: assessment.scoreModifier,
    reasons: assessment.reasons,
    evidence: assessment.evidence,
  };
}

export function evaluateRunnerContestCapacity(
  input: AiDecisionInput,
  serverId: string,
  contextOrBelief: BeliefState | CorpEvaluationContext = reconstructBeliefState(
    input,
  ),
): RunnerContestCapacity {
  const context = corpEvaluationContext(input, contextOrBelief);
  const cached = context.runnerContestByServerId.get(serverId);
  if (cached) return cached;
  const result = computeRunnerContestCapacity(
    input,
    serverId,
    context.beliefState,
  );
  context.runnerContestByServerId.set(serverId, result);
  return result;
}

function computeRunnerContestCapacity(
  input: AiDecisionInput,
  serverId: string,
  beliefState: BeliefState,
): RunnerContestCapacity {
  const runnerCredits = input.playerView.opponent.credits;
  const rigCards = input.playerView.opponent.rig ?? [];
  const installedBreakers = rigCards.filter(
    (card) =>
      card.known &&
      card.definitionId &&
      RUNTIME_CARDS[card.definitionId]?.subtypes.includes("icebreaker"),
  ).length;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  const remotePressure =
    beliefState.corpOpponentModel?.runnerThreatModel.remotePressure ?? 0;
  if (!server || !serverId.startsWith("remote_")) {
    return runnerContestCapacityResult(
      serverId,
      "high",
      runnerCredits,
      installedBreakers,
      undefined,
      ["runner_remote_contest_invalid_server"],
      [
        `runner_contest_capacity:high`,
        `runner_credits_visible:${runnerCredits}`,
        `runner_breakers_visible:${installedBreakers}`,
        "remote_ice:0",
      ],
    );
  }
  if (server.ice.length <= 0) {
    return runnerContestCapacityResult(
      serverId,
      "high",
      runnerCredits,
      installedBreakers,
      0,
      ["runner_remote_contest_unprotected"],
      [
        `runner_contest_capacity:high`,
        `runner_credits_visible:${runnerCredits}`,
        `runner_breakers_visible:${installedBreakers}`,
        "remote_ice:0",
      ],
    );
  }

  const knownPath = assessKnownIcePathForRunnerContest(
    server.ice,
    rigCards,
    runnerCredits,
  );
  const evidence = [
    `runner_contest_capacity:${knownPath.capacity}`,
    `runner_credits_visible:${runnerCredits}`,
    `runner_breakers_visible:${installedBreakers}`,
    `remote_ice:${server.ice.length}`,
    `remote_rezzed_ice:${server.ice.filter((ice) => ice.rezzed === true).length}`,
    `remote_unrezzed_ice:${server.ice.filter((ice) => ice.rezzed !== true).length}`,
    `visible_break_cost:${knownPath.visibleBreakCost ?? "unknown"}`,
    `runner_remote_pressure:${round(remotePressure)}`,
  ];
  return runnerContestCapacityResult(
    serverId,
    knownPath.capacity,
    runnerCredits,
    installedBreakers,
    knownPath.visibleBreakCost,
    knownPath.reasons,
    evidence,
  );
}

export function evaluateRemoteScoreHorizon(
  input: AiDecisionInput,
  candidate: CorpPlanCandidate,
  contextOrBelief: BeliefState | CorpEvaluationContext = reconstructBeliefState(
    input,
  ),
): CorpPlanEvaluatorResult {
  const context = corpEvaluationContext(input, contextOrBelief);
  if (
    candidate.kind !== "score_now" &&
    candidate.kind !== "score_next_turn" &&
    candidate.kind !== "build_scoring_remote"
  ) {
    return { score: 0, reasons: [], evidence: [] };
  }
  const horizons = actionsForCandidate(input, candidate)
    .map((action) => remoteScoreHorizonForAction(input, action, context))
    .filter((horizon): horizon is RemoteScoreHorizon => Boolean(horizon))
    .sort(
      (left, right) =>
        right.scoreModifier - left.scoreModifier ||
        left.actionId.localeCompare(right.actionId),
    );
  const best = horizons[0];
  if (!best) return { score: 0, reasons: [], evidence: ["score_horizon:none"] };
  return {
    score: best.scoreModifier,
    reasons: best.reasons,
    evidence: best.evidence,
  };
}

export function evaluateRemoteRezReserve(
  input: AiDecisionInput,
  candidate: CorpPlanCandidate,
  contextOrBelief: BeliefState | CorpEvaluationContext = reconstructBeliefState(
    input,
  ),
): CorpPlanEvaluatorResult {
  const context = corpEvaluationContext(input, contextOrBelief);
  const features = extractCorpPlanFeatures(input);
  if (candidate.kind === "recover_economy") {
    const reserve = bestRemoteRezReserveNeed(input, context);
    if (!reserve)
      return { score: 0, reasons: [], evidence: ["remote_rez_reserve:none"] };
    const bestCreditsAfterEconomy = Math.max(
      features.credits,
      ...actionsForCandidate(input, candidate).map((action) =>
        creditsAfterCorpPlanAction(input, action),
      ),
    );
    const hasScoringLine = hasRemoteScoringLegalAction(input, context);
    if (features.credits < reserve.reserveTarget) {
      const closesReserveGap = bestCreditsAfterEconomy >= reserve.reserveTarget;
      return {
        score: closesReserveGap ? 125 : 70,
        reasons: ["remote_rez_reserve_building"],
        evidence: [
          `remote_rez_reserve_server:${reserve.serverId}`,
          `remote_rez_reserve_target:${reserve.reserveTarget}`,
          `remote_rez_reserve_credits:${features.credits}`,
          `remote_rez_reserve_after_action:${bestCreditsAfterEconomy}`,
          `remote_rez_reserve_gap:${Math.max(0, reserve.reserveTarget - features.credits)}`,
        ],
      };
    }
    if (hasScoringLine) {
      return {
        score: -90,
        reasons: ["remote_rez_reserve_ready_for_score_line"],
        evidence: [
          `remote_rez_reserve_server:${reserve.serverId}`,
          `remote_rez_reserve_target:${reserve.reserveTarget}`,
          `remote_rez_reserve_credits:${features.credits}`,
          "remote_rez_reserve_scoring_line:true",
        ],
      };
    }
    return {
      score: 0,
      reasons: ["remote_rez_reserve_stable"],
      evidence: [
        `remote_rez_reserve_server:${reserve.serverId}`,
        `remote_rez_reserve_target:${reserve.reserveTarget}`,
        `remote_rez_reserve_credits:${features.credits}`,
      ],
    };
  }

  if (
    candidate.kind !== "score_next_turn" &&
    candidate.kind !== "build_scoring_remote"
  ) {
    return { score: 0, reasons: [], evidence: [] };
  }

  const assessments = actionsForCandidate(input, candidate)
    .map((action) => remoteRezReserveForAction(input, action, context))
    .filter((assessment): assessment is CorpPlanEvaluatorResult =>
      Boolean(assessment),
    )
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.evidence.join("|").localeCompare(right.evidence.join("|")),
    );
  const best = assessments[0];
  if (!best)
    return { score: 0, reasons: [], evidence: ["remote_rez_reserve:none"] };
  return best;
}

function evaluateRecentRemoteAgendaLoss(
  input: AiDecisionInput,
  candidate: CorpPlanCandidate,
  context: CorpEvaluationContext,
): CorpPlanEvaluatorResult {
  if (
    candidate.kind !== "score_next_turn" &&
    candidate.kind !== "build_scoring_remote"
  ) {
    return { score: 0, reasons: [], evidence: [] };
  }
  const recentLossServers = recentRemoteAgendaLossServerIds(input);
  if (recentLossServers.length === 0) {
    return {
      score: 0,
      reasons: [],
      evidence: ["recent_remote_agenda_loss:false"],
    };
  }
  const agendaSetupActions = actionsForCandidate(input, candidate).filter(
    (action) => isRemoteAgendaSetupAction(input, action),
  );
  if (agendaSetupActions.length === 0) {
    return {
      score: 0,
      reasons: [],
      evidence: [
        `recent_remote_agenda_loss:${recentLossServers.join(",")}`,
        "recent_remote_agenda_repeat:false",
      ],
    };
  }
  const riskyActions = agendaSetupActions.filter((action) =>
    isRiskyRemoteAgendaSetupAction(input, action, context),
  );
  const riskyRepeat = riskyActions.length > 0;
  return {
    score: riskyRepeat ? -240 : -45,
    reasons: [
      riskyRepeat
        ? "recent_remote_agenda_loss_risky_repeat"
        : "recent_remote_agenda_loss_cautious_repeat",
    ],
    evidence: [
      `recent_remote_agenda_loss:${recentLossServers.join(",")}`,
      `recent_remote_agenda_repeat:${riskyRepeat ? "risky" : "bounded"}`,
      `remote_bluff_budget:${riskyRepeat ? "blocked" : "cautious"}`,
    ],
  };
}

function recentRemoteAgendaLossServerIds(input: AiDecisionInput): string[] {
  const recentEvents = input.eventTail.slice(-16);
  return sortedUnique(
    recentEvents
      .filter(
        (event) =>
          event.type === "steal_agenda" ||
          event.publicPayload.actionType === "steal_agenda",
      )
      .map((event) => serverIdFromEvent(event))
      .filter((serverId): serverId is string =>
        Boolean(serverId?.startsWith("remote_")),
      ),
  );
}

function evaluateRemoteAdvanceProtection(
  input: AiDecisionInput,
  candidate: CorpPlanCandidate,
  context: CorpEvaluationContext,
): CorpPlanEvaluatorResult {
  if (
    candidate.kind !== "score_next_turn" &&
    candidate.kind !== "build_scoring_remote" &&
    candidate.kind !== "recover_economy"
  ) {
    return { score: 0, reasons: [], evidence: [] };
  }
  const riskyAdvances = input.legalActions
    .map((action) => riskyAdvanceWindowForAction(input, action, context))
    .filter((assessment): assessment is RiskyAdvanceWindowAssessment =>
      Boolean(assessment?.unsafe),
    );
  if (riskyAdvances.length === 0) {
    return {
      score: 0,
      reasons: [],
      evidence: ["advance_protection_window:none"],
    };
  }
  const riskyServers = sortedUnique(
    riskyAdvances.map((assessment) => assessment.serverId),
  );
  const candidateActions = actionsForCandidate(input, candidate);
  const protectsRiskyServer = candidateActions.some((action) =>
    riskyServers.some((serverId) =>
      isRemoteProtectionAction(input, action, serverId, context),
    ),
  );
  const closesReserveGap =
    candidate.kind === "recover_economy" &&
    riskyAdvances.some((assessment) => {
      const reserve = remoteRezReserveNeedForServer(
        input,
        assessment.serverId,
        context,
      );
      if (!reserve || input.playerView.own.credits >= reserve.reserveTarget)
        return false;
      return candidateActions.some(
        (action) =>
          creditsAfterCorpPlanAction(input, action) >= reserve.reserveTarget,
      );
    });
  const containsRiskyAdvance = candidateActions.some((action) =>
    riskyAdvances.some((assessment) => assessment.actionId === action.actionId),
  );
  const score =
    candidate.kind === "score_next_turn" && containsRiskyAdvance
      ? -260
      : protectsRiskyServer
        ? 185
        : closesReserveGap
          ? 145
          : 0;
  return {
    score,
    reasons: [
      ...(containsRiskyAdvance ? ["unsafe_final_advance"] : []),
      ...(protectsRiskyServer ? ["protect_before_advance"] : []),
      ...(closesReserveGap ? ["rez_reserve_before_score_window"] : []),
    ],
    evidence: [
      `advance_protection_servers:${riskyServers.join(",")}`,
      `advance_protection_contains_risky_advance:${containsRiskyAdvance}`,
      `advance_protection_defensive_action:${protectsRiskyServer}`,
      `advance_protection_reserve_action:${closesReserveGap}`,
      ...riskyAdvances
        .slice(0, 3)
        .map(
          (assessment) =>
            `unsafe_final_advance:${assessment.serverId}:${assessment.contestCapacity}:remaining_${assessment.advancesRemainingAfter}`,
        ),
    ],
  };
}

type RiskyAdvanceWindowAssessment = {
  actionId: string;
  serverId: string;
  advancesRemainingAfter: number;
  contestCapacity: RunnerContestCapacity["capacity"];
  protectionScore: number;
  unsafe: boolean;
};

function riskyAdvanceWindowForAction(
  input: AiDecisionInput,
  action: LegalAction,
  context: CorpEvaluationContext,
): RiskyAdvanceWindowAssessment | undefined {
  if (action.type !== "advance_card") return undefined;
  const target = visibleCardServerForAction(input, action);
  const definitionId = target?.card.definitionId;
  if (!target || !definitionId || !isAgendaDefinition(definitionId))
    return undefined;
  if (!target.serverId.startsWith("remote_")) return undefined;
  const requirement =
    target.card.advancementRequirement ??
    DEMO_CARDS_BY_ID[definitionId]?.advancementRequirement ??
    RUNTIME_CARDS[definitionId]?.numeric.advancementRequirement ??
    0;
  const countersAfter = (target.card.advancementCounters ?? 0) + 1;
  const advancesRemainingAfter = Math.max(0, requirement - countersAfter);
  if (advancesRemainingAfter > 1) return undefined;
  const contest = evaluateRunnerContestCapacity(
    input,
    target.serverId,
    context,
  );
  const protectionScore = remoteProtectionScoreForServer(
    input,
    target.serverId,
    context,
    creditsAfterCorpPlanAction(input, action),
  );
  const sameTurnScoreLikely = advancesRemainingAfter === 0;
  const unsafe =
    !sameTurnScoreLikely &&
    (contest.capacity === "high" || protectionScore < 60);
  return {
    actionId: action.actionId,
    serverId: target.serverId,
    advancesRemainingAfter,
    contestCapacity: contest.capacity,
    protectionScore,
    unsafe,
  };
}

function remoteProtectionScoreForServer(
  input: AiDecisionInput,
  serverId: string,
  context: CorpEvaluationContext,
  creditsAfterAction = input.playerView.own.credits,
): number {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server || !serverId.startsWith("remote_")) return 0;
  const contest = evaluateRunnerContestCapacity(input, serverId, context);
  const reserve = remoteRezReserveNeedForServer(input, serverId, context);
  const rezzedIce = server.ice.filter((ice) => ice.rezzed === true).length;
  const unrezzedIce = server.ice.length - rezzedIce;
  const reserveOk =
    !reserve ||
    reserve.reserveTarget <= 0 ||
    creditsAfterAction >= reserve.reserveTarget;
  const rootProtection = server.root.filter((card) =>
    isVisibleRemoteProtectionCard(card),
  ).length;
  return (
    Math.min(server.ice.length, 3) * 22 +
    rezzedIce * 32 +
    (unrezzedIce > 0 && reserveOk ? 28 : 0) +
    rootProtection * 35 +
    (contest.capacity === "low"
      ? 35
      : contest.capacity === "medium"
        ? 5
        : -45) +
    (reserveOk ? 12 : -70)
  );
}

function isRemoteProtectionAction(
  input: AiDecisionInput,
  action: LegalAction,
  serverId: string,
  context: CorpEvaluationContext,
): boolean {
  if (
    action.type === "install_card" &&
    action.payload?.placement === "ice" &&
    action.payload?.serverId === serverId
  )
    return true;
  if (
    action.type === "install_card" &&
    action.payload?.placement !== "ice" &&
    action.payload?.serverId === serverId
  ) {
    const card = findVisibleCard(input, action.source);
    return Boolean(card && isVisibleRemoteProtectionCard(card));
  }
  if (
    action.type === "gain_credit" ||
    action.type === "play_operation" ||
    action.type === "trigger_ability" ||
    action.type === "activated_card_ability"
  ) {
    const reserve = remoteRezReserveNeedForServer(input, serverId, context);
    return Boolean(
      reserve &&
      input.playerView.own.credits < reserve.reserveTarget &&
      creditsAfterCorpPlanAction(input, action) >= reserve.reserveTarget,
    );
  }
  return false;
}

function isVisibleRemoteProtectionCard(card: VisibleCard): boolean {
  if (!card.definitionId) return false;
  const id = card.definitionId.toLocaleLowerCase("en-US");
  const title = (card.title ?? "").toLocaleLowerCase("en-US");
  const roles = rolesForCardId(card.definitionId);
  return (
    id.includes("red-herrings") ||
    id.includes("tesseract") ||
    id.includes("namatoki") ||
    title.includes("red herrings") ||
    title.includes("tesseract") ||
    title.includes("namatoki") ||
    roles.some(
      (role) =>
        role === "remote_support" ||
        role === "upgrade" ||
        role === "steal_tax" ||
        role === "run_tax" ||
        role === "remote_protection",
    )
  );
}

function isRemoteAgendaSetupAction(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  if (action.type !== "install_card" && action.type !== "advance_card")
    return false;
  const serverId = remoteServerIdForAction(input, action);
  if (!serverId?.startsWith("remote_")) return false;
  const card = findVisibleCard(input, action.source);
  return Boolean(card?.definitionId && isAgendaDefinition(card.definitionId));
}

function isRiskyRemoteAgendaSetupAction(
  input: AiDecisionInput,
  action: LegalAction,
  context: CorpEvaluationContext,
): boolean {
  const serverId = remoteServerIdForAction(input, action);
  if (!serverId?.startsWith("remote_")) return true;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server || server.ice.length <= 0) return true;
  if (server.ice.some((ice) => ice.rezzed === true)) return false;
  const reserve = remoteRezReserveNeedForServer(input, serverId, context);
  const creditsAfterAction = creditsAfterCorpPlanAction(input, action);
  if (
    reserve &&
    reserve.reserveTarget > 0 &&
    creditsAfterAction < reserve.reserveTarget
  )
    return true;
  return (
    evaluateRunnerContestCapacity(input, serverId, context).capacity === "high"
  );
}

function remoteRezReserveForAction(
  input: AiDecisionInput,
  action: LegalAction,
  context: CorpEvaluationContext,
): CorpPlanEvaluatorResult | undefined {
  if (
    action.type !== "install_card" &&
    action.type !== "advance_card" &&
    action.type !== "score_agenda" &&
    !isAdvancementCounterScoreSetupAction(input, action, context)
  )
    return undefined;
  const features = extractCorpPlanFeatures(input);
  const serverId =
    remoteServerIdForAction(input, action) ??
    (isAdvancementCounterScoreSetupAction(input, action, context)
      ? bestRemoteAdvancementTarget(
          input,
          context,
          advancementCountersAddedByAction(input, action),
        )?.serverId
      : undefined);
  if (
    !serverId?.startsWith("remote_") &&
    action.payload?.serverId !== "new_remote"
  )
    return undefined;

  if (action.type === "install_card" && action.payload?.placement === "ice") {
    const reserveTarget = Math.max(0, rezCostForActionSource(input, action));
    const ready = features.credits >= reserveTarget;
    return {
      score: ready ? 135 : -60,
      reasons: [
        ready ? "remote_ice_rez_reserve_ready" : "remote_ice_rez_reserve_short",
      ],
      evidence: [
        `remote_rez_reserve_server:${String(action.payload?.serverId ?? "unknown")}`,
        `remote_rez_reserve_target:${reserveTarget}`,
        `remote_rez_reserve_credits:${features.credits}`,
        "remote_rez_reserve_action:install_ice",
      ],
    };
  }

  const reserve = serverId?.startsWith("remote_")
    ? remoteRezReserveNeedForServer(input, serverId, context)
    : undefined;
  if (!reserve) return undefined;
  const creditsAfterAction = creditsAfterCorpPlanAction(input, action);
  if (action.type === "score_agenda") {
    return {
      score: 80,
      reasons: ["remote_rez_reserve_score_now"],
      evidence: [
        `remote_rez_reserve_server:${reserve.serverId}`,
        `remote_rez_reserve_target:${reserve.reserveTarget}`,
        `remote_rez_reserve_credits:${features.credits}`,
        "remote_rez_reserve_action:score_agenda",
      ],
    };
  }
  if (reserve.reserveTarget > 0 && creditsAfterAction < reserve.reserveTarget) {
    return {
      score: -170,
      reasons: ["remote_rez_reserve_missing_before_score_line"],
      evidence: [
        `remote_rez_reserve_server:${reserve.serverId}`,
        `remote_rez_reserve_target:${reserve.reserveTarget}`,
        `remote_rez_reserve_credits:${features.credits}`,
        `remote_rez_reserve_after_action:${creditsAfterAction}`,
        "remote_rez_reserve_action:score_setup",
      ],
    };
  }
  return {
    score: reserve.reserveTarget > 0 ? 70 : 40,
    reasons: ["remote_rez_reserve_ready_for_score_line"],
    evidence: [
      `remote_rez_reserve_server:${reserve.serverId}`,
      `remote_rez_reserve_target:${reserve.reserveTarget}`,
      `remote_rez_reserve_credits:${features.credits}`,
      `remote_rez_reserve_after_action:${creditsAfterAction}`,
      "remote_rez_reserve_action:score_setup",
    ],
  };
}

function bestRemoteRezReserveNeed(
  input: AiDecisionInput,
  context: CorpEvaluationContext,
): { serverId: string; reserveTarget: number } | undefined {
  const serverIds = sortedUnique(
    input.legalActions
      .map((action) => remoteServerIdForAction(input, action))
      .filter((serverId): serverId is string =>
        Boolean(serverId?.startsWith("remote_")),
      ),
  );
  const needs = serverIds
    .map((serverId) => remoteRezReserveNeedForServer(input, serverId, context))
    .filter((need): need is { serverId: string; reserveTarget: number } =>
      Boolean(need),
    )
    .sort(
      (left, right) =>
        right.reserveTarget - left.reserveTarget ||
        left.serverId.localeCompare(right.serverId),
    );
  return needs[0];
}

function remoteRezReserveNeedForServer(
  input: AiDecisionInput,
  serverId: string,
  context: CorpEvaluationContext,
): { serverId: string; reserveTarget: number } | undefined {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server || !serverId.startsWith("remote_")) return undefined;
  const contest = evaluateRunnerContestCapacity(input, serverId, context);
  const unrezzedRezCosts = server.ice
    .filter((ice) => ice.rezzed !== true)
    .map((ice) => rezCostForVisibleCard(ice))
    .filter((cost) => cost > 0)
    .sort((left, right) => left - right);
  const cheapestRelevantRez = unrezzedRezCosts[0] ?? 0;
  const contestBuffer =
    contest.capacity === "high" && cheapestRelevantRez > 0 ? 1 : 0;
  if (cheapestRelevantRez > 0)
    return { serverId, reserveTarget: cheapestRelevantRez + contestBuffer };
  if (server.ice.some((ice) => ice.rezzed === true))
    return { serverId, reserveTarget: 0 };
  return undefined;
}

function hasRemoteScoringLegalAction(
  input: AiDecisionInput,
  context: CorpEvaluationContext,
): boolean {
  return input.legalActions.some((action) => {
    if (action.type === "score_agenda" || action.type === "advance_card")
      return Boolean(
        remoteServerIdForAction(input, action)?.startsWith("remote_"),
      );
    if (isAdvancementCounterScoreSetupAction(input, action, context))
      return true;
    return (
      action.type === "install_card" &&
      action.payload?.placement !== "ice" &&
      rolesForAction(input, action).some(isAgendaRole) &&
      isSafeScoringRootAction(input, action, context)
    );
  });
}

function creditsAfterCorpPlanAction(
  input: AiDecisionInput,
  action: LegalAction,
): number {
  const creditsAfterCosts =
    input.playerView.own.credits - actionCreditCost(action);
  if (action.type === "gain_credit") {
    return (
      creditsAfterCosts +
      Math.max(
        1,
        numberPayload(action, "gainCreditsAmount"),
        numberPayload(action, "gainedCredits"),
        numberPayload(action, "amount"),
      )
    );
  }
  if (action.type === "trigger_ability") {
    return (
      creditsAfterCosts +
      Math.max(
        0,
        numberPayload(action, "gainCreditsAmount"),
        numberPayload(action, "gainedCredits"),
        numberPayload(action, "amount"),
        numberPayload(action, "removeCounterAmount"),
        numberPayload(action, "removePowerCounterAmount"),
      )
    );
  }
  return creditsAfterCosts;
}

function isAdvancementCounterScoreSetupAction(
  input: AiDecisionInput,
  action: LegalAction,
  context: CorpEvaluationContext = createCorpEvaluationContext(input),
): boolean {
  const added = advancementCountersAddedByAction(input, action);
  if (added <= 0 || action.type === "advance_card") return false;
  return Boolean(bestRemoteAdvancementTarget(input, context, added));
}

function advancementCountersAddedByAction(
  input: AiDecisionInput,
  action: LegalAction,
): number {
  if (action.type === "advance_card") return 1;
  const payloadAmount = Math.max(
    0,
    numberPayload(action, "addedAdvancementCounters"),
    numberPayload(action, "advancementCountersAdded"),
    numberPayload(action, "advancementCounterCount"),
  );
  if (payloadAmount > 0) return payloadAmount;
  if (
    action.type !== "play_operation" &&
    action.type !== "trigger_ability" &&
    action.type !== "activated_card_ability"
  )
    return 0;
  const sourceCard = findVisibleCard(input, action.source);
  const roles = rolesForCardId(sourceCard?.definitionId);
  if (
    !roles.some(
      (role) =>
        role === "advance" ||
        role === "counter" ||
        role === "corp_agenda_operation",
    )
  )
    return 0;
  const text =
    (sourceCard?.definitionId
      ? (RUNTIME_CARDS[sourceCard.definitionId]?.text ??
        DEMO_CARDS_BY_ID[sourceCard.definitionId]?.rulesText)
      : "") ?? "";
  return advancementCountersFromRulesText(text);
}

function advancementCountersFromRulesText(text: string): number {
  const normalized = text.toLocaleLowerCase("en-US");
  if (!/\badvancement counters?\b/.test(normalized)) return 0;
  if (/\bfour\b|4/.test(normalized)) return 4;
  if (/\bthree\b|3/.test(normalized)) return 3;
  if (/\btwo\b|2/.test(normalized)) return 2;
  if (/\bone\b|1/.test(normalized)) return 1;
  return 0;
}

function bestRemoteAdvancementTarget(
  input: AiDecisionInput,
  context: CorpEvaluationContext,
  addedCounters: number,
): { card: VisibleCard; serverId: string; score: number } | undefined {
  const targets = input.playerView.servers
    .filter((server) => server.id.startsWith("remote_"))
    .flatMap((server) =>
      server.root
        .filter(
          (card) =>
            card.known &&
            card.definitionId &&
            isAgendaDefinition(card.definitionId),
        )
        .map((card) => {
          const requirement =
            card.advancementRequirement ??
            (card.definitionId
              ? (DEMO_CARDS_BY_ID[card.definitionId]?.advancementRequirement ??
                RUNTIME_CARDS[card.definitionId]?.numeric
                  .advancementRequirement)
              : 0) ??
            0;
          const countersBefore = card.advancementCounters ?? 0;
          const countersAfter = countersBefore + addedCounters;
          const remaining = Math.max(0, requirement - countersAfter);
          const contest = evaluateRunnerContestCapacity(
            input,
            server.id,
            context,
          );
          const reserve = remoteRezReserveNeedForServer(
            input,
            server.id,
            context,
          );
          const creditsAfter = input.playerView.own.credits;
          const reserveOk = !reserve || creditsAfter >= reserve.reserveTarget;
          const score =
            100 +
            (remaining === 0 ? 150 : remaining <= 2 ? 80 : 20) +
            Math.min(server.ice.length, 3) * 25 +
            (server.ice.some((ice) => ice.rezzed === true) ? 30 : 0) +
            (contest.capacity === "low"
              ? 55
              : contest.capacity === "medium"
                ? 10
                : -100) +
            (reserveOk ? 35 : -150);
          return { card, serverId: server.id, score };
        }),
    )
    .filter((target) => target.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.serverId.localeCompare(right.serverId),
    );
  return targets[0];
}

function visibleCardServerForAction(
  input: AiDecisionInput,
  action: LegalAction,
): { card: VisibleCard; serverId: string } | undefined {
  const cardId =
    typeof action.payload?.cardId === "string"
      ? action.payload.cardId
      : action.source;
  for (const server of input.playerView.servers) {
    const card = [...server.ice, ...server.root].find(
      (candidate) => candidate.instanceId === cardId && candidate.known,
    );
    if (card) return { card, serverId: server.id };
  }
  return undefined;
}

function remoteScoreHorizonForAction(
  input: AiDecisionInput,
  action: LegalAction,
  context: CorpEvaluationContext,
): RemoteScoreHorizon | undefined {
  if (context.scoreHorizonByActionId.has(action.actionId))
    return context.scoreHorizonByActionId.get(action.actionId);
  const advancementCountersAdded = advancementCountersAddedByAction(
    input,
    action,
  );
  if (
    action.type !== "score_agenda" &&
    action.type !== "advance_card" &&
    action.type !== "install_card" &&
    advancementCountersAdded <= 0
  ) {
    context.scoreHorizonByActionId.set(action.actionId, undefined);
    return undefined;
  }
  const target =
    advancementCountersAdded > 0 && action.type !== "advance_card"
      ? bestRemoteAdvancementTarget(input, context, advancementCountersAdded)
      : visibleCardServerForAction(input, action);
  const card = target?.card ?? findVisibleCard(input, action.source);
  if (!card?.definitionId || !isAgendaDefinition(card.definitionId)) {
    context.scoreHorizonByActionId.set(action.actionId, undefined);
    return undefined;
  }
  const requirement =
    card.advancementRequirement ??
    DEMO_CARDS_BY_ID[card.definitionId]?.advancementRequirement ??
    0;
  const countersBefore = card.advancementCounters ?? 0;
  const countersAfter =
    action.type === "install_card"
      ? 0
      : countersBefore + advancementCountersAdded;
  const advancesRemaining = Math.max(0, requirement - countersAfter);
  const serverId = target?.serverId ?? remoteServerIdForAction(input, action);
  const contest = serverId?.startsWith("remote_")
    ? evaluateRunnerContestCapacity(input, serverId, context)
    : undefined;
  const estimatedTurnsToScore =
    action.type === "score_agenda"
      ? 0
      : estimateTurnsToScore(advancesRemaining);
  const scoreModifier = scoreHorizonModifier(
    action.type,
    advancesRemaining,
    contest?.capacity,
  );
  const reasons = scoreHorizonReasons(
    action.type,
    advancesRemaining,
    contest?.capacity,
  );
  const evidence = [
    `score_horizon_action:${action.type}`,
    `score_horizon_advancement_requirement:${requirement}`,
    `score_horizon_counters_added:${advancementCountersAdded}`,
    `score_horizon_counters_after_action:${countersAfter}`,
    `score_horizon_advances_remaining_after_action:${advancesRemaining}`,
    `score_horizon_turns_to_score:${estimatedTurnsToScore}`,
    ...(contest ? [`score_horizon_contest_capacity:${contest.capacity}`] : []),
  ];
  const horizon = {
    actionId: action.actionId,
    ...(serverId ? { serverId } : {}),
    actionType: action.type,
    scoreModifier,
    advancementRequirement: requirement,
    advancementCountersAfterAction: countersAfter,
    advancesRemainingAfterAction: advancesRemaining,
    estimatedTurnsToScore,
    ...(contest ? { contestCapacity: contest.capacity } : {}),
    reasons,
    evidence,
  };
  context.scoreHorizonByActionId.set(action.actionId, horizon);
  return horizon;
}

function scoreHorizonModifier(
  actionType: LegalAction["type"],
  advancesRemaining: number,
  contestCapacity: RunnerContestCapacity["capacity"] | undefined,
): number {
  if (actionType === "score_agenda") return 130;
  const proximity =
    advancesRemaining <= 0
      ? 120
      : advancesRemaining === 1
        ? 80
        : advancesRemaining === 2
          ? 45
          : advancesRemaining <= 4
            ? 15
            : -10;
  const contest =
    contestCapacity === "low" ? 35 : contestCapacity === "high" ? -45 : 0;
  const longHighRiskPenalty =
    advancesRemaining >= 3 && contestCapacity === "high" ? 30 : 0;
  return proximity + contest - longHighRiskPenalty;
}

function scoreHorizonReasons(
  actionType: LegalAction["type"],
  advancesRemaining: number,
  contestCapacity: RunnerContestCapacity["capacity"] | undefined,
): string[] {
  const reasons: string[] = [];
  if (actionType === "score_agenda") reasons.push("score_horizon_score_now");
  else if (advancesRemaining <= 0)
    reasons.push("score_horizon_opens_score_window");
  else if (advancesRemaining <= 2)
    reasons.push("score_horizon_near_term_score");
  else reasons.push("score_horizon_long_score_plan");
  if (contestCapacity === "low")
    reasons.push("score_horizon_runner_contest_low");
  if (contestCapacity === "high")
    reasons.push("score_horizon_runner_contest_high");
  return reasons;
}

function estimateTurnsToScore(advancesRemaining: number): number {
  if (advancesRemaining <= 0) return 0;
  return Math.ceil(advancesRemaining / 3);
}

function runnerContestCapacityResult(
  serverId: string,
  capacity: RunnerContestCapacity["capacity"],
  runnerCredits: number,
  installedBreakers: number,
  visibleBreakCost: number | undefined,
  reasons: string[],
  evidence: string[],
): RunnerContestCapacity {
  const scoreModifier =
    capacity === "low" ? 90 : capacity === "medium" ? 20 : -85;
  return {
    serverId,
    capacity,
    scoreModifier,
    runnerCredits,
    installedBreakers,
    ...(visibleBreakCost !== undefined ? { visibleBreakCost } : {}),
    reasons,
    evidence,
  };
}

function assessKnownIcePathForRunnerContest(
  iceCards: Array<{
    definitionId?: string;
    rezzed?: boolean;
    known: boolean;
    subtypes?: string[];
    strength?: number;
  }>,
  rigCards: VisibleCard[],
  runnerCredits: number,
): {
  capacity: RunnerContestCapacity["capacity"];
  visibleBreakCost?: number;
  reasons: string[];
} {
  const installedBreakers = rigCards.filter(
    (card) =>
      card.known &&
      card.definitionId &&
      RUNTIME_CARDS[card.definitionId]?.subtypes.includes("icebreaker"),
  ).length;
  if (installedBreakers === 0 && runnerCredits <= 2)
    return {
      capacity: "low",
      reasons: ["runner_remote_contest_low_no_breaker_low_credits"],
    };

  let visibleBreakCost = 0;
  let relevantKnownIce = 0;
  const breakerStrengths = new Map(
    rigCards.map((card) => [
      card.instanceId,
      card.strength ?? cardDefinitionStrength(card.definitionId),
    ]),
  );
  for (const ice of iceCards.slice().reverse()) {
    if (!ice.definitionId || !ice.known) continue;
    const endTheRunCount = endTheRunSubroutineCount(ice.definitionId);
    if (endTheRunCount === 0) continue;
    relevantKnownIce += 1;
    const breakAssessment = minimumCreditsToBreakEndTheRunSubroutines(
      ice,
      rigCards,
      endTheRunCount,
      breakerStrengths,
    );
    if (!breakAssessment)
      return {
        capacity: "low",
        ...(visibleBreakCost > 0 ? { visibleBreakCost } : {}),
        reasons: ["runner_remote_contest_low_missing_breaker"],
      };
    visibleBreakCost += breakAssessment.cost;
    if (breakAssessment.carriesStrengthAcrossIce) {
      breakerStrengths.set(
        breakAssessment.breakerInstanceId,
        breakAssessment.endingStrength,
      );
    }
  }

  if (relevantKnownIce > 0 && visibleBreakCost > runnerCredits)
    return {
      capacity: "low",
      visibleBreakCost,
      reasons: ["runner_remote_contest_low_break_cost"],
    };
  if (
    relevantKnownIce > 0 &&
    runnerCredits >= visibleBreakCost + 3 &&
    installedBreakers > 0
  )
    return {
      capacity: "high",
      visibleBreakCost,
      reasons: ["runner_remote_contest_high_visible_breaker"],
    };
  if (installedBreakers === 0 || runnerCredits <= 3)
    return {
      capacity: "low",
      ...(visibleBreakCost > 0 ? { visibleBreakCost } : {}),
      reasons: ["runner_remote_contest_low_rig_or_credits"],
    };
  return {
    capacity: "medium",
    ...(visibleBreakCost > 0 ? { visibleBreakCost } : {}),
    reasons: ["runner_remote_contest_medium_uncertain"],
  };
}

function remoteServerIdForAction(
  input: AiDecisionInput,
  action: LegalAction,
): string | undefined {
  if (typeof action.payload?.serverId === "string")
    return action.payload.serverId;
  for (const server of input.playerView.servers) {
    if (!server.id.startsWith("remote_")) continue;
    if (server.root.some((card) => card.instanceId === action.source))
      return server.id;
    if (server.ice.some((card) => card.instanceId === action.source))
      return server.id;
  }
  return undefined;
}

function actionsForCandidate(
  input: AiDecisionInput,
  candidate: CorpPlanCandidate,
): LegalAction[] {
  return candidate.legalActionIds
    .map((actionId) =>
      input.legalActions.find((action) => action.actionId === actionId),
    )
    .filter((action): action is LegalAction => Boolean(action));
}

export function evaluateRemoteIntentMemory(
  input: AiDecisionInput,
  beliefState: BeliefState = reconstructBeliefState(input),
): RemoteIntentMemory {
  let remoteInstallSignals = 0;
  let remoteAdvanceSignals = 0;
  let remoteScoreSignals = 0;
  const centralRunSignals = { hq: 0, rd: 0 };
  for (const event of input.eventTail) {
    const serverId = serverIdFromEvent(event);
    if (typeof serverId === "string" && serverId.startsWith("remote_")) {
      if (event.type.includes("install")) remoteInstallSignals += 1;
      if (event.type.includes("advance")) remoteAdvanceSignals += 1;
      if (event.type.includes("score")) remoteScoreSignals += 1;
    }
    if (serverId === "hq")
      centralRunSignals.hq +=
        event.type.includes("run") ||
        event.type.includes("breach") ||
        event.type.includes("access")
          ? 1
          : 0;
    if (serverId === "rd")
      centralRunSignals.rd +=
        event.type.includes("run") ||
        event.type.includes("breach") ||
        event.type.includes("access")
          ? 1
          : 0;
  }
  return {
    remoteInstallSignals,
    remoteAdvanceSignals,
    remoteScoreSignals,
    centralRunSignals,
    evidence: [
      `remote_installs:${remoteInstallSignals}`,
      `remote_advances:${remoteAdvanceSignals}`,
      `remote_scores:${remoteScoreSignals}`,
      `runner_remote_contest_probability:${round(beliefState.corpOpponentModel?.remoteContestProbability ?? 0)}`,
    ],
  };
}

export function corpPlanUsesOnlyAiSupportedCards(
  input: AiDecisionInput,
  candidate: CorpPlanCandidate,
): boolean {
  return candidate.legalActionIds.every((actionId) => {
    const action = input.legalActions.find(
      (legalAction) => legalAction.actionId === actionId,
    );
    if (
      !action ||
      action.source === "basic_action" ||
      action.source === "game_rule"
    )
      return true;
    const card = findVisibleCard(input, action.source);
    return card ? isAiSupportedCard(card.definitionId) : true;
  });
}

function buildCandidate(
  input: AiDecisionInput,
  kind: CorpPlanKind,
  actions: LegalAction[],
): CorpPlanCandidate | null {
  const legalActions = actions.filter(
    (action) => action.side === "corp" && PLAN_ACTION_TYPES.has(action.type),
  );
  if (legalActions.length === 0) return null;
  const steps = legalActions.map((action, index) => ({
    stepId: `${kind}:step:${index + 1}`,
    actionId: action.actionId,
    actionType: action.type,
    ...(typeof action.payload?.serverId === "string"
      ? { targetServerId: action.payload.serverId }
      : {}),
    roleTags: rolesForAction(input, action),
  }));
  const requiredRoles = sortedUnique(steps.flatMap((step) => step.roleTags));
  return {
    planId: `${kind}:${legalActions
      .map((action) => action.actionId)
      .sort()
      .join("|")}`,
    kind,
    legalActionIds: legalActions.map((action) => action.actionId).sort(),
    steps,
    expectedBenefits: expectedBenefitsForPlan(kind),
    visibleRisks: visibleRisksForPlan(kind, requiredRoles),
    requiredRoles,
  };
}

function selectPlanAction(
  input: AiDecisionInput,
  candidate: CorpPlanCandidate,
  context: CorpEvaluationContext,
): LegalAction | undefined {
  const actions = candidate.legalActionIds
    .map((actionId) =>
      input.legalActions.find((action) => action.actionId === actionId),
    )
    .filter((action): action is LegalAction => Boolean(action))
    .sort(
      (left, right) =>
        actionPriority(input, candidate.kind, right, context) -
          actionPriority(input, candidate.kind, left, context) ||
        compareAction(left, right),
    );
  return actions[0];
}

function corpActionAlternativesForPlan(
  input: AiDecisionInput,
  candidate: CorpPlanCandidate,
  context: CorpEvaluationContext,
  selectedActionId: string,
): AiDecisionActionAlternative[] {
  return candidate.legalActionIds
    .map((actionId) =>
      input.legalActions.find((action) => action.actionId === actionId),
    )
    .filter((action): action is LegalAction => Boolean(action))
    .map((action) => ({
      action,
      priority: actionPriority(input, candidate.kind, action, context),
    }))
    .sort(
      (left, right) =>
        right.priority - left.priority ||
        compareAction(left.action, right.action),
    )
    .slice(0, 8)
    .map((entry, index) =>
      corpActionAlternativeForAction(
        input,
        entry.action,
        entry.priority,
        entry.action.actionId === selectedActionId,
        index + 1,
      ),
    );
}

function corpActionAlternativeForAction(
  input: AiDecisionInput,
  action: LegalAction,
  priority: number,
  selected: boolean,
  rank: number,
): AiDecisionActionAlternative {
  const sourceCard =
    action.source !== "basic_action" && action.source !== "game_rule"
      ? findVisibleCard(input, action.source)
      : undefined;
  const sourceTitle =
    sourceCard && isDebugPublicSourceCard(input, sourceCard.instanceId)
      ? sourceCard.title
      : undefined;
  const installedEconomy = classifyCorpInstalledEconomyAction(input, action);
  const economyNeed = input.playerView.own.credits < 5 ? "acute" : "stable";
  const economy =
    action.type === "gain_credit"
      ? {
          economyKind: "basic_credit",
          immediateGain: 1,
          netCredits: 1,
          storedCredits: 0,
          futurePoolAfter: 0,
          economyNeed,
        }
      : installedEconomy
        ? {
            economyKind: installedEconomy.kind,
            ability: installedEconomy.ability,
            immediateGain: installedEconomy.immediateGain,
            netCredits: installedEconomy.netCredits,
            storedCredits: installedEconomy.storedCredits,
            futurePoolAfter: installedEconomy.futurePoolAfter,
            economyNeed,
          }
        : undefined;
  return {
    rank,
    actionId: action.actionId,
    actionType: action.type,
    label:
      sourceTitle ||
      action.source === "basic_action" ||
      action.source === "game_rule"
        ? action.label
        : action.type,
    source: sourceCard
      ? sourceTitle
        ? "visible_card"
        : "private_card"
      : action.source,
    ...(sourceTitle ? { sourceTitle } : {}),
    selected,
    priority: roundScore(priority),
    ...(selected
      ? { whyChosen: ["selected_action"] }
      : {
          whyNot: [
            installedEconomy
              ? `${installedEconomy.kind}_lower_action_priority`
              : "lower_action_priority",
          ],
        }),
    ...(economy ? { economy } : {}),
  };
}

function isDebugPublicSourceCard(
  input: AiDecisionInput,
  instanceId: string,
): boolean {
  const ownPublicCards = [
    input.playerView.own.scoreArea,
    ...(input.playerView.own.rig ? [input.playerView.own.rig] : []),
    ...input.playerView.servers.map((server) => [
      ...server.ice,
      ...server.root,
    ]),
  ];
  const opponentPublicCards = [
    input.playerView.opponent.scoreArea,
    ...(input.playerView.opponent.rig ? [input.playerView.opponent.rig] : []),
  ];
  return [...ownPublicCards, ...opponentPublicCards].some((cards) =>
    cards.some((card) => card.instanceId === instanceId && card.known),
  );
}

function actionPriority(
  input: AiDecisionInput,
  kind: CorpPlanKind,
  action: LegalAction,
  context: CorpEvaluationContext,
): number {
  if (kind === "score_now" && action.type === "score_agenda")
    return 150 + scoreConversionActionBonus(input, action, context);
  const extraActionOperation = classifyCorpExtraActionOperation(
    input,
    action,
    context,
  );
  if (
    kind === "score_next_turn" &&
    extraActionOperation?.scoreWindowAfterExtraActions
  )
    return 125;
  if (kind === "score_next_turn" && action.type === "advance_card")
    return (
      90 +
      boundedScoreHorizonActionBonus(input, action, context) -
      riskyAdvanceActionPriorityPenalty(input, action, context)
    );
  if (
    kind === "score_next_turn" &&
    isAdvancementCounterScoreSetupAction(input, action, context)
  )
    return 92 + boundedScoreHorizonActionBonus(input, action, context);
  if (
    (kind === "protect_hq" || kind === "protect_rnd") &&
    action.type === "install_card" &&
    action.payload?.placement === "ice"
  )
    return 85;
  if (
    kind === "recover_economy" &&
    extraActionOperation?.basicCreditFollowupOnly &&
    extraActionOperation.netValue < 0
  )
    return 35;
  if (kind === "recover_economy" && extraActionOperation)
    return extraActionOperation.scoreWindowAfterExtraActions
      ? 88
      : 60 + Math.max(0, extraActionOperation.netValue) * 4;
  if (kind === "recover_economy" && action.type === "play_operation") return 80;
  if (
    kind === "recover_economy" &&
    action.type === "draw_card" &&
    shouldCorpDrawForScoring(input)
  )
    return 78;
  if (
    kind === "recover_economy" &&
    (action.type === "gain_credit" ||
      action.type === "trigger_ability" ||
      action.type === "activated_card_ability") &&
    classifyCorpInstalledEconomyAction(input, action)
  )
    return corpInstalledEconomyPriority(input, action);
  if (kind === "recover_economy" && action.type === "gain_credit") return 65;
  if (
    kind === "build_scoring_remote" &&
    action.type === "install_card" &&
    action.payload?.placement === "ice" &&
    isRemoteServerId(action.payload?.serverId)
  )
    return (
      82 +
      (hasRiskyAdvanceWindowForServer(
        input,
        String(action.payload.serverId),
        context,
      )
        ? 45
        : 0)
    );
  if (
    kind === "score_next_turn" &&
    action.type === "install_card" &&
    action.payload?.placement !== "ice"
  )
    return (
      65 +
      boundedRemotePriorityBonus(input, action, context) +
      boundedScoreHorizonActionBonus(input, action, context)
    );
  if (
    (kind === "build_scoring_remote" || kind === "bait_runner") &&
    action.type === "install_card" &&
    action.payload?.placement !== "ice"
  )
    return (
      75 +
      boundedRemotePriorityBonus(input, action, context) +
      boundedScoreHorizonActionBonus(input, action, context)
    );
  if (action.type === "draw_card") return 45;
  if (action.type === "end_turn") return 5;
  return 20;
}

function corpInstalledEconomyPriority(
  input: AiDecisionInput,
  action: LegalAction,
): number {
  const assessment = classifyCorpInstalledEconomyAction(input, action);
  if (!assessment) return 20;
  return (
    86 +
    Math.max(0, assessment.netCredits - 1) * 10 +
    (input.playerView.own.credits < 5 ? 12 : 0)
  );
}

function shouldCorpDrawForScoring(input: AiDecisionInput): boolean {
  if (
    input.side !== "corp" ||
    input.playerView.activeSide !== "corp" ||
    input.playerView.phase !== "corp_action_phase"
  )
    return false;
  if (input.playerView.own.credits < 4 || input.playerView.own.clicks < 2)
    return false;
  if (input.playerView.own.stackOrRdCount <= 0) return false;
  const hqIce =
    input.playerView.servers.find((server) => server.id === "hq")?.ice.length ??
    0;
  const rdIce =
    input.playerView.servers.find((server) => server.id === "rd")?.ice.length ??
    0;
  if (hqIce <= 0 || rdIce <= 0) return false;
  const agendaInHand = input.playerView.own.gripOrHq.some(
    (card) =>
      card.definitionId && RUNTIME_CARDS[card.definitionId]?.type === "agenda",
  );
  if (agendaInHand) return false;
  return !input.legalActions.some(
    (action) =>
      action.type === "score_agenda" ||
      action.type === "advance_card" ||
      (action.type === "install_card" &&
        action.payload?.placement !== "ice" &&
        rolesForAction(input, action).some(isAgendaRole)),
  );
}

function extractCorpPlanFeatures(input: AiDecisionInput): CorpPlanFeatures {
  const ownAgendaCount = input.playerView.own.gripOrHq.filter(
    (card) =>
      card.known && card.definitionId && isAgendaDefinition(card.definitionId),
  ).length;
  return {
    credits: input.playerView.own.credits,
    clicks: input.playerView.own.clicks,
    handCount: input.playerView.own.gripOrHq.length,
    agendaPoints: input.playerView.own.agendaPoints,
    opponentAgendaPoints: input.playerView.opponent.agendaPoints,
    agendaPointsToWin: input.playerView.agendaPointsToWin,
    runnerCredits: input.playerView.opponent.credits,
    runnerTags: input.playerView.opponent.tags,
    ownAgendaCount,
    ownAgendaPressure: ownAgendaPressureScore(
      ownAgendaCount,
      input.playerView.own.gripOrHq.length,
    ),
    serverFeatures: new Map(
      input.playerView.servers.map((server) => [
        server.id,
        {
          iceCount: server.ice.length,
          rootCount: server.root.length,
          knownRootCount: server.root.filter((card) => card.known).length,
          rezzedIceCount: server.ice.filter((card) => card.rezzed === true)
            .length,
          unrezzedIceCount: server.ice.filter((card) => card.rezzed !== true)
            .length,
        },
      ]),
    ),
  };
}

function ownAgendaPressureScore(
  agendaCount: number,
  handCount: number,
): number {
  if (agendaCount < 2) return 0;
  const densityPressure =
    handCount > 0 ? Math.round((agendaCount / handCount) * 80) : 0;
  const countPressure = agendaCount >= 4 ? 145 : agendaCount === 3 ? 110 : 50;
  return Math.max(countPressure, densityPressure);
}

function rolesForAction(input: AiDecisionInput, action: LegalAction): string[] {
  if (action.source === "basic_action" || action.source === "game_rule")
    return [];
  const visible = findVisibleCard(input, action.source);
  return rolesForCardId(visible?.definitionId);
}

function findVisibleCard(
  input: AiDecisionInput,
  instanceId: string,
): VisibleCard | undefined {
  const zones = [
    input.playerView.own.gripOrHq,
    input.playerView.own.heapOrArchives,
    input.playerView.own.scoreArea,
    ...(input.playerView.own.rig ?? []),
    ...input.playerView.servers.flatMap((server) => [server.ice, server.root]),
  ];
  return zones
    .flat()
    .find((card) => card.instanceId === instanceId && card.known);
}

function rolesForCardId(cardId: string | undefined): string[] {
  if (!cardId || !isAiSupportedCard(cardId)) return [];
  const roleRecord = CARD_ROLES_BY_CARD.get(cardId);
  const hint = AI_HINTS.get(cardId);
  return sortedUnique([
    ...(roleRecord?.roles ?? []),
    ...(hint?.roles ?? []),
    ...(hint?.planRoles ?? []),
  ]);
}

function actionCreditCost(action: LegalAction): number {
  return action.costs.reduce(
    (sum, cost) =>
      sum + (Number.isFinite(cost.credits) ? (cost.credits ?? 0) : 0),
    0,
  );
}

function actionClickCost(action: LegalAction): number {
  const explicitClicks = action.costs.reduce(
    (sum, cost) =>
      sum + (Number.isFinite(cost.clicks) ? (cost.clicks ?? 0) : 0),
    0,
  );
  return explicitClicks > 0
    ? explicitClicks
    : action.type === "play_operation"
      ? 1
      : 0;
}

function extraActionsForCard(
  cardId: string | undefined,
  action: LegalAction,
): number {
  const payloadAmount = Math.max(
    0,
    numberPayload(action, "gainedActions"),
    numberPayload(action, "gainActionsAmount"),
  );
  if (payloadAmount > 0) return payloadAmount;
  if (!cardId) return 0;
  const runtimeCard = RUNTIME_CARDS[cardId];
  const demoCard = DEMO_CARDS_BY_ID[cardId];
  if (
    !demoCard?.mechanics?.includes("gain_actions") &&
    !/\bgain\b.+\bactions?\b/i.test(runtimeCard?.text ?? "")
  )
    return 0;
  const text = (runtimeCard?.text ?? demoCard?.rulesText ?? "").toLowerCase();
  if (/\bthree\b|3/.test(text)) return 3;
  if (/\btwo\b|2/.test(text)) return 2;
  if (/\bone\b|1/.test(text)) return 1;
  return 0;
}

function numberPayload(action: LegalAction, key: string): number {
  const value = action.payload?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isAiSupportedCard(cardId: string | undefined): boolean {
  return Boolean(
    cardId && RUNTIME_CARDS[cardId]?.statuses.ai_supported === true,
  );
}

function corpPlanProfile(input: AiDecisionInput): CorpPlanProfile {
  return (
    CORP_PLAN_PROFILES.find(
      (profile) =>
        profile.profileId === input.profileId ||
        profile.legacyProfileIds.includes(input.profileId),
    ) ??
    CORP_PLAN_PROFILES.find(
      (profile) => profile.difficulty === input.difficulty,
    ) ??
    CORP_PLAN_PROFILES[1]!
  );
}

function fallbackPlanDecision(
  input: AiDecisionInput,
  reason: string,
  timeBudgetMs: number,
  timeoutUsed: boolean,
  beliefState: BeliefState,
): CorpPlanDecision {
  const fallbackAction = input.legalActions.slice().sort(compareAction)[0];
  const debug = fallbackDebug(
    input,
    undefined,
    reason,
    timeBudgetMs,
    timeoutUsed,
    beliefState,
  );
  return {
    selectedPlanId: "fallback",
    selectedActionId: fallbackAction?.actionId ?? "",
    selectedActionType: fallbackAction?.type ?? "none",
    fallbackUsed: true,
    score: {
      planId: "fallback",
      score: 0,
      confidence: 0.2,
      reasons: [reason],
      evidence: [reason],
      scoreBreakdown: scoreComponents([["fallback", "Fallback", 0, 1, reason]]),
    },
    debug,
  };
}

function fallbackDebug(
  input: AiDecisionInput,
  fallbackDecision: AiDecision | undefined,
  reason: string,
  timeBudgetMs: number | undefined,
  timeoutUsed = false,
  beliefState: BeliefState = reconstructBeliefState(input),
): CorpPlanDebug {
  const fallbackAction = fallbackDecision
    ? input.legalActions.find(
        (action) => action.actionId === fallbackDecision.actionId,
      )
    : input.legalActions.slice().sort(compareAction)[0];
  const beliefSummary = beliefDebugSummary(beliefState);
  const opponentModel = toRecord(beliefSummary.corpOpponentModel);
  return {
    schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
    aiLevel: 2,
    summary: "Die Corp nutzt einen legalen Fallback.",
    planId: "fallback",
    planKind: "fallback",
    selectedActionType: fallbackAction?.type ?? "none",
    score: 0,
    confidence: fallbackDecision?.confidence ?? 0.2,
    visibleReasons: [reason],
    rankedAlternatives: [
      {
        rank: 1,
        planId: "fallback",
        planKind: "fallback",
        selectedActionType: fallbackAction?.type ?? "none",
        summary: "Legal fallback action",
        score: 0,
        confidence: fallbackDecision?.confidence ?? 0.2,
        visibleReasons: [reason],
        scoreBreakdown: scoreComponents([
          ["fallback", "Fallback", 0, 1, reason],
        ]),
        whyNot: [],
        warnings: ["fallback_used"],
      },
    ],
    scoreBreakdown: scoreComponents([["fallback", "Fallback", 0, 1, reason]]),
    whyNot: [reason],
    longTermPlan: longTermPlanForCorp(input, "fallback"),
    warnings: ["fallback_used"],
    detailSections: [{ id: "fallback", title: "Fallback", items: [reason] }],
    evidence: scrubPlanEvidence([reason]),
    fallbackUsed: true,
    seed: input.seed,
    profileId: corpPlanProfile(input).profileId,
    timeBudgetMs: timeBudgetMs ?? corpPlanProfile(input).timeBudgetMs,
    timeoutUsed,
    ...(input.ownDeckDoctrine
      ? {
          ownDeckDoctrine: deckDoctrineDebug(input.ownDeckDoctrine),
          doctrinePlanWeight: 0,
        }
      : {}),
    memoryVersion: String(beliefSummary.memoryVersion ?? ""),
    facts: toStringArray(beliefSummary.facts),
    hypotheses: toStringArray(beliefSummary.hypotheses),
    invalidations: toStringArray(beliefSummary.invalidations),
    beliefUncertainty: toStringArray(beliefSummary.uncertainty),
    ...(opponentModel ? { opponentModel } : {}),
  };
}

type ScoreComponentInput = [
  key: string,
  label: string,
  value: number,
  weight?: number | undefined,
  reason?: string | undefined,
];

function scoreComponents(
  inputs: ScoreComponentInput[],
): AiDecisionScoreComponent[] {
  return inputs
    .filter(([, , value], index) => index === 0 || value !== 0)
    .map(([key, label, value, weight, reason]) => ({
      key,
      label,
      value: roundScore(value),
      ...(weight !== undefined ? { weight: round(weight) } : {}),
      ...(reason ? { reason } : {}),
    }))
    .slice(0, 16);
}

function firstReason(reasons: string[]): string | undefined {
  return reasons.find((reason) => reason.length > 0);
}

function rankedCorpAlternatives(
  input: AiDecisionInput,
  context: CorpEvaluationContext,
  scored: Array<{ candidate: CorpPlanCandidate; score: CorpPlanScore }>,
  selectedPlanId: string,
): AiDecisionRankedAlternative[] {
  const selectedScore =
    scored.find((entry) => entry.candidate.planId === selectedPlanId)?.score
      .score ??
    scored[0]?.score.score ??
    0;
  return scored.slice(0, 5).map((entry, index) => {
    const representativeAction = selectPlanAction(
      input,
      entry.candidate,
      context,
    );
    return {
      rank: index + 1,
      planId: entry.candidate.planId,
      planKind: entry.candidate.kind,
      selectedActionType:
        representativeAction?.type ??
        entry.candidate.steps[0]?.actionType ??
        "none",
      summary: explanationForPlan(entry.candidate.kind),
      score: entry.score.score,
      confidence: entry.score.confidence,
      visibleReasons: entry.score.reasons.slice(0, 4),
      scoreBreakdown: entry.score.scoreBreakdown.slice(0, 8),
      whyNot: alternativeWhyNot(
        entry.candidate,
        entry.score,
        selectedScore,
        entry.candidate.planId === selectedPlanId,
      ),
      warnings: entry.candidate.visibleRisks.slice(0, 3),
    };
  });
}

function alternativeWhyNot(
  candidate: CorpPlanCandidate,
  score: CorpPlanScore,
  selectedScore: number,
  isSelected: boolean,
): string[] {
  if (isSelected) return ["selected_plan"];
  const delta = roundScore(selectedScore - score.score);
  return sortedUnique([
    ...(delta > 0 ? [`lower_score_by:${delta}`] : []),
    ...candidate.visibleRisks.slice(0, 2),
    ...score.reasons.slice(0, 4),
  ]).slice(0, 6);
}

function longTermPlanForCorp(
  input: AiDecisionInput,
  kind: CorpPlanKind | "fallback",
): string[] {
  return sortedUnique([
    `active_plan:${kind}`,
    ...(input.ownDeckDoctrine?.side === "corp"
      ? input.ownDeckDoctrine.archetypeTags
          .slice(0, 3)
          .map((tag) => `doctrine:${tag}`)
      : ["doctrine:neutral"]),
    ...(input.ownDeckDoctrine?.side === "corp"
      ? input.ownDeckDoctrine.riskFlags
          .slice(0, 2)
          .map((flag) => `risk_flag:${flag}`)
      : []),
  ]).slice(0, 6);
}

function corpDetailSections(
  candidate: CorpPlanCandidate,
  score: CorpPlanScore,
): NonNullable<CorpPlanDebug["detailSections"]> {
  return [
    {
      id: "visible_reasons",
      title: "Sichtbare Gründe",
      items: score.reasons.slice(0, 6),
    },
    {
      id: "evidence",
      title: "Evidence",
      items: scrubPlanEvidence(score.evidence).slice(0, 8),
    },
    {
      id: "visible_risks",
      title: "Sichtbare Risiken",
      items: candidate.visibleRisks.slice(0, 6),
    },
  ].filter((section) => section.items.length > 0);
}

function baseScoreForPlan(kind: CorpPlanKind): number {
  switch (kind) {
    case "score_now":
      return 500;
    case "score_next_turn":
      return 340;
    case "build_scoring_remote":
      return 260;
    case "protect_hq":
    case "protect_rnd":
      return 190;
    case "recover_economy":
      return 230;
    case "bait_runner":
      return 210;
  }
}

function doctrinePlanWeightFor(
  input: AiDecisionInput,
  kind: CorpPlanKind,
): number {
  const profile = input.ownDeckDoctrine;
  if (!profile || profile.side !== "corp") return 0;
  const raw = profile.planWeights[kind] ?? 0;
  const confidence = Number.isFinite(profile.confidence)
    ? profile.confidence
    : 0.5;
  return Math.round(raw * Math.max(0.25, Math.min(1, confidence)));
}

function deckDoctrineDebug(
  profile: AiDeckDoctrineProfile,
): NonNullable<CorpPlanDebug["ownDeckDoctrine"]> {
  return {
    deckSnapshotId: profile.deckSnapshotId,
    side: profile.side,
    confidence: profile.confidence,
    archetypeTags: profile.archetypeTags.slice(0, 4),
    riskFlags: profile.riskFlags.slice(0, 6),
  };
}

function visibleRiskPenalty(
  candidate: CorpPlanCandidate,
  riskTolerance: number,
): number {
  return candidate.visibleRisks.length * 20 * (1 - riskTolerance);
}

function expectedBenefitsForPlan(kind: CorpPlanKind): string[] {
  switch (kind) {
    case "score_now":
      return ["benefit:agenda_points_now"];
    case "score_next_turn":
      return ["benefit:near_term_score"];
    case "build_scoring_remote":
      return ["benefit:remote_development"];
    case "protect_hq":
      return ["benefit:hq_defense"];
    case "protect_rnd":
      return ["benefit:rd_defense"];
    case "recover_economy":
      return ["benefit:credit_reserve"];
    case "bait_runner":
      return ["benefit:remote_pressure_signal"];
  }
}

function visibleRisksForPlan(kind: CorpPlanKind, roles: string[]): string[] {
  const risks: string[] = [];
  if (kind === "build_scoring_remote" || kind === "score_next_turn")
    risks.push("risk:remote_access");
  if (kind === "bait_runner") risks.push("risk:asset_access");
  if (roles.length === 0 && kind !== "recover_economy" && kind !== "score_now")
    risks.push("risk:no_ai_role");
  return risks;
}

function remoteRootExposurePenalty(
  input: AiDecisionInput,
  candidate: CorpPlanCandidate,
  riskTolerance: number,
  context: CorpEvaluationContext,
): number {
  if (
    candidate.kind !== "score_next_turn" &&
    candidate.kind !== "build_scoring_remote"
  )
    return 0;
  const rootActions = candidate.legalActionIds
    .map((actionId) =>
      input.legalActions.find((action) => action.actionId === actionId),
    )
    .filter((action): action is LegalAction =>
      Boolean(
        action &&
        action.type === "install_card" &&
        action.payload?.placement !== "ice",
      ),
    );
  if (rootActions.length === 0) return 0;
  const worstAgendaExposure = Math.min(
    0,
    ...rootActions
      .filter((action) => rolesForAction(input, action).some(isAgendaRole))
      .map((action) => remoteRootActionSecurityScore(input, action, context)),
  );
  if (worstAgendaExposure >= 0) return 0;
  const hasProtectedAgendaInstall = rootActions.some(
    (action) =>
      rolesForAction(input, action).some(isAgendaRole) &&
      remoteRootActionSecurityScore(input, action, context) > 0,
  );
  const hasCentralOrRemoteIceInstall = input.legalActions.some(
    (action) =>
      action.side === "corp" &&
      action.type === "install_card" &&
      action.payload?.placement === "ice",
  );
  const cautionMultiplier = 1.25 - riskTolerance;
  const avoidableExposure =
    hasProtectedAgendaInstall || hasCentralOrRemoteIceInstall ? 1.4 : 1;
  return Math.round(
    Math.abs(worstAgendaExposure) * cautionMultiplier * avoidableExposure,
  );
}

function remoteRootExposureEvidence(
  input: AiDecisionInput,
  candidate: CorpPlanCandidate,
  context: CorpEvaluationContext,
): string[] {
  const scores = candidate.legalActionIds
    .map((actionId) =>
      input.legalActions.find((action) => action.actionId === actionId),
    )
    .filter((action): action is LegalAction =>
      Boolean(
        action &&
        action.type === "install_card" &&
        action.payload?.placement !== "ice",
      ),
    )
    .map(
      (action) =>
        `remote_root_security:${String(action.payload?.serverId ?? "unknown")}:${remoteRootActionSecurityScore(input, action, context)}`,
    );
  return scores.slice(0, 4);
}

function remoteRootActionSecurityScore(
  input: AiDecisionInput,
  action: LegalAction,
  context: CorpEvaluationContext,
): number {
  const cached = context.remoteRootSecurityByActionId.get(action.actionId);
  if (cached !== undefined) return cached;
  if (action.type !== "install_card" || action.payload?.placement === "ice") {
    context.remoteRootSecurityByActionId.set(action.actionId, 0);
    return 0;
  }
  const roles = rolesForAction(input, action);
  const isAgenda = roles.some(isAgendaRole);
  const serverId = action.payload?.serverId;
  if (!isAgenda)
    return cacheRemoteRootSecurity(
      context,
      action,
      serverId === "new_remote" ? 5 : 20,
    );
  if (serverId === "new_remote")
    return cacheRemoteRootSecurity(context, action, -120);
  if (typeof serverId !== "string")
    return cacheRemoteRootSecurity(context, action, -90);
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server || !serverId.startsWith("remote_"))
    return cacheRemoteRootSecurity(context, action, -90);
  if (server.ice.length <= 0)
    return cacheRemoteRootSecurity(context, action, -95);
  const rezzedIceBonus = server.ice.some((ice) => ice.rezzed === true) ? 35 : 0;
  const contestCapacity = evaluateRunnerContestCapacity(
    input,
    serverId,
    context,
  );
  const contestSecurity =
    contestCapacity.capacity === "low"
      ? 55
      : contestCapacity.capacity === "medium"
        ? 0
        : -120;
  const reserve = remoteRezReserveNeedForServer(input, serverId, context);
  const creditsAfterAction = creditsAfterCorpPlanAction(input, action);
  const reserveSecurity =
    reserve && reserve.reserveTarget > 0
      ? creditsAfterAction >= reserve.reserveTarget
        ? 25
        : -180 - Math.max(0, reserve.reserveTarget - creditsAfterAction) * 20
      : 0;
  return cacheRemoteRootSecurity(
    context,
    action,
    90 +
      Math.min(server.ice.length, 3) * 20 +
      rezzedIceBonus +
      contestSecurity +
      reserveSecurity,
  );
}

function cacheRemoteRootSecurity(
  context: CorpEvaluationContext,
  action: LegalAction,
  score: number,
): number {
  context.remoteRootSecurityByActionId.set(action.actionId, score);
  return score;
}

function boundedRemotePriorityBonus(
  input: AiDecisionInput,
  action: LegalAction,
  context: CorpEvaluationContext,
): number {
  const score = remoteRootActionSecurityScore(input, action, context);
  return Math.max(-45, Math.min(20, Math.round(score / 6)));
}

function scoreConversionActionBonus(
  input: AiDecisionInput,
  action: LegalAction,
  context: CorpEvaluationContext,
): number {
  const target = visibleCardServerForAction(input, action);
  const definitionId = target?.card.definitionId;
  if (!definitionId || !isAgendaDefinition(definitionId)) return 0;
  const agendaPoints = agendaPointsForDefinition(definitionId);
  const wouldWin =
    input.playerView.own.agendaPoints + agendaPoints >=
    input.playerView.agendaPointsToWin;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === target.serverId,
  );
  const contest = target.serverId.startsWith("remote_")
    ? evaluateRunnerContestCapacity(input, target.serverId, context)
    : undefined;
  const counters = target.card.advancementCounters ?? 0;
  const requirement =
    target.card.advancementRequirement ??
    DEMO_CARDS_BY_ID[definitionId]?.advancementRequirement ??
    RUNTIME_CARDS[definitionId]?.numeric.advancementRequirement ??
    0;
  return (
    agendaPoints * 22 +
    (wouldWin ? 100 : 0) +
    Math.max(0, counters - requirement) * 8 +
    Math.min(server?.ice.length ?? 0, 3) * 8 +
    ((server?.ice ?? []).some((ice) => ice.rezzed === true) ? 14 : 0) +
    (contest?.capacity === "low"
      ? 24
      : contest?.capacity === "medium"
        ? 8
        : contest?.capacity === "high"
          ? -30
          : 0)
  );
}

function boundedScoreHorizonActionBonus(
  input: AiDecisionInput,
  action: LegalAction,
  context: CorpEvaluationContext,
): number {
  const horizon = remoteScoreHorizonForAction(input, action, context);
  if (!horizon) return 0;
  return Math.max(-25, Math.min(25, Math.round(horizon.scoreModifier / 6)));
}

function riskyAdvanceActionPriorityPenalty(
  input: AiDecisionInput,
  action: LegalAction,
  context: CorpEvaluationContext,
): number {
  const assessment = riskyAdvanceWindowForAction(input, action, context);
  return assessment?.unsafe ? 90 : 0;
}

function hasRiskyAdvanceWindowForServer(
  input: AiDecisionInput,
  serverId: string,
  context: CorpEvaluationContext,
): boolean {
  return input.legalActions.some((action) => {
    const assessment = riskyAdvanceWindowForAction(input, action, context);
    return assessment?.unsafe === true && assessment.serverId === serverId;
  });
}

function isSafeScoringRootAction(
  input: AiDecisionInput,
  action: LegalAction,
  context: CorpEvaluationContext,
): boolean {
  return (
    rolesForAction(input, action).some(isAgendaRole) &&
    remoteRootActionSecurityScore(input, action, context) > 0
  );
}

function isAgendaRole(role: string): boolean {
  return (
    role === "agenda" ||
    role === "corp_score_agenda" ||
    role === "score_agenda" ||
    role.startsWith("agenda_")
  );
}

function isAgendaDefinition(definitionId: string): boolean {
  return (
    DEMO_CARDS_BY_ID[definitionId]?.type === "agenda" ||
    RUNTIME_CARDS[definitionId]?.type === "agenda"
  );
}

function agendaPointsForDefinition(definitionId: string): number {
  return (
    DEMO_CARDS_BY_ID[definitionId]?.agendaPoints ??
    RUNTIME_CARDS[definitionId]?.numeric.agendaPoints ??
    0
  );
}

function isRemoteScoringIceInstall(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  if (
    action.type !== "install_card" ||
    action.payload?.placement !== "ice" ||
    !isRemoteServerId(action.payload?.serverId)
  )
    return false;
  const card = findVisibleCard(input, action.source);
  if (!card?.definitionId) return false;
  return (
    DEMO_CARDS_BY_ID[card.definitionId]?.type === "ice" ||
    RUNTIME_CARDS[card.definitionId]?.type === "ice"
  );
}

function rezCostForActionSource(
  input: AiDecisionInput,
  action: LegalAction,
): number {
  return rezCostForVisibleCard(findVisibleCard(input, action.source));
}

function rezCostForVisibleCard(card: VisibleCard | undefined): number {
  if (!card?.definitionId) return 0;
  return (
    card.rezCost ??
    RUNTIME_CARDS[card.definitionId]?.numeric.rezCost ??
    DEMO_CARDS_BY_ID[card.definitionId]?.rezCost ??
    0
  );
}

function explanationForPlan(kind: CorpPlanDebug["planKind"]): string {
  switch (kind) {
    case "score_now":
      return "Die Corp nutzt ein sichtbares legales Scoring-Fenster.";
    case "score_next_turn":
      return "Die Corp bereitet aus legalen Aktionen ein naheliegendes Scoring-Fenster vor.";
    case "build_scoring_remote":
      return "Die Corp baut anhand sichtbarer Lage einen Scoring-Remote auf.";
    case "protect_hq":
      return "Die Corp schützt HQ gegen sichtbaren Zentralserverdruck.";
    case "protect_rnd":
      return "Die Corp schützt R&D gegen sichtbaren Zentralserverdruck.";
    case "recover_economy":
      return "Die Corp priorisiert ihre sichtbare Credit-Reserve.";
    case "bait_runner":
      return "Die Corp setzt einen legalen Remote-Impuls, ohne verdeckte Runnerdaten zu verwenden.";
    case "fallback":
      return "Die Corp nutzt einen legalen Fallback.";
  }
}

function isRemoteServerId(value: unknown): boolean {
  return (
    value === "new_remote" ||
    (typeof value === "string" && value.startsWith("remote_"))
  );
}

function scrubPlanEvidence(evidence: string[]): string[] {
  const forbidden = [
    "cardInstances",
    "privatePayload",
    "sessionToken",
    "reconnectToken",
    "joinToken",
    "tokenHash",
    "fullGameState",
    "FullState",
  ];
  return evidence
    .filter(
      (entry) =>
        !forbidden.some((needle) => entry.includes(needle)) &&
        !entry.includes("runner_simple_"),
    )
    .slice(0, 32);
}

function confidence(score: number, actionCount: number): number {
  return Math.max(
    0.15,
    Math.min(0.98, round(score / 1000 + Math.min(actionCount, 3) * 0.03)),
  );
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  return value as Record<string, unknown>;
}

function compareAction(left: LegalAction, right: LegalAction): number {
  return left.actionId.localeCompare(right.actionId);
}
