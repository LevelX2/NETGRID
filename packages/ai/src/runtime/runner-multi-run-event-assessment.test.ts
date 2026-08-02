import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { runnerMultiRunEventAssessment } from "./runner-multi-run-event-assessment";

function action(payload: Record<string, string | number | boolean>): LegalAction {
  return {
    actionId: "multi-run-action",
    side: "runner",
    stateVersion: 1,
    timingPoint: "runner_action.main",
    type: "play_event",
    label: "Make two runs",
    source: "event-card",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    payload,
  } as unknown as LegalAction;
}

const input = { side: "runner" } as AiDecisionInput;
const dependencies = {
  sourceDefinitionIdForAction: () => "capability_source",
  targetServerId: () => "rd",
  targetEvaluation: () => undefined,
  payoffClass: () => "unknown_probe",
  canTakeRun: () => true,
  scoreValue: () => 25,
};

describe("generic multi-run event assessment", () => {
  it("recognizes the exact action-bound optional follow-up run capability", () => {
    const assessment = runnerMultiRunEventAssessment(
      input,
      action({
        serverId: "rd",
        runnerEventRun: true,
        followupRunOnEnd: "optional",
      }),
      dependencies,
    );

    expect(assessment).toMatchObject({
      sourceDefinitionId: "capability_source",
      targetServerId: "rd",
      phase: "first_run",
      canTakeRun: true,
    });
  });

  it("fails closed for a normal run event without the follow-up fact", () => {
    expect(
      runnerMultiRunEventAssessment(
        input,
        action({ serverId: "rd", runnerEventRun: true }),
        dependencies,
      ),
    ).toBeUndefined();
  });
});
