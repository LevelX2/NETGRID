import type { VisibleCard } from "@netgrid/shared";

import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import type { RunnerStrategicIntentProfile } from "../../runner-strategic-intent";

export const RUNNER_RIG_DEMAND_PROJECTION_SCHEMA_VERSION =
  "runner-rig-demand-projection-v1" as const;

export type RunnerRigDemandOwnerModuleId =
  | "runner.rig_and_coverage"
  | "runner.develop_board_and_hand"
  | "runner.defense_and_recovery"
  | "runner.economy";

export type RunnerRigDemandHorizon =
  | "current_step"
  | "next_rig_milestone"
  | "doctrine_option";

export type RunnerRigDemandGuarantee =
  | "rules_proven"
  | "visible_state_forced"
  | "bound_plan"
  | "deck_known"
  | "forecast";

export type RunnerRigDemandRequirement =
  | "required_simultaneously"
  | "preferred_simultaneously"
  | "alternative_provider"
  | "backup_only"
  | "conditional_support"
  | "optional_doctrine_reserve";

export type RunnerRigDemandSourceKind =
  | "current_plan_step"
  | "resident_plan_need"
  | "visible_threat"
  | "admission_checked_development"
  | "deck_doctrine";

export type RunnerRigProviderAcquisitionState =
  | "installed"
  | "in_hand"
  | "searchable_now"
  | "draw_only"
  | "in_deck_known"
  | "discarded"
  | "unavailable"
  | "unknown";

export type RunnerRigMemoryMode = "general" | "hosted" | "none";

export type RunnerRigDemandBinding = Readonly<{
  stateVersion: number;
  sideSafePlanningFingerprint: string;
}>;

export type RunnerRigDemandProviderInput = Readonly<{
  providerId: string;
  definitionId?: string;
  cardInstanceId?: string;
  memoryMode: RunnerRigMemoryMode;
  memoryUnits: number;
  searchableNow?: boolean;
  knownRemainingInStack?: number;
  knownUnavailable?: boolean;
  breakerTraits?: Readonly<{
    killer: boolean;
    noisy: boolean;
  }>;
  evidenceCodes: readonly string[];
}>;

export type RunnerRigRoleDemandInput = Readonly<{
  demandId: string;
  ownerModuleId: RunnerRigDemandOwnerModuleId;
  sourceKind: RunnerRigDemandSourceKind;
  sourcePlanInstanceId?: string;
  sourceNeedId?: string;
  capabilityId: string;
  horizon: RunnerRigDemandHorizon;
  guarantee: RunnerRigDemandGuarantee;
  requirement: RunnerRigDemandRequirement;
  simultaneousSetId?: string;
  providers: readonly RunnerRigDemandProviderInput[];
  binding: RunnerRigDemandBinding;
  evidenceCodes: readonly string[];
}>;

export type RunnerRigDemandProvider = Readonly<{
  providerId: string;
  definitionId?: string;
  cardInstanceId?: string;
  memoryMode: RunnerRigMemoryMode;
  memoryUnits: number;
  acquisitionState: RunnerRigProviderAcquisitionState;
  breakerTraits?: Readonly<{
    killer: boolean;
    noisy: boolean;
  }>;
  evidenceCodes: readonly string[];
}>;

export type RunnerRigRoleDemand = Readonly<{
  demandId: string;
  ownerModuleId: RunnerRigDemandOwnerModuleId;
  sourceKind: RunnerRigDemandSourceKind;
  sourcePlanInstanceId?: string;
  sourceNeedId?: string;
  capabilityId: string;
  horizon: RunnerRigDemandHorizon;
  guarantee: RunnerRigDemandGuarantee;
  requirement: RunnerRigDemandRequirement;
  simultaneousSetId: string;
  providers: readonly RunnerRigDemandProvider[];
  satisfiedByInstalledProvider: boolean;
  evidenceCodes: readonly string[];
}>;

export type RunnerRigDoctrineSignal = Readonly<{
  signalId: string;
  kind:
    | "setup_engine"
    | "engine_line"
    | "pressure_vector"
    | "development_tendency";
  confidence: RunnerStrategicIntentProfile["confidence"];
  evidenceCodes: readonly string[];
}>;

