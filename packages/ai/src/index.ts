// Public package facade. Keep new AI behavior in focused runtime, decision,
// action, access, diagnostics, reports or simulation modules, then re-export
// only intentional public contracts here.
import {
  assessCorpScoreTerminalWindow,
  chooseCorpPlanAction,
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
  RUNTIME_CARDS,
} from "./ai-hints";
import {
  assessKnownRezzedIcePath,
  canBreakerDefinitionBreakIce,
  iceHasEndTheRun,
  runnerKnownPathAssessmentIsKnownNoAccess,
  runnerKnownPathAssessmentIsUnbreakableNoAccess,
} from "./visible-run-analysis";
import {
  remoteRoleIsScoringProtectionKind,
} from "./remote-role-ontology-consumer";
import {
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
import { createBeliefSimulationWorld } from "./simulation/belief-simulation-world";
import {
  buildServerFeatures,
  visibleCitySurveillanceSourceCount,
} from "./runtime/ai-feature-server";
import { createAiFacadeFoundationContext } from "./runtime/ai-facade-foundation-context";
import { createRunnerKnownPathDiagnosticsComposition } from "./simulation/runner-known-path-diagnostics-composition";
import { createRunnerCentralPressureDiagnosticsComposition } from "./simulation/runner-central-pressure-diagnostics-composition";
import { createRunnerInstallClassificationComposition } from "./simulation/runner-install-classification-composition";
import { createRunnerSimulationDiagnosticsComposition } from "./simulation/runner-simulation-diagnostics-composition";
import {
  cardDefinitionTypeForAi,
  runnerCardMechanicsForAi,
  visibleCardDefinition,
} from "./runtime/card-definition-lookup";
import { createRunnerBaselineSupportComposition } from "./runtime/runner-baseline-support-composition";
import { createAiActionEntrypointsComposition } from "./runtime/ai-action-entrypoints-composition";
import { compareAction } from "./runtime/action-order";
import {
  remoteTrashCostBucket,
} from "./runtime/remote-trash-cost";
import {
  breakSubroutineIndexesForAction,
} from "./runtime/subroutine-indexes";
import {
  isEndRunSubroutine,
  isImmediateSafetyThreatSubroutine,
} from "./runtime/encounter-subroutine";
import {
  currentEncounteredIceCard,
  encounterHasImmediateUnbrokenThreat,
  runnerReachedAccessMovement,
} from "./runtime/current-encounter";
import {
  encounterRunRemainderEffectAssessment,
} from "./runtime/runner-run-remainder-effect-assessment";
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
  shellTradersAbility,
} from "./runtime/shell-traders-action";
import {
  corpInstalledEconomyCreditAmount,
} from "./runtime/corp-installed-economy-credit";
import {
  rndFreshRepeatRunBoost,
  staleKnownRndRepeatRunPenalty,
} from "./runtime/runner-rnd-repeat-run-score";
import { staleKnownHqRepeatRunPenalty } from "./runtime/runner-hq-repeat-run-score";
import { isBlockedByKnownRezzedIce } from "./runtime/runner-known-rezzed-ice-block";
import type {
  CorpTagPunishSkipReason,
} from "./runtime/corp-tag-punish-types";
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
import { createSemanticRuntimeDecisionComposition } from "./runtime/semantic-runtime-decision-composition";
import {
  scrubEvidence,
  semanticRuntimeChoiceWithEvidence,
  semanticRuntimeScoreFromComponents,
} from "./runtime/semantic-runtime-score-components";
import { createCorpTagPunishWindowComposition } from "./simulation/corp-tag-punish-window-composition";
import { createSemanticRuntimeCorpScoringEvidenceComposition } from "./runtime/semantic-runtime-corp-scoring-evidence-composition";
import { createSemanticRuntimeCorpBoardScoreComposition } from "./runtime/semantic-runtime-corp-board-score-composition";
import { semanticRuntimeServerId } from "./runtime/semantic-runtime-scope";
import { semanticRuntimeExplanation } from "./runtime/semantic-runtime-explanation";
import { stringRecordValue } from "./runtime/record-value";
import {
  runnerRunActionSpendingCapAssessment,
} from "./runtime/runner-run-only-action-adjustment";
import { createRunnerBlinkRiskComposition } from "./runtime/runner-blink-risk-composition";
import { createSemanticRuntimeActionExclusionComposition } from "./runtime/semantic-runtime-action-exclusion-composition";
import { runnerHandBufferNeedScoreComponent } from "./runtime/runner-hand-buffer-need";
import { createRunnerDevelopmentSupportComposition } from "./runtime/runner-development-support-composition";
import {
  runnerMultiRunEventScoreValue,
} from "./runtime/runner-multi-run-event-score";
import { runnerProjectedCreditGainForAction } from "./runtime/runner-loan-credit-projection";
import {
  createRunnerScoringSupportComposition,
} from "./runtime/runner-scoring-support-composition";
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
  actionClickCost,
  actionCreditCost,
} from "./runtime/action-cost";
import {
  sortedUnique,
} from "./runtime/collection";
import {
  evidenceNumber,
  evidenceValue,
  hasEvidenceFlag,
  hasEvidencePrefix,
} from "./runtime/evidence-value";
import { roundNumber as round } from "./runtime/number-rounding";
import {
  eventMayChangeHqPressure as aiEventMayChangeHqPressure,
  eventVersion as aiEventVersion,
  findLastHistoryIndex as findLastAiHistoryIndex,
  mergedPublicHistory as mergedAiPublicHistory,
  serverIdFromEvent as aiServerIdFromEvent,
} from "./runtime/public-event-history";
import {
  isSearchChoice,
} from "./runtime/search-choice-option";
import { rolesMatch as discardRolesMatch } from "./runtime/role-match";
import {
  runnerKnownIcePathReason as semanticRuntimeKnownIcePathReason,
} from "./runtime/runner-known-ice-path-score";
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
import type {
  AiSelfplayTraceMiningConfig,
  AiSelfplayTraceMiningResult,
} from "./simulation/selfplay-trace-mining";
import type {
  SimulationBenchmarkProfile,
  SimulationBenchmarkProfileId,
  SimulationWorld,
} from "./simulation/simulation-types";
import type {
  V143LeagueConfig,
  V143SimulationRunResult,
  V143SoakResult,
} from "./simulation/v143-tuning-gate";
import type {
  AiDoctrineQualityBenchmarkConfig,
} from "./simulation/doctrine-quality-benchmark-types";
import type {
  V143ExploitFixture,
  V143ExploitRegressionResult,
} from "./simulation/v143-fixture-types";
import type {
  AiBenchmarkDeckReference,
  AiBenchmarkDeckSlotStatus,
  AiBenchmarkDeckSlotType,
  AiBenchmarkLocalEditableDeckResult,
  AiBenchmarkSnapshotDeck,
  AiLocalBenchmarkDeckClassification,
} from "./simulation/benchmark-deck-types";
import { REAL_SCENE_BENCHMARK_DECKS } from "./simulation/benchmark-local-deck-data";
import {
  DOCTRINE_QUALITY_METRIC_NAMES,
} from "./simulation/simulation-metric-aggregation";
import {
  analyzeDoctrineQualityCases,
  isAgendaFloodExposureExemptAction,
  isEconomyStallExemptAction,
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
  corpVisibleMeatDamagePayoff,
  corpVisibleRunnerDamagePreventionEvidence,
  corpVisibleRunnerResourceTrashEvidence,
} from "./simulation/corp-tag-punish-visible-payoff";
import { corpIcePortfolioDiagnosticsForSimulationAction } from "./simulation/corp-ice-portfolio-diagnostics";
import { isMeaningfulBoardProgress } from "./simulation/meaningful-board-progress";
import { applyTagPunishOntologyDiagnostics } from "./simulation/tag-punish-ontology-diagnostics";
import {
  applyCorpVisibleTagPunishTakenWindowDiagnostics,
} from "./simulation/corp-visible-tag-punish-taken-diagnostics";
import { runnerSurvivalCounterContextForInput } from "./simulation/runner-survival-counter-context";
import type { CorpIcePortfolioMetricKey } from "./simulation/corp-ice-portfolio-types";
import {
  runnerMissingBreakerRolesForMetrics,
  runnerStrategicBreakerTargetForMetrics,
  runnerVisibleIceCreatesCoverageNeedForMetrics,
  type RunnerSetupMissingCoverageType,
} from "./simulation/runner-setup-coverage-types";
import type { AiSimulationActionSequenceEntry } from "./simulation/ai-simulation-action-sequence-entry";
import type { AiSimulationConfig } from "./simulation/ai-simulation-config";
import type { AiSimulationSummary } from "./simulation/ai-simulation-summary";
import {
  runnerSetupChosenFamilyForEntry,
} from "./simulation/runner-setup-attribution-types";
import {
  agendaPointsForMetrics,
  definitionTypeForMetrics,
  remoteRootTrashCostForMetrics,
  remoteTrashCostForVisibleCard,
} from "./simulation/card-metric-lookup";
import {
  visibleRootIsKnownAgendaForMetrics,
} from "./simulation/visible-root-agenda-metrics";
import {
  centralRunStreakWithoutValueForMetrics,
  recentCentralRunSameTargetWithoutRefresh,
} from "./simulation/central-run-history";
import {
  hasRunnerRemoteTrashAction,
  remoteServerHasScoreThreat,
  runnerAdvancedRemoteContestContext,
  runnerContestBlockedByCredits,
  runnerHasVisibleRemoteScoreThreat,
  runnerRemoteHasKnownRelevantTrashTarget,
  runnerStealBlockedByCredits,
  runnerTrashBlockedByCredits,
} from "./simulation/remote-server-threat";
import {
  ALL_NIGHTER_CARD_ID,
  BAD_PUBLICITY_LOSS_THRESHOLD_FOR_AI,
  FAKED_HIT_CARD_ID,
  JUNKYARD_BBS_CARD_ID,
  JUNKYARD_BBS_RETURN_TOP_HEAP_ABILITY,
  LOAN_FROM_CHIBA_CARD_ID,
  TEAM_RESTRUCTURING_CARD_ID,
} from "./runtime/runner-semantic-card-ids";
import {
  remoteTrashRoleForVisibleCard,
  type RemoteTrashRole,
} from "./simulation/remote-trash-role";
import { type AiQualityMetrics } from "./simulation/quality-metrics";
import {
  runnerHasRecentRunOnServer,
  runnerRunTargetHasOnlyUnknownOrUnrezzedIce,
} from "./simulation/runner-run-target-context";
import {
  isCorpProtectionScoreConversionAction,
  isCorpRemoteProtectionActionEntry,
  isRunnerCentralPressureAction,
  isRunnerEconomyProgressAction,
  isRunnerRigProgressAction,
  isRunnerSetupAction,
  isStrategicPlanDecision,
  ownStrategicWindow,
  serverTargetsMatch,
} from "./simulation/plan-conversion-predicates";
import { scoreActionsForLegacy } from "./legacy/legacy-action-scorer";
import {
  BENCHMARK_PROFILES_143,
  listV143BenchmarkProfiles,
  listV143ExploitFixtures,
} from "./simulation/v143-data";
import { SOAK_SEEDS_143 } from "./simulation/soak-seed-data";
import { createAiSimulationComposition } from "./simulation/ai-simulation-composition";
import { summarizeMatchProgressionMetrics } from "./simulation/match-progression-summary";
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
  type GameState,
  type LegalAction,
  type PlayerView,
  type VisibleCard,
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
export { listMatchProgressionBenchmarkDeckSlots } from "./simulation/benchmark-deck-slot-list";
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
export {
  benchmarkDeckFromFrozenLocalSnapshot,
  benchmarkDeckFromSnapshot,
} from "./simulation/benchmark-deck-snapshot-resolver";
export { benchmarkDeckFromLocalEditableDeck } from "./simulation/benchmark-local-editable-deck-resolver";

