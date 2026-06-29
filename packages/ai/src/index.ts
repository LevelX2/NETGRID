// Public package facade. Keep new AI behavior in focused runtime, decision,
// action, access, diagnostics, reports or simulation modules, then re-export
// only intentional public contracts here.
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
  buildSemanticRuntimeWhyCoverageReport,
  renderSemanticRuntimeWhyCoverageMarkdown,
  SEMANTIC_RUNTIME_WHY_COVERAGE_SCHEMA_VERSION,
} from "./diagnostics/semantic-runtime-why-coverage";
export type {
  SemanticRuntimeWhyCoverageReport,
} from "./diagnostics/semantic-runtime-why-coverage";
export {
  AI_DECISION_INPUT_TOP_LEVEL_FIELDS,
  buildAiDecisionInputDto,
} from "./input-dto";
export {
  buildLegalActionWitness,
  legalActionWitnessIsRedactionSafe,
} from "./legalaction-witness";
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
export { buildPlayerActionFromWitness } from "./playeraction-dry-run-builder";
export type { PlayerActionWitnessBuildInput } from "./playeraction-dry-run-builder";
export { formatDoctrineQualityCaseAnalysisReport } from "./reports/simulation-report-formatters";
export {
  buildAiDecisionInput,
  selectAiDecisionSideForState,
} from "./runtime/ai-decision-input";
export type {
  AiDecisionInputWithDeckCapabilities,
  AiDecisionSideSelection,
} from "./runtime/ai-decision-input";
export { createBeliefSimulationWorld } from "./simulation/belief-simulation-world";
export { listMatchProgressionBenchmarkDeckSlots } from "./simulation/benchmark-deck-slot-list";
export type {
  AiBenchmarkDeckReference,
  AiBenchmarkDeckSlotDefinition,
  AiBenchmarkDeckSlotStatus,
  AiBenchmarkDeckSlotType,
  AiBenchmarkLocalEditableDeckResult,
  AiBenchmarkSnapshotDeck,
  AiLocalBenchmarkDeckClassification,
} from "./simulation/benchmark-deck-types";
export {
  evaluateDoctrineQualityGate,
  formatAiSelfplayTraceMiningReport,
  formatDoctrineQualityBenchmarkReport,
  formatMatchProgressionBenchmarkReport,
  formatMatchProgressionBenchmarkSuiteReport,
} from "./simulation/benchmark-reports";
export type {
  AiDoctrineQualityBenchmarkConfig,
  AiDoctrineQualityBenchmarkResult,
} from "./simulation/doctrine-quality-benchmark-types";
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
export type {
  AiQualityMetrics,
  AiSoakResult,
} from "./simulation/quality-metrics";
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
export { assertAiInputIsSideSafe } from "./simulation/side-safe-input";
export {
  listV143BenchmarkProfiles,
  listV143ExploitFixtures,
} from "./simulation/v143-data";
export type {
  V143ExploitFixture,
  V143ExploitRegressionResult,
} from "./simulation/v143-fixture-types";
export { evaluateV143TuningGate } from "./simulation/v143-tuning-gate";
export type {
  V143LeagueConfig,
  V143SimulationRunResult,
  V143SoakResult,
  V143TuningGateResult,
} from "./simulation/v143-tuning-gate";
export { evaluateStalePunishGoalSwitchShadow } from "./stale-punish-goal-switch-shadow";
export type {
  StalePunishGoalSwitchInput,
  StalePunishGoalSwitchShadow,
  StalePunishRootCause,
} from "./stale-punish-goal-switch-shadow";
export {
  buildTargetRef,
  targetRefFromIdentity,
  targetRefIsCompleteOrIrrelevant,
  targetRefIsRedactionSafe,
} from "./target-ref";
export type {
  TargetRef,
  TargetRefInput,
  TargetRefKind,
  TargetRefRedactionPolicy,
} from "./target-ref";
export { buildWitnessOpportunityProjection } from "./witness-opportunity-projection";
export type {
  BuildWitnessOpportunityProjectionInput,
  WitnessOpportunityProjection,
  WitnessOpportunityProjectionStatus,
} from "./witness-opportunity-projection";

