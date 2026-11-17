import { describe, expect, it, vi } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import { withDecisionDerivedCache } from "../decision-derived-cache";
import { createRunnerMultiRunContext } from "./runner-multi-run-context";

function runnerAction(actionId: string): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "install_card",
    label: actionId,
    source: `${actionId}-card`,
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 2,
  } as LegalAction;
}

function runnerInput(actions: LegalAction[]): AiDecisionInput {
  return {
    side: "runner",
    legalActions: actions,
    playerView: {
      own: { gripOrHq: [], rig: [], credits: 5, clicks: 4 },
      legalActions: actions,
      servers: [],
    },
  } as unknown as AiDecisionInput;
}

describe("runner decision-derived evaluations", () => {
  it("reuses a run-target evaluation by action and target only within one decision", () => {
    const action = runnerAction("multi-run");
    const input = runnerInput([action]);
    const runTargets = vi.fn(
      ({ input: scopedInput }: { input: AiDecisionInput }) =>
        [
          {
            actionId: scopedInput.legalActions[0]?.actionId,
            targetServerId: scopedInput.legalActions[0]?.payload?.serverId,
          },
        ] as unknown as RunnerRunTargetEvaluation[],
    );
    const context = createRunnerMultiRunContext({
      sourceDefinitionIdForAction: () => 288,
      targetServerId: () => undefined,
      payoffClass: () => "normal",
      canTakeRun: () => true,
      scoreValue: () => 0,
      deckCapabilitiesForInput: () => ({}),
      strategicIntentForInput: () => ({}),
      runTargets,
    });

    withDecisionDerivedCache(() => {
      expect(context.runnerMultiRunTargetEvaluation(input, action, "hq")).toBe(
        context.runnerMultiRunTargetEvaluation(input, action, "hq"),
      );
      context.runnerMultiRunTargetEvaluation(input, action, "rd");
    });
    expect(runTargets).toHaveBeenCalledTimes(2);

    withDecisionDerivedCache(() =>
      context.runnerMultiRunTargetEvaluation(input, action, "hq"),
    );
    expect(runTargets).toHaveBeenCalledTimes(3);
  });
});
