import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);
it("does not demote a real HQ access route to the physical Archives information tier", () => {
  const fixture = JSON.parse(
    readFileSync(
      new URL(
        "./fixtures/deep662-d270-effective-access-priority.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const cp = fixture.checkpoint;
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input: AiDecisionInputWithDeckCapabilities = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const route = input.legalActions.find(
    (a) =>
      a.type === "activated_card_ability" && a.actionId.includes("shredder"),
  )!;
  const before = JSON.stringify({
    view: input.playerView,
    legal: input.legalActions,
  });
  const decision = chooseAiAction(input);
  const plan = decision.decisionDebug!.planFirstDecision!;
  const head = plan.turnPlanning!.heads.find(
    (h) => h.actionId === route.actionId,
  )!;
  expect(head.rootPlanInstanceId).toBe(
    "plan:runner.pressure_central:central%3Aarchives",
  );
  expect(head).toMatchObject({
    assessment: { effectivePriorityClass: "P4" },
  });
  expect(plan.route!.stateVersion).toBe(269);
  expect(input.legalActions.some((a) => a.actionId === decision.actionId)).toBe(
    true,
  );
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  expect(
    JSON.stringify({ view: input.playerView, legal: input.legalActions }),
  ).toBe(before);
});
