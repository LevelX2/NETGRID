import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
it("preserves the current financing threshold in original R6 G13 D83 under its defense parent", () => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-492-r6-g13-d83.json",
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
    cp.input,
    cp.input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  expect(cp.input.playerView.own.credits).toBe(5);
  expect(cp.input.playerView.own.clicks).toBe(2);
  const account = cp.input.legalActions.find(
      (a) =>
        a.type === "play_operation" && a.source.includes("accounts-receivable"),
    )!,
    before = JSON.stringify(cp.input),
    decision = chooseAiAction(cp.input);
  expect(decision.actionId).toBe(account.actionId);
  expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    "plan:corp.defend_servers:server-defense-portfolio",
  );
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("corp.economy");
  expect(decision.fallbackUsed).toBe(false);
  expect(JSON.stringify(cp.input)).toBe(before);
});
