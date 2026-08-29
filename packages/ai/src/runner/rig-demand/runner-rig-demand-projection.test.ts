import { describe, expect, it } from "vitest";

import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  installAction,
  runnerInput,
  strategicIntent,
  visibleCard,
} from "../../runner-hand-development.test-support";
import {
  buildRunnerRigDemandProjection,
  redactedRunnerRigDemandProjectionFacts,
  RunnerRigDemandProjectionError,
  type RunnerRigRoleDemandInput,
} from "./runner-rig-demand-projection";

describe("RunnerRigDemandProjection", () => {
  it("binds simultaneous concrete coverage demand to current side-safe state", () => {
    const decoder = visibleCard("decoder-hand", {
      definitionId: "test-decoder",
      title: "Decoder",
      type: "program",
      memoryCost: 2,
    });
    const killer = visibleCard("killer-hand", {
      definitionId: "test-killer",
      title: "Killer",
      type: "program",
      memoryCost: 1,
    });
    const input = projectionInput({
      hand: [decoder, killer],
      legalActions: [
        currentInstallAction("install-decoder", decoder),
        currentInstallAction("install-killer", killer),
      ],
      memoryUsed: 0,
      memoryLimit: 4,
    });
    const demands = [
      demand(input, {
        demandId: "coverage:code-gate:rd",
        capabilityId: "breaker_code_gate",
        requirement: "required_simultaneously",
        provider: {
          providerId: "decoder-provider",
          definitionId: "test-decoder",
          memoryUnits: 2,
        },
      }),
      demand(input, {
        demandId: "coverage:sentry:rd",
        capabilityId: "breaker_sentry",
        requirement: "required_simultaneously",
        provider: {
          providerId: "killer-provider",
          definitionId: "test-killer",
          memoryUnits: 1,
        },
      }),
    ];

    const projection = buildRunnerRigDemandProjection({ input, demands });

    expect(projection).toMatchObject({
      side: "runner",
      stateVersion: 1,
      sideSafePlanningFingerprint: "runner-fingerprint-1",
      memory: {
        memoryUsed: 0,
        memoryLimit: 4,
        requiredAdditionalGeneralMu: 3,
        requiredMemoryLimit: 3,
        requiredDemandIds: ["coverage:code-gate:rd", "coverage:sentry:rd"],
      },
    });
    expect(projection.cardRetentionFacts).toEqual([
      expect.objectContaining({
        cardInstanceId: "decoder-hand",
        boundDemandIds: ["coverage:code-gate:rd"],
        retentionValue: "required",
        installReadiness: "next_milestone_legal",
      }),
      expect.objectContaining({
        cardInstanceId: "killer-hand",
        boundDemandIds: ["coverage:sentry:rd"],
        retentionValue: "required",
        installReadiness: "next_milestone_legal",
      }),
    ]);
    expect(JSON.stringify(projection)).not.toMatch(
      /selectedActionId|executorInstanceId|cardDisposition/,
    );
  });

  it("keeps doctrine and a full hand informational without inventing rig demand", () => {
    const memoryChip = visibleCard("memory-chip-hand", {
      definitionId: "test-memory-chip",
      title: "Memory Chip",
      type: "hardware",
      memoryLimitBonus: 2,
    });
    const input = projectionInput({
      hand: [
        memoryChip,
        ...[1, 2, 3, 4].map((index) =>
          visibleCard(`filler-${index}`, {
            definitionId: `filler-definition-${index}`,
            type: "event",
          }),
        ),
      ],
      legalActions: [currentInstallAction("install-memory", memoryChip)],
      memoryUsed: 0,
      memoryLimit: 4,
    });

    const projection = buildRunnerRigDemandProjection({
      input,
      strategicIntent: strategicIntent({ setupEngine: ["runner.rig_first"] }),
    });

    expect(projection.roleDemands).toEqual([]);
    expect(projection.memory.requiredAdditionalGeneralMu).toBe(0);
    expect(
      projection.cardRetentionFacts.find(
        (fact) => fact.cardInstanceId === memoryChip.instanceId,
      ),
    ).toMatchObject({
      boundDemandIds: [],
      retentionValue: "unbound",
      installReadiness: "doctrine_only",
    });
  });

  it("separates hosted demand from general MU demand", () => {
    const hostedBreaker = visibleCard("hosted-breaker", {
      definitionId: "test-hosted-breaker",
      type: "program",
      memoryCost: 2,
    });
    const input = projectionInput({
      hand: [hostedBreaker],
      legalActions: [],
      memoryUsed: 3,
      memoryLimit: 4,
    });
    const hostedDemand = demand(input, {
      demandId: "coverage:hosted-wall",
      capabilityId: "breaker_wall",
      requirement: "required_simultaneously",
      provider: {
        providerId: "hosted-wall-provider",
        definitionId: "test-hosted-breaker",
        memoryMode: "hosted",
        memoryUnits: 2,
      },
    });

    const projection = buildRunnerRigDemandProjection({
      input,
      demands: [hostedDemand],
    });

    expect(projection.memory).toMatchObject({
      requiredAdditionalGeneralMu: 0,
      requiredMemoryLimit: 3,
      hostedDemandIds: ["coverage:hosted-wall"],
    });
    expect(projection.cardRetentionFacts[0]).toMatchObject({
      retentionValue: "required",
      installReadiness: "retention_only",
    });
  });

  it("fails closed for missing or stale planning bindings", () => {
    const plain = runnerInput({
      credits: 5,
      hand: [],
      legalActions: [],
      memoryUsed: 0,
      memoryLimit: 4,
    }) as AiDecisionInputWithDeckCapabilities;
    expect(() => buildRunnerRigDemandProjection({ input: plain })).toThrow(
      expect.objectContaining<Partial<RunnerRigDemandProjectionError>>({
        code: "planning_identity_missing",
      }),
    );

    const input = projectionInput({
      hand: [],
      legalActions: [],
      memoryUsed: 0,
      memoryLimit: 4,
    });
    const current = demand(input, {
      demandId: "coverage:stale",
      capabilityId: "breaker_wall",
      requirement: "required_simultaneously",
      provider: {
        providerId: "stale-provider",
        definitionId: "test-stale",
        memoryUnits: 1,
      },
    });
    const stale: RunnerRigRoleDemandInput = {
      ...current,
      binding: {
        ...current.binding,
        stateVersion: current.binding.stateVersion - 1,
      },
    };
    expect(() =>
      buildRunnerRigDemandProjection({ input, demands: [stale] }),
    ).toThrow(
      expect.objectContaining<Partial<RunnerRigDemandProjectionError>>({
        code: "demand_binding_stale",
      }),
    );

    input.playerView.stateVersion += 1;
    expect(() => buildRunnerRigDemandProjection({ input })).toThrow(
      expect.objectContaining<Partial<RunnerRigDemandProjectionError>>({
        code: "planning_identity_stale",
      }),
    );
  });

  it("is invariant under opponent hidden-zone differences outside the side-safe input", () => {
    const program = visibleCard("decoder-hand", {
      definitionId: "test-decoder",
      type: "program",
      memoryCost: 2,
    });
    const left = projectionInput({
      hand: [program],
      legalActions: [],
      memoryUsed: 1,
      memoryLimit: 4,
    });
    const right = projectionInput({
      hand: [program],
      legalActions: [],
      memoryUsed: 1,
      memoryLimit: 4,
    });
    (
      left as AiDecisionInputWithDeckCapabilities & {
        testOnlyOpponentHiddenZone: string[];
      }
    ).testOnlyOpponentHiddenZone = ["hidden-agenda-a", "hidden-operation-a"];
    (
      right as AiDecisionInputWithDeckCapabilities & {
        testOnlyOpponentHiddenZone: string[];
      }
    ).testOnlyOpponentHiddenZone = ["hidden-agenda-b", "hidden-operation-b"];

    const leftProjection = buildRunnerRigDemandProjection({
      input: left,
      demands: [
        demand(left, {
          demandId: "coverage:code-gate",
          capabilityId: "breaker_code_gate",
          requirement: "required_simultaneously",
          provider: {
            providerId: "decoder",
            definitionId: "test-decoder",
            memoryUnits: 2,
          },
        }),
      ],
    });
    const rightProjection = buildRunnerRigDemandProjection({
      input: right,
      demands: [
        demand(right, {
          demandId: "coverage:code-gate",
          capabilityId: "breaker_code_gate",
          requirement: "required_simultaneously",
          provider: {
            providerId: "decoder",
            definitionId: "test-decoder",
            memoryUnits: 2,
          },
        }),
      ],
    });

    expect(leftProjection).toEqual(rightProjection);
    expect(JSON.stringify(leftProjection)).not.toMatch(
      /hidden-agenda|hidden-operation/,
    );
  });

  it("is deterministic and exposes only aggregate redacted facts", () => {
    const program = visibleCard("program-hand", {
      definitionId: "test-program",
      type: "program",
      memoryCost: 1,
    });
    const input = projectionInput({
      hand: [program],
      legalActions: [],
      memoryUsed: 1,
      memoryLimit: 4,
    });
    const first = demand(input, {
      demandId: "z-demand",
      capabilityId: "breaker_sentry",
      requirement: "preferred_simultaneously",
      provider: {
        providerId: "z-provider",
        definitionId: "test-program",
        memoryUnits: 1,
      },
    });
    const second = demand(input, {
      demandId: "a-demand",
      capabilityId: "breaker_wall",
      requirement: "alternative_provider",
      provider: {
        providerId: "a-provider",
        definitionId: "test-program",
        memoryUnits: 1,
      },
    });

    const left = buildRunnerRigDemandProjection({
      input,
      demands: [first, second],
    });
    const right = buildRunnerRigDemandProjection({
      input,
      demands: [second, first],
    });

    expect(left).toEqual(right);
    expect(left.roleDemands.map((entry) => entry.demandId)).toEqual([
      "a-demand",
      "z-demand",
    ]);
    expect(
      redactedRunnerRigDemandProjectionFacts(left).join("|"),
    ).not.toContain(program.instanceId);
  });
});

