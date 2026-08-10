import type { AiDeckStrategyDeckSnapshot } from "./deck-strategy-snapshot";
import { AI_HINTS_BY_CARD } from "./ai-hints";
import {
  runnerHintProvidesNonNoisyBreakerCredits,
  runnerHintProvidesTopTrashRecovery,
} from "./runner-canonical-hint-semantics";

export const RUNNER_DECK_ENGINE_DOCTRINE_SCHEMA_VERSION =
  "runner-deck-engine-doctrine-v1" as const;

export type RunnerDoctrineProviderPersistence =
  | "persistent"
  | "consumable"
  | "one_shot";

export type RunnerDoctrineProviderAdditivity =
  | "additive_by_trigger_cadence"
  | "additive_to_compatible_demand"
  | "distinct_provider_first"
  | "redundant_by_default";

export type RunnerDoctrineProvider = {
  providerId: string;
  cardId: string;
  copies: number;
  capabilities: string[];
  supportCapabilities: string[];
  persistence: RunnerDoctrineProviderPersistence;
  additivity: RunnerDoctrineProviderAdditivity;
  compatibleDemandIds: string[];
  evidence: string[];
};

export type RunnerDoctrineDependency = {
  dependencyId: string;
  requiredCapabilityIds: string[];
  providerIds: string[];
  supportProviderIds: string[];
  distinctProviderDefinitions: number;
  providerCopies: number;
  criticality: "missing" | "single_definition" | "multiple_definitions";
  evidence: string[];
};

export type RunnerDoctrineEngineLine = {
  lineId:
    | "runner.engine.persistent_rig"
    | "runner.engine.consumption_recovery"
    | "runner.engine.delayed_install"
    | "runner.engine.compatible_recurring_economy"
    | "runner.engine.throughput_until_ready";
  status: "unsupported" | "supported" | "coherent";
  providerIds: string[];
  dependencyIds: string[];
  entryConditionIds: string[];
  exitConditionIds: string[];
  evidence: string[];
};

export type RunnerDoctrineDevelopmentTendency = {
  tendencyId:
    | "runner.development.install_persistent_provider"
    | "runner.development.recover_consumed_provider"
    | "runner.development.stage_before_overflow_draw"
    | "runner.development.throughput_until_dependency_ready";
  strength: "low" | "medium" | "high";
  ownerModuleId:
    | "runner.rig_and_coverage"
    | "runner.develop_board_and_hand"
    | "runner.shell_traders_pipeline";
  dependencyIds: string[];
  exitConditionIds: string[];
  evidence: string[];
};

export type RunnerDoctrinePlanContribution = {
  contributionId: string;
  ownerModuleId:
    | "runner.rig_and_coverage"
    | "runner.develop_board_and_hand"
    | "runner.shell_traders_pipeline";
  objective:
    | "maintain_required_coverage"
    | "recover_consumed_coverage"
    | "stage_or_progress_required_provider"
    | "increase_throughput_until_ready";
  capabilityIds: string[];
  dependencyIds: string[];
  activationConditionIds: string[];
  exitConditionIds: string[];
  evidence: string[];
};

export type RunnerDeckEngineDoctrine = {
  schemaVersion: typeof RUNNER_DECK_ENGINE_DOCTRINE_SCHEMA_VERSION;
  providers: RunnerDoctrineProvider[];
  dependencies: RunnerDoctrineDependency[];
  engineLines: RunnerDoctrineEngineLine[];
  developmentTendencies: RunnerDoctrineDevelopmentTendency[];
  planContributions: RunnerDoctrinePlanContribution[];
  evidence: string[];
};

type DoctrineHint = {
  cardId: string;
  cardType?: string;
  roles?: string[];
  planRoles?: string[];
  functionSignals?: string[];
  riskTags?: string[];
  breakerProfile?: {
    coverage?: string[];
    sideEffects?: string[];
    restrictions?: string[];
  };
};

