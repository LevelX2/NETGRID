import type {
  CardDefinition,
  CardInstanceId,
  ChoiceRequest,
  GameState,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { validateRunnerMemoryCheckpointChoiceState } from "./runner-memory-checkpoint";

describe("runner memory checkpoint choice state", () => {
  it("accepts only the canonical, current, resolvable candidate set", () => {
    const state = checkpointState();
    const host = checkpointHost(state);

    expect(validateRunnerMemoryCheckpointChoiceState(host)).toBe(true);

    for (const mutate of [
      (choice: ChoiceRequest) => {
        choice.source = "runner.checkpoint_memory_cleanup:99:5";
      },
      (choice: ChoiceRequest) => {
        choice.source = "runner.checkpoint_memory_cleanup:2:4";
      },
      (choice: ChoiceRequest) => {
        choice.stateVersion = 4;
      },
      (choice: ChoiceRequest) => {
        choice.options = choice.options.slice(1);
        choice.maxSelections = choice.options.length;
      },
      (choice: ChoiceRequest) => {
        choice.options[0] = {
          ...choice.options[0]!,
          value: "program_zero_mu",
        };
      },
    ]) {
      const corrupted = structuredClone(state);
      mutate(corrupted.pendingChoice!);
      const before = structuredClone(corrupted);
      expect(
        validateRunnerMemoryCheckpointChoiceState(checkpointHost(corrupted)),
      ).toBe(false);
      expect(corrupted).toEqual(before);
    }
  });

  it("rejects choices whose candidates cannot release the current deficit", () => {
    const state = checkpointState();
    state.cardInstances.program_two_mu!.installedAsRunnerProgram!.memoryCost = 1;

    expect(
      validateRunnerMemoryCheckpointChoiceState(checkpointHost(state)),
    ).toBe(false);
  });
});

function checkpointState(): GameState {
  const programId = "program_two_mu" as CardInstanceId;
  const zeroMuId = "program_zero_mu" as CardInstanceId;
  return {
    stateVersion: 5,
    runner: {
      memoryUsed: 3,
      rig: { programs: [programId, zeroMuId], hardware: [], resources: [] },
    },
    cardInstances: {
      [programId]: {
        instanceId: programId,
        definitionId: "program_two_mu",
        installedAsRunnerProgram: { memoryCost: 2 },
      },
      [zeroMuId]: {
        instanceId: zeroMuId,
        definitionId: "program_zero_mu",
        installedAsRunnerProgram: { memoryCost: 0 },
      },
    },
    pendingChoice: {
      choiceId: "runner_memory_checkpoint_5",
      side: "runner",
      source: "runner.checkpoint_memory_cleanup:2:5",
      prompt: "Programme für das MU-Limit trashen",
      kind: "select_cards",
      options: [
        {
          id: `card_${programId}`,
          label: "Program Two MU",
          value: programId,
        },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: 5,
      visibility: "hidden_info_barrier",
    },
  } as unknown as GameState;
}

function checkpointHost(state: GameState) {
  return {
    state,
    runnerMemoryLimit: () => 1,
    runnerProgramUsesMemory: (cardId: CardInstanceId) =>
      cardId !== ("program_zero_mu" as CardInstanceId),
    definitionFor: (cardId: CardInstanceId) =>
      ({
        id: state.cardInstances[cardId]!.definitionId,
        title:
          cardId === ("program_two_mu" as CardInstanceId)
            ? "Program Two MU"
            : "Program Zero MU",
        type: "program",
        memoryCost:
          state.cardInstances[cardId]!.installedAsRunnerProgram?.memoryCost ??
          0,
      }) as CardDefinition,
  };
}
