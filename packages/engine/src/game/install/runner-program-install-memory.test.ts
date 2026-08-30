import { describe, expect, it } from "vitest";
import type { CardInstanceId } from "@netgrid/shared";
import {
  buildRunnerProgramInstallMemoryChoice,
  parseRunnerProgramInstallMemoryContinuation,
  resolveRunnerProgramInstallMemoryTrashSelection,
  runnerProgramInstallMemoryDeficit,
  runnerProgramInstallMemoryReachable,
} from "./runner-program-install-memory";

const first = "installed_program_1" as CardInstanceId;
const second = "installed_program_2" as CardInstanceId;
const target = "target_program" as CardInstanceId;

describe("runner program install memory", () => {
  it("calculates current, automatic and selectable MU correctly", () => {
    expect(
      runnerProgramInstallMemoryDeficit({
        memoryUsed: 4,
        targetMemoryCost: 2,
        memoryLimit: 4,
      }),
    ).toBe(2);
    expect(
      runnerProgramInstallMemoryDeficit({
        memoryUsed: 4,
        targetMemoryCost: 2,
        memoryLimit: 4,
        automaticFreedMemory: 1,
      }),
    ).toBe(1);
    expect(
      runnerProgramInstallMemoryReachable({
        memoryUsed: 4,
        targetMemoryCost: 3,
        memoryLimit: 4,
        automaticFreedMemory: 1,
        trashableMemoryCosts: [1, 1],
      }),
    ).toBe(true);
    expect(
      runnerProgramInstallMemoryReachable({
        memoryUsed: 4,
        targetMemoryCost: 4,
        memoryLimit: 4,
        trashableMemoryCosts: [1, 1],
      }),
    ).toBe(false);
  });

  it("round-trips an opaque continuation and validates enough selected MU", () => {
    const originalChoiceSource =
      "p3_38.stack_or_trash_program_install:source:definition:stack:9";
    const choice = buildRunnerProgramInstallMemoryChoice({
      stateVersion: 7,
      kind: "hidden_search",
      targetCardId: target,
      originalChoiceId: "original_choice_7",
      originalChoiceSource,
      automaticFreedMemory: 1,
      options: [
        { id: `card_${first}`, label: "First", value: first },
        { id: `card_${second}`, label: "Second", value: second },
      ],
    });
    expect(parseRunnerProgramInstallMemoryContinuation(choice.source)).toEqual({
      kind: "hidden_search",
      targetCardId: target,
      originalChoiceId: "original_choice_7",
      originalChoiceSource,
      automaticFreedMemory: 1,
    });
    expect(
      resolveRunnerProgramInstallMemoryTrashSelection({
        choice,
        selectedOptionIds: [`card_${first}`],
        installedProgramIds: [first, second],
        memoryUsed: 4,
        targetMemoryCost: 2,
        memoryLimit: 4,
        memoryCostFor: () => 1,
        usesMemory: () => true,
      }),
    ).toMatchObject({ trashCardIds: [first], freedMemory: 1 });
  });

  it("rejects stale and insufficient MU selections", () => {
    const choice = buildRunnerProgramInstallMemoryChoice({
      stateVersion: 3,
      kind: "nonsearch",
      targetCardId: target,
      originalChoiceId: "original_choice_3",
      originalChoiceSource:
        "card_implementation.pro018_stack_install_run_cleanup",
      options: [
        { id: `card_${first}`, label: "First", value: first },
        { id: `card_${second}`, label: "Second", value: second },
      ],
    });
    const base = {
      choice,
      installedProgramIds: [first, second],
      memoryUsed: 4,
      targetMemoryCost: 2,
      memoryLimit: 4,
      memoryCostFor: () => 1,
      usesMemory: () => true,
    };
    expect(() =>
      resolveRunnerProgramInstallMemoryTrashSelection({
        ...base,
        selectedOptionIds: ["card_missing"],
      }),
    ).toThrow("ungültige Option");
    expect(() =>
      resolveRunnerProgramInstallMemoryTrashSelection({
        ...base,
        selectedOptionIds: [`card_${first}`],
      }),
    ).toThrow("nicht genug MU");
  });
});
