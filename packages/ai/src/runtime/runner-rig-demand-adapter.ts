import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";

import type {
  BreakerCapability,
  BreakerCoverageKind,
  DeckCapabilityProfile,
} from "../deck-capabilities";
import type { RunnerCoverageGapSignal } from "../plans/runner-core-plan-modules";
import { planInstanceIdForProposal } from "../plans/plan-instance";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import type { RunnerStrategicIntentProfile } from "../runner-strategic-intent";
import {
  runnerRestrictedRunCreditProfile,
  type RunnerRestrictedRunCreditUse,
} from "./runner-canonical-card-facts";
import {
  buildRunnerRigDemandProjection,
  RunnerRigDemandProjectionError,
  type RunnerRigDemandProjection,
  type RunnerRigDemandProviderInput,
  type RunnerRigRoleDemandInput,
} from "../runner/rig-demand/runner-rig-demand-projection";
import { rolesMatch } from "./role-match";

export type BuildRunnerRigDemandProjectionForCoverageParams = Readonly<{
  input: AiDecisionInput;
  strategicIntent: RunnerStrategicIntentProfile;
  deckCapabilities: DeckCapabilityProfile;
  coverageGaps: readonly RunnerCoverageGapSignal[];
  rolesForDefinitionId: (definitionId: string) => readonly string[];
}>;

/**
 * Adapts existing rig-and-coverage owner facts into the common read-only
 * projection. It does not discover plans or select routes.
 */
export function buildRunnerRigDemandProjectionForCoverage(
  params: BuildRunnerRigDemandProjectionForCoverageParams,
): RunnerRigDemandProjection {
  if (!runnerCoverageRigDemandInputsComplete(params)) {
    throw new RunnerRigDemandProjectionError(
      "invalid_demand",
      "runner_rig_demand_coverage_provider_facts_incomplete",
    );
  }
  const input = params.input as AiDecisionInputWithDeckCapabilities;
  const identity = input.planningStateIdentity;
  const binding = {
    stateVersion: identity?.stateVersion ?? -1,
    sideSafePlanningFingerprint:
      identity?.sideSafePlanningFingerprint ?? "missing",
  };
  const coverageDemands = params.coverageGaps.flatMap((gap) => {
    if (!gap.deckHasAnswer && !gap.answerInHand) return [];
    const providers = coverageProvidersForGap(params, gap);
    if (providers.length === 0) return [];
    const currentStep =
      gap.priorityClass === "P2" && (gap.installActionIds?.length ?? 0) > 0;
    return [
      {
        demandId: gap.gapId,
        ownerModuleId: "runner.rig_and_coverage" as const,
        sourceKind: currentStep
          ? ("current_plan_step" as const)
          : ("resident_plan_need" as const),
        ...(gap.requesterPlanInstanceId
          ? { sourcePlanInstanceId: gap.requesterPlanInstanceId }
          : {
              sourcePlanInstanceId: `plan:runner.rig_and_coverage:${gap.gapId}`,
            }),
        sourceNeedId: gap.requesterNeedId ?? gap.gapId,
        capabilityId: gap.requiredRole,
        horizon: currentStep
          ? ("current_step" as const)
          : ("next_rig_milestone" as const),
        guarantee: "bound_plan" as const,
        requirement:
          gap.priorityClass === "P2" || gap.answerInHand
            ? ("required_simultaneously" as const)
            : ("preferred_simultaneously" as const),
        simultaneousSetId:
          gap.requesterPlanInstanceId ??
          gap.targetServerId ??
          `coverage-set:${gap.gapId}`,
        providers,
        binding,
        evidenceCodes: [
          gap.evidenceCode,
          `runner_rig_coverage_priority:${gap.priorityClass}`,
          ...(gap.recoveryEvidenceCodes ?? []),
        ],
      },
    ];
  });
  const restrictedRunCreditDemands = restrictedRunCreditSupportDemands(
    params,
    coverageDemands,
    binding,
  );
  const preliminary = buildRunnerRigDemandProjection({
    input,
    strategicIntent: params.strategicIntent,
    demands: [...coverageDemands, ...restrictedRunCreditDemands],
  });
  const memoryDemand = memoryCapacityDemand(params, preliminary, binding);
  return memoryDemand || restrictedRunCreditDemands.length > 0
    ? buildRunnerRigDemandProjection({
        input,
        strategicIntent: params.strategicIntent,
        demands: [
          ...coverageDemands,
          ...(memoryDemand ? [memoryDemand] : []),
          ...restrictedRunCreditDemands,
        ],
      })
    : preliminary;
}

