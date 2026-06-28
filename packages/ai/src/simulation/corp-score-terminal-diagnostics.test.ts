import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { createCorpScoreTerminalChosenFamily } from "./corp-score-terminal-diagnostics";

describe("createCorpScoreTerminalChosenFamily", () => {
  it("matches economy roles by bounded role terms", () => {
    const familyForRoles = (roles: string[]) =>
      createCorpScoreTerminalChosenFamily(() => roles)(
        {} as AiDecisionInput,
        action("play_operation"),
      );

    expect(familyForRoles(["economy_operation"])).toBe("economy");
    expect(familyForRoles(["microeconomy_noise"])).toBe("unknown");
  });
});

function action(type: LegalAction["type"]): LegalAction {
  return {
    actionId: "action",
    side: "corp",
    type,
    label: "Use action",
    source: "basic_action",
    timingPoint: "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
}
