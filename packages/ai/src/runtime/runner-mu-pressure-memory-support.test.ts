import { describe, expect, it } from "vitest";
import type { LegalAction } from "@netgrid/shared";

import { runnerMemorySupportSearchAction } from "./runner-mu-pressure-memory-support";

describe("runnerMemorySupportSearchAction", () => {
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
  });
});

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
