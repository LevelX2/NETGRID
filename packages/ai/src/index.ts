import { applyAction, createGame, createGameAfterSetup, getLegalActions, getPlayerView, hashState, replayEvents } from "@netgrid/engine";
import aiProfilesData from "../../../data/ai/ai-profiles-0.9.json";
import soakSeedsData from "../../../data/ai/ai-soak-seeds-0.9.json";
import benchmarkProfiles143Data from "../../../data/ai/ai-benchmark-profiles-1.4.3.json";
import soakSeeds143Data from "../../../data/ai/ai-soak-seeds-1.4.3.json";
import exploitFixtures143Data from "../../../data/scenarios/ai-v143-exploit-regression-fixtures.json";
import { chooseCorpPlanAction, hasCorpPlanAction } from "./corp-plans";
import { chooseRunnerPlanAction, hasRunnerPlanAction } from "./runner-plans";
import { beliefDebugSummary, reconstructBeliefState } from "./belief-state";
import { buildDeckDoctrineProfile, evaluateCorpOpeningHand, evaluateRunnerOpeningHand, type AiDeckDoctrineDeckSnapshot } from "./deck-doctrine";
import { CARD_ROLES_BY_CARD, RUNTIME_CARDS } from "./ai-hints";
import { canBreakerDefinitionBreakIce, iceHasEndTheRun } from "./visible-run-analysis";
import { buildAiDecisionInputDto } from "./input-dto";
import { DEMO_CARDS_BY_ID, DEMO_DECKS, type AiDeckDoctrineProfile, type AiDecision, type AiDecisionInput, type AiDifficulty, type DeckDefinition, type DeckPublicMetadata, type GameState, type LegalAction, type PublicGameEvent, type Side } from "@netgrid/shared";
export { beliefDebugSummary, beliefStateInvariantSignature, reconstructBeliefState } from "./belief-state";
export type {
  BeliefEntry,
  BeliefEventClassification,
  BeliefEventFamily,
  BeliefKnowledgeKind,
  BeliefState,
  CorpOpponentModel,
  KnownHqHandMemory,
  KnownPositionMemory,
  RndTopFreshnessMemory,
  RunnerOpponentModel
} from "./belief-state";
export {
  AI_DECISION_INPUT_TOP_LEVEL_FIELDS,
  buildAiDecisionInputDto,
} from "./input-dto";

export {
  chooseCorpPlanAction,
  chooseCorpPlanDecision,
  corpPlanUsesOnlyAiSupportedCards,
  evaluateAgendaRisk,
  evaluateCorpPlan,
  evaluateEconomyReserve,
  evaluateCorpScoringProgress,
  evaluateIceRez,
  evaluateRemoteIntentMemory,
  evaluateRemoteScoreHorizon,
  evaluateRunnerContestCapacity,
  evaluateScoringWindow,
  evaluateServerThreat,
  generateCorpPlanCandidates,
  hasCorpPlanAction
} from "./corp-plans";
export type { CorpPlanCandidate, CorpPlanDebug, CorpPlanDecision, CorpPlanEvaluatorResult, CorpPlanKind, CorpPlanScore, CorpPlanStep, RemoteScoreHorizon, RunnerContestCapacity } from "./corp-plans";
export {
  chooseRunnerPlanAction,
  chooseRunnerPlanDecision,
  estimateRunCost,
  evaluateRunnerEarlyTurnDoctrine,
  evaluateCorpScoringThreat,
  evaluateRemoteThreat,
  evaluateRunnerPlan,
  evaluateRunnerRig,
  evaluateServerAccessValue,
  generateRunnerPlanCandidates,
  hasRunnerPlanAction,
  runnerPlanUsesOnlyAiSupportedCards
} from "./runner-plans";
export type { RunnerPlanCandidate, RunnerPlanDebug, RunnerPlanDecision, RunnerPlanEvaluatorResult, RunnerPlanKind, RunnerPlanScore, RunnerPlanStep } from "./runner-plans";
export { buildDeckDoctrineProfile, evaluateCorpOpeningHand, evaluateRunnerOpeningHand } from "./deck-doctrine";
export type { AiDeckDoctrineDeckSnapshot, CorpOpeningHandEvaluation, OpeningHandEvaluation, RunnerOpeningHandEvaluation } from "./deck-doctrine";

type RankedChoice = {
  action: LegalAction | undefined;
  reasonCode: string;
  explanation: string;
  score: number;
  evidence: string[];
  confidence?: number;
};

type AiProfileData = {
  profileId: string;
  side: Side;
  difficulty: AiDifficulty;
  weights: Record<string, number>;
};

type AiFeatures = {
  side: Side;
  credits: number;
  clicks: number;
  tags: number;
  opponentCredits: number;
  opponentTags: number;
  memoryRemaining: number;
  handCount: number;
  rigRoles: Set<string>;
  rigDefinitionIds: Set<string>;
  handRoles: Set<string>;
  eventCounts: Record<string, number>;
  knownServerPressure: number;
  blockedRunServers: Set<string>;
  serverFeaturesById: Map<string, ServerFeatures>;
};

type ServerFeatures = {
  iceCount: number;
  rootCount: number;
  knownRootCount: number;
  unrezzedRootCount: number;
  rezzedRootCount: number;
};

export type AiObservedFacts = {
  eventCounts: Record<string, number>;
  publicServers: string[];
  tags: number;
  agendaPoints: { own: number; opponent: number };
};

export type AiQualityMetrics = {
  illegalActions: number;
  fallbackRate: number;
  timeoutRate: number;
  reasonCodeCoverage: string[];
  actionTypeCoverage: string[];
  roleCoverage: string[];
  progressScore: number;
  holdout: boolean;
  doctrine: AiDoctrineQualityMetrics;
};

export type AiDoctrineQualityMetrics = {
  nakedAgendaInstalls: number;
  agendaFloodExposure: number;
  scoreWindowMissed: number;
  remoteOverbuild: number;
  economyStall: number;
  repeatedLowValueCentralRun: number;
  rigStall: number;
  assetTrashNeglect: number;
};

export type AiDoctrineQualityMetricName = keyof AiDoctrineQualityMetrics;
export type AiDoctrineQualityDelta = AiDoctrineQualityMetrics;

export type AiDoctrineQualityBenchmarkResult = {
  version: "ai-deck-doctrine-quality-v1";
  baselineProfile: SimulationBenchmarkProfileId;
  candidateProfile: SimulationBenchmarkProfileId;
  seeds: string[];
  baseline: AiDoctrineQualityMetrics;
  candidate: AiDoctrineQualityMetrics;
  delta: AiDoctrineQualityDelta;
  safety: {
    illegalActionDelta: number;
    replayFailureDelta: number;
    timeoutRateDelta: number;
    fallbackRateDelta: number;
  };
  baselineRun: V143SimulationRunResult;
  candidateRun: V143SimulationRunResult;
};

export type AiMatchProgressionMetrics = {
  games: number;
  actionLimitRate: number;
  averageActions: number;
  runnerAgendaPoints: number;
  corpAgendaPoints: number;
  runnerSteals: number;
  corpScores: number;
  centralPressureRuns: number;
  hqPressureRuns: number;
  rdPressureRuns: number;
  archivesPressureRuns: number;
  remotePressureRuns: number;
  pressureTargetSwitches: number;
  distinctPressureTargets: number;
  remoteRootInstalls: number;
  remoteIceInstalls: number;
  remoteAdvances: number;
  scoreWindows: number;
  illegalActions: number;
  replayFailures: number;
  fallbackRate: number;
  timeoutRate: number;
};

export type AiMatchProgressionBenchmarkResult = {
  version: "ai-match-progression-v1";
  baselineProfile: SimulationBenchmarkProfileId;
  candidateProfile: SimulationBenchmarkProfileId;
  seeds: string[];
  runnerDeckId: string;
  corpDeckId: string;
  maxActions: number;
  diagnosticOnly: true;
  baseline: AiMatchProgressionMetrics;
  candidate: AiMatchProgressionMetrics;
  delta: AiMatchProgressionMetrics;
  baselineRun: V143SimulationRunResult;
  candidateRun: V143SimulationRunResult;
};

export type AiDoctrineQualityGateThresholds = {
  maxCandidateIllegalActions: number;
  maxCandidateReplayFailures: number;
  maxTimeoutRateDelta: number;
  maxFallbackRateDelta: number;
  maxNakedAgendaInstallDelta: number;
  maxScoreWindowMissedDelta: number;
  maxEconomyStallDelta: number;
  maxRepeatedLowValueCentralRunDelta: number;
};

export type AiDoctrineQualityGateResult = {
  accepted: boolean;
  thresholds: AiDoctrineQualityGateThresholds;
  hardFailures: string[];
  warnings: string[];
};

export type AiDoctrineQualityCaseExample = {
  metric: AiDoctrineQualityMetricName;
  seed: string;
  actionIndex: number;
  stateVersionBefore: number;
  side: Side;
  actionType: LegalAction["type"];
  reasonCode: string;
  targetServerId?: string;
  qualityTags: string[];
};

export type AiDoctrineQualityCaseAnalysis = {
  version: "ai-deck-doctrine-case-analysis-v1";
  maxExamplesPerMetric: number;
  totals: AiDoctrineQualityMetrics;
  examples: Record<AiDoctrineQualityMetricName, AiDoctrineQualityCaseExample[]>;
  redactionSafe: boolean;
};

export type AiSoakResult = {
  summaries: AiSimulationSummary[];
  aggregate: {
    seeds: number;
    illegalActions: number;
    replayFailures: number;
    fallbackRate: number;
    timeoutRate: number;
    reasonCodeCoverage: string[];
    actionTypeCoverage: string[];
    holdoutSeeds: string[];
  };
};

export type SimulationControllerMode =
  | "random_legal_bot"
  | "basic_corp_ai"
  | "basic_runner_ai"
  | "plan_corp_v1_4_0"
  | "plan_runner_v1_4_1"
  | "belief_ai_v1_4_2"
  | "current_candidate";

export type SimulationBenchmarkProfileId =
  | "random_legal_bot"
  | "basic_corp_ai"
  | "basic_runner_ai"
  | "plan_corp_v1_4_0"
  | "plan_runner_v1_4_1"
  | "belief_ai_v1_4_2"
  | "current_candidate";

export type SimulationBenchmarkProfile = {
  benchmarkProfileId: SimulationBenchmarkProfileId;
  runnerMode: SimulationControllerMode;
  corpMode: SimulationControllerMode;
};

export type SimulationWorld = {
  worldId: string;
  sourceBeliefVersion: string;
  seed: string;
  hiddenAssumptions: string[];
  redactionSafe: boolean;
};

export type V143SimulationRunResult = {
  simulationId: string;
  benchmarkProfile: SimulationBenchmarkProfileId;
  games: number;
  illegalActions: number;
  timeouts: number;
  fallbackRate: number;
  winRates: Record<string, number>;
  agendaPoints: Record<string, number>;
  averageActions: number;
  replayFailures: number;
  notableExploitRefs: string[];
  summaries: AiSimulationSummary[];
};

export type V143TuningGateResult = {
  accepted: boolean;
  holdoutDelta: {
    winRate: number;
    fallbackRate: number;
    timeoutRate: number;
    illegalActions: number;
    replayFailures: number;
  };
  reason: string;
};

export type V143SoakResult = {
  version: "1.4.3";
  profiles: V143SimulationRunResult[];
  holdoutSeeds: string[];
  tuningSeeds: string[];
};

export type V143LeagueConfig = Partial<AiSimulationConfig> & { includeHoldout?: boolean };

export type AiDoctrineQualityBenchmarkConfig = V143LeagueConfig & {
  baselineProfile?: SimulationBenchmarkProfileId;
  candidateProfile?: SimulationBenchmarkProfileId;
};

export type V143ExploitFixture = {
  fixtureId: string;
  title: string;
  category: string;
  expectedBadBehavior: string;
  expectedGoodBehavior: string;
  hiddenInfoSafe: boolean;
};

export type V143ExploitRegressionResult = {
  fixtureId: string;
  passed: boolean;
  message: string;
};

const AI_PROFILES = aiProfilesData.profiles as AiProfileData[];
const SOAK_SEEDS = soakSeedsData as {
  tuningSeeds: string[];
  holdoutSeeds: string[];
  matrix: {
    runnerDeckId: "demo_runner_008";
    corpDeckId: "demo_corp_008";
    agendaPointsToWin: number;
    difficulties: AiDifficulty[];
    maxActions: number;
  };
};
const BENCHMARK_PROFILES_143 = benchmarkProfiles143Data as { version: "1.4.3"; profiles: SimulationBenchmarkProfile[] };
const SOAK_SEEDS_143 = soakSeeds143Data as {
  version: "1.4.3";
  tuningSeeds: string[];
  holdoutSeeds: string[];
  league: {
    runnerDeckId: "demo_runner_008";
    corpDeckId: "demo_corp_008";
    agendaPointsToWin: number;
    maxActions: number;
  };
};
const EXPLOIT_FIXTURES_143 = exploitFixtures143Data as { version: "1.4.3"; fixtures: V143ExploitFixture[] };

export type AiSimulationConfig = {
  seed?: string;
  maxActions?: number;
  agendaPointsToWin?: number;
  runnerDifficulty?: AiDifficulty;
  corpDifficulty?: AiDifficulty;
  runnerProfileId?: string;
  corpProfileId?: string;
  runnerDeckId?: "demo_runner_001" | "demo_runner_004" | "demo_runner_008" | "demo_runner_096" | "demo_runner_097" | "demo_runner_098" | "demo_runner_099";
  corpDeckId?: "demo_corp_001" | "demo_corp_004" | "demo_corp_008" | "demo_corp_096" | "demo_corp_097" | "demo_corp_098" | "demo_corp_099";
  runnerDeck?: DeckDefinition;
  corpDeck?: DeckDefinition;
  runnerDeckMetadata?: DeckPublicMetadata;
  corpDeckMetadata?: DeckPublicMetadata;
  runnerControllerMode?: SimulationControllerMode;
  corpControllerMode?: SimulationControllerMode;
  simulationRngSeed?: string;
  beliefWorld?: SimulationWorld;
};

export type AiSimulationSummary = {
  seed: string;
  winner: Exclude<GameState["winner"], null> | "action_limit_reached";
  actions: number;
  turns: number;
  finalAgendaPoints: { runner: number; corp: number };
  finalStateHash: string;
  eventLogLength: number;
  replayOk: boolean;
  replayErrors: string[];
  actionSequence: Array<{
    side: Side;
    stateVersionBefore: number;
    actionType: LegalAction["type"];
    reasonCode: string;
    explanation: string;
    confidence: number;
    evidence: string[];
    fallbackUsed: boolean;
    timeoutUsed: boolean;
    targetServerId?: string;
    qualityTags: string[];
    stateHashAfter: string;
    installPlacement?: string;
  }>;
  errors: string[];
  cardPoolVersion: "0.1.0" | "0.4.0" | "0.8.0" | "0.94.0" | "0.95.0" | "0.96.0" | "0.97.0" | "0.98.0" | "0.99.0";
  metrics: AiQualityMetrics;
};

const FORBIDDEN_AI_INPUT_FIELDS = [
  "cardInstances",
  "privatePayload",
  "sessionToken",
  "reconnectToken",
  "joinToken",
  "tokenHash",
  "fullGameState"
];

