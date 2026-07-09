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
export type { SemanticRuntimeWhyCoverageReport } from "./diagnostics/semantic-runtime-why-coverage";
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
export {
  buildAiDecisionInput,
  selectAiDecisionSideForState,
} from "./runtime/ai-decision-input";
export type {
  AiDecisionInputWithDeckCapabilities,
  AiDecisionSideSelection,
} from "./runtime/ai-decision-input";
export {
  assessCorpIcePlacementForDiagnostics,
  buildCorpIceCardPlacementProfile,
  buildCorpIceDensityProfile,
  buildCorpServerNeedProfile,
  classifyCorpFutureRunIcePlacementProfile,
  corpIcePlacementCandidateForAction,
  corpIcePlacementEvaluationForActions,
  corpIcePlacementScoreComponent,
} from "./runtime/corp-ice-placement/corp-ice-placement";
export type {
  CorpFutureRunIceClass,
  CorpIceCardPlacementProfile,
  CorpIceDensityProfile,
  CorpIcePlacementCandidate,
  CorpIcePlacementDiagnosticsAssessment,
  CorpIcePlacementEvaluation,
  CorpIcePlacementRecommendation,
  CorpServerNeedProfile,
} from "./runtime/corp-ice-placement/corp-ice-placement";
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
export type { AiDeckStrategyDeckSnapshot } from "./deck-strategy-snapshot";
export {
  AiDeckSnapshotRuntimeError,
  assertValidAiDeckSnapshotForRuntime,
  isAiDeckSnapshotRuntimeError,
} from "./deck-strategy-snapshot-validation";
export type {
  AiDeckSnapshotRuntimeErrorCode,
  AiDeckSnapshotRuntimeExpectation,
} from "./deck-strategy-snapshot-validation";
export {
  evaluateCorpOpeningHand,
  evaluateRunnerOpeningHand,
} from "./deck-opening-hand";
export type {
  CorpOpeningHandEvaluation,
  OpeningHandEvaluation,
  RunnerOpeningHandEvaluation,
} from "./deck-opening-hand";
export { buildDeckStrategyProfile } from "./deck-doctrine-strategy";
export type {
  AiDeckStrategyProfile,
  CorpDeckStrategyProfiles,
  DeckStrategyConfidence,
  DeckStrategyEvidence,
  DeckStrategyScore,
  RunnerDeckStrategyProfiles,
} from "./deck-doctrine-strategy";
export { evaluatePracticalTacticBenchmark } from "./evaluation/practical-tactic-benchmark";
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

export {
  chooseAiAction,
  chooseCorpAction,
  chooseRunnerAction,
} from "./ai-runtime-public-entrypoints";