const HINTS = AI_HINTS_BY_CARD;

export function buildRunnerDeckEngineDoctrine(
  snapshot: AiDeckStrategyDeckSnapshot,
): RunnerDeckEngineDoctrine | undefined {
  if (snapshot.side !== "runner") return undefined;
  const providers = snapshot.cards
    .filter((entry) => entry.quantity > 0)
    .map((entry) => providerFor(entry.cardId, entry.quantity))
    .filter((entry): entry is RunnerDoctrineProvider => entry !== undefined)
    .sort((left, right) => left.providerId.localeCompare(right.providerId));
  const coverageProviders = providers.filter((provider) =>
    provider.capabilities.includes("runner.coverage.breaker"),
  );
  const coverageSupport = providers.filter((provider) =>
    provider.supportCapabilities.includes("runner.coverage.breaker"),
  );
  const dependencies: RunnerDoctrineDependency[] = [
    dependency({
      dependencyId: "runner.dependency.breaker_coverage",
      requiredCapabilityIds: ["runner.coverage.breaker"],
      providers: coverageProviders,
      supportProviders: coverageSupport,
    }),
  ];
  const recoveryProviders = providers.filter((provider) =>
    provider.capabilities.includes("runner.recovery.program_or_hardware"),
  );
  const stagingProviders = providers.filter((provider) =>
    provider.capabilities.includes("runner.staging.delayed_install"),
  );
  const recurringProviders = providers.filter((provider) =>
    provider.capabilities.includes("runner.economy.recurring_breaker"),
  );
  const throughputProviders = providers.filter((provider) =>
    provider.capabilities.some(
      (capability) =>
        capability === "runner.throughput.draw" ||
        capability === "runner.throughput.search",
    ),
  );
  const consumableCoverageProviders = coverageProviders.filter(
    (provider) => provider.persistence === "consumable",
  );
  const engineLines = [
    engineLine({
      lineId: "runner.engine.persistent_rig",
      providers: coverageProviders,
      dependencyIds: ["runner.dependency.breaker_coverage"],
      coherent: coverageProviders.some(
        (provider) => provider.persistence === "persistent",
      ),
      entryConditionIds: ["coverage_dependency_open"],
      exitConditionIds: ["required_coverage_installed"],
    }),
    engineLine({
      lineId: "runner.engine.consumption_recovery",
      providers: [...consumableCoverageProviders, ...recoveryProviders],
      dependencyIds: ["runner.dependency.breaker_coverage"],
      coherent:
        consumableCoverageProviders.length > 0 && recoveryProviders.length > 0,
      entryConditionIds: ["consumable_coverage_provider_present"],
      exitConditionIds: ["coverage_provider_recoverable_or_replaced"],
    }),
    engineLine({
      lineId: "runner.engine.delayed_install",
      providers: [...stagingProviders, ...coverageProviders],
      dependencyIds: ["runner.dependency.breaker_coverage"],
      coherent: stagingProviders.length > 0 && coverageProviders.length > 0,
      entryConditionIds: ["stageable_required_provider_visible"],
      exitConditionIds: ["staged_provider_installed_or_no_longer_required"],
    }),
    engineLine({
      lineId: "runner.engine.compatible_recurring_economy",
      providers: [...recurringProviders, ...coverageProviders],
      dependencyIds: ["runner.dependency.breaker_coverage"],
      coherent: recurringProviders.length > 0 && coverageProviders.length > 0,
      entryConditionIds: ["compatible_breaker_credit_demand_present"],
      exitConditionIds: ["compatible_recurring_supply_meets_useful_demand"],
    }),
    engineLine({
      lineId: "runner.engine.throughput_until_ready",
      providers: throughputProviders,
      dependencyIds: ["runner.dependency.breaker_coverage"],
      coherent: throughputProviders.length > 0 && coverageProviders.length > 0,
      entryConditionIds: ["required_dependency_not_ready"],
      exitConditionIds: ["required_dependency_ready"],
    }),
  ];
  const coherentLine = (lineId: RunnerDoctrineEngineLine["lineId"]) =>
    engineLines.some(
      (line) => line.lineId === lineId && line.status === "coherent",
    );
  const throughputCopies = throughputProviders.reduce(
    (sum, provider) => sum + provider.copies,
    0,
  );
  const developmentTendencies: RunnerDoctrineDevelopmentTendency[] = [
    tendency({
      tendencyId: "runner.development.install_persistent_provider",
      strength: coverageProviders.length > 0 ? "high" : "low",
      ownerModuleId: "runner.rig_and_coverage",
      dependencyIds: ["runner.dependency.breaker_coverage"],
      exitConditionIds: ["required_coverage_installed"],
      active: coverageProviders.length > 0,
    }),
    tendency({
      tendencyId: "runner.development.recover_consumed_provider",
      strength: coherentLine("runner.engine.consumption_recovery")
        ? "high"
        : "low",
      ownerModuleId: "runner.rig_and_coverage",
      dependencyIds: ["runner.dependency.breaker_coverage"],
      exitConditionIds: ["coverage_provider_recoverable_or_replaced"],
      active: coherentLine("runner.engine.consumption_recovery"),
    }),
    tendency({
      tendencyId: "runner.development.stage_before_overflow_draw",
      strength: coherentLine("runner.engine.delayed_install") ? "high" : "low",
      ownerModuleId: "runner.shell_traders_pipeline",
      dependencyIds: ["runner.dependency.breaker_coverage"],
      exitConditionIds: ["no_stageable_required_provider"],
      active: coherentLine("runner.engine.delayed_install"),
    }),
    tendency({
      tendencyId: "runner.development.throughput_until_dependency_ready",
      strength: !coherentLine("runner.engine.throughput_until_ready")
        ? "low"
        : throughputCopies >= 3
          ? "high"
          : "medium",
      ownerModuleId: "runner.develop_board_and_hand",
      dependencyIds: ["runner.dependency.breaker_coverage"],
      exitConditionIds: ["required_dependency_ready"],
      active: coherentLine("runner.engine.throughput_until_ready"),
    }),
  ];
  const planContributions = contributionsFor({
    coverageProviders,
    recoveryProviders,
    stagingProviders,
    throughputProviders,
  });

  return {
    schemaVersion: RUNNER_DECK_ENGINE_DOCTRINE_SCHEMA_VERSION,
    providers,
    dependencies,
    engineLines,
    developmentTendencies,
    planContributions,
    evidence: [
      "runner_engine_doctrine:own_deck_snapshot_only",
      `provider_definitions:${providers.length}`,
      `provider_copies:${providers.reduce((sum, entry) => sum + entry.copies, 0)}`,
      `coherent_engine_lines:${engineLines.filter((line) => line.status === "coherent").length}`,
    ],
  };
}

