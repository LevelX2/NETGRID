import { planningCardFactsByDefinitionId } from "@netgrid/cards/planning";
import { type VisibleCard } from "@netgrid/shared";
import type { BreakerCapability } from "../../deck-capabilities";
import {
  RUNNER_BREAKER_COVERAGE,
  isRunnerBreakerCoverageRole,
  type RunnerCoverageGapSignal,
} from "../../plans/runner-coverage-contracts";
import { missingBreakerCoverageKind } from "../../plans/tactical-plan-breaker-coverage";
export function runnerVisibleDeckBreaker(
  breaker: BreakerCapability,
): VisibleCard | undefined {
  const definition = planningCardFactsByDefinitionId(breaker.cardId);
  if (
    !definition ||
    definition.side !== "runner" ||
    definition.type !== "program"
  ) {
    return undefined;
  }
  return {
    instanceId: `deck-coverage:${breaker.cardId}`,
    definitionId: breaker.cardId,
    title: definition.title,
    owner: "runner",
    controller: "runner",
    type: "program",
    subtypes: [...(definition.subtypes ?? [])],
    known: true,
    rezzed: true,
    ...(typeof definition.strength === "number"
      ? { strength: definition.strength }
      : {}),
    ...(typeof breaker.installCost === "number"
      ? { installCost: breaker.installCost }
      : {}),
    ...(typeof definition.memoryCost === "number"
      ? { memoryCost: definition.memoryCost }
      : {}),
  };
}

export function runnerBreakerCapabilityCoversRole(
  breaker: BreakerCapability,
  role: RunnerCoverageGapSignal["requiredRole"],
): boolean {
  const coverage = RUNNER_BREAKER_COVERAGE[role].deckKind;
  return (
    breaker.coverage.includes(coverage) ||
    breaker.coverage.includes("universal")
  );
}

export function planFirstCoverageRole(
  preciseCoverage: ReturnType<typeof missingBreakerCoverageKind>,
): RunnerCoverageGapSignal["requiredRole"] {
  return isRunnerBreakerCoverageRole(preciseCoverage)
    ? preciseCoverage
    : "breaker_universal";
}
