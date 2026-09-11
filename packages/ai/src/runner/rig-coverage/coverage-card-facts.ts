import { CARD_DEFINITIONS_BY_ID } from "../../card-definition-compatibility";
import { type VisibleCard } from "@netgrid/shared";
import type { BreakerCapability } from "../../deck-capabilities";
import { type RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";
import { missingBreakerCoverageKind } from "../../plans/tactical-plan-breaker-coverage";
export function runnerVisibleDeckBreaker(
  breaker: BreakerCapability,
): VisibleCard | undefined {
  const definition = CARD_DEFINITIONS_BY_ID[breaker.cardId];
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
  const coverage = coverageKindForPlanRole(role);
  return (
    breaker.coverage.includes(coverage) ||
    breaker.coverage.includes("universal")
  );
}

export function coverageKindForPlanRole(
  role: RunnerCoverageGapSignal["requiredRole"],
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

export function planFirstCoverageRole(
  preciseCoverage: ReturnType<typeof missingBreakerCoverageKind>,
  evidence: readonly string[],
): RunnerCoverageGapSignal["requiredRole"] {
  if (preciseCoverage === "breaker_wall") return "breaker_wall";
  if (preciseCoverage === "breaker_code_gate") return "breaker_code_gate";
  if (preciseCoverage === "breaker_sentry") return "breaker_sentry";
  if (preciseCoverage === "breaker_ap") return "breaker_ap";
  if (preciseCoverage === "breaker_trace") return "breaker_trace";
  return requiredBreakerRole(evidence);
}

export function requiredBreakerRole(
  evidence: readonly string[],
): RunnerCoverageGapSignal["requiredRole"] {
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