function providerFor(
  cardId: string,
  copies: number,
): RunnerDoctrineProvider | undefined {
  const hint = HINTS.get(cardId);
  if (!hint) return undefined;
  const roles = new Set([...(hint.roles ?? []), ...(hint.planRoles ?? [])]);
  const signals = new Set(hint.functionSignals ?? []);
  const capabilities = new Set<string>();
  const supportCapabilities = new Set<string>();
  const breakerCoverage = hint.breakerProfile?.coverage ?? [];
  const isActualBreaker =
    breakerCoverage.length > 0 ||
    roles.has("icebreaker") ||
    roles.has("universal_breaker") ||
    [...roles].some((role) => role.startsWith("breaker_"));
  if (isActualBreaker) capabilities.add("runner.coverage.breaker");
  if (roles.has("icebreaker_support")) {
    supportCapabilities.add("runner.coverage.breaker");
  }
  if (runnerHintProvidesTopTrashRecovery(hint)) {
    capabilities.add("runner.recovery.program_or_hardware");
  }
  if (
    signals.has("setup.install_from_hand_staged") ||
    signals.has("setup.install_countdown")
  ) {
    capabilities.add("runner.staging.delayed_install");
  }
  if (runnerHintProvidesNonNoisyBreakerCredits(hint)) {
    capabilities.add("runner.economy.recurring_breaker");
  }
  if (signals.has("setup.draw")) capabilities.add("runner.throughput.draw");
  if (signals.has("setup.search")) capabilities.add("runner.throughput.search");
  if (capabilities.size === 0 && supportCapabilities.size === 0) {
    return undefined;
  }
  const consumable =
    roles.has("self_trash") ||
    signals.has("breaker.self_trash_risk") ||
    (hint.breakerProfile?.sideEffects ?? []).some((effect) =>
      effect.includes("trash"),
    );
  const isStaging = capabilities.has("runner.staging.delayed_install");
  const isRecovery = capabilities.has("runner.recovery.program_or_hardware");
  const isCompatibleRecurring = capabilities.has(
    "runner.economy.recurring_breaker",
  );
  return {
    providerId: `runner.provider:${cardId}`,
    cardId,
    copies,
    capabilities: [...capabilities].sort(),
    supportCapabilities: [...supportCapabilities].sort(),
    persistence: consumable
      ? "consumable"
      : hint.cardType === "event"
        ? "one_shot"
        : "persistent",
    additivity: isStaging
      ? "additive_by_trigger_cadence"
      : isCompatibleRecurring
        ? "additive_to_compatible_demand"
        : isRecovery
          ? "redundant_by_default"
          : "distinct_provider_first",
    compatibleDemandIds: isCompatibleRecurring
      ? ["runner.demand.breaker_credit"]
      : [],
    evidence: [
      `provider_card:${cardId}`,
      `provider_copies:${copies}`,
      ...[...capabilities].sort().map((entry) => `provides:${entry}`),
      ...[...supportCapabilities].sort().map((entry) => `supports:${entry}`),
    ],
  };
}