export function buildAiDecisionInput(
  state: GameState,
  side: Side,
  options: {
    difficulty?: AiDifficulty;
    decisionId?: string;
    actionNumber?: number;
    profileId?: string;
    eventTail?: PublicGameEvent[];
    ownDeckSnapshot?: AiDeckDoctrineDeckSnapshot;
    ownDeckDoctrine?: AiDeckDoctrineProfile;
  } = {}
): AiDecisionInput {
  const playerView = getPlayerView(state, side);
  const ownDeckDoctrine = options.ownDeckDoctrine ?? (options.ownDeckSnapshot ? buildDeckDoctrineProfile(options.ownDeckSnapshot) : undefined);
  return buildAiDecisionInputDto({
    side,
    playerView,
    eventTail: options.eventTail ?? playerView.publicEvents,
    legalActions: getLegalActions(state, side),
    difficulty: options.difficulty ?? "normal",
    seed: state.seed,
    decisionId: options.decisionId ?? `${state.matchId}:${state.stateVersion}:${side}`,
    actionNumber: options.actionNumber ?? state.stateVersion,
    profileId: options.profileId ?? `${side}-ai-v0.9-${options.difficulty ?? "normal"}`,
    ...(ownDeckDoctrine ? { ownDeckDoctrine } : {})
  });
}

export function chooseAiAction(input: AiDecisionInput): AiDecision {
  return input.side === "runner" ? chooseRunnerAction(input) : chooseCorpAction(input);
}

export function chooseCorpAction(input: AiDecisionInput): AiDecision {
  const baselineDecision = chooseCorpBaselineAction(input);
  return hasCorpPlanAction(input) && !isCorpReactiveBaselineDecision(baselineDecision) ? chooseCorpPlanAction(input, baselineDecision) : baselineDecision;
}

export function chooseCorpBaselineAction(input: AiDecisionInput): AiDecision {
  return decisionFromChoices(input, scoreActions(input, "corp"));
}

export function chooseRunnerAction(input: AiDecisionInput): AiDecision {
  const baselineDecision = chooseRunnerBaselineAction(input);
  return hasRunnerPlanAction(input) && !isRunnerReactiveBaselineDecision(baselineDecision) ? chooseRunnerPlanAction(input, baselineDecision) : baselineDecision;
}

export function chooseRunnerBaselineAction(input: AiDecisionInput): AiDecision {
  return decisionFromChoices(input, scoreActions(input, "runner"));
}

function isCorpReactiveBaselineDecision(decision: AiDecision): boolean {
  return (
    decision.reasonCode === "corp.choice.resolve" ||
    decision.reasonCode === "corp.trace.bid_visible_amount" ||
    decision.reasonCode === "corp.mandatory_draw" ||
    decision.reasonCode === "corp.rez.defensive_card" ||
    decision.reasonCode === "corp.rez.decline" ||
    decision.reasonCode === "corp.tag.punish_visible_tag" ||
    decision.reasonCode === "corp.tag.trash_visible_resource" ||
    decision.reasonCode === "corp.purge.visible_virus_counters"
  );
}

function isRunnerReactiveBaselineDecision(decision: AiDecision): boolean {
  return (
    decision.reasonCode === "runner.choice.resolve" ||
    decision.reasonCode === "runner.trace.post_bid_link" ||
    decision.reasonCode === "runner.setup.keep" ||
    decision.reasonCode === "runner.setup.mulligan" ||
    decision.reasonCode === "runner.trace.bid_visible_amount" ||
    decision.reasonCode === "runner.access.steal_agenda" ||
    decision.reasonCode === "runner.access.open_card" ||
    decision.reasonCode === "runner.access.decline_trash" ||
    decision.reasonCode === "runner.encounter.break_etr" ||
    decision.reasonCode === "runner.encounter.pump_breaker" ||
    decision.reasonCode === "runner.tag.clear_visible_tag" ||
    decision.reasonCode === "runner.shell_traders.prepare_install" ||
    decision.reasonCode === "runner.shell_traders.remove_counter"
  );
}

export function assertAiInputIsSideSafe(input: AiDecisionInput): boolean {
  const serialized = JSON.stringify(input);
  if (FORBIDDEN_AI_INPUT_FIELDS.some((needle) => serialized.includes(needle))) return false;
  return true;
}

export function simulateAiGame(config: AiSimulationConfig = {}): AiSimulationSummary {
  const deckSupportErrors = validateSimulationDeckSupport(config);
  if (deckSupportErrors.length > 0) {
    return {
      seed: config.seed ?? "ai-vs-ai-smoke",
      winner: "action_limit_reached",
      actions: 0,
      turns: 0,
      finalAgendaPoints: { runner: 0, corp: 0 },
      finalStateHash: "fnv1a:00000000",
      eventLogLength: 0,
      replayOk: false,
      replayErrors: [],
      actionSequence: [],
      errors: deckSupportErrors,
      cardPoolVersion: cardPoolVersionForSimulation(config),
      metrics: metricsFor([], deckSupportErrors, false, isHoldoutSeed(config.seed ?? "ai-vs-ai-smoke"))
    };
  }

  const seed = config.seed ?? "ai-vs-ai-smoke";
  const simulationRng = createSimulationRng(config.simulationRngSeed ?? `${seed}:sim-rng`);
  const runnerDeckDefinition = config.runnerDeck ?? DEMO_DECKS[config.runnerDeckId ?? "demo_runner_001"];
  const corpDeckDefinition = config.corpDeck ?? DEMO_DECKS[config.corpDeckId ?? "demo_corp_001"];
  let state = createGame({
    seed,
    agendaPointsToWin: config.agendaPointsToWin ?? 7,
    ...(config.runnerDeckId ? { runnerDeckId: config.runnerDeckId } : {}),
    ...(config.corpDeckId ? { corpDeckId: config.corpDeckId } : {}),
    ...(config.runnerDeck ? { runnerDeck: config.runnerDeck } : {}),
    ...(config.corpDeck ? { corpDeck: config.corpDeck } : {}),
    ...(config.runnerDeckMetadata ? { runnerDeckMetadata: config.runnerDeckMetadata } : {}),
    ...(config.corpDeckMetadata ? { corpDeckMetadata: config.corpDeckMetadata } : {}),
    controllers: {
      runner: {
        controllerId: "runner-ai",
        side: "runner",
        type: "ai",
        displayName: "Runner KI",
        difficulty: config.runnerDifficulty ?? "normal",
        profileId: config.runnerProfileId ?? `runner-ai-v0.9-${config.runnerDifficulty ?? "normal"}`
      },
      corp: {
        controllerId: "corp-ai",
        side: "corp",
        type: "ai",
        displayName: "Corp KI",
        difficulty: config.corpDifficulty ?? "normal",
        profileId: config.corpProfileId ?? `corp-ai-v0.9-${config.corpDifficulty ?? "normal"}`
      }
    }
  });
  const initial = structuredClone(state);
  const deckSnapshots: Record<Side, AiDeckDoctrineDeckSnapshot> = {
    runner: deckSnapshotForSimulation(runnerDeckDefinition, state.deckMetadata?.runner ?? config.runnerDeckMetadata),
    corp: deckSnapshotForSimulation(corpDeckDefinition, state.deckMetadata?.corp ?? config.corpDeckMetadata)
  };
  const actionSequence: AiSimulationSummary["actionSequence"] = [];
  const errors: string[] = [];
  const maxActions = config.maxActions ?? 120;

  for (let index = 0; index < maxActions && !state.winner; index += 1) {
    const side = state.activeSide;
    const input = buildAiDecisionInput(state, side, {
      difficulty: side === "runner" ? config.runnerDifficulty ?? "normal" : config.corpDifficulty ?? "normal",
      actionNumber: index,
      decisionId: `${seed}:${index}:${side}`,
      profileId:
        side === "runner"
          ? config.runnerProfileId ?? `runner-ai-v0.9-${config.runnerDifficulty ?? "normal"}`
          : config.corpProfileId ?? `corp-ai-v0.9-${config.corpDifficulty ?? "normal"}`,
      ...(controllerModeForSide(side, config) === "current_candidate" ? { ownDeckSnapshot: deckSnapshots[side] } : {})
    });
    if (!assertAiInputIsSideSafe(input)) {
      errors.push(`Simulation input is not side-safe for ${side} at ${state.stateVersion}.`);
      break;
    }
    const decision = chooseDecisionForSimulation(side, input, config, simulationRng);
    const action = input.legalActions.find((candidate) => candidate.actionId === decision.actionId);
    if (!action) {
      errors.push(`No legal action for ${side} at ${state.stateVersion}.`);
      break;
    }
    const result = applyAction(state, {
      matchId: state.matchId,
      side,
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(decision.selectedChoices ? { selectedChoices: decision.selectedChoices } : {}),
      idempotencyKey: `ai-sim-${index}`
    });
    if (!result.ok) {
      errors.push(`${result.error.code} at stateVersion ${state.stateVersion}.`);
      break;
    }
    actionSequence.push({
      side,
      stateVersionBefore: result.event.stateVersionBefore,
      actionType: action.type,
      reasonCode: decision.reasonCode,
      explanation: decision.explanation,
      confidence: decision.confidence ?? 0,
      evidence: decision.evidence ?? [],
      fallbackUsed: decision.fallbackUsed,
      timeoutUsed: decision.timeoutUsed ?? false,
      ...(typeof action.payload?.serverId === "string" ? { targetServerId: action.payload.serverId } : {}),
      ...(typeof action.payload?.placement === "string" ? { installPlacement: action.payload.placement } : {}),
      qualityTags: qualityTagsForAction(input, action, decision),
      stateHashAfter: result.stateHash
    });
    state = result.state;
  }

  const replay = replayEvents(initial, state.eventLog);
  const runnerView = getPlayerView(state, "runner");
  const corpView = getPlayerView(state, "corp");
  return {
    seed,
    winner: state.winner ?? "action_limit_reached",
    actions: actionSequence.length,
    turns: state.eventLog.filter((event) => event.type === "end_turn").length,
    finalAgendaPoints: { runner: runnerView.own.agendaPoints, corp: corpView.own.agendaPoints },
    finalStateHash: hashState(state),
    eventLogLength: state.eventLog.length,
    replayOk: replay.ok,
    replayErrors: replay.errors,
    actionSequence,
    errors,
    cardPoolVersion: cardPoolVersionForSimulation(config),
    metrics: metricsFor(actionSequence, errors, replay.ok, isHoldoutSeed(seed))
  };
}

export function simulateAiSoak(config: Partial<AiSimulationConfig> = {}): AiSoakResult {
  const summaries = [...SOAK_SEEDS.tuningSeeds, ...SOAK_SEEDS.holdoutSeeds].flatMap((seed) =>
    SOAK_SEEDS.matrix.difficulties.map((difficulty) =>
      simulateAiGame({
        seed,
        runnerDeckId: config.runnerDeckId ?? SOAK_SEEDS.matrix.runnerDeckId,
        corpDeckId: config.corpDeckId ?? SOAK_SEEDS.matrix.corpDeckId,
        agendaPointsToWin: config.agendaPointsToWin ?? SOAK_SEEDS.matrix.agendaPointsToWin,
        maxActions: config.maxActions ?? SOAK_SEEDS.matrix.maxActions,
        runnerDifficulty: config.runnerDifficulty ?? difficulty,
        corpDifficulty: config.corpDifficulty ?? difficulty
      })
    )
  );
  const totalActions = summaries.reduce((sum, summary) => sum + summary.actionSequence.length, 0) || 1;
  const fallbacks = summaries.reduce((sum, summary) => sum + summary.actionSequence.filter((entry) => entry.fallbackUsed).length, 0);
  const timeouts = summaries.reduce((sum, summary) => sum + summary.actionSequence.filter((entry) => entry.timeoutUsed).length, 0);
  return {
    summaries,
    aggregate: {
      seeds: summaries.length,
      illegalActions: summaries.reduce((sum, summary) => sum + summary.metrics.illegalActions, 0),
      replayFailures: summaries.filter((summary) => !summary.replayOk).length,
      fallbackRate: round(fallbacks / totalActions),
      timeoutRate: round(timeouts / totalActions),
      reasonCodeCoverage: sortedUnique(summaries.flatMap((summary) => summary.metrics.reasonCodeCoverage)),
      actionTypeCoverage: sortedUnique(summaries.flatMap((summary) => summary.metrics.actionTypeCoverage)),
      holdoutSeeds: SOAK_SEEDS.holdoutSeeds
    }
  };
}

export function summarizeDoctrineQualityMetrics(actionSequence: AiSimulationSummary["actionSequence"]): AiDoctrineQualityMetrics {
  return doctrineMetricsFor([...actionSequence.flatMap((entry) => entry.qualityTags), ...repeatedLowValueCentralRunTags(actionSequence)]);
}

export function listV143BenchmarkProfiles(): SimulationBenchmarkProfile[] {
  return BENCHMARK_PROFILES_143.profiles.map((profile) => ({ ...profile }));
}

export function listV143ExploitFixtures(): V143ExploitFixture[] {
  return EXPLOIT_FIXTURES_143.fixtures.map((fixture) => ({ ...fixture }));
}

export function createBeliefSimulationWorld(input: AiDecisionInput, seed: string = `${input.seed}:belief:${input.actionNumber}`): SimulationWorld {
  const belief = reconstructBeliefState(input);
  const hypotheses = belief.entries.filter((entry) => entry.kind === "hypothesis").map((entry) => entry.subject);
  return {
    worldId: `simworld:${input.side}:${belief.version}:${seed}`,
    sourceBeliefVersion: belief.version,
    seed,
    hiddenAssumptions: hypotheses.slice(0, 12),
    redactionSafe: assertAiInputIsSideSafe(input)
  };
}

export function runV143SimulationLeague(config: V143LeagueConfig = {}): V143SoakResult {
  const tuningSeeds = SOAK_SEEDS_143.tuningSeeds;
  const holdoutSeeds = SOAK_SEEDS_143.holdoutSeeds;
  const seeds = config.includeHoldout === false ? tuningSeeds : [...tuningSeeds, ...holdoutSeeds];
  const profiles = BENCHMARK_PROFILES_143.profiles.map((profile) => runV143Profile(profile, seeds, config));
  return {
    version: "1.4.3",
    profiles,
    holdoutSeeds,
    tuningSeeds
  };
}

export function runDoctrineQualityBenchmark(config: AiDoctrineQualityBenchmarkConfig = {}): AiDoctrineQualityBenchmarkResult {
  const baselineProfileId = config.baselineProfile ?? "belief_ai_v1_4_2";
  const candidateProfileId = config.candidateProfile ?? "current_candidate";
  const baselineProfile = benchmarkProfileById(baselineProfileId);
  const candidateProfile = benchmarkProfileById(candidateProfileId);
  const seeds = config.includeHoldout === false ? SOAK_SEEDS_143.tuningSeeds : [...SOAK_SEEDS_143.tuningSeeds, ...SOAK_SEEDS_143.holdoutSeeds];
  const baselineRun = runV143Profile(baselineProfile, seeds, config);
  const candidateRun = runV143Profile(candidateProfile, seeds, config);
  const baseline = sumDoctrineMetrics(baselineRun.summaries.map((summary) => summary.metrics.doctrine));
  const candidate = sumDoctrineMetrics(candidateRun.summaries.map((summary) => summary.metrics.doctrine));
  return {
    version: "ai-deck-doctrine-quality-v1",
    baselineProfile: baselineProfileId,
    candidateProfile: candidateProfileId,
    seeds,
    baseline,
    candidate,
    delta: diffDoctrineMetrics(candidate, baseline),
    safety: {
      illegalActionDelta: candidateRun.illegalActions - baselineRun.illegalActions,
      replayFailureDelta: candidateRun.replayFailures - baselineRun.replayFailures,
      timeoutRateDelta: round(candidateRun.timeouts / Math.max(candidateRun.games, 1) - baselineRun.timeouts / Math.max(baselineRun.games, 1)),
      fallbackRateDelta: round(candidateRun.fallbackRate - baselineRun.fallbackRate)
    },
    baselineRun,
    candidateRun
  };
}

