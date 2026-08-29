import { describe, expect, it } from "vitest";

import type { DeckCapabilityProfile } from "../deck-capabilities";
import { evaluateRunnerHandDevelopment } from "../runner-hand-development";
import {
  installAction,
  runnerInput,
  strategicIntent,
  visibleCard,
} from "../runner-hand-development.test-support";
import type { RunnerCoverageGapSignal } from "../plans/runner-core-plan-modules";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import {
  bindRunnerRigDemandProjectionToCoverageGaps,
  buildRunnerRigDemandProjectionForCoverage,
  runnerCoverageRigDemandInputsComplete,
} from "./runner-rig-demand-adapter";

describe("runner rig-demand coverage adapter", () => {
  it("binds an exact memory-support install to the existing coverage owner", () => {
    const memoryChip = visibleCard("memory-chip", {
      definitionId: "onr_v1_146_zetatech-mem-chip",
      title: "Zetatech Mem Chip",
      type: "hardware",
      memoryLimitBonus: 2,
    });
    const decoder = visibleCard("decoder", {
      definitionId: "test-decoder",
      title: "Decoder",
      type: "program",
      memoryCost: 2,
    });
    const input = boundInput({
      hand: [memoryChip, decoder],
      legalActions: [
        currentInstallAction("install-memory", memoryChip),
        currentInstallAction("install-decoder", decoder),
      ],
      memoryUsed: 3,
      memoryLimit: 4,
    });
    const coverageGap = gap({
      installActionIds: ["install-decoder"],
      answerInHand: true,
      priorityClass: "P2",
    });
    const projection = buildRunnerRigDemandProjectionForCoverage({
      input,
      strategicIntent: strategicIntent({ setupEngine: ["runner.rig_first"] }),
      deckCapabilities: deckCapabilities(),
      coverageGaps: [coverageGap],
      rolesForDefinitionId: roles,
    });

    expect(projection.memory).toMatchObject({
      memoryAvailable: 1,
      requiredAdditionalGeneralMu: 2,
    });
    expect(projection.roleDemands).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ownerModuleId: "runner.rig_and_coverage",
          capabilityId: "memory_capacity_general:1",
          horizon: "current_step",
          requirement: "required_simultaneously",
        }),
      ]),
    );
    expect(
      projection.cardRetentionFacts.find(
        (fact) => fact.cardInstanceId === memoryChip.instanceId,
      ),
    ).toMatchObject({
      retentionValue: "required",
      installReadiness: "current_step_legal",
    });

    const [boundGap] = bindRunnerRigDemandProjectionToCoverageGaps({
      input,
      coverageGaps: [coverageGap],
      projection,
    });
    expect(boundGap).toMatchObject({
      gapId: coverageGap.gapId,
      memorySupportActionIds: ["install-memory"],
      preparationActionIds: ["install-memory"],
    });

    const evaluation = evaluateRunnerHandDevelopment({
      input,
      strategicIntent: strategicIntent({ setupEngine: ["runner.rig_first"] }),
      deckCapabilities: deckCapabilities(),
      rigDemandProjection: projection,
    }).find((entry) => entry.cardInstanceId === memoryChip.instanceId);
    expect(evaluation).toMatchObject({
      currentNeed: "acute",
      legalActionId: "install-memory",
      rigDemandBinding: {
        retentionValue: "required",
        installReadiness: "current_step_legal",
      },
      persistentInstallEvaluation: {
        boundRigDemandIds: expect.arrayContaining([
          expect.stringMatching(/^memory-capacity:/),
        ]),
      },
    });
    expect(
      evaluation?.persistentInstallEvaluation?.rigDemandFitScore,
    ).toBeGreaterThan(0);
  });

  it("does not turn doctrine or hand pressure into unbound memory demand", () => {
    const memoryChip = visibleCard("memory-chip", {
      definitionId: "onr_v1_146_zetatech-mem-chip",
      title: "Zetatech Mem Chip",
      type: "hardware",
      memoryLimitBonus: 2,
    });
    const input = boundInput({
      hand: [
        memoryChip,
        ...[1, 2, 3, 4].map((index) =>
          visibleCard(`filler-${index}`, {
            definitionId: `filler-${index}`,
            type: "event",
          }),
        ),
      ],
      legalActions: [currentInstallAction("install-memory", memoryChip)],
      memoryUsed: 0,
      memoryLimit: 4,
    });
    const intent = strategicIntent({ setupEngine: ["runner.rig_first"] });
    const projection = buildRunnerRigDemandProjectionForCoverage({
      input,
      strategicIntent: intent,
      deckCapabilities: deckCapabilities(),
      coverageGaps: [],
      rolesForDefinitionId: roles,
    });

    expect(projection.roleDemands).toEqual([]);
    expect(
      evaluateRunnerHandDevelopment({
        input,
        strategicIntent: intent,
        deckCapabilities: deckCapabilities(),
        rigDemandProjection: projection,
      }).find((entry) => entry.cardInstanceId === memoryChip.instanceId),
    ).toMatchObject({
      currentNeed: "none",
      rigDemandBinding: {
        boundDemandIds: [],
        retentionValue: "unbound",
        installReadiness: "doctrine_only",
      },
      persistentInstallEvaluation: {
        rigDemandFitScore: 0,
        boundRigDemandIds: [],
      },
    });
  });

  it("does not project a coverage demand from an unknown MU quote", () => {
    const input = boundInput({
      hand: [],
      legalActions: [],
      memoryUsed: 0,
      memoryLimit: 4,
    });
    const incomplete = deckCapabilities();
    incomplete.runner!.breakerInventory[0] = {
      cardId: "unknown-decoder",
      title: "Unknown Decoder",
      coverage: ["code_gate"],
      breakCost: 1,
      pumpCost: 1,
      risks: [],
      restrictions: [],
      quantityKnownInDeck: 1,
      locations: ["in_deck"],
      confidence: "high",
      evidence: ["test_unknown_memory"],
    };
    const params = {
      input,
      strategicIntent: strategicIntent(),
      deckCapabilities: incomplete,
      coverageGaps: [gap()],
      rolesForDefinitionId: roles,
    };

    expect(runnerCoverageRigDemandInputsComplete(params)).toBe(false);
    expect(() => buildRunnerRigDemandProjectionForCoverage(params)).toThrow(
      "runner_rig_demand_coverage_provider_facts_incomplete",
    );
  });
});