export function runnerCoverageRigDemandInputsComplete(
  params: Pick<
    BuildRunnerRigDemandProjectionForCoverageParams,
    "input" | "deckCapabilities" | "coverageGaps"
  >,
): boolean {
  const runner = params.deckCapabilities.runner;
  if (!runner) return params.coverageGaps.length === 0;
  return params.coverageGaps.every((gap) => {
    if (!gap.deckHasAnswer && !gap.answerInHand) return true;
    const matchingBreakers = runner.breakerInventory.filter((breaker) =>
      breakerCoversGap(breaker, gap.requiredRole),
    );
    return (
      matchingBreakers.length > 0 &&
      matchingBreakers.every(
        (breaker) => breakerMemoryUnits(params.input, breaker) !== undefined,
      )
    );
  });
}

export function bindRunnerRigDemandProjectionToCoverageGaps(params: {
  input: AiDecisionInput;
  coverageGaps: readonly RunnerCoverageGapSignal[];
  projection: RunnerRigDemandProjection;
}): RunnerCoverageGapSignal[] {
  const legalMemoryInstallIdsByDemand = new Map<string, string[]>();
  for (const demand of params.projection.roleDemands) {
    if (!demand.capabilityId.startsWith("memory_capacity_general:")) continue;
    const boundCardIds = new Set(
      params.projection.cardRetentionFacts
        .filter((fact) => fact.boundDemandIds.includes(demand.demandId))
        .map((fact) => fact.cardInstanceId),
    );
    const actionIds = params.input.legalActions
      .filter(
        (action) =>
          action.side === "runner" &&
          action.type === "install_card" &&
          action.expiresAtStateVersion ===
            params.input.playerView.stateVersion &&
          boundCardIds.has(action.source),
      )
      .map((action) => action.actionId)
      .sort();
    if (actionIds.length > 0) {
      legalMemoryInstallIdsByDemand.set(demand.demandId, actionIds);
    }
  }
  return params.coverageGaps.map((gap) => {
    const actionIds = params.projection.roleDemands.flatMap((demand) =>
      demand.sourceNeedId === (gap.requesterNeedId ?? gap.gapId) &&
      demand.capabilityId.startsWith("memory_capacity_general:")
        ? (legalMemoryInstallIdsByDemand.get(demand.demandId) ?? [])
        : [],
    );
    if (actionIds.length === 0) return gap;
    const memorySupportActionIds = [...new Set(actionIds)].sort();
    return {
      ...gap,
      memorySupportActionIds,
      preparationActionIds: [
        ...new Set([
          ...(gap.preparationActionIds ?? []),
          ...memorySupportActionIds,
        ]),
      ].sort(),
      recoveryEvidenceCodes: [
        ...(gap.recoveryEvidenceCodes ?? []),
        ...memorySupportActionIds.map(
          (actionId) => `runner_rig_memory_support_action:${actionId}`,
        ),
      ],
    };
  });
}

function coverageProvidersForGap(
  params: BuildRunnerRigDemandProjectionForCoverageParams,
  gap: RunnerCoverageGapSignal,
): RunnerRigDemandProviderInput[] {
  const runner = params.deckCapabilities.runner;
  if (!runner) return [];
  const providers = runner.breakerInventory
    .filter((breaker) => breakerCoversGap(breaker, gap.requiredRole))
    .flatMap((breaker) => {
      const provider = breakerProvider(params, gap, breaker);
      return provider ? [provider] : [];
    });
  return uniqueProviders(providers);
}

