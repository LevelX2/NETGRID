import type {
  PlanBlocker,
  PlanLifecycle,
  RequiredCapability,
  RequiredCapabilityKind,
  TacticalPlanBuildContext,
} from "./tactical-plan-types";
import {
  deckCoverageKindForRequiredCapability,
  missingCoverageBlockerKind,
} from "./tactical-plan-coverage-kinds";

export function breakerCoverageCapability(
  kind: RequiredCapabilityKind,
  serverId: string,
): RequiredCapability {
  return {
    capabilityId: `breaker_coverage:${serverId}`,
    kind,
    side: "runner",
    target: { kind: "server", id: serverId },
    evidence: [`server:${serverId}`, `missing_coverage:${kind}`],
  };
}

export function deckCoverageStateForRequiredCoverage(
  context: TacticalPlanBuildContext,
  requiredCoverage: RequiredCapabilityKind,
) {
  const coverage = deckCoverageKindForRequiredCapability(requiredCoverage);
  return coverage
    ? context.deckCapabilities?.runner?.breakerCoverageMatrix[coverage]
    : undefined;
}

export function bestDeckBreakerForRequiredCoverage(
  context: TacticalPlanBuildContext,
  requiredCoverage: RequiredCapabilityKind,
) {
  const coverage = deckCoverageKindForRequiredCapability(requiredCoverage);
  if (!coverage) return undefined;
  const inventory = context.deckCapabilities?.runner?.breakerInventory ?? [];
  return inventory.find((breaker) => {
    const breakerCoverage = new Set(breaker.coverage);
    return breakerCoverage.has(coverage) || breakerCoverage.has("universal");
  });
}

export function coveragePlanStatusForRequiredCoverage(
  context: TacticalPlanBuildContext,
  requiredCoverage: RequiredCapabilityKind,
): PlanLifecycle {
  return deckCoverageStateForRequiredCoverage(context, requiredCoverage)
    ?.missing && deckCapabilityHasDeckSnapshot(context)
    ? "blocked"
    : "active";
}

export function deckCapabilityHasDeckSnapshot(
  context: TacticalPlanBuildContext,
): boolean {
  const evidence = new Set(context.deckCapabilities?.evidence ?? []);
  return evidence.has("deck_snapshot:present");
}

export function deckCapabilityEvidenceForRequiredCoverage(
  context: TacticalPlanBuildContext,
  requiredCoverage: RequiredCapabilityKind,
): string[] {
  const coverage = deckCoverageKindForRequiredCapability(requiredCoverage);
  const state = coverage
    ? context.deckCapabilities?.runner?.breakerCoverageMatrix[coverage]
    : undefined;
  if (!coverage || !state) return [];
  if (state.missing && !deckCapabilityHasDeckSnapshot(context)) return [];
  const status = state.installed
    ? "installed"
    : state.inHand
      ? "in_hand"
      : state.searchableNow
        ? "in_deck/searchable"
        : state.inDeckKnown
          ? "in_deck/draw_only"
          : "missing";
  return [`deck_capability:breaker_${coverage}=${status}`];
}

export function deckCapabilityBlockersForRequiredCoverage(
  context: TacticalPlanBuildContext,
  requiredCoverage: RequiredCapabilityKind,
  serverId: string,
): PlanBlocker[] {
  const coverage = deckCoverageKindForRequiredCapability(requiredCoverage);
  const state = coverage
    ? context.deckCapabilities?.runner?.breakerCoverageMatrix[coverage]
    : undefined;
  if (!coverage || !state) return [];
  if (state.missing && deckCapabilityHasDeckSnapshot(context)) {
    return [
      {
        blockerId: `deck_missing_${coverage}_coverage:${serverId}`,
        kind: missingCoverageBlockerKind(coverage),
        severity:
          coverage === "special" || coverage === "subtype_limited"
            ? "soft"
            : "hard",
        target: { kind: "server", id: serverId },
        removalStepKind: "draw_for_answer",
        evidence: [
          `deck_capability:breaker_${coverage}=missing`,
          "coverage_not_in_deck",
        ],
      },
      {
        blockerId: `coverage_not_in_deck:${serverId}:${coverage}`,
        kind: "coverage_not_in_deck",
        severity: "hard",
        target: { kind: "server", id: serverId },
        removalStepKind: "draw_for_answer",
        evidence: [`missing_coverage:${coverage}`],
      },
    ];
  }
  const memoryAvailable =
    context.deckCapabilities?.runner?.memoryProfile.memoryAvailable;
  if (state.inHand && memoryAvailable !== undefined && memoryAvailable <= 0) {
    return [
      {
        blockerId: `breaker_present_but_mu_blocked:${serverId}:${coverage}`,
        kind: "breaker_present_but_mu_blocked",
        severity: "soft",
        target: { kind: "server", id: serverId },
        removalStepKind: "resolve_missing_mu",
        evidence: [
          `deck_capability:breaker_${coverage}=in_hand`,
          `memory_available:${memoryAvailable}`,
        ],
      },
      {
        blockerId: `missing_mu:${serverId}:${coverage}`,
        kind: "missing_mu",
        severity: "soft",
        target: { kind: "capability", id: "memory" },
        removalStepKind: "resolve_missing_mu",
        evidence: [`memory_available:${memoryAvailable}`],
      },
    ];
  }
  if (
    state.inDeckKnown &&
    !state.searchableNow &&
    !state.inHand &&
    !state.installed
  ) {
    return [
      {
        blockerId: `search_target_not_available:${serverId}:${coverage}`,
        kind: "search_target_not_available",
        severity: "soft",
        target: { kind: "server", id: serverId },
        removalStepKind: "draw_for_answer",
        evidence: [
          `deck_capability:breaker_${coverage}=in_deck/draw_only`,
          "searchable_now:false",
        ],
      },
    ];
  }
  return [];
}
