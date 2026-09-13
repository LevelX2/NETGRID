import { corpOptionalStartDrawSignal } from "../corp/hand-management/hand-start-draw";
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
import { projectRunnerEncounterCashCost } from "../actions/runner-encounter-cost-projection";
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
import { ActiveRunnerRunRoot } from "../plans/runner-run-origin-contract";
import {
  type RunnerPlanDomain,
  type RunnerRunRiskReassessmentSignal,
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
import { runnerKnownAgendaRunEvaluationIsCertified } from "../run-analysis/runner-plan-run-route-facts";
import { runnerRunLockReleaseRoutes } from "../run-analysis/runner-run-lock-release-routes";
import { runnerSameTurnAccessPreparationSourceDefinitionId } from "../run-analysis/runner-run-preparation";
import {
  bindSelectedRunnerTargetedBypassChoiceContinuation,
  bindSelectedRunnerTargetedIceTrashChoiceContinuation,
} from "../run-analysis/runner-run-preparation-choice-binding";
import { runnerEffectsProvideTopTrashRecovery } from "../runner-canonical-hint-semantics";
import { runnerRecentFutureEncounterDamageSafetyAbort } from "../runner-damage-threat-assessment";
import { quoteRunnerRunAfterGuaranteedFunding } from "../runner-run-target-evaluation";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../runner-run-target-evaluation";
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
  runnerTerminalRemoteLastChanceKnownPathFundingGap,
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
import { isRunnerRunWindowCandidate } from "../runner/run-window/run-window-action-facts";
import {
  runnerRunRiskContractReassessment,
  runnerRunWindowActionAssessments,
} from "../runner/run-window/run-window-assessment";
import {
  resolvePlanBoundRunnerBrokenIceVirusCounterChoice,
  resolvePlanBoundRunnerPostBreakStealthLossChoice,
} from "../runner/run-window/run-window-break-continuation";
import {
  reconcileSelectedRunnerCostPenaltySupportOrigin,
  resolvePlanBoundRunnerCostPenaltyContinuation,
} from "../runner/run-window/run-window-cost-continuation";
import { buildRunnerRunWindowSignals } from "../runner/run-window/run-window-discovery";
import { addRunnerRunWindowDispositions } from "../runner/run-window/run-window-dispositions";
import { resolvePlanBoundRunnerHiddenDrawChoice } from "../runner/run-window/run-window-hidden-draw-continuation";
import {
  activeRunRootPlan,
  reassessActiveInformationRunParent,
} from "../runner/run-window/run-window-origin";
import { bindSelectedPlanActionOrigin } from "../runner/run-window/run-window-selected-origin";
import {
  advanceSelectedRunnerRunStartOrderOrigin,
  resolvePlanBoundRunnerRunStartOrderChoice,
} from "../runner/run-window/run-window-start-continuation";
import {
  resolvePlanBoundRunnerTraceBaseLinkChoice,
  resolvePlanBoundRunnerTraceSuccessCancelChoice,
} from "../runner/run-window/run-window-trace-continuation";
import {
  bindSelectedEngineWindowRunnerVacuumLinkOrigin,
  resolvePlanBoundRunnerVacuumLinkChoice,
} from "../runner/run-window/run-window-vacuum-link-continuation";
import { runnerActionRequiresTargetedBypassPlan } from "../runner/run-window/runner-targeted-bypass-plan";
import { runnerShellTradersActionDispositions } from "../runner/shell-traders/shell-traders-dispositions";
import { buildRunnerShellTradersPipelineSignals } from "../runner/shell-traders/shell-traders-plan-signals";
import {
  runnerImmediateAgendaPointTerminalWinSignals,
  runnerTerminalWinSignals,
} from "../runner/terminal-win/terminal-win-signals";
import { rememberStrategicIntentState } from "../strategic-intent-memory";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import type { AiDecisionRuntimeOptions } from "./choose-ai-action";
import { uniqueBy } from "./collection";
import { corpCandidateProjectsCardDraw } from "./corp-draw-action-facts";
import { corpScorelineFeasibilityForDecisionInput } from "./corp-scoreline-feasibility";
import type { DiscardKeepScorer } from "./discard-choice-selection";
import { type DiscardChoiceKeepScore } from "./discard-choice-selection";
import {
  runnerCentralPayoffServer,
  runnerCentralPayoffServerForDefinition,
} from "./runner-access-payoff-facts";
import {
  runnerCandidateSourceDefinitionId,
  runnerInstallSourceInstanceId,
  visibleOwnCardByInstanceId,
} from "./runner-action-source-facts";
import {
  runnerCandidateIsOneShotSearch,
  runnerCandidateIsOptionalProgramTrashInstall,
  runnerOptionalProgramTrashInstallDuplicatesInstalledDefinition,
} from "./runner-development-action-facts";
import {
  runnerExactFundingRouteContract,
  runnerImmediateGeneralLiquidEconomyRoute,
} from "./runner-exact-funding-routes";
import { assessRunnerHandRotation } from "./runner-hand-rotation-assessment";
import {
  runnerCandidateIsCentralInformationAbility,
  runnerCandidateIsExposeAbility,
} from "./runner-information-action-facts";
import type { RunnerProgramInstallTrashAssessment } from "./runner-program-install-trash-policy";
import { runnerCandidateExecutesProgramSearch } from "./runner-program-search-facts";
import {
  bindRunnerRigDemandProjectionToCoverageGaps,
  buildRunnerRigDemandProjectionForCoverage,
  runnerCoverageRigDemandInputsComplete,
} from "./runner-rig-demand-adapter";
import {
  runnerStrategicExchangeHardExclusion,
  runnerStrategicExchangeKinds,
  runnerStrategicExchangeRequiresBoundParent,
} from "./runner-strategic-exchange";
import { runnerActionRequiresTargetedIceTrashPlan } from "./runner-targeted-ice-trash-plan";
import { runnerTerminalContestThreat } from "./runner-terminal-contest-threat";
import { turnKey } from "./runtime-identifiers";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";
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
  addRunnerRunWindowDispositions({ domain, input, candidates, add });
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
    coverageGaps.flatMap((gap) => [
      ...gap.directSearchActionIds,
      ...(gap.heapRecoveryPreparation
        ? [gap.heapRecoveryPreparation.actionId]
        : []),
    ]),
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
      terminalKnownPathFundingGap: (target) =>
        runnerTerminalRemoteLastChanceKnownPathFundingGap(input, target),
      quoteRunAfterCashout: (target, actionId) => {
        const fundingCandidate = candidates.find(
          (candidate) => candidate.actionId === actionId,
        );
        return fundingCandidate
          ? quoteRunnerRunAfterGuaranteedFunding({
              input,
              deckCapabilities: _deckCapabilities,
              fundingCandidate,
              runActionId: target.actionId,
              targetServerId: target.targetServerId,
            })
          : undefined;
      },
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
    const bankFunding = support
      ? creditBanks.find(
          (bank) =>
            bank.runFunding?.parentPlanInstanceId ===
              support.parentPlanInstanceId &&
            bank.runFunding.needId === support.needId,
        )?.runFunding
      : undefined;
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
            ...(bankFunding
              ? {
                  providerModuleId: "runner.credit_bank" as const,
                  gap: bankFunding.gap,
                  targetCredits: currentCredits + bankFunding.gap,
                  routeActionIds: [
                    bankFunding.routeAssessment.firstStepActionId!,
                  ],
                  routeAssessment: bankFunding.routeAssessment,
                }
              : {}),
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
  const { runWindows } = buildRunnerRunWindowSignals({
    candidates,
    input,
    economy,
    activeRunRoot,
    runRiskReassessment,
    runWindowActionAssessments,
    runTargets,
  });
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
    corpOptionalStartDrawSignal(input, sourceBoundCandidates) ??
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
    ) ||
    context.input.playerView.pendingChoice?.source.startsWith(
      "card_implementation.trash_installed_program:",
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
  if (
    context.input.playerView.pendingChoice?.source.startsWith(
      "runner.delayed_install_destination:",
    )
  ) {
    return undefined;
  }
  if (
    context.input.side === "corp" &&
    context.input.playerView.pendingChoice?.source.startsWith(
      "scored_agenda.start_draw_choice:",
    )
  )
    return undefined;
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
  return candidates.map((rawCandidate) => {
    const candidate = projectRunnerEncounterCashCost(input, rawCandidate);
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