function breakerProvider(
  params: BuildRunnerRigDemandProjectionForCoverageParams,
  gap: RunnerCoverageGapSignal,
  breaker: BreakerCapability,
): RunnerRigDemandProviderInput | undefined {
  const memoryUnits = breakerMemoryUnits(params.input, breaker);
  if (memoryUnits === undefined) return undefined;
  const visibleInstance = knownOwnCards(params.input).find(
    (card) => card.definitionId === breaker.cardId,
  );
  return {
    providerId: visibleInstance
      ? `card:${visibleInstance.instanceId}`
      : `definition:${breaker.cardId}`,
    definitionId: breaker.cardId,
    ...(visibleInstance ? { cardInstanceId: visibleInstance.instanceId } : {}),
    memoryMode: "general",
    memoryUnits,
    breakerTraits: breakerTraitsForProvider(params, breaker, visibleInstance),
    searchableNow:
      gap.directSearchActionIds.length > 0 ||
      gap.searchEngineSetupActionIds.length > 0,
    knownRemainingInStack: breaker.locations.includes("in_deck")
      ? Math.max(1, breaker.quantityKnownInDeck)
      : 0,
    evidenceCodes: [
      `runner_rig_provider_breaker:${breaker.cardId}`,
      `runner_rig_provider_confidence:${breaker.confidence}`,
    ],
  };
}

function restrictedRunCreditSupportDemands(
  params: BuildRunnerRigDemandProjectionForCoverageParams,
  coverageDemands: readonly RunnerRigRoleDemandInput[],
  binding: RunnerRigRoleDemandInput["binding"],
): RunnerRigRoleDemandInput[] {
  return params.input.playerView.own.gripOrHq
    .filter((card) => card.known !== false)
    .flatMap((card) => {
      const definitionId = card.definitionId;
      const profile = runnerRestrictedRunCreditProfile(definitionId);
      if (!profile || !definitionId) return [];
      const memoryUnits = memoryUnitsForVisibleCard(card);
      if (memoryUnits === undefined) return [];
      return coverageDemands.flatMap((parentDemand) =>
        profile.uses.flatMap((use) => {
          if (!restrictedUseMatchesDemand(use, parentDemand)) return [];
          return [
            {
              demandId: `restricted-run-credit:${card.instanceId}:${use}:${parentDemand.demandId}`,
              ownerModuleId: "runner.develop_board_and_hand" as const,
              sourceKind: "admission_checked_development" as const,
              sourcePlanInstanceId: planInstanceIdForProposal({
                moduleId: "runner.develop_board_and_hand",
                dedupeKey: `card:${card.instanceId}`,
              }),
              sourceNeedId: parentDemand.demandId,
              capabilityId: `restricted_run_credit:${use}`,
              horizon: "next_rig_milestone" as const,
              guarantee: "forecast" as const,
              requirement: "conditional_support" as const,
              ...(parentDemand.simultaneousSetId
                ? { simultaneousSetId: parentDemand.simultaneousSetId }
                : {}),
              providers: [
                {
                  providerId: `card:${card.instanceId}`,
                  definitionId,
                  cardInstanceId: card.instanceId,
                  memoryMode: card.type === "program" ? "general" : "none",
                  memoryUnits,
                  evidenceCodes: [
                    `runner_rig_restricted_run_credit_capacity:${profile.capacity}`,
                    `runner_rig_restricted_run_credit_use:${use}`,
                  ],
                },
              ],
              binding,
              evidenceCodes: [
                `runner_rig_restricted_run_credit_parent:${parentDemand.demandId}`,
                `runner_rig_restricted_run_credit_capacity:${profile.capacity}`,
                `runner_rig_restricted_run_credit_use:${use}`,
              ],
            },
          ];
        }),
      );
    });
}

function restrictedUseMatchesDemand(
  use: RunnerRestrictedRunCreditUse,
  demand: RunnerRigRoleDemandInput,
): boolean {
  if (
    demand.requirement !== "required_simultaneously" &&
    demand.requirement !== "preferred_simultaneously"
  ) {
    return false;
  }
  return demand.providers.some((provider) => {
    const traits = provider.breakerTraits;
    if (!traits) return false;
    return use === "using_killer_during_run" ? traits.killer : !traits.noisy;
  });
}

