import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-g31-d470.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it("continues the installed matchpoint agenda within its last viable draw horizon", () => {
  const { input, runtime } = structuredClone(checkpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  expect(input.playerView.own.stackOrRdCount).toBe(1);
  expect(input.playerView.own.credits).toBe(5);
  expect(input.playerView.own.clicks).toBe(2);
  const action = input.legalActions.find((a) => a.type === "advance_card")!;
  expect(chooseAiAction(input)).toMatchObject({
    actionId: action.actionId,
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        selectedPlan: { moduleId: "corp.score_agenda" },
        route: {
          actionId: action.actionId,
          stateVersion: input.playerView.stateVersion,
        },
      },
    },
  });
});

it.each(["open_deadline", "not_winning"])(
  "does not preserve survival priority without the current %s proof",
  (boundary) => {
    const { input, runtime } = structuredClone(checkpoint) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    if (boundary === "open_deadline") input.playerView.own.stackOrRdCount = 20;
    else input.playerView.own.agendaPoints = 0;
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const result = chooseAiAction(input);
    const selected = result.decisionDebug?.planFirstDecision;
    expect(result.fallbackUsed).toBe(false);
    expect(
      selected?.selectedPlan?.moduleId === "corp.score_agenda" &&
        selected.priority?.effectiveClass === "P2",
    ).toBe(false);
  },
);
