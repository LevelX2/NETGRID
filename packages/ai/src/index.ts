import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  applyAction,
  createGame,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import { createRuntimeCardsById } from "@netgrid/catalog";
import {
  buildEngineDeck,
  createDeckSnapshot,
  validateEditableDeck,
  type DeckFormatProfile,
  type EditableDeck,
} from "@netgrid/decks";
import aiProfilesData from "../../../data/ai/ai-profiles-0.9.json";
import soakSeedsData from "../../../data/ai/ai-soak-seeds-0.9.json";
import benchmarkProfiles143Data from "../../../data/ai/ai-benchmark-profiles-1.4.3.json";
import localRealisticBenchmarkDeckSnapshotsData from "../../../data/ai/ai-local-realistic-benchmark-deck-snapshots-2026-05-23.json";
import localRealisticBenchmarkDecksData from "../../../data/ai/ai-local-realistic-benchmark-decks-2026-05-23.json";
import soakSeeds143Data from "../../../data/ai/ai-soak-seeds-1.4.3.json";
import deckFormatProfiles130Data from "../../../data/decks/deck-format-profiles-1.3.0.json";
import deckSnapshots08Data from "../../../data/decks/deck-snapshots-0.8.json";
import exploitFixtures143Data from "../../../data/scenarios/ai-v143-exploit-regression-fixtures.json";
import { chooseCorpPlanAction, hasCorpPlanAction } from "./corp-plans";
import { chooseRunnerPlanAction, hasRunnerPlanAction } from "./runner-plans";
import { beliefDebugSummary, reconstructBeliefState } from "./belief-state";
import {
  buildDeckDoctrineProfile,
  evaluateCorpOpeningHand,
  evaluateRunnerOpeningHand,
  type AiDeckDoctrineDeckSnapshot,
} from "./deck-doctrine";
import {
  CARD_ROLES_BY_CARD,
  RUNTIME_CARDS,
  createAiHintsByCard,
} from "./ai-hints";
import {
  assessKnownRezzedIcePath,
  canBreakerDefinitionBreakIce,
  creditsToBreakEndTheRunSubroutinesWithBreaker,
  endTheRunSubroutineCount,
  iceHasEndTheRun,
} from "./visible-run-analysis";
import { buildAiDecisionInputDto } from "./input-dto";
import {
  AI_DECISION_DEBUG_SCHEMA_VERSION,
  CURRENT_RULES_BASELINE,
  DEMO_CARDS_BY_ID,
  DEMO_DECKS,
  type AiDeckDoctrineProfile,
  type AiDecision,
  type AiDecisionDebug,
  type AiDecisionInput,
  type AiDifficulty,
  type CardInstanceId,
  type DeckDefinition,
  type DeckPublicMetadata,
  type GameState,
  type LegalAction,
  type PlayerView,
  type PublicGameEvent,
  type Side,
  type VisibleCard,
} from "@netgrid/shared";
export {
  beliefDebugSummary,
  beliefStateInvariantSignature,
  reconstructBeliefState,
} from "./belief-state";
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
  RunnerOpponentModel,
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
  evaluateRemoteRezReserve,
  evaluateRemoteScoreHorizon,
  evaluateRunnerContestCapacity,
  evaluateScoringWindow,
  evaluateServerThreat,
  generateCorpPlanCandidates,
  hasCorpPlanAction,
} from "./corp-plans";
export type {
  CorpPlanCandidate,
  CorpPlanDebug,
  CorpPlanDecision,
  CorpPlanEvaluatorResult,
  CorpPlanKind,
  CorpPlanScore,
  CorpPlanStep,
  RemoteScoreHorizon,
  RunnerContestCapacity,
} from "./corp-plans";
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
  runnerPlanUsesOnlyAiSupportedCards,
} from "./runner-plans";
export type {
  RunnerPlanCandidate,
  RunnerPlanDebug,
  RunnerPlanDecision,
  RunnerPlanEvaluatorResult,
  RunnerPlanKind,
  RunnerPlanScore,
  RunnerPlanStep,
} from "./runner-plans";
export {
  buildDeckDoctrineProfile,
  evaluateCorpOpeningHand,
  evaluateRunnerOpeningHand,
} from "./deck-doctrine";
export type {
  AiDeckDoctrineDeckSnapshot,
  CorpOpeningHandEvaluation,
  OpeningHandEvaluation,
  RunnerOpeningHandEvaluation,
} from "./deck-doctrine";

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
  citySurveillanceSourceCount: number;
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
  averageTurns: number;
  runnerAgendaPoints: number;
  corpAgendaPoints: number;
  runnerSteals: number;
  corpScores: number;
  scoreActionsAvailable: number;
  scoreActionsTaken: number;
  missedScoreWindows: number;
  scoreActionTakeRate: number;
  scoreOrStealActions: number;
  scoreOrStealActionsPerMatch: number;
  advancedAgendaSteals: number;
  advancedAgendaStealsFromRemote: number;
  advancedAgendaStealsFromCentral: number;
  finalAdvanceActions: number;
  unsafeFinalAdvanceActions: number;
  protectedFinalAdvanceActions: number;
  protectBeforeAdvanceActions: number;
  advanceThenScoreSameTurn: number;
  advanceThenRunnerStealBeforeNextCorpScore: number;
  remoteProtectionScoreAtFinalAdvance: number;
  runnerContestRiskAtFinalAdvance: number;
  centralPressureRuns: number;
  hqPressureRuns: number;
  rdPressureRuns: number;
  archivesPressureRuns: number;
  remotePressureRuns: number;
  successfulCentralRuns: number;
  centralAgendaSteals: number;
  hqAgendaSteals: number;
  rndAgendaSteals: number;
  archivesAgendaSteals: number;
  centralStealsPerRun: number;
  centralRunsWithMultiaccess: number;
  centralRunsWithInterfaceInstalled: number;
  hqRunsWithHqInterface: number;
  rndRunsWithRndInterface: number;
  centralRunEventsPlayed: number;
  centralRunEventsWithGoodTarget: number;
  repeatedLowValueCentralRuns: number;
  centralRunStreakWithoutValue: number;
  centralRunStartedWithInsufficientPostRunReserve: number;
  centralCloseoutOpportunities: number;
  centralCloseoutRunsTaken: number;
  centralCloseoutSuccesses: number;
  interfaceInstallOpportunities: number;
  interfaceInstallsTaken: number;
  interfaceInstalledButUnusedTurns: number;
  successfulRemoteRuns: number;
  successfulRemoteAccesses: number;
  remoteTrashActions: number;
  remoteAccessesWithTrashableCards: number;
  remoteAccessesWithRelevantTrashableCards: number;
  affordableRelevantRemoteTrashOpportunities: number;
  relevantRemoteTrashTaken: number;
  relevantRemoteTrashTakeRate: number;
  skippedAffordableRelevantRemoteTrash: number;
  remoteTrashTargetsAssetNode: number;
  remoteTrashTargetsUpgrade: number;
  remoteTrashTargetsIce: number;
  remoteTrashTargetsUnknown: number;
  remoteTrashRoleEconomy: number;
  remoteTrashRoleScoringProtection: number;
  remoteTrashRoleTagPunish: number;
  remoteTrashRoleAmbush: number;
  remoteTrashRoleLowValue: number;
  remoteRunOpportunitiesAgainstAdvancedRemote: number;
  remoteRunsAgainstAdvancedRemote: number;
  skippedAdvancedRemoteContest: number;
  centralRunWhileRemoteScoreThreatVisible: number;
  remoteContestCreditReserveAfterRun: number;
  uniqueAdvancedRemoteThreats: number;
  contestableAdvancedRemoteThreats: number;
  advancedRemoteThreatsContested: number;
  advancedRemoteThreatContestRate: number;
  skippedContestableAdvancedRemoteThreats: number;
  centralRunInsteadOfContestableAdvancedRemote: number;
  centralRunInsteadWasJustified: number;
  centralRunBurnedRemoteContestReserve: number;
  remoteContestBlockedByCredits: number;
  remoteContestBlockedByPostRunReserve: number;
  remoteContestBlockedByBreakerCoverage: number;
  remoteContestBlockedByKnownIceCost: number;
  remoteContestDeclinedAsBaitOrLowValue: number;
  repeatedCentralRunsWhileSameRemoteThreat: number;
  remoteRunStartedWithInsufficientPostRunReserve: number;
  remoteRunStartedWithSufficientPostRunReserve: number;
  turnsFromRemoteThreatCreatedToContest: number;
  turnsFromRemoteThreatCreatedToScoreOrSteal: number;
  remoteContestActions: number;
  pressureTargetSwitches: number;
  distinctPressureTargets: number;
  remoteInstalls: number;
  remoteRootInstalls: number;
  remoteIceInstalls: number;
  remoteAdvances: number;
  advancedAgendaInstalledInRemote: number;
  advancementActionsOnAgendas: number;
  advancementActionsOnAssets: number;
  advancementActionsOnUpgrades: number;
  advancementActionsOnUnknown: number;
  remoteBuildActions: number;
  remoteAdvanceActions: number;
  scoreWindowActions: number;
  scoringRemoteDevelopmentActions: number;
  rezIceDuringRun: number;
  scoreWindows: number;
  turnsToFirstCorpScore: number;
  turnsToFirstAgendaSteal: number;
  turnsFromFirstAdvanceToScore: number;
  turnsFromFinalAdvanceToScoreOrSteal: number;
  runnerDrawActions: number;
  runnerDrawActionShare: number;
  clickDrawActions: number;
  cardEffectDrawActions: number;
  drawWhileHoldingPlayableEconomy: number;
  drawWhileHoldingInstallableBreaker: number;
  drawWhileHoldingRunnablePressureCard: number;
  drawWhileRemoteTrashAvailable: number;
  drawThenDiscardSameTurn: number;
  discardedPlayableEconomy: number;
  discardedInstallableBreaker: number;
  discardedRunPressureCard: number;
  runnerInstallActions: number;
  runnerDuplicateInstallActions: number;
  runnerLowValueDuplicateInstallActions: number;
  runnerJunkyardBbsDuplicateInstalls: number;
  runnerEconomyActionsTaken: number;
  runnerRigInstallActions: number;
  runnerRemoteTrashOpportunities: number;
  runnerRemoteTrashTaken: number;
  handUseRate: number;
  runnerAverageCredits: number;
  runnerMedianCredits: number;
  runnerEndTurnAverageCredits: number;
  runnerEndTurnCreditsBelowReserve: number;
  runnerCreditReserveTargetAverage: number;
  runnerTurnsBelowContestReserve: number;
  runnerEconomyCreditsGained: number;
  runnerEconomyCreditsSpent: number;
  runnerNetCreditDeltaPerTurn: number;
  runnerRunsStartedBelowReserve: number;
  runnerRemoteRunsStartedBelowReserve: number;
  runnerCentralRunsStartedBelowReserve: number;
  runnerContestBlockedByCredits: number;
  runnerTrashBlockedByCredits: number;
  runnerStealBlockedByCredits: number;
  runnerSpendBelowReserveActions: number;
  runnerLowValueSpendBelowReserve: number;
  runnerExpensiveInstallBelowReserve: number;
  runnerReservePreservingEconomyActions: number;
  runnerReserveAfterSuccessfulRun: number;
  runnerReserveAfterRemoteAccess: number;
  runnerReserveAfterCentralRun: number;
  runnerReserveBeforeAdvancedRemoteContest: number;
  runsStartedAgainstKnownUnaffordablePath: number;
  remoteRunsStartedAgainstKnownUnaffordablePath: number;
  centralRunsStartedAgainstKnownUnaffordablePath: number;
  runsEndedAfterFirstIceDueToCredits: number;
  creditsMissingForKnownPath: number;
  knownPathCostAtRunStart: number;
  creditsAfterKnownPathEstimate: number;
  runStartedWithInsufficientStealOrTrashReserve: number;
  probeRunsWithPositiveInfoValue: number;
  lowValueUnaffordableRuns: number;
  illegalActions: number;
  replayFailures: number;
  fallbackRate: number;
  timeoutRate: number;
};

export type AiMatchProgressionProfileComparison = {
  profile: SimulationBenchmarkProfileId;
  metrics: AiMatchProgressionMetrics;
};

export type AiBenchmarkDeckSlotType =
  | "smoke"
  | "snapshot_tuning"
  | "snapshot_holdout"
  | "local_realistic_holdout"
  | "real_scene_holdout";
export type AiBenchmarkDeckSlotStatus = "runnable" | "disabled" | "pending";
export type AiLocalBenchmarkDeckClassification =
  | "runnable_ai_benchmark"
  | "blocked_by_missing_cards"
  | "blocked_by_unsupported_cards"
  | "blocked_by_ambiguous_mapping"
  | "incomplete"
  | "unclear";

export type AiBenchmarkDeckReference =
  | { kind: "runtime_deck_id"; deckId: string }
  | { kind: "snapshot"; snapshotId: string }
  | { kind: "frozen_local_snapshot"; snapshotId: string }
  | {
      kind: "local_editable_deck";
      localDeckId: string;
      expectedName: string;
      fileName: string;
      baseDir?: string;
    }
  | { kind: "pending_real_scene"; label: string };

export type AiBenchmarkDeckSlotDefinition = {
  slotId: string;
  label: string;
  slotType: AiBenchmarkDeckSlotType;
  status: AiBenchmarkDeckSlotStatus;
  runner: AiBenchmarkDeckReference;
  corp: AiBenchmarkDeckReference;
  tuningUse: "safety_regression" | "progression_tuning" | "holdout_only";
  pendingReason?: string;
};

export type AiBenchmarkSnapshotDeck = {
  snapshotId: string;
  sourceDeckId: string;
  deck: DeckDefinition;
  metadata: DeckPublicMetadata;
};

export type AiBenchmarkLocalEditableDeckResult =
  | {
      ok: true;
      classification: "runnable_ai_benchmark";
      localDeckId: string;
      expectedName: string;
      filePath: string;
      deck: DeckDefinition;
      metadata: DeckPublicMetadata;
      validation: {
        totalCards: number;
        agendaPoints: number | null;
        influenceSpent?: number | null;
      };
      missingCards: string[];
      ambiguousNames: string[];
      unsupportedCards: string[];
      nonDeckLegalCards: string[];
    }
  | {
      ok: false;
      classification: AiLocalBenchmarkDeckClassification;
      localDeckId: string;
      expectedName: string;
      filePath?: string;
      reason: string;
      validationErrors: string[];
      missingCards: string[];
      ambiguousNames: string[];
      unsupportedCards: string[];
      nonDeckLegalCards: string[];
    };

export type AiBenchmarkDeckSlotResult = {
  slotId: string;
  label: string;
  slotType: AiBenchmarkDeckSlotType;
  status: AiBenchmarkDeckSlotStatus;
  tuningUse: AiBenchmarkDeckSlotDefinition["tuningUse"];
  runnerDeckRef: string;
  corpDeckRef: string;
  reason?: string;
  benchmark?: AiMatchProgressionBenchmarkResult;
};

export type AiMatchProgressionBenchmarkSuiteResult = {
  version: "ai-match-progression-suite-v1";
  diagnosticOnly: true;
  baselineProfile: SimulationBenchmarkProfileId;
  candidateProfile: SimulationBenchmarkProfileId;
  comparisonProfiles: SimulationBenchmarkProfileId[];
  seeds: string[];
  slots: AiBenchmarkDeckSlotResult[];
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
  profileComparisons: AiMatchProgressionProfileComparison[];
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

export type V143LeagueConfig = Partial<AiSimulationConfig> & {
  includeHoldout?: boolean;
};

export type AiDoctrineQualityBenchmarkConfig = V143LeagueConfig & {
  baselineProfile?: SimulationBenchmarkProfileId;
  candidateProfile?: SimulationBenchmarkProfileId;
  comparisonProfiles?: SimulationBenchmarkProfileId[];
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
const BENCHMARK_PROFILES_143 = benchmarkProfiles143Data as {
  version: "1.4.3";
  profiles: SimulationBenchmarkProfile[];
};
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
const EXPLOIT_FIXTURES_143 = exploitFixtures143Data as {
  version: "1.4.3";
  fixtures: V143ExploitFixture[];
};
const AI_HINTS = createAiHintsByCard();

type DeckSnapshotRecord = {
  deckSnapshotId: string;
  sourceDeckId: string;
  name: string;
  side: Side;
  identityCardId: string;
  cards: Array<{ cardId: string; quantity: number }>;
  publicMetadata?: DeckPublicMetadata;
};

const DECK_SNAPSHOTS_08 = (
  deckSnapshots08Data as { snapshots: DeckSnapshotRecord[] }
).snapshots;

type FrozenLocalBenchmarkDeckSnapshot = {
  deckSnapshotId: string;
  sourceDeckId: string;
  sourceFileName: string;
  deckVersion: string;
  name: string;
  side: Side;
  identityCardId: string;
  cardPoolSnapshotId: string;
  cardPoolVersion?: string;
  formatProfileId: string;
  formatProfileVersion?: string;
  deckHash: string;
  classification: AiLocalBenchmarkDeckClassification;
  role: string;
  cards: Array<{ cardId: string; quantity: number }>;
};

const LOCAL_REALISTIC_FROZEN_DECK_SNAPSHOTS = (
  localRealisticBenchmarkDeckSnapshotsData as {
    snapshots: FrozenLocalBenchmarkDeckSnapshot[];
  }
).snapshots;

type LocalRealisticBenchmarkDeckManifest = {
  schemaVersion: "ai-local-realistic-benchmark-decks-v1";
  storage: {
    kind: "appdata_netgrid_decks";
    relativeDirectory: string;
    overrideEnv: string;
    format: "netgrid-editable-deck-v1";
    cardReference: "cardId";
  };
  frozenSnapshotsFile: string;
  decks: Array<{
    localDeckId: string;
    snapshotId: string;
    expectedName: string;
    side: Side;
    fileName: string;
    classification: AiLocalBenchmarkDeckClassification;
    role: string;
  }>;
  slots: Array<{
    slotId: string;
    label: string;
    slotType: "local_realistic_holdout";
    status: AiBenchmarkDeckSlotStatus;
    runnerLocalDeckId: string;
    corpLocalDeckId: string;
    tuningUse: "holdout_only";
  }>;
};

const LOCAL_REALISTIC_BENCHMARK_DECKS =
  localRealisticBenchmarkDecksData as LocalRealisticBenchmarkDeckManifest;
const BENCHMARK_RUNTIME_CARDS_BY_ID = createRuntimeCardsById();
const BENCHMARK_DECK_FORMAT_PROFILE: DeckFormatProfile =
  (deckFormatProfiles130Data.profiles as DeckFormatProfile[]).find(
    (profile) => profile.profileId === "netgrid_private_local_v1",
  ) ?? missingBenchmarkDeckFormatProfile();

const LOCAL_REALISTIC_BENCHMARK_DECK_SLOTS: AiBenchmarkDeckSlotDefinition[] =
  LOCAL_REALISTIC_BENCHMARK_DECKS.slots.map((slot) => {
    const runner = localBenchmarkDeckManifestEntry(slot.runnerLocalDeckId);
    const corp = localBenchmarkDeckManifestEntry(slot.corpLocalDeckId);
    return {
      slotId: slot.slotId,
      label: slot.label,
      slotType: slot.slotType,
      status: slot.status,
      runner: runner
        ? { kind: "frozen_local_snapshot", snapshotId: runner.snapshotId }
        : {
            kind: "pending_real_scene",
            label: `${slot.runnerLocalDeckId}:missing_manifest_entry`,
          },
      corp: corp
        ? { kind: "frozen_local_snapshot", snapshotId: corp.snapshotId }
        : {
            kind: "pending_real_scene",
            label: `${slot.corpLocalDeckId}:missing_manifest_entry`,
          },
      tuningUse: slot.tuningUse,
      ...(!runner || !corp
        ? {
            pendingReason:
              "Local realistic benchmark manifest references a missing deck entry.",
          }
        : {}),
    };
  });

const MATCH_PROGRESSION_BENCHMARK_DECK_SLOTS: AiBenchmarkDeckSlotDefinition[] =
  [
    {
      slotId: "safety_smoke_demo_008",
      label: "Safety-Smoke demo_008",
      slotType: "smoke",
      status: "runnable",
      runner: { kind: "runtime_deck_id", deckId: "demo_runner_008" },
      corp: { kind: "runtime_deck_id", deckId: "demo_corp_008" },
      tuningUse: "safety_regression",
    },
    {
      slotId: "progression_tuning_origin_rig_vs_tax",
      label: "Progression-Tuning A",
      slotType: "snapshot_tuning",
      status: "runnable",
      runner: {
        kind: "snapshot",
        snapshotId: "onr_origin_runner_ai_snapshot_v1",
      },
      corp: { kind: "snapshot", snapshotId: "onr_origin_corp_ai_snapshot_v1" },
      tuningUse: "progression_tuning",
    },
    {
      slotId: "progression_tuning_origin_pressure_vs_tax",
      label: "Progression-Tuning B",
      slotType: "snapshot_tuning",
      status: "runnable",
      runner: {
        kind: "snapshot",
        snapshotId: "onr_origin_runner_ai_event_pressure_snapshot_v1",
      },
      corp: { kind: "snapshot", snapshotId: "onr_origin_corp_ai_snapshot_v1" },
      tuningUse: "progression_tuning",
    },
    {
      slotId: "snapshot_holdout_origin_pressure_vs_tag_ops",
      label: "Snapshot-Holdout",
      slotType: "snapshot_holdout",
      status: "runnable",
      runner: {
        kind: "snapshot",
        snapshotId: "onr_origin_runner_ai_event_pressure_snapshot_v1",
      },
      corp: {
        kind: "snapshot",
        snapshotId: "onr_origin_corp_ai_tag_ops_snapshot_v1",
      },
      tuningUse: "holdout_only",
    },
    ...LOCAL_REALISTIC_BENCHMARK_DECK_SLOTS,
    {
      slotId: "real_scene_pair_1",
      label: "Real Scene Holdout 1",
      slotType: "real_scene_holdout",
      status: "pending",
      runner: { kind: "pending_real_scene", label: "real_scene_pair_1_runner" },
      corp: { kind: "pending_real_scene", label: "real_scene_pair_1_corp" },
      tuningUse: "holdout_only",
      pendingReason:
        "Keine vollstaendige echte Szenedeckliste im Repository gefunden.",
    },
    {
      slotId: "real_scene_pair_2",
      label: "Real Scene Holdout 2",
      slotType: "real_scene_holdout",
      status: "pending",
      runner: { kind: "pending_real_scene", label: "real_scene_pair_2_runner" },
      corp: { kind: "pending_real_scene", label: "real_scene_pair_2_corp" },
      tuningUse: "holdout_only",
      pendingReason:
        "Keine vollstaendige echte Szenedeckliste im Repository gefunden.",
    },
  ];

type DiscardCandidateScore = {
  total: number;
  baseValue: number;
  planFit: number;
  doctrineFit: number;
  evidence: string[];
};

export type AiSimulationConfig = {
  seed?: string;
  maxActions?: number;
  agendaPointsToWin?: number;
  runnerDifficulty?: AiDifficulty;
  corpDifficulty?: AiDifficulty;
  runnerProfileId?: string;
  corpProfileId?: string;
  runnerDeckId?:
    | "demo_runner_001"
    | "demo_runner_004"
    | "demo_runner_008"
    | "demo_runner_096"
    | "demo_runner_097"
    | "demo_runner_098"
    | "demo_runner_099";
  corpDeckId?:
    | "demo_corp_001"
    | "demo_corp_004"
    | "demo_corp_008"
    | "demo_corp_096"
    | "demo_corp_097"
    | "demo_corp_098"
    | "demo_corp_099";
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
    eventType?: string;
    timingPoint?: string;
    turnNumber?: number;
    reasonCode: string;
    explanation: string;
    confidence: number;
    evidence: string[];
    fallbackUsed: boolean;
    timeoutUsed: boolean;
    targetServerId?: string;
    advancementCountersAdded?: number;
    scoreActionsAvailable?: number;
    targetCardType?: ProgressionCardTargetType;
    advancementTargetTypes?: ProgressionCardTargetType[];
    advancedAgendaStolen?: boolean;
    advancedAgendaStealSource?: "remote" | "central" | "unknown";
    finalAdvance?: boolean;
    unsafeFinalAdvance?: boolean;
    protectedFinalAdvance?: boolean;
    protectBeforeAdvance?: boolean;
    remoteProtectionScore?: number;
    runnerContestRisk?: "low" | "medium" | "high" | "unknown";
    advancesRemainingAfterAction?: number;
    runnerDrawAction?: boolean;
    runnerClickDrawAction?: boolean;
    runnerCardEffectDrawAction?: boolean;
    runnerDrawWhileHoldingPlayableEconomy?: boolean;
    runnerDrawWhileHoldingInstallableBreaker?: boolean;
    runnerDrawWhileHoldingRunnablePressureCard?: boolean;
    runnerDrawWhileRemoteTrashAvailable?: boolean;
    runnerDiscardChoice?: boolean;
    runnerDiscardedPlayableEconomy?: boolean;
    runnerDiscardedInstallableBreaker?: boolean;
    runnerDiscardedRunPressureCard?: boolean;
    runnerInstallAction?: boolean;
    runnerDuplicateInstallAction?: boolean;
    runnerLowValueDuplicateInstallAction?: boolean;
    runnerJunkyardBbsDuplicateInstall?: boolean;
    runnerEconomyActionTaken?: boolean;
    runnerRigInstallAction?: boolean;
    runnerPressureActionTaken?: boolean;
    runnerRemoteTrashOpportunity?: boolean;
    runnerRemoteTrashTaken?: boolean;
    runnerRemoteAccessWithTrashableCard?: boolean;
    runnerRemoteAccessWithRelevantTrashableCard?: boolean;
    runnerAffordableRelevantRemoteTrashOpportunity?: boolean;
    runnerRelevantRemoteTrashTaken?: boolean;
    runnerSkippedAffordableRelevantRemoteTrash?: boolean;
    runnerRemoteTrashTargetType?: RemoteTrashTargetType;
    runnerRemoteTrashRole?: RemoteTrashRole;
    runnerRemoteRunOpportunityAgainstAdvancedRemote?: boolean;
    runnerRemoteRunAgainstAdvancedRemote?: boolean;
    runnerSkippedAdvancedRemoteContest?: boolean;
    runnerCentralRunWhileRemoteScoreThreatVisible?: boolean;
    runnerCentralRunWithMultiaccess?: boolean;
    runnerCentralRunWithInterfaceInstalled?: boolean;
    runnerHqRunWithHqInterface?: boolean;
    runnerRndRunWithRndInterface?: boolean;
    runnerCentralRunEventPlayed?: boolean;
    runnerCentralRunEventWithGoodTarget?: boolean;
    runnerRepeatedLowValueCentralRun?: boolean;
    runnerCentralRunStreakWithoutValue?: number;
    runnerCentralRunStartedWithInsufficientPostRunReserve?: boolean;
    runnerCentralCloseoutOpportunity?: boolean;
    runnerCentralCloseoutRunTaken?: boolean;
    runnerCentralCloseoutSuccess?: boolean;
    runnerInterfaceInstallOpportunity?: boolean;
    runnerInterfaceInstallTaken?: boolean;
    runnerInterfaceInstalledButUnusedTurn?: boolean;
    runnerRemoteContestCreditReserveAfterRun?: number;
    runnerAdvancedRemoteThreatServerIds?: string[];
    runnerContestableAdvancedRemoteThreatServerIds?: string[];
    runnerContestedAdvancedRemoteServerId?: string;
    runnerCentralRunInsteadOfContestableAdvancedRemote?: boolean;
    runnerCentralRunInsteadWasJustified?: boolean;
    runnerCentralRunBurnedRemoteContestReserve?: boolean;
    runnerRemoteContestBlockedByCredits?: boolean;
    runnerRemoteContestBlockedByPostRunReserve?: boolean;
    runnerRemoteContestBlockedByBreakerCoverage?: boolean;
    runnerRemoteContestBlockedByKnownIceCost?: boolean;
    runnerRemoteContestDeclinedAsBaitOrLowValue?: boolean;
    runnerRepeatedCentralRunWhileSameRemoteThreat?: boolean;
    runnerRemoteRunStartedWithInsufficientPostRunReserve?: boolean;
    runnerRemoteRunStartedWithSufficientPostRunReserve?: boolean;
    runnerHandUseOpportunity?: boolean;
    runnerHandUseActionTaken?: boolean;
    runnerCreditsBefore?: number;
    runnerCreditsAfter?: number;
    runnerCreditDelta?: number;
    runnerReserveTarget?: number;
    runnerBelowReserveBefore?: boolean;
    runnerBelowReserveAfter?: boolean;
    runnerEconomyCreditsGained?: number;
    runnerEconomyCreditsSpent?: number;
    runnerRunStartedBelowReserve?: boolean;
    runnerRemoteRunStartedBelowReserve?: boolean;
    runnerCentralRunStartedBelowReserve?: boolean;
    runnerContestBlockedByCredits?: boolean;
    runnerTrashBlockedByCredits?: boolean;
    runnerStealBlockedByCredits?: boolean;
    runnerSpendBelowReserve?: boolean;
    runnerLowValueSpendBelowReserve?: boolean;
    runnerExpensiveInstallBelowReserve?: boolean;
    runnerReservePreservingEconomy?: boolean;
    runnerReserveAfterSuccessfulRun?: number;
    runnerReserveAfterRemoteAccess?: number;
    runnerReserveAfterCentralRun?: number;
    runnerReserveBeforeAdvancedRemoteContest?: number;
    runKnownPathCostAtStart?: number;
    runCreditsAfterKnownPathEstimate?: number;
    runCreditsMissingForKnownPath?: number;
    runStartedAgainstKnownUnaffordablePath?: boolean;
    remoteRunStartedAgainstKnownUnaffordablePath?: boolean;
    centralRunStartedAgainstKnownUnaffordablePath?: boolean;
    runEndedAfterFirstIceDueToCredits?: boolean;
    runStartedWithInsufficientStealOrTrashReserve?: boolean;
    probeRunWithPositiveInfoValue?: boolean;
    lowValueUnaffordableRun?: boolean;
    qualityTags: string[];
    stateHashAfter: string;
    installPlacement?: string;
  }>;
  errors: string[];
  cardPoolVersion: typeof CURRENT_RULES_BASELINE.engineSchemaVersion;
  metrics: AiQualityMetrics;
};

type ProgressionCardTargetType =
  | "agenda"
  | "asset"
  | "upgrade"
  | "ice"
  | "unknown";

type RemoteTrashTargetType = "asset_node" | "upgrade" | "ice" | "unknown";
type RemoteTrashRole =
  | "economy"
  | "scoring_protection"
  | "tag_punish"
  | "ambush"
  | "low_value"
  | "unknown";

export type AiDecisionSideSelection =
  | {
      side: Side;
      legalActions: LegalAction[];
      activeSideLegalActions: LegalAction[];
      inactiveSideLegalActions: LegalAction[];
      terminal: false;
    }
  | {
      side: undefined;
      legalActions: [];
      activeSideLegalActions: LegalAction[];
      inactiveSideLegalActions: LegalAction[];
      terminal: boolean;
      error?: string;
    };

const FORBIDDEN_AI_INPUT_FIELDS = [
  "cardInstances",
  "privatePayload",
  "sessionToken",
  "reconnectToken",
  "joinToken",
  "tokenHash",
  "fullGameState",
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
  } = {},
): AiDecisionInput {
  const playerView = getPlayerView(state, side);
  const ownDeckDoctrine =
    options.ownDeckDoctrine ??
    (options.ownDeckSnapshot
      ? buildDeckDoctrineProfile(options.ownDeckSnapshot)
      : undefined);
  return buildAiDecisionInputDto({
    side,
    playerView,
    eventTail: options.eventTail ?? playerView.publicEvents,
    legalActions: getLegalActions(state, side),
    difficulty: options.difficulty ?? "normal",
    seed: state.seed,
    decisionId:
      options.decisionId ?? `${state.matchId}:${state.stateVersion}:${side}`,
    actionNumber: options.actionNumber ?? state.stateVersion,
    profileId:
      options.profileId ?? `${side}-ai-v0.9-${options.difficulty ?? "normal"}`,
    ...(ownDeckDoctrine ? { ownDeckDoctrine } : {}),
  });
}

export function selectAiDecisionSideForState(
  state: GameState,
): AiDecisionSideSelection {
  const activeSide = state.activeSide;
  const inactiveSide = oppositeSide(activeSide);
  const activeSideLegalActions = getLegalActions(state, activeSide);
  const inactiveSideLegalActions = getLegalActions(state, inactiveSide);
  if (activeSideLegalActions.length > 0) {
    return {
      side: activeSide,
      legalActions: activeSideLegalActions,
      activeSideLegalActions,
      inactiveSideLegalActions,
      terminal: false,
    };
  }
  if (inactiveSideLegalActions.length > 0) {
    return {
      side: inactiveSide,
      legalActions: inactiveSideLegalActions,
      activeSideLegalActions,
      inactiveSideLegalActions,
      terminal: false,
    };
  }
  const terminal = Boolean(state.winner) || state.phase === "game_over";
  return {
    side: undefined,
    legalActions: [],
    activeSideLegalActions,
    inactiveSideLegalActions,
    terminal,
    ...(terminal
      ? {}
      : {
          error: `No legal actions for either side at ${state.stateVersion} (activeSide ${state.activeSide}, phase ${state.phase}, timingPoint ${state.timingPoint}).`,
        }),
  };
}

function oppositeSide(side: Side): Side {
  return side === "runner" ? "corp" : "runner";
}

export function chooseAiAction(input: AiDecisionInput): AiDecision {
  return input.side === "runner"
    ? chooseRunnerAction(input)
    : chooseCorpAction(input);
}

export function chooseCorpAction(input: AiDecisionInput): AiDecision {
  const baselineDecision = chooseCorpBaselineAction(input);
  return hasCorpPlanAction(input) &&
    !isCorpReactiveBaselineDecision(baselineDecision)
    ? chooseCorpPlanAction(input, baselineDecision)
    : baselineDecision;
}

export function chooseCorpBaselineAction(input: AiDecisionInput): AiDecision {
  return decisionFromChoices(input, scoreActions(input, "corp"));
}

export function chooseRunnerAction(input: AiDecisionInput): AiDecision {
  const baselineDecision = chooseRunnerBaselineAction(input);
  return hasRunnerPlanAction(input) &&
    (!isRunnerReactiveBaselineDecision(baselineDecision) ||
      baselineShellTradersPlanIsVisible(input, baselineDecision))
    ? chooseRunnerPlanAction(input, baselineDecision)
    : baselineDecision;
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

function baselineShellTradersPlanIsVisible(
  input: AiDecisionInput,
  decision: AiDecision,
): boolean {
  if (
    decision.reasonCode !== "runner.shell_traders.prepare_install" &&
    decision.reasonCode !== "runner.shell_traders.remove_counter"
  )
    return false;
  const action = input.legalActions.find(
    (candidate) => candidate.actionId === decision.actionId,
  );
  if (!action || action.type !== "trigger_ability") return false;
  if (
    action.payload?.shellTradersAbility !== "set_aside_from_grip" &&
    action.payload?.shellTradersAbility !== "remove_shell_counter"
  )
    return false;
  if (action.source === "basic_action" || action.source === "game_rule")
    return false;
  return Boolean(
    input.playerView.own.rig?.some(
      (card) => card.known && card.instanceId === action.source,
    ),
  );
}

export function assertAiInputIsSideSafe(input: AiDecisionInput): boolean {
  const serialized = JSON.stringify(input);
  if (FORBIDDEN_AI_INPUT_FIELDS.some((needle) => serialized.includes(needle)))
    return false;
  return true;
}

export function simulateAiGame(
  config: AiSimulationConfig = {},
): AiSimulationSummary {
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
      cardPoolVersion: CURRENT_RULES_BASELINE.engineSchemaVersion,
      metrics: metricsFor(
        [],
        deckSupportErrors,
        false,
        isHoldoutSeed(config.seed ?? "ai-vs-ai-smoke"),
      ),
    };
  }

  const seed = config.seed ?? "ai-vs-ai-smoke";
  const simulationRng = createSimulationRng(
    config.simulationRngSeed ?? `${seed}:sim-rng`,
  );
  const runnerDeckDefinition =
    config.runnerDeck ?? DEMO_DECKS[config.runnerDeckId ?? "demo_runner_001"];
  const corpDeckDefinition =
    config.corpDeck ?? DEMO_DECKS[config.corpDeckId ?? "demo_corp_001"];
  let state = createGame({
    seed,
    agendaPointsToWin: config.agendaPointsToWin ?? 7,
    ...(config.runnerDeckId ? { runnerDeckId: config.runnerDeckId } : {}),
    ...(config.corpDeckId ? { corpDeckId: config.corpDeckId } : {}),
    ...(config.runnerDeck ? { runnerDeck: config.runnerDeck } : {}),
    ...(config.corpDeck ? { corpDeck: config.corpDeck } : {}),
    ...(config.runnerDeckMetadata
      ? { runnerDeckMetadata: config.runnerDeckMetadata }
      : {}),
    ...(config.corpDeckMetadata
      ? { corpDeckMetadata: config.corpDeckMetadata }
      : {}),
    controllers: {
      runner: {
        controllerId: "runner-ai",
        side: "runner",
        type: "ai",
        displayName: "Runner KI",
        difficulty: config.runnerDifficulty ?? "normal",
        profileId:
          config.runnerProfileId ??
          `runner-ai-v0.9-${config.runnerDifficulty ?? "normal"}`,
      },
      corp: {
        controllerId: "corp-ai",
        side: "corp",
        type: "ai",
        displayName: "Corp KI",
        difficulty: config.corpDifficulty ?? "normal",
        profileId:
          config.corpProfileId ??
          `corp-ai-v0.9-${config.corpDifficulty ?? "normal"}`,
      },
    },
  });
  const initial = structuredClone(state);
  const deckSnapshots: Record<Side, AiDeckDoctrineDeckSnapshot> = {
    runner: deckSnapshotForSimulation(
      runnerDeckDefinition,
      state.deckMetadata?.runner ?? config.runnerDeckMetadata,
    ),
    corp: deckSnapshotForSimulation(
      corpDeckDefinition,
      state.deckMetadata?.corp ?? config.corpDeckMetadata,
    ),
  };
  const actionSequence: AiSimulationSummary["actionSequence"] = [];
  const errors: string[] = [];
  const maxActions = config.maxActions ?? 120;

  for (let index = 0; index < maxActions && !state.winner; index += 1) {
    const sideSelection = selectAiDecisionSideForState(state);
    if (!sideSelection.side) {
      if (sideSelection.terminal) break;
      errors.push(
        sideSelection.error ??
          `No legal actions for either side at ${state.stateVersion} (activeSide ${state.activeSide}, phase ${state.phase}, timingPoint ${state.timingPoint}).`,
      );
      break;
    }
    const side = sideSelection.side;
    const input = buildAiDecisionInput(state, side, {
      difficulty:
        side === "runner"
          ? (config.runnerDifficulty ?? "normal")
          : (config.corpDifficulty ?? "normal"),
      actionNumber: index,
      decisionId: `${seed}:${index}:${side}`,
      profileId:
        side === "runner"
          ? (config.runnerProfileId ??
            `runner-ai-v0.9-${config.runnerDifficulty ?? "normal"}`)
          : (config.corpProfileId ??
            `corp-ai-v0.9-${config.corpDifficulty ?? "normal"}`),
      ...(controllerModeForSide(side, config) === "current_candidate"
        ? { ownDeckSnapshot: deckSnapshots[side] }
        : {}),
    });
    if (!assertAiInputIsSideSafe(input)) {
      errors.push(
        `Simulation input is not side-safe for ${side} at ${state.stateVersion}.`,
      );
      break;
    }
    const decision = chooseDecisionForSimulation(
      side,
      input,
      config,
      simulationRng,
    );
    const action = input.legalActions.find(
      (candidate) => candidate.actionId === decision.actionId,
    );
    if (!action) {
      errors.push(`No legal action for ${side} at ${state.stateVersion}.`);
      break;
    }
    const stateBeforeAction = state;
    const result = applyAction(state, {
      matchId: state.matchId,
      side,
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(decision.selectedChoices
        ? { selectedChoices: decision.selectedChoices }
        : {}),
      idempotencyKey: `ai-sim-${index}`,
    });
    if (!result.ok) {
      errors.push(
        `${result.error.code} at stateVersion ${state.stateVersion}.`,
      );
      break;
    }
    const targetServerId = targetServerIdForSimulationAction(
      action,
      result.event,
      stateBeforeAction,
    );
    const targetCardIds = targetCardIdsForSimulationAction(
      input,
      decision,
      action,
      result.event,
      stateBeforeAction,
    );
    const targetCardType = targetCardIds[0]
      ? cardTargetTypeForInstance(stateBeforeAction, targetCardIds[0])
      : undefined;
    const advancementCountersAdded =
      advancementCountersAddedForSimulationAction(action, result.event);
    const advancementTargetTypes =
      action.type === "advance_card" || advancementCountersAdded > 0
        ? sortedUniqueProgressionCardTargetTypes(
            targetCardIds.map((cardId) =>
              cardTargetTypeForInstance(stateBeforeAction, cardId),
            ),
          )
        : [];
    const scoreActionsAvailable =
      side === "corp"
        ? input.legalActions.filter(
            (candidate) => candidate.type === "score_agenda",
          ).length
        : 0;
    const advancedAgendaStealSource = advancedAgendaStealSourceForAction(
      stateBeforeAction,
      action,
      targetCardIds,
    );
    const finalAdvance = finalAdvanceAssessmentForSimulationAction(
      stateBeforeAction,
      input,
      action,
      targetServerId,
      targetCardIds,
      advancementCountersAdded,
    );
    const protectBeforeAdvance = isProtectBeforeAdvanceSimulationAction(
      stateBeforeAction,
      input,
      action,
      targetServerId,
    );
    const runnerHandUse = runnerHandUseDiagnosticsForSimulationAction(
      input,
      decision,
      action,
      targetServerId,
    );
    const runnerReserve = runnerReserveDiagnosticsForSimulationAction(
      input,
      action,
      targetServerId,
      result.state,
    );
    const runnerCentralPressure =
      runnerCentralPressureDiagnosticsForSimulationAction(
        input,
        action,
        targetServerId,
      );
    actionSequence.push({
      side,
      stateVersionBefore: result.event.stateVersionBefore,
      actionType: action.type,
      eventType: result.event.type,
      timingPoint: action.timingPoint,
      turnNumber:
        state.eventLog.filter((event) => event.type === "end_turn").length + 1,
      reasonCode: decision.reasonCode,
      explanation: decision.explanation,
      confidence: decision.confidence ?? 0,
      evidence: decision.evidence ?? [],
      fallbackUsed: decision.fallbackUsed,
      timeoutUsed: decision.timeoutUsed ?? false,
      ...(targetServerId ? { targetServerId } : {}),
      ...(advancementCountersAdded > 0 ? { advancementCountersAdded } : {}),
      ...(scoreActionsAvailable > 0 ? { scoreActionsAvailable } : {}),
      ...(targetCardType ? { targetCardType } : {}),
      ...(advancementTargetTypes.length > 0 ? { advancementTargetTypes } : {}),
      ...(advancedAgendaStealSource
        ? {
            advancedAgendaStolen: true,
            advancedAgendaStealSource,
          }
        : {}),
      ...(finalAdvance.finalAdvance
        ? {
            finalAdvance: true,
            ...(finalAdvance.unsafeFinalAdvance
              ? { unsafeFinalAdvance: true }
              : {}),
            ...(finalAdvance.protectedFinalAdvance
              ? { protectedFinalAdvance: true }
              : {}),
            remoteProtectionScore: finalAdvance.remoteProtectionScore,
            runnerContestRisk: finalAdvance.runnerContestRisk,
            advancesRemainingAfterAction:
              finalAdvance.advancesRemainingAfterAction,
          }
        : {}),
      ...(protectBeforeAdvance ? { protectBeforeAdvance: true } : {}),
      ...runnerHandUse,
      ...runnerReserve,
      ...runnerCentralPressure,
      ...(typeof action.payload?.placement === "string"
        ? { installPlacement: action.payload.placement }
        : {}),
      qualityTags: qualityTagsForAction(input, action, decision),
      stateHashAfter: result.stateHash,
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
    finalAgendaPoints: {
      runner: runnerView.own.agendaPoints,
      corp: corpView.own.agendaPoints,
    },
    finalStateHash: hashState(state),
    eventLogLength: state.eventLog.length,
    replayOk: replay.ok,
    replayErrors: replay.errors,
    actionSequence,
    errors,
    cardPoolVersion: CURRENT_RULES_BASELINE.engineSchemaVersion,
    metrics: metricsFor(actionSequence, errors, replay.ok, isHoldoutSeed(seed)),
  };
}

export function simulateAiSoak(
  config: Partial<AiSimulationConfig> = {},
): AiSoakResult {
  const summaries = [
    ...SOAK_SEEDS.tuningSeeds,
    ...SOAK_SEEDS.holdoutSeeds,
  ].flatMap((seed) =>
    SOAK_SEEDS.matrix.difficulties.map((difficulty) =>
      simulateAiGame({
        seed,
        runnerDeckId: config.runnerDeckId ?? SOAK_SEEDS.matrix.runnerDeckId,
        corpDeckId: config.corpDeckId ?? SOAK_SEEDS.matrix.corpDeckId,
        agendaPointsToWin:
          config.agendaPointsToWin ?? SOAK_SEEDS.matrix.agendaPointsToWin,
        maxActions: config.maxActions ?? SOAK_SEEDS.matrix.maxActions,
        runnerDifficulty: config.runnerDifficulty ?? difficulty,
        corpDifficulty: config.corpDifficulty ?? difficulty,
      }),
    ),
  );
  const totalActions =
    summaries.reduce(
      (sum, summary) => sum + summary.actionSequence.length,
      0,
    ) || 1;
  const fallbacks = summaries.reduce(
    (sum, summary) =>
      sum + summary.actionSequence.filter((entry) => entry.fallbackUsed).length,
    0,
  );
  const timeouts = summaries.reduce(
    (sum, summary) =>
      sum + summary.actionSequence.filter((entry) => entry.timeoutUsed).length,
    0,
  );
  return {
    summaries,
    aggregate: {
      seeds: summaries.length,
      illegalActions: summaries.reduce(
        (sum, summary) => sum + summary.metrics.illegalActions,
        0,
      ),
      replayFailures: summaries.filter((summary) => !summary.replayOk).length,
      fallbackRate: round(fallbacks / totalActions),
      timeoutRate: round(timeouts / totalActions),
      reasonCodeCoverage: sortedUnique(
        summaries.flatMap((summary) => summary.metrics.reasonCodeCoverage),
      ),
      actionTypeCoverage: sortedUnique(
        summaries.flatMap((summary) => summary.metrics.actionTypeCoverage),
      ),
      holdoutSeeds: SOAK_SEEDS.holdoutSeeds,
    },
  };
}

export function summarizeDoctrineQualityMetrics(
  actionSequence: AiSimulationSummary["actionSequence"],
): AiDoctrineQualityMetrics {
  return doctrineMetricsFor([
    ...actionSequence.flatMap((entry) => entry.qualityTags),
    ...repeatedLowValueCentralRunTags(actionSequence),
  ]);
}

export function listV143BenchmarkProfiles(): SimulationBenchmarkProfile[] {
  return BENCHMARK_PROFILES_143.profiles.map((profile) => ({ ...profile }));
}

export function listV143ExploitFixtures(): V143ExploitFixture[] {
  return EXPLOIT_FIXTURES_143.fixtures.map((fixture) => ({ ...fixture }));
}

export function listMatchProgressionBenchmarkDeckSlots(): AiBenchmarkDeckSlotDefinition[] {
  return MATCH_PROGRESSION_BENCHMARK_DECK_SLOTS.map((slot) => ({ ...slot }));
}

export function benchmarkDeckFromSnapshot(
  snapshotId: string,
): AiBenchmarkSnapshotDeck {
  const snapshot = DECK_SNAPSHOTS_08.find(
    (candidate) => candidate.deckSnapshotId === snapshotId,
  );
  if (!snapshot) {
    throw new Error(`Unknown benchmark deck snapshot: ${snapshotId}`);
  }
  const deck: DeckDefinition = {
    id: snapshot.deckSnapshotId,
    name: snapshot.name,
    side: snapshot.side,
    identity: snapshot.identityCardId,
    cards: snapshot.cards.map((card) => ({
      id: card.cardId,
      quantity: card.quantity,
    })),
  };
  const metadata: DeckPublicMetadata =
    snapshot.publicMetadata ??
    ({
      side: snapshot.side,
      identityCardId: snapshot.identityCardId,
      deckName: snapshot.name,
    } as DeckPublicMetadata);
  return {
    snapshotId: snapshot.deckSnapshotId,
    sourceDeckId: snapshot.sourceDeckId,
    deck,
    metadata,
  };
}

export function benchmarkDeckFromFrozenLocalSnapshot(
  snapshotId: string,
): AiBenchmarkSnapshotDeck {
  const snapshot = LOCAL_REALISTIC_FROZEN_DECK_SNAPSHOTS.find(
    (candidate) => candidate.deckSnapshotId === snapshotId,
  );
  if (!snapshot) {
    throw new Error(
      `Unknown frozen local benchmark deck snapshot: ${snapshotId}`,
    );
  }
  if (snapshot.classification !== "runnable_ai_benchmark") {
    throw new Error(
      `Frozen local benchmark deck ${snapshotId} is not runnable: ${snapshot.classification}`,
    );
  }
  const unsupportedCards = snapshot.cards
    .filter(
      (entry) =>
        BENCHMARK_RUNTIME_CARDS_BY_ID[entry.cardId]?.statuses.ai_supported !==
        true,
    )
    .map((entry) => entry.cardId);
  if (unsupportedCards.length > 0) {
    throw new Error(
      `Frozen local benchmark deck ${snapshotId} contains unsupported cards: ${sortedUnique(unsupportedCards).join(",")}`,
    );
  }
  const deck: DeckDefinition = {
    id: snapshot.deckSnapshotId,
    name: snapshot.name,
    side: snapshot.side,
    identity: snapshot.identityCardId,
    cards: snapshot.cards.map((card) => ({
      id: card.cardId,
      quantity: card.quantity,
    })),
  };
  const metadata: DeckPublicMetadata = {
    side: snapshot.side,
    identityCardId: snapshot.identityCardId,
    deckName: snapshot.name,
    cardPoolSnapshotId: snapshot.cardPoolSnapshotId,
    ...(snapshot.cardPoolVersion
      ? { cardPoolVersion: snapshot.cardPoolVersion }
      : {}),
    formatProfileId: snapshot.formatProfileId,
    ...(snapshot.formatProfileVersion
      ? { formatProfileVersion: snapshot.formatProfileVersion }
      : {}),
    deckHash: snapshot.deckHash,
  };
  return {
    snapshotId: snapshot.deckSnapshotId,
    sourceDeckId: snapshot.sourceDeckId,
    deck,
    metadata,
  };
}

export function benchmarkDeckFromLocalEditableDeck(
  reference: Extract<AiBenchmarkDeckReference, { kind: "local_editable_deck" }>,
): AiBenchmarkLocalEditableDeckResult {
  const filePath = path.join(
    resolveLocalDeckEditorDecksDir(reference.baseDir),
    reference.fileName,
  );
  const emptyFailure = (
    classification: AiLocalBenchmarkDeckClassification,
    reason: string,
    validationErrors: string[] = [],
  ): AiBenchmarkLocalEditableDeckResult => ({
    ok: false,
    classification,
    localDeckId: reference.localDeckId,
    expectedName: reference.expectedName,
    filePath,
    reason,
    validationErrors,
    missingCards: [],
    ambiguousNames: [],
    unsupportedCards: [],
    nonDeckLegalCards: [],
  });

  if (!existsSync(filePath)) {
    return emptyFailure(
      "unclear",
      `Local Deck-Editor deck file not found: ${reference.fileName}`,
    );
  }

  let parsed: { schemaVersion?: string; deck?: EditableDeck };
  try {
    parsed = JSON.parse(readFileSync(filePath, "utf8")) as {
      schemaVersion?: string;
      deck?: EditableDeck;
    };
  } catch (error) {
    return emptyFailure(
      "unclear",
      `Local Deck-Editor deck JSON could not be parsed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (parsed.schemaVersion !== "netgrid-editable-deck-v1" || !parsed.deck) {
    return emptyFailure(
      "unclear",
      `Local Deck-Editor deck ${reference.fileName} has unsupported schema ${parsed.schemaVersion ?? "unknown"}.`,
    );
  }

  const deck = parsed.deck;
  const shapeErrors = [
    ...(deck.deckId !== reference.localDeckId
      ? [
          `Deck ID mismatch: expected ${reference.localDeckId}, got ${deck.deckId}.`,
        ]
      : []),
    ...(deck.name !== reference.expectedName
      ? [
          `Deck name mismatch: expected ${reference.expectedName}, got ${deck.name}.`,
        ]
      : []),
    ...(deck.side !== "runner" && deck.side !== "corp"
      ? [`Deck side is invalid: ${String(deck.side)}.`]
      : []),
    ...(!Array.isArray(deck.cards) || deck.cards.length === 0
      ? ["Deck has no cards."]
      : []),
  ];
  if (shapeErrors.length > 0) {
    return emptyFailure(
      deck.cards?.length === 0 ? "incomplete" : "unclear",
      shapeErrors.join(" | "),
      shapeErrors,
    );
  }

  const missingCards = sortedUnique(
    deck.cards
      .filter((entry) => !BENCHMARK_RUNTIME_CARDS_BY_ID[entry.cardId])
      .map((entry) => entry.cardId),
  );
  const unsupportedCards = sortedUnique(
    deck.cards
      .filter((entry) => {
        const card = BENCHMARK_RUNTIME_CARDS_BY_ID[entry.cardId];
        return card && card.statuses.ai_supported !== true;
      })
      .map((entry) => entry.cardId),
  );
  const nonDeckLegalCards = sortedUnique(
    deck.cards
      .filter((entry) => {
        const card = BENCHMARK_RUNTIME_CARDS_BY_ID[entry.cardId];
        return (
          card &&
          (card.statuses.deck_legal !== true ||
            card.statuses.format_legal !== true ||
            card.statuses.human_playable !== true)
        );
      })
      .map((entry) => entry.cardId),
  );
  const validation = validateEditableDeck(deck, {
    cardsById: BENCHMARK_RUNTIME_CARDS_BY_ID,
    profile: BENCHMARK_DECK_FORMAT_PROFILE,
  });
  const validationErrors = [...validation.errors];
  const classification = classifyLocalEditableBenchmarkDeck({
    deck,
    missingCards,
    unsupportedCards,
    nonDeckLegalCards,
    validationErrors,
  });

  if (classification !== "runnable_ai_benchmark") {
    return {
      ok: false,
      classification,
      localDeckId: reference.localDeckId,
      expectedName: reference.expectedName,
      filePath,
      reason:
        [
          ...(missingCards.length > 0
            ? [`missing_cards:${missingCards.join(",")}`]
            : []),
          ...(unsupportedCards.length > 0
            ? [`unsupported_cards:${unsupportedCards.join(",")}`]
            : []),
          ...(nonDeckLegalCards.length > 0
            ? [`non_deck_legal_cards:${nonDeckLegalCards.join(",")}`]
            : []),
          ...validationErrors,
        ].join(" | ") ||
        "Local Deck-Editor deck is not runnable for AI benchmark.",
      validationErrors,
      missingCards,
      ambiguousNames: [],
      unsupportedCards,
      nonDeckLegalCards,
    };
  }

  const snapshot = createDeckSnapshot(
    deck,
    {
      cardsById: BENCHMARK_RUNTIME_CARDS_BY_ID,
      profile: BENCHMARK_DECK_FORMAT_PROFILE,
    },
    {
      snapshotId: `${deck.deckId}_local_benchmark_snapshot_v1`,
      rulesBaselineId: "rules-baseline-mvp-0.4",
    },
  );
  const engineDeck = buildEngineDeck(snapshot);
  return {
    ok: true,
    classification,
    localDeckId: reference.localDeckId,
    expectedName: reference.expectedName,
    filePath,
    deck: {
      id: engineDeck.id,
      name: engineDeck.name,
      side: engineDeck.side,
      identity: engineDeck.identity,
      cards: engineDeck.cards,
    },
    metadata: snapshot.publicMetadata,
    validation: {
      totalCards: snapshot.validation.totalCards,
      agendaPoints: snapshot.validation.agendaPoints,
      ...(snapshot.validation.influenceSpent !== undefined
        ? { influenceSpent: snapshot.validation.influenceSpent }
        : {}),
    },
    missingCards,
    ambiguousNames: [],
    unsupportedCards,
    nonDeckLegalCards,
  };
}

function localBenchmarkDeckManifestEntry(
  localDeckId: string,
): LocalRealisticBenchmarkDeckManifest["decks"][number] | undefined {
  return LOCAL_REALISTIC_BENCHMARK_DECKS.decks.find(
    (deck) => deck.localDeckId === localDeckId,
  );
}

function missingBenchmarkDeckFormatProfile(): never {
  throw new Error(
    "Missing netgrid_private_local_v1 deck format profile for AI benchmark local deck adapter.",
  );
}

function resolveLocalDeckEditorDecksDir(baseDir?: string): string {
  if (baseDir) return baseDir;
  const override =
    process.env[LOCAL_REALISTIC_BENCHMARK_DECKS.storage.overrideEnv];
  if (override) return override;
  return path.join(
    process.env.APPDATA ?? "",
    ...LOCAL_REALISTIC_BENCHMARK_DECKS.storage.relativeDirectory.split(
      /[\\/]+/,
    ),
  );
}

function classifyLocalEditableBenchmarkDeck(input: {
  deck: EditableDeck;
  missingCards: string[];
  unsupportedCards: string[];
  nonDeckLegalCards: string[];
  validationErrors: string[];
}): AiLocalBenchmarkDeckClassification {
  if (!input.deck.cards || input.deck.cards.length === 0) return "incomplete";
  if (input.missingCards.length > 0) return "blocked_by_missing_cards";
  if (input.unsupportedCards.length > 0 || input.nonDeckLegalCards.length > 0)
    return "blocked_by_unsupported_cards";
  if (input.validationErrors.length > 0) return "unclear";
  return "runnable_ai_benchmark";
}

export function createBeliefSimulationWorld(
  input: AiDecisionInput,
  seed: string = `${input.seed}:belief:${input.actionNumber}`,
): SimulationWorld {
  const belief = reconstructBeliefState(input);
  const hypotheses = belief.entries
    .filter((entry) => entry.kind === "hypothesis")
    .map((entry) => entry.subject);
  return {
    worldId: `simworld:${input.side}:${belief.version}:${seed}`,
    sourceBeliefVersion: belief.version,
    seed,
    hiddenAssumptions: hypotheses.slice(0, 12),
    redactionSafe: assertAiInputIsSideSafe(input),
  };
}

export function runV143SimulationLeague(
  config: V143LeagueConfig = {},
): V143SoakResult {
  const tuningSeeds = SOAK_SEEDS_143.tuningSeeds;
  const holdoutSeeds = SOAK_SEEDS_143.holdoutSeeds;
  const seeds =
    config.includeHoldout === false
      ? tuningSeeds
      : [...tuningSeeds, ...holdoutSeeds];
  const profiles = BENCHMARK_PROFILES_143.profiles.map((profile) =>
    runV143Profile(profile, seeds, config),
  );
  return {
    version: "1.4.3",
    profiles,
    holdoutSeeds,
    tuningSeeds,
  };
}

export function runDoctrineQualityBenchmark(
  config: AiDoctrineQualityBenchmarkConfig = {},
): AiDoctrineQualityBenchmarkResult {
  const baselineProfileId = config.baselineProfile ?? "belief_ai_v1_4_2";
  const candidateProfileId = config.candidateProfile ?? "current_candidate";
  const baselineProfile = benchmarkProfileById(baselineProfileId);
  const candidateProfile = benchmarkProfileById(candidateProfileId);
  const seeds =
    config.includeHoldout === false
      ? SOAK_SEEDS_143.tuningSeeds
      : [...SOAK_SEEDS_143.tuningSeeds, ...SOAK_SEEDS_143.holdoutSeeds];
  const baselineRun = runV143Profile(baselineProfile, seeds, config);
  const candidateRun = runV143Profile(candidateProfile, seeds, config);
  const baseline = sumDoctrineMetrics(
    baselineRun.summaries.map((summary) => summary.metrics.doctrine),
  );
  const candidate = sumDoctrineMetrics(
    candidateRun.summaries.map((summary) => summary.metrics.doctrine),
  );
  return {
    version: "ai-deck-doctrine-quality-v1",
    baselineProfile: baselineProfileId,
    candidateProfile: candidateProfileId,
    seeds,
    baseline,
    candidate,
    delta: diffDoctrineMetrics(candidate, baseline),
    safety: {
      illegalActionDelta:
        candidateRun.illegalActions - baselineRun.illegalActions,
      replayFailureDelta:
        candidateRun.replayFailures - baselineRun.replayFailures,
      timeoutRateDelta: round(
        candidateRun.timeouts / Math.max(candidateRun.games, 1) -
          baselineRun.timeouts / Math.max(baselineRun.games, 1),
      ),
      fallbackRateDelta: round(
        candidateRun.fallbackRate - baselineRun.fallbackRate,
      ),
    },
    baselineRun,
    candidateRun,
  };
}

export function runMatchProgressionBenchmark(
  config: AiDoctrineQualityBenchmarkConfig = {},
): AiMatchProgressionBenchmarkResult {
  const baselineProfileId = config.baselineProfile ?? "belief_ai_v1_4_2";
  const candidateProfileId = config.candidateProfile ?? "current_candidate";
  const baselineProfile = benchmarkProfileById(baselineProfileId);
  const candidateProfile = benchmarkProfileById(candidateProfileId);
  const seeds =
    config.includeHoldout === false
      ? SOAK_SEEDS_143.tuningSeeds
      : [...SOAK_SEEDS_143.tuningSeeds, ...SOAK_SEEDS_143.holdoutSeeds];
  const baselineRun = runV143Profile(baselineProfile, seeds, config);
  const candidateRun = runV143Profile(candidateProfile, seeds, config);
  const baseline = summarizeMatchProgressionMetrics(baselineRun.summaries);
  const candidate = summarizeMatchProgressionMetrics(candidateRun.summaries);
  const comparisonProfileIds = sortedUnique([
    ...(config.comparisonProfiles ?? [
      "basic_corp_ai",
      "basic_runner_ai",
      "belief_ai_v1_4_2",
      "current_candidate",
    ]),
    baselineProfileId,
    candidateProfileId,
  ]) as SimulationBenchmarkProfileId[];
  const profileComparisons = comparisonProfileIds.map((profileId) => {
    if (profileId === baselineProfileId)
      return { profile: profileId, metrics: baseline };
    if (profileId === candidateProfileId)
      return { profile: profileId, metrics: candidate };
    return {
      profile: profileId,
      metrics: summarizeMatchProgressionMetrics(
        runV143Profile(benchmarkProfileById(profileId), seeds, config)
          .summaries,
      ),
    };
  });
  return {
    version: "ai-match-progression-v1",
    baselineProfile: baselineProfileId,
    candidateProfile: candidateProfileId,
    seeds,
    runnerDeckId:
      config.runnerDeck?.id ??
      config.runnerDeckId ??
      SOAK_SEEDS_143.league.runnerDeckId,
    corpDeckId:
      config.corpDeck?.id ??
      config.corpDeckId ??
      SOAK_SEEDS_143.league.corpDeckId,
    maxActions: config.maxActions ?? SOAK_SEEDS_143.league.maxActions,
    diagnosticOnly: true,
    baseline,
    candidate,
    delta: diffMatchProgressionMetrics(candidate, baseline),
    profileComparisons,
    baselineRun,
    candidateRun,
  };
}

export function runMatchProgressionBenchmarkSuite(
  config: AiDoctrineQualityBenchmarkConfig = {},
): AiMatchProgressionBenchmarkSuiteResult {
  const baselineProfile = config.baselineProfile ?? "belief_ai_v1_4_2";
  const candidateProfile = config.candidateProfile ?? "current_candidate";
  const comparisonProfiles = sortedUnique([
    ...(config.comparisonProfiles ?? [
      "basic_corp_ai",
      "basic_runner_ai",
      "belief_ai_v1_4_2",
      "current_candidate",
    ]),
    baselineProfile,
    candidateProfile,
  ]) as SimulationBenchmarkProfileId[];
  const seeds =
    config.includeHoldout === false
      ? SOAK_SEEDS_143.tuningSeeds
      : [...SOAK_SEEDS_143.tuningSeeds, ...SOAK_SEEDS_143.holdoutSeeds];
  const slots = MATCH_PROGRESSION_BENCHMARK_DECK_SLOTS.map((slot) =>
    runMatchProgressionBenchmarkSlot(slot, config, comparisonProfiles),
  );
  return {
    version: "ai-match-progression-suite-v1",
    diagnosticOnly: true,
    baselineProfile,
    candidateProfile,
    comparisonProfiles,
    seeds,
    slots,
  };
}

function runMatchProgressionBenchmarkSlot(
  slot: AiBenchmarkDeckSlotDefinition,
  config: AiDoctrineQualityBenchmarkConfig,
  comparisonProfiles: SimulationBenchmarkProfileId[],
): AiBenchmarkDeckSlotResult {
  const runnerDeckRef = deckReferenceLabel(slot.runner);
  const corpDeckRef = deckReferenceLabel(slot.corp);
  if (slot.status !== "runnable") {
    return {
      slotId: slot.slotId,
      label: slot.label,
      slotType: slot.slotType,
      status: slot.status,
      tuningUse: slot.tuningUse,
      runnerDeckRef,
      corpDeckRef,
      reason: slot.pendingReason ?? "Slot ist nicht lauffaehig konfiguriert.",
    };
  }
  const resolved = resolveBenchmarkDeckSlot(slot);
  if (!resolved.ok) {
    return {
      slotId: slot.slotId,
      label: slot.label,
      slotType: slot.slotType,
      status: "disabled",
      tuningUse: slot.tuningUse,
      runnerDeckRef,
      corpDeckRef,
      reason: resolved.reason,
    };
  }
  const slotConfig: AiDoctrineQualityBenchmarkConfig = {
    ...config,
    ...resolved.config,
    comparisonProfiles,
  };
  const supportErrors = validateSimulationDeckSupport(slotConfig);
  if (supportErrors.length > 0) {
    return {
      slotId: slot.slotId,
      label: slot.label,
      slotType: slot.slotType,
      status: "disabled",
      tuningUse: slot.tuningUse,
      runnerDeckRef,
      corpDeckRef,
      reason: supportErrors.join(" | "),
    };
  }
  return {
    slotId: slot.slotId,
    label: slot.label,
    slotType: slot.slotType,
    status: "runnable",
    tuningUse: slot.tuningUse,
    runnerDeckRef,
    corpDeckRef,
    benchmark: runMatchProgressionBenchmark(slotConfig),
  };
}

function resolveBenchmarkDeckSlot(slot: AiBenchmarkDeckSlotDefinition):
  | {
      ok: true;
      config: Partial<
        Pick<
          AiSimulationConfig,
          | "runnerDeckId"
          | "corpDeckId"
          | "runnerDeck"
          | "corpDeck"
          | "runnerDeckMetadata"
          | "corpDeckMetadata"
        >
      >;
    }
  | { ok: false; reason: string } {
  const runner = resolveBenchmarkDeckReference(slot.runner, "runner");
  const corp = resolveBenchmarkDeckReference(slot.corp, "corp");
  if (!runner.ok || !corp.ok) {
    return {
      ok: false,
      reason: [
        ...(!runner.ok ? [runner.reason] : []),
        ...(!corp.ok ? [corp.reason] : []),
      ].join(" | "),
    };
  }
  const resolvedConfig: Partial<
    Pick<
      AiSimulationConfig,
      | "runnerDeckId"
      | "corpDeckId"
      | "runnerDeck"
      | "corpDeck"
      | "runnerDeckMetadata"
      | "corpDeckMetadata"
    >
  > = {};
  if (runner.kind === "runtime_deck_id")
    resolvedConfig.runnerDeckId = runner.deckId as NonNullable<
      AiSimulationConfig["runnerDeckId"]
    >;
  else {
    resolvedConfig.runnerDeck = runner.deck;
    resolvedConfig.runnerDeckMetadata = runner.metadata;
  }
  if (corp.kind === "runtime_deck_id")
    resolvedConfig.corpDeckId = corp.deckId as NonNullable<
      AiSimulationConfig["corpDeckId"]
    >;
  else {
    resolvedConfig.corpDeck = corp.deck;
    resolvedConfig.corpDeckMetadata = corp.metadata;
  }
  return {
    ok: true,
    config: resolvedConfig,
  };
}

function resolveBenchmarkDeckReference(
  reference: AiBenchmarkDeckReference,
  expectedSide: Side,
):
  | { ok: true; kind: "runtime_deck_id"; deckId: string }
  | {
      ok: true;
      kind: "snapshot";
      deck: DeckDefinition;
      metadata: DeckPublicMetadata;
    }
  | {
      ok: true;
      kind: "frozen_local_snapshot";
      deck: DeckDefinition;
      metadata: DeckPublicMetadata;
    }
  | {
      ok: true;
      kind: "local_editable_deck";
      deck: DeckDefinition;
      metadata: DeckPublicMetadata;
    }
  | { ok: false; reason: string } {
  if (reference.kind === "pending_real_scene") {
    return { ok: false, reason: `Pending real scene deck: ${reference.label}` };
  }
  if (reference.kind === "runtime_deck_id") {
    const deck = DEMO_DECKS[reference.deckId as keyof typeof DEMO_DECKS];
    if (!deck)
      return {
        ok: false,
        reason: `Runtime-Deck nicht gefunden: ${reference.deckId}`,
      };
    if (deck.side !== expectedSide)
      return {
        ok: false,
        reason: `Runtime-Deck ${reference.deckId} hat falsche Seite ${deck.side}.`,
      };
    return { ok: true, kind: "runtime_deck_id", deckId: reference.deckId };
  }
  if (reference.kind === "local_editable_deck") {
    const localDeck = benchmarkDeckFromLocalEditableDeck(reference);
    if (!localDeck.ok)
      return {
        ok: false,
        reason: `${reference.expectedName}: ${localDeck.classification}: ${localDeck.reason}`,
      };
    if (localDeck.deck.side !== expectedSide)
      return {
        ok: false,
        reason: `Local Deck-Editor deck ${reference.localDeckId} hat falsche Seite ${localDeck.deck.side}.`,
      };
    return {
      ok: true,
      kind: "local_editable_deck",
      deck: localDeck.deck,
      metadata: localDeck.metadata,
    };
  }
  if (reference.kind === "frozen_local_snapshot") {
    try {
      const snapshot = benchmarkDeckFromFrozenLocalSnapshot(
        reference.snapshotId,
      );
      if (snapshot.deck.side !== expectedSide)
        return {
          ok: false,
          reason: `Frozen local snapshot ${reference.snapshotId} hat falsche Seite ${snapshot.deck.side}.`,
        };
      return {
        ok: true,
        kind: "frozen_local_snapshot",
        deck: snapshot.deck,
        metadata: snapshot.metadata,
      };
    } catch (error) {
      return {
        ok: false,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  }
  try {
    const snapshot = benchmarkDeckFromSnapshot(reference.snapshotId);
    if (snapshot.deck.side !== expectedSide)
      return {
        ok: false,
        reason: `Snapshot ${reference.snapshotId} hat falsche Seite ${snapshot.deck.side}.`,
      };
    return {
      ok: true,
      kind: "snapshot",
      deck: snapshot.deck,
      metadata: snapshot.metadata,
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

function deckReferenceLabel(reference: AiBenchmarkDeckReference): string {
  switch (reference.kind) {
    case "runtime_deck_id":
      return reference.deckId;
    case "snapshot":
      return reference.snapshotId;
    case "frozen_local_snapshot":
      return reference.snapshotId;
    case "local_editable_deck":
      return `${reference.expectedName} (${reference.localDeckId})`;
    case "pending_real_scene":
      return reference.label;
  }
}

export function evaluateDoctrineQualityGate(
  benchmark: AiDoctrineQualityBenchmarkResult,
  thresholds: Partial<AiDoctrineQualityGateThresholds> = {},
): AiDoctrineQualityGateResult {
  const resolved: AiDoctrineQualityGateThresholds = {
    maxCandidateIllegalActions: thresholds.maxCandidateIllegalActions ?? 0,
    maxCandidateReplayFailures: thresholds.maxCandidateReplayFailures ?? 0,
    maxTimeoutRateDelta: thresholds.maxTimeoutRateDelta ?? 0,
    maxFallbackRateDelta: thresholds.maxFallbackRateDelta ?? 0.02,
    maxNakedAgendaInstallDelta: thresholds.maxNakedAgendaInstallDelta ?? 0,
    maxScoreWindowMissedDelta: thresholds.maxScoreWindowMissedDelta ?? 0,
    maxEconomyStallDelta: thresholds.maxEconomyStallDelta ?? 2,
    maxRepeatedLowValueCentralRunDelta:
      thresholds.maxRepeatedLowValueCentralRunDelta ?? 2,
  };
  const hardFailures = [
    ...(benchmark.candidateRun.illegalActions >
    resolved.maxCandidateIllegalActions
      ? [`candidate_illegal_actions:${benchmark.candidateRun.illegalActions}`]
      : []),
    ...(benchmark.candidateRun.replayFailures >
    resolved.maxCandidateReplayFailures
      ? [`candidate_replay_failures:${benchmark.candidateRun.replayFailures}`]
      : []),
    ...(benchmark.safety.timeoutRateDelta > resolved.maxTimeoutRateDelta
      ? [`timeout_rate_delta:${benchmark.safety.timeoutRateDelta}`]
      : []),
    ...(benchmark.safety.fallbackRateDelta > resolved.maxFallbackRateDelta
      ? [`fallback_rate_delta:${benchmark.safety.fallbackRateDelta}`]
      : []),
    ...(benchmark.delta.nakedAgendaInstalls >
    resolved.maxNakedAgendaInstallDelta
      ? [`naked_agenda_install_delta:${benchmark.delta.nakedAgendaInstalls}`]
      : []),
    ...(benchmark.delta.scoreWindowMissed > resolved.maxScoreWindowMissedDelta
      ? [`score_window_missed_delta:${benchmark.delta.scoreWindowMissed}`]
      : []),
    ...(benchmark.delta.economyStall > resolved.maxEconomyStallDelta
      ? [`economy_stall_delta:${benchmark.delta.economyStall}`]
      : []),
    ...(benchmark.delta.repeatedLowValueCentralRun >
    resolved.maxRepeatedLowValueCentralRunDelta
      ? [
          `repeated_low_value_central_run_delta:${benchmark.delta.repeatedLowValueCentralRun}`,
        ]
      : []),
  ];
  const warnings = [
    ...(benchmark.delta.remoteOverbuild > 0
      ? [`remote_overbuild_delta:${benchmark.delta.remoteOverbuild}`]
      : []),
    ...(benchmark.delta.rigStall > 0
      ? [`rig_stall_delta:${benchmark.delta.rigStall}`]
      : []),
    ...(benchmark.delta.assetTrashNeglect > 0
      ? [`asset_trash_neglect_delta:${benchmark.delta.assetTrashNeglect}`]
      : []),
  ];
  return {
    accepted: hardFailures.length === 0,
    thresholds: resolved,
    hardFailures,
    warnings,
  };
}

export function formatDoctrineQualityBenchmarkReport(
  benchmark: AiDoctrineQualityBenchmarkResult,
  gate: AiDoctrineQualityGateResult = evaluateDoctrineQualityGate(benchmark),
): string {
  const doctrineRows = [
    [
      "nakedAgendaInstalls",
      benchmark.baseline.nakedAgendaInstalls,
      benchmark.candidate.nakedAgendaInstalls,
      benchmark.delta.nakedAgendaInstalls,
    ],
    [
      "agendaFloodExposure",
      benchmark.baseline.agendaFloodExposure,
      benchmark.candidate.agendaFloodExposure,
      benchmark.delta.agendaFloodExposure,
    ],
    [
      "scoreWindowMissed",
      benchmark.baseline.scoreWindowMissed,
      benchmark.candidate.scoreWindowMissed,
      benchmark.delta.scoreWindowMissed,
    ],
    [
      "remoteOverbuild",
      benchmark.baseline.remoteOverbuild,
      benchmark.candidate.remoteOverbuild,
      benchmark.delta.remoteOverbuild,
    ],
    [
      "economyStall",
      benchmark.baseline.economyStall,
      benchmark.candidate.economyStall,
      benchmark.delta.economyStall,
    ],
    [
      "repeatedLowValueCentralRun",
      benchmark.baseline.repeatedLowValueCentralRun,
      benchmark.candidate.repeatedLowValueCentralRun,
      benchmark.delta.repeatedLowValueCentralRun,
    ],
    [
      "rigStall",
      benchmark.baseline.rigStall,
      benchmark.candidate.rigStall,
      benchmark.delta.rigStall,
    ],
    [
      "assetTrashNeglect",
      benchmark.baseline.assetTrashNeglect,
      benchmark.candidate.assetTrashNeglect,
      benchmark.delta.assetTrashNeglect,
    ],
  ];
  const safetyRows = [
    ["illegalActionDelta", benchmark.safety.illegalActionDelta],
    ["replayFailureDelta", benchmark.safety.replayFailureDelta],
    ["timeoutRateDelta", benchmark.safety.timeoutRateDelta],
    ["fallbackRateDelta", benchmark.safety.fallbackRateDelta],
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
    ...doctrineRows.map(
      ([metric, baseline, candidate, delta]) =>
        `| ${metric} | ${baseline} | ${candidate} | ${delta} |`,
    ),
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
      : "Der Kandidat verletzt mindestens eine harte Schwelle. Gewichtungs- oder Planänderungen sollten vor weiterer Ausweitung geprüft werden.",
  ].join("\n");
}

export function formatMatchProgressionBenchmarkReport(
  benchmark: AiMatchProgressionBenchmarkResult,
): string {
  const progressionRows: Array<[string, number, number, number]> = [
    [
      "actionLimitRate",
      benchmark.baseline.actionLimitRate,
      benchmark.candidate.actionLimitRate,
      benchmark.delta.actionLimitRate,
    ],
    [
      "averageActions",
      benchmark.baseline.averageActions,
      benchmark.candidate.averageActions,
      benchmark.delta.averageActions,
    ],
    [
      "averageTurns",
      benchmark.baseline.averageTurns,
      benchmark.candidate.averageTurns,
      benchmark.delta.averageTurns,
    ],
    [
      "runnerAgendaPoints",
      benchmark.baseline.runnerAgendaPoints,
      benchmark.candidate.runnerAgendaPoints,
      benchmark.delta.runnerAgendaPoints,
    ],
    [
      "corpAgendaPoints",
      benchmark.baseline.corpAgendaPoints,
      benchmark.candidate.corpAgendaPoints,
      benchmark.delta.corpAgendaPoints,
    ],
    [
      "runnerSteals",
      benchmark.baseline.runnerSteals,
      benchmark.candidate.runnerSteals,
      benchmark.delta.runnerSteals,
    ],
    [
      "corpScores",
      benchmark.baseline.corpScores,
      benchmark.candidate.corpScores,
      benchmark.delta.corpScores,
    ],
    [
      "scoreActionsAvailable",
      benchmark.baseline.scoreActionsAvailable,
      benchmark.candidate.scoreActionsAvailable,
      benchmark.delta.scoreActionsAvailable,
    ],
    [
      "scoreActionsTaken",
      benchmark.baseline.scoreActionsTaken,
      benchmark.candidate.scoreActionsTaken,
      benchmark.delta.scoreActionsTaken,
    ],
    [
      "missedScoreWindows",
      benchmark.baseline.missedScoreWindows,
      benchmark.candidate.missedScoreWindows,
      benchmark.delta.missedScoreWindows,
    ],
    [
      "scoreActionTakeRate",
      benchmark.baseline.scoreActionTakeRate,
      benchmark.candidate.scoreActionTakeRate,
      benchmark.delta.scoreActionTakeRate,
    ],
    [
      "scoreOrStealActions",
      benchmark.baseline.scoreOrStealActions,
      benchmark.candidate.scoreOrStealActions,
      benchmark.delta.scoreOrStealActions,
    ],
    [
      "scoreOrStealActionsPerMatch",
      benchmark.baseline.scoreOrStealActionsPerMatch,
      benchmark.candidate.scoreOrStealActionsPerMatch,
      benchmark.delta.scoreOrStealActionsPerMatch,
    ],
    [
      "advancedAgendaSteals",
      benchmark.baseline.advancedAgendaSteals,
      benchmark.candidate.advancedAgendaSteals,
      benchmark.delta.advancedAgendaSteals,
    ],
    [
      "advancedAgendaStealsFromRemote",
      benchmark.baseline.advancedAgendaStealsFromRemote,
      benchmark.candidate.advancedAgendaStealsFromRemote,
      benchmark.delta.advancedAgendaStealsFromRemote,
    ],
    [
      "advancedAgendaStealsFromCentral",
      benchmark.baseline.advancedAgendaStealsFromCentral,
      benchmark.candidate.advancedAgendaStealsFromCentral,
      benchmark.delta.advancedAgendaStealsFromCentral,
    ],
    [
      "finalAdvanceActions",
      benchmark.baseline.finalAdvanceActions,
      benchmark.candidate.finalAdvanceActions,
      benchmark.delta.finalAdvanceActions,
    ],
    [
      "unsafeFinalAdvanceActions",
      benchmark.baseline.unsafeFinalAdvanceActions,
      benchmark.candidate.unsafeFinalAdvanceActions,
      benchmark.delta.unsafeFinalAdvanceActions,
    ],
    [
      "protectedFinalAdvanceActions",
      benchmark.baseline.protectedFinalAdvanceActions,
      benchmark.candidate.protectedFinalAdvanceActions,
      benchmark.delta.protectedFinalAdvanceActions,
    ],
    [
      "protectBeforeAdvanceActions",
      benchmark.baseline.protectBeforeAdvanceActions,
      benchmark.candidate.protectBeforeAdvanceActions,
      benchmark.delta.protectBeforeAdvanceActions,
    ],
    [
      "advanceThenScoreSameTurn",
      benchmark.baseline.advanceThenScoreSameTurn,
      benchmark.candidate.advanceThenScoreSameTurn,
      benchmark.delta.advanceThenScoreSameTurn,
    ],
    [
      "advanceThenRunnerStealBeforeNextCorpScore",
      benchmark.baseline.advanceThenRunnerStealBeforeNextCorpScore,
      benchmark.candidate.advanceThenRunnerStealBeforeNextCorpScore,
      benchmark.delta.advanceThenRunnerStealBeforeNextCorpScore,
    ],
    [
      "remoteProtectionScoreAtFinalAdvance",
      benchmark.baseline.remoteProtectionScoreAtFinalAdvance,
      benchmark.candidate.remoteProtectionScoreAtFinalAdvance,
      benchmark.delta.remoteProtectionScoreAtFinalAdvance,
    ],
    [
      "runnerContestRiskAtFinalAdvance",
      benchmark.baseline.runnerContestRiskAtFinalAdvance,
      benchmark.candidate.runnerContestRiskAtFinalAdvance,
      benchmark.delta.runnerContestRiskAtFinalAdvance,
    ],
    [
      "centralPressureRuns",
      benchmark.baseline.centralPressureRuns,
      benchmark.candidate.centralPressureRuns,
      benchmark.delta.centralPressureRuns,
    ],
    [
      "hqPressureRuns",
      benchmark.baseline.hqPressureRuns,
      benchmark.candidate.hqPressureRuns,
      benchmark.delta.hqPressureRuns,
    ],
    [
      "rdPressureRuns",
      benchmark.baseline.rdPressureRuns,
      benchmark.candidate.rdPressureRuns,
      benchmark.delta.rdPressureRuns,
    ],
    [
      "archivesPressureRuns",
      benchmark.baseline.archivesPressureRuns,
      benchmark.candidate.archivesPressureRuns,
      benchmark.delta.archivesPressureRuns,
    ],
    [
      "remotePressureRuns",
      benchmark.baseline.remotePressureRuns,
      benchmark.candidate.remotePressureRuns,
      benchmark.delta.remotePressureRuns,
    ],
    [
      "successfulCentralRuns",
      benchmark.baseline.successfulCentralRuns,
      benchmark.candidate.successfulCentralRuns,
      benchmark.delta.successfulCentralRuns,
    ],
    [
      "centralAgendaSteals",
      benchmark.baseline.centralAgendaSteals,
      benchmark.candidate.centralAgendaSteals,
      benchmark.delta.centralAgendaSteals,
    ],
    [
      "centralStealsPerRun",
      benchmark.baseline.centralStealsPerRun,
      benchmark.candidate.centralStealsPerRun,
      benchmark.delta.centralStealsPerRun,
    ],
    [
      "centralRunsWithMultiaccess",
      benchmark.baseline.centralRunsWithMultiaccess,
      benchmark.candidate.centralRunsWithMultiaccess,
      benchmark.delta.centralRunsWithMultiaccess,
    ],
    [
      "hqRunsWithHqInterface",
      benchmark.baseline.hqRunsWithHqInterface,
      benchmark.candidate.hqRunsWithHqInterface,
      benchmark.delta.hqRunsWithHqInterface,
    ],
    [
      "rndRunsWithRndInterface",
      benchmark.baseline.rndRunsWithRndInterface,
      benchmark.candidate.rndRunsWithRndInterface,
      benchmark.delta.rndRunsWithRndInterface,
    ],
    [
      "repeatedLowValueCentralRuns",
      benchmark.baseline.repeatedLowValueCentralRuns,
      benchmark.candidate.repeatedLowValueCentralRuns,
      benchmark.delta.repeatedLowValueCentralRuns,
    ],
    [
      "centralRunStreakWithoutValue",
      benchmark.baseline.centralRunStreakWithoutValue,
      benchmark.candidate.centralRunStreakWithoutValue,
      benchmark.delta.centralRunStreakWithoutValue,
    ],
    [
      "centralCloseoutOpportunities",
      benchmark.baseline.centralCloseoutOpportunities,
      benchmark.candidate.centralCloseoutOpportunities,
      benchmark.delta.centralCloseoutOpportunities,
    ],
    [
      "centralCloseoutRunsTaken",
      benchmark.baseline.centralCloseoutRunsTaken,
      benchmark.candidate.centralCloseoutRunsTaken,
      benchmark.delta.centralCloseoutRunsTaken,
    ],
    [
      "centralCloseoutSuccesses",
      benchmark.baseline.centralCloseoutSuccesses,
      benchmark.candidate.centralCloseoutSuccesses,
      benchmark.delta.centralCloseoutSuccesses,
    ],
    [
      "successfulRemoteRuns",
      benchmark.baseline.successfulRemoteRuns,
      benchmark.candidate.successfulRemoteRuns,
      benchmark.delta.successfulRemoteRuns,
    ],
    [
      "remoteTrashActions",
      benchmark.baseline.remoteTrashActions,
      benchmark.candidate.remoteTrashActions,
      benchmark.delta.remoteTrashActions,
    ],
    [
      "remoteContestActions",
      benchmark.baseline.remoteContestActions,
      benchmark.candidate.remoteContestActions,
      benchmark.delta.remoteContestActions,
    ],
    [
      "pressureTargetSwitches",
      benchmark.baseline.pressureTargetSwitches,
      benchmark.candidate.pressureTargetSwitches,
      benchmark.delta.pressureTargetSwitches,
    ],
    [
      "distinctPressureTargets",
      benchmark.baseline.distinctPressureTargets,
      benchmark.candidate.distinctPressureTargets,
      benchmark.delta.distinctPressureTargets,
    ],
    [
      "remoteInstalls",
      benchmark.baseline.remoteInstalls,
      benchmark.candidate.remoteInstalls,
      benchmark.delta.remoteInstalls,
    ],
    [
      "remoteRootInstalls",
      benchmark.baseline.remoteRootInstalls,
      benchmark.candidate.remoteRootInstalls,
      benchmark.delta.remoteRootInstalls,
    ],
    [
      "remoteIceInstalls",
      benchmark.baseline.remoteIceInstalls,
      benchmark.candidate.remoteIceInstalls,
      benchmark.delta.remoteIceInstalls,
    ],
    [
      "remoteAdvances",
      benchmark.baseline.remoteAdvances,
      benchmark.candidate.remoteAdvances,
      benchmark.delta.remoteAdvances,
    ],
    [
      "advancedAgendaInstalledInRemote",
      benchmark.baseline.advancedAgendaInstalledInRemote,
      benchmark.candidate.advancedAgendaInstalledInRemote,
      benchmark.delta.advancedAgendaInstalledInRemote,
    ],
    [
      "advancementActionsOnAgendas",
      benchmark.baseline.advancementActionsOnAgendas,
      benchmark.candidate.advancementActionsOnAgendas,
      benchmark.delta.advancementActionsOnAgendas,
    ],
    [
      "advancementActionsOnAssets",
      benchmark.baseline.advancementActionsOnAssets,
      benchmark.candidate.advancementActionsOnAssets,
      benchmark.delta.advancementActionsOnAssets,
    ],
    [
      "advancementActionsOnUpgrades",
      benchmark.baseline.advancementActionsOnUpgrades,
      benchmark.candidate.advancementActionsOnUpgrades,
      benchmark.delta.advancementActionsOnUpgrades,
    ],
    [
      "advancementActionsOnUnknown",
      benchmark.baseline.advancementActionsOnUnknown,
      benchmark.candidate.advancementActionsOnUnknown,
      benchmark.delta.advancementActionsOnUnknown,
    ],
    [
      "remoteBuildActions",
      benchmark.baseline.remoteBuildActions,
      benchmark.candidate.remoteBuildActions,
      benchmark.delta.remoteBuildActions,
    ],
    [
      "remoteAdvanceActions",
      benchmark.baseline.remoteAdvanceActions,
      benchmark.candidate.remoteAdvanceActions,
      benchmark.delta.remoteAdvanceActions,
    ],
    [
      "scoreWindowActions",
      benchmark.baseline.scoreWindowActions,
      benchmark.candidate.scoreWindowActions,
      benchmark.delta.scoreWindowActions,
    ],
    [
      "scoringRemoteDevelopmentActions",
      benchmark.baseline.scoringRemoteDevelopmentActions,
      benchmark.candidate.scoringRemoteDevelopmentActions,
      benchmark.delta.scoringRemoteDevelopmentActions,
    ],
    [
      "rezIceDuringRun",
      benchmark.baseline.rezIceDuringRun,
      benchmark.candidate.rezIceDuringRun,
      benchmark.delta.rezIceDuringRun,
    ],
    [
      "scoreWindows",
      benchmark.baseline.scoreWindows,
      benchmark.candidate.scoreWindows,
      benchmark.delta.scoreWindows,
    ],
    [
      "turnsToFirstCorpScore",
      benchmark.baseline.turnsToFirstCorpScore,
      benchmark.candidate.turnsToFirstCorpScore,
      benchmark.delta.turnsToFirstCorpScore,
    ],
    [
      "turnsToFirstAgendaSteal",
      benchmark.baseline.turnsToFirstAgendaSteal,
      benchmark.candidate.turnsToFirstAgendaSteal,
      benchmark.delta.turnsToFirstAgendaSteal,
    ],
    [
      "turnsFromFirstAdvanceToScore",
      benchmark.baseline.turnsFromFirstAdvanceToScore,
      benchmark.candidate.turnsFromFirstAdvanceToScore,
      benchmark.delta.turnsFromFirstAdvanceToScore,
    ],
    [
      "turnsFromFinalAdvanceToScoreOrSteal",
      benchmark.baseline.turnsFromFinalAdvanceToScoreOrSteal,
      benchmark.candidate.turnsFromFinalAdvanceToScoreOrSteal,
      benchmark.delta.turnsFromFinalAdvanceToScoreOrSteal,
    ],
    [
      "runnerDrawActions",
      benchmark.baseline.runnerDrawActions,
      benchmark.candidate.runnerDrawActions,
      benchmark.delta.runnerDrawActions,
    ],
    [
      "runnerDrawActionShare",
      benchmark.baseline.runnerDrawActionShare,
      benchmark.candidate.runnerDrawActionShare,
      benchmark.delta.runnerDrawActionShare,
    ],
    [
      "clickDrawActions",
      benchmark.baseline.clickDrawActions,
      benchmark.candidate.clickDrawActions,
      benchmark.delta.clickDrawActions,
    ],
    [
      "cardEffectDrawActions",
      benchmark.baseline.cardEffectDrawActions,
      benchmark.candidate.cardEffectDrawActions,
      benchmark.delta.cardEffectDrawActions,
    ],
    [
      "drawWhileHoldingPlayableEconomy",
      benchmark.baseline.drawWhileHoldingPlayableEconomy,
      benchmark.candidate.drawWhileHoldingPlayableEconomy,
      benchmark.delta.drawWhileHoldingPlayableEconomy,
    ],
    [
      "drawWhileHoldingInstallableBreaker",
      benchmark.baseline.drawWhileHoldingInstallableBreaker,
      benchmark.candidate.drawWhileHoldingInstallableBreaker,
      benchmark.delta.drawWhileHoldingInstallableBreaker,
    ],
    [
      "drawWhileHoldingRunnablePressureCard",
      benchmark.baseline.drawWhileHoldingRunnablePressureCard,
      benchmark.candidate.drawWhileHoldingRunnablePressureCard,
      benchmark.delta.drawWhileHoldingRunnablePressureCard,
    ],
    [
      "drawWhileRemoteTrashAvailable",
      benchmark.baseline.drawWhileRemoteTrashAvailable,
      benchmark.candidate.drawWhileRemoteTrashAvailable,
      benchmark.delta.drawWhileRemoteTrashAvailable,
    ],
    [
      "drawThenDiscardSameTurn",
      benchmark.baseline.drawThenDiscardSameTurn,
      benchmark.candidate.drawThenDiscardSameTurn,
      benchmark.delta.drawThenDiscardSameTurn,
    ],
    [
      "runnerDuplicateInstallActions",
      benchmark.baseline.runnerDuplicateInstallActions,
      benchmark.candidate.runnerDuplicateInstallActions,
      benchmark.delta.runnerDuplicateInstallActions,
    ],
    [
      "runnerLowValueDuplicateInstallActions",
      benchmark.baseline.runnerLowValueDuplicateInstallActions,
      benchmark.candidate.runnerLowValueDuplicateInstallActions,
      benchmark.delta.runnerLowValueDuplicateInstallActions,
    ],
    [
      "runnerJunkyardBbsDuplicateInstalls",
      benchmark.baseline.runnerJunkyardBbsDuplicateInstalls,
      benchmark.candidate.runnerJunkyardBbsDuplicateInstalls,
      benchmark.delta.runnerJunkyardBbsDuplicateInstalls,
    ],
    [
      "runnerEconomyActionsTaken",
      benchmark.baseline.runnerEconomyActionsTaken,
      benchmark.candidate.runnerEconomyActionsTaken,
      benchmark.delta.runnerEconomyActionsTaken,
    ],
    [
      "runnerRigInstallActions",
      benchmark.baseline.runnerRigInstallActions,
      benchmark.candidate.runnerRigInstallActions,
      benchmark.delta.runnerRigInstallActions,
    ],
    [
      "runnerRemoteTrashOpportunities",
      benchmark.baseline.runnerRemoteTrashOpportunities,
      benchmark.candidate.runnerRemoteTrashOpportunities,
      benchmark.delta.runnerRemoteTrashOpportunities,
    ],
    [
      "runnerRemoteTrashTaken",
      benchmark.baseline.runnerRemoteTrashTaken,
      benchmark.candidate.runnerRemoteTrashTaken,
      benchmark.delta.runnerRemoteTrashTaken,
    ],
    [
      "handUseRate",
      benchmark.baseline.handUseRate,
      benchmark.candidate.handUseRate,
      benchmark.delta.handUseRate,
    ],
  ];
  const safetyRows: Array<[string, number, number, number]> = [
    [
      "illegalActions",
      benchmark.baseline.illegalActions,
      benchmark.candidate.illegalActions,
      benchmark.delta.illegalActions,
    ],
    [
      "replayFailures",
      benchmark.baseline.replayFailures,
      benchmark.candidate.replayFailures,
      benchmark.delta.replayFailures,
    ],
    [
      "fallbackRate",
      benchmark.baseline.fallbackRate,
      benchmark.candidate.fallbackRate,
      benchmark.delta.fallbackRate,
    ],
    [
      "timeoutRate",
      benchmark.baseline.timeoutRate,
      benchmark.candidate.timeoutRate,
      benchmark.delta.timeoutRate,
    ],
  ];
  const profileRows = benchmark.profileComparisons.map(
    ({ profile, metrics }) =>
      [
        profile,
        metrics.actionLimitRate,
        metrics.averageTurns,
        metrics.scoreOrStealActionsPerMatch,
        metrics.remoteInstalls,
        metrics.remoteAdvances,
        metrics.rezIceDuringRun,
        metrics.successfulCentralRuns,
        metrics.successfulRemoteRuns,
        metrics.remoteTrashActions,
        metrics.illegalActions,
        metrics.replayFailures,
      ] as const,
  );
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
    ...progressionRows.map(
      ([metric, baseline, candidate, delta]) =>
        `| ${metric} | ${baseline} | ${candidate} | ${delta} |`,
    ),
    "",
    "## Profile Comparison",
    "",
    "| Profile | Action Limit Rate | Avg Turns | Score/Steal per Match | Remote Installs | Remote Advances | Run-window Rez | Successful Central Runs | Successful Remote Runs | Remote Trash | Illegal Actions | Replay Failures |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...profileRows.map(
      ([
        profile,
        actionLimitRate,
        averageTurns,
        scoreOrStealActionsPerMatch,
        remoteInstalls,
        remoteAdvances,
        rezIceDuringRun,
        successfulCentralRuns,
        successfulRemoteRuns,
        remoteTrashActions,
        illegalActions,
        replayFailures,
      ]) =>
        `| ${profile} | ${actionLimitRate} | ${averageTurns} | ${scoreOrStealActionsPerMatch} | ${remoteInstalls} | ${remoteAdvances} | ${rezIceDuringRun} | ${successfulCentralRuns} | ${successfulRemoteRuns} | ${remoteTrashActions} | ${illegalActions} | ${replayFailures} |`,
    ),
    "",
    "## Safety Metrics",
    "",
    "| Metric | Baseline | Candidate | Delta |",
    "| --- | ---: | ---: | ---: |",
    ...safetyRows.map(
      ([metric, baseline, candidate, delta]) =>
        `| ${metric} | ${baseline} | ${candidate} | ${delta} |`,
    ),
    "",
    "## Interpretation",
    "",
    "This benchmark is diagnostic, not a hard release gate. P1 AI tuning should improve progression without increasing illegal actions, replay failures, timeout rate, or fallback rate.",
  ].join("\n");
}

export function formatMatchProgressionBenchmarkSuiteReport(
  suite: AiMatchProgressionBenchmarkSuiteResult,
): string {
  const runnableRows = suite.slots
    .filter((slot) => slot.status === "runnable" && slot.benchmark)
    .flatMap((slot) =>
      slot.benchmark!.profileComparisons.map(
        ({ profile, metrics }) =>
          [
            slot.slotId,
            slot.slotType,
            slot.tuningUse,
            profile,
            slot.runnerDeckRef,
            slot.corpDeckRef,
            metrics.illegalActions,
            metrics.replayFailures,
            metrics.timeoutRate,
            metrics.actionLimitRate,
            metrics.averageTurns,
            metrics.corpScores,
            metrics.scoreActionsAvailable,
            metrics.scoreActionsTaken,
            metrics.missedScoreWindows,
            metrics.scoreActionTakeRate,
            metrics.runnerSteals,
            metrics.advancedAgendaSteals,
            metrics.advancedAgendaStealsFromRemote,
            metrics.advancedAgendaStealsFromCentral,
            metrics.finalAdvanceActions,
            metrics.unsafeFinalAdvanceActions,
            metrics.protectedFinalAdvanceActions,
            metrics.protectBeforeAdvanceActions,
            metrics.scoreOrStealActionsPerMatch,
            metrics.remoteBuildActions,
            metrics.remoteAdvanceActions,
            metrics.remoteTrashActions,
            metrics.successfulRemoteAccesses,
            metrics.remoteAccessesWithTrashableCards,
            metrics.affordableRelevantRemoteTrashOpportunities,
            metrics.relevantRemoteTrashTaken,
            metrics.relevantRemoteTrashTakeRate,
            metrics.skippedAffordableRelevantRemoteTrash,
            metrics.remoteRunsAgainstAdvancedRemote,
            metrics.skippedAdvancedRemoteContest,
            metrics.centralRunWhileRemoteScoreThreatVisible,
            metrics.runnerDrawActions,
            metrics.runnerDrawActionShare,
            metrics.drawThenDiscardSameTurn,
            metrics.runnerDuplicateInstallActions,
            metrics.runnerLowValueDuplicateInstallActions,
            metrics.runnerJunkyardBbsDuplicateInstalls,
            metrics.runnerEconomyActionsTaken,
            metrics.runnerRigInstallActions,
            metrics.runnerRemoteTrashOpportunities,
            metrics.runnerRemoteTrashTaken,
            metrics.handUseRate,
            metrics.runnerAverageCredits,
            metrics.runnerEndTurnAverageCredits,
            metrics.runnerEndTurnCreditsBelowReserve,
            metrics.runnerTurnsBelowContestReserve,
            metrics.runnerRunsStartedBelowReserve,
            metrics.runnerContestBlockedByCredits,
            metrics.runnerSpendBelowReserveActions,
            metrics.runsStartedAgainstKnownUnaffordablePath,
            metrics.creditsMissingForKnownPath,
            metrics.lowValueUnaffordableRuns,
            metrics.uniqueAdvancedRemoteThreats,
            metrics.contestableAdvancedRemoteThreats,
            metrics.advancedRemoteThreatsContested,
            metrics.advancedRemoteThreatContestRate,
            metrics.skippedContestableAdvancedRemoteThreats,
            metrics.centralRunInsteadOfContestableAdvancedRemote,
            metrics.centralRunInsteadWasJustified,
            metrics.centralRunBurnedRemoteContestReserve,
            metrics.remoteContestBlockedByCredits,
            metrics.remoteContestBlockedByPostRunReserve,
            metrics.remoteRunStartedWithInsufficientPostRunReserve,
            metrics.repeatedCentralRunsWhileSameRemoteThreat,
            metrics.successfulCentralRuns,
            metrics.successfulRemoteRuns,
            metrics.rezIceDuringRun,
          ] as const,
      ),
    );
  const nonRunnableRows = suite.slots.filter(
    (slot) => slot.status !== "runnable",
  );
  const sectionRows = (slotTypes: AiBenchmarkDeckSlotType[]) =>
    runnableRows
      .filter((row) => slotTypes.includes(row[1]))
      .map(formatSuiteMetricRow);
  return [
    "# AI Match Progression Benchmark Suite Report",
    "",
    `Version: ${suite.version}`,
    `Baseline: ${suite.baselineProfile}`,
    `Candidate: ${suite.candidateProfile}`,
    `Comparison profiles: ${suite.comparisonProfiles.join(", ")}`,
    `Seeds: ${suite.seeds.length}`,
    "Gate: diagnostic_only",
    "",
    "## Slot Status",
    "",
    "| Slot | Type | Status | Use | Runner | Corp | Reason |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...suite.slots.map(
      (slot) =>
        `| ${slot.slotId} | ${slot.slotType} | ${slot.status} | ${slot.tuningUse} | ${slot.runnerDeckRef} | ${slot.corpDeckRef} | ${slot.reason ?? "ok"} |`,
    ),
    "",
    "## Demo Smoke",
    "",
    "Demo-Smoke-Decks bleiben Safety-/Regression-Material und sind keine Spielstaerke-Basis.",
    "",
    suiteMetricHeader(),
    ...sectionRows(["smoke"]),
    "",
    "## Snapshot Progression",
    "",
    "Snapshot-Decks sind die interne Progression-Messung fuer Tuning- und Holdout-Signale.",
    "",
    suiteMetricHeader(),
    ...sectionRows(["snapshot_tuning", "snapshot_holdout"]),
    "",
    "## Local Realistic Holdout",
    "",
    "Lokale Deck-Editor-Decks sind Holdout-/Reality-Check-Slots und werden nicht als Tuningbasis behandelt.",
    "",
    suiteMetricHeader(),
    ...sectionRows(["local_realistic_holdout"]),
    "",
    "## Real Scene Holdout",
    "",
    "Echte Szenedecks sind externe Reality-Check-Slots. Sie bleiben pending, bis echte Listen im Projekt vorliegen.",
    "",
    "| Slot | Status | Runner | Corp | Reason |",
    "| --- | --- | --- | --- | --- |",
    ...nonRunnableRows
      .filter((slot) => slot.slotType === "real_scene_holdout")
      .map(
        (slot) =>
          `| ${slot.slotId} | ${slot.status} | ${slot.runnerDeckRef} | ${slot.corpDeckRef} | ${slot.reason ?? "pending"} |`,
      ),
    "",
    "## Metric Notes",
    "",
    "`scoreActionsAvailable` zaehlt Corp-Entscheidungsfenster mit mindestens einer legalen Score-Action. `missedScoreWindows` zaehlt diese Fenster, wenn die Corp nicht scored. `finalAdvanceActions` zaehlt Remote-Agenda-Advances, die eine Agenda auf 0 oder 1 verbleibende Advances bringen. `unsafeFinalAdvanceActions` markiert diese Fenster bei hoher sichtbarer Runner-Contest-Gefahr oder schwachem Schutz. `protectBeforeAdvanceActions` zaehlt Remote-Schutzaktionen vor einer near-final Agenda. `relevantRemoteTrashTakeRate` misst genommene relevante und bezahlbare Remote-Trash-Gelegenheiten. `skippedAdvancedRemoteContest` zaehlt Runner-Fenster mit legaler Advanced-Remote-Run-Gelegenheit, in denen kein solcher Remote-Run gewaehlt wurde. Die `uniqueAdvancedRemoteThreats`-/`contestableAdvancedRemoteThreats`-Metriken deduplizieren diese Bedrohungen pro Match, Turn und Server und trennen echte Contest-Targets von Reserve-/Coverage-Blockern. `runnerDrawActions` zaehlt Click-Draw sowie Draw-/Setup-/Search-Karteneffekte. `drawThenDiscardSameTurn` zaehlt Runner-Draws, denen im selben Runner-Turn ein Discard-Choice folgt. `runnerLowValueDuplicateInstallActions` markiert installierte Zweitkopien mit niedrigem Grenznutzen wie Junkyard BBS. `handUseRate` misst, wie oft der Runner bei sichtbarer Economy-/Breaker-/Pressure-/Remote-Trash-Gelegenheit eine solche Hand-/Board-Aktion statt Draw/Filler nimmt. `runnerEndTurnCreditsBelowReserve`, `runnerRunsStartedBelowReserve` und `runsStartedAgainstKnownUnaffordablePath` messen Cashpool-/Spend-Discipline und bekannte ICE-Pfad-Bezahlbarkeit auf sichtbarer Information. `remoteBuildActions` zaehlt Remote-Installationen plus Run-Fenster-Rez-Aktionen. `remoteAdvanceActions` zaehlt Advances und explizite Advancement-Counter-Zuwaechse auf Remotes.",
  ].join("\n");
}

function suiteMetricHeader(): string {
  return [
    "| Slot | Type | Use | Profile | Runner | Corp | Illegal | Replay Failures | Timeout Rate | Action Limit Rate | Avg Turns | Corp Scores | Score Available | Score Taken | Missed Score | Score Take Rate | Runner Steals | Advanced Steals | Adv Steal Remote | Adv Steal Central | Final Advances | Unsafe Final | Protected Final | Protect Before | Score/Steal per Match | Remote Build | Remote Advances | Remote Trash | Successful Remote Access | Remote Access Trashable | Affordable Relevant Trash Opp | Relevant Trash Taken | Relevant Trash Take Rate | Skipped Relevant Trash | Remote Runs vs Advanced | Skipped Advanced Remote | Central While Remote Threat | Runner Draw | Draw Share | Draw+Discard | Duplicate Installs | Low-Value Dup | Junkyard Dup | Economy Taken | Rig Installs | Remote Trash Opp | Remote Trash Taken | Hand Use Rate | Runner Avg Credits | Runner End Credits | End Below Reserve | Turns Below Reserve | Runs Below Reserve | Contest Blocked Credits | Spend Below Reserve | Known Unaffordable Runs | Avg Missing Path Credits | Low-Value Unaffordable Runs | Unique Advanced Threats | Contestable Threats | Threats Contested | Threat Contest Rate | Skipped Contestable Threats | Central Instead Contestable | Central Justified | Central Burned Reserve | Remote Contest Credit Block | Remote Contest Post-Run Block | Remote Runs Insufficient Reserve | Repeated Central Same Threat | Successful Central | Successful Remote | Run-window Rez |",
    "| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ].join("\n");
}

function formatSuiteMetricRow(row: readonly (string | number)[]): string {
  const [
    slotId,
    slotType,
    tuningUse,
    profile,
    runnerDeckRef,
    corpDeckRef,
    illegalActions,
    replayFailures,
    timeoutRate,
    actionLimitRate,
    averageTurns,
    corpScores,
    scoreActionsAvailable,
    scoreActionsTaken,
    missedScoreWindows,
    scoreActionTakeRate,
    runnerSteals,
    advancedAgendaSteals,
    advancedAgendaStealsFromRemote,
    advancedAgendaStealsFromCentral,
    finalAdvanceActions,
    unsafeFinalAdvanceActions,
    protectedFinalAdvanceActions,
    protectBeforeAdvanceActions,
    scoreOrStealActionsPerMatch,
    remoteBuildActions,
    remoteAdvanceActions,
    remoteTrashActions,
    successfulRemoteAccesses,
    remoteAccessesWithTrashableCards,
    affordableRelevantRemoteTrashOpportunities,
    relevantRemoteTrashTaken,
    relevantRemoteTrashTakeRate,
    skippedAffordableRelevantRemoteTrash,
    remoteRunsAgainstAdvancedRemote,
    skippedAdvancedRemoteContest,
    centralRunWhileRemoteScoreThreatVisible,
    runnerDrawActions,
    runnerDrawActionShare,
    drawThenDiscardSameTurn,
    runnerDuplicateInstallActions,
    runnerLowValueDuplicateInstallActions,
    runnerJunkyardBbsDuplicateInstalls,
    runnerEconomyActionsTaken,
    runnerRigInstallActions,
    runnerRemoteTrashOpportunities,
    runnerRemoteTrashTaken,
    handUseRate,
    runnerAverageCredits,
    runnerEndTurnAverageCredits,
    runnerEndTurnCreditsBelowReserve,
    runnerTurnsBelowContestReserve,
    runnerRunsStartedBelowReserve,
    runnerContestBlockedByCredits,
    runnerSpendBelowReserveActions,
    runsStartedAgainstKnownUnaffordablePath,
    creditsMissingForKnownPath,
    lowValueUnaffordableRuns,
    uniqueAdvancedRemoteThreats,
    contestableAdvancedRemoteThreats,
    advancedRemoteThreatsContested,
    advancedRemoteThreatContestRate,
    skippedContestableAdvancedRemoteThreats,
    centralRunInsteadOfContestableAdvancedRemote,
    centralRunInsteadWasJustified,
    centralRunBurnedRemoteContestReserve,
    remoteContestBlockedByCredits,
    remoteContestBlockedByPostRunReserve,
    remoteRunStartedWithInsufficientPostRunReserve,
    repeatedCentralRunsWhileSameRemoteThreat,
    successfulCentralRuns,
    successfulRemoteRuns,
    rezIceDuringRun,
  ] = row;
  return `| ${slotId} | ${slotType} | ${tuningUse} | ${profile} | ${runnerDeckRef} | ${corpDeckRef} | ${illegalActions} | ${replayFailures} | ${timeoutRate} | ${actionLimitRate} | ${averageTurns} | ${corpScores} | ${scoreActionsAvailable} | ${scoreActionsTaken} | ${missedScoreWindows} | ${scoreActionTakeRate} | ${runnerSteals} | ${advancedAgendaSteals} | ${advancedAgendaStealsFromRemote} | ${advancedAgendaStealsFromCentral} | ${finalAdvanceActions} | ${unsafeFinalAdvanceActions} | ${protectedFinalAdvanceActions} | ${protectBeforeAdvanceActions} | ${scoreOrStealActionsPerMatch} | ${remoteBuildActions} | ${remoteAdvanceActions} | ${remoteTrashActions} | ${successfulRemoteAccesses} | ${remoteAccessesWithTrashableCards} | ${affordableRelevantRemoteTrashOpportunities} | ${relevantRemoteTrashTaken} | ${relevantRemoteTrashTakeRate} | ${skippedAffordableRelevantRemoteTrash} | ${remoteRunsAgainstAdvancedRemote} | ${skippedAdvancedRemoteContest} | ${centralRunWhileRemoteScoreThreatVisible} | ${runnerDrawActions} | ${runnerDrawActionShare} | ${drawThenDiscardSameTurn} | ${runnerDuplicateInstallActions} | ${runnerLowValueDuplicateInstallActions} | ${runnerJunkyardBbsDuplicateInstalls} | ${runnerEconomyActionsTaken} | ${runnerRigInstallActions} | ${runnerRemoteTrashOpportunities} | ${runnerRemoteTrashTaken} | ${handUseRate} | ${runnerAverageCredits} | ${runnerEndTurnAverageCredits} | ${runnerEndTurnCreditsBelowReserve} | ${runnerTurnsBelowContestReserve} | ${runnerRunsStartedBelowReserve} | ${runnerContestBlockedByCredits} | ${runnerSpendBelowReserveActions} | ${runsStartedAgainstKnownUnaffordablePath} | ${creditsMissingForKnownPath} | ${lowValueUnaffordableRuns} | ${uniqueAdvancedRemoteThreats} | ${contestableAdvancedRemoteThreats} | ${advancedRemoteThreatsContested} | ${advancedRemoteThreatContestRate} | ${skippedContestableAdvancedRemoteThreats} | ${centralRunInsteadOfContestableAdvancedRemote} | ${centralRunInsteadWasJustified} | ${centralRunBurnedRemoteContestReserve} | ${remoteContestBlockedByCredits} | ${remoteContestBlockedByPostRunReserve} | ${remoteRunStartedWithInsufficientPostRunReserve} | ${repeatedCentralRunsWhileSameRemoteThreat} | ${successfulCentralRuns} | ${successfulRemoteRuns} | ${rezIceDuringRun} |`;
}

export function analyzeDoctrineQualityCases(
  summaries: AiSimulationSummary[],
  options: { maxExamplesPerMetric?: number } = {},
): AiDoctrineQualityCaseAnalysis {
  const maxExamplesPerMetric = options.maxExamplesPerMetric ?? 3;
  const examples = emptyDoctrineCaseExamples();
  for (const summary of summaries) {
    for (const [actionIndex, entry] of summary.actionSequence.entries()) {
      for (const tag of entry.qualityTags) {
        const metric = doctrineMetricForQualityTag(tag);
        if (!metric || examples[metric].length >= maxExamplesPerMetric)
          continue;
        examples[metric].push(
          doctrineCaseExample(summary.seed, actionIndex, entry, metric),
        );
      }
    }
    collectRepeatedLowValueCentralRunExamples(
      summary,
      examples,
      maxExamplesPerMetric,
    );
  }
  const analysis: AiDoctrineQualityCaseAnalysis = {
    version: "ai-deck-doctrine-case-analysis-v1",
    maxExamplesPerMetric,
    totals: sumDoctrineMetrics(
      summaries.map((summary) => summary.metrics.doctrine),
    ),
    examples,
    redactionSafe: true,
  };
  return {
    ...analysis,
    redactionSafe: isRedactionSafeCaseAnalysis(analysis),
  };
}

export function formatDoctrineQualityCaseAnalysisReport(
  analysis: AiDoctrineQualityCaseAnalysis,
  title = "AI Deck Doctrine Quality Case Analysis",
): string {
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
    ...DOCTRINE_QUALITY_METRICS.map(
      (metric) =>
        `| ${metric} | ${analysis.totals[metric]} | ${analysis.examples[metric].length} |`,
    ),
    "",
    "## Examples",
    "",
  ];
  for (const metric of DOCTRINE_QUALITY_METRICS) {
    lines.push(`### ${metric}`, "");
    const examples = analysis.examples[metric];
    if (examples.length === 0) {
      lines.push("Keine Beispiele im analysierten Lauf.", "");
      continue;
    }
    lines.push(
      "| Seed | Action | Side | Type | Reason | Server | Tags |",
      "| --- | ---: | --- | --- | --- | --- | --- |",
    );
    for (const example of examples) {
      lines.push(
        `| ${example.seed} | ${example.actionIndex} | ${example.side} | ${example.actionType} | ${example.reasonCode} | ${example.targetServerId ?? "none"} | ${example.qualityTags.join(", ")} |`,
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function evaluateV143TuningGate(
  candidate: V143SimulationRunResult,
  baseline: V143SimulationRunResult,
): V143TuningGateResult {
  const holdoutDelta = {
    winRate: round(
      (candidate.winRates.runner ?? 0) - (baseline.winRates.runner ?? 0),
    ),
    fallbackRate: round(candidate.fallbackRate - baseline.fallbackRate),
    timeoutRate: round(
      candidate.timeouts / Math.max(candidate.games, 1) -
        baseline.timeouts / Math.max(baseline.games, 1),
    ),
    illegalActions: candidate.illegalActions - baseline.illegalActions,
    replayFailures: candidate.replayFailures - baseline.replayFailures,
  };
  const hardRegression =
    holdoutDelta.illegalActions > 0 ||
    holdoutDelta.replayFailures > 0 ||
    holdoutDelta.timeoutRate > 0;
  if (hardRegression) {
    return {
      accepted: false,
      holdoutDelta,
      reason: "holdout_regression_on_safety_or_replay",
    };
  }
  const improved =
    holdoutDelta.winRate >= 0 &&
    holdoutDelta.fallbackRate <= 0 &&
    holdoutDelta.timeoutRate <= 0;
  return {
    accepted: improved,
    holdoutDelta,
    reason: improved
      ? "holdout_improved_or_stable"
      : "tradeoff_review_required",
  };
}

export function runV143ExploitRegressionFixtures(
  config: Partial<AiSimulationConfig> = {},
): V143ExploitRegressionResult[] {
  return EXPLOIT_FIXTURES_143.fixtures.map((fixture) => {
    if (fixture.fixtureId === "v143-rnd-repeat-access-freshness") {
      return evaluateV143RndRepeatAccessFreshnessFixture(config);
    }

    const summary = simulateAiGame({
      seed: "v143-exploit-visible-etr",
      runnerDeckId: config.runnerDeckId ?? SOAK_SEEDS_143.league.runnerDeckId,
      corpDeckId: config.corpDeckId ?? SOAK_SEEDS_143.league.corpDeckId,
      agendaPointsToWin:
        config.agendaPointsToWin ?? SOAK_SEEDS_143.league.agendaPointsToWin,
      maxActions: config.maxActions ?? 90,
      runnerControllerMode: "plan_runner_v1_4_1",
      corpControllerMode: "plan_corp_v1_4_0",
      runnerProfileId: "runner-ai-v1.4.1-normal",
      corpProfileId: "corp-ai-v1.4.0-normal",
    });
    const passed = summary.errors.length === 0 && summary.replayOk;
    return {
      fixtureId: fixture.fixtureId,
      passed,
      message: passed ? "ok" : summary.errors.join(" | "),
    };
  });
}

function evaluateV143RndRepeatAccessFreshnessFixture(
  config: Partial<AiSimulationConfig>,
): V143ExploitRegressionResult {
  const fixtureId = "v143-rnd-repeat-access-freshness";
  let state = createGameAfterSetup({
    seed: "v143-exploit-rnd-freshness",
    runnerDeckId: config.runnerDeckId ?? SOAK_SEEDS_143.league.runnerDeckId,
    corpDeckId: config.corpDeckId ?? SOAK_SEEDS_143.league.corpDeckId,
    agendaPointsToWin:
      config.agendaPointsToWin ?? SOAK_SEEDS_143.league.agendaPointsToWin,
  });
  const corpDraw = applyFixtureAction(
    state,
    "corp",
    (action) => action.type === "mandatory_draw",
    "corp_mandatory_draw",
  );
  if (!corpDraw.ok)
    return { fixtureId, passed: false, message: corpDraw.message };
  state = corpDraw.state;
  const corpEndTurn = applyFixtureAction(
    state,
    "corp",
    (action) => action.type === "end_turn",
    "corp_end_turn",
  );
  if (!corpEndTurn.ok)
    return { fixtureId, passed: false, message: corpEndTurn.message };
  state = corpEndTurn.state;
  if (
    state.pendingChoice?.source === "discard_phase" &&
    state.pendingChoice.side === "corp"
  ) {
    const corpDiscard = applyFixtureChoiceFirstOption(
      state,
      "corp",
      "corp_discard_phase",
    );
    if (!corpDiscard.ok)
      return { fixtureId, passed: false, message: corpDiscard.message };
    state = corpDiscard.state;
  }

  const baseInput = buildAiDecisionInput(state, "runner", {
    difficulty: "normal",
    profileId: "runner-ai-v1.4.2-normal",
    decisionId: `${fixtureId}:${state.stateVersion}:runner`,
  });
  const rdRun = baseInput.legalActions.find(
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "rd",
  );
  const gainCredit = baseInput.legalActions.find(
    (action) => action.type === "gain_credit",
  );
  if (!rdRun || !gainCredit) {
    return {
      fixtureId,
      passed: false,
      message: "missing_required_actions:runner_needs_rd_run_and_gain_credit",
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
      redactedKind: "accessed_card",
    },
  };
  const staleInput: AiDecisionInput = {
    ...baseInput,
    legalActions: [rdRun, gainCredit],
    eventTail: [...baseInput.eventTail, syntheticRdAccess],
  };
  const decision = chooseRunnerAction(staleInput);
  const selected = staleInput.legalActions.find(
    (action) => action.actionId === decision.actionId,
  );
  const staleBelief = reconstructBeliefState(staleInput);
  const passed =
    selected?.type === "gain_credit" &&
    decision.reasonCode === "runner.plan.recover_economy" &&
    staleBelief.runnerOpponentModel?.rndTopFreshness.freshness ===
      "stale_known_same_top";
  const selectedType = selected?.type ?? "none";
  return {
    fixtureId,
    passed,
    message: passed
      ? "ok:selected_gain_credit_on_stale_rnd_top"
      : `expected_gain_credit_on_stale_rnd_top:selected_${selectedType}:reason_${decision.reasonCode}`,
  };
}

function applyFixtureAction(
  state: GameState,
  side: Side,
  predicate: (action: LegalAction) => boolean,
  label: string,
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
    idempotencyKey: `${label}:${state.stateVersion}:${legalAction.actionId}`,
  });
  if (!result.ok) {
    return {
      ok: false,
      message: `${label}:${result.error.code}:${result.error.message}`,
    };
  }
  return { ok: true, state: result.state };
}

function selectableChoiceOptions<T extends { selectable?: boolean }>(
  options: T[],
): T[] {
  return options.filter((option) => option.selectable !== false);
}

function applyFixtureChoiceFirstOption(
  state: GameState,
  side: Side,
  label: string,
): { ok: true; state: GameState } | { ok: false; message: string } {
  const pendingChoice = state.pendingChoice;
  if (!pendingChoice || pendingChoice.side !== side)
    return { ok: false, message: `missing_pending_choice:${label}` };
  const optionId = selectableChoiceOptions(pendingChoice.options)[0]?.id;
  if (optionId === undefined || optionId === null)
    return { ok: false, message: `missing_choice_option:${label}` };
  const choiceAction = getLegalActions(state, side).find(
    (action) => action.type === "resolve_choice",
  );
  if (!choiceAction)
    return { ok: false, message: `missing_resolve_choice_action:${label}` };
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: choiceAction.actionId,
    clientKnownStateVersion: state.stateVersion,
    selectedChoices: {
      choiceId: pendingChoice.choiceId,
      selectedOptionIds: [String(optionId)],
    },
    idempotencyKey: `${label}:${state.stateVersion}:${choiceAction.actionId}`,
  });
  if (!result.ok) {
    return {
      ok: false,
      message: `${label}:${result.error.code}:${result.error.message}`,
    };
  }
  return { ok: true, state: result.state };
}

function simulationDeckConfig(
  config: Partial<AiSimulationConfig>,
): Pick<
  AiSimulationConfig,
  | "runnerDeckId"
  | "corpDeckId"
  | "runnerDeck"
  | "corpDeck"
  | "runnerDeckMetadata"
  | "corpDeckMetadata"
> {
  return {
    ...(config.runnerDeck
      ? { runnerDeck: config.runnerDeck }
      : {
          runnerDeckId:
            config.runnerDeckId ?? SOAK_SEEDS_143.league.runnerDeckId,
        }),
    ...(config.corpDeck
      ? { corpDeck: config.corpDeck }
      : { corpDeckId: config.corpDeckId ?? SOAK_SEEDS_143.league.corpDeckId }),
    ...(config.runnerDeckMetadata
      ? { runnerDeckMetadata: config.runnerDeckMetadata }
      : {}),
    ...(config.corpDeckMetadata
      ? { corpDeckMetadata: config.corpDeckMetadata }
      : {}),
  };
}

function runV143Profile(
  profile: SimulationBenchmarkProfile,
  seeds: string[],
  config: V143LeagueConfig,
): V143SimulationRunResult {
  const runnerProfileId = profileIdForMode("runner", profile.runnerMode);
  const corpProfileId = profileIdForMode("corp", profile.corpMode);
  const summaries = seeds.map((seed) =>
    simulateAiGame({
      seed,
      ...simulationDeckConfig(config),
      agendaPointsToWin:
        config.agendaPointsToWin ?? SOAK_SEEDS_143.league.agendaPointsToWin,
      maxActions: config.maxActions ?? SOAK_SEEDS_143.league.maxActions,
      runnerControllerMode: profile.runnerMode,
      corpControllerMode: profile.corpMode,
      ...(runnerProfileId ? { runnerProfileId } : {}),
      ...(corpProfileId ? { corpProfileId } : {}),
      simulationRngSeed: `${seed}:${profile.benchmarkProfileId}:simrng`,
    }),
  );
  const totalActions =
    summaries.reduce((sum, summary) => sum + summary.actions, 0) || 1;
  const timeoutActions = summaries.reduce(
    (sum, summary) =>
      sum +
      summary.actionSequence.filter((action) => action.timeoutUsed).length,
    0,
  );
  const fallbackActions = summaries.reduce(
    (sum, summary) =>
      sum +
      summary.actionSequence.filter((action) => action.fallbackUsed).length,
    0,
  );
  const winCounts = summaries.reduce(
    (counts, summary) => {
      const key = summary.winner;
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    },
    {} as Record<AiSimulationSummary["winner"], number>,
  );
  const exploitRefs =
    profile.benchmarkProfileId === "current_candidate" ||
    profile.benchmarkProfileId === "belief_ai_v1_4_2"
      ? runV143ExploitRegressionFixtures(config)
          .filter((result) => !result.passed)
          .map((result) => result.fixtureId)
      : [];
  return {
    simulationId: `v143:${profile.benchmarkProfileId}:${fnv1a(seeds.join("|"))}`,
    benchmarkProfile: profile.benchmarkProfileId,
    games: summaries.length,
    illegalActions: summaries.reduce(
      (sum, summary) => sum + summary.metrics.illegalActions,
      0,
    ),
    timeouts: timeoutActions,
    fallbackRate: round(fallbackActions / totalActions),
    winRates: {
      runner: round((winCounts.runner ?? 0) / Math.max(summaries.length, 1)),
      corp: round((winCounts.corp ?? 0) / Math.max(summaries.length, 1)),
      draw: round((winCounts.draw ?? 0) / Math.max(summaries.length, 1)),
      action_limit_reached: round(
        (winCounts.action_limit_reached ?? 0) / Math.max(summaries.length, 1),
      ),
    },
    agendaPoints: {
      runner: summaries.reduce(
        (sum, summary) => sum + summary.finalAgendaPoints.runner,
        0,
      ),
      corp: summaries.reduce(
        (sum, summary) => sum + summary.finalAgendaPoints.corp,
        0,
      ),
    },
    averageActions: round(totalActions / Math.max(summaries.length, 1)),
    replayFailures: summaries.filter((summary) => !summary.replayOk).length,
    notableExploitRefs: sortedUnique(exploitRefs),
    summaries,
  };
}

function benchmarkProfileById(
  profileId: SimulationBenchmarkProfileId,
): SimulationBenchmarkProfile {
  const profile = BENCHMARK_PROFILES_143.profiles.find(
    (candidate) => candidate.benchmarkProfileId === profileId,
  );
  if (profile) return profile;
  return {
    benchmarkProfileId: profileId,
    runnerMode: profileId,
    corpMode: profileId,
  };
}

function chooseDecisionForSimulation(
  side: Side,
  input: AiDecisionInput,
  config: AiSimulationConfig,
  simulationRng: SimulationRng,
): AiDecision {
  const mode = controllerModeForSide(side, config);
  switch (mode) {
    case "random_legal_bot":
      return chooseRandomLegalDecision(input, simulationRng);
    case "basic_runner_ai":
      return side === "runner"
        ? chooseRunnerBaselineAction(input)
        : chooseCorpBaselineAction(input);
    case "basic_corp_ai":
      return side === "corp"
        ? chooseCorpBaselineAction(input)
        : chooseRunnerBaselineAction(input);
    case "plan_corp_v1_4_0":
      return side === "corp"
        ? chooseCorpAction(input)
        : chooseRunnerBaselineAction(input);
    case "plan_runner_v1_4_1":
      return side === "runner"
        ? chooseRunnerAction(input)
        : chooseCorpBaselineAction(input);
    case "belief_ai_v1_4_2":
      return chooseAiAction(input);
    case "current_candidate":
      return chooseAiAction(input);
  }
}

function controllerModeForSide(
  side: Side,
  config: AiSimulationConfig,
): SimulationControllerMode {
  return side === "runner"
    ? (config.runnerControllerMode ?? "current_candidate")
    : (config.corpControllerMode ?? "current_candidate");
}

function deckSnapshotForSimulation(
  deck: DeckDefinition,
  publicMetadata?: DeckPublicMetadata,
): AiDeckDoctrineDeckSnapshot {
  return {
    deckSnapshotId: `${deck.id}:simulation`,
    side: deck.side,
    ...(publicMetadata?.formatProfileId
      ? { formatProfileId: publicMetadata.formatProfileId }
      : {}),
    ...(publicMetadata ? { publicMetadata } : {}),
    cards: deck.cards.map((card) => ({
      cardId: card.id,
      quantity: card.quantity,
    })),
  };
}

function chooseRandomLegalDecision(
  input: AiDecisionInput,
  simulationRng: SimulationRng,
): AiDecision {
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
      confidence: 0,
    };
  }
  const index = simulationRng.nextInt(legalActions.length);
  const selected = legalActions[index] ?? fallback;
  const selectedChoices = selectedChoicesForDecision(input, selected);
  return {
    actionId: selected.actionId,
    ...(selectedChoices ? { selectedChoices } : {}),
    reasonCode: "simulation.random_legal_bot",
    explanation:
      "Deterministisch pseudozufaellige legale Aktion fuer Benchmark.",
    consideredActionIds: legalActions.map((action) => action.actionId),
    fallbackUsed: false,
    timeoutUsed: false,
    confidence: 0.35,
    evidence: [`mode:random_legal_bot`, `rng_counter:${simulationRng.counter}`],
  };
}

function profileIdForMode(side: Side, mode: SimulationControllerMode): string {
  switch (mode) {
    case "plan_corp_v1_4_0":
      return side === "corp"
        ? "corp-ai-v1.4.0-normal"
        : "runner-ai-v0.9-normal";
    case "plan_runner_v1_4_1":
      return side === "runner"
        ? "runner-ai-v1.4.1-normal"
        : "corp-ai-v0.9-normal";
    case "belief_ai_v1_4_2":
      return side === "runner"
        ? "runner-ai-v1.4.2-normal"
        : "corp-ai-v1.4.2-normal";
    case "basic_runner_ai":
      return side === "runner"
        ? "runner-ai-v0.9-normal"
        : "corp-ai-v0.9-normal";
    case "basic_corp_ai":
      return side === "corp" ? "corp-ai-v0.9-normal" : "runner-ai-v0.9-normal";
    case "random_legal_bot":
      return side === "runner"
        ? "runner-ai-v0.9-normal"
        : "corp-ai-v0.9-normal";
    case "current_candidate":
      return side === "runner"
        ? "runner-ai-v1.4.2-normal"
        : "corp-ai-v1.4.2-normal";
  }
}

function validateSimulationDeckSupport(config: AiSimulationConfig): string[] {
  const errors: string[] = [];
  for (const deck of [config.runnerDeck, config.corpDeck]) {
    if (!deck) continue;
    for (const entry of deck.cards) {
      const definition = DEMO_CARDS_BY_ID[entry.id];
      if (!definition) {
        errors.push(
          `Simulation blockiert: Karte ${entry.id} ist nicht im Runtime-Katalog.`,
        );
        continue;
      }
      if (definition.implementationStatus !== "playable_mvp") {
        errors.push(
          `Simulation blockiert: Karte ${entry.id} ist nicht als playable_mvp freigegeben.`,
        );
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
    },
  };
  return rng;
}

function decisionFromChoices(
  input: AiDecisionInput,
  choices: RankedChoice[],
): AiDecision {
  const consideredActionIds = input.legalActions
    .map((action) => action.actionId)
    .sort();
  const beliefSummary = beliefDebugSummary(reconstructBeliefState(input));
  const opponentModel =
    input.side === "runner"
      ? toRecord(beliefSummary.runnerOpponentModel)
      : toRecord(beliefSummary.corpOpponentModel);
  const decisionDebug = {
    schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
    aiLevel: 1,
    memoryVersion: String(beliefSummary.memoryVersion ?? ""),
    facts: toStringArray(beliefSummary.facts),
    hypotheses: toStringArray(beliefSummary.hypotheses),
    uncertainty: toStringArray(beliefSummary.uncertainty),
    invalidations: toStringArray(beliefSummary.invalidations),
    ...(input.ownDeckDoctrine
      ? { ownDeckDoctrine: deckDoctrineDebug(input.ownDeckDoctrine) }
      : {}),
    ...(opponentModel ? { opponentModel } : {}),
  } satisfies AiDecisionDebug;
  const choice = choices
    .filter((candidate) => candidate.action && candidate.score > 200)
    .sort(
      (left, right) =>
        right.score - left.score || compareAction(left.action!, right.action!),
    )[0];
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
      ...(choice.confidence !== undefined
        ? { confidence: choice.confidence }
        : {}),
      reason: choice.reasonCode,
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
      reason: "fallback.no_legal_action",
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
    reason: "fallback.first_legal_action",
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

function selectedChoicesForDecision(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecision["selectedChoices"] | undefined {
  const choice = input.playerView.pendingChoice;
  if (action.type !== "resolve_choice" || !choice) return undefined;
  const selectableOptions = selectableChoiceOptions(choice.options);
  if (choice.source === "setup.mulligan") {
    const opening =
      input.side === "corp"
        ? evaluateCorpOpeningHand(input)
        : evaluateRunnerOpeningHand(input);
    const selected =
      choice.options.find((option) => option.id === opening.decision) ??
      choice.options[0];
    return selected
      ? { choiceId: choice.choiceId, selectedOptionIds: [selected.id] }
      : { choiceId: choice.choiceId, selectedOptionIds: [] };
  }
  if (choice.kind === "select_cards" && choice.source === "discard_phase") {
    const selected = selectedDiscardChoiceOptionIds(
      input,
      choice,
      selectableOptions,
    );
    return { choiceId: choice.choiceId, selectedOptionIds: selected };
  }
  if (
    choice.kind === "select_cards" &&
    choice.source.startsWith("v1912.shell_traders_start_turn")
  ) {
    const selected =
      choice.options.slice().sort((left, right) => {
        const leftCounter = Number(
          /\((\d+)\)\s*$/.exec(left.label)?.[1] ?? Number.MAX_SAFE_INTEGER,
        );
        const rightCounter = Number(
          /\((\d+)\)\s*$/.exec(right.label)?.[1] ?? Number.MAX_SAFE_INTEGER,
        );
        const leftProgramBias = left.card?.type === "program" ? -1 : 0;
        const rightProgramBias = right.card?.type === "program" ? -1 : 0;
        return (
          leftCounter - rightCounter ||
          leftProgramBias - rightProgramBias ||
          left.label.localeCompare(right.label, "de")
        );
      })[0] ?? choice.options[0];
    return selected
      ? { choiceId: choice.choiceId, selectedOptionIds: [selected.id] }
      : { choiceId: choice.choiceId, selectedOptionIds: [] };
  }
  if (
    choice.kind === "select_cards" &&
    choice.source.startsWith("runner_program_trash_before_install")
  ) {
    return {
      choiceId: choice.choiceId,
      selectedOptionIds: selectedRunnerProgramInstallTrashOptionIds(
        input,
        choice,
        selectableOptions,
      ),
    };
  }
  if (
    input.side === "corp" &&
    (choice.source.startsWith("p3_34.distribute_advancement") ||
      choice.source.startsWith("v1919.systematic_layoffs_advancement"))
  ) {
    const selected = selectedCorpAdvancementCounterChoiceOptionId(
      input,
      selectableOptions,
    );
    return {
      choiceId: choice.choiceId,
      selectedOptionIds: selected ? [selected] : [],
    };
  }
  if (choice.kind === "select_cards") {
    const searchSelected = selectedSearchChoiceOptionIds(
      input,
      choice,
      selectableOptions,
    );
    if (searchSelected)
      return { choiceId: choice.choiceId, selectedOptionIds: searchSelected };
    const count = Math.max(
      choice.minSelections,
      Math.min(choice.maxSelections, choice.maxSelections),
    );
    const selected = selectableOptions
      .slice(0, count)
      .map((option) => option.id);
    return { choiceId: choice.choiceId, selectedOptionIds: selected };
  }
  if (choice.source.startsWith("v1921.playful_ai")) {
    const selected =
      choice.options.slice().sort((left, right) => {
        const leftValue = playfulAiGainValue(left);
        const rightValue = playfulAiGainValue(right);
        return rightValue - leftValue || left.id.localeCompare(right.id);
      })[0] ?? choice.options[0];
    return selected
      ? { choiceId: choice.choiceId, selectedOptionIds: [selected.id] }
      : { choiceId: choice.choiceId, selectedOptionIds: [] };
  }
  if (choice.source.startsWith("trace_post_bid_link")) {
    const selected =
      choice.options
        .filter((option) => option.id.startsWith("trace_link_"))
        .sort((left, right) => {
          const leftDelta = Number(/\+(\d+)\s+Link/.exec(left.label)?.[1] ?? 0);
          const rightDelta = Number(
            /\+(\d+)\s+Link/.exec(right.label)?.[1] ?? 0,
          );
          return (
            rightDelta - leftDelta ||
            left.label.localeCompare(right.label, "de")
          );
        })[0] ??
      choice.options.find((option) => option.id === "pass") ??
      choice.options[0];
    return selected
      ? { choiceId: choice.choiceId, selectedOptionIds: [selected.id] }
      : { choiceId: choice.choiceId, selectedOptionIds: [] };
  }
  if (choice.kind !== "bid_amount") {
    const firstOption = selectableOptions[0];
    return firstOption
      ? { choiceId: choice.choiceId, selectedOptionIds: [firstOption.id] }
      : { choiceId: choice.choiceId, selectedOptionIds: [] };
  }

  const bidOptions = choice.options
    .map((option) => ({
      id: option.id,
      amount: typeof option.value === "number" ? option.value : Number.NaN,
    }))
    .filter((option) => Number.isInteger(option.amount) && option.amount >= 0)
    .sort((left, right) => left.amount - right.amount);
  const maxBid = bidOptions.at(-1)?.amount ?? 0;
  let desired = 0;
  if (input.side === "corp") {
    desired =
      input.difficulty === "hard"
        ? Math.min(2, maxBid)
        : input.difficulty === "normal"
          ? Math.min(1, maxBid)
          : 0;
  } else {
    const traceContext = latestTraceContext(input);
    const tieBid = Math.max(
      0,
      (traceContext.traceStrength ?? 0) - (traceContext.runnerLink ?? 0),
    );
    desired = input.difficulty === "easy" ? 0 : Math.min(maxBid, tieBid);
  }
  const selected =
    bidOptions.find((option) => option.amount === desired) ?? bidOptions[0];
  return selected
    ? { choiceId: choice.choiceId, selectedOptionIds: [selected.id] }
    : { choiceId: choice.choiceId, selectedOptionIds: [] };
}

function selectedRunnerProgramInstallTrashOptionIds(
  input: AiDecisionInput,
  choice: NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>,
  selectableOptions: NonNullable<
    AiDecisionInput["playerView"]["pendingChoice"]
  >["options"],
): string[] {
  const assessment = runnerProgramInstallTrashAssessment(
    input,
    choice,
    selectableOptions,
  );
  if (!assessment.memoryRequired) return [];
  if (assessment.requiredMemoryToFree <= 0) return [];
  const selected: string[] = [];
  let memoryFreed = 0;
  for (const candidate of assessment.candidates) {
    if (candidate.protectedRole) continue;
    selected.push(candidate.option.id);
    memoryFreed += candidate.memoryCost;
    if (memoryFreed >= assessment.requiredMemoryToFree) break;
  }
  return memoryFreed >= assessment.requiredMemoryToFree ? selected : [];
}

function selectedCorpAdvancementCounterChoiceOptionId(
  input: AiDecisionInput,
  selectableOptions: NonNullable<
    AiDecisionInput["playerView"]["pendingChoice"]
  >["options"],
): string | undefined {
  return selectableOptions
    .map((option) => ({
      option,
      score: corpAdvancementCounterChoiceScore(input, option.value),
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.option.id.localeCompare(right.option.id, "de"),
    )[0]?.option.id;
}

function corpAdvancementCounterChoiceScore(
  input: AiDecisionInput,
  value: string | number | boolean | undefined,
): number {
  if (typeof value !== "string") return 0;
  const placements = value
    .split("|")
    .map((part) => {
      const [cardId, amountRaw] = part.split(":");
      const amount = Number(amountRaw);
      return cardId && Number.isFinite(amount) && amount > 0
        ? { cardId, amount }
        : undefined;
    })
    .filter((entry): entry is { cardId: string; amount: number } =>
      Boolean(entry),
    );
  return placements.reduce((sum, placement) => {
    const located = findVisibleCorpServerCard(input, placement.cardId);
    if (!located) return sum;
    const definitionId = located.card.definitionId;
    const definition = definitionId
      ? DEMO_CARDS_BY_ID[definitionId]
      : undefined;
    const runtime = definitionId ? RUNTIME_CARDS[definitionId] : undefined;
    const isAgenda =
      definition?.type === "agenda" || runtime?.type === "agenda";
    const requirement =
      located.card.advancementRequirement ??
      definition?.advancementRequirement ??
      runtime?.numeric.advancementRequirement ??
      0;
    const countersAfter =
      (located.card.advancementCounters ?? 0) + placement.amount;
    const remaining = Math.max(0, requirement - countersAfter);
    const serverIce = located.server.ice.length;
    const rezzedIce = located.server.ice.filter(
      (ice) => ice.rezzed === true,
    ).length;
    return (
      sum +
      placement.amount * 12 +
      (isAgenda ? 90 : 20) +
      (remaining === 0 ? 80 : remaining <= 2 ? 35 : 0) +
      Math.min(serverIce, 3) * 18 +
      rezzedIce * 12
    );
  }, 0);
}

function runnerProgramInstallTrashAssessment(
  input: AiDecisionInput,
  choice: NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>,
  selectableOptions: NonNullable<
    AiDecisionInput["playerView"]["pendingChoice"]
  >["options"],
): {
  memoryRequired: boolean;
  requiredMemoryToFree: number;
  candidates: Array<{
    option: (typeof selectableOptions)[number];
    card?: VisibleCard;
    memoryCost: number;
    protectedRole: boolean;
    score: number;
  }>;
  evidence: string[];
} {
  const sourceCardId = choice.source.split(":")[1] ?? "";
  const source = input.playerView.own.gripOrHq.find(
    (card) => card.instanceId === sourceCardId,
  );
  const memoryUsed = Math.max(
    0,
    Math.floor(input.playerView.own.memoryUsed ?? 0),
  );
  const memoryLimit = Math.max(
    0,
    Math.floor(input.playerView.own.memoryLimit ?? 0),
  );
  const sourceMemoryCost = Math.max(0, Math.floor(source?.memoryCost ?? 0));
  const requiredMemoryToFree = Math.max(
    0,
    memoryUsed + sourceMemoryCost - memoryLimit,
  );
  const installedCards = visibleCardsByInstanceIdForAi(input.playerView);
  const installedBreakerRoleCounts = visibleBreakerRoleCountsForAi(
    input.playerView.own.rig ?? [],
  );
  const candidates = selectableOptions
    .map((option) => {
      const card =
        typeof option.value === "string"
          ? installedCards.get(option.value)
          : undefined;
      const memoryCost = Math.max(0, Math.floor(card?.memoryCost ?? 0));
      const icebreaker = card ? isVisibleIcebreakerProgram(card) : false;
      const protectedRole = Boolean(
        card &&
        icebreaker &&
        visibleBreakerRolesForAi(card).some(
          (role) => installedBreakerRoleCounts.get(role) === 1,
        ),
      );
      const counterPenalty =
        card && (card.counters || card.counterDisplays?.length) ? 35 : 0;
      const rolePenalty = icebreaker ? 90 : 0;
      const score =
        memoryCost * 20 -
        rolePenalty -
        counterPenalty -
        (protectedRole ? 1000 : 0);
      return {
        option,
        ...(card ? { card } : {}),
        memoryCost,
        protectedRole,
        score,
      };
    })
    .filter((candidate) => candidate.memoryCost > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.memoryCost - left.memoryCost ||
        left.option.label.localeCompare(right.option.label, "de"),
    );
  return {
    memoryRequired: requiredMemoryToFree > 0,
    requiredMemoryToFree,
    candidates,
    evidence: [
      "choice_source:runner_program_trash_before_install",
      `memory_required:${requiredMemoryToFree}`,
      `trash_candidates:${candidates.length}`,
      `protected_icebreakers:${candidates.filter((candidate) => candidate.protectedRole).length}`,
    ],
  };
}

function visibleCardsByInstanceIdForAi(
  view: PlayerView,
): Map<string, VisibleCard> {
  const cards = [
    view.own.identity,
    ...view.own.gripOrHq,
    ...view.own.heapOrArchives,
    ...view.own.scoreArea,
    ...(view.own.rig ?? []),
    view.opponent.identity,
    ...view.opponent.scoreArea,
    ...(view.opponent.rig ?? []),
    ...(view.opponent.discardCards ?? []),
    ...view.servers.flatMap((server) => [...server.ice, ...server.root]),
  ];
  return new Map(cards.map((card) => [card.instanceId, card]));
}

function isVisibleIcebreakerProgram(card: VisibleCard): boolean {
  return (
    card.known === true &&
    card.type === "program" &&
    visibleBreakerRolesForAi(card).length > 0
  );
}

function visibleBreakerRoleCountsForAi(
  cards: VisibleCard[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const card of cards) {
    for (const role of visibleBreakerRolesForAi(card))
      counts.set(role, (counts.get(role) ?? 0) + 1);
  }
  return counts;
}

function visibleBreakerRolesForAi(card: VisibleCard): string[] {
  const subtypes = (card.subtypes ?? []).map((subtype) =>
    subtype.toLowerCase(),
  );
  const roles = new Set<string>();
  if (subtypes.includes("fracter") || card.definitionId === "simple_fracter")
    roles.add("fracter");
  if (subtypes.includes("decoder") || card.definitionId === "simple_decoder")
    roles.add("decoder");
  if (subtypes.includes("killer") || card.definitionId === "simple_killer")
    roles.add("killer");
  if (subtypes.includes("icebreaker") && roles.size === 0)
    roles.add("icebreaker");
  return [...roles].sort();
}

function selectedDiscardChoiceOptionIds(
  input: AiDecisionInput,
  choice: NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>,
  selectableOptions: NonNullable<
    AiDecisionInput["playerView"]["pendingChoice"]
  >["options"],
): string[] {
  const count = boundedSelectionCount(
    choice.minSelections,
    choice.maxSelections,
    selectableOptions.length,
  );
  if (count <= 0) return [];
  const handByInstanceId = new Map(
    input.playerView.own.gripOrHq
      .filter((card) => card.known)
      .map((card) => [card.instanceId, card]),
  );
  const scored = selectableOptions.map((option) => {
    const instanceId = discardOptionInstanceId(option);
    const card = instanceId ? handByInstanceId.get(instanceId) : undefined;
    if (!card || !card.definitionId) return undefined;
    return { option, score: discardKeepScore(input, card) };
  });
  if (scored.some((entry) => !entry))
    return stableDiscardChoiceOptionIds(selectableOptions, count);
  return scored
    .filter(
      (
        entry,
      ): entry is {
        option: (typeof selectableOptions)[number];
        score: DiscardCandidateScore;
      } => Boolean(entry),
    )
    .sort(
      (left, right) =>
        left.score.total - right.score.total ||
        left.option.label.localeCompare(right.option.label, "de") ||
        left.option.id.localeCompare(right.option.id),
    )
    .slice(0, count)
    .map((entry) => entry.option.id);
}

function stableDiscardChoiceOptionIds(
  selectableOptions: NonNullable<
    AiDecisionInput["playerView"]["pendingChoice"]
  >["options"],
  count: number,
): string[] {
  return selectableOptions
    .slice()
    .sort(
      (left, right) =>
        left.label.localeCompare(right.label, "de") ||
        left.id.localeCompare(right.id),
    )
    .slice(0, count)
    .map((option) => option.id);
}

function discardOptionInstanceId(
  option: NonNullable<
    AiDecisionInput["playerView"]["pendingChoice"]
  >["options"][number],
): string | undefined {
  if (typeof option.value === "string") return option.value;
  if (option.card?.instanceId) return option.card.instanceId;
  return option.id.startsWith("card_")
    ? option.id.slice("card_".length)
    : undefined;
}

function discardKeepScore(
  input: AiDecisionInput,
  card: NonNullable<
    AiDecisionInput["playerView"]["pendingChoice"]
  >["options"][number]["card"],
): DiscardCandidateScore {
  if (!card?.definitionId) {
    return {
      total: 0,
      baseValue: 0,
      planFit: 0,
      doctrineFit: 0,
      evidence: ["discard_score:base"],
    };
  }
  const roles = discardRolesForCardId(card.definitionId);
  const type = card.type ?? DEMO_CARDS_BY_ID[card.definitionId]?.type;
  const cost = discardVisibleCardCost(card);
  const duplicateCount = input.playerView.own.gripOrHq.filter(
    (candidate) => candidate.definitionId === card.definitionId,
  ).length;
  let baseValue = 100;

  if (input.side === "corp") {
    if (type === "agenda") baseValue += 330;
    if (
      type === "ice" ||
      card.definitionId.includes("_ice") ||
      roles.some((role) => role.endsWith("_ice") || role === "etr_ice")
    )
      baseValue += 320;
    const economyRole =
      roles.some((role) => role.includes("economy")) ||
      card.definitionId.includes("economy");
    if (type === "operation") baseValue += economyRole ? 120 : 40;
    if (economyRole) baseValue += input.playerView.own.credits < 5 ? 135 : 55;
    if (roles.some((role) => role.includes("score") || role.includes("remote")))
      baseValue += 70;
  } else {
    if (roles.some((role) => role.startsWith("breaker_"))) {
      const installedSameBreakerRole = roles.some(
        (role) =>
          role.startsWith("breaker_") &&
          (input.playerView.own.rig ?? []).some((rigCard) =>
            discardRolesForCardId(rigCard.definitionId).includes(role),
          ),
      );
      baseValue += installedSameBreakerRole ? 95 : 210;
    }
    if (roles.some((role) => role.includes("economy") || role === "tempo"))
      baseValue += input.playerView.own.credits < 4 ? 170 : 65;
    if (
      roles.includes("memory") ||
      roles.includes("setup") ||
      roles.includes("build_rig")
    )
      baseValue += 80;
    if (roles.includes("draw")) baseValue += 55;
    if (roles.includes("run_pressure"))
      baseValue += input.playerView.own.credits < 4 ? 20 : 90;
  }

  if (
    input.legalActions.some(
      (action) =>
        action.source === card.instanceId && action.type !== "resolve_choice",
    )
  )
    baseValue += 90;
  if (duplicateCount > 1 && type !== "agenda")
    baseValue -= 75 * (duplicateCount - 1);
  if (cost > input.playerView.own.credits + 3 && type !== "agenda")
    baseValue -= 70;
  if (roles.length === 0 && type !== "agenda") baseValue -= 60;

  const planFit = discardPlanFitBonus(input, roles, type);
  const doctrineFit = discardDoctrineFitBonus(input, roles, type, cost);
  return {
    total: baseValue + planFit + doctrineFit,
    baseValue,
    planFit,
    doctrineFit,
    evidence: sortedUnique([
      "discard_score:base",
      ...(planFit > 0 ? ["discard_score:planfit"] : []),
      ...(doctrineFit > 0 ? ["discard_score:doctrinefit"] : []),
    ]),
  };
}

function discardPlanFitBonus(
  input: AiDecisionInput,
  roles: string[],
  type: string | undefined,
): number {
  const plan = discardCurrentPlanKind(input);
  const doctrineWeight = plan
    ? Math.max(
        0,
        Math.min(
          15,
          Math.round((input.ownDeckDoctrine?.planWeights[plan] ?? 0) / 2),
        ),
      )
    : 0;
  let bonus = doctrineWeight;

  if (input.side === "runner") {
    if (
      plan === "build_rig" &&
      discardRolesMatch(roles, [
        "breaker_",
        "memory",
        "setup",
        "build_rig",
        "runner_program",
      ])
    )
      bonus += 42;
    if (
      plan === "recover_economy" &&
      discardRolesMatch(roles, ["economy", "tempo"])
    )
      bonus += 42;
    if (
      (plan === "pressure_hq" ||
        plan === "pressure_rnd" ||
        plan === "contest_remote") &&
      discardRolesMatch(roles, [
        "run_pressure",
        plan,
        "multiaccess",
        "breaker_",
        "economy",
      ])
    )
      bonus += 36;
    if (
      plan === "draw_for_answers" &&
      discardRolesMatch(roles, ["draw", "setup", "breaker_"])
    )
      bonus += 30;
  } else {
    if (
      (plan === "score_now" ||
        plan === "score_next_turn" ||
        plan === "build_scoring_remote") &&
      (type === "agenda" ||
        discardRolesMatch(roles, [
          "score",
          "remote",
          "advance",
          "economy",
          "ice",
        ]))
    )
      bonus += 42;
    if (
      (plan === "protect_hq" || plan === "protect_rnd") &&
      discardRolesMatch(roles, [
        "ice",
        "etr_ice",
        "taxing_ice",
        "corp_rez_ice",
        "corp_install_ice",
      ])
    )
      bonus += 38;
    if (plan === "recover_economy" && discardRolesMatch(roles, ["economy"]))
      bonus += 42;
    if (
      plan === "bait_runner" &&
      discardRolesMatch(roles, ["asset", "upgrade", "remote_support"])
    )
      bonus += 24;
  }

  return Math.max(0, Math.min(55, bonus));
}

function discardDoctrineFitBonus(
  input: AiDecisionInput,
  roles: string[],
  type: string | undefined,
  cost: number,
): number {
  const tags = input.ownDeckDoctrine?.archetypeTags ?? [];
  let bonus = 0;
  if (input.side === "runner") {
    if (
      tags.includes("rig_builder") &&
      discardRolesMatch(roles, [
        "breaker_",
        "memory",
        "setup",
        "build_rig",
        "runner_program",
      ])
    )
      bonus += 30;
    if (
      tags.includes("hq_pressure") &&
      discardRolesMatch(roles, [
        "pressure_hq",
        "run_pressure",
        "multiaccess",
        "breaker_",
        "economy",
      ])
    )
      bonus += 26;
    if (
      tags.includes("rnd_pressure") &&
      discardRolesMatch(roles, [
        "pressure_rnd",
        "run_pressure",
        "multiaccess",
        "breaker_",
        "economy",
      ])
    )
      bonus += 26;
    if (
      tags.includes("economy_dense") &&
      discardRolesMatch(roles, ["economy", "tempo"])
    )
      bonus += 24;
  } else {
    if (
      tags.includes("glacier") &&
      (type === "ice" ||
        discardRolesMatch(roles, [
          "ice",
          "etr_ice",
          "taxing_ice",
          "remote",
          "economy",
        ]))
    )
      bonus += 30;
    if (
      tags.includes("rush") &&
      (type === "agenda" ||
        cost <= 3 ||
        discardRolesMatch(roles, ["score", "ice", "tempo", "advance"]))
    )
      bonus += 24;
    if (
      tags.includes("asset_remote") &&
      (type === "asset" ||
        type === "upgrade" ||
        discardRolesMatch(roles, ["asset", "upgrade", "remote", "economy"]))
    )
      bonus += 26;
  }
  return Math.max(0, Math.min(35, bonus));
}

function discardCurrentPlanKind(input: AiDecisionInput): string | undefined {
  const hand = input.playerView.own.gripOrHq;
  if (input.side === "runner") {
    if (input.playerView.own.credits < 4) return "recover_economy";
    const hasInstalledBreaker = (input.playerView.own.rig ?? []).some((card) =>
      discardRolesForCardId(card.definitionId).some((role) =>
        role.startsWith("breaker_"),
      ),
    );
    if (
      !hasInstalledBreaker &&
      hand.some((card) =>
        discardRolesForCardId(card.definitionId).some(
          (role) =>
            role.startsWith("breaker_") ||
            role === "memory" ||
            role === "setup",
        ),
      )
    )
      return "build_rig";
  } else {
    const hasAgenda = hand.some(
      (card) =>
        (card.type ??
          (card.definitionId
            ? DEMO_CARDS_BY_ID[card.definitionId]?.type
            : undefined)) === "agenda",
    );
    const hasRemoteSupport = hand.some((card) => {
      const roles = discardRolesForCardId(card.definitionId);
      const type =
        card.type ??
        (card.definitionId
          ? DEMO_CARDS_BY_ID[card.definitionId]?.type
          : undefined);
      return (
        type === "ice" ||
        roles.some(
          (role) =>
            role.includes("remote") ||
            role.includes("ice") ||
            role.includes("economy"),
        )
      );
    });
    if (hasAgenda && hasRemoteSupport) return "score_next_turn";
    if (input.playerView.own.credits < 5) return "recover_economy";
  }
  return discardStrongestDoctrinePlan(input);
}

function discardStrongestDoctrinePlan(
  input: AiDecisionInput,
): string | undefined {
  return Object.entries(input.ownDeckDoctrine?.planWeights ?? {})
    .filter(([, weight]) => weight > 0)
    .sort(
      (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
    )[0]?.[0];
}

function discardRolesMatch(roles: string[], needles: string[]): boolean {
  return needles.some((needle) =>
    roles.some(
      (role) =>
        role === needle || role.includes(needle) || role.startsWith(needle),
    ),
  );
}

function discardEvidenceForInput(input: AiDecisionInput): string[] {
  const evidence = ["discard_score:base"];
  const plan = discardCurrentPlanKind(input);
  if (plan) evidence.push("discard_score:planfit", `discard_keep:${plan}`);
  const tags = input.ownDeckDoctrine?.archetypeTags ?? [];
  if (tags.length > 0) {
    evidence.push("discard_score:doctrinefit");
    for (const tag of tags.slice(0, 3))
      evidence.push(`discard_keep:doctrine_${tag}`);
  }
  return sortedUnique(evidence);
}

function discardRolesForCardId(cardId: string | undefined): string[] {
  if (!cardId) return [];
  const roleRecord = CARD_ROLES_BY_CARD.get(cardId);
  const hint = AI_HINTS.get(cardId);
  return sortedUnique([
    ...(roleRecord?.roles ?? []),
    ...(hint?.roles ?? []),
    ...(hint?.planRoles ?? []),
  ]);
}

function discardVisibleCardCost(
  card: NonNullable<
    AiDecisionInput["playerView"]["pendingChoice"]
  >["options"][number]["card"],
): number {
  if (!card) return 0;
  const direct = card.installCost ?? card.cost ?? card.rezCost;
  if (typeof direct === "number" && Number.isFinite(direct))
    return Math.max(0, direct);
  const definition = card.definitionId
    ? DEMO_CARDS_BY_ID[card.definitionId]
    : undefined;
  return Math.max(
    0,
    definition?.installCost ?? definition?.cost ?? definition?.rezCost ?? 0,
  );
}

function selectedSearchChoiceOptionIds(
  input: AiDecisionInput,
  choice: NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>,
  selectableOptions: NonNullable<
    AiDecisionInput["playerView"]["pendingChoice"]
  >["options"],
): string[] | undefined {
  if (!isSearchChoice(choice)) return undefined;
  const count = boundedSelectionCount(
    choice.minSelections,
    choice.maxSelections,
    selectableOptions.length,
  );
  if (count <= 0) return [];
  return selectableOptions
    .slice()
    .sort((left, right) => {
      const scoreDelta =
        scoreSearchChoiceOption(input, choice, right) -
        scoreSearchChoiceOption(input, choice, left);
      return (
        scoreDelta ||
        left.label.localeCompare(right.label, "de") ||
        left.id.localeCompare(right.id)
      );
    })
    .slice(0, count)
    .map((option) => option.id);
}

function isSearchChoice(
  choice: NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>,
): boolean {
  return Boolean(
    choice.cardSearchPresentation ||
      choice.stackSearchResolution ||
      /search|stack/i.test(choice.source),
  );
}

function boundedSelectionCount(
  minSelections: number,
  maxSelections: number,
  available: number,
): number {
  const requested = Math.max(minSelections, maxSelections);
  return Math.max(0, Math.min(requested, available));
}

function scoreSearchChoiceOption(
  input: AiDecisionInput,
  choice: NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>,
  option: NonNullable<
    AiDecisionInput["playerView"]["pendingChoice"]
  >["options"][number],
): number {
  const card = option.card;
  if (!card) return 0;
  const destination =
    choice.cardSearchPresentation?.destination ??
    choice.stackSearchResolution?.destination;
  const roles = rolesForCardId(card.definitionId);
  const subtypes = (card.subtypes ?? []).map((subtype) =>
    subtype.toLowerCase(),
  );
  const features = extractAiFeatures(input);
  let score = 100;

  if (card.type === "program")
    score += destination === "install_program" ? 1000 : 520;
  else if (destination === "install_program") score -= 600;

  if (destination === "install_program") {
    const memoryCost = card.memoryCost ?? 0;
    score +=
      memoryCost <= features.memoryRemaining
        ? 180
        : -260 - (memoryCost - features.memoryRemaining) * 40;
    const installCost = card.installCost ?? card.cost ?? 0;
    score +=
      installCost <= features.credits
        ? 110
        : -160 - (installCost - features.credits) * 30;
  }

  const breakerRoles = roles.filter((role) => role.startsWith("breaker_"));
  if (
    breakerRoles.length > 0 ||
    subtypes.some((subtype) =>
      ["icebreaker", "breaker", "decoder", "fracter", "killer"].includes(
        subtype,
      ),
    )
  ) {
    score += 220;
    for (const role of breakerRoles)
      score += features.rigRoles.has(role) ? 40 : 180;
    if (features.rigRoles.size === 0) score += 120;
  }

  if (roles.includes("memory") || (card.memoryLimitBonus ?? 0) > 0)
    score += features.memoryRemaining <= 1 ? 170 : 60;
  if (roles.includes("economy")) score += features.credits < 4 ? 90 : 25;
  if (card.definitionId && features.rigDefinitionIds.has(card.definitionId))
    score -= 90;
  score -= Math.max(0, card.memoryCost ?? 0) * 5;
  score -= Math.max(0, card.installCost ?? card.cost ?? 0) * 2;
  return score;
}

function latestTraceContext(input: AiDecisionInput): {
  traceStrength?: number;
  runnerLink?: number;
} {
  for (const event of input.eventTail.slice().reverse()) {
    const traceStrength = event.publicPayload.traceStrength;
    const runnerLink = event.publicPayload.runnerLink;
    if (typeof traceStrength === "number" || typeof runnerLink === "number") {
      return {
        ...(typeof traceStrength === "number" ? { traceStrength } : {}),
        ...(typeof runnerLink === "number" ? { runnerLink } : {}),
      };
    }
  }
  return {};
}

function scoreActions(input: AiDecisionInput, side: Side): RankedChoice[] {
  const features = extractAiFeatures(input);
  return input.legalActions.map((action) =>
    side === "runner"
      ? scoreRunnerAction(input, features, action)
      : scoreCorpAction(input, features, action),
  );
}

function scoreRunnerAction(
  input: AiDecisionInput,
  features: AiFeatures,
  action: LegalAction,
): RankedChoice {
  const roles = rolesForAction(input, action);
  const profile = profileWeights(input);
  let score = 0;
  let reasonCode = "runner.fallback.low_value";
  let explanation =
    "Die Aktion bleibt legal, hat aber wenig sichtbaren Nutzen.";
  const evidence = [
    `difficulty:${input.difficulty}`,
    `credits:${features.credits}`,
    `clicks:${features.clicks}`,
  ];

  switch (action.type) {
    case "resolve_choice":
      if (input.playerView.pendingChoice?.source === "setup.mulligan") {
        const opening = evaluateRunnerOpeningHand(input);
        score = 920;
        reasonCode =
          opening.decision === "mulligan"
            ? "runner.setup.mulligan"
            : "runner.setup.keep";
        explanation =
          opening.decision === "mulligan"
            ? "Der Runner nimmt anhand von Start-Hand und Deckprofil einen Mulligan."
            : "Der Runner behält eine startfähige Hand anhand von Start-Hand und Deckprofil.";
        evidence.push(
          "choice_legal",
          "choice_source:setup.mulligan",
          ...opening.reasons,
          ...opening.evidence,
        );
      } else {
        const postBidTraceLink =
          input.playerView.pendingChoice?.source.startsWith(
            "trace_post_bid_link",
          ) === true;
        const programTrashAssessment =
          input.playerView.pendingChoice?.source.startsWith(
            "runner_program_trash_before_install",
          ) === true && input.playerView.pendingChoice.kind === "select_cards"
            ? runnerProgramInstallTrashAssessment(
                input,
                input.playerView.pendingChoice,
                selectableChoiceOptions(input.playerView.pendingChoice.options),
              )
            : null;
        score =
          input.playerView.pendingChoice?.kind === "bid_amount"
            ? 900
            : postBidTraceLink
              ? 880
              : programTrashAssessment
                ? 640
                : 620;
        reasonCode =
          input.playerView.pendingChoice?.kind === "bid_amount"
            ? "runner.trace.bid_visible_amount"
            : postBidTraceLink
              ? "runner.trace.post_bid_link"
              : "runner.choice.resolve";
        explanation = programTrashAssessment
          ? "Der Runner bewertet side-sicher, ob installierte Programme fuer MU getrasht werden."
          : postBidTraceLink
            ? "Der Runner nutzt nach offen gelegten Trace-Bids eine legale Link-Faehigkeit."
            : "Der Runner beantwortet eine sichtbare legale Choice.";
        evidence.push(
          "choice_legal",
          `choice_kind:${input.playerView.pendingChoice?.kind ?? "unknown"}`,
        );
        if (programTrashAssessment)
          evidence.push(...programTrashAssessment.evidence);
        if (input.playerView.pendingChoice?.source === "discard_phase")
          evidence.push(
            "choice_source:discard_phase",
            "discard_selection:keep_value",
            ...discardEvidenceForInput(input),
          );
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
      {
        const trashContext = runnerRemoteTrashAccessContext(input, action);
        score = trashContext.affordableRelevant
          ? trashContext.role === "scoring_protection"
            ? 940
            : 890
          : trashContext.trashable && trashContext.role === "low_value"
            ? 430
            : 780;
      }
      reasonCode = "runner.access.trash_value";
      explanation = "Eine zugreifbare Karte kann legal entfernt werden.";
      evidence.push("trash_legal");
      break;
    case "decline_trash":
      {
        const trashContext = runnerRemoteTrashAccessContext(input, action);
        score = trashContext.affordableRelevant
          ? 120
          : trashContext.trashable && trashContext.role === "low_value"
            ? 760
            : 650;
      }
      reasonCode = "runner.access.decline_trash";
      explanation =
        "Der Runner lehnt das Trashen im Zugriff bewusst ab, wenn kein höherwertiger Trash-Plan greift.";
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
        explanation =
          "Ein installierter Breaker kann die Begegnung verbessern.";
        evidence.push("breaker_visible", "pump_can_enable_break");
      } else {
        score = 90;
        reasonCode = "runner.encounter.pump_without_matching_breaker";
        explanation =
          "Der sichtbare Breaker passt nicht zu diesem ICE; Pumpen verbessert die Begegnung nicht.";
        evidence.push("breaker_visible", "pump_cannot_break_encountered_ice");
      }
      break;
    case "continue_run":
      score = input.difficulty === "easy" ? 360 : 520;
      reasonCode = "runner.encounter.continue";
      explanation =
        "Der Run kann nach sichtbarer Bewertung fortgesetzt werden.";
      evidence.push("continue_legal");
      break;
    case "jack_out":
      if (runnerReachedAccessMovement(input)) {
        score = 80;
        reasonCode = "runner.run.jack_out_before_access_low_value";
        explanation =
          "Der Runner hat den Server erreicht; Jack-out wuerde den Zugriff ohne sichtbaren Nutzen aufgeben.";
        evidence.push("jack_out_legal", "access_window_reached");
      } else {
        score = 610;
        reasonCode = "runner.run.jack_out_safe_exit";
        explanation =
          "Der Runner kann vor weiterer sichtbarer Run-Gefahr legal auschecken.";
        evidence.push("jack_out_legal", "pre_access_window");
      }
      break;
    case "remove_tag":
      score = features.tags > 0 ? 760 + (profile.riskTolerance ?? 1) * 40 : 300;
      reasonCode = "runner.tag.clear_visible_tag";
      explanation =
        "Ein öffentlicher Tag wird entfernt, bevor er gefährlich wird.";
      evidence.push(`tags:${features.tags}`);
      break;
    case "install_card":
      score = scoreRunnerInstall(roles, features, profile);
      reasonCode = roles.some((role) => role.startsWith("breaker_"))
        ? "runner.setup.install_missing_breaker"
        : "runner.setup.install_support";
      explanation =
        "Die Runner-KI verbessert sichtbare Rig- oder Setup-Rollen.";
      evidence.push("own_card_role_known", ...publicRoleEvidence(roles));
      break;
    case "play_event":
      score = scoreRunnerEvent(roles, features, profile);
      reasonCode = roles.includes("run_pressure")
        ? "runner.run.event_pressure"
        : roles.includes("draw")
          ? "runner.economy.draw_setup"
          : "runner.economy.event";
      explanation =
        "Ein Event verbessert anhand sichtbarer Rollen die Runner-Position.";
      evidence.push("own_event_role_known", ...publicRoleEvidence(roles));
      break;
    case "trigger_ability":
      if (action.payload?.shellTradersAbility === "set_aside_from_grip") {
        const counterAmount =
          typeof action.payload.shellCounterAmount === "number"
            ? action.payload.shellCounterAmount
            : 0;
        const targetRoles = shellTradersTargetRoles(input, action);
        const directInstall = shellTradersDirectInstallAction(input, action);
        const directInstallUrgency = directInstall
          ? shellTradersDirectInstallUrgency(input, targetRoles, directInstall)
          : 0;
        const directInstallPenalty = directInstall
          ? shellTradersDirectInstallPreparePenalty(
              directInstallUrgency,
              directInstall,
              input,
            )
          : 0;
        const backlog = shellTradersBacklog(input);
        const immediateRemoveAvailable =
          shellTradersImmediateRemoveAvailable(input);
        const backlogPenalty = shellTradersPrepareBaselinePenalty(
          input,
          backlog,
          immediateRemoveAvailable,
        );
        score =
          620 +
          Math.max(0, counterAmount) * 30 +
          Math.min(
            60,
            shellTradersTargetValue(targetRoles, counterAmount) / 3,
          ) -
          backlogPenalty -
          directInstallPenalty;
        reasonCode = "runner.shell_traders.prepare_install";
        explanation =
          "The Shell Traders bereitet ein eigenes Programm oder eine Hardwarekarte für die verzögerte kostenlose Installation vor.";
        evidence.push(
          "shell_traders",
          `shell_counters:${counterAmount}`,
          `shell_traders_backlog:${backlog.preparedCount}`,
          `shell_traders_prepare_backlog_penalty:${backlogPenalty}`,
          `shell_traders_direct_install_available:${Boolean(directInstall)}`,
          `shell_traders_direct_install_urgency:${directInstallUrgency}`,
          `shell_traders_direct_install_penalty:${directInstallPenalty}`,
          `shell_traders_immediate_remove:${immediateRemoveAvailable}`,
        );
      } else if (
        action.payload?.shellTradersAbility === "remove_shell_counter"
      ) {
        const remaining =
          typeof action.payload.remainingCounters === "number"
            ? action.payload.remainingCounters
            : 1;
        score = remaining <= 1 ? 650 : 360;
        reasonCode = "runner.shell_traders.remove_counter";
        explanation =
          "Ein Shell-Counter kann legal entfernt werden, um die vorbereitete Installation zu beschleunigen.";
        evidence.push("shell_counter_remove", `credits:${features.credits}`);
      } else {
        score = 260;
        reasonCode = "runner.card_ability.visible";
        explanation = "Eine sichtbare Kartenfähigkeit ist legal verfügbar.";
        evidence.push("trigger_ability");
      }
      break;
    case "start_run":
      const staleCentralRepeatPenalty =
        staleKnownRndRepeatRunPenalty(input, action) +
        staleKnownHqRepeatRunPenalty(input, action) +
        staleKnownArchivesRepeatRunPenalty(input, action) +
        recentRemoteJackOutRepeatRunPenalty(input, action);
      score = scoreRunTarget(
        action,
        features,
        profile,
        input.difficulty,
        staleCentralRepeatPenalty,
      );
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
        ...(staleCentralRepeatPenalty > 0
          ? [`known_stale_central_repeat_penalty:${staleCentralRepeatPenalty}`]
          : []),
      );
      break;
    case "gain_credit":
      score =
        input.difficulty === "easy" ? 560 : features.credits < 4 ? 540 : 380;
      reasonCode = "runner.economy.basic_credit";
      explanation = "Credits verbessern die sichtbare Handlungsfähigkeit.";
      evidence.push("basic_economy");
      break;
    case "draw_card":
      score = features.handCount < 3 ? 430 : 320;
      if (features.citySurveillanceSourceCount > 0) {
        const projectedCreditsPaid = Number(
          action.payload?.citySurveillanceProjectedCreditsPaid ?? 0,
        );
        const projectedTagsAdded = Number(
          action.payload?.citySurveillanceProjectedTagsAdded ?? 0,
        );
        score -=
          (Number.isFinite(projectedCreditsPaid) ? projectedCreditsPaid : 0) *
            185 +
          (Number.isFinite(projectedTagsAdded) ? projectedTagsAdded : 0) * 620;
        if (projectedTagsAdded > 0 && features.tags > 0)
          score -= Math.min(360, features.tags * 20);
        if (
          projectedCreditsPaid > 0 &&
          features.credits <= projectedCreditsPaid + 1
        )
          score -= 120;
      }
      reasonCode = "runner.economy.draw_card";
      explanation = "Eine Karte zu ziehen verbessert das sichtbare Setup.";
      evidence.push(`hand_count:${features.handCount}`);
      if (features.citySurveillanceSourceCount > 0) {
        evidence.push(
          `city_surveillance_sources:${features.citySurveillanceSourceCount}`,
          `city_surveillance_decision:${String(action.payload?.citySurveillanceDrawDecision ?? "unknown")}`,
          `city_surveillance_projected_credits:${Number(action.payload?.citySurveillanceProjectedCreditsPaid ?? 0)}`,
          `city_surveillance_projected_tags:${Number(action.payload?.citySurveillanceProjectedTagsAdded ?? 0)}`,
        );
      }
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

  return {
    action,
    score: roundScore(score),
    reasonCode,
    explanation,
    confidence: confidence(score),
    evidence,
  };
}

function scoreCorpAction(
  input: AiDecisionInput,
  features: AiFeatures,
  action: LegalAction,
): RankedChoice {
  const roles = rolesForAction(input, action);
  const profile = profileWeights(input);
  let score = 0;
  let reasonCode = "corp.fallback.low_value";
  let explanation =
    "Die Aktion bleibt legal, hat aber wenig sichtbaren Nutzen.";
  const evidence = [
    `difficulty:${input.difficulty}`,
    `credits:${features.credits}`,
    `clicks:${features.clicks}`,
  ];

  switch (action.type) {
    case "resolve_choice":
      if (input.playerView.pendingChoice?.source === "setup.mulligan") {
        const opening = evaluateCorpOpeningHand(input);
        score = 920;
        reasonCode =
          opening.decision === "mulligan"
            ? "corp.setup.mulligan"
            : "corp.setup.keep";
        explanation =
          opening.decision === "mulligan"
            ? "Die Corp nimmt anhand von Start-Hand und Deckprofil einen Mulligan."
            : "Die Corp behält eine startfähige Hand anhand von Start-Hand und Deckprofil.";
        evidence.push(
          "choice_legal",
          "choice_source:setup.mulligan",
          ...opening.reasons,
          ...opening.evidence,
        );
      } else {
        score =
          input.playerView.pendingChoice?.kind === "bid_amount" ? 900 : 620;
        reasonCode =
          input.playerView.pendingChoice?.kind === "bid_amount"
            ? "corp.trace.bid_visible_amount"
            : "corp.choice.resolve";
        explanation = "Die Corp beantwortet eine sichtbare legale Choice.";
        evidence.push(
          "choice_legal",
          `choice_kind:${input.playerView.pendingChoice?.kind ?? "unknown"}`,
        );
        if (input.playerView.pendingChoice?.source === "discard_phase")
          evidence.push(
            "choice_source:discard_phase",
            "discard_selection:keep_value",
            ...discardEvidenceForInput(input),
          );
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
      explanation =
        "Eine scorebare Agenda ist legal und sichtbar für die Corp.";
      evidence.push("score_window");
      break;
    case "rez_ice":
      score = 820 + (profile.rez ?? 1) * 30;
      reasonCode = "corp.rez.defensive_card";
      explanation =
        "Eine defensive Karte kann im Run-Fenster legal gerezzt werden.";
      evidence.push("run_window", `runner_credits:${features.opponentCredits}`);
      break;
    case "decline_rez":
      score = 180;
      reasonCode = "corp.rez.decline";
      explanation =
        "Rez wird abgelehnt, wenn sichtbarer Nutzen niedrig bleibt.";
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
        explanation =
          "Eine ICE-Installation schützt einen sichtbaren Außenserver-Plan.";
        evidence.push(
          `server:${String(action.payload?.serverId ?? "unknown")}`,
        );
      } else {
        score = scoreCorpRootInstall(roles, action, features, profile);
        reasonCode = roles.some((role) => role.startsWith("agenda_"))
          ? "corp.remote.install_score_plan"
          : "corp.remote.install_asset_plan";
        explanation =
          "Die Corp baut eine Installation im Außenserver aus eigener Information auf.";
        evidence.push("own_card_role_known", ...publicRoleEvidence(roles));
      }
      break;
    case "play_operation":
      score = scoreCorpOperation(roles, features, profile);
      reasonCode = roles.includes("tag_punishment")
        ? "corp.tag.punish_visible_tag"
        : roles.includes("draw_operation")
          ? "corp.economy.draw_operation"
          : "corp.economy.operation";
      explanation =
        "Eine legale Operation verbessert anhand eigener sichtbarer Rollen die Corp-Position.";
      evidence.push(
        "own_operation_role_known",
        ...publicRoleEvidence(roles),
        `runner_tags:${features.opponentTags}`,
      );
      break;
    case "trash_resource":
      score =
        features.opponentTags > 0 ? 760 + (profile.remote ?? 1) * 20 : 140;
      reasonCode = "corp.tag.trash_visible_resource";
      explanation =
        "Die Corp nutzt einen sichtbaren Tag, um eine öffentliche Resource zu trashen.";
      evidence.push(
        "resource_trash_legal",
        `runner_tags:${features.opponentTags}`,
      );
      break;
    case "purge_virus_counters":
      score = 780;
      reasonCode = "corp.purge.visible_virus_counters";
      explanation =
        "Die Corp nutzt die legale Purge-Aktion gegen sichtbare Virus-Counter.";
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
      explanation =
        "Eine Karte zu ziehen verbessert die sichtbare Corp-Auswahl.";
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

  return {
    action,
    score: roundScore(score),
    reasonCode,
    explanation,
    confidence: confidence(score),
    evidence,
  };
}

function extractAiFeatures(input: AiDecisionInput): AiFeatures {
  const ownCards = [
    ...input.playerView.own.gripOrHq,
    ...input.playerView.own.heapOrArchives,
    ...input.playerView.own.scoreArea,
    ...(input.playerView.own.rig ?? []),
  ];
  const rigRoles = new Set(
    (input.playerView.own.rig ?? []).flatMap((card) =>
      rolesForCardId(card.definitionId),
    ),
  );
  const rigDefinitionIds = new Set(
    (input.playerView.own.rig ?? [])
      .map((card) => card.definitionId)
      .filter((id): id is string => Boolean(id)),
  );
  const handRoles = new Set(
    input.playerView.own.gripOrHq.flatMap((card) =>
      rolesForCardId(card.definitionId),
    ),
  );
  const eventCounts = buildObservedFacts(input).eventCounts;
  const serverFeaturesById = buildServerFeatures(input);
  const knownServerPressure = input.playerView.servers.reduce(
    (sum, server) =>
      sum +
      server.ice.filter((card) => card.known || card.rezzed).length +
      server.root.filter((card) => card.known).length,
    0,
  );
  const blockedRunServers = new Set(
    input.playerView.servers
      .filter((server) =>
        isBlockedByKnownRezzedIce(server.ice.at(-1), rigDefinitionIds),
      )
      .map((server) => server.id),
  );
  return {
    side: input.side,
    credits: input.playerView.own.credits,
    clicks: input.playerView.own.clicks,
    tags: input.playerView.own.tags,
    citySurveillanceSourceCount: visibleCitySurveillanceSourceCount(input),
    opponentCredits: input.playerView.opponent.credits,
    opponentTags: input.playerView.opponent.tags,
    memoryRemaining:
      (input.playerView.own.memoryLimit ?? 0) -
      (input.playerView.own.memoryUsed ?? 0),
    handCount: input.playerView.own.gripOrHq.length,
    rigRoles,
    rigDefinitionIds,
    handRoles: new Set([
      ...handRoles,
      ...ownCards
        .flatMap((card) => rolesForCardId(card.definitionId))
        .filter((role) => role === "tag_punishment"),
    ]),
    eventCounts,
    knownServerPressure,
    blockedRunServers,
    serverFeaturesById,
  };
}

function buildServerFeatures(
  input: AiDecisionInput,
): Map<string, ServerFeatures> {
  return new Map(
    input.playerView.servers.map((server) => [
      server.id,
      {
        iceCount: server.ice.length,
        rootCount: server.root.length,
        knownRootCount: server.root.filter((card) => card.known).length,
        unrezzedRootCount: server.root.filter((card) => card.rezzed !== true)
          .length,
        rezzedRootCount: server.root.filter((card) => card.rezzed === true)
          .length,
      },
    ]),
  );
}

function visibleCitySurveillanceSourceCount(input: AiDecisionInput): number {
  return input.playerView.servers.reduce(
    (count, server) =>
      count +
      server.root.filter(
        (card) =>
          card.known &&
          card.rezzed === true &&
          card.definitionId === "onr_v1_313_city-surveillance",
      ).length,
    0,
  );
}

export function buildObservedFacts(input: AiDecisionInput): AiObservedFacts {
  const eventCounts: Record<string, number> = {};
  for (const event of input.eventTail)
    eventCounts[event.type] = (eventCounts[event.type] ?? 0) + 1;
  return {
    eventCounts,
    publicServers: input.playerView.servers.map((server) => server.id).sort(),
    tags: input.playerView.own.tags,
    agendaPoints: {
      own: input.playerView.own.agendaPoints,
      opponent: input.playerView.opponent.agendaPoints,
    },
  };
}

function rolesForAction(input: AiDecisionInput, action: LegalAction): string[] {
  if (action.source === "basic_action" || action.source === "game_rule")
    return [];
  const visible = findVisibleCard(input, action.source);
  return rolesForCardId(visible?.definitionId);
}

function shellTradersTargetRoles(
  input: AiDecisionInput,
  action: LegalAction,
): string[] {
  const targetCardId =
    typeof action.payload?.targetCardId === "string"
      ? action.payload.targetCardId
      : "";
  const targetDefinitionId =
    typeof action.payload?.targetCardDefinitionId === "string"
      ? action.payload.targetCardDefinitionId
      : findVisibleCard(input, targetCardId)?.definitionId;
  return rolesForCardId(targetDefinitionId);
}

function shellTradersTargetValue(
  roles: string[],
  shellCounters: number,
): number {
  let value = 0;
  if (roles.some((role) => role.startsWith("breaker_"))) value += 105;
  if (roles.includes("memory") || roles.includes("memory_support")) value += 55;
  if (roles.includes("setup") || roles.includes("build_rig")) value += 45;
  if (roles.includes("economy") || roles.includes("tempo")) value += 20;
  value += Math.min(60, Math.max(0, shellCounters) * 10);
  return value;
}

function shellTradersDirectInstallAction(
  input: AiDecisionInput,
  action: LegalAction,
): LegalAction | undefined {
  const targetCardId =
    typeof action.payload?.targetCardId === "string"
      ? action.payload.targetCardId
      : "";
  if (!targetCardId) return undefined;
  return input.legalActions.find(
    (candidate) =>
      candidate.type === "install_card" && candidate.source === targetCardId,
  );
}

function shellTradersDirectInstallUrgency(
  input: AiDecisionInput,
  roles: string[],
  directInstall: LegalAction,
): number {
  const remainingCredits =
    input.playerView.own.credits - creditCostForAiAction(directInstall);
  let urgency = 0;
  if (
    roles.some(
      (role) =>
        role.startsWith("breaker_") &&
        !input.playerView.own.rig?.some((card) =>
          rolesForCardId(card.definitionId).includes(role),
        ),
    )
  )
    urgency += 145;
  const memoryRemaining =
    (input.playerView.own.memoryLimit ?? 0) -
    (input.playerView.own.memoryUsed ?? 0);
  if (roles.includes("memory") || roles.includes("memory_support"))
    urgency += memoryRemaining <= 1 ? 110 : 25;
  if (roles.includes("setup") || roles.includes("build_rig"))
    urgency += (input.playerView.own.rig ?? []).length === 0 ? 45 : 15;
  if (roles.includes("economy") || roles.includes("tempo"))
    urgency += input.playerView.own.credits < 4 ? 55 : 15;
  if (remainingCredits >= 2) urgency += 45;
  else if (remainingCredits < 1) urgency -= 35;
  return Math.max(0, urgency);
}

function shellTradersDirectInstallPreparePenalty(
  urgency: number,
  directInstall: LegalAction,
  input: AiDecisionInput,
): number {
  let penalty = 35 + Math.min(170, urgency);
  if (input.playerView.own.credits - creditCostForAiAction(directInstall) >= 2)
    penalty += 35;
  return penalty;
}

function shellTradersBacklog(input: AiDecisionInput): {
  preparedCount: number;
  nearInstallCount: number;
} {
  const preparedCards =
    input.playerView.specialZones?.setAside.filter(
      (card) =>
        card.known &&
        card.owner === "runner" &&
        card.counters?.shell !== undefined,
    ) ?? [];
  return {
    preparedCount: preparedCards.length,
    nearInstallCount: preparedCards.filter(
      (card) => Math.max(0, card.counters?.shell ?? 0) <= 1,
    ).length,
  };
}

function shellTradersImmediateRemoveAvailable(input: AiDecisionInput): boolean {
  return input.legalActions.some(
    (action) =>
      action.type === "trigger_ability" &&
      action.payload?.shellTradersAbility === "remove_shell_counter" &&
      typeof action.payload.remainingCountersBefore === "number" &&
      action.payload.remainingCountersBefore <= 1,
  );
}

function shellTradersPrepareBaselinePenalty(
  input: AiDecisionInput,
  backlog: { preparedCount: number; nearInstallCount: number },
  immediateRemoveAvailable: boolean,
): number {
  let penalty = 0;
  if (backlog.preparedCount >= 2)
    penalty += 240 + Math.max(0, backlog.preparedCount - 2) * 55;
  else if (backlog.preparedCount === 1) penalty += 70;
  if (immediateRemoveAvailable) penalty += 120;
  if (backlog.nearInstallCount > 0) penalty += backlog.nearInstallCount * 40;
  if (input.playerView.own.credits <= 1 && backlog.preparedCount >= 2)
    penalty += 70;
  return penalty;
}

function findVisibleCard(input: AiDecisionInput, instanceId: string) {
  const zones = [
    input.playerView.own.gripOrHq,
    input.playerView.own.heapOrArchives,
    input.playerView.own.scoreArea,
    input.playerView.own.rig ?? [],
    ...input.playerView.servers.flatMap((server) => [server.ice, server.root]),
  ];
  return zones
    .flat()
    .find((card) => card.instanceId === instanceId && card.known);
}

function findVisibleCorpServerCard(
  input: AiDecisionInput,
  instanceId: string,
):
  | {
      card: VisibleCard;
      server: AiDecisionInput["playerView"]["servers"][number];
    }
  | undefined {
  for (const server of input.playerView.servers) {
    const card = [...server.ice, ...server.root].find(
      (candidate) => candidate.instanceId === instanceId && candidate.known,
    );
    if (card) return { card, server };
  }
  return undefined;
}

function rolesForCardId(cardId: string | undefined): string[] {
  if (!cardId) return [];
  const roleRecord = CARD_ROLES_BY_CARD.get(cardId);
  const hint = AI_HINTS.get(cardId);
  return sortedUnique([
    ...(roleRecord?.roles ?? []),
    ...(hint?.roles ?? []),
    ...(hint?.planRoles ?? []),
  ]);
}

function profileWeights(input: AiDecisionInput): Record<string, number> {
  const profile =
    AI_PROFILES.find((candidate) => candidate.profileId === input.profileId) ??
    AI_PROFILES.find(
      (candidate) =>
        candidate.side === input.side &&
        candidate.difficulty === input.difficulty,
    );
  return profile?.weights ?? {};
}

function scoreRunnerInstall(
  roles: string[],
  features: AiFeatures,
  profile: Record<string, number>,
): number {
  let score = 430 + (profile.setup ?? 1) * 40;
  if (
    roles.some(
      (role) => role.startsWith("breaker_") && !features.rigRoles.has(role),
    )
  )
    score += 190;
  if (roles.includes("memory") && features.memoryRemaining <= 1) score += 160;
  if (features.credits < 2) score -= 90;
  return score;
}

function scoreRunnerEvent(
  roles: string[],
  features: AiFeatures,
  profile: Record<string, number>,
): number {
  let score = 420;
  if (roles.includes("economy"))
    score += features.credits < 5 ? 170 * (profile.economy ?? 1) : 70;
  if (roles.includes("draw")) score += features.handCount < 4 ? 150 : 60;
  if (roles.includes("run_pressure"))
    score += features.credits >= 3 ? 150 * (profile.run ?? 1) : 30;
  return score;
}

function scoreRunTarget(
  action: LegalAction,
  features: AiFeatures,
  profile: Record<string, number>,
  difficulty: AiDifficulty,
  staleCentralRepeatPenalty = 0,
): number {
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

function runnerReachedAccessMovement(input: AiDecisionInput): boolean {
  const run = input.playerView.run;
  return (
    input.playerView.timingPoint === "run.jack_out_window" &&
    run?.phase === "movement" &&
    run.position?.kind === "server"
  );
}

function staleKnownRndRepeatRunPenalty(
  input: AiDecisionInput,
  action: LegalAction,
): number {
  if (
    input.side !== "runner" ||
    action.type !== "start_run" ||
    action.payload?.serverId !== "rd"
  )
    return 0;
  const freshness =
    reconstructBeliefState(input).runnerOpponentModel?.rndTopFreshness;
  // Public-event belief marks this only after Runner already accessed R&D and no visible draw, shuffle, reorder, swap, steal, or trash changed the top card.
  return freshness?.freshness === "stale_known_same_top" ? 420 : 0;
}

function staleKnownHqRepeatRunPenalty(
  input: AiDecisionInput,
  action: LegalAction,
): number {
  if (
    input.side !== "runner" ||
    action.type !== "start_run" ||
    action.payload?.serverId !== "hq"
  )
    return 0;
  if (
    input.legalActions.some(
      (candidate) =>
        candidate.type === "trash_accessed_card" ||
        candidate.type === "steal_agenda",
    )
  )
    return 0;
  const hqHandMemory =
    reconstructBeliefState(input).runnerOpponentModel?.hqHandMemory;
  if (
    !hqHandMemory?.allCardsKnown ||
    hqHandMemory.knownDefinitions.length === 0
  )
    return 0;
  return hqHandMemory.knownDefinitions.every((definitionId) =>
    isLowValueKnownAccessCard(definitionId, input.playerView.own.credits),
  )
    ? 430
    : 0;
}

function staleKnownArchivesRepeatRunPenalty(
  input: AiDecisionInput,
  action: LegalAction,
): number {
  if (
    input.side !== "runner" ||
    action.type !== "start_run" ||
    action.payload?.serverId !== "archives"
  )
    return 0;
  if (
    input.legalActions.some(
      (candidate) =>
        candidate.type === "trash_accessed_card" ||
        candidate.type === "steal_agenda",
    )
  )
    return 0;
  const archives = input.playerView.servers.find(
    (server) => server.id === "archives",
  );
  const visibleArchivesCards = archives?.root ?? [];
  if (
    visibleArchivesCards.length === 0 ||
    visibleArchivesCards.some((card) => !card.known || !card.definitionId)
  )
    return 0;
  const history = mergedAiPublicHistory(input);
  const lastArchivesAccessIndex = findLastAiHistoryIndex(history, (event) =>
    isAiArchivesAccessEvent(event),
  );
  if (lastArchivesAccessIndex < 0) return 0;
  if (
    history
      .slice(lastArchivesAccessIndex + 1)
      .some((event) => aiEventMayChangeArchives(event))
  )
    return 0;
  return 520;
}

function recentRemoteJackOutRepeatRunPenalty(
  input: AiDecisionInput,
  action: LegalAction,
): number {
  if (input.side !== "runner" || action.type !== "start_run") return 0;
  const serverId = String(action.payload?.serverId ?? "");
  if (!serverId.startsWith("remote_")) return 0;
  const history = mergedAiPublicHistory(input);
  const lastSameRemoteRunIndex = findLastAiHistoryIndex(
    history,
    (event) =>
      aiServerIdFromEvent(event) === serverId &&
      (event.publicPayload.actionType === "start_run" ||
        event.type === "run_started"),
  );
  if (lastSameRemoteRunIndex < 0) return 0;
  const lastRunEvent = history[lastSameRemoteRunIndex];
  if (!lastRunEvent) return 0;
  if (input.playerView.stateVersion - aiEventVersion(lastRunEvent) > 8)
    return 0;
  return recentAiSameRemoteJackOutWithoutAccess(
    history,
    lastSameRemoteRunIndex,
    serverId,
  )
    ? 520
    : 0;
}

function recentAiSameRemoteJackOutWithoutAccess(
  history: PublicGameEvent[],
  startIndex: number,
  serverId: string,
): boolean {
  const afterStart = history.slice(startIndex + 1);
  const jackOutIndex = afterStart.findIndex((event) => {
    const actionType =
      typeof event.publicPayload.actionType === "string"
        ? event.publicPayload.actionType
        : event.type;
    if (actionType !== "jack_out") return false;
    const eventServerId = aiServerIdFromEvent(event);
    return eventServerId === undefined || eventServerId === serverId;
  });
  if (jackOutIndex < 0) return false;
  if (
    afterStart
      .slice(0, jackOutIndex)
      .some(
        (event) =>
          aiServerIdFromEvent(event) === serverId &&
          event.publicPayload.actionType === "access_card",
      )
  )
    return false;
  return !afterStart
    .slice(jackOutIndex + 1)
    .some((event) => aiEventMayRefreshRemoteRun(event, serverId));
}

function aiEventMayRefreshRemoteRun(
  event: PublicGameEvent,
  serverId: string,
): boolean {
  const actionType =
    typeof event.publicPayload.actionType === "string"
      ? event.publicPayload.actionType
      : event.type;
  if (actionType === "access_card" && aiServerIdFromEvent(event) === serverId)
    return true;
  return (
    actionType === "gain_credit" ||
    actionType === "draw_card" ||
    actionType === "install_card" ||
    actionType === "play_event" ||
    actionType === "trigger_ability" ||
    actionType === "rez_ice"
  );
}

function isLowValueKnownAccessCard(
  definitionId: string,
  runnerCredits: number,
): boolean {
  const runtimeDefinition = RUNTIME_CARDS[definitionId];
  const demoDefinition = DEMO_CARDS_BY_ID[definitionId];
  const type = runtimeDefinition?.type ?? demoDefinition?.type;
  if (!type) return false;
  if (type === "agenda") return false;
  const trashCost =
    runtimeDefinition?.numeric.trashCost ?? demoDefinition?.trashCost ?? 0;
  if ((type === "asset" || type === "upgrade") && runnerCredits >= trashCost)
    return false;
  return true;
}

function mergedAiPublicHistory(input: AiDecisionInput): PublicGameEvent[] {
  const byId = new Map<string, PublicGameEvent>();
  for (const event of [...input.playerView.publicEvents, ...input.eventTail]) {
    byId.set(event.eventId, event);
  }
  return [...byId.values()].sort(
    (left, right) => aiEventVersion(left) - aiEventVersion(right),
  );
}

function findLastAiHistoryIndex<T>(
  values: T[],
  predicate: (value: T) => boolean,
): number {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (predicate(values[index]!)) return index;
  }
  return -1;
}

function isAiArchivesAccessEvent(event: PublicGameEvent): boolean {
  return (
    event.publicPayload.actionType === "access_card" &&
    aiServerIdFromEvent(event) === "archives"
  );
}

function aiEventMayChangeArchives(event: PublicGameEvent): boolean {
  const payload = event.publicPayload;
  if (
    payload.discardZone === "archives" ||
    payload.hiddenZoneAction === "discard_phase"
  )
    return true;
  const actionType =
    typeof payload.actionType === "string" ? payload.actionType : event.type;
  return (
    actionType === "trash_accessed_card" ||
    actionType === "trash_card" ||
    actionType === "play_operation"
  );
}

function aiServerIdFromEvent(event: PublicGameEvent): string | undefined {
  const payload = event.publicPayload;
  if (typeof payload.serverId === "string") return payload.serverId;
  if (typeof payload.server === "string") return payload.server;
  const label =
    typeof payload.serverLabel === "string"
      ? payload.serverLabel
      : typeof payload.serverName === "string"
        ? payload.serverName
        : undefined;
  if (!label) return undefined;
  const normalized = label.toLowerCase();
  if (normalized === "r&d" || normalized === "rd") return "rd";
  if (normalized === "hq" || normalized === "headquarters") return "hq";
  if (normalized === "archives" || normalized === "archive") return "archives";
  return undefined;
}

function aiEventVersion(event: PublicGameEvent): number {
  return typeof event.stateVersionAfter === "number"
    ? event.stateVersionAfter
    : 0;
}

function runnerRunReasonCode(
  action: LegalAction,
  features: AiFeatures,
): string {
  const serverId = String(action.payload?.serverId ?? "");
  const server = features.serverFeaturesById.get(serverId);
  if (features.blockedRunServers.has(serverId))
    return "runner.run.blocked_by_rezzed_ice";
  if (serverId.startsWith("remote_") && (server?.rootCount ?? 0) === 0)
    return "runner.run.empty_remote_low_value";
  return "runner.run.visible_pressure";
}

function runTargetEvidence(
  action: LegalAction,
  features: AiFeatures,
): string[] {
  const serverId = String(action.payload?.serverId ?? "");
  const server = features.serverFeaturesById.get(serverId);
  if (!server) return [];
  return [
    `ice_count:${server.iceCount}`,
    `root_count:${server.rootCount}`,
    `known_root_count:${server.knownRootCount}`,
    `rezzed_root_count:${server.rezzedRootCount}`,
  ];
}

function isBlockedByKnownRezzedIce(
  ice:
    | {
        definitionId?: string;
        rezzed?: boolean;
        known: boolean;
        subtypes?: string[];
      }
    | undefined,
  rigDefinitionIds: Set<string>,
): boolean {
  if (!ice?.definitionId || !ice.known || ice.rezzed !== true) return false;
  const iceDefinitionId = ice.definitionId;
  if (!iceHasEndTheRun(iceDefinitionId)) return false;
  return ![...rigDefinitionIds].some((breakerDefinitionId) =>
    canBreakerDefinitionBreakIce(breakerDefinitionId, iceDefinitionId),
  );
}

function pumpCanLeadToBreak(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  const breaker = findVisibleCard(input, action.source);
  const encounteredIce = input.playerView.run?.encounteredIce;
  if (!breaker?.definitionId || !encounteredIce?.definitionId) return true;
  if (
    !canBreakerDefinitionBreakIce(
      breaker.definitionId,
      encounteredIce.definitionId,
    )
  )
    return false;

  const breakerId = breakerIdForEncounterAction(action);
  const targetIceId =
    typeof action.payload?.iceId === "string"
      ? action.payload.iceId
      : undefined;
  const directBreakIsLegal = input.legalActions.some(
    (candidate) =>
      candidate.type === "break_subroutine" &&
      breakerIdForEncounterAction(candidate) === breakerId &&
      (!targetIceId || candidate.payload?.iceId === targetIceId),
  );
  if (directBreakIsLegal) return false;

  const encounterContinue = input.legalActions.find(
    (candidate) =>
      candidate.type === "continue_run" &&
      candidate.payload?.encounterContinue === true,
  );
  if (encounterContinue?.payload?.unbrokenSubroutineCount === 0) return false;
  if (
    typeof breaker.strength === "number" &&
    typeof encounteredIce.strength === "number" &&
    breaker.strength >= encounteredIce.strength
  )
    return false;

  const endTheRunCount = endTheRunSubroutineCount(encounteredIce.definitionId);
  if (
    endTheRunCount > 0 &&
    encounterContinue?.payload?.encounterWillEndRun === true
  ) {
    const pumpCost = creditCostForAiAction(action);
    const remainingCreditsAfterPump = input.playerView.own.credits - pumpCost;
    if (remainingCreditsAfterPump < 0) return false;
    const strengthAfterThisPump =
      (breaker.strength ?? 0) +
      pumpStrengthAmountForAction(action, breaker.definitionId);
    const postPumpBreakAssessment =
      creditsToBreakEndTheRunSubroutinesWithBreaker(
        breaker,
        encounteredIce,
        endTheRunCount,
        strengthAfterThisPump,
      );
    if (!postPumpBreakAssessment) return false;
    if (postPumpBreakAssessment.cost > remainingCreditsAfterPump) return false;
  }

  return true;
}

function breakerIdForEncounterAction(action: LegalAction): string | undefined {
  if (typeof action.payload?.breakerId === "string")
    return action.payload.breakerId;
  return action.source === "basic_action" || action.source === "game_rule"
    ? undefined
    : action.source;
}

function creditCostForAiAction(action: LegalAction): number {
  return action.costs.reduce(
    (sum, cost) =>
      sum + (Number.isFinite(cost.credits) ? (cost.credits ?? 0) : 0),
    0,
  );
}

function pumpStrengthAmountForAction(
  action: LegalAction,
  breakerDefinitionId: string,
): number {
  if (typeof action.payload?.pumpStrengthAmount === "number")
    return action.payload.pumpStrengthAmount;
  const pumpAbility = DEMO_CARDS_BY_ID[breakerDefinitionId]?.abilities?.find(
    (ability) => ability.type === "pump_strength",
  );
  return Math.max(0, pumpAbility?.amount ?? 1);
}

function scoreCorpRootInstall(
  roles: string[],
  action: LegalAction,
  features: AiFeatures,
  profile: Record<string, number>,
): number {
  let score = 500 + (profile.remote ?? 1) * 45;
  if (roles.some((role) => role.startsWith("agenda_")))
    score += 110 + (profile.score ?? 1) * 35;
  if (roles.includes("economy_asset")) score += features.credits < 5 ? 90 : 30;
  if (action.payload?.serverId === "new_remote") score += 35;
  return score;
}

function scoreCorpIceInstall(
  action: LegalAction,
  features: AiFeatures,
  profile: Record<string, number>,
): number {
  let score = 470 + (profile.remote ?? 1) * 30;
  if (action.payload?.serverId === "rd") score += 65;
  if (String(action.payload?.serverId ?? "").startsWith("remote_")) score += 55;
  if (features.credits < 3) score -= 80;
  return score;
}

function scoreCorpOperation(
  roles: string[],
  features: AiFeatures,
  profile: Record<string, number>,
): number {
  if (roles.includes("tag_punishment"))
    return features.opponentTags > 0 ? 790 : 120;
  let score = 480;
  if (roles.includes("economy_operation"))
    score += features.credits < 6 ? 160 * (profile.economy ?? 1) : 70;
  if (roles.includes("draw_operation"))
    score += features.handCount < 4 ? 120 : 50;
  return score;
}

function publicRoleEvidence(roles: string[]): string[] {
  return roles.slice(0, 2).map((role) => `role:${role}`);
}

function scrubEvidence(evidence: string[]): string[] {
  return evidence.filter(
    (entry) =>
      !FORBIDDEN_AI_INPUT_FIELDS.some((needle) => entry.includes(needle)) &&
      !entry.includes("_1"),
  );
}

const MATCH_PROGRESSION_METRIC_KEYS: Array<keyof AiMatchProgressionMetrics> = [
  "games",
  "actionLimitRate",
  "averageActions",
  "averageTurns",
  "runnerAgendaPoints",
  "corpAgendaPoints",
  "runnerSteals",
  "corpScores",
  "scoreActionsAvailable",
  "scoreActionsTaken",
  "missedScoreWindows",
  "scoreActionTakeRate",
  "scoreOrStealActions",
  "scoreOrStealActionsPerMatch",
  "advancedAgendaSteals",
  "advancedAgendaStealsFromRemote",
  "advancedAgendaStealsFromCentral",
  "finalAdvanceActions",
  "unsafeFinalAdvanceActions",
  "protectedFinalAdvanceActions",
  "protectBeforeAdvanceActions",
  "advanceThenScoreSameTurn",
  "advanceThenRunnerStealBeforeNextCorpScore",
  "remoteProtectionScoreAtFinalAdvance",
  "runnerContestRiskAtFinalAdvance",
  "centralPressureRuns",
  "hqPressureRuns",
  "rdPressureRuns",
  "archivesPressureRuns",
  "remotePressureRuns",
  "successfulCentralRuns",
  "centralAgendaSteals",
  "hqAgendaSteals",
  "rndAgendaSteals",
  "archivesAgendaSteals",
  "centralStealsPerRun",
  "centralRunsWithMultiaccess",
  "centralRunsWithInterfaceInstalled",
  "hqRunsWithHqInterface",
  "rndRunsWithRndInterface",
  "centralRunEventsPlayed",
  "centralRunEventsWithGoodTarget",
  "repeatedLowValueCentralRuns",
  "centralRunStreakWithoutValue",
  "centralRunStartedWithInsufficientPostRunReserve",
  "centralCloseoutOpportunities",
  "centralCloseoutRunsTaken",
  "centralCloseoutSuccesses",
  "interfaceInstallOpportunities",
  "interfaceInstallsTaken",
  "interfaceInstalledButUnusedTurns",
  "successfulRemoteRuns",
  "successfulRemoteAccesses",
  "remoteTrashActions",
  "remoteAccessesWithTrashableCards",
  "remoteAccessesWithRelevantTrashableCards",
  "affordableRelevantRemoteTrashOpportunities",
  "relevantRemoteTrashTaken",
  "relevantRemoteTrashTakeRate",
  "skippedAffordableRelevantRemoteTrash",
  "remoteTrashTargetsAssetNode",
  "remoteTrashTargetsUpgrade",
  "remoteTrashTargetsIce",
  "remoteTrashTargetsUnknown",
  "remoteTrashRoleEconomy",
  "remoteTrashRoleScoringProtection",
  "remoteTrashRoleTagPunish",
  "remoteTrashRoleAmbush",
  "remoteTrashRoleLowValue",
  "remoteRunOpportunitiesAgainstAdvancedRemote",
  "remoteRunsAgainstAdvancedRemote",
  "skippedAdvancedRemoteContest",
  "centralRunWhileRemoteScoreThreatVisible",
  "remoteContestCreditReserveAfterRun",
  "uniqueAdvancedRemoteThreats",
  "contestableAdvancedRemoteThreats",
  "advancedRemoteThreatsContested",
  "advancedRemoteThreatContestRate",
  "skippedContestableAdvancedRemoteThreats",
  "centralRunInsteadOfContestableAdvancedRemote",
  "centralRunInsteadWasJustified",
  "centralRunBurnedRemoteContestReserve",
  "remoteContestBlockedByCredits",
  "remoteContestBlockedByPostRunReserve",
  "remoteContestBlockedByBreakerCoverage",
  "remoteContestBlockedByKnownIceCost",
  "remoteContestDeclinedAsBaitOrLowValue",
  "repeatedCentralRunsWhileSameRemoteThreat",
  "remoteRunStartedWithInsufficientPostRunReserve",
  "remoteRunStartedWithSufficientPostRunReserve",
  "turnsFromRemoteThreatCreatedToContest",
  "turnsFromRemoteThreatCreatedToScoreOrSteal",
  "remoteContestActions",
  "pressureTargetSwitches",
  "distinctPressureTargets",
  "remoteInstalls",
  "remoteRootInstalls",
  "remoteIceInstalls",
  "remoteAdvances",
  "advancedAgendaInstalledInRemote",
  "advancementActionsOnAgendas",
  "advancementActionsOnAssets",
  "advancementActionsOnUpgrades",
  "advancementActionsOnUnknown",
  "remoteBuildActions",
  "remoteAdvanceActions",
  "scoreWindowActions",
  "scoringRemoteDevelopmentActions",
  "rezIceDuringRun",
  "scoreWindows",
  "turnsToFirstCorpScore",
  "turnsToFirstAgendaSteal",
  "turnsFromFirstAdvanceToScore",
  "turnsFromFinalAdvanceToScoreOrSteal",
  "runnerDrawActions",
  "runnerDrawActionShare",
  "clickDrawActions",
  "cardEffectDrawActions",
  "drawWhileHoldingPlayableEconomy",
  "drawWhileHoldingInstallableBreaker",
  "drawWhileHoldingRunnablePressureCard",
  "drawWhileRemoteTrashAvailable",
  "drawThenDiscardSameTurn",
  "discardedPlayableEconomy",
  "discardedInstallableBreaker",
  "discardedRunPressureCard",
  "runnerInstallActions",
  "runnerDuplicateInstallActions",
  "runnerLowValueDuplicateInstallActions",
  "runnerJunkyardBbsDuplicateInstalls",
  "runnerEconomyActionsTaken",
  "runnerRigInstallActions",
  "runnerRemoteTrashOpportunities",
  "runnerRemoteTrashTaken",
  "handUseRate",
  "runnerAverageCredits",
  "runnerMedianCredits",
  "runnerEndTurnAverageCredits",
  "runnerEndTurnCreditsBelowReserve",
  "runnerCreditReserveTargetAverage",
  "runnerTurnsBelowContestReserve",
  "runnerEconomyCreditsGained",
  "runnerEconomyCreditsSpent",
  "runnerNetCreditDeltaPerTurn",
  "runnerRunsStartedBelowReserve",
  "runnerRemoteRunsStartedBelowReserve",
  "runnerCentralRunsStartedBelowReserve",
  "runnerContestBlockedByCredits",
  "runnerTrashBlockedByCredits",
  "runnerStealBlockedByCredits",
  "runnerSpendBelowReserveActions",
  "runnerLowValueSpendBelowReserve",
  "runnerExpensiveInstallBelowReserve",
  "runnerReservePreservingEconomyActions",
  "runnerReserveAfterSuccessfulRun",
  "runnerReserveAfterRemoteAccess",
  "runnerReserveAfterCentralRun",
  "runnerReserveBeforeAdvancedRemoteContest",
  "runsStartedAgainstKnownUnaffordablePath",
  "remoteRunsStartedAgainstKnownUnaffordablePath",
  "centralRunsStartedAgainstKnownUnaffordablePath",
  "runsEndedAfterFirstIceDueToCredits",
  "creditsMissingForKnownPath",
  "knownPathCostAtRunStart",
  "creditsAfterKnownPathEstimate",
  "runStartedWithInsufficientStealOrTrashReserve",
  "probeRunsWithPositiveInfoValue",
  "lowValueUnaffordableRuns",
  "illegalActions",
  "replayFailures",
  "fallbackRate",
  "timeoutRate",
];

export function summarizeMatchProgressionMetrics(
  summaries: AiSimulationSummary[],
): AiMatchProgressionMetrics {
  const games = summaries.length;
  const actionSequence = summaries.flatMap((summary) =>
    progressionEntriesWithRunTargets(summary.actionSequence),
  );
  const runnerRuns = actionSequence.filter(
    (entry) => entry.side === "runner" && entry.actionType === "start_run",
  );
  const successfulRunActions = actionSequence.filter(
    (entry) =>
      entry.side === "runner" &&
      [
        "access_card",
        "steal_agenda",
        "trash_accessed_card",
        "decline_trash",
      ].includes(entry.actionType),
  );
  const remoteTrashActions = actionSequence.filter(
    (entry) =>
      entry.side === "runner" &&
      entry.actionType === "trash_accessed_card" &&
      isRemoteServerTarget(entry.targetServerId),
  ).length;
  const remoteRootInstalls = actionSequence.filter(
    (entry) =>
      entry.side === "corp" &&
      entry.actionType === "install_card" &&
      isRemoteServerTarget(entry.targetServerId) &&
      entry.installPlacement !== "ice",
  ).length;
  const remoteIceInstalls = actionSequence.filter(
    (entry) =>
      entry.side === "corp" &&
      entry.actionType === "install_card" &&
      isRemoteServerTarget(entry.targetServerId) &&
      entry.installPlacement === "ice",
  ).length;
  const remoteAdvances = actionSequence.filter((entry) =>
    isCorpRemoteAdvancementProgress(entry),
  ).length;
  const scoreActionsAvailable = actionSequence.filter(
    (entry) => entry.side === "corp" && (entry.scoreActionsAvailable ?? 0) > 0,
  ).length;
  const missedScoreWindows = actionSequence.filter(
    (entry) =>
      entry.side === "corp" &&
      (entry.scoreActionsAvailable ?? 0) > 0 &&
      entry.actionType !== "score_agenda",
  ).length;
  const advancedAgendaSteals = actionSequence.filter(
    (entry) => entry.advancedAgendaStolen === true,
  ).length;
  const advancedAgendaStealsFromRemote = actionSequence.filter(
    (entry) => entry.advancedAgendaStealSource === "remote",
  ).length;
  const advancedAgendaStealsFromCentral = actionSequence.filter(
    (entry) => entry.advancedAgendaStealSource === "central",
  ).length;
  const finalAdvanceEntries = actionSequence.filter(
    (entry) => entry.finalAdvance === true,
  );
  const finalAdvanceActions = finalAdvanceEntries.length;
  const unsafeFinalAdvanceActions = finalAdvanceEntries.filter(
    (entry) => entry.unsafeFinalAdvance === true,
  ).length;
  const protectedFinalAdvanceActions = finalAdvanceEntries.filter(
    (entry) => entry.protectedFinalAdvance === true,
  ).length;
  const protectBeforeAdvanceActions = actionSequence.filter(
    (entry) => entry.protectBeforeAdvance === true,
  ).length;
  const advanceThenScoreSameTurn =
    countFinalAdvancesResolvedBySameTurnCorpScore(summaries);
  const advanceThenRunnerStealBeforeNextCorpScore =
    countFinalAdvancesStolenBeforeCorpScore(summaries);
  const remoteProtectionScoreAtFinalAdvance = averageFinalAdvanceNumber(
    finalAdvanceEntries,
    "remoteProtectionScore",
  );
  const runnerContestRiskAtFinalAdvance =
    averageRunnerContestRisk(finalAdvanceEntries);
  const remoteAgendaAdvancementActions = actionSequence.filter(
    (entry) =>
      isCorpRemoteAdvancementProgress(entry) &&
      (entry.advancementTargetTypes?.includes("agenda") ||
        entry.targetCardType === "agenda"),
  ).length;
  const advancementActionsOnAgendas = actionSequence.filter(
    (entry) =>
      isCorpRemoteAdvancementProgress(entry) &&
      (entry.advancementTargetTypes?.includes("agenda") ||
        entry.targetCardType === "agenda"),
  ).length;
  const advancementActionsOnAssets = actionSequence.filter(
    (entry) =>
      isCorpRemoteAdvancementProgress(entry) &&
      (entry.advancementTargetTypes?.includes("asset") ||
        entry.targetCardType === "asset"),
  ).length;
  const advancementActionsOnUpgrades = actionSequence.filter(
    (entry) =>
      isCorpRemoteAdvancementProgress(entry) &&
      (entry.advancementTargetTypes?.includes("upgrade") ||
        entry.targetCardType === "upgrade"),
  ).length;
  const advancementActionsOnUnknown = actionSequence.filter(
    (entry) =>
      isCorpRemoteAdvancementProgress(entry) &&
      !entry.advancementTargetTypes?.some((type) => type !== "unknown") &&
      entry.targetCardType !== "agenda" &&
      entry.targetCardType !== "asset" &&
      entry.targetCardType !== "upgrade",
  ).length;
  const rezIceDuringRun = actionSequence.filter(
    (entry) =>
      entry.side === "corp" &&
      entry.actionType === "rez_ice" &&
      typeof entry.timingPoint === "string" &&
      entry.timingPoint.startsWith("run."),
  ).length;
  const runnerSteals = actionSequence.filter(
    (entry) => entry.side === "runner" && entry.actionType === "steal_agenda",
  ).length;
  const centralAgendaStealEntries = actionSequence.filter(
    (entry) =>
      entry.side === "runner" &&
      entry.actionType === "steal_agenda" &&
      (entry.targetServerId === "hq" ||
        entry.targetServerId === "rd" ||
        entry.targetServerId === "archives"),
  );
  const centralAgendaSteals = centralAgendaStealEntries.length;
  const corpScores = actionSequence.filter(
    (entry) => entry.side === "corp" && entry.actionType === "score_agenda",
  ).length;
  const remoteBuildActions =
    remoteRootInstalls + remoteIceInstalls + rezIceDuringRun;
  const pressureTargets = runnerRuns.map(
    (entry) => entry.targetServerId ?? "unknown",
  );
  const totalActions = actionSequence.length || 1;
  const pressureTargetSwitches = pressureTargets.reduce(
    (switches, target, index) => {
      if (index === 0) return switches;
      return target !== pressureTargets[index - 1] ? switches + 1 : switches;
    },
    0,
  );
  const turnsToFirstCorpScore = averageFirstProgressionTurn(
    summaries,
    (entry) => entry.side === "corp" && entry.actionType === "score_agenda",
  );
  const turnsToFirstAgendaSteal = averageFirstProgressionTurn(
    summaries,
    (entry) => entry.side === "runner" && entry.actionType === "steal_agenda",
  );
  const turnsFromFirstAdvanceToScore =
    averageTurnsFromFirstAdvanceToScore(summaries);
  const runnerDecisionActions = actionSequence.filter(
    (entry) => entry.side === "runner",
  );
  const runnerDrawActions = actionSequence.filter(
    (entry) => entry.runnerDrawAction === true,
  ).length;
  const runnerRemoteTrashOpportunities = actionSequence.filter(
    (entry) => entry.runnerRemoteTrashOpportunity === true,
  ).length;
  const runnerRemoteTrashTaken = actionSequence.filter(
    (entry) => entry.runnerRemoteTrashTaken === true,
  ).length;
  const successfulRemoteAccesses = successfulRunActions.filter((entry) =>
    isRemoteServerTarget(entry.targetServerId),
  ).length;
  const remoteAccessesWithTrashableCards = actionSequence.filter(
    (entry) => entry.runnerRemoteAccessWithTrashableCard === true,
  ).length;
  const remoteAccessesWithRelevantTrashableCards = actionSequence.filter(
    (entry) => entry.runnerRemoteAccessWithRelevantTrashableCard === true,
  ).length;
  const affordableRelevantRemoteTrashOpportunities = actionSequence.filter(
    (entry) => entry.runnerAffordableRelevantRemoteTrashOpportunity === true,
  ).length;
  const relevantRemoteTrashTaken = actionSequence.filter(
    (entry) => entry.runnerRelevantRemoteTrashTaken === true,
  ).length;
  const skippedAffordableRelevantRemoteTrash = actionSequence.filter(
    (entry) => entry.runnerSkippedAffordableRelevantRemoteTrash === true,
  ).length;
  const remoteRunOpportunitiesAgainstAdvancedRemote = actionSequence.filter(
    (entry) => entry.runnerRemoteRunOpportunityAgainstAdvancedRemote === true,
  ).length;
  const remoteRunsAgainstAdvancedRemote = actionSequence.filter(
    (entry) => entry.runnerRemoteRunAgainstAdvancedRemote === true,
  ).length;
  const skippedAdvancedRemoteContest = actionSequence.filter(
    (entry) => entry.runnerSkippedAdvancedRemoteContest === true,
  ).length;
  const centralRunWhileRemoteScoreThreatVisible = actionSequence.filter(
    (entry) => entry.runnerCentralRunWhileRemoteScoreThreatVisible === true,
  ).length;
  const remoteContestCreditReserveAfterRun = averageNumber(
    actionSequence
      .map((entry) => entry.runnerRemoteContestCreditReserveAfterRun)
      .filter((value): value is number => typeof value === "number"),
  );
  const advancedRemoteThreatMetrics =
    summarizeAdvancedRemoteThreatMetrics(summaries);
  const runnerHandUseOpportunityWindows = actionSequence.filter(
    (entry) => entry.runnerHandUseOpportunity === true,
  ).length;
  const runnerHandUseActionsTaken = actionSequence.filter(
    (entry) => entry.runnerHandUseActionTaken === true,
  ).length;
  const runnerCreditEntries = actionSequence.filter(
    (entry) =>
      entry.side === "runner" &&
      typeof entry.runnerCreditsBefore === "number",
  );
  const runnerEndTurnCreditEntries = actionSequence.filter(
    (entry) =>
      entry.side === "runner" &&
      entry.actionType === "end_turn" &&
      typeof entry.runnerCreditsAfter === "number",
  );
  const runnerCreditReserveTargets = runnerCreditEntries
    .map((entry) => entry.runnerReserveTarget)
    .filter((value): value is number => typeof value === "number");
  const runnerCreditDeltas = runnerCreditEntries
    .map((entry) => entry.runnerCreditDelta)
    .filter((value): value is number => typeof value === "number");
  const runnerKnownPathRunEntries = runnerRuns.filter(
    (entry) => typeof entry.runKnownPathCostAtStart === "number",
  );
  return {
    games,
    actionLimitRate: round(
      summaries.filter((summary) => summary.winner === "action_limit_reached")
        .length / Math.max(games, 1),
    ),
    averageActions: round(
      summaries.reduce((sum, summary) => sum + summary.actions, 0) /
        Math.max(games, 1),
    ),
    averageTurns: round(
      summaries.reduce((sum, summary) => sum + summary.turns, 0) /
        Math.max(games, 1),
    ),
    runnerAgendaPoints: summaries.reduce(
      (sum, summary) => sum + summary.finalAgendaPoints.runner,
      0,
    ),
    corpAgendaPoints: summaries.reduce(
      (sum, summary) => sum + summary.finalAgendaPoints.corp,
      0,
    ),
    runnerSteals,
    corpScores,
    scoreActionsAvailable,
    scoreActionsTaken: corpScores,
    missedScoreWindows,
    scoreActionTakeRate:
      scoreActionsAvailable > 0 ? round(corpScores / scoreActionsAvailable) : 0,
    scoreOrStealActions: runnerSteals + corpScores,
    scoreOrStealActionsPerMatch: round(
      (runnerSteals + corpScores) / Math.max(games, 1),
    ),
    advancedAgendaSteals,
    advancedAgendaStealsFromRemote,
    advancedAgendaStealsFromCentral,
    finalAdvanceActions,
    unsafeFinalAdvanceActions,
    protectedFinalAdvanceActions,
    protectBeforeAdvanceActions,
    advanceThenScoreSameTurn,
    advanceThenRunnerStealBeforeNextCorpScore,
    remoteProtectionScoreAtFinalAdvance,
    runnerContestRiskAtFinalAdvance,
    centralPressureRuns: runnerRuns.filter(
      (entry) =>
        entry.targetServerId === "hq" ||
        entry.targetServerId === "rd" ||
        entry.targetServerId === "archives",
    ).length,
    hqPressureRuns: runnerRuns.filter((entry) => entry.targetServerId === "hq")
      .length,
    rdPressureRuns: runnerRuns.filter((entry) => entry.targetServerId === "rd")
      .length,
    archivesPressureRuns: runnerRuns.filter(
      (entry) => entry.targetServerId === "archives",
    ).length,
    remotePressureRuns: runnerRuns.filter((entry) =>
      isRemoteServerTarget(entry.targetServerId),
    ).length,
    successfulCentralRuns: successfulRunActions.filter(
      (entry) =>
        entry.targetServerId === "hq" ||
        entry.targetServerId === "rd" ||
        entry.targetServerId === "archives",
    ).length,
    centralAgendaSteals,
    hqAgendaSteals: centralAgendaStealEntries.filter(
      (entry) => entry.targetServerId === "hq",
    ).length,
    rndAgendaSteals: centralAgendaStealEntries.filter(
      (entry) => entry.targetServerId === "rd",
    ).length,
    archivesAgendaSteals: centralAgendaStealEntries.filter(
      (entry) => entry.targetServerId === "archives",
    ).length,
    centralStealsPerRun:
      runnerRuns.filter(
        (entry) =>
          entry.targetServerId === "hq" ||
          entry.targetServerId === "rd" ||
          entry.targetServerId === "archives",
      ).length > 0
        ? round(
            centralAgendaSteals /
              runnerRuns.filter(
                (entry) =>
                  entry.targetServerId === "hq" ||
                  entry.targetServerId === "rd" ||
                  entry.targetServerId === "archives",
              ).length,
          )
        : 0,
    centralRunsWithMultiaccess: runnerRuns.filter(
      (entry) => entry.runnerCentralRunWithMultiaccess === true,
    ).length,
    centralRunsWithInterfaceInstalled: runnerRuns.filter(
      (entry) => entry.runnerCentralRunWithInterfaceInstalled === true,
    ).length,
    hqRunsWithHqInterface: runnerRuns.filter(
      (entry) => entry.runnerHqRunWithHqInterface === true,
    ).length,
    rndRunsWithRndInterface: runnerRuns.filter(
      (entry) => entry.runnerRndRunWithRndInterface === true,
    ).length,
    centralRunEventsPlayed: actionSequence.filter(
      (entry) => entry.runnerCentralRunEventPlayed === true,
    ).length,
    centralRunEventsWithGoodTarget: actionSequence.filter(
      (entry) => entry.runnerCentralRunEventWithGoodTarget === true,
    ).length,
    repeatedLowValueCentralRuns: runnerRuns.filter(
      (entry) => entry.runnerRepeatedLowValueCentralRun === true,
    ).length,
    centralRunStreakWithoutValue: Math.max(
      0,
      ...runnerRuns.map((entry) => entry.runnerCentralRunStreakWithoutValue ?? 0),
    ),
    centralRunStartedWithInsufficientPostRunReserve: runnerRuns.filter(
      (entry) =>
        entry.runnerCentralRunStartedWithInsufficientPostRunReserve === true,
    ).length,
    centralCloseoutOpportunities: actionSequence.filter(
      (entry) => entry.runnerCentralCloseoutOpportunity === true,
    ).length,
    centralCloseoutRunsTaken: runnerRuns.filter(
      (entry) => entry.runnerCentralCloseoutRunTaken === true,
    ).length,
    centralCloseoutSuccesses: actionSequence.filter(
      (entry) => entry.runnerCentralCloseoutSuccess === true,
    ).length,
    interfaceInstallOpportunities: actionSequence.filter(
      (entry) => entry.runnerInterfaceInstallOpportunity === true,
    ).length,
    interfaceInstallsTaken: actionSequence.filter(
      (entry) => entry.runnerInterfaceInstallTaken === true,
    ).length,
    interfaceInstalledButUnusedTurns: actionSequence.filter(
      (entry) => entry.runnerInterfaceInstalledButUnusedTurn === true,
    ).length,
    successfulRemoteRuns: successfulRunActions.filter((entry) =>
      isRemoteServerTarget(entry.targetServerId),
    ).length,
    successfulRemoteAccesses,
    remoteTrashActions,
    remoteAccessesWithTrashableCards,
    remoteAccessesWithRelevantTrashableCards,
    affordableRelevantRemoteTrashOpportunities,
    relevantRemoteTrashTaken,
    relevantRemoteTrashTakeRate:
      affordableRelevantRemoteTrashOpportunities > 0
        ? round(
            relevantRemoteTrashTaken /
              affordableRelevantRemoteTrashOpportunities,
          )
        : 0,
    skippedAffordableRelevantRemoteTrash,
    remoteTrashTargetsAssetNode: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashTargetType === "asset_node",
    ).length,
    remoteTrashTargetsUpgrade: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashTargetType === "upgrade",
    ).length,
    remoteTrashTargetsIce: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashTargetType === "ice",
    ).length,
    remoteTrashTargetsUnknown: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashTargetType === "unknown",
    ).length,
    remoteTrashRoleEconomy: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashRole === "economy",
    ).length,
    remoteTrashRoleScoringProtection: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashRole === "scoring_protection",
    ).length,
    remoteTrashRoleTagPunish: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashRole === "tag_punish",
    ).length,
    remoteTrashRoleAmbush: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashRole === "ambush",
    ).length,
    remoteTrashRoleLowValue: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashRole === "low_value",
    ).length,
    remoteRunOpportunitiesAgainstAdvancedRemote,
    remoteRunsAgainstAdvancedRemote,
    skippedAdvancedRemoteContest,
    centralRunWhileRemoteScoreThreatVisible,
    remoteContestCreditReserveAfterRun,
    uniqueAdvancedRemoteThreats:
      advancedRemoteThreatMetrics.uniqueAdvancedRemoteThreats,
    contestableAdvancedRemoteThreats:
      advancedRemoteThreatMetrics.contestableAdvancedRemoteThreats,
    advancedRemoteThreatsContested:
      advancedRemoteThreatMetrics.advancedRemoteThreatsContested,
    advancedRemoteThreatContestRate:
      advancedRemoteThreatMetrics.advancedRemoteThreatContestRate,
    skippedContestableAdvancedRemoteThreats:
      advancedRemoteThreatMetrics.skippedContestableAdvancedRemoteThreats,
    centralRunInsteadOfContestableAdvancedRemote:
      advancedRemoteThreatMetrics.centralRunInsteadOfContestableAdvancedRemote,
    centralRunInsteadWasJustified:
      advancedRemoteThreatMetrics.centralRunInsteadWasJustified,
    centralRunBurnedRemoteContestReserve:
      advancedRemoteThreatMetrics.centralRunBurnedRemoteContestReserve,
    remoteContestBlockedByCredits:
      advancedRemoteThreatMetrics.remoteContestBlockedByCredits,
    remoteContestBlockedByPostRunReserve:
      advancedRemoteThreatMetrics.remoteContestBlockedByPostRunReserve,
    remoteContestBlockedByBreakerCoverage:
      advancedRemoteThreatMetrics.remoteContestBlockedByBreakerCoverage,
    remoteContestBlockedByKnownIceCost:
      advancedRemoteThreatMetrics.remoteContestBlockedByKnownIceCost,
    remoteContestDeclinedAsBaitOrLowValue:
      advancedRemoteThreatMetrics.remoteContestDeclinedAsBaitOrLowValue,
    repeatedCentralRunsWhileSameRemoteThreat:
      advancedRemoteThreatMetrics.repeatedCentralRunsWhileSameRemoteThreat,
    remoteRunStartedWithInsufficientPostRunReserve:
      advancedRemoteThreatMetrics.remoteRunStartedWithInsufficientPostRunReserve,
    remoteRunStartedWithSufficientPostRunReserve:
      advancedRemoteThreatMetrics.remoteRunStartedWithSufficientPostRunReserve,
    turnsFromRemoteThreatCreatedToContest:
      advancedRemoteThreatMetrics.turnsFromRemoteThreatCreatedToContest,
    turnsFromRemoteThreatCreatedToScoreOrSteal:
      advancedRemoteThreatMetrics.turnsFromRemoteThreatCreatedToScoreOrSteal,
    remoteContestActions:
      runnerRuns.filter((entry) => isRemoteServerTarget(entry.targetServerId))
        .length + remoteTrashActions,
    pressureTargetSwitches,
    distinctPressureTargets: new Set(pressureTargets).size,
    remoteInstalls: remoteRootInstalls + remoteIceInstalls,
    remoteRootInstalls,
    remoteIceInstalls,
    remoteAdvances,
    advancedAgendaInstalledInRemote: remoteAgendaAdvancementActions,
    advancementActionsOnAgendas,
    advancementActionsOnAssets,
    advancementActionsOnUpgrades,
    advancementActionsOnUnknown,
    remoteBuildActions,
    remoteAdvanceActions: remoteAdvances,
    scoreWindowActions: corpScores,
    scoringRemoteDevelopmentActions:
      remoteRootInstalls + remoteIceInstalls + remoteAdvances + rezIceDuringRun,
    rezIceDuringRun,
    scoreWindows: corpScores,
    turnsToFirstCorpScore,
    turnsToFirstAgendaSteal,
    turnsFromFirstAdvanceToScore,
    turnsFromFinalAdvanceToScoreOrSteal:
      averageTurnsFromFinalAdvanceToScoreOrSteal(summaries),
    runnerDrawActions,
    runnerDrawActionShare: round(
      runnerDrawActions / Math.max(runnerDecisionActions.length, 1),
    ),
    clickDrawActions: actionSequence.filter(
      (entry) => entry.runnerClickDrawAction === true,
    ).length,
    cardEffectDrawActions: actionSequence.filter(
      (entry) => entry.runnerCardEffectDrawAction === true,
    ).length,
    drawWhileHoldingPlayableEconomy: actionSequence.filter(
      (entry) => entry.runnerDrawWhileHoldingPlayableEconomy === true,
    ).length,
    drawWhileHoldingInstallableBreaker: actionSequence.filter(
      (entry) => entry.runnerDrawWhileHoldingInstallableBreaker === true,
    ).length,
    drawWhileHoldingRunnablePressureCard: actionSequence.filter(
      (entry) => entry.runnerDrawWhileHoldingRunnablePressureCard === true,
    ).length,
    drawWhileRemoteTrashAvailable: actionSequence.filter(
      (entry) => entry.runnerDrawWhileRemoteTrashAvailable === true,
    ).length,
    drawThenDiscardSameTurn: countRunnerDrawThenDiscardSameTurn(summaries),
    discardedPlayableEconomy: actionSequence.filter(
      (entry) => entry.runnerDiscardedPlayableEconomy === true,
    ).length,
    discardedInstallableBreaker: actionSequence.filter(
      (entry) => entry.runnerDiscardedInstallableBreaker === true,
    ).length,
    discardedRunPressureCard: actionSequence.filter(
      (entry) => entry.runnerDiscardedRunPressureCard === true,
    ).length,
    runnerInstallActions: actionSequence.filter(
      (entry) => entry.runnerInstallAction === true,
    ).length,
    runnerDuplicateInstallActions: actionSequence.filter(
      (entry) => entry.runnerDuplicateInstallAction === true,
    ).length,
    runnerLowValueDuplicateInstallActions: actionSequence.filter(
      (entry) => entry.runnerLowValueDuplicateInstallAction === true,
    ).length,
    runnerJunkyardBbsDuplicateInstalls: actionSequence.filter(
      (entry) => entry.runnerJunkyardBbsDuplicateInstall === true,
    ).length,
    runnerEconomyActionsTaken: actionSequence.filter(
      (entry) => entry.runnerEconomyActionTaken === true,
    ).length,
    runnerRigInstallActions: actionSequence.filter(
      (entry) => entry.runnerRigInstallAction === true,
    ).length,
    runnerRemoteTrashOpportunities,
    runnerRemoteTrashTaken,
    handUseRate:
      runnerHandUseOpportunityWindows > 0
        ? round(runnerHandUseActionsTaken / runnerHandUseOpportunityWindows)
        : 0,
    runnerAverageCredits: averageNumber(
      runnerCreditEntries.map((entry) => entry.runnerCreditsBefore ?? 0),
    ),
    runnerMedianCredits: medianNumber(
      runnerCreditEntries.map((entry) => entry.runnerCreditsBefore ?? 0),
    ),
    runnerEndTurnAverageCredits: averageNumber(
      runnerEndTurnCreditEntries.map((entry) => entry.runnerCreditsAfter ?? 0),
    ),
    runnerEndTurnCreditsBelowReserve: runnerEndTurnCreditEntries.filter(
      (entry) => entry.runnerBelowReserveAfter === true,
    ).length,
    runnerCreditReserveTargetAverage: averageNumber(runnerCreditReserveTargets),
    runnerTurnsBelowContestReserve: runnerCreditEntries.filter(
      (entry) => entry.runnerBelowReserveBefore === true,
    ).length,
    runnerEconomyCreditsGained: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerEconomyCreditsGained ?? 0),
      0,
    ),
    runnerEconomyCreditsSpent: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerEconomyCreditsSpent ?? 0),
      0,
    ),
    runnerNetCreditDeltaPerTurn: round(
      runnerCreditDeltas.reduce((sum, delta) => sum + delta, 0) /
        Math.max(
          summaries.reduce((sum, summary) => sum + summary.turns, 0),
          1,
        ),
    ),
    runnerRunsStartedBelowReserve: runnerRuns.filter(
      (entry) => entry.runnerRunStartedBelowReserve === true,
    ).length,
    runnerRemoteRunsStartedBelowReserve: runnerRuns.filter(
      (entry) => entry.runnerRemoteRunStartedBelowReserve === true,
    ).length,
    runnerCentralRunsStartedBelowReserve: runnerRuns.filter(
      (entry) => entry.runnerCentralRunStartedBelowReserve === true,
    ).length,
    runnerContestBlockedByCredits: actionSequence.filter(
      (entry) => entry.runnerContestBlockedByCredits === true,
    ).length,
    runnerTrashBlockedByCredits: actionSequence.filter(
      (entry) => entry.runnerTrashBlockedByCredits === true,
    ).length,
    runnerStealBlockedByCredits: actionSequence.filter(
      (entry) => entry.runnerStealBlockedByCredits === true,
    ).length,
    runnerSpendBelowReserveActions: actionSequence.filter(
      (entry) => entry.runnerSpendBelowReserve === true,
    ).length,
    runnerLowValueSpendBelowReserve: actionSequence.filter(
      (entry) => entry.runnerLowValueSpendBelowReserve === true,
    ).length,
    runnerExpensiveInstallBelowReserve: actionSequence.filter(
      (entry) => entry.runnerExpensiveInstallBelowReserve === true,
    ).length,
    runnerReservePreservingEconomyActions: actionSequence.filter(
      (entry) => entry.runnerReservePreservingEconomy === true,
    ).length,
    runnerReserveAfterSuccessfulRun: averageNumber(
      actionSequence
        .map((entry) => entry.runnerReserveAfterSuccessfulRun)
        .filter((value): value is number => typeof value === "number"),
    ),
    runnerReserveAfterRemoteAccess: averageNumber(
      actionSequence
        .map((entry) => entry.runnerReserveAfterRemoteAccess)
        .filter((value): value is number => typeof value === "number"),
    ),
    runnerReserveAfterCentralRun: averageNumber(
      actionSequence
        .map((entry) => entry.runnerReserveAfterCentralRun)
        .filter((value): value is number => typeof value === "number"),
    ),
    runnerReserveBeforeAdvancedRemoteContest: averageNumber(
      actionSequence
        .map((entry) => entry.runnerReserveBeforeAdvancedRemoteContest)
        .filter((value): value is number => typeof value === "number"),
    ),
    runsStartedAgainstKnownUnaffordablePath: runnerRuns.filter(
      (entry) => entry.runStartedAgainstKnownUnaffordablePath === true,
    ).length,
    remoteRunsStartedAgainstKnownUnaffordablePath: runnerRuns.filter(
      (entry) => entry.remoteRunStartedAgainstKnownUnaffordablePath === true,
    ).length,
    centralRunsStartedAgainstKnownUnaffordablePath: runnerRuns.filter(
      (entry) => entry.centralRunStartedAgainstKnownUnaffordablePath === true,
    ).length,
    runsEndedAfterFirstIceDueToCredits: actionSequence.filter(
      (entry) => entry.runEndedAfterFirstIceDueToCredits === true,
    ).length,
    creditsMissingForKnownPath: averageNumber(
      runnerKnownPathRunEntries
        .map((entry) => entry.runCreditsMissingForKnownPath)
        .filter((value): value is number => typeof value === "number"),
    ),
    knownPathCostAtRunStart: averageNumber(
      runnerKnownPathRunEntries
        .map((entry) => entry.runKnownPathCostAtStart)
        .filter((value): value is number => typeof value === "number"),
    ),
    creditsAfterKnownPathEstimate: averageNumber(
      runnerKnownPathRunEntries
        .map((entry) => entry.runCreditsAfterKnownPathEstimate)
        .filter((value): value is number => typeof value === "number"),
    ),
    runStartedWithInsufficientStealOrTrashReserve: runnerRuns.filter(
      (entry) => entry.runStartedWithInsufficientStealOrTrashReserve === true,
    ).length,
    probeRunsWithPositiveInfoValue: runnerRuns.filter(
      (entry) => entry.probeRunWithPositiveInfoValue === true,
    ).length,
    lowValueUnaffordableRuns: runnerRuns.filter(
      (entry) => entry.lowValueUnaffordableRun === true,
    ).length,
    illegalActions: summaries.reduce(
      (sum, summary) => sum + summary.metrics.illegalActions,
      0,
    ),
    replayFailures: summaries.filter((summary) => !summary.replayOk).length,
    fallbackRate: round(
      actionSequence.filter((entry) => entry.fallbackUsed).length /
        totalActions,
    ),
    timeoutRate: round(
      actionSequence.filter((entry) => entry.timeoutUsed).length / totalActions,
    ),
  };
}

function diffMatchProgressionMetrics(
  candidate: AiMatchProgressionMetrics,
  baseline: AiMatchProgressionMetrics,
): AiMatchProgressionMetrics {
  return MATCH_PROGRESSION_METRIC_KEYS.reduce((delta, key) => {
    delta[key] = round(candidate[key] - baseline[key]);
    return delta;
  }, {} as AiMatchProgressionMetrics);
}

function progressionEntriesWithRunTargets(
  actionSequence: AiSimulationSummary["actionSequence"],
): AiSimulationSummary["actionSequence"] {
  let currentRunTarget: string | undefined;
  return actionSequence.map((entry) => {
    if (entry.side === "runner" && entry.actionType === "start_run") {
      currentRunTarget = entry.targetServerId;
      return entry;
    }
    if (
      entry.side === "runner" &&
      !entry.targetServerId &&
      [
        "access_card",
        "steal_agenda",
        "trash_accessed_card",
        "decline_trash",
        "jack_out",
      ].includes(entry.actionType) &&
      currentRunTarget
    ) {
      return { ...entry, targetServerId: currentRunTarget };
    }
    return entry;
  });
}

function averageFirstProgressionTurn(
  summaries: AiSimulationSummary[],
  predicate: (entry: AiSimulationSummary["actionSequence"][number]) => boolean,
): number {
  const observedTurns = summaries
    .map(
      (summary) =>
        progressionEntriesWithRunTargets(summary.actionSequence).find(predicate)
          ?.turnNumber ?? 0,
    )
    .filter((turn) => turn > 0);
  if (observedTurns.length === 0) return 0;
  return round(
    observedTurns.reduce((sum, turn) => sum + turn, 0) / observedTurns.length,
  );
}

function averageTurnsFromFirstAdvanceToScore(
  summaries: AiSimulationSummary[],
): number {
  const deltas = summaries
    .map((summary) => {
      const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
      const firstAdvance = sequence.find(
        (entry) =>
          isCorpRemoteAdvancementProgress(entry) &&
          (entry.advancementTargetTypes?.includes("agenda") ||
            entry.targetCardType === "agenda"),
      );
      if (!firstAdvance?.turnNumber) return undefined;
      const firstScore = sequence.find(
        (entry) =>
          entry.side === "corp" &&
          entry.actionType === "score_agenda" &&
          (entry.turnNumber ?? 0) >= firstAdvance.turnNumber!,
      );
      if (!firstScore?.turnNumber) return undefined;
      return Math.max(0, firstScore.turnNumber - firstAdvance.turnNumber);
    })
    .filter((value): value is number => typeof value === "number");
  if (deltas.length === 0) return 0;
  return round(deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length);
}

function countFinalAdvancesResolvedBySameTurnCorpScore(
  summaries: AiSimulationSummary[],
): number {
  return summaries.reduce((count, summary) => {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    return (
      count +
      sequence.filter((entry, index) => {
        if (entry.side !== "corp" || entry.finalAdvance !== true) return false;
        return sequence
          .slice(index + 1)
          .some(
            (later) =>
              later.side === "corp" &&
              later.actionType === "score_agenda" &&
              later.turnNumber === entry.turnNumber,
          );
      }).length
    );
  }, 0);
}

function countFinalAdvancesStolenBeforeCorpScore(
  summaries: AiSimulationSummary[],
): number {
  return summaries.reduce((count, summary) => {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    return (
      count +
      sequence.filter((entry, index) => {
        if (entry.side !== "corp" || entry.finalAdvance !== true) return false;
        const later = sequence
          .slice(index + 1)
          .find(
            (candidate) =>
              candidate.actionType === "score_agenda" ||
              candidate.actionType === "steal_agenda",
          );
        return later?.actionType === "steal_agenda";
      }).length
    );
  }, 0);
}

function countRunnerDrawThenDiscardSameTurn(
  summaries: AiSimulationSummary[],
): number {
  return summaries.reduce((count, summary) => {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    return (
      count +
      sequence.filter((entry, index) => {
        if (entry.side !== "runner" || entry.runnerDrawAction !== true)
          return false;
        return sequence
          .slice(index + 1)
          .some(
            (later) =>
              later.side === "runner" &&
              later.runnerDiscardChoice === true &&
              later.turnNumber === entry.turnNumber,
          );
      }).length
    );
  }, 0);
}

function averageFinalAdvanceNumber(
  entries: AiSimulationSummary["actionSequence"],
  key: "remoteProtectionScore",
): number {
  const values = entries
    .map((entry) => entry[key])
    .filter((value): value is number => typeof value === "number");
  if (values.length === 0) return 0;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function averageRunnerContestRisk(
  entries: AiSimulationSummary["actionSequence"],
): number {
  const values = entries
    .map((entry): number | undefined => {
      if (entry.runnerContestRisk === "high") return 1;
      if (entry.runnerContestRisk === "medium") return 0.5;
      if (entry.runnerContestRisk === "low") return 0;
      return undefined;
    })
    .filter((value): value is number => typeof value === "number");
  if (values.length === 0) return 0;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function summarizeAdvancedRemoteThreatMetrics(
  summaries: AiSimulationSummary[],
): Pick<
  AiMatchProgressionMetrics,
  | "uniqueAdvancedRemoteThreats"
  | "contestableAdvancedRemoteThreats"
  | "advancedRemoteThreatsContested"
  | "advancedRemoteThreatContestRate"
  | "skippedContestableAdvancedRemoteThreats"
  | "centralRunInsteadOfContestableAdvancedRemote"
  | "centralRunInsteadWasJustified"
  | "centralRunBurnedRemoteContestReserve"
  | "remoteContestBlockedByCredits"
  | "remoteContestBlockedByPostRunReserve"
  | "remoteContestBlockedByBreakerCoverage"
  | "remoteContestBlockedByKnownIceCost"
  | "remoteContestDeclinedAsBaitOrLowValue"
  | "repeatedCentralRunsWhileSameRemoteThreat"
  | "remoteRunStartedWithInsufficientPostRunReserve"
  | "remoteRunStartedWithSufficientPostRunReserve"
  | "turnsFromRemoteThreatCreatedToContest"
  | "turnsFromRemoteThreatCreatedToScoreOrSteal"
> {
  const threatKeys = new Set<string>();
  const contestableKeys = new Set<string>();
  const contestedKeys = new Set<string>();
  const centralInsteadKeys = new Set<string>();
  const centralJustifiedKeys = new Set<string>();
  const centralBurnedKeys = new Set<string>();
  const blockedCreditKeys = new Set<string>();
  const blockedPostRunKeys = new Set<string>();
  const blockedBreakerKeys = new Set<string>();
  const blockedKnownIceKeys = new Set<string>();
  const baitLowValueKeys = new Set<string>();
  const repeatedCentralKeys = new Set<string>();
  const threatFirstTurn = new Map<string, number>();
  const contestDeltas: number[] = [];
  const resolveDeltas: number[] = [];
  let insufficientPostRunStarts = 0;
  let sufficientPostRunStarts = 0;

  for (const summary of summaries) {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    for (const entry of sequence) {
      const turn = entry.turnNumber ?? 0;
      for (const serverId of entry.runnerAdvancedRemoteThreatServerIds ?? []) {
        const key = `${summary.seed}|${turn}|${serverId}`;
        threatKeys.add(key);
        const persistentKey = `${summary.seed}|${serverId}`;
        if (!threatFirstTurn.has(persistentKey)) {
          threatFirstTurn.set(persistentKey, turn);
        }
      }
      for (const serverId of entry.runnerContestableAdvancedRemoteThreatServerIds ?? []) {
        const key = `${summary.seed}|${turn}|${serverId}`;
        contestableKeys.add(key);
        if (entry.runnerRemoteContestBlockedByCredits) blockedCreditKeys.add(key);
        if (entry.runnerRemoteContestBlockedByPostRunReserve)
          blockedPostRunKeys.add(key);
        if (entry.runnerRemoteContestBlockedByBreakerCoverage)
          blockedBreakerKeys.add(key);
        if (entry.runnerRemoteContestBlockedByKnownIceCost)
          blockedKnownIceKeys.add(key);
        if (entry.runnerRemoteContestDeclinedAsBaitOrLowValue)
          baitLowValueKeys.add(key);
        if (entry.runnerCentralRunInsteadOfContestableAdvancedRemote)
          centralInsteadKeys.add(key);
        if (entry.runnerCentralRunInsteadWasJustified) centralJustifiedKeys.add(key);
        if (entry.runnerCentralRunBurnedRemoteContestReserve)
          centralBurnedKeys.add(key);
        if (entry.runnerRepeatedCentralRunWhileSameRemoteThreat)
          repeatedCentralKeys.add(key);
      }
      if (entry.runnerContestedAdvancedRemoteServerId) {
        const serverId = entry.runnerContestedAdvancedRemoteServerId;
        contestedKeys.add(`${summary.seed}|${turn}|${serverId}`);
        const first = threatFirstTurn.get(`${summary.seed}|${serverId}`);
        if (first !== undefined) contestDeltas.push(Math.max(0, turn - first));
      }
      if (
        entry.actionType === "score_agenda" ||
        (entry.actionType === "steal_agenda" &&
          entry.advancedAgendaStealSource === "remote")
      ) {
        const serverId = entry.targetServerId;
        if (serverId) {
          const first = threatFirstTurn.get(`${summary.seed}|${serverId}`);
          if (first !== undefined) resolveDeltas.push(Math.max(0, turn - first));
        }
      }
      if (entry.runnerRemoteRunStartedWithInsufficientPostRunReserve)
        insufficientPostRunStarts += 1;
      if (entry.runnerRemoteRunStartedWithSufficientPostRunReserve)
        sufficientPostRunStarts += 1;
    }
  }

  const skippedContestable = [...contestableKeys].filter(
    (key) => !contestedKeys.has(key),
  ).length;
  return {
    uniqueAdvancedRemoteThreats: threatKeys.size,
    contestableAdvancedRemoteThreats: contestableKeys.size,
    advancedRemoteThreatsContested: contestedKeys.size,
    advancedRemoteThreatContestRate:
      contestableKeys.size > 0 ? round(contestedKeys.size / contestableKeys.size) : 0,
    skippedContestableAdvancedRemoteThreats: skippedContestable,
    centralRunInsteadOfContestableAdvancedRemote: centralInsteadKeys.size,
    centralRunInsteadWasJustified: centralJustifiedKeys.size,
    centralRunBurnedRemoteContestReserve: centralBurnedKeys.size,
    remoteContestBlockedByCredits: blockedCreditKeys.size,
    remoteContestBlockedByPostRunReserve: blockedPostRunKeys.size,
    remoteContestBlockedByBreakerCoverage: blockedBreakerKeys.size,
    remoteContestBlockedByKnownIceCost: blockedKnownIceKeys.size,
    remoteContestDeclinedAsBaitOrLowValue: baitLowValueKeys.size,
    repeatedCentralRunsWhileSameRemoteThreat: repeatedCentralKeys.size,
    remoteRunStartedWithInsufficientPostRunReserve: insufficientPostRunStarts,
    remoteRunStartedWithSufficientPostRunReserve: sufficientPostRunStarts,
    turnsFromRemoteThreatCreatedToContest: averageNumber(contestDeltas),
    turnsFromRemoteThreatCreatedToScoreOrSteal: averageNumber(resolveDeltas),
  };
}

function averageNumber(values: number[]): number {
  if (values.length === 0) return 0;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function medianNumber(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = values.slice().sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return round(sorted[middle] ?? 0);
  return round(((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2);
}

function averageTurnsFromFinalAdvanceToScoreOrSteal(
  summaries: AiSimulationSummary[],
): number {
  const deltas = summaries.flatMap((summary) => {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    return sequence
      .map((entry, index) => {
        if (entry.side !== "corp" || entry.finalAdvance !== true)
          return undefined;
        const later = sequence
          .slice(index + 1)
          .find(
            (candidate) =>
              candidate.actionType === "score_agenda" ||
              candidate.actionType === "steal_agenda",
          );
        if (!later?.turnNumber || !entry.turnNumber) return undefined;
        return Math.max(0, later.turnNumber - entry.turnNumber);
      })
      .filter((value): value is number => typeof value === "number");
  });
  if (deltas.length === 0) return 0;
  return round(deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length);
}

function isRemoteServerTarget(serverId: string | undefined): boolean {
  return serverId === "new_remote" || serverId?.startsWith("remote_") === true;
}

function isCorpRemoteAdvancementProgress(
  entry: AiSimulationSummary["actionSequence"][number],
): boolean {
  if (entry.side !== "corp") return false;
  if (!isRemoteServerTarget(entry.targetServerId)) return false;
  if (entry.actionType === "advance_card") return true;
  return (entry.advancementCountersAdded ?? 0) > 0;
}

function targetServerIdForSimulationAction(
  action: LegalAction,
  event: PublicGameEvent,
  stateBeforeAction: GameState,
): string | undefined {
  if (typeof action.payload?.serverId === "string")
    return action.payload.serverId;
  if (typeof event.publicPayload.serverId === "string")
    return event.publicPayload.serverId;
  if (typeof action.payload?.targetServerId === "string")
    return action.payload.targetServerId;
  if (typeof event.publicPayload.targetServerId === "string")
    return event.publicPayload.targetServerId;
  const cardId =
    typeof action.payload?.cardId === "string"
      ? action.payload.cardId
      : typeof event.publicPayload.targetCardId === "string"
        ? event.publicPayload.targetCardId
        : undefined;
  if (cardId) return serverIdForCorpInstalledCard(stateBeforeAction, cardId);
  return undefined;
}

function targetCardIdsForSimulationAction(
  input: AiDecisionInput,
  decision: AiDecision,
  action: LegalAction,
  event: PublicGameEvent,
  stateBeforeAction: GameState,
): CardInstanceId[] {
  const ids = [
    action.payload?.cardId,
    action.payload?.targetCardId,
    event.publicPayload.cardId,
    event.publicPayload.targetCardId,
    event.publicPayload.exposedCardInstanceId,
    ...(action.type === "steal_agenda" && stateBeforeAction.run?.accessedCardId
      ? [stateBeforeAction.run.accessedCardId]
      : []),
    ...(["trash_accessed_card", "decline_trash"].includes(action.type) &&
    stateBeforeAction.run?.accessedCardId
      ? [stateBeforeAction.run.accessedCardId]
      : []),
    ...selectedChoiceTargetCardIds(input, decision),
  ].filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
  return sortedUnique(ids).filter((cardId): cardId is CardInstanceId =>
    Boolean(stateBeforeAction.cardInstances[cardId]),
  );
}

function selectedChoiceTargetCardIds(
  input: AiDecisionInput,
  decision: AiDecision,
): string[] {
  const selected = decision.selectedChoices as
    | { choiceId?: unknown; selectedOptionIds?: unknown }
    | undefined;
  const choice = input.playerView.pendingChoice;
  if (
    !selected ||
    !choice ||
    selected.choiceId !== choice.choiceId ||
    !Array.isArray(selected.selectedOptionIds)
  )
    return [];
  const selectedIds = new Set(
    selected.selectedOptionIds.filter(
      (optionId): optionId is string => typeof optionId === "string",
    ),
  );
  return choice.options
    .filter((option) => selectedIds.has(option.id))
    .flatMap((option) => String(option.value ?? "").split("|"))
    .map((entry) => entry.split(":")[0]?.trim() ?? "")
    .filter(Boolean);
}

function runnerHandUseDiagnosticsForSimulationAction(
  input: AiDecisionInput,
  decision: AiDecision,
  action: LegalAction,
  targetServerId: string | undefined,
): Partial<AiSimulationSummary["actionSequence"][number]> {
  if (input.side !== "runner" || action.side !== "runner") return {};
  const draw = runnerDrawKindForSimulationAction(input, action);
  const playableEconomy = hasRunnerPlayableEconomyAction(input, action.actionId);
  const installableBreaker = hasRunnerInstallableBreakerAction(
    input,
    action.actionId,
  );
  const runnablePressure = hasRunnerRunnablePressureAction(
    input,
    action.actionId,
  );
  const remoteTrashAvailable = hasRunnerRemoteTrashAction(input);
  const discardRoles = runnerDiscardChoiceRoles(input, decision);
  const installAction = action.type === "install_card";
  const duplicateInstall = installAction && isRunnerDuplicateInstall(input, action);
  const lowValueDuplicate =
    duplicateInstall && isRunnerLowValueDuplicateInstall(input, action);
  const economyActionTaken = isRunnerEconomyAction(input, action);
  const rigInstallAction = installAction && isRunnerRigInstallAction(input, action);
  const pressureActionTaken = isRunnerPressureAction(input, action);
  const remoteTrashTaken =
    action.type === "trash_accessed_card" &&
    isRemoteServerTarget(targetServerId ?? input.playerView.run?.attackedServerId);
  const remoteTrash = runnerRemoteTrashAccessContext(input, action);
  const advancedRemoteContest =
    runnerAdvancedRemoteContestContext(input, action, targetServerId);
  const handUseOpportunity =
    playableEconomy ||
    installableBreaker ||
    runnablePressure ||
    remoteTrashAvailable;
  const handUseActionTaken =
    economyActionTaken || rigInstallAction || pressureActionTaken || remoteTrashTaken;

  return {
    ...(draw.draw ? { runnerDrawAction: true } : {}),
    ...(draw.click ? { runnerClickDrawAction: true } : {}),
    ...(draw.cardEffect ? { runnerCardEffectDrawAction: true } : {}),
    ...(draw.draw && playableEconomy
      ? { runnerDrawWhileHoldingPlayableEconomy: true }
      : {}),
    ...(draw.draw && installableBreaker
      ? { runnerDrawWhileHoldingInstallableBreaker: true }
      : {}),
    ...(draw.draw && runnablePressure
      ? { runnerDrawWhileHoldingRunnablePressureCard: true }
      : {}),
    ...(draw.draw && remoteTrashAvailable
      ? { runnerDrawWhileRemoteTrashAvailable: true }
      : {}),
    ...(discardRoles.length > 0 ? { runnerDiscardChoice: true } : {}),
    ...(discardRoles.some((role) => isRunnerEconomyRole(role))
      ? { runnerDiscardedPlayableEconomy: true }
      : {}),
    ...(discardRoles.some((role) => role.startsWith("breaker_"))
      ? { runnerDiscardedInstallableBreaker: true }
      : {}),
    ...(discardRoles.some((role) => isRunnerPressureRole(role))
      ? { runnerDiscardedRunPressureCard: true }
      : {}),
    ...(installAction ? { runnerInstallAction: true } : {}),
    ...(duplicateInstall ? { runnerDuplicateInstallAction: true } : {}),
    ...(lowValueDuplicate ? { runnerLowValueDuplicateInstallAction: true } : {}),
    ...(duplicateInstall &&
    sourceDefinitionIdForSimulationAction(input, action) ===
      "onr_v1_165_junkyard-bbs"
      ? { runnerJunkyardBbsDuplicateInstall: true }
      : {}),
    ...(economyActionTaken ? { runnerEconomyActionTaken: true } : {}),
    ...(rigInstallAction ? { runnerRigInstallAction: true } : {}),
    ...(pressureActionTaken ? { runnerPressureActionTaken: true } : {}),
    ...(remoteTrashAvailable ? { runnerRemoteTrashOpportunity: true } : {}),
    ...(remoteTrashTaken ? { runnerRemoteTrashTaken: true } : {}),
    ...(remoteTrash.trashable
      ? { runnerRemoteAccessWithTrashableCard: true }
      : {}),
    ...(remoteTrash.relevant
      ? { runnerRemoteAccessWithRelevantTrashableCard: true }
      : {}),
    ...(remoteTrash.affordableRelevant
      ? { runnerAffordableRelevantRemoteTrashOpportunity: true }
      : {}),
    ...(remoteTrash.relevantTaken ? { runnerRelevantRemoteTrashTaken: true } : {}),
    ...(remoteTrash.skippedAffordableRelevant
      ? { runnerSkippedAffordableRelevantRemoteTrash: true }
      : {}),
    ...(remoteTrash.targetType
      ? { runnerRemoteTrashTargetType: remoteTrash.targetType }
      : {}),
    ...(remoteTrash.role ? { runnerRemoteTrashRole: remoteTrash.role } : {}),
    ...(advancedRemoteContest.opportunity
      ? { runnerRemoteRunOpportunityAgainstAdvancedRemote: true }
      : {}),
    ...(advancedRemoteContest.taken
      ? { runnerRemoteRunAgainstAdvancedRemote: true }
      : {}),
    ...(advancedRemoteContest.skipped
      ? { runnerSkippedAdvancedRemoteContest: true }
      : {}),
    ...(advancedRemoteContest.centralWhileThreat
      ? { runnerCentralRunWhileRemoteScoreThreatVisible: true }
      : {}),
    ...(typeof advancedRemoteContest.reserveAfterRun === "number"
      ? {
          runnerRemoteContestCreditReserveAfterRun:
            advancedRemoteContest.reserveAfterRun,
        }
      : {}),
    ...(handUseOpportunity ? { runnerHandUseOpportunity: true } : {}),
    ...(handUseActionTaken ? { runnerHandUseActionTaken: true } : {}),
  };
}

function runnerCentralPressureDiagnosticsForSimulationAction(
  input: AiDecisionInput,
  action: LegalAction,
  targetServerId: string | undefined,
): Partial<AiSimulationSummary["actionSequence"][number]> {
  if (input.side !== "runner" || action.side !== "runner") return {};
  const centralTarget = centralServerId(
    targetServerId ?? input.playerView.run?.attackedServerId,
  );
  const installedInterfaceTargets = new Set(
    (input.playerView.own.rig ?? [])
      .filter((card) => isCentralPressureCardForMetrics(card.definitionId, true))
      .flatMap((card) => centralPressureTargetsForCard(card.definitionId)),
  );
  const hasAnyInstalledInterface = installedInterfaceTargets.size > 0;
  const sourceDefinitionId = sourceDefinitionIdForSimulationAction(input, action);
  const eventTargets =
    action.type === "play_event"
      ? centralPressureTargetsForCard(sourceDefinitionId)
      : [];
  const eventGoodTarget = eventTargets.some((target) =>
    centralPressureTargetIsGoodForMetrics(input, target),
  );
  const interfaceInstallOpportunity = input.legalActions.some((candidate) => {
    if (candidate.type !== "install_card") return false;
    const definitionId = sourceDefinitionIdForSimulationAction(input, candidate);
    return isCentralPressureCardForMetrics(definitionId, true);
  });
  const interfaceInstallTaken =
    action.type === "install_card" &&
    isCentralPressureCardForMetrics(sourceDefinitionId, true);
  const closeoutOpportunity =
    input.playerView.agendaPointsToWin - input.playerView.own.agendaPoints <= 2 &&
    (centralTarget !== undefined ||
      (["hq", "rd"] as const).some((target) =>
        centralPressureTargetIsGoodForMetrics(input, target),
      ));
  const centralRun =
    action.type === "start_run" && centralTarget !== undefined;
  const matchingInterface =
    centralTarget !== undefined && installedInterfaceTargets.has(centralTarget);
  const anyMultiaccessInstalled = (input.playerView.own.rig ?? []).some((card) =>
    rolesForCardId(card.definitionId).some((role) => role.includes("multiaccess")),
  );
  const repeatedLowValue =
    centralTarget !== undefined &&
    centralRun &&
    isRepeatedLowValueCentralRunForMetrics(input, centralTarget) &&
    !matchingInterface;
  const streakWithoutValue =
    centralTarget !== undefined && centralRun
      ? centralRunStreakWithoutValueForMetrics(input, centralTarget)
      : 0;
  const reserveTarget = runnerCreditReserveTargetForInput(input);
  const server = centralTarget
    ? input.playerView.servers.find((candidate) => candidate.id === centralTarget)
    : undefined;
  const visibleBreakCost =
    centralTarget && server
      ? assessKnownRezzedIcePath(
          server.ice,
          input.playerView.own.rig ?? [],
          input.playerView.own.credits,
        ).visibleBreakCost ?? 0
      : 0;
  const insufficientReserve =
    centralRun && input.playerView.own.credits - visibleBreakCost < reserveTarget;
  return {
    ...(centralRun && (matchingInterface || anyMultiaccessInstalled)
      ? { runnerCentralRunWithMultiaccess: true }
      : {}),
    ...(centralRun && hasAnyInstalledInterface
      ? { runnerCentralRunWithInterfaceInstalled: true }
      : {}),
    ...(centralRun && centralTarget === "hq" && installedInterfaceTargets.has("hq")
      ? { runnerHqRunWithHqInterface: true }
      : {}),
    ...(centralRun && centralTarget === "rd" && installedInterfaceTargets.has("rd")
      ? { runnerRndRunWithRndInterface: true }
      : {}),
    ...(action.type === "play_event" && eventTargets.length > 0
      ? { runnerCentralRunEventPlayed: true }
      : {}),
    ...(action.type === "play_event" && eventGoodTarget
      ? { runnerCentralRunEventWithGoodTarget: true }
      : {}),
    ...(repeatedLowValue ? { runnerRepeatedLowValueCentralRun: true } : {}),
    ...(streakWithoutValue > 0
      ? { runnerCentralRunStreakWithoutValue: streakWithoutValue }
      : {}),
    ...(insufficientReserve
      ? { runnerCentralRunStartedWithInsufficientPostRunReserve: true }
      : {}),
    ...(closeoutOpportunity ? { runnerCentralCloseoutOpportunity: true } : {}),
    ...(centralRun && closeoutOpportunity
      ? { runnerCentralCloseoutRunTaken: true }
      : {}),
    ...(action.type === "steal_agenda" && centralTarget && closeoutOpportunity
      ? { runnerCentralCloseoutSuccess: true }
      : {}),
    ...(interfaceInstallOpportunity
      ? { runnerInterfaceInstallOpportunity: true }
      : {}),
    ...(interfaceInstallTaken ? { runnerInterfaceInstallTaken: true } : {}),
    ...(hasAnyInstalledInterface &&
    input.playerView.activeSide === "runner" &&
    input.playerView.phase === "runner_action_phase" &&
    !centralRun &&
    action.type === "end_turn"
      ? { runnerInterfaceInstalledButUnusedTurn: true }
      : {}),
  };
}

function centralServerId(
  serverId: string | undefined,
): "hq" | "rd" | "archives" | undefined {
  return serverId === "hq" || serverId === "rd" || serverId === "archives"
    ? serverId
    : undefined;
}

function isCentralPressureCardForMetrics(
  definitionId: string | undefined,
  installedOnly: boolean,
): boolean {
  if (!definitionId) return false;
  const roles = rolesForCardId(definitionId);
  if (!roles.some(isRunnerPressureRole)) return false;
  if (!installedOnly) return true;
  const type = DEMO_CARDS_BY_ID[definitionId]?.type ?? RUNTIME_CARDS[definitionId]?.type;
  return type === "hardware" || type === "program" || type === "resource";
}

function centralPressureTargetsForCard(
  definitionId: string | undefined,
): Array<"hq" | "rd" | "archives"> {
  if (!definitionId) return [];
  const roles = rolesForCardId(definitionId);
  const targets: Array<"hq" | "rd" | "archives"> = [];
  if (
    definitionId === "onr_v1_139_r-and-d-interface" ||
    roles.includes("pressure_rnd") ||
    roles.includes("rnd_pressure")
  )
    targets.push("rd");
  if (
    definitionId === "onr_v1_129_hq-interface" ||
    roles.includes("pressure_hq") ||
    roles.includes("hq_pressure")
  )
    targets.push("hq");
  if (roles.includes("archives_pressure")) targets.push("archives");
  if (
    targets.length === 0 &&
    roles.some((role) => role.includes("multiaccess")) &&
    [
      "onr_v1_024_expert-schedule-analyzer",
      "onr_v1_041_microtech-ai-interface",
      "onr_v1_105_priority-wreck",
    ].includes(definitionId)
  )
    targets.push("rd", "hq");
  return sortedUnique(targets) as Array<"hq" | "rd" | "archives">;
}

function centralPressureTargetIsGoodForMetrics(
  input: AiDecisionInput,
  target: "hq" | "rd" | "archives",
): boolean {
  const server = input.playerView.servers.find((candidate) => candidate.id === target);
  if (!server) return false;
  const assessment = assessKnownRezzedIcePath(
    server.ice,
    input.playerView.own.rig ?? [],
    input.playerView.own.credits,
  );
  if (assessment.blocked) return false;
  const cheap = (assessment.visibleBreakCost ?? 0) <= 1 || server.ice.length === 0;
  if (!cheap) return false;
  if (target === "archives")
    return server.root.some((card) => card.known && card.type === "agenda");
  if (input.playerView.agendaPointsToWin - input.playerView.own.agendaPoints <= 2)
    return true;
  if (target === "hq") return input.playerView.opponent.handCount >= 3;
  return true;
}

function isRepeatedLowValueCentralRunForMetrics(
  input: AiDecisionInput,
  target: "hq" | "rd" | "archives",
): boolean {
  return centralRunStreakWithoutValueForMetrics(input, target) > 0;
}

function centralRunStreakWithoutValueForMetrics(
  input: AiDecisionInput,
  target: "hq" | "rd" | "archives",
): number {
  const history = [...input.playerView.publicEvents, ...input.eventTail].sort(
    (left, right) => (left.stateVersionAfter ?? 0) - (right.stateVersionAfter ?? 0),
  );
  let streak = 0;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const event = history[index]!;
    const actionType =
      typeof event.publicPayload.actionType === "string"
        ? event.publicPayload.actionType
        : event.type;
    if (
      actionType === "steal_agenda" ||
      actionType === "trash_accessed_card" ||
      actionType === "score_agenda"
    )
      break;
    if (aiServerIdFromEvent(event) === target && actionType === "start_run") {
      streak += 1;
      continue;
    }
    if (
      (target === "hq" && (actionType === "draw_card" || actionType === "mandatory_draw")) ||
      (target === "rd" && (actionType === "draw_card" || actionType === "mandatory_draw" || actionType === "shuffle_stack")) ||
      actionType === "install_card"
    )
      break;
  }
  return streak;
}

function runnerReserveDiagnosticsForSimulationAction(
  input: AiDecisionInput,
  action: LegalAction,
  targetServerId: string | undefined,
  stateAfterAction: GameState,
): Partial<AiSimulationSummary["actionSequence"][number]> {
  if (input.side !== "runner" || action.side !== "runner") return {};
  const creditsBefore = input.playerView.own.credits;
  const creditsAfter = stateAfterAction.runner.credits;
  const creditDelta = creditsAfter - creditsBefore;
  const reserveTarget = runnerCreditReserveTargetForInput(input);
  const belowBefore = creditsBefore < reserveTarget;
  const belowAfter = creditsAfter < reserveTarget;
  const economyAction = isRunnerEconomyAction(input, action);
  const economyGain = economyAction && creditDelta > 0 ? creditDelta : 0;
  const economySpend = economyAction && creditDelta < 0 ? Math.abs(creditDelta) : 0;
  const runDiagnostics = runnerKnownPathDiagnosticsForAction(
    input,
    action,
    targetServerId,
    reserveTarget,
  );
  const remoteThreatTargeting = runnerRemoteThreatTargetingDiagnosticsForAction(
    input,
    action,
    targetServerId,
  );
  const spendBelowReserve =
    creditDelta < 0 && belowAfter && !runDiagnostics.probeRunWithPositiveInfoValue;
  const installCost = action.type === "install_card" ? actionCreditCost(action) : 0;
  const lowValueSpendBelowReserve =
    spendBelowReserve &&
    (isRunnerLowValueDuplicateInstall(input, action) ||
      (action.type === "start_run" &&
        (runDiagnostics.lowValueUnaffordableRun ||
          (runDiagnostics.runnerCentralRunStartedBelowReserve &&
            runnerHasVisibleRemoteScoreThreat(input)))) ||
      (action.type === "trash_accessed_card" &&
        runnerRemoteTrashAccessContext(input, action).role === "low_value"));
  const expensiveInstallBelowReserve =
    action.type === "install_card" && installCost >= 3 && belowAfter;
  const trashBlockedByCredits = runnerTrashBlockedByCredits(input);
  const stealBlockedByCredits = runnerStealBlockedByCredits(input, reserveTarget);
  const contestBlockedByCredits =
    runnerContestBlockedByCredits(input, reserveTarget) ||
    runDiagnostics.runStartedAgainstKnownUnaffordablePath === true;
  const reserveAfterAccess =
    ["access_card", "steal_agenda", "trash_accessed_card", "decline_trash"].includes(
      action.type,
    )
      ? creditsAfter - reserveTarget
      : undefined;
  const accessTarget = targetServerId ?? input.playerView.run?.attackedServerId;

  return {
    runnerCreditsBefore: creditsBefore,
    runnerCreditsAfter: creditsAfter,
    runnerCreditDelta: creditDelta,
    runnerReserveTarget: reserveTarget,
    ...(belowBefore ? { runnerBelowReserveBefore: true } : {}),
    ...(belowAfter ? { runnerBelowReserveAfter: true } : {}),
    ...(economyGain > 0 ? { runnerEconomyCreditsGained: economyGain } : {}),
    ...(economySpend > 0 ? { runnerEconomyCreditsSpent: economySpend } : {}),
    ...(economyAction && economyGain > 0 && belowBefore
      ? { runnerReservePreservingEconomy: true }
      : {}),
    ...(contestBlockedByCredits ? { runnerContestBlockedByCredits: true } : {}),
    ...(trashBlockedByCredits ? { runnerTrashBlockedByCredits: true } : {}),
    ...(stealBlockedByCredits ? { runnerStealBlockedByCredits: true } : {}),
    ...(spendBelowReserve ? { runnerSpendBelowReserve: true } : {}),
    ...(lowValueSpendBelowReserve ? { runnerLowValueSpendBelowReserve: true } : {}),
    ...(expensiveInstallBelowReserve
      ? { runnerExpensiveInstallBelowReserve: true }
      : {}),
    ...(reserveAfterAccess !== undefined
      ? { runnerReserveAfterSuccessfulRun: reserveAfterAccess }
      : {}),
    ...(reserveAfterAccess !== undefined && isRemoteServerTarget(accessTarget)
      ? { runnerReserveAfterRemoteAccess: reserveAfterAccess }
      : {}),
    ...(reserveAfterAccess !== undefined &&
    (accessTarget === "hq" || accessTarget === "rd" || accessTarget === "archives")
      ? { runnerReserveAfterCentralRun: reserveAfterAccess }
      : {}),
    ...runDiagnostics,
    ...remoteThreatTargeting,
  };
}

type RunnerRemoteThreatProfile = {
  serverId: string;
  advanced: boolean;
  relevantTrash: boolean;
  blockedByBreakerCoverage: boolean;
  blockedByKnownIceCost: boolean;
  blockedByPostRunReserve: boolean;
  creditsAfterPath: number;
  postRunReserveTarget: number;
  contestable: boolean;
};

function runnerRemoteThreatTargetingDiagnosticsForAction(
  input: AiDecisionInput,
  action: LegalAction,
  targetServerId: string | undefined,
): Partial<AiSimulationSummary["actionSequence"][number]> {
  if (input.side !== "runner" || action.side !== "runner") return {};
  const legalRemoteProfiles = input.legalActions
    .filter(
      (candidate) =>
        candidate.type === "start_run" &&
        typeof candidate.payload?.serverId === "string" &&
        isRemoteServerTarget(candidate.payload.serverId),
    )
    .map((candidate) =>
      runnerRemoteThreatProfile(input, String(candidate.payload?.serverId)),
    );
  const advancedProfiles = legalRemoteProfiles.filter(
    (profile) => profile.advanced,
  );
  if (advancedProfiles.length === 0) return {};
  const contestableProfiles = advancedProfiles.filter(
    (profile) => profile.contestable,
  );
  const selectedProfile = targetServerId
    ? advancedProfiles.find((profile) => profile.serverId === targetServerId)
    : undefined;
  const centralRun =
    action.type === "start_run" &&
    (targetServerId === "hq" ||
      targetServerId === "rd" ||
      targetServerId === "archives");
  const centralJustified =
    centralRun && targetServerId
      ? runnerCentralRunHasClearPressureJustificationForInput(
          input,
          targetServerId,
          contestableProfiles.length > 0,
        )
      : false;
  const centralBurnedReserve =
    centralRun &&
    targetServerId !== undefined &&
    contestableProfiles.length > 0 &&
    runnerCentralRunBurnsRemoteContestReserveForInput(
      input,
      targetServerId,
      contestableProfiles,
    );
  const contested =
    action.type === "start_run" &&
    targetServerId !== undefined &&
    selectedProfile !== undefined;
  const blockedByCredits = advancedProfiles.some(
    (profile) =>
      profile.blockedByKnownIceCost || profile.blockedByPostRunReserve,
  );
  const blockedByPostRunReserve = advancedProfiles.some(
    (profile) => profile.blockedByPostRunReserve,
  );
  const blockedByBreakerCoverage = advancedProfiles.some(
    (profile) => profile.blockedByBreakerCoverage,
  );
  const blockedByKnownIceCost = advancedProfiles.some(
    (profile) => profile.blockedByKnownIceCost,
  );
  return {
    runnerAdvancedRemoteThreatServerIds: advancedProfiles.map(
      (profile) => profile.serverId,
    ),
    ...(contestableProfiles.length > 0
      ? {
          runnerContestableAdvancedRemoteThreatServerIds:
            contestableProfiles.map((profile) => profile.serverId),
        }
      : {}),
    ...(contested
      ? { runnerContestedAdvancedRemoteServerId: selectedProfile.serverId }
      : {}),
    ...(centralRun && contestableProfiles.length > 0
      ? { runnerCentralRunInsteadOfContestableAdvancedRemote: true }
      : {}),
    ...(centralJustified ? { runnerCentralRunInsteadWasJustified: true } : {}),
    ...(centralBurnedReserve
      ? { runnerCentralRunBurnedRemoteContestReserve: true }
      : {}),
    ...(blockedByCredits ? { runnerRemoteContestBlockedByCredits: true } : {}),
    ...(blockedByPostRunReserve
      ? { runnerRemoteContestBlockedByPostRunReserve: true }
      : {}),
    ...(blockedByBreakerCoverage
      ? { runnerRemoteContestBlockedByBreakerCoverage: true }
      : {}),
    ...(blockedByKnownIceCost
      ? { runnerRemoteContestBlockedByKnownIceCost: true }
      : {}),
    ...(centralRun && contestableProfiles.length > 0 && !centralJustified
      ? { runnerRepeatedCentralRunWhileSameRemoteThreat: true }
      : {}),
    ...(selectedProfile !== undefined && !selectedProfile.contestable
      ? { runnerRemoteRunStartedWithInsufficientPostRunReserve: true }
      : {}),
    ...(selectedProfile?.contestable === true
      ? { runnerRemoteRunStartedWithSufficientPostRunReserve: true }
      : {}),
  };
}

function runnerRemoteThreatProfile(
  input: AiDecisionInput,
  serverId: string,
): RunnerRemoteThreatProfile {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  const assessment = assessKnownRezzedIcePath(
    server?.ice ?? [],
    input.playerView.own.rig ?? [],
    input.playerView.own.credits,
  );
  const visibleBreakCost = assessment.visibleBreakCost ?? 0;
  const creditsAfterPath = input.playerView.own.credits - visibleBreakCost;
  const postRunReserveTarget = runnerPostRunReserveTargetForRemoteInput(
    input,
    serverId,
  );
  const advanced = remoteServerHasScoreThreat(input, serverId);
  const relevantTrash = runnerRemoteHasKnownRelevantTrashTarget(input, serverId);
  const blockedByKnownIceCost = visibleBreakCost > input.playerView.own.credits;
  const blockedByBreakerCoverage =
    assessment.blocked === true && !blockedByKnownIceCost;
  const blockedByPostRunReserve =
    !blockedByBreakerCoverage &&
    !blockedByKnownIceCost &&
    creditsAfterPath < postRunReserveTarget;
  return {
    serverId,
    advanced,
    relevantTrash,
    blockedByBreakerCoverage,
    blockedByKnownIceCost,
    blockedByPostRunReserve,
    creditsAfterPath,
    postRunReserveTarget,
    contestable:
      advanced &&
      !blockedByBreakerCoverage &&
      !blockedByKnownIceCost &&
      !blockedByPostRunReserve,
  };
}

function runnerPostRunReserveTargetForRemoteInput(
  input: AiDecisionInput,
  serverId: string,
): number {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return 3;
  let target = remoteServerHasScoreThreat(input, serverId) ? 1 : 2;
  const visibleStealTax = server.root.some(
    (card) =>
      card.known &&
      rolesForCardId(card.definitionId).some(
        (role) =>
          role.includes("agenda_steal_tax") ||
          role.includes("remote_upgrade_tax") ||
          role.includes("access_tax") ||
          role.includes("remote_agenda_protection") ||
          role.includes("scoring_protection") ||
          role.includes("protect_remote"),
      ),
  );
  if (visibleStealTax) target = Math.max(target, 6);
  const relevantTrashCosts = server.root
    .filter((card) => card.known)
    .filter((card) => {
      const role = remoteTrashRoleForVisibleCard(card);
      return role !== "low_value" && role !== "unknown";
    })
    .map((card) => remoteTrashCostForVisibleCard(card))
    .filter((cost): cost is number => typeof cost === "number");
  if (relevantTrashCosts.length > 0) {
    target = Math.max(target, Math.min(...relevantTrashCosts) + 1);
  }
  return Math.min(10, Math.max(1, Math.ceil(target)));
}

function runnerCentralRunHasClearPressureJustificationForInput(
  input: AiDecisionInput,
  targetServerId: string,
  contestableRemoteThreatVisible: boolean,
): boolean {
  if (
    targetServerId !== "hq" &&
    targetServerId !== "rd" &&
    targetServerId !== "archives"
  )
    return false;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === targetServerId,
  );
  const assessment = assessKnownRezzedIcePath(
    server?.ice ?? [],
    input.playerView.own.rig ?? [],
    input.playerView.own.credits,
  );
  if (assessment.blocked) return false;
  const visibleBreakCost = assessment.visibleBreakCost ?? 0;
  const pressureRoles = [
    ...input.playerView.own.gripOrHq,
    ...(input.playerView.own.rig ?? []),
  ].flatMap((card) => rolesForCardId(card.definitionId));
  const hasCentralPressure = pressureRoles.some(
    (role) =>
      role === "run_pressure" ||
      role === "access" ||
      role.includes("pressure") ||
      role.includes("interface") ||
      role.includes("multiaccess"),
  );
  const openOrCheap = visibleBreakCost <= 1 || (server?.ice.length ?? 0) === 0;
  const preservesReserve =
    input.playerView.own.credits - visibleBreakCost >=
    runnerCreditReserveTargetForInput(input);
  return (
    hasCentralPressure &&
    openOrCheap &&
    preservesReserve &&
    (!contestableRemoteThreatVisible || visibleBreakCost === 0)
  );
}

function runnerCentralRunBurnsRemoteContestReserveForInput(
  input: AiDecisionInput,
  targetServerId: string,
  contestableProfiles: RunnerRemoteThreatProfile[],
): boolean {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === targetServerId,
  );
  const assessment = assessKnownRezzedIcePath(
    server?.ice ?? [],
    input.playerView.own.rig ?? [],
    input.playerView.own.credits,
  );
  if (assessment.blocked || contestableProfiles.length === 0) return false;
  const visibleBreakCost = assessment.visibleBreakCost ?? 0;
  const creditsAfterPath = input.playerView.own.credits - visibleBreakCost;
  const requiredReserve = Math.max(
    ...contestableProfiles.map((profile) => profile.postRunReserveTarget),
  );
  return creditsAfterPath < requiredReserve;
}

function runnerCreditReserveTargetForInput(input: AiDecisionInput): number {
  if (input.side !== "runner") return 0;
  let target = 4;
  for (const server of input.playerView.servers) {
    if (!isRemoteServerTarget(server.id)) continue;
    const pathCost =
      assessKnownRezzedIcePath(
        server.ice,
        input.playerView.own.rig ?? [],
        input.playerView.own.credits,
      ).visibleBreakCost ?? 0;
    const hasThreat = server.root.some(
      (card) =>
        (card.advancementCounters ?? 0) > 0 ||
        (card.known && card.type === "agenda"),
    );
    const relevantTrashCosts = server.root
      .filter((card) => card.known)
      .filter((card) => {
        const role = remoteTrashRoleForVisibleCard(card);
        return role !== "low_value" && role !== "unknown";
      })
      .map((card) => remoteTrashCostForVisibleCard(card))
      .filter((cost): cost is number => typeof cost === "number");
    const cheapestRelevantTrash =
      relevantTrashCosts.length > 0 ? Math.min(...relevantTrashCosts) : 0;
    const visibleStealTax = server.root.some(
      (card) =>
        card.known &&
        rolesForCardId(card.definitionId).some(
          (role) =>
            role.includes("agenda_steal_tax") ||
            role.includes("remote_upgrade_tax") ||
            role.includes("access_tax"),
        ),
    )
      ? 5
      : 0;
    if (hasThreat) target = Math.max(target, pathCost + 3 + visibleStealTax);
    if (cheapestRelevantTrash > 0)
      target = Math.max(target, pathCost + cheapestRelevantTrash + 1);
  }
  return Math.min(12, Math.max(2, Math.ceil(target)));
}

function runnerKnownPathDiagnosticsForAction(
  input: AiDecisionInput,
  action: LegalAction,
  targetServerId: string | undefined,
  reserveTarget: number,
): Partial<AiSimulationSummary["actionSequence"][number]> {
  if (action.type === "jack_out") {
    const run = input.playerView.run;
    const server = input.playerView.servers.find(
      (candidate) => candidate.id === run?.attackedServerId,
    );
    const currentIce =
      run?.position?.kind === "ice" ? server?.ice[run.position.iceIndex] : undefined;
    if (
      currentIce?.known &&
      currentIce.rezzed === true &&
      (run?.position?.kind === "ice" ? run.position.iceIndex : 99) <= 1 &&
      assessKnownRezzedIcePath(
        [currentIce],
        input.playerView.own.rig ?? [],
        input.playerView.own.credits,
      ).blocked
    )
      return { runEndedAfterFirstIceDueToCredits: true };
    return {};
  }
  if (action.type !== "start_run" || !targetServerId) return {};
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === targetServerId,
  );
  if (!server) return {};
  const assessment = assessKnownRezzedIcePath(
    server.ice,
    input.playerView.own.rig ?? [],
    input.playerView.own.credits,
  );
  const knownPathCost = assessment.visibleBreakCost ?? 0;
  const creditsAfterPath = input.playerView.own.credits - knownPathCost;
  const creditsMissing = Math.max(0, knownPathCost - input.playerView.own.credits);
  const remote = isRemoteServerTarget(targetServerId);
  const central =
    targetServerId === "hq" ||
    targetServerId === "rd" ||
    targetServerId === "archives";
  const remoteThreat = remoteServerHasScoreThreat(input, targetServerId);
  const positiveProbe =
    !remoteThreat &&
    (action.payload?.bypass === true ||
      rolesForAction(input, action).some(
        (role) =>
          role.includes("bypass") ||
          role.includes("probe") ||
          role.includes("expose") ||
          role.includes("inside_job"),
      ));
  const insufficientPath = assessment.blocked || creditsMissing > 0;
  const insufficientReserve =
    !insufficientPath &&
    creditsAfterPath < reserveTarget &&
    (remoteThreat || runnerRemoteHasKnownRelevantTrashTarget(input, targetServerId));
  return {
    runKnownPathCostAtStart: knownPathCost,
    runCreditsAfterKnownPathEstimate: creditsAfterPath,
    runCreditsMissingForKnownPath: creditsMissing,
    ...(input.playerView.own.credits < reserveTarget
      ? { runnerRunStartedBelowReserve: true }
      : {}),
    ...(remote && input.playerView.own.credits < reserveTarget
      ? { runnerRemoteRunStartedBelowReserve: true }
      : {}),
    ...(central && input.playerView.own.credits < reserveTarget
      ? { runnerCentralRunStartedBelowReserve: true }
      : {}),
    ...(remoteThreat
      ? {
          runnerReserveBeforeAdvancedRemoteContest:
            input.playerView.own.credits - reserveTarget,
        }
      : {}),
    ...(insufficientPath ? { runStartedAgainstKnownUnaffordablePath: true } : {}),
    ...(insufficientPath && remote
      ? { remoteRunStartedAgainstKnownUnaffordablePath: true }
      : {}),
    ...(insufficientPath && central
      ? { centralRunStartedAgainstKnownUnaffordablePath: true }
      : {}),
    ...(insufficientReserve
      ? { runStartedWithInsufficientStealOrTrashReserve: true }
      : {}),
    ...(positiveProbe ? { probeRunWithPositiveInfoValue: true } : {}),
    ...(insufficientPath && !positiveProbe && !remoteThreat
      ? { lowValueUnaffordableRun: true }
      : {}),
  };
}

function runnerContestBlockedByCredits(
  input: AiDecisionInput,
  reserveTarget: number,
): boolean {
  return input.legalActions.some((action) => {
    if (
      action.side !== "runner" ||
      action.type !== "start_run" ||
      typeof action.payload?.serverId !== "string" ||
      !isRemoteServerTarget(action.payload.serverId) ||
      !remoteServerHasScoreThreat(input, action.payload.serverId)
    )
      return false;
    const server = input.playerView.servers.find(
      (candidate) => candidate.id === action.payload?.serverId,
    );
    if (!server) return false;
    const path =
      assessKnownRezzedIcePath(
        server.ice,
        input.playerView.own.rig ?? [],
        input.playerView.own.credits,
      ).visibleBreakCost ?? 0;
    return (
      input.playerView.own.credits < path ||
      input.playerView.own.credits - path < Math.min(3, reserveTarget - 2)
    );
  });
}

function runnerTrashBlockedByCredits(input: AiDecisionInput): boolean {
  const run = input.playerView.run;
  const accessed = run?.accessedCard;
  if (!run || !isRemoteServerTarget(run.attackedServerId) || !accessed?.known)
    return false;
  const trashCost = remoteTrashCostForVisibleCard(accessed);
  if (trashCost === undefined) return false;
  const role = remoteTrashRoleForVisibleCard(accessed);
  if (role === "low_value" || role === "unknown") return false;
  return (
    input.playerView.own.credits < trashCost &&
    !input.legalActions.some((action) => action.type === "trash_accessed_card")
  );
}

function runnerStealBlockedByCredits(
  input: AiDecisionInput,
  reserveTarget: number,
): boolean {
  const run = input.playerView.run;
  const accessed = run?.accessedCard;
  if (!run || !accessed?.known || accessed.type !== "agenda") return false;
  return (
    !input.legalActions.some((action) => action.type === "steal_agenda") &&
    input.playerView.own.credits < reserveTarget
  );
}

function runnerHasVisibleRemoteScoreThreat(input: AiDecisionInput): boolean {
  return input.playerView.servers.some(
    (server) => isRemoteServerTarget(server.id) && remoteServerHasScoreThreat(input, server.id),
  );
}

function runnerRemoteHasKnownRelevantTrashTarget(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return false;
  return server.root.some((card) => {
    if (!card.known || remoteTrashCostForVisibleCard(card) === undefined)
      return false;
    const role = remoteTrashRoleForVisibleCard(card);
    return role !== "low_value" && role !== "unknown";
  });
}

function runnerRemoteTrashAccessContext(
  input: AiDecisionInput,
  action: LegalAction,
): {
  trashable: boolean;
  relevant: boolean;
  affordableRelevant: boolean;
  relevantTaken: boolean;
  skippedAffordableRelevant: boolean;
  targetType?: RemoteTrashTargetType;
  role?: RemoteTrashRole;
} {
  const run = input.playerView.run;
  const accessed = run?.accessedCard;
  if (!run || !isRemoteServerTarget(run.attackedServerId) || !accessed?.known) {
    return {
      trashable: false,
      relevant: false,
      affordableRelevant: false,
      relevantTaken: false,
      skippedAffordableRelevant: false,
    };
  }
  const targetType = remoteTrashTargetTypeForVisibleCard(accessed);
  const role = remoteTrashRoleForVisibleCard(accessed);
  const trashable =
    targetType !== "unknown" && remoteTrashCostForVisibleCard(accessed) !== undefined;
  const relevant = trashable && role !== "low_value" && role !== "unknown";
  const affordableRelevant =
    relevant &&
    input.legalActions.some((candidate) => candidate.type === "trash_accessed_card");
  const relevantTaken = affordableRelevant && action.type === "trash_accessed_card";
  return {
    trashable,
    relevant,
    affordableRelevant,
    relevantTaken,
    skippedAffordableRelevant:
      affordableRelevant && action.type !== "trash_accessed_card",
    ...(trashable ? { targetType } : {}),
    ...(trashable ? { role } : {}),
  };
}

function runnerAdvancedRemoteContestContext(
  input: AiDecisionInput,
  action: LegalAction,
  targetServerId: string | undefined,
): {
  opportunity: boolean;
  taken: boolean;
  skipped: boolean;
  centralWhileThreat: boolean;
  reserveAfterRun?: number;
} {
  if (input.side !== "runner") {
    return {
      opportunity: false,
      taken: false,
      skipped: false,
      centralWhileThreat: false,
    };
  }
  const advancedRemoteTargets = new Set(
    input.legalActions
      .filter(
        (candidate) =>
          candidate.type === "start_run" &&
          typeof candidate.payload?.serverId === "string" &&
          isRemoteServerTarget(candidate.payload.serverId) &&
          remoteServerHasScoreThreat(input, candidate.payload.serverId),
      )
      .map((candidate) => String(candidate.payload?.serverId)),
  );
  const opportunity = advancedRemoteTargets.size > 0;
  const taken =
    action.type === "start_run" &&
    targetServerId !== undefined &&
    advancedRemoteTargets.has(targetServerId);
  const centralWhileThreat =
    opportunity &&
    action.type === "start_run" &&
    (targetServerId === "hq" ||
      targetServerId === "rd" ||
      targetServerId === "archives");
  return {
    opportunity,
    taken,
    skipped: opportunity && !taken,
    centralWhileThreat,
    ...(action.type === "start_run" &&
    targetServerId !== undefined &&
    isRemoteServerTarget(targetServerId)
      ? {
          reserveAfterRun:
            input.playerView.own.credits - actionCreditCost(action),
        }
      : {}),
  };
}

function runnerDrawKindForSimulationAction(
  input: AiDecisionInput,
  action: LegalAction,
): { draw: boolean; click: boolean; cardEffect: boolean } {
  if (action.type === "draw_card") return { draw: true, click: true, cardEffect: false };
  const roles = rolesForAction(input, action);
  const cardEffect =
    (action.type === "play_event" ||
      action.type === "trigger_ability" ||
      action.type === "activated_card_ability") &&
    roles.some((role) => role === "draw" || role === "setup" || role.includes("search"));
  const searchChoice =
    action.type === "resolve_choice" &&
    input.playerView.pendingChoice !== undefined &&
    isSearchChoice(input.playerView.pendingChoice);
  return {
    draw: cardEffect || searchChoice,
    click: false,
    cardEffect: cardEffect || searchChoice,
  };
}

function hasRunnerPlayableEconomyAction(
  input: AiDecisionInput,
  excludeActionId?: string,
): boolean {
  return input.legalActions.some(
    (action) =>
      action.actionId !== excludeActionId &&
      action.side === "runner" &&
      isRunnerEconomyAction(input, action) &&
      action.source !== "basic_action" &&
      action.source !== "game_rule",
  );
}

function hasRunnerInstallableBreakerAction(
  input: AiDecisionInput,
  excludeActionId?: string,
): boolean {
  return input.legalActions.some(
    (action) =>
      action.actionId !== excludeActionId &&
      action.side === "runner" &&
      action.type === "install_card" &&
      rolesForAction(input, action).some((role) => role.startsWith("breaker_")),
  );
}

function hasRunnerRunnablePressureAction(
  input: AiDecisionInput,
  excludeActionId?: string,
): boolean {
  return input.legalActions.some((action) => {
    if (action.actionId === excludeActionId || action.side !== "runner")
      return false;
    if (isRunnerPressureAction(input, action)) return true;
    if (action.type !== "start_run") return false;
    const serverId =
      typeof action.payload?.serverId === "string" ? action.payload.serverId : "";
    if (!serverId) return false;
    const server = input.playerView.servers.find(
      (candidate) => candidate.id === serverId,
    );
    if (serverId.startsWith("remote_") && (server?.root.length ?? 0) === 0)
      return false;
    return input.playerView.own.credits >= 3 || (server?.ice.length ?? 0) === 0;
  });
}

function hasRunnerRemoteTrashAction(input: AiDecisionInput): boolean {
  return input.legalActions.some(
    (action) =>
      action.side === "runner" &&
      action.type === "trash_accessed_card" &&
      isRemoteServerTarget(input.playerView.run?.attackedServerId),
  );
}

function remoteServerHasScoreThreat(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return false;
  return server.root.some(
    (card) =>
      (card.advancementCounters ?? 0) > 0 ||
      (card.known && card.type === "agenda"),
  );
}

function remoteTrashTargetTypeForVisibleCard(
  card: VisibleCard,
): RemoteTrashTargetType {
  if (card.type === "asset") return "asset_node";
  if (card.type === "upgrade") return "upgrade";
  if (card.type === "ice") return "ice";
  return "unknown";
}

function remoteTrashRoleForVisibleCard(card: VisibleCard): RemoteTrashRole {
  if (card.definitionId === "simple_upgrade") return "low_value";
  const roles = rolesForCardId(card.definitionId);
  if (
    roles.some(
      (role) =>
        role.includes("agenda_steal_tax") ||
        role.includes("access_tax") ||
        role.includes("remote_agenda_protection") ||
        role.includes("scoring") ||
        role.includes("protect_remote") ||
        role.includes("remote_upgrade_tax"),
    )
  )
    return "scoring_protection";
  if (roles.some((role) => role.includes("economy"))) return "economy";
  if (
    roles.some(
      (role) =>
        role.includes("tag") ||
        role.includes("trace") ||
        role.includes("punish") ||
        role.includes("damage"),
    )
  )
    return "tag_punish";
  if (roles.some((role) => role.includes("ambush") || role.includes("trap")))
    return "ambush";
  if (roles.some((role) => role.includes("low_value"))) return "low_value";
  if (card.type === "asset" || card.type === "upgrade") return "unknown";
  return "unknown";
}

function remoteTrashCostForVisibleCard(card: VisibleCard): number | undefined {
  if (!card.known || !card.definitionId) return undefined;
  return (
    card.trashCost ??
    RUNTIME_CARDS[card.definitionId]?.numeric.trashCost ??
    DEMO_CARDS_BY_ID[card.definitionId]?.trashCost
  );
}

function actionCreditCost(action: LegalAction): number {
  return action.costs.reduce(
    (sum, cost) =>
      sum + (Number.isFinite(cost.credits) ? (cost.credits ?? 0) : 0),
    0,
  );
}

function isRunnerEconomyAction(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  if (action.side !== "runner") return false;
  if (action.type === "gain_credit") return true;
  if (
    action.type !== "play_event" &&
    action.type !== "install_card" &&
    action.type !== "trigger_ability" &&
    action.type !== "activated_card_ability"
  )
    return false;
  return rolesForAction(input, action).some((role) => isRunnerEconomyRole(role));
}

function isRunnerRigInstallAction(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  if (action.type !== "install_card") return false;
  const roles = rolesForAction(input, action);
  return roles.some(
    (role) =>
      role.startsWith("breaker_") ||
      role === "memory" ||
      role === "memory_support" ||
      role === "setup" ||
      role === "build_rig" ||
      isRunnerPressureRole(role),
  );
}

function isRunnerPressureAction(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  if (action.side !== "runner") return false;
  const roles = rolesForAction(input, action);
  return (
    action.type === "start_run" ||
    roles.some((role) => isRunnerPressureRole(role))
  );
}

function runnerDiscardChoiceRoles(
  input: AiDecisionInput,
  decision: AiDecision,
): string[] {
  if (
    input.playerView.pendingChoice?.source !== "discard_phase" ||
    input.playerView.pendingChoice.kind !== "select_cards" ||
    decision.selectedChoices === undefined
  )
    return [];
  const selected = decision.selectedChoices as
    | { choiceId?: unknown; selectedOptionIds?: unknown }
    | undefined;
  if (
    selected?.choiceId !== input.playerView.pendingChoice.choiceId ||
    !Array.isArray(selected.selectedOptionIds)
  )
    return [];
  const selectedIds = new Set(
    selected.selectedOptionIds.filter(
      (optionId): optionId is string => typeof optionId === "string",
    ),
  );
  return input.playerView.pendingChoice.options
    .filter((option) => selectedIds.has(option.id))
    .flatMap((option) => discardRolesForCardId(option.card?.definitionId));
}

function isRunnerDuplicateInstall(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  const definitionId = sourceDefinitionIdForSimulationAction(input, action);
  if (!definitionId || action.type !== "install_card") return false;
  return (
    input.playerView.own.rig?.some(
      (card) => card.known && card.definitionId === definitionId,
    ) === true
  );
}

function isRunnerLowValueDuplicateInstall(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  const definitionId = sourceDefinitionIdForSimulationAction(input, action);
  if (!definitionId) return false;
  const roles = rolesForCardId(definitionId);
  if (definitionId === "onr_v1_165_junkyard-bbs") return true;
  if (roles.some((role) => role === "memory" || role === "memory_support"))
    return false;
  if (roles.some((role) => isRunnerPressureRole(role))) return false;
  if (roles.some((role) => role.startsWith("breaker_"))) return true;
  return roles.some(
    (role) =>
      role === "resource" ||
      role === "setup" ||
      role === "draw" ||
      role === "tag_risk" ||
      isRunnerEconomyRole(role),
  );
}

function sourceDefinitionIdForSimulationAction(
  input: AiDecisionInput,
  action: LegalAction,
): string | undefined {
  if (action.source === "basic_action" || action.source === "game_rule")
    return undefined;
  return findVisibleCard(input, action.source)?.definitionId;
}

function isRunnerEconomyRole(role: string): boolean {
  return role === "economy" || role === "tempo" || role.includes("economy");
}

function isRunnerPressureRole(role: string): boolean {
  return (
    role === "run_pressure" ||
    role === "access" ||
    role.includes("pressure") ||
    role.includes("interface") ||
    role.includes("multiaccess")
  );
}

function serverIdForCorpInstalledCard(
  state: GameState,
  cardId: string,
): string | undefined {
  const installedCardId = cardId as CardInstanceId;
  for (const server of state.corp.servers) {
    if (
      server.ice.includes(installedCardId) ||
      server.root.includes(installedCardId)
    )
      return server.id;
  }
  return undefined;
}

function cardTargetTypeForInstance(
  state: GameState,
  cardId: string,
): ProgressionCardTargetType {
  const definitionId = state.cardInstances[cardId]?.definitionId;
  if (!definitionId) return "unknown";
  const type =
    DEMO_CARDS_BY_ID[definitionId]?.type ?? RUNTIME_CARDS[definitionId]?.type;
  return progressionCardTargetType(type);
}

function progressionCardTargetType(
  type: string | undefined,
): ProgressionCardTargetType {
  if (
    type === "agenda" ||
    type === "asset" ||
    type === "upgrade" ||
    type === "ice"
  )
    return type;
  return "unknown";
}

function sortedUniqueProgressionCardTargetTypes(
  values: ProgressionCardTargetType[],
): ProgressionCardTargetType[] {
  return [...new Set(values)].sort();
}

function advancedAgendaStealSourceForAction(
  stateBeforeAction: GameState,
  action: LegalAction,
  targetCardIds: CardInstanceId[],
): "remote" | "central" | "unknown" | undefined {
  if (action.type !== "steal_agenda") return undefined;
  const stolenSources = targetCardIds
    .map((cardId) => {
      const instance = stateBeforeAction.cardInstances[cardId];
      if (!instance || instance.advancementCounters <= 0) return undefined;
      if (cardTargetTypeForInstance(stateBeforeAction, cardId) !== "agenda")
        return undefined;
      if (
        instance.zone.side !== "corp" ||
        !["serverRoot", "rd", "hq", "archives"].includes(instance.zone.zone)
      )
        return undefined;
      if (
        instance.zone.zone === "serverRoot" &&
        instance.zone.serverId.startsWith("remote_")
      )
        return "remote" as const;
      if (
        instance.zone.zone === "rd" ||
        instance.zone.zone === "hq" ||
        instance.zone.zone === "archives"
      )
        return "central" as const;
      return "unknown" as const;
    })
    .filter((source): source is "remote" | "central" | "unknown" =>
      Boolean(source),
    );
  return stolenSources.includes("remote")
    ? "remote"
    : stolenSources.includes("central")
      ? "central"
      : stolenSources[0];
}

function finalAdvanceAssessmentForSimulationAction(
  stateBeforeAction: GameState,
  input: AiDecisionInput,
  action: LegalAction,
  targetServerId: string | undefined,
  targetCardIds: CardInstanceId[],
  advancementCountersAdded: number,
): {
  finalAdvance: boolean;
  unsafeFinalAdvance?: boolean;
  protectedFinalAdvance?: boolean;
  remoteProtectionScore?: number;
  runnerContestRisk?: "low" | "medium" | "high" | "unknown";
  advancesRemainingAfterAction?: number;
} {
  if (action.side !== "corp" || advancementCountersAdded <= 0)
    return { finalAdvance: false };
  const cardId = targetCardIds.find(
    (candidate) =>
      cardTargetTypeForInstance(stateBeforeAction, candidate) === "agenda",
  );
  if (!cardId || !targetServerId?.startsWith("remote_"))
    return { finalAdvance: false };
  const instance = stateBeforeAction.cardInstances[cardId];
  if (!instance) return { finalAdvance: false };
  const definitionId = instance.definitionId;
  const requirement =
    DEMO_CARDS_BY_ID[definitionId]?.advancementRequirement ??
    RUNTIME_CARDS[definitionId]?.numeric.advancementRequirement ??
    0;
  const countersAfter = instance.advancementCounters + advancementCountersAdded;
  const advancesRemainingAfterAction = Math.max(0, requirement - countersAfter);
  if (advancesRemainingAfterAction > 1) return { finalAdvance: false };
  const remoteProtectionScore = remoteProtectionScoreForSimulation(
    stateBeforeAction,
    input,
    targetServerId,
    simulationActionCreditCost(action),
  );
  const runnerContestRisk = runnerContestRiskForSimulation(
    stateBeforeAction,
    input,
    targetServerId,
  );
  const sameTurnScoreLikely = advancesRemainingAfterAction === 0;
  const unsafeFinalAdvance =
    !sameTurnScoreLikely &&
    (runnerContestRisk === "high" || remoteProtectionScore < 60);
  return {
    finalAdvance: true,
    unsafeFinalAdvance,
    protectedFinalAdvance: !unsafeFinalAdvance,
    remoteProtectionScore,
    runnerContestRisk,
    advancesRemainingAfterAction,
  };
}

function isProtectBeforeAdvanceSimulationAction(
  stateBeforeAction: GameState,
  input: AiDecisionInput,
  action: LegalAction,
  targetServerId: string | undefined,
): boolean {
  if (action.side !== "corp" || !targetServerId?.startsWith("remote_"))
    return false;
  if (!remoteHasNearFinalAgenda(stateBeforeAction, targetServerId))
    return false;
  if (action.type === "install_card" && action.payload?.placement === "ice")
    return true;
  if (
    action.type === "install_card" &&
    action.payload?.placement !== "ice" &&
    isProtectionDefinitionId(
      stateBeforeAction.cardInstances[action.source]?.definitionId,
    )
  )
    return true;
  if (action.type === "gain_credit") {
    const protectionBefore = remoteProtectionScoreForSimulation(
      stateBeforeAction,
      input,
      targetServerId,
      0,
    );
    const protectionAfter = remoteProtectionScoreForSimulation(
      stateBeforeAction,
      input,
      targetServerId,
      -1,
    );
    return protectionBefore < 60 && protectionAfter > protectionBefore;
  }
  return false;
}

function remoteHasNearFinalAgenda(state: GameState, serverId: string): boolean {
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return false;
  return server.root.some((cardId) => {
    const instance = state.cardInstances[cardId];
    if (!instance) return false;
    if (cardTargetTypeForInstance(state, cardId) !== "agenda") return false;
    const requirement =
      DEMO_CARDS_BY_ID[instance.definitionId]?.advancementRequirement ??
      RUNTIME_CARDS[instance.definitionId]?.numeric.advancementRequirement ??
      0;
    return Math.max(0, requirement - instance.advancementCounters) <= 2;
  });
}

function remoteProtectionScoreForSimulation(
  state: GameState,
  input: AiDecisionInput,
  serverId: string,
  actionCreditCostValue: number,
): number {
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return 0;
  const visibleServer = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  const rezzedIce = server.ice.filter(
    (cardId) => state.cardInstances[cardId]?.rezzed === true,
  ).length;
  const unrezzedIce = server.ice.length - rezzedIce;
  const cheapestRez = Math.min(
    ...server.ice
      .filter((cardId) => state.cardInstances[cardId]?.rezzed !== true)
      .map((cardId) =>
        rezCostForDefinitionId(state.cardInstances[cardId]?.definitionId),
      )
      .filter((cost) => cost > 0),
  );
  const hasAffordableUnrezzed =
    Number.isFinite(cheapestRez) &&
    state.corp.credits - actionCreditCostValue >= cheapestRez;
  const rootProtection = server.root.filter((cardId) =>
    isProtectionDefinitionId(state.cardInstances[cardId]?.definitionId),
  ).length;
  const risk = runnerContestRiskForSimulation(state, input, serverId);
  return (
    Math.min(server.ice.length, 3) * 22 +
    rezzedIce * 32 +
    (unrezzedIce > 0 && hasAffordableUnrezzed ? 28 : 0) +
    rootProtection * 35 +
    (visibleServer?.ice.some((ice) => ice.rezzed === true) ? 8 : 0) +
    (risk === "low" ? 35 : risk === "medium" ? 5 : -45)
  );
}

function runnerContestRiskForSimulation(
  state: GameState,
  input: AiDecisionInput,
  serverId: string,
): "low" | "medium" | "high" | "unknown" {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return "unknown";
  if (server.ice.length <= 0) return "high";
  const runnerCredits = input.playerView.opponent.credits;
  const breakers =
    input.playerView.opponent.rig?.filter((card) =>
      card.definitionId
        ? RUNTIME_CARDS[card.definitionId]?.subtypes.includes("icebreaker")
        : false,
    ).length ?? 0;
  const rezzedIce =
    state.corp.servers
      .find((candidate) => candidate.id === serverId)
      ?.ice.filter((cardId) => state.cardInstances[cardId]?.rezzed === true)
      .length ?? 0;
  if (runnerCredits >= 6 && breakers > 0) return "high";
  if (rezzedIce > 0 || runnerCredits <= 3 || breakers === 0) return "low";
  return "medium";
}

function isProtectionDefinitionId(definitionId: string | undefined): boolean {
  if (!definitionId) return false;
  const normalized = definitionId.toLocaleLowerCase("en-US");
  return (
    normalized.includes("red-herrings") ||
    normalized.includes("tesseract") ||
    normalized.includes("namatoki")
  );
}

function rezCostForDefinitionId(definitionId: string | undefined): number {
  if (!definitionId) return 0;
  return (
    DEMO_CARDS_BY_ID[definitionId]?.rezCost ??
    RUNTIME_CARDS[definitionId]?.numeric.rezCost ??
    0
  );
}

function simulationActionCreditCost(action: LegalAction): number {
  return action.costs.reduce(
    (sum, cost) => sum + Math.max(0, cost.credits ?? 0),
    0,
  );
}

function advancementCountersAddedForSimulationAction(
  action: LegalAction,
  event: PublicGameEvent,
): number {
  const candidates = [
    action.payload?.addedAdvancementCounters,
    action.payload?.advancementCountersAdded,
    event.publicPayload.addedAdvancementCounters,
    event.publicPayload.advancementCountersAdded,
  ];
  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0)
      return value;
  }
  return action.type === "advance_card" ? 1 : 0;
}

function metricsFor(
  actionSequence: AiSimulationSummary["actionSequence"],
  errors: string[],
  replayOk: boolean,
  holdout: boolean,
): AiQualityMetrics {
  const actions = actionSequence.length || 1;
  const reasonCodeCoverage = sortedUnique(
    actionSequence.map((entry) =>
      entry.reasonCode.split(".").slice(0, 2).join("."),
    ),
  );
  const doctrine = summarizeDoctrineQualityMetrics(actionSequence);
  return {
    illegalActions: errors.length,
    fallbackRate: round(
      actionSequence.filter((entry) => entry.fallbackUsed).length / actions,
    ),
    timeoutRate: round(
      actionSequence.filter((entry) => entry.timeoutUsed).length / actions,
    ),
    reasonCodeCoverage,
    actionTypeCoverage: sortedUnique(
      actionSequence.map((entry) => entry.actionType),
    ),
    roleCoverage: sortedUnique(
      actionSequence.flatMap((entry) =>
        entry.evidence
          .filter((item) => item.startsWith("role:"))
          .map((item) => item.slice("role:".length)),
      ),
    ),
    progressScore: round(
      actionSequence.length + (replayOk ? 10 : 0) - errors.length * 10,
    ),
    holdout,
    doctrine,
  };
}

function qualityTagsForAction(
  input: AiDecisionInput,
  action: LegalAction,
  decision: AiDecision,
): string[] {
  const tags: string[] = [];
  const features = extractAiFeatures(input);
  const sourceCard =
    action.source === "basic_action" || action.source === "game_rule"
      ? undefined
      : findVisibleCard(input, action.source);
  const sourceDefinition = sourceCard?.definitionId
    ? DEMO_CARDS_BY_ID[sourceCard.definitionId]
    : undefined;
  const targetServerId =
    typeof action.payload?.serverId === "string"
      ? action.payload.serverId
      : undefined;
  const targetServer = targetServerId
    ? features.serverFeaturesById.get(targetServerId)
    : undefined;
  const agendaInHand = input.playerView.own.gripOrHq.filter(
    (card) =>
      card.definitionId &&
      DEMO_CARDS_BY_ID[card.definitionId]?.type === "agenda",
  ).length;
  const legalScoreAvailable =
    input.side === "corp" &&
    input.legalActions.some((candidate) => candidate.type === "score_agenda");
  const legalTrashAvailable =
    input.side === "runner" &&
    input.legalActions.some(
      (candidate) => candidate.type === "trash_accessed_card",
    );
  const lowCredits = input.playerView.own.credits <= 1;
  const economyAction =
    action.type === "gain_credit" ||
    ((action.type === "play_event" || action.type === "play_operation") &&
      rolesForAction(input, action).some(
        (role) => role.includes("economy") || role === "tempo",
      ));
  const economyStallExempt = isEconomyStallExemptAction(
    input,
    action,
    decision,
  );
  const visibleRemoteContest =
    targetServerId?.startsWith("remote_") === true &&
    (targetServer?.rootCount ?? 0) > 0;

  if (
    input.side === "corp" &&
    action.type === "install_card" &&
    action.payload?.placement !== "ice" &&
    sourceDefinition?.type === "agenda"
  ) {
    if (
      targetServerId === "new_remote" ||
      ((targetServer?.iceCount ?? 0) === 0 &&
        (targetServer?.rootCount ?? 0) === 0)
    )
      tags.push("naked_agenda_install");
  }
  if (
    input.side === "corp" &&
    agendaInHand >= 3 &&
    !isAgendaFloodExposureExemptAction(action, decision, sourceDefinition)
  )
    tags.push("agenda_flood_exposure");
  if (legalScoreAvailable && action.type !== "score_agenda")
    tags.push("score_window_missed");
  if (
    input.side === "corp" &&
    action.type === "install_card" &&
    targetServerId?.startsWith("remote_") &&
    ((action.payload?.placement === "ice" &&
      (targetServer?.iceCount ?? 0) >= 2) ||
      (action.payload?.placement !== "ice" &&
        (targetServer?.rootCount ?? 0) >= 2))
  ) {
    tags.push("remote_overbuild");
  }
  if (lowCredits && !economyAction && !economyStallExempt)
    tags.push("economy_stall");
  if (
    input.side === "runner" &&
    features.rigRoles.size === 0 &&
    action.type === "start_run" &&
    !visibleRemoteContest &&
    input.playerView.opponent.agendaPoints <
      input.playerView.agendaPointsToWin - 2
  )
    tags.push("rig_stall");
  if (legalTrashAvailable && action.type !== "trash_accessed_card")
    tags.push("asset_trash_neglect");
  if (decision.timeoutUsed) tags.push("timeout");
  if (decision.fallbackUsed) tags.push("fallback");
  return sortedUnique(tags);
}

function isEconomyStallExemptAction(
  input: AiDecisionInput,
  action: LegalAction,
  decision: AiDecision,
): boolean {
  if (decision.fallbackUsed) return true;
  if (decision.reasonCode.endsWith(".recover_economy")) return true;
  if (
    action.type === "mandatory_draw" ||
    action.type === "end_turn" ||
    action.type === "decline_rez" ||
    action.type === "resolve_choice"
  )
    return true;
  if (input.side !== "runner") return false;
  return (
    action.type === "pump_breaker" ||
    action.type === "break_subroutine" ||
    action.type === "continue_run" ||
    action.type === "access_card" ||
    action.type === "steal_agenda"
  );
}

function isAgendaFloodExposureExemptAction(
  action: LegalAction,
  decision: AiDecision,
  sourceDefinition?: { type?: string },
): boolean {
  if (decision.fallbackUsed) return true;
  if (decision.reasonCode.endsWith(".recover_economy")) return true;
  if (
    decision.reasonCode.endsWith(".protect_hq") ||
    decision.reasonCode.endsWith(".protect_rnd")
  )
    return true;
  if (
    action.type === "install_card" &&
    action.payload?.placement !== "ice" &&
    sourceDefinition?.type !== "agenda"
  )
    return true;
  return (
    action.type === "mandatory_draw" ||
    action.type === "end_turn" ||
    action.type === "decline_rez" ||
    action.type === "rez_ice" ||
    action.type === "resolve_choice"
  );
}

function repeatedLowValueCentralRunTags(
  actionSequence: AiSimulationSummary["actionSequence"],
): string[] {
  const tags: string[] = [];
  const lastCentralRunByServer = new Map<string, number>();
  for (const [index, entry] of actionSequence.entries()) {
    if (
      entry.side !== "runner" ||
      entry.actionType !== "start_run" ||
      !entry.targetServerId ||
      !["rd", "hq", "archives"].includes(entry.targetServerId)
    )
      continue;
    const previous = lastCentralRunByServer.get(entry.targetServerId);
    if (
      previous !== undefined &&
      index - previous <= 4 &&
      !entry.reasonCode.includes("contest") &&
      !entry.reasonCode.includes("trash")
    )
      tags.push("repeated_low_value_central_run");
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
  "assetTrashNeglect",
];

function doctrineMetricsFor(tags: string[]): AiDoctrineQualityMetrics {
  return {
    nakedAgendaInstalls: countTag(tags, "naked_agenda_install"),
    agendaFloodExposure: countTag(tags, "agenda_flood_exposure"),
    scoreWindowMissed: countTag(tags, "score_window_missed"),
    remoteOverbuild: countTag(tags, "remote_overbuild"),
    economyStall: countTag(tags, "economy_stall"),
    repeatedLowValueCentralRun: countTag(
      tags,
      "repeated_low_value_central_run",
    ),
    rigStall: countTag(tags, "rig_stall"),
    assetTrashNeglect: countTag(tags, "asset_trash_neglect"),
  };
}

function emptyDoctrineCaseExamples(): Record<
  AiDoctrineQualityMetricName,
  AiDoctrineQualityCaseExample[]
> {
  return {
    nakedAgendaInstalls: [],
    agendaFloodExposure: [],
    scoreWindowMissed: [],
    remoteOverbuild: [],
    economyStall: [],
    repeatedLowValueCentralRun: [],
    rigStall: [],
    assetTrashNeglect: [],
  };
}

function doctrineMetricForQualityTag(
  tag: string,
): AiDoctrineQualityMetricName | undefined {
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
  maxExamplesPerMetric: number,
): void {
  const metric: AiDoctrineQualityMetricName = "repeatedLowValueCentralRun";
  const lastCentralRunByServer = new Map<string, number>();
  for (const [actionIndex, entry] of summary.actionSequence.entries()) {
    if (
      entry.side !== "runner" ||
      entry.actionType !== "start_run" ||
      !entry.targetServerId ||
      !["rd", "hq", "archives"].includes(entry.targetServerId)
    )
      continue;
    const previous = lastCentralRunByServer.get(entry.targetServerId);
    if (
      previous !== undefined &&
      actionIndex - previous <= 4 &&
      !entry.reasonCode.includes("contest") &&
      !entry.reasonCode.includes("trash") &&
      examples[metric].length < maxExamplesPerMetric
    ) {
      examples[metric].push(
        doctrineCaseExample(summary.seed, actionIndex, entry, metric),
      );
    }
    lastCentralRunByServer.set(entry.targetServerId, actionIndex);
  }
}

function doctrineCaseExample(
  seed: string,
  actionIndex: number,
  entry: AiSimulationSummary["actionSequence"][number],
  metric: AiDoctrineQualityMetricName,
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
    qualityTags: entry.qualityTags.slice().sort(),
  };
}

function isRedactionSafeCaseAnalysis(
  analysis: AiDoctrineQualityCaseAnalysis,
): boolean {
  const serialized = JSON.stringify(analysis);
  return !FORBIDDEN_AI_INPUT_FIELDS.some((needle) =>
    serialized.includes(needle),
  );
}

function sumDoctrineMetrics(
  metrics: AiDoctrineQualityMetrics[],
): AiDoctrineQualityMetrics {
  return metrics.reduce(
    (sum, entry) => ({
      nakedAgendaInstalls: sum.nakedAgendaInstalls + entry.nakedAgendaInstalls,
      agendaFloodExposure: sum.agendaFloodExposure + entry.agendaFloodExposure,
      scoreWindowMissed: sum.scoreWindowMissed + entry.scoreWindowMissed,
      remoteOverbuild: sum.remoteOverbuild + entry.remoteOverbuild,
      economyStall: sum.economyStall + entry.economyStall,
      repeatedLowValueCentralRun:
        sum.repeatedLowValueCentralRun + entry.repeatedLowValueCentralRun,
      rigStall: sum.rigStall + entry.rigStall,
      assetTrashNeglect: sum.assetTrashNeglect + entry.assetTrashNeglect,
    }),
    emptyDoctrineMetrics(),
  );
}

function diffDoctrineMetrics(
  candidate: AiDoctrineQualityMetrics,
  baseline: AiDoctrineQualityMetrics,
): AiDoctrineQualityDelta {
  return {
    nakedAgendaInstalls:
      candidate.nakedAgendaInstalls - baseline.nakedAgendaInstalls,
    agendaFloodExposure:
      candidate.agendaFloodExposure - baseline.agendaFloodExposure,
    scoreWindowMissed: candidate.scoreWindowMissed - baseline.scoreWindowMissed,
    remoteOverbuild: candidate.remoteOverbuild - baseline.remoteOverbuild,
    economyStall: candidate.economyStall - baseline.economyStall,
    repeatedLowValueCentralRun:
      candidate.repeatedLowValueCentralRun -
      baseline.repeatedLowValueCentralRun,
    rigStall: candidate.rigStall - baseline.rigStall,
    assetTrashNeglect: candidate.assetTrashNeglect - baseline.assetTrashNeglect,
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
    assetTrashNeglect: 0,
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
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  return value as Record<string, unknown>;
}

function deckDoctrineDebug(
  profile: AiDeckDoctrineProfile,
): NonNullable<AiDecisionDebug["ownDeckDoctrine"]> {
  return {
    schemaVersion: profile.schemaVersion,
    side: profile.side,
    confidence: profile.confidence,
    archetypeTags: profile.archetypeTags.slice(0, 4),
    riskFlags: profile.riskFlags.slice(0, 6),
  };
}

function confidence(score: number): number {
  return Math.max(0.1, Math.min(0.99, round(score / 1000)));
}

function compareAction(left: LegalAction, right: LegalAction): number {
  return left.actionId.localeCompare(right.actionId);
}
