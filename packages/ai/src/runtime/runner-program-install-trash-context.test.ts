import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { createRunnerProgramInstallTrashContext } from "./runner-program-install-trash-context";

describe("selectedRunnerMemoryCheckpointTrashOptionIds", () => {
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
