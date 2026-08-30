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
  PlanActionDisposition,
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
import type {
  RunnerHandDevelopmentCurrentNeed,
  RunnerHandDevelopmentRole,
  RunnerHandDevelopmentStrategicFit,
} from "../runner/hand-development/runner-hand-development-types";

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

export type RunnerDevelopmentFundingMilestone = {
  kind: "bounded_development_credit_milestone";
  targetCredits: number;
  observedCredits: number;
  remainingGap: number;
  priorityClass: "P4";
  hardness: "soft";
  deadline: "within_three_own_turns";
  maximumOwnTurns: 3;
  releaseCondition: "parent_invalidated_or_material_value_lost_or_urgent_preemption";
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
      developmentFundingMilestone?: RunnerDevelopmentFundingMilestone;
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
  needKind?:
    | "missing_coverage"
    | "cost_ineffective_coverage"
    | "coverage_upgrade";
  requiredRole:
    | "breaker_wall"
    | "breaker_code_gate"
    | "breaker_sentry"
    | "breaker_ap"
    | "breaker_trace"
    | "breaker_universal";
  targetServerId?: string;
  targetRunActionId?: string;
  requesterModuleId?: "runner.pressure_central" | "runner.contest_remote";
  requesterPlanInstanceId?: string;
  requesterNeedId?: string;
  priorityClass: "P2" | "P4" | "P5";
  evidenceCode: string;
  deckHasAnswer: boolean;
  answerInHand: boolean;
  answerInstallCost?: number;
  installActionIds?: string[];
  installActionValues?: Record<string, number>;
  preparationActionIds?: string[];
  memorySupportActionIds?: string[];
  fundingGap?: number;
  sameTurnRunConversion?: {
    targetRunActionId: string;
    requiredCredits: number;
    requiredClicksAfterFunding: number;
    projectedKnownPathCost: number;
    postRunCreditFloor: number;
    installProjection:
      | "current_legal_action"
      | "card_spec_requires_rematerialization";
  };
  currentKnownPathCost?: number;
  currentPathFundingGap?: number;
  recoveryMode?:
    | "install_visible_answer"
    | "search_known_alternative"
    | "draw_for_known_role"
    | "install_visible_upgrade"
    | "search_known_upgrade";
  recoveryEvidenceCodes?: string[];
  upgradeQuote?: {
    schemaVersion: "runner-breaker-upgrade-economic-quote-v2";
    targetDefinitionId: string;
    currentKnownPathCost: number;
    projectedKnownPathCost: number;
    savingsPerRun: number;
    plannedRunHorizon: number;
    grossRunSavings: number;
    upfrontCreditCost: number;
    totalInvestment: number;
    netValueBeforeSafetyMargin: number;
    requiredNetSafetyMargin: number;
    projectedLiquidCreditsAfterUpgradeAndRun: number;
    desiredCreditReserve: number;
    memoryAvailable: number;
    memorySupportAdditionalMu: number;
    memorySupportCreditCost: number;
    memorySupportActionClicks: number;
    projectedMemoryAvailable: number;
    candidateMemoryCost: number;
  };
  fundingActionIds: string[];
  directSearchActionIds: string[];
  directSearchChoiceBindings?: Array<{
    actionId: string;
    sourceCardInstanceId: string;
    sourceDefinitionId: string;
    targetCardInstanceId?: string;
    targetDefinitionId?: string;
    installMemorySacrificeBinding?: {
      targetCardInstanceId: string;
      targetMemoryCost?: number;
      requiredMemoryToFree: number;
      selectedCards: Array<{
        cardInstanceId: string;
        memoryCost: number;
      }>;
    };
  }>;
  programInstallMemoryRejectedActionIds?: string[];
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
  confirmedDamageTaxedDrawActionIds?: string[];
  forgoUnsafeRunCapacity: boolean;
  forgoExhaustedStandardCapacity?: boolean;
  forgoTerminalDeckPressureCapacity?: boolean;
  discardChoiceBinding?: RunnerDiscardChoiceBinding;
  tagClearFundingNeed?: {
    needId: "runner-defense-tag-clear-funding";
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
  defenseSupportInstallActionIds?: string[];
  defenseSupportRejectedInstallActionIds?: string[];
  defenseSupportInstallValues?: Record<string, number>;
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
  commitmentActive: boolean;
  phase: "install" | "hold";
  actionIds: string[];
  priorityClass: "P3" | "P4" | "P5";
  value: number;
  evidenceCodes: string[];
  investmentHorizon: Readonly<{
    installCost: number;
    earliestPayout: "start_of_runner_turn";
    projectedHoldTurns: number;
    invalidatingActionType: "start_run";
    realizedPayoutCount: number;
    realizedValue: number;
    futureValueAtRisk: number;
    bestVisibleRunPayoff: number;
    decision: "install" | "wait" | "allow_run" | "preempt_for_urgent_run";
  }>;
};

export type RunnerInstalledCardLiquidationChoiceSignal = {
  conversionId: string;
  sourceResourceInstanceId: string;
  sourceResourceDefinitionId: string;
  actionId: string;
  choiceId: string;
  sourceStateVersion: number;
  selectedOptionId: string;
  selectedCardInstanceId?: string;
  disposition:
    | "liquidate_proven_expendable"
    | "decline_nonpositive_conversion"
    | "decline_unproven_expendability";
  quote: Readonly<{
    gainCredits: number;
    retainedCardValue: number;
    netLiquidationValue: number;
    expendability: "proven_redundant" | "unproven";
  }>;
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
    /^runner\.installed_resource_trash_for_credits:([^:]+):([0-9]+):([0-9]+)$/.exec(
      choice.source,
    );
  const sourceResourceInstanceId = sourceMatch?.[1];
  const gainCredits = Number(sourceMatch?.[2]);
  const sourceStateVersion = Number(sourceMatch?.[3]);
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
    !Number.isInteger(gainCredits) ||
    gainCredits <= 0 ||
    sourceStateVersion !== input.playerView.stateVersion ||
    !action ||
    !candidate ||
    !exactActionBinding ||
    !exactOptionMatrix ||
    eligibleCards.length === 0
  ) {
    return undefined;
  }
  const quotedTargets = eligibleCards
    .map((card) => {
      const retainedCardValue = installedCardRetentionValue(input, card);
      const expendability = installedCardLiquidationExpendability(input, card);
      return {
        card,
        optionId: `card_${card.instanceId}`,
        retainedCardValue,
        netLiquidationValue: gainCredits - retainedCardValue,
        expendability,
      };
    })
    .sort(
      (left, right) =>
        right.netLiquidationValue - left.netLiquidationValue ||
        left.retainedCardValue - right.retainedCardValue ||
        left.card.instanceId.localeCompare(right.card.instanceId),
    );
  const selectedTarget = quotedTargets.find(
    (target) =>
      target.expendability === "proven_redundant" &&
      target.netLiquidationValue > 0,
  );
  const bestQuotedTarget = selectedTarget ?? quotedTargets[0]!;
  const quote = selectedTarget
    ? {
        gainCredits,
        retainedCardValue: selectedTarget.retainedCardValue,
        netLiquidationValue: selectedTarget.netLiquidationValue,
        expendability: selectedTarget.expendability,
      }
    : {
        gainCredits,
        retainedCardValue: bestQuotedTarget.retainedCardValue,
        netLiquidationValue: bestQuotedTarget.netLiquidationValue,
        expendability: bestQuotedTarget.expendability,
      };
  return {
    conversionId: `installed-card-liquidation:${choice.choiceId}`,
    sourceResourceInstanceId,
    sourceResourceDefinitionId: sourceResource.definitionId,
    actionId: action.actionId,
    choiceId: choice.choiceId,
    sourceStateVersion,
    selectedOptionId: selectedTarget?.optionId ?? "pass",
    ...(selectedTarget
      ? { selectedCardInstanceId: selectedTarget.card.instanceId }
      : {}),
    disposition: selectedTarget
      ? "liquidate_proven_expendable"
      : quote.netLiquidationValue <= 0
        ? "decline_nonpositive_conversion"
        : "decline_unproven_expendability",
    quote,
    priorityClass: "P4",
    value: 1_000,
    evidenceCodes: [
      "runner_installed_card_liquidation_choice_owned_by_economy",
      selectedTarget
        ? `runner_installed_card_liquidation_proven_redundant:${selectedTarget.card.instanceId}:${selectedTarget.netLiquidationValue}`
        : quote.netLiquidationValue <= 0
          ? "runner_installed_card_liquidation_declined_nonpositive_value"
          : `runner_installed_card_liquidation_declined_unproven_expendability:${bestQuotedTarget.card.instanceId}`,
    ],
  };
}

