import { applyAction, createGame, createGameAfterSetup, getLegalActions, getPlayerView, hashState, replayEvents } from "@netgrid/engine";
import aiProfilesData from "../../../data/ai/ai-profiles-0.9.json";
import soakSeedsData from "../../../data/ai/ai-soak-seeds-0.9.json";
import benchmarkProfiles143Data from "../../../data/ai/ai-benchmark-profiles-1.4.3.json";
import soakSeeds143Data from "../../../data/ai/ai-soak-seeds-1.4.3.json";
import cardRoleManifestData from "../../../data/ai/card-role-manifest-0.9.json";
import exploitFixtures143Data from "../../../data/scenarios/ai-v143-exploit-regression-fixtures.json";
import { chooseCorpPlanAction, hasCorpPlanAction } from "./corp-plans";
import { chooseRunnerPlanAction, hasRunnerPlanAction } from "./runner-plans";
import { beliefDebugSummary, reconstructBeliefState } from "./belief-state";
import { DEMO_CARDS_BY_ID, type AiDecision, type AiDecisionInput, type AiDifficulty, type DeckDefinition, type DeckPublicMetadata, type GameState, type LegalAction, type PublicGameEvent, type Side } from "@netgrid/shared";
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
  chooseCorpPlanAction,
  chooseCorpPlanDecision,
  corpPlanUsesOnlyAiSupportedCards,
  evaluateAgendaRisk,
  evaluateCorpPlan,
  evaluateEconomyReserve,
  evaluateIceRez,
  evaluateRemoteIntentMemory,
  evaluateScoringWindow,
  evaluateServerThreat,
  generateCorpPlanCandidates,
  hasCorpPlanAction
} from "./corp-plans";
export type { CorpPlanCandidate, CorpPlanDebug, CorpPlanDecision, CorpPlanEvaluatorResult, CorpPlanKind, CorpPlanScore, CorpPlanStep } from "./corp-plans";
export {
  chooseRunnerPlanAction,
  chooseRunnerPlanDecision,
  estimateRunCost,
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

type RankedChoice = {
  action: LegalAction | undefined;
  reasonCode: string;
  explanation: string;
  score: number;
  evidence: string[];
  confidence?: number;
};

type CardRole = {
  cardId: string;
  side: Side;
  roles: string[];
  riskTags?: string[];
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

const CARD_ROLES = new Map((cardRoleManifestData.cards as CardRole[]).map((card) => [card.cardId, card]));
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
    stateHashAfter: string;
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
  } = {}
): AiDecisionInput {
  const playerView = getPlayerView(state, side);
  return {
    side,
    playerView,
    eventTail: options.eventTail ?? playerView.publicEvents,
    legalActions: getLegalActions(state, side),
    difficulty: options.difficulty ?? "normal",
    seed: state.seed,
    decisionId: options.decisionId ?? `${state.matchId}:${state.stateVersion}:${side}`,
    actionNumber: options.actionNumber ?? state.stateVersion,
    profileId: options.profileId ?? `${side}-ai-v0.9-${options.difficulty ?? "normal"}`
  };
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
    decision.reasonCode === "runner.trace.bid_visible_amount" ||
    decision.reasonCode === "runner.access.steal_agenda" ||
    decision.reasonCode === "runner.access.open_card" ||
    decision.reasonCode === "runner.encounter.break_etr" ||
    decision.reasonCode === "runner.encounter.pump_breaker" ||
    decision.reasonCode === "runner.tag.clear_visible_tag"
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
          : config.corpProfileId ?? `corp-ai-v0.9-${config.corpDifficulty ?? "normal"}`
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

function applyFixtureChoiceFirstOption(
  state: GameState,
  side: Side,
  label: string
): { ok: true; state: GameState } | { ok: false; message: string } {
  const pendingChoice = state.pendingChoice;
  if (!pendingChoice || pendingChoice.side !== side) return { ok: false, message: `missing_pending_choice:${label}` };
  const optionId = pendingChoice.options[0]?.id;
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

function chooseDecisionForSimulation(side: Side, input: AiDecisionInput, config: AiSimulationConfig, simulationRng: SimulationRng): AiDecision {
  const mode = side === "runner" ? config.runnerControllerMode ?? "current_candidate" : config.corpControllerMode ?? "current_candidate";
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

function selectedChoicesForDecision(input: AiDecisionInput, action: LegalAction): AiDecision["selectedChoices"] | undefined {
  const choice = input.playerView.pendingChoice;
  if (action.type !== "resolve_choice" || !choice) return undefined;
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
  if (choice.kind === "select_cards") {
    const count = Math.max(choice.minSelections, Math.min(choice.maxSelections, choice.maxSelections));
    const selected = choice.options.slice(0, count).map((option) => option.id);
    return { choiceId: choice.choiceId, selectedOptionIds: selected };
  }
  if (choice.source.startsWith("v1921.playful_ai")) {
    const selected =
      choice.options
        .slice()
        .sort((left, right) => {
          const leftValue = typeof left.value === "number" ? left.value : -1;
          const rightValue = typeof right.value === "number" ? right.value : -1;
          return rightValue - leftValue || left.id.localeCompare(right.id);
        })[0] ?? choice.options[0];
    return selected ? { choiceId: choice.choiceId, selectedOptionIds: [selected.id] } : { choiceId: choice.choiceId, selectedOptionIds: [] };
  }
  if (choice.kind !== "bid_amount") {
    const firstOption = choice.options[0];
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
      score = input.playerView.pendingChoice?.kind === "bid_amount" ? 900 : 620;
      reasonCode = input.playerView.pendingChoice?.kind === "bid_amount" ? "runner.trace.bid_visible_amount" : "runner.choice.resolve";
      explanation = "Der Runner beantwortet eine sichtbare legale Choice.";
      evidence.push("choice_legal", `choice_kind:${input.playerView.pendingChoice?.kind ?? "unknown"}`);
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
    case "start_run":
      score = scoreRunTarget(action, features, profile, input.difficulty);
      reasonCode = runnerRunReasonCode(action, features);
      explanation =
        reasonCode === "runner.run.blocked_by_rezzed_ice"
          ? "Ein bereits gerezztes ICE stoppt diesen Server sichtbar; Setup oder Wirtschaft ist gerade wertvoller."
          : reasonCode === "runner.run.empty_remote_low_value"
            ? "Der Außenserver hat kein sichtbares Root-Ziel; ein Run ist derzeit wenig wertvoll."
          : "Der Serverdruck ist anhand sichtbarer Lage vertretbar.";
      evidence.push(`server:${String(action.payload?.serverId ?? "unknown")}`, `known_pressure:${features.knownServerPressure}`, ...runTargetEvidence(action, features));
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
      score = input.playerView.pendingChoice?.kind === "bid_amount" ? 900 : 620;
      reasonCode = input.playerView.pendingChoice?.kind === "bid_amount" ? "corp.trace.bid_visible_amount" : "corp.choice.resolve";
      explanation = "Die Corp beantwortet eine sichtbare legale Choice.";
      evidence.push("choice_legal", `choice_kind:${input.playerView.pendingChoice?.kind ?? "unknown"}`);
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
  return CARD_ROLES.get(cardId)?.roles ?? [];
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

function scoreRunTarget(action: LegalAction, features: AiFeatures, profile: Record<string, number>, difficulty: AiDifficulty): number {
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
  return score;
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
  return canBreakerDefinitionBreakIce(breaker.definitionId, encounteredIce.definitionId);
}

function canBreakerDefinitionBreakIce(breakerDefinitionId: string, iceDefinitionId: string): boolean {
  const breakerDefinition = DEMO_CARDS_BY_ID[breakerDefinitionId];
  const iceDefinition = DEMO_CARDS_BY_ID[iceDefinitionId];
  if (!breakerDefinition || !iceDefinition) return false;
  return Boolean(
    breakerDefinition.abilities?.some(
      (ability) => ability.type === "break_subroutine" && (!ability.iceSubtype || iceDefinition.subtypes.includes(ability.iceSubtype))
    )
  );
}

function iceHasEndTheRun(iceDefinitionId: string): boolean {
  return Boolean(DEMO_CARDS_BY_ID[iceDefinitionId]?.subroutines?.some((subroutine) => subroutine.type === "end_the_run"));
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

function metricsFor(actionSequence: AiSimulationSummary["actionSequence"], errors: string[], replayOk: boolean, holdout: boolean): AiQualityMetrics {
  const actions = actionSequence.length || 1;
  const reasonCodeCoverage = sortedUnique(actionSequence.map((entry) => entry.reasonCode.split(".").slice(0, 2).join(".")));
  return {
    illegalActions: errors.length,
    fallbackRate: round(actionSequence.filter((entry) => entry.fallbackUsed).length / actions),
    timeoutRate: round(actionSequence.filter((entry) => entry.timeoutUsed).length / actions),
    reasonCodeCoverage,
    actionTypeCoverage: sortedUnique(actionSequence.map((entry) => entry.actionType)),
    roleCoverage: sortedUnique(actionSequence.flatMap((entry) => entry.evidence.filter((item) => item.startsWith("role:")).map((item) => item.slice("role:".length)))),
    progressScore: round(actionSequence.length + (replayOk ? 10 : 0) - errors.length * 10),
    holdout
  };
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

function confidence(score: number): number {
  return Math.max(0.1, Math.min(0.99, round(score / 1000)));
}

function compareAction(left: LegalAction, right: LegalAction): number {
  return left.actionId.localeCompare(right.actionId);
}