const {
  AI_HINTS,
  rolesForAction,
  rolesForCardId,
  extractAiFeatures,
  sourceDefinitionIdForSimulationAction,
  corpFutureRunIceDiagnosticsForSimulationAction,
  corpScoreTerminalDiagnosticsForSimulationAction,
  corpEconomyBeforeScoreDiagnosticsForSimulationAction,
  definitionForSimulationAction,
  strongestCorpTagSourceOpportunity,
  corpTagPunishOntologyAssessmentForAction,
  applyCorpVisibleTagPunishUnknownSkipDiagnostics,
  corpVisibleTagPunishOpportunities,
  applyCorpTagSourceWindowDiagnostics,
  applyActualTagCreationDiagnostics,
} = createAiFacadeFoundationContext({
  findVisibleCard,
  buildObservedFacts,
  buildServerFeatures,
  assessKnownRezzedIcePath,
  isBlockedByKnownRezzedIce,
  visibleCitySurveillanceSourceCount,
  sourceDefinitionIdForAction,
});

const {
  runnerCreditReserveTargetForInput,
  encounterBreakReserveContext,
  breakAccessPathAssessment,
  pumpViabilityAssessment,
  runnerRunKnownPathCost,
  runnerHasKnownUnaffordableLegalRun,
  runnerVisibleMissingBreakerCoverage,
  runnerMissingCoverageTypesForInput,
  runnerHasKnownBlockedPathByCoverage,
  runnerCoverageSearchActionForMetrics,
  runnerCoverageRecoveryActionForMetrics,
  runnerRemoteTrashAccessContext,
  runnerKnownPathDiagnosticsForAction,
} = createRunnerKnownPathDiagnosticsComposition({
  assessKnownRezzedIcePath,
  runnerKnownPathAssessmentIsKnownNoAccess,
  runnerKnownPathAssessmentIsUnbreakableNoAccess,
  runnerRunTargetHasOnlyUnknownOrUnrezzedIce,
  findVisibleCard,
  actionCreditCost,
  breakSubroutineIndexesForAction,
  currentEncounteredIceCard,
  knownIcePathReason: semanticRuntimeKnownIcePathReason,
  isRemoteServerTarget,
  definitionType: definitionTypeForMetrics,
  remoteRootTrashCost: remoteRootTrashCostForMetrics,
  encounterRunRemainderEffectAssessment,
  encounterHasImmediateUnbrokenThreat,
  rolesForAction,
  rolesForCardId,
  remoteServerHasScoreThreat,
  runnerHasRecentRunOnServer,
  runnerRemoteHasKnownRelevantTrashTarget,
});

