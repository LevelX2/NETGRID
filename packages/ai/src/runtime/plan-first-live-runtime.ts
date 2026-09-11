import { visibleBreakerEncounterQuote } from "@netgrid/engine";
import {
  AI_DECISION_DEBUG_SCHEMA_VERSION,
  AI_PLAN_FIRST_DECISION_DEBUG_SCHEMA_VERSION,
  AI_TURN_PLANNING_DEBUG_SCHEMA_VERSION,
  ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION,
  ENGINE_RANDOMIZED_TRACE_BID_SELECTION_SCHEMA_VERSION,
  ENGINE_RANDOMIZED_TURN_PLAN_SELECTION_SCHEMA_VERSION,
  type AiDecision,
  type AiDecisionInput,
  type AiPlanFirstDecisionDebug,
  type AiTurnPlanningDebug,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";
import type { BuildActionSemanticCandidatesParams } from "../action-semantic-candidate";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import {
  assessRandomBreakOrDamageRiskForVisibleRunPath,
  randomBreakOrDamageRiskCanCarryRunPath,
} from "../actions/risk-action-projection";
import { AI_HINTS_BY_CARD } from "../ai-hints";
import { reconstructBeliefState } from "../belief-state";
import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import { buildCorpAmbushPlanSignals } from "../corp/ambush/corp-ambush-plan-signals";
import { corpAvailableRemoteRezCredits } from "../corp/defense/corp-defense-remote-rez-budget";
import { buildCorpDefenseTurnPlanningSlice } from "../corp/defense/corp-defense-turn-planning";
import { resolvePlanBoundCorpDelayedSuccessChoice } from "../corp/defense/defense-choice-continuation";
import { corpClassicDeflectorDefenseChoiceSignal } from "../corp/defense/defense-choice-signals";
import {
  buildCorpDefenseNeeds,
  buildCorpDefenseProtectionSignals,
  prepareCorpDefenseDiscovery,
} from "../corp/defense/defense-discovery";
import {
  CORP_DEFENSE_DOMAIN_SIGNAL_FACTS,
  corpDefenseSignalOwnsAction,
  corpDefensiveUpgradePlacement,
} from "../corp/defense/defense-discovery-support";
import {
  bindSelectedCorpDefenseDrawAttempt,
  bindSelectedCorpDefenseHqHold,
} from "../corp/defense/defense-memory";
import {
  corpDefenseActionDispositions,
  corpDefenseMaterializedActionIds,
} from "../corp/defense/defense-plan-module";
import {
  corpConditionalRezSupportWithoutCurrentRouteEvidence,
  corpRunDefenseAbilityAssessment,
} from "../corp/defense/defense-run-response";
import {
  buildCorpEconomySignals,
  corpEconomyFundingActionIds,
} from "../corp/economy/economy-discovery";
import {
  corpCandidateIsImmediateRootRezEconomySource,
  corpOpenEconomyPlanOwnsAction,
} from "../corp/economy/economy-signals";
import {
  bindSelectedCorpArchivesToHqChoiceContinuation,
  corpCorporateShuffleHqChoiceSignal,
  corpDiscardWindowSignal,
  corpStrategicPlanningGroupDrawChoiceSignal,
  resolvePlanBoundCorpArchivesToHqChoice,
} from "../corp/hand-management/hand-choice-bindings";
import {
  buildCorpHandManagementSignals,
  corpEmptyRdDrawOperationDispositionEvidence,
} from "../corp/hand-management/hand-development-signals";
import {
  arbitrateCorpHandConversionBeforeDraw,
  corpHandDomainRouteClaims,
} from "../corp/hand-management/hand-draw-arbitration";
import { buildCorpHandInventoryFacts } from "../corp/hand-management/hand-inventory-facts";
import {
  bindSelectedCorpHqOverflowConversion,
  corpDrawCandidatePreservesHandCapacity,
  corpExactOverflowHandConversionPlanOwnsCandidate,
  corpHandSignalMatchesCandidate,
  corpHqOverflowReservedScoreServerDispositionEvidence,
} from "../corp/hand-management/hand-overflow";
import { corpPunishCampaignOwnsCandidate } from "../corp/punish/punish-plan-support";
import { withDecisionLocalCorpPunishRouteQuotes } from "../corp/punish/punish-route-quote-input";
import {
  corpConditionalPunishTagSourceHasNoVisiblePayoff,
  corpDefinitionSupportsPunishPlan,
  corpPunishQuoteRequestExists,
  punishSignals,
} from "../corp/punish/punish-signals";
import {
  boundCorpPunishTraceChoices,
  resolveCorpPunishTraceWindow,
} from "../corp/punish/punish-trace-binding";
import { buildCorpAgendaTurnPlanningSlice } from "../corp/score/corp-agenda-turn-planning";
import { bindSelectedCorpScoreChoiceContinuation } from "../corp/score/score-choice-continuation";
import {
  discoverCorpDirectScoreProjects,
  reconcileCorpScoreProjects,
} from "../corp/score/score-discovery";
import { corpScorePlanTarget } from "../corp/score/score-plan-module";
import {
  corpCandidateIsScoreAccelerationSupport,
  corpRemoteCreationLockRemovalAction,
  corpScoreAccelerationSetupBinding,
  corpScoredAgendaRevealWithoutPurposeDispositionEvidence,
  corpScoreProjectAssessmentIsUnknown,
  corpScoreProjectId,
} from "../corp/score/score-project-signals";
import { buildCorpScoringRemoteDiscovery } from "../corp/scoring-remote/scoring-remote-discovery";
import { buildCorpVirusPressureSignals } from "../corp/virus-pressure/virus-pressure-signals";
import type { DeckCapabilityProfile } from "../deck-capabilities";
import { rolesForDeckDoctrineCard } from "../deck-doctrine-card-roles";
import { semanticRuntimeDecisionDebugTopLevelWhyNot } from "../diagnostics/semantic-runtime-decision-debug";
import {
  collectCorpActionDispositions,
  type CorpActionDispositionContributorFacts,
} from "../plans/corp-action-disposition-contributors";
import { createCorpCorePlanModules } from "../plans/corp-core-plan-modules";
import {
  corpCampaignDescriptors,
  reconcileCorpCampaignContinuity,
} from "../plans/corp-opponent-campaign-continuity";
import { type CorpPlanDomain } from "../plans/corp-tactical-plan-contracts";
import { createCorpTacticalPlanModules } from "../plans/corp-tactical-plan-modules";
import {
  resolveTurnPlannerCutover,
  type TurnPlannerCutoverResult,
} from "../plans/corp-turn-planner-cutover";
import { buildCorpTurnPlannerShadow } from "../plans/corp-turn-planner-shadow";
import { assertCorpTurnPlanningModuleRegistry } from "../plans/corp-turn-planning-coverage";
import {
  CORP_PLAN_PRIORITY_POLICY,
  RUNNER_PLAN_PRIORITY_POLICY,
} from "../plans/plan-assessment";
import { planInstanceIdForProposal } from "../plans/plan-instance";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import {
  createSidePlanRegistry,
  runPlanScheduler,
  type EngineWindowResolution,
  type PlanActionDisposition,
  type PlanSchedulerContext,
  type PlanSchedulerResult,
  type SidePlanRegistry,
} from "../plans/plan-scheduler";
import {
  selectResidentPlanPortfolioExecutor,
  type ResidentPlanPortfolio,
} from "../plans/resident-plan-portfolio";
import {
  rememberResidentPlanPortfolio,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import { type RunnerCorePlanDomain } from "../plans/runner-core-plan-contracts";
import { createRunnerCorePlanModules } from "../plans/runner-core-plan-modules";
import { runnerRolesCoverCoverageGap } from "../plans/runner-coverage-contracts";
import { runnerDelayedInstallReplanningBoundary } from "../plans/runner-delayed-install-replanning-boundary";
import { runnerDevelopmentCardAdmission } from "../plans/runner-development-contracts";
import { runnerExactBasicLiquidCreditCandidate } from "../plans/runner-funding-candidates";
import type { RunnerFundingNeedSignal } from "../plans/runner-funding-contracts";
import {
  ActiveRunnerRunRoot,
  RunnerRunOrigin,
} from "../plans/runner-run-origin-contract";
import {
  type RunnerInformationBoundaryReassessmentSignal,
  type RunnerPlanDomain,
  type RunnerPressureSignal,
  type RunnerRemoteContestSignal,
  type RunnerRunAccessCommitmentSignal,
  type RunnerRunRiskContractSignal,
  type RunnerRunRiskReassessmentSignal,
  type RunnerRunWindowActionAssessment,
} from "../plans/runner-tactical-plan-contracts";
import { createRunnerTacticalPlanModules } from "../plans/runner-tactical-plan-modules";
import { buildRunnerTurnPlannerShadow } from "../plans/runner-turn-planner-shadow";
import { assertRunnerTurnPlanningModuleRegistry } from "../plans/runner-turn-planning-coverage";
import {
  TRANSIENT_PLAN_SIGNAL_SCHEMA_VERSION,
  type TransientPlanSignal,
} from "../plans/transient-plan-signals";
import { createTurnCompletionPlanModule } from "../plans/turn-completion-plan-module";
import {
  buildCanonicalLegalActionInvocation,
  buildPlanningStateIdentity,
  buildSemanticActionSetFingerprint,
  turnPlanningFingerprint,
} from "../plans/turn-planning-contracts";
import {
  applyCertifiedTurnProjectionDelta,
  assessTurnObservationBoundary,
  buildProjectedDecisionFrame,
  certifiedTurnProjectionDeltaFromCandidate,
} from "../plans/turn-projection";
import {
  bestRunTargetsByServer,
  runnerRunFundingSupport,
  runnerRunHasExactUrgency,
  runnerRunRequiredPostRunReserve,
  runnerRunTargetCanConvertNow,
} from "../run-analysis/runner-plan-run-funding";
import {
  accessCommitmentForEvaluation,
  runnerKnownAgendaRunEvaluationIsCertified,
} from "../run-analysis/runner-plan-run-route-facts";
import { runnerRunLockReleaseRoutes } from "../run-analysis/runner-run-lock-release-routes";
import { runnerSameTurnAccessPreparationSourceDefinitionId } from "../run-analysis/runner-run-preparation";
import {
  bindSelectedRunnerTargetedBypassChoiceContinuation,
  bindSelectedRunnerTargetedIceTrashChoiceContinuation,
} from "../run-analysis/runner-run-preparation-choice-binding";
import { quoteRunnerRunRiskReserve } from "../run-analysis/runner-run-risk-reserve";
import { runnerEffectsProvideTopTrashRecovery } from "../runner-canonical-hint-semantics";
import {
  runnerConfirmedDamageRequiredHandFloor,
  runnerDamageThreatAssessment,
  runnerFutureEncounterDamageJackOutAssessment,
  runnerKnownAccessDamageJackOutAssessment,
  runnerRecentFutureEncounterDamageSafetyAbort,
  runnerVisibleLethalIceDamageAssessment,
  runnerVisibleLethalIceDamageJackOutAssessment,
} from "../runner-damage-threat-assessment";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../runner-run-target-evaluation";
import { runnerRunTargetHasOptionalBonusRunValue } from "../runner-run-target-guidance";
import type { RunnerStrategicIntentProfile } from "../runner-strategic-intent";
import { runnerCentralPressureDevelopmentSignals } from "../runner/central-pressure/central-pressure-development";
import { buildRunnerCentralPressureFunding } from "../runner/central-pressure/central-pressure-funding";
import {
  buildRunnerCentralPressureSignals,
  runnerCentralPressureCadence,
  runnerCentralPressureHasMaterialMarginalValue,
  runnerUnboundCentralDirectRunDispositionEvidence,
} from "../runner/central-pressure/central-pressure-signals";
import { runnerCreditBankActionDispositions } from "../runner/credit-bank/credit-bank-dispositions";
import { runnerCreditBankSignals } from "../runner/credit-bank/credit-bank-signals";
import { runnerDefenseSupportDispositions } from "../runner/defense-recovery/defense-dispositions";
import {
  runnerDefenseReactionReserveIsCurrentPhase,
  runnerDefenseTagClearFundingIsCurrentPhase,
} from "../runner/defense-recovery/defense-plan-module";
import {
  buildRunnerDefenseSignals,
  runnerDefenseHandBufferFacts,
  runnerDefenseSupportSignals,
} from "../runner/defense-recovery/defense-signals";
import { type RunnerDiscardChoiceBinding } from "../runner/defense-recovery/defense-types";
import { runnerDiscardChoicePlanBinding } from "../runner/defense-recovery/runner-discard-choice-plan";
import {
  buildRunnerEconomySignals,
  runnerEconomyReserveFacts,
} from "../runner/economy/economy-signals";
import { runnerInstalledCardLiquidationChoiceSignal } from "../runner/economy/installed-card-liquidation";
import { runnerExposeInformationActionDispositions } from "../runner/expose-information/expose-information-dispositions";
import { bindSelectedRunnerExposeInformationMemory } from "../runner/expose-information/expose-information-memory";
import { runnerExposeInformationSignals } from "../runner/expose-information/expose-information-signals";
import type { RunnerExposeInformationSignal } from "../runner/expose-information/expose-information-types";
import {
  bindRunnerDevelopmentSearchEngineContinuation,
  bindRunnerEventInstallChoiceEngineContinuation,
  bindSelectedRunnerDelayedProgramSearchChoice,
  bindSelectedRunnerEventInstallChoiceContinuation,
  bindSelectedRunnerProgramInstallTrashChoiceContinuation,
  bindSelectedRunnerProgramSearchAction,
  bindSelectedRunnerRecoverySearchAction,
  resolvePlanBoundRunnerDelayedProgramSearchChoice,
  resolvePlanBoundRunnerEventInstallMemoryChoice,
  resolvePlanBoundRunnerProgramTrashChoice,
} from "../runner/hand-development/development-choice-bindings";
import { buildRunnerCardDevelopmentSignals } from "../runner/hand-development/development-discovery";
import { runnerSameTurnDevelopmentFundingRoute } from "../runner/hand-development/development-funding";
import {
  assertRunnerRestrictedProgramInstallCommitment,
  restrictedActionCapacityHasProductiveFollowup,
  runnerRestrictedProgramInstallSequenceSignals,
} from "../runner/hand-development/development-restricted-sequence";
import type { RunnerDevelopmentInstallServices } from "../runner/hand-development/development-services";
import {
  runnerAccessPayoffDevelopmentLacksBoundAccessRoute,
  runnerEventInstallChoiceDevelopmentSignals,
  runnerGenericDrawDevelopmentSignals,
  runnerHandDevelopmentExplicitlyRejected,
  runnerHandDevelopmentRejectionForCandidate,
  runnerImmediateAgendaPointDevelopmentSignals,
  runnerLiquiditySaturationOptionDevelopment,
  runnerProgramSearchRecentlyResolved,
  runnerProgramSearchStrategyDevelopmentSignals,
} from "../runner/hand-development/development-signals";
import type { RunnerHandDevelopmentEvaluation } from "../runner/hand-development/hand-development-evaluation";
import { runnerInstalledAgendaScoreSignals } from "../runner/installed-agenda/installed-agenda-signals";
import { runnerRecurringEconomyActionDispositions } from "../runner/recurring-economy/recurring-economy-dispositions";
import { runnerRecurringEconomyRunDeferral } from "../runner/recurring-economy/recurring-economy-run-deferral";
import { runnerRecurringEconomySignals } from "../runner/recurring-economy/recurring-economy-signals";
import {
  runnerTerminalNonlethalDamageContestAlreadyFailedThisTurn,
  runnerTerminalRemoteContestIsDirectlyMandatory,
  runnerTerminalRemoteContestVisibleHazardFundingGap,
} from "../runner/remote-contest/remote-contest-admission";
import {
  buildRunnerRemoteContestSignals,
  runnerRemoteHasCurrentContestMaterial,
  runnerRemoteHasKnownIceScheduledForRunnerTurnEndTrash,
} from "../runner/remote-contest/remote-contest-signals";
import { runnerResourceLifecycleActionDispositions } from "../runner/resource-lifecycle/resource-lifecycle-dispositions";
import { runnerResourceLifecycleFundingNeeds } from "../runner/resource-lifecycle/resource-lifecycle-funding-needs";
import { runnerResourceLifecycleSignals } from "../runner/resource-lifecycle/resource-lifecycle-signals";
import {
  runnerCoverageOwnedActionIds,
  runnerDrawActionHasCurrentCoveragePurpose,
} from "../runner/rig-coverage/coverage-actions";
import {
  bindRunnerCoverageSearchProgramTrashSacrifices,
  bindSelectedCoverageSearchAction,
  bindSelectedRunnerCoverageSearchChoiceContinuation,
  preserveSelectedRunnerCoverageBindingAcrossPaymentStep,
  reconcileRunnerCoverageRequesterBindings,
} from "../runner/rig-coverage/coverage-bindings";
import {
  addRunnerCoverageMemoryDispositions,
  addRunnerCoverageRejectedSearchDispositions,
  applyRunnerCoverageCandidateDisposition,
  runnerCoverageInstallDeferrals,
  runnerMatchpointReserveBlocksOverlappingBreakerInstall,
} from "../runner/rig-coverage/coverage-dispositions";
import { runnerCoverageCurrentPhase } from "../runner/rig-coverage/coverage-plan-module";
import { uniqueCoverageGaps } from "../runner/rig-coverage/coverage-signals";
import type { RunnerRigDemandProjection } from "../runner/rig-demand/runner-rig-demand-projection";
import { runnerShellTradersActionDispositions } from "../runner/shell-traders/shell-traders-dispositions";
import { buildRunnerShellTradersPipelineSignals } from "../runner/shell-traders/shell-traders-plan-signals";
import {
  runnerImmediateAgendaPointTerminalWinSignals,
  runnerTerminalWinSignals,
} from "../runner/terminal-win/terminal-win-signals";
import { rememberStrategicIntentState } from "../strategic-intent-memory";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
  visibleDeflectorSubroutineCanResolve,
  visibleRunnerRunPathCreditBudgetForRig,
} from "../visible-run-analysis";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import type { AiDecisionRuntimeOptions } from "./choose-ai-action";
import { uniqueBy } from "./collection";
import { corpCandidateProjectsCardDraw } from "./corp-draw-action-facts";
import { corpScorelineFeasibilityForDecisionInput } from "./corp-scoreline-feasibility";
import {
  currentEncounteredIceCard,
  currentEncounterRequiresFullBreak,
  currentRunHasPendingAutoPassIce,
  currentRunRemainingIce,
} from "./current-encounter";
import type { DiscardKeepScorer } from "./discard-choice-selection";
import { type DiscardChoiceKeepScore } from "./discard-choice-selection";
import { legalActionCreditCost } from "./legal-action-credit-cost";
import {
  runnerCentralPayoffServer,
  runnerCentralPayoffServerForDefinition,
} from "./runner-access-payoff-facts";
import { assessRunnerAccessTrashImpact } from "./runner-access-trash-impact";
import {
  runnerCandidateSourceDefinitionId,
  runnerInstallSourceInstanceId,
  visibleOwnCardByInstanceId,
} from "./runner-action-source-facts";
import { runnerEventStartsRunAfterProgramSearch } from "./runner-canonical-card-facts";
import {
  runnerCandidateIsOneShotSearch,
  runnerCandidateIsOptionalProgramTrashInstall,
  runnerOptionalProgramTrashInstallDuplicatesInstalledDefinition,
} from "./runner-development-action-facts";
import {
  runnerExactFundingRouteContract,
  runnerImmediateGeneralLiquidEconomyRoute,
} from "./runner-exact-funding-routes";
import {
  runnerFortPassTollWindow,
  runnerRunExitAction,
  runnerRunWindowCreditBudget,
} from "./runner-fort-pass-toll";
import { assessRunnerHandRotation } from "./runner-hand-rotation-assessment";
import {
  runnerCandidateIsCardAbility,
  runnerCandidateIsCentralInformationAbility,
  runnerCandidateIsExposeAbility,
} from "./runner-information-action-facts";
import {
  runnerCurrentRunHasSafeCompletionReward,
  runnerRemoteHasKnownNoCurrentPayoff,
} from "./runner-known-access-payoff-context";
import type { RunnerProgramInstallTrashAssessment } from "./runner-program-install-trash-policy";
import { runnerCandidateExecutesProgramSearch } from "./runner-program-search-facts";
import {
  bindRunnerRigDemandProjectionToCoverageGaps,
  buildRunnerRigDemandProjectionForCoverage,
  runnerCoverageRigDemandInputsComplete,
} from "./runner-rig-demand-adapter";
import {
  assessRunnerAdditionalAccessRunWindowAction,
  runnerCandidateHasVisibleAdditionalAccessEffect,
} from "./runner-run-window-additional-access";
import {
  runnerStrategicExchangeHardExclusion,
  runnerStrategicExchangeKinds,
  runnerStrategicExchangeRequiresBoundParent,
} from "./runner-strategic-exchange";
import {
  runnerActionRequiresTargetedBypassPlan,
  type RunnerTargetedBypassChoiceContinuation,
} from "./runner-targeted-bypass-plan";
import { runnerActionRequiresTargetedIceTrashPlan } from "./runner-targeted-ice-trash-plan";
import { runnerTerminalContestThreat } from "./runner-terminal-contest-threat";
import { turnKey } from "./runtime-identifiers";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";
import {
  breakSubroutineIndexesForAction,
  parseSubroutineIndexes,
} from "./subroutine-indexes";
import { assessTraceBidCandidates } from "./trace-bid-assessment";
import { latestTraceContext } from "./trace-context";
import {
  candidateIsVisibleCorpAgendaInstall,
  candidateIsVisibleCorpIceInstall,
  candidateTargetIds,
  isCorpInstallServerId,
  visibleKnownCardType,
} from "./visible-action-facts";
import {
  archivesIsKnownWithoutAgenda,
  visibleKnownAgendaOnServer,
} from "./visible-server-agenda-facts";
import { visibleSourceDefinitionsByInstanceId } from "./visible-source-definitions";

export type PlanFirstLiveDependencies = {
  buildActionSemanticCandidates: (
    input: BuildActionSemanticCandidatesParams,
  ) => ActionSemanticCandidate[];
  deckCapabilitiesForInput: (input: AiDecisionInput) => DeckCapabilityProfile;
  runnerStrategicIntentForInput: (
    input: AiDecisionInput,
    deckCapabilities: DeckCapabilityProfile,
  ) => RunnerStrategicIntentProfile;
  evaluateRunnerHandDevelopment: (input: {
    input: AiDecisionInput;
    strategicIntent: RunnerStrategicIntentProfile;
    deckCapabilities: DeckCapabilityProfile;
    actionCandidates: readonly ActionSemanticCandidate[];
  }) => RunnerHandDevelopmentEvaluation[];
  buildRunnerEconomyPosture: (input: {
    input: AiDecisionInput;
    strategicIntent: RunnerStrategicIntentProfile;
    deckCapabilities: DeckCapabilityProfile;
    handDevelopmentEvaluations?: readonly RunnerHandDevelopmentEvaluation[];
  }) => RunnerEconomyPosture;
  evaluateRunnerRunTargets: (input: {
    input: AiDecisionInput;
    strategicIntent: RunnerStrategicIntentProfile;
    deckCapabilities: DeckCapabilityProfile;
    actionCandidates: readonly ActionSemanticCandidate[];
    handDevelopmentEvaluations?: readonly RunnerHandDevelopmentEvaluation[];
  }) => RunnerRunTargetEvaluation[];
  discardKeepScore?: (
    input: AiDecisionInput,
    card: VisibleCard,
  ) => DiscardChoiceKeepScore;
  selectedChoicesForDecision: (
    input: AiDecisionInput,
    action: LegalAction,
    currentPortfolio?: ResidentPlanPortfolio,
  ) => AiDecision["selectedChoices"] | undefined;
  runnerEncounterActionExclusion: (
    input: AiDecisionInput,
    action: AiDecisionInput["legalActions"][number],
  ) => SemanticRuntimeExclusion | undefined;
  runnerProgramInstallTrashAssessmentForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerProgramInstallTrashAssessment | undefined;
  runnerProgramInstallTrashAssessmentForCard: (
    input: AiDecisionInput,
    card: VisibleCard,
  ) => RunnerProgramInstallTrashAssessment;
};

const CORP_ACTION_DISPOSITION_CONTRIBUTOR_FACTS = {
  turnKey,
  candidateTargetIds,
  candidateIsVisibleCorpIceInstall,
  candidateIsVisibleCorpAgendaInstall,
  isCorpInstallServerId,
  corpCandidateIsImmediateRootRezEconomySource,
  corpCandidateIsScoreAccelerationSupport,
  corpCandidateProjectsCardDraw,
  corpConditionalRezSupportWithoutCurrentRouteEvidence,
  corpDefenseSignalOwnsAction,
  corpDefenseMaterializedActionIds,
  corpDefensiveUpgradePlacement,
  corpDefinitionSupportsPunishPlan,
  corpConditionalPunishTagSourceHasNoVisiblePayoff,
  corpPunishQuoteRequestExists,
  corpDrawCandidatePreservesHandCapacity,
  corpEmptyRdDrawOperationDispositionEvidence,
  corpExactExecutableNonEconomyPlanOwnsAction,
  corpExactOverflowHandConversionPlanOwnsCandidate,
  corpHqOverflowReservedScoreServerDispositionEvidence,
  corpHandSignalMatchesCandidate,
  corpOpenEconomyPlanOwnsAction,
  corpRemoteCreationLockRemovalAction,
  corpRunDefenseAbilityAssessment,
  corpScoreProjectAssessmentIsUnknown,
  corpScoreProjectId,
  corpScoredAgendaRevealWithoutPurposeDispositionEvidence,
  visibleKnownCardType,
  defenseDomainSignalFacts: CORP_DEFENSE_DOMAIN_SIGNAL_FACTS,
} satisfies CorpActionDispositionContributorFacts;

export function choosePlanFirstLiveAction(
  input: AiDecisionInput,
  options: AiDecisionRuntimeOptions,
  dependencies: PlanFirstLiveDependencies,
): AiDecision {
  input = withDecisionLocalCorpPunishRouteQuotes(
    input,
    options.quoteCorpPunishRoute,
  );
  if ((input as AiDecisionInputWithDeckCapabilities).planningRulesContext) {
    Object.assign(input, {
      planningStateIdentity: buildPlanningStateIdentity(input),
    });
  }
  const candidates = attachActiveRunContext(
    input,
    dependencies.buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: input.side,
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId:
        visibleSourceDefinitionsByInstanceId(input.playerView),
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    }),
  );
  const previous = residentPlanPortfolioSnapshot(input);
  const registry =
    input.side === "runner"
      ? createSidePlanRegistry({
          side: "runner",
          priorityPolicy: RUNNER_PLAN_PRIORITY_POLICY,
          modules: currentRunnerPlanModules(),
        })
      : createSidePlanRegistry({
          side: "corp",
          priorityPolicy: CORP_PLAN_PRIORITY_POLICY,
          modules: currentCorpPlanModules(),
        });
  const windowContext: PlanSchedulerContext = {
    input,
    actionCandidates: candidates,
    turnKey: turnKey(input),
  };
  const planBoundRunnerEventInstallChoice =
    input.side === "runner" &&
    input.playerView.pendingChoice?.continuation?.family ===
      "runner_grip_install_with_temporary_credits";
  const resolveCurrentEngineWindow = (
    schedulerContext: PlanSchedulerContext,
  ): EngineWindowResolution | undefined => {
    if (planBoundRunnerEventInstallChoice) return undefined;
    return (
      resolveCorpPunishTraceWindow(schedulerContext, previous) ??
      resolvePlanBoundRunnerDelayedProgramSearchChoice(
        schedulerContext,
        previous,
      ) ??
      resolvePlanBoundRunnerEventInstallMemoryChoice(
        schedulerContext,
        previous,
      ) ??
      resolvePlanBoundRunnerProgramTrashChoice(schedulerContext, previous) ??
      resolvePlanBoundRunnerPostBreakStealthLossChoice(
        schedulerContext,
        previous,
      ) ??
      resolvePlanBoundRunnerCostPenaltyContinuation(
        schedulerContext,
        previous,
      ) ??
      resolvePlanBoundRunnerHiddenDrawChoice(schedulerContext, previous) ??
      resolvePlanBoundCorpArchivesToHqChoice(schedulerContext, previous) ??
      resolvePlanBoundRunnerRunStartOrderChoice(schedulerContext, previous) ??
      resolvePlanBoundRunnerTraceBaseLinkChoice(schedulerContext, previous) ??
      resolvePlanBoundRunnerTraceSuccessCancelChoice(
        schedulerContext,
        previous,
      ) ??
      resolvePlanBoundRunnerBrokenIceVirusCounterChoice(
        schedulerContext,
        previous,
      ) ??
      resolvePlanBoundRunnerVacuumLinkChoice(schedulerContext, previous) ??
      resolvePlanBoundCorpDelayedSuccessChoice(schedulerContext, previous) ??
      resolveEngineWindow(schedulerContext)
    );
  };
  const context = resolveCurrentEngineWindow(windowContext)
    ? windowContext
    : input.side === "runner"
      ? runnerContext(input, candidates, dependencies, previous)
      : corpContext(input, candidates, previous, dependencies.discardKeepScore);
  rememberCurrentStrategicIntent(input, options);
  let turnPlannerCutover: TurnPlannerCutoverResult | undefined;
  let turnPlanningDebug: AiTurnPlanningDebug | undefined;
  let result = runPlanScheduler({
    context,
    registry,
    ...(previous ? { previousPortfolio: previous } : {}),
    resolveEngineWindow: resolveCurrentEngineWindow,
  });
  if (result.lane === "engine_window") {
    context.actionDispositions =
      reconcileSelectedEngineWindowActionDispositions({
        dispositions: context.actionDispositions,
        selectedActionId: result.actionId,
        stateVersion: input.playerView.stateVersion,
        origin: result.origin,
        legalActions: input.legalActions,
      });
  }
  if (input.side === "corp" && result.lane === "plan" && context.domain) {
    const domain = context.domain as CorpPlanDomain;
    result.portfolio.campaigns = reconcileCorpCampaignContinuity({
      input,
      previous: previous?.campaigns ?? [],
      descriptors: corpCampaignDescriptors({
        domain,
        portfolio: result.portfolio,
      }),
    });
    const planningInput = input as AiDecisionInputWithDeckCapabilities;
    const hasTurnPlanningContracts =
      planningInput.planningRulesContext !== undefined &&
      planningInput.planningStateIdentity !== undefined;
    if (
      options.corpTurnPlannerMode !== "legacy_compare" &&
      !hasTurnPlanningContracts
    ) {
      throw new PlanResolutionFailure("missing_plan_module_coverage", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map((action) => action.type),
        unresolvedActionIds: input.legalActions.map(
          (action) => action.actionId,
        ),
        owner: "rules_contract",
        removalCondition:
          "The productive Corp TurnPlanner requires current planning rules and state identity contracts.",
      });
    }
    if (options.corpTurnPlannerMode === "legacy_compare") {
      if (hasTurnPlanningContracts) {
        const planner = buildCorpTurnPlannerShadow({
          input,
          context,
          registry,
          runtimeResult: result,
          selectedChoicesForDecision: dependencies.selectedChoicesForDecision,
          authorityMode: "shadow",
        });
        turnPlanningDebug = planner?.debug;
      }
    } else {
      const planner = buildCorpTurnPlannerShadow({
        input,
        context,
        registry,
        runtimeResult: result,
        selectedChoicesForDecision: dependencies.selectedChoicesForDecision,
        authorityMode: "cutover",
      });
      if (!planner) {
        throw new Error("corp_turn_planner_cutover_result_missing");
      }
      turnPlannerCutover = resolveTurnPlannerCutover({
        input,
        planner,
        portfolio: result.portfolio,
        candidates,
        rulesContext: planningInput.planningRulesContext!,
        stateIdentity: planningInput.planningStateIdentity!,
        runtimeInstanceId: "corp-turn-planner-runtime-v1",
      });
      turnPlanningDebug = turnPlannerCutover.debug;
      result = applyTurnPlannerCutoverSelection(
        input,
        candidates,
        context,
        result,
        turnPlannerCutover,
      );
    }
  }
  if (input.side === "runner" && result.lane === "plan" && context.domain) {
    const planningInput = input as AiDecisionInputWithDeckCapabilities;
    const hasTurnPlanningContracts =
      planningInput.planningRulesContext !== undefined &&
      planningInput.planningStateIdentity !== undefined;
    if (
      options.runnerTurnPlannerMode !== "legacy_compare" &&
      !hasTurnPlanningContracts
    ) {
      throw new PlanResolutionFailure("missing_plan_module_coverage", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map((action) => action.type),
        unresolvedActionIds: input.legalActions.map(
          (action) => action.actionId,
        ),
        owner: "rules_contract",
        removalCondition:
          "The productive Runner TurnPlanner requires current planning rules and state identity contracts.",
      });
    }
    const planner = hasTurnPlanningContracts
      ? buildRunnerTurnPlannerShadow({
          input,
          context,
          registry,
          runtimeResult: result,
          selectedChoicesForDecision: dependencies.selectedChoicesForDecision,
          authorityMode:
            options.runnerTurnPlannerMode === "legacy_compare"
              ? "shadow"
              : "cutover",
        })
      : undefined;
    if (options.runnerTurnPlannerMode === "legacy_compare") {
      turnPlanningDebug = planner?.debug;
    } else {
      if (!planner) {
        throw new Error("runner_turn_planner_cutover_result_missing");
      }
      turnPlannerCutover = resolveTurnPlannerCutover({
        input,
        planner,
        portfolio: result.portfolio,
        candidates,
        rulesContext: planningInput.planningRulesContext!,
        stateIdentity: planningInput.planningStateIdentity!,
        runtimeInstanceId: "runner-turn-planner-runtime-v1",
      });
      turnPlanningDebug = turnPlannerCutover.debug;
      result = applyTurnPlannerCutoverSelection(
        input,
        candidates,
        context,
        result,
        turnPlannerCutover,
      );
    }
  }
  bindSelectedCoverageSearchAction(input, result);
  bindSelectedRunnerProgramSearchAction(input, result, candidates);
  bindSelectedRunnerRecoverySearchAction(input, result, candidates);
  bindSelectedRunnerProgramInstallTrashChoiceContinuation(
    input,
    result,
    dependencies.runnerProgramInstallTrashAssessmentForAction,
  );
  bindSelectedRunnerEventInstallChoiceContinuation(input, result);
  bindSelectedRunnerTargetedBypassChoiceContinuation(input, result, candidates);
  bindSelectedRunnerTargetedIceTrashChoiceContinuation(
    input,
    result,
    candidates,
  );
  bindSelectedCorpScoreChoiceContinuation(
    input,
    result,
    dependencies.discardKeepScore,
  );
  bindSelectedCorpDefenseDrawAttempt(input, result);
  bindSelectedCorpHqOverflowConversion(input, result);
  bindSelectedCorpArchivesToHqChoiceContinuation(
    input,
    result,
    candidates,
    dependencies.discardKeepScore,
  );
  bindSelectedCorpDefenseHqHold(input, result);
  bindSelectedPlanActionOrigin(input, result, candidates);
  bindSelectedRunnerExposeInformationMemory(input, result);
  bindSelectedEngineWindowRunnerVacuumLinkOrigin(input, result, previous);
  reconcileSelectedRunnerCostPenaltySupportOrigin(input, result, previous);
  bindSelectedRunnerDelayedProgramSearchChoice(
    input,
    result,
    dependencies.runnerProgramInstallTrashAssessmentForCard,
  );
  if (
    options.persistTacticalPlanMemory !== false &&
    result.portfolio &&
    result.portfolio.stateVersion === input.playerView.stateVersion
  ) {
    rememberResidentPlanPortfolio(input, result.portfolio);
  }
  const decision = decisionFromScheduler(
    input,
    candidates,
    context,
    result,
    registry,
    dependencies,
    options,
    turnPlanningDebug,
  );
  bindSelectedRunnerCoverageSearchChoiceContinuation(
    input,
    result,
    decision,
    dependencies.runnerProgramInstallTrashAssessmentForCard,
  );
  advanceSelectedRunnerRunStartOrderOrigin(input, result, previous);
  if (
    options.persistTacticalPlanMemory !== false &&
    result.portfolio &&
    result.portfolio.stateVersion === input.playerView.stateVersion
  ) {
    rememberResidentPlanPortfolio(input, result.portfolio);
  }
  return decision;
}

function bindSelectedPlanActionOrigin(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
  candidates: readonly ActionSemanticCandidate[],
): void {
  if (input.side !== "runner" || result.lane !== "plan") return;
  const rootPlanInstanceId = result.portfolio.rootForegroundInstanceId;
  const executorInstanceId = result.portfolio.executorInstanceId;
  const selectedAction = input.legalActions.find(
    (action) => action.actionId === result.route.head.actionId,
  );
  const selectedCandidate = candidates.find(
    (candidate) => candidate.actionId === result.route.head.actionId,
  );
  const canOpenRunnerDrawReplacement =
    selectedAction?.type === "draw_card" ||
    selectedCandidate?.functionalEffects?.some(
      (effect) => effect.kind === "draw",
    ) === true;
  const canOpenRunnerRunStartOrder =
    selectedAction?.type === "start_run" ||
    (selectedAction?.type === "play_event" &&
      runnerEventStartsRunAfterProgramSearch(
        selectedCandidate?.sourceDefinitionId,
      )) ||
    ((selectedAction?.type === "play_event" ||
      selectedAction?.type === "activated_card_ability") &&
      (selectedAction.payload?.runnerEventRun === true ||
        selectedAction.payload?.runActionKind === "make_run" ||
        selectedAction.payload?.cardImplementationEffectKind === "make_run" ||
        selectedAction.payload?.cardImplementationEffectKind ===
          "secret_spend_guess_then_targeted_bypass_run"));
  const canOpenRunnerVacuumLinkRewind =
    selectedAction?.type === "continue_run" &&
    selectedAction.payload?.sourceDefinitionId === "onr_v1_275_vacuum-link" &&
    Number(selectedAction.payload?.unbrokenSubroutineCount) > 0 &&
    input.playerView.run?.encounteredIce?.definitionId ===
      "onr_v1_275_vacuum-link";
  const postBreakStealthLoss = selectedAction
    ? runnerPostBreakStealthLossChoiceBinding(input, selectedAction)
    : undefined;
  if (
    !canOpenRunnerDrawReplacement &&
    !canOpenRunnerRunStartOrder &&
    !canOpenRunnerVacuumLinkRewind &&
    !postBreakStealthLoss
  )
    return;
  const invalidCurrentPlanAction =
    !rootPlanInstanceId ||
    !executorInstanceId ||
    !selectedAction ||
    selectedAction.side !== "runner" ||
    selectedAction.expiresAtStateVersion !== input.playerView.stateVersion ||
    !result.portfolio.instances.some(
      (instance) =>
        instance.instanceId === rootPlanInstanceId &&
        instance.side === "runner",
    ) ||
    !result.portfolio.instances.some(
      (instance) =>
        instance.instanceId === executorInstanceId &&
        instance.executionState === "executor" &&
        instance.side === "runner",
    );
  if (invalidCurrentPlanAction) {
    if (
      (canOpenRunnerRunStartOrder || canOpenRunnerVacuumLinkRewind) &&
      !canOpenRunnerDrawReplacement
    )
      return;
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [result.route.head.actionId],
      owner: "continuation",
      removalCondition:
        "Persist a possible immediate Runner draw-replacement choice only with the exact selected current draw action, root plan and leaf executor.",
    });
  }
  result.portfolio.selectedActionOrigin = postBreakStealthLoss
    ? {
        rootPlanInstanceId,
        executorInstanceId,
        selectedActionId: selectedAction.actionId,
        selectedAtStateVersion: input.playerView.stateVersion,
        immediateChoicePolicy: "resolve_runner_post_break_stealth_loss",
        sourceStepId: result.route.step.stepId,
        sourceActionType: "break_subroutine",
        breakerInstanceId: postBreakStealthLoss.breakerInstanceId,
        requiredLoss: postBreakStealthLoss.requiredLoss,
        sourceMode: postBreakStealthLoss.sourceMode,
      }
    : canOpenRunnerDrawReplacement
      ? {
          rootPlanInstanceId,
          executorInstanceId,
          selectedActionId: selectedAction.actionId,
          selectedAtStateVersion: input.playerView.stateVersion,
          immediateChoicePolicy: "trash_lowest_visible_drawn_card",
        }
      : canOpenRunnerVacuumLinkRewind
        ? {
            rootPlanInstanceId,
            executorInstanceId,
            selectedActionId: selectedAction.actionId,
            selectedAtStateVersion: input.playerView.stateVersion,
            immediateChoicePolicy: "resolve_runner_vacuum_link_rewind",
            sourceStepId: result.route.step.stepId,
            sourceActionType: "continue_run",
            sourceCardInstanceId:
              input.playerView.run!.encounteredIce!.instanceId,
            sourceCardDefinitionId: "onr_v1_275_vacuum-link",
          }
        : {
            rootPlanInstanceId,
            executorInstanceId,
            selectedActionId: selectedAction.actionId,
            selectedAtStateVersion: input.playerView.stateVersion,
            immediateChoicePolicy: "resolve_runner_run_start_order",
            sourceStepId: result.route.step.stepId,
            sourceActionType:
              selectedAction.type === "activated_card_ability"
                ? "activated_card_ability"
                : selectedAction.type === "play_event"
                  ? "play_event"
                  : "start_run",
            continuedThroughStateVersion: input.playerView.stateVersion,
          };
}

function advanceSelectedRunnerRunStartOrderOrigin(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
  previous: ResidentPlanPortfolio | undefined,
): void {
  const origin = previous?.selectedActionOrigin;
  if (
    input.side !== "runner" ||
    result.lane !== "engine_window" ||
    !result.portfolio ||
    !result.diagnostics.some((diagnostic) =>
      [
        "plan_bound_runner_run_start_order_choice",
        "plan_bound_runner_delayed_program_search_choice",
        "plan_bound_runner_event_install_memory_choice",
      ].includes(diagnostic.code),
    ) ||
    origin?.immediateChoicePolicy !== "resolve_runner_run_start_order" ||
    result.origin.rootPlanInstanceId !== origin.rootPlanInstanceId ||
    result.origin.leafPlanInstanceId !== origin.executorInstanceId
  ) {
    return;
  }
  result.portfolio.stateVersion = input.playerView.stateVersion;
  result.portfolio.selectedActionOrigin = {
    ...structuredClone(origin),
    continuedThroughStateVersion: input.playerView.stateVersion,
  };
}

function bindSelectedEngineWindowRunnerVacuumLinkOrigin(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
  previous: ResidentPlanPortfolio | undefined,
): void {
  if (input.side !== "runner" || result.lane !== "engine_window") return;
  const selectedAction = input.legalActions.find(
    (action) => action.actionId === result.actionId,
  );
  const canOpenRunnerVacuumLinkRewind =
    selectedAction?.type === "continue_run" &&
    selectedAction.payload?.sourceDefinitionId === "onr_v1_275_vacuum-link" &&
    Number(selectedAction.payload?.unbrokenSubroutineCount) > 0 &&
    input.playerView.run?.encounteredIce?.definitionId ===
      "onr_v1_275_vacuum-link";
  if (!canOpenRunnerVacuumLinkRewind || !selectedAction) return;

  const currentPortfolio = result.portfolio;
  const rootPlanInstanceId = previous?.rootForegroundInstanceId;
  const executorInstanceId = previous?.executorInstanceId;
  const root = previous?.instances.find(
    (instance) => instance.instanceId === rootPlanInstanceId,
  );
  const executor = previous?.instances.find(
    (instance) => instance.instanceId === executorInstanceId,
  );
  const executorState = executor?.moduleState as
    | {
        kind?: unknown;
        signal?: { serverId?: unknown };
      }
    | undefined;
  const lease = previous?.turnPlanExecutionLease;
  const commitment = previous?.turnPlanCommitment;
  const interveningEvents = (input.eventTail ?? []).filter(
    (event) =>
      previous !== undefined &&
      event.stateVersionBefore >= previous.stateVersion &&
      event.stateVersionAfter <= input.playerView.stateVersion,
  );
  const exactPriorActionChain =
    interveningEvents.length >= 1 &&
    interveningEvents[0]?.stateVersionBefore === previous?.stateVersion &&
    interveningEvents.at(-1)?.stateVersionAfter ===
      input.playerView.stateVersion &&
    interveningEvents[0]?.publicPayload?.actor === "runner" &&
    interveningEvents[0]?.publicPayload?.actionType === lease?.actionType &&
    interveningEvents.every(
      (event, index) =>
        event.stateVersionAfter === event.stateVersionBefore + 1 &&
        (index === 0 ||
          interveningEvents[index - 1]?.stateVersionAfter ===
            event.stateVersionBefore),
    ) &&
    interveningEvents.slice(1).every((event) => {
      const payload = event.publicPayload;
      // Forced run windows preserve the existing execution owner. Only the
      // continuous, same-server run chain may connect its last chosen action
      // to this choice-producing Engine action.
      const passedUnrezzedIce =
        payload?.actor === "corp" &&
        payload.actionType === "decline_rez" &&
        payload.runPhase === "movement" &&
        typeof payload.passedIcePosition === "number" &&
        Number.isSafeInteger(payload.passedIcePosition) &&
        payload.passedIcePosition >= 0;
      // The Engine's pass transition carries the ICE position, not a server
      // field. In this continuous run-only chain it cannot change the run.
      return (
        passedUnrezzedIce ||
        (payload?.abilityFamily === "run-access" &&
          payload.serverId === input.playerView.run?.attackedServerId &&
          ((payload.actor === "corp" &&
            (payload.actionType === "rez_ice" ||
              payload.actionType === "decline_rez")) ||
            (payload.actor === "runner" &&
              payload.actionType === "continue_run")))
      );
    });
  const committedPhase = commitment?.phases?.[commitment.cursor.phaseIndex];
  const exactCommittedRunExecutor =
    committedPhase !== undefined &&
    executorInstanceId !== undefined &&
    commitment?.sequenceRootPlanInstanceId === executorInstanceId &&
    committedPhase?.root.planInstanceId === executorInstanceId &&
    committedPhase.phaseId === lease?.phaseId &&
    committedPhase.nodes[commitment!.cursor.nodeIndex]?.nodeId ===
      lease?.nodeId &&
    executor?.parentInstanceId === rootPlanInstanceId;
  const exactInheritedRunPlan =
    previous !== undefined &&
    currentPortfolio !== undefined &&
    previous.side === "runner" &&
    previous.stateVersion < input.playerView.stateVersion &&
    rootPlanInstanceId !== undefined &&
    executorInstanceId !== undefined &&
    currentPortfolio.rootForegroundInstanceId === rootPlanInstanceId &&
    currentPortfolio.executorInstanceId === executorInstanceId &&
    root?.side === "runner" &&
    executor?.side === "runner" &&
    executor.executionState === "executor" &&
    (executor.moduleId === "runner.convert_run_window" ||
      executor.moduleId === "runner.pressure_central" ||
      executor.moduleId === "runner.contest_remote") &&
    (executor.parentInstanceId === root.instanceId ||
      executor.instanceId === root.instanceId) &&
    (executorState?.kind === "run_window" ||
      executorState?.kind === "central_pressure" ||
      executorState?.kind === "remote_contest") &&
    executorState.signal?.serverId === input.playerView.run?.attackedServerId &&
    commitment?.status === "active" &&
    (commitment.sequenceRootPlanInstanceId === rootPlanInstanceId ||
      exactCommittedRunExecutor) &&
    lease !== undefined &&
    lease.commitmentId === commitment.commitmentId &&
    lease.sourcePlanId === commitment.sourcePlanId &&
    lease.currentBinding.stateVersion === previous.stateVersion &&
    exactPriorActionChain &&
    selectedAction.side === "runner" &&
    selectedAction.source === "game_rule" &&
    selectedAction.expiresAtStateVersion === input.playerView.stateVersion;
  if (!exactInheritedRunPlan) return;
  const sourceStepId =
    executor.moduleId === "runner.convert_run_window"
      ? `${executorInstanceId}:convert`
      : executor.moduleId === "runner.pressure_central"
        ? `${executorInstanceId}:pressure:${input.playerView.run!.attackedServerId}`
        : `${executorInstanceId}:contest`;
  currentPortfolio.stateVersion = input.playerView.stateVersion;
  currentPortfolio.selectedActionOrigin = {
    rootPlanInstanceId,
    executorInstanceId,
    selectedActionId: selectedAction.actionId,
    selectedAtStateVersion: input.playerView.stateVersion,
    immediateChoicePolicy: "resolve_runner_vacuum_link_rewind",
    sourceStepId,
    sourceActionType: "continue_run",
    sourceCardInstanceId: input.playerView.run!.encounteredIce!.instanceId,
    sourceCardDefinitionId: "onr_v1_275_vacuum-link",
  };
}

function runnerPostBreakStealthLossChoiceBinding(
  input: AiDecisionInput,
  action: LegalAction,
):
  | {
      breakerInstanceId: string;
      requiredLoss: number;
      sourceMode: "single_stealth_card" | "any_stealth_cards";
    }
  | undefined {
  if (action.type !== "break_subroutine") return undefined;
  const breakerInstanceId =
    typeof action.payload?.breakerId === "string"
      ? action.payload.breakerId
      : action.source;
  const breaker = input.playerView.own.rig?.find(
    (card) => card.instanceId === breakerInstanceId && card.known !== false,
  );
  const ice = currentEncounteredIceCard(input);
  if (!breaker?.definitionId || !ice?.definitionId) return undefined;
  const quote = visibleBreakerEncounterQuote({
    breakerDefinitionId: breaker.definitionId,
    breakerInstanceId: breaker.instanceId,
    breakerStrength: breaker.strength ?? 0,
    ...(breaker.selectedTargetCardId
      ? { selectedTargetCardId: breaker.selectedTargetCardId }
      : {}),
    ...(breaker.selectedSubtype
      ? { selectedSubtype: breaker.selectedSubtype }
      : {}),
    ...(breaker.randomRunStrengthState
      ? { randomRunStrengthState: breaker.randomRunStrengthState }
      : {}),
    iceDefinitionId: ice.definitionId,
    iceInstanceId: ice.instanceId,
    ...(ice.subtypes ? { iceSubtypes: ice.subtypes } : {}),
    ...(ice.effectiveRunQuote?.subroutines
      ? { subroutines: ice.effectiveRunQuote.subroutines }
      : {}),
  });
  if (!quote) return undefined;
  const losses = quote.breakOptions
    .flatMap((option) => option.consequences)
    .filter(
      (
        consequence,
      ): consequence is Extract<
        (typeof quote)["breakOptions"][number]["consequences"][number],
        { kind: "lose_stealth_credits" }
      > => consequence.kind === "lose_stealth_credits",
    );
  const distinctLosses = [
    ...new Map(
      losses.map((loss) => [
        `${loss.amount}:${loss.sourceMode}:${loss.optionalIfUnavailable}`,
        loss,
      ]),
    ).values(),
  ];
  if (distinctLosses.length !== 1) return undefined;
  const [loss] = distinctLosses;
  if (!loss || !Number.isInteger(loss.amount) || loss.amount <= 0)
    return undefined;
  const visibleStealthSources = Object.entries(
    visibleRunnerRunPathCreditBudgetForRig(input.playerView.own.rig ?? [])
      .stealthCreditsBySourceId,
  ).filter(([, amount]) => amount > 0);
  const eligibleSources =
    loss.sourceMode === "single_stealth_card"
      ? visibleStealthSources.filter(([, amount]) => amount >= loss.amount)
      : visibleStealthSources;
  const totalAvailable = visibleStealthSources.reduce(
    (total, [, amount]) => total + amount,
    0,
  );
  if (
    eligibleSources.length <= 1 ||
    (loss.sourceMode === "any_stealth_cards" &&
      totalAvailable < loss.amount &&
      !loss.optionalIfUnavailable)
  )
    return undefined;
  return {
    breakerInstanceId,
    requiredLoss:
      loss.sourceMode === "any_stealth_cards"
        ? Math.min(loss.amount, totalAvailable)
        : loss.amount,
    sourceMode: loss.sourceMode,
  };
}

function resolvePlanBoundRunnerPostBreakStealthLossChoice(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  const choice = context.input.playerView.pendingChoice;
  if (
    context.input.side !== "runner" ||
    choice?.continuation?.family !== "runner_post_break_stealth_loss"
  )
    return undefined;
  const origin = previous?.selectedActionOrigin;
  const bound =
    origin?.immediateChoicePolicy === "resolve_runner_post_break_stealth_loss";
  const root = previous?.instances.find(
    (instance) => instance.instanceId === origin?.rootPlanInstanceId,
  );
  const executor = previous?.instances.find(
    (instance) =>
      instance.instanceId === origin?.executorInstanceId &&
      instance.executionState === "executor",
  );
  const choiceActions = context.input.legalActions.filter(
    (action) => action.type === "resolve_choice",
  );
  const action = choiceActions.length === 1 ? choiceActions[0] : undefined;
  const [requirement] = action?.choiceRequirements ?? [];
  const optionIds = choice.options.map((option) => option.id);
  const continuation = choice.continuation;
  const expectedSelections =
    continuation.sourceMode === "single_stealth_card"
      ? 1
      : continuation.requiredLoss;
  const exactBinding =
    bound &&
    previous !== undefined &&
    previous.side === "runner" &&
    previous.stateVersion + 1 === context.input.playerView.stateVersion &&
    origin.selectedAtStateVersion === previous.stateVersion &&
    origin.selectedActionId === continuation.originActionId &&
    origin.breakerInstanceId === continuation.breakerInstanceId &&
    origin.requiredLoss === continuation.requiredLoss &&
    origin.sourceMode === continuation.sourceMode &&
    continuation.createdAtStateVersion ===
      context.input.playerView.stateVersion &&
    choice.stateVersion === context.input.playerView.stateVersion &&
    choice.source ===
      `v1922.post_break_stealth_loss:${continuation.sourceMode}:${continuation.requiredLoss}:${continuation.breakerInstanceId}:${context.input.playerView.stateVersion}` &&
    choice.kind === "select_cards" &&
    choice.visibility === "hidden_info_barrier" &&
    choice.minSelections === expectedSelections &&
    choice.maxSelections === expectedSelections &&
    previous.rootForegroundInstanceId === origin.rootPlanInstanceId &&
    previous.executorInstanceId === origin.executorInstanceId &&
    root !== undefined &&
    executor !== undefined &&
    action !== undefined &&
    action.side === "runner" &&
    action.source === "game_rule" &&
    action.expiresAtStateVersion === context.input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === choice.minSelections &&
    requirement.maxSelections === choice.maxSelections &&
    requirement.optionIds.length === optionIds.length &&
    optionIds.every((optionId) => requirement.optionIds.includes(optionId));
  if (!exactBinding || !action || !previous || !origin) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map(
        (legalAction) => legalAction.type,
      ),
      unresolvedActionIds: choiceActions.map(
        (legalAction) => legalAction.actionId,
      ),
      owner: "continuation",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
      removalCondition:
        "Resolve the post-break Stealth-loss choice only from the immediately preceding Runner run-window executor, exact break action and current Engine continuation.",
    });
  }
  return {
    actionId: action.actionId,
    reasonCode: "plan_bound_runner_post_break_stealth_loss_choice",
    origin: {
      rootPlanInstanceId: origin.rootPlanInstanceId,
      leafPlanInstanceId: origin.executorInstanceId,
      side: "runner",
      windowKind: "mandatory_choice",
      windowId: choice.choiceId,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
    },
  };
}

export function reconcileSelectedRunnerCostPenaltySupportOrigin(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
  previous: ResidentPlanPortfolio | undefined,
): void {
  if (input.side !== "runner" || !result.portfolio) return;
  const pending = previous?.pendingRunnerCostPenaltySupportOrigin;
  const selectedActionId =
    result.lane === "plan" ? result.route.head.actionId : result.actionId;
  const selectedAction = input.legalActions.find(
    (action) => action.actionId === selectedActionId,
  );
  const continuationActions = input.legalActions.filter(
    (action) => action.payload?.runnerCostPenaltySupportContinuation === true,
  );
  const continuation =
    continuationActions.length === 1 ? continuationActions[0] : undefined;
  const supportWindowId =
    typeof selectedAction?.payload?.costPenaltySupportWindowId === "string"
      ? selectedAction.payload.costPenaltySupportWindowId
      : undefined;
  const supportOriginalActionId =
    typeof selectedAction?.payload?.costPenaltySupportOriginalActionId ===
    "string"
      ? selectedAction.payload.costPenaltySupportOriginalActionId
      : undefined;
  const continuationWindowId =
    typeof continuation?.payload?.runnerCostPenaltySupportWindowId === "string"
      ? continuation.payload.runnerCostPenaltySupportWindowId
      : undefined;
  const selectedPaymentSupport =
    supportWindowId !== undefined && supportOriginalActionId !== undefined;
  const continuationMatchesWindow =
    continuationActions.length === 0 ||
    (continuation !== undefined &&
      continuationWindowId === supportWindowId &&
      continuation.actionId === pending?.originalActionId);

  if (result.lane === "engine_window") {
    if (
      result.diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "plan_bound_runner_cost_penalty_support_action",
      )
    ) {
      const directSupportFromOriginalSelection =
        pending?.windowId === undefined &&
        previous !== undefined &&
        previous?.stateVersion === pending?.selectedAtStateVersion &&
        input.playerView.stateVersion === previous.stateVersion + 1;
      if (
        !pending ||
        !selectedAction ||
        !selectedPaymentSupport ||
        supportOriginalActionId !== pending.originalActionId ||
        (pending.windowId !== supportWindowId &&
          !directSupportFromOriginalSelection) ||
        selectedAction.side !== "runner" ||
        selectedAction.type !== "activated_card_ability" ||
        selectedAction.expiresAtStateVersion !==
          input.playerView.stateVersion ||
        result.origin.rootPlanInstanceId !== pending.rootPlanInstanceId ||
        result.origin.leafPlanInstanceId !== pending.executorInstanceId
      ) {
        throw new PlanResolutionFailure("window_origin_missing", {
          side: input.side,
          stateVersion: input.playerView.stateVersion,
          timingPoint: input.playerView.timingPoint,
          legalActionTypes: input.legalActions.map((action) => action.type),
          unresolvedActionIds: selectedAction ? [selectedAction.actionId] : [],
          owner: "continuation",
          ...(pending ? { planInstanceId: pending.executorInstanceId } : {}),
          ...(pending ? { stepId: pending.sourceStepId } : {}),
          removalCondition:
            "Select Runner payment support only from the exact original plan action and current Engine support window.",
        });
      }
      rebaseSelectedRunnerImmediateChoiceOriginForPaymentStep(
        input,
        result,
        previous,
        pending,
      );
      result.portfolio.stateVersion = input.playerView.stateVersion;
      result.portfolio.pendingRunnerCostPenaltySupportOrigin = {
        ...structuredClone(pending),
        windowId: supportWindowId,
      };
      return;
    }
    if (
      result.diagnostics.some(
        (diagnostic) =>
          diagnostic.code ===
          "plan_bound_runner_cost_penalty_support_continuation",
      )
    ) {
      if (!pending) {
        throw new PlanResolutionFailure("window_origin_missing", {
          side: input.side,
          stateVersion: input.playerView.stateVersion,
          timingPoint: input.playerView.timingPoint,
          legalActionTypes: input.legalActions.map((action) => action.type),
          unresolvedActionIds: selectedAction ? [selectedAction.actionId] : [],
          owner: "continuation",
          removalCondition:
            "Continue a Runner payment window only from its exact persisted original plan action.",
        });
      }
      rebaseSelectedRunnerImmediateChoiceOriginForPaymentStep(
        input,
        result,
        previous,
        pending,
      );
      bindRunnerEventInstallChoiceEngineContinuation(input, result, pending);
      bindRunnerDevelopmentSearchEngineContinuation(input, result, pending);
      result.portfolio.stateVersion = input.playerView.stateVersion;
      delete result.portfolio.pendingRunnerCostPenaltySupportOrigin;
      return;
    }
    const choice = input.playerView.pendingChoice;
    const run = input.playerView.run;
    const rootPlanInstanceId = previous?.rootForegroundInstanceId;
    const executorInstanceId = previous?.executorInstanceId;
    const root = previous?.instances.find(
      (instance) => instance.instanceId === rootPlanInstanceId,
    );
    const executor = previous?.instances.find(
      (instance) => instance.instanceId === executorInstanceId,
    );
    const executorState = executor?.moduleState as
      | {
          kind?: unknown;
          signal?: { windowId?: unknown; serverId?: unknown };
        }
      | undefined;
    const interveningEvents = (input.eventTail ?? []).filter(
      (event) =>
        previous !== undefined &&
        event.stateVersionBefore >= previous.stateVersion &&
        event.stateVersionAfter <= input.playerView.stateVersion,
    );
    const eventsAreContinuous =
      interveningEvents.length >= 2 &&
      interveningEvents[0]?.stateVersionBefore === previous?.stateVersion &&
      interveningEvents.at(-1)?.stateVersionAfter ===
        input.playerView.stateVersion &&
      interveningEvents.every(
        (event, index) =>
          index === 0 ||
          event.stateVersionBefore ===
            interveningEvents[index - 1]?.stateVersionAfter,
      );
    const traceStartIndex = interveningEvents.findIndex(
      (event) =>
        event.publicPayload?.actor === "runner" &&
        event.publicPayload.actionType === "continue_run" &&
        event.publicPayload.effectKind === "trace" &&
        event.publicPayload.traceStarted === true &&
        event.publicPayload.serverId === run?.attackedServerId,
    );
    const traceStart = interveningEvents[traceStartIndex];
    const tracePrefix = interveningEvents.slice(0, traceStartIndex);
    const traceSuffix = interveningEvents.slice(traceStartIndex + 1);
    const traceWindowIsContinuous =
      eventsAreContinuous &&
      traceStartIndex >= 0 &&
      traceStart?.publicPayload?.actor === "runner" &&
      traceStart.publicPayload.actionType === "continue_run" &&
      traceStart.publicPayload.effectKind === "trace" &&
      traceStart.publicPayload.traceStarted === true &&
      traceStart.publicPayload.serverId === run?.attackedServerId &&
      traceSuffix.every(
        (event) =>
          event.publicPayload?.actionType === "resolve_choice" &&
          event.publicPayload.effectKind === "trace",
      );
    const directRunRootPrefixIsBound =
      tracePrefix.length >= 1 &&
      tracePrefix[0]?.publicPayload?.actor === "runner" &&
      tracePrefix[0].publicPayload.actionType === "start_run" &&
      tracePrefix[0].publicPayload.serverId === run?.attackedServerId &&
      tracePrefix
        .slice(1)
        .every(
          (event) =>
            event.publicPayload?.actor === "corp" &&
            event.publicPayload.actionType === "rez_ice" &&
            event.publicPayload.serverId === run?.attackedServerId,
        );
    const requirement = selectedAction?.choiceRequirements?.[0];
    const choiceOptionIds = choice?.options.map((option) => option.id) ?? [];
    const traceOriginOwnedByRunWindowLeaf =
      executor?.moduleId === "runner.convert_run_window" &&
      executor.executionState === "executor" &&
      executor.parentInstanceId === root?.instanceId &&
      executorState?.kind === "run_window" &&
      executorState.signal?.windowId === `run:${run?.runId}` &&
      executorState.signal.serverId === run?.attackedServerId;
    const traceOriginOwnedDirectlyByRunRoot =
      executor?.instanceId === root?.instanceId &&
      executor?.executionState === "executor" &&
      (executor.moduleId === "runner.contest_remote" ||
        executor.moduleId === "runner.pressure_central");
    const exactRunTraceBidOrigin =
      previous !== undefined &&
      rootPlanInstanceId !== undefined &&
      executorInstanceId !== undefined &&
      result.portfolio.rootForegroundInstanceId === rootPlanInstanceId &&
      result.portfolio.executorInstanceId === executorInstanceId &&
      root?.side === "runner" &&
      executor?.side === "runner" &&
      ((traceOriginOwnedByRunWindowLeaf && traceStartIndex === 0) ||
        (traceOriginOwnedDirectlyByRunRoot && directRunRootPrefixIsBound)) &&
      choice?.side === "runner" &&
      choice.kind === "bid_amount" &&
      choice.source.startsWith(`trace:${run?.runId}.`) &&
      choice.stateVersion === input.playerView.stateVersion &&
      selectedAction?.side === "runner" &&
      selectedAction.type === "resolve_choice" &&
      selectedAction.source === "game_rule" &&
      selectedAction.expiresAtStateVersion === input.playerView.stateVersion &&
      selectedAction.choiceRequirements?.length === 1 &&
      requirement?.choiceId === choice.choiceId &&
      requirement.minSelections === choice.minSelections &&
      requirement.maxSelections === choice.maxSelections &&
      requirement.optionIds.length === choiceOptionIds.length &&
      choiceOptionIds.every((optionId) =>
        requirement.optionIds.includes(optionId),
      ) &&
      traceWindowIsContinuous;
    if (exactRunTraceBidOrigin) {
      result.portfolio.stateVersion = input.playerView.stateVersion;
      const staleRunStartOrigin = result.portfolio.selectedActionOrigin;
      if (
        staleRunStartOrigin?.immediateChoicePolicy ===
          "resolve_runner_run_start_order" &&
        staleRunStartOrigin.rootPlanInstanceId === rootPlanInstanceId &&
        staleRunStartOrigin.executorInstanceId === executorInstanceId &&
        (staleRunStartOrigin.sourceActionType === "start_run" ||
          staleRunStartOrigin.sourceActionType === "play_event" ||
          staleRunStartOrigin.sourceActionType === "activated_card_ability") &&
        staleRunStartOrigin.selectedAtStateVersion <
          input.playerView.stateVersion
      ) {
        delete result.portfolio.selectedActionOrigin;
      }
      result.portfolio.pendingRunnerCostPenaltySupportOrigin = {
        rootPlanInstanceId,
        executorInstanceId,
        sourceStepId: result.origin.windowId,
        originalActionId: selectedAction.actionId,
        selectedAtStateVersion: input.playerView.stateVersion,
      };
    }
    return;
  }

  if (selectedPaymentSupport) {
    if (
      !pending ||
      continuationActions.length > 1 ||
      !continuationMatchesWindow ||
      supportWindowId === undefined ||
      supportOriginalActionId !== pending.originalActionId ||
      (pending.windowId !== undefined && pending.windowId !== supportWindowId)
    ) {
      throw new PlanResolutionFailure("window_origin_missing", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map((action) => action.type),
        unresolvedActionIds: input.legalActions.map(
          (action) => action.actionId,
        ),
        owner: "continuation",
        removalCondition:
          "Use Runner payment support only while preserving the exact original plan action and current Engine support-window id.",
      });
    }
    preserveSelectedRunnerCoverageBindingAcrossPaymentStep(
      input,
      result,
      previous,
      pending,
    );
    preserveSelectedRunnerTargetedBypassBindingAcrossPaymentStep(
      input,
      result,
      previous,
      pending,
    );
    result.portfolio.pendingRunnerCostPenaltySupportOrigin = {
      ...structuredClone(pending),
      windowId: supportWindowId,
    };
    return;
  }

  const creditCost = selectedAction?.costs?.reduce(
    (total, cost) => total + Math.max(0, Number(cost.credits ?? 0)),
    0,
  );
  if (
    selectedAction?.side === "runner" &&
    selectedAction.expiresAtStateVersion === input.playerView.stateVersion &&
    Number.isFinite(creditCost) &&
    (Number(creditCost) > 0 ||
      (selectedAction.type === "continue_run" &&
        input.playerView.run !== undefined))
  ) {
    result.portfolio.pendingRunnerCostPenaltySupportOrigin = {
      rootPlanInstanceId: result.portfolio.rootForegroundInstanceId!,
      executorInstanceId: result.portfolio.executorInstanceId!,
      sourceStepId: result.route.step.stepId,
      originalActionId: selectedAction.actionId,
      selectedAtStateVersion: input.playerView.stateVersion,
    };
    return;
  }
  delete result.portfolio.pendingRunnerCostPenaltySupportOrigin;
}

function preserveSelectedRunnerTargetedBypassBindingAcrossPaymentStep(
  input: AiDecisionInput,
  result: Extract<PlanSchedulerResult, { lane: "plan" }>,
  previous: ResidentPlanPortfolio | undefined,
  pending: NonNullable<
    ResidentPlanPortfolio["pendingRunnerCostPenaltySupportOrigin"]
  >,
): void {
  const previousExecutor = previous?.instances.find(
    (instance) => instance.instanceId === pending.executorInstanceId,
  );
  if (
    previousExecutor?.moduleId !== "runner.pressure_central" &&
    previousExecutor?.moduleId !== "runner.contest_remote"
  ) {
    return;
  }
  const previousState = previousExecutor.moduleState as
    | {
        kind?: unknown;
        choiceContinuation?: RunnerTargetedBypassChoiceContinuation;
      }
    | undefined;
  const continuation = previousState?.choiceContinuation;
  if (continuation?.family !== "runner_targeted_bypass") return;
  const exactOrigin =
    previous?.side === "runner" &&
    previousExecutor.executionState === "executor" &&
    (previousState?.kind === "central_pressure" ||
      previousState?.kind === "remote_contest") &&
    continuation.ownerModuleId === previousExecutor.moduleId &&
    continuation.ownerDedupeKey === previousExecutor.dedupeKey &&
    continuation.sourceActionId === pending.originalActionId &&
    continuation.selectedActionId === pending.originalActionId &&
    continuation.selectedAtStateVersion === pending.selectedAtStateVersion;
  if (!exactOrigin || !continuation) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [pending.originalActionId],
      owner: "continuation",
      planInstanceId: pending.executorInstanceId,
      stepId: pending.sourceStepId,
      removalCondition:
        "Carry the exact selected targeted-bypass plan and its bound Social Engineering continuation through payment support.",
    });
  }
  const existing = result.portfolio.instances.find(
    (instance) => instance.instanceId === previousExecutor.instanceId,
  );
  if (existing) {
    existing.moduleState = structuredClone(previousExecutor.moduleState);
    existing.executionState = "preempted";
    existing.portfolioRole = "background";
    return;
  }
  const preserved = structuredClone(previousExecutor);
  preserved.executionState = "preempted";
  preserved.portfolioRole = "background";
  result.portfolio.instances.push(preserved);
}

function rebaseSelectedRunnerImmediateChoiceOriginForPaymentStep(
  input: AiDecisionInput,
  result: Extract<PlanSchedulerResult, { lane: "engine_window" }>,
  previous: ResidentPlanPortfolio | undefined,
  pending: NonNullable<
    ResidentPlanPortfolio["pendingRunnerCostPenaltySupportOrigin"]
  >,
): void {
  const selectedOrigin = previous?.selectedActionOrigin;
  if (!selectedOrigin) return;
  const exactOrigin =
    previous.side === "runner" &&
    previous.stateVersion === selectedOrigin.selectedAtStateVersion &&
    input.playerView.stateVersion === previous.stateVersion + 1 &&
    selectedOrigin.selectedActionId === pending.originalActionId &&
    selectedOrigin.rootPlanInstanceId === pending.rootPlanInstanceId &&
    selectedOrigin.executorInstanceId === pending.executorInstanceId &&
    previous.rootForegroundInstanceId === selectedOrigin.rootPlanInstanceId &&
    previous.executorInstanceId === selectedOrigin.executorInstanceId &&
    result.origin.rootPlanInstanceId === pending.rootPlanInstanceId &&
    result.origin.leafPlanInstanceId === pending.executorInstanceId;
  if (!exactOrigin) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [pending.originalActionId],
      owner: "continuation",
      planInstanceId: pending.executorInstanceId,
      stepId: pending.sourceStepId,
      removalCondition:
        "Advance a possible immediate Runner choice only with the exact original payment action, root, executor and consecutive Engine state.",
    });
  }
  result.portfolio!.selectedActionOrigin =
    selectedOrigin.immediateChoicePolicy === "resolve_runner_run_start_order"
      ? {
          ...structuredClone(selectedOrigin),
          selectedAtStateVersion: input.playerView.stateVersion,
          continuedThroughStateVersion: input.playerView.stateVersion,
        }
      : {
          ...structuredClone(selectedOrigin),
          selectedAtStateVersion: input.playerView.stateVersion,
        };
}

export function resolvePlanBoundRunnerCostPenaltyContinuation(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  if (context.input.side !== "runner") return undefined;
  const origin = previous?.pendingRunnerCostPenaltySupportOrigin;
  const continuationActions = context.input.legalActions.filter(
    (action) => action.payload?.runnerCostPenaltySupportContinuation === true,
  );
  const boundSupportActions = context.input.legalActions.filter(
    (action) =>
      action.side === "runner" &&
      action.type === "activated_card_ability" &&
      typeof action.payload?.costPenaltySupportWindowId === "string" &&
      action.payload?.costPenaltySupportOriginalActionId ===
        origin?.originalActionId,
  );
  if (continuationActions.length === 0) {
    if (boundSupportActions.length !== 1) return undefined;
    const action = boundSupportActions[0]!;
    const windowId = action.payload!.costPenaltySupportWindowId as string;
    const directSupportFromOriginalSelection =
      origin?.windowId === undefined &&
      previous !== undefined &&
      previous?.stateVersion === origin?.selectedAtStateVersion &&
      context.input.playerView.stateVersion === previous.stateVersion + 1;
    if (
      !origin ||
      previous?.side !== "runner" ||
      previous.stateVersion > context.input.playerView.stateVersion ||
      (origin.windowId !== windowId && !directSupportFromOriginalSelection) ||
      action.expiresAtStateVersion !== context.input.playerView.stateVersion
    ) {
      throw new PlanResolutionFailure("window_origin_missing", {
        side: context.input.side,
        stateVersion: context.input.playerView.stateVersion,
        timingPoint: context.input.playerView.timingPoint,
        legalActionTypes: context.input.legalActions.map(
          (legalAction) => legalAction.type,
        ),
        unresolvedActionIds: boundSupportActions.map(
          (legalAction) => legalAction.actionId,
        ),
        owner: "continuation",
        ...(origin ? { planInstanceId: origin.executorInstanceId } : {}),
        ...(origin ? { stepId: origin.sourceStepId } : {}),
        removalCondition:
          "Use the sole current Runner payment-support action only while preserving the exact original plan action and Engine support-window id.",
      });
    }
    return {
      actionId: action.actionId,
      reasonCode: "plan_bound_runner_cost_penalty_support_action",
      origin: {
        rootPlanInstanceId: origin.rootPlanInstanceId,
        leafPlanInstanceId: origin.executorInstanceId,
        side: "runner",
        windowKind: "optional_ability",
        windowId,
        stateVersion: context.input.playerView.stateVersion,
        timingPoint: context.input.playerView.timingPoint,
      },
    };
  }
  const action =
    continuationActions.length === 1 ? continuationActions[0] : undefined;
  const windowId =
    typeof action?.payload?.runnerCostPenaltySupportWindowId === "string"
      ? action.payload.runnerCostPenaltySupportWindowId
      : undefined;
  const supportActions = context.input.legalActions.filter(
    (legalAction) => legalAction.actionId !== action?.actionId,
  );
  const supportActionsMatchWindow = supportActions.every(
    (supportAction) =>
      supportAction.payload?.costPenaltySupportWindowId === windowId &&
      supportAction.payload?.costPenaltySupportOriginalActionId ===
        origin?.originalActionId,
  );
  const supportActionsExplicitlyRejected = supportActions.every(
    (supportAction) =>
      context.actionDispositions?.some(
        (disposition) =>
          disposition.actionId === supportAction.actionId &&
          disposition.disposition === "explicitly_nonproductive",
      ) === true,
  );
  const directContinuationFromOriginalSelection =
    origin?.windowId === undefined &&
    previous?.stateVersion === origin?.selectedAtStateVersion &&
    previous !== undefined &&
    context.input.playerView.stateVersion === previous.stateVersion + 1;
  if (
    !action ||
    !origin ||
    previous?.side !== "runner" ||
    previous.stateVersion > context.input.playerView.stateVersion ||
    origin.originalActionId !== action.actionId ||
    (origin.windowId !== windowId &&
      !directContinuationFromOriginalSelection) ||
    action.side !== "runner" ||
    action.expiresAtStateVersion !== context.input.playerView.stateVersion ||
    windowId === undefined ||
    !supportActionsMatchWindow
  ) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map(
        (legalAction) => legalAction.type,
      ),
      unresolvedActionIds: continuationActions.map(
        (legalAction) => legalAction.actionId,
      ),
      owner: "continuation",
      ...(origin ? { planInstanceId: origin.executorInstanceId } : {}),
      ...(origin ? { stepId: origin.sourceStepId } : {}),
      removalCondition:
        "Resume only the exact original Runner plan action from the same current Engine cost/penalty support window.",
    });
  }
  if (supportActions.length > 0 && !supportActionsExplicitlyRejected) {
    return undefined;
  }
  return {
    actionId: action.actionId,
    reasonCode: "plan_bound_runner_cost_penalty_support_continuation",
    origin: {
      rootPlanInstanceId: origin.rootPlanInstanceId,
      leafPlanInstanceId: origin.executorInstanceId,
      side: "runner",
      windowKind: "optional_ability",
      windowId,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
    },
  };
}

export function reconcileSelectedTurnPlannerActionDispositions(params: {
  dispositions: readonly PlanActionDisposition[] | undefined;
  selectedActionId: string;
  stateVersion: number;
  lease: TurnPlannerCutoverResult["lease"];
}): readonly PlanActionDisposition[] {
  if (
    params.lease.currentBinding.actionId !== params.selectedActionId ||
    params.lease.currentBinding.stateVersion !== params.stateVersion ||
    params.lease.stateIdentity.stateVersion !== params.stateVersion
  ) {
    throw new Error("turn_planner_selected_action_binding_mismatch");
  }
  return (params.dispositions ?? []).filter(
    (disposition) => disposition.actionId !== params.selectedActionId,
  );
}

export function reconcileSelectedEngineWindowActionDispositions(params: {
  dispositions: readonly PlanActionDisposition[] | undefined;
  selectedActionId: string;
  stateVersion: number;
  origin: EngineWindowResolution["origin"];
  legalActions: readonly LegalAction[];
}): readonly PlanActionDisposition[] {
  const selectedAction = params.legalActions.find(
    (action) => action.actionId === params.selectedActionId,
  );
  if (
    !selectedAction ||
    selectedAction.expiresAtStateVersion !== params.stateVersion ||
    params.origin.stateVersion !== params.stateVersion
  ) {
    throw new Error("engine_window_selected_action_binding_mismatch");
  }
  return (params.dispositions ?? []).filter(
    (disposition) => disposition.actionId !== params.selectedActionId,
  );
}

function applyTurnPlannerCutoverSelection(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  context: PlanSchedulerContext,
  result: Extract<PlanSchedulerResult, { lane: "plan" }>,
  cutover: TurnPlannerCutoverResult,
): Extract<PlanSchedulerResult, { lane: "plan" }> {
  const binding = cutover.planner.headBindings.find(
    (entry) => entry.candidateId === cutover.head.candidateId,
  );
  const candidate = candidates.find(
    (entry) => entry.actionId === cutover.head.currentBinding.actionId,
  );
  const legalAction = input.legalActions.find(
    (action) => action.actionId === cutover.head.currentBinding.actionId,
  );
  if (
    !binding ||
    binding.planInstanceId !== cutover.selectedPlanInstanceId ||
    !candidate ||
    !legalAction ||
    candidate.stateVersion !== input.playerView.stateVersion ||
    legalAction.expiresAtStateVersion !== input.playerView.stateVersion
  ) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [cutover.head.currentBinding.actionId],
      owner: "plan_registry",
      removalCondition: `Bind the ${input.side} TurnPlanner winner to its exact current plan instance, semantic candidate and LegalAction witness.`,
    });
  }
  context.actionDispositions = reconcileSelectedTurnPlannerActionDispositions({
    dispositions: context.actionDispositions,
    selectedActionId: legalAction.actionId,
    stateVersion: input.playerView.stateVersion,
    lease: cutover.lease,
  });
  const portfolio = selectResidentPlanPortfolioExecutor({
    portfolio: result.portfolio,
    selectedExecutorInstanceId: cutover.selectedPlanInstanceId,
    timingPoint: input.playerView.timingPoint,
    reason:
      result.portfolio.executorInstanceId === cutover.selectedPlanInstanceId
        ? "executor_selected"
        : "preempted_by_validated_value",
  });
  portfolio.turnPlanCommitment = structuredClone(cutover.commitment);
  portfolio.turnPlanExecutionLease = structuredClone(cutover.lease);
  return {
    lane: "plan",
    route: {
      planInstanceId: cutover.selectedPlanInstanceId,
      step: structuredClone(binding.step),
      head: {
        planInstanceId: cutover.selectedPlanInstanceId,
        stepId: binding.step.stepId,
        actionId: legalAction.actionId,
        actionType: legalAction.type,
        semanticActionType: candidate.semanticActionType,
        stateVersion: input.playerView.stateVersion,
        ...(binding.step.target
          ? { target: structuredClone(binding.step.target) }
          : {}),
      },
      ...(binding.continuation
        ? { continuation: structuredClone(binding.continuation) }
        : {}),
    },
    selectedAssessment: structuredClone(binding.assessment),
    portfolio,
    ...(result.engineRandomizedIceInstallNearTie?.candidates.some(
      (entry) => entry.actionId === legalAction.actionId,
    )
      ? {
          engineRandomizedIceInstallNearTie: structuredClone(
            result.engineRandomizedIceInstallNearTie,
          ),
        }
      : {}),
    diagnostics: [
      ...result.diagnostics,
      {
        stage: "select",
        code: `${input.side}_turn_planner_cutover_winner`,
        instanceId: cutover.selectedPlanInstanceId,
        moduleId: cutover.head.moduleId,
        priorityClass: cutover.head.priorityClass,
      },
      ...(cutover.replanReason
        ? [
            {
              stage: "reconcile" as const,
              code: `${input.side}_turn_plan_replanned:${cutover.replanReason}`,
              instanceId: cutover.selectedPlanInstanceId,
              moduleId: cutover.head.moduleId,
            },
          ]
        : []),
    ],
  };
}

function currentCorpPlanModules() {
  const modules = [
    ...createCorpCorePlanModules(),
    ...createCorpTacticalPlanModules(),
    createTurnCompletionPlanModule("corp"),
  ];
  assertCorpTurnPlanningModuleRegistry(
    modules.map((module) => module.moduleId),
  );
  return modules;
}

function currentRunnerPlanModules() {
  const modules = [
    ...createRunnerCorePlanModules(),
    ...createRunnerTacticalPlanModules(),
    createTurnCompletionPlanModule("runner"),
  ];
  assertRunnerTurnPlanningModuleRegistry(
    modules.map((module) => module.moduleId),
  );
  return modules;
}

function rememberCurrentStrategicIntent(
  input: AiDecisionInput,
  options: AiDecisionRuntimeOptions,
): void {
  if (options.persistTacticalPlanMemory === false) return;
  const strategicIntent = (input as AiDecisionInputWithDeckCapabilities)
    .ownStrategicIntentState;
  if (strategicIntent) rememberStrategicIntentState(input, strategicIntent);
}

function runnerContext(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  dependencies: PlanFirstLiveDependencies,
  previous: ResidentPlanPortfolio | undefined,
): PlanSchedulerContext {
  const deckCapabilities = dependencies.deckCapabilitiesForInput(input);
  const strategicIntent = dependencies.runnerStrategicIntentForInput(
    input,
    deckCapabilities,
  );
  const evaluateHandDevelopment = (
    rigDemandProjection?: RunnerRigDemandProjection,
  ) =>
    dependencies
      .evaluateRunnerHandDevelopment({
        input,
        strategicIntent,
        deckCapabilities,
        actionCandidates: candidates,
        ...(rigDemandProjection ? { rigDemandProjection } : {}),
      })
      .map((evaluation) => {
        if (!evaluation.legalActionId) return evaluation;
        const action = input.legalActions.find(
          (candidate) => candidate.actionId === evaluation.legalActionId,
        );
        if (!action) return evaluation;
        const assessment =
          dependencies.runnerProgramInstallTrashAssessmentForAction(
            input,
            action,
          );
        if (
          assessment?.memoryRequired !== true ||
          assessment.canFreeRequiredMemory
        ) {
          return evaluation;
        }
        return {
          ...evaluation,
          availability: "missing_mu" as const,
          strategicFit: "blocked" as const,
          deferReason: "missing_mu" as const,
          evidence: [
            ...evaluation.evidence,
            "runner_program_trash_install_has_no_acceptable_sacrifice",
            ...assessment.evidence,
          ],
        };
      });
  const initialHandDevelopment = evaluateHandDevelopment();
  const initialEconomy = dependencies.buildRunnerEconomyPosture({
    input,
    strategicIntent,
    deckCapabilities,
    handDevelopmentEvaluations: initialHandDevelopment,
  });
  const initialRunTargets = dependencies.evaluateRunnerRunTargets({
    input,
    strategicIntent,
    deckCapabilities,
    actionCandidates: candidates,
    handDevelopmentEvaluations: initialHandDevelopment,
  });
  assertRunnerRestrictedProgramInstallCommitment(input, candidates, previous);
  const activeRunRoot = reassessActiveInformationRunParent(
    input,
    activeRunRootPlan(previous, input),
  );
  const runRiskReassessment = runnerRunRiskContractReassessment(
    input,
    activeRunRoot,
  );
  const exposeInformation = runnerExposeInformationSignals(
    input,
    candidates,
    previous,
  );
  const initialRunWindowActionAssessments = runnerRunWindowActionAssessments(
    input,
    candidates,
    initialRunTargets,
    initialEconomy,
    dependencies,
    activeRunRoot,
    runRiskReassessment,
  );
  const discardChoiceBinding = runnerDiscardChoicePlanBinding({
    input,
    candidates,
    ...(dependencies.discardKeepScore
      ? { discardKeepScore: dependencies.discardKeepScore }
      : {}),
  });
  const preliminaryUnboundDomain = buildRunnerDomain(
    input,
    candidates,
    deckCapabilities,
    strategicIntent,
    initialEconomy,
    initialHandDevelopment,
    initialRunTargets,
    initialRunWindowActionAssessments,
    activeRunRoot,
    runRiskReassessment,
    exposeInformation,
    previous,
    discardChoiceBinding,
    dependencies.discardKeepScore,
    undefined,
    dependencies.runnerProgramInstallTrashAssessmentForCard,
  );
  const preliminaryDomain = bindRunnerCoverageSearchProgramTrashSacrifices(
    input,
    preliminaryUnboundDomain,
    dependencies.runnerProgramInstallTrashAssessmentForCard,
  );
  const rigDemandProjection =
    runnerRigDemandProjectionInputAvailable(input) &&
    runnerCoverageRigDemandInputsComplete({
      input,
      deckCapabilities,
      coverageGaps: preliminaryDomain.coverageGaps,
    })
      ? buildRunnerRigDemandProjectionForCoverage({
          input,
          strategicIntent,
          deckCapabilities,
          coverageGaps: preliminaryDomain.coverageGaps,
          rolesForDefinitionId: rolesForDeckDoctrineCard,
        })
      : undefined;
  const handDevelopment = evaluateHandDevelopment(rigDemandProjection);
  const economy = dependencies.buildRunnerEconomyPosture({
    input,
    strategicIntent,
    deckCapabilities,
    handDevelopmentEvaluations: handDevelopment,
  });
  const runTargets = dependencies.evaluateRunnerRunTargets({
    input,
    strategicIntent,
    deckCapabilities,
    actionCandidates: candidates,
    handDevelopmentEvaluations: handDevelopment,
  });
  const runWindowActionAssessments = runnerRunWindowActionAssessments(
    input,
    candidates,
    runTargets,
    economy,
    dependencies,
    activeRunRoot,
    runRiskReassessment,
  );
  const unboundDomain = buildRunnerDomain(
    input,
    candidates,
    deckCapabilities,
    strategicIntent,
    economy,
    handDevelopment,
    runTargets,
    runWindowActionAssessments,
    activeRunRoot,
    runRiskReassessment,
    exposeInformation,
    previous,
    discardChoiceBinding,
    dependencies.discardKeepScore,
    rigDemandProjection,
    dependencies.runnerProgramInstallTrashAssessmentForCard,
  );
  const domain = bindRunnerCoverageSearchProgramTrashSacrifices(
    input,
    unboundDomain,
    dependencies.runnerProgramInstallTrashAssessmentForCard,
  );
  const actionDispositions = runnerActionDispositions(
    input,
    candidates,
    domain,
    handDevelopment,
    runTargets,
    dependencies.runnerProgramInstallTrashAssessmentForAction,
  );
  return {
    input,
    actionCandidates: candidates,
    actionDispositions,
    transientSignals: runnerTransientPlanSignals(input, domain),
    turnKey: turnKey(input),
    domain,
  };
}

function runnerRigDemandProjectionInputAvailable(
  input: AiDecisionInput,
): boolean {
  const extended = input as AiDecisionInputWithDeckCapabilities;
  const memoryUsed = input.playerView.own.memoryUsed;
  const memoryLimit = input.playerView.own.memoryLimit;
  return (
    extended.planningStateIdentity !== undefined &&
    typeof memoryUsed === "number" &&
    Number.isSafeInteger(memoryUsed) &&
    memoryUsed >= 0 &&
    typeof memoryLimit === "number" &&
    Number.isSafeInteger(memoryLimit) &&
    memoryLimit >= 0
  );
}

function runnerTransientPlanSignals(
  input: AiDecisionInput,
  domain: RunnerPlanDomain,
): TransientPlanSignal[] {
  const current = {
    schemaVersion: TRANSIENT_PLAN_SIGNAL_SCHEMA_VERSION,
    side: "runner" as const,
    observedAtStateVersion: input.playerView.stateVersion,
  };
  const remoteSignals: TransientPlanSignal[] = domain.remoteContests.flatMap(
    (signal) =>
      signal.marginalValue > 0 &&
      (signal.knownAgendaThreat ||
        signal.terminalPatternThreat ||
        signal.reachable ||
        signal.supportNeedId !== undefined)
        ? [
            {
              ...current,
              signalId: `runner-remote:${signal.contestId}`,
              planModuleId: "runner.contest_remote",
              planDedupeKey: signal.contestId,
              kind:
                signal.knownAgendaThreat || signal.terminalPatternThreat
                  ? "threat"
                  : "goal",
              scope: "tactical",
              evidenceCode: signal.evidenceCode,
              guarantee: signal.knownAgendaThreat
                ? "visible_state_forced"
                : "robust_but_reactive",
              target: { kind: "server", id: signal.serverId },
            },
          ]
        : [],
  );
  const defense = domain.defense;
  const survivalNeedOpen =
    defense.activeTags > 0 ||
    defense.pendingDamage > 0 ||
    defense.damagePreventionNeeded ||
    defense.handSize < defense.minimumHandBuffer ||
    defense.forgoUnsafeRunCapacity ||
    defense.discardChoiceBinding !== undefined ||
    defense.reactionReserveNeed !== undefined ||
    (defense.defenseSupportInstallActionIds?.length ?? 0) > 0;
  const survivalSignals: TransientPlanSignal[] = survivalNeedOpen
    ? [
        {
          ...current,
          signalId: "runner-survival:runner",
          planModuleId: "runner.defense_and_recovery",
          planDedupeKey: "runner",
          kind: "threat",
          scope: "tactical",
          evidenceCode:
            defense.evidenceCodes[0] ?? "runner_visible_survival_need",
          guarantee: "robust_but_reactive",
          target: { kind: "player", id: "runner" },
        },
      ]
    : [];
  const terminalSignals: TransientPlanSignal[] = domain.terminalWins.map(
    (signal) => ({
      ...current,
      signalId: `runner-terminal:${signal.terminalId}`,
      planModuleId: "runner.secure_terminal_win",
      planDedupeKey: signal.terminalId,
      kind: "goal",
      scope: "tactical",
      evidenceCode: signal.evidenceCode,
      guarantee: "rules_proven",
      target: { kind: "player", id: "corp" },
    }),
  );
  return [...remoteSignals, ...survivalSignals, ...terminalSignals];
}

function runnerCandidateStartsBoundCentralRun(
  candidate: ActionSemanticCandidate,
): boolean {
  return (
    candidate.actionType === "play_event" &&
    candidate.functionalEffects?.some(
      (effect) =>
        effect.kind === "future_run_effect" &&
        effect.scope === "runner" &&
        effect.target === "make_hq_or_rnd_run" &&
        effect.timing === "action",
    ) === true
  );
}

type RunnerRunLockReleaseBoundRouteDisposition = {
  executable: boolean;
  ownerModuleId: "runner.pressure_central" | "runner.contest_remote";
  evidenceCode: string;
};

function runnerRunLockReleaseBoundRouteDisposition(
  domain: RunnerPlanDomain,
  actionId: string,
): RunnerRunLockReleaseBoundRouteDisposition {
  const centralRoute = domain.centralPressure.find(
    (signal) =>
      signal.routePreparation === "release_run_lock" &&
      signal.runActionIds?.includes(actionId) === true,
  );
  if (centralRoute) {
    const executable = centralRoute.reachable && centralRoute.marginalValue > 0;
    return {
      executable,
      ownerModuleId: "runner.pressure_central",
      evidenceCode: executable
        ? `runner_run_lock_release_bound_route_executable:${centralRoute.serverId}`
        : centralRoute.supportNeedId
          ? `runner_run_lock_release_waits_for_bound_support:${centralRoute.serverId}:${centralRoute.supportNeedId}`
          : `runner_run_lock_release_bound_route_not_executable:${centralRoute.serverId}:${centralRoute.evidenceCode}`,
    };
  }

  for (const remoteRoute of domain.remoteContests) {
    if (remoteRoute.routePreparation !== "release_run_lock") continue;
    const assessment = remoteRoute.runActionAssessments[actionId];
    if (!assessment) continue;
    return {
      executable: assessment.verdict === "executable",
      ownerModuleId: "runner.contest_remote",
      evidenceCode:
        assessment.evidenceCodes[0] ??
        `runner_remote_run_lock_release_bound_route_not_executable:${remoteRoute.serverId}`,
    };
  }

  return {
    executable: false,
    ownerModuleId: "runner.pressure_central",
    evidenceCode: "runner_run_lock_release_without_bound_run_plan",
  };
}

export function runnerActionDispositions(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  domain: RunnerPlanDomain,
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[],
  runTargets: readonly RunnerRunTargetEvaluation[],
  runnerProgramInstallTrashAssessmentForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerProgramInstallTrashAssessment | undefined,
): PlanActionDisposition[] {
  const dispositions: PlanActionDisposition[] = [];
  const addDisposition = (disposition: PlanActionDisposition) => {
    if (
      dispositions.some(
        (existing) =>
          existing.actionId === disposition.actionId &&
          existing.disposition === disposition.disposition &&
          existing.ownerModuleId === disposition.ownerModuleId,
      )
    ) {
      return;
    }
    dispositions.push(disposition);
  };
  const add = (
    actionId: string,
    ownerModuleId: PlanActionDisposition["ownerModuleId"],
    evidenceCode: string,
  ) => {
    addDisposition({
      actionId,
      disposition: "explicitly_nonproductive",
      ownerModuleId,
      evidenceCode,
    });
  };
  const addUnknown = (
    actionId: string,
    ownerModuleId: PlanActionDisposition["ownerModuleId"],
    evidenceCode: string,
  ) => {
    addDisposition({
      actionId,
      disposition: "assessment_unknown",
      ownerModuleId,
      evidenceCode,
    });
  };
  addRunnerCoverageMemoryDispositions(domain, add);
  const specializedEconomyActionIds = new Set([
    ...domain.creditBanks.flatMap((signal) => [
      ...signal.actionIds,
      ...(signal.rejectedActionIds ?? []),
    ]),
    ...(domain.recurringEconomy ?? []).flatMap((signal) => signal.actionIds),
    ...(domain.resourceLifecycle ?? []).flatMap((signal) => [
      ...signal.actionIds,
      ...(signal.rejectedActionIds ?? []),
    ]),
  ]);
  const admissibleRunWindowActionIds = new Set(
    domain.runWindows.flatMap((window) =>
      Object.entries(window.actionAssessments ?? {}).flatMap(
        ([actionId, assessment]) => (assessment.admissible ? [actionId] : []),
      ),
    ),
  );
  const exposeInformationActionIds = new Set(
    (domain.exposeInformation ?? []).flatMap(
      (signal) => signal.actionIds ?? [signal.selectedActionId],
    ),
  );
  for (const disposition of runnerExposeInformationActionDispositions(
    domain.exposeInformation ?? [],
  )) {
    addDisposition(disposition);
  }
  const activeRestrictedSequence = domain.developments.find(
    (signal) =>
      signal.phase === "execute_restricted_sequence" ||
      signal.phase === "complete_restricted_sequence",
  );
  if (activeRestrictedSequence) {
    const committedNow = new Set(activeRestrictedSequence.actionIds);
    for (const candidate of candidates) {
      const action = input.legalActions.find(
        (entry) => entry.actionId === candidate.actionId,
      );
      if (
        committedNow.has(candidate.actionId) ||
        action?.payload?.actionCapacityRestriction !== "program_install_only" ||
        action.payload?.restrictedActionGrantActionType !== "install_card" ||
        Number(action.payload?.restrictedActionGrantRemainingActions) <= 0
      ) {
        continue;
      }
      add(
        candidate.actionId,
        "runner.develop_board_and_hand",
        candidate.actionType === "stop_restricted_action_sequence"
          ? "runner_restricted_program_sequence_stop_before_commitment_completed"
          : "runner_restricted_program_sequence_action_not_next_committed_target",
      );
    }
  }
  const delegatedFundingActionIds = runnerDelegatedFundingActionIds(
    input,
    domain,
    candidates,
    input.playerView.stateVersion,
  );
  const boundStrategicExchangeFundingActionIds =
    runnerBoundStrategicExchangeFundingActionIds(domain);
  const coverageOwnedActionIds = runnerCoverageOwnedActionIds(
    input,
    candidates,
    domain.coverageGaps,
  );
  const terminalWinOwnedActionIds = new Set(
    (domain.terminalWins ?? []).flatMap((signal) => signal.actionIds ?? []),
  );
  const coverageInstallDeferrals = runnerCoverageInstallDeferrals(
    input,
    candidates,
    domain,
    dispositions,
    turnKey(input),
  );
  const { coveragePlanningContext, coverageGapsByAssignedPlanId } =
    coverageInstallDeferrals;
  for (const candidate of candidates) {
    if (
      applyRunnerCoverageCandidateDisposition(
        {
          input,
          candidate,
          domain,
          coverageOwnedActionIds,
          deferrals: coverageInstallDeferrals,
        },
        add,
      )
    )
      continue;
    const strategicExchangeExclusion = runnerStrategicExchangeHardExclusion(
      input,
      candidate,
    );
    if (strategicExchangeExclusion) {
      add(
        candidate.actionId,
        "runner.develop_board_and_hand",
        strategicExchangeExclusion,
      );
      continue;
    }
    if (runnerStrategicExchangeRequiresBoundParent(candidate)) {
      if (!boundStrategicExchangeFundingActionIds.has(candidate.actionId)) {
        add(
          candidate.actionId,
          "runner.economy",
          runnerStrategicExchangeKinds(candidate).includes("self_damage")
            ? "runner_self_damage_economy_requires_bound_parent_funding"
            : "strategic_exchange_requires_bound_parent",
        );
      }
      // Bound strategic exchanges are exclusively owned by their exact
      // parent-support route. Generic development and economy classification
      // must not create a second authority for the same action.
      continue;
    }
    if (
      runnerMatchpointReserveBlocksOverlappingBreakerInstall(
        input,
        candidate,
        coverageOwnedActionIds,
        domain.coverageGaps,
      ) &&
      !runnerCandidateIsOptionalProgramTrashInstall(input, candidate)
    ) {
      add(
        candidate.actionId,
        "runner.develop_board_and_hand",
        "runner_matchpoint_remote_reserve_blocks_overlapping_breaker_install",
      );
      continue;
    }
    if (
      candidate.semanticActionType === "turn_flow.end_turn" &&
      candidate.sourceKind === "card" &&
      !specializedEconomyActionIds.has(candidate.actionId)
    ) {
      add(
        candidate.actionId,
        "runner.resource_lifecycle",
        "runner_card_scoped_end_turn_missing_bound_lifecycle_contract",
      );
      continue;
    }
    if (
      candidate.sourceKind === "basic_action" &&
      candidate.actionType === "gain_credit" &&
      candidate.semanticActionType === "economy.gain_credit" &&
      !runnerExactBasicLiquidCreditCandidate(candidate)
    ) {
      addUnknown(
        candidate.actionId,
        "runner.economy",
        "runner_basic_credit_assessment_unknown:incomplete_exact_liquid_projection",
      );
      continue;
    }
    const cardDevelopmentAdmissions = domain.developments
      .filter((development) =>
        development.actionIds.includes(candidate.actionId),
      )
      .map((development) => ({
        development,
        admission: runnerDevelopmentCardAdmission({
          definitionId: development.definitionId,
          assignedDomainPlanIds: development.assignedDomainPlanIds,
          ...(development.purposeCode
            ? { concretePurposeCode: development.purposeCode }
            : {}),
          duplicateAlreadyInstalled: development.duplicateAlreadyInstalled,
          affordableOrSupportable: development.affordableOrSupportable,
        }),
      }));
    const cardDevelopmentOwnsActionRoute = cardDevelopmentAdmissions.some(
      ({ admission }) => admission.admitted,
    );
    const alternativeToBoundCoverageCopy = cardDevelopmentAdmissions.some(
      ({ development }) =>
        development.assignedDomainPlanIds.length > 0 &&
        development.assignedDomainPlanIds.every((planId) => {
          const gap = coverageGapsByAssignedPlanId.get(planId);
          return (
            gap?.answerInHand === true &&
            !gap.installActionIds?.includes(candidate.actionId) &&
            gap.installActionIds?.some((actionId) => {
              const bound = candidates.find(
                (entry) => entry.actionId === actionId,
              );
              return (
                bound?.semanticActionType === "install.card" &&
                bound.sourceCardInstanceId !== candidate.sourceCardInstanceId &&
                runnerCandidateSourceDefinitionId(input, bound) ===
                  development.definitionId
              );
            }) === true
          );
        }),
    );
    if (
      candidate.semanticActionType === "install.card" &&
      alternativeToBoundCoverageCopy &&
      !cardDevelopmentOwnsActionRoute &&
      !coverageOwnedActionIds.has(candidate.actionId) &&
      !delegatedFundingActionIds.has(candidate.actionId) &&
      !terminalWinOwnedActionIds.has(candidate.actionId) &&
      !runnerCandidateIsOptionalProgramTrashInstall(input, candidate)
    ) {
      // The coverage owner has already bound a concrete interchangeable copy.
      // The other copy remains a deferred contribution to that same need, not
      // a second generic development plan or an unclassified legal install.
      add(
        candidate.actionId,
        "runner.rig_and_coverage",
        "runner_coverage_install_alternative_to_bound_same_definition_answer",
      );
      continue;
    }
    const unconcreteDevelopment = cardDevelopmentAdmissions.find(
      ({ admission }) => admission.reasonCode === "no_concrete_plan_purpose",
    );
    if (
      unconcreteDevelopment &&
      !cardDevelopmentOwnsActionRoute &&
      !delegatedFundingActionIds.has(candidate.actionId) &&
      !coverageOwnedActionIds.has(candidate.actionId) &&
      !terminalWinOwnedActionIds.has(candidate.actionId) &&
      !runnerCandidateIsOptionalProgramTrashInstall(input, candidate)
    ) {
      add(
        candidate.actionId,
        "runner.develop_board_and_hand",
        "runner_card_development_rejected_no_concrete_plan_purpose",
      );
      continue;
    }
    if (
      !delegatedFundingActionIds.has(candidate.actionId) &&
      !coverageOwnedActionIds.has(candidate.actionId) &&
      !cardDevelopmentOwnsActionRoute &&
      runnerImmediateGeneralLiquidEconomyRoute(candidate) &&
      !specializedEconomyActionIds.has(candidate.actionId)
    ) {
      add(
        candidate.actionId,
        "runner.economy",
        "runner_immediate_credit_route_has_no_bound_funding_need",
      );
    }
  }
  if (input.playerView.own.gripOrHq.length > input.playerView.own.maxHandSize) {
    for (const candidate of candidates) {
      if (
        candidate.actionType === "draw_card" &&
        candidate.semanticActionType === "draw.card" &&
        candidate.sourceKind === "basic_action" &&
        !runnerDrawActionHasCurrentPlanPurpose(candidate, domain)
      ) {
        add(
          candidate.actionId,
          "runner.develop_board_and_hand",
          "runner_option_development_draw_bound_reached",
        );
      }
    }
  }
  for (const candidate of candidates) {
    const coverageDrawGaps =
      candidate.semanticActionType === "draw.card"
        ? domain.coverageGaps.filter(
            (gap) =>
              !gap.answerInHand &&
              gap.deckHasAnswer &&
              gap.drawForAnswerActionIds.includes(candidate.actionId),
          )
        : [];
    if (
      coverageDrawGaps.length > 0 &&
      coverageDrawGaps.every(
        (gap) =>
          runnerCoverageCurrentPhase({
            context: coveragePlanningContext,
            gap,
            rolesForDefinitionId: rolesForDeckDoctrineCard,
          }) !== "draw_for_answer",
      ) &&
      !runnerDrawActionHasCurrentNonCoveragePlanPurpose(candidate, domain) &&
      !dispositions.some(
        (disposition) => disposition.actionId === candidate.actionId,
      )
    ) {
      add(
        candidate.actionId,
        "runner.rig_and_coverage",
        "runner_coverage_draw_deferred_for_current_preparation_phase",
      );
      continue;
    }
    if (
      candidate.semanticActionType === "tag.remove" &&
      domain.defense.activeTags <= 0 &&
      !coverageOwnedActionIds.has(candidate.actionId)
    ) {
      add(
        candidate.actionId,
        "runner.defense_and_recovery",
        "runner_tag_removal_has_no_active_tags",
      );
      continue;
    }
    if (
      candidate.semanticActionType === "draw.card" &&
      !runnerDrawActionHasCurrentPlanPurpose(candidate, domain) &&
      !dispositions.some(
        (disposition) => disposition.actionId === candidate.actionId,
      )
    ) {
      add(
        candidate.actionId,
        "runner.develop_board_and_hand",
        "runner_optional_draw_has_no_current_plan_purpose",
      );
    }
  }
  const optionalProgramTrashInstallDispositionActionIds = new Set<string>();
  for (const candidate of candidates) {
    if (candidate.semanticActionType !== "install.card") {
      continue;
    }
    const legalAction = input.legalActions.find(
      (action) => action.actionId === candidate.actionId,
    );
    const optionalProgramTrashInstall =
      runnerCandidateIsOptionalProgramTrashInstall(input, candidate);
    if (
      optionalProgramTrashInstall &&
      dispositions.some((entry) => entry.actionId === candidate.actionId)
    ) {
      continue;
    }
    const sacrificeAssessment =
      optionalProgramTrashInstall && legalAction
        ? runnerProgramInstallTrashAssessmentForAction(input, legalAction)
        : undefined;
    if (
      sacrificeAssessment?.memoryRequired === true &&
      !sacrificeAssessment.canFreeRequiredMemory
    ) {
      optionalProgramTrashInstallDispositionActionIds.add(candidate.actionId);
      add(
        candidate.actionId,
        "runner.develop_board_and_hand",
        "runner_program_trash_install_has_no_acceptable_sacrifice",
      );
      continue;
    }
    if (specializedEconomyActionIds.has(candidate.actionId)) {
      continue;
    }
    const sourceCardInstanceId = runnerInstallSourceInstanceId(
      candidate,
      legalAction,
    );
    if (!sourceCardInstanceId) continue;
    if (!optionalProgramTrashInstall) continue;
    const sourceDefinitionId = runnerCandidateSourceDefinitionId(
      input,
      candidate,
    );
    const duplicateDefinitionAlreadyInstalled =
      runnerOptionalProgramTrashInstallDuplicatesInstalledDefinition(
        input,
        candidate,
      );
    if (duplicateDefinitionAlreadyInstalled) {
      optionalProgramTrashInstallDispositionActionIds.add(candidate.actionId);
      add(
        candidate.actionId,
        "runner.develop_board_and_hand",
        `runner_program_trash_install_rejected_duplicate_definition:${sourceDefinitionId}`,
      );
      continue;
    }
    const directInstallAvailable =
      candidates.some(
        (alternative) =>
          alternative.actionId !== candidate.actionId &&
          alternative.semanticActionType === "install.card" &&
          runnerInstallSourceInstanceId(
            alternative,
            input.legalActions.find(
              (action) => action.actionId === alternative.actionId,
            ),
          ) === sourceCardInstanceId &&
          !alternative.actionId.endsWith(
            ".runner_program_trash_before_install",
          ),
      ) ||
      handDevelopment.some(
        (evaluation) =>
          evaluation.cardInstanceId === sourceCardInstanceId &&
          evaluation.legalActionId !== undefined &&
          !evaluation.legalActionId.endsWith(
            ".runner_program_trash_before_install",
          ),
      );
    if (!directInstallAvailable) continue;
    optionalProgramTrashInstallDispositionActionIds.add(candidate.actionId);
    add(
      candidate.actionId,
      "runner.develop_board_and_hand",
      "runner_program_trash_install_unneeded_direct_install_available",
    );
  }
  for (const disposition of runnerCreditBankActionDispositions(
    domain.creditBanks,
    [
      ...(domain.recurringEconomy ?? []),
      ...(domain.resourceLifecycle ?? []),
    ].flatMap((signal) => signal.actionIds),
  )) {
    addDisposition(disposition);
  }
  for (const disposition of runnerResourceLifecycleActionDispositions(
    domain.resourceLifecycle ?? [],
  )) {
    addDisposition(disposition);
  }
  for (const disposition of runnerShellTradersActionDispositions(
    domain.shellTradersPipelines ?? [],
  )) {
    addDisposition(disposition);
  }
  if (domain.defense.forgoUnsafeRunCapacity) {
    for (const candidate of candidates) {
      if (candidate.semanticActionType !== "run.start") continue;
      if (
        domain.runWindows.some(
          (signal) =>
            signal.actionAssessments?.[
              candidate.actionId
            ]?.evidenceCodes.includes(
              "runner_engine_restricted_run_sequence_continuation",
            ) === true,
        )
      ) {
        continue;
      }
      add(
        candidate.actionId,
        "runner.defense_and_recovery",
        "runner_restricted_run_capacity_below_required_hand_buffer",
      );
    }
  }
  for (const actionId of domain.defense.confirmedDamageTaxedDrawActionIds ??
    []) {
    if (dispositions.some((entry) => entry.actionId === actionId)) continue;
    add(
      actionId,
      "runner.defense_and_recovery",
      "runner_confirmed_damage_draw_tax_tag_unsafe",
    );
  }
  if (
    domain.defense.activeTags > 0 &&
    (domain.defense.tagClearFundingNeed !== undefined ||
      candidates.some(
        (candidate) => candidate.semanticActionType === "tag.remove",
      ))
  ) {
    for (const candidate of candidates) {
      if (
        candidate.semanticActionType !== "counter.remove_trace_tag" &&
        candidate.semanticActionType !== "counter.remove_runner_hazard"
      ) {
        continue;
      }
      add(
        candidate.actionId,
        "runner.defense_and_recovery",
        "runner_persistent_hazard_counter_deferred_until_active_tag_removed",
      );
    }
  }
  for (const candidate of candidates) {
    if (
      candidate.actionCapacityProjection?.kind ===
        "immediate_restricted_gain" &&
      candidate.actionCapacityProjection.followupActionCapacity > 0 &&
      !restrictedActionCapacityHasProductiveFollowup(
        candidate,
        candidates,
        handDevelopment,
        runTargets,
        domain.developments,
      )
    ) {
      add(
        candidate.actionId,
        "runner.develop_board_and_hand",
        "runner_restricted_action_capacity_has_no_productive_followup",
      );
    }
    if (
      !domain.defense.forgoUnsafeRunCapacity &&
      candidate.semanticActionType === "run.start" &&
      candidate.runProjectionSummary?.serverId === "archives" &&
      archivesIsKnownWithoutAgenda(input) &&
      !domain.runWindows.some(
        (signal) =>
          signal.actionAssessments?.[candidate.actionId]?.admissible === true,
      )
    ) {
      add(
        candidate.actionId,
        "runner.pressure_central",
        "runner_archives_visible_state_has_no_agenda_payoff",
      );
    }
  }
  const coverageRejectedActionIds = new Set(
    domain.coverageGaps.flatMap((gap) => gap.rejectedSearchActionIds ?? []),
  );
  const developmentOwnedActionIds = new Set(
    domain.developments.flatMap((signal) => signal.actionIds),
  );
  const installedRecoveryOwnedActionIds = new Set(
    domain.developments
      .filter((signal) => signal.developmentId.startsWith("recovery:"))
      .flatMap((signal) => signal.actionIds),
  );
  const defenseHandBufferActionIds = new Set(
    domain.defense.handBufferActionIds ?? [],
  );
  for (const disposition of runnerDefenseSupportDispositions(
    domain.defense,
    candidates,
    optionalProgramTrashInstallDispositionActionIds,
  )) {
    addDisposition(disposition);
  }
  addRunnerCoverageRejectedSearchDispositions(
    domain,
    coverageOwnedActionIds,
    developmentOwnedActionIds,
    add,
  );
  const centralPreparationActionIds = new Set(
    domain.centralPressure.flatMap((signal) => [
      ...(signal.preparationActionIds ?? []),
      ...(signal.rejectedPreparationActionIds ?? []),
    ]),
  );
  const remotePreparationActionIds = new Set(
    domain.remoteContests.flatMap(
      (signal) => signal.preparationActionIds ?? [],
    ),
  );
  for (const candidate of candidates) {
    if (
      (!runnerActionRequiresTargetedBypassPlan(candidate) &&
        !runnerActionRequiresTargetedIceTrashPlan(candidate)) ||
      centralPreparationActionIds.has(candidate.actionId) ||
      remotePreparationActionIds.has(candidate.actionId) ||
      dispositions.some(
        (disposition) => disposition.actionId === candidate.actionId,
      )
    ) {
      continue;
    }
    add(
      candidate.actionId,
      "runner.pressure_central",
      runnerActionRequiresTargetedIceTrashPlan(candidate)
        ? "runner_no_bound_targeted_ice_trash_route"
        : "runner_no_bound_targeted_bypass_route",
    );
  }
  const activeCentralRunActionIds = new Set(
    domain.centralPressure
      .filter((signal) => signal.reachable && signal.marginalValue > 0)
      .flatMap((signal) =>
        (signal.runActionIds ?? []).filter(
          (actionId) =>
            (signal.runActionExclusions?.[actionId]?.length ?? 0) === 0,
        ),
      ),
  );
  for (const candidate of candidates) {
    if (
      candidate.semanticActionType !== "run.start" ||
      activeCentralRunActionIds.has(candidate.actionId) ||
      admissibleRunWindowActionIds.has(candidate.actionId) ||
      dispositions.some(
        (disposition) => disposition.actionId === candidate.actionId,
      )
    ) {
      continue;
    }
    const serverId = candidate.runProjectionSummary?.serverId;
    if (serverId !== "hq" && serverId !== "rd" && serverId !== "archives") {
      continue;
    }
    const evaluation = runTargets
      .filter(
        (entry) =>
          entry.actionId === candidate.actionId &&
          entry.targetServerId === serverId,
      )
      .sort(
        (left, right) =>
          right.score - left.score ||
          left.targetServerId.localeCompare(right.targetServerId),
      )[0];
    const pressureSignal = domain.centralPressure.find(
      (signal) => signal.serverId === serverId,
    );
    const exclusion = pressureSignal?.runActionExclusions?.[
      candidate.actionId
    ]?.find((evidenceCode) => evidenceCode.startsWith("recommendation:"));
    add(
      candidate.actionId,
      "runner.pressure_central",
      evaluation
        ? `runner_central_run_not_active_pressure_route:${serverId}:${evaluation.pathPassability}:${evaluation.recommendation}:${exclusion ?? "no_executable_route"}`
        : `runner_central_run_missing_exact_target_projection:${serverId}`,
    );
  }
  for (const action of input.legalActions) {
    if (
      action.type !== "trigger_ability" ||
      (action.payload?.abilityId ?? action.payload?.runnerAbility) !==
        "decline_successful_run_extra_run"
    ) {
      continue;
    }
    add(
      action.actionId,
      "runner.pressure_central",
      "runner_successful_run_extra_run_declined_by_central_pressure",
    );
  }
  for (const disposition of runnerRecurringEconomyActionDispositions(
    domain.recurringEconomy ?? [],
    candidates,
    new Set([
      ...coverageOwnedActionIds,
      ...dispositions.map((entry) => entry.actionId),
    ]),
  )) {
    addDisposition(disposition);
  }
  for (const candidate of candidates) {
    if (
      dispositions.some(
        (disposition) => disposition.actionId === candidate.actionId,
      )
    ) {
      continue;
    }
    const sourceDefinitionId = runnerCandidateSourceDefinitionId(
      input,
      candidate,
    );
    if (runnerCandidateStartsBoundCentralRun(candidate)) {
      const evaluations = runTargets
        .filter((evaluation) => evaluation.actionId === candidate.actionId)
        .sort(
          (left, right) =>
            right.score - left.score ||
            left.targetServerId.localeCompare(right.targetServerId),
        );
      const bestEvaluation = evaluations[0];
      if (!activeCentralRunActionIds.has(candidate.actionId)) {
        add(
          candidate.actionId,
          "runner.pressure_central",
          bestEvaluation
            ? `runner_bound_central_run_not_active_pressure_route:${bestEvaluation.targetServerId}:${bestEvaluation.pathPassability}:${bestEvaluation.recommendation}`
            : "runner_bound_central_run_missing_exact_target_projection",
        );
        continue;
      }
    }
    if (runnerCandidateExecutesProgramSearch(input, candidate)) {
      if (
        coverageOwnedActionIds.has(candidate.actionId) ||
        developmentOwnedActionIds.has(candidate.actionId) ||
        coverageRejectedActionIds.has(candidate.actionId)
      ) {
        continue;
      }
      const searchAnswerAlreadyInHand =
        domain.coverageGaps.some((gap) => gap.answerInHand) ||
        (runnerProgramSearchRecentlyResolved(input) &&
          input.playerView.own.gripOrHq.some(
            (card) => card.known && card.type === "program",
          ));
      if (searchAnswerAlreadyInHand) {
        add(
          candidate.actionId,
          "runner.rig_and_coverage",
          `runner_program_search_rejected_visible_answer_already_in_hand:${sourceDefinitionId ?? "unknown"}`,
        );
        continue;
      }
      if (
        input.playerView.own.gripOrHq.length >= input.playerView.own.maxHandSize
      ) {
        add(
          candidate.actionId,
          "runner.develop_board_and_hand",
          `runner_program_search_rejected_no_hand_capacity:${sourceDefinitionId ?? "unknown"}`,
        );
        continue;
      }
      add(
        candidate.actionId,
        "runner.develop_board_and_hand",
        `runner_program_search_has_no_bound_useful_target:${sourceDefinitionId ?? "unknown"}`,
      );
      continue;
    }
    if (
      runnerCandidateIsExposeAbility(input, candidate) &&
      !remotePreparationActionIds.has(candidate.actionId)
    ) {
      add(
        candidate.actionId,
        "runner.contest_remote",
        `runner_expose_ability_has_no_bound_hidden_remote_target:${candidate.sourceDefinitionId ?? "unknown"}`,
      );
      continue;
    }
    const centralInformationServer =
      runnerCandidateIsCentralInformationAbility(candidate);
    if (
      centralInformationServer &&
      !centralPreparationActionIds.has(candidate.actionId) &&
      !activeCentralRunActionIds.has(candidate.actionId)
    ) {
      add(
        candidate.actionId,
        "runner.pressure_central",
        `runner_${centralInformationServer}_information_ability_has_no_bound_pre_run_step:${candidate.sourceDefinitionId ?? "unknown"}`,
      );
      continue;
    }
    const sameTurnAccessDefinitionId =
      runnerSameTurnAccessPreparationSourceDefinitionId(input, candidate);
    if (
      sameTurnAccessDefinitionId &&
      !centralPreparationActionIds.has(candidate.actionId) &&
      !remotePreparationActionIds.has(candidate.actionId) &&
      (runTargets.length > 0 ||
        domain.coverageGaps.length > 0 ||
        domain.defense.forgoUnsafeRunCapacity)
    ) {
      const strongestRejectedTarget = [...runTargets].sort(
        (left, right) => right.score - left.score,
      )[0];
      add(
        candidate.actionId,
        "runner.develop_board_and_hand",
        [
          "runner_same_turn_access_preparation_rejected_without_convertible_access",
          sameTurnAccessDefinitionId,
          strongestRejectedTarget
            ? `${strongestRejectedTarget.targetServerId}:${strongestRejectedTarget.pathPassability}:${strongestRejectedTarget.recommendation}`
            : (domain.coverageGaps[0]?.gapId ??
              "runner_safety_capacity_reserved"),
        ].join(":"),
      );
      continue;
    }
  }
  const unboundOneShotSearchActionIds = new Set(
    candidates
      .filter(
        (candidate) =>
          runnerCandidateIsOneShotSearch(candidate) &&
          !coverageOwnedActionIds.has(candidate.actionId) &&
          !developmentOwnedActionIds.has(candidate.actionId) &&
          !dispositions.some((entry) => entry.actionId === candidate.actionId),
      )
      .map((candidate) => candidate.actionId),
  );
  const specializedPlanOwnedActionIds = new Set([
    ...boundStrategicExchangeFundingActionIds,
    ...domain.creditBanks.flatMap((signal) => [
      ...signal.actionIds,
      ...(signal.rejectedActionIds ?? []),
    ]),
    ...(domain.recurringEconomy ?? []).flatMap((signal) => signal.actionIds),
    ...(domain.resourceLifecycle ?? []).flatMap((signal) => [
      ...signal.actionIds,
      ...(signal.rejectedActionIds ?? []),
    ]),
    ...(domain.installedAgendaScores ?? []).flatMap(
      (signal) => signal.actionIds,
    ),
    ...(domain.terminalWins ?? []).flatMap((signal) => signal.actionIds ?? []),
    ...coverageRejectedActionIds,
    ...unboundOneShotSearchActionIds,
    ...optionalProgramTrashInstallDispositionActionIds,
    ...(domain.defense.defenseSupportInstallActionIds ?? []),
    ...(domain.defense.defenseSupportRejectedInstallActionIds ?? []),
    ...(domain.exposeInformation ?? []).flatMap((signal) => [
      ...(signal.actionIds ?? [signal.selectedActionId]),
      ...signal.rejectedActionIds,
    ]),
  ]);
  for (const action of input.legalActions) {
    if (
      action.type !== "install_card" ||
      centralPreparationActionIds.has(action.actionId) ||
      developmentOwnedActionIds.has(action.actionId) ||
      coverageOwnedActionIds.has(action.actionId) ||
      specializedPlanOwnedActionIds.has(action.actionId) ||
      dispositions.some((entry) => entry.actionId === action.actionId)
    ) {
      continue;
    }
    const candidate = candidates.find(
      (entry) => entry.actionId === action.actionId,
    );
    const sourceDefinitionId = candidate
      ? runnerCandidateSourceDefinitionId(input, candidate)
      : undefined;
    const serverId =
      (candidate ? runnerCentralPayoffServer(candidate) : undefined) ??
      (sourceDefinitionId
        ? runnerCentralPayoffServerForDefinition(sourceDefinitionId)
        : undefined);
    if (!serverId) {
      add(
        action.actionId,
        "runner.develop_board_and_hand",
        "runner_install_has_no_bound_development_or_specialized_plan",
      );
      continue;
    }
    const targetEvaluations = runTargets.filter(
      (target) =>
        target.targetServerId === serverId ||
        target.accessServerId === serverId,
    );
    const currentAccessRoute = targetEvaluations.some(
      (target) =>
        target.pathPassability === "reachable" &&
        target.score > 0 &&
        (target.recommendation === "run_now" ||
          target.recommendation === "run_if_free"),
    );
    const boundCoverageContinuation = domain.coverageGaps.some(
      (gap) =>
        (gap.targetServerId === undefined || gap.targetServerId === serverId) &&
        (gap.answerInHand || (gap.directSearchActionIds?.length ?? 0) > 0),
    );
    add(
      action.actionId,
      "runner.pressure_central",
      currentAccessRoute
        ? `runner_access_payoff_install_not_admitted_to_current_central_campaign:${serverId}`
        : boundCoverageContinuation
          ? `runner_access_payoff_install_waits_for_coverage_bound_central_campaign:${serverId}`
          : `runner_access_payoff_install_waits_for_bound_access_route:${serverId}`,
    );
  }
  for (const signal of domain.centralPressure) {
    for (const actionId of signal.rejectedPreparationActionIds ?? []) {
      if (
        !candidates.some((candidate) => candidate.actionId === actionId) ||
        specializedPlanOwnedActionIds.has(actionId) ||
        dispositions.some((entry) => entry.actionId === actionId)
      ) {
        continue;
      }
      add(
        actionId,
        "runner.pressure_central",
        `runner_access_payoff_campaign_copy_not_selected:${signal.serverId}`,
      );
    }
  }
  for (const evaluation of handDevelopment) {
    if (!evaluation.legalActionId) continue;
    // Run events are owned by the exact central/remote run route. Hand
    // development may describe their availability, but must not create a
    // second disposition authority for the same server-bound LegalAction.
    if (evaluation.developmentRole === "run_event") continue;
    const accessPayoffCandidate = candidates.find(
      (candidate) => candidate.actionId === evaluation.legalActionId,
    );
    if (
      dispositions.some((entry) => entry.actionId === evaluation.legalActionId)
    ) {
      continue;
    }
    if (
      accessPayoffCandidate !== undefined &&
      !centralPreparationActionIds.has(accessPayoffCandidate.actionId) &&
      runnerAccessPayoffDevelopmentLacksBoundAccessRoute(
        evaluation,
        accessPayoffCandidate,
        runTargets,
        domain.coverageGaps,
      )
    ) {
      const sourceCardInstanceId = runnerInstallSourceInstanceId(
        accessPayoffCandidate,
        input.legalActions.find(
          (action) => action.actionId === accessPayoffCandidate.actionId,
        ),
      );
      const actionIds = candidates
        .filter((candidate) => {
          if (
            sourceCardInstanceId === undefined ||
            candidate.actionType !== accessPayoffCandidate.actionType ||
            candidate.semanticActionType !==
              accessPayoffCandidate.semanticActionType
          ) {
            return false;
          }
          return (
            runnerInstallSourceInstanceId(
              candidate,
              input.legalActions.find(
                (action) => action.actionId === candidate.actionId,
              ),
            ) === sourceCardInstanceId
          );
        })
        .map((candidate) => candidate.actionId);
      if (!actionIds.includes(accessPayoffCandidate.actionId)) {
        actionIds.push(accessPayoffCandidate.actionId);
      }
      for (const actionId of actionIds) {
        if (
          centralPreparationActionIds.has(actionId) ||
          coverageOwnedActionIds.has(actionId) ||
          developmentOwnedActionIds.has(actionId) ||
          specializedPlanOwnedActionIds.has(actionId) ||
          dispositions.some((entry) => entry.actionId === actionId)
        ) {
          continue;
        }
        add(
          actionId,
          "runner.pressure_central",
          `runner_access_payoff_install_waits_for_bound_access_route:${runnerCentralPayoffServer(accessPayoffCandidate) ?? (evaluation.definitionId ? runnerCentralPayoffServerForDefinition(evaluation.definitionId) : undefined) ?? "unknown"}`,
        );
      }
      continue;
    }
    if (centralPreparationActionIds.has(evaluation.legalActionId)) continue;
    if (!runnerHandDevelopmentExplicitlyRejected(evaluation)) continue;
    if (coverageOwnedActionIds.has(evaluation.legalActionId)) {
      continue;
    }
    if (
      dispositions.some((entry) => entry.actionId === evaluation.legalActionId)
    ) {
      continue;
    }
    const evidenceCode = `runner_hand_development_rejected:${evaluation.deferReason}:${evaluation.cardInstanceId}`;
    const evaluatedCandidate = candidates.find(
      (candidate) => candidate.actionId === evaluation.legalActionId,
    );
    const actionIds = candidates
      .filter(
        (candidate) =>
          evaluatedCandidate !== undefined &&
          runnerHandDevelopmentRejectionForCandidate(input, candidate, [
            evaluation,
          ]) === evaluation &&
          candidate.actionType === evaluatedCandidate.actionType &&
          candidate.semanticActionType ===
            evaluatedCandidate.semanticActionType,
      )
      .map((candidate) => candidate.actionId);
    if (!actionIds.includes(evaluation.legalActionId)) {
      actionIds.push(evaluation.legalActionId);
    }
    for (const actionId of actionIds) {
      if (
        specializedPlanOwnedActionIds.has(actionId) ||
        coverageOwnedActionIds.has(actionId) ||
        defenseHandBufferActionIds.has(actionId) ||
        dispositions.some((entry) => entry.actionId === actionId)
      )
        continue;
      add(actionId, "runner.develop_board_and_hand", evidenceCode);
    }
  }
  for (const candidate of candidates) {
    const structuredTopHeapRecovery =
      (candidate.actionType === "activated_card_ability" ||
        candidate.actionType === "trigger_ability") &&
      runnerEffectsProvideTopTrashRecovery(candidate.functionalEffects);
    if (
      structuredTopHeapRecovery &&
      !dispositions.some((entry) => entry.actionId === candidate.actionId) &&
      !defenseHandBufferActionIds.has(candidate.actionId) &&
      !coverageOwnedActionIds.has(candidate.actionId) &&
      !installedRecoveryOwnedActionIds.has(candidate.actionId)
    ) {
      add(
        candidate.actionId,
        "runner.defense_and_recovery",
        "runner_top_heap_recovery_has_no_active_hand_or_coverage_need",
      );
    }
  }
  for (const action of input.legalActions) {
    const runLockRelease =
      action.type === "trigger_ability" &&
      (action.payload?.abilityId === "pay_to_remove_run_lock" ||
        action.payload?.v1920RunnerRunLockAbility === "pay_to_remove_run_lock");
    if (!runLockRelease) continue;
    const boundRoute = runnerRunLockReleaseBoundRouteDisposition(
      domain,
      action.actionId,
    );
    if (boundRoute.executable) continue;
    add(action.actionId, boundRoute.ownerModuleId, boundRoute.evidenceCode);
  }
  for (const actionId of unboundOneShotSearchActionIds) {
    add(
      actionId,
      "runner.develop_board_and_hand",
      "runner_one_shot_search_has_no_bound_target_plan",
    );
  }
  for (const signal of domain.centralPressure) {
    if (signal.reachable && signal.marginalValue > 0) continue;
    for (const actionId of Object.keys(signal.runActionExclusions ?? {})) {
      if (!candidates.some((candidate) => candidate.actionId === actionId)) {
        continue;
      }
      if (
        domain.defense.forgoUnsafeRunCapacity ||
        admissibleRunWindowActionIds.has(actionId) ||
        dispositions.some((entry) => entry.actionId === actionId)
      ) {
        continue;
      }
      add(actionId, "runner.pressure_central", signal.evidenceCode);
    }
  }
  for (const evaluation of runTargets) {
    if (
      evaluation.targetKind !== "remote" ||
      domain.defense.forgoUnsafeRunCapacity ||
      dispositions.some((entry) => entry.actionId === evaluation.actionId) ||
      admissibleRunWindowActionIds.has(evaluation.actionId)
    ) {
      continue;
    }
    if (
      runnerRemoteHasKnownIceScheduledForRunnerTurnEndTrash(
        input,
        evaluation.targetServerId,
      )
    ) {
      add(
        evaluation.actionId,
        "runner.contest_remote",
        `runner_remote_direct_run_waits_for_scheduled_ice_trash:${evaluation.targetServerId}`,
      );
      continue;
    }
    if (
      visibleKnownAgendaOnServer(input, evaluation.targetServerId) &&
      !runnerKnownAgendaRunEvaluationIsCertified(
        input,
        candidates,
        evaluation,
        evaluation.targetServerId,
      )
    ) {
      add(
        evaluation.actionId,
        "runner.contest_remote",
        `runner_remote_known_agenda_route_not_certified:${evaluation.targetServerId}:${evaluation.routeQuote?.reachability ?? "unknown"}:funding_gap_${evaluation.routeQuote?.fundingGap ?? "unknown"}:unknown_ice_${evaluation.routeQuote?.unknownIceCount ?? "unknown"}`,
      );
      continue;
    }
    const exactAssessment = domain.remoteContests
      .filter((signal) => signal.serverId === evaluation.targetServerId)
      .map((signal) => signal.runActionAssessments[evaluation.actionId])
      .find((assessment) => assessment !== undefined);
    if (exactAssessment?.verdict === "executable") continue;
    if (exactAssessment?.verdict === "explicitly_nonproductive") {
      add(
        evaluation.actionId,
        "runner.contest_remote",
        exactAssessment.evidenceCodes[0] ??
          "runner_remote_run_explicitly_nonproductive",
      );
      continue;
    }
    const repeatedTerminalDamageContest =
      runnerTerminalNonlethalDamageContestAlreadyFailedThisTurn(
        input,
        evaluation,
      );
    const evidenceCode =
      evaluation.knownAccessState === "known_no_current_payoff"
        ? `runner_remote_run_known_no_current_payoff:${evaluation.targetServerId}:${evaluation.recommendation}`
        : repeatedTerminalDamageContest
          ? `runner_terminal_remote_contest_repeat_blocked_after_failed_path:${evaluation.targetServerId}`
          : evaluation.pathPassability !== "reachable"
            ? `runner_remote_run_route_blocked:${evaluation.targetServerId}:${evaluation.pathPassability}`
            : evaluation.score <= 0
              ? `runner_remote_run_below_material_value:${evaluation.targetServerId}:${evaluation.score}:${evaluation.recommendation}`
              : undefined;
    if (!evidenceCode) continue;
    add(evaluation.actionId, "runner.contest_remote", evidenceCode);
  }
  for (const evaluation of runTargets) {
    if (
      domain.defense.forgoUnsafeRunCapacity ||
      dispositions.some((entry) => entry.actionId === evaluation.actionId) ||
      admissibleRunWindowActionIds.has(evaluation.actionId)
    ) {
      continue;
    }
    if (
      evaluation.targetServerId === "hq" ||
      evaluation.targetServerId === "rd" ||
      evaluation.targetServerId === "archives"
    ) {
      const matchingSignals = domain.centralPressure.filter(
        (signal) => signal.serverId === evaluation.targetServerId,
      );
      const executableRoute = matchingSignals.some(
        (signal) =>
          signal.routePreparation === undefined &&
          signal.reachable &&
          signal.marginalValue > 0 &&
          signal.runActionIds?.includes(evaluation.actionId) === true,
      );
      if (executableRoute) continue;
      const boundSignal = matchingSignals.find(
        (signal) =>
          signal.runActionIds?.includes(evaluation.actionId) === true ||
          signal.runActionExclusions?.[evaluation.actionId] !== undefined ||
          (signal.preparationActionIds?.length ?? 0) > 0,
      );
      if (!boundSignal) {
        const exactDirectRunDisposition =
          runnerUnboundCentralDirectRunDispositionEvidence(
            input,
            candidates,
            evaluation,
          );
        if (exactDirectRunDisposition) {
          add(
            evaluation.actionId,
            "runner.pressure_central",
            exactDirectRunDisposition,
          );
        }
        continue;
      }
      add(
        evaluation.actionId,
        "runner.pressure_central",
        boundSignal.runActionExclusions?.[evaluation.actionId]?.[0] ??
          ((boundSignal.preparationActionIds?.length ?? 0) > 0
            ? `runner_central_run_deferred_to_bound_preparation:${evaluation.targetServerId}`
            : boundSignal.evidenceCode),
      );
      continue;
    }
  }
  for (const window of domain.runWindows) {
    for (const [actionId, assessment] of Object.entries(
      window.actionAssessments ?? {},
    )) {
      if (assessment.admissible) continue;
      // An optional restricted run can already be an exact executable Remote
      // route. The run-window's local reserve/value rejection is not a global
      // veto of that owner-certified route (for example a matchpoint contest).
      // Actual route safety remains part of the Remote action assessment.
      if (
        !input.playerView.run &&
        candidates.some(
          (candidate) =>
            candidate.actionId === actionId &&
            runnerRestrictedRunSequenceAction(input, candidate) !== undefined,
        ) &&
        domain.remoteContests.some(
          (signal) =>
            signal.runActionAssessments[actionId]?.verdict === "executable",
        )
      ) {
        continue;
      }
      add(
        actionId,
        "runner.convert_run_window",
        assessment.evidenceCodes[0] ??
          "runner_run_window_action_explicitly_excluded",
      );
    }
  }
  const optionalBonusRunDeclineActionIds = new Set(
    input.legalActions
      .filter(
        (action) =>
          action.type === "trigger_ability" &&
          action.payload?.runnerAbility === "decline_optional_bonus_run",
      )
      .map((action) => action.actionId),
  );
  const runWindowActionIds = new Set(
    domain.runWindows.flatMap((window) =>
      Object.keys(window.actionAssessments ?? {}),
    ),
  );
  const exactProductiveActionIds = new Set([
    ...domain.fundingNeeds.flatMap((need) =>
      "routeActionIds" in need ? need.routeActionIds : need.actionIds,
    ),
    ...coverageOwnedActionIds,
    ...(domain.defense.handBufferActionIds ?? []),
    ...(domain.defense.reactionReserveNeed?.actionIds ?? []),
    ...(domain.defense.discardChoiceBinding
      ? [domain.defense.discardChoiceBinding.actionId]
      : []),
    ...domain.creditBanks.flatMap((signal) => signal.actionIds),
    ...(domain.recurringEconomy ?? []).flatMap((signal) => signal.actionIds),
    ...(domain.installedCardLiquidationChoices ?? []).map(
      (signal) => signal.actionId,
    ),
    ...(domain.installedAgendaScores ?? []).flatMap(
      (signal) => signal.actionIds,
    ),
    ...(domain.terminalWins ?? []).flatMap((signal) => signal.actionIds ?? []),
    ...(domain.resourceLifecycle ?? []).flatMap((signal) => signal.actionIds),
    ...(domain.shellTradersPipelines ?? []).flatMap(
      (signal) => signal.actionIds,
    ),
    ...domain.centralPressure.flatMap((signal) => [
      ...(signal.runActionIds ?? []),
      ...(signal.preparationActionIds ?? []),
    ]),
    ...domain.remoteContests.flatMap((signal) => [
      ...(signal.preparationActionIds ?? []),
      ...Object.entries(signal.runActionAssessments).flatMap(
        ([actionId, assessment]) =>
          assessment.verdict === "executable" ? [actionId] : [],
      ),
    ]),
    ...domain.developments.flatMap((signal) => [
      ...signal.actionIds,
      ...(signal.fundingRouteActionIds ?? []),
    ]),
    ...exposeInformationActionIds,
    ...admissibleRunWindowActionIds,
  ]);
  for (const candidate of candidates) {
    const action = input.legalActions.find(
      (entry) => entry.actionId === candidate.actionId,
    );
    if (
      exactProductiveActionIds.has(candidate.actionId) ||
      dispositions.some((entry) => entry.actionId === candidate.actionId) ||
      candidate.sourceKind !== "card" ||
      candidate.sourceCardInstanceId === undefined ||
      action?.side !== "runner" ||
      (action.type !== "activated_card_ability" &&
        action.type !== "trigger_ability") ||
      action.source !== candidate.sourceCardInstanceId ||
      action.expiresAtStateVersion !== input.playerView.stateVersion ||
      action.payload?.cardId !== candidate.sourceCardInstanceId ||
      action.payload?.cardImplementationCapabilityBindingKind !==
        "card_spec_capability_key" ||
      typeof action.payload?.cardImplementationAbilityKey !== "string" ||
      action.payload.cardImplementationAbilityKey !== "trash_source_action" ||
      action.payload?.cardImplementationTrashesSource !== true
    ) {
      continue;
    }
    addUnknown(
      candidate.actionId,
      "runner.resource_lifecycle",
      `runner_resource_self_trash_assessment_unknown:${action.payload.cardImplementationAbilityKey}`,
    );
  }
  return dispositions.filter(
    (entry) =>
      !optionalBonusRunDeclineActionIds.has(entry.actionId) &&
      (!runWindowActionIds.has(entry.actionId) ||
        entry.ownerModuleId === "runner.convert_run_window"),
  );
}

function runnerBoundStrategicExchangeFundingActionIds(
  domain: RunnerPlanDomain,
): Set<string> {
  return new Set(
    domain.fundingNeeds.flatMap((need) =>
      need.kind === "parent_plan_support" &&
      need.gap > 0 &&
      runnerFundingNeedHasMaterialParent(domain, need) &&
      (need.parentPlanInstanceId.startsWith("plan:runner.pressure_central:") ||
        need.parentPlanInstanceId.startsWith("plan:runner.contest_remote:"))
        ? need.routeActionIds
        : [],
    ),
  );
}

type RunnerFundingOwnershipDomain = Pick<
  RunnerPlanDomain,
  | "fundingNeeds"
  | "coverageGaps"
  | "defense"
  | "resourceLifecycle"
  | "centralPressure"
  | "remoteContests"
  | "developments"
>;

export function runnerDelegatedFundingActionIds(
  input: AiDecisionInput,
  domain: RunnerFundingOwnershipDomain,
  candidates: readonly ActionSemanticCandidate[],
  stateVersion: number,
): Set<string> {
  const actionIds = new Set<string>();
  for (const need of domain.fundingNeeds) {
    if (
      need.gap <= 0 ||
      (need.kind === "parent_plan_support" &&
        !runnerFundingNeedHasMaterialParent(domain, need))
    ) {
      continue;
    }
    for (const actionId of need.kind === "develop_liquidity"
      ? need.actionIds
      : need.routeActionIds) {
      actionIds.add(actionId);
    }
  }
  for (const gap of domain.coverageGaps) {
    if (!gap.answerInHand || (gap.fundingGap ?? 0) <= 0) continue;
    const preparationAvailable = (gap.preparationActionIds ?? []).some(
      (actionId) =>
        candidates.some((candidate) => candidate.actionId === actionId),
    );
    const installAvailable = candidates.some((candidate) => {
      if (candidate.semanticActionType !== "install.card") return false;
      if (
        gap.installActionIds !== undefined &&
        !gap.installActionIds.includes(candidate.actionId)
      ) {
        return false;
      }
      const sourceDefinitionId = runnerCandidateSourceDefinitionId(
        input,
        candidate,
      );
      return (
        sourceDefinitionId !== undefined &&
        runnerRolesCoverCoverageGap(
          rolesForDeckDoctrineCard(sourceDefinitionId),
          gap.requiredRole,
        )
      );
    });
    const sameTurnConversionNeedsFunding =
      gap.sameTurnRunConversion !== undefined;
    if (
      !sameTurnConversionNeedsFunding &&
      (preparationAvailable || installAvailable)
    ) {
      continue;
    }
    for (const actionId of gap.fundingActionIds) actionIds.add(actionId);
  }
  if (
    runnerDefenseTagClearFundingIsCurrentPhase({
      actionCandidates: candidates,
      stateVersion,
      signals: domain.defense,
    })
  ) {
    for (const actionId of domain.defense.tagClearFundingNeed?.actionIds ??
      []) {
      actionIds.add(actionId);
    }
  }
  if (
    runnerDefenseReactionReserveIsCurrentPhase({
      actionCandidates: candidates,
      stateVersion,
      signals: domain.defense,
    })
  ) {
    for (const actionId of domain.defense.reactionReserveNeed?.actionIds ??
      []) {
      actionIds.add(actionId);
    }
  }
  return actionIds;
}

function runnerFundingNeedHasMaterialParent(
  domain: Pick<
    RunnerPlanDomain,
    "resourceLifecycle" | "centralPressure" | "remoteContests" | "developments"
  >,
  need: Extract<RunnerFundingNeedSignal, { kind: "parent_plan_support" }>,
): boolean {
  if (need.driver.kind === "development") {
    return domain.developments.some(
      (signal) =>
        signal.developmentId === need.driver.targetId &&
        signal.supportNeedId === need.needId &&
        signal.value > 0,
    );
  }
  if (need.driver.kind === "resource_lifecycle") {
    return (domain.resourceLifecycle ?? []).some(
      (signal) =>
        signal.sourceCardInstanceId === need.driver.targetId &&
        signal.supportNeedId === need.needId &&
        (signal.marginalValue ?? 0) > 0,
    );
  }
  return [...domain.centralPressure, ...domain.remoteContests].some(
    (signal) =>
      signal.supportNeedId === need.needId && signal.marginalValue > 0,
  );
}

function runnerDrawActionHasCurrentPlanPurpose(
  candidate: ActionSemanticCandidate,
  domain: RunnerPlanDomain,
): boolean {
  if (candidate.semanticActionType !== "draw.card") return false;
  return (
    runnerDrawActionHasCurrentCoveragePurpose(candidate, domain) ||
    runnerDrawActionHasCurrentNonCoveragePlanPurpose(candidate, domain)
  );
}

function runnerDrawActionHasCurrentNonCoveragePlanPurpose(
  candidate: ActionSemanticCandidate,
  domain: RunnerPlanDomain,
): boolean {
  if (candidate.semanticActionType !== "draw.card") return false;
  return (
    (domain.defense.handSize < domain.defense.minimumHandBuffer &&
      domain.defense.handBufferActionIds?.includes(candidate.actionId) ===
        true) ||
    domain.developments.some((signal) =>
      signal.actionIds.includes(candidate.actionId),
    ) ||
    (domain.recurringEconomy ?? []).some(
      (signal) =>
        signal.phase === "hold" &&
        signal.actionIds.includes(candidate.actionId),
    ) ||
    domain.centralPressure.some((signal) =>
      signal.preparationActionIds?.includes(candidate.actionId),
    ) ||
    domain.remoteContests.some((signal) =>
      signal.preparationActionIds?.includes(candidate.actionId),
    )
  );
}

function buildRunnerDomain(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  _deckCapabilities: DeckCapabilityProfile,
  strategicIntent: RunnerStrategicIntentProfile,
  economy: RunnerEconomyPosture,
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[],
  runTargets: readonly RunnerRunTargetEvaluation[],
  runWindowActionAssessments: NonNullable<
    RunnerPlanDomain["runWindows"][number]["actionAssessments"]
  >,
  activeRunRoot: ActiveRunnerRunRoot | undefined,
  runRiskReassessment: RunnerRunRiskReassessmentSignal | undefined,
  exposeInformation: readonly RunnerExposeInformationSignal[],
  previous: ResidentPlanPortfolio | undefined,
  discardChoiceBinding: RunnerDiscardChoiceBinding | undefined,
  discardKeepScore: DiscardKeepScorer | undefined,
  rigDemandProjection: RunnerRigDemandProjection | undefined,
  assessProgramInstallTarget: RunnerDevelopmentInstallServices["assessCard"],
): RunnerPlanDomain {
  const currentCredits = input.playerView.own.credits;
  const remainingClicks = input.playerView.own.clicks;
  const economyReserve = runnerEconomyReserveFacts(input, economy);
  const installedCardLiquidationChoice =
    runnerInstalledCardLiquidationChoiceSignal(input, candidates);
  const defenseSupport = runnerDefenseSupportSignals(
    input,
    candidates,
    handDevelopment,
  );
  const { defenseSupportAllInstallActionIds } = defenseSupport;
  const {
    turnLiquidityFundingNeeds,
    portfolioReserveFundingNeeds,
    forgoTerminalDeckPressureCapacity,
  } = buildRunnerEconomySignals({
    input,
    candidates,
    economy,
    handDevelopment,
    previous,
    currentTurnKey: turnKey(input),
    reserve: economyReserve,
    findFundingRoute: (request) =>
      runnerExactFundingRouteContract(input, candidates, request),
  });
  const installedRoles = new Set(
    (input.playerView.own.rig ?? []).flatMap((card) =>
      rolesForDeckDoctrineCard(card.definitionId ?? ""),
    ),
  );
  const handRotationAssessment = assessRunnerHandRotation(
    input,
    handDevelopment,
  );
  const liquiditySaturationOptionDevelopment =
    runnerLiquiditySaturationOptionDevelopment(
      input,
      Math.max(10, economy.desiredCreditReserve + 3),
    );
  const projectedCoverageGaps = uniqueCoverageGaps(
    input,
    candidates,
    runTargets,
    installedRoles,
    _deckCapabilities,
    strategicIntent,
    economy,
    handRotationAssessment,
    {
      runnerRemoteHasCurrentContestMaterial,
      runnerRemoteHasKnownIceScheduledForRunnerTurnEndTrash,
      runnerRunTargetCanConvertNow,
      runnerRunFundingSupport,
      runnerCentralPressureHasMaterialMarginalValue,
      runnerCentralPressureCadence,
      runnerExactFundingRouteContract,
    },
  );
  const coverageGaps = rigDemandProjection
    ? bindRunnerRigDemandProjectionToCoverageGaps({
        input,
        coverageGaps: projectedCoverageGaps,
        projection: rigDemandProjection,
      })
    : projectedCoverageGaps;
  const terminalContestThreat = runnerTerminalContestThreat(input);
  const exactCoverageRecoveryActionIds = new Set(
    coverageGaps.flatMap((gap) => gap.directSearchActionIds),
  );
  const accessPayoffCampaignSignals = runnerCentralPressureDevelopmentSignals(
    input,
    candidates,
    handDevelopment,
    runTargets,
    coverageGaps,
    strategicIntent,
    economy,
  );
  const shellTradersPipelines = buildRunnerShellTradersPipelineSignals({
    input,
    candidates,
    coverageGaps,
    handDevelopment,
    strategicIntent,
  });
  const recurringEconomy = runnerRecurringEconomySignals(
    input,
    candidates,
    runTargets,
    economy,
    handDevelopment,
    strategicIntent,
    (target) => runnerRunHasExactUrgency(input, target),
  );
  const recurringEconomyRunDeferralEvidenceCode =
    runnerRecurringEconomyRunDeferral(recurringEconomy);
  const resourceLifecycle = runnerResourceLifecycleSignals(
    input,
    candidates,
    (request) => runnerExactFundingRouteContract(input, candidates, request),
  );
  const installedAgendaScores = runnerInstalledAgendaScoreSignals(
    input,
    candidates,
    (instanceId) => visibleOwnCardByInstanceId(input, instanceId),
  );
  const immediateAgendaPointTerminalWins =
    runnerImmediateAgendaPointTerminalWinSignals(input, candidates);
  const immediateAgendaPointDevelopments =
    runnerImmediateAgendaPointDevelopmentSignals(
      input,
      candidates,
      immediateAgendaPointTerminalWins,
    );
  const defenseHandBuffer = runnerDefenseHandBufferFacts(input, runTargets);
  const { handSize, damageThreat, minimumHandBuffer } = defenseHandBuffer;
  const creditBanks = runnerCreditBankSignals(
    input,
    candidates,
    _deckCapabilities,
    economy,
    runTargets,
    handDevelopment,
    minimumHandBuffer,
    {
      hasExactRunUrgency: (target) => runnerRunHasExactUrgency(input, target),
      requiredPostRunReserve: (target) =>
        runnerRunRequiredPostRunReserve(input, candidates, economy, target),
      terminalVisibleHazardFundingGap: (target) =>
        runnerTerminalRemoteContestVisibleHazardFundingGap(input, target),
      isDirectlyMandatoryRun: (target) =>
        runnerTerminalRemoteContestIsDirectlyMandatory(input, target),
      developmentFundingRoute: (target) =>
        runnerSameTurnDevelopmentFundingRoute(input, candidates, target),
    },
  );
  const {
    defense,
    forgoUnsafeRunCapacity,
    runOnlyActionCapacity,
    confirmedDamageTaxedDrawActionIdSet,
  } = buildRunnerDefenseSignals({
    input,
    candidates,
    runTargets,
    strategicIntent,
    handBuffer: defenseHandBuffer,
    support: defenseSupport,
    exactCoverageRecoveryActionIds,
    forgoTerminalDeckPressureCapacity,
    discardChoiceBinding,
    services: {
      findFundingRoute: (request) =>
        runnerExactFundingRouteContract(input, candidates, request),
      runCanConvertNow: (target) =>
        runnerRunTargetCanConvertNow(input, economy, target, candidates),
    },
  });
  const recentSafetyAbort = runnerRecentFutureEncounterDamageSafetyAbort(input);
  const runFundingNeeds = bestRunTargetsByServer(
    input,
    economy,
    runTargets,
    candidates,
  ).flatMap((evaluation) => {
    const safetyBlocked =
      recentSafetyAbort?.serverId === evaluation.targetServerId ||
      forgoUnsafeRunCapacity ||
      (evaluation.targetKind === "remote" &&
        runnerRemoteHasKnownIceScheduledForRunnerTurnEndTrash(
          input,
          evaluation.targetServerId,
        ));
    const support = safetyBlocked
      ? undefined
      : runnerRunFundingSupport(
          input,
          economy,
          evaluation,
          runTargets,
          candidates,
        );
    return support
      ? [
          {
            kind: "parent_plan_support" as const,
            needId: support.needId,
            driver: support.driver,
            targetCredits: support.targetCredits,
            currentCreditsAtRevalidation: currentCredits,
            gap: support.gap,
            priorityClass: support.priorityClass,
            parentPlanInstanceId: support.parentPlanInstanceId,
            revalidation: {
              stateVersion: input.playerView.stateVersion,
              status: "material_parent_open" as const,
            },
            routeActionIds: support.routeActionIds,
            routeAssessment: support.routeAssessment,
            evidenceCode: support.evidenceCode,
          },
        ]
      : [];
  });
  const runLockReleaseRoutes = runnerRunLockReleaseRoutes(
    input,
    candidates,
    previous,
  );
  const runLockFundingNeeds: RunnerCorePlanDomain["fundingNeeds"] =
    runLockReleaseRoutes.flatMap((route) =>
      route.supportNeedId && route.fundingGap > 0
        ? [
            {
              kind: "parent_plan_support" as const,
              needId: route.supportNeedId,
              driver: {
                kind: route.serverId.startsWith("remote_")
                  ? ("contest" as const)
                  : ("run" as const),
                targetId: route.serverId,
                reasonCode: "release_run_lock_for_bound_run_plan",
              },
              targetCredits: route.targetCredits,
              currentCreditsAtRevalidation: currentCredits,
              gap: route.fundingGap,
              priorityClass: route.terminal ? ("P2" as const) : ("P4" as const),
              parentPlanInstanceId: route.parentPlanInstanceId,
              revalidation: {
                stateVersion: input.playerView.stateVersion,
                status: "material_parent_open" as const,
              },
              ...runnerExactFundingRouteContract(input, candidates, {
                demandId: route.supportNeedId,
                sourcePlanId: route.parentPlanInstanceId,
                purpose: "foreground_plan",
                priority: route.terminal
                  ? "acute_hard_plan_blocker"
                  : "current_foreground_plan",
                hardness: "hard",
                deadline: "end_of_current_turn",
                targetCredits: route.targetCredits,
                remainingClicks: Math.max(0, input.playerView.own.clicks - 1),
                allowStrategicExchange: true,
                evidence: [
                  route.projectionEvidenceCode,
                  "run_lock_release_conversion_click_reserved:1",
                ],
              }),
              evidenceCode: route.projectionEvidenceCode,
            },
          ]
        : [],
    );
  const resourceLifecycleFundingNeeds = runnerResourceLifecycleFundingNeeds(
    resourceLifecycle,
    currentCredits,
    input.playerView.stateVersion,
  );
  const { accessPayoffFundingNeeds, effectiveAccessPayoffCampaignSignals } =
    buildRunnerCentralPressureFunding({
      input,
      candidates,
      accessPayoffCampaignSignals,
      currentCredits,
      remainingClicks,
    });
  const preDevelopmentFundingNeeds = uniqueBy(
    [
      ...runFundingNeeds,
      ...runLockFundingNeeds,
      ...resourceLifecycleFundingNeeds,
      ...accessPayoffFundingNeeds,
      ...portfolioReserveFundingNeeds,
      ...turnLiquidityFundingNeeds,
    ],
    (need) => need.needId,
  );
  const constrainedRunCandidates =
    runOnlyActionCapacity && !forgoUnsafeRunCapacity
      ? bestRunTargetsByServer(input, economy, runTargets, candidates)
          .filter(
            (evaluation) =>
              evaluation.pathPassability === "reachable" &&
              evaluation.knownAccessState !== "known_no_current_payoff" &&
              !(
                evaluation.targetServerId === "archives" &&
                archivesIsKnownWithoutAgenda(input)
              ) &&
              (evaluation.recommendation === "run_now" ||
                evaluation.recommendation === "run_if_free") &&
              evaluation.score > 0,
          )
          .sort(
            (left, right) =>
              right.score - left.score ||
              left.targetServerId.localeCompare(right.targetServerId) ||
              left.actionId.localeCompare(right.actionId),
          )
          .slice(0, 1)
          .flatMap((evaluation) => {
            const candidate = candidates.find(
              (entry) => entry.actionId === evaluation.actionId,
            );
            return candidate
              ? [
                  {
                    candidate,
                    serverId: evaluation.targetServerId,
                    marginalValue: evaluation.score,
                    evidenceCode:
                      evaluation.evidence[0] ??
                      "best_restricted_run_capacity_target",
                  },
                ]
              : [];
          })
      : [];
  const centralPressure = buildRunnerCentralPressureSignals({
    input,
    candidates,
    strategicIntent,
    economy,
    runTargets,
    handDevelopment,
    previous,
    runLockReleaseRoutes,
    coverageGaps,
    damageThreat,
    recentSafetyAbort,
    handSize,
    minimumHandBuffer,
    forgoUnsafeRunCapacity,
    constrainedRunCandidates,
    effectiveAccessPayoffCampaignSignals,
    activeRunRoot,
    recurringEconomyRunDeferralEvidenceCode,
  });
  const remoteContests = buildRunnerRemoteContestSignals({
    input,
    candidates,
    runTargets,
    runLockReleaseRoutes,
    economy,
    coverageGaps,
    terminalContestThreat,
    recentSafetyAbort,
    damageThreat,
    forgoUnsafeRunCapacity,
    constrainedRunCandidates,
    handDevelopment,
    recurringEconomyRunDeferralEvidenceCode,
    activeRunRoot,
  });
  const delegatedFundingActionIds = runnerDelegatedFundingActionIds(
    input,
    {
      fundingNeeds: preDevelopmentFundingNeeds,
      coverageGaps,
      defense,
      resourceLifecycle,
      centralPressure,
      remoteContests,
      developments: [],
    },
    candidates,
    input.playerView.stateVersion,
  );
  const rejectedCreditBankActionIds = new Set(
    creditBanks.flatMap((signal) => signal.rejectedActionIds ?? []),
  );
  const coverageOwnedActionIds = runnerCoverageOwnedActionIds(
    input,
    candidates,
    coverageGaps,
  );
  const coverageSearchActionIds = new Set(
    coverageGaps.flatMap((gap) => [
      ...(gap.directSearchActionIds ?? []),
      ...(gap.preparationActionIds ?? []),
      ...(gap.searchEngineSetupActionIds ?? []),
      ...(gap.drawForAnswerActionIds ?? []),
      ...(gap.installActionIds ?? []),
      ...(gap.directSearchChoiceBindings ?? []).map(
        (binding) => binding.actionId,
      ),
    ]),
  );
  const { cardDevelopments, developmentFundingNeeds } =
    buildRunnerCardDevelopmentSignals({
      handDevelopment,
      effectiveAccessPayoffCampaignSignals,
      recurringEconomy,
      candidates,
      confirmedDamageTaxedDrawActionIdSet,
      input,
      coverageOwnedActionIds,
      coverageGaps,
      centralPressure,
      runTargets,
      creditBanks,
      resourceLifecycle,
      installedAgendaScores,
      immediateAgendaPointTerminalWins,
      immediateAgendaPointDevelopments,
      shellTradersPipelines,
      defenseSupportAllInstallActionIds,
      exposeInformation,
      delegatedFundingActionIds,
      economy,
      assessProgramInstallTarget,
      discardKeepScore,
      remainingClicks,
      rejectedCreditBankActionIds,
      coverageSearchActionIds,
    });
  const fundingNeeds = uniqueBy(
    [...preDevelopmentFundingNeeds, ...developmentFundingNeeds],
    (need) => need.needId,
  );
  const restrictedProgramInstallSequenceDevelopments =
    runnerRestrictedProgramInstallSequenceSignals(input, candidates, previous);
  const developments = [
    ...runnerEventInstallChoiceDevelopmentSignals(input, candidates, previous),
    ...immediateAgendaPointDevelopments,
    ...cardDevelopments,
    ...restrictedProgramInstallSequenceDevelopments,
    ...runnerProgramSearchStrategyDevelopmentSignals(
      input,
      candidates,
      strategicIntent,
      coverageGaps,
      handDevelopment,
    ),
    ...runnerGenericDrawDevelopmentSignals(
      input,
      candidates,
      strategicIntent,
      coverageGaps,
      handRotationAssessment,
      liquiditySaturationOptionDevelopment,
    ),
  ];
  const hasRunWindowCandidate = candidates.some((candidate) =>
    isRunnerRunWindowCandidate(input, candidate),
  );
  const accessWindowCommitment = currentAccessWindowCommitment(
    input,
    economy,
    activeRunRoot?.accessCommitment,
  );
  const runWindows = hasRunWindowCandidate
    ? (() => {
        const futureEncounterSafetyAssessment =
          runnerFutureEncounterDamageJackOutAssessment(input);
        const visibleIceDamageSafetyAssessment =
          runnerVisibleLethalIceDamageJackOutAssessment(
            input,
            currentRunRemainingIce(input),
          );
        const preservesTerminalNonlethalDamageContest =
          runnerTerminalContestPreservesNonlethalDamageContinuation(
            activeRunRoot,
            visibleIceDamageSafetyAssessment,
          );
        const safetyAssessment =
          futureEncounterSafetyAssessment ??
          (preservesTerminalNonlethalDamageContest
            ? undefined
            : visibleIceDamageSafetyAssessment) ??
          runnerKnownAccessDamageJackOutAssessment(input) ??
          (preservesTerminalNonlethalDamageContest
            ? undefined
            : currentRunAbortAssessment(
                input,
                activeRunRoot,
                runRiskReassessment,
              ));
        const encounterMitigation = visibleEncounterMitigation(input);
        const currentEncounterRequiresDamageBreak =
          runnerCurrentEncounterRequiresDamagePreservingBreak(
            input,
            activeRunRoot,
          );
        const informationProbeRequiresEncounterBreak =
          runnerInformationProbeRequiresEncounterBreak(input, activeRunRoot);
        const fullPathEncounterRequiresBreak =
          runnerFullPathCommitmentRequiresEncounterBreak(
            input,
            runWindowActionAssessments,
            activeRunRoot,
            runRiskReassessment,
          );
        const informationConversionRequiresEncounterBreak =
          (activeRunRoot?.informationBoundaryReassessment?.decision ===
            "convert_to_access" ||
            activeRunRoot?.informationBoundaryReassessment?.decision ===
              "convert_to_contest") &&
          input.legalActions.some(
            (action) =>
              action.type === "continue_run" &&
              action.payload?.encounterContinue === true &&
              action.payload?.encounterWillEndRun === true,
          );
        const exactPhaseActionIds = runnerExactRunWindowPhaseActionIds(
          input,
          candidates,
          runWindowActionAssessments,
          safetyAssessment !== undefined,
          currentEncounterRequiresDamageBreak ||
            runnerCurrentEncounterRequiresProgramPreservingBreak(input) ||
            informationProbeRequiresEncounterBreak ||
            currentEncounterHasUnbrokenResolvableDeflector(input) ||
            fullPathEncounterRequiresBreak ||
            informationConversionRequiresEncounterBreak,
        );
        const exactPhaseActionAssessments = runnerBindExactRunWindowPhaseRoute(
          runWindowActionAssessments,
          exactPhaseActionIds,
        );
        const restrictedRunSequenceActions = candidates.flatMap((candidate) => {
          const action = runnerRestrictedRunSequenceAction(input, candidate);
          return action ? [action] : [];
        });
        const restrictedRunSequenceServerIds = [
          ...new Set(
            restrictedRunSequenceActions.flatMap((action) =>
              typeof action.payload?.serverId === "string"
                ? [action.payload.serverId]
                : [],
            ),
          ),
        ];
        const restrictedRunSequence =
          !input.playerView.run && restrictedRunSequenceActions.length > 0;
        const windowServerId =
          input.playerView.run?.attackedServerId ??
          (restrictedRunSequenceServerIds.length === 1
            ? restrictedRunSequenceServerIds[0]
            : undefined);
        const signal = {
          windowId: `run:${input.playerView.run?.runId ?? input.playerView.stateVersion}`,
          ...(windowServerId ? { serverId: windowServerId } : {}),
          rootPlanInstanceId:
            activeRunRoot?.instanceId ??
            (restrictedRunSequence
              ? "rules.restricted_action_sequence"
              : "rules.access_window"),
          leafPlanInstanceId: `plan:runner.convert_run_window:run%3A${input.playerView.run?.runId ?? input.playerView.stateVersion}`,
          semanticActionTypes: [
            ...new Set(
              candidates
                .filter((candidate) =>
                  isRunnerRunWindowCandidate(input, candidate),
                )
                .map((candidate) => candidate.semanticActionType),
            ),
          ],
          purposeCode: restrictedRunSequence
            ? "continue_engine_restricted_run_sequence"
            : "convert_active_run_window",
          evidenceCode: restrictedRunSequence
            ? "runner_engine_restricted_run_sequence_continuation"
            : (safetyAssessment?.evidenceCode ??
              encounterMitigation ??
              (input.playerView.run
                ? "visible_active_run"
                : "legal_access_window_without_run_snapshot")),
          ...(accessWindowCommitment
            ? { accessCommitment: accessWindowCommitment }
            : {}),
          ...(runRiskReassessment ? { runRiskReassessment } : {}),
          ...(safetyAssessment
            ? {
                safetyIntent: "jack_out" as const,
                safetyEvidenceCode: safetyAssessment.evidenceCode,
              }
            : {}),
          ...(encounterMitigation
            ? {
                encounterIntent: "mitigate_threat" as const,
                encounterEvidenceCode: encounterMitigation,
              }
            : {}),
          ...(Object.keys(exactPhaseActionAssessments).length > 0
            ? { actionAssessments: exactPhaseActionAssessments }
            : {}),
        };
        if (!restrictedRunSequence) {
          return [
            ...(activeRunRoot?.restrictedRunBinding
              ? [
                  {
                    ...activeRunRoot.restrictedRunBinding,
                    semanticActionTypes: [],
                    actionAssessments: {},
                  },
                ]
              : []),
            signal,
          ];
        }
        const boundSignals = restrictedRunSequenceActions.map((action) => {
          const evaluation = runTargets.find(
            (entry) => entry.actionId === action.actionId,
          );
          const assessment = exactPhaseActionAssessments[action.actionId];
          if (
            !evaluation ||
            !assessment ||
            evaluation.targetServerId !== action.payload?.serverId
          ) {
            throw new PlanResolutionFailure("invalid_plan_identity", {
              side: input.side,
              stateVersion: input.playerView.stateVersion,
              timingPoint: input.playerView.timingPoint,
              legalActionTypes: [action.type],
              unresolvedActionIds: [action.actionId],
              owner: "plan_registry",
              removalCondition:
                "Bind each restricted run action to its exact current target evaluation and run-window assessment before plan selection.",
            });
          }
          const windowId = `${signal.windowId}:${action.actionId}`;
          return {
            ...signal,
            windowId,
            serverId: evaluation.targetServerId,
            leafPlanInstanceId: planInstanceIdForProposal({
              moduleId: "runner.convert_run_window",
              dedupeKey: windowId,
            }),
            semanticActionTypes: ["run.start"],
            accessCommitment: accessCommitmentForEvaluation(input, evaluation),
            actionAssessments: { [action.actionId]: assessment },
          };
        });
        const restrictedActionIds = new Set(
          restrictedRunSequenceActions.map((action) => action.actionId),
        );
        const remainingAssessments = Object.fromEntries(
          Object.entries(exactPhaseActionAssessments).filter(
            ([id]) => !restrictedActionIds.has(id),
          ),
        );
        return [
          ...boundSignals,
          ...(Object.keys(remainingAssessments).length > 0
            ? [{ ...signal, actionAssessments: remainingAssessments }]
            : []),
        ];
      })()
    : [];
  const coverageGapsWithResidentRequesters =
    reconcileRunnerCoverageRequesterBindings({
      coverageGaps,
      centralPressure,
      remoteContests,
    });
  return {
    fundingNeeds,
    coverageGaps: coverageGapsWithResidentRequesters,
    creditBanks,
    recurringEconomy,
    installedCardLiquidationChoices: installedCardLiquidationChoice
      ? [installedCardLiquidationChoice]
      : [],
    resourceLifecycle,
    installedAgendaScores,
    shellTradersPipelines,
    defense,
    terminalWins: runnerTerminalWinSignals(
      input,
      candidates,
      immediateAgendaPointTerminalWins,
    ),
    centralPressure,
    remoteContests,
    developments,
    exposeInformation: exposeInformation.map((signal) =>
      structuredClone(signal),
    ),
    runWindows,
    runTargetEvaluations: runTargets.map((evaluation) =>
      structuredClone(evaluation),
    ),
  };
}

function currentAccessWindowCommitment(
  input: AiDecisionInput,
  economy: RunnerEconomyPosture,
  parentCommitment: RunnerRunAccessCommitmentSignal | undefined,
): RunnerRunAccessCommitmentSignal | undefined {
  const trashAction = input.legalActions.find(
    (action) => action.type === "trash_accessed_card",
  );
  if (!trashAction) return parentCommitment;
  const accessedDefinitionId = input.playerView.run?.accessedCard?.definitionId;
  if (!accessedDefinitionId) return parentCommitment;
  const exactParentTarget =
    parentCommitment?.knownTargetDefinitionIds.includes(
      accessedDefinitionId,
    ) === true;
  const impact = assessRunnerAccessTrashImpact({
    input,
    trashAction,
    economyReserve: economy.desiredCreditReserve,
    parentReservedCredits: exactParentTarget
      ? 0
      : reservedAccessTrashCredits(input, parentCommitment),
  });
  if (!impact) return parentCommitment;
  if (impact.recommendation === "trash") {
    return {
      payoff: "trash_affordable",
      intendedAction: "trash",
      knownTargetDefinitionIds: [accessedDefinitionId],
      trashBudget: impact.trashCost,
      evidenceCode: "access_window_canonical_impact_trash",
    };
  }
  return {
    payoff:
      impact.creditsAfterTrash < impact.requiredReserve
        ? "trash_unaffordable"
        : "known_low_value",
    intendedAction: "decline",
    knownTargetDefinitionIds: [accessedDefinitionId],
    trashBudget: 0,
    evidenceCode:
      impact.creditsAfterTrash < impact.requiredReserve
        ? "access_window_trash_deferred_by_bound_reserve"
        : "access_window_visible_impact_below_cost",
  };
}

export function reservedAccessTrashCredits(
  input: AiDecisionInput,
  commitment: RunnerRunAccessCommitmentSignal | undefined,
): number {
  if (!commitment) return 0;
  if (
    typeof commitment.trashBudget === "number" &&
    Number.isFinite(commitment.trashBudget) &&
    commitment.trashBudget >= 0
  )
    return commitment.trashBudget;
  if (
    commitment.intendedAction !== "trash" &&
    (commitment.trashBudget === "unknown" ||
      commitment.trashBudget === "not_applicable")
  )
    return 0; // No committed trash objective reserves general credits.
  throw new PlanResolutionFailure("missing_action_semantics", {
    side: input.side,
    stateVersion: input.playerView.stateVersion,
    timingPoint: input.playerView.timingPoint,
    legalActionTypes: input.legalActions.map((action) => action.type),
    owner: "plan_module",
    removalCondition:
      "A committed Runner trash objective requires a known nonnegative general-credit budget from its access owner.",
  });
}

function activeRunRootPlan(
  previous: ResidentPlanPortfolio | undefined,
  input: AiDecisionInput,
): ActiveRunnerRunRoot | undefined {
  const serverId = input.playerView.run?.attackedServerId;
  if (!previous || !serverId) return undefined;
  const candidates = [
    previous.instances.find(
      (instance) =>
        instance.instanceId === previous.executorInstanceId &&
        instance.target?.kind === "server" &&
        instance.target.id === serverId,
    ),
    previous.instances.find(
      (instance) =>
        instance.instanceId === previous.rootForegroundInstanceId &&
        instance.moduleId === "runner.convert_run_window" &&
        instance.target?.kind === "server" &&
        instance.target.id === serverId,
    ),
    ...previous.instances.filter(
      (instance) =>
        instance.target?.kind === "server" &&
        instance.target.id === serverId &&
        (instance.moduleId === "runner.pressure_central" ||
          instance.moduleId === "runner.contest_remote"),
    ),
  ].filter((instance) => instance !== undefined);
  const root = candidates[0];
  if (!root) return undefined;
  const runOrigin = runOriginFromModuleState(root.moduleState);
  const accessCommitment = accessCommitmentFromModuleState(root.moduleState);
  const moduleState = root.moduleState as {
    kind?: unknown;
    signal?: unknown;
  };
  const restrictedRunBinding =
    root.moduleId === "runner.convert_run_window" &&
    moduleState.kind === "run_window" &&
    (moduleState.signal as { purposeCode?: unknown } | undefined)
      ?.purposeCode === "continue_engine_restricted_run_sequence"
      ? (structuredClone(
          moduleState.signal,
        ) as RunnerPlanDomain["runWindows"][number])
      : undefined;
  const parentBinding =
    root.moduleId === "runner.pressure_central" &&
    moduleState.kind === "central_pressure" &&
    moduleState.signal &&
    typeof moduleState.signal === "object"
      ? {
          moduleId: "runner.pressure_central" as const,
          signal: structuredClone(moduleState.signal) as RunnerPressureSignal,
        }
      : root.moduleId === "runner.contest_remote" &&
          moduleState.kind === "remote_contest" &&
          moduleState.signal &&
          typeof moduleState.signal === "object"
        ? {
            moduleId: "runner.contest_remote" as const,
            signal: structuredClone(
              moduleState.signal,
            ) as RunnerRemoteContestSignal,
          }
        : undefined;
  return {
    instanceId: root.instanceId,
    ...runOrigin,
    ...(accessCommitment ? { accessCommitment } : {}),
    ...(parentBinding ? { parentBinding } : {}),
    ...(restrictedRunBinding ? { restrictedRunBinding } : {}),
  };
}

function runOriginFromModuleState(moduleState: unknown): RunnerRunOrigin {
  if (!moduleState || typeof moduleState !== "object") return {};
  const signal = (moduleState as { signal?: unknown }).signal;
  if (!signal || typeof signal !== "object") return {};
  const purpose = (signal as { purpose?: unknown }).purpose;
  const encounterCreditSpendLimit = (
    signal as { encounterCreditSpendLimit?: unknown }
  ).encounterCreditSpendLimit;
  const informationBoundaryReassessment = (
    signal as { informationBoundaryReassessment?: unknown }
  ).informationBoundaryReassessment;
  const runRiskContract = (signal as { runRiskContract?: unknown })
    .runRiskContract;
  return {
    ...(purpose === "access" ||
    purpose === "multiaccess" ||
    purpose === "information" ||
    purpose === "contest"
      ? { purpose }
      : {}),
    ...(typeof encounterCreditSpendLimit === "number" &&
    Number.isFinite(encounterCreditSpendLimit) &&
    encounterCreditSpendLimit >= 0
      ? { encounterCreditSpendLimit }
      : {}),
    ...(isRunnerInformationBoundaryReassessment(informationBoundaryReassessment)
      ? {
          informationBoundaryReassessment: structuredClone(
            informationBoundaryReassessment,
          ),
        }
      : {}),
    ...(isRunnerRunRiskContract(runRiskContract)
      ? { runRiskContract: structuredClone(runRiskContract) }
      : {}),
  };
}

function reassessActiveInformationRunParent(
  input: AiDecisionInput,
  root: ActiveRunnerRunRoot | undefined,
): ActiveRunnerRunRoot | undefined {
  const run = input.playerView.run;
  const encounteredIce = currentEncounteredIceCard(input);
  if (
    !root?.parentBinding ||
    !run ||
    run.phase !== "encounter_ice" ||
    !encounteredIce ||
    encounteredIce.known !== true ||
    encounteredIce.rezzed !== true ||
    !encounteredIce.effectiveRunQuote ||
    (root.purpose !== "information" &&
      root.informationBoundaryReassessment?.startedAsInformation !== true)
  ) {
    return root;
  }

  const remainingIce = uniqueBy(
    [...currentRunRemainingIce(input), encounteredIce],
    (ice) => ice.instanceId,
  );
  const knownPath = assessKnownRezzedIcePath(
    remainingIce,
    input.playerView.own.rig ?? [],
    runnerRunPathCreditBudgetWithVisiblePools(
      input.playerView.own.credits +
        Math.max(0, input.playerView.run?.badPublicityCredits ?? 0),
      input.playerView.own.rig ?? [],
    ),
    input.playerView.servers.find(
      (server) => server.id === run.attackedServerId,
    )?.root ?? [],
    input.playerView.opponent.credits,
  );
  const unknownIceCount = remainingIce.filter(
    (ice) =>
      ice.known !== true ||
      ice.rezzed !== true ||
      ice.effectiveRunQuote === undefined,
  ).length;
  const knownPathCost = Math.max(0, knownPath.visibleBreakCost ?? 0);
  const reservedCredits =
    root.accessCommitment?.intendedAction === "trash"
      ? reservedAccessTrashCredits(input, root.accessCommitment)
      : 0;
  const fundingGap = Math.max(0, reservedCredits - knownPath.creditsAfterPath);
  const unavoidableHazardCount = Math.max(
    0,
    knownPath.unavoidableVisibleIceHazardCount ?? 0,
  );
  const parentSignal = root.parentBinding.signal;
  const marginalValue = Number(parentSignal.marginalValue);
  const payoff = root.accessCommitment?.payoff;
  const conditionalRiskRoute = assessRandomBreakOrDamageRiskForVisibleRunPath(
    input,
    {
      targetServerId: run.attackedServerId,
      visibleIce: remainingIce,
      ...(payoff ? { accessPayoff: payoff } : {}),
      scoreThreat: payoff === "score_threat",
    },
  );
  // The same canonical damage-risk quote that admits the run also owns
  // conditional reachability after an information boundary. A deterministic
  // breaker quote alone cannot disprove an admissible probabilistic route.
  const probabilisticPathReachable =
    randomBreakOrDamageRiskCanCarryRunPath(conditionalRiskRoute);
  const knownPathReachable =
    knownPath.canReachAccess || probabilisticPathReachable;
  const hasConcretePayoff =
    payoff === "agenda" ||
    payoff === "score_threat" ||
    payoff === "trash_affordable" ||
    payoff === "access_bonus";
  const hasSpeculativeInformationValue =
    Number.isFinite(marginalValue) &&
    marginalValue > 0 &&
    knownPath.creditsAfterPath > 0;
  const hasMaterialPayoff = hasConcretePayoff || hasSpeculativeInformationValue;
  const convert =
    knownPathReachable &&
    unknownIceCount === 0 &&
    fundingGap === 0 &&
    unavoidableHazardCount === 0 &&
    hasMaterialPayoff;
  const nextPurpose = convert
    ? root.parentBinding.moduleId === "runner.contest_remote"
      ? ("contest" as const)
      : ("access" as const)
    : ("information" as const);
  const decision = convert
    ? root.parentBinding.moduleId === "runner.contest_remote"
      ? ("convert_to_contest" as const)
      : ("convert_to_access" as const)
    : ("retain_information" as const);
  const preservedRunReserve = Math.max(
    0,
    root.runRiskContract?.reserveQuote.requiredCredits ?? 0,
  );
  const knownEncounterPathFitsBoundRunBudget =
    knownPathReachable &&
    fundingGap === 0 &&
    knownPath.creditsAfterPath >= preservedRunReserve;
  const encounterBudget =
    convert || knownEncounterPathFitsBoundRunBudget
      ? knownPathCost
      : Math.min(
          Math.max(0, root.encounterCreditSpendLimit ?? 0),
          Math.max(0, input.playerView.own.credits),
        );
  const evidenceCodes = [
    "runner_information_boundary_reassessment",
    `runner_information_boundary_previous_purpose:${root.purpose ?? "information"}`,
    `runner_information_boundary_next_purpose:${nextPurpose}`,
    `runner_information_boundary_decision:${decision}`,
    `runner_information_boundary_known_path_cost:${knownPathCost}`,
    `runner_information_boundary_known_path_reachable:${knownPathReachable}`,
    `runner_information_boundary_probabilistic_path_reachable:${probabilisticPathReachable}`,
    ...(conditionalRiskRoute?.evidence ?? []),
    `runner_information_boundary_unknown_ice:${unknownIceCount}`,
    `runner_information_boundary_credits_after_path:${knownPath.creditsAfterPath}`,
    `runner_information_boundary_reserved_credits:${reservedCredits}`,
    `runner_information_boundary_funding_gap:${fundingGap}`,
    `runner_information_boundary_unavoidable_hazards:${unavoidableHazardCount}`,
    `runner_information_boundary_preserved_run_reserve:${preservedRunReserve}`,
    `runner_information_boundary_known_encounter_fits_run_budget:${knownEncounterPathFitsBoundRunBudget}`,
    `runner_information_boundary_payoff:${payoff ?? "parent_marginal_value"}`,
    `runner_information_boundary_encounter_budget:${encounterBudget}`,
  ];
  const reassessment: RunnerInformationBoundaryReassessmentSignal = {
    startedAsInformation: true,
    previousPurpose: root.purpose ?? "information",
    nextPurpose,
    decision,
    boundaryKind: "visible_ice_path_changed",
    observedAtStateVersion: input.playerView.stateVersion,
    observedIceInstanceId: encounteredIce.instanceId,
    knownPathCost,
    knownPathReachable,
    unknownIceCount,
    runnerCreditsBeforeQuote: input.playerView.own.credits,
    creditsAfterKnownPath: knownPath.creditsAfterPath,
    reservedCredits,
    fundingGap,
    unavoidableHazardCount,
    remainingClicks: input.playerView.own.clicks,
    encounterBudget,
    evidenceCodes,
  };
  const reboundSignal = {
    ...parentSignal,
    purpose: nextPurpose,
    encounterCreditSpendLimit: encounterBudget,
    informationBoundaryReassessment: reassessment,
    evidenceCode: `runner_information_boundary_parent_requoted:${decision}`,
  };

  return {
    ...root,
    purpose: nextPurpose,
    encounterCreditSpendLimit: encounterBudget,
    informationBoundaryReassessment: reassessment,
    parentBinding:
      root.parentBinding.moduleId === "runner.pressure_central"
        ? {
            moduleId: "runner.pressure_central",
            signal: reboundSignal as RunnerPressureSignal,
          }
        : {
            moduleId: "runner.contest_remote",
            signal: reboundSignal as RunnerRemoteContestSignal,
          },
  };
}

function isRunnerInformationBoundaryReassessment(
  value: unknown,
): value is RunnerInformationBoundaryReassessmentSignal {
  if (!value || typeof value !== "object") return false;
  const candidate =
    value as Partial<RunnerInformationBoundaryReassessmentSignal>;
  return (
    candidate.startedAsInformation === true &&
    candidate.boundaryKind === "visible_ice_path_changed" &&
    typeof candidate.observedAtStateVersion === "number" &&
    typeof candidate.observedIceInstanceId === "string" &&
    typeof candidate.knownPathReachable === "boolean" &&
    typeof candidate.knownPathCost === "number" &&
    Number.isFinite(candidate.knownPathCost) &&
    typeof candidate.fundingGap === "number" &&
    Number.isFinite(candidate.fundingGap) &&
    typeof candidate.unavoidableHazardCount === "number" &&
    Number.isFinite(candidate.unavoidableHazardCount) &&
    Array.isArray(candidate.evidenceCodes)
  );
}

function isRunnerRunRiskContract(
  value: unknown,
): value is RunnerRunRiskContractSignal {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<RunnerRunRiskContractSignal>;
  const quote = candidate.reserveQuote;
  return (
    candidate.schemaVersion === "runner-run-risk-contract-v1" &&
    typeof candidate.serverId === "string" &&
    typeof candidate.observedAtStateVersion === "number" &&
    (candidate.runCommitment === "probe_only" ||
      candidate.runCommitment === "full_path") &&
    typeof candidate.unrezzedIceRisk === "number" &&
    Number.isFinite(candidate.unrezzedIceRisk) &&
    typeof candidate.visibleDuringRunRezSupport === "boolean" &&
    quote !== undefined &&
    typeof quote.requiredCredits === "number" &&
    Number.isFinite(quote.requiredCredits) &&
    typeof quote.requiredHandBuffer === "number" &&
    Number.isFinite(quote.requiredHandBuffer) &&
    Array.isArray(candidate.evidenceCodes)
  );
}

function accessCommitmentFromModuleState(
  moduleState: unknown,
): RunnerRunAccessCommitmentSignal | undefined {
  if (!moduleState || typeof moduleState !== "object") return undefined;
  const signal = (moduleState as { signal?: unknown }).signal;
  if (!signal || typeof signal !== "object") return undefined;
  const commitment = (
    signal as { accessCommitment?: RunnerRunAccessCommitmentSignal }
  ).accessCommitment;
  if (
    !commitment ||
    !Array.isArray(commitment.knownTargetDefinitionIds) ||
    !(
      commitment.trashBudget === "unknown" ||
      commitment.trashBudget === "not_applicable" ||
      (typeof commitment.trashBudget === "number" &&
        Number.isFinite(commitment.trashBudget) &&
        commitment.trashBudget >= 0)
    )
  ) {
    return undefined;
  }
  return structuredClone(commitment);
}

function corpContext(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  previous: ResidentPlanPortfolio | undefined,
  discardKeepScore: DiscardKeepScorer | undefined,
): PlanSchedulerContext {
  const sourceBoundCandidates = candidates.map((candidate) => {
    if (candidate.sourceDefinitionId || !candidate.sourceCardInstanceId) {
      return candidate;
    }
    const visibleSource = visibleOwnCardByInstanceId(
      input,
      candidate.sourceCardInstanceId,
    );
    return visibleSource?.definitionId
      ? { ...candidate, sourceDefinitionId: visibleSource.definitionId }
      : candidate;
  });
  const discoveredDomain = buildCorpDomain(
    input,
    sourceBoundCandidates,
    previous,
  );
  const forcedHandChoiceSignal =
    corpStrategicPlanningGroupDrawChoiceSignal(
      input,
      sourceBoundCandidates,
      discardKeepScore,
    ) ??
    corpCorporateShuffleHqChoiceSignal(
      input,
      sourceBoundCandidates,
      discardKeepScore,
    ) ??
    corpDiscardWindowSignal(input, sourceBoundCandidates, discardKeepScore);
  const baseDomain: CorpPlanDomain = forcedHandChoiceSignal
    ? {
        ...discoveredDomain,
        handManagement: [
          forcedHandChoiceSignal,
          ...discoveredDomain.handManagement,
        ],
      }
    : discoveredDomain;
  const preArbitrationHandFacts = buildCorpHandInventoryFacts({
    input,
    candidates: sourceBoundCandidates,
    domainClaims: corpHandDomainRouteClaims(baseDomain),
    actionDispositions: [],
  });
  const arbitratedDomain = preArbitrationHandFacts
    ? arbitrateCorpHandConversionBeforeDraw(
        input,
        sourceBoundCandidates,
        baseDomain,
        preArbitrationHandFacts,
      )
    : baseDomain;
  const actionDispositions = collectCorpActionDispositions(
    input,
    sourceBoundCandidates,
    arbitratedDomain,
    CORP_ACTION_DISPOSITION_CONTRIBUTOR_FACTS,
  );
  const handInventoryFacts = buildCorpHandInventoryFacts({
    input,
    candidates: sourceBoundCandidates,
    domainClaims: corpHandDomainRouteClaims(arbitratedDomain),
    actionDispositions,
  });
  const domain: CorpPlanDomain = handInventoryFacts
    ? { ...arbitratedDomain, handInventoryFacts }
    : arbitratedDomain;
  return {
    input,
    actionCandidates: sourceBoundCandidates,
    actionDispositions,
    transientSignals: corpTransientPlanSignals(input, domain),
    turnKey: turnKey(input),
    domain,
  };
}

function corpTransientPlanSignals(
  input: AiDecisionInput,
  domain: CorpPlanDomain,
): TransientPlanSignal[] {
  return domain.scoreProjects.map((project) => ({
    schemaVersion: TRANSIENT_PLAN_SIGNAL_SCHEMA_VERSION,
    signalId:
      project.phase === "select_agenda"
        ? `corp-score-material:${project.projectId}`
        : `corp-score:${project.projectId}`,
    side: "corp",
    observedAtStateVersion: input.playerView.stateVersion,
    planModuleId: "corp.score_agenda",
    planDedupeKey: project.projectId,
    kind: "goal",
    scope:
      project.phase === "select_agenda" ||
      project.terminalScore ||
      project.sameTurnCloseout ||
      project.deadlinePressure
        ? "tactical"
        : "strategic",
    evidenceCode: project.evidenceCode,
    guarantee: project.terminalScore
      ? "visible_state_forced"
      : "robust_but_reactive",
    target: corpScorePlanTarget(project),
  }));
}

function corpExactExecutableNonEconomyPlanOwnsAction(
  domain: CorpPlanDomain,
  candidate: ActionSemanticCandidate,
): boolean {
  return (
    domain.scoreProjects.some(
      (signal) =>
        signal.feasible &&
        signal.actionIds?.includes(candidate.actionId) === true,
    ) ||
    domain.handManagement.some(
      (signal) =>
        signal.routeAllowed !== false &&
        corpHandSignalMatchesCandidate(signal, candidate),
    ) ||
    domain.ambushes.some((signal) =>
      signal.actionIds.includes(candidate.actionId),
    ) ||
    domain.punishCampaigns.some(
      (signal) =>
        signal.feasible && corpPunishCampaignOwnsCandidate(signal, candidate),
    )
  );
}

function buildCorpDomain(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  previous: ResidentPlanPortfolio | undefined,
): CorpPlanDomain {
  const {
    centralDefenseAllocation,
    residentDrawAttempt,
    eventDrawAttempted,
    currentTurnKey,
    defenseDrawAttemptConsumed,
    consumedDefenseDrawSignals,
    agendaPurgeDefenseChoice,
    centralDefenseHqHoldCadence,
    centralDefenseHqHoldSelection,
  } = prepareCorpDefenseDiscovery({ input, previous, candidates });
  const scorelineFeasibility = corpScorelineFeasibilityForDecisionInput(input);
  const {
    directScoreProjects,
    recentlyCompromisedRemoteIds,
    residentScoreDefenseBinding,
    residentScoreAgendaInstanceId,
  } = discoverCorpDirectScoreProjects({
    input,
    candidates,
    previous,
    scorelineFeasibility,
    centralDefenseAllocation,
  });
  const proposedAmbushes = buildCorpAmbushPlanSignals({
    reservedScoreCredits: Math.max(
      0,
      ...directScoreProjects.map(
        (project) =>
          project.continuationReserve?.requiredCreditsBeforeNextCorpTurn ?? 0,
      ),
    ),
    reservedScoreServerIds: new Set(
      directScoreProjects.flatMap((project) =>
        project.serverId && project.serverId !== "new_remote"
          ? [project.serverId]
          : [],
      ),
    ),
    input,
    candidates,
    previous,
  });
  const {
    requiredScoreCreditFloor,
    scoreProjects,
    deferredLastClickScoreProject,
    exactLastClickLiquidityHeadAvailable,
    ownAgendas,
  } = reconcileCorpScoreProjects({
    input,
    candidates,
    proposedAmbushes,
    directScoreProjects,
    recentlyCompromisedRemoteIds,
    residentScoreDefenseBinding,
    residentScoreAgendaInstanceId,
    centralDefenseAllocation,
  });
  const classicDeflectorDefenseChoice = corpClassicDeflectorDefenseChoiceSignal(
    input,
    candidates,
    centralDefenseAllocation,
    requiredScoreCreditFloor,
  );
  const scoreOwnedAgendaInstallInstanceIds = new Set(
    scoreProjects.flatMap((project) =>
      project.feasible &&
      project.phase === "install_agenda" &&
      project.agendaInstanceId
        ? [project.agendaInstanceId]
        : [],
    ),
  );
  const ambushes: CorpPlanDomain["ambushes"] = proposedAmbushes.filter(
    (signal) =>
      !scoreOwnedAgendaInstallInstanceIds.has(signal.sourceInstanceId),
  );
  const {
    terminalRezReserveSignals,
    exactScoreProtectionInstallActionIds,
    selectedScoreProtectionSignals,
    scorePlanPrecedesRedundantCapacityDefense,
    scoreProtectionProjects,
    exactExecutableScoreProjectAvailable,
    defenseDrawSignals,
  } = buildCorpDefenseProtectionSignals({
    scoreProjects,
    input,
    residentScoreAgendaInstanceId,
    candidates,
    centralDefenseAllocation,
    previous,
    residentDrawAttempt,
    eventDrawAttempted,
    currentTurnKey,
    defenseDrawAttemptConsumed,
  });
  const remoteProjects = buildCorpScoringRemoteDiscovery({
    input,
    previous,
    scoreProjects,
    ambushes,
    availableRemoteRezCredits: corpAvailableRemoteRezCredits(
      input,
      centralDefenseAllocation,
    ),
  });
  const { defenseNeeds } = buildCorpDefenseNeeds({
    input,
    terminalRezReserveSignals,
    candidates,
    scoreProjects,
    centralDefenseAllocation,
    exactScoreProtectionInstallActionIds,
    remoteProjects,
    deferredLastClickScoreProject,
    exactLastClickLiquidityHeadAvailable,
    selectedScoreProtectionSignals,
    scorePlanPrecedesRedundantCapacityDefense,
    scoreProtectionProjects,
    exactExecutableScoreProjectAvailable,
    ambushes,
    defenseDrawSignals,
    consumedDefenseDrawSignals,
    agendaPurgeDefenseChoice,
    classicDeflectorDefenseChoice,
  });
  const { immediateFundingActionIds, terminalFundingActionIds } =
    corpEconomyFundingActionIds(input, candidates);
  const punishCampaigns = uniqueBy(
    punishSignals(input, candidates, scorelineFeasibility, previous),
    (signal) => signal.campaignId,
  );
  const economyNeeds = buildCorpEconomySignals({
    input,
    candidates,
    scoreProjects,
    defenseNeeds,
    remoteProjects,
    ambushes,
    punishCampaigns,
    immediateFundingActionIds,
    terminalFundingActionIds,
    previous,
    currentTurnKey,
    deferredLastClickScoreProject,
  });
  const virusPressure = buildCorpVirusPressureSignals(input);
  const defenseDispositionActionIds = new Set(
    corpDefenseActionDispositions(
      {
        input,
        actionCandidates: candidates,
        turnKey: currentTurnKey,
      },
      defenseNeeds,
      centralDefenseAllocation,
    ).map((disposition) => disposition.actionId),
  );
  const scoreSetupBinding = corpScoreAccelerationSetupBinding(
    input,
    candidates,
    scoreProjects,
  );
  if (scoreSetupBinding) {
    scoreSetupBinding.parent.setupNeed = scoreSetupBinding.setupNeed;
  }
  const handManagement = buildCorpHandManagementSignals(
    input,
    candidates,
    ownAgendas,
    economyNeeds,
    defenseDispositionActionIds,
    scoreSetupBinding,
    scoreProjects,
    previous,
    (candidate) =>
      corpDefensiveUpgradePlacement(input, candidate, scoreProjects) !==
      undefined,
  );
  return {
    scoreProjects,
    remoteProjects,
    defenseNeeds,
    centralDefenseAllocation,
    centralDefenseHqHoldCadence,
    ...(centralDefenseHqHoldSelection ? { centralDefenseHqHoldSelection } : {}),
    economyNeeds,
    virusPressure,
    punishCampaigns,
    ambushes,
    handManagement,
  };
}

function recentServerAccessCount(
  input: AiDecisionInput,
  serverId: string,
): number {
  const normalizedServer = serverId === "rd" ? "r&d" : serverId;
  return input.eventTail.slice(-30).filter((event) => {
    if (event.type !== "access_card") return false;
    const payload = event.publicPayload as Record<string, unknown>;
    const eventServer = String(
      payload.serverId ??
        payload.serverLabel ??
        (payload.targets as Record<string, unknown> | undefined)?.serverLabel ??
        "",
    ).toLowerCase();
    return (
      eventServer === serverId.toLowerCase() || eventServer === normalizedServer
    );
  }).length;
}

function resolvePlanBoundRunnerHiddenDrawChoice(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  const choice = context.input.playerView.pendingChoice;
  const continuation = choice?.continuation;
  if (
    context.input.side !== "runner" ||
    continuation?.family !== "runner_hidden_draw_keep_or_top_replacement"
  )
    return undefined;
  const origin = previous?.selectedActionOrigin;
  const executor = previous?.instances.find(
    (instance) =>
      instance.instanceId === origin?.executorInstanceId &&
      instance.executionState === "executor",
  );
  const root = previous?.instances.find(
    (instance) => instance.instanceId === origin?.rootPlanInstanceId,
  );
  const choiceActions = context.input.legalActions.filter(
    (action) => action.type === "resolve_choice",
  );
  const action = choiceActions.length === 1 ? choiceActions[0] : undefined;
  const [requirement] = action?.choiceRequirements ?? [];
  const optionIds = choice?.options.map((option) => option.id) ?? [];
  const exactBinding =
    choice !== undefined &&
    choice.side === "runner" &&
    choice.kind === "select_option" &&
    choice.visibility === "hidden_info_barrier" &&
    choice.stateVersion === context.input.playerView.stateVersion &&
    choice.sourceCardInstanceId === continuation.sourceCardInstanceId &&
    choice.sourceCardDefinitionId === continuation.sourceCardDefinitionId &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    continuation.createdAtStateVersion ===
      context.input.playerView.stateVersion &&
    continuation.originActionId.length > 0 &&
    continuation.sourceCardInstanceId.length > 0 &&
    continuation.sourceCardDefinitionId.length > 0 &&
    continuation.drawnCardInstanceIds.length > 0 &&
    new Set(continuation.drawnCardInstanceIds).size ===
      continuation.drawnCardInstanceIds.length &&
    previous !== undefined &&
    previous.side === "runner" &&
    previous.stateVersion < context.input.playerView.stateVersion &&
    origin !== undefined &&
    origin.selectedAtStateVersion === previous.stateVersion &&
    origin.selectedActionId === continuation.originActionId &&
    origin.immediateChoicePolicy === "trash_lowest_visible_drawn_card" &&
    previous.rootForegroundInstanceId === origin.rootPlanInstanceId &&
    previous.executorInstanceId === origin.executorInstanceId &&
    root !== undefined &&
    executor !== undefined &&
    action !== undefined &&
    action.side === "runner" &&
    action.source === "game_rule" &&
    action.expiresAtStateVersion === context.input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === optionIds.length &&
    optionIds.every((optionId) => requirement.optionIds.includes(optionId));
  if (!exactBinding || !action || !previous || !origin) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map(
        (legalAction) => legalAction.type,
      ),
      unresolvedActionIds: choiceActions.map(
        (legalAction) => legalAction.actionId,
      ),
      owner: "continuation",
      removalCondition:
        "Resolve a hidden draw replacement only from the immediately preceding Runner plan executor, its exact selected action and the Engine's current private choice contract.",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
    });
  }
  return {
    actionId: action.actionId,
    reasonCode: "plan_bound_runner_hidden_draw_choice",
    origin: {
      rootPlanInstanceId: origin.rootPlanInstanceId,
      leafPlanInstanceId: origin.executorInstanceId,
      side: "runner",
      windowKind: "mandatory_choice",
      windowId: choice.choiceId,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
    },
  };
}

function resolvePlanBoundRunnerRunStartOrderChoice(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  const choice = context.input.playerView.pendingChoice;
  if (
    context.input.side !== "runner" ||
    choice?.kind !== "select_cards" ||
    !choice.source.startsWith("runner_run_start.order:")
  ) {
    return undefined;
  }
  const origin = previous?.selectedActionOrigin;
  const executor = previous?.instances.find(
    (instance) =>
      instance.instanceId === origin?.executorInstanceId &&
      instance.executionState === "executor",
  );
  const root = previous?.instances.find(
    (instance) => instance.instanceId === origin?.rootPlanInstanceId,
  );
  const choiceActions = context.input.legalActions.filter(
    (action) => action.type === "resolve_choice",
  );
  const action = choiceActions.length === 1 ? choiceActions[0] : undefined;
  const [requirement] = action?.choiceRequirements ?? [];
  const optionIds = choice.options.map((option) => option.id);
  const sourceRunId = /^runner_run_start\.order:([^:\s]+)$/.exec(
    choice.source,
  )?.[1];
  const originIsRunStartOrder =
    origin?.immediateChoicePolicy === "resolve_runner_run_start_order";
  const continuationEvents = (context.input.eventTail ?? []).filter(
    (event) =>
      originIsRunStartOrder &&
      event.stateVersionBefore >= origin.selectedAtStateVersion &&
      // The setup snapshot (v0 -> v0) is not a selected action transition.
      event.stateVersionAfter > origin.selectedAtStateVersion &&
      event.stateVersionAfter <= context.input.playerView.stateVersion,
  );
  const exactRunStartContinuation =
    originIsRunStartOrder &&
    continuationEvents.length >= 1 &&
    continuationEvents[0]?.stateVersionBefore ===
      origin.selectedAtStateVersion &&
    continuationEvents[0]?.publicPayload?.actor === "runner" &&
    continuationEvents[0]?.publicPayload?.actionType ===
      origin.sourceActionType &&
    continuationEvents.every(
      (event, index) =>
        event.stateVersionAfter === event.stateVersionBefore + 1 &&
        (index === 0 ||
          (continuationEvents[index - 1]?.stateVersionAfter ===
            event.stateVersionBefore &&
            event.publicPayload?.actor === "runner" &&
            event.publicPayload?.actionType === "resolve_choice")),
    ) &&
    continuationEvents.at(-1)?.stateVersionAfter ===
      context.input.playerView.stateVersion;
  const exactBinding =
    originIsRunStartOrder &&
    choice.side === "runner" &&
    choice.choiceId ===
      `runner_run_start_order_${context.input.playerView.stateVersion}` &&
    sourceRunId !== undefined &&
    sourceRunId === context.input.playerView.run?.runId &&
    choice.visibility === "hidden_info_barrier" &&
    choice.stateVersion === context.input.playerView.stateVersion &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    previous !== undefined &&
    previous.side === "runner" &&
    previous.stateVersion === context.input.playerView.stateVersion - 1 &&
    origin.selectedAtStateVersion <= previous.stateVersion &&
    origin.continuedThroughStateVersion === previous.stateVersion &&
    exactRunStartContinuation &&
    ((origin.sourceActionType === "start_run" &&
      origin.selectedActionId.startsWith("runner.start_run.")) ||
      (origin.sourceActionType === "play_event" &&
        origin.selectedActionId.startsWith("runner.play_event.")) ||
      (origin.sourceActionType === "activated_card_ability" &&
        origin.selectedActionId.startsWith(
          "runner.activated_card_ability.",
        ))) &&
    origin.sourceStepId.trim().length > 0 &&
    previous.rootForegroundInstanceId === origin.rootPlanInstanceId &&
    previous.executorInstanceId === origin.executorInstanceId &&
    root?.side === "runner" &&
    executor?.side === "runner" &&
    action !== undefined &&
    action.side === "runner" &&
    action.source === "game_rule" &&
    action.expiresAtStateVersion === context.input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === choice.minSelections &&
    requirement.maxSelections === choice.maxSelections &&
    requirement.optionIds.length === optionIds.length &&
    optionIds.every((optionId) => requirement.optionIds.includes(optionId));
  if (!exactBinding || !action || !previous || !origin) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map(
        (legalAction) => legalAction.type,
      ),
      unresolvedActionIds: choiceActions.map(
        (legalAction) => legalAction.actionId,
      ),
      owner: "continuation",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
      removalCondition:
        "Resolve Runner run-start ordering only from the exact plan-owned start-run route and its contiguous same-run ordering choices, exact root and executor, active run and complete current Engine choice contract.",
    });
  }
  return {
    actionId: action.actionId,
    reasonCode: "plan_bound_runner_run_start_order_choice",
    origin: {
      rootPlanInstanceId: origin.rootPlanInstanceId,
      leafPlanInstanceId: origin.executorInstanceId,
      side: "runner",
      windowKind: "mandatory_choice",
      windowId: choice.choiceId,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
    },
  };
}

function resolvePlanBoundRunnerTraceBaseLinkChoice(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  const choice = context.input.playerView.pendingChoice;
  if (
    context.input.side !== "runner" ||
    !choice?.source.startsWith("trace_base_link:")
  ) {
    return undefined;
  }
  const executor = previous?.instances.find(
    (instance) =>
      instance.instanceId === previous.executorInstanceId &&
      (instance.moduleId === "runner.convert_run_window" ||
        instance.moduleId === "runner.pressure_central" ||
        instance.moduleId === "runner.contest_remote") &&
      instance.executionState === "executor",
  );
  const executorState = executor?.moduleState as
    | {
        kind?: unknown;
        signal?: { serverId?: unknown };
        traceBaseLinkChoiceBinding?: {
          choiceId: string;
          actionId: string;
          selectedOptionId: string;
          sourceCardInstanceId?: string;
          observedAtStateVersion: number;
        };
      }
    | undefined;
  const root = previous?.instances.find(
    (instance) => instance.instanceId === previous.rootForegroundInstanceId,
  );
  const choiceActions = context.input.legalActions.filter(
    (action) => action.type === "resolve_choice",
  );
  const action = choiceActions.length === 1 ? choiceActions[0] : undefined;
  const [requirement] = action?.choiceRequirements ?? [];
  const optionIds = choice.options.map((option) => option.id);
  const selected = planBoundRunnerTraceBaseLinkOption(context.input, choice);
  const traceId = choice.source.slice("trace_base_link:".length);
  const exactBinding =
    previous !== undefined &&
    previous.side === "runner" &&
    previous.stateVersion < context.input.playerView.stateVersion &&
    root?.side === "runner" &&
    executor !== undefined &&
    (executor.parentInstanceId === root.instanceId ||
      executor.instanceId === root.instanceId) &&
    (executorState?.kind === "run_window" ||
      executorState?.kind === "central_pressure" ||
      executorState?.kind === "remote_contest") &&
    executorState.signal?.serverId ===
      context.input.playerView.run?.attackedServerId &&
    context.input.playerView.trace?.traceId === traceId &&
    context.input.playerView.trace.phase === "base_link" &&
    choice.side === "runner" &&
    choice.kind === "select_option" &&
    choice.stateVersion === context.input.playerView.stateVersion &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    selected !== undefined &&
    action !== undefined &&
    action.side === "runner" &&
    action.source === "game_rule" &&
    action.expiresAtStateVersion === context.input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === optionIds.length &&
    optionIds.every((optionId) => requirement.optionIds.includes(optionId));
  if (
    !exactBinding ||
    !action ||
    !root ||
    !executor ||
    !executorState ||
    !selected
  ) {
    const failedChecks = [
      ["previous", previous !== undefined],
      ["previous_side", previous?.side === "runner"],
      [
        "previous_state",
        previous !== undefined &&
          previous.stateVersion < context.input.playerView.stateVersion,
      ],
      ["root_side", root?.side === "runner"],
      ["executor", executor !== undefined],
      [
        "executor_kind",
        ["run_window", "central_pressure", "remote_contest"].includes(
          String(executorState?.kind),
        ),
      ],
      [
        "server",
        executorState?.signal?.serverId ===
          context.input.playerView.run?.attackedServerId,
      ],
      ["trace", context.input.playerView.trace?.traceId === traceId],
      ["phase", context.input.playerView.trace?.phase === "base_link"],
      ["selection", selected !== undefined],
      ["action", action !== undefined],
      ["action_source", action?.source === "game_rule"],
      [
        "action_state",
        action?.expiresAtStateVersion === context.input.playerView.stateVersion,
      ],
      ["choice_requirement", requirement?.choiceId === choice.choiceId],
    ]
      .filter(([, valid]) => !valid)
      .map(([name]) => name)
      .join(",");
    throw new PlanResolutionFailure("window_origin_missing", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map(
        (legalAction) => legalAction.type,
      ),
      unresolvedActionIds: choiceActions.map(
        (legalAction) => legalAction.actionId,
      ),
      owner: "continuation",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
      removalCondition: `Resolve a Trace Base-Link choice only from the active Runner run-plan executor, exact current Trace and complete Engine choice contract. Failed=${failedChecks || "unknown"}.`,
    });
  }
  executorState.traceBaseLinkChoiceBinding = {
    choiceId: choice.choiceId,
    actionId: action.actionId,
    selectedOptionId: selected.optionId,
    ...(selected.sourceCardInstanceId
      ? { sourceCardInstanceId: selected.sourceCardInstanceId }
      : {}),
    observedAtStateVersion: context.input.playerView.stateVersion,
  };
  return {
    actionId: action.actionId,
    reasonCode: "plan_bound_runner_trace_base_link_choice",
    origin: {
      rootPlanInstanceId: root.instanceId,
      leafPlanInstanceId: executor.instanceId,
      side: "runner",
      windowKind: "mandatory_choice",
      windowId: choice.choiceId,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
    },
  };
}

function planBoundRunnerTraceBaseLinkOption(
  input: AiDecisionInput,
  choice: NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>,
): { optionId: string; sourceCardInstanceId?: string } | undefined {
  const pass = choice.options.find((option) => option.id === "pass");
  if (!pass) return undefined;
  const quote = input.playerView.own.runnerTraceSupportQuote;
  const baseline = quote?.baseLinkOptions.find(
    (option) => option.sourceDefinitionId === undefined,
  );
  const baselineCapacity =
    (baseline?.baseLink ?? input.playerView.trace?.runnerLink ?? 0) +
    input.playerView.own.credits -
    (baseline?.activationCost ?? 0);
  const candidates = choice.options
    .flatMap((option) => {
      if (typeof option.value !== "string") return [];
      const sourceCard = (input.playerView.own.rig ?? []).find(
        (card) =>
          card.known &&
          card.instanceId === option.value &&
          typeof card.definitionId === "string",
      );
      if (!sourceCard?.definitionId) return [];
      const support = quote?.baseLinkOptions.find(
        (entry) =>
          entry.sourceDefinitionId === sourceCard.definitionId &&
          entry.safeForAccess &&
          entry.activationCost <= input.playerView.own.credits,
      );
      if (!support) return [];
      return [
        {
          optionId: option.id,
          sourceCardInstanceId: sourceCard.instanceId,
          capacity:
            support.baseLink +
            input.playerView.own.credits -
            support.activationCost,
          activationCost: support.activationCost,
        },
      ];
    })
    .filter((candidate) => candidate.capacity > baselineCapacity)
    .sort(
      (left, right) =>
        right.capacity - left.capacity ||
        left.activationCost - right.activationCost ||
        left.optionId.localeCompare(right.optionId),
    );
  const selected = candidates[0];
  return selected
    ? {
        optionId: selected.optionId,
        sourceCardInstanceId: selected.sourceCardInstanceId,
      }
    : { optionId: pass.id };
}

function resolvePlanBoundRunnerTraceSuccessCancelChoice(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  const choice = context.input.playerView.pendingChoice;
  if (
    context.input.side !== "runner" ||
    !choice?.source.startsWith("trace_success_cancel:")
  ) {
    return undefined;
  }
  const executor = previous?.instances.find(
    (instance) =>
      instance.instanceId === previous.executorInstanceId &&
      (instance.moduleId === "runner.convert_run_window" ||
        instance.moduleId === "runner.pressure_central" ||
        instance.moduleId === "runner.contest_remote") &&
      instance.executionState === "executor",
  );
  const executorState = executor?.moduleState as
    | {
        kind?: unknown;
        signal?: { serverId?: unknown };
        traceSuccessCancelChoiceBinding?: {
          choiceId: string;
          actionId: string;
          selectedOptionId: string;
          sourceCardInstanceId?: string;
          observedAtStateVersion: number;
        };
      }
    | undefined;
  const root = previous?.instances.find(
    (instance) => instance.instanceId === previous.rootForegroundInstanceId,
  );
  const choiceActions = context.input.legalActions.filter(
    (action) => action.type === "resolve_choice",
  );
  const action = choiceActions.length === 1 ? choiceActions[0] : undefined;
  const [requirement] = action?.choiceRequirements ?? [];
  const optionIds = choice.options.map((option) => option.id);
  const selected = planBoundRunnerTraceSuccessCancelOption(
    context.input,
    choice,
  );
  const traceId = choice.source.slice("trace_success_cancel:".length);
  const exactBinding =
    previous !== undefined &&
    previous.side === "runner" &&
    previous.stateVersion < context.input.playerView.stateVersion &&
    root?.side === "runner" &&
    executor !== undefined &&
    (executor.parentInstanceId === root.instanceId ||
      executor.instanceId === root.instanceId) &&
    (executorState?.kind === "run_window" ||
      executorState?.kind === "central_pressure" ||
      executorState?.kind === "remote_contest") &&
    executorState.signal?.serverId ===
      context.input.playerView.run?.attackedServerId &&
    context.input.playerView.trace?.traceId === traceId &&
    context.input.playerView.trace.phase === "trace_success_cancel" &&
    choice.side === "runner" &&
    choice.kind === "select_option" &&
    choice.visibility === "hidden_info_barrier" &&
    choice.stateVersion === context.input.playerView.stateVersion &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    selected !== undefined &&
    action !== undefined &&
    action.side === "runner" &&
    action.source === "game_rule" &&
    action.expiresAtStateVersion === context.input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === optionIds.length &&
    optionIds.every((optionId) => requirement.optionIds.includes(optionId));
  if (
    !exactBinding ||
    !action ||
    !root ||
    !executor ||
    !executorState ||
    !selected
  ) {
    const failedChecks = [
      ["previous", previous !== undefined],
      ["previous_side", previous?.side === "runner"],
      [
        "previous_state",
        previous !== undefined &&
          previous.stateVersion < context.input.playerView.stateVersion,
      ],
      ["root_side", root?.side === "runner"],
      ["executor", executor !== undefined],
      [
        "executor_kind",
        ["run_window", "central_pressure", "remote_contest"].includes(
          String(executorState?.kind),
        ),
      ],
      [
        "server",
        executorState?.signal?.serverId ===
          context.input.playerView.run?.attackedServerId,
      ],
      ["trace", context.input.playerView.trace?.traceId === traceId],
      [
        "phase",
        context.input.playerView.trace?.phase === "trace_success_cancel",
      ],
      ["selection", selected !== undefined],
      ["visibility", choice.visibility === "hidden_info_barrier"],
      ["action", action !== undefined],
      ["action_source", action?.source === "game_rule"],
      [
        "action_state",
        action?.expiresAtStateVersion === context.input.playerView.stateVersion,
      ],
      ["choice_requirement", requirement?.choiceId === choice.choiceId],
    ]
      .filter(([, valid]) => !valid)
      .map(([name]) => name)
      .join(",");
    throw new PlanResolutionFailure("window_origin_missing", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map(
        (legalAction) => legalAction.type,
      ),
      unresolvedActionIds: choiceActions.map(
        (legalAction) => legalAction.actionId,
      ),
      owner: "continuation",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
      removalCondition: `Resolve a Trace success-cancel choice only from the active Runner run-plan executor, exact current Trace, installed quoted support source and complete Engine choice contract. Failed=${failedChecks || "unknown"}.`,
    });
  }
  executorState.traceSuccessCancelChoiceBinding = {
    choiceId: choice.choiceId,
    actionId: action.actionId,
    selectedOptionId: selected.optionId,
    ...(selected.sourceCardInstanceId
      ? { sourceCardInstanceId: selected.sourceCardInstanceId }
      : {}),
    observedAtStateVersion: context.input.playerView.stateVersion,
  };
  return {
    actionId: action.actionId,
    reasonCode: "plan_bound_runner_trace_success_cancel_choice",
    origin: {
      rootPlanInstanceId: root.instanceId,
      leafPlanInstanceId: executor.instanceId,
      side: "runner",
      windowKind: "mandatory_choice",
      windowId: choice.choiceId,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
    },
  };
}

function planBoundRunnerTraceSuccessCancelOption(
  input: AiDecisionInput,
  choice: NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>,
): { optionId: string; sourceCardInstanceId?: string } | undefined {
  const pass = choice.options.find((option) => option.id === "pass");
  if (!pass) return undefined;
  const quote = input.playerView.own.runnerTraceSupportQuote;
  const candidates = choice.options
    .flatMap((option) => {
      if (typeof option.value !== "string") return [];
      const sourceCard = (input.playerView.own.rig ?? []).find(
        (card) => card.known && card.instanceId === option.value,
      );
      if (!sourceCard) return [];
      const support = quote?.traceSuccessCancelOptions.find(
        (entry) =>
          entry.sourceCardInstanceId === sourceCard.instanceId &&
          entry.activationCost <= input.playerView.own.credits,
      );
      if (!support) return [];
      return [
        {
          optionId: option.id,
          sourceCardInstanceId: sourceCard.instanceId,
          activationCost: support.activationCost,
        },
      ];
    })
    .sort(
      (left, right) =>
        left.activationCost - right.activationCost ||
        left.optionId.localeCompare(right.optionId),
    );
  const selected = candidates[0];
  return selected
    ? {
        optionId: selected.optionId,
        sourceCardInstanceId: selected.sourceCardInstanceId,
      }
    : { optionId: pass.id };
}

function resolvePlanBoundRunnerBrokenIceVirusCounterChoice(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  const choice = context.input.playerView.pendingChoice;
  if (
    context.input.side !== "runner" ||
    !choice?.source.startsWith("broken_ice.virus_counter:")
  ) {
    return undefined;
  }
  const executor = previous?.instances.find(
    (instance) =>
      instance.instanceId === previous.executorInstanceId &&
      (instance.moduleId === "runner.convert_run_window" ||
        instance.moduleId === "runner.pressure_central" ||
        instance.moduleId === "runner.contest_remote") &&
      instance.executionState === "executor",
  );
  const executorState = executor?.moduleState as
    | {
        kind?: unknown;
        brokenIceVirusCounterChoiceBinding?: {
          choiceId: string;
          actionId: string;
          selectedOptionIds: string[];
          observedAtStateVersion: number;
        };
      }
    | undefined;
  const root = previous?.instances.find(
    (instance) => instance.instanceId === previous.rootForegroundInstanceId,
  );
  const choiceActions = context.input.legalActions.filter(
    (action) => action.type === "resolve_choice",
  );
  const action = choiceActions.length === 1 ? choiceActions[0] : undefined;
  const [requirement] = action?.choiceRequirements ?? [];
  const optionIds = choice.options.map((option) => option.id);
  const selectedOptionIds = planBoundRunnerBrokenIceVirusCounterOptions(
    context.input,
    choice,
  );
  const exactChoiceState =
    choice.source ===
      `broken_ice.virus_counter:${context.input.playerView.stateVersion}` &&
    choice.choiceId ===
      `broken_ice_virus_counter_${context.input.playerView.stateVersion}`;
  const exactBinding =
    previous !== undefined &&
    previous.side === "runner" &&
    previous.stateVersion === context.input.playerView.stateVersion - 1 &&
    root?.side === "runner" &&
    executor !== undefined &&
    (executor.parentInstanceId === root.instanceId ||
      executor.instanceId === root.instanceId) &&
    (executorState?.kind === "run_window" ||
      executorState?.kind === "central_pressure" ||
      executorState?.kind === "remote_contest") &&
    previous.turnPlanCommitment?.status === "active" &&
    previous.turnPlanCommitment.sequenceRootPlanInstanceId ===
      root.instanceId &&
    exactChoiceState &&
    choice.side === "runner" &&
    choice.kind === "select_option" &&
    choice.visibility === "public" &&
    choice.stateVersion === context.input.playerView.stateVersion &&
    choice.minSelections > 0 &&
    choice.maxSelections === choice.minSelections &&
    selectedOptionIds !== undefined &&
    selectedOptionIds.length === choice.minSelections &&
    action !== undefined &&
    action.side === "runner" &&
    action.source === "game_rule" &&
    action.expiresAtStateVersion === context.input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === choice.minSelections &&
    requirement.maxSelections === choice.maxSelections &&
    requirement.optionIds.length === optionIds.length &&
    optionIds.every((optionId) => requirement.optionIds.includes(optionId));
  if (
    !exactBinding ||
    !action ||
    !root ||
    !executor ||
    !executorState ||
    !selectedOptionIds
  ) {
    const failedChecks = [
      ["previous", previous !== undefined],
      ["previous_side", previous?.side === "runner"],
      [
        "previous_state",
        previous?.stateVersion === context.input.playerView.stateVersion - 1,
      ],
      ["root", root?.side === "runner"],
      ["executor", executor !== undefined],
      [
        "executor_kind",
        ["run_window", "central_pressure", "remote_contest"].includes(
          String(executorState?.kind),
        ),
      ],
      ["turn_plan", previous?.turnPlanCommitment?.status === "active"],
      ["choice_state", exactChoiceState],
      ["selection", selectedOptionIds !== undefined],
      ["action", action !== undefined],
      ["action_source", action?.source === "game_rule"],
      [
        "action_state",
        action?.expiresAtStateVersion === context.input.playerView.stateVersion,
      ],
      ["choice_requirement", requirement?.choiceId === choice.choiceId],
    ]
      .filter(([, valid]) => !valid)
      .map(([name]) => name)
      .join(",");
    throw new PlanResolutionFailure("window_origin_missing", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map(
        (legalAction) => legalAction.type,
      ),
      unresolvedActionIds: choiceActions.map(
        (legalAction) => legalAction.actionId,
      ),
      owner: "continuation",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
      removalCondition: `Resolve broken-ICE virus counters only from the immediately preceding active Runner run-plan executor, one complete option group per source and the exact current Engine choice contract. Failed=${failedChecks || "unknown"}.`,
    });
  }
  executorState.brokenIceVirusCounterChoiceBinding = {
    choiceId: choice.choiceId,
    actionId: action.actionId,
    selectedOptionIds,
    observedAtStateVersion: context.input.playerView.stateVersion,
  };
  return {
    actionId: action.actionId,
    reasonCode: "plan_bound_runner_broken_ice_virus_counter_choice",
    origin: {
      rootPlanInstanceId: root.instanceId,
      leafPlanInstanceId: executor.instanceId,
      side: "runner",
      windowKind: "mandatory_choice",
      windowId: choice.choiceId,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
    },
  };
}

function planBoundRunnerBrokenIceVirusCounterOptions(
  input: AiDecisionInput,
  choice: NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>,
): string[] | undefined {
  const targetById = new Map(
    input.playerView.servers.flatMap((server) =>
      server.ice
        .filter(
          (card) =>
            card.known &&
            card.rezzed === true &&
            typeof card.definitionId === "string" &&
            (typeof card.effectiveRunQuote?.effectiveStrength === "number" ||
              typeof card.strength === "number"),
        )
        .map((card) => [card.instanceId, card] as const),
    ),
  );
  const sourceIds = [
    ...new Set(
      choice.options.flatMap((option) =>
        typeof option.metadata?.sourceCardInstanceId === "string"
          ? [option.metadata.sourceCardInstanceId]
          : [],
      ),
    ),
  ].sort();
  if (sourceIds.length !== choice.minSelections) return undefined;
  const selected = sourceIds.flatMap((sourceId) => {
    const candidates = choice.options
      .flatMap((option) => {
        if (
          option.metadata?.sourceCardInstanceId !== sourceId ||
          typeof option.metadata.targetCardInstanceId !== "string" ||
          option.value !== option.metadata.targetCardInstanceId
        ) {
          return [];
        }
        const target = targetById.get(option.metadata.targetCardInstanceId);
        if (!target) return [];
        return [
          {
            optionId: option.id,
            targetId: target.instanceId,
            strength:
              target.effectiveRunQuote?.effectiveStrength ??
              (target.strength ?? 0) + (target.strengthModifier ?? 0),
          },
        ];
      })
      .sort(
        (left, right) =>
          right.strength - left.strength ||
          left.targetId.localeCompare(right.targetId) ||
          left.optionId.localeCompare(right.optionId),
      );
    return candidates[0] ? [candidates[0].optionId] : [];
  });
  return selected.length === sourceIds.length ? selected : undefined;
}

function resolvePlanBoundRunnerVacuumLinkChoice(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  const choice = context.input.playerView.pendingChoice;
  if (
    context.input.side !== "runner" ||
    choice?.source !== "card_implementation.vacuum_link_rewind"
  ) {
    return undefined;
  }
  const origin = previous?.selectedActionOrigin;
  const executor = previous?.instances.find(
    (instance) =>
      instance.instanceId === previous.executorInstanceId &&
      (instance.moduleId === "runner.convert_run_window" ||
        instance.moduleId === "runner.pressure_central" ||
        instance.moduleId === "runner.contest_remote") &&
      instance.executionState === "executor",
  );
  const executorState = executor?.moduleState as
    | {
        kind?: unknown;
        signal?: {
          serverId?: unknown;
          accessCommitment?: { intendedAction?: unknown };
        };
        vacuumLinkChoiceBinding?: {
          choiceId: string;
          actionId: string;
          selectedOptionId: string;
          sourceCardInstanceId: string;
          sourceCardDefinitionId: string;
          observedAtStateVersion: number;
        };
      }
    | undefined;
  const root = previous?.instances.find(
    (instance) => instance.instanceId === previous.rootForegroundInstanceId,
  );
  const choiceActions = context.input.legalActions.filter(
    (action) => action.type === "resolve_choice",
  );
  const action = choiceActions.length === 1 ? choiceActions[0] : undefined;
  const [requirement] = action?.choiceRequirements ?? [];
  const optionIds = choice.options.map((option) => option.id);
  const choiceRunId =
    /^card_implementation\.vacuum_link_rewind:([^:]+):([0-9]+)$/.exec(
      choice.choiceId,
    )?.[1];
  const sourceCard = context.input.playerView.run?.encounteredIce;
  const continuationEvents = (context.input.eventTail ?? []).filter(
    (event) =>
      previous !== undefined &&
      event.stateVersionBefore >= previous.stateVersion &&
      event.stateVersionAfter <= context.input.playerView.stateVersion,
  );
  const firstContinuationEvent = continuationEvents[0];
  const lastContinuationEvent = continuationEvents.at(-1);
  const exactContinuationChain =
    previous !== undefined &&
    continuationEvents.length >= 1 &&
    firstContinuationEvent?.stateVersionBefore === previous.stateVersion &&
    continuationEvents.every(
      (event, index) =>
        event.stateVersionAfter === event.stateVersionBefore + 1 &&
        (index === 0 ||
          continuationEvents[index - 1]?.stateVersionAfter ===
            event.stateVersionBefore),
    ) &&
    firstContinuationEvent.publicPayload?.actor === "runner" &&
    firstContinuationEvent.publicPayload?.actionType ===
      previous?.turnPlanExecutionLease?.actionType &&
    lastContinuationEvent?.stateVersionAfter ===
      context.input.playerView.stateVersion &&
    lastContinuationEvent.publicPayload?.actor === "runner" &&
    lastContinuationEvent.publicPayload?.actionType === "continue_run" &&
    lastContinuationEvent.publicPayload?.resolvedEffects?.some(
      (effect) =>
        effect.kind === "resolve_subroutine" &&
        effect.sourceDefinitionId === choice.sourceCardDefinitionId,
    ) === true &&
    continuationEvents.slice(1, -1).every((event) => {
      const payload = event.publicPayload;
      const isCorpRezPass =
        payload?.actor === "corp" &&
        (payload.actionType === "rez_ice" ||
          payload.actionType === "decline_rez");
      const isBoundRunnerRunContinuation =
        payload?.actor === "runner" &&
        payload.actionType === "continue_run" &&
        payload.abilityFamily === "run-access" &&
        payload.serverId === context.input.playerView.run?.attackedServerId;
      return isCorpRezPass || isBoundRunnerRunContinuation;
    });
  const immediateOriginMatches =
    origin?.immediateChoicePolicy === "resolve_runner_vacuum_link_rewind" &&
    origin.selectedAtStateVersion === previous?.stateVersion &&
    origin.sourceActionType === "continue_run" &&
    origin.rootPlanInstanceId === previous?.rootForegroundInstanceId &&
    origin.executorInstanceId === previous?.executorInstanceId;
  const executionLease = previous?.turnPlanExecutionLease;
  const cardRunStartOriginMatches =
    origin?.immediateChoicePolicy === "resolve_runner_run_start_order" &&
    origin.selectedAtStateVersion === previous?.stateVersion &&
    origin.rootPlanInstanceId === previous?.rootForegroundInstanceId &&
    origin.executorInstanceId === previous?.executorInstanceId &&
    origin.selectedActionId === executionLease?.currentBinding.actionId &&
    origin.sourceActionType === executionLease?.actionType &&
    (origin.sourceActionType === "play_event" ||
      origin.sourceActionType === "activated_card_ability");
  const commitment = previous?.turnPlanCommitment;
  const committedPhase = commitment?.phases?.[commitment.cursor.phaseIndex];
  const exactCommittedRunExecutor =
    executor !== undefined &&
    root !== undefined &&
    executor.parentInstanceId === root.instanceId &&
    commitment?.sequenceRootPlanInstanceId === executor.instanceId &&
    committedPhase?.root.planInstanceId === executor.instanceId &&
    committedPhase.phaseId === executionLease?.phaseId &&
    committedPhase.nodes[commitment.cursor.nodeIndex]?.nodeId ===
      executionLease?.nodeId;
  const turnPlanContinuationMatches =
    previous !== undefined &&
    commitment?.status === "active" &&
    (commitment.sequenceRootPlanInstanceId ===
      previous.rootForegroundInstanceId ||
      exactCommittedRunExecutor) &&
    executionLease !== undefined &&
    executionLease.commitmentId === commitment.commitmentId &&
    executionLease.sourcePlanId === commitment.sourcePlanId &&
    executionLease.currentBinding.stateVersion === previous.stateVersion &&
    (executionLease.actionType === "continue_run" ||
      executionLease.actionType === "start_run" ||
      cardRunStartOriginMatches);
  const exactBinding =
    (immediateOriginMatches ||
      (turnPlanContinuationMatches && exactContinuationChain)) &&
    choice.side === "runner" &&
    choice.kind === "select_option" &&
    choice.visibility === "public" &&
    choice.stateVersion === context.input.playerView.stateVersion &&
    sourceCard !== undefined &&
    sourceCard.instanceId === choice.sourceCardInstanceId &&
    sourceCard.definitionId === choice.sourceCardDefinitionId &&
    typeof choiceRunId === "string" &&
    choiceRunId.length > 0 &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    optionIds.length === 2 &&
    optionIds.includes("resume_from_rezzed_ice_back") &&
    optionIds.includes("jack_out") &&
    previous !== undefined &&
    previous.side === "runner" &&
    previous.stateVersion < context.input.playerView.stateVersion &&
    root?.side === "runner" &&
    executor !== undefined &&
    (executor.parentInstanceId === root.instanceId ||
      executor.instanceId === root.instanceId) &&
    (executorState?.kind === "run_window" ||
      executorState?.kind === "central_pressure" ||
      executorState?.kind === "remote_contest") &&
    executorState.signal?.serverId ===
      context.input.playerView.run?.attackedServerId &&
    typeof executorState.signal?.accessCommitment?.intendedAction ===
      "string" &&
    action !== undefined &&
    action.side === "runner" &&
    action.source === "game_rule" &&
    action.expiresAtStateVersion === context.input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === optionIds.length &&
    optionIds.every((optionId) => requirement.optionIds.includes(optionId));
  if (!exactBinding || !action || !previous || !executor || !executorState) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map(
        (legalAction) => legalAction.type,
      ),
      unresolvedActionIds: choiceActions.map(
        (legalAction) => legalAction.actionId,
      ),
      owner: "continuation",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
      removalCondition:
        "Resolve Vacuum Link only from an exact active Runner run-plan route, its bounded start/continue event chain and the complete current Engine choice contract.",
    });
  }
  executorState.vacuumLinkChoiceBinding = {
    choiceId: choice.choiceId,
    actionId: action.actionId,
    selectedOptionId: "resume_from_rezzed_ice_back",
    sourceCardInstanceId: choice.sourceCardInstanceId!,
    sourceCardDefinitionId: choice.sourceCardDefinitionId!,
    observedAtStateVersion: context.input.playerView.stateVersion,
  };
  return {
    actionId: action.actionId,
    reasonCode: "plan_bound_runner_vacuum_link_rewind_choice",
    origin: {
      rootPlanInstanceId: previous.rootForegroundInstanceId!,
      leafPlanInstanceId: executor.instanceId,
      side: "runner",
      windowKind: "mandatory_choice",
      windowId: choice.choiceId,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
    },
  };
}

function resolveEngineWindow(
  context: PlanSchedulerContext,
): EngineWindowResolution | undefined {
  if (
    context.input.side === "corp" &&
    context.input.playerView.pendingChoice?.source.startsWith(
      "p3_35.access_payment:",
    )
  ) {
    return undefined;
  }
  if (
    context.input.side === "corp" &&
    context.input.playerView.pendingChoice?.kind === "select_option" &&
    context.input.playerView.pendingChoice.source.startsWith("corp_start.rez:")
  ) {
    return undefined;
  }
  if (
    context.input.side === "runner" &&
    context.input.playerView.pendingChoice?.kind === "select_cards" &&
    context.input.playerView.pendingChoice.source === "discard_phase"
  ) {
    return undefined;
  }
  if (
    context.input.side === "corp" &&
    context.input.playerView.pendingChoice?.kind === "select_cards" &&
    context.input.playerView.pendingChoice.source.startsWith(
      "proteus.return_runner_programs:",
    )
  ) {
    return undefined;
  }
  if (
    context.input.side === "corp" &&
    context.input.playerView.pendingChoice?.kind === "select_cards" &&
    context.input.playerView.pendingChoice.source === "discard_phase"
  ) {
    return undefined;
  }
  if (
    context.input.side === "corp" &&
    context.input.playerView.pendingChoice?.kind === "select_cards" &&
    context.input.playerView.pendingChoice.source.startsWith(
      "classic.corporate_shuffle_hq_to_rd:",
    )
  ) {
    return undefined;
  }
  if (
    context.input.side === "corp" &&
    context.input.playerView.pendingChoice?.kind === "select_cards" &&
    context.input.playerView.pendingChoice.source.startsWith(
      "card_implementation.strategic_planning_group_draw:",
    )
  ) {
    return undefined;
  }
  if (
    context.input.playerView.pendingChoice?.source.startsWith(
      "card_implementation.agenda_purge_install_targets:",
    )
  ) {
    return undefined;
  }
  if (
    context.input.playerView.pendingChoice?.source.startsWith(
      "card_implementation.classic_deflector:",
    )
  ) {
    return undefined;
  }
  if (
    context.input.playerView.pendingChoice?.source.startsWith(
      "runner.installed_resource_trash_for_credits:",
    )
  ) {
    return undefined;
  }
  const actionIds = new Set(
    context.input.legalActions.map((action) => action.actionId),
  );
  if (actionIds.size !== 1) return undefined;
  const [singleActionId] = actionIds;
  const onlyLegalAction = context.input.legalActions.find(
    (action) => action.actionId === singleActionId,
  );
  const onlyActionId = onlyLegalAction?.actionId;
  if (!onlyActionId) return undefined;
  const candidate = context.actionCandidates.find(
    (current) =>
      current.actionId === onlyActionId &&
      engineWindowSemanticIsAutomatic(current.semanticActionType),
  );
  const semantic = candidate?.semanticActionType;
  if (!semantic) return undefined;
  return {
    actionId: onlyActionId,
    reasonCode: "engine_window_single_legal_resolution",
    origin: {
      rootPlanInstanceId: context.input.playerView.run
        ? `run:${context.input.playerView.run.runId ?? "active"}`
        : "rules",
      leafPlanInstanceId: "rules.window_resolution",
      side: context.input.side,
      windowKind: windowKindForSemantic(semantic),
      windowId: `${context.input.playerView.timingPoint}:${context.input.playerView.stateVersion}`,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
    },
  };
}

function engineWindowSemanticIsAutomatic(semantic: string): boolean {
  return (
    semantic === "choice.resolve" ||
    semantic === "draw.mandatory" ||
    semantic === "run.continue" ||
    semantic === "corp_window.decline_rez" ||
    semantic === "turn_flow.forgo_action"
  );
}

function attachActiveRunContext(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): ActionSemanticCandidate[] {
  const serverId = input.playerView.run?.attackedServerId;
  if (!serverId) return [...candidates];
  return candidates.map((candidate) => {
    if (
      candidate.runProjectionSummary ||
      !isRunnerRunWindowCandidate(input, candidate)
    ) {
      return candidate;
    }
    return {
      ...candidate,
      runProjectionSummary: {
        serverId,
        serverKind:
          serverId === "hq" || serverId === "rd" || serverId === "archives"
            ? serverId
            : "remote",
        source: "target_context",
        evidence: ["active_run_server_from_player_view"],
      },
      evidence: [...candidate.evidence, "active_run_server_from_player_view"],
    };
  });
}

function planFirstDecisionDebug(params: {
  input: AiDecisionInput;
  context: PlanSchedulerContext;
  result: PlanSchedulerResult;
  registry: SidePlanRegistry;
  selectedChoicesForDecision: PlanFirstLiveDependencies["selectedChoicesForDecision"];
  action: LegalAction;
  planId: string;
  planKind: string | undefined;
  assessmentEvidenceCodes: readonly string[];
  turnPlanningDebug?: AiTurnPlanningDebug;
}): AiPlanFirstDecisionDebug {
  const strategicIntent = (params.input as AiDecisionInputWithDeckCapabilities)
    .ownStrategicIntentState;
  const base = {
    schemaVersion: AI_PLAN_FIRST_DECISION_DEBUG_SCHEMA_VERSION,
    stateVersion: params.input.playerView.stateVersion,
    strategicContext: {
      authority: "diagnostic_only" as const,
      ...(strategicIntent?.primaryStrategy.strategyId
        ? { primaryStrategyId: strategicIntent.primaryStrategy.strategyId }
        : {}),
      ...(strategicIntent?.phase ? { phase: strategicIntent.phase } : {}),
      signals: [],
    },
    dispositions: (params.context.actionDispositions ?? []).map(
      (disposition) => ({ ...disposition }),
    ),
  };
  if (params.result.lane === "engine_window") {
    return {
      ...base,
      lane: "engine_window",
      selectionAuthority: "engine_window",
      rootPlanInstanceId: params.result.origin.rootPlanInstanceId,
      leafExecutorInstanceId: params.result.origin.leafPlanInstanceId,
      executionOrigin: structuredClone(params.result.origin),
      selectedStep: {
        planInstanceId: params.result.origin.leafPlanInstanceId,
        stepId: params.result.origin.windowId,
      },
      engineWindowAction: {
        actionId: params.action.actionId,
        actionType: params.action.type,
        reasonCode:
          params.result.diagnostics.find((event) => event.stage === "window")
            ?.code ?? "engine_window_resolution",
      },
      engineQuoteEvidence: {
        status: "not_reported",
        evidenceCodes: [],
      },
      assessmentEvidenceCodes: [],
      portfolio: [],
    };
  }

  const selectedPlan = params.result.portfolio.instances.find(
    (instance) => instance.instanceId === params.planId,
  );
  if (!selectedPlan) {
    throw new Error("plan_first_selected_plan_instance_missing");
  }
  const rootPlanInstanceId =
    params.result.portfolio.rootForegroundInstanceId ?? params.planId;
  const leafPlanInstanceId =
    params.result.portfolio.executorInstanceId ?? params.planId;
  const assessment = params.result.selectedAssessment;
  const actionCandidate = params.context.actionCandidates.find(
    (candidate) => candidate.actionId === params.action.actionId,
  );
  const assessmentEvidenceCodes = uniquePlanFirstDebugCodes([
    ...params.assessmentEvidenceCodes,
    ...assessment.evidenceCodes,
    ...selectedPlan.evidenceRefs.map((reference) => reference.code),
    ...(actionCandidate?.evidence ?? []),
  ]);
  const quoteEvidenceCodes = assessmentEvidenceCodes.filter((code) =>
    /(?:quote|engine_certified|exact_(?:cost|payment|liquid)|cost_semantics)/i.test(
      code,
    ),
  );
  const quoteStatus: AiPlanFirstDecisionDebug["engineQuoteEvidence"]["status"] =
    quoteEvidenceCodes.some((code) =>
      /(?:unknown|missing|malformed|stale|incomplete|unsupported)/i.test(code),
    )
      ? "unknown"
      : quoteEvidenceCodes.some((code) =>
            /(?:engine_certified|quote.*(?:complete|certified)|exact_(?:cost|payment|liquid))/i.test(
              code,
            ),
          )
        ? "certified"
        : "not_reported";
  const priority = assessment.priorityValidation;
  const p6Contract =
    priority.effectiveClass === "P6"
      ? planFirstP6Contract(
          selectedPlan.moduleId,
          assessment.priorityClaim.reasonCode,
          assessmentEvidenceCodes,
        )
      : undefined;
  let turnPlanning = params.turnPlanningDebug;
  if (!turnPlanning) {
    try {
      turnPlanning = turnPlanningProjectionDebug({
        input: params.input,
        context: params.context,
        result: params.result,
        actionCandidate,
        selectedPlan,
      });
    } catch {
      // Runner projection remains diagnostic-only until its separate cutover.
      turnPlanning = undefined;
    }
  }
  const supportBinding = turnPlanning?.selectedLine.phases
    .flatMap((phase) => phase.supportBindings)
    .find((binding) => binding.planInstanceId === leafPlanInstanceId);
  const selectedRunQuote = selectedRunnerRunDebugQuote(
    params.input,
    params.context,
    params.action,
  );

  return {
    ...base,
    lane: "plan",
    selectionAuthority:
      params.turnPlanningDebug?.mode === "cutover"
        ? "turn_plan_commitment"
        : "resident_plan_instance",
    rootPlanInstanceId,
    leafExecutorInstanceId: leafPlanInstanceId,
    executionOrigin: {
      rootPlanInstanceId,
      leafPlanInstanceId,
      ...(params.result.portfolio.turnPlanCommitment?.commitmentId
        ? {
            commitmentId:
              params.result.portfolio.turnPlanCommitment.commitmentId,
          }
        : {}),
      side: params.input.side,
      windowKind: planDecisionWindowKindForSemantic(
        params.result.route.head.semanticActionType,
      ),
      windowId: decisionWindowId(
        params.input,
        params.result.route.head.semanticActionType,
      ),
      stateVersion: params.input.playerView.stateVersion,
      timingPoint: params.input.playerView.timingPoint,
    },
    selectedStep: {
      planInstanceId: params.result.route.planInstanceId,
      stepId: params.result.route.step.stepId,
      ...(selectedPlan.parentInstanceId
        ? { parentInstanceId: selectedPlan.parentInstanceId }
        : {}),
      ...((selectedPlan.parentNeedId ?? priority.needId)
        ? { needId: selectedPlan.parentNeedId ?? priority.needId }
        : {}),
      ...(supportBinding
        ? { supportAssignmentId: supportBinding.assignmentId }
        : {}),
    },
    ...(selectedRunQuote ? { selectedRunQuote } : {}),
    selectedPlan: planFirstDebugPlanInstance(selectedPlan),
    priority: {
      requestedClass: assessment.priorityClaim.requestedClass,
      effectiveClass: priority.effectiveClass,
      reasonCode: assessment.priorityClaim.reasonCode,
      horizon: assessment.priorityClaim.horizon,
      readiness: assessment.readiness,
      intentFit: assessment.intentFit,
      validationReasonCodes: [...priority.reasonCodes],
      ...(priority.delegatedFromPlanInstanceId
        ? {
            delegatedFromPlanInstanceId: priority.delegatedFromPlanInstanceId,
          }
        : {}),
      ...(priority.needId || selectedPlan.parentNeedId
        ? { parentNeedId: priority.needId ?? selectedPlan.parentNeedId }
        : {}),
      ...(assessment.priorityClaim.witness
        ? {
            witness: {
              kind: assessment.priorityClaim.witness.kind,
              evidenceCode: assessment.priorityClaim.witness.evidenceCode,
              guarantee: assessment.priorityClaim.witness.guarantee,
              ...(assessment.priorityClaim.witness.target
                ? { target: { ...assessment.priorityClaim.witness.target } }
                : {}),
            },
          }
        : {}),
      ...(p6Contract ? { p6Contract } : {}),
    },
    route: {
      planInstanceId: params.result.route.planInstanceId,
      stepId: params.result.route.step.stepId,
      capabilityId: params.result.route.step.capability.capabilityId,
      purpose: params.result.route.step.purpose,
      actionId: params.result.route.head.actionId,
      actionType: params.result.route.head.actionType,
      semanticActionType: params.result.route.head.semanticActionType,
      stateVersion: params.result.route.head.stateVersion,
      ...((params.result.route.head.target ?? params.result.route.step.target)
        ? {
            target: {
              ...(params.result.route.head.target ??
                params.result.route.step.target)!,
            },
          }
        : {}),
      ...(params.result.route.continuation
        ? {
            continuation: {
              continuationId: params.result.route.continuation.continuationId,
              trigger: params.result.route.continuation.trigger,
              nextCapabilityId:
                params.result.route.continuation.nextCapability.capabilityId,
              purpose: params.result.route.continuation.purpose,
              ...(params.result.route.continuation.target
                ? { target: { ...params.result.route.continuation.target } }
                : {}),
            },
          }
        : {}),
    },
    strategicContext: {
      ...base.strategicContext,
      intentFit: assessment.intentFit,
      signals: (assessment.transientSignals ?? []).map((signal) => ({
        signalId: signal.signalId,
        kind: signal.kind,
        scope: signal.scope,
        planModuleId: signal.planModuleId,
        planDedupeKey: signal.planDedupeKey,
        evidenceCode: signal.evidenceCode,
        guarantee: signal.guarantee,
        ...(signal.target ? { target: { ...signal.target } } : {}),
      })),
    },
    engineQuoteEvidence: {
      status: quoteStatus,
      evidenceCodes: quoteEvidenceCodes,
    },
    assessmentEvidenceCodes,
    portfolio: params.result.portfolio.instances.map(
      planFirstDebugPlanInstance,
    ),
    ...(turnPlanning ? { turnPlanning } : {}),
  };
}

function turnPlanningProjectionDebug(params: {
  input: AiDecisionInput;
  context: PlanSchedulerContext;
  result: Extract<PlanSchedulerResult, { lane: "plan" }>;
  actionCandidate: ActionSemanticCandidate | undefined;
  selectedPlan: ResidentPlanPortfolio["instances"][number];
}): AiTurnPlanningDebug | undefined {
  const extendedInput = params.input as AiDecisionInputWithDeckCapabilities;
  const rulesContext = extendedInput.planningRulesContext;
  const stateIdentity = extendedInput.planningStateIdentity;
  const candidate = params.actionCandidate;
  if (!rulesContext || !stateIdentity || !candidate) {
    return undefined;
  }

  const turnKey = `${params.input.side}:turn:${
    params.input.playerView.turnSerial ?? "unknown"
  }`;
  const entryFrame = buildProjectedDecisionFrame({
    input: params.input,
    rulesContext,
    stateIdentity,
    turnKey,
  });
  const isDrawObservationBoundary =
    candidate.actionType === "draw_card" ||
    (candidate.economyProjection?.cardsDrawn !== undefined &&
      candidate.economyProjection.cardsDrawn > 0);
  const remainingCapacity = {
    minimum: Math.max(
      0,
      entryFrame.actionCapacityLedger.unrestricted.minimum -
        (candidate.costProfile.clickCost ?? 0),
    ),
    maximum: Math.max(
      0,
      entryFrame.actionCapacityLedger.unrestricted.maximum -
        (candidate.costProfile.clickCost ?? 0),
    ),
  };
  const boundary = isDrawObservationBoundary
    ? assessTurnObservationBoundary({
        boundaryKind: "private_observation",
        remainingActionCapacity: remainingCapacity,
        residualTurnValueBasis: "hand_quality_distribution",
        immediateOutcomeCodes: ["own_draw_identity_observed"],
        uncertainty: [{ code: "post_draw_replanning_required" }],
        assumptionIds: ["current_legal_action_remains_executable"],
      })
    : runnerDelayedInstallReplanningBoundary(
        params.input,
        candidate,
        remainingCapacity,
      );
  const projectedCandidate = {
    ...candidate,
    stateVersion: stateIdentity.stateVersion,
  };
  const delta = certifiedTurnProjectionDeltaFromCandidate({
    frame: entryFrame,
    candidate: projectedCandidate,
    ...(boundary ? { boundary } : {}),
  });
  const projectedFrame = applyCertifiedTurnProjectionDelta(entryFrame, delta);
  const invocation = buildCanonicalLegalActionInvocation({
    stateIdentity,
    semanticActionType: candidate.semanticActionType,
    ...(candidate.sourceCardInstanceId
      ? { sourceCardInstanceId: candidate.sourceCardInstanceId }
      : {}),
    ...(candidate.abilityId &&
    candidate.abilityBindingMethod === "canonical_capability_id"
      ? {
          sourceAbilityBinding: {
            kind: "card_spec_capability_key" as const,
            sourceAbilityId: candidate.abilityId,
          },
        }
      : {}),
  });
  const rootPlanInstanceId =
    params.result.portfolio.rootForegroundInstanceId ??
    params.selectedPlan.instanceId;
  const rootPlan =
    params.result.portfolio.instances.find(
      (instance) => instance.instanceId === rootPlanInstanceId,
    ) ?? params.selectedPlan;
  const agendaProject =
    params.input.side === "corp" && rootPlan.moduleId === "corp.score_agenda"
      ? (
          params.context.domain as CorpPlanDomain | undefined
        )?.scoreProjects.find(
          (project) => project.projectId === rootPlan.dedupeKey,
        )
      : undefined;
  const agendaSlice = agendaProject
    ? buildCorpAgendaTurnPlanningSlice({
        input: params.input,
        project: agendaProject,
        candidates: params.context.actionCandidates,
        ...((params.context.domain as CorpPlanDomain | undefined)?.defenseNeeds
          ? {
              defenseNeeds: (params.context.domain as CorpPlanDomain)
                .defenseNeeds,
            }
          : {}),
        ...((params.context.domain as CorpPlanDomain | undefined)?.economyNeeds
          ? {
              economyNeeds: (params.context.domain as CorpPlanDomain)
                .economyNeeds,
            }
          : {}),
        rulesContext,
        stateIdentity,
      })
    : undefined;
  const corpDomain =
    params.input.side === "corp"
      ? (params.context.domain as CorpPlanDomain | undefined)
      : undefined;
  const defenseSlice = corpDomain
    ? buildCorpDefenseTurnPlanningSlice({
        input: params.input,
        defenseNeeds: corpDomain.defenseNeeds,
        economyNeeds: corpDomain.economyNeeds,
        candidates: params.context.actionCandidates,
        stateIdentity,
      })
    : undefined;
  const supportBindings = params.selectedPlan.parentNeedId
    ? [
        {
          planInstanceId: params.selectedPlan.instanceId,
          parentNeedId: params.selectedPlan.parentNeedId,
          assignmentId: turnPlanningFingerprint("support-assignment", {
            planInstanceId: params.selectedPlan.instanceId,
            parentNeedId: params.selectedPlan.parentNeedId,
            turnKey,
          }),
        },
      ]
    : [];
  const nodeId = turnPlanningFingerprint("turn-node", {
    invocationKey: invocation.invocationKey,
    rootPlanInstanceId,
    leafPlanInstanceId: params.selectedPlan.instanceId,
  });
  const phaseId = turnPlanningFingerprint("turn-phase", {
    rootPlanInstanceId,
    leafPlanInstanceId: params.selectedPlan.instanceId,
    entryFrameKey: entryFrame.projectedFrameKey,
  });
  const lineId = turnPlanningFingerprint("turn-line", {
    phaseId,
    nodeId,
    projectedFrameKey: projectedFrame.projectedFrameKey,
  });

  return {
    schemaVersion: AI_TURN_PLANNING_DEBUG_SCHEMA_VERSION,
    mode: "projection_contract",
    stateVersion: stateIdentity.stateVersion,
    sideSafePlanningFingerprint: stateIdentity.sideSafePlanningFingerprint,
    planningRulesFingerprint: rulesContext.fingerprint,
    turnKey,
    heads: [
      {
        candidateId: `head:${candidate.actionId}`,
        moduleId: params.selectedPlan.moduleId,
        rootPlanInstanceId,
        actionId: candidate.actionId,
        semanticActionType: candidate.semanticActionType,
        invocationKey: invocation.invocationKey,
        witnessValid:
          params.input.legalActions.some(
            (action) => action.actionId === candidate.actionId,
          ) &&
          buildSemanticActionSetFingerprint(params.input.legalActions).length >
            0,
      },
    ],
    selectedLine: {
      lineId,
      stopReason: boundary
        ? "observation_boundary"
        : "projection_not_supported",
      projectedFrameKey: projectedFrame.projectedFrameKey,
      cursor: { phaseIndex: 0, nodeIndex: 0 },
      phases: [
        {
          phaseId,
          rootPlanInstanceId,
          rootModuleId: rootPlan.moduleId,
          rootProvenance:
            params.selectedPlan.parentNeedId !== undefined
              ? "admitted_support"
              : "resident",
          entryFrameKey: entryFrame.projectedFrameKey,
          completionCode: boundary
            ? "observation_required"
            : "future_projection_not_yet_available",
          transitionKind: boundary
            ? "observation_boundary"
            : "projection_not_supported",
          supportBindings,
          nodes: [
            {
              nodeId,
              semanticActionType: candidate.semanticActionType,
              ...(boundary ? { boundaryAfter: boundary.boundaryKind } : {}),
            },
          ],
        },
      ],
    },
    commitment: {
      commitmentId: turnPlanningFingerprint(
        "prospective-turn-plan-commitment",
        {
          lineId,
          turnKey,
          stateIdentity,
          rulesFingerprint: rulesContext.fingerprint,
        },
      ),
      status: "prospective",
      cursor: {
        phaseIndex: 0,
        nodeIndex: 0,
        phaseId,
        nodeId,
      },
      phaseEntry: {
        phaseId,
        status: "projection_only",
        reasonCode: "commitment_not_bound_in_projection_mode",
      },
      rematerialization: {
        status: "not_attempted",
        reasonCode: "productive_cutover_not_active",
      },
      observationClass: boundary
        ? "scheduled_information_boundary"
        : "expected_no_material_change",
    },
    ...(boundary
      ? {
          boundary: {
            kind: boundary.boundaryKind,
            residualTurnValueBasis: boundary.residualTurnValueBasis,
            optionalityUnit: boundary.postBoundaryOptionality.unit,
            optionalityMinimum: boundary.postBoundaryOptionality.minimum,
            optionalityMaximum: boundary.postBoundaryOptionality.maximum,
          },
        }
      : {}),
    pruneEvents: [],
    evidenceCodes: [
      "turn_planning_projection_contract_only",
      ...(agendaSlice?.evidenceCodes ?? []),
      ...(defenseSlice?.evidenceCodes ?? []),
      ...(boundary
        ? ["observation_boundary_requires_replanning"]
        : ["future_projection_not_yet_available"]),
    ],
    ...(agendaSlice
      ? {
          agendaComparison: {
            opportunityKey: agendaSlice.opportunityKey,
            ...(agendaSlice.selectedFamily &&
            agendaSlice.randomizationEligibility === undefined
              ? { selectedFamily: agendaSlice.selectedFamily }
              : {}),
            selectionReason:
              agendaSlice.randomizationEligibility !== undefined
                ? "engine_randomization_pending"
                : agendaSlice.selectionReason,
            randomizationEligible:
              agendaSlice.randomizationEligibility !== undefined,
            lines: agendaSlice.lines.map((line) => ({
              lineId: line.lineId,
              family: line.family,
              actionCount: line.nodes.length,
              agendaProgress: line.evaluation.agendaProgress,
              defense: line.evaluation.defense,
              economy: line.evaluation.economy,
              risk: line.evaluation.risk,
              worstCaseFloor: line.evaluation.worstCaseFloor,
              expectedValue: line.evaluation.expectedValue,
            })),
          },
        }
      : {}),
    ...(defenseSlice &&
    (defenseSlice.lines.length > 0 || defenseSlice.rejected.length > 0)
      ? {
          defenseComparison: {
            ...(defenseSlice.selectedLineId
              ? { selectedLineId: defenseSlice.selectedLineId }
              : {}),
            lines: defenseSlice.lines.map((line) => ({
              lineId: line.lineId,
              targetServerId: line.targetServerId,
              disposition: line.disposition,
              actionCount: line.nodes.length,
              fundingGapBefore: line.fundingGapBefore,
              fundingGapAfter: line.fundingGapAfter,
              rezReadyAfterLine: line.rezReadyAfterLine,
              bluffValue: line.bluffValue,
              defenseValue: line.defenseValue,
              economyValue: line.economyValue,
              totalValue: line.totalValue,
            })),
            rejected: defenseSlice.rejected.map((entry) => ({ ...entry })),
          },
        }
      : {}),
  };
}

function planFirstDebugPlanInstance(
  instance: ResidentPlanPortfolio["instances"][number],
): AiPlanFirstDecisionDebug["portfolio"][number] {
  return {
    instanceId: instance.instanceId,
    dedupeKey: instance.dedupeKey,
    moduleId: instance.moduleId,
    moduleVersion: instance.moduleVersion,
    viability: instance.viability,
    portfolioRole: instance.portfolioRole,
    executionState: instance.executionState,
    persistencePolicy: instance.persistencePolicy,
    phase: instance.phase,
    milestone: instance.milestone,
    ...(instance.target ? { target: { ...instance.target } } : {}),
    ...(instance.parentInstanceId
      ? { parentInstanceId: instance.parentInstanceId }
      : {}),
    ...(instance.parentNeedId ? { parentNeedId: instance.parentNeedId } : {}),
    openNeedIds: [...instance.openNeedIds],
    blockers: instance.blockers.map((blocker) => blocker.code),
    evidenceCodes: instance.evidenceRefs.map((reference) => reference.code),
  };
}

function planFirstP6Contract(
  moduleId: string,
  reasonCode: string,
  evidenceCodes: readonly string[],
): NonNullable<AiPlanFirstDecisionDebug["priority"]>["p6Contract"] {
  if (reasonCode === "turn_completion" || moduleId.endsWith(".complete_turn")) {
    return "turn_completion";
  }
  if (
    evidenceCodes.some((code) =>
      code.includes("engine_certified_immediate_liquidity_development"),
    )
  ) {
    return "temporary_bounded_liquidity_transition";
  }
  return "bounded_plan_contract";
}

function uniquePlanFirstDebugCodes(codes: readonly string[]): string[] {
  return [...new Set(codes.filter((code) => code.trim().length > 0))];
}

function decisionFromScheduler(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  context: PlanSchedulerContext,
  result: PlanSchedulerResult,
  registry: SidePlanRegistry,
  dependencies: PlanFirstLiveDependencies,
  options: AiDecisionRuntimeOptions,
  turnPlanningDebug?: AiTurnPlanningDebug,
): AiDecision {
  const randomizedIceInstallNearTie =
    result.lane === "plan"
      ? result.engineRandomizedIceInstallNearTie
      : undefined;
  const actionId =
    result.lane === "plan" ? result.route.head.actionId : result.actionId;
  const action = input.legalActions.find(
    (candidate) => candidate.actionId === actionId,
  );
  if (!action) throw new Error("plan_first_selected_action_not_legal");
  const pendingChoice = input.playerView.pendingChoice;
  const boundTraceChoices =
    result.lane === "engine_window"
      ? boundCorpPunishTraceChoices(
          input,
          action,
          result.origin,
          result.portfolio,
        )
      : undefined;
  const traceBidAssessment =
    pendingChoice && !boundTraceChoices
      ? assessTraceBidCandidates(
          input,
          pendingChoice,
          latestTraceContext(input),
        )
      : undefined;
  const selectedChoices = randomizedIceInstallNearTie
    ? undefined
    : (boundTraceChoices ??
      (traceBidAssessment
        ? traceBidAssessment.candidates.length === 1
          ? {
              choiceId: pendingChoice!.choiceId,
              selectedOptionIds: [traceBidAssessment.selectedOptionId],
            }
          : undefined
        : dependencies.selectedChoicesForDecision(
            input,
            action,
            result.portfolio,
          )));
  const planId =
    result.lane === "plan"
      ? result.selectedAssessment.instanceId
      : result.origin.leafPlanInstanceId;
  const planKind =
    result.lane === "plan"
      ? result.portfolio.instances.find(
          (instance) => instance.instanceId === planId,
        )?.moduleId
      : (result.portfolio?.instances.find(
          (instance) => instance.instanceId === planId,
        )?.moduleId ?? "engine_window");
  const selectedPlanActionAssessment =
    result.lane === "plan"
      ? (
          result.portfolio.instances.find(
            (instance) => instance.instanceId === planId,
          )?.moduleState as
            | {
                signal?: {
                  actionAssessments?: Record<
                    string,
                    {
                      admissible: boolean;
                      value?: number;
                      evidenceCodes: string[];
                    }
                  >;
                };
              }
            | undefined
        )?.signal?.actionAssessments?.[actionId]
      : undefined;
  const planEvidence =
    result.lane === "plan"
      ? [
          `plan_module:${planKind ?? "unknown"}`,
          `plan_step_id:${result.route.step.stepId}`,
          `plan_step_capability:${result.route.step.capability.capabilityId}`,
          `plan_priority_class:${result.selectedAssessment.priorityValidation.effectiveClass}`,
          `plan_priority_reason:${result.selectedAssessment.priorityClaim.reasonCode}`,
          ...result.selectedAssessment.priorityValidation.reasonCodes.map(
            (code) => `plan_priority_validation:${code}`,
          ),
          ...(result.selectedAssessment.priorityValidation
            .delegatedFromPlanInstanceId
            ? [
                `plan_priority_delegated_from:${result.selectedAssessment.priorityValidation.delegatedFromPlanInstanceId}`,
              ]
            : []),
          ...(result.selectedAssessment.priorityValidation.needId
            ? [
                `plan_priority_need:${result.selectedAssessment.priorityValidation.needId}`,
              ]
            : []),
          `plan_within_class_value:${result.selectedAssessment.withinClassValue}`,
          ...result.selectedAssessment.evidenceCodes.map(
            (code) => `plan_assessment_evidence:${code}`,
          ),
          ...(selectedPlanActionAssessment
            ? [
                `plan_action_assessment_admissible:${selectedPlanActionAssessment.admissible}`,
                ...(selectedPlanActionAssessment.value !== undefined
                  ? [
                      `plan_action_assessment_value:${selectedPlanActionAssessment.value}`,
                    ]
                  : []),
                ...selectedPlanActionAssessment.evidenceCodes.map(
                  (code) => `plan_action_assessment_evidence:${code}`,
                ),
              ]
            : []),
        ]
      : [];
  const previewEvidence =
    options.persistTacticalPlanMemory === false
      ? ["resident_plan_portfolio_preview_only:true"]
      : [];
  const blockedPortfolioEvidence =
    result.lane === "plan"
      ? result.portfolio.instances
          .filter((instance) => instance.viability === "blocked")
          .flatMap((instance) => [
            `plan_portfolio_blocked:${instance.instanceId}`,
            ...instance.evidenceRefs.map(
              (reference) =>
                `plan_portfolio_blocked_evidence:${instance.instanceId}:${reference.code}`,
            ),
            ...instance.blockers.map(
              (blocker) =>
                `plan_portfolio_blocker:${instance.instanceId}:${blocker.code}`,
            ),
          ])
      : [];
  const evidence = [
    "plan_first_runtime:true",
    `plan_first_lane:${result.lane}`,
    `plan_first_root:${
      result.lane === "plan"
        ? (result.portfolio.rootForegroundInstanceId ?? planId)
        : result.origin.rootPlanInstanceId
    }`,
    `plan_first_executor:${planId}`,
    ...planEvidence,
    ...previewEvidence,
    ...blockedPortfolioEvidence,
    ...result.diagnostics.map(
      (event) =>
        `plan_scheduler:${event.stage}:${event.code}:${event.instanceId ?? "none"}`,
    ),
  ];
  const actionAlternatives = input.legalActions
    .slice(0, 32)
    .map((alternative, index) => {
      const randomizedCandidate =
        randomizedIceInstallNearTie?.candidates.some(
          (candidate) => candidate.actionId === alternative.actionId,
        ) ?? false;
      const selected =
        randomizedIceInstallNearTie === undefined &&
        alternative.actionId === actionId;
      const encounterExclusion =
        input.side === "runner" &&
        (alternative.type === "pump_breaker" ||
          alternative.type === "break_subroutine")
          ? dependencies.runnerEncounterActionExclusion(input, alternative)
          : undefined;
      const rejectionEvidence = encounterExclusion
        ? [
            `encounter_action_excluded:${encounterExclusion.key}`,
            ...encounterExclusion.reason
              .split("|")
              .map((entry) => entry.trim())
              .filter(Boolean),
          ]
        : [];
      const semanticCandidate = candidates.find(
        (candidate) => candidate.actionId === alternative.actionId,
      );
      const actionDisposition = context.actionDispositions?.find(
        (disposition) => disposition.actionId === alternative.actionId,
      );
      const planActionAssessment =
        result.lane === "plan"
          ? (
              result.portfolio.instances.find(
                (instance) => instance.instanceId === planId,
              )?.moduleState as
                | {
                    signal?: {
                      actionAssessments?: Record<
                        string,
                        {
                          admissible: boolean;
                          value?: number;
                          evidenceCodes: string[];
                        }
                      >;
                    };
                  }
                | undefined
            )?.signal?.actionAssessments?.[alternative.actionId]
          : undefined;
      const planActionAssessmentEvidence = planActionAssessment
        ? [
            `plan_action_assessment_admissible:${planActionAssessment.admissible}`,
            ...(planActionAssessment.value !== undefined
              ? [`plan_action_assessment_value:${planActionAssessment.value}`]
              : []),
            ...planActionAssessment.evidenceCodes.map(
              (code) => `plan_action_assessment_evidence:${code}`,
            ),
          ]
        : [];
      const candidateTargets = semanticCandidate
        ? candidateTargetIds(semanticCandidate)
        : [];
      const relatedResidentPlans = (result.portfolio?.instances ?? []).filter(
        (instance) =>
          instance.instanceId !== planId &&
          instance.target !== undefined &&
          ((instance.target.kind === "server" &&
            candidateTargets.includes(instance.target.id)) ||
            (instance.target.kind === "bank" &&
              (semanticCandidate?.sourceDefinitionId === instance.target.id ||
                semanticCandidate?.sourceCardId === instance.target.id)) ||
            (instance.target.kind === "card" &&
              semanticCandidate?.sourceDefinitionId === instance.target.id)),
      );
      const residentPlanEvidence = relatedResidentPlans.flatMap((instance) => [
        `candidate_plan:${instance.instanceId}:${instance.viability}`,
        ...instance.evidenceRefs.map(
          (reference) => `candidate_plan_evidence:${reference.code}`,
        ),
        ...instance.blockers.map(
          (blocker) => `candidate_plan_blocker:${blocker.code}`,
        ),
      ]);
      const planRouteEvidence = (result.portfolio?.instances ?? []).flatMap(
        (instance) => {
          const moduleState = instance.moduleState as
            | {
                kind?: unknown;
                signal?: {
                  runActionEvidence?: Record<string, string[]>;
                  runActionExclusions?: Record<string, string[]>;
                  runActionAssessments?: Record<
                    string,
                    {
                      evidenceCodes?: string[];
                    }
                  >;
                };
              }
            | undefined;
          if (moduleState?.kind === "central_pressure") {
            return [
              ...(moduleState.signal?.runActionEvidence?.[
                alternative.actionId
              ] ?? []),
              ...(!selected
                ? (moduleState.signal?.runActionExclusions?.[
                    alternative.actionId
                  ] ?? [])
                : []),
            ];
          }
          if (moduleState?.kind === "remote_contest") {
            return (
              moduleState.signal?.runActionAssessments?.[alternative.actionId]
                ?.evidenceCodes ?? []
            );
          }
          return [];
        },
      );
      const planRouteDiagnostic = (result.portfolio?.instances ?? [])
        .flatMap((instance) => {
          const moduleState = instance.moduleState as
            | {
                kind?: unknown;
                signal?: {
                  runActionRouteDiagnostics?: Record<
                    string,
                    {
                      rawRouteScore: number;
                      opportunityCost: number;
                      effectiveRouteScore: number;
                    }
                  >;
                  runActionAssessments?: Record<
                    string,
                    {
                      routeDiagnostic?: {
                        rawRouteScore: number;
                        opportunityCost: number;
                        effectiveRouteScore: number;
                      };
                    }
                  >;
                };
              }
            | undefined;
          const diagnostic =
            moduleState?.kind === "central_pressure"
              ? moduleState.signal?.runActionRouteDiagnostics?.[
                  alternative.actionId
                ]
              : moduleState?.kind === "remote_contest"
                ? moduleState.signal?.runActionAssessments?.[
                    alternative.actionId
                  ]?.routeDiagnostic
                : undefined;
          return diagnostic ? [diagnostic] : [];
        })
        .sort(
          (left, right) =>
            right.effectiveRouteScore - left.effectiveRouteScore ||
            right.rawRouteScore - left.rawRouteScore,
        )[0];
      return {
        rank: index + 1,
        actionId: alternative.actionId,
        actionType: alternative.type,
        label: alternative.label,
        source: String(alternative.source),
        selected,
        ...(planRouteDiagnostic
          ? {
              score: planRouteDiagnostic.effectiveRouteScore,
              scoreBreakdown: [
                {
                  key: "run_route_raw_score",
                  label: "Run route before card opportunity cost",
                  value: planRouteDiagnostic.rawRouteScore,
                },
                {
                  key: "consumable_run_opportunity_cost",
                  label: "Consumable run-card opportunity cost",
                  value: -planRouteDiagnostic.opportunityCost,
                },
              ],
            }
          : {}),
        ...(encounterExclusion ||
        actionDisposition ||
        planActionAssessment?.admissible === false
          ? { excluded: true }
          : {}),
        ...(selected
          ? {
              whyChosen: [
                `selected_by_plan:${planId}`,
                ...(result.lane === "plan"
                  ? [
                      `selected_for_step:${result.route.step.capability.capabilityId}`,
                    ]
                  : []),
                ...planRouteEvidence,
                ...planActionAssessmentEvidence,
              ],
            }
          : randomizedCandidate
            ? {
                whyNot: [
                  `pending_engine_randomized_selection:${planId}`,
                  ...planActionAssessmentEvidence,
                ],
              }
            : {
                whyNot: [
                  ...(encounterExclusion
                    ? rejectionEvidence
                    : actionDisposition
                      ? [
                          `${actionDisposition.disposition}:${actionDisposition.ownerModuleId}:${actionDisposition.evidenceCode}`,
                          ...residentPlanEvidence,
                          ...planRouteEvidence,
                          ...planActionAssessmentEvidence,
                        ]
                      : [
                          `not_selected_by_plan:${planId}`,
                          ...residentPlanEvidence,
                          ...planRouteEvidence,
                          ...planActionAssessmentEvidence,
                        ]),
                ],
              }),
      };
    });
  const topLevelWhyNot =
    semanticRuntimeDecisionDebugTopLevelWhyNot(actionAlternatives);
  const runtimeWhyNotSection =
    topLevelWhyNot.length > 0
      ? [
          {
            id: "runtime_why_not",
            title: "Runtime why not",
            items: topLevelWhyNot,
          },
        ]
      : [];
  const corpHandInventoryFacts =
    input.side === "corp"
      ? (context.domain as CorpPlanDomain | undefined)?.handInventoryFacts
      : undefined;
  const corpHandInventorySection = corpHandInventoryFacts
    ? [
        {
          id: "corp_hand_inventory",
          title: "Corp-private hand inventory",
          items: [
            `authority:${corpHandInventoryFacts.authority}`,
            `selection_influence:${corpHandInventoryFacts.selectionInfluence}`,
            `pressure:${corpHandInventoryFacts.pressure.status}|hand:${corpHandInventoryFacts.pressure.handSize}|maximum:${corpHandInventoryFacts.pressure.maximumHandSize}|available_slots:${corpHandInventoryFacts.pressure.availableSlots}|overflow:${corpHandInventoryFacts.pressure.overflowCount}`,
            `cleanup:hand_if_end_now:${corpHandInventoryFacts.cleanupProjection.handSizeIfTurnEndedNow}|required_discards:${corpHandInventoryFacts.cleanupProjection.requiredDiscardsIfTurnEndedNow}|single_draw_increases_discard:${corpHandInventoryFacts.cleanupProjection.singleCardDrawWouldIncreaseDiscard}`,
            ...corpHandInventoryFacts.records.map(
              (record) =>
                `${record.sourceInstanceId}|definition:${record.sourceDefinitionId}|duplicates:${record.duplicateCount}|actions:${record.legalActionIds.join(",") || "none"}|claims:${
                  record.domainClaims
                    .map(
                      (claim) =>
                        `${claim.ownerModuleId}:${claim.readiness}:${claim.planInstanceId}`,
                    )
                    .join(",") || "none"
                }|dispositions:${record.dispositions.join(",") || "none"}`,
            ),
          ],
        },
      ]
    : [];
  const corpDrawArbitrations =
    input.side === "corp"
      ? ((context.domain as CorpPlanDomain | undefined)?.drawArbitrations ?? [])
      : [];
  const corpDrawArbitrationSection =
    corpDrawArbitrations.length > 0
      ? [
          {
            id: "corp_draw_arbitration",
            title: "Corp-private draw admission",
            items: corpDrawArbitrations.map(
              (assessment) =>
                `${assessment.routeId}|action:${assessment.actionId}|purpose:${assessment.purpose}|priority:${assessment.priorityClass}|attempts:${assessment.remainingAttempts}|net_hand:${assessment.netHandDelta}|projected_overflow:${assessment.projectedEndTurnOverflow}|capacity_release:${assessment.exactCapacityReleaseActionIds.join(",") || "none"}|disposition:${assessment.disposition}`,
            ),
          },
        ]
      : [];
  const detailSections =
    result.lane === "plan"
      ? [
          {
            id: "plan_execution",
            title: "Plan execution",
            items: [
              `instance:${planId}`,
              `module:${planKind ?? "unknown"}`,
              `step:${result.route.step.stepId}`,
              `capability:${result.route.step.capability.capabilityId}`,
              `purpose:${result.route.step.purpose}`,
              `priority_class:${result.selectedAssessment.priorityValidation.effectiveClass}`,
              `priority_reason:${result.selectedAssessment.priorityClaim.reasonCode}`,
              `within_class_value:${result.selectedAssessment.withinClassValue}`,
              ...result.selectedAssessment.evidenceCodes.map(
                (code) => `assessment_evidence:${code}`,
              ),
            ],
          },
          {
            id: "plan_portfolio",
            title: "Resident plan portfolio",
            items: result.portfolio.instances.flatMap((instance) => [
              `${instance.instanceId}|module:${instance.moduleId}|phase:${instance.phase}|viability:${instance.viability}`,
              ...instance.blockers.map(
                (blocker) =>
                  `${instance.instanceId}|blocker:${blocker.code}|owner:${blocker.owner}|removable:${blocker.removable}`,
              ),
              ...instance.evidenceRefs.map(
                (reference) =>
                  `${instance.instanceId}|evidence:${reference.code}|source:${reference.source}`,
              ),
            ]),
          },
          {
            id: "plan_action_routes",
            title: "Plan action routes",
            items: actionAlternatives.flatMap((alternative) =>
              alternative.selected
                ? [
                    `selected:${alternative.actionId}|${
                      "whyChosen" in alternative
                        ? alternative.whyChosen.join("|")
                        : ""
                    }`,
                  ]
                : [
                    `rejected:${alternative.actionId}|${
                      "whyNot" in alternative
                        ? alternative.whyNot.join("|")
                        : ""
                    }`,
                  ],
            ),
          },
          ...corpHandInventorySection,
          ...corpDrawArbitrationSection,
          ...runtimeWhyNotSection,
        ]
      : [
          {
            id: "engine_window",
            title: "Engine window",
            items: [`leaf_plan:${planId}`, `selected_action:${actionId}`],
          },
          ...corpHandInventorySection,
          ...corpDrawArbitrationSection,
          ...runtimeWhyNotSection,
        ];
  const planFirstDecision = planFirstDecisionDebug({
    input,
    context,
    result,
    registry,
    selectedChoicesForDecision: dependencies.selectedChoicesForDecision,
    action,
    planId,
    planKind,
    assessmentEvidenceCodes: planEvidence,
    ...(turnPlanningDebug ? { turnPlanningDebug } : {}),
  });
  const decisionBase = {
    reasonCode:
      result.lane === "plan"
        ? `plan_first.${planKind ?? "unknown"}`
        : planKind !== "engine_window"
          ? `plan_first.${planKind}`
          : "plan_first.engine_window",
    explanation:
      result.lane === "plan"
        ? `Plan ${planKind ?? planId} materialized the current ${result.route.head.semanticActionType} route.`
        : "The engine/window lane resolved the sole current mandatory action.",
    consideredActionIds: input.legalActions.map(
      (alternative) => alternative.actionId,
    ),
    fallbackUsed: false,
    confidence: 1,
    evidence,
    decisionDebug: {
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: difficultyLevel(input),
      summary: "Authoritative plan-first runtime selection",
      planFirstDecision,
      planId,
      ...(planKind ? { planKind } : {}),
      selectedActionType: action.type,
      confidence: 1,
      visibleReasons: evidence,
      actionAlternatives,
      whyNot: topLevelWhyNot,
      detailSections,
      fallbackUsed: false,
      timeoutUsed: false,
      profileId: input.profileId,
      memoryVersion: "resident-plan-portfolio-v2",
      evidence,
    } satisfies NonNullable<AiDecision["decisionDebug"]>,
    timeoutUsed: false,
    profileId: input.profileId,
    difficulty: input.difficulty,
    reason:
      result.lane === "plan"
        ? `plan_first.${planKind ?? "unknown"}`
        : planKind !== "engine_window"
          ? `plan_first.${planKind}`
          : "plan_first.engine_window",
  };
  const randomizedAgendaSlice = agendaSliceForRandomizedSelection({
    input,
    context,
    result,
  });
  if (traceBidAssessment && traceBidAssessment.candidates.length >= 2) {
    const matchId = input.matchId?.trim();
    const quoteSelection = options.quoteRandomizedTraceBidSelection;
    const planStepId =
      result.lane === "plan"
        ? result.route.step.stepId
        : result.origin.windowId;
    if (!matchId || !quoteSelection || !pendingChoice) {
      throw new PlanResolutionFailure("invalid_support_graph", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map(
          (legalAction) => legalAction.type,
        ),
        unresolvedActionIds: [action.actionId],
        owner: "rules_contract",
        planInstanceId: planId,
        stepId: planStepId,
        removalCondition:
          "A Blind Trace resolution with multiple rational candidates requires the state-bound Engine Trace-Bid RNG quote.",
      });
    }
    const quote = quoteSelection({
      schemaVersion: ENGINE_RANDOMIZED_TRACE_BID_SELECTION_SCHEMA_VERSION,
      matchId,
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      actionId: action.actionId,
      choiceId: pendingChoice.choiceId,
      planStepId,
      assessment: traceBidAssessment.assessment,
      candidates: traceBidAssessment.candidates,
    });
    if (!quote.ok) {
      throw new PlanResolutionFailure("invalid_support_graph", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map(
          (legalAction) => legalAction.type,
        ),
        unresolvedActionIds: [action.actionId],
        owner: "rules_contract",
        planInstanceId: planId,
        stepId: planStepId,
        removalCondition:
          "The Engine must revalidate the exact resolve_choice action, Choice and every weighted Trace bid before consuming randomness.",
      });
    }
    return {
      ...decisionBase,
      selectionKind: "engine_randomized_trace_bid_selection",
      engineCommand: {
        kind: "engine_randomized_trace_bid_selection",
        quote: quote.quote,
      },
    };
  }
  if (randomizedAgendaSlice) {
    const matchId = input.matchId?.trim();
    const quoteSelection = options.quoteRandomizedTurnPlanSelection;
    if (!matchId || !quoteSelection) {
      throw new PlanResolutionFailure("invalid_support_graph", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map(
          (legalAction) => legalAction.type,
        ),
        unresolvedActionIds: randomizedAgendaSlice.lines.map(
          (line) => line.currentActionId,
        ),
        owner: "rules_contract",
        planInstanceId: planId,
        removalCondition:
          "An admissible Opening-Rush posture mix requires the separate Engine TurnPlan RNG domain.",
      });
    }
    const familyLines = [
      randomizedAgendaSlice.lines
        .filter(
          (line) =>
            line.family === "pure_rush" || line.family === "combined_rush",
        )
        .sort(
          (left, right) =>
            right.evaluation.expectedValue - left.evaluation.expectedValue ||
            right.evaluation.worstCaseFloor - left.evaluation.worstCaseFloor ||
            left.lineId.localeCompare(right.lineId),
        )[0],
      randomizedAgendaSlice.lines.find((line) => line.family === "safe_setup"),
    ].filter((line): line is NonNullable<typeof line> => line !== undefined);
    const quote = quoteSelection({
      schemaVersion: ENGINE_RANDOMIZED_TURN_PLAN_SELECTION_SCHEMA_VERSION,
      matchId,
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      opportunityKey: randomizedAgendaSlice.opportunityKey,
      candidates: familyLines.map((line) => ({
        familyKey: line.family,
        lineId: line.lineId,
        actionId: line.currentActionId,
        weight: 1,
      })),
    });
    if (!quote.ok) {
      throw new PlanResolutionFailure("invalid_support_graph", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map(
          (legalAction) => legalAction.type,
        ),
        unresolvedActionIds: familyLines.map((line) => line.currentActionId),
        owner: "rules_contract",
        planInstanceId: planId,
        removalCondition:
          "The Engine must revalidate every weighted Opening-Rush family head before consuming planner randomness.",
      });
    }
    return {
      ...decisionBase,
      selectionKind: "engine_randomized_turn_plan_selection",
      engineCommand: {
        kind: "engine_randomized_turn_plan_selection",
        quote: quote.quote,
      },
    };
  }
  if (randomizedIceInstallNearTie) {
    if (result.lane !== "plan") {
      throw new Error(
        "engine_randomized_ice_install_near_tie_requires_plan_lane",
      );
    }
    const matchId = input.matchId?.trim();
    const quoteRandomizedIceInstallSelection =
      options.quoteRandomizedIceInstallSelection;
    if (
      input.side !== "corp" ||
      !matchId ||
      !quoteRandomizedIceInstallSelection
    ) {
      throw new PlanResolutionFailure("invalid_support_graph", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map(
          (legalAction) => legalAction.type,
        ),
        unresolvedActionIds: randomizedIceInstallNearTie.candidates.map(
          (candidate) => candidate.actionId,
        ),
        owner: "rules_contract",
        planInstanceId: planId,
        stepId: result.route.step.stepId,
        removalCondition:
          "A randomized central ICE-install near tie requires an actor-private match binding and the Engine quote service; it must never degrade to the scheduler's technical route head.",
      });
    }
    const quoteResult = quoteRandomizedIceInstallSelection({
      schemaVersion: ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION,
      matchId,
      side: "corp",
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      planStepId: result.route.step.stepId,
      candidates: randomizedIceInstallNearTie.candidates,
    });
    if (!quoteResult.ok) {
      throw new PlanResolutionFailure("invalid_support_graph", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map(
          (legalAction) => legalAction.type,
        ),
        unresolvedActionIds: randomizedIceInstallNearTie.candidates.map(
          (candidate) => candidate.actionId,
        ),
        owner: "rules_contract",
        planInstanceId: planId,
        stepId: result.route.step.stepId,
        removalCondition:
          "The Engine must certify the complete current HQ/R&D ICE-install candidate set before randomness can be consumed.",
      });
    }
    return {
      ...decisionBase,
      selectionKind: "engine_randomized_ice_install_selection",
      engineCommand: {
        kind: "engine_randomized_ice_install_selection",
        quote: quoteResult.quote,
      },
    };
  }
  return {
    ...decisionBase,
    selectionKind: "direct",
    actionId,
    ...(selectedChoices ? { selectedChoices } : {}),
  };
}

function agendaSliceForRandomizedSelection(params: {
  input: AiDecisionInput;
  context: PlanSchedulerContext;
  result: PlanSchedulerResult;
}) {
  if (
    params.input.side !== "corp" ||
    params.result.lane !== "plan" ||
    params.result.selectedAssessment.priorityValidation.effectiveClass ===
      "P1" ||
    params.result.selectedAssessment.priorityValidation.effectiveClass === "P2"
  ) {
    return undefined;
  }
  const extended = params.input as AiDecisionInputWithDeckCapabilities;
  if (!extended.planningRulesContext || !extended.planningStateIdentity) {
    return undefined;
  }
  const domain = params.context.domain as CorpPlanDomain | undefined;
  return domain?.scoreProjects
    .filter((project) => project.openingRush?.status === "qualified")
    .map((project) =>
      buildCorpAgendaTurnPlanningSlice({
        input: params.input,
        project,
        candidates: params.context.actionCandidates,
        defenseNeeds: domain.defenseNeeds,
        economyNeeds: domain.economyNeeds,
        rulesContext: extended.planningRulesContext!,
        stateIdentity: extended.planningStateIdentity!,
      }),
    )
    .filter(
      (slice) =>
        slice.randomizationEligibility !== undefined &&
        new Set(slice.lines.map((line) => line.currentActionId)).size >= 2,
    )
    .sort((left, right) =>
      left.opportunityKey.localeCompare(right.opportunityKey),
    )[0];
}

function isRunWindowSemantic(candidate: ActionSemanticCandidate): boolean {
  return (
    candidate.semanticActionType === "run.continue" ||
    candidate.semanticActionType === "run.jack_out" ||
    candidate.semanticActionType === "run.decline_optional_bonus" ||
    candidate.semanticActionType.startsWith("access.") ||
    candidate.semanticActionType === "breaker.boost_strength" ||
    candidate.semanticActionType === "breaker.break_subroutine"
  );
}

function isRunnerRunWindowCandidate(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  return (
    runnerRunPaymentSupportAction(input, candidate) !== undefined ||
    isRunWindowSemantic(candidate) ||
    (input.playerView.run !== undefined &&
      candidate.sourceKind === "card" &&
      candidate.semanticActionType.startsWith("card_ability.")) ||
    runnerCandidateHasVisibleAdditionalAccessEffect(candidate) ||
    runnerRestrictedRunSequenceAction(input, candidate) !== undefined ||
    runnerOptionalBonusRunDeclineAction(input, candidate) !== undefined ||
    runnerSuccessfulRunBeforeAccessEffectAction(input, candidate) !==
      undefined ||
    runnerPostPassDerezAndEndRunAction(input, candidate) !== undefined ||
    runnerRunRemainderStrengthBoostAction(input, candidate) !== undefined
  );
}

function runnerRunPaymentSupportAction(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): LegalAction | undefined {
  if (!input.playerView.run) return undefined;
  return input.legalActions.find(
    (action) =>
      action.actionId === candidate.actionId &&
      action.type === "activated_card_ability" &&
      typeof action.payload?.costPenaltySupportWindowId === "string" &&
      typeof action.payload.costPenaltySupportOriginalActionId === "string",
  );
}

function runnerRunPaymentSupportAssessment(
  input: AiDecisionInput,
  action: LegalAction,
  runOrigin: RunnerRunOrigin | undefined,
): RunnerRunWindowActionAssessment {
  const original = input.legalActions.find(
    (entry) =>
      entry.actionId === action.payload?.costPenaltySupportOriginalActionId &&
      entry.payload?.runnerCostPenaltySupportContinuation === true &&
      entry.payload.runnerCostPenaltySupportWindowId ===
        action.payload?.costPenaltySupportWindowId,
  );
  const source = (input.playerView.own.rig ?? []).find(
    (card) => card.instanceId === action.source,
  );
  const ability = source?.runnerPaymentSupportAbilities?.find(
    (entry) => entry.sourceAbilityId === action.abilityRef?.sourceAbilityId,
  );
  const cash = input.playerView.own.credits;
  const cashTarget = action.payload?.costPenaltySupportRunnerCreditTarget;
  if (!Number.isSafeInteger(cashTarget) || Number(cashTarget) < 0)
    return {
      admissible: false,
      evidenceCodes: ["runner_run_payment_support_cash_target_quote_missing"],
    };
  const validPositivePaymentSource =
    original !== undefined &&
    ability !== undefined &&
    ability.trashesSource &&
    ability.creditCost > 0 &&
    ability.creditCost <= cash &&
    ability.gainCredits > ability.creditCost &&
    legalActionCreditCost(action) === ability.creditCost &&
    action.payload?.gainCreditsAmount === ability.gainCredits;
  const preservesActivationCash =
    validPositivePaymentSource &&
    cash - Number(cashTarget) < ability.creditCost;
  const contract = runOrigin?.runRiskContract;
  const remainingUnknownIce = currentRunRemainingIce(input).some(
    (ice) => ice.known !== true || ice.rezzed !== true,
  );
  const requiredReserve =
    remainingUnknownIce &&
    contract?.serverId === input.playerView.run?.attackedServerId
      ? (contract?.reserveQuote.requiredCredits ?? 0)
      : 0;
  const fundsBoundRunReserve =
    validPositivePaymentSource &&
    cash - Number(cashTarget) < requiredReserve &&
    cash - Number(cashTarget) + ability.gainCredits - ability.creditCost >=
      requiredReserve;
  const usePaymentSource = preservesActivationCash || fundsBoundRunReserve;
  return {
    admissible: usePaymentSource,
    value: usePaymentSource ? ability.gainCredits - ability.creditCost : 0,
    evidenceCodes: [
      preservesActivationCash
        ? "runner_run_payment_support_before_activation_cash_is_spent"
        : fundsBoundRunReserve
          ? "runner_run_payment_support_funds_bound_unknown_ice_reserve"
          : "runner_run_payment_support_activation_cash_preserved",
    ],
  };
}

function runnerSuccessfulRunBeforeAccessEffectAction(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): LegalAction | undefined {
  if (!runnerCandidateIsCardAbility(candidate)) return undefined;
  if (candidate.abilityBindingMethod !== "canonical_capability_id")
    return undefined;
  const action = input.legalActions.find(
    (entry) => entry.actionId === candidate.actionId,
  );
  if (
    !action ||
    action.type !== "trigger_ability" ||
    action.source !== candidate.sourceCardInstanceId ||
    action.payload?.cardImplementationPrimitiveKind !==
      "successful_run_before_access_effect" ||
    action.payload.cardImplementationAbilityId !== candidate.abilityId ||
    action.payload.cardImplementationAbilityKey !== candidate.abilityKey ||
    action.payload.cardImplementationCapabilityBindingKind !==
      "card_spec_capability_key" ||
    input.playerView.timingPoint !== "access.resolve_card" ||
    input.playerView.run?.successful !== true ||
    input.playerView.run.phase !== "access" ||
    action.payload.serverId !== input.playerView.run.attackedServerId
  )
    return undefined;
  const effectKind = action.payload.cardImplementationEffectKind;
  if (
    effectKind === "corp_lose_credits" &&
    Number.isFinite(action.payload.creditLoss) &&
    Number(action.payload.creditLoss) > 0
  )
    return action;
  if (
    effectKind === "trash_remote_fort" &&
    Number.isFinite(action.payload.targetCount) &&
    Number(action.payload.targetCount) > 0
  )
    return action;
  return undefined;
}

function runnerSuccessfulRunBeforeAccessEffectAssessment(
  action: LegalAction,
): RunnerRunWindowActionAssessment {
  const effectKind = action.payload?.cardImplementationEffectKind;
  const effectAmount =
    effectKind === "corp_lose_credits"
      ? Number(action.payload?.creditLoss)
      : Number(action.payload?.targetCount);
  return {
    admissible: true,
    value: Math.max(1, effectAmount) * 20,
    evidenceCodes: [
      "runner_successful_run_before_access_effect_plan_admissible",
      `runner_successful_run_before_access_effect:${effectKind}`,
      `runner_successful_run_before_access_effect_amount:${effectAmount}`,
      `runner_successful_run_before_access_capability:${action.payload?.cardImplementationAbilityKey}`,
    ],
  };
}

function runnerOptionalBonusRunDeclineAction(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): LegalAction | undefined {
  return input.legalActions.find((action) => {
    const ability = action.payload?.runnerAbility ?? action.payload?.abilityId;
    return (
      action.actionId === candidate.actionId &&
      action.type === "trigger_ability" &&
      (ability === "decline_optional_bonus_run" ||
        ability === "decline_successful_run_extra_run")
    );
  });
}

function runnerRunRemainderStrengthBoostAction(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): LegalAction | undefined {
  if (!runnerCandidateIsCardAbility(candidate)) return undefined;
  if (
    input.playerView.timingPoint !== "run.encounter_ice" &&
    input.playerView.timingPoint !== "run.jack_out_window"
  )
    return undefined;
  return input.legalActions.find(
    (action) =>
      action.actionId === candidate.actionId &&
      action.type === "trigger_ability" &&
      action.source === candidate.sourceCardInstanceId &&
      action.payload?.runnerAbility === "boost_icebreaker_for_run" &&
      typeof action.payload?.targetCardId === "string",
  );
}

function runnerPostPassDerezAndEndRunAction(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): LegalAction | undefined {
  if (!runnerCandidateIsCardAbility(candidate)) return undefined;
  const hasBoundPostPassEffect =
    candidate.abilityBindingMethod !== "unresolved" &&
    candidate.functionalEffects?.some(
      (effect) =>
        effect.kind === "rez" &&
        effect.scope === "ice" &&
        effect.timing === "encounter_resolution" &&
        effect.target === "derez",
    ) === true &&
    candidate.functionalEffects.some(
      (effect) =>
        effect.kind === "future_run_effect" &&
        effect.scope === "run_path" &&
        effect.timing === "encounter_resolution" &&
        effect.target === "ends_run_after_effect",
    );
  if (!hasBoundPostPassEffect) return undefined;
  return input.legalActions.find(
    (action) =>
      action.actionId === candidate.actionId &&
      action.type === "trigger_ability" &&
      (action.payload?.abilityId ?? action.payload?.runnerUtilityAbility) ===
        "derez_fully_broken_passed_ice_and_end_run",
  );
}

function runnerRestrictedRunSequenceAction(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): LegalAction | undefined {
  const action = input.legalActions.find(
    (entry) => entry.actionId === candidate.actionId,
  );
  const remainingActions = Number(
    action?.payload?.restrictedActionGrantRemainingActions,
  );
  return action?.type === "start_run" &&
    action.payload?.restrictedActionGrantActionType === "start_run" &&
    Number.isSafeInteger(remainingActions) &&
    remainingActions > 0
    ? action
    : undefined;
}

function visibleEncounterMitigation(
  input: AiDecisionInput,
): string | undefined {
  const visibleContinueThreat = input.legalActions.some(
    (action) =>
      action.type === "continue_run" &&
      action.payload?.encounterContinue === true &&
      (action.payload?.encounterWillEndRun === true ||
        Number(action.payload?.unbrokenSubroutineCount ?? 0) > 0),
  );
  const definitionId = input.playerView.run?.encounteredIce?.definitionId;
  if (!definitionId)
    return visibleContinueThreat
      ? "runner_visible_encounter_continue_resolves_threat"
      : undefined;
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  const threateningEffect = hint?.effects?.some((effect) =>
    [
      "damage",
      "end_run",
      "future_encounter_effect",
      "tag",
      "tag_source",
    ].includes(effect.kind),
  );
  if (!threateningEffect && !visibleContinueThreat) return undefined;
  return `runner_visible_encounter_requires_mitigation:${definitionId}`;
}

function runnerRunRiskContractReassessment(
  input: AiDecisionInput,
  runOrigin: RunnerRunOrigin | undefined,
): RunnerRunRiskReassessmentSignal | undefined {
  const run = input.playerView.run;
  const contract = runOrigin?.runRiskContract;
  if (!run || !contract || contract.serverId !== run.attackedServerId) {
    return undefined;
  }
  const server = input.playerView.servers.find(
    (entry) => entry.id === run.attackedServerId,
  );
  if (!server) return undefined;
  const currentRiskModel = reconstructBeliefState(
    input,
  ).runnerOpponentModel?.unrezzedIceRiskModel.find(
    (entry) => entry.serverId === run.attackedServerId,
  );
  if (!currentRiskModel) {
    return {
      schemaVersion: "runner-run-risk-reassessment-v1",
      serverId: run.attackedServerId,
      observedAtStateVersion: input.playerView.stateVersion,
      decision: "prefer_jack_out",
      baselineReserveQuote: structuredClone(contract.reserveQuote),
      evidenceCodes: [
        "runner_run_risk_contract_reassessment_failed_closed",
        "runner_run_risk_contract_current_server_risk_model_missing",
      ],
      failureCode: "current_server_risk_model_missing",
    };
  }
  const remainingIce = currentRunRemainingIce(input);
  const unknownIcePositions = remainingIce.flatMap((card, index) =>
    card.known === false && card.rezzed !== true ? [index] : [],
  );
  const knownRezzedRemainingIce = remainingIce.filter(
    (card) => card.known !== false && card.rezzed === true,
  );
  const continuationBudget = runnerRunWindowCreditBudget(input);
  const generalCredits = continuationBudget.credits;
  const knownPath = assessKnownRezzedIcePath(
    knownRezzedRemainingIce,
    input.playerView.own.rig ?? [],
    continuationBudget,
    server.root,
    input.playerView.opponent.credits,
  );
  const corpRezCredits = Math.max(0, input.playerView.opponent.credits);
  const visibleDuringRunRezSupport =
    server.statuses?.some(
      (status) => status.kind === "during_run_ice_rez_support",
    ) === true;
  const corpRezExposureActive =
    corpRezCredits > 0 || visibleDuringRunRezSupport;
  const currentRiskCreditBuffer =
    unknownIcePositions.length > 0 && corpRezExposureActive
      ? Math.max(1, Math.ceil(currentRiskModel.risk * 4))
      : 0;
  const creditsAfterKnownPath = Math.max(0, knownPath.creditsAfterPath);
  const currentReserveQuote = quoteRunnerRunRiskReserve({
    purpose: contract.reserveQuote.purpose,
    riskTolerance: contract.reserveQuote.riskTolerance,
    visibleCoverage: contract.reserveQuote.visibleCoverage,
    knownPathCost: Math.max(0, generalCredits - creditsAfterKnownPath),
    creditsAfterKnownPath,
    unknownIceCount: unknownIcePositions.length,
    unknownIcePositions,
    corpRezCredits,
    corpRezExposureActive,
    riskCreditBuffer: currentRiskCreditBuffer,
    runnerGripCount: input.playerView.own.gripOrHq.length,
    informationProbeAllowed:
      contract.reserveQuote.status === "information_probe_only",
  });
  const materialReserveDegradation =
    currentReserveQuote.creditGap > contract.reserveQuote.creditGap ||
    currentReserveQuote.handBufferGap > contract.reserveQuote.handBufferGap;
  const decision = materialReserveDegradation
    ? ("prefer_jack_out" as const)
    : ("preserve_continuation" as const);
  return {
    schemaVersion: "runner-run-risk-reassessment-v1",
    serverId: run.attackedServerId,
    observedAtStateVersion: input.playerView.stateVersion,
    decision,
    currentUnrezzedIceRisk: currentRiskModel.risk,
    baselineReserveQuote: structuredClone(contract.reserveQuote),
    currentReserveQuote,
    evidenceCodes: [
      "runner_run_risk_contract_reassessed",
      `runner_run_risk_contract_decision:${decision}`,
      `runner_run_risk_contract_baseline_credit_gap:${contract.reserveQuote.creditGap}`,
      `runner_run_risk_contract_current_credit_gap:${currentReserveQuote.creditGap}`,
      `runner_run_risk_contract_baseline_hand_gap:${contract.reserveQuote.handBufferGap}`,
      `runner_run_risk_contract_current_hand_gap:${currentReserveQuote.handBufferGap}`,
      `runner_run_risk_contract_current_unknown_ice:${unknownIcePositions.length}`,
      `runner_run_risk_contract_current_corp_rez_exposure:${corpRezExposureActive}`,
    ],
  };
}

function currentRunAbortAssessment(
  input: AiDecisionInput,
  runOrigin: RunnerRunOrigin | undefined,
  runRiskReassessment?: RunnerRunRiskReassessmentSignal,
): { evidenceCode: string } | undefined {
  const run = input.playerView.run;
  if (!run || !input.legalActions.some(runnerRunExitAction)) return undefined;
  const server = input.playerView.servers.find(
    (entry) => entry.id === run.attackedServerId,
  );
  if (!server) return undefined;
  const committedPayoff = runOrigin?.accessCommitment?.payoff;
  const preservesKnownAgendaPayoff =
    committedPayoff === "agenda" || committedPayoff === "score_threat";
  const flatlineRisk = runnerDamageThreatAssessment(input).flatlineRisk;
  if (
    input.playerView.timingPoint === "run.jack_out_window" &&
    run.phase === "movement" &&
    run.position?.kind === "server" &&
    (run.attackedServerId === "hq" || run.attackedServerId === "rd") &&
    input.playerView.own.gripOrHq.length === 0 &&
    flatlineRisk.level === "critical" &&
    !preservesKnownAgendaPayoff
  ) {
    return {
      evidenceCode: [
        "runner_critical_empty_grip_unknown_central_access_requires_jack_out",
        `server:${run.attackedServerId}`,
        `flatline_risk:${flatlineRisk.level}`,
        "hand:0",
        `committed_payoff:${committedPayoff ?? "none"}`,
      ].join("|"),
    };
  }
  if (runRiskReassessment?.decision === "prefer_jack_out") {
    return {
      evidenceCode: `runner_run_risk_contract_degraded:${run.attackedServerId}`,
    };
  }
  if (
    run.phase === "movement" &&
    run.position?.kind === "server" &&
    run.attackedServerId.startsWith("remote_")
  ) {
    if (
      runnerRemoteHasKnownNoCurrentPayoff(input, run.attackedServerId) &&
      !runnerRunOriginCommittedPayoff(runOrigin) &&
      !runnerCurrentRunHasSafeCompletionReward(input)
    ) {
      return {
        evidenceCode: `runner_current_run_known_no_payoff:${run.attackedServerId}`,
      };
    }
  }
  const remainingIce = currentRunRemainingIce(input);
  if (remainingIce.length === 0) return undefined;
  const continuationBudget = runnerRunWindowCreditBudget(input);
  const path = assessKnownRezzedIcePath(
    remainingIce,
    input.playerView.own.rig ?? [],
    continuationBudget,
    server.root,
    input.playerView.opponent.credits,
  );
  if (path.canReachAccess) return undefined;
  const conditionalRiskRoute = assessRandomBreakOrDamageRiskForVisibleRunPath(
    input,
    {
      targetServerId: run.attackedServerId,
      visibleIce: remainingIce,
    },
  );
  if (randomBreakOrDamageRiskCanCarryRunPath(conditionalRiskRoute)) {
    return undefined;
  }
  return {
    evidenceCode: `runner_current_run_remaining_path_unreachable:${run.attackedServerId}`,
  };
}

function runnerTerminalContestPreservesNonlethalDamageContinuation(
  runOrigin: ActiveRunnerRunRoot | undefined,
  visibleDamageAssessment:
    | ReturnType<typeof runnerVisibleLethalIceDamageJackOutAssessment>
    | undefined,
): boolean {
  const evidenceCode = visibleDamageAssessment?.evidenceCode;
  return (
    runOrigin?.parentBinding?.moduleId === "runner.contest_remote" &&
    runOrigin.parentBinding.signal.terminalPatternThreat === true &&
    runOrigin.purpose === "contest" &&
    runnerRunOriginCommittedPayoff(runOrigin) === "score_threat" &&
    runOrigin.runRiskContract !== undefined &&
    evidenceCode?.startsWith(
      "runner_visible_ice_damage_below_required_hand_floor_requires_jack_out|",
    ) === true
  );
}

function runnerRunWindowActionAssessments(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  runTargets: readonly RunnerRunTargetEvaluation[],
  economy: RunnerEconomyPosture,
  dependencies: PlanFirstLiveDependencies,
  runOrigin: RunnerRunOrigin | undefined,
  runRiskReassessment: RunnerRunRiskReassessmentSignal | undefined,
): NonNullable<RunnerPlanDomain["runWindows"][number]["actionAssessments"]> {
  const assessments: NonNullable<
    RunnerPlanDomain["runWindows"][number]["actionAssessments"]
  > = {};
  for (const candidate of candidates.filter((entry) =>
    isRunnerRunWindowCandidate(input, entry),
  )) {
    const action = input.legalActions.find(
      (entry) => entry.actionId === candidate.actionId,
    );
    if (!action) {
      assessments[candidate.actionId] = {
        admissible: false,
        evidenceCodes: [
          "runner_run_window_candidate_has_no_matching_legal_action",
        ],
      };
      continue;
    }
    if (
      action.type === "trigger_ability" &&
      (action.payload?.approachIceExposeDecision === "expose" ||
        action.payload?.approachIceExposeDecision === "decline")
    ) {
      continue;
    }
    assessments[candidate.actionId] = runnerRunWindowActionAssessment(
      input,
      candidate,
      action,
      runTargets,
      economy,
      dependencies,
      runOrigin,
      runRiskReassessment,
    );
  }
  return assessments;
}

function runnerRunWindowActionAssessment(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  action: AiDecisionInput["legalActions"][number],
  runTargets: readonly RunnerRunTargetEvaluation[],
  economy: RunnerEconomyPosture,
  dependencies: PlanFirstLiveDependencies,
  runOrigin: RunnerRunOrigin | undefined,
  runRiskReassessment: RunnerRunRiskReassessmentSignal | undefined,
): RunnerRunWindowActionAssessment {
  const paymentSupport = runnerRunPaymentSupportAction(input, candidate);
  if (paymentSupport)
    return runnerRunPaymentSupportAssessment(input, paymentSupport, runOrigin);
  const additionalAccessAssessment =
    assessRunnerAdditionalAccessRunWindowAction({
      candidate,
      activeServerId: input.playerView.run?.attackedServerId,
      runOriginPurpose: runOrigin?.purpose,
    });
  if (additionalAccessAssessment) return additionalAccessAssessment;
  const accessAction = candidate.semanticActionType.startsWith("access.");
  const restrictedRunSequenceAction = runnerRestrictedRunSequenceAction(
    input,
    candidate,
  );
  const optionalBonusRunDeclineAction = runnerOptionalBonusRunDeclineAction(
    input,
    candidate,
  );
  if (!input.playerView.run) {
    if (optionalBonusRunDeclineAction) {
      return {
        admissible: true,
        value: 0,
        evidenceCodes: [
          "runner_optional_bonus_run_decline",
          "runner_optional_bonus_run_decline_preserves_ordinary_actions",
        ],
      };
    }
    if (restrictedRunSequenceAction) {
      const serverId = restrictedRunSequenceAction.payload?.serverId;
      const costProfile =
        restrictedRunSequenceAction.payload?.restrictedActionGrantCostProfile;
      const costFree =
        costProfile === "no_click" &&
        restrictedRunSequenceAction.costs.every(
          (cost) => (cost.clicks ?? 0) === 0,
        );
      const targetEvaluation = runTargets.find(
        (evaluation) =>
          evaluation.actionId === restrictedRunSequenceAction.actionId,
      );
      const optionalBonusRun =
        restrictedRunSequenceAction.payload?.optionalBonusRun === true;
      const optionalBonusRunHasValue =
        !optionalBonusRun ||
        runnerRunTargetHasOptionalBonusRunValue(targetEvaluation);
      const hasOrdinaryActionAlternative = input.legalActions.some(
        (legalAction) =>
          legalAction.actionId !== restrictedRunSequenceAction.actionId &&
          legalAction.type !== "start_run",
      );
      const optionalRestrictedRunIsSafe =
        !hasOrdinaryActionAlternative ||
        (targetEvaluation?.pathPassability === "reachable" &&
          (targetEvaluation.recommendation === "run_now" ||
            targetEvaluation.recommendation === "run_if_free"));
      return {
        admissible:
          typeof serverId === "string" &&
          serverId.length > 0 &&
          optionalBonusRunHasValue &&
          optionalRestrictedRunIsSafe,
        ...(costFree
          ? { value: targetEvaluation?.score ?? 250 }
          : targetEvaluation
            ? { value: targetEvaluation.score }
            : {}),
        evidenceCodes: [
          "runner_engine_restricted_run_sequence_continuation",
          `runner_restricted_run_sequence_action:${restrictedRunSequenceAction.actionId}`,
          `runner_restricted_run_sequence_target:${typeof serverId === "string" ? serverId : "unknown"}`,
          `runner_restricted_run_sequence_remaining:${Number(restrictedRunSequenceAction.payload?.restrictedActionGrantRemainingActions)}`,
          ...(targetEvaluation
            ? [
                `runner_restricted_run_sequence_target_score:${targetEvaluation.score}`,
                `runner_restricted_run_sequence_target_recommendation:${targetEvaluation.recommendation}`,
                `runner_restricted_run_sequence_known_access_state:${targetEvaluation.knownAccessState}`,
              ]
            : ["runner_restricted_run_sequence_target_evaluation_unavailable"]),
          ...(costFree
            ? [
                "runner_restricted_run_sequence_cost_profile:no_click",
                "runner_restricted_run_sequence_cost_free_route_preferred",
              ]
            : []),
          ...(optionalBonusRun
            ? [
                "runner_optional_bonus_run",
                `runner_optional_bonus_run_value:${optionalBonusRunHasValue}`,
              ]
            : []),
          ...(hasOrdinaryActionAlternative
            ? [
                "runner_restricted_run_sequence_ordinary_action_alternative:true",
                `runner_restricted_run_sequence_optional_route_safe:${optionalRestrictedRunIsSafe}`,
              ]
            : []),
        ],
      };
    }
    return accessAction
      ? {
          admissible: true,
          evidenceCodes: [
            "runner_access_window_legal_without_run_snapshot",
            `runner_access_window_action:${action.type}`,
          ],
        }
      : {
          admissible: false,
          evidenceCodes: [
            "runner_run_window_action_requires_visible_active_run",
            `runner_run_window_action:${action.type}`,
          ],
        };
  }
  if (
    action.type === "trigger_ability" &&
    candidate.sourceKind === "card" &&
    typeof action.payload?.sourceDefinitionId === "string" &&
    candidate.abilityBindingMethod === "unresolved"
  ) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map(
        (legalAction) => legalAction.type,
      ),
      unresolvedActionIds: [action.actionId],
      owner: "action_semantics",
      removalCondition:
        "Bind each card-sourced run-window trigger to its exact CardSpec capability before a run plan may assess it.",
    });
  }
  const subtypeChangeAssessment = runnerEncounterSubtypeChangeAssessment(
    input,
    action,
  );
  if (subtypeChangeAssessment) return subtypeChangeAssessment;
  const successfulRunBeforeAccessEffect =
    runnerSuccessfulRunBeforeAccessEffectAction(input, candidate);
  if (successfulRunBeforeAccessEffect) {
    return runnerSuccessfulRunBeforeAccessEffectAssessment(
      successfulRunBeforeAccessEffect,
    );
  }
  const postPassDerezAndEndRun = runnerPostPassDerezAndEndRunAction(
    input,
    candidate,
  );
  const claimsPostPassDerezAndEndRun =
    (action.payload?.abilityId ?? action.payload?.runnerUtilityAbility) ===
    "derez_fully_broken_passed_ice_and_end_run";
  if (claimsPostPassDerezAndEndRun && !postPassDerezAndEndRun) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map(
        (legalAction) => legalAction.type,
      ),
      unresolvedActionIds: [action.actionId],
      owner: "action_semantics",
      removalCondition:
        "Bind the post-pass derez action to its exact CardSpec capability and both action-bound functional effects.",
    });
  }
  if (postPassDerezAndEndRun) {
    return runnerPostPassDerezAndEndRunAssessment(
      input,
      postPassDerezAndEndRun,
      runOrigin,
    );
  }
  if (
    (action.type === "pump_breaker" || action.type === "break_subroutine") &&
    input.playerView.run.phase !== "encounter_ice"
  ) {
    return {
      admissible: false,
      evidenceCodes: [
        "runner_encounter_action_requires_encounter_phase",
        `runner_run_phase:${input.playerView.run.phase}`,
      ],
    };
  }
  const supportedRunAction =
    accessAction ||
    restrictedRunSequenceAction !== undefined ||
    candidate.semanticActionType === "run.continue" ||
    candidate.semanticActionType === "run.jack_out" ||
    candidate.semanticActionType === "breaker.boost_strength" ||
    candidate.semanticActionType === "breaker.break_subroutine" ||
    postPassDerezAndEndRun !== undefined ||
    runnerRunRemainderStrengthBoostAction(input, candidate) !== undefined;
  if (!supportedRunAction) {
    return {
      admissible: false,
      evidenceCodes: [
        "runner_run_window_action_has_no_plan_local_assessment",
        `runner_run_window_semantic:${candidate.semanticActionType}`,
      ],
    };
  }
  const encounterExclusion =
    action.type === "pump_breaker" || action.type === "break_subroutine"
      ? dependencies.runnerEncounterActionExclusion(input, action)
      : undefined;
  const fullPathCommitmentPreserved = runnerFullPathCommitmentIsPreserved(
    input,
    runOrigin,
    runRiskReassessment,
  );
  const overriddenEncounterExclusion =
    fullPathCommitmentPreserved &&
    encounterExclusion &&
    runnerFullPathCommitmentCanOverrideEncounterExclusion(encounterExclusion)
      ? encounterExclusion
      : undefined;
  const effectiveEncounterExclusion = overriddenEncounterExclusion
    ? undefined
    : encounterExclusion;
  const planStepExclusion = runnerRunWindowPlanStepExclusion(
    input,
    action,
    dependencies,
    runOrigin,
  );
  const exclusion = effectiveEncounterExclusion ?? planStepExclusion;
  const programPreservationPayment = runnerProgramPreservationPaymentValue(
    input,
    action,
  );
  const accessedDefinitionId = input.playerView.run.accessedCard?.definitionId;
  const exactParentTrashTarget =
    accessedDefinitionId !== undefined &&
    runOrigin?.accessCommitment?.knownTargetDefinitionIds.includes(
      accessedDefinitionId,
    ) === true;
  const accessTrashAction =
    action.type === "trash_accessed_card"
      ? action
      : input.legalActions.find(
          (candidateAction) => candidateAction.type === "trash_accessed_card",
        );
  const accessTrashImpact =
    (action.type === "trash_accessed_card" ||
      action.type === "decline_trash") &&
    accessTrashAction
      ? assessRunnerAccessTrashImpact({
          input,
          trashAction: accessTrashAction,
          economyReserve: economy.desiredCreditReserve,
          parentReservedCredits: exactParentTrashTarget
            ? 0
            : reservedAccessTrashCredits(input, runOrigin?.accessCommitment),
        })
      : undefined;
  const committedParentPayoff = runnerRunOriginCommittedPayoff(runOrigin);
  return exclusion
    ? {
        admissible: false,
        evidenceCodes: [
          `runner_run_window_action_excluded:${exclusion.key}`,
          ...exclusion.reason
            .split("|")
            .map((entry) => entry.trim())
            .filter(Boolean),
        ],
      }
    : {
        admissible: true,
        ...(programPreservationPayment !== undefined
          ? { value: programPreservationPayment }
          : accessTrashImpact
            ? {
                value:
                  action.type === "trash_accessed_card"
                    ? accessTrashImpact.margin
                    : -accessTrashImpact.margin,
              }
            : {}),
        evidenceCodes: [
          accessAction
            ? "runner_access_window_action_plan_admissible"
            : action.type === "pump_breaker" ||
                action.type === "break_subroutine"
              ? "runner_encounter_action_plan_admissible"
              : "runner_run_window_action_plan_admissible",
          `runner_run_window_action:${action.type}`,
          ...(committedParentPayoff
            ? [`runner_run_parent_payoff_preserved:${committedParentPayoff}`]
            : []),
          ...(fullPathCommitmentPreserved
            ? ["runner_full_path_commitment_preserved"]
            : []),
          ...(overriddenEncounterExclusion
            ? [
                `runner_full_path_commitment_overrode_encounter_exclusion:${overriddenEncounterExclusion.key}`,
                ...overriddenEncounterExclusion.reason
                  .split("|")
                  .map((entry) => entry.trim())
                  .filter(Boolean),
              ]
            : []),
          ...(accessTrashImpact?.evidenceCodes ?? []),
          ...(runOrigin?.informationBoundaryReassessment?.evidenceCodes ?? []),
        ],
      };
}

function runnerEncounterSubtypeChangeAssessment(
  input: AiDecisionInput,
  action: LegalAction,
): RunnerRunWindowActionAssessment | undefined {
  if (
    action.type !== "trigger_ability" ||
    action.payload?.runnerAbility !== "change_icebreaker_subtype"
  ) {
    return undefined;
  }
  const selectedSubtype = action.payload.selectedSubtype;
  const run = input.playerView.run;
  if (
    run?.phase !== "encounter_ice" ||
    input.playerView.timingPoint !== "run.encounter_ice"
  ) {
    return {
      admissible: false,
      evidenceCodes: [
        "runner_encounter_subtype_change_requires_exact_visible_encounter",
      ],
    };
  }
  if (typeof selectedSubtype !== "string" || selectedSubtype.length === 0) {
    return {
      admissible: false,
      evidenceCodes: [
        "runner_encounter_subtype_change_requires_exact_selected_subtype",
      ],
    };
  }
  const encounteredIce = currentEncounteredIceCard(input);
  if (
    !encounteredIce ||
    encounteredIce.known !== true ||
    encounteredIce.rezzed !== true ||
    !encounteredIce.effectiveRunQuote
  ) {
    return {
      admissible: false,
      evidenceCodes: [
        "runner_encounter_subtype_change_requires_engine_quoted_visible_ice",
      ],
    };
  }
  if (!encounteredIce.subtypes?.includes(selectedSubtype)) {
    return {
      admissible: false,
      evidenceCodes: [
        "runner_encounter_subtype_change_does_not_match_current_ice",
        `runner_encounter_selected_subtype:${selectedSubtype}`,
      ],
    };
  }
  const sourceCardId = action.payload.cardId;
  const rig = input.playerView.own.rig ?? [];
  if (typeof sourceCardId !== "string") {
    return {
      admissible: false,
      evidenceCodes: ["runner_encounter_subtype_change_source_card_missing"],
    };
  }
  const sourceCard = rig.find((card) => card.instanceId === sourceCardId);
  if (!sourceCard) {
    return {
      admissible: false,
      evidenceCodes: ["runner_encounter_subtype_change_source_not_in_own_rig"],
    };
  }
  const path = assessKnownRezzedIcePath(
    [encounteredIce],
    rig.map((card) =>
      card.instanceId === sourceCard.instanceId
        ? { ...card, selectedSubtype }
        : card,
    ),
    input.playerView.own.credits,
  );
  if (!path.canReachAccess || path.blocked) {
    return {
      admissible: false,
      evidenceCodes: [
        "runner_encounter_subtype_change_has_no_payable_break_continuation",
        `runner_encounter_selected_subtype:${selectedSubtype}`,
        ...(path.noAccessReason
          ? [`runner_encounter_subtype_path:${path.noAccessReason}`]
          : []),
      ],
    };
  }
  return {
    admissible: true,
    value: 500,
    evidenceCodes: [
      "runner_run_window_action_plan_admissible",
      "runner_encounter_subtype_change_enables_payable_break_continuation",
      `runner_encounter_selected_subtype:${selectedSubtype}`,
      ...(path.visibleBreakCost !== undefined
        ? [`runner_encounter_subtype_break_cost:${path.visibleBreakCost}`]
        : []),
    ],
  };
}

function runnerPostPassDerezAndEndRunAssessment(
  input: AiDecisionInput,
  action: LegalAction,
  runOrigin: RunnerRunOrigin | undefined,
): RunnerRunWindowActionAssessment {
  const run = input.playerView.run;
  const targetIceId = action.payload?.targetIceId;
  const targetMatches =
    typeof targetIceId === "string"
      ? input.playerView.servers.flatMap((server) =>
          server.ice
            .filter((ice) => ice.instanceId === targetIceId)
            .map((ice) => ({ serverId: server.id, ice })),
        )
      : [];
  if (
    !run ||
    run.phase !== "movement" ||
    input.playerView.timingPoint !== "run.jack_out_window" ||
    targetMatches.length !== 1 ||
    targetMatches[0]!.serverId !== run.attackedServerId ||
    targetMatches[0]!.ice.rezzed !== true
  ) {
    return {
      admissible: false,
      evidenceCodes: [
        "runner_post_pass_derez_and_end_run_target_not_exactly_visible",
        `runner_post_pass_target:${typeof targetIceId === "string" ? targetIceId : "missing"}`,
      ],
    };
  }
  const committedPayoff = runOrigin?.accessCommitment?.payoff;
  if (
    visibleKnownAgendaOnServer(input, run.attackedServerId) ||
    committedPayoff === "agenda" ||
    committedPayoff === "score_threat"
  ) {
    return {
      admissible: false,
      evidenceCodes: [
        "runner_post_pass_derez_and_end_run_would_abandon_known_agenda",
        `runner_run_target:${run.attackedServerId}`,
      ],
    };
  }
  const targetDefinition = targetMatches[0]!.ice.definitionId
    ? CARD_DEFINITIONS_BY_ID[targetMatches[0]!.ice.definitionId!]
    : undefined;
  const rezCost =
    targetDefinition?.type === "ice" &&
    Number.isFinite(targetDefinition.rezCost)
      ? Math.max(0, targetDefinition.rezCost ?? 0)
      : 0;
  const paidCredits = legalActionCreditCost(action);
  return {
    admissible: true,
    value: 140 + Math.min(8, rezCost) * 40 - paidCredits * 60,
    evidenceCodes: [
      "runner_post_pass_derez_and_end_run_plan_admissible",
      `runner_post_pass_target:${targetIceId}`,
      `runner_post_pass_target_rez_cost:${rezCost}`,
      `runner_post_pass_paid_credits:${paidCredits}`,
      `runner_run_target:${run.attackedServerId}`,
    ],
  };
}

function runnerProgramPreservationPaymentValue(
  input: AiDecisionInput,
  action: LegalAction,
): number | undefined {
  const payment = action.payload?.payOrTrashProgramSubroutinePayment;
  if (typeof payment !== "number" || payment <= 0) return undefined;
  const installedProgramCount = (input.playerView.own.rig ?? []).filter(
    (card) => card.type === "program",
  ).length;
  if (installedProgramCount === 0) return undefined;
  return 1_000 + installedProgramCount * 100;
}

function runnerExactRunWindowPhaseActionIds(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  assessments: Readonly<Record<string, { admissible: boolean }>>,
  safetyRequiresJackOut: boolean,
  encounterRequiresTargetPreservingBreak: boolean,
): string[] {
  const run = input.playerView.run;
  if (!run) return [];
  const admissibleRunWindowCandidates = candidates.filter(
    (candidate) =>
      isRunnerRunWindowCandidate(input, candidate) &&
      assessments[candidate.actionId]?.admissible === true,
  );
  const fortToll = runnerFortPassTollWindow(input);
  if (fortToll) {
    const selected =
      safetyRequiresJackOut || !fortToll.pay ? fortToll.end : fortToll.pay;
    if (assessments[selected.actionId]?.admissible !== true) {
      throw new PlanResolutionFailure("no_current_route_head", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map((action) => action.type),
        unresolvedActionIds: [selected.actionId],
        owner: "plan_module",
        removalCondition:
          "Resolve the current fort-pass continuation or safety exit inside runner.convert_run_window.",
      });
    }
    return [selected.actionId];
  }
  if (safetyRequiresJackOut) {
    return admissibleRunWindowCandidates
      .filter((candidate) => candidate.actionType === "jack_out")
      .map((candidate) => candidate.actionId);
  }
  const paymentSupport = admissibleRunWindowCandidates.filter(
    (candidate) =>
      runnerRunPaymentSupportAction(input, candidate) !== undefined,
  );
  if (paymentSupport.length > 0)
    return paymentSupport.map((candidate) => candidate.actionId);
  const exactPayOrEndRunRouteActionIds =
    runnerExactPayOrEndRunAccessRouteActionIds(
      input,
      admissibleRunWindowCandidates,
    );
  if (exactPayOrEndRunRouteActionIds.length > 0) {
    return exactPayOrEndRunRouteActionIds;
  }
  if (encounterRequiresTargetPreservingBreak) {
    const directEncounterActionIds = input.legalActions
      .filter(
        (action) =>
          (action.type === "pump_breaker" ||
            action.type === "break_subroutine") &&
          assessments[action.actionId]?.admissible === true,
      )
      .map((action) => action.actionId);
    if (directEncounterActionIds.length > 0) {
      return directEncounterActionIds;
    }
  }
  const accessStartAvailable = input.legalActions.some(
    (action) =>
      action.type === "continue_run" &&
      action.payload?.serverId === run.attackedServerId &&
      action.payload?.encounterContinue !== true,
  );
  if (accessStartAvailable) {
    const additionalAccessRoutes = admissibleRunWindowCandidates.filter(
      runnerCandidateHasVisibleAdditionalAccessEffect,
    );
    if (additionalAccessRoutes.length > 0) {
      return additionalAccessRoutes.map((candidate) => candidate.actionId);
    }
  }
  if (currentRunHasPendingAutoPassIce(input)) {
    return admissibleRunWindowCandidates
      .filter((candidate) => candidate.actionType === "continue_run")
      .map((candidate) => candidate.actionId);
  }
  if (run.phase === "movement" && run.position?.kind === "server") {
    return admissibleRunWindowCandidates
      .filter(
        (candidate) =>
          candidate.actionType === "continue_run" ||
          runnerPostPassDerezAndEndRunAction(input, candidate) !== undefined,
      )
      .map((candidate) => candidate.actionId);
  }
  return [];
}

function runnerExactPayOrEndRunAccessRouteActionIds(
  input: AiDecisionInput,
  admissibleRunWindowCandidates: readonly ActionSemanticCandidate[],
): string[] {
  if (
    input.playerView.run?.phase !== "encounter_ice" ||
    input.playerView.timingPoint !== "run.encounter_ice"
  ) {
    return [];
  }
  const encounteredIce = currentEncounteredIceCard(input);
  const subroutines = encounteredIce?.effectiveRunQuote?.subroutines;
  if (!subroutines) return [];
  const admissibleActionIds = new Set(
    admissibleRunWindowCandidates.map((candidate) => candidate.actionId),
  );
  const paidContinuation = input.legalActions
    .filter(
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true &&
        action.payload?.encounterWillEndRun === false &&
        Number(action.payload?.payOrEndRunSubroutinePayment ?? 0) > 0 &&
        admissibleActionIds.has(action.actionId),
    )
    .map((action) => ({
      action,
      indexes: parseSubroutineIndexes(
        action.payload?.payOrEndRunSubroutineIndexes,
      ),
      unbrokenSubroutineCount: Number(
        action.payload?.unbrokenSubroutineCount ?? 0,
      ),
    }))
    .find(
      ({ indexes, unbrokenSubroutineCount }) =>
        indexes.size > 0 &&
        indexes.size === unbrokenSubroutineCount &&
        [...indexes].every(
          (index) =>
            subroutines[index]?.type === "end_the_run_unless_runner_pays",
        ),
    );
  if (!paidContinuation) return [];

  const completeAccessRoutes = input.legalActions.filter((action) => {
    if (!admissibleActionIds.has(action.actionId)) return false;
    if (action.actionId === paidContinuation.action.actionId) return true;
    if (action.type !== "break_subroutine") return false;
    const brokenIndexes = breakSubroutineIndexesForAction(action);
    return [...paidContinuation.indexes].every((index) =>
      brokenIndexes.has(index),
    );
  });
  const cheapestRouteCost = Math.min(
    ...completeAccessRoutes.map(legalActionCreditCost),
  );
  return completeAccessRoutes
    .filter((action) => legalActionCreditCost(action) === cheapestRouteCost)
    .map((action) => action.actionId);
}

function runnerBindExactRunWindowPhaseRoute(
  assessments: NonNullable<
    RunnerPlanDomain["runWindows"][number]["actionAssessments"]
  >,
  exactPhaseActionIds: readonly string[],
): NonNullable<RunnerPlanDomain["runWindows"][number]["actionAssessments"]> {
  if (exactPhaseActionIds.length === 0) return assessments;
  const exactRoute = new Set(exactPhaseActionIds);
  return Object.fromEntries(
    Object.entries(assessments).map(([actionId, assessment]) => {
      if (exactRoute.has(actionId) || assessment.admissible === false) {
        return [actionId, assessment];
      }
      return [
        actionId,
        {
          admissible: false,
          evidenceCodes: [
            "run_window_action_outside_exact_phase_route",
            ...assessment.evidenceCodes,
          ],
        },
      ];
    }),
  );
}

function runnerRunWindowPlanStepExclusion(
  input: AiDecisionInput,
  action: AiDecisionInput["legalActions"][number],
  dependencies: PlanFirstLiveDependencies,
  runOrigin: RunnerRunOrigin | undefined,
): SemanticRuntimeExclusion | undefined {
  const run = input.playerView.run;
  if (!run) return undefined;

  const informationReassessment = runOrigin?.informationBoundaryReassessment;
  if (
    (action.type === "pump_breaker" || action.type === "break_subroutine") &&
    informationReassessment?.decision === "retain_information" &&
    !runnerInformationProbeRequiresEncounterBreak(input, runOrigin) &&
    !runnerCurrentEncounterRequiresProgramPreservingBreak(input) &&
    (!informationReassessment.knownPathReachable ||
      informationReassessment.fundingGap > 0 ||
      informationReassessment.unavoidableHazardCount > 0)
  ) {
    return {
      key: "run_plan_information_reassessment_not_convertible",
      label: "Die neu quotierte Informationsroute trägt keine Fortsetzung",
      reason: [
        "run_plan_step:information_probe_reassessment",
        `run_plan_target:${run.attackedServerId}`,
        `run_plan_known_path_reachable:${informationReassessment.knownPathReachable}`,
        `run_plan_known_path_cost:${informationReassessment.knownPathCost}`,
        `run_plan_funding_gap:${informationReassessment.fundingGap}`,
        `run_plan_unavoidable_hazards:${informationReassessment.unavoidableHazardCount}`,
      ].join("|"),
    };
  }

  if (
    (action.type === "pump_breaker" || action.type === "break_subroutine") &&
    runOrigin?.purpose === "information" &&
    runOrigin.encounterCreditSpendLimit !== undefined &&
    !runnerCurrentEncounterRequiresDamagePreservingBreak(input, runOrigin) &&
    !runnerCurrentEncounterRequiresProgramPreservingBreak(input) &&
    legalActionCreditCost(action) > runOrigin.encounterCreditSpendLimit
  ) {
    return {
      key: "run_plan_information_budget_exceeded",
      label: "Informationsplan erlaubt diese Encounter-Ausgabe nicht",
      reason: [
        "run_plan_step:information_probe",
        `run_plan_target:${run.attackedServerId}`,
        `run_plan_encounter_spend_limit:${runOrigin.encounterCreditSpendLimit}`,
        `run_plan_action_credit_cost:${legalActionCreditCost(action)}`,
      ].join("|"),
    };
  }

  if (
    (action.type === "pump_breaker" || action.type === "break_subroutine") &&
    currentActiveRunHasKnownNoPayoff(input) &&
    !runnerRunOriginCommittedPayoff(runOrigin)
  ) {
    return {
      key: "run_plan_known_no_payoff",
      label: "Kein bekannter Zugriffsertrag",
      reason: [
        "run_plan_step:encounter_resource_spend",
        `run_plan_target:${run.attackedServerId}`,
        "run_plan_known_no_current_payoff:true",
      ].join("|"),
    };
  }

  if (
    action.type === "continue_run" &&
    action.payload?.encounterContinue === true &&
    action.payload?.encounterWillEndRun === true &&
    input.legalActions.some(
      (candidate) =>
        candidate.type === "continue_run" &&
        candidate.actionId !== action.actionId &&
        candidate.payload?.encounterContinue === true &&
        candidate.payload?.encounterWillEndRun === false,
    )
  ) {
    return {
      key: "run_plan_access_preserving_continue_available",
      label: "Zugriffspfad kann erhalten werden",
      reason: [
        "run_plan_step:continue_choice",
        "run_plan_access_preserving_continue_available:true",
        "run_plan_selected_continue_would_end_run:true",
      ].join("|"),
    };
  }

  if (
    action.type !== "continue_run" ||
    action.payload?.encounterContinue !== true ||
    !currentEncounterHasUnbrokenResolvableDeflector(input)
  ) {
    return undefined;
  }

  const affordableBreakerRoute = input.legalActions.some((candidate) => {
    if (
      candidate.type !== "pump_breaker" &&
      candidate.type !== "break_subroutine"
    ) {
      return false;
    }
    return (
      dependencies.runnerEncounterActionExclusion(input, candidate) ===
        undefined &&
      runnerRunWindowPlanStepExclusion(
        input,
        candidate,
        dependencies,
        runOrigin,
      ) === undefined
    );
  });
  if (!affordableBreakerRoute) return undefined;
  return {
    key: "run_plan_target_preserving_break_available",
    label: "Aktuelles Run-Ziel kann erhalten werden",
    reason: [
      "run_plan_step:deflector_choice",
      `run_plan_target:${run.attackedServerId}`,
      "run_plan_unbroken_deflector:true",
      "run_plan_target_preserving_break_available:true",
    ].join("|"),
  };
}

function runnerInformationProbeRequiresEncounterBreak(
  input: AiDecisionInput,
  runOrigin: RunnerRunOrigin | undefined,
): boolean {
  const reassessment = runOrigin?.informationBoundaryReassessment;
  if (
    reassessment?.decision !== "retain_information" ||
    reassessment.unknownIceCount <= 0 ||
    reassessment.fundingGap > 0 ||
    reassessment.unavoidableHazardCount > 0
  ) {
    return false;
  }
  const encounterWouldEndRun = input.legalActions.some(
    (action) =>
      action.type === "continue_run" &&
      action.payload?.encounterContinue === true &&
      action.payload?.encounterWillEndRun === true,
  );
  const encounterBreakAvailable = input.legalActions.some(
    (action) =>
      action.type === "pump_breaker" || action.type === "break_subroutine",
  );
  return encounterWouldEndRun && encounterBreakAvailable;
}

function runnerCurrentEncounterRequiresProgramPreservingBreak(
  input: AiDecisionInput,
): boolean {
  if (
    input.playerView.run?.phase !== "encounter_ice" ||
    !input.playerView.own.rig?.some((card) => card.type === "program")
  ) {
    return false;
  }
  const subroutines =
    currentEncounteredIceCard(input)?.effectiveRunQuote?.subroutines;
  if (
    !subroutines?.some(
      (subroutine) => subroutine.type === "trash_installed_program",
    )
  ) {
    return false;
  }
  return input.legalActions.some((action) => {
    if (
      action.type !== "continue_run" ||
      action.payload?.encounterContinue !== true
    ) {
      return false;
    }
    const quotedIds = action.payload.encounterSubroutineIds;
    const ids =
      typeof quotedIds === "string" ? quotedIds.split(",").filter(Boolean) : [];
    if (
      typeof quotedIds !== "string" ||
      new Set(ids).size !== ids.length ||
      ids.length !== action.payload.unbrokenSubroutineCount ||
      ids.some((id) => !subroutines.some((subroutine) => subroutine.id === id))
    ) {
      throw new PlanResolutionFailure("missing_action_semantics", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map((candidate) => candidate.type),
        unresolvedActionIds: [action.actionId],
        owner: "rules_contract",
        removalCondition:
          "Program-preserving encounter admission requires the Engine's exact remaining subroutine IDs and count.",
      });
    }
    const remaining = new Set(ids);
    return (
      subroutines.some(
        (subroutine) =>
          remaining.has(subroutine.id) &&
          subroutine.type === "trash_installed_program",
      ) === true
    );
  });
}

function runnerCurrentEncounterRequiresDamagePreservingBreak(
  input: AiDecisionInput,
  runOrigin: RunnerRunOrigin | undefined,
): boolean {
  if (currentEncounterRequiresFullBreak(input)) return true;
  const encounteredIce = currentEncounteredIceCard(input);
  if (!encounteredIce?.effectiveRunQuote) return false;
  return (
    runnerVisibleLethalIceDamageAssessment(input, [encounteredIce], {
      // Quote the consequence of deliberately leaving the current damage
      // subroutine unbroken. Affordability is evaluated by the exact
      // pump/break LegalActions, not by this consequence check.
      generalCredits: 0,
      // An information run already reserved a hand buffer for the unknown
      // remainder. Its encounter budget cannot discard that bound reserve
      // merely because the immediate damage is not itself a flatline.
      requiredHandFloor: Math.max(
        runnerConfirmedDamageRequiredHandFloor(input),
        runOrigin?.purpose === "information"
          ? (runOrigin.runRiskContract?.reserveQuote.requiredHandBuffer ?? 0)
          : 0,
      ),
    }) !== undefined
  );
}

function runnerRunOriginCommittedPayoff(
  runOrigin: RunnerRunOrigin | undefined,
): RunnerRunAccessCommitmentSignal["payoff"] | undefined {
  const commitment = runOrigin?.accessCommitment;
  if (!commitment || commitment.intendedAction === "decline") return undefined;
  const committed =
    commitment.payoff === "agenda" ||
    commitment.payoff === "score_threat" ||
    commitment.payoff === "trash_affordable" ||
    commitment.payoff === "access_bonus";
  return committed ? commitment.payoff : undefined;
}

function runnerFullPathCommitmentIsPreserved(
  input: AiDecisionInput,
  runOrigin: RunnerRunOrigin | undefined,
  reassessment: RunnerRunRiskReassessmentSignal | undefined,
): boolean {
  const run = input.playerView.run;
  const contract = runOrigin?.runRiskContract;
  return (
    run !== undefined &&
    contract !== undefined &&
    contract.serverId === run.attackedServerId &&
    contract.runCommitment === "full_path" &&
    contract.reserveQuote.unknownIceCount === 0 &&
    reassessment?.decision === "preserve_continuation" &&
    reassessment.currentReserveQuote?.unknownIceCount === 0
  );
}

function runnerFullPathCommitmentCanOverrideEncounterExclusion(
  exclusion: SemanticRuntimeExclusion,
): boolean {
  return (
    exclusion.key === "encounter_remote_payoff_reserve_would_break" ||
    exclusion.key === "encounter_reserve_would_break"
  );
}

function runnerFullPathCommitmentRequiresEncounterBreak(
  input: AiDecisionInput,
  assessments: Readonly<Record<string, { admissible: boolean }>>,
  runOrigin: RunnerRunOrigin | undefined,
  reassessment: RunnerRunRiskReassessmentSignal | undefined,
): boolean {
  if (!runnerFullPathCommitmentIsPreserved(input, runOrigin, reassessment)) {
    return false;
  }
  const encounterWouldEndRun = input.legalActions.some(
    (action) =>
      action.type === "continue_run" &&
      action.payload?.encounterContinue === true &&
      action.payload?.encounterWillEndRun === true,
  );
  if (!encounterWouldEndRun) return false;
  return input.legalActions.some(
    (action) =>
      (action.type === "pump_breaker" || action.type === "break_subroutine") &&
      assessments[action.actionId]?.admissible === true,
  );
}

function currentEncounterHasUnbrokenResolvableDeflector(
  input: AiDecisionInput,
): boolean {
  const quote = currentEncounteredIceCard(input)?.effectiveRunQuote;
  if (!quote) return false;
  const continueAction = input.legalActions.find(
    (action) =>
      action.type === "continue_run" &&
      action.payload?.encounterContinue === true,
  );
  const unbrokenSubroutineCount = Number(
    continueAction?.payload?.unbrokenSubroutineCount ?? 0,
  );
  if (unbrokenSubroutineCount !== quote.subroutines.length) return false;
  const deflectorContext = {
    visibleRemoteServerCount: input.playerView.servers.filter((server) =>
      server.id.startsWith("remote_"),
    ).length,
    visibleCorpCredits: input.playerView.opponent.credits,
  };
  return quote.subroutines.some((subroutine) =>
    visibleDeflectorSubroutineCanResolve(subroutine, deflectorContext),
  );
}

function currentActiveRunHasKnownNoPayoff(input: AiDecisionInput): boolean {
  const serverId = input.playerView.run?.attackedServerId;
  if (!serverId?.startsWith("remote_")) return false;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  return (
    server?.root.length === 0 ||
    runnerRemoteHasKnownNoCurrentPayoff(input, serverId)
  );
}

function windowKindForSemantic(
  semantic: string,
):
  | "automatic_resolution"
  | "mandatory_choice"
  | "run"
  | "access"
  | "pass_decline" {
  if (semantic === "choice.resolve") return "mandatory_choice";
  if (semantic.startsWith("access.")) return "access";
  if (semantic.startsWith("run.") || semantic.startsWith("breaker."))
    return "run";
  if (semantic.startsWith("turn_flow.")) return "pass_decline";
  return "automatic_resolution";
}

function planDecisionWindowKindForSemantic(
  semantic: string,
): AiPlanFirstDecisionDebug["executionOrigin"]["windowKind"] {
  if (semantic.startsWith("trace.")) return "trace";
  const engineWindowKind = windowKindForSemantic(semantic);
  return engineWindowKind === "automatic_resolution"
    ? "main_action"
    : engineWindowKind;
}

function decisionWindowId(input: AiDecisionInput, semantic: string): string {
  const choiceId = input.playerView.pendingChoice?.choiceId;
  if (choiceId) return choiceId;
  if (
    (semantic.startsWith("run.") || semantic.startsWith("breaker.")) &&
    input.playerView.run?.runId
  ) {
    return input.playerView.run.runId;
  }
  return `${input.playerView.timingPoint}:${input.playerView.stateVersion}`;
}

function selectedRunnerRunDebugQuote(
  input: AiDecisionInput,
  context: PlanSchedulerContext,
  action: LegalAction,
): AiPlanFirstDecisionDebug["selectedRunQuote"] | undefined {
  if (input.side !== "runner" || action.type !== "start_run") return undefined;
  const domain = context.domain as RunnerPlanDomain;
  const evaluation = domain.runTargetEvaluations?.find(
    (candidate) => candidate.actionId === action.actionId,
  );
  if (!evaluation) return undefined;
  const pressure = domain.centralPressure.find(
    (signal) =>
      signal.runActionIds?.includes(action.actionId) === true ||
      signal.runActionValues?.[action.actionId] !== undefined,
  );
  const contest = domain.remoteContests.find(
    (signal) => signal.runActionAssessments[action.actionId] !== undefined,
  );
  const signal = pressure ?? contest;
  const routeValue =
    pressure?.runActionRouteDiagnostics?.[action.actionId] ??
    contest?.runActionAssessments[action.actionId]?.routeDiagnostic;
  const riskContract = signal?.runRiskContract;
  return {
    schemaVersion: "ai-selected-run-quote-v1",
    actionId: action.actionId,
    serverId: evaluation.targetServerId,
    targetKind: evaluation.targetKind,
    purpose:
      riskContract?.reserveQuote.purpose ??
      (signal?.purpose === "contest"
        ? "contest"
        : (signal?.purpose ?? "access")),
    recommendation: evaluation.recommendation,
    pathPassability: evaluation.pathPassability,
    pathCost: evaluation.pathCost,
    creditsBeforeRun: input.playerView.own.credits,
    creditsAfterRun: evaluation.creditsAfterRun,
    score: evaluation.score,
    reachable: signal?.reachable ?? evaluation.pathPassability === "reachable",
    runCommitment: evaluation.runCommitment,
    ...(signal?.supportNeedId ? { supportNeedId: signal.supportNeedId } : {}),
    ...(signal?.routePreparation
      ? { routePreparation: signal.routePreparation }
      : {}),
    ...(routeValue ? { routeValue: structuredClone(routeValue) } : {}),
    ...(evaluation.prerunReserveQuote
      ? { reserveQuote: structuredClone(evaluation.prerunReserveQuote) }
      : {}),
    ...(riskContract
      ? {
          riskContract: {
            schemaVersion: riskContract.schemaVersion,
            observedAtStateVersion: riskContract.observedAtStateVersion,
            unrezzedIceRisk: riskContract.unrezzedIceRisk,
            runnerCreditsAtEntry: riskContract.runnerCreditsAtEntry,
            runnerHandCountAtEntry: riskContract.runnerHandCountAtEntry,
            visibleDuringRunRezSupport: riskContract.visibleDuringRunRezSupport,
            reserveQuote: structuredClone(riskContract.reserveQuote),
            evidenceCodes: [...riskContract.evidenceCodes],
          },
        }
      : {}),
    evidenceCodes: [
      ...evaluation.evidence,
      ...(signal ? [signal.evidenceCode] : []),
    ],
  };
}

function difficultyLevel(input: AiDecisionInput): number {
  if (input.difficulty === "easy") return 1;
  if (input.difficulty === "hard") return 3;
  return 2;
}