function breakerTraitsForProvider(
  params: BuildRunnerRigDemandProjectionForCoverageParams,
  breaker: BreakerCapability,
  visibleInstance: VisibleCard | undefined,
): { killer: boolean; noisy: boolean } {
  const canonicalSubtypes =
    cardSpecPlanningCardByDefinitionId(breaker.cardId)?.planning.engine
      .characteristics.subtypes ?? [];
  const traits = new Set(
    [
      ...(visibleInstance?.subtypes ?? []),
      ...canonicalSubtypes,
      ...params.rolesForDefinitionId(breaker.cardId),
      ...breaker.risks,
      ...breaker.restrictions,
    ].map((value) => value.toLocaleLowerCase("en-US")),
  );
  return {
    killer:
      traits.has("killer") ||
      traits.has("breaker_killer") ||
      traits.has("breaker:killer"),
    noisy: traits.has("noisy") || traits.has("breaker_noisy"),
  };
}

function memoryUnitsForVisibleCard(card: VisibleCard): number | undefined {
  if (card.type !== "program") return 0;
  return (
    knownNonNegativeInteger(card.memoryCost) ??
    (card.definitionId
      ? knownNonNegativeInteger(
          cardSpecPlanningCardByDefinitionId(card.definitionId)?.planning.engine
            .characteristics.numeric.memoryCost,
        )
      : undefined)
  );
}

function breakerMemoryUnits(
  input: AiDecisionInput,
  breaker: BreakerCapability,
): number | undefined {
  const visibleInstance = knownOwnCards(input).find(
    (card) => card.definitionId === breaker.cardId,
  );
  return (
    knownNonNegativeInteger(breaker.memoryCost) ??
    knownNonNegativeInteger(visibleInstance?.memoryCost) ??
    knownNonNegativeInteger(
      cardSpecPlanningCardByDefinitionId(breaker.cardId)?.planning.engine
        .characteristics.numeric.memoryCost,
    )
  );
}

function memoryCapacityDemand(
  params: BuildRunnerRigDemandProjectionForCoverageParams,
  preliminary: RunnerRigDemandProjection,
  binding: RunnerRigRoleDemandInput["binding"],
): RunnerRigRoleDemandInput | undefined {
  const requiredGap = Math.max(
    0,
    preliminary.memory.requiredAdditionalGeneralMu -
      preliminary.memory.memoryAvailable,
  );
  const preferredGap = Math.max(
    0,
    preliminary.memory.preferredAdditionalGeneralMu -
      preliminary.memory.memoryAvailable,
  );
  const requiredCapacity = requiredGap > 0 ? requiredGap : preferredGap;
  if (requiredCapacity <= 0) return undefined;
  const providers = memorySupportProviders(params, requiredCapacity);
  if (providers.length === 0) return undefined;
  const required = requiredGap > 0;
  const sourceDemand = preliminary.roleDemands.find((demand) =>
    (required
      ? preliminary.memory.requiredDemandIds
      : preliminary.memory.preferredDemandIds
    ).includes(demand.demandId),
  );
  if (!sourceDemand) return undefined;
  return {
    demandId: `memory-capacity:${sourceDemand.simultaneousSetId}:${requiredCapacity}`,
    ownerModuleId: "runner.rig_and_coverage",
    sourceKind:
      sourceDemand.horizon === "current_step"
        ? "current_plan_step"
        : "resident_plan_need",
    ...(sourceDemand.sourcePlanInstanceId
      ? { sourcePlanInstanceId: sourceDemand.sourcePlanInstanceId }
      : {}),
    ...(sourceDemand.sourceNeedId
      ? { sourceNeedId: sourceDemand.sourceNeedId }
      : {}),
    capabilityId: `memory_capacity_general:${requiredCapacity}`,
    horizon: sourceDemand.horizon,
    guarantee: sourceDemand.guarantee,
    requirement: required
      ? "required_simultaneously"
      : "preferred_simultaneously",
    simultaneousSetId: sourceDemand.simultaneousSetId,
    providers,
    binding,
    evidenceCodes: [
      `runner_rig_memory_capacity_gap:${requiredCapacity}`,
      `runner_rig_memory_capacity_parent_demand:${sourceDemand.demandId}`,
    ],
  };
}