const {
  runnerDrawKindForSimulationAction,
  hasRunnerPlayableEconomyAction,
  hasRunnerInstallableBreakerAction,
  hasRunnerRunnablePressureAction,
  isRunnerEconomyAction,
  isRunnerRigInstallAction,
  isRunnerPressureAction,
  runnerDiscardChoiceRoles,
  isRunnerDuplicateInstall,
  isRunnerLowValueDuplicateInstall,
} = createRunnerInstallClassificationComposition({
  rolesForAction,
  rolesForCardId,
  sourceDefinitionIdForSimulationAction,
  isSearchChoice,
});

const {
  bestTrueCentralCloseoutProfileForMetrics,
  runnerRemoteThreatTargetingDiagnosticsForAction,
  runnerCentralPressureDiagnosticsForSimulationAction,
} = createRunnerCentralPressureDiagnosticsComposition({
  isRunnerEconomyAction,
  rolesForAction,
  rolesForCardId,
  sourceDefinitionIdForSimulationAction,
  assessKnownRezzedIcePath,
  centralRunStreakWithoutValueForMetrics,
  runnerCreditReserveTargetForInput,
  recentCentralRunSameTargetWithoutRefresh,
  remoteServerHasScoreThreat,
});

const {
  runnerReserveDiagnosticsForSimulationAction,
  runnerHandUseDiagnosticsForSimulationAction,
  runnerEconomySetupDiagnosticsForSimulationAction,
  assessRunnerPressureReadyForMetrics,
  runnerBreakerCoverageDiagnosticsForSimulationAction,
} = createRunnerSimulationDiagnosticsComposition({
  runnerCreditReserveTargetForInput,
  isRunnerEconomyAction,
  runnerKnownPathDiagnosticsForAction,
  runnerRemoteThreatTargetingDiagnosticsForAction,
  isRunnerLowValueDuplicateInstall,
  runnerHasVisibleRemoteScoreThreat,
  runnerRemoteTrashAccessContext,
  runnerTrashBlockedByCredits,
  runnerStealBlockedByCredits,
  runnerContestBlockedByCredits,
  runnerDrawKindForSimulationAction,
  hasRunnerPlayableEconomyAction,
  hasRunnerInstallableBreakerAction,
  hasRunnerRunnablePressureAction,
  hasRunnerRemoteTrashAction,
  runnerDiscardChoiceRoles,
  isRunnerDuplicateInstall,
  isRunnerRigInstallAction,
  isRunnerPressureAction,
  sourceDefinitionIdForSimulationAction,
  runnerAdvancedRemoteContestContext,
  definitionForSimulationAction,
  rolesForAction,
  runnerCoverageRecoveryActionForMetrics,
  runnerCoverageSearchActionForMetrics,
  runnerHasKnownUnaffordableLegalRun,
  runnerVisibleMissingBreakerCoverage,
  runnerHasKnownBlockedPathByCoverage,
  runnerMissingCoverageTypesForInput,
  runnerRunKnownPathCost,
  runnerSetupChosenFamilyForEntry,
  runnerStrategicBreakerTargetForMetrics,
  assessKnownRezzedIcePath,
  knownPositionMemoryForInput: (input) =>
    reconstructBeliefState(input).runnerOpponentModel?.knownPositionMemory ??
    [],
  definitionTypeForMetrics,
  remoteRootTrashCostForMetrics,
  canBreakerDefinitionBreakIce,
  runnerVisibleIceCreatesCoverageNeedForMetrics,
  runnerMissingBreakerRolesForMetrics,
});

