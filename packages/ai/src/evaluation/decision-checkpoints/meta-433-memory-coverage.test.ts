import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-433-g1-d208.json";
import boundChoice from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-433-g1-d209.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { visibleBreakerRoles } from "../../runtime/runner-visible-breaker-coverage";
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

it("SP-366 distinguishes canonical Wall and Code-Gate functions before binding the MU sacrifice", () => {
  const input = fixture(checkpoint);
  const rig = input.playerView.own.rig!;
  expect(
    visibleBreakerRoles(
      rig.find((x) => x.definitionId === "onr_proteus_095_skeleton-passkeys")!,
    ),
  ).toEqual(["decoder"]);
  const action = input.legalActions.find((x) => x.type === "install_card")!;
  const decision = chooseAiAction(input);
  expect(decision).toMatchObject({
    actionId: action.actionId,
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId:
          "plan:runner.rig_and_coverage:coverage%3Abreaker_sentry",
        leafExecutorInstanceId:
          "plan:runner.rig_and_coverage:coverage%3Abreaker_sentry",
        route: {
          actionId: action.actionId,
          stateVersion: input.playerView.stateVersion,
        },
      },
    },
  });
  expect(
    residentPlanPortfolioSnapshot(input)?.selectedActionOrigin,
  ).toMatchObject({
    selectedActionId: action.actionId,
    selectedAtStateVersion: input.playerView.stateVersion,
    requiredMemoryToFree: 1,
    selectedCards: [
      {
        cardInstanceId: "runner_onr_proteus_100_wrecking-ball_1",
        memoryCost: 1,
      },
    ],
  });
});

it("does not reopen an already bound historical memory choice", () => {
  const input = fixture(boundChoice);
  expect(chooseAiAction(input)).toMatchObject({
    actionId: "runner.resolve_choice",
    fallbackUsed: false,
    selectedChoices: {
      selectedOptionIds: ["card_runner_onr_proteus_095_skeleton-passkeys_2"],
    },
  });
});