export type RunnerRigMemoryProjection = Readonly<{
  memoryUsed: number;
  memoryLimit: number;
  memoryAvailable: number;
  requiredAdditionalGeneralMu: number;
  preferredAdditionalGeneralMu: number;
  requiredMemoryLimit: number;
  preferredMemoryLimit: number;
  hostedDemandIds: readonly string[];
  requiredDemandIds: readonly string[];
  preferredDemandIds: readonly string[];
  evidenceCodes: readonly string[];
}>;

export type RunnerRigCardRetentionValue =
  | "required"
  | "preferred"
  | "conditional"
  | "option"
  | "unbound";

export type RunnerRigCardInstallReadiness =
  | "current_step_legal"
  | "next_milestone_legal"
  | "retention_only"
  | "doctrine_only"
  | "blocked";

export type RunnerRigCardRetentionFact = Readonly<{
  cardInstanceId: string;
  definitionId?: string;
  boundDemandIds: readonly string[];
  retentionValue: RunnerRigCardRetentionValue;
  installReadiness: RunnerRigCardInstallReadiness;
  evidenceCodes: readonly string[];
}>;

export type RunnerRigDemandProjection = Readonly<{
  schemaVersion: typeof RUNNER_RIG_DEMAND_PROJECTION_SCHEMA_VERSION;
  side: "runner";
  stateVersion: number;
  sideSafePlanningFingerprint: string;
  doctrineSignals: readonly RunnerRigDoctrineSignal[];
  roleDemands: readonly RunnerRigRoleDemand[];
  memory: RunnerRigMemoryProjection;
  cardRetentionFacts: readonly RunnerRigCardRetentionFact[];
  evidenceCodes: readonly string[];
}>;

export type BuildRunnerRigDemandProjectionParams = Readonly<{
  input: AiDecisionInputWithDeckCapabilities;
  strategicIntent?: RunnerStrategicIntentProfile;
  demands?: readonly RunnerRigRoleDemandInput[];
}>;

export class RunnerRigDemandProjectionError extends Error {
  constructor(
    readonly code:
      | "runner_input_required"
      | "planning_identity_missing"
      | "planning_identity_stale"
      | "demand_binding_stale"
      | "invalid_numeric_fact"
      | "invalid_demand",
    message: string,
  ) {
    super(message);
    this.name = "RunnerRigDemandProjectionError";
  }
}

/**
 * Builds side-safe rig facts for existing plan owners. This service has no
 * action, plan, executor, hold, install, or discard authority.
 */
export function buildRunnerRigDemandProjection(
  params: BuildRunnerRigDemandProjectionParams,
): RunnerRigDemandProjection {
  const { input } = params;
  if (input.side !== "runner") {
    throw new RunnerRigDemandProjectionError(
      "runner_input_required",
      `runner_rig_demand_projection_requires_runner:${input.side}`,
    );
  }
  const identity = input.planningStateIdentity;
  if (!identity) {
    throw new RunnerRigDemandProjectionError(
      "planning_identity_missing",
      "runner_rig_demand_projection_requires_planning_identity",
    );
  }
  if (identity.stateVersion !== input.playerView.stateVersion) {
    throw new RunnerRigDemandProjectionError(
      "planning_identity_stale",
      `runner_rig_demand_projection_identity_stale:${identity.stateVersion}:${input.playerView.stateVersion}`,
    );
  }
  const memoryUsed = input.playerView.own.memoryUsed;
  const memoryLimit = input.playerView.own.memoryLimit;
  assertNonNegativeInteger(memoryUsed, "memory_used");
  assertNonNegativeInteger(memoryLimit, "memory_limit");

  const binding: RunnerRigDemandBinding = {
    stateVersion: identity.stateVersion,
    sideSafePlanningFingerprint: identity.sideSafePlanningFingerprint,
  };
  const roleDemands = (params.demands ?? [])
    .map((demand) => normalizeDemand(input, binding, demand))
    .sort((left, right) => left.demandId.localeCompare(right.demandId));
  assertUniqueIds(
    roleDemands.map((demand) => demand.demandId),
    "demand",
  );

  const doctrineSignals = doctrineSignalsFor(params.strategicIntent);
  const memory = memoryProjectionFor(input, roleDemands);
  const cardRetentionFacts = cardRetentionFactsFor(
    input,
    roleDemands,
    doctrineSignals,
  );

  return {
    schemaVersion: RUNNER_RIG_DEMAND_PROJECTION_SCHEMA_VERSION,
    side: "runner",
    stateVersion: identity.stateVersion,
    sideSafePlanningFingerprint: identity.sideSafePlanningFingerprint,
    doctrineSignals,
    roleDemands,
    memory,
    cardRetentionFacts,
    evidenceCodes: sortedUnique([
      `runner_rig_demand_state_version:${identity.stateVersion}`,
      `runner_rig_demand_count:${roleDemands.length}`,
      `runner_rig_doctrine_signal_count:${doctrineSignals.length}`,
      `runner_rig_bound_hand_card_count:${cardRetentionFacts.filter((fact) => fact.boundDemandIds.length > 0).length}`,
      "runner_rig_hand_pressure_is_not_demand_source:true",
      "runner_rig_fact_service_has_no_action_authority:true",
    ]),
  };
}

