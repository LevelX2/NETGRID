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
  buildCorpIceCardFacts,
  corpIcePlacementPostInstallRezCostFact,
} from "./runtime/corp-ice-placement/corp-ice-placement";
export type { CorpIceCardFacts } from "./runtime/corp-ice-placement/corp-ice-placement";
export { buildCorpIceDensityProfile } from "./runtime/corp-economy/corp-ice-density";
export type { CorpIceDensityProfile } from "./runtime/corp-economy/corp-ice-density";
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
export {
  buildDeckStrategyProfile,
  DECK_STRATEGY_METADATA_CONSUMER_CONTRACT,
} from "./deck-doctrine-strategy";
export {
  buildRunnerDeckEngineDoctrine,
  RUNNER_DECK_ENGINE_DOCTRINE_SCHEMA_VERSION,
} from "./runner-deck-engine-doctrine";
export type {
  RunnerDeckEngineDoctrine,
  RunnerDoctrineDependency,
  RunnerDoctrineDevelopmentTendency,
  RunnerDoctrineEngineLine,
  RunnerDoctrinePlanContribution,
  RunnerDoctrineProvider,
  RunnerDoctrineProviderAdditivity,
  RunnerDoctrineProviderPersistence,
} from "./runner-deck-engine-doctrine";
export type {
  AiDeckStrategyProfile,
  CorpDeckStrategyProfiles,
  DeckStrategyConfidence,
  DeckStrategyEvidence,
  DeckStrategyMetadataConsumerMode,
  DeckStrategyScore,
  RunnerDeckStrategyProfiles,
} from "./deck-doctrine-strategy";
export {
  buildRemoteDoctrineProfile,
  redactedRemoteDoctrineFacts,
  REMOTE_DOCTRINE_PROFILE_SCHEMA_VERSION,
} from "./remote-doctrine-profile";
export type {
  BuildRemoteDoctrineProfileParams,
  RemoteBuildTiming,
  RemoteDependency,
  RemoteDoctrineProfile,
  RemoteProtectionTarget,
  RemotePurpose,
} from "./remote-doctrine-profile";
export {
  advancePlanPortfolioForSelectedAction,
  adaptTacticalPlanToPortfolioEntry,
  aggregatePlanActionContributions,
  buildPlanPortfolioActionContributions,
  buildPlanPortfolio,
  PLAN_PORTFOLIO_SCHEMA_VERSION,
  planPortfolioTurnKey,
  planPortfolioActionCapacityStep,
  planPortfolioEntryCanAct,
  planPortfolioEntryForPlan,
  portfolioRoleForExecutionClass,
  redactedPlanPortfolioFacts,
  redactedPlanActionContributionFacts,
  tacticalPlanExecutionClass,
} from "./plans/plan-portfolio";
export type {
  BuildPlanPortfolioParams,
  PlanActionContribution,
  PlanActionContributionKind,
  PlanActionContributionScore,
  PlanExecutionClass,
  PlanPortfolioEntry,
  PlanPortfolioLifecycle,
  PlanPortfolioPlanType,
  PlanPortfolioRole,
  PlanPortfolioSnapshot,
} from "./plans/plan-portfolio";
export {
  residentPlanPortfolioSnapshot,
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "./plans/resident-plan-portfolio-memory";
export type { ResidentPlanPortfolio } from "./plans/resident-plan-portfolio";
export {
  assertCanonicalLegalActionInvocation,
  assertCurrentLegalActionBinding,
  assertPlanningRulesContext,
  assertTurnPlan,
  assertTurnPlanningHeadCandidate,
  buildCanonicalLegalActionInvocation,
  buildPlanningRulesContext,
  buildPlanningStateIdentity,
  buildSemanticActionSetFingerprint,
  canonicalTurnPlanningSerialize,
  CAMPAIGN_VALUE_POLICY_VERSION,
  PLAN_COMMITMENT_PRECEDENCE,
  TURN_ACTION_SEMANTIC_SCHEMA_VERSION,
  TURN_PLAN_EVALUATION_REGISTRY,
  TURN_PLAN_EVALUATION_REGISTRY_VERSION,
  TURN_PLAN_MODULE_SET_FINGERPRINT,
  TURN_PLANNING_CONTRACT_SCHEMA_VERSION,
  TURN_PLANNING_POLICY_VERSION,
  turnPlanningFingerprint,
  TurnPlanningContractError,
} from "./plans/turn-planning-contracts";
export type {
  CampaignMilestoneQuote,
  CampaignQuoteBasis,
  CampaignValueClaim,
  CampaignValueClaimAggregation,
  BoundTargetSlot,
  CanonicalChoiceValue,
  CanonicalChoiceBinding,
  CanonicalLegalActionInvocation,
  ChoicePlanningRole,
  CurrentLegalActionBinding,
  ExecutableWitness,
  PlanningRulesContext,
  PlanningStateIdentity,
  PlanCommitmentPrecedence,
  PlanModuleHorizonCapability,
  PriorityCoverage,
  TurnPlan,
  TurnPlanBoundary,
  TurnPlanEvaluationDimension,
  TurnPlanEvaluationRegistry,
  TurnPlanNode,
  TurnPlanPhase,
  TurnPlanPhaseTransition,
  TurnPlanningHeadCandidate,
  ValidatedPriorityObligation,
} from "./plans/turn-planning-contracts";
export {
  assessFundingOnlyIceStaging,
  buildCorpDefenseTurnPlanningSlice,
  CORP_DEFENSE_TURN_SLICE_VERSION,
  type CorpDefenseLineDisposition,
  type CorpDefenseTurnPlanningLine,
  type CorpDefenseTurnPlanningSlice,
} from "./plans/corp-defense-turn-planning";
export {
  buildCorpAgendaTurnPlanningSlice,
  campaignDisposition,
  CORP_AGENDA_TURN_SLICE_VERSION,
  type CorpAgendaLineFamily,
  type CorpAgendaTurnPlanningLine,
  type CorpAgendaTurnPlanningSlice,
} from "./plans/corp-agenda-turn-planning";
export {
  advanceTurnPlanCommitment,
  assertTurnPlanCommitment,
  certifyCurrentTurnCompletion,
  createTurnPlanCommitment,
  CURRENT_TURN_COMPLETION_CERTIFICATE_SCHEMA_VERSION,
  executionExpectationFromLegalAction,
  invalidateTurnPlanCommitmentForRestart,
  rematerializeCommittedTurnStep,
  TURN_PLAN_COMMITMENT_SCHEMA_VERSION,
  TurnPlanCommitmentError,
  validateCommittedTurnPhaseEntry,
} from "./plans/turn-plan-commitment";
export {
  assertCompleteCorpTurnPlanningCoverage,
  assertCorpTurnPlanningModuleRegistry,
  buildCorpTurnPlanningCoverageReport,
  CORP_ENGINE_WINDOW_SEMANTIC_PATTERNS,
  CORP_TURN_PLANNING_COVERAGE_SCHEMA_VERSION,
  CORP_TURN_PLANNING_MODULE_COVERAGE,
  CorpTurnPlanningCoverageError,
  corpTurnPlanningModuleCoverage,
} from "./plans/corp-turn-planning-coverage";
export type {
  CorpTurnPlanningActionCoverage,
  CorpTurnPlanningCoverageClassification,
  CorpTurnPlanningCoverageIssueCode,
  CorpTurnPlanningCoverageReport,
  CorpTurnPlanningModuleCoverage,
} from "./plans/corp-turn-planning-coverage";
export {
  buildCorpTurnPlannerShadow,
  CORP_TURN_PLANNER_SHADOW_SCHEMA_VERSION,
} from "./plans/corp-turn-planner-shadow";
export type { CorpTurnPlannerShadowResult } from "./plans/corp-turn-planner-shadow";
export {
  assertRunnerTurnPlanningModuleRegistry,
  buildRunnerTurnPlanningCoverageReport,
  RUNNER_ENGINE_WINDOW_SEMANTIC_PATTERNS,
  RUNNER_TURN_PLANNING_COVERAGE_SCHEMA_VERSION,
  RUNNER_TURN_PLANNING_MODULE_COVERAGE,
  runnerTurnPlanningModuleCoverage,
} from "./plans/runner-turn-planning-coverage";
export type {
  RunnerTurnPlanningCoverageReport,
  RunnerTurnPlanningModuleCoverage,
} from "./plans/runner-turn-planning-coverage";
export {
  buildRunnerTurnPlannerShadow,
  RUNNER_TURN_PLANNER_SHADOW_SCHEMA_VERSION,
} from "./plans/runner-turn-planner-shadow";
export type { RunnerTurnPlannerShadowResult } from "./plans/runner-turn-planner-shadow";
export {
  corpCampaignDescriptors,
  reconcileCorpCampaignContinuity,
  CORP_OPPONENT_CAMPAIGN_CONTINUITY_VERSION,
} from "./plans/corp-opponent-campaign-continuity";
export type { CorpCampaignDescriptor } from "./plans/corp-opponent-campaign-continuity";
export {
  CORP_TURN_PLANNER_CUTOVER_VERSION,
  resolveCorpTurnPlannerCutover,
  resolveTurnPlannerCutover,
  TURN_PLANNER_CUTOVER_VERSION,
} from "./plans/corp-turn-planner-cutover";
export type {
  CorpTurnPlannerCutoverResult,
  TurnPlannerCutoverResult,
} from "./plans/corp-turn-planner-cutover";
export type {
  CampaignRequote,
  CommittedInvocationRoute,
  CommittedTurnPlanNode,
  CommittedTurnPlanPhase,
  CurrentTurnCompletionCertificate,
  HardPlanCommitmentRevalidation,
  TurnPlanCommitment,
  TurnPlanCommitmentStatus,
  TurnPlanContinuationEvidence,
  TurnPlanContinuationResult,
  TurnPlanExecutionLease,
  TurnPlanExecutionReceipt,
  TurnPlanNodeExecutionExpectation,
  TurnPlanObservationClass,
  TurnPlanPhaseEntryEvidence,
  TurnPlanRematerialization,
  TurnPlanReplanReason,
} from "./plans/turn-plan-commitment";
export {
  applyCertifiedTurnProjectionDelta,
  assessTurnObservationBoundary,
  buildProjectedDecisionFrame,
  certifiedTurnProjectionDeltaFromCandidate,
  PROJECTED_DECISION_FRAME_SCHEMA_VERSION,
  TURN_PROJECTION_DELTA_SCHEMA_VERSION,
  TurnProjectionError,
} from "./plans/turn-projection";
export type {
  BoundaryActionAssessment,
  BoundaryResidualTurnValueBasis,
  NeedHitProbabilityBand,
  ProjectedDecisionFrame,
  ProjectedHandDisposition,
  ProjectedKnownBoardCard,
  ProjectedKnownZoneState,
  ProjectedPlanProgress,
  ProjectedRestrictedActionToken,
  ProjectedResourceReservation,
  ProjectionUncertainty,
  ProjectionValueRange,
  TurnBoundaryKind,
  TurnProjectionDelta,
} from "./plans/turn-projection";
export {
  searchDeterministicRemainderTurnPlans,
  TURN_REMAINDER_SEARCH_SCHEMA_VERSION,
} from "./plans/turn-remainder-search";
export type {
  TurnRemainderSearchBudget,
  TurnRemainderSearchLine,
  TurnRemainderSearchOffer,
  TurnRemainderSearchPruneReason,
  TurnRemainderSearchResult,
  TurnRemainderSearchStep,
} from "./plans/turn-remainder-search";
export {
  compareCreditDemandPriority,
  createCorpCreditDemand,
  createCreditDemand,
  createRunnerCreditDemand,
  CREDIT_DEMAND_PRIORITY_RANK,
  CREDIT_DEMAND_SCHEMA_VERSION,
} from "./plans/credit-demand";
export type {
  CreateCreditDemandParams,
  CreateSideCreditDemandParams,
  CreditDemand,
  CreditDemandDeadline,
  CreditDemandHardness,
  CreditDemandPriority,
  CreditDemandPurpose,
  CreditRestriction,
} from "./plans/credit-demand";
export {
  ACTION_DEMAND_PRIORITY_RANK,
  ACTION_DEMAND_SCHEMA_VERSION,
  compareActionDemandPriority,
  createActionDemand,
  createCorpActionDemand,
  createRunnerActionDemand,
} from "./plans/action-demand";
export type {
  ActionDemand,
  ActionDemandDeadline,
  ActionDemandHardness,
  ActionDemandPriority,
  ActionDemandPurpose,
  ActionDemandRestriction,
  CreateActionDemandParams,
  CreateSideActionDemandParams,
} from "./plans/action-demand";
export {
  ACTION_CAPACITY_ROUTE_SCHEMA_VERSION,
  actionDemandHardBlockerIsResolved,
  pruneDominatedActionCapacityRoutes,
  revalidateActionCapacityRoute,
  searchActionCapacityRoutes,
} from "./plans/action-capacity-route";
export {
  deriveTacticalPlanActionDemands,
  primaryActionDemandForPlan,
  publishTacticalPlanActionDemands,
} from "./plans/tactical-plan-action-demands";
export type {
  ActionCapacityActionCandidate,
  ActionCapacityRoute,
  ActionCapacityRouteHorizon,
  ActionCapacityRouteReliability,
  ActionCapacityRouteSearchResult,
  ActionCapacityRouteStatus,
  ActionCapacityRouteStep,
  FutureActionCapacityProjection,
  SearchActionCapacityRoutesParams,
} from "./plans/action-capacity-route";
export {
  creditDemandHardBlockerIsResolved,
  FUNDING_ROUTE_SCHEMA_VERSION,
  pruneDominatedRoutes,
  revalidateFundingRoute,
  searchFundingRoutes,
} from "./plans/funding-route";
export {
  compareEconomyActionDominance,
  dominatedEconomyActionIds,
  ECONOMY_CREDIT_BASE_CURVE,
  ECONOMY_CREDIT_DEMAND_BONUS,
  economyActionMode,
  economyCreditBaseValue,
  economyNetHandDeltaValue,
  scoreEconomyAction,
} from "./economy/economy-action-score";
export type {
  EconomyActionDominance,
  EconomyActionMode,
  EconomyActionScore,
  EconomyScoreComponent,
} from "./economy/economy-action-score";
export type {
  FundingActionCandidate,
  FundingRoute,
  FundingRouteHorizon,
  FundingRouteReliability,
  FundingRouteSearchResult,
  FundingRouteStatus,
  FundingRouteStep,
  FutureFundingProjection,
  SearchFundingRoutesParams,
} from "./plans/funding-route";
export {
  getPlanPortfolioMemorySnapshot,
  rememberPlanPortfolioSnapshot,
  resetPlanPortfolioMemory,
} from "./plans/plan-portfolio-memory";
export {
  assessCorpCentralProtectionFloor,
  assessCorpRemoteProject,
} from "./plans/corp-remote-project-assessment";
export type {
  CorpCentralProtectionFloorAssessment,
  CorpRemoteProjectAssessment,
  CorpRemoteProtectionBand,
} from "./plans/corp-remote-project-assessment";
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
  RunnerHandDevelopmentActivationPrerequisite,
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