export function runMatchProgressionBenchmark(config: AiDoctrineQualityBenchmarkConfig = {}): AiMatchProgressionBenchmarkResult {
  const baselineProfileId = config.baselineProfile ?? "belief_ai_v1_4_2";
  const candidateProfileId = config.candidateProfile ?? "current_candidate";
  const baselineProfile = benchmarkProfileById(baselineProfileId);
  const candidateProfile = benchmarkProfileById(candidateProfileId);
  const seeds = config.includeHoldout === false ? SOAK_SEEDS_143.tuningSeeds : [...SOAK_SEEDS_143.tuningSeeds, ...SOAK_SEEDS_143.holdoutSeeds];
  const baselineRun = runV143Profile(baselineProfile, seeds, config);
  const candidateRun = runV143Profile(candidateProfile, seeds, config);
  const baseline = summarizeMatchProgressionMetrics(baselineRun.summaries);
  const candidate = summarizeMatchProgressionMetrics(candidateRun.summaries);
  return {
    version: "ai-match-progression-v1",
    baselineProfile: baselineProfileId,
    candidateProfile: candidateProfileId,
    seeds,
    runnerDeckId: config.runnerDeckId ?? SOAK_SEEDS_143.league.runnerDeckId,
    corpDeckId: config.corpDeckId ?? SOAK_SEEDS_143.league.corpDeckId,
    maxActions: config.maxActions ?? SOAK_SEEDS_143.league.maxActions,
    diagnosticOnly: true,
    baseline,
    candidate,
    delta: diffMatchProgressionMetrics(candidate, baseline),
    baselineRun,
    candidateRun
  };
}

export function evaluateDoctrineQualityGate(
  benchmark: AiDoctrineQualityBenchmarkResult,
  thresholds: Partial<AiDoctrineQualityGateThresholds> = {}
): AiDoctrineQualityGateResult {
  const resolved: AiDoctrineQualityGateThresholds = {
    maxCandidateIllegalActions: thresholds.maxCandidateIllegalActions ?? 0,
    maxCandidateReplayFailures: thresholds.maxCandidateReplayFailures ?? 0,
    maxTimeoutRateDelta: thresholds.maxTimeoutRateDelta ?? 0,
    maxFallbackRateDelta: thresholds.maxFallbackRateDelta ?? 0.02,
    maxNakedAgendaInstallDelta: thresholds.maxNakedAgendaInstallDelta ?? 0,
    maxScoreWindowMissedDelta: thresholds.maxScoreWindowMissedDelta ?? 0,
    maxEconomyStallDelta: thresholds.maxEconomyStallDelta ?? 2,
    maxRepeatedLowValueCentralRunDelta: thresholds.maxRepeatedLowValueCentralRunDelta ?? 2
  };
  const hardFailures = [
    ...(benchmark.candidateRun.illegalActions > resolved.maxCandidateIllegalActions ? [`candidate_illegal_actions:${benchmark.candidateRun.illegalActions}`] : []),
    ...(benchmark.candidateRun.replayFailures > resolved.maxCandidateReplayFailures ? [`candidate_replay_failures:${benchmark.candidateRun.replayFailures}`] : []),
    ...(benchmark.safety.timeoutRateDelta > resolved.maxTimeoutRateDelta ? [`timeout_rate_delta:${benchmark.safety.timeoutRateDelta}`] : []),
    ...(benchmark.safety.fallbackRateDelta > resolved.maxFallbackRateDelta ? [`fallback_rate_delta:${benchmark.safety.fallbackRateDelta}`] : []),
    ...(benchmark.delta.nakedAgendaInstalls > resolved.maxNakedAgendaInstallDelta ? [`naked_agenda_install_delta:${benchmark.delta.nakedAgendaInstalls}`] : []),
    ...(benchmark.delta.scoreWindowMissed > resolved.maxScoreWindowMissedDelta ? [`score_window_missed_delta:${benchmark.delta.scoreWindowMissed}`] : []),
    ...(benchmark.delta.economyStall > resolved.maxEconomyStallDelta ? [`economy_stall_delta:${benchmark.delta.economyStall}`] : []),
    ...(benchmark.delta.repeatedLowValueCentralRun > resolved.maxRepeatedLowValueCentralRunDelta ? [`repeated_low_value_central_run_delta:${benchmark.delta.repeatedLowValueCentralRun}`] : [])
  ];
  const warnings = [
    ...(benchmark.delta.remoteOverbuild > 0 ? [`remote_overbuild_delta:${benchmark.delta.remoteOverbuild}`] : []),
    ...(benchmark.delta.rigStall > 0 ? [`rig_stall_delta:${benchmark.delta.rigStall}`] : []),
    ...(benchmark.delta.assetTrashNeglect > 0 ? [`asset_trash_neglect_delta:${benchmark.delta.assetTrashNeglect}`] : [])
  ];
  return {
    accepted: hardFailures.length === 0,
    thresholds: resolved,
    hardFailures,
    warnings
  };
}

export function formatDoctrineQualityBenchmarkReport(
  benchmark: AiDoctrineQualityBenchmarkResult,
  gate: AiDoctrineQualityGateResult = evaluateDoctrineQualityGate(benchmark)
): string {
  const doctrineRows = [
    ["nakedAgendaInstalls", benchmark.baseline.nakedAgendaInstalls, benchmark.candidate.nakedAgendaInstalls, benchmark.delta.nakedAgendaInstalls],
    ["agendaFloodExposure", benchmark.baseline.agendaFloodExposure, benchmark.candidate.agendaFloodExposure, benchmark.delta.agendaFloodExposure],
    ["scoreWindowMissed", benchmark.baseline.scoreWindowMissed, benchmark.candidate.scoreWindowMissed, benchmark.delta.scoreWindowMissed],
    ["remoteOverbuild", benchmark.baseline.remoteOverbuild, benchmark.candidate.remoteOverbuild, benchmark.delta.remoteOverbuild],
    ["economyStall", benchmark.baseline.economyStall, benchmark.candidate.economyStall, benchmark.delta.economyStall],
    ["repeatedLowValueCentralRun", benchmark.baseline.repeatedLowValueCentralRun, benchmark.candidate.repeatedLowValueCentralRun, benchmark.delta.repeatedLowValueCentralRun],
    ["rigStall", benchmark.baseline.rigStall, benchmark.candidate.rigStall, benchmark.delta.rigStall],
    ["assetTrashNeglect", benchmark.baseline.assetTrashNeglect, benchmark.candidate.assetTrashNeglect, benchmark.delta.assetTrashNeglect]
  ];
  const safetyRows = [
    ["illegalActionDelta", benchmark.safety.illegalActionDelta],
    ["replayFailureDelta", benchmark.safety.replayFailureDelta],
    ["timeoutRateDelta", benchmark.safety.timeoutRateDelta],
    ["fallbackRateDelta", benchmark.safety.fallbackRateDelta]
  ];
  return [
    "# AI Deck Doctrine Quality Benchmark Report",
    "",
    `Version: ${benchmark.version}`,
    `Baseline: ${benchmark.baselineProfile}`,
    `Candidate: ${benchmark.candidateProfile}`,
    `Seeds: ${benchmark.seeds.length}`,
    `Gate: ${gate.accepted ? "PASS" : "FAIL"}`,
    "",
    "## Doctrine Delta",
    "",
    "| Metric | Baseline | Candidate | Delta |",
    "| --- | ---: | ---: | ---: |",
    ...doctrineRows.map(([metric, baseline, candidate, delta]) => `| ${metric} | ${baseline} | ${candidate} | ${delta} |`),
    "",
    "## Safety Delta",
    "",
    "| Metric | Delta |",
    "| --- | ---: |",
    ...safetyRows.map(([metric, value]) => `| ${metric} | ${value} |`),
    "",
    "## Gate",
    "",
    `Accepted: ${gate.accepted ? "yes" : "no"}`,
    `Hard failures: ${gate.hardFailures.length > 0 ? gate.hardFailures.join(", ") : "none"}`,
    `Warnings: ${gate.warnings.length > 0 ? gate.warnings.join(", ") : "none"}`,
    "",
    "## Interpretation",
    "",
    gate.accepted
      ? "Der Kandidat verletzt keine harte Safety- oder Doctrine-Schwelle. Einzelne Warnungen bleiben Review-Material, bevor Gewichte angepasst werden."
      : "Der Kandidat verletzt mindestens eine harte Schwelle. Gewichtungs- oder Planänderungen sollten vor weiterer Ausweitung geprüft werden."
  ].join("\n");
}

export function formatMatchProgressionBenchmarkReport(benchmark: AiMatchProgressionBenchmarkResult): string {
  const progressionRows: Array<[string, number, number, number]> = [
    ["actionLimitRate", benchmark.baseline.actionLimitRate, benchmark.candidate.actionLimitRate, benchmark.delta.actionLimitRate],
    ["averageActions", benchmark.baseline.averageActions, benchmark.candidate.averageActions, benchmark.delta.averageActions],
    ["runnerAgendaPoints", benchmark.baseline.runnerAgendaPoints, benchmark.candidate.runnerAgendaPoints, benchmark.delta.runnerAgendaPoints],
    ["corpAgendaPoints", benchmark.baseline.corpAgendaPoints, benchmark.candidate.corpAgendaPoints, benchmark.delta.corpAgendaPoints],
    ["runnerSteals", benchmark.baseline.runnerSteals, benchmark.candidate.runnerSteals, benchmark.delta.runnerSteals],
    ["corpScores", benchmark.baseline.corpScores, benchmark.candidate.corpScores, benchmark.delta.corpScores],
    ["centralPressureRuns", benchmark.baseline.centralPressureRuns, benchmark.candidate.centralPressureRuns, benchmark.delta.centralPressureRuns],
    ["remotePressureRuns", benchmark.baseline.remotePressureRuns, benchmark.candidate.remotePressureRuns, benchmark.delta.remotePressureRuns],
    ["pressureTargetSwitches", benchmark.baseline.pressureTargetSwitches, benchmark.candidate.pressureTargetSwitches, benchmark.delta.pressureTargetSwitches],
    ["remoteRootInstalls", benchmark.baseline.remoteRootInstalls, benchmark.candidate.remoteRootInstalls, benchmark.delta.remoteRootInstalls],
    ["remoteIceInstalls", benchmark.baseline.remoteIceInstalls, benchmark.candidate.remoteIceInstalls, benchmark.delta.remoteIceInstalls],
    ["remoteAdvances", benchmark.baseline.remoteAdvances, benchmark.candidate.remoteAdvances, benchmark.delta.remoteAdvances],
    ["scoreWindows", benchmark.baseline.scoreWindows, benchmark.candidate.scoreWindows, benchmark.delta.scoreWindows]
  ];
  const safetyRows: Array<[string, number, number, number]> = [
    ["illegalActions", benchmark.baseline.illegalActions, benchmark.candidate.illegalActions, benchmark.delta.illegalActions],
    ["replayFailures", benchmark.baseline.replayFailures, benchmark.candidate.replayFailures, benchmark.delta.replayFailures],
    ["fallbackRate", benchmark.baseline.fallbackRate, benchmark.candidate.fallbackRate, benchmark.delta.fallbackRate],
    ["timeoutRate", benchmark.baseline.timeoutRate, benchmark.candidate.timeoutRate, benchmark.delta.timeoutRate]
  ];
  return [
    "# AI Match Progression Benchmark Report",
    "",
    `Version: ${benchmark.version}`,
    `Baseline: ${benchmark.baselineProfile}`,
    `Candidate: ${benchmark.candidateProfile}`,
    `Seeds: ${benchmark.seeds.length}`,
    `Runner deck: ${benchmark.runnerDeckId}`,
    `Corp deck: ${benchmark.corpDeckId}`,
    `Max actions: ${benchmark.maxActions}`,
    "Gate: diagnostic_only",
    "",
    "## Progression Metrics",
    "",
    "| Metric | Baseline | Candidate | Delta |",
    "| --- | ---: | ---: | ---: |",
    ...progressionRows.map(([metric, baseline, candidate, delta]) => `| ${metric} | ${baseline} | ${candidate} | ${delta} |`),
    "",
    "## Safety Metrics",
    "",
    "| Metric | Baseline | Candidate | Delta |",
    "| --- | ---: | ---: | ---: |",
    ...safetyRows.map(([metric, baseline, candidate, delta]) => `| ${metric} | ${baseline} | ${candidate} | ${delta} |`),
    "",
    "## Interpretation",
    "",
    "This benchmark is diagnostic, not a hard release gate. P1 AI tuning should improve progression without increasing illegal actions, replay failures, timeout rate, or fallback rate."
  ].join("\n");
}

export function analyzeDoctrineQualityCases(summaries: AiSimulationSummary[], options: { maxExamplesPerMetric?: number } = {}): AiDoctrineQualityCaseAnalysis {
  const maxExamplesPerMetric = options.maxExamplesPerMetric ?? 3;
  const examples = emptyDoctrineCaseExamples();
  for (const summary of summaries) {
    for (const [actionIndex, entry] of summary.actionSequence.entries()) {
      for (const tag of entry.qualityTags) {
        const metric = doctrineMetricForQualityTag(tag);
        if (!metric || examples[metric].length >= maxExamplesPerMetric) continue;
        examples[metric].push(doctrineCaseExample(summary.seed, actionIndex, entry, metric));
      }
    }
    collectRepeatedLowValueCentralRunExamples(summary, examples, maxExamplesPerMetric);
  }
  const analysis: AiDoctrineQualityCaseAnalysis = {
    version: "ai-deck-doctrine-case-analysis-v1",
    maxExamplesPerMetric,
    totals: sumDoctrineMetrics(summaries.map((summary) => summary.metrics.doctrine)),
    examples,
    redactionSafe: true
  };
  return {
    ...analysis,
    redactionSafe: isRedactionSafeCaseAnalysis(analysis)
  };
}

