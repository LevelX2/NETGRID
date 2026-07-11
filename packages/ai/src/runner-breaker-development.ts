import type {
  BreakerCapability,
  BreakerCoverageKind,
  DeckCapabilityProfile,
} from "./deck-capabilities";

const BASE_COVERAGE = new Set<BreakerCoverageKind>([
  "wall",
  "code_gate",
  "sentry",
]);

export type RunnerBreakerArchitecture =
  | "unknown"
  | "universal_single"
  | "specialized_suite"
  | "hybrid";

export type RunnerBreakerDevelopmentAssessment = {
  minimumCoverageComplete: boolean;
  architecture: RunnerBreakerArchitecture;
  optionalBreakerIds: string[];
  searchableOptionalBreakerIds: string[];
  primaryBreakerNeed: boolean;
  evidence: string[];
};

export function assessRunnerBreakerDevelopment(
  deckCapabilities: DeckCapabilityProfile | undefined,
): RunnerBreakerDevelopmentAssessment {
  const runner = deckCapabilities?.runner;
  if (!runner) {
    return {
      minimumCoverageComplete: false,
      architecture: "unknown",
      optionalBreakerIds: [],
      searchableOptionalBreakerIds: [],
      primaryBreakerNeed: true,
      evidence: ["breaker_architecture:unknown", "breaker_profile:missing"],
    };
  }

  const minimumCoverageComplete = (
    ["wall", "code_gate", "sentry"] as const
  ).every((coverage) => runner.breakerCoverageMatrix[coverage].installed);
  const distinctBreakers = distinctHighConfidenceBaseBreakers(
    runner.breakerInventory,
  );
  const universalBreakers = distinctBreakers.filter((breaker) =>
    breaker.coverage.includes("universal"),
  );
  const specialistBreakers = distinctBreakers.filter(
    (breaker) =>
      !breaker.coverage.includes("universal") &&
      breaker.coverage.some((coverage) => BASE_COVERAGE.has(coverage)),
  );
  const architecture: RunnerBreakerArchitecture =
    universalBreakers.length > 0 && specialistBreakers.length > 0
      ? "hybrid"
      : specialistBreakers.length >= 2
        ? "specialized_suite"
        : universalBreakers.length > 0
          ? "universal_single"
          : "unknown";
  const installedDefinitionIds = new Set(
    distinctBreakers
      .filter((breaker) => breaker.locations.includes("installed"))
      .map((breaker) => breaker.cardId),
  );
  const optionalBreakerPool =
    architecture === "hybrid" ? distinctBreakers : specialistBreakers;
  const optionalBreakers =
    minimumCoverageComplete &&
    (architecture === "hybrid" || architecture === "specialized_suite")
      ? optionalBreakerPool.filter(
          (breaker) => !installedDefinitionIds.has(breaker.cardId),
        )
      : [];
  const searchableOptionalBreakers = optionalBreakers.filter(
    (breaker) =>
      !breaker.locations.includes("in_hand") &&
      breaker.locations.includes("in_deck") &&
      (runner.searchAccess.canSearchBreakersNow ||
        runner.searchAccess.canSearchProgramsNow),
  );

  return {
    minimumCoverageComplete,
    architecture,
    optionalBreakerIds: optionalBreakers.map((breaker) => breaker.cardId),
    searchableOptionalBreakerIds: searchableOptionalBreakers.map(
      (breaker) => breaker.cardId,
    ),
    primaryBreakerNeed: !minimumCoverageComplete,
    evidence: [
      `breaker_architecture:${architecture}`,
      `breaker_minimum_coverage_complete:${minimumCoverageComplete}`,
      `breaker_distinct_high_confidence_count:${distinctBreakers.length}`,
      `breaker_optional_development:${optionalBreakers.map((breaker) => breaker.cardId).join("|") || "none"}`,
      `breaker_optional_searchable:${searchableOptionalBreakers.map((breaker) => breaker.cardId).join("|") || "none"}`,
    ],
  };
}

function distinctHighConfidenceBaseBreakers(
  inventory: readonly BreakerCapability[],
): BreakerCapability[] {
  const byDefinition = new Map<string, BreakerCapability>();
  for (const breaker of inventory) {
    if (breaker.confidence !== "high") continue;
    if (
      !breaker.coverage.includes("universal") &&
      !breaker.coverage.some((coverage) => BASE_COVERAGE.has(coverage))
    ) {
      continue;
    }
    if (!byDefinition.has(breaker.cardId)) {
      byDefinition.set(breaker.cardId, breaker);
    }
  }
  return [...byDefinition.values()].sort((left, right) =>
    left.cardId.localeCompare(right.cardId),
  );
}
