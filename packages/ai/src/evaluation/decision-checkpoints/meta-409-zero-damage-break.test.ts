import { describe, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-409-zero-damage-break-d456.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

describe("meta 409 zero-damage encounter purpose", () => {
  it.each([false, true])(
    "preserves the run owner with ETR already broken=%s",
    (etrBroken) => {
      const capture = structuredClone(checkpoint);
      const input = capture.input as unknown as AiDecisionInputWithDeckCapabilities;
      const zeroBreak = input.legalActions.find(
        (a) =>
          a.type === "break_subroutine" && a.payload?.subroutineIndex === 0,
      )!;
      const etrBreak = input.legalActions.find(
        (a) =>
          a.type === "break_subroutine" && a.payload?.subroutineIndex === 1,
      )!;
      // Only the newly emitted Engine certificate enriches the exact captured
      // action. Its mechanical producer and secondary-effect boundaries are
      // covered by encounter-actions.test.ts.
      zeroBreak.payload!.breakSubroutinePurpose =
        "zero_damage_no_secondary_effect";
      let expected = etrBreak.actionId;
      if (etrBroken) {
        input.legalActions = input.legalActions.filter((a) => a !== etrBreak);
        const continuation = input.legalActions.find(
          (a) => a.type === "continue_run",
        )!;
        continuation.actionId =
          "r5.0";
        continuation.payload!.encounterWillEndRun = false;
        continuation.payload!.unbrokenSubroutineCount = 1;
        continuation.encounterSubroutineIds = ["0"];
        expected = continuation.actionId;
      }
      resetResidentPlanPortfolioMemory();
      restoreAiRuntimeCheckpoint(
        input,
        input.ownDeckSnapshot!.deckSnapshotId,
        capture.runtime as AiRuntimeCheckpointV1,
      );
      const decision = chooseAiAction(input as AiDecisionInput);
      expect(decision).toMatchObject({
        actionId: expected,
        fallbackUsed: false,
        reasonCode: "plan_first.runner.convert_run_window",
        decisionDebug: {
          planFirstDecision: {
            rootPlanInstanceId: "p1p4xezjcxov79rno40lq3f7rv",
            leafExecutorInstanceId:
              "pd3ud8dnm4rxa0w40uezulqgby",
            selectedStep: {
              planInstanceId: "pd3ud8dnm4rxa0w40uezulqgby",
            },
            route: {
              actionId: expected,
              capabilityId: "convert_active_run_window",
            },
          },
        },
      });
      expect(
        input.legalActions.find((a) => a.actionId === decision.actionId)
          ?.expiresAtStateVersion,
      ).toBe(input.playerView.stateVersion);
    },
  );
});
