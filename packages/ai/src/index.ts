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
import {
  cardDefinitionTypeForAi,
  runnerCardMechanicsForAi,
  visibleCardDefinition,
} from "./runtime/card-definition-lookup";
import {
  createVisibleIcebreakerProgramPredicate,
} from "./runtime/visible-icebreaker-program";
import { createAiActionEntrypoints } from "./runtime/ai-action-entrypoints";
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
  createRunnerAccessPathContext,
} from "./runtime/runner-access-path-context";
import {
  createRunnerEncounterBreakContext,
} from "./runtime/runner-encounter-break-context";
import {
  createRunnerPumpFuturePathContext,
} from "./runtime/runner-pump-future-path-context";
import {
  createRunnerPumpViabilityContext,
} from "./runtime/runner-pump-viability-context";
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
import {
  createSemanticRuntimeDecisionContext,
} from "./runtime/semantic-runtime-decision-context";
import {
  createPracticalMicroCandidatesContext,
} from "./runtime/practical-micro-candidates-context";
import { createDeckCapabilitiesContext } from "./runtime/deck-capabilities-context";
import {
  createSemanticRuntimeVisibleCardContext,
} from "./runtime/semantic-runtime-visible-card-context";
import {
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
  createSemanticRuntimeCorpCentralRezContext,
} from "./runtime/semantic-runtime-corp-central-rez-context";
import {
  createSemanticRuntimeCorpRemoteContestabilityContext,
} from "./runtime/semantic-runtime-corp-remote-contestability-context";
import {
  createCorpTagPunishPayoffProfileContext,
} from "./runtime/corp-tag-punish-payoff-profiles";
import {
  createCorpTagSourcePayoffContext,
} from "./runtime/corp-tag-source-payoff-context";
import {
  createCorpTaggedPayoffWindowContext,
} from "./runtime/corp-tagged-payoff-window";
import {
  createCorpTaggedRunnerPayoffPressureContext,
} from "./runtime/corp-tagged-runner-payoff-pressure";
import {
  createCorpTaggedRunnerPayoffProfileContext,
} from "./runtime/corp-tagged-runner-payoff-profile";
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
  createRunnerBlinkEncounterBreakContext,
} from "./runtime/runner-blink-encounter-break-context";
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
import { createRunnerBreakerCoverageDiagnosticsForSimulationAction } from "./simulation/runner-breaker-coverage-diagnostics";
import { createRunnerCentralPressureDiagnosticsForSimulationAction } from "./simulation/runner-central-pressure-diagnostics";
import { createRunnerEconomySetupDiagnosticsForSimulationAction } from "./simulation/runner-economy-setup-diagnostics";
import { createRunnerHandUseDiagnosticsForSimulationAction } from "./simulation/runner-hand-use-diagnostics";
import { createRunnerReserveDiagnosticsForSimulationAction } from "./simulation/runner-reserve-diagnostics";
import { applyTagPunishOntologyDiagnostics } from "./simulation/tag-punish-ontology-diagnostics";
import {
  applyCorpVisibleTagPunishTakenWindowDiagnostics,
} from "./simulation/corp-visible-tag-punish-taken-diagnostics";
import { runnerSurvivalCounterContextForInput } from "./simulation/runner-survival-counter-context";
import type { CorpIcePortfolioMetricKey } from "./simulation/corp-ice-portfolio-types";
import { createRunnerPressureMetricContext } from "./simulation/runner-pressure-metrics";
import {
  createRunnerEconomySetupActionClassContext,
} from "./simulation/runner-economy-setup-types";
import {
  createRunnerCoverageActionContext,
  createRunnerSetupCoverageContext,
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
  createRunnerCentralRunPressureJustificationContext,
} from "./simulation/central-run-pressure-justification";
import {
  createNoFreshCentralSubstitutionTypeForAction,
  createRunnerNoFreshCentralContext,
  createTrueCentralCloseoutProfileContext,
} from "./simulation/no-fresh-central";
import {
  centralRunStreakWithoutValueForMetrics,
  recentCentralRunSameTargetWithoutRefresh,
} from "./simulation/central-run-history";
import {
  createRunnerRemoteThreatProfile,
  createRunnerRemoteThreatTargetingDiagnosticsForAction,
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
  createTagPunishWindowDiagnosticsContext,
} from "./simulation/tag-punish-window-diagnostics-context";
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
import { createRunnerRemoteTrashAccessContext } from "./simulation/remote-trash-access-context";
import {
  createRunnerCreditReserveTargetForInput,
  createRunnerPostRunReserveTargetForRemoteInput,
} from "./simulation/runner-credit-reserve";
import { type AiQualityMetrics } from "./simulation/quality-metrics";
import {
  createQualityTagsForAction,
} from "./simulation/simulation-quality-adapters";
import {
  createRunnerInstallClassificationContext,
} from "./simulation/runner-install-classification";
import {
  runnerHasRecentRunOnServer,
  runnerRunTargetHasOnlyUnknownOrUnrezzedIce,
} from "./simulation/runner-run-target-context";
import {
  createRunnerCoverageRepairDiagnostic,
  createRunnerKnownPathCostContext,
  createRunnerKnownPathDiagnosticsForAction,
  createRunnerKnownNoAccessLegalRunTargets,
} from "./simulation/runner-known-no-access";
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
import {
  createLegacyDecisionContext,
} from "./legacy/legacy-decision-context";
import { scoreActionsForLegacy } from "./legacy/legacy-action-scorer";
import {
  BENCHMARK_PROFILES_143,
  listV143BenchmarkProfiles,
  listV143ExploitFixtures,
} from "./simulation/v143-data";
import { SOAK_SEEDS_143 } from "./simulation/soak-seed-data";
import {
  createSimulationDecisionContext,
} from "./simulation/simulation-decision-context";
import { createAiSimulationEntrypoints } from "./simulation/ai-simulation-entrypoints";
import { createAiGameSimulator } from "./simulation/ai-game-simulator";
import { summarizeMatchProgressionMetrics } from "./simulation/match-progression-summary";
import { createLegacyCorpActionScorer } from "./legacy/corp-baseline-action-score";
import { createLegacyRunnerActionScorer } from "./legacy/runner-baseline-action-score";
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
  centralRunEventGoodForTarget,
  strongestCorpTagSourceOpportunity,
  corpPunishKindForAction,
  isCorpTagSourceAction,
  isCorpTraceTagSourceAction,
  corpTagPunishOntologyAssessmentForAction,
  corpVisibleTagPayoffCategoryForAction,
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
  bestTrueCentralCloseoutProfile: bestTrueCentralCloseoutProfileForMetrics,
  trueCentralCloseoutProfile: trueCentralCloseoutProfileForMetrics,
} = createTrueCentralCloseoutProfileContext({
  assessKnownRezzedIcePath,
  rolesForCardId,
  sourceDefinitionIdForAction: sourceDefinitionIdForSimulationAction,
});