export function formatDoctrineQualityCaseAnalysisReport(analysis: AiDoctrineQualityCaseAnalysis, title = "AI Deck Doctrine Quality Case Analysis"): string {
  const lines = [
    `# ${title}`,
    "",
    `Version: ${analysis.version}`,
    `Max examples per metric: ${analysis.maxExamplesPerMetric}`,
    `Redaction safe: ${analysis.redactionSafe ? "yes" : "no"}`,
    "",
    "## Totals",
    "",
    "| Metric | Count | Examples |",
    "| --- | ---: | ---: |",
    ...DOCTRINE_QUALITY_METRICS.map((metric) => `| ${metric} | ${analysis.totals[metric]} | ${analysis.examples[metric].length} |`),
    "",
    "## Examples",
    ""
  ];
  for (const metric of DOCTRINE_QUALITY_METRICS) {
    lines.push(`### ${metric}`, "");
    const examples = analysis.examples[metric];
    if (examples.length === 0) {
      lines.push("Keine Beispiele im analysierten Lauf.", "");
      continue;
    }
    lines.push("| Seed | Action | Side | Type | Reason | Server | Tags |", "| --- | ---: | --- | --- | --- | --- | --- |");
    for (const example of examples) {
      lines.push(
        `| ${example.seed} | ${example.actionIndex} | ${example.side} | ${example.actionType} | ${example.reasonCode} | ${example.targetServerId ?? "none"} | ${example.qualityTags.join(", ")} |`
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function evaluateV143TuningGate(candidate: V143SimulationRunResult, baseline: V143SimulationRunResult): V143TuningGateResult {
  const holdoutDelta = {
    winRate: round((candidate.winRates.runner ?? 0) - (baseline.winRates.runner ?? 0)),
    fallbackRate: round(candidate.fallbackRate - baseline.fallbackRate),
    timeoutRate: round(candidate.timeouts / Math.max(candidate.games, 1) - baseline.timeouts / Math.max(baseline.games, 1)),
    illegalActions: candidate.illegalActions - baseline.illegalActions,
    replayFailures: candidate.replayFailures - baseline.replayFailures
  };
  const hardRegression = holdoutDelta.illegalActions > 0 || holdoutDelta.replayFailures > 0 || holdoutDelta.timeoutRate > 0;
  if (hardRegression) {
    return {
      accepted: false,
      holdoutDelta,
      reason: "holdout_regression_on_safety_or_replay"
    };
  }
  const improved = holdoutDelta.winRate >= 0 && holdoutDelta.fallbackRate <= 0 && holdoutDelta.timeoutRate <= 0;
  return {
    accepted: improved,
    holdoutDelta,
    reason: improved ? "holdout_improved_or_stable" : "tradeoff_review_required"
  };
}

export function runV143ExploitRegressionFixtures(config: Partial<AiSimulationConfig> = {}): V143ExploitRegressionResult[] {
  return EXPLOIT_FIXTURES_143.fixtures.map((fixture) => {
    if (fixture.fixtureId === "v143-rnd-repeat-access-freshness") {
      return evaluateV143RndRepeatAccessFreshnessFixture(config);
    }

    const summary = simulateAiGame({
      seed: "v143-exploit-visible-etr",
      runnerDeckId: config.runnerDeckId ?? SOAK_SEEDS_143.league.runnerDeckId,
      corpDeckId: config.corpDeckId ?? SOAK_SEEDS_143.league.corpDeckId,
      agendaPointsToWin: config.agendaPointsToWin ?? SOAK_SEEDS_143.league.agendaPointsToWin,
      maxActions: config.maxActions ?? 90,
      runnerControllerMode: "plan_runner_v1_4_1",
      corpControllerMode: "plan_corp_v1_4_0",
      runnerProfileId: "runner-ai-v1.4.1-normal",
      corpProfileId: "corp-ai-v1.4.0-normal"
    });
    const passed = summary.errors.length === 0 && summary.replayOk;
    return {
      fixtureId: fixture.fixtureId,
      passed,
      message: passed ? "ok" : summary.errors.join(" | ")
    };
  });
}

function evaluateV143RndRepeatAccessFreshnessFixture(config: Partial<AiSimulationConfig>): V143ExploitRegressionResult {
  const fixtureId = "v143-rnd-repeat-access-freshness";
  let state = createGameAfterSetup({
    seed: "v143-exploit-rnd-freshness",
    runnerDeckId: config.runnerDeckId ?? SOAK_SEEDS_143.league.runnerDeckId,
    corpDeckId: config.corpDeckId ?? SOAK_SEEDS_143.league.corpDeckId,
    agendaPointsToWin: config.agendaPointsToWin ?? SOAK_SEEDS_143.league.agendaPointsToWin
  });
  const corpDraw = applyFixtureAction(state, "corp", (action) => action.type === "mandatory_draw", "corp_mandatory_draw");
  if (!corpDraw.ok) return { fixtureId, passed: false, message: corpDraw.message };
  state = corpDraw.state;
  const corpEndTurn = applyFixtureAction(state, "corp", (action) => action.type === "end_turn", "corp_end_turn");
  if (!corpEndTurn.ok) return { fixtureId, passed: false, message: corpEndTurn.message };
  state = corpEndTurn.state;
  if (state.pendingChoice?.source === "discard_phase" && state.pendingChoice.side === "corp") {
    const corpDiscard = applyFixtureChoiceFirstOption(state, "corp", "corp_discard_phase");
    if (!corpDiscard.ok) return { fixtureId, passed: false, message: corpDiscard.message };
    state = corpDiscard.state;
  }

  const baseInput = buildAiDecisionInput(state, "runner", {
    difficulty: "normal",
    profileId: "runner-ai-v1.4.2-normal",
    decisionId: `${fixtureId}:${state.stateVersion}:runner`
  });
  const rdRun = baseInput.legalActions.find((action) => action.type === "start_run" && action.payload?.serverId === "rd");
  const gainCredit = baseInput.legalActions.find((action) => action.type === "gain_credit");
  if (!rdRun || !gainCredit) {
    return {
      fixtureId,
      passed: false,
      message: "missing_required_actions:runner_needs_rd_run_and_gain_credit"
    };
  }

  const syntheticRdAccess: PublicGameEvent = {
    eventId: `${fixtureId}:synthetic_access`,
    type: "access_card",
    stateVersionBefore: baseInput.playerView.stateVersion,
    stateVersionAfter: baseInput.playerView.stateVersion + 1,
    stateHashAfter: "fnv1a:v143synthetic",
    visibilityClass: "hidden_info_barrier",
    publicPayload: {
      actor: "runner",
      actionType: "access_card",
      serverId: "rd",
      serverLabel: "R&D",
      redactedKind: "accessed_card"
    }
  };
  const staleInput: AiDecisionInput = {
    ...baseInput,
    legalActions: [rdRun, gainCredit],
    eventTail: [...baseInput.eventTail, syntheticRdAccess]
  };
  const decision = chooseRunnerAction(staleInput);
  const selected = staleInput.legalActions.find((action) => action.actionId === decision.actionId);
  const staleBelief = reconstructBeliefState(staleInput);
  const passed =
    selected?.type === "gain_credit" &&
    decision.reasonCode === "runner.plan.recover_economy" &&
    staleBelief.runnerOpponentModel?.rndTopFreshness.freshness === "stale_known_same_top";
  const selectedType = selected?.type ?? "none";
  return {
    fixtureId,
    passed,
    message: passed
      ? "ok:selected_gain_credit_on_stale_rnd_top"
      : `expected_gain_credit_on_stale_rnd_top:selected_${selectedType}:reason_${decision.reasonCode}`
  };
}

function applyFixtureAction(
  state: GameState,
  side: Side,
  predicate: (action: LegalAction) => boolean,
  label: string
): { ok: true; state: GameState } | { ok: false; message: string } {
  const legalAction = getLegalActions(state, side).find(predicate);
  if (!legalAction) {
    return { ok: false, message: `missing_legal_action:${label}` };
  }
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: legalAction.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `${label}:${state.stateVersion}:${legalAction.actionId}`
  });
  if (!result.ok) {
    return { ok: false, message: `${label}:${result.error.code}:${result.error.message}` };
  }
  return { ok: true, state: result.state };
}

function selectableChoiceOptions<T extends { selectable?: boolean }>(options: T[]): T[] {
  return options.filter((option) => option.selectable !== false);
}

function applyFixtureChoiceFirstOption(
  state: GameState,
  side: Side,
  label: string
): { ok: true; state: GameState } | { ok: false; message: string } {
  const pendingChoice = state.pendingChoice;
  if (!pendingChoice || pendingChoice.side !== side) return { ok: false, message: `missing_pending_choice:${label}` };
  const optionId = selectableChoiceOptions(pendingChoice.options)[0]?.id;
  if (optionId === undefined || optionId === null) return { ok: false, message: `missing_choice_option:${label}` };
  const choiceAction = getLegalActions(state, side).find((action) => action.type === "resolve_choice");
  if (!choiceAction) return { ok: false, message: `missing_resolve_choice_action:${label}` };
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: choiceAction.actionId,
    clientKnownStateVersion: state.stateVersion,
    selectedChoices: {
      choiceId: pendingChoice.choiceId,
      selectedOptionIds: [String(optionId)]
    },
    idempotencyKey: `${label}:${state.stateVersion}:${choiceAction.actionId}`
  });
  if (!result.ok) {
    return { ok: false, message: `${label}:${result.error.code}:${result.error.message}` };
  }
  return { ok: true, state: result.state };
}

function cardPoolVersionForSimulation(config: AiSimulationConfig): AiSimulationSummary["cardPoolVersion"] {
  if (
    config.runnerDeck?.id.includes("_099") ||
    config.runnerDeck?.id.includes("_v0_99") ||
    config.corpDeck?.id.includes("_099") ||
    config.corpDeck?.id.includes("_v0_99") ||
    config.runnerDeck?.cards.some((card) => card.id.startsWith("v099_")) ||
    config.corpDeck?.cards.some((card) => card.id.startsWith("v099_")) ||
    config.runnerDeckId === "demo_runner_099" ||
    config.corpDeckId === "demo_corp_099"
  ) {
    return "0.99.0";
  }
  if (
    config.runnerDeck?.id.includes("_098") ||
    config.runnerDeck?.id.includes("_v0_98") ||
    config.corpDeck?.id.includes("_098") ||
    config.corpDeck?.id.includes("_v0_98") ||
    config.runnerDeck?.identity.startsWith("v098_") ||
    config.corpDeck?.identity.startsWith("v098_") ||
    config.runnerDeck?.cards.some((card) => card.id.startsWith("v098_")) ||
    config.corpDeck?.cards.some((card) => card.id.startsWith("v098_")) ||
    config.runnerDeckId === "demo_runner_098" ||
    config.corpDeckId === "demo_corp_098"
  ) {
    return "0.98.0";
  }
  if (
    config.runnerDeck?.id.includes("_097") ||
    config.runnerDeck?.id.includes("_v0_97") ||
    config.corpDeck?.id.includes("_097") ||
    config.corpDeck?.id.includes("_v0_97") ||
    config.runnerDeck?.cards.some((card) => card.id.startsWith("v097_")) ||
    config.corpDeck?.cards.some((card) => card.id.startsWith("v097_")) ||
    config.runnerDeckId === "demo_runner_097" ||
    config.corpDeckId === "demo_corp_097"
  ) {
    return "0.97.0";
  }
  if (
    config.runnerDeck?.id.includes("_096") ||
    config.runnerDeck?.id.includes("_v0_96") ||
    config.corpDeck?.id.includes("_096") ||
    config.corpDeck?.id.includes("_v0_96") ||
    config.runnerDeck?.cards.some((card) => card.id.startsWith("v096_")) ||
    config.corpDeck?.cards.some((card) => card.id.startsWith("v096_")) ||
    config.runnerDeckId === "demo_runner_096" ||
    config.corpDeckId === "demo_corp_096"
  ) {
    return "0.96.0";
  }
  if (
    config.runnerDeck?.id.includes("_095") ||
    config.runnerDeck?.id.includes("_v0_95") ||
    config.corpDeck?.id.includes("_095") ||
    config.corpDeck?.id.includes("_v0_95") ||
    config.runnerDeck?.cards.some((card) => card.id.startsWith("v095_")) ||
    config.corpDeck?.cards.some((card) => card.id.startsWith("v095_"))
  ) {
    return "0.95.0";
  }
  if (
    config.runnerDeck?.id.includes("_094") ||
    config.runnerDeck?.id.includes("_v0_94") ||
    config.corpDeck?.id.includes("_094") ||
    config.corpDeck?.id.includes("_v0_94") ||
    config.runnerDeck?.cards.some((card) => card.id.startsWith("v094_")) ||
    config.corpDeck?.cards.some((card) => card.id.startsWith("v094_")) ||
    config.runnerDeck?.cards.some((card) => card.id.startsWith("onr_v1_")) ||
    config.corpDeck?.cards.some((card) => card.id.startsWith("onr_v1_"))
  ) {
    return "0.94.0";
  }
  if (
    config.runnerDeck?.id.includes("_008") ||
    config.runnerDeck?.id.includes("_v0_8") ||
    config.corpDeck?.id.includes("_008") ||
    config.corpDeck?.id.includes("_v0_8") ||
    config.runnerDeck?.cards.some((card) => card.id.startsWith("v08_")) ||
    config.corpDeck?.cards.some((card) => card.id.startsWith("v08_")) ||
    config.runnerDeckId === "demo_runner_008" ||
    config.corpDeckId === "demo_corp_008"
  ) {
    return "0.8.0";
  }
  if (config.runnerDeck || config.corpDeck || config.runnerDeckId === "demo_runner_004" || config.corpDeckId === "demo_corp_004") return "0.4.0";
  return "0.1.0";
}

