import { describe, expect, it } from "vitest";
import type {
  BreakerCapability,
  BreakerCoverageKind,
  CoverageState,
  DeckCapabilityProfile,
} from "./deck-capabilities";
import { assessRunnerBreakerDevelopment } from "./runner-breaker-development";

describe("assessRunnerBreakerDevelopment", () => {
  it("closes the Krash-style universal-only architecture after installation", () => {
    const assessment = assessRunnerBreakerDevelopment(
      runnerCapabilities([
        breaker(
          "krash",
          ["universal", "wall", "code_gate", "sentry"],
          ["installed", "in_hand", "in_deck"],
        ),
        breaker(
          "krash",
          ["universal", "wall", "code_gate", "sentry"],
          ["in_deck"],
        ),
        breaker("cloak", ["special"], ["in_deck"], "low"),
      ]),
    );

    expect(assessment).toMatchObject({
      minimumCoverageComplete: true,
      architecture: "universal_single",
      optionalBreakerIds: [],
      searchableOptionalBreakerIds: [],
      primaryBreakerNeed: false,
    });
  });

  it("keeps a distinct high-confidence specialist as optional hybrid development", () => {
    const assessment = assessRunnerBreakerDevelopment(
      runnerCapabilities([
        breaker(
          "krash",
          ["universal", "wall", "code_gate", "sentry"],
          ["installed"],
        ),
        breaker("efficient-wall-breaker", ["wall"], ["in_deck"]),
        breaker("cloak", ["special"], ["in_deck"], "low"),
      ]),
    );

    expect(assessment).toMatchObject({
      minimumCoverageComplete: true,
      architecture: "hybrid",
      optionalBreakerIds: ["efficient-wall-breaker"],
      searchableOptionalBreakerIds: ["efficient-wall-breaker"],
      primaryBreakerNeed: false,
    });
  });

  it("does not search for another specialist when that card is already visible in hand", () => {
    const assessment = assessRunnerBreakerDevelopment(
      runnerCapabilities([
        breaker(
          "krash",
          ["universal", "wall", "code_gate", "sentry"],
          ["installed"],
        ),
        breaker("efficient-wall-breaker", ["wall"], ["in_hand", "in_deck"]),
      ]),
    );

    expect(assessment.optionalBreakerIds).toEqual(["efficient-wall-breaker"]);
    expect(assessment.searchableOptionalBreakerIds).toEqual([]);
  });

  it("treats a universal breaker as an optional upgrade after a specialist suite works", () => {
    const capabilities = runnerCapabilities([
      breaker("wall-breaker", ["wall"], ["installed"]),
      breaker("code-breaker", ["code_gate"], ["installed"]),
      breaker("sentry-breaker", ["sentry"], ["installed"]),
      breaker("late-universal", ["universal"], ["in_deck"]),
    ]);
    const assessment = assessRunnerBreakerDevelopment(capabilities);

    expect(assessment).toMatchObject({
      minimumCoverageComplete: true,
      architecture: "hybrid",
      optionalBreakerIds: ["late-universal"],
      searchableOptionalBreakerIds: ["late-universal"],
      primaryBreakerNeed: false,
    });
  });
});

function runnerCapabilities(
  inventory: BreakerCapability[],
): DeckCapabilityProfile {
  return {
    schemaVersion: "deck-capability-profile-v1",
    side: "runner",
    runner: {
      breakerInventory: inventory,
      breakerCoverageMatrix: Object.fromEntries(
        (
          [
            "wall",
            "code_gate",
            "sentry",
            "ap",
            "trace",
            "universal",
            "subtype_limited",
            "special",
          ] as const
        ).map((coverage) => [coverage, coverageState(coverage)]),
      ) as Record<BreakerCoverageKind, CoverageState>,
      searchAccess: {
        tools: [],
        canSearchProgramsNow: true,
        canSearchBreakersNow: true,
        evidence: [],
      },
      economyBankTools: [],
      memoryProfile: {
        memoryToolsKnown: 0,
        missingMemoryPressure: false,
        evidence: [],
      },
      attackPlanProfile: {
        centralPressureToolsKnown: 1,
        remoteContestToolsKnown: 0,
        setupToolsKnown: 1,
        evidence: [],
      },
    },
    missingCapabilities: [],
    confidence: "high",
    evidence: ["deck_snapshot:present"],
  };
}

function coverageState(coverage: BreakerCoverageKind): CoverageState {
  return {
    coverage,
    inDeckKnown: true,
    inHand: false,
    installed: ["wall", "code_gate", "sentry", "universal"].includes(coverage),
    searchableNow: true,
    drawOnly: false,
    missing: false,
    bestKnownCards: ["krash"],
    blockers: [],
  };
}

function breaker(
  cardId: string,
  coverage: BreakerCoverageKind[],
  locations: BreakerCapability["locations"],
  confidence: BreakerCapability["confidence"] = "high",
): BreakerCapability {
  return {
    cardId,
    title: cardId,
    coverage,
    risks: [],
    restrictions: [],
    quantityKnownInDeck: 3,
    locations,
    confidence,
    evidence: ["test"],
  };
}
