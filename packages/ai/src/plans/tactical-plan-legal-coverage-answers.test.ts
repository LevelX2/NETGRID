import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction, PlayerView } from "@netgrid/shared";

import { bestLegalCoverageAnswerRole } from "./tactical-plan-legal-coverage-answers";

describe("bestLegalCoverageAnswerRole", () => {
  it("uses structured recovery targets and ignores label-only recovery text", () => {
    expect(
      bestLegalCoverageAnswerRole(
        input([
          action({
            actionId: "label-only-recovery",
            label: "Junkyard BBS recovery from heap",
          }),
        ]),
        "breaker_wall",
      ),
    ).toBeUndefined();

    expect(
      bestLegalCoverageAnswerRole(
        input([
          action({
            actionId: "structured-recovery",
            label: "Use ability",
            payload: { targetCardDefinitionId: "onr_v1_021_dwarf" },
          }),
        ]),
        "breaker_wall",
      ),
    ).toBe("recovery_answer");
  });
});

function input(legalActions: LegalAction[]): AiDecisionInput {
  const playerView = {
    side: "runner",
    own: { rig: [], gripOrHq: [], heapOrArchives: [], scoreArea: [] },
    servers: [],
  } as unknown as PlayerView;
  return {
    side: "runner",
    legalActions,
    playerView,
  } as unknown as AiDecisionInput;
}

function action(overrides: Partial<LegalAction>): LegalAction {
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
