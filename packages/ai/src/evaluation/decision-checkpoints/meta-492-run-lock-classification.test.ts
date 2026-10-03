import { expect, it } from "vitest";
import capture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-492-r1-g39-d171.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import type { AiRuntimeCheckpointV1 } from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

it("classifies a native paid run-lock release whose exact central parent is currently deferred", () => {
  const c = structuredClone(capture) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    c.input,
    c.input.ownDeckSnapshot!.deckSnapshotId,
    c.runtime,
  );
  const before = JSON.stringify(c.input);
  const decision = chooseAiAction(c.input);
  expect(
    c.input.legalActions.some((a) => a.actionId === decision.actionId),
  ).toBe(true);
  expect(JSON.stringify(c.input)).toBe(before);
  expect(
    decision.decisionDebug?.planFirstDecision?.turnPlanning?.coverage?.status,
  ).toBe("pass");
});