function dependency(params: {
  dependencyId: string;
  requiredCapabilityIds: string[];
  providers: RunnerDoctrineProvider[];
  supportProviders: RunnerDoctrineProvider[];
}): RunnerDoctrineDependency {
  return {
    dependencyId: params.dependencyId,
    requiredCapabilityIds: params.requiredCapabilityIds,
    providerIds: params.providers.map((provider) => provider.providerId).sort(),
    supportProviderIds: params.supportProviders
      .map((provider) => provider.providerId)
      .sort(),
    distinctProviderDefinitions: params.providers.length,
    providerCopies: params.providers.reduce(
      (sum, provider) => sum + provider.copies,
      0,
    ),
    criticality:
      params.providers.length === 0
        ? "missing"
        : params.providers.length === 1
          ? "single_definition"
          : "multiple_definitions",
    evidence: [
      `dependency:${params.dependencyId}`,
      `distinct_provider_definitions:${params.providers.length}`,
      `provider_copies:${params.providers.reduce(
        (sum, provider) => sum + provider.copies,
        0,
      )}`,
    ],
  };
}

function engineLine(params: {
  lineId: RunnerDoctrineEngineLine["lineId"];
  providers: RunnerDoctrineProvider[];
  dependencyIds: string[];
  coherent: boolean;
  entryConditionIds: string[];
  exitConditionIds: string[];
}): RunnerDoctrineEngineLine {
  const providerIds = [
    ...new Set(params.providers.map((entry) => entry.providerId)),
  ].sort();
  return {
    lineId: params.lineId,
    status:
      providerIds.length === 0
        ? "unsupported"
        : params.coherent
          ? "coherent"
          : "supported",
    providerIds,
    dependencyIds: params.dependencyIds,
    entryConditionIds: params.entryConditionIds,
    exitConditionIds: params.exitConditionIds,
    evidence: [
      `engine_line:${params.lineId}`,
      `provider_count:${providerIds.length}`,
      `coherent:${params.coherent}`,
    ],
  };
}