export function redactedRunnerRigDemandProjectionFacts(
  projection: RunnerRigDemandProjection,
): string[] {
  return sortedUnique([
    `runner_rig_demand_projection:${projection.schemaVersion}`,
    `runner_rig_demand_state_version:${projection.stateVersion}`,
    `runner_rig_demand_count:${projection.roleDemands.length}`,
    `runner_rig_required_general_mu:${projection.memory.requiredAdditionalGeneralMu}`,
    `runner_rig_preferred_general_mu:${projection.memory.preferredAdditionalGeneralMu}`,
    `runner_rig_bound_hand_cards:${projection.cardRetentionFacts.filter((fact) => fact.boundDemandIds.length > 0).length}`,
    ...projection.roleDemands.map(
      (demand) =>
        `runner_rig_demand:${demand.ownerModuleId}:${demand.capabilityId}:${demand.horizon}:${demand.requirement}:${demand.guarantee}`,
    ),
    ...projection.doctrineSignals.map(
      (signal) =>
        `runner_rig_doctrine_signal:${signal.kind}:${signal.signalId}`,
    ),
  ]);
}

function normalizeDemand(
  input: AiDecisionInputWithDeckCapabilities,
  binding: RunnerRigDemandBinding,
  demand: RunnerRigRoleDemandInput,
): RunnerRigRoleDemand {
  if (
    !demand.demandId ||
    !demand.capabilityId ||
    demand.providers.length === 0 ||
    (demand.sourceKind === "deck_doctrine" &&
      demand.requirement !== "optional_doctrine_reserve")
  ) {
    throw new RunnerRigDemandProjectionError(
      "invalid_demand",
      `runner_rig_demand_invalid:${demand.demandId || "missing"}`,
    );
  }
  if (
    demand.binding.stateVersion !== binding.stateVersion ||
    demand.binding.sideSafePlanningFingerprint !==
      binding.sideSafePlanningFingerprint
  ) {
    throw new RunnerRigDemandProjectionError(
      "demand_binding_stale",
      `runner_rig_demand_binding_stale:${demand.demandId}`,
    );
  }
  const providers = demand.providers
    .map((provider) => normalizeProvider(input, provider))
    .sort((left, right) => left.providerId.localeCompare(right.providerId));
  assertUniqueIds(
    providers.map((provider) => provider.providerId),
    `provider:${demand.demandId}`,
  );
  const satisfiedByInstalledProvider = providers.some(
    (provider) => provider.acquisitionState === "installed",
  );
  return {
    demandId: demand.demandId,
    ownerModuleId: demand.ownerModuleId,
    sourceKind: demand.sourceKind,
    ...(demand.sourcePlanInstanceId
      ? { sourcePlanInstanceId: demand.sourcePlanInstanceId }
      : {}),
    ...(demand.sourceNeedId ? { sourceNeedId: demand.sourceNeedId } : {}),
    capabilityId: demand.capabilityId,
    horizon: demand.horizon,
    guarantee: demand.guarantee,
    requirement: demand.requirement,
    simultaneousSetId: demand.simultaneousSetId ?? demand.demandId,
    providers,
    satisfiedByInstalledProvider,
    evidenceCodes: sortedUnique([
      ...demand.evidenceCodes,
      `runner_rig_demand_owner:${demand.ownerModuleId}`,
      `runner_rig_demand_horizon:${demand.horizon}`,
      `runner_rig_demand_guarantee:${demand.guarantee}`,
      `runner_rig_demand_requirement:${demand.requirement}`,
      `runner_rig_demand_satisfied:${satisfiedByInstalledProvider}`,
    ]),
  };
}

