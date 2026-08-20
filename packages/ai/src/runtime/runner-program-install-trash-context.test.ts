import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { createRunnerProgramInstallTrashContext } from "./runner-program-install-trash-context";

describe("selectedRunnerMemoryCheckpointTrashOptionIds", () => {
  it("fails closed when a program-trash install cannot name an acceptable sufficient sacrifice", () => {
    const codeGate = program("only_code_gate", 1);
    const sentry = program("only_sentry", 1);
    const barrier = program("only_barrier", 1);
    const krash = program("krash", 1);
    const rig = [codeGate, sentry, barrier];
    const cardsById = new Map(rig.map((card) => [card.instanceId, card]));
    const breakerRoleById = new Map([
      [codeGate.instanceId, "decoder"],
      [sentry.instanceId, "killer"],
      [barrier.instanceId, "fracter"],
    ]);
    const context = createRunnerProgramInstallTrashContext({
      safeNonNegativeInteger: (value) => Math.max(0, value ?? 0),
      visibleMemoryCost: (card) => card?.memoryCost ?? 0,
      visibleCardsByInstanceId: () => cardsById,
      visibleBreakerRoleCounts: () =>
        new Map([
          ["decoder", 1],
          ["killer", 1],
          ["fracter", 1],
        ]),
      visibleBreakerRoles: (card) => {
        const role = breakerRoleById.get(card.instanceId);
        return role ? [role] : [];
      },
      rolesForCardId: () => [],
      isRunnerPressureRole: () => false,
      isRunnerEconomyRole: () => false,
      visibleCounterValue: () => 0,
      visibleInstallCost: () => 0,
    });
    const input = {
      side: "runner",
      seed: "program-trash-no-acceptable-sacrifice",
      decisionId: "program-trash-no-acceptable-sacrifice:2",
      profileId: "runner-baseline",
      legalActions: [],
      playerView: {
        stateVersion: 2,
        timingPoint: "runner_action.main",
        own: {
          credits: 0,
          gripOrHq: [krash],
          rig,
          memoryUsed: 3,
          memoryLimit: 3,
        },
        opponent: { credits: 0 },
        servers: [],
      },
    } as unknown as AiDecisionInput;
    const options = rig.map((card) => ({
      id: `card_${card.instanceId}`,
      label: card.title ?? card.instanceId,
      value: card.instanceId,
    }));

    expect(
      context.runnerProgramInstallTrashAssessmentForAction(input, {
        actionId:
          "runner.install_card.krash.krash.runner_program_trash_before_install.installer.0.0",
        side: "runner",
        type: "install_card",
        source: {
          kind: "card",
          sourceCardInstanceId: "krash",
          sourceDefinitionId: "krash",
        },
        timingPoint: "runner_action.main",
        costs: [],
        targetRequirements: [],
        visibility: "public",
        expiresAtStateVersion: 2,
        payload: {
          cardId: "krash",
        },
      } as never),
    ).toMatchObject({
      memoryRequired: true,
      requiredMemoryToFree: 1,
      canFreeRequiredMemory: false,
    });

    expect(() =>
      context.selectedRunnerProgramInstallTrashOptionIds(
        input,
        {
          source: "runner_program_trash_before_install:krash:2",
        } as never,
        options,
      ),
    ).toThrowError("commitment_invalidated");
  });

  it("trashes only the least valuable sufficient program at an MU checkpoint", () => {
    const expendable = program("expendable", 1);
    const onlyFracter = program("only_fracter", 1);
    const rig = [expendable, onlyFracter];
    const cardsById = new Map(rig.map((card) => [card.instanceId, card]));
    const context = createRunnerProgramInstallTrashContext({
      safeNonNegativeInteger: (value) => Math.max(0, value ?? 0),
      visibleMemoryCost: (card) =>
        (card as (VisibleCard & { memoryCost?: number }) | undefined)
          ?.memoryCost ?? 0,
      visibleCardsByInstanceId: () => cardsById,
      visibleBreakerRoleCounts: () => new Map([["fracter", 1]]),
      visibleBreakerRoles: (card) =>
        card.instanceId === "only_fracter" ? ["fracter"] : [],
      rolesForCardId: () => [],
      isRunnerPressureRole: () => false,
      isRunnerEconomyRole: () => false,
      visibleCounterValue: () => 0,
      visibleInstallCost: () => 0,
    });

    expect(
      context.selectedRunnerMemoryCheckpointTrashOptionIds(
        {
          side: "runner",
          seed: "memory-checkpoint-test",
          decisionId: "memory-checkpoint-test:318",
          profileId: "runner-baseline",
          playerView: {
            own: {
              credits: 0,
              gripOrHq: [],
              rig,
              memoryUsed: 5,
              memoryLimit: 4,
            },
            opponent: { credits: 0 },
            servers: [],
          },
        } as unknown as AiDecisionInput,
        [
          {
            id: "trash_expendable",
            label: "Expendable",
            value: "expendable",
          },
          {
            id: "trash_only_fracter",
            label: "Only Fracter",
            value: "only_fracter",
          },
        ],
      ),
    ).toEqual(["trash_expendable"]);
  });

  it("uses the prepared Shell Traders target to calculate the exact MU replacement", () => {
    const expendable = program("expendable", 1);
    const onlyFracter = program("only_fracter", 1);
    const prepared = program("prepared_killer", 1);
    const rig = [expendable, onlyFracter];
    const cardsById = new Map(rig.map((card) => [card.instanceId, card]));
    const context = createRunnerProgramInstallTrashContext({
      safeNonNegativeInteger: (value) => Math.max(0, value ?? 0),
      visibleMemoryCost: (card) => card?.memoryCost ?? 0,
      visibleCardsByInstanceId: () => cardsById,
      visibleBreakerRoleCounts: () => new Map([["breaker_fracter", 1]]),
      visibleBreakerRoles: (card) =>
        card.instanceId === "only_fracter" ? ["breaker_fracter"] : [],
      rolesForCardId: (definitionId) =>
        definitionId === "only_fracter" ? ["breaker_fracter"] : [],
      isRunnerPressureRole: () => false,
      isRunnerEconomyRole: () => false,
      visibleCounterValue: () => 0,
      visibleInstallCost: () => 0,
    });
    const input = {
      side: "runner",
      playerView: {
        own: {
          credits: 0,
          gripOrHq: [],
          rig,
          memoryUsed: 2,
          memoryLimit: 2,
        },
        opponent: { credits: 0 },
        servers: [],
        specialZones: {
          setAside: [prepared],
          setAsideCount: 1,
          removedFromGame: [],
          removedFromGameCount: 0,
        },
      },
    } as unknown as AiDecisionInput;
    const options = [
      { id: "trash_expendable", label: "Expendable", value: "expendable" },
      {
        id: "trash_only_fracter",
        label: "Only Fracter",
        value: "only_fracter",
      },
    ];

    expect(
      context.selectedRunnerProgramInstallTrashOptionIds(
        input,
        {
          source:
            "v1912.delayed_install_memory:shell-1:prepared_killer:paid:17",
        } as never,
        options,
      ),
    ).toEqual(["trash_expendable"]);
  });

  it("completes an accessed-agenda MU continuation with the minimal forced sacrifice", () => {
    const codecracker = program("codecracker", 1);
    const corrosion = program("corrosion", 1);
    const loonyGoon = program("loony_goon", 1);
    const rig = [codecracker, corrosion, loonyGoon];
    const cardsById = new Map(rig.map((card) => [card.instanceId, card]));
    const context = createRunnerProgramInstallTrashContext({
      safeNonNegativeInteger: (value) => Math.max(0, value ?? 0),
      visibleMemoryCost: (card) => card?.memoryCost ?? 0,
      visibleCardsByInstanceId: () => cardsById,
      visibleBreakerRoleCounts: () =>
        new Map([
          ["breaker_codecracker", 1],
          ["breaker_corrosion", 1],
          ["breaker_loony_goon", 1],
        ]),
      visibleBreakerRoles: (card) => [`breaker_${card.instanceId}`],
      rolesForCardId: () => [],
      isRunnerPressureRole: () => false,
      isRunnerEconomyRole: () => false,
      visibleCounterValue: () => 0,
      visibleInstallCost: () => 0,
    });
    const input = {
      side: "runner",
      playerView: {
        own: {
          credits: 0,
          gripOrHq: [],
          rig,
          memoryUsed: 3,
          memoryLimit: 4,
        },
        opponent: { credits: 0 },
        servers: [],
      },
    } as unknown as AiDecisionInput;
    const options = rig.map((card) => ({
      id: `card_${card.instanceId}`,
      label: card.title ?? card.instanceId,
      value: card.instanceId,
    }));

    expect(
      context.selectedRunnerProgramInstallTrashOptionIds(
        input,
        {
          source:
            "runner.program_install_memory:access:theorem_proof:0:runner.steal_agenda.theorem_proof.theorem_proof:access.agenda_install_as_runner_program%3Atheorem_proof%3A2",
        } as never,
        options,
      ),
    ).toHaveLength(1);
  });
});

function program(instanceId: string, memoryCost: number): VisibleCard {
  return {
    instanceId,
    definitionId: instanceId,
    title: instanceId,
    type: "program",
    known: true,
    memoryCost,
  } as VisibleCard;
}
