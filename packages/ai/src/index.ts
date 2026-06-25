// Public package facade. Keep new AI behavior in focused runtime, decision,
// action, access, diagnostics, reports or simulation modules, then re-export
// only intentional public contracts here.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  applyAction,
  createGame,
  createGameAfterSetup,
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
import localRealisticBenchmarkDeckSnapshotsData from "../../../data/ai/ai-local-realistic-benchmark-deck-snapshots-2026-05-23.json";
import localRealisticBenchmarkDecksData from "../../../data/ai/ai-local-realistic-benchmark-decks-2026-05-23.json";
import realSceneBenchmarkDeckSnapshotsData from "../../../data/ai/ai-real-scene-benchmark-deck-snapshots-2026-05-24.json";
import realSceneBenchmarkDecksData from "../../../data/ai/ai-real-scene-benchmark-decks-2026-05-24.json";
import deckFormatProfiles130Data from "../../../data/decks/deck-format-profiles-1.3.0.json";
import deckSnapshots08Data from "../../../data/decks/deck-snapshots-0.8.json";
import {
  assessCorpFutureRunIcePlacement,
  assessCorpIcePortfolioAction,
  assessCorpScoreTerminalWindow,
  chooseCorpPlanAction,
  classifyCorpScoredAgendaAbility,
  classifyCorpFutureRunIceDefinitionId,
  hasCorpPlanAction,
} from "./corp-plans";
import { chooseRunnerPlanAction, hasRunnerPlanAction } from "./runner-plans";
import {
  reconstructBeliefState,
  type CorpOpponentModel,
  type RunnerOpponentModel,
} from "./belief-state";
import {
  buildDeckDoctrineProfile,
  evaluateCorpOpeningHand,
  evaluateRunnerOpeningHand,
  type AiDeckDoctrineDeckSnapshot,
} from "./deck-doctrine";
import type { DeckCapabilityProfile } from "./deck-capabilities";
import { buildDeckStrategyProfile } from "./deck-doctrine-strategy";
import {
  type RunnerStrategicIntentProfile,
} from "./runner-strategic-intent";
import {
  assessBlinkRiskForRunAction,
  blinkRiskShouldAvoidRun,
  buildBlinkRiskAssessment,
  buildRunnerEconomyPosture,
  evaluateRunnerRunTargets,
  randomBreakOrDamageRiskProfileForDefinitionId,
  runnerBlinkRecoveryAssessment,
  type BlinkRiskAssessment,
  type BlinkRiskPayoffOverride,
  type RunnerRunTargetEvaluation,
} from "./runner-run-target-evaluation";
import {
  runnerRunTargetHighPayoff,
  runnerRunTargetMultiRunPayoffClass,
  runnerRunTargetPlausibleForMultiRun,
  runnerRunTargetSemanticGuidanceValue,
} from "./runner-run-target-guidance";
import { evaluateRunnerHandDevelopment } from "./runner-hand-development";
import {
  buildRunnerTacticalGoals,
  type RunnerTacticalGoal,
} from "./runner-tactical-goals";
import {
  CARD_ROLES_BY_CARD,
  RUNTIME_CARDS,
  createAiHintsByCard,
  type AiCardHint,
} from "./ai-hints";
import {
  assessKnownRezzedIcePath,
  canBreakerDefinitionBreakIce,
  cardDefinitionStrength,
  creditsToBreakEndTheRunSubroutinesWithBreaker,
  endTheRunSubroutineCount,
  iceHasEndTheRun,
  runnerKnownPathAssessmentIsKnownNoAccess,
  runnerKnownPathAssessmentIsUnbreakableNoAccess,
  type KnownRezzedIcePathAssessment,
} from "./visible-run-analysis";
import {
  remoteRoleIsScoringProtectionKind,
} from "./remote-role-ontology-consumer";
import {
  classifyTagPunishLegalActionFromOntology,
  classifyTagPunishPayoffFromOntology,
  getStructuredTagPunishProfileForCard,
  type StructuredTagPunishPayoffKind,
} from "./tag-punish-ontology-consumer";
import { buildAiDecisionInputDto } from "./input-dto";
import {
  buildActionSemanticCandidates,
  type ActionSemanticCandidate,
} from "./action-semantic-candidate";
import { evaluateKnownCentralAccessPayoff } from "./known-central-access-payoff";
import { buildObservedFacts } from "./observed-facts-public";
import {
  buildAiDecisionInput,
  selectAiDecisionSideForState,
  type AiDecisionSideSelection,
} from "./runtime/ai-decision-input";
import { assertAiInputIsSideSafe } from "./simulation/side-safe-input";
import { createBeliefSimulationWorld } from "./simulation/belief-simulation-world";
import {
  buildServerFeatures,
  visibleCitySurveillanceSourceCount,
} from "./runtime/ai-feature-server";
import { rolesForAction as rolesForActionRuntime } from "./runtime/action-role-lookup";
import {
  extractAiFeatures as extractAiFeaturesRuntime,
  type AiFeatures,
} from "./runtime/ai-features";
import {
  cardDefinitionTypeForAi,
  runnerCardMechanicsForAi,
  visibleCardDefinition,
} from "./runtime/card-definition-lookup";
import {
  visibleRootIsKnownAgenda as visibleRootIsKnownAgendaRuntime,
} from "./runtime/visible-root-agenda";
import {
  createVisibleIcebreakerProgramPredicate,
} from "./runtime/visible-icebreaker-program";
import {
  chooseAiActionFromSides,
  type AiDecisionRuntimeOptions,
} from "./runtime/choose-ai-action";
import { memoizeLegacyDecision } from "./runtime/legacy-decision-provider";
import { compareAction } from "./runtime/action-order";
import { advancementCountersAddedForSimulationAction } from "./runtime/simulation-action-event";
import {
  sortedUniqueProgressionCardTargetTypes,
  type ProgressionCardTargetType,
} from "./runtime/progression-card-target";
import {
  advancedAgendaStealSourceForAction,
  cardTargetTypeForInstance,
  sourceDefinitionIdForSimulationAction as sourceDefinitionIdForSimulationSource,
} from "./runtime/simulation-card-target";
import {
  remoteTrashCostBucket,
  type RemoteTrashCostBucket,
} from "./runtime/remote-trash-cost";
import { type RemoteTrashTargetType } from "./runtime/remote-trash-target";
import {
  targetCardIdsForSimulationAction,
  targetServerIdForSimulationAction,
} from "./runtime/simulation-action-target";
import {
  selectedChoicesForDecision as selectedChoicesForDecisionRuntime,
} from "./runtime/selected-choices-for-decision";
import {
  breakSubroutineIndexesForAction,
  parseSubroutineIndexes,
} from "./runtime/subroutine-indexes";
import {
  isEndRunSubroutine,
  isImmediateSafetyThreatSubroutine,
  isTrashUnlessRunnerPaysSubroutine,
  type VisibleEncounterSubroutine,
} from "./runtime/encounter-subroutine";
import {
  currentEncounteredIceCard,
  currentRunHasFutureVisibleIce,
  currentRunRemainingIce,
  encounterHasImmediateUnbrokenThreat,
  runnerReachedAccessMovement,
} from "./runtime/current-encounter";
import {
  breakerIdForEncounterAction,
  pumpStrengthAmountForAction,
} from "./runtime/encounter-action";
import { runnerHasInstalledPrograms } from "./runtime/runner-installed-program";
import {
  findVisibleCorpServerCard,
  findVisibleCard,
  semanticRuntimeVisibleSourceCard,
  sourceDefinitionIdForAction,
} from "./runtime/visible-card-lookup";
import { titleForCardId } from "./runtime/card-title";
import { corpVisibleCardStoredCredits } from "./runtime/visible-card-credit";
import {
  corpVisibleRunnerHardwarePayoffEvidence,
} from "./runtime/runner-hardware-payoff-evidence";
import {
  corpVisibleRunnerHardwareTrashTarget,
  corpVisibleRunnerRigTrashTarget,
} from "./runtime/runner-rig-trash-target";
import {
  traceTagExpectedSuccessEstimate,
} from "./runtime/trace-tag-success-estimate";
import {
  tagPunishPayoffPriorityBonus,
} from "./runtime/tag-punish-payoff-priority";
import {
  corpPunishKindFromOntologyPayoff,
  corpVisibleTagPayoffCategoryFromOntology,
} from "./runtime/tag-punish-payoff-mapping";
import {
  shellTradersAbility,
  shellTradersTargetValue,
} from "./runtime/shell-traders-action";
import {
  shellTradersBacklog,
  shellTradersDirectInstallAction,
  shellTradersDirectInstallPreparePenalty,
  shellTradersImmediateRemoveAvailable,
  shellTradersPrepareBaselinePenalty,
} from "./runtime/shell-traders-context";
import { shellTradersDirectInstallUrgency } from "./runtime/shell-traders-urgency";
import { publicRoleEvidence } from "./runtime/role-evidence";
import {
  corpInstalledEconomyCreditAmount,
} from "./runtime/corp-installed-economy-credit";
import {
  corpSourceAdvancementCounterCreditPayoutAssessment,
  isSourceAdvancementCounterCreditPayoutAction,
} from "./runtime/corp-source-advancement-counter-credit-payout";
import {
  rndFreshRepeatRunBoost,
  staleKnownRndRepeatRunPenalty,
} from "./runtime/runner-rnd-repeat-run-score";
import { isLowValueKnownAccessCard } from "./runtime/runner-low-value-known-access-card";
import { staleKnownHqRepeatRunPenalty } from "./runtime/runner-hq-repeat-run-score";
import { staleKnownArchivesRepeatRunPenalty } from "./runtime/runner-archives-repeat-run-score";
import { recentRemoteJackOutRepeatRunPenalty } from "./runtime/runner-remote-repeat-run-score";
import {
  runnerRunReasonCode,
  runTargetEvidence,
  scoreRunTarget,
} from "./runtime/runner-run-target-score";
import { isBlockedByKnownRezzedIce } from "./runtime/runner-known-rezzed-ice-block";
import {
  scoreRunnerEvent,
  scoreRunnerInstall,
} from "./runtime/runner-card-action-score";
import {
  scoreCorpIceInstall,
  scoreCorpOperation,
  scoreCorpRootInstall,
} from "./runtime/corp-card-action-score";
import {
  AI_PROFILES,
  profileWeights,
} from "./runtime/profile-weights";
import type {
  CorpPunishKind,
  CorpTagPunishSkipReason,
  CorpTagPunishUnknownChosenFamily,
  CorpTagPunishUnknownSkipAttribution,
  CorpTagPunishUnknownSkipPlausibility,
  CorpVisibleTagPayoffCategory,
} from "./runtime/corp-tag-punish-types";
import type {
  CorpCentralRezReserveAssessment,
  CorpRemoteContestabilityAssessment,
  CorpTaggedRunnerPayoffActionProfile,
} from "./runtime/corp-scoring-assessment-types";
import type { RankedChoice } from "./runtime/ranked-choice";
import { centralServerId, isRemoteServerTarget } from "./runtime/server-target";
import {
  isCorpReactiveBaselineDecision,
  isRunnerReactiveBaselineDecision,
  semanticRuntimeActionTypeIsReactive,
  semanticRuntimeChoiceIsReactive,
} from "./runtime/reactive-action";
import {
  isRunnerEconomyRole,
  isRunnerNonAdditiveUtilityRole,
  isRunnerPressureRole,
} from "./runtime/runner-role-classification";
import {
  type PracticalMicroCandidate,
} from "./runtime/practical-micro-runtime";
import {
  createSemanticRuntimeDecisionContext,
} from "./runtime/semantic-runtime-decision-context";
import { createDeckCapabilitiesContext } from "./runtime/deck-capabilities-context";
import {
  createSemanticRuntimeVisibleCardContext,
} from "./runtime/semantic-runtime-visible-card-context";
import {
  roundSemanticRuntimeScore as roundScore,
  scrubEvidence,
  semanticRuntimeChoiceWithEvidence,
  semanticRuntimeScoreFromComponents,
} from "./runtime/semantic-runtime-score-components";
import {
  createSemanticRuntimeRunnerEvidenceContext,
} from "./runtime/semantic-runtime-runner-evidence-context";
import {
  createSemanticRuntimeCorpEvidenceContext,
} from "./runtime/semantic-runtime-corp-evidence-context";
import {
  createSemanticRuntimeEvidenceContext,
} from "./runtime/semantic-runtime-evidence-context";
import {
  createSemanticRuntimeCorpRiskContext,
} from "./runtime/semantic-runtime-corp-risk-context";
import {
  createSemanticRuntimeCorpRezFloorContext,
} from "./runtime/semantic-runtime-corp-rez-floor-context";
import {
  createSemanticRuntimeCorpRemoteScoreContext,
} from "./runtime/semantic-runtime-corp-remote-score-context";
import {
  createSemanticRuntimeCorpPassiveScoreLineContext,
} from "./runtime/semantic-runtime-corp-passive-scoreline-context";
import {
  createSemanticRuntimeCorpAdvancementCounterContext,
} from "./runtime/semantic-runtime-corp-advancement-counter-context";
import {
  createSemanticRuntimeCorpBoardContext,
} from "./runtime/semantic-runtime-corp-board-context";
import {
  createSemanticRuntimeCorpScoreSafetyContext,
} from "./runtime/semantic-runtime-corp-score-safety-context";
import {
  createSemanticRuntimeScoreBreakdownContext,
} from "./runtime/semantic-runtime-score-breakdown";
import { semanticRuntimeServerId } from "./runtime/semantic-runtime-scope";
import {
  createSemanticRuntimeChoiceBuilderContext,
} from "./runtime/semantic-runtime-choice-builder-context";
import { semanticRuntimeExplanation } from "./runtime/semantic-runtime-explanation";
import { stringRecordValue } from "./runtime/record-value";
import {
  createSemanticRuntimeActionExclusionContext,
} from "./runtime/semantic-runtime-action-exclusion-context";
import {
  createRunnerRunOnlyActionContext,
  runnerRunActionSpendingCapAssessment,
} from "./runtime/runner-run-only-action-adjustment";
import {
  createRunnerSelfDamageContext,
} from "./runtime/runner-self-damage-context";
import {
  createRunnerBaselinePlanGuardContext,
} from "./runtime/runner-baseline-plan-guard-context";
import {
  createRunnerBlinkRiskContext,
} from "./runtime/runner-blink-risk-context";
import {
  createRunnerBlinkBreakExclusionContext,
} from "./runtime/runner-blink-break-exclusion";
import {
  createRunnerEncounterActionExclusionContext,
} from "./runtime/runner-encounter-action-exclusion";
import {
  createSemanticRuntimePlanMemoryExclusionContext,
} from "./runtime/semantic-runtime-plan-memory-exclusion";
import { createRunnerSimpleExclusionsContext } from "./runtime/runner-simple-exclusions-context";
import {
  createRunnerSourceCardAnswerRoleContext,
} from "./runtime/runner-source-card-answer-role-context";
import { runnerHandBufferNeedScoreComponent } from "./runtime/runner-hand-buffer-need";
import {
  createRunnerHandFundingContext,
} from "./runtime/runner-hand-funding-context";
import {
  createRunnerScoreComponentsContext,
} from "./runtime/runner-score-components";
import {
  runnerMultiRunEventScoreValue,
} from "./runtime/runner-multi-run-event-score";
import { createRunnerMultiRunContext } from "./runtime/runner-multi-run-context";
import { createRunnerBankInvestmentContext } from "./runtime/runner-bank-investment-context";
import { createRunnerNoRunEconomyContext } from "./runtime/runner-no-run-economy-context";
import {
  createRunnerBadPublicityRelevanceContext,
} from "./runtime/runner-bad-publicity-relevance-context";
import { createRunnerLoanContext } from "./runtime/runner-loan-context";
import { runnerProjectedCreditGainForAction } from "./runtime/runner-loan-credit-projection";
import {
  createRunnerViral15JackOutContext,
} from "./runtime/runner-viral15-jack-out-context";
import { createRunnerRecoveryContext } from "./runtime/runner-recovery-context";
import {
  safeNonNegativeInteger,
  visibleCardsByInstanceId as visibleCardsByInstanceIdForAi,
  visibleCounterValue as visibleCounterValueForAi,
  visibleInstallCost as visibleInstallCostForAi,
  visibleMemoryCost as visibleMemoryCostForAi,
} from "./runtime/visible-card-heuristics";
import {
  visibleBreakerRoleCounts as visibleBreakerRoleCountsForAi,
  visibleBreakerRoles as visibleBreakerRolesForAi,
} from "./runtime/runner-visible-breaker-coverage";
import {
  createRunnerVisibleCardContext,
} from "./runtime/runner-visible-card-context";
import { createRunnerPersistentInstallContext } from "./runtime/runner-persistent-install-context";
import { createRunnerMuPressureContext } from "./runtime/runner-mu-pressure-context";
import {
  createRunnerProgramInstallTrashContext,
} from "./runtime/runner-program-install-trash-context";
import {
  createRunnerRunTargetGuidanceContext,
} from "./runtime/runner-run-target-guidance-context";
import {
  actionClickCost,
  actionCreditCost,
} from "./runtime/action-cost";
import {
  addStringsToCounter as addCardsToCounter,
  addStringsToCounter as addKindsToCounter,
  incrementStringCounter,
  incrementTypedCounter,
} from "./runtime/counter";
import {
  minNumberOrZero as minDefined,
  sortedUnique,
} from "./runtime/collection";
import { fnv1a } from "./runtime/stable-hash";
import { scoreConfidence as confidence } from "./runtime/score-confidence";
import {
  evidenceNumber,
  evidenceValue,
  hasEvidenceFlag,
  hasEvidencePrefix,
} from "./runtime/evidence-value";
import { roundNumber as round } from "./runtime/number-rounding";
import { cardRolesForId } from "./runtime/card-role-lookup";
import {
  eventMayChangeHqPressure as aiEventMayChangeHqPressure,
  eventVersion as aiEventVersion,
  findLastHistoryIndex as findLastAiHistoryIndex,
  mergedPublicHistory as mergedAiPublicHistory,
  serverIdFromEvent as aiServerIdFromEvent,
} from "./runtime/public-event-history";
import { selectableChoiceOptions } from "./runtime/choice-option";
import {
  discardCurrentPlanKind,
  discardEvidenceForInput,
} from "./runtime/discard-plan";
import {
  createDiscardKeepScore,
} from "./runtime/discard-keep-score";
import {
  isSearchChoice,
} from "./runtime/search-choice-option";
import { rolesMatch as discardRolesMatch } from "./runtime/role-match";
import {
  createRunnerCentralMemoryContext,
} from "./runtime/runner-central-memory-context";
import { createRunnerRunComponentsContext } from "./runtime/runner-run-components-context";
import {
  runnerKnownIcePathReason as semanticRuntimeKnownIcePathReason,
} from "./runtime/runner-known-ice-path-score";
import {
  createRunnerRecentHistoryContext,
} from "./runtime/runner-recent-history-context";
import {
  createRunnerStrategicIntentContext,
} from "./runtime/runner-strategic-intent-context";
import {
  createSemanticRuntimeCorpScoreContext,
} from "./runtime/semantic-runtime-corp-score-context";
import { createSemanticRuntimeDebugContext } from "./runtime/semantic-runtime-debug-context";
import {
  bestSemanticRuntimeChoice,
  bestSemanticRuntimeChoiceForTacticalPlanOverride,
  tacticalPlanMappedChoice,
  tacticalPlanMappingOverrideEvidence,
  tacticalPlanRuntimeAlignedToChoice,
} from "./runtime/semantic-choice-ranking";
import type {
  SemanticRuntimeChoice,
  SemanticRuntimeCoverageSelectionDebug,
  SemanticRuntimeExclusion,
} from "./runtime/semantic-runtime-types";
import {
  DEFAULT_SELFPLAY_TRACE_MINING_DETECTORS,
  countSelfplayFindingsByDetector,
  countSelfplayFindingsBySeverity,
  detectAiSelfplaySuspiciousDecisions,
  isSelfplayTraceRedactionSafe,
  safeSelfplayFacts,
  sortedUniqueSelfplayDetectors,
  summarizeSelfplayActionLimitClusters,
  summarizeSelfplayActionLimitSubclusters,
  type AiSelfplayTraceMiningConfig,
  type AiSelfplayTraceMiningResult,
} from "./simulation/selfplay-trace-mining";
import type {
  SimulationBenchmarkProfile,
  SimulationBenchmarkProfileId,
  SimulationControllerMode,
  SimulationWorld,
} from "./simulation/simulation-types";
import type {
  V143LeagueConfig,
  V143SimulationRunResult,
  V143SoakResult,
} from "./simulation/v143-tuning-gate";
import type {
  AiDoctrineQualityBenchmarkConfig,
  AiDoctrineQualityBenchmarkResult,
} from "./simulation/doctrine-quality-benchmark-types";
import type {
  V143ExploitFixture,
  V143ExploitRegressionResult,
} from "./simulation/v143-fixture-types";
import type {
  AiBenchmarkDeckReference,
  AiBenchmarkDeckSlotDefinition,
  AiBenchmarkDeckSlotStatus,
  AiBenchmarkDeckSlotType,
  AiBenchmarkLocalEditableDeckResult,
  AiBenchmarkSnapshotDeck,
  AiLocalBenchmarkDeckClassification,
  DeckSnapshotRecord,
  FrozenLocalBenchmarkDeckSnapshot,
  LocalRealisticBenchmarkDeckManifest,
  RealSceneBenchmarkDeckManifest,
} from "./simulation/benchmark-deck-types";
import {
  createSimulationRng,
  type SimulationRng,
} from "./simulation/simulation-rng";
import {
  DOCTRINE_QUALITY_METRIC_NAMES,
  averageNumber,
  diffDoctrineMetrics,
  medianNumber,
  sumDoctrineMetrics,
} from "./simulation/simulation-metric-aggregation";
import {
  analyzeDoctrineQualityCases,
  isAgendaFloodExposureExemptAction,
  isEconomyStallExemptAction,
  qualityTagsForActionWithDependencies,
  summarizeDoctrineQualityMetrics,
  type AiDoctrineQualityCaseAnalysis,
  type AiDoctrineQualityCaseExample,
  type AiDoctrineQualityDelta,
  type AiDoctrineQualityGateResult,
  type AiDoctrineQualityGateThresholds,
  type AiDoctrineQualityMetricName,
  type AiDoctrineQualityMetrics,
} from "./simulation/doctrine-quality-tags";
import {
  averageTurnsFromFinalAdvanceToScoreOrSteal,
  countCorpMultiIceInstallOrderFutureEffectDead,
  countCorpMultiIceInstallOrderOptimized,
  isCorpRemoteAdvancementProgress,
  progressionEntriesWithRunTargets,
} from "./simulation/progression-action-sequence";
import type {
  BreakerOntologyCoverageMetricKey,
  RemoteRoleKindMetricKey,
  RemoteRoleServerScopeMetricKey,
} from "./simulation/ontology-metric-key-types";
import type { CorpIcePortfolioMetricKey } from "./simulation/corp-ice-portfolio-types";
import type {
  RunnerCoveragePressureForMetrics,
  RunnerPressureReadyForMetrics,
  RunnerPressureReadyTargetForMetrics,
} from "./simulation/runner-pressure-metric-types";
import type { RunnerEconomySetupActionClass } from "./simulation/runner-economy-setup-types";
import type { RunnerSetupMissingCoverageType } from "./simulation/runner-setup-coverage-types";
import type { AiSimulationActionSequenceEntry } from "./simulation/ai-simulation-action-sequence-entry";
import type { AiSimulationConfig } from "./simulation/ai-simulation-config";
import type { AiSimulationSummary } from "./simulation/ai-simulation-summary";
import type {
  AiBenchmarkDeckSlotResult,
  AiMatchProgressionBenchmarkResult,
  AiMatchProgressionBenchmarkSuiteResult,
  AiMatchProgressionMetrics,
} from "./simulation/ai-match-progression-types";
import type { RunnerSetupAttributionMetricKey } from "./simulation/runner-setup-attribution-types";
import {
  agendaPointsForMetrics,
  definitionTypeForMetrics,
  remoteRootTrashCostForMetrics,
  remoteTrashCostForVisibleCard,
  trashCostForDefinitionForMetrics,
} from "./simulation/card-metric-lookup";
import {
  centralPressureTargetIsGoodForMetrics,
  centralPressureTargetsForCard,
  isCentralPressureCardForMetrics,
} from "./simulation/central-pressure-card";
import {
  runnerCentralRunBurnsRemoteContestReserve as runnerCentralRunBurnsRemoteContestReserveWithDeps,
  runnerCentralRunHasClearPressureJustification as runnerCentralRunHasClearPressureJustificationWithDeps,
  runnerCentralRunPressureJustificationReasons as runnerCentralRunPressureJustificationReasonsWithDeps,
} from "./simulation/central-run-pressure-justification";
import {
  bestTrueCentralCloseoutProfile as bestTrueCentralCloseoutProfileWithDeps,
  centralRunEventGoodForTarget as centralRunEventGoodForTargetWithSource,
  noFreshCentralSubstitutionTypeForAction as noFreshCentralSubstitutionTypeForActionWithDeps,
  runnerNoFreshCentralContext as runnerNoFreshCentralContextWithDeps,
  trueCentralCloseoutProfile as trueCentralCloseoutProfileWithDeps,
} from "./simulation/no-fresh-central";
import {
  centralRunStreakWithoutValueForMetrics,
  centralRepeatHasFreshValueForMetrics,
  isRepeatedLowValueCentralRunForMetrics,
  recentCentralRunSameTargetWithoutRefresh,
} from "./simulation/central-run-history";
import {
  hasRunnerRemoteTrashAction,
  remoteServerHasScoreThreat,
  runnerAdvancedRemoteContestContext,
  runnerContestBlockedByCredits,
  runnerHasVisibleRemoteScoreThreat,
  runnerRemoteHasKnownRelevantTrashTarget,
  runnerRemoteThreatProfile as runnerRemoteThreatProfileWithReserve,
  runnerRemoteThreatTargetingDiagnosticsForAction as runnerRemoteThreatTargetingDiagnosticsForActionWithDeps,
  runnerStealBlockedByCredits,
  runnerTrashBlockedByCredits,
  type RunnerRemoteThreatProfile,
} from "./simulation/remote-server-threat";
import {
  finalAdvanceAssessmentForSimulationAction,
  isProtectBeforeAdvanceSimulationAction,
} from "./simulation/final-advance-assessment";
import { missingBenchmarkDeckFormatProfile } from "./simulation/benchmark-deck-format-profile";
import { deckReferenceLabel } from "./simulation/benchmark-deck-reference-label";
import { benchmarkDeckManifestEntry } from "./simulation/benchmark-deck-manifest-entry";
import { benchmarkProfileById } from "./simulation/benchmark-profile-lookup";
import { resolveLocalDeckEditorDecksDir } from "./simulation/local-deck-editor-dir";
import { classifyLocalEditableBenchmarkDeck } from "./simulation/local-editable-benchmark-classification";
import { validateSimulationDeckSupport } from "./simulation/deck-support";
import {
  remoteTrashRoleForVisibleCard,
  type RemoteTrashRole,
} from "./simulation/remote-trash-role";
import { buildRunnerRemoteTrashAccessContext } from "./simulation/remote-trash-access-context";
import { chooseRandomLegalDecision } from "./simulation/random-legal-decision";
import {
  runnerPostRunReserveTargetForRemoteInput as runnerPostRunReserveTargetForRemoteInputWithDeps,
  runnerCreditReserveTargetForInput as runnerCreditReserveTargetForInputWithRoles,
} from "./simulation/runner-credit-reserve";
import {
  metricsForSimulationActionSequence,
  type AiQualityMetrics,
  type AiSoakResult,
} from "./simulation/quality-metrics";
import {
  hasRunnerInstallableBreakerActionForSimulation,
  hasRunnerPlayableEconomyActionForSimulation,
  hasRunnerRunnablePressureActionForSimulation,
  isRunnerDuplicateInstallForSimulation,
  isRunnerEconomyActionForSimulation,
  isRunnerLowValueDuplicateInstallForSimulation,
  isRunnerPressureActionForSimulation,
  isRunnerRigInstallActionForSimulation,
  runnerDiscardChoiceRolesForSimulation,
  runnerDrawKindForSimulationAction as runnerDrawKindForSimulationActionWithDeps,
} from "./simulation/runner-install-classification";
import {
  runnerHasRecentRunOnServer,
  runnerRunTargetHasOnlyUnknownOrUnrezzedIce,
} from "./simulation/runner-run-target-context";
import {
  runnerCoverageRepairDiagnostic as runnerCoverageRepairDiagnosticWithDeps,
  runnerKnownPathDiagnosticsForAction as runnerKnownPathDiagnosticsForActionWithDeps,
  runnerKnownNoAccessLegalRunTargets as runnerKnownNoAccessLegalRunTargetsWithDeps,
  type RunnerKnownNoAccessTarget,
} from "./simulation/runner-known-no-access";
import {
  countSameStrategicPlanRepeatsWithoutProgress,
  isEndgameKnownInfoOpportunity,
  isEndgameKnownInfoTaken,
  isEndgameLowValueRepeatAction,
  isEndgameProtectionAction,
  isEndgameSetupOrEconomyAction,
  isCorpEndgameStallSymptom,
  isCorpEndgameScorePathOpportunity,
  isCorpEndgameScorePathTaken,
  isEndgameScoreOrStealPressureAction,
  isRunnerEndgameMeaningfulRunOpportunity,
  isRunnerEndgameMeaningfulRunTaken,
  isRunnerEndgameStallSymptom,
  summarizeRunnerEndgameCloseoutWindow,
} from "./simulation/runner-endgame-closeout";
import {
  actionsUntil,
  advanceConvertsToScore,
  centralPressureConvertsToSteal,
  corpAdvanceConvertsToScoreOrProtectedWindow,
  corpCompressionActionLeadsToScoreLine,
  corpEconomyConvertsToRezInstallScore,
  corpProtectionConvertsToScoreSafety,
  corpRemoteBuildConvertsToAdvanceProtectOrScore,
  corpRemoteCreatedConverts,
  corpRemoteCreatedConvertsTo,
  economyActionConvertsToRun,
  isCorpProtectionScoreConversionAction,
  isCorpRemoteProtectionActionEntry,
  hasMeaningfulProgressWithin,
  isRunnerCentralPressureAction,
  isRunnerEconomyProgressAction,
  isRunnerRigProgressAction,
  isRunnerSetupAction,
  isStrategicPlanDecision,
  nextEntries,
  nextEntriesForSide,
  ownStrategicWindow,
  planConversionEntryHasMeaningfulBoardProgress,
  planKindForConversion,
  planIntentConvertedWithin,
  remoteBuildConvertsToAdvanceOrScore,
  remoteContestConvertsToStealOrTrash,
  remoteTargetsMatch,
  runnerCentralPressureConvertsToStealOrFreshValue,
  runnerEconomyConvertsToRunOrRig,
  runnerProbeConvertsToUsefulInfoOrPivot,
  runnerRemoteContestConvertsToStealTrashOrAbort,
  runnerRigConvertsToRun,
  runnerStealsBeforeNextCorpScore,
  serverTargetsMatch,
  scorePathFollowsCorpProtection,
  rigActionConvertsToRun,
  setupActionConvertsToRun,
  strategicPlanConvertsWithinOwnDecisions,
} from "./simulation/plan-conversion-predicates";
import { visibleBreakCostForKnownIceDefinition } from "./simulation/visible-break-cost-metric";
import {
  chooseCorpLegacyBaselineAction,
  chooseRunnerLegacyBaselineAction,
  type LegacyBaselineChoice,
} from "./legacy/legacy-baseline";
import { decisionFromLegacyChoices } from "./legacy/decision-from-choices";
import {
  retainActionAlternativesForFindingWindows,
  stripSelfplayActionAlternatives,
} from "./simulation/selfplay-trace-facts";
import { selfplayTraceFactsForSimulationDecision } from "./simulation/selfplay-trace-facts-adapter";
import {
  applyFixtureAction,
  applyFixtureChoiceFirstOption,
} from "./simulation/fixture-actions";
import {
  countPassiveActionWithScoreLineAvailable,
  countUnsafeScoreChosen,
} from "./simulation/score-window-counts";
import { isHoldoutSeed } from "./simulation/holdout-seed";
import { simulationSafeSelectedActionId } from "./simulation/selected-action-id";
import {
  BENCHMARK_PROFILES_143,
  EXPLOIT_FIXTURES_143,
  listV143BenchmarkProfiles,
  listV143ExploitFixtures,
} from "./simulation/v143-data";
import { SOAK_SEEDS, SOAK_SEEDS_143 } from "./simulation/soak-seed-data";
import {
  controllerModeForSide,
  deckSnapshotForSimulation,
  profileIdForMode,
  simulationDeckConfig,
} from "./simulation/simulation-config-helpers";
import {
  evaluateTacticalPlans,
  getTacticalPlanMemorySnapshot,
  rememberTacticalPlanRuntime,
  type TacticalPlanRuntimeResult,
} from "./tactical-plans";
import {
  CURRENT_RULES_BASELINE,
  DEMO_CARDS_BY_ID,
  DEMO_DECKS,
  type AiDecision,
  type AiDecisionInput,
  type AiDecisionScoreComponent,
  type AiDifficulty,
  type DeckDefinition,
  type DeckPublicMetadata,
  type GameState,
  type LegalAction,
  type PlayerView,
  type PublicGameEvent,
  type Side,
  type VisibleCard,
  type VisibleEffectiveIceRunQuote,
} from "@netgrid/shared";
export {
  beliefDebugSummary,
  beliefStateInvariantSignature,
  reconstructBeliefState,
} from "./belief-state";
export {
  evaluateDoctrineQualityGate,
  formatAiSelfplayTraceMiningReport,
  formatDoctrineQualityBenchmarkReport,
  formatMatchProgressionBenchmarkReport,
  formatMatchProgressionBenchmarkSuiteReport,
} from "./simulation/benchmark-reports";
export {
  listV143BenchmarkProfiles,
  listV143ExploitFixtures,
} from "./simulation/v143-data";
export {
  analyzeDoctrineQualityCases,
  summarizeDoctrineQualityMetrics,
} from "./simulation/doctrine-quality-tags";
export type {
  AiDoctrineQualityCaseAnalysis,
  AiDoctrineQualityCaseExample,
  AiDoctrineQualityDelta,
  AiDoctrineQualityGateResult,
  AiDoctrineQualityGateThresholds,
  AiDoctrineQualityMetricName,
  AiDoctrineQualityMetrics,
} from "./simulation/doctrine-quality-tags";
export { evaluateV143TuningGate } from "./simulation/v143-tuning-gate";
export type {
  V143LeagueConfig,
  V143SimulationRunResult,
  V143SoakResult,
  V143TuningGateResult,
} from "./simulation/v143-tuning-gate";
export type {
  AiDoctrineQualityBenchmarkConfig,
  AiDoctrineQualityBenchmarkResult,
} from "./simulation/doctrine-quality-benchmark-types";
export type {
  V143ExploitFixture,
  V143ExploitRegressionResult,
} from "./simulation/v143-fixture-types";
export type {
  AiBenchmarkDeckReference,
  AiBenchmarkDeckSlotDefinition,
  AiBenchmarkDeckSlotStatus,
  AiBenchmarkDeckSlotType,
  AiBenchmarkLocalEditableDeckResult,
  AiBenchmarkSnapshotDeck,
  AiLocalBenchmarkDeckClassification,
} from "./simulation/benchmark-deck-types";
export type {
  AiQualityMetrics,
  AiSoakResult,
} from "./simulation/quality-metrics";
export { formatDoctrineQualityCaseAnalysisReport } from "./reports/simulation-report-formatters";
export { detectAiSelfplaySuspiciousDecisions } from "./simulation/selfplay-trace-mining";
export type {
  AiSelfplayActionLimitClusterId,
  AiSelfplayActionLimitSubclusterId,
  AiSelfplaySuspicionSeverity,
  AiSelfplaySuspiciousDecision,
  AiSelfplayTraceMiningConfig,
  AiSelfplayTraceMiningDetectorId,
  AiSelfplayTraceMiningDetectorOptions,
  AiSelfplayTraceMiningResult,
} from "./simulation/selfplay-trace-mining";
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
  ACTION_SEMANTIC_CANDIDATE_COVERAGE_REPORT_VERSION,
  ACTION_SEMANTIC_COVERAGE_GROUPS,
  formatActionSemanticCandidateCoverageReport,
  summarizeActionSemanticCandidateCoverage,
} from "./actions/action-semantic-coverage";
export type {
  ActionSemanticCandidateCoverageRow,
  ActionSemanticCandidateCoverageSummary,
  ActionSemanticCoverageGroup,
} from "./actions/action-semantic-coverage";
export {
  buildLegalActionWitness,
  legalActionWitnessIsRedactionSafe,
} from "./legalaction-witness";
export {
  buildTargetRef,
  targetRefFromIdentity,
  targetRefIsCompleteOrIrrelevant,
  targetRefIsRedactionSafe,
} from "./target-ref";
export { buildWitnessOpportunityProjection } from "./witness-opportunity-projection";
export { buildPlayerActionFromWitness } from "./playeraction-dry-run-builder";
export { evaluateStalePunishGoalSwitchShadow } from "./stale-punish-goal-switch-shadow";
export type {
  BuildLegalActionWitnessInput,
  LegalActionWitness,
  LegalActionWitnessAbilityRef,
  LegalActionWitnessChoiceRef,
  LegalActionWitnessCostProfile,
  LegalActionWitnessRedactionPolicy,
  LegalActionWitnessSourceRef,
  LegalActionWitnessTargetRef,
  LegalActionWitnessTimingProfile,
} from "./legalaction-witness";
export type {
  TargetRef,
  TargetRefInput,
  TargetRefKind,
  TargetRefRedactionPolicy,
} from "./target-ref";
export type {
  BuildWitnessOpportunityProjectionInput,
  WitnessOpportunityProjection,
  WitnessOpportunityProjectionStatus,
} from "./witness-opportunity-projection";
export type { PlayerActionWitnessBuildInput } from "./playeraction-dry-run-builder";
export type {
  StalePunishGoalSwitchInput,
  StalePunishGoalSwitchShadow,
  StalePunishRootCause,
} from "./stale-punish-goal-switch-shadow";
export {
  buildAiDecisionInput,
  selectAiDecisionSideForState,
} from "./runtime/ai-decision-input";
export type {
  AiDecisionInputWithDeckCapabilities,
  AiDecisionSideSelection,
} from "./runtime/ai-decision-input";
export { assertAiInputIsSideSafe } from "./simulation/side-safe-input";
export { createBeliefSimulationWorld } from "./simulation/belief-simulation-world";

export {
  chooseCorpPlanAction,
  chooseCorpPlanDecision,
  assessCorpFutureRunIcePlacement,
  assessCorpIcePortfolioAction,
  assessCorpScoreTerminalWindow,
  classifyCorpScoredAgendaAbility,
  classifyCorpFutureRunIceDefinitionId,
  classifyScoredAgendaActionFromOntology,
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
  CorpIcePortfolioActionAssessment,
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
  evaluatePracticalTacticBenchmark,
  frozenLegacyPracticalTacticSelector,
} from "./evaluation/practical-tactic-benchmark";
export type {
  PracticalTacticBenchmarkCase,
  PracticalTacticBenchmarkCategory,
  PracticalTacticBenchmarkResult,
} from "./evaluation/practical-tactic-benchmark";
export {
  buildDeckDoctrineProfile,
  evaluateCorpOpeningHand,
  evaluateRunnerOpeningHand,
} from "./deck-doctrine";
export {
  buildDeckCapabilityProfile,
  buildDeckCapabilityProfileFromInput,
  redactedDeckCapabilityFacts,
} from "./deck-capabilities";
export { buildDeckStrategyProfile } from "./deck-doctrine-strategy";
export {
  RUNNER_CREDIT_BASE_PLAN_SCHEMA_VERSION,
  RUNNER_ECONOMY_POSTURE_SCHEMA_VERSION,
  RUNNER_RUN_TARGET_EVALUATION_SCHEMA_VERSION,
  buildRunnerEconomyPosture,
  evaluateRunnerRunTargets,
} from "./runner-run-target-evaluation";
export {
  RUNNER_HAND_DEVELOPMENT_EVALUATION_SCHEMA_VERSION,
  RUNNER_PERSISTENT_INSTALL_EVALUATION_SCHEMA_VERSION,
  evaluateRunnerHandDevelopment,
  redactedRunnerHandDevelopmentFacts,
} from "./runner-hand-development";
export {
  RUNNER_TACTICAL_GOAL_SCHEMA_VERSION,
  buildRunnerTacticalGoals,
  redactedRunnerTacticalGoalFacts,
} from "./runner-tactical-goals";
export {
  RUNNER_STRATEGIC_INTENT_SCHEMA_VERSION,
  buildRunnerStrategicIntentProfile,
} from "./runner-strategic-intent";
export type {
  AiDeckDoctrineDeckSnapshot,
  CorpOpeningHandEvaluation,
  OpeningHandEvaluation,
  RunnerOpeningHandEvaluation,
} from "./deck-doctrine";
export type {
  BreakerCapability,
  BreakerCoverageKind,
  BreakerCoverageMatrix,
  BuildDeckCapabilityProfileParams,
  CoverageState,
  DeckCapabilityConfidence,
  DeckCapabilityProfile,
  EconomyBankTool,
  MemoryCapabilityProfile,
  MissingCapability,
  SearchAccessProfile,
} from "./deck-capabilities";
export type {
  AiDeckStrategyProfile,
  CorpDeckStrategyProfiles,
  DeckStrategyConfidence,
  DeckStrategyEvidence,
  DeckStrategyScore,
  RunnerDeckStrategyProfiles,
} from "./deck-doctrine-strategy";
export type {
  EvaluateRunnerRunTargetsParams,
  RunnerAccessPayoff,
  RunnerCreditBaseHandCandidate,
  RunnerCreditBasePlan,
  RunnerCreditBasePlanRecommendation,
  RunnerEconomyPosture,
  RunnerKnownAccessState,
  RunnerPathPassability,
  RunnerRunTargetEvaluation,
  RunnerRunTargetKind,
  RunnerRunTargetRecommendation,
} from "./runner-run-target-evaluation";
export type {
  EvaluateRunnerHandDevelopmentParams,
  RunnerHandDevelopmentAvailability,
  RunnerHandDevelopmentCurrentNeed,
  RunnerHandDevelopmentDeferReason,
  RunnerHandDevelopmentEvaluation,
  RunnerHandDevelopmentFundingNeed,
  RunnerHandDevelopmentRole,
  RunnerHandDevelopmentStrategicFit,
  RunnerPersistentInstallCapabilityDelta,
  RunnerPersistentInstallDuplicateRole,
  RunnerPersistentInstallEvaluation,
  RunnerPersistentInstallStackabilityClass,
} from "./runner-hand-development";
export type {
  BuildRunnerTacticalGoalsParams,
  RunnerTacticalGoal,
  RunnerTacticalGoalFamily,
  RunnerTacticalGoalId,
} from "./runner-tactical-goals";
export type {
  BuildRunnerStrategicIntentProfileParams,
  RunnerExecutionStyle,
  RunnerPressureVector,
  RunnerPrimaryWinIntent,
  RunnerRejectedIntent,
  RunnerRiskProfile,
  RunnerSetupEngine,
  RunnerStrategicIntentConfidence,
  RunnerStrategicIntentProfile,
} from "./runner-strategic-intent";
export {
  classifyBreakerCoverageFromOntology,
  compareBreakerProfilesForCoverage,
  estimateBreakerCostProfileFromOntology,
  estimateStructuredBreakerCostForIce,
  getStructuredBreakerProfileForCard,
  structuredBreakerProfileCoversIce,
} from "./breaker-ontology-consumer";
export {
  classifyRemoteRoleFromOntology,
  getStructuredRemoteRoleForCard,
  remoteRoleIsScoringProtectionKind,
  structuredRemoteRoleSafetyAssessmentForCard,
} from "./remote-role-ontology-consumer";
export {
  classifyTagPunishLegalActionFromOntology,
  classifyTagPunishPayoffFromOntology,
  classifyTagSourceFromOntology,
} from "./tag-punish-ontology-consumer";
export { buildAiDeckOntologySummary } from "./hint-ontology-doctrine";
export { buildObservedFacts };
export type {
  AiDeckOntologyBreakerCoverageSummary,
  AiDeckOntologyConditionCounts,
  AiDeckOntologyDeckSnapshot,
  AiDeckOntologyEffectCounts,
  AiDeckOntologyLineSupportCounts,
  AiDeckOntologyQualitySummary,
  AiDeckOntologyRemoteRoleSummary,
  AiDeckOntologyScoredAgendaActionSummary,
  AiDeckOntologySummary,
  AiDeckOntologyTagPunishSummary,
  AiDeckOntologyValidationSummary,
} from "./hint-ontology-doctrine";
export type { AiObservedFacts } from "./observed-facts-public";

export type {
  AiBenchmarkDeckSlotResult,
  AiMatchProgressionBenchmarkResult,
  AiMatchProgressionBenchmarkSuiteResult,
  AiMatchProgressionMetrics,
  AiMatchProgressionProfileComparison,
} from "./simulation/ai-match-progression-types";
export type {
  AiSimulationConfig,
} from "./simulation/ai-simulation-config";
export type {
  AiSimulationSummary,
} from "./simulation/ai-simulation-summary";
export type {
  SimulationControllerMode,
  SimulationBenchmarkProfileId,
  SimulationBenchmarkProfile,
  SimulationWorld,
} from "./simulation/simulation-types";

const AI_HINTS = createAiHintsByCard();

const DECK_SNAPSHOTS_08 = (
  deckSnapshots08Data as { snapshots: DeckSnapshotRecord[] }
).snapshots;

const LOCAL_REALISTIC_FROZEN_DECK_SNAPSHOTS = (
  localRealisticBenchmarkDeckSnapshotsData as {
    snapshots: FrozenLocalBenchmarkDeckSnapshot[];
  }
).snapshots;
const REAL_SCENE_FROZEN_DECK_SNAPSHOTS = (
  realSceneBenchmarkDeckSnapshotsData as {
    snapshots: FrozenLocalBenchmarkDeckSnapshot[];
  }
).snapshots;

const LOCAL_REALISTIC_BENCHMARK_DECKS =
  localRealisticBenchmarkDecksData as LocalRealisticBenchmarkDeckManifest;
const REAL_SCENE_BENCHMARK_DECKS =
  realSceneBenchmarkDecksData as RealSceneBenchmarkDeckManifest;
const BENCHMARK_RUNTIME_CARDS_BY_ID = createRuntimeCardsById();
const BENCHMARK_DECK_FORMAT_PROFILE: DeckFormatProfile =
  (deckFormatProfiles130Data.profiles as DeckFormatProfile[]).find(
    (profile) => profile.profileId === "netgrid_private_local_v1",
  ) ?? missingBenchmarkDeckFormatProfile();

const LOCAL_REALISTIC_BENCHMARK_DECK_SLOTS: AiBenchmarkDeckSlotDefinition[] =
  LOCAL_REALISTIC_BENCHMARK_DECKS.slots.map((slot) => {
    const runner = benchmarkDeckManifestEntry(
      LOCAL_REALISTIC_BENCHMARK_DECKS.decks,
      slot.runnerLocalDeckId,
    );
    const corp = benchmarkDeckManifestEntry(
      LOCAL_REALISTIC_BENCHMARK_DECKS.decks,
      slot.corpLocalDeckId,
    );
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

const REAL_SCENE_BENCHMARK_DECK_SLOTS: AiBenchmarkDeckSlotDefinition[] =
  REAL_SCENE_BENCHMARK_DECKS.slots.map((slot) => {
    const runner = benchmarkDeckManifestEntry(
      REAL_SCENE_BENCHMARK_DECKS.decks,
      slot.runnerLocalDeckId,
    );
    const corp = benchmarkDeckManifestEntry(
      REAL_SCENE_BENCHMARK_DECKS.decks,
      slot.corpLocalDeckId,
    );
    return {
      slotId: slot.slotId,
      label: slot.label,
      slotType: slot.slotType,
      status: runner && corp ? slot.status : "pending",
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
              "Real-scene benchmark manifest references a missing deck entry.",
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
    ...REAL_SCENE_BENCHMARK_DECK_SLOTS,
  ];

export function chooseAiAction(
  input: AiDecisionInput,
  options: AiDecisionRuntimeOptions = {},
): AiDecision {
  return chooseAiActionFromSides(input, options, {
    corp: chooseCorpAction,
    runner: chooseRunnerAction,
  });
}

export function chooseCorpAction(
  input: AiDecisionInput,
  options: AiDecisionRuntimeOptions = {},
): AiDecision {
  return chooseSemanticRuntimeAction(
    input,
    memoizeLegacyDecision(() => {
      const baselineDecision = chooseCorpBaselineAction(input);
      return hasCorpPlanAction(input) &&
        !isCorpReactiveBaselineDecision(baselineDecision)
        ? chooseCorpPlanAction(input, baselineDecision)
        : baselineDecision;
    }),
    options,
  );
}

export function chooseCorpBaselineAction(input: AiDecisionInput): AiDecision {
  return chooseCorpLegacyBaselineAction(input, {
    scoreActions,
    decisionFromChoices,
  });
}

export function chooseRunnerAction(
  input: AiDecisionInput,
  options: AiDecisionRuntimeOptions = {},
): AiDecision {
  return chooseSemanticRuntimeAction(
    input,
    memoizeLegacyDecision(() => {
      const baselineDecision = chooseRunnerBaselineAction(input);
      const baselineAction = input.legalActions.find(
        (candidate) => candidate.actionId === baselineDecision.actionId,
      );
      const shouldUsePlanAction =
        hasRunnerPlanAction(input) &&
        (!isRunnerReactiveBaselineDecision(baselineDecision) ||
          baselineShellTradersPlanIsVisible(input, baselineDecision)) &&
        !runnerHasConditionalPaymentContinueDecision(input, baselineAction);
      const legacyDecision = shouldUsePlanAction
        ? chooseRunnerPlanAction(input, baselineDecision)
        : baselineDecision;
      return runnerSelfDamageGuardedDecision(input, legacyDecision);
    }),
    options,
  );
}

export function chooseRunnerBaselineAction(input: AiDecisionInput): AiDecision {
  return chooseRunnerLegacyBaselineAction(input, {
    scoreActions,
    decisionFromChoices,
  });
}

const ALL_NIGHTER_CARD_ID = "onr_v1_076_all-nighter";
const FAKED_HIT_CARD_ID = "onr_proteus_108_faked-hit";
const TEAM_RESTRUCTURING_CARD_ID = "onr_v1_305_team-restructuring";
const BAD_PUBLICITY_LOSS_THRESHOLD_FOR_AI = 7;
const {
  runnerSelfDamageGuardedDecision,
  runnerSelfDamageImmediateWinSemanticChoice,
  runnerSelfDamageSurvivalAssessment,
  runnerSelfDamageSurvivalExclusion,
} = createRunnerSelfDamageContext({
  sourceDefinitionIdForAction,
  hintEffectsForCard: (definitionId: string) => AI_HINTS.get(definitionId)?.effects,
  fakedHitCardId: FAKED_HIT_CARD_ID,
  badPublicityLossThreshold: BAD_PUBLICITY_LOSS_THRESHOLD_FOR_AI,
  scoreRunnerActions: (input: AiDecisionInput) => scoreActions(input, "runner"),
  compareAction,
  selectedChoicesForDecision,
  scrubEvidence,
});
const {
  runnerHasConditionalPaymentContinueDecision,
  baselineShellTradersPlanIsVisible,
} = createRunnerBaselinePlanGuardContext({
  delayedInstallAbilityForAction: shellTradersAbility,
  runnerHasInstalledPrograms,
});
const { deckCapabilitiesForInput } = createDeckCapabilitiesContext();
const {
  runnerStrategicIntentForInput,
} = createRunnerStrategicIntentContext();
const isVisibleIcebreakerProgram =
  createVisibleIcebreakerProgramPredicate(visibleBreakerRolesForAi);
const {
  runnerRunOnlyActionAdjustedSemanticChoice,
} = createRunnerRunOnlyActionContext({
  compareAction,
});
const {
  runnerBadPublicityRelevanceAssessment,
  runnerBadPublicityRelevanceScoreComponent,
} = createRunnerBadPublicityRelevanceContext({
  sourceDefinitionIdForAction,
  selfDamageSurvivalAssessment: runnerSelfDamageSurvivalAssessment,
  actionCreditCost,
  fakedHitCardId: FAKED_HIT_CARD_ID,
  cardSupport: {
    rolesForCardId,
    hintEffectsForCard: (definitionId: string) =>
      AI_HINTS.get(definitionId)?.effects,
    rulesTextForCard: (definitionId: string) =>
      DEMO_CARDS_BY_ID[definitionId]?.rulesText,
    effectTarget: (effect: unknown) =>
      effect && typeof effect === "object"
        ? stringRecordValue(effect as Record<string, unknown>, "target")
        : undefined,
  },
});
const {
  visibleCardPlayOrInstallCostForAi,
  runnerCardLooksLikeCreditPayout,
  runnerBadPublicityOrTraceTechCard,
  runnerCardAddressesVisibleBreakerNeed,
  visibleBreakerCardCanAddressIce,
} = createRunnerVisibleCardContext({
  visibleCardDefinition,
  isVisibleIcebreakerProgram,
  knownPathAssessment: (runtimeInput, server) =>
    assessKnownRezzedIcePath(
      server.ice,
      runtimeInput.playerView.own.rig ?? [],
      runtimeInput.playerView.own.credits,
      server.root,
    ),
  visibleBreakerRoles: visibleBreakerRolesForAi,
});
const discardKeepScore = createDiscardKeepScore({
  rolesForCardId,
  definitionTypeForCardId: cardDefinitionTypeForAi,
  visibleCardPlayOrInstallCost: visibleCardPlayOrInstallCostForAi,
  runnerCardAddressesVisibleBreakerNeed,
  runnerBadPublicityOrTraceTechCard,
  isRunnerEconomyRole,
  runnerCardLooksLikeCreditPayout,
});
const {
  semanticRuntimeRunnerMultiRunEventExclusion,
  runnerMultiRunEventAssessment,
  runnerMultiRunEventScoreComponent,
  runnerMultiRunTargetEvaluation,
  semanticRuntimeRunnerRunTargetEvaluation,
  semanticRuntimeRunnerRunTargetEvaluationForAction,
} = createRunnerMultiRunContext({
  allNighterDefinitionId: ALL_NIGHTER_CARD_ID,
  sourceDefinitionIdForAction,
  targetServerId: semanticRuntimeServerId,
  payoffClass: runnerRunTargetMultiRunPayoffClass,
  canTakeRun: runnerRunTargetPlausibleForMultiRun,
  scoreValue: runnerMultiRunEventScoreValue,
  deckCapabilitiesForInput,
  strategicIntentForInput: runnerStrategicIntentForInput,
  runTargets: evaluateRunnerRunTargets,
});
const {
  runnerBlinkRiskEvidenceForAction,
  runnerBlinkRunExclusion,
} = createRunnerBlinkRiskContext({
  multiRunTargetEvaluation: runnerMultiRunTargetEvaluation,
  runRiskAssessment: assessBlinkRiskForRunAction,
  breakRiskAssessment: blinkRiskAssessmentForEncounterBreak,
  shouldAvoidRun: (assessment) =>
    blinkRiskShouldAvoidRun(assessment as BlinkRiskAssessment | undefined),
});
const LOAN_FROM_CHIBA_CARD_ID = "onr_v1_168_loan-from-chiba";
const { runnerLoanLiabilityAssessment } = createRunnerLoanContext({
  highRiskLoanDefinitionId: LOAN_FROM_CHIBA_CARD_ID,
  hintForDefinitionId: (definitionId) => AI_HINTS.get(definitionId),
  sourceDefinitionIdForAction,
  projectedCreditGainForAction: runnerProjectedCreditGainForAction,
  actionCreditCost,
  actionClickCost,
  deckCapabilitiesForInput,
  strategicIntentForInput: runnerStrategicIntentForInput,
  handDevelopmentEvaluations: evaluateRunnerHandDevelopment,
  economyPosture: buildRunnerEconomyPosture,
  runTargets: evaluateRunnerRunTargets,
  visibleCardPlayOrInstallCost: visibleCardPlayOrInstallCostForAi,
  rolesForCardId,
  cardAddressesVisibleBreakerNeed: runnerCardAddressesVisibleBreakerNeed,
  isRunnerEconomyRole,
  isRunnerPressureRole,
  rolesForAction,
  hasKnownUnaffordableLegalRun: runnerHasKnownUnaffordableLegalRun,
});
const {
  runnerViral15JackOutScoreComponent,
} = createRunnerViral15JackOutContext({
  actionCreditCost,
  isVisibleIcebreakerProgram,
});
const { runnerHandFundingTarget } = createRunnerHandFundingContext({
  rolesForCardId,
  visibleCardPlayOrInstallCost: visibleCardPlayOrInstallCostForAi,
  cardAddressesVisibleBreakerNeed: runnerCardAddressesVisibleBreakerNeed,
  isRunnerEconomyRole,
  cardLooksLikeCreditPayout: runnerCardLooksLikeCreditPayout,
  badPublicityOrTraceTechCard: runnerBadPublicityOrTraceTechCard,
  rolesMatch: (roles, needles) => discardRolesMatch([...roles], [...needles]),
});
const {
  runnerPersistentInstallFitScoreComponent,
  runnerPersistentInstallLegacyScoreDelta,
  runnerPersistentInstallEvidenceForAction,
  runnerPersistentInstallEvaluationForAction,
} = createRunnerPersistentInstallContext({
  deckCapabilities: deckCapabilitiesForInput,
  strategicIntent: runnerStrategicIntentForInput,
  handDevelopmentEvaluations: evaluateRunnerHandDevelopment,
});
const {
  runnerBankInvestmentCommitmentScoreComponents,
  runnerBankInvestmentCommitmentEvidence,
  isRunnerBankCashOutAction,
  runnerBankCashOutIsUsefulNow,
  runnerBankHasConcreteFundingNeed,
  runnerBankCommitmentRunOverride,
} = createRunnerBankInvestmentContext({
  previousPlan: getTacticalPlanMemorySnapshot,
  runnerHandFundingTarget,
  findVisibleCard,
  sourceDefinitionIdForAction,
  rolesForCardId,
  definitionForCardId: (definitionId) =>
    RUNTIME_CARDS[definitionId] ?? DEMO_CARDS_BY_ID[definitionId],
  actionCreditCost,
  rolesForAction,
  serverId: semanticRuntimeServerId,
  definitionType: definitionTypeForMetrics,
  runnerRunTargetEvaluation: runnerMultiRunTargetEvaluation,
  runnerRunTargetHighPayoff,
});
const {
  runnerNoRunEconomyCommitmentScoreComponents,
  runnerNoRunEconomyCommitmentEvidence,
} = createRunnerNoRunEconomyContext({
  findVisibleCard,
  hintEffectsForDefinition: (definitionId) =>
    AI_HINTS.get(definitionId)?.effects ?? [],
  mechanicsForDefinition: runnerCardMechanicsForAi,
  rulesTextForDefinition: (definitionId) => {
    const runtimeDefinition = RUNTIME_CARDS[definitionId];
    const demoDefinition = DEMO_CARDS_BY_ID[definitionId];
    return [
      "rulesText" in (runtimeDefinition ?? {})
        ? (runtimeDefinition as { rulesText?: string } | undefined)?.rulesText
        : undefined,
      demoDefinition?.rulesText,
    ]
      .filter(Boolean)
      .join(" ");
  },
  runnerBankCommitmentRunOverride,
  isRunnerRigInstallAction,
});
const {
  semanticRuntimePlanMemoryActionExclusion,
} = createSemanticRuntimePlanMemoryExclusionContext({
  previousPlan: getTacticalPlanMemorySnapshot,
  isRunnerBankCashOutAction,
  runnerBankCashOutIsUsefulNow,
  runnerBankInvestmentCommitmentEvidence,
});
const {
  selectedRunnerProgramInstallTrashOptionIds,
  selectedRunnerForcedProgramTrashOptionIds,
  runnerProgramInstallTrashAssessment,
  runnerProgramInstallTrashAssessmentForAction,
  runnerProgramInstallDisplacementPenalty,
  runnerProgramSacrificeExclusion,
} = createRunnerProgramInstallTrashContext({
  safeNonNegativeInteger,
  visibleMemoryCost: visibleMemoryCostForAi,
  visibleCardsByInstanceId: visibleCardsByInstanceIdForAi,
  visibleBreakerRoleCounts: visibleBreakerRoleCountsForAi,
  visibleBreakerRoles: visibleBreakerRolesForAi,
  rolesForCardId,
  isRunnerPressureRole,
  isRunnerEconomyRole,
  visibleCounterValue: visibleCounterValueForAi,
  visibleInstallCost: visibleInstallCostForAi,
});
const {
  runnerMuPressureInstallScoreComponent,
  runnerMuPressureFundingScoreComponent,
  runnerMuPressureInstallPriorityBonus,
  runnerMuPressureFundingPriorityBonus,
  runnerMuPressureActionEvidence,
} = createRunnerMuPressureContext({
  safeNonNegativeInteger,
  findVisibleCard,
  visibleMemoryCost: visibleMemoryCostForAi,
  visibleInstallCost: visibleInstallCostForAi,
  programInstallTrashAssessmentForAction:
    runnerProgramInstallTrashAssessmentForAction,
  actionCreditCost,
  rolesForCardId,
  rolesForAction,
  isRunnerPressureRole,
  isRunnerEconomyRole,
});
const { semanticRuntimeRunnerEvidence } = createSemanticRuntimeRunnerEvidenceContext({
  programInstallTrashAssessmentForAction:
    runnerProgramInstallTrashAssessmentForAction,
  programInstallDisplacementPenalty: runnerProgramInstallDisplacementPenalty,
  muPressureActionEvidence: runnerMuPressureActionEvidence,
  bankInvestmentCommitmentEvidence: runnerBankInvestmentCommitmentEvidence,
  noRunEconomyCommitmentEvidence: runnerNoRunEconomyCommitmentEvidence,
  selfDamageSurvivalAssessment: runnerSelfDamageSurvivalAssessment,
  blinkRiskEvidenceForAction: runnerBlinkRiskEvidenceForAction,
  loanLiabilityAssessment: runnerLoanLiabilityAssessment,
  persistentInstallEvidenceForAction: runnerPersistentInstallEvidenceForAction,
  remoteTrashAccessContext: runnerRemoteTrashAccessContext,
});
const {
  semanticRuntimeCorpActionServerId,
  semanticRuntimeCorpServer,
  semanticRuntimeCorpActionSourceCard,
  semanticRuntimeCorpVisibleServerCard,
  semanticRuntimeCorpActionIsScoreLine,
  semanticRuntimeCorpAdvanceCompletesScore,
  semanticRuntimeCorpRemoteIsProtected,
  semanticRuntimeCorpRemoteHasScoreLine,
  semanticRuntimeCorpEmptyRemoteCount,
} = createSemanticRuntimeCorpBoardContext({
  serverId: semanticRuntimeServerId,
  findVisibleCard,
  findVisibleCorpServerCard,
  rolesForAction,
  isRemoteServerTarget,
});
const {
  semanticRuntimeCorpHasRemoteInstability,
  semanticRuntimeCorpActionWouldCreateUnsafeRemoteScoreLine,
  semanticRuntimeCorpHasStabilizingAlternative,
  semanticRuntimeCorpHasNakedScoreLine,
  semanticRuntimeCorpHasUnsafeRemoteScoreAction,
} = createSemanticRuntimeCorpRiskContext({
  emptyRemoteCount: semanticRuntimeCorpEmptyRemoteCount,
  isRemoteServerTarget,
  remoteIsProtected: semanticRuntimeCorpRemoteIsProtected,
  remoteHasScoreLine: semanticRuntimeCorpRemoteHasScoreLine,
  actionServerId: semanticRuntimeCorpActionServerId,
  actionIsScoreLine: semanticRuntimeCorpActionIsScoreLine,
  server: semanticRuntimeCorpServer,
});
const {
  semanticRuntimeCorpInstallRemoteScore,
  semanticRuntimeCorpShouldBuildProtectedScoreRemote,
  semanticRuntimeCorpAdvanceRemoteScore,
} = createSemanticRuntimeCorpRemoteScoreContext({
  actionServerId: semanticRuntimeCorpActionServerId,
  server: semanticRuntimeCorpServer,
  hasStabilizingAlternative: semanticRuntimeCorpHasStabilizingAlternative,
  isRemoteServerTarget,
  emptyRemoteCount: semanticRuntimeCorpEmptyRemoteCount,
  remoteIsProtected: semanticRuntimeCorpRemoteIsProtected,
  actionIsScoreLine: semanticRuntimeCorpActionIsScoreLine,
  remoteHasScoreLine: semanticRuntimeCorpRemoteHasScoreLine,
  actionCreditCost,
  advanceCompletesScore: semanticRuntimeCorpAdvanceCompletesScore,
});
const {
  normalizedRulesTextForDefinition,
  semanticRuntimeVisibleCardType,
  semanticRuntimeVisibleCardAdvancementRequirement,
  semanticRuntimeVisibleIceRezCost,
} = createSemanticRuntimeVisibleCardContext({
  runtimeDefinition: (definitionId) => RUNTIME_CARDS[definitionId],
  demoDefinition: (definitionId) => DEMO_CARDS_BY_ID[definitionId],
});
const {
  semanticRuntimeCorpRemoteRezFloorAssessment,
  semanticRuntimeCorpHasRemoteRezFloorFundingNeed,
} = createSemanticRuntimeCorpRezFloorContext({
  actionServerId: semanticRuntimeCorpActionServerId,
  isRemoteServerTarget,
  server: semanticRuntimeCorpServer,
  actionCreditCost,
  advanceCompletesScore: semanticRuntimeCorpAdvanceCompletesScore,
  actionIsScoreLine: semanticRuntimeCorpActionIsScoreLine,
  remoteHasScoreLine: semanticRuntimeCorpRemoteHasScoreLine,
  visibleIceRezCost: semanticRuntimeVisibleIceRezCost,
});
const {
  semanticRuntimeCorpAdvancementCounterPlacementAssessment,
} = createSemanticRuntimeCorpAdvancementCounterContext({
  sourceDefinitionIdForAction,
  normalizedRulesTextForDefinition,
  actionCreditCost,
  actionSourceCard: semanticRuntimeCorpActionSourceCard,
  visibleServerCard: findVisibleCorpServerCard,
  cardType: semanticRuntimeVisibleCardType,
  cardAdvancementRequirement: semanticRuntimeVisibleCardAdvancementRequirement,
  teamRestructuringCardId: TEAM_RESTRUCTURING_CARD_ID,
});
const {
  semanticRuntimeCorpPassiveScoreLinePenalty,
} = createSemanticRuntimeCorpPassiveScoreLineContext({
  scoreTerminalWindow: assessCorpScoreTerminalWindow,
  actionIsScoreLine: semanticRuntimeCorpActionIsScoreLine,
  rolesForAction,
});
const {
  semanticRuntimeCorpScoreNowSafetyGate,
} = createSemanticRuntimeCorpScoreSafetyContext({
  scoreTerminalWindow: assessCorpScoreTerminalWindow,
});
const { semanticRuntimeCorpEvidence } = createSemanticRuntimeCorpEvidenceContext({
  emptyRemoteCount: semanticRuntimeCorpEmptyRemoteCount,
  hasRemoteInstability: semanticRuntimeCorpHasRemoteInstability,
  hasNakedScoreLine: semanticRuntimeCorpHasNakedScoreLine,
  hasUnsafeRemoteScoreAction: semanticRuntimeCorpHasUnsafeRemoteScoreAction,
  hasContestableRemoteScoreAction: (input) =>
    input.legalActions.some((action) =>
      Boolean(
        semanticRuntimeCorpRemoteScoreContestabilityAssessment(input, action)
          ?.contestable,
      ),
    ),
  hasRemoteRezFloorFundingNeed: semanticRuntimeCorpHasRemoteRezFloorFundingNeed,
  hasCentralRezFloorFundingNeed:
    semanticRuntimeCorpHasCentralRezFloorFundingNeed,
  advancementCounterPlacementAssessment:
    semanticRuntimeCorpAdvancementCounterPlacementAssessment,
  passiveScoreLinePenalty: semanticRuntimeCorpPassiveScoreLinePenalty,
  actionServerId: semanticRuntimeCorpActionServerId,
  server: semanticRuntimeCorpServer,
  remoteIsProtected: semanticRuntimeCorpRemoteIsProtected,
  isRemoteServerTarget,
  shouldBuildProtectedScoreRemote:
    semanticRuntimeCorpShouldBuildProtectedScoreRemote,
  actionWouldCreateUnsafeRemoteScoreLine:
    semanticRuntimeCorpActionWouldCreateUnsafeRemoteScoreLine,
  advanceCompletesScore: semanticRuntimeCorpAdvanceCompletesScore,
  remoteRezFloorAssessment: semanticRuntimeCorpRemoteRezFloorAssessment,
});
const { semanticRuntimeEvidence } = createSemanticRuntimeEvidenceContext({
  serverId: semanticRuntimeServerId,
  runnerEvidence: semanticRuntimeRunnerEvidence,
  corpEvidence: semanticRuntimeCorpEvidence,
});
const {
  semanticRuntimeRunnerSourceCardAnswerRole,
} = createRunnerSourceCardAnswerRoleContext({
  visibleSourceCard: semanticRuntimeVisibleSourceCard,
  sourceDefinitionId: sourceDefinitionIdForAction,
  rolesForCardId,
  sourceDefinition: (definitionId) =>
    definitionId
      ? (RUNTIME_CARDS[definitionId] ?? DEMO_CARDS_BY_ID[definitionId])
      : undefined,
});
const SEMANTIC_RUNTIME_SCOPE_DEPENDENCIES = {
  isRemoteServerTarget,
  runnerSourceCardAnswerRole: semanticRuntimeRunnerSourceCardAnswerRole,
};
const {
  semanticRuntimeKnownCentralPayoffExclusion,
  semanticRuntimeRunnerEmptyRemoteExclusion,
  semanticRuntimeRunnerArchivesExclusion,
} = createRunnerSimpleExclusionsContext({
  evaluateKnownCentralPayoff: evaluateKnownCentralAccessPayoff,
  definitionType: definitionTypeForMetrics,
});
const {
  semanticRuntimeRunnerBlinkBreakExclusion,
} = createRunnerBlinkBreakExclusionContext({
  riskAssessment: blinkRiskAssessmentForEncounterBreak,
  shouldAvoidRun: (assessment) =>
    blinkRiskShouldAvoidRun(assessment as BlinkRiskAssessment | undefined),
});
const {
  runnerEncounterActionExclusion,
} = createRunnerEncounterActionExclusionContext({
  blinkBreakExclusion: semanticRuntimeRunnerBlinkBreakExclusion,
  pumpViabilityAssessment,
  breakAccessPathAssessment,
});
const {
  semanticRuntimeActionExclusion,
} = createSemanticRuntimeActionExclusionContext({
  planMemoryActionExclusion: semanticRuntimePlanMemoryActionExclusion,
  corpAdvancementCounterPlacementAssessment:
    semanticRuntimeCorpAdvancementCounterPlacementAssessment,
  runnerSelfDamageSurvivalExclusion,
  runnerEncounterActionExclusion,
  runnerProgramSacrificeExclusion,
  runnerMultiRunEventExclusion: semanticRuntimeRunnerMultiRunEventExclusion,
  runnerRunTargetEvaluationForAction:
    semanticRuntimeRunnerRunTargetEvaluationForAction,
  runnerBlinkRunExclusion,
  knownCentralPayoffExclusion: semanticRuntimeKnownCentralPayoffExclusion,
  runnerArchivesExclusion: semanticRuntimeRunnerArchivesExclusion,
  runnerEmptyRemoteExclusion: semanticRuntimeRunnerEmptyRemoteExclusion,
  isRemoteServerTarget,
  knownIcePathReason: semanticRuntimeKnownIcePathReason,
});
const {
  semanticRuntimeScoreBreakdown,
} = createSemanticRuntimeScoreBreakdownContext({
  runnerComponents: (
    componentInput,
    componentAction,
    componentScopeId,
    actionSemanticCandidate,
  ) =>
    semanticRuntimeRunnerScoreComponents(
      componentInput,
      componentAction,
      componentScopeId,
      actionSemanticCandidate,
    ),
  corpComponents: (componentInput, componentAction, componentScopeId) =>
    semanticRuntimeCorpScoreComponents(
      componentInput,
      componentAction,
      componentScopeId,
    ),
  actionCreditCost,
});
const { semanticRuntimeChoices } = createSemanticRuntimeChoiceBuilderContext({
  scope: SEMANTIC_RUNTIME_SCOPE_DEPENDENCIES,
  actionExclusion: semanticRuntimeActionExclusion,
  scoreBreakdown: semanticRuntimeScoreBreakdown,
  actionCreditCost,
  evidence: semanticRuntimeEvidence,
  explanation: semanticRuntimeExplanation,
  compareAction,
});

function practicalMicroRuntimeCandidates(
  input: AiDecisionInput,
  runtimeDecision: AiDecision,
): PracticalMicroCandidate[] {
  return [
    corpSafeScorelineCandidate(input, runtimeDecision),
    runnerRunPayoffCompletionCandidate(input, runtimeDecision),
    runnerVisibleCoverageInstallCandidate(input, runtimeDecision),
    corpStalePunishDeactivationCandidate(input, runtimeDecision),
  ].filter(
    (candidate): candidate is PracticalMicroCandidate =>
      candidate !== undefined,
  );
}

function runtimeSelectedLegalAction(
  input: AiDecisionInput,
  runtimeDecision: AiDecision,
): LegalAction | undefined {
  return input.legalActions.find(
    (action) => action.actionId === runtimeDecision.actionId,
  );
}

function runnerVisibleCoverageInstallCandidate(
  input: AiDecisionInput,
  runtimeDecision: AiDecision,
): PracticalMicroCandidate | undefined {
  if (input.side !== "runner") return undefined;
  if (!runnerHasKnownBlockedPathWithVisibleBreakerAnswer(input))
    return undefined;
  const action = input.legalActions.find((candidate) => {
    if (candidate.type !== "install_card") return false;
    const sourceCard = semanticRuntimeVisibleSourceCard(input, candidate);
    if (!sourceCard || !isVisibleIcebreakerProgram(sourceCard)) return false;
    const alreadyInstalledSameBreaker = (input.playerView.own.rig ?? []).some(
      (card) =>
        card.known &&
        card.definitionId !== undefined &&
        card.definitionId === sourceCard.definitionId,
    );
    return !alreadyInstalledSameBreaker;
  });
  if (!action) return undefined;
  return {
    ruleId: "runner_visible_coverage_install",
    actionId: action.actionId,
    actionType: action.type,
    reasonCode: "practical_micro.runner_visible_coverage_install",
    explanation:
      "Der Runner installiert sichtbare Breaker-Abdeckung, bevor ein bekannter blockierter Pfad wiederholt wird.",
    evidence: [
      "practical_micro_runner_visible_coverage_install:true",
      `practical_micro_runtime_reference:${runtimeDecision.actionId}`,
      `install_action:${action.actionId}`,
    ],
  };
}

function runnerHasKnownBlockedPathWithVisibleBreakerAnswer(
  input: AiDecisionInput,
): boolean {
  const visibleBreakerInstalls = input.legalActions.filter((action) => {
    if (action.type !== "install_card") return false;
    const sourceCard = semanticRuntimeVisibleSourceCard(input, action);
    return sourceCard !== undefined && isVisibleIcebreakerProgram(sourceCard);
  });
  if (visibleBreakerInstalls.length === 0) return false;
  for (const runAction of input.legalActions) {
    if (runAction.type !== "start_run") continue;
    const serverId = semanticRuntimeServerId(runAction);
    const server = input.playerView.servers.find(
      (entry) => entry.id === serverId,
    );
    if (!server) continue;
    const assessment = assessKnownRezzedIcePath(
      server.ice,
      input.playerView.own.rig ?? [],
      input.playerView.own.credits,
      server.root,
    );
    if (assessment.assessedKnownIceCount <= 0 || assessment.canReachAccess)
      continue;
    if (
      visibleBreakerInstalls.some((installAction) => {
        const sourceCard = semanticRuntimeVisibleSourceCard(
          input,
          installAction,
        );
        return (
          sourceCard !== undefined &&
          server.ice.some(
            (ice) =>
              ice.known &&
              ice.rezzed === true &&
              visibleBreakerCardCanAddressIce(sourceCard, ice),
          )
        );
      })
    ) {
      return true;
    }
  }
  return false;
}

function corpStalePunishDeactivationCandidate(
  input: AiDecisionInput,
  runtimeDecision: AiDecision,
): PracticalMicroCandidate | undefined {
  if (input.side !== "corp") return undefined;
  const runtimeAction = runtimeSelectedLegalAction(input, runtimeDecision);
  if (!runtimeAction || !corpActionLooksLikeStalePunish(input, runtimeAction))
    return undefined;
  const action = input.legalActions.find((candidate) => {
    if (candidate.actionId === runtimeAction.actionId) return false;
    if (corpActionLooksLikeStalePunish(input, candidate)) return false;
    return (
      candidate.type === "score_agenda" ||
      candidate.type === "advance_card" ||
      candidate.type === "rez_ice" ||
      (candidate.type === "install_card" &&
        candidate.payload?.placement === "ice")
    );
  });
  if (!action) return undefined;
  return {
    ruleId: "corp_stale_punish_deactivation",
    actionId: action.actionId,
    actionType: action.type,
    reasonCode: "practical_micro.corp_stale_punish_deactivation",
    explanation:
      "Die Corp nimmt eine sichtbare Board- oder Scoreline-Aktion statt eines stale Punish ohne frische Bedingung.",
    evidence: [
      "practical_micro_corp_stale_punish_deactivation:true",
      `stale_punish_action:${runtimeAction.actionId}`,
      `replacement_action:${action.actionId}`,
    ],
  };
}

function corpActionLooksLikeStalePunish(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  if (input.playerView.opponent.tags > 0) return false;
  const roles = rolesForAction(input, action);
  const text = [
    action.label,
    action.type,
    action.payload?.cardImplementationAbilityLabel,
    ...roles,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /punish|tag_punish|damage_punish|scorched|closed accounts|power grid overload/.test(
    text,
  );
}

function corpSafeScorelineCandidate(
  input: AiDecisionInput,
  runtimeDecision: AiDecision,
): PracticalMicroCandidate | undefined {
  if (input.side !== "corp") return undefined;
  const terminal = assessCorpScoreTerminalWindow(input);
  if (!terminal.terminalWindow) return undefined;
  if (
    terminal.blockedByCheapContest ||
    terminal.blockedByCredits ||
    terminal.blockedByRunnerContest ||
    terminal.blockedByHqThreat
  )
    return undefined;
  const actionId =
    terminal.scoreActionIds[0] ??
    terminal.advanceToScoreActionIds[0] ??
    terminal.agendaInstallActionIds[0];
  const action = input.legalActions.find(
    (candidate) => candidate.actionId === actionId,
  );
  if (!action) return undefined;
  return {
    ruleId: "corp_safe_scoreline",
    actionId: action.actionId,
    actionType: action.type,
    reasonCode: "practical_micro.corp_safe_scoreline",
    explanation:
      "Die Corp vollzieht eine sichere Scoreline, statt das geöffnete Score-Fenster zu vertagen.",
    evidence: [
      "practical_micro_corp_safe_scoreline:true",
      ...terminal.evidence.slice(0, 8),
      `scoreline_action:${action.actionId}`,
    ],
  };
}

function runnerRunPayoffCompletionCandidate(
  input: AiDecisionInput,
  runtimeDecision: AiDecision,
): PracticalMicroCandidate | undefined {
  if (input.side !== "runner") return undefined;
  const runtimeAction = runtimeSelectedLegalAction(input, runtimeDecision);
  if (
    runtimeAction === undefined ||
    semanticRuntimeActionTypeIsReactive(runtimeAction.type)
  )
    return undefined;
  const evaluation = evaluateRunnerRunTargets({ input }).find(
    (candidate) =>
      runnerRunTargetPlausibleForMultiRun(candidate) &&
      runnerRunTargetHighPayoff(candidate),
  );
  if (!evaluation) return undefined;
  const action = input.legalActions.find(
    (candidate) => candidate.actionId === evaluation.actionId,
  );
  if (!action) return undefined;
  return {
    ruleId: "runner_run_payoff_completion",
    actionId: action.actionId,
    actionType: action.type,
    reasonCode: "practical_micro.runner_run_payoff_completion",
    explanation:
      "Der Runner nutzt ein erreichbares Run-Payoff-Fenster, statt nach fertiger Vorbereitung weiter zu driften.",
    evidence: [
      "practical_micro_runner_run_payoff_completion:true",
      `target:${evaluation.targetServerId}`,
      `access_payoff:${evaluation.accessPayoff}`,
      `recommendation:${evaluation.recommendation}`,
      `credits_after_run:${evaluation.creditsAfterRun}`,
    ],
  };
}

const {
  semanticRuntimeDecisionDebug,
  semanticRuntimeCoverageSelectionDebug,
} = createSemanticRuntimeDebugContext({
  scoreBreakdown: semanticRuntimeScoreBreakdown,
  visibleSourceCard: semanticRuntimeVisibleSourceCard,
});
const { chooseSemanticRuntimeAction } = createSemanticRuntimeDecisionContext({
  semanticRuntimeChoices,
  semanticRuntimeChoiceIsReactive,
  buildActionSemanticCandidates,
  getTacticalPlanMemorySnapshot,
  deckCapabilitiesForInput,
  runnerStrategicIntentForInput,
  evaluateRunnerHandDevelopment,
  buildRunnerEconomyPosture,
  evaluateRunnerRunTargets,
  buildRunnerTacticalGoals,
  evaluateTacticalPlans,
  bestSemanticRuntimeChoice,
  bestSemanticRuntimeChoiceForTacticalPlanOverride,
  tacticalPlanMappedChoice,
  runnerSelfDamageImmediateWinSemanticChoice,
  semanticRuntimeChoiceWithEvidence,
  tacticalPlanMappingOverrideEvidence,
  tacticalPlanRuntimeAlignedToChoice,
  runnerRunOnlyActionAdjustedSemanticChoice,
  semanticRuntimeCoverageSelectionDebug,
  selectedChoicesForDecision,
  rememberTacticalPlanRuntime,
  scrubEvidence,
  semanticRuntimeDecisionDebug,
  practicalMicroRuntimeCandidates,
});

function blinkRiskAssessmentForEncounterBreak(
  input: AiDecisionInput,
  action: LegalAction,
): BlinkRiskAssessment | undefined {
  if (input.side !== "runner" || action.type !== "break_subroutine") {
    return undefined;
  }
  const riskProfile = randomBreakOrDamageRiskProfileForDefinitionId(
    sourceDefinitionIdForAction(input, action),
  );
  if (!riskProfile) return undefined;
  const breakIndexes = breakSubroutineIndexesForAction(action);
  const quote = currentEncounteredIceCard(input)?.effectiveRunQuote;
  const targetSubroutines = [...breakIndexes]
    .map((index) => quote?.subroutines[index])
    .filter((subroutine): subroutine is NonNullable<typeof subroutine> =>
      Boolean(subroutine),
    );
  const currentHandCount = input.playerView.own.gripOrHq.length;
  const visibleSubroutinesLikely = Math.max(
    1,
    breakIndexes.size || targetSubroutines.length,
  );
  const stableCoverageAvailable = stableBreakAlternativeForBlinkAction(
    input,
    action,
  );
  const payoffOverride = blinkEncounterPayoffOverride(input, targetSubroutines);

  return buildBlinkRiskAssessment({
    currentHandCount,
    handAfterActionCost: currentHandCount,
    blinkUsesLikely: visibleSubroutinesLikely,
    visibleSubroutinesLikely,
    payoffOverride,
    stableCoverageAvailable,
    context: "encounter_break",
    riskProfile,
    evidence: [
      "blinkBreakAction:true",
      `blinkBreakSubroutineCount:${visibleSubroutinesLikely}`,
      `blinkBreakStableAlternative:${stableCoverageAvailable}`,
      `blinkBreakPayoffOverride:${payoffOverride}`,
      ...(input.playerView.run?.position?.serverId
        ? [`blinkBreakServer:${input.playerView.run.position.serverId}`]
        : []),
    ],
  });
}

function stableBreakAlternativeForBlinkAction(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  const targetIceId =
    typeof action.payload?.iceId === "string" ? action.payload.iceId : "";
  const targetIndexes = breakSubroutineIndexesForAction(action);
  return input.legalActions.some((candidate) => {
    if (
      candidate.actionId === action.actionId ||
      candidate.type !== "break_subroutine" ||
      randomBreakOrDamageRiskProfileForDefinitionId(
        sourceDefinitionIdForAction(input, candidate),
      ) !== undefined
    ) {
      return false;
    }
    if (
      targetIceId &&
      typeof candidate.payload?.iceId === "string" &&
      candidate.payload.iceId !== targetIceId
    ) {
      return false;
    }
    const candidateIndexes = breakSubroutineIndexesForAction(candidate);
    if (targetIndexes.size === 0 || candidateIndexes.size === 0) return true;
    return [...targetIndexes].some((index) => candidateIndexes.has(index));
  });
}

function blinkEncounterPayoffOverride(
  input: AiDecisionInput,
  targetSubroutines: VisibleEncounterSubroutine[],
): BlinkRiskPayoffOverride {
  if (targetSubroutines.some(isImmediateSafetyThreatSubroutine)) {
    return "survival";
  }
  const run = input.playerView.run;
  const server =
    run?.position?.kind === "ice"
      ? input.playerView.servers.find(
          (candidate) => candidate.id === run.position?.serverId,
        )
      : undefined;
  if (!server || !isRemoteServerTarget(server.id)) return "none";
  if (server.root.some(visibleRootIsKnownAgenda)) return "known_agenda";
  if (
    server.root.some(
      (card) => card.known && (card.advancementCounters ?? 0) > 0,
    )
  ) {
    return "remote_score_threat";
  }
  return "none";
}

function visibleRootIsKnownAgenda(
  card: AiDecisionInput["playerView"]["servers"][number]["root"][number],
): boolean {
  return visibleRootIsKnownAgendaRuntime(card, definitionTypeForMetrics);
}

function breakAccessPathAssessment(
  input: AiDecisionInput,
  action: LegalAction,
): { canPreserveAccessPath: boolean; evidence: string[] } {
  const run = input.playerView.run;
  if (run?.position?.kind !== "ice")
    return { canPreserveAccessPath: true, evidence: [] };
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === run.position?.serverId,
  );
  if (!server) return { canPreserveAccessPath: true, evidence: [] };

  const breakIndexes = breakSubroutineIndexesForAction(action);
  const quote = currentEncounteredIceCard(input)?.effectiveRunQuote;
  const targetSubroutines = [...breakIndexes]
    .map((index) => quote?.subroutines[index])
    .filter((subroutine): subroutine is NonNullable<typeof subroutine> =>
      Boolean(subroutine),
    );
  if (targetSubroutines.some(isImmediateSafetyThreatSubroutine))
    return {
      canPreserveAccessPath: true,
      evidence: ["break_preserves_immediate_safety:true"],
    };

  const creditsAfterBreak =
    input.playerView.own.credits - actionCreditCost(action);
  const remainingCurrentEndRunAfterBreak =
    quote && breakIndexes.size > 0
      ? quote.subroutines.filter(
          (subroutine, index) =>
            isEndRunSubroutine(subroutine) && !breakIndexes.has(index),
        ).length
      : 0;
  const currentEncounterContinue = input.legalActions.find(
    (candidate) =>
      candidate.type === "continue_run" &&
      candidate.payload?.encounterContinue === true,
  );
  if (
    currentEncounterContinue?.payload?.encounterWillEndRun === true &&
    remainingCurrentEndRunAfterBreak > 0 &&
    creditsAfterBreak < (estimatedEncounterBreakCost(input, action) ?? 1)
  )
    return {
      canPreserveAccessPath: false,
      evidence: [
        "break_cannot_clear_current_ice:true",
        `break_credits_after:${creditsAfterBreak}`,
        `break_remaining_current_end_run:${remainingCurrentEndRunAfterBreak}`,
      ],
    };

  const futureIce = server.ice.slice(0, Math.max(0, run.position.iceIndex));
  if (futureIce.length <= 0) {
    const remotePayoff = encounterRemotePayoffAfterBreakAssessment(
      input,
      server,
      targetSubroutines,
      creditsAfterBreak,
      remainingCurrentEndRunAfterBreak,
    );
    if (remotePayoff.blocksBreak)
      return {
        canPreserveAccessPath: false,
        evidence: remotePayoff.evidence,
      };
    return {
      canPreserveAccessPath: true,
      evidence: [`break_credits_after:${creditsAfterBreak}`],
    };
  }

  const pathAssessment = assessKnownRezzedIcePath(
    futureIce,
    input.playerView.own.rig ?? [],
    creditsAfterBreak,
    server.root,
  );
  if (
    pathAssessment.assessedKnownIceCount <= 0 ||
    pathAssessment.canReachAccess
  ) {
    const remotePayoff = encounterRemotePayoffAfterBreakAssessment(
      input,
      server,
      targetSubroutines,
      pathAssessment.creditsAfterPath,
      remainingCurrentEndRunAfterBreak,
    );
    if (remotePayoff.blocksBreak)
      return {
        canPreserveAccessPath: false,
        evidence: [
          ...remotePayoff.evidence,
          semanticRuntimeKnownIcePathReason(pathAssessment, server.id),
        ],
      };
    return {
      canPreserveAccessPath: true,
      evidence: [
        `break_credits_after:${creditsAfterBreak}`,
        semanticRuntimeKnownIcePathReason(pathAssessment, server.id),
      ],
    };
  }
  return {
    canPreserveAccessPath: false,
    evidence: [
      "break_future_path_blocked_after_cost:true",
      `break_credits_after:${creditsAfterBreak}`,
      semanticRuntimeKnownIcePathReason(pathAssessment, server.id),
    ],
  };
}

function encounterRemotePayoffAfterBreakAssessment(
  input: AiDecisionInput,
  server: AiDecisionInput["playerView"]["servers"][number],
  targetSubroutines: VisibleEncounterSubroutine[],
  creditsAfterAccessPath: number,
  remainingCurrentEndRunAfterBreak: number,
): { blocksBreak: boolean; evidence: string[] } {
  if (!isRemoteServerTarget(server.id))
    return { blocksBreak: false, evidence: [] };
  if (targetSubroutines.length <= 0)
    return { blocksBreak: false, evidence: [] };
  if (remainingCurrentEndRunAfterBreak > 0)
    return { blocksBreak: false, evidence: [] };
  if (targetSubroutines.some(isImmediateSafetyThreatSubroutine))
    return { blocksBreak: false, evidence: [] };
  if (!targetSubroutines.every(isEndRunSubroutine))
    return { blocksBreak: false, evidence: [] };

  const evidenceBase = [
    "encounter_remote_payoff_check:true",
    "encounter_remote_payoff_blocked:true",
    `encounter_remote_target:${server.id}`,
    `encounter_credits_after_access_path:${creditsAfterAccessPath}`,
  ];
  if (server.root.length === 0)
    return {
      blocksBreak: true,
      evidence: [...evidenceBase, "encounter_remote_payoff:no_root"],
    };

  const unknownRootCount = server.root.filter(
    (card) => !card.known || typeof card.definitionId !== "string",
  ).length;
  if (unknownRootCount > 0) return { blocksBreak: false, evidence: [] };

  const hasKnownAgenda = server.root.some((card) => {
    const definitionId = card.definitionId;
    return (
      card.known &&
      (card.type === "agenda" ||
        (definitionId !== undefined &&
          definitionTypeForMetrics(definitionId) === "agenda"))
    );
  });
  if (hasKnownAgenda) return { blocksBreak: false, evidence: [] };

  const hasAdvancedKnownRoot = server.root.some(
    (card) => card.known && (card.advancementCounters ?? 0) > 0,
  );
  if (hasAdvancedKnownRoot) return { blocksBreak: false, evidence: [] };

  const trashCosts = server.root
    .map((card) => {
      const type = card.definitionId
        ? definitionTypeForMetrics(card.definitionId)
        : card.type;
      const trashCost = remoteRootTrashCostForMetrics(card);
      return (type === "asset" || type === "upgrade") && trashCost !== undefined
        ? trashCost
        : undefined;
    })
    .filter((trashCost): trashCost is number => trashCost !== undefined);

  if (trashCosts.length <= 0)
    return {
      blocksBreak: true,
      evidence: [...evidenceBase, "encounter_remote_payoff:known_low_value"],
    };

  const cheapestTrashCost = Math.min(...trashCosts);
  if (creditsAfterAccessPath >= cheapestTrashCost)
    return { blocksBreak: false, evidence: [] };

  return {
    blocksBreak: true,
    evidence: [
      ...evidenceBase,
      "encounter_remote_payoff:trash_unaffordable",
      `encounter_remote_root_trash_cost:${cheapestTrashCost}`,
    ],
  };
}

const JUNKYARD_BBS_CARD_ID = "onr_v1_165_junkyard-bbs";
const FULL_BODY_CONVERSION_CARD_ID = "onr_v1_127_full-body-conversion";
const DERMATECH_BODYPLATING_CARD_ID = "onr_v1_125_dermatech-bodyplating";
const JUNKYARD_BBS_RETURN_TOP_HEAP_ABILITY = "junkyard_bbs_return_top_heap";
const {
  semanticRuntimeRunnerRunTargetGuidanceComponent,
} = createRunnerRunTargetGuidanceContext({
  evaluationForAction: semanticRuntimeRunnerRunTargetEvaluationForAction,
  guidanceValue: runnerRunTargetSemanticGuidanceValue,
  isRemoteServerTarget,
  remoteRootTrashCost: remoteRootTrashCostForMetrics,
});

const {
  semanticRuntimeRunnerRndMemoryComponents,
  semanticRuntimeRunnerHqMemoryComponents,
} = createRunnerCentralMemoryContext({
  rndTopFreshness: (input: AiDecisionInput) =>
    reconstructBeliefState(input).runnerOpponentModel?.rndTopFreshness,
  staleKnownRndRepeatRunPenalty,
  rndFreshRepeatRunBoost,
  hqHandMemory: (input: AiDecisionInput) =>
    reconstructBeliefState(input).runnerOpponentModel?.hqHandMemory,
  definitionType: definitionTypeForMetrics,
  staleKnownHqRepeatRunPenalty,
});

const {
  runnerLateNoFundingCreditSafeProgressTargets,
  semanticRuntimeRecentRunnerBasicCreditActions,
  semanticRuntimeRecentRunnerStartRunsOnServer,
} = createRunnerRecentHistoryContext({
  publicHistory: mergedAiPublicHistory,
  eventVersion: aiEventVersion,
  serverIdFromEvent: aiServerIdFromEvent,
  closeout: bestTrueCentralCloseoutProfileForMetrics,
  pressureReadyTargets: (input: AiDecisionInput) =>
    assessRunnerPressureReadyForMetrics(input).readyTargets,
});

const {
  semanticRuntimeRunnerAccessTrashComponents,
  semanticRuntimeRunnerArchivesComponents,
  semanticRuntimeRunnerKnownIcePathComponents,
  semanticRuntimeRunnerRemoteComponents,
  semanticRuntimeRepeatedRunTargetComponents,
} = createRunnerRunComponentsContext({
  trashAccessContext: runnerRemoteTrashAccessContext,
  evaluationForAction: semanticRuntimeRunnerRunTargetEvaluationForAction,
  definitionType: definitionTypeForMetrics,
  knownIcePathAssessment: (input, server) =>
    assessKnownRezzedIcePath(
      server.ice,
      input.playerView.own.rig ?? [],
      input.playerView.own.credits,
      server.root,
    ),
  rootTrashCost: remoteRootTrashCostForMetrics,
  candidateMemory: (input, server) => {
    return server
      ? reconstructBeliefState(input)
          .runnerOpponentModel?.hiddenRemoteCandidateMemory.slice()
          .reverse()
          .find((entry) => entry.serverId === server.id)
      : undefined;
  },
  recentStartRunsOnServer: semanticRuntimeRecentRunnerStartRunsOnServer,
  isRemoteServerTarget,
});

const {
  runnerBlinkRecoveryScoreComponent,
  runnerLowValueRecoveryRepeatScoreComponent,
  runnerLateNoFundingCreditRepeatScoreComponent,
  runnerJunkyardBbsRecoveryScoreComponent,
  runnerActionLooksLikeRecovery,
  runnerRecoveryFundingNeedContext,
  semanticRuntimeRecentRunnerRecoveryActions,
} = createRunnerRecoveryContext({
  targetServerId: semanticRuntimeServerId,
  blinkAssessment: runnerBlinkRecoveryAssessment,
  rolesForAction,
  sourceDefinitionIdForAction,
  recentBasicCreditActions: semanticRuntimeRecentRunnerBasicCreditActions,
  safeProgressTargets: runnerLateNoFundingCreditSafeProgressTargets,
  handFundingTarget: runnerHandFundingTarget,
  bankHasConcreteFundingNeed: runnerBankHasConcreteFundingNeed,
  hasKnownUnaffordableLegalRun: runnerHasKnownUnaffordableLegalRun,
  publicHistory: mergedAiPublicHistory,
  eventVersion: aiEventVersion,
  findVisibleCard,
  rolesForCardId,
  cardAddressesVisibleBreakerNeed: runnerCardAddressesVisibleBreakerNeed,
  isRunnerPressureRole,
  isRunnerEconomyRole,
  badPublicityOrTraceTechCard: runnerBadPublicityOrTraceTechCard,
  actionClickCost,
  actionCreditCost,
  junkyardBbsDefinitionId: JUNKYARD_BBS_CARD_ID,
  junkyardBbsReturnTopHeapAbility: JUNKYARD_BBS_RETURN_TOP_HEAP_ABILITY,
});

const {
  semanticRuntimeRunnerScoreComponents,
} = createRunnerScoreComponentsContext({
  loanLiabilityAssessment: runnerLoanLiabilityAssessment,
  goalFit: {
    sourceCardAnswerRole: semanticRuntimeRunnerSourceCardAnswerRole,
    runActionSpendingCapAssessment: runnerRunActionSpendingCapAssessment,
    runTargetEvaluationForAction:
      semanticRuntimeRunnerRunTargetEvaluationForAction,
  },
  handFundingTarget: runnerHandFundingTarget,
  recoveryCommitment: {
    muPressureFundingScoreComponent: runnerMuPressureFundingScoreComponent,
    handBufferNeedScoreComponent: runnerHandBufferNeedScoreComponent,
    blinkRecoveryScoreComponent: runnerBlinkRecoveryScoreComponent,
    junkyardRecoveryScoreComponent: runnerJunkyardBbsRecoveryScoreComponent,
    lowValueRecoveryRepeatScoreComponent:
      runnerLowValueRecoveryRepeatScoreComponent,
    viral15JackOutScoreComponent: runnerViral15JackOutScoreComponent,
    lateNoFundingCreditRepeatScoreComponent:
      runnerLateNoFundingCreditRepeatScoreComponent,
    multiRunEventScoreComponent: runnerMultiRunEventScoreComponent,
    bankInvestmentCommitmentScoreComponents:
      runnerBankInvestmentCommitmentScoreComponents,
    noRunEconomyCommitmentScoreComponents:
      runnerNoRunEconomyCommitmentScoreComponents,
  },
  install: {
    rolesForAction,
    sourceCard: (input, action) => findVisibleCard(input, action.source),
    muPressureInstallScoreComponent: runnerMuPressureInstallScoreComponent,
    persistentInstallFitScoreComponent:
      runnerPersistentInstallFitScoreComponent,
    isRunnerEconomyRole,
    isRunnerPressureRole,
    badPublicityOrTraceTechCard: runnerBadPublicityOrTraceTechCard,
    programInstallTrashAssessmentForAction:
      runnerProgramInstallTrashAssessmentForAction,
    programInstallDisplacementPenalty: runnerProgramInstallDisplacementPenalty,
  },
  startRun: {
    serverId: semanticRuntimeServerId,
    hqMemoryComponents: semanticRuntimeRunnerHqMemoryComponents,
    rndMemoryComponents: semanticRuntimeRunnerRndMemoryComponents,
    archivesComponents: semanticRuntimeRunnerArchivesComponents,
    isRemoteServerTarget,
    remoteComponents: semanticRuntimeRunnerRemoteComponents,
    knownIcePathComponents: semanticRuntimeRunnerKnownIcePathComponents,
    repeatedRunTargetComponents: semanticRuntimeRepeatedRunTargetComponents,
  },
  followup: {
    runTargetGuidanceComponent:
      semanticRuntimeRunnerRunTargetGuidanceComponent,
    accessTrashComponents: semanticRuntimeRunnerAccessTrashComponents,
    badPublicityRelevanceScoreComponent:
      runnerBadPublicityRelevanceScoreComponent,
  },
});

const {
  semanticRuntimeCorpScore,
  semanticRuntimeCorpScoreComponents,
} = createSemanticRuntimeCorpScoreContext(
  {
    actionCreditCost,
    rolesForAction,
    corpScoreNowSafetyGate: semanticRuntimeCorpScoreNowSafetyGate,
    corpAdvanceRemoteScore: semanticRuntimeCorpAdvanceRemoteScore,
    corpRemoteRezFloorAssessment: semanticRuntimeCorpRemoteRezFloorAssessment,
    corpCentralRezReserveAssessment: semanticRuntimeCorpCentralRezReserveAssessment,
    corpRemoteScoreContestabilityAssessment:
      semanticRuntimeCorpRemoteScoreContestabilityAssessment,
    corpActionIsScoreLine: semanticRuntimeCorpActionIsScoreLine,
    corpInstallRemoteScore: semanticRuntimeCorpInstallRemoteScore,
    corpAdvancementCounterPlacementAssessment:
      semanticRuntimeCorpAdvancementCounterPlacementAssessment,
    corpHasRemoteInstability: semanticRuntimeCorpHasRemoteInstability,
    corpHasRemoteRezFloorFundingNeed:
      semanticRuntimeCorpHasRemoteRezFloorFundingNeed,
    corpHasCentralRezFloorFundingNeed:
      semanticRuntimeCorpHasCentralRezFloorFundingNeed,
    corpTaggedRunnerPayoffPressure,
    corpTaggedPayoffWindowPassiveActionPenalty,
    corpPassiveScoreLinePenalty: semanticRuntimeCorpPassiveScoreLinePenalty,
  },
  semanticRuntimeScoreFromComponents,
);

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
        isHoldoutSeed(
          config.seed ?? "ai-vs-ai-smoke",
          SOAK_SEEDS.holdoutSeeds,
        ),
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
    const runnerCoverage = runnerBreakerCoverageDiagnosticsForSimulationAction(
      input,
      action,
      targetServerId,
    );
    const runnerEconomySetup = runnerEconomySetupDiagnosticsForSimulationAction(
      input,
      action,
      targetServerId,
      result.state,
    );
    const tagPunishDiagnostics = tagPunishWindowDiagnosticsForSimulationAction(
      input,
      action,
      decision,
      stateBeforeAction,
      result.state,
    );
    const corpFutureRunIce = corpFutureRunIceDiagnosticsForSimulationAction(
      input,
      action,
    );
    const corpIcePortfolio = corpIcePortfolioDiagnosticsForSimulationAction(
      input,
      action,
    );
    const corpScoreTerminal = corpScoreTerminalDiagnosticsForSimulationAction(
      input,
      action,
    );
    const corpEconomyBeforeScore =
      corpEconomyBeforeScoreDiagnosticsForSimulationAction(input, action);
    actionSequence.push({
      side,
      stateVersionBefore: result.event.stateVersionBefore,
      selectedActionId: simulationSafeSelectedActionId(action, targetServerId),
      actionType: action.type,
      eventType: result.event.type,
      timingPoint: action.timingPoint,
      turnNumber:
        state.eventLog.filter((event) => event.type === "end_turn").length + 1,
      ...selfplayTraceFactsForSimulationDecision(decision, config),
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
      ...runnerCoverage,
      ...runnerEconomySetup,
      ...tagPunishDiagnostics,
      ...corpFutureRunIce,
      ...corpIcePortfolio,
      ...corpScoreTerminal,
      ...corpEconomyBeforeScore,
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
    ...(state.gameEndReason ? { gameEndReason: state.gameEndReason } : {}),
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
    metrics: metricsFor(
      actionSequence,
      errors,
      replay.ok,
      isHoldoutSeed(seed, SOAK_SEEDS.holdoutSeeds),
    ),
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
  const snapshot = [
    ...LOCAL_REALISTIC_FROZEN_DECK_SNAPSHOTS,
    ...REAL_SCENE_FROZEN_DECK_SNAPSHOTS,
  ].find((candidate) => candidate.deckSnapshotId === snapshotId);
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
    resolveLocalDeckEditorDecksDir({
      ...(reference.baseDir ? { baseDir: reference.baseDir } : {}),
      storage: LOCAL_REALISTIC_BENCHMARK_DECKS.storage,
    }),
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
  const baselineProfile = benchmarkProfileById(
    baselineProfileId,
    BENCHMARK_PROFILES_143.profiles,
  );
  const candidateProfile = benchmarkProfileById(
    candidateProfileId,
    BENCHMARK_PROFILES_143.profiles,
  );
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
  const baselineProfile = benchmarkProfileById(
    baselineProfileId,
    BENCHMARK_PROFILES_143.profiles,
  );
  const candidateProfile = benchmarkProfileById(
    candidateProfileId,
    BENCHMARK_PROFILES_143.profiles,
  );
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
        runV143Profile(
          benchmarkProfileById(profileId, BENCHMARK_PROFILES_143.profiles),
          seeds,
          config,
        )
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

export function runAiSelfplayTraceMining(
  config: AiSelfplayTraceMiningConfig = {},
): AiSelfplayTraceMiningResult {
  const seeds =
    config.seeds && config.seeds.length > 0
      ? config.seeds
      : SOAK_SEEDS_143.tuningSeeds.slice(0, 5);
  const maxActions = config.maxActions ?? 100;
  const runnerControllerMode =
    config.runnerControllerMode ?? "current_candidate";
  const corpControllerMode = config.corpControllerMode ?? "current_candidate";
  const summaries = seeds.map((seed) =>
    simulateAiGame({
      seed,
      maxActions,
      ...(config.agendaPointsToWin !== undefined
        ? { agendaPointsToWin: config.agendaPointsToWin }
        : {}),
      ...(config.runnerDifficulty
        ? { runnerDifficulty: config.runnerDifficulty }
        : {}),
      ...(config.corpDifficulty
        ? { corpDifficulty: config.corpDifficulty }
        : {}),
      ...(config.runnerProfileId
        ? { runnerProfileId: config.runnerProfileId }
        : {}),
      ...(config.corpProfileId ? { corpProfileId: config.corpProfileId } : {}),
      ...(config.runnerDeck
        ? { runnerDeck: config.runnerDeck }
        : {
            runnerDeckId:
              config.runnerDeckId ?? SOAK_SEEDS_143.league.runnerDeckId,
          }),
      ...(config.corpDeck
        ? { corpDeck: config.corpDeck }
        : {
            corpDeckId: config.corpDeckId ?? SOAK_SEEDS_143.league.corpDeckId,
          }),
      ...(config.runnerDeckMetadata
        ? { runnerDeckMetadata: config.runnerDeckMetadata }
        : {}),
      ...(config.corpDeckMetadata
        ? { corpDeckMetadata: config.corpDeckMetadata }
        : {}),
      runnerControllerMode,
      corpControllerMode,
      ...(config.simulationRngSeed
        ? { simulationRngSeed: `${config.simulationRngSeed}:${seed}` }
        : {}),
      ...(config.beliefWorld ? { beliefWorld: config.beliefWorld } : {}),
      ...(config.includeActionAlternativesForFindings === true
        ? { includeActionAlternativesForFindings: true }
        : {}),
      ...(config.opportunitySnapshotRequests
        ? { opportunitySnapshotRequests: config.opportunitySnapshotRequests }
        : {}),
      ...(config.maxAlternativesPerFinding !== undefined
        ? { maxAlternativesPerFinding: config.maxAlternativesPerFinding }
        : {}),
    }),
  );
  const effectiveDetectorIds =
    config.detectorIds ??
    (maxActions > 120
      ? DEFAULT_SELFPLAY_TRACE_MINING_DETECTORS.filter(
          (detector) => detector !== "action_limit_reached",
        )
      : DEFAULT_SELFPLAY_TRACE_MINING_DETECTORS);
  const findings = detectAiSelfplaySuspiciousDecisions(summaries, {
    detectorIds: effectiveDetectorIds,
    longGameActionThreshold:
      config.longGameActionThreshold ??
      Math.max(20, Math.floor(maxActions * 0.75)),
  });
  if (config.includeActionAlternativesForFindings === true) {
    retainActionAlternativesForFindingWindows(
      summaries,
      findings,
      config.maxAlternativesPerFinding ?? 5,
      config.opportunitySnapshotRequests ?? [],
    );
  } else {
    stripSelfplayActionAlternatives(summaries);
  }
  const topFindings = findings.slice(0, config.maxFindings ?? 20);
  const enabledDetectors =
    effectiveDetectorIds.length > 0
      ? sortedUniqueSelfplayDetectors(effectiveDetectorIds)
      : DEFAULT_SELFPLAY_TRACE_MINING_DETECTORS;
  const progression = summarizeMatchProgressionMetrics(summaries);
  const allRedactionSafe = isSelfplayTraceRedactionSafe({
    findings,
    topFindings,
  });
  const aggregate = {
    games: summaries.length,
    decisions: summaries.reduce((sum, summary) => sum + summary.actions, 0),
    findings: findings.length,
    findingsBySeverity: countSelfplayFindingsBySeverity(findings),
    findingsByDetector: countSelfplayFindingsByDetector(findings),
    illegalActions: summaries.reduce(
      (sum, summary) => sum + summary.metrics.illegalActions,
      0,
    ),
    replayFailures: summaries.filter((summary) => !summary.replayOk).length,
    actionLimitReached: summaries.filter(
      (summary) =>
        effectiveDetectorIds.includes("action_limit_reached") &&
        summary.winner === "action_limit_reached" &&
        summary.actions >= maxActions &&
        summary.errors.length === 0,
    ).length,
    allRedactionSafe,
    redactionSafe: allRedactionSafe,
    averageGameLength: progression.averageActions,
    corpAgendaScores: progression.corpScores,
    runnerAgendaSteals: progression.runnerSteals,
    corpFlatlines: summaries.filter(
      (summary) =>
        summary.winner === "corp" && summary.gameEndReason === "flatline",
    ).length,
    scoreWindowMissed: progression.missedScoreWindows,
    unsafeScoreChosen: countUnsafeScoreChosen(summaries),
    passiveActionWithScoreLineAvailable:
      countPassiveActionWithScoreLineAvailable(summaries),
    actionLimitClusters: summarizeSelfplayActionLimitClusters(summaries),
    actionLimitSubclusters: summarizeSelfplayActionLimitSubclusters(summaries),
  };
  return {
    version: "ai-selfplay-trace-mining-v1",
    diagnosticOnly: true,
    noTraining: true,
    noAutofix: true,
    config: {
      seeds,
      maxActions,
      runnerDeckId:
        config.runnerDeck?.id ??
        config.runnerDeckId ??
        SOAK_SEEDS_143.league.runnerDeckId,
      corpDeckId:
        config.corpDeck?.id ??
        config.corpDeckId ??
        SOAK_SEEDS_143.league.corpDeckId,
      runnerControllerMode,
      corpControllerMode,
      enabledDetectors,
      includeActionAlternativesForFindings:
        config.includeActionAlternativesForFindings === true,
      maxAlternativesPerFinding: config.maxAlternativesPerFinding ?? 5,
    },
    summaries,
    findings,
    topFindings,
    aggregate,
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
      ...simulationDeckConfig(config, {
        runnerDeckId: SOAK_SEEDS_143.league.runnerDeckId,
        corpDeckId: SOAK_SEEDS_143.league.corpDeckId,
      }),
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

function chooseDecisionForSimulation(
  side: Side,
  input: AiDecisionInput,
  config: AiSimulationConfig,
  simulationRng: SimulationRng,
): AiDecision {
  const mode = controllerModeForSide(side, config);
  switch (mode) {
    case "random_legal_bot":
      return chooseRandomLegalDecision(input, simulationRng, {
        selectedChoicesForDecision,
      });
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
        ? chooseCorpAction(input, config.aiDecisionRuntimeOptions)
        : chooseRunnerBaselineAction(input);
    case "plan_runner_v1_4_1":
      return side === "runner"
        ? chooseRunnerAction(input, config.aiDecisionRuntimeOptions)
        : chooseCorpBaselineAction(input);
    case "belief_ai_v1_4_2":
      return chooseAiAction(input, config.aiDecisionRuntimeOptions);
    case "current_candidate":
      return chooseAiAction(input, config.aiDecisionRuntimeOptions);
  }
}

// Legacy baseline decision assembly for fallback and reference decisions.
function decisionFromChoices(
  input: AiDecisionInput,
  choices: LegacyBaselineChoice[],
): AiDecision {
  return decisionFromLegacyChoices(input, choices, {
    selectedChoicesForDecision,
    scrubEvidence,
  });
}

function selectedChoicesForDecision(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecision["selectedChoices"] | undefined {
  return selectedChoicesForDecisionRuntime(input, action, {
    evaluateCorpOpeningHand,
    evaluateRunnerOpeningHand,
    discardKeepScore,
    selectedRunnerProgramInstallTrashOptionIds,
    selectedRunnerForcedProgramTrashOptionIds,
    extractAiFeatures,
    rolesForCardId,
  });
}

// Legacy baseline scorer implementation. The public entrypoint lives in
// legacy/legacy-baseline.ts; this scorer stays colocated with its helper graph.
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
  const profile = profileWeights(input, AI_PROFILES);
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
            ...discardEvidenceForInput(
              input,
              discardCurrentPlanKind(input, {
                rolesForCardId,
                definitionTypeForCardId: cardDefinitionTypeForAi,
              }),
            ),
          );
      }
      break;
    case "steal_agenda":
      score = 1000;
      reasonCode = "runner.access.steal_agenda";
      explanation = "Eine sichtbare Agenda kann legal gestohlen werden.";
      evidence.push("access_agenda_visible");
      if (input.profileId.includes("v1.4.2") && input.ownDeckDoctrine) {
        evidence.push("steal_trash_protected_from_followup:true");
      }
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
        score = trashContext.deferredByBudget
          ? trashContext.acuteThreat
            ? 640
            : 360
          : trashContext.affordableRelevant
            ? trashContext.role === "scoring_protection"
              ? 940
              : trashContext.role === "run_tax"
                ? 875
                : trashContext.finitePoolEconomy
                  ? trashContext.bbsWhisperingCampaign
                    ? 1120
                    : 1040
                  : 890
            : trashContext.trashable && trashContext.role === "low_value"
              ? 430
              : 780;
        if (
          trashContext.finitePoolEconomy &&
          trashContext.corpValueRemaining >=
            Math.max(trashContext.trashCost + 4, 8)
        )
          score += 90;
        if (trashContext.dedicatedTrashCredits > 0) score += 80;
        evidence.push(...trashContext.evidence);
      }
      reasonCode = "runner.access.trash_value";
      explanation = "Eine zugreifbare Karte kann legal entfernt werden.";
      evidence.push("trash_legal");
      if (input.profileId.includes("v1.4.2") && input.ownDeckDoctrine) {
        evidence.push("steal_trash_protected_from_followup:true");
      }
      break;
    case "decline_trash":
      {
        const trashContext = runnerRemoteTrashAccessContext(input, action);
        score = trashContext.deferredByBudget
          ? 900
          : trashContext.affordableRelevant && trashContext.finitePoolEconomy
            ? 35
            : trashContext.affordableRelevant
              ? 120
              : trashContext.trashable && trashContext.role === "low_value"
                ? 760
                : 650;
        evidence.push(...trashContext.evidence);
      }
      reasonCode = "runner.access.decline_trash";
      explanation =
        "Der Runner lehnt das Trashen im Zugriff bewusst ab, wenn kein höherwertiger Trash-Plan greift.";
      evidence.push("decline_trash_legal");
      break;
    case "break_subroutine":
      {
        const runEffect = encounterRunRemainderEffectAssessment(input, action);
        const reserveContext = encounterBreakReserveContext(input, action);
        score = runEffect.ignoredBecauseNoRemainingIce
          ? 115
          : reserveContext.preserveReserve &&
              runEffect.hasRunRemainderEffect &&
              !runEffect.mustBreak
            ? 260
            : runEffect.mustBreak
              ? 940
              : runEffect.hasRunRemainderEffect
                ? 805
                : 740;
        reasonCode = runEffect.ignoredBecauseNoRemainingIce
          ? "runner.encounter.skip_irrelevant_future_effect_break"
          : runEffect.hasRunRemainderEffect
            ? "runner.encounter.break_run_remainder_effect"
            : "runner.encounter.break_etr";
        explanation = runEffect.ignoredBecauseNoRemainingIce
          ? "Eine sichtbare Subroutine wirkt nur auf spätere ICE; im aktuellen Run gibt es danach kein ICE mehr."
          : runEffect.hasRunRemainderEffect
            ? "Eine sichtbare Subroutine wuerde den restlichen Run verteuern oder gefaehrlicher machen."
            : "Eine sichtbare Subroutine kann legal gebrochen werden.";
        evidence.push(
          "encounter_solution",
          ...runEffect.evidence,
          ...reserveContext.evidence,
        );
      }
      break;
    case "pump_breaker":
      {
        const pumpAssessment = pumpViabilityAssessment(input, action);
        if (pumpAssessment.canLeadToBreak) {
          const runEffect = encounterRunRemainderEffectAssessment(input);
          score = runEffect.mustBreak ? 760 : 690;
          reasonCode = runEffect.mustBreak
            ? "runner.encounter.pump_run_remainder_effect"
            : "runner.encounter.pump_breaker";
          explanation =
            "Ein installierter Breaker kann die Begegnung verbessern.";
          evidence.push(
            "breaker_visible",
            "pump_can_enable_break",
            ...pumpAssessment.evidence,
            ...runEffect.evidence,
          );
        } else {
          score = 90;
          reasonCode = "runner.encounter.pump_without_matching_breaker";
          explanation =
            "Der sichtbare Breaker passt nicht zu diesem ICE; Pumpen verbessert die Begegnung nicht.";
          evidence.push(
            "breaker_visible",
            "pump_cannot_break_encountered_ice",
            ...pumpAssessment.evidence,
          );
        }
      }
      break;
    case "continue_run":
      {
        const runEffect = encounterRunRemainderEffectAssessment(input, action);
        score = runEffect.mustBreak
          ? 180
          : runEffect.hasRunRemainderEffect
            ? input.difficulty === "easy"
              ? 330
              : 470
            : input.difficulty === "easy"
              ? 360
              : 520;
        if (runEffect.paidConditionalPaymentRemediatesEffect) {
          score += 220;
        }
        if (runEffect.paidConditionalPaymentWithoutBeneficialEffect) {
          score -= 120;
        }
        reasonCode = runEffect.mustBreak
          ? "runner.encounter.continue_visible_future_path_risk"
          : "runner.encounter.continue";
        explanation = runEffect.mustBreak
          ? "Eine ungelöste sichtbare Subroutine wuerde den restlichen Run stark verschlechtern."
          : "Der Run kann nach sichtbarer Bewertung fortgesetzt werden.";
        evidence.push("continue_legal", ...runEffect.evidence);
      }
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
      {
        const sacrificeAssessment =
          runnerProgramInstallTrashAssessmentForAction(input, action);
        const sacrificePenalty =
          runnerProgramInstallDisplacementPenalty(sacrificeAssessment);
        const muPressureBonus = runnerMuPressureInstallPriorityBonus(
          input,
          action,
        );
        const persistentInstallEvaluation =
          runnerPersistentInstallEvaluationForAction(input, action);
        score =
          scoreRunnerInstall(roles, features, profile) +
          muPressureBonus.value -
          sacrificePenalty +
          runnerPersistentInstallLegacyScoreDelta(persistentInstallEvaluation);
        if (
          sacrificeAssessment?.memoryRequired &&
          !sacrificeAssessment.canFreeRequiredMemory
        ) {
          score = Math.min(score, 120);
          reasonCode = "runner.setup.install_blocked_by_program_sacrifice";
          explanation =
            "Die Installation wuerde ein wichtiges installiertes Programm opfern; die KI bricht den Pflicht-Trash-Pfad ab.";
        } else {
          reasonCode =
            muPressureBonus.value > 0
              ? "runner.setup.install_memory_support"
              : roles.some((role) => role.startsWith("breaker_"))
                ? "runner.setup.install_missing_breaker"
                : "runner.setup.install_support";
          explanation =
            muPressureBonus.value > 0
              ? "Die Runner-KI baut bei sichtbarem MU-Druck Memory-Support auf."
              : "Die Runner-KI verbessert sichtbare Rig- oder Setup-Rollen.";
        }
        evidence.push(
          "own_card_role_known",
          ...publicRoleEvidence(roles),
          ...muPressureBonus.evidence,
          ...(persistentInstallEvaluation
            ? [
                "persistent_install_evaluation:true",
                ...persistentInstallEvaluation.evidence.slice(0, 16),
              ]
            : []),
          ...(sacrificeAssessment?.memoryRequired
            ? [
                `program_sacrifice_penalty:${sacrificePenalty}`,
                ...sacrificeAssessment.evidence,
              ]
            : []),
        );
      }
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
      const ability = shellTradersAbility(action);
      if (ability === "set_aside_from_grip") {
        const counterAmount =
          typeof action.payload?.shellCounterAmount === "number"
            ? action.payload.shellCounterAmount
            : 0;
        const targetCardId =
          typeof action.payload?.targetCardId === "string"
            ? action.payload.targetCardId
            : "";
        const targetDefinitionId =
          typeof action.payload?.targetCardDefinitionId === "string"
            ? action.payload.targetCardDefinitionId
            : findVisibleCard(input, targetCardId)?.definitionId;
        const targetRoles = rolesForCardId(targetDefinitionId);
        const directInstall = shellTradersDirectInstallAction(input, action);
        const installedRigRoles = new Set(
          (input.playerView.own.rig ?? []).flatMap((card) =>
            rolesForCardId(card.definitionId),
          ),
        );
        const directInstallUrgency = directInstall
          ? shellTradersDirectInstallUrgency(
              input,
              targetRoles,
              directInstall,
              installedRigRoles,
            )
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
      } else if (ability === "remove_shell_counter") {
        const remaining =
          typeof action.payload?.remainingCounters === "number"
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
      const rndRepeatPressureBoost = rndFreshRepeatRunBoost(input, action);
      score = scoreRunTarget(
        action,
        features,
        profile,
        input.difficulty,
        staleCentralRepeatPenalty,
      );
      score += rndRepeatPressureBoost;
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
        ...(rndRepeatPressureBoost > 0
          ? [`rnd_repeat_pressure_boost:${rndRepeatPressureBoost}`]
          : []),
      );
      break;
    case "gain_credit":
      {
        const muPressureFunding = runnerMuPressureFundingPriorityBonus(
          input,
          action,
        );
        score =
          (input.difficulty === "easy"
            ? 560
            : features.credits < 4
              ? 540
              : 380) + muPressureFunding.value;
        reasonCode =
          muPressureFunding.value > 0
            ? "runner.setup.fund_memory_support"
            : "runner.economy.basic_credit";
        explanation =
          muPressureFunding.value > 0
            ? "Credits finanzieren sichtbaren Memory-Support gegen aktuellen MU-Druck."
            : "Credits verbessern die sichtbare Handlungsfähigkeit.";
        evidence.push("basic_economy", ...muPressureFunding.evidence);
      }
      break;
    case "draw_card":
      score = features.handCount < 3 ? 430 : 320;
      if (features.citySurveillanceSourceCount > 0) {
        const projectedCreditsPaid = Number(
          action.payload?.drawTaxProjectedCreditsPaid ??
            action.payload?.citySurveillanceProjectedCreditsPaid ??
            0,
        );
        const projectedTagsAdded = Number(
          action.payload?.drawTaxProjectedTagsAdded ??
            action.payload?.citySurveillanceProjectedTagsAdded ??
            0,
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
          `city_surveillance_decision:${String(action.payload?.drawTaxDecision ?? action.payload?.citySurveillanceDrawDecision ?? "unknown")}`,
          `city_surveillance_projected_credits:${Number(action.payload?.drawTaxProjectedCreditsPaid ?? action.payload?.citySurveillanceProjectedCreditsPaid ?? 0)}`,
          `city_surveillance_projected_tags:${Number(action.payload?.drawTaxProjectedTagsAdded ?? action.payload?.citySurveillanceProjectedTagsAdded ?? 0)}`,
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
  const profile = profileWeights(input, AI_PROFILES);
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
            ...discardEvidenceForInput(
              input,
              discardCurrentPlanKind(input, {
                rolesForCardId,
                definitionTypeForCardId: cardDefinitionTypeForAi,
              }),
            ),
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
      {
        const tagPunish = corpTagPunishOntologyAssessmentForAction(
          input,
          action,
        );
        const ontologyPayoffAvailable =
          tagPunish !== undefined &&
          tagPunish.isPunishPayoff &&
          features.opponentTags > 0;
        const ontologyTagSourceWithPayoff =
          Boolean(tagPunish?.isTagSource) &&
          corpOntologyPayoffAvailableForTagSource(input, action);
        score = scoreCorpOperation(roles, features, profile);
        if (ontologyPayoffAvailable && tagPunish) {
          score = Math.max(
            score,
            820 + tagPunishPayoffPriorityBonus(tagPunish),
          );
        } else if (ontologyTagSourceWithPayoff) {
          score = Math.max(
            score,
            720 + Math.round(traceTagExpectedSuccessEstimate(input) * 60),
          );
        } else if (tagPunish?.isTagSource) {
          score = Math.max(score, 500);
        }
        reasonCode = ontologyPayoffAvailable
          ? "corp.tag.punish_visible_tag"
          : ontologyTagSourceWithPayoff
            ? "corp.tag.source_visible_payoff"
            : roles.includes("tag_punishment")
              ? "corp.tag.punish_visible_tag"
              : roles.includes("draw_operation")
                ? "corp.economy.draw_operation"
                : "corp.economy.operation";
        evidence.push(...(tagPunish?.evidence ?? []));
        if (tagPunish?.isTagSource) {
          evidence.push(
            ontologyTagSourceWithPayoff
              ? "corp_tag_source_taken_with_ontology_payoff_available:true"
              : "corp_tag_source_taken_without_ontology_payoff:true",
          );
        }
      }
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
    case "activated_card_ability":
    case "trigger_ability": {
      const scoredAgenda = classifyCorpScoredAgendaAbility(input, action);
      if (scoredAgenda) {
        score = scoreCorpScoredAgendaAbility(scoredAgenda, features);
        reasonCode = corpScoredAgendaAbilityReasonCode(scoredAgenda.kind);
        explanation =
          "Die Corp nutzt eine sichtbare Fähigkeit einer gescorten Agenda.";
        evidence.push(
          ...scoredAgenda.evidence,
          "scored_agenda_action_taken:true",
          ...(scoredAgenda.kind === "scored_agenda_economy" ||
          scoredAgenda.kind === "scored_agenda_counter_economy"
            ? ["scored_agenda_economy_taken:true"]
            : []),
          ...(scoredAgenda.kind === "scored_agenda_counter_economy"
            ? ["scored_agenda_counter_economy_taken:true"]
            : []),
          ...(scoredAgenda.kind === "scored_agenda_draw" ||
          scoredAgenda.kind === "scored_agenda_shuffle_draw"
            ? ["scored_agenda_draw_taken:true"]
            : []),
          ...(scoredAgenda.kind === "scored_agenda_extra_action"
            ? ["scored_agenda_extra_action_taken:true"]
            : []),
          ...(scoredAgenda.kind === "scored_agenda_trace_tag"
            ? ["scored_agenda_trace_tag_taken:true"]
            : []),
          ...(scoredAgenda.kind === "scored_agenda_damage_punish"
            ? ["scored_agenda_damage_punish_taken:true"]
            : []),
          ...(scoredAgenda.sourceDefinitionId ===
          "onr_v1_210_political-overthrow"
            ? ["political_overthrow_taken:true"]
            : []),
        );
      } else if (
        action.type === "activated_card_ability" &&
        isSourceAdvancementCounterCreditPayoutAction(action)
      ) {
        const assessment = corpSourceAdvancementCounterCreditPayoutAssessment(
          input,
          action,
          features.credits,
        );
        score = assessment.score;
        reasonCode =
          "corp.installed_economy.source_advancement_counter_credit_payout";
        explanation =
          assessment.payout > 0
            ? "Die Corp nutzt eine vorbereitete Advancement-Counter-Credit-Quelle."
            : "Die Fähigkeit ist legal, hat ohne Advancement-Counter aber keinen Credit-Wert.";
        evidence.push(...assessment.evidence);
      } else {
        score = 260;
        reasonCode = "corp.card_ability.visible";
        explanation = "Eine sichtbare Kartenfähigkeit ist legal verfügbar.";
        evidence.push("corp_card_ability");
      }
      break;
    }
    case "purge_virus_counters":
      score = 780;
      reasonCode = "corp.purge.visible_virus_counters";
      explanation =
        "Die Corp nutzt die legale Purge-Aktion gegen sichtbare Virus-Counter.";
      evidence.push("purge_legal");
      break;
    case "gain_credit":
      {
        const scoredAgenda = classifyCorpScoredAgendaAbility(input, action);
        if (scoredAgenda) {
          score = scoreCorpScoredAgendaAbility(scoredAgenda, features);
          reasonCode = corpScoredAgendaAbilityReasonCode(scoredAgenda.kind);
          explanation =
            "Die Corp nutzt eine sichtbare Fähigkeit einer gescorten Agenda.";
          evidence.push(
            ...scoredAgenda.evidence,
            "scored_agenda_action_taken:true",
            ...(scoredAgenda.kind === "scored_agenda_economy" ||
            scoredAgenda.kind === "scored_agenda_counter_economy"
              ? ["scored_agenda_economy_taken:true"]
              : []),
            ...(scoredAgenda.kind === "scored_agenda_counter_economy"
              ? ["scored_agenda_counter_economy_taken:true"]
              : []),
          );
        } else {
          const betterAgendaEconomy = betterScoredAgendaEconomyAvailable(
            input,
            action,
          );
          const politicalOverthrowAvailable =
            politicalOverthrowEconomyAvailable(input, action);
          score = features.credits < 5 ? 500 : 350;
          if (betterAgendaEconomy) score -= 220;
          reasonCode = betterAgendaEconomy
            ? "corp.economy.basic_credit_deferred_for_scored_agenda"
            : "corp.economy.basic_credit";
          explanation = "Credits verbessern Rez- und Score-Fenster.";
          evidence.push(
            "basic_economy",
            ...(betterAgendaEconomy
              ? [
                  "basic_credit_taken_while_better_agenda_economy_available:true",
                  "scored_agenda_economy_skipped_for_basic_credit:true",
                  ...(politicalOverthrowAvailable
                    ? ["political_overthrow_skipped_for_basic_credit:true"]
                    : []),
                ]
              : []),
          );
        }
      }
      break;
    case "draw_card":
      {
        const betterAgendaDraw = betterScoredAgendaDrawAvailable(input, action);
        score = features.handCount < 4 ? 460 : 320;
        if (betterAgendaDraw) score -= 180;
        reasonCode = betterAgendaDraw
          ? "corp.economy.basic_draw_deferred_for_scored_agenda"
          : "corp.economy.draw_card";
      }
      explanation =
        "Eine Karte zu ziehen verbessert die sichtbare Corp-Auswahl.";
      evidence.push(
        `hand_count:${features.handCount}`,
        ...(betterScoredAgendaDrawAvailable(input, action)
          ? ["basic_draw_taken_while_better_agenda_draw_available:true"]
          : []),
      );
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

function scoreCorpScoredAgendaAbility(
  assessment: NonNullable<ReturnType<typeof classifyCorpScoredAgendaAbility>>,
  features: AiFeatures,
): number {
  const lowCredits = features.credits < 5;
  switch (assessment.kind) {
    case "scored_agenda_economy":
    case "scored_agenda_counter_economy":
      return (
        610 +
        Math.max(0, assessment.netCredits - assessment.clickCost) * 55 +
        (lowCredits ? 80 : 25) -
        Math.max(0, assessment.clickCost - 1) * 70
      );
    case "scored_agenda_draw":
      return 600 + Math.max(0, assessment.drawAmount - 1) * 55;
    case "scored_agenda_shuffle_draw":
      return 640 + Math.max(0, assessment.drawAmount - 2) * 35;
    case "scored_agenda_extra_action":
      return 720 + assessment.gainedActions * 45;
    case "scored_agenda_trace_tag":
      return features.opponentTags > 0 ? 520 : 560 + assessment.tacticalValue;
    case "scored_agenda_damage_punish":
      return features.opponentTags > 0 ? 790 + assessment.tacticalValue : 180;
    case "scored_agenda_utility":
      return 330 + assessment.tacticalValue;
    case "unknown_scored_agenda_ability":
      return 240;
  }
}

function corpScoredAgendaAbilityReasonCode(
  kind: NonNullable<ReturnType<typeof classifyCorpScoredAgendaAbility>>["kind"],
): string {
  switch (kind) {
    case "scored_agenda_economy":
      return "corp.scored_agenda.economy";
    case "scored_agenda_counter_economy":
      return "corp.scored_agenda.counter_economy";
    case "scored_agenda_draw":
    case "scored_agenda_shuffle_draw":
      return "corp.scored_agenda.draw";
    case "scored_agenda_extra_action":
      return "corp.scored_agenda.extra_action";
    case "scored_agenda_trace_tag":
      return "corp.scored_agenda.trace_tag";
    case "scored_agenda_damage_punish":
      return "corp.scored_agenda.damage_punish";
    default:
      return "corp.scored_agenda.utility";
  }
}

function betterScoredAgendaEconomyAvailable(
  input: AiDecisionInput,
  selectedAction: LegalAction,
): boolean {
  return input.legalActions.some((action) => {
    if (action.actionId === selectedAction.actionId) return false;
    const scoredAgenda = classifyCorpScoredAgendaAbility(input, action);
    return Boolean(
      scoredAgenda &&
      (scoredAgenda.kind === "scored_agenda_economy" ||
        scoredAgenda.kind === "scored_agenda_counter_economy") &&
      scoredAgenda.netCredits > Math.max(1, scoredAgenda.clickCost),
    );
  });
}

function betterScoredAgendaDrawAvailable(
  input: AiDecisionInput,
  selectedAction: LegalAction,
): boolean {
  return input.legalActions.some((action) => {
    if (action.actionId === selectedAction.actionId) return false;
    const scoredAgenda = classifyCorpScoredAgendaAbility(input, action);
    return Boolean(
      scoredAgenda &&
      (scoredAgenda.kind === "scored_agenda_draw" ||
        scoredAgenda.kind === "scored_agenda_shuffle_draw") &&
      scoredAgenda.drawAmount > Math.max(1, scoredAgenda.clickCost),
    );
  });
}

function politicalOverthrowEconomyAvailable(
  input: AiDecisionInput,
  selectedAction: LegalAction,
): boolean {
  return input.legalActions.some((action) => {
    if (action.actionId === selectedAction.actionId) return false;
    const scoredAgenda = classifyCorpScoredAgendaAbility(input, action);
    return Boolean(
      scoredAgenda?.sourceDefinitionId === "onr_v1_210_political-overthrow" &&
      scoredAgenda.kind === "scored_agenda_economy" &&
      scoredAgenda.netCredits > Math.max(1, scoredAgenda.clickCost),
    );
  });
}

function extractAiFeatures(input: AiDecisionInput): AiFeatures {
  return extractAiFeaturesRuntime(input, {
    rolesForCardId,
    buildObservedFacts,
    buildServerFeatures,
    assessKnownRezzedIcePath,
    isBlockedByKnownRezzedIce,
    visibleCitySurveillanceSourceCount,
  });
}

const SCORCHED_EARTH_LIKE_PUNISH_IDS = new Set(["onr_v1_302_scorched-earth"]);
const URBAN_RENEWAL_LIKE_PUNISH_IDS = new Set(["onr_v1_307_urban-renewal"]);
const PUNITIVE_COUNTERSTRIKE_LIKE_PUNISH_IDS = new Set([
  "onr_v1_301_punitive-counterstrike",
]);
const CLOSED_ACCOUNTS_LIKE_PUNISH_IDS = new Set(["onr_v1_285_closed-accounts"]);
const POWER_GRID_OVERLOAD_LIKE_PUNISH_IDS = new Set([
  "onr_v1_299_power-grid-overload",
]);
const DATAPOOL_LIKE_PUNISH_IDS = new Set(["onr_v1_287_datapool-by-zetatech"]);
const CORP_TAG_SOURCE_IDS = new Set([
  "onr_v1_283_audit-of-call-records",
  "onr_v1_284_chance-observation",
  "onr_v1_287_datapool-by-zetatech",
  "onr_v1_293_netwatch-credit-voucher",
  "onr_v1_306_trojan-horse",
]);
const CORP_TRACE_TAG_SOURCE_IDS = new Set([
  "onr_v1_207_netwatch-operations-office",
  "onr_v1_243_fetch-4-0-1",
  "onr_v1_249_hunter",
  "onr_v1_283_audit-of-call-records",
  "onr_v1_284_chance-observation",
  "onr_v1_213_private-cybernet-police",
  "onr_v1_310_blood-cat",
  "onr_v1_260_pocket-virtual-reality",
]);

const RUNNER_TRACE_DEFENSE_CONTEXT_IDS = new Set([
  "onr_v1_003_baedekers-net-map",
  "onr_v1_004_bakdoor",
  "onr_v1_051_rabbit",
  "onr_v1_063_signpost",
]);
const RUNNER_DAMAGE_PREVENTION_CONTEXT_IDS = new Set([
  "onr_v1_023_evil-twin",
  "onr_v1_028_force-shield",
  "onr_v1_061_shield",
]);
const RUNNER_FLATLINE_PREVENTION_CONTEXT_IDS = new Set([
  "onr_v1_022_emergency-self-construct",
]);

function tagPunishWindowDiagnosticsForSimulationAction(
  input: AiDecisionInput,
  action: LegalAction,
  decision: AiDecision,
  stateBeforeAction: GameState,
  stateAfterAction: GameState,
): Partial<AiSimulationSummary["actionSequence"][number]> {
  const runnerTagsBefore = stateBeforeAction.runner.tags;
  const runnerTagsAfter = stateAfterAction.runner.tags;
  const diagnostics: Partial<AiSimulationSummary["actionSequence"][number]> = {
    runnerTagsBeforeAction: runnerTagsBefore,
    runnerTagsAfterAction: runnerTagsAfter,
  };
  if (input.side === "corp") {
    const visiblePunishOpportunities = corpVisibleTagPunishOpportunities(input);
    const visiblePayoffCategories = sortedUnique(
      visiblePunishOpportunities.map((opportunity) => opportunity.category),
    );
    const visiblePayoffCards = sortedUnique(
      visiblePunishOpportunities
        .map((opportunity) => opportunity.cardId)
        .filter((cardId): cardId is string => Boolean(cardId)),
    );
    const survivalContext = runnerSurvivalCounterContextForInput(input);
    const selectedOntology = corpTagPunishOntologyAssessmentForAction(
      input,
      action,
    );
    applyTagPunishOntologyDiagnostics(diagnostics, selectedOntology);
    if (runnerTagsBefore > 0) {
      diagnostics.runnerTaggedAtCorpDecision = true;
      if (visiblePunishOpportunities.length > 0)
        diagnostics.runnerTaggedAtCorpDecisionWithFunnelPayoffKnown = true;
      else diagnostics.runnerTaggedAtCorpDecisionWithoutPayoffKnown = true;
    }
    if (isCorpTurnStartDecision(action, stateBeforeAction))
      diagnostics.runnerTaggedAtStartOfCorpTurn = runnerTagsBefore > 0;
    if (visiblePunishOpportunities.length > 0) {
      diagnostics.corpVisibleTagPunishLegalActions =
        visiblePunishOpportunities.length;
      diagnostics.corpVisibleTagPunishDecisionWindow = true;
      diagnostics.corpVisibleTagPayoffLegalActionKinds =
        visiblePayoffCategories;
      diagnostics.corpVisibleTagPayoffLegalActionCards = visiblePayoffCards;
      if (visiblePunishOpportunities.length > 1)
        diagnostics.corpVisibleTagPunishDecisionWindowWithMultiplePayoffs = true;
      if (visiblePayoffCategories.includes("damage"))
        diagnostics.corpVisibleTagDamagePunishLegalActions = true;
      if (visiblePayoffCategories.includes("economic"))
        diagnostics.corpVisibleTagEconomicPunishLegalActions = true;
      if (visiblePayoffCategories.includes("trash"))
        diagnostics.corpVisibleTagTrashPunishLegalActions = true;
      if (visiblePayoffCategories.includes("run_lock"))
        diagnostics.corpVisibleTagRunLockPunishLegalActions = true;
      if (visiblePayoffCategories.includes("ambush"))
        diagnostics.corpVisibleTagAmbushPunishLegalActions = true;
      if (survivalContext.any) {
        diagnostics.runnerSurvivalCounterContextAvailable = true;
        if (survivalContext.damage)
          diagnostics.runnerDamagePreventionVisibleAtPayoffWindow = true;
        if (survivalContext.flatline)
          diagnostics.runnerFlatlinePreventionVisibleAtPayoffWindow = true;
      }
    }
    const chosenPunishOpportunity = visiblePunishOpportunities.find(
      (opportunity) => opportunity.action.actionId === action.actionId,
    );
    const punishOpportunity =
      chosenPunishOpportunity ?? visiblePunishOpportunities[0];
    if (punishOpportunity) {
      const punishOntology = corpTagPunishOntologyAssessmentForAction(
        input,
        punishOpportunity.action,
      );
      applyTagPunishOntologyDiagnostics(diagnostics, punishOntology);
      diagnostics.corpPunishOpportunity = true;
      diagnostics.corpPunishKind = punishOpportunity.kind;
      if (punishOntology?.isPunishPayoff)
        diagnostics.corpPunishOpportunityConfirmedByOntology = true;
      if (chosenPunishOpportunity) {
        diagnostics.corpPunishTaken = true;
        diagnostics.corpVisibleTagPunishTaken = true;
        diagnostics.corpVisibleTagPunishDecisionWindowTaken = true;
        if (punishOntology?.isPunishPayoff)
          diagnostics.corpOntologyPunishOpportunityConverted = true;
        applyCorpVisibleTagPunishTakenWindowDiagnostics(
          diagnostics,
          input,
          action,
          decision,
          chosenPunishOpportunity,
          visiblePunishOpportunities,
        );
      } else {
        const skippedReason = corpTagPunishSkipReason(action, decision);
        diagnostics.corpPunishSkippedReason = skippedReason;
        diagnostics.corpVisibleTagPunishSkipped = true;
        diagnostics.corpVisibleTagPunishSkippedReason = skippedReason;
        diagnostics.corpVisibleTagPunishDecisionWindowSkipped = true;
        diagnostics.corpVisibleTagPunishSkippedOnlyWhenNoPayoffChosen = true;
        if (
          skippedReason === "unknown_higher_priority" ||
          skippedReason === "unknown"
        )
          applyCorpVisibleTagPunishUnknownSkipDiagnostics(
            diagnostics,
            input,
            action,
            decision,
            visiblePunishOpportunities,
            survivalContext,
          );
        if (
          diagnostics.corpVisibleTagPunishUnknownSkipFixGateEligible === true
        ) {
          diagnostics.corpVisibleTagPunishFixGateEligibleWindowNormalized = true;
          if (
            diagnostics.corpVisibleTagPunishUnknownSkipPlausibility ===
            "suspicious"
          )
            diagnostics.corpVisibleTagPunishFixGateSuspiciousSkipNormalized = true;
        }
        if (
          skippedReason === "unknown_higher_priority" ||
          skippedReason === "unknown"
        )
          diagnostics.corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization = true;
        if (survivalContext.any)
          diagnostics.runnerSurvivalCounterContextSuppressedPunishValue = true;
        if (punishOntology?.isPunishPayoff)
          diagnostics.corpPunishSkippedDespiteOntologyOpportunity = true;
      }
    }
    const tagSourceOpportunity = strongestCorpTagSourceOpportunity(input);
    if (tagSourceOpportunity) {
      const tagSourceOntology = corpTagPunishOntologyAssessmentForAction(
        input,
        tagSourceOpportunity.action,
      );
      applyTagPunishOntologyDiagnostics(diagnostics, tagSourceOntology);
      diagnostics.corpTagSourceOpportunity = true;
      if (
        corpOntologyPayoffAvailableForTagSource(
          input,
          tagSourceOpportunity.action,
        )
      )
        diagnostics.corpFunnelSourcePayoffPairSeenInDeck = true;
      if (survivalContext.any)
        diagnostics.runnerSurvivalCounterContextAvailable = true;
      if (survivalContext.trace)
        diagnostics.runnerTraceDefenseVisibleAtTagSource = true;
      if (tagSourceOpportunity.traceTag && survivalContext.link)
        diagnostics.runnerLinkDefenseVisibleAtTrace = true;
      if (action.actionId === tagSourceOpportunity.action.actionId) {
        diagnostics.corpTagSourceTaken = true;
        applyCorpTagSourceWindowDiagnostics(
          diagnostics,
          input,
          tagSourceOpportunity.action,
        );
        if (diagnostics.corpFunnelSourcePayoffPairSeenInDeck === true)
          diagnostics.corpFunnelSourceActionTakenWithPayoffInDeck = true;
        if (tagSourceOntology?.isTagSource) {
          if (corpOntologyPayoffAvailableForTagSource(input, action)) {
            diagnostics.corpTagSourceTakenWithOntologyPayoffAvailable = true;
            diagnostics.corpFunnelSourceActionTakenWithVisiblePayoff = true;
          } else {
            diagnostics.corpTagSourceTakenWithoutOntologyPayoff = true;
            diagnostics.corpFunnelSourceActionTakenWithoutVisiblePayoff = true;
          }
        }
      } else {
        diagnostics.corpTraceTagSkippedReason = corpTagPunishSkipReason(
          action,
          decision,
        );
      }
      if (tagSourceOpportunity.traceTag) {
        diagnostics.corpTraceTagOpportunity = true;
        diagnostics.corpTraceTagExpectedSuccess =
          traceTagExpectedSuccessEstimate(input);
        if (action.actionId === tagSourceOpportunity.action.actionId)
          diagnostics.corpTraceTagTaken = true;
      }
    } else if (decision.reasonCode === "corp.trace.bid_visible_amount") {
      diagnostics.corpTagSourceOpportunity = true;
      diagnostics.corpTagSourceTaken = true;
      diagnostics.corpTraceTagOpportunity = true;
      diagnostics.corpTraceTagTaken = true;
      diagnostics.corpTraceTagExpectedSuccess =
        traceTagExpectedSuccessEstimate(input);
    }
  }
  if (input.side === "runner" && action.type === "end_turn")
    diagnostics.runnerTaggedAtEndOfRunnerTurn = runnerTagsAfter > 0;
  if (runnerTagsAfter > runnerTagsBefore) {
    diagnostics.runnerTagAddedByAction = true;
    applyActualTagCreationDiagnostics(
      diagnostics,
      input,
      action,
      decision,
      stateBeforeAction,
    );
    if (
      stateBeforeAction.run ||
      decision.reasonCode.includes("trace") ||
      action.type === "resolve_choice"
    )
      diagnostics.runnerTaggedAfterTraceDuringRun = true;
  }
  if (runnerTagsAfter < runnerTagsBefore)
    diagnostics.runnerTagClearedByAction = true;
  return diagnostics;
}

function applyTagPunishOntologyDiagnostics(
  diagnostics: Partial<AiSimulationSummary["actionSequence"][number]>,
  assessment: ReturnType<typeof corpTagPunishOntologyAssessmentForAction>,
): void {
  if (!assessment) return;
  diagnostics.corpTagPunishOntologyProfilesSeen = true;
  if (assessment.profile.tagSource)
    diagnostics.corpTagSourceOntologyProfilesSeen = true;
  if (assessment.profile.payoff)
    diagnostics.corpTagPunishPayoffOntologyProfilesSeen = true;
  if (assessment.isTagSource) diagnostics.corpTagSourceOntologyUsed = true;
  if (assessment.isPunishPayoff)
    diagnostics.corpTagPunishPayoffOntologyUsed = true;
  if (assessment.conflictWithLegacy)
    diagnostics.corpTagPunishOntologyConflict = true;
  if (assessment.isTagSource)
    diagnostics.corpTagSourceLegalActionClassifiedByOntology = true;
  if (assessment.isPunishPayoff)
    diagnostics.corpPunishLegalActionClassifiedByOntology = true;
  diagnostics.corpTagPunishOntologyKinds = sortedUnique([
    ...(diagnostics.corpTagPunishOntologyKinds ?? []),
    ...assessment.profile.effectKinds,
    ...(assessment.payoffKind === "scored_agenda_damage_like"
      ? ["scored_agenda_damage_like"]
      : []),
    ...(assessment.payoffKind === "scored_agenda_trace_tag_like"
      ? ["scored_agenda_trace_tag_like"]
      : []),
  ]);
  diagnostics.corpTagPunishConditionKinds = sortedUnique([
    ...(diagnostics.corpTagPunishConditionKinds ?? []),
    ...assessment.profile.conditionKinds,
  ]);
}

function isCorpTurnStartDecision(
  action: LegalAction,
  stateBeforeAction: GameState,
): boolean {
  return (
    action.side === "corp" &&
    (action.type === "mandatory_draw" ||
      stateBeforeAction.activeSide === "corp")
  );
}

function corpVisibleTagPunishOpportunities(input: AiDecisionInput): Array<{
  action: LegalAction;
  kind: CorpPunishKind;
  category: CorpVisibleTagPayoffCategory;
  cardId: string | undefined;
}> {
  if (input.side !== "corp") return [];
  return input.legalActions
    .map((action) => {
      const kind = corpPunishKindForAction(input, action);
      if (!kind) return undefined;
      return {
        action,
        kind,
        category: corpVisibleTagPayoffCategoryForAction(input, action, kind),
        cardId: sourceDefinitionIdForAction(input, action) || undefined,
      };
    })
    .filter(
      (
        opportunity,
      ): opportunity is {
        action: LegalAction;
        kind: CorpPunishKind;
        category: CorpVisibleTagPayoffCategory;
        cardId: string | undefined;
      } => opportunity !== undefined,
    );
}

function corpVisibleTagPayoffCategoryForAction(
  input: AiDecisionInput,
  action: LegalAction,
  kind: CorpPunishKind,
): CorpVisibleTagPayoffCategory {
  const ontology = corpTagPunishOntologyAssessmentForAction(input, action);
  if (ontology?.payoffKind)
    return corpVisibleTagPayoffCategoryFromOntology(ontology.payoffKind);
  if (
    kind === "scorched_earth_like" ||
    kind === "urban_renewal_like" ||
    kind === "punitive_counterstrike_like" ||
    kind === "scored_agenda_damage_like"
  )
    return "damage";
  if (kind === "closed_accounts_like" || kind === "datapool_like")
    return "economic";
  if (kind === "resource_trash_like" || kind === "power_grid_overload_like")
    return "trash";
  const roles = rolesForAction(input, action);
  if (roles.some((role) => role.includes("run_lock"))) return "run_lock";
  if (roles.some((role) => role.includes("ambush"))) return "ambush";
  return "unknown";
}

function applyCorpVisibleTagPunishTakenWindowDiagnostics(
  diagnostics: Partial<AiSimulationSummary["actionSequence"][number]>,
  input: AiDecisionInput,
  action: LegalAction,
  decision: AiDecision,
  chosenOpportunity: {
    action: LegalAction;
    kind: CorpPunishKind;
    category: CorpVisibleTagPayoffCategory;
    cardId: string | undefined;
  },
  opportunities: Array<{
    action: LegalAction;
    kind: CorpPunishKind;
    category: CorpVisibleTagPayoffCategory;
    cardId: string | undefined;
  }>,
): void {
  const alternatives = opportunities.filter(
    (opportunity) => opportunity.action.actionId !== action.actionId,
  );
  if (alternatives.length <= 0) return;

  diagnostics.corpVisibleTagPunishAlternativePayoffsNotChosen =
    alternatives.length;
  diagnostics.corpVisibleTagPunishChosenPayoffAmongAlternatives = true;
  if (action.type === "play_operation")
    diagnostics.corpVisibleTagPunishOperationChoiceAmongPayoffs = true;

  const legacyReference = opportunities[0];
  if (legacyReference?.action.actionId !== action.actionId) {
    diagnostics.corpVisibleTagPunishWindowHadTakenAndSkippedBeforeNormalization = true;
    const legacySkippedReason = corpTagPunishSkipReason(action, decision);
    if (
      legacySkippedReason === "unknown_higher_priority" ||
      legacySkippedReason === "unknown"
    ) {
      diagnostics.corpVisibleTagPunishUnknownSkipResolvedAsAlternativePayoff = true;
      diagnostics.corpVisibleTagPunishFixGateResolvedByAlternativePayoffTaken = true;
    }
  }

  const chosenLethal = corpPayoffOpportunityIsLethalOrNearLethal(
    input,
    chosenOpportunity,
  );
  const alternativeCategories = new Set(
    alternatives.map((opportunity) => opportunity.category),
  );
  const alternativeLethal = alternatives.some((opportunity) =>
    corpPayoffOpportunityIsLethalOrNearLethal(input, opportunity),
  );
  if (
    chosenOpportunity.category === "damage" &&
    alternativeCategories.has("economic")
  )
    diagnostics.corpVisibleTagPunishChosenDamageOverEconomic = true;
  if (
    chosenOpportunity.category === "economic" &&
    alternativeCategories.has("damage")
  ) {
    diagnostics.corpVisibleTagPunishChosenEconomicOverDamage = true;
    diagnostics.corpVisibleTagPunishPotentialPayoffOrderingIssueEconomicVsDamage = true;
  }
  if (
    chosenOpportunity.category === "trash" &&
    alternativeCategories.has("damage")
  )
    diagnostics.corpVisibleTagPunishChosenTrashOverDamage = true;
  if (
    chosenLethal &&
    alternatives.some((opportunity) => opportunity.category !== "damage")
  )
    diagnostics.corpVisibleTagPunishChosenLethalOverNonLethal = true;
  if (!chosenLethal && alternativeLethal) {
    diagnostics.corpVisibleTagPunishChosenNonLethalOverLethal = true;
    diagnostics.corpVisibleTagPunishPotentialPayoffOrderingIssueLethalMissed = true;
  }

  const chosenImpact = corpVisibleTagPayoffImpact(chosenOpportunity);
  const alternativeImpacts = alternatives.map(corpVisibleTagPayoffImpact);
  if (
    chosenImpact === undefined ||
    alternativeImpacts.some((impact) => impact === undefined)
  ) {
    diagnostics.corpVisibleTagPunishChosenUnknownImpactOrdering = true;
  } else if (Math.max(...(alternativeImpacts as number[])) > chosenImpact) {
    diagnostics.corpVisibleTagPunishChosenLowerImpactOverHigherImpact = true;
  }
  if (
    diagnostics.corpVisibleTagPunishChosenLowerImpactOverHigherImpact ===
      true ||
    diagnostics.corpVisibleTagPunishChosenNonLethalOverLethal === true ||
    diagnostics.corpVisibleTagPunishChosenEconomicOverDamage === true ||
    diagnostics.corpVisibleTagPunishChosenTrashOverDamage === true
  )
    diagnostics.corpVisibleTagPunishPotentialPayoffOrderingIssue = true;
}

function corpVisibleTagPayoffImpact(opportunity: {
  category: CorpVisibleTagPayoffCategory;
}): number | undefined {
  switch (opportunity.category) {
    case "damage":
      return 50;
    case "economic":
      return 35;
    case "trash":
      return 30;
    case "run_lock":
      return 20;
    case "ambush":
      return 15;
    case "unknown":
      return undefined;
  }
}

function corpPayoffOpportunityIsLethalOrNearLethal(
  input: AiDecisionInput,
  opportunity: { category: CorpVisibleTagPayoffCategory },
): boolean {
  return (
    opportunity.category === "damage" &&
    input.playerView.opponent.handCount <= 3
  );
}

function applyCorpVisibleTagPunishUnknownSkipDiagnostics(
  diagnostics: Partial<AiSimulationSummary["actionSequence"][number]>,
  input: AiDecisionInput,
  action: LegalAction,
  decision: AiDecision,
  opportunities: Array<{
    action: LegalAction;
    kind: CorpPunishKind;
    category: CorpVisibleTagPayoffCategory;
    cardId: string | undefined;
  }>,
  survivalContext: ReturnType<typeof runnerSurvivalCounterContextForInput>,
): void {
  const chosenFamily = corpUnknownSkipChosenFamily(input, action);
  const chosenCardId = sourceDefinitionIdForAction(input, action) || undefined;
  const chosenCardTitle = titleForCardId(chosenCardId);
  const attribution = corpUnknownSkipAttribution(
    input,
    action,
    decision,
    opportunities,
    chosenFamily,
    survivalContext,
  );
  const plausibility = corpUnknownSkipPlausibility(attribution);
  const fixGate = corpUnknownSkipFixGate(attribution, opportunities);
  diagnostics.corpVisibleTagPunishUnknownSkipChosenFamily = chosenFamily;
  diagnostics.corpVisibleTagPunishUnknownSkipChosenActionType = action.type;
  if (chosenCardId)
    diagnostics.corpVisibleTagPunishUnknownSkipChosenCardId = chosenCardId;
  if (chosenCardTitle)
    diagnostics.corpVisibleTagPunishUnknownSkipChosenCardTitle =
      chosenCardTitle;
  diagnostics.corpVisibleTagPunishUnknownSkipAttribution = attribution;
  diagnostics.corpVisibleTagPunishUnknownSkipPlausibility = plausibility;
  if (corpUnknownSkipPayoffLethalOrNearLethal(input, opportunities))
    diagnostics.corpVisibleTagPunishUnknownSkipPayoffLethalOrNearLethal = true;
  if (fixGate.eligible)
    diagnostics.corpVisibleTagPunishUnknownSkipFixGateEligible = true;
  if (fixGate.blockedBy)
    diagnostics.corpVisibleTagPunishUnknownSkipFixGateBlockedBy =
      fixGate.blockedBy;
}

function corpUnknownSkipChosenFamily(
  input: AiDecisionInput,
  action: LegalAction,
): CorpTagPunishUnknownChosenFamily {
  if (isCorpTraceTagSourceAction(input, action)) return "trace_tag_source";
  if (action.type === "score_agenda") return "score";
  if (action.type === "advance_card") return "advance";
  if (action.type === "rez_ice") return "rez";
  if (action.type === "play_operation") return "operation";
  if (
    action.type === "activated_card_ability" ||
    action.type === "trigger_ability"
  )
    return "ability";
  if (action.type === "draw_card") return "draw";
  if (action.type === "gain_credit") return "basic_credit";
  if (action.type === "end_turn") return "end_turn";
  if (action.type === "install_card") {
    const definitionId = sourceDefinitionIdForAction(input, action);
    const type =
      RUNTIME_CARDS[definitionId]?.type ?? DEMO_CARDS_BY_ID[definitionId]?.type;
    if (type === "agenda") return "install_agenda";
    if (type === "ice" || action.payload?.placement === "ice")
      return "install_ice";
    if (type === "asset" || type === "upgrade")
      return "install_asset_or_upgrade";
    return "unknown";
  }
  return "unknown";
}

function corpUnknownSkipAttribution(
  input: AiDecisionInput,
  action: LegalAction,
  decision: AiDecision,
  opportunities: Array<{
    action: LegalAction;
    kind: CorpPunishKind;
    category: CorpVisibleTagPayoffCategory;
    cardId: string | undefined;
  }>,
  chosenFamily: CorpTagPunishUnknownChosenFamily,
  survivalContext: ReturnType<typeof runnerSurvivalCounterContextForInput>,
): CorpTagPunishUnknownSkipAttribution {
  const text = `${decision.reasonCode} ${(decision.evidence ?? []).join(" ")}`;
  if (chosenFamily === "score" || text.includes("score_now"))
    return "unknown_skip_plausible_score_window";
  if (
    chosenFamily === "advance" ||
    text.includes("advance_to_score") ||
    text.includes("score_window")
  )
    return "unknown_skip_plausible_advance_to_score";
  if (
    text.includes("remote_safety") ||
    text.includes("unsafe_remote") ||
    text.includes("scoring_remote")
  )
    return "unknown_skip_plausible_remote_safety";
  if (
    text.includes("central") ||
    text.includes("protect_hq") ||
    text.includes("protect_rd") ||
    text.includes("hq_protection") ||
    text.includes("rnd_protection")
  )
    return "unknown_skip_plausible_hq_or_rnd_safety";
  if (
    text.includes("unaffordable") ||
    text.includes("cannot_afford") ||
    text.includes("insufficient_credits")
  )
    return "unknown_skip_plausible_payoff_unaffordable";
  if (survivalContext.damage || survivalContext.flatline)
    return "unknown_skip_plausible_survival_countercontext";
  if (
    text.includes("low_impact") ||
    opportunities.every((opportunity) =>
      ["unknown", "run_lock", "ambush"].includes(opportunity.category),
    )
  )
    return "unknown_skip_plausible_payoff_low_impact";
  if (chosenFamily === "basic_credit")
    return "unknown_skip_suspicious_basic_credit";
  if (chosenFamily === "end_turn") return "unknown_skip_suspicious_end_turn";
  if (
    chosenFamily === "install_asset_or_upgrade" ||
    chosenFamily === "install_ice" ||
    chosenFamily === "install_agenda"
  )
    return "unknown_skip_suspicious_low_value_install";
  if (
    chosenFamily === "operation" &&
    (text.includes("economy") || text.includes("setup"))
  )
    return "unknown_skip_suspicious_economy_or_setup";
  return "unknown_skip_unclassified_missing_evidence";
}

function corpUnknownSkipPlausibility(
  attribution: CorpTagPunishUnknownSkipAttribution,
): CorpTagPunishUnknownSkipPlausibility {
  if (attribution.startsWith("unknown_skip_plausible_")) return "plausible";
  if (attribution.startsWith("unknown_skip_suspicious_")) return "suspicious";
  return "unclassified";
}

function corpUnknownSkipFixGate(
  attribution: CorpTagPunishUnknownSkipAttribution,
  opportunities: Array<{
    category: CorpVisibleTagPayoffCategory;
  }>,
): {
  eligible: boolean;
  blockedBy?:
    | "score"
    | "advance_score"
    | "safety"
    | "affordability"
    | "low_impact";
} {
  switch (attribution) {
    case "unknown_skip_plausible_score_window":
      return { eligible: false, blockedBy: "score" };
    case "unknown_skip_plausible_advance_to_score":
      return { eligible: false, blockedBy: "advance_score" };
    case "unknown_skip_plausible_remote_safety":
    case "unknown_skip_plausible_hq_or_rnd_safety":
    case "unknown_skip_plausible_survival_countercontext":
      return { eligible: false, blockedBy: "safety" };
    case "unknown_skip_plausible_payoff_unaffordable":
      return { eligible: false, blockedBy: "affordability" };
    case "unknown_skip_plausible_payoff_low_impact":
      return { eligible: false, blockedBy: "low_impact" };
    case "unknown_skip_suspicious_basic_credit":
    case "unknown_skip_suspicious_end_turn":
    case "unknown_skip_suspicious_low_value_install":
    case "unknown_skip_suspicious_economy_or_setup":
      return {
        eligible: opportunities.some(
          (opportunity) => opportunity.category !== "unknown",
        ),
      };
    default:
      return { eligible: false };
  }
}

function corpUnknownSkipPayoffLethalOrNearLethal(
  input: AiDecisionInput,
  opportunities: Array<{ category: CorpVisibleTagPayoffCategory }>,
): boolean {
  return (
    opportunities.some((opportunity) => opportunity.category === "damage") &&
    input.playerView.opponent.handCount <= 3
  );
}

function applyCorpTagSourceWindowDiagnostics(
  diagnostics: Partial<AiSimulationSummary["actionSequence"][number]>,
  input: AiDecisionInput,
  action: LegalAction,
): void {
  const sourceDefinitionId = sourceDefinitionIdForAction(input, action);
  const sourceType =
    RUNTIME_CARDS[sourceDefinitionId]?.type ??
    DEMO_CARDS_BY_ID[sourceDefinitionId]?.type;
  const scoredAgenda = classifyCorpScoredAgendaAbility(input, action);
  if (scoredAgenda?.kind === "scored_agenda_trace_tag")
    diagnostics.corpTagCreatedByScoredAgendaAction = true;
  else if (action.type === "play_operation")
    diagnostics.corpTagCreatedByOperation = true;
  else if (sourceType === "asset")
    diagnostics.corpTagCreatedByAssetOrNode = true;
  else if (sourceType === "ice" || action.type === "rez_ice")
    diagnostics.corpTagCreatedByIce = true;
  if (action.type === "trigger_ability")
    diagnostics.corpTagCreatedByPersistentEffect = true;
}

function applyActualTagCreationDiagnostics(
  diagnostics: Partial<AiSimulationSummary["actionSequence"][number]>,
  input: AiDecisionInput,
  action: LegalAction,
  decision: AiDecision,
  stateBeforeAction: GameState,
): void {
  if (input.side === "runner") {
    diagnostics.corpTagCreatedDuringRunnerTurn = true;
    if (
      stateBeforeAction.run ||
      action.type === "resolve_choice" ||
      decision.reasonCode.includes("trace")
    ) {
      diagnostics.corpTagCreatedDuringEncounter = true;
      diagnostics.corpTagCreatedByTraceSuccess = true;
    }
    if (
      action.type === "access_card" ||
      action.type === "steal_agenda" ||
      action.type === "trash_accessed_card" ||
      action.type === "decline_trash"
    )
      diagnostics.corpTagCreatedByAccessOrSteal = true;
    return;
  }
  if (input.side !== "corp") return;
  diagnostics.corpTagCreatedDuringCorpTurn = true;
  applyCorpTagSourceWindowDiagnostics(diagnostics, input, action);
}

function runnerSurvivalCounterContextForInput(input: AiDecisionInput): {
  any: boolean;
  trace: boolean;
  damage: boolean;
  flatline: boolean;
  link: boolean;
} {
  const visibleRunnerCards = input.playerView.opponent.rig ?? [];
  const definitionIds = new Set(
    visibleRunnerCards
      .filter((card) => card.known)
      .map((card) => card.definitionId)
      .filter((definitionId): definitionId is string => Boolean(definitionId)),
  );
  const trace = [...definitionIds].some((definitionId) =>
    RUNNER_TRACE_DEFENSE_CONTEXT_IDS.has(definitionId),
  );
  const damage = [...definitionIds].some((definitionId) =>
    RUNNER_DAMAGE_PREVENTION_CONTEXT_IDS.has(definitionId),
  );
  const flatline = [...definitionIds].some((definitionId) =>
    RUNNER_FLATLINE_PREVENTION_CONTEXT_IDS.has(definitionId),
  );
  return {
    any: trace || damage || flatline,
    trace,
    damage,
    flatline,
    link: trace,
  };
}

function tagSourceConvertsToTaggedCorpDecision(
  sequence: AiSimulationSummary["actionSequence"],
  index: number,
): boolean {
  return sequence
    .slice(index + 1, index + 12)
    .some(
      (entry) =>
        entry.side === "corp" && entry.runnerTaggedAtCorpDecision === true,
    );
}

function tagSourceConvertsToVisibleLegalPayoffWindow(
  sequence: AiSimulationSummary["actionSequence"],
  index: number,
): boolean {
  return sequence
    .slice(index + 1, index + 12)
    .some(
      (entry) =>
        entry.side === "corp" &&
        ((entry.corpVisibleTagPunishLegalActions ?? 0) > 0 ||
          entry.corpPunishOpportunity === true),
    );
}

function previousFunnelSourceBefore(
  sequence: AiSimulationSummary["actionSequence"],
  index: number,
): boolean {
  return sequence
    .slice(Math.max(0, index - 12), index)
    .some(
      (entry) =>
        entry.corpTagSourceTaken === true ||
        entry.corpFunnelSourceActionTakenWithPayoffInDeck === true ||
        entry.corpFunnelSourceActionTakenWithVisiblePayoff === true,
    );
}

function previousRunnerTurnTagBefore(
  sequence: AiSimulationSummary["actionSequence"],
  index: number,
): boolean {
  return sequence
    .slice(Math.max(0, index - 12), index)
    .some((entry) => entry.corpTagCreatedDuringRunnerTurn === true);
}

function previousEncounterTagBefore(
  sequence: AiSimulationSummary["actionSequence"],
  index: number,
): boolean {
  return sequence
    .slice(Math.max(0, index - 12), index)
    .some((entry) => entry.corpTagCreatedDuringEncounter === true);
}

function strongestCorpTagSourceOpportunity(
  input: AiDecisionInput,
): { action: LegalAction; traceTag: boolean } | undefined {
  if (input.side !== "corp") return undefined;
  const opportunity = input.legalActions.find((action) =>
    isCorpTagSourceAction(input, action),
  );
  if (!opportunity) return undefined;
  return {
    action: opportunity,
    traceTag: isCorpTraceTagSourceAction(input, opportunity),
  };
}

function corpPunishKindForAction(
  input: AiDecisionInput,
  action: LegalAction,
): CorpPunishKind | undefined {
  if (input.side !== "corp") return undefined;
  const ontology = corpTagPunishOntologyAssessmentForAction(input, action);
  if (ontology?.isPunishPayoff)
    return corpPunishKindFromOntologyPayoff(ontology.payoffKind);
  if (action.type === "trash_resource") return "resource_trash_like";
  const scoredAgenda = classifyCorpScoredAgendaAbility(input, action);
  if (scoredAgenda?.kind === "scored_agenda_damage_punish")
    return "scored_agenda_damage_like";
  if (scoredAgenda?.kind === "scored_agenda_trace_tag")
    return "scored_agenda_trace_tag_like";
  const sourceDefinitionId = sourceDefinitionIdForAction(input, action);
  if (SCORCHED_EARTH_LIKE_PUNISH_IDS.has(sourceDefinitionId))
    return "scorched_earth_like";
  if (URBAN_RENEWAL_LIKE_PUNISH_IDS.has(sourceDefinitionId))
    return "urban_renewal_like";
  if (PUNITIVE_COUNTERSTRIKE_LIKE_PUNISH_IDS.has(sourceDefinitionId))
    return "punitive_counterstrike_like";
  if (CLOSED_ACCOUNTS_LIKE_PUNISH_IDS.has(sourceDefinitionId))
    return "closed_accounts_like";
  if (POWER_GRID_OVERLOAD_LIKE_PUNISH_IDS.has(sourceDefinitionId))
    return "power_grid_overload_like";
  if (DATAPOOL_LIKE_PUNISH_IDS.has(sourceDefinitionId)) return "datapool_like";
  const roles = rolesForAction(input, action);
  if (roles.includes("tag_punishment")) return "unknown";
  return undefined;
}

function isCorpTagSourceAction(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  const ontology = corpTagPunishOntologyAssessmentForAction(input, action);
  if (ontology?.isTagSource) return true;
  const scoredAgenda = classifyCorpScoredAgendaAbility(input, action);
  if (scoredAgenda?.kind === "scored_agenda_trace_tag") return true;
  const sourceDefinitionId = sourceDefinitionIdForAction(input, action);
  if (CORP_TAG_SOURCE_IDS.has(sourceDefinitionId)) return true;
  const roles = rolesForAction(input, action);
  return roles.some(
    (role) =>
      role.includes("tag_source") ||
      role.includes("tag_enabler") ||
      role.includes("trace_tag"),
  );
}

function isCorpTraceTagSourceAction(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  const ontology = corpTagPunishOntologyAssessmentForAction(input, action);
  if (ontology?.isTraceTagSource) return true;
  const scoredAgenda = classifyCorpScoredAgendaAbility(input, action);
  if (scoredAgenda?.kind === "scored_agenda_trace_tag") return true;
  const sourceDefinitionId = sourceDefinitionIdForAction(input, action);
  if (CORP_TRACE_TAG_SOURCE_IDS.has(sourceDefinitionId)) return true;
  return rolesForAction(input, action).some((role) => role.includes("trace"));
}

function corpTagPunishOntologyAssessmentForAction(
  input: AiDecisionInput,
  action: LegalAction,
) {
  if (input.side !== "corp" || action.side !== "corp") return undefined;
  const scoredAgenda = classifyCorpScoredAgendaAbility(input, action);
  return classifyTagPunishLegalActionFromOntology(
    action,
    sourceDefinitionIdForAction(input, action),
    {
      runnerTagged: input.playerView.opponent.tags > 0,
      legacyRoles: rolesForAction(input, action),
      scoredAgendaKind:
        scoredAgenda?.kind === "scored_agenda_trace_tag"
          ? "trace_tag"
          : scoredAgenda?.kind === "scored_agenda_damage_punish"
            ? "damage_punish"
            : undefined,
    },
  );
}

function semanticRuntimeCorpRemoteScoreContestabilityAssessment(
  input: AiDecisionInput,
  action: LegalAction,
): CorpRemoteContestabilityAssessment | undefined {
  if (input.side !== "corp" || action.side !== "corp") return undefined;
  if (action.type !== "advance_card" && action.type !== "install_card")
    return undefined;
  if (
    action.type === "install_card" &&
    (action.payload?.placement === "ice" ||
      !semanticRuntimeCorpActionIsScoreLine(input, action))
  )
    return undefined;
  if (semanticRuntimeCorpAdvanceCompletesScore(input, action))
    return undefined;
  const serverId = semanticRuntimeCorpActionServerId(input, action);
  if (!serverId || !isRemoteServerTarget(serverId)) return undefined;
  const server = semanticRuntimeCorpServer(input, serverId);
  if (!semanticRuntimeCorpRemoteIsProtected(server)) return undefined;
  const assessment = semanticRuntimeCorpRemoteContestabilityAssessment(
    input,
    serverId,
  );
  if (!assessment?.contestable) return undefined;
  return {
    ...assessment,
    evidence: [
      "corp_remote_score_line:contestable_by_runner",
      `action_type:${action.type}`,
      ...assessment.evidence,
    ],
  };
}

function semanticRuntimeCorpRemoteContestabilityAssessment(
  input: AiDecisionInput,
  serverId: string,
): CorpRemoteContestabilityAssessment | undefined {
  if (input.side !== "corp" || !isRemoteServerTarget(serverId)) return undefined;
  const server = semanticRuntimeCorpServer(input, serverId);
  if (!server || server.ice.length === 0) return undefined;
  const runnerRig = input.playerView.opponent.rig ?? [];
  const assessment = assessKnownRezzedIcePath(
    server.ice,
    runnerRig,
    input.playerView.opponent.credits,
    server.root,
  );
  if (assessment.assessedKnownIceCount <= 0) return undefined;
  const contestable =
    assessment.canReachAccess === true && assessment.creditsAfterPath >= 0;
  return {
    serverId,
    contestable,
    evidence: [
      `server:${serverId}`,
      `remote_contestable_by_runner:${contestable}`,
      `runner_credits:${input.playerView.opponent.credits}`,
      `runner_visible_rig_count:${runnerRig.length}`,
      `assessed_known_ice_count:${assessment.assessedKnownIceCount}`,
      `can_reach_access:${assessment.canReachAccess}`,
      `credits_after_path:${assessment.creditsAfterPath}`,
      ...(assessment.visibleBreakCost !== undefined
        ? [`visible_break_cost:${assessment.visibleBreakCost}`]
        : []),
      ...(assessment.noAccessReason
        ? [`no_access_reason:${assessment.noAccessReason}`]
        : []),
    ],
  };
}

function semanticRuntimeCorpCentralRezReserveAssessment(
  input: AiDecisionInput,
  action: LegalAction,
): CorpCentralRezReserveAssessment | undefined {
  if (input.side !== "corp" || action.side !== "corp") return undefined;
  if (action.type !== "install_card" || action.payload?.placement !== "ice")
    return undefined;
  const serverId = semanticRuntimeCorpActionServerId(input, action);
  if (serverId !== "hq") return undefined;
  if (!semanticRuntimeCorpHasAgendaInHq(input)) return undefined;
  const sourceDefinitionId = sourceDefinitionIdForAction(input, action);
  if (!sourceDefinitionId) return undefined;
  const rezFloor = semanticRuntimeCorpActionIceRezCost(input, action);
  if (rezFloor <= 0) return undefined;
  const creditsAfterAction =
    input.playerView.own.credits - actionCreditCost(action);
  const blockedByFloor = creditsAfterAction < rezFloor;
  return {
    serverId: "hq",
    sourceDefinitionId,
    rezFloor,
    creditsAfterAction,
    blockedByFloor,
    evidence: [
      "corp_central_rez_floor:true",
      "corp_hq_agenda_exposure:true",
      `central_rez_floor_server:${serverId}`,
      `source_definition:${sourceDefinitionId}`,
      `central_rez_floor:${rezFloor}`,
      `credits_after_action:${creditsAfterAction}`,
      `central_rez_reserve_below_floor:${blockedByFloor}`,
    ],
  };
}

function semanticRuntimeCorpActionIceRezCost(
  input: AiDecisionInput,
  action: LegalAction,
): number {
  const sourceCard = semanticRuntimeCorpActionSourceCard(input, action);
  const sourceDefinitionId =
    sourceCard?.definitionId ?? sourceDefinitionIdForAction(input, action);
  return (
    sourceCard?.rezCost ??
    (sourceDefinitionId
      ? (RUNTIME_CARDS[sourceDefinitionId]?.numeric.rezCost ??
        DEMO_CARDS_BY_ID[sourceDefinitionId]?.rezCost)
      : undefined) ??
    0
  );
}

function semanticRuntimeCorpHasAgendaInHq(input: AiDecisionInput): boolean {
  return input.playerView.own.gripOrHq.some(
    (card) => card.known && card.type === "agenda",
  );
}

function semanticRuntimeCorpHasCentralRezFloorFundingNeed(
  input: AiDecisionInput,
): boolean {
  if (input.side !== "corp") return false;
  return input.legalActions.some((action) => {
    const assessment = semanticRuntimeCorpCentralRezReserveAssessment(
      input,
      action,
    );
    return assessment?.blockedByFloor === true;
  });
}

function corpTaggedRunnerPayoffPressure(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  const immediateTagSource = corpImmediateTagSourceVisiblePayoffProfile(
    input,
    action,
  );
  if (immediateTagSource) {
    return {
      key: "corp_tag_source_visible_payoff_pressure",
      label: "Sofortiger Tag-Source",
      value: immediateTagSource.value,
      reason: immediateTagSource.evidence.join("|"),
    };
  }
  const installedEconomy = corpInstalledEconomyActionProfile(input, action);
  if (installedEconomy) {
    return {
      key: "corp_card_action_economy_gain",
      label: "Installierte Corp-Economy",
      value: installedEconomy.value,
      reason: installedEconomy.evidence.join("|"),
    };
  }
  const funding = corpTagPunishPayoffFundingProfile(input, action);
  if (funding) {
    return {
      key: "corp_tag_punish_payoff_funding",
      label: "Tag-Punish-Funding",
      value: funding.value,
      reason: funding.evidence.join("|"),
    };
  }
  const profile = corpTaggedRunnerPayoffProfile(input, action);
  if (!profile) return undefined;
  return {
    key:
      profile.kind === "damage"
        ? "corp_tagged_meat_damage_payoff_pressure"
        : "corp_tagged_runner_payoff_pressure",
    label: "Tagged-Runner-Payoff",
    value: profile.value,
    reason: [
      "corp_tagged_runner_payoff:true",
      "corp_tagged_payoff_followup_plan:active",
      ...profile.evidence,
    ].join("|"),
  };
}

function corpTaggedPayoffWindowPassiveActionPenalty(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  if (input.side !== "corp" || action.side !== "corp") return undefined;
  const tagSourceAvailable = corpImmediateTagSourceAvailable(input, action);
  if (tagSourceAvailable && corpUnprotectedPersistentTagAssetSetup(input, action)) {
    return {
      key: "corp_unprotected_tag_asset_setup_penalty",
      label: "Ungeschuetzter Tag-Asset-Aufbau",
      value: -1800,
      reason: [
        "immediate_operation_tag_source_available:true",
        "unprotected_tag_asset_setup:true",
      ].join("|"),
    };
  }
  if (input.playerView.opponent.tags <= 0) return undefined;
  if (corpTaggedRunnerPayoffProfile(input, action)) return undefined;
  if (
    action.type === "score_agenda" ||
    semanticRuntimeCorpAdvanceCompletesScore(input, action)
  )
    return undefined;
  const availablePayoff = corpBestTaggedRunnerPayoffProfile(
    input,
    action.actionId,
  );
  const visibleMeatPayoff = corpVisibleMeatDamagePayoff(input);
  if (!availablePayoff && !visibleMeatPayoff) return undefined;
  let passiveKind: string | undefined;
  let value = 0;
  let key = "corp_tagged_payoff_window_passive_penalty";
  if (action.type === "gain_credit") {
    passiveKind = "basic_economy";
    value = -1100;
  } else if (
    action.type === "activated_card_ability" &&
    Number(action.payload?.cardImplementationCreditAmount ?? 0) > 0
  ) {
    passiveKind = "card_economy";
    value = -1050;
  } else if (action.type === "draw_card") {
    passiveKind = "draw";
    value = -900;
  } else if (action.type === "install_card") {
    if (semanticRuntimeCorpActionIsScoreLine(input, action)) return undefined;
    passiveKind = "install_setup";
    value = input.playerView.opponent.tags >= 7 ? -1800 : -800;
    key =
      input.playerView.opponent.tags >= 7 || visibleMeatPayoff
        ? "corp_tag_punish_endgame_slow_setup_penalty"
        : key;
  } else if (action.type === "rez_ice") {
    passiveKind = "rez_setup";
    value = tagSourceAvailable ? -1800 : -650;
    key = tagSourceAvailable ? "corp_unprotected_tag_asset_setup_penalty" : key;
  } else if (action.type === "end_turn") {
    passiveKind = "end_turn";
    value = -1200;
  }
  if (!passiveKind || value >= 0) return undefined;
  return {
    key,
    label: "Tagged-Payoff-Fenster nicht verpassen",
    value,
    reason: [
      `passive_kind:${passiveKind}`,
      `runner_tags:${input.playerView.opponent.tags}`,
      ...(availablePayoff
        ? [
            `available_tagged_payoff_kind:${availablePayoff.kind}`,
            ...availablePayoff.evidence,
          ]
        : []),
      ...(visibleMeatPayoff ? ["corp_visible_meat_damage_payoff:true"] : []),
      ...(tagSourceAvailable
        ? ["immediate_operation_tag_source_available:true"]
        : []),
    ].join("|"),
  };
}

function corpBestTaggedRunnerPayoffProfile(
  input: AiDecisionInput,
  excludedActionId?: string,
): CorpTaggedRunnerPayoffActionProfile | undefined {
  return input.legalActions
    .filter((action) => action.actionId !== excludedActionId)
    .map((action) => corpTaggedRunnerPayoffProfile(input, action))
    .filter(
      (profile): profile is CorpTaggedRunnerPayoffActionProfile =>
        profile !== undefined,
    )
    .sort((left, right) => right.value - left.value)[0];
}

function corpTaggedRunnerPayoffProfile(
  input: AiDecisionInput,
  action: LegalAction,
): CorpTaggedRunnerPayoffActionProfile | undefined {
  if (input.side !== "corp" || action.side !== "corp") return undefined;
  const runnerTags = input.playerView.opponent.tags;
  if (runnerTags <= 0) return undefined;
  if (action.type === "trash_resource") {
    const target = corpVisibleRunnerRigTrashTarget(input, action);
    if (!target?.definitionId) return undefined;
    const storedCredits = corpVisibleCardStoredCredits(target);
    const specialEvidence = corpVisibleRunnerResourceTrashEvidence(
      input,
      target,
    );
    return {
      kind: "resource_trash",
      value:
        1350 +
        Math.min(500, runnerTags * 85) +
        Math.min(420, storedCredits * 60) +
        specialEvidence.valueBonus,
      evidence: [
        "tagged_payoff_kind:resource_trash",
        `runner_tags:${runnerTags}`,
        `target_definition:${target.definitionId}`,
        `stored_credits:${storedCredits}`,
        ...(storedCredits > 0
          ? ["runner_resource_credit_bank_visible:true"]
          : []),
        ...specialEvidence.evidence,
      ],
    };
  }
  const assessment = corpTagPunishOntologyAssessmentForAction(input, action);
  if (!assessment?.isPunishPayoff) return undefined;
  const sourceDefinitionId = sourceDefinitionIdForAction(input, action);
  const affordabilityPressure =
    input.playerView.own.credits >= actionCreditCost(action) ? 0 : -400;
  if (
    assessment.payoffKind === "damage" ||
    assessment.payoffKind === "scored_agenda_damage_like"
  ) {
    return {
      kind: "damage",
      value: 2550 + Math.min(700, runnerTags * 90) + affordabilityPressure,
      evidence: [
        "tagged_payoff_kind:damage",
        "corp_tagged_meat_damage_payoff:true",
        `runner_tags:${runnerTags}`,
        `source_definition:${sourceDefinitionId || "unknown"}`,
        ...corpVisibleRunnerDamagePreventionEvidence(input),
        ...assessment.evidence,
      ],
    };
  }
  if (assessment.payoffKind === "economic") {
    const runnerCreditPressure =
      input.playerView.opponent.credits <= 2
        ? 300
        : input.playerView.opponent.credits <= 5
          ? 150
          : 0;
    return {
      kind: "economic",
      value:
        1850 +
        Math.min(420, runnerTags * 70) +
        runnerCreditPressure +
        affordabilityPressure,
      evidence: [
        "tagged_payoff_kind:economic",
        `runner_tags:${runnerTags}`,
        `runner_credits:${input.playerView.opponent.credits}`,
        `source_definition:${sourceDefinitionId || "unknown"}`,
        ...assessment.evidence,
      ],
    };
  }
  if (assessment.payoffKind === "hardware_trash") {
    const visibleHardwareTarget = corpVisibleRunnerHardwareTrashTarget(input);
    return {
      kind: "hardware_trash",
      value: 1800 + Math.min(420, runnerTags * 70) + affordabilityPressure,
      evidence: [
        "tagged_payoff_kind:hardware_trash",
        `runner_tags:${runnerTags}`,
        `source_definition:${sourceDefinitionId || "unknown"}`,
        ...assessment.evidence,
        ...(visibleHardwareTarget
          ? corpVisibleRunnerHardwarePayoffEvidence(visibleHardwareTarget)
          : []),
      ],
    };
  }
  if (assessment.payoffKind === "resource_trash") {
    const target = corpVisibleRunnerRigTrashTarget(input, action);
    return {
      kind: "resource_trash",
      value: 1500 + Math.min(420, runnerTags * 70) + affordabilityPressure,
      evidence: [
        "tagged_payoff_kind:resource_trash",
        `runner_tags:${runnerTags}`,
        `source_definition:${sourceDefinitionId || "unknown"}`,
        ...assessment.evidence,
        ...(target?.definitionId ? [`target_definition:${target.definitionId}`] : []),
      ],
    };
  }
  return {
    kind: "unknown",
    value: 1150 + Math.min(300, runnerTags * 60) + affordabilityPressure,
    evidence: [
      "tagged_payoff_kind:unknown",
      `runner_tags:${runnerTags}`,
      `source_definition:${sourceDefinitionId || "unknown"}`,
      ...assessment.evidence,
    ],
  };
}

function corpInstalledEconomyActionProfile(
  input: AiDecisionInput,
  action: LegalAction,
): CorpTaggedRunnerPayoffActionProfile | undefined {
  if (
    input.side !== "corp" ||
    action.side !== "corp" ||
    action.type !== "activated_card_ability"
  )
    return undefined;
  const creditAmount = corpInstalledEconomyCreditAmount(action);
  if (!Number.isFinite(creditAmount) || creditAmount <= 0) return undefined;
  const sourceDefinitionId = sourceDefinitionIdForAction(input, action);
  if (sourceDefinitionId !== "onr_v1_309_bbs-whispering-campaign")
    return undefined;
  const sourceCard = semanticRuntimeCorpActionSourceCard(input, action);
  const storedCredits = sourceCard ? corpVisibleCardStoredCredits(sourceCard) : 0;
  return {
    kind: "installed_economy",
    value: 1050 + creditAmount * 260 + Math.min(420, storedCredits * 18),
    evidence: [
      "installed_corp_economy:true",
      "installed_corp_economy_kind:pool_payout",
      `installed_corp_economy_immediate_gain:${creditAmount}`,
      `installed_corp_economy_stored_credits:${storedCredits}`,
    ],
  };
}

function corpTagPunishPayoffFundingProfile(
  input: AiDecisionInput,
  action: LegalAction,
): CorpTaggedRunnerPayoffActionProfile | undefined {
  if (
    input.side !== "corp" ||
    action.side !== "corp" ||
    action.type !== "gain_credit" ||
    action.source !== "basic_action" ||
    input.playerView.opponent.tags < 7
  )
    return undefined;
  if (!corpVisibleMeatDamagePayoff(input)) return undefined;
  return {
    kind: "funding",
    value: input.playerView.opponent.tags >= 7 ? 1150 : 550,
    evidence: [
      "corp_tag_punish_payoff_funding:true",
      "corp_visible_meat_damage_payoff:true",
      `runner_tags:${input.playerView.opponent.tags}`,
    ],
  };
}

function corpImmediateTagSourceVisiblePayoffProfile(
  input: AiDecisionInput,
  action: LegalAction,
): CorpTaggedRunnerPayoffActionProfile | undefined {
  if (!corpImmediateTagSourceAction(input, action)) return undefined;
  const payoffKind = corpVisibleTagPunishPayoffKind(input);
  if (!payoffKind) return undefined;
  return {
    kind: "tag_source",
    value: payoffKind === "damage" ? 2350 : 1750,
    evidence: [
      "corp_tag_source_visible_payoff_pressure:true",
      `corp_visible_tag_punish_payoff_kind:${payoffKind}`,
      "immediate_operation_tag_source_available:true",
    ],
  };
}

function corpImmediateTagSourceAvailable(
  input: AiDecisionInput,
  excludedAction?: LegalAction,
): boolean {
  return input.legalActions.some(
    (action) =>
      action.actionId !== excludedAction?.actionId &&
      corpImmediateTagSourceAction(input, action),
  );
}

function corpImmediateTagSourceAction(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  return (
    input.side === "corp" &&
    action.side === "corp" &&
    action.type === "play_operation" &&
    sourceDefinitionIdForAction(input, action) ===
      "onr_v1_284_chance-observation"
  );
}

function corpUnprotectedPersistentTagAssetSetup(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  const sourceDefinitionId = sourceDefinitionIdForAction(input, action);
  if (sourceDefinitionId !== "onr_v1_313_city-surveillance") return false;
  return action.type === "install_card" || action.type === "rez_ice";
}

function corpVisibleTagPunishPayoffKind(
  input: AiDecisionInput,
): "damage" | "economic" | "trash" | undefined {
  if (corpVisibleMeatDamagePayoff(input)) return "damage";
  if (
    input.playerView.own.gripOrHq.some(
      (card) => card.definitionId === "onr_v1_285_closed-accounts",
    )
  )
    return "economic";
  return undefined;
}

function corpVisibleMeatDamagePayoff(input: AiDecisionInput): boolean {
  const ownVisibleCards = [
    ...input.playerView.own.gripOrHq,
    ...input.playerView.own.scoreArea,
    ...input.playerView.servers.flatMap((server) => [
      ...server.ice,
      ...server.root,
    ]),
  ];
  return ownVisibleCards.some((card) =>
    [
      "onr_v1_302_scorched-earth",
      "onr_v1_339_schlaghund",
      "onr_v1_307_urban-renewal",
    ].includes(card.definitionId ?? ""),
  );
}

function corpVisibleRunnerDamagePreventionEvidence(
  input: AiDecisionInput,
): string[] {
  const rig = input.playerView.opponent.rig ?? [];
  const fullBodyConversion = rig.some(
    (card) => card.definitionId === "onr_v1_127_full-body-conversion",
  );
  const dermatech = rig.some(
    (card) => card.definitionId === "onr_v1_125_dermatech-bodyplating",
  );
  return [
    ...(fullBodyConversion
      ? ["runner_full_body_conversion_visible:true"]
      : []),
    ...(dermatech ? ["runner_dermatech_bodyplating_visible:true"] : []),
    ...(fullBodyConversion || dermatech ? ["prevention_pressure:true"] : []),
  ];
}

function corpVisibleRunnerResourceTrashEvidence(
  input: AiDecisionInput,
  target: VisibleCard,
): { valueBonus: number; evidence: string[] } {
  if (target.definitionId === "onr_v1_160_diplomatic-immunity") {
    return {
      valueBonus: 700,
      evidence: [
        "corp_tagged_damage_prevention_resource_trash",
        "runner_resource_diplomatic_immunity:true",
        "cancel_blocked:true",
        ...(corpVisibleMeatDamagePayoff(input)
          ? ["corp_visible_meat_damage_payoff:true"]
          : []),
      ],
    };
  }
  if (target.definitionId === "onr_v1_182_submarine-uplink") {
    return {
      valueBonus: input.playerView.opponent.tags >= 7 ? 850 : 250,
      evidence: [
        "corp_tag_punish_endgame_resource_trash",
        "runner_resource_trace_defense_visible:true",
        ...(input.playerView.opponent.tags >= 7
          ? ["tag_punish_endgame_active:true"]
          : []),
      ],
    };
  }
  return { valueBonus: 0, evidence: [] };
}

function corpOntologyPayoffAvailableForTagSource(
  input: AiDecisionInput,
  sourceAction: LegalAction,
): boolean {
  if (input.side !== "corp") return false;
  if (
    input.legalActions.some((action) => {
      if (action.actionId === sourceAction.actionId) return false;
      return corpTagPunishOntologyAssessmentForAction(input, action)
        ?.isPunishPayoff;
    })
  )
    return true;
  return [
    ...input.playerView.own.gripOrHq,
    ...input.playerView.own.scoreArea,
    ...input.playerView.servers.flatMap((server) => [
      ...server.ice,
      ...server.root,
    ]),
  ].some((card) =>
    Boolean(
      card.known &&
      card.definitionId &&
      classifyTagPunishPayoffFromOntology(card.definitionId),
    ),
  );
}

function corpTagPunishSkipReason(
  action: LegalAction,
  decision: AiDecision,
): CorpTagPunishSkipReason {
  const reason = decision.reasonCode;
  if (
    action.type === "gain_credit" ||
    reason.includes("recover_economy") ||
    reason.includes("economy")
  )
    return "economy";
  if (
    action.type === "rez_ice" ||
    (action.type === "install_card" && action.payload?.placement === "ice") ||
    reason.includes("protect")
  ) {
    if (reason.includes("remote") || reason.includes("scoring"))
      return "remote_protection";
    if (
      reason.includes("central") ||
      reason.includes("hq") ||
      reason.includes("rd") ||
      reason.includes("archives")
    )
      return "central_protection";
    return "protection";
  }
  if (action.type === "score_agenda" || reason.includes("score"))
    return "score";
  if (action.type === "advance_card" || reason.includes("advance"))
    return "advance";
  if (reason.includes("remote_safety") || reason.includes("unsafe_remote"))
    return "remote_protection";
  if (action.type === "draw_card" || reason.includes("draw")) return "draw";
  if (action.type === "install_card" || reason.includes("install"))
    return "install";
  if (action.type === "end_turn") return "end_turn";
  return "unknown_higher_priority";
}

function rolesForAction(input: AiDecisionInput, action: LegalAction): string[] {
  return rolesForActionRuntime(input, action, {
    findVisibleCard,
    rolesForCardId,
  });
}

function rolesForCardId(cardId: string | undefined): string[] {
  return cardRolesForId(cardId, AI_HINTS);
}

function pumpViabilityAssessment(
  input: AiDecisionInput,
  action: LegalAction,
): { canLeadToBreak: boolean; evidence: string[] } {
  const breaker = findVisibleCard(input, action.source);
  const encounteredIce = input.playerView.run?.encounteredIce;
  if (!breaker?.definitionId || !encounteredIce?.definitionId)
    return { canLeadToBreak: true, evidence: [] };
  if (
    !canBreakerDefinitionBreakIce(
      breaker.definitionId,
      encounteredIce.definitionId,
    )
  )
    return {
      canLeadToBreak: false,
      evidence: ["pump_cannot_break_encountered_ice:true"],
    };

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
  if (directBreakIsLegal)
    return {
      canLeadToBreak: false,
      evidence: ["pump_direct_break_already_legal:true"],
    };

  const encounterContinue = input.legalActions.find(
    (candidate) =>
      candidate.type === "continue_run" &&
      candidate.payload?.encounterContinue === true,
  );
  if (encounterContinue?.payload?.unbrokenSubroutineCount === 0)
    return {
      canLeadToBreak: false,
      evidence: ["pump_no_unbroken_subroutines:true"],
    };
  if (
    typeof breaker.strength === "number" &&
    typeof encounteredIce.strength === "number" &&
    breaker.strength >= encounteredIce.strength
  )
    return {
      canLeadToBreak: false,
      evidence: ["pump_strength_already_sufficient:true"],
    };

  const endTheRunCount = endTheRunSubroutineCount(encounteredIce.definitionId);
  const runEffect = encounterRunRemainderEffectAssessment(input);
  const hasUsefulRunRemainderEffect =
    runEffect.hasRunRemainderEffect &&
    (runEffect.mustBreak ||
      runEffect.futurePathBlocked ||
      runEffect.futureCostDelta > 0);
  const hasImmediateThreat = encounterHasImmediateUnbrokenThreat(input);
  if (
    endTheRunCount === 0 &&
    !hasUsefulRunRemainderEffect &&
    !hasImmediateThreat
  ) {
    return {
      canLeadToBreak: false,
      evidence: [
        "pump_cannot_lead_to_useful_break:true",
        ...runEffect.evidence,
      ],
    };
  }

  const pumpCost = actionCreditCost(action);
  const pumpAmount = pumpStrengthAmountForAction(action, breaker.definitionId);
  if (pumpCost < 0 || pumpAmount <= 0)
    return {
      canLeadToBreak: false,
      evidence: ["pump_cannot_reach_break_strength:true"],
    };
  const requiredStrength =
    encounteredIce.effectiveRunQuote?.effectiveStrength ??
    encounteredIce.strength ??
    cardDefinitionStrength(encounteredIce.definitionId);
  const missingStrength = Math.max(
    0,
    requiredStrength - (breaker.strength ?? 0),
  );
  const requiredPumps = Math.max(1, Math.ceil(missingStrength / pumpAmount));
  const totalPumpCost = requiredPumps * pumpCost;
  const remainingCreditsAfterPumps =
    input.playerView.own.credits - totalPumpCost;
  if (remainingCreditsAfterPumps < 0)
    return {
      canLeadToBreak: false,
      evidence: [
        "pump_cannot_reach_break_strength:true",
        `pump_required_count:${requiredPumps}`,
      ],
    };

  const estimatedBreakCost =
    endTheRunCount > 0 &&
    encounterContinue?.payload?.encounterWillEndRun === true
      ? creditsToBreakEndTheRunSubroutinesWithBreaker(
          breaker,
          encounteredIce,
          endTheRunCount,
          (breaker.strength ?? 0) + requiredPumps * pumpAmount,
        )?.cost
      : estimatedEncounterBreakCost(input, action);
  if (
    estimatedBreakCost === undefined ||
    estimatedBreakCost > remainingCreditsAfterPumps
  )
    return {
      canLeadToBreak: false,
      evidence: [
        "pump_cannot_lead_to_useful_break:true",
        `pump_required_count:${requiredPumps}`,
      ],
    };

  const creditsAfterPumpAndBreak =
    remainingCreditsAfterPumps - estimatedBreakCost;
  const run = input.playerView.run;
  const server =
    run?.position?.kind === "ice"
      ? input.playerView.servers.find(
          (candidate) => candidate.id === run.position?.serverId,
        )
      : undefined;
  if (server) {
    const currentQuote = currentEncounteredIceCard(input)?.effectiveRunQuote;
    const hasImmediateSafetyThreat =
      currentQuote?.subroutines.some(isImmediateSafetyThreatSubroutine) ??
      false;
    const futurePath = hasImmediateSafetyThreat
      ? {
          blocksPump: false,
          creditsAfterPath: creditsAfterPumpAndBreak,
          evidence: [] as string[],
        }
      : encounterFuturePathAfterPumpBreakAssessment(
          input,
          server,
          creditsAfterPumpAndBreak,
        );
    if (futurePath.blocksPump)
      return {
        canLeadToBreak: false,
        evidence: [
          ...futurePath.evidence,
          `pump_credits_after_break:${creditsAfterPumpAndBreak}`,
          `pump_required_count:${requiredPumps}`,
        ],
      };
    const remotePayoff = encounterRemotePayoffAfterBreakAssessment(
      input,
      server,
      currentQuote?.subroutines ?? [],
      futurePath.creditsAfterPath,
      0,
    );
    if (remotePayoff.blocksBreak)
      return {
        canLeadToBreak: false,
        evidence: [
          ...remotePayoff.evidence,
          `pump_credits_after_break:${creditsAfterPumpAndBreak}`,
          `pump_required_count:${requiredPumps}`,
        ],
      };
  }
  const reserveTarget = runnerCreditReserveTargetForInput(input);
  if (
    !runEffect.mustBreak &&
    !hasImmediateThreat &&
    creditsAfterPumpAndBreak < Math.max(2, reserveTarget - 1)
  ) {
    return {
      canLeadToBreak: false,
      evidence: [
        "pump_would_destroy_access_reserve:true",
        `pump_credits_after_break:${creditsAfterPumpAndBreak}`,
        `pump_reserve_target:${reserveTarget}`,
      ],
    };
  }

  return {
    canLeadToBreak: true,
    evidence: [
      "pump_can_reach_useful_break:true",
      `pump_required_count:${requiredPumps}`,
      ...runEffect.evidence,
    ],
  };
}

function encounterFuturePathAfterPumpBreakAssessment(
  input: AiDecisionInput,
  server: AiDecisionInput["playerView"]["servers"][number],
  creditsAfterPumpAndBreak: number,
): { blocksPump: boolean; creditsAfterPath: number; evidence: string[] } {
  const run = input.playerView.run;
  if (run?.position?.kind !== "ice")
    return {
      blocksPump: false,
      creditsAfterPath: creditsAfterPumpAndBreak,
      evidence: [],
    };
  const futureIce = server.ice.slice(0, Math.max(0, run.position.iceIndex));
  if (futureIce.length <= 0)
    return {
      blocksPump: false,
      creditsAfterPath: creditsAfterPumpAndBreak,
      evidence: [],
    };
  const pathAssessment = assessKnownRezzedIcePath(
    futureIce,
    input.playerView.own.rig ?? [],
    creditsAfterPumpAndBreak,
    server.root,
  );
  const pathEvidence = semanticRuntimeKnownIcePathReason(
    pathAssessment,
    server.id,
  );
  if (
    pathAssessment.assessedKnownIceCount > 0 &&
    !pathAssessment.canReachAccess
  )
    return {
      blocksPump: true,
      creditsAfterPath: pathAssessment.creditsAfterPath,
      evidence: ["pump_future_path_blocked_after_cost:true", pathEvidence],
    };
  return {
    blocksPump: false,
    creditsAfterPath: pathAssessment.creditsAfterPath,
    evidence: [pathEvidence],
  };
}

function encounterRunRemainderEffectAssessment(
  input: AiDecisionInput,
  action?: LegalAction,
): {
  hasRunRemainderEffect: boolean;
  mustBreak: boolean;
  futurePathBlocked: boolean;
  futureCostDelta: number;
  ignoredBecauseNoRemainingIce: boolean;
  remainingIceCount: number;
  remainingVisibleIceCount: number;
  paidConditionalPaymentRemediatesEffect: boolean;
  paidConditionalPaymentWithoutBeneficialEffect: boolean;
  evidence: string[];
} {
  const quote = currentEncounteredIceCard(input)?.effectiveRunQuote;
  const targetIndexes =
    action?.type === "break_subroutine" &&
    typeof action.payload?.subroutineIndex === "number"
      ? [action.payload.subroutineIndex]
      : (quote?.subroutines
          .map((subroutine, index) =>
            subroutine.unbrokenRunEffect ? index : undefined,
          )
          .filter((index): index is number => index !== undefined) ?? []);
  const effects = targetIndexes.flatMap((index) => {
    const effect = quote?.subroutines[index]?.unbrokenRunEffect;
    const subroutineType = quote?.subroutines[index]?.type;
    return effect ? [{ index, effect, subroutineType }] : [];
  });
  if (!quote || effects.length === 0) {
    return {
      hasRunRemainderEffect: false,
      mustBreak: false,
      futurePathBlocked: false,
      futureCostDelta: 0,
      ignoredBecauseNoRemainingIce: false,
      remainingIceCount: 0,
      remainingVisibleIceCount: 0,
      paidConditionalPaymentRemediatesEffect: false,
      paidConditionalPaymentWithoutBeneficialEffect: false,
      evidence: [],
    };
  }

  const payOrTrashProgramIndexes = parseSubroutineIndexes(
    action?.payload?.payOrTrashProgramSubroutineIndexes,
  );
  const payOrEndRunIndexes = parseSubroutineIndexes(
    action?.payload?.payOrEndRunSubroutineIndexes,
  );
  const payOrTrashProgramPayment = Number(
    action?.payload?.payOrTrashProgramSubroutinePayment ?? 0,
  );
  const payOrEndRunPayment = Number(
    action?.payload?.payOrEndRunSubroutinePayment ?? 0,
  );
  const hasInstalledPrograms = runnerHasInstalledPrograms(input);
  const actionableEffects = effects.filter(
    (entry) =>
      !(
        isTrashUnlessRunnerPaysSubroutine(entry.subroutineType) &&
        !hasInstalledPrograms
      ),
  );
  const remainingEffects = actionableEffects.filter((entry) => {
    if (
      isTrashUnlessRunnerPaysSubroutine(entry.subroutineType) &&
      Number.isFinite(payOrTrashProgramPayment) &&
      payOrTrashProgramPayment > 0 &&
      hasInstalledPrograms &&
      payOrTrashProgramIndexes.has(entry.index)
    )
      return false;
    if (
      entry.subroutineType === "end_the_run_unless_runner_pays" &&
      Number.isFinite(payOrEndRunPayment) &&
      payOrEndRunPayment > 0 &&
      payOrEndRunIndexes.has(entry.index)
    )
      return false;
    return true;
  });
  const paidConditionalPaymentRequested =
    (Number.isFinite(payOrTrashProgramPayment) &&
      payOrTrashProgramPayment > 0 &&
      payOrTrashProgramIndexes.size > 0) ||
    (Number.isFinite(payOrEndRunPayment) &&
      payOrEndRunPayment > 0 &&
      payOrEndRunIndexes.size > 0);
  const paidConditionalPaymentRemediatesEffect =
    paidConditionalPaymentRequested &&
    remainingEffects.length < actionableEffects.length;
  const paidConditionalPaymentWithoutBeneficialEffect =
    paidConditionalPaymentRequested && !paidConditionalPaymentRemediatesEffect;

  const remainingIce = currentRunRemainingIce(input);
  const remainingIceCount = remainingIce.length;
  const remainingVisibleIceCount = remainingIce.filter(
    (ice) => ice.known && ice.rezzed === true,
  ).length;
  const seriousNonCostRiskAfterAction = remainingEffects.some(
    ({ effect }) =>
      effect.causesDamageOrProgramTrash === true ||
      effect.preventsJackOut === true ||
      (effect.createsRunLockOrActionTax ?? 0) > 0,
  );
  const ignoredBecauseNoRemainingIce =
    remainingIceCount === 0 && !seriousNonCostRiskAfterAction;
  const basePath = currentRunFuturePathAssessment(input);
  const projectedPath = currentRunFuturePathAssessment(input, remainingEffects);
  const futureCostDelta = Math.max(
    0,
    (projectedPath.visibleBreakCost ?? 0) - (basePath.visibleBreakCost ?? 0),
  );
  const createsHardLock = remainingEffects.some(
    ({ effect }) => effect.preventsFutureBreaking === true,
  );
  const mustBreak =
    (!ignoredBecauseNoRemainingIce && projectedPath.blocked) ||
    (!ignoredBecauseNoRemainingIce &&
      createsHardLock &&
      currentRunHasFutureVisibleIce(input)) ||
    (seriousNonCostRiskAfterAction && !basePath.blocked);
  const evidence = [
    "run_remainder_subroutine_effect:true",
    `run_remainder_effect_subroutines:${effects.map(({ index }) => index).join(",")}`,
    `future_effect_remaining_ice:${remainingIceCount}`,
    `future_effect_remaining_visible_ice:${remainingVisibleIceCount}`,
    `future_path_blocked_if_unbroken:${projectedPath.blocked}`,
    `future_path_cost_delta_if_unbroken:${futureCostDelta}`,
    ...(ignoredBecauseNoRemainingIce
      ? ["unbroken_run_effect_ignored_because_no_remaining_ice:true"]
      : []),
    ...(!ignoredBecauseNoRemainingIce && remainingIceCount > 0
      ? ["unbroken_run_effect_applied_to_remaining_path:true"]
      : []),
    ...(remainingEffects.some(
      ({ effect }) => (effect.addsFutureEndTheRunSubroutines ?? 0) > 0,
    )
      ? ["adds_future_end_the_run_subroutines:true"]
      : []),
    ...(remainingEffects.some(
      ({ effect }) => (effect.increasesFutureBreakCostPerSubroutine ?? 0) > 0,
    )
      ? ["increases_future_break_cost:true"]
      : []),
    ...(remainingEffects.some(
      ({ effect }) => (effect.increasesFutureIceStrength ?? 0) > 0,
    )
      ? ["increases_future_ice_strength:true"]
      : []),
    ...(mustBreak ? ["run_remainder_effect_must_break:true"] : []),
  ];
  return {
    hasRunRemainderEffect:
      remainingEffects.length > 0 && !ignoredBecauseNoRemainingIce,
    paidConditionalPaymentRemediatesEffect,
    paidConditionalPaymentWithoutBeneficialEffect,
    mustBreak,
    futurePathBlocked: projectedPath.blocked,
    futureCostDelta,
    ignoredBecauseNoRemainingIce,
    remainingIceCount,
    remainingVisibleIceCount,
    evidence,
  };
}

function estimatedEncounterBreakCost(
  input: AiDecisionInput,
  action: LegalAction,
): number | undefined {
  const breakerId = breakerIdForEncounterAction(action);
  const targetIceId =
    typeof action.payload?.iceId === "string"
      ? action.payload.iceId
      : undefined;
  const currentBreakCosts = input.legalActions
    .filter(
      (candidate) =>
        candidate.type === "break_subroutine" &&
        breakerIdForEncounterAction(candidate) === breakerId &&
        (!targetIceId || candidate.payload?.iceId === targetIceId),
    )
    .map((candidate) => actionCreditCost(candidate));
  if (currentBreakCosts.length > 0) return Math.min(...currentBreakCosts);
  const breaker = findVisibleCard(input, action.source);
  if (!breaker?.definitionId) return 1;
  const abilityCosts =
    DEMO_CARDS_BY_ID[breaker.definitionId]?.abilities
      ?.filter((ability) => ability.type === "break_subroutine")
      .map((ability) =>
        typeof ability.cost?.credits === "number" ? ability.cost.credits : 1,
      ) ?? [];
  return abilityCosts.length > 0 ? Math.min(...abilityCosts) : 1;
}

function encounterBreakReserveContext(
  input: AiDecisionInput,
  action: LegalAction,
): { preserveReserve: boolean; evidence: string[] } {
  const reserveTarget = runnerCreditReserveTargetForInput(input);
  const creditsAfterBreak =
    input.playerView.own.credits - actionCreditCost(action);
  const preserveReserve = creditsAfterBreak < Math.max(2, reserveTarget - 1);
  return {
    preserveReserve,
    evidence: preserveReserve
      ? [
          "break_skipped_to_preserve_trash_reserve:true",
          `break_credits_after:${creditsAfterBreak}`,
          `break_reserve_target:${reserveTarget}`,
        ]
      : [],
  };
}

function currentRunFuturePathAssessment(
  input: AiDecisionInput,
  effects: Array<{
    effect: NonNullable<
      NonNullable<
        VisibleCard["effectiveRunQuote"]
      >["subroutines"][number]["unbrokenRunEffect"]
    >;
  }> = [],
): { blocked: boolean; visibleBreakCost?: number } {
  const run = input.playerView.run;
  if (!run || run.position?.kind !== "ice") return { blocked: false };
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === run.position?.serverId,
  );
  if (!server) return { blocked: false };
  const futureIce = server.ice
    .slice(0, Math.max(0, run.position.iceIndex))
    .map((ice) => projectFutureIceForUnbrokenEffects(ice, effects));
  const assessment = assessKnownRezzedIcePath(
    futureIce,
    input.playerView.own.rig ?? [],
    input.playerView.own.credits,
    server.root,
  );
  const encounterTax = effects.reduce((sum, { effect }) => {
    const perIce = Math.max(0, Math.floor(effect.addsFutureEncounterCost ?? 0));
    return (
      sum + perIce * futureIce.filter((ice) => ice.known && ice.rezzed).length
    );
  }, 0);
  const visibleBreakCost = (assessment.visibleBreakCost ?? 0) + encounterTax;
  return {
    blocked:
      assessment.blocked || visibleBreakCost > input.playerView.own.credits,
    ...(visibleBreakCost > 0 ? { visibleBreakCost } : {}),
  };
}

function projectFutureIceForUnbrokenEffects(
  ice: VisibleCard,
  effects: Array<{
    effect: NonNullable<
      NonNullable<
        VisibleCard["effectiveRunQuote"]
      >["subroutines"][number]["unbrokenRunEffect"]
    >;
  }>,
): VisibleCard {
  if (!ice.known || ice.rezzed !== true || !ice.definitionId) return ice;
  const quote = ice.effectiveRunQuote;
  const baseQuote: VisibleEffectiveIceRunQuote = quote ?? {
    iceInstanceId: ice.instanceId,
    iceDefinitionId: ice.definitionId,
    effectiveStrength: ice.strength ?? cardDefinitionStrength(ice.definitionId),
    subroutines:
      DEMO_CARDS_BY_ID[ice.definitionId]?.subroutines?.map((subroutine) => ({
        id: subroutine.id,
        type: subroutine.type,
        ...(subroutine.amount !== undefined
          ? { amount: subroutine.amount }
          : {}),
        ...(subroutine.breakTags
          ? { breakTags: subroutine.breakTags.slice() }
          : {}),
      })) ?? [],
  };
  let effectiveStrength = baseQuote.effectiveStrength;
  let breakSubroutineAdditionalCostPerSubroutine =
    baseQuote.breakSubroutineAdditionalCostPerSubroutine ?? 0;
  const subroutines = baseQuote.subroutines.map((subroutine) => ({
    ...subroutine,
  }));
  for (const { effect } of effects) {
    const addedEndTheRun = Math.max(
      0,
      Math.floor(effect.addsFutureEndTheRunSubroutines ?? 0),
    );
    for (let index = 0; index < addedEndTheRun; index += 1) {
      subroutines.push({
        id: `visible_projection.future_end_the_run.${index + 1}`,
        type: "end_the_run",
      });
    }
    effectiveStrength += Math.max(
      0,
      Math.floor(effect.increasesFutureIceStrength ?? 0),
    );
    breakSubroutineAdditionalCostPerSubroutine += Math.max(
      0,
      Math.floor(effect.increasesFutureBreakCostPerSubroutine ?? 0),
    );
  }
  return {
    ...ice,
    effectiveRunQuote: {
      ...baseQuote,
      effectiveStrength,
      subroutines,
      ...(breakSubroutineAdditionalCostPerSubroutine > 0
        ? { breakSubroutineAdditionalCostPerSubroutine }
        : {}),
    },
  };
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
  "actionLedToProgressWithin1",
  "actionLedToProgressWithin2",
  "actionLedToProgressWithin3",
  "planIntentConverted",
  "planIntentAbandoned",
  "samePlanRepeatedWithoutProgress",
  "setupActionConvertedToRun",
  "economyActionConvertedToRun",
  "rigActionConvertedToRun",
  "remoteBuildConvertedToAdvanceOrScore",
  "advanceConvertedToScore",
  "remoteContestConvertedToStealOrTrash",
  "centralPressureConvertedToSteal",
  "noProgressActionChainLength",
  "longestNoProgressChain",
  "turnsWithNoProgress",
  "actionsUntilNextScoreOrSteal",
  "actionsUntilNextMeaningfulBoardProgress",
  "strategicNoProgressActionChainLength",
  "strategicLongestNoProgressChain",
  "microActionNoProgressContribution",
  "planContinuationOpportunities",
  "planContinuationTaken",
  "planContinuationRate",
  "planAbortOpportunities",
  "planAbortTaken",
  "planAbortWithReason",
  "planIntentConvertedWithin1OwnDecision",
  "planIntentConvertedWithin2OwnDecisions",
  "planIntentConvertedWithin3OwnDecisions",
  "planIntentExpired",
  "planIntentAbandonedWithoutReason",
  "sameStrategicPlanRepeatedWithoutProgress",
  "runnerEconomyConvertedToRunOrRig",
  "runnerRigConvertedToRun",
  "runnerProbeConvertedToUsefulInfoOrPivot",
  "runnerCentralPressureConvertedToStealOrFreshValue",
  "runnerRemoteContestConvertedToStealTrashOrCorrectAbort",
  "corpRemoteBuildConvertedToAdvanceProtectOrScore",
  "corpAdvanceConvertedToScoreOrProtectedWindow",
  "corpEconomyConvertedToRezInstallScore",
  "corpProtectionConvertedToScoreSafety",
  "runnerCentralSuccessFollowedByValue",
  "runnerCentralSuccessFollowedByRepeatNoValue",
  "runnerCentralNoValuePivoted",
  "runnerRemoteSuccessFollowedByValue",
  "runnerRemoteEmptyOrLowValuePivoted",
  "runnerJackOutRepeatedSameServerWithoutNewInfo",
  "runnerJackOutFollowedByEconomyOrRig",
  "runnerAccessNoValueRepeated",
  "runnerAccessNoValuePivoted",
  "runnerEconomyConvertedAfterOutcome",
  "runnerRigConvertedAfterOutcome",
  "corpRemoteStealFollowupProtectOrPivot",
  "corpRemoteStealFollowupRepeatedUnsafeLine",
  "corpCentralStealFollowupProtectCentral",
  "corpRunnerFailedRunFollowupScoreOrAdvance",
  "corpRunnerSuccessfulRunFollowupProtect",
  "corpAdvanceFollowupScore",
  "corpAdvanceFollowupProtect",
  "corpRemoteBuildFollowupAdvanceProtectScore",
  "corpRemoteBuildFollowupNoop",
  "outcomeFollowupOpportunities",
  "outcomeFollowupTaken",
  "outcomeFollowupRate",
  "outcomeFollowupApplied",
  "outcomeFollowupSuppressedByProgressionCost",
  "outcomeFollowupSuppressedByBetterImmediateValue",
  "outcomeFollowupLedToProgressWithin3",
  "outcomeFollowupLedToNoProgressChain",
  "outcomeFollowupDelayedScoreWindow",
  "outcomeFollowupPreservedScoreWindow",
  "outcomeFollowupDelayedStealOrTrash",
  "outcomeFollowupPreservedContestReserve",
  "runnerOutcomePivotConverted",
  "runnerOutcomePivotStalled",
  "corpOutcomePivotConverted",
  "corpOutcomePivotStalled",
  "corpScoreWindowOverriddenByFollowup",
  "scoreNowProtectedFromFollowup",
  "stealTrashProtectedFromFollowup",
  "effectiveRunQuoteBlockedFollowupRun",
  "unbrokenRunEffectChangedBreakDecision",
  "futureEffectSubroutinesEncountered",
  "futureEffectSubroutinesWithRemainingIce",
  "futureEffectSubroutinesWithoutRemainingIce",
  "futureEffectBreaksTaken",
  "futureEffectBreaksSkippedNoRemainingIce",
  "futureEffectBreaksTakenWithoutRemainingIce",
  "pumpActionsBeforeFutureEffectBreak",
  "pumpActionsThatCouldNotLeadToBreak",
  "pumpActionsThatDestroyedAccessReserve",
  "breakSkippedToPreserveTrashReserve",
  "runnerBreakerOntologyProfilesSeen",
  "runnerBreakerOntologyCoverageUsed",
  "runnerBreakerOntologyFallbackUsed",
  "runnerBreakerOntologyConflict",
  "runnerInstallableBreakerRankedByOntology",
  "runnerSearchTargetRankedByOntology",
  "runnerMissingCoverageResolvedByOntology",
  "runnerBreakerOntologySetupSuppressedBecausePressureReady",
  "corpVisibleRunnerBreakerOntologyProfilesSeen",
  "corpRemoteSafetyUsedRunnerBreakerOntology",
  "corpCheapContestDetectedByBreakerOntology",
  "corpRemoteSafetyOntologyConflictWithEffectiveQuote",
  "corpAgendaInstallBlockedByOntologyCheapContest",
  "corpAdvanceBlockedByOntologyCheapContest",
  "breakerOntologyCoverageByType",
  "breakerOntologyCoverageWall",
  "breakerOntologyCoverageSentry",
  "breakerOntologyCoverageCodeGate",
  "breakerOntologyCoverageAp",
  "breakerOntologyCoverageTrace",
  "breakerOntologyCoverageWatchdog",
  "breakerOntologyCoverageBlackIce",
  "breakerOntologyCoverageUniversal",
  "breakerOntologyCoverageUnknownSpecial",
  "breakerOntologySideEffectsSeen",
  "breakerOntologyCostProfileSeen",
  "breakerOntologyFallbackEvidenceCount",
  "breakerOntologyEffectiveQuoteOverrideCount",
  "corpRemoteRoleProfilesSeen",
  "corpRemoteRoleUsedForSafety",
  "corpRemoteRoleUsedForScoringRemote",
  "corpRemoteRoleUsedForPortfolio",
  "corpRemoteRoleConflictWithLegacy",
  "corpRemoteRoleConflictWithBoardState",
  "corpScoringProtectionRemoteRoleSeen",
  "corpAgendaStealTaxRemoteRoleSeen",
  "corpRunTaxRemoteRoleSeen",
  "corpRemoteCapacityRoleSeen",
  "corpAssetEconomyRemoteRoleSeen",
  "corpBaitRemoteRoleSeen",
  "corpAmbushRemoteRoleSeen",
  "corpIceModifierRemoteRoleSeen",
  "corpRemoteRoleRaisedSafetyScore",
  "corpRemoteRoleDidNotRaiseSafetyBecauseInactive",
  "corpRemoteRoleDidNotRaiseSafetyBecauseCheapContest",
  "corpRemoteRolePreventedBaitAsScoringProtection",
  "corpRemoteRolePreventedAssetAsScoringProtection",
  "corpRemoteRoleHelpedChooseExistingRemote",
  "corpRemoteRoleHelpedAvoidNewEmptyRemote",
  "runnerRemoteRoleProfilesSeen",
  "runnerRemoteRoleUsedForTrashValue",
  "runnerRemoteRoleUsedForContestValue",
  "runnerRemoteRoleTrashBudgetPreserved",
  "runnerRemoteRoleConflictWithHiddenStateGuard",
  "runnerRunTaxRemoteRoleAccessed",
  "runnerAgendaStealTaxRemoteRoleAccessed",
  "runnerAssetEconomyRemoteRoleAccessed",
  "remoteRoleByKind",
  "remoteRoleKindScoringProtection",
  "remoteRoleKindAgendaStealTax",
  "remoteRoleKindRunTax",
  "remoteRoleKindRemoteCapacity",
  "remoteRoleKindAssetEconomy",
  "remoteRoleKindBait",
  "remoteRoleKindAmbush",
  "remoteRoleKindIceModifier",
  "remoteRoleKindTaxFort",
  "remoteRoleByServerScope",
  "remoteRoleServerScopeFort",
  "remoteRoleServerScopeRemote",
  "remoteRoleServerScopeCentral",
  "remoteRoleServerScopeServer",
  "remoteRoleSafetyDedupeCount",
  "unbrokenRunEffectIgnoredBecauseNoRemainingIce",
  "unbrokenRunEffectAppliedToRemainingPath",
  "badOutcomeRepeatedWithoutNewInfo",
  "goodOutcomeConverted",
  "outcomePivotWithReason",
  "outcomeIgnored",
  "strategicLineSelected",
  "strategicLineSelectedBySideRunner",
  "strategicLineSelectedBySideCorp",
  "strategicLineSelectedBySeed",
  "strategicLineCommitmentTurns",
  "strategicLineContinuationTaken",
  "strategicLineAborted",
  "strategicLineOverriddenByTacticalUrgency",
  "strategicLineConvertedToProgress",
  "strategicLineRepeatedWithoutProgress",
  "strategicLineVarianceAcrossSeeds",
  "runnerStrategicLineEarlyHqPressure",
  "runnerStrategicLineEarlyRndPressure",
  "runnerStrategicLineRemoteContest",
  "runnerStrategicLineEconomyFirst",
  "runnerStrategicLineRigFirst",
  "runnerStrategicLineBreakerSearchFirst",
  "runnerStrategicLineInterfacePressure",
  "runnerStrategicLineCloseoutPressure",
  "corpStrategicLineCentralStabilize",
  "corpStrategicLineRemoteScoringBuild",
  "corpStrategicLineIceTaxGlacier",
  "corpStrategicLineEconomyRezReserve",
  "corpStrategicLineFastAdvanceOrCounterOps",
  "corpStrategicLineTagTracePunish",
  "corpStrategicLineBaitAndPunish",
  "corpStrategicLineScoreCloseout",
  "lineCommitmentLedToScore",
  "lineCommitmentLedToSteal",
  "lineCommitmentLedToRemoteTrash",
  "lineCommitmentLedToRigProgress",
  "lineCommitmentLedToScoreWindow",
  "lineCommitmentLedToNoProgressChain",
  "corpRemoteHasIceButRunnerPathCheap",
  "corpAgendaInstalledInCheaplyContestableRemote",
  "corpAdvanceInCheaplyContestableRemote",
  "corpCheapRemoteContestIgnored",
  "corpRemoteProtectionOverestimatedByIcePresence",
  "corpRemoteEffectiveProtectionScore",
  "runnerKnownPathCostToScoringRemote",
  "runnerCanContestScoringRemoteForActionOnly",
  "runnerCanContestScoringRemoteWithCredits",
  "corpAgendaInstallDeferredDueToCheapContest",
  "corpAdvanceDeferredDueToCheapContest",
  "corpProtectionChosenBeforeUnsafeAgendaInstall",
  "corpScoreLineContinuedWhenRemoteEffectivelyProtected",
  "corpSameTurnScoreAllowedDespiteCheapContest",
  "corpBaitRemoteNotCountedAsScoringProtection",
  "corpHqIceCount",
  "corpRndIceCount",
  "corpArchivesIceCount",
  "corpRemoteIceCount",
  "corpHqUnrezzedIceCount",
  "corpRndUnrezzedIceCount",
  "corpCentralIceCount",
  "corpCentralUnrezzedIceCount",
  "corpCentralIceInstalled",
  "corpHqIceInstalled",
  "corpRndIceInstalled",
  "corpArchivesIceInstalled",
  "corpRemoteIceInstalled",
  "corpHqOverIced",
  "corpRndOverIced",
  "corpCentralOverIced",
  "corpCentralOverIcedWithoutPressure",
  "corpCentralOverIcedWithLowRezReserve",
  "corpHqFifthIceInstalled",
  "corpCentralIceDiminishingReturnInstall",
  "corpCentralIceInstallSuppressedByDiminishingReturns",
  "corpCentralIceInstallPenalizedByDiminishingReturns",
  "corpRezReserveCredits",
  "corpRezReserveDeficit",
  "corpInstalledIceWithoutRezReserve",
  "corpInstalledCentralIceWithoutRezReserve",
  "corpInstalledRemoteIceWithoutRezReserve",
  "corpCanRezAtLeastOneCentralIce",
  "corpCanRezAtLeastOneRemoteIce",
  "corpCannotRezAnyNewlyInstalledIce",
  "corpCreditsBelowCheapestRelevantRez",
  "corpCreditsBelowEstimatedCentralRezNeed",
  "corpHqProtectionJustifiedByAgendaFlood",
  "corpHqProtectionJustifiedByRunnerPressure",
  "corpRndProtectionJustifiedByRunnerPressure",
  "corpCentralOverIceBlockedByRunnerPressure",
  "corpCentralOverIceBlockedByAgendaFlood",
  "corpCentralOverIceBlockedByNoRemotePlan",
  "corpRemoteScoringUnderbuiltWhileCentralsOverIced",
  "corpReadyRemoteExists",
  "corpAgendaInHqWithReadyRemote",
  "corpAgendaInHqWithoutReadyRemote",
  "corpExtraCentralIceChosenOverReadyRemoteBuild",
  "corpExtraCentralIceChosenOverEconomy",
  "corpExtraCentralIceChosenOverRezReserve",
  "corpExtraCentralIceChosenOverAgendaInstall",
  "corpExtraCentralIceChosenOverAdvanceOrScore",
  "corpIcePortfolioFixGateEligible",
  "corpIcePortfolioFixGateSuspiciousCentralOverIce",
  "corpIcePortfolioFixGateBlockedByAgendaFlood",
  "corpIcePortfolioFixGateBlockedByRunnerCentralPressure",
  "corpIcePortfolioFixGateBlockedByNoRemotePlan",
  "corpIcePortfolioFixGateBlockedByEmergencyProtection",
  "corpUnsafeScoringRemoteDetected",
  "corpUnsafeScoringRemoteAlternativeChosen",
  "corpUnsafeScoringRemoteStalled",
  "corpUnsafeRemoteConvertedToProtection",
  "corpUnsafeRemoteConvertedToBetterRemote",
  "corpUnsafeRemoteConvertedToFastAdvance",
  "corpUnsafeRemoteConvertedToHqProtection",
  "corpUnsafeRemoteConvertedToEconomy",
  "corpUnsafeRemoteConvertedToNoScorePath",
  "corpBetterRemoteAvailable",
  "corpBestRemoteSelectedForAgenda",
  "corpScoringRemoteSafetyDeltaAfterProtection",
  "corpProtectionConvertedToScoreWithin3",
  "corpProtectionRepeatedWithoutScoreConversion",
  "corpProtectionImprovedRemoteSafety",
  "corpProtectionNoSafetyDelta",
  "corpProtectionOpenedScorePath",
  "corpProtectionFollowedByAgendaInstall",
  "corpProtectionFollowedByAdvance",
  "corpProtectionFollowedByScore",
  "corpProtectionFollowedByMoreProtection",
  "corpProtectionFollowedByEconomy",
  "corpProtectionFollowedByCentralProtection",
  "corpProtectionLoopAfterRemoteSafe",
  "corpRemoteSafeButNoScoreActionTaken",
  "corpRemoteSafeButAgendaHeld",
  "corpRemoteSafeButAdvancedTooLate",
  "corpRemoteSafetyDelta",
  "corpRemoteSafetyDeltaAfterProtection",
  "corpRemoteSafetyReadyForAgenda",
  "corpScorePathChosenAfterProtection",
  "corpScorePathSkippedAfterProtection",
  "corpAdvanceBurstOpportunity",
  "corpAdvanceBurstTaken",
  "corpScorePathAvailableButNotTaken",
  "corpScorePathBlockedByEffectiveRemoteSafety",
  "corpAgendaHeldDueToUnsafeRemote",
  "corpAgendaHeldTooLongWithHqPressure",
  "corpAgendaInstalledInProtectedRemote",
  "corpAgendaAdvancedInProtectedRemote",
  "corpAgendaNearScoreWindow",
  "corpScoreWindowCompressionOpportunity",
  "corpScoreWindowCompressionTaken",
  "corpScoreWindowCompressionRate",
  "corpScoreWindowCompressionSkipped",
  "corpNonEssentialActionBeforeScoreWindow",
  "corpEconomyBeforeScoreWindow",
  "corpEconomyBeforeScoreWindowNecessary",
  "corpEconomyBeforeScoreWindowWithInstalledAgenda",
  "corpEconomyBeforeScoreWindowWithAdvancedAgenda",
  "corpEconomyBeforeScoreWindowWithScoreLegalNext",
  "corpEconomyBeforeScoreWindowWithAdvanceToScoreLegalNext",
  "corpEconomyBeforeScoreWindowWithReadyRemote",
  "corpEconomyBeforeScoreWindowWithAgendaInHqAndReadyRemote",
  "corpEconomyBeforeScoreWindowCreditsShort",
  "corpEconomyBeforeScoreWindowCreditsAlreadyEnough",
  "corpEconomyBeforeScoreWindowRemoteSafe",
  "corpEconomyBeforeScoreWindowRemoteContestHigh",
  "corpEconomyBeforeScoreTaken",
  "corpEconomyBeforeScoreTakenAsNecessaryCredits",
  "corpEconomyBeforeScoreTakenDespiteCreditsEnough",
  "corpEconomyBeforeScoreTakenOverScoreLegal",
  "corpEconomyBeforeScoreTakenOverAdvanceToScoreLegal",
  "corpEconomyBeforeScoreTakenOverAgendaInstallReadyRemote",
  "corpEconomyBeforeScoreTakenOverHqAgendaExit",
  "corpEconomyBeforeScoreTakenOverScoreAreaAbility",
  "corpEconomyBeforeScoreConvertedToScoreNextDecision",
  "corpEconomyBeforeScoreConvertedToAdvanceNextDecision",
  "corpEconomyBeforeScoreConvertedToAgendaInstallNextDecision",
  "corpEconomyBeforeScoreConvertedWithin2CorpActions",
  "corpEconomyBeforeScoreConvertedWithin3CorpActions",
  "corpEconomyBeforeScoreNotConvertedWithin3CorpActions",
  "corpEconomyBeforeScoreRepeatedEconomyNextDecision",
  "corpEconomyBeforeScoreRepeatedEconomyWithin3",
  "corpEconomyBeforeScoreThenDraw",
  "corpEconomyBeforeScoreThenProtect",
  "corpEconomyBeforeScoreThenNewRemote",
  "corpEconomyBeforeScoreThenRunnerSteal",
  "corpEconomyBeforeScoreThenActionLimit",
  "corpEconomyBeforeScorePlausibleCreditsNeeded",
  "corpEconomyBeforeScorePlausibleRezOrAdvanceReserve",
  "corpEconomyBeforeScorePlausibleHqOrRndSafety",
  "corpEconomyBeforeScorePlausibleRunnerContestTooHigh",
  "corpEconomyBeforeScorePlausibleNoAgendaExit",
  "corpEconomyBeforeScoreSuspiciousCreditsAlreadyEnough",
  "corpEconomyBeforeScoreSuspiciousRepeatedEconomy",
  "corpEconomyBeforeScoreSuspiciousDelayedTerminalAction",
  "corpEconomyBeforeScoreSuspiciousRemoteStillSafe",
  "corpEconomyBeforeScoreSuspiciousRunnerStealFollowup",
  "corpEconomyBeforeScoreUnclassified",
  "corpEconomyBeforeScoreFixGateEligible",
  "corpEconomyBeforeScoreFixGateBlockedByCredits",
  "corpEconomyBeforeScoreFixGateBlockedByCheapContest",
  "corpEconomyBeforeScoreFixGateBlockedByRunnerContest",
  "corpEconomyBeforeScoreFixGateBlockedBySafety",
  "corpEconomyBeforeScoreFixGateSuspicious",
  "corpEconomyBeforeScoreFixGateSuspiciousRepeatedEconomy",
  "corpEconomyBeforeScoreFixGateSuspiciousNoConversion",
  "corpEconomyBeforeScoreFixGateSuspiciousStealFollowup",
  "corpRepeatedEconomyBeforeScoreWindows",
  "corpRepeatedEconomyBeforeScoreCreditsStillShort",
  "corpRepeatedEconomyBeforeScoreCreditsAlreadyEnough",
  "corpRepeatedEconomyBeforeScoreScoreLegal",
  "corpRepeatedEconomyBeforeScoreAdvanceLegal",
  "corpRepeatedEconomyBeforeScoreAgendaInstallReadyRemoteLegal",
  "corpRepeatedEconomyBeforeScoreRemoteSafe",
  "corpRepeatedEconomyBeforeScoreRunnerContestHigh",
  "corpRepeatedEconomyBeforeScoreThenScore",
  "corpRepeatedEconomyBeforeScoreThenRunnerSteal",
  "corpRepeatedEconomyBeforeScoreThenActionLimit",
  "corpRepeatedEconomyBeforeScoreSuspicious",
  "corpRepeatedEconomyBeforeScorePlausible",
  "corpEconomyBeforeScoreNoConversionCreditsStillShort",
  "corpEconomyBeforeScoreNoConversionNoAgendaExit",
  "corpEconomyBeforeScoreNoConversionRemoteUnsafe",
  "corpEconomyBeforeScoreNoConversionRunnerContestHigh",
  "corpEconomyBeforeScoreNoConversionSafetyBlocked",
  "corpEconomyBeforeScoreNoConversionPlanDrift",
  "corpEconomyBeforeScoreNoConversionRepeatedEconomy",
  "corpEconomyBeforeScoreNoConversionDrawLoop",
  "corpEconomyBeforeScoreNoConversionProtectionLoop",
  "corpEconomyBeforeScoreNoConversionRemotePortfolioLoop",
  "corpEconomyBeforeScoreNoConversionRunnerSteal",
  "corpEconomyBeforeScoreNoConversionActionLimit",
  "corpEconomyBeforeScoreNoConversionSuspicious",
  "corpEconomyBeforeScoreNoConversionPlausible",
  "corpEconomyBeforeScoreCreditsEnoughWindows",
  "corpEconomyBeforeScoreCreditsEnoughTaken",
  "corpEconomyBeforeScoreCreditsEnoughScoreLegal",
  "corpEconomyBeforeScoreCreditsEnoughAdvanceLegal",
  "corpEconomyBeforeScoreCreditsEnoughAgendaInstallReadyRemoteLegal",
  "corpEconomyBeforeScoreCreditsEnoughSafetyBlocked",
  "corpEconomyBeforeScoreCreditsEnoughSuspicious",
  "corpEconomyBeforeScoreCreditsEnoughPlausible",
  "corpProtectionBeforeScoreWindow",
  "corpProtectionBeforeScoreWindowNoSafetyDelta",
  "corpCentralProtectionBeforeScoreWindow",
  "corpCentralProtectionBeforeScoreWindowNecessary",
  "corpDrawBeforeScoreWindow",
  "corpEndTurnBeforeScoreWindow",
  "corpSameTurnScoreOpportunity",
  "corpSameTurnScoreTaken",
  "corpScoreWindowLostAfterNonEssentialAction",
  "corpRunnerStealAfterDelayedScoreWindow",
  "corpScoreTerminalWindow",
  "corpScoreTerminalWindowScoreLegal",
  "corpScoreTerminalWindowAdvanceToScoreLegal",
  "corpScoreTerminalWindowAgendaInstallLegal",
  "corpScoreTerminalWindowProtectedRemoteReady",
  "corpScoreTerminalWindowRemoteContestLow",
  "corpScoreTerminalWindowCreditsSufficient",
  "corpScoreTerminalWindowRunnerAccessThreatHigh",
  "corpScoreTerminalScoreTaken",
  "corpScoreTerminalAdvanceTaken",
  "corpScoreTerminalAgendaInstalled",
  "corpScoreTerminalSkipped",
  "corpScoreTerminalSkippedForProtection",
  "corpScoreTerminalSkippedForEconomy",
  "corpScoreTerminalSkippedForDraw",
  "corpScoreTerminalSkippedForInstallIce",
  "corpScoreTerminalSkippedForInstallAssetOrUpgrade",
  "corpScoreTerminalSkippedForHqProtection",
  "corpScoreTerminalSkippedForRndProtection",
  "corpScoreTerminalSkippedForRemotePortfolio",
  "corpScoreTerminalSkippedForUnknownHigherPriority",
  "corpScoreTerminalSkippedThenAgendaStolen",
  "corpScoreTerminalSkippedThenNoScoreWindow",
  "corpScoreTerminalSkippedThenActionLimit",
  "corpScoreTerminalSkippedThenProtectionLoop",
  "corpScoreTerminalSkippedThenEconomyLoop",
  "corpScoreTerminalSkippedThenRemoteStillSafe",
  "corpScoreTerminalSkippedThenScoreNextDecision",
  "corpScoreConversionFixGateEligible",
  "corpScoreConversionFixGateBlockedByCheapContest",
  "corpScoreConversionFixGateBlockedByCredits",
  "corpScoreConversionFixGateBlockedByRunnerContest",
  "corpScoreConversionFixGateBlockedByHqThreat",
  "corpScoreConversionFixGateSuspiciousProtectionLoop",
  "corpScoreConversionFixGateSuspiciousEconomyLoop",
  "corpScoreConversionFixGateSuspiciousDraw",
  "corpScoreConversionFixGateSuspiciousRemotePortfolio",
  "corpScoreConversionFixGateSuspiciousUnknown",
  "corpAdvanceToScoreLineCompressedWithin2",
  "corpAdvanceToScoreLineCompressedWithin3",
  "scoredAgendaActionOpportunities",
  "scoredAgendaActionTaken",
  "scoredAgendaActionTakeRate",
  "scoredAgendaEconomyOpportunities",
  "scoredAgendaEconomyTaken",
  "scoredAgendaEconomySkippedForBasicCredit",
  "politicalOverthrowOpportunities",
  "politicalOverthrowTaken",
  "politicalOverthrowSkippedForBasicCredit",
  "scoredAgendaCounterEconomyOpportunities",
  "scoredAgendaCounterEconomyTaken",
  "scoredAgendaDrawOpportunities",
  "scoredAgendaDrawTaken",
  "scoredAgendaExtraActionOpportunities",
  "scoredAgendaExtraActionTaken",
  "scoredAgendaTraceTagOpportunities",
  "scoredAgendaTraceTagTaken",
  "scoredAgendaDamagePunishOpportunities",
  "scoredAgendaDamagePunishTaken",
  "runnerTaggedAtCorpDecision",
  "runnerTaggedAtCorpDecisionTurns",
  "runnerTaggedAtCorpDecisionActions",
  "runnerTagClearedBeforeCorpDecision",
  "runnerTagClearedSameRunnerTurn",
  "runnerTagWindowExpiredBeforeCorpTurn",
  "runnerTaggedAfterTraceDuringRun",
  "runnerTaggedAtEndOfRunnerTurn",
  "runnerTaggedAtStartOfCorpTurn",
  "corpTagCreatedDuringRunnerTurn",
  "corpTagCreatedDuringCorpTurn",
  "corpTagCreatedDuringEncounter",
  "corpTagCreatedByTraceSuccess",
  "corpTagCreatedByAccessOrSteal",
  "corpTagCreatedByPersistentEffect",
  "corpTagCreatedByScoredAgendaAction",
  "corpTagCreatedByOperation",
  "corpTagCreatedByAssetOrNode",
  "corpTagCreatedByIce",
  "runnerTaggedAtCorpDecisionWithFunnelPayoffKnown",
  "runnerTaggedAtCorpDecisionWithoutPayoffKnown",
  "runnerTagFromPreviousRunnerTurnStillVisibleAtCorpDecision",
  "runnerTagFromEncounterStillVisibleAtCorpDecision",
  "runnerTagClearedBeforeCorpDecisionAfterFunnelSource",
  "runnerTagClearedSameRunnerTurnAfterSource",
  "runnerTagWindowExpiredBeforeCorpDecision",
  "corpVisibleTagPunishLegalActions",
  "corpVisibleTagDamagePunishLegalActions",
  "corpVisibleTagEconomicPunishLegalActions",
  "corpVisibleTagTrashPunishLegalActions",
  "corpVisibleTagRunLockPunishLegalActions",
  "corpVisibleTagAmbushPunishLegalActions",
  "corpVisibleTagPayoffLegalActionsByKind",
  "corpVisibleTagPayoffLegalActionsByCard",
  "corpVisibleTagPunishTaken",
  "corpVisibleTagPunishSkipped",
  "corpVisibleTagPunishSkippedForScore",
  "corpVisibleTagPunishSkippedForAdvance",
  "corpVisibleTagPunishSkippedForEconomy",
  "corpVisibleTagPunishSkippedForRemoteProtection",
  "corpVisibleTagPunishSkippedForCentralProtection",
  "corpVisibleTagPunishSkippedForDraw",
  "corpVisibleTagPunishSkippedForInstall",
  "corpVisibleTagPunishSkippedForEndTurn",
  "corpVisibleTagPunishSkippedForUnknownHigherPriority",
  "corpVisibleTagPunishSkippedUnknownChosenScore",
  "corpVisibleTagPunishSkippedUnknownChosenAdvance",
  "corpVisibleTagPunishSkippedUnknownChosenInstallAgenda",
  "corpVisibleTagPunishSkippedUnknownChosenInstallIce",
  "corpVisibleTagPunishSkippedUnknownChosenInstallAssetOrUpgrade",
  "corpVisibleTagPunishSkippedUnknownChosenRez",
  "corpVisibleTagPunishSkippedUnknownChosenOperation",
  "corpVisibleTagPunishSkippedUnknownChosenAbility",
  "corpVisibleTagPunishSkippedUnknownChosenTraceTagSource",
  "corpVisibleTagPunishSkippedUnknownChosenDraw",
  "corpVisibleTagPunishSkippedUnknownChosenBasicCredit",
  "corpVisibleTagPunishSkippedUnknownChosenEndTurn",
  "corpVisibleTagPunishSkippedUnknownChosenUnknown",
  "corpVisibleTagPunishSkippedUnknownByReasonCode",
  "corpVisibleTagPunishSkippedUnknownByChosenActionType",
  "corpVisibleTagPunishSkippedUnknownByChosenCard",
  "corpVisibleTagPunishSkippedUnknownByPayoffCard",
  "corpVisibleTagPunishSkippedUnknownByPayoffKind",
  "corpVisibleTagPunishUnknownSkipPlausible",
  "corpVisibleTagPunishUnknownSkipSuspicious",
  "corpVisibleTagPunishUnknownSkipUnclassified",
  "corpVisibleTagPunishUnknownSkipByPlausibility",
  "corpVisibleTagPunishUnknownSkipPayoffDamage",
  "corpVisibleTagPunishUnknownSkipPayoffEconomic",
  "corpVisibleTagPunishUnknownSkipPayoffTrash",
  "corpVisibleTagPunishUnknownSkipPayoffRunLock",
  "corpVisibleTagPunishUnknownSkipPayoffAmbush",
  "corpVisibleTagPunishUnknownSkipPayoffLethalOrNearLethal",
  "corpVisibleTagPunishUnknownSkipPayoffNonLethal",
  "corpVisibleTagPunishFixGateEligibleWindow",
  "corpVisibleTagPunishFixGateBlockedByScore",
  "corpVisibleTagPunishFixGateBlockedByAdvanceScore",
  "corpVisibleTagPunishFixGateBlockedBySafety",
  "corpVisibleTagPunishFixGateBlockedByAffordability",
  "corpVisibleTagPunishFixGateBlockedByLowImpact",
  "corpVisibleTagPunishFixGateSuspiciousSkip",
  "corpVisibleTagPunishDecisionWindows",
  "corpVisibleTagPunishDecisionWindowsTaken",
  "corpVisibleTagPunishDecisionWindowsSkipped",
  "corpVisibleTagPunishDecisionWindowsWithMultiplePayoffs",
  "corpVisibleTagPunishAlternativePayoffsNotChosen",
  "corpVisibleTagPunishChosenPayoffAmongAlternatives",
  "corpVisibleTagPunishUnknownSkipResolvedAsAlternativePayoff",
  "corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization",
  "corpVisibleTagPunishSkippedOnlyWhenNoPayoffChosen",
  "corpVisibleTagPunishWindowHadTakenAndSkippedBeforeNormalization",
  "corpVisibleTagPunishOperationChoiceAmongPayoffs",
  "corpVisibleTagPunishChosenDamageOverEconomic",
  "corpVisibleTagPunishChosenEconomicOverDamage",
  "corpVisibleTagPunishChosenTrashOverDamage",
  "corpVisibleTagPunishChosenLethalOverNonLethal",
  "corpVisibleTagPunishChosenNonLethalOverLethal",
  "corpVisibleTagPunishChosenLowerImpactOverHigherImpact",
  "corpVisibleTagPunishChosenUnknownImpactOrdering",
  "corpVisibleTagPunishFixGateEligibleWindowNormalized",
  "corpVisibleTagPunishFixGateSuspiciousSkipNormalized",
  "corpVisibleTagPunishFixGateResolvedByAlternativePayoffTaken",
  "corpVisibleTagPunishPotentialPayoffOrderingIssue",
  "corpVisibleTagPunishPotentialPayoffOrderingIssueLethalMissed",
  "corpVisibleTagPunishPotentialPayoffOrderingIssueEconomicVsDamage",
  "corpFunnelSourcePayoffPairSeenInDeck",
  "corpFunnelSourceActionTakenWithPayoffInDeck",
  "corpFunnelSourceActionTakenWithVisiblePayoff",
  "corpFunnelSourceActionTakenWithoutVisiblePayoff",
  "corpFunnelPairConvertedToTaggedDecisionWindow",
  "corpFunnelPairConvertedToLegalPayoffWindow",
  "corpFunnelPairConvertedToPayoffTaken",
  "corpFunnelPairExpiredBeforePayoffWindow",
  "runnerSurvivalCounterContextAvailable",
  "runnerTraceDefenseVisibleAtTagSource",
  "runnerDamagePreventionVisibleAtPayoffWindow",
  "runnerFlatlinePreventionVisibleAtPayoffWindow",
  "runnerLinkDefenseVisibleAtTrace",
  "runnerSurvivalCounterContextSuppressedPunishValue",
  "corpPunishOpportunities",
  "corpPunishTaken",
  "corpPunishSkipped",
  "corpPunishTakeRate",
  "corpPunishOpportunityScorchedEarthLike",
  "corpPunishOpportunityUrbanRenewalLike",
  "corpPunishOpportunityPunitiveCounterstrikeLike",
  "corpPunishOpportunityClosedAccountsLike",
  "corpPunishOpportunityPowerGridOverloadLike",
  "corpPunishOpportunityDatapoolLike",
  "corpPunishOpportunityResourceTrashLike",
  "corpPunishOpportunityScoredAgendaDamageLike",
  "corpPunishOpportunityScoredAgendaTraceTagLike",
  "corpPunishOpportunityUnknown",
  "corpPunishSkippedForEconomy",
  "corpPunishSkippedForProtection",
  "corpPunishSkippedForScore",
  "corpPunishSkippedForRemoteSafety",
  "corpPunishSkippedForDraw",
  "corpPunishSkippedForEndTurn",
  "corpPunishSkippedForUnknown",
  "corpPunishWindowExpiredBeforeAction",
  "corpPunishWindowExpiredBeforeCorpTurn",
  "corpTagSourceOpportunities",
  "corpTagSourceTaken",
  "corpTagSourceSkipped",
  "corpTraceTagOpportunities",
  "corpTraceTagTaken",
  "corpTraceTagSkipped",
  "corpTraceTagExpectedSuccess",
  "corpTraceTagSkippedForEconomy",
  "corpTraceTagSkippedForProtection",
  "corpTraceTagSkippedForScore",
  "corpTraceTagSkippedForRemoteSafety",
  "corpTagSourceConvertedToRunnerTagged",
  "corpTagSourceConvertedToPunishOpportunity",
  "corpTagSourceConvertedToPunishTaken",
  "corpTagPunishFunnelTagSourceOpportunity",
  "corpTagPunishFunnelTagSourceTaken",
  "corpTagPunishFunnelRunnerTagged",
  "corpTagPunishFunnelRunnerTaggedAtCorpDecision",
  "corpTagPunishFunnelPunishOpportunity",
  "corpTagPunishFunnelPunishTaken",
  "corpTagPunishFunnelTerminalDamageOrEconomicHit",
  "corpTagPunishFunnelFlatlineOrLock",
  "corpTagPunishOntologyProfilesSeen",
  "corpTagSourceOntologyProfilesSeen",
  "corpTagPunishPayoffOntologyProfilesSeen",
  "corpTagSourceOntologyUsed",
  "corpTagPunishPayoffOntologyUsed",
  "corpTagPunishOntologyFallbackUsed",
  "corpTagPunishOntologyConflict",
  "corpTagSourceLegalActionClassifiedByOntology",
  "corpPunishLegalActionClassifiedByOntology",
  "corpPunishOpportunityConfirmedByOntology",
  "corpPunishSkippedDespiteOntologyOpportunity",
  "corpTagSourceTakenWithOntologyPayoffAvailable",
  "corpTagSourceTakenWithoutOntologyPayoff",
  "corpTagSourceConvertedToOntologyPunishOpportunity",
  "corpOntologyPunishOpportunityConverted",
  "corpOntologyPunishOpportunityExpired",
  "corpTagPunishOntologyByKind",
  "corpTagPunishOntologyKindTagSource",
  "corpTagPunishOntologyKindTagPunishPayoff",
  "corpTagPunishOntologyKindTrace",
  "corpTagPunishOntologyKindTag",
  "corpTagPunishOntologyKindDamage",
  "corpTagPunishOntologyKindResourceTrash",
  "corpTagPunishOntologyKindHardwareTrash",
  "corpTagPunishOntologyKindScoredAgendaDamageLike",
  "corpTagPunishOntologyKindScoredAgendaTraceTagLike",
  "corpTagPunishConditionByKind",
  "corpTagPunishConditionRequiresRunnerTagged",
  "corpTagPunishConditionRequiresTraceSuccess",
  "scoredAgendaActionValueOverBasic",
  "basicCreditTakenWhileBetterAgendaEconomyAvailable",
  "basicDrawTakenWhileBetterAgendaDrawAvailable",
  "corpNewRemoteCreated",
  "corpNewRemoteCreatedWithPlan",
  "corpNewRemoteCreatedWithoutPayloadPlan",
  "corpEmptyRemoteWithIceCreated",
  "corpEmptyRemoteStayedUnusedTurns",
  "corpRemoteConvertedToAgendaAssetOrBait",
  "corpRemoteConversionRate",
  "corpIceInstalledOnNewRemoteInsteadOfExistingScoringRemote",
  "corpExistingRemoteCouldBeStrengthened",
  "corpRemotePortfolioOverExpanded",
  "corpOneIceRemoteCheaplyContestable",
  "corpRemoteIceConsolidationOpportunity",
  "corpRemoteIceConsolidationTaken",
  "corpFutureRunIceInstallOpportunities",
  "corpFutureRunIceInstalled",
  "corpFutureRunIceInstalledAsInnermost",
  "corpFutureRunIceInstalledAsOutermost",
  "corpFutureRunIceInstalledWithLaterIce",
  "corpFutureRunIceInstalledWithoutLaterIce",
  "corpFutureRunIceInstalledOnEmptyServer",
  "corpFutureRunIceInstalledFirstOnEmptyServer",
  "corpFutureRunIceInstalledAfterInnerIceExists",
  "corpFutureRunIceInstalledAsDeadEffect",
  "corpFutureRunIceInstalledAsLiveEffect",
  "corpNextIceEffectInstalledLast",
  "corpIceOrderFutureEffectDead",
  "corpIceOrderFutureEffectLive",
  "corpMultiIceInstallOrderFutureEffectDead",
  "corpMultiIceInstallOrderOptimized",
  "corpBallAndChainInstalledInnermost",
  "corpBallAndChainInstalledWithoutLaterIce",
  "corpBallAndChainInstalledWithLaterIce",
  "corpCanisInstalledWithoutLaterIce",
  "corpBolterOrDataDartsInstalledWithoutNextIce",
  "corpRemoteCreatedThenNoScorePath",
  "corpRemoteCreatedThenAgendaInstalledWithin3",
  "corpRemoteCreatedThenAssetInstalledWithin3",
  "corpRemoteCreatedThenBaitOrAmbushWithin3",
  "corpHqCardCount",
  "corpHqKnownAgendaCount",
  "corpHqAgendaDensity",
  "corpHqAgendaFloodRisk",
  "runnerHqAccessThreat",
  "runnerHqKnownAgendaThreat",
  "runnerHqMultiaccessThreat",
  "corpDrawWouldLikelyDiluteHq",
  "corpDrawWouldRiskAgendaFlood",
  "corpDrawChosenToDiluteAgendaFlood",
  "corpDrawSkippedBecauseAgendaFloodRisk",
  "corpAgendaRemovedFromHqToRemoteOrScore",
  "corpHqProtectionChosenOverDilution",
  "corpHqDilutionChosenBecauseNoSafeRemote",
  "corpHqDilutionBackfiredAgendaDrawn",
  "corpHqDensityReducedAfterDraw",
  "corpHqDensityIncreasedAfterDraw",
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
  "hqKnownCards",
  "hqUnknownCards",
  "hqKnownFraction",
  "hqFullyKnown",
  "hqKnownAgendaCount",
  "hqKnownNonAgendaCount",
  "hqKnownAgendaPoints",
  "hqMemoryInvalidatedByDraw",
  "hqMemoryInvalidatedByInstall",
  "hqMemoryInvalidatedByPlay",
  "hqMemoryInvalidatedByDiscard",
  "hqMemoryInvalidatedByShuffleOrReorder",
  "hqRunValueFromKnownCards",
  "hqRunValueFromUnknownCards",
  "hqRunSuppressedBecauseFullyKnownNoAgenda",
  "hqRunBoostedBecauseKnownAgenda",
  "hqRunBoostedBecauseUnknownCardsRemain",
  "hqRunRepeatedWithoutNewHqInfo",
  "knownRndTopCard",
  "knownRndTopMovedToHq",
  "knownRndTopInvalidated",
  "hqKnownFromRndDraw",
  "hqRunBoostedByRndToHqAgenda",
  "hqRunSuppressedByRndToHqNonAgenda",
  "rndAccesses",
  "rndAccessRemovedTopCard",
  "rndAccessStoleAgenda",
  "rndAccessTrashedCard",
  "rndAccessLeftTopCardUnchanged",
  "rndTopFreshenedByRunnerAccess",
  "rndKnownTopAdvancedAfterAccess",
  "rndKnownTopSequenceAdvanced",
  "rndRepeatRunAfterTopRemoved",
  "rndRepeatRunAfterTopUnchanged",
  "rndRepeatRunBoostedByFreshTop",
  "rndRepeatRunSuppressedBecauseKnownStaleTop",
  "rndRepeatRunBoostedByKnownAgendaTop",
  "rndRepeatRunSuppressedBecauseKnownNonAgendaTop",
  "rndFreshTopPressureOpportunity",
  "rndFreshTopPressureTaken",
  "rndFreshTopPressureSkipped",
  "rndStaleTopRepeatMistake",
  "rndAccessNoValueRepeatStale",
  "rndCloseoutOpportunityAfterTopRemoved",
  "knownRemoteCards",
  "knownRemoteAgendas",
  "knownRemoteTrashableCards",
  "remoteMemoryRetainedAfterAccess",
  "remoteMemoryInvalidatedByInstallOrMove",
  "remoteRunBoostedByKnownRemoteAgenda",
  "remoteRunSuppressedByKnownLowValueRemote",
  "remoteTrashBoostedByKnownRemoteTrashable",
  "knownUnrezzedIceFromExpose",
  "knownUnrezzedIceRetained",
  "knownUnrezzedIceInvalidated",
  "runCostAdjustedByKnownUnrezzedIce",
  "jackOutInfluencedByKnownUnrezzedIce",
  "rigPlanInfluencedByKnownUnrezzedIce",
  "runnerMissingBreakerCoverageByType",
  "runnerVisibleIceBlockingByType",
  "runnerKnownIceBlockingByType",
  "runnerPathBlockedByMissingCoverage",
  "runnerInstallableBreakerForBlockedPath",
  "runnerSearchCardAvailableForMissingBreaker",
  "runnerSearchCardUsedForMissingBreaker",
  "runnerSearchCardAvailableButUnused",
  "runnerTutorConvertedToBreakerInstall",
  "runnerTutorConvertedToUsefulRun",
  "runnerBreakerInstallConvertedToUsefulRun",
  "runnerCoverageImproved",
  "runnerCoverageReadyButNoPressure",
  "runnerSetupContinuedAfterCoverageReady",
  "runnerPressureReadyWindows",
  "runnerPressureReadyTrue",
  "runnerPressureReadyFalsePositive",
  "runnerPressureReadyByTargetHq",
  "runnerPressureReadyByTargetRnd",
  "runnerPressureReadyByTargetArchives",
  "runnerPressureReadyByTargetRemote",
  "runnerSetupContinuedAfterPressureReady",
  "runnerPressureTakenAfterCoverageReady",
  "runnerPressureSkippedAfterCoverageReady",
  "runnerPressureSkippedInsufficientCredits",
  "runnerPressureSkippedMissingPostRunReserve",
  "runnerPressureSkippedStaleCentral",
  "runnerPressureSkippedRemoteTooDangerous",
  "runnerPressureSkippedNoValuableTarget",
  "runnerPressureSkippedBetterImmediateAction",
  "runnerCoverageImprovedThenPressureWithin1",
  "runnerCoverageImprovedThenPressureWithin2",
  "runnerCoverageImprovedThenPressureWithin3",
  "runnerEconomyReserveReachedThenPressureWithin2",
  "runnerSearchTutorThenPressureWithin3",
  "runnerSetupLoopAfterPressureReady",
  "runnerPhaseExitBlockedByCost",
  "runnerPhaseExitBlockedByCoverage",
  "runnerPhaseExitBlockedByTargetValue",
  "runnerProbeRevealedIceThenSearchedBreaker",
  "runnerProbeRevealedIceButDidNotReact",
  "runnerSetupBreakerSearchStalled",
  "runnerSetupEconomyStalled",
  "runnerPhaseExitToPressure",
  "actionLimitRootCauseByMatch",
  "actionLimitDominantSide",
  "actionLimitDominantSideRunner",
  "actionLimitDominantSideCorp",
  "actionLimitDominantSideBoth",
  "finalStrategicWindowNoProgressActions",
  "finalStrategicWindowRunnerNoProgressActions",
  "finalStrategicWindowCorpNoProgressActions",
  "finalWindowRunnerMeaningfulRunOpportunities",
  "finalWindowRunnerMeaningfulRunsTaken",
  "finalWindowCorpScorePathOpportunities",
  "finalWindowCorpScorePathTaken",
  "finalWindowKnownInfoExploitationOpportunities",
  "finalWindowKnownInfoExploitationTaken",
  "endgameCloseoutOpportunitiesRunner",
  "endgameCloseoutOpportunitiesRunnerRaw",
  "endgameCloseoutOpportunitiesRunnerDeduped",
  "endgameCloseoutOpportunitiesRunnerTrue",
  "endgameCloseoutOpportunitiesRunnerFalsePositive",
  "runnerCloseoutByKnownHqAgenda",
  "runnerCloseoutByKnownRndTopAgenda",
  "runnerCloseoutByKnownRemoteAgenda",
  "runnerCloseoutByPointsToWin",
  "runnerCloseoutBlockedByCredits",
  "runnerCloseoutBlockedByBreakerCoverage",
  "runnerCloseoutBlockedByPostRunReserve",
  "runnerCloseoutAttempted",
  "runnerCloseoutSkippedWithReason",
  "endgameCloseoutOpportunitiesCorp",
  "endgameCloseoutAttemptsRunner",
  "endgameCloseoutAttemptsCorp",
  "endgameScoreOrStealPressureActions",
  "endgameSetupOrEconomyActions",
  "endgameProtectionActions",
  "endgameLowValueRepeatActions",
  "actionLimitLikelyDeckPressureIssue",
  "actionLimitLikelyStrategyIssue",
  "actionLimitLikelyMetricArtifact",
  "trueCentralCloseoutOpportunities",
  "centralCloseoutOpportunitiesRaw",
  "centralCloseoutOpportunitiesDeduped",
  "centralCloseoutOpportunities",
  "centralCloseoutRunsTaken",
  "centralCloseoutSuccesses",
  "centralCloseoutFalsePositiveRate",
  "centralCloseoutSkippedWithGoodReason",
  "centralCloseoutSkippedWithoutReason",
  "centralRunRepeatWindowsRaw",
  "centralRunRepeatWindowsDeduped",
  "repeatedCentralRunsWithFreshValue",
  "repeatedCentralRunsWithoutFreshValue",
  "centralRunInsteadUnjustified",
  "centralRunJustifiedByMultiaccess",
  "centralRunJustifiedByInterface",
  "centralRunJustifiedByCloseout",
  "centralRunJustifiedByRemoteUncontestable",
  "centralRunJustifiedByHqPressure",
  "centralRunJustifiedByRndFreshness",
  "centralRunStalePenaltyApplied",
  "centralPressureNoopDecisions",
  "noFreshCentralWindows",
  "noFreshCentralRunsTaken",
  "noFreshCentralSubstitutions",
  "noFreshCentralSubstitutionRate",
  "noFreshCentralSubstitutionEconomy",
  "noFreshCentralSubstitutionRigUnlock",
  "noFreshCentralSubstitutionRemoteContest",
  "noFreshCentralSubstitutionPressureInstall",
  "noFreshCentralSubstitutionSetupSearch",
  "noFreshCentralSubstitutionEndTurn",
  "noFreshCentralWithBetterAlternative",
  "noFreshCentralWithoutBetterAlternative",
  "staleCentralChosenDespiteEconomy",
  "staleCentralChosenDespiteRigUnlock",
  "staleCentralChosenDespiteRemoteContest",
  "staleCentralChosenDespitePressureInstall",
  "staleCentralAllowedWithReason",
  "staleCentralAllowedCloseout",
  "staleCentralAllowedInterface",
  "staleCentralAllowedMultiaccess",
  "staleCentralAllowedRemoteUncontestable",
  "staleCentralAllowedCentralOpen",
  "staleCentralAllowedNoBetterAction",
  "alternativeChosenAfterStaleCentralPenalty",
  "substitutionLedToProgression",
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
  "remoteTrashRoleRunTax",
  "remoteTrashRoleRemoteCapacity",
  "remoteTrashRoleTagPunish",
  "remoteTrashRoleAmbush",
  "remoteTrashRoleLowValue",
  "remoteTrashDeclined",
  "remoteTrashCostTotal",
  "expensiveRemoteTrashOpportunities",
  "expensiveRemoteTrashTaken",
  "expensiveRemoteTrashDeclined",
  "highImpactRemoteTrashTaken",
  "highImpactRemoteTrashDeferredByBudget",
  "highImpactRemoteTrashSkippedNoThreat",
  "lowValueRemoteTrashSkipped",
  "remoteTrashSpentEarlyGame",
  "runnerCreditsAfterRemoteTrash",
  "remoteTrashDroppedBelowReserve",
  "remoteTrashPreservedReserve",
  "remoteTrashProtectedScoreThreat",
  "remoteTrashWithoutImmediateThreat",
  "remoteTrashCostBucket0To1",
  "remoteTrashCostBucket2To3",
  "remoteTrashCostBucket4To5",
  "remoteTrashCostBucket6Plus",
  "dedicatedTrashCreditsUsed",
  "generalCreditsSpentOnTrash",
  "trashDecisionLeftRunnerUnableToContest",
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
  "runnerEconomyDecisionWindows",
  "runnerLegalEconomyActions",
  "runnerLegalBurstEconomyActions",
  "runnerLegalActionEconomyActions",
  "runnerLegalFinitePoolEconomyActions",
  "runnerLegalLoanDebtEconomyActions",
  "runnerLegalRecurringEconomyActions",
  "runnerLegalResourceEconomyActions",
  "runnerLegalHardwareEconomyActions",
  "runnerEconomyTaken",
  "runnerEconomySkipped",
  "runnerEconomySkippedWhileLowCredits",
  "runnerEconomySkippedWhileKnownUnaffordablePath",
  "runnerEconomySkippedForPressure",
  "runnerEconomySkippedForRemoteContest",
  "runnerEconomySkippedForSetup",
  "runnerEconomySkippedForDraw",
  "runnerEconomySkippedForRun",
  "runnerEconomySkippedForInstallBreaker",
  "runnerEconomySkippedForTrash",
  "runnerEconomySkippedForEndTurn",
  "runnerEconomySkippedForUnknownHigherPriority",
  "runnerLowCreditDecisionWindows",
  "runnerCreditStarvedWithLegalEconomy",
  "runnerCreditStarvedEconomyTaken",
  "runnerCreditStarvedEconomySkipped",
  "runnerKnownUnaffordablePathWithLegalEconomy",
  "runnerEconomyTakenToReachRunReserve",
  "runnerEconomyTakenButStillBelowReserve",
  "runnerEconomySkippedThenUnaffordableRun",
  "runnerRunStartedBelowKnownPathCost",
  "runnerRunStartedAfterSkippingEconomy",
  "runnerEconomyChosenOverFreshCentralPressure",
  "runnerEconomyChosenOverRemoteContest",
  "runnerEconomyChosenOverBreakerInstall",
  "runnerEconomyChosenOverCriticalSetup",
  "runnerEconomyChosenOverRelevantTrash",
  "runnerEconomyChosenWhileRich",
  "runnerEconomyChosenWhilePressureReady",
  "runnerEconomyChosenAsReserveSetup",
  "runnerEconomyChoicePlausible",
  "runnerEconomyChoiceSuspicious",
  "runnerFinitePoolEconomySeen",
  "runnerFinitePoolEconomyTaken",
  "runnerFinitePoolEconomySkipped",
  "runnerFinitePoolEconomyTakenWhilePoolLikelyDepleted",
  "runnerDebtEconomySeen",
  "runnerDebtEconomyTaken",
  "runnerDebtEconomySkipped",
  "runnerDebtEconomyTakenWithoutNeed",
  "runnerEconomyWithDownsideSeen",
  "runnerEconomyWithDownsideTaken",
  "runnerDelayedPenaltyEconomyTaken",
  "runnerMemoryBottleneckDecisionWindows",
  "runnerHandSizeBottleneckDecisionWindows",
  "runnerLegalMemoryHardwareActions",
  "runnerLegalHandSizeActions",
  "runnerMemoryHardwareTaken",
  "runnerHandSizeSupportTaken",
  "runnerMemorySupportSkippedWhileGripHasPrograms",
  "runnerHandSizeSupportSkippedWhileDamageRiskVisible",
  "runnerHardwareSetupChosenOverEconomy",
  "runnerHardwareSetupChosenOverPressure",
  "runnerHandSizeFactUsedForDiagnosis",
  "runnerLegalSearchActions",
  "runnerLegalRecoveryActions",
  "runnerSearchTaken",
  "runnerRecoveryTaken",
  "runnerSearchSkippedWhileMissingBreakerCoverage",
  "runnerRecoverySkippedWhileMissingBreakerCoverage",
  "runnerSearchTakenForBreakerCoverage",
  "runnerRecoveryTakenForBreakerCoverage",
  "runnerSearchOrRecoveryWindowWithNoInstallFollowup",
  "runnerSearchRecoveryChosenOverEconomy",
  "runnerSearchRecoveryChosenOverPressure",
  "runnerEconomyFixGateEligibleStarvedSkip",
  "runnerEconomyFixGateSuspiciousRichEconomy",
  "runnerEconomyFixGateSuspiciousEconomyOverPressure",
  "runnerEconomyFixGateSuspiciousEconomyOverRemoteContest",
  "runnerEconomyFixGateSuspiciousDebtEconomyWithoutNeed",
  "runnerSetupFixGateEligibleMemorySkip",
  "runnerSetupFixGateEligibleSearchRecoverySkip",
  "runnerStarvedEconomySkipWindows",
  "runnerStarvedEconomySkipChosenRun",
  "runnerStarvedEconomySkipChosenDraw",
  "runnerStarvedEconomySkipChosenInstall",
  "runnerStarvedEconomySkipChosenSearchRecovery",
  "runnerStarvedEconomySkipChosenTrash",
  "runnerStarvedEconomySkipChosenEndTurn",
  "runnerStarvedEconomySkipChosenUnknown",
  "runnerStarvedEconomySkipThenUnaffordableRun",
  "runnerStarvedEconomySkipThenFailedRun",
  "runnerStarvedEconomySkipThenNoProgress",
  "runnerStarvedEconomySkipThenEconomyNextDecision",
  "runnerStarvedEconomySkipThenReserveRecovered",
  "runnerStarvedEconomySkipThenProgress",
  "runnerStarvedEconomySkipThenActionLimit",
  "runnerStarvedEconomySkipPlausiblePressure",
  "runnerStarvedEconomySkipPlausibleRemoteContest",
  "runnerStarvedEconomySkipPlausibleCriticalSetup",
  "runnerStarvedEconomySkipPlausibleTrash",
  "runnerStarvedEconomySkipSuspiciousLowValueRun",
  "runnerStarvedEconomySkipSuspiciousDraw",
  "runnerStarvedEconomySkipSuspiciousEndTurn",
  "runnerStarvedEconomySkipSuspiciousUnknown",
  "runnerEconomyFixGateAttributionEligible",
  "runnerEconomyFixGateAttributionBlocked",
  "runnerEconomyFixGateAttributionSuspicious",
  "runnerSearchRecoveryFixGateWindows",
  "runnerSearchRecoveryFixGateLegalSearch",
  "runnerSearchRecoveryFixGateLegalRecovery",
  "runnerSearchRecoveryFixGateMissingWall",
  "runnerSearchRecoveryFixGateMissingCodeGate",
  "runnerSearchRecoveryFixGateMissingSentry",
  "runnerSearchRecoveryFixGateMissingUniversal",
  "runnerSearchRecoveryFixGateMissingSpecial",
  "runnerSearchRecoverySkipChosenEconomy",
  "runnerSearchRecoverySkipChosenRun",
  "runnerSearchRecoverySkipChosenDraw",
  "runnerSearchRecoverySkipChosenInstall",
  "runnerSearchRecoverySkipChosenTrash",
  "runnerSearchRecoverySkipChosenEndTurn",
  "runnerSearchRecoverySkipChosenUnknown",
  "runnerSearchRecoverySkipThenInstallFollowup",
  "runnerSearchRecoverySkipThenCoverageResolved",
  "runnerSearchRecoverySkipThenCoverageStillMissing",
  "runnerSearchRecoverySkipThenKnownUnaffordableRun",
  "runnerSearchRecoverySkipThenNoProgress",
  "runnerSearchRecoveryWindowWithNoInstallFollowup",
  "runnerSearchRecoverySkipPlausibleEconomyReserve",
  "runnerSearchRecoverySkipPlausiblePressure",
  "runnerSearchRecoverySkipPlausibleRemoteContest",
  "runnerSearchRecoverySkipSuspiciousCoverageStillMissing",
  "runnerSearchRecoverySkipSuspiciousNoProgress",
  "runnerSearchRecoverySkipUnclassified",
  "runnerSearchRecoveryFixGateAttributionEligible",
  "runnerSearchRecoveryFixGateAttributionBlocked",
  "runnerSearchRecoveryFixGateAttributionSuspicious",
  "runnerMemoryFixGateWindows",
  "runnerHandSizeFixGateWindows",
  "runnerMemoryFixGateLegalSupport",
  "runnerHandSizeFixGateLegalSupport",
  "runnerMemoryFixGateSkipped",
  "runnerHandSizeFixGateSkipped",
  "runnerMemorySkipChosenEconomy",
  "runnerMemorySkipChosenRun",
  "runnerMemorySkipChosenDraw",
  "runnerMemorySkipChosenInstallNonMemory",
  "runnerMemorySkipChosenSearchRecovery",
  "runnerMemorySkipChosenEndTurn",
  "runnerMemorySkipChosenUnknown",
  "runnerMemorySkipThenMemoryInstalled",
  "runnerMemorySkipThenProgramInstallBlocked",
  "runnerMemorySkipThenCoverageStillMissing",
  "runnerMemorySkipThenNoProgress",
  "runnerHandSizeSkipThenDamageRiskWindow",
  "runnerHandSizeSkipThenDiscardOrDamagePressure",
  "runnerMemorySkipPlausibleEconomyReserve",
  "runnerMemorySkipPlausiblePressure",
  "runnerMemorySkipPlausibleRemoteContest",
  "runnerMemorySkipSuspiciousRigBlocked",
  "runnerMemorySkipSuspiciousNoProgress",
  "runnerMemorySkipUnclassified",
  "runnerMemoryFixGateAttributionEligible",
  "runnerMemoryFixGateAttributionBlocked",
  "runnerMemoryFixGateAttributionSuspicious",
  "runnerSetupAttributionWindows",
  "runnerSetupAttributionSuspicious",
  "runnerSetupAttributionBlocked",
  "runnerSetupAttributionUnclassified",
  "runnerSetupAttributionByKindStarvedEconomy",
  "runnerSetupAttributionByKindSearchRecovery",
  "runnerSetupAttributionByKindMemory",
  "runnerSetupAttributionByKindHandSize",
  "runnerSetupRecommendedFixKindNone",
  "runnerSetupRecommendedFixKindEconomyStarvedSkip",
  "runnerSetupRecommendedFixKindSearchRecovery",
  "runnerSetupRecommendedFixKindMemorySetup",
  "runnerSetupRecommendedFixKindHandSizeSetup",
  "runnerSetupRecommendedFixKindMixedNeedsMoreDiagnosis",
  "runnerRigInstallActions",
  "runnerRemoteTrashOpportunities",
  "runnerRemoteTrashTaken",
  "runnerRemoteTrashDecisionWindows",
  "runnerRemoteTrashLegalActions",
  "runnerRemoteTrashSkipped",
  "runnerRemoteTrashSkippedAffordableRelevant",
  "runnerRemoteTrashSkippedAssetEconomy",
  "runnerRemoteTrashSkippedFinitePoolEconomy",
  "runnerRemoteTrashSkippedWithCorpValueRemaining",
  "runnerRemoteTrashSkippedDueToReserve",
  "runnerRemoteTrashSkippedDueToLowCredits",
  "runnerRemoteTrashSkippedDueToUnknownHigherPriority",
  "runnerBbsWhisperingCampaignAccessed",
  "runnerBbsWhisperingCampaignTrashLegal",
  "runnerBbsWhisperingCampaignTrashTaken",
  "runnerBbsWhisperingCampaignTrashSkipped",
  "runnerBbsWhisperingCampaignTrashSkippedAffordable",
  "runnerBbsWhisperingCampaignTrashSkippedWithCreditsRemaining",
  "runnerFinitePoolAssetAccessed",
  "runnerFinitePoolAssetTrashLegal",
  "runnerFinitePoolAssetTrashTaken",
  "runnerFinitePoolAssetTrashSkippedAffordable",
  "runnerRepeatAccessKnownRemote",
  "runnerRepeatAccessKnownTrashableRemote",
  "runnerRepeatAccessKnownTrashableRemoteWithoutTrash",
  "runnerRepeatRunOnSameRemoteAfterDecliningTrash",
  "runnerRepeatRunOnSameRemoteNoNewInfo",
  "runnerRepeatRemoteAccessNoProgress",
  "runnerRepeatRemoteRunSuppressedAfterNoTrash",
  "runnerRepeatRemoteRunPenalizedAfterNoTrash",
  "runnerRemoteTrashFixGateEligible",
  "runnerRemoteTrashFixGateBlockedByReserve",
  "runnerRemoteTrashFixGateBlockedByLowCredits",
  "runnerRemoteTrashFixGateBlockedByHigherThreat",
  "runnerRemoteTrashFixGateSuspicious",
  "runnerRepeatRemoteNoTrashFixGateSuspicious",
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
  "runnerRunStartedAgainstKnownUnpayableFullPath",
  "runnerRunStartedAgainstKnownUnpayableRemotePath",
  "runnerRunStartedAgainstKnownUnpayableCentralPath",
  "runnerKnownPathAccessReachable",
  "runnerKnownPathAccessNotReachable",
  "runnerKnownPathBlockedByUnbreakableIce",
  "runnerKnownPathBlockedByMissingCoverage",
  "runnerKnownPathBlockedByKnownEtr",
  "runnerKnownPathBlockedByWall",
  "runnerKnownPathBlockedByCodeGate",
  "runnerKnownPathBlockedBySentry",
  "runnerRunStartedAgainstKnownUnbreakablePath",
  "runnerRunStartedAgainstKnownUnbreakableCentralPath",
  "runnerRunStartedAgainstKnownUnbreakableRemotePath",
  "runnerKnownUnbreakableRemoteTraceSampled",
  "runnerKnownUnbreakableRemoteTrueBug",
  "runnerKnownUnbreakableRemoteForceRezOrProbeMisclassified",
  "runnerKnownUnbreakableRemoteStateChanged",
  "runnerKnownUnbreakableRemoteCoverageRepairMissing",
  "runnerKnownUnbreakableRemoteMetricArtifact",
  "runnerKnownUnbreakableRemoteUnclassified",
  "runnerKnownUnbreakableRemoteRunSuppressed",
  "runnerKnownUnbreakableRemoteRunPenalized",
  "runnerKnownUnbreakableRemoteCoverageRepairTaken",
  "runnerKnownUnbreakableRemoteCoverageRepairAvailable",
  "runnerKnownUnbreakableRemoteRunTakenDespiteGate",
  "runnerMultiaccessValueAvailable",
  "runnerMultiaccessValueUsed",
  "runnerMultiaccessValueSuppressedNoAccess",
  "runnerCentralPressureSuppressedNoAccess",
  "runnerHqInterfaceSuppressedNoAccess",
  "runnerRndInterfaceSuppressedNoAccess",
  "runnerRepeatKnownUnbreakableRunSuppressed",
  "runnerRepeatKnownUnbreakableRunPenalized",
  "runnerRepeatKnownUnbreakableCentralRunSuppressed",
  "runnerRepeatKnownUnbreakableRemoteRunSuppressed",
  "runnerRepeatKnownUnbreakableRunTakenDespiteSuppression",
  "runnerCoverageRepairIntentCandidates",
  "runnerCoverageRepairIntentSearchTaken",
  "runnerCoverageRepairIntentRecoveryTaken",
  "runnerCoverageRepairIntentInstallTaken",
  "runnerCoverageRepairIntentDrawOrEconomyTaken",
  "runnerCoverageRepairIntentSatisfied",
  "runnerCoverageRepairIntentNoFollowup",
  "runnerCoverageRepairIntentBlockedByHiddenTargetUncertain",
  "runnerDataWallHqNoAccessSuppressed",
  "runnerDataWallHqRepeatSuppressed",
  "runnerHqInterfaceDataWallValueSuppressed",
  "runnerKnownPathCanReachAccessFalse",
  "runnerKnownPathCanBreakNextIceButNotFullPath",
  "runnerRunAbortedAfterKnownUnpayableLaterIce",
  "runnerRunSpentCreditsBeforeKnownUnbreakableLaterIce",
  "runnerRunCostQuoteUnderestimatedFullPath",
  "runnerRepeatRunOnKnownUnpayablePath",
  "runnerRepeatRunOnKnownUnpayableRemotePath",
  "runnerRunCouldOnlyForceRezButNotAccess",
  "runnerRunAllowedAsFirstProbeUnknownIce",
  "runnerRunSuppressedAsKnownNoAccess",
  "runnerRunPenalizedAsKnownNoAccess",
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
  const repeatRemoteNoTrashMetrics =
    summarizeRunnerRepeatRemoteNoTrashMetrics(summaries);
  const runnerRemoteTrashDecisionWindows = actionSequence.filter(
    (entry) => entry.runnerRemoteAccessWithTrashableCard === true,
  ).length;
  const runnerRemoteTrashLegalActions = actionSequence.reduce(
    (sum, entry) => sum + (entry.runnerRemoteTrashLegalActionCount ?? 0),
    0,
  );
  const runnerRemoteTrashSkipped = actionSequence.filter(
    (entry) =>
      entry.runnerRemoteAccessWithTrashableCard === true &&
      entry.runnerRemoteTrashTaken !== true,
  ).length;
  const runnerRemoteTrashSkippedAffordableRelevant =
    skippedAffordableRelevantRemoteTrash;
  const runnerRemoteTrashSkippedAssetEconomy = actionSequence.filter(
    (entry) =>
      entry.runnerRemoteTrashAssetEconomy === true &&
      entry.runnerRemoteTrashTaken !== true,
  ).length;
  const runnerRemoteTrashSkippedFinitePoolEconomy = actionSequence.filter(
    (entry) =>
      entry.runnerRemoteTrashFinitePoolEconomy === true &&
      entry.runnerRemoteTrashTaken !== true,
  ).length;
  const runnerRemoteTrashSkippedWithCorpValueRemaining = actionSequence.filter(
    (entry) =>
      (entry.runnerRemoteTrashCorpValueRemaining ?? 0) > 0 &&
      entry.runnerRemoteTrashTaken !== true,
  ).length;
  const runnerRemoteTrashSkippedDueToReserve = actionSequence.filter(
    (entry) => entry.runnerRemoteTrashFixGateBlockedByReserve === true,
  ).length;
  const runnerRemoteTrashSkippedDueToLowCredits = actionSequence.filter(
    (entry) => entry.runnerRemoteTrashFixGateBlockedByLowCredits === true,
  ).length;
  const runnerRemoteTrashSkippedDueToUnknownHigherPriority =
    actionSequence.filter(
      (entry) =>
        entry.runnerRemoteTrashFixGateEligible === true &&
        entry.runnerRemoteTrashFixGateBlockedByReserve !== true &&
        entry.runnerRemoteTrashFixGateBlockedByLowCredits !== true &&
        entry.runnerRemoteTrashFixGateBlockedByHigherThreat !== true &&
        entry.runnerRemoteTrashTaken !== true,
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
  const centralCloseoutRepeatMetrics =
    summarizeCentralCloseoutRepeatMetrics(summaries);
  const planConversionMetrics = summarizePlanConversionMetrics(summaries);
  const strategicLineMetrics = summarizeStrategicLineMetrics(summaries);
  const corpEffectiveRemoteSafetyMetrics =
    summarizeCorpEffectiveRemoteSafetyMetrics(summaries);
  const corpScoreConversionMetrics =
    summarizeCorpUnsafeRemoteScoreConversionMetrics(summaries);
  const corpIcePortfolioMetrics = summarizeCorpIcePortfolioMetrics(summaries);
  const actionLimitEndgameMetrics =
    summarizeActionLimitEndgameMetrics(summaries);
  const tagPunishWindowMetrics = summarizeTagPunishWindowMetrics(summaries);
  const breakerOntologyMetrics = summarizeBreakerOntologyMetrics(summaries);
  const remoteRoleOntologyMetrics =
    summarizeRemoteRoleOntologyMetrics(summaries);
  const runnerSetupAttributionMetrics =
    summarizeRunnerSetupAttributionMetrics(summaries);
  const runnerHandUseOpportunityWindows = actionSequence.filter(
    (entry) => entry.runnerHandUseOpportunity === true,
  ).length;
  const runnerHandUseActionsTaken = actionSequence.filter(
    (entry) => entry.runnerHandUseActionTaken === true,
  ).length;
  const runnerCreditEntries = actionSequence.filter(
    (entry) =>
      entry.side === "runner" && typeof entry.runnerCreditsBefore === "number",
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
  const corpFutureRunIceEntries = actionSequence.filter(
    (entry) => entry.corpFutureRunIceInstalled === true,
  );
  const corpScoreTerminalEntries = actionSequence.filter(
    (entry) => entry.corpScoreTerminalWindow === true,
  );
  const corpEconomyBeforeScoreMetrics =
    summarizeCorpEconomyBeforeScoreMetrics(summaries);
  const hqMemoryEntries = actionSequence.filter(
    (entry) =>
      entry.side === "runner" && typeof entry.hqKnownCards === "number",
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
    ...planConversionMetrics,
    ...strategicLineMetrics,
    ...corpEffectiveRemoteSafetyMetrics,
    ...corpScoreConversionMetrics,
    ...corpIcePortfolioMetrics,
    ...actionLimitEndgameMetrics,
    ...tagPunishWindowMetrics,
    ...breakerOntologyMetrics,
    ...remoteRoleOntologyMetrics,
    ...runnerSetupAttributionMetrics,
    ...corpEconomyBeforeScoreMetrics,
    corpScoreTerminalWindow: corpScoreTerminalEntries.length,
    corpScoreTerminalWindowScoreLegal: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalWindowScoreLegal === true,
    ).length,
    corpScoreTerminalWindowAdvanceToScoreLegal: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalWindowAdvanceToScoreLegal === true,
    ).length,
    corpScoreTerminalWindowAgendaInstallLegal: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalWindowAgendaInstallLegal === true,
    ).length,
    corpScoreTerminalWindowProtectedRemoteReady:
      corpScoreTerminalEntries.filter(
        (entry) => entry.corpScoreTerminalWindowProtectedRemoteReady === true,
      ).length,
    corpScoreTerminalWindowRemoteContestLow: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalWindowRemoteContestLow === true,
    ).length,
    corpScoreTerminalWindowCreditsSufficient: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalWindowCreditsSufficient === true,
    ).length,
    corpScoreTerminalWindowRunnerAccessThreatHigh:
      corpScoreTerminalEntries.filter(
        (entry) => entry.corpScoreTerminalWindowRunnerAccessThreatHigh === true,
      ).length,
    corpScoreTerminalScoreTaken: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalScoreTaken === true,
    ).length,
    corpScoreTerminalAdvanceTaken: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalAdvanceTaken === true,
    ).length,
    corpScoreTerminalAgendaInstalled: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalAgendaInstalled === true,
    ).length,
    corpScoreTerminalSkipped: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalSkipped === true,
    ).length,
    corpScoreTerminalSkippedForProtection: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalSkippedForProtection === true,
    ).length,
    corpScoreTerminalSkippedForEconomy: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalSkippedForEconomy === true,
    ).length,
    corpScoreTerminalSkippedForDraw: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalSkippedForDraw === true,
    ).length,
    corpScoreTerminalSkippedForInstallIce: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalSkippedForInstallIce === true,
    ).length,
    corpScoreTerminalSkippedForInstallAssetOrUpgrade:
      corpScoreTerminalEntries.filter(
        (entry) =>
          entry.corpScoreTerminalSkippedForInstallAssetOrUpgrade === true,
      ).length,
    corpScoreTerminalSkippedForHqProtection: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalSkippedForHqProtection === true,
    ).length,
    corpScoreTerminalSkippedForRndProtection: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalSkippedForRndProtection === true,
    ).length,
    corpScoreTerminalSkippedForRemotePortfolio: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalSkippedForRemotePortfolio === true,
    ).length,
    corpScoreTerminalSkippedForUnknownHigherPriority:
      corpScoreTerminalEntries.filter(
        (entry) =>
          entry.corpScoreTerminalSkippedForUnknownHigherPriority === true,
      ).length,
    ...corpScoreTerminalFollowupMetrics(actionSequence),
    corpScoreConversionFixGateEligible: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreConversionFixGateEligible === true,
    ).length,
    corpScoreConversionFixGateBlockedByCheapContest:
      corpScoreTerminalEntries.filter(
        (entry) =>
          entry.corpScoreConversionFixGateBlockedByCheapContest === true,
      ).length,
    corpScoreConversionFixGateBlockedByCredits: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreConversionFixGateBlockedByCredits === true,
    ).length,
    corpScoreConversionFixGateBlockedByRunnerContest:
      corpScoreTerminalEntries.filter(
        (entry) =>
          entry.corpScoreConversionFixGateBlockedByRunnerContest === true,
      ).length,
    corpScoreConversionFixGateBlockedByHqThreat:
      corpScoreTerminalEntries.filter(
        (entry) => entry.corpScoreConversionFixGateBlockedByHqThreat === true,
      ).length,
    corpScoreConversionFixGateSuspiciousProtectionLoop:
      corpScoreTerminalEntries.filter(
        (entry) =>
          entry.corpScoreConversionFixGateSuspiciousProtectionLoop === true,
      ).length,
    corpScoreConversionFixGateSuspiciousEconomyLoop:
      corpScoreTerminalEntries.filter(
        (entry) =>
          entry.corpScoreConversionFixGateSuspiciousEconomyLoop === true,
      ).length,
    corpScoreConversionFixGateSuspiciousDraw: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreConversionFixGateSuspiciousDraw === true,
    ).length,
    corpScoreConversionFixGateSuspiciousRemotePortfolio:
      corpScoreTerminalEntries.filter(
        (entry) =>
          entry.corpScoreConversionFixGateSuspiciousRemotePortfolio === true,
      ).length,
    corpScoreConversionFixGateSuspiciousUnknown:
      corpScoreTerminalEntries.filter(
        (entry) => entry.corpScoreConversionFixGateSuspiciousUnknown === true,
      ).length,
    corpFutureRunIceInstallOpportunities: actionSequence.filter(
      (entry) => entry.corpFutureRunIceInstallOpportunity === true,
    ).length,
    corpFutureRunIceInstalled: corpFutureRunIceEntries.length,
    corpFutureRunIceInstalledAsInnermost: corpFutureRunIceEntries.filter(
      (entry) => entry.corpFutureRunIceInstalledAsInnermost === true,
    ).length,
    corpFutureRunIceInstalledAsOutermost: corpFutureRunIceEntries.filter(
      (entry) => entry.corpFutureRunIceInstalledAsOutermost === true,
    ).length,
    corpFutureRunIceInstalledWithLaterIce: corpFutureRunIceEntries.filter(
      (entry) => entry.corpFutureRunIceInstalledWithLaterIce === true,
    ).length,
    corpFutureRunIceInstalledWithoutLaterIce: corpFutureRunIceEntries.filter(
      (entry) => entry.corpFutureRunIceInstalledWithoutLaterIce === true,
    ).length,
    corpFutureRunIceInstalledOnEmptyServer: corpFutureRunIceEntries.filter(
      (entry) => entry.corpFutureRunIceInstalledOnEmptyServer === true,
    ).length,
    corpFutureRunIceInstalledFirstOnEmptyServer: corpFutureRunIceEntries.filter(
      (entry) => entry.corpFutureRunIceInstalledFirstOnEmptyServer === true,
    ).length,
    corpFutureRunIceInstalledAfterInnerIceExists:
      corpFutureRunIceEntries.filter(
        (entry) => entry.corpFutureRunIceInstalledAfterInnerIceExists === true,
      ).length,
    corpFutureRunIceInstalledAsDeadEffect: corpFutureRunIceEntries.filter(
      (entry) => entry.corpFutureRunIceInstalledAsDeadEffect === true,
    ).length,
    corpFutureRunIceInstalledAsLiveEffect: corpFutureRunIceEntries.filter(
      (entry) => entry.corpFutureRunIceInstalledAsLiveEffect === true,
    ).length,
    corpNextIceEffectInstalledLast: corpFutureRunIceEntries.filter(
      (entry) => entry.corpNextIceEffectInstalledLast === true,
    ).length,
    corpIceOrderFutureEffectDead: corpFutureRunIceEntries.filter(
      (entry) => entry.corpIceOrderFutureEffectDead === true,
    ).length,
    corpIceOrderFutureEffectLive: corpFutureRunIceEntries.filter(
      (entry) => entry.corpIceOrderFutureEffectLive === true,
    ).length,
    corpMultiIceInstallOrderFutureEffectDead:
      countCorpMultiIceInstallOrderFutureEffectDead(actionSequence),
    corpMultiIceInstallOrderOptimized:
      countCorpMultiIceInstallOrderOptimized(actionSequence),
    corpBallAndChainInstalledInnermost: corpFutureRunIceEntries.filter(
      (entry) => entry.corpBallAndChainInstalledInnermost === true,
    ).length,
    corpBallAndChainInstalledWithoutLaterIce: corpFutureRunIceEntries.filter(
      (entry) => entry.corpBallAndChainInstalledWithoutLaterIce === true,
    ).length,
    corpBallAndChainInstalledWithLaterIce: corpFutureRunIceEntries.filter(
      (entry) => entry.corpBallAndChainInstalledWithLaterIce === true,
    ).length,
    corpCanisInstalledWithoutLaterIce: corpFutureRunIceEntries.filter(
      (entry) => entry.corpCanisInstalledWithoutLaterIce === true,
    ).length,
    corpBolterOrDataDartsInstalledWithoutNextIce:
      corpFutureRunIceEntries.filter(
        (entry) => entry.corpBolterOrDataDartsInstalledWithoutNextIce === true,
      ).length,
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
      ...runnerRuns.map(
        (entry) => entry.runnerCentralRunStreakWithoutValue ?? 0,
      ),
    ),
    centralRunStartedWithInsufficientPostRunReserve: runnerRuns.filter(
      (entry) =>
        entry.runnerCentralRunStartedWithInsufficientPostRunReserve === true,
    ).length,
    hqKnownCards: Math.max(
      0,
      ...hqMemoryEntries.map((entry) => entry.hqKnownCards ?? 0),
    ),
    hqUnknownCards: Math.max(
      0,
      ...hqMemoryEntries.map((entry) => entry.hqUnknownCards ?? 0),
    ),
    hqKnownFraction: round(
      averageNumber(
        hqMemoryEntries
          .map((entry) => entry.hqKnownFraction)
          .filter((value): value is number => typeof value === "number"),
      ),
    ),
    hqFullyKnown: hqMemoryEntries.filter((entry) => entry.hqFullyKnown === true)
      .length,
    hqKnownAgendaCount: Math.max(
      0,
      ...hqMemoryEntries.map((entry) => entry.hqKnownAgendaCount ?? 0),
    ),
    hqKnownNonAgendaCount: Math.max(
      0,
      ...hqMemoryEntries.map((entry) => entry.hqKnownNonAgendaCount ?? 0),
    ),
    hqKnownAgendaPoints: Math.max(
      0,
      ...hqMemoryEntries.map((entry) => entry.hqKnownAgendaPoints ?? 0),
    ),
    hqMemoryInvalidatedByDraw: hqMemoryEntries.filter(
      (entry) => entry.hqMemoryInvalidatedByDraw === true,
    ).length,
    hqMemoryInvalidatedByInstall: hqMemoryEntries.filter(
      (entry) => entry.hqMemoryInvalidatedByInstall === true,
    ).length,
    hqMemoryInvalidatedByPlay: hqMemoryEntries.filter(
      (entry) => entry.hqMemoryInvalidatedByPlay === true,
    ).length,
    hqMemoryInvalidatedByDiscard: hqMemoryEntries.filter(
      (entry) => entry.hqMemoryInvalidatedByDiscard === true,
    ).length,
    hqMemoryInvalidatedByShuffleOrReorder: hqMemoryEntries.filter(
      (entry) => entry.hqMemoryInvalidatedByShuffleOrReorder === true,
    ).length,
    hqRunValueFromKnownCards: Math.max(
      0,
      ...runnerRuns.map((entry) => entry.hqRunValueFromKnownCards ?? 0),
    ),
    hqRunValueFromUnknownCards: Math.max(
      0,
      ...runnerRuns.map((entry) => entry.hqRunValueFromUnknownCards ?? 0),
    ),
    hqRunSuppressedBecauseFullyKnownNoAgenda: runnerRuns.filter(
      (entry) => entry.hqRunSuppressedBecauseFullyKnownNoAgenda === true,
    ).length,
    hqRunBoostedBecauseKnownAgenda: runnerRuns.filter(
      (entry) => entry.hqRunBoostedBecauseKnownAgenda === true,
    ).length,
    hqRunBoostedBecauseUnknownCardsRemain: runnerRuns.filter(
      (entry) => entry.hqRunBoostedBecauseUnknownCardsRemain === true,
    ).length,
    hqRunRepeatedWithoutNewHqInfo: runnerRuns.filter(
      (entry) => entry.hqRunRepeatedWithoutNewHqInfo === true,
    ).length,
    knownRndTopCard: actionSequence.filter(
      (entry) => entry.knownRndTopCard === true,
    ).length,
    knownRndTopMovedToHq: actionSequence.filter(
      (entry) => entry.knownRndTopMovedToHq === true,
    ).length,
    knownRndTopInvalidated: actionSequence.filter(
      (entry) => entry.knownRndTopInvalidated === true,
    ).length,
    hqKnownFromRndDraw: hqMemoryEntries.filter(
      (entry) => entry.hqKnownFromRndDraw === true,
    ).length,
    hqRunBoostedByRndToHqAgenda: runnerRuns.filter(
      (entry) => entry.hqRunBoostedByRndToHqAgenda === true,
    ).length,
    hqRunSuppressedByRndToHqNonAgenda: runnerRuns.filter(
      (entry) => entry.hqRunSuppressedByRndToHqNonAgenda === true,
    ).length,
    rndAccesses: actionSequence.filter(
      (entry) =>
        entry.side === "runner" &&
        entry.actionType === "access_card" &&
        entry.targetServerId === "rd",
    ).length,
    rndAccessRemovedTopCard: actionSequence.filter(
      (entry) => entry.rndAccessRemovedTopCard === true,
    ).length,
    rndAccessStoleAgenda: actionSequence.filter(
      (entry) => entry.rndAccessStoleAgenda === true,
    ).length,
    rndAccessTrashedCard: actionSequence.filter(
      (entry) => entry.rndAccessTrashedCard === true,
    ).length,
    rndAccessLeftTopCardUnchanged: actionSequence.filter(
      (entry) => entry.rndAccessLeftTopCardUnchanged === true,
    ).length,
    rndTopFreshenedByRunnerAccess: actionSequence.filter(
      (entry) => entry.rndTopFreshenedByRunnerAccess === true,
    ).length,
    rndKnownTopAdvancedAfterAccess: actionSequence.filter(
      (entry) => entry.rndKnownTopAdvancedAfterAccess === true,
    ).length,
    rndKnownTopSequenceAdvanced: actionSequence.filter(
      (entry) => entry.rndKnownTopSequenceAdvanced === true,
    ).length,
    rndRepeatRunAfterTopRemoved: runnerRuns.filter(
      (entry) => entry.rndRepeatRunAfterTopRemoved === true,
    ).length,
    rndRepeatRunAfterTopUnchanged: runnerRuns.filter(
      (entry) => entry.rndRepeatRunAfterTopUnchanged === true,
    ).length,
    rndRepeatRunBoostedByFreshTop: runnerRuns.filter(
      (entry) => entry.rndRepeatRunBoostedByFreshTop === true,
    ).length,
    rndRepeatRunSuppressedBecauseKnownStaleTop: runnerRuns.filter(
      (entry) => entry.rndRepeatRunSuppressedBecauseKnownStaleTop === true,
    ).length,
    rndRepeatRunBoostedByKnownAgendaTop: runnerRuns.filter(
      (entry) => entry.rndRepeatRunBoostedByKnownAgendaTop === true,
    ).length,
    rndRepeatRunSuppressedBecauseKnownNonAgendaTop: runnerRuns.filter(
      (entry) => entry.rndRepeatRunSuppressedBecauseKnownNonAgendaTop === true,
    ).length,
    rndFreshTopPressureOpportunity: actionSequence.filter(
      (entry) => entry.rndFreshTopPressureOpportunity === true,
    ).length,
    rndFreshTopPressureTaken: runnerRuns.filter(
      (entry) => entry.rndFreshTopPressureTaken === true,
    ).length,
    rndFreshTopPressureSkipped: actionSequence.filter(
      (entry) => entry.rndFreshTopPressureSkipped === true,
    ).length,
    rndStaleTopRepeatMistake: runnerRuns.filter(
      (entry) => entry.rndStaleTopRepeatMistake === true,
    ).length,
    rndAccessNoValueRepeatStale: runnerRuns.filter(
      (entry) => entry.rndAccessNoValueRepeatStale === true,
    ).length,
    rndCloseoutOpportunityAfterTopRemoved: actionSequence.filter(
      (entry) => entry.rndCloseoutOpportunityAfterTopRemoved === true,
    ).length,
    knownRemoteCards: Math.max(
      0,
      ...actionSequence.map((entry) => entry.knownRemoteCards ?? 0),
    ),
    knownRemoteAgendas: Math.max(
      0,
      ...actionSequence.map((entry) => entry.knownRemoteAgendas ?? 0),
    ),
    knownRemoteTrashableCards: Math.max(
      0,
      ...actionSequence.map((entry) => entry.knownRemoteTrashableCards ?? 0),
    ),
    remoteMemoryRetainedAfterAccess: actionSequence.filter(
      (entry) => entry.remoteMemoryRetainedAfterAccess === true,
    ).length,
    remoteMemoryInvalidatedByInstallOrMove: actionSequence.filter(
      (entry) => entry.remoteMemoryInvalidatedByInstallOrMove === true,
    ).length,
    remoteRunBoostedByKnownRemoteAgenda: runnerRuns.filter(
      (entry) => entry.remoteRunBoostedByKnownRemoteAgenda === true,
    ).length,
    remoteRunSuppressedByKnownLowValueRemote: runnerRuns.filter(
      (entry) => entry.remoteRunSuppressedByKnownLowValueRemote === true,
    ).length,
    remoteTrashBoostedByKnownRemoteTrashable: runnerRuns.filter(
      (entry) => entry.remoteTrashBoostedByKnownRemoteTrashable === true,
    ).length,
    knownUnrezzedIceFromExpose: Math.max(
      0,
      ...actionSequence.map((entry) => entry.knownUnrezzedIceFromExpose ?? 0),
    ),
    knownUnrezzedIceRetained: actionSequence.filter(
      (entry) => entry.knownUnrezzedIceRetained === true,
    ).length,
    knownUnrezzedIceInvalidated: actionSequence.filter(
      (entry) => entry.knownUnrezzedIceInvalidated === true,
    ).length,
    runCostAdjustedByKnownUnrezzedIce: Math.max(
      0,
      ...runnerRuns.map(
        (entry) => entry.runCostAdjustedByKnownUnrezzedIce ?? 0,
      ),
    ),
    jackOutInfluencedByKnownUnrezzedIce: actionSequence.filter(
      (entry) => entry.jackOutInfluencedByKnownUnrezzedIce === true,
    ).length,
    rigPlanInfluencedByKnownUnrezzedIce: actionSequence.filter(
      (entry) => entry.rigPlanInfluencedByKnownUnrezzedIce === true,
    ).length,
    runnerMissingBreakerCoverageByType: Math.max(
      0,
      ...actionSequence.map(
        (entry) => entry.runnerMissingBreakerCoverageByType ?? 0,
      ),
    ),
    runnerVisibleIceBlockingByType: Math.max(
      0,
      ...actionSequence.map(
        (entry) => entry.runnerVisibleIceBlockingByType ?? 0,
      ),
    ),
    runnerKnownIceBlockingByType: Math.max(
      0,
      ...actionSequence.map((entry) => entry.runnerKnownIceBlockingByType ?? 0),
    ),
    runnerPathBlockedByMissingCoverage: actionSequence.filter(
      (entry) => entry.runnerPathBlockedByMissingCoverage === true,
    ).length,
    runnerInstallableBreakerForBlockedPath: actionSequence.filter(
      (entry) => entry.runnerInstallableBreakerForBlockedPath === true,
    ).length,
    runnerSearchCardAvailableForMissingBreaker: actionSequence.filter(
      (entry) => entry.runnerSearchCardAvailableForMissingBreaker === true,
    ).length,
    runnerSearchCardUsedForMissingBreaker: actionSequence.filter(
      (entry) => entry.runnerSearchCardUsedForMissingBreaker === true,
    ).length,
    runnerSearchCardAvailableButUnused: actionSequence.filter(
      (entry) => entry.runnerSearchCardAvailableButUnused === true,
    ).length,
    runnerTutorConvertedToBreakerInstall: actionSequence.filter(
      (entry) => entry.runnerTutorConvertedToBreakerInstall === true,
    ).length,
    runnerTutorConvertedToUsefulRun: countRunnerCoverageConversions(
      actionSequence,
      (entry) => entry.runnerSearchCardUsedForMissingBreaker === true,
    ),
    runnerBreakerInstallConvertedToUsefulRun: countRunnerCoverageConversions(
      actionSequence,
      (entry) => entry.runnerCoverageImproved === true,
    ),
    runnerCoverageImproved: actionSequence.filter(
      (entry) => entry.runnerCoverageImproved === true,
    ).length,
    runnerCoverageReadyButNoPressure: actionSequence.filter(
      (entry) => entry.runnerCoverageReadyButNoPressure === true,
    ).length,
    runnerSetupContinuedAfterCoverageReady: actionSequence.filter(
      (entry) => entry.runnerSetupContinuedAfterCoverageReady === true,
    ).length,
    runnerPressureReadyWindows: actionSequence.filter(
      (entry) => entry.runnerPressureReadyWindow === true,
    ).length,
    runnerPressureReadyTrue: actionSequence.filter(
      (entry) => entry.runnerPressureReadyTrue === true,
    ).length,
    runnerPressureReadyFalsePositive: actionSequence.filter(
      (entry) => entry.runnerPressureReadyFalsePositive === true,
    ).length,
    runnerPressureReadyByTargetHq: actionSequence.filter(
      (entry) => entry.runnerPressureReadyByTargetHq === true,
    ).length,
    runnerPressureReadyByTargetRnd: actionSequence.filter(
      (entry) => entry.runnerPressureReadyByTargetRnd === true,
    ).length,
    runnerPressureReadyByTargetArchives: actionSequence.filter(
      (entry) => entry.runnerPressureReadyByTargetArchives === true,
    ).length,
    runnerPressureReadyByTargetRemote: actionSequence.filter(
      (entry) => entry.runnerPressureReadyByTargetRemote === true,
    ).length,
    runnerSetupContinuedAfterPressureReady: actionSequence.filter(
      (entry) => entry.runnerSetupContinuedAfterPressureReady === true,
    ).length,
    runnerPressureTakenAfterCoverageReady: actionSequence.filter(
      (entry) => entry.runnerPressureTakenAfterCoverageReady === true,
    ).length,
    runnerPressureSkippedAfterCoverageReady: actionSequence.filter(
      (entry) => entry.runnerPressureSkippedAfterCoverageReady === true,
    ).length,
    runnerPressureSkippedInsufficientCredits: actionSequence.filter(
      (entry) => entry.runnerPressureSkippedReason === "insufficient_credits",
    ).length,
    runnerPressureSkippedMissingPostRunReserve: actionSequence.filter(
      (entry) =>
        entry.runnerPressureSkippedReason === "missing_post_run_reserve",
    ).length,
    runnerPressureSkippedStaleCentral: actionSequence.filter(
      (entry) => entry.runnerPressureSkippedReason === "stale_central",
    ).length,
    runnerPressureSkippedRemoteTooDangerous: actionSequence.filter(
      (entry) => entry.runnerPressureSkippedReason === "remote_too_dangerous",
    ).length,
    runnerPressureSkippedNoValuableTarget: actionSequence.filter(
      (entry) => entry.runnerPressureSkippedReason === "no_valuable_target",
    ).length,
    runnerPressureSkippedBetterImmediateAction: actionSequence.filter(
      (entry) =>
        entry.runnerPressureSkippedReason === "better_immediate_action",
    ).length,
    runnerCoverageImprovedThenPressureWithin1:
      countRunnerPressureWithinOwnActions(
        actionSequence,
        (entry) => entry.runnerCoverageImproved === true,
        1,
      ),
    runnerCoverageImprovedThenPressureWithin2:
      countRunnerPressureWithinOwnActions(
        actionSequence,
        (entry) => entry.runnerCoverageImproved === true,
        2,
      ),
    runnerCoverageImprovedThenPressureWithin3:
      countRunnerPressureWithinOwnActions(
        actionSequence,
        (entry) => entry.runnerCoverageImproved === true,
        3,
      ),
    runnerEconomyReserveReachedThenPressureWithin2:
      countRunnerPressureWithinOwnActions(
        actionSequence,
        (entry) => entry.runnerEconomyActionTaken === true,
        2,
      ),
    runnerSearchTutorThenPressureWithin3: countRunnerPressureWithinOwnActions(
      actionSequence,
      (entry) => entry.runnerSearchCardUsedForMissingBreaker === true,
      3,
    ),
    runnerSetupLoopAfterPressureReady: actionSequence.filter(
      (entry) => entry.runnerSetupLoopAfterPressureReady === true,
    ).length,
    runnerPhaseExitBlockedByCost: actionSequence.filter(
      (entry) => entry.runnerPhaseExitBlockedByCost === true,
    ).length,
    runnerPhaseExitBlockedByCoverage: actionSequence.filter(
      (entry) => entry.runnerPhaseExitBlockedByCoverage === true,
    ).length,
    runnerPhaseExitBlockedByTargetValue: actionSequence.filter(
      (entry) => entry.runnerPhaseExitBlockedByTargetValue === true,
    ).length,
    runnerProbeRevealedIceThenSearchedBreaker: actionSequence.filter(
      (entry) => entry.runnerProbeRevealedIceThenSearchedBreaker === true,
    ).length,
    runnerProbeRevealedIceButDidNotReact: actionSequence.filter(
      (entry) => entry.runnerProbeRevealedIceButDidNotReact === true,
    ).length,
    runnerSetupBreakerSearchStalled: actionSequence.filter(
      (entry) => entry.runnerSetupBreakerSearchStalled === true,
    ).length,
    runnerSetupEconomyStalled: actionSequence.filter(
      (entry) => entry.runnerSetupEconomyStalled === true,
    ).length,
    runnerPhaseExitToPressure: actionSequence.filter(
      (entry) => entry.runnerPhaseExitToPressure === true,
    ).length,
    ...centralCloseoutRepeatMetrics,
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
    remoteTrashRoleRunTax: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashRole === "run_tax",
    ).length,
    remoteTrashRoleRemoteCapacity: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashRole === "remote_capacity",
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
    remoteTrashDeclined: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashDeclined === true,
    ).length,
    remoteTrashCostTotal: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerRemoteTrashCost ?? 0),
      0,
    ),
    expensiveRemoteTrashOpportunities: actionSequence.filter(
      (entry) => entry.runnerExpensiveRemoteTrashOpportunity === true,
    ).length,
    expensiveRemoteTrashTaken: actionSequence.filter(
      (entry) => entry.runnerExpensiveRemoteTrashTaken === true,
    ).length,
    expensiveRemoteTrashDeclined: actionSequence.filter(
      (entry) => entry.runnerExpensiveRemoteTrashDeclined === true,
    ).length,
    highImpactRemoteTrashTaken: actionSequence.filter(
      (entry) => entry.runnerHighImpactRemoteTrashTaken === true,
    ).length,
    highImpactRemoteTrashDeferredByBudget: actionSequence.filter(
      (entry) => entry.runnerHighImpactRemoteTrashDeferredByBudget === true,
    ).length,
    highImpactRemoteTrashSkippedNoThreat: actionSequence.filter(
      (entry) => entry.runnerHighImpactRemoteTrashSkippedNoThreat === true,
    ).length,
    lowValueRemoteTrashSkipped: actionSequence.filter(
      (entry) => entry.runnerLowValueRemoteTrashSkipped === true,
    ).length,
    remoteTrashSpentEarlyGame: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashSpentEarlyGame === true,
    ).length,
    runnerCreditsAfterRemoteTrash: minDefined(
      actionSequence
        .map((entry) => entry.runnerCreditsAfterRemoteTrash)
        .filter((value): value is number => typeof value === "number"),
    ),
    remoteTrashDroppedBelowReserve: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashDroppedBelowReserve === true,
    ).length,
    remoteTrashPreservedReserve: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashPreservedReserve === true,
    ).length,
    remoteTrashProtectedScoreThreat: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashProtectedScoreThreat === true,
    ).length,
    remoteTrashWithoutImmediateThreat: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashWithoutImmediateThreat === true,
    ).length,
    remoteTrashCostBucket0To1: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashCostBucket === "0_1",
    ).length,
    remoteTrashCostBucket2To3: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashCostBucket === "2_3",
    ).length,
    remoteTrashCostBucket4To5: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashCostBucket === "4_5",
    ).length,
    remoteTrashCostBucket6Plus: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashCostBucket === "6_plus",
    ).length,
    dedicatedTrashCreditsUsed: actionSequence.reduce(
      (sum, entry) => sum + (entry.dedicatedTrashCreditsUsed ?? 0),
      0,
    ),
    generalCreditsSpentOnTrash: actionSequence.reduce(
      (sum, entry) => sum + (entry.generalCreditsSpentOnTrash ?? 0),
      0,
    ),
    trashDecisionLeftRunnerUnableToContest: actionSequence.filter(
      (entry) => entry.trashDecisionLeftRunnerUnableToContest === true,
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
    runnerEconomyDecisionWindows: actionSequence.filter(
      (entry) => entry.runnerEconomyDecisionWindow === true,
    ).length,
    runnerLegalEconomyActions: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerLegalEconomyActions ?? 0),
      0,
    ),
    runnerLegalBurstEconomyActions: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerLegalBurstEconomyActions ?? 0),
      0,
    ),
    runnerLegalActionEconomyActions: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerLegalActionEconomyActions ?? 0),
      0,
    ),
    runnerLegalFinitePoolEconomyActions: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerLegalFinitePoolEconomyActions ?? 0),
      0,
    ),
    runnerLegalLoanDebtEconomyActions: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerLegalLoanDebtEconomyActions ?? 0),
      0,
    ),
    runnerLegalRecurringEconomyActions: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerLegalRecurringEconomyActions ?? 0),
      0,
    ),
    runnerLegalResourceEconomyActions: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerLegalResourceEconomyActions ?? 0),
      0,
    ),
    runnerLegalHardwareEconomyActions: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerLegalHardwareEconomyActions ?? 0),
      0,
    ),
    runnerEconomyTaken: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyTaken",
    ),
    runnerEconomySkipped: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomySkipped",
    ),
    runnerEconomySkippedWhileLowCredits: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomySkippedWhileLowCredits",
    ),
    runnerEconomySkippedWhileKnownUnaffordablePath:
      countRunnerEconomySetupMetric(
        actionSequence,
        "runnerEconomySkippedWhileKnownUnaffordablePath",
      ),
    runnerEconomySkippedForPressure: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomySkippedForPressure",
    ),
    runnerEconomySkippedForRemoteContest: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomySkippedForRemoteContest",
    ),
    runnerEconomySkippedForSetup: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomySkippedForSetup",
    ),
    runnerEconomySkippedForDraw: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomySkippedForDraw",
    ),
    runnerEconomySkippedForRun: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomySkippedForRun",
    ),
    runnerEconomySkippedForInstallBreaker: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomySkippedForInstallBreaker",
    ),
    runnerEconomySkippedForTrash: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomySkippedForTrash",
    ),
    runnerEconomySkippedForEndTurn: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomySkippedForEndTurn",
    ),
    runnerEconomySkippedForUnknownHigherPriority: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomySkippedForUnknownHigherPriority",
    ),
    runnerLowCreditDecisionWindows: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerLowCreditDecisionWindow",
    ),
    runnerCreditStarvedWithLegalEconomy: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerCreditStarvedWithLegalEconomy",
    ),
    runnerCreditStarvedEconomyTaken: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerCreditStarvedEconomyTaken",
    ),
    runnerCreditStarvedEconomySkipped: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerCreditStarvedEconomySkipped",
    ),
    runnerKnownUnaffordablePathWithLegalEconomy: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerKnownUnaffordablePathWithLegalEconomy",
    ),
    runnerEconomyTakenToReachRunReserve: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyTakenToReachRunReserve",
    ),
    runnerEconomyTakenButStillBelowReserve: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyTakenButStillBelowReserve",
    ),
    runnerEconomySkippedThenUnaffordableRun: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomySkippedThenUnaffordableRun",
    ),
    runnerRunStartedBelowKnownPathCost: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerRunStartedBelowKnownPathCost",
    ),
    runnerRunStartedAfterSkippingEconomy: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerRunStartedAfterSkippingEconomy",
    ),
    runnerEconomyChosenOverFreshCentralPressure: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyChosenOverFreshCentralPressure",
    ),
    runnerEconomyChosenOverRemoteContest: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyChosenOverRemoteContest",
    ),
    runnerEconomyChosenOverBreakerInstall: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyChosenOverBreakerInstall",
    ),
    runnerEconomyChosenOverCriticalSetup: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyChosenOverCriticalSetup",
    ),
    runnerEconomyChosenOverRelevantTrash: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyChosenOverRelevantTrash",
    ),
    runnerEconomyChosenWhileRich: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyChosenWhileRich",
    ),
    runnerEconomyChosenWhilePressureReady: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyChosenWhilePressureReady",
    ),
    runnerEconomyChosenAsReserveSetup: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyChosenAsReserveSetup",
    ),
    runnerEconomyChoicePlausible: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyChoicePlausible",
    ),
    runnerEconomyChoiceSuspicious: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyChoiceSuspicious",
    ),
    runnerFinitePoolEconomySeen: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerFinitePoolEconomySeen",
    ),
    runnerFinitePoolEconomyTaken: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerFinitePoolEconomyTaken",
    ),
    runnerFinitePoolEconomySkipped: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerFinitePoolEconomySkipped",
    ),
    runnerFinitePoolEconomyTakenWhilePoolLikelyDepleted:
      countRunnerEconomySetupMetric(
        actionSequence,
        "runnerFinitePoolEconomyTakenWhilePoolLikelyDepleted",
      ),
    runnerDebtEconomySeen: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerDebtEconomySeen",
    ),
    runnerDebtEconomyTaken: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerDebtEconomyTaken",
    ),
    runnerDebtEconomySkipped: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerDebtEconomySkipped",
    ),
    runnerDebtEconomyTakenWithoutNeed: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerDebtEconomyTakenWithoutNeed",
    ),
    runnerEconomyWithDownsideSeen: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyWithDownsideSeen",
    ),
    runnerEconomyWithDownsideTaken: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyWithDownsideTaken",
    ),
    runnerDelayedPenaltyEconomyTaken: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerDelayedPenaltyEconomyTaken",
    ),
    runnerMemoryBottleneckDecisionWindows: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerMemoryBottleneckDecisionWindow",
    ),
    runnerHandSizeBottleneckDecisionWindows: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerHandSizeBottleneckDecisionWindow",
    ),
    runnerLegalMemoryHardwareActions: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerLegalMemoryHardwareActions ?? 0),
      0,
    ),
    runnerLegalHandSizeActions: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerLegalHandSizeActions ?? 0),
      0,
    ),
    runnerMemoryHardwareTaken: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerMemoryHardwareTaken",
    ),
    runnerHandSizeSupportTaken: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerHandSizeSupportTaken",
    ),
    runnerMemorySupportSkippedWhileGripHasPrograms:
      countRunnerEconomySetupMetric(
        actionSequence,
        "runnerMemorySupportSkippedWhileGripHasPrograms",
      ),
    runnerHandSizeSupportSkippedWhileDamageRiskVisible:
      countRunnerEconomySetupMetric(
        actionSequence,
        "runnerHandSizeSupportSkippedWhileDamageRiskVisible",
      ),
    runnerHardwareSetupChosenOverEconomy: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerHardwareSetupChosenOverEconomy",
    ),
    runnerHardwareSetupChosenOverPressure: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerHardwareSetupChosenOverPressure",
    ),
    runnerHandSizeFactUsedForDiagnosis: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerHandSizeFactUsedForDiagnosis",
    ),
    runnerLegalSearchActions: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerLegalSearchActions ?? 0),
      0,
    ),
    runnerLegalRecoveryActions: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerLegalRecoveryActions ?? 0),
      0,
    ),
    runnerSearchTaken: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerSearchTaken",
    ),
    runnerRecoveryTaken: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerRecoveryTaken",
    ),
    runnerSearchSkippedWhileMissingBreakerCoverage:
      countRunnerEconomySetupMetric(
        actionSequence,
        "runnerSearchSkippedWhileMissingBreakerCoverage",
      ),
    runnerRecoverySkippedWhileMissingBreakerCoverage:
      countRunnerEconomySetupMetric(
        actionSequence,
        "runnerRecoverySkippedWhileMissingBreakerCoverage",
      ),
    runnerSearchTakenForBreakerCoverage: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerSearchTakenForBreakerCoverage",
    ),
    runnerRecoveryTakenForBreakerCoverage: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerRecoveryTakenForBreakerCoverage",
    ),
    runnerSearchOrRecoveryWindowWithNoInstallFollowup:
      countRunnerSearchRecoveryNoInstallFollowup(actionSequence),
    runnerSearchRecoveryChosenOverEconomy: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerSearchRecoveryChosenOverEconomy",
    ),
    runnerSearchRecoveryChosenOverPressure: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerSearchRecoveryChosenOverPressure",
    ),
    runnerEconomyFixGateEligibleStarvedSkip: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyFixGateEligibleStarvedSkip",
    ),
    runnerEconomyFixGateSuspiciousRichEconomy: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyFixGateSuspiciousRichEconomy",
    ),
    runnerEconomyFixGateSuspiciousEconomyOverPressure:
      countRunnerEconomySetupMetric(
        actionSequence,
        "runnerEconomyFixGateSuspiciousEconomyOverPressure",
      ),
    runnerEconomyFixGateSuspiciousEconomyOverRemoteContest:
      countRunnerEconomySetupMetric(
        actionSequence,
        "runnerEconomyFixGateSuspiciousEconomyOverRemoteContest",
      ),
    runnerEconomyFixGateSuspiciousDebtEconomyWithoutNeed:
      countRunnerEconomySetupMetric(
        actionSequence,
        "runnerEconomyFixGateSuspiciousDebtEconomyWithoutNeed",
      ),
    runnerSetupFixGateEligibleMemorySkip: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerSetupFixGateEligibleMemorySkip",
    ),
    runnerSetupFixGateEligibleSearchRecoverySkip: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerSetupFixGateEligibleSearchRecoverySkip",
    ),
    runnerRigInstallActions: actionSequence.filter(
      (entry) => entry.runnerRigInstallAction === true,
    ).length,
    runnerRemoteTrashOpportunities,
    runnerRemoteTrashTaken,
    runnerRemoteTrashDecisionWindows,
    runnerRemoteTrashLegalActions,
    runnerRemoteTrashSkipped,
    runnerRemoteTrashSkippedAffordableRelevant,
    runnerRemoteTrashSkippedAssetEconomy,
    runnerRemoteTrashSkippedFinitePoolEconomy,
    runnerRemoteTrashSkippedWithCorpValueRemaining,
    runnerRemoteTrashSkippedDueToReserve,
    runnerRemoteTrashSkippedDueToLowCredits,
    runnerRemoteTrashSkippedDueToUnknownHigherPriority,
    runnerBbsWhisperingCampaignAccessed: actionSequence.filter(
      (entry) => entry.runnerBbsWhisperingCampaignAccessed === true,
    ).length,
    runnerBbsWhisperingCampaignTrashLegal: actionSequence.filter(
      (entry) => entry.runnerBbsWhisperingCampaignTrashLegal === true,
    ).length,
    runnerBbsWhisperingCampaignTrashTaken: actionSequence.filter(
      (entry) => entry.runnerBbsWhisperingCampaignTrashTaken === true,
    ).length,
    runnerBbsWhisperingCampaignTrashSkipped: actionSequence.filter(
      (entry) => entry.runnerBbsWhisperingCampaignTrashSkipped === true,
    ).length,
    runnerBbsWhisperingCampaignTrashSkippedAffordable: actionSequence.filter(
      (entry) =>
        entry.runnerBbsWhisperingCampaignTrashSkippedAffordable === true,
    ).length,
    runnerBbsWhisperingCampaignTrashSkippedWithCreditsRemaining:
      actionSequence.filter(
        (entry) =>
          entry.runnerBbsWhisperingCampaignTrashSkipped === true &&
          (entry.runnerRemoteTrashCorpValueRemaining ?? 0) > 0,
      ).length,
    runnerFinitePoolAssetAccessed: actionSequence.filter(
      (entry) => entry.runnerFinitePoolAssetAccessed === true,
    ).length,
    runnerFinitePoolAssetTrashLegal: actionSequence.filter(
      (entry) => entry.runnerFinitePoolAssetTrashLegal === true,
    ).length,
    runnerFinitePoolAssetTrashTaken: actionSequence.filter(
      (entry) => entry.runnerFinitePoolAssetTrashTaken === true,
    ).length,
    runnerFinitePoolAssetTrashSkippedAffordable: actionSequence.filter(
      (entry) => entry.runnerFinitePoolAssetTrashSkippedAffordable === true,
    ).length,
    ...repeatRemoteNoTrashMetrics,
    runnerRemoteTrashFixGateEligible: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashFixGateEligible === true,
    ).length,
    runnerRemoteTrashFixGateBlockedByReserve: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashFixGateBlockedByReserve === true,
    ).length,
    runnerRemoteTrashFixGateBlockedByLowCredits: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashFixGateBlockedByLowCredits === true,
    ).length,
    runnerRemoteTrashFixGateBlockedByHigherThreat: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashFixGateBlockedByHigherThreat === true,
    ).length,
    runnerRemoteTrashFixGateSuspicious: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashFixGateSuspicious === true,
    ).length,
    runnerRepeatRemoteNoTrashFixGateSuspicious:
      repeatRemoteNoTrashMetrics.runnerRepeatRemoteNoTrashFixGateSuspicious,
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
    runnerRunStartedAgainstKnownUnpayableFullPath: runnerRuns.filter(
      (entry) => entry.runnerRunStartedAgainstKnownUnpayableFullPath === true,
    ).length,
    runnerRunStartedAgainstKnownUnpayableRemotePath: runnerRuns.filter(
      (entry) => entry.runnerRunStartedAgainstKnownUnpayableRemotePath === true,
    ).length,
    runnerRunStartedAgainstKnownUnpayableCentralPath: runnerRuns.filter(
      (entry) =>
        entry.runnerRunStartedAgainstKnownUnpayableCentralPath === true,
    ).length,
    runnerKnownPathAccessReachable: actionSequence.filter(
      (entry) => entry.runnerKnownPathAccessReachable === true,
    ).length,
    runnerKnownPathAccessNotReachable: actionSequence.filter(
      (entry) => entry.runnerKnownPathAccessNotReachable === true,
    ).length,
    runnerKnownPathBlockedByUnbreakableIce: actionSequence.filter(
      (entry) => entry.runnerKnownPathBlockedByUnbreakableIce === true,
    ).length,
    runnerKnownPathBlockedByMissingCoverage: actionSequence.filter(
      (entry) => entry.runnerKnownPathBlockedByMissingCoverage === true,
    ).length,
    runnerKnownPathBlockedByKnownEtr: actionSequence.filter(
      (entry) => entry.runnerKnownPathBlockedByKnownEtr === true,
    ).length,
    runnerKnownPathBlockedByWall: actionSequence.filter(
      (entry) => entry.runnerKnownPathBlockedByWall === true,
    ).length,
    runnerKnownPathBlockedByCodeGate: actionSequence.filter(
      (entry) => entry.runnerKnownPathBlockedByCodeGate === true,
    ).length,
    runnerKnownPathBlockedBySentry: actionSequence.filter(
      (entry) => entry.runnerKnownPathBlockedBySentry === true,
    ).length,
    runnerRunStartedAgainstKnownUnbreakablePath: runnerRuns.filter(
      (entry) => entry.runnerRunStartedAgainstKnownUnbreakablePath === true,
    ).length,
    runnerRunStartedAgainstKnownUnbreakableCentralPath: runnerRuns.filter(
      (entry) =>
        entry.runnerRunStartedAgainstKnownUnbreakableCentralPath === true,
    ).length,
    runnerRunStartedAgainstKnownUnbreakableRemotePath: runnerRuns.filter(
      (entry) =>
        entry.runnerRunStartedAgainstKnownUnbreakableRemotePath === true,
    ).length,
    runnerKnownUnbreakableRemoteTraceSampled: actionSequence.filter(
      (entry) => entry.runnerKnownUnbreakableRemoteTraceSampled === true,
    ).length,
    runnerKnownUnbreakableRemoteTrueBug: actionSequence.filter(
      (entry) => entry.runnerKnownUnbreakableRemoteTrueBug === true,
    ).length,
    runnerKnownUnbreakableRemoteForceRezOrProbeMisclassified:
      actionSequence.filter(
        (entry) =>
          entry.runnerKnownUnbreakableRemoteForceRezOrProbeMisclassified ===
          true,
      ).length,
    runnerKnownUnbreakableRemoteStateChanged: actionSequence.filter(
      (entry) => entry.runnerKnownUnbreakableRemoteStateChanged === true,
    ).length,
    runnerKnownUnbreakableRemoteCoverageRepairMissing: actionSequence.filter(
      (entry) =>
        entry.runnerKnownUnbreakableRemoteCoverageRepairMissing === true,
    ).length,
    runnerKnownUnbreakableRemoteMetricArtifact: actionSequence.filter(
      (entry) => entry.runnerKnownUnbreakableRemoteMetricArtifact === true,
    ).length,
    runnerKnownUnbreakableRemoteUnclassified: actionSequence.filter(
      (entry) => entry.runnerKnownUnbreakableRemoteUnclassified === true,
    ).length,
    runnerKnownUnbreakableRemoteRunSuppressed: actionSequence.filter(
      (entry) => entry.runnerKnownUnbreakableRemoteRunSuppressed === true,
    ).length,
    runnerKnownUnbreakableRemoteRunPenalized: actionSequence.filter(
      (entry) => entry.runnerKnownUnbreakableRemoteRunPenalized === true,
    ).length,
    runnerKnownUnbreakableRemoteCoverageRepairTaken: actionSequence.filter(
      (entry) => entry.runnerKnownUnbreakableRemoteCoverageRepairTaken === true,
    ).length,
    runnerKnownUnbreakableRemoteCoverageRepairAvailable: actionSequence.filter(
      (entry) =>
        entry.runnerKnownUnbreakableRemoteCoverageRepairAvailable === true,
    ).length,
    runnerKnownUnbreakableRemoteRunTakenDespiteGate: runnerRuns.filter(
      (entry) => entry.runnerKnownUnbreakableRemoteRunTakenDespiteGate === true,
    ).length,
    runnerMultiaccessValueAvailable: runnerRuns.filter(
      (entry) =>
        entry.runnerCentralRunWithInterfaceInstalled === true ||
        entry.runnerHqRunWithHqInterface === true ||
        entry.runnerRndRunWithRndInterface === true,
    ).length,
    runnerMultiaccessValueUsed: runnerRuns.filter(
      (entry) =>
        (entry.runnerHqRunWithHqInterface === true ||
          entry.runnerRndRunWithRndInterface === true) &&
        entry.runnerMultiaccessValueSuppressedNoAccess !== true,
    ).length,
    runnerMultiaccessValueSuppressedNoAccess: actionSequence.filter(
      (entry) => entry.runnerMultiaccessValueSuppressedNoAccess === true,
    ).length,
    runnerCentralPressureSuppressedNoAccess: actionSequence.filter(
      (entry) => entry.runnerCentralPressureSuppressedNoAccess === true,
    ).length,
    runnerHqInterfaceSuppressedNoAccess: actionSequence.filter(
      (entry) => entry.runnerHqInterfaceSuppressedNoAccess === true,
    ).length,
    runnerRndInterfaceSuppressedNoAccess: actionSequence.filter(
      (entry) => entry.runnerRndInterfaceSuppressedNoAccess === true,
    ).length,
    runnerRepeatKnownUnbreakableRunSuppressed: actionSequence.filter(
      (entry) => entry.runnerRepeatKnownUnbreakableRunSuppressed === true,
    ).length,
    runnerRepeatKnownUnbreakableRunPenalized: actionSequence.filter(
      (entry) => entry.runnerRepeatKnownUnbreakableRunPenalized === true,
    ).length,
    runnerRepeatKnownUnbreakableCentralRunSuppressed: actionSequence.filter(
      (entry) =>
        entry.runnerRepeatKnownUnbreakableCentralRunSuppressed === true,
    ).length,
    runnerRepeatKnownUnbreakableRemoteRunSuppressed: actionSequence.filter(
      (entry) => entry.runnerRepeatKnownUnbreakableRemoteRunSuppressed === true,
    ).length,
    runnerRepeatKnownUnbreakableRunTakenDespiteSuppression: runnerRuns.filter(
      (entry) =>
        entry.runnerRepeatKnownUnbreakableRunTakenDespiteSuppression === true,
    ).length,
    runnerCoverageRepairIntentCandidates: actionSequence.filter(
      (entry) => entry.runnerCoverageRepairIntentCandidates === true,
    ).length,
    runnerCoverageRepairIntentSearchTaken: actionSequence.filter(
      (entry) => entry.runnerCoverageRepairIntentSearchTaken === true,
    ).length,
    runnerCoverageRepairIntentRecoveryTaken: actionSequence.filter(
      (entry) => entry.runnerCoverageRepairIntentRecoveryTaken === true,
    ).length,
    runnerCoverageRepairIntentInstallTaken: actionSequence.filter(
      (entry) => entry.runnerCoverageRepairIntentInstallTaken === true,
    ).length,
    runnerCoverageRepairIntentDrawOrEconomyTaken: actionSequence.filter(
      (entry) => entry.runnerCoverageRepairIntentDrawOrEconomyTaken === true,
    ).length,
    runnerCoverageRepairIntentSatisfied: actionSequence.filter(
      (entry) => entry.runnerCoverageRepairIntentSatisfied === true,
    ).length,
    runnerCoverageRepairIntentNoFollowup: actionSequence.filter(
      (entry) => entry.runnerCoverageRepairIntentNoFollowup === true,
    ).length,
    runnerCoverageRepairIntentBlockedByHiddenTargetUncertain:
      actionSequence.filter(
        (entry) =>
          entry.runnerCoverageRepairIntentBlockedByHiddenTargetUncertain ===
          true,
      ).length,
    runnerDataWallHqNoAccessSuppressed: actionSequence.filter(
      (entry) => entry.runnerDataWallHqNoAccessSuppressed === true,
    ).length,
    runnerDataWallHqRepeatSuppressed: actionSequence.filter(
      (entry) => entry.runnerDataWallHqRepeatSuppressed === true,
    ).length,
    runnerHqInterfaceDataWallValueSuppressed: actionSequence.filter(
      (entry) => entry.runnerHqInterfaceDataWallValueSuppressed === true,
    ).length,
    runnerKnownPathCanReachAccessFalse: actionSequence.filter(
      (entry) => entry.runnerKnownPathCanReachAccessFalse === true,
    ).length,
    runnerKnownPathCanBreakNextIceButNotFullPath: actionSequence.filter(
      (entry) => entry.runnerKnownPathCanBreakNextIceButNotFullPath === true,
    ).length,
    runnerRunAbortedAfterKnownUnpayableLaterIce: actionSequence.filter(
      (entry) => entry.runnerRunAbortedAfterKnownUnpayableLaterIce === true,
    ).length,
    runnerRunSpentCreditsBeforeKnownUnbreakableLaterIce: runnerRuns.filter(
      (entry) =>
        entry.runnerRunSpentCreditsBeforeKnownUnbreakableLaterIce === true,
    ).length,
    runnerRunCostQuoteUnderestimatedFullPath: runnerRuns.filter(
      (entry) => entry.runnerRunCostQuoteUnderestimatedFullPath === true,
    ).length,
    runnerRepeatRunOnKnownUnpayablePath: runnerRuns.filter(
      (entry) => entry.runnerRepeatRunOnKnownUnpayablePath === true,
    ).length,
    runnerRepeatRunOnKnownUnpayableRemotePath: runnerRuns.filter(
      (entry) => entry.runnerRepeatRunOnKnownUnpayableRemotePath === true,
    ).length,
    runnerRunCouldOnlyForceRezButNotAccess: runnerRuns.filter(
      (entry) => entry.runnerRunCouldOnlyForceRezButNotAccess === true,
    ).length,
    runnerRunAllowedAsFirstProbeUnknownIce: actionSequence.filter(
      (entry) => entry.runnerRunAllowedAsFirstProbeUnknownIce === true,
    ).length,
    runnerRunSuppressedAsKnownNoAccess: actionSequence.filter(
      (entry) => entry.runnerRunSuppressedAsKnownNoAccess === true,
    ).length,
    runnerRunPenalizedAsKnownNoAccess: runnerRuns.filter(
      (entry) => entry.runnerRunPenalizedAsKnownNoAccess === true,
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

function summarizeRunnerRepeatRemoteNoTrashMetrics(
  summaries: AiSimulationSummary[],
): Pick<
  AiMatchProgressionMetrics,
  | "runnerRepeatAccessKnownRemote"
  | "runnerRepeatAccessKnownTrashableRemote"
  | "runnerRepeatAccessKnownTrashableRemoteWithoutTrash"
  | "runnerRepeatRunOnSameRemoteAfterDecliningTrash"
  | "runnerRepeatRunOnSameRemoteNoNewInfo"
  | "runnerRepeatRemoteAccessNoProgress"
  | "runnerRepeatRemoteRunSuppressedAfterNoTrash"
  | "runnerRepeatRemoteRunPenalizedAfterNoTrash"
  | "runnerRepeatRemoteNoTrashFixGateSuspicious"
> {
  const metrics = {
    runnerRepeatAccessKnownRemote: 0,
    runnerRepeatAccessKnownTrashableRemote: 0,
    runnerRepeatAccessKnownTrashableRemoteWithoutTrash: 0,
    runnerRepeatRunOnSameRemoteAfterDecliningTrash: 0,
    runnerRepeatRunOnSameRemoteNoNewInfo: 0,
    runnerRepeatRemoteAccessNoProgress: 0,
    runnerRepeatRemoteRunSuppressedAfterNoTrash: 0,
    runnerRepeatRemoteRunPenalizedAfterNoTrash: 0,
    runnerRepeatRemoteNoTrashFixGateSuspicious: 0,
  };
  for (const summary of summaries) {
    let declinedTrashRemote: string | undefined;
    for (const entry of progressionEntriesWithRunTargets(
      summary.actionSequence,
    )) {
      if (entry.side !== "runner") continue;
      if (
        entry.runnerRemoteAccessWithRelevantTrashableCard === true &&
        isRemoteServerTarget(entry.targetServerId)
      ) {
        metrics.runnerRepeatAccessKnownRemote += 1;
        if (entry.runnerRemoteAccessWithTrashableCard === true) {
          metrics.runnerRepeatAccessKnownTrashableRemote += 1;
        }
        if (entry.runnerRemoteTrashTaken === true) {
          declinedTrashRemote = undefined;
        } else if (entry.runnerRemoteAccessWithTrashableCard === true) {
          metrics.runnerRepeatAccessKnownTrashableRemoteWithoutTrash += 1;
          declinedTrashRemote = entry.targetServerId;
        }
      }
      if (
        entry.actionType === "start_run" &&
        entry.targetServerId &&
        entry.targetServerId === declinedTrashRemote
      ) {
        metrics.runnerRepeatRunOnSameRemoteAfterDecliningTrash += 1;
        metrics.runnerRepeatRunOnSameRemoteNoNewInfo += 1;
        metrics.runnerRepeatRemoteAccessNoProgress += 1;
        metrics.runnerRepeatRemoteNoTrashFixGateSuspicious += 1;
      }
      if (
        hasEvidenceFlag(
          entry,
          "runner_repeat_remote_after_declined_trash_penalized:true",
        )
      ) {
        metrics.runnerRepeatRemoteRunPenalizedAfterNoTrash += 1;
      }
      if (
        declinedTrashRemote &&
        entry.actionType !== "start_run" &&
        entry.actionType !== "decline_trash" &&
        entry.runnerRemoteTrashTaken !== true
      ) {
        metrics.runnerRepeatRemoteRunSuppressedAfterNoTrash += 1;
        declinedTrashRemote = undefined;
      }
    }
  }
  return metrics;
}

function summarizePlanConversionMetrics(
  summaries: AiSimulationSummary[],
): Pick<
  AiMatchProgressionMetrics,
  | "actionLedToProgressWithin1"
  | "actionLedToProgressWithin2"
  | "actionLedToProgressWithin3"
  | "planIntentConverted"
  | "planIntentAbandoned"
  | "samePlanRepeatedWithoutProgress"
  | "setupActionConvertedToRun"
  | "economyActionConvertedToRun"
  | "rigActionConvertedToRun"
  | "remoteBuildConvertedToAdvanceOrScore"
  | "advanceConvertedToScore"
  | "remoteContestConvertedToStealOrTrash"
  | "centralPressureConvertedToSteal"
  | "noProgressActionChainLength"
  | "longestNoProgressChain"
  | "turnsWithNoProgress"
  | "actionsUntilNextScoreOrSteal"
  | "actionsUntilNextMeaningfulBoardProgress"
  | "strategicNoProgressActionChainLength"
  | "strategicLongestNoProgressChain"
  | "microActionNoProgressContribution"
  | "planContinuationOpportunities"
  | "planContinuationTaken"
  | "planContinuationRate"
  | "planAbortOpportunities"
  | "planAbortTaken"
  | "planAbortWithReason"
  | "planIntentConvertedWithin1OwnDecision"
  | "planIntentConvertedWithin2OwnDecisions"
  | "planIntentConvertedWithin3OwnDecisions"
  | "planIntentExpired"
  | "planIntentAbandonedWithoutReason"
  | "sameStrategicPlanRepeatedWithoutProgress"
  | "runnerEconomyConvertedToRunOrRig"
  | "runnerRigConvertedToRun"
  | "runnerProbeConvertedToUsefulInfoOrPivot"
  | "runnerCentralPressureConvertedToStealOrFreshValue"
  | "runnerRemoteContestConvertedToStealTrashOrCorrectAbort"
  | "corpRemoteBuildConvertedToAdvanceProtectOrScore"
  | "corpAdvanceConvertedToScoreOrProtectedWindow"
  | "corpEconomyConvertedToRezInstallScore"
  | "corpProtectionConvertedToScoreSafety"
  | "runnerCentralSuccessFollowedByValue"
  | "runnerCentralSuccessFollowedByRepeatNoValue"
  | "runnerCentralNoValuePivoted"
  | "runnerRemoteSuccessFollowedByValue"
  | "runnerRemoteEmptyOrLowValuePivoted"
  | "runnerJackOutRepeatedSameServerWithoutNewInfo"
  | "runnerJackOutFollowedByEconomyOrRig"
  | "runnerAccessNoValueRepeated"
  | "runnerAccessNoValuePivoted"
  | "runnerEconomyConvertedAfterOutcome"
  | "runnerRigConvertedAfterOutcome"
  | "corpRemoteStealFollowupProtectOrPivot"
  | "corpRemoteStealFollowupRepeatedUnsafeLine"
  | "corpCentralStealFollowupProtectCentral"
  | "corpRunnerFailedRunFollowupScoreOrAdvance"
  | "corpRunnerSuccessfulRunFollowupProtect"
  | "corpAdvanceFollowupScore"
  | "corpAdvanceFollowupProtect"
  | "corpRemoteBuildFollowupAdvanceProtectScore"
  | "corpRemoteBuildFollowupNoop"
  | "outcomeFollowupOpportunities"
  | "outcomeFollowupTaken"
  | "outcomeFollowupRate"
  | "outcomeFollowupApplied"
  | "outcomeFollowupSuppressedByProgressionCost"
  | "outcomeFollowupSuppressedByBetterImmediateValue"
  | "outcomeFollowupLedToProgressWithin3"
  | "outcomeFollowupLedToNoProgressChain"
  | "outcomeFollowupDelayedScoreWindow"
  | "outcomeFollowupPreservedScoreWindow"
  | "outcomeFollowupDelayedStealOrTrash"
  | "outcomeFollowupPreservedContestReserve"
  | "runnerOutcomePivotConverted"
  | "runnerOutcomePivotStalled"
  | "corpOutcomePivotConverted"
  | "corpOutcomePivotStalled"
  | "corpScoreWindowOverriddenByFollowup"
  | "scoreNowProtectedFromFollowup"
  | "stealTrashProtectedFromFollowup"
  | "effectiveRunQuoteBlockedFollowupRun"
  | "unbrokenRunEffectChangedBreakDecision"
  | "futureEffectSubroutinesEncountered"
  | "futureEffectSubroutinesWithRemainingIce"
  | "futureEffectSubroutinesWithoutRemainingIce"
  | "futureEffectBreaksTaken"
  | "futureEffectBreaksSkippedNoRemainingIce"
  | "futureEffectBreaksTakenWithoutRemainingIce"
  | "pumpActionsBeforeFutureEffectBreak"
  | "pumpActionsThatCouldNotLeadToBreak"
  | "pumpActionsThatDestroyedAccessReserve"
  | "breakSkippedToPreserveTrashReserve"
  | "unbrokenRunEffectIgnoredBecauseNoRemainingIce"
  | "unbrokenRunEffectAppliedToRemainingPath"
  | "badOutcomeRepeatedWithoutNewInfo"
  | "goodOutcomeConverted"
  | "outcomePivotWithReason"
  | "outcomeIgnored"
> {
  let actionLedToProgressWithin1 = 0;
  let actionLedToProgressWithin2 = 0;
  let actionLedToProgressWithin3 = 0;
  let planIntentConverted = 0;
  let planIntentAbandoned = 0;
  let samePlanRepeatedWithoutProgress = 0;
  let setupActionConvertedToRun = 0;
  let economyActionConvertedToRun = 0;
  let rigActionConvertedToRun = 0;
  let remoteBuildConvertedToAdvanceOrScore = 0;
  let advanceConvertedToScore = 0;
  let remoteContestConvertedToStealOrTrash = 0;
  let centralPressureConvertedToSteal = 0;
  let longestNoProgressChain = 0;

  const noProgressChains: number[] = [];
  const scoreOrStealDistances: number[] = [];
  const boardProgressDistances: number[] = [];
  const turnsWithActions = new Set<string>();
  const turnsWithProgress = new Set<string>();

  for (const summary of summaries) {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    const lastPlanBySide: Partial<
      Record<Side, { planKind: string; progressSince: boolean }>
    > = {};
    let noProgressChain = 0;

    sequence.forEach((entry, index) => {
      const turnKey = `${summary.seed}|${entry.turnNumber ?? 0}`;
      turnsWithActions.add(turnKey);
      const hasProgress = isMeaningfulBoardProgress(entry);
      if (hasProgress) turnsWithProgress.add(turnKey);

      if (hasProgress) {
        if (noProgressChain > 0) noProgressChains.push(noProgressChain);
        longestNoProgressChain = Math.max(
          longestNoProgressChain,
          noProgressChain,
        );
        noProgressChain = 0;
      } else {
        noProgressChain += 1;
      }

      if (hasMeaningfulProgressWithin(sequence, index, 1, isMeaningfulBoardProgress))
        actionLedToProgressWithin1 += 1;
      if (hasMeaningfulProgressWithin(sequence, index, 2, isMeaningfulBoardProgress))
        actionLedToProgressWithin2 += 1;
      if (hasMeaningfulProgressWithin(sequence, index, 3, isMeaningfulBoardProgress))
        actionLedToProgressWithin3 += 1;

      const planKind = planKindForConversion(entry);
      if (planKind) {
        const lastPlan = lastPlanBySide[entry.side];
        if (
          lastPlan?.planKind === planKind &&
          lastPlan.progressSince === false
        ) {
          samePlanRepeatedWithoutProgress += 1;
        }
        const converted = planIntentConvertedWithin(
          sequence,
          index,
          planKind,
          isMeaningfulBoardProgress,
          isCorpRemoteAdvancementProgress,
        );
        if (converted) planIntentConverted += 1;
        else if (
          !hasMeaningfulProgressWithin(sequence, index, 3, isMeaningfulBoardProgress)
        )
          planIntentAbandoned += 1;
        lastPlanBySide[entry.side] = { planKind, progressSince: false };
      }

      if (setupActionConvertsToRun(sequence, index, isMeaningfulBoardProgress))
        setupActionConvertedToRun += 1;
      if (economyActionConvertsToRun(sequence, index, isMeaningfulBoardProgress))
        economyActionConvertedToRun += 1;
      if (rigActionConvertsToRun(sequence, index, isMeaningfulBoardProgress))
        rigActionConvertedToRun += 1;
      if (
        remoteBuildConvertsToAdvanceOrScore(
          sequence,
          index,
          isCorpRemoteAdvancementProgress,
        )
      )
        remoteBuildConvertedToAdvanceOrScore += 1;
      if (advanceConvertsToScore(sequence, index, isCorpRemoteAdvancementProgress))
        advanceConvertedToScore += 1;
      if (remoteContestConvertsToStealOrTrash(sequence, index))
        remoteContestConvertedToStealOrTrash += 1;
      if (centralPressureConvertsToSteal(sequence, index))
        centralPressureConvertedToSteal += 1;

      const scoreOrStealDistance = actionsUntil(
        sequence,
        index,
        (candidate) =>
          candidate.actionType === "score_agenda" ||
          candidate.actionType === "steal_agenda",
      );
      if (scoreOrStealDistance !== undefined)
        scoreOrStealDistances.push(scoreOrStealDistance);
      const boardProgressDistance = actionsUntil(
        sequence,
        index,
        isMeaningfulBoardProgress,
      );
      if (boardProgressDistance !== undefined)
        boardProgressDistances.push(boardProgressDistance);

      if (hasProgress) {
        for (const side of Object.keys(lastPlanBySide) as Side[]) {
          const lastPlan = lastPlanBySide[side];
          if (lastPlan) lastPlan.progressSince = true;
        }
      }
    });

    if (noProgressChain > 0) {
      noProgressChains.push(noProgressChain);
      longestNoProgressChain = Math.max(
        longestNoProgressChain,
        noProgressChain,
      );
    }
  }

  return {
    actionLedToProgressWithin1,
    actionLedToProgressWithin2,
    actionLedToProgressWithin3,
    planIntentConverted,
    planIntentAbandoned,
    samePlanRepeatedWithoutProgress,
    setupActionConvertedToRun,
    economyActionConvertedToRun,
    rigActionConvertedToRun,
    remoteBuildConvertedToAdvanceOrScore,
    advanceConvertedToScore,
    remoteContestConvertedToStealOrTrash,
    centralPressureConvertedToSteal,
    noProgressActionChainLength: averageNumber(noProgressChains),
    longestNoProgressChain,
    turnsWithNoProgress: [...turnsWithActions].filter(
      (turnKey) => !turnsWithProgress.has(turnKey),
    ).length,
    actionsUntilNextScoreOrSteal: averageNumber(scoreOrStealDistances),
    actionsUntilNextMeaningfulBoardProgress: averageNumber(
      boardProgressDistances,
    ),
    ...summarizeStrategicPlanConversionMetrics(summaries),
    ...summarizeOutcomeFollowupMetrics(summaries),
  };
}

function summarizeActionLimitEndgameMetrics(
  summaries: AiSimulationSummary[],
): Pick<
  AiMatchProgressionMetrics,
  | "actionLimitRootCauseByMatch"
  | "actionLimitDominantSide"
  | "actionLimitDominantSideRunner"
  | "actionLimitDominantSideCorp"
  | "actionLimitDominantSideBoth"
  | "finalStrategicWindowNoProgressActions"
  | "finalStrategicWindowRunnerNoProgressActions"
  | "finalStrategicWindowCorpNoProgressActions"
  | "finalWindowRunnerMeaningfulRunOpportunities"
  | "finalWindowRunnerMeaningfulRunsTaken"
  | "finalWindowCorpScorePathOpportunities"
  | "finalWindowCorpScorePathTaken"
  | "finalWindowKnownInfoExploitationOpportunities"
  | "finalWindowKnownInfoExploitationTaken"
  | "endgameCloseoutOpportunitiesRunner"
  | "endgameCloseoutOpportunitiesRunnerRaw"
  | "endgameCloseoutOpportunitiesRunnerDeduped"
  | "endgameCloseoutOpportunitiesRunnerTrue"
  | "endgameCloseoutOpportunitiesRunnerFalsePositive"
  | "runnerCloseoutByKnownHqAgenda"
  | "runnerCloseoutByKnownRndTopAgenda"
  | "runnerCloseoutByKnownRemoteAgenda"
  | "runnerCloseoutByPointsToWin"
  | "runnerCloseoutBlockedByCredits"
  | "runnerCloseoutBlockedByBreakerCoverage"
  | "runnerCloseoutBlockedByPostRunReserve"
  | "runnerCloseoutAttempted"
  | "runnerCloseoutSkippedWithReason"
  | "endgameCloseoutOpportunitiesCorp"
  | "endgameCloseoutAttemptsRunner"
  | "endgameCloseoutAttemptsCorp"
  | "endgameScoreOrStealPressureActions"
  | "endgameSetupOrEconomyActions"
  | "endgameProtectionActions"
  | "endgameLowValueRepeatActions"
  | "actionLimitLikelyDeckPressureIssue"
  | "actionLimitLikelyStrategyIssue"
  | "actionLimitLikelyMetricArtifact"
> {
  let actionLimitRootCauseByMatch = 0;
  let actionLimitDominantSideRunner = 0;
  let actionLimitDominantSideCorp = 0;
  let actionLimitDominantSideBoth = 0;
  let finalStrategicWindowNoProgressActions = 0;
  let finalStrategicWindowRunnerNoProgressActions = 0;
  let finalStrategicWindowCorpNoProgressActions = 0;
  let finalWindowRunnerMeaningfulRunOpportunities = 0;
  let finalWindowRunnerMeaningfulRunsTaken = 0;
  let finalWindowCorpScorePathOpportunities = 0;
  let finalWindowCorpScorePathTaken = 0;
  let finalWindowKnownInfoExploitationOpportunities = 0;
  let finalWindowKnownInfoExploitationTaken = 0;
  let endgameCloseoutOpportunitiesRunner = 0;
  let endgameCloseoutOpportunitiesRunnerRaw = 0;
  let endgameCloseoutOpportunitiesRunnerDeduped = 0;
  let endgameCloseoutOpportunitiesRunnerTrue = 0;
  let endgameCloseoutOpportunitiesRunnerFalsePositive = 0;
  let runnerCloseoutByKnownHqAgenda = 0;
  let runnerCloseoutByKnownRndTopAgenda = 0;
  let runnerCloseoutByKnownRemoteAgenda = 0;
  let runnerCloseoutByPointsToWin = 0;
  let runnerCloseoutBlockedByCredits = 0;
  let runnerCloseoutBlockedByBreakerCoverage = 0;
  let runnerCloseoutBlockedByPostRunReserve = 0;
  let runnerCloseoutAttempted = 0;
  let runnerCloseoutSkippedWithReason = 0;
  let endgameCloseoutOpportunitiesCorp = 0;
  let endgameCloseoutAttemptsRunner = 0;
  let endgameCloseoutAttemptsCorp = 0;
  let endgameScoreOrStealPressureActions = 0;
  let endgameSetupOrEconomyActions = 0;
  let endgameProtectionActions = 0;
  let endgameLowValueRepeatActions = 0;
  let actionLimitLikelyDeckPressureIssue = 0;
  let actionLimitLikelyStrategyIssue = 0;
  let actionLimitLikelyMetricArtifact = 0;

  for (const summary of summaries) {
    if (summary.winner !== "action_limit_reached") continue;
    actionLimitRootCauseByMatch += 1;
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    const strategicWindow = sequence.filter(isStrategicPlanDecision).slice(-30);
    const windowNoProgress = strategicWindow.filter(
      (entry) => !isMeaningfulBoardProgress(entry),
    );
    const runnerNoProgress = windowNoProgress.filter(
      (entry) => entry.side === "runner",
    );
    const corpNoProgress = windowNoProgress.filter(
      (entry) => entry.side === "corp",
    );
    const runnerRunOpportunities = strategicWindow.filter(
      isRunnerEndgameMeaningfulRunOpportunity,
    );
    const runnerRunsTaken = strategicWindow.filter(
      isRunnerEndgameMeaningfulRunTaken,
    );
    const corpScorePathOpportunities = strategicWindow.filter(
      isCorpEndgameScorePathOpportunity,
    );
    const corpScorePathTaken = strategicWindow.filter(
      isCorpEndgameScorePathTaken,
    );
    const knownInfoOpportunities = strategicWindow.filter(
      isEndgameKnownInfoOpportunity,
    );
    const knownInfoTaken = strategicWindow.filter(isEndgameKnownInfoTaken);
    const runnerNearWin = summary.finalAgendaPoints.runner >= 5;
    const corpNearWin = summary.finalAgendaPoints.corp >= 5;
    const runnerCloseoutSummary = summarizeRunnerEndgameCloseoutWindow(
      strategicWindow,
      runnerNearWin,
    );
    const runnerCloseoutOpportunities = runnerCloseoutSummary.trueOpportunities;
    const corpCloseoutOpportunities = corpNearWin
      ? corpScorePathOpportunities.length
      : strategicWindow.filter(
          (entry) =>
            entry.side === "corp" && (entry.scoreActionsAvailable ?? 0) > 0,
        ).length;
    const runnerCloseoutAttempts = runnerCloseoutSummary.attempted;
    const corpCloseoutAttempts = strategicWindow.filter(
      (entry) =>
        entry.side === "corp" &&
        (entry.actionType === "score_agenda" ||
          (corpNearWin && isCorpEndgameScorePathTaken(entry))),
    ).length;
    const pressureActions = strategicWindow.filter(
      isEndgameScoreOrStealPressureAction,
    );
    const setupOrEconomyActions = strategicWindow.filter((entry) =>
      isEndgameSetupOrEconomyAction(entry, {
        planKind: planKindForConversion(entry),
        runnerSetupAction: isRunnerSetupAction(entry),
        runnerEconomyProgressAction: isRunnerEconomyProgressAction(entry),
      }),
    );
    const protectionActions = strategicWindow.filter((entry) =>
      isEndgameProtectionAction(entry, planKindForConversion(entry)),
    );
    const lowValueRepeatActions =
      strategicWindow.filter(isEndgameLowValueRepeatAction).length +
      countSameStrategicPlanRepeatsWithoutProgress(
        strategicWindow,
        (entry) => ({
          planKind: planKindForConversion(entry),
          meaningfulBoardProgress: isMeaningfulBoardProgress(entry),
        }),
      );

    finalStrategicWindowNoProgressActions += windowNoProgress.length;
    finalStrategicWindowRunnerNoProgressActions += runnerNoProgress.length;
    finalStrategicWindowCorpNoProgressActions += corpNoProgress.length;
    finalWindowRunnerMeaningfulRunOpportunities +=
      runnerRunOpportunities.length;
    finalWindowRunnerMeaningfulRunsTaken += runnerRunsTaken.length;
    finalWindowCorpScorePathOpportunities += corpScorePathOpportunities.length;
    finalWindowCorpScorePathTaken += corpScorePathTaken.length;
    finalWindowKnownInfoExploitationOpportunities +=
      knownInfoOpportunities.length;
    finalWindowKnownInfoExploitationTaken += knownInfoTaken.length;
    endgameCloseoutOpportunitiesRunner += runnerCloseoutOpportunities;
    endgameCloseoutOpportunitiesRunnerRaw += runnerCloseoutSummary.raw;
    endgameCloseoutOpportunitiesRunnerDeduped += runnerCloseoutSummary.deduped;
    endgameCloseoutOpportunitiesRunnerTrue +=
      runnerCloseoutSummary.trueOpportunities;
    endgameCloseoutOpportunitiesRunnerFalsePositive +=
      runnerCloseoutSummary.falsePositive;
    runnerCloseoutByKnownHqAgenda += runnerCloseoutSummary.byKnownHqAgenda;
    runnerCloseoutByKnownRndTopAgenda +=
      runnerCloseoutSummary.byKnownRndTopAgenda;
    runnerCloseoutByKnownRemoteAgenda +=
      runnerCloseoutSummary.byKnownRemoteAgenda;
    runnerCloseoutByPointsToWin += runnerCloseoutSummary.byPointsToWin;
    runnerCloseoutBlockedByCredits += runnerCloseoutSummary.blockedByCredits;
    runnerCloseoutBlockedByBreakerCoverage +=
      runnerCloseoutSummary.blockedByBreakerCoverage;
    runnerCloseoutBlockedByPostRunReserve +=
      runnerCloseoutSummary.blockedByPostRunReserve;
    runnerCloseoutAttempted += runnerCloseoutSummary.attempted;
    runnerCloseoutSkippedWithReason += runnerCloseoutSummary.skippedWithReason;
    endgameCloseoutOpportunitiesCorp += corpCloseoutOpportunities;
    endgameCloseoutAttemptsRunner += runnerCloseoutAttempts;
    endgameCloseoutAttemptsCorp += corpCloseoutAttempts;
    endgameScoreOrStealPressureActions += pressureActions.length;
    endgameSetupOrEconomyActions += setupOrEconomyActions.length;
    endgameProtectionActions += protectionActions.length;
    endgameLowValueRepeatActions += lowValueRepeatActions;

    const runnerSymptoms =
      runnerNoProgress.length +
      strategicWindow.filter(isRunnerEndgameStallSymptom).length +
      Math.max(0, runnerRunOpportunities.length - runnerRunsTaken.length) +
      Math.max(0, knownInfoOpportunities.length - knownInfoTaken.length) +
      Math.max(0, runnerCloseoutOpportunities - runnerCloseoutAttempts);
    const corpSymptoms =
      corpNoProgress.length +
      strategicWindow.filter((entry) =>
        isCorpEndgameStallSymptom(entry, {
          planKind: planKindForConversion(entry),
          meaningfulBoardProgress: isMeaningfulBoardProgress(entry),
        }),
      ).length +
      Math.max(
        0,
        corpScorePathOpportunities.length - corpScorePathTaken.length,
      ) +
      Math.max(0, corpCloseoutOpportunities - corpCloseoutAttempts);
    const likelyMetricArtifact =
      strategicWindow.length === 0 ||
      (windowNoProgress.length <= 2 &&
        sequence.filter((entry) => !isStrategicPlanDecision(entry)).length >
          strategicWindow.length);
    const likelyDeckPressureIssue =
      pressureActions.length <= 1 &&
      runnerCloseoutOpportunities === 0 &&
      corpCloseoutOpportunities === 0 &&
      setupOrEconomyActions.length + protectionActions.length >=
        Math.max(3, windowNoProgress.length);

    if (likelyMetricArtifact) actionLimitLikelyMetricArtifact += 1;
    else if (likelyDeckPressureIssue) actionLimitLikelyDeckPressureIssue += 1;
    else actionLimitLikelyStrategyIssue += 1;

    if (runnerSymptoms > 0 || corpSymptoms > 0) {
      if (
        runnerSymptoms > 0 &&
        corpSymptoms > 0 &&
        Math.abs(runnerSymptoms - corpSymptoms) <= 3
      ) {
        actionLimitDominantSideBoth += 1;
      } else if (runnerSymptoms > corpSymptoms) {
        actionLimitDominantSideRunner += 1;
      } else {
        actionLimitDominantSideCorp += 1;
      }
    }
  }

  return {
    actionLimitRootCauseByMatch,
    actionLimitDominantSide:
      actionLimitDominantSideRunner +
      actionLimitDominantSideCorp +
      actionLimitDominantSideBoth,
    actionLimitDominantSideRunner,
    actionLimitDominantSideCorp,
    actionLimitDominantSideBoth,
    finalStrategicWindowNoProgressActions,
    finalStrategicWindowRunnerNoProgressActions,
    finalStrategicWindowCorpNoProgressActions,
    finalWindowRunnerMeaningfulRunOpportunities,
    finalWindowRunnerMeaningfulRunsTaken,
    finalWindowCorpScorePathOpportunities,
    finalWindowCorpScorePathTaken,
    finalWindowKnownInfoExploitationOpportunities,
    finalWindowKnownInfoExploitationTaken,
    endgameCloseoutOpportunitiesRunner,
    endgameCloseoutOpportunitiesRunnerRaw,
    endgameCloseoutOpportunitiesRunnerDeduped,
    endgameCloseoutOpportunitiesRunnerTrue,
    endgameCloseoutOpportunitiesRunnerFalsePositive,
    runnerCloseoutByKnownHqAgenda,
    runnerCloseoutByKnownRndTopAgenda,
    runnerCloseoutByKnownRemoteAgenda,
    runnerCloseoutByPointsToWin,
    runnerCloseoutBlockedByCredits,
    runnerCloseoutBlockedByBreakerCoverage,
    runnerCloseoutBlockedByPostRunReserve,
    runnerCloseoutAttempted,
    runnerCloseoutSkippedWithReason,
    endgameCloseoutOpportunitiesCorp,
    endgameCloseoutAttemptsRunner,
    endgameCloseoutAttemptsCorp,
    endgameScoreOrStealPressureActions,
    endgameSetupOrEconomyActions,
    endgameProtectionActions,
    endgameLowValueRepeatActions,
    actionLimitLikelyDeckPressureIssue,
    actionLimitLikelyStrategyIssue,
    actionLimitLikelyMetricArtifact,
  };
}

function summarizeStrategicPlanConversionMetrics(
  summaries: AiSimulationSummary[],
): Pick<
  AiMatchProgressionMetrics,
  | "strategicNoProgressActionChainLength"
  | "strategicLongestNoProgressChain"
  | "microActionNoProgressContribution"
  | "planContinuationOpportunities"
  | "planContinuationTaken"
  | "planContinuationRate"
  | "planAbortOpportunities"
  | "planAbortTaken"
  | "planAbortWithReason"
  | "planIntentConvertedWithin1OwnDecision"
  | "planIntentConvertedWithin2OwnDecisions"
  | "planIntentConvertedWithin3OwnDecisions"
  | "planIntentExpired"
  | "planIntentAbandonedWithoutReason"
  | "sameStrategicPlanRepeatedWithoutProgress"
  | "runnerEconomyConvertedToRunOrRig"
  | "runnerRigConvertedToRun"
  | "runnerProbeConvertedToUsefulInfoOrPivot"
  | "runnerCentralPressureConvertedToStealOrFreshValue"
  | "runnerRemoteContestConvertedToStealTrashOrCorrectAbort"
  | "corpRemoteBuildConvertedToAdvanceProtectOrScore"
  | "corpAdvanceConvertedToScoreOrProtectedWindow"
  | "corpEconomyConvertedToRezInstallScore"
  | "corpProtectionConvertedToScoreSafety"
> {
  let strategicLongestNoProgressChain = 0;
  let microActionNoProgressContribution = 0;
  let planContinuationOpportunities = 0;
  let planContinuationTaken = 0;
  let planAbortOpportunities = 0;
  let planAbortTaken = 0;
  let planAbortWithReason = 0;
  let planIntentConvertedWithin1OwnDecision = 0;
  let planIntentConvertedWithin2OwnDecisions = 0;
  let planIntentConvertedWithin3OwnDecisions = 0;
  let planIntentExpired = 0;
  let planIntentAbandonedWithoutReason = 0;
  let sameStrategicPlanRepeatedWithoutProgress = 0;
  let runnerEconomyConvertedToRunOrRig = 0;
  let runnerRigConvertedToRun = 0;
  let runnerProbeConvertedToUsefulInfoOrPivot = 0;
  let runnerCentralPressureConvertedToStealOrFreshValue = 0;
  let runnerRemoteContestConvertedToStealTrashOrCorrectAbort = 0;
  let corpRemoteBuildConvertedToAdvanceProtectOrScore = 0;
  let corpAdvanceConvertedToScoreOrProtectedWindow = 0;
  let corpEconomyConvertedToRezInstallScore = 0;
  let corpProtectionConvertedToScoreSafety = 0;
  const strategicChains: number[] = [];

  for (const summary of summaries) {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    let strategicChain = 0;
    for (const entry of sequence) {
      const hasProgress = isMeaningfulBoardProgress(entry);
      if (!isStrategicPlanDecision(entry)) {
        if (!hasProgress) microActionNoProgressContribution += 1;
        continue;
      }
      if (hasProgress) {
        if (strategicChain > 0) strategicChains.push(strategicChain);
        strategicLongestNoProgressChain = Math.max(
          strategicLongestNoProgressChain,
          strategicChain,
        );
        strategicChain = 0;
      } else {
        strategicChain += 1;
      }
      if (hasEvidenceFlag(entry, "plan_continuation_opportunity:true"))
        planContinuationOpportunities += 1;
      if (hasEvidenceFlag(entry, "plan_continuation_taken:true"))
        planContinuationTaken += 1;
      if (hasEvidenceFlag(entry, "plan_abort_opportunity:true"))
        planAbortOpportunities += 1;
      if (hasEvidenceFlag(entry, "plan_abort_taken:true")) planAbortTaken += 1;
      if (
        hasEvidenceFlag(entry, "plan_abort_taken:true") &&
        entry.evidence.some((value) => value.startsWith("plan_abort_reason:"))
      )
        planAbortWithReason += 1;
      if (hasEvidenceFlag(entry, "plan_intent_expired:true"))
        planIntentExpired += 1;
    }
    if (strategicChain > 0) {
      strategicChains.push(strategicChain);
      strategicLongestNoProgressChain = Math.max(
        strategicLongestNoProgressChain,
        strategicChain,
      );
    }

    const strategicEntries = sequence.filter(isStrategicPlanDecision);
    const lastPlanBySide: Partial<
      Record<Side, { planKind: string; progressSince: boolean }>
    > = {};
    strategicEntries.forEach((entry, index) => {
      const planKind = planKindForConversion(entry);
      if (!planKind) return;
      const lastPlan = lastPlanBySide[entry.side];
      if (lastPlan?.planKind === planKind && !lastPlan.progressSince) {
        sameStrategicPlanRepeatedWithoutProgress += 1;
      }
      const planConvertsWithinOwnDecisions = (ownDecisions: number) =>
        strategicPlanConvertsWithinOwnDecisions(
          strategicEntries,
          index,
          ownDecisions,
          isMeaningfulBoardProgress,
        );
      if (planConvertsWithinOwnDecisions(1))
        planIntentConvertedWithin1OwnDecision += 1;
      if (planConvertsWithinOwnDecisions(2))
        planIntentConvertedWithin2OwnDecisions += 1;
      if (planConvertsWithinOwnDecisions(3))
        planIntentConvertedWithin3OwnDecisions += 1;
      else if (
        !hasEvidenceFlag(entry, "plan_abort_taken:true") &&
        !hasEvidenceFlag(entry, "plan_intent_expired:true")
      )
        planIntentAbandonedWithoutReason += 1;

      if (entry.side === "runner" && planKind.includes("recover_economy")) {
        if (
          runnerEconomyConvertsToRunOrRig(
            strategicEntries,
            index,
            isMeaningfulBoardProgress,
          )
        )
          runnerEconomyConvertedToRunOrRig += 1;
      }
      if (entry.side === "runner" && planKind.includes("rig")) {
        if (
          runnerRigConvertsToRun(
            strategicEntries,
            index,
            isMeaningfulBoardProgress,
          )
        )
          runnerRigConvertedToRun += 1;
      }
      if (entry.side === "runner" && planKind.includes("safe_probe")) {
        if (
          runnerProbeConvertsToUsefulInfoOrPivot(
            strategicEntries,
            index,
            isMeaningfulBoardProgress,
          )
        )
          runnerProbeConvertedToUsefulInfoOrPivot += 1;
      }
      if (entry.side === "runner" && planKind.includes("pressure")) {
        if (
          runnerCentralPressureConvertsToStealOrFreshValue(
            strategicEntries,
            index,
            isMeaningfulBoardProgress,
          )
        )
          runnerCentralPressureConvertedToStealOrFreshValue += 1;
      }
      if (entry.side === "runner" && planKind.includes("contest_remote")) {
        if (
          runnerRemoteContestConvertsToStealTrashOrAbort(
            strategicEntries,
            index,
            isMeaningfulBoardProgress,
          )
        )
          runnerRemoteContestConvertedToStealTrashOrCorrectAbort += 1;
      }
      if (entry.side === "corp" && planKind.includes("remote_build")) {
        if (
          corpRemoteBuildConvertsToAdvanceProtectOrScore(
            strategicEntries,
            index,
            isMeaningfulBoardProgress,
            isCorpRemoteAdvancementProgress,
          )
        )
          corpRemoteBuildConvertedToAdvanceProtectOrScore += 1;
      }
      if (entry.side === "corp" && planKind.includes("advance")) {
        if (
          corpAdvanceConvertsToScoreOrProtectedWindow(strategicEntries, index)
        )
          corpAdvanceConvertedToScoreOrProtectedWindow += 1;
      }
      if (entry.side === "corp" && planKind.includes("economy")) {
        if (corpEconomyConvertsToRezInstallScore(strategicEntries, index))
          corpEconomyConvertedToRezInstallScore += 1;
      }
      if (
        entry.side === "corp" &&
        (planKind.includes("protect_hq") || planKind.includes("protect_rnd"))
      ) {
        if (corpProtectionConvertsToScoreSafety(strategicEntries, index))
          corpProtectionConvertedToScoreSafety += 1;
      }

      lastPlanBySide[entry.side] = { planKind, progressSince: false };
      if (isMeaningfulBoardProgress(entry)) {
        for (const side of Object.keys(lastPlanBySide) as Side[]) {
          const last = lastPlanBySide[side];
          if (last) last.progressSince = true;
        }
      }
    });
  }

  return {
    strategicNoProgressActionChainLength: averageNumber(strategicChains),
    strategicLongestNoProgressChain,
    microActionNoProgressContribution,
    planContinuationOpportunities,
    planContinuationTaken,
    planContinuationRate:
      planContinuationOpportunities > 0
        ? round(planContinuationTaken / planContinuationOpportunities)
        : 0,
    planAbortOpportunities,
    planAbortTaken,
    planAbortWithReason,
    planIntentConvertedWithin1OwnDecision,
    planIntentConvertedWithin2OwnDecisions,
    planIntentConvertedWithin3OwnDecisions,
    planIntentExpired,
    planIntentAbandonedWithoutReason,
    sameStrategicPlanRepeatedWithoutProgress,
    runnerEconomyConvertedToRunOrRig,
    runnerRigConvertedToRun,
    runnerProbeConvertedToUsefulInfoOrPivot,
    runnerCentralPressureConvertedToStealOrFreshValue,
    runnerRemoteContestConvertedToStealTrashOrCorrectAbort,
    corpRemoteBuildConvertedToAdvanceProtectOrScore,
    corpAdvanceConvertedToScoreOrProtectedWindow,
    corpEconomyConvertedToRezInstallScore,
    corpProtectionConvertedToScoreSafety,
  };
}

function summarizeOutcomeFollowupMetrics(
  summaries: AiSimulationSummary[],
): Pick<
  AiMatchProgressionMetrics,
  | "runnerCentralSuccessFollowedByValue"
  | "runnerCentralSuccessFollowedByRepeatNoValue"
  | "runnerCentralNoValuePivoted"
  | "runnerRemoteSuccessFollowedByValue"
  | "runnerRemoteEmptyOrLowValuePivoted"
  | "runnerJackOutRepeatedSameServerWithoutNewInfo"
  | "runnerJackOutFollowedByEconomyOrRig"
  | "runnerAccessNoValueRepeated"
  | "runnerAccessNoValuePivoted"
  | "runnerEconomyConvertedAfterOutcome"
  | "runnerRigConvertedAfterOutcome"
  | "corpRemoteStealFollowupProtectOrPivot"
  | "corpRemoteStealFollowupRepeatedUnsafeLine"
  | "corpCentralStealFollowupProtectCentral"
  | "corpRunnerFailedRunFollowupScoreOrAdvance"
  | "corpRunnerSuccessfulRunFollowupProtect"
  | "corpAdvanceFollowupScore"
  | "corpAdvanceFollowupProtect"
  | "corpRemoteBuildFollowupAdvanceProtectScore"
  | "corpRemoteBuildFollowupNoop"
  | "outcomeFollowupOpportunities"
  | "outcomeFollowupTaken"
  | "outcomeFollowupRate"
  | "outcomeFollowupApplied"
  | "outcomeFollowupSuppressedByProgressionCost"
  | "outcomeFollowupSuppressedByBetterImmediateValue"
  | "outcomeFollowupLedToProgressWithin3"
  | "outcomeFollowupLedToNoProgressChain"
  | "outcomeFollowupDelayedScoreWindow"
  | "outcomeFollowupPreservedScoreWindow"
  | "outcomeFollowupDelayedStealOrTrash"
  | "outcomeFollowupPreservedContestReserve"
  | "runnerOutcomePivotConverted"
  | "runnerOutcomePivotStalled"
  | "corpOutcomePivotConverted"
  | "corpOutcomePivotStalled"
  | "corpScoreWindowOverriddenByFollowup"
  | "scoreNowProtectedFromFollowup"
  | "stealTrashProtectedFromFollowup"
  | "effectiveRunQuoteBlockedFollowupRun"
  | "unbrokenRunEffectChangedBreakDecision"
  | "futureEffectSubroutinesEncountered"
  | "futureEffectSubroutinesWithRemainingIce"
  | "futureEffectSubroutinesWithoutRemainingIce"
  | "futureEffectBreaksTaken"
  | "futureEffectBreaksSkippedNoRemainingIce"
  | "futureEffectBreaksTakenWithoutRemainingIce"
  | "pumpActionsBeforeFutureEffectBreak"
  | "pumpActionsThatCouldNotLeadToBreak"
  | "pumpActionsThatDestroyedAccessReserve"
  | "breakSkippedToPreserveTrashReserve"
  | "unbrokenRunEffectIgnoredBecauseNoRemainingIce"
  | "unbrokenRunEffectAppliedToRemainingPath"
  | "badOutcomeRepeatedWithoutNewInfo"
  | "goodOutcomeConverted"
  | "outcomePivotWithReason"
  | "outcomeIgnored"
> {
  let runnerCentralSuccessFollowedByValue = 0;
  let runnerCentralSuccessFollowedByRepeatNoValue = 0;
  let runnerCentralNoValuePivoted = 0;
  let runnerRemoteSuccessFollowedByValue = 0;
  let runnerRemoteEmptyOrLowValuePivoted = 0;
  let runnerJackOutRepeatedSameServerWithoutNewInfo = 0;
  let runnerJackOutFollowedByEconomyOrRig = 0;
  let runnerAccessNoValueRepeated = 0;
  let runnerAccessNoValuePivoted = 0;
  let runnerEconomyConvertedAfterOutcome = 0;
  let runnerRigConvertedAfterOutcome = 0;
  let corpRemoteStealFollowupProtectOrPivot = 0;
  let corpRemoteStealFollowupRepeatedUnsafeLine = 0;
  let corpCentralStealFollowupProtectCentral = 0;
  let corpRunnerFailedRunFollowupScoreOrAdvance = 0;
  let corpRunnerSuccessfulRunFollowupProtect = 0;
  let corpAdvanceFollowupScore = 0;
  let corpAdvanceFollowupProtect = 0;
  let corpRemoteBuildFollowupAdvanceProtectScore = 0;
  let corpRemoteBuildFollowupNoop = 0;
  let outcomeFollowupOpportunities = 0;
  let outcomeFollowupTaken = 0;
  let outcomeFollowupApplied = 0;
  let outcomeFollowupSuppressedByProgressionCost = 0;
  let outcomeFollowupSuppressedByBetterImmediateValue = 0;
  let outcomeFollowupLedToProgressWithin3 = 0;
  let outcomeFollowupLedToNoProgressChain = 0;
  let outcomeFollowupDelayedScoreWindow = 0;
  let outcomeFollowupPreservedScoreWindow = 0;
  let outcomeFollowupDelayedStealOrTrash = 0;
  let outcomeFollowupPreservedContestReserve = 0;
  let runnerOutcomePivotConverted = 0;
  let runnerOutcomePivotStalled = 0;
  let corpOutcomePivotConverted = 0;
  let corpOutcomePivotStalled = 0;
  let corpScoreWindowOverriddenByFollowup = 0;
  let scoreNowProtectedFromFollowup = 0;
  let stealTrashProtectedFromFollowup = 0;
  let effectiveRunQuoteBlockedFollowupRun = 0;
  let unbrokenRunEffectChangedBreakDecision = 0;
  let futureEffectSubroutinesEncountered = 0;
  let futureEffectSubroutinesWithRemainingIce = 0;
  let futureEffectSubroutinesWithoutRemainingIce = 0;
  let futureEffectBreaksTaken = 0;
  let futureEffectBreaksSkippedNoRemainingIce = 0;
  let futureEffectBreaksTakenWithoutRemainingIce = 0;
  let pumpActionsBeforeFutureEffectBreak = 0;
  let pumpActionsThatCouldNotLeadToBreak = 0;
  let pumpActionsThatDestroyedAccessReserve = 0;
  let breakSkippedToPreserveTrashReserve = 0;
  let unbrokenRunEffectIgnoredBecauseNoRemainingIce = 0;
  let unbrokenRunEffectAppliedToRemainingPath = 0;
  let badOutcomeRepeatedWithoutNewInfo = 0;
  let goodOutcomeConverted = 0;
  let outcomePivotWithReason = 0;
  let outcomeIgnored = 0;

  for (const summary of summaries) {
    for (const [index, entry] of summary.actionSequence.entries()) {
      if (hasEvidenceFlag(entry, "outcome_followup_opportunity:true"))
        outcomeFollowupOpportunities += 1;
      if (hasEvidenceFlag(entry, "outcome_followup_taken:true"))
        outcomeFollowupTaken += 1;
      if (hasEvidenceFlag(entry, "outcome_followup_applied:true")) {
        outcomeFollowupApplied += 1;
        const progressedWithin3 = hasMeaningfulProgressWithin(
          summary.actionSequence, index, 3, isMeaningfulBoardProgress
        );
        if (progressedWithin3) {
          outcomeFollowupLedToProgressWithin3 += 1;
          if (entry.side === "runner") runnerOutcomePivotConverted += 1;
          if (entry.side === "corp") corpOutcomePivotConverted += 1;
        } else {
          outcomeFollowupLedToNoProgressChain += 1;
          if (entry.side === "runner") runnerOutcomePivotStalled += 1;
          if (entry.side === "corp") corpOutcomePivotStalled += 1;
        }
      }
      if (
        hasEvidenceFlag(
          entry,
          "outcome_followup_suppressed_by_progression_cost:true",
        )
      )
        outcomeFollowupSuppressedByProgressionCost += 1;
      if (
        hasEvidenceFlag(
          entry,
          "outcome_followup_suppressed_by_better_immediate_value:true",
        )
      )
        outcomeFollowupSuppressedByBetterImmediateValue += 1;
      if (hasEvidenceFlag(entry, "outcome_followup_delayed_score_window:true"))
        outcomeFollowupDelayedScoreWindow += 1;
      if (
        hasEvidenceFlag(entry, "outcome_followup_preserved_score_window:true")
      )
        outcomeFollowupPreservedScoreWindow += 1;
      if (
        hasEvidenceFlag(entry, "outcome_followup_delayed_steal_or_trash:true")
      )
        outcomeFollowupDelayedStealOrTrash += 1;
      if (
        hasEvidenceFlag(
          entry,
          "outcome_followup_preserved_contest_reserve:true",
        )
      )
        outcomeFollowupPreservedContestReserve += 1;
      if (
        hasEvidenceFlag(entry, "corp_score_window_overridden_by_followup:true")
      )
        corpScoreWindowOverriddenByFollowup += 1;
      if (hasEvidenceFlag(entry, "score_now_protected_from_followup:true"))
        scoreNowProtectedFromFollowup += 1;
      if (hasEvidenceFlag(entry, "steal_trash_protected_from_followup:true"))
        stealTrashProtectedFromFollowup += 1;
      if (
        hasEvidenceFlag(entry, "effective_run_quote_blocked_followup_run:true")
      )
        effectiveRunQuoteBlockedFollowupRun += 1;
      if (hasEvidenceFlag(entry, "run_remainder_effect_must_break:true"))
        unbrokenRunEffectChangedBreakDecision += 1;
      if (hasEvidenceFlag(entry, "run_remainder_subroutine_effect:true")) {
        futureEffectSubroutinesEncountered += 1;
        if (
          hasEvidenceFlag(
            entry,
            "unbroken_run_effect_applied_to_remaining_path:true",
          )
        ) {
          futureEffectSubroutinesWithRemainingIce += 1;
          unbrokenRunEffectAppliedToRemainingPath += 1;
        }
        if (
          hasEvidenceFlag(
            entry,
            "unbroken_run_effect_ignored_because_no_remaining_ice:true",
          )
        ) {
          futureEffectSubroutinesWithoutRemainingIce += 1;
          unbrokenRunEffectIgnoredBecauseNoRemainingIce += 1;
        }
      }
      if (
        entry.actionType === "break_subroutine" &&
        hasEvidenceFlag(entry, "run_remainder_subroutine_effect:true")
      )
        futureEffectBreaksTaken += 1;
      if (
        entry.actionType === "continue_run" &&
        hasEvidenceFlag(
          entry,
          "unbroken_run_effect_ignored_because_no_remaining_ice:true",
        )
      )
        futureEffectBreaksSkippedNoRemainingIce += 1;
      if (
        entry.actionType === "break_subroutine" &&
        hasEvidenceFlag(
          entry,
          "unbroken_run_effect_ignored_because_no_remaining_ice:true",
        )
      )
        futureEffectBreaksTakenWithoutRemainingIce += 1;
      if (
        entry.actionType === "pump_breaker" &&
        hasEvidenceFlag(entry, "run_remainder_subroutine_effect:true")
      )
        pumpActionsBeforeFutureEffectBreak += 1;
      if (hasEvidenceFlag(entry, "pump_cannot_lead_to_useful_break:true"))
        pumpActionsThatCouldNotLeadToBreak += 1;
      if (hasEvidenceFlag(entry, "pump_would_destroy_access_reserve:true"))
        pumpActionsThatDestroyedAccessReserve += 1;
      if (
        hasEvidenceFlag(entry, "break_skipped_to_preserve_trash_reserve:true")
      )
        breakSkippedToPreserveTrashReserve += 1;
      if (hasEvidenceFlag(entry, "bad_outcome_repeated_without_new_info:true"))
        badOutcomeRepeatedWithoutNewInfo += 1;
      if (hasEvidenceFlag(entry, "good_outcome_converted:true"))
        goodOutcomeConverted += 1;
      if (hasEvidenceFlag(entry, "outcome_pivot_with_reason:true"))
        outcomePivotWithReason += 1;
      if (hasEvidenceFlag(entry, "outcome_ignored:true")) outcomeIgnored += 1;
      if (
        hasEvidenceFlag(entry, "runner_central_success_followed_by_value:true")
      )
        runnerCentralSuccessFollowedByValue += 1;
      if (
        hasEvidenceFlag(
          entry,
          "runner_central_success_followed_by_repeat_no_value:true",
        )
      )
        runnerCentralSuccessFollowedByRepeatNoValue += 1;
      if (hasEvidenceFlag(entry, "runner_central_no_value_pivoted:true"))
        runnerCentralNoValuePivoted += 1;
      if (
        hasEvidenceFlag(entry, "runner_remote_success_followed_by_value:true")
      )
        runnerRemoteSuccessFollowedByValue += 1;
      if (
        hasEvidenceFlag(entry, "runner_remote_empty_or_low_value_pivoted:true")
      )
        runnerRemoteEmptyOrLowValuePivoted += 1;
      if (
        hasEvidenceFlag(
          entry,
          "runner_jack_out_repeated_same_server_without_new_info:true",
        )
      )
        runnerJackOutRepeatedSameServerWithoutNewInfo += 1;
      if (
        hasEvidenceFlag(
          entry,
          "runner_jack_out_followed_by_economy_or_rig:true",
        )
      )
        runnerJackOutFollowedByEconomyOrRig += 1;
      if (hasEvidenceFlag(entry, "runner_access_no_value_repeated:true"))
        runnerAccessNoValueRepeated += 1;
      if (hasEvidenceFlag(entry, "runner_access_no_value_pivoted:true"))
        runnerAccessNoValuePivoted += 1;
      if (hasEvidenceFlag(entry, "runner_economy_converted_after_outcome:true"))
        runnerEconomyConvertedAfterOutcome += 1;
      if (hasEvidenceFlag(entry, "runner_rig_converted_after_outcome:true"))
        runnerRigConvertedAfterOutcome += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_remote_steal_followup_protect_or_pivot:true",
        )
      )
        corpRemoteStealFollowupProtectOrPivot += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_remote_steal_followup_repeated_unsafe_line:true",
        )
      )
        corpRemoteStealFollowupRepeatedUnsafeLine += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_central_steal_followup_protect_central:true",
        )
      )
        corpCentralStealFollowupProtectCentral += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_runner_failed_run_followup_score_or_advance:true",
        )
      )
        corpRunnerFailedRunFollowupScoreOrAdvance += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_runner_successful_run_followup_protect:true",
        )
      )
        corpRunnerSuccessfulRunFollowupProtect += 1;
      if (hasEvidenceFlag(entry, "corp_advance_followup_score:true"))
        corpAdvanceFollowupScore += 1;
      if (hasEvidenceFlag(entry, "corp_advance_followup_protect:true"))
        corpAdvanceFollowupProtect += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_remote_build_followup_advance_protect_score:true",
        )
      )
        corpRemoteBuildFollowupAdvanceProtectScore += 1;
      if (hasEvidenceFlag(entry, "corp_remote_build_followup_noop:true"))
        corpRemoteBuildFollowupNoop += 1;
    }
  }

  return {
    runnerCentralSuccessFollowedByValue,
    runnerCentralSuccessFollowedByRepeatNoValue,
    runnerCentralNoValuePivoted,
    runnerRemoteSuccessFollowedByValue,
    runnerRemoteEmptyOrLowValuePivoted,
    runnerJackOutRepeatedSameServerWithoutNewInfo,
    runnerJackOutFollowedByEconomyOrRig,
    runnerAccessNoValueRepeated,
    runnerAccessNoValuePivoted,
    runnerEconomyConvertedAfterOutcome,
    runnerRigConvertedAfterOutcome,
    corpRemoteStealFollowupProtectOrPivot,
    corpRemoteStealFollowupRepeatedUnsafeLine,
    corpCentralStealFollowupProtectCentral,
    corpRunnerFailedRunFollowupScoreOrAdvance,
    corpRunnerSuccessfulRunFollowupProtect,
    corpAdvanceFollowupScore,
    corpAdvanceFollowupProtect,
    corpRemoteBuildFollowupAdvanceProtectScore,
    corpRemoteBuildFollowupNoop,
    outcomeFollowupOpportunities,
    outcomeFollowupTaken,
    outcomeFollowupRate:
      outcomeFollowupOpportunities > 0
        ? round(outcomeFollowupTaken / outcomeFollowupOpportunities)
        : 0,
    outcomeFollowupApplied,
    outcomeFollowupSuppressedByProgressionCost,
    outcomeFollowupSuppressedByBetterImmediateValue,
    outcomeFollowupLedToProgressWithin3,
    outcomeFollowupLedToNoProgressChain,
    outcomeFollowupDelayedScoreWindow,
    outcomeFollowupPreservedScoreWindow,
    outcomeFollowupDelayedStealOrTrash,
    outcomeFollowupPreservedContestReserve,
    runnerOutcomePivotConverted,
    runnerOutcomePivotStalled,
    corpOutcomePivotConverted,
    corpOutcomePivotStalled,
    corpScoreWindowOverriddenByFollowup,
    scoreNowProtectedFromFollowup,
    stealTrashProtectedFromFollowup,
    effectiveRunQuoteBlockedFollowupRun,
    unbrokenRunEffectChangedBreakDecision,
    futureEffectSubroutinesEncountered,
    futureEffectSubroutinesWithRemainingIce,
    futureEffectSubroutinesWithoutRemainingIce,
    futureEffectBreaksTaken,
    futureEffectBreaksSkippedNoRemainingIce,
    futureEffectBreaksTakenWithoutRemainingIce,
    pumpActionsBeforeFutureEffectBreak,
    pumpActionsThatCouldNotLeadToBreak,
    pumpActionsThatDestroyedAccessReserve,
    breakSkippedToPreserveTrashReserve,
    unbrokenRunEffectIgnoredBecauseNoRemainingIce,
    unbrokenRunEffectAppliedToRemainingPath,
    badOutcomeRepeatedWithoutNewInfo,
    goodOutcomeConverted,
    outcomePivotWithReason,
    outcomeIgnored,
  };
}

function countRunnerCoverageConversions(
  sequence: AiSimulationActionSequenceEntry[],
  predicate: (entry: AiSimulationActionSequenceEntry) => boolean,
): number {
  return sequence.filter((entry, index) => {
    if (entry.side !== "runner" || !predicate(entry)) return false;
    return nextEntries(sequence, index, 6).some(
      (later) =>
        later.side === "runner" &&
        later.actionType === "start_run" &&
        (isMeaningfulBoardProgress(later) ||
          later.runnerPhaseExitToPressure === true ||
          later.runnerRemoteRunAgainstAdvancedRemote === true ||
          later.runnerCentralCloseoutRunTaken === true),
    );
  }).length;
}

function countRunnerPressureWithinOwnActions(
  sequence: AiSimulationActionSequenceEntry[],
  predicate: (entry: AiSimulationActionSequenceEntry) => boolean,
  ownActionWindow: number,
): number {
  return sequence.filter((entry, index) => {
    if (entry.side !== "runner" || !predicate(entry)) return false;
    let ownActions = 0;
    for (
      let candidateIndex = index + 1;
      candidateIndex < sequence.length;
      candidateIndex += 1
    ) {
      const candidate = sequence[candidateIndex]!;
      if (candidate.side !== "runner") continue;
      ownActions += 1;
      if (candidate.runnerPressureTakenAfterCoverageReady === true) return true;
      if (ownActions >= ownActionWindow) return false;
    }
    return false;
  }).length;
}

function countRunnerEconomySetupMetric(
  sequence: AiSimulationActionSequenceEntry[],
  metric: keyof AiSimulationActionSequenceEntry,
): number {
  return sequence.filter((entry) => entry[metric] === true).length;
}

function countRunnerSearchRecoveryNoInstallFollowup(
  sequence: AiSimulationActionSequenceEntry[],
): number {
  return sequence.filter((entry, index) => {
    if (
      entry.side !== "runner" ||
      (entry.runnerSearchTaken !== true && entry.runnerRecoveryTaken !== true)
    )
      return false;
    let ownActions = 0;
    for (
      let candidateIndex = index + 1;
      candidateIndex < sequence.length;
      candidateIndex += 1
    ) {
      const candidate = sequence[candidateIndex]!;
      if (candidate.side !== "runner") continue;
      ownActions += 1;
      if (candidate.actionType === "install_card") return false;
      if (candidate.actionType === "start_run") return false;
      if (ownActions >= 3) return true;
    }
    return ownActions > 0;
  }).length;
}

const RUNNER_SETUP_ATTRIBUTION_METRIC_KEYS: RunnerSetupAttributionMetricKey[] =
  [
    "runnerStarvedEconomySkipWindows",
    "runnerStarvedEconomySkipChosenRun",
    "runnerStarvedEconomySkipChosenDraw",
    "runnerStarvedEconomySkipChosenInstall",
    "runnerStarvedEconomySkipChosenSearchRecovery",
    "runnerStarvedEconomySkipChosenTrash",
    "runnerStarvedEconomySkipChosenEndTurn",
    "runnerStarvedEconomySkipChosenUnknown",
    "runnerStarvedEconomySkipThenUnaffordableRun",
    "runnerStarvedEconomySkipThenFailedRun",
    "runnerStarvedEconomySkipThenNoProgress",
    "runnerStarvedEconomySkipThenEconomyNextDecision",
    "runnerStarvedEconomySkipThenReserveRecovered",
    "runnerStarvedEconomySkipThenProgress",
    "runnerStarvedEconomySkipThenActionLimit",
    "runnerStarvedEconomySkipPlausiblePressure",
    "runnerStarvedEconomySkipPlausibleRemoteContest",
    "runnerStarvedEconomySkipPlausibleCriticalSetup",
    "runnerStarvedEconomySkipPlausibleTrash",
    "runnerStarvedEconomySkipSuspiciousLowValueRun",
    "runnerStarvedEconomySkipSuspiciousDraw",
    "runnerStarvedEconomySkipSuspiciousEndTurn",
    "runnerStarvedEconomySkipSuspiciousUnknown",
    "runnerEconomyFixGateAttributionEligible",
    "runnerEconomyFixGateAttributionBlocked",
    "runnerEconomyFixGateAttributionSuspicious",
    "runnerSearchRecoveryFixGateWindows",
    "runnerSearchRecoveryFixGateLegalSearch",
    "runnerSearchRecoveryFixGateLegalRecovery",
    "runnerSearchRecoveryFixGateMissingWall",
    "runnerSearchRecoveryFixGateMissingCodeGate",
    "runnerSearchRecoveryFixGateMissingSentry",
    "runnerSearchRecoveryFixGateMissingUniversal",
    "runnerSearchRecoveryFixGateMissingSpecial",
    "runnerSearchRecoveryAttributionWindows",
    "runnerSearchRecoveryAttributionLegalSearch",
    "runnerSearchRecoveryAttributionLegalRecovery",
    "runnerSearchRecoveryAttributionMissingWall",
    "runnerSearchRecoveryAttributionMissingCodeGate",
    "runnerSearchRecoveryAttributionMissingSentry",
    "runnerSearchRecoveryAttributionMissingUniversal",
    "runnerSearchRecoveryAttributionMissingSpecial",
    "runnerSearchRecoveryAttributionSearchTaken",
    "runnerSearchRecoveryAttributionRecoveryTaken",
    "runnerSearchRecoveryAttributionSkipped",
    "runnerSearchRecoverySkipChosenEconomy",
    "runnerSearchRecoverySkipChosenRun",
    "runnerSearchRecoverySkipChosenDraw",
    "runnerSearchRecoverySkipChosenInstall",
    "runnerSearchRecoverySkipChosenTrash",
    "runnerSearchRecoverySkipChosenEndTurn",
    "runnerSearchRecoverySkipChosenUnknown",
    "runnerSearchRecoverySkipThenInstallFollowup",
    "runnerSearchRecoverySkipThenCoverageResolved",
    "runnerSearchRecoverySkipThenCoverageStillMissing",
    "runnerSearchRecoverySkipThenKnownUnaffordableRun",
    "runnerSearchRecoverySkipThenNoProgress",
    "runnerSearchRecoverySkipThenActionLimit",
    "runnerSearchRecoveryWindowWithNoInstallFollowup",
    "runnerSearchRecoverySkipPlausibleEconomyReserve",
    "runnerSearchRecoverySkipPlausiblePressure",
    "runnerSearchRecoverySkipPlausibleRemoteContest",
    "runnerSearchRecoverySkipPlausibleCurrentRigEnough",
    "runnerSearchRecoverySkipSuspiciousCoverageStillMissing",
    "runnerSearchRecoverySkipSuspiciousNoProgress",
    "runnerSearchRecoverySkipSuspiciousKnownUnbreakableRun",
    "runnerSearchRecoverySkipUnclassified",
    "runnerSearchRecoveryFixGateAttributionEligible",
    "runnerSearchRecoveryFixGateAttributionBlocked",
    "runnerSearchRecoveryFixGateAttributionSuspicious",
    "runnerMemoryFixGateWindows",
    "runnerHandSizeFixGateWindows",
    "runnerMemoryFixGateLegalSupport",
    "runnerHandSizeFixGateLegalSupport",
    "runnerMemoryFixGateSkipped",
    "runnerHandSizeFixGateSkipped",
    "runnerMemoryAttributionWindows",
    "runnerHandSizeAttributionWindows",
    "runnerMemoryAttributionLegalSupport",
    "runnerHandSizeAttributionLegalSupport",
    "runnerMemoryAttributionSupportTaken",
    "runnerHandSizeAttributionSupportTaken",
    "runnerMemoryAttributionSkipped",
    "runnerHandSizeAttributionSkipped",
    "runnerMemorySkipChosenEconomy",
    "runnerMemorySkipChosenRun",
    "runnerMemorySkipChosenDraw",
    "runnerMemorySkipChosenInstallNonMemory",
    "runnerMemorySkipChosenSearchRecovery",
    "runnerMemorySkipChosenEndTurn",
    "runnerMemorySkipChosenUnknown",
    "runnerMemorySkipThenMemoryInstalled",
    "runnerMemorySkipThenProgramInstallBlocked",
    "runnerMemorySkipThenCoverageStillMissing",
    "runnerMemorySkipThenNoProgress",
    "runnerMemorySkipThenActionLimit",
    "runnerHandSizeSkipThenDamageRiskWindow",
    "runnerHandSizeSkipThenDiscardOrDamagePressure",
    "runnerMemorySkipPlausibleEconomyReserve",
    "runnerMemorySkipPlausiblePressure",
    "runnerMemorySkipPlausibleRemoteContest",
    "runnerMemorySkipPlausibleNoProgramPressure",
    "runnerMemorySkipSuspiciousRigBlocked",
    "runnerMemorySkipSuspiciousCoverageStillMissing",
    "runnerMemorySkipSuspiciousNoProgress",
    "runnerMemorySkipUnclassified",
    "runnerMemoryFixGateAttributionEligible",
    "runnerMemoryFixGateAttributionBlocked",
    "runnerMemoryFixGateAttributionSuspicious",
    "runnerHandSizeFixGateAttributionEligible",
    "runnerHandSizeFixGateAttributionBlocked",
    "runnerHandSizeFixGateAttributionSuspicious",
    "runnerSearchRecoveryNormalizedWindows",
    "runnerSearchRecoveryNormalizedTaken",
    "runnerSearchRecoveryNormalizedSkipped",
    "runnerSearchRecoveryNormalizedBlocked",
    "runnerSearchRecoveryNormalizedBlockedByPressureOrRemoteContest",
    "runnerSearchRecoveryNormalizedBlockedByEconomyOrReserve",
    "runnerSearchRecoveryNormalizedBlockedByCurrentRigEnough",
    "runnerSearchRecoveryNormalizedBlockedByNoInstallFollowup",
    "runnerSearchRecoveryNormalizedMetricArtifact",
    "runnerSearchRecoveryNormalizedUnclassified",
    "runnerSearchRecoveryNormalizedSuspicious",
    "runnerSearchRecoveryNormalizedTrueMissedCoverage",
    "runnerSearchRecoveryNormalizedFixGateEligible",
    "runnerMemoryNormalizedWindows",
    "runnerMemoryNormalizedTaken",
    "runnerMemoryNormalizedSkipped",
    "runnerMemoryNormalizedBlocked",
    "runnerMemoryNormalizedBlockedByPressureOrRemoteContest",
    "runnerMemoryNormalizedBlockedByEconomyOrReserve",
    "runnerMemoryNormalizedBlockedByNoProgramPressure",
    "runnerMemoryNormalizedMetricArtifact",
    "runnerMemoryNormalizedUnclassified",
    "runnerMemoryNormalizedSuspicious",
    "runnerMemoryNormalizedTrueRigBottleneck",
    "runnerMemoryNormalizedFixGateEligible",
    "runnerHandSizeNormalizedWindows",
    "runnerHandSizeNormalizedTaken",
    "runnerHandSizeNormalizedSkipped",
    "runnerHandSizeNormalizedBlocked",
    "runnerHandSizeNormalizedSuspicious",
    "runnerHandSizeNormalizedMetricArtifact",
    "runnerSetupNormalizedWindows",
    "runnerSetupNormalizedSuspicious",
    "runnerSetupNormalizedBlocked",
    "runnerSetupNormalizedMetricArtifact",
    "runnerSetupNormalizedUnclassified",
    "runnerSetupNormalizedFixGateEligible",
    "runnerSetupNormalizedRecommendedFixKindNone",
    "runnerSetupNormalizedRecommendedFixKindSearchRecovery",
    "runnerSetupNormalizedRecommendedFixKindMemory",
    "runnerSetupNormalizedRecommendedFixKindHandSize",
    "runnerSetupNormalizedRecommendedFixKindMixedNeedsMoreDiagnosis",
    "runnerSetupAttributionWindows",
    "runnerSetupAttributionSuspicious",
    "runnerSetupAttributionBlocked",
    "runnerSetupAttributionUnclassified",
    "runnerSetupAttributionByKindStarvedEconomy",
    "runnerSetupAttributionByKindSearchRecovery",
    "runnerSetupAttributionByKindMemory",
    "runnerSetupAttributionByKindHandSize",
    "runnerSetupRecommendedFixKindNone",
    "runnerSetupRecommendedFixKindEconomyStarvedSkip",
    "runnerSetupRecommendedFixKindSearchRecovery",
    "runnerSetupRecommendedFixKindMemorySetup",
    "runnerSetupRecommendedFixKindHandSizeSetup",
    "runnerSetupRecommendedFixKindMixedNeedsMoreDiagnosis",
  ];

function summarizeRunnerSetupAttributionMetrics(
  summaries: AiSimulationSummary[],
): Record<RunnerSetupAttributionMetricKey, number> {
  const metrics = Object.fromEntries(
    RUNNER_SETUP_ATTRIBUTION_METRIC_KEYS.map((key) => [key, 0]),
  ) as Record<RunnerSetupAttributionMetricKey, number>;
  for (const summary of summaries) {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    for (let index = 0; index < sequence.length; index += 1) {
      const entry = sequence[index]!;
      attributeRunnerSetupSupportWindows(metrics, entry);
      if (entry.runnerEconomyFixGateEligibleStarvedSkip === true)
        attributeStarvedEconomySkip(metrics, sequence, index, summary);
      if (entry.runnerSetupFixGateEligibleSearchRecoverySkip === true)
        attributeSearchRecoverySkip(metrics, sequence, index, summary);
      if (entry.runnerSetupFixGateEligibleMemorySkip === true)
        attributeMemorySkip(metrics, sequence, index, summary);
      if (entry.runnerHandSizeSupportSkippedWhileDamageRiskVisible === true)
        attributeHandSizeSkip(metrics, sequence, index);
    }
  }
  metrics.runnerSetupAttributionWindows =
    metrics.runnerSetupAttributionByKindStarvedEconomy +
    metrics.runnerSetupAttributionByKindSearchRecovery +
    metrics.runnerSetupAttributionByKindMemory +
    metrics.runnerSetupAttributionByKindHandSize;
  metrics.runnerSetupAttributionSuspicious =
    metrics.runnerEconomyFixGateAttributionSuspicious +
    metrics.runnerSearchRecoveryFixGateAttributionSuspicious +
    metrics.runnerMemoryFixGateAttributionSuspicious +
    metrics.runnerHandSizeFixGateAttributionSuspicious;
  metrics.runnerSetupAttributionBlocked =
    metrics.runnerEconomyFixGateAttributionBlocked +
    metrics.runnerSearchRecoveryFixGateAttributionBlocked +
    metrics.runnerMemoryFixGateAttributionBlocked +
    metrics.runnerHandSizeFixGateAttributionBlocked;
  metrics.runnerSetupAttributionUnclassified = Math.max(
    0,
    metrics.runnerSetupAttributionWindows -
      metrics.runnerSetupAttributionSuspicious -
      metrics.runnerSetupAttributionBlocked,
  );
  metrics.runnerSetupNormalizedWindows =
    metrics.runnerSearchRecoveryNormalizedWindows +
    metrics.runnerMemoryNormalizedWindows +
    metrics.runnerHandSizeNormalizedWindows;
  metrics.runnerSetupNormalizedSuspicious =
    metrics.runnerSearchRecoveryNormalizedSuspicious +
    metrics.runnerMemoryNormalizedSuspicious +
    metrics.runnerHandSizeNormalizedSuspicious;
  metrics.runnerSetupNormalizedBlocked =
    metrics.runnerSearchRecoveryNormalizedBlocked +
    metrics.runnerMemoryNormalizedBlocked +
    metrics.runnerHandSizeNormalizedBlocked;
  metrics.runnerSetupNormalizedMetricArtifact =
    metrics.runnerSearchRecoveryNormalizedMetricArtifact +
    metrics.runnerMemoryNormalizedMetricArtifact +
    metrics.runnerHandSizeNormalizedMetricArtifact;
  metrics.runnerSetupNormalizedUnclassified =
    metrics.runnerSearchRecoveryNormalizedUnclassified +
    metrics.runnerMemoryNormalizedUnclassified;
  metrics.runnerSetupNormalizedFixGateEligible =
    metrics.runnerSearchRecoveryNormalizedFixGateEligible +
    metrics.runnerMemoryNormalizedFixGateEligible +
    metrics.runnerHandSizeNormalizedSuspicious;
  const normalizedStrongest = [
    {
      key: "runnerSetupNormalizedRecommendedFixKindSearchRecovery" as const,
      value: metrics.runnerSearchRecoveryNormalizedSuspicious,
    },
    {
      key: "runnerSetupNormalizedRecommendedFixKindMemory" as const,
      value: metrics.runnerMemoryNormalizedSuspicious,
    },
    {
      key: "runnerSetupNormalizedRecommendedFixKindHandSize" as const,
      value: metrics.runnerHandSizeNormalizedSuspicious,
    },
  ].sort((left, right) => right.value - left.value);
  if (metrics.runnerSetupNormalizedSuspicious === 0)
    metrics.runnerSetupNormalizedRecommendedFixKindNone = 1;
  else if (normalizedStrongest[0]!.value === normalizedStrongest[1]!.value)
    metrics.runnerSetupNormalizedRecommendedFixKindMixedNeedsMoreDiagnosis = 1;
  else metrics[normalizedStrongest[0]!.key] = 1;
  const strongest = [
    {
      key: "runnerSetupRecommendedFixKindEconomyStarvedSkip" as const,
      value: metrics.runnerEconomyFixGateAttributionSuspicious,
    },
    {
      key: "runnerSetupRecommendedFixKindSearchRecovery" as const,
      value: metrics.runnerSearchRecoveryFixGateAttributionSuspicious,
    },
    {
      key: "runnerSetupRecommendedFixKindMemorySetup" as const,
      value: metrics.runnerMemoryFixGateAttributionSuspicious,
    },
    {
      key: "runnerSetupRecommendedFixKindHandSizeSetup" as const,
      value: metrics.runnerHandSizeFixGateAttributionSuspicious,
    },
  ].sort((left, right) => right.value - left.value);
  if (metrics.runnerSetupAttributionSuspicious === 0)
    metrics.runnerSetupRecommendedFixKindNone = 1;
  else if (strongest[0]!.value === strongest[1]!.value)
    metrics.runnerSetupRecommendedFixKindMixedNeedsMoreDiagnosis = 1;
  else metrics[strongest[0]!.key] = 1;
  return metrics;
}

function attributeRunnerSetupSupportWindows(
  metrics: Record<RunnerSetupAttributionMetricKey, number>,
  entry: AiSimulationActionSequenceEntry,
): void {
  if (entry.runnerMemoryBottleneckDecisionWindow === true) {
    metrics.runnerMemoryAttributionWindows += 1;
    metrics.runnerMemoryNormalizedWindows += 1;
    if ((entry.runnerLegalMemoryHardwareActions ?? 0) > 0)
      metrics.runnerMemoryAttributionLegalSupport += 1;
  }
  if (entry.runnerHandSizeBottleneckDecisionWindow === true) {
    metrics.runnerHandSizeAttributionWindows += 1;
    metrics.runnerHandSizeNormalizedWindows += 1;
    if ((entry.runnerLegalHandSizeActions ?? 0) > 0)
      metrics.runnerHandSizeAttributionLegalSupport += 1;
  }
  if (entry.runnerMemoryHardwareTaken === true)
    metrics.runnerMemoryAttributionSupportTaken += 1;
  if (entry.runnerMemoryHardwareTaken === true)
    metrics.runnerMemoryNormalizedTaken += 1;
  if (entry.runnerHandSizeSupportTaken === true)
    metrics.runnerHandSizeAttributionSupportTaken += 1;
  if (entry.runnerHandSizeSupportTaken === true)
    metrics.runnerHandSizeNormalizedTaken += 1;
  if (entry.runnerSearchTaken === true || entry.runnerRecoveryTaken === true) {
    metrics.runnerSearchRecoveryNormalizedWindows += 1;
    metrics.runnerSearchRecoveryNormalizedTaken += 1;
  }
}

function attributeStarvedEconomySkip(
  metrics: Record<RunnerSetupAttributionMetricKey, number>,
  sequence: AiSimulationActionSequenceEntry[],
  index: number,
  summary: AiSimulationSummary,
): void {
  const entry = sequence[index]!;
  metrics.runnerStarvedEconomySkipWindows += 1;
  metrics.runnerSetupAttributionByKindStarvedEconomy += 1;
  incrementChosenFamily(metrics, "runnerStarvedEconomySkip", entry);
  const next = nextEntriesForSide(sequence, index, "runner", 5);
  if (
    entry.runStartedAgainstKnownUnaffordablePath === true ||
    next.some((candidate) => candidate.runStartedAgainstKnownUnaffordablePath)
  )
    metrics.runnerStarvedEconomySkipThenUnaffordableRun += 1;
  if (
    entry.lowValueUnaffordableRun === true ||
    entry.runEndedAfterFirstIceDueToCredits === true ||
    next.some(
      (candidate) =>
        candidate.lowValueUnaffordableRun === true ||
        candidate.runEndedAfterFirstIceDueToCredits === true,
    )
  )
    metrics.runnerStarvedEconomySkipThenFailedRun += 1;
  if (!hasMeaningfulProgressWithin(sequence, index, 5, isMeaningfulBoardProgress))
    metrics.runnerStarvedEconomySkipThenNoProgress += 1;
  const economyNextDecision = next[0]?.runnerEconomyTaken === true;
  if (economyNextDecision)
    metrics.runnerStarvedEconomySkipThenEconomyNextDecision += 1;
  const reserveRecovered = next.some(
    (candidate) =>
      typeof candidate.runnerCreditsAfter === "number" &&
      typeof candidate.runnerReserveTarget === "number" &&
      candidate.runnerCreditsAfter >= candidate.runnerReserveTarget,
  );
  if (reserveRecovered)
    metrics.runnerStarvedEconomySkipThenReserveRecovered += 1;
  if (hasMeaningfulProgressWithin(sequence, index, 5, isMeaningfulBoardProgress))
    metrics.runnerStarvedEconomySkipThenProgress += 1;
  if (summary.winner === "action_limit_reached")
    metrics.runnerStarvedEconomySkipThenActionLimit += 1;

  const blocked =
    entry.runnerEconomySkippedForPressure === true ||
    entry.runnerEconomySkippedForRemoteContest === true ||
    entry.runnerEconomySkippedForInstallBreaker === true ||
    entry.runnerEconomySkippedForSetup === true ||
    entry.runnerEconomySkippedForTrash === true;
  if (entry.runnerEconomySkippedForPressure === true)
    metrics.runnerStarvedEconomySkipPlausiblePressure += 1;
  if (entry.runnerEconomySkippedForRemoteContest === true)
    metrics.runnerStarvedEconomySkipPlausibleRemoteContest += 1;
  if (
    entry.runnerEconomySkippedForInstallBreaker === true ||
    entry.runnerEconomySkippedForSetup === true
  )
    metrics.runnerStarvedEconomySkipPlausibleCriticalSetup += 1;
  if (entry.runnerEconomySkippedForTrash === true)
    metrics.runnerStarvedEconomySkipPlausibleTrash += 1;
  const suspiciousLowValue =
    entry.lowValueUnaffordableRun === true ||
    entry.runStartedAgainstKnownUnaffordablePath === true;
  if (suspiciousLowValue)
    metrics.runnerStarvedEconomySkipSuspiciousLowValueRun += 1;
  const suspiciousDraw =
    entry.runnerEconomySkippedForDraw === true &&
    !economyNextDecision &&
    !reserveRecovered;
  const suspiciousEndTurn =
    entry.runnerEconomySkippedForEndTurn === true &&
    !economyNextDecision &&
    !reserveRecovered;
  const suspiciousUnknown =
    entry.runnerEconomySkippedForUnknownHigherPriority === true &&
    !economyNextDecision &&
    !reserveRecovered;
  if (suspiciousDraw) metrics.runnerStarvedEconomySkipSuspiciousDraw += 1;
  if (suspiciousEndTurn) metrics.runnerStarvedEconomySkipSuspiciousEndTurn += 1;
  if (suspiciousUnknown) metrics.runnerStarvedEconomySkipSuspiciousUnknown += 1;
  const suspicious =
    suspiciousLowValue ||
    suspiciousDraw ||
    suspiciousEndTurn ||
    suspiciousUnknown ||
    (!blocked &&
      !hasMeaningfulProgressWithin(sequence, index, 5, isMeaningfulBoardProgress));
  metrics.runnerEconomyFixGateAttributionEligible += 1;
  if (blocked) metrics.runnerEconomyFixGateAttributionBlocked += 1;
  if (suspicious) metrics.runnerEconomyFixGateAttributionSuspicious += 1;
}

function attributeSearchRecoverySkip(
  metrics: Record<RunnerSetupAttributionMetricKey, number>,
  sequence: AiSimulationActionSequenceEntry[],
  index: number,
  summary: AiSimulationSummary,
): void {
  const entry = sequence[index]!;
  metrics.runnerSearchRecoveryFixGateWindows += 1;
  metrics.runnerSearchRecoveryAttributionWindows += 1;
  metrics.runnerSearchRecoveryAttributionSkipped += 1;
  metrics.runnerSetupAttributionByKindSearchRecovery += 1;
  if ((entry.runnerLegalSearchActions ?? 0) > 0) {
    metrics.runnerSearchRecoveryFixGateLegalSearch += 1;
    metrics.runnerSearchRecoveryAttributionLegalSearch += 1;
  }
  if ((entry.runnerLegalRecoveryActions ?? 0) > 0) {
    metrics.runnerSearchRecoveryFixGateLegalRecovery += 1;
    metrics.runnerSearchRecoveryAttributionLegalRecovery += 1;
  }
  if (entry.runnerSearchTaken === true)
    metrics.runnerSearchRecoveryAttributionSearchTaken += 1;
  if (entry.runnerRecoveryTaken === true)
    metrics.runnerSearchRecoveryAttributionRecoveryTaken += 1;
  incrementCoverageTypes(metrics, entry);
  incrementChosenFamily(metrics, "runnerSearchRecoverySkip", entry);
  const next = nextEntriesForSide(sequence, index, "runner", 5);
  const installFollowup = next.some(
    (candidate) => candidate.actionType === "install_card",
  );
  const coverageResolved = next.some(
    (candidate) => candidate.runnerCoverageImproved === true,
  );
  const knownUnaffordableRun = next.some(
    (candidate) => candidate.runStartedAgainstKnownUnaffordablePath === true,
  );
  const noProgress = !hasMeaningfulProgressWithin(
    sequence, index, 5, isMeaningfulBoardProgress
  );
  const actionLimit = summary.winner === "action_limit_reached" && noProgress;
  if (installFollowup) metrics.runnerSearchRecoverySkipThenInstallFollowup += 1;
  if (coverageResolved)
    metrics.runnerSearchRecoverySkipThenCoverageResolved += 1;
  if (!coverageResolved)
    metrics.runnerSearchRecoverySkipThenCoverageStillMissing += 1;
  if (knownUnaffordableRun)
    metrics.runnerSearchRecoverySkipThenKnownUnaffordableRun += 1;
  if (noProgress) metrics.runnerSearchRecoverySkipThenNoProgress += 1;
  if (actionLimit) metrics.runnerSearchRecoverySkipThenActionLimit += 1;
  if (!installFollowup)
    metrics.runnerSearchRecoveryWindowWithNoInstallFollowup += 1;

  const blocked =
    entry.runnerEconomyTaken === true ||
    entry.runnerPressureActionTaken === true ||
    entry.runnerRemoteRunAgainstAdvancedRemote === true ||
    entry.runnerCentralRunWhileRemoteScoreThreatVisible === true;
  if (entry.runnerEconomyTaken === true)
    metrics.runnerSearchRecoverySkipPlausibleEconomyReserve += 1;
  if (entry.runnerPressureActionTaken === true)
    metrics.runnerSearchRecoverySkipPlausiblePressure += 1;
  if (
    entry.runnerRemoteRunAgainstAdvancedRemote === true ||
    entry.runnerCentralRunWhileRemoteScoreThreatVisible === true
  )
    metrics.runnerSearchRecoverySkipPlausibleRemoteContest += 1;
  if (
    entry.runnerPressureReadyTrue === true &&
    entry.runnerPathBlockedByMissingCoverage !== true
  )
    metrics.runnerSearchRecoverySkipPlausibleCurrentRigEnough += 1;
  const suspiciousCoverage = !coverageResolved && !installFollowup;
  if (suspiciousCoverage)
    metrics.runnerSearchRecoverySkipSuspiciousCoverageStillMissing += 1;
  if (noProgress) metrics.runnerSearchRecoverySkipSuspiciousNoProgress += 1;
  if (knownUnaffordableRun)
    metrics.runnerSearchRecoverySkipSuspiciousKnownUnbreakableRun += 1;
  const suspicious = suspiciousCoverage || noProgress || knownUnaffordableRun;
  if (!blocked && !suspicious)
    metrics.runnerSearchRecoverySkipUnclassified += 1;
  metrics.runnerSearchRecoveryFixGateAttributionEligible += 1;
  if (blocked) metrics.runnerSearchRecoveryFixGateAttributionBlocked += 1;
  if (suspicious) metrics.runnerSearchRecoveryFixGateAttributionSuspicious += 1;
  attributeNormalizedSearchRecoverySkip(metrics, entry, {
    installFollowup,
    coverageResolved,
    knownUnaffordableRun,
    noProgress,
    actionLimit,
  });
}

function attributeNormalizedSearchRecoverySkip(
  metrics: Record<RunnerSetupAttributionMetricKey, number>,
  entry: AiSimulationActionSequenceEntry,
  followup: {
    installFollowup: boolean;
    coverageResolved: boolean;
    knownUnaffordableRun: boolean;
    noProgress: boolean;
    actionLimit: boolean;
  },
): void {
  metrics.runnerSearchRecoveryNormalizedWindows += 1;
  if (entry.runnerSearchTaken === true || entry.runnerRecoveryTaken === true)
    metrics.runnerSearchRecoveryNormalizedTaken += 1;
  else metrics.runnerSearchRecoveryNormalizedSkipped += 1;

  const blockedPressure =
    entry.runnerPressureActionTaken === true ||
    entry.runnerRemoteRunAgainstAdvancedRemote === true ||
    entry.runnerCentralRunWhileRemoteScoreThreatVisible === true ||
    entry.runnerRemoteTrashTaken === true;
  if (blockedPressure) {
    metrics.runnerSearchRecoveryNormalizedBlocked += 1;
    metrics.runnerSearchRecoveryNormalizedBlockedByPressureOrRemoteContest += 1;
    return;
  }

  if (
    entry.runnerEconomyTaken === true ||
    entry.runnerEconomyActionTaken === true
  ) {
    metrics.runnerSearchRecoveryNormalizedBlocked += 1;
    metrics.runnerSearchRecoveryNormalizedBlockedByEconomyOrReserve += 1;
    return;
  }

  if (
    entry.runnerPressureReadyTrue === true &&
    entry.runnerPathBlockedByMissingCoverage !== true
  ) {
    metrics.runnerSearchRecoveryNormalizedMetricArtifact += 1;
    metrics.runnerSearchRecoveryNormalizedBlockedByCurrentRigEnough += 1;
    return;
  }

  const missingCoverage =
    (entry.runnerSetupMissingCoverageTypes ?? []).length > 0;
  const legalSearchRecovery =
    (entry.runnerLegalSearchActions ?? 0) +
      (entry.runnerLegalRecoveryActions ?? 0) >
    0;
  if (!missingCoverage || !legalSearchRecovery) {
    metrics.runnerSearchRecoveryNormalizedMetricArtifact += 1;
    return;
  }

  const followupProblem =
    !followup.coverageResolved &&
    (followup.knownUnaffordableRun ||
      followup.noProgress ||
      followup.actionLimit);
  if (followupProblem) {
    metrics.runnerSearchRecoveryNormalizedSuspicious += 1;
    metrics.runnerSearchRecoveryNormalizedTrueMissedCoverage += 1;
    metrics.runnerSearchRecoveryNormalizedFixGateEligible += 1;
    return;
  }

  if (!followup.installFollowup && !followup.coverageResolved) {
    metrics.runnerSearchRecoveryNormalizedMetricArtifact += 1;
    metrics.runnerSearchRecoveryNormalizedBlockedByNoInstallFollowup += 1;
    return;
  }

  metrics.runnerSearchRecoveryNormalizedUnclassified += 1;
}

function attributeMemorySkip(
  metrics: Record<RunnerSetupAttributionMetricKey, number>,
  sequence: AiSimulationActionSequenceEntry[],
  index: number,
  summary: AiSimulationSummary,
): void {
  const entry = sequence[index]!;
  metrics.runnerMemoryFixGateWindows += 1;
  metrics.runnerSetupAttributionByKindMemory += 1;
  if ((entry.runnerLegalMemoryHardwareActions ?? 0) > 0)
    metrics.runnerMemoryFixGateLegalSupport += 1;
  metrics.runnerMemoryFixGateSkipped += 1;
  metrics.runnerMemoryAttributionSkipped += 1;
  incrementChosenFamily(metrics, "runnerMemorySkip", entry);
  const next = nextEntriesForSide(sequence, index, "runner", 5);
  const memoryInstalled = next.some(
    (candidate) => candidate.runnerMemoryHardwareTaken === true,
  );
  const programBlocked =
    entry.runnerMemorySupportSkippedWhileGripHasPrograms === true &&
    !memoryInstalled;
  const coverageStillMissing =
    !next.some((candidate) => candidate.runnerCoverageImproved === true) &&
    next.some(
      (candidate) =>
        candidate.runnerPathBlockedByMissingCoverage === true ||
        candidate.runnerSetupFixGateEligibleSearchRecoverySkip === true,
    );
  const noProgress = !hasMeaningfulProgressWithin(
    sequence, index, 5, isMeaningfulBoardProgress
  );
  const actionLimit = summary.winner === "action_limit_reached" && noProgress;
  if (memoryInstalled) metrics.runnerMemorySkipThenMemoryInstalled += 1;
  if (programBlocked) metrics.runnerMemorySkipThenProgramInstallBlocked += 1;
  if (coverageStillMissing)
    metrics.runnerMemorySkipThenCoverageStillMissing += 1;
  if (noProgress) metrics.runnerMemorySkipThenNoProgress += 1;
  if (actionLimit) metrics.runnerMemorySkipThenActionLimit += 1;

  const blocked =
    entry.runnerEconomyTaken === true ||
    entry.runnerPressureActionTaken === true ||
    entry.runnerRemoteRunAgainstAdvancedRemote === true ||
    entry.runnerCentralRunWhileRemoteScoreThreatVisible === true;
  if (entry.runnerEconomyTaken === true)
    metrics.runnerMemorySkipPlausibleEconomyReserve += 1;
  if (entry.runnerPressureActionTaken === true)
    metrics.runnerMemorySkipPlausiblePressure += 1;
  if (
    entry.runnerRemoteRunAgainstAdvancedRemote === true ||
    entry.runnerCentralRunWhileRemoteScoreThreatVisible === true
  )
    metrics.runnerMemorySkipPlausibleRemoteContest += 1;
  if (entry.runnerMemorySupportSkippedWhileGripHasPrograms !== true)
    metrics.runnerMemorySkipPlausibleNoProgramPressure += 1;
  const suspiciousRig = programBlocked || coverageStillMissing;
  if (suspiciousRig) metrics.runnerMemorySkipSuspiciousRigBlocked += 1;
  if (coverageStillMissing)
    metrics.runnerMemorySkipSuspiciousCoverageStillMissing += 1;
  if (noProgress) metrics.runnerMemorySkipSuspiciousNoProgress += 1;
  const suspicious = suspiciousRig || noProgress;
  if (!blocked && !suspicious) metrics.runnerMemorySkipUnclassified += 1;
  metrics.runnerMemoryFixGateAttributionEligible += 1;
  if (blocked) metrics.runnerMemoryFixGateAttributionBlocked += 1;
  if (suspicious) metrics.runnerMemoryFixGateAttributionSuspicious += 1;
  attributeNormalizedMemorySkip(metrics, entry, {
    memoryInstalled,
    programBlocked,
    coverageStillMissing,
    noProgress,
    actionLimit,
  });
}

function attributeNormalizedMemorySkip(
  metrics: Record<RunnerSetupAttributionMetricKey, number>,
  entry: AiSimulationActionSequenceEntry,
  followup: {
    memoryInstalled: boolean;
    programBlocked: boolean;
    coverageStillMissing: boolean;
    noProgress: boolean;
    actionLimit: boolean;
  },
): void {
  if (entry.runnerMemoryBottleneckDecisionWindow !== true)
    metrics.runnerMemoryNormalizedWindows += 1;
  if (entry.runnerMemoryHardwareTaken === true)
    metrics.runnerMemoryNormalizedTaken += 1;
  else metrics.runnerMemoryNormalizedSkipped += 1;

  const legalMemorySupport = (entry.runnerLegalMemoryHardwareActions ?? 0) > 0;
  if (!legalMemorySupport) {
    metrics.runnerMemoryNormalizedMetricArtifact += 1;
    return;
  }

  const blockedPressure =
    entry.runnerPressureActionTaken === true ||
    entry.runnerRemoteRunAgainstAdvancedRemote === true ||
    entry.runnerCentralRunWhileRemoteScoreThreatVisible === true ||
    entry.runnerRemoteTrashTaken === true;
  if (blockedPressure) {
    metrics.runnerMemoryNormalizedBlocked += 1;
    metrics.runnerMemoryNormalizedBlockedByPressureOrRemoteContest += 1;
    return;
  }

  if (
    entry.runnerEconomyTaken === true ||
    entry.runnerEconomyActionTaken === true
  ) {
    metrics.runnerMemoryNormalizedBlocked += 1;
    metrics.runnerMemoryNormalizedBlockedByEconomyOrReserve += 1;
    return;
  }

  if (entry.runnerMemorySupportSkippedWhileGripHasPrograms !== true) {
    metrics.runnerMemoryNormalizedBlocked += 1;
    metrics.runnerMemoryNormalizedBlockedByNoProgramPressure += 1;
    return;
  }

  const followupProblem =
    !followup.memoryInstalled &&
    (followup.programBlocked ||
      followup.coverageStillMissing ||
      followup.noProgress ||
      followup.actionLimit);
  if (followupProblem) {
    metrics.runnerMemoryNormalizedSuspicious += 1;
    metrics.runnerMemoryNormalizedTrueRigBottleneck += 1;
    metrics.runnerMemoryNormalizedFixGateEligible += 1;
    return;
  }

  metrics.runnerMemoryNormalizedUnclassified += 1;
}

function attributeHandSizeSkip(
  metrics: Record<RunnerSetupAttributionMetricKey, number>,
  sequence: AiSimulationActionSequenceEntry[],
  index: number,
): void {
  const entry = sequence[index]!;
  const next = nextEntriesForSide(sequence, index, "runner", 5);
  metrics.runnerHandSizeFixGateWindows += 1;
  metrics.runnerSetupAttributionByKindHandSize += 1;
  metrics.runnerHandSizeFixGateLegalSupport += 1;
  metrics.runnerHandSizeFixGateSkipped += 1;
  metrics.runnerHandSizeAttributionSkipped += 1;
  metrics.runnerHandSizeSkipThenDamageRiskWindow += 1;
  metrics.runnerHandSizeFixGateAttributionEligible += 1;
  const blocked =
    entry.runnerEconomyTaken === true ||
    entry.runnerPressureActionTaken === true ||
    entry.runnerRemoteRunAgainstAdvancedRemote === true ||
    entry.runnerCentralRunWhileRemoteScoreThreatVisible === true;
  if (blocked) metrics.runnerHandSizeFixGateAttributionBlocked += 1;
  const suspicious = next.some(
    (candidate) =>
      candidate.runnerDiscardChoice === true ||
      candidate.runnerHandSizeSupportSkippedWhileDamageRiskVisible === true,
  );
  if (suspicious) metrics.runnerHandSizeSkipThenDiscardOrDamagePressure += 1;
  if (suspicious) metrics.runnerHandSizeFixGateAttributionSuspicious += 1;
  attributeNormalizedHandSizeSkip(metrics, entry, { blocked, suspicious });
}

function attributeNormalizedHandSizeSkip(
  metrics: Record<RunnerSetupAttributionMetricKey, number>,
  entry: AiSimulationActionSequenceEntry,
  context: { blocked: boolean; suspicious: boolean },
): void {
  if (entry.runnerHandSizeBottleneckDecisionWindow !== true)
    metrics.runnerHandSizeNormalizedWindows += 1;
  if (entry.runnerHandSizeSupportTaken === true)
    metrics.runnerHandSizeNormalizedTaken += 1;
  else metrics.runnerHandSizeNormalizedSkipped += 1;

  const legalHandSizeSupport = (entry.runnerLegalHandSizeActions ?? 0) > 0;
  if (!legalHandSizeSupport) {
    metrics.runnerHandSizeNormalizedMetricArtifact += 1;
    return;
  }

  if (context.blocked) {
    metrics.runnerHandSizeNormalizedBlocked += 1;
    return;
  }

  if (context.suspicious) {
    metrics.runnerHandSizeNormalizedSuspicious += 1;
    return;
  }

  metrics.runnerHandSizeNormalizedMetricArtifact += 1;
}

function incrementChosenFamily(
  metrics: Record<RunnerSetupAttributionMetricKey, number>,
  prefix:
    | "runnerStarvedEconomySkip"
    | "runnerSearchRecoverySkip"
    | "runnerMemorySkip",
  entry: AiSimulationActionSequenceEntry,
): void {
  const family = runnerSetupChosenFamilyForEntry(entry);
  if (prefix === "runnerMemorySkip" && family === "install") {
    metrics.runnerMemorySkipChosenInstallNonMemory += 1;
    return;
  }
  const key = `${prefix}Chosen${capitalizeRunnerSetupFamily(family)}` as
    | RunnerSetupAttributionMetricKey
    | undefined;
  if (key && key in metrics) metrics[key] += 1;
}

function runnerSetupChosenFamilyForEntry(entry: {
  actionType: string;
  runnerEconomyTaken?: boolean;
  runnerDrawAction?: boolean;
  runnerRigInstallAction?: boolean;
  runnerSearchTaken?: boolean;
  runnerRecoveryTaken?: boolean;
  runnerRemoteTrashTaken?: boolean;
}):
  | "economy"
  | "run"
  | "draw"
  | "install"
  | "searchRecovery"
  | "trash"
  | "endTurn"
  | "unknown" {
  if (entry.runnerEconomyTaken === true) return "economy";
  if (entry.actionType === "start_run") return "run";
  if (entry.runnerDrawAction === true || entry.actionType === "draw_card")
    return "draw";
  if (entry.runnerSearchTaken === true || entry.runnerRecoveryTaken === true)
    return "searchRecovery";
  if (
    entry.runnerRemoteTrashTaken === true ||
    entry.actionType === "trash_accessed_card"
  )
    return "trash";
  if (
    entry.actionType === "install_card" ||
    entry.runnerRigInstallAction === true
  )
    return "install";
  if (entry.actionType === "end_turn") return "endTurn";
  return "unknown";
}

function capitalizeRunnerSetupFamily(
  family: ReturnType<typeof runnerSetupChosenFamilyForEntry>,
): string {
  if (family === "searchRecovery") return "SearchRecovery";
  if (family === "endTurn") return "EndTurn";
  return family.charAt(0).toUpperCase() + family.slice(1);
}

function incrementCoverageTypes(
  metrics: Record<RunnerSetupAttributionMetricKey, number>,
  entry: AiSimulationActionSequenceEntry,
): void {
  const types = entry.runnerSetupMissingCoverageTypes ?? [];
  if (types.includes("wall")) {
    metrics.runnerSearchRecoveryFixGateMissingWall += 1;
    metrics.runnerSearchRecoveryAttributionMissingWall += 1;
  }
  if (types.includes("code_gate")) {
    metrics.runnerSearchRecoveryFixGateMissingCodeGate += 1;
    metrics.runnerSearchRecoveryAttributionMissingCodeGate += 1;
  }
  if (types.includes("sentry")) {
    metrics.runnerSearchRecoveryFixGateMissingSentry += 1;
    metrics.runnerSearchRecoveryAttributionMissingSentry += 1;
  }
  if (types.includes("universal")) {
    metrics.runnerSearchRecoveryFixGateMissingUniversal += 1;
    metrics.runnerSearchRecoveryAttributionMissingUniversal += 1;
  }
  if (types.includes("special")) {
    metrics.runnerSearchRecoveryFixGateMissingSpecial += 1;
    metrics.runnerSearchRecoveryAttributionMissingSpecial += 1;
  }
}

const BREAKER_ONTOLOGY_COVERAGE_METRIC_KEYS: Record<
  string,
  BreakerOntologyCoverageMetricKey
> = {
  wall: "breakerOntologyCoverageWall",
  sentry: "breakerOntologyCoverageSentry",
  code_gate: "breakerOntologyCoverageCodeGate",
  ap: "breakerOntologyCoverageAp",
  trace: "breakerOntologyCoverageTrace",
  watchdog: "breakerOntologyCoverageWatchdog",
  black_ice: "breakerOntologyCoverageBlackIce",
  universal: "breakerOntologyCoverageUniversal",
  unknown_special: "breakerOntologyCoverageUnknownSpecial",
};

const REMOTE_ROLE_KIND_METRIC_KEYS: Record<string, RemoteRoleKindMetricKey> = {
  scoring_protection: "remoteRoleKindScoringProtection",
  agenda_steal_tax: "remoteRoleKindAgendaStealTax",
  run_tax: "remoteRoleKindRunTax",
  remote_capacity: "remoteRoleKindRemoteCapacity",
  asset_economy: "remoteRoleKindAssetEconomy",
  bait: "remoteRoleKindBait",
  ambush: "remoteRoleKindAmbush",
  ice_modifier: "remoteRoleKindIceModifier",
  tax_fort: "remoteRoleKindTaxFort",
};

const REMOTE_ROLE_SERVER_SCOPE_METRIC_KEYS: Record<
  string,
  RemoteRoleServerScopeMetricKey
> = {
  fort: "remoteRoleServerScopeFort",
  remote: "remoteRoleServerScopeRemote",
  central: "remoteRoleServerScopeCentral",
  server: "remoteRoleServerScopeServer",
};

function summarizeBreakerOntologyMetrics(
  summaries: AiSimulationSummary[],
): Pick<
  AiMatchProgressionMetrics,
  | "runnerBreakerOntologyProfilesSeen"
  | "runnerBreakerOntologyCoverageUsed"
  | "runnerBreakerOntologyFallbackUsed"
  | "runnerBreakerOntologyConflict"
  | "runnerInstallableBreakerRankedByOntology"
  | "runnerSearchTargetRankedByOntology"
  | "runnerMissingCoverageResolvedByOntology"
  | "runnerBreakerOntologySetupSuppressedBecausePressureReady"
  | "corpVisibleRunnerBreakerOntologyProfilesSeen"
  | "corpRemoteSafetyUsedRunnerBreakerOntology"
  | "corpCheapContestDetectedByBreakerOntology"
  | "corpRemoteSafetyOntologyConflictWithEffectiveQuote"
  | "corpAgendaInstallBlockedByOntologyCheapContest"
  | "corpAdvanceBlockedByOntologyCheapContest"
  | "breakerOntologyCoverageByType"
  | "breakerOntologyCoverageWall"
  | "breakerOntologyCoverageSentry"
  | "breakerOntologyCoverageCodeGate"
  | "breakerOntologyCoverageAp"
  | "breakerOntologyCoverageTrace"
  | "breakerOntologyCoverageWatchdog"
  | "breakerOntologyCoverageBlackIce"
  | "breakerOntologyCoverageUniversal"
  | "breakerOntologyCoverageUnknownSpecial"
  | "breakerOntologySideEffectsSeen"
  | "breakerOntologyCostProfileSeen"
  | "breakerOntologyFallbackEvidenceCount"
  | "breakerOntologyEffectiveQuoteOverrideCount"
> {
  const metrics = {
    runnerBreakerOntologyProfilesSeen: 0,
    runnerBreakerOntologyCoverageUsed: 0,
    runnerBreakerOntologyFallbackUsed: 0,
    runnerBreakerOntologyConflict: 0,
    runnerInstallableBreakerRankedByOntology: 0,
    runnerSearchTargetRankedByOntology: 0,
    runnerMissingCoverageResolvedByOntology: 0,
    runnerBreakerOntologySetupSuppressedBecausePressureReady: 0,
    corpVisibleRunnerBreakerOntologyProfilesSeen: 0,
    corpRemoteSafetyUsedRunnerBreakerOntology: 0,
    corpCheapContestDetectedByBreakerOntology: 0,
    corpRemoteSafetyOntologyConflictWithEffectiveQuote: 0,
    corpAgendaInstallBlockedByOntologyCheapContest: 0,
    corpAdvanceBlockedByOntologyCheapContest: 0,
    breakerOntologyCoverageByType: 0,
    breakerOntologyCoverageWall: 0,
    breakerOntologyCoverageSentry: 0,
    breakerOntologyCoverageCodeGate: 0,
    breakerOntologyCoverageAp: 0,
    breakerOntologyCoverageTrace: 0,
    breakerOntologyCoverageWatchdog: 0,
    breakerOntologyCoverageBlackIce: 0,
    breakerOntologyCoverageUniversal: 0,
    breakerOntologyCoverageUnknownSpecial: 0,
    breakerOntologySideEffectsSeen: 0,
    breakerOntologyCostProfileSeen: 0,
    breakerOntologyFallbackEvidenceCount: 0,
    breakerOntologyEffectiveQuoteOverrideCount: 0,
  };

  for (const summary of summaries) {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    for (const entry of sequence) {
      const structuredGripBreakers = evidenceNumber(
        entry,
        "structured_matching_grip_breakers:",
      );
      const structuredHeapBreakers = evidenceNumber(
        entry,
        "structured_heap_matching_breakers:",
      );
      const matchingGripBreakers = evidenceNumber(
        entry,
        "matching_grip_breakers:",
      );
      const coverageSearchActions = evidenceNumber(
        entry,
        "coverage_search_actions:",
      );
      const coverageRecoveryActions = evidenceNumber(
        entry,
        "coverage_recovery_actions:",
      );
      const visibleRunnerProfiles = evidenceNumber(
        entry,
        "visible_runner_breaker_ontology_profiles:",
      );
      const structuredContestFallback =
        hasEvidenceFlag(
          entry,
          "structured_breaker_profile_contest_fallback:true",
        ) || hasEvidenceFlag(entry, "structured_breaker_ice_cost:true");
      const effectiveQuoteOverride =
        hasEvidenceFlag(
          entry,
          "structured_breaker_effective_quote_override:true",
        ) ||
        hasEvidenceFlag(
          entry,
          "structured_breaker_ontology_effective_quote_override:true",
        );
      const ontologyConflict =
        hasEvidenceFlag(entry, "runner_breaker_ontology_conflict:true") ||
        hasEvidenceFlag(entry, "structured_breaker_coverage_conflict:true") ||
        hasEvidenceFlag(
          entry,
          "corp_remote_safety_ontology_conflict_with_effective_quote:true",
        );

      if (entry.side === "runner") {
        const runnerProfileSeen =
          structuredGripBreakers > 0 ||
          structuredHeapBreakers > 0 ||
          hasEvidenceFlag(entry, "structured_breaker_cost_profile:true") ||
          hasEvidencePrefix(entry, "structured_breaker_coverage:") ||
          hasEvidenceFlag(entry, "runner_breaker_ontology_profile_seen:true");
        if (runnerProfileSeen) metrics.runnerBreakerOntologyProfilesSeen += 1;
        if (
          structuredGripBreakers > 0 ||
          structuredHeapBreakers > 0 ||
          hasEvidencePrefix(entry, "structured_breaker_coverage:") ||
          hasEvidenceFlag(entry, "runner_breaker_ontology_coverage_used:true")
        )
          metrics.runnerBreakerOntologyCoverageUsed += 1;
        if (
          (structuredGripBreakers > 0 && matchingGripBreakers <= 0) ||
          hasEvidenceFlag(entry, "runner_breaker_ontology_fallback_used:true")
        )
          metrics.runnerBreakerOntologyFallbackUsed += 1;
        if (ontologyConflict) metrics.runnerBreakerOntologyConflict += 1;
        if (
          entry.actionType === "install_card" &&
          (hasEvidenceFlag(entry, "structured_breaker_cost_profile:true") ||
            structuredGripBreakers > 0 ||
            hasEvidenceFlag(
              entry,
              "runner_installable_breaker_ranked_by_ontology:true",
            ))
        )
          metrics.runnerInstallableBreakerRankedByOntology += 1;
        if (
          (coverageSearchActions > 0 || coverageRecoveryActions > 0) &&
          (structuredGripBreakers > 0 ||
            structuredHeapBreakers > 0 ||
            hasEvidenceFlag(
              entry,
              "runner_search_target_ranked_by_ontology:true",
            ))
        )
          metrics.runnerSearchTargetRankedByOntology += 1;
        if (
          hasEvidenceFlag(
            entry,
            "runner_missing_coverage_resolved_by_ontology:true",
          ) ||
          (entry.runnerPathBlockedByMissingCoverage === true &&
            (structuredGripBreakers > 0 || structuredHeapBreakers > 0))
        )
          metrics.runnerMissingCoverageResolvedByOntology += 1;
        if (
          hasEvidenceFlag(
            entry,
            "runner_breaker_ontology_setup_suppressed_pressure_ready:true",
          )
        )
          metrics.runnerBreakerOntologySetupSuppressedBecausePressureReady += 1;
      }

      if (entry.side === "corp") {
        if (visibleRunnerProfiles > 0 || structuredContestFallback)
          metrics.corpVisibleRunnerBreakerOntologyProfilesSeen += 1;
        if (structuredContestFallback)
          metrics.corpRemoteSafetyUsedRunnerBreakerOntology += 1;
        if (
          hasEvidenceFlag(
            entry,
            "corp_cheap_contest_detected_by_breaker_ontology:true",
          ) ||
          (structuredContestFallback &&
            evidenceValue(entry, "runner_contest_capacity:") === "high")
        )
          metrics.corpCheapContestDetectedByBreakerOntology += 1;
        if (
          effectiveQuoteOverride ||
          hasEvidenceFlag(
            entry,
            "corp_remote_safety_ontology_conflict_with_effective_quote:true",
          )
        )
          metrics.corpRemoteSafetyOntologyConflictWithEffectiveQuote += 1;
        if (
          hasEvidenceFlag(
            entry,
            "corp_agenda_install_blocked_by_ontology_cheap_contest:true",
          ) ||
          (structuredContestFallback &&
            hasEvidenceFlag(
              entry,
              "corp_agenda_install_deferred_due_to_cheap_contest:true",
            ))
        )
          metrics.corpAgendaInstallBlockedByOntologyCheapContest += 1;
        if (
          hasEvidenceFlag(
            entry,
            "corp_advance_blocked_by_ontology_cheap_contest:true",
          ) ||
          (structuredContestFallback &&
            hasEvidenceFlag(
              entry,
              "corp_advance_deferred_due_to_cheap_contest:true",
            ))
        )
          metrics.corpAdvanceBlockedByOntologyCheapContest += 1;
      }

      const coverageTypes = new Set<string>();
      for (const evidence of entry.evidence) {
        if (evidence.startsWith("structured_breaker_coverage:")) {
          coverageTypes.add(
            evidence.slice("structured_breaker_coverage:".length),
          );
        }
        if (evidence.startsWith("structured_breaker_visible_coverage:")) {
          coverageTypes.add(
            evidence.slice("structured_breaker_visible_coverage:".length),
          );
        }
      }
      for (const coverage of coverageTypes) {
        const metricKey = BREAKER_ONTOLOGY_COVERAGE_METRIC_KEYS[coverage];
        if (!metricKey) continue;
        metrics.breakerOntologyCoverageByType += 1;
        metrics[metricKey] += 1;
      }
      const sideEffectPenalty = evidenceNumber(
        entry,
        "structured_breaker_side_effect_penalty:",
      );
      if (sideEffectPenalty > 0) metrics.breakerOntologySideEffectsSeen += 1;
      if (
        hasEvidenceFlag(entry, "structured_breaker_cost_profile:true") ||
        hasEvidencePrefix(entry, "structured_breaker_install_credits:") ||
        hasEvidencePrefix(entry, "structured_breaker_memory:") ||
        hasEvidencePrefix(entry, "structured_breaker_cost:")
      )
        metrics.breakerOntologyCostProfileSeen += 1;
      if (structuredContestFallback)
        metrics.breakerOntologyFallbackEvidenceCount += 1;
      if (effectiveQuoteOverride)
        metrics.breakerOntologyEffectiveQuoteOverrideCount += 1;
    }
  }

  return metrics;
}

function summarizeRemoteRoleOntologyMetrics(
  summaries: AiSimulationSummary[],
): Pick<
  AiMatchProgressionMetrics,
  | "corpRemoteRoleProfilesSeen"
  | "corpRemoteRoleUsedForSafety"
  | "corpRemoteRoleUsedForScoringRemote"
  | "corpRemoteRoleUsedForPortfolio"
  | "corpRemoteRoleConflictWithLegacy"
  | "corpRemoteRoleConflictWithBoardState"
  | "corpScoringProtectionRemoteRoleSeen"
  | "corpAgendaStealTaxRemoteRoleSeen"
  | "corpRunTaxRemoteRoleSeen"
  | "corpRemoteCapacityRoleSeen"
  | "corpAssetEconomyRemoteRoleSeen"
  | "corpBaitRemoteRoleSeen"
  | "corpAmbushRemoteRoleSeen"
  | "corpIceModifierRemoteRoleSeen"
  | "corpRemoteRoleRaisedSafetyScore"
  | "corpRemoteRoleDidNotRaiseSafetyBecauseInactive"
  | "corpRemoteRoleDidNotRaiseSafetyBecauseCheapContest"
  | "corpRemoteRolePreventedBaitAsScoringProtection"
  | "corpRemoteRolePreventedAssetAsScoringProtection"
  | "corpRemoteRoleHelpedChooseExistingRemote"
  | "corpRemoteRoleHelpedAvoidNewEmptyRemote"
  | "runnerRemoteRoleProfilesSeen"
  | "runnerRemoteRoleUsedForTrashValue"
  | "runnerRemoteRoleUsedForContestValue"
  | "runnerRemoteRoleTrashBudgetPreserved"
  | "runnerRemoteRoleConflictWithHiddenStateGuard"
  | "runnerRunTaxRemoteRoleAccessed"
  | "runnerAgendaStealTaxRemoteRoleAccessed"
  | "runnerAssetEconomyRemoteRoleAccessed"
  | "remoteRoleByKind"
  | "remoteRoleKindScoringProtection"
  | "remoteRoleKindAgendaStealTax"
  | "remoteRoleKindRunTax"
  | "remoteRoleKindRemoteCapacity"
  | "remoteRoleKindAssetEconomy"
  | "remoteRoleKindBait"
  | "remoteRoleKindAmbush"
  | "remoteRoleKindIceModifier"
  | "remoteRoleKindTaxFort"
  | "remoteRoleByServerScope"
  | "remoteRoleServerScopeFort"
  | "remoteRoleServerScopeRemote"
  | "remoteRoleServerScopeCentral"
  | "remoteRoleServerScopeServer"
  | "remoteRoleSafetyDedupeCount"
> {
  const metrics = {
    corpRemoteRoleProfilesSeen: 0,
    corpRemoteRoleUsedForSafety: 0,
    corpRemoteRoleUsedForScoringRemote: 0,
    corpRemoteRoleUsedForPortfolio: 0,
    corpRemoteRoleConflictWithLegacy: 0,
    corpRemoteRoleConflictWithBoardState: 0,
    corpScoringProtectionRemoteRoleSeen: 0,
    corpAgendaStealTaxRemoteRoleSeen: 0,
    corpRunTaxRemoteRoleSeen: 0,
    corpRemoteCapacityRoleSeen: 0,
    corpAssetEconomyRemoteRoleSeen: 0,
    corpBaitRemoteRoleSeen: 0,
    corpAmbushRemoteRoleSeen: 0,
    corpIceModifierRemoteRoleSeen: 0,
    corpRemoteRoleRaisedSafetyScore: 0,
    corpRemoteRoleDidNotRaiseSafetyBecauseInactive: 0,
    corpRemoteRoleDidNotRaiseSafetyBecauseCheapContest: 0,
    corpRemoteRolePreventedBaitAsScoringProtection: 0,
    corpRemoteRolePreventedAssetAsScoringProtection: 0,
    corpRemoteRoleHelpedChooseExistingRemote: 0,
    corpRemoteRoleHelpedAvoidNewEmptyRemote: 0,
    runnerRemoteRoleProfilesSeen: 0,
    runnerRemoteRoleUsedForTrashValue: 0,
    runnerRemoteRoleUsedForContestValue: 0,
    runnerRemoteRoleTrashBudgetPreserved: 0,
    runnerRemoteRoleConflictWithHiddenStateGuard: 0,
    runnerRunTaxRemoteRoleAccessed: 0,
    runnerAgendaStealTaxRemoteRoleAccessed: 0,
    runnerAssetEconomyRemoteRoleAccessed: 0,
    remoteRoleByKind: 0,
    remoteRoleKindScoringProtection: 0,
    remoteRoleKindAgendaStealTax: 0,
    remoteRoleKindRunTax: 0,
    remoteRoleKindRemoteCapacity: 0,
    remoteRoleKindAssetEconomy: 0,
    remoteRoleKindBait: 0,
    remoteRoleKindAmbush: 0,
    remoteRoleKindIceModifier: 0,
    remoteRoleKindTaxFort: 0,
    remoteRoleByServerScope: 0,
    remoteRoleServerScopeFort: 0,
    remoteRoleServerScopeRemote: 0,
    remoteRoleServerScopeCentral: 0,
    remoteRoleServerScopeServer: 0,
    remoteRoleSafetyDedupeCount: 0,
  };

  for (const summary of summaries) {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    for (const entry of sequence) {
      const roleKinds = new Set<string>();
      const serverScopes = new Set<string>();
      for (const evidence of entry.evidence) {
        if (evidence.startsWith("corp_remote_role_kind:"))
          roleKinds.add(evidence.slice("corp_remote_role_kind:".length));
        if (evidence.startsWith("runner_remote_role_kind:"))
          roleKinds.add(evidence.slice("runner_remote_role_kind:".length));
        if (evidence.startsWith("corp_remote_role_server_scope:"))
          serverScopes.add(
            evidence.slice("corp_remote_role_server_scope:".length),
          );
        if (evidence.startsWith("runner_remote_role_server_scope:"))
          serverScopes.add(
            evidence.slice("runner_remote_role_server_scope:".length),
          );
      }

      for (const roleKind of roleKinds) {
        const key = REMOTE_ROLE_KIND_METRIC_KEYS[roleKind];
        if (!key) continue;
        metrics.remoteRoleByKind += 1;
        metrics[key] += 1;
      }
      for (const serverScope of serverScopes) {
        const key = REMOTE_ROLE_SERVER_SCOPE_METRIC_KEYS[serverScope];
        if (!key) continue;
        metrics.remoteRoleByServerScope += 1;
        metrics[key] += 1;
      }

      if (entry.side === "corp") {
        if (hasEvidenceFlag(entry, "corp_remote_role_profile_seen:true"))
          metrics.corpRemoteRoleProfilesSeen += 1;
        if (hasEvidenceFlag(entry, "corp_remote_role_used_for_safety:true")) {
          metrics.corpRemoteRoleUsedForSafety += 1;
          metrics.remoteRoleSafetyDedupeCount += 1;
        }
        if (
          hasEvidenceFlag(
            entry,
            "corp_remote_role_used_for_scoring_remote:true",
          )
        )
          metrics.corpRemoteRoleUsedForScoringRemote += 1;
        if (hasEvidenceFlag(entry, "corp_remote_role_used_for_portfolio:true"))
          metrics.corpRemoteRoleUsedForPortfolio += 1;
        if (
          hasEvidenceFlag(entry, "corp_remote_role_conflict_with_legacy:true")
        )
          metrics.corpRemoteRoleConflictWithLegacy += 1;
        if (
          hasEvidenceFlag(
            entry,
            "corp_remote_role_conflict_with_board_state:true",
          )
        )
          metrics.corpRemoteRoleConflictWithBoardState += 1;
        if (roleKinds.has("scoring_protection"))
          metrics.corpScoringProtectionRemoteRoleSeen += 1;
        if (roleKinds.has("agenda_steal_tax"))
          metrics.corpAgendaStealTaxRemoteRoleSeen += 1;
        if (roleKinds.has("run_tax")) metrics.corpRunTaxRemoteRoleSeen += 1;
        if (roleKinds.has("remote_capacity"))
          metrics.corpRemoteCapacityRoleSeen += 1;
        if (roleKinds.has("asset_economy"))
          metrics.corpAssetEconomyRemoteRoleSeen += 1;
        if (roleKinds.has("bait")) metrics.corpBaitRemoteRoleSeen += 1;
        if (roleKinds.has("ambush")) metrics.corpAmbushRemoteRoleSeen += 1;
        if (roleKinds.has("ice_modifier"))
          metrics.corpIceModifierRemoteRoleSeen += 1;
        if (hasEvidenceFlag(entry, "corp_remote_role_raised_safety_score:true"))
          metrics.corpRemoteRoleRaisedSafetyScore += 1;
        if (
          hasEvidenceFlag(
            entry,
            "corp_remote_role_did_not_raise_safety_because_inactive:true",
          )
        )
          metrics.corpRemoteRoleDidNotRaiseSafetyBecauseInactive += 1;
        if (
          hasEvidenceFlag(
            entry,
            "corp_remote_role_did_not_raise_safety_because_cheap_contest:true",
          )
        )
          metrics.corpRemoteRoleDidNotRaiseSafetyBecauseCheapContest += 1;
        if (
          hasEvidenceFlag(
            entry,
            "corp_remote_role_prevented_bait_as_scoring_protection:true",
          )
        )
          metrics.corpRemoteRolePreventedBaitAsScoringProtection += 1;
        if (
          hasEvidenceFlag(
            entry,
            "corp_remote_role_prevented_asset_as_scoring_protection:true",
          )
        )
          metrics.corpRemoteRolePreventedAssetAsScoringProtection += 1;
        if (
          hasEvidenceFlag(
            entry,
            "corp_remote_role_helped_choose_existing_remote:true",
          )
        )
          metrics.corpRemoteRoleHelpedChooseExistingRemote += 1;
        if (
          hasEvidenceFlag(
            entry,
            "corp_remote_role_helped_avoid_new_empty_remote:true",
          )
        )
          metrics.corpRemoteRoleHelpedAvoidNewEmptyRemote += 1;
      }

      if (entry.side === "runner") {
        if (hasEvidenceFlag(entry, "runner_remote_role_profile_seen:true"))
          metrics.runnerRemoteRoleProfilesSeen += 1;
        if (
          hasEvidenceFlag(entry, "runner_remote_role_used_for_trash_value:true")
        )
          metrics.runnerRemoteRoleUsedForTrashValue += 1;
        if (
          hasEvidenceFlag(
            entry,
            "runner_remote_role_used_for_contest_value:true",
          )
        )
          metrics.runnerRemoteRoleUsedForContestValue += 1;
        if (
          hasEvidenceFlag(
            entry,
            "runner_remote_role_trash_budget_preserved:true",
          )
        )
          metrics.runnerRemoteRoleTrashBudgetPreserved += 1;
        if (
          hasEvidenceFlag(
            entry,
            "runner_remote_role_conflict_with_hidden_state_guard:true",
          )
        )
          metrics.runnerRemoteRoleConflictWithHiddenStateGuard += 1;
        if (roleKinds.has("run_tax"))
          metrics.runnerRunTaxRemoteRoleAccessed += 1;
        if (roleKinds.has("agenda_steal_tax"))
          metrics.runnerAgendaStealTaxRemoteRoleAccessed += 1;
        if (roleKinds.has("asset_economy"))
          metrics.runnerAssetEconomyRemoteRoleAccessed += 1;
      }
    }
  }

  return metrics;
}

function summarizeStrategicLineMetrics(
  summaries: AiSimulationSummary[],
): Pick<
  AiMatchProgressionMetrics,
  | "strategicLineSelected"
  | "strategicLineSelectedBySideRunner"
  | "strategicLineSelectedBySideCorp"
  | "strategicLineSelectedBySeed"
  | "strategicLineCommitmentTurns"
  | "strategicLineContinuationTaken"
  | "strategicLineAborted"
  | "strategicLineOverriddenByTacticalUrgency"
  | "strategicLineConvertedToProgress"
  | "strategicLineRepeatedWithoutProgress"
  | "strategicLineVarianceAcrossSeeds"
  | "runnerStrategicLineEarlyHqPressure"
  | "runnerStrategicLineEarlyRndPressure"
  | "runnerStrategicLineRemoteContest"
  | "runnerStrategicLineEconomyFirst"
  | "runnerStrategicLineRigFirst"
  | "runnerStrategicLineBreakerSearchFirst"
  | "runnerStrategicLineInterfacePressure"
  | "runnerStrategicLineCloseoutPressure"
  | "corpStrategicLineCentralStabilize"
  | "corpStrategicLineRemoteScoringBuild"
  | "corpStrategicLineIceTaxGlacier"
  | "corpStrategicLineEconomyRezReserve"
  | "corpStrategicLineFastAdvanceOrCounterOps"
  | "corpStrategicLineTagTracePunish"
  | "corpStrategicLineBaitAndPunish"
  | "corpStrategicLineScoreCloseout"
  | "lineCommitmentLedToScore"
  | "lineCommitmentLedToSteal"
  | "lineCommitmentLedToRemoteTrash"
  | "lineCommitmentLedToRigProgress"
  | "lineCommitmentLedToScoreWindow"
  | "lineCommitmentLedToNoProgressChain"
> {
  let strategicLineSelected = 0;
  let strategicLineSelectedBySideRunner = 0;
  let strategicLineSelectedBySideCorp = 0;
  let strategicLineSelectedBySeed = 0;
  let strategicLineContinuationTaken = 0;
  let strategicLineAborted = 0;
  let strategicLineOverriddenByTacticalUrgency = 0;
  let strategicLineConvertedToProgress = 0;
  let strategicLineRepeatedWithoutProgress = 0;
  let runnerStrategicLineEarlyHqPressure = 0;
  let runnerStrategicLineEarlyRndPressure = 0;
  let runnerStrategicLineRemoteContest = 0;
  let runnerStrategicLineEconomyFirst = 0;
  let runnerStrategicLineRigFirst = 0;
  let runnerStrategicLineBreakerSearchFirst = 0;
  let runnerStrategicLineInterfacePressure = 0;
  let runnerStrategicLineCloseoutPressure = 0;
  let corpStrategicLineCentralStabilize = 0;
  let corpStrategicLineRemoteScoringBuild = 0;
  let corpStrategicLineIceTaxGlacier = 0;
  let corpStrategicLineEconomyRezReserve = 0;
  let corpStrategicLineFastAdvanceOrCounterOps = 0;
  let corpStrategicLineTagTracePunish = 0;
  let corpStrategicLineBaitAndPunish = 0;
  let corpStrategicLineScoreCloseout = 0;
  let lineCommitmentLedToScore = 0;
  let lineCommitmentLedToSteal = 0;
  let lineCommitmentLedToRemoteTrash = 0;
  let lineCommitmentLedToRigProgress = 0;
  let lineCommitmentLedToScoreWindow = 0;
  let lineCommitmentLedToNoProgressChain = 0;
  const ttlValues: number[] = [];
  const lineKindsBySide = new Map<string, Set<string>>();

  for (const summary of summaries) {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    const strategicEntries = sequence.filter(isStrategicPlanDecision);
    strategicEntries.forEach((entry, index) => {
      if (!hasEvidenceFlag(entry, "strategic_line_selected:true")) return;
      const kind = evidenceValue(entry, "strategic_line_kind:") ?? "unknown";
      strategicLineSelected += 1;
      if (entry.side === "runner") strategicLineSelectedBySideRunner += 1;
      if (entry.side === "corp") strategicLineSelectedBySideCorp += 1;
      if (hasEvidenceFlag(entry, "strategic_line_selected_by_seed:true"))
        strategicLineSelectedBySeed += 1;
      if (hasEvidenceFlag(entry, "strategic_line_continuation_taken:true"))
        strategicLineContinuationTaken += 1;
      if (hasEvidenceFlag(entry, "strategic_line_aborted:true"))
        strategicLineAborted += 1;
      if (
        hasEvidenceFlag(
          entry,
          "strategic_line_overridden_by_tactical_urgency:true",
        )
      )
        strategicLineOverriddenByTacticalUrgency += 1;
      const ttl = Number(
        evidenceValue(entry, "strategic_line_commitment_ttl:"),
      );
      if (Number.isFinite(ttl)) ttlValues.push(ttl);
      const lineSetKey = `${entry.side}`;
      if (!lineKindsBySide.has(lineSetKey))
        lineKindsBySide.set(lineSetKey, new Set());
      lineKindsBySide.get(lineSetKey)!.add(kind);

      if (entry.side === "runner") {
        if (kind === "early_hq_pressure")
          runnerStrategicLineEarlyHqPressure += 1;
        if (kind === "early_rnd_pressure")
          runnerStrategicLineEarlyRndPressure += 1;
        if (kind === "remote_contest") runnerStrategicLineRemoteContest += 1;
        if (kind === "economy_first") runnerStrategicLineEconomyFirst += 1;
        if (kind === "rig_first") runnerStrategicLineRigFirst += 1;
        if (kind === "breaker_search_first")
          runnerStrategicLineBreakerSearchFirst += 1;
        if (kind === "interface_pressure")
          runnerStrategicLineInterfacePressure += 1;
        if (kind === "closeout_pressure")
          runnerStrategicLineCloseoutPressure += 1;
      } else {
        if (kind === "central_stabilize")
          corpStrategicLineCentralStabilize += 1;
        if (kind === "remote_scoring_build")
          corpStrategicLineRemoteScoringBuild += 1;
        if (kind === "ice_tax_glacier") corpStrategicLineIceTaxGlacier += 1;
        if (kind === "economy_rez_reserve")
          corpStrategicLineEconomyRezReserve += 1;
        if (kind === "fast_advance_or_counter_ops")
          corpStrategicLineFastAdvanceOrCounterOps += 1;
        if (kind === "tag_trace_punish") corpStrategicLineTagTracePunish += 1;
        if (kind === "bait_and_punish") corpStrategicLineBaitAndPunish += 1;
        if (kind === "score_closeout") corpStrategicLineScoreCloseout += 1;
      }

      const nextOwn = ownStrategicWindow(strategicEntries, index, 3);
      const fullIndex = sequence.indexOf(entry);
      const nextAll =
        fullIndex >= 0 ? nextEntries(sequence, fullIndex, 6) : nextOwn;
      if (
        nextOwn.some(isMeaningfulBoardProgress) ||
        nextAll.some(isMeaningfulBoardProgress)
      )
        strategicLineConvertedToProgress += 1;
      if (nextAll.some((candidate) => candidate.actionType === "score_agenda"))
        lineCommitmentLedToScore += 1;
      if (nextAll.some((candidate) => candidate.actionType === "steal_agenda"))
        lineCommitmentLedToSteal += 1;
      if (
        nextAll.some(
          (candidate) =>
            candidate.side === "runner" &&
            candidate.actionType === "trash_accessed_card" &&
            isRemoteServerTarget(candidate.targetServerId),
        )
      )
        lineCommitmentLedToRemoteTrash += 1;
      if (nextOwn.some(isRunnerRigProgressAction))
        lineCommitmentLedToRigProgress += 1;
      if (
        nextOwn.some(
          (candidate) =>
            candidate.side === "corp" &&
            (candidate.actionType === "advance_card" ||
              candidate.actionType === "score_agenda" ||
              candidate.finalAdvance === true),
        )
      )
        lineCommitmentLedToScoreWindow += 1;
      if (
        nextOwn.length >= 3 &&
        !nextOwn.some(isMeaningfulBoardProgress) &&
        nextOwn.every(
          (candidate) =>
            evidenceValue(candidate, "strategic_line_kind:") === kind ||
            !hasEvidenceFlag(candidate, "strategic_line_selected:true"),
        )
      ) {
        strategicLineRepeatedWithoutProgress += 1;
        lineCommitmentLedToNoProgressChain += 1;
      }
    });
  }
  const strategicLineVarianceAcrossSeeds = [...lineKindsBySide.values()].reduce(
    (sum, set) => sum + Math.max(0, set.size - 1),
    0,
  );
  return {
    strategicLineSelected,
    strategicLineSelectedBySideRunner,
    strategicLineSelectedBySideCorp,
    strategicLineSelectedBySeed,
    strategicLineCommitmentTurns: averageNumber(ttlValues),
    strategicLineContinuationTaken,
    strategicLineAborted,
    strategicLineOverriddenByTacticalUrgency,
    strategicLineConvertedToProgress,
    strategicLineRepeatedWithoutProgress,
    strategicLineVarianceAcrossSeeds,
    runnerStrategicLineEarlyHqPressure,
    runnerStrategicLineEarlyRndPressure,
    runnerStrategicLineRemoteContest,
    runnerStrategicLineEconomyFirst,
    runnerStrategicLineRigFirst,
    runnerStrategicLineBreakerSearchFirst,
    runnerStrategicLineInterfacePressure,
    runnerStrategicLineCloseoutPressure,
    corpStrategicLineCentralStabilize,
    corpStrategicLineRemoteScoringBuild,
    corpStrategicLineIceTaxGlacier,
    corpStrategicLineEconomyRezReserve,
    corpStrategicLineFastAdvanceOrCounterOps,
    corpStrategicLineTagTracePunish,
    corpStrategicLineBaitAndPunish,
    corpStrategicLineScoreCloseout,
    lineCommitmentLedToScore,
    lineCommitmentLedToSteal,
    lineCommitmentLedToRemoteTrash,
    lineCommitmentLedToRigProgress,
    lineCommitmentLedToScoreWindow,
    lineCommitmentLedToNoProgressChain,
  };
}

function summarizeCorpEconomyBeforeScoreMetrics(
  summaries: AiSimulationSummary[],
): Pick<
  AiMatchProgressionMetrics,
  | "corpEconomyBeforeScoreWindow"
  | "corpEconomyBeforeScoreWindowNecessary"
  | "corpEconomyBeforeScoreWindowWithInstalledAgenda"
  | "corpEconomyBeforeScoreWindowWithAdvancedAgenda"
  | "corpEconomyBeforeScoreWindowWithScoreLegalNext"
  | "corpEconomyBeforeScoreWindowWithAdvanceToScoreLegalNext"
  | "corpEconomyBeforeScoreWindowWithReadyRemote"
  | "corpEconomyBeforeScoreWindowWithAgendaInHqAndReadyRemote"
  | "corpEconomyBeforeScoreWindowCreditsShort"
  | "corpEconomyBeforeScoreWindowCreditsAlreadyEnough"
  | "corpEconomyBeforeScoreWindowRemoteSafe"
  | "corpEconomyBeforeScoreWindowRemoteContestHigh"
  | "corpEconomyBeforeScoreTaken"
  | "corpEconomyBeforeScoreTakenAsNecessaryCredits"
  | "corpEconomyBeforeScoreTakenDespiteCreditsEnough"
  | "corpEconomyBeforeScoreTakenOverScoreLegal"
  | "corpEconomyBeforeScoreTakenOverAdvanceToScoreLegal"
  | "corpEconomyBeforeScoreTakenOverAgendaInstallReadyRemote"
  | "corpEconomyBeforeScoreTakenOverHqAgendaExit"
  | "corpEconomyBeforeScoreTakenOverScoreAreaAbility"
  | "corpEconomyBeforeScoreConvertedToScoreNextDecision"
  | "corpEconomyBeforeScoreConvertedToAdvanceNextDecision"
  | "corpEconomyBeforeScoreConvertedToAgendaInstallNextDecision"
  | "corpEconomyBeforeScoreConvertedWithin2CorpActions"
  | "corpEconomyBeforeScoreConvertedWithin3CorpActions"
  | "corpEconomyBeforeScoreNotConvertedWithin3CorpActions"
  | "corpEconomyBeforeScoreRepeatedEconomyNextDecision"
  | "corpEconomyBeforeScoreRepeatedEconomyWithin3"
  | "corpEconomyBeforeScoreThenDraw"
  | "corpEconomyBeforeScoreThenProtect"
  | "corpEconomyBeforeScoreThenNewRemote"
  | "corpEconomyBeforeScoreThenRunnerSteal"
  | "corpEconomyBeforeScoreThenActionLimit"
  | "corpEconomyBeforeScorePlausibleCreditsNeeded"
  | "corpEconomyBeforeScorePlausibleRezOrAdvanceReserve"
  | "corpEconomyBeforeScorePlausibleHqOrRndSafety"
  | "corpEconomyBeforeScorePlausibleRunnerContestTooHigh"
  | "corpEconomyBeforeScorePlausibleNoAgendaExit"
  | "corpEconomyBeforeScoreSuspiciousCreditsAlreadyEnough"
  | "corpEconomyBeforeScoreSuspiciousRepeatedEconomy"
  | "corpEconomyBeforeScoreSuspiciousDelayedTerminalAction"
  | "corpEconomyBeforeScoreSuspiciousRemoteStillSafe"
  | "corpEconomyBeforeScoreSuspiciousRunnerStealFollowup"
  | "corpEconomyBeforeScoreUnclassified"
  | "corpEconomyBeforeScoreFixGateEligible"
  | "corpEconomyBeforeScoreFixGateBlockedByCredits"
  | "corpEconomyBeforeScoreFixGateBlockedByCheapContest"
  | "corpEconomyBeforeScoreFixGateBlockedByRunnerContest"
  | "corpEconomyBeforeScoreFixGateBlockedBySafety"
  | "corpEconomyBeforeScoreFixGateSuspicious"
  | "corpEconomyBeforeScoreFixGateSuspiciousRepeatedEconomy"
  | "corpEconomyBeforeScoreFixGateSuspiciousNoConversion"
  | "corpEconomyBeforeScoreFixGateSuspiciousStealFollowup"
  | "corpRepeatedEconomyBeforeScoreWindows"
  | "corpRepeatedEconomyBeforeScoreCreditsStillShort"
  | "corpRepeatedEconomyBeforeScoreCreditsAlreadyEnough"
  | "corpRepeatedEconomyBeforeScoreScoreLegal"
  | "corpRepeatedEconomyBeforeScoreAdvanceLegal"
  | "corpRepeatedEconomyBeforeScoreAgendaInstallReadyRemoteLegal"
  | "corpRepeatedEconomyBeforeScoreRemoteSafe"
  | "corpRepeatedEconomyBeforeScoreRunnerContestHigh"
  | "corpRepeatedEconomyBeforeScoreThenScore"
  | "corpRepeatedEconomyBeforeScoreThenRunnerSteal"
  | "corpRepeatedEconomyBeforeScoreThenActionLimit"
  | "corpRepeatedEconomyBeforeScoreSuspicious"
  | "corpRepeatedEconomyBeforeScorePlausible"
  | "corpEconomyBeforeScoreNoConversionCreditsStillShort"
  | "corpEconomyBeforeScoreNoConversionNoAgendaExit"
  | "corpEconomyBeforeScoreNoConversionRemoteUnsafe"
  | "corpEconomyBeforeScoreNoConversionRunnerContestHigh"
  | "corpEconomyBeforeScoreNoConversionSafetyBlocked"
  | "corpEconomyBeforeScoreNoConversionPlanDrift"
  | "corpEconomyBeforeScoreNoConversionRepeatedEconomy"
  | "corpEconomyBeforeScoreNoConversionDrawLoop"
  | "corpEconomyBeforeScoreNoConversionProtectionLoop"
  | "corpEconomyBeforeScoreNoConversionRemotePortfolioLoop"
  | "corpEconomyBeforeScoreNoConversionRunnerSteal"
  | "corpEconomyBeforeScoreNoConversionActionLimit"
  | "corpEconomyBeforeScoreNoConversionSuspicious"
  | "corpEconomyBeforeScoreNoConversionPlausible"
  | "corpEconomyBeforeScoreCreditsEnoughWindows"
  | "corpEconomyBeforeScoreCreditsEnoughTaken"
  | "corpEconomyBeforeScoreCreditsEnoughScoreLegal"
  | "corpEconomyBeforeScoreCreditsEnoughAdvanceLegal"
  | "corpEconomyBeforeScoreCreditsEnoughAgendaInstallReadyRemoteLegal"
  | "corpEconomyBeforeScoreCreditsEnoughSafetyBlocked"
  | "corpEconomyBeforeScoreCreditsEnoughSuspicious"
  | "corpEconomyBeforeScoreCreditsEnoughPlausible"
> {
  const actionSequence = summaries.flatMap((summary) => summary.actionSequence);
  const entries = actionSequence.filter(
    (entry) =>
      entry.corpEconomyBeforeScoreDiagnosticWindow === true ||
      hasEvidenceFlag(entry, "corp_economy_before_score_window:true"),
  );
  const takenEntries = summaries.flatMap((summary) =>
    summary.actionSequence
      .map((entry, index) => ({
        entry,
        index,
        sequence: summary.actionSequence,
      }))
      .filter(({ entry }) => entry.corpEconomyBeforeScoreTaken === true),
  );
  let convertedToScoreNext = 0;
  let convertedToAdvanceNext = 0;
  let convertedToAgendaInstallNext = 0;
  let convertedWithin2 = 0;
  let convertedWithin3 = 0;
  let notConvertedWithin3 = 0;
  let repeatedEconomyNext = 0;
  let repeatedEconomyWithin3 = 0;
  let thenDraw = 0;
  let thenProtect = 0;
  let thenNewRemote = 0;
  let thenRunnerSteal = 0;
  let thenActionLimit = 0;
  let suspiciousRepeated = 0;
  let suspiciousNoConversion = 0;
  let suspiciousStealFollowup = 0;
  let repeatedCreditsStillShort = 0;
  let repeatedCreditsAlreadyEnough = 0;
  let repeatedScoreLegal = 0;
  let repeatedAdvanceLegal = 0;
  let repeatedAgendaInstallReadyRemoteLegal = 0;
  let repeatedRemoteSafe = 0;
  let repeatedRunnerContestHigh = 0;
  let repeatedThenScore = 0;
  let repeatedThenRunnerSteal = 0;
  let repeatedThenActionLimit = 0;
  let repeatedSuspicious = 0;
  let repeatedPlausible = 0;
  let noConversionCreditsStillShort = 0;
  let noConversionNoAgendaExit = 0;
  let noConversionRemoteUnsafe = 0;
  let noConversionRunnerContestHigh = 0;
  let noConversionSafetyBlocked = 0;
  let noConversionPlanDrift = 0;
  let noConversionRepeatedEconomy = 0;
  let noConversionDrawLoop = 0;
  let noConversionProtectionLoop = 0;
  let noConversionRemotePortfolioLoop = 0;
  let noConversionRunnerSteal = 0;
  let noConversionActionLimit = 0;
  let noConversionSuspicious = 0;
  let noConversionPlausible = 0;

  const converted = (entry: AiSimulationActionSequenceEntry) =>
    entry.corpScoreTerminalScoreTaken === true ||
    entry.corpScoreTerminalAdvanceTaken === true ||
    entry.corpScoreTerminalAgendaInstalled === true ||
    entry.actionType === "score_agenda" ||
    (entry.actionType === "advance_card" &&
      entry.corpEconomyBeforeScoreWindowWithAdvanceToScoreLegalNext === true) ||
    (entry.actionType === "install_card" &&
      entry.installPlacement !== "ice" &&
      entry.targetCardType === "agenda");
  const economy = (entry: AiSimulationActionSequenceEntry) =>
    entry.corpEconomyBeforeScoreTaken === true ||
    entry.corpScoreTerminalSkippedForEconomy === true ||
    entry.actionType === "gain_credit" ||
    hasEvidenceFlag(entry, "corp_economy_before_score_window:true");
  const scoreLegal = (entry: AiSimulationActionSequenceEntry) =>
    entry.corpEconomyBeforeScoreWindowWithScoreLegalNext === true ||
    entry.corpScoreTerminalWindowScoreLegal === true;
  const advanceLegal = (entry: AiSimulationActionSequenceEntry) =>
    entry.corpEconomyBeforeScoreWindowWithAdvanceToScoreLegalNext === true ||
    entry.corpScoreTerminalWindowAdvanceToScoreLegal === true;
  const agendaReadyLegal = (entry: AiSimulationActionSequenceEntry) =>
    entry.corpEconomyBeforeScoreWindowWithAgendaInHqAndReadyRemote === true ||
    entry.corpScoreTerminalWindowAgendaInstallLegal === true;
  const blockedForPlausibleReason = (entry: AiSimulationActionSequenceEntry) =>
    entry.corpEconomyBeforeScoreFixGateBlockedByCredits === true ||
    entry.corpEconomyBeforeScoreFixGateBlockedByCheapContest === true ||
    entry.corpEconomyBeforeScoreFixGateBlockedByRunnerContest === true ||
    entry.corpEconomyBeforeScoreFixGateBlockedBySafety === true ||
    entry.corpEconomyBeforeScorePlausibleNoAgendaExit === true ||
    entry.corpEconomyBeforeScoreWindowRemoteContestHigh === true;
  const fixGateSuspiciousEntry = (entry: AiSimulationActionSequenceEntry) =>
    entry.corpEconomyBeforeScoreFixGateEligible === true &&
    entry.corpEconomyBeforeScoreWindowCreditsAlreadyEnough === true &&
    !blockedForPlausibleReason(entry) &&
    (scoreLegal(entry) || advanceLegal(entry) || agendaReadyLegal(entry));

  for (const { entry, index, sequence } of takenEntries) {
    const future = sequence.slice(index + 1, index + 13);
    const futureCorp = future.filter((candidate) => candidate.side === "corp");
    const nextCorp = futureCorp[0];
    const next3 = futureCorp.slice(0, 3);
    if (nextCorp?.corpScoreTerminalScoreTaken === true)
      convertedToScoreNext += 1;
    if (nextCorp?.corpScoreTerminalAdvanceTaken === true)
      convertedToAdvanceNext += 1;
    if (nextCorp?.corpScoreTerminalAgendaInstalled === true)
      convertedToAgendaInstallNext += 1;
    if (futureCorp.slice(0, 2).some(converted)) convertedWithin2 += 1;
    const convertedInNext3 = next3.some(converted);
    const repeatedInNext3 = next3.some(economy);
    const runnerStealAfterEntry = future.some(
      (candidate) =>
        candidate.side === "runner" && candidate.actionType === "steal_agenda",
    );
    const actionLimitAfterEntry =
      index >= sequence.length - 6 && !futureCorp.some(converted);
    const next3HasDraw = next3.some(
      (candidate) => candidate.actionType === "draw_card",
    );
    const next3HasProtection = next3.some(
      (candidate) =>
        candidate.corpScoreTerminalSkippedForProtection === true ||
        candidate.corpScoreTerminalSkippedForHqProtection === true ||
        candidate.corpScoreTerminalSkippedForRndProtection === true,
    );
    const next3HasNewRemote = next3.some(
      (candidate) =>
        candidate.actionType === "install_card" &&
        candidate.targetServerId === "new_remote",
    );
    const entryPlausible = blockedForPlausibleReason(entry);
    const entrySuspicious = fixGateSuspiciousEntry(entry);

    if (convertedInNext3) convertedWithin3 += 1;
    else {
      notConvertedWithin3 += 1;
      if (entry.corpEconomyBeforeScoreFixGateEligible === true)
        suspiciousNoConversion += 1;
      if (entry.corpEconomyBeforeScoreWindowCreditsShort === true)
        noConversionCreditsStillShort += 1;
      if (entry.corpEconomyBeforeScorePlausibleNoAgendaExit === true)
        noConversionNoAgendaExit += 1;
      if (entry.corpEconomyBeforeScoreWindowWithReadyRemote !== true)
        noConversionRemoteUnsafe += 1;
      if (entry.corpEconomyBeforeScoreWindowRemoteContestHigh === true)
        noConversionRunnerContestHigh += 1;
      if (entry.corpEconomyBeforeScoreFixGateBlockedBySafety === true)
        noConversionSafetyBlocked += 1;
      if (next3HasDraw || next3HasProtection || next3HasNewRemote)
        noConversionPlanDrift += 1;
      if (repeatedInNext3) noConversionRepeatedEconomy += 1;
      if (next3HasDraw) noConversionDrawLoop += 1;
      if (next3HasProtection) noConversionProtectionLoop += 1;
      if (next3HasNewRemote) noConversionRemotePortfolioLoop += 1;
      if (runnerStealAfterEntry) noConversionRunnerSteal += 1;
      if (actionLimitAfterEntry) noConversionActionLimit += 1;
      if (entrySuspicious) noConversionSuspicious += 1;
      if (entryPlausible) noConversionPlausible += 1;
    }
    if (nextCorp && economy(nextCorp)) {
      repeatedEconomyNext += 1;
      if (entry.corpEconomyBeforeScoreFixGateEligible === true)
        suspiciousRepeated += 1;
    }
    if (repeatedInNext3) {
      repeatedEconomyWithin3 += 1;
      if (entry.corpEconomyBeforeScoreWindowCreditsShort === true)
        repeatedCreditsStillShort += 1;
      if (entry.corpEconomyBeforeScoreWindowCreditsAlreadyEnough === true)
        repeatedCreditsAlreadyEnough += 1;
      if (scoreLegal(entry)) repeatedScoreLegal += 1;
      if (advanceLegal(entry)) repeatedAdvanceLegal += 1;
      if (agendaReadyLegal(entry)) repeatedAgendaInstallReadyRemoteLegal += 1;
      if (entry.corpEconomyBeforeScoreWindowWithReadyRemote === true)
        repeatedRemoteSafe += 1;
      if (entry.corpEconomyBeforeScoreWindowRemoteContestHigh === true)
        repeatedRunnerContestHigh += 1;
      if (next3.some((candidate) => candidate.corpScoreTerminalScoreTaken))
        repeatedThenScore += 1;
      if (runnerStealAfterEntry) repeatedThenRunnerSteal += 1;
      if (actionLimitAfterEntry) repeatedThenActionLimit += 1;
      if (entrySuspicious) repeatedSuspicious += 1;
      if (entryPlausible) repeatedPlausible += 1;
    }
    if (nextCorp?.actionType === "draw_card") thenDraw += 1;
    if (
      nextCorp?.corpScoreTerminalSkippedForProtection === true ||
      nextCorp?.corpScoreTerminalSkippedForHqProtection === true ||
      nextCorp?.corpScoreTerminalSkippedForRndProtection === true
    )
      thenProtect += 1;
    if (
      nextCorp?.actionType === "install_card" &&
      nextCorp.targetServerId === "new_remote"
    )
      thenNewRemote += 1;
    if (runnerStealAfterEntry) {
      thenRunnerSteal += 1;
      if (entry.corpEconomyBeforeScoreFixGateEligible === true)
        suspiciousStealFollowup += 1;
    }
    if (actionLimitAfterEntry) thenActionLimit += 1;
  }

  const count = (flag: keyof AiSimulationSummary["actionSequence"][number]) =>
    entries.filter((entry) => entry[flag] === true).length;

  return {
    corpEconomyBeforeScoreWindow: entries.length,
    corpEconomyBeforeScoreWindowNecessary: entries.filter(
      (entry) =>
        entry.corpEconomyBeforeScoreTakenAsNecessaryCredits === true ||
        hasEvidenceFlag(
          entry,
          "corp_economy_before_score_window_necessary:true",
        ),
    ).length,
    corpEconomyBeforeScoreWindowWithInstalledAgenda: count(
      "corpEconomyBeforeScoreWindowWithInstalledAgenda",
    ),
    corpEconomyBeforeScoreWindowWithAdvancedAgenda: count(
      "corpEconomyBeforeScoreWindowWithAdvancedAgenda",
    ),
    corpEconomyBeforeScoreWindowWithScoreLegalNext: count(
      "corpEconomyBeforeScoreWindowWithScoreLegalNext",
    ),
    corpEconomyBeforeScoreWindowWithAdvanceToScoreLegalNext: count(
      "corpEconomyBeforeScoreWindowWithAdvanceToScoreLegalNext",
    ),
    corpEconomyBeforeScoreWindowWithReadyRemote: count(
      "corpEconomyBeforeScoreWindowWithReadyRemote",
    ),
    corpEconomyBeforeScoreWindowWithAgendaInHqAndReadyRemote: count(
      "corpEconomyBeforeScoreWindowWithAgendaInHqAndReadyRemote",
    ),
    corpEconomyBeforeScoreWindowCreditsShort: count(
      "corpEconomyBeforeScoreWindowCreditsShort",
    ),
    corpEconomyBeforeScoreWindowCreditsAlreadyEnough: count(
      "corpEconomyBeforeScoreWindowCreditsAlreadyEnough",
    ),
    corpEconomyBeforeScoreWindowRemoteSafe: count(
      "corpEconomyBeforeScoreWindowRemoteSafe",
    ),
    corpEconomyBeforeScoreWindowRemoteContestHigh: count(
      "corpEconomyBeforeScoreWindowRemoteContestHigh",
    ),
    corpEconomyBeforeScoreTaken: count("corpEconomyBeforeScoreTaken"),
    corpEconomyBeforeScoreTakenAsNecessaryCredits: count(
      "corpEconomyBeforeScoreTakenAsNecessaryCredits",
    ),
    corpEconomyBeforeScoreTakenDespiteCreditsEnough: count(
      "corpEconomyBeforeScoreTakenDespiteCreditsEnough",
    ),
    corpEconomyBeforeScoreTakenOverScoreLegal: count(
      "corpEconomyBeforeScoreTakenOverScoreLegal",
    ),
    corpEconomyBeforeScoreTakenOverAdvanceToScoreLegal: count(
      "corpEconomyBeforeScoreTakenOverAdvanceToScoreLegal",
    ),
    corpEconomyBeforeScoreTakenOverAgendaInstallReadyRemote: count(
      "corpEconomyBeforeScoreTakenOverAgendaInstallReadyRemote",
    ),
    corpEconomyBeforeScoreTakenOverHqAgendaExit: count(
      "corpEconomyBeforeScoreTakenOverHqAgendaExit",
    ),
    corpEconomyBeforeScoreTakenOverScoreAreaAbility: count(
      "corpEconomyBeforeScoreTakenOverScoreAreaAbility",
    ),
    corpEconomyBeforeScoreConvertedToScoreNextDecision: convertedToScoreNext,
    corpEconomyBeforeScoreConvertedToAdvanceNextDecision:
      convertedToAdvanceNext,
    corpEconomyBeforeScoreConvertedToAgendaInstallNextDecision:
      convertedToAgendaInstallNext,
    corpEconomyBeforeScoreConvertedWithin2CorpActions: convertedWithin2,
    corpEconomyBeforeScoreConvertedWithin3CorpActions: convertedWithin3,
    corpEconomyBeforeScoreNotConvertedWithin3CorpActions: notConvertedWithin3,
    corpEconomyBeforeScoreRepeatedEconomyNextDecision: repeatedEconomyNext,
    corpEconomyBeforeScoreRepeatedEconomyWithin3: repeatedEconomyWithin3,
    corpEconomyBeforeScoreThenDraw: thenDraw,
    corpEconomyBeforeScoreThenProtect: thenProtect,
    corpEconomyBeforeScoreThenNewRemote: thenNewRemote,
    corpEconomyBeforeScoreThenRunnerSteal: thenRunnerSteal,
    corpEconomyBeforeScoreThenActionLimit: thenActionLimit,
    corpEconomyBeforeScorePlausibleCreditsNeeded: count(
      "corpEconomyBeforeScorePlausibleCreditsNeeded",
    ),
    corpEconomyBeforeScorePlausibleRezOrAdvanceReserve: count(
      "corpEconomyBeforeScorePlausibleRezOrAdvanceReserve",
    ),
    corpEconomyBeforeScorePlausibleHqOrRndSafety: count(
      "corpEconomyBeforeScorePlausibleHqOrRndSafety",
    ),
    corpEconomyBeforeScorePlausibleRunnerContestTooHigh: count(
      "corpEconomyBeforeScorePlausibleRunnerContestTooHigh",
    ),
    corpEconomyBeforeScorePlausibleNoAgendaExit: count(
      "corpEconomyBeforeScorePlausibleNoAgendaExit",
    ),
    corpEconomyBeforeScoreSuspiciousCreditsAlreadyEnough: count(
      "corpEconomyBeforeScoreSuspiciousCreditsAlreadyEnough",
    ),
    corpEconomyBeforeScoreSuspiciousRepeatedEconomy: suspiciousRepeated,
    corpEconomyBeforeScoreSuspiciousDelayedTerminalAction: count(
      "corpEconomyBeforeScoreSuspiciousDelayedTerminalAction",
    ),
    corpEconomyBeforeScoreSuspiciousRemoteStillSafe: count(
      "corpEconomyBeforeScoreSuspiciousRemoteStillSafe",
    ),
    corpEconomyBeforeScoreSuspiciousRunnerStealFollowup:
      suspiciousStealFollowup,
    corpEconomyBeforeScoreUnclassified: count(
      "corpEconomyBeforeScoreUnclassified",
    ),
    corpEconomyBeforeScoreFixGateEligible: count(
      "corpEconomyBeforeScoreFixGateEligible",
    ),
    corpEconomyBeforeScoreFixGateBlockedByCredits: count(
      "corpEconomyBeforeScoreFixGateBlockedByCredits",
    ),
    corpEconomyBeforeScoreFixGateBlockedByCheapContest: count(
      "corpEconomyBeforeScoreFixGateBlockedByCheapContest",
    ),
    corpEconomyBeforeScoreFixGateBlockedByRunnerContest: count(
      "corpEconomyBeforeScoreFixGateBlockedByRunnerContest",
    ),
    corpEconomyBeforeScoreFixGateBlockedBySafety: count(
      "corpEconomyBeforeScoreFixGateBlockedBySafety",
    ),
    corpEconomyBeforeScoreFixGateSuspicious: count(
      "corpEconomyBeforeScoreFixGateSuspicious",
    ),
    corpEconomyBeforeScoreFixGateSuspiciousRepeatedEconomy: suspiciousRepeated,
    corpEconomyBeforeScoreFixGateSuspiciousNoConversion: suspiciousNoConversion,
    corpEconomyBeforeScoreFixGateSuspiciousStealFollowup:
      suspiciousStealFollowup,
    corpRepeatedEconomyBeforeScoreWindows: repeatedEconomyWithin3,
    corpRepeatedEconomyBeforeScoreCreditsStillShort: repeatedCreditsStillShort,
    corpRepeatedEconomyBeforeScoreCreditsAlreadyEnough:
      repeatedCreditsAlreadyEnough,
    corpRepeatedEconomyBeforeScoreScoreLegal: repeatedScoreLegal,
    corpRepeatedEconomyBeforeScoreAdvanceLegal: repeatedAdvanceLegal,
    corpRepeatedEconomyBeforeScoreAgendaInstallReadyRemoteLegal:
      repeatedAgendaInstallReadyRemoteLegal,
    corpRepeatedEconomyBeforeScoreRemoteSafe: repeatedRemoteSafe,
    corpRepeatedEconomyBeforeScoreRunnerContestHigh: repeatedRunnerContestHigh,
    corpRepeatedEconomyBeforeScoreThenScore: repeatedThenScore,
    corpRepeatedEconomyBeforeScoreThenRunnerSteal: repeatedThenRunnerSteal,
    corpRepeatedEconomyBeforeScoreThenActionLimit: repeatedThenActionLimit,
    corpRepeatedEconomyBeforeScoreSuspicious: repeatedSuspicious,
    corpRepeatedEconomyBeforeScorePlausible: repeatedPlausible,
    corpEconomyBeforeScoreNoConversionCreditsStillShort:
      noConversionCreditsStillShort,
    corpEconomyBeforeScoreNoConversionNoAgendaExit: noConversionNoAgendaExit,
    corpEconomyBeforeScoreNoConversionRemoteUnsafe: noConversionRemoteUnsafe,
    corpEconomyBeforeScoreNoConversionRunnerContestHigh:
      noConversionRunnerContestHigh,
    corpEconomyBeforeScoreNoConversionSafetyBlocked: noConversionSafetyBlocked,
    corpEconomyBeforeScoreNoConversionPlanDrift: noConversionPlanDrift,
    corpEconomyBeforeScoreNoConversionRepeatedEconomy:
      noConversionRepeatedEconomy,
    corpEconomyBeforeScoreNoConversionDrawLoop: noConversionDrawLoop,
    corpEconomyBeforeScoreNoConversionProtectionLoop:
      noConversionProtectionLoop,
    corpEconomyBeforeScoreNoConversionRemotePortfolioLoop:
      noConversionRemotePortfolioLoop,
    corpEconomyBeforeScoreNoConversionRunnerSteal: noConversionRunnerSteal,
    corpEconomyBeforeScoreNoConversionActionLimit: noConversionActionLimit,
    corpEconomyBeforeScoreNoConversionSuspicious: noConversionSuspicious,
    corpEconomyBeforeScoreNoConversionPlausible: noConversionPlausible,
    corpEconomyBeforeScoreCreditsEnoughWindows: entries.filter(
      (entry) =>
        entry.corpEconomyBeforeScoreWindowCreditsAlreadyEnough === true,
    ).length,
    corpEconomyBeforeScoreCreditsEnoughTaken: entries.filter(
      (entry) =>
        entry.corpEconomyBeforeScoreWindowCreditsAlreadyEnough === true &&
        entry.corpEconomyBeforeScoreTaken === true,
    ).length,
    corpEconomyBeforeScoreCreditsEnoughScoreLegal: entries.filter(
      (entry) =>
        entry.corpEconomyBeforeScoreWindowCreditsAlreadyEnough === true &&
        scoreLegal(entry),
    ).length,
    corpEconomyBeforeScoreCreditsEnoughAdvanceLegal: entries.filter(
      (entry) =>
        entry.corpEconomyBeforeScoreWindowCreditsAlreadyEnough === true &&
        advanceLegal(entry),
    ).length,
    corpEconomyBeforeScoreCreditsEnoughAgendaInstallReadyRemoteLegal:
      entries.filter(
        (entry) =>
          entry.corpEconomyBeforeScoreWindowCreditsAlreadyEnough === true &&
          agendaReadyLegal(entry),
      ).length,
    corpEconomyBeforeScoreCreditsEnoughSafetyBlocked: entries.filter(
      (entry) =>
        entry.corpEconomyBeforeScoreWindowCreditsAlreadyEnough === true &&
        entry.corpEconomyBeforeScoreFixGateBlockedBySafety === true,
    ).length,
    corpEconomyBeforeScoreCreditsEnoughSuspicious: entries.filter(
      (entry) =>
        entry.corpEconomyBeforeScoreWindowCreditsAlreadyEnough === true &&
        entry.corpEconomyBeforeScoreTaken === true &&
        fixGateSuspiciousEntry(entry),
    ).length,
    corpEconomyBeforeScoreCreditsEnoughPlausible: entries.filter(
      (entry) =>
        entry.corpEconomyBeforeScoreWindowCreditsAlreadyEnough === true &&
        blockedForPlausibleReason(entry),
    ).length,
  };
}

function corpScoreTerminalFollowupMetrics(
  actionSequence: AiSimulationSummary["actionSequence"],
): Pick<
  AiMatchProgressionMetrics,
  | "corpScoreTerminalSkippedThenAgendaStolen"
  | "corpScoreTerminalSkippedThenNoScoreWindow"
  | "corpScoreTerminalSkippedThenActionLimit"
  | "corpScoreTerminalSkippedThenProtectionLoop"
  | "corpScoreTerminalSkippedThenEconomyLoop"
  | "corpScoreTerminalSkippedThenRemoteStillSafe"
  | "corpScoreTerminalSkippedThenScoreNextDecision"
> {
  let corpScoreTerminalSkippedThenAgendaStolen = 0;
  let corpScoreTerminalSkippedThenNoScoreWindow = 0;
  let corpScoreTerminalSkippedThenActionLimit = 0;
  let corpScoreTerminalSkippedThenProtectionLoop = 0;
  let corpScoreTerminalSkippedThenEconomyLoop = 0;
  let corpScoreTerminalSkippedThenRemoteStillSafe = 0;
  let corpScoreTerminalSkippedThenScoreNextDecision = 0;
  const skippedEntries = actionSequence
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.corpScoreTerminalSkipped === true);

  for (const { entry, index } of skippedEntries) {
    const future = actionSequence.slice(index + 1, index + 13);
    const futureCorp = future.filter((candidate) => candidate.side === "corp");
    const nextCorp = futureCorp[0];
    const scoreLike = (candidate: AiSimulationActionSequenceEntry) =>
      candidate.corpScoreTerminalScoreTaken === true ||
      candidate.corpScoreTerminalAdvanceTaken === true ||
      candidate.corpScoreTerminalAgendaInstalled === true ||
      candidate.actionType === "score_agenda";

    if (
      future.some(
        (candidate) =>
          candidate.side === "runner" &&
          candidate.actionType === "steal_agenda",
      )
    )
      corpScoreTerminalSkippedThenAgendaStolen += 1;

    if (nextCorp && scoreLike(nextCorp))
      corpScoreTerminalSkippedThenScoreNextDecision += 1;

    if (!futureCorp.slice(0, 3).some(scoreLike))
      corpScoreTerminalSkippedThenNoScoreWindow += 1;

    if (index >= actionSequence.length - 6 && !futureCorp.some(scoreLike))
      corpScoreTerminalSkippedThenActionLimit += 1;

    if (
      futureCorp
        .slice(0, 3)
        .some(
          (candidate) =>
            candidate.corpScoreTerminalSkippedForProtection === true ||
            hasEvidenceFlag(
              candidate,
              "corp_protection_loop_after_remote_safe:true",
            ),
        )
    )
      corpScoreTerminalSkippedThenProtectionLoop += 1;

    if (
      futureCorp
        .slice(0, 3)
        .some(
          (candidate) =>
            candidate.corpScoreTerminalSkippedForEconomy === true ||
            hasEvidenceFlag(candidate, "corp_economy_before_score_window:true"),
        )
    )
      corpScoreTerminalSkippedThenEconomyLoop += 1;

    if (
      entry.corpScoreTerminalWindowProtectedRemoteReady === true ||
      futureCorp
        .slice(0, 3)
        .some(
          (candidate) =>
            candidate.corpScoreTerminalWindowProtectedRemoteReady === true,
        )
    )
      corpScoreTerminalSkippedThenRemoteStillSafe += 1;
  }

  return {
    corpScoreTerminalSkippedThenAgendaStolen,
    corpScoreTerminalSkippedThenNoScoreWindow,
    corpScoreTerminalSkippedThenActionLimit,
    corpScoreTerminalSkippedThenProtectionLoop,
    corpScoreTerminalSkippedThenEconomyLoop,
    corpScoreTerminalSkippedThenRemoteStillSafe,
    corpScoreTerminalSkippedThenScoreNextDecision,
  };
}

function summarizeCorpEffectiveRemoteSafetyMetrics(
  summaries: AiSimulationSummary[],
): Pick<
  AiMatchProgressionMetrics,
  | "corpRemoteHasIceButRunnerPathCheap"
  | "corpAgendaInstalledInCheaplyContestableRemote"
  | "corpAdvanceInCheaplyContestableRemote"
  | "corpCheapRemoteContestIgnored"
  | "corpRemoteProtectionOverestimatedByIcePresence"
  | "corpRemoteEffectiveProtectionScore"
  | "runnerKnownPathCostToScoringRemote"
  | "runnerCanContestScoringRemoteForActionOnly"
  | "runnerCanContestScoringRemoteWithCredits"
  | "corpAgendaInstallDeferredDueToCheapContest"
  | "corpAdvanceDeferredDueToCheapContest"
  | "corpProtectionChosenBeforeUnsafeAgendaInstall"
  | "corpScoreLineContinuedWhenRemoteEffectivelyProtected"
  | "corpSameTurnScoreAllowedDespiteCheapContest"
  | "corpBaitRemoteNotCountedAsScoringProtection"
> {
  let corpRemoteHasIceButRunnerPathCheap = 0;
  let corpAgendaInstalledInCheaplyContestableRemote = 0;
  let corpAdvanceInCheaplyContestableRemote = 0;
  let corpCheapRemoteContestIgnored = 0;
  let corpRemoteProtectionOverestimatedByIcePresence = 0;
  let runnerCanContestScoringRemoteForActionOnly = 0;
  let runnerCanContestScoringRemoteWithCredits = 0;
  let corpAgendaInstallDeferredDueToCheapContest = 0;
  let corpAdvanceDeferredDueToCheapContest = 0;
  let corpProtectionChosenBeforeUnsafeAgendaInstall = 0;
  let corpScoreLineContinuedWhenRemoteEffectivelyProtected = 0;
  let corpSameTurnScoreAllowedDespiteCheapContest = 0;
  let corpBaitRemoteNotCountedAsScoringProtection = 0;
  const protectionScores: number[] = [];
  const knownPathCosts: number[] = [];

  for (const summary of summaries) {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    for (const entry of sequence) {
      if (entry.side !== "corp") continue;
      if (
        hasEvidenceFlag(entry, "corp_remote_has_ice_but_runner_path_cheap:true")
      )
        corpRemoteHasIceButRunnerPathCheap += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_agenda_installed_in_cheaply_contestable_remote:true",
        )
      )
        corpAgendaInstalledInCheaplyContestableRemote += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_advance_in_cheaply_contestable_remote:true",
        )
      )
        corpAdvanceInCheaplyContestableRemote += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_remote_protection_overestimated_by_ice_presence:true",
        )
      )
        corpRemoteProtectionOverestimatedByIcePresence += 1;
      if (
        hasEvidenceFlag(
          entry,
          "runner_can_contest_scoring_remote_for_action_only:true",
        )
      )
        runnerCanContestScoringRemoteForActionOnly += 1;
      if (
        hasEvidenceFlag(
          entry,
          "runner_can_contest_scoring_remote_with_credits:true",
        )
      )
        runnerCanContestScoringRemoteWithCredits += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_agenda_install_deferred_due_to_cheap_contest:true",
        )
      )
        corpAgendaInstallDeferredDueToCheapContest += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_advance_deferred_due_to_cheap_contest:true",
        )
      )
        corpAdvanceDeferredDueToCheapContest += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_protection_chosen_before_unsafe_agenda_install:true",
        )
      )
        corpProtectionChosenBeforeUnsafeAgendaInstall += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_score_line_continued_when_remote_effectively_protected:true",
        )
      )
        corpScoreLineContinuedWhenRemoteEffectivelyProtected += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_same_turn_score_allowed_despite_cheap_contest:true",
        )
      )
        corpSameTurnScoreAllowedDespiteCheapContest += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_bait_remote_not_counted_as_scoring_protection:true",
        )
      )
        corpBaitRemoteNotCountedAsScoringProtection += 1;
      const protectionScore = Number(
        evidenceValue(entry, "corp_remote_effective_protection_score:"),
      );
      if (Number.isFinite(protectionScore))
        protectionScores.push(protectionScore);
      const knownPathCost = Number(
        evidenceValue(entry, "runner_known_path_cost_to_scoring_remote:"),
      );
      if (Number.isFinite(knownPathCost)) knownPathCosts.push(knownPathCost);
    }
  }
  corpCheapRemoteContestIgnored =
    corpAgendaInstalledInCheaplyContestableRemote +
    corpAdvanceInCheaplyContestableRemote;
  return {
    corpRemoteHasIceButRunnerPathCheap,
    corpAgendaInstalledInCheaplyContestableRemote,
    corpAdvanceInCheaplyContestableRemote,
    corpCheapRemoteContestIgnored,
    corpRemoteProtectionOverestimatedByIcePresence,
    corpRemoteEffectiveProtectionScore: averageNumber(protectionScores),
    runnerKnownPathCostToScoringRemote: averageNumber(knownPathCosts),
    runnerCanContestScoringRemoteForActionOnly,
    runnerCanContestScoringRemoteWithCredits,
    corpAgendaInstallDeferredDueToCheapContest,
    corpAdvanceDeferredDueToCheapContest,
    corpProtectionChosenBeforeUnsafeAgendaInstall,
    corpScoreLineContinuedWhenRemoteEffectivelyProtected,
    corpSameTurnScoreAllowedDespiteCheapContest,
    corpBaitRemoteNotCountedAsScoringProtection,
  };
}

function summarizeTagPunishWindowMetrics(
  summaries: AiSimulationSummary[],
): Pick<
  AiMatchProgressionMetrics,
  | "runnerTaggedAtCorpDecision"
  | "runnerTaggedAtCorpDecisionTurns"
  | "runnerTaggedAtCorpDecisionActions"
  | "runnerTagClearedBeforeCorpDecision"
  | "runnerTagClearedSameRunnerTurn"
  | "runnerTagWindowExpiredBeforeCorpTurn"
  | "runnerTaggedAfterTraceDuringRun"
  | "runnerTaggedAtEndOfRunnerTurn"
  | "runnerTaggedAtStartOfCorpTurn"
  | "corpTagCreatedDuringRunnerTurn"
  | "corpTagCreatedDuringCorpTurn"
  | "corpTagCreatedDuringEncounter"
  | "corpTagCreatedByTraceSuccess"
  | "corpTagCreatedByAccessOrSteal"
  | "corpTagCreatedByPersistentEffect"
  | "corpTagCreatedByScoredAgendaAction"
  | "corpTagCreatedByOperation"
  | "corpTagCreatedByAssetOrNode"
  | "corpTagCreatedByIce"
  | "runnerTaggedAtCorpDecisionWithFunnelPayoffKnown"
  | "runnerTaggedAtCorpDecisionWithoutPayoffKnown"
  | "runnerTagFromPreviousRunnerTurnStillVisibleAtCorpDecision"
  | "runnerTagFromEncounterStillVisibleAtCorpDecision"
  | "runnerTagClearedBeforeCorpDecisionAfterFunnelSource"
  | "runnerTagClearedSameRunnerTurnAfterSource"
  | "runnerTagWindowExpiredBeforeCorpDecision"
  | "corpVisibleTagPunishLegalActions"
  | "corpVisibleTagDamagePunishLegalActions"
  | "corpVisibleTagEconomicPunishLegalActions"
  | "corpVisibleTagTrashPunishLegalActions"
  | "corpVisibleTagRunLockPunishLegalActions"
  | "corpVisibleTagAmbushPunishLegalActions"
  | "corpVisibleTagPayoffLegalActionsByKind"
  | "corpVisibleTagPayoffLegalActionsByCard"
  | "corpVisibleTagPunishTaken"
  | "corpVisibleTagPunishSkipped"
  | "corpVisibleTagPunishSkippedForScore"
  | "corpVisibleTagPunishSkippedForAdvance"
  | "corpVisibleTagPunishSkippedForEconomy"
  | "corpVisibleTagPunishSkippedForRemoteProtection"
  | "corpVisibleTagPunishSkippedForCentralProtection"
  | "corpVisibleTagPunishSkippedForDraw"
  | "corpVisibleTagPunishSkippedForInstall"
  | "corpVisibleTagPunishSkippedForEndTurn"
  | "corpVisibleTagPunishSkippedForUnknownHigherPriority"
  | "corpVisibleTagPunishSkippedUnknownChosenScore"
  | "corpVisibleTagPunishSkippedUnknownChosenAdvance"
  | "corpVisibleTagPunishSkippedUnknownChosenInstallAgenda"
  | "corpVisibleTagPunishSkippedUnknownChosenInstallIce"
  | "corpVisibleTagPunishSkippedUnknownChosenInstallAssetOrUpgrade"
  | "corpVisibleTagPunishSkippedUnknownChosenRez"
  | "corpVisibleTagPunishSkippedUnknownChosenOperation"
  | "corpVisibleTagPunishSkippedUnknownChosenAbility"
  | "corpVisibleTagPunishSkippedUnknownChosenTraceTagSource"
  | "corpVisibleTagPunishSkippedUnknownChosenDraw"
  | "corpVisibleTagPunishSkippedUnknownChosenBasicCredit"
  | "corpVisibleTagPunishSkippedUnknownChosenEndTurn"
  | "corpVisibleTagPunishSkippedUnknownChosenUnknown"
  | "corpVisibleTagPunishSkippedUnknownByReasonCode"
  | "corpVisibleTagPunishSkippedUnknownByChosenActionType"
  | "corpVisibleTagPunishSkippedUnknownByChosenCard"
  | "corpVisibleTagPunishSkippedUnknownByPayoffCard"
  | "corpVisibleTagPunishSkippedUnknownByPayoffKind"
  | "corpVisibleTagPunishUnknownSkipPlausible"
  | "corpVisibleTagPunishUnknownSkipSuspicious"
  | "corpVisibleTagPunishUnknownSkipUnclassified"
  | "corpVisibleTagPunishUnknownSkipByPlausibility"
  | "corpVisibleTagPunishUnknownSkipPayoffDamage"
  | "corpVisibleTagPunishUnknownSkipPayoffEconomic"
  | "corpVisibleTagPunishUnknownSkipPayoffTrash"
  | "corpVisibleTagPunishUnknownSkipPayoffRunLock"
  | "corpVisibleTagPunishUnknownSkipPayoffAmbush"
  | "corpVisibleTagPunishUnknownSkipPayoffLethalOrNearLethal"
  | "corpVisibleTagPunishUnknownSkipPayoffNonLethal"
  | "corpVisibleTagPunishFixGateEligibleWindow"
  | "corpVisibleTagPunishFixGateBlockedByScore"
  | "corpVisibleTagPunishFixGateBlockedByAdvanceScore"
  | "corpVisibleTagPunishFixGateBlockedBySafety"
  | "corpVisibleTagPunishFixGateBlockedByAffordability"
  | "corpVisibleTagPunishFixGateBlockedByLowImpact"
  | "corpVisibleTagPunishFixGateSuspiciousSkip"
  | "corpVisibleTagPunishDecisionWindows"
  | "corpVisibleTagPunishDecisionWindowsTaken"
  | "corpVisibleTagPunishDecisionWindowsSkipped"
  | "corpVisibleTagPunishDecisionWindowsWithMultiplePayoffs"
  | "corpVisibleTagPunishAlternativePayoffsNotChosen"
  | "corpVisibleTagPunishChosenPayoffAmongAlternatives"
  | "corpVisibleTagPunishUnknownSkipResolvedAsAlternativePayoff"
  | "corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization"
  | "corpVisibleTagPunishSkippedOnlyWhenNoPayoffChosen"
  | "corpVisibleTagPunishWindowHadTakenAndSkippedBeforeNormalization"
  | "corpVisibleTagPunishOperationChoiceAmongPayoffs"
  | "corpVisibleTagPunishChosenDamageOverEconomic"
  | "corpVisibleTagPunishChosenEconomicOverDamage"
  | "corpVisibleTagPunishChosenTrashOverDamage"
  | "corpVisibleTagPunishChosenLethalOverNonLethal"
  | "corpVisibleTagPunishChosenNonLethalOverLethal"
  | "corpVisibleTagPunishChosenLowerImpactOverHigherImpact"
  | "corpVisibleTagPunishChosenUnknownImpactOrdering"
  | "corpVisibleTagPunishFixGateEligibleWindowNormalized"
  | "corpVisibleTagPunishFixGateSuspiciousSkipNormalized"
  | "corpVisibleTagPunishFixGateResolvedByAlternativePayoffTaken"
  | "corpVisibleTagPunishPotentialPayoffOrderingIssue"
  | "corpVisibleTagPunishPotentialPayoffOrderingIssueLethalMissed"
  | "corpVisibleTagPunishPotentialPayoffOrderingIssueEconomicVsDamage"
  | "corpFunnelSourcePayoffPairSeenInDeck"
  | "corpFunnelSourceActionTakenWithPayoffInDeck"
  | "corpFunnelSourceActionTakenWithVisiblePayoff"
  | "corpFunnelSourceActionTakenWithoutVisiblePayoff"
  | "corpFunnelPairConvertedToTaggedDecisionWindow"
  | "corpFunnelPairConvertedToLegalPayoffWindow"
  | "corpFunnelPairConvertedToPayoffTaken"
  | "corpFunnelPairExpiredBeforePayoffWindow"
  | "runnerSurvivalCounterContextAvailable"
  | "runnerTraceDefenseVisibleAtTagSource"
  | "runnerDamagePreventionVisibleAtPayoffWindow"
  | "runnerFlatlinePreventionVisibleAtPayoffWindow"
  | "runnerLinkDefenseVisibleAtTrace"
  | "runnerSurvivalCounterContextSuppressedPunishValue"
  | "corpPunishOpportunities"
  | "corpPunishTaken"
  | "corpPunishSkipped"
  | "corpPunishTakeRate"
  | "corpPunishOpportunityScorchedEarthLike"
  | "corpPunishOpportunityUrbanRenewalLike"
  | "corpPunishOpportunityPunitiveCounterstrikeLike"
  | "corpPunishOpportunityClosedAccountsLike"
  | "corpPunishOpportunityPowerGridOverloadLike"
  | "corpPunishOpportunityDatapoolLike"
  | "corpPunishOpportunityResourceTrashLike"
  | "corpPunishOpportunityScoredAgendaDamageLike"
  | "corpPunishOpportunityScoredAgendaTraceTagLike"
  | "corpPunishOpportunityUnknown"
  | "corpPunishSkippedForEconomy"
  | "corpPunishSkippedForProtection"
  | "corpPunishSkippedForScore"
  | "corpPunishSkippedForRemoteSafety"
  | "corpPunishSkippedForDraw"
  | "corpPunishSkippedForEndTurn"
  | "corpPunishSkippedForUnknown"
  | "corpPunishWindowExpiredBeforeAction"
  | "corpPunishWindowExpiredBeforeCorpTurn"
  | "corpTagSourceOpportunities"
  | "corpTagSourceTaken"
  | "corpTagSourceSkipped"
  | "corpTraceTagOpportunities"
  | "corpTraceTagTaken"
  | "corpTraceTagSkipped"
  | "corpTraceTagExpectedSuccess"
  | "corpTraceTagSkippedForEconomy"
  | "corpTraceTagSkippedForProtection"
  | "corpTraceTagSkippedForScore"
  | "corpTraceTagSkippedForRemoteSafety"
  | "corpTagSourceConvertedToRunnerTagged"
  | "corpTagSourceConvertedToPunishOpportunity"
  | "corpTagSourceConvertedToPunishTaken"
  | "corpTagPunishFunnelTagSourceOpportunity"
  | "corpTagPunishFunnelTagSourceTaken"
  | "corpTagPunishFunnelRunnerTagged"
  | "corpTagPunishFunnelRunnerTaggedAtCorpDecision"
  | "corpTagPunishFunnelPunishOpportunity"
  | "corpTagPunishFunnelPunishTaken"
  | "corpTagPunishFunnelTerminalDamageOrEconomicHit"
  | "corpTagPunishFunnelFlatlineOrLock"
  | "corpTagPunishOntologyProfilesSeen"
  | "corpTagSourceOntologyProfilesSeen"
  | "corpTagPunishPayoffOntologyProfilesSeen"
  | "corpTagSourceOntologyUsed"
  | "corpTagPunishPayoffOntologyUsed"
  | "corpTagPunishOntologyFallbackUsed"
  | "corpTagPunishOntologyConflict"
  | "corpTagSourceLegalActionClassifiedByOntology"
  | "corpPunishLegalActionClassifiedByOntology"
  | "corpPunishOpportunityConfirmedByOntology"
  | "corpPunishSkippedDespiteOntologyOpportunity"
  | "corpTagSourceTakenWithOntologyPayoffAvailable"
  | "corpTagSourceTakenWithoutOntologyPayoff"
  | "corpTagSourceConvertedToOntologyPunishOpportunity"
  | "corpOntologyPunishOpportunityConverted"
  | "corpOntologyPunishOpportunityExpired"
  | "corpTagPunishOntologyByKind"
  | "corpTagPunishOntologyKindTagSource"
  | "corpTagPunishOntologyKindTagPunishPayoff"
  | "corpTagPunishOntologyKindTrace"
  | "corpTagPunishOntologyKindTag"
  | "corpTagPunishOntologyKindDamage"
  | "corpTagPunishOntologyKindResourceTrash"
  | "corpTagPunishOntologyKindHardwareTrash"
  | "corpTagPunishOntologyKindScoredAgendaDamageLike"
  | "corpTagPunishOntologyKindScoredAgendaTraceTagLike"
  | "corpTagPunishConditionByKind"
  | "corpTagPunishConditionRequiresRunnerTagged"
  | "corpTagPunishConditionRequiresTraceSuccess"
> {
  let runnerTaggedAtCorpDecisionActions = 0;
  const runnerTaggedAtCorpDecisionTurns = new Set<string>();
  let runnerTagClearedBeforeCorpDecision = 0;
  let runnerTagClearedSameRunnerTurn = 0;
  let runnerTagWindowExpiredBeforeCorpTurn = 0;
  let runnerTaggedAfterTraceDuringRun = 0;
  let runnerTaggedAtEndOfRunnerTurn = 0;
  let runnerTaggedAtStartOfCorpTurn = 0;
  let corpTagCreatedDuringRunnerTurn = 0;
  let corpTagCreatedDuringCorpTurn = 0;
  let corpTagCreatedDuringEncounter = 0;
  let corpTagCreatedByTraceSuccess = 0;
  let corpTagCreatedByAccessOrSteal = 0;
  let corpTagCreatedByPersistentEffect = 0;
  let corpTagCreatedByScoredAgendaAction = 0;
  let corpTagCreatedByOperation = 0;
  let corpTagCreatedByAssetOrNode = 0;
  let corpTagCreatedByIce = 0;
  let runnerTaggedAtCorpDecisionWithFunnelPayoffKnown = 0;
  let runnerTaggedAtCorpDecisionWithoutPayoffKnown = 0;
  let runnerTagFromPreviousRunnerTurnStillVisibleAtCorpDecision = 0;
  let runnerTagFromEncounterStillVisibleAtCorpDecision = 0;
  let runnerTagClearedBeforeCorpDecisionAfterFunnelSource = 0;
  let runnerTagClearedSameRunnerTurnAfterSource = 0;
  let runnerTagWindowExpiredBeforeCorpDecision = 0;
  let corpVisibleTagPunishLegalActions = 0;
  let corpVisibleTagDamagePunishLegalActions = 0;
  let corpVisibleTagEconomicPunishLegalActions = 0;
  let corpVisibleTagTrashPunishLegalActions = 0;
  let corpVisibleTagRunLockPunishLegalActions = 0;
  let corpVisibleTagAmbushPunishLegalActions = 0;
  const corpVisibleTagPayoffLegalActionsByKindCounts: Record<string, number> =
    {};
  const corpVisibleTagPayoffLegalActionsByCardCounts: Record<string, number> =
    {};
  let corpVisibleTagPunishTaken = 0;
  let corpVisibleTagPunishSkipped = 0;
  const unknownSkipChosenFamilyCounts: Record<
    CorpTagPunishUnknownChosenFamily,
    number
  > = {
    score: 0,
    advance: 0,
    install_agenda: 0,
    install_ice: 0,
    install_asset_or_upgrade: 0,
    rez: 0,
    operation: 0,
    ability: 0,
    trace_tag_source: 0,
    draw: 0,
    basic_credit: 0,
    end_turn: 0,
    unknown: 0,
  };
  const unknownSkipReasonCodeCounts: Record<string, number> = {};
  const unknownSkipChosenActionTypeCounts: Record<string, number> = {};
  const unknownSkipChosenCardCounts: Record<string, number> = {};
  const unknownSkipPayoffCardCounts: Record<string, number> = {};
  const unknownSkipPayoffKindCounts: Record<string, number> = {};
  const unknownSkipPlausibilityCounts: Record<
    CorpTagPunishUnknownSkipPlausibility,
    number
  > = {
    plausible: 0,
    suspicious: 0,
    unclassified: 0,
  };
  let corpVisibleTagPunishUnknownSkipPayoffDamage = 0;
  let corpVisibleTagPunishUnknownSkipPayoffEconomic = 0;
  let corpVisibleTagPunishUnknownSkipPayoffTrash = 0;
  let corpVisibleTagPunishUnknownSkipPayoffRunLock = 0;
  let corpVisibleTagPunishUnknownSkipPayoffAmbush = 0;
  let corpVisibleTagPunishUnknownSkipPayoffLethalOrNearLethal = 0;
  let corpVisibleTagPunishUnknownSkipPayoffNonLethal = 0;
  let corpVisibleTagPunishFixGateEligibleWindow = 0;
  let corpVisibleTagPunishFixGateBlockedByScore = 0;
  let corpVisibleTagPunishFixGateBlockedByAdvanceScore = 0;
  let corpVisibleTagPunishFixGateBlockedBySafety = 0;
  let corpVisibleTagPunishFixGateBlockedByAffordability = 0;
  let corpVisibleTagPunishFixGateBlockedByLowImpact = 0;
  let corpVisibleTagPunishFixGateSuspiciousSkip = 0;
  let corpVisibleTagPunishDecisionWindows = 0;
  let corpVisibleTagPunishDecisionWindowsTaken = 0;
  let corpVisibleTagPunishDecisionWindowsSkipped = 0;
  let corpVisibleTagPunishDecisionWindowsWithMultiplePayoffs = 0;
  let corpVisibleTagPunishAlternativePayoffsNotChosen = 0;
  let corpVisibleTagPunishChosenPayoffAmongAlternatives = 0;
  let corpVisibleTagPunishUnknownSkipResolvedAsAlternativePayoff = 0;
  let corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization = 0;
  let corpVisibleTagPunishSkippedOnlyWhenNoPayoffChosen = 0;
  let corpVisibleTagPunishWindowHadTakenAndSkippedBeforeNormalization = 0;
  let corpVisibleTagPunishOperationChoiceAmongPayoffs = 0;
  let corpVisibleTagPunishChosenDamageOverEconomic = 0;
  let corpVisibleTagPunishChosenEconomicOverDamage = 0;
  let corpVisibleTagPunishChosenTrashOverDamage = 0;
  let corpVisibleTagPunishChosenLethalOverNonLethal = 0;
  let corpVisibleTagPunishChosenNonLethalOverLethal = 0;
  let corpVisibleTagPunishChosenLowerImpactOverHigherImpact = 0;
  let corpVisibleTagPunishChosenUnknownImpactOrdering = 0;
  let corpVisibleTagPunishFixGateEligibleWindowNormalized = 0;
  let corpVisibleTagPunishFixGateSuspiciousSkipNormalized = 0;
  let corpVisibleTagPunishFixGateResolvedByAlternativePayoffTaken = 0;
  let corpVisibleTagPunishPotentialPayoffOrderingIssue = 0;
  let corpVisibleTagPunishPotentialPayoffOrderingIssueLethalMissed = 0;
  let corpVisibleTagPunishPotentialPayoffOrderingIssueEconomicVsDamage = 0;
  const visiblePunishSkippedByReason: Record<CorpTagPunishSkipReason, number> =
    {
      economy: 0,
      protection: 0,
      score: 0,
      advance: 0,
      remote_safety: 0,
      remote_protection: 0,
      central_protection: 0,
      draw: 0,
      install: 0,
      end_turn: 0,
      unknown_higher_priority: 0,
      unknown: 0,
    };
  let corpFunnelSourcePayoffPairSeenInDeck = 0;
  let corpFunnelSourceActionTakenWithPayoffInDeck = 0;
  let corpFunnelSourceActionTakenWithVisiblePayoff = 0;
  let corpFunnelSourceActionTakenWithoutVisiblePayoff = 0;
  let corpFunnelPairConvertedToTaggedDecisionWindow = 0;
  let corpFunnelPairConvertedToLegalPayoffWindow = 0;
  let corpFunnelPairConvertedToPayoffTaken = 0;
  let corpFunnelPairExpiredBeforePayoffWindow = 0;
  let runnerSurvivalCounterContextAvailable = 0;
  let runnerTraceDefenseVisibleAtTagSource = 0;
  let runnerDamagePreventionVisibleAtPayoffWindow = 0;
  let runnerFlatlinePreventionVisibleAtPayoffWindow = 0;
  let runnerLinkDefenseVisibleAtTrace = 0;
  let runnerSurvivalCounterContextSuppressedPunishValue = 0;
  let corpPunishOpportunities = 0;
  let corpPunishTaken = 0;
  let corpPunishSkipped = 0;
  const punishByKind: Record<CorpPunishKind, number> = {
    scorched_earth_like: 0,
    urban_renewal_like: 0,
    punitive_counterstrike_like: 0,
    closed_accounts_like: 0,
    power_grid_overload_like: 0,
    datapool_like: 0,
    resource_trash_like: 0,
    scored_agenda_damage_like: 0,
    scored_agenda_trace_tag_like: 0,
    unknown: 0,
  };
  const punishSkippedByReason: Record<CorpTagPunishSkipReason, number> = {
    economy: 0,
    protection: 0,
    score: 0,
    advance: 0,
    remote_safety: 0,
    remote_protection: 0,
    central_protection: 0,
    draw: 0,
    install: 0,
    end_turn: 0,
    unknown_higher_priority: 0,
    unknown: 0,
  };
  let corpPunishWindowExpiredBeforeAction = 0;
  let corpPunishWindowExpiredBeforeCorpTurn = 0;
  let corpTagSourceOpportunities = 0;
  let corpTagSourceTaken = 0;
  let corpTagSourceSkipped = 0;
  let corpTraceTagOpportunities = 0;
  let corpTraceTagTaken = 0;
  let corpTraceTagSkipped = 0;
  let corpTraceTagExpectedSuccess = 0;
  const traceSkippedByReason: Record<CorpTagPunishSkipReason, number> = {
    economy: 0,
    protection: 0,
    score: 0,
    advance: 0,
    remote_safety: 0,
    remote_protection: 0,
    central_protection: 0,
    draw: 0,
    install: 0,
    end_turn: 0,
    unknown_higher_priority: 0,
    unknown: 0,
  };
  let corpTagSourceConvertedToRunnerTagged = 0;
  let corpTagSourceConvertedToPunishOpportunity = 0;
  let corpTagSourceConvertedToPunishTaken = 0;
  let corpTagPunishFunnelTerminalDamageOrEconomicHit = 0;
  let corpTagPunishFunnelFlatlineOrLock = 0;
  let corpTagPunishOntologyProfilesSeen = 0;
  let corpTagSourceOntologyProfilesSeen = 0;
  let corpTagPunishPayoffOntologyProfilesSeen = 0;
  let corpTagSourceOntologyUsed = 0;
  let corpTagPunishPayoffOntologyUsed = 0;
  let corpTagPunishOntologyFallbackUsed = 0;
  let corpTagPunishOntologyConflict = 0;
  let corpTagSourceLegalActionClassifiedByOntology = 0;
  let corpPunishLegalActionClassifiedByOntology = 0;
  let corpPunishOpportunityConfirmedByOntology = 0;
  let corpPunishSkippedDespiteOntologyOpportunity = 0;
  let corpTagSourceTakenWithOntologyPayoffAvailable = 0;
  let corpTagSourceTakenWithoutOntologyPayoff = 0;
  let corpTagSourceConvertedToOntologyPunishOpportunity = 0;
  let corpOntologyPunishOpportunityConverted = 0;
  let corpOntologyPunishOpportunityExpired = 0;
  const ontologyByKind: Record<string, number> = {
    tag_source: 0,
    tag_punish_payoff: 0,
    trace: 0,
    tag: 0,
    damage: 0,
    resource_trash: 0,
    hardware_trash: 0,
    scored_agenda_damage_like: 0,
    scored_agenda_trace_tag_like: 0,
  };
  const ontologyConditionByKind: Record<string, number> = {
    requires_runner_tagged: 0,
    requires_trace_success: 0,
  };

  for (const summary of summaries) {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    const expiredBeforeCorpTurnIndexes = new Set<number>();
    for (const [index, entry] of sequence.entries()) {
      if (entry.runnerTaggedAtCorpDecision === true) {
        runnerTaggedAtCorpDecisionActions += 1;
        runnerTaggedAtCorpDecisionTurns.add(
          `${summary.seed}:${entry.turnNumber ?? 0}`,
        );
        if (entry.runnerTaggedAtCorpDecisionWithFunnelPayoffKnown === true)
          runnerTaggedAtCorpDecisionWithFunnelPayoffKnown += 1;
        if (entry.runnerTaggedAtCorpDecisionWithoutPayoffKnown === true)
          runnerTaggedAtCorpDecisionWithoutPayoffKnown += 1;
        if (previousRunnerTurnTagBefore(sequence, index))
          runnerTagFromPreviousRunnerTurnStillVisibleAtCorpDecision += 1;
        if (previousEncounterTagBefore(sequence, index))
          runnerTagFromEncounterStillVisibleAtCorpDecision += 1;
      }
      if (entry.runnerTaggedAtStartOfCorpTurn === true)
        runnerTaggedAtStartOfCorpTurn += 1;
      if (entry.runnerTaggedAtEndOfRunnerTurn === true)
        runnerTaggedAtEndOfRunnerTurn += 1;
      if (entry.runnerTaggedAfterTraceDuringRun === true)
        runnerTaggedAfterTraceDuringRun += 1;
      if (entry.corpTagCreatedDuringRunnerTurn === true)
        corpTagCreatedDuringRunnerTurn += 1;
      if (entry.corpTagCreatedDuringCorpTurn === true)
        corpTagCreatedDuringCorpTurn += 1;
      if (entry.corpTagCreatedDuringEncounter === true)
        corpTagCreatedDuringEncounter += 1;
      if (entry.corpTagCreatedByTraceSuccess === true)
        corpTagCreatedByTraceSuccess += 1;
      if (entry.corpTagCreatedByAccessOrSteal === true)
        corpTagCreatedByAccessOrSteal += 1;
      if (entry.corpTagCreatedByPersistentEffect === true)
        corpTagCreatedByPersistentEffect += 1;
      if (entry.corpTagCreatedByScoredAgendaAction === true)
        corpTagCreatedByScoredAgendaAction += 1;
      if (entry.corpTagCreatedByOperation === true)
        corpTagCreatedByOperation += 1;
      if (entry.corpTagCreatedByAssetOrNode === true)
        corpTagCreatedByAssetOrNode += 1;
      if (entry.corpTagCreatedByIce === true) corpTagCreatedByIce += 1;
      if (entry.runnerTagClearedByAction === true) {
        runnerTagClearedSameRunnerTurn += 1;
        if (previousFunnelSourceBefore(sequence, index)) {
          runnerTagClearedSameRunnerTurnAfterSource += 1;
          runnerTagClearedBeforeCorpDecisionAfterFunnelSource += 1;
          corpFunnelPairExpiredBeforePayoffWindow += 1;
        }
        const nextCorpIndex = sequence.findIndex(
          (later, laterIndex) => laterIndex > index && later.side === "corp",
        );
        if (nextCorpIndex > index) {
          runnerTagClearedBeforeCorpDecision += 1;
          runnerTagWindowExpiredBeforeCorpTurn += 1;
          runnerTagWindowExpiredBeforeCorpDecision += 1;
          expiredBeforeCorpTurnIndexes.add(nextCorpIndex);
          if (
            sequence
              .slice(Math.max(0, index - 12), index)
              .some(
                (previous) =>
                  previous.corpTagSourceTakenWithOntologyPayoffAvailable ===
                  true,
              )
          )
            corpOntologyPunishOpportunityExpired += 1;
        }
      }
      if ((entry.corpVisibleTagPunishLegalActions ?? 0) > 0) {
        corpVisibleTagPunishLegalActions +=
          entry.corpVisibleTagPunishLegalActions ?? 0;
        addKindsToCounter(
          entry.corpVisibleTagPayoffLegalActionKinds ?? [],
          corpVisibleTagPayoffLegalActionsByKindCounts,
        );
        addCardsToCounter(
          entry.corpVisibleTagPayoffLegalActionCards ?? [],
          corpVisibleTagPayoffLegalActionsByCardCounts,
        );
      }
      if (entry.corpVisibleTagDamagePunishLegalActions === true)
        corpVisibleTagDamagePunishLegalActions += 1;
      if (entry.corpVisibleTagEconomicPunishLegalActions === true)
        corpVisibleTagEconomicPunishLegalActions += 1;
      if (entry.corpVisibleTagTrashPunishLegalActions === true)
        corpVisibleTagTrashPunishLegalActions += 1;
      if (entry.corpVisibleTagRunLockPunishLegalActions === true)
        corpVisibleTagRunLockPunishLegalActions += 1;
      if (entry.corpVisibleTagAmbushPunishLegalActions === true)
        corpVisibleTagAmbushPunishLegalActions += 1;
      if (entry.corpVisibleTagPunishTaken === true)
        corpVisibleTagPunishTaken += 1;
      if (entry.corpVisibleTagPunishSkipped === true) {
        corpVisibleTagPunishSkipped += 1;
        incrementTypedCounter(
          visiblePunishSkippedByReason,
          entry.corpVisibleTagPunishSkippedReason ?? "unknown",
        );
        if (
          entry.corpVisibleTagPunishSkippedReason ===
            "unknown_higher_priority" ||
          entry.corpVisibleTagPunishSkippedReason === "unknown"
        ) {
          unknownSkipChosenFamilyCounts[
            entry.corpVisibleTagPunishUnknownSkipChosenFamily ?? "unknown"
          ] += 1;
          incrementStringCounter(unknownSkipReasonCodeCounts, entry.reasonCode);
          incrementStringCounter(
            unknownSkipChosenActionTypeCounts,
            entry.corpVisibleTagPunishUnknownSkipChosenActionType ??
              entry.actionType,
          );
          if (entry.corpVisibleTagPunishUnknownSkipChosenCardId)
            incrementStringCounter(
              unknownSkipChosenCardCounts,
              entry.corpVisibleTagPunishUnknownSkipChosenCardId,
            );
          addCardsToCounter(
            entry.corpVisibleTagPayoffLegalActionCards ?? [],
            unknownSkipPayoffCardCounts,
          );
          addKindsToCounter(
            entry.corpVisibleTagPayoffLegalActionKinds ?? [],
            unknownSkipPayoffKindCounts,
          );
          unknownSkipPlausibilityCounts[
            entry.corpVisibleTagPunishUnknownSkipPlausibility ?? "unclassified"
          ] += 1;
          if (
            entry.corpVisibleTagPayoffLegalActionKinds?.includes("damage") ===
            true
          )
            corpVisibleTagPunishUnknownSkipPayoffDamage += 1;
          if (
            entry.corpVisibleTagPayoffLegalActionKinds?.includes("economic") ===
            true
          )
            corpVisibleTagPunishUnknownSkipPayoffEconomic += 1;
          if (
            entry.corpVisibleTagPayoffLegalActionKinds?.includes("trash") ===
            true
          )
            corpVisibleTagPunishUnknownSkipPayoffTrash += 1;
          if (
            entry.corpVisibleTagPayoffLegalActionKinds?.includes("run_lock") ===
            true
          )
            corpVisibleTagPunishUnknownSkipPayoffRunLock += 1;
          if (
            entry.corpVisibleTagPayoffLegalActionKinds?.includes("ambush") ===
            true
          )
            corpVisibleTagPunishUnknownSkipPayoffAmbush += 1;
          if (
            entry.corpVisibleTagPunishUnknownSkipPayoffLethalOrNearLethal ===
            true
          )
            corpVisibleTagPunishUnknownSkipPayoffLethalOrNearLethal += 1;
          else corpVisibleTagPunishUnknownSkipPayoffNonLethal += 1;
          if (entry.corpVisibleTagPunishUnknownSkipFixGateEligible === true) {
            corpVisibleTagPunishFixGateEligibleWindow += 1;
            if (
              entry.corpVisibleTagPunishUnknownSkipPlausibility === "suspicious"
            )
              corpVisibleTagPunishFixGateSuspiciousSkip += 1;
          }
          switch (entry.corpVisibleTagPunishUnknownSkipFixGateBlockedBy) {
            case "score":
              corpVisibleTagPunishFixGateBlockedByScore += 1;
              break;
            case "advance_score":
              corpVisibleTagPunishFixGateBlockedByAdvanceScore += 1;
              break;
            case "safety":
              corpVisibleTagPunishFixGateBlockedBySafety += 1;
              break;
            case "affordability":
              corpVisibleTagPunishFixGateBlockedByAffordability += 1;
              break;
            case "low_impact":
              corpVisibleTagPunishFixGateBlockedByLowImpact += 1;
              break;
          }
        }
      }
      if (entry.corpVisibleTagPunishDecisionWindow === true)
        corpVisibleTagPunishDecisionWindows += 1;
      if (entry.corpVisibleTagPunishDecisionWindowTaken === true)
        corpVisibleTagPunishDecisionWindowsTaken += 1;
      if (entry.corpVisibleTagPunishDecisionWindowSkipped === true)
        corpVisibleTagPunishDecisionWindowsSkipped += 1;
      if (entry.corpVisibleTagPunishDecisionWindowWithMultiplePayoffs === true)
        corpVisibleTagPunishDecisionWindowsWithMultiplePayoffs += 1;
      corpVisibleTagPunishAlternativePayoffsNotChosen +=
        entry.corpVisibleTagPunishAlternativePayoffsNotChosen ?? 0;
      if (entry.corpVisibleTagPunishChosenPayoffAmongAlternatives === true)
        corpVisibleTagPunishChosenPayoffAmongAlternatives += 1;
      if (
        entry.corpVisibleTagPunishUnknownSkipResolvedAsAlternativePayoff ===
        true
      )
        corpVisibleTagPunishUnknownSkipResolvedAsAlternativePayoff += 1;
      if (
        entry.corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization ===
        true
      )
        corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization += 1;
      if (entry.corpVisibleTagPunishSkippedOnlyWhenNoPayoffChosen === true)
        corpVisibleTagPunishSkippedOnlyWhenNoPayoffChosen += 1;
      if (
        entry.corpVisibleTagPunishWindowHadTakenAndSkippedBeforeNormalization ===
        true
      )
        corpVisibleTagPunishWindowHadTakenAndSkippedBeforeNormalization += 1;
      if (entry.corpVisibleTagPunishOperationChoiceAmongPayoffs === true)
        corpVisibleTagPunishOperationChoiceAmongPayoffs += 1;
      if (entry.corpVisibleTagPunishChosenDamageOverEconomic === true)
        corpVisibleTagPunishChosenDamageOverEconomic += 1;
      if (entry.corpVisibleTagPunishChosenEconomicOverDamage === true)
        corpVisibleTagPunishChosenEconomicOverDamage += 1;
      if (entry.corpVisibleTagPunishChosenTrashOverDamage === true)
        corpVisibleTagPunishChosenTrashOverDamage += 1;
      if (entry.corpVisibleTagPunishChosenLethalOverNonLethal === true)
        corpVisibleTagPunishChosenLethalOverNonLethal += 1;
      if (entry.corpVisibleTagPunishChosenNonLethalOverLethal === true)
        corpVisibleTagPunishChosenNonLethalOverLethal += 1;
      if (entry.corpVisibleTagPunishChosenLowerImpactOverHigherImpact === true)
        corpVisibleTagPunishChosenLowerImpactOverHigherImpact += 1;
      if (entry.corpVisibleTagPunishChosenUnknownImpactOrdering === true)
        corpVisibleTagPunishChosenUnknownImpactOrdering += 1;
      if (entry.corpVisibleTagPunishFixGateEligibleWindowNormalized === true)
        corpVisibleTagPunishFixGateEligibleWindowNormalized += 1;
      if (entry.corpVisibleTagPunishFixGateSuspiciousSkipNormalized === true)
        corpVisibleTagPunishFixGateSuspiciousSkipNormalized += 1;
      if (
        entry.corpVisibleTagPunishFixGateResolvedByAlternativePayoffTaken ===
        true
      )
        corpVisibleTagPunishFixGateResolvedByAlternativePayoffTaken += 1;
      if (entry.corpVisibleTagPunishPotentialPayoffOrderingIssue === true)
        corpVisibleTagPunishPotentialPayoffOrderingIssue += 1;
      if (
        entry.corpVisibleTagPunishPotentialPayoffOrderingIssueLethalMissed ===
        true
      )
        corpVisibleTagPunishPotentialPayoffOrderingIssueLethalMissed += 1;
      if (
        entry.corpVisibleTagPunishPotentialPayoffOrderingIssueEconomicVsDamage ===
        true
      )
        corpVisibleTagPunishPotentialPayoffOrderingIssueEconomicVsDamage += 1;
      if (entry.corpFunnelSourcePayoffPairSeenInDeck === true)
        corpFunnelSourcePayoffPairSeenInDeck += 1;
      if (entry.corpFunnelSourceActionTakenWithPayoffInDeck === true) {
        corpFunnelSourceActionTakenWithPayoffInDeck += 1;
        if (tagSourceConvertsToTaggedCorpDecision(sequence, index))
          corpFunnelPairConvertedToTaggedDecisionWindow += 1;
        if (tagSourceConvertsToVisibleLegalPayoffWindow(sequence, index))
          corpFunnelPairConvertedToLegalPayoffWindow += 1;
        if (tagSourceConvertsToPunishTaken(sequence, index))
          corpFunnelPairConvertedToPayoffTaken += 1;
      }
      if (entry.corpFunnelSourceActionTakenWithVisiblePayoff === true)
        corpFunnelSourceActionTakenWithVisiblePayoff += 1;
      if (entry.corpFunnelSourceActionTakenWithoutVisiblePayoff === true)
        corpFunnelSourceActionTakenWithoutVisiblePayoff += 1;
      if (entry.runnerSurvivalCounterContextAvailable === true)
        runnerSurvivalCounterContextAvailable += 1;
      if (entry.runnerTraceDefenseVisibleAtTagSource === true)
        runnerTraceDefenseVisibleAtTagSource += 1;
      if (entry.runnerDamagePreventionVisibleAtPayoffWindow === true)
        runnerDamagePreventionVisibleAtPayoffWindow += 1;
      if (entry.runnerFlatlinePreventionVisibleAtPayoffWindow === true)
        runnerFlatlinePreventionVisibleAtPayoffWindow += 1;
      if (entry.runnerLinkDefenseVisibleAtTrace === true)
        runnerLinkDefenseVisibleAtTrace += 1;
      if (entry.runnerSurvivalCounterContextSuppressedPunishValue === true)
        runnerSurvivalCounterContextSuppressedPunishValue += 1;
      if (entry.corpPunishOpportunity === true) {
        corpPunishOpportunities += 1;
        punishByKind[entry.corpPunishKind ?? "unknown"] += 1;
        if (entry.corpPunishTaken === true) {
          corpPunishTaken += 1;
          if (isTerminalDamageOrEconomicPunish(entry.corpPunishKind))
            corpTagPunishFunnelTerminalDamageOrEconomicHit += 1;
        } else {
          corpPunishSkipped += 1;
          incrementTypedCounter(
            punishSkippedByReason,
            entry.corpPunishSkippedReason ?? "unknown",
          );
        }
      }
      if (expiredBeforeCorpTurnIndexes.has(index)) {
        corpPunishWindowExpiredBeforeAction += 1;
        corpPunishWindowExpiredBeforeCorpTurn += 1;
      }
      if (entry.corpTagSourceOpportunity === true) {
        corpTagSourceOpportunities += 1;
        if (entry.corpTagSourceTaken === true) {
          corpTagSourceTaken += 1;
          if (tagSourceConvertsToRunnerTagged(sequence, index))
            corpTagSourceConvertedToRunnerTagged += 1;
          if (tagSourceConvertsToPunishOpportunity(sequence, index))
            corpTagSourceConvertedToPunishOpportunity += 1;
          if (tagSourceConvertsToPunishTaken(sequence, index))
            corpTagSourceConvertedToPunishTaken += 1;
          if (
            entry.corpTagSourceTakenWithOntologyPayoffAvailable === true &&
            tagSourceConvertsToPunishOpportunity(sequence, index)
          )
            corpTagSourceConvertedToOntologyPunishOpportunity += 1;
        } else corpTagSourceSkipped += 1;
      }
      if (entry.corpTraceTagOpportunity === true) {
        corpTraceTagOpportunities += 1;
        corpTraceTagExpectedSuccess += entry.corpTraceTagExpectedSuccess ?? 0;
        if (entry.corpTraceTagTaken === true) corpTraceTagTaken += 1;
        else {
          corpTraceTagSkipped += 1;
          incrementTypedCounter(
            traceSkippedByReason,
            entry.corpTraceTagSkippedReason ?? "unknown",
          );
        }
      }
      if (entry.corpTagPunishOntologyProfilesSeen === true)
        corpTagPunishOntologyProfilesSeen += 1;
      if (entry.corpTagSourceOntologyProfilesSeen === true)
        corpTagSourceOntologyProfilesSeen += 1;
      if (entry.corpTagPunishPayoffOntologyProfilesSeen === true)
        corpTagPunishPayoffOntologyProfilesSeen += 1;
      if (entry.corpTagSourceOntologyUsed === true)
        corpTagSourceOntologyUsed += 1;
      if (entry.corpTagPunishPayoffOntologyUsed === true)
        corpTagPunishPayoffOntologyUsed += 1;
      if (
        entry.corpTagPunishOntologyProfilesSeen === true &&
        (entry.corpTagSourceOntologyUsed === true ||
          entry.corpTagPunishPayoffOntologyUsed === true)
      )
        corpTagPunishOntologyFallbackUsed += 1;
      if (entry.corpTagPunishOntologyConflict === true)
        corpTagPunishOntologyConflict += 1;
      if (entry.corpTagSourceLegalActionClassifiedByOntology === true)
        corpTagSourceLegalActionClassifiedByOntology += 1;
      if (entry.corpPunishLegalActionClassifiedByOntology === true)
        corpPunishLegalActionClassifiedByOntology += 1;
      if (entry.corpPunishOpportunityConfirmedByOntology === true)
        corpPunishOpportunityConfirmedByOntology += 1;
      if (entry.corpPunishSkippedDespiteOntologyOpportunity === true)
        corpPunishSkippedDespiteOntologyOpportunity += 1;
      if (entry.corpTagSourceTakenWithOntologyPayoffAvailable === true)
        corpTagSourceTakenWithOntologyPayoffAvailable += 1;
      if (entry.corpTagSourceTakenWithoutOntologyPayoff === true)
        corpTagSourceTakenWithoutOntologyPayoff += 1;
      if (entry.corpOntologyPunishOpportunityConverted === true)
        corpOntologyPunishOpportunityConverted += 1;
      for (const kind of entry.corpTagPunishOntologyKinds ?? []) {
        if (kind in ontologyByKind)
          ontologyByKind[kind] = (ontologyByKind[kind] ?? 0) + 1;
      }
      for (const kind of entry.corpTagPunishConditionKinds ?? []) {
        if (kind in ontologyConditionByKind)
          ontologyConditionByKind[kind] =
            (ontologyConditionByKind[kind] ?? 0) + 1;
      }
    }
    if (
      summary.winner === "corp" &&
      sequence.some(
        (entry) =>
          entry.corpPunishTaken === true &&
          isTerminalDamageOrEconomicPunish(entry.corpPunishKind),
      )
    )
      corpTagPunishFunnelFlatlineOrLock += 1;
  }

  return {
    runnerTaggedAtCorpDecision: runnerTaggedAtCorpDecisionActions,
    runnerTaggedAtCorpDecisionTurns: runnerTaggedAtCorpDecisionTurns.size,
    runnerTaggedAtCorpDecisionActions,
    runnerTagClearedBeforeCorpDecision,
    runnerTagClearedSameRunnerTurn,
    runnerTagWindowExpiredBeforeCorpTurn,
    runnerTaggedAfterTraceDuringRun,
    runnerTaggedAtEndOfRunnerTurn,
    runnerTaggedAtStartOfCorpTurn,
    corpTagCreatedDuringRunnerTurn,
    corpTagCreatedDuringCorpTurn,
    corpTagCreatedDuringEncounter,
    corpTagCreatedByTraceSuccess,
    corpTagCreatedByAccessOrSteal,
    corpTagCreatedByPersistentEffect,
    corpTagCreatedByScoredAgendaAction,
    corpTagCreatedByOperation,
    corpTagCreatedByAssetOrNode,
    corpTagCreatedByIce,
    runnerTaggedAtCorpDecisionWithFunnelPayoffKnown,
    runnerTaggedAtCorpDecisionWithoutPayoffKnown,
    runnerTagFromPreviousRunnerTurnStillVisibleAtCorpDecision,
    runnerTagFromEncounterStillVisibleAtCorpDecision,
    runnerTagClearedBeforeCorpDecisionAfterFunnelSource,
    runnerTagClearedSameRunnerTurnAfterSource,
    runnerTagWindowExpiredBeforeCorpDecision,
    corpVisibleTagPunishLegalActions,
    corpVisibleTagDamagePunishLegalActions,
    corpVisibleTagEconomicPunishLegalActions,
    corpVisibleTagTrashPunishLegalActions,
    corpVisibleTagRunLockPunishLegalActions,
    corpVisibleTagAmbushPunishLegalActions,
    corpVisibleTagPayoffLegalActionsByKind: Object.values(
      corpVisibleTagPayoffLegalActionsByKindCounts,
    ).reduce((sum, value) => sum + value, 0),
    corpVisibleTagPayoffLegalActionsByCard: Object.values(
      corpVisibleTagPayoffLegalActionsByCardCounts,
    ).reduce((sum, value) => sum + value, 0),
    corpVisibleTagPunishTaken,
    corpVisibleTagPunishSkipped,
    corpVisibleTagPunishSkippedForScore: visiblePunishSkippedByReason.score,
    corpVisibleTagPunishSkippedForAdvance: visiblePunishSkippedByReason.advance,
    corpVisibleTagPunishSkippedForEconomy: visiblePunishSkippedByReason.economy,
    corpVisibleTagPunishSkippedForRemoteProtection:
      visiblePunishSkippedByReason.remote_protection +
      visiblePunishSkippedByReason.remote_safety,
    corpVisibleTagPunishSkippedForCentralProtection:
      visiblePunishSkippedByReason.central_protection,
    corpVisibleTagPunishSkippedForDraw: visiblePunishSkippedByReason.draw,
    corpVisibleTagPunishSkippedForInstall: visiblePunishSkippedByReason.install,
    corpVisibleTagPunishSkippedForEndTurn:
      visiblePunishSkippedByReason.end_turn,
    corpVisibleTagPunishSkippedForUnknownHigherPriority:
      visiblePunishSkippedByReason.unknown_higher_priority +
      visiblePunishSkippedByReason.unknown,
    corpVisibleTagPunishSkippedUnknownChosenScore:
      unknownSkipChosenFamilyCounts.score,
    corpVisibleTagPunishSkippedUnknownChosenAdvance:
      unknownSkipChosenFamilyCounts.advance,
    corpVisibleTagPunishSkippedUnknownChosenInstallAgenda:
      unknownSkipChosenFamilyCounts.install_agenda,
    corpVisibleTagPunishSkippedUnknownChosenInstallIce:
      unknownSkipChosenFamilyCounts.install_ice,
    corpVisibleTagPunishSkippedUnknownChosenInstallAssetOrUpgrade:
      unknownSkipChosenFamilyCounts.install_asset_or_upgrade,
    corpVisibleTagPunishSkippedUnknownChosenRez:
      unknownSkipChosenFamilyCounts.rez,
    corpVisibleTagPunishSkippedUnknownChosenOperation:
      unknownSkipChosenFamilyCounts.operation,
    corpVisibleTagPunishSkippedUnknownChosenAbility:
      unknownSkipChosenFamilyCounts.ability,
    corpVisibleTagPunishSkippedUnknownChosenTraceTagSource:
      unknownSkipChosenFamilyCounts.trace_tag_source,
    corpVisibleTagPunishSkippedUnknownChosenDraw:
      unknownSkipChosenFamilyCounts.draw,
    corpVisibleTagPunishSkippedUnknownChosenBasicCredit:
      unknownSkipChosenFamilyCounts.basic_credit,
    corpVisibleTagPunishSkippedUnknownChosenEndTurn:
      unknownSkipChosenFamilyCounts.end_turn,
    corpVisibleTagPunishSkippedUnknownChosenUnknown:
      unknownSkipChosenFamilyCounts.unknown,
    corpVisibleTagPunishSkippedUnknownByReasonCode: Object.values(
      unknownSkipReasonCodeCounts,
    ).reduce((sum, value) => sum + value, 0),
    corpVisibleTagPunishSkippedUnknownByChosenActionType: Object.values(
      unknownSkipChosenActionTypeCounts,
    ).reduce((sum, value) => sum + value, 0),
    corpVisibleTagPunishSkippedUnknownByChosenCard: Object.values(
      unknownSkipChosenCardCounts,
    ).reduce((sum, value) => sum + value, 0),
    corpVisibleTagPunishSkippedUnknownByPayoffCard: Object.values(
      unknownSkipPayoffCardCounts,
    ).reduce((sum, value) => sum + value, 0),
    corpVisibleTagPunishSkippedUnknownByPayoffKind: Object.values(
      unknownSkipPayoffKindCounts,
    ).reduce((sum, value) => sum + value, 0),
    corpVisibleTagPunishUnknownSkipPlausible:
      unknownSkipPlausibilityCounts.plausible,
    corpVisibleTagPunishUnknownSkipSuspicious:
      unknownSkipPlausibilityCounts.suspicious,
    corpVisibleTagPunishUnknownSkipUnclassified:
      unknownSkipPlausibilityCounts.unclassified,
    corpVisibleTagPunishUnknownSkipByPlausibility:
      unknownSkipPlausibilityCounts.plausible +
      unknownSkipPlausibilityCounts.suspicious +
      unknownSkipPlausibilityCounts.unclassified,
    corpVisibleTagPunishUnknownSkipPayoffDamage,
    corpVisibleTagPunishUnknownSkipPayoffEconomic,
    corpVisibleTagPunishUnknownSkipPayoffTrash,
    corpVisibleTagPunishUnknownSkipPayoffRunLock,
    corpVisibleTagPunishUnknownSkipPayoffAmbush,
    corpVisibleTagPunishUnknownSkipPayoffLethalOrNearLethal,
    corpVisibleTagPunishUnknownSkipPayoffNonLethal,
    corpVisibleTagPunishFixGateEligibleWindow,
    corpVisibleTagPunishFixGateBlockedByScore,
    corpVisibleTagPunishFixGateBlockedByAdvanceScore,
    corpVisibleTagPunishFixGateBlockedBySafety,
    corpVisibleTagPunishFixGateBlockedByAffordability,
    corpVisibleTagPunishFixGateBlockedByLowImpact,
    corpVisibleTagPunishFixGateSuspiciousSkip,
    corpVisibleTagPunishDecisionWindows,
    corpVisibleTagPunishDecisionWindowsTaken,
    corpVisibleTagPunishDecisionWindowsSkipped,
    corpVisibleTagPunishDecisionWindowsWithMultiplePayoffs,
    corpVisibleTagPunishAlternativePayoffsNotChosen,
    corpVisibleTagPunishChosenPayoffAmongAlternatives,
    corpVisibleTagPunishUnknownSkipResolvedAsAlternativePayoff,
    corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization,
    corpVisibleTagPunishSkippedOnlyWhenNoPayoffChosen,
    corpVisibleTagPunishWindowHadTakenAndSkippedBeforeNormalization,
    corpVisibleTagPunishOperationChoiceAmongPayoffs,
    corpVisibleTagPunishChosenDamageOverEconomic,
    corpVisibleTagPunishChosenEconomicOverDamage,
    corpVisibleTagPunishChosenTrashOverDamage,
    corpVisibleTagPunishChosenLethalOverNonLethal,
    corpVisibleTagPunishChosenNonLethalOverLethal,
    corpVisibleTagPunishChosenLowerImpactOverHigherImpact,
    corpVisibleTagPunishChosenUnknownImpactOrdering,
    corpVisibleTagPunishFixGateEligibleWindowNormalized,
    corpVisibleTagPunishFixGateSuspiciousSkipNormalized,
    corpVisibleTagPunishFixGateResolvedByAlternativePayoffTaken,
    corpVisibleTagPunishPotentialPayoffOrderingIssue,
    corpVisibleTagPunishPotentialPayoffOrderingIssueLethalMissed,
    corpVisibleTagPunishPotentialPayoffOrderingIssueEconomicVsDamage,
    corpFunnelSourcePayoffPairSeenInDeck,
    corpFunnelSourceActionTakenWithPayoffInDeck,
    corpFunnelSourceActionTakenWithVisiblePayoff,
    corpFunnelSourceActionTakenWithoutVisiblePayoff,
    corpFunnelPairConvertedToTaggedDecisionWindow,
    corpFunnelPairConvertedToLegalPayoffWindow,
    corpFunnelPairConvertedToPayoffTaken,
    corpFunnelPairExpiredBeforePayoffWindow,
    runnerSurvivalCounterContextAvailable,
    runnerTraceDefenseVisibleAtTagSource,
    runnerDamagePreventionVisibleAtPayoffWindow,
    runnerFlatlinePreventionVisibleAtPayoffWindow,
    runnerLinkDefenseVisibleAtTrace,
    runnerSurvivalCounterContextSuppressedPunishValue,
    corpPunishOpportunities,
    corpPunishTaken,
    corpPunishSkipped,
    corpPunishTakeRate:
      corpPunishOpportunities > 0
        ? round(corpPunishTaken / corpPunishOpportunities)
        : 0,
    corpPunishOpportunityScorchedEarthLike: punishByKind.scorched_earth_like,
    corpPunishOpportunityUrbanRenewalLike: punishByKind.urban_renewal_like,
    corpPunishOpportunityPunitiveCounterstrikeLike:
      punishByKind.punitive_counterstrike_like,
    corpPunishOpportunityClosedAccountsLike: punishByKind.closed_accounts_like,
    corpPunishOpportunityPowerGridOverloadLike:
      punishByKind.power_grid_overload_like,
    corpPunishOpportunityDatapoolLike: punishByKind.datapool_like,
    corpPunishOpportunityResourceTrashLike: punishByKind.resource_trash_like,
    corpPunishOpportunityScoredAgendaDamageLike:
      punishByKind.scored_agenda_damage_like,
    corpPunishOpportunityScoredAgendaTraceTagLike:
      punishByKind.scored_agenda_trace_tag_like,
    corpPunishOpportunityUnknown: punishByKind.unknown,
    corpPunishSkippedForEconomy: punishSkippedByReason.economy,
    corpPunishSkippedForProtection:
      punishSkippedByReason.protection +
      punishSkippedByReason.remote_protection +
      punishSkippedByReason.central_protection,
    corpPunishSkippedForScore:
      punishSkippedByReason.score + punishSkippedByReason.advance,
    corpPunishSkippedForRemoteSafety:
      punishSkippedByReason.remote_safety +
      punishSkippedByReason.remote_protection,
    corpPunishSkippedForDraw: punishSkippedByReason.draw,
    corpPunishSkippedForEndTurn: punishSkippedByReason.end_turn,
    corpPunishSkippedForUnknown:
      punishSkippedByReason.unknown +
      punishSkippedByReason.unknown_higher_priority,
    corpPunishWindowExpiredBeforeAction,
    corpPunishWindowExpiredBeforeCorpTurn,
    corpTagSourceOpportunities,
    corpTagSourceTaken,
    corpTagSourceSkipped,
    corpTraceTagOpportunities,
    corpTraceTagTaken,
    corpTraceTagSkipped,
    corpTraceTagExpectedSuccess: round(corpTraceTagExpectedSuccess),
    corpTraceTagSkippedForEconomy: traceSkippedByReason.economy,
    corpTraceTagSkippedForProtection:
      traceSkippedByReason.protection +
      traceSkippedByReason.remote_protection +
      traceSkippedByReason.central_protection,
    corpTraceTagSkippedForScore:
      traceSkippedByReason.score + traceSkippedByReason.advance,
    corpTraceTagSkippedForRemoteSafety:
      traceSkippedByReason.remote_safety +
      traceSkippedByReason.remote_protection,
    corpTagSourceConvertedToRunnerTagged,
    corpTagSourceConvertedToPunishOpportunity,
    corpTagSourceConvertedToPunishTaken,
    corpTagPunishFunnelTagSourceOpportunity: corpTagSourceOpportunities,
    corpTagPunishFunnelTagSourceTaken: corpTagSourceTaken,
    corpTagPunishFunnelRunnerTagged: corpTagSourceConvertedToRunnerTagged,
    corpTagPunishFunnelRunnerTaggedAtCorpDecision:
      runnerTaggedAtCorpDecisionActions,
    corpTagPunishFunnelPunishOpportunity: corpPunishOpportunities,
    corpTagPunishFunnelPunishTaken: corpPunishTaken,
    corpTagPunishFunnelTerminalDamageOrEconomicHit,
    corpTagPunishFunnelFlatlineOrLock,
    corpTagPunishOntologyProfilesSeen,
    corpTagSourceOntologyProfilesSeen,
    corpTagPunishPayoffOntologyProfilesSeen,
    corpTagSourceOntologyUsed,
    corpTagPunishPayoffOntologyUsed,
    corpTagPunishOntologyFallbackUsed,
    corpTagPunishOntologyConflict,
    corpTagSourceLegalActionClassifiedByOntology,
    corpPunishLegalActionClassifiedByOntology,
    corpPunishOpportunityConfirmedByOntology,
    corpPunishSkippedDespiteOntologyOpportunity,
    corpTagSourceTakenWithOntologyPayoffAvailable,
    corpTagSourceTakenWithoutOntologyPayoff,
    corpTagSourceConvertedToOntologyPunishOpportunity,
    corpOntologyPunishOpportunityConverted,
    corpOntologyPunishOpportunityExpired,
    corpTagPunishOntologyByKind: Object.values(ontologyByKind).reduce(
      (sum, value) => sum + value,
      0,
    ),
    corpTagPunishOntologyKindTagSource: ontologyByKind.tag_source ?? 0,
    corpTagPunishOntologyKindTagPunishPayoff:
      ontologyByKind.tag_punish_payoff ?? 0,
    corpTagPunishOntologyKindTrace: ontologyByKind.trace ?? 0,
    corpTagPunishOntologyKindTag: ontologyByKind.tag ?? 0,
    corpTagPunishOntologyKindDamage: ontologyByKind.damage ?? 0,
    corpTagPunishOntologyKindResourceTrash: ontologyByKind.resource_trash ?? 0,
    corpTagPunishOntologyKindHardwareTrash: ontologyByKind.hardware_trash ?? 0,
    corpTagPunishOntologyKindScoredAgendaDamageLike:
      ontologyByKind.scored_agenda_damage_like ?? 0,
    corpTagPunishOntologyKindScoredAgendaTraceTagLike:
      ontologyByKind.scored_agenda_trace_tag_like ?? 0,
    corpTagPunishConditionByKind: Object.values(ontologyConditionByKind).reduce(
      (sum, value) => sum + value,
      0,
    ),
    corpTagPunishConditionRequiresRunnerTagged:
      ontologyConditionByKind.requires_runner_tagged ?? 0,
    corpTagPunishConditionRequiresTraceSuccess:
      ontologyConditionByKind.requires_trace_success ?? 0,
  };
}

function tagSourceConvertsToRunnerTagged(
  sequence: AiSimulationSummary["actionSequence"],
  index: number,
): boolean {
  return sequence
    .slice(index + 1, index + 8)
    .some(
      (entry) =>
        entry.runnerTagAddedByAction === true ||
        entry.runnerTaggedAtCorpDecision === true ||
        (entry.runnerTagsAfterAction ?? 0) >
          (entry.runnerTagsBeforeAction ?? 0),
    );
}

function tagSourceConvertsToPunishOpportunity(
  sequence: AiSimulationSummary["actionSequence"],
  index: number,
): boolean {
  return sequence
    .slice(index + 1, index + 12)
    .some(
      (entry) => entry.side === "corp" && entry.corpPunishOpportunity === true,
    );
}

function tagSourceConvertsToPunishTaken(
  sequence: AiSimulationSummary["actionSequence"],
  index: number,
): boolean {
  return sequence
    .slice(index + 1, index + 12)
    .some((entry) => entry.side === "corp" && entry.corpPunishTaken === true);
}

function isTerminalDamageOrEconomicPunish(kind: CorpPunishKind | undefined) {
  return (
    kind === "scorched_earth_like" ||
    kind === "urban_renewal_like" ||
    kind === "punitive_counterstrike_like" ||
    kind === "closed_accounts_like" ||
    kind === "power_grid_overload_like" ||
    kind === "scored_agenda_damage_like" ||
    kind === "resource_trash_like"
  );
}

function summarizeCorpIcePortfolioMetrics(
  summaries: AiSimulationSummary[],
): Pick<AiMatchProgressionMetrics, CorpIcePortfolioMetricKey> {
  const entries = summaries.flatMap((summary) => summary.actionSequence);
  const numericValues = (
    key: keyof AiSimulationSummary["actionSequence"][number],
  ): number[] =>
    entries
      .map((entry) => entry[key])
      .filter((value): value is number => typeof value === "number");
  const maxNumber = (
    key: keyof AiSimulationSummary["actionSequence"][number],
  ): number => {
    const values = numericValues(key);
    return values.length > 0 ? Math.max(...values) : 0;
  };
  const averageMetric = (
    key: keyof AiSimulationSummary["actionSequence"][number],
  ): number => averageNumber(numericValues(key));
  const count = (
    key: keyof AiSimulationSummary["actionSequence"][number],
  ): number => entries.filter((entry) => entry[key] === true).length;
  return {
    corpHqIceCount: maxNumber("corpHqIceCount"),
    corpRndIceCount: maxNumber("corpRndIceCount"),
    corpArchivesIceCount: maxNumber("corpArchivesIceCount"),
    corpRemoteIceCount: maxNumber("corpRemoteIceCount"),
    corpHqUnrezzedIceCount: maxNumber("corpHqUnrezzedIceCount"),
    corpRndUnrezzedIceCount: maxNumber("corpRndUnrezzedIceCount"),
    corpCentralIceCount: maxNumber("corpCentralIceCount"),
    corpCentralUnrezzedIceCount: maxNumber("corpCentralUnrezzedIceCount"),
    corpCentralIceInstalled: count("corpCentralIceInstalled"),
    corpHqIceInstalled: count("corpHqIceInstalled"),
    corpRndIceInstalled: count("corpRndIceInstalled"),
    corpArchivesIceInstalled: count("corpArchivesIceInstalled"),
    corpRemoteIceInstalled: count("corpRemoteIceInstalled"),
    corpHqOverIced: count("corpHqOverIced"),
    corpRndOverIced: count("corpRndOverIced"),
    corpCentralOverIced: count("corpCentralOverIced"),
    corpCentralOverIcedWithoutPressure: count(
      "corpCentralOverIcedWithoutPressure",
    ),
    corpCentralOverIcedWithLowRezReserve: count(
      "corpCentralOverIcedWithLowRezReserve",
    ),
    corpHqFifthIceInstalled: count("corpHqFifthIceInstalled"),
    corpCentralIceDiminishingReturnInstall: count(
      "corpCentralIceDiminishingReturnInstall",
    ),
    corpCentralIceInstallSuppressedByDiminishingReturns: count(
      "corpCentralIceInstallSuppressedByDiminishingReturns",
    ),
    corpCentralIceInstallPenalizedByDiminishingReturns: count(
      "corpCentralIceInstallPenalizedByDiminishingReturns",
    ),
    corpRezReserveCredits: averageMetric("corpRezReserveCredits"),
    corpRezReserveDeficit: maxNumber("corpRezReserveDeficit"),
    corpInstalledIceWithoutRezReserve: count(
      "corpInstalledIceWithoutRezReserve",
    ),
    corpInstalledCentralIceWithoutRezReserve: count(
      "corpInstalledCentralIceWithoutRezReserve",
    ),
    corpInstalledRemoteIceWithoutRezReserve: count(
      "corpInstalledRemoteIceWithoutRezReserve",
    ),
    corpCanRezAtLeastOneCentralIce: count("corpCanRezAtLeastOneCentralIce"),
    corpCanRezAtLeastOneRemoteIce: count("corpCanRezAtLeastOneRemoteIce"),
    corpCannotRezAnyNewlyInstalledIce: count(
      "corpCannotRezAnyNewlyInstalledIce",
    ),
    corpCreditsBelowCheapestRelevantRez: count(
      "corpCreditsBelowCheapestRelevantRez",
    ),
    corpCreditsBelowEstimatedCentralRezNeed: count(
      "corpCreditsBelowEstimatedCentralRezNeed",
    ),
    corpHqProtectionJustifiedByAgendaFlood: count(
      "corpHqProtectionJustifiedByAgendaFlood",
    ),
    corpHqProtectionJustifiedByRunnerPressure: count(
      "corpHqProtectionJustifiedByRunnerPressure",
    ),
    corpRndProtectionJustifiedByRunnerPressure: count(
      "corpRndProtectionJustifiedByRunnerPressure",
    ),
    corpCentralOverIceBlockedByRunnerPressure: count(
      "corpCentralOverIceBlockedByRunnerPressure",
    ),
    corpCentralOverIceBlockedByAgendaFlood: count(
      "corpCentralOverIceBlockedByAgendaFlood",
    ),
    corpCentralOverIceBlockedByNoRemotePlan: count(
      "corpCentralOverIceBlockedByNoRemotePlan",
    ),
    corpRemoteScoringUnderbuiltWhileCentralsOverIced: count(
      "corpRemoteScoringUnderbuiltWhileCentralsOverIced",
    ),
    corpReadyRemoteExists: count("corpReadyRemoteExists"),
    corpAgendaInHqWithReadyRemote: count("corpAgendaInHqWithReadyRemote"),
    corpAgendaInHqWithoutReadyRemote: count("corpAgendaInHqWithoutReadyRemote"),
    corpExtraCentralIceChosenOverReadyRemoteBuild: count(
      "corpExtraCentralIceChosenOverReadyRemoteBuild",
    ),
    corpExtraCentralIceChosenOverEconomy: count(
      "corpExtraCentralIceChosenOverEconomy",
    ),
    corpExtraCentralIceChosenOverRezReserve: count(
      "corpExtraCentralIceChosenOverRezReserve",
    ),
    corpExtraCentralIceChosenOverAgendaInstall: count(
      "corpExtraCentralIceChosenOverAgendaInstall",
    ),
    corpExtraCentralIceChosenOverAdvanceOrScore: count(
      "corpExtraCentralIceChosenOverAdvanceOrScore",
    ),
    corpIcePortfolioFixGateEligible: count("corpIcePortfolioFixGateEligible"),
    corpIcePortfolioFixGateSuspiciousCentralOverIce: count(
      "corpIcePortfolioFixGateSuspiciousCentralOverIce",
    ),
    corpIcePortfolioFixGateBlockedByAgendaFlood: count(
      "corpIcePortfolioFixGateBlockedByAgendaFlood",
    ),
    corpIcePortfolioFixGateBlockedByRunnerCentralPressure: count(
      "corpIcePortfolioFixGateBlockedByRunnerCentralPressure",
    ),
    corpIcePortfolioFixGateBlockedByNoRemotePlan: count(
      "corpIcePortfolioFixGateBlockedByNoRemotePlan",
    ),
    corpIcePortfolioFixGateBlockedByEmergencyProtection: count(
      "corpIcePortfolioFixGateBlockedByEmergencyProtection",
    ),
  };
}

function summarizeCorpUnsafeRemoteScoreConversionMetrics(
  summaries: AiSimulationSummary[],
): Pick<
  AiMatchProgressionMetrics,
  | "corpUnsafeScoringRemoteDetected"
  | "corpUnsafeScoringRemoteAlternativeChosen"
  | "corpUnsafeScoringRemoteStalled"
  | "corpUnsafeRemoteConvertedToProtection"
  | "corpUnsafeRemoteConvertedToBetterRemote"
  | "corpUnsafeRemoteConvertedToFastAdvance"
  | "corpUnsafeRemoteConvertedToHqProtection"
  | "corpUnsafeRemoteConvertedToEconomy"
  | "corpUnsafeRemoteConvertedToNoScorePath"
  | "corpBetterRemoteAvailable"
  | "corpBestRemoteSelectedForAgenda"
  | "corpScoringRemoteSafetyDeltaAfterProtection"
  | "corpProtectionConvertedToScoreWithin3"
  | "corpProtectionRepeatedWithoutScoreConversion"
  | "corpProtectionImprovedRemoteSafety"
  | "corpProtectionNoSafetyDelta"
  | "corpProtectionOpenedScorePath"
  | "corpProtectionFollowedByAgendaInstall"
  | "corpProtectionFollowedByAdvance"
  | "corpProtectionFollowedByScore"
  | "corpProtectionFollowedByMoreProtection"
  | "corpProtectionFollowedByEconomy"
  | "corpProtectionFollowedByCentralProtection"
  | "corpProtectionLoopAfterRemoteSafe"
  | "corpRemoteSafeButNoScoreActionTaken"
  | "corpRemoteSafeButAgendaHeld"
  | "corpRemoteSafeButAdvancedTooLate"
  | "corpRemoteSafetyDelta"
  | "corpRemoteSafetyDeltaAfterProtection"
  | "corpRemoteSafetyReadyForAgenda"
  | "corpScorePathChosenAfterProtection"
  | "corpScorePathSkippedAfterProtection"
  | "corpAdvanceBurstOpportunity"
  | "corpAdvanceBurstTaken"
  | "corpScorePathAvailableButNotTaken"
  | "corpScorePathBlockedByEffectiveRemoteSafety"
  | "corpAgendaHeldDueToUnsafeRemote"
  | "corpAgendaHeldTooLongWithHqPressure"
  | "corpAgendaInstalledInProtectedRemote"
  | "corpAgendaAdvancedInProtectedRemote"
  | "corpAgendaNearScoreWindow"
  | "corpScoreWindowCompressionOpportunity"
  | "corpScoreWindowCompressionTaken"
  | "corpScoreWindowCompressionRate"
  | "corpScoreWindowCompressionSkipped"
  | "corpNonEssentialActionBeforeScoreWindow"
  | "corpEconomyBeforeScoreWindow"
  | "corpEconomyBeforeScoreWindowNecessary"
  | "corpProtectionBeforeScoreWindow"
  | "corpProtectionBeforeScoreWindowNoSafetyDelta"
  | "corpCentralProtectionBeforeScoreWindow"
  | "corpCentralProtectionBeforeScoreWindowNecessary"
  | "corpDrawBeforeScoreWindow"
  | "corpEndTurnBeforeScoreWindow"
  | "corpSameTurnScoreOpportunity"
  | "corpSameTurnScoreTaken"
  | "corpScoreWindowLostAfterNonEssentialAction"
  | "corpRunnerStealAfterDelayedScoreWindow"
  | "corpAdvanceToScoreLineCompressedWithin2"
  | "corpAdvanceToScoreLineCompressedWithin3"
  | "scoredAgendaActionOpportunities"
  | "scoredAgendaActionTaken"
  | "scoredAgendaActionTakeRate"
  | "scoredAgendaEconomyOpportunities"
  | "scoredAgendaEconomyTaken"
  | "scoredAgendaEconomySkippedForBasicCredit"
  | "politicalOverthrowOpportunities"
  | "politicalOverthrowTaken"
  | "politicalOverthrowSkippedForBasicCredit"
  | "scoredAgendaCounterEconomyOpportunities"
  | "scoredAgendaCounterEconomyTaken"
  | "scoredAgendaDrawOpportunities"
  | "scoredAgendaDrawTaken"
  | "scoredAgendaExtraActionOpportunities"
  | "scoredAgendaExtraActionTaken"
  | "scoredAgendaTraceTagOpportunities"
  | "scoredAgendaTraceTagTaken"
  | "scoredAgendaDamagePunishOpportunities"
  | "scoredAgendaDamagePunishTaken"
  | "scoredAgendaActionValueOverBasic"
  | "basicCreditTakenWhileBetterAgendaEconomyAvailable"
  | "basicDrawTakenWhileBetterAgendaDrawAvailable"
  | "corpNewRemoteCreated"
  | "corpNewRemoteCreatedWithPlan"
  | "corpNewRemoteCreatedWithoutPayloadPlan"
  | "corpEmptyRemoteWithIceCreated"
  | "corpEmptyRemoteStayedUnusedTurns"
  | "corpRemoteConvertedToAgendaAssetOrBait"
  | "corpRemoteConversionRate"
  | "corpIceInstalledOnNewRemoteInsteadOfExistingScoringRemote"
  | "corpExistingRemoteCouldBeStrengthened"
  | "corpRemotePortfolioOverExpanded"
  | "corpOneIceRemoteCheaplyContestable"
  | "corpRemoteIceConsolidationOpportunity"
  | "corpRemoteIceConsolidationTaken"
  | "corpRemoteCreatedThenNoScorePath"
  | "corpRemoteCreatedThenAgendaInstalledWithin3"
  | "corpRemoteCreatedThenAssetInstalledWithin3"
  | "corpRemoteCreatedThenBaitOrAmbushWithin3"
  | "corpHqCardCount"
  | "corpHqKnownAgendaCount"
  | "corpHqAgendaDensity"
  | "corpHqAgendaFloodRisk"
  | "runnerHqAccessThreat"
  | "runnerHqKnownAgendaThreat"
  | "runnerHqMultiaccessThreat"
  | "corpDrawWouldLikelyDiluteHq"
  | "corpDrawWouldRiskAgendaFlood"
  | "corpDrawChosenToDiluteAgendaFlood"
  | "corpDrawSkippedBecauseAgendaFloodRisk"
  | "corpAgendaRemovedFromHqToRemoteOrScore"
  | "corpHqProtectionChosenOverDilution"
  | "corpHqDilutionChosenBecauseNoSafeRemote"
  | "corpHqDilutionBackfiredAgendaDrawn"
  | "corpHqDensityReducedAfterDraw"
  | "corpHqDensityIncreasedAfterDraw"
> {
  let corpUnsafeScoringRemoteDetected = 0;
  let corpUnsafeScoringRemoteAlternativeChosen = 0;
  let corpUnsafeScoringRemoteStalled = 0;
  let corpUnsafeRemoteConvertedToProtection = 0;
  let corpUnsafeRemoteConvertedToBetterRemote = 0;
  let corpUnsafeRemoteConvertedToFastAdvance = 0;
  let corpUnsafeRemoteConvertedToHqProtection = 0;
  let corpUnsafeRemoteConvertedToEconomy = 0;
  let corpUnsafeRemoteConvertedToNoScorePath = 0;
  let corpBetterRemoteAvailable = 0;
  let corpBestRemoteSelectedForAgenda = 0;
  let corpProtectionConvertedToScoreWithin3 = 0;
  let corpProtectionRepeatedWithoutScoreConversion = 0;
  let corpProtectionImprovedRemoteSafety = 0;
  let corpProtectionNoSafetyDelta = 0;
  let corpProtectionOpenedScorePath = 0;
  let corpProtectionFollowedByAgendaInstall = 0;
  let corpProtectionFollowedByAdvance = 0;
  let corpProtectionFollowedByScore = 0;
  let corpProtectionFollowedByMoreProtection = 0;
  let corpProtectionFollowedByEconomy = 0;
  let corpProtectionFollowedByCentralProtection = 0;
  let corpProtectionLoopAfterRemoteSafe = 0;
  let corpRemoteSafeButNoScoreActionTaken = 0;
  let corpRemoteSafeButAgendaHeld = 0;
  let corpRemoteSafeButAdvancedTooLate = 0;
  let corpRemoteSafetyReadyForAgenda = 0;
  let corpScorePathChosenAfterProtection = 0;
  let corpScorePathSkippedAfterProtection = 0;
  let corpAdvanceBurstOpportunity = 0;
  let corpAdvanceBurstTaken = 0;
  let corpScorePathAvailableButNotTaken = 0;
  let corpScorePathBlockedByEffectiveRemoteSafety = 0;
  let corpAgendaHeldDueToUnsafeRemote = 0;
  let corpAgendaHeldTooLongWithHqPressure = 0;
  let corpAgendaInstalledInProtectedRemote = 0;
  let corpAgendaAdvancedInProtectedRemote = 0;
  let corpAgendaNearScoreWindow = 0;
  let corpScoreWindowCompressionOpportunity = 0;
  let corpScoreWindowCompressionTaken = 0;
  let corpScoreWindowCompressionSkipped = 0;
  let corpNonEssentialActionBeforeScoreWindow = 0;
  let corpEconomyBeforeScoreWindow = 0;
  let corpEconomyBeforeScoreWindowNecessary = 0;
  let corpProtectionBeforeScoreWindow = 0;
  let corpProtectionBeforeScoreWindowNoSafetyDelta = 0;
  let corpCentralProtectionBeforeScoreWindow = 0;
  let corpCentralProtectionBeforeScoreWindowNecessary = 0;
  let corpDrawBeforeScoreWindow = 0;
  let corpEndTurnBeforeScoreWindow = 0;
  let corpSameTurnScoreOpportunity = 0;
  let corpSameTurnScoreTaken = 0;
  let corpScoreWindowLostAfterNonEssentialAction = 0;
  let corpRunnerStealAfterDelayedScoreWindow = 0;
  let corpAdvanceToScoreLineCompressedWithin2 = 0;
  let corpAdvanceToScoreLineCompressedWithin3 = 0;
  let scoredAgendaActionOpportunities = 0;
  let scoredAgendaActionTaken = 0;
  let scoredAgendaEconomyOpportunities = 0;
  let scoredAgendaEconomyTaken = 0;
  let scoredAgendaEconomySkippedForBasicCredit = 0;
  let politicalOverthrowOpportunities = 0;
  let politicalOverthrowTaken = 0;
  let politicalOverthrowSkippedForBasicCredit = 0;
  let scoredAgendaCounterEconomyOpportunities = 0;
  let scoredAgendaCounterEconomyTaken = 0;
  let scoredAgendaDrawOpportunities = 0;
  let scoredAgendaDrawTaken = 0;
  let scoredAgendaExtraActionOpportunities = 0;
  let scoredAgendaExtraActionTaken = 0;
  let scoredAgendaTraceTagOpportunities = 0;
  let scoredAgendaTraceTagTaken = 0;
  let scoredAgendaDamagePunishOpportunities = 0;
  let scoredAgendaDamagePunishTaken = 0;
  let scoredAgendaActionValueOverBasic = 0;
  let basicCreditTakenWhileBetterAgendaEconomyAvailable = 0;
  let basicDrawTakenWhileBetterAgendaDrawAvailable = 0;
  let corpNewRemoteCreated = 0;
  let corpNewRemoteCreatedWithPlan = 0;
  let corpNewRemoteCreatedWithoutPayloadPlan = 0;
  let corpEmptyRemoteWithIceCreated = 0;
  let corpEmptyRemoteStayedUnusedTurns = 0;
  let corpRemoteConvertedToAgendaAssetOrBait = 0;
  let corpIceInstalledOnNewRemoteInsteadOfExistingScoringRemote = 0;
  let corpExistingRemoteCouldBeStrengthened = 0;
  let corpRemotePortfolioOverExpanded = 0;
  let corpOneIceRemoteCheaplyContestable = 0;
  let corpRemoteIceConsolidationOpportunity = 0;
  let corpRemoteIceConsolidationTaken = 0;
  let corpRemoteCreatedThenNoScorePath = 0;
  let corpRemoteCreatedThenAgendaInstalledWithin3 = 0;
  let corpRemoteCreatedThenAssetInstalledWithin3 = 0;
  let corpRemoteCreatedThenBaitOrAmbushWithin3 = 0;
  let corpHqAgendaFloodRisk = 0;
  let runnerHqAccessThreat = 0;
  let runnerHqKnownAgendaThreat = 0;
  let runnerHqMultiaccessThreat = 0;
  let corpDrawWouldLikelyDiluteHq = 0;
  let corpDrawWouldRiskAgendaFlood = 0;
  let corpDrawChosenToDiluteAgendaFlood = 0;
  let corpDrawSkippedBecauseAgendaFloodRisk = 0;
  let corpAgendaRemovedFromHqToRemoteOrScore = 0;
  let corpHqProtectionChosenOverDilution = 0;
  let corpHqDilutionChosenBecauseNoSafeRemote = 0;
  let corpHqDilutionBackfiredAgendaDrawn = 0;
  let corpHqDensityReducedAfterDraw = 0;
  let corpHqDensityIncreasedAfterDraw = 0;
  const protectionSafetyDeltas: number[] = [];
  const remoteSafetyDeltas: number[] = [];
  const remoteSafetyDeltasAfterProtection: number[] = [];
  const hqCardCounts: number[] = [];
  const hqKnownAgendaCounts: number[] = [];
  const hqAgendaDensities: number[] = [];

  for (const summary of summaries) {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    const repeatedProtectionIndexes = new Set<number>();
    for (let index = 0; index < sequence.length; index += 1) {
      const entry = sequence[index]!;
      if (entry.side !== "corp") continue;
      const detected = hasEvidenceFlag(
        entry,
        "corp_unsafe_scoring_remote_detected:true",
      );
      if (detected) corpUnsafeScoringRemoteDetected += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_unsafe_scoring_remote_alternative_chosen:true",
        )
      )
        corpUnsafeScoringRemoteAlternativeChosen += 1;
      if (hasEvidenceFlag(entry, "corp_unsafe_scoring_remote_stalled:true"))
        corpUnsafeScoringRemoteStalled += 1;
      const protection = hasEvidenceFlag(
        entry,
        "corp_unsafe_remote_converted_to_protection:true",
      );
      if (protection) corpUnsafeRemoteConvertedToProtection += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_unsafe_remote_converted_to_better_remote:true",
        )
      )
        corpUnsafeRemoteConvertedToBetterRemote += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_unsafe_remote_converted_to_fast_advance:true",
        )
      )
        corpUnsafeRemoteConvertedToFastAdvance += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_unsafe_remote_converted_to_hq_protection:true",
        )
      )
        corpUnsafeRemoteConvertedToHqProtection += 1;
      if (
        hasEvidenceFlag(entry, "corp_unsafe_remote_converted_to_economy:true")
      )
        corpUnsafeRemoteConvertedToEconomy += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_unsafe_remote_converted_to_no_score_path:true",
        )
      )
        corpUnsafeRemoteConvertedToNoScorePath += 1;
      if (hasEvidenceFlag(entry, "corp_better_remote_available:true"))
        corpBetterRemoteAvailable += 1;
      if (hasEvidenceFlag(entry, "corp_best_remote_selected_for_agenda:true"))
        corpBestRemoteSelectedForAgenda += 1;
      if (hasEvidenceFlag(entry, "corp_protection_no_safety_delta:true"))
        corpProtectionNoSafetyDelta += 1;
      const scorePathFollowsRecentProtection = scorePathFollowsCorpProtection(
        sequence,
        index,
      );
      if (
        hasEvidenceFlag(entry, "corp_protection_opened_score_path:true") &&
        scorePathFollowsRecentProtection
      )
        corpProtectionOpenedScorePath += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_protection_followed_by_agenda_install:true",
        )
      )
        corpProtectionFollowedByAgendaInstall += 1;
      if (hasEvidenceFlag(entry, "corp_protection_followed_by_advance:true"))
        corpProtectionFollowedByAdvance += 1;
      if (hasEvidenceFlag(entry, "corp_protection_followed_by_score:true"))
        corpProtectionFollowedByScore += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_protection_followed_by_more_protection:true",
        )
      )
        corpProtectionFollowedByMoreProtection += 1;
      if (hasEvidenceFlag(entry, "corp_protection_followed_by_economy:true"))
        corpProtectionFollowedByEconomy += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_protection_followed_by_central_protection:true",
        )
      )
        corpProtectionFollowedByCentralProtection += 1;
      if (hasEvidenceFlag(entry, "corp_protection_loop_after_remote_safe:true"))
        corpProtectionLoopAfterRemoteSafe += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_remote_safe_but_no_score_action_taken:true",
        )
      )
        corpRemoteSafeButNoScoreActionTaken += 1;
      if (hasEvidenceFlag(entry, "corp_remote_safe_but_agenda_held:true"))
        corpRemoteSafeButAgendaHeld += 1;
      if (hasEvidenceFlag(entry, "corp_remote_safe_but_advanced_too_late:true"))
        corpRemoteSafeButAdvancedTooLate += 1;
      if (hasEvidenceFlag(entry, "corp_remote_safety_ready_for_agenda:true"))
        corpRemoteSafetyReadyForAgenda += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_score_path_chosen_after_protection:true",
        ) &&
        scorePathFollowsRecentProtection
      )
        corpScorePathChosenAfterProtection += 1;
      if (
        hasEvidenceFlag(entry, "corp_score_path_skipped_after_protection:true")
      )
        corpScorePathSkippedAfterProtection += 1;
      if (hasEvidenceFlag(entry, "corp_advance_burst_opportunity:true"))
        corpAdvanceBurstOpportunity += 1;
      if (hasEvidenceFlag(entry, "corp_advance_burst_taken:true"))
        corpAdvanceBurstTaken += 1;
      if (
        hasEvidenceFlag(entry, "corp_score_path_available_but_not_taken:true")
      )
        corpScorePathAvailableButNotTaken += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_score_path_blocked_by_effective_remote_safety:true",
        )
      )
        corpScorePathBlockedByEffectiveRemoteSafety += 1;
      if (hasEvidenceFlag(entry, "corp_agenda_held_due_to_unsafe_remote:true"))
        corpAgendaHeldDueToUnsafeRemote += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_agenda_held_too_long_with_hq_pressure:true",
        )
      )
        corpAgendaHeldTooLongWithHqPressure += 1;
      if (
        hasEvidenceFlag(entry, "corp_agenda_installed_in_protected_remote:true")
      )
        corpAgendaInstalledInProtectedRemote += 1;
      if (
        hasEvidenceFlag(entry, "corp_agenda_advanced_in_protected_remote:true")
      )
        corpAgendaAdvancedInProtectedRemote += 1;
      if (hasEvidenceFlag(entry, "corp_agenda_near_score_window:true"))
        corpAgendaNearScoreWindow += 1;
      const compressionOpportunity = hasEvidenceFlag(
        entry,
        "corp_score_window_compression_opportunity:true",
      );
      if (compressionOpportunity) corpScoreWindowCompressionOpportunity += 1;
      if (hasEvidenceFlag(entry, "corp_score_window_compression_taken:true")) {
        corpScoreWindowCompressionTaken += 1;
        if (corpCompressionActionLeadsToScoreLine(sequence, index, 2))
          corpAdvanceToScoreLineCompressedWithin2 += 1;
        if (corpCompressionActionLeadsToScoreLine(sequence, index, 3))
          corpAdvanceToScoreLineCompressedWithin3 += 1;
      }
      if (hasEvidenceFlag(entry, "corp_score_window_compression_skipped:true"))
        corpScoreWindowCompressionSkipped += 1;
      const nonEssentialBeforeScoreWindow = hasEvidenceFlag(
        entry,
        "corp_non_essential_action_before_score_window:true",
      );
      if (nonEssentialBeforeScoreWindow) {
        corpNonEssentialActionBeforeScoreWindow += 1;
        if (runnerStealsBeforeNextCorpScore(sequence, index)) {
          corpScoreWindowLostAfterNonEssentialAction += 1;
          corpRunnerStealAfterDelayedScoreWindow += 1;
        }
      }
      if (hasEvidenceFlag(entry, "corp_economy_before_score_window:true"))
        corpEconomyBeforeScoreWindow += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_economy_before_score_window_necessary:true",
        )
      )
        corpEconomyBeforeScoreWindowNecessary += 1;
      if (hasEvidenceFlag(entry, "corp_protection_before_score_window:true"))
        corpProtectionBeforeScoreWindow += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_protection_before_score_window_no_safety_delta:true",
        )
      )
        corpProtectionBeforeScoreWindowNoSafetyDelta += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_central_protection_before_score_window:true",
        )
      )
        corpCentralProtectionBeforeScoreWindow += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_central_protection_before_score_window_necessary:true",
        )
      )
        corpCentralProtectionBeforeScoreWindowNecessary += 1;
      if (hasEvidenceFlag(entry, "corp_draw_before_score_window:true"))
        corpDrawBeforeScoreWindow += 1;
      if (hasEvidenceFlag(entry, "corp_end_turn_before_score_window:true"))
        corpEndTurnBeforeScoreWindow += 1;
      if (hasEvidenceFlag(entry, "corp_same_turn_score_opportunity:true"))
        corpSameTurnScoreOpportunity += 1;
      if (hasEvidenceFlag(entry, "corp_same_turn_score_taken:true"))
        corpSameTurnScoreTaken += 1;
      if (hasEvidenceFlag(entry, "scored_agenda_action_opportunity:true"))
        scoredAgendaActionOpportunities += 1;
      if (hasEvidenceFlag(entry, "scored_agenda_action_taken:true"))
        scoredAgendaActionTaken += 1;
      if (hasEvidenceFlag(entry, "scored_agenda_economy_opportunity:true"))
        scoredAgendaEconomyOpportunities += 1;
      if (hasEvidenceFlag(entry, "scored_agenda_economy_taken:true"))
        scoredAgendaEconomyTaken += 1;
      if (
        hasEvidenceFlag(
          entry,
          "scored_agenda_economy_skipped_for_basic_credit:true",
        )
      )
        scoredAgendaEconomySkippedForBasicCredit += 1;
      if (hasEvidenceFlag(entry, "political_overthrow_opportunity:true"))
        politicalOverthrowOpportunities += 1;
      if (hasEvidenceFlag(entry, "political_overthrow_taken:true"))
        politicalOverthrowTaken += 1;
      if (
        hasEvidenceFlag(
          entry,
          "political_overthrow_skipped_for_basic_credit:true",
        )
      )
        politicalOverthrowSkippedForBasicCredit += 1;
      if (
        hasEvidenceFlag(entry, "scored_agenda_counter_economy_opportunity:true")
      )
        scoredAgendaCounterEconomyOpportunities += 1;
      if (hasEvidenceFlag(entry, "scored_agenda_counter_economy_taken:true"))
        scoredAgendaCounterEconomyTaken += 1;
      if (hasEvidenceFlag(entry, "scored_agenda_draw_opportunity:true"))
        scoredAgendaDrawOpportunities += 1;
      if (hasEvidenceFlag(entry, "scored_agenda_draw_taken:true"))
        scoredAgendaDrawTaken += 1;
      if (hasEvidenceFlag(entry, "scored_agenda_extra_action_opportunity:true"))
        scoredAgendaExtraActionOpportunities += 1;
      if (hasEvidenceFlag(entry, "scored_agenda_extra_action_taken:true"))
        scoredAgendaExtraActionTaken += 1;
      if (hasEvidenceFlag(entry, "scored_agenda_trace_tag_opportunity:true"))
        scoredAgendaTraceTagOpportunities += 1;
      if (hasEvidenceFlag(entry, "scored_agenda_trace_tag_taken:true"))
        scoredAgendaTraceTagTaken += 1;
      if (
        hasEvidenceFlag(entry, "scored_agenda_damage_punish_opportunity:true")
      )
        scoredAgendaDamagePunishOpportunities += 1;
      if (hasEvidenceFlag(entry, "scored_agenda_damage_punish_taken:true"))
        scoredAgendaDamagePunishTaken += 1;
      scoredAgendaActionValueOverBasic += Math.max(
        0,
        Number(
          evidenceValue(entry, "scored_agenda_action_value_over_basic:") ?? 0,
        ),
      );
      if (
        hasEvidenceFlag(
          entry,
          "basic_credit_taken_while_better_agenda_economy_available:true",
        )
      )
        basicCreditTakenWhileBetterAgendaEconomyAvailable += 1;
      if (
        hasEvidenceFlag(
          entry,
          "basic_draw_taken_while_better_agenda_draw_available:true",
        )
      )
        basicDrawTakenWhileBetterAgendaDrawAvailable += 1;
      if (hasEvidenceFlag(entry, "corp_new_remote_created:true"))
        corpNewRemoteCreated += 1;
      if (hasEvidenceFlag(entry, "corp_new_remote_created_with_plan:true"))
        corpNewRemoteCreatedWithPlan += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_new_remote_created_without_payload_plan:true",
        )
      )
        corpNewRemoteCreatedWithoutPayloadPlan += 1;
      if (hasEvidenceFlag(entry, "corp_empty_remote_with_ice_created:true"))
        corpEmptyRemoteWithIceCreated += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_ice_installed_on_new_remote_instead_of_existing_scoring_remote:true",
        )
      )
        corpIceInstalledOnNewRemoteInsteadOfExistingScoringRemote += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_existing_remote_could_be_strengthened:true",
        )
      )
        corpExistingRemoteCouldBeStrengthened += 1;
      if (hasEvidenceFlag(entry, "corp_remote_portfolio_overexpanded:true"))
        corpRemotePortfolioOverExpanded += 1;
      if (
        hasEvidenceFlag(entry, "corp_one_ice_remote_cheaply_contestable:true")
      )
        corpOneIceRemoteCheaplyContestable += 1;
      if (
        hasEvidenceFlag(entry, "corp_remote_ice_consolidation_opportunity:true")
      )
        corpRemoteIceConsolidationOpportunity += 1;
      if (hasEvidenceFlag(entry, "corp_remote_ice_consolidation_taken:true"))
        corpRemoteIceConsolidationTaken += 1;
      if (
        hasEvidenceFlag(entry, "corp_new_remote_created:true") &&
        !corpRemoteCreatedConverts(sequence, index, 3)
      ) {
        corpEmptyRemoteStayedUnusedTurns += 1;
        corpRemoteCreatedThenNoScorePath += 1;
      }
      if (
        hasEvidenceFlag(entry, "corp_new_remote_created:true") &&
        corpRemoteCreatedConvertsTo(sequence, index, 3, "agenda")
      )
        corpRemoteCreatedThenAgendaInstalledWithin3 += 1;
      if (
        hasEvidenceFlag(entry, "corp_new_remote_created:true") &&
        corpRemoteCreatedConvertsTo(sequence, index, 3, "asset")
      )
        corpRemoteCreatedThenAssetInstalledWithin3 += 1;
      if (
        hasEvidenceFlag(entry, "corp_new_remote_created:true") &&
        corpRemoteCreatedConvertsTo(sequence, index, 3, "bait")
      )
        corpRemoteCreatedThenBaitOrAmbushWithin3 += 1;
      if (hasEvidenceFlag(entry, "corp_hq_agenda_flood_risk:true"))
        corpHqAgendaFloodRisk += 1;
      if (hasEvidenceFlag(entry, "runner_hq_access_threat:true"))
        runnerHqAccessThreat += 1;
      if (hasEvidenceFlag(entry, "runner_hq_known_agenda_threat:true"))
        runnerHqKnownAgendaThreat += 1;
      if (hasEvidenceFlag(entry, "runner_hq_multiaccess_threat:true"))
        runnerHqMultiaccessThreat += 1;
      if (hasEvidenceFlag(entry, "corp_draw_would_likely_dilute_hq:true"))
        corpDrawWouldLikelyDiluteHq += 1;
      if (hasEvidenceFlag(entry, "corp_draw_would_risk_agenda_flood:true"))
        corpDrawWouldRiskAgendaFlood += 1;
      if (
        hasEvidenceFlag(entry, "corp_draw_chosen_to_dilute_agenda_flood:true")
      )
        corpDrawChosenToDiluteAgendaFlood += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_draw_skipped_because_agenda_flood_risk:true",
        )
      )
        corpDrawSkippedBecauseAgendaFloodRisk += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_agenda_removed_from_hq_to_remote_or_score:true",
        )
      )
        corpAgendaRemovedFromHqToRemoteOrScore += 1;
      if (
        hasEvidenceFlag(entry, "corp_hq_protection_chosen_over_dilution:true")
      )
        corpHqProtectionChosenOverDilution += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_hq_dilution_chosen_because_no_safe_remote:true",
        )
      )
        corpHqDilutionChosenBecauseNoSafeRemote += 1;
      const hqCardCount = Number(evidenceValue(entry, "corp_hq_card_count:"));
      if (Number.isFinite(hqCardCount)) hqCardCounts.push(hqCardCount);
      const hqAgendaCount = Number(
        evidenceValue(entry, "corp_hq_known_agenda_count:"),
      );
      if (Number.isFinite(hqAgendaCount))
        hqKnownAgendaCounts.push(hqAgendaCount);
      const hqDensity = Number(evidenceValue(entry, "corp_hq_agenda_density:"));
      if (Number.isFinite(hqDensity)) hqAgendaDensities.push(hqDensity);

      const delta = Number(
        evidenceValue(
          entry,
          "corp_scoring_remote_safety_delta_after_protection:",
        ),
      );
      if (Number.isFinite(delta)) protectionSafetyDeltas.push(delta);
      if (Number.isFinite(delta)) {
        remoteSafetyDeltas.push(delta);
        remoteSafetyDeltasAfterProtection.push(delta);
        if (delta > 0) corpProtectionImprovedRemoteSafety += 1;
      }

      if (protection) {
        if (
          ownStrategicWindow(sequence, index, 3).some(
            (candidate) =>
              candidate.side === "corp" &&
              isCorpProtectionScoreConversionAction(candidate),
          )
        )
          corpProtectionConvertedToScoreWithin3 += 1;
        else repeatedProtectionIndexes.add(index);
      }
      if (
        hasEvidenceFlag(
          entry,
          "corp_protection_repeated_without_score_conversion:true",
        )
      )
        repeatedProtectionIndexes.add(index);
    }
    corpProtectionRepeatedWithoutScoreConversion +=
      repeatedProtectionIndexes.size;
  }

  return {
    corpUnsafeScoringRemoteDetected,
    corpUnsafeScoringRemoteAlternativeChosen,
    corpUnsafeScoringRemoteStalled,
    corpUnsafeRemoteConvertedToProtection,
    corpUnsafeRemoteConvertedToBetterRemote,
    corpUnsafeRemoteConvertedToFastAdvance,
    corpUnsafeRemoteConvertedToHqProtection,
    corpUnsafeRemoteConvertedToEconomy,
    corpUnsafeRemoteConvertedToNoScorePath,
    corpBetterRemoteAvailable,
    corpBestRemoteSelectedForAgenda,
    corpScoringRemoteSafetyDeltaAfterProtection: averageNumber(
      protectionSafetyDeltas,
    ),
    corpProtectionConvertedToScoreWithin3,
    corpProtectionRepeatedWithoutScoreConversion,
    corpProtectionImprovedRemoteSafety,
    corpProtectionNoSafetyDelta,
    corpProtectionOpenedScorePath,
    corpProtectionFollowedByAgendaInstall,
    corpProtectionFollowedByAdvance,
    corpProtectionFollowedByScore,
    corpProtectionFollowedByMoreProtection,
    corpProtectionFollowedByEconomy,
    corpProtectionFollowedByCentralProtection,
    corpProtectionLoopAfterRemoteSafe,
    corpRemoteSafeButNoScoreActionTaken,
    corpRemoteSafeButAgendaHeld,
    corpRemoteSafeButAdvancedTooLate,
    corpRemoteSafetyDelta: averageNumber(remoteSafetyDeltas),
    corpRemoteSafetyDeltaAfterProtection: averageNumber(
      remoteSafetyDeltasAfterProtection,
    ),
    corpRemoteSafetyReadyForAgenda,
    corpScorePathChosenAfterProtection,
    corpScorePathSkippedAfterProtection,
    corpAdvanceBurstOpportunity,
    corpAdvanceBurstTaken,
    corpScorePathAvailableButNotTaken,
    corpScorePathBlockedByEffectiveRemoteSafety,
    corpAgendaHeldDueToUnsafeRemote,
    corpAgendaHeldTooLongWithHqPressure,
    corpAgendaInstalledInProtectedRemote,
    corpAgendaAdvancedInProtectedRemote,
    corpAgendaNearScoreWindow,
    corpScoreWindowCompressionOpportunity,
    corpScoreWindowCompressionTaken,
    corpScoreWindowCompressionRate:
      corpScoreWindowCompressionOpportunity > 0
        ? round(
            corpScoreWindowCompressionTaken /
              corpScoreWindowCompressionOpportunity,
          )
        : 0,
    corpScoreWindowCompressionSkipped,
    corpNonEssentialActionBeforeScoreWindow,
    corpEconomyBeforeScoreWindow,
    corpEconomyBeforeScoreWindowNecessary,
    corpProtectionBeforeScoreWindow,
    corpProtectionBeforeScoreWindowNoSafetyDelta,
    corpCentralProtectionBeforeScoreWindow,
    corpCentralProtectionBeforeScoreWindowNecessary,
    corpDrawBeforeScoreWindow,
    corpEndTurnBeforeScoreWindow,
    corpSameTurnScoreOpportunity,
    corpSameTurnScoreTaken,
    corpScoreWindowLostAfterNonEssentialAction,
    corpRunnerStealAfterDelayedScoreWindow,
    corpAdvanceToScoreLineCompressedWithin2,
    corpAdvanceToScoreLineCompressedWithin3,
    scoredAgendaActionOpportunities,
    scoredAgendaActionTaken,
    scoredAgendaActionTakeRate:
      scoredAgendaActionOpportunities > 0
        ? round(scoredAgendaActionTaken / scoredAgendaActionOpportunities)
        : 0,
    scoredAgendaEconomyOpportunities,
    scoredAgendaEconomyTaken,
    scoredAgendaEconomySkippedForBasicCredit,
    politicalOverthrowOpportunities,
    politicalOverthrowTaken,
    politicalOverthrowSkippedForBasicCredit,
    scoredAgendaCounterEconomyOpportunities,
    scoredAgendaCounterEconomyTaken,
    scoredAgendaDrawOpportunities,
    scoredAgendaDrawTaken,
    scoredAgendaExtraActionOpportunities,
    scoredAgendaExtraActionTaken,
    scoredAgendaTraceTagOpportunities,
    scoredAgendaTraceTagTaken,
    scoredAgendaDamagePunishOpportunities,
    scoredAgendaDamagePunishTaken,
    scoredAgendaActionValueOverBasic,
    basicCreditTakenWhileBetterAgendaEconomyAvailable,
    basicDrawTakenWhileBetterAgendaDrawAvailable,
    corpNewRemoteCreated,
    corpNewRemoteCreatedWithPlan,
    corpNewRemoteCreatedWithoutPayloadPlan,
    corpEmptyRemoteWithIceCreated,
    corpEmptyRemoteStayedUnusedTurns,
    corpRemoteConvertedToAgendaAssetOrBait:
      corpRemoteCreatedThenAgendaInstalledWithin3 +
      corpRemoteCreatedThenAssetInstalledWithin3 +
      corpRemoteCreatedThenBaitOrAmbushWithin3,
    corpRemoteConversionRate:
      corpNewRemoteCreated > 0
        ? round(
            (corpRemoteCreatedThenAgendaInstalledWithin3 +
              corpRemoteCreatedThenAssetInstalledWithin3 +
              corpRemoteCreatedThenBaitOrAmbushWithin3) /
              corpNewRemoteCreated,
          )
        : 0,
    corpIceInstalledOnNewRemoteInsteadOfExistingScoringRemote,
    corpExistingRemoteCouldBeStrengthened,
    corpRemotePortfolioOverExpanded,
    corpOneIceRemoteCheaplyContestable,
    corpRemoteIceConsolidationOpportunity,
    corpRemoteIceConsolidationTaken,
    corpRemoteCreatedThenNoScorePath,
    corpRemoteCreatedThenAgendaInstalledWithin3,
    corpRemoteCreatedThenAssetInstalledWithin3,
    corpRemoteCreatedThenBaitOrAmbushWithin3,
    corpHqCardCount: averageNumber(hqCardCounts),
    corpHqKnownAgendaCount: averageNumber(hqKnownAgendaCounts),
    corpHqAgendaDensity: averageNumber(hqAgendaDensities),
    corpHqAgendaFloodRisk,
    runnerHqAccessThreat,
    runnerHqKnownAgendaThreat,
    runnerHqMultiaccessThreat,
    corpDrawWouldLikelyDiluteHq,
    corpDrawWouldRiskAgendaFlood,
    corpDrawChosenToDiluteAgendaFlood,
    corpDrawSkippedBecauseAgendaFloodRisk,
    corpAgendaRemovedFromHqToRemoteOrScore,
    corpHqProtectionChosenOverDilution,
    corpHqDilutionChosenBecauseNoSafeRemote,
    corpHqDilutionBackfiredAgendaDrawn,
    corpHqDensityReducedAfterDraw,
    corpHqDensityIncreasedAfterDraw,
  };
}

function isMeaningfulBoardProgress(entry: AiSimulationActionSequenceEntry): boolean {
  return planConversionEntryHasMeaningfulBoardProgress(
    entry,
    isCorpRemoteAdvancementProgress,
  );
}

function summarizeCentralCloseoutRepeatMetrics(
  summaries: AiSimulationSummary[],
): Pick<
  AiMatchProgressionMetrics,
  | "trueCentralCloseoutOpportunities"
  | "centralCloseoutOpportunitiesRaw"
  | "centralCloseoutOpportunitiesDeduped"
  | "centralCloseoutOpportunities"
  | "centralCloseoutRunsTaken"
  | "centralCloseoutSuccesses"
  | "centralCloseoutFalsePositiveRate"
  | "centralCloseoutSkippedWithGoodReason"
  | "centralCloseoutSkippedWithoutReason"
  | "centralRunRepeatWindowsRaw"
  | "centralRunRepeatWindowsDeduped"
  | "repeatedCentralRunsWithFreshValue"
  | "repeatedCentralRunsWithoutFreshValue"
  | "centralRunInsteadUnjustified"
  | "centralRunJustifiedByMultiaccess"
  | "centralRunJustifiedByInterface"
  | "centralRunJustifiedByCloseout"
  | "centralRunJustifiedByRemoteUncontestable"
  | "centralRunJustifiedByHqPressure"
  | "centralRunJustifiedByRndFreshness"
  | "centralRunStalePenaltyApplied"
  | "centralPressureNoopDecisions"
  | "noFreshCentralWindows"
  | "noFreshCentralRunsTaken"
  | "noFreshCentralSubstitutions"
  | "noFreshCentralSubstitutionRate"
  | "noFreshCentralSubstitutionEconomy"
  | "noFreshCentralSubstitutionRigUnlock"
  | "noFreshCentralSubstitutionRemoteContest"
  | "noFreshCentralSubstitutionPressureInstall"
  | "noFreshCentralSubstitutionSetupSearch"
  | "noFreshCentralSubstitutionEndTurn"
  | "noFreshCentralWithBetterAlternative"
  | "noFreshCentralWithoutBetterAlternative"
  | "staleCentralChosenDespiteEconomy"
  | "staleCentralChosenDespiteRigUnlock"
  | "staleCentralChosenDespiteRemoteContest"
  | "staleCentralChosenDespitePressureInstall"
  | "staleCentralAllowedWithReason"
  | "staleCentralAllowedCloseout"
  | "staleCentralAllowedInterface"
  | "staleCentralAllowedMultiaccess"
  | "staleCentralAllowedRemoteUncontestable"
  | "staleCentralAllowedCentralOpen"
  | "staleCentralAllowedNoBetterAction"
  | "alternativeChosenAfterStaleCentralPenalty"
  | "substitutionLedToProgression"
> {
  const rawCloseoutKeys = new Set<string>();
  const trueCloseoutKeys = new Set<string>();
  const closeoutRunsTakenKeys = new Set<string>();
  const closeoutSuccessKeys = new Set<string>();
  const skippedGoodReasonKeys = new Set<string>();
  const skippedWithoutReasonKeys = new Set<string>();
  const repeatRawKeys = new Set<string>();
  const repeatDedupedKeys = new Set<string>();
  const repeatFreshKeys = new Set<string>();
  const repeatWithoutFreshKeys = new Set<string>();
  const stalePenaltyKeys = new Set<string>();
  const noopKeys = new Set<string>();
  const centralInsteadUnjustifiedKeys = new Set<string>();
  const noFreshKeys = new Set<string>();
  const noFreshRunKeys = new Set<string>();
  const noFreshSubstitutionKeys = new Set<string>();
  const noFreshWithBetterKeys = new Set<string>();
  const noFreshWithoutBetterKeys = new Set<string>();
  const staleDespite = {
    economy: new Set<string>(),
    rig_unlock: new Set<string>(),
    remote_contest: new Set<string>(),
    pressure_install: new Set<string>(),
  };
  const allowedStale = {
    any: new Set<string>(),
    closeout: new Set<string>(),
    interface: new Set<string>(),
    multiaccess: new Set<string>(),
    remote_uncontestable: new Set<string>(),
    central_open: new Set<string>(),
    no_better_action: new Set<string>(),
  };
  const substitutionByType = {
    economy: new Set<string>(),
    rig_unlock: new Set<string>(),
    remote_contest: new Set<string>(),
    pressure_install: new Set<string>(),
    setup_search: new Set<string>(),
    end_turn: new Set<string>(),
  };
  const substitutionProgressionKeys = new Set<string>();
  const reasonKeys = {
    multiaccess: new Set<string>(),
    interface: new Set<string>(),
    closeout: new Set<string>(),
    remote_uncontestable: new Set<string>(),
    hq_pressure: new Set<string>(),
    rnd_freshness: new Set<string>(),
  };

  for (const summary of summaries) {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    for (const entry of sequence) {
      const turn = entry.turnNumber ?? 0;
      const target = centralServerId(entry.targetServerId);
      const closeoutTarget = target ?? "central";
      const closeoutKey = `${summary.seed}|${turn}|${closeoutTarget}`;
      if (entry.runnerCentralCloseoutOpportunityRaw)
        rawCloseoutKeys.add(closeoutKey);
      if (entry.runnerTrueCentralCloseoutOpportunity)
        trueCloseoutKeys.add(closeoutKey);
      if (entry.runnerCentralCloseoutRunTaken)
        closeoutRunsTakenKeys.add(closeoutKey);
      if (entry.runnerCentralCloseoutSuccess)
        closeoutSuccessKeys.add(closeoutKey);
      if (entry.runnerCentralCloseoutSkippedWithGoodReason)
        skippedGoodReasonKeys.add(closeoutKey);
      if (entry.runnerCentralCloseoutSkippedWithoutReason)
        skippedWithoutReasonKeys.add(closeoutKey);
      if (entry.runnerCentralPressureNoopDecision) noopKeys.add(closeoutKey);

      if (target && entry.runnerCentralRunRepeatWindow) {
        const repeatRawKey = `${summary.seed}|${entry.stateVersionBefore}|${target}`;
        const repeatKey = `${summary.seed}|${turn}|${target}`;
        repeatRawKeys.add(repeatRawKey);
        repeatDedupedKeys.add(repeatKey);
        if (entry.runnerRepeatedCentralRunWithFreshValue)
          repeatFreshKeys.add(repeatKey);
        if (entry.runnerRepeatedCentralRunWithoutFreshValue)
          repeatWithoutFreshKeys.add(repeatKey);
        if (entry.runnerCentralRunStalePenaltyApplied)
          stalePenaltyKeys.add(repeatKey);
      }

      if (
        entry.runnerCentralRunInsteadOfContestableAdvancedRemote &&
        !entry.runnerCentralRunInsteadWasJustified
      ) {
        for (const serverId of entry.runnerContestableAdvancedRemoteThreatServerIds ??
          []) {
          centralInsteadUnjustifiedKeys.add(
            `${summary.seed}|${turn}|${serverId}`,
          );
        }
      }

      const reason = entry.runnerCentralRunJustificationReason;
      if (reason && target) {
        const reasonKey = `${summary.seed}|${turn}|${target}`;
        if (reason.includes("multiaccess"))
          reasonKeys.multiaccess.add(reasonKey);
        if (reason.includes("interface")) reasonKeys.interface.add(reasonKey);
        if (reason.includes("closeout")) reasonKeys.closeout.add(reasonKey);
        if (reason.includes("remote_uncontestable"))
          reasonKeys.remote_uncontestable.add(reasonKey);
        if (reason.includes("hq_pressure"))
          reasonKeys.hq_pressure.add(reasonKey);
        if (reason.includes("rnd_freshness"))
          reasonKeys.rnd_freshness.add(reasonKey);
      }

      const noFreshTargets = entry.runnerNoFreshCentralServerIds ?? [];
      for (const noFreshTarget of noFreshTargets) {
        const key = `${summary.seed}|${turn}|${noFreshTarget}`;
        noFreshKeys.add(key);
        const alternatives =
          entry.runnerNoFreshCentralBetterAlternativeTypes ?? [];
        if (alternatives.length > 0) noFreshWithBetterKeys.add(key);
        else noFreshWithoutBetterKeys.add(key);
        if (entry.runnerNoFreshCentralRunTaken) {
          noFreshRunKeys.add(key);
          if (alternatives.includes("economy")) staleDespite.economy.add(key);
          if (alternatives.includes("rig_unlock"))
            staleDespite.rig_unlock.add(key);
          if (alternatives.includes("remote_contest"))
            staleDespite.remote_contest.add(key);
          if (alternatives.includes("pressure_install"))
            staleDespite.pressure_install.add(key);
          const allowed = entry.runnerStaleCentralAllowedReason;
          if (allowed) {
            allowedStale.any.add(key);
            if (allowed in allowedStale)
              allowedStale[allowed as keyof typeof allowedStale].add(key);
          }
        }
        const substitutionType = entry.runnerNoFreshCentralSubstitutionType;
        if (substitutionType) {
          noFreshSubstitutionKeys.add(key);
          substitutionByType[substitutionType].add(key);
          if (
            sequence
              .filter((later) => (later.turnNumber ?? 0) >= turn)
              .some(
                (later) =>
                  later.actionType === "steal_agenda" ||
                  later.actionType === "trash_accessed_card" ||
                  later.runnerRemoteRunAgainstAdvancedRemote === true ||
                  later.runnerRigInstallAction === true ||
                  (typeof later.runnerCreditsAfter === "number" &&
                    typeof later.runnerReserveTarget === "number" &&
                    later.runnerCreditsAfter >= later.runnerReserveTarget),
              )
          ) {
            substitutionProgressionKeys.add(key);
          }
        }
      }
    }
  }

  return {
    trueCentralCloseoutOpportunities: trueCloseoutKeys.size,
    centralCloseoutOpportunitiesRaw: rawCloseoutKeys.size,
    centralCloseoutOpportunitiesDeduped: trueCloseoutKeys.size,
    centralCloseoutOpportunities: trueCloseoutKeys.size,
    centralCloseoutRunsTaken: closeoutRunsTakenKeys.size,
    centralCloseoutSuccesses: closeoutSuccessKeys.size,
    centralCloseoutFalsePositiveRate:
      rawCloseoutKeys.size > 0
        ? round(
            (rawCloseoutKeys.size - trueCloseoutKeys.size) /
              rawCloseoutKeys.size,
          )
        : 0,
    centralCloseoutSkippedWithGoodReason: skippedGoodReasonKeys.size,
    centralCloseoutSkippedWithoutReason: skippedWithoutReasonKeys.size,
    centralRunRepeatWindowsRaw: repeatRawKeys.size,
    centralRunRepeatWindowsDeduped: repeatDedupedKeys.size,
    repeatedCentralRunsWithFreshValue: repeatFreshKeys.size,
    repeatedCentralRunsWithoutFreshValue: repeatWithoutFreshKeys.size,
    centralRunInsteadUnjustified: centralInsteadUnjustifiedKeys.size,
    centralRunJustifiedByMultiaccess: reasonKeys.multiaccess.size,
    centralRunJustifiedByInterface: reasonKeys.interface.size,
    centralRunJustifiedByCloseout: reasonKeys.closeout.size,
    centralRunJustifiedByRemoteUncontestable:
      reasonKeys.remote_uncontestable.size,
    centralRunJustifiedByHqPressure: reasonKeys.hq_pressure.size,
    centralRunJustifiedByRndFreshness: reasonKeys.rnd_freshness.size,
    centralRunStalePenaltyApplied: stalePenaltyKeys.size,
    centralPressureNoopDecisions: noopKeys.size,
    noFreshCentralWindows: noFreshKeys.size,
    noFreshCentralRunsTaken: noFreshRunKeys.size,
    noFreshCentralSubstitutions: noFreshSubstitutionKeys.size,
    noFreshCentralSubstitutionRate:
      noFreshKeys.size > 0
        ? round(noFreshSubstitutionKeys.size / noFreshKeys.size)
        : 0,
    noFreshCentralSubstitutionEconomy: substitutionByType.economy.size,
    noFreshCentralSubstitutionRigUnlock: substitutionByType.rig_unlock.size,
    noFreshCentralSubstitutionRemoteContest:
      substitutionByType.remote_contest.size,
    noFreshCentralSubstitutionPressureInstall:
      substitutionByType.pressure_install.size,
    noFreshCentralSubstitutionSetupSearch: substitutionByType.setup_search.size,
    noFreshCentralSubstitutionEndTurn: substitutionByType.end_turn.size,
    noFreshCentralWithBetterAlternative: noFreshWithBetterKeys.size,
    noFreshCentralWithoutBetterAlternative: noFreshWithoutBetterKeys.size,
    staleCentralChosenDespiteEconomy: staleDespite.economy.size,
    staleCentralChosenDespiteRigUnlock: staleDespite.rig_unlock.size,
    staleCentralChosenDespiteRemoteContest: staleDespite.remote_contest.size,
    staleCentralChosenDespitePressureInstall:
      staleDespite.pressure_install.size,
    staleCentralAllowedWithReason: allowedStale.any.size,
    staleCentralAllowedCloseout: allowedStale.closeout.size,
    staleCentralAllowedInterface: allowedStale.interface.size,
    staleCentralAllowedMultiaccess: allowedStale.multiaccess.size,
    staleCentralAllowedRemoteUncontestable:
      allowedStale.remote_uncontestable.size,
    staleCentralAllowedCentralOpen: allowedStale.central_open.size,
    staleCentralAllowedNoBetterAction: allowedStale.no_better_action.size,
    alternativeChosenAfterStaleCentralPenalty: noFreshSubstitutionKeys.size,
    substitutionLedToProgression: substitutionProgressionKeys.size,
  };
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
      for (const serverId of entry.runnerContestableAdvancedRemoteThreatServerIds ??
        []) {
        const key = `${summary.seed}|${turn}|${serverId}`;
        contestableKeys.add(key);
        if (entry.runnerRemoteContestBlockedByCredits)
          blockedCreditKeys.add(key);
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
        if (entry.runnerCentralRunInsteadWasJustified)
          centralJustifiedKeys.add(key);
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
          if (first !== undefined)
            resolveDeltas.push(Math.max(0, turn - first));
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
      contestableKeys.size > 0
        ? round(contestedKeys.size / contestableKeys.size)
        : 0,
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

function corpIcePortfolioDiagnosticsForSimulationAction(
  input: AiDecisionInput,
  action: LegalAction,
): Partial<AiSimulationSummary["actionSequence"][number]> {
  if (input.side !== "corp" || action.side !== "corp") return {};
  const assessment = assessCorpIcePortfolioAction(input, action);
  const centralInstall =
    action.type === "install_card" &&
    action.payload?.placement === "ice" &&
    (assessment.serverId === "hq" ||
      assessment.serverId === "rd" ||
      assessment.serverId === "archives");
  const remoteInstall =
    action.type === "install_card" &&
    action.payload?.placement === "ice" &&
    typeof action.payload.serverId === "string" &&
    isRemoteServerTarget(action.payload.serverId);
  return {
    corpHqIceCount: assessment.hqIceCountBefore,
    corpRndIceCount: assessment.rndIceCountBefore,
    corpArchivesIceCount: assessment.archivesIceCountBefore,
    corpRemoteIceCount: assessment.remoteIceCountBefore,
    corpHqUnrezzedIceCount: assessment.hqUnrezzedIceCountBefore,
    corpRndUnrezzedIceCount: assessment.rndUnrezzedIceCountBefore,
    corpCentralIceCount: assessment.centralIceCountBefore,
    corpCentralUnrezzedIceCount: assessment.centralUnrezzedIceCountBefore,
    ...(centralInstall ? { corpCentralIceInstalled: true } : {}),
    ...(assessment.serverId === "hq" && centralInstall
      ? { corpHqIceInstalled: true }
      : {}),
    ...(assessment.serverId === "rd" && centralInstall
      ? { corpRndIceInstalled: true }
      : {}),
    ...(assessment.serverId === "archives" && centralInstall
      ? { corpArchivesIceInstalled: true }
      : {}),
    ...(remoteInstall ? { corpRemoteIceInstalled: true } : {}),
    ...(assessment.hqOverIced ? { corpHqOverIced: true } : {}),
    ...(assessment.rndOverIced ? { corpRndOverIced: true } : {}),
    ...(assessment.centralOverIced ? { corpCentralOverIced: true } : {}),
    ...(assessment.centralOverIcedWithoutPressure
      ? { corpCentralOverIcedWithoutPressure: true }
      : {}),
    ...(assessment.centralOverIcedWithLowRezReserve
      ? { corpCentralOverIcedWithLowRezReserve: true }
      : {}),
    ...(assessment.hqFifthIceInstalled
      ? { corpHqFifthIceInstalled: true }
      : {}),
    ...(assessment.centralIceDiminishingReturnInstall
      ? { corpCentralIceDiminishingReturnInstall: true }
      : {}),
    ...(assessment.centralIceInstallSuppressedByDiminishingReturns
      ? { corpCentralIceInstallSuppressedByDiminishingReturns: true }
      : {}),
    ...(assessment.centralIceInstallPenalizedByDiminishingReturns
      ? { corpCentralIceInstallPenalizedByDiminishingReturns: true }
      : {}),
    corpRezReserveCredits: assessment.corpCredits,
    corpRezReserveDeficit: assessment.rezReserveDeficit,
    ...(assessment.installedIceWithoutRezReserve
      ? { corpInstalledIceWithoutRezReserve: true }
      : {}),
    ...(assessment.installedCentralIceWithoutRezReserve
      ? { corpInstalledCentralIceWithoutRezReserve: true }
      : {}),
    ...(assessment.installedRemoteIceWithoutRezReserve
      ? { corpInstalledRemoteIceWithoutRezReserve: true }
      : {}),
    ...(assessment.canRezAtLeastOneCentralIce
      ? { corpCanRezAtLeastOneCentralIce: true }
      : {}),
    ...(assessment.canRezAtLeastOneRemoteIce
      ? { corpCanRezAtLeastOneRemoteIce: true }
      : {}),
    ...(assessment.cannotRezNewlyInstalledIce
      ? { corpCannotRezAnyNewlyInstalledIce: true }
      : {}),
    ...(assessment.creditsBelowCheapestRelevantRez
      ? { corpCreditsBelowCheapestRelevantRez: true }
      : {}),
    ...(assessment.creditsBelowEstimatedCentralRezNeed
      ? { corpCreditsBelowEstimatedCentralRezNeed: true }
      : {}),
    ...(assessment.hqProtectionJustifiedByAgendaFlood
      ? { corpHqProtectionJustifiedByAgendaFlood: true }
      : {}),
    ...(assessment.hqProtectionJustifiedByRunnerPressure
      ? { corpHqProtectionJustifiedByRunnerPressure: true }
      : {}),
    ...(assessment.rndProtectionJustifiedByRunnerPressure
      ? { corpRndProtectionJustifiedByRunnerPressure: true }
      : {}),
    ...(assessment.centralOverIceBlockedByRunnerPressure
      ? { corpCentralOverIceBlockedByRunnerPressure: true }
      : {}),
    ...(assessment.centralOverIceBlockedByAgendaFlood
      ? { corpCentralOverIceBlockedByAgendaFlood: true }
      : {}),
    ...(assessment.centralOverIceBlockedByNoRemotePlan
      ? { corpCentralOverIceBlockedByNoRemotePlan: true }
      : {}),
    ...(assessment.remoteScoringUnderbuiltWhileCentralsOverIced
      ? { corpRemoteScoringUnderbuiltWhileCentralsOverIced: true }
      : {}),
    ...(assessment.readyRemoteExists ? { corpReadyRemoteExists: true } : {}),
    ...(assessment.agendaInHqWithReadyRemote
      ? { corpAgendaInHqWithReadyRemote: true }
      : {}),
    ...(assessment.agendaInHqWithoutReadyRemote
      ? { corpAgendaInHqWithoutReadyRemote: true }
      : {}),
    ...(assessment.extraCentralIceChosenOverReadyRemoteBuild
      ? { corpExtraCentralIceChosenOverReadyRemoteBuild: true }
      : {}),
    ...(assessment.extraCentralIceChosenOverEconomy
      ? { corpExtraCentralIceChosenOverEconomy: true }
      : {}),
    ...(assessment.extraCentralIceChosenOverRezReserve
      ? { corpExtraCentralIceChosenOverRezReserve: true }
      : {}),
    ...(assessment.extraCentralIceChosenOverAgendaInstall
      ? { corpExtraCentralIceChosenOverAgendaInstall: true }
      : {}),
    ...(assessment.extraCentralIceChosenOverAdvanceOrScore
      ? { corpExtraCentralIceChosenOverAdvanceOrScore: true }
      : {}),
    ...(assessment.fixGateEligible
      ? { corpIcePortfolioFixGateEligible: true }
      : {}),
    ...(assessment.fixGateSuspiciousCentralOverIce
      ? { corpIcePortfolioFixGateSuspiciousCentralOverIce: true }
      : {}),
    ...(assessment.fixGateBlockedByAgendaFlood
      ? { corpIcePortfolioFixGateBlockedByAgendaFlood: true }
      : {}),
    ...(assessment.fixGateBlockedByRunnerCentralPressure
      ? { corpIcePortfolioFixGateBlockedByRunnerCentralPressure: true }
      : {}),
    ...(assessment.fixGateBlockedByNoRemotePlan
      ? { corpIcePortfolioFixGateBlockedByNoRemotePlan: true }
      : {}),
    ...(assessment.fixGateBlockedByEmergencyProtection
      ? { corpIcePortfolioFixGateBlockedByEmergencyProtection: true }
      : {}),
    corpIcePortfolioEvidence: assessment.evidence,
  };
}

function corpFutureRunIceDiagnosticsForSimulationAction(
  input: AiDecisionInput,
  action: LegalAction,
): Partial<AiSimulationSummary["actionSequence"][number]> {
  if (input.side !== "corp" || action.side !== "corp") return {};
  const opportunity = input.legalActions.some(
    (candidate) =>
      candidate.side === "corp" &&
      candidate.type === "install_card" &&
      candidate.payload?.placement === "ice" &&
      Boolean(
        classifyCorpFutureRunIceDefinitionId(
          sourceDefinitionIdForSimulationAction(input, candidate),
        ),
      ),
  );
  const assessment = assessCorpFutureRunIcePlacement(input, action);
  if (!assessment) {
    return opportunity ? { corpFutureRunIceInstallOpportunity: true } : {};
  }
  return {
    ...(opportunity ? { corpFutureRunIceInstallOpportunity: true } : {}),
    corpFutureRunIceInstalled: true,
    corpFutureRunIceClass: assessment.futureRunIceClass,
    ...(assessment.installedOnEmptyServer
      ? {
          corpFutureRunIceInstalledOnEmptyServer: true,
          corpFutureRunIceInstalledFirstOnEmptyServer: true,
          corpFutureRunIceInstalledAsInnermost: true,
          corpFutureRunIceInstalledWithoutLaterIce: true,
          corpFutureRunIceInstalledAsDeadEffect: true,
          corpIceOrderFutureEffectDead: true,
        }
      : {
          corpFutureRunIceInstalledAfterInnerIceExists: true,
          corpFutureRunIceInstalledWithLaterIce: true,
          corpFutureRunIceInstalledAsLiveEffect: true,
          corpIceOrderFutureEffectLive: true,
        }),
    corpFutureRunIceInstalledAsOutermost: true,
    ...(assessment.deadEffect &&
    (assessment.futureRunIceClass === "bolter_or_data_darts" ||
      assessment.futureRunIceClass === "future_run_ice")
      ? { corpNextIceEffectInstalledLast: true }
      : {}),
    ...(assessment.futureRunIceClass === "ball_and_chain" &&
    assessment.deadEffect
      ? {
          corpBallAndChainInstalledInnermost: true,
          corpBallAndChainInstalledWithoutLaterIce: true,
        }
      : {}),
    ...(assessment.futureRunIceClass === "ball_and_chain" &&
    assessment.liveEffect
      ? { corpBallAndChainInstalledWithLaterIce: true }
      : {}),
    ...(assessment.futureRunIceClass === "canis" && assessment.deadEffect
      ? { corpCanisInstalledWithoutLaterIce: true }
      : {}),
    ...(assessment.futureRunIceClass === "bolter_or_data_darts" &&
    assessment.deadEffect
      ? { corpBolterOrDataDartsInstalledWithoutNextIce: true }
      : {}),
  };
}

function corpScoreTerminalDiagnosticsForSimulationAction(
  input: AiDecisionInput,
  action: LegalAction,
): Partial<AiSimulationSummary["actionSequence"][number]> {
  if (input.side !== "corp" || action.side !== "corp") return {};
  const terminal = assessCorpScoreTerminalWindow(input);
  if (!terminal.terminalWindow) return {};
  const scoreTaken = terminal.scoreActionIds.includes(action.actionId);
  const advanceTaken = terminal.advanceToScoreActionIds.includes(
    action.actionId,
  );
  const agendaInstalled = terminal.agendaInstallActionIds.includes(
    action.actionId,
  );
  const taken = scoreTaken || advanceTaken || agendaInstalled;
  const skipped = !taken;
  const family = corpScoreTerminalChosenFamily(input, action);
  const fixGateBlocked =
    terminal.blockedByCheapContest ||
    terminal.blockedByCredits ||
    terminal.blockedByRunnerContest ||
    terminal.blockedByHqThreat;
  const suspiciousProtection =
    skipped && !fixGateBlocked && family === "protection";
  const suspiciousEconomy = skipped && !fixGateBlocked && family === "economy";
  const suspiciousDraw = skipped && !fixGateBlocked && family === "draw";
  const suspiciousRemotePortfolio =
    skipped && !fixGateBlocked && family === "remote_portfolio";
  const suspiciousUnknown =
    skipped &&
    !fixGateBlocked &&
    !suspiciousProtection &&
    !suspiciousEconomy &&
    !suspiciousDraw &&
    !suspiciousRemotePortfolio;
  return {
    corpScoreTerminalWindow: true,
    ...(terminal.scoreActionIds.length > 0
      ? { corpScoreTerminalWindowScoreLegal: true }
      : {}),
    ...(terminal.advanceToScoreActionIds.length > 0
      ? { corpScoreTerminalWindowAdvanceToScoreLegal: true }
      : {}),
    ...(terminal.agendaInstallActionIds.length > 0
      ? { corpScoreTerminalWindowAgendaInstallLegal: true }
      : {}),
    ...(terminal.protectedRemoteIds.length > 0
      ? { corpScoreTerminalWindowProtectedRemoteReady: true }
      : {}),
    ...(terminal.remoteContestLow
      ? { corpScoreTerminalWindowRemoteContestLow: true }
      : {}),
    ...(terminal.creditsSufficient
      ? { corpScoreTerminalWindowCreditsSufficient: true }
      : {}),
    ...(terminal.runnerAccessThreatHigh
      ? { corpScoreTerminalWindowRunnerAccessThreatHigh: true }
      : {}),
    ...(scoreTaken ? { corpScoreTerminalScoreTaken: true } : {}),
    ...(advanceTaken ? { corpScoreTerminalAdvanceTaken: true } : {}),
    ...(agendaInstalled ? { corpScoreTerminalAgendaInstalled: true } : {}),
    ...(skipped ? { corpScoreTerminalSkipped: true } : {}),
    ...(skipped && family === "protection"
      ? { corpScoreTerminalSkippedForProtection: true }
      : {}),
    ...(skipped && family === "economy"
      ? { corpScoreTerminalSkippedForEconomy: true }
      : {}),
    ...(skipped && family === "draw"
      ? { corpScoreTerminalSkippedForDraw: true }
      : {}),
    ...(skipped && family === "install_ice"
      ? { corpScoreTerminalSkippedForInstallIce: true }
      : {}),
    ...(skipped && family === "install_asset_or_upgrade"
      ? { corpScoreTerminalSkippedForInstallAssetOrUpgrade: true }
      : {}),
    ...(skipped && family === "hq_protection"
      ? { corpScoreTerminalSkippedForHqProtection: true }
      : {}),
    ...(skipped && family === "rnd_protection"
      ? { corpScoreTerminalSkippedForRndProtection: true }
      : {}),
    ...(skipped && family === "remote_portfolio"
      ? { corpScoreTerminalSkippedForRemotePortfolio: true }
      : {}),
    ...(skipped && family === "unknown"
      ? { corpScoreTerminalSkippedForUnknownHigherPriority: true }
      : {}),
    ...(terminal.blockedByCheapContest
      ? { corpScoreConversionFixGateBlockedByCheapContest: true }
      : {}),
    ...(terminal.blockedByCredits
      ? { corpScoreConversionFixGateBlockedByCredits: true }
      : {}),
    ...(terminal.blockedByRunnerContest
      ? { corpScoreConversionFixGateBlockedByRunnerContest: true }
      : {}),
    ...(terminal.blockedByHqThreat
      ? { corpScoreConversionFixGateBlockedByHqThreat: true }
      : {}),
    ...(suspiciousProtection
      ? {
          corpScoreConversionFixGateEligible: true,
          corpScoreConversionFixGateSuspiciousProtectionLoop: true,
        }
      : {}),
    ...(suspiciousEconomy
      ? {
          corpScoreConversionFixGateEligible: true,
          corpScoreConversionFixGateSuspiciousEconomyLoop: true,
        }
      : {}),
    ...(suspiciousDraw
      ? {
          corpScoreConversionFixGateEligible: true,
          corpScoreConversionFixGateSuspiciousDraw: true,
        }
      : {}),
    ...(suspiciousRemotePortfolio
      ? {
          corpScoreConversionFixGateEligible: true,
          corpScoreConversionFixGateSuspiciousRemotePortfolio: true,
        }
      : {}),
    ...(suspiciousUnknown
      ? {
          corpScoreConversionFixGateEligible: true,
          corpScoreConversionFixGateSuspiciousUnknown: true,
        }
      : {}),
    corpScoreTerminalEvidence: terminal.evidence,
  };
}

function corpEconomyBeforeScoreDiagnosticsForSimulationAction(
  input: AiDecisionInput,
  action: LegalAction,
): Partial<AiSimulationSummary["actionSequence"][number]> {
  if (input.side !== "corp" || action.side !== "corp") return {};
  const terminal = assessCorpScoreTerminalWindow(input);
  if (!terminal.terminalWindow) return {};
  const family = corpScoreTerminalChosenFamily(input, action);
  const economyTaken = family === "economy";
  const hasInstalledAgenda =
    terminal.scoreActionIds.length > 0 ||
    terminal.advanceToScoreActionIds.length > 0;
  const hasAdvancedAgenda = hasInstalledAgenda;
  const scoreLegal = terminal.scoreActionIds.length > 0;
  const advanceToScoreLegal = terminal.advanceToScoreActionIds.length > 0;
  const agendaInstallReadyRemoteLegal =
    terminal.agendaInstallActionIds.length > 0 &&
    terminal.protectedRemoteIds.length > 0;
  const fixGateBlockedBySafety = terminal.blockedByHqThreat;
  const fixGateBlocked =
    terminal.blockedByCredits ||
    terminal.blockedByCheapContest ||
    terminal.blockedByRunnerContest ||
    fixGateBlockedBySafety;
  const creditsNeeded = economyTaken && terminal.blockedByCredits;
  const creditsAlreadyEnough = !terminal.blockedByCredits;
  const suspiciousCreditsAlreadyEnough =
    economyTaken && creditsAlreadyEnough && !fixGateBlocked;
  const suspiciousDelayedTerminalAction =
    economyTaken &&
    !fixGateBlocked &&
    (scoreLegal || advanceToScoreLegal || agendaInstallReadyRemoteLegal);
  const suspiciousRemoteStillSafe =
    economyTaken && !fixGateBlocked && terminal.protectedRemoteIds.length > 0;
  const unclassified =
    economyTaken &&
    !creditsNeeded &&
    !suspiciousCreditsAlreadyEnough &&
    !suspiciousDelayedTerminalAction &&
    !suspiciousRemoteStillSafe &&
    !fixGateBlocked;
  const evidence = [
    "corp_economy_before_score_diagnostic_window:true",
    `corp_economy_before_score_score_legal:${scoreLegal}`,
    `corp_economy_before_score_advance_to_score_legal:${advanceToScoreLegal}`,
    `corp_economy_before_score_agenda_install_ready_remote_legal:${agendaInstallReadyRemoteLegal}`,
    `corp_economy_before_score_credits_short:${terminal.blockedByCredits}`,
    `corp_economy_before_score_credits_already_enough:${creditsAlreadyEnough}`,
    `corp_economy_before_score_remote_safe:${terminal.protectedRemoteIds.length > 0}`,
    `corp_economy_before_score_runner_contest_high:${terminal.blockedByRunnerContest}`,
  ];

  return {
    corpEconomyBeforeScoreDiagnosticWindow: true,
    ...(hasInstalledAgenda
      ? { corpEconomyBeforeScoreWindowWithInstalledAgenda: true }
      : {}),
    ...(hasAdvancedAgenda
      ? { corpEconomyBeforeScoreWindowWithAdvancedAgenda: true }
      : {}),
    ...(scoreLegal
      ? { corpEconomyBeforeScoreWindowWithScoreLegalNext: true }
      : {}),
    ...(advanceToScoreLegal
      ? { corpEconomyBeforeScoreWindowWithAdvanceToScoreLegalNext: true }
      : {}),
    ...(terminal.protectedRemoteIds.length > 0
      ? {
          corpEconomyBeforeScoreWindowWithReadyRemote: true,
          corpEconomyBeforeScoreWindowRemoteSafe: true,
        }
      : {}),
    ...(agendaInstallReadyRemoteLegal
      ? { corpEconomyBeforeScoreWindowWithAgendaInHqAndReadyRemote: true }
      : {}),
    ...(terminal.blockedByCredits
      ? { corpEconomyBeforeScoreWindowCreditsShort: true }
      : { corpEconomyBeforeScoreWindowCreditsAlreadyEnough: true }),
    ...(terminal.blockedByRunnerContest
      ? { corpEconomyBeforeScoreWindowRemoteContestHigh: true }
      : {}),
    ...(economyTaken ? { corpEconomyBeforeScoreTaken: true } : {}),
    ...(creditsNeeded
      ? {
          corpEconomyBeforeScoreTakenAsNecessaryCredits: true,
          corpEconomyBeforeScorePlausibleCreditsNeeded: true,
          corpEconomyBeforeScorePlausibleRezOrAdvanceReserve: true,
        }
      : {}),
    ...(economyTaken && creditsAlreadyEnough
      ? { corpEconomyBeforeScoreTakenDespiteCreditsEnough: true }
      : {}),
    ...(economyTaken && scoreLegal
      ? { corpEconomyBeforeScoreTakenOverScoreLegal: true }
      : {}),
    ...(economyTaken && advanceToScoreLegal
      ? { corpEconomyBeforeScoreTakenOverAdvanceToScoreLegal: true }
      : {}),
    ...(economyTaken && agendaInstallReadyRemoteLegal
      ? { corpEconomyBeforeScoreTakenOverAgendaInstallReadyRemote: true }
      : {}),
    ...(economyTaken && agendaInstallReadyRemoteLegal
      ? { corpEconomyBeforeScoreTakenOverHqAgendaExit: true }
      : {}),
    ...(terminal.blockedByHqThreat
      ? { corpEconomyBeforeScorePlausibleHqOrRndSafety: true }
      : {}),
    ...(terminal.blockedByRunnerContest
      ? { corpEconomyBeforeScorePlausibleRunnerContestTooHigh: true }
      : {}),
    ...(economyTaken &&
    !scoreLegal &&
    !advanceToScoreLegal &&
    !agendaInstallReadyRemoteLegal
      ? { corpEconomyBeforeScorePlausibleNoAgendaExit: true }
      : {}),
    ...(suspiciousCreditsAlreadyEnough
      ? { corpEconomyBeforeScoreSuspiciousCreditsAlreadyEnough: true }
      : {}),
    ...(suspiciousDelayedTerminalAction
      ? { corpEconomyBeforeScoreSuspiciousDelayedTerminalAction: true }
      : {}),
    ...(suspiciousRemoteStillSafe
      ? { corpEconomyBeforeScoreSuspiciousRemoteStillSafe: true }
      : {}),
    ...(unclassified ? { corpEconomyBeforeScoreUnclassified: true } : {}),
    ...(terminal.blockedByCredits
      ? { corpEconomyBeforeScoreFixGateBlockedByCredits: true }
      : {}),
    ...(terminal.blockedByCheapContest
      ? { corpEconomyBeforeScoreFixGateBlockedByCheapContest: true }
      : {}),
    ...(terminal.blockedByRunnerContest
      ? { corpEconomyBeforeScoreFixGateBlockedByRunnerContest: true }
      : {}),
    ...(fixGateBlockedBySafety
      ? { corpEconomyBeforeScoreFixGateBlockedBySafety: true }
      : {}),
    ...(economyTaken && !fixGateBlocked
      ? {
          corpEconomyBeforeScoreFixGateEligible: true,
          corpEconomyBeforeScoreFixGateSuspicious:
            suspiciousCreditsAlreadyEnough ||
            suspiciousDelayedTerminalAction ||
            suspiciousRemoteStillSafe,
        }
      : {}),
    corpEconomyBeforeScoreEvidence: evidence,
  };
}

function corpScoreTerminalChosenFamily(
  input: AiDecisionInput,
  action: LegalAction,
):
  | "protection"
  | "economy"
  | "draw"
  | "install_ice"
  | "install_asset_or_upgrade"
  | "hq_protection"
  | "rnd_protection"
  | "remote_portfolio"
  | "unknown" {
  if (action.type === "draw_card") return "draw";
  if (action.type === "gain_credit") return "economy";
  const roles = rolesForAction(input, action);
  if (roles.some((role) => role.includes("economy"))) return "economy";
  if (
    action.type === "install_card" &&
    action.payload?.placement === "ice" &&
    action.payload?.serverId === "hq"
  )
    return "hq_protection";
  if (
    action.type === "install_card" &&
    action.payload?.placement === "ice" &&
    action.payload?.serverId === "rd"
  )
    return "rnd_protection";
  if (action.type === "install_card" && action.payload?.placement === "ice") {
    if (action.payload?.serverId === "new_remote") return "remote_portfolio";
    return "install_ice";
  }
  if (action.type === "install_card" && action.payload?.placement !== "ice") {
    if (action.payload?.serverId === "new_remote") return "remote_portfolio";
    if (
      roles.some(
        (role) =>
          role === "remote_support" ||
          role === "remote_protection" ||
          role === "upgrade" ||
          role === "run_tax" ||
          role === "steal_tax",
      )
    )
      return "protection";
    return "install_asset_or_upgrade";
  }
  if (
    action.type === "play_operation" ||
    action.type === "trigger_ability" ||
    action.type === "activated_card_ability"
  )
    return roles.some((role) => role.includes("economy"))
      ? "economy"
      : "unknown";
  return "unknown";
}

function runnerBreakerCoverageDiagnosticsForSimulationAction(
  input: AiDecisionInput,
  action: LegalAction,
  targetServerId: string | undefined,
): Partial<AiSimulationSummary["actionSequence"][number]> {
  if (input.side !== "runner" || action.side !== "runner") return {};
  const pressure = assessRunnerCoveragePressureForMetrics(input);
  const pressureReady = assessRunnerPressureReadyForMetrics(input);
  const pressureReadyTargetTypes = new Set(
    pressureReady.readyTargets.map((target) => target.targetType),
  );
  const selectedPressureReadyTarget =
    action.type === "start_run" &&
    targetServerId !== undefined &&
    pressureReady.readyTargets.some(
      (target) => target.serverId === targetServerId,
    );
  const setupContinuation =
    action.type === "draw_card" ||
    action.type === "gain_credit" ||
    isRunnerEconomyAction(input, action) ||
    runnerCoverageSearchActionForMetrics(input, action) ||
    (action.type === "install_card" && isRunnerRigInstallAction(input, action));
  const pressureReadyFlags = {
    ...(pressureReady.broadReady ? { runnerPressureReadyWindow: true } : {}),
    ...(pressureReady.readyTargets.length > 0
      ? { runnerPressureReadyTrue: true }
      : {}),
    ...(pressureReady.falsePositive
      ? { runnerPressureReadyFalsePositive: true }
      : {}),
    ...(pressureReadyTargetTypes.has("hq")
      ? { runnerPressureReadyByTargetHq: true }
      : {}),
    ...(pressureReadyTargetTypes.has("rnd")
      ? { runnerPressureReadyByTargetRnd: true }
      : {}),
    ...(pressureReadyTargetTypes.has("archives")
      ? { runnerPressureReadyByTargetArchives: true }
      : {}),
    ...(pressureReadyTargetTypes.has("remote")
      ? { runnerPressureReadyByTargetRemote: true }
      : {}),
    ...(pressureReady.readyTargets.length > 0 && setupContinuation
      ? {
          runnerSetupContinuedAfterPressureReady: true,
          runnerSetupLoopAfterPressureReady: true,
        }
      : {}),
    ...(selectedPressureReadyTarget
      ? { runnerPressureTakenAfterCoverageReady: true }
      : {}),
    ...(pressureReady.readyTargets.length > 0 && !selectedPressureReadyTarget
      ? {
          runnerPressureSkippedAfterCoverageReady: true,
          runnerPressureSkippedReason: setupContinuation
            ? ("better_immediate_action" as const)
            : ("no_valuable_target" as const),
        }
      : {}),
    ...(pressureReady.blockers.has("insufficient_credits")
      ? { runnerPhaseExitBlockedByCost: true }
      : {}),
    ...(pressureReady.blockers.has("missing_post_run_reserve")
      ? { runnerPhaseExitBlockedByCost: true }
      : {}),
    ...(pressure.missingBreakerRoles.size > 0
      ? { runnerPhaseExitBlockedByCoverage: true }
      : {}),
    ...(pressureReady.falsePositive ||
    pressureReady.blockers.has("no_valuable_target")
      ? { runnerPhaseExitBlockedByTargetValue: true }
      : {}),
  };
  if (pressure.missingBreakerRoles.size === 0) {
    const pressureRun =
      action.type === "start_run" &&
      targetServerId !== undefined &&
      selectedPressureReadyTarget;
    return {
      ...pressureReadyFlags,
      ...(pressureReady.readyTargets.length > 0 && setupContinuation
        ? {
            runnerCoverageReadyButNoPressure: true,
            runnerSetupContinuedAfterCoverageReady: true,
          }
        : {}),
      ...(pressureRun ? { runnerPhaseExitToPressure: true } : {}),
    };
  }
  const searchAvailable = pressure.searchActionIds.size > 0;
  const searchUsed =
    pressure.searchActionIds.has(action.actionId) ||
    pressure.recoveryActionIds.has(action.actionId);
  const installable = pressure.matchingInstallActionIds.size > 0;
  const breakerInstall =
    action.type === "install_card" &&
    pressure.matchingInstallActionIds.has(action.actionId);
  const pathBlocked = pressure.blockedServers.size > 0;
  const runTaken =
    action.type === "start_run" &&
    targetServerId !== undefined &&
    pressure.blockedServers.has(targetServerId);
  const setupAction =
    action.type === "draw_card" ||
    action.type === "gain_credit" ||
    isRunnerEconomyAction(input, action) ||
    (action.type === "install_card" && isRunnerRigInstallAction(input, action));
  const pressureRun =
    action.type === "start_run" &&
    targetServerId !== undefined &&
    selectedPressureReadyTarget;

  return {
    ...pressureReadyFlags,
    runnerMissingBreakerCoverageByType: pressure.missingBreakerRoles.size,
    runnerVisibleIceBlockingByType: pressure.blockedServers.size,
    runnerKnownIceBlockingByType: pressure.knownIceBlockedServers.size,
    ...(pathBlocked ? { runnerPathBlockedByMissingCoverage: true } : {}),
    ...(installable ? { runnerInstallableBreakerForBlockedPath: true } : {}),
    ...(searchAvailable
      ? { runnerSearchCardAvailableForMissingBreaker: true }
      : {}),
    ...(searchUsed ? { runnerSearchCardUsedForMissingBreaker: true } : {}),
    ...(searchAvailable && !searchUsed
      ? { runnerSearchCardAvailableButUnused: true }
      : {}),
    ...(searchUsed && pressure.recoveryActionIds.has(action.actionId)
      ? { runnerTutorConvertedToBreakerInstall: true }
      : {}),
    ...(breakerInstall ? { runnerCoverageImproved: true } : {}),
    ...(breakerInstall ? { runnerTutorConvertedToBreakerInstall: true } : {}),
    ...(runTaken && pathBlocked
      ? { runnerProbeRevealedIceButDidNotReact: true }
      : {}),
    ...(searchUsed && pathBlocked
      ? { runnerProbeRevealedIceThenSearchedBreaker: true }
      : {}),
    ...(setupAction && pathBlocked
      ? { runnerSetupBreakerSearchStalled: true }
      : {}),
    ...(isRunnerEconomyAction(input, action) && pathBlocked
      ? { runnerSetupEconomyStalled: true }
      : {}),
    ...(pressureRun ? { runnerPhaseExitToPressure: true } : {}),
  };
}

function runnerHasReadyPressureRunForMetrics(input: AiDecisionInput): boolean {
  return input.legalActions.some((action) => {
    if (
      action.type !== "start_run" ||
      typeof action.payload?.serverId !== "string"
    )
      return false;
    const serverId = action.payload.serverId;
    const server = input.playerView.servers.find(
      (candidate) => candidate.id === serverId,
    );
    if (!server || !runnerStrategicBreakerTargetForMetrics(server))
      return false;
    const assessment = assessKnownRezzedIcePath(
      server.ice,
      input.playerView.own.rig ?? [],
      input.playerView.own.credits,
      server.root,
    );
    return !assessment.blocked;
  });
}

function assessRunnerPressureReadyForMetrics(
  input: AiDecisionInput,
): RunnerPressureReadyForMetrics {
  const readyTargets: RunnerPressureReadyTargetForMetrics[] = [];
  const blockers = new Set<
    | "insufficient_credits"
    | "missing_post_run_reserve"
    | "stale_central"
    | "remote_too_dangerous"
    | "no_valuable_target"
  >();
  let broadReady = false;
  const seen = new Set<string>();
  for (const action of input.legalActions) {
    if (
      action.type !== "start_run" ||
      typeof action.payload?.serverId !== "string"
    )
      continue;
    const serverId = action.payload.serverId;
    if (seen.has(serverId)) continue;
    seen.add(serverId);
    const server = input.playerView.servers.find(
      (candidate) => candidate.id === serverId,
    );
    if (!server || !runnerStrategicBreakerTargetForMetrics(server)) continue;
    const assessment = assessKnownRezzedIcePath(
      server.ice,
      input.playerView.own.rig ?? [],
      input.playerView.own.credits,
      server.root,
    );
    const visibleBreakCost = assessment.visibleBreakCost ?? 0;
    const creditsAfterPath = input.playerView.own.credits - visibleBreakCost;
    if (!assessment.blocked) broadReady = true;
    if (assessment.blocked) {
      blockers.add(
        visibleBreakCost > input.playerView.own.credits
          ? "insufficient_credits"
          : "no_valuable_target",
      );
      continue;
    }
    if (serverId.startsWith("remote_")) {
      const remoteReady = runnerRemotePressureReadyForMetrics(
        input,
        server,
        creditsAfterPath,
      );
      if (remoteReady) readyTargets.push({ serverId, targetType: "remote" });
      else blockers.add("no_valuable_target");
      continue;
    }
    const central = centralServerId(serverId);
    if (!central) continue;
    if (creditsAfterPath < 1) {
      blockers.add("missing_post_run_reserve");
      continue;
    }
    if (!centralPressureTargetIsGoodForMetrics(input, central)) {
      blockers.add("stale_central");
      continue;
    }
    readyTargets.push({
      serverId,
      targetType: central === "rd" ? "rnd" : central,
    });
  }
  return {
    broadReady,
    readyTargets,
    falsePositive: broadReady && readyTargets.length === 0,
    blockers,
  };
}

function runnerRemotePressureReadyForMetrics(
  input: AiDecisionInput,
  server: AiDecisionInput["playerView"]["servers"][number],
  creditsAfterPath: number,
): boolean {
  const hasVisibleScoreThreat = server.root.some(
    (card) =>
      (card.advancementCounters ?? 0) > 0 ||
      (card.known && card.type === "agenda"),
  );
  const knownMemory =
    reconstructBeliefState(input).runnerOpponentModel?.knownPositionMemory ??
    [];
  const knownRemoteEntries = knownMemory.filter(
    (entry) =>
      entry.zone === server.id && entry.positionKey.startsWith("root:"),
  );
  const knownAgenda = knownRemoteEntries.some(
    (entry) => definitionTypeForMetrics(entry.definitionId) === "agenda",
  );
  const relevantTrash = server.root.some((card) => {
    if (!card.known) return false;
    const trashCost = remoteRootTrashCostForMetrics(card);
    if (trashCost === undefined || creditsAfterPath < trashCost + 1)
      return false;
    if (!card.definitionId) return false;
    const type = definitionTypeForMetrics(card.definitionId);
    return type === "asset" || type === "upgrade";
  });
  return (
    creditsAfterPath >= (hasVisibleScoreThreat || knownAgenda ? 1 : 2) &&
    (hasVisibleScoreThreat || knownAgenda || relevantTrash)
  );
}

function assessRunnerCoveragePressureForMetrics(
  input: AiDecisionInput,
): RunnerCoveragePressureForMetrics {
  const rigCards = input.playerView.own.rig ?? [];
  const gripCards = input.playerView.own.gripOrHq.filter(
    (card) => card.known && card.definitionId,
  );
  const heapCards = input.playerView.own.heapOrArchives.filter(
    (card) => card.known && card.definitionId,
  );
  const missingIceDefinitionIds = new Set<string>();
  const blockedServers = new Set<string>();
  const knownIceBlockedServers = new Set<string>();
  for (const server of input.playerView.servers) {
    if (!runnerStrategicBreakerTargetForMetrics(server)) continue;
    const assessment = assessKnownRezzedIcePath(
      server.ice,
      rigCards,
      input.playerView.own.credits,
      server.root,
    );
    const rezzedMissing = assessment.blocked
      ? server.ice
          .filter(
            (ice) =>
              ice.known &&
              ice.rezzed === true &&
              ice.definitionId &&
              runnerVisibleIceCreatesCoverageNeedForMetrics(ice),
          )
          .map((ice) => ice.definitionId!)
          .filter(
            (definitionId) =>
              !rigCards.some(
                (card) =>
                  card.definitionId &&
                  canBreakerDefinitionBreakIce(card.definitionId, definitionId),
              ),
          )
      : [];
    const knownUnrezzedMissing = server.ice
      .filter(
        (ice) =>
          ice.known &&
          ice.rezzed !== true &&
          ice.definitionId &&
          runnerVisibleIceCreatesCoverageNeedForMetrics(ice),
      )
      .map((ice) => ice.definitionId!)
      .filter(
        (definitionId) =>
          !rigCards.some(
            (card) =>
              card.definitionId &&
              canBreakerDefinitionBreakIce(card.definitionId, definitionId),
          ),
      );
    if (rezzedMissing.length > 0) blockedServers.add(server.id);
    if (knownUnrezzedMissing.length > 0) knownIceBlockedServers.add(server.id);
    for (const definitionId of [...rezzedMissing, ...knownUnrezzedMissing])
      missingIceDefinitionIds.add(definitionId);
  }
  const missingBreakerRoles = new Set(
    [...missingIceDefinitionIds].flatMap(runnerMissingBreakerRolesForMetrics),
  );
  const matchingGripIds = new Set(
    gripCards
      .filter((card) =>
        [...missingIceDefinitionIds].some((iceDefinitionId) =>
          canBreakerDefinitionBreakIce(card.definitionId!, iceDefinitionId),
        ),
      )
      .map((card) => card.instanceId),
  );
  const heapMatchingBreakerCount = heapCards.filter((card) =>
    [...missingIceDefinitionIds].some((iceDefinitionId) =>
      canBreakerDefinitionBreakIce(card.definitionId!, iceDefinitionId),
    ),
  ).length;
  const matchingInstallActionIds = new Set(
    input.legalActions
      .filter(
        (candidate) =>
          candidate.type === "install_card" &&
          typeof candidate.source === "string" &&
          matchingGripIds.has(candidate.source),
      )
      .map((candidate) => candidate.actionId),
  );
  const searchActionIds = new Set(
    input.legalActions
      .filter((candidate) =>
        runnerCoverageSearchActionForMetrics(input, candidate),
      )
      .map((candidate) => candidate.actionId),
  );
  const recoveryActionIds = new Set(
    input.legalActions
      .filter((candidate) =>
        runnerCoverageRecoveryActionForMetrics(input, candidate),
      )
      .filter(() => heapMatchingBreakerCount > 0)
      .map((candidate) => candidate.actionId),
  );
  return {
    blockedServers,
    knownIceBlockedServers,
    missingBreakerRoles,
    matchingInstallActionIds,
    searchActionIds,
    recoveryActionIds,
    heapMatchingBreakerCount,
  };
}

function runnerStrategicBreakerTargetForMetrics(
  server: AiDecisionInput["playerView"]["servers"][number],
): boolean {
  if (server.id === "rd" || server.id === "hq") return true;
  return isRemoteServerTarget(server.id) && server.root.length > 0;
}

function runnerVisibleIceCreatesCoverageNeedForMetrics(
  ice: Pick<VisibleCard, "definitionId" | "effectiveRunQuote">,
): boolean {
  if (!ice.definitionId) return false;
  if (iceHasEndTheRun(ice.definitionId)) return true;
  return (
    ice.effectiveRunQuote?.subroutines.some((subroutine) => {
      const effect = subroutine.unbrokenRunEffect;
      return (
        effect?.addsFutureEndTheRunSubroutines !== undefined ||
        effect?.increasesFutureBreakCostPerSubroutine !== undefined ||
        effect?.preventsFutureBreaking === true ||
        effect?.causesDamageOrProgramTrash === true ||
        effect?.createsRunLockOrActionTax !== undefined
      );
    }) === true
  );
}

function runnerMissingBreakerRolesForMetrics(definitionId: string): string[] {
  const definition =
    RUNTIME_CARDS[definitionId] ?? DEMO_CARDS_BY_ID[definitionId];
  const subtypes = definition?.subtypes ?? [];
  const roles = new Set<string>();
  if (
    subtypes.some((subtype) => runnerSubtypeKeyForMetrics(subtype) === "wall")
  )
    roles.add("breaker_fracter");
  if (
    subtypes.some(
      (subtype) => runnerSubtypeKeyForMetrics(subtype) === "code_gate",
    )
  )
    roles.add("breaker_decoder");
  if (
    subtypes.some((subtype) => runnerSubtypeKeyForMetrics(subtype) === "sentry")
  )
    roles.add("breaker_killer");
  if (roles.size === 0) roles.add("breaker_generic");
  return [...roles].sort();
}

function runnerSubtypeKeyForMetrics(subtype: string): string {
  return subtype
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function runnerCoverageSearchActionForMetrics(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  if (action.side !== "runner") return false;
  if (
    action.type !== "play_event" &&
    action.type !== "resolve_choice" &&
    action.type !== "trigger_ability" &&
    action.type !== "activated_card_ability"
  )
    return false;
  const roles = rolesForAction(input, action);
  const sourceCard =
    typeof action.source === "string"
      ? findVisibleCard(input, action.source)
      : undefined;
  const sourceDefinition = sourceCard?.definitionId
    ? (RUNTIME_CARDS[sourceCard.definitionId] ??
      DEMO_CARDS_BY_ID[sourceCard.definitionId])
    : undefined;
  const mechanics =
    sourceDefinition &&
    "mechanics" in sourceDefinition &&
    Array.isArray(sourceDefinition.mechanics)
      ? sourceDefinition.mechanics
      : [];
  return (
    roles.some(
      (role) =>
        role.includes("search") ||
        role.includes("tutor") ||
        role === "program_search" ||
        role === "stack_search" ||
        role === "search_stack" ||
        role === "search_trash" ||
        role === "setup_search" ||
        role.includes("recovery") ||
        role.includes("trash_recovery"),
    ) ||
    mechanics.some(
      (mechanic: string) =>
        mechanic.includes("search") ||
        mechanic.includes("tutor") ||
        mechanic.includes("hidden_zone_tool"),
    )
  );
}

function runnerCoverageRecoveryActionForMetrics(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  const roles = rolesForAction(input, action);
  return roles.some(
    (role) =>
      role.includes("recovery") ||
      role.includes("trash_recovery") ||
      role === "search_trash",
  );
}

function runnerHandUseDiagnosticsForSimulationAction(
  input: AiDecisionInput,
  decision: AiDecision,
  action: LegalAction,
  targetServerId: string | undefined,
): Partial<AiSimulationSummary["actionSequence"][number]> {
  if (input.side !== "runner" || action.side !== "runner") return {};
  const draw = runnerDrawKindForSimulationAction(input, action);
  const playableEconomy = hasRunnerPlayableEconomyAction(
    input,
    action.actionId,
  );
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
  const duplicateInstall =
    installAction && isRunnerDuplicateInstall(input, action);
  const lowValueDuplicate =
    duplicateInstall && isRunnerLowValueDuplicateInstall(input, action);
  const economyActionTaken = isRunnerEconomyAction(input, action);
  const rigInstallAction =
    installAction && isRunnerRigInstallAction(input, action);
  const pressureActionTaken = isRunnerPressureAction(input, action);
  const remoteTrashTaken =
    action.type === "trash_accessed_card" &&
    isRemoteServerTarget(
      targetServerId ?? input.playerView.run?.attackedServerId,
    );
  const remoteTrash = runnerRemoteTrashAccessContext(input, action);
  const advancedRemoteContest = runnerAdvancedRemoteContestContext(
    input,
    action,
    targetServerId,
  );
  const handUseOpportunity =
    playableEconomy ||
    installableBreaker ||
    runnablePressure ||
    remoteTrashAvailable;
  const handUseActionTaken =
    economyActionTaken ||
    rigInstallAction ||
    pressureActionTaken ||
    remoteTrashTaken;

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
    ...(lowValueDuplicate
      ? { runnerLowValueDuplicateInstallAction: true }
      : {}),
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
    ...(remoteTrash.relevantTaken
      ? { runnerRelevantRemoteTrashTaken: true }
      : {}),
    ...(remoteTrash.skippedAffordableRelevant
      ? { runnerSkippedAffordableRelevantRemoteTrash: true }
      : {}),
    ...(remoteTrash.targetType
      ? { runnerRemoteTrashTargetType: remoteTrash.targetType }
      : {}),
    ...(remoteTrash.role ? { runnerRemoteTrashRole: remoteTrash.role } : {}),
    ...(remoteTrash.trashable && action.type === "decline_trash"
      ? { runnerRemoteTrashDeclined: true }
      : {}),
    ...(remoteTrash.trashable
      ? {
          runnerRemoteTrashCost: remoteTrash.trashCost,
          runnerRemoteTrashCostBucket: remoteTrashCostBucket(
            remoteTrash.trashCost,
          ),
          runnerRemoteTrashLegalActionCount: remoteTrash.legalTrashActionCount,
        }
      : {}),
    ...(remoteTrash.role === "economy"
      ? { runnerRemoteTrashAssetEconomy: true }
      : {}),
    ...(remoteTrash.finitePoolEconomy
      ? { runnerRemoteTrashFinitePoolEconomy: true }
      : {}),
    ...(remoteTrash.corpValueRemaining > 0
      ? { runnerRemoteTrashCorpValueRemaining: remoteTrash.corpValueRemaining }
      : {}),
    ...(remoteTrash.bbsWhisperingCampaign
      ? { runnerBbsWhisperingCampaignAccessed: true }
      : {}),
    ...(remoteTrash.bbsWhisperingCampaign &&
    remoteTrash.legalTrashActionCount > 0
      ? { runnerBbsWhisperingCampaignTrashLegal: true }
      : {}),
    ...(remoteTrash.bbsWhisperingCampaign && remoteTrashTaken
      ? { runnerBbsWhisperingCampaignTrashTaken: true }
      : {}),
    ...(remoteTrash.bbsWhisperingCampaign && action.type === "decline_trash"
      ? { runnerBbsWhisperingCampaignTrashSkipped: true }
      : {}),
    ...(remoteTrash.bbsWhisperingCampaign &&
    remoteTrash.skippedAffordableRelevant
      ? { runnerBbsWhisperingCampaignTrashSkippedAffordable: true }
      : {}),
    ...(remoteTrash.finitePoolEconomy
      ? { runnerFinitePoolAssetAccessed: true }
      : {}),
    ...(remoteTrash.finitePoolEconomy && remoteTrash.legalTrashActionCount > 0
      ? { runnerFinitePoolAssetTrashLegal: true }
      : {}),
    ...(remoteTrash.finitePoolEconomy && remoteTrashTaken
      ? { runnerFinitePoolAssetTrashTaken: true }
      : {}),
    ...(remoteTrash.finitePoolEconomy && remoteTrash.skippedAffordableRelevant
      ? { runnerFinitePoolAssetTrashSkippedAffordable: true }
      : {}),
    ...(remoteTrash.skippedAffordableRelevant
      ? { runnerRemoteTrashFixGateEligible: true }
      : {}),
    ...(remoteTrash.deferredByBudget
      ? { runnerRemoteTrashFixGateBlockedByReserve: true }
      : {}),
    ...(remoteTrash.trashable &&
    remoteTrash.legalTrashActionCount === 0 &&
    input.playerView.own.credits < remoteTrash.trashCost
      ? { runnerRemoteTrashFixGateBlockedByLowCredits: true }
      : {}),
    ...(remoteTrash.skippedAffordableRelevant && action.type === "steal_agenda"
      ? { runnerRemoteTrashFixGateBlockedByHigherThreat: true }
      : {}),
    ...(remoteTrash.skippedAffordableRelevant &&
    action.type !== "steal_agenda" &&
    !remoteTrash.deferredByBudget
      ? { runnerRemoteTrashFixGateSuspicious: true }
      : {}),
    ...(remoteTrash.expensive
      ? { runnerExpensiveRemoteTrashOpportunity: true }
      : {}),
    ...(remoteTrash.expensive && remoteTrashTaken
      ? { runnerExpensiveRemoteTrashTaken: true }
      : {}),
    ...(remoteTrash.expensive &&
    remoteTrash.trashable &&
    action.type === "decline_trash"
      ? { runnerExpensiveRemoteTrashDeclined: true }
      : {}),
    ...(remoteTrash.highImpact && remoteTrashTaken
      ? { runnerHighImpactRemoteTrashTaken: true }
      : {}),
    ...(remoteTrash.deferredByBudget
      ? { runnerHighImpactRemoteTrashDeferredByBudget: true }
      : {}),
    ...(remoteTrash.highImpact &&
    remoteTrash.expensive &&
    !remoteTrash.acuteThreat &&
    action.type === "decline_trash"
      ? { runnerHighImpactRemoteTrashSkippedNoThreat: true }
      : {}),
    ...(remoteTrash.role === "low_value" && action.type === "decline_trash"
      ? { runnerLowValueRemoteTrashSkipped: true }
      : {}),
    ...(remoteTrashTaken && input.actionNumber <= 20
      ? { runnerRemoteTrashSpentEarlyGame: true }
      : {}),
    ...(remoteTrashTaken
      ? {
          runnerCreditsAfterRemoteTrash: remoteTrash.creditsAfterGeneralTrash,
          dedicatedTrashCreditsUsed: remoteTrash.dedicatedTrashCredits,
          generalCreditsSpentOnTrash: remoteTrash.generalCreditCost,
        }
      : {}),
    ...(remoteTrashTaken && remoteTrash.dropsBelowReserve
      ? { runnerRemoteTrashDroppedBelowReserve: true }
      : {}),
    ...(remoteTrashTaken && !remoteTrash.dropsBelowReserve
      ? { runnerRemoteTrashPreservedReserve: true }
      : {}),
    ...(remoteTrashTaken && remoteTrash.acuteThreat
      ? { runnerRemoteTrashProtectedScoreThreat: true }
      : {}),
    ...(remoteTrashTaken && !remoteTrash.acuteThreat
      ? { runnerRemoteTrashWithoutImmediateThreat: true }
      : {}),
    ...(remoteTrashTaken &&
    remoteTrash.dropsBelowReserve &&
    !remoteTrash.acuteThreat
      ? { trashDecisionLeftRunnerUnableToContest: true }
      : {}),
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

function runnerEconomySetupDiagnosticsForSimulationAction(
  input: AiDecisionInput,
  action: LegalAction,
  targetServerId: string | undefined,
  stateAfterAction: GameState,
): Partial<AiSimulationSummary["actionSequence"][number]> {
  if (input.side !== "runner" || action.side !== "runner") return {};
  const legalRunnerActions = input.legalActions.filter(
    (candidate) => candidate.side === "runner",
  );
  const classified = legalRunnerActions.map((candidate) => ({
    action: candidate,
    classification: runnerEconomySetupActionClass(input, candidate),
  }));
  const legalEconomy = classified.filter(
    ({ classification }) => classification.economy,
  );
  const legalMemory = classified.filter(
    ({ classification }) => classification.memoryHardware,
  );
  const legalHandSize = classified.filter(
    ({ classification }) => classification.handSizeSupport,
  );
  const legalSearch = classified.filter(
    ({ classification }) => classification.search,
  );
  const legalRecovery = classified.filter(
    ({ classification }) => classification.recovery,
  );
  const chosen = runnerEconomySetupActionClass(input, action);
  const economyWindow = legalEconomy.length > 0;
  const economyTaken = economyWindow && chosen.economy;
  const economySkipped = economyWindow && !economyTaken;
  const reserveTarget = runnerCreditReserveTargetForInput(input);
  const creditsBefore = input.playerView.own.credits;
  const creditsAfter = stateAfterAction.runner.credits;
  const lowCredits = creditsBefore < reserveTarget;
  const knownUnaffordablePath = runnerHasKnownUnaffordableLegalRun(input);
  const advancedRemoteContest = runnerAdvancedRemoteContestContext(
    input,
    action,
    targetServerId,
  );
  const freshPressureAvailable = hasRunnerRunnablePressureAction(
    input,
    action.actionId,
  );
  const installableBreaker = hasRunnerInstallableBreakerAction(
    input,
    action.actionId,
  );
  const remoteTrashAvailable = hasRunnerRemoteTrashAction(input);
  const draw = runnerDrawKindForSimulationAction(input, action).draw;
  const runAction = action.type === "start_run";
  const setupAction =
    action.type === "install_card" &&
    (isRunnerRigInstallAction(input, action) || installableBreaker);
  const relevantSkippedReason = economySkipped
    ? runnerEconomySkipReasonForDiagnostics({
        action,
        draw,
        runAction,
        setupAction,
        installableBreaker,
        remoteTrashAvailable,
        advancedRemoteContestSkipped: advancedRemoteContest.skipped,
        freshPressureAvailable,
      })
    : undefined;
  const rich = creditsBefore >= Math.max(8, reserveTarget + 3);
  const economyNeeded = lowCredits || knownUnaffordablePath;
  const economyReserveSetup =
    economyTaken &&
    creditsBefore < reserveTarget &&
    creditsAfter >= reserveTarget;
  const economyStillBelowReserve = economyTaken && creditsAfter < reserveTarget;
  const finiteSeen = legalEconomy.some(
    ({ classification }) => classification.finitePoolEconomy,
  );
  const finiteTaken = economyTaken && chosen.finitePoolEconomy;
  const debtSeen = legalEconomy.some(
    ({ classification }) => classification.loanDebtEconomy,
  );
  const debtTaken = economyTaken && chosen.loanDebtEconomy;
  const downsideSeen = legalEconomy.some(
    ({ classification }) => classification.downsideEconomy,
  );
  const downsideTaken = economyTaken && chosen.downsideEconomy;
  const memoryWindow = legalMemory.length > 0;
  const handSizeWindow = legalHandSize.length > 0;
  const missingBreakerCoverage =
    runnerVisibleMissingBreakerCoverage(input) ||
    runnerHasKnownBlockedPathByCoverage(input);
  const missingCoverageTypes = runnerMissingCoverageTypesForInput(input);
  const legalProgramInstalls = legalRunnerActions.filter((candidate) => {
    if (candidate.type !== "install_card") return false;
    const definition = definitionForSimulationAction(input, candidate);
    return definition?.type === "program";
  }).length;
  const handSizeNeedVisible =
    (input.playerView.own.tags ?? 0) > 0 ||
    (input.playerView.own.gripOrHq?.length ?? 0) >
      Math.max(0, input.playerView.own.maxHandSize ?? 5);
  const memorySkipped = memoryWindow && !chosen.memoryHardware;
  const handSizeSkipped = handSizeWindow && !chosen.handSizeSupport;
  const searchTaken = chosen.search;
  const recoveryTaken = chosen.recovery;
  const searchSkippedWithCoverage =
    legalSearch.length > 0 && !searchTaken && missingBreakerCoverage;
  const recoverySkippedWithCoverage =
    legalRecovery.length > 0 && !recoveryTaken && missingBreakerCoverage;
  const economyOverPressure = economyTaken && freshPressureAvailable;
  const economyOverRemoteContest =
    economyTaken && advancedRemoteContest.skipped;
  const economyOverSetup = economyTaken && installableBreaker;
  const economyOverTrash = economyTaken && remoteTrashAvailable;
  const economyPlausible =
    economyTaken &&
    (economyNeeded || economyReserveSetup || creditsAfter < reserveTarget + 2);
  const economySuspicious =
    economyTaken &&
    !economyPlausible &&
    ((rich && (freshPressureAvailable || advancedRemoteContest.opportunity)) ||
      economyOverRemoteContest ||
      economyOverTrash ||
      (debtTaken && !economyNeeded));
  const suspiciousEconomyOverPressure =
    economyOverPressure && !economyPlausible && (rich || !economyNeeded);
  const suspiciousEconomyOverRemoteContest =
    economyOverRemoteContest && !economyPlausible && (rich || !economyNeeded);
  const classifications = sortedUnique([
    ...(economyWindow ? ["runner_economy_window"] : []),
    ...(economyTaken ? ["runner_economy_taken"] : []),
    ...(economySkipped ? ["runner_economy_skipped"] : []),
    ...(finiteSeen ? ["finite_pool_economy_seen"] : []),
    ...(debtSeen ? ["debt_economy_seen"] : []),
    ...(memoryWindow ? ["memory_hardware_window"] : []),
    ...(handSizeWindow ? ["hand_size_window"] : []),
    ...(legalSearch.length > 0 ? ["search_window"] : []),
    ...(legalRecovery.length > 0 ? ["recovery_window"] : []),
    ...(economySuspicious ? ["economy_choice_suspicious"] : []),
    ...(economyPlausible ? ["economy_choice_plausible"] : []),
  ]);
  const evidence = sortedUnique([
    `runner_credits:${creditsBefore}`,
    `runner_reserve_target:${reserveTarget}`,
    `legal_economy_actions:${legalEconomy.length}`,
    `legal_memory_hardware_actions:${legalMemory.length}`,
    `legal_hand_size_actions:${legalHandSize.length}`,
    `legal_search_actions:${legalSearch.length}`,
    `legal_recovery_actions:${legalRecovery.length}`,
    `known_unaffordable_path:${knownUnaffordablePath}`,
    `missing_breaker_coverage:${missingBreakerCoverage}`,
    ...(chosen.handSizeSupport
      ? ["mram_militech_classified_as_hand_size:true"]
      : []),
  ]);

  return {
    ...(economyWindow ? { runnerEconomyDecisionWindow: true } : {}),
    ...(legalEconomy.length > 0
      ? { runnerLegalEconomyActions: legalEconomy.length }
      : {}),
    ...runnerEconomySubcounts(
      legalEconomy.map((entry) => entry.classification),
    ),
    ...(economyTaken ? { runnerEconomyTaken: true } : {}),
    ...(economySkipped ? { runnerEconomySkipped: true } : {}),
    ...(economySkipped && lowCredits
      ? { runnerEconomySkippedWhileLowCredits: true }
      : {}),
    ...(economySkipped && knownUnaffordablePath
      ? { runnerEconomySkippedWhileKnownUnaffordablePath: true }
      : {}),
    ...(relevantSkippedReason === "pressure"
      ? { runnerEconomySkippedForPressure: true }
      : {}),
    ...(relevantSkippedReason === "remote_contest"
      ? { runnerEconomySkippedForRemoteContest: true }
      : {}),
    ...(relevantSkippedReason === "setup"
      ? { runnerEconomySkippedForSetup: true }
      : {}),
    ...(relevantSkippedReason === "draw"
      ? { runnerEconomySkippedForDraw: true }
      : {}),
    ...(relevantSkippedReason === "run"
      ? { runnerEconomySkippedForRun: true }
      : {}),
    ...(relevantSkippedReason === "install_breaker"
      ? { runnerEconomySkippedForInstallBreaker: true }
      : {}),
    ...(relevantSkippedReason === "trash"
      ? { runnerEconomySkippedForTrash: true }
      : {}),
    ...(relevantSkippedReason === "end_turn"
      ? { runnerEconomySkippedForEndTurn: true }
      : {}),
    ...(relevantSkippedReason === "unknown_higher_priority"
      ? { runnerEconomySkippedForUnknownHigherPriority: true }
      : {}),
    ...(lowCredits ? { runnerLowCreditDecisionWindow: true } : {}),
    ...(economyWindow && lowCredits
      ? { runnerCreditStarvedWithLegalEconomy: true }
      : {}),
    ...(economyTaken && lowCredits
      ? { runnerCreditStarvedEconomyTaken: true }
      : {}),
    ...(economySkipped && lowCredits
      ? { runnerCreditStarvedEconomySkipped: true }
      : {}),
    ...(economyWindow && knownUnaffordablePath
      ? { runnerKnownUnaffordablePathWithLegalEconomy: true }
      : {}),
    ...(economyReserveSetup
      ? { runnerEconomyTakenToReachRunReserve: true }
      : {}),
    ...(economyStillBelowReserve
      ? { runnerEconomyTakenButStillBelowReserve: true }
      : {}),
    ...(economySkipped && knownUnaffordablePath
      ? {
          runnerEconomySkippedThenUnaffordableRun: true,
          runnerRunStartedAfterSkippingEconomy: runAction,
        }
      : {}),
    ...(runAction &&
    runnerRunKnownPathCost(input, targetServerId) > creditsBefore
      ? { runnerRunStartedBelowKnownPathCost: true }
      : {}),
    ...(economyOverPressure
      ? { runnerEconomyChosenOverFreshCentralPressure: true }
      : {}),
    ...(economyOverRemoteContest
      ? { runnerEconomyChosenOverRemoteContest: true }
      : {}),
    ...(economyOverSetup
      ? { runnerEconomyChosenOverBreakerInstall: true }
      : {}),
    ...(economyOverSetup ? { runnerEconomyChosenOverCriticalSetup: true } : {}),
    ...(economyOverTrash ? { runnerEconomyChosenOverRelevantTrash: true } : {}),
    ...(economyTaken && rich ? { runnerEconomyChosenWhileRich: true } : {}),
    ...(economyTaken && freshPressureAvailable
      ? { runnerEconomyChosenWhilePressureReady: true }
      : {}),
    ...(economyReserveSetup ? { runnerEconomyChosenAsReserveSetup: true } : {}),
    ...(economyPlausible ? { runnerEconomyChoicePlausible: true } : {}),
    ...(economySuspicious ? { runnerEconomyChoiceSuspicious: true } : {}),
    ...(finiteSeen ? { runnerFinitePoolEconomySeen: true } : {}),
    ...(finiteTaken ? { runnerFinitePoolEconomyTaken: true } : {}),
    ...(finiteSeen && economySkipped
      ? { runnerFinitePoolEconomySkipped: true }
      : {}),
    ...(debtSeen ? { runnerDebtEconomySeen: true } : {}),
    ...(debtTaken ? { runnerDebtEconomyTaken: true } : {}),
    ...(debtSeen && economySkipped ? { runnerDebtEconomySkipped: true } : {}),
    ...(debtTaken && !economyNeeded
      ? { runnerDebtEconomyTakenWithoutNeed: true }
      : {}),
    ...(downsideSeen ? { runnerEconomyWithDownsideSeen: true } : {}),
    ...(downsideTaken ? { runnerEconomyWithDownsideTaken: true } : {}),
    ...(chosen.delayedPenaltyEconomy
      ? { runnerDelayedPenaltyEconomyTaken: true }
      : {}),
    ...(memoryWindow ? { runnerMemoryBottleneckDecisionWindow: true } : {}),
    ...(handSizeWindow ? { runnerHandSizeBottleneckDecisionWindow: true } : {}),
    ...(legalMemory.length > 0
      ? { runnerLegalMemoryHardwareActions: legalMemory.length }
      : {}),
    ...(legalHandSize.length > 0
      ? { runnerLegalHandSizeActions: legalHandSize.length }
      : {}),
    ...(chosen.memoryHardware ? { runnerMemoryHardwareTaken: true } : {}),
    ...(chosen.handSizeSupport
      ? {
          runnerHandSizeSupportTaken: true,
          runnerHandSizeFactUsedForDiagnosis: true,
        }
      : {}),
    ...(memorySkipped && legalProgramInstalls > 0
      ? { runnerMemorySupportSkippedWhileGripHasPrograms: true }
      : {}),
    ...(handSizeSkipped && handSizeNeedVisible
      ? { runnerHandSizeSupportSkippedWhileDamageRiskVisible: true }
      : {}),
    ...(chosen.memoryHardware || chosen.handSizeSupport
      ? {
          ...(economyWindow && !economyTaken
            ? { runnerHardwareSetupChosenOverEconomy: true }
            : {}),
          ...(freshPressureAvailable
            ? { runnerHardwareSetupChosenOverPressure: true }
            : {}),
        }
      : {}),
    ...(legalSearch.length > 0
      ? { runnerLegalSearchActions: legalSearch.length }
      : {}),
    ...(legalRecovery.length > 0
      ? { runnerLegalRecoveryActions: legalRecovery.length }
      : {}),
    ...(searchTaken ? { runnerSearchTaken: true } : {}),
    ...(recoveryTaken ? { runnerRecoveryTaken: true } : {}),
    ...(searchSkippedWithCoverage
      ? { runnerSearchSkippedWhileMissingBreakerCoverage: true }
      : {}),
    ...(recoverySkippedWithCoverage
      ? { runnerRecoverySkippedWhileMissingBreakerCoverage: true }
      : {}),
    ...(searchTaken && missingBreakerCoverage
      ? { runnerSearchTakenForBreakerCoverage: true }
      : {}),
    ...(recoveryTaken && missingBreakerCoverage
      ? { runnerRecoveryTakenForBreakerCoverage: true }
      : {}),
    ...((searchTaken || recoveryTaken) && economyWindow && !economyTaken
      ? { runnerSearchRecoveryChosenOverEconomy: true }
      : {}),
    ...((searchTaken || recoveryTaken) && freshPressureAvailable
      ? { runnerSearchRecoveryChosenOverPressure: true }
      : {}),
    ...(economySkipped && lowCredits && knownUnaffordablePath
      ? { runnerEconomyFixGateEligibleStarvedSkip: true }
      : {}),
    ...(economyTaken && rich
      ? { runnerEconomyFixGateSuspiciousRichEconomy: true }
      : {}),
    ...(suspiciousEconomyOverPressure
      ? { runnerEconomyFixGateSuspiciousEconomyOverPressure: true }
      : {}),
    ...(suspiciousEconomyOverRemoteContest
      ? { runnerEconomyFixGateSuspiciousEconomyOverRemoteContest: true }
      : {}),
    ...(debtTaken && !economyNeeded
      ? { runnerEconomyFixGateSuspiciousDebtEconomyWithoutNeed: true }
      : {}),
    ...(memorySkipped && legalProgramInstalls > 0
      ? { runnerSetupFixGateEligibleMemorySkip: true }
      : {}),
    ...(searchSkippedWithCoverage || recoverySkippedWithCoverage
      ? { runnerSetupFixGateEligibleSearchRecoverySkip: true }
      : {}),
    ...(missingCoverageTypes.length > 0
      ? { runnerSetupMissingCoverageTypes: missingCoverageTypes }
      : {}),
    ...(economySkipped || searchSkippedWithCoverage || memorySkipped
      ? {
          runnerSetupAttributionEvidence: sortedUnique([
            `chosen_action_type:${action.type}`,
            `chosen_reason_family:${runnerSetupChosenFamilyForEntry({
              actionType: action.type,
              runnerEconomyTaken: chosen.economy,
              runnerDrawAction: draw,
              runnerRigInstallAction: setupAction,
              runnerSearchTaken: searchTaken,
              runnerRecoveryTaken: recoveryTaken,
              runnerRemoteTrashTaken: action.type === "trash_accessed_card",
            })}`,
            `runner_credits:${creditsBefore}`,
            `reserve_target:${reserveTarget}`,
            `known_path_affordable:${!knownUnaffordablePath}`,
            `missing_coverage_types:${missingCoverageTypes.join(",") || "none"}`,
          ]),
        }
      : {}),
    ...(classifications.length > 0
      ? { runnerEconomySetupClassifications: classifications }
      : {}),
    ...(classifications.length > 0
      ? { runnerEconomySetupEvidence: evidence }
      : {}),
  };
}

function runnerEconomySubcounts(
  classifications: RunnerEconomySetupActionClass[],
): Partial<AiSimulationSummary["actionSequence"][number]> {
  const count = (
    selector: (classification: RunnerEconomySetupActionClass) => boolean,
  ) => classifications.filter(selector).length;
  return {
    ...(count((classification) => classification.burstEconomy) > 0
      ? {
          runnerLegalBurstEconomyActions: count(
            (classification) => classification.burstEconomy,
          ),
        }
      : {}),
    ...(count((classification) => classification.actionEconomy) > 0
      ? {
          runnerLegalActionEconomyActions: count(
            (classification) => classification.actionEconomy,
          ),
        }
      : {}),
    ...(count((classification) => classification.finitePoolEconomy) > 0
      ? {
          runnerLegalFinitePoolEconomyActions: count(
            (classification) => classification.finitePoolEconomy,
          ),
        }
      : {}),
    ...(count((classification) => classification.loanDebtEconomy) > 0
      ? {
          runnerLegalLoanDebtEconomyActions: count(
            (classification) => classification.loanDebtEconomy,
          ),
        }
      : {}),
    ...(count((classification) => classification.recurringEconomy) > 0
      ? {
          runnerLegalRecurringEconomyActions: count(
            (classification) => classification.recurringEconomy,
          ),
        }
      : {}),
    ...(count((classification) => classification.resourceEconomy) > 0
      ? {
          runnerLegalResourceEconomyActions: count(
            (classification) => classification.resourceEconomy,
          ),
        }
      : {}),
    ...(count((classification) => classification.hardwareEconomy) > 0
      ? {
          runnerLegalHardwareEconomyActions: count(
            (classification) => classification.hardwareEconomy,
          ),
        }
      : {}),
  };
}

function runnerEconomySetupActionClass(
  input: AiDecisionInput,
  action: LegalAction,
): RunnerEconomySetupActionClass {
  const definitionId = sourceDefinitionIdForSimulationAction(input, action);
  const definition = definitionForSimulationAction(input, action);
  const roles = rolesForAction(input, action);
  const mechanics =
    definition &&
    "mechanics" in definition &&
    Array.isArray(definition.mechanics)
      ? definition.mechanics
      : [];
  const isShortTermContract = definitionId === "onr_v1_178_short-term-contract";
  const isLoanFromChiba = definitionId === "onr_v1_168_loan-from-chiba";
  const isMramHandSize =
    definitionId === "onr_v1_133_militech-mram-chip" ||
    definitionId === "onr_v1_134_mram-chip";
  const economy = isRunnerEconomyAction(input, action);
  const search = runnerCoverageSearchActionForMetrics(input, action);
  const recovery = runnerCoverageRecoveryActionForMetrics(input, action);
  const handSizeSupport =
    isMramHandSize ||
    roles.some(
      (role) =>
        role.includes("hand_size") ||
        role.includes("damage_resilience") ||
        role.includes("damage_prevention"),
    ) ||
    mechanics.some(
      (mechanic: string) =>
        mechanic.includes("hand") || mechanic.includes("damage_prevention"),
    );
  const memoryHardware =
    !handSizeSupport &&
    action.type === "install_card" &&
    (roles.includes("memory") ||
      roles.includes("memory_support") ||
      mechanics.some((mechanic: string) => mechanic.includes("memory")));
  return {
    economy,
    burstEconomy: economy && action.type === "play_event",
    actionEconomy:
      economy &&
      (action.type === "gain_credit" ||
        action.type === "trigger_ability" ||
        action.type === "activated_card_ability"),
    finitePoolEconomy:
      economy &&
      (isShortTermContract ||
        roles.some(
          (role) => role.includes("finite") || role.includes("pool"),
        ) ||
        mechanics.some(
          (mechanic: string) =>
            mechanic.includes("counter") ||
            mechanic.includes("resource_action"),
        )),
    loanDebtEconomy:
      economy &&
      (isLoanFromChiba ||
        roles.some((role) => role.includes("loan") || role.includes("debt"))),
    recurringEconomy:
      economy &&
      roles.some((role) => role.includes("recurring") || role.includes("drip")),
    resourceEconomy: economy && definition?.type === "resource",
    hardwareEconomy: economy && definition?.type === "hardware",
    memoryHardware,
    handSizeSupport,
    search,
    recovery,
    downsideEconomy:
      economy &&
      (isLoanFromChiba ||
        roles.some(
          (role) =>
            role.includes("risk") ||
            role.includes("downside") ||
            role.includes("penalty") ||
            role.includes("tag"),
        )),
    delayedPenaltyEconomy:
      economy &&
      (isLoanFromChiba ||
        roles.some(
          (role) => role.includes("delayed") || role.includes("penalty"),
        )),
  };
}

function definitionForSimulationAction(
  input: AiDecisionInput,
  action: LegalAction,
) {
  const definitionId = sourceDefinitionIdForSimulationAction(input, action);
  return definitionId
    ? (RUNTIME_CARDS[definitionId] ?? DEMO_CARDS_BY_ID[definitionId])
    : undefined;
}

function runnerEconomySkipReasonForDiagnostics(context: {
  action: LegalAction;
  draw: boolean;
  runAction: boolean;
  setupAction: boolean;
  installableBreaker: boolean;
  remoteTrashAvailable: boolean;
  advancedRemoteContestSkipped: boolean;
  freshPressureAvailable: boolean;
}):
  | "pressure"
  | "remote_contest"
  | "setup"
  | "draw"
  | "run"
  | "install_breaker"
  | "trash"
  | "end_turn"
  | "unknown_higher_priority" {
  if (context.advancedRemoteContestSkipped) return "remote_contest";
  if (
    context.action.type === "trash_accessed_card" ||
    context.remoteTrashAvailable
  )
    return "trash";
  if (context.installableBreaker && context.action.type === "install_card")
    return "install_breaker";
  if (context.setupAction) return "setup";
  if (context.draw) return "draw";
  if (context.runAction && context.freshPressureAvailable) return "pressure";
  if (context.runAction) return "run";
  if (context.action.type === "end_turn") return "end_turn";
  return "unknown_higher_priority";
}

function runnerHasKnownUnaffordableLegalRun(input: AiDecisionInput): boolean {
  return input.legalActions.some((action) => {
    if (
      action.side !== "runner" ||
      action.type !== "start_run" ||
      typeof action.payload?.serverId !== "string"
    )
      return false;
    return (
      runnerRunKnownPathCost(input, action.payload.serverId) >
      input.playerView.own.credits
    );
  });
}

function runnerRunKnownPathCost(
  input: AiDecisionInput,
  targetServerId: string | undefined,
): number {
  if (!targetServerId) return 0;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === targetServerId,
  );
  if (!server) return 0;
  return (
    assessKnownRezzedIcePath(
      server.ice,
      input.playerView.own.rig ?? [],
      input.playerView.own.credits,
      server.root,
    ).visibleBreakCost ?? 0
  );
}

function runnerVisibleMissingBreakerCoverage(input: AiDecisionInput): boolean {
  const rigRoles = new Set(
    (input.playerView.own.rig ?? []).flatMap((card) =>
      rolesForCardId(card.definitionId),
    ),
  );
  return input.playerView.servers.some((server) =>
    server.ice
      .filter(
        (ice): ice is typeof ice & { definitionId: string } =>
          ice.known && typeof ice.definitionId === "string",
      )
      .flatMap((ice) => runnerMissingBreakerRolesForMetrics(ice.definitionId))
      .some((role) => !rigRoles.has(role)),
  );
}

function runnerMissingCoverageTypesForInput(
  input: AiDecisionInput,
): RunnerSetupMissingCoverageType[] {
  const rigRoles = new Set(
    (input.playerView.own.rig ?? []).flatMap((card) =>
      rolesForCardId(card.definitionId),
    ),
  );
  const missing = new Set<RunnerSetupMissingCoverageType>();
  for (const server of input.playerView.servers) {
    for (const ice of server.ice) {
      if (!ice.known || typeof ice.definitionId !== "string") continue;
      for (const role of runnerMissingBreakerRolesForMetrics(
        ice.definitionId,
      )) {
        if (rigRoles.has(role)) continue;
        if (role === "breaker_fracter") missing.add("wall");
        else if (role === "breaker_decoder") missing.add("code_gate");
        else if (role === "breaker_killer") missing.add("sentry");
        else missing.add("universal");
      }
      if (
        ice.effectiveRunQuote?.subroutines.some(
          (subroutine) =>
            String(subroutine.type).includes("trace") ||
            String(subroutine.type).includes("damage"),
        ) === true
      )
        missing.add("special");
    }
  }
  return [...missing].sort();
}

function runnerHasKnownBlockedPathByCoverage(input: AiDecisionInput): boolean {
  return input.playerView.servers.some(
    (server) =>
      assessKnownRezzedIcePath(
        server.ice,
        input.playerView.own.rig ?? [],
        input.playerView.own.credits,
        server.root,
      ).blocked,
  );
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
      .filter((card) =>
        isCentralPressureCardForMetrics(card.definitionId, true),
      )
      .flatMap((card) => centralPressureTargetsForCard(card.definitionId)),
  );
  const hasAnyInstalledInterface = installedInterfaceTargets.size > 0;
  const sourceDefinitionId = sourceDefinitionIdForSimulationAction(
    input,
    action,
  );
  const eventTargets =
    action.type === "play_event"
      ? centralPressureTargetsForCard(sourceDefinitionId)
      : [];
  const eventGoodTarget = eventTargets.some((target) =>
    centralPressureTargetIsGoodForMetrics(input, target),
  );
  const interfaceInstallOpportunity = input.legalActions.some((candidate) => {
    if (candidate.type !== "install_card") return false;
    const definitionId = sourceDefinitionIdForSimulationAction(
      input,
      candidate,
    );
    return isCentralPressureCardForMetrics(definitionId, true);
  });
  const interfaceInstallTaken =
    action.type === "install_card" &&
    isCentralPressureCardForMetrics(sourceDefinitionId, true);
  const closeoutOpportunityRaw =
    input.playerView.agendaPointsToWin - input.playerView.own.agendaPoints <=
      2 &&
    (centralTarget !== undefined ||
      (["hq", "rd"] as const).some((target) =>
        centralPressureTargetIsGoodForMetrics(input, target),
      ));
  const trueCloseout = centralTarget
    ? trueCentralCloseoutProfileForMetrics(input, centralTarget)
    : bestTrueCentralCloseoutProfileForMetrics(input);
  const centralRun = action.type === "start_run" && centralTarget !== undefined;
  const matchingInterface =
    centralTarget !== undefined && installedInterfaceTargets.has(centralTarget);
  const anyMultiaccessInstalled = (input.playerView.own.rig ?? []).some(
    (card) =>
      rolesForCardId(card.definitionId).some((role) =>
        role.includes("multiaccess"),
      ),
  );
  const repeatedLowValue =
    centralTarget !== undefined &&
    centralRun &&
    isRepeatedLowValueCentralRunForMetrics(input, centralTarget) &&
    !centralRepeatHasFreshValueForMetrics(input, centralTarget, {
      matchingInterface,
      anyMultiaccessInstalled,
      eventGoodTarget,
      trueCloseout: trueCloseout.opportunity,
    });
  const repeatWindow =
    centralTarget !== undefined &&
    centralRun &&
    centralRunStreakWithoutValueForMetrics(input, centralTarget) > 0;
  const repeatWithFreshValue =
    centralTarget !== undefined &&
    centralRun &&
    repeatWindow &&
    centralRepeatHasFreshValueForMetrics(input, centralTarget, {
      matchingInterface,
      anyMultiaccessInstalled,
      eventGoodTarget,
      trueCloseout: trueCloseout.opportunity,
    });
  const noFresh = runnerNoFreshCentralContextForMetrics(input);
  const noFreshRunTaken =
    centralRun &&
    centralTarget !== undefined &&
    noFresh.targets.includes(centralTarget);
  const substitutionType =
    noFresh.targets.length > 0 && !noFreshRunTaken
      ? noFreshCentralSubstitutionTypeForAction(input, action)
      : undefined;
  const streakWithoutValue =
    centralTarget !== undefined && centralRun
      ? centralRunStreakWithoutValueForMetrics(input, centralTarget)
      : 0;
  const reserveTarget = runnerCreditReserveTargetForInput(input);
  const server = centralTarget
    ? input.playerView.servers.find(
        (candidate) => candidate.id === centralTarget,
      )
    : undefined;
  const visibleBreakCost =
    centralTarget && server
      ? (assessKnownRezzedIcePath(
          server.ice,
          input.playerView.own.rig ?? [],
          input.playerView.own.credits,
          server.root,
        ).visibleBreakCost ?? 0)
      : 0;
  const insufficientReserve =
    centralRun &&
    input.playerView.own.credits - visibleBreakCost < reserveTarget;
  const hqMemoryDiagnostics = runnerHqMemoryDiagnosticsForMetrics(
    input,
    centralRun,
    centralTarget,
  );
  const knownCardPositionDiagnostics =
    runnerKnownCardPositionDiagnosticsForMetrics(input, action, targetServerId);
  return {
    ...hqMemoryDiagnostics,
    ...knownCardPositionDiagnostics,
    ...(centralRun && (matchingInterface || anyMultiaccessInstalled)
      ? { runnerCentralRunWithMultiaccess: true }
      : {}),
    ...(centralRun && hasAnyInstalledInterface
      ? { runnerCentralRunWithInterfaceInstalled: true }
      : {}),
    ...(centralRun &&
    centralTarget === "hq" &&
    installedInterfaceTargets.has("hq")
      ? { runnerHqRunWithHqInterface: true }
      : {}),
    ...(centralRun &&
    centralTarget === "rd" &&
    installedInterfaceTargets.has("rd")
      ? { runnerRndRunWithRndInterface: true }
      : {}),
    ...(action.type === "play_event" && eventTargets.length > 0
      ? { runnerCentralRunEventPlayed: true }
      : {}),
    ...(action.type === "play_event" && eventGoodTarget
      ? { runnerCentralRunEventWithGoodTarget: true }
      : {}),
    ...(repeatedLowValue ? { runnerRepeatedLowValueCentralRun: true } : {}),
    ...(repeatWindow ? { runnerCentralRunRepeatWindow: true } : {}),
    ...(repeatWithFreshValue
      ? { runnerRepeatedCentralRunWithFreshValue: true }
      : {}),
    ...(repeatWindow && !repeatWithFreshValue
      ? { runnerRepeatedCentralRunWithoutFreshValue: true }
      : {}),
    ...(repeatedLowValue ? { runnerCentralRunStalePenaltyApplied: true } : {}),
    ...(streakWithoutValue > 0
      ? { runnerCentralRunStreakWithoutValue: streakWithoutValue }
      : {}),
    ...(insufficientReserve
      ? { runnerCentralRunStartedWithInsufficientPostRunReserve: true }
      : {}),
    ...(closeoutOpportunityRaw
      ? { runnerCentralCloseoutOpportunityRaw: true }
      : {}),
    ...(trueCloseout.opportunity
      ? {
          runnerTrueCentralCloseoutOpportunity: true,
          runnerCentralCloseoutOpportunity: true,
          runnerCentralCloseoutReason: trueCloseout.reasons[0],
        }
      : {}),
    ...(closeoutOpportunityRaw && !trueCloseout.opportunity && !centralRun
      ? { runnerCentralCloseoutSkippedWithGoodReason: true }
      : {}),
    ...(closeoutOpportunityRaw && trueCloseout.opportunity && !centralRun
      ? { runnerCentralCloseoutSkippedWithoutReason: true }
      : {}),
    ...(centralRun && trueCloseout.opportunity
      ? { runnerCentralCloseoutRunTaken: true }
      : {}),
    ...(action.type === "steal_agenda" &&
    centralTarget &&
    trueCloseout.opportunity
      ? { runnerCentralCloseoutSuccess: true }
      : {}),
    ...(input.playerView.activeSide === "runner" &&
    input.playerView.phase === "runner_action_phase" &&
    !centralRun &&
    closeoutOpportunityRaw &&
    !trueCloseout.opportunity
      ? { runnerCentralPressureNoopDecision: true }
      : {}),
    ...(noFresh.targets.length > 0
      ? { runnerNoFreshCentralServerIds: noFresh.targets }
      : {}),
    ...(noFresh.betterAlternatives.length > 0
      ? {
          runnerNoFreshCentralBetterAlternativeTypes:
            noFresh.betterAlternatives,
        }
      : {}),
    ...(noFreshRunTaken ? { runnerNoFreshCentralRunTaken: true } : {}),
    ...(substitutionType
      ? { runnerNoFreshCentralSubstitutionType: substitutionType }
      : {}),
    ...(noFreshRunTaken && noFresh.allowedReasons[0]
      ? { runnerStaleCentralAllowedReason: noFresh.allowedReasons[0] }
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

function runnerHqMemoryDiagnosticsForMetrics(
  input: AiDecisionInput,
  centralRun: boolean,
  centralTarget: "hq" | "rd" | "archives" | undefined,
): Partial<AiSimulationSummary["actionSequence"][number]> {
  const memory =
    reconstructBeliefState(input).runnerOpponentModel?.hqHandMemory;
  if (!memory) return {};
  const knownAgendaDefinitions = memory.knownDefinitions.filter(
    (definitionId) => definitionTypeForMetrics(definitionId) === "agenda",
  );
  const knownAgendaPoints = knownAgendaDefinitions.reduce(
    (sum, definitionId) => sum + agendaPointsForMetrics(definitionId),
    0,
  );
  const knownNonAgendaCount =
    memory.knownDefinitions.length - knownAgendaDefinitions.length;
  const unknownCount = Math.max(0, memory.handCount - memory.knownCount);
  const knownFraction =
    memory.handCount > 0 ? round(memory.knownCount / memory.handCount) : 0;
  const fullyKnownNoAgenda =
    memory.allCardsKnown &&
    memory.knownCount > 0 &&
    knownAgendaDefinitions.length === 0 &&
    memory.knownDefinitions.every((definitionId) =>
      isLowValueKnownAccessCard(definitionId, input.playerView.own.credits),
    );
  const knownCardValue =
    centralRun && centralTarget === "hq"
      ? knownAgendaDefinitions.length * 520 + knownAgendaPoints * 80
      : 0;
  const unknownCardValue =
    centralRun && centralTarget === "hq" ? Math.min(140, unknownCount * 55) : 0;
  const invalidationText = memory.invalidationReasons.join("|");
  return {
    hqKnownCards: memory.knownCount,
    hqUnknownCards: unknownCount,
    hqKnownFraction: knownFraction,
    ...(memory.allCardsKnown ? { hqFullyKnown: true } : {}),
    hqKnownAgendaCount: knownAgendaDefinitions.length,
    hqKnownNonAgendaCount: knownNonAgendaCount,
    hqKnownAgendaPoints: knownAgendaPoints,
    ...(invalidationText.includes("corp_draw_added_unknown_hq_card")
      ? { hqMemoryInvalidatedByDraw: true }
      : {}),
    ...(invalidationText.includes("known_hq_card_installed") ||
    invalidationText.includes("corp_installed_hidden_hq_card")
      ? { hqMemoryInvalidatedByInstall: true }
      : {}),
    ...(invalidationText.includes("known_hq_card_played") ||
    invalidationText.includes("corp_played_unknown_hq_card")
      ? { hqMemoryInvalidatedByPlay: true }
      : {}),
    ...(invalidationText.includes("corp_discarded_hq_card")
      ? { hqMemoryInvalidatedByDiscard: true }
      : {}),
    ...(invalidationText.includes("shuffle_changed_hq_hand") ||
    invalidationText.includes("arrange_changed_hq_hand") ||
    invalidationText.includes("swap_changed_hq_hand")
      ? { hqMemoryInvalidatedByShuffleOrReorder: true }
      : {}),
    ...(knownCardValue > 0 ? { hqRunValueFromKnownCards: knownCardValue } : {}),
    ...(unknownCardValue > 0
      ? { hqRunValueFromUnknownCards: unknownCardValue }
      : {}),
    ...(centralRun && centralTarget === "hq" && fullyKnownNoAgenda
      ? { hqRunSuppressedBecauseFullyKnownNoAgenda: true }
      : {}),
    ...(centralRun &&
    centralTarget === "hq" &&
    knownAgendaDefinitions.length > 0
      ? { hqRunBoostedBecauseKnownAgenda: true }
      : {}),
    ...(centralRun && centralTarget === "hq" && unknownCount > 0
      ? { hqRunBoostedBecauseUnknownCardsRemain: true }
      : {}),
    ...(centralRun &&
    centralTarget === "hq" &&
    isRepeatedLowValueCentralRunForMetrics(input, "hq") &&
    !input.eventTail.some(aiEventMayChangeHqPressure)
      ? { hqRunRepeatedWithoutNewHqInfo: true }
      : {}),
  };
}

function runnerKnownCardPositionDiagnosticsForMetrics(
  input: AiDecisionInput,
  action: LegalAction,
  targetServerId: string | undefined,
): Partial<AiSimulationSummary["actionSequence"][number]> {
  if (input.side !== "runner" || action.side !== "runner") return {};
  const belief = reconstructBeliefState(input);
  const memory = belief.runnerOpponentModel?.knownPositionMemory ?? [];
  const hqMemory = belief.runnerOpponentModel?.hqHandMemory;
  const invalidationText = [
    ...(belief.runnerOpponentModel?.rndTopFreshness.invalidationReasons ?? []),
    ...(hqMemory?.invalidationReasons ?? []),
  ].join("|");
  const knownRemote = memory.filter(
    (entry) =>
      entry.zone.startsWith("remote_") && entry.positionKey.startsWith("root:"),
  );
  const knownRemoteAgendas = knownRemote.filter(
    (entry) => definitionTypeForMetrics(entry.definitionId) === "agenda",
  );
  const knownRemoteTrashable = knownRemote.filter((entry) => {
    const type = definitionTypeForMetrics(entry.definitionId);
    return (
      (type === "asset" || type === "upgrade") &&
      trashCostForDefinitionForMetrics(entry.definitionId) !== undefined
    );
  });
  const knownUnrezzedIce = memory.filter((entry) =>
    entry.positionKey.startsWith("ice:"),
  );
  const runTarget =
    action.type === "start_run"
      ? (targetServerId ??
        (typeof action.payload?.serverId === "string"
          ? action.payload.serverId
          : undefined))
      : undefined;
  const targetKnownRemote = runTarget
    ? knownRemote.filter((entry) => entry.zone === runTarget)
    : [];
  const targetKnownUnrezzedIce = runTarget
    ? knownUnrezzedIce.filter((entry) => entry.zone === runTarget)
    : [];
  const runCostAdjusted = targetKnownUnrezzedIce.reduce(
    (sum, entry) =>
      sum + visibleBreakCostForKnownIceDefinition(input, entry.definitionId),
    0,
  );
  const hqKnownFromRndDraw =
    hqMemory?.invalidationReasons.some((reason) =>
      reason.includes("known_rnd_top_moved_to_hq"),
    ) ?? false;
  const hqKnownAgendaFromRnd =
    hqKnownFromRndDraw &&
    (hqMemory?.knownDefinitions ?? []).some(
      (definitionId) => definitionTypeForMetrics(definitionId) === "agenda",
    );
  const rndFreshness = belief.runnerOpponentModel?.rndTopFreshness;
  const rndTopRemoved = rndFreshness?.freshness === "fresh_after_top_removed";
  const rndKnownTopAgenda =
    rndFreshness?.knownTopDefinitionId !== undefined &&
    definitionTypeForMetrics(rndFreshness.knownTopDefinitionId) === "agenda";
  const rndKnownTopNonAgenda =
    rndFreshness?.knownTopDefinitionId !== undefined && !rndKnownTopAgenda;
  const rndStaleKnownTop = rndFreshness?.freshness === "stale_known_same_top";
  const isRndRun = action.type === "start_run" && runTarget === "rd";
  const rndFreshOpportunity =
    rndTopRemoved ||
    rndKnownTopAgenda ||
    rndFreshness?.freshenedByRunnerAccess === true;
  return {
    ...(memory.some(
      (entry) => entry.zone === "rd" && entry.positionKey === "top",
    )
      ? { knownRndTopCard: true }
      : {}),
    ...(invalidationText.includes("known_rnd_top_moved_to_hq")
      ? { knownRndTopMovedToHq: true, hqKnownFromRndDraw: true }
      : {}),
    ...(invalidationText.includes("corp_draw_from_rd") ||
    invalidationText.includes("shuffle_changed_rd_top") ||
    invalidationText.includes("arrange_changed_rd_top") ||
    invalidationText.includes("swap_changed_rd_top")
      ? { knownRndTopInvalidated: true }
      : {}),
    ...(action.type === "start_run" &&
    runTarget === "hq" &&
    hqKnownAgendaFromRnd
      ? { hqRunBoostedByRndToHqAgenda: true }
      : {}),
    ...(action.type === "start_run" &&
    runTarget === "hq" &&
    hqKnownFromRndDraw &&
    !hqKnownAgendaFromRnd
      ? { hqRunSuppressedByRndToHqNonAgenda: true }
      : {}),
    ...([
      "steal_agenda",
      "trash_accessed_card",
      "move_to_removed_from_game",
      "move_to_set_aside",
    ].includes(action.type) && targetServerId === "rd"
      ? { rndAccessRemovedTopCard: true }
      : {}),
    ...(action.type === "steal_agenda" && targetServerId === "rd"
      ? { rndAccessStoleAgenda: true }
      : {}),
    ...(action.type === "trash_accessed_card" && targetServerId === "rd"
      ? { rndAccessTrashedCard: true }
      : {}),
    ...(action.type === "access_card" &&
    targetServerId === "rd" &&
    !input.legalActions.some(
      (candidate) =>
        candidate.type === "steal_agenda" ||
        candidate.type === "trash_accessed_card",
    )
      ? { rndAccessLeftTopCardUnchanged: true }
      : {}),
    ...(rndFreshness?.freshenedByRunnerAccess === true
      ? { rndTopFreshenedByRunnerAccess: true }
      : {}),
    ...(rndFreshness?.invalidationReasons.some((reason) =>
      reason.includes("rd_known_top_sequence_advanced"),
    )
      ? {
          rndKnownTopAdvancedAfterAccess: true,
          rndKnownTopSequenceAdvanced: true,
        }
      : {}),
    ...(isRndRun && rndTopRemoved ? { rndRepeatRunAfterTopRemoved: true } : {}),
    ...(isRndRun && rndStaleKnownTop
      ? { rndRepeatRunAfterTopUnchanged: true }
      : {}),
    ...(isRndRun && rndTopRemoved
      ? { rndRepeatRunBoostedByFreshTop: true }
      : {}),
    ...(isRndRun && rndStaleKnownTop
      ? { rndRepeatRunSuppressedBecauseKnownStaleTop: true }
      : {}),
    ...(isRndRun && rndKnownTopAgenda
      ? { rndRepeatRunBoostedByKnownAgendaTop: true }
      : {}),
    ...(isRndRun && rndStaleKnownTop && rndKnownTopNonAgenda
      ? { rndRepeatRunSuppressedBecauseKnownNonAgendaTop: true }
      : {}),
    ...(rndFreshOpportunity ? { rndFreshTopPressureOpportunity: true } : {}),
    ...(isRndRun && rndFreshOpportunity
      ? { rndFreshTopPressureTaken: true }
      : {}),
    ...(rndFreshOpportunity && !isRndRun
      ? { rndFreshTopPressureSkipped: true }
      : {}),
    ...(isRndRun && rndStaleKnownTop && rndKnownTopNonAgenda
      ? {
          rndStaleTopRepeatMistake: true,
          rndAccessNoValueRepeatStale: true,
        }
      : {}),
    ...(rndTopRemoved &&
    input.playerView.agendaPointsToWin - input.playerView.own.agendaPoints <= 2
      ? { rndCloseoutOpportunityAfterTopRemoved: true }
      : {}),
    ...(knownRemote.length > 0 ? { knownRemoteCards: knownRemote.length } : {}),
    ...(knownRemoteAgendas.length > 0
      ? { knownRemoteAgendas: knownRemoteAgendas.length }
      : {}),
    ...(knownRemoteTrashable.length > 0
      ? { knownRemoteTrashableCards: knownRemoteTrashable.length }
      : {}),
    ...(knownRemote.length > 0
      ? { remoteMemoryRetainedAfterAccess: true }
      : {}),
    ...(invalidationText.includes("remote_state_changed") ||
    memory.some((entry) =>
      entry.invalidatedBy.some(
        (reason) => reason.includes("install") || reason.includes("move"),
      ),
    )
      ? { remoteMemoryInvalidatedByInstallOrMove: true }
      : {}),
    ...(action.type === "start_run" &&
    targetKnownRemote.some(
      (entry) => definitionTypeForMetrics(entry.definitionId) === "agenda",
    )
      ? { remoteRunBoostedByKnownRemoteAgenda: true }
      : {}),
    ...(action.type === "start_run" &&
    targetKnownRemote.some((entry) =>
      isLowValueKnownAccessCard(
        entry.definitionId,
        input.playerView.own.credits,
      ),
    )
      ? { remoteRunSuppressedByKnownLowValueRemote: true }
      : {}),
    ...(action.type === "start_run" &&
    targetKnownRemote.some((entry) => {
      const type = definitionTypeForMetrics(entry.definitionId);
      return (
        (type === "asset" || type === "upgrade") &&
        trashCostForDefinitionForMetrics(entry.definitionId) !== undefined
      );
    })
      ? { remoteTrashBoostedByKnownRemoteTrashable: true }
      : {}),
    ...(knownUnrezzedIce.length > 0
      ? {
          knownUnrezzedIceFromExpose: knownUnrezzedIce.length,
          knownUnrezzedIceRetained: true,
        }
      : {}),
    ...(invalidationText.includes("conceal") ||
    invalidationText.includes("reorder")
      ? { knownUnrezzedIceInvalidated: true }
      : {}),
    ...(runCostAdjusted > 0
      ? { runCostAdjustedByKnownUnrezzedIce: runCostAdjusted }
      : {}),
    ...(action.type === "jack_out" && knownUnrezzedIce.length > 0
      ? { jackOutInfluencedByKnownUnrezzedIce: true }
      : {}),
    ...(action.type === "install_card" && knownUnrezzedIce.length > 0
      ? { rigPlanInfluencedByKnownUnrezzedIce: true }
      : {}),
  };
}

function bestTrueCentralCloseoutProfileForMetrics(input: AiDecisionInput): {
  opportunity: boolean;
  reasons: string[];
  target?: "hq" | "rd" | "archives";
} {
  return bestTrueCentralCloseoutProfileWithDeps(input, {
    assessKnownRezzedIcePath,
    rolesForCardId,
    sourceDefinitionIdForAction: sourceDefinitionIdForSimulationAction,
  });
}

function trueCentralCloseoutProfileForMetrics(
  input: AiDecisionInput,
  target: "hq" | "rd" | "archives",
): { opportunity: boolean; reasons: string[] } {
  return trueCentralCloseoutProfileWithDeps(input, target, {
    assessKnownRezzedIcePath,
    rolesForCardId,
    sourceDefinitionIdForAction: sourceDefinitionIdForSimulationAction,
  });
}

function runnerNoFreshCentralContextForMetrics(input: AiDecisionInput): {
  targets: Array<"hq" | "rd" | "archives">;
  betterAlternatives: string[];
  allowedReasons: string[];
} {
  return runnerNoFreshCentralContextWithDeps(input, {
    assessKnownRezzedIcePath,
    centralRunStreakWithoutValueForMetrics,
    isRunnerEconomyAction,
    rolesForAction,
    rolesForCardId,
    runnerCreditReserveTargetForInput,
    runnerRemoteThreatProfile,
    sourceDefinitionIdForAction: sourceDefinitionIdForSimulationAction,
  });
}

function centralRunEventGoodForTarget(
  input: AiDecisionInput,
  target: "hq" | "rd" | "archives",
): boolean {
  return centralRunEventGoodForTargetWithSource(
    input,
    target,
    sourceDefinitionIdForSimulationAction,
  );
}

function noFreshCentralSubstitutionTypeForAction(
  input: AiDecisionInput,
  action: LegalAction,
):
  | "economy"
  | "rig_unlock"
  | "remote_contest"
  | "pressure_install"
  | "setup_search"
  | "end_turn"
  | undefined {
  return noFreshCentralSubstitutionTypeForActionWithDeps(input, action, {
    isRunnerEconomyAction,
    rolesForAction,
    sourceDefinitionIdForAction: sourceDefinitionIdForSimulationAction,
  });
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
  const economySpend =
    economyAction && creditDelta < 0 ? Math.abs(creditDelta) : 0;
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
    creditDelta < 0 &&
    belowAfter &&
    !runDiagnostics.probeRunWithPositiveInfoValue;
  const installCost =
    action.type === "install_card" ? actionCreditCost(action) : 0;
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
  const stealBlockedByCredits = runnerStealBlockedByCredits(
    input,
    reserveTarget,
  );
  const contestBlockedByCredits =
    runnerContestBlockedByCredits(input, reserveTarget) ||
    runDiagnostics.runStartedAgainstKnownUnaffordablePath === true;
  const reserveAfterAccess = [
    "access_card",
    "steal_agenda",
    "trash_accessed_card",
    "decline_trash",
  ].includes(action.type)
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
    ...(lowValueSpendBelowReserve
      ? { runnerLowValueSpendBelowReserve: true }
      : {}),
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
    (accessTarget === "hq" ||
      accessTarget === "rd" ||
      accessTarget === "archives")
      ? { runnerReserveAfterCentralRun: reserveAfterAccess }
      : {}),
    ...runDiagnostics,
    ...remoteThreatTargeting,
  };
}

function runnerRemoteThreatTargetingDiagnosticsForAction(
  input: AiDecisionInput,
  action: LegalAction,
  targetServerId: string | undefined,
): Partial<AiSimulationSummary["actionSequence"][number]> {
  return runnerRemoteThreatTargetingDiagnosticsForActionWithDeps(
    input,
    action,
    targetServerId,
    {
      runnerRemoteThreatProfile,
      runnerCentralRunHasClearPressureJustification:
        runnerCentralRunHasClearPressureJustificationForInput,
      runnerCentralRunPressureJustificationReasons:
        runnerCentralRunPressureJustificationReasonsForInput,
      runnerCentralRunBurnsRemoteContestReserve:
        runnerCentralRunBurnsRemoteContestReserveForInput,
    },
  );
}

function runnerRemoteThreatProfile(
  input: AiDecisionInput,
  serverId: string,
): RunnerRemoteThreatProfile {
  return runnerRemoteThreatProfileWithReserve(
    input,
    serverId,
    runnerPostRunReserveTargetForRemoteInput,
  );
}

function runnerPostRunReserveTargetForRemoteInput(
  input: AiDecisionInput,
  serverId: string,
): number {
  return runnerPostRunReserveTargetForRemoteInputWithDeps(input, serverId, {
    remoteServerHasScoreThreat,
    rolesForCardId,
  });
}

function runnerCentralRunHasClearPressureJustificationForInput(
  input: AiDecisionInput,
  targetServerId: string,
  contestableRemoteThreatVisible: boolean,
): boolean {
  return runnerCentralRunHasClearPressureJustificationWithDeps(
    input,
    targetServerId,
    contestableRemoteThreatVisible,
    {
      assessKnownRezzedIcePath,
      recentCentralRunSameTargetWithoutRefresh,
      rolesForCardId,
      runnerCreditReserveTargetForInput,
      trueCentralCloseoutProfileForMetrics,
    },
  );
}

function runnerCentralRunPressureJustificationReasonsForInput(
  input: AiDecisionInput,
  targetServerId: string,
  contestableRemoteThreatVisible: boolean,
): string[] {
  return runnerCentralRunPressureJustificationReasonsWithDeps(
    input,
    targetServerId,
    contestableRemoteThreatVisible,
    {
      assessKnownRezzedIcePath,
      recentCentralRunSameTargetWithoutRefresh,
      rolesForCardId,
      runnerCreditReserveTargetForInput,
      trueCentralCloseoutProfileForMetrics,
    },
  );
}

function runnerCentralRunBurnsRemoteContestReserveForInput(
  input: AiDecisionInput,
  targetServerId: string,
  contestableProfiles: RunnerRemoteThreatProfile[],
): boolean {
  return runnerCentralRunBurnsRemoteContestReserveWithDeps(
    input,
    targetServerId,
    contestableProfiles,
    { assessKnownRezzedIcePath },
  );
}

function runnerCreditReserveTargetForInput(input: AiDecisionInput): number {
  return runnerCreditReserveTargetForInputWithRoles(input, rolesForCardId);
}

function runnerKnownPathDiagnosticsForAction(
  input: AiDecisionInput,
  action: LegalAction,
  targetServerId: string | undefined,
  reserveTarget: number,
): Partial<AiSimulationSummary["actionSequence"][number]> {
  return runnerKnownPathDiagnosticsForActionWithDeps(
    input,
    action,
    targetServerId,
    reserveTarget,
    {
      assessKnownRezzedIcePath,
      remoteServerHasScoreThreat,
      rolesForAction,
      rolesForCardId,
      runnerCoverageRepairDiagnostic,
      runnerHasRecentRunOnServer,
      runnerKnownPathAssessmentIsKnownNoAccess,
      runnerKnownPathAssessmentIsUnbreakableNoAccess,
      runnerRemoteHasKnownRelevantTrashTarget,
      runnerRunTargetHasOnlyUnknownOrUnrezzedIce,
    },
  );
}

function runnerKnownNoAccessLegalRunTargets(
  input: AiDecisionInput,
): RunnerKnownNoAccessTarget[] {
  return runnerKnownNoAccessLegalRunTargetsWithDeps(input, {
    assessKnownRezzedIcePath,
    runnerKnownPathAssessmentIsKnownNoAccess,
    runnerRunTargetHasOnlyUnknownOrUnrezzedIce,
  });
}

function runnerCoverageRepairDiagnostic(
  input: AiDecisionInput,
  action: LegalAction,
): Partial<AiSimulationSummary["actionSequence"][number]> {
  return runnerCoverageRepairDiagnosticWithDeps(input, action, {
    runnerKnownNoAccessLegalRunTargets,
    sourceDefinitionIdForAction: (diagnosticInput, diagnosticAction) =>
      typeof diagnosticAction.source === "string"
        ? findVisibleCard(diagnosticInput, diagnosticAction.source)
            ?.definitionId
        : undefined,
    rolesForCardId,
  });
}

function runnerRemoteTrashAccessContext(
  input: AiDecisionInput,
  action: LegalAction,
) {
  return buildRunnerRemoteTrashAccessContext(
    input,
    action,
    runnerCreditReserveTargetForInput(input),
  );
}

function runnerDrawKindForSimulationAction(
  input: AiDecisionInput,
  action: LegalAction,
): { draw: boolean; click: boolean; cardEffect: boolean } {
  return runnerDrawKindForSimulationActionWithDeps(input, action, {
    rolesForAction,
    isSearchChoice,
  });
}

function hasRunnerPlayableEconomyAction(
  input: AiDecisionInput,
  excludeActionId?: string,
): boolean {
  return hasRunnerPlayableEconomyActionForSimulation(
    input,
    excludeActionId,
    isRunnerEconomyAction,
  );
}

function hasRunnerInstallableBreakerAction(
  input: AiDecisionInput,
  excludeActionId?: string,
): boolean {
  return hasRunnerInstallableBreakerActionForSimulation(input, excludeActionId, {
    rolesForAction,
  });
}

function hasRunnerRunnablePressureAction(
  input: AiDecisionInput,
  excludeActionId?: string,
): boolean {
  return hasRunnerRunnablePressureActionForSimulation(
    input,
    excludeActionId,
    isRunnerPressureAction,
  );
}

function isRunnerEconomyAction(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  return isRunnerEconomyActionForSimulation(input, action, { rolesForAction });
}

function isRunnerRigInstallAction(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  return isRunnerRigInstallActionForSimulation(input, action, {
    rolesForAction,
  });
}

function isRunnerPressureAction(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  return isRunnerPressureActionForSimulation(input, action, { rolesForAction });
}

function runnerDiscardChoiceRoles(
  input: AiDecisionInput,
  decision: AiDecision,
): string[] {
  return runnerDiscardChoiceRolesForSimulation(
    input,
    decision,
    rolesForCardId,
  );
}

function isRunnerDuplicateInstall(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  return isRunnerDuplicateInstallForSimulation(
    input,
    action,
    sourceDefinitionIdForSimulationAction,
  );
}

function isRunnerLowValueDuplicateInstall(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  return isRunnerLowValueDuplicateInstallForSimulation(input, action, {
    sourceDefinitionIdForAction: sourceDefinitionIdForSimulationAction,
    rolesForCardId,
  });
}

function sourceDefinitionIdForSimulationAction(
  input: AiDecisionInput,
  action: LegalAction,
): string | undefined {
  return sourceDefinitionIdForSimulationSource(action, (id) =>
    findVisibleCard(input, id),
  );
}

function metricsFor(
  actionSequence: AiSimulationSummary["actionSequence"],
  errors: string[],
  replayOk: boolean,
  holdout: boolean,
): AiQualityMetrics {
  return metricsForSimulationActionSequence(
    actionSequence,
    errors,
    replayOk,
    holdout,
    summarizeDoctrineQualityMetrics,
  );
}

function qualityTagsForAction(
  input: AiDecisionInput,
  action: LegalAction,
  decision: AiDecision,
): string[] {
  return qualityTagsForActionWithDependencies(input, action, decision, {
    extractFeatures: extractAiFeatures,
    findVisibleCard,
    rolesForAction,
  });
}
