import { applyAction, createGame, getLegalActions, getPlayerView, hashState, replayEvents } from "@netrunner/engine";
import aiProfilesData from "../../../data/ai/ai-profiles-0.9.json";
import soakSeedsData from "../../../data/ai/ai-soak-seeds-0.9.json";
import cardRoleManifestData from "../../../data/ai/card-role-manifest-0.9.json";
import type { AiDecision, AiDecisionInput, AiDifficulty, DeckDefinition, DeckPublicMetadata, GameState, LegalAction, PublicGameEvent, Side } from "@netrunner/shared";

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
  handRoles: Set<string>;
  eventCounts: Record<string, number>;
  knownServerPressure: number;
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
};

export type AiSimulationSummary = {
  seed: string;
  winner: GameState["winner"] | "action_limit_reached";
  actions: number;
  turns: number;
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
    eventTail: options.eventTail ?? playerView.publicEvents.slice(-20),
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
  return decisionFromChoices(input, scoreActions(input, "corp"));
}

export function chooseRunnerAction(input: AiDecisionInput): AiDecision {
  return decisionFromChoices(input, scoreActions(input, "runner"));
}

export function assertAiInputIsSideSafe(input: AiDecisionInput): boolean {
  const serialized = JSON.stringify(input);
  if (FORBIDDEN_AI_INPUT_FIELDS.some((needle) => serialized.includes(needle))) return false;
  if (input.side === "runner") {
    return !serialized.includes("corp_simple_agenda") && !serialized.includes("corp_simple_barrier_ice");
  }
  return !serialized.includes("runner_simple_fracter") && !serialized.includes("runner_simple_decoder") && !serialized.includes("runner_simple_killer");
}

export function simulateAiGame(config: AiSimulationConfig = {}): AiSimulationSummary {
  const seed = config.seed ?? "ai-vs-ai-smoke";
  let state = createGame({
    seed,
    agendaPointsToWin: config.agendaPointsToWin ?? 6,
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
    const decision = chooseAiAction(input);
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
  return {
    seed,
    winner: state.winner ?? "action_limit_reached",
    actions: actionSequence.length,
    turns: state.eventLog.filter((event) => event.type === "end_turn").length,
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

function decisionFromChoices(input: AiDecisionInput, choices: RankedChoice[]): AiDecision {
  const consideredActionIds = input.legalActions.map((action) => action.actionId).sort();
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
      score = 690;
      reasonCode = "runner.encounter.pump_breaker";
      explanation = "Ein installierter Breaker kann die Begegnung verbessern.";
      evidence.push("breaker_visible");
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
      reasonCode = "runner.run.visible_pressure";
      explanation = "Der Serverdruck ist anhand sichtbarer Lage vertretbar.";
      evidence.push(`server:${String(action.payload?.serverId ?? "unknown")}`, `known_pressure:${features.knownServerPressure}`);
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
  const handRoles = new Set(input.playerView.own.gripOrHq.flatMap((card) => rolesForCardId(card.definitionId)));
  const eventCounts = buildObservedFacts(input).eventCounts;
  const knownServerPressure = input.playerView.servers.reduce((sum, server) => sum + server.ice.filter((card) => card.known || card.rezzed).length + server.root.filter((card) => card.known).length, 0);
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
    handRoles: new Set([...handRoles, ...ownCards.flatMap((card) => rolesForCardId(card.definitionId)).filter((role) => role === "tag_punishment")]),
    eventCounts,
    knownServerPressure
  };
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
  let score = difficulty === "easy" ? 330 : 560 + (profile.run ?? 1) * 55;
  if (serverId.startsWith("remote_")) score += 60;
  if (serverId === "rd") score += 45;
  if (features.credits < 3) score -= 140;
  if (features.rigRoles.size === 0 && difficulty !== "hard") score -= 60;
  return score;
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

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

function confidence(score: number): number {
  return Math.max(0.1, Math.min(0.99, round(score / 1000)));
}

function compareAction(left: LegalAction, right: LegalAction): number {
  return left.actionId.localeCompare(right.actionId);
}
