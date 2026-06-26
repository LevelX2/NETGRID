import {
  assessCorpScoreTerminalWindow,
  chooseCorpPlanAction,
  hasCorpPlanAction,
} from "./corp-plans";
import { chooseRunnerPlanAction, hasRunnerPlanAction } from "./runner-plans";
import {
  evaluateCorpOpeningHand,
  evaluateRunnerOpeningHand,
} from "./deck-doctrine";
import {
  assessBlinkRiskForRunAction,
  blinkRiskShouldAvoidRun,
  buildBlinkRiskAssessment,
  buildRunnerEconomyPosture,
  evaluateRunnerRunTargets,
  randomBreakOrDamageRiskProfileForDefinitionId,
  runnerBlinkRecoveryAssessment,
} from "./runner-run-target-evaluation";
import {
  runnerRunTargetHighPayoff,
  runnerRunTargetMultiRunPayoffClass,
  runnerRunTargetPlausibleForMultiRun,
  runnerRunTargetSemanticGuidanceValue,
} from "./runner-run-target-guidance";
import { evaluateRunnerHandDevelopment } from "./runner-hand-development";
import { buildRunnerTacticalGoals } from "./runner-tactical-goals";
import {
  assessKnownRezzedIcePath,
  canBreakerDefinitionBreakIce,
  runnerKnownPathAssessmentIsKnownNoAccess,
  runnerKnownPathAssessmentIsUnbreakableNoAccess,
} from "./visible-run-analysis";
import {
  classifyTagPunishPayoffFromOntology,
} from "./tag-punish-ontology-consumer";
import {
  buildActionSemanticCandidates,
} from "./action-semantic-candidate";
import { evaluateKnownCentralAccessPayoff } from "./known-central-access-payoff";
import { buildObservedFacts } from "./observed-facts-public";
import {
  buildServerFeatures,
  visibleCitySurveillanceSourceCount,
} from "./runtime/ai-feature-server";
import {
  cardDefinitionTypeForAi,
  demoCardDefinitionForAi,
  runtimeCardDefinitionForAi,
  runnerCardMechanicsForAi,
  visibleCardDefinition,
} from "./runtime/card-definition-lookup";
import { createAiRuntimeSimulationComposition } from "./runtime/ai-runtime-simulation-composition";
import { compareAction } from "./runtime/action-order";
import {
  breakSubroutineIndexesForAction,
} from "./runtime/subroutine-indexes";
import {
  isImmediateSafetyThreatSubroutine,
} from "./runtime/encounter-subroutine";
import {
  currentEncounteredIceCard,
  encounterHasImmediateUnbrokenThreat,
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
import { isRemoteServerTarget } from "./runtime/server-target";
import {
  isCorpReactiveBaselineDecision,
  isRunnerReactiveBaselineDecision,
  semanticRuntimeActionTypeIsReactive,
  semanticRuntimeChoiceIsReactive,
} from "./runtime/reactive-action";
import {
  isRunnerEconomyRole,
  isRunnerPressureRole,
} from "./runtime/runner-role-classification";
import {
  scrubEvidence,
  semanticRuntimeChoiceWithEvidence,
  semanticRuntimeScoreFromComponents,
} from "./runtime/semantic-runtime-score-components";
import { semanticRuntimeServerId } from "./runtime/semantic-runtime-scope";
import { semanticRuntimeExplanation } from "./runtime/semantic-runtime-explanation";
import {
  runnerRunActionSpendingCapAssessment,
} from "./runtime/runner-run-only-action-adjustment";
import { runnerHandBufferNeedScoreComponent } from "./runtime/runner-hand-buffer-need";
import {
  runnerMultiRunEventScoreValue,
} from "./runtime/runner-multi-run-event-score";
import { runnerProjectedCreditGainForAction } from "./runtime/runner-loan-credit-projection";
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
  eventVersion as aiEventVersion,
  mergedPublicHistory as mergedAiPublicHistory,
  serverIdFromEvent as aiServerIdFromEvent,
} from "./runtime/public-event-history";
import {
  isSearchChoice,
} from "./runtime/search-choice-option";
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
import {
  corpVisibleMeatDamagePayoff,
  corpVisibleRunnerDamagePreventionEvidence,
  corpVisibleRunnerResourceTrashEvidence,
} from "./simulation/corp-tag-punish-visible-payoff";
import { corpIcePortfolioDiagnosticsForSimulationAction } from "./simulation/corp-ice-portfolio-diagnostics";
import { applyTagPunishOntologyDiagnostics } from "./simulation/tag-punish-ontology-diagnostics";
import {
  applyCorpVisibleTagPunishTakenWindowDiagnostics,
} from "./simulation/corp-visible-tag-punish-taken-diagnostics";
import { runnerSurvivalCounterContextForInput } from "./simulation/runner-survival-counter-context";
import {
  runnerMissingBreakerRolesForMetrics,
  runnerStrategicBreakerTargetForMetrics,
  runnerVisibleIceCreatesCoverageNeedForMetrics,
} from "./simulation/runner-setup-coverage-types";
import {
  runnerSetupChosenFamilyForEntry,
} from "./simulation/runner-setup-attribution-types";
import {
  definitionTypeForMetrics,
  remoteRootTrashCostForMetrics,
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
  runnerHasRecentRunOnServer,
  runnerRunTargetHasOnlyUnknownOrUnrezzedIce,
} from "./simulation/runner-run-target-context";
import { summarizeMatchProgressionMetrics } from "./simulation/match-progression-summary";
import {
  evaluateTacticalPlans,
  getTacticalPlanMemorySnapshot,
  rememberTacticalPlanRuntime,
} from "./tactical-plans";

