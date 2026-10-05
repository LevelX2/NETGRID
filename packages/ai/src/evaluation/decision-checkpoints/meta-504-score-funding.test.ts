import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

afterEach(() => resetResidentPlanPortfolioMemory());
it("executes the exact bound funding provider before the currently unfunded urgent Score head", () => {
  const capture = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-504-g29-score-funding.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(capture.validation).every((v) => v === true)).toBe(true);
  const input = capture.input as AiDecisionInputWithDeckCapabilities;
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    capture.runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe("corp.gain_credit");
  expect(
    input.legalActions.find((a) => a.actionId === decision.actionId)?.type,
  ).toBe("gain_credit");
  expect(decision.fallbackUsed).toBe(false);
  const debug = decision.decisionDebug!.planFirstDecision!;
  expect(debug.selectedPlan?.moduleId).toBe("corp.economy");
  expect(debug.selectedPlan?.parentNeedId).toBe(
    "score-support:agenda:corp_onr_v1_212_priority-requisition_1:remote_1",
  );
  const serialized = JSON.stringify(debug.turnPlanning);
  expect(serialized).toContain('"family":"fund_setup"');
  expect(serialized).not.toContain('"family":"pure_rush"');
  expect(serialized).not.toContain('"semanticActionType":"install.card"');
});