function runV143Profile(profile: SimulationBenchmarkProfile, seeds: string[], config: V143LeagueConfig): V143SimulationRunResult {
  const runnerProfileId = profileIdForMode("runner", profile.runnerMode);
  const corpProfileId = profileIdForMode("corp", profile.corpMode);
  const summaries = seeds.map((seed) =>
    simulateAiGame({
      seed,
      runnerDeckId: config.runnerDeckId ?? SOAK_SEEDS_143.league.runnerDeckId,
      corpDeckId: config.corpDeckId ?? SOAK_SEEDS_143.league.corpDeckId,
      agendaPointsToWin: config.agendaPointsToWin ?? SOAK_SEEDS_143.league.agendaPointsToWin,
      maxActions: config.maxActions ?? SOAK_SEEDS_143.league.maxActions,
      runnerControllerMode: profile.runnerMode,
      corpControllerMode: profile.corpMode,
      ...(runnerProfileId ? { runnerProfileId } : {}),
      ...(corpProfileId ? { corpProfileId } : {}),
      simulationRngSeed: `${seed}:${profile.benchmarkProfileId}:simrng`
    })
  );
  const totalActions = summaries.reduce((sum, summary) => sum + summary.actions, 0) || 1;
  const timeoutActions = summaries.reduce((sum, summary) => sum + summary.actionSequence.filter((action) => action.timeoutUsed).length, 0);
  const fallbackActions = summaries.reduce((sum, summary) => sum + summary.actionSequence.filter((action) => action.fallbackUsed).length, 0);
  const winCounts = summaries.reduce((counts, summary) => {
    const key = summary.winner;
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {} as Record<AiSimulationSummary["winner"], number>);
  const exploitRefs =
    profile.benchmarkProfileId === "current_candidate" || profile.benchmarkProfileId === "belief_ai_v1_4_2"
      ? runV143ExploitRegressionFixtures(config)
          .filter((result) => !result.passed)
          .map((result) => result.fixtureId)
      : [];
  return {
    simulationId: `v143:${profile.benchmarkProfileId}:${fnv1a(seeds.join("|"))}`,
    benchmarkProfile: profile.benchmarkProfileId,
    games: summaries.length,
    illegalActions: summaries.reduce((sum, summary) => sum + summary.metrics.illegalActions, 0),
    timeouts: timeoutActions,
    fallbackRate: round(fallbackActions / totalActions),
    winRates: {
      runner: round((winCounts.runner ?? 0) / Math.max(summaries.length, 1)),
      corp: round((winCounts.corp ?? 0) / Math.max(summaries.length, 1)),
      draw: round((winCounts.draw ?? 0) / Math.max(summaries.length, 1)),
      action_limit_reached: round((winCounts.action_limit_reached ?? 0) / Math.max(summaries.length, 1))
    },
    agendaPoints: {
      runner: summaries.reduce((sum, summary) => sum + summary.finalAgendaPoints.runner, 0),
      corp: summaries.reduce((sum, summary) => sum + summary.finalAgendaPoints.corp, 0)
    },
    averageActions: round(totalActions / Math.max(summaries.length, 1)),
    replayFailures: summaries.filter((summary) => !summary.replayOk).length,
    notableExploitRefs: sortedUnique(exploitRefs),
    summaries
  };
}

function benchmarkProfileById(profileId: SimulationBenchmarkProfileId): SimulationBenchmarkProfile {
  const profile = BENCHMARK_PROFILES_143.profiles.find((candidate) => candidate.benchmarkProfileId === profileId);
  if (profile) return profile;
  return {
    benchmarkProfileId: profileId,
    runnerMode: profileId,
    corpMode: profileId
  };
}

function chooseDecisionForSimulation(side: Side, input: AiDecisionInput, config: AiSimulationConfig, simulationRng: SimulationRng): AiDecision {
  const mode = controllerModeForSide(side, config);
  switch (mode) {
    case "random_legal_bot":
      return chooseRandomLegalDecision(input, simulationRng);
    case "basic_runner_ai":
      return side === "runner" ? chooseRunnerBaselineAction(input) : chooseCorpBaselineAction(input);
    case "basic_corp_ai":
      return side === "corp" ? chooseCorpBaselineAction(input) : chooseRunnerBaselineAction(input);
    case "plan_corp_v1_4_0":
      return side === "corp" ? chooseCorpAction(input) : chooseRunnerBaselineAction(input);
    case "plan_runner_v1_4_1":
      return side === "runner" ? chooseRunnerAction(input) : chooseCorpBaselineAction(input);
    case "belief_ai_v1_4_2":
      return chooseAiAction(input);
    case "current_candidate":
      return chooseAiAction(input);
  }
}

function controllerModeForSide(side: Side, config: AiSimulationConfig): SimulationControllerMode {
  return side === "runner" ? config.runnerControllerMode ?? "current_candidate" : config.corpControllerMode ?? "current_candidate";
}

function deckSnapshotForSimulation(deck: DeckDefinition, publicMetadata?: DeckPublicMetadata): AiDeckDoctrineDeckSnapshot {
  return {
    deckSnapshotId: `${deck.id}:simulation`,
    side: deck.side,
    ...(publicMetadata?.formatProfileId ? { formatProfileId: publicMetadata.formatProfileId } : {}),
    ...(publicMetadata ? { publicMetadata } : {}),
    cards: deck.cards.map((card) => ({ cardId: card.id, quantity: card.quantity }))
  };
}

function chooseRandomLegalDecision(input: AiDecisionInput, simulationRng: SimulationRng): AiDecision {
  const legalActions = input.legalActions.slice().sort(compareAction);
  const fallback = legalActions[0];
  if (!fallback) {
    return {
      actionId: "",
      reasonCode: "simulation.random.no_legal_action",
      explanation: "Keine legale Aktion verfuegbar.",
      consideredActionIds: [],
      fallbackUsed: true,
      timeoutUsed: false,
      confidence: 0
    };
  }
  const index = simulationRng.nextInt(legalActions.length);
  const selected = legalActions[index] ?? fallback;
  const selectedChoices = selectedChoicesForDecision(input, selected);
  return {
    actionId: selected.actionId,
    ...(selectedChoices ? { selectedChoices } : {}),
    reasonCode: "simulation.random_legal_bot",
    explanation: "Deterministisch pseudozufaellige legale Aktion fuer Benchmark.",
    consideredActionIds: legalActions.map((action) => action.actionId),
    fallbackUsed: false,
    timeoutUsed: false,
    confidence: 0.35,
    evidence: [`mode:random_legal_bot`, `rng_counter:${simulationRng.counter}`]
  };
}

function profileIdForMode(side: Side, mode: SimulationControllerMode): string {
  switch (mode) {
    case "plan_corp_v1_4_0":
      return side === "corp" ? "corp-ai-v1.4.0-normal" : "runner-ai-v0.9-normal";
    case "plan_runner_v1_4_1":
      return side === "runner" ? "runner-ai-v1.4.1-normal" : "corp-ai-v0.9-normal";
    case "belief_ai_v1_4_2":
      return side === "runner" ? "runner-ai-v1.4.2-normal" : "corp-ai-v1.4.2-normal";
    case "basic_runner_ai":
      return side === "runner" ? "runner-ai-v0.9-normal" : "corp-ai-v0.9-normal";
    case "basic_corp_ai":
      return side === "corp" ? "corp-ai-v0.9-normal" : "runner-ai-v0.9-normal";
    case "random_legal_bot":
      return side === "runner" ? "runner-ai-v0.9-normal" : "corp-ai-v0.9-normal";
    case "current_candidate":
      return side === "runner" ? "runner-ai-v1.4.2-normal" : "corp-ai-v1.4.2-normal";
  }
}

function validateSimulationDeckSupport(config: AiSimulationConfig): string[] {
  const errors: string[] = [];
  for (const deck of [config.runnerDeck, config.corpDeck]) {
    if (!deck) continue;
    for (const entry of deck.cards) {
      const definition = DEMO_CARDS_BY_ID[entry.id];
      if (!definition) {
        errors.push(`Simulation blockiert: Karte ${entry.id} ist nicht im Runtime-Katalog.`);
        continue;
      }
      if (definition.implementationStatus !== "playable_mvp") {
        errors.push(`Simulation blockiert: Karte ${entry.id} ist nicht als playable_mvp freigegeben.`);
      }
    }
  }
  return sortedUnique(errors);
}

type SimulationRng = {
  readonly seed: string;
  counter: number;
  nextInt: (maxExclusive: number) => number;
};

function createSimulationRng(seed: string): SimulationRng {
  const rng: SimulationRng = {
    seed,
    counter: 0,
    nextInt: (maxExclusive: number): number => {
      if (maxExclusive <= 1) return 0;
      rng.counter += 1;
      const numeric = Number.parseInt(fnv1a(`${seed}:${rng.counter}`), 16);
      if (!Number.isFinite(numeric)) return 0;
      return Math.abs(numeric) % maxExclusive;
    }
  };
  return rng;
}

function decisionFromChoices(input: AiDecisionInput, choices: RankedChoice[]): AiDecision {
  const consideredActionIds = input.legalActions.map((action) => action.actionId).sort();
  const beliefSummary = beliefDebugSummary(reconstructBeliefState(input));
  const decisionDebug = {
    aiLevel: 1,
    memoryVersion: String(beliefSummary.memoryVersion ?? ""),
    facts: toStringArray(beliefSummary.facts),
    hypotheses: toStringArray(beliefSummary.hypotheses),
    uncertainty: toStringArray(beliefSummary.uncertainty),
    invalidations: toStringArray(beliefSummary.invalidations),
    ...(input.ownDeckDoctrine ? { ownDeckDoctrine: deckDoctrineDebug(input.ownDeckDoctrine) } : {}),
    ...(input.side === "runner" ? { opponentModel: toRecord(beliefSummary.runnerOpponentModel) } : { opponentModel: toRecord(beliefSummary.corpOpponentModel) })
  };
  const choice = choices
    .filter((candidate) => candidate.action && candidate.score > 200)
    .sort((left, right) => right.score - left.score || compareAction(left.action!, right.action!))[0];
  if (choice?.action) {
    const selectedChoices = selectedChoicesForDecision(input, choice.action);
    return {
      actionId: choice.action.actionId,
      ...(selectedChoices ? { selectedChoices } : {}),
      reasonCode: choice.reasonCode,
      explanation: choice.explanation,
      consideredActionIds,
      fallbackUsed: false,
      evidence: scrubEvidence(choice.evidence),
      decisionDebug,
      timeoutUsed: false,
      profileId: input.profileId,
      difficulty: input.difficulty,
      ...(choice.confidence !== undefined ? { confidence: choice.confidence } : {}),
      reason: choice.reasonCode
    };
  }
  const fallback = input.legalActions.slice().sort(compareAction)[0];
  if (!fallback) {
    return {
      actionId: "",
      reasonCode: "fallback.no_legal_action",
      explanation: "Es ist keine legale Aktion verfügbar.",
      consideredActionIds,
      fallbackUsed: true,
      evidence: ["no_legal_actions"],
      decisionDebug,
      timeoutUsed: false,
      profileId: input.profileId,
      difficulty: input.difficulty,
      confidence: 0,
      reason: "fallback.no_legal_action"
    };
  }
  const selectedChoices = selectedChoicesForDecision(input, fallback);
  return {
    actionId: fallback.actionId,
    ...(selectedChoices ? { selectedChoices } : {}),
    reasonCode: "fallback.first_legal_action",
    explanation: "Die erste stabile LegalAction wird als Fallback gewählt.",
    consideredActionIds,
    fallbackUsed: true,
    evidence: ["fallback_stable_legal_action"],
    decisionDebug,
    timeoutUsed: false,
    profileId: input.profileId,
    difficulty: input.difficulty,
    confidence: 0.2,
    reason: "fallback.first_legal_action"
  };
}

function playfulAiGainValue(option: {
  id: string;
  value?: string | number | boolean;
  label: string;
}): number {
  if (typeof option.value === "number") return option.value;
  const splitMatch = /^gain_(\d+)_set_aside_\d+$/.exec(option.id);
  if (splitMatch) return Number(splitMatch[1]);
  if (option.id === "take_credits") {
    const labelMatch = /^(\d+)\s+Credits? nehmen/.exec(option.label);
    return labelMatch ? Number(labelMatch[1]) : 0;
  }
  return 0;
}

function selectedChoicesForDecision(input: AiDecisionInput, action: LegalAction): AiDecision["selectedChoices"] | undefined {
  const choice = input.playerView.pendingChoice;
  if (action.type !== "resolve_choice" || !choice) return undefined;
  const selectableOptions = selectableChoiceOptions(choice.options);
  if (choice.source === "setup.mulligan") {
    const opening = input.side === "corp" ? evaluateCorpOpeningHand(input) : evaluateRunnerOpeningHand(input);
    const selected = choice.options.find((option) => option.id === opening.decision) ?? choice.options[0];
    return selected ? { choiceId: choice.choiceId, selectedOptionIds: [selected.id] } : { choiceId: choice.choiceId, selectedOptionIds: [] };
  }
  if (choice.kind === "select_cards" && choice.source === "discard_phase") {
    const count = Math.max(choice.minSelections, Math.min(choice.maxSelections, choice.maxSelections));
    const selected = choice.options
      .slice()
      .sort((left, right) => {
        const labelCompare = left.label.localeCompare(right.label, "de");
        return labelCompare !== 0 ? labelCompare : left.id.localeCompare(right.id);
      })
      .slice(0, count)
      .map((option) => option.id);
    return { choiceId: choice.choiceId, selectedOptionIds: selected };
  }
  if (choice.kind === "select_cards" && choice.source.startsWith("v1912.shell_traders_start_turn")) {
    const selected =
      choice.options
        .slice()
        .sort((left, right) => {
          const leftCounter = Number(/\((\d+)\)\s*$/.exec(left.label)?.[1] ?? Number.MAX_SAFE_INTEGER);
          const rightCounter = Number(/\((\d+)\)\s*$/.exec(right.label)?.[1] ?? Number.MAX_SAFE_INTEGER);
          const leftProgramBias = left.card?.type === "program" ? -1 : 0;
          const rightProgramBias = right.card?.type === "program" ? -1 : 0;
          return leftCounter - rightCounter || leftProgramBias - rightProgramBias || left.label.localeCompare(right.label, "de");
        })[0] ?? choice.options[0];
    return selected ? { choiceId: choice.choiceId, selectedOptionIds: [selected.id] } : { choiceId: choice.choiceId, selectedOptionIds: [] };
  }
  if (choice.kind === "select_cards") {
    const searchSelected = selectedSearchChoiceOptionIds(input, choice, selectableOptions);
    if (searchSelected) return { choiceId: choice.choiceId, selectedOptionIds: searchSelected };
    const count = Math.max(choice.minSelections, Math.min(choice.maxSelections, choice.maxSelections));
    const selected = selectableOptions.slice(0, count).map((option) => option.id);
    return { choiceId: choice.choiceId, selectedOptionIds: selected };
  }
  if (choice.source.startsWith("v1921.playful_ai")) {
    const selected =
      choice.options
        .slice()
        .sort((left, right) => {
          const leftValue = playfulAiGainValue(left);
          const rightValue = playfulAiGainValue(right);
          return rightValue - leftValue || left.id.localeCompare(right.id);
        })[0] ?? choice.options[0];
    return selected ? { choiceId: choice.choiceId, selectedOptionIds: [selected.id] } : { choiceId: choice.choiceId, selectedOptionIds: [] };
  }
  if (choice.source.startsWith("trace_post_bid_link")) {
    const selected =
      choice.options
        .filter((option) => option.id.startsWith("trace_link_"))
        .sort((left, right) => {
          const leftDelta = Number(/\+(\d+)\s+Link/.exec(left.label)?.[1] ?? 0);
          const rightDelta = Number(/\+(\d+)\s+Link/.exec(right.label)?.[1] ?? 0);
          return rightDelta - leftDelta || left.label.localeCompare(right.label, "de");
        })[0] ?? choice.options.find((option) => option.id === "pass") ?? choice.options[0];
    return selected ? { choiceId: choice.choiceId, selectedOptionIds: [selected.id] } : { choiceId: choice.choiceId, selectedOptionIds: [] };
  }
  if (choice.kind !== "bid_amount") {
    const firstOption = selectableOptions[0];
    return firstOption ? { choiceId: choice.choiceId, selectedOptionIds: [firstOption.id] } : { choiceId: choice.choiceId, selectedOptionIds: [] };
  }

  const bidOptions = choice.options
    .map((option) => ({ id: option.id, amount: typeof option.value === "number" ? option.value : Number.NaN }))
    .filter((option) => Number.isInteger(option.amount) && option.amount >= 0)
    .sort((left, right) => left.amount - right.amount);
  const maxBid = bidOptions.at(-1)?.amount ?? 0;
  let desired = 0;
  if (input.side === "corp") {
    desired = input.difficulty === "hard" ? Math.min(2, maxBid) : input.difficulty === "normal" ? Math.min(1, maxBid) : 0;
  } else {
    const traceContext = latestTraceContext(input);
    const tieBid = Math.max(0, (traceContext.traceStrength ?? 0) - (traceContext.runnerLink ?? 0));
    desired = input.difficulty === "easy" ? 0 : Math.min(maxBid, tieBid);
  }
  const selected = bidOptions.find((option) => option.amount === desired) ?? bidOptions[0];
  return selected ? { choiceId: choice.choiceId, selectedOptionIds: [selected.id] } : { choiceId: choice.choiceId, selectedOptionIds: [] };
}

function selectedSearchChoiceOptionIds(
  input: AiDecisionInput,
  choice: NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>,
  selectableOptions: NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>["options"]
): string[] | undefined {
  if (!isSearchChoice(choice)) return undefined;
  const count = boundedSelectionCount(choice.minSelections, choice.maxSelections, selectableOptions.length);
  if (count <= 0) return [];
  return selectableOptions
    .slice()
    .sort((left, right) => {
      const scoreDelta = scoreSearchChoiceOption(input, choice, right) - scoreSearchChoiceOption(input, choice, left);
      return scoreDelta || left.label.localeCompare(right.label, "de") || left.id.localeCompare(right.id);
    })
    .slice(0, count)
    .map((option) => option.id);
}

function isSearchChoice(choice: NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>): boolean {
  return Boolean(choice.stackSearchResolution || /search|stack/i.test(choice.source));
}

function boundedSelectionCount(minSelections: number, maxSelections: number, available: number): number {
  const requested = Math.max(minSelections, maxSelections);
  return Math.max(0, Math.min(requested, available));
}

function scoreSearchChoiceOption(input: AiDecisionInput, choice: NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>, option: NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>["options"][number]): number {
  const card = option.card;
  if (!card) return 0;
  const destination = choice.stackSearchResolution?.destination;
  const roles = rolesForCardId(card.definitionId);
  const subtypes = (card.subtypes ?? []).map((subtype) => subtype.toLowerCase());
  const features = extractAiFeatures(input);
  let score = 100;

  if (card.type === "program") score += destination === "install_program" ? 1000 : 520;
  else if (destination === "install_program") score -= 600;

  if (destination === "install_program") {
    const memoryCost = card.memoryCost ?? 0;
    score += memoryCost <= features.memoryRemaining ? 180 : -260 - (memoryCost - features.memoryRemaining) * 40;
    const installCost = card.installCost ?? card.cost ?? 0;
    score += installCost <= features.credits ? 110 : -160 - (installCost - features.credits) * 30;
  }

  const breakerRoles = roles.filter((role) => role.startsWith("breaker_"));
  if (breakerRoles.length > 0 || subtypes.some((subtype) => ["icebreaker", "breaker", "decoder", "fracter", "killer"].includes(subtype))) {
    score += 220;
    for (const role of breakerRoles) score += features.rigRoles.has(role) ? 40 : 180;
    if (features.rigRoles.size === 0) score += 120;
  }

  if (roles.includes("memory") || (card.memoryLimitBonus ?? 0) > 0) score += features.memoryRemaining <= 1 ? 170 : 60;
  if (roles.includes("economy")) score += features.credits < 4 ? 90 : 25;
  if (card.definitionId && features.rigDefinitionIds.has(card.definitionId)) score -= 90;
  score -= Math.max(0, card.memoryCost ?? 0) * 5;
  score -= Math.max(0, card.installCost ?? card.cost ?? 0) * 2;
  return score;
}

function latestTraceContext(input: AiDecisionInput): { traceStrength?: number; runnerLink?: number } {
  for (const event of input.eventTail.slice().reverse()) {
    const traceStrength = event.publicPayload.traceStrength;
    const runnerLink = event.publicPayload.runnerLink;
    if (typeof traceStrength === "number" || typeof runnerLink === "number") {
      return {
        ...(typeof traceStrength === "number" ? { traceStrength } : {}),
        ...(typeof runnerLink === "number" ? { runnerLink } : {})
      };
    }
  }
  return {};
}

function scoreActions(input: AiDecisionInput, side: Side): RankedChoice[] {
  const features = extractAiFeatures(input);
  return input.legalActions.map((action) => (side === "runner" ? scoreRunnerAction(input, features, action) : scoreCorpAction(input, features, action)));
}

function scoreRunnerAction(input: AiDecisionInput, features: AiFeatures, action: LegalAction): RankedChoice {
  const roles = rolesForAction(input, action);
  const profile = profileWeights(input);
  let score = 0;
  let reasonCode = "runner.fallback.low_value";
  let explanation = "Die Aktion bleibt legal, hat aber wenig sichtbaren Nutzen.";
  const evidence = [`difficulty:${input.difficulty}`, `credits:${features.credits}`, `clicks:${features.clicks}`];

  switch (action.type) {
    case "resolve_choice":
      if (input.playerView.pendingChoice?.source === "setup.mulligan") {
        const opening = evaluateRunnerOpeningHand(input);
        score = 920;
        reasonCode = opening.decision === "mulligan" ? "runner.setup.mulligan" : "runner.setup.keep";
        explanation = opening.decision === "mulligan" ? "Der Runner nimmt anhand von Start-Hand und Deckprofil einen Mulligan." : "Der Runner behält eine startfähige Hand anhand von Start-Hand und Deckprofil.";
        evidence.push("choice_legal", "choice_source:setup.mulligan", ...opening.reasons, ...opening.evidence);
      } else {
        const postBidTraceLink =
          input.playerView.pendingChoice?.source.startsWith(
            "trace_post_bid_link",
          ) === true;
        score = input.playerView.pendingChoice?.kind === "bid_amount" ? 900 : postBidTraceLink ? 880 : 620;
        reasonCode = input.playerView.pendingChoice?.kind === "bid_amount" ? "runner.trace.bid_visible_amount" : postBidTraceLink ? "runner.trace.post_bid_link" : "runner.choice.resolve";
        explanation = postBidTraceLink
          ? "Der Runner nutzt nach offen gelegten Trace-Bids eine legale Link-Faehigkeit."
          : "Der Runner beantwortet eine sichtbare legale Choice.";
        evidence.push("choice_legal", `choice_kind:${input.playerView.pendingChoice?.kind ?? "unknown"}`);
      }
      break;
    case "steal_agenda":
      score = 1000;
      reasonCode = "runner.access.steal_agenda";
      explanation = "Eine sichtbare Agenda kann legal gestohlen werden.";
      evidence.push("access_agenda_visible");
      break;
    case "access_card":
      score = 850;
      reasonCode = "runner.access.open_card";
      explanation = "Der Runner nutzt den erreichten Zugriff.";
      evidence.push("access_window");
      break;
    case "trash_accessed_card":
      score = 780;
      reasonCode = "runner.access.trash_value";
      explanation = "Eine zugreifbare Karte kann legal entfernt werden.";
      evidence.push("trash_legal");
      break;
    case "decline_trash":
      score = 650;
      reasonCode = "runner.access.decline_trash";
      explanation = "Der Runner lehnt das Trashen im Zugriff bewusst ab, wenn kein höherwertiger Trash-Plan greift.";
      evidence.push("decline_trash_legal");
      break;
    case "break_subroutine":
      score = 740;
      reasonCode = "runner.encounter.break_etr";
      explanation = "Eine sichtbare Subroutine kann legal gebrochen werden.";
      evidence.push("encounter_solution");
      break;
    case "pump_breaker":
      if (pumpCanLeadToBreak(input, action)) {
        score = 690;
        reasonCode = "runner.encounter.pump_breaker";
        explanation = "Ein installierter Breaker kann die Begegnung verbessern.";
        evidence.push("breaker_visible", "pump_can_enable_break");
      } else {
        score = 90;
        reasonCode = "runner.encounter.pump_without_matching_breaker";
        explanation = "Der sichtbare Breaker passt nicht zu diesem ICE; Pumpen verbessert die Begegnung nicht.";
        evidence.push("breaker_visible", "pump_cannot_break_encountered_ice");
      }
      break;
    case "continue_run":
      score = input.difficulty === "easy" ? 360 : 520;
      reasonCode = "runner.encounter.continue";
      explanation = "Der Run kann nach sichtbarer Bewertung fortgesetzt werden.";
      evidence.push("continue_legal");
      break;
    case "remove_tag":
      score = features.tags > 0 ? 760 + (profile.riskTolerance ?? 1) * 40 : 300;
      reasonCode = "runner.tag.clear_visible_tag";
      explanation = "Ein öffentlicher Tag wird entfernt, bevor er gefährlich wird.";
      evidence.push(`tags:${features.tags}`);
      break;
    case "install_card":
      score = scoreRunnerInstall(roles, features, profile);
      reasonCode = roles.some((role) => role.startsWith("breaker_")) ? "runner.setup.install_missing_breaker" : "runner.setup.install_support";
      explanation = "Die Runner-KI verbessert sichtbare Rig- oder Setup-Rollen.";
      evidence.push("own_card_role_known", ...publicRoleEvidence(roles));
      break;
    case "play_event":
      score = scoreRunnerEvent(roles, features, profile);
      reasonCode = roles.includes("run_pressure") ? "runner.run.event_pressure" : roles.includes("draw") ? "runner.economy.draw_setup" : "runner.economy.event";
      explanation = "Ein Event verbessert anhand sichtbarer Rollen die Runner-Position.";
      evidence.push("own_event_role_known", ...publicRoleEvidence(roles));
      break;
    case "trigger_ability":
      if (action.payload?.shellTradersAbility === "set_aside_from_grip") {
        const counterAmount = typeof action.payload.shellCounterAmount === "number" ? action.payload.shellCounterAmount : 0;
        score = 620 + Math.max(0, counterAmount) * 30;
        reasonCode = "runner.shell_traders.prepare_install";
        explanation = "The Shell Traders bereitet ein eigenes Programm oder eine Hardwarekarte für die verzögerte kostenlose Installation vor.";
        evidence.push("shell_traders", `shell_counters:${counterAmount}`);
      } else if (action.payload?.shellTradersAbility === "remove_shell_counter") {
        const remaining = typeof action.payload.remainingCounters === "number" ? action.payload.remainingCounters : 1;
        score = remaining <= 1 ? 650 : 360;
        reasonCode = "runner.shell_traders.remove_counter";
        explanation = "Ein Shell-Counter kann legal entfernt werden, um die vorbereitete Installation zu beschleunigen.";
        evidence.push("shell_counter_remove", `credits:${features.credits}`);
      } else {
        score = 260;
        reasonCode = "runner.card_ability.visible";
        explanation = "Eine sichtbare Kartenfähigkeit ist legal verfügbar.";
        evidence.push("trigger_ability");
      }
      break;
    case "start_run":
      const staleCentralRepeatPenalty = staleKnownRndRepeatRunPenalty(input, action) + staleKnownHqRepeatRunPenalty(input, action) + staleKnownArchivesRepeatRunPenalty(input, action);
      score = scoreRunTarget(action, features, profile, input.difficulty, staleCentralRepeatPenalty);
      reasonCode = runnerRunReasonCode(action, features);
      explanation =
        reasonCode === "runner.run.blocked_by_rezzed_ice"
          ? "Ein bereits gerezztes ICE stoppt diesen Server sichtbar; Setup oder Wirtschaft ist gerade wertvoller."
          : reasonCode === "runner.run.empty_remote_low_value"
            ? "Der Außenserver hat kein sichtbares Root-Ziel; ein Run ist derzeit wenig wertvoll."
          : "Der Serverdruck ist anhand sichtbarer Lage vertretbar.";
      evidence.push(
        `server:${String(action.payload?.serverId ?? "unknown")}`,
        `known_pressure:${features.knownServerPressure}`,
        ...runTargetEvidence(action, features),
        ...(staleCentralRepeatPenalty > 0 ? [`known_stale_central_repeat_penalty:${staleCentralRepeatPenalty}`] : [])
      );
      break;
    case "gain_credit":
      score = input.difficulty === "easy" ? 560 : features.credits < 4 ? 540 : 380;
      reasonCode = "runner.economy.basic_credit";
      explanation = "Credits verbessern die sichtbare Handlungsfähigkeit.";
      evidence.push("basic_economy");
      break;
    case "draw_card":
      score = features.handCount < 3 ? 430 : 320;
      reasonCode = "runner.economy.draw_card";
      explanation = "Eine Karte zu ziehen verbessert das sichtbare Setup.";
      evidence.push(`hand_count:${features.handCount}`);
      break;
    case "end_turn":
      score = 120 + (features.clicks <= 0 ? 500 : 0);
      reasonCode = "runner.end_turn";
      explanation = "Der Zug wird ohne bessere sichtbare Option beendet.";
      evidence.push("low_visible_value");
      break;
    default:
      score = 150;
  }

  return { action, score: roundScore(score), reasonCode, explanation, confidence: confidence(score), evidence };
}

function scoreCorpAction(input: AiDecisionInput, features: AiFeatures, action: LegalAction): RankedChoice {
  const roles = rolesForAction(input, action);
  const profile = profileWeights(input);
  let score = 0;
  let reasonCode = "corp.fallback.low_value";
  let explanation = "Die Aktion bleibt legal, hat aber wenig sichtbaren Nutzen.";
  const evidence = [`difficulty:${input.difficulty}`, `credits:${features.credits}`, `clicks:${features.clicks}`];

  switch (action.type) {
    case "resolve_choice":
      if (input.playerView.pendingChoice?.source === "setup.mulligan") {
        const opening = evaluateCorpOpeningHand(input);
        score = 920;
        reasonCode = opening.decision === "mulligan" ? "corp.setup.mulligan" : "corp.setup.keep";
        explanation = opening.decision === "mulligan" ? "Die Corp nimmt anhand von Start-Hand und Deckprofil einen Mulligan." : "Die Corp behält eine startfähige Hand anhand von Start-Hand und Deckprofil.";
        evidence.push("choice_legal", "choice_source:setup.mulligan", ...opening.reasons, ...opening.evidence);
      } else {
        score = input.playerView.pendingChoice?.kind === "bid_amount" ? 900 : 620;
        reasonCode = input.playerView.pendingChoice?.kind === "bid_amount" ? "corp.trace.bid_visible_amount" : "corp.choice.resolve";
        explanation = "Die Corp beantwortet eine sichtbare legale Choice.";
        evidence.push("choice_legal", `choice_kind:${input.playerView.pendingChoice?.kind ?? "unknown"}`);
      }
      break;
    case "mandatory_draw":
      score = 1000;
      reasonCode = "corp.mandatory_draw";
      explanation = "Die Corp zieht ihre Pflichtkarte.";
      evidence.push("mandatory_window");
      break;
    case "score_agenda":
      score = 960;
      reasonCode = "corp.score_available_agenda";
      explanation = "Eine scorebare Agenda ist legal und sichtbar für die Corp.";
      evidence.push("score_window");
      break;
    case "rez_ice":
      score = 820 + (profile.rez ?? 1) * 30;
      reasonCode = "corp.rez.defensive_card";
      explanation = "Eine defensive Karte kann im Run-Fenster legal gerezzt werden.";
      evidence.push("run_window", `runner_credits:${features.opponentCredits}`);
      break;
    case "decline_rez":
      score = 180;
      reasonCode = "corp.rez.decline";
      explanation = "Rez wird abgelehnt, wenn sichtbarer Nutzen niedrig bleibt.";
      evidence.push("rez_decline_legal");
      break;
    case "advance_card":
      score = 720 + (profile.score ?? 1) * 30;
      reasonCode = "corp.remote.advance_score_plan";
      explanation = "Eine Installation im Außenserver kann ausgebaut werden.";
      evidence.push("advance_legal");
      break;
    case "install_card":
      if (action.payload?.placement === "ice") {
        score = scoreCorpIceInstall(action, features, profile);
        reasonCode = "corp.ice.install_defense";
        explanation = "Eine ICE-Installation schützt einen sichtbaren Außenserver-Plan.";
        evidence.push(`server:${String(action.payload?.serverId ?? "unknown")}`);
      } else {
        score = scoreCorpRootInstall(roles, action, features, profile);
        reasonCode = roles.some((role) => role.startsWith("agenda_")) ? "corp.remote.install_score_plan" : "corp.remote.install_asset_plan";
        explanation = "Die Corp baut eine Installation im Außenserver aus eigener Information auf.";
        evidence.push("own_card_role_known", ...publicRoleEvidence(roles));
      }
      break;
    case "play_operation":
      score = scoreCorpOperation(roles, features, profile);
      reasonCode = roles.includes("tag_punishment") ? "corp.tag.punish_visible_tag" : roles.includes("draw_operation") ? "corp.economy.draw_operation" : "corp.economy.operation";
      explanation = "Eine legale Operation verbessert anhand eigener sichtbarer Rollen die Corp-Position.";
      evidence.push("own_operation_role_known", ...publicRoleEvidence(roles), `runner_tags:${features.opponentTags}`);
      break;
    case "trash_resource":
      score = features.opponentTags > 0 ? 760 + (profile.remote ?? 1) * 20 : 140;
      reasonCode = "corp.tag.trash_visible_resource";
      explanation = "Die Corp nutzt einen sichtbaren Tag, um eine öffentliche Resource zu trashen.";
      evidence.push("resource_trash_legal", `runner_tags:${features.opponentTags}`);
      break;
    case "purge_virus_counters":
      score = 780;
      reasonCode = "corp.purge.visible_virus_counters";
      explanation = "Die Corp nutzt die legale Purge-Aktion gegen sichtbare Virus-Counter.";
      evidence.push("purge_legal");
      break;
    case "gain_credit":
      score = features.credits < 5 ? 500 : 350;
      reasonCode = "corp.economy.basic_credit";
      explanation = "Credits verbessern Rez- und Score-Fenster.";
      evidence.push("basic_economy");
      break;
    case "draw_card":
      score = features.handCount < 4 ? 460 : 320;
      reasonCode = "corp.economy.draw_card";
      explanation = "Eine Karte zu ziehen verbessert die sichtbare Corp-Auswahl.";
      evidence.push(`hand_count:${features.handCount}`);
      break;
    case "end_turn":
      score = 120 + (features.clicks <= 0 ? 500 : 0);
      reasonCode = "corp.end_turn";
      explanation = "Die Corp beendet den Zug ohne bessere sichtbare Option.";
      evidence.push("low_visible_value");
      break;
    default:
      score = 150;
  }

  return { action, score: roundScore(score), reasonCode, explanation, confidence: confidence(score), evidence };
}

function extractAiFeatures(input: AiDecisionInput): AiFeatures {
  const ownCards = [...input.playerView.own.gripOrHq, ...input.playerView.own.heapOrArchives, ...input.playerView.own.scoreArea, ...(input.playerView.own.rig ?? [])];
  const rigRoles = new Set((input.playerView.own.rig ?? []).flatMap((card) => rolesForCardId(card.definitionId)));
  const rigDefinitionIds = new Set((input.playerView.own.rig ?? []).map((card) => card.definitionId).filter((id): id is string => Boolean(id)));
  const handRoles = new Set(input.playerView.own.gripOrHq.flatMap((card) => rolesForCardId(card.definitionId)));
  const eventCounts = buildObservedFacts(input).eventCounts;
  const serverFeaturesById = buildServerFeatures(input);
  const knownServerPressure = input.playerView.servers.reduce((sum, server) => sum + server.ice.filter((card) => card.known || card.rezzed).length + server.root.filter((card) => card.known).length, 0);
  const blockedRunServers = new Set(
    input.playerView.servers
      .filter((server) => isBlockedByKnownRezzedIce(server.ice.at(-1), rigDefinitionIds))
      .map((server) => server.id)
  );
  return {
    side: input.side,
    credits: input.playerView.own.credits,
    clicks: input.playerView.own.clicks,
    tags: input.playerView.own.tags,
    opponentCredits: input.playerView.opponent.credits,
    opponentTags: input.playerView.opponent.tags,
    memoryRemaining: (input.playerView.own.memoryLimit ?? 0) - (input.playerView.own.memoryUsed ?? 0),
    handCount: input.playerView.own.gripOrHq.length,
    rigRoles,
    rigDefinitionIds,
    handRoles: new Set([...handRoles, ...ownCards.flatMap((card) => rolesForCardId(card.definitionId)).filter((role) => role === "tag_punishment")]),
    eventCounts,
    knownServerPressure,
    blockedRunServers,
    serverFeaturesById
  };
}

function buildServerFeatures(input: AiDecisionInput): Map<string, ServerFeatures> {
  return new Map(
    input.playerView.servers.map((server) => [
      server.id,
      {
        iceCount: server.ice.length,
        rootCount: server.root.length,
        knownRootCount: server.root.filter((card) => card.known).length,
        unrezzedRootCount: server.root.filter((card) => card.rezzed !== true).length,
        rezzedRootCount: server.root.filter((card) => card.rezzed === true).length
      }
    ])
  );
}

export function buildObservedFacts(input: AiDecisionInput): AiObservedFacts {
  const eventCounts: Record<string, number> = {};
  for (const event of input.eventTail) eventCounts[event.type] = (eventCounts[event.type] ?? 0) + 1;
  return {
    eventCounts,
    publicServers: input.playerView.servers.map((server) => server.id).sort(),
    tags: input.playerView.own.tags,
    agendaPoints: { own: input.playerView.own.agendaPoints, opponent: input.playerView.opponent.agendaPoints }
  };
}

function rolesForAction(input: AiDecisionInput, action: LegalAction): string[] {
  if (action.source === "basic_action" || action.source === "game_rule") return [];
  const visible = findVisibleCard(input, action.source);
  return rolesForCardId(visible?.definitionId);
}

function findVisibleCard(input: AiDecisionInput, instanceId: string) {
  const zones = [
    input.playerView.own.gripOrHq,
    input.playerView.own.heapOrArchives,
    input.playerView.own.scoreArea,
    input.playerView.own.rig ?? [],
    ...input.playerView.servers.flatMap((server) => [server.ice, server.root])
  ];
  return zones.flat().find((card) => card.instanceId === instanceId && card.known);
}

function rolesForCardId(cardId: string | undefined): string[] {
  if (!cardId) return [];
  return CARD_ROLES_BY_CARD.get(cardId)?.roles ?? [];
}

function profileWeights(input: AiDecisionInput): Record<string, number> {
  const profile = AI_PROFILES.find((candidate) => candidate.profileId === input.profileId) ?? AI_PROFILES.find((candidate) => candidate.side === input.side && candidate.difficulty === input.difficulty);
  return profile?.weights ?? {};
}

function scoreRunnerInstall(roles: string[], features: AiFeatures, profile: Record<string, number>): number {
  let score = 430 + (profile.setup ?? 1) * 40;
  if (roles.some((role) => role.startsWith("breaker_") && !features.rigRoles.has(role))) score += 190;
  if (roles.includes("memory") && features.memoryRemaining <= 1) score += 160;
  if (features.credits < 2) score -= 90;
  return score;
}

function scoreRunnerEvent(roles: string[], features: AiFeatures, profile: Record<string, number>): number {
  let score = 420;
  if (roles.includes("economy")) score += features.credits < 5 ? 170 * (profile.economy ?? 1) : 70;
  if (roles.includes("draw")) score += features.handCount < 4 ? 150 : 60;
  if (roles.includes("run_pressure")) score += features.credits >= 3 ? 150 * (profile.run ?? 1) : 30;
  return score;
}

function scoreRunTarget(action: LegalAction, features: AiFeatures, profile: Record<string, number>, difficulty: AiDifficulty, staleCentralRepeatPenalty = 0): number {
  const serverId = String(action.payload?.serverId ?? "");
  const server = features.serverFeaturesById.get(serverId);
  let score = difficulty === "easy" ? 330 : 560 + (profile.run ?? 1) * 55;
  if (serverId.startsWith("remote_")) {
    score += 60;
    if ((server?.rootCount ?? 0) === 0) score -= 380;
    else score += Math.min(server?.rootCount ?? 0, 3) * 45;
  }
  if (serverId === "rd") score += 45;
  if (server?.iceCount) score -= Math.min(server.iceCount, 3) * 25;
  if (features.blockedRunServers.has(serverId)) score -= 430;
  if (features.credits < 3) score -= 140;
  if (features.rigRoles.size === 0 && difficulty !== "hard") score -= 60;
  score -= staleCentralRepeatPenalty;
  return score;
}

function staleKnownRndRepeatRunPenalty(input: AiDecisionInput, action: LegalAction): number {
  if (input.side !== "runner" || action.type !== "start_run" || action.payload?.serverId !== "rd") return 0;
  const freshness = reconstructBeliefState(input).runnerOpponentModel?.rndTopFreshness;
  // Public-event belief marks this only after Runner already accessed R&D and no visible draw, shuffle, reorder, swap, steal, or trash changed the top card.
  return freshness?.freshness === "stale_known_same_top" ? 420 : 0;
}

function staleKnownHqRepeatRunPenalty(input: AiDecisionInput, action: LegalAction): number {
  if (input.side !== "runner" || action.type !== "start_run" || action.payload?.serverId !== "hq") return 0;
  if (input.legalActions.some((candidate) => candidate.type === "trash_accessed_card" || candidate.type === "steal_agenda")) return 0;
  const hqHandMemory = reconstructBeliefState(input).runnerOpponentModel?.hqHandMemory;
  if (!hqHandMemory?.allCardsKnown || hqHandMemory.knownDefinitions.length === 0) return 0;
  return hqHandMemory.knownDefinitions.every((definitionId) => isLowValueKnownAccessCard(definitionId, input.playerView.own.credits)) ? 430 : 0;
}

function staleKnownArchivesRepeatRunPenalty(input: AiDecisionInput, action: LegalAction): number {
  if (input.side !== "runner" || action.type !== "start_run" || action.payload?.serverId !== "archives") return 0;
  if (input.legalActions.some((candidate) => candidate.type === "trash_accessed_card" || candidate.type === "steal_agenda")) return 0;
  const archives = input.playerView.servers.find((server) => server.id === "archives");
  const visibleArchivesCards = archives?.root ?? [];
  if (visibleArchivesCards.length === 0 || visibleArchivesCards.some((card) => !card.known || !card.definitionId)) return 0;
  const history = mergedAiPublicHistory(input);
  const lastArchivesAccessIndex = findLastAiHistoryIndex(history, (event) => isAiArchivesAccessEvent(event));
  if (lastArchivesAccessIndex < 0) return 0;
  if (history.slice(lastArchivesAccessIndex + 1).some((event) => aiEventMayChangeArchives(event))) return 0;
  return 520;
}

function isLowValueKnownAccessCard(definitionId: string, runnerCredits: number): boolean {
  const runtimeDefinition = RUNTIME_CARDS[definitionId];
  const demoDefinition = DEMO_CARDS_BY_ID[definitionId];
  const type = runtimeDefinition?.type ?? demoDefinition?.type;
  if (!type) return false;
  if (type === "agenda") return false;
  const trashCost = runtimeDefinition?.numeric.trashCost ?? demoDefinition?.trashCost ?? 0;
  if ((type === "asset" || type === "upgrade") && runnerCredits >= trashCost) return false;
  return true;
}

function mergedAiPublicHistory(input: AiDecisionInput): PublicGameEvent[] {
  const byId = new Map<string, PublicGameEvent>();
  for (const event of [...input.playerView.publicEvents, ...input.eventTail]) {
    byId.set(event.eventId, event);
  }
  return [...byId.values()].sort((left, right) => aiEventVersion(left) - aiEventVersion(right));
}

function findLastAiHistoryIndex<T>(values: T[], predicate: (value: T) => boolean): number {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (predicate(values[index]!)) return index;
  }
  return -1;
}