const {
  chooseAiAction,
  chooseCorpAction,
  chooseCorpBaselineAction,
  chooseRunnerAction,
  chooseRunnerBaselineAction,
  simulateAiGame,
  runV143ExploitRegressionFixtures,
  runV143SimulationLeague,
  runDoctrineQualityBenchmark,
  runMatchProgressionBenchmark,
  runMatchProgressionBenchmarkSuite,
  runAiSelfplayTraceMining,
  simulateAiSoak,
} = createAiRuntimeSimulationComposition({
  visibleSourceCard: semanticRuntimeVisibleSourceCard,
  serverId: semanticRuntimeServerId,
  buildObservedFacts,
  buildServerFeatures,
  assessKnownRezzedIcePath,
  isBlockedByKnownRezzedIce,
  visibleCitySurveillanceSourceCount,
  sourceDefinitionIdForAction,
  runnerKnownPathAssessmentIsKnownNoAccess,
  runnerKnownPathAssessmentIsUnbreakableNoAccess,
  runnerRunTargetHasOnlyUnknownOrUnrezzedIce,
  delayedInstallAbilityForAction: shellTradersAbility,
  runnerHasInstalledPrograms,
  visibleBreakerRolesForAi,
  compareAction,
  visibleCardDefinition,
  cardDefinitionTypeForAi,
  safeNonNegativeInteger,
  visibleMemoryCost: visibleMemoryCostForAi,
  visibleCardsByInstanceId: visibleCardsByInstanceIdForAi,
  visibleBreakerRoleCounts: visibleBreakerRoleCountsForAi,
  visibleBreakerRoles: visibleBreakerRolesForAi,
  visibleCounterValue: visibleCounterValueForAi,
  visibleInstallCost: visibleInstallCostForAi,
  evaluateCorpOpeningHand,
  evaluateRunnerOpeningHand,
  allNighterDefinitionId: ALL_NIGHTER_CARD_ID,
  payoffClass: runnerRunTargetMultiRunPayoffClass,
  canTakeRun: runnerRunTargetPlausibleForMultiRun,
  scoreValue: runnerMultiRunEventScoreValue,
  randomBreakOrDamageRiskProfileForDefinitionId,
  breakSubroutineIndexesForAction,
  currentEncounteredIceCard,
  buildBlinkRiskAssessment,
  isImmediateSafetyThreatSubroutine,
  encounterRunRemainderEffectAssessment,
  encounterHasImmediateUnbrokenThreat,
  remoteServerHasScoreThreat,
  runnerHasRecentRunOnServer,
  runnerRemoteHasKnownRelevantTrashTarget,
  isSearchChoice,
  centralRunStreakWithoutValueForMetrics,
  recentCentralRunSameTargetWithoutRefresh,
  runnerHasVisibleRemoteScoreThreat,
  runnerTrashBlockedByCredits,
  runnerStealBlockedByCredits,
  runnerContestBlockedByCredits,
  hasRunnerRemoteTrashAction,
  runnerAdvancedRemoteContestContext,
  runnerSetupChosenFamilyForEntry,
  runnerStrategicBreakerTargetForMetrics,
  visibleRootIsKnownAgenda: visibleRootIsKnownAgendaForMetrics,
  runRiskAssessment: assessBlinkRiskForRunAction,
  highRiskLoanDefinitionId: LOAN_FROM_CHIBA_CARD_ID,
  projectedCreditGainForAction: runnerProjectedCreditGainForAction,
  handDevelopmentEvaluations: evaluateRunnerHandDevelopment,
  economyPosture: buildRunnerEconomyPosture,
  runTargets: evaluateRunnerRunTargets,
  previousPlan: getTacticalPlanMemorySnapshot,
  mechanicsForDefinition: runnerCardMechanicsForAi,
  scoreTerminalWindow: assessCorpScoreTerminalWindow,
  actionTypeIsReactive: semanticRuntimeActionTypeIsReactive,
  evaluatePracticalRunnerRunTargets: evaluateRunnerRunTargets,
  runnerRunTargetPlausibleForMultiRun,
  runnerRunTargetHighPayoff,
  findVisibleCorpServerCard,
  runtimeDefinition: runtimeCardDefinitionForAi,
  demoDefinition: demoCardDefinitionForAi,
  evaluateKnownCentralPayoff: evaluateKnownCentralAccessPayoff,
  definitionType: definitionTypeForMetrics,
  definitionTypeForMetrics,
  remoteRootTrashCostForMetrics,
  canBreakerDefinitionBreakIce,
  runnerVisibleIceCreatesCoverageNeedForMetrics,
  runnerMissingBreakerRolesForMetrics,
  installedEconomyCreditAmount: corpInstalledEconomyCreditAmount,
  visibleCardStoredCredits: corpVisibleCardStoredCredits,
  visibleMeatDamagePayoff: corpVisibleMeatDamagePayoff,
  runnerRigTrashTarget: corpVisibleRunnerRigTrashTarget,
  runnerResourceTrashEvidence: corpVisibleRunnerResourceTrashEvidence,
  payoffProfileForDefinition: classifyTagPunishPayoffFromOntology,
  runnerDamagePreventionEvidence:
    corpVisibleRunnerDamagePreventionEvidence,
  runnerHardwareTrashTarget: corpVisibleRunnerHardwareTrashTarget,
  runnerHardwarePayoffEvidence: corpVisibleRunnerHardwarePayoffEvidence,
  runnerSurvivalCounterContextForInput,
  applyTagPunishOntologyDiagnostics,
  applyCorpVisibleTagPunishTakenWindowDiagnostics,
  teamRestructuringCardId: TEAM_RESTRUCTURING_CARD_ID,
  scoreFromComponents: semanticRuntimeScoreFromComponents,
  shouldAvoidBlinkRiskAssessment: blinkRiskShouldAvoidRun,
  fakedHitCardId: FAKED_HIT_CARD_ID,
  badPublicityLossThreshold: BAD_PUBLICITY_LOSS_THRESHOLD_FOR_AI,
  guidanceValue: runnerRunTargetSemanticGuidanceValue,
  remoteRootTrashCost: remoteRootTrashCostForMetrics,
  staleKnownRndRepeatRunPenalty,
  rndFreshRepeatRunBoost,
  staleKnownHqRepeatRunPenalty,
  publicHistory: mergedAiPublicHistory,
  eventVersion: aiEventVersion,
  serverIdFromEvent: aiServerIdFromEvent,
  rootTrashCost: remoteRootTrashCostForMetrics,
  targetServerId: semanticRuntimeServerId,
  blinkAssessment: runnerBlinkRecoveryAssessment,
  findVisibleCard,
  isRunnerPressureRole,
  isRunnerEconomyRole,
  actionClickCost,
  actionCreditCost,
  junkyardBbsDefinitionId: JUNKYARD_BBS_CARD_ID,
  junkyardBbsReturnTopHeapAbility: JUNKYARD_BBS_RETURN_TOP_HEAP_ABILITY,
  scrubEvidence,
  isRemoteServerTarget,
  knownIcePathReason: semanticRuntimeKnownIcePathReason,
  runActionSpendingCapAssessment: runnerRunActionSpendingCapAssessment,
  handBufferNeedScoreComponent: runnerHandBufferNeedScoreComponent,
  explanation: semanticRuntimeExplanation,
  semanticRuntimeChoiceIsReactive,
  buildActionSemanticCandidates,
  getTacticalPlanMemorySnapshot,
  evaluateRunnerHandDevelopment,
  buildRunnerEconomyPosture,
  evaluateRunnerRunTargets,
  buildRunnerTacticalGoals,
  evaluateTacticalPlans,
  bestSemanticRuntimeChoice,
  bestSemanticRuntimeChoiceForTacticalPlanOverride,
  tacticalPlanMappedChoice,
  semanticRuntimeChoiceWithEvidence,
  tacticalPlanMappingOverrideEvidence,
  tacticalPlanRuntimeAlignedToChoice,
  rememberTacticalPlanRuntime,
  hasCorpPlanAction,
  isCorpReactiveBaselineDecision,
  chooseCorpPlanAction,
  hasRunnerPlanAction,
  isRunnerReactiveBaselineDecision,
  chooseRunnerPlanAction,
  corpIcePortfolioDiagnosticsForSimulationAction,
  summarizeMatchProgressionMetrics,
});

export {
  chooseAiAction,
  chooseCorpAction,
  chooseCorpBaselineAction,
  chooseRunnerAction,
  chooseRunnerBaselineAction,
  simulateAiGame,
  runV143ExploitRegressionFixtures,
  runV143SimulationLeague,
  runDoctrineQualityBenchmark,
  runMatchProgressionBenchmark,
  runMatchProgressionBenchmarkSuite,
  runAiSelfplayTraceMining,
  simulateAiSoak,
};

export {
  summarizeMatchProgressionMetrics,
};