const runnerCreditReserveTargetForInput = createRunnerCreditReserveTargetForInput({
  rolesForCardId,
});
const {
  estimatedEncounterBreakCost,
  encounterBreakReserveContext,
} = createRunnerEncounterBreakContext({
  actionCreditCost,
  findVisibleCard,
  runnerCreditReserveTarget: runnerCreditReserveTargetForInput,
});
const {
  breakAccessPathAssessment,
  encounterRemotePayoffAfterBreakAssessment,
} = createRunnerAccessPathContext({
  breakSubroutineIndexesForAction,
  currentEncounteredIceCard,
  actionCreditCost,
  estimatedEncounterBreakCost,
  assessKnownRezzedIcePath,
  knownIcePathReason: semanticRuntimeKnownIcePathReason,
  isRemoteServerTarget,
  definitionType: definitionTypeForMetrics,
  remoteRootTrashCost: remoteRootTrashCostForMetrics,
});
const {
  encounterFuturePathAfterPumpBreakAssessment,
} = createRunnerPumpFuturePathContext({
  assessKnownRezzedIcePath,
  knownIcePathReason: semanticRuntimeKnownIcePathReason,
});
const { pumpViabilityAssessment } = createRunnerPumpViabilityContext({
  findVisibleCard,
  encounterRunRemainderEffectAssessment,
  encounterHasImmediateUnbrokenThreat,
  actionCreditCost,
  estimatedEncounterBreakCost,
  encounterFuturePathAfterPumpBreakAssessment,
  encounterRemotePayoffAfterBreakAssessment,
  runnerCreditReserveTarget: runnerCreditReserveTargetForInput,
});

