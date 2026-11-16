import type { CorpScorelineWindowAssessment } from "./corp-scoreline/semantic-runtime-corp-scoreline-assessment";
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
    const dependencies = { scorelineWindowAssessment: () => scoreline() };

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
      semanticRuntimeCorpScoreNowSafetyGate(
        input(),
        action("score"),
        dependencies,
      ),
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
  it.each([
    { expiresAtStateVersion: 0 },
    { timingPoint: "corp_start.mandatory_draw" as LegalAction["timingPoint"] },
    { source: "another-agenda" },
  ])("rejects a score offer from a different context: %o", (override) => {
    expect(
      semanticRuntimeCorpScoreNowSafetyGate(
        input(),
        { ...action("score-action"), ...override },
        { scorelineWindowAssessment: () => scoreline() },
      ).allowed,
    ).toBe(false);
  });

  it("explains a blocked current path without individual blockers", () => {
    expect(
      semanticRuntimeCorpScoreNowSafetyGate(input(), action("score-action"), {
        scorelineWindowAssessment: () => scoreline(false),
      }),
    ).toMatchObject({
      allowed: false,
      evidence: expect.arrayContaining([
        "unsafe_score_unknown_higher_priority",
      ]),
    });
  });
});

function scoreline(safe = true): CorpScorelineWindowAssessment {
  return {
    windowKind: "score_now",
    terminalWindow: true,
    recommendedNextStep: "score_now",
    paths: [
      {
        actionId: "score-action",
        actionType: "score_agenda",
        actionRoles: ["score_now"],
        windowKind: "score_now",
        recommendedNextStep: "score_now",
        safe,
        blocked: !safe,
        blockers: [],
        creditsBeforeAction: 5,
        creditsAfterAction: 5,
        evidence: [],
      },
    ],
    scoreActionIds: ["score-action"],
    advanceToScoreActionIds: [],
    agendaInstallActionIds: [],
    protectedRemoteIds: ["remote_1"],
    blockedByCredits: false,
    blockedByCheapContest: false,
    blockedByRunnerContest: false,
    blockedByHqThreat: false,
    runnerAccessThreatHigh: false,
    evidence: [],
  };
}

function input(): AiDecisionInput {
  return {
    side: "corp",
    playerView: { stateVersion: 1, timingPoint: "corp_action.main" },
    legalActions: [action("score-action")],
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