function isAiArchivesAccessEvent(event: PublicGameEvent): boolean {
  return event.publicPayload.actionType === "access_card" && aiServerIdFromEvent(event) === "archives";
}

function aiEventMayChangeArchives(event: PublicGameEvent): boolean {
  const payload = event.publicPayload;
  if (payload.discardZone === "archives" || payload.hiddenZoneAction === "discard_phase") return true;
  const actionType = typeof payload.actionType === "string" ? payload.actionType : event.type;
  return actionType === "trash_accessed_card" || actionType === "trash_card" || actionType === "play_operation";
}

function aiServerIdFromEvent(event: PublicGameEvent): string | undefined {
  const payload = event.publicPayload;
  if (typeof payload.serverId === "string") return payload.serverId;
  if (typeof payload.server === "string") return payload.server;
  const label = typeof payload.serverLabel === "string" ? payload.serverLabel : typeof payload.serverName === "string" ? payload.serverName : undefined;
  if (!label) return undefined;
  const normalized = label.toLowerCase();
  if (normalized === "r&d" || normalized === "rd") return "rd";
  if (normalized === "hq" || normalized === "headquarters") return "hq";
  if (normalized === "archives" || normalized === "archive") return "archives";
  return undefined;
}

function aiEventVersion(event: PublicGameEvent): number {
  return typeof event.stateVersionAfter === "number" ? event.stateVersionAfter : 0;
}

