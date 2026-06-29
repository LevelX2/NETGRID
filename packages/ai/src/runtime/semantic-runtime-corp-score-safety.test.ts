import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { semanticRuntimeCorpScoreNowSafetyGate } from "./semantic-runtime-corp-score-safety";

describe("semanticRuntimeCorpScoreNowSafetyGate", () => {
  it("allows score-now only for exact legal score action ids", () => {
    const dependencies = {
      scoreTerminalWindow: () => ({
        terminalWindow: true,
        scoreActionIds: ["score-action"],
        runnerAccessThreatHigh: false,
        protectedRemoteIds: ["remote_1"],
      }),
    };

    expect(
      semanticRuntimeCorpScoreNowSafetyGate(
        input(),
        action("score-action"),
        dependencies,
      ),
    ).toMatchObject({
      allowed: true,
    });
    expect(
      semanticRuntimeCorpScoreNowSafetyGate(input(), action("score"), dependencies),
    ).toMatchObject({
      allowed: false,
      evidence: ["unsafe_score_unknown_higher_priority"],
    });
  });
});

function input(): AiDecisionInput {
  return {
    side: "corp",
  } as AiDecisionInput;
}

function action(actionId: string): LegalAction {
  return {
    actionId,
    side: "corp",
    type: "score_agenda",
    label: "Score agenda",
    source: "agenda",
    timingPoint: "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
}