function installedCardLiquidationExpendability(
  input: AiDecisionInput,
  card: VisibleCard,
): "proven_redundant" | "unproven" {
  if (!card.known || !card.definitionId) return "unproven";
  const rig = input.playerView.own.rig ?? [];
  const duplicateCount = rig.filter(
    (candidate) => candidate.definitionId === card.definitionId,
  ).length;
  const strategyProfile = (
    input as AiDecisionInput & {
      ownDeckStrategyProfile?: AiDeckStrategyProfile;
    }
  ).ownDeckStrategyProfile;
  const doctrineProvider =
    strategyProfile?.runnerEngineDoctrine?.providers.find(
      (provider) => provider.cardId === card.definitionId,
    );
  const roles = rolesForDeckDoctrineCard(card.definitionId);
  const hostedCardCount = rig.filter(
    (candidate) => candidate.hostedOn === card.instanceId,
  ).length;
  const counterCount = Object.values(card.counters ?? {}).reduce(
    (sum, count) => sum + Math.max(0, count ?? 0),
    0,
  );
  const structurallyActive =
    rolesMatch(roles, [
      "breaker",
      "coverage",
      "damage_prevention",
      "survive_meat_damage",
      "tag_prevention",
      "tag_clear",
      "economy",
      "draw",
      "search",
      "link",
      "trace",
      "access",
      "run",
      "engine",
      "build_rig",
      "delayed_install",
      "resource_value_engine",
      "credit_bank",
    ]) ||
    (card.memoryLimitBonus ?? 0) > 0 ||
    (card.maxHandSizeBonus ?? 0) > 0 ||
    (card.baseLink ?? 0) > 0 ||
    hostedCardCount > 0 ||
    counterCount > 0 ||
    (card.lifecycleMarkers?.length ?? 0) > 0;
  return duplicateCount > 1 &&
    doctrineProvider?.additivity === "redundant_by_default" &&
    !structurallyActive
    ? "proven_redundant"
    : "unproven";
}

