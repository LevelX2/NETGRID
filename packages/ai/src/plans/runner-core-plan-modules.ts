import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

import { rolesForDeckDoctrineCard } from "../deck-doctrine-card-roles";
import type { AiDeckStrategyProfile } from "../deck-doctrine-strategy";
import { rolesMatch } from "../runtime/role-match";
import { runnerEffectsProvideDamagePrevention } from "../runner-canonical-hint-semantics";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type {
  PlanAssessment,
  PriorityClass,
  PriorityClaim,
  ResourceGap,
} from "./plan-assessment";
import type {
  PlanBlocker,
  PlanInstance,
  PlanProposal,
} from "./plan-kernel-types";
import type {
  PlanMaterialization,
  PlanModule,
  PlanSchedulerContext,
} from "./plan-scheduler";
import { PlanResolutionFailure } from "./plan-resolution-failure";
import type {
  FundingRouteHorizon,
  FundingRouteReliability,
  FundingRouteStatus,
} from "./funding-route";
import type { ProjectedHandDisposition } from "./turn-projection";
import type { RunnerCreditBankProspectivePlan } from "./runner-credit-bank-prospective-planning";

export type RunnerFundingRouteAssessment = {
  stateVersion: number;
  routeId: string;
  status: FundingRouteStatus;
  reliability: FundingRouteReliability;
  horizon: FundingRouteHorizon;
  projectedGap: number;
  totalClickCost: number;
  firstStepActionId?: string;
  evidenceCodes: string[];
};

type RunnerFundingRouteContract = {
  routeActionIds: string[];
  routeAssessment: RunnerFundingRouteAssessment;
};

export type RunnerFundingNeedSignal =
  | (RunnerFundingRouteContract & {
      kind: "parent_plan_support";
      needId: string;
      parentPlanInstanceId: string;
      driver: {
        kind: "run" | "contest" | "development" | "resource_lifecycle";
        targetId: string;
        reasonCode: string;
      };
      targetCredits: number;
      currentCreditsAtRevalidation: number;
      gap: number;
      priorityClass: "P2" | "P4" | "P5";
      revalidation: {
        stateVersion: number;
        status: "material_parent_open";
      };
      evidenceCode: string;
    })
  | (RunnerFundingRouteContract & {
      kind: "portfolio_reserve";
      needId: "runner-portfolio-credit-reserve";
      targetCredits: number;
      currentCreditsAtRevalidation: number;
      gap: number;
      priorityClass: "P6";
      revalidation: {
        stateVersion: number;
        status: "portfolio_reserve_open";
      };
      evidenceCode: string;
    })
  | {
      kind: "develop_liquidity";
      needId: string;
      actionIds: string[];
      currentCreditsAtRevalidation: number;
      targetCredits: number;
      gap: number;
      priorityClass: "P6";
      cadence: {
        kind: "remaining_turn_capacity";
        maximumConversions: number;
      };
      completion: {
        kind: "target_credits_or_no_clicks";
      };
      revalidation: {
        stateVersion: number;
        status: "turn_liquidity_open";
      };
      evidenceCode: string;
    };

export type RunnerCoverageGapSignal = {
  gapId: string;
  needKind?: "missing_coverage" | "cost_ineffective_coverage";
  requiredRole:
    | "breaker_wall"
    | "breaker_code_gate"
    | "breaker_sentry"
    | "breaker_ap"
    | "breaker_trace"
    | "breaker_universal";
  targetServerId?: string;
  requesterModuleId?: "runner.pressure_central" | "runner.contest_remote";
  requesterPlanInstanceId?: string;
  priorityClass: "P2" | "P4" | "P5";
  evidenceCode: string;
  deckHasAnswer: boolean;
  answerInHand: boolean;
  answerInstallCost?: number;
  installActionIds?: string[];
  installActionValues?: Record<string, number>;
  fundingGap?: number;
  currentKnownPathCost?: number;
  currentPathFundingGap?: number;
  recoveryMode?:
    | "install_visible_answer"
    | "search_known_alternative"
    | "draw_for_known_role";
  recoveryEvidenceCodes?: string[];
  fundingActionIds: string[];
  directSearchActionIds: string[];
  directSearchChoiceBindings?: Array<{
    actionId: string;
    sourceCardInstanceId: string;
    sourceDefinitionId: string;
    targetCardInstanceId?: string;
    targetDefinitionId?: string;
  }>;
  rejectedSearchActionIds?: string[];
  searchEngineSetupActionIds: string[];
  drawForAnswerActionIds: string[];
};

export type RunnerDefenseSignals = {
  activeTags: number;
  visibleTagPunish: boolean;
  persistentHazardCounterRemovalAvailable: boolean;
  pendingDamage: number;
  damagePreventionNeeded: boolean;
  handSize: number;
  minimumHandBuffer: number;
  drawAllowed: boolean;
  handBufferActionIds?: string[];
  forgoUnsafeRunCapacity: boolean;
  discardChoiceBinding?: RunnerDiscardChoiceBinding;
  reactionReserveNeed?: {
    needId: "runner-defense-reaction-reserve";
    parentPlanInstanceId: "plan:runner.defense_and_recovery:runner";
    targetCredits: number;
    currentCreditsAtRevalidation: number;
    gap: number;
    actionIds: string[];
    revalidation: {
      stateVersion: number;
      status: "defense_parent_open";
    };
    evidenceCode: string;
  };
  handBufferPriorityClass: "P3" | "P4" | "P5";
  evidenceCodes: string[];
};

export type RunnerDiscardChoiceBinding = {
  actionId: string;
  choiceId: string;
  observedAtStateVersion: number;
  selectedOptionIds: string[];
  discardedCardInstanceIds: string[];
  retainedCardInstanceIds: string[];
  emergencyKeepCardInstanceIds: string[];
  evidenceCodes: string[];
};

export type RunnerCreditBankSignal = {
  bankId: string;
  phase: "install" | "build" | "cash_out" | "hold";
  actionIds: string[];
  rejectedActionIds?: string[];
  priorityClass: "P2" | "P4" | "P5";
  currentStoredCredits: number;
  portfolioStoredCredits: number;
  estimatedPayout: number;
  prospectivePlan?: RunnerCreditBankProspectivePlan;
  value: number;
  evidenceCodes: string[];
};

export type RunnerRecurringEconomySignal = {
  commitmentId: string;
  definitionId: string;
  phase: "install" | "hold";
  actionIds: string[];
  priorityClass: "P4" | "P5";
  value: number;
  evidenceCodes: string[];
};

export type RunnerInstalledCardLiquidationChoiceSignal = {
  conversionId: string;
  sourceResourceInstanceId: string;
  sourceResourceDefinitionId: string;
  actionId: string;
  choiceId: string;
  sourceStateVersion: number;
  selectedOptionId: "pass";
  disposition: "decline_unpriced_conversion";
  priorityClass: "P4";
  value: number;
  evidenceCodes: string[];
};

export type RunnerInstalledAgendaScoreSignal = {
  opportunityId: string;
  sourceCardInstanceId: string;
  actionIds: string[];
  agendaPoints: number;
  terminal: boolean;
  evidenceCode: string;
};

export type RunnerResourceLifecycleSignal = {
  lifecycleId: string;
  sourceCardInstanceId: string;
  definitionId: string;
  phase: "retain" | "leave_play";
  actionIds: string[];
  rejectedActionIds?: string[];
  supportNeedId?: string;
  marginalValue?: number;
  leavePlayPaymentAmount?: number;
  fundingGap?: number;
  fundingRouteActionIds?: string[];
  fundingRouteAssessment?: RunnerFundingRouteAssessment;
  priorityClass: "P5";
  value: number;
  evidenceCodes: string[];
};

export type RunnerShellTradersPipelineSignal = {
  pipelineId: string;
  phase: "prepare" | "progress" | "hold";
  sourceCardInstanceId: string;
  sourceDefinitionId: "onr_v1_176_the-shell-traders";
  targetCardInstanceId: string;
  targetDefinitionId: string;
  targetCardType: "program" | "hardware";
  actionIds: string[];
  rejectedActionIds?: string[];
  priorityClass: "P2" | "P4" | "P5";
  value: number;
  shellCountersBefore: number;
  shellCountersAfterAction: number;
  targetInstallCost: number;
  targetMemoryCost: number;
  freeMemory: number;
  replacementAssessment: Readonly<{
    status: "not_needed" | "available" | "harmful" | "unknown";
    requiredMemory: number;
    selectedProgramInstanceIds: string[];
    freedMemory: number;
    displacedValue: number;
  }>;
  coverageBinding?: Readonly<{
    gapId: string;
    requiredRole: RunnerCoverageGapSignal["requiredRole"];
    targetServerId?: string;
  }>;
  targetRoles: string[];
  evidenceCodes: string[];
};

export type RunnerCorePlanDomain = {
  fundingNeeds: RunnerFundingNeedSignal[];
  coverageGaps: RunnerCoverageGapSignal[];
  defense: RunnerDefenseSignals;
  creditBanks: RunnerCreditBankSignal[];
  recurringEconomy?: RunnerRecurringEconomySignal[];
  installedCardLiquidationChoices?: RunnerInstalledCardLiquidationChoiceSignal[];
  installedAgendaScores?: RunnerInstalledAgendaScoreSignal[];
  resourceLifecycle?: RunnerResourceLifecycleSignal[];
  shellTradersPipelines?: RunnerShellTradersPipelineSignal[];
};

export type RunnerCorePlanDependencies = {
  rolesForDefinitionId?: (definitionId: string) => readonly string[];
};

