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

  it("uses hand pressure only after comparing the best cleanup alternative", () => {
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
    const fillers = [1, 2, 3].map((index) =>
      visibleCard(`filler-${index}`, {
        definitionId: `filler-${index}`,
        type: "event",
      }),
    );
    const input = boundInput({
      hand: [memoryChip, decoder, ...fillers],
      legalActions: [currentInstallAction("install-memory", memoryChip)],
      memoryUsed: 3,
      memoryLimit: 4,
    });
    const projection = buildRunnerRigDemandProjectionForCoverage({
      input,
      strategicIntent: strategicIntent(),
      deckCapabilities: deckCapabilities(),
      coverageGaps: [
        gap({ installActionIds: ["install-decoder"], answerInHand: true }),
      ],
      rolesForDefinitionId: roles,
    });

    const memoryEvaluation = evaluateRunnerHandDevelopment({
      input,
      strategicIntent: strategicIntent(),
      deckCapabilities: deckCapabilities(),
      rigDemandProjection: projection,
    }).find((entry) => entry.cardInstanceId === memoryChip.instanceId);

    expect(memoryEvaluation).toMatchObject({
      rigDemandBinding: { retentionValue: "required" },
      retentionCounterfactual: {
        handAtOrAboveCapacity: true,
        retentionProtected: true,
        bestKnownCleanupAlternativeCardInstanceId: "filler-1",
        installationAvoidsProtectedCleanup: false,
        installValueAdjustment: 0,
      },
    });
    expect(memoryEvaluation?.evidence).toContain(
      "runner_hand_retention_install_adjustment:0",
    );
  });

  it("values a legal protected install when it is the only way to avoid losing bound rig material", () => {
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
      legalActions: [currentInstallAction("install-memory", memoryChip)],
      memoryUsed: 3,
      memoryLimit: 4,
    });
    input.playerView.own.maxHandSize = 2;
    const projection = buildRunnerRigDemandProjectionForCoverage({
      input,
      strategicIntent: strategicIntent(),
      deckCapabilities: deckCapabilities(),
      coverageGaps: [gap({ answerInHand: true })],
      rolesForDefinitionId: roles,
    });

    expect(
      evaluateRunnerHandDevelopment({
        input,
        strategicIntent: strategicIntent(),
        deckCapabilities: deckCapabilities(),
        rigDemandProjection: projection,
      }).find((entry) => entry.cardInstanceId === memoryChip.instanceId),
    ).toMatchObject({
      rigDemandBinding: { retentionValue: "required" },
      retentionCounterfactual: {
        handAtOrAboveCapacity: true,
        retentionProtected: true,
        installationAvoidsProtectedCleanup: true,
        installValueAdjustment: 140,
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

  it("values restricted run credits only for a compatible bound breaker line", () => {
    const corolla = visibleCard("corolla", {
      definitionId: "onr_v1_124_corolla-speed-chip",
      title: "Corolla Speed Chip",
      type: "hardware",
    });
    const killer = visibleCard("killer", {
      definitionId: "test-killer",
      title: "Killer",
      type: "program",
      subtypes: ["icebreaker", "killer"],
      memoryCost: 1,
    });
    const killerInput = boundInput({
      hand: [corolla, killer],
      legalActions: [currentInstallAction("install-corolla", corolla)],
      memoryUsed: 0,
      memoryLimit: 4,
    });
    const killerProjection = buildRunnerRigDemandProjectionForCoverage({
      input: killerInput,
      strategicIntent: strategicIntent(),
      deckCapabilities: deckCapabilities({
        cardId: "test-killer",
        coverage: "sentry",
        memoryCost: 1,
      }),
      coverageGaps: [
        gap({
          gapId: "sentry",
          requiredRole: "breaker_sentry",
          answerInHand: true,
        }),
      ],
      rolesForDefinitionId: roles,
    });
    const corollaDemand = killerProjection.roleDemands.find((demand) =>
      demand.capabilityId.endsWith("using_killer_during_run"),
    );
    expect(corollaDemand).toMatchObject({
      ownerModuleId: "runner.develop_board_and_hand",
      sourceKind: "admission_checked_development",
      sourcePlanInstanceId: "plan:runner.develop_board_and_hand:card%3Acorolla",
      sourceNeedId: "sentry",
      horizon: "next_rig_milestone",
      guarantee: "forecast",
      requirement: "conditional_support",
    });
    expect(
      evaluateRunnerHandDevelopment({
        input: killerInput,
        strategicIntent: strategicIntent(),
        deckCapabilities: deckCapabilities({
          cardId: "test-killer",
          coverage: "sentry",
          memoryCost: 1,
        }),
        rigDemandProjection: killerProjection,
      }).find((entry) => entry.cardInstanceId === corolla.instanceId),
    ).toMatchObject({
      currentNeed: "useful_now",
      legalActionId: "install-corolla",
      rigDemandBinding: {
        retentionValue: "conditional",
        installReadiness: "next_milestone_legal",
      },
      persistentInstallEvaluation: { rigDemandFitScore: 240 },
    });

    const decoderInput = boundInput({
      hand: [corolla],
      legalActions: [currentInstallAction("install-corolla", corolla)],
      memoryUsed: 0,
      memoryLimit: 4,
    });
    const decoderProjection = buildRunnerRigDemandProjectionForCoverage({
      input: decoderInput,
      strategicIntent: strategicIntent(),
      deckCapabilities: deckCapabilities(),
      coverageGaps: [gap()],
      rolesForDefinitionId: roles,
    });
    expect(
      decoderProjection.roleDemands.some((demand) =>
        demand.capabilityId.startsWith("restricted_run_credit:"),
      ),
    ).toBe(false);
    expect(
      evaluateRunnerHandDevelopment({
        input: decoderInput,
        strategicIntent: strategicIntent(),
        deckCapabilities: deckCapabilities(),
        rigDemandProjection: decoderProjection,
      }).find((entry) => entry.cardInstanceId === corolla.instanceId),
    ).toMatchObject({
      currentNeed: "none",
      persistentInstallEvaluation: { rigDemandFitScore: 0 },
    });
  });

  it("binds non-noisy recurring credits only to a compatible breaker line", () => {
    const vewy = visibleCard("vewy", {
      definitionId: "onr_v1_071_vewy-vewy-quiet",
      title: "Vewy Vewy Quiet",
      type: "program",
      memoryCost: 1,
    });
    const decoder = visibleCard("decoder", {
      definitionId: "test-decoder",
      title: "Decoder",
      type: "program",
      subtypes: ["icebreaker", "decoder"],
      memoryCost: 2,
    });
    const input = boundInput({
      hand: [vewy, decoder],
      legalActions: [currentInstallAction("install-vewy", vewy)],
      memoryUsed: 0,
      memoryLimit: 4,
    });
    const compatibleProjection = buildRunnerRigDemandProjectionForCoverage({
      input,
      strategicIntent: strategicIntent(),
      deckCapabilities: deckCapabilities(),
      coverageGaps: [gap({ answerInHand: true })],
      rolesForDefinitionId: roles,
    });

    expect(
      compatibleProjection.roleDemands.find((demand) =>
        demand.capabilityId.endsWith("using_icebreaker_during_run_non_noisy"),
      ),
    ).toMatchObject({
      ownerModuleId: "runner.develop_board_and_hand",
      sourceNeedId: "code-gate",
      horizon: "next_rig_milestone",
      requirement: "conditional_support",
    });

    const noisyProjection = buildRunnerRigDemandProjectionForCoverage({
      input,
      strategicIntent: strategicIntent(),
      deckCapabilities: deckCapabilities({
        cardId: "test-decoder",
        coverage: "code_gate",
        memoryCost: 2,
        noisy: true,
      }),
      coverageGaps: [gap({ answerInHand: true })],
      rolesForDefinitionId: roles,
    });
    expect(
      noisyProjection.roleDemands.some((demand) =>
        demand.capabilityId.startsWith("restricted_run_credit:"),
      ),
    ).toBe(false);
  });

  it("includes visible additive run-credit programs in the next MU milestone", () => {
    const memoryChip = visibleCard("memory-chip", {
      definitionId: "onr_v1_146_zetatech-mem-chip",
      title: "Zetatech Mem Chip",
      type: "hardware",
      memoryLimitBonus: 2,
    });
    const supportPrograms = ["support-a", "support-b", "support-c"].map(
      (instanceId) =>
        visibleCard(instanceId, {
          definitionId: "onr_v1_071_vewy-vewy-quiet",
          title: "Vewy Vewy Quiet",
          type: "program",
          memoryCost: 1,
        }),
    );
    const input = boundInput({
      hand: [memoryChip, ...supportPrograms],
      legalActions: [currentInstallAction("install-memory", memoryChip)],
      memoryUsed: 0,
      memoryLimit: 4,
    });
    const capabilities = deckCapabilities({
      cardId: "test-decoder",
      coverage: "code_gate",
      memoryCost: 2,
      location: "in_deck",
    });
    const projection = buildRunnerRigDemandProjectionForCoverage({
      input,
      strategicIntent: strategicIntent(),
      deckCapabilities: capabilities,
      coverageGaps: [gap()],
      rolesForDefinitionId: roles,
    });

    expect(projection.memory).toMatchObject({
      memoryAvailable: 4,
      preferredAdditionalGeneralMu: 5,
    });
    expect(
      projection.roleDemands.find((demand) =>
        demand.capabilityId.startsWith("memory_capacity_general:"),
      ),
    ).toMatchObject({
      ownerModuleId: "runner.rig_and_coverage",
      sourceNeedId: "code-gate",
      requirement: "preferred_simultaneously",
    });
    expect(
      evaluateRunnerHandDevelopment({
        input,
        strategicIntent: strategicIntent(),
        deckCapabilities: capabilities,
        rigDemandProjection: projection,
      }).find((entry) => entry.cardInstanceId === memoryChip.instanceId),
    ).toMatchObject({
      currentNeed: "useful_now",
      legalActionId: "install-memory",
      rigDemandBinding: {
        retentionValue: "preferred",
        installReadiness: "next_milestone_legal",
      },
    });
  });

  it("retains restricted run credits without preempting acquisition of the breaker parent", () => {
    const vewy = visibleCard("vewy", {
      definitionId: "onr_v1_071_vewy-vewy-quiet",
      title: "Vewy Vewy Quiet",
      type: "program",
      memoryCost: 1,
    });
    const input = boundInput({
      hand: [vewy],
      legalActions: [currentInstallAction("install-vewy", vewy)],
      memoryUsed: 0,
      memoryLimit: 4,
    });
    const capabilities = deckCapabilities({
      cardId: "test-decoder",
      coverage: "code_gate",
      memoryCost: 2,
      location: "in_deck",
    });
    const projection = buildRunnerRigDemandProjectionForCoverage({
      input,
      strategicIntent: strategicIntent(),
      deckCapabilities: capabilities,
      coverageGaps: [
        gap({ directSearchActionIds: ["search-decoder"], answerInHand: false }),
      ],
      rolesForDefinitionId: roles,
    });

    expect(
      evaluateRunnerHandDevelopment({
        input,
        strategicIntent: strategicIntent(),
        deckCapabilities: capabilities,
        rigDemandProjection: projection,
      }).find((entry) => entry.cardInstanceId === vewy.instanceId),
    ).toMatchObject({
      currentNeed: "none",
      deferReason: "no_current_need",
      rigDemandBinding: {
        retentionValue: "conditional",
        installReadiness: "next_milestone_legal",
      },
    });
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

function deckCapabilities(
  breaker: {
    cardId: string;
    coverage: "code_gate" | "sentry";
    memoryCost: number;
    noisy?: boolean;
    location?: "in_hand" | "in_deck";
  } = {
    cardId: "test-decoder",
    coverage: "code_gate",
    memoryCost: 2,
  },
): DeckCapabilityProfile {
  return {
    schemaVersion: "deck-capability-profile-v1",
    side: "runner",
    runner: {
      breakerInventory: [
        {
          cardId: breaker.cardId,
          title: "Test Breaker",
          coverage: [breaker.coverage],
          breakCost: 1,
          pumpCost: 1,
          memoryCost: breaker.memoryCost,
          risks: breaker.noisy ? ["noisy"] : [],
          restrictions: [],
          quantityKnownInDeck: 1,
          locations: [breaker.location ?? "in_hand"],
          confidence: "high",
          evidence: ["test_decoder"],
        },
      ],
      breakerCoverageMatrix: {
        wall: coverageState("wall", false),
        code_gate: coverageState(
          "code_gate",
          false,
          breaker.coverage === "code_gate",
        ),
        sentry: coverageState("sentry", false, breaker.coverage === "sentry"),
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
  if (definitionId === "test-killer") return ["breaker_killer"];
  return [];
}