function normalizeProvider(
  input: AiDecisionInputWithDeckCapabilities,
  provider: RunnerRigDemandProviderInput,
): RunnerRigDemandProvider {
  if (!provider.providerId) {
    throw new RunnerRigDemandProjectionError(
      "invalid_demand",
      "runner_rig_provider_id_missing",
    );
  }
  assertNonNegativeInteger(provider.memoryUnits, "provider_memory_units");
  if (provider.memoryMode === "none" && provider.memoryUnits !== 0) {
    throw new RunnerRigDemandProjectionError(
      "invalid_demand",
      `runner_rig_provider_memory_mode_invalid:${provider.providerId}`,
    );
  }
  if (provider.knownRemainingInStack !== undefined) {
    assertNonNegativeInteger(
      provider.knownRemainingInStack,
      "provider_known_remaining_in_stack",
    );
  }
  const acquisitionState = acquisitionStateFor(input, provider);
  return {
    providerId: provider.providerId,
    ...(provider.definitionId ? { definitionId: provider.definitionId } : {}),
    ...(provider.cardInstanceId
      ? { cardInstanceId: provider.cardInstanceId }
      : {}),
    memoryMode: provider.memoryMode,
    memoryUnits: provider.memoryUnits,
    acquisitionState,
    ...(provider.breakerTraits
      ? { breakerTraits: { ...provider.breakerTraits } }
      : {}),
    evidenceCodes: sortedUnique([
      ...provider.evidenceCodes,
      `runner_rig_provider_acquisition:${acquisitionState}`,
      `runner_rig_provider_memory:${provider.memoryMode}:${provider.memoryUnits}`,
    ]),
  };
}

function acquisitionStateFor(
  input: AiDecisionInputWithDeckCapabilities,
  provider: RunnerRigDemandProviderInput,
): RunnerRigProviderAcquisitionState {
  if (provider.knownUnavailable) return "unavailable";
  if (zoneHasProvider(input.playerView.own.rig ?? [], provider)) {
    return "installed";
  }
  if (zoneHasProvider(input.playerView.own.gripOrHq, provider)) {
    return "in_hand";
  }
  if (provider.searchableNow) return "searchable_now";
  if (provider.knownRemainingInStack !== undefined) {
    if (provider.knownRemainingInStack <= 0) return "unavailable";
    return "draw_only";
  }
  if (zoneHasProvider(input.playerView.own.heapOrArchives, provider)) {
    return "discarded";
  }
  if (provider.definitionId && deckContains(input, provider.definitionId)) {
    return "in_deck_known";
  }
  return "unknown";
}

function zoneHasProvider(
  cards: readonly VisibleCard[],
  provider: RunnerRigDemandProviderInput,
): boolean {
  return cards.some(
    (card) =>
      card.known !== false &&
      (provider.cardInstanceId
        ? card.instanceId === provider.cardInstanceId
        : provider.definitionId !== undefined &&
          card.definitionId === provider.definitionId),
  );
}

function deckContains(
  input: AiDecisionInputWithDeckCapabilities,
  definitionId: string,
): boolean {
  return (
    input.ownDeckSnapshot?.cards.some(
      (entry) => entry.cardId === definitionId && entry.quantity > 0,
    ) === true
  );
}