function installedCardRetentionValue(
  input: AiDecisionInput,
  card: VisibleCard,
): number {
  if (!card.known || !card.definitionId) return Number.MAX_SAFE_INTEGER;
  const rig = input.playerView.own.rig ?? [];
  const roles = rolesForDeckDoctrineCard(card.definitionId);
  const duplicateCount = rig.filter(
    (candidate) => candidate.definitionId === card.definitionId,
  ).length;
  const hostedCardCount = rig.filter(
    (candidate) => candidate.hostedOn === card.instanceId,
  ).length;
  const counterCount = Object.values(card.counters ?? {}).reduce(
    (sum, count) => sum + Math.max(0, count ?? 0),
    0,
  );
  const memoryWouldOverflow =
    (card.memoryLimitBonus ?? 0) > 0 &&
    (input.playerView.own.memoryUsed ?? 0) >
      Math.max(
        0,
        (input.playerView.own.memoryLimit ?? 0) - (card.memoryLimitBonus ?? 0),
      );
  const criticalRigRole = rolesMatch(roles, [
    "breaker",
    "coverage",
    "damage_prevention",
    "survive_meat_damage",
    "tag_prevention",
    "tag_clear",
  ]);
  const activeEngineRole = rolesMatch(roles, [
    "economy",
    "draw",
    "search",
    "link",
    "trace",
    "access",
    "run",
    "engine",
    "build_rig",
    "delayed_install",
    "resource_value_engine",
    "credit_bank",
  ]);
  return Math.max(
    0,
    1 +
      Math.max(0, card.installCost ?? card.cost ?? 0) +
      (duplicateCount > 1 ? -1 : 0) +
      (criticalRigRole ? 20 : 0) +
      (activeEngineRole ? 5 : 0) +
      ((card.memoryLimitBonus ?? 0) > 0 ? 8 : 0) +
      ((card.maxHandSizeBonus ?? 0) > 0 ? 8 : 0) +
      ((card.baseLink ?? 0) > 0 ? 5 : 0) +
      (memoryWouldOverflow ? 30 : 0) +
      hostedCardCount * 10 +
      counterCount * 2 +
      (card.lifecycleMarkers?.length ?? 0) * 4,
  );
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
    | "prepare_coverage"
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
    | "fund_tag_clear"
    | "clear_persistent_hazard_counter"
    | "prevent_damage"
    | "install_defense_support"
    | "build_hand_buffer"
    | "build_reaction_reserve"
    | "discard_window"
    | "forgo_unsafe_run"
    | "forgo_exhausted_options"
    | "forgo_terminal_deck_pressure";
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
        signal.prospectivePlan?.build.kind === "activated" &&
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

export function runnerDevelopmentFundingMilestone(params: {
  targetCredits: number;
  currentCredits: number;
  normalizedDevelopmentValue: number;
  strategicFit: RunnerHandDevelopmentStrategicFit;
  currentNeed: RunnerHandDevelopmentCurrentNeed;
  developmentRole: RunnerHandDevelopmentRole;
  duplicateAlreadyInstalled: boolean;
  assignedDomainPlanIds: readonly string[];
}): RunnerDevelopmentFundingMilestone | undefined {
  if (
    !Number.isSafeInteger(params.targetCredits) ||
    !Number.isSafeInteger(params.currentCredits) ||
    !Number.isFinite(params.normalizedDevelopmentValue) ||
    params.targetCredits < 0 ||
    params.currentCredits < 0 ||
    params.duplicateAlreadyInstalled ||
    params.assignedDomainPlanIds.length > 0 ||
    params.developmentRole === "unknown" ||
    params.developmentRole === "run_event" ||
    params.developmentRole === "duplicate_or_low_value" ||
    params.strategicFit === "weak" ||
    params.strategicFit === "blocked" ||
    params.currentNeed === "later" ||
    params.currentNeed === "none"
  ) {
    return undefined;
  }
  const remainingGap = Math.max(
    0,
    params.targetCredits - params.currentCredits,
  );
  const maximumBoundedGap = 8;
  const minimumMaterialValue = 40 + remainingGap * 4;
  if (
    remainingGap <= 0 ||
    remainingGap > maximumBoundedGap ||
    params.normalizedDevelopmentValue < minimumMaterialValue
  ) {
    return undefined;
  }
  return {
    kind: "bounded_development_credit_milestone",
    targetCredits: params.targetCredits,
    observedCredits: params.currentCredits,
    remainingGap,
    priorityClass: "P4",
    hardness: "soft",
    deadline: "within_three_own_turns",
    maximumOwnTurns: 3,
    releaseCondition:
      "parent_invalidated_or_material_value_lost_or_urgent_preemption",
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
      const parentMaterialValue =
        need.kind === "parent_plan_support"
          ? portfolio.instances
              .map((candidate) =>
                runnerFundingParentMaterialValue(candidate, need),
              )
              .find((value): value is number => value !== undefined)
          : undefined;
      const parentIsResidentAndMaterial =
        need.kind === "portfolio_reserve" ||
        need.kind === "develop_liquidity" ||
        parentMaterialValue !== undefined;
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
        need.kind === "develop_liquidity"
          ? -9_999
          : (parentMaterialValue ?? need.gap * 10),
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
    materialize: (instance, currentAssessment, context) => {
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
      const candidates = economyCandidates(context, need).map((entry) =>
        need.kind === "parent_plan_support"
          ? {
              ...entry,
              stepValue: Math.max(
                entry.stepValue,
                currentAssessment.withinClassValue,
              ),
            }
          : entry,
      );
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
        const preparations = coveragePreparationCandidates(context, gap);
        const installs = coverageInstallCandidates(
          context,
          gap,
          rolesForDefinitionId,
        );
        const draws = coverageDrawCandidates(context, gap);
        const funding = coverageFundingCandidates(context, gap);
        const sameTurnConversionNeedsFunding =
          gap.sameTurnRunConversion !== undefined && (gap.fundingGap ?? 0) > 0;
        const phase = sameTurnConversionNeedsFunding
          ? "fund_answer"
          : preparations.length > 0
            ? "prepare_coverage"
            : installs.length > 0
              ? "install_answer"
              : gap.answerInHand && (gap.fundingGap ?? 0) > 0
                ? "fund_answer"
                : gap.directSearchActionIds.length > 0
                  ? "search_answer"
                  : gap.searchEngineSetupActionIds.length > 0
                    ? "setup_search_engine"
                    : "draw_for_answer";
        const routeExists =
          preparations.length > 0 ||
          installs.length > 0 ||
          (phase === "fund_answer" && funding.length > 0) ||
          (!gap.answerInHand && draws.length > 0);
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
          ...(gap.requesterPlanInstanceId && gap.requesterNeedId
            ? {
                parentInstanceId: gap.requesterPlanInstanceId,
                parentNeedId: gap.requesterNeedId,
              }
            : {}),
        });
      }),
    assess: (instance, context, portfolio) => {
      const current = state<CoverageState>(instance);
      const candidates =
        current.phase === "prepare_coverage"
          ? coveragePreparationCandidates(context, current.gap)
          : current.phase === "install_answer"
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
        current.phase === "prepare_coverage"
          ? 130
          : current.phase === "install_answer"
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
      if (current.phase === "prepare_coverage") {
        const candidates = coveragePreparationCandidates(context, current.gap);
        return {
          step: {
            stepId: `${instance.instanceId}:prepare:${current.gap.requiredRole}`,
            capability: {
              capabilityId: `prepare_${current.gap.requiredRole}`,
              semanticActionTypes: [
                ...new Set(
                  candidates.map((entry) => entry.candidate.semanticActionType),
                ),
              ],
              legalActionTypes: [
                ...new Set(
                  candidates.map((entry) => entry.candidate.actionType),
                ),
              ],
            },
            purpose: `Prepare the exact installed answer for ${current.gap.requiredRole}.`,
          },
          candidates,
        };
      }
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
        const candidates = coverageFundingCandidates(context, current.gap);
        return {
          step: {
            stepId: `${instance.instanceId}:fund:${current.gap.requiredRole}`,
            capability: {
              capabilityId: `fund_install_${current.gap.requiredRole}`,
              semanticActionTypes: [
                ...new Set(
                  candidates.map((entry) => entry.candidate.semanticActionType),
                ),
              ],
            },
            purpose: `Fund the visible in-hand answer for ${current.gap.requiredRole}.`,
          },
          candidates,
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
      const invalidTagClearFundingContract =
        signals.tagClearFundingNeed !== undefined &&
        !validRunnerTagClearFundingNeed(
          signals.tagClearFundingNeed,
          context.input.playerView.stateVersion,
        );
      const invalidReactionReserveContract =
        signals.reactionReserveNeed !== undefined &&
        !validRunnerDefenseFundingNeed(
          signals.reactionReserveNeed,
          context.input.playerView.stateVersion,
        );
      const phase = invalidTagClearFundingContract
        ? "fund_tag_clear"
        : invalidReactionReserveContract
          ? "build_reaction_reserve"
          : defensePhase(
              context.actionCandidates,
              context.input.playerView.stateVersion,
              signals,
              context.actionDispositions,
            );
      if (!phase) return [];
      const candidates =
        invalidTagClearFundingContract || invalidReactionReserveContract
          ? []
          : defenseCandidates(
              context.actionCandidates,
              phase,
              signals,
              context.actionDispositions,
            );
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
          blockerCode: invalidTagClearFundingContract
            ? "invalid_tag_clear_funding_need"
            : invalidReactionReserveContract
              ? "invalid_reaction_reserve_need"
              : `no_${phase}_route`,
          evidenceCode: signals.evidenceCodes[0] ?? phase,
        }),
      ];
    },
    assess: (instance, context, portfolio) => {
      const current = state<DefenseState>(instance);
      const tagClearFundingContractValid =
        current.phase !== "fund_tag_clear" ||
        (current.signals.tagClearFundingNeed !== undefined &&
          validRunnerTagClearFundingNeed(
            current.signals.tagClearFundingNeed,
            context.input.playerView.stateVersion,
          ));
      const reactionReserveContractValid =
        current.phase !== "build_reaction_reserve" ||
        (current.signals.reactionReserveNeed !== undefined &&
          validRunnerDefenseFundingNeed(
            current.signals.reactionReserveNeed,
            context.input.playerView.stateVersion,
          ));
      const candidates =
        tagClearFundingContractValid && reactionReserveContractValid
          ? defenseCandidates(
              context.actionCandidates,
              current.phase,
              current.signals,
              context.actionDispositions,
            )
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
        context.actionCandidates,
        current.phase,
        current.signals,
        context.actionDispositions,
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
          : current.phase === "forgo_exhausted_options"
            ? {
                earlyEndTurnJustification: {
                  kind: "forgo_exhausted_runner_capacity" as const,
                  capacityKind:
                    "empty_stack_all_voluntary_routes_rejected" as const,
                  explicitlyNonproductiveActionIds: context.actionCandidates
                    .filter(
                      (candidate) =>
                        candidate.semanticActionType !== "turn_flow.end_turn",
                    )
                    .map((candidate) => candidate.actionId),
                },
              }
            : current.phase === "forgo_terminal_deck_pressure"
              ? {
                  earlyEndTurnJustification: {
                    kind: "forgo_terminal_deck_pressure_capacity" as const,
                    capacityKind:
                      "match_point_favorable_deck_race_all_voluntary_routes_rejected" as const,
                    explicitlyNonproductiveActionIds: context.actionCandidates
                      .filter(
                        (candidate) =>
                          candidate.semanticActionType !== "turn_flow.end_turn",
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
        !context.actionDispositions?.some(
          (entry) => entry.actionId === candidate.actionId,
        ) &&
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
  if (need.driver.kind === "development") {
    const milestone = need.developmentFundingMilestone;
    if (
      milestone?.kind !== "bounded_development_credit_milestone" ||
      milestone.targetCredits !== need.targetCredits ||
      milestone.observedCredits !== need.currentCreditsAtRevalidation ||
      milestone.remainingGap !== need.gap ||
      milestone.priorityClass !== "P4" ||
      milestone.hardness !== "soft" ||
      milestone.deadline !== "within_three_own_turns" ||
      milestone.maximumOwnTurns !== 3 ||
      milestone.releaseCondition !==
        "parent_invalidated_or_material_value_lost_or_urgent_preemption"
    ) {
      return false;
    }
  } else if (need.developmentFundingMilestone !== undefined) {
    return false;
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

function runnerFundingParentMaterialValue(
  candidate: PlanInstance,
  need: Extract<RunnerFundingNeedSignal, { kind: "parent_plan_support" }>,
): number | undefined {
  if (
    candidate.instanceId !== need.parentPlanInstanceId ||
    (candidate.viability !== "ready" && candidate.viability !== "blocked")
  ) {
    return undefined;
  }
  const moduleState = candidate.moduleState as
    | {
        signal?: {
          supportNeedId?: unknown;
          marginalValue?: unknown;
          value?: unknown;
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
  if (
    !waitsOnlyForThisFunding ||
    moduleState?.signal?.supportNeedId !== need.needId
  ) {
    return undefined;
  }
  if (
    typeof moduleState.signal.marginalValue === "number" &&
    moduleState.signal.marginalValue > 0
  ) {
    return moduleState.signal.marginalValue;
  }
  return typeof moduleState.signal.value === "number" &&
    moduleState.signal.value > 0
    ? moduleState.signal.value
    : undefined;
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
    .filter(
      (candidate) =>
        actionIds.has(candidate.actionId) &&
        !context.actionDispositions?.some(
          (disposition) => disposition.actionId === candidate.actionId,
        ),
    )
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

function coveragePreparationCandidates(
  context: PlanSchedulerContext,
  gap: RunnerCoverageGapSignal,
): PlanMaterialization["candidates"] {
  const actionIds = new Set(gap.preparationActionIds ?? []);
  const memorySupportActionIds = new Set(gap.memorySupportActionIds ?? []);
  return context.actionCandidates
    .filter((candidate) => {
      if (!actionIds.has(candidate.actionId)) return false;
      const action = context.input.legalActions.find(
        (entry) => entry.actionId === candidate.actionId,
      );
      const exactMemorySupportInstall =
        memorySupportActionIds.has(candidate.actionId) &&
        action?.side === "runner" &&
        action.type === "install_card" &&
        action.timingPoint === context.input.playerView.timingPoint &&
        action.expiresAtStateVersion === context.input.playerView.stateVersion;
      return (
        exactMemorySupportInstall ||
        (action?.side === "runner" &&
          action.type === "trigger_ability" &&
          action.timingPoint === context.input.playerView.timingPoint &&
          action.expiresAtStateVersion ===
            context.input.playerView.stateVersion &&
          action.payload?.runnerAbility === "change_icebreaker_subtype" &&
          typeof action.payload.selectedSubtype === "string")
      );
    })
    .map((candidate) => ({
      candidate,
      stepValue: memorySupportActionIds.has(candidate.actionId) ? 120 : 130,
    }));
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
  if (gap.answerInHand) return [];
  const directSearchIds = new Set(gap.directSearchActionIds);
  const searchSetupIds = new Set(gap.searchEngineSetupActionIds);
  const drawForAnswerIds = new Set(gap.drawForAnswerActionIds);
  return context.actionCandidates
    .filter((candidate) => {
      const isCoverageRoute =
        directSearchIds.has(candidate.actionId) ||
        searchSetupIds.has(candidate.actionId) ||
        drawForAnswerIds.has(candidate.actionId);
      const isDrawRoute = drawForAnswerIds.has(candidate.actionId);
      const displacedByGeneralHandDevelopment =
        context.actionDispositions?.some(
          (disposition) =>
            disposition.actionId === candidate.actionId &&
            disposition.disposition === "explicitly_nonproductive",
        ) ?? false;
      return (
        isCoverageRoute &&
        (directSearchIds.has(candidate.actionId) || gap.deckHasAnswer) &&
        (!displacedByGeneralHandDevelopment ||
          directSearchIds.has(candidate.actionId) ||
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
            ? 60 +
              Math.min(
                4,
                Math.max(
                  0,
                  (candidate.semanticActionType === "draw.card"
                    ? 1
                    : (candidate.economyProjection?.cardsDrawn ?? 1)) - 1,
                ),
              ) *
                5
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
  actionCandidates: readonly ActionSemanticCandidate[],
  stateVersion: number,
  signals: RunnerDefenseSignals,
  actionDispositions?: readonly PlanActionDisposition[],
): DefenseState["phase"] | undefined {
  const openPhases: DefenseState["phase"][] = [];
  if (signals.discardChoiceBinding) openPhases.push("discard_window");
  if (signals.pendingDamage > 0 && signals.damagePreventionNeeded)
    openPhases.push("prevent_damage");
  if ((signals.defenseSupportInstallActionIds?.length ?? 0) > 0)
    openPhases.push("install_defense_support");
  if (signals.activeTags > 0) openPhases.push("clear_tags");
  if (
    signals.tagClearFundingNeed &&
    validRunnerTagClearFundingNeed(signals.tagClearFundingNeed, stateVersion)
  )
    openPhases.push("fund_tag_clear");
  if (signals.persistentHazardCounterRemovalAvailable)
    openPhases.push("clear_persistent_hazard_counter");
  if (
    (signals.handBufferActionIds?.length ?? 0) > 0 &&
    signals.handSize < signals.minimumHandBuffer
  )
    openPhases.push("build_hand_buffer");
  if (
    signals.reactionReserveNeed &&
    validRunnerDefenseFundingNeed(signals.reactionReserveNeed, stateVersion)
  )
    openPhases.push("build_reaction_reserve");
  if (signals.forgoUnsafeRunCapacity) openPhases.push("forgo_unsafe_run");
  if (signals.forgoTerminalDeckPressureCapacity)
    openPhases.push("forgo_terminal_deck_pressure");
  if (signals.forgoExhaustedStandardCapacity)
    openPhases.push("forgo_exhausted_options");
  return (
    openPhases.find(
      (phase) =>
        defenseCandidates(actionCandidates, phase, signals, actionDispositions)
          .length > 0,
    ) ?? openPhases[0]
  );
}

function defenseCandidates(
  actionCandidates: readonly ActionSemanticCandidate[],
  phase: DefenseState["phase"],
  signals: RunnerDefenseSignals,
  actionDispositions?: readonly PlanActionDisposition[],
): PlanMaterialization["candidates"] {
  if (
    phase === "build_hand_buffer" &&
    (signals.handBufferActionIds?.length ?? 0) === 0
  ) {
    return [];
  }
  if (
    phase === "forgo_exhausted_options" ||
    phase === "forgo_terminal_deck_pressure"
  ) {
    const voluntaryCandidates = actionCandidates.filter(
      (candidate) => candidate.semanticActionType !== "turn_flow.end_turn",
    );
    if (
      voluntaryCandidates.length === 0 ||
      !voluntaryCandidates.every((candidate) =>
        (actionDispositions ?? []).some(
          (entry) =>
            entry.actionId === candidate.actionId &&
            entry.disposition === "explicitly_nonproductive",
        ),
      )
    ) {
      return [];
    }
  }
  const reactionReserveActionIds = new Set(
    signals.reactionReserveNeed?.actionIds ?? [],
  );
  const tagClearFundingActionIds = new Set(
    signals.tagClearFundingNeed?.actionIds ?? [],
  );
  const handBufferActionIds = new Set(signals.handBufferActionIds ?? []);
  const defenseSupportInstallActionIds = new Set(
    signals.defenseSupportInstallActionIds ?? [],
  );
  return actionCandidates
    .filter((candidate) => {
      if (
        (phase === "fund_tag_clear" || phase === "build_reaction_reserve") &&
        (actionDispositions ?? []).some(
          (entry) => entry.actionId === candidate.actionId,
        )
      ) {
        return false;
      }
      if (phase === "discard_window")
        return signals.discardChoiceBinding?.actionId === candidate.actionId;
      if (
        phase === "forgo_unsafe_run" ||
        phase === "forgo_exhausted_options" ||
        phase === "forgo_terminal_deck_pressure"
      )
        return (
          candidate.semanticActionType === "turn_flow.end_turn" &&
          candidate.sourceKind === "game_rule"
        );
      if (phase === "clear_tags")
        return candidate.semanticActionType === "tag.remove";
      if (phase === "fund_tag_clear")
        return tagClearFundingActionIds.has(candidate.actionId);
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
      if (phase === "install_defense_support")
        return defenseSupportInstallActionIds.has(candidate.actionId);
      if (phase === "build_reaction_reserve")
        return reactionReserveActionIds.has(candidate.actionId);
      return handBufferActionIds.has(candidate.actionId);
    })
    .map((candidate) => ({
      candidate,
      stepValue:
        phase === "prevent_damage"
          ? 100
          : phase === "install_defense_support"
            ? (signals.defenseSupportInstallValues?.[candidate.actionId] ?? 50)
            : phase === "clear_tags"
              ? 80
              : phase === "fund_tag_clear"
                ? 85
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

export function runnerDefenseReactionReserveIsCurrentPhase(params: {
  actionCandidates: readonly ActionSemanticCandidate[];
  stateVersion: number;
  signals: RunnerDefenseSignals;
}): boolean {
  return (
    defensePhase(
      params.actionCandidates,
      params.stateVersion,
      params.signals,
    ) === "build_reaction_reserve"
  );
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
  if (phase === "fund_tag_clear")
    return {
      capabilityId: "fund_active_tag_removal",
      semanticActionTypes: [
        ...new Set(
          candidates.map((entry) => entry.candidate.semanticActionType),
        ),
      ],
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
  if (phase === "install_defense_support")
    return {
      capabilityId: "install_defense_support",
      semanticActionTypes: ["install.card"],
      legalActionTypes: ["install_card"],
    };
  if (phase === "forgo_unsafe_run")
    return {
      capabilityId: "forgo_unsafe_restricted_run_capacity",
      semanticActionTypes: ["turn_flow.end_turn"],
    };
  if (phase === "forgo_exhausted_options")
    return {
      capabilityId: "forgo_rejected_option_capacity",
      semanticActionTypes: ["turn_flow.end_turn"],
    };
  if (phase === "forgo_terminal_deck_pressure")
    return {
      capabilityId: "forgo_match_point_deck_pressure_capacity",
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
  if (phase === "install_defense_support") return 60;
  if (phase === "clear_tags") return 80;
  if (phase === "fund_tag_clear") return 85;
  if (phase === "clear_persistent_hazard_counter") return 90;
  if (phase === "forgo_unsafe_run") return 60;
  if (phase === "forgo_exhausted_options") return 10;
  if (phase === "forgo_terminal_deck_pressure") return 10;
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
  if ((signals.defenseSupportInstallActionIds?.length ?? 0) > 0) return "P4";
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

function validRunnerTagClearFundingNeed(
  need: NonNullable<RunnerDefenseSignals["tagClearFundingNeed"]>,
  stateVersion: number,
): boolean {
  return (
    need.needId === "runner-defense-tag-clear-funding" &&
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
