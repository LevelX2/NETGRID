import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import reserveJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-access-reserve-d18.json";
import campaignJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-unrezzed-campaign-d31.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

describe("pairing 422 access value checkpoints", () => {
  it.each([
    { name: "existing reserve deficit", json: reserveJson, cost: 2 },
    { name: "unrezzed credit initialization", json: campaignJson, cost: 4 },
  ])(
    "removes the known threat without changing the access owner: $name",
    ({ json, cost }) => {
      const capture = structuredClone(json) as unknown as {
        input: AiDecisionInputWithDeckCapabilities;
        runtime: AiRuntimeCheckpointV1;
      };
      resetResidentPlanPortfolioMemory();
      restoreAiRuntimeCheckpoint(
        capture.input,
        capture.input.ownDeckSnapshot!.deckSnapshotId,
        capture.runtime,
      );
      const legalTrash = capture.input.legalActions.find(
        (action) => action.type === "trash_accessed_card",
      )!;
      expect(legalTrash.costs).toEqual([{ credits: cost }]);
      const decision = chooseAiAction(capture.input as AiDecisionInput);
      expect(decision.actionId).toBe(legalTrash.actionId);
      expect(decision.fallbackUsed).toBe(false);
      const portfolio = residentPlanPortfolioSnapshot(capture.input)!;
      expect(portfolio.executorInstanceId).toBe(
        capture.runtime.residentPlanPortfolio!.executorInstanceId,
      );
      expect(portfolio.rootForegroundInstanceId).toBe(
        capture.runtime.residentPlanPortfolio!.rootForegroundInstanceId,
      );
      expect(
        portfolio.instances.find(
          (entry) => entry.instanceId === portfolio.executorInstanceId,
        )?.moduleId,
      ).toBe("runner.convert_run_window");
      expect(
        decision.decisionDebug?.planFirstDecision?.selectedStep?.stepId,
      ).toBe(`${portfolio.executorInstanceId}:convert`);
    },
  );
});
