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
  [zeroRemote, "plan:runner.contest_remote:remote%3Aremote_1", "run_205"],
  [zeroCentral, "plan:runner.pressure_central:central%3Ard", "run_532"],
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
          leafExecutorInstanceId: `plan:runner.convert_run_window:run%3A${run}`,
          selectedStep: {
            planInstanceId: `plan:runner.convert_run_window:run%3A${run}`,
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
        rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
        leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_170",
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
  expect(decision.actionId).toBe("runner.continue_run.subroutine_end_run");
});