export function runnerCoveragePlanHandDisposition(
  input: AiDecisionInput,
  card: VisibleCard,
): ProjectedHandDisposition | undefined {
  if (input.side !== "runner" || !card.definitionId) return undefined;
  const strategyProfile = (
    input as AiDecisionInput & {
      ownDeckStrategyProfile?: AiDeckStrategyProfile;
    }
  ).ownDeckStrategyProfile;
  const doctrine = strategyProfile?.runnerEngineDoctrine;
  const dependency = doctrine?.dependencies.find(
    (entry) =>
      entry.dependencyId === "runner.dependency.breaker_coverage" &&
      entry.criticality === "single_definition",
  );
  const provider = doctrine?.providers.find(
    (entry) =>
      entry.cardId === card.definitionId &&
      entry.capabilities.includes("runner.coverage.breaker") &&
      dependency?.providerIds.includes(entry.providerId),
  );
  if (!dependency || !provider) return undefined;
  const providerDefinitionIds = new Set(
    doctrine!.providers
      .filter((entry) => dependency.providerIds.includes(entry.providerId))
      .map((entry) => entry.cardId),
  );
  const installedProviderExists = (input.playerView.own.rig ?? []).some(
    (entry) =>
      entry.definitionId !== undefined &&
      providerDefinitionIds.has(entry.definitionId),
  );
  if (installedProviderExists) return undefined;
  const reachableProviderCount = [
    ...input.playerView.own.gripOrHq,
    ...(input.playerView.specialZones?.setAside ?? []),
  ].filter(
    (entry) =>
      entry.definitionId !== undefined &&
      providerDefinitionIds.has(entry.definitionId),
  ).length;
  return reachableProviderCount === 1 ? "support_for_need" : undefined;
}

export function runnerFundingRouteCandidateIsMaterializable(
  candidate: ActionSemanticCandidate,
): boolean {
  return (
    !candidate.effectTargets?.some((target) =>
      [
        "economy.bank_cashout_all",
        "economy.bank_load",
        "economy.temporary_resource_bank",
      ].includes(target),
    ) &&
    candidate.economyProjection?.kind === "immediate_liquid" &&
    candidate.economyProjection.timing === "immediate" &&
    candidate.economyProjection.creditRestriction === "general" &&
    candidate.economyProjection.storedCreditsAdded === undefined &&
    candidate.economyProjection.storedCreditsTaken === undefined &&
    candidate.economyProjection.payoutMode !== "all_available" &&
    typeof candidate.economyProjection.netLiquidCreditGain === "number" &&
    Number.isFinite(candidate.economyProjection.netLiquidCreditGain) &&
    candidate.economyProjection.netLiquidCreditGain > 0
  );
}

export function runnerTurnLiquidityCandidateIsMaterializable(
  candidate: ActionSemanticCandidate,
): boolean {
  const projection = candidate.economyProjection;
  return (
    runnerFundingRouteCandidateIsMaterializable(candidate) &&
    candidate.costProfile.clickCost === 1 &&
    (candidate.costProfile.creditCost === undefined ||
      candidate.costProfile.creditCost === 0) &&
    candidate.costProfile.additionalCosts.length === 0 &&
    projection?.clickCost === 1 &&
    projection.creditCost === 0 &&
    projection.cardsDrawn === 0 &&
    ((projection.cardsConsumed === 0 && projection.netHandDelta === 0) ||
      (candidate.actionType === "play_event" &&
        projection.cardsConsumed === 1 &&
        projection.netHandDelta === -1)) &&
    projection.payoutMode === "fixed" &&
    projection.reliability === "guaranteed" &&
    ((projection.source === "basic_action_contract" &&
      projection.confidence === "medium") ||
      (projection.source === "legal_action_payload" &&
        projection.confidence === "high"))
  );
}

export function runnerInstalledCardLiquidationChoiceSignal(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): RunnerInstalledCardLiquidationChoiceSignal | undefined {
  const choice = input.playerView.pendingChoice;
  if (
    input.side !== "runner" ||
    choice?.side !== "runner" ||
    choice.kind !== "select_option" ||
    choice.visibility !== "public" ||
    choice.stateVersion !== input.playerView.stateVersion ||
    choice.minSelections !== 1 ||
    choice.maxSelections !== 1
  ) {
    return undefined;
  }
  const sourceMatch =
    /^runner\.installed_resource_trash_for_credits:([^:]+):([0-9]+)$/.exec(
      choice.source,
    );
  const sourceResourceInstanceId = sourceMatch?.[1];
  const sourceStateVersion = Number(sourceMatch?.[2]);
  const rig = input.playerView.own.rig ?? [];
  const sourceResource = sourceResourceInstanceId
    ? rig.find(
        (card) =>
          card.instanceId === sourceResourceInstanceId &&
          card.known &&
          card.type === "resource" &&
          typeof card.definitionId === "string" &&
          card.definitionId.length > 0,
      )
    : undefined;
  const action = input.legalActions.find(
    (legalAction) =>
      legalAction.side === "runner" &&
      legalAction.type === "resolve_choice" &&
      legalAction.source === "game_rule" &&
      legalAction.timingPoint === input.playerView.timingPoint &&
      legalAction.expiresAtStateVersion === input.playerView.stateVersion &&
      legalAction.choiceRequirements?.length === 1 &&
      legalAction.choiceRequirements[0]?.choiceId === choice.choiceId,
  );
  const candidate = action
    ? candidates.find(
        (entry) =>
          entry.actionId === action.actionId &&
          entry.semanticActionType === "choice.resolve",
      )
    : undefined;
  const requirement = action?.choiceRequirements?.[0];
  const choiceOptionIds = choice.options.map((option) => option.id);
  const exactActionBinding =
    requirement !== undefined &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === choiceOptionIds.length &&
    choiceOptionIds.every((optionId) =>
      requirement.optionIds.includes(optionId),
    );
  const eligibleCards = rig.filter(
    (card) => card.instanceId !== sourceResourceInstanceId,
  );
  const optionById = new Map(
    choice.options.map((option) => [option.id, option]),
  );
  const passOption = optionById.get("pass");
  const exactOptionMatrix =
    choice.options.length === eligibleCards.length + 1 &&
    passOption !== undefined &&
    passOption.selectable !== false &&
    passOption.value === undefined &&
    eligibleCards.every((card) => {
      const option = optionById.get(`card_${card.instanceId}`);
      return option?.selectable !== false && option?.value === card.instanceId;
    });
  if (
    !sourceResourceInstanceId ||
    !sourceResource?.definitionId ||
    sourceStateVersion !== input.playerView.stateVersion ||
    !action ||
    !candidate ||
    !exactActionBinding ||
    !exactOptionMatrix ||
    eligibleCards.length === 0
  ) {
    return undefined;
  }
  return {
    conversionId: `installed-card-liquidation:${choice.choiceId}`,
    sourceResourceInstanceId,
    sourceResourceDefinitionId: sourceResource.definitionId,
    actionId: action.actionId,
    choiceId: choice.choiceId,
    sourceStateVersion,
    selectedOptionId: "pass",
    disposition: "decline_unpriced_conversion",
    priorityClass: "P4",
    value: 1_000,
    evidenceCodes: [
      "runner_installed_card_liquidation_choice_owned_by_economy",
      "runner_installed_card_liquidation_declined_without_exact_target_value_quote",
    ],
  };
}

type EconomyState =
  | { kind: "economy"; need: RunnerFundingNeedSignal }
  | {
      kind: "installed_card_liquidation_choice";
      signal: RunnerInstalledCardLiquidationChoiceSignal;
    };
type CoverageState = {
  kind: "coverage";
  gap: RunnerCoverageGapSignal;
  selectedSearchActionId?: string;
  selectedSearchStateVersion?: number;
  phase:
    | "install_answer"
    | "fund_answer"
    | "search_answer"
    | "setup_search_engine"
    | "draw_for_answer";
};
type DefenseState = {
  kind: "defense";
  phase:
    | "clear_tags"
    | "clear_persistent_hazard_counter"
    | "prevent_damage"
    | "build_hand_buffer"
    | "build_reaction_reserve"
    | "discard_window"
    | "forgo_unsafe_run";
  signals: RunnerDefenseSignals;
};
type CreditBankState = {
  kind: "credit_bank";
  phase: RunnerCreditBankSignal["phase"];
  signal: RunnerCreditBankSignal;
};
type RecurringEconomyState = {
  kind: "recurring_economy";
  phase: RunnerRecurringEconomySignal["phase"];
  signal: RunnerRecurringEconomySignal;
};
type InstalledAgendaScoreState = {
  kind: "installed_agenda_score";
  phase: "score_installed_agenda";
  signal: RunnerInstalledAgendaScoreSignal;
};
type ResourceLifecycleState = {
  kind: "resource_lifecycle";
  phase: RunnerResourceLifecycleSignal["phase"];
  signal: RunnerResourceLifecycleSignal;
};
type ShellTradersPipelineState = {
  kind: "shell_traders_pipeline";
  phase: RunnerShellTradersPipelineSignal["phase"];
  signal: RunnerShellTradersPipelineSignal;
};

export function createRunnerCorePlanModules(
  dependencies: RunnerCorePlanDependencies = {},
): PlanModule[] {
  const rolesForDefinitionId =
    dependencies.rolesForDefinitionId ?? rolesForDeckDoctrineCard;
  return [
    installedAgendaScoreModule(),
    shellTradersPipelineModule(),
    resourceLifecycleModule(),
    creditBankModule(),
    recurringEconomyModule(),
    economyModule(),
    coverageModule(rolesForDefinitionId),
    defenseModule(),
  ];
}

