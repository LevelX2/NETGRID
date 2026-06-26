// Public package facade. Keep new AI behavior in focused runtime, decision,
// action, access, diagnostics, reports or simulation modules, then re-export
// only intentional public contracts here.
import {
  assessCorpScoreTerminalWindow,
  chooseCorpPlanAction,
  classifyCorpScoredAgendaAbility,
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
  traceTagExpectedSuccessEstimate,
} from "./runtime/trace-tag-success-estimate";
import {
  tagPunishPayoffPriorityBonus,
} from "./runtime/tag-punish-payoff-priority";
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
  minNumberOrZero as minDefined,
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
  averageNumber,
  medianNumber,
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
  averageTurnsFromFinalAdvanceToScoreOrSteal,
  countCorpMultiIceInstallOrderFutureEffectDead,
  countCorpMultiIceInstallOrderOptimized,
  isCorpRemoteAdvancementProgress,
  progressionEntriesWithRunTargets,
} from "./simulation/progression-action-sequence";
import { summarizeActionLimitEndgameMetrics } from "./simulation/action-limit-endgame-metrics";
import { summarizeAdvancedRemoteThreatMetrics } from "./simulation/advanced-remote-threat-metrics";
import { summarizeBreakerOntologyMetrics } from "./simulation/breaker-ontology-metrics";
import { summarizeCorpEffectiveRemoteSafetyMetrics } from "./simulation/corp-effective-remote-safety-metrics";
import { summarizeCorpIcePortfolioMetrics } from "./simulation/corp-ice-portfolio-metrics";
import { summarizeCentralCloseoutRepeatMetrics } from "./simulation/central-closeout-repeat-metrics";
import { corpScoreTerminalFollowupMetrics } from "./simulation/corp-score-terminal-followup-metrics";
import { summarizeCorpEconomyBeforeScoreMetrics } from "./simulation/corp-economy-before-score-metrics";
import { summarizeCorpUnsafeRemoteScoreConversionMetrics } from "./simulation/corp-unsafe-remote-score-conversion-metrics";
import {
  corpVisibleMeatDamagePayoff,
  corpVisibleRunnerDamagePreventionEvidence,
  corpVisibleRunnerResourceTrashEvidence,
} from "./simulation/corp-tag-punish-visible-payoff";
import { corpIcePortfolioDiagnosticsForSimulationAction } from "./simulation/corp-ice-portfolio-diagnostics";
import { isMeaningfulBoardProgress } from "./simulation/meaningful-board-progress";
import { summarizePlanConversionMetrics } from "./simulation/plan-conversion-metrics";
import { summarizeRemoteRoleOntologyMetrics } from "./simulation/remote-role-ontology-metrics";
import { createRunnerBreakerCoverageDiagnosticsForSimulationAction } from "./simulation/runner-breaker-coverage-diagnostics";
import { createRunnerCentralPressureDiagnosticsForSimulationAction } from "./simulation/runner-central-pressure-diagnostics";
import { createRunnerEconomySetupDiagnosticsForSimulationAction } from "./simulation/runner-economy-setup-diagnostics";
import { createRunnerHandUseDiagnosticsForSimulationAction } from "./simulation/runner-hand-use-diagnostics";
import { summarizeRunnerRepeatRemoteNoTrashMetrics } from "./simulation/runner-repeat-remote-no-trash-metrics";
import { createRunnerReserveDiagnosticsForSimulationAction } from "./simulation/runner-reserve-diagnostics";
import { summarizeStrategicLineMetrics } from "./simulation/strategic-line-metrics";
import { applyTagPunishOntologyDiagnostics } from "./simulation/tag-punish-ontology-diagnostics";
import { summarizeTagPunishWindowMetrics } from "./simulation/tag-punish-window-metrics";
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
import type {
  AiBenchmarkDeckSlotResult,
  AiMatchProgressionBenchmarkSuiteResult,
  AiMatchProgressionMetrics,
} from "./simulation/ai-match-progression-types";
import {
  runnerSetupChosenFamilyForEntry,
  summarizeRunnerSetupAttributionMetrics,
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
  averageFinalAdvanceNumber,
  averageFirstProgressionTurn,
  averageRunnerContestRisk,
  averageTurnsFromFirstAdvanceToScore,
  countFinalAdvancesResolvedBySameTurnCorpScore,
  countFinalAdvancesStolenBeforeCorpScore,
  countRunnerDrawThenDiscardSameTurn,
} from "./simulation/match-progression-average-metrics";
import {
  countRunnerCoverageConversions,
  countRunnerEconomySetupMetric,
  countRunnerPressureWithinOwnActions,
  countRunnerSearchRecoveryNoInstallFollowup,
} from "./simulation/runner-setup-metric-counts";
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
  betterScoredAgendaDrawAvailable,
  betterScoredAgendaEconomyAvailable,
  corpScoredAgendaAbilityReasonCode,
  politicalOverthrowEconomyAvailable,
  scoreCorpScoredAgendaAbility,
} from "./legacy/corp-scored-agenda-ability-scoring";
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
  const strategicLineMetrics = summarizeStrategicLineMetrics(
    summaries,
    isMeaningfulBoardProgress,
  );
  const corpEffectiveRemoteSafetyMetrics =
    summarizeCorpEffectiveRemoteSafetyMetrics(summaries);
  const corpScoreConversionMetrics =
    summarizeCorpUnsafeRemoteScoreConversionMetrics(summaries);
  const corpIcePortfolioMetrics = summarizeCorpIcePortfolioMetrics(summaries);
  const actionLimitEndgameMetrics = summarizeActionLimitEndgameMetrics(
    summaries,
    isMeaningfulBoardProgress,
  );
  const tagPunishWindowMetrics = summarizeTagPunishWindowMetrics(summaries);
  const breakerOntologyMetrics = summarizeBreakerOntologyMetrics(summaries);
  const remoteRoleOntologyMetrics =
    summarizeRemoteRoleOntologyMetrics(summaries);
  const runnerSetupAttributionMetrics = summarizeRunnerSetupAttributionMetrics(
    summaries,
    isMeaningfulBoardProgress,
  );
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
      isMeaningfulBoardProgress,
    ),
    runnerBreakerInstallConvertedToUsefulRun: countRunnerCoverageConversions(
      actionSequence,
      (entry) => entry.runnerCoverageImproved === true,
      isMeaningfulBoardProgress,
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
