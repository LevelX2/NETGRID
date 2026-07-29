import {
  AI_DECISION_DEBUG_SCHEMA_VERSION,
  AI_PLAN_FIRST_DECISION_DEBUG_SCHEMA_VERSION,
  CARD_DEFINITIONS_BY_ID,
  CORP_FORT_RUN_REZ_SUPPORT_KIND,
  CORP_FORT_RUN_REZ_SUPPORT_QUOTE_SCHEMA_VERSION,
  ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION,
  type AiDecision,
  type AiDecisionInput,
  type AiPlanFirstDecisionDebug,
  type CardDefinition,
  type CorpPunishRouteQuote,
  type LegalAction,
  type Side,
  type VisibleCard,
  type VisibleCorpRezCostQuote,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { BuildActionSemanticCandidatesParams } from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import { rootRezCreditOutcomeProjectionStatus } from "../actions/action-economy-projection";
import { AI_HINTS_BY_CARD } from "../ai-hints";
import { rolesForDeckDoctrineCard } from "../deck-doctrine-card-roles";
import { getStructuredTagPunishProfileForCard } from "../tag-punish-ontology-consumer";
import type { DeckCapabilityProfile } from "../deck-capabilities";
import type { RunnerHandDevelopmentEvaluation } from "../runner-hand-development";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../runner-run-target-evaluation";
import { randomBreakOrDamageRiskProfileForDefinitionId } from "../actions/risk-action-projection";
import { rememberStrategicIntentState } from "../strategic-intent-memory";
import type { RunnerStrategicIntentProfile } from "../runner-strategic-intent";
import {
  CORP_PLAN_PRIORITY_POLICY,
  RUNNER_PLAN_PRIORITY_POLICY,
} from "../plans/plan-assessment";
import {
  assessCorpEconomyFundingRoute,
  corpScorePriorityClass,
  corpScorePlanTarget,
  corpDefenseActionDispositions,
  corpDefensePortfolioHasExecutableRoute,
  corpExactBasicLiquidCreditCandidate,
  corpGenericDefensePriorityClass,
  corpEconomyPriorityClass,
  corpEconomyActionIsOwned,
  createCorpCorePlanModules,
  immediateCorpLiquidCreditGain,
  type CorpCorePlanDomain,
  type CorpDefenseSignal,
  type CorpExactIceRezRouteProjection,
  type CorpEconomyImmediateOperationSignal,
  type CorpEconomyInstalledAssetWithdrawalSignal,
  type CorpEconomyLiquidityDevelopmentSignal,
  type CorpEconomyOperationThresholdSignal,
  type CorpEconomyReserveSignal,
  type CorpScoreProjectSignal,
} from "../plans/corp-core-plan-modules";
import {
  corpPunishCampaignOwnsCandidate,
  corpHandPriorityClass,
  createCorpTacticalPlanModules,
  type CorpPlanDomain,
  type CorpPunishCampaignSignal,
} from "../plans/corp-tactical-plan-modules";
import {
  createRunnerCorePlanModules,
  runnerCoverageRoleNeedles,
  runnerDevelopmentCardAdmission,
  runnerExactBasicLiquidCreditCandidate,
  runnerFundingRouteCandidateIsMaterializable,
  type RunnerCorePlanDomain,
  type RunnerFundingNeedSignal,
  type RunnerFundingRouteAssessment,
} from "../plans/runner-core-plan-modules";
import {
  createRunnerTacticalPlanModules,
  type RunnerPlanDomain,
  type RunnerRemoteContestSignal,
  type RunnerRestrictedProgramInstallSequenceCommitment,
  type RunnerRestrictedProgramInstallSequenceStep,
  type RunnerRunAccessCommitmentSignal,
  type RunnerRunWindowActionAssessment,
} from "../plans/runner-tactical-plan-modules";
import {
  createRunnerCreditDemand,
  type CreateSideCreditDemandParams,
} from "../plans/credit-demand";
import { searchFundingRoutes } from "../plans/funding-route";
import {
  createSidePlanRegistry,
  runPlanScheduler,
  type EngineWindowResolution,
  type PlanActionDisposition,
  type PlanSchedulerContext,
  type PlanSchedulerResult,
} from "../plans/plan-scheduler";
import {
  TRANSIENT_PLAN_SIGNAL_SCHEMA_VERSION,
  type TransientPlanSignal,
} from "../plans/transient-plan-signals";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import { planInstanceIdForProposal } from "../plans/plan-instance";
import {
  rememberResidentPlanPortfolio,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import type { ResidentPlanPortfolio } from "../plans/resident-plan-portfolio";
import { createTurnCompletionPlanModule } from "../plans/turn-completion-plan-module";
import {
  missingBreakerCoverageKind,
  runnerHandBreakerForCoverage,
} from "../plans/tactical-plan-breaker-coverage";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";
import { buildRunnerRemoteTrashAccessContext } from "../simulation/remote-trash-access-context";
import { visibleSourceDefinitionsByInstanceId } from "./visible-source-definitions";
import { rolesMatch } from "./role-match";
import type { AiDecisionRuntimeOptions } from "./choose-ai-action";
import { withDecisionLocalCorpPunishRouteQuotes } from "./corp-punish-route-quote-input";
import { corpPurgeHasVisibleStrategicPressure } from "./corp-purge-impact";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import {
  buildCorpHandInventoryFacts,
  type CorpHandDomainRouteClaimInput,
  type CorpHandInventoryFacts,
} from "./corp-hand-inventory-facts";
import {
  assessCorpDrawAdmission,
  type CorpDrawAdmissionAssessment,
  type CorpDrawAdmissionPriority,
  type CorpDrawCapacityReleaseRoute,
} from "./corp-draw-admission";
import {
  assessCorpOpeningRush,
  isCorpOpeningTurnSerial,
} from "./corp-opening-rush";
import {
  buildCorpAmbushPlanSignals,
  corpAmbushAdvanceDispositionEvidence,
  corpCandidateIsAmbushInstall,
} from "./corp-ambush-plan-signals";
import {
  corpScorelineActionCanCloseThisTurn,
  corpScorelineFeasibilityForDecisionInput,
  type CorpScorelineFeasibility,
} from "./corp-scoreline-feasibility";
import {
  runnerDamageThreatAssessment,
  runnerFutureEncounterDamageJackOutAssessment,
  runnerKnownAccessDamageJackOutAssessment,
  runnerRecentFutureEncounterDamageSafetyAbort,
} from "../runner-damage-threat-assessment";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
  visibleDeflectorSubroutineCanResolve,
} from "../visible-run-analysis";
import { runnerRemoteHasKnownNoCurrentPayoff } from "./runner-known-access-payoff-context";
import {
  currentEncounteredIceCard,
  currentRunRemainingIce,
} from "./current-encounter";
import {
  corpRegionReplacementComponent,
  corpUpgradeInstallPlacementComponent,
  corpUpgradePlacementAssessment,
} from "./corp-upgrade-placement";
import { corpKnownAgendaInventory } from "./corp-known-agenda-inventory";
import { allocateCorpCentralDefenseFromAiFacts } from "./corp-central-defense-facts-adapter";
import { visibleCorpIceDefenseProfile } from "./semantic-runtime-corp-effective-defense";
import { corpRootRezTimingComponent } from "./corp-scoreline/semantic-runtime-corp-score-ice-components";
import {
  corpMissingConcreteDefenseDrawNeed,
  corpMissingConcreteScoreDefenseDrawNeed,
  corpOptionalDrawAttemptedInEventTailThisTurn,
} from "./corp-economy/corp-defensive-draw";
import {
  assessBestFundedCorpScoreProtection,
  corpFundedScoreProtectionCertifiesBinding,
  projectCorpFundedIceInstallRoute,
  type CorpFundedIceInstallRouteProjection,
  type CorpFundedRemoteAccessRiskNeed,
  type KnownCorpFundedIceInstallRouteProjection,
  type CorpScoreReserve,
} from "./corp-funded-score-protection";
import { compareExactProbabilities } from "./corp-score-protection-assessment";
import { projectExactCorpIceRezRoute } from "./corp-exact-ice-rez-route";
import { assessCorpExactIceRezAgainstScoreReserves } from "./corp-defense-score-reserve";
import {
  runnerRunLockReleaseProjection,
  runnerRunLockReleaseScoreComponent,
} from "./runner-run-lock-release-score";
import {
  assessRunnerRunFundingAdmission,
  runnerRunTargetIsDirectlyConvertible,
} from "./runner-run-funding-admission";
import { assessRunnerDevelopmentCashOutAdmission } from "./runner-development-cashout-admission";
import {
  runnerActionRequiresTargetedBypassPlan,
  runnerDefinitionRequiresTargetedBypassPlan,
  runnerGenericDevelopmentMayOwnAction,
  runnerTargetedBypassPlanCommitment,
  type RunnerTargetedBypassCommitment,
  type RunnerTargetedBypassChoiceContinuation,
} from "./runner-targeted-bypass-plan";
import { runnerHqSuccessWindowSetupAssessment } from "./runner-start-run-score";
import { runnerArchivesHasQualifiedHiddenPayoff } from "./runner-archives-score";
import {
  assessRunnerAdditionalAccessRunWindowAction,
  runnerCandidateHasVisibleAdditionalAccessEffect,
} from "./runner-run-window-additional-access";
import { mergedPublicHistory, serverIdFromEvent } from "./public-event-history";
import {
  corpSameTurnScoreConversionPaths,
  type CorpScoreConversionStep,
} from "../plans/tactical-plan-corp-score-conversion";
import {
  corpCounterBankScoreProjects,
  isQuotedCorpCounterBankInHq,
} from "../plans/corp-counter-bank-score-plan";

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
  selectedChoicesForDecision: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecision["selectedChoices"] | undefined;
  runnerEncounterActionExclusion: (
    input: AiDecisionInput,
    action: AiDecisionInput["legalActions"][number],
  ) => SemanticRuntimeExclusion | undefined;
};

type RunnerRemoteContestSignalDraft = Omit<
  RunnerRemoteContestSignal,
  "runActionAssessments"
> & {
  preferredRunActionIds?: string[];
};

export function choosePlanFirstLiveAction(
  input: AiDecisionInput,
  options: AiDecisionRuntimeOptions,
  dependencies: PlanFirstLiveDependencies,
): AiDecision {
  input = withDecisionLocalCorpPunishRouteQuotes(
    input,
    options.quoteCorpPunishRoute,
  );
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
          modules: [
            ...createRunnerCorePlanModules(),
            ...createRunnerTacticalPlanModules(),
            createTurnCompletionPlanModule("runner"),
          ],
        })
      : createSidePlanRegistry({
          side: "corp",
          priorityPolicy: CORP_PLAN_PRIORITY_POLICY,
          modules: [
            ...createCorpCorePlanModules(),
            ...createCorpTacticalPlanModules(),
            createTurnCompletionPlanModule("corp"),
          ],
        });
  const windowContext: PlanSchedulerContext = {
    input,
    actionCandidates: candidates,
    turnKey: turnKey(input),
  };
  const context = resolveEngineWindow(windowContext)
    ? windowContext
    : input.side === "runner"
      ? runnerContext(input, candidates, dependencies, previous)
      : corpContext(input, candidates, previous);
  rememberCurrentStrategicIntent(input, options);
  const result = runPlanScheduler({
    context,
    registry,
    ...(previous ? { previousPortfolio: previous } : {}),
    resolveEngineWindow: resolveEngineWindow,
  });
  bindSelectedCoverageSearchAction(input, result);
  bindSelectedRunnerTargetedBypassChoiceContinuation(input, result, candidates);
  bindSelectedCorpScoreChoiceContinuation(input, result);
  bindSelectedCorpDefenseDrawAttempt(input, result);
  bindSelectedCorpHandDrawAttempt(input, result);
  bindSelectedCorpHqOverflowConversion(input, result);
  bindSelectedCorpDefenseHqHold(input, result);
  if (
    options.persistTacticalPlanMemory !== false &&
    result.portfolio &&
    result.portfolio.stateVersion === input.playerView.stateVersion
  ) {
    rememberResidentPlanPortfolio(input, result.portfolio);
  }
  return decisionFromScheduler(
    input,
    candidates,
    context,
    result,
    dependencies,
    options,
  );
}

function bindSelectedCorpDefenseDrawAttempt(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
): void {
  if (
    result.lane !== "plan" ||
    result.portfolio.executorInstanceId === undefined
  ) {
    return;
  }
  const executor = result.portfolio.instances.find(
    (instance) =>
      instance.instanceId === result.portfolio.executorInstanceId &&
      instance.moduleId === "corp.defend_servers",
  );
  const moduleState = executor?.moduleState as
    | { kind?: unknown; signals?: CorpDefenseSignal[] }
    | undefined;
  if (!executor || moduleState?.kind !== "defense" || !moduleState.signals) {
    return;
  }
  const selectedSignal = moduleState.signals.find(
    (signal) =>
      signal.phase === "draw_for_ice" &&
      corpDefenseSignalOwnsAction(signal, result.route.head.actionId),
  );
  if (
    !selectedSignal ||
    (selectedSignal.kind !== "generic" &&
      selectedSignal.kind !== "score_protection_draw")
  ) {
    return;
  }
  selectedSignal.drawAttemptState = {
    turnKey: turnKey(input),
    remainingAttempts: 0,
    selectedAtStateVersion: input.playerView.stateVersion,
  };
}

function bindSelectedCorpHandDrawAttempt(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
): void {
  if (
    result.lane !== "plan" ||
    result.portfolio.executorInstanceId === undefined
  ) {
    return;
  }
  const executor = result.portfolio.instances.find(
    (instance) =>
      instance.instanceId === result.portfolio.executorInstanceId &&
      instance.moduleId === "corp.hand_and_agenda_management",
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signal?: CorpPlanDomain["handManagement"][number];
      }
    | undefined;
  const signal = moduleState?.signal;
  if (
    !executor ||
    moduleState?.kind !== "hand" ||
    signal?.handPlanId !== "draw-for-score-material" ||
    signal.phase !== "draw_for_plan" ||
    signal.drawAttemptState?.remainingAttempts !== 1 ||
    signal.actionIds?.includes(result.route.head.actionId) !== true
  ) {
    return;
  }
  signal.drawAttemptState = {
    turnKey: turnKey(input),
    remainingAttempts: 0,
    selectedAtStateVersion: input.playerView.stateVersion,
  };
}

function bindSelectedCorpHqOverflowConversion(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
): void {
  if (
    result.lane !== "plan" ||
    result.portfolio.executorInstanceId === undefined
  ) {
    return;
  }
  const executor = result.portfolio.instances.find(
    (instance) =>
      instance.instanceId === result.portfolio.executorInstanceId &&
      instance.moduleId === "corp.hand_and_agenda_management",
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signal?: CorpPlanDomain["handManagement"][number];
      }
    | undefined;
  const signal = moduleState?.signal;
  const state = signal?.overflowResolutionState;
  if (
    !executor ||
    moduleState?.kind !== "hand" ||
    signal?.handPlanId !== `resolve-hq-overflow:${turnKey(input)}` ||
    signal.phase !== "resolve_hq_overflow" ||
    !state ||
    signal.actionIds?.includes(result.route.head.actionId) !== true
  ) {
    return;
  }
  const validState =
    state.turnKey === turnKey(input) &&
    Number.isSafeInteger(state.initialOverflowCount) &&
    state.initialOverflowCount > 0 &&
    Number.isSafeInteger(state.maximumConversions) &&
    state.maximumConversions > 0 &&
    state.maximumConversions <= state.initialOverflowCount &&
    Number.isSafeInteger(state.remainingConversions) &&
    state.remainingConversions > 0 &&
    state.remainingConversions <= state.maximumConversions &&
    state.selectedAtStateVersion === undefined;
  if (!validState) {
    throw new PlanResolutionFailure("invalid_plan_identity", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_registry",
      planInstanceId: executor.instanceId,
      stepId: result.route.head.stepId,
      removalCondition:
        "Bind HQ-overflow conversion only from a finite positive receipt whose remaining count does not exceed its admitted maximum.",
    });
  }
  signal.overflowResolutionState = {
    ...state,
    remainingConversions: state.remainingConversions - 1,
    selectedAtStateVersion: input.playerView.stateVersion,
    expectedOverflowAfterSelectedConversion: Math.max(
      0,
      signal.handSize - signal.maximumHandSize - 1,
    ),
  };
}

function bindSelectedCorpDefenseHqHold(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
): void {
  if (
    result.lane !== "plan" ||
    result.portfolio.executorInstanceId === undefined
  ) {
    return;
  }
  const executor = result.portfolio.instances.find(
    (instance) =>
      instance.instanceId === result.portfolio.executorInstanceId &&
      instance.moduleId === "corp.defend_servers",
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signals?: CorpDefenseSignal[];
        centralAllocation?: CorpCorePlanDomain["centralDefenseAllocation"];
        hqHoldCadence?: CorpCorePlanDomain["centralDefenseHqHoldCadence"];
        hqHoldSelection?: CorpCorePlanDomain["centralDefenseHqHoldSelection"];
      }
    | undefined;
  if (
    !executor ||
    moduleState?.kind !== "defense" ||
    !moduleState.signals ||
    moduleState.centralAllocation?.status !== "known" ||
    moduleState.centralAllocation.hqHold.status !== "eligible_once"
  ) {
    return;
  }
  if (result.engineRandomizedIceInstallNearTie !== undefined) {
    return;
  }
  const selectedSignal = moduleState.signals.find(
    (signal) =>
      signal.kind === "generic" &&
      signal.phase === "install_ice" &&
      signal.serverId === "rd" &&
      corpDefenseSignalOwnsAction(signal, result.route.head.actionId),
  );
  if (!selectedSignal) return;
  const cadence = moduleState.hqHoldCadence;
  const selectedAction = input.legalActions.find(
    (action) => action.actionId === result.route.head.actionId,
  );
  const exactBinding =
    cadence?.status === "available" &&
    cadence.receiptId === moduleState.centralAllocation.hqHold.receiptId &&
    cadence.turnKey === turnKey(input) &&
    cadence.factsStateVersion === input.playerView.stateVersion &&
    selectedAction?.type === "install_card" &&
    selectedAction.payload?.placement === "ice" &&
    selectedAction.payload.serverId === "rd" &&
    typeof selectedAction.payload.cardId === "string" &&
    selectedAction.payload.cardId.length > 0;
  if (!exactBinding) {
    throw new PlanResolutionFailure("invalid_plan_identity", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [result.route.head.actionId],
      owner: "plan_registry",
      planInstanceId: executor.instanceId,
      stepId: result.route.head.stepId,
      removalCondition:
        "A selected HQ-hold route must bind one available resident receipt and an exact current R&D ICE-install LegalAction before the receipt is consumed.",
    });
  }
  moduleState.hqHoldCadence = {
    status: "consumed",
    receiptId: cadence.receiptId,
    turnKey: cadence.turnKey,
    factsStateVersion: input.playerView.stateVersion,
  };
  moduleState.hqHoldSelection = {
    selectedActionId: result.route.head.actionId,
    sourceCardInstanceId: selectedAction.payload!.cardId as string,
    selectedAtStateVersion: input.playerView.stateVersion,
    targetServerId: "rd",
  };
}

function corpDefenseSignalOwnsAction(
  signal: CorpDefenseSignal,
  actionId: string,
): boolean {
  if (
    signal.kind === "score_protection_install" ||
    signal.kind === "score_protection_staging_install"
  ) {
    return signal.actionId === actionId;
  }
  if (signal.kind === "score_protection_draw") {
    return signal.actionId === actionId;
  }
  return signal.actionIds?.includes(actionId) === true;
}

function bindSelectedCorpScoreChoiceContinuation(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
): void {
  if (result.lane !== "plan") return;
  const continuationFamily =
    result.route.head.semanticActionType === "score.agenda"
      ? "corp_scored_agenda_on_score"
      : [
            "score_conversion.move_advancement",
            "score_conversion.place_advancement",
          ].includes(result.route.head.semanticActionType)
        ? "corp_advancement_counter"
        : undefined;
  if (continuationFamily === undefined) {
    return;
  }
  const executor = result.portfolio.instances.find(
    (instance) =>
      instance.instanceId === result.portfolio.executorInstanceId &&
      instance.moduleId === "corp.score_agenda",
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signal?: { agendaInstanceId?: unknown };
        choiceContinuation?: unknown;
      }
    | undefined;
  const targetCardId =
    typeof moduleState?.signal?.agendaInstanceId === "string"
      ? moduleState.signal.agendaInstanceId
      : undefined;
  const selectedAction = input.legalActions.find(
    (action) => action.actionId === result.route.head.actionId,
  );
  const exactScoreAction =
    continuationFamily !== "corp_scored_agenda_on_score" ||
    (selectedAction?.type === "score_agenda" &&
      selectedAction.source === targetCardId &&
      selectedAction.payload?.cardId === targetCardId);
  if (
    !executor ||
    moduleState?.kind !== "score" ||
    !targetCardId ||
    !exactScoreAction
  ) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "continuation",
      removalCondition:
        "A selected Corp score or advancement-conversion action must belong to the resident score executor and expose its exact agenda target.",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
    });
  }
  moduleState.choiceContinuation = {
    family: continuationFamily,
    selectedActionId: result.route.head.actionId,
    selectedAtStateVersion: input.playerView.stateVersion,
    targetCardId,
  };
}

export function bindSelectedRunnerTargetedBypassChoiceContinuation(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
  candidates: readonly ActionSemanticCandidate[],
): void {
  if (result.lane !== "plan") return;
  const selectedCandidate = candidates.find(
    (candidate) => candidate.actionId === result.route.head.actionId,
  );
  const requiresTargetedBypassBinding =
    selectedCandidate !== undefined &&
    runnerActionRequiresTargetedBypassPlan(selectedCandidate);
  if (result.route.head.semanticActionType !== "play.runner_event") {
    return;
  }
  const executor = result.portfolio.instances.find(
    (instance) =>
      instance.instanceId === result.portfolio.executorInstanceId &&
      (instance.moduleId === "runner.pressure_central" ||
        instance.moduleId === "runner.contest_remote"),
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signal?: {
          targetedBypassCommitment?: unknown;
        };
        choiceContinuation?: unknown;
      }
    | undefined;
  const commitment = moduleState?.signal?.targetedBypassCommitment as
    | RunnerTargetedBypassCommitment
    | undefined;
  if (!requiresTargetedBypassBinding && !commitment) return;
  const exactBinding =
    input.side === "runner" &&
    (moduleState?.kind === "central_pressure" ||
      moduleState?.kind === "remote_contest") &&
    commitment?.kind === "targeted_bypass_run" &&
    commitment.ownerModuleId === executor?.moduleId &&
    commitment.sourceActionId === result.route.head.actionId &&
    commitment.plannedAtStateVersion === input.playerView.stateVersion;
  if (!executor || !commitment || !exactBinding) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "continuation",
      removalCondition:
        "A targeted-bypass event must be selected by its exact preflighted central/remote plan and source action.",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
    });
  }
  moduleState.choiceContinuation = {
    ...commitment,
    family: "runner_targeted_bypass",
    selectedActionId: result.route.head.actionId,
    selectedAtStateVersion: input.playerView.stateVersion,
  } satisfies RunnerTargetedBypassChoiceContinuation;
}

function bindSelectedCoverageSearchAction(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
): void {
  if (result.lane !== "plan") return;
  const executor = result.portfolio.instances.find(
    (instance) =>
      instance.instanceId === result.portfolio.executorInstanceId &&
      instance.moduleId === "runner.rig_and_coverage",
  );
  if (!executor) return;
  const moduleState = executor.moduleState as
    | {
        kind?: unknown;
        phase?: unknown;
        gap?: {
          directSearchActionIds?: Array<unknown>;
          directSearchChoiceBindings?: Array<{
            actionId?: unknown;
          }>;
          rejectedSearchActionIds?: Array<unknown>;
        };
        selectedSearchActionId?: unknown;
        selectedSearchStateVersion?: unknown;
      }
    | undefined;
  if (moduleState?.kind !== "coverage") {
    return;
  }
  const selectedActionIsSearch =
    moduleState.gap?.directSearchActionIds?.includes(
      result.route.head.actionId,
    ) === true ||
    moduleState.gap?.rejectedSearchActionIds?.includes(
      result.route.head.actionId,
    ) === true ||
    moduleState.gap?.directSearchChoiceBindings?.some(
      (binding) => binding.actionId === result.route.head.actionId,
    ) === true;
  if (!selectedActionIsSearch && moduleState.phase !== "search_answer") return;
  const exactBindings =
    moduleState.gap?.directSearchChoiceBindings?.filter(
      (binding) => binding.actionId === result.route.head.actionId,
    ) ?? [];
  if (moduleState.phase !== "search_answer" || exactBindings.length !== 1) {
    throw new PlanResolutionFailure("invalid_support_graph", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [result.route.head.actionId],
      owner: "support_graph",
      planInstanceId: executor.instanceId,
      stepId: result.route.head.stepId,
      removalCondition:
        "Persist exactly one coverage-search choice binding for the selected LegalAction before its choice window can open.",
    });
  }
  executor.moduleState = {
    ...moduleState,
    selectedSearchActionId: result.route.head.actionId,
    selectedSearchStateVersion: result.route.head.stateVersion,
  };
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
  const handDevelopment = dependencies.evaluateRunnerHandDevelopment({
    input,
    strategicIntent,
    deckCapabilities,
    actionCandidates: candidates,
  });
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
  assertRunnerRestrictedProgramInstallCommitment(input, candidates, previous);
  const activeRunRoot = activeRunRootPlan(previous, input);
  const runWindowActionAssessments = runnerRunWindowActionAssessments(
    input,
    candidates,
    dependencies,
    activeRunRoot,
  );
  const domain = buildRunnerDomain(
    input,
    candidates,
    deckCapabilities,
    strategicIntent,
    economy,
    handDevelopment,
    runTargets,
    runWindowActionAssessments,
    activeRunRoot,
    previous,
  );
  const actionDispositions = runnerActionDispositions(
    input,
    candidates,
    domain,
    handDevelopment,
    runTargets,
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
        signal.reachable ||
        signal.supportNeedId !== undefined)
        ? [
            {
              ...current,
              signalId: `runner-remote:${signal.contestId}`,
              planModuleId: "runner.contest_remote",
              planDedupeKey: signal.contestId,
              kind: signal.knownAgendaThreat ? "threat" : "goal",
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
    defense.reactionReserveNeed !== undefined;
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

function runnerCandidateSourceSupportsProgramSearch(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  const effectTargets = new Set(candidate.effectTargets ?? []);
  const sourceDefinitionId = runnerCandidateSourceDefinitionId(
    input,
    candidate,
  );
  const hint = sourceDefinitionId
    ? AI_HINTS_BY_CARD.get(sourceDefinitionId)
    : undefined;
  return (
    effectTargets.has("setup.program_search") ||
    effectTargets.has("program_search") ||
    hint?.functionSignals?.includes("setup.program_search") === true ||
    hint?.roles?.includes("program_search") === true
  );
}

function runnerCandidateExecutesProgramSearch(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  return (
    (candidate.actionType === "play_event" ||
      candidate.actionType === "activated_card_ability" ||
      candidate.actionType === "trigger_ability") &&
    runnerCandidateSourceSupportsProgramSearch(input, candidate)
  );
}

function runnerCandidateSourceDefinitionId(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): string | undefined {
  const legalAction = input.legalActions.find(
    (action) => action.actionId === candidate.actionId,
  );
  const payloadDefinitionId = legalAction?.payload?.sourceDefinitionId;
  const sourceInstanceId =
    candidate.sourceCardInstanceId ?? legalAction?.source;
  return (
    candidate.sourceDefinitionId ??
    (typeof payloadDefinitionId === "string"
      ? payloadDefinitionId
      : undefined) ??
    (sourceInstanceId
      ? visibleOwnCardByInstanceId(input, sourceInstanceId)?.definitionId
      : undefined)
  );
}

function runnerProgramSearchRecentlyResolved(input: AiDecisionInput): boolean {
  return uniqueBy(
    [...input.playerView.publicEvents, ...input.eventTail],
    (event) => event.eventId,
  ).some(
    (event) =>
      event.publicPayload?.actor === "runner" &&
      event.publicPayload?.hiddenZoneAction === "p3_37_search_stack_to_grip",
  );
}

function runnerCandidateIsOneShotSearch(
  candidate: ActionSemanticCandidate,
): boolean {
  if (
    candidate.actionType !== "play_event" ||
    candidate.sourceKind !== "card"
  ) {
    return false;
  }
  const effectTargets = new Set(candidate.effectTargets ?? []);
  const hint = candidate.sourceDefinitionId
    ? AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId)
    : undefined;
  const structuredSearchEffect =
    hint?.effects?.some(
      (effect) =>
        effect.kind.includes("search") ||
        (typeof effect.target === "string" && effect.target.includes("search")),
    ) === true;
  return (
    effectTargets.has("card_search") ||
    effectTargets.has("setup.card_search") ||
    effectTargets.has("setup.program_search") ||
    effectTargets.has("program_search") ||
    structuredSearchEffect
  );
}

function runnerCandidateIsCardAbility(
  candidate: ActionSemanticCandidate,
): boolean {
  return (
    candidate.sourceKind === "card" &&
    (candidate.actionType === "activated_card_ability" ||
      candidate.actionType === "trigger_ability")
  );
}

function runnerCandidateIsExposeAbility(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  const sourceDefinitionId = runnerCandidateSourceDefinitionId(
    input,
    candidate,
  );
  return (
    runnerCandidateIsCardAbility(candidate) &&
    (candidate.actionTacticSignals.includes("effect:expose_info") ||
      sourceDefinitionId === "onr_v1_058_seeya" ||
      sourceDefinitionId === "onr_v1_151_seeya")
  );
}

function runnerCandidateIsCentralInformationAbility(
  candidate: ActionSemanticCandidate,
): "hq" | "rd" | undefined {
  if (!runnerCandidateIsCardAbility(candidate)) return undefined;
  if (candidate.actionTacticSignals.includes("effect:hq_info")) return "hq";
  if (candidate.actionTacticSignals.includes("effect:topdeck_info"))
    return "rd";
  return undefined;
}

function runnerSameTurnAccessPreparationDefinitionId(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): string | undefined {
  if (candidate.actionType !== "play_event") return undefined;
  const sourceDefinitionId = runnerCandidateSourceDefinitionId(
    input,
    candidate,
  );
  return sourceDefinitionId === "onr_proteus_118_prearranged-drop" ||
    sourceDefinitionId === "onr_proteus_119_promises-promises"
    ? sourceDefinitionId
    : undefined;
}

function runnerUnrepresentedProgramDevelopmentTargets(
  input: AiDecisionInput,
): string[] | undefined {
  const deckSnapshot = (input as AiDecisionInputWithDeckCapabilities)
    .ownDeckSnapshot;
  if (!deckSnapshot) return undefined;
  const representedDefinitions = new Set(
    [
      ...input.playerView.own.gripOrHq,
      ...(input.playerView.own.rig ?? []),
    ].flatMap((card) => (card.definitionId ? [card.definitionId] : [])),
  );
  const discardedByDefinition = new Map<string, number>();
  for (const card of input.playerView.own.heapOrArchives ?? []) {
    if (!card.definitionId) continue;
    discardedByDefinition.set(
      card.definitionId,
      (discardedByDefinition.get(card.definitionId) ?? 0) + 1,
    );
  }
  return deckSnapshot.cards.flatMap((entry) => {
    const definition = CARD_DEFINITIONS_BY_ID[entry.cardId];
    const plausibleStackCopies =
      entry.quantity - (discardedByDefinition.get(entry.cardId) ?? 0);
    return definition?.type === "program" &&
      plausibleStackCopies > 0 &&
      !representedDefinitions.has(entry.cardId)
      ? [entry.cardId]
      : [];
  });
}

function runnerHandDevelopmentExplicitlyRejected(
  evaluation: RunnerHandDevelopmentEvaluation,
): boolean {
  return (
    evaluation.deferReason === "duplicate" ||
    evaluation.deferReason === "no_current_need" ||
    evaluation.deferReason === "missing_mu" ||
    evaluation.deferReason === "timing" ||
    evaluation.deferReason === "preserve_credit_floor" ||
    evaluation.deferReason === "stronger_override" ||
    evaluation.availability === "not_relevant_now" ||
    evaluation.persistentInstallEvaluation?.duplicateRole ===
      "redundant_duplicate"
  );
}

function runnerHandDevelopmentRejectionForCandidate(
  candidate: ActionSemanticCandidate,
  evaluations: readonly RunnerHandDevelopmentEvaluation[],
): RunnerHandDevelopmentEvaluation | undefined {
  return evaluations.find(
    (evaluation) =>
      runnerHandDevelopmentExplicitlyRejected(evaluation) &&
      (evaluation.legalActionId === candidate.actionId ||
        (evaluation.cardInstanceId === candidate.sourceCardInstanceId &&
          evaluation.definitionId === candidate.sourceDefinitionId)),
  );
}

function runnerInstallSourceInstanceId(
  candidate: ActionSemanticCandidate,
  action: LegalAction | undefined,
): string | undefined {
  if (candidate.sourceCardInstanceId) return candidate.sourceCardInstanceId;
  const cardId = action?.payload?.cardId;
  if (typeof cardId === "string" && cardId.length > 0) return cardId;
  return typeof action?.source === "string" &&
    action.source.length > 0 &&
    action.source !== "basic_action"
    ? action.source
    : undefined;
}

export function runnerActionDispositions(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  domain: RunnerPlanDomain,
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[],
  runTargets: readonly RunnerRunTargetEvaluation[],
): PlanActionDisposition[] {
  const dispositions: PlanActionDisposition[] = [];
  const add = (
    actionId: string,
    ownerModuleId: PlanActionDisposition["ownerModuleId"],
    evidenceCode: string,
  ) => {
    dispositions.push({
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
    dispositions.push({
      actionId,
      disposition: "assessment_unknown",
      ownerModuleId,
      evidenceCode,
    });
  };
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
  const delegatedFundingActionIds = runnerDelegatedFundingActionIds(domain);
  for (const candidate of candidates) {
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
    const cardDevelopmentOwnsActionRoute = domain.developments.some(
      (development) =>
        development.actionIds.includes(candidate.actionId) &&
        runnerDevelopmentCardAdmission({
          definitionId: development.definitionId,
          assignedDomainPlanIds: development.assignedDomainPlanIds,
          ...(development.purposeCode
            ? { concretePurposeCode: development.purposeCode }
            : {}),
          duplicateAlreadyInstalled: development.duplicateAlreadyInstalled,
          affordableOrSupportable: development.affordableOrSupportable,
        }).admitted,
    );
    if (
      !delegatedFundingActionIds.has(candidate.actionId) &&
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
        candidate.sourceKind === "basic_action"
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
    if (
      candidate.semanticActionType === "tag.remove" &&
      domain.defense.activeTags <= 0
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
    if (specializedEconomyActionIds.has(candidate.actionId)) {
      continue;
    }
    const legalAction = input.legalActions.find(
      (action) => action.actionId === candidate.actionId,
    );
    const sourceCardInstanceId = runnerInstallSourceInstanceId(
      candidate,
      legalAction,
    );
    if (!sourceCardInstanceId) continue;
    const optionalProgramTrashInstall =
      legalAction?.payload?.runnerProgramTrashBeforeInstall === true ||
      candidate.actionId.endsWith(".runner_program_trash_before_install");
    if (!optionalProgramTrashInstall) continue;
    const duplicateDefinitionAlreadyInstalled =
      candidate.sourceDefinitionId !== undefined &&
      (input.playerView.own.rig ?? []).some(
        (installed) => installed.definitionId === candidate.sourceDefinitionId,
      );
    if (duplicateDefinitionAlreadyInstalled) {
      optionalProgramTrashInstallDispositionActionIds.add(candidate.actionId);
      add(
        candidate.actionId,
        "runner.develop_board_and_hand",
        `runner_program_trash_install_rejected_duplicate_definition:${candidate.sourceDefinitionId}`,
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
  for (const signal of domain.creditBanks) {
    if ((signal.rejectedActionIds?.length ?? 0) === 0) continue;
    for (const actionId of signal.rejectedActionIds ?? []) {
      add(
        actionId,
        "runner.credit_bank",
        signal.evidenceCodes[0] ??
          `runner_credit_bank_${signal.phase}_alternative_deferred`,
      );
    }
  }
  for (const signal of domain.resourceLifecycle ?? []) {
    if (signal.phase !== "retain") continue;
    for (const actionId of signal.rejectedActionIds ?? []) {
      add(
        actionId,
        "runner.resource_lifecycle",
        signal.evidenceCodes[0] ??
          "runner_resource_lifecycle_retain_current_source",
      );
    }
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
  if (
    domain.defense.activeTags > 0 &&
    candidates.some(
      (candidate) => candidate.semanticActionType === "tag.remove",
    )
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
  const coverageOwnedActionIds = new Set(
    domain.coverageGaps.flatMap((gap) =>
      gap.answerInHand
        ? []
        : [
            ...(gap.directSearchActionIds ?? []),
            ...(gap.searchEngineSetupActionIds ?? []),
            ...(gap.drawForAnswerActionIds ?? []),
          ],
    ),
  );
  const coverageRejectedActionIds = new Set(
    domain.coverageGaps.flatMap((gap) => gap.rejectedSearchActionIds ?? []),
  );
  const developmentOwnedActionIds = new Set(
    domain.developments.flatMap((signal) => signal.actionIds),
  );
  const rejectedCoverageGapsByActionId = new Map<
    string,
    RunnerPlanDomain["coverageGaps"]
  >();
  for (const gap of domain.coverageGaps) {
    for (const actionId of gap.rejectedSearchActionIds ?? []) {
      if (
        coverageOwnedActionIds.has(actionId) ||
        developmentOwnedActionIds.has(actionId)
      ) {
        continue;
      }
      const rejectedGaps = rejectedCoverageGapsByActionId.get(actionId) ?? [];
      rejectedGaps.push(gap);
      rejectedCoverageGapsByActionId.set(actionId, rejectedGaps);
    }
  }
  for (const [actionId, rejectedGaps] of rejectedCoverageGapsByActionId) {
    add(
      actionId,
      "runner.rig_and_coverage",
      `runner_coverage_search_rejected_without_deck_answer:${rejectedGaps
        .map(
          (gap) => `${gap.requiredRole}@${gap.targetServerId ?? "no_server"}`,
        )
        .sort()
        .join("+")}`,
    );
  }
  const centralPreparationActionIds = new Set(
    domain.centralPressure.flatMap(
      (signal) => signal.preparationActionIds ?? [],
    ),
  );
  const remotePreparationActionIds = new Set(
    domain.remoteContests.flatMap(
      (signal) => signal.preparationActionIds ?? [],
    ),
  );
  for (const candidate of candidates) {
    if (
      !runnerActionRequiresTargetedBypassPlan(candidate) ||
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
      "runner_no_bound_targeted_bypass_route",
    );
  }
  const activeCentralRunActionIds = new Set(
    domain.centralPressure
      .filter((signal) => signal.reachable && signal.marginalValue > 0)
      .flatMap((signal) => signal.runActionIds ?? []),
  );
  for (const signal of domain.recurringEconomy ?? []) {
    if (signal.phase !== "hold") continue;
    for (const candidate of candidates) {
      if (
        candidate.semanticActionType !== "install.card" ||
        candidate.sourceDefinitionId !== signal.definitionId
      ) {
        continue;
      }
      add(
        candidate.actionId,
        "runner.recurring_economy",
        signal.evidenceCodes[0] ??
          `runner_recurring_economy_install_deferred:${signal.definitionId}`,
      );
    }
  }
  for (const candidate of candidates) {
    const sourceDefinitionId = runnerCandidateSourceDefinitionId(
      input,
      candidate,
    );
    if (
      sourceDefinitionId === "onr_classic_039_library-search" &&
      candidate.actionType === "play_event"
    ) {
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
            ? `runner_library_search_not_active_pressure_route:${bestEvaluation.targetServerId}:${bestEvaluation.pathPassability}:${bestEvaluation.recommendation}`
            : "runner_library_search_missing_exact_run_target_projection",
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
      runnerSameTurnAccessPreparationDefinitionId(input, candidate);
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
    ...coverageOwnedActionIds,
    ...coverageRejectedActionIds,
    ...unboundOneShotSearchActionIds,
    ...optionalProgramTrashInstallDispositionActionIds,
  ]);
  for (const evaluation of handDevelopment) {
    if (!evaluation.legalActionId) continue;
    if (!runnerHandDevelopmentExplicitlyRejected(evaluation)) continue;
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
          candidate.sourceCardInstanceId === evaluation.cardInstanceId &&
          candidate.actionType === evaluatedCandidate.actionType &&
          candidate.semanticActionType ===
            evaluatedCandidate.semanticActionType,
      )
      .map((candidate) => candidate.actionId);
    if (!actionIds.includes(evaluation.legalActionId)) {
      actionIds.push(evaluation.legalActionId);
    }
    for (const actionId of actionIds) {
      if (specializedPlanOwnedActionIds.has(actionId)) continue;
      add(actionId, "runner.develop_board_and_hand", evidenceCode);
    }
  }
  for (const candidate of candidates) {
    const structuredTopHeapRecovery =
      (candidate.actionType === "activated_card_ability" ||
        candidate.actionType === "trigger_ability") &&
      candidate.actionTacticSignals.includes("setup.search") &&
      (candidate.effectTargets ?? []).includes("setup.top_trash_recovery");
    if (
      structuredTopHeapRecovery &&
      domain.defense.handSize >= domain.defense.minimumHandBuffer &&
      !coverageOwnedActionIds.has(candidate.actionId)
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
    if (runLockRelease && !runnerRunLockReleaseScoreComponent(input, action)) {
      add(
        action.actionId,
        "runner.pressure_central",
        "runner_run_lock_release_without_credible_followup",
      );
    }
  }
  for (const actionId of unboundOneShotSearchActionIds) {
    add(
      actionId,
      "runner.develop_board_and_hand",
      "runner_one_shot_search_has_no_bound_target_plan",
    );
  }
  const unrepresentedProgramTargets =
    runnerUnrepresentedProgramDevelopmentTargets(input);
  if (
    unrepresentedProgramTargets?.length === 0 &&
    input.playerView.own.gripOrHq.length < input.playerView.own.maxHandSize
  ) {
    for (const candidate of candidates) {
      const installedProgramSearch =
        (candidate.actionType === "activated_card_ability" ||
          candidate.actionType === "trigger_ability") &&
        runnerCandidateExecutesProgramSearch(input, candidate);
      if (
        !installedProgramSearch ||
        coverageOwnedActionIds.has(candidate.actionId) ||
        dispositions.some((entry) => entry.actionId === candidate.actionId)
      ) {
        continue;
      }
      add(
        candidate.actionId,
        "runner.develop_board_and_hand",
        "runner_program_search_has_no_unrepresented_program_target_in_known_deck",
      );
    }
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
        dispositions.some(
          (entry) =>
            entry.actionId === actionId &&
            entry.ownerModuleId === "runner.pressure_central",
        )
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
      admissibleRunWindowActionIds.has(evaluation.actionId)
    ) {
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
    const evidenceCode =
      evaluation.knownAccessState === "known_no_current_payoff"
        ? `runner_remote_run_known_no_current_payoff:${evaluation.targetServerId}:${evaluation.recommendation}`
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
      add(
        actionId,
        "runner.convert_run_window",
        assessment.evidenceCodes[0] ??
          "runner_run_window_action_explicitly_excluded",
      );
    }
  }
  return dispositions;
}

type RunnerFundingOwnershipDomain = Pick<
  RunnerPlanDomain,
  | "fundingNeeds"
  | "coverageGaps"
  | "defense"
  | "resourceLifecycle"
  | "centralPressure"
  | "remoteContests"
>;

function runnerDelegatedFundingActionIds(
  domain: RunnerFundingOwnershipDomain,
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
    for (const actionId of gap.fundingActionIds) actionIds.add(actionId);
  }
  for (const actionId of domain.defense.reactionReserveNeed?.actionIds ?? []) {
    actionIds.add(actionId);
  }
  return actionIds;
}

function runnerFundingNeedHasMaterialParent(
  domain: Pick<
    RunnerPlanDomain,
    "resourceLifecycle" | "centralPressure" | "remoteContests"
  >,
  need: Extract<RunnerFundingNeedSignal, { kind: "parent_plan_support" }>,
): boolean {
  if (need.driver.kind === "development") return false;
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
    (domain.defense.handSize < domain.defense.minimumHandBuffer &&
      domain.defense.handBufferActionIds?.includes(candidate.actionId) ===
        true) ||
    domain.coverageGaps.some((gap) =>
      gap.drawForAnswerActionIds.includes(candidate.actionId),
    ) ||
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
  activeRunRoot:
    | {
        instanceId: string;
        purpose?: "access" | "multiaccess" | "information" | "contest";
        encounterCreditSpendLimit?: number;
        accessCommitment?: RunnerRunAccessCommitmentSignal;
      }
    | undefined,
  previous: ResidentPlanPortfolio | undefined,
): RunnerPlanDomain {
  const currentCredits = input.playerView.own.credits;
  const remainingClicks = input.playerView.own.clicks;
  const exactBasicCreditActionIds = uniqueBy(
    candidates
      .filter(runnerExactBasicLiquidCreditCandidate)
      .map((candidate) => candidate.actionId),
    (actionId) => actionId,
  );
  const turnLiquidityFundingNeeds: RunnerCorePlanDomain["fundingNeeds"] =
    remainingClicks > 0 && exactBasicCreditActionIds.length === 1
      ? [
          {
            kind: "develop_liquidity",
            needId: `economy-liquidity-development:${turnKey(input)}`,
            actionIds: exactBasicCreditActionIds,
            currentCreditsAtRevalidation: currentCredits,
            targetCredits: currentCredits + remainingClicks,
            gap: remainingClicks,
            projectedCreditGain: 1,
            priorityClass: "P6",
            cadence: {
              kind: "remaining_turn_capacity",
              maximumConversions: remainingClicks,
            },
            completion: {
              kind: "target_credits_or_no_clicks",
            },
            revalidation: {
              stateVersion: input.playerView.stateVersion,
              status: "turn_liquidity_open",
            },
            evidenceCode: "runner_engine_certified_basic_liquidity_development",
          },
        ]
      : [];
  const portfolioReserveRoute = runnerExactFundingRouteContract(
    input,
    candidates,
    {
      demandId: "runner-portfolio-credit-reserve",
      sourcePlanId: "runner.economy:runner-portfolio-credit-reserve",
      purpose: "phase_reserve",
      priority: "phase_reserve",
      hardness: "soft",
      deadline: "end_of_current_turn",
      targetCredits: economy.desiredCreditReserve,
      remainingClicks: input.playerView.own.clicks,
      allowIncrementalProgress: true,
      evidence: ["runner_finite_portfolio_credit_reserve"],
    },
  );
  const portfolioReserveFundingNeeds: RunnerCorePlanDomain["fundingNeeds"] =
    input.playerView.own.clicks > 0 &&
    currentCredits < economy.desiredCreditReserve
      ? [
          {
            kind: "portfolio_reserve",
            needId: "runner-portfolio-credit-reserve",
            targetCredits: economy.desiredCreditReserve,
            currentCreditsAtRevalidation: currentCredits,
            gap: economy.desiredCreditReserve - currentCredits,
            priorityClass: "P6",
            revalidation: {
              stateVersion: input.playerView.stateVersion,
              status: "portfolio_reserve_open",
            },
            ...portfolioReserveRoute,
            evidenceCode: "runner_finite_portfolio_credit_reserve",
          },
        ]
      : [];
  const installedRoles = new Set(
    (input.playerView.own.rig ?? []).flatMap((card) =>
      rolesForDeckDoctrineCard(card.definitionId ?? ""),
    ),
  );
  const coverageGaps = uniqueCoverageGaps(
    input,
    candidates,
    runTargets,
    installedRoles,
    _deckCapabilities,
    strategicIntent,
  );
  const recurringEconomy = runnerRecurringEconomySignals(input, candidates);
  const resourceLifecycle = runnerResourceLifecycleSignals(input, candidates);
  const installedAgendaScores = runnerInstalledAgendaScoreSignals(
    input,
    candidates,
  );
  const handSize = input.playerView.own.gripOrHq.length;
  const maxHandSize = Math.max(0, input.playerView.own.maxHandSize ?? 5);
  const damageThreat = runnerDamageThreatAssessment(input);
  const riskAdjustedHandBuffer =
    runnerRiskAdjustedHandBufferForAttractiveRuns(runTargets);
  const volatileBreakerFailureDamage = Math.max(
    0,
    ...(input.playerView.own.rig ?? []).map(
      (card) =>
        randomBreakOrDamageRiskProfileForDefinitionId(card.definitionId)
          ?.maxSingleFailureDamage ?? 0,
    ),
  );
  const volatileBreakerHandFloor =
    volatileBreakerFailureDamage > 0 ? volatileBreakerFailureDamage + 1 : 0;
  const minimumHandBuffer = Math.max(
    riskAdjustedHandBuffer.minimumHandBuffer,
    damageThreat.flatlineRisk.recommendedHandFloor,
    volatileBreakerHandFloor,
  );
  const creditBanks = runnerCreditBankSignals(
    input,
    candidates,
    _deckCapabilities,
    economy,
    runTargets,
    handDevelopment,
    minimumHandBuffer,
  );
  const riskAdjustedHandBufferOpen = handSize < minimumHandBuffer;
  const damageBufferForecast =
    damageThreat.flatlineRisk.level === "critical" ||
    damageThreat.flatlineRisk.level === "confirmed" ||
    runTargets.some(
      (evaluation) =>
        evaluation.recommendation === "draw_for_damage_buffer" ||
        evaluation.pathPassability === "blocked_by_blink_hand_buffer" ||
        (evaluation.riskyUniversalCoverage && handSize < 3) ||
        evaluation.blinkRiskAssessment?.blockedByHandBuffer === true ||
        evaluation.blinkRiskAssessment?.riskSeverity === "high" ||
        evaluation.blinkRiskAssessment?.riskSeverity === "lethal",
    ) ||
    (handSize < 3 &&
      input.playerView.servers.some((server) =>
        server.ice.some(
          (ice) =>
            ice.rezzed === true &&
            ((strategicIntent.riskProfile ?? []).includes(
              "runner.risky_universal_breaker_pressure",
            ) ||
              rolesForDeckDoctrineCard(ice.definitionId ?? "").includes(
                "sentry_ice",
              )),
        ),
      ));
  const productiveLegalActions = input.legalActions.filter(
    (action) => action.type !== "end_turn",
  );
  const runOnlyActionCapacity =
    productiveLegalActions.length > 0 &&
    productiveLegalActions.every((action) => action.type === "start_run") &&
    (input.playerView.own.clicks === 0 ||
      productiveLegalActions.every(
        (action) =>
          action.source !== "basic_action" &&
          action.costs.reduce(
            (total, cost) => total + Math.max(0, cost.clicks ?? 0),
            0,
          ) === 0,
      ));
  const visibleImmediatePayoffRunAvailable = runTargets.some(
    (evaluation) =>
      evaluation.pathPassability === "reachable" &&
      evaluation.recommendation === "run_now" &&
      ["agenda", "score_threat", "trash_affordable", "fresh"].includes(
        evaluation.accessPayoff,
      ),
  );
  const visiblySafePositiveRunAvailable = runTargets.some((evaluation) => {
    const visibleServer = input.playerView.servers.find(
      (server) => server.id === evaluation.targetServerId,
    );
    const noUnrezzedIceVisible =
      visibleServer !== undefined &&
      visibleServer.ice.every((ice) => ice.rezzed === true);
    return (
      evaluation.pathPassability === "reachable" &&
      evaluation.score > 0 &&
      (evaluation.recommendation === "run_now" ||
        evaluation.recommendation === "run_if_free") &&
      noUnrezzedIceVisible &&
      (evaluation.unavoidableVisibleIceHazardCount ?? 0) === 0 &&
      evaluation.visibleTraceTagHazardUnavoidable !== true &&
      evaluation.blinkRiskAssessment?.blockedByHandBuffer !== true &&
      evaluation.blinkRiskAssessment?.riskSeverity !== "high" &&
      evaluation.blinkRiskAssessment?.riskSeverity !== "lethal"
    );
  });
  const forgoUnsafeRunCapacity =
    runOnlyActionCapacity &&
    riskAdjustedHandBufferOpen &&
    !visiblySafePositiveRunAvailable &&
    !visibleImmediatePayoffRunAvailable;
  const reactionReserveTargetCredits = 10;
  const reactionReserveActionIds = runnerExactFundingRouteContract(
    input,
    candidates,
    {
      demandId: "runner-defense-reaction-reserve",
      sourcePlanId: "runner.defense_and_recovery:runner",
      purpose: "tactical_reserve",
      priority: "tactical_reserve",
      hardness: "soft",
      deadline: "end_of_current_turn",
      targetCredits: reactionReserveTargetCredits,
      remainingClicks: input.playerView.own.clicks,
      allowIncrementalProgress: true,
      evidence: ["runner_damage_locked_hand_reaction_reserve"],
    },
  ).routeActionIds;
  const reactionReserveOpen =
    damageThreat.deckBelief.level === "confirmed" &&
    (damageThreat.flatlineRisk.level === "confirmed" ||
      damageThreat.flatlineRisk.level === "critical") &&
    damageThreat.flatlineRisk.effectiveMaxHandSize <=
      damageThreat.flatlineRisk.recommendedHandFloor &&
    damageThreat.flatlineRisk.handCount >=
      damageThreat.flatlineRisk.effectiveMaxHandSize &&
    damageThreat.flatlineRisk.handBufferHeadroom === 0 &&
    input.playerView.own.clicks <= 1 &&
    input.playerView.own.credits < 10 &&
    !visibleImmediatePayoffRunAvailable &&
    reactionReserveActionIds.length > 0;
  const reactionReserveNeed: RunnerCorePlanDomain["defense"]["reactionReserveNeed"] =
    reactionReserveOpen
      ? {
          needId: "runner-defense-reaction-reserve",
          parentPlanInstanceId: "plan:runner.defense_and_recovery:runner",
          targetCredits: reactionReserveTargetCredits,
          currentCreditsAtRevalidation: currentCredits,
          gap: Math.max(0, reactionReserveTargetCredits - currentCredits),
          actionIds: reactionReserveActionIds,
          revalidation: {
            stateVersion: input.playerView.stateVersion,
            status: "defense_parent_open",
          },
          evidenceCode: "runner_damage_locked_hand_reaction_reserve",
        }
      : undefined;
  const defense: RunnerCorePlanDomain["defense"] = {
    activeTags: input.playerView.own.tags,
    visibleTagPunish: input.playerView.own.tags > 0,
    persistentHazardCounterRemovalAvailable: candidates.some(
      (candidate) =>
        candidate.semanticActionType === "counter.remove_trace_tag" ||
        candidate.semanticActionType === "counter.remove_runner_hazard",
    ),
    pendingDamage: visiblePendingDamage(candidates),
    damagePreventionNeeded: candidates.some(
      (candidate) =>
        candidate.semanticActionType.startsWith("damage.prevent") ||
        candidate.actionTacticSignals.includes("damage_prevention"),
    ),
    handSize,
    minimumHandBuffer,
    drawAllowed: candidates.some(
      (candidate) =>
        candidate.semanticActionType === "draw.card" && handSize < maxHandSize,
    ),
    handBufferActionIds: candidates
      .filter(
        (candidate) =>
          handSize < maxHandSize &&
          (candidate.semanticActionType === "draw.card" ||
            ((candidate.economyProjection?.netHandDelta ?? 0) > 0 &&
              candidate.economyProjection?.timing === "immediate" &&
              candidate.semanticActionType !== "install.card") ||
            ((candidate.actionType === "activated_card_ability" ||
              candidate.actionType === "trigger_ability") &&
              candidate.actionTacticSignals.includes("setup.search") &&
              (candidate.effectTargets ?? []).includes(
                "setup.top_trash_recovery",
              ))),
      )
      .map((candidate) => candidate.actionId),
    forgoUnsafeRunCapacity,
    ...(reactionReserveNeed ? { reactionReserveNeed } : {}),
    handBufferPriorityClass:
      riskAdjustedHandBufferOpen && riskAdjustedHandBuffer.minimumHandBuffer > 3
        ? "P3"
        : (damageThreat.flatlineRisk.level === "critical" ||
              damageThreat.flatlineRisk.criticalRunSuppression) &&
            handSize < damageThreat.flatlineRisk.recommendedHandFloor
          ? "P3"
          : volatileBreakerHandFloor > 0 && handSize < volatileBreakerHandFloor
            ? "P4"
            : "P5",
    evidenceCodes: [
      ...(candidates.some(
        (candidate) =>
          candidate.semanticActionType === "counter.remove_trace_tag" ||
          candidate.semanticActionType === "counter.remove_runner_hazard",
      )
        ? ["runner_persistent_trace_counter_removal_available"]
        : []),
      ...(forgoUnsafeRunCapacity
        ? ["runner_restricted_run_capacity_below_hand_buffer"]
        : []),
      ...(reactionReserveNeed
        ? ["runner_damage_locked_hand_reaction_reserve"]
        : []),
      ...(riskAdjustedHandBufferOpen
        ? [
            volatileBreakerHandFloor === minimumHandBuffer
              ? `runner_volatile_breaker_hand_buffer:${minimumHandBuffer}`
              : minimumHandBuffer > riskAdjustedHandBuffer.minimumHandBuffer
                ? `runner_damage_threat_hand_buffer:${minimumHandBuffer}`
                : riskAdjustedHandBuffer.evidenceCode,
          ]
        : []),
      ...(damageBufferForecast
        ? [
            damageThreat.flatlineRisk.level === "critical" ||
            damageThreat.flatlineRisk.level === "confirmed"
              ? `runner_flatline_risk:${damageThreat.flatlineRisk.level}`
              : "runner_run_target_requires_damage_buffer",
          ]
        : ["runner_visible_defense_state"]),
    ],
  };
  const recentSafetyAbort = runnerRecentFutureEncounterDamageSafetyAbort(input);
  const runFundingNeeds = bestRunTargetsByServer(
    input,
    economy,
    runTargets,
    candidates,
  ).flatMap((evaluation) => {
    const safetyBlocked =
      recentSafetyAbort?.serverId === evaluation.targetServerId ||
      forgoUnsafeRunCapacity;
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
  const resourceLifecycleFundingNeeds: RunnerCorePlanDomain["fundingNeeds"] =
    resourceLifecycle.flatMap((signal) => {
      if (
        !signal.supportNeedId ||
        (signal.marginalValue ?? 0) <= 0 ||
        signal.leavePlayPaymentAmount === undefined ||
        signal.fundingGap === undefined ||
        signal.fundingGap <= 0 ||
        !signal.fundingRouteAssessment ||
        !signal.fundingRouteActionIds ||
        signal.fundingRouteActionIds.length === 0
      ) {
        return [];
      }
      return [
        {
          kind: "parent_plan_support" as const,
          needId: signal.supportNeedId,
          parentPlanInstanceId: planInstanceIdForProposal({
            moduleId: "runner.resource_lifecycle",
            dedupeKey: signal.lifecycleId,
          }),
          driver: {
            kind: "resource_lifecycle" as const,
            targetId: signal.sourceCardInstanceId,
            reasonCode: "fund_exact_lifecycle_leave_play_payment",
          },
          targetCredits: signal.leavePlayPaymentAmount,
          currentCreditsAtRevalidation: currentCredits,
          gap: signal.fundingGap,
          priorityClass: "P5" as const,
          revalidation: {
            stateVersion: input.playerView.stateVersion,
            status: "material_parent_open" as const,
          },
          routeActionIds: signal.fundingRouteActionIds,
          routeAssessment: signal.fundingRouteAssessment,
          evidenceCode:
            signal.evidenceCodes[0] ??
            "runner_resource_lifecycle_exact_funding_support",
        },
      ];
    });
  const fundingNeeds = uniqueBy(
    [
      ...runFundingNeeds,
      ...runLockFundingNeeds,
      ...resourceLifecycleFundingNeeds,
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
  const baseCentralPressure = uniqueBy(
    [
      ...runLockReleaseRoutes.flatMap((route) => {
        if (
          route.serverId !== "hq" &&
          route.serverId !== "rd" &&
          route.serverId !== "archives"
        )
          return [];
        const centralServerId = route.serverId;
        return [
          {
            pressureId: `central:${centralServerId}`,
            serverId: centralServerId as "hq" | "rd" | "archives",
            purpose: "access" as const,
            strategyLineIds: [strategicIntent.primaryWinIntent],
            priorityClass: route.terminal ? ("P2" as const) : ("P4" as const),
            reachable: route.ready,
            marginalValue: route.value,
            evidenceCode: route.evidenceCode,
            ...(route.actionId
              ? {
                  runActionIds: [route.actionId],
                  runActionValues: { [route.actionId]: route.value },
                  runActionEvidence: {
                    [route.actionId]: [
                      "plan_route_stage:release_run_lock",
                      `plan_route_follow_up_server:${centralServerId}`,
                    ],
                  },
                }
              : {
                  runActionIds: [],
                  runActionValues: {},
                  runActionEvidence: {},
                }),
            runActionExclusions: {},
            ...(route.supportNeedId
              ? { supportNeedId: route.supportNeedId }
              : {}),
            routePreparation: "release_run_lock" as const,
          },
        ];
      }),
      ...runnerCentralPressureDevelopmentSignals(
        candidates,
        handDevelopment,
        runTargets,
        strategicIntent,
      ),
      ...bestRunTargetsByServer(input, economy, runTargets, candidates)
        .filter(
          (evaluation) =>
            evaluation.targetServerId === "hq" ||
            evaluation.targetServerId === "rd" ||
            evaluation.targetServerId === "archives",
        )
        .map((evaluation) => {
          const knownAgendaInArchives =
            evaluation.targetServerId === "archives" &&
            archivesHasVisibleKnownAgenda(input);
          const terminalCentralAccess =
            (evaluation.targetServerId === "hq" ||
              evaluation.targetServerId === "rd") &&
            evaluation.knownAccessState !== "known_no_current_payoff" &&
            input.playerView.own.agendaPoints >=
              input.playerView.agendaPointsToWin - 1;
          const pressureCadence = runnerCentralPressureCadence(
            input,
            evaluation.targetServerId as "hq" | "rd" | "archives",
          );
          const sameServerEvaluations = runTargets.filter(
            (candidate) =>
              candidate.targetServerId === evaluation.targetServerId,
          );
          const hqSuccessWindowRoute = sameServerEvaluations.flatMap(
            (candidateEvaluation) => {
              const action = input.legalActions.find(
                (candidateAction) =>
                  candidateAction.actionId === candidateEvaluation.actionId,
              );
              if (!action) return [];
              const setup = runnerHqSuccessWindowSetupAssessment(
                input,
                action,
                candidateEvaluation.targetServerId,
              );
              return setup
                ? [
                    {
                      actionId: candidateEvaluation.actionId,
                      setup,
                    },
                  ]
                : [];
            },
          )[0];
          const safetyBlocked =
            recentSafetyAbort?.serverId === evaluation.targetServerId;
          const knownNoPayoff =
            evaluation.knownAccessState === "known_no_current_payoff" ||
            (evaluation.targetServerId === "archives" &&
              archivesIsKnownWithoutAgenda(input));
          const materialMarginalValue =
            runnerCentralPressureHasMaterialMarginalValue(input, evaluation);
          const costlyInformationRunBelowHandBuffer =
            handSize < minimumHandBuffer &&
            evaluation.pathCost > 0 &&
            evaluation.accessPayoff !== "agenda" &&
            evaluation.accessPayoff !== "score_threat";
          const fundingSupport =
            safetyBlocked || !pressureCadence.routeAvailable
              ? undefined
              : runnerRunFundingSupport(
                  input,
                  economy,
                  evaluation,
                  runTargets,
                  candidates,
                );
          const directRunCanConvertNow = runnerRunTargetCanConvertNow(
            input,
            economy,
            evaluation,
            candidates,
          );
          const currentPressureRoute =
            !knownNoPayoff &&
            pressureCadence.routeAvailable &&
            materialMarginalValue &&
            !costlyInformationRunBelowHandBuffer &&
            fundingSupport === undefined &&
            evaluation.pathPassability === "reachable" &&
            (evaluation.recommendation === "run_now" ||
              evaluation.recommendation === "run_if_free" ||
              directRunCanConvertNow) &&
            (evaluation.score > 0 ||
              terminalCentralAccess ||
              hqSuccessWindowRoute !== undefined);
          const executionMode = runPurposeForEvaluation(evaluation);
          const purpose = evaluation.multiaccessAvailable
            ? ("multiaccess" as const)
            : evaluation.knownAccessState === "unknown" ||
                evaluation.knownAccessState === "fresh"
              ? ("information" as const)
              : ("access" as const);
          return {
            pressureId: `central:${evaluation.targetServerId}`,
            serverId: evaluation.targetServerId as "hq" | "rd" | "archives",
            purpose,
            strategyLineIds: [strategicIntent.primaryWinIntent],
            priorityClass: knownAgendaInArchives
              ? ("P2" as const)
              : evaluation.targetServerId === "archives" &&
                  ["unknown", "fresh"].includes(evaluation.accessPayoff)
                ? ("P6" as const)
                : ("P4" as const),
            reachable:
              currentPressureRoute && !safetyBlocked && !forgoUnsafeRunCapacity,
            marginalValue: knownAgendaInArchives
              ? 1_000
              : terminalCentralAccess
                ? Math.max(1, 1_000 + evaluation.score)
                : hqSuccessWindowRoute
                  ? Math.max(320, evaluation.score)
                  : evaluation.recommendation === "run_now"
                    ? evaluation.score
                    : Math.min(evaluation.score, 60),
            evidenceCode: forgoUnsafeRunCapacity
              ? "runner_restricted_run_capacity_below_required_hand_buffer"
              : knownAgendaInArchives
                ? "visible_known_agenda_in_archives"
                : safetyBlocked
                  ? recentSafetyAbort.evidenceCode
                  : knownNoPayoff
                    ? `runner_central_pressure_known_no_current_payoff:${evaluation.targetServerId}`
                    : !pressureCadence.routeAvailable
                      ? pressureCadence.evidenceCode
                      : hqSuccessWindowRoute
                        ? `runner_hq_success_window_setup:${hqSuccessWindowRoute.setup.sourceDefinitionId}`
                        : fundingSupport
                          ? fundingSupport.evidenceCode
                          : costlyInformationRunBelowHandBuffer
                            ? `runner_central_pressure_requires_hand_buffer:${evaluation.targetServerId}`
                            : !materialMarginalValue
                              ? `runner_central_pressure_below_material_value:${evaluation.targetServerId}`
                              : !currentPressureRoute
                                ? `runner_central_pressure_no_admissible_route:${evaluation.targetServerId}`
                                : (evaluation.evidence[0] ??
                                  "runner_run_target"),
            ...(fundingSupport ? { supportNeedId: fundingSupport.needId } : {}),
            runActionIds: pressureCadence.routeAvailable
              ? witnessedRunActionIds(
                  candidates,
                  runTargets,
                  evaluation.targetServerId,
                  terminalCentralAccess,
                )
              : [],
            runActionValues: Object.fromEntries(
              sameServerEvaluations
                .filter(
                  (candidate) => candidate.pathPassability === "reachable",
                )
                .map((candidate) => [
                  candidate.actionId,
                  candidate.actionId === hqSuccessWindowRoute?.actionId
                    ? 100
                    : candidate.runActionProjection?.spendLimit !== undefined
                      ? 10
                      : 0,
                ]),
            ),
            runActionEvidence: Object.fromEntries(
              sameServerEvaluations.flatMap((candidate) => {
                const spendLimit = candidate.runActionProjection?.spendLimit;
                if (
                  candidate.pathPassability !== "reachable" ||
                  spendLimit === undefined
                ) {
                  return [];
                }
                return [
                  [
                    candidate.actionId,
                    [
                      ...(candidate.actionId === hqSuccessWindowRoute?.actionId
                        ? [
                            "plan_route_preference:hq_success_window_setup",
                            ...hqSuccessWindowRoute.setup.evidence,
                          ]
                        : []),
                      "plan_route_preference:bounded_card_run",
                      `run_action_spending_cap_target_server:${evaluation.targetServerId}`,
                      `run_action_spending_cap_limit:${spendLimit}`,
                    ],
                  ],
                ];
              }),
            ),
            runActionExclusions: Object.fromEntries(
              sameServerEvaluations.flatMap((candidate) => {
                const candidateRouteAdmissible =
                  !forgoUnsafeRunCapacity &&
                  !knownNoPayoff &&
                  pressureCadence.routeAvailable &&
                  materialMarginalValue &&
                  !costlyInformationRunBelowHandBuffer &&
                  !safetyBlocked &&
                  candidate.pathPassability === "reachable" &&
                  (candidate.recommendation === "run_now" ||
                    candidate.recommendation === "run_if_free") &&
                  (candidate.score > 0 || terminalCentralAccess);
                if (candidateRouteAdmissible) return [];
                const spendLimitBlocked =
                  candidate.runActionProjection?.spendLimit !== undefined &&
                  candidate.pathPassability === "blocked_unpayable";
                return [
                  [
                    candidate.actionId,
                    [
                      `run_route_excluded:path:${candidate.pathPassability}`,
                      `run_route_excluded:recommendation:${candidate.recommendation}`,
                      `run_route_excluded:score:${candidate.score}`,
                      ...(!pressureCadence.routeAvailable
                        ? [pressureCadence.evidenceCode]
                        : []),
                      ...planSafeRunExclusionEvidence(candidate.evidence),
                      ...(spendLimitBlocked
                        ? [
                            "run_action_spending_cap_risk_skip:visible_break_cost_gt_cap",
                            ...candidate.evidence.flatMap((entry) =>
                              entry.startsWith("visible_break_cost:")
                                ? [
                                    `run_action_spending_cap_visible_break_cost:${entry.slice("visible_break_cost:".length)}`,
                                  ]
                                : entry.startsWith(
                                      "run_action_projection_spend_limit:",
                                    )
                                  ? [
                                      `run_action_spending_cap_limit:${entry.slice("run_action_projection_spend_limit:".length)}`,
                                    ]
                                  : [],
                            ),
                          ]
                        : []),
                    ],
                  ],
                ];
              }),
            ),
            ...(executionMode === "information"
              ? { encounterCreditSpendLimit: 1 }
              : {}),
            accessCommitment: accessCommitmentForEvaluation(evaluation),
            ...(sourceDefinitionForEvaluation(evaluation, candidates)
              ? {
                  sourceDefinitionIds: [
                    sourceDefinitionForEvaluation(evaluation, candidates)!,
                  ],
                }
              : {}),
          };
        }),
      ...input.playerView.servers.flatMap((server) => {
        if (
          server.id !== "archives" ||
          !archivesHasVisibleKnownAgenda(input) ||
          !witnessedRunRouteExists(candidates, runTargets, "archives")
        ) {
          return [];
        }
        return [
          {
            pressureId: "central:archives",
            serverId: "archives" as const,
            purpose: "access" as const,
            strategyLineIds: [strategicIntent.primaryWinIntent],
            priorityClass: "P2" as const,
            reachable: !forgoUnsafeRunCapacity,
            marginalValue: 1_000,
            evidenceCode: forgoUnsafeRunCapacity
              ? "runner_restricted_run_capacity_below_required_hand_buffer"
              : "visible_known_agenda_in_archives",
            runActionIds: witnessedRunActionIds(
              candidates,
              runTargets,
              "archives",
            ),
            runActionValues: {},
            runActionEvidence: {},
            runActionExclusions: {},
          },
        ];
      }),
      ...constrainedRunCandidates.flatMap(
        ({ candidate, serverId, marginalValue, evidenceCode }) => {
          if (serverId !== "hq" && serverId !== "rd" && serverId !== "archives")
            return [];
          return [
            {
              pressureId: `central:${serverId}`,
              serverId: serverId as "hq" | "rd" | "archives",
              purpose: "information" as const,
              strategyLineIds: [strategicIntent.primaryWinIntent],
              priorityClass: "P6" as const,
              reachable: true,
              marginalValue,
              evidenceCode,
              runActionIds: [candidate.actionId],
              ...(candidate.sourceDefinitionId
                ? { sourceDefinitionIds: [candidate.sourceDefinitionId] }
                : {}),
            },
          ];
        },
      ),
      // A legal same-turn payoff changes the current phase of the already
      // discovered server-pressure plan. Keep it after the direct route
      // signals because uniqueBy intentionally retains the last phase for a
      // shared pressureId.
      ...runnerSameTurnAccessCentralPreparationSignals(
        input,
        candidates,
        handDevelopment,
        runTargets,
        strategicIntent,
      ),
    ],
    (signal) => signal.pressureId,
  );
  const centralPressure = uniqueBy(
    [
      ...baseCentralPressure,
      ...runnerTargetedBypassCentralPreparationSignals(
        input,
        candidates,
        baseCentralPressure,
        runTargets,
      ),
    ],
    (signal) => signal.pressureId,
  );
  const baseRemoteContestDrafts: RunnerRemoteContestSignalDraft[] = [
    ...runnerRemoteInformationPreparationSignals(input, candidates, runTargets),
    ...runLockReleaseRoutes.flatMap((route) => {
      if (!route.serverId.startsWith("remote_")) return [];
      return [
        {
          contestId: `remote:${route.serverId}`,
          serverId: route.serverId,
          purpose: "contest" as const,
          knownAgendaThreat: route.terminal,
          reachable: route.ready,
          marginalValue: route.value,
          evidenceCode: route.evidenceCode,
          ...(route.actionId
            ? { preferredRunActionIds: [route.actionId] }
            : {}),
          ...(route.supportNeedId
            ? { supportNeedId: route.supportNeedId }
            : {}),
          routePreparation: "release_run_lock" as const,
        },
      ];
    }),
    ...bestRunTargetsByServer(input, economy, runTargets, candidates)
      .filter((evaluation) => {
        const visibleKnownAgendaRoute = visibleKnownAgendaOnServer(
          input,
          evaluation.targetServerId,
        );
        if (
          visibleKnownAgendaRoute &&
          !runnerKnownAgendaRunEvaluationIsCertified(
            input,
            candidates,
            evaluation,
            evaluation.targetServerId,
          )
        ) {
          return false;
        }
        const productiveProbeCanConvertNow = runnerRemoteProbeCanConvertNow(
          input,
          economy,
          evaluation,
        );
        const irrecoverableScoreThreatContest =
          runnerIrrecoverableBlinkScoreThreatContest(
            input,
            candidates,
            evaluation,
          );
        return (
          evaluation.targetKind === "remote" &&
          ((evaluation.pathPassability === "reachable" &&
            (evaluation.recommendation === "run_now" ||
              evaluation.recommendation === "run_if_free" ||
              evaluation.recommendation === "gain_credits_first" ||
              productiveProbeCanConvertNow) &&
            evaluation.score > 0) ||
            irrecoverableScoreThreatContest ||
            runnerRunFundingSupport(
              input,
              economy,
              evaluation,
              runTargets,
              candidates,
            ) !== undefined)
        );
      })
      .map((evaluation) => {
        const safetyBlocked =
          recentSafetyAbort?.serverId === evaluation.targetServerId;
        const fundingSupport = safetyBlocked
          ? undefined
          : runnerRunFundingSupport(
              input,
              economy,
              evaluation,
              runTargets,
              candidates,
            );
        const purpose = runPurposeForEvaluation(evaluation);
        const directRunCanConvertNow = runnerRunTargetCanConvertNow(
          input,
          economy,
          evaluation,
          candidates,
        );
        const productiveProbeCanConvertNow = runnerRemoteProbeCanConvertNow(
          input,
          economy,
          evaluation,
        );
        const irrecoverableScoreThreatContest =
          runnerIrrecoverableBlinkScoreThreatContest(
            input,
            candidates,
            evaluation,
          );
        const directRunRouteReady =
          evaluation.recommendation === "run_now" ||
          evaluation.recommendation === "run_if_free" ||
          productiveProbeCanConvertNow ||
          directRunCanConvertNow;
        return {
          contestId: `remote:${evaluation.targetServerId}`,
          serverId: evaluation.targetServerId,
          purpose: purpose === "information" ? purpose : ("contest" as const),
          knownAgendaThreat: evaluation.scoreThreat,
          reachable:
            !safetyBlocked &&
            !forgoUnsafeRunCapacity &&
            (irrecoverableScoreThreatContest ||
              (fundingSupport === undefined && directRunRouteReady)),
          marginalValue: irrecoverableScoreThreatContest
            ? 1_200
            : fundingSupport
              ? Math.max(1, evaluation.score)
              : evaluation.recommendation === "run_now" ||
                  productiveProbeCanConvertNow
                ? evaluation.score
                : Math.min(evaluation.score, 60),
          evidenceCode: forgoUnsafeRunCapacity
            ? "runner_restricted_run_capacity_below_required_hand_buffer"
            : safetyBlocked
              ? recentSafetyAbort.evidenceCode
              : irrecoverableScoreThreatContest
                ? `runner_irrecoverable_blink_score_threat_contest:${evaluation.targetServerId}`
                : fundingSupport
                  ? fundingSupport.evidenceCode
                  : directRunCanConvertNow
                    ? `runner_direct_run_converts_now:${evaluation.targetServerId}`
                    : evaluation.recommendation === "gain_credits_first"
                      ? `runner_remote_contest_waits_for_credit_reserve:${evaluation.targetServerId}`
                      : productiveProbeCanConvertNow
                        ? `runner_productive_remote_probe_converts_now:${evaluation.targetServerId}`
                        : (evaluation.evidence[0] ?? "runner_remote_target"),
          ...(fundingSupport ? { supportNeedId: fundingSupport.needId } : {}),
          preferredRunActionIds: [evaluation.actionId],
          ...(purpose === "information"
            ? { encounterCreditSpendLimit: 1 }
            : {}),
          accessCommitment: accessCommitmentForEvaluation(evaluation),
        };
      }),
    ...input.playerView.servers.flatMap((server) => {
      const knownAgenda = server.root.some(
        (card) => card.known !== false && card.type === "agenda",
      );
      const knownAgendaRunEvaluations = witnessedKnownAgendaRunEvaluations(
        input,
        candidates,
        runTargets,
        server.id,
      );
      if (
        !server.id.startsWith("remote_") ||
        !knownAgenda ||
        knownAgendaRunEvaluations.length === 0
      ) {
        return [];
      }
      const preferredRunActionIds = knownAgendaRunEvaluations.map(
        (evaluation) => evaluation.actionId,
      );
      return [
        {
          contestId: `remote:${server.id}`,
          serverId: server.id,
          purpose: "contest" as const,
          knownAgendaThreat: true,
          reachable: !forgoUnsafeRunCapacity,
          marginalValue: 1_000,
          evidenceCode: forgoUnsafeRunCapacity
            ? "runner_restricted_run_capacity_below_required_hand_buffer"
            : "visible_known_agenda_remote",
          preferredRunActionIds,
          accessCommitment: accessCommitmentForEvaluation(
            knownAgendaRunEvaluations[0]!,
          ),
        },
      ];
    }),
    ...constrainedRunCandidates.flatMap(
      ({ candidate, serverId, marginalValue, evidenceCode }) => {
        if (!serverId.startsWith("remote_")) return [];
        return [
          {
            contestId: `remote:${serverId}`,
            serverId,
            purpose: "information" as const,
            knownAgendaThreat: false,
            reachable: true,
            marginalValue,
            constrainedActionCapacity: true,
            evidenceCode,
            preferredRunActionIds: [candidate.actionId],
            encounterCreditSpendLimit: 1,
          },
        ];
      },
    ),
    ...runnerSameTurnAccessRemotePreparationSignals(
      input,
      candidates,
      handDevelopment,
      runTargets,
    ),
  ];
  const remoteContestDrafts: RunnerRemoteContestSignalDraft[] = [
    ...baseRemoteContestDrafts,
    ...runnerTargetedBypassRemotePreparationSignals(
      input,
      candidates,
      baseRemoteContestDrafts,
      runTargets,
    ),
  ];
  const remoteContests = uniqueBy(
    remoteContestDrafts,
    (signal) => signal.contestId,
  ).map((signal) =>
    bindRunnerRemoteRunActionAssessments(
      input,
      economy,
      signal,
      runTargets,
      candidates,
    ),
  );
  const delegatedFundingActionIds = runnerDelegatedFundingActionIds({
    fundingNeeds,
    coverageGaps,
    defense,
    resourceLifecycle,
    centralPressure,
    remoteContests,
  });
  const rejectedCreditBankActionIds = new Set(
    creditBanks.flatMap((signal) => signal.rejectedActionIds ?? []),
  );
  const cardDevelopments: RunnerPlanDomain["developments"] =
    handDevelopment.flatMap((evaluation): RunnerPlanDomain["developments"] => {
      const executableNow =
        evaluation.availability === "legal_now" &&
        evaluation.deferReason === "none";
      const waitingForCredits =
        evaluation.availability === "missing_credits" &&
        evaluation.deferReason === "missing_credits" &&
        evaluation.fundingNeed !== undefined;
      const waitingForReserve =
        evaluation.availability === "legal_now" &&
        evaluation.deferReason === "preserve_credit_floor" &&
        evaluation.persistentInstallEvaluation !== undefined;
      if (
        (!executableNow && !waitingForCredits && !waitingForReserve) ||
        !evaluation.definitionId
      ) {
        return [];
      }
      if (runnerDefinitionRequiresTargetedBypassPlan(evaluation.definitionId)) {
        return [];
      }
      if (
        recurringEconomy.some(
          (signal) => signal.definitionId === evaluation.definitionId,
        )
      ) {
        return [];
      }
      if (
        evaluation.activationPrerequisites.some(
          (prerequisite) => prerequisite.kind === "same_turn_access",
        )
      ) {
        return [];
      }
      const candidate = executableNow
        ? candidates.find(
            (entry) =>
              entry.sourceDefinitionId === evaluation.definitionId &&
              entry.sourceCardInstanceId === evaluation.cardInstanceId &&
              entry.actionId === evaluation.legalActionId,
          )
        : undefined;
      if (executableNow && !candidate) return [];
      if (
        candidate !== undefined &&
        !runnerGenericDevelopmentMayOwnAction(candidate)
      ) {
        return [];
      }
      const executableCardActionCandidates =
        executableNow && candidate
          ? candidates.filter((entry) => {
              if (
                entry.sourceCardInstanceId !== evaluation.cardInstanceId ||
                entry.actionType !== candidate.actionType ||
                entry.semanticActionType !== candidate.semanticActionType
              ) {
                return false;
              }
              const canonicalAction = input.legalActions.find(
                (action) => action.actionId === candidate.actionId,
              );
              const alternativeAction = input.legalActions.find(
                (action) => action.actionId === entry.actionId,
              );
              return !(
                canonicalAction?.payload?.runnerProgramTrashBeforeInstall !==
                  true &&
                !candidate.actionId.endsWith(
                  ".runner_program_trash_before_install",
                ) &&
                (alternativeAction?.payload?.runnerProgramTrashBeforeInstall ===
                  true ||
                  entry.actionId.endsWith(
                    ".runner_program_trash_before_install",
                  ))
              );
            })
          : [];
      const specialistOwnedActionIds = new Set([
        ...creditBanks.flatMap((signal) => [
          ...signal.actionIds,
          ...(signal.rejectedActionIds ?? []),
        ]),
        ...(recurringEconomy ?? []).flatMap((signal) => signal.actionIds),
        ...(resourceLifecycle ?? []).flatMap((signal) => [
          ...signal.actionIds,
          ...(signal.rejectedActionIds ?? []),
        ]),
        ...(installedAgendaScores ?? []).flatMap((signal) => signal.actionIds),
      ]);
      if (
        candidate !== undefined &&
        specialistOwnedActionIds.has(candidate.actionId)
      ) {
        return [];
      }
      const coverageOwnedActionIds = new Set(
        coverageGaps.flatMap((gap) =>
          gap.answerInHand
            ? []
            : [
                ...gap.directSearchActionIds,
                ...gap.searchEngineSetupActionIds,
                ...gap.drawForAnswerActionIds,
              ],
        ),
      );
      if (
        candidate !== undefined &&
        coverageOwnedActionIds.has(candidate.actionId)
      ) {
        return [];
      }
      const unboundOneShotSearch =
        executableNow &&
        evaluation.developmentRole === "draw_or_search_engine" &&
        candidate?.actionType === "play_event" &&
        runnerCandidateIsOneShotSearch(candidate) &&
        !coverageOwnedActionIds.has(candidate.actionId);
      if (unboundOneShotSearch) {
        return [];
      }
      const ownedByActiveEconomyPlan =
        candidate !== undefined &&
        delegatedFundingActionIds.has(candidate.actionId);
      if (ownedByActiveEconomyPlan) return [];
      const evaluationDefinitionId = evaluation.definitionId;
      const assignedCoveragePlanIds = evaluationDefinitionId
        ? coverageGaps
            .filter((gap) =>
              rolesMatch(
                rolesForDeckDoctrineCard(evaluationDefinitionId),
                runnerCoverageRoleNeedles(gap.requiredRole),
              ),
            )
            .map((gap) => `runner.rig_and_coverage:${gap.gapId}`)
        : [];
      if (
        candidate &&
        runTargets.some(
          (runEvaluation) => runEvaluation.actionId === candidate.actionId,
        )
      ) {
        return [];
      }
      const restrictedCapacitySetup =
        candidate?.actionCapacityProjection?.kind ===
          "immediate_restricted_gain" &&
        candidate.actionCapacityProjection.followupActionCapacity > 0;
      const restrictedProgramInstallCommitment =
        executableNow &&
        candidate?.actionCapacityProjection?.restriction ===
          "program_install_only"
          ? runnerRestrictedProgramInstallSequenceCommitment(
              input,
              candidate,
              candidates,
              handDevelopment,
              economy,
            )
          : undefined;
      if (
        executableNow &&
        candidate &&
        restrictedCapacitySetup &&
        candidate.actionCapacityProjection?.restriction ===
          "program_install_only" &&
        restrictedProgramInstallCommitment === undefined
      ) {
        return [
          {
            developmentId: `card:${evaluation.cardInstanceId}`,
            definitionId: evaluation.definitionId,
            targetKind: "capability" as const,
            phase: "prepare_restricted_sequence" as const,
            purposeCode: "prepare_productive_program_install_sequence",
            assignedDomainPlanIds: assignedCoveragePlanIds,
            duplicateAlreadyInstalled: false,
            affordableOrSupportable: false,
            semanticActionTypes: [candidate.semanticActionType],
            actionIds: [],
            priorityClass: "P6" as const,
            value: 0,
            evidenceCode:
              "runner_restricted_program_sequence_waiting_for_productive_bundle",
            evidenceCodes: [
              "runner_restricted_program_sequence_source_held",
              "runner_restricted_program_sequence_requires_visible_targets",
            ],
          },
        ];
      }
      if (
        executableNow &&
        candidate &&
        restrictedCapacitySetup &&
        candidate.actionCapacityProjection?.restriction !==
          "program_install_only" &&
        !restrictedActionCapacityHasProductiveFollowup(
          candidate,
          candidates,
          handDevelopment,
          runTargets,
        )
      ) {
        return [];
      }
      const duplicate =
        evaluation.persistentInstallEvaluation?.duplicateRole ===
        "redundant_duplicate";
      const reserveProtectedTargetCredits = waitingForReserve
        ? evaluation.persistentInstallEvaluation!.installCost +
          economy.minimumCreditFloor
        : undefined;
      const fundingGap =
        evaluation.fundingNeed?.missingCredits ??
        (reserveProtectedTargetCredits !== undefined
          ? Math.max(
              0,
              reserveProtectedTargetCredits - input.playerView.own.credits,
            )
          : 0);
      const fundingRoute =
        waitingForCredits || waitingForReserve
          ? runnerDevelopmentFundingRoute(
              input,
              candidates.filter(
                (entry) => !rejectedCreditBankActionIds.has(entry.actionId),
              ),
              evaluation,
              reserveProtectedTargetCredits,
            )
          : undefined;
      const fundingActionIds = new Set(fundingRoute?.actionIds ?? []);
      const fundingCandidates =
        waitingForCredits || waitingForReserve
          ? candidates.filter((entry) => fundingActionIds.has(entry.actionId))
          : [];
      const productiveRunNowAvailable = runTargets.some(
        (run) =>
          run.pathPassability === "reachable" &&
          run.recommendation === "run_now" &&
          run.score > 0,
      );
      const breakerSetupYieldsToProductiveRun =
        evaluation.developmentRole === "breaker_or_rig_piece" &&
        productiveRunNowAvailable;
      const unassignedWeakCardPlan =
        evaluation.developmentRole === "unknown" &&
        evaluation.strategicFit === "weak";
      const developmentPriorityClass =
        evaluation.currentNeed === "acute" && !breakerSetupYieldsToProductiveRun
          ? ("P4" as const)
          : unassignedWeakCardPlan
            ? ("P6" as const)
            : evaluation.currentNeed === "useful_now" ||
                evaluation.currentNeed === "setup" ||
                restrictedCapacitySetup
              ? ("P5" as const)
              : ("P6" as const);
      const normalizedDevelopmentValue = unassignedWeakCardPlan
        ? Math.min(20, evaluation.priority)
        : restrictedCapacitySetup
          ? Math.min(
              120,
              60 +
                candidate.actionCapacityProjection!.followupActionCapacity * 10,
            )
          : evaluation.currentNeed === "acute"
            ? Math.min(300, evaluation.priority)
            : evaluation.currentNeed === "useful_now" ||
                evaluation.currentNeed === "setup"
              ? Math.min(80, evaluation.priority)
              : Math.min(20, evaluation.priority);
      const actionIds = candidate
        ? executableCardActionCandidates.map((entry) => entry.actionId)
        : fundingCandidates.map((entry) => entry.actionId);
      const semanticActionTypes = candidate
        ? [candidate.semanticActionType]
        : [
            ...new Set(
              fundingCandidates.map((entry) => entry.semanticActionType),
            ),
          ];
      return [
        {
          developmentId: `card:${evaluation.cardInstanceId}`,
          definitionId: evaluation.definitionId,
          ...(restrictedProgramInstallCommitment
            ? { targetKind: "capability" as const }
            : {}),
          phase: restrictedProgramInstallCommitment
            ? ("open_restricted_sequence" as const)
            : waitingForCredits || waitingForReserve
              ? ("fund" as const)
              : ("execute" as const),
          ...(restrictedProgramInstallCommitment
            ? {
                purposeCode: "open_committed_program_install_sequence",
              }
            : evaluation.currentNeed !== "none" &&
                evaluation.currentNeed !== undefined
              ? {
                  purposeCode: `${evaluation.developmentRole}:${evaluation.currentNeed}`,
                }
              : {}),
          assignedDomainPlanIds: assignedCoveragePlanIds,
          duplicateAlreadyInstalled: duplicate,
          affordableOrSupportable:
            executableNow || fundingCandidates.length > 0,
          semanticActionTypes:
            semanticActionTypes.length > 0
              ? semanticActionTypes
              : ["economy.gain_credit"],
          actionIds,
          ...(waitingForCredits || waitingForReserve ? { fundingGap } : {}),
          priorityClass: developmentPriorityClass,
          value: normalizedDevelopmentValue,
          evidenceCode: evaluation.evidence[0] ?? "runner_hand_development",
          ...(restrictedProgramInstallCommitment
            ? {
                evidenceCodes: restrictedProgramInstallCommitment.evidenceCodes,
                restrictedProgramInstallCommitment,
              }
            : fundingRoute
              ? { evidenceCodes: fundingRoute.evidenceCodes }
              : {}),
        },
      ];
    });
  const restrictedProgramInstallSequenceDevelopments =
    runnerRestrictedProgramInstallSequenceSignals(input, candidates, previous);
  const developments = [
    ...cardDevelopments,
    ...restrictedProgramInstallSequenceDevelopments,
    ...runnerProgramSearchStrategyDevelopmentSignals(
      input,
      candidates,
      strategicIntent,
      coverageGaps,
      handDevelopment,
    ),
    ...runnerGenericDrawDevelopmentSignals(input, candidates),
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
        const safetyAssessment =
          runnerFutureEncounterDamageJackOutAssessment(input) ??
          runnerKnownAccessDamageJackOutAssessment(input) ??
          currentRunAbortAssessment(input);
        const encounterMitigation = visibleEncounterMitigation(input);
        const exactPhaseActionIds = runnerExactRunWindowPhaseActionIds(
          input,
          candidates,
          runWindowActionAssessments,
          safetyAssessment !== undefined,
          currentEncounterHasUnbrokenResolvableDeflector(input),
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
        return [
          {
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
          },
        ];
      })()
    : [];
  return {
    fundingNeeds,
    coverageGaps,
    creditBanks,
    recurringEconomy,
    resourceLifecycle,
    installedAgendaScores,
    defense,
    terminalWins:
      input.playerView.opponent.deckCount === 0 &&
      candidates.some((candidate) => candidate.actionType === "end_turn")
        ? [
            {
              terminalId: "force-corp-empty-rd-draw",
              semanticActionTypes: ["turn_flow.end_turn"],
              evidenceCode: "corp_visible_empty_rd_forced_mandatory_draw",
            },
          ]
        : [],
    centralPressure,
    remoteContests,
    developments,
    runWindows,
  };
}

function runnerTargetedBypassCentralPreparationSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  pressureSignals: RunnerPlanDomain["centralPressure"],
  runTargets: readonly RunnerRunTargetEvaluation[],
): RunnerPlanDomain["centralPressure"] {
  const eligiblePlans = pressureSignals.filter(
    (signal) =>
      signal.routePreparation === undefined &&
      !runnerCentralPressureHasExecutableEventRun(
        signal,
        candidates,
        runTargets,
      ),
  );
  return candidates
    .filter(runnerActionRequiresTargetedBypassPlan)
    .sort((left, right) => left.actionId.localeCompare(right.actionId))
    .flatMap((candidate) => {
      const planTargets = eligiblePlans.flatMap((signal) => {
        const payoffValue = runnerTargetedBypassPayoffValue(
          signal.serverId,
          runTargets,
        );
        if (payoffValue <= 0) return [];
        return [
          {
            ownerModuleId: "runner.pressure_central" as const,
            ownerDedupeKey: signal.pressureId,
            serverId: signal.serverId,
            payoffValue,
          },
        ];
      });
      const commitment = runnerTargetedBypassPlanCommitment({
        input,
        candidate,
        planTargets,
      });
      if (!commitment) return [];
      const owner = eligiblePlans.find(
        (signal) => signal.pressureId === commitment.ownerDedupeKey,
      );
      if (!owner) return [];
      const payoffValue =
        planTargets.find(
          (target) =>
            target.ownerDedupeKey === commitment.ownerDedupeKey &&
            target.serverId === commitment.serverId,
        )?.payoffValue ?? 0;
      return [
        {
          ...owner,
          reachable: true,
          marginalValue: payoffValue,
          evidenceCode: `runner_targeted_bypass_preflight:${commitment.serverId}:${commitment.icePosition}`,
          sourceDefinitionIds: [commitment.sourceDefinitionId],
          preparationActionIds: [commitment.sourceActionId],
          routePreparation: "targeted_bypass" as const,
          targetedBypassCommitment: commitment,
        },
      ];
    })
    .slice(0, 1);
}

export function runnerCentralPressureHasExecutableEventRun(
  signal: RunnerPlanDomain["centralPressure"][number],
  candidates: readonly ActionSemanticCandidate[],
  runTargets: readonly RunnerRunTargetEvaluation[],
): boolean {
  if (!signal.reachable || signal.marginalValue <= 0) return false;
  const ownedActionIds = new Set(signal.runActionIds ?? []);
  return candidates.some(
    (candidate) =>
      ownedActionIds.has(candidate.actionId) &&
      (signal.runActionExclusions?.[candidate.actionId]?.length ?? 0) === 0 &&
      candidate.semanticActionType === "play.runner_event" &&
      candidate.runProjectionSummary?.serverId === signal.serverId &&
      runTargets.some(
        (evaluation) =>
          evaluation.actionId === candidate.actionId &&
          evaluation.targetServerId === signal.serverId &&
          evaluation.pathPassability === "reachable" &&
          (evaluation.recommendation === "run_now" ||
            evaluation.recommendation === "run_if_free") &&
          evaluation.score > 0 &&
          evaluation.knownAccessState !== "known_no_current_payoff",
      ),
  );
}

function runnerTargetedBypassRemotePreparationSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  contestSignals: readonly RunnerRemoteContestSignalDraft[],
  runTargets: readonly RunnerRunTargetEvaluation[],
): RunnerRemoteContestSignalDraft[] {
  const eligiblePlans = contestSignals.filter(
    (signal) => signal.routePreparation === undefined,
  );
  return candidates
    .filter(runnerActionRequiresTargetedBypassPlan)
    .sort((left, right) => left.actionId.localeCompare(right.actionId))
    .flatMap((candidate) => {
      const planTargets = eligiblePlans.flatMap((signal) => {
        const payoffValue = Math.max(
          signal.knownAgendaThreat ? 1_000 : 0,
          runnerTargetedBypassPayoffValue(signal.serverId, runTargets),
        );
        if (payoffValue <= 0) return [];
        return [
          {
            ownerModuleId: "runner.contest_remote" as const,
            ownerDedupeKey: signal.contestId,
            serverId: signal.serverId,
            payoffValue,
            knownAgendaThreat: signal.knownAgendaThreat,
          },
        ];
      });
      const commitment = runnerTargetedBypassPlanCommitment({
        input,
        candidate,
        planTargets,
      });
      if (!commitment) return [];
      const owner = eligiblePlans.find(
        (signal) => signal.contestId === commitment.ownerDedupeKey,
      );
      if (!owner) return [];
      const payoffValue =
        planTargets.find(
          (target) =>
            target.ownerDedupeKey === commitment.ownerDedupeKey &&
            target.serverId === commitment.serverId,
        )?.payoffValue ?? 0;
      return [
        {
          ...owner,
          reachable: true,
          marginalValue: payoffValue,
          evidenceCode: `runner_targeted_bypass_preflight:${commitment.serverId}:${commitment.icePosition}`,
          preparationActionIds: [commitment.sourceActionId],
          routePreparation: "targeted_bypass" as const,
          targetedBypassCommitment: commitment,
        },
      ];
    })
    .slice(0, 1);
}

function runnerTargetedBypassPayoffValue(
  serverId: string,
  runTargets: readonly RunnerRunTargetEvaluation[],
): number {
  return runTargets
    .filter((evaluation) => evaluation.targetServerId === serverId)
    .reduce((best, evaluation) => {
      if (
        evaluation.knownAccessState === "known_no_current_payoff" ||
        evaluation.accessPayoff === "known_low_value"
      ) {
        return best;
      }
      const payoffValue =
        evaluation.accessPayoff === "agenda" ||
        evaluation.accessPayoff === "score_threat"
          ? 1_000
          : evaluation.accessPayoff === "trash_affordable" ||
              evaluation.accessPayoff === "access_bonus"
            ? Math.max(300, evaluation.score)
            : evaluation.accessPayoff === "fresh"
              ? Math.max(120, evaluation.score)
              : Math.max(0, evaluation.score);
      return Math.max(best, payoffValue);
    }, 0);
}

function runnerProgramSearchStrategyDevelopmentSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  strategicIntent: RunnerStrategicIntentProfile,
  coverageGaps: RunnerCorePlanDomain["coverageGaps"],
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[],
): RunnerPlanDomain["developments"] {
  if (
    runnerProgramSearchRecentlyResolved(input) &&
    input.playerView.own.gripOrHq.some(
      (card) => card.known && card.type === "program",
    )
  ) {
    return [];
  }
  const strategicState = (input as AiDecisionInputWithDeckCapabilities)
    .ownStrategicIntentState;
  if (
    !(strategicIntent.setupEngine ?? []).some(
      (setup) =>
        setup === "runner.search_breaker_setup" ||
        setup === "runner.draw_or_search_setup",
    ) &&
    strategicState?.primaryStrategy.strategyId !== "runner.search.breaker"
  ) {
    return [];
  }
  if (
    input.playerView.own.gripOrHq.length >= input.playerView.own.maxHandSize
  ) {
    return [];
  }
  const unrepresentedTargets =
    runnerUnrepresentedProgramDevelopmentTargets(input);
  if (!unrepresentedTargets || unrepresentedTargets.length === 0) return [];
  const coverageOwnedActionIds = new Set(
    coverageGaps.flatMap((gap) =>
      gap.answerInHand ? [] : gap.directSearchActionIds,
    ),
  );
  const bySource = new Map<
    string,
    {
      sourceDefinitionId: string;
      candidates: ActionSemanticCandidate[];
    }
  >();
  for (const candidate of candidates) {
    if (
      !runnerCandidateSourceSupportsProgramSearch(input, candidate) ||
      coverageOwnedActionIds.has(candidate.actionId) ||
      runnerHandDevelopmentRejectionForCandidate(candidate, handDevelopment) !==
        undefined
    ) {
      continue;
    }
    const sourceDefinitionId = runnerCandidateSourceDefinitionId(
      input,
      candidate,
    );
    if (!sourceDefinitionId) continue;
    const sourceKey = candidate.sourceCardInstanceId ?? candidate.actionId;
    const group = bySource.get(sourceKey);
    if (group) {
      group.candidates.push(candidate);
    } else {
      bySource.set(sourceKey, {
        sourceDefinitionId,
        candidates: [candidate],
      });
    }
  }
  return [...bySource.entries()].map(
    ([sourceKey, { sourceDefinitionId, candidates: sourceCandidates }]) => ({
      developmentId: `program-search:${sourceKey}`,
      definitionId: sourceDefinitionId,
      targetKind: "capability" as const,
      phase: "execute" as const,
      purposeCode: "search_unrepresented_program_for_deck_strategy",
      assignedDomainPlanIds: [],
      duplicateAlreadyInstalled: false,
      affordableOrSupportable: true,
      semanticActionTypes: [
        ...new Set(
          sourceCandidates.map((candidate) => candidate.semanticActionType),
        ),
      ],
      actionIds: sourceCandidates.map((candidate) => candidate.actionId).sort(),
      priorityClass: "P5" as const,
      value: 20,
      evidenceCode: `runner_program_search_strategy_target:${unrepresentedTargets[0]}`,
      evidenceCodes: [
        `runner_program_search_source:${sourceDefinitionId}`,
        `runner_program_search_unrepresented_targets:${unrepresentedTargets.join(",")}`,
      ],
    }),
  );
}

function runnerGenericDrawDevelopmentSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): RunnerPlanDomain["developments"] {
  const handCapacityGap =
    input.playerView.own.maxHandSize - input.playerView.own.gripOrHq.length;
  if (handCapacityGap <= 0 || input.playerView.own.stackOrRdCount <= 0) {
    return [];
  }
  const drawCandidates = candidates.filter(
    (candidate) =>
      (candidate.actionType === "draw_card" &&
        candidate.semanticActionType === "draw.card" &&
        candidate.sourceKind === "basic_action") ||
      (candidate.sourceKind === "card" &&
        candidate.economyProjection?.timing === "immediate" &&
        (candidate.economyProjection.netHandDelta ?? 0) > 0 &&
        (candidate.economyProjection.netHandDelta ?? 0) <=
          Math.max(0, handCapacityGap)),
  );
  if (drawCandidates.length === 0) return [];
  return [
    {
      developmentId: "generic:draw-options",
      definitionId: "runner_option_development",
      targetKind: "capability",
      phase: "execute",
      purposeCode: "increase_hand_option_density",
      assignedDomainPlanIds: [],
      duplicateAlreadyInstalled: false,
      affordableOrSupportable: true,
      semanticActionTypes: [
        ...new Set(
          drawCandidates.map((candidate) => candidate.semanticActionType),
        ),
      ],
      actionIds: drawCandidates.map((candidate) => candidate.actionId),
      priorityClass: "P6",
      value: 10 + Math.min(5, handCapacityGap),
      evidenceCode: "runner_hand_capacity_accepts_immediate_option_development",
    },
  ];
}

function runnerInstalledAgendaScoreSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): NonNullable<RunnerCorePlanDomain["installedAgendaScores"]> {
  return candidates.flatMap((candidate) => {
    const action = input.legalActions.find(
      (legalAction) => legalAction.actionId === candidate.actionId,
    );
    if (action?.payload?.cardImplementationScoresSourceAsAgenda !== true)
      return [];
    const sourceCardInstanceId =
      candidate.sourceCardInstanceId ??
      (typeof action.source === "string" ? action.source : undefined);
    if (!sourceCardInstanceId)
      throw new PlanResolutionFailure("missing_action_semantics", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map(
          (legalAction) => legalAction.type,
        ),
        owner: "action_semantics",
        removalCondition:
          "Every installed-agenda score action must expose its source card instance.",
      });
    const sourceCard = visibleOwnCardByInstanceId(input, sourceCardInstanceId);
    if (!sourceCard?.known || !sourceCard.definitionId)
      throw new PlanResolutionFailure("invalid_player_view_card_projection", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map(
          (legalAction) => legalAction.type,
        ),
        owner: "rules_contract",
        removalCondition:
          "An installed-agenda score action must point to a visible own card with a definition.",
      });
    const agendaPoints =
      sourceCard.agendaPoints ??
      (sourceCard.definitionId
        ? CARD_DEFINITIONS_BY_ID[sourceCard.definitionId]?.agendaPoints
        : undefined);
    if (agendaPoints === undefined)
      throw new PlanResolutionFailure("missing_card_definition", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map(
          (legalAction) => legalAction.type,
        ),
        owner: "rules_contract",
        removalCondition: `Provide agenda points for ${sourceCard.definitionId ?? sourceCardInstanceId}.`,
      });
    return [
      {
        opportunityId: sourceCardInstanceId,
        sourceCardInstanceId,
        actionIds: [candidate.actionId],
        agendaPoints,
        terminal:
          input.playerView.own.agendaPoints + agendaPoints >=
          input.playerView.agendaPointsToWin,
        evidenceCode: "runner_installed_agenda_score_conversion",
      },
    ];
  });
}

function runnerCentralPressureDevelopmentSignals(
  candidates: readonly ActionSemanticCandidate[],
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[],
  runTargets: readonly RunnerRunTargetEvaluation[],
  strategicIntent: RunnerStrategicIntentProfile,
): RunnerPlanDomain["centralPressure"] {
  return handDevelopment.flatMap((evaluation) => {
    if (
      evaluation.developmentRole !== "access_payoff" ||
      evaluation.strategicFit !== "strong" ||
      evaluation.availability !== "legal_now" ||
      evaluation.deferReason !== "none" ||
      !evaluation.definitionId ||
      !evaluation.legalActionId
    ) {
      return [];
    }
    const candidate = candidates.find(
      (entry) =>
        entry.actionId === evaluation.legalActionId &&
        entry.sourceDefinitionId === evaluation.definitionId,
    );
    if (
      !candidate ||
      runnerDefinitionRequiresTargetedBypassPlan(evaluation.definitionId)
    ) {
      return [];
    }
    const serverId = runnerCentralPayoffServer(candidate);
    if (
      !serverId ||
      runTargets.some((target) => target.targetServerId === serverId)
    ) {
      return [];
    }
    return [
      {
        pressureId: `central:${serverId}`,
        serverId,
        purpose: "multiaccess" as const,
        strategyLineIds: [
          ...new Set([
            strategicIntent.primaryWinIntent,
            ...candidate.strategySupport.map((support) => support.strategyId),
          ]),
        ],
        priorityClass: "P4" as const,
        reachable: true,
        marginalValue: Math.min(300, Math.max(1, evaluation.priority)),
        evidenceCode: `runner_central_pressure_develop_payoff:${serverId}:${evaluation.definitionId}`,
        sourceDefinitionIds: [evaluation.definitionId],
        preparationActionIds: [candidate.actionId],
        routePreparation: "develop_payoff" as const,
      },
    ];
  });
}

function runnerSameTurnAccessCentralPreparationSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[],
  runTargets: readonly RunnerRunTargetEvaluation[],
  strategicIntent: RunnerStrategicIntentProfile,
): RunnerPlanDomain["centralPressure"] {
  if (input.playerView.own.clicks < 2) return [];
  const target = [...runTargets]
    .filter(
      (evaluation) =>
        (evaluation.targetServerId === "hq" ||
          evaluation.targetServerId === "rd" ||
          evaluation.targetServerId === "archives") &&
        evaluation.pathPassability === "reachable" &&
        evaluation.recommendation === "run_now" &&
        evaluation.score > 0 &&
        evaluation.knownAccessState !== "known_no_current_payoff",
    )
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.targetServerId.localeCompare(right.targetServerId),
    )[0];
  if (!target) return [];
  const handRoute = [...handDevelopment]
    .filter(
      (evaluation) =>
        evaluation.availability === "legal_now" &&
        evaluation.deferReason === "none" &&
        evaluation.activationPrerequisites.some(
          (prerequisite) =>
            prerequisite.kind === "same_turn_access" && prerequisite.satisfied,
        ) &&
        evaluation.definitionId !== undefined &&
        !runnerDefinitionRequiresTargetedBypassPlan(evaluation.definitionId) &&
        evaluation.legalActionId !== undefined,
    )
    .sort(
      (left, right) =>
        right.priority - left.priority ||
        left.cardInstanceId.localeCompare(right.cardInstanceId),
    )
    .flatMap((evaluation) => {
      const candidate = candidates.find(
        (entry) =>
          entry.actionId === evaluation.legalActionId &&
          entry.sourceDefinitionId === evaluation.definitionId,
      );
      if (!candidate || !evaluation.definitionId) return [];
      return [
        {
          candidate,
          definitionId: evaluation.definitionId,
          value: evaluation.priority,
        },
      ];
    })[0];
  const exactRoute =
    handRoute ??
    candidates
      .flatMap((candidate) => {
        if (runnerActionRequiresTargetedBypassPlan(candidate)) return [];
        const definitionId = runnerSameTurnAccessPreparationDefinitionId(
          input,
          candidate,
        );
        return definitionId
          ? [{ candidate, definitionId, value: target.score }]
          : [];
      })
      .sort((left, right) =>
        left.candidate.actionId.localeCompare(right.candidate.actionId),
      )[0];
  if (!exactRoute) return [];
  return [
    {
      pressureId: `central:${target.targetServerId}`,
      serverId: target.targetServerId as "hq" | "rd" | "archives",
      purpose: "access" as const,
      strategyLineIds: [
        ...new Set([
          strategicIntent.primaryWinIntent,
          ...exactRoute.candidate.strategySupport.map(
            (support) => support.strategyId,
          ),
        ]),
      ],
      priorityClass: "P4" as const,
      reachable: true,
      marginalValue: Math.min(300, Math.max(target.score, exactRoute.value)),
      evidenceCode: `runner_same_turn_access_preparation:${target.targetServerId}:${exactRoute.definitionId}`,
      sourceDefinitionIds: [exactRoute.definitionId],
      preparationActionIds: [exactRoute.candidate.actionId],
      routePreparation: "develop_payoff" as const,
    },
  ];
}

function runnerSameTurnAccessRemotePreparationSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[],
  runTargets: readonly RunnerRunTargetEvaluation[],
): RunnerRemoteContestSignalDraft[] {
  if (input.playerView.own.clicks < 2) return [];
  const target = [...runTargets]
    .filter(
      (evaluation) =>
        evaluation.targetServerId.startsWith("remote_") &&
        evaluation.pathPassability === "reachable" &&
        evaluation.recommendation === "run_now" &&
        evaluation.score > 0 &&
        evaluation.knownAccessState !== "known_no_current_payoff",
    )
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.targetServerId.localeCompare(right.targetServerId),
    )[0];
  if (!target) return [];
  const handRoute = [...handDevelopment]
    .filter(
      (evaluation) =>
        evaluation.availability === "legal_now" &&
        evaluation.deferReason === "none" &&
        evaluation.activationPrerequisites.some(
          (prerequisite) =>
            prerequisite.kind === "same_turn_access" && prerequisite.satisfied,
        ) &&
        evaluation.definitionId !== undefined &&
        !runnerDefinitionRequiresTargetedBypassPlan(evaluation.definitionId) &&
        evaluation.legalActionId !== undefined,
    )
    .sort(
      (left, right) =>
        right.priority - left.priority ||
        left.cardInstanceId.localeCompare(right.cardInstanceId),
    )
    .flatMap((evaluation) => {
      const candidate = candidates.find(
        (entry) =>
          entry.actionId === evaluation.legalActionId &&
          entry.sourceDefinitionId === evaluation.definitionId,
      );
      if (!candidate || !evaluation.definitionId) return [];
      return [
        {
          candidate,
          definitionId: evaluation.definitionId,
          value: evaluation.priority,
        },
      ];
    })[0];
  const exactRoute =
    handRoute ??
    candidates
      .flatMap((candidate) => {
        if (runnerActionRequiresTargetedBypassPlan(candidate)) return [];
        const definitionId = runnerSameTurnAccessPreparationDefinitionId(
          input,
          candidate,
        );
        return definitionId
          ? [{ candidate, definitionId, value: target.score }]
          : [];
      })
      .sort((left, right) =>
        left.candidate.actionId.localeCompare(right.candidate.actionId),
      )[0];
  if (!exactRoute) return [];
  return [
    {
      contestId: `remote:${target.targetServerId}`,
      serverId: target.targetServerId,
      purpose: "contest" as const,
      knownAgendaThreat: target.scoreThreat,
      reachable: true,
      marginalValue: Math.min(300, Math.max(target.score, exactRoute.value)),
      evidenceCode: `runner_same_turn_access_preparation:${target.targetServerId}:${exactRoute.definitionId}`,
      preparationActionIds: [exactRoute.candidate.actionId],
      routePreparation: "prepare_access_payoff" as const,
    },
  ];
}

function runnerCentralPayoffServer(
  candidate: ActionSemanticCandidate,
): "hq" | "rd" | "archives" | undefined {
  const targets = new Set(candidate.effectTargets ?? []);
  if (
    targets.has("rd") ||
    targets.has("rnd") ||
    candidate.actionTacticSignals.includes("access.rnd_multiaccess")
  ) {
    return "rd";
  }
  if (
    targets.has("hq") ||
    candidate.actionTacticSignals.includes("access.hq_multiaccess")
  ) {
    return "hq";
  }
  if (targets.has("archives")) return "archives";
  return undefined;
}

function runnerDevelopmentFundingRoute(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  evaluation: RunnerHandDevelopmentEvaluation,
  explicitTargetCredits?: number,
): { actionIds: string[]; evidenceCodes: string[] } {
  const targetCredits =
    explicitTargetCredits ?? evaluation.fundingNeed?.installOrPlayCost;
  if (targetCredits === undefined) {
    return {
      actionIds: [],
      evidenceCodes: ["development_funding_route_status:missing_credit_demand"],
    };
  }

  // A funding step belongs to the card plan only when the complete
  // fund-and-convert route still fits into this turn. Long-term generic
  // credit accumulation remains the economy plan's responsibility.
  const conversionClickCost = 1;
  const remainingFundingClicks = Math.max(
    0,
    input.playerView.own.clicks - conversionClickCost,
  );
  const demand = createRunnerCreditDemand({
    demandId: `development:${evaluation.cardInstanceId}`,
    sourcePlanId: `runner.develop_board_and_hand:${evaluation.cardInstanceId}`,
    purpose: "foreground_plan",
    priority: "current_foreground_plan",
    hardness: "hard",
    deadline: "end_of_current_turn",
    currentCredits: input.playerView.own.credits,
    targetCredits,
    evidence: [
      `development_card:${evaluation.definitionId ?? "missing_definition"}`,
      `development_conversion_clicks_reserved:${conversionClickCost}`,
    ],
  });
  const result = searchFundingRoutes({
    demand,
    candidates,
    remainingClicks: remainingFundingClicks,
    maxSteps: Math.max(1, remainingFundingClicks),
    maxRoutes: 8,
  });
  const actionIds = [
    ...new Set(
      result.routes
        .filter(
          (route) =>
            route.status === "covered_guaranteed" &&
            route.horizon === "same_turn",
        )
        .map(
          (route) =>
            route.steps.find(
              (step) =>
                step.kind === "legal_action" &&
                step.ownTurnOffset === 0 &&
                step.actionId !== undefined,
            )?.actionId,
        )
        .filter((actionId): actionId is string => actionId !== undefined),
    ),
  ];
  return {
    actionIds,
    evidenceCodes: [
      `development_funding_click_budget:${remainingFundingClicks}`,
      ...(explicitTargetCredits !== undefined
        ? [
            `development_funding_preserves_credit_floor:true`,
            `development_funding_target_credits:${explicitTargetCredits}`,
          ]
        : []),
      `development_funding_route_status:${result.bestRoute.status}`,
      `development_funding_route_horizon:${result.bestRoute.horizon}`,
      `development_funding_route_gap:${result.bestRoute.projectedGap}`,
      `development_funding_route_ready:${actionIds.length > 0}`,
    ],
  };
}

type RunnerExactFundingRouteRequest = Pick<
  CreateSideCreditDemandParams,
  | "demandId"
  | "sourcePlanId"
  | "purpose"
  | "priority"
  | "hardness"
  | "deadline"
  | "targetCredits"
  | "evidence"
> & {
  remainingClicks: number;
  allowIncrementalProgress?: boolean;
};

function runnerExactFundingRouteContract(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  request: RunnerExactFundingRouteRequest,
): {
  routeActionIds: string[];
  routeAssessment: RunnerFundingRouteAssessment;
} {
  const targetCredits = request.allowIncrementalProgress
    ? Math.min(request.targetCredits, input.playerView.own.credits + 1)
    : request.targetCredits;
  const demand = createRunnerCreditDemand({
    demandId: request.demandId,
    purpose: request.purpose,
    priority: request.priority,
    hardness: request.hardness,
    deadline: request.deadline,
    currentCredits: input.playerView.own.credits,
    targetCredits,
    ...(request.sourcePlanId !== undefined
      ? { sourcePlanId: request.sourcePlanId }
      : {}),
    ...(request.evidence !== undefined ? { evidence: request.evidence } : {}),
  });
  const result = searchFundingRoutes({
    demand,
    candidates: candidates.filter(runnerFundingRouteCandidateIsMaterializable),
    remainingClicks: request.remainingClicks,
    maxSteps: Math.max(1, request.remainingClicks),
    maxRoutes: 8,
  });
  const bestRoute = result.bestRoute;
  const firstStepActionId =
    bestRoute.status === "covered_guaranteed" &&
    bestRoute.reliability === "guaranteed" &&
    bestRoute.horizon === "same_turn" &&
    bestRoute.projectedGap === 0
      ? bestRoute.steps.find(
          (step) =>
            step.kind === "legal_action" &&
            step.ownTurnOffset === 0 &&
            step.actionId !== undefined,
        )?.actionId
      : undefined;
  return {
    routeActionIds: firstStepActionId === undefined ? [] : [firstStepActionId],
    routeAssessment: {
      stateVersion: input.playerView.stateVersion,
      routeId: bestRoute.routeId,
      status: bestRoute.status,
      reliability: bestRoute.reliability,
      horizon: bestRoute.horizon,
      projectedGap: bestRoute.projectedGap,
      totalClickCost: bestRoute.totalClickCost,
      ...(firstStepActionId !== undefined ? { firstStepActionId } : {}),
      evidenceCodes: [...new Set([...result.evidence, ...bestRoute.evidence])],
    },
  };
}

function runnerImmediateGeneralLiquidEconomyRoute(
  candidate: ActionSemanticCandidate,
): boolean {
  const projection = candidate.economyProjection;
  return (
    projection?.kind === "immediate_liquid" &&
    projection.timing === "immediate" &&
    projection.creditRestriction === "general" &&
    typeof projection.netLiquidCreditGain === "number" &&
    Number.isFinite(projection.netLiquidCreditGain) &&
    projection.netLiquidCreditGain > 0
  );
}

function runnerRemoteInformationPreparationSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  runTargets: readonly RunnerRunTargetEvaluation[],
): RunnerRemoteContestSignalDraft[] {
  const exposeCandidates = candidates.filter(
    (candidate) =>
      !runnerActionRequiresTargetedBypassPlan(candidate) &&
      runnerCandidateIsExposeAbility(input, candidate),
  );
  if (exposeCandidates.length === 0) return [];
  const matchpointPressure =
    input.playerView.own.agendaPoints >=
      input.playerView.agendaPointsToWin - 2 ||
    input.playerView.opponent.agendaPoints >=
      input.playerView.agendaPointsToWin - 2;
  const remote = input.playerView.servers
    .filter(
      (server) =>
        server.id.startsWith("remote_") &&
        server.root.some((card) => card.known === false) &&
        matchpointPressure &&
        server.root.every((card) => (card.advancementCounters ?? 0) === 0),
    )
    .sort(
      (left, right) =>
        Math.max(
          0,
          ...right.root.map((card) => card.advancementCounters ?? 0),
        ) -
          Math.max(
            0,
            ...left.root.map((card) => card.advancementCounters ?? 0),
          ) ||
        right.root.length - left.root.length ||
        left.id.localeCompare(right.id),
    )[0];
  if (!remote) return [];
  const directContest = runTargets.find(
    (evaluation) =>
      evaluation.targetServerId === remote.id &&
      evaluation.pathPassability === "reachable" &&
      (evaluation.recommendation === "run_now" ||
        evaluation.recommendation === "run_if_free") &&
      evaluation.score > 0,
  );
  if (directContest) return [];
  const remoteTargetIds = new Set([
    remote.id,
    ...remote.root.map((card) => card.instanceId),
  ]);
  const preparationActionIds = exposeCandidates
    .filter((candidate) => {
      const targetIds = candidateTargetIds(candidate);
      return (
        targetIds.length === 0 ||
        targetIds.some((targetId) => remoteTargetIds.has(targetId))
      );
    })
    .map((candidate) => candidate.actionId);
  if (preparationActionIds.length === 0) return [];
  return [
    {
      contestId: `remote:${remote.id}`,
      serverId: remote.id,
      purpose: "information",
      knownAgendaThreat: false,
      reachable: true,
      marginalValue:
        800 +
        Math.max(
          0,
          ...remote.root.map((card) => card.advancementCounters ?? 0),
        ) *
          50,
      evidenceCode: "runner_remote_information_preparation",
      preparationActionIds,
      routePreparation: "expose_remote",
    },
  ];
}

function runnerIrrecoverableBlinkScoreThreatContest(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  const blinkRisk = evaluation.blinkRiskAssessment;
  if (
    evaluation.targetKind !== "remote" ||
    evaluation.scoreThreat !== true ||
    evaluation.pathPassability !== "blocked_by_blink_hand_buffer" ||
    blinkRisk?.blockedByHandBuffer !== true ||
    blinkRisk.stableCoverageAvailable === true ||
    blinkRisk.currentHandCount > 0
  ) {
    return false;
  }
  const recoveryRouteAvailable = candidates.some(
    (candidate) =>
      candidate.semanticActionType === "draw.card" ||
      candidate.actionTacticSignals.some(
        (signal) =>
          signal === "search.breaker" ||
          signal === "search.program" ||
          signal === "install.breaker",
      ),
  );
  return !recoveryRouteAvailable;
}

function runnerCentralPressureHasMaterialMarginalValue(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  if (evaluation.accessTargetKind === "archives") {
    return (
      archivesHasVisibleKnownAgenda(input) ||
      runnerArchivesHasQualifiedHiddenPayoff(input)
    );
  }
  const hqSaturatedByVisibleAccessEvidence =
    evaluation.accessTargetKind === "hq" &&
    (input.playerView.servers.find((server) => server.id === "hq")?.ice
      .length ?? 0) === 0 &&
    evaluation.evidence.includes(
      "hq_run_suppressed_by_knownness_low_value:true",
    );
  const runnerMatchpointCentralAccess =
    (evaluation.accessTargetKind === "rd" ||
      evaluation.accessTargetKind === "hq") &&
    evaluation.knownAccessState !== "known_no_current_payoff" &&
    input.playerView.own.agendaPoints >= input.playerView.agendaPointsToWin - 2;
  if (
    hqSaturatedByVisibleAccessEvidence &&
    !runnerMatchpointCentralAccess &&
    !evaluation.multiaccessAvailable &&
    evaluation.accessPayoff !== "agenda" &&
    evaluation.accessPayoff !== "score_threat"
  ) {
    return false;
  }
  return (
    evaluation.score >= 50 ||
    (evaluation.recommendation === "run_now" &&
      evaluation.pathCost === 0 &&
      evaluation.score > 0) ||
    evaluation.multiaccessAvailable ||
    runnerMatchpointCentralAccess ||
    evaluation.accessPayoff === "agenda" ||
    evaluation.accessPayoff === "score_threat"
  );
}

type RunnerCentralPressureCadence = {
  routeAvailable: boolean;
  evidenceCode: string;
};

function runnerCentralPressureCadence(
  input: AiDecisionInput,
  serverId: "hq" | "rd" | "archives",
): RunnerCentralPressureCadence {
  const available = (evidenceCode: string): RunnerCentralPressureCadence => ({
    routeAvailable: true,
    evidenceCode,
  });
  if (serverId === "archives") {
    return available("runner_central_pressure_cadence_not_required:archives");
  }
  const turnSerial = input.playerView.turnSerial;
  if (!Number.isSafeInteger(turnSerial) || (turnSerial ?? -1) < 0) {
    return {
      routeAvailable: false,
      evidenceCode: `runner_central_pressure_cadence_turn_invalid:${serverId}`,
    };
  }
  if (input.playerView.run !== undefined) {
    return available(`runner_central_pressure_cadence_active_run:${serverId}`);
  }
  const currentTurnSerial = turnSerial as number;
  const history = mergedPublicHistory(input);
  let activeRunServerId: string | undefined;
  let activeRunServerKnown = false;
  let lastAccessIndex = -1;
  let lastValueConversionIndex = -1;
  let targetRunHasAccess = false;
  let unboundAccessObserved = false;
  for (let index = 0; index < history.length; index += 1) {
    const event = history[index]!;
    const actionType =
      typeof event.publicPayload.actionType === "string"
        ? event.publicPayload.actionType
        : event.type;
    const runnerCadenceEvent =
      event.publicPayload.actor === "runner" &&
      (actionType === "start_run" ||
        event.type === "run_started" ||
        actionType === "access_card" ||
        actionType === "steal_agenda" ||
        actionType === "trash_accessed_card" ||
        actionType === "jack_out");
    if (!runnerCadenceEvent) continue;
    if (
      !Number.isSafeInteger(event.turnSerial) ||
      (event.turnSerial ?? -1) < 0
    ) {
      return {
        routeAvailable: false,
        evidenceCode: `runner_central_pressure_cadence_event_turn_invalid:${serverId}:${event.eventId}`,
      };
    }
    if (event.turnSerial !== currentTurnSerial) continue;
    if (actionType === "start_run" || event.type === "run_started") {
      activeRunServerId = serverIdFromEvent(event);
      activeRunServerKnown = activeRunServerId !== undefined;
      targetRunHasAccess = false;
      continue;
    }
    if (actionType === "jack_out") {
      activeRunServerId = undefined;
      activeRunServerKnown = false;
      targetRunHasAccess = false;
      continue;
    }
    if (actionType === "access_card") {
      if (!activeRunServerKnown) {
        unboundAccessObserved = true;
      } else if (activeRunServerId === serverId && !targetRunHasAccess) {
        targetRunHasAccess = true;
        lastAccessIndex = index;
        lastValueConversionIndex = -1;
      }
      continue;
    }
    if (
      (actionType === "steal_agenda" || actionType === "trash_accessed_card") &&
      activeRunServerKnown &&
      activeRunServerId === serverId &&
      targetRunHasAccess
    ) {
      lastValueConversionIndex = index;
    }
  }
  if (unboundAccessObserved) {
    return {
      routeAvailable: false,
      evidenceCode: `runner_central_pressure_cadence_access_unbound:${serverId}:${currentTurnSerial}`,
    };
  }
  if (lastAccessIndex < 0) {
    return available(
      `runner_central_pressure_cadence_first_access:${serverId}:${currentTurnSerial}`,
    );
  }
  if (lastValueConversionIndex > lastAccessIndex) {
    return available(
      `runner_central_pressure_cadence_value_converted:${serverId}:${currentTurnSerial}`,
    );
  }
  for (const event of history.slice(lastAccessIndex + 1)) {
    if (
      corpCentralPressureKnowledgeRefresh(event, serverId, currentTurnSerial)
    ) {
      return available(
        `runner_central_pressure_cadence_refreshed:${serverId}:${event.eventId}`,
      );
    }
  }
  return {
    routeAvailable: false,
    evidenceCode: `runner_central_pressure_cadence_consumed:${serverId}:${currentTurnSerial}`,
  };
}

function corpCentralPressureKnowledgeRefresh(
  event: ReturnType<typeof mergedPublicHistory>[number],
  serverId: "hq" | "rd",
  turnSerial: number,
): boolean {
  if (event.turnSerial !== turnSerial) return false;
  const payload = event.publicPayload;
  const actionType =
    typeof payload.actionType === "string" ? payload.actionType : event.type;
  if (payload.actor !== "corp") return false;
  if (actionType === "draw_card" || actionType === "mandatory_draw") {
    return true;
  }
  if (serverId === "rd") {
    return actionType === "shuffle_stack" || actionType === "reorder_cards";
  }
  return (
    actionType === "install_card" ||
    actionType === "play_operation" ||
    actionType === "discard_card" ||
    (actionType === "resolve_choice" &&
      payload.hiddenZoneAction === "discard_phase")
  );
}

type RunnerRunFundingSupport = {
  needId: string;
  gap: number;
  targetCredits: number;
  priorityClass: "P2" | "P4";
  parentPlanInstanceId: string;
  driver: {
    kind: "run" | "contest";
    targetId: string;
    reasonCode: string;
  };
  routeActionIds: string[];
  routeAssessment: RunnerFundingRouteAssessment;
  evidenceCode: string;
};

function runnerRemoteProbeCanConvertNow(
  input: AiDecisionInput,
  economy: RunnerEconomyPosture,
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  return (
    evaluation.accessTargetKind === "remote" &&
    evaluation.runCommitment === "probe_only" &&
    evaluation.pathPassability === "reachable" &&
    evaluation.score > 0 &&
    evaluation.creditsAfterRun >= 0 &&
    (evaluation.pathCost === 0 ||
      evaluation.creditsAfterRun >= economy.minimumCreditFloor ||
      (evaluation.scoreThreat && input.playerView.opponent.credits <= 1))
  );
}

function runnerRunFundingSupport(
  input: AiDecisionInput,
  economy: RunnerEconomyPosture,
  evaluation: RunnerRunTargetEvaluation,
  runTargets: readonly RunnerRunTargetEvaluation[],
  candidates: readonly ActionSemanticCandidate[],
): RunnerRunFundingSupport | undefined {
  if (
    evaluation.knownAccessState === "known_no_current_payoff" ||
    evaluation.accessTargetKind === "archives" ||
    input.playerView.own.clicks <= 1 ||
    evaluation.score <= 0 ||
    evaluation.recommendation !== "gain_credits_first"
  ) {
    return undefined;
  }
  if (runnerRunTargetCanConvertNow(input, economy, evaluation, candidates)) {
    return undefined;
  }
  const urgentPayoff = runnerRunHasExactUrgency(input, evaluation);
  const requiredPostRunReserve = runnerRunRequiredPostRunReserve(
    input,
    candidates,
    economy,
    evaluation,
  );
  const admission = assessRunnerRunFundingAdmission({
    target: evaluation,
    runTargets,
    economy,
    urgentScoreThreat: urgentPayoff,
    ...(requiredPostRunReserve !== undefined ? { requiredPostRunReserve } : {}),
  });
  if (!admission.admitted) return undefined;
  const gap = admission.concreteFundingGap;
  const remote = evaluation.accessTargetKind === "remote";
  const dedupeKey = remote
    ? `remote:${evaluation.targetServerId}`
    : `central:${evaluation.targetServerId}`;
  const parentModule = remote
    ? "runner.contest_remote"
    : "runner.pressure_central";
  const parentPlanInstanceId = `plan:${parentModule}:${encodeURIComponent(dedupeKey)}`;
  const route = runnerExactFundingRouteContract(input, candidates, {
    demandId: `run-support:${dedupeKey}`,
    sourcePlanId: parentPlanInstanceId,
    purpose: "current_run",
    priority: urgentPayoff
      ? "acute_hard_plan_blocker"
      : "current_foreground_plan",
    hardness: "hard",
    deadline: "end_of_current_turn",
    targetCredits: input.playerView.own.credits + gap,
    remainingClicks: Math.max(0, input.playerView.own.clicks - 1),
    evidence: [
      `runner_run_support_target:${evaluation.targetServerId}`,
      "runner_run_conversion_click_reserved:1",
      admission.reasonCode,
    ],
  });
  return {
    needId: `run-support:${dedupeKey}`,
    gap,
    targetCredits: input.playerView.own.credits + gap,
    priorityClass: urgentPayoff ? "P2" : "P4",
    parentPlanInstanceId,
    driver: {
      kind: remote ? "contest" : "run",
      targetId: evaluation.targetServerId,
      reasonCode: admission.reasonCode,
    },
    ...route,
    evidenceCode: `runner_run_support_fund_concrete_gap:${evaluation.targetServerId}:${admission.reasonCode}`,
  };
}

function runnerRunTargetCanConvertNow(
  input: AiDecisionInput,
  economy: RunnerEconomyPosture,
  evaluation: RunnerRunTargetEvaluation,
  candidates: readonly ActionSemanticCandidate[],
): boolean {
  const requiredPostRunReserve = runnerRunRequiredPostRunReserve(
    input,
    candidates,
    economy,
    evaluation,
  );
  return runnerRunTargetIsDirectlyConvertible({
    target: evaluation,
    economy,
    allowCreditFloorOverride:
      runnerRunCreditFloorOverrideAllowed(input, evaluation) ||
      runnerImmediatePaidAccessConversionCanUseReserve(evaluation),
    ...(requiredPostRunReserve !== undefined ? { requiredPostRunReserve } : {}),
  });
}

function runnerRunCreditFloorOverrideAllowed(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  if (
    runnerFreeCentralInformationRoutePreservesCurrentCredits(input, evaluation)
  )
    return true;
  if (!runnerRunHasExactUrgency(input, evaluation)) return false;
  if (evaluation.accessTargetKind === "remote" && evaluation.scoreThreat) {
    return input.playerView.opponent.credits <= 1;
  }
  return true;
}

function runnerFreeCentralInformationRoutePreservesCurrentCredits(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  const routeQuote = evaluation.routeQuote;
  return (
    (evaluation.accessTargetKind === "hq" ||
      evaluation.accessTargetKind === "rd") &&
    evaluation.pathPassability === "reachable" &&
    evaluation.pathCost === 0 &&
    routeQuote !== undefined &&
    routeQuote.reachability === "guaranteed_access" &&
    routeQuote.fundingGap === 0 &&
    routeQuote.unknownIceCount === 0 &&
    routeQuote.effects.length === 0 &&
    routeQuote.conditionalReasons.length === 0 &&
    (routeQuote.conditionalRiskReasons?.length ?? 0) === 0 &&
    evaluation.creditsAfterRun >= input.playerView.own.credits &&
    evaluation.score > 0 &&
    (evaluation.recommendation === "run_now" ||
      evaluation.recommendation === "run_if_free") &&
    (evaluation.knownAccessState === "unknown" ||
      evaluation.knownAccessState === "fresh") &&
    (evaluation.unknownUnrezzedIceCount ?? 0) === 0 &&
    (evaluation.visibleIceRunHazards?.length ?? 0) === 0 &&
    (evaluation.unavoidableVisibleIceHazardCount ?? 0) === 0 &&
    evaluation.visibleTraceTagHazardUnavoidable !== true
  );
}

function runnerImmediatePaidAccessConversionCanUseReserve(
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  return (
    evaluation.runActionProjection?.sourceKind === "event" &&
    evaluation.multiaccessAvailable &&
    evaluation.pathPassability === "reachable" &&
    evaluation.recommendation === "run_now" &&
    evaluation.knownAccessState !== "known_no_current_payoff" &&
    evaluation.creditsAfterRun >= 0 &&
    (evaluation.routeQuote?.fundingGap ?? 0) === 0
  );
}

function runnerRunRequiredPostRunReserve(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  economy: RunnerEconomyPosture,
  evaluation: RunnerRunTargetEvaluation,
): number | undefined {
  if (
    evaluation.accessTargetKind !== "remote" ||
    evaluation.accessPayoff !== "score_threat" ||
    evaluation.recommendation !== "gain_credits_first" ||
    evaluation.creditsAfterRun >= economy.creditReservePolicy.contestReserve
  ) {
    return undefined;
  }
  const requiredReserve = economy.creditReservePolicy.contestReserve;
  const reserveGap = requiredReserve - evaluation.creditsAfterRun;
  const remainingFundingClicks = Math.max(0, input.playerView.own.clicks - 1);
  if (reserveGap <= 0 || remainingFundingClicks <= 0) return undefined;
  const demand = createRunnerCreditDemand({
    demandId: `run-reserve:${evaluation.actionId}`,
    sourcePlanId: `runner.contest_remote:${evaluation.targetServerId}`,
    purpose: "foreground_plan",
    priority: "current_foreground_plan",
    hardness: "hard",
    deadline: "end_of_current_turn",
    currentCredits: input.playerView.own.credits,
    targetCredits: input.playerView.own.credits + reserveGap,
    evidence: [
      `run_reserve_target:${requiredReserve}`,
      `run_reserve_gap:${reserveGap}`,
    ],
  });
  const routes = searchFundingRoutes({
    demand,
    candidates,
    remainingClicks: remainingFundingClicks,
    maxSteps: remainingFundingClicks,
    maxRoutes: 8,
  });
  const sameTurnReserveRouteExists = routes.routes.some(
    (route) =>
      route.status === "covered_guaranteed" && route.horizon === "same_turn",
  );
  return sameTurnReserveRouteExists ? requiredReserve : undefined;
}

function runnerRunHasExactUrgency(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  const terminalCentralAccess =
    (evaluation.accessTargetKind === "hq" ||
      evaluation.accessTargetKind === "rd") &&
    input.playerView.own.agendaPoints >= input.playerView.agendaPointsToWin - 2;
  return (
    evaluation.scoreThreat ||
    terminalCentralAccess ||
    evaluation.accessPayoff === "agenda" ||
    evaluation.accessPayoff === "score_threat"
  );
}

function runnerRiskAdjustedHandBufferForAttractiveRuns(
  runTargets: readonly RunnerRunTargetEvaluation[],
): { minimumHandBuffer: number; evidenceCode: string } {
  let minimumHandBuffer = 3;
  let evidenceCode = "runner_base_hand_buffer:3";
  let strongestRisk = -1;

  for (const evaluation of runTargets) {
    if (
      evaluation.pathPassability !== "reachable" ||
      !["run_now", "run_if_free"].includes(evaluation.recommendation) ||
      evaluation.score <= 0
    )
      continue;
    const unknownIce = evaluation.unknownUnrezzedIceCount ?? 0;
    const risk = evaluation.unrezzedIceRisk ?? 0;
    if (unknownIce < 2 || risk < 0.75) continue;

    const requiredBuffer =
      evaluation.multiaccessAvailable || unknownIce >= 3 ? 5 : 4;
    if (
      requiredBuffer < minimumHandBuffer ||
      (requiredBuffer === minimumHandBuffer && risk <= strongestRisk)
    )
      continue;

    minimumHandBuffer = requiredBuffer;
    strongestRisk = risk;
    evidenceCode = [
      `runner_high_risk_run_hand_buffer:${requiredBuffer}`,
      `unknown_unrezzed_ice:${unknownIce}`,
      `unrezzed_ice_risk:${risk}`,
      `multiaccess:${evaluation.multiaccessAvailable}`,
      `server:${evaluation.targetServerId}`,
    ].join("|");
  }

  return { minimumHandBuffer, evidenceCode };
}

type RunnerRunLockReleaseRoute = {
  actionId?: string;
  serverId: string;
  terminal: boolean;
  ready: boolean;
  value: number;
  targetCredits: number;
  fundingGap: number;
  supportNeedId?: string;
  parentPlanInstanceId: string;
  evidenceCode: string;
  projectionEvidenceCode: string;
};

function runnerRunLockReleaseRoutes(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  previous: ResidentPlanPortfolio | undefined,
): RunnerRunLockReleaseRoute[] {
  const preferredServerIds = runnerRunLockPreferredServerIds(previous);
  const action = input.legalActions.find(
    (entry) =>
      entry.type === "trigger_ability" &&
      (entry.payload?.abilityId === "pay_to_remove_run_lock" ||
        entry.payload?.v1920RunnerRunLockAbility === "pay_to_remove_run_lock"),
  );
  const projection = runnerRunLockReleaseProjection(
    input,
    action,
    preferredServerIds,
  );
  if (!projection) return [];
  const candidate = action
    ? candidates.find((entry) => entry.actionId === action.actionId)
    : undefined;
  if (action && !candidate) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((entry) => entry.type),
      unresolvedActionIds: [action.actionId],
      owner: "plan_module",
      removalCondition:
        "A legal run-lock release must have an exact semantic candidate before it can be bound to its parent Run plan.",
    });
  }
  const remote = projection.serverId.startsWith("remote_");
  const dedupeKey = remote
    ? `remote:${projection.serverId}`
    : `central:${projection.serverId}`;
  const parentModule = remote
    ? "runner.contest_remote"
    : "runner.pressure_central";
  const supportNeedId =
    projection.status === "blocked_funding"
      ? `run-lock-support:${dedupeKey}`
      : undefined;
  return [
    {
      ...(candidate ? { actionId: candidate.actionId } : {}),
      serverId: projection.serverId,
      terminal: projection.terminal,
      ready: projection.status === "ready",
      value: projection.value,
      targetCredits: projection.targetCredits,
      fundingGap: projection.fundingGap,
      ...(supportNeedId ? { supportNeedId } : {}),
      parentPlanInstanceId: `plan:${parentModule}:${encodeURIComponent(dedupeKey)}`,
      evidenceCode: projection.terminal
        ? "runner_matchpoint_run_lock_release"
        : "runner_viable_followup_run_lock_release",
      projectionEvidenceCode: [
        projection.terminal
          ? "runner_matchpoint_run_lock_release"
          : "runner_viable_followup_run_lock_release",
        `run_lock_release_projection_status:${projection.status}`,
        `run_lock_release_target_credits:${projection.targetCredits}`,
        `run_lock_release_funding_gap:${projection.fundingGap}`,
        ...projection.evidence,
      ].join("|"),
    },
  ];
}

function runnerRunLockPreferredServerIds(
  previous: ResidentPlanPortfolio | undefined,
): string[] {
  const relevant = (previous?.instances ?? []).filter(
    (instance) =>
      (instance.moduleId === "runner.pressure_central" ||
        instance.moduleId === "runner.contest_remote") &&
      instance.target?.kind === "server" &&
      instance.viability !== "completed" &&
      instance.viability !== "abandoned",
  );
  return uniqueBy(
    [
      ...relevant
        .filter(
          (instance) =>
            instance.instanceId === previous?.executorInstanceId ||
            instance.instanceId === previous?.rootForegroundInstanceId,
        )
        .map((instance) => instance.target!.id),
      ...relevant.map((instance) => instance.target!.id),
    ],
    (serverId) => serverId,
  );
}

function accessCommitmentForEvaluation(
  evaluation: RunnerRunTargetEvaluation,
): RunnerRunAccessCommitmentSignal {
  const knownTargetDefinitionIds = evaluation.evidence
    .flatMap((entry) => {
      for (const prefix of [
        "hq_known_trash_definition:",
        "access_decision_projection_known_root:",
      ]) {
        if (entry.startsWith(prefix)) return [entry.slice(prefix.length)];
      }
      return [];
    })
    .filter((entry) => entry.length > 0);
  const trashBudget =
    firstEvidenceNumber(evaluation.evidence, [
      "known_remote_root_general_trash_cost:",
      "hq_known_trash_cost:",
      "known_remote_root_trash_cost:",
      "rnd_known_top_trash_cost:",
      "rnd_known_sequence_trash_cost:",
    ]) ?? 0;
  const intendedAction =
    evaluation.accessPayoff === "agenda" ||
    evaluation.accessPayoff === "score_threat"
      ? "steal"
      : evaluation.accessPayoff === "trash_affordable"
        ? "trash"
        : evaluation.accessPayoff === "trash_unaffordable" ||
            evaluation.accessPayoff === "known_low_value"
          ? "decline"
          : "access";
  return {
    payoff: evaluation.accessPayoff,
    intendedAction,
    knownTargetDefinitionIds: [...new Set(knownTargetDefinitionIds)].sort(),
    trashBudget: Math.max(0, trashBudget),
    evidenceCode:
      evaluation.evidence.find((entry) =>
        entry.startsWith("central_memory_payoff:"),
      ) ??
      evaluation.evidence.find((entry) =>
        entry.startsWith("remote_memory_payoff:"),
      ) ??
      `access_payoff:${evaluation.accessPayoff}`,
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
  const trashCost = trashAction.costs.reduce(
    (sum, cost) => sum + Math.max(0, cost.credits ?? 0),
    0,
  );
  if (
    parentCommitment?.intendedAction === "trash" &&
    accessedDefinitionId &&
    parentCommitment.knownTargetDefinitionIds.includes(accessedDefinitionId) &&
    trashCost <= parentCommitment.trashBudget
  ) {
    return parentCommitment;
  }
  const accessContext = buildRunnerRemoteTrashAccessContext(
    input,
    trashAction,
    economy.desiredCreditReserve,
  );
  if (!accessContext.trashable || !accessedDefinitionId)
    return parentCommitment;
  if (accessContext.affordableRelevant) {
    return {
      payoff: "trash_affordable",
      intendedAction: "trash",
      knownTargetDefinitionIds: [accessedDefinitionId],
      trashBudget: Math.max(0, accessContext.generalCreditCost),
      evidenceCode:
        accessContext.evidence.find((entry) =>
          entry.startsWith("remote_trash_role:"),
        ) ?? "access_window_relevant_trash",
    };
  }
  return {
    payoff: accessContext.deferredByBudget
      ? "trash_unaffordable"
      : "known_low_value",
    intendedAction: "decline",
    knownTargetDefinitionIds: [accessedDefinitionId],
    trashBudget: 0,
    evidenceCode: accessContext.deferredByBudget
      ? "access_window_trash_deferred_by_budget"
      : "access_window_low_value_trash",
  };
}

function firstEvidenceNumber(
  evidence: readonly string[],
  prefixes: readonly string[],
): number | undefined {
  for (const prefix of prefixes) {
    const entry = evidence.find((candidate) => candidate.startsWith(prefix));
    if (!entry) continue;
    const parsed = Number(entry.slice(prefix.length));
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return undefined;
}

function activeRunRootPlan(
  previous: ResidentPlanPortfolio | undefined,
  input: AiDecisionInput,
):
  | {
      instanceId: string;
      purpose?: "access" | "multiaccess" | "information" | "contest";
      encounterCreditSpendLimit?: number;
      accessCommitment?: RunnerRunAccessCommitmentSignal;
    }
  | undefined {
  const serverId = input.playerView.run?.attackedServerId;
  if (!previous || !serverId) return undefined;
  const candidates = [
    previous.instances.find(
      (instance) =>
        instance.instanceId === previous.executorInstanceId &&
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
  return {
    instanceId: root.instanceId,
    ...runOrigin,
    ...(accessCommitment ? { accessCommitment } : {}),
  };
}

function runOriginFromModuleState(moduleState: unknown): {
  purpose?: "access" | "multiaccess" | "information" | "contest";
  encounterCreditSpendLimit?: number;
} {
  if (!moduleState || typeof moduleState !== "object") return {};
  const signal = (moduleState as { signal?: unknown }).signal;
  if (!signal || typeof signal !== "object") return {};
  const purpose = (signal as { purpose?: unknown }).purpose;
  const encounterCreditSpendLimit = (
    signal as { encounterCreditSpendLimit?: unknown }
  ).encounterCreditSpendLimit;
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
  };
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
    !Number.isFinite(commitment.trashBudget)
  ) {
    return undefined;
  }
  return structuredClone(commitment);
}

function runnerRestrictedProgramInstallSequenceCommitment(
  input: AiDecisionInput,
  source: ActionSemanticCandidate,
  _candidates: readonly ActionSemanticCandidate[],
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[],
  economy: RunnerEconomyPosture,
): RunnerRestrictedProgramInstallSequenceCommitment | undefined {
  const projection = source.actionCapacityProjection;
  if (
    projection?.kind !== "immediate_restricted_gain" ||
    projection.restriction !== "program_install_only" ||
    projection.reliability !== "guaranteed" ||
    projection.followupActionCapacity <= 0 ||
    !projection.allowedActionTypes.includes("install_card") ||
    !projection.allowedCardTypes?.includes("program") ||
    !source.sourceCardInstanceId ||
    !source.sourceDefinitionId
  ) {
    return undefined;
  }
  const sourceAction = input.legalActions.find(
    (action) => action.actionId === source.actionId,
  );
  if (!sourceAction) {
    throw new PlanResolutionFailure("stale_or_future_action_reference", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [source.actionId],
      owner: "action_semantics",
      removalCondition:
        "Bind Valu-Pak preflight projection to the exact current LegalAction.",
    });
  }
  const rawTemporaryInstallCredits =
    sourceAction.payload?.actionCapacityTemporaryCredits;
  if (
    typeof rawTemporaryInstallCredits !== "number" ||
    !Number.isFinite(rawTemporaryInstallCredits) ||
    rawTemporaryInstallCredits < 0
  ) {
    throw new PlanResolutionFailure("missing_card_definition", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [source.actionId],
      owner: "rules_contract",
      removalCondition:
        "Define finite non-negative temporary program-install credits for Valu-Pak.",
    });
  }
  const temporaryInstallCredits = Math.max(
    0,
    Math.floor(projection.temporaryCredits ?? 0),
  );
  if (temporaryInstallCredits <= 0) return undefined;

  const options = handDevelopment
    .flatMap((evaluation) => {
      const install = evaluation.persistentInstallEvaluation;
      if (
        install?.cardType === "program" &&
        (!Number.isFinite(install.installCost) ||
          install.installCost < 0 ||
          typeof install.memoryCost !== "number" ||
          !Number.isFinite(install.memoryCost) ||
          install.memoryCost < 0)
      ) {
        throw new PlanResolutionFailure("missing_card_definition", {
          side: input.side,
          stateVersion: input.playerView.stateVersion,
          timingPoint: input.playerView.timingPoint,
          legalActionTypes: input.legalActions.map((action) => action.type),
          unresolvedActionIds: [
            evaluation.legalActionId ?? evaluation.cardInstanceId,
          ],
          owner: "rules_contract",
          removalCondition: `Define finite non-negative install cost and MU for Valu-Pak program target ${evaluation.cardInstanceId}.`,
        });
      }
      const availabilityEligible =
        evaluation.availability === "legal_now" ||
        (evaluation.availability === "missing_credits" &&
          evaluation.fundingNeed !== undefined &&
          evaluation.fundingNeed.missingCredits <= temporaryInstallCredits);
      const deferEligible = [
        "none",
        "missing_credits",
        "preserve_credit_floor",
      ].includes(evaluation.deferReason);
      const memoryCost = Math.max(0, install?.memoryCost ?? 0);
      const currentlyMeaningful =
        evaluation.currentNeed === "acute" ||
        evaluation.currentNeed === "useful_now" ||
        evaluation.currentNeed === "setup";
      if (
        !evaluation.definitionId ||
        !availabilityEligible ||
        !deferEligible ||
        !currentlyMeaningful ||
        evaluation.strategicFit === "blocked" ||
        evaluation.priority <= 0 ||
        !install ||
        install.cardType !== "program" ||
        install.duplicateRole === "redundant_duplicate" ||
        install.finalInstallFit <= 0 ||
        install.installCost < 0
      ) {
        return [];
      }
      return [
        {
          evaluation,
          install,
          installCost: install.installCost,
          memoryCost,
          utility:
            evaluation.priority +
            Math.max(0, install.finalInstallFit) +
            runnerDevelopmentNeedSequenceValue(evaluation.currentNeed),
        },
      ];
    })
    .sort(
      (left, right) =>
        runnerDevelopmentNeedSequenceValue(right.evaluation.currentNeed) -
          runnerDevelopmentNeedSequenceValue(left.evaluation.currentNeed) ||
        right.utility - left.utility ||
        left.evaluation.cardInstanceId.localeCompare(
          right.evaluation.cardInstanceId,
        ),
    );
  if (options.length === 0 || options.length > 20) return undefined;

  const availableMemory = Math.max(
    0,
    (input.playerView.own.memoryLimit ?? 0) -
      (input.playerView.own.memoryUsed ?? 0),
  );
  const minimumHandBuffer =
    runnerDamageThreatAssessment(input).flatlineRisk.recommendedHandFloor;
  const gripCountAfterOpening = Math.max(
    0,
    input.playerView.own.gripOrHq.length - 1,
  );
  const maxTargets = Math.min(
    projection.followupActionCapacity,
    options.length,
  );
  let best:
    | {
        indices: number[];
        count: number;
        utility: number;
        totalCost: number;
        totalMemory: number;
      }
    | undefined;
  for (let mask = 1; mask < 2 ** options.length; mask += 1) {
    const indices: number[] = [];
    for (let index = 0; index < options.length; index += 1) {
      if ((mask & (2 ** index)) !== 0) indices.push(index);
    }
    if (indices.length < 2 || indices.length > maxTargets) continue;
    const totalCost = indices.reduce(
      (sum, index) => sum + options[index]!.installCost,
      0,
    );
    const totalMemory = indices.reduce(
      (sum, index) => sum + options[index]!.memoryCost,
      0,
    );
    const normalCreditsSpent = Math.max(0, totalCost - temporaryInstallCredits);
    if (
      input.playerView.own.credits - normalCreditsSpent <
        economy.minimumCreditFloor ||
      totalMemory > availableMemory ||
      gripCountAfterOpening - indices.length < minimumHandBuffer
    ) {
      continue;
    }
    const utility = indices.reduce(
      (sum, index) => sum + options[index]!.utility,
      0,
    );
    if (
      !best ||
      indices.length > best.count ||
      (indices.length === best.count && utility > best.utility) ||
      (indices.length === best.count &&
        utility === best.utility &&
        totalCost < best.totalCost)
    ) {
      best = {
        indices,
        count: indices.length,
        utility,
        totalCost,
        totalMemory,
      };
    }
  }

  let admissionReason: RunnerRestrictedProgramInstallSequenceCommitment["admissionReason"];
  let selected = best?.indices.map((index) => options[index]!) ?? [];
  if (selected.length >= 2) {
    admissionReason = "multiple_productive_programs";
  } else {
    const acuteBridge = options.find(
      ({ evaluation, installCost, memoryCost }) =>
        evaluation.currentNeed === "acute" &&
        input.playerView.own.credits < installCost &&
        input.playerView.own.credits + temporaryInstallCredits >= installCost &&
        memoryCost <= availableMemory &&
        input.playerView.own.credits -
          Math.max(0, installCost - temporaryInstallCredits) >=
          economy.minimumCreditFloor &&
        gripCountAfterOpening - 1 >= minimumHandBuffer,
    );
    if (!acuteBridge) return undefined;
    selected = [acuteBridge];
    admissionReason = "acute_temporary_credit_bridge";
  }

  let normalCredits = input.playerView.own.credits;
  let temporaryCredits = temporaryInstallCredits;
  let memoryAvailable = availableMemory;
  let gripCount = gripCountAfterOpening;
  const targetSteps: RunnerRestrictedProgramInstallSequenceStep[] =
    selected.map(({ evaluation, install, installCost, memoryCost }, index) => {
      const temporarySpent = Math.min(temporaryCredits, installCost);
      temporaryCredits -= temporarySpent;
      normalCredits -= installCost - temporarySpent;
      memoryAvailable -= memoryCost;
      gripCount -= 1;
      return {
        order: index + 1,
        cardInstanceId: evaluation.cardInstanceId,
        definitionId: evaluation.definitionId!,
        installCost,
        memoryCost,
        projectedRunnerCreditsAfter: normalCredits,
        projectedMemoryAvailableAfter: memoryAvailable,
        projectedGripCountAfter: gripCount,
        purposeCode: `${evaluation.developmentRole}:${evaluation.currentNeed}`,
        evidenceCode:
          evaluation.evidence[0] ?? "runner_program_install_sequence_target",
      };
    });

  return {
    kind: "restricted_program_install_sequence",
    sourceActionId: source.actionId,
    sourceCardInstanceId: source.sourceCardInstanceId,
    sourceDefinitionId: source.sourceDefinitionId,
    plannedAtStateVersion: input.playerView.stateVersion,
    runnerCreditsBeforeOpening: input.playerView.own.credits,
    grantedActionCount: projection.followupActionCapacity,
    temporaryInstallCredits,
    minimumCreditFloor: economy.minimumCreditFloor,
    minimumHandBuffer,
    ordinaryClicksAfterOpening: Math.max(
      0,
      input.playerView.own.clicks - projection.preExistingActionCost,
    ),
    targetSteps,
    admissionReason,
    evidenceCodes: [
      `runner_restricted_program_sequence:${admissionReason}`,
      `runner_restricted_program_sequence_targets:${targetSteps
        .map((step) => step.definitionId)
        .join(",")}`,
      `runner_restricted_program_sequence_total_install_cost:${targetSteps.reduce(
        (sum, step) => sum + step.installCost,
        0,
      )}`,
      `runner_restricted_program_sequence_temporary_credits:${temporaryInstallCredits}`,
      `runner_restricted_program_sequence_credit_floor:${economy.minimumCreditFloor}`,
      `runner_restricted_program_sequence_hand_floor:${minimumHandBuffer}`,
      `runner_restricted_program_sequence_ordinary_clicks_after_opening:${Math.max(
        0,
        input.playerView.own.clicks - projection.preExistingActionCost,
      )}`,
    ],
  };
}

function runnerDevelopmentNeedSequenceValue(
  need: RunnerHandDevelopmentEvaluation["currentNeed"],
): number {
  switch (need) {
    case "acute":
      return 4_000;
    case "useful_now":
      return 2_000;
    case "setup":
      return 1_000;
    case "later":
      return 200;
    default:
      return 0;
  }
}

function activeRestrictedProgramInstallActions(
  input: AiDecisionInput,
): AiDecisionInput["legalActions"] {
  return input.legalActions.filter(
    (action) =>
      action.payload?.actionCapacityRestriction === "program_install_only" &&
      action.payload?.actionCapacityAllowedActionType === "install_card" &&
      action.payload?.actionCapacityAllowedCardType === "program" &&
      action.payload?.actionCapacityReliability === "guaranteed" &&
      action.payload?.restrictedActionGrantActionType === "install_card" &&
      action.payload?.restrictedActionGrantCostProfile ===
        "temporary_credit_bundle" &&
      Number(action.payload?.restrictedActionGrantRemainingActions) > 0,
  );
}

function restrictedProgramInstallCommitmentFromPortfolio(
  previous: ResidentPlanPortfolio | undefined,
): RunnerRestrictedProgramInstallSequenceCommitment | undefined {
  if (!previous?.executorInstanceId) return undefined;
  const activeExecutors = previous.instances.filter(
    (instance) => instance.executionState === "executor",
  );
  if (
    activeExecutors.length !== 1 ||
    activeExecutors[0]?.instanceId !== previous.executorInstanceId
  ) {
    return undefined;
  }
  const executor = activeExecutors[0];
  if (
    !executor ||
    executor.moduleId !== "runner.develop_board_and_hand" ||
    executor.viability !== "ready"
  ) {
    return undefined;
  }
  const moduleState = executor.moduleState;
  if (!moduleState || typeof moduleState !== "object") return undefined;
  const signal = (
    moduleState as {
      signal?: {
        phase?: string;
        restrictedProgramInstallCommitment?: RunnerRestrictedProgramInstallSequenceCommitment;
      };
    }
  ).signal;
  if (
    !signal ||
    ![
      "open_restricted_sequence",
      "execute_restricted_sequence",
      "complete_restricted_sequence",
    ].includes(signal.phase ?? "")
  ) {
    return undefined;
  }
  const commitment = signal.restrictedProgramInstallCommitment;
  if (
    commitment?.kind !== "restricted_program_install_sequence" ||
    commitment.targetSteps.length === 0 ||
    !restrictedProgramInstallCommitmentHasFiniteResources(commitment)
  ) {
    return undefined;
  }
  return structuredClone(commitment);
}

function restrictedProgramInstallCommitmentHasFiniteResources(
  commitment: RunnerRestrictedProgramInstallSequenceCommitment,
): boolean {
  return (
    Number.isFinite(commitment.temporaryInstallCredits) &&
    commitment.temporaryInstallCredits >= 0 &&
    commitment.targetSteps.every(
      (step) =>
        Number.isFinite(step.installCost) &&
        step.installCost >= 0 &&
        Number.isFinite(step.memoryCost) &&
        step.memoryCost >= 0,
    )
  );
}

function runnerRestrictedProgramInstallSequenceProgress(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  previous: ResidentPlanPortfolio | undefined,
):
  | {
      commitment: RunnerRestrictedProgramInstallSequenceCommitment;
      completedCount: number;
      candidate: ActionSemanticCandidate;
      phase: "execute_restricted_sequence" | "complete_restricted_sequence";
    }
  | undefined {
  const restrictedActions = activeRestrictedProgramInstallActions(input);
  if (restrictedActions.length === 0) return undefined;
  const commitment = restrictedProgramInstallCommitmentFromPortfolio(previous);
  if (!commitment) {
    throw runnerRestrictedSequenceFailure(
      input,
      "The active program-install bundle requires the exact preflight commitment that opened it.",
      restrictedActions.map((action) => action.actionId),
    );
  }
  if (commitment.plannedAtStateVersion >= input.playerView.stateVersion) {
    throw runnerRestrictedSequenceFailure(
      input,
      "A restricted install commitment must predate the active sequence state.",
      restrictedActions.map((action) => action.actionId),
    );
  }
  const gripIds = new Set(
    input.playerView.own.gripOrHq.map((card) => card.instanceId),
  );
  const rigIds = new Set(
    (input.playerView.own.rig ?? []).map((card) => card.instanceId),
  );
  let completedCount = 0;
  let remainingSeen = false;
  for (const step of commitment.targetSteps) {
    if (rigIds.has(step.cardInstanceId)) {
      if (remainingSeen) {
        throw runnerRestrictedSequenceFailure(
          input,
          "Committed Valu-Pak targets must be installed in their planned order.",
          restrictedActions.map((action) => action.actionId),
        );
      }
      completedCount += 1;
      continue;
    }
    if (gripIds.has(step.cardInstanceId)) {
      remainingSeen = true;
      continue;
    }
    throw runnerRestrictedSequenceFailure(
      input,
      "Every incomplete Valu-Pak target must remain visible in grip until its committed install step.",
      restrictedActions.map((action) => action.actionId),
    );
  }

  const nextStep = commitment.targetSteps[completedCount];
  const candidate = nextStep
    ? candidates.find(
        (entry) =>
          entry.actionType === "install_card" &&
          entry.sourceCardInstanceId === nextStep.cardInstanceId &&
          restrictedActions.some(
            (action) => action.actionId === entry.actionId,
          ),
      )
    : candidates.find(
        (entry) =>
          entry.actionType === "stop_restricted_action_sequence" &&
          restrictedActions.some(
            (action) => action.actionId === entry.actionId,
          ),
      );
  if (!candidate) {
    throw runnerRestrictedSequenceFailure(
      input,
      nextStep
        ? "The next committed Valu-Pak program must have an exact restricted install action."
        : "A completed Valu-Pak commitment requires an exact sequence-stop action.",
      restrictedActions.map((action) => action.actionId),
    );
  }
  return {
    commitment,
    completedCount,
    candidate,
    phase: nextStep
      ? "execute_restricted_sequence"
      : "complete_restricted_sequence",
  };
}

function assertRunnerRestrictedProgramInstallCommitment(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  previous: ResidentPlanPortfolio | undefined,
): void {
  runnerRestrictedProgramInstallSequenceProgress(input, candidates, previous);
}

function runnerRestrictedProgramInstallSequenceSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  previous: ResidentPlanPortfolio | undefined,
): RunnerPlanDomain["developments"] {
  const progress = runnerRestrictedProgramInstallSequenceProgress(
    input,
    candidates,
    previous,
  );
  if (!progress) return [];
  const nextStep = progress.commitment.targetSteps[progress.completedCount];
  return [
    {
      developmentId: `card:${progress.commitment.sourceCardInstanceId}`,
      definitionId: progress.commitment.sourceDefinitionId,
      targetKind: "capability",
      phase: progress.phase,
      purposeCode: nextStep
        ? `install_committed_program:${nextStep.definitionId}`
        : "complete_committed_program_install_sequence",
      assignedDomainPlanIds: [],
      duplicateAlreadyInstalled: false,
      affordableOrSupportable: true,
      semanticActionTypes: [progress.candidate.semanticActionType],
      actionIds: [progress.candidate.actionId],
      priorityClass: "P3",
      value: 1_000 - progress.completedCount,
      evidenceCode: nextStep
        ? `runner_restricted_program_sequence_next:${nextStep.definitionId}`
        : "runner_restricted_program_sequence_commitment_completed",
      evidenceCodes: [
        ...progress.commitment.evidenceCodes,
        `runner_restricted_program_sequence_completed_steps:${progress.completedCount}`,
      ],
      restrictedProgramInstallCommitment: progress.commitment,
    },
  ];
}

function runnerRestrictedSequenceFailure(
  input: AiDecisionInput,
  removalCondition: string,
  unresolvedActionIds: string[],
): PlanResolutionFailure {
  return new PlanResolutionFailure("commitment_invalidated", {
    side: input.side,
    stateVersion: input.playerView.stateVersion,
    timingPoint: input.playerView.timingPoint,
    legalActionTypes: input.legalActions.map((action) => action.type),
    unresolvedActionIds,
    owner: "continuation",
    removalCondition,
    planInstanceId:
      "plan:runner.develop_board_and_hand:restricted_program_install_sequence",
  });
}

function restrictedActionCapacityHasProductiveFollowup(
  source: ActionSemanticCandidate,
  candidates: readonly ActionSemanticCandidate[],
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[],
  runTargets: readonly RunnerRunTargetEvaluation[],
  developments?: readonly RunnerPlanDomain["developments"][number][],
): boolean {
  const projection = source.actionCapacityProjection;
  if (
    projection?.kind !== "immediate_restricted_gain" ||
    projection.followupActionCapacity <= 0
  )
    return true;
  if (projection.restriction === "program_install_only") {
    return (
      developments?.some(
        (signal) =>
          signal.phase === "open_restricted_sequence" &&
          signal.actionIds.includes(source.actionId) &&
          signal.restrictedProgramInstallCommitment !== undefined,
      ) === true
    );
  }
  const allowedActionTypes = new Set(projection.allowedActionTypes);
  return candidates.some((candidate) => {
    if (
      candidate.actionId === source.actionId ||
      !allowedActionTypes.has(candidate.actionType)
    )
      return false;
    if (candidate.semanticActionType === "install.card") {
      const evaluation = handDevelopment.find(
        (entry) =>
          entry.legalActionId === candidate.actionId ||
          (entry.definitionId !== undefined &&
            entry.definitionId === candidate.sourceDefinitionId),
      );
      return (
        evaluation?.availability === "legal_now" &&
        evaluation.deferReason === "none" &&
        evaluation.priority > 0 &&
        evaluation.persistentInstallEvaluation?.duplicateRole !==
          "redundant_duplicate" &&
        (evaluation.persistentInstallEvaluation?.finalInstallFit ?? 0) >= 0
      );
    }
    if (candidate.semanticActionType === "run.start") {
      const serverId = candidate.runProjectionSummary?.serverId;
      return runTargets.some(
        (evaluation) =>
          evaluation.targetServerId === serverId &&
          evaluation.pathPassability === "reachable" &&
          evaluation.score > 0,
      );
    }
    return false;
  });
}

function corpContext(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  previous: ResidentPlanPortfolio | undefined,
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
  const baseDomain = buildCorpDomain(input, sourceBoundCandidates, previous);
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
  const actionDispositions = corpActionDispositions(
    input,
    sourceBoundCandidates,
    arbitratedDomain,
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

function corpHandDomainRouteClaims(
  domain: CorpPlanDomain,
): CorpHandDomainRouteClaimInput[] {
  const claims: CorpHandDomainRouteClaimInput[] = [];
  const add = (claim: {
    ownerModuleId: `corp.${string}`;
    dedupeKey: string;
    actionIds?: readonly string[];
    sourceInstanceIds?: readonly (string | undefined)[];
    readiness: CorpHandDomainRouteClaimInput["readiness"];
    evidenceCode: string;
    parentNeedId?: string;
  }) => {
    claims.push({
      ownerModuleId: claim.ownerModuleId,
      planInstanceId: planInstanceIdForProposal({
        moduleId: claim.ownerModuleId,
        dedupeKey: claim.dedupeKey,
      }),
      ...(claim.parentNeedId ? { parentNeedId: claim.parentNeedId } : {}),
      readiness: claim.readiness,
      actionIds: [...new Set(claim.actionIds ?? [])].sort(),
      sourceInstanceIds: [
        ...new Set(
          (claim.sourceInstanceIds ?? []).filter(
            (instanceId): instanceId is string => Boolean(instanceId),
          ),
        ),
      ].sort(),
      evidenceCode: claim.evidenceCode,
    });
  };

  for (const signal of domain.scoreProjects) {
    const actionIds = signal.actionIds ?? [];
    add({
      ownerModuleId: "corp.score_agenda",
      dedupeKey: signal.projectId,
      actionIds,
      sourceInstanceIds: [
        signal.agendaInstanceId,
        signal.setupNeed?.sourceCardInstanceId,
        signal.counterBank?.sourceCardInstanceId,
      ],
      readiness:
        signal.feasible && actionIds.length > 0
          ? "executable_now"
          : (signal.fundingGap ?? 0) > 0
            ? "executable_with_support"
            : "blocked",
      evidenceCode: signal.evidenceCode,
      ...(signal.setupNeed?.needId
        ? { parentNeedId: signal.setupNeed.needId }
        : {}),
    });
  }
  for (const signal of domain.economyNeeds) {
    const sourceInstanceId =
      "sourceInstanceId" in signal ? signal.sourceInstanceId : undefined;
    const supportRequired = "gap" in signal && signal.gap > 0;
    add({
      ownerModuleId: "corp.economy",
      dedupeKey: signal.needId,
      actionIds: signal.actionIds,
      sourceInstanceIds: [sourceInstanceId],
      readiness:
        signal.actionIds.length > 0
          ? "executable_now"
          : supportRequired
            ? "executable_with_support"
            : "blocked",
      evidenceCode: signal.evidenceCode,
      ...("parentNeedId" in signal && signal.parentNeedId
        ? { parentNeedId: signal.parentNeedId }
        : {}),
    });
  }
  for (const signal of domain.defenseNeeds) {
    const actionIds =
      signal.kind === "generic" ? (signal.actionIds ?? []) : [signal.actionId];
    const sourceInstanceId =
      signal.kind === "score_protection_install" ||
      signal.kind === "score_protection_staging_install"
        ? signal.sourceCardInstanceId
        : undefined;
    add({
      ownerModuleId: "corp.defend_servers",
      dedupeKey: "server-defense-portfolio",
      actionIds,
      sourceInstanceIds: [sourceInstanceId],
      readiness: actionIds.length > 0 ? "executable_now" : "blocked",
      evidenceCode: signal.evidenceCode,
      ...(signal.kind !== "generic"
        ? { parentNeedId: signal.parentNeedId }
        : {}),
    });
  }
  for (const signal of domain.punishCampaigns) {
    const actionIds = [
      ...(signal.actionIds ?? []),
      ...(signal.routeContract?.currentHeadActionId
        ? [signal.routeContract.currentHeadActionId]
        : []),
    ];
    add({
      ownerModuleId: "corp.punish_campaign",
      dedupeKey: signal.campaignId,
      actionIds,
      readiness:
        signal.feasible && actionIds.length > 0
          ? "executable_now"
          : signal.routeContract && signal.routeContract.fundingGap > 0
            ? "executable_with_support"
            : "blocked",
      evidenceCode: signal.evidenceCode,
      ...(signal.routeContract?.executionNeedId
        ? { parentNeedId: signal.routeContract.executionNeedId }
        : {}),
    });
  }
  for (const signal of domain.ambushes) {
    add({
      ownerModuleId: "corp.ambush_and_bluff",
      dedupeKey: signal.ambushId,
      actionIds: signal.actionIds,
      sourceInstanceIds: [signal.sourceInstanceId],
      readiness:
        signal.actionIds.length > 0 && signal.affordableOrSupportable
          ? "executable_now"
          : !signal.affordableOrSupportable
            ? "executable_with_support"
            : "blocked",
      evidenceCode: signal.evidenceCode,
    });
  }
  for (const signal of domain.handManagement) {
    const actionIds = signal.actionIds ?? [];
    add({
      ownerModuleId: "corp.hand_and_agenda_management",
      dedupeKey: signal.handPlanId,
      actionIds,
      sourceInstanceIds: [signal.sourceInstanceId],
      readiness:
        signal.routeAllowed === false
          ? "blocked"
          : actionIds.length > 0
            ? "executable_now"
            : "blocked",
      evidenceCode: signal.evidenceCode,
      ...(signal.parentNeedId ? { parentNeedId: signal.parentNeedId } : {}),
    });
  }
  return claims;
}

function arbitrateCorpHandConversionBeforeDraw(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  domain: CorpPlanDomain,
  facts: CorpHandInventoryFacts,
): CorpPlanDomain {
  const releaseRoutes = corpExactHandCapacityReleaseRoutes(
    input,
    candidates,
    domain,
    facts,
  );
  const assessments: CorpDrawAdmissionAssessment[] = [];
  const assess = (params: {
    routeId: string;
    ownerModuleId: CorpDrawAdmissionAssessment["ownerModuleId"];
    actionId: string;
    purpose: CorpDrawAdmissionAssessment["purpose"];
    priorityClass: CorpDrawAdmissionPriority;
    remainingAttempts: 0 | 1;
    parentProvidesExactSameTurnCapacityRelease?: boolean;
  }) => {
    const candidate = candidates.find(
      (entry) => entry.actionId === params.actionId,
    );
    const assessment = assessCorpDrawAdmission({
      ...params,
      handSize: facts.pressure.handSize,
      maximumHandSize: facts.pressure.maximumHandSize,
      currentClicks: input.playerView.own.clicks,
      drawProjection: candidate
        ? exactCurrentCorpDrawAdmissionProjection(input, candidate)
        : undefined,
      capacityReleaseRoutes: releaseRoutes,
      parentProvidesExactSameTurnCapacityRelease:
        params.parentProvidesExactSameTurnCapacityRelease ?? false,
    });
    assessments.push(assessment);
    return assessment.disposition === "admitted";
  };

  const defenseNeeds: CorpPlanDomain["defenseNeeds"] =
    domain.defenseNeeds.flatMap((signal): CorpPlanDomain["defenseNeeds"] => {
      if (signal.kind === "score_protection_draw") {
        return assess({
          routeId: signal.defenseId,
          ownerModuleId: "corp.defend_servers",
          actionId: signal.actionId,
          purpose: "score_defense_answer_search",
          priorityClass: signal.delegatedPriorityClass,
          remainingAttempts: signal.drawAttemptState.remainingAttempts,
          parentProvidesExactSameTurnCapacityRelease:
            signal.cleanupReplacementDraw === true,
        })
          ? [signal]
          : [];
      }
      if (
        signal.kind !== "generic" ||
        signal.phase !== "draw_for_ice" ||
        !signal.actionIds ||
        signal.actionIds.length === 0
      ) {
        return [signal];
      }
      const admittedActionIds = signal.actionIds.filter((actionId) =>
        assess({
          routeId: `${signal.defenseId}:${actionId}`,
          ownerModuleId: "corp.defend_servers",
          actionId,
          purpose: "central_defense_answer_search",
          priorityClass: corpGenericDefensePriorityClass([signal]),
          remainingAttempts: signal.drawAttemptState?.remainingAttempts ?? 0,
        }),
      );
      return [{ ...signal, actionIds: admittedActionIds }];
    });
  const handManagement = domain.handManagement.map((signal) => {
    if (
      signal.phase !== "draw_for_plan" ||
      !signal.actionIds ||
      signal.actionIds.length === 0
    ) {
      return signal;
    }
    const priorityClass = corpEffectiveHandPriorityClass(domain, signal);
    const admittedActionIds = signal.actionIds.filter((actionId) =>
      assess({
        routeId: `${signal.handPlanId}:${actionId}`,
        ownerModuleId: "corp.hand_and_agenda_management",
        actionId,
        purpose: "score_material_search",
        priorityClass,
        remainingAttempts: signal.drawAttemptState?.remainingAttempts ?? 0,
      }),
    );
    return { ...signal, actionIds: admittedActionIds };
  });
  return {
    ...domain,
    defenseNeeds,
    handManagement,
    drawArbitrations: assessments.sort(
      (left, right) =>
        left.routeId.localeCompare(right.routeId) ||
        left.actionId.localeCompare(right.actionId),
    ),
  };
}

function corpExactHandCapacityReleaseRoutes(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  domain: CorpPlanDomain,
  facts: CorpHandInventoryFacts,
): CorpDrawCapacityReleaseRoute[] {
  const routesByActionId = new Map<
    string,
    Omit<CorpDrawCapacityReleaseRoute, "clickCost" | "netHandDelta">
  >();
  for (const signal of domain.economyNeeds) {
    const priorityClass = corpEconomyPriorityClass(signal);
    const withinClassValue =
      signal.kind === "convert_immediate_operation"
        ? signal.conversion.netLiquidCreditGain * 20 +
          signal.conversion.cardsDrawn * 20
        : signal.kind === "prepare_immediate_operation"
          ? 50 + signal.futureConversion.strategicEconomyValue * 10
          : 0;
    for (const actionId of signal.actionIds) {
      routesByActionId.set(actionId, {
        actionId,
        priorityClass,
        withinClassValue,
      });
    }
  }
  for (const signal of domain.handManagement) {
    const priorityClass = corpEffectiveHandPriorityClass(domain, signal);
    for (const actionId of signal.actionIds ?? []) {
      if (routesByActionId.has(actionId)) continue;
      routesByActionId.set(actionId, {
        actionId,
        priorityClass,
        withinClassValue: signal.value,
      });
    }
  }
  return facts.records
    .flatMap((record) => record.actionHandDeltas)
    .flatMap((delta) => {
      if (delta.netHandDelta >= 0) return [];
      const route = routesByActionId.get(delta.actionId);
      const candidate = candidates.find(
        (entry) => entry.actionId === delta.actionId,
      );
      const legalActionCurrent = input.legalActions.some(
        (action) =>
          action.actionId === delta.actionId &&
          action.expiresAtStateVersion === input.playerView.stateVersion,
      );
      if (
        !route ||
        !candidate ||
        !legalActionCurrent ||
        candidate.costProfile.costKnownStatus !== "known" ||
        candidate.costProfile.additionalCosts.length > 0 ||
        !Number.isSafeInteger(candidate.costProfile.clickCost) ||
        (candidate.costProfile.clickCost ?? 0) <= 0
      ) {
        return [];
      }
      return [
        {
          ...route,
          clickCost: candidate.costProfile.clickCost!,
          netHandDelta: delta.netHandDelta,
        },
      ];
    })
    .sort(
      (left, right) =>
        left.priorityClass.localeCompare(right.priorityClass) ||
        left.actionId.localeCompare(right.actionId),
    );
}

function corpEffectiveHandPriorityClass(
  domain: CorpPlanDomain,
  signal: CorpPlanDomain["handManagement"][number],
): CorpDrawAdmissionPriority {
  if (signal.parentPlanInstanceId) {
    const parent = domain.scoreProjects.find(
      (project) =>
        planInstanceIdForProposal({
          moduleId: "corp.score_agenda",
          dedupeKey: project.projectId,
        }) === signal.parentPlanInstanceId,
    );
    if (parent) return corpScorePriorityClass(parent);
  }
  return corpHandPriorityClass(signal);
}

function exactCurrentCorpDrawAdmissionProjection(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
):
  | {
      cardsDrawn: number;
      netHandDelta: number;
      clickCost: number;
    }
  | undefined {
  if (exactCurrentBasicCorpDrawCandidate(input, candidate)) {
    return { cardsDrawn: 1, netHandDelta: 1, clickCost: 1 };
  }
  const projection = candidate.economyProjection;
  if (
    !exactCurrentCorpScoreMaterialDrawCandidate(input, candidate) ||
    projection?.source !== "legal_action_payload" ||
    projection.reliability !== "guaranteed" ||
    projection.confidence !== "high" ||
    !Number.isSafeInteger(projection.cardsDrawn) ||
    (projection.cardsDrawn ?? 0) <= 0 ||
    !Number.isSafeInteger(projection.netHandDelta) ||
    (projection.netHandDelta ?? -1) < 0 ||
    !Number.isSafeInteger(candidate.costProfile.clickCost) ||
    (candidate.costProfile.clickCost ?? 0) <= 0
  ) {
    return undefined;
  }
  return {
    cardsDrawn: projection.cardsDrawn!,
    netHandDelta: projection.netHandDelta,
    clickCost: candidate.costProfile.clickCost!,
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

function corpActionDispositions(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  domain: CorpPlanDomain,
): PlanActionDisposition[] {
  const dispositions: PlanActionDisposition[] = [];
  const add = (
    actionId: string,
    ownerModuleId: PlanActionDisposition["ownerModuleId"],
    evidenceCode: string,
  ) => {
    dispositions.push({
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
    dispositions.push({
      actionId,
      disposition: "assessment_unknown",
      ownerModuleId,
      evidenceCode,
    });
  };
  const defenseActionDispositions = new Map(
    corpDefenseActionDispositions(
      {
        input,
        actionCandidates: candidates,
        turnKey: turnKey(input),
        domain,
      },
      domain.defenseNeeds,
      domain.centralDefenseAllocation,
    ).map((disposition) => [disposition.actionId, disposition.evidenceCode]),
  );
  const exactBasicCreditActionIds = candidates
    .filter((candidate) =>
      corpExactCurrentBasicLiquidCreditCandidate(input, candidate),
    )
    .map((candidate) => candidate.actionId);
  for (const candidate of candidates) {
    const drawArbitrations = (domain.drawArbitrations ?? []).filter(
      (assessment) => assessment.actionId === candidate.actionId,
    );
    if (
      drawArbitrations.length > 0 &&
      drawArbitrations.every(
        (assessment) => assessment.disposition !== "admitted",
      )
    ) {
      const assessment = drawArbitrations[0]!;
      const evidenceCode = `corp_draw_admission:${assessment.disposition}:${assessment.purpose}`;
      if (assessment.disposition === "blocked_unknown_projection") {
        addUnknown(candidate.actionId, assessment.ownerModuleId, evidenceCode);
      } else {
        add(candidate.actionId, assessment.ownerModuleId, evidenceCode);
      }
      continue;
    }
    const emptyRdOperationEvidence =
      corpEmptyRdDrawOperationDispositionEvidence(input, candidate);
    if (emptyRdOperationEvidence) {
      add(candidate.actionId, "corp.economy", emptyRdOperationEvidence);
      continue;
    }
    if (
      corpRemoteCreationLockRemovalAction(input, candidate) &&
      !domain.scoreProjects.some(
        (signal) =>
          signal.feasible &&
          signal.actionIds?.includes(candidate.actionId) === true,
      )
    ) {
      add(
        candidate.actionId,
        "corp.score_agenda",
        "corp_remote_creation_lock_removal_has_no_bound_score_parent",
      );
      continue;
    }
    if (
      candidate.actionType === "play_operation" &&
      candidate.actionCapacityProjection?.kind === "future_recurring_gain"
    ) {
      add(
        candidate.actionId,
        "corp.economy",
        "corp_future_recurring_action_capacity_has_no_bound_parent_plan",
      );
      continue;
    }
    if (
      candidate.sourceKind === "basic_action" &&
      candidate.semanticActionType === "economy.gain_credit" &&
      candidate.actionType === "gain_credit"
    ) {
      if (
        exactBasicCreditActionIds.length !== 1 ||
        exactBasicCreditActionIds[0] !== candidate.actionId
      ) {
        if (
          !corpOpenEconomyPlanOwnsAction(domain, candidate.actionId) &&
          !corpExactExecutableNonEconomyPlanOwnsAction(domain, candidate)
        ) {
          addUnknown(
            candidate.actionId,
            "corp.economy",
            "corp_basic_credit_assessment_unknown:incomplete_exact_liquid_projection",
          );
        }
      }
      continue;
    }
    if (
      corpEconomyActionIsOwned(candidate) &&
      !corpOpenEconomyPlanOwnsAction(domain, candidate.actionId) &&
      !corpExactExecutableNonEconomyPlanOwnsAction(domain, candidate)
    ) {
      add(
        candidate.actionId,
        "corp.economy",
        "corp_immediate_liquid_route_has_no_open_need_or_exact_plan",
      );
      continue;
    }
    if (
      candidate.semanticActionType === "corp_window.rez" &&
      corpCandidateIsImmediateRootRezEconomySource(candidate) &&
      !corpOpenEconomyPlanOwnsAction(domain, candidate.actionId)
    ) {
      const action = input.legalActions.find(
        (legalAction) => legalAction.actionId === candidate.actionId,
      );
      const outcome = action
        ? rootRezCreditOutcomeProjectionStatus(candidate, action)
        : {
            status: "missing" as const,
            evidenceCode: "corp_root_rez_credit_outcome_quote_missing",
          };
      if (outcome.status !== "guaranteed_positive") {
        add(
          candidate.actionId,
          "corp.economy",
          outcome.status === "not_applicable"
            ? "corp_root_rez_credit_outcome_quote_malformed_or_stale"
            : outcome.evidenceCode,
        );
        continue;
      }
    }
    if (
      candidate.semanticActionType === "corp_window.rez" &&
      candidate.actionType === "rez_card" &&
      !corpOpenEconomyPlanOwnsAction(domain, candidate.actionId) &&
      !corpExactExecutableNonEconomyPlanOwnsAction(domain, candidate)
    ) {
      add(
        candidate.actionId,
        "corp.economy",
        "corp_root_rez_has_no_exact_engine_certified_economy_or_defense_route",
      );
      continue;
    }
    const exactScoreProjectOwnsAdvance =
      candidate.semanticActionType === "score.advance_card" &&
      domain.scoreProjects.some(
        (signal) =>
          signal.feasible &&
          signal.actionIds?.includes(candidate.actionId) === true,
      );
    const ambushAdvanceDisposition = exactScoreProjectOwnsAdvance
      ? undefined
      : corpAmbushAdvanceDispositionEvidence(candidate, domain.ambushes);
    if (ambushAdvanceDisposition) {
      add(
        candidate.actionId,
        "corp.ambush_and_bluff",
        ambushAdvanceDisposition,
      );
      continue;
    }
    if (
      (candidate.semanticActionType === "corp_window.decline_rez" ||
        candidate.actionType === "decline_rez") &&
      domain.defenseNeeds.some(
        (signal) =>
          signal.phase === "rez_response" &&
          signal.rezWindowVerdict === "productive" &&
          (signal.actionIds?.length ?? 0) > 0,
      )
    ) {
      add(
        candidate.actionId,
        "corp.defend_servers",
        "corp_decline_rez_rejected_for_exact_productive_rez_route",
      );
      continue;
    }
    if (candidate.semanticActionType === "corp_window.rez") {
      const rejectedRezSignal = domain.defenseNeeds.find(
        (signal) =>
          signal.kind === "generic" &&
          signal.phase === "rez_response" &&
          signal.rezWindowVerdict === "nonproductive" &&
          corpDefenseSignalOwnsAction(signal, candidate.actionId),
      );
      if (rejectedRezSignal) {
        add(
          candidate.actionId,
          "corp.defend_servers",
          `corp_rez_rejected_by_exact_window_assessment:${rejectedRezSignal.evidenceCode}`,
        );
        continue;
      }
    }
    if (candidate.semanticActionType === "card_ability.trigger") {
      const scoredAgendaRevealDisposition =
        corpScoredAgendaRevealWithoutPurposeDispositionEvidence(
          input,
          candidate,
        );
      if (scoredAgendaRevealDisposition) {
        add(
          candidate.actionId,
          "corp.hand_and_agenda_management",
          scoredAgendaRevealDisposition,
        );
        continue;
      }
      const runDefenseAbility = corpRunDefenseAbilityAssessment(
        input,
        candidate,
      );
      if (
        runDefenseAbility &&
        !runDefenseAbility.productive &&
        !domain.defenseNeeds.some((signal) =>
          corpDefenseSignalOwnsAction(signal, candidate.actionId),
        )
      ) {
        add(
          candidate.actionId,
          "corp.defend_servers",
          runDefenseAbility.evidenceCode,
        );
        continue;
      }
    }
    if (corpExactOverflowHandConversionPlanOwnsCandidate(domain, candidate)) {
      continue;
    }
    const defenseActionDisposition = defenseActionDispositions.get(
      candidate.actionId,
    );
    const globalDefenseInstallAssessment = candidateIsVisibleCorpIceInstall(
      input,
      candidate,
    )
      ? candidateTargetIds(candidate)
          .filter(isCorpInstallServerId)
          .map((serverId) =>
            corpGlobalDefenseInstallRouteAssessment(
              input,
              candidate,
              serverId,
              domain.centralDefenseAllocation,
            ),
          )[0]
      : undefined;
    if (globalDefenseInstallAssessment?.knowledge === "unknown") {
      addUnknown(
        candidate.actionId,
        "corp.defend_servers",
        globalDefenseInstallAssessment.evidenceCode,
      );
      continue;
    }
    if (
      candidateIsVisibleCorpIceInstall(input, candidate) &&
      defenseActionDisposition?.startsWith(
        "corp_defense_exact_route_requires_parent_funding:",
      )
    ) {
      add(candidate.actionId, "corp.defend_servers", defenseActionDisposition);
      continue;
    }
    if (
      candidateIsVisibleCorpIceInstall(input, candidate) &&
      !corpDefensePortfolioHasExecutableRoute(
        { input, actionCandidates: candidates, turnKey: turnKey(input) },
        domain.defenseNeeds.filter((signal) =>
          corpDefenseSignalOwnsAction(signal, candidate.actionId),
        ),
      )
    ) {
      add(
        candidate.actionId,
        "corp.defend_servers",
        "corp_ice_install_has_no_engine_certified_access_probability_reduction",
      );
      continue;
    }
    if (
      (candidate.semanticActionType === "counter.purge_virus" ||
        candidate.semanticActionType === "counter.purge_runner_virus") &&
      !domain.virusPressure.some((signal) => signal.purgeUseful)
    ) {
      add(
        candidate.actionId,
        "corp.respond_to_virus_pressure",
        "corp_virus_purge_has_no_visible_strategic_pressure",
      );
      continue;
    }
    if (defenseActionDisposition) {
      add(candidate.actionId, "corp.defend_servers", defenseActionDisposition);
      continue;
    }
    if (
      corpCandidateProjectsCardDraw(candidate) &&
      !corpDrawCandidatePreservesHandCapacity(input, candidate) &&
      !corpOpenEconomyPlanOwnsAction(domain, candidate.actionId) &&
      !corpExactOverflowHandConversionPlanOwnsCandidate(domain, candidate) &&
      !domain.handManagement.some(
        (signal) =>
          signal.handPlanId === "draw-for-score-material" &&
          signal.drawAttemptState?.remainingAttempts === 1 &&
          signal.actionIds?.includes(candidate.actionId) === true,
      ) &&
      !domain.defenseNeeds.some(
        (signal) =>
          (signal.kind === "score_protection_draw" ||
            (signal.kind === "generic" && signal.phase === "draw_for_ice")) &&
          corpDefenseSignalOwnsAction(signal, candidate.actionId),
      )
    ) {
      add(
        candidate.actionId,
        "corp.hand_and_agenda_management",
        "corp_exact_draw_projection_exceeds_hand_capacity",
      );
      continue;
    }
    if (candidate.semanticActionType === "score.advance_card") {
      const exactScorePath = corpSameTurnScoreConversionPaths(input).find(
        (path) =>
          path.agendaCardId === candidate.sourceCardInstanceId &&
          path.sameTurnGuaranteed,
      );
      if (
        exactScorePath?.steps[0]?.kind === "score_ready" &&
        exactScorePath.desiredAdvancementCounters <=
          exactScorePath.advancementRequirement
      ) {
        add(
          candidate.actionId,
          "corp.score_agenda",
          "corp_ready_agenda_advance_rejected_for_exact_score_action",
        );
        continue;
      }
      if (
        exactScorePath?.steps[0] &&
        exactScorePath.steps[0].kind !== "basic_advance"
      ) {
        add(
          candidate.actionId,
          "corp.score_agenda",
          `corp_same_turn_score_conversion_requires_committed_first_step:${exactScorePath.steps[0].kind}`,
        );
        continue;
      }
    }
    if (
      candidateIsVisibleCorpAgendaInstall(input, candidate) &&
      candidateTargetIds(candidate).includes("new_remote") &&
      candidate.sourceCardInstanceId !== undefined &&
      domain.scoreProjects.some(
        (signal) =>
          signal.agendaInstanceId === candidate.sourceCardInstanceId &&
          signal.serverId !== undefined &&
          signal.serverId !== "new_remote",
      ) &&
      !corpExactExecutableNonEconomyPlanOwnsAction(domain, candidate)
    ) {
      add(
        candidate.actionId,
        "corp.score_agenda",
        "corp_prepared_score_parent_dominates_sibling_route",
      );
      continue;
    }
    const unknownScoreProject = domain.scoreProjects.find(
      (signal) =>
        !signal.feasible &&
        corpScoreProjectAssessmentIsUnknown(signal) &&
        signal.actionIds?.includes(candidate.actionId) === true,
    );
    if (
      unknownScoreProject &&
      !corpExactExecutableNonEconomyPlanOwnsAction(domain, candidate)
    ) {
      if (
        candidateIsVisibleCorpAgendaInstall(input, candidate) &&
        input.playerView.own.clicks <= 1
      ) {
        add(
          candidate.actionId,
          "corp.score_agenda",
          "corp_last_click_score_install_deferred_without_protection_horizon",
        );
      } else {
        addUnknown(
          candidate.actionId,
          "corp.score_agenda",
          unknownScoreProject.evidenceCode,
        );
      }
      continue;
    }
    const blockedScoreProject = domain.scoreProjects.find(
      (signal) =>
        !signal.feasible &&
        signal.actionIds?.includes(candidate.actionId) === true,
    );
    if (
      blockedScoreProject &&
      !corpExactExecutableNonEconomyPlanOwnsAction(domain, candidate)
    ) {
      add(
        candidate.actionId,
        "corp.score_agenda",
        blockedScoreProject.evidenceCode,
      );
      continue;
    }
    const sameTurnScoreProjectsForAgenda = candidateIsVisibleCorpAgendaInstall(
      input,
      candidate,
    )
      ? domain.scoreProjects.filter(
          (signal) =>
            signal.feasible &&
            signal.sameTurnCloseout &&
            signal.projectId ===
              corpScoreProjectId(
                candidate.sourceCardInstanceId ??
                  candidate.sourceDefinitionId ??
                  "unbound",
                candidateTargetIds(candidate).find(isCorpInstallServerId),
              ),
        )
      : [];
    const boundBySameTurnScoreProject = sameTurnScoreProjectsForAgenda.some(
      (signal) => signal.actionIds?.includes(candidate.actionId) === true,
    );
    if (
      sameTurnScoreProjectsForAgenda.length > 0 &&
      !boundBySameTurnScoreProject
    ) {
      add(
        candidate.actionId,
        "corp.score_agenda",
        "corp_same_turn_score_conversion_requires_committed_first_step",
      );
      continue;
    }
    if (
      candidateIsVisibleCorpAgendaInstall(input, candidate) &&
      !domain.scoreProjects.some(
        (signal) =>
          signal.feasible &&
          signal.actionIds?.includes(candidate.actionId) === true,
      ) &&
      !corpExactExecutableNonEconomyPlanOwnsAction(domain, candidate)
    ) {
      add(
        candidate.actionId,
        "corp.score_agenda",
        "corp_agenda_install_has_no_admitted_score_parent",
      );
      continue;
    }
    if (
      candidate.semanticActionType === "draw.card" &&
      input.playerView.own.gripOrHq.length >=
        input.playerView.own.maxHandSize &&
      !domain.handManagement.some(
        (signal) => signal.actionIds?.includes(candidate.actionId) === true,
      ) &&
      !domain.defenseNeeds.some(
        (signal) =>
          signal.phase === "draw_for_ice" &&
          corpDefenseSignalOwnsAction(signal, candidate.actionId),
      )
    ) {
      add(
        candidate.actionId,
        "corp.hand_and_agenda_management",
        "corp_draw_exceeds_hand_capacity_without_concrete_search_plan",
      );
      continue;
    }
    if (
      corpCandidateIsAmbushInstall(candidate) &&
      !domain.ambushes.some((signal) =>
        signal.actionIds.includes(candidate.actionId),
      )
    ) {
      add(
        candidate.actionId,
        "corp.ambush_and_bluff",
        "corp_ambush_install_has_no_bound_preplanning_commitment",
      );
      continue;
    }
    const fundingBlockedAmbush = domain.ambushes.find(
      (signal) =>
        signal.phase === "install" &&
        signal.installRoute?.actionId === candidate.actionId &&
        signal.installRoute.fundingGap > 0,
    );
    if (fundingBlockedAmbush) {
      add(
        candidate.actionId,
        "corp.ambush_and_bluff",
        `corp_ambush_exact_install_requires_parent_funding:${fundingBlockedAmbush.sourceInstanceId}`,
      );
      continue;
    }
    if (
      corpCandidateIsScoreAccelerationSupport(candidate) &&
      !domain.scoreProjects.some(
        (signal) =>
          signal.feasible &&
          signal.actionIds?.includes(candidate.actionId) === true,
      ) &&
      !corpOpenEconomyPlanOwnsAction(domain, candidate.actionId)
    ) {
      add(
        candidate.actionId,
        "corp.score_agenda",
        "corp_score_acceleration_support_has_no_bound_score_project",
      );
      continue;
    }
    const visibleSource = candidate.sourceCardInstanceId
      ? [
          ...input.playerView.own.gripOrHq,
          ...(input.playerView.own.rig ?? []),
          ...input.playerView.servers.flatMap((server) => [
            ...server.root,
            ...server.ice,
          ]),
        ].find((card) => card.instanceId === candidate.sourceCardInstanceId)
      : undefined;
    const visibleSourceType =
      candidate.semanticActionType === "corp_window.rez" && visibleSource
        ? visibleKnownCardType(input, visibleSource)
        : undefined;
    const unboundConditionalRezSupportEvidence =
      candidate.semanticActionType === "corp_window.rez" &&
      visibleSource !== undefined &&
      visibleSourceType !== "ice" &&
      !domain.defenseNeeds.some((signal) =>
        corpDefenseSignalOwnsAction(signal, candidate.actionId),
      )
        ? corpConditionalRezSupportWithoutCurrentRouteEvidence(
            input,
            candidate,
            visibleSource,
            domain.scoreProjects,
          )
        : undefined;
    if (unboundConditionalRezSupportEvidence) {
      add(
        candidate.actionId,
        "corp.defend_servers",
        unboundConditionalRezSupportEvidence,
      );
      continue;
    }
    const defensiveUpgradePlacement = corpDefensiveUpgradePlacement(
      input,
      candidate,
      domain.scoreProjects,
    );
    if (defensiveUpgradePlacement && !defensiveUpgradePlacement.signal) {
      add(
        candidate.actionId,
        "corp.defend_servers",
        defensiveUpgradePlacement.evidenceCode,
      );
      continue;
    }
    if (
      candidate.actionType === "advance_card" &&
      visibleSource?.type === "asset" &&
      !domain.ambushes.some(
        (signal) => signal.sourceInstanceId === candidate.sourceCardInstanceId,
      )
    ) {
      add(
        candidate.actionId,
        "corp.hand_and_agenda_management",
        "corp_visible_asset_advance_has_no_assigned_project",
      );
      continue;
    }
    const conditionalPunishAction =
      candidate.semanticActionType.startsWith("trace.") ||
      candidate.semanticActionType.startsWith("tag.") ||
      candidate.semanticActionType.startsWith("damage.") ||
      candidate.semanticActionType === "card_ability.trigger" ||
      candidate.semanticActionType === "play.corp_operation" ||
      (candidate.semanticActionType === "corp_window.rez" &&
        visibleSourceType !== "ice") ||
      candidate.actionType === "activated_card_ability" ||
      candidate.actionType === "trigger_ability" ||
      (candidate.semanticActionType === "install.card" &&
        !candidateIsVisibleCorpIceInstall(input, candidate) &&
        !candidateIsVisibleCorpAgendaInstall(input, candidate));
    if (
      conditionalPunishAction &&
      candidate.sourceDefinitionId &&
      corpDefinitionSupportsPunishPlan(candidate.sourceDefinitionId) &&
      !domain.ambushes.some((signal) =>
        signal.actionIds.includes(candidate.actionId),
      ) &&
      !domain.punishCampaigns.some((signal) =>
        corpPunishCampaignOwnsCandidate(signal, candidate),
      )
    ) {
      if (input.playerView.corpPunishRouteQuoteSet?.complete !== true) {
        addUnknown(
          candidate.actionId,
          "corp.execute_punish_sequence",
          "corp_conditional_punish_action_quote_unknown",
        );
      } else {
        add(
          candidate.actionId,
          "corp.execute_punish_sequence",
          "corp_conditional_punish_action_has_no_feasible_campaign",
        );
      }
      continue;
    }
    const blockedHandSignal = domain.handManagement.find(
      (signal) =>
        signal.routeAllowed === false &&
        corpHandSignalMatchesCandidate(signal, candidate),
    );
    if (
      blockedHandSignal &&
      !corpOpenEconomyPlanOwnsAction(domain, candidate.actionId) &&
      !corpExactExecutableNonEconomyPlanOwnsAction(domain, candidate)
    ) {
      add(
        candidate.actionId,
        "corp.hand_and_agenda_management",
        blockedHandSignal.evidenceCode,
      );
      continue;
    }
    if (
      corpCandidateProjectsCardDraw(candidate) &&
      !corpOpenEconomyPlanOwnsAction(domain, candidate.actionId) &&
      !corpExactExecutableNonEconomyPlanOwnsAction(domain, candidate)
    ) {
      add(
        candidate.actionId,
        "corp.hand_and_agenda_management",
        "corp_draw_has_no_exact_parent_need",
      );
      continue;
    }
    if (
      candidate.sourceKind === "card" &&
      [
        "install.card",
        "play.corp_operation",
        "card_ability.trigger",
        "economy.gain_credit",
      ].includes(candidate.semanticActionType) &&
      !corpOpenEconomyPlanOwnsAction(domain, candidate.actionId) &&
      !corpExactExecutableNonEconomyPlanOwnsAction(domain, candidate)
    ) {
      add(
        candidate.actionId,
        "corp.hand_and_agenda_management",
        "corp_card_action_has_no_exact_parent_need",
      );
    }
  }
  return dispositions;
}

function corpOpenEconomyPlanOwnsAction(
  domain: CorpPlanDomain,
  actionId: string,
): boolean {
  return domain.economyNeeds.some(
    (signal) =>
      signal.actionIds.includes(actionId) &&
      (signal.kind === "develop_campaign" ||
        signal.kind === "convert_immediate_operation" ||
        signal.kind === "convert_installed_asset_payout" ||
        signal.kind === "prepare_immediate_operation" ||
        signal.gap > 0),
  );
}

function corpCandidateIsImmediateRootRezEconomySource(
  candidate: ActionSemanticCandidate,
): boolean {
  if (
    candidate.semanticActionType !== "corp_window.rez" ||
    !candidate.sourceDefinitionId
  ) {
    return false;
  }
  return (
    AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId)?.effects?.some(
      (effect) =>
        effect.kind === "economy" &&
        effect.scope === "corp" &&
        effect.timing === "on_rez",
    ) === true
  );
}

function corpScoredAgendaRevealWithoutPurposeDispositionEvidence(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): string | undefined {
  if (candidate.semanticActionType !== "card_ability.trigger") {
    return undefined;
  }
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  if (
    action?.payload?.agendaAbility !== "v1919_scored_agenda_reveal_rd_top" ||
    !candidate.sourceCardInstanceId ||
    !input.playerView.own.scoreArea.some(
      (card) => card.instanceId === candidate.sourceCardInstanceId,
    )
  ) {
    return undefined;
  }
  return "corp_scored_agenda_reveal_rd_top_has_no_bound_downstream_plan";
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
    domain.defenseNeeds.some((signal) =>
      corpDefenseSignalOwnsAction(signal, candidate.actionId),
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

function corpEmptyRdDrawOperationDispositionEvidence(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): string | undefined {
  if (
    input.playerView.own.stackOrRdCount > 0 ||
    candidate.actionType !== "play_operation" ||
    !candidate.sourceDefinitionId ||
    CARD_DEFINITIONS_BY_ID[candidate.sourceDefinitionId]?.type !== "operation"
  ) {
    return undefined;
  }
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  const drawCardsAmount = Number(action?.payload?.drawCardsAmount ?? 0);
  const hint = AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId);
  const definitionRequiresDraw =
    hint?.effects?.some(
      (effect) =>
        effect.kind === "draw" &&
        typeof effect.amount === "number" &&
        effect.amount > 0,
    ) === true;
  return drawCardsAmount > 0 && definitionRequiresDraw
    ? `corp_empty_rd_draw_operation_has_no_executable_payload:${candidate.sourceDefinitionId}`
    : undefined;
}

function corpHandSignalMatchesCandidate(
  signal: CorpPlanDomain["handManagement"][number],
  candidate: ActionSemanticCandidate,
): boolean {
  if (signal.actionIds !== undefined) {
    return signal.actionIds.includes(candidate.actionId);
  }
  return (
    signal.sourceDefinitionIds?.includes(candidate.sourceDefinitionId ?? "") ===
      true &&
    (!signal.sourceInstanceId ||
      signal.sourceInstanceId === candidate.sourceCardInstanceId)
  );
}

function corpCandidateIsScoreAccelerationSupport(
  candidate: ActionSemanticCandidate,
): boolean {
  if (
    ![
      "corp_window.rez",
      "card_ability.trigger",
      "play.corp_operation",
      "score_conversion.move_advancement",
      "score_conversion.place_advancement",
      "score_conversion.gain_action_capacity",
    ].includes(candidate.semanticActionType)
  ) {
    return false;
  }
  const hint = candidate.sourceDefinitionId
    ? AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId)
    : undefined;
  return (
    hint?.functionSignals?.includes("score.advance_burst") === true ||
    hint?.functionSignals?.includes("action.corp_extra_action_burst") ===
      true ||
    hint?.functionSignals?.includes("action.corp_extra_action_support") ===
      true ||
    hint?.actionCapacityProfiles?.some(
      (profile) =>
        profile.recipient === "corp" &&
        typeof profile.amount === "number" &&
        profile.amount > 0,
    ) === true ||
    hint?.actionTacticSignals?.includes("corp.score_progress") === true ||
    hint?.actionTacticSignals?.includes("corp.score_closeout") === true
  );
}

function corpCandidateProjectsCardDraw(
  candidate: ActionSemanticCandidate,
): boolean {
  if (candidate.semanticActionType === "draw.card") return true;
  const cardsDrawn = candidate.economyProjection?.cardsDrawn;
  return (
    typeof cardsDrawn === "number" &&
    Number.isFinite(cardsDrawn) &&
    cardsDrawn > 0
  );
}

function buildCorpDomain(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  previous: ResidentPlanPortfolio | undefined,
): CorpPlanDomain {
  const currentTurnKey = turnKey(input);
  const centralDefenseHqHoldState = corpResidentCentralDefenseHqHoldState(
    previous,
    input,
  );
  const centralDefenseHqHoldCadence = centralDefenseHqHoldState.cadence;
  const centralDefenseHqHoldSelection = centralDefenseHqHoldState.selection;
  const centralDefenseAllocation = allocateCorpCentralDefenseFromAiFacts({
    input,
    hqHoldCadence: centralDefenseHqHoldCadence,
  });
  const residentDrawAttempt = corpResidentDefenseDrawAttempt(previous, input);
  const residentScoreMaterialDrawAttempt = corpResidentScoreMaterialDrawAttempt(
    previous,
    input,
  );
  const eventDrawAttempted =
    corpOptionalDrawAttemptedInEventTailThisTurn(input);
  const defenseDrawAttemptConsumed =
    residentDrawAttempt !== undefined || eventDrawAttempted;
  const consumedDefenseDrawSignals: CorpDefenseSignal[] =
    defenseDrawAttemptConsumed
      ? [
          {
            kind: "generic",
            defenseId: `optional-draw-attempt:${currentTurnKey}`,
            serverId: residentDrawAttempt?.serverId ?? "unknown",
            phase: "draw_for_ice",
            sourceDefinitionIds: [],
            actionIds: [],
            urgent: false,
            value: 0,
            evidenceCode:
              residentDrawAttempt !== undefined
                ? "corp_optional_defense_draw_attempt_resident"
                : "corp_optional_defense_draw_attempt_event_validation",
            drawAttemptState: {
              turnKey: currentTurnKey,
              remainingAttempts: 0,
              selectedAtStateVersion:
                residentDrawAttempt?.selectedAtStateVersion ??
                Math.max(0, input.playerView.stateVersion - 1),
            },
          },
        ]
      : [];
  const scorelineFeasibility = corpScorelineFeasibilityForDecisionInput(input);
  const directScoreProjects = candidates.flatMap((candidate) =>
    scoreProjectForCandidate(input, candidate, scorelineFeasibility),
  );
  const counterBankScoreProjects = corpCounterBankScoreProjects(
    input,
    candidates,
  );
  const remoteCreationUnlockScoreProjects = candidates.flatMap((candidate) =>
    corpRemoteCreationUnlockScoreProjects(input, candidate),
  );
  const nextTurnScoreContinuationProjects =
    corpNextTurnScoreContinuationProjects(input);
  const proposedScoreProjects = [
    ...directScoreProjects,
    ...counterBankScoreProjects,
    ...remoteCreationUnlockScoreProjects,
    ...nextTurnScoreContinuationProjects,
    ...candidates.flatMap((candidate) => {
      const conversion = sameTurnScoreConversionProjectForCandidate(
        input,
        candidate,
        directScoreProjects,
      );
      return conversion ? [conversion] : [];
    }),
  ];
  const ownAgendas = input.playerView.own.gripOrHq.filter(
    (card) => card.known && visibleCardIsAgenda(input, card),
  ).length;
  const legalCorpDraw = candidates.some(
    (candidate) => candidate.semanticActionType === "draw.card",
  );
  const knownAgendaInventory = corpKnownAgendaInventory(input);
  const agendaInstancesWithPreparedRemote = new Set(
    proposedScoreProjects
      .filter(
        (project) =>
          project.phase === "install_agenda" &&
          project.serverId !== undefined &&
          project.serverId !== "new_remote" &&
          project.agendaInstanceId !== undefined,
      )
      .map((project) => project.agendaInstanceId!),
  );
  const concreteScoreProjectsBeforeOpeningRush = uniqueScoreProjects(
    proposedScoreProjects.filter(
      (project) =>
        !(
          project.phase === "install_agenda" &&
          project.serverId === "new_remote" &&
          project.agendaInstanceId !== undefined &&
          agendaInstancesWithPreparedRemote.has(project.agendaInstanceId)
        ),
    ),
  );
  const concreteScoreProjects = concreteScoreProjectsBeforeOpeningRush.map(
    (project) => {
      const actionId =
        project.actionIds?.length === 1 ? project.actionIds[0] : undefined;
      const openingRush = assessCorpOpeningRush({
        input,
        project,
        candidate: actionId
          ? candidates.find((candidate) => candidate.actionId === actionId)
          : undefined,
        centralDefenseAllocation,
      });
      if (!openingRush) return project;
      if (openingRush.status === "qualified") {
        return {
          ...project,
          openingRush,
          feasible: openingRush.admission === "accepted",
          evidenceCode: `corp_opening_rush_${openingRush.admission}:${openingRush.quote.opportunityKey}`,
        };
      }
      return {
        ...project,
        openingRush,
      };
    },
  );
  const scoreMaterialMissing =
    ownAgendas === 0 &&
    concreteScoreProjects.length === 0 &&
    knownAgendaInventory !== undefined &&
    knownAgendaInventory.remainingStealableAgendaPoints !== 0;
  const scoreMaterialDrawSupportAvailable =
    scoreMaterialMissing &&
    legalCorpDraw &&
    corpScoreMaterialDrawHasSafeConversionWindow(input);
  const scoreProjects: CorpScoreProjectSignal[] = [
    ...concreteScoreProjects,
    ...(scoreMaterialMissing
      ? [
          {
            projectId: "general",
            agendaPoints: 0,
            phase: "select_agenda" as const,
            sameTurnCloseout: false,
            terminalScore: false,
            feasible: false,
            evidenceCode: "corp_score_campaign_missing_agenda_material",
          },
        ]
      : []),
  ];
  const ambushes: CorpPlanDomain["ambushes"] = buildCorpAmbushPlanSignals({
    input,
    candidates,
    previous,
  });
  const scoreProtectionProjects = scoreProjects
    .filter(
      (project) =>
        project.protectionNeed !== undefined &&
        !corpScoreProtectionIsSatisfied(input, project) &&
        !(
          project.openingRush?.status === "qualified" &&
          project.openingRush.admission === "accepted"
        ),
    )
    .sort(compareCorpScoreProtectionProjects);
  const scoreProtectionRouteScans = scoreProtectionProjects.map((project) => ({
    project,
    scan: corpScoreProtectionInstallRouteScan(input, candidates, project),
  }));
  const hasResidentScoreProtectionProject = scoreProtectionProjects.some(
    (project) =>
      project.serverId !== undefined &&
      project.serverId !== "new_remote" &&
      project.phase !== "install_agenda" &&
      project.feasible,
  );
  for (const { project, scan } of scoreProtectionRouteScans) {
    // A future agenda in a not-yet-created remote must not preempt an
    // existing, resident score project. Without a resident project it remains
    // a valid score-protection route in its own right.
    if (
      project.serverId === "new_remote" &&
      hasResidentScoreProtectionProject
    ) {
      continue;
    }
    if (
      (project.fundingGap ?? 0) === 0 &&
      scan.fundingGap !== undefined &&
      scan.fundingGap > 0
    ) {
      project.fundingGap = scan.fundingGap;
      project.evidenceCode = `corp_score_protection_funding_gap:${project.serverId ?? "unbound"}:${scan.fundingGap}`;
    }
  }
  const selectedScoreProtectionSignals: CorpDefenseSignal[] = [];
  for (const { project, scan } of scoreProtectionRouteScans) {
    if (
      project.serverId === "new_remote" &&
      hasResidentScoreProtectionProject
    ) {
      continue;
    }
    if (
      project.feasible &&
      project.phase === "install_agenda" &&
      project.uncertainty?.currentActionScope === "exact_install_only"
    ) {
      continue;
    }
    if (scan.productiveRoutes.length > 0) {
      selectedScoreProtectionSignals.push(
        ...scan.productiveRoutes.map(({ candidate, projection }) => ({
          kind: "score_protection_install" as const,
          defenseId: `score-protection-install:${project.projectId}:${candidate.actionId}`,
          serverId: projection.targetServerId,
          phase: "install_ice" as const,
          parentProjectId: project.projectId,
          parentNeedId: project.protectionNeed!.needId,
          delegatedPriorityClass: corpScorePriorityClass(project),
          actionId: candidate.actionId,
          sourceCardInstanceId: projection.sourceCardInstanceId,
          sourceDefinitionId: projection.sourceDefinitionId,
          effect: projection.effect,
          runnerAccessSuccessProbability:
            projection.after.protection.runnerAccessSuccessProbability,
          totalInstallAndRezCredits:
            projection.installCredits +
            projection.selectedRezCosts.reduce(
              (sum, selected) => sum + selected.credits,
              0,
            ),
          projection,
          evidenceCode: `score_protection_${projection.effect}:${project.projectId}:${projection.targetServerId}`,
        })),
      );
      break;
    }
    const stagingInstallSignal = candidates
      .flatMap((candidate) => {
        const signal = corpScoreProtectionStagingInstallSignal(
          input,
          candidate,
          project,
          scan,
        );
        if (!signal) return [];
        const action = input.legalActions.find(
          (legalAction) => legalAction.actionId === signal.actionId,
        );
        const creditCost =
          action?.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0) ??
          Number.MAX_SAFE_INTEGER;
        return [{ signal, creditCost }];
      })
      .sort(
        (left, right) =>
          left.creditCost - right.creditCost ||
          technicalIdCompare(left.signal.actionId, right.signal.actionId),
      )[0]?.signal;
    if (stagingInstallSignal) {
      selectedScoreProtectionSignals.push(stagingInstallSignal);
      break;
    }
    const protectionNeed = project.protectionNeed;
    if (!protectionNeed) continue;
    const drawSignals: CorpDefenseSignal[] = candidates.flatMap((candidate) => {
      if (!corpCandidateProjectsCardDraw(candidate)) return [];
      if (
        !corpDrawCandidatePreservesHandCapacity(input, candidate) &&
        candidate.semanticActionType !== "draw.card"
      ) {
        return [];
      }
      const action = input.legalActions.find(
        (legalAction) => legalAction.actionId === candidate.actionId,
      );
      if (!action) return [];
      const clickCost = candidate.costProfile.clickCost;
      const cardsDrawn = candidate.economyProjection?.cardsDrawn;
      const netHandDelta = candidate.economyProjection?.netHandDelta;
      const drawActionProjection = exactCurrentBasicCorpDrawCandidate(
        input,
        candidate,
      )
        ? ({
            knowledge: "known" as const,
            actionId: candidate.actionId,
            observedAtStateVersion: input.playerView.stateVersion,
            clickCost: 1,
            cardsDrawn: 1,
            netHandDelta: 1,
          } as const)
        : Number.isSafeInteger(clickCost) &&
            (clickCost ?? -1) >= 0 &&
            Number.isSafeInteger(cardsDrawn) &&
            (cardsDrawn ?? 0) > 0 &&
            Number.isSafeInteger(netHandDelta) &&
            (netHandDelta ?? -1) >= 0
          ? ({
              knowledge: "known" as const,
              actionId: candidate.actionId,
              observedAtStateVersion: input.playerView.stateVersion,
              clickCost: clickCost!,
              cardsDrawn: cardsDrawn!,
              netHandDelta: netHandDelta!,
            } as const)
          : ({ knowledge: "unknown" as const } as const);
      const need = corpMissingConcreteScoreDefenseDrawNeed({
        input,
        action,
        protectionNeed,
        directInstallRouteState: scan.directInstallRouteState,
        drawActionProjection,
        attemptState: {
          residentAttemptedThisTurn: residentDrawAttempt !== undefined,
          eventTailAttemptedThisTurn: eventDrawAttempted,
        },
      });
      if (!need) return [];
      return [
        {
          kind: "score_protection_draw",
          defenseId: need.needId,
          serverId: need.serverId,
          phase: "draw_for_ice",
          parentProjectId: need.parentProjectId,
          parentNeedId: protectionNeed.needId,
          delegatedPriorityClass: corpScorePriorityClass(project),
          actionId: candidate.actionId,
          cleanupReplacementDraw: need.cleanupReplacementDraw,
          drawAttemptState: {
            turnKey: currentTurnKey,
            remainingAttempts: 1,
          },
          evidenceCode: `score_plan_requires_effective_ice_draw:${need.parentProjectId}:${need.serverId}`,
        },
      ];
    });
    if (drawSignals.length > 0) {
      selectedScoreProtectionSignals.push(...drawSignals);
      break;
    }
  }
  const defenseDrawSignals: CorpDefenseSignal[] = candidates.flatMap(
    (candidate) => {
      if (defenseDrawAttemptConsumed) return [];
      if (!corpCandidateProjectsCardDraw(candidate)) return [];
      const action = input.legalActions.find(
        (legalAction) => legalAction.actionId === candidate.actionId,
      );
      if (!action) return [];
      const need = corpMissingConcreteDefenseDrawNeed(
        input,
        action,
        undefined,
        centralDefenseAllocation,
      );
      if (!need) return [];
      return [
        {
          kind: "generic",
          defenseId: `draw-for-ice:${need.serverId}`,
          serverId: need.serverId,
          phase: "draw_for_ice" as const,
          sourceDefinitionIds: [],
          actionIds: [candidate.actionId],
          urgent: false,
          value: need.planValue,
          evidenceCode: `corp_missing_concrete_defense_draw:${need.serverId}`,
          drawAttemptState: {
            turnKey: currentTurnKey,
            remainingAttempts: 1,
          },
        },
      ];
    },
  );
  const exactScoreProtectionInstallActionIds = new Set(
    selectedScoreProtectionSignals.flatMap((signal) =>
      signal.kind === "score_protection_install" ||
      signal.kind === "score_protection_staging_install"
        ? [signal.actionId]
        : [],
    ),
  );
  const mergedDefenseNeeds: CorpCorePlanDomain["defenseNeeds"] =
    mergeDefenseSignals([
      ...candidates.flatMap((candidate): CorpDefenseSignal[] => {
        const defensiveUpgradePlacement = corpDefensiveUpgradePlacement(
          input,
          candidate,
          scoreProjects,
        );
        if (defensiveUpgradePlacement?.signal) {
          return [defensiveUpgradePlacement.signal];
        }
        if (candidateIsVisibleCorpIceInstall(input, candidate)) {
          if (exactScoreProtectionInstallActionIds.has(candidate.actionId)) {
            return [];
          }
          const serverId = candidateTargetIds(candidate).find(
            isCorpInstallServerId,
          );
          if (!serverId || !candidate.sourceDefinitionId) return [];
          const route = corpGlobalDefenseInstallRoute(
            input,
            candidate,
            serverId,
            centralDefenseAllocation,
          );
          if (!route) return [];
          const selectedCentralThreat =
            centralDefenseAllocation?.status === "known"
              ? centralDefenseAllocation.evidence[
                  centralDefenseAllocation.selectedServerId
                ].threat
              : undefined;
          const targetCentralMissingCoverage =
            (serverId === "hq" || serverId === "rd") &&
            input.playerView.servers.some(
              (server) => server.id === serverId && server.ice.length === 0,
            );
          const centralPressure =
            serverId === "hq" || serverId === "rd"
              ? selectedCentralThreat === "acute" ||
                selectedCentralThreat === "terminal" ||
                (selectedCentralThreat === "material" &&
                  targetCentralMissingCoverage)
                ? selectedCentralThreat
                : undefined
              : undefined;
          const visibleAgendaExposure =
            serverId === "archives" && archivesHasVisibleKnownAgenda(input);
          return [
            {
              kind: "generic",
              defenseId: `install:${serverId}:${candidate.actionId}`,
              serverId,
              phase: "install_ice" as const,
              sourceDefinitionIds: [candidate.sourceDefinitionId],
              actionIds: [candidate.actionId],
              urgent: centralPressure === "terminal" || visibleAgendaExposure,
              ...(centralPressure ? { centralPressure } : {}),
              installRoute: route,
              value: 1,
              evidenceCode:
                route.disposition === "funding_only"
                  ? `corp_defense_exact_route_funding_required:${serverId}:${candidate.actionId}`
                  : visibleAgendaExposure
                    ? "engine_certified_visible_agenda_exposure_defense"
                    : "engine_certified_global_defense_access_probability_reduced",
            },
          ];
        }
        if (candidate.semanticActionType === "corp_window.rez") {
          const visibleSource = requireVisibleCandidateSource(input, candidate);
          const targetId = candidate.sourceCardInstanceId;
          const rezServerId =
            (targetId ? serverForInstalledCard(input, targetId) : undefined) ??
            candidateTargetIds(candidate).find(isServerId) ??
            input.playerView.run?.attackedServerId ??
            "unknown";
          const sourceType = visibleKnownCardType(input, visibleSource);
          const persistentDefenseSupport =
            sourceType === "upgrade" &&
            corpRezEstablishesPersistentDefenseSupport(
              input,
              candidate,
              rezServerId,
            );
          const futureEncounterDefenseSupport =
            sourceType === "upgrade" && visibleSource
              ? corpFutureEncounterRezSupportAssessment(
                  input,
                  candidate,
                  visibleSource,
                  rezServerId,
                )
              : undefined;
          const exactCardRezSupportWithoutReserve =
            sourceType !== "ice"
              ? corpExactCardRezSupportAssessment(
                  input,
                  candidate,
                  visibleSource,
                  rezServerId,
                )
              : undefined;
          const exactCardRezReserve = exactCardRezSupportWithoutReserve
            ? corpCardRoutePreservesScoreReserve(
                input,
                candidate,
                rezServerId,
                scoreProjects,
              )
            : undefined;
          const exactCardRezSupport =
            exactCardRezSupportWithoutReserve?.productive === true &&
            exactCardRezReserve?.preservesReserve !== true
              ? {
                  ...exactCardRezSupportWithoutReserve,
                  productive: false,
                  value: 0,
                  evidenceCode: `corp_rez_exact_card_support_breaks_score_reserve:${exactCardRezReserve?.requiredCreditsAfterAction ?? "unknown"}`,
                }
              : exactCardRezSupportWithoutReserve;
          if (
            sourceType !== "ice" &&
            !persistentDefenseSupport &&
            futureEncounterDefenseSupport?.productive !== true &&
            exactCardRezSupport?.productive !== true
          ) {
            return [];
          }
          if (persistentDefenseSupport)
            return [
              {
                kind: "generic",
                defenseId: `rez-defense-support:${targetId ?? candidate.actionId}`,
                serverId: rezServerId,
                phase: "rez_response" as const,
                sourceDefinitionIds: visibleSource.definitionId
                  ? [visibleSource.definitionId]
                  : [],
                actionIds: [candidate.actionId],
                ...(targetId ? { targetIceInstanceId: targetId } : {}),
                urgent: false,
                rezWindowVerdict: "productive" as const,
                value: 120,
                evidenceCode: "corp_rez_persistent_server_defense_support",
              },
            ];
          if (futureEncounterDefenseSupport?.productive)
            return [
              {
                kind: "generic",
                defenseId: `rez-future-encounter-support:${targetId ?? candidate.actionId}`,
                serverId: rezServerId,
                phase: "rez_response" as const,
                sourceDefinitionIds: visibleSource.definitionId
                  ? [visibleSource.definitionId]
                  : [],
                actionIds: [candidate.actionId],
                ...(targetId ? { targetIceInstanceId: targetId } : {}),
                urgent: true,
                rezWindowVerdict: "productive" as const,
                value: 140,
                evidenceCode: futureEncounterDefenseSupport.evidenceCode,
              },
            ];
          if (exactCardRezSupport?.productive)
            return [
              {
                kind: "generic",
                defenseId: `rez-exact-card-support:${targetId ?? candidate.actionId}`,
                serverId: exactCardRezSupport.serverId,
                phase: "rez_response" as const,
                sourceDefinitionIds: visibleSource.definitionId
                  ? [visibleSource.definitionId]
                  : [],
                actionIds: [candidate.actionId],
                ...(targetId ? { targetIceInstanceId: targetId } : {}),
                urgent: input.playerView.run !== undefined,
                rezWindowVerdict: "productive" as const,
                value: exactCardRezSupport.value,
                evidenceCode: exactCardRezSupport.evidenceCode,
              },
            ];
          const exactIceRezRoute =
            sourceType === "ice"
              ? projectExactCorpIceRezRoute({
                  input,
                  candidate,
                  sourceCard: visibleSource,
                  targetServerId: rezServerId,
                })
              : undefined;
          const scoreReserveAdmission = exactIceRezRoute
            ? assessCorpExactIceRezAgainstScoreReserves({
                input,
                route: exactIceRezRoute,
                scoreProjects,
              })
            : undefined;
          const productiveIceRezRoute =
            exactIceRezRoute && scoreReserveAdmission?.preservesReserve
              ? exactIceRezRoute
              : undefined;
          if (sourceType === "ice" && !productiveIceRezRoute) {
            return [
              {
                kind: "generic",
                defenseId: `rez-nonproductive:${targetId ?? candidate.actionId}`,
                serverId: rezServerId,
                phase: "rez_response" as const,
                sourceDefinitionIds: candidate.sourceDefinitionId
                  ? [candidate.sourceDefinitionId]
                  : [],
                actionIds: [candidate.actionId],
                ...(targetId ? { targetIceInstanceId: targetId } : {}),
                urgent: false,
                rezWindowVerdict: "nonproductive" as const,
                value: 0,
                evidenceCode: exactIceRezRoute
                  ? `corp_ice_rez_preserves_score_reserve_required:${scoreReserveAdmission?.requiredCreditsAfterRez ?? "unknown"}`
                  : "corp_ice_rez_resource_exchange_unknown",
              },
            ];
          }
          return [
            {
              kind: "generic",
              defenseId: `rez:${targetId ?? "unknown"}:${candidate.actionId}`,
              serverId: rezServerId,
              phase: "rez_response" as const,
              sourceDefinitionIds: candidate.sourceDefinitionId
                ? [candidate.sourceDefinitionId]
                : [],
              actionIds: [candidate.actionId],
              ...(targetId ? { targetIceInstanceId: targetId } : {}),
              urgent: input.playerView.run !== undefined,
              ...(productiveIceRezRoute
                ? { rezRoute: productiveIceRezRoute }
                : {}),
              rezWindowVerdict: productiveIceRezRoute
                ? ("productive" as const)
                : ("open" as const),
              value: productiveIceRezRoute ? 1 : 0,
              evidenceCode: productiveIceRezRoute
                ? productiveIceRezRoute.routeKind === "access_reduction"
                  ? `engine_certified_ice_rez_access_reduction:${rezServerId}:${candidate.actionId}`
                  : productiveIceRezRoute.routeKind ===
                      "exact_resource_exchange"
                    ? `engine_certified_ice_rez_exact_resource_exchange:${rezServerId}:${candidate.actionId}`
                    : productiveIceRezRoute.routeKind ===
                        "free_persistent_defense"
                      ? `engine_certified_ice_rez_free_persistent_defense:${rezServerId}:${candidate.actionId}`
                      : `engine_certified_ice_rez_qualitative_encounter_defense:${rezServerId}:${candidate.actionId}`
                : "visible_non_ice_rez_window",
            },
          ];
        }
        if (candidate.semanticActionType === "corp_window.decline_rez") {
          return [
            {
              kind: "generic",
              defenseId: `decline-rez:${candidate.actionId}`,
              serverId: input.playerView.run?.attackedServerId ?? "unknown",
              phase: "decline_rez" as const,
              sourceDefinitionIds: [],
              actionIds: [candidate.actionId],
              urgent: false,
              value: 0,
              evidenceCode: "visible_rez_window_decline",
            },
          ];
        }
        if (candidate.semanticActionType === "card_ability.trigger") {
          const assessment = corpRunDefenseAbilityAssessment(input, candidate);
          if (assessment?.productive) {
            return [
              {
                kind: "generic",
                defenseId: `activate-run-defense:${candidate.actionId}`,
                serverId: assessment.serverId,
                phase: "activate_run_defense" as const,
                sourceDefinitionIds: candidate.sourceDefinitionId
                  ? [candidate.sourceDefinitionId]
                  : [],
                actionIds: [candidate.actionId],
                urgent: true,
                value: assessment.value,
                evidenceCode: assessment.evidenceCode,
              },
            ];
          }
        }
        return [];
      }),
      ...selectedScoreProtectionSignals,
      ...defenseDrawSignals,
      ...consumedDefenseDrawSignals,
    ]);
  const genuineCurrentDefenseThreat = mergedDefenseNeeds.some(
    (signal) =>
      signal.kind === "generic" &&
      signal.urgent &&
      (signal.phase === "activate_run_defense" ||
        (signal.phase === "rez_response" &&
          signal.rezWindowVerdict === "productive")),
  );
  const defenseNeeds: CorpCorePlanDomain["defenseNeeds"] =
    mergedDefenseNeeds.map((signal) =>
      signal.kind === "generic" && signal.phase === "decline_rez"
        ? {
            ...signal,
            urgent: genuineCurrentDefenseThreat,
            evidenceCode: genuineCurrentDefenseThreat
              ? "visible_rez_window_decline_with_genuine_defense_threat"
              : "visible_rez_window_decline_without_defense_threat",
          }
        : signal,
    );
  const remoteProjects: CorpCorePlanDomain["remoteProjects"] = [];
  const immediateFundingActionIds = candidates
    .filter(corpEconomyActionIsOwned)
    .map((candidate) => candidate.actionId);
  const punishCampaigns = uniqueBy(
    punishSignals(input, candidates, scorelineFeasibility, previous),
    (signal) => signal.campaignId,
  );
  const requiredEconomyNeeds = corpRequiredEconomyNeeds(
    input,
    scoreProjects,
    defenseNeeds,
    ambushes,
    punishCampaigns,
    immediateFundingActionIds,
  );
  const operationThresholdPreparations =
    corpImmediateOperationThresholdPreparations(input, candidates);
  const turnLiquidityDevelopment =
    operationThresholdPreparations.length === 0
      ? corpTurnLiquidityDevelopmentNeed(input, candidates, previous)
      : undefined;
  const unboundEconomyNeeds: CorpCorePlanDomain["economyNeeds"] = uniqueBy(
    [
      ...requiredEconomyNeeds,
      ...(turnLiquidityDevelopment ? [turnLiquidityDevelopment] : []),
      ...operationThresholdPreparations,
      ...corpImmediateOperationEconomyConversions(input, candidates),
      ...corpInstalledAssetEconomyWithdrawals(input, candidates),
      ...corpEconomyDevelopmentCampaigns(input, candidates),
    ],
    (signal) => signal.needId,
  );
  const economyNeeds: CorpCorePlanDomain["economyNeeds"] =
    unboundEconomyNeeds.map((signal) => {
      if (
        signal.kind === "develop_campaign" ||
        signal.kind === "convert_immediate_operation" ||
        signal.kind === "convert_installed_asset_payout" ||
        signal.kind === "prepare_immediate_operation" ||
        signal.kind === "develop_liquidity"
      )
        return signal;
      const fundingRouteAssessment = assessCorpEconomyFundingRoute(
        {
          input,
          actionCandidates: candidates,
          turnKey: turnKey(input),
        },
        signal,
      );
      return {
        ...signal,
        actionIds: fundingRouteAssessment.headActionId
          ? [fundingRouteAssessment.headActionId]
          : [],
        fundingRouteAssessment,
      };
    });
  const purgeAction = input.legalActions.find(
    (action) =>
      action.type === "purge_virus_counters" ||
      action.type === "purge_runner_virus_counters",
  );
  const visibleVirusCounters = visibleRunnerVirusCounters(input);
  const virusPressure: CorpPlanDomain["virusPressure"] = purgeAction
    ? [
        {
          pressureId: "visible-virus-pressure",
          virusCounters: visibleVirusCounters,
          strategicDamage: visibleVirusCounters,
          critical: visibleVirusCounters >= 3,
          purgeUseful: corpPurgeHasVisibleStrategicPressure(input, purgeAction),
          evidenceCode: "visible_runner_virus_counters",
        },
      ]
    : [];
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
  const scoreMaterialDrawAttemptConsumed =
    residentScoreMaterialDrawAttempt !== undefined || eventDrawAttempted;
  const scoreMaterialDrawRouteActionIds =
    scoreMaterialDrawAttemptConsumed || !scoreMaterialDrawSupportAvailable
      ? []
      : candidates
          .filter(
            (candidate) =>
              !defenseDispositionActionIds.has(candidate.actionId) &&
              exactCurrentCorpScoreMaterialDrawCandidate(input, candidate),
          )
          .map((candidate) => candidate.actionId);
  const scoreSetupBinding = corpScoreAccelerationSetupBinding(
    input,
    candidates,
    scoreProjects,
  );
  if (scoreSetupBinding) {
    scoreSetupBinding.parent.setupNeed = scoreSetupBinding.setupNeed;
  }
  const cardDevelopmentSignals = corpCardDevelopmentSignals(
    input,
    candidates,
    ownAgendas,
    economyNeeds,
    defenseDispositionActionIds,
    scoreSetupBinding,
    scoreProjects,
  );
  const hqOverflowResolution = corpHqOverflowResolutionSignal(
    input,
    candidates,
    ownAgendas,
    previous,
    cardDevelopmentSignals,
  );
  const hqOverflowActionIds = new Set(hqOverflowResolution?.actionIds ?? []);
  const handManagement: CorpPlanDomain["handManagement"] = [
    ...(hqOverflowResolution ? [hqOverflowResolution] : []),
    ...(scoreMaterialMissing
      ? [
          {
            handPlanId: "draw-for-score-material",
            parentPlanInstanceId: planInstanceIdForProposal({
              moduleId: "corp.score_agenda",
              dedupeKey: "general",
            }),
            parentNeedId: "score-material:general",
            phase: "draw_for_plan" as const,
            agendaCount: ownAgendas,
            handSize: input.playerView.own.gripOrHq.length,
            maximumHandSize: input.playerView.own.maxHandSize,
            actionIds: scoreMaterialDrawRouteActionIds,
            concretePurposeCode:
              "Execute one currently legal Engine-described draw action, observe every drawn identity, then revalidate the blocked score-material campaign.",
            uncertainty: {
              kind: "draw_then_observe" as const,
              unknownOutcome: "drawn_card_identity" as const,
              revalidateAfterCurrentHead: true as const,
            },
            drawAttemptState: {
              turnKey: currentTurnKey,
              remainingAttempts: scoreMaterialDrawAttemptConsumed
                ? (0 as const)
                : (1 as const),
              ...(residentScoreMaterialDrawAttempt
                ? {
                    selectedAtStateVersion:
                      residentScoreMaterialDrawAttempt.selectedAtStateVersion,
                  }
                : eventDrawAttempted
                  ? {
                      selectedAtStateVersion: Math.max(
                        0,
                        input.playerView.stateVersion - 1,
                      ),
                    }
                  : {}),
            },
            priorityClass: "P5" as const,
            value: 80,
            evidenceCode: "corp_score_campaign_missing_agenda_material",
          },
        ]
      : []),
    ...cardDevelopmentSignals.filter(
      (signal) =>
        !signal.evidenceCode.startsWith(
          "corp_hq_overflow_admissible_current_conversion:",
        ) &&
        !signal.actionIds?.some((actionId) =>
          hqOverflowActionIds.has(actionId),
        ),
    ),
  ];
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

function corpDrawCandidatePreservesHandCapacity(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  if (
    candidate.semanticActionType === "draw.card" &&
    candidate.sourceKind === "basic_action"
  ) {
    return (
      input.playerView.own.gripOrHq.length + 1 <=
      input.playerView.own.maxHandSize
    );
  }
  const netHandDelta = candidate.economyProjection?.netHandDelta;
  return (
    typeof netHandDelta === "number" &&
    Number.isFinite(netHandDelta) &&
    input.playerView.own.gripOrHq.length + netHandDelta <=
      input.playerView.own.maxHandSize
  );
}

function exactCurrentBasicCorpDrawCandidate(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  if (
    candidate.sourceKind !== "basic_action" ||
    candidate.semanticActionType !== "draw.card" ||
    candidate.costProfile.clickCost !== 1 ||
    (candidate.costProfile.creditCost !== undefined &&
      candidate.costProfile.creditCost !== 0) ||
    candidate.costProfile.additionalCosts.length > 0
  ) {
    return false;
  }
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  if (
    action?.side !== "corp" ||
    action.type !== "draw_card" ||
    action.source !== "basic_action" ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.targetRequirements.length > 0 ||
    (action.choiceRequirements?.length ?? 0) > 0
  ) {
    return false;
  }
  const totalClicks = action.costs.reduce(
    (sum, cost) => sum + (cost.clicks ?? 0),
    0,
  );
  const totalCredits = action.costs.reduce(
    (sum, cost) => sum + (cost.credits ?? 0),
    0,
  );
  return (
    totalClicks === 1 &&
    totalCredits === 0 &&
    input.playerView.own.stackOrRdCount > 0 &&
    Number.isSafeInteger(input.playerView.own.gripOrHq.length) &&
    Number.isSafeInteger(input.playerView.own.maxHandSize)
  );
}

function exactCurrentCorpScoreMaterialDrawCandidate(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  if (exactCurrentBasicCorpDrawCandidate(input, candidate)) return true;
  if (
    !corpCandidateProjectsCardDraw(candidate) ||
    !corpDrawCandidatePreservesHandCapacity(input, candidate) ||
    candidate.costProfile.additionalCosts.length > 0
  ) {
    return false;
  }
  const projection = candidate.economyProjection;
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  const cardsDrawn = projection?.cardsDrawn;
  const netHandDelta = projection?.netHandDelta;
  const clickCost = candidate.costProfile.clickCost;
  const creditCost = candidate.costProfile.creditCost;
  if (
    action?.side !== "corp" ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.targetRequirements.length > 0 ||
    (action.choiceRequirements?.length ?? 0) > 0 ||
    projection?.timing !== "immediate" ||
    projection.reliability !== "guaranteed" ||
    !Number.isSafeInteger(cardsDrawn) ||
    (cardsDrawn ?? 0) <= 0 ||
    !Number.isSafeInteger(netHandDelta) ||
    (netHandDelta ?? -1) < 0 ||
    !Number.isSafeInteger(clickCost) ||
    (clickCost ?? 0) <= 0 ||
    !Number.isSafeInteger(creditCost) ||
    (creditCost ?? -1) < 0
  ) {
    return false;
  }
  const totalClicks = action.costs.reduce(
    (sum, cost) => sum + (cost.clicks ?? 0),
    0,
  );
  const totalCredits = action.costs.reduce(
    (sum, cost) => sum + (cost.credits ?? 0),
    0,
  );
  return (
    totalClicks === clickCost &&
    totalCredits === creditCost &&
    totalClicks <= input.playerView.own.clicks &&
    totalCredits <= input.playerView.own.credits
  );
}

function corpExactCurrentBasicLiquidCreditCandidate(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  if (!corpExactBasicLiquidCreditCandidate(candidate)) return false;
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  if (
    action?.side !== "corp" ||
    action.type !== "gain_credit" ||
    action.source !== "basic_action" ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.targetRequirements.length > 0 ||
    (action.choiceRequirements?.length ?? 0) > 0
  ) {
    return false;
  }
  const totalClicks = action.costs.reduce(
    (sum, cost) => sum + (cost.clicks ?? 0),
    0,
  );
  const totalCredits = action.costs.reduce(
    (sum, cost) => sum + (cost.credits ?? 0),
    0,
  );
  return totalClicks === 1 && totalCredits === 0;
}

function corpTurnLiquidityDevelopmentNeed(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  previous: ResidentPlanPortfolio | undefined,
): CorpEconomyLiquidityDevelopmentSignal | undefined {
  const exactCandidates = candidates.filter((candidate) =>
    corpExactCurrentBasicLiquidCreditCandidate(input, candidate),
  );
  const remainingClicks = input.playerView.own.clicks;
  if (remainingClicks <= 0 || exactCandidates.length !== 1) return undefined;

  const currentTurnKey = turnKey(input);
  const resident = corpResidentTurnLiquidityDevelopment(
    previous,
    currentTurnKey,
  );
  const currentCredits = input.playerView.own.credits;
  const residentTargetReached =
    resident !== undefined && resident.targetCredits <= currentCredits;
  if (
    residentTargetReached &&
    input.playerView.stateVersion <= resident.revalidatedAtStateVersion
  ) {
    return undefined;
  }
  const targetCredits = residentTargetReached
    ? currentCredits + remainingClicks
    : (resident?.targetCredits ?? currentCredits + remainingClicks);
  if (!Number.isSafeInteger(targetCredits) || targetCredits <= currentCredits) {
    return undefined;
  }
  return {
    kind: "develop_liquidity",
    needId: `economy-liquidity-development:${currentTurnKey}`,
    turnKey: currentTurnKey,
    targetCredits,
    currentCreditsAtRevalidation: currentCredits,
    gap: targetCredits - currentCredits,
    projectedCreditGain: 1,
    actionIds: [exactCandidates[0]!.actionId],
    priorityClass: "P6",
    cadence: {
      kind: "remaining_turn_capacity",
      maximumConversions: resident?.maximumConversions ?? remainingClicks,
    },
    completion: {
      kind: "target_credits_or_no_clicks",
    },
    revalidation: {
      stateVersion: input.playerView.stateVersion,
      status: "turn_liquidity_open",
    },
    urgentForScore: false,
    evidenceCode: "corp_engine_certified_basic_liquidity_development",
  };
}

function corpExactOverflowHandConversionPlanOwnsCandidate(
  domain: CorpPlanDomain,
  candidate: ActionSemanticCandidate,
): boolean {
  return domain.handManagement.some(
    (signal) =>
      signal.routeAllowed !== false &&
      signal.exactActionRoute === true &&
      signal.phase === "resolve_hq_overflow" &&
      signal.overflowResolutionState !== undefined &&
      signal.overflowResolutionState.remainingConversions > 0 &&
      signal.actionIds?.includes(candidate.actionId) === true,
  );
}

function corpHqOverflowResolutionSignal(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  agendaCount: number,
  previous: ResidentPlanPortfolio | undefined,
  developmentSignals: readonly CorpPlanDomain["handManagement"][number][],
): CorpPlanDomain["handManagement"][number] | undefined {
  const handSize = input.playerView.own.gripOrHq.length;
  const maximumHandSize = input.playerView.own.maxHandSize;
  const remainingClicks = input.playerView.own.clicks;
  if (
    input.side !== "corp" ||
    input.playerView.timingPoint !== "corp_action.main" ||
    !Number.isSafeInteger(handSize) ||
    !Number.isSafeInteger(maximumHandSize) ||
    maximumHandSize < 0 ||
    !Number.isSafeInteger(remainingClicks) ||
    remainingClicks <= 0
  ) {
    return undefined;
  }
  const overflowCount = handSize - maximumHandSize;
  if (!Number.isSafeInteger(overflowCount) || overflowCount <= 0) {
    return undefined;
  }
  const admissible = developmentSignals
    .filter(
      (signal) =>
        signal.phase === "develop_card" && signal.routeAllowed !== false,
    )
    .flatMap((signal) =>
      candidates
        .filter(
          (candidate) =>
            corpHandSignalMatchesCandidate(signal, candidate) &&
            corpHqOverflowCandidateIsExactCurrentConversion(input, candidate),
        )
        .map((candidate) => ({
          candidate,
          priority: signal.value,
        })),
    )
    .sort(
      (left, right) =>
        right.priority - left.priority ||
        technicalIdCompare(left.candidate.actionId, right.candidate.actionId),
    );
  if (admissible.length === 0) return undefined;
  const actionIds = [
    ...new Set(admissible.map(({ candidate }) => candidate.actionId)),
  ];
  const eligibleSourceCount = new Set(
    admissible.map(({ candidate }) => candidate.sourceCardInstanceId),
  ).size;
  const receipt = corpResidentHqOverflowResolution(previous, input);
  const reactivatedOverflowCount =
    receipt?.remainingConversions === 0 &&
    receipt.selectedAtStateVersion !== undefined &&
    receipt.selectedAtStateVersion < input.playerView.stateVersion &&
    receipt.expectedOverflowAfterSelectedConversion !== undefined &&
    overflowCount > receipt.expectedOverflowAfterSelectedConversion
      ? overflowCount - receipt.expectedOverflowAfterSelectedConversion
      : undefined;
  const initialOverflowCount =
    reactivatedOverflowCount ?? receipt?.initialOverflowCount ?? overflowCount;
  const maximumConversions =
    reactivatedOverflowCount !== undefined
      ? Math.min(
          reactivatedOverflowCount,
          input.playerView.own.clicks,
          eligibleSourceCount,
        )
      : (receipt?.maximumConversions ??
        Math.min(
          initialOverflowCount,
          input.playerView.own.clicks,
          eligibleSourceCount,
        ));
  const remainingConversions = Math.min(
    overflowCount,
    input.playerView.own.clicks,
    eligibleSourceCount,
    reactivatedOverflowCount !== undefined
      ? maximumConversions
      : (receipt?.remainingConversions ?? maximumConversions),
  );
  if (maximumConversions <= 0 || remainingConversions <= 0) return undefined;
  return {
    handPlanId: `resolve-hq-overflow:${turnKey(input)}`,
    phase: "resolve_hq_overflow",
    agendaCount,
    handSize: input.playerView.own.gripOrHq.length,
    maximumHandSize: input.playerView.own.maxHandSize,
    actionIds,
    actionPriorityOrder: actionIds,
    exactActionRoute: true,
    concretePurposeCode:
      "Reduce the known Corp HQ overflow through one exact current non-agenda hand conversion, then observe and revalidate.",
    priorityClass: "P5",
    overflowResolutionState: {
      turnKey: turnKey(input),
      initialOverflowCount,
      maximumConversions,
      remainingConversions,
    },
    value: 120,
    evidenceCode: `corp_hq_overflow_exact_conversion:${overflowCount}`,
  };
}

function corpHqOverflowCandidateIsExactCurrentConversion(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  if (
    candidate.sourceKind !== "card" ||
    !candidate.sourceCardInstanceId ||
    !candidate.sourceDefinitionId ||
    candidate.semanticActionType === "score_conversion.place_advancement" ||
    candidate.semanticActionType === "score_conversion.move_advancement"
  ) {
    return false;
  }
  const source = input.playerView.own.gripOrHq.find(
    (card) => card.instanceId === candidate.sourceCardInstanceId,
  );
  if (isQuotedCorpCounterBankInHq(input, source)) return false;
  const definition = CARD_DEFINITIONS_BY_ID[candidate.sourceDefinitionId];
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  if (
    !source?.known ||
    source.definitionId !== candidate.sourceDefinitionId ||
    !definition ||
    definition.type === "agenda" ||
    action?.side !== "corp" ||
    action.source !== candidate.sourceCardInstanceId ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.timingPoint !== input.playerView.timingPoint ||
    action.targetRequirements.length > 0 ||
    (action.choiceRequirements?.length ?? 0) > 0
  ) {
    return false;
  }
  const totalClicks = action.costs.reduce(
    (sum, cost) => sum + (cost.clicks ?? 0),
    0,
  );
  const totalCredits = action.costs.reduce(
    (sum, cost) => sum + (cost.credits ?? 0),
    0,
  );
  if (
    totalClicks !== 1 ||
    !Number.isSafeInteger(totalCredits) ||
    totalCredits < 0 ||
    totalCredits > input.playerView.own.credits ||
    candidate.costProfile.clickCost !== totalClicks ||
    (candidate.costProfile.creditCost !== undefined &&
      candidate.costProfile.creditCost !== totalCredits)
  ) {
    return false;
  }
  if (action.type === "play_operation") {
    const projection = candidate.economyProjection;
    return (
      projection?.cardsConsumed === 1 &&
      typeof projection.netHandDelta === "number" &&
      projection.netHandDelta <= -1
    );
  }
  // Converting an ICE out of HQ may relieve hand pressure, but choosing a
  // server for that ICE is exclusively corp.defend_servers' responsibility.
  // The hand-management plan must never turn a legal install into an
  // unassessed "discard route" for an arbitrary server.
  if (action.type === "install_card" && action.payload?.placement === "ice")
    return false;
  if (
    action.type !== "install_card" ||
    candidate.semanticActionType !== "install.card" ||
    action.payload?.cardId !== candidate.sourceCardInstanceId ||
    typeof action.payload.serverId !== "string" ||
    action.payload.serverId === "new_remote" ||
    !input.playerView.servers.some(
      (server) => server.id === action.payload!.serverId,
    ) ||
    (action.payload.placement !== "root" &&
      action.payload.placement !== "ice") ||
    !candidateTargetIds(candidate).includes(action.payload.serverId)
  ) {
    return false;
  }
  return true;
}

function corpRemoteCreationLockRemovalAction(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): LegalAction | undefined {
  if (
    candidate.semanticActionType !== "card_ability.trigger" ||
    candidate.costProfile.costKnownStatus !== "known"
  ) {
    return undefined;
  }
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  return action?.targetRequirements.some(
    (requirement) =>
      requirement.id === "newDataFortCreationLockSource" &&
      requirement.kind === "card" &&
      requirement.side === "runner" &&
      requirement.visibility === "public",
  )
    ? action
    : undefined;
}

/**
 * The score plan is the single owner of the next-turn score budget. It accepts
 * only the Engine's private continuation receipt and publishes the resulting
 * cash floor for sibling plans to preserve.
 */
function corpNextTurnScoreContinuationProjects(
  input: AiDecisionInput,
): CorpScoreProjectSignal[] {
  return input.playerView.servers.flatMap((server) =>
    server.root.flatMap((agenda) => {
      const quote = agenda.scoreContinuationQuote;
      if (
        !agenda.known ||
        !visibleCardIsAgenda(input, agenda) ||
        quote?.context !== "installed_agenda" ||
        quote.complete !== true ||
        quote.agendaCardId !== agenda.instanceId ||
        quote.serverId !== server.id ||
        quote.expiresAtStateVersion !== input.playerView.stateVersion ||
        !Number.isSafeInteger(quote.remainingAdvancementCounters) ||
        quote.remainingAdvancementCounters < 0 ||
        !Number.isSafeInteger(quote.creditsRequiredBeforeNextCorpTurn) ||
        quote.creditsRequiredBeforeNextCorpTurn < 0 ||
        !Number.isSafeInteger(quote.nextCorpTurnGuaranteedFlexibleClicks) ||
        quote.nextCorpTurnGuaranteedFlexibleClicks <
          quote.remainingAdvancementCounters ||
        !Number.isSafeInteger(quote.certifiedCreditGainFromFreeClicks) ||
        quote.certifiedCreditGainFromFreeClicks < 0
      ) {
        return [];
      }
      const agendaPoints = requireVisibleAgendaPoints(input, agenda);
      return [
        {
          projectId: corpScoreProjectId(agenda.instanceId, server.id),
          agendaDefinitionId: agenda.definitionId ?? agenda.instanceId,
          agendaPoints,
          agendaInstanceId: agenda.instanceId,
          serverId: server.id,
          phase:
            quote.remainingAdvancementCounters === 0
              ? ("score_agenda" as const)
              : ("advance_agenda" as const),
          sameTurnCloseout: false,
          ...(quote.terminalScore ? { deadlinePressure: true } : {}),
          terminalScore: quote.terminalScore,
          feasible: true,
          continuationReserve: {
            agendaCardId: quote.agendaCardId,
            serverId: quote.serverId,
            requiredCreditsBeforeNextCorpTurn:
              quote.creditsRequiredBeforeNextCorpTurn,
            remainingAdvancementCounters: quote.remainingAdvancementCounters,
            nextCorpTurnGuaranteedFlexibleClicks:
              quote.nextCorpTurnGuaranteedFlexibleClicks,
            certifiedCreditGainFromFreeClicks:
              quote.certifiedCreditGainFromFreeClicks,
          },
          evidenceCode: `engine_certified_next_turn_score_continuation:${agenda.instanceId}:${server.id}`,
        },
      ];
    }),
  );
}

function corpRemoteCreationUnlockScoreProjects(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): CorpScoreProjectSignal[] {
  const action = corpRemoteCreationLockRemovalAction(input, candidate);
  if (
    !action ||
    input.playerView.servers.some((server) => server.id.startsWith("remote_"))
  ) {
    return [];
  }
  return input.playerView.own.gripOrHq.flatMap((card) => {
    if (visibleKnownCardType(input, card) !== "agenda") return [];
    const agendaPoints = requireVisibleAgendaPoints(input, card);
    const projectId = corpScoreProjectId(card.instanceId, "new_remote");
    return [
      {
        projectId,
        agendaDefinitionId: card.definitionId ?? card.instanceId,
        agendaPoints,
        agendaInstanceId: card.instanceId,
        serverId: "new_remote",
        actionIds: [candidate.actionId],
        phase: "unlock_remote_creation",
        sameTurnCloseout: false,
        terminalScore:
          input.playerView.own.agendaPoints + agendaPoints >=
          input.playerView.agendaPointsToWin,
        feasible: true,
        evidenceCode: `corp_score_remote_creation_lock_removal:${card.instanceId}:new_remote`,
      },
    ];
  });
}

function scoreProjectForCandidate(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  scorelineFeasibility: CorpScorelineFeasibility | undefined,
): CorpScoreProjectSignal[] {
  if (candidateIsVisibleCorpAgendaInstall(input, candidate)) {
    const agenda = requireVisibleCandidateSource(input, candidate);
    const agendaDefinitionId =
      candidate.sourceDefinitionId ?? agenda.definitionId;
    if (!agendaDefinitionId) return [];
    const agendaPoints = requireVisibleAgendaPoints(input, agenda);
    const serverId = candidateTargetIds(candidate).find(isCorpInstallServerId);
    const projectId = corpScoreProjectId(
      candidate.sourceCardInstanceId ?? agendaDefinitionId,
      serverId,
    );
    const sameTurnCloseout = corpScorelineActionCanCloseThisTurn(
      scorelineFeasibility,
      candidate.actionId,
    );
    const deadlinePressure =
      scorelineFeasibility?.deadline === "last_draw_window" ||
      scorelineFeasibility?.deadline === "current_turn_only";
    const matchpointTarget =
      input.playerView.own.agendaPoints + agendaPoints >=
      input.playerView.agendaPointsToWin;
    const developmentClickAvailable =
      input.playerView.own.clicks >= 2 || deadlinePressure;
    const scoreActionSemanticsKnown = hasExactNonNegativeCostProfile(candidate);
    const protectionNeed =
      serverId !== undefined && !sameTurnCloseout && scoreActionSemanticsKnown
        ? corpFundedScoreProtectionNeed(
            input,
            candidate,
            agenda,
            projectId,
            serverId,
            matchpointTarget,
            deadlinePressure,
          )
        : undefined;
    const protectedScoreWindow =
      sameTurnCloseout ||
      corpScoreProtectionNeedIsSatisfied(
        input,
        protectionNeed,
        projectId,
        serverId,
      );
    const fundingGap =
      protectionNeed?.baseline.knowledge === "known"
        ? protectionNeed.baseline.minimumAdditionalCreditsToSatisfy
        : undefined;
    const feasible =
      sameTurnCloseout ||
      (scorelineFeasibility?.deadline !== "current_turn_only" &&
        scorelineFeasibility?.feasible !== false &&
        scoreActionSemanticsKnown &&
        developmentClickAvailable &&
        protectedScoreWindow &&
        (fundingGap ?? 0) === 0);
    return [
      {
        projectId,
        agendaDefinitionId,
        agendaPoints,
        ...(candidate.sourceCardInstanceId
          ? { agendaInstanceId: candidate.sourceCardInstanceId }
          : {}),
        actionIds: [candidate.actionId],
        ...(serverId ? { serverId } : {}),
        phase: "install_agenda",
        sameTurnCloseout,
        deadlinePressure,
        ...(protectionNeed ? { protectionNeed } : {}),
        terminalScore: matchpointTarget,
        ...(fundingGap !== undefined && fundingGap > 0 ? { fundingGap } : {}),
        feasible,
        evidenceCode:
          scorelineFeasibility?.deadline === "current_turn_only" &&
          !sameTurnCloseout
            ? `corp_current_turn_scoreline_unreachable:${serverId ?? "unbound"}`
            : !scoreActionSemanticsKnown
              ? `corp_score_protection_assessment_unknown:${serverId ?? "unbound"}:missing_action_semantics`
              : !developmentClickAvailable
                ? `corp_last_click_score_install_deferred:${serverId ?? "unbound"}`
                : protectionNeed?.baseline.knowledge === "unknown"
                  ? `corp_score_protection_assessment_unknown:${serverId ?? "unbound"}:${protectionNeed.baseline.unknownReason}`
                  : fundingGap !== undefined && fundingGap > 0
                    ? `corp_score_protection_funding_gap:${serverId ?? "unbound"}:${fundingGap}`
                    : protectedScoreWindow
                      ? `corp_funded_protected_score_install:${serverId ?? "unbound"}`
                      : `corp_score_protection_required:${serverId ?? "unbound"}`,
      },
    ];
  }
  if (
    candidate.semanticActionType === "score.advance_card" ||
    candidate.semanticActionType === "score.agenda"
  ) {
    const target =
      candidate.sourceCardInstanceId ??
      candidateTargetIds(candidate).find(
        (targetId) => serverForInstalledCard(input, targetId) !== undefined,
      );
    if (!target) {
      if (candidate.semanticActionType !== "score.agenda") return [];
      throw new PlanResolutionFailure("missing_action_semantics", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map((action) => action.type),
        owner: "action_semantics",
        removalCondition:
          "Every legal agenda score action must identify its visible agenda target.",
      });
    }
    const installedCard = visibleInstalledCard(input, target);
    if (
      !installedCard ||
      visibleKnownCardType(input, installedCard) !== "agenda"
    ) {
      return [];
    }
    const serverId = serverForInstalledCard(input, target);
    const projectId = corpScoreProjectId(target, serverId);
    const sameTurnCloseout =
      candidate.semanticActionType === "score.agenda" ||
      corpScorelineActionCanCloseThisTurn(
        scorelineFeasibility,
        candidate.actionId,
      ) ||
      visibleAgendaAdvanceCanCloseThisTurn(input, candidate, installedCard);
    const agendaPoints = requireVisibleAgendaPoints(input, installedCard);
    const matchpointTarget =
      input.playerView.own.agendaPoints + agendaPoints >=
      input.playerView.agendaPointsToWin;
    const scorelineDeadlinePressure =
      scorelineFeasibility?.deadline === "last_draw_window" ||
      scorelineFeasibility?.deadline === "current_turn_only";
    const scoreActionSemanticsKnown =
      candidate.semanticActionType !== "score.advance_card" ||
      hasExactNonNegativeCostProfile(candidate);
    const protectionNeed =
      candidate.semanticActionType === "score.advance_card" &&
      serverId !== undefined &&
      !sameTurnCloseout &&
      scoreActionSemanticsKnown
        ? corpFundedScoreProtectionNeed(
            input,
            candidate,
            installedCard,
            projectId,
            serverId,
            matchpointTarget,
            scorelineDeadlinePressure,
          )
        : undefined;
    const fundedWindowProtected =
      sameTurnCloseout ||
      corpScoreProtectionNeedIsSatisfied(
        input,
        protectionNeed,
        projectId,
        serverId,
      );
    const exposedInstalledAgenda =
      candidate.semanticActionType === "score.advance_card" &&
      protectionNeed !== undefined &&
      !fundedWindowProtected;
    const deadlinePressure =
      scorelineDeadlinePressure || exposedInstalledAgenda;
    const fundingGap =
      protectionNeed?.baseline.knowledge === "known"
        ? protectionNeed.baseline.minimumAdditionalCreditsToSatisfy
        : undefined;
    const feasible =
      sameTurnCloseout ||
      (scorelineFeasibility?.deadline !== "current_turn_only" &&
        scorelineFeasibility?.feasible !== false &&
        scoreActionSemanticsKnown);
    return [
      {
        projectId,
        agendaDefinitionId:
          installedCard.definitionId ?? candidate.sourceDefinitionId ?? target,
        agendaPoints,
        agendaInstanceId: target,
        actionIds: [candidate.actionId],
        ...(serverId ? { serverId } : {}),
        phase:
          candidate.semanticActionType === "score.agenda"
            ? "score_agenda"
            : "advance_agenda",
        sameTurnCloseout,
        deadlinePressure,
        ...(protectionNeed ? { protectionNeed } : {}),
        terminalScore: matchpointTarget,
        ...(fundingGap !== undefined && fundingGap > 0 ? { fundingGap } : {}),
        feasible,
        evidenceCode:
          scorelineFeasibility?.deadline === "current_turn_only" &&
          !sameTurnCloseout
            ? `corp_current_turn_scoreline_unreachable:${serverId ?? "unbound"}`
            : !scoreActionSemanticsKnown
              ? `corp_score_protection_assessment_unknown:${serverId ?? "unbound"}:missing_action_semantics`
              : protectionNeed?.baseline.knowledge === "unknown"
                ? `corp_score_protection_assessment_unknown:${serverId ?? "unbound"}:${protectionNeed.baseline.unknownReason}`
                : fundingGap !== undefined && fundingGap > 0
                  ? `corp_score_protection_funding_gap:${serverId ?? "unbound"}:${fundingGap}`
                  : fundedWindowProtected
                    ? `corp_funded_protected_score_advance:${serverId ?? "unbound"}`
                    : candidate.semanticActionType === "score.advance_card"
                      ? `corp_score_protection_required:${serverId ?? "unbound"}`
                      : "visible_legal_score_conversion",
      },
    ];
  }
  return [];
}

function sameTurnScoreConversionProjectForCandidate(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  directScoreProjects: readonly CorpScoreProjectSignal[],
): CorpScoreProjectSignal | undefined {
  const matchingProjects: CorpScoreProjectSignal[] = [];
  for (const path of corpSameTurnScoreConversionPaths(input)) {
    const step = path.steps[0];
    if (!step || !candidateMatchesScoreConversionStep(input, candidate, step))
      continue;
    const agenda = visibleOwnCardByInstanceId(input, path.agendaCardId);
    if (!agenda)
      throw new PlanResolutionFailure("missing_action_semantics", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map((action) => action.type),
        owner: "action_semantics",
        removalCondition:
          "Every same-turn score conversion path must bind its visible agenda card.",
      });
    const agendaDefinition = requireVisibleCardDefinition(
      input,
      agenda,
      "agenda",
    );
    const visibleHqAgendas = input.playerView.own.gripOrHq.filter((card) =>
      visibleCardIsAgenda(input, card),
    );
    const preventsTerminalSteal =
      input.playerView.opponent.agendaPoints >=
        input.playerView.agendaPointsToWin - 1 &&
      visibleHqAgendas.length === 1 &&
      visibleHqAgendas[0]?.instanceId === path.agendaCardId;
    matchingProjects.push({
      projectId: `agenda:${path.agendaCardId}:${path.targetServerId}`,
      agendaDefinitionId: agendaDefinition.id,
      agendaPoints: path.agendaPoints,
      agendaInstanceId: path.agendaCardId,
      serverId: path.targetServerId,
      actionIds: [candidate.actionId],
      routeSemanticActionTypes: [candidate.semanticActionType],
      phase: scorePhaseForConversionStep(step),
      sameTurnCloseout: true,
      terminalScore:
        input.playerView.own.agendaPoints + path.agendaPoints >=
        input.playerView.agendaPointsToWin,
      ...(preventsTerminalSteal ? { preventsTerminalSteal: true } : {}),
      feasible: true,
      evidenceCode: preventsTerminalSteal
        ? `corp_same_turn_score_conversion_prevents_terminal_steal:${step.kind}`
        : `corp_same_turn_score_conversion:${step.kind}`,
    });
  }
  return matchingProjects.sort((left, right) =>
    compareSameTurnScoreConversionParents(left, right, directScoreProjects),
  )[0];
}

function compareSameTurnScoreConversionParents(
  left: CorpScoreProjectSignal,
  right: CorpScoreProjectSignal,
  directScoreProjects: readonly CorpScoreProjectSignal[],
): number {
  const priorityRank = { P1: 1, P2: 2, P3: 3, P4: 4 } as const;
  const priorityComparison =
    priorityRank[corpScorePriorityClass(left)] -
    priorityRank[corpScorePriorityClass(right)];
  if (priorityComparison !== 0) return priorityComparison;
  const leftDirect = directScoreProjects.find(
    (project) => project.projectId === left.projectId,
  );
  const rightDirect = directScoreProjects.find(
    (project) => project.projectId === right.projectId,
  );
  if (leftDirect?.feasible !== rightDirect?.feasible) {
    return leftDirect?.feasible ? -1 : 1;
  }
  if ((left.serverId === "new_remote") !== (right.serverId === "new_remote")) {
    return left.serverId === "new_remote" ? 1 : -1;
  }
  if (leftDirect && rightDirect) {
    const protectionComparison = compareCorpScoreProtectionProjects(
      leftDirect,
      rightDirect,
    );
    if (protectionComparison !== 0) return protectionComparison;
  }
  return technicalIdCompare(left.projectId, right.projectId);
}

function scorePhaseForConversionStep(
  step: CorpScoreConversionStep,
): CorpScoreProjectSignal["phase"] {
  if (step.kind === "install_score_target") return "install_agenda";
  if (step.kind === "basic_advance") return "advance_agenda";
  if (step.kind === "score_ready") return "score_agenda";
  return "convert_agenda";
}

function candidateMatchesScoreConversionStep(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  step: CorpScoreConversionStep,
): boolean {
  if (step.actionId === candidate.actionId) return true;
  if (
    !step.sourceCardId ||
    step.sourceCardId !== candidate.sourceCardInstanceId
  ) {
    return false;
  }
  const action = input.legalActions.find(
    (candidateAction) => candidateAction.actionId === candidate.actionId,
  );
  const capability = action?.payload?.scoreConversionCapability;
  if (step.kind === "place_advancement")
    return capability === "place_advancement";
  if (step.kind === "move_advancement")
    return capability === "move_advancement";
  return false;
}

function visibleOwnCardByInstanceId(
  input: AiDecisionInput,
  instanceId: string,
): VisibleCard | undefined {
  return [
    ...input.playerView.own.gripOrHq,
    ...input.playerView.own.scoreArea,
    ...(input.playerView.own.rig ?? []),
    ...input.playerView.servers.flatMap((server) => [
      ...server.root,
      ...server.ice,
    ]),
  ].find((card) => card.instanceId === instanceId);
}

function visibleAgendaAdvanceCanCloseThisTurn(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  agenda: VisibleCard,
): boolean {
  if (candidate.semanticActionType !== "score.advance_card") return false;
  const requirement = requireVisibleAgendaAdvancementRequirement(input, agenda);
  const current = agenda.advancementCounters ?? 0;
  const remainingAdvancesAfterAction = Math.max(0, requirement - current - 1);
  const actionCost = candidate.costProfile.creditCost;
  if (!isFiniteNonNegativeInteger(actionCost)) return false;
  return (
    input.playerView.own.clicks >= 1 + remainingAdvancesAfterAction &&
    input.playerView.own.credits >= actionCost + remainingAdvancesAfterAction
  );
}

function remainingAgendaAdvancementCreditsAfterAction(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  agenda: VisibleCard | undefined,
): number {
  const visibleAgenda =
    agenda ?? requireVisibleCandidateSource(input, candidate);
  const requirement = requireVisibleAgendaAdvancementRequirement(
    input,
    visibleAgenda,
  );
  const current = Math.max(0, visibleAgenda.advancementCounters ?? 0);
  const placedByCurrentAction =
    candidate.semanticActionType === "score.advance_card" ? 1 : 0;
  return Math.max(0, requirement - current - placedByCurrentAction);
}

function hasExactNonNegativeCostProfile(
  candidate: ActionSemanticCandidate,
): boolean {
  return (
    isFiniteNonNegativeInteger(candidate.costProfile.creditCost) &&
    isFiniteNonNegativeInteger(candidate.costProfile.clickCost)
  );
}

function isFiniteNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function corpScoreReserveForCandidate(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  agenda: VisibleCard,
  terminalScore: boolean,
  reserveClicksThisTurn: boolean,
): CorpScoreReserve {
  const actionCredits = finiteNonNegativeIntegerOrResolutionFailure(
    input,
    candidate.costProfile.creditCost,
    `Provide an exact non-negative credit cost for score route ${candidate.actionId}.`,
  );
  const actionClicks = finiteNonNegativeIntegerOrResolutionFailure(
    input,
    candidate.costProfile.clickCost,
    `Provide an exact non-negative click cost for score route ${candidate.actionId}.`,
  );
  const remainingAdvancementCredits =
    remainingAgendaAdvancementCreditsAfterAction(input, candidate, agenda);
  const conditionalPostScoreFloor = corpConditionalScoreCreditReserve(
    input,
    agenda,
    terminalScore,
  );
  return {
    creditBreakdown: [
      {
        reserveId: `score_action:${candidate.actionId}`,
        credits: actionCredits,
      },
      {
        reserveId: `remaining_advancement:${agenda.instanceId}`,
        credits: remainingAdvancementCredits,
      },
      {
        reserveId: `post_score_floor:${agenda.instanceId}`,
        credits: conditionalPostScoreFloor,
      },
    ],
    hardClickReserve: reserveClicksThisTurn
      ? actionClicks + remainingAdvancementCredits
      : 0,
  };
}

function finiteNonNegativeIntegerOrResolutionFailure(
  input: AiDecisionInput,
  value: number | undefined,
  removalCondition: string,
): number {
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) {
    return value;
  }
  throw new PlanResolutionFailure("missing_action_semantics", {
    side: input.side,
    stateVersion: input.playerView.stateVersion,
    timingPoint: input.playerView.timingPoint,
    legalActionTypes: input.legalActions.map((action) => action.type),
    owner: "action_semantics",
    removalCondition,
  });
}

function corpFundedScoreProtectionNeed(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  agenda: VisibleCard,
  projectId: string,
  serverId: string,
  terminalScore: boolean,
  reserveClicksThisTurn: boolean,
): CorpFundedRemoteAccessRiskNeed {
  const policy = corpScoreProtectionPolicy(input, agenda);
  const scoreReserve = corpScoreReserveForCandidate(
    input,
    candidate,
    agenda,
    terminalScore,
    reserveClicksThisTurn,
  );
  const server =
    serverId === "new_remote"
      ? undefined
      : input.playerView.servers.find(
          (candidateServer) => candidateServer.id === serverId,
        );
  if (serverId !== "new_remote" && !server) {
    throw new PlanResolutionFailure("step_target_mismatch", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_module",
      removalCondition: `Bind score protection need ${projectId} to visible server ${serverId}.`,
    });
  }
  const serverIce = (server?.ice ?? []).map((ice) => ({
    instanceId: ice.instanceId,
    known: ice.known,
    ...(ice.definitionId ? { definitionId: ice.definitionId } : {}),
    ...(ice.rezzed !== undefined ? { rezzed: ice.rezzed } : {}),
    ...(ice.strength !== undefined ? { strength: ice.strength } : {}),
    ...(ice.subtypes ? { subtypes: ice.subtypes } : {}),
    ...(ice.effectiveRunQuote
      ? { effectiveRunQuote: ice.effectiveRunQuote }
      : {}),
    ...(ice.effectiveRezCostQuote
      ? { effectiveRezCostQuote: ice.effectiveRezCostQuote }
      : {}),
  }));
  const baseline = assessBestFundedCorpScoreProtection({
    serverIce,
    runnerRig: input.playerView.opponent.rig ?? [],
    runnerSetAside: input.playerView.specialZones?.setAside ?? [],
    ...(input.playerView.opponent.memoryUsed !== undefined
      ? { runnerMemoryUsed: input.playerView.opponent.memoryUsed }
      : {}),
    ...(input.playerView.opponent.memoryLimit !== undefined
      ? { runnerMemoryLimit: input.playerView.opponent.memoryLimit }
      : {}),
    runnerCredits: input.playerView.opponent.credits,
    targetServerId:
      serverId as CorpFundedRemoteAccessRiskNeed["targetServerId"],
    observedAtStateVersion: input.playerView.stateVersion,
    availableCorpCredits: input.playerView.own.credits,
    availableCorpClicks: input.playerView.own.clicks,
    scoreReserve,
    maximumRunnerAccessSuccessProbability:
      policy.maximumRunnerAccessSuccessProbability,
  });
  return {
    needId: `score-protection:${projectId}`,
    parentProjectId: projectId,
    targetServerId:
      serverId as CorpFundedRemoteAccessRiskNeed["targetServerId"],
    observedAtStateVersion: input.playerView.stateVersion,
    objective: {
      kind: "funded_remote_access_risk",
      maximumRunnerAccessSuccessProbability:
        policy.maximumRunnerAccessSuccessProbability,
      policySource: policy.policySource,
    },
    scoreReserve,
    baseline,
  };
}

function corpScoreProtectionNeedIsSatisfied(
  input: AiDecisionInput,
  need: CorpFundedRemoteAccessRiskNeed | undefined,
  expectedParentProjectId: string,
  expectedTargetServerId: string | undefined,
): boolean {
  return corpFundedScoreProtectionCertifiesBinding({
    need,
    expectedParentProjectId,
    expectedTargetServerId,
    observedAtStateVersion: input.playerView.stateVersion,
  });
}

function corpScoreProtectionIsSatisfied(
  input: AiDecisionInput,
  project: Pick<
    CorpScoreProjectSignal,
    "projectId" | "serverId" | "protectionNeed"
  >,
): boolean {
  return corpScoreProtectionNeedIsSatisfied(
    input,
    project.protectionNeed,
    project.projectId,
    project.serverId,
  );
}

function corpScoreProjectAssessmentIsUnknown(
  project: CorpScoreProjectSignal,
): boolean {
  return (
    project.evidenceCode.startsWith(
      "corp_score_protection_assessment_unknown:",
    ) || project.protectionNeed?.baseline.knowledge === "unknown"
  );
}

type CorpGlobalDefenseInstallRouteAssessment =
  | Readonly<{
      knowledge: "known";
      disposition: "productive" | "funding_only";
      projection: KnownCorpFundedIceInstallRouteProjection;
    }>
  | Readonly<{
      knowledge: "known";
      disposition: "effect_missing";
      evidenceCode: string;
    }>
  | Readonly<{
      knowledge: "unknown";
      evidenceCode: string;
    }>;

/**
 * Admits a non-score ICE install when the Engine-quoted route improves the
 * exact visible access path. First-layer central coverage and structured,
 * visible ICE defense semantics may also establish qualitative progress when
 * the exact run quote cannot yet express the hidden ICE's encounter effect.
 */
function corpGlobalDefenseInstallRoute(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  serverId: string,
  centralAllocation: CorpCorePlanDomain["centralDefenseAllocation"],
):
  | Readonly<{
      disposition: "productive" | "funding_only";
      projection: KnownCorpFundedIceInstallRouteProjection;
    }>
  | undefined {
  const assessment = corpGlobalDefenseInstallRouteAssessment(
    input,
    candidate,
    serverId,
    centralAllocation,
  );
  return assessment.knowledge === "known" &&
    assessment.disposition !== "effect_missing"
    ? {
        disposition: assessment.disposition,
        projection: assessment.projection,
      }
    : undefined;
}

function corpGlobalDefenseInstallRouteAssessment(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  serverId: string,
  centralAllocation: CorpCorePlanDomain["centralDefenseAllocation"],
): CorpGlobalDefenseInstallRouteAssessment {
  if (serverId === "new_remote") {
    return {
      knowledge: "known",
      disposition: "effect_missing",
      evidenceCode:
        "corp_global_defense_cannot_invent_an_unbound_new_remote_objective",
    };
  }
  if (serverId === "hq" || serverId === "rd") {
    if (centralAllocation?.status !== "known") {
      return {
        knowledge: "unknown",
        evidenceCode:
          "corp_ice_install_assessment_unknown:central_defense_allocation_unknown",
      };
    }
  }
  if (
    serverId === "archives" &&
    !input.playerView.own.heapOrArchives.some(
      (card) => card.known && card.type === "agenda",
    )
  ) {
    return {
      knowledge: "known",
      disposition: "effect_missing",
      evidenceCode: "corp_archives_ice_install_has_no_visible_agenda_pressure",
    };
  }
  if (!hasExactNonNegativeCostProfile(candidate)) {
    return {
      knowledge: "unknown",
      evidenceCode:
        "corp_ice_install_assessment_unknown:install_cost_semantics_unknown",
    };
  }
  const projectedInstallCredits = candidate.costProfile.creditCost;
  const projectedInstallClicks = candidate.costProfile.clickCost;
  if (
    projectedInstallCredits === undefined ||
    projectedInstallClicks === undefined
  ) {
    return {
      knowledge: "unknown",
      evidenceCode:
        "corp_ice_install_assessment_unknown:install_cost_semantics_unknown",
    };
  }
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  const server = input.playerView.servers.find(
    (candidateServer) => candidateServer.id === serverId,
  );
  if (!action || (serverId !== "new_remote" && !server)) {
    return {
      knowledge: "unknown",
      evidenceCode:
        "corp_ice_install_assessment_unknown:action_or_server_binding_unknown",
    };
  }
  if (
    serverId.startsWith("remote_") &&
    server?.root.length === 0 &&
    server.ice.length >= 2
  ) {
    return {
      knowledge: "known",
      disposition: "effect_missing",
      evidenceCode:
        "corp_global_defense_cannot_overlayer_an_unbound_empty_remote",
    };
  }
  const scoreReserve: CorpScoreReserve = {
    creditBreakdown: [],
    hardClickReserve: 0,
  };
  const serverIce = (server?.ice ?? []).map((ice) => ({
    instanceId: ice.instanceId,
    known: ice.known,
    ...(ice.definitionId ? { definitionId: ice.definitionId } : {}),
    ...(ice.rezzed !== undefined ? { rezzed: ice.rezzed } : {}),
    ...(ice.strength !== undefined ? { strength: ice.strength } : {}),
    ...(ice.subtypes ? { subtypes: ice.subtypes } : {}),
    ...(ice.effectiveRunQuote
      ? { effectiveRunQuote: ice.effectiveRunQuote }
      : {}),
    ...(ice.effectiveRezCostQuote
      ? { effectiveRezCostQuote: ice.effectiveRezCostQuote }
      : {}),
  }));
  const maximumRunnerAccessSuccessProbability = {
    numerator: 1,
    denominator: 2,
  };
  const baseline = assessBestFundedCorpScoreProtection({
    serverIce,
    runnerRig: input.playerView.opponent.rig ?? [],
    runnerSetAside: input.playerView.specialZones?.setAside ?? [],
    ...(input.playerView.opponent.memoryUsed !== undefined
      ? { runnerMemoryUsed: input.playerView.opponent.memoryUsed }
      : {}),
    ...(input.playerView.opponent.memoryLimit !== undefined
      ? { runnerMemoryLimit: input.playerView.opponent.memoryLimit }
      : {}),
    runnerCredits: input.playerView.opponent.credits,
    targetServerId:
      serverId as CorpFundedRemoteAccessRiskNeed["targetServerId"],
    observedAtStateVersion: input.playerView.stateVersion,
    availableCorpCredits: input.playerView.own.credits,
    availableCorpClicks: input.playerView.own.clicks,
    scoreReserve,
    maximumRunnerAccessSuccessProbability,
  });
  if (baseline.knowledge === "unknown") {
    return {
      knowledge: "unknown",
      evidenceCode: `corp_ice_install_assessment_unknown:${baseline.unknownReason}`,
    };
  }
  if (
    compareExactProbabilities(
      baseline.protection.runnerAccessSuccessProbability,
      { numerator: 0, denominator: 1 },
    ) === 0
  ) {
    return {
      knowledge: "known",
      disposition: "effect_missing",
      evidenceCode:
        "corp_ice_install_cannot_reduce_engine_certified_zero_access_probability",
    };
  }
  const need: CorpFundedRemoteAccessRiskNeed = {
    needId: `global-defense-access:${serverId}`,
    parentProjectId: `defend_servers:${serverId}`,
    targetServerId:
      serverId as CorpFundedRemoteAccessRiskNeed["targetServerId"],
    observedAtStateVersion: input.playerView.stateVersion,
    objective: {
      kind: "funded_remote_access_risk",
      maximumRunnerAccessSuccessProbability,
      policySource: "corp_global_defense_visible_access_risk",
    },
    scoreReserve,
    baseline,
  };
  const sourceDefense = visibleCorpIceDefenseProfile(
    input.playerView.own.gripOrHq.find(
      (card) => card.instanceId === action.source,
    ),
  );
  const isEmptyCentral =
    (serverId === "hq" || serverId === "rd") && serverIce.length === 0;
  const selectedCentralEvidence =
    centralAllocation?.status === "known" &&
    centralAllocation.selectedServerId === serverId &&
    (serverId === "hq" || serverId === "rd")
      ? centralAllocation.evidence[serverId]
      : undefined;
  const otherCentralAlreadyProtected =
    serverId === "hq" || serverId === "rd"
      ? (input.playerView.servers.find(
          (candidateServer) =>
            candidateServer.id === (serverId === "hq" ? "rd" : "hq"),
        )?.ice.length ?? 0) > 0
      : false;
  const hasSelectedCentralPressure =
    selectedCentralEvidence !== undefined &&
    (selectedCentralEvidence.recentRunOrAccessEvents > 0 ||
      selectedCentralEvidence.recentSuccessfulAccessRunnerTurns > 0 ||
      selectedCentralEvidence.serverBoundEffectIds.length > 0);
  const hasStructuredDefenseValue =
    sourceDefense.hasImmediateStop ||
    sourceDefense.hasMeaningfulTaxOrDamage ||
    sourceDefense.hasEncounterDisruption;
  const establishesMissingCentralCoverage =
    isEmptyCentral &&
    otherCentralAlreadyProtected &&
    sourceDefense.isVisibleIce &&
    (isCorpOpeningTurnSerial(input.playerView.turnSerial) ||
      hasStructuredDefenseValue);
  const hasResidentRemoteAgenda = input.playerView.servers.some(
    (candidateServer) =>
      candidateServer.id.startsWith("remote_") &&
      candidateServer.root.some((card) => card.known && card.type === "agenda"),
  );
  const preferQualitativeSourceProgress =
    isEmptyCentral &&
    !hasResidentRemoteAgenda &&
    (establishesMissingCentralCoverage ||
      (hasSelectedCentralPressure && hasStructuredDefenseValue));
  const projection = projectCorpFundedIceInstallRoute({
    need,
    action,
    currentStateVersion: input.playerView.stateVersion,
    currentCorpCredits: input.playerView.own.credits,
    currentCorpClicks: input.playerView.own.clicks,
    visibleCorpHand: input.playerView.own.gripOrHq,
    ...(server ? { currentServer: { id: server.id, ice: serverIce } } : {}),
    runnerRig: input.playerView.opponent.rig ?? [],
    runnerSetAside: input.playerView.specialZones?.setAside ?? [],
    ...(input.playerView.opponent.memoryUsed !== undefined
      ? { runnerMemoryUsed: input.playerView.opponent.memoryUsed }
      : {}),
    ...(input.playerView.opponent.memoryLimit !== undefined
      ? { runnerMemoryLimit: input.playerView.opponent.memoryLimit }
      : {}),
    runnerCredits: input.playerView.opponent.credits,
    projectedInstallCredits,
    projectedInstallClicks,
    ...(preferQualitativeSourceProgress
      ? { preferPostInstallSourceProgress: true }
      : {}),
  });
  if (projection.knowledge !== "known") {
    return {
      knowledge: "unknown",
      evidenceCode: `corp_ice_install_assessment_unknown:${projection.unknownReason}`,
    };
  }
  if (
    projection.preservesReserves &&
    (projection.effect === "progress" || projection.effect === "satisfied")
  ) {
    return { knowledge: "known", disposition: "productive", projection };
  }
  const qualitativeProgressHasNoKnownFundingGap =
    (projection.after.minimumAdditionalCreditsToSatisfy ?? 0) === 0 &&
    (projection.after.minimumAdditionalClicksToSatisfy ?? 0) === 0;
  if (
    projection.preservesReserves &&
    preferQualitativeSourceProgress &&
    qualitativeProgressHasNoKnownFundingGap
  ) {
    return { knowledge: "known", disposition: "productive", projection };
  }
  return knownInstallRouteHasUsefulEffectBlockedByFunding(projection)
    ? {
        knowledge: "known",
        disposition: "funding_only",
        projection,
      }
    : {
        knowledge: "known",
        disposition: "effect_missing",
        evidenceCode:
          "corp_ice_install_has_no_engine_certified_access_probability_reduction",
      };
}

function compareCorpScoreProtectionProjects(
  left: CorpScoreProjectSignal,
  right: CorpScoreProjectSignal,
): number {
  if (left.terminalScore !== right.terminalScore) {
    return left.terminalScore ? -1 : 1;
  }
  const leftInstalled = left.phase !== "install_agenda";
  const rightInstalled = right.phase !== "install_agenda";
  if (leftInstalled !== rightInstalled) return leftInstalled ? -1 : 1;
  const leftProbability =
    left.protectionNeed?.objective.maximumRunnerAccessSuccessProbability;
  const rightProbability =
    right.protectionNeed?.objective.maximumRunnerAccessSuccessProbability;
  if (leftProbability && rightProbability) {
    const comparison = compareExactProbabilities(
      leftProbability,
      rightProbability,
    );
    if (comparison !== undefined && comparison !== 0) return comparison;
  }
  const leftBaseline = left.protectionNeed?.baseline;
  const rightBaseline = right.protectionNeed?.baseline;
  if (leftBaseline?.knowledge !== rightBaseline?.knowledge) {
    return leftBaseline?.knowledge === "known" ? -1 : 1;
  }
  if (
    leftBaseline?.knowledge === "known" &&
    rightBaseline?.knowledge === "known"
  ) {
    const currentRiskComparison = compareExactProbabilities(
      leftBaseline.protection.runnerAccessSuccessProbability,
      rightBaseline.protection.runnerAccessSuccessProbability,
    );
    if (currentRiskComparison !== undefined && currentRiskComparison !== 0) {
      return currentRiskComparison;
    }
  }
  return technicalIdCompare(left.projectId, right.projectId);
}

function technicalIdCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

type CorpProductiveScoreProtectionInstallRoute = Readonly<{
  project: CorpScoreProjectSignal;
  candidate: ActionSemanticCandidate;
  projection: KnownCorpFundedIceInstallRouteProjection & {
    effect: "progress" | "satisfied";
  };
}>;

function isProductiveKnownScoreProtectionInstallProjection(
  projection: CorpFundedIceInstallRouteProjection,
): projection is KnownCorpFundedIceInstallRouteProjection & {
  effect: "progress" | "satisfied";
} {
  return (
    projection.knowledge === "known" &&
    (projection.effect === "progress" || projection.effect === "satisfied")
  );
}

type CorpScoreProtectionInstallRouteScan = Readonly<{
  productiveRoutes: readonly CorpProductiveScoreProtectionInstallRoute[];
  fundingGap?: number;
  directInstallRouteState:
    | Readonly<{
        knowledge: "known";
        disposition: "productive" | "effect_missing" | "funding_only";
      }>
    | Readonly<{ knowledge: "unknown" }>;
}>;

function corpScoreProtectionInstallRouteScan(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  project: CorpScoreProjectSignal,
): CorpScoreProtectionInstallRouteScan {
  const need = project.protectionNeed;
  if (!need || corpScoreProtectionIsSatisfied(input, project)) {
    return {
      productiveRoutes: [],
      directInstallRouteState: {
        knowledge: "known",
        disposition: "effect_missing",
      },
    };
  }
  if (need.baseline.knowledge === "unknown") {
    return {
      productiveRoutes: [],
      directInstallRouteState: { knowledge: "unknown" },
    };
  }
  const currentServer =
    need.targetServerId === "new_remote"
      ? undefined
      : input.playerView.servers.find(
          (server) => server.id === need.targetServerId,
        );
  if (need.targetServerId !== "new_remote" && !currentServer) {
    throw new PlanResolutionFailure("step_target_mismatch", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_module",
      removalCondition: `Bind score protection route ${need.needId} to its visible target server.`,
    });
  }
  const evaluatedRoutes = candidates.flatMap((candidate) => {
    if (!candidateIsVisibleCorpIceInstall(input, candidate)) return [];
    const action = input.legalActions.find(
      (legalAction) => legalAction.actionId === candidate.actionId,
    );
    if (!action || action.payload?.serverId !== need.targetServerId) return [];
    const projectedInstallCredits = finiteNonNegativeIntegerOrResolutionFailure(
      input,
      candidate.costProfile.creditCost,
      `Provide exact ICE-install credits for ${candidate.actionId}.`,
    );
    const projectedInstallClicks = finiteNonNegativeIntegerOrResolutionFailure(
      input,
      candidate.costProfile.clickCost,
      `Provide exact ICE-install clicks for ${candidate.actionId}.`,
    );
    const projection = projectCorpFundedIceInstallRoute({
      need,
      action,
      currentStateVersion: input.playerView.stateVersion,
      currentCorpCredits: input.playerView.own.credits,
      currentCorpClicks: input.playerView.own.clicks,
      visibleCorpHand: input.playerView.own.gripOrHq,
      ...(currentServer
        ? {
            currentServer: {
              id: currentServer.id,
              ice: currentServer.ice.map((ice) => ({
                instanceId: ice.instanceId,
                known: ice.known,
                ...(ice.definitionId ? { definitionId: ice.definitionId } : {}),
                ...(ice.rezzed !== undefined ? { rezzed: ice.rezzed } : {}),
                ...(ice.strength !== undefined
                  ? { strength: ice.strength }
                  : {}),
                ...(ice.subtypes ? { subtypes: ice.subtypes } : {}),
                ...(ice.effectiveRunQuote
                  ? { effectiveRunQuote: ice.effectiveRunQuote }
                  : {}),
                ...(ice.effectiveRezCostQuote
                  ? { effectiveRezCostQuote: ice.effectiveRezCostQuote }
                  : {}),
              })),
            },
          }
        : {}),
      runnerRig: input.playerView.opponent.rig ?? [],
      runnerSetAside: input.playerView.specialZones?.setAside ?? [],
      ...(input.playerView.opponent.memoryUsed !== undefined
        ? { runnerMemoryUsed: input.playerView.opponent.memoryUsed }
        : {}),
      ...(input.playerView.opponent.memoryLimit !== undefined
        ? { runnerMemoryLimit: input.playerView.opponent.memoryLimit }
        : {}),
      runnerCredits: input.playerView.opponent.credits,
      projectedInstallCredits,
      projectedInstallClicks,
    });
    return [
      {
        candidate,
        action,
        projection,
        projectedInstallCredits,
      },
    ];
  });
  const anyUnknown = evaluatedRoutes.some(
    ({ projection }) => projection.knowledge === "unknown",
  );
  const exactFundingGaps = evaluatedRoutes.flatMap(({ projection }) => {
    if (
      projection.knowledge !== "known" ||
      !knownInstallRouteHasUsefulEffectBlockedByFunding(projection)
    ) {
      return [];
    }
    const gap = projection.after.minimumAdditionalCreditsToSatisfy;
    return typeof gap === "number" && Number.isSafeInteger(gap) && gap > 0
      ? [gap]
      : [];
  });
  const productiveRoutes: CorpProductiveScoreProtectionInstallRoute[] =
    evaluatedRoutes.flatMap(({ candidate, projection }) => {
      if (!isProductiveKnownScoreProtectionInstallProjection(projection)) {
        return [];
      }
      return [
        {
          project,
          candidate,
          projection,
        },
      ];
    });
  return {
    productiveRoutes,
    ...(exactFundingGaps.length > 0
      ? { fundingGap: Math.min(...exactFundingGaps) }
      : {}),
    directInstallRouteState: anyUnknown
      ? { knowledge: "unknown" }
      : {
          knowledge: "known",
          disposition:
            productiveRoutes.length > 0
              ? "productive"
              : need.baseline.protection.protectsScore ||
                  evaluatedRoutes.some(({ projection }) =>
                    knownInstallRouteHasUsefulEffectBlockedByFunding(
                      projection,
                    ),
                  )
                ? "funding_only"
                : "effect_missing",
        },
  };
}

function corpScoreProtectionStagingInstallSignal(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  project: CorpScoreProjectSignal,
  scan: CorpScoreProtectionInstallRouteScan,
):
  | Extract<CorpDefenseSignal, { kind: "score_protection_staging_install" }>
  | undefined {
  const need = project.protectionNeed;
  if (
    project.serverId !== "new_remote" ||
    need?.targetServerId !== "new_remote" ||
    need.baseline.knowledge !== "unknown" ||
    need.baseline.unknownReason !== "subset_assessment_unknown" ||
    scan.directInstallRouteState.knowledge !== "unknown" ||
    !candidateIsVisibleCorpIceInstall(input, candidate) ||
    !candidate.sourceCardInstanceId ||
    !candidate.sourceDefinitionId ||
    !candidateTargetIds(candidate).includes("new_remote")
  ) {
    return undefined;
  }
  const source = visibleOwnCardByInstanceId(
    input,
    candidate.sourceCardInstanceId,
  );
  const definition = CARD_DEFINITIONS_BY_ID[candidate.sourceDefinitionId];
  if (
    source?.definitionId !== candidate.sourceDefinitionId ||
    definition?.type !== "ice" ||
    !definition.mechanics.includes("end_the_run")
  ) {
    return undefined;
  }
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  if (
    action?.side !== "corp" ||
    action.type !== "install_card" ||
    action.source !== candidate.sourceCardInstanceId ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.timingPoint !== input.playerView.timingPoint ||
    action.payload?.placement !== "ice" ||
    action.payload.serverId !== "new_remote" ||
    action.targetRequirements.length > 0 ||
    (action.choiceRequirements?.length ?? 0) > 0
  ) {
    return undefined;
  }
  const totalClicks = action.costs.reduce(
    (sum, cost) => sum + (cost.clicks ?? 0),
    0,
  );
  const totalCredits = action.costs.reduce(
    (sum, cost) => sum + (cost.credits ?? 0),
    0,
  );
  if (
    totalClicks !== 1 ||
    !Number.isSafeInteger(totalCredits) ||
    totalCredits < 0 ||
    totalCredits > input.playerView.own.credits ||
    candidate.costProfile.clickCost !== totalClicks ||
    candidate.costProfile.creditCost !== totalCredits ||
    candidate.costProfile.additionalCosts.length > 0
  ) {
    return undefined;
  }
  return {
    kind: "score_protection_staging_install",
    defenseId: `score-protection-staging-install:${project.projectId}:${candidate.actionId}`,
    serverId: "new_remote",
    phase: "install_ice",
    parentProjectId: project.projectId,
    parentNeedId: need.needId,
    delegatedPriorityClass: corpScorePriorityClass(project),
    actionId: candidate.actionId,
    sourceCardInstanceId: candidate.sourceCardInstanceId,
    sourceDefinitionId: candidate.sourceDefinitionId,
    evidenceCode: `score_protection_staging_install:${project.projectId}:new_remote`,
  };
}

function knownInstallRouteHasUsefulEffectBlockedByFunding(
  projection: CorpFundedIceInstallRouteProjection,
): boolean {
  if (
    projection.knowledge !== "known" ||
    projection.funded ||
    projection.before.knowledge !== "known"
  ) {
    return false;
  }
  const minimumSatisfyingRezCosts = projection.after.minimumSatisfyingRezCosts;
  const minimumSatisfyingProtection =
    projection.after.minimumSatisfyingProtection;
  const sourceContributesToMinimumSatisfyingSelection =
    minimumSatisfyingRezCosts?.some(
      (cost) => cost.iceInstanceId === projection.sourceCardInstanceId,
    ) === true;
  const riskComparison = compareExactProbabilities(
    minimumSatisfyingProtection?.runnerAccessSuccessProbability ??
      projection.after.protection.runnerAccessSuccessProbability,
    projection.before.protection.runnerAccessSuccessProbability,
  );
  const exactFundingGap = projection.after.minimumAdditionalCreditsToSatisfy;
  const exactSatisfyingRezCost = projection.after.minimumSatisfyingRezCost;
  return (
    sourceContributesToMinimumSatisfyingSelection &&
    (riskComparison === -1 ||
      (projection.before.protection.protectsScore === false &&
        minimumSatisfyingProtection?.protectsScore === true)) &&
    typeof exactFundingGap === "number" &&
    Number.isSafeInteger(exactFundingGap) &&
    exactFundingGap > 0 &&
    typeof exactSatisfyingRezCost === "number" &&
    Number.isSafeInteger(exactSatisfyingRezCost) &&
    exactSatisfyingRezCost >= 0
  );
}

function corpScoreProjectId(
  agendaInstanceOrDefinitionId: string,
  serverId: string | undefined,
): string {
  return `agenda:${agendaInstanceOrDefinitionId}:${serverId ?? "unbound"}`;
}

function visibleCardIsAgenda(
  input: AiDecisionInput,
  card: VisibleCard,
): boolean {
  return visibleKnownCardType(input, card) === "agenda";
}

function visibleKnownCardType(
  input: AiDecisionInput,
  card: VisibleCard,
): string | undefined {
  if (!card.known) return undefined;
  if (!card.definitionId || !card.type)
    throw new PlanResolutionFailure("invalid_player_view_card_projection", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "rules_contract",
      removalCondition:
        "Every own known card must expose both definitionId and type in PlayerView.",
    });
  const definition = CARD_DEFINITIONS_BY_ID[card.definitionId];
  if (!definition?.type)
    throw new PlanResolutionFailure("missing_card_definition", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "rules_contract",
      removalCondition: `Provide an authoritative typed card definition for ${card.definitionId}.`,
    });
  if (definition.type !== card.type)
    throw new PlanResolutionFailure("invalid_player_view_card_projection", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "rules_contract",
      removalCondition: `Make PlayerView type match the authoritative definition for ${card.definitionId}.`,
    });
  return card.type;
}

function requireVisibleCandidateSource(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): VisibleCard {
  const sourceId = candidate.sourceCardInstanceId;
  const visibleSource = sourceId
    ? visibleOwnCardByInstanceId(input, sourceId)
    : undefined;
  if (visibleSource) return visibleSource;
  throw new PlanResolutionFailure("missing_action_semantics", {
    side: input.side,
    stateVersion: input.playerView.stateVersion,
    timingPoint: input.playerView.timingPoint,
    legalActionTypes: input.legalActions.map((action) => action.type),
    owner: "action_semantics",
    removalCondition:
      "Every card-sourced install or rez candidate must bind its visible sourceCardInstanceId.",
  });
}

function corpConditionalScoreCreditReserve(
  input: AiDecisionInput,
  agenda: VisibleCard,
  terminalScore: boolean,
): number {
  if (terminalScore) return 0;
  const definition = requireVisibleCardDefinition(input, agenda, "agenda");
  const hint = AI_HINTS_BY_CARD.get(definition.id);
  const requiresThreshold =
    hint?.tacticSignals?.includes("risk.requires_corp_credit_threshold") ===
    true;
  const crashesBelowThreshold =
    hint?.tacticSignals?.includes("risk.economy_crash_on_score") === true;
  if (!requiresThreshold && !crashesBelowThreshold) return 0;
  if (!requiresThreshold || !crashesBelowThreshold)
    throw new PlanResolutionFailure("missing_card_definition", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "rules_contract",
      removalCondition: `Define both conditional score-threshold risk signals for ${definition.id}.`,
    });
  const thresholdEffect = hint?.effects?.find(
    (effect) =>
      effect.kind === "economy" &&
      effect.timing === "when_scored" &&
      effect.scope === "corp" &&
      effect.resource === "credits",
  );
  const threshold = thresholdEffect?.amount;
  if (
    typeof threshold !== "number" ||
    !Number.isFinite(threshold) ||
    threshold <= 0
  )
    throw new PlanResolutionFailure("missing_card_definition", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "rules_contract",
      removalCondition: `Define a finite positive conditional score credit threshold for ${definition.id}.`,
    });
  return threshold;
}

function corpScoreProtectionPolicy(
  input: AiDecisionInput,
  agenda: VisibleCard,
): {
  maximumRunnerAccessSuccessProbability: {
    numerator: number;
    denominator: number;
  };
  policySource: string;
} {
  const agendaPoints = requireVisibleAgendaPoints(input, agenda);
  const terminalStealRisk =
    input.playerView.opponent.agendaPoints + agendaPoints >=
    input.playerView.agendaPointsToWin;
  const urgentRushPressure =
    input.playerView.opponent.agendaPoints >=
    input.playerView.agendaPointsToWin - 3;
  if (!terminalStealRisk && urgentRushPressure) {
    return {
      maximumRunnerAccessSuccessProbability: {
        numerator: 1,
        denominator: 2,
      },
      policySource: "corp_score_rush_moderate_access_risk",
    };
  }
  return {
    maximumRunnerAccessSuccessProbability: {
      numerator: 1,
      denominator: 4,
    },
    policySource: terminalStealRisk
      ? "corp_terminal_steal_strict_access_risk"
      : "corp_score_default_strict_access_risk",
  };
}

function requireVisibleAgendaPoints(
  input: AiDecisionInput,
  card: VisibleCard,
): number {
  const definition = requireVisibleCardDefinition(input, card, "agenda");
  if (card.agendaPoints !== undefined && !Number.isFinite(card.agendaPoints))
    throw new PlanResolutionFailure("invalid_player_view_card_projection", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "rules_contract",
      removalCondition: `Project a finite agenda-point value for ${definition.id}.`,
    });
  const agendaPoints = card.agendaPoints ?? definition.agendaPoints;
  if (typeof agendaPoints !== "number" || !Number.isFinite(agendaPoints))
    throw new PlanResolutionFailure("missing_card_definition", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "rules_contract",
      removalCondition: `Provide agenda points for ${definition.id}.`,
    });
  return agendaPoints;
}

function requireVisibleAgendaAdvancementRequirement(
  input: AiDecisionInput,
  card: VisibleCard,
): number {
  const definition = requireVisibleCardDefinition(input, card, "agenda");
  if (
    card.advancementRequirement !== undefined &&
    !Number.isFinite(card.advancementRequirement)
  )
    throw new PlanResolutionFailure("invalid_player_view_card_projection", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "rules_contract",
      removalCondition: `Project a finite effective advancement requirement for ${definition.id}.`,
    });
  const requirement =
    card.advancementRequirement ?? definition.advancementRequirement;
  if (typeof requirement !== "number" || !Number.isFinite(requirement))
    throw new PlanResolutionFailure("missing_card_definition", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "rules_contract",
      removalCondition: `Provide an advancement requirement for ${definition.id}.`,
    });
  return requirement;
}

function postInstallCorpIceRezCost(
  input: AiDecisionInput,
  action: LegalAction,
  sourceCardInstanceId: string,
  serverId: VisibleCorpRezCostQuote["targetServerId"],
): number | undefined {
  const payload = action.payload;
  const baseCredits = payload?.postInstallRezQuoteBaseCredits;
  const finalCredits = payload?.postInstallRezQuoteFinalCredits;
  if (
    payload?.postInstallRezQuoteComplete !== true ||
    payload.postInstallRezQuoteCardId !== sourceCardInstanceId ||
    payload.postInstallRezQuoteTargetServerId !== serverId ||
    payload.postInstallRezQuoteProjectedServerId !== serverId ||
    payload.postInstallRezQuoteExpiresAtStateVersion !==
      input.playerView.stateVersion ||
    !Number.isSafeInteger(baseCredits) ||
    (baseCredits as number) < 0 ||
    !Number.isSafeInteger(finalCredits) ||
    (finalCredits as number) < 0 ||
    payload.postInstallRezQuoteMandatoryAgendaPointCost !== 0 ||
    payload.postInstallRezQuoteMandatoryAdditionalCostKind !== undefined
  ) {
    return undefined;
  }
  return finalCredits as number;
}

function requireVisibleCardDefinition(
  input: AiDecisionInput,
  card: VisibleCard,
  expectedType: "agenda" | "ice",
): CardDefinition {
  const actualType = visibleKnownCardType(input, card);
  if (actualType !== expectedType)
    throw new PlanResolutionFailure("step_capability_mismatch", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_module",
      removalCondition: `Bind the ${expectedType} plan step to a visible ${expectedType} card.`,
    });
  const definition = CARD_DEFINITIONS_BY_ID[card.definitionId!];
  if (!definition)
    throw new PlanResolutionFailure("missing_card_definition", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "rules_contract",
      removalCondition: `Provide an authoritative definition for ${card.definitionId}.`,
    });
  return definition;
}

function corpEconomyDevelopmentCampaigns(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): CorpCorePlanDomain["economyNeeds"] {
  const signals: CorpCorePlanDomain["economyNeeds"] = [];
  const addCampaign = (card: VisibleCard, phase: "install" | "rez"): void => {
    if (
      !card.known ||
      !card.definitionId ||
      visibleKnownCardType(input, card) !== "asset"
    ) {
      return;
    }
    const definition = CARD_DEFINITIONS_BY_ID[card.definitionId];
    const hint = AI_HINTS_BY_CARD.get(card.definitionId);
    if (
      phase === "rez" &&
      definition?.side === "corp" &&
      definition.type === "asset"
    ) {
      const candidate = candidates.find(
        (entry) =>
          entry.sourceCardInstanceId === card.instanceId &&
          entry.sourceDefinitionId === card.definitionId &&
          entry.semanticActionType === "corp_window.rez",
      );
      const action = candidate
        ? input.legalActions.find(
            (legalAction) => legalAction.actionId === candidate.actionId,
          )
        : undefined;
      const outcome =
        candidate && action
          ? rootRezCreditOutcomeProjectionStatus(candidate, action)
          : undefined;
      if (candidate && outcome?.status === "guaranteed_positive") {
        signals.push({
          kind: "develop_campaign",
          needId: `economy-campaign:${card.instanceId}`,
          sourceInstanceId: card.instanceId,
          sourceDefinitionId: card.definitionId,
          phase,
          actionIds: [candidate.actionId],
          cadence: {
            kind: "immediate_on_rez",
            maximumSetupExecutions: 1,
          },
          payback: {
            projectedCredits: outcome.grossCreditGain,
            setupCreditCost: outcome.rezCredits,
            projectedNetCredits: outcome.netCreditGain,
            horizonTurns: 0,
          },
          completion: {
            kind: "source_phase_reached",
            expectedState: "installed_rezzed",
          },
          urgentForScore: false,
          evidenceCode:
            "corp_engine_certified_immediate_root_rez_credit_conversion",
        });
      }
      return;
    }
    if (
      definition?.side !== "corp" ||
      definition.type !== "asset" ||
      hint?.planRoles?.includes("remote_asset_economy") !== true ||
      hint.quality?.hintReviewed !== true ||
      hint.quality.strategyCovered !== true ||
      hint.quality.confidence !== "high"
    ) {
      return;
    }
    const finitePoolCredits = Math.max(
      0,
      ...(hint.effects ?? [])
        .filter(
          (effect) =>
            effect.kind === "finite_economy_pool" &&
            typeof effect.amount === "number" &&
            effect.amount > 0,
        )
        .map((effect) => effect.amount!),
    );
    const automaticStartOfTurnCredits = Math.max(
      0,
      ...(hint.effects ?? [])
        .filter(
          (effect) =>
            (effect.kind === "start_of_turn_economy" ||
              effect.kind === "recurring_economy") &&
            effect.timing === "start_of_turn" &&
            typeof effect.amount === "number" &&
            effect.amount > 0,
        )
        .map((effect) => effect.amount!),
    );
    if (finitePoolCredits <= 0 && automaticStartOfTurnCredits <= 0) return;

    const cadence =
      finitePoolCredits > 0
        ? ("finite_pool" as const)
        : ("automatic_start_of_turn" as const);
    const horizonTurns = 3;
    const projectedCredits =
      cadence === "finite_pool"
        ? finitePoolCredits
        : automaticStartOfTurnCredits * horizonTurns;
    const setupCreditCost =
      (phase === "install" ? (definition.installCost ?? 0) : 0) +
      (definition.rezCost ?? 0);
    const projectedNetCredits = projectedCredits - setupCreditCost;
    if (projectedNetCredits < 2) return;

    const expectedSemanticActionType =
      phase === "install" ? "install.card" : "corp_window.rez";
    const actionIds = candidates
      .filter(
        (candidate) =>
          candidate.sourceCardInstanceId === card.instanceId &&
          candidate.sourceDefinitionId === card.definitionId &&
          candidate.semanticActionType === expectedSemanticActionType,
      )
      .map((candidate) => candidate.actionId);
    signals.push({
      kind: "develop_campaign",
      needId: `economy-campaign:${card.instanceId}`,
      sourceInstanceId: card.instanceId,
      sourceDefinitionId: card.definitionId,
      phase,
      actionIds,
      cadence: {
        kind: cadence,
        maximumSetupExecutions: 1,
      },
      payback: {
        projectedCredits,
        setupCreditCost,
        projectedNetCredits,
        horizonTurns,
      },
      completion: {
        kind: "source_phase_reached",
        expectedState:
          phase === "install" ? "installed_unrezzed" : "installed_rezzed",
      },
      urgentForScore: false,
      evidenceCode: `corp_visible_economy_campaign:${card.definitionId}:${phase}`,
    });
  };

  for (const card of input.playerView.own.gripOrHq) {
    addCampaign(card, "install");
  }
  for (const server of input.playerView.servers) {
    if (!server.id.startsWith("remote_")) continue;
    for (const card of server.root) {
      if (card.rezzed !== true) addCampaign(card, "rez");
    }
  }
  return uniqueBy(signals, (signal) => signal.needId);
}

function corpImmediateOperationEconomyConversions(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): CorpEconomyImmediateOperationSignal[] {
  const hqByInstanceId = new Map(
    input.playerView.own.gripOrHq.map((card) => [card.instanceId, card]),
  );
  const legalActionsById = new Map(
    input.legalActions.map((action) => [action.actionId, action]),
  );
  const signals = candidates.flatMap((candidate) => {
    const sourceInstanceId = candidate.sourceCardInstanceId;
    const sourceDefinitionId = candidate.sourceDefinitionId;
    const sourceCard = sourceInstanceId
      ? hqByInstanceId.get(sourceInstanceId)
      : undefined;
    const action = legalActionsById.get(candidate.actionId);
    const projection = candidate.economyProjection;
    const grossLiquidCreditGain = projection?.grossLiquidCreditGain;
    const netLiquidCreditGain = projection?.netLiquidCreditGain;
    if (
      !sourceInstanceId ||
      !sourceDefinitionId ||
      !sourceCard?.known ||
      sourceCard.definitionId !== sourceDefinitionId ||
      visibleKnownCardType(input, sourceCard) !== "operation" ||
      action?.type !== "play_operation" ||
      candidate.sourceKind !== "card" ||
      candidate.semanticActionType !== "economy.gain_credit" ||
      candidate.costProfile.costKnownStatus !== "known" ||
      candidate.costProfile.additionalCosts.length > 0 ||
      candidate.targetContext?.selectedTargets.length ||
      candidate.projectionIssues.length > 0 ||
      candidate.hardGates.some((gate) => gate.status === "block") ||
      projection?.kind !== "immediate_liquid" ||
      projection.timing !== "immediate" ||
      projection.creditRestriction !== "general" ||
      projection.payoutMode !== "fixed" ||
      projection.reliability !== "guaranteed" ||
      projection.source !== "legal_action_payload" ||
      projection.confidence !== "high" ||
      projection.cardsConsumed !== 1 ||
      !Number.isSafeInteger(projection.clickCost) ||
      projection.clickCost !== candidate.costProfile.clickCost ||
      projection.clickCost <= 0 ||
      !Number.isSafeInteger(projection.creditCost) ||
      projection.creditCost !== candidate.costProfile.creditCost ||
      projection.creditCost < 0 ||
      typeof grossLiquidCreditGain !== "number" ||
      !Number.isSafeInteger(grossLiquidCreditGain) ||
      typeof netLiquidCreditGain !== "number" ||
      !Number.isSafeInteger(netLiquidCreditGain) ||
      netLiquidCreditGain < 2 ||
      grossLiquidCreditGain - projection.creditCost !== netLiquidCreditGain ||
      !Number.isSafeInteger(projection.cardsDrawn) ||
      projection.cardsDrawn < 0 ||
      projection.cardsDrawn > input.playerView.own.stackOrRdCount ||
      !Number.isSafeInteger(projection.netHandDelta) ||
      projection.netHandDelta !==
        projection.cardsDrawn - projection.cardsConsumed ||
      input.playerView.own.credits < projection.creditCost ||
      input.playerView.own.clicks < projection.clickCost
    ) {
      return [];
    }
    return [
      {
        kind: "convert_immediate_operation",
        needId: `economy-immediate-operation:${sourceInstanceId}`,
        sourceInstanceId,
        sourceDefinitionId,
        actionIds: [candidate.actionId],
        conversion: {
          clickCost: projection.clickCost,
          creditCost: projection.creditCost,
          grossLiquidCreditGain,
          netLiquidCreditGain,
          cardsDrawn: projection.cardsDrawn,
          cardsConsumed: 1,
          netHandDelta: projection.netHandDelta,
          payoutMode: "fixed",
          reliability: "guaranteed",
          source: "legal_action_payload",
        },
        cadence: {
          kind: "single_action",
          maximumConversions: 1,
        },
        completion: {
          kind: "source_consumed",
        },
        urgentForScore: false,
        evidenceCode: `corp_engine_certified_immediate_operation_conversion:${sourceDefinitionId}`,
      } satisfies CorpEconomyImmediateOperationSignal,
    ];
  });
  return uniqueBy(signals, (signal) => signal.needId);
}

function corpInstalledAssetEconomyWithdrawals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): CorpEconomyInstalledAssetWithdrawalSignal[] {
  const installedRootCardsById = new Map(
    input.playerView.servers.flatMap((server) =>
      server.root.map((card) => [card.instanceId, card] as const),
    ),
  );
  const legalActionsById = new Map(
    input.legalActions.map((action) => [action.actionId, action]),
  );
  const signals = candidates.flatMap((candidate) => {
    const sourceInstanceId = candidate.sourceCardInstanceId;
    const sourceCard = sourceInstanceId
      ? installedRootCardsById.get(sourceInstanceId)
      : undefined;
    const sourceDefinitionId =
      candidate.sourceDefinitionId ?? sourceCard?.definitionId;
    const action = legalActionsById.get(candidate.actionId);
    const projection = candidate.economyProjection;
    const hostedCreditTakeMode = action?.payload?.hostedCreditTakeMode;
    const hostedCreditTakeAmount = action?.payload?.hostedCreditTakeAmount;
    const grossLiquidCreditGain = projection?.grossLiquidCreditGain;
    const netLiquidCreditGain = projection?.netLiquidCreditGain;
    const hint = sourceDefinitionId
      ? AI_HINTS_BY_CARD.get(sourceDefinitionId)
      : undefined;
    if (
      !sourceInstanceId ||
      !sourceDefinitionId ||
      !sourceCard?.known ||
      sourceCard.definitionId !== sourceDefinitionId ||
      (candidate.sourceDefinitionId !== undefined &&
        candidate.sourceDefinitionId !== sourceDefinitionId) ||
      sourceCard.rezzed !== true ||
      visibleKnownCardType(input, sourceCard) !== "asset" ||
      hint?.planRoles?.includes("remote_asset_economy") !== true ||
      hint.quality?.hintReviewed !== true ||
      hint.quality.strategyCovered !== true ||
      hint.quality.confidence !== "high" ||
      action?.type !== "activated_card_ability" ||
      action.source !== sourceInstanceId ||
      action.payload?.cardId !== sourceInstanceId ||
      action.payload?.cardImplementationTakesHostedCredits !== true ||
      (hostedCreditTakeMode !== "up_to_amount_if_available" &&
        hostedCreditTakeMode !== "all") ||
      typeof hostedCreditTakeAmount !== "number" ||
      !Number.isSafeInteger(hostedCreditTakeAmount) ||
      hostedCreditTakeAmount <= 0 ||
      candidate.sourceKind !== "card" ||
      candidate.semanticActionType !== "economy.gain_credit" ||
      candidate.costProfile.costKnownStatus !== "known" ||
      candidate.costProfile.additionalCosts.length > 0 ||
      candidate.targetContext?.selectedTargets.length ||
      candidate.projectionIssues.some(
        (issue) => issue !== "ability_unresolved",
      ) ||
      candidate.hardGates.some((gate) => gate.status === "block") ||
      projection?.kind !== "immediate_liquid" ||
      projection.timing !== "immediate" ||
      projection.creditRestriction !== "general" ||
      projection.payoutMode !== "fixed" ||
      projection.reliability !== "guaranteed" ||
      projection.source !== "legal_action_payload" ||
      projection.confidence !== "high" ||
      projection.cardsConsumed !== 0 ||
      projection.cardsDrawn !== 0 ||
      projection.netHandDelta !== 0 ||
      !Number.isSafeInteger(projection.clickCost) ||
      projection.clickCost !== candidate.costProfile.clickCost ||
      projection.clickCost <= 0 ||
      !Number.isSafeInteger(projection.creditCost) ||
      projection.creditCost !== candidate.costProfile.creditCost ||
      projection.creditCost < 0 ||
      typeof grossLiquidCreditGain !== "number" ||
      !Number.isSafeInteger(grossLiquidCreditGain) ||
      grossLiquidCreditGain !== hostedCreditTakeAmount ||
      typeof netLiquidCreditGain !== "number" ||
      !Number.isSafeInteger(netLiquidCreditGain) ||
      netLiquidCreditGain <= 0 ||
      grossLiquidCreditGain - projection.creditCost !== netLiquidCreditGain ||
      input.playerView.own.credits < projection.creditCost ||
      input.playerView.own.clicks < projection.clickCost
    ) {
      return [];
    }
    return [
      {
        kind: "convert_installed_asset_payout",
        needId: `economy-installed-asset-payout:${sourceInstanceId}`,
        sourceInstanceId,
        sourceDefinitionId,
        actionIds: [candidate.actionId],
        conversion: {
          clickCost: projection.clickCost,
          creditCost: projection.creditCost,
          grossLiquidCreditGain,
          netLiquidCreditGain,
          cardsDrawn: 0,
          cardsConsumed: 0,
          netHandDelta: 0,
          payoutMode: "fixed",
          reliability: "guaranteed",
          source: "legal_action_payload",
          hostedCreditTakeMode,
        },
        cadence: {
          kind: "single_action_revalidate",
          maximumConversions: 1,
        },
        completion: {
          kind: "source_pool_revalidated",
        },
        urgentForScore: false,
        evidenceCode: `corp_engine_certified_installed_asset_payout:${sourceDefinitionId}`,
      } satisfies CorpEconomyInstalledAssetWithdrawalSignal,
    ];
  });
  return uniqueBy(signals, (signal) => signal.needId);
}

function corpImmediateOperationThresholdPreparations(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): CorpEconomyOperationThresholdSignal[] {
  const exactBasicCreditCandidates = candidates.filter(
    corpExactBasicLiquidCreditCandidate,
  );
  if (
    exactBasicCreditCandidates.length !== 1 ||
    input.playerView.own.clicks < 2
  ) {
    return [];
  }
  const fundingCandidate = exactBasicCreditCandidates[0]!;
  const currentCredits = input.playerView.own.credits;
  return uniqueBy(
    input.playerView.own.gripOrHq.flatMap((card) => {
      if (
        !card.known ||
        !card.definitionId ||
        visibleKnownCardType(input, card) !== "operation" ||
        candidates.some(
          (candidate) =>
            candidate.sourceCardInstanceId === card.instanceId &&
            candidate.actionType === "play_operation",
        )
      ) {
        return [];
      }
      const definition = CARD_DEFINITIONS_BY_ID[card.definitionId];
      const hint = AI_HINTS_BY_CARD.get(card.definitionId);
      const operationCreditCost = definition?.cost;
      if (
        definition?.side !== "corp" ||
        definition.type !== "operation" ||
        !Number.isSafeInteger(operationCreditCost) ||
        operationCreditCost !== currentCredits + 1 ||
        definition.mechanics.includes("play_operation") !== true ||
        definition.mechanics.includes("gain_credits") !== true ||
        hint?.aiSupportStatus !== "ai_supported" ||
        hint.cardType !== "operation" ||
        hint.quality?.hintReviewed !== true ||
        hint.quality.confidence !== "high" ||
        hint.quality.needsHumanReview === true ||
        hint.roles.includes("economy_operation") !== true ||
        hint.planRoles.includes("recover_economy") !== true ||
        hint.functionSignals?.includes("economy.corp_credit_burst") !== true ||
        !Number.isSafeInteger(hint.valueHints?.economy) ||
        (hint.valueHints?.economy ?? 0) < 3 ||
        hint.costProfile?.clicks !== 1 ||
        (hint.conditions?.length ?? 0) > 0 ||
        (hint.targetProfiles?.length ?? 0) > 0
      ) {
        return [];
      }
      const effects = hint.effects ?? [];
      if (
        effects.length === 0 ||
        effects.some(
          (effect) =>
            effect.kind !== "economy" ||
            effect.timing !== "action" ||
            effect.scope !== "corp" ||
            effect.resource !== "credits" ||
            effect.finite !== true,
        )
      ) {
        return [];
      }
      return [
        {
          kind: "prepare_immediate_operation",
          needId: `economy-immediate-operation:${card.instanceId}`,
          sourceInstanceId: card.instanceId,
          sourceDefinitionId: card.definitionId,
          actionIds: [fundingCandidate.actionId],
          threshold: {
            currentCredits,
            operationCreditCost,
            creditsAfterFunding: currentCredits + 1,
            fundingGap: 1,
          },
          futureConversion: {
            strategicEconomyValue: hint.valueHints!.economy!,
            classification: "reviewed_pure_burst_economy_operation",
            evidenceSource: "reviewed_strategic_hint",
          },
          cadence: {
            kind: "single_threshold_credit",
            maximumConversions: 1,
          },
          completion: {
            kind: "operation_becomes_legal",
          },
          urgentForScore: false,
          evidenceCode: `corp_reviewed_operation_one_credit_threshold:${card.definitionId}`,
        } satisfies CorpEconomyOperationThresholdSignal,
      ];
    }),
    (signal) => signal.needId,
  );
}

function corpRequiredEconomyNeeds(
  input: AiDecisionInput,
  scoreProjects: readonly CorpScoreProjectSignal[],
  defenseNeeds: readonly CorpDefenseSignal[],
  ambushes: readonly CorpPlanDomain["ambushes"][number][],
  punishCampaigns: readonly CorpPunishCampaignSignal[],
  immediateFundingActionIds: string[],
): CorpCorePlanDomain["economyNeeds"] {
  const projectsWithCurrentProtectionSupport = new Set(
    defenseNeeds.flatMap((need) =>
      need.kind === "generic" ? [] : [need.parentProjectId],
    ),
  );
  const exactAmbushSetupCardIds = new Set(
    ambushes
      .filter(
        (ambush) =>
          ambush.phase === "install" &&
          ambush.installRoute !== undefined &&
          ambush.installRoute.fundingGap === 0,
      )
      .map((ambush) => ambush.sourceInstanceId),
  );
  const scoreSupport = scoreProjects.flatMap((project) =>
    (project.fundingGap ?? 0) > 0 &&
    exactAmbushSetupCardIds.size === 0 &&
    !projectsWithCurrentProtectionSupport.has(project.projectId)
      ? [
          {
            kind: "parent_funding" as const,
            needId: `score-support:${project.projectId}`,
            gap: project.fundingGap!,
            actionIds: immediateFundingActionIds,
            parentPlanInstanceId: planInstanceIdForProposal({
              moduleId: "corp.score_agenda",
              dedupeKey: project.projectId,
            }),
            parentNeedId: `score-support:${project.projectId}`,
            delegatedPriorityClass: corpScorePriorityClass(project),
            urgentForScore: true,
            evidenceCode: project.evidenceCode,
          },
        ]
      : [],
  );
  const defenseReserve = corpDefenseReserveNeeds(
    input,
    defenseNeeds,
    immediateFundingActionIds,
  );
  const ambushFunding = ambushes.flatMap((ambush) => {
    const gap = ambush.installRoute?.fundingGap;
    if (
      ambush.phase !== "install" ||
      typeof gap !== "number" ||
      !Number.isSafeInteger(gap) ||
      gap <= 0
    ) {
      return [];
    }
    const needId = `ambush-funding:${ambush.sourceInstanceId}`;
    return [
      {
        kind: "parent_funding" as const,
        needId,
        gap,
        actionIds: immediateFundingActionIds,
        parentPlanInstanceId: planInstanceIdForProposal({
          moduleId: "corp.ambush_and_bluff",
          dedupeKey: ambush.ambushId,
        }),
        parentNeedId: needId,
        parentPriorityClass: "P5" as const,
        urgentForScore: false,
        evidenceCode: ambush.evidenceCode,
      },
    ];
  });
  const punishFunding = punishCampaigns.flatMap((campaign) => {
    const route = campaign.routeContract;
    if (
      !route ||
      route.quoteStatus !== "complete" ||
      route.horizon !== "fund" ||
      route.fundingGap <= 0 ||
      route.fundingActionIds.length === 0
    ) {
      return [];
    }
    return [
      {
        kind: "parent_funding" as const,
        needId: route.fundingNeedId,
        gap: route.fundingGap,
        actionIds: route.fundingActionIds,
        parentPlanInstanceId: planInstanceIdForProposal({
          moduleId: "corp.punish_campaign",
          dedupeKey: campaign.campaignId,
        }),
        parentNeedId: route.fundingNeedId,
        parentPriorityClass: corpPunishFundingParentPriority(campaign),
        urgentForScore: false,
        evidenceCode: campaign.evidenceCode,
      },
    ];
  });
  return uniqueBy(
    [...scoreSupport, ...defenseReserve, ...ambushFunding, ...punishFunding],
    (signal) => signal.needId,
  );
}

function corpPunishFundingParentPriority(
  signal: CorpPunishCampaignSignal,
): "P1" | "P4" | "P5" {
  if (
    signal.routeContract &&
    signal.terminalCondition === "runner_flatline" &&
    signal.visibleTerminalProjection &&
    (signal.guarantee === "visible_state_forced" ||
      signal.guarantee === "robust_but_reactive") &&
    signal.routeContract.quoteStatus === "complete" &&
    signal.routeContract.horizon !== "wait"
  ) {
    return "P1";
  }
  return signal.priorityClass ?? "P4";
}

function corpDefenseReserveNeeds(
  input: AiDecisionInput,
  defenseNeeds: readonly CorpDefenseSignal[],
  immediateFundingActionIds: string[],
): CorpCorePlanDomain["economyNeeds"] {
  const priorityRank = { P2: 2, P3: 3, P5: 5, P6: 6 } as const;
  const productivePriorities = defenseNeeds.flatMap((need) =>
    need.kind === "generic" &&
    need.phase === "install_ice" &&
    need.installRoute?.disposition === "productive"
      ? [corpGenericDefensePriorityClass([need])]
      : [],
  );
  return defenseNeeds.flatMap((need) => {
    if (
      need.kind !== "generic" ||
      need.phase !== "install_ice" ||
      need.installRoute?.disposition !== "funding_only"
    ) {
      return [];
    }
    const fundingPriority = corpGenericDefensePriorityClass([need]);
    if (
      productivePriorities.some(
        (priority) => priorityRank[priority] <= priorityRank[fundingPriority],
      )
    ) {
      return [];
    }
    const projection = need.installRoute.projection;
    if (!knownInstallRouteHasUsefulEffectBlockedByFunding(projection)) {
      return [];
    }
    const gap = projection.after.minimumAdditionalCreditsToSatisfy;
    if (
      typeof gap !== "number" ||
      !Number.isSafeInteger(gap) ||
      gap <= 0 ||
      !Number.isSafeInteger(input.playerView.own.credits + gap)
    ) {
      return [];
    }
    const targetCredits = input.playerView.own.credits + gap;
    return [
      {
        kind: "parent_funding",
        needId: `defense-reserve:${need.serverId}:${projection.sourceCardInstanceId}`,
        gap,
        actionIds: immediateFundingActionIds,
        immediateDefenseConversion: true,
        parentPlanInstanceId: planInstanceIdForProposal({
          moduleId: "corp.defend_servers",
          dedupeKey: "server-defense-portfolio",
        }),
        parentNeedId: need.defenseId,
        parentPriorityClass: fundingPriority,
        incrementalDefenseReserve: {
          targetCredits,
          serverId: need.serverId,
          iceInstanceId: projection.sourceCardInstanceId,
        },
        urgentForScore: false,
        evidenceCode: need.evidenceCode,
      },
    ];
  });
}

function punishSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  scorelineFeasibility: CorpScorelineFeasibility | undefined,
  previous: ResidentPlanPortfolio | undefined,
): CorpPunishCampaignSignal[] {
  const quoted = quotedPunishSignals(input, candidates, previous);
  const legacyRoots = mergeStableLegacyPunishRoots(
    legacyPunishSignals(input, candidates, scorelineFeasibility).filter(
      (signal) =>
        signal.phase === "prepare" ||
        signal.evidenceCode.startsWith(
          "corp_tagged_runner_visible_resource_trash",
        ) ||
        signal.evidenceCode.startsWith(
          "corp_tagged_runner_visible_credit_bank_trash",
        ),
    ),
  );
  return [...quoted, ...legacyRoots];
}

function mergeStableLegacyPunishRoots(
  signals: readonly CorpPunishCampaignSignal[],
): CorpPunishCampaignSignal[] {
  const merged = new Map<string, CorpPunishCampaignSignal>();
  for (const signal of signals) {
    const current = merged.get(signal.campaignId);
    if (!current) {
      merged.set(signal.campaignId, structuredClone(signal));
      continue;
    }
    const semanticActionTypes = new Set(
      [
        current.initiatingSemanticActionType,
        signal.initiatingSemanticActionType,
      ].filter((value): value is string => value !== undefined),
    );
    const {
      initiatingSemanticActionType: _currentSemanticActionType,
      ...currentWithoutSemanticActionType
    } = current;
    merged.set(signal.campaignId, {
      ...currentWithoutSemanticActionType,
      sourceDefinitionIds: [
        ...new Set([
          ...current.sourceDefinitionIds,
          ...signal.sourceDefinitionIds,
        ]),
      ],
      actionIds: [
        ...new Set([...(current.actionIds ?? []), ...(signal.actionIds ?? [])]),
      ],
      ...(semanticActionTypes.size === 1
        ? { initiatingSemanticActionType: [...semanticActionTypes][0]! }
        : {}),
      feasible: current.feasible || signal.feasible,
      value: Math.max(current.value, signal.value),
      evidenceCodes: [
        ...new Set([
          ...(current.evidenceCodes ?? [current.evidenceCode]),
          ...(signal.evidenceCodes ?? [signal.evidenceCode]),
        ]),
      ],
    });
  }
  return [...merged.values()].sort((left, right) =>
    left.campaignId.localeCompare(right.campaignId),
  );
}

function quotedPunishSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  previous: ResidentPlanPortfolio | undefined,
): CorpPunishCampaignSignal[] {
  const quoteSet = input.playerView.corpPunishRouteQuoteSet;
  if (
    quoteSet?.complete !== true ||
    quoteSet.side !== "corp" ||
    quoteSet.stateVersion !== input.playerView.stateVersion ||
    quoteSet.timingPoint !== input.playerView.timingPoint
  ) {
    return retainedUnknownPunishSignals(
      input,
      previous,
      quoteSet?.incompleteReasons,
    );
  }
  const routesByCampaign = new Map<string, CorpPunishRouteQuote[]>();
  for (const route of quoteSet.routes) {
    if (
      !route.complete ||
      route.stateVersion !== input.playerView.stateVersion ||
      route.campaignIdOrigin !== "request_binding" ||
      route.steps.length === 0
    ) {
      continue;
    }
    const current = routesByCampaign.get(route.campaignId) ?? [];
    current.push(route);
    routesByCampaign.set(route.campaignId, current);
  }
  return [...routesByCampaign.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([campaignId, routes]) => {
      const route = selectQuotedPunishRoute(routes);
      return route
        ? [quotedPunishSignal(input, candidates, campaignId, route)]
        : [];
    });
}

function retainedUnknownPunishSignals(
  input: AiDecisionInput,
  previous: ResidentPlanPortfolio | undefined,
  incompleteReasons: readonly string[] | undefined,
): CorpPunishCampaignSignal[] {
  if (!previous) return [];
  const reason =
    incompleteReasons && incompleteReasons.length > 0
      ? incompleteReasons.join(",")
      : "route_quote_unavailable";
  return previous.instances.flatMap((instance) => {
    if (instance.moduleId !== "corp.punish_campaign") return [];
    const previousState = instance.moduleState as
      | { kind?: unknown; signal?: CorpPunishCampaignSignal }
      | undefined;
    const previousSignal = previousState?.signal;
    const previousRoute = previousSignal?.routeContract;
    if (!previousSignal || !previousRoute) return [];
    const {
      terminalCondition: _previousTerminalCondition,
      actionIds: _previousActionIds,
      initiatingSemanticActionType: _previousSemanticActionType,
      ...retainedSignal
    } = previousSignal;
    const {
      currentHeadStepId: _previousHeadStepId,
      currentHeadActionId: _previousHeadActionId,
      ...retainedRoute
    } = previousRoute;
    return [
      {
        ...structuredClone(retainedSignal),
        phase: "watch_window" as const,
        actionIds: [],
        feasible: false,
        guarantee: "speculative" as const,
        visibleTerminalProjection: false,
        value: 0,
        evidenceCode: `corp_punish_route_quote_unknown:${reason}`,
        evidenceCodes: [
          `corp_punish_route_quote_state_version:${input.playerView.stateVersion}`,
          `corp_punish_route_quote_unknown:${reason}`,
        ],
        routeContract: {
          ...structuredClone(retainedRoute),
          quoteStatus: "unknown" as const,
          quoteStateVersion: input.playerView.stateVersion,
          fundingGap: 0,
          fundingActionIds: [],
          horizon: "wait" as const,
        },
      },
    ];
  });
}

function selectQuotedPunishRoute(
  routes: readonly CorpPunishRouteQuote[],
): CorpPunishRouteQuote | undefined {
  return [...routes].sort(compareQuotedPunishRoutes)[0];
}

type QuotedPunishOpportunityAssessment = {
  disposition: "opportunity" | "watch";
  priorityClass: "P1" | "P4" | "P5";
  value: number;
  visibleTerminalProjection: boolean;
  evidenceCode: string;
};

const QUOTED_PUNISH_PRIORITY_RANK = {
  P1: 1,
  P4: 4,
  P5: 5,
} as const;

/**
 * Rates the strategic outcome of an Engine-certified route without turning
 * non-terminal damage into a binary rejection. The bounded value is only a
 * within-class comparison: priority remains the scheduler's cross-plan
 * authority.
 */
function assessQuotedPunishOpportunity(
  route: CorpPunishRouteQuote,
): QuotedPunishOpportunityAssessment {
  const minimumDamage = route.damageEnvelope.effectiveDamage.minimum;
  const runnerHandCount = route.damageEnvelope.runnerHandCount;
  const hasDamageStep = route.steps.some(
    (step) =>
      step.kind === "meat_damage" ||
      step.kind === "net_damage" ||
      step.kind === "core_damage",
  );
  if (!hasDamageStep) {
    if (route.guarantee === "unknown") {
      return {
        disposition: "watch",
        priorityClass: "P5",
        value: 0,
        visibleTerminalProjection: false,
        evidenceCode: "corp_punish_opportunity_watch:guarantee_unknown",
      };
    }
    return {
      disposition: "opportunity",
      priorityClass: "P4",
      value: Math.max(
        1,
        Math.min(
          120,
          Math.round(
            120 -
              Math.min(18, route.totalClicks * 4) -
              Math.min(
                18,
                route.responsePaymentEnvelope.totalCorpCredits.maximum / 2,
              ),
          ),
        ),
      ),
      visibleTerminalProjection: false,
      evidenceCode: "corp_punish_opportunity:non_damage_payoff",
    };
  }
  if (minimumDamage <= 0 || route.guarantee === "unknown") {
    return {
      disposition: "watch",
      priorityClass: "P5",
      value: 0,
      visibleTerminalProjection: false,
      evidenceCode:
        minimumDamage <= 0
          ? "corp_punish_opportunity_watch:no_positive_minimum_damage"
          : "corp_punish_opportunity_watch:guarantee_unknown",
    };
  }

  const visibleTerminalProjection = minimumDamage > runnerHandCount;
  const safelyDestroyedCards = Math.min(minimumDamage, runnerHandCount);
  const destroyedHandShare =
    runnerHandCount === 0 ? 1 : safelyDestroyedCards / runnerHandCount;
  const remainingHandCount = Math.max(0, runnerHandCount - minimumDamage);
  const materialHandDestruction =
    destroyedHandShare >= 0.5 || remainingHandCount <= 1;
  const priorityClass = visibleTerminalProjection
    ? ("P1" as const)
    : materialHandDestruction
      ? ("P4" as const)
      : ("P5" as const);
  const outcomeValue = visibleTerminalProjection
    ? 220
    : materialHandDestruction
      ? 125 + destroyedHandShare * 75 + (remainingHandCount <= 1 ? 10 : 0)
      : 12 + destroyedHandShare * 40 + Math.min(10, safelyDestroyedCards * 2);
  const guaranteeFactor =
    route.guarantee === "guaranteed"
      ? 1
      : route.guarantee === "conditional_on_runner_response"
        ? 0.94
        : 0.88;
  const responseKnowledgeFactor =
    route.responseKnowledge === "public_exact"
      ? 1
      : route.responseKnowledge === "public_bounded"
        ? 0.95
        : 0.9;
  const clickLoad = Math.min(18, route.totalClicks * 4);
  const creditLoad = Math.min(
    18,
    route.responsePaymentEnvelope.totalCorpCredits.maximum / 2,
  );
  const boundedValue = Math.max(
    1,
    Math.min(
      200,
      Math.round(
        outcomeValue * guaranteeFactor * responseKnowledgeFactor -
          clickLoad -
          creditLoad,
      ),
    ),
  );
  return {
    disposition: "opportunity",
    priorityClass,
    value: boundedValue,
    visibleTerminalProjection,
    evidenceCode: visibleTerminalProjection
      ? "corp_punish_opportunity:terminal_flatline"
      : materialHandDestruction
        ? "corp_punish_opportunity:material_hand_destruction"
        : "corp_punish_opportunity:chip_damage",
  };
}

function compareQuotedPunishRoutes(
  left: CorpPunishRouteQuote,
  right: CorpPunishRouteQuote,
): number {
  const leftAssessment = assessQuotedPunishOpportunity(left);
  const rightAssessment = assessQuotedPunishOpportunity(right);
  const priorityOrder =
    QUOTED_PUNISH_PRIORITY_RANK[leftAssessment.priorityClass] -
    QUOTED_PUNISH_PRIORITY_RANK[rightAssessment.priorityClass];
  if (priorityOrder !== 0) return priorityOrder;
  const valueOrder = rightAssessment.value - leftAssessment.value;
  if (valueOrder !== 0) return valueOrder;
  const clickOrder = left.totalClicks - right.totalClicks;
  if (clickOrder !== 0) return clickOrder;
  const creditOrder =
    left.responsePaymentEnvelope.totalCorpCredits.maximum -
    right.responsePaymentEnvelope.totalCorpCredits.maximum;
  if (creditOrder !== 0) return creditOrder;
  const minimumDamageOrder =
    right.damageEnvelope.effectiveDamage.minimum -
    left.damageEnvelope.effectiveDamage.minimum;
  if (minimumDamageOrder !== 0) return minimumDamageOrder;
  return left.routeId.localeCompare(right.routeId);
}

function quotedPunishSignal(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  campaignId: string,
  route: CorpPunishRouteQuote,
): CorpPunishCampaignSignal {
  const head = route.steps[0]!;
  const opportunity = assessQuotedPunishOpportunity(route);
  const actionable = opportunity.disposition === "opportunity";
  const headActionId = head.currentLegalAction?.actionId;
  const headCandidate = headActionId
    ? candidates.find(
        (candidate) =>
          candidate.actionId === headActionId &&
          candidate.sourceCardInstanceId === head.sourceCardInstanceId &&
          candidate.sourceDefinitionId === head.sourceCardDefinitionId,
      )
    : undefined;
  const exactHeadAction = headActionId
    ? input.legalActions.find(
        (action) =>
          action.actionId === headActionId &&
          action.source === head.sourceCardInstanceId &&
          action.expiresAtStateVersion === input.playerView.stateVersion,
      )
    : undefined;
  const currentHeadAvailable =
    headCandidate !== undefined && exactHeadAction !== undefined;
  const fundingGap = actionable
    ? Math.max(
        0,
        route.responsePaymentEnvelope.totalCorpCredits.maximum -
          input.playerView.own.credits,
      )
    : 0;
  const fundingActions =
    actionable && fundingGap > 0
      ? candidates.filter((candidate) => {
          const gain = immediateCorpLiquidCreditGain(candidate);
          if (gain < fundingGap) return false;
          const action = input.legalActions.find(
            (legalAction) => legalAction.actionId === candidate.actionId,
          );
          const clicks = action
            ? currentLegalActionResourceCost(action, "clicks")
            : undefined;
          return (
            clicks !== undefined &&
            clicks > 0 &&
            route.totalClicks + clicks <= input.playerView.own.clicks
          );
        })
      : [];
  const horizon: "execute" | "fund" | "wait" =
    actionable &&
    fundingGap === 0 &&
    route.totalClicks <= input.playerView.own.clicks &&
    currentHeadAvailable
      ? "execute"
      : fundingGap > 0 && fundingActions.length > 0
        ? "fund"
        : "wait";
  const terminalGuarantee =
    route.guarantee === "guaranteed" ||
    route.guarantee === "conditional_on_runner_response";
  const terminal =
    opportunity.visibleTerminalProjection &&
    terminalGuarantee &&
    horizon !== "wait";
  const phase =
    horizon === "fund"
      ? ("fund" as const)
      : horizon === "wait"
        ? ("watch_window" as const)
        : punishPhaseForQuotedHead(head.kind);
  const executionNeedId = `punish-execution:${campaignId}:${route.routeId}`;
  const fundingNeedId = `punish-funding:${campaignId}:${route.routeId}`;
  const evidenceCodes = [
    `corp_punish_route_quote_state_version:${route.stateVersion}`,
    `corp_punish_route_selected:${route.routeId}`,
    `corp_punish_route_horizon:${horizon}`,
    opportunity.evidenceCode,
  ];
  return {
    campaignId,
    phase,
    sourceDefinitionIds: [
      ...new Set(route.steps.map((step) => step.sourceCardDefinitionId)),
    ],
    ...(actionable && currentHeadAvailable
      ? { actionIds: [headActionId!] }
      : {}),
    ...(actionable && headCandidate
      ? { initiatingSemanticActionType: headCandidate.semanticActionType }
      : {}),
    feasible: horizon === "execute" || horizon === "fund",
    guarantee:
      route.guarantee === "guaranteed"
        ? "visible_state_forced"
        : route.guarantee === "conditional_on_runner_response"
          ? "robust_but_reactive"
          : route.guarantee === "not_guaranteed"
            ? "belief_supported"
            : "speculative",
    ...(opportunity.priorityClass === "P4" || opportunity.priorityClass === "P5"
      ? { priorityClass: opportunity.priorityClass }
      : {}),
    ...(terminal ? { terminalCondition: "runner_flatline" as const } : {}),
    visibleTerminalProjection: terminal,
    value: opportunity.value,
    evidenceCode: `corp_punish_route_selected:${route.routeId}`,
    evidenceCodes,
    routeContract: {
      contractVersion: "corp_punish_route_signal_v1",
      quoteStatus: "complete",
      quoteStateVersion: route.stateVersion,
      routeId: route.routeId,
      totalClicks: route.totalClicks,
      totalActionCredits: route.totalActionCredits,
      corpResponseCredits:
        route.responsePaymentEnvelope.corpResponseCredits.maximum,
      totalCorpCredits: route.responsePaymentEnvelope.totalCorpCredits.maximum,
      fundingGap,
      fundingActionIds: fundingActions.map((candidate) => candidate.actionId),
      horizon,
      executionNeedId,
      fundingNeedId,
      currentHeadStepId: head.stepId,
      ...(currentHeadAvailable ? { currentHeadActionId: headActionId! } : {}),
    },
  };
}

function punishPhaseForQuotedHead(
  kind: CorpPunishRouteQuote["steps"][number]["kind"],
): CorpPunishCampaignSignal["phase"] {
  if (kind === "trace_tag") return "trace";
  if (kind === "tag") return "tag";
  if (
    kind === "meat_damage" ||
    kind === "net_damage" ||
    kind === "core_damage"
  ) {
    return "damage";
  }
  return "kill";
}

function currentLegalActionResourceCost(
  action: LegalAction,
  resource: "clicks" | "credits",
): number {
  return action.costs.reduce((sum, cost) => sum + (cost[resource] ?? 0), 0);
}

function legacyPunishSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  scorelineFeasibility: CorpScorelineFeasibility | undefined,
): CorpPunishCampaignSignal[] {
  return candidates.flatMap((candidate): CorpPunishCampaignSignal[] => {
    if (corpCandidateIsAmbushInstall(candidate)) return [];
    const legalAction = input.legalActions.find(
      (action) => action.actionId === candidate.actionId,
    );
    if (
      candidate.semanticActionType === "tag.trash_runner_resource" &&
      input.playerView.opponent.tags > 0 &&
      legalAction &&
      actionIsCurrentlyAffordable(input, legalAction)
    ) {
      const targetId =
        candidateTargetIds(candidate)[0] ??
        (typeof legalAction.payload?.targetCardId === "string"
          ? legalAction.payload.targetCardId
          : undefined);
      if (!targetId) return [];
      const target = input.playerView.opponent.rig?.find(
        (card) => card.instanceId === targetId,
      );
      if (!target) return [];
      const storedValue = target
        ? Object.values(target.counters ?? {}).reduce(
            (sum, amount) => sum + Math.max(0, amount),
            0,
          )
        : 0;
      return [
        {
          campaignId: `punish:resource-trash:${targetId}`,
          phase: "damage",
          sourceDefinitionIds: [],
          actionIds: [candidate.actionId],
          initiatingSemanticActionType: candidate.semanticActionType,
          feasible: true,
          guarantee: "visible_state_forced",
          visibleTerminalProjection: false,
          value: 400 + storedValue * 20,
          evidenceCode:
            storedValue > 0
              ? "corp_tagged_runner_visible_credit_bank_trash"
              : "corp_tagged_runner_visible_resource_trash",
        },
      ];
    }
    const profile = getStructuredTagPunishProfileForCard(
      candidate.sourceDefinitionId,
    );
    const tagPunishPayoff =
      profile?.payoff === true && profile.requiresRunnerTagged;
    const traceSupport = corpDefinitionIsTraceSupport(
      candidate.sourceDefinitionId,
    );
    const runnerTagged = input.playerView.opponent.tags > 0;
    const visibleDefinitions = visibleOwnDefinitionIds(input);
    const visibleTagSource = [...visibleDefinitions].some(
      (definitionId) =>
        getStructuredTagPunishProfileForCard(definitionId)?.tagSource ===
          true || corpDefinitionIsTraceSource(definitionId),
    );
    const visiblePayoff = [...visibleDefinitions].some((definitionId) => {
      const visibleProfile = getStructuredTagPunishProfileForCard(definitionId);
      return (
        visibleProfile?.payoff === true && visibleProfile.requiresRunnerTagged
      );
    });
    if (!legalAction || !actionIsCurrentlyAffordable(input, legalAction))
      return [];
    if (
      candidate.sourceDefinitionId === "onr_v1_310_blood-cat" &&
      candidate.semanticActionType === "install.card" &&
      !corpExactBloodCatInstallPlacementIsPreferred(input, candidate)
    ) {
      return [];
    }
    if (!corpPunishCandidateHasVisibleEffect(input, candidate)) return [];
    if (
      candidateIsVisibleCorpIceInstall(input, candidate) ||
      candidateIsVisibleCorpAgendaInstall(input, candidate) ||
      legalAction.type === "rez_ice" ||
      candidate.semanticActionType === "score.advance_card"
    )
      return [];
    const immediatePayoffConversion =
      profile?.tagSource === true &&
      visibleTagPayoffConversionIsAffordable(input, legalAction);
    const startsImmediateTagSequence =
      profile?.tagSource === true &&
      candidate.semanticActionType !== "install.card" &&
      candidate.semanticActionType !== "corp_window.rez";
    if (startsImmediateTagSequence && !immediatePayoffConversion) return [];
    const preparationAction =
      candidate.semanticActionType === "install.card" ||
      candidate.semanticActionType === "corp_window.rez" ||
      candidate.semanticActionType === "score.advance_card";
    const targetBoundTraceSupport =
      traceSupport &&
      corpTraceSupportTargetHasVisibleTraceSource(input, candidate);
    if (
      targetBoundTraceSupport &&
      candidate.sourceDefinitionId === "onr_v1_365_paris-city-grid" &&
      candidate.semanticActionType === "install.card" &&
      !corpExactParisCityGridPlacementIsPreferred(input, candidate)
    ) {
      return [];
    }
    const profilePhase: CorpPunishCampaignSignal["phase"] | undefined =
      preparationAction &&
      (profile?.tagSource ||
        tagPunishPayoff ||
        (targetBoundTraceSupport && visibleTagSource))
        ? "prepare"
        : tagPunishPayoff && runnerTagged
          ? "damage"
          : profile?.tagSource && visiblePayoff
            ? profile.traceTagSource
              ? "trace"
              : "tag"
            : undefined;
    const phase =
      profilePhase ??
      (candidate.semanticActionType.startsWith("trace.")
        ? "trace"
        : candidate.semanticActionType.startsWith("tag.")
          ? "tag"
          : candidate.semanticActionType.startsWith("damage.") && runnerTagged
            ? "damage"
            : undefined);
    if (!phase) return [];
    if (
      phase === "prepare" &&
      corpStrategicFundingPhaseBlocksPreparation(input, candidate, legalAction)
    ) {
      return [];
    }
    if (tagPunishPayoff && !runnerTagged) return [];
    if (profile?.tagSource && !visiblePayoff && !preparationAction) return [];
    if (tagPunishPayoff && !visibleTagSource && !runnerTagged) return [];
    if (
      phase === "prepare" &&
      profile?.requiresScoredAgenda &&
      input.playerView.own.scoreArea.length === 0
    )
      return [];
    if (
      phase === "prepare" &&
      profile?.requiresScoredAgenda &&
      scorelineFeasibility?.remainingMandatoryDraws === 0
    )
      return [];
    if (
      phase === "prepare" &&
      scorelineFeasibility?.feasible === true &&
      scorelineFeasibility.currentAgendaPoints >=
        scorelineFeasibility.pointsToWin - 1
    )
      return [];
    if (phase !== "prepare") return [];
    const stableSourceId =
      candidate.sourceCardInstanceId ?? candidate.sourceDefinitionId;
    const stablePurpose = profile?.tagSource
      ? "tag-source"
      : tagPunishPayoff
        ? "tag-payoff"
        : targetBoundTraceSupport
          ? "trace-support"
          : undefined;
    if (!stableSourceId || !stablePurpose) return [];
    const value = profile?.requiresScoredAgenda
      ? 180
      : scorelineFeasibility?.deadline === "current_turn_only"
        ? 220
        : 150;
    return [
      {
        campaignId: `punish:prepare:${stableSourceId}:${stablePurpose}`,
        phase,
        sourceDefinitionIds: candidate.sourceDefinitionId
          ? [candidate.sourceDefinitionId]
          : [],
        actionIds: [candidate.actionId],
        initiatingSemanticActionType: candidate.semanticActionType,
        feasible: true,
        guarantee: "robust_but_reactive",
        visibleTerminalProjection: false,
        ...(profile === undefined ? { priorityClass: "P5" as const } : {}),
        value,
        evidenceCode: profile
          ? `tag_punish_ontology_${phase}:${candidate.sourceDefinitionId}`
          : `visible_${phase}_action`,
      },
    ];
  });
}

function corpExactParisCityGridPlacementIsPreferred(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  const targetServerId = candidateTargetIds(candidate).find(isServerId);
  if (!targetServerId) return false;
  const installableAgendaVisible = input.playerView.own.gripOrHq.some(
    (card) => card.known && visibleCardIsAgenda(input, card),
  );
  if (installableAgendaVisible) return true;
  const protectedEmptyTraceRemote = input.playerView.servers
    .filter(
      (server) =>
        server.id.startsWith("remote_") &&
        server.root.length === 0 &&
        server.ice.some(
          (ice) =>
            corpDefinitionIsTraceSource(ice.definitionId) ||
            ice.effectiveRunQuote?.subroutines.some(
              (subroutine) => subroutine.type === "initiate_trace",
            ) === true,
        ),
    )
    .sort(
      (left, right) =>
        right.ice.length - left.ice.length || left.id.localeCompare(right.id),
    )[0];
  return targetServerId === (protectedEmptyTraceRemote?.id ?? targetServerId);
}

function corpExactBloodCatInstallPlacementIsPreferred(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  const targetServerId = candidateTargetIds(candidate).find(
    isCorpInstallServerId,
  );
  if (!targetServerId) return false;
  const protectedEmptyRemote = input.playerView.servers
    .filter(
      (server) =>
        server.id.startsWith("remote_") &&
        server.root.length === 0 &&
        server.ice.length > 0,
    )
    .sort(
      (left, right) =>
        right.ice.length - left.ice.length || left.id.localeCompare(right.id),
    )[0];
  return targetServerId === (protectedEmptyRemote?.id ?? "new_remote");
}

function corpDefinitionSupportsPunishPlan(
  definitionId: string | undefined,
): boolean {
  if (!definitionId) return false;
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  return (
    getStructuredTagPunishProfileForCard(definitionId) !== undefined ||
    hint?.lineSupport?.includes("corp.tag_trace_punish") === true ||
    hint?.strategyAnchors?.includes("corp.tag_trace_punish") === true
  );
}

function corpStrategicFundingPhaseBlocksPreparation(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  legalAction: AiDecisionInput["legalActions"][number],
): boolean {
  const intent = (input as AiDecisionInputWithDeckCapabilities)
    .ownStrategicIntentState;
  if (
    intent?.side !== "corp" ||
    intent.phase !== "fund" ||
    intent.reserve.kind !== "credits" ||
    intent.reserve.satisfied
  ) {
    return false;
  }
  const exactFundedPunishEngineActivation =
    intent.primaryStrategy.strategyId === "corp.tag_trace_punish" &&
    intent.targetVector.kind === "tag" &&
    candidate.semanticActionType === "corp_window.rez" &&
    candidate.sourceDefinitionId === "onr_v1_313_city-surveillance" &&
    candidate.sourceCardInstanceId !== undefined &&
    serverForInstalledCard(input, candidate.sourceCardInstanceId) !== undefined;
  if (exactFundedPunishEngineActivation) return false;
  return legalAction.costs.some((cost) => (cost.credits ?? 0) > 0);
}

function corpDefinitionIsTraceSupport(
  definitionId: string | undefined,
): boolean {
  if (!definitionId) return false;
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  return (
    hint?.actionTacticSignals?.includes("trace.credit_support") === true ||
    hint?.functionSignals?.includes("economy.trace_credit") === true
  );
}

function corpDefinitionIsTraceSource(
  definitionId: string | undefined,
): boolean {
  if (!definitionId) return false;
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  return (
    hint?.tacticSignals?.includes("trace.source") === true ||
    hint?.functionSignals?.includes("corp_ice.trace_source") === true
  );
}

function corpTraceSupportTargetHasVisibleTraceSource(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  const sourceServerId = candidate.sourceCardInstanceId
    ? serverForInstalledCard(input, candidate.sourceCardInstanceId)
    : undefined;
  const serverId =
    candidateTargetIds(candidate).find(isServerId) ?? sourceServerId;
  if (!serverId || serverId === "new_remote") return false;
  const server = input.playerView.servers.find(
    (candidateServer) => candidateServer.id === serverId,
  );
  if (!server) return false;
  return server.ice.some(
    (ice) =>
      corpDefinitionIsTraceSource(ice.definitionId) ||
      ice.effectiveRunQuote?.subroutines.some(
        (subroutine) => subroutine.type === "initiate_trace",
      ) === true,
  );
}

function corpScoreMaterialDrawHasSafeConversionWindow(
  input: AiDecisionInput,
): boolean {
  const lastAction = input.playerView.own.clicks <= 1;
  const opponentAtMatchpoint =
    input.playerView.opponent.agendaPoints >=
    input.playerView.agendaPointsToWin - 1;
  return !(lastAction && opponentAtMatchpoint);
}

function corpPunishCandidateHasVisibleEffect(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  if (!candidate.sourceDefinitionId) return true;
  const hint = AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId);
  const runnerCreditPunish = hint?.effects?.some(
    (effect) =>
      effect.scope === "runner" &&
      effect.resource === "credits" &&
      (effect.kind === "counter_economy" ||
        effect.kind === "tag_punish_payoff"),
  );
  if (!runnerCreditPunish) return true;
  const hasIndependentVisiblePayoff = hint?.effects?.some(
    (effect) =>
      !(
        effect.scope === "runner" &&
        effect.resource === "credits" &&
        (effect.kind === "counter_economy" ||
          effect.kind === "tag_punish_payoff")
      ),
  );
  return (
    input.playerView.opponent.credits > 0 ||
    hasIndependentVisiblePayoff === true
  );
}

function visibleTagPayoffConversionIsAffordable(
  input: AiDecisionInput,
  tagSourceAction: AiDecisionInput["legalActions"][number],
): boolean {
  const sourceCost = tagSourceAction.costs.reduce<{
    credits: number;
    clicks: number;
  }>(
    (total, entry) => ({
      credits: total.credits + (entry.credits ?? 0),
      clicks: total.clicks + (entry.clicks ?? 0),
    }),
    { credits: 0, clicks: 0 },
  );
  const remainingCredits = input.playerView.own.credits - sourceCost.credits;
  const remainingClicks = input.playerView.own.clicks - sourceCost.clicks;
  if (remainingClicks < 1 || remainingCredits < 0) return false;
  return input.playerView.own.gripOrHq.some((card) => {
    const profile = getStructuredTagPunishProfileForCard(card.definitionId);
    if (!profile?.payoff || !profile.requiresRunnerTagged || !card.known)
      return false;
    const minimumPlayCost = minimumVisiblePlayCost(card);
    return minimumPlayCost !== undefined && minimumPlayCost <= remainingCredits;
  });
}

function minimumVisiblePlayCost(
  card: AiDecisionInput["playerView"]["own"]["gripOrHq"][number],
): number | undefined {
  const playCost = card.playCost;
  if (playCost === undefined) return undefined;
  if (playCost.kind === "fixed") {
    return Number.isInteger(playCost.credits) && playCost.credits >= 0
      ? playCost.credits
      : undefined;
  }
  if (
    !Number.isInteger(playCost.minimumX) ||
    playCost.minimumX < 1 ||
    !Number.isInteger(playCost.creditsPerX) ||
    playCost.creditsPerX < 1 ||
    playCost.maximumX.kind !== "context"
  ) {
    return undefined;
  }
  return playCost.minimumX * playCost.creditsPerX;
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

function visibleOwnDefinitionIds(input: AiDecisionInput): Set<string> {
  return new Set(
    [
      ...input.playerView.own.gripOrHq,
      ...input.playerView.own.scoreArea,
      ...input.playerView.servers
        .filter((server) => server.id !== "archives")
        .flatMap((server) => [...server.ice, ...server.root]),
    ]
      .filter((card) => card.known && card.definitionId)
      .map((card) => card.definitionId!),
  );
}

function actionIsCurrentlyAffordable(
  input: AiDecisionInput,
  action: AiDecisionInput["legalActions"][number],
): boolean {
  const cost = action.costs.reduce<{ credits: number; clicks: number }>(
    (total, entry) => ({
      credits: total.credits + (entry.credits ?? 0),
      clicks: total.clicks + (entry.clicks ?? 0),
    }),
    { credits: 0, clicks: 0 },
  );
  return (
    cost.credits <= input.playerView.own.credits &&
    cost.clicks <= input.playerView.own.clicks
  );
}

function resolveEngineWindow(
  context: PlanSchedulerContext,
): EngineWindowResolution | undefined {
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
  action: LegalAction;
  planId: string;
  planKind: string | undefined;
  assessmentEvidenceCodes: readonly string[];
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

  return {
    ...base,
    lane: "plan",
    selectionAuthority: "resident_plan_instance",
    rootPlanInstanceId:
      params.result.portfolio.rootForegroundInstanceId ?? params.planId,
    leafExecutorInstanceId:
      params.result.portfolio.executorInstanceId ?? params.planId,
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
      code.includes("engine_certified_basic_liquidity_development"),
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
  dependencies: PlanFirstLiveDependencies,
  options: AiDecisionRuntimeOptions,
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
  const selectedChoices = randomizedIceInstallNearTie
    ? undefined
    : dependencies.selectedChoicesForDecision(input, action);
  const planId =
    result.lane === "plan"
      ? result.selectedAssessment.instanceId
      : result.origin.leafPlanInstanceId;
  const planKind =
    result.lane === "plan"
      ? result.portfolio.instances.find(
          (instance) => instance.instanceId === planId,
        )?.moduleId
      : "engine_window";
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
                };
              }
            | undefined;
          if (moduleState?.kind !== "central_pressure") return [];
          return selected
            ? (moduleState.signal?.runActionEvidence?.[alternative.actionId] ??
                [])
            : (moduleState.signal?.runActionExclusions?.[
                alternative.actionId
              ] ?? []);
        },
      );
      return {
        rank: index + 1,
        actionId: alternative.actionId,
        actionType: alternative.type,
        label: alternative.label,
        source: String(alternative.source),
        selected,
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
        ]
      : [
          {
            id: "engine_window",
            title: "Engine window",
            items: [`leaf_plan:${planId}`, `selected_action:${actionId}`],
          },
          ...corpHandInventorySection,
          ...corpDrawArbitrationSection,
        ];
  const planFirstDecision = planFirstDecisionDebug({
    input,
    context,
    result,
    action,
    planId,
    planKind,
    assessmentEvidenceCodes: planEvidence,
  });
  const decisionBase = {
    reasonCode:
      result.lane === "plan"
        ? `plan_first.${planKind ?? "unknown"}`
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
        : "plan_first.engine_window",
  };
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

function runnerCreditBankSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  deckCapabilities: DeckCapabilityProfile,
  economy: RunnerEconomyPosture,
  runTargets: readonly RunnerRunTargetEvaluation[],
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[],
  minimumHandBuffer: number,
): RunnerCorePlanDomain["creditBanks"] {
  const tools = (deckCapabilities.runner?.economyBankTools ?? []).filter(
    (tool) =>
      tool.status === "in_hand" ||
      tool.status === "installed" ||
      tool.buildActionLegal ||
      tool.cashOutActionLegal,
  );
  const portfolioStoredCredits = tools.reduce(
    (sum, tool) =>
      sum +
      Math.max(0, tool.portfolioStoredAmount ?? tool.currentBankAmount ?? 0),
    0,
  );
  return tools.flatMap((tool): RunnerCorePlanDomain["creditBanks"] => {
    const currentStoredCredits = Math.max(0, tool.currentBankAmount ?? 0);
    const estimatedPayout = Math.max(
      0,
      tool.estimatedPayout ?? currentStoredCredits,
    );
    const installActionIds = candidates
      .filter(
        (candidate) =>
          candidate.semanticActionType === "install.card" &&
          candidate.sourceDefinitionId === tool.cardId,
      )
      .map((candidate) => candidate.actionId);
    if (tool.status === "in_hand" && installActionIds.length > 0) {
      const handEvaluation = handDevelopment.find(
        (evaluation) =>
          evaluation.definitionId === tool.cardId &&
          evaluation.legalActionId !== undefined &&
          installActionIds.includes(evaluation.legalActionId),
      );
      const unsatisfiedActivationPrerequisites =
        handEvaluation?.activationPrerequisites.filter(
          (prerequisite) => !prerequisite.satisfied,
        ) ?? [];
      const delayedInstallWithoutFundingNeed =
        handEvaluation !== undefined &&
        handEvaluation.activationPrerequisites.length === 0 &&
        handEvaluation.liquidityTiming !== "immediate" &&
        !economy.fundingNeed &&
        input.playerView.own.credits >= economy.desiredCreditReserve;
      if (
        unsatisfiedActivationPrerequisites.length > 0 ||
        delayedInstallWithoutFundingNeed
      )
        return [
          {
            bankId: tool.cardId,
            phase: "hold" as const,
            actionIds: [],
            rejectedActionIds: installActionIds,
            priorityClass: "P5" as const,
            currentStoredCredits,
            portfolioStoredCredits,
            estimatedPayout,
            value: 0,
            evidenceCodes: [
              ...unsatisfiedActivationPrerequisites.map(
                (prerequisite) =>
                  `runner_credit_bank_install_prerequisite_unsatisfied:${prerequisite.kind}`,
              ),
              ...(delayedInstallWithoutFundingNeed
                ? ["runner_credit_bank_install_deferred_reserve_satisfied"]
                : []),
              ...tool.evidence,
            ],
          },
        ];
      const plausibleFollowupWindow = input.playerView.own.clicks >= 2;
      if (!plausibleFollowupWindow)
        return [
          {
            bankId: tool.cardId,
            phase: "hold" as const,
            actionIds: [],
            rejectedActionIds: installActionIds,
            priorityClass: "P5" as const,
            currentStoredCredits,
            portfolioStoredCredits,
            estimatedPayout,
            value: 0,
            evidenceCodes: [
              "runner_credit_bank_install_deferred_no_followup_window",
              ...tool.evidence,
            ],
          },
        ];
      return [
        {
          bankId: tool.cardId,
          phase: "install" as const,
          actionIds: installActionIds,
          priorityClass: "P5" as const,
          currentStoredCredits,
          portfolioStoredCredits,
          estimatedPayout,
          value: 350,
          evidenceCodes: ["runner_credit_bank_install_ready", ...tool.evidence],
        },
      ];
    }

    const convertibleRunFundingRoute = runnerCreditBankRunFundingRoute({
      input,
      candidates,
      economy,
      runTargets,
      cashOutActionIds: tool.cashOutActionIds,
      estimatedPayout,
    });
    const convertibleRunFundingNeed = convertibleRunFundingRoute !== undefined;
    const developmentCashOutAdmission = assessRunnerDevelopmentCashOutAdmission(
      {
        evaluations: handDevelopment,
        currentCredits: input.playerView.own.credits,
        estimatedPayout,
        clicksRemaining: input.playerView.own.clicks,
        gripCount: input.playerView.own.gripOrHq.length,
        minimumHandBuffer,
      },
    );
    const developmentCashOutTarget =
      developmentCashOutAdmission.route === undefined
        ? undefined
        : handDevelopment.find(
            (evaluation) =>
              evaluation.cardInstanceId ===
              developmentCashOutAdmission.route!.targetCardInstanceId,
          );
    const developmentCashOutFundingRoute =
      developmentCashOutTarget &&
      runnerDevelopmentCashOutTargetCanMaterialize(developmentCashOutTarget)
        ? runnerDevelopmentFundingRoute(
            input,
            candidates,
            developmentCashOutTarget,
          )
        : undefined;
    const exactCashOutActionIds = new Set(tool.cashOutActionIds);
    const materializedDevelopmentCashOutActionIds =
      developmentCashOutFundingRoute?.actionIds.filter((actionId) =>
        exactCashOutActionIds.has(actionId),
      ) ?? [];
    const convertibleDevelopmentFundingNeed =
      developmentCashOutAdmission.admitted &&
      materializedDevelopmentCashOutActionIds.length > 0;
    const urgentCreditFloor =
      input.playerView.own.credits <= 2 ||
      input.playerView.own.credits < economy.minimumCreditFloor;
    // A card-bound development cashout is materialized by that development
    // plan's funding step. The bank plan may only cash out for an exact,
    // consuming run-funding route; low liquid credits or a static bank value
    // target do not create a conversion need by themselves.
    const shouldCashOut =
      tool.cashOutActionLegal &&
      estimatedPayout > 0 &&
      !convertibleDevelopmentFundingNeed &&
      convertibleRunFundingNeed;
    if (shouldCashOut) {
      return [
        {
          bankId: tool.cardId,
          phase: "cash_out" as const,
          actionIds: tool.cashOutActionIds,
          rejectedActionIds: tool.buildActionIds,
          priorityClass: "P2" as const,
          currentStoredCredits,
          portfolioStoredCredits,
          estimatedPayout,
          value: 1_200 + estimatedPayout,
          evidenceCodes: [
            "runner_credit_bank_cashout_for_run_funding",
            ...tool.evidence,
            ...(convertibleRunFundingRoute?.evidenceCodes ?? []),
            ...(developmentCashOutAdmission.route?.evidenceCodes ?? []),
          ],
        },
      ];
    }

    const combinedCreditAccess =
      input.playerView.own.credits + currentStoredCredits;
    const alreadyBuiltThisTurn = creditBankBuiltThisTurn(input, tool.cardId);
    const shouldBuild =
      tool.buildActionLegal &&
      !alreadyBuiltThisTurn &&
      !convertibleRunFundingNeed &&
      !convertibleDevelopmentFundingNeed &&
      (!urgentCreditFloor || input.playerView.own.clicks === 1) &&
      input.playerView.own.credits < 15 &&
      combinedCreditAccess < 20 &&
      currentStoredCredits < 12;
    if (!shouldBuild)
      return [
        {
          bankId: tool.cardId,
          phase: "hold" as const,
          actionIds: [],
          rejectedActionIds: [
            ...tool.buildActionIds,
            ...(convertibleDevelopmentFundingNeed ? [] : tool.cashOutActionIds),
          ],
          priorityClass: "P5" as const,
          currentStoredCredits,
          portfolioStoredCredits,
          estimatedPayout,
          value: 0,
          evidenceCodes: [
            developmentCashOutAdmission.admitted &&
            !convertibleDevelopmentFundingNeed
              ? `runner_credit_bank_cashout_delegation_missing_exact_route:${developmentCashOutAdmission.route?.targetCardInstanceId ?? "unknown"}`
              : alreadyBuiltThisTurn
                ? "runner_credit_bank_hold_already_built_this_turn"
                : combinedCreditAccess >= 20 || currentStoredCredits >= 12
                  ? "runner_credit_bank_hold_comfortable_value"
                  : convertibleDevelopmentFundingNeed
                    ? "runner_credit_bank_cashout_delegated_to_development_plan"
                    : "runner_credit_bank_hold_no_current_conversion_need",
            ...(developmentCashOutAdmission.route?.evidenceCodes ?? []),
            ...(developmentCashOutAdmission.admitted &&
            !convertibleDevelopmentFundingNeed
              ? [...(developmentCashOutFundingRoute?.evidenceCodes ?? [])]
              : []),
            ...developmentCashOutAdmission.rejectionCodes,
            ...tool.evidence,
          ],
        },
      ];
    return [
      {
        bankId: tool.cardId,
        phase: "build" as const,
        actionIds: tool.buildActionIds,
        rejectedActionIds: convertibleDevelopmentFundingNeed
          ? []
          : tool.cashOutActionIds,
        priorityClass: "P5" as const,
        currentStoredCredits,
        portfolioStoredCredits,
        estimatedPayout,
        value:
          (currentStoredCredits === 0 ? 60 : 40) +
          Math.max(0, 12 - currentStoredCredits),
        evidenceCodes: [
          currentStoredCredits === 0
            ? "runner_credit_bank_first_load"
            : "runner_credit_bank_continue_to_value_target",
          ...(urgentCreditFloor && input.playerView.own.clicks === 1
            ? ["runner_credit_bank_last_click_deferred_value"]
            : []),
          ...tool.evidence,
        ],
      },
    ];
  });
}

function runnerDevelopmentCashOutTargetCanMaterialize(
  evaluation: RunnerHandDevelopmentEvaluation,
): boolean {
  return (
    evaluation.availability === "missing_credits" &&
    evaluation.deferReason === "missing_credits" &&
    evaluation.fundingNeed !== undefined &&
    evaluation.definitionId !== undefined &&
    !runnerDefinitionRequiresTargetedBypassPlan(evaluation.definitionId) &&
    !hasNoRunRecurringEconomyCommitment(evaluation.definitionId) &&
    !evaluation.activationPrerequisites.some(
      (prerequisite) => prerequisite.kind === "same_turn_access",
    )
  );
}

function runnerCreditBankRunFundingRoute(params: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  economy: RunnerEconomyPosture;
  runTargets: readonly RunnerRunTargetEvaluation[];
  cashOutActionIds: readonly string[];
  estimatedPayout: number;
}): { evidenceCodes: string[] } | undefined {
  const remainingFundingClicks = Math.max(
    0,
    params.input.playerView.own.clicks - 1,
  );
  if (remainingFundingClicks <= 0 || params.cashOutActionIds.length === 0) {
    return undefined;
  }
  const cashOutActionIds = new Set(params.cashOutActionIds);
  for (const evaluation of [...params.runTargets].sort((left, right) => {
    const urgencyDelta =
      Number(runnerRunHasExactUrgency(params.input, right)) -
      Number(runnerRunHasExactUrgency(params.input, left));
    return (
      urgencyDelta ||
      right.score - left.score ||
      left.actionId.localeCompare(right.actionId)
    );
  })) {
    if (
      evaluation.accessTargetKind === "archives" ||
      evaluation.knownAccessState === "known_no_current_payoff"
    ) {
      continue;
    }
    const requiredPostRunReserve = runnerRunRequiredPostRunReserve(
      params.input,
      params.candidates,
      params.economy,
      evaluation,
    );
    const admission = assessRunnerRunFundingAdmission({
      target: evaluation,
      runTargets: params.runTargets,
      economy: params.economy,
      urgentScoreThreat: runnerRunHasExactUrgency(params.input, evaluation),
      ...(requiredPostRunReserve !== undefined
        ? { requiredPostRunReserve }
        : {}),
    });
    if (!admission.admitted) continue;
    const exactUrgentConvertibleTarget =
      runnerRunHasExactUrgency(params.input, evaluation) &&
      evaluation.score > 0 &&
      evaluation.recommendation === "gain_credits_first";
    if (!exactUrgentConvertibleTarget) continue;
    const conversionFundingGap = Math.max(
      admission.routeFundingGap,
      Math.max(0, -evaluation.creditsAfterRun),
    );
    if (conversionFundingGap <= 0) continue;
    const demand = createRunnerCreditDemand({
      demandId: `run-support:${evaluation.actionId}`,
      sourcePlanId:
        evaluation.accessTargetKind === "remote"
          ? `runner.contest_remote:${evaluation.targetServerId}`
          : `runner.pressure_central:${evaluation.targetServerId}`,
      purpose: "foreground_plan",
      priority: "current_foreground_plan",
      hardness: "hard",
      deadline: "end_of_current_turn",
      currentCredits: params.input.playerView.own.credits,
      targetCredits: params.input.playerView.own.credits + conversionFundingGap,
      evidence: [
        `run_funding_target:${evaluation.targetServerId}`,
        `run_funding_gap:${conversionFundingGap}`,
      ],
    });
    const route = searchFundingRoutes({
      demand,
      candidates: params.candidates,
      remainingClicks: remainingFundingClicks,
      maxSteps: remainingFundingClicks,
      maxRoutes: 16,
    }).routes.find(
      (candidateRoute) =>
        candidateRoute.status === "covered_guaranteed" &&
        candidateRoute.horizon === "same_turn" &&
        candidateRoute.steps[0]?.actionId !== undefined &&
        cashOutActionIds.has(candidateRoute.steps[0].actionId),
    );
    if (route) {
      return {
        evidenceCodes: [
          `runner_credit_bank_bound_run_target:${evaluation.targetServerId}`,
          `runner_credit_bank_bound_funding_demand:${demand.demandId}`,
          `runner_credit_bank_bound_funding_route:${route.routeId}`,
          `runner_credit_bank_bound_funding_gap:${conversionFundingGap}`,
          `runner_credit_bank_bound_admission_gap:${admission.concreteFundingGap}`,
          ...admission.evidenceCodes,
        ],
      };
    }
  }
  return undefined;
}

function creditBankBuiltThisTurn(
  input: AiDecisionInput,
  sourceDefinitionId: string,
): boolean {
  const events = uniqueBy(
    [...input.playerView.publicEvents, ...input.eventTail],
    (event) => event.eventId,
  ).sort(
    (left, right) =>
      left.stateVersionAfter - right.stateVersionAfter ||
      left.eventId.localeCompare(right.eventId),
  );
  let turnStartIndex = -1;
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event?.type === "end_turn" && event.publicPayload?.actor === "corp") {
      turnStartIndex = index;
      break;
    }
  }
  return events.slice(turnStartIndex + 1).some((event) => {
    const resolvedEffects = Array.isArray(event.publicPayload?.resolvedEffects)
      ? event.publicPayload.resolvedEffects
      : [];
    return (
      event.type === "activated_card_ability" &&
      event.publicPayload?.actor === "runner" &&
      event.publicPayload?.sourceDefinitionId === sourceDefinitionId &&
      resolvedEffects.some(
        (effect) =>
          typeof effect === "object" &&
          effect !== null &&
          "kind" in effect &&
          effect.kind === "add_hosted_credits",
      )
    );
  });
}

function planSafeRunExclusionEvidence(evidence: readonly string[]): string[] {
  const allowedPrefixes = [
    "access_payoff:",
    "known_access_state:",
    "path:",
    "recommendation:",
    "visible_ice_hazard:",
    "visible_ice_trace_base:",
    "visible_trace_",
    "unavoidable_visible_ice_hazard_count:",
    "hq_run_suppressed_",
    "rd_run_suppressed_",
    "semantic_excluded:",
  ];
  return evidence.filter((entry) =>
    allowedPrefixes.some((prefix) => entry.startsWith(prefix)),
  );
}

function runnerRecurringEconomySignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): NonNullable<RunnerCorePlanDomain["recurringEconomy"]> {
  const installedSources = (input.playerView.own.rig ?? []).filter((card) =>
    hasNoRunRecurringEconomyCommitment(card.definitionId),
  );
  const installedSignals = installedSources.flatMap((card) => {
    const definitionId = card.definitionId;
    if (
      !definitionId ||
      recurringEconomyValueAlreadyResolved(input, definitionId)
    )
      return [];
    const holdActionIds = candidates
      .filter(
        (candidate) =>
          candidate.sourceCardInstanceId === card.instanceId &&
          candidate.sourceDefinitionId === definitionId &&
          !candidate.effectTargets?.some((target) =>
            [
              "economy.bank_cashout_all",
              "economy.bank_load",
              "economy.temporary_resource_bank",
            ].includes(target),
          ) &&
          ((candidate.semanticActionType === "draw.card" &&
            input.playerView.own.gripOrHq.length <
              input.playerView.own.maxHandSize) ||
            candidate.semanticActionType === "economy.gain_credit"),
      )
      .map((candidate) => candidate.actionId);
    return [
      {
        commitmentId: card.instanceId,
        definitionId,
        phase: "hold" as const,
        actionIds: holdActionIds,
        priorityClass: "P4" as const,
        value: recurringEconomyCommitmentValue(definitionId) * 100,
        evidenceCodes: [
          "runner_recurring_economy_waiting_for_turn_start_value",
          holdActionIds.length > 0
            ? `runner_recurring_economy_own_hold_action_count:${holdActionIds.length}`
            : "runner_recurring_economy_waiting_without_own_action",
        ],
      },
    ];
  });
  const installSignals = candidates.flatMap((candidate) => {
    if (
      candidate.semanticActionType !== "install.card" ||
      !candidate.sourceDefinitionId ||
      !hasNoRunRecurringEconomyCommitment(candidate.sourceDefinitionId)
    )
      return [];
    const lowValueRunExists = input.legalActions.some(
      (action) => action.type === "start_run",
    );
    const productiveSetupAlternative = input.legalActions.some(
      (action) =>
        action.actionId !== candidate.actionId &&
        action.type !== "start_run" &&
        action.type !== "end_turn",
    );
    const setupWindow =
      input.playerView.own.clicks >= 2 &&
      (productiveSetupAlternative || !lowValueRunExists);
    return [
      {
        commitmentId:
          candidate.sourceCardInstanceId ??
          candidate.sourceCardId ??
          candidate.sourceDefinitionId,
        definitionId: candidate.sourceDefinitionId,
        phase: setupWindow ? ("install" as const) : ("hold" as const),
        actionIds: setupWindow ? [candidate.actionId] : [],
        priorityClass: setupWindow ? ("P4" as const) : ("P5" as const),
        value: setupWindow ? 300 : 0,
        evidenceCodes: [
          setupWindow
            ? "runner_recurring_economy_install_ready"
            : "runner_recurring_economy_install_deferred_no_setup_window",
        ],
      },
    ];
  });
  return uniqueBy(
    [...installedSignals, ...installSignals],
    (signal) => signal.commitmentId,
  );
}

function recurringEconomyCommitmentValue(definitionId: string): number {
  const amounts = (AI_HINTS_BY_CARD.get(definitionId)?.effects ?? [])
    .filter((effect) => effect.kind === "economy")
    .map((effect) => effect.amount)
    .filter(
      (amount): amount is number =>
        typeof amount === "number" && Number.isFinite(amount) && amount > 0,
    );
  return amounts.length > 0 ? Math.max(...amounts) : 1;
}

function runnerResourceLifecycleSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): NonNullable<RunnerCorePlanDomain["resourceLifecycle"]> {
  const loanFromChibaActions = candidates.filter(
    (candidate) =>
      candidate.semanticActionType === "turn_flow.end_turn" &&
      candidate.sourceKind === "card" &&
      candidate.sourceDefinitionId === "onr_v1_168_loan-from-chiba",
  );
  if (loanFromChibaActions.length === 0) return [];
  const visibleRemainingRunnerTurnCeiling = input.playerView.opponent.deckCount;
  const actionsBySourceInstance = new Map<string, ActionSemanticCandidate[]>();
  for (const candidate of loanFromChibaActions) {
    const sourceCardInstanceId = candidate.sourceCardInstanceId;
    if (sourceCardInstanceId === undefined) continue;
    const actions = actionsBySourceInstance.get(sourceCardInstanceId) ?? [];
    actions.push(candidate);
    actionsBySourceInstance.set(sourceCardInstanceId, actions);
  }
  return [...actionsBySourceInstance.entries()].map(
    ([sourceCardInstanceId, actions]) => {
      const lifecycleId = `onr_v1_168_loan-from-chiba:${sourceCardInstanceId}`;
      const quote = runnerLifecycleLeavePlayPaymentQuote(
        input,
        sourceCardInstanceId,
        actions,
      );
      const leavePlayEconomicallyProductive =
        quote !== undefined && visibleRemainingRunnerTurnCeiling > quote.amount;
      const marginalValue = leavePlayEconomicallyProductive
        ? visibleRemainingRunnerTurnCeiling - quote.amount
        : 0;
      const capacitySpent = input.playerView.own.clicks === 0;
      const supportNeedId = `resource-lifecycle-support:${sourceCardInstanceId}`;
      const fundingGap =
        quote?.status === "unpayable"
          ? Math.max(0, quote.amount - input.playerView.own.credits)
          : 0;
      const fundingRoute =
        quote?.status === "unpayable" &&
        leavePlayEconomicallyProductive &&
        !capacitySpent &&
        fundingGap > 0
          ? runnerExactFundingRouteContract(input, candidates, {
              demandId: supportNeedId,
              sourcePlanId: planInstanceIdForProposal({
                moduleId: "runner.resource_lifecycle",
                dedupeKey: lifecycleId,
              }),
              purpose: "foreground_plan",
              priority: "current_foreground_plan",
              hardness: "hard",
              deadline: "end_of_current_turn",
              targetCredits: quote.amount,
              remainingClicks: input.playerView.own.clicks,
              evidence: [
                `runner_resource_lifecycle_source:${sourceCardInstanceId}`,
                `runner_resource_lifecycle_exact_payment_amount:${quote.amount}`,
              ],
            })
          : undefined;
      const fullFundingRouteExists =
        fundingRoute?.routeAssessment.status === "covered_guaranteed" &&
        fundingRoute.routeAssessment.reliability === "guaranteed" &&
        fundingRoute.routeAssessment.horizon === "same_turn" &&
        fundingRoute.routeAssessment.projectedGap === 0 &&
        fundingRoute.routeActionIds.length > 0;
      const leavePlayNow =
        quote?.status === "payable" &&
        capacitySpent &&
        leavePlayEconomicallyProductive;
      const evidenceCode =
        quote === undefined
          ? "runner_loan_from_chiba_leave_payment_quote_unknown"
          : !leavePlayEconomicallyProductive
            ? `runner_loan_from_chiba_leave_cost_not_recovered_within_visible_horizon:${visibleRemainingRunnerTurnCeiling}`
            : quote.status === "payable"
              ? capacitySpent
                ? `runner_loan_from_chiba_leave_avoids_visible_long_horizon_liability:${visibleRemainingRunnerTurnCeiling}`
                : "runner_loan_from_chiba_leave_deferred_until_capacity_spent"
              : capacitySpent
                ? "runner_loan_from_chiba_leave_unpayable_without_action_capacity"
                : fullFundingRouteExists
                  ? "runner_loan_from_chiba_waiting_for_exact_funding_support"
                  : "runner_loan_from_chiba_exact_funding_route_unavailable";
      return {
        lifecycleId,
        sourceCardInstanceId,
        definitionId: "onr_v1_168_loan-from-chiba",
        phase: leavePlayNow ? "leave_play" : "retain",
        actionIds: leavePlayNow
          ? actions.map((candidate) => candidate.actionId)
          : [],
        ...(!leavePlayNow
          ? {
              rejectedActionIds: actions.map((candidate) => candidate.actionId),
            }
          : {}),
        ...(fullFundingRouteExists && fundingRoute && quote
          ? {
              supportNeedId,
              marginalValue,
              leavePlayPaymentAmount: quote.amount,
              fundingGap,
              fundingRouteActionIds: fundingRoute.routeActionIds,
              fundingRouteAssessment: fundingRoute.routeAssessment,
            }
          : {}),
        priorityClass: "P5",
        value: leavePlayNow || fullFundingRouteExists ? marginalValue : 0,
        evidenceCodes: [
          evidenceCode,
          ...(quote
            ? [
                `runner_loan_from_chiba_leave_play_payment_amount:${quote.amount}`,
                `runner_loan_from_chiba_leave_play_payment_status:${quote.status}`,
              ]
            : []),
        ],
      };
    },
  );
}

function runnerLifecycleLeavePlayPaymentQuote(
  input: AiDecisionInput,
  sourceCardInstanceId: string,
  candidates: readonly ActionSemanticCandidate[],
): { amount: number; status: "payable" | "unpayable" } | undefined {
  const quotes = candidates.map((candidate) => {
    const action = input.legalActions.find(
      (entry) => entry.actionId === candidate.actionId,
    );
    const amount =
      action?.payload?.cardImplementationLifecycleLeavePlayPaymentAmount;
    const status =
      action?.payload?.cardImplementationLifecycleLeavePlayPaymentStatus;
    if (
      !action ||
      action.source !== sourceCardInstanceId ||
      action.payload?.cardId !== sourceCardInstanceId ||
      action.payload?.cardImplementationLifecycleAction !==
        "end_of_runner_turn" ||
      typeof amount !== "number" ||
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      (status !== "payable" && status !== "unpayable") ||
      (input.playerView.own.credits >= amount
        ? status !== "payable"
        : status !== "unpayable")
    ) {
      return undefined;
    }
    return { amount, status };
  });
  const [first] = quotes;
  if (
    !first ||
    quotes.some(
      (quote) =>
        !quote ||
        quote.amount !== first.amount ||
        quote.status !== first.status,
    )
  ) {
    return undefined;
  }
  return first;
}

function hasNoRunRecurringEconomyCommitment(
  definitionId: string | undefined,
): boolean {
  if (!definitionId) return false;
  const targets = new Set(
    (AI_HINTS_BY_CARD.get(definitionId)?.effects ?? [])
      .map((effect) => effect.target)
      .filter((target): target is string => typeof target === "string"),
  );
  return (
    targets.has("economy.turn_start_credit") && targets.has("risk.ends_on_run")
  );
}

function recurringEconomyValueAlreadyResolved(
  input: AiDecisionInput,
  definitionId: string,
): boolean {
  const events = uniqueBy(
    [...input.playerView.publicEvents, ...input.eventTail],
    (event) => event.eventId,
  );
  return events.some((event) => {
    const effects = event.publicPayload?.resolvedEffects;
    if (!Array.isArray(effects)) return false;
    return effects.some((effect) => {
      const value = effect as Record<string, unknown>;
      return (
        value.sourceDefinitionId === definitionId &&
        value.kind === "gain_credits" &&
        value.reason === "start_of_turn" &&
        typeof value.amount === "number" &&
        value.amount > 0
      );
    });
  });
}

function uniqueCoverageGaps(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  runTargets: readonly RunnerRunTargetEvaluation[],
  installedRoles: ReadonlySet<string>,
  deckCapabilities: DeckCapabilityProfile,
  strategicIntent: RunnerStrategicIntentProfile,
): RunnerCorePlanDomain["coverageGaps"] {
  const result = new Map<
    string,
    RunnerCorePlanDomain["coverageGaps"][number]
  >();
  const coverageSearchInterrupt = runTargets.some((evaluation) => {
    if (
      (evaluation.pathPassability !== "blocked_missing_coverage" &&
        evaluation.pathPassability !== "blocked_unbreakable") ||
      !evaluation.evidence.some((entry) =>
        entry.startsWith("missing_coverage:"),
      )
    ) {
      return false;
    }
    const preciseCoverage = missingBreakerCoverageKind(
      input.playerView,
      evaluation.targetServerId,
    );
    const role = planFirstCoverageRole(preciseCoverage, evaluation.evidence);
    return (
      runnerDeckHasCoverageAnswer(deckCapabilities, role) &&
      coverageSupportActionIds(input, candidates, deckCapabilities, role)
        .searchEngineSetupActionIds.length > 0
    );
  });
  for (const evaluation of runTargets) {
    if (evaluation.recommendation !== "find_breaker_first") continue;
    const preciseCoverage = missingBreakerCoverageKind(
      input.playerView,
      evaluation.targetServerId,
    );
    const role = planFirstCoverageRole(preciseCoverage, evaluation.evidence);
    if (installedRoles.has(role)) continue;
    const visibleAnswer = runnerHandBreakerForCoverage(
      input.playerView,
      preciseCoverage,
    );
    const answerInstallCost = visibleAnswer?.installCost;
    const fundingGap =
      answerInstallCost === undefined
        ? undefined
        : Math.max(0, answerInstallCost - input.playerView.own.credits);
    const deckHasAnswer =
      visibleAnswer !== undefined ||
      runnerDeckHasCoverageAnswer(deckCapabilities, role);
    const supportActions = coverageSupportActionIds(
      input,
      candidates,
      deckCapabilities,
      role,
    );
    result.set(role, {
      gapId: `coverage:${role}`,
      requiredRole: role,
      targetServerId: evaluation.targetServerId,
      priorityClass: evaluation.scoreThreat
        ? "P2"
        : visibleAnswer
          ? "P4"
          : "P5",
      evidenceCode: evaluation.evidence[0] ?? `missing_${role}`,
      deckHasAnswer,
      answerInHand: visibleAnswer !== undefined,
      ...(answerInstallCost !== undefined ? { answerInstallCost } : {}),
      ...(fundingGap !== undefined ? { fundingGap } : {}),
      fundingActionIds: runnerCoverageFundingActionIds(
        input,
        candidates,
        `coverage:${role}`,
        answerInstallCost,
        fundingGap,
      ),
      ...supportActions,
    });
  }
  if (
    (strategicIntent.setupEngine ?? []).includes("runner.rig_first") ||
    (strategicIntent.setupEngine ?? []).includes(
      "runner.search_breaker_setup",
    ) ||
    strategicIntent.executionStyle === "runner.setup_first" ||
    coverageSearchInterrupt
  ) {
    const matrix = deckCapabilities.runner?.breakerCoverageMatrix;
    for (const [coverage, role] of [
      ["wall", "breaker_wall"],
      ["code_gate", "breaker_code_gate"],
      ["sentry", "breaker_sentry"],
    ] as const) {
      const state = matrix?.[coverage];
      if (
        !state ||
        state.installed ||
        installedRoles.has(role) ||
        (!state.inDeckKnown && !state.inHand)
      ) {
        continue;
      }
      const existing = result.get(role);
      if (existing) {
        if (
          existing.priorityClass !== "P2" &&
          state.inHand &&
          existing.priorityClass === "P5"
        ) {
          result.set(role, { ...existing, priorityClass: "P4" });
        }
        continue;
      }
      const visibleAnswer = runnerHandBreakerForCoverage(
        input.playerView,
        role,
      );
      const answerInstallCost = visibleAnswer?.installCost;
      const fundingGap =
        answerInstallCost === undefined
          ? undefined
          : Math.max(0, answerInstallCost - input.playerView.own.credits);
      const supportActions = coverageSupportActionIds(
        input,
        candidates,
        deckCapabilities,
        role,
      );
      result.set(role, {
        gapId: `coverage:${role}`,
        requiredRole: role,
        priorityClass:
          state.inHand || (coverageSearchInterrupt && state.searchableNow)
            ? "P4"
            : "P5",
        evidenceCode:
          coverageSearchInterrupt && state.searchableNow
            ? `visible_${coverage}_coverage_search_interrupt`
            : `deck_strategy_open_${coverage}_coverage`,
        deckHasAnswer: state.inDeckKnown || state.inHand,
        answerInHand: visibleAnswer !== undefined,
        ...(answerInstallCost !== undefined ? { answerInstallCost } : {}),
        ...(fundingGap !== undefined ? { fundingGap } : {}),
        fundingActionIds: runnerCoverageFundingActionIds(
          input,
          candidates,
          `coverage:${role}`,
          answerInstallCost,
          fundingGap,
        ),
        ...supportActions,
      });
    }
  }
  return [...result.values()];
}

function runnerCoverageFundingActionIds(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  gapId: string,
  answerInstallCost: number | undefined,
  fundingGap: number | undefined,
): string[] {
  if (
    answerInstallCost === undefined ||
    fundingGap === undefined ||
    fundingGap <= 0
  ) {
    return [];
  }
  return runnerExactFundingRouteContract(input, candidates, {
    demandId: `${gapId}:fund-answer`,
    sourcePlanId: `runner.rig_and_coverage:${gapId}`,
    purpose: "breaker_for_current_plan",
    priority: "current_foreground_plan",
    hardness: "hard",
    deadline: "end_of_current_turn",
    targetCredits: answerInstallCost,
    remainingClicks: Math.max(0, input.playerView.own.clicks - 1),
    allowIncrementalProgress: true,
    evidence: [
      `coverage_gap:${gapId}`,
      "coverage_install_conversion_click_reserved:1",
    ],
  }).routeActionIds;
}

function coverageSupportActionIds(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  deckCapabilities: DeckCapabilityProfile,
  requiredRole: RunnerCorePlanDomain["coverageGaps"][number]["requiredRole"],
): Pick<
  RunnerCorePlanDomain["coverageGaps"][number],
  | "directSearchActionIds"
  | "directSearchChoiceBindings"
  | "rejectedSearchActionIds"
  | "searchEngineSetupActionIds"
  | "drawForAnswerActionIds"
> {
  const deckHasAnswer = runnerDeckHasCoverageAnswer(
    deckCapabilities,
    requiredRole,
  );
  const searchTools = (
    deckCapabilities.runner?.searchAccess.tools ?? []
  ).filter((tool) => tool.canSearchBreakers);
  const searchToolIds = new Set(searchTools.map((tool) => tool.cardId));
  const matchingSearchCandidates = candidates.filter((candidate) => {
    const sourceDefinitionId = runnerCandidateSourceDefinitionId(
      input,
      candidate,
    );
    return (
      sourceDefinitionId !== undefined &&
      searchToolIds.has(sourceDefinitionId) &&
      candidate.semanticActionType !== "install.card"
    );
  });
  const directSearchCandidates = deckHasAnswer ? matchingSearchCandidates : [];
  const matchingSearchActionIds = new Set(
    matchingSearchCandidates.map((candidate) => candidate.actionId),
  );
  const searchEngineSetupCandidates = (deckHasAnswer ? candidates : []).filter(
    (candidate) => {
      const sourceDefinitionId = runnerCandidateSourceDefinitionId(
        input,
        candidate,
      );
      return (
        candidate.semanticActionType === "install.card" &&
        sourceDefinitionId !== undefined &&
        searchToolIds.has(sourceDefinitionId)
      );
    },
  );
  const searchEngineSetupActionIds = new Set(
    searchEngineSetupCandidates.map((candidate) => candidate.actionId),
  );
  return {
    directSearchActionIds: directSearchCandidates.map(
      (candidate) => candidate.actionId,
    ),
    directSearchChoiceBindings: directSearchCandidates.flatMap((candidate) => {
      const legalAction = input.legalActions.find(
        (action) => action.actionId === candidate.actionId,
      );
      const sourceCardInstanceId =
        candidate.sourceCardInstanceId ?? legalAction?.source;
      const sourceDefinitionId = runnerCandidateSourceDefinitionId(
        input,
        candidate,
      );
      return sourceCardInstanceId && sourceDefinitionId
        ? [
            {
              actionId: candidate.actionId,
              sourceCardInstanceId,
              sourceDefinitionId,
            },
          ]
        : [];
    }),
    rejectedSearchActionIds: deckHasAnswer
      ? []
      : matchingSearchCandidates.map((candidate) => candidate.actionId),
    searchEngineSetupActionIds: searchEngineSetupCandidates.map(
      (candidate) => candidate.actionId,
    ),
    drawForAnswerActionIds: candidates
      .filter(
        (candidate) =>
          !matchingSearchActionIds.has(candidate.actionId) &&
          !searchEngineSetupActionIds.has(candidate.actionId) &&
          candidate.sourceKind === "card" &&
          (candidate.actionTacticSignals.includes("draw.card") ||
            candidate.actionTacticSignals.includes("setup.draw") ||
            (candidate.economyProjection?.cardsDrawn ?? 0) > 1),
      )
      .map((candidate) => candidate.actionId),
  };
}

function runnerDeckHasCoverageAnswer(
  deckCapabilities: DeckCapabilityProfile,
  requiredRole: RunnerCorePlanDomain["coverageGaps"][number]["requiredRole"],
): boolean {
  const requiredCoverage = coverageKindForPlanRole(requiredRole);
  return (
    deckCapabilities.runner?.breakerInventory.some(
      (breaker) =>
        (breaker.coverage.includes(requiredCoverage) ||
          breaker.coverage.includes("universal")) &&
        breaker.quantityKnownInDeck > 0 &&
        (breaker.locations.includes("in_deck") ||
          breaker.locations.includes("in_hand")),
    ) ?? false
  );
}

function coverageKindForPlanRole(
  role: RunnerCorePlanDomain["coverageGaps"][number]["requiredRole"],
): "wall" | "code_gate" | "sentry" | "ap" | "trace" | "universal" {
  switch (role) {
    case "breaker_wall":
      return "wall";
    case "breaker_code_gate":
      return "code_gate";
    case "breaker_sentry":
      return "sentry";
    case "breaker_ap":
      return "ap";
    case "breaker_trace":
      return "trace";
    case "breaker_universal":
      return "universal";
  }
}

function planFirstCoverageRole(
  preciseCoverage: ReturnType<typeof missingBreakerCoverageKind>,
  evidence: readonly string[],
): RunnerCorePlanDomain["coverageGaps"][number]["requiredRole"] {
  if (preciseCoverage === "breaker_wall") return "breaker_wall";
  if (preciseCoverage === "breaker_code_gate") return "breaker_code_gate";
  if (preciseCoverage === "breaker_sentry") return "breaker_sentry";
  if (preciseCoverage === "breaker_ap") return "breaker_ap";
  if (preciseCoverage === "breaker_trace") return "breaker_trace";
  return requiredBreakerRole(evidence);
}

function requiredBreakerRole(
  evidence: readonly string[],
): RunnerCorePlanDomain["coverageGaps"][number]["requiredRole"] {
  const joined = evidence.join(" ").toLowerCase();
  if (joined.includes("code_gate") || joined.includes("code-gate"))
    return "breaker_code_gate";
  if (joined.includes("sentry")) return "breaker_sentry";
  if (joined.includes("breaker_ap") || joined.includes("anti-personnel"))
    return "breaker_ap";
  if (joined.includes("breaker_trace") || joined.includes("trace"))
    return "breaker_trace";
  if (joined.includes("wall") || joined.includes("barrier"))
    return "breaker_wall";
  return "breaker_universal";
}

function bindRunnerRemoteRunActionAssessments(
  input: AiDecisionInput,
  economy: RunnerEconomyPosture,
  signal: RunnerRemoteContestSignalDraft,
  runTargets: readonly RunnerRunTargetEvaluation[],
  candidates: readonly ActionSemanticCandidate[],
): RunnerRemoteContestSignal {
  const currentActionIds = new Set(
    candidates.map((candidate) => candidate.actionId),
  );
  const evaluations = runTargets.filter(
    (evaluation) =>
      evaluation.targetKind === "remote" &&
      evaluation.targetServerId === signal.serverId &&
      currentActionIds.has(evaluation.actionId),
  );
  const duplicateActionIds = evaluations
    .map((evaluation) => evaluation.actionId)
    .filter(
      (actionId, index, actionIds) => actionIds.indexOf(actionId) !== index,
    );
  if (duplicateActionIds.length > 0) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [...new Set(duplicateActionIds)],
      owner: "plan_module",
      removalCondition:
        "Each exact same-server Runner run action must have exactly one run-target evaluation before the Remote plan can classify it.",
    });
  }
  const preferredActionIds = new Set(signal.preferredRunActionIds ?? []);
  const evaluatedRunActionAssessments = evaluations.map((evaluation) => {
    const fundingSupport = runnerRunFundingSupport(
      input,
      economy,
      evaluation,
      runTargets,
      candidates,
    );
    const directRunCanConvertNow = runnerRunTargetCanConvertNow(
      input,
      economy,
      evaluation,
      candidates,
    );
    const productiveProbeCanConvertNow = runnerRemoteProbeCanConvertNow(
      input,
      economy,
      evaluation,
    );
    const irrecoverableScoreThreatContest =
      runnerIrrecoverableBlinkScoreThreatContest(input, candidates, evaluation);
    const directRunRouteReady =
      evaluation.recommendation === "run_now" ||
      evaluation.recommendation === "run_if_free" ||
      productiveProbeCanConvertNow ||
      directRunCanConvertNow;
    const specialRouteMembership =
      signal.constrainedActionCapacity === true ||
      signal.evidenceCode === "visible_known_agenda_remote";
    const executable =
      signal.routePreparation === undefined &&
      signal.reachable &&
      signal.marginalValue > 0 &&
      (specialRouteMembership
        ? preferredActionIds.has(evaluation.actionId)
        : irrecoverableScoreThreatContest ||
          (evaluation.pathPassability === "reachable" &&
            evaluation.score > 0 &&
            fundingSupport === undefined &&
            directRunRouteReady));
    const evidenceCodes = executable
      ? [
          `runner_remote_run_variant_executable:${signal.serverId}:${evaluation.actionId}`,
          ...evaluation.evidence,
        ]
      : [
          runnerRemoteRunVariantNonproductiveEvidence(
            signal,
            evaluation,
            fundingSupport,
            preferredActionIds,
          ),
          ...evaluation.evidence,
        ];
    return [
      evaluation.actionId,
      {
        verdict: executable
          ? ("executable" as const)
          : ("explicitly_nonproductive" as const),
        stepValue: executable ? signal.marginalValue + evaluation.score : 0,
        evidenceCodes,
      },
    ];
  });
  const releaseRunLockAssessments =
    signal.routePreparation === "release_run_lock"
      ? candidates
          .filter((candidate) => preferredActionIds.has(candidate.actionId))
          .map((candidate) => [
            candidate.actionId,
            {
              verdict: signal.reachable
                ? ("executable" as const)
                : ("explicitly_nonproductive" as const),
              stepValue: signal.reachable ? signal.marginalValue : 0,
              evidenceCodes: [
                signal.reachable
                  ? `runner_remote_run_lock_release_executable:${signal.serverId}:${candidate.actionId}`
                  : `runner_remote_run_lock_release_blocked:${signal.serverId}:${candidate.actionId}`,
              ],
            },
          ])
      : [];
  const runActionAssessments = Object.fromEntries([
    ...evaluatedRunActionAssessments,
    ...releaseRunLockAssessments,
  ]);
  const { preferredRunActionIds: _preferredRunActionIds, ...normalized } =
    signal;
  return {
    ...normalized,
    runActionAssessments,
  };
}

function runnerRemoteRunVariantNonproductiveEvidence(
  signal: RunnerRemoteContestSignalDraft,
  evaluation: RunnerRunTargetEvaluation,
  fundingSupport: RunnerRunFundingSupport | undefined,
  preferredActionIds: ReadonlySet<string>,
): string {
  if (signal.routePreparation) {
    return `runner_remote_run_deferred_to_bound_preparation:${signal.serverId}:${signal.routePreparation}`;
  }
  if (
    signal.constrainedActionCapacity &&
    !preferredActionIds.has(evaluation.actionId)
  ) {
    return `runner_remote_run_not_bound_to_restricted_capacity:${signal.serverId}`;
  }
  if (signal.supportNeedId || fundingSupport) {
    return `runner_remote_run_deferred_to_bound_funding_support:${signal.serverId}:${signal.supportNeedId ?? fundingSupport!.needId}`;
  }
  if (evaluation.knownAccessState === "known_no_current_payoff") {
    return `runner_remote_run_known_no_current_payoff:${signal.serverId}:${evaluation.recommendation}`;
  }
  if (evaluation.pathPassability !== "reachable") {
    return `runner_remote_run_route_blocked:${signal.serverId}:${evaluation.pathPassability}`;
  }
  if (evaluation.score <= 0) {
    return `runner_remote_run_below_material_value:${signal.serverId}:${evaluation.score}:${evaluation.recommendation}`;
  }
  if (!signal.reachable) {
    return `runner_remote_run_plan_not_executable:${signal.serverId}:${signal.evidenceCode}`;
  }
  return `runner_remote_run_not_currently_convertible:${signal.serverId}:${evaluation.recommendation}`;
}

function bestRunTargetsByServer(
  input: AiDecisionInput,
  economy: RunnerEconomyPosture,
  evaluations: readonly RunnerRunTargetEvaluation[],
  candidates: readonly ActionSemanticCandidate[],
): RunnerRunTargetEvaluation[] {
  const byServer = new Map<string, RunnerRunTargetEvaluation>();
  for (const evaluation of evaluations) {
    const previous = byServer.get(evaluation.targetServerId);
    const evaluationConvertsNow = runnerRunTargetCanConvertNow(
      input,
      economy,
      evaluation,
      candidates,
    );
    const previousConvertsNow =
      previous !== undefined &&
      runnerRunTargetCanConvertNow(input, economy, previous, candidates);
    if (
      !previous ||
      (evaluationConvertsNow && !previousConvertsNow) ||
      (evaluationConvertsNow === previousConvertsNow &&
        evaluation.score > previous.score)
    ) {
      byServer.set(evaluation.targetServerId, evaluation);
    }
  }
  return [...byServer.values()];
}

function witnessedRunRouteExists(
  candidates: readonly ActionSemanticCandidate[],
  evaluations: readonly RunnerRunTargetEvaluation[],
  serverId: string,
): boolean {
  const serverEvaluations = evaluations.filter(
    (evaluation) => evaluation.targetServerId === serverId,
  );
  if (serverEvaluations.length > 0) {
    return serverEvaluations.some(
      (evaluation) => evaluation.pathPassability === "reachable",
    );
  }
  return candidates.some(
    (candidate) =>
      candidate.semanticActionType === "run.start" &&
      candidate.runProjectionSummary?.serverId === serverId,
  );
}

function witnessedRunActionIds(
  candidates: readonly ActionSemanticCandidate[],
  evaluations: readonly RunnerRunTargetEvaluation[],
  serverId: string,
  terminalCentralAccess = false,
): string[] {
  const serverEvaluations = evaluations.filter(
    (evaluation) => evaluation.targetServerId === serverId,
  );
  if (serverEvaluations.length > 0) {
    return serverEvaluations
      .filter(
        (evaluation) =>
          evaluation.pathPassability === "reachable" &&
          (evaluation.recommendation === "run_now" ||
            evaluation.recommendation === "run_if_free") &&
          (evaluation.score > 0 || terminalCentralAccess) &&
          evaluation.knownAccessState !== "known_no_current_payoff",
      )
      .map((evaluation) => evaluation.actionId);
  }
  return candidates
    .filter(
      (candidate) =>
        candidate.semanticActionType === "run.start" &&
        candidate.runProjectionSummary?.serverId === serverId,
    )
    .map((candidate) => candidate.actionId);
}

function witnessedKnownAgendaRunEvaluations(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  evaluations: readonly RunnerRunTargetEvaluation[],
  serverId: string,
): RunnerRunTargetEvaluation[] {
  return evaluations
    .filter((evaluation) =>
      runnerKnownAgendaRunEvaluationIsCertified(
        input,
        candidates,
        evaluation,
        serverId,
      ),
    )
    .sort((left, right) => left.actionId.localeCompare(right.actionId));
}

function runnerKnownAgendaRunEvaluationIsCertified(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  evaluation: RunnerRunTargetEvaluation,
  serverId: string,
): boolean {
  const candidate = candidates.find(
    (entry) =>
      entry.actionId === evaluation.actionId &&
      entry.runProjectionSummary?.serverId === serverId &&
      (entry.semanticActionType === "run.start" ||
        entry.semanticActionType === "play.runner_event"),
  );
  const server = input.playerView.servers.find(
    (entry) => entry.id === serverId,
  );
  const exactVisibleIceQuotes =
    server !== undefined &&
    server.ice.every(
      (ice) =>
        ice.known !== false &&
        ice.rezzed === true &&
        ice.effectiveRunQuote !== undefined &&
        ice.effectiveRunQuote.iceInstanceId === ice.instanceId &&
        Number.isFinite(ice.effectiveRunQuote.effectiveStrength),
    );
  const quote = evaluation.routeQuote;
  return (
    candidate !== undefined &&
    exactVisibleIceQuotes &&
    evaluation.targetServerId === serverId &&
    evaluation.accessServerId === serverId &&
    evaluation.targetKind === "remote" &&
    evaluation.accessTargetKind === "remote" &&
    evaluation.accessPayoff === "agenda" &&
    evaluation.knownAccessState === "known_payoff" &&
    evaluation.pathPassability === "reachable" &&
    (evaluation.recommendation === "run_now" ||
      evaluation.recommendation === "run_if_free") &&
    quote !== undefined &&
    quote.reachability === "guaranteed_access" &&
    Number.isFinite(quote.knownCost) &&
    Number.isFinite(quote.guaranteedKnownCost) &&
    Number.isFinite(quote.availableCredits) &&
    Number.isFinite(quote.fundingGap) &&
    quote.fundingGap === 0 &&
    quote.unknownIceCount === 0 &&
    Number.isFinite(evaluation.creditsAfterRun) &&
    evaluation.creditsAfterRun >= 0
  );
}

function visibleKnownAgendaOnServer(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  return (
    input.playerView.servers
      .find((server) => server.id === serverId)
      ?.root.some((card) => card.known !== false && card.type === "agenda") ===
    true
  );
}

function runnerUnboundCentralDirectRunDispositionEvidence(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  evaluation: RunnerRunTargetEvaluation,
): string | undefined {
  const legalAction = input.legalActions.find(
    (action) => action.actionId === evaluation.actionId,
  );
  const candidate = candidates.find(
    (entry) =>
      entry.actionId === evaluation.actionId &&
      entry.semanticActionType === "run.start" &&
      entry.runProjectionSummary?.serverId === evaluation.targetServerId,
  );
  if (
    !candidate ||
    legalAction?.type !== "start_run" ||
    legalAction.payload?.serverId !== evaluation.targetServerId ||
    evaluation.accessServerId !== evaluation.targetServerId
  ) {
    return undefined;
  }
  const quote = evaluation.routeQuote;
  const quoteKnown =
    quote !== undefined &&
    Number.isFinite(quote.knownCost) &&
    Number.isFinite(quote.guaranteedKnownCost) &&
    Number.isFinite(quote.availableCredits) &&
    Number.isFinite(quote.fundingGap) &&
    Number.isFinite(evaluation.creditsAfterRun);
  if (!quoteKnown) {
    return `runner_central_direct_run_quote_unknown:${evaluation.targetServerId}:${evaluation.actionId}`;
  }
  const exactRouteEvidence = [
    `access_${quote.reachability}`,
    `funding_gap_${quote.fundingGap}`,
    `credits_after_${evaluation.creditsAfterRun}`,
    `hazards_${evaluation.unavoidableVisibleIceHazardCount ?? 0}`,
    `score_${evaluation.score}`,
    `recommendation_${evaluation.recommendation}`,
  ].join(":");
  if (
    evaluation.knownAccessState === "known_no_current_payoff" ||
    quote.reachability !== "guaranteed_access" ||
    quote.fundingGap > 0 ||
    evaluation.creditsAfterRun < 0 ||
    evaluation.score <= 0 ||
    (evaluation.recommendation !== "run_now" &&
      evaluation.recommendation !== "run_if_free")
  ) {
    return `runner_central_direct_run_exact_route_nonproductive:${evaluation.targetServerId}:${exactRouteEvidence}`;
  }
  return undefined;
}

function sourceDefinitionForEvaluation(
  evaluation: RunnerRunTargetEvaluation,
  candidates: readonly ActionSemanticCandidate[],
): string | undefined {
  return candidates.find(
    (candidate) => candidate.actionId === evaluation.actionId,
  )?.sourceDefinitionId;
}

function visiblePendingDamage(
  candidates: readonly ActionSemanticCandidate[],
): number {
  return candidates.some(
    (candidate) =>
      candidate.semanticActionType.startsWith("damage.prevent") ||
      candidate.actionTacticSignals.includes("damage_prevention"),
  )
    ? 1
    : 0;
}

function isRunWindowSemantic(candidate: ActionSemanticCandidate): boolean {
  return (
    candidate.semanticActionType === "run.continue" ||
    candidate.semanticActionType === "run.jack_out" ||
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
    isRunWindowSemantic(candidate) ||
    runnerCandidateHasVisibleAdditionalAccessEffect(candidate) ||
    runnerRestrictedRunSequenceAction(input, candidate) !== undefined ||
    (candidate.sourceDefinitionId === "onr_proteus_091_lockjaw" &&
      runnerCandidateIsCardAbility(candidate) &&
      (input.playerView.timingPoint === "run.encounter_ice" ||
        input.playerView.timingPoint === "run.jack_out_window"))
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

function currentRunAbortAssessment(
  input: AiDecisionInput,
): { evidenceCode: string } | undefined {
  const run = input.playerView.run;
  if (!run || !input.legalActions.some((action) => action.type === "jack_out"))
    return undefined;
  const server = input.playerView.servers.find(
    (entry) => entry.id === run.attackedServerId,
  );
  if (!server) return undefined;
  if (
    run.phase === "movement" &&
    run.position?.kind === "server" &&
    run.attackedServerId.startsWith("remote_")
  ) {
    if (runnerRemoteHasKnownNoCurrentPayoff(input, run.attackedServerId)) {
      return {
        evidenceCode: `runner_current_run_known_no_payoff:${run.attackedServerId}`,
      };
    }
  }
  const remainingIce = currentRunRemainingIce(input);
  if (remainingIce.length === 0) return undefined;
  const generalCredits =
    input.playerView.own.credits +
    Math.max(0, input.playerView.run?.badPublicityCredits ?? 0);
  const path = assessKnownRezzedIcePath(
    remainingIce,
    input.playerView.own.rig ?? [],
    runnerRunPathCreditBudgetWithVisiblePools(
      generalCredits,
      input.playerView.own.rig ?? [],
    ),
    server.root,
    input.playerView.opponent.credits,
  );
  return path.canReachAccess
    ? undefined
    : {
        evidenceCode: `runner_current_run_remaining_path_unreachable:${run.attackedServerId}`,
      };
}

function runnerRunWindowActionAssessments(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  dependencies: PlanFirstLiveDependencies,
  runOrigin:
    | {
        purpose?: "access" | "multiaccess" | "information" | "contest";
        encounterCreditSpendLimit?: number;
      }
    | undefined,
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
    assessments[candidate.actionId] = runnerRunWindowActionAssessment(
      input,
      candidate,
      action,
      dependencies,
      runOrigin,
    );
  }
  return assessments;
}

function runnerRunWindowActionAssessment(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  action: AiDecisionInput["legalActions"][number],
  dependencies: PlanFirstLiveDependencies,
  runOrigin:
    | {
        purpose?: "access" | "multiaccess" | "information" | "contest";
        encounterCreditSpendLimit?: number;
      }
    | undefined,
): RunnerRunWindowActionAssessment {
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
  if (!input.playerView.run) {
    if (restrictedRunSequenceAction) {
      const serverId = restrictedRunSequenceAction.payload?.serverId;
      const costProfile =
        restrictedRunSequenceAction.payload?.restrictedActionGrantCostProfile;
      const costFree =
        costProfile === "no_click" &&
        restrictedRunSequenceAction.costs.every(
          (cost) => (cost.clicks ?? 0) === 0,
        );
      return {
        admissible: typeof serverId === "string" && serverId.length > 0,
        ...(costFree ? { value: 250 } : {}),
        evidenceCodes: [
          "runner_engine_restricted_run_sequence_continuation",
          `runner_restricted_run_sequence_action:${restrictedRunSequenceAction.actionId}`,
          `runner_restricted_run_sequence_target:${typeof serverId === "string" ? serverId : "unknown"}`,
          `runner_restricted_run_sequence_remaining:${Number(restrictedRunSequenceAction.payload?.restrictedActionGrantRemainingActions)}`,
          ...(costFree
            ? [
                "runner_restricted_run_sequence_cost_profile:no_click",
                "runner_restricted_run_sequence_cost_free_route_preferred",
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
    (candidate.sourceDefinitionId === "onr_proteus_091_lockjaw" &&
      runnerCandidateIsCardAbility(candidate) &&
      (input.playerView.timingPoint === "run.encounter_ice" ||
        input.playerView.timingPoint === "run.jack_out_window"));
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
  const planStepExclusion = runnerRunWindowPlanStepExclusion(
    input,
    action,
    dependencies,
    runOrigin,
  );
  const exclusion = encounterExclusion ?? planStepExclusion;
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
        evidenceCodes: [
          accessAction
            ? "runner_access_window_action_plan_admissible"
            : action.type === "pump_breaker" ||
                action.type === "break_subroutine"
              ? "runner_encounter_action_plan_admissible"
              : "runner_run_window_action_plan_admissible",
          `runner_run_window_action:${action.type}`,
        ],
      };
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
  if (safetyRequiresJackOut) {
    return admissibleRunWindowCandidates
      .filter((candidate) => candidate.actionType === "jack_out")
      .map((candidate) => candidate.actionId);
  }
  if (encounterRequiresTargetPreservingBreak) {
    const directEncounterRoutes = admissibleRunWindowCandidates.filter(
      (candidate) =>
        candidate.actionType === "pump_breaker" ||
        candidate.actionType === "break_subroutine",
    );
    if (directEncounterRoutes.length > 0) {
      return directEncounterRoutes.map((candidate) => candidate.actionId);
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
  if (run.phase === "movement" && run.position?.kind === "server") {
    return admissibleRunWindowCandidates
      .filter((candidate) => candidate.actionType === "continue_run")
      .map((candidate) => candidate.actionId);
  }
  return [];
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
  runOrigin:
    | {
        purpose?: "access" | "multiaccess" | "information" | "contest";
        encounterCreditSpendLimit?: number;
      }
    | undefined,
): SemanticRuntimeExclusion | undefined {
  const run = input.playerView.run;
  if (!run) return undefined;

  if (
    (action.type === "pump_breaker" || action.type === "break_subroutine") &&
    runOrigin?.purpose === "information" &&
    runOrigin.encounterCreditSpendLimit !== undefined &&
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
    currentActiveRunHasKnownNoPayoff(input)
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
      undefined
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

function legalActionCreditCost(
  action: AiDecisionInput["legalActions"][number],
): number {
  return action.costs.reduce(
    (sum, cost) => sum + Math.max(0, cost.credits ?? 0),
    0,
  );
}

function runPurposeForEvaluation(
  evaluation: RunnerRunTargetEvaluation,
): "access" | "multiaccess" | "information" | "contest" {
  if (evaluation.scoreThreat) return "contest";
  if (evaluation.multiaccessAvailable) return "multiaccess";
  if (
    evaluation.recommendation === "run_if_free" &&
    (evaluation.knownAccessState === "unknown" ||
      evaluation.knownAccessState === "fresh")
  ) {
    return "information";
  }
  return evaluation.targetKind === "remote" ? "contest" : "access";
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

function candidateTargetIds(candidate: ActionSemanticCandidate): string[] {
  const selectedTargets =
    candidate.targetContext?.selectedTargets.map((target) => target.targetId) ??
    [];
  return [
    ...(selectedTargets.length > 0
      ? selectedTargets
      : (candidate.targetContext?.availableTargets?.map(
          (target) => target.targetId,
        ) ?? [])),
    ...(candidate.runProjectionSummary?.serverId
      ? [candidate.runProjectionSummary.serverId]
      : []),
  ];
}

function candidateIsVisibleCorpIceInstall(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  if (candidate.semanticActionType !== "install.card") return false;
  const visibleSource = requireVisibleCandidateSource(input, candidate);
  return visibleKnownCardType(input, visibleSource) === "ice";
}

function candidateIsVisibleCorpAgendaInstall(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  if (candidate.semanticActionType !== "install.card") return false;
  const visibleSource = requireVisibleCandidateSource(input, candidate);
  return visibleCardIsAgenda(input, visibleSource);
}

function corpRezEstablishesPersistentDefenseSupport(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  serverId: string,
): boolean {
  if (!candidate.sourceDefinitionId) return false;
  const hint = AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId);
  const isExplicitDefenseSupport =
    hint?.roles?.includes("run_defense") === true &&
    hint?.planRoles?.includes("remote_upgrade_rez_support") === true;
  if (!isExplicitDefenseSupport) return false;
  const server = input.playerView.servers.find(
    (candidateServer) => candidateServer.id === serverId,
  );
  return (server?.ice.length ?? 0) > 0;
}

type CorpRunDefenseAbilityAssessment = {
  productive: boolean;
  serverId: string;
  value: number;
  evidenceCode: string;
};

function corpRunDefenseAbilityAssessment(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): CorpRunDefenseAbilityAssessment | undefined {
  if (!candidate.sourceDefinitionId) return undefined;
  const hint = AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId);
  const isFortIceSwap =
    hint?.effects?.some(
      (effect) =>
        effect.kind === "zone_shuffle" &&
        effect.scope === "hq" &&
        effect.target === "ice.corp_hq_runpath_insert" &&
        effect.timing === "during_run",
    ) === true && hint?.functionSignals?.includes("ice.corp_ice_swap") === true;
  if (!isFortIceSwap) return undefined;
  const legalAction = input.legalActions.find(
    (action) => action.actionId === candidate.actionId,
  );
  if (!legalAction)
    throw new PlanResolutionFailure("stale_or_future_action_reference", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [candidate.actionId],
      owner: "action_semantics",
      removalCondition:
        "Bind the fort ICE-swap assessment to the current exact LegalAction.",
    });
  if (legalAction.payload?.abilityId !== "hq_ice_swap") return undefined;
  const sourceCardId = candidate.sourceCardInstanceId;
  const serverId = sourceCardId
    ? serverForInstalledCard(input, sourceCardId)
    : undefined;
  if (!serverId) {
    return {
      productive: false,
      serverId: "unknown",
      value: 0,
      evidenceCode:
        "corp_run_defense_ice_swap_source_not_bound_to_visible_fort",
    };
  }
  const run = input.playerView.run;
  if (
    !run ||
    run.attackedServerId !== serverId ||
    run.position?.kind !== "ice"
  ) {
    return {
      productive: false,
      serverId,
      value: 0,
      evidenceCode:
        "corp_run_defense_ice_swap_has_no_exact_current_fort_encounter",
    };
  }
  const server = input.playerView.servers.find(
    (candidateServer) => candidateServer.id === serverId,
  );
  const currentIce = server?.ice[run.position.iceIndex];
  if (!currentIce || currentIce.rezzed === true) {
    return {
      productive: false,
      serverId,
      value: 0,
      evidenceCode:
        "corp_run_defense_ice_swap_has_no_unrezzed_exact_encounter_ice",
    };
  }
  return {
    productive: false,
    serverId,
    value: 0,
    evidenceCode: "corp_run_defense_ice_swap_has_no_engine_certified_rez_quote",
  };
}

function visibleIceDefenseValue(card: VisibleCard): number {
  const strength =
    typeof card.strength === "number" && Number.isFinite(card.strength)
      ? Math.max(0, card.strength)
      : 0;
  const rulesText = card.rulesText?.toLowerCase() ?? "";
  return (
    strength +
    (rulesText.includes("end the run") ? 4 : 0) +
    (rulesText.includes("damage") ? 2 : 0) +
    (rulesText.includes("trash a program") ? 2 : 0)
  );
}

function corpFutureEncounterRezSupportAssessment(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  sourceCard: VisibleCard,
  serverId: string,
):
  | {
      productive: boolean;
      evidenceCode: string;
    }
  | undefined {
  const legalAction = input.legalActions.find(
    (action) => action.actionId === candidate.actionId,
  );
  if (!legalAction)
    throw new PlanResolutionFailure("stale_or_future_action_reference", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [candidate.actionId],
      owner: "action_semantics",
      removalCondition:
        "Bind the future-encounter rez assessment to the current exact LegalAction.",
    });
  if (hasCorpFortRunRezSupportQuotePayload(legalAction.payload)) {
    return corpFortRunRezSupportAssessment(input, candidate, serverId);
  }
  if (!candidate.sourceDefinitionId) return undefined;
  const hint = AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId);
  const usesVisibleHqIceForFutureEncounter =
    hint?.effects?.some(
      (effect) =>
        effect.kind === "future_encounter_effect" &&
        effect.target === "ice.corp_hq_runpath_insert",
    ) === true;
  if (!usesVisibleHqIceForFutureEncounter) return undefined;
  if (
    candidate.sourceCardInstanceId === undefined ||
    serverForInstalledCard(input, candidate.sourceCardInstanceId) !== serverId
  )
    return {
      productive: false,
      evidenceCode:
        "corp_rez_future_encounter_support_source_not_bound_to_fort",
    };
  const timing = corpRootRezTimingComponent(input, legalAction, sourceCard);
  if (!timing || timing.value <= 0)
    return {
      productive: false,
      evidenceCode: timing
        ? `corp_rez_future_encounter_support_deferred:${timing.key}`
        : "corp_rez_future_encounter_support_has_no_relevant_run_window",
    };
  const hqIce = input.playerView.own.gripOrHq.filter(
    (card) => visibleKnownCardType(input, card) === "ice",
  );
  if (hqIce.length === 0)
    return {
      productive: false,
      evidenceCode: "corp_rez_future_encounter_support_has_no_visible_hq_ice",
    };
  return {
    productive: false,
    evidenceCode:
      "corp_rez_future_encounter_support_has_no_engine_certified_rez_quote",
  };
}

const CORP_FORT_RUN_REZ_SUPPORT_QUOTE_PAYLOAD_FIELDS = [
  "cardImplementationFortRunRezSupportQuoteSchemaVersion",
  "cardImplementationFortRunRezSupportQuoteKind",
  "cardImplementationFortRunRezSupportQuoteComplete",
  "cardImplementationFortRunRezSupportQuoteSourceCardInstanceId",
  "cardImplementationFortRunRezSupportQuoteTargetServerId",
  "cardImplementationFortRunRezSupportQuoteStateVersion",
  "cardImplementationFortRunRezSupportQuoteActionId",
  "cardImplementationFortRunRezSupportQuoteRezCredits",
  "cardImplementationFortRunRezSupportQuoteInstallCredits",
  "cardImplementationFortRunRezSupportQuoteTotalCredits",
  "cardImplementationFortRunRezSupportQuoteTotalCreditsPayable",
  "cardImplementationFortRunRezSupportQuoteHasOwnHqIce",
] as const;

function hasCorpFortRunRezSupportQuotePayload(
  payload: LegalAction["payload"],
): boolean {
  return CORP_FORT_RUN_REZ_SUPPORT_QUOTE_PAYLOAD_FIELDS.some(
    (field) => payload?.[field] !== undefined,
  );
}

function corpFortRunRezSupportAssessment(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  serverId: string,
): { productive: boolean; evidenceCode: string } {
  if (
    !candidate.sourceCardInstanceId ||
    serverForInstalledCard(input, candidate.sourceCardInstanceId) !== serverId
  ) {
    return {
      productive: false,
      evidenceCode:
        "corp_rez_fort_run_support_source_not_bound_to_successful_run_fort",
    };
  }
  const legalAction = input.legalActions.find(
    (action) => action.actionId === candidate.actionId,
  );
  if (!legalAction)
    throw new PlanResolutionFailure("stale_or_future_action_reference", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [candidate.actionId],
      owner: "action_semantics",
      removalCondition:
        "Bind the fort-run rez-support assessment to the current exact LegalAction.",
    });
  const payload = legalAction.payload;
  const rezCredits =
    payload?.cardImplementationFortRunRezSupportQuoteRezCredits;
  const installCredits =
    payload?.cardImplementationFortRunRezSupportQuoteInstallCredits;
  const totalCredits =
    payload?.cardImplementationFortRunRezSupportQuoteTotalCredits;
  const currentCredits = input.playerView.own.credits;
  const listedRezCredits = legalAction.costs.reduce(
    (sum, cost) => (cost.credits === undefined ? sum : sum + cost.credits),
    0,
  );
  if (
    candidate.legalActionRef.actionId !== candidate.actionId ||
    candidate.legalActionRef.actionType !== legalAction.type ||
    candidate.stateVersion !== input.playerView.stateVersion ||
    legalAction.source !== candidate.sourceCardInstanceId ||
    payload?.cardImplementationFortRunRezSupportQuoteSchemaVersion !==
      CORP_FORT_RUN_REZ_SUPPORT_QUOTE_SCHEMA_VERSION ||
    payload.cardImplementationFortRunRezSupportQuoteKind !==
      CORP_FORT_RUN_REZ_SUPPORT_KIND ||
    payload.cardImplementationFortRunRezSupportQuoteComplete !== true ||
    payload.cardImplementationFortRunRezSupportQuoteSourceCardInstanceId !==
      candidate.sourceCardInstanceId ||
    payload.cardImplementationFortRunRezSupportQuoteTargetServerId !==
      serverId ||
    payload.cardImplementationFortRunRezSupportQuoteStateVersion !==
      input.playerView.stateVersion ||
    payload.cardImplementationFortRunRezSupportQuoteActionId !==
      candidate.actionId ||
    !isFiniteNonNegativeInteger(rezCredits) ||
    !isFiniteNonNegativeInteger(installCredits) ||
    !isFiniteNonNegativeInteger(totalCredits) ||
    !isFiniteNonNegativeInteger(currentCredits) ||
    legalAction.costs.some(
      (cost) =>
        cost.credits !== undefined && !isFiniteNonNegativeInteger(cost.credits),
    ) ||
    !Number.isSafeInteger(listedRezCredits) ||
    rezCredits !== listedRezCredits ||
    !Number.isSafeInteger(rezCredits + installCredits) ||
    totalCredits !== rezCredits + installCredits ||
    typeof payload.cardImplementationFortRunRezSupportQuoteTotalCreditsPayable !==
      "boolean" ||
    payload.cardImplementationFortRunRezSupportQuoteTotalCreditsPayable !==
      currentCredits >= totalCredits ||
    typeof payload.cardImplementationFortRunRezSupportQuoteHasOwnHqIce !==
      "boolean"
  ) {
    return {
      productive: false,
      evidenceCode:
        "corp_rez_fort_run_support_has_no_complete_consistent_engine_quote",
    };
  }
  if (!payload.cardImplementationFortRunRezSupportQuoteHasOwnHqIce) {
    return {
      productive: false,
      evidenceCode: "corp_rez_fort_run_support_engine_quote_has_no_hq_ice",
    };
  }
  if (!payload.cardImplementationFortRunRezSupportQuoteTotalCreditsPayable) {
    return {
      productive: false,
      evidenceCode:
        "corp_rez_fort_run_support_engine_quote_total_credits_unpayable",
    };
  }
  return {
    productive: true,
    evidenceCode:
      "corp_rez_fort_run_support_same_fort_run_with_affordable_hq_ice_install",
  };
}

type CorpExactCardRezSupportAssessment = {
  productive: boolean;
  serverId: string;
  value: number;
  evidenceCode: string;
};

function corpExactCardRezSupportAssessment(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  sourceCard: VisibleCard,
  serverId: string,
): CorpExactCardRezSupportAssessment | undefined {
  if (
    candidate.sourceCardInstanceId !== sourceCard.instanceId ||
    serverForInstalledCard(input, sourceCard.instanceId) !== serverId
  ) {
    return undefined;
  }
  const hint = candidate.sourceDefinitionId
    ? AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId)
    : sourceCard.definitionId
      ? AI_HINTS_BY_CARD.get(sourceCard.definitionId)
      : undefined;
  const exactAgendaStealTax =
    hint?.quality?.hintReviewed === true &&
    hint.quality.strategyCovered === true &&
    hint.quality.confidence === "high" &&
    hint.remoteRole?.kind === "agenda_steal_tax" &&
    hint.remoteRole.serverScope === "fort" &&
    hint.planRoles?.includes("remote_upgrade_tax") === true &&
    hint.planRoles.includes("protect_remote") &&
    hint.functionSignals?.includes("remote.agenda_steal_tax") === true &&
    hint.functionSignals.includes("tax.runner_credit") &&
    hint.effects?.some(
      (effect) =>
        effect.kind === "run_tax" &&
        effect.scope === "accessed_card" &&
        effect.timing === "on_access" &&
        typeof effect.amount === "number" &&
        effect.amount > 0,
    ) === true &&
    hint.effects.some(
      (effect) =>
        effect.kind === "remote_protection" &&
        effect.scope === "fort" &&
        effect.timing === "persistent",
    );
  if (exactAgendaStealTax) {
    if (!visibleKnownAgendaOnServer(input, serverId)) {
      return {
        productive: false,
        serverId,
        value: 0,
        evidenceCode:
          "corp_rez_agenda_steal_tax_has_no_visible_agenda_on_exact_fort",
      };
    }
    const action = input.legalActions.find(
      (legalAction) => legalAction.actionId === candidate.actionId,
    );
    const timing = action
      ? corpRootRezTimingComponent(input, action, sourceCard)
      : undefined;
    if (!timing || timing.value <= 0) {
      return {
        productive: false,
        serverId,
        value: 0,
        evidenceCode: `corp_rez_agenda_steal_tax_not_at_latest_relevant_window:${timing?.key ?? "missing_timing_quote"}`,
      };
    }
    return {
      productive: true,
      serverId,
      value: 180,
      evidenceCode:
        "corp_rez_agenda_steal_tax_protects_visible_agenda_at_latest_relevant_window",
    };
  }
  if (candidate.sourceDefinitionId === "onr_v1_320_encoder-inc") {
    const installedCodeGateIds = input.playerView.servers.flatMap((server) =>
      server.ice.flatMap((ice) => {
        const definition = ice.definitionId
          ? CARD_DEFINITIONS_BY_ID[ice.definitionId]
          : undefined;
        return definition?.subtypes.includes("code_gate")
          ? [ice.instanceId]
          : [];
      }),
    );
    return installedCodeGateIds.length > 0
      ? {
          productive: true,
          serverId,
          value: 120,
          evidenceCode: `corp_rez_encoder_inc_supports_visible_code_gates:${installedCodeGateIds.join(",")}`,
        }
      : {
          productive: false,
          serverId,
          value: 0,
          evidenceCode:
            "corp_rez_encoder_inc_has_no_visible_installed_code_gate",
        };
  }
  if (candidate.sourceDefinitionId === "onr_v1_317_data-masons") {
    const installedWallIds = input.playerView.servers.flatMap((server) =>
      server.ice.flatMap((ice) => {
        const definition = ice.definitionId
          ? CARD_DEFINITIONS_BY_ID[ice.definitionId]
          : undefined;
        return definition?.subtypes.includes("wall") ? [ice.instanceId] : [];
      }),
    );
    return installedWallIds.length > 0
      ? {
          productive: true,
          serverId,
          value: 120,
          evidenceCode: `corp_rez_data_masons_supports_visible_installed_walls:${installedWallIds.join(",")}`,
        }
      : {
          productive: false,
          serverId,
          value: 0,
          evidenceCode: "corp_rez_data_masons_has_no_visible_installed_wall",
        };
  }
  if (
    candidate.sourceDefinitionId === "onr_v1_370_tesseract-fort-construction"
  ) {
    const server = input.playerView.servers.find(
      (candidateServer) => candidateServer.id === serverId,
    );
    if (!server || server.ice.length === 0) {
      return {
        productive: false,
        serverId,
        value: 0,
        evidenceCode: "corp_rez_tesseract_has_no_ice_on_exact_installed_fort",
      };
    }
    const run = input.playerView.run;
    if (!run) {
      return {
        productive: true,
        serverId,
        value: 120,
        evidenceCode:
          "corp_rez_tesseract_establishes_persistent_exact_fort_ice_support",
      };
    }
    const exactUpcomingEncounter =
      run.attackedServerId === serverId && run.position?.kind === "ice";
    return exactUpcomingEncounter
      ? {
          productive: true,
          serverId,
          value: 160,
          evidenceCode:
            "corp_rez_tesseract_supports_current_exact_fort_ice_encounter",
        }
      : {
          productive: false,
          serverId,
          value: 0,
          evidenceCode:
            run.attackedServerId === serverId
              ? "corp_rez_tesseract_current_run_has_no_upcoming_ice_encounter"
              : "corp_rez_tesseract_current_run_is_on_another_fort",
        };
  }
  const establishesFortWideIceStrengthSupport =
    hint?.effects?.some(
      (effect) =>
        effect.kind === "remote_protection" &&
        effect.scope === "fort" &&
        effect.target === "ice.corp_strength_support" &&
        effect.timing === "persistent",
    ) === true;
  if (establishesFortWideIceStrengthSupport) {
    const server = input.playerView.servers.find(
      (candidateServer) => candidateServer.id === serverId,
    );
    if (!server || server.ice.length === 0) {
      return {
        productive: false,
        serverId,
        value: 0,
        evidenceCode:
          "corp_rez_fort_ice_strength_support_has_no_ice_on_exact_fort",
      };
    }
    const run = input.playerView.run;
    if (!run) {
      return {
        productive: true,
        serverId,
        value: 120,
        evidenceCode:
          "corp_rez_establishes_persistent_exact_fort_ice_strength_support",
      };
    }
    const exactUpcomingEncounter =
      run.attackedServerId === serverId && run.position?.kind === "ice";
    return exactUpcomingEncounter
      ? {
          productive: true,
          serverId,
          value: 160,
          evidenceCode: "corp_rez_supports_current_exact_fort_ice_strength",
        }
      : {
          productive: false,
          serverId,
          value: 0,
          evidenceCode:
            run.attackedServerId === serverId
              ? "corp_rez_fort_ice_strength_support_has_no_upcoming_ice_encounter"
              : "corp_rez_fort_ice_strength_support_current_run_is_on_another_fort",
        };
  }
  return undefined;
}

function corpConditionalRezSupportWithoutCurrentRouteEvidence(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  sourceCard: VisibleCard,
  scoreProjects: readonly CorpScoreProjectSignal[],
): string | undefined {
  if (!candidate.sourceDefinitionId) return undefined;
  const serverId = candidate.sourceCardInstanceId
    ? serverForInstalledCard(input, candidate.sourceCardInstanceId)
    : undefined;
  if (serverId) {
    const exactAssessment = corpExactCardRezSupportAssessment(
      input,
      candidate,
      sourceCard,
      serverId,
    );
    if (exactAssessment && !exactAssessment.productive) {
      return exactAssessment.evidenceCode;
    }
    if (
      exactAssessment?.productive === true &&
      !corpCardRoutePreservesScoreReserve(
        input,
        candidate,
        serverId,
        scoreProjects,
      ).preservesReserve
    ) {
      return "corp_rez_exact_card_support_breaks_score_reserve";
    }
  }
  const definition = CARD_DEFINITIONS_BY_ID[candidate.sourceDefinitionId];
  if (definition?.mechanics.includes("ice_install_cost_mod_server"))
    return "corp_rez_fort_ice_discount_has_no_same_fort_install_route";
  if (candidate.sourceDefinitionId === "onr_v1_324_fortress-architects")
    return "corp_rez_ice_install_discount_has_no_engine_certified_post_rez_install_quote";
  const hint = AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId);
  if (
    hint?.effects?.some(
      (effect) =>
        effect.kind === "future_encounter_effect" &&
        effect.target === "ice.corp_hq_runpath_insert",
    ) === true
  ) {
    const futureEncounterServerId = candidate.sourceCardInstanceId
      ? serverForInstalledCard(input, candidate.sourceCardInstanceId)
      : undefined;
    if (!futureEncounterServerId)
      return "corp_rez_future_encounter_support_source_not_bound_to_fort";
    const assessment = corpFutureEncounterRezSupportAssessment(
      input,
      candidate,
      sourceCard,
      futureEncounterServerId,
    );
    return assessment?.productive ? undefined : assessment?.evidenceCode;
  }
  return undefined;
}

function serverForInstalledCard(
  input: AiDecisionInput,
  cardId: string,
): string | undefined {
  return input.playerView.servers.find((server) =>
    [...server.ice, ...server.root].some((card) => card.instanceId === cardId),
  )?.id;
}

function visibleInstalledCard(input: AiDecisionInput, cardId: string) {
  return input.playerView.servers
    .flatMap((server) => [...server.ice, ...server.root])
    .find((card) => card.instanceId === cardId);
}

function visibleRunnerVirusCounters(input: AiDecisionInput): number {
  const installedCounters = (input.playerView.opponent.rig ?? []).reduce(
    (sum, card) => sum + (card.counters?.virus ?? 0),
    0,
  );
  const identityCounters =
    input.playerView.own.identity.counterDisplays?.reduce((sum, display) => {
      if (display.displayKind !== "virus") return sum;
      const amount = Math.max(0, Math.floor(display.amount ?? 0));
      const activeThreshold =
        display.counterType === "highlighter" ||
        display.counterType === "garbage" ||
        display.counterType === "cascade"
          ? 2
          : 1;
      return amount >= activeThreshold ? sum + amount : sum;
    }, 0) ?? 0;
  return installedCounters + identityCounters;
}

function isServerId(value: string): boolean {
  return (
    value === "hq" ||
    value === "rd" ||
    value === "archives" ||
    value.startsWith("remote_")
  );
}

function isCorpInstallServerId(value: string): boolean {
  return value === "new_remote" || isServerId(value);
}

function archivesIsKnownWithoutAgenda(input: AiDecisionInput): boolean {
  if (input.playerView.opponent.discardCount === 0) return true;
  const visibleCards = input.playerView.servers.find(
    (server) => server.id === "archives",
  )?.root;
  if (!visibleCards) return false;
  if (visibleCards.some((card) => !card.known)) return false;
  if (visibleCards.length < input.playerView.opponent.discardCount)
    return false;
  return !visibleCards.some((card) => card.type === "agenda");
}

function archivesHasVisibleKnownAgenda(input: AiDecisionInput): boolean {
  return (
    input.playerView.servers
      .find((server) => server.id === "archives")
      ?.root.some((card) => card.known && card.type === "agenda") === true
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

function turnKey(input: AiDecisionInput): string {
  return `${input.side}:${input.playerView.turnSerial ?? input.actionNumber}`;
}

function corpResidentTurnLiquidityDevelopment(
  previous: ResidentPlanPortfolio | undefined,
  currentTurnKey: string,
):
  | {
      targetCredits: number;
      maximumConversions: number;
      revalidatedAtStateVersion: number;
    }
  | undefined {
  const instance = previous?.instances.find(
    (candidate) =>
      candidate.moduleId === "corp.economy" &&
      candidate.dedupeKey === `economy-liquidity-development:${currentTurnKey}`,
  );
  const moduleState = instance?.moduleState as
    | {
        kind?: unknown;
        signal?: Partial<CorpEconomyLiquidityDevelopmentSignal>;
      }
    | undefined;
  const signal = moduleState?.signal;
  if (
    moduleState?.kind !== "economy" ||
    signal?.kind !== "develop_liquidity" ||
    signal.turnKey !== currentTurnKey ||
    signal.needId !== `economy-liquidity-development:${currentTurnKey}` ||
    signal.priorityClass !== "P6" ||
    signal.projectedCreditGain !== 1 ||
    signal.cadence?.kind !== "remaining_turn_capacity" ||
    !Number.isSafeInteger(signal.targetCredits) ||
    (signal.targetCredits ?? -1) < 0 ||
    !Number.isSafeInteger(signal.cadence.maximumConversions) ||
    (signal.cadence.maximumConversions ?? 0) <= 0 ||
    !Number.isSafeInteger(signal.revalidation?.stateVersion) ||
    (signal.revalidation?.stateVersion ?? -1) < 0
  ) {
    return undefined;
  }
  return {
    targetCredits: signal.targetCredits!,
    maximumConversions: signal.cadence.maximumConversions!,
    revalidatedAtStateVersion: signal.revalidation!.stateVersion!,
  };
}

function corpResidentHqOverflowResolution(
  previous: ResidentPlanPortfolio | undefined,
  input: AiDecisionInput,
):
  | {
      initialOverflowCount: number;
      maximumConversions: number;
      remainingConversions: number;
      selectedAtStateVersion?: number;
      expectedOverflowAfterSelectedConversion?: number;
    }
  | undefined {
  const instance = previous?.instances.find(
    (candidate) =>
      candidate.moduleId === "corp.hand_and_agenda_management" &&
      candidate.dedupeKey === `resolve-hq-overflow:${turnKey(input)}`,
  );
  if (!instance) return undefined;
  const moduleState = instance.moduleState as
    | {
        kind?: unknown;
        signal?: CorpPlanDomain["handManagement"][number];
      }
    | undefined;
  const signal = moduleState?.signal;
  const state = signal?.overflowResolutionState;
  const selectedAtStateVersion = state?.selectedAtStateVersion;
  const expectedOverflowAfterSelectedConversion =
    state?.expectedOverflowAfterSelectedConversion;
  const valid =
    moduleState?.kind === "hand" &&
    signal?.phase === "resolve_hq_overflow" &&
    signal.handPlanId === `resolve-hq-overflow:${turnKey(input)}` &&
    state?.turnKey === turnKey(input) &&
    Number.isSafeInteger(state.initialOverflowCount) &&
    state.initialOverflowCount > 0 &&
    Number.isSafeInteger(state.maximumConversions) &&
    state.maximumConversions > 0 &&
    state.maximumConversions <= state.initialOverflowCount &&
    Number.isSafeInteger(state.remainingConversions) &&
    state.remainingConversions >= 0 &&
    state.remainingConversions <= state.maximumConversions &&
    (selectedAtStateVersion === undefined
      ? state.remainingConversions === state.maximumConversions &&
        expectedOverflowAfterSelectedConversion === undefined
      : Number.isSafeInteger(selectedAtStateVersion) &&
        selectedAtStateVersion >= 0 &&
        selectedAtStateVersion <= previous!.stateVersion &&
        state.remainingConversions < state.maximumConversions &&
        Number.isSafeInteger(expectedOverflowAfterSelectedConversion) &&
        expectedOverflowAfterSelectedConversion! >= 0);
  if (!valid) {
    throw new PlanResolutionFailure("invalid_plan_identity", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_registry",
      planInstanceId: instance.instanceId,
      removalCondition:
        "The HQ-overflow plan receipt must preserve its exact Corp turn, initial overflow bound, remaining finite conversions, and selected state after each consumed head.",
    });
  }
  const sameStateRetry =
    selectedAtStateVersion === input.playerView.stateVersion;
  return {
    initialOverflowCount: state!.initialOverflowCount,
    maximumConversions: state!.maximumConversions,
    remainingConversions: sameStateRetry
      ? Math.min(state!.maximumConversions, state!.remainingConversions + 1)
      : state!.remainingConversions,
    ...(selectedAtStateVersion !== undefined ? { selectedAtStateVersion } : {}),
    ...(expectedOverflowAfterSelectedConversion !== undefined
      ? { expectedOverflowAfterSelectedConversion }
      : {}),
  };
}

function corpResidentDefenseDrawAttempt(
  previous: ResidentPlanPortfolio | undefined,
  input: AiDecisionInput,
):
  | {
      serverId: string;
      selectedAtStateVersion: number;
    }
  | undefined {
  const currentTurnKey = turnKey(input);
  for (const instance of previous?.instances ?? []) {
    if (instance.moduleId !== "corp.defend_servers") continue;
    const moduleState = instance.moduleState as
      | { kind?: unknown; signals?: CorpDefenseSignal[] }
      | undefined;
    if (moduleState?.kind !== "defense") continue;
    for (const signal of moduleState.signals ?? []) {
      const attempt = (
        signal as CorpDefenseSignal & {
          drawAttemptState?: {
            turnKey?: unknown;
            remainingAttempts?: unknown;
            selectedAtStateVersion?: unknown;
          };
        }
      ).drawAttemptState;
      if (attempt !== undefined) {
        const turnKeyMatch =
          typeof attempt.turnKey === "string"
            ? /^corp:(0|[1-9]\d*)$/.exec(attempt.turnKey)
            : null;
        const turnNumber = turnKeyMatch ? Number(turnKeyMatch[1]) : Number.NaN;
        const validTurnKey =
          turnKeyMatch !== null &&
          Number.isSafeInteger(turnNumber) &&
          turnNumber >= 0;
        const validRemainingAttempts =
          attempt.remainingAttempts === 0 || attempt.remainingAttempts === 1;
        const validSelectedState =
          attempt.remainingAttempts === 0
            ? Number.isSafeInteger(attempt.selectedAtStateVersion) &&
              (attempt.selectedAtStateVersion as number) >= 0 &&
              (attempt.selectedAtStateVersion as number) <=
                previous!.stateVersion
            : attempt.selectedAtStateVersion === undefined;
        if (
          signal.phase !== "draw_for_ice" ||
          !validTurnKey ||
          !validRemainingAttempts ||
          !validSelectedState
        ) {
          throw new PlanResolutionFailure("invalid_plan_identity", {
            side: input.side,
            stateVersion: input.playerView.stateVersion,
            timingPoint: input.playerView.timingPoint ?? "corp_action.main",
            legalActionTypes: input.legalActions.map((action) => action.type),
            owner: "plan_registry",
            planInstanceId: instance.instanceId,
            removalCondition:
              "A resident Corp defense draw receipt must bind draw_for_ice to corp:<safe non-negative integer>, remainingAttempts 0 or 1, and an exact finite non-negative selected state only after the attempt was consumed.",
          });
        }
      }
      if (
        signal.phase !== "draw_for_ice" ||
        attempt?.turnKey !== currentTurnKey ||
        attempt.remainingAttempts !== 0 ||
        input.playerView.stateVersion <=
          (attempt.selectedAtStateVersion as number)
      ) {
        continue;
      }
      return {
        serverId: signal.serverId,
        selectedAtStateVersion: attempt.selectedAtStateVersion as number,
      };
    }
  }
  return undefined;
}

function corpResidentScoreMaterialDrawAttempt(
  previous: ResidentPlanPortfolio | undefined,
  input: AiDecisionInput,
):
  | {
      selectedAtStateVersion: number;
    }
  | undefined {
  const instance = previous?.instances.find(
    (candidate) =>
      candidate.moduleId === "corp.hand_and_agenda_management" &&
      candidate.dedupeKey === "draw-for-score-material",
  );
  if (!instance) return undefined;
  const moduleState = instance.moduleState as
    | {
        kind?: unknown;
        signal?: CorpPlanDomain["handManagement"][number];
      }
    | undefined;
  const signal = moduleState?.signal;
  const attempt = signal?.drawAttemptState;
  if (!attempt) return undefined;
  const turnKeyMatch = /^corp:(0|[1-9]\d*)$/.exec(attempt.turnKey);
  const exactParentInstanceId = planInstanceIdForProposal({
    moduleId: "corp.score_agenda",
    dedupeKey: "general",
  });
  const valid =
    moduleState?.kind === "hand" &&
    instance.parentInstanceId === exactParentInstanceId &&
    instance.parentNeedId === "score-material:general" &&
    instance.persistencePolicy === "flexible_support" &&
    signal?.handPlanId === "draw-for-score-material" &&
    signal.parentPlanInstanceId === exactParentInstanceId &&
    signal.parentNeedId === "score-material:general" &&
    signal.phase === "draw_for_plan" &&
    signal.uncertainty?.kind === "draw_then_observe" &&
    signal.uncertainty.unknownOutcome === "drawn_card_identity" &&
    signal.uncertainty.revalidateAfterCurrentHead === true &&
    turnKeyMatch !== null &&
    Number.isSafeInteger(Number(turnKeyMatch[1])) &&
    (attempt.remainingAttempts === 0 || attempt.remainingAttempts === 1) &&
    (attempt.remainingAttempts === 0
      ? Number.isSafeInteger(attempt.selectedAtStateVersion) &&
        (attempt.selectedAtStateVersion as number) >= 0 &&
        (attempt.selectedAtStateVersion as number) <= previous!.stateVersion
      : attempt.selectedAtStateVersion === undefined);
  if (!valid) {
    throw new PlanResolutionFailure("invalid_plan_identity", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint ?? "corp_action.main",
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_registry",
      planInstanceId: instance.instanceId,
      removalCondition:
        "A resident Corp score-material draw receipt must remain flexible_support-bound to the exact generic score parent and material need, one exact Corp turn, and a consumed state version only after its current legal draw head was selected.",
    });
  }
  if (
    attempt.turnKey !== turnKey(input) ||
    attempt.remainingAttempts !== 0 ||
    input.playerView.stateVersion <= (attempt.selectedAtStateVersion as number)
  ) {
    return undefined;
  }
  return {
    selectedAtStateVersion: attempt.selectedAtStateVersion as number,
  };
}

function corpResidentCentralDefenseHqHoldState(
  previous: ResidentPlanPortfolio | undefined,
  input: AiDecisionInput,
): {
  cadence: NonNullable<CorpCorePlanDomain["centralDefenseHqHoldCadence"]>;
  selection?: NonNullable<CorpCorePlanDomain["centralDefenseHqHoldSelection"]>;
} {
  const fresh = (
    receiptId = "corp-central-hq-hold:server-defense-portfolio",
  ): {
    cadence: NonNullable<CorpCorePlanDomain["centralDefenseHqHoldCadence"]>;
  } => ({
    cadence: {
      status: "available",
      receiptId,
      turnKey: turnKey(input),
      factsStateVersion: input.playerView.stateVersion,
    },
  });
  const instance = previous?.instances.find(
    (candidate) => candidate.moduleId === "corp.defend_servers",
  );
  if (!instance) return fresh();
  const moduleState = instance.moduleState as
    | {
        kind?: unknown;
        hqHoldCadence?: {
          status?: unknown;
          receiptId?: unknown;
          turnKey?: unknown;
          factsStateVersion?: unknown;
        };
        hqHoldSelection?: {
          selectedActionId?: unknown;
          sourceCardInstanceId?: unknown;
          selectedAtStateVersion?: unknown;
          targetServerId?: unknown;
        };
      }
    | undefined;
  const cadence = moduleState?.hqHoldCadence;
  const selection = moduleState?.hqHoldSelection;
  if (moduleState?.kind !== "defense" || cadence === undefined) return fresh();
  const turnKeyMatch =
    typeof cadence.turnKey === "string"
      ? /^corp:(0|[1-9]\d*)$/.exec(cadence.turnKey)
      : null;
  const cadenceValid =
    (cadence.status === "available" || cadence.status === "consumed") &&
    typeof cadence.receiptId === "string" &&
    cadence.receiptId.length > 0 &&
    turnKeyMatch !== null &&
    Number.isSafeInteger(Number(turnKeyMatch[1])) &&
    Number.isSafeInteger(cadence.factsStateVersion) &&
    (cadence.factsStateVersion as number) >= 0 &&
    (cadence.factsStateVersion as number) <= previous!.stateVersion;
  const availableValid =
    cadence.status !== "available" || selection === undefined;
  const consumedValid =
    cadence.status !== "consumed" ||
    (typeof selection?.selectedActionId === "string" &&
      selection.selectedActionId.length > 0 &&
      typeof selection.sourceCardInstanceId === "string" &&
      selection.sourceCardInstanceId.length > 0 &&
      selection.targetServerId === "rd" &&
      Number.isSafeInteger(selection.selectedAtStateVersion) &&
      selection.selectedAtStateVersion === cadence.factsStateVersion);
  if (!cadenceValid || !availableValid || !consumedValid) {
    throw new PlanResolutionFailure("invalid_plan_identity", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_registry",
      planInstanceId: instance.instanceId,
      removalCondition:
        "Resident HQ-hold cadence must be one exact available receipt at the portfolio state or one consumed receipt with its exact R&D ICE-install selection.",
    });
  }
  if (cadence.status === "available") {
    return fresh(cadence.receiptId as string);
  }
  const selectedAtStateVersion = selection!.selectedAtStateVersion as number;
  if (input.playerView.stateVersion < selectedAtStateVersion) {
    throw new PlanResolutionFailure("invalid_plan_identity", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_registry",
      planInstanceId: instance.instanceId,
      removalCondition:
        "A consumed HQ-hold receipt cannot be observed before its selected state.",
    });
  }
  if (input.playerView.stateVersion > selectedAtStateVersion) {
    const applied =
      input.playerView.servers
        .find((server) => server.id === "rd")
        ?.ice.some(
          (ice) => ice.instanceId === selection!.sourceCardInstanceId,
        ) === true;
    if (!applied) {
      throw new PlanResolutionFailure("invalid_plan_identity", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map((action) => action.type),
        owner: "plan_registry",
        planInstanceId: instance.instanceId,
        removalCondition:
          "A consumed HQ-hold receipt must be followed by its exact selected Corp card appearing as ICE on R&D.",
      });
    }
  }
  return {
    cadence: {
      status: "consumed",
      receiptId: cadence.receiptId as string,
      turnKey: cadence.turnKey as string,
      factsStateVersion: cadence.factsStateVersion as number,
    },
    selection: {
      selectedActionId: selection!.selectedActionId as string,
      sourceCardInstanceId: selection!.sourceCardInstanceId as string,
      selectedAtStateVersion,
      targetServerId: "rd",
    },
  };
}

function uniqueBy<T>(
  values: readonly T[],
  keyForValue: (value: T) => string,
): T[] {
  return [
    ...new Map(values.map((value) => [keyForValue(value), value])).values(),
  ];
}

function uniqueScoreProjects(
  values: readonly CorpScoreProjectSignal[],
): CorpScoreProjectSignal[] {
  const phaseRank: Record<CorpScoreProjectSignal["phase"], number> = {
    select_agenda: -1,
    unlock_remote_creation: 0,
    install_counter_bank: 1,
    advance_counter_bank: 2,
    install_agenda_from_counter_bank: 3,
    rez_counter_bank_for_handoff: 4,
    rez_counter_bank_for_liquidation: 4,
    liquidate_counter_bank: 5,
    install_agenda: 1,
    advance_agenda: 2,
    convert_agenda: 3,
    score_agenda: 4,
  };
  const byProject = new Map<string, CorpScoreProjectSignal>();
  for (const value of values) {
    const previous = byProject.get(value.projectId);
    if (!previous || phaseRank[value.phase] > phaseRank[previous.phase]) {
      byProject.set(value.projectId, value);
      continue;
    }
    if (phaseRank[value.phase] < phaseRank[previous.phase]) continue;
    if (value.sameTurnCloseout && !previous.sameTurnCloseout) {
      byProject.set(value.projectId, value);
      continue;
    }
    if (previous.sameTurnCloseout && !value.sameTurnCloseout) continue;
    if (value.feasible && !previous.feasible) {
      byProject.set(value.projectId, value);
      continue;
    }
    if (previous.feasible && !value.feasible) continue;
    const valueHasExactSameTurnConversionEvidence =
      value.sameTurnCloseout &&
      value.evidenceCode.startsWith("corp_same_turn_score_conversion");
    const previousHasExactSameTurnConversionEvidence =
      previous.sameTurnCloseout &&
      previous.evidenceCode.startsWith("corp_same_turn_score_conversion");
    if (
      valueHasExactSameTurnConversionEvidence !==
      previousHasExactSameTurnConversionEvidence
    ) {
      if (valueHasExactSameTurnConversionEvidence) {
        byProject.set(value.projectId, value);
      }
      continue;
    }
    if (
      value.sameTurnCloseout === previous.sameTurnCloseout &&
      value.feasible === previous.feasible &&
      value.evidenceCode === previous.evidenceCode
    ) {
      byProject.set(value.projectId, {
        ...previous,
        actionIds: [
          ...new Set([
            ...(previous.actionIds ?? []),
            ...(value.actionIds ?? []),
          ]),
        ],
        routeSemanticActionTypes: [
          ...new Set([
            ...(previous.routeSemanticActionTypes ?? []),
            ...(value.routeSemanticActionTypes ?? []),
          ]),
        ],
      });
    }
  }
  return [...byProject.values()];
}

function mergeDefenseSignals(
  values: readonly CorpDefenseSignal[],
): CorpDefenseSignal[] {
  const result = new Map<string, CorpDefenseSignal>();
  for (const value of values) {
    const previous = result.get(value.defenseId);
    if (!previous) {
      result.set(value.defenseId, value);
      continue;
    }
    if (previous.kind !== value.kind) {
      throw new Error(
        `Conflicting Corp defense signal kinds for ${value.defenseId}.`,
      );
    }
    if (value.kind !== "generic" || previous.kind !== "generic") {
      if (JSON.stringify(previous) !== JSON.stringify(value)) {
        throw new Error(
          `Conflicting exact Corp defense signals for ${value.defenseId}.`,
        );
      }
      continue;
    }
    const preferred = value.value > previous.value ? value : previous;
    result.set(value.defenseId, {
      ...preferred,
      sourceDefinitionIds: [
        ...new Set([
          ...previous.sourceDefinitionIds,
          ...value.sourceDefinitionIds,
        ]),
      ],
      ...(previous.actionIds || value.actionIds
        ? {
            actionIds: [
              ...new Set([
                ...(previous.actionIds ?? []),
                ...(value.actionIds ?? []),
              ]),
            ],
          }
        : {}),
      urgent: previous.urgent || value.urgent,
      ...(previous.centralPressure || value.centralPressure
        ? {
            centralPressure:
              previous.centralPressure === "terminal" ||
              value.centralPressure === "terminal"
                ? ("terminal" as const)
                : previous.centralPressure === "acute" ||
                    value.centralPressure === "acute"
                  ? ("acute" as const)
                  : ("material" as const),
          }
        : {}),
      value: Math.max(previous.value, value.value),
    });
  }
  return [...result.values()];
}

type CorpDefensiveUpgradePlacement = {
  signal?: CorpDefenseSignal;
  evidenceCode: string;
};

function corpDefensiveUpgradePlacement(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  scoreProjects: readonly CorpScoreProjectSignal[],
): CorpDefensiveUpgradePlacement | undefined {
  if (
    candidate.semanticActionType !== "install.card" ||
    !candidate.sourceDefinitionId
  ) {
    return undefined;
  }
  const hint = AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId);
  const assignedToDefense =
    (hint?.roles?.includes("run_defense") === true &&
      hint?.planRoles?.includes("remote_upgrade_rez_support") === true) ||
    (hint?.roles?.includes("remote_support") === true &&
      hint?.remoteRole?.kind === "scoring_protection" &&
      hint.remoteRole.serverScope === "fort" &&
      hint.functionSignals?.includes("remote.scoring_protection") === true &&
      hint.functionSignals.includes("run.corp_pay_or_end_run")) ||
    (hint?.remoteRole?.kind === "agenda_steal_tax" &&
      hint.remoteRole.serverScope === "fort" &&
      hint.planRoles?.includes("remote_upgrade_tax") === true &&
      hint.planRoles.includes("protect_remote") &&
      hint.functionSignals?.includes("remote.agenda_steal_tax") === true &&
      hint.functionSignals.includes("tax.runner_credit") &&
      hint.effects?.some(
        (effect) =>
          effect.kind === "run_tax" &&
          effect.scope === "accessed_card" &&
          effect.timing === "on_access" &&
          typeof effect.amount === "number" &&
          effect.amount > 0,
      ) === true &&
      hint.effects.some(
        (effect) =>
          effect.kind === "remote_protection" &&
          effect.scope === "fort" &&
          effect.timing === "persistent",
      ));
  const legalAction = input.legalActions.find(
    (action) => action.actionId === candidate.actionId,
  );
  const sourceCard = candidate.sourceCardInstanceId
    ? input.playerView.own.gripOrHq.find(
        (card) => card.instanceId === candidate.sourceCardInstanceId,
      )
    : undefined;
  const serverId = candidateTargetIds(candidate).find(isCorpInstallServerId);
  if (!legalAction || !sourceCard || !serverId) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_module",
      removalCondition:
        "Every defensive upgrade install requires a visible source card, exact LegalAction, and exact target server before the defense portfolio may assess it.",
    });
  }
  const roles = rolesForDeckDoctrineCard(candidate.sourceDefinitionId);
  const placement = corpUpgradePlacementAssessment({
    input,
    action: legalAction,
    roles,
    actionSemanticCandidate: candidate,
    sourceCard,
    serverId,
  });
  if (!placement) {
    if (!assignedToDefense) return undefined;
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_module",
      removalCondition:
        "The defensive upgrade has a declared plan role but no complete placement assessment.",
    });
  }
  if (!assignedToDefense && placement.recommendation !== "defer") {
    return undefined;
  }
  const component =
    legalAction.payload?.regionReplacementWarning === true
      ? corpRegionReplacementComponent({
          input,
          action: legalAction,
          roles,
          actionSemanticCandidate: candidate,
          sourceCard,
          serverId,
        })
      : corpUpgradeInstallPlacementComponent({
          input,
          action: legalAction,
          roles,
          actionSemanticCandidate: candidate,
          sourceCard,
          serverId,
        });
  const activeRegionReplacement =
    legalAction.payload?.regionReplacementWarning === true &&
    placement.recommendation === "allow" &&
    placement.candidateActiveUtility.length > 0;
  if (!component) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_module",
      removalCondition:
        "The defensive upgrade has a declared plan role but no complete placement assessment and value component.",
    });
  }
  const evidenceCode =
    activeRegionReplacement ||
    (placement.recommendation === "allow" &&
      placement.candidateActiveUtility.length > 0 &&
      component.value > 0)
      ? `corp_defense_support_install:${serverId}:${component.key}`
      : `corp_defense_support_rejected:${serverId}:${placement.reason}:${component.key}`;
  const reserveAssessment = corpCardRoutePreservesScoreReserve(
    input,
    candidate,
    serverId,
    scoreProjects,
  );
  if (
    (!activeRegionReplacement &&
      (placement.recommendation !== "allow" ||
        placement.candidateActiveUtility.length === 0 ||
        component.value <= 0)) ||
    !reserveAssessment.preservesReserve
  ) {
    return {
      evidenceCode: reserveAssessment.preservesReserve
        ? evidenceCode
        : `corp_defense_support_rejected:${serverId}:score_reserve:${reserveAssessment.requiredCreditsAfterAction}`,
    };
  }
  return {
    evidenceCode: `${evidenceCode}:reserve_after_action:${reserveAssessment.requiredCreditsAfterAction}`,
    signal: {
      kind: "generic",
      defenseId: `install-defense-support:${candidate.sourceCardInstanceId}:${serverId}`,
      serverId,
      phase: "install_defense_support",
      sourceDefinitionIds: [candidate.sourceDefinitionId],
      actionIds: [candidate.actionId],
      urgent: false,
      value: 100 + Math.max(0, component.value),
      evidenceCode: `${evidenceCode}:reserve_after_action:${reserveAssessment.requiredCreditsAfterAction}`,
    },
  };
}

function corpCardRoutePreservesScoreReserve(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  serverId: string,
  scoreProjects: readonly CorpScoreProjectSignal[],
): Readonly<{
  preservesReserve: boolean;
  requiredCreditsAfterAction: number;
}> {
  const requiredCreditsAfterAction = Math.max(
    0,
    ...scoreProjects
      .filter((project) => project.serverId === serverId)
      .map(
        (project) =>
          project.continuationReserve?.requiredCreditsBeforeNextCorpTurn ?? 0,
      ),
  );
  const creditCost = candidate.costProfile.creditCost;
  const preservesReserve =
    candidate.costProfile.costKnownStatus === "known" &&
    candidate.costProfile.additionalCosts.length === 0 &&
    Number.isSafeInteger(creditCost) &&
    creditCost !== undefined &&
    creditCost >= 0 &&
    input.playerView.own.credits - creditCost >= requiredCreditsAfterAction;
  return { preservesReserve, requiredCreditsAfterAction };
}

type CorpScoreAccelerationSetupBinding = Readonly<{
  parent: CorpScoreProjectSignal;
  setupNeed: NonNullable<CorpScoreProjectSignal["setupNeed"]>;
}>;

function corpScoreAccelerationSetupBinding(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  scoreProjects: readonly CorpScoreProjectSignal[],
): CorpScoreAccelerationSetupBinding | undefined {
  const priorityRank = { P1: 1, P2: 2, P3: 3, P4: 4 } as const;
  const parent = scoreProjects
    .filter(
      (project) =>
        project.phase !== "select_agenda" &&
        !project.feasible &&
        !project.sameTurnCloseout &&
        (project.fundingGap ?? 0) === 0 &&
        project.evidenceCode.startsWith(
          "corp_last_click_score_install_deferred:",
        ),
    )
    .sort(
      (left, right) =>
        priorityRank[corpScorePriorityClass(left)] -
          priorityRank[corpScorePriorityClass(right)] ||
        technicalIdCompare(left.projectId, right.projectId),
    )[0];
  if (!parent) return undefined;
  const setupCandidate = candidates
    .filter((candidate) => {
      if (
        candidate.semanticActionType !== "install.card" ||
        candidateIsVisibleCorpAgendaInstall(input, candidate) ||
        !candidate.sourceCardInstanceId ||
        !candidate.sourceDefinitionId
      ) {
        return false;
      }
      const source = input.playerView.own.gripOrHq.find(
        (card) => card.instanceId === candidate.sourceCardInstanceId,
      );
      const hint = AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId);
      return (
        source?.definitionId === candidate.sourceDefinitionId &&
        (hint?.functionSignals?.includes("score.advance_burst") === true ||
          hint?.remoteRole?.kind === "score_acceleration")
      );
    })
    .sort((left, right) =>
      technicalIdCompare(left.actionId, right.actionId),
    )[0];
  if (
    !setupCandidate?.sourceCardInstanceId ||
    !setupCandidate.sourceDefinitionId
  ) {
    return undefined;
  }
  return {
    parent,
    setupNeed: {
      needId: `score-setup:${parent.projectId}:${setupCandidate.sourceCardInstanceId}`,
      actionId: setupCandidate.actionId,
      sourceCardInstanceId: setupCandidate.sourceCardInstanceId,
      sourceDefinitionId: setupCandidate.sourceDefinitionId,
    },
  };
}

function corpCardDevelopmentSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  agendaCount: number,
  economyNeeds: CorpCorePlanDomain["economyNeeds"],
  defenseDispositionActionIds: ReadonlySet<string>,
  scoreSetupBinding: CorpScoreAccelerationSetupBinding | undefined,
  scoreProjects: readonly CorpScoreProjectSignal[],
): CorpPlanDomain["handManagement"] {
  return uniqueBy(
    candidates.flatMap((candidate): CorpPlanDomain["handManagement"] => {
      if (defenseDispositionActionIds.has(candidate.actionId)) {
        return [];
      }
      const exactOverflowConversion =
        input.playerView.own.gripOrHq.length >
          input.playerView.own.maxHandSize &&
        corpHqOverflowCandidateIsExactCurrentConversion(input, candidate);
      if (
        !candidate.sourceDefinitionId ||
        !candidate.sourceCardInstanceId ||
        (![
          "install.card",
          "play.corp_operation",
          "card_ability.trigger",
          "economy.gain_credit",
          "draw.card",
        ].includes(candidate.semanticActionType) &&
          !exactOverflowConversion)
      ) {
        return [];
      }
      if (corpEmptyRdDrawOperationDispositionEvidence(input, candidate)) {
        return [];
      }
      if (
        candidate.actionCapacityProjection?.kind === "future_recurring_gain"
      ) {
        return [];
      }
      if (
        corpCandidateProjectsCardDraw(candidate) &&
        !corpDrawCandidatePreservesHandCapacity(input, candidate)
      ) {
        return [];
      }
      const roles = rolesForDeckDoctrineCard(candidate.sourceDefinitionId);
      const hint = AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId);
      const sourceCard = input.playerView.own.gripOrHq.find(
        (card) => card.instanceId === candidate.sourceCardInstanceId,
      );
      if (!sourceCard) return [];
      if (corpDefensiveUpgradePlacement(input, candidate, scoreProjects))
        return [];
      const ownedByPunishPlan = corpDefinitionSupportsPunishPlan(
        candidate.sourceDefinitionId,
      );
      const economyRole =
        hint?.roles?.includes("economy") === true ||
        hint?.planRoles?.includes("remote_asset_economy") === true ||
        hint?.effects?.some((effect) =>
          [
            "economy",
            "action_economy",
            "start_of_turn_economy",
            "recurring_economy",
            "finite_economy_pool",
          ].includes(effect.kind),
        ) === true;
      const ownedByEconomyPlan = economyNeeds.some(
        (signal) =>
          (signal.kind === "develop_campaign" ||
            signal.kind === "convert_immediate_operation" ||
            signal.kind === "convert_installed_asset_payout" ||
            signal.kind === "prepare_immediate_operation") &&
          signal.actionIds.includes(candidate.actionId),
      );
      if (
        roles.some((role) => role.includes("ambush")) ||
        candidateIsVisibleCorpAgendaInstall(input, candidate) ||
        ownedByEconomyPlan ||
        ownedByPunishPlan
      ) {
        return [];
      }
      if (exactOverflowConversion) {
        return [
          {
            handPlanId: `overflow-admissible:${candidate.sourceCardInstanceId}:${candidate.actionId}`,
            phase: "develop_card" as const,
            sourceDefinitionIds: [candidate.sourceDefinitionId],
            sourceInstanceId: candidate.sourceCardInstanceId,
            actionIds: [candidate.actionId],
            exactActionRoute: true,
            agendaCount,
            handSize: input.playerView.own.gripOrHq.length,
            maximumHandSize: input.playerView.own.maxHandSize,
            concretePurposeCode:
              "Expose this exact known non-agenda hand conversion only to the finite HQ-overflow parent.",
            value: Math.max(
              economyRole ? 40 : 10,
              (candidate.economyProjection?.netLiquidCreditGain ?? 0) * 10,
            ),
            evidenceCode: `corp_hq_overflow_admissible_current_conversion:${candidate.sourceDefinitionId}`,
          },
        ];
      }
      if (candidateIsVisibleCorpIceInstall(input, candidate)) {
        return [];
      }
      if (
        scoreSetupBinding?.setupNeed.actionId === candidate.actionId &&
        scoreSetupBinding.setupNeed.sourceCardInstanceId ===
          candidate.sourceCardInstanceId &&
        scoreSetupBinding.setupNeed.sourceDefinitionId ===
          candidate.sourceDefinitionId
      ) {
        const parentPlanInstanceId = planInstanceIdForProposal({
          moduleId: "corp.score_agenda",
          dedupeKey: scoreSetupBinding.parent.projectId,
        });
        return [
          {
            handPlanId: scoreSetupBinding.setupNeed.needId,
            parentPlanInstanceId,
            parentNeedId: scoreSetupBinding.setupNeed.needId,
            phase: "develop_card" as const,
            sourceDefinitionIds: [candidate.sourceDefinitionId],
            sourceInstanceId: candidate.sourceCardInstanceId,
            actionIds: [candidate.actionId],
            exactActionRoute: true,
            agendaCount,
            handSize: input.playerView.own.gripOrHq.length,
            maximumHandSize: input.playerView.own.maxHandSize,
            concretePurposeCode: `Install ${candidate.sourceDefinitionId} as the exact current setup step for score parent ${scoreSetupBinding.parent.projectId}, then observe and revalidate.`,
            priorityClass: "P5" as const,
            value: 100,
            evidenceCode: `corp_score_acceleration_campaign_setup:${candidate.sourceDefinitionId}:${scoreSetupBinding.parent.projectId}`,
          },
        ];
      }
      return [];
    }),
    (signal) => signal.handPlanId,
  );
}

function difficultyLevel(input: AiDecisionInput): number {
  if (input.difficulty === "easy") return 1;
  if (input.difficulty === "hard") return 3;
  return 2;
}
