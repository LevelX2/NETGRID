import { planInstanceIdForProposal } from "../../plans/plan-instance";
import { expect, it } from "vitest";
import zeroRemote from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-433-g8-d206.json";
import zeroCentral from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-433-g9-d535.json";
import subtype from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-433-g40-d171.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { isImmediateSafetyThreatSubroutine } from "../../runtime/encounter-subroutine";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function fixture(capture: unknown) {
  const { input, runtime } = structuredClone(capture) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  return input;
}

it.each([
  [zeroRemote, "p1p4xezjcxov79rno40lq3f7rv", "205"],
  [zeroCentral, "pa90fufw9vc5bkshp96ztlryxl", "532"],
] as const)(
  "retains the paid ETR route beside certified zero Core damage",
  (capture, root, run) => {
    const input = fixture(capture);
    const action = input.legalActions.find(
      (a) => a.type === "break_subroutine" && a.payload?.subroutineIndex === 1,
    )!;
    expect(chooseAiAction(input)).toMatchObject({
      actionId: action.actionId,
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId: root,
          leafExecutorInstanceId: planInstanceIdForProposal({ moduleId: "runner.convert_run_window", dedupeKey: `run:${run}` }),
          selectedStep: {
            planInstanceId: planInstanceIdForProposal({ moduleId: "runner.convert_run_window", dedupeKey: `run:${run}` }),
          },
          route: {
            actionId: action.actionId,
            stateVersion: input.playerView.stateVersion,
          },
        },
      },
    });
  },
);

it.each([undefined, 1, 2])(
  "preserves immediate safety for unknown or positive Core damage %s",
  (amount) => {
    expect(
      isImmediateSafetyThreatSubroutine({
        id: "damage",
        type: "do_damage",
        damageType: "core",
        ...(amount === undefined ? {} : { amount }),
      }),
    ).toBe(true);
  },
);

it("configures a breaker using its available run credit without changing ownership", () => {
  const input = fixture(subtype);
  expect(input.playerView.own.credits).toBe(0);
  expect(input.playerView.run?.badPublicityCredits).toBe(1);
  const action = input.legalActions.find(
    (a) =>
      a.type === "trigger_ability" && a.payload?.selectedSubtype === "sentry",
  )!;
  expect(action).toBeDefined();
  expect(chooseAiAction(input)).toMatchObject({
    actionId: action.actionId,
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId: "pa7nez1ioecg7mf06q1uwqq57o",
        leafExecutorInstanceId: "p9nq3th84rzczoifkpb1su8kxw",
        route: {
          actionId: action.actionId,
          stateVersion: input.playerView.stateVersion,
        },
      },
    },
  });
});

it("does not promise a paid subtype continuation when the run pool is empty", () => {
  const input = fixture(subtype);
  input.playerView.run!.badPublicityCredits = 0;
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe("r5.0");
});