const runnerPostRunReserveTargetForRemoteInput =
  createRunnerPostRunReserveTargetForRemoteInput({
    remoteServerHasScoreThreat,
    rolesForCardId,
  });

const runnerRemoteThreatProfile = createRunnerRemoteThreatProfile({
  runnerPostRunReserveTargetForRemoteInput,
});

const {
  runnerRunKnownPathCost,
  runnerHasKnownUnaffordableLegalRun,
} = createRunnerKnownPathCostContext({
  assessKnownRezzedIcePath,
});

const {
  runnerVisibleMissingBreakerCoverage,
  runnerMissingCoverageTypesForInput,
  runnerHasKnownBlockedPathByCoverage,
} = createRunnerSetupCoverageContext({
  assessKnownRezzedIcePath,
  rolesForCardId,
});

const {
  runnerCoverageSearchActionForMetrics,
  runnerCoverageRecoveryActionForMetrics,
} = createRunnerCoverageActionContext({
  findVisibleCard,
  rolesForAction,
});

const {
  runnerCentralRunHasClearPressureJustification:
    runnerCentralRunHasClearPressureJustificationForInput,
  runnerCentralRunPressureJustificationReasons:
    runnerCentralRunPressureJustificationReasonsForInput,
  runnerCentralRunBurnsRemoteContestReserve:
    runnerCentralRunBurnsRemoteContestReserveForInput,
} = createRunnerCentralRunPressureJustificationContext({
  assessKnownRezzedIcePath,
  recentCentralRunSameTargetWithoutRefresh,
  rolesForCardId,
  runnerCreditReserveTargetForInput,
  trueCentralCloseoutProfileForMetrics,
});

const runnerRemoteThreatTargetingDiagnosticsForAction =
  createRunnerRemoteThreatTargetingDiagnosticsForAction({
    runnerRemoteThreatProfile,
    runnerCentralRunHasClearPressureJustification:
      runnerCentralRunHasClearPressureJustificationForInput,
    runnerCentralRunPressureJustificationReasons:
      runnerCentralRunPressureJustificationReasonsForInput,
    runnerCentralRunBurnsRemoteContestReserve:
      runnerCentralRunBurnsRemoteContestReserveForInput,
  });

const runnerRemoteTrashAccessContext = createRunnerRemoteTrashAccessContext({
  runnerCreditReserveTargetForInput,
});

const runnerKnownNoAccessLegalRunTargets =
  createRunnerKnownNoAccessLegalRunTargets({
    assessKnownRezzedIcePath,
    runnerKnownPathAssessmentIsKnownNoAccess,
    runnerRunTargetHasOnlyUnknownOrUnrezzedIce,
  });

const runnerCoverageRepairDiagnostic = createRunnerCoverageRepairDiagnostic({
  runnerKnownNoAccessLegalRunTargets,
  findVisibleCard,
  rolesForCardId,
});