function doctrineSignalsFor(
  intent: RunnerStrategicIntentProfile | undefined,
): RunnerRigDoctrineSignal[] {
  if (!intent) return [];
  return [
    ...(intent.setupEngine ?? []).map((signalId) => ({
      signalId,
      kind: "setup_engine" as const,
      confidence: intent.confidence,
      evidenceCodes: [`runner_rig_doctrine_setup:${signalId}`],
    })),
    ...(intent.engineLineIds ?? []).map((signalId) => ({
      signalId,
      kind: "engine_line" as const,
      confidence: intent.confidence,
      evidenceCodes: [`runner_rig_doctrine_engine_line:${signalId}`],
    })),
    ...(intent.pressureVectors ?? []).map((signalId) => ({
      signalId,
      kind: "pressure_vector" as const,
      confidence: intent.confidence,
      evidenceCodes: [`runner_rig_doctrine_pressure:${signalId}`],
    })),
    ...(intent.developmentTendencies ?? []).map((tendency) => ({
      signalId: tendency.tendencyId,
      kind: "development_tendency" as const,
      confidence: intent.confidence,
      evidenceCodes: [
        `runner_rig_doctrine_development_tendency:${tendency.tendencyId}`,
      ],
    })),
  ].sort(
    (left, right) =>
      left.kind.localeCompare(right.kind) ||
      left.signalId.localeCompare(right.signalId),
  );
}

function memoryProjectionFor(
  input: AiDecisionInputWithDeckCapabilities,
  demands: readonly RunnerRigRoleDemand[],
): RunnerRigMemoryProjection {
  const memoryUsed = input.playerView.own.memoryUsed;
  const memoryLimit = input.playerView.own.memoryLimit;
  assertNonNegativeInteger(memoryUsed, "memory_used");
  assertNonNegativeInteger(memoryLimit, "memory_limit");
  const memoryAvailable = Math.max(0, memoryLimit - memoryUsed);
  const activeDemands = demands.filter(
    (demand) => !demand.satisfiedByInstalledProvider,
  );
  const required = activeDemands.filter(
    (demand) => demand.requirement === "required_simultaneously",
  );
  const preferred = activeDemands.filter(
    (demand) => demand.requirement === "preferred_simultaneously",
  );
  const requiredAdditionalGeneralMu = maximumSimultaneousGeneralMu(required);
  const preferredAdditionalGeneralMu = Math.max(
    requiredAdditionalGeneralMu,
    maximumSimultaneousGeneralMu([...required, ...preferred]),
  );
  return {
    memoryUsed,
    memoryLimit,
    memoryAvailable,
    requiredAdditionalGeneralMu,
    preferredAdditionalGeneralMu,
    requiredMemoryLimit: memoryUsed + requiredAdditionalGeneralMu,
    preferredMemoryLimit: memoryUsed + preferredAdditionalGeneralMu,
    hostedDemandIds: activeDemands
      .filter((demand) =>
        demand.providers.some((provider) => provider.memoryMode === "hosted"),
      )
      .map((demand) => demand.demandId)
      .sort(),
    requiredDemandIds: required.map((demand) => demand.demandId).sort(),
    preferredDemandIds: preferred.map((demand) => demand.demandId).sort(),
    evidenceCodes: sortedUnique([
      `runner_rig_memory_used:${memoryUsed}`,
      `runner_rig_memory_limit:${memoryLimit}`,
      `runner_rig_memory_available:${memoryAvailable}`,
      `runner_rig_required_additional_general_mu:${requiredAdditionalGeneralMu}`,
      `runner_rig_preferred_additional_general_mu:${preferredAdditionalGeneralMu}`,
    ]),
  };
}

function maximumSimultaneousGeneralMu(
  demands: readonly RunnerRigRoleDemand[],
): number {
  const bySet = new Map<string, number>();
  for (const demand of demands) {
    const minimumGeneralMu = minimumProviderMemory(demand, "general");
    bySet.set(
      demand.simultaneousSetId,
      (bySet.get(demand.simultaneousSetId) ?? 0) + minimumGeneralMu,
    );
  }
  return Math.max(0, ...bySet.values());
}

function minimumProviderMemory(
  demand: RunnerRigRoleDemand,
  mode: RunnerRigMemoryMode,
): number {
  const values = demand.providers
    .filter((provider) => provider.memoryMode === mode)
    .map((provider) => provider.memoryUnits);
  if (values.length === 0) return 0;
  return Math.min(...values);
}