function runnerRunReasonCode(action: LegalAction, features: AiFeatures): string {
  const serverId = String(action.payload?.serverId ?? "");
  const server = features.serverFeaturesById.get(serverId);
  if (features.blockedRunServers.has(serverId)) return "runner.run.blocked_by_rezzed_ice";
  if (serverId.startsWith("remote_") && (server?.rootCount ?? 0) === 0) return "runner.run.empty_remote_low_value";
  return "runner.run.visible_pressure";
}

function runTargetEvidence(action: LegalAction, features: AiFeatures): string[] {
  const serverId = String(action.payload?.serverId ?? "");
  const server = features.serverFeaturesById.get(serverId);
  if (!server) return [];
  return [`ice_count:${server.iceCount}`, `root_count:${server.rootCount}`, `known_root_count:${server.knownRootCount}`, `rezzed_root_count:${server.rezzedRootCount}`];
}

function isBlockedByKnownRezzedIce(ice: { definitionId?: string; rezzed?: boolean; known: boolean; subtypes?: string[] } | undefined, rigDefinitionIds: Set<string>): boolean {
  if (!ice?.definitionId || !ice.known || ice.rezzed !== true) return false;
  const iceDefinitionId = ice.definitionId;
  if (!iceHasEndTheRun(iceDefinitionId)) return false;
  return ![...rigDefinitionIds].some((breakerDefinitionId) => canBreakerDefinitionBreakIce(breakerDefinitionId, iceDefinitionId));
}

function pumpCanLeadToBreak(input: AiDecisionInput, action: LegalAction): boolean {
  const breaker = findVisibleCard(input, action.source);
  const encounteredIce = input.playerView.run?.encounteredIce;
  if (!breaker?.definitionId || !encounteredIce?.definitionId) return true;
  if (!canBreakerDefinitionBreakIce(breaker.definitionId, encounteredIce.definitionId)) return false;

  const breakerId = breakerIdForEncounterAction(action);
  const targetIceId = typeof action.payload?.iceId === "string" ? action.payload.iceId : undefined;
  const directBreakIsLegal = input.legalActions.some(
    (candidate) =>
      candidate.type === "break_subroutine" &&
      breakerIdForEncounterAction(candidate) === breakerId &&
      (!targetIceId || candidate.payload?.iceId === targetIceId),
  );
  if (directBreakIsLegal) return false;

  const encounterContinue = input.legalActions.find(
    (candidate) => candidate.type === "continue_run" && candidate.payload?.encounterContinue === true,
  );
  if (encounterContinue?.payload?.unbrokenSubroutineCount === 0) return false;
  if (
    typeof breaker.strength === "number" &&
    typeof encounteredIce.strength === "number" &&
    breaker.strength >= encounteredIce.strength
  )
    return false;

  return true;
}

function breakerIdForEncounterAction(action: LegalAction): string | undefined {
  if (typeof action.payload?.breakerId === "string") return action.payload.breakerId;
  return action.source === "basic_action" || action.source === "game_rule" ? undefined : action.source;
}

function scoreCorpRootInstall(roles: string[], action: LegalAction, features: AiFeatures, profile: Record<string, number>): number {
  let score = 500 + (profile.remote ?? 1) * 45;
  if (roles.some((role) => role.startsWith("agenda_"))) score += 110 + (profile.score ?? 1) * 35;
  if (roles.includes("economy_asset")) score += features.credits < 5 ? 90 : 30;
  if (action.payload?.serverId === "new_remote") score += 35;
  return score;
}

function scoreCorpIceInstall(action: LegalAction, features: AiFeatures, profile: Record<string, number>): number {
  let score = 470 + (profile.remote ?? 1) * 30;
  if (action.payload?.serverId === "rd") score += 65;
  if (String(action.payload?.serverId ?? "").startsWith("remote_")) score += 55;
  if (features.credits < 3) score -= 80;
  return score;
}

function scoreCorpOperation(roles: string[], features: AiFeatures, profile: Record<string, number>): number {
  if (roles.includes("tag_punishment")) return features.opponentTags > 0 ? 790 : 120;
  let score = 480;
  if (roles.includes("economy_operation")) score += features.credits < 6 ? 160 * (profile.economy ?? 1) : 70;
  if (roles.includes("draw_operation")) score += features.handCount < 4 ? 120 : 50;
  return score;
}

function publicRoleEvidence(roles: string[]): string[] {
  return roles.slice(0, 2).map((role) => `role:${role}`);
}

function scrubEvidence(evidence: string[]): string[] {
  return evidence.filter((entry) => !FORBIDDEN_AI_INPUT_FIELDS.some((needle) => entry.includes(needle)) && !entry.includes("_1"));
}

const MATCH_PROGRESSION_METRIC_KEYS: Array<keyof AiMatchProgressionMetrics> = [
  "games",
  "actionLimitRate",
  "averageActions",
  "runnerAgendaPoints",
  "corpAgendaPoints",
  "runnerSteals",
  "corpScores",
  "centralPressureRuns",
  "hqPressureRuns",
  "rdPressureRuns",
  "archivesPressureRuns",
  "remotePressureRuns",
  "pressureTargetSwitches",
  "distinctPressureTargets",
  "remoteRootInstalls",
  "remoteIceInstalls",
  "remoteAdvances",
  "scoreWindows",
  "illegalActions",
  "replayFailures",
  "fallbackRate",
  "timeoutRate"
];