const runnerKnownPathDiagnosticsForAction =
  createRunnerKnownPathDiagnosticsForAction({
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
} = createRunnerInstallClassificationContext({
  rolesForAction,
  rolesForCardId,
  sourceDefinitionIdForAction: sourceDefinitionIdForSimulationAction,
  isSearchChoice,
});

const runnerReserveDiagnosticsForSimulationAction =
  createRunnerReserveDiagnosticsForSimulationAction({
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
  });

const runnerHandUseDiagnosticsForSimulationAction =
  createRunnerHandUseDiagnosticsForSimulationAction({
    runnerDrawKindForSimulationAction,
    hasRunnerPlayableEconomyAction,
    hasRunnerInstallableBreakerAction,
    hasRunnerRunnablePressureAction,
    hasRunnerRemoteTrashAction,
    runnerDiscardChoiceRoles,
    isRunnerDuplicateInstall,
    isRunnerLowValueDuplicateInstall,
    isRunnerEconomyAction,
    isRunnerRigInstallAction,
    isRunnerPressureAction,
    sourceDefinitionIdForSimulationAction,
    runnerRemoteTrashAccessContext,
    runnerAdvancedRemoteContestContext,
  });

const runnerEconomySetupActionClass =
  createRunnerEconomySetupActionClassContext({
    definitionForAction: definitionForSimulationAction,
    isRunnerEconomyAction,
    rolesForAction,
    runnerCoverageRecoveryActionForMetrics,
    runnerCoverageSearchActionForMetrics,
    sourceDefinitionIdForAction: sourceDefinitionIdForSimulationAction,
  });

const runnerEconomySetupDiagnosticsForSimulationAction =
  createRunnerEconomySetupDiagnosticsForSimulationAction({
    runnerEconomySetupActionClass,
    runnerCreditReserveTargetForInput,
    runnerHasKnownUnaffordableLegalRun,
    runnerAdvancedRemoteContestContext,
    hasRunnerRunnablePressureAction,
    hasRunnerInstallableBreakerAction,
    hasRunnerRemoteTrashAction,
    runnerDrawKindForSimulationAction,
    isRunnerRigInstallAction,
    runnerVisibleMissingBreakerCoverage,
    runnerHasKnownBlockedPathByCoverage,
    runnerMissingCoverageTypesForInput,
    definitionForSimulationAction,
    runnerRunKnownPathCost,
    runnerSetupChosenFamilyForEntry,
  });

const noFreshCentralSubstitutionTypeForAction =
  createNoFreshCentralSubstitutionTypeForAction({
    isRunnerEconomyAction,
    rolesForAction,
    sourceDefinitionIdForAction: sourceDefinitionIdForSimulationAction,
  });

const runnerNoFreshCentralContextForMetrics = createRunnerNoFreshCentralContext({
  assessKnownRezzedIcePath,
  centralRunStreakWithoutValueForMetrics,
  isRunnerEconomyAction,
  rolesForAction,
  rolesForCardId,
  runnerCreditReserveTargetForInput,
  runnerRemoteThreatProfile,
  sourceDefinitionIdForAction: sourceDefinitionIdForSimulationAction,
});

const runnerCentralPressureDiagnosticsForSimulationAction =
  createRunnerCentralPressureDiagnosticsForSimulationAction({
    rolesForCardId,
    sourceDefinitionIdForSimulationAction,
    bestTrueCentralCloseoutProfileForMetrics,
    trueCentralCloseoutProfileForMetrics,
    runnerNoFreshCentralContextForMetrics,
    noFreshCentralSubstitutionTypeForAction,
    runnerCreditReserveTargetForInput,
    assessKnownRezzedIcePath,
  });

const {
  assessRunnerPressureReadyForMetrics,
  assessRunnerCoveragePressureForMetrics,
} = createRunnerPressureMetricContext({
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
  runnerCoverageSearchActionForMetrics,
  runnerCoverageRecoveryActionForMetrics,
});

const runnerBreakerCoverageDiagnosticsForSimulationAction =
  createRunnerBreakerCoverageDiagnosticsForSimulationAction({
    assessRunnerCoveragePressureForMetrics,
    assessRunnerPressureReadyForMetrics,
    isRunnerEconomyAction,
    isRunnerRigInstallAction,
    runnerCoverageSearchActionForMetrics,
  });

const { decisionFromChoices, selectedChoicesForDecision } =
  createLegacyDecisionContext({
    evaluateCorpOpeningHand,
    evaluateRunnerOpeningHand,
    discardKeepScore: (input, card) => discardKeepScore(input, card),
    selectedRunnerProgramInstallTrashOptionIds: (input, choice, options) =>
      selectedRunnerProgramInstallTrashOptionIds(input, choice, options),
    selectedRunnerForcedProgramTrashOptionIds: (input, options) =>
      selectedRunnerForcedProgramTrashOptionIds(input, options),
    extractAiFeatures,
    rolesForCardId,
    scrubEvidence,
  });

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
  scoreRunnerActions: (input: AiDecisionInput) =>
    scoreActionsForLegacy(input, "runner", {
      extractAiFeatures,
      scoreRunnerAction,
      scoreCorpAction,
    }),
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
const { blinkRiskAssessmentForEncounterBreak } =
  createRunnerBlinkEncounterBreakContext({
    sourceDefinitionIdForAction,
    randomBreakOrDamageRiskProfileForDefinitionId,
    breakSubroutineIndexesForAction,
    encounteredSubroutines: (input) =>
      currentEncounteredIceCard(input)?.effectiveRunQuote?.subroutines ?? [],
    buildBlinkRiskAssessment,
    isImmediateSafetyThreatSubroutine,
    isRemoteServerTarget,
    visibleRootIsKnownAgenda: visibleRootIsKnownAgendaForMetrics,
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
  semanticRuntimeCorpCentralRezReserveAssessment,
  semanticRuntimeCorpHasCentralRezFloorFundingNeed,
} = createSemanticRuntimeCorpCentralRezContext({
  actionCreditCost,
  actionServerId: semanticRuntimeCorpActionServerId,
  actionSourceCard: semanticRuntimeCorpActionSourceCard,
  sourceDefinitionIdForAction,
});
const {
  semanticRuntimeCorpRemoteScoreContestabilityAssessment,
} = createSemanticRuntimeCorpRemoteContestabilityContext({
  actionServerId: semanticRuntimeCorpActionServerId,
  server: semanticRuntimeCorpServer,
  actionIsScoreLine: semanticRuntimeCorpActionIsScoreLine,
  advanceCompletesScore: semanticRuntimeCorpAdvanceCompletesScore,
  remoteIsProtected: semanticRuntimeCorpRemoteIsProtected,
  isRemoteServerTarget,
});
const {
  corpInstalledEconomyActionProfile,
  corpTagPunishPayoffFundingProfile,
} = createCorpTagPunishPayoffProfileContext({
  installedEconomyCreditAmount: corpInstalledEconomyCreditAmount,
  sourceDefinitionIdForAction,
  actionSourceCard: semanticRuntimeCorpActionSourceCard,
  visibleCardStoredCredits: corpVisibleCardStoredCredits,
  visibleMeatDamagePayoff: corpVisibleMeatDamagePayoff,
});
const {
  corpImmediateTagSourceVisiblePayoffProfile,
  corpImmediateTagSourceAvailable,
  corpUnprotectedPersistentTagAssetSetup,
  corpOntologyPayoffAvailableForTagSource,
} = createCorpTagSourcePayoffContext({
  sourceDefinitionIdForAction,
  visibleMeatDamagePayoff: corpVisibleMeatDamagePayoff,
  tagPunishAssessmentForAction: corpTagPunishOntologyAssessmentForAction,
  payoffProfileForDefinition: classifyTagPunishPayoffFromOntology,
});
const { tagPunishWindowDiagnosticsForSimulationAction } =
  createTagPunishWindowDiagnosticsContext({
    corpVisibleTagPunishOpportunities,
    runnerSurvivalCounterContextForInput,
    corpTagPunishOntologyAssessmentForAction,
    applyTagPunishOntologyDiagnostics,
    applyCorpVisibleTagPunishTakenWindowDiagnostics,
    applyCorpVisibleTagPunishUnknownSkipDiagnostics,
    strongestCorpTagSourceOpportunity,
    corpOntologyPayoffAvailableForTagSource,
    applyCorpTagSourceWindowDiagnostics,
    applyActualTagCreationDiagnostics,
  });
const {
  corpTaggedRunnerPayoffProfile,
} = createCorpTaggedRunnerPayoffProfileContext({
  runnerRigTrashTarget: corpVisibleRunnerRigTrashTarget,
  visibleCardStoredCredits: corpVisibleCardStoredCredits,
  runnerResourceTrashEvidence: corpVisibleRunnerResourceTrashEvidence,
  tagPunishAssessmentForAction: corpTagPunishOntologyAssessmentForAction,
  sourceDefinitionIdForAction,
  actionCreditCost,
  runnerDamagePreventionEvidence: corpVisibleRunnerDamagePreventionEvidence,
  runnerHardwareTrashTarget: corpVisibleRunnerHardwareTrashTarget,
  runnerHardwarePayoffEvidence: corpVisibleRunnerHardwarePayoffEvidence,
});
const {
  corpTaggedPayoffWindowPassiveActionPenalty,
} = createCorpTaggedPayoffWindowContext({
  immediateTagSourceAvailable: corpImmediateTagSourceAvailable,
  unprotectedPersistentTagAssetSetup: corpUnprotectedPersistentTagAssetSetup,
  taggedRunnerPayoffProfile: corpTaggedRunnerPayoffProfile,
  advanceCompletesScore: semanticRuntimeCorpAdvanceCompletesScore,
  actionIsScoreLine: semanticRuntimeCorpActionIsScoreLine,
  visibleMeatDamagePayoff: corpVisibleMeatDamagePayoff,
});
const {
  corpTaggedRunnerPayoffPressure,
} = createCorpTaggedRunnerPayoffPressureContext({
  immediateTagSourceVisiblePayoffProfile:
    corpImmediateTagSourceVisiblePayoffProfile,
  installedEconomyActionProfile: corpInstalledEconomyActionProfile,
  tagPunishPayoffFundingProfile: corpTagPunishPayoffFundingProfile,
  taggedRunnerPayoffProfile: corpTaggedRunnerPayoffProfile,
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

const { practicalMicroRuntimeCandidates } =
  createPracticalMicroCandidatesContext({
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
  });

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
const {
  chooseAiAction,
  chooseCorpAction,
  chooseCorpBaselineAction,
  chooseRunnerAction,
  chooseRunnerBaselineAction,
} = createAiActionEntrypoints({
  chooseSemanticRuntimeAction,
  scoreActions: (input, side) =>
    scoreActionsForLegacy(input, side, {
      extractAiFeatures,
      scoreRunnerAction,
      scoreCorpAction,
    }),
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
});
export {
  chooseAiAction,
  chooseCorpAction,
  chooseCorpBaselineAction,
  chooseRunnerAction,
  chooseRunnerBaselineAction,
};

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

const qualityTagsForAction = createQualityTagsForAction({
  extractFeatures: extractAiFeatures,
  findVisibleCard,
  rolesForAction,
});
const {
  chooseDecisionForSimulation,
  simulationSideUsesSemanticRuntime,
} = createSimulationDecisionContext({
  chooseAiAction,
  chooseRunnerAction,
  chooseCorpAction,
  chooseRunnerBaselineAction,
  chooseCorpBaselineAction,
  selectedChoicesForDecision,
});
const { simulateAiGame } = createAiGameSimulator({
  chooseDecisionForSimulation,
  simulationSideUsesSemanticRuntime,
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
  qualityTagsForAction,
});
export { simulateAiGame };
export { summarizeMatchProgressionMetrics };
const {
  runV143ExploitRegressionFixtures,
  runV143SimulationLeague,
  runDoctrineQualityBenchmark,
  runMatchProgressionBenchmark,
  runMatchProgressionBenchmarkSuite,
  runAiSelfplayTraceMining,
  simulateAiSoak,
} = createAiSimulationEntrypoints({
  simulateAiGame,
  summarizeMatchProgressionMetrics,
  chooseRunnerAction,
});
export {
  runV143ExploitRegressionFixtures,
  runV143SimulationLeague,
  runDoctrineQualityBenchmark,
  runMatchProgressionBenchmark,
  runMatchProgressionBenchmarkSuite,
  runAiSelfplayTraceMining,
  simulateAiSoak,
};


const { scoreRunnerAction } = createLegacyRunnerActionScorer({
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
});

const { scoreCorpAction } = createLegacyCorpActionScorer({
  rolesForAction,
  rolesForCardId,
  corpTagPunishOntologyAssessmentForAction,
  corpOntologyPayoffAvailableForTagSource,
});