const {
  runnerHasConditionalPaymentContinueDecision,
  baselineShellTradersPlanIsVisible,
  decisionFromChoices,
  selectedChoicesForDecision,
  deckCapabilitiesForInput,
  runnerStrategicIntentForInput,
  isVisibleIcebreakerProgram,
  runnerRunOnlyActionAdjustedSemanticChoice,
  visibleCardPlayOrInstallCostForAi,
  runnerCardLooksLikeCreditPayout,
  runnerBadPublicityOrTraceTechCard,
  runnerCardAddressesVisibleBreakerNeed,
  visibleBreakerCardCanAddressIce,
  runnerProgramInstallTrashAssessment,
  runnerProgramInstallTrashAssessmentForAction,
  runnerProgramInstallDisplacementPenalty,
  runnerProgramSacrificeExclusion,
  runnerMuPressureInstallScoreComponent,
  runnerMuPressureFundingScoreComponent,
  runnerMuPressureInstallPriorityBonus,
  runnerMuPressureFundingPriorityBonus,
  runnerMuPressureActionEvidence,
} = createRunnerBaselineSupportComposition({
  delayedInstallAbilityForAction: shellTradersAbility,
  runnerHasInstalledPrograms,
  visibleBreakerRolesForAi,
  compareAction,
  visibleCardDefinition,
  assessKnownRezzedIcePath,
  rolesForCardId,
  cardDefinitionTypeForAi,
  isRunnerEconomyRole,
  safeNonNegativeInteger,
  findVisibleCard,
  visibleMemoryCost: visibleMemoryCostForAi,
  visibleCardsByInstanceId: visibleCardsByInstanceIdForAi,
  visibleBreakerRoleCounts: visibleBreakerRoleCountsForAi,
  visibleBreakerRoles: visibleBreakerRolesForAi,
  isRunnerPressureRole,
  visibleCounterValue: visibleCounterValueForAi,
  visibleInstallCost: visibleInstallCostForAi,
  actionCreditCost,
  rolesForAction,
  evaluateCorpOpeningHand,
  evaluateRunnerOpeningHand,
  extractAiFeatures,
  scrubEvidence,
});
const {
  semanticRuntimeRunnerMultiRunEventExclusion,
  runnerMultiRunEventScoreComponent,
  runnerMultiRunTargetEvaluation,
  semanticRuntimeRunnerRunTargetEvaluationForAction,
  blinkRiskAssessmentForEncounterBreak,
  runnerBlinkRiskEvidenceForAction,
  runnerBlinkRunExclusion,
} = createRunnerBlinkRiskComposition({
  allNighterDefinitionId: ALL_NIGHTER_CARD_ID,
  sourceDefinitionIdForAction,
  targetServerId: semanticRuntimeServerId,
  payoffClass: runnerRunTargetMultiRunPayoffClass,
  canTakeRun: runnerRunTargetPlausibleForMultiRun,
  scoreValue: runnerMultiRunEventScoreValue,
  deckCapabilitiesForInput,
  strategicIntentForInput: runnerStrategicIntentForInput,
  runTargets: evaluateRunnerRunTargets,
  randomBreakOrDamageRiskProfileForDefinitionId,
  breakSubroutineIndexesForAction,
  encounteredSubroutines: (input) =>
    currentEncounteredIceCard(input)?.effectiveRunQuote?.subroutines ?? [],
  buildBlinkRiskAssessment,
  isImmediateSafetyThreatSubroutine,
  isRemoteServerTarget,
  visibleRootIsKnownAgenda: visibleRootIsKnownAgendaForMetrics,
  runRiskAssessment: assessBlinkRiskForRunAction,
  shouldAvoidRun: (assessment) =>
    blinkRiskShouldAvoidRun(assessment as BlinkRiskAssessment | undefined),
});
const {
  runnerLoanLiabilityAssessment,
  runnerViral15JackOutScoreComponent,
  runnerHandFundingTarget,
  runnerBankInvestmentCommitmentScoreComponents,
  runnerBankInvestmentCommitmentEvidence,
  runnerBankHasConcreteFundingNeed,
  runnerNoRunEconomyCommitmentScoreComponents,
  runnerNoRunEconomyCommitmentEvidence,
  semanticRuntimePlanMemoryActionExclusion,
  runnerPersistentInstallFitScoreComponent,
  runnerPersistentInstallLegacyScoreDelta,
  runnerPersistentInstallEvidenceForAction,
  runnerPersistentInstallEvaluationForAction,
} = createRunnerDevelopmentSupportComposition({
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
  isVisibleIcebreakerProgram,
  cardLooksLikeCreditPayout: runnerCardLooksLikeCreditPayout,
  badPublicityOrTraceTechCard: runnerBadPublicityOrTraceTechCard,
  rolesMatch: (roles, needles) => discardRolesMatch([...roles], [...needles]),
  deckCapabilities: deckCapabilitiesForInput,
  strategicIntent: runnerStrategicIntentForInput,
  previousPlan: getTacticalPlanMemorySnapshot,
  findVisibleCard,
  definitionForCardId: (definitionId) =>
    RUNTIME_CARDS[definitionId] ?? DEMO_CARDS_BY_ID[definitionId],
  serverId: semanticRuntimeServerId,
  definitionType: definitionTypeForMetrics,
  runnerRunTargetEvaluation: runnerMultiRunTargetEvaluation,
  runnerRunTargetHighPayoff,
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
  isRunnerRigInstallAction,
});
const {
  semanticRuntimeCorpActionServerId,
  semanticRuntimeCorpServer,
  semanticRuntimeCorpActionSourceCard,
  semanticRuntimeCorpActionIsScoreLine,
  semanticRuntimeCorpAdvanceCompletesScore,
  semanticRuntimeCorpRemoteIsProtected,
  semanticRuntimeCorpEmptyRemoteCount,
  semanticRuntimeCorpHasRemoteInstability,
  semanticRuntimeCorpActionWouldCreateUnsafeRemoteScoreLine,
  semanticRuntimeCorpHasNakedScoreLine,
  semanticRuntimeCorpHasUnsafeRemoteScoreAction,
  semanticRuntimeCorpInstallRemoteScore,
  semanticRuntimeCorpShouldBuildProtectedScoreRemote,
  semanticRuntimeCorpAdvanceRemoteScore,
  normalizedRulesTextForDefinition,
  semanticRuntimeVisibleCardType,
  semanticRuntimeVisibleCardAdvancementRequirement,
  semanticRuntimeCorpRemoteRezFloorAssessment,
  semanticRuntimeCorpHasRemoteRezFloorFundingNeed,
  semanticRuntimeCorpCentralRezReserveAssessment,
  semanticRuntimeCorpHasCentralRezFloorFundingNeed,
  semanticRuntimeCorpRemoteScoreContestabilityAssessment,
} = createSemanticRuntimeCorpBoardScoreComposition({
  serverId: semanticRuntimeServerId,
  findVisibleCard,
  findVisibleCorpServerCard,
  rolesForAction,
  isRemoteServerTarget,
  actionCreditCost,
  runtimeDefinition: (definitionId) => RUNTIME_CARDS[definitionId],
  demoDefinition: (definitionId) => DEMO_CARDS_BY_ID[definitionId],
  sourceDefinitionIdForAction,
});
const {
  corpOntologyPayoffAvailableForTagSource,
  tagPunishWindowDiagnosticsForSimulationAction,
  corpTaggedPayoffWindowPassiveActionPenalty,
  corpTaggedRunnerPayoffPressure,
} = createCorpTagPunishWindowComposition({
  installedEconomyCreditAmount: corpInstalledEconomyCreditAmount,
  sourceDefinitionIdForAction,
  actionSourceCard: semanticRuntimeCorpActionSourceCard,
  visibleCardStoredCredits: corpVisibleCardStoredCredits,
  visibleMeatDamagePayoff: corpVisibleMeatDamagePayoff,
  runnerRigTrashTarget: corpVisibleRunnerRigTrashTarget,
  runnerResourceTrashEvidence: corpVisibleRunnerResourceTrashEvidence,
  tagPunishAssessmentForAction: corpTagPunishOntologyAssessmentForAction,
  payoffProfileForDefinition: classifyTagPunishPayoffFromOntology,
  actionCreditCost,
  runnerDamagePreventionEvidence:
    corpVisibleRunnerDamagePreventionEvidence,
  runnerHardwareTrashTarget: corpVisibleRunnerHardwareTrashTarget,
  runnerHardwarePayoffEvidence: corpVisibleRunnerHardwarePayoffEvidence,
  advanceCompletesScore: semanticRuntimeCorpAdvanceCompletesScore,
  actionIsScoreLine: semanticRuntimeCorpActionIsScoreLine,
  corpVisibleTagPunishOpportunities,
  runnerSurvivalCounterContextForInput,
  corpTagPunishOntologyAssessmentForAction,
  applyTagPunishOntologyDiagnostics,
  applyCorpVisibleTagPunishTakenWindowDiagnostics,
  applyCorpVisibleTagPunishUnknownSkipDiagnostics,
  strongestCorpTagSourceOpportunity,
  applyCorpTagSourceWindowDiagnostics,
  applyActualTagCreationDiagnostics,
});
const {
  semanticRuntimeCorpAdvancementCounterPlacementAssessment,
  semanticRuntimeCorpEvidence,
  semanticRuntimeCorpScoreComponents,
} = createSemanticRuntimeCorpScoringEvidenceComposition({
  sourceDefinitionIdForAction,
  normalizedRulesTextForDefinition,
  actionCreditCost,
  actionSourceCard: semanticRuntimeCorpActionSourceCard,
  visibleServerCard: findVisibleCorpServerCard,
  cardType: semanticRuntimeVisibleCardType,
  cardAdvancementRequirement: semanticRuntimeVisibleCardAdvancementRequirement,
  teamRestructuringCardId: TEAM_RESTRUCTURING_CARD_ID,
  scoreTerminalWindow: assessCorpScoreTerminalWindow,
  actionIsScoreLine: semanticRuntimeCorpActionIsScoreLine,
  rolesForAction,
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
  corpAdvanceRemoteScore: semanticRuntimeCorpAdvanceRemoteScore,
  corpRemoteRezFloorAssessment: semanticRuntimeCorpRemoteRezFloorAssessment,
  corpCentralRezReserveAssessment: semanticRuntimeCorpCentralRezReserveAssessment,
  corpRemoteScoreContestabilityAssessment:
    semanticRuntimeCorpRemoteScoreContestabilityAssessment,
  corpActionIsScoreLine: semanticRuntimeCorpActionIsScoreLine,
  corpInstallRemoteScore: semanticRuntimeCorpInstallRemoteScore,
  corpHasRemoteInstability: semanticRuntimeCorpHasRemoteInstability,
  corpHasRemoteRezFloorFundingNeed:
    semanticRuntimeCorpHasRemoteRezFloorFundingNeed,
  corpHasCentralRezFloorFundingNeed:
    semanticRuntimeCorpHasCentralRezFloorFundingNeed,
  corpTaggedRunnerPayoffPressure,
  corpTaggedPayoffWindowPassiveActionPenalty,
  scoreFromComponents: semanticRuntimeScoreFromComponents,
});
const {
  semanticRuntimeRunnerSourceCardAnswerRole,
  runnerSelfDamageGuardedDecision,
  runnerSelfDamageImmediateWinSemanticChoice,
  runnerSelfDamageSurvivalAssessment,
  semanticRuntimeActionExclusion,
} = createSemanticRuntimeActionExclusionComposition({
  visibleSourceCard: semanticRuntimeVisibleSourceCard,
  sourceDefinitionId: sourceDefinitionIdForAction,
  sourceDefinitionIdForAction,
  rolesForCardId,
  sourceDefinition: (definitionId) =>
    definitionId
      ? (RUNTIME_CARDS[definitionId] ?? DEMO_CARDS_BY_ID[definitionId])
      : undefined,
  evaluateKnownCentralPayoff: evaluateKnownCentralAccessPayoff,
  definitionType: definitionTypeForMetrics,
  riskAssessment: blinkRiskAssessmentForEncounterBreak,
  shouldAvoidBlinkRiskAssessment: blinkRiskShouldAvoidRun,
  pumpViabilityAssessment,
  breakAccessPathAssessment,
  planMemoryActionExclusion: semanticRuntimePlanMemoryActionExclusion,
  corpAdvancementCounterPlacementAssessment:
    semanticRuntimeCorpAdvancementCounterPlacementAssessment,
  hintEffectsForCard: (definitionId: string) => AI_HINTS.get(definitionId)?.effects,
  fakedHitCardId: FAKED_HIT_CARD_ID,
  badPublicityLossThreshold: BAD_PUBLICITY_LOSS_THRESHOLD_FOR_AI,
  scoreRunnerActions: (input: AiDecisionInput) =>
    scoreActionsForLegacy(input, "runner", {
      extractAiFeatures,
      scoreRunnerAction,
      scoreCorpAction,
    }),
  compareAction,
  selectedChoicesForDecision,
  scrubEvidence,
  runnerProgramSacrificeExclusion,
  runnerMultiRunEventExclusion: semanticRuntimeRunnerMultiRunEventExclusion,
  runnerRunTargetEvaluationForAction:
    semanticRuntimeRunnerRunTargetEvaluationForAction,
  runnerBlinkRunExclusion,
  isRemoteServerTarget,
  knownIcePathReason: semanticRuntimeKnownIcePathReason,
});
const { chooseSemanticRuntimeAction } = createSemanticRuntimeDecisionComposition({
  visibleSourceCard: semanticRuntimeVisibleSourceCard,
  isVisibleIcebreakerProgram,
  visibleBreakerCardCanAddressIce,
  serverId: semanticRuntimeServerId,
  knownPathAssessment: (server, runtimeInput) =>
    assessKnownRezzedIcePath(
      server.ice,
      runtimeInput.playerView.own.rig ?? [],
      runtimeInput.playerView.own.credits,
      server.root,
    ),
  rolesForAction,
  scoreTerminalWindow: assessCorpScoreTerminalWindow,
  actionTypeIsReactive: semanticRuntimeActionTypeIsReactive,
  runnerRunTargets: (runtimeInput) =>
    evaluateRunnerRunTargets({ input: runtimeInput }),
  runnerRunTargetPlausibleForMultiRun,
  runnerRunTargetHighPayoff,
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
  corpEvidence: semanticRuntimeCorpEvidence,
  isRemoteServerTarget,
  runnerSourceCardAnswerRole: semanticRuntimeRunnerSourceCardAnswerRole,
  actionExclusion: semanticRuntimeActionExclusion,
  actionCreditCost,
  explanation: semanticRuntimeExplanation,
  compareAction,
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
  selectedChoicesForDecision,
  rememberTacticalPlanRuntime,
  scrubEvidence,
});
const {
  chooseAiAction,
  chooseCorpAction,
  chooseCorpBaselineAction,
  chooseRunnerAction,
  chooseRunnerBaselineAction,
  scoreRunnerAction,
  scoreCorpAction,
} = createAiActionEntrypointsComposition({
  chooseSemanticRuntimeAction,
  extractAiFeatures,
  decisionFromChoices,
  hasCorpPlanAction,
  isCorpReactiveBaselineDecision,
  chooseCorpPlanAction,
  hasRunnerPlanAction,
  isRunnerReactiveBaselineDecision,
  baselineShellTradersPlanIsVisible,
  runnerHasConditionalPaymentContinueDecision,
  chooseRunnerPlanAction,
  runnerSelfDamageGuardedDecision,
  rolesForAction,
  rolesForCardId,
  runnerProgramInstallTrashAssessment,
  runnerProgramInstallTrashAssessmentForAction,
  runnerProgramInstallDisplacementPenalty,
  runnerRemoteTrashAccessContext,
  encounterBreakReserveContext,
  pumpViabilityAssessment,
  runnerMuPressureInstallPriorityBonus,
  runnerMuPressureFundingPriorityBonus,
  runnerPersistentInstallEvaluationForAction,
  runnerPersistentInstallLegacyScoreDelta,
  corpTagPunishOntologyAssessmentForAction,
  corpOntologyPayoffAvailableForTagSource,
});
export {
  chooseAiAction,
  chooseCorpAction,
  chooseCorpBaselineAction,
  chooseRunnerAction,
  chooseRunnerBaselineAction,
};

