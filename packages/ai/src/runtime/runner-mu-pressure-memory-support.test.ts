import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

import {
  isRunnerMemorySupportCard,
  isUsefulRunnerProgramInHandForMuPressure,
  runnerMemorySupportSearchAction,
} from "./runner-mu-pressure-memory-support";

describe("runnerMemorySupportSearchAction", () => {
  it("matches memory support cards by bounded role terms", () => {
    expect(isMemorySupport(["support_memory"])).toBe(true);
    expect(isMemorySupport(["rig_memory_support"])).toBe(true);
    expect(isMemorySupport(["memoryish_noise"])).toBe(false);
    expect(isMemorySupport(["support_memoryish_noise"])).toBe(false);
  });

  it("uses structured roles and ignores label-only memory search text", () => {
    expect(
      runnerMemorySupportSearchAction(
        action({ label: "Search for a memory chip" }),
        [],
      ),
    ).toBe(false);
    expect(
      runnerMemorySupportSearchAction(
        action({ label: "Use ability" }),
        ["memory_search"],
      ),
    ).toBe(true);
    expect(
      runnerMemorySupportSearchAction(action({ label: "Use ability" }), [
        "searchlight_noise",
      ]),
    ).toBe(false);
    expect(
      runnerMemorySupportSearchAction(action({ label: "Use ability" }), [
        "memoryless_noise",
      ]),
    ).toBe(false);
  });

  it("uses structured roles for useful MU-pressure programs", () => {
    expect(usefulProgram(["search"])).toBe(true);
    expect(usefulProgram(["breaker_fracter"])).toBe(true);
    expect(usefulProgram(["searchlight_noise"])).toBe(false);
    expect(usefulProgram(["pressurewasher_noise"])).toBe(false);
  });
});

function isMemorySupport(roles: readonly string[]): boolean {
  return isRunnerMemorySupportCard(
    {
      instanceId: "support-instance",
      definitionId: "support-definition",
      title: "Support Card",
      type: "hardware",
      known: true,
    } as VisibleCard,
    roles,
    (value) => value ?? 0,
  );
}

function usefulProgram(roles: readonly string[]): boolean {
  const card: VisibleCard = {
    instanceId: "program-instance",
    definitionId: "program-definition",
    title: "Program",
    type: "program",
    known: true,
  } as VisibleCard;
  return isUsefulRunnerProgramInHandForMuPressure(
    {
      playerView: {
        own: {
          rig: [],
        },
      },
    } as unknown as AiDecisionInput,
    card,
    {
      visibleMemoryCost: () => 1,
      rolesForCardId: () => roles,
      isRunnerPressureRole: (role) => role === "run_pressure",
      isRunnerEconomyRole: (role) => role === "economy",
    },
  );
}

function action(overrides: Partial<LegalAction> = {}): LegalAction {
  return {
    actionId: "action",
    side: "runner",
    type: "trigger_ability",
    label: "Use ability",
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    ...overrides,
  };
}