function tendency(params: {
  tendencyId: RunnerDoctrineDevelopmentTendency["tendencyId"];
  strength: RunnerDoctrineDevelopmentTendency["strength"];
  ownerModuleId: RunnerDoctrineDevelopmentTendency["ownerModuleId"];
  dependencyIds: string[];
  exitConditionIds: string[];
  active: boolean;
}): RunnerDoctrineDevelopmentTendency {
  return {
    tendencyId: params.tendencyId,
    strength: params.strength,
    ownerModuleId: params.ownerModuleId,
    dependencyIds: params.dependencyIds,
    exitConditionIds: params.exitConditionIds,
    evidence: [
      `development_tendency:${params.tendencyId}`,
      `active:${params.active}`,
      `owner:${params.ownerModuleId}`,
    ],
  };
}

function contributionsFor(params: {
  coverageProviders: RunnerDoctrineProvider[];
  recoveryProviders: RunnerDoctrineProvider[];
  stagingProviders: RunnerDoctrineProvider[];
  throughputProviders: RunnerDoctrineProvider[];
}): RunnerDoctrinePlanContribution[] {
  const contributions: RunnerDoctrinePlanContribution[] = [];
  if (params.coverageProviders.length > 0) {
    contributions.push({
      contributionId: "runner.contribution.maintain_breaker_coverage",
      ownerModuleId: "runner.rig_and_coverage",
      objective: "maintain_required_coverage",
      capabilityIds: ["runner.coverage.breaker"],
      dependencyIds: ["runner.dependency.breaker_coverage"],
      activationConditionIds: ["coverage_dependency_open"],
      exitConditionIds: ["required_coverage_installed"],
      evidence: ["contribution_from:runner.engine.persistent_rig"],
    });
  }
  if (params.recoveryProviders.length > 0) {
    contributions.push({
      contributionId: "runner.contribution.recover_consumed_coverage",
      ownerModuleId: "runner.rig_and_coverage",
      objective: "recover_consumed_coverage",
      capabilityIds: ["runner.recovery.program_or_hardware"],
      dependencyIds: ["runner.dependency.breaker_coverage"],
      activationConditionIds: ["required_provider_consumed"],
      exitConditionIds: ["coverage_provider_recoverable_or_replaced"],
      evidence: ["contribution_from:runner.engine.consumption_recovery"],
    });
  }
  if (params.stagingProviders.length > 0) {
    contributions.push({
      contributionId: "runner.contribution.stage_required_provider",
      ownerModuleId: "runner.shell_traders_pipeline",
      objective: "stage_or_progress_required_provider",
      capabilityIds: ["runner.staging.delayed_install"],
      dependencyIds: ["runner.dependency.breaker_coverage"],
      activationConditionIds: ["stageable_required_provider_visible"],
      exitConditionIds: ["staged_provider_installed_or_no_longer_required"],
      evidence: ["contribution_from:runner.engine.delayed_install"],
    });
  }
  if (params.throughputProviders.length > 0) {
    contributions.push({
      contributionId: "runner.contribution.throughput_until_ready",
      ownerModuleId: "runner.develop_board_and_hand",
      objective: "increase_throughput_until_ready",
      capabilityIds: ["runner.throughput.draw", "runner.throughput.search"],
      dependencyIds: ["runner.dependency.breaker_coverage"],
      activationConditionIds: ["required_dependency_not_ready"],
      exitConditionIds: ["required_dependency_ready"],
      evidence: ["contribution_from:runner.engine.throughput_until_ready"],
    });
  }
  return contributions.sort((left, right) =>
    left.contributionId.localeCompare(right.contributionId),
  );
}