function cardRetentionFactsFor(
  input: AiDecisionInputWithDeckCapabilities,
  demands: readonly RunnerRigRoleDemand[],
  doctrineSignals: readonly RunnerRigDoctrineSignal[],
): RunnerRigCardRetentionFact[] {
  const legalInstallSources = new Set(
    input.legalActions
      .filter(
        (action) => action.side === "runner" && action.type === "install_card",
      )
      .map((action) => action.source),
  );
  const doctrineOnly = doctrineSignals.length > 0;
  return input.playerView.own.gripOrHq
    .filter((card) => card.known !== false)
    .map((card) => {
      const boundDemands = demands.filter((demand) =>
        demand.providers.some((provider) =>
          providerMatchesCard(provider, card),
        ),
      );
      const boundDemandIds = boundDemands
        .map((demand) => demand.demandId)
        .sort();
      const retentionValue = retentionValueFor(boundDemands);
      const legalNow = legalInstallSources.has(card.instanceId);
      const installReadiness = installReadinessFor({
        boundDemands,
        legalNow,
        doctrineOnly,
      });
      return {
        cardInstanceId: card.instanceId,
        ...(card.definitionId ? { definitionId: card.definitionId } : {}),
        boundDemandIds,
        retentionValue,
        installReadiness,
        evidenceCodes: sortedUnique([
          `runner_rig_card_bound_demand_count:${boundDemandIds.length}`,
          `runner_rig_card_retention:${retentionValue}`,
          `runner_rig_card_install_readiness:${installReadiness}`,
        ]),
      };
    })
    .sort((left, right) =>
      left.cardInstanceId.localeCompare(right.cardInstanceId),
    );
}

function providerMatchesCard(
  provider: RunnerRigDemandProvider,
  card: VisibleCard,
): boolean {
  return provider.cardInstanceId
    ? provider.cardInstanceId === card.instanceId
    : provider.definitionId !== undefined &&
        provider.definitionId === card.definitionId;
}

function retentionValueFor(
  demands: readonly RunnerRigRoleDemand[],
): RunnerRigCardRetentionValue {
  if (
    demands.some((demand) => demand.requirement === "required_simultaneously")
  ) {
    return "required";
  }
  if (
    demands.some((demand) => demand.requirement === "preferred_simultaneously")
  ) {
    return "preferred";
  }
  if (
    demands.some((demand) =>
      ["alternative_provider", "backup_only", "conditional_support"].includes(
        demand.requirement,
      ),
    )
  ) {
    return "conditional";
  }
  if (
    demands.some((demand) => demand.requirement === "optional_doctrine_reserve")
  ) {
    return "option";
  }
  return "unbound";
}

function installReadinessFor(params: {
  boundDemands: readonly RunnerRigRoleDemand[];
  legalNow: boolean;
  doctrineOnly: boolean;
}): RunnerRigCardInstallReadiness {
  if (
    params.legalNow &&
    params.boundDemands.some(
      (demand) =>
        demand.horizon === "current_step" &&
        demand.sourceKind !== "deck_doctrine",
    )
  ) {
    return "current_step_legal";
  }
  if (
    params.legalNow &&
    params.boundDemands.some(
      (demand) =>
        demand.horizon === "next_rig_milestone" &&
        demand.sourceKind !== "deck_doctrine",
    )
  ) {
    return "next_milestone_legal";
  }
  if (params.boundDemands.length > 0) return "retention_only";
  if (params.doctrineOnly) return "doctrine_only";
  return "blocked";
}

function assertNonNegativeInteger(
  value: number | undefined,
  fact: string,
): asserts value is number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new RunnerRigDemandProjectionError(
      "invalid_numeric_fact",
      `runner_rig_demand_numeric_fact_invalid:${fact}:${value}`,
    );
  }
}

function assertUniqueIds(ids: readonly string[], kind: string): void {
  if (new Set(ids).size !== ids.length) {
    throw new RunnerRigDemandProjectionError(
      "invalid_demand",
      `runner_rig_demand_duplicate_${kind}`,
    );
  }
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
