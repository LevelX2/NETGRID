import { describe, expect, it } from "vitest";
import lateShellJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e553-d147-replay.json";
import unknownIceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e553-d96-replay.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type Capture = {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
};

function replay(unchecked: unknown) {
  const capture = structuredClone(unchecked) as Capture;
  const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
  if (!deckSnapshotId) throw new Error("Missing captured deck identity");
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId, capture.runtime);
  return { input: capture.input, decision: chooseAiAction(capture.input) };
}

describe("e553 human-pattern historical evidence", () => {
  it.each([lateShellJson, unknownIceJson])(
    "preserves actor-safe capture and deterministic legal plan selection at $stateVersion",
    (capture) => {
      expect(capture.provenance).toBe(
        "reconstructed_from_persisted_decision_sources",
      );
      expect(
        Object.values(capture.validation).every((value) => value === true),
      ).toBe(true);
      expect(capture.input.playerView.opponent).not.toHaveProperty("gripOrHq");
      const first = replay(capture);
      const second = replay(capture);
      expect(first.decision.actionId).toBe(second.decision.actionId);
      expect(
        first.input.legalActions.some(
          (action) => action.actionId === first.decision.actionId,
        ),
      ).toBe(true);
      expect(first.decision.fallbackUsed).toBe(false);
      expect(
        first.decision.decisionDebug?.planFirstDecision?.executionOrigin,
      ).toMatchObject({
        side: "runner",
        stateVersion: capture.stateVersion,
      });
    },
  );
});
