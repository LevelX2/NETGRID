import { describe, expect, it } from "vitest";

import type { AiDecisionInput } from "@netgrid/shared";
import type { DeckCapabilityProfile } from "../deck-capabilities";
import type { RunnerHandDevelopmentEvaluation } from "../runner-hand-development";
import { runnerSearchDevelopmentHasConcreteConversion } from "./tactical-plan-runner-hand-development";
import type { TacticalPlanBuildContext } from "./tactical-plan-types";

describe("runnerSearchDevelopmentHasConcreteConversion", () => {
  it("defers program search when a universal single-breaker rig is complete", () => {
    const context = searchContext(
      breakerProfile({
        universalInstalled: true,
        optionalSpecialistInDeck: false,
      }),
    );

    expect(
      runnerSearchDevelopmentHasConcreteConversion(
        context,
        programSearchEvaluation(),
      ),
    ).toBe(false);
  });

  it("keeps search live for a near-horizon hybrid breaker target", () => {
    const context = searchContext(
      breakerProfile({
        universalInstalled: true,
        optionalSpecialistInDeck: true,
      }),
    );

    expect(
      runnerSearchDevelopmentHasConcreteConversion(
        context,
        programSearchEvaluation(),
      ),
    ).toBe(true);
  });
});

function programSearchEvaluation(): RunnerHandDevelopmentEvaluation {
  return {
    schemaVersion: "runner-hand-development-evaluation-v1",
    cardInstanceId: "program-search-resource",
    availability: "legal_now",
    developmentRole: "draw_or_search_engine",
    strategicFit: "strong",
    currentNeed: "useful_now",
    priority: 900,
    deferReason: "none",
    legalActionId: "install-program-search",
    persistentInstallEvaluation: {
      schemaVersion: "runner-persistent-install-evaluation-v1",
      actionId: "install-program-search",
      installCost: 1,
      creditsAfterInstall: 3,
      handAfterInstall: 3,
      installedSameDefinitionCount: 0,
      installedSameFunctionalGroupCount: 0,
      existingFunctionalCoverage: [],
      newFunctionalCoverage: [
        "non_additive_utility:program_search",
        "non_additive_utility:action_gated_search",
      ],
      capabilityDelta: "new_coverage",
      stackabilityClass: "synergy_support",
      duplicateRole: "none",
      marginalUtilityScore: 400,
      opportunityPenalty: 0,
      reservePenalty: 0,
      handBufferPenalty: 0,
      muPressurePenalty: 0,
      displacementPenalty: 0,
      finalInstallFit: 400,
      evidence: [],
    },
    evidence: [],
  };
}

function searchContext(
  deckCapabilities: DeckCapabilityProfile,
): TacticalPlanBuildContext {
  return {
    input: {
      side: "runner",
      playerView: { own: { credits: 4 } },
    } as AiDecisionInput,
    deckCapabilities,
  } as TacticalPlanBuildContext;
}

function breakerProfile(params: {
  universalInstalled: boolean;
  optionalSpecialistInDeck: boolean;
}): DeckCapabilityProfile {
  const installedLocations = params.universalInstalled
    ? (["installed"] as const)
    : (["in_deck"] as const);
  const inventory = [
    {
      cardId: "universal-breaker",
      title: "Universal Breaker",
      coverage: ["universal", "wall", "code_gate", "sentry"],
      installCost: 3,
      memoryCost: 1,
      risks: [],
      restrictions: [],
      quantityKnownInDeck: 1,
      locations: [...installedLocations],
      confidence: "high",
      evidence: [],
    },
    ...(params.optionalSpecialistInDeck
      ? [
          {
            cardId: "wall-specialist",
            title: "Wall Specialist",
            coverage: ["wall"],
            installCost: 2,
            memoryCost: 1,
            risks: [],
            restrictions: [],
            quantityKnownInDeck: 1,
            locations: ["in_deck"],
            confidence: "high",
            evidence: [],
          },
        ]
      : []),
  ];
  const coverageState = {
    inDeckKnown: true,
    inHand: false,
    installed: params.universalInstalled,
    searchableNow: true,
    drawOnly: false,
    missing: !params.universalInstalled,
    bestKnownCards: ["universal-breaker"],
    blockers: [],
  };
  return {
    schemaVersion: "deck-capability-profile-v1",
    side: "runner",
    runner: {
      breakerInventory: inventory,
      breakerCoverageMatrix: {
        wall: { coverage: "wall", ...coverageState },
        code_gate: { coverage: "code_gate", ...coverageState },
        sentry: { coverage: "sentry", ...coverageState },
        ap: { coverage: "ap", ...coverageState },
        trace: { coverage: "trace", ...coverageState },
        universal: { coverage: "universal", ...coverageState },
        subtype_limited: { coverage: "subtype_limited", ...coverageState },
        special: { coverage: "special", ...coverageState },
      },
      searchAccess: {
        tools: [],
        canSearchProgramsNow: true,
        canSearchBreakersNow: true,
        evidence: [],
      },
      economyBankTools: [],
      memoryProfile: {
        memoryUsed: 1,
        memoryLimit: 4,
        memoryAvailable: 3,
        memoryToolsKnown: 0,
        missingMemoryPressure: false,
        evidence: [],
      },
      attackPlanProfile: {
        centralPressureToolsKnown: 0,
        remoteContestToolsKnown: 0,
        setupToolsKnown: 1,
        evidence: [],
      },
    },
    missingCapabilities: [],
    confidence: "high",
    evidence: [],
  } as DeckCapabilityProfile;
}
