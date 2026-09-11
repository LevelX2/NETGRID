import { createRunnerDefenseModule } from "../runner/defense-recovery/defense-plan-module";
import type { RunnerDefenseSignals } from "../runner/defense-recovery/defense-types";
import {
  runnerRolesCoverCoverageGap,
  type RunnerCoverageGapSignal,
} from "./runner-coverage-contracts";
import type { RunnerShellTradersPipelineSignal } from "../runner/shell-traders/shell-traders-types";
import { createRunnerShellTradersPipelineModule } from "../runner/shell-traders/shell-traders-plan-module";
import type { RunnerInstalledAgendaScoreSignal } from "../runner/installed-agenda/installed-agenda-types";
import { createRunnerInstalledAgendaScoreModule } from "../runner/installed-agenda/installed-agenda-plan-module";
import type {
  RunnerFundingNeedSignal,
  RunnerDevelopmentFundingMilestone,
} from "./runner-funding-contracts";
import { validRunnerFundingNeedContract } from "./runner-funding-contracts";
import type { RunnerResourceLifecycleSignal } from "../runner/resource-lifecycle/resource-lifecycle-types";
import { createRunnerResourceLifecycleModule } from "../runner/resource-lifecycle/resource-lifecycle-plan-module";
import type { RunnerRecurringEconomySignal } from "../runner/recurring-economy/recurring-economy-types";
import { createRunnerRecurringEconomyModule } from "../runner/recurring-economy/recurring-economy-plan-module";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

import { rolesForDeckDoctrineCard } from "../deck-doctrine-card-roles";
import { AI_HINTS_BY_CARD } from "../ai-hints";
import type { AiDeckStrategyProfile } from "../deck-doctrine-strategy";
import { rolesMatch } from "../runtime/role-match";
import { runnerEffectsProvideDamagePrevention } from "../runner-canonical-hint-semantics";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";

import type { PlanInstance } from "./plan-kernel-types";
import type {
  PlanMaterialization,
  PlanActionDisposition,
  PlanModule,
  PlanSchedulerContext,
} from "./plan-scheduler";

import type { ProjectedHandDisposition } from "./turn-projection";
import type { RunnerCreditBankSignal } from "../runner/credit-bank/credit-bank-types";
import { createRunnerCreditBankModule } from "../runner/credit-bank/credit-bank-plan-module";
import {
  runnerPlanProposal as proposal,
  runnerPlanAssessment as assessment,
  runnerPlanDomain,
} from "./runner-plan-module-support";
import type {
  RunnerHandDevelopmentCurrentNeed,
  RunnerHandDevelopmentRole,
  RunnerHandDevelopmentStrategicFit,
} from "../runner/hand-development/runner-hand-development-types";

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

export function createRunnerCorePlanModules(
  dependencies: RunnerCorePlanDependencies = {},
): PlanModule[] {
  const rolesForDefinitionId =
    dependencies.rolesForDefinitionId ?? rolesForDeckDoctrineCard;
  return [
    createRunnerInstalledAgendaScoreModule(),
    createRunnerShellTradersPipelineModule(),
    createRunnerResourceLifecycleModule(),
    createRunnerCreditBankModule(),
    createRunnerRecurringEconomyModule(),
    economyModule(),
    coverageModule(rolesForDefinitionId),
    createRunnerDefenseModule(),
  ];
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
        const phase = coveragePhase(
          context,
          gap,
          rolesForDefinitionId,
          preparations,
          installs,
        );
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

function coveragePhase(
  context: PlanSchedulerContext,
  gap: RunnerCoverageGapSignal,
  rolesForDefinitionId: (definitionId: string) => readonly string[],
  preparations = coveragePreparationCandidates(context, gap),
  installs = coverageInstallCandidates(context, gap, rolesForDefinitionId),
): CoverageState["phase"] {
  const sameTurnConversionNeedsFunding =
    gap.sameTurnRunConversion !== undefined && (gap.fundingGap ?? 0) > 0;
  return sameTurnConversionNeedsFunding
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
}

export function runnerCoverageCurrentPhase(params: {
  context: PlanSchedulerContext;
  gap: RunnerCoverageGapSignal;
  rolesForDefinitionId: (definitionId: string) => readonly string[];
}): CoverageState["phase"] {
  return coveragePhase(params.context, params.gap, params.rolesForDefinitionId);
}

function economyCandidates(
  context: PlanSchedulerContext,
  need: RunnerFundingNeedSignal,
): PlanMaterialization["candidates"] {
  const routeActionIds = new Set(
    need.kind === "develop_liquidity" ? need.actionIds : need.routeActionIds,
  );
  const paymentInstall =
    need.kind === "parent_plan_support" &&
    (need.driver.kind === "contest" || need.driver.kind === "run")
      ? need.routeAssessment.paymentInstall
      : undefined;
  const isPaymentInstall = (candidate: ActionSemanticCandidate) =>
    paymentInstall?.actionId === candidate.actionId &&
    need.kind === "parent_plan_support" &&
    need.driver.targetId === paymentInstall.targetServerId &&
    context.actionCandidates.some(
      (entry) => entry.actionId === paymentInstall.runActionId,
    ) &&
    paymentInstall.sourceCardInstanceId === candidate.sourceCardInstanceId &&
    paymentInstall.sourceDefinitionId === candidate.sourceDefinitionId &&
    candidate.semanticActionType === "install.card" &&
    candidate.costProfile.costKnownStatus === "known" &&
    candidate.costProfile.clickCost === paymentInstall.installClickCost &&
    candidate.costProfile.creditCost === paymentInstall.installCreditCost;
  return context.actionCandidates
    .filter(
      (candidate) =>
        !context.actionDispositions?.some(
          (entry) => entry.actionId === candidate.actionId,
        ) &&
        routeActionIds.has(candidate.actionId) &&
        (need.kind === "develop_liquidity"
          ? runnerTurnLiquidityCandidateIsMaterializable(candidate)
          : runnerFundingRouteCandidateIsMaterializable(candidate) ||
            isPaymentInstall(candidate)),
    )
    .map((candidate) => {
      const netLiquidCreditGain = isPaymentInstall(candidate)
        ? paymentInstall!.netPaymentGain - paymentInstall!.installCreditCost
        : candidate.economyProjection!.netLiquidCreditGain!;
      const fundingGapProgress = Math.min(need.gap, netLiquidCreditGain);
      return {
        candidate,
        stepValue: fundingGapProgress * 100 + netLiquidCreditGain,
      };
    });
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
    if (
      !runnerInstallDefinitionCoversCoverageGap(
        sourceDefinitionId,
        roles,
        gap.requiredRole,
      )
    )
      return [];
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

/** Prospective installation coverage; never use this as active rig coverage.
 * Configurable modes remain alternatives, with their costs and single-mode
 * limits evaluated by the existing Engine-backed run-path assessment. */
export function runnerInstallDefinitionCoversCoverageGap(
  definitionId: string,
  roles: readonly string[],
  requiredRole: RunnerCoverageGapSignal["requiredRole"],
): boolean {
  if (runnerRolesCoverCoverageGap(roles, requiredRole)) return true;
  const profile = AI_HINTS_BY_CARD.get(definitionId)?.breakerProfile;
  return (
    profile?.configurableCoverage === true &&
    (profile.coverageCandidates ?? []).some(
      (coverage) => `breaker_${coverage}` === requiredRole,
    )
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

function state<T>(instance: PlanInstance): T {
  return instance.moduleState as T;
}

function domain(context: PlanSchedulerContext): RunnerCorePlanDomain {
  return runnerPlanDomain<RunnerCorePlanDomain>(context);
}