function projectionInput(params: {
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
    sideSafePlanningFingerprint: "runner-fingerprint-1",
  };
  input.ownDeckSnapshot = {
    deckSnapshotId: "runner-rig-demand-test-deck",
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

function demand(
  input: AiDecisionInputWithDeckCapabilities,
  params: {
    demandId: string;
    capabilityId: string;
    requirement: RunnerRigRoleDemandInput["requirement"];
    provider: {
      providerId: string;
      definitionId: string;
      memoryMode?: "general" | "hosted";
      memoryUnits: number;
    };
  },
): RunnerRigRoleDemandInput {
  return {
    demandId: params.demandId,
    ownerModuleId: "runner.rig_and_coverage",
    sourceKind: "resident_plan_need",
    sourcePlanInstanceId: `plan:runner.rig_and_coverage:${params.demandId}`,
    sourceNeedId: params.demandId,
    capabilityId: params.capabilityId,
    horizon: "next_rig_milestone",
    guarantee: "bound_plan",
    requirement: params.requirement,
    simultaneousSetId: "next-rig",
    providers: [
      {
        providerId: params.provider.providerId,
        definitionId: params.provider.definitionId,
        memoryMode: params.provider.memoryMode ?? "general",
        memoryUnits: params.provider.memoryUnits,
        knownRemainingInStack: 1,
        evidenceCodes: ["test_provider"],
      },
    ],
    binding: {
      stateVersion: input.playerView.stateVersion,
      sideSafePlanningFingerprint:
        input.planningStateIdentity!.sideSafePlanningFingerprint,
    },
    evidenceCodes: ["test_demand"],
  };
}