const {
  semanticRuntimeRunnerScoreComponents,
} = createRunnerScoringSupportComposition({
  evaluationForAction: semanticRuntimeRunnerRunTargetEvaluationForAction,
  guidanceValue: runnerRunTargetSemanticGuidanceValue,
  isRemoteServerTarget,
  remoteRootTrashCost: remoteRootTrashCostForMetrics,
  rndTopFreshness: (input: AiDecisionInput) =>
    reconstructBeliefState(input).runnerOpponentModel?.rndTopFreshness,
  staleKnownRndRepeatRunPenalty,
  rndFreshRepeatRunBoost,
  hqHandMemory: (input: AiDecisionInput) =>
    reconstructBeliefState(input).runnerOpponentModel?.hqHandMemory,
  definitionType: definitionTypeForMetrics,
  staleKnownHqRepeatRunPenalty,
  publicHistory: mergedAiPublicHistory,
  eventVersion: aiEventVersion,
  serverIdFromEvent: aiServerIdFromEvent,
  closeout: bestTrueCentralCloseoutProfileForMetrics,
  pressureReadyTargets: (input: AiDecisionInput) =>
    assessRunnerPressureReadyForMetrics(input).readyTargets,
  trashAccessContext: runnerRemoteTrashAccessContext,
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
  targetServerId: semanticRuntimeServerId,
  blinkAssessment: runnerBlinkRecoveryAssessment,
  rolesForAction,
  sourceDefinitionIdForAction,
  handFundingTarget: runnerHandFundingTarget,
  bankHasConcreteFundingNeed: runnerBankHasConcreteFundingNeed,
  hasKnownUnaffordableLegalRun: runnerHasKnownUnaffordableLegalRun,
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
  badPublicityRelevance: {
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
  },
  loanLiabilityAssessment: runnerLoanLiabilityAssessment,
  goalFit: {
    sourceCardAnswerRole: semanticRuntimeRunnerSourceCardAnswerRole,
    runActionSpendingCapAssessment: runnerRunActionSpendingCapAssessment,
    runTargetEvaluationForAction:
      semanticRuntimeRunnerRunTargetEvaluationForAction,
  },
  recoveryCommitment: {
    muPressureFundingScoreComponent: runnerMuPressureFundingScoreComponent,
    handBufferNeedScoreComponent: runnerHandBufferNeedScoreComponent,
    viral15JackOutScoreComponent: runnerViral15JackOutScoreComponent,
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
    isRemoteServerTarget,
  },
});

