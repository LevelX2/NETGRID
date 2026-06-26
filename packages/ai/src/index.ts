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
  createAiHintsByCard,
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
import {
  type AiFeatures,
} from "./runtime/ai-features";
import {
  createAiFeatureExtractorContext,
} from "./runtime/ai-feature-extractor-context";
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
  rndFreshRepeatRunBoost,
  staleKnownRndRepeatRunPenalty,
} from "./runtime/runner-rnd-repeat-run-score";
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
  AI_PROFILES,
  profileWeights,
} from "./runtime/profile-weights";
import type {
  CorpTagPunishSkipReason,
} from "./runtime/corp-tag-punish-types";
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
import { createRoleContext } from "./runtime/role-context";
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
import { scoreConfidence as confidence } from "./runtime/score-confidence";
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
  createCorpVisibleTagPayoffCategoryContext,
} from "./simulation/corp-visible-tag-payoff-category";
import {
  applyCorpVisibleTagPunishTakenWindowDiagnostics,
} from "./simulation/corp-visible-tag-punish-taken-diagnostics";
import {
  createCorpVisibleTagPunishUnknownSkipDiagnosticsContext,
} from "./simulation/corp-visible-tag-punish-unknown-skip-diagnostics";
import {
  createCorpTagCreationDiagnosticsContext,
} from "./simulation/corp-tag-creation-diagnostics";
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
  createCorpTagPunishActionContext,
} from "./simulation/corp-tag-punish-action-context";
import {
  createCorpVisibleTagPunishOpportunityContext,
} from "./simulation/corp-visible-tag-punish-opportunities";
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
  createSimulationActionDiagnosticsContext,
} from "./simulation/simulation-action-diagnostics-context";
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
  type Side,
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

const AI_HINTS = createAiHintsByCard();

const { rolesForAction, rolesForCardId } = createRoleContext({
  findVisibleCard,
  aiHints: AI_HINTS,
});
const { extractAiFeatures } = createAiFeatureExtractorContext({
  rolesForCardId,
  buildObservedFacts,
  buildServerFeatures,
  assessKnownRezzedIcePath,
  isBlockedByKnownRezzedIce,
  visibleCitySurveillanceSourceCount,
});

const {
  sourceDefinitionIdForSimulationAction,
  corpFutureRunIceDiagnosticsForSimulationAction,
  corpScoreTerminalDiagnosticsForSimulationAction,
  corpEconomyBeforeScoreDiagnosticsForSimulationAction,
  definitionForSimulationAction,
  centralRunEventGoodForTarget,
} = createSimulationActionDiagnosticsContext({
  findVisibleCard,
  rolesForAction,
});
const {
  strongestCorpTagSourceOpportunity,
  corpPunishKindForAction,
  isCorpTagSourceAction,
  isCorpTraceTagSourceAction,
  corpTagPunishOntologyAssessmentForAction,
} = createCorpTagPunishActionContext({
  sourceDefinitionIdForAction,
  rolesForAction,
});
const { corpVisibleTagPayoffCategoryForAction } =
  createCorpVisibleTagPayoffCategoryContext({
    tagPunishAssessmentForAction: corpTagPunishOntologyAssessmentForAction,
    rolesForAction,
  });
const { applyCorpVisibleTagPunishUnknownSkipDiagnostics } =
  createCorpVisibleTagPunishUnknownSkipDiagnosticsContext({
    sourceDefinitionIdForAction,
    isCorpTraceTagSourceAction,
  });
const { corpVisibleTagPunishOpportunities } =
  createCorpVisibleTagPunishOpportunityContext({
    corpPunishKindForAction,
    corpVisibleTagPayoffCategoryForAction,
    sourceDefinitionIdForAction,
  });
const {
  applyCorpTagSourceWindowDiagnostics,
  applyActualTagCreationDiagnostics,
} = createCorpTagCreationDiagnosticsContext({
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
  scoreActions,
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


const { scoreCorpAction } = createLegacyCorpActionScorer({
  rolesForAction,
  rolesForCardId,
  corpTagPunishOntologyAssessmentForAction,
  corpOntologyPayoffAvailableForTagSource,
});

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
