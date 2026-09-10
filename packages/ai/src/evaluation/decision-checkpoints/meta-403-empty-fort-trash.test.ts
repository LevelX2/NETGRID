import { describe, expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-empty-fort-trash-d358.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

describe("meta 403 post-success fort sabotage", () => {
  it.each([0, 1, "missing", "stale"] as const)(
    "binds the development route to the Engine quote: %s",
    (count) => {
      const capture = structuredClone(checkpointJson) as unknown as {
        input: AiDecisionInputWithDeckCapabilities;
        runtime: AiRuntimeCheckpointV1;
      };
      const action = capture.input.legalActions.find(
        (entry) =>
          entry.abilityRef?.sourceAbilityId ===
          "onr_proteus_121_remote-detonator:on_play_trash_last_run_fort_ice_add_tags",
      )!;
      expect(action).toBeDefined();
      if (count !== "missing") {
        action.payload = {
          ...action.payload,
          runnerFortIceTrashQuoteSchemaVersion:
            "runner-fort-ice-trash-quote-v1",
          runnerFortIceTrashQuoteStateVersion:
            capture.input.playerView.stateVersion - (count === "stale" ? 1 : 0),
          runnerFortIceTrashServerId: "archives",
          runnerFortIceTrashRezzedIceCount:
            typeof count === "number" ? count : 1,
          runnerFortIceTrashTagsAdded: 3,
        };
        const dto = buildAiDecisionInputDto(capture.input);
        expect(
          dto.legalActions.find((entry) => entry.actionId === action.actionId)
            ?.payload,
        ).toMatchObject(action.payload);
      }
      resetResidentPlanPortfolioMemory();
      restoreAiRuntimeCheckpoint(
        capture.input,
        capture.input.ownDeckSnapshot!.deckSnapshotId,
        capture.runtime,
      );
      const decision = chooseAiAction(capture.input);
      expect(decision.fallbackUsed).toBe(false);
      expect(
        capture.input.legalActions.some(
          (entry) => entry.actionId === decision.actionId,
        ),
      ).toBe(true);
      if (count === 1) {
        expect(decision.actionId).toBe(action.actionId);
        expect(
          decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
        ).toBe("runner.develop_board_and_hand");
      } else {
        expect(decision.actionId).not.toBe(action.actionId);
        expect(decision.decisionDebug?.planFirstDecision?.dispositions).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              actionId: action.actionId,
              ownerModuleId: "runner.develop_board_and_hand",
              disposition: "explicitly_nonproductive",
            }),
          ]),
        );
      }
    },
  );
});