export {
  classifyBreakerCoverageFromOntology,
  compareBreakerProfilesForCoverage,
  estimateBreakerCostProfileFromOntology,
  estimateStructuredBreakerCostForIce,
  getStructuredBreakerProfileForCard,
  structuredBreakerProfileCoversIce,
} from "./breaker-ontology-consumer";
export {
  assessCorpFutureRunIcePlacement,
  assessCorpIcePortfolioAction,
  assessCorpScoreTerminalWindow,
  chooseCorpPlanAction,
  chooseCorpPlanDecision,
  classifyCorpFutureRunIceDefinitionId,
  classifyCorpScoredAgendaAbility,
  classifyScoredAgendaActionFromOntology,
  corpPlanUsesOnlyAiSupportedCards,
  evaluateAgendaRisk,
  evaluateCorpPlan,
  evaluateCorpScoringProgress,
  evaluateEconomyReserve,
  evaluateIceRez,
  evaluateRemoteIntentMemory,
  evaluateRemoteRezReserve,
  evaluateRemoteScoreHorizon,
  evaluateRunnerContestCapacity,
  evaluateScoringWindow,
  evaluateServerThreat,
  generateCorpPlanCandidates,
  hasCorpPlanAction,
} from "./legacy/legacy-public-contract";
export type {
  CorpIcePortfolioActionAssessment,
  CorpPlanCandidate,
  CorpPlanDebug,
  CorpPlanDecision,
  CorpPlanEvaluatorResult,
  CorpPlanKind,
  CorpPlanScore,
  CorpPlanStep,
  RemoteScoreHorizon,
  RunnerContestCapacity,
} from "./legacy/legacy-public-contract";
export {
  buildDeckCapabilityProfile,
  buildDeckCapabilityProfileFromInput,
  redactedDeckCapabilityFacts,
} from "./deck-capabilities";
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
export {
  buildDeckDoctrineProfile,
  evaluateCorpOpeningHand,
  evaluateRunnerOpeningHand,
} from "./legacy/legacy-public-contract";
export type {
  AiDeckDoctrineDeckSnapshot,
  CorpOpeningHandEvaluation,
  OpeningHandEvaluation,
  RunnerOpeningHandEvaluation,
} from "./legacy/legacy-public-contract";
export { buildDeckStrategyProfile } from "./deck-doctrine-strategy";
export type {
  AiDeckStrategyProfile,
  CorpDeckStrategyProfiles,
  DeckStrategyConfidence,
  DeckStrategyEvidence,
  DeckStrategyScore,
  RunnerDeckStrategyProfiles,
} from "./deck-doctrine-strategy";
export {
  evaluatePracticalTacticBenchmark,
  frozenLegacyPracticalTacticSelector,
} from "./evaluation/practical-tactic-benchmark";
export type {
  PracticalTacticBenchmarkCase,
  PracticalTacticBenchmarkCategory,
  PracticalTacticBenchmarkResult,
} from "./evaluation/practical-tactic-benchmark";
export { buildAiDeckOntologySummary } from "./hint-ontology-doctrine";
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
export {
  classifyRemoteRoleFromOntology,
  getStructuredRemoteRoleForCard,
  remoteRoleIsScoringProtectionKind,
  structuredRemoteRoleSafetyAssessmentForCard,
} from "./remote-role-ontology-consumer";
export {
  evaluateRunnerHandDevelopment,
  redactedRunnerHandDevelopmentFacts,
  RUNNER_HAND_DEVELOPMENT_EVALUATION_SCHEMA_VERSION,
  RUNNER_PERSISTENT_INSTALL_EVALUATION_SCHEMA_VERSION,
} from "./runner-hand-development";
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
export {
  chooseRunnerPlanAction,
  chooseRunnerPlanDecision,
  estimateRunCost,
  evaluateCorpScoringThreat,
  evaluateRemoteThreat,
  evaluateRunnerEarlyTurnDoctrine,
  evaluateRunnerPlan,
  evaluateRunnerRig,
  evaluateServerAccessValue,
  generateRunnerPlanCandidates,
  hasRunnerPlanAction,
  runnerPlanUsesOnlyAiSupportedCards,
} from "./legacy/legacy-public-contract";
export type {
  RunnerPlanCandidate,
  RunnerPlanDebug,
  RunnerPlanDecision,
  RunnerPlanEvaluatorResult,
  RunnerPlanKind,
  RunnerPlanScore,
  RunnerPlanStep,
} from "./legacy/legacy-public-contract";
export {
  buildRunnerEconomyPosture,
  evaluateRunnerRunTargets,
  RUNNER_CREDIT_BASE_PLAN_SCHEMA_VERSION,
  RUNNER_ECONOMY_POSTURE_SCHEMA_VERSION,
  RUNNER_RUN_TARGET_EVALUATION_SCHEMA_VERSION,
} from "./runner-run-target-evaluation";
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
export {
  buildRunnerStrategicIntentProfile,
  RUNNER_STRATEGIC_INTENT_SCHEMA_VERSION,
} from "./runner-strategic-intent";
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
  buildRunnerTacticalGoals,
  redactedRunnerTacticalGoalFacts,
  RUNNER_TACTICAL_GOAL_SCHEMA_VERSION,
} from "./runner-tactical-goals";
export type {
  BuildRunnerTacticalGoalsParams,
  RunnerTacticalGoal,
  RunnerTacticalGoalFamily,
  RunnerTacticalGoalId,
} from "./runner-tactical-goals";
export {
  classifyTagPunishLegalActionFromOntology,
  classifyTagPunishPayoffFromOntology,
  classifyTagSourceFromOntology,
} from "./tag-punish-ontology-consumer";
export { buildObservedFacts } from "./observed-facts-public";

