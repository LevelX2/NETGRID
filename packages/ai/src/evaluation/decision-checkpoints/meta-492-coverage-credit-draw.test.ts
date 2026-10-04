import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import type { AiRuntimeCheckpointV1 } from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

it("uses the current hybrid draw route under the original missing-Codegate Coverage parent", () => {
  const c = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-492-r1-g7-d168.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    c.input,
    c.input.ownDeckSnapshot!.deckSnapshotId,
    c.runtime,
  );
  const hybrid = c.input.legalActions.find(
    (a) =>
      a.type === "activated_card_ability" &&
      a.source.includes("silicon-saloon-franchise"),
  )!;
  expect(hybrid).toBeDefined();
  const before = JSON.stringify(c.input);
  const decision = chooseAiAction(c.input);
  expect(decision.actionId).toBe(hybrid.actionId);
  expect(JSON.stringify(c.input)).toBe(before);
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("runner.rig_and_coverage");
  expect(decision.decisionDebug?.planFirstDecision?.selectedPlan?.phase).toBe(
    "draw_for_answer",
  );
});