function summarizeMatchProgressionMetrics(summaries: AiSimulationSummary[]): AiMatchProgressionMetrics {
  const games = summaries.length;
  const actionSequence = summaries.flatMap((summary) => summary.actionSequence);
  const runnerRuns = actionSequence.filter((entry) => entry.side === "runner" && entry.actionType === "start_run");
  const pressureTargets = runnerRuns.map((entry) => entry.targetServerId ?? "unknown");
  const totalActions = actionSequence.length || 1;
  const pressureTargetSwitches = pressureTargets.reduce((switches, target, index) => {
    if (index === 0) return switches;
    return target !== pressureTargets[index - 1] ? switches + 1 : switches;
  }, 0);
  return {
    games,
    actionLimitRate: round(summaries.filter((summary) => summary.winner === "action_limit_reached").length / Math.max(games, 1)),
    averageActions: round(summaries.reduce((sum, summary) => sum + summary.actions, 0) / Math.max(games, 1)),
    runnerAgendaPoints: summaries.reduce((sum, summary) => sum + summary.finalAgendaPoints.runner, 0),
    corpAgendaPoints: summaries.reduce((sum, summary) => sum + summary.finalAgendaPoints.corp, 0),
    runnerSteals: actionSequence.filter((entry) => entry.side === "runner" && entry.actionType === "steal_agenda").length,
    corpScores: actionSequence.filter((entry) => entry.side === "corp" && entry.actionType === "score_agenda").length,
    centralPressureRuns: runnerRuns.filter((entry) => entry.targetServerId === "hq" || entry.targetServerId === "rd" || entry.targetServerId === "archives").length,
    hqPressureRuns: runnerRuns.filter((entry) => entry.targetServerId === "hq").length,
    rdPressureRuns: runnerRuns.filter((entry) => entry.targetServerId === "rd").length,
    archivesPressureRuns: runnerRuns.filter((entry) => entry.targetServerId === "archives").length,
    remotePressureRuns: runnerRuns.filter((entry) => isRemoteServerTarget(entry.targetServerId)).length,
    pressureTargetSwitches,
    distinctPressureTargets: new Set(pressureTargets).size,
    remoteRootInstalls: actionSequence.filter((entry) => entry.side === "corp" && entry.actionType === "install_card" && isRemoteServerTarget(entry.targetServerId) && entry.installPlacement !== "ice").length,
    remoteIceInstalls: actionSequence.filter((entry) => entry.side === "corp" && entry.actionType === "install_card" && isRemoteServerTarget(entry.targetServerId) && entry.installPlacement === "ice").length,
    remoteAdvances: actionSequence.filter((entry) => entry.side === "corp" && entry.actionType === "advance_card" && isRemoteServerTarget(entry.targetServerId)).length,
    scoreWindows: actionSequence.filter((entry) => entry.side === "corp" && entry.actionType === "score_agenda").length,
    illegalActions: summaries.reduce((sum, summary) => sum + summary.metrics.illegalActions, 0),
    replayFailures: summaries.filter((summary) => !summary.replayOk).length,
    fallbackRate: round(actionSequence.filter((entry) => entry.fallbackUsed).length / totalActions),
    timeoutRate: round(actionSequence.filter((entry) => entry.timeoutUsed).length / totalActions)
  };
}

function diffMatchProgressionMetrics(candidate: AiMatchProgressionMetrics, baseline: AiMatchProgressionMetrics): AiMatchProgressionMetrics {
  return MATCH_PROGRESSION_METRIC_KEYS.reduce((delta, key) => {
    delta[key] = round(candidate[key] - baseline[key]);
    return delta;
  }, {} as AiMatchProgressionMetrics);
}

function isRemoteServerTarget(serverId: string | undefined): boolean {
  return serverId === "new_remote" || serverId?.startsWith("remote_") === true;
}

function metricsFor(actionSequence: AiSimulationSummary["actionSequence"], errors: string[], replayOk: boolean, holdout: boolean): AiQualityMetrics {
  const actions = actionSequence.length || 1;
  const reasonCodeCoverage = sortedUnique(actionSequence.map((entry) => entry.reasonCode.split(".").slice(0, 2).join(".")));
  const doctrine = summarizeDoctrineQualityMetrics(actionSequence);
  return {
    illegalActions: errors.length,
    fallbackRate: round(actionSequence.filter((entry) => entry.fallbackUsed).length / actions),
    timeoutRate: round(actionSequence.filter((entry) => entry.timeoutUsed).length / actions),
    reasonCodeCoverage,
    actionTypeCoverage: sortedUnique(actionSequence.map((entry) => entry.actionType)),
    roleCoverage: sortedUnique(actionSequence.flatMap((entry) => entry.evidence.filter((item) => item.startsWith("role:")).map((item) => item.slice("role:".length)))),
    progressScore: round(actionSequence.length + (replayOk ? 10 : 0) - errors.length * 10),
    holdout,
    doctrine
  };
}

function qualityTagsForAction(input: AiDecisionInput, action: LegalAction, decision: AiDecision): string[] {
  const tags: string[] = [];
  const features = extractAiFeatures(input);
  const sourceCard = action.source === "basic_action" || action.source === "game_rule" ? undefined : findVisibleCard(input, action.source);
  const sourceDefinition = sourceCard?.definitionId ? DEMO_CARDS_BY_ID[sourceCard.definitionId] : undefined;
  const targetServerId = typeof action.payload?.serverId === "string" ? action.payload.serverId : undefined;
  const targetServer = targetServerId ? features.serverFeaturesById.get(targetServerId) : undefined;
  const agendaInHand = input.playerView.own.gripOrHq.filter((card) => card.definitionId && DEMO_CARDS_BY_ID[card.definitionId]?.type === "agenda").length;
  const legalScoreAvailable = input.side === "corp" && input.legalActions.some((candidate) => candidate.type === "score_agenda");
  const legalTrashAvailable = input.side === "runner" && input.legalActions.some((candidate) => candidate.type === "trash_accessed_card");
  const lowCredits = input.playerView.own.credits <= 1;
  const economyAction =
    action.type === "gain_credit" ||
    ((action.type === "play_event" || action.type === "play_operation") && rolesForAction(input, action).some((role) => role.includes("economy") || role === "tempo"));
  const economyStallExempt = isEconomyStallExemptAction(input, action, decision);
  const visibleRemoteContest = targetServerId?.startsWith("remote_") === true && (targetServer?.rootCount ?? 0) > 0;

  if (input.side === "corp" && action.type === "install_card" && action.payload?.placement !== "ice" && sourceDefinition?.type === "agenda") {
    if (targetServerId === "new_remote" || ((targetServer?.iceCount ?? 0) === 0 && (targetServer?.rootCount ?? 0) === 0)) tags.push("naked_agenda_install");
  }
  if (input.side === "corp" && agendaInHand >= 3 && !isAgendaFloodExposureExemptAction(action, decision, sourceDefinition)) tags.push("agenda_flood_exposure");
  if (legalScoreAvailable && action.type !== "score_agenda") tags.push("score_window_missed");
  if (
    input.side === "corp" &&
    action.type === "install_card" &&
    targetServerId?.startsWith("remote_") &&
    ((action.payload?.placement === "ice" && (targetServer?.iceCount ?? 0) >= 2) || (action.payload?.placement !== "ice" && (targetServer?.rootCount ?? 0) >= 2))
  ) {
    tags.push("remote_overbuild");
  }
  if (lowCredits && !economyAction && !economyStallExempt) tags.push("economy_stall");
  if (input.side === "runner" && features.rigRoles.size === 0 && action.type === "start_run" && !visibleRemoteContest && input.playerView.opponent.agendaPoints < input.playerView.agendaPointsToWin - 2)
    tags.push("rig_stall");
  if (legalTrashAvailable && action.type !== "trash_accessed_card") tags.push("asset_trash_neglect");
  if (decision.timeoutUsed) tags.push("timeout");
  if (decision.fallbackUsed) tags.push("fallback");
  return sortedUnique(tags);
}

function isEconomyStallExemptAction(input: AiDecisionInput, action: LegalAction, decision: AiDecision): boolean {
  if (decision.fallbackUsed) return true;
  if (decision.reasonCode.endsWith(".recover_economy")) return true;
  if (action.type === "mandatory_draw" || action.type === "end_turn" || action.type === "decline_rez" || action.type === "resolve_choice") return true;
  if (input.side !== "runner") return false;
  return action.type === "pump_breaker" || action.type === "break_subroutine" || action.type === "continue_run" || action.type === "access_card" || action.type === "steal_agenda";
}

function isAgendaFloodExposureExemptAction(action: LegalAction, decision: AiDecision, sourceDefinition?: { type?: string }): boolean {
  if (decision.fallbackUsed) return true;
  if (decision.reasonCode.endsWith(".recover_economy")) return true;
  if (decision.reasonCode.endsWith(".protect_hq") || decision.reasonCode.endsWith(".protect_rnd")) return true;
  if (action.type === "install_card" && action.payload?.placement !== "ice" && sourceDefinition?.type !== "agenda") return true;
  return action.type === "mandatory_draw" || action.type === "end_turn" || action.type === "decline_rez" || action.type === "rez_ice" || action.type === "resolve_choice";
}

function repeatedLowValueCentralRunTags(actionSequence: AiSimulationSummary["actionSequence"]): string[] {
  const tags: string[] = [];
  const lastCentralRunByServer = new Map<string, number>();
  for (const [index, entry] of actionSequence.entries()) {
    if (entry.side !== "runner" || entry.actionType !== "start_run" || !entry.targetServerId || !["rd", "hq", "archives"].includes(entry.targetServerId)) continue;
    const previous = lastCentralRunByServer.get(entry.targetServerId);
    if (previous !== undefined && index - previous <= 4 && !entry.reasonCode.includes("contest") && !entry.reasonCode.includes("trash")) tags.push("repeated_low_value_central_run");
    lastCentralRunByServer.set(entry.targetServerId, index);
  }
  return tags;
}

const DOCTRINE_QUALITY_METRICS: AiDoctrineQualityMetricName[] = [
  "nakedAgendaInstalls",
  "agendaFloodExposure",
  "scoreWindowMissed",
  "remoteOverbuild",
  "economyStall",
  "repeatedLowValueCentralRun",
  "rigStall",
  "assetTrashNeglect"
];

function doctrineMetricsFor(tags: string[]): AiDoctrineQualityMetrics {
  return {
    nakedAgendaInstalls: countTag(tags, "naked_agenda_install"),
    agendaFloodExposure: countTag(tags, "agenda_flood_exposure"),
    scoreWindowMissed: countTag(tags, "score_window_missed"),
    remoteOverbuild: countTag(tags, "remote_overbuild"),
    economyStall: countTag(tags, "economy_stall"),
    repeatedLowValueCentralRun: countTag(tags, "repeated_low_value_central_run"),
    rigStall: countTag(tags, "rig_stall"),
    assetTrashNeglect: countTag(tags, "asset_trash_neglect")
  };
}

function emptyDoctrineCaseExamples(): Record<AiDoctrineQualityMetricName, AiDoctrineQualityCaseExample[]> {
  return {
    nakedAgendaInstalls: [],
    agendaFloodExposure: [],
    scoreWindowMissed: [],
    remoteOverbuild: [],
    economyStall: [],
    repeatedLowValueCentralRun: [],
    rigStall: [],
    assetTrashNeglect: []
  };
}

function doctrineMetricForQualityTag(tag: string): AiDoctrineQualityMetricName | undefined {
  switch (tag) {
    case "naked_agenda_install":
      return "nakedAgendaInstalls";
    case "agenda_flood_exposure":
      return "agendaFloodExposure";
    case "score_window_missed":
      return "scoreWindowMissed";
    case "remote_overbuild":
      return "remoteOverbuild";
    case "economy_stall":
      return "economyStall";
    case "rig_stall":
      return "rigStall";
    case "asset_trash_neglect":
      return "assetTrashNeglect";
    default:
      return undefined;
  }
}

function collectRepeatedLowValueCentralRunExamples(
  summary: AiSimulationSummary,
  examples: Record<AiDoctrineQualityMetricName, AiDoctrineQualityCaseExample[]>,
  maxExamplesPerMetric: number
): void {
  const metric: AiDoctrineQualityMetricName = "repeatedLowValueCentralRun";
  const lastCentralRunByServer = new Map<string, number>();
  for (const [actionIndex, entry] of summary.actionSequence.entries()) {
    if (entry.side !== "runner" || entry.actionType !== "start_run" || !entry.targetServerId || !["rd", "hq", "archives"].includes(entry.targetServerId)) continue;
    const previous = lastCentralRunByServer.get(entry.targetServerId);
    if (previous !== undefined && actionIndex - previous <= 4 && !entry.reasonCode.includes("contest") && !entry.reasonCode.includes("trash") && examples[metric].length < maxExamplesPerMetric) {
      examples[metric].push(doctrineCaseExample(summary.seed, actionIndex, entry, metric));
    }
    lastCentralRunByServer.set(entry.targetServerId, actionIndex);
  }
}

function doctrineCaseExample(
  seed: string,
  actionIndex: number,
  entry: AiSimulationSummary["actionSequence"][number],
  metric: AiDoctrineQualityMetricName
): AiDoctrineQualityCaseExample {
  return {
    metric,
    seed,
    actionIndex,
    stateVersionBefore: entry.stateVersionBefore,
    side: entry.side,
    actionType: entry.actionType,
    reasonCode: entry.reasonCode,
    ...(entry.targetServerId ? { targetServerId: entry.targetServerId } : {}),
    qualityTags: entry.qualityTags.slice().sort()
  };
}

function isRedactionSafeCaseAnalysis(analysis: AiDoctrineQualityCaseAnalysis): boolean {
  const serialized = JSON.stringify(analysis);
  return !FORBIDDEN_AI_INPUT_FIELDS.some((needle) => serialized.includes(needle));
}

function sumDoctrineMetrics(metrics: AiDoctrineQualityMetrics[]): AiDoctrineQualityMetrics {
  return metrics.reduce(
    (sum, entry) => ({
      nakedAgendaInstalls: sum.nakedAgendaInstalls + entry.nakedAgendaInstalls,
      agendaFloodExposure: sum.agendaFloodExposure + entry.agendaFloodExposure,
      scoreWindowMissed: sum.scoreWindowMissed + entry.scoreWindowMissed,
      remoteOverbuild: sum.remoteOverbuild + entry.remoteOverbuild,
      economyStall: sum.economyStall + entry.economyStall,
      repeatedLowValueCentralRun: sum.repeatedLowValueCentralRun + entry.repeatedLowValueCentralRun,
      rigStall: sum.rigStall + entry.rigStall,
      assetTrashNeglect: sum.assetTrashNeglect + entry.assetTrashNeglect
    }),
    emptyDoctrineMetrics()
  );
}

function diffDoctrineMetrics(candidate: AiDoctrineQualityMetrics, baseline: AiDoctrineQualityMetrics): AiDoctrineQualityDelta {
  return {
    nakedAgendaInstalls: candidate.nakedAgendaInstalls - baseline.nakedAgendaInstalls,
    agendaFloodExposure: candidate.agendaFloodExposure - baseline.agendaFloodExposure,
    scoreWindowMissed: candidate.scoreWindowMissed - baseline.scoreWindowMissed,
    remoteOverbuild: candidate.remoteOverbuild - baseline.remoteOverbuild,
    economyStall: candidate.economyStall - baseline.economyStall,
    repeatedLowValueCentralRun: candidate.repeatedLowValueCentralRun - baseline.repeatedLowValueCentralRun,
    rigStall: candidate.rigStall - baseline.rigStall,
    assetTrashNeglect: candidate.assetTrashNeglect - baseline.assetTrashNeglect
  };
}

function emptyDoctrineMetrics(): AiDoctrineQualityMetrics {
  return {
    nakedAgendaInstalls: 0,
    agendaFloodExposure: 0,
    scoreWindowMissed: 0,
    remoteOverbuild: 0,
    economyStall: 0,
    repeatedLowValueCentralRun: 0,
    rigStall: 0,
    assetTrashNeglect: 0
  };
}

function countTag(tags: string[], tag: string): number {
  return tags.filter((candidate) => candidate === tag).length;
}

function isHoldoutSeed(seed: string): boolean {
  return SOAK_SEEDS.holdoutSeeds.includes(seed);
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
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
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function deckDoctrineDebug(profile: AiDeckDoctrineProfile): Record<string, unknown> {
  return {
    schemaVersion: profile.schemaVersion,
    deckSnapshotId: profile.deckSnapshotId,
    side: profile.side,
    confidence: profile.confidence,
    archetypeTags: profile.archetypeTags.slice(0, 4),
    riskFlags: profile.riskFlags.slice(0, 6),
    evidence: profile.evidence.slice(0, 6)
  };
}

function confidence(score: number): number {
  return Math.max(0.1, Math.min(0.99, round(score / 1000)));
}

function compareAction(left: LegalAction, right: LegalAction): number {
  return left.actionId.localeCompare(right.actionId);
}