export type {
  AiBenchmarkDeckSlotResult,
  AiMatchProgressionBenchmarkResult,
  AiMatchProgressionBenchmarkSuiteResult,
  AiMatchProgressionMetrics,
  AiMatchProgressionProfileComparison,
} from "./simulation/ai-match-progression-types";
export type { AiSimulationConfig } from "./simulation/ai-simulation-config";
export type { AiSimulationSummary } from "./simulation/ai-simulation-summary";
export {
  benchmarkDeckFromFrozenLocalSnapshot,
  benchmarkDeckFromSnapshot,
} from "./simulation/benchmark-deck-snapshot-resolver";
export { benchmarkDeckFromLocalEditableDeck } from "./simulation/benchmark-local-editable-deck-resolver";
export {
  buildSemanticRuntimeWhyCoverageReportFromSimulationSummaries,
} from "./simulation/selfplay-why-coverage";
export {
  buildSelfplayActionTypeDominanceReport,
} from "./simulation/selfplay-action-type-dominance";
export type {
  AiSelfplayActionTypeDominanceBucket,
  AiSelfplayActionTypeDominanceReport,
  AiSelfplayActionTypeDominanceRow,
  AiSelfplayActionTypeDominanceStatus,
} from "./simulation/selfplay-action-type-dominance";
export type {
  SimulationBenchmarkProfile,
  SimulationBenchmarkProfileId,
  SimulationControllerMode,
  SimulationWorld,
} from "./simulation/simulation-types";

export {
  chooseAiAction,
  chooseCorpAction,
  chooseCorpBaselineAction,
  chooseRunnerAction,
  chooseRunnerBaselineAction,
  runAiSelfplayTraceMining,
  runDoctrineQualityBenchmark,
  runMatchProgressionBenchmark,
  runMatchProgressionBenchmarkSuite,
  runV143ExploitRegressionFixtures,
  runV143SimulationLeague,
  simulateAiGame,
  simulateAiSoak,
  summarizeMatchProgressionMetrics,
} from "./ai-runtime-public-entrypoints";