function boundInput(params: {
  hand: ReturnType<typeof visibleCard>[];
  legalActions: ReturnType<typeof installAction>[];
  memoryUsed: number;
  memoryLimit: number;
}): AiDecisionInputWithDeckCapabilities {
  const input = runnerInput({
    credits: 10,
    hand: params.hand,
    legalActions: params.legalActions,
    memoryUsed: params.memoryUsed,
    memoryLimit: params.memoryLimit,
  }) as AiDecisionInputWithDeckCapabilities;
  input.planningStateIdentity = {
    stateVersion: input.playerView.stateVersion,
    sideSafePlanningFingerprint: "runner-rig-demand-adapter-test",
  };
  input.ownDeckSnapshot = {
    deckSnapshotId: "runner-rig-demand-adapter-deck",
    side: "runner",
    cards: params.hand.flatMap((card) =>
      card.definitionId ? [{ cardId: card.definitionId, quantity: 1 }] : [],
    ),
  };
  return input;
}

function currentInstallAction(
  actionId: string,
  card: ReturnType<typeof visibleCard>,
) {
  return {
    ...installAction(actionId, card, 0),
    expiresAtStateVersion: 1,
  };
}

function gap(
  overrides: Partial<RunnerCoverageGapSignal> = {},
): RunnerCoverageGapSignal {
  return {
    gapId: "code-gate",
    requiredRole: "breaker_code_gate",
    priorityClass: "P4",
    evidenceCode: "test_code_gate_coverage",
    deckHasAnswer: true,
    answerInHand: false,
    fundingActionIds: [],
    directSearchActionIds: [],
    searchEngineSetupActionIds: [],
    drawForAnswerActionIds: [],
    ...overrides,
  };
}

function deckCapabilities(): DeckCapabilityProfile {
  return {
    schemaVersion: "deck-capability-profile-v1",
    side: "runner",
    runner: {
      breakerInventory: [
        {
          cardId: "test-decoder",
          title: "Decoder",
          coverage: ["code_gate"],
          breakCost: 1,
          pumpCost: 1,
          memoryCost: 2,
          risks: [],
          restrictions: [],
          quantityKnownInDeck: 1,
          locations: ["in_hand"],
          confidence: "high",
          evidence: ["test_decoder"],
        },
      ],
      breakerCoverageMatrix: {
        wall: coverageState("wall", false),
        code_gate: coverageState("code_gate", false, true),
        sentry: coverageState("sentry", false),
        ap: coverageState("ap", false),
        trace: coverageState("trace", false),
        universal: coverageState("universal", false),
        subtype_limited: coverageState("subtype_limited", false),
        special: coverageState("special", false),
      },
      searchAccess: {
        tools: [],
        canSearchProgramsNow: false,
        canSearchBreakersNow: false,
        evidence: [],
      },
      economyBankTools: [],
      memoryProfile: {
        memoryUsed: 3,
        memoryLimit: 4,
        memoryAvailable: 1,
        memoryToolsKnown: 1,
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
    evidence: ["test_rig_demand_adapter"],
  } as DeckCapabilityProfile;
}

function coverageState(coverage: string, installed: boolean, inHand = false) {
  return {
    coverage,
    inDeckKnown: inHand,
    inHand,
    installed,
    searchableNow: false,
    drawOnly: false,
    missing: !installed,
    bestKnownCards: [],
    blockers: [],
  };
}

function roles(definitionId: string): readonly string[] {
  if (definitionId === "onr_v1_146_zetatech-mem-chip") {
    return ["memory", "memory_support"];
  }
  if (definitionId === "test-decoder") return ["breaker_code_gate"];
  return [];
}
