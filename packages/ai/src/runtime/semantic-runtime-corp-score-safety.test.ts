import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  normalizedTerminalOutcomeValue,
  semanticRuntimeCorpScoreNowSafetyGate,
} from "./semantic-runtime-corp-score-safety";

describe("semanticRuntimeCorpScoreNowSafetyGate", () => {
  it("normalizes terminal outcome values into the scoring consumer scale", () => {
    expect(normalizedTerminalOutcomeValue(100)).toBe(100);
    expect(normalizedTerminalOutcomeValue(-100)).toBe(-100);
    expect(normalizedTerminalOutcomeValue(150)).toBe(100);
    expect(normalizedTerminalOutcomeValue(-150)).toBe(-100);
  });

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
      evidence: expect.arrayContaining([
        "terminal_outcome_allowed:true",
        "terminal_outcome_raw_value:100",
        "terminal_outcome_normalized_value:100",
      ]),
    });
    expect(
      semanticRuntimeCorpScoreNowSafetyGate(input(), action("score"), dependencies),
    ).toMatchObject({
      allowed: false,
      evidence: expect.arrayContaining([
        "unsafe_score_unknown_higher_priority",
        "terminal_outcome_allowed:false",
        "terminal_outcome_raw_value:-100",
        "terminal_outcome_normalized_value:-100",
      ]),
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