const {
  simulateAiGame,
  runV143ExploitRegressionFixtures,
  runV143SimulationLeague,
  runDoctrineQualityBenchmark,
  runMatchProgressionBenchmark,
  runMatchProgressionBenchmarkSuite,
  runAiSelfplayTraceMining,
  simulateAiSoak,
} = createAiSimulationComposition({
  extractFeatures: extractAiFeatures,
  findVisibleCard,
  rolesForAction,
  chooseAiAction,
  chooseRunnerAction,
  chooseCorpAction,
  chooseRunnerBaselineAction,
  chooseCorpBaselineAction,
  selectedChoicesForDecision,
  runnerHandUseDiagnosticsForSimulationAction,
  runnerReserveDiagnosticsForSimulationAction,
  runnerCentralPressureDiagnosticsForSimulationAction,
  runnerBreakerCoverageDiagnosticsForSimulationAction,
  runnerEconomySetupDiagnosticsForSimulationAction,
  tagPunishWindowDiagnosticsForSimulationAction,
  corpFutureRunIceDiagnosticsForSimulationAction,
  corpIcePortfolioDiagnosticsForSimulationAction,
  corpScoreTerminalDiagnosticsForSimulationAction,
  corpEconomyBeforeScoreDiagnosticsForSimulationAction,
  summarizeMatchProgressionMetrics,
});
export { simulateAiGame };
export { summarizeMatchProgressionMetrics };
export {
  runV143ExploitRegressionFixtures,
  runV143SimulationLeague,
  runDoctrineQualityBenchmark,
  runMatchProgressionBenchmark,
  runMatchProgressionBenchmarkSuite,
  runAiSelfplayTraceMining,
  simulateAiSoak,
};