function shellTradersPipelineModule(): PlanModule {
  return {
    moduleId: "runner.shell_traders_pipeline",
    side: "runner",
    discover: (context) =>
      (domain(context).shellTradersPipelines ?? []).map((signal) =>
        proposal({
          moduleId: "runner.shell_traders_pipeline",
          dedupeKey: signal.pipelineId,
          moduleState: {
            kind: "shell_traders_pipeline",
            phase: signal.phase,
            signal,
          } satisfies ShellTradersPipelineState,
          priorityClass: signal.priorityClass,
          target: {
            kind: "card",
            id: signal.targetCardInstanceId,
          },
          routeExists:
            shellTradersPipelineCandidates(context, signal).length > 0,
          blockerCode:
            signal.phase === "hold"
              ? "shell_traders_pipeline_held"
              : "shell_traders_exact_route_unavailable",
          evidenceCode:
            signal.evidenceCodes[0] ??
            "runner_shell_traders_pipeline_visible_state",
          evidenceCodes: signal.evidenceCodes,
        }),
      ),
    assess: (instance, context, portfolio) => {
      const signal = state<ShellTradersPipelineState>(instance).signal;
      const candidates = shellTradersPipelineCandidates(context, signal);
      return assessment(
        instance,
        signal.priorityClass,
        candidates.length > 0,
        signal.value,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const signal = state<ShellTradersPipelineState>(instance).signal;
      const candidates = shellTradersPipelineCandidates(context, signal);
      return {
        step: {
          stepId: `${instance.instanceId}:${signal.phase}:${signal.targetCardInstanceId}`,
          capability: {
            capabilityId: `shell_traders_${signal.phase}`,
            semanticActionTypes: [
              ...new Set(
                candidates.map((entry) => entry.candidate.semanticActionType),
              ),
            ],
            legalActionTypes: ["trigger_ability"],
            requiredSourceDefinitionIds: [signal.sourceDefinitionId],
          },
          target: {
            kind: "card",
            id: signal.targetCardInstanceId,
          },
          purpose:
            signal.phase === "prepare"
              ? "Prepare the exact program or hardware target for delayed free installation."
              : signal.phase === "progress"
                ? "Progress the exact prepared target without sacrificing a more valuable rig."
                : "Hold the prepared target until its completion or replacement is useful.",
        },
        candidates,
      };
    },
  };
}

function resourceLifecycleModule(): PlanModule {
  return {
    moduleId: "runner.resource_lifecycle",
    side: "runner",
    discover: (context) =>
      (domain(context).resourceLifecycle ?? []).map((signal) => {
        const lifecycleProposal = proposal({
          moduleId: "runner.resource_lifecycle",
          dedupeKey: signal.lifecycleId,
          moduleState: {
            kind: "resource_lifecycle",
            phase: signal.phase,
            signal,
          } satisfies ResourceLifecycleState,
          priorityClass: signal.priorityClass,
          target: { kind: "card", id: signal.sourceCardInstanceId },
          routeExists:
            resourceLifecycleCandidates(context, signal).length > 0 ||
            signal.supportNeedId !== undefined,
          blockerCode: `resource_lifecycle_${signal.phase}`,
          evidenceCode:
            signal.evidenceCodes[0] ??
            "runner_resource_lifecycle_visible_state",
        });
        if (!signal.supportNeedId) return lifecycleProposal;
        return {
          ...lifecycleProposal,
          resumeConditions: [{ code: signal.supportNeedId }],
        };
      }),
    assess: (instance, context, portfolio) => {
      const signal = state<ResourceLifecycleState>(instance).signal;
      const resourceGaps = exactRunnerParentFundingResourceGaps(
        context,
        instance,
        signal.supportNeedId,
      );
      return assessment(
        instance,
        signal.priorityClass,
        resourceLifecycleCandidates(context, signal).length > 0,
        signal.value,
        portfolio.executorInstanceId,
        resourceGaps,
      );
    },
    materialize: (instance, _assessment, context) => {
      const signal = state<ResourceLifecycleState>(instance).signal;
      const candidates = resourceLifecycleCandidates(context, signal);
      return {
        step: {
          stepId: `${instance.instanceId}:${signal.phase}`,
          capability: {
            capabilityId: `resource_lifecycle_${signal.phase}`,
            semanticActionTypes: [
              ...new Set(
                candidates.map((entry) => entry.candidate.semanticActionType),
              ),
            ],
            requiredSourceDefinitionIds: [signal.definitionId],
          },
          target: { kind: "card", id: signal.sourceCardInstanceId },
          purpose:
            signal.phase === "leave_play"
              ? "Resolve the explicitly profitable end-of-turn resource lifecycle route."
              : "Retain the resource while its leave-play route is not productive.",
        },
        candidates,
      };
    },
  };
}

function installedAgendaScoreModule(): PlanModule {
  return {
    moduleId: "runner.score_installed_agenda",
    side: "runner",
    discover: (context) =>
      (domain(context).installedAgendaScores ?? []).map((signal) =>
        proposal({
          moduleId: "runner.score_installed_agenda",
          dedupeKey: signal.opportunityId,
          moduleState: {
            kind: "installed_agenda_score",
            phase: "score_installed_agenda",
            signal,
          } satisfies InstalledAgendaScoreState,
          priorityClass: signal.terminal ? "P1" : "P3",
          target: { kind: "card", id: signal.sourceCardInstanceId },
          routeExists:
            installedAgendaScoreCandidates(context, signal).length > 0,
          blockerCode: "installed_agenda_score_route_unavailable",
          evidenceCode: signal.evidenceCode,
        }),
      ),
    assess: (instance, context, portfolio) => {
      const signal = state<InstalledAgendaScoreState>(instance).signal;
      return assessment(
        instance,
        signal.terminal ? "P1" : "P3",
        installedAgendaScoreCandidates(context, signal).length > 0,
        (signal.terminal ? 2_000 : 1_000) + signal.agendaPoints * 100,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const signal = state<InstalledAgendaScoreState>(instance).signal;
      return {
        step: {
          stepId: `${instance.instanceId}:score`,
          capability: {
            capabilityId: "score_installed_agenda",
            semanticActionTypes: [
              ...new Set(
                installedAgendaScoreCandidates(context, signal).map(
                  (entry) => entry.candidate.semanticActionType,
                ),
              ),
            ],
          },
          target: { kind: "card", id: signal.sourceCardInstanceId },
          purpose:
            "Convert the installed agenda replacement into agenda points.",
        },
        candidates: installedAgendaScoreCandidates(context, signal),
      };
    },
  };
}

function recurringEconomyModule(): PlanModule {
  return {
    moduleId: "runner.recurring_economy",
    side: "runner",
    discover: (context) =>
      (domain(context).recurringEconomy ?? []).map((signal) =>
        proposal({
          moduleId: "runner.recurring_economy",
          dedupeKey: signal.commitmentId,
          moduleState: {
            kind: "recurring_economy",
            phase: signal.phase,
            signal,
          } satisfies RecurringEconomyState,
          priorityClass: signal.priorityClass,
          target: { kind: "card", id: signal.definitionId },
          routeExists: recurringEconomyCandidates(context, signal).length > 0,
          blockerCode:
            signal.phase === "hold"
              ? "recurring_economy_waiting_for_value"
              : "recurring_economy_install_route_unavailable",
          evidenceCode:
            signal.evidenceCodes[0] ?? "runner_recurring_economy_commitment",
        }),
      ),
    assess: (instance, context, portfolio) => {
      const signal = state<RecurringEconomyState>(instance).signal;
      const candidates = recurringEconomyCandidates(context, signal);
      return assessment(
        instance,
        signal.priorityClass,
        candidates.length > 0,
        signal.value,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const signal = state<RecurringEconomyState>(instance).signal;
      const candidates = recurringEconomyCandidates(context, signal);
      return {
        step: {
          stepId: `${instance.instanceId}:${signal.phase}`,
          capability: {
            capabilityId: `recurring_economy_${signal.phase}`,
            semanticActionTypes: [
              ...new Set(
                candidates.map((entry) => entry.candidate.semanticActionType),
              ),
            ],
            ...(signal.phase === "install"
              ? { requiredSourceDefinitionIds: [signal.definitionId] }
              : {}),
          },
          ...(signal.phase === "install"
            ? { target: { kind: "card" as const, id: signal.definitionId } }
            : {}),
          purpose:
            signal.phase === "install"
              ? "Install the recurring economy commitment with a productive setup window."
              : "Develop through explicit non-run steps until the installed recurring economy commitment resolves its automatic value.",
        },
        candidates,
      };
    },
  };
}

function creditBankModule(): PlanModule {
  return {
    moduleId: "runner.credit_bank",
    side: "runner",
    discover: (context) =>
      domain(context).creditBanks.map((signal) =>
        proposal({
          moduleId: "runner.credit_bank",
          dedupeKey: signal.bankId,
          moduleState: {
            kind: "credit_bank",
            phase: signal.phase,
            signal,
          } satisfies CreditBankState,
          priorityClass: signal.priorityClass,
          target: { kind: "bank", id: signal.bankId },
          routeExists: bankCandidates(context, signal).length > 0,
          blockerCode: `no_credit_bank_${signal.phase}_route`,
          evidenceCode:
            signal.evidenceCodes[0] ?? `runner_credit_bank_${signal.phase}`,
        }),
      ),
    assess: (instance, context, portfolio) => {
      const signal = state<CreditBankState>(instance).signal;
      return assessment(
        instance,
        signal.priorityClass,
        bankCandidates(context, signal).length > 0,
        signal.value,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const signal = state<CreditBankState>(instance).signal;
      const candidates = bankCandidates(context, signal);
      const prospectiveBuild =
        signal.phase === "install" &&
        signal.prospectivePlan?.build.projection === "feasible_in_projection"
          ? signal.prospectivePlan.build
          : undefined;
      return {
        step: {
          stepId: `${instance.instanceId}:${signal.phase}`,
          capability: {
            capabilityId: `credit_bank_${signal.phase}`,
            semanticActionTypes: [
              ...new Set(
                candidates.map((entry) => entry.candidate.semanticActionType),
              ),
            ],
          },
          target: { kind: "bank", id: signal.bankId },
          purpose:
            signal.phase === "install"
              ? "Install the bound multi-turn credit bank."
              : signal.phase === "build"
                ? "Invest the current once-per-turn bank action."
                : signal.phase === "cash_out"
                  ? "Convert the stored bank value into a bound funding need."
                  : "Keep the credit-bank plan resident until its next admissible phase.",
        },
        candidates,
        ...(prospectiveBuild
          ? {
              continuation: {
                continuationId: `${instance.instanceId}:prospective:${prospectiveBuild.capabilityKey}`,
                trigger: "action_applied" as const,
                nextCapability: {
                  capabilityId: "credit_bank_build",
                  semanticActionTypes: ["card_ability.trigger"],
                  legalActionTypes: ["activated_card_ability"],
                  requiredSourceDefinitionIds: [
                    signal.prospectivePlan!.sourceDefinitionId,
                  ],
                },
                target: { kind: "bank" as const, id: signal.bankId },
                purpose:
                  "Rematerialize the exact current build capability after the bank installation is applied.",
              },
            }
          : {}),
      };
    },
  };
}

export function runnerDevelopmentCardAdmission(params: {
  definitionId: string;
  assignedDomainPlanIds: readonly string[];
  concretePurposeCode?: string;
  duplicateAlreadyInstalled: boolean;
  affordableOrSupportable: boolean;
}):
  | { admitted: true; reasonCode: string }
  | { admitted: false; reasonCode: string } {
  if (params.assignedDomainPlanIds.length > 0) {
    return {
      admitted: false,
      reasonCode: `assigned_domain_requires_domain_owner:${[...params.assignedDomainPlanIds].sort()[0]}`,
    };
  }
  if (!isConcreteRunnerDevelopmentPurpose(params.concretePurposeCode))
    return { admitted: false, reasonCode: "no_concrete_plan_purpose" };
  if (params.duplicateAlreadyInstalled)
    return { admitted: false, reasonCode: "redundant_board_copy" };
  return {
    admitted: true,
    reasonCode: params.affordableOrSupportable
      ? `card_specific_purpose:${params.concretePurposeCode}`
      : `card_specific_waiting_route:${params.concretePurposeCode}`,
  };
}

function isConcreteRunnerDevelopmentPurpose(
  purposeCode: string | undefined,
): purposeCode is string {
  const normalized = purposeCode?.trim();
  return (
    normalized !== undefined &&
    normalized.length > 0 &&
    normalized !== "unknown" &&
    !normalized.startsWith("unknown:")
  );
}

function economyModule(): PlanModule {
  return {
    moduleId: "runner.economy",
    side: "runner",
    discover: (context) => [
      ...domain(context)
        .fundingNeeds.filter((need) => need.gap > 0)
        .map((need) => {
          const validSupportContract = validRunnerFundingNeedContract(
            need,
            context.input.playerView.stateVersion,
          );
          const routeExists = economyCandidates(context, need).length > 0;
          return proposal({
            moduleId: "runner.economy",
            dedupeKey: need.needId,
            moduleState: { kind: "economy", need } satisfies EconomyState,
            priorityClass: need.priorityClass,
            target: { kind: "capability", id: need.needId },
            routeExists: validSupportContract && routeExists,
            blockerCode: validSupportContract
              ? "no_compatible_credit_route"
              : need.kind === "develop_liquidity"
                ? "invalid_turn_liquidity_revalidation"
                : need.kind === "parent_plan_support"
                  ? "orphaned_funding_need"
                  : "invalid_funding_need_revalidation",
            evidenceCode: need.evidenceCode,
            ...(need.kind === "parent_plan_support"
              ? {
                  parentInstanceId: need.parentPlanInstanceId,
                  parentNeedId: need.needId,
                }
              : {}),
          });
        }),
      ...(domain(context).installedCardLiquidationChoices ?? []).map((signal) =>
        proposal({
          moduleId: "runner.economy",
          dedupeKey: signal.conversionId,
          moduleState: {
            kind: "installed_card_liquidation_choice",
            signal,
          } satisfies EconomyState,
          priorityClass: signal.priorityClass,
          target: {
            kind: "card",
            id: signal.sourceResourceDefinitionId,
          },
          routeExists:
            installedCardLiquidationChoiceCandidates(context, signal).length >
            0,
          blockerCode: "installed_card_liquidation_choice_unavailable",
          evidenceCode:
            signal.evidenceCodes[0] ??
            "runner_installed_card_liquidation_choice_owned_by_economy",
        }),
      ),
    ],
    assess: (instance, context, portfolio) => {
      const economyState = state<EconomyState>(instance);
      if (economyState.kind === "installed_card_liquidation_choice") {
        const signal = economyState.signal;
        return assessment(
          instance,
          signal.priorityClass,
          installedCardLiquidationChoiceCandidates(context, signal).length > 0,
          signal.value,
          portfolio.executorInstanceId,
        );
      }
      const need = economyState.need;
      const parentIsResidentAndMaterial =
        need.kind === "portfolio_reserve" ||
        need.kind === "develop_liquidity" ||
        portfolio.instances.some((candidate) =>
          runnerFundingParentIsResidentAndMaterial(candidate, need),
        );
      const supportContractValid = validRunnerFundingNeedContract(
        need,
        context.input.playerView.stateVersion,
      );
      const routeExists =
        parentIsResidentAndMaterial &&
        supportContractValid &&
        economyCandidates(context, need).length > 0;
      const result = assessment(
        instance,
        need.priorityClass,
        routeExists,
        need.kind === "develop_liquidity" ? -9_999 : need.gap * 10,
        portfolio.executorInstanceId,
      );
      if (!parentIsResidentAndMaterial && need.kind === "parent_plan_support") {
        result.blockers = [
          {
            code: "orphaned_funding_need",
            owner: "plan_module",
            removable: true,
            resumeCondition: { code: "material_parent_plan_ready" },
          },
        ];
      } else if (!supportContractValid) {
        result.blockers = [
          {
            code: "invalid_funding_need_revalidation",
            owner: "plan_module",
            removable: true,
            resumeCondition: { code: "funding_need_revalidated" },
          },
        ];
      }
      return result;
    },
    materialize: (instance, _assessment, context) => {
      const economyState = state<EconomyState>(instance);
      if (economyState.kind === "installed_card_liquidation_choice") {
        const signal = economyState.signal;
        const candidates = installedCardLiquidationChoiceCandidates(
          context,
          signal,
        );
        return {
          step: {
            stepId: `${instance.instanceId}:resolve_optional_liquidation`,
            capability: {
              capabilityId: "resolve_optional_installed_card_liquidation",
              semanticActionTypes: ["choice.resolve"],
            },
            purpose:
              "Resolve the current optional installed-card liquidation without inventing an unquoted target valuation.",
          },
          candidates,
        };
      }
      const need = economyState.need;
      const candidates = economyCandidates(context, need);
      return {
        step: {
          stepId: `${instance.instanceId}:fund:${need.needId}`,
          capability: {
            capabilityId: "gain_general_liquid_credits",
            semanticActionTypes: [
              ...new Set(
                candidates.map((entry) => entry.candidate.semanticActionType),
              ),
            ],
          },
          purpose:
            need.kind === "develop_liquidity"
              ? "Develop guaranteed immediate unrestricted Runner liquidity through the strongest exact current route."
              : `Close the bound credit gap ${need.needId}.`,
        },
        candidates,
      };
    },
  };
}

function installedCardLiquidationChoiceCandidates(
  context: PlanSchedulerContext,
  signal: RunnerInstalledCardLiquidationChoiceSignal,
): PlanMaterialization["candidates"] {
  return context.actionCandidates
    .filter(
      (candidate) =>
        candidate.actionId === signal.actionId &&
        candidate.semanticActionType === "choice.resolve" &&
        context.input.legalActions.some(
          (action) =>
            action.actionId === candidate.actionId &&
            action.side === "runner" &&
            action.type === "resolve_choice" &&
            action.timingPoint === context.input.playerView.timingPoint &&
            action.expiresAtStateVersion ===
              context.input.playerView.stateVersion &&
            action.choiceRequirements?.length === 1 &&
            action.choiceRequirements[0]?.choiceId === signal.choiceId,
        ),
    )
    .map((candidate) => ({ candidate, stepValue: signal.value }));
}

function coverageModule(
  rolesForDefinitionId: (definitionId: string) => readonly string[],
): PlanModule {
  return {
    moduleId: "runner.rig_and_coverage",
    side: "runner",
    discover: (context) =>
      domain(context).coverageGaps.map((gap) => {
        const installs = coverageInstallCandidates(
          context,
          gap,
          rolesForDefinitionId,
        );
        const draws = coverageDrawCandidates(context, gap);
        const funding = coverageFundingCandidates(context, gap);
        const phase =
          installs.length > 0
            ? "install_answer"
            : gap.answerInHand && (gap.fundingGap ?? 0) > 0
              ? "fund_answer"
              : gap.directSearchActionIds.length > 0
                ? "search_answer"
                : gap.searchEngineSetupActionIds.length > 0
                  ? "setup_search_engine"
                  : "draw_for_answer";
        const routeExists =
          installs.length > 0 ||
          (phase === "fund_answer" && funding.length > 0) ||
          (!gap.answerInHand && gap.deckHasAnswer && draws.length > 0);
        return proposal({
          moduleId: "runner.rig_and_coverage",
          dedupeKey: gap.gapId,
          moduleState: {
            kind: "coverage",
            gap,
            phase,
          } satisfies CoverageState,
          priorityClass: gap.priorityClass,
          target: { kind: "capability", id: gap.requiredRole },
          routeExists,
          blockerCode: "no_exact_coverage_route",
          evidenceCode: gap.evidenceCode,
          evidenceCodes: [
            gap.evidenceCode,
            ...(gap.recoveryEvidenceCodes ?? []),
          ],
        });
      }),
    assess: (instance, context, portfolio) => {
      const current = state<CoverageState>(instance);
      const candidates =
        current.phase === "install_answer"
          ? coverageInstallCandidates(
              context,
              current.gap,
              rolesForDefinitionId,
            )
          : current.phase === "fund_answer"
            ? coverageFundingCandidates(context, current.gap)
            : coverageDrawCandidates(context, current.gap);
      return assessment(
        instance,
        current.gap.priorityClass,
        candidates.length > 0,
        current.phase === "install_answer"
          ? current.gap.targetServerId
            ? 120
            : 80
          : current.phase === "fund_answer"
            ? 60 + Math.max(0, current.gap.fundingGap ?? 0)
            : 30,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const current = state<CoverageState>(instance);
      if (current.phase === "install_answer") {
        return {
          step: {
            stepId: `${instance.instanceId}:install:${current.gap.requiredRole}`,
            capability: {
              capabilityId: `install_${current.gap.requiredRole}`,
              semanticActionTypes: ["install.card"],
              legalActionTypes: ["install_card"],
              requiredSourceRoles: [current.gap.requiredRole],
            },
            purpose: `Install an exact answer for ${current.gap.requiredRole}.`,
          },
          candidates: coverageInstallCandidates(
            context,
            current.gap,
            rolesForDefinitionId,
          ),
        };
      }
      if (current.phase === "fund_answer") {
        return {
          step: {
            stepId: `${instance.instanceId}:fund:${current.gap.requiredRole}`,
            capability: {
              capabilityId: `fund_install_${current.gap.requiredRole}`,
              semanticActionTypes: ["economy.gain_credit"],
            },
            purpose: `Fund the visible in-hand answer for ${current.gap.requiredRole}.`,
          },
          candidates: coverageFundingCandidates(context, current.gap),
        };
      }
      const candidates = coverageDrawCandidates(context, current.gap);
      return {
        step: {
          stepId: `${instance.instanceId}:find:${current.gap.requiredRole}`,
          capability: {
            capabilityId: `${current.phase}_${current.gap.requiredRole}`,
            semanticActionTypes: [
              ...new Set(
                candidates.map((entry) => entry.candidate.semanticActionType),
              ),
            ],
          },
          purpose: `Find an answer known to exist for ${current.gap.requiredRole}.`,
        },
        candidates,
      };
    },
  };
}

function defenseModule(): PlanModule {
  return {
    moduleId: "runner.defense_and_recovery",
    side: "runner",
    discover: (context) => {
      const signals = domain(context).defense;
      const invalidReactionReserveContract =
        signals.reactionReserveNeed !== undefined &&
        !validRunnerDefenseFundingNeed(
          signals.reactionReserveNeed,
          context.input.playerView.stateVersion,
        );
      const phase = invalidReactionReserveContract
        ? "build_reaction_reserve"
        : defensePhase(context, signals);
      if (!phase) return [];
      const candidates = invalidReactionReserveContract
        ? []
        : defenseCandidates(context, phase, signals);
      return [
        proposal({
          moduleId: "runner.defense_and_recovery",
          dedupeKey: "runner",
          moduleState: {
            kind: "defense",
            phase,
            signals,
          } satisfies DefenseState,
          priorityClass: defensePriorityClass(signals),
          target: { kind: "player", id: "runner" },
          routeExists: candidates.length > 0,
          blockerCode: invalidReactionReserveContract
            ? "invalid_reaction_reserve_need"
            : `no_${phase}_route`,
          evidenceCode: signals.evidenceCodes[0] ?? phase,
        }),
      ];
    },
    assess: (instance, context, portfolio) => {
      const current = state<DefenseState>(instance);
      const reactionReserveContractValid =
        current.phase !== "build_reaction_reserve" ||
        (current.signals.reactionReserveNeed !== undefined &&
          validRunnerDefenseFundingNeed(
            current.signals.reactionReserveNeed,
            context.input.playerView.stateVersion,
          ));
      const candidates = reactionReserveContractValid
        ? defenseCandidates(context, current.phase, current.signals)
        : [];
      const priorityClass = defensePriorityClass(current.signals);
      return assessment(
        instance,
        priorityClass,
        candidates.length > 0,
        defensePhaseValue(current.phase, current.signals),
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const current = state<DefenseState>(instance);
      const candidates = defenseCandidates(
        context,
        current.phase,
        current.signals,
      );
      return {
        step: {
          stepId: `${instance.instanceId}:${current.phase}`,
          capability: defenseCapability(current.phase, candidates),
          purpose: `Resolve runner defense phase ${current.phase}.`,
        },
        candidates,
        ...(current.phase === "forgo_unsafe_run"
          ? {
              earlyEndTurnJustification: {
                kind: "forgo_restricted_capacity" as const,
                capacityKind: "zero_click_non_basic_run_only" as const,
                explicitlyNonproductiveActionIds: context.actionCandidates
                  .filter(
                    (candidate) => candidate.semanticActionType === "run.start",
                  )
                  .map((candidate) => candidate.actionId),
              },
            }
          : {}),
      };
    },
  };
}

function proposal(params: {
  moduleId: PlanProposal["moduleId"];
  dedupeKey: string;
  moduleState: unknown;
  priorityClass: PriorityClass;
  target?: PlanProposal["target"];
  routeExists: boolean;
  blockerCode: string;
  evidenceCode: string;
  evidenceCodes?: readonly string[];
  parentInstanceId?: string;
  parentNeedId?: string;
}): PlanProposal {
  const blockers: PlanBlocker[] = params.routeExists
    ? []
    : [
        {
          code: params.blockerCode,
          owner: "plan_module",
          removable: true,
          resumeCondition: { code: "compatible_route_available" },
        },
      ];
  return {
    moduleId: params.moduleId,
    moduleVersion: "1",
    dedupeKey: params.dedupeKey,
    side: "runner",
    strategyLineIds: [],
    executionClass:
      params.priorityClass === "P1" || params.priorityClass === "P2"
        ? "urgent_response"
        : params.priorityClass === "P3"
          ? "bounded_sequence"
          : "development_project",
    initialViability: params.routeExists ? "ready" : "blocked",
    persistencePolicy:
      params.priorityClass === "P2" || params.priorityClass === "P3"
        ? "locked_sequence"
        : "sticky_goal",
    retentionPolicy: {
      blockedStateVersionTtl: 2,
      dormantStateVersionTtl: 2,
      completedHistoryStateVersionTtl: 4,
      abandonWhenTargetMissing: params.target !== undefined,
      protectedWhileNeedOpen: true,
      protectedWhileCommitted: true,
    },
    ...(params.target ? { target: params.target } : {}),
    ...(params.parentInstanceId
      ? { parentInstanceId: params.parentInstanceId }
      : {}),
    ...(params.parentNeedId !== undefined
      ? { parentNeedId: params.parentNeedId }
      : {}),
    phase: moduleStatePhase(params.moduleState),
    milestone: "need_open",
    moduleState: structuredClone(params.moduleState),
    blockers,
    resumeConditions: [{ code: "compatible_route_available" }],
    completionConditions: [{ code: "need_satisfied" }],
    abandonmentConditions: [{ code: "need_disappeared" }],
    evidenceRefs: (params.evidenceCodes ?? [params.evidenceCode]).map(
      (code) => ({ code, source: "visible_state" as const }),
    ),
  };
}

function assessment(
  instance: PlanInstance,
  priorityClass: "P1" | "P2" | "P3" | "P4" | "P5" | "P6",
  routeExists: boolean,
  withinClassValue: number,
  currentExecutorId: string | undefined,
  resourceGaps: readonly ResourceGap[] = [],
): PlanAssessment {
  const priorityClaim: PriorityClaim =
    priorityClass === "P1"
      ? {
          requestedClass: "P1",
          reasonCode: "terminal_win",
          horizon: "current_turn",
          witness: {
            kind: "terminal_path",
            evidenceCode:
              instance.evidenceRefs[0]?.code ??
              "installed_agenda_terminal_score",
            guarantee: "rules_proven",
          },
        }
      : priorityClass === "P2"
        ? {
            requestedClass: "P2",
            reasonCode: "survival_threat",
            horizon: "current_turn",
            witness: {
              kind: "survival_threat",
              evidenceCode: instance.evidenceRefs[0]?.code ?? "visible_threat",
              guarantee: "visible_state_forced",
            },
          }
        : priorityClass === "P3"
          ? {
              requestedClass: "P3",
              reasonCode: "expiring_conversion",
              horizon: "current_turn",
            }
          : priorityClass === "P5"
            ? {
                requestedClass: "P5",
                reasonCode: "development_need",
                horizon: "multi_turn",
              }
            : priorityClass === "P4"
              ? {
                  requestedClass: "P4",
                  reasonCode: "strategic_campaign",
                  horizon: "multi_turn",
                }
              : {
                  requestedClass: "P6",
                  reasonCode: "neutral_progress",
                  horizon: "current_turn",
                };
  return {
    instanceId: instance.instanceId,
    side: "runner",
    priorityClaim,
    intentFit:
      priorityClass === "P4" || priorityClass === "P5" ? "aligned" : "none",
    readiness: routeExists
      ? "executable_now"
      : resourceGaps.length > 0
        ? "executable_with_support"
        : "blocked",
    ...(routeExists
      ? {
          nextStepPreview: {
            stepId: `${instance.instanceId}:${instance.phase}`,
            capability: instance.phase,
            purpose: "Execute the current module phase.",
          },
        }
      : {}),
    feasibility: {
      currentRouteHeadPossible: routeExists,
      projectedActionCount: routeExists
        ? 1
        : resourceGaps.length > 0
          ? resourceGaps.length + 1
          : 0,
      opponentCanReact: false,
      confidence: "visible_state_forced",
    },
    resourceGaps: resourceGaps.map((gap) => ({ ...gap })),
    expectedOutcome: {
      outcomeKind: "plan_progress",
      minimumValue: routeExists || resourceGaps.length > 0 ? 1 : 0,
      expectedValue: routeExists || resourceGaps.length > 0 ? 1 : 0,
      maximumValue: routeExists || resourceGaps.length > 0 ? 1 : 0,
      terminal: priorityClass === "P1",
      guarantee: "visible_state_forced",
    },
    continuity: {
      isCurrentForeground: currentExecutorId === instance.instanceId,
      sameObjectiveAsForeground: currentExecutorId === instance.instanceId,
      switchingCost: currentExecutorId === instance.instanceId ? 1 : 0,
      progressAtRisk: currentExecutorId === instance.instanceId ? 1 : 0,
    },
    blockers:
      routeExists || resourceGaps.length > 0
        ? []
        : structuredClone(instance.blockers),
    withinClassValue,
    evidenceCodes: instance.evidenceRefs.map((entry) => entry.code),
  };
}

function exactRunnerParentFundingResourceGaps(
  context: PlanSchedulerContext,
  parent: PlanInstance,
  supportNeedId: string | undefined,
): ResourceGap[] {
  if (supportNeedId === undefined) return [];
  const exactNeeds = domain(context).fundingNeeds.filter(
    (
      need,
    ): need is Extract<
      RunnerFundingNeedSignal,
      { kind: "parent_plan_support" }
    > =>
      need.kind === "parent_plan_support" &&
      need.needId === supportNeedId &&
      need.parentPlanInstanceId === parent.instanceId &&
      need.gap > 0,
  );
  if (exactNeeds.length !== 1) return [];
  const [need] = exactNeeds;
  if (
    !need ||
    !validRunnerFundingNeedContract(need, context.input.playerView.stateVersion)
  ) {
    return [];
  }
  return [
    {
      needId: need.needId,
      capability: "credits",
      minimum: need.gap,
      available: 0,
      deadline: "current_turn",
    },
  ];
}

function economyCandidates(
  context: PlanSchedulerContext,
  need: RunnerFundingNeedSignal,
): PlanMaterialization["candidates"] {
  const routeActionIds = new Set(
    need.kind === "develop_liquidity" ? need.actionIds : need.routeActionIds,
  );
  return context.actionCandidates
    .filter(
      (candidate) =>
        routeActionIds.has(candidate.actionId) &&
        (need.kind === "develop_liquidity"
          ? runnerTurnLiquidityCandidateIsMaterializable(candidate)
          : runnerFundingRouteCandidateIsMaterializable(candidate)),
    )
    .map((candidate) => {
      const netLiquidCreditGain =
        candidate.economyProjection!.netLiquidCreditGain!;
      const fundingGapProgress = Math.min(need.gap, netLiquidCreditGain);
      return {
        candidate,
        stepValue: fundingGapProgress * 100 + netLiquidCreditGain,
      };
    });
}

function validRunnerFundingNeedContract(
  need: RunnerFundingNeedSignal,
  stateVersion: number,
): boolean {
  if (need.kind === "develop_liquidity") {
    const actionIds = [...new Set(need.actionIds)];
    return (
      need.needId.startsWith("economy-liquidity-development:") &&
      actionIds.length === need.actionIds.length &&
      actionIds.length > 0 &&
      Number.isSafeInteger(need.currentCreditsAtRevalidation) &&
      Number.isSafeInteger(need.targetCredits) &&
      Number.isSafeInteger(need.gap) &&
      need.currentCreditsAtRevalidation >= 0 &&
      need.targetCredits >= 0 &&
      need.gap > 0 &&
      need.targetCredits === need.currentCreditsAtRevalidation + need.gap &&
      need.priorityClass === "P6" &&
      need.cadence.kind === "remaining_turn_capacity" &&
      Number.isSafeInteger(need.cadence.maximumConversions) &&
      need.cadence.maximumConversions === need.gap &&
      need.completion.kind === "target_credits_or_no_clicks" &&
      need.revalidation.stateVersion === stateVersion &&
      need.revalidation.status === "turn_liquidity_open" &&
      need.evidenceCode.trim().length > 0
    );
  }
  if (
    !Number.isFinite(need.targetCredits) ||
    !Number.isFinite(need.currentCreditsAtRevalidation) ||
    !Number.isFinite(need.gap) ||
    need.targetCredits < 0 ||
    need.currentCreditsAtRevalidation < 0 ||
    need.gap <= 0 ||
    need.revalidation.stateVersion !== stateVersion ||
    need.routeAssessment.stateVersion !== stateVersion ||
    need.gap !==
      Math.max(0, need.targetCredits - need.currentCreditsAtRevalidation)
  ) {
    return false;
  }
  const routeActionIds = [...new Set(need.routeActionIds)];
  if (
    routeActionIds.length !== need.routeActionIds.length ||
    routeActionIds.length > 1 ||
    need.routeAssessment.routeId.length === 0 ||
    need.routeAssessment.evidenceCodes.length === 0 ||
    !Number.isFinite(need.routeAssessment.projectedGap) ||
    need.routeAssessment.projectedGap < 0 ||
    !Number.isFinite(need.routeAssessment.totalClickCost) ||
    need.routeAssessment.totalClickCost < 0
  ) {
    return false;
  }
  if (routeActionIds.length > 0) {
    if (
      need.routeAssessment.status !== "covered_guaranteed" ||
      need.routeAssessment.reliability !== "guaranteed" ||
      need.routeAssessment.horizon !== "same_turn" ||
      need.routeAssessment.projectedGap !== 0 ||
      need.routeAssessment.firstStepActionId !== routeActionIds[0]
    ) {
      return false;
    }
  } else if (need.routeAssessment.firstStepActionId !== undefined) {
    return false;
  }
  if (need.kind === "portfolio_reserve") {
    return (
      need.priorityClass === "P6" &&
      need.revalidation.status === "portfolio_reserve_open"
    );
  }
  return (
    need.parentPlanInstanceId.length > 0 &&
    need.driver.targetId.length > 0 &&
    need.driver.reasonCode.length > 0 &&
    need.revalidation.status === "material_parent_open"
  );
}

export function runnerExactBasicLiquidCreditCandidate(
  candidate: ActionSemanticCandidate,
): boolean {
  const projection = candidate.economyProjection;
  return (
    candidate.sourceKind === "basic_action" &&
    candidate.actionType === "gain_credit" &&
    candidate.semanticActionType === "economy.gain_credit" &&
    candidate.costProfile.clickCost === 1 &&
    (candidate.costProfile.creditCost === undefined ||
      candidate.costProfile.creditCost === 0) &&
    candidate.costProfile.additionalCosts.length === 0 &&
    projection?.kind === "immediate_liquid" &&
    projection.timing === "immediate" &&
    projection.creditRestriction === "general" &&
    projection.clickCost === 1 &&
    projection.creditCost === 0 &&
    projection.grossLiquidCreditGain === 1 &&
    projection.netLiquidCreditGain === 1 &&
    projection.cardsDrawn === 0 &&
    projection.cardsConsumed === 0 &&
    projection.netHandDelta === 0 &&
    projection.payoutMode === "fixed" &&
    projection.reliability === "guaranteed" &&
    ((projection.source === "basic_action_contract" &&
      projection.confidence === "medium") ||
      (projection.source === "legal_action_payload" &&
        projection.confidence === "high"))
  );
}

function runnerFundingParentIsResidentAndMaterial(
  candidate: PlanInstance,
  need: Extract<RunnerFundingNeedSignal, { kind: "parent_plan_support" }>,
): boolean {
  if (
    candidate.instanceId !== need.parentPlanInstanceId ||
    (candidate.viability !== "ready" && candidate.viability !== "blocked")
  ) {
    return false;
  }
  const moduleState = candidate.moduleState as
    | {
        signal?: {
          supportNeedId?: unknown;
          marginalValue?: unknown;
        };
      }
    | undefined;
  const waitsOnlyForThisFunding =
    candidate.blockers.length === 0 ||
    candidate.blockers.every(
      (blocker) =>
        blocker.code === "waiting_for_bound_funding_support" &&
        blocker.resumeCondition?.code === need.needId,
    );
  return (
    waitsOnlyForThisFunding &&
    moduleState?.signal?.supportNeedId === need.needId &&
    typeof moduleState.signal.marginalValue === "number" &&
    moduleState.signal.marginalValue > 0
  );
}

function shellTradersPipelineCandidates(
  context: PlanSchedulerContext,
  signal: RunnerShellTradersPipelineSignal,
): PlanMaterialization["candidates"] {
  const actionIds = new Set(signal.actionIds);
  return context.actionCandidates
    .filter(
      (candidate) =>
        actionIds.has(candidate.actionId) &&
        candidate.actionType === "trigger_ability" &&
        shellTradersCandidateMatchesExactBinding(context, candidate, signal) &&
        !context.actionDispositions?.some(
          (disposition) =>
            disposition.actionId === candidate.actionId &&
            disposition.disposition === "explicitly_nonproductive",
        ),
    )
    .map((candidate) => ({
      candidate,
      stepValue: signal.value,
    }));
}

function shellTradersCandidateMatchesExactBinding(
  context: PlanSchedulerContext,
  candidate: ActionSemanticCandidate,
  signal: RunnerShellTradersPipelineSignal,
): boolean {
  if (
    candidate.sourceCardInstanceId !== signal.sourceCardInstanceId ||
    (candidate.sourceDefinitionId !== undefined &&
      candidate.sourceDefinitionId !== signal.sourceDefinitionId)
  ) {
    return false;
  }
  const legalAction = context.input.legalActions.find(
    (action) => action.actionId === candidate.actionId,
  );
  const payloadTargetCardId = legalAction?.payload?.targetCardId;
  const payloadTargetDefinitionId =
    legalAction?.payload?.targetCardDefinitionId;
  if (typeof payloadTargetCardId === "string") {
    return (
      payloadTargetCardId === signal.targetCardInstanceId &&
      (typeof payloadTargetDefinitionId !== "string" ||
        payloadTargetDefinitionId === signal.targetDefinitionId)
    );
  }
  const exactTarget = candidate.targetContext?.selectedTargets.find(
    (target) => target.targetId === signal.targetCardInstanceId,
  );
  return (
    exactTarget !== undefined &&
    (exactTarget.targetDefinitionId === undefined ||
      exactTarget.targetDefinitionId === signal.targetDefinitionId)
  );
}

function bankCandidates(
  context: PlanSchedulerContext,
  signal: RunnerCreditBankSignal,
): PlanMaterialization["candidates"] {
  const actionIds = new Set(signal.actionIds);
  return context.actionCandidates
    .filter((candidate) => {
      if (!actionIds.has(candidate.actionId)) return false;
      if (signal.phase !== "build" && signal.phase !== "cash_out") return true;
      return (
        candidate.planOwnerBinding?.owner === "runner.credit_bank" &&
        candidate.planOwnerBinding.route === signal.phase
      );
    })
    .map((candidate) => ({
      candidate,
      stepValue:
        signal.value +
        (signal.phase === "cash_out"
          ? signal.estimatedPayout
          : signal.phase === "build"
            ? Math.max(0, 12 - signal.currentStoredCredits)
            : 1),
    }));
}

function installedAgendaScoreCandidates(
  context: PlanSchedulerContext,
  signal: RunnerInstalledAgendaScoreSignal,
): PlanMaterialization["candidates"] {
  const actionIds = new Set(signal.actionIds);
  return context.actionCandidates
    .filter((candidate) => actionIds.has(candidate.actionId))
    .map((candidate) => ({
      candidate,
      stepValue: (signal.terminal ? 2_000 : 1_000) + signal.agendaPoints * 100,
    }));
}

function resourceLifecycleCandidates(
  context: PlanSchedulerContext,
  signal: RunnerResourceLifecycleSignal,
): PlanMaterialization["candidates"] {
  const actionIds = new Set(signal.actionIds);
  return context.actionCandidates
    .filter(
      (candidate) =>
        actionIds.has(candidate.actionId) &&
        candidate.sourceKind === "card" &&
        candidate.sourceDefinitionId === signal.definitionId &&
        candidate.sourceCardInstanceId === signal.sourceCardInstanceId &&
        candidate.planOwnerBinding?.owner === "runner.resource_lifecycle",
    )
    .map((candidate) => ({
      candidate,
      stepValue: signal.value,
    }));
}

function recurringEconomyCandidates(
  context: PlanSchedulerContext,
  signal: RunnerRecurringEconomySignal,
): PlanMaterialization["candidates"] {
  const actionIds = new Set(signal.actionIds);
  return context.actionCandidates
    .filter((candidate) => actionIds.has(candidate.actionId))
    .map((candidate) => ({
      candidate,
      stepValue:
        signal.value +
        (signal.phase === "hold" && candidate.semanticActionType === "draw.card"
          ? 10
          : 0),
    }));
}

function coverageInstallCandidates(
  context: PlanSchedulerContext,
  gap: RunnerCoverageGapSignal,
  rolesForDefinitionId: (definitionId: string) => readonly string[],
): PlanMaterialization["candidates"] {
  return context.actionCandidates.flatMap((candidate) => {
    if (candidate.semanticActionType !== "install.card") return [];
    if (
      gap.installActionIds !== undefined &&
      !gap.installActionIds.includes(candidate.actionId)
    ) {
      return [];
    }
    if (
      context.actionDispositions?.some(
        (disposition) =>
          disposition.actionId === candidate.actionId &&
          disposition.disposition === "explicitly_nonproductive",
      )
    ) {
      return [];
    }
    const action = context.input.legalActions.find(
      (entry) => entry.actionId === candidate.actionId,
    );
    const optionalProgramTrashInstall =
      action?.payload?.runnerProgramTrashBeforeInstall === true ||
      candidate.actionId.endsWith(".runner_program_trash_before_install");
    const sourceCardInstanceId = runnerInstallSourceCardInstanceId(
      context,
      candidate,
    );
    if (
      optionalProgramTrashInstall &&
      context.actionCandidates.some((alternative) => {
        if (
          alternative.actionId === candidate.actionId ||
          alternative.semanticActionType !== "install.card" ||
          runnerInstallSourceCardInstanceId(context, alternative) !==
            sourceCardInstanceId
        ) {
          return false;
        }
        const alternativeAction = context.input.legalActions.find(
          (entry) => entry.actionId === alternative.actionId,
        );
        return (
          alternativeAction?.payload?.runnerProgramTrashBeforeInstall !==
            true &&
          !alternative.actionId.endsWith(".runner_program_trash_before_install")
        );
      })
    ) {
      return [];
    }
    const sourceDefinitionId = runnerInstallSourceDefinitionId(
      context,
      candidate,
    );
    if (!sourceDefinitionId) return [];
    const roles = rolesForDefinitionId(sourceDefinitionId);
    if (!runnerRolesCoverCoverageGap(roles, gap.requiredRole)) return [];
    return [
      {
        candidate,
        sourceRoles: [...new Set([...roles, gap.requiredRole])],
        stepValue: gap.installActionValues?.[candidate.actionId] ?? 100,
      },
    ];
  });
}

function runnerInstallSourceCardInstanceId(
  context: PlanSchedulerContext,
  candidate: ActionSemanticCandidate,
): string | undefined {
  if (candidate.sourceCardInstanceId) return candidate.sourceCardInstanceId;
  const action = context.input.legalActions.find(
    (entry) => entry.actionId === candidate.actionId,
  );
  const cardId = action?.payload?.cardId;
  if (typeof cardId === "string" && cardId.length > 0) return cardId;
  return typeof action?.source === "string" &&
    action.source.length > 0 &&
    action.source !== "basic_action"
    ? action.source
    : undefined;
}

function runnerInstallSourceDefinitionId(
  context: PlanSchedulerContext,
  candidate: ActionSemanticCandidate,
): string | undefined {
  if (candidate.sourceDefinitionId) return candidate.sourceDefinitionId;
  const sourceCardInstanceId = runnerInstallSourceCardInstanceId(
    context,
    candidate,
  );
  if (!sourceCardInstanceId) return undefined;
  return [
    ...context.input.playerView.own.gripOrHq,
    ...(context.input.playerView.specialZones?.setAside ?? []),
  ].find((card) => card.instanceId === sourceCardInstanceId)?.definitionId;
}

export function runnerCoverageRoleNeedles(
  requiredRole: RunnerCoverageGapSignal["requiredRole"],
): readonly string[] {
  switch (requiredRole) {
    case "breaker_wall":
      return ["breaker_wall", "breaker_fracter"];
    case "breaker_code_gate":
      return ["breaker_code_gate", "breaker_decoder"];
    case "breaker_sentry":
      return ["breaker_sentry", "breaker_killer"];
    case "breaker_ap":
      return ["breaker_ap"];
    case "breaker_trace":
      return ["breaker_trace"];
    case "breaker_universal":
      return ["breaker_universal"];
  }
  const exhaustiveRole: never = requiredRole;
  return exhaustiveRole;
}

export function runnerRolesCoverCoverageGap(
  roles: readonly string[],
  requiredRole: RunnerCoverageGapSignal["requiredRole"],
): boolean {
  return (
    rolesMatch(roles, runnerCoverageRoleNeedles(requiredRole)) ||
    rolesMatch(roles, ["universal_breaker", "breaker_universal"])
  );
}

function coverageDrawCandidates(
  context: PlanSchedulerContext,
  gap: RunnerCoverageGapSignal,
): PlanMaterialization["candidates"] {
  if (gap.answerInHand || !gap.deckHasAnswer) return [];
  const directSearchIds = new Set(gap.directSearchActionIds);
  const searchSetupIds = new Set(gap.searchEngineSetupActionIds);
  const drawForAnswerIds = new Set(gap.drawForAnswerActionIds);
  const drawAllowed = domain(context).defense.drawAllowed;
  return context.actionCandidates
    .filter((candidate) => {
      const isCoverageRoute =
        directSearchIds.has(candidate.actionId) ||
        searchSetupIds.has(candidate.actionId) ||
        drawForAnswerIds.has(candidate.actionId) ||
        (drawAllowed && candidate.semanticActionType === "draw.card");
      const isDrawRoute =
        drawForAnswerIds.has(candidate.actionId) ||
        (drawAllowed && candidate.semanticActionType === "draw.card");
      const displacedByGeneralHandDevelopment =
        context.actionDispositions?.some(
          (disposition) =>
            disposition.actionId === candidate.actionId &&
            disposition.disposition === "explicitly_nonproductive",
        ) ?? false;
      return (
        isCoverageRoute &&
        (!displacedByGeneralHandDevelopment ||
          (gap.deckHasAnswer && isDrawRoute))
      );
    })
    .map((candidate) => ({
      candidate,
      stepValue: directSearchIds.has(candidate.actionId)
        ? 100
        : searchSetupIds.has(candidate.actionId)
          ? 80
          : drawForAnswerIds.has(candidate.actionId)
            ? 60
            : 5,
    }));
}

function coverageFundingCandidates(
  context: PlanSchedulerContext,
  gap: RunnerCoverageGapSignal,
): PlanMaterialization["candidates"] {
  if (!gap.answerInHand || (gap.fundingGap ?? 0) <= 0) return [];
  const actionIds = new Set(gap.fundingActionIds);
  return context.actionCandidates
    .filter((candidate) => {
      const projection = candidate.economyProjection;
      return (
        !context.actionDispositions?.some(
          (disposition) =>
            disposition.actionId === candidate.actionId &&
            disposition.disposition === "explicitly_nonproductive",
        ) &&
        actionIds.has(candidate.actionId) &&
        projection?.kind === "immediate_liquid" &&
        projection.timing === "immediate" &&
        projection.creditRestriction === "general" &&
        typeof projection.netLiquidCreditGain === "number" &&
        Number.isFinite(projection.netLiquidCreditGain) &&
        projection.netLiquidCreditGain > 0
      );
    })
    .map((candidate) => ({
      candidate,
      stepValue:
        40 +
        Math.min(
          gap.fundingGap ?? 0,
          candidate.economyProjection!.netLiquidCreditGain!,
        ),
    }));
}

function defensePhase(
  context: PlanSchedulerContext,
  signals: RunnerDefenseSignals,
): DefenseState["phase"] | undefined {
  const openPhases: DefenseState["phase"][] = [];
  if (signals.discardChoiceBinding) openPhases.push("discard_window");
  if (signals.pendingDamage > 0 && signals.damagePreventionNeeded)
    openPhases.push("prevent_damage");
  if (signals.activeTags > 0) openPhases.push("clear_tags");
  if (signals.persistentHazardCounterRemovalAvailable)
    openPhases.push("clear_persistent_hazard_counter");
  if (
    (signals.handBufferActionIds?.length ?? 0) > 0 &&
    signals.handSize < signals.minimumHandBuffer
  )
    openPhases.push("build_hand_buffer");
  if (
    signals.reactionReserveNeed &&
    validRunnerDefenseFundingNeed(
      signals.reactionReserveNeed,
      context.input.playerView.stateVersion,
    )
  )
    openPhases.push("build_reaction_reserve");
  if (signals.forgoUnsafeRunCapacity) openPhases.push("forgo_unsafe_run");
  return (
    openPhases.find(
      (phase) => defenseCandidates(context, phase, signals).length > 0,
    ) ?? openPhases[0]
  );
}

function defenseCandidates(
  context: PlanSchedulerContext,
  phase: DefenseState["phase"],
  signals: RunnerDefenseSignals,
): PlanMaterialization["candidates"] {
  if (
    phase === "build_hand_buffer" &&
    (signals.handBufferActionIds?.length ?? 0) === 0
  ) {
    return [];
  }
  const reactionReserveActionIds = new Set(
    signals.reactionReserveNeed?.actionIds ?? [],
  );
  const handBufferActionIds = new Set(signals.handBufferActionIds ?? []);
  return context.actionCandidates
    .filter((candidate) => {
      if (phase === "discard_window")
        return signals.discardChoiceBinding?.actionId === candidate.actionId;
      if (phase === "forgo_unsafe_run")
        return (
          candidate.semanticActionType === "turn_flow.end_turn" &&
          candidate.sourceKind === "game_rule"
        );
      if (phase === "clear_tags")
        return candidate.semanticActionType === "tag.remove";
      if (phase === "clear_persistent_hazard_counter")
        return (
          candidate.semanticActionType === "counter.remove_trace_tag" ||
          candidate.semanticActionType === "counter.remove_runner_hazard"
        );
      if (phase === "prevent_damage")
        return (
          candidate.semanticActionType.startsWith("damage.prevent") ||
          runnerEffectsProvideDamagePrevention(candidate.functionalEffects)
        );
      if (phase === "build_reaction_reserve")
        return reactionReserveActionIds.has(candidate.actionId);
      return handBufferActionIds.has(candidate.actionId);
    })
    .map((candidate) => ({
      candidate,
      stepValue:
        phase === "prevent_damage"
          ? 100
          : phase === "clear_tags"
            ? 80
            : phase === "clear_persistent_hazard_counter"
              ? 90
              : phase === "build_reaction_reserve"
                ? 70
                : 20 +
                  Math.max(
                    1,
                    candidate.actionTacticSignals.includes("draw.card") ||
                      candidate.actionTacticSignals.includes("setup.draw")
                      ? 2
                      : 1,
                    candidate.economyProjection?.netHandDelta ??
                      candidate.economyProjection?.cardsDrawn ??
                      1,
                  ),
    }));
}

function defenseCapability(
  phase: DefenseState["phase"],
  candidates: PlanMaterialization["candidates"],
): PlanRouteStepCapability {
  if (phase === "discard_window")
    return {
      capabilityId: "resolve_plan_bound_runner_discard",
      semanticActionTypes: ["choice.resolve"],
    };
  if (phase === "clear_tags")
    return {
      capabilityId: "remove_active_tags",
      semanticActionTypes: ["tag.remove"],
    };
  if (phase === "clear_persistent_hazard_counter")
    return {
      capabilityId: "remove_persistent_runner_hazard_counter",
      semanticActionTypes: [
        "counter.remove_trace_tag",
        "counter.remove_runner_hazard",
      ],
    };
  if (phase === "prevent_damage")
    return {
      capabilityId: "prevent_pending_damage",
      semanticActionTypes: [
        "damage.prevent",
        "damage.prevent_net",
        "damage.prevent_meat",
      ],
    };
  if (phase === "forgo_unsafe_run")
    return {
      capabilityId: "forgo_unsafe_restricted_run_capacity",
      semanticActionTypes: ["turn_flow.end_turn"],
    };
  if (phase === "build_reaction_reserve")
    return {
      capabilityId: "build_damage_reaction_reserve",
      semanticActionTypes: [
        ...new Set(
          candidates.map((entry) => entry.candidate.semanticActionType),
        ),
      ],
    };
  return {
    capabilityId: "build_required_hand_buffer",
    semanticActionTypes: [
      ...new Set(candidates.map((entry) => entry.candidate.semanticActionType)),
    ],
  };
}

type PlanRouteStepCapability = PlanMaterialization["step"]["capability"];

function defensePhaseValue(
  phase: DefenseState["phase"],
  signals: RunnerDefenseSignals,
): number {
  if (phase === "discard_window") return 1_000;
  if (phase === "prevent_damage") return 100;
  if (phase === "clear_tags") return 80;
  if (phase === "clear_persistent_hazard_counter") return 90;
  if (phase === "forgo_unsafe_run") return 60;
  if (phase === "build_reaction_reserve") return 70;
  return 20 + Math.max(0, signals.minimumHandBuffer - signals.handSize) * 120;
}

function defensePriorityClass(
  signals: RunnerDefenseSignals,
): "P2" | "P3" | "P4" | "P5" {
  if (signals.discardChoiceBinding) return "P2";
  if (
    signals.pendingDamage > 0 ||
    (signals.activeTags > 0 && signals.visibleTagPunish) ||
    signals.persistentHazardCounterRemovalAvailable
  ) {
    return "P2";
  }
  if (signals.reactionReserveNeed) return "P3";
  return signals.handBufferPriorityClass;
}

function validRunnerDefenseFundingNeed(
  need: NonNullable<RunnerDefenseSignals["reactionReserveNeed"]>,
  stateVersion: number,
): boolean {
  return (
    need.needId === "runner-defense-reaction-reserve" &&
    need.parentPlanInstanceId === "plan:runner.defense_and_recovery:runner" &&
    Number.isFinite(need.targetCredits) &&
    Number.isFinite(need.currentCreditsAtRevalidation) &&
    Number.isFinite(need.gap) &&
    need.targetCredits >= 0 &&
    need.currentCreditsAtRevalidation >= 0 &&
    need.gap > 0 &&
    need.gap ===
      Math.max(0, need.targetCredits - need.currentCreditsAtRevalidation) &&
    need.actionIds.length > 0 &&
    need.revalidation.stateVersion === stateVersion &&
    need.revalidation.status === "defense_parent_open"
  );
}

function moduleStatePhase(moduleState: unknown): string {
  const value = moduleState as Partial<
    | EconomyState
    | CoverageState
    | DefenseState
    | CreditBankState
    | RecurringEconomyState
    | InstalledAgendaScoreState
  >;
  if ("phase" in value && typeof value.phase === "string") return value.phase;
  return value.kind ?? "execute";
}

function state<T>(instance: PlanInstance): T {
  return instance.moduleState as T;
}

function domain(context: PlanSchedulerContext): RunnerCorePlanDomain {
  const value = context.domain as RunnerCorePlanDomain | undefined;
  if (!value) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map((action) => action.type),
      owner: "plan_module",
      removalCondition:
        "Build the Runner core domain signals before discovering Runner plans.",
    });
  }
  return value;
}