function memorySupportProviders(
  params: BuildRunnerRigDemandProjectionForCoverageParams,
  requiredCapacity: number,
): RunnerRigDemandProviderInput[] {
  const input = params.input as AiDecisionInputWithDeckCapabilities;
  const visible = knownOwnCards(input).flatMap((card) => {
    const capacity = memoryCapacityForCard(card, params.rolesForDefinitionId);
    if (capacity < requiredCapacity) return [];
    return [
      {
        providerId: `card:${card.instanceId}`,
        ...(card.definitionId ? { definitionId: card.definitionId } : {}),
        cardInstanceId: card.instanceId,
        memoryMode: "none" as const,
        memoryUnits: 0,
        evidenceCodes: [`runner_rig_memory_provider_capacity:${capacity}`],
      },
    ];
  });
  const visibleDefinitions = new Set(
    visible
      .map((provider) => provider.definitionId)
      .filter(
        (definitionId): definitionId is string => definitionId !== undefined,
      ),
  );
  const deck = (input.ownDeckSnapshot?.cards ?? []).flatMap((entry) => {
    if (visibleDefinitions.has(entry.cardId) || entry.quantity <= 0) return [];
    const capacity = memoryCapacityForDefinition(entry.cardId);
    if (capacity < requiredCapacity) return [];
    return [
      {
        providerId: `definition:${entry.cardId}`,
        definitionId: entry.cardId,
        memoryMode: "none" as const,
        memoryUnits: 0,
        knownRemainingInStack: entry.quantity,
        evidenceCodes: [`runner_rig_memory_provider_capacity:${capacity}`],
      },
    ];
  });
  return uniqueProviders([...visible, ...deck]);
}

function memoryCapacityForCard(
  card: VisibleCard,
  rolesForDefinitionId: (definitionId: string) => readonly string[],
): number {
  const visibleCapacity = Math.max(0, card.memoryLimitBonus ?? 0);
  if (visibleCapacity > 0) return visibleCapacity;
  if (
    card.definitionId &&
    rolesMatch(rolesForDefinitionId(card.definitionId), [
      "memory",
      "memory_support",
    ])
  ) {
    return memoryCapacityForDefinition(card.definitionId);
  }
  return 0;
}

function memoryCapacityForDefinition(definitionId: string): number {
  const capacity =
    cardSpecPlanningCardByDefinitionId(definitionId)?.planning.engine
      .characteristics.memoryLimitBonus;
  return knownNonNegativeInteger(capacity) ?? 0;
}

function knownOwnCards(input: AiDecisionInput): VisibleCard[] {
  return [
    ...input.playerView.own.gripOrHq,
    ...(input.playerView.own.rig ?? []),
    ...input.playerView.own.heapOrArchives,
  ].filter((card) => card.known !== false);
}

function breakerCoversGap(
  breaker: BreakerCapability,
  requiredRole: RunnerCoverageGapSignal["requiredRole"],
): boolean {
  if (breaker.coverage.includes("universal")) return true;
  return breaker.coverage.includes(coverageKindForRole(requiredRole));
}

function coverageKindForRole(
  requiredRole: RunnerCoverageGapSignal["requiredRole"],
): BreakerCoverageKind {
  switch (requiredRole) {
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

function knownNonNegativeInteger(
  value: number | null | undefined,
): number | undefined {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : undefined;
}

function uniqueProviders(
  providers: readonly RunnerRigDemandProviderInput[],
): RunnerRigDemandProviderInput[] {
  return [
    ...new Map(
      providers.map((provider) => [provider.providerId, provider]),
    ).values(),
  ].sort((left, right) => left.providerId.localeCompare(right.providerId));
}
